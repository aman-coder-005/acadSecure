"""
main.py — AcadSecure FastAPI Application Entry Point
=====================================================
Bootstraps the API server, registers all routers, configures CORS,
and exposes endpoints for each module as they are built.

Endpoints active:
  Module 1 — POST /upload, GET|DELETE /documents/{id}
  Module 2 — POST /preprocess, POST /preprocess/{doc_id}
  Module 3 — POST /similarity/{doc_id}
  Module 4 — POST /ai-detect
  Module 5 — POST /collusion

Endpoints coming soon:
  POST /score        (Module 6)
  POST /blockchain   (Module 7)
"""

from __future__ import annotations

import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from extraction import extract_text_from_upload
from preprocessing import preprocess_text, preprocess_batch
from similarity import check_similarity
from ai_detection import detect_ai_content
from collusion import detect_collusion

# ── Logging setup ──────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger("acadSecure.main")

# ── In-memory document store (replaced by MongoDB in Module 3) ─────────────
# Structure: { doc_id: { filename, text, char_count, word_count, uploaded_at } }
_DOCUMENT_STORE: dict[str, dict[str, Any]] = {}


# ── Lifespan (startup / shutdown hooks) ───────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀  AcadSecure API starting up…")
    # Future modules will initialise DB connections, ML models, etc. here
    yield
    logger.info("🛑  AcadSecure API shutting down…")


# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(
    title="AcadSecure API",
    description=(
        "AI-powered Academic Integrity & Collusion Detection System "
        "with Blockchain-backed verification."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS — allow the React dev server (localhost:5173 / 3000) ──────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Response models ────────────────────────────────────────────────────────

class SingleDocumentResult(BaseModel):
    doc_id: str = Field(..., description="Unique identifier for this document")
    filename: str
    extension: str
    char_count: int
    word_count: int
    text_preview: str = Field(..., description="First 300 characters of extracted text")
    uploaded_at: str = Field(..., description="ISO-8601 UTC timestamp")
    status: str = "success"


class UploadResponse(BaseModel):
    total_uploaded: int
    successful: int
    failed: int
    results: list[SingleDocumentResult]
    errors: list[dict[str, str]]
    message: str


class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str
    documents_in_store: int


# ── Module 2 — Preprocessing models ───────────────────────────────────────

class PreprocessRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw text to preprocess.")


class PreprocessResponse(BaseModel):
    sentences: list[str] = Field(..., description="List of detected sentences.")
    tokens: list[str] = Field(..., description="Final cleaned + lemmatised tokens.")
    clean_text: str = Field(..., description="Tokens joined as a single string (TF-IDF ready).")
    original_length: int
    processed_length: int
    sentence_count: int
    token_count: int
    filtered_token_count: int
    stopwords_removed: int


# ── Module 3 — Similarity models ──────────────────────────────────────────

class MatchDetail(BaseModel):
    source_sentence: str
    target_sentence: str
    score: float

class DocumentSimilarityMatch(BaseModel):
    doc_id: str
    filename: str
    submitter: str
    overall_similarity: float
    tfidf_similarity: float
    semantic_similarity: float
    matching_sentences: list[MatchDetail]

class SimilarityResponse(BaseModel):
    max_similarity: float
    matches: list[DocumentSimilarityMatch]
    message: str


# ── Module 4 — AI Detection models ────────────────────────────────────────

class AIDetectRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw text to analyze.")

class AIDetectResponse(BaseModel):
    ai_probability: float = Field(..., description="Percentage likelihood text is AI generated.")
    human_probability: float = Field(..., description="Percentage likelihood text is human generated.")


# ── Module 5 — Collusion models ───────────────────────────────────────────

class CollusionNode(BaseModel):
    id: str
    label: str
    group: int

class CollusionLink(BaseModel):
    source: str
    target: str
    value: float

class CollusionCluster(BaseModel):
    cluster_id: int
    members: list[str]

class CollusionResponse(BaseModel):
    nodes: list[CollusionNode]
    links: list[CollusionLink]
    clusters: list[CollusionCluster]
    message: str


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    return {"message": "AcadSecure API is running. Visit /docs for the interactive API."}


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Liveness check — confirms the API is running and reports basic stats.
    """
    return HealthResponse(
        status="healthy",
        version=app.version,
        timestamp=datetime.now(timezone.utc).isoformat(),
        documents_in_store=len(_DOCUMENT_STORE),
    )


@app.post(
    "/upload",
    response_model=UploadResponse,
    tags=["Module 1 — File Extraction"],
    summary="Upload documents and extract text",
    description=(
        "Accept one or more PDF / DOCX / TXT files, extract their raw text, "
        "persist them in the document store, and return extraction metadata. "
        "Maximum file size per document: 20 MB."
    ),
    status_code=200,
)
async def upload_documents(
    files: list[UploadFile] = File(
        ...,
        description="One or more documents to upload. Supported: .pdf, .docx, .txt",
    ),
    submitter: str = Form(
        default="anonymous",
        description="Name or student ID of the submitter (optional).",
    ),
):
    """
    **POST /upload**

    Upload one or more academic documents. The endpoint:

    1. Validates each file's type and size.
    2. Extracts raw text (PDF → PyMuPDF, DOCX → python-docx, TXT → UTF-8/Latin-1).
    3. Stores the document in the in-memory store (MongoDB in Module 3).
    4. Returns metadata + a 300-char text preview per document.

    Partial success is supported: if some files fail, they are reported in
    `errors` while successful ones are in `results`.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files were provided.")

    results: list[SingleDocumentResult] = []
    errors: list[dict[str, str]] = []
    now_utc = datetime.now(timezone.utc).isoformat()

    for upload_file in files:
        try:
            extracted = await extract_text_from_upload(upload_file)

            doc_id = str(uuid.uuid4())
            record = {
                "doc_id": doc_id,
                "filename": extracted["filename"],
                "extension": extracted["extension"],
                "text": extracted["text"],
                "char_count": extracted["char_count"],
                "word_count": extracted["word_count"],
                "submitter": submitter,
                "uploaded_at": now_utc,
            }
            _DOCUMENT_STORE[doc_id] = record

            results.append(
                SingleDocumentResult(
                    doc_id=doc_id,
                    filename=extracted["filename"],
                    extension=extracted["extension"],
                    char_count=extracted["char_count"],
                    word_count=extracted["word_count"],
                    text_preview=extracted["text"][:300],
                    uploaded_at=now_utc,
                )
            )
            logger.info("Stored document doc_id=%s  file='%s'", doc_id, extracted["filename"])

        except HTTPException as exc:
            fname = getattr(upload_file, "filename", "unknown")
            logger.warning("Extraction failed for '%s': %s", fname, exc.detail)
            errors.append({"filename": fname or "unknown", "error": exc.detail})

        except Exception as exc:
            fname = getattr(upload_file, "filename", "unknown")
            logger.exception("Unexpected failure for '%s'", fname)
            errors.append({"filename": fname or "unknown", "error": str(exc)})

    total = len(files)
    successful = len(results)
    failed = len(errors)

    if successful == 0:
        # All uploads failed — return 422 so the caller knows nothing was stored
        return JSONResponse(
            status_code=422,
            content=UploadResponse(
                total_uploaded=total,
                successful=0,
                failed=failed,
                results=[],
                errors=errors,
                message="All uploads failed. Check the 'errors' field for details.",
            ).model_dump(),
        )

    message = (
        f"Successfully processed {successful}/{total} document(s)."
        if failed == 0
        else f"Processed {successful}/{total} document(s); {failed} failed — see 'errors'."
    )

    return UploadResponse(
        total_uploaded=total,
        successful=successful,
        failed=failed,
        results=results,
        errors=errors,
        message=message,
    )


@app.get(
    "/documents",
    tags=["Module 1 — File Extraction"],
    summary="List all stored documents",
    description="Returns metadata for every document currently held in the store.",
)
async def list_documents():
    """
    Returns a summary of all documents stored in memory.
    (Will be backed by MongoDB from Module 3 onwards.)
    """
    summaries = [
        {
            "doc_id": rec["doc_id"],
            "filename": rec["filename"],
            "extension": rec["extension"],
            "word_count": rec["word_count"],
            "submitter": rec["submitter"],
            "uploaded_at": rec["uploaded_at"],
        }
        for rec in _DOCUMENT_STORE.values()
    ]
    return {"total": len(summaries), "documents": summaries}


@app.get(
    "/documents/{doc_id}",
    tags=["Module 1 — File Extraction"],
    summary="Retrieve a stored document",
    description="Returns the full extracted text and metadata for a given document ID.",
)
async def get_document(doc_id: str):
    """
    Fetch a single document by its UUID.
    Raises 404 if the document does not exist.
    """
    record = _DOCUMENT_STORE.get(doc_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
    return record


@app.delete(
    "/documents/{doc_id}",
    tags=["Module 1 — File Extraction"],
    summary="Delete a stored document",
)
async def delete_document(doc_id: str):
    """
    Remove a document from the store by its UUID.
    Raises 404 if the document does not exist.
    """
    if doc_id not in _DOCUMENT_STORE:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
    del _DOCUMENT_STORE[doc_id]
    logger.info("Deleted document doc_id=%s", doc_id)
    return {"message": f"Document '{doc_id}' deleted successfully."}


# ── Module 2 — Preprocessing endpoints ───────────────────────────────────

@app.post(
    "/preprocess",
    response_model=PreprocessResponse,
    tags=["Module 2 — Text Preprocessing"],
    summary="Preprocess raw text",
    description=(
        "Run the full NLP preprocessing pipeline on arbitrary raw text. "
        "Returns cleaned tokens, lemmatised forms, sentence list, and stats. "
        "Use this to pre-inspect text before submission."
    ),
)
async def preprocess_raw_text(request: PreprocessRequest):
    """
    **POST /preprocess**

    Accepts a JSON body `{ "text": "..." }` and runs the full pipeline:
    Unicode normalisation → sentence split → tokenise → lowercase →
    punctuation removal → stopword removal → spaCy lemmatisation.

    Returns tokens and stats useful for all downstream ML modules.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Provided text is empty after stripping whitespace.")

    try:
        result = preprocess_text(request.text)
    except Exception as exc:
        logger.exception("Preprocessing failed for inline text")
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {exc}") from exc

    return PreprocessResponse(**result)


@app.post(
    "/preprocess/{doc_id}",
    response_model=PreprocessResponse,
    tags=["Module 2 — Text Preprocessing"],
    summary="Preprocess a stored document by ID",
    description=(
        "Look up an already-uploaded document by its UUID, run the full "
        "preprocessing pipeline on its extracted text, cache the result "
        "inside the document store, and return the pipeline output."
    ),
)
async def preprocess_document(doc_id: str):
    """
    **POST /preprocess/{doc_id}**

    Retrieve a previously uploaded document from the store, preprocess it,
    and attach the result to the stored record under the key `preprocessing`.
    Subsequent calls return the cached result without reprocessing.
    """
    record = _DOCUMENT_STORE.get(doc_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")

    # Return cached preprocessing if already done
    if "preprocessing" in record:
        logger.info("Returning cached preprocessing for doc_id=%s", doc_id)
        return PreprocessResponse(**record["preprocessing"])

    raw_text: str = record.get("text", "")
    if not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail=f"Document '{doc_id}' has no extractable text to preprocess.",
        )

    try:
        result = preprocess_text(raw_text)
    except Exception as exc:
        logger.exception("Preprocessing failed for doc_id=%s", doc_id)
        raise HTTPException(status_code=500, detail=f"Preprocessing error: {exc}") from exc

    # Cache in store so similarity/collusion modules can reuse it
    record["preprocessing"] = result
    logger.info(
        "Preprocessed doc_id=%s → %d tokens, %d sentences",
        doc_id, result["filtered_token_count"], result["sentence_count"],
    )

    return PreprocessResponse(**result)


# ── Module 3 — Similarity endpoints ────────────────────────────────────────

@app.post(
    "/similarity/{doc_id}",
    response_model=SimilarityResponse,
    tags=["Module 3 — Semantic Similarity"],
    summary="Compare a document against all stored submissions",
    description=(
        "Compute TF-IDF and Sentence-Transformer similarity between a "
        "preprocessed document and all other documents in the store."
    ),
)
async def get_document_similarity(doc_id: str):
    """
    **POST /similarity/{doc_id}**
    """
    # 1. Retrieve the source document
    source_record = _DOCUMENT_STORE.get(doc_id)
    if not source_record:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
        
    if "preprocessing" not in source_record:
        raise HTTPException(
            status_code=400, 
            detail=f"Document '{doc_id}' must be preprocessed first (POST /preprocess/{doc_id})."
        )
        
    # 2. Gather all other preprocessed documents
    stored_docs = [
        rec for rec in _DOCUMENT_STORE.values()
        if rec["doc_id"] != doc_id and "preprocessing" in rec
    ]
    
    # 3. Compute similarity
    try:
        report = check_similarity(source_record, stored_docs)
    except Exception as exc:
        logger.exception("Similarity computation failed")
        raise HTTPException(status_code=500, detail=f"Similarity error: {exc}") from exc
        
    # 4. Cache report in store
    source_record["similarity_report"] = report
    
    return SimilarityResponse(**report)


# ── Module 4 — AI Detection endpoints ──────────────────────────────────────

@app.post(
    "/ai-detect",
    response_model=AIDetectResponse,
    tags=["Module 4 — AI Detection"],
    summary="Detect AI-generated text",
    description=(
        "Analyzes text using a Logistic Regression classifier trained on "
        "TF-IDF features to predict if it was written by an AI or a Human."
    ),
)
async def ai_detect_text(request: AIDetectRequest):
    """
    **POST /ai-detect**
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    try:
        result = detect_ai_content(request.text)
        return AIDetectResponse(**result)
    except Exception as exc:
        logger.exception("AI detection failed")
        raise HTTPException(status_code=500, detail=f"AI Detection error: {exc}") from exc


# ── Module 5 — Collusion endpoints ─────────────────────────────────────────

@app.post(
    "/collusion",
    response_model=CollusionResponse,
    tags=["Module 5 — Collusion Detection"],
    summary="Detect collusion among all stored documents",
    description=(
        "Builds a pairwise cosine similarity matrix for all preprocessed documents "
        "and uses DBSCAN clustering to find collusion rings. Returns a node/link "
        "structure for graph visualization."
    ),
)
async def analyze_collusion(threshold: float = 0.75):
    """
    **POST /collusion**
    """
    # Only use preprocessed documents
    stored_docs = [rec for rec in _DOCUMENT_STORE.values() if "preprocessing" in rec]
    
    if len(stored_docs) < 2:
        return CollusionResponse(
            nodes=[{"id": d["doc_id"], "label": d.get("submitter", d["filename"]), "group": -1} for d in stored_docs],
            links=[],
            clusters=[],
            message="Need at least 2 preprocessed documents to run collusion detection."
        )
        
    try:
        result = detect_collusion(stored_docs, threshold=threshold)
        return CollusionResponse(**result)
    except Exception as exc:
        logger.exception("Collusion detection failed")
        raise HTTPException(status_code=500, detail=f"Collusion detection error: {exc}") from exc


# ── Application entry point (run directly with `python main.py`) ───────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

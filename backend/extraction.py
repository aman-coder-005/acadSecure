"""
extraction.py — Module 1: File Upload & Text Extraction
=========================================================
Responsible for accepting PDF, DOCX, and TXT files and
returning their raw text content for downstream processing.

Supported formats:
  • PDF  → PyMuPDF (fitz)
  • DOCX → python-docx
  • TXT  → plain UTF-8 read (with latin-1 fallback)
"""

from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF
from docx import Document as DocxDocument
from fastapi import HTTPException, UploadFile

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SUPPORTED_EXTENSIONS: set[str] = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024  # 20 MB hard limit


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _extract_from_pdf(file_bytes: bytes) -> str:
    """
    Extract all text from a PDF byte stream using PyMuPDF.

    Each page's text is joined with a newline; blank pages are skipped.
    Raises RuntimeError on a corrupt / unreadable PDF.
    """
    try:
        pdf_stream = io.BytesIO(file_bytes)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")

        pages_text: list[str] = []
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            text = page.get_text("text")  # plain text layout
            if text.strip():
                pages_text.append(text)

        doc.close()

        if not pages_text:
            raise ValueError("PDF appears to be empty or contains only images/scans.")

        return "\n".join(pages_text)

    except fitz.FileDataError as exc:
        raise RuntimeError(f"Corrupt or unreadable PDF: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"PDF extraction failed: {exc}") from exc


def _extract_from_docx(file_bytes: bytes) -> str:
    """
    Extract all paragraph text from a DOCX byte stream using python-docx.

    Tables are also traversed so tabular content is not lost.
    Raises RuntimeError on a corrupt / unreadable DOCX.
    """
    try:
        docx_stream = io.BytesIO(file_bytes)
        doc = DocxDocument(docx_stream)

        text_parts: list[str] = []

        # Body paragraphs
        for para in doc.paragraphs:
            stripped = para.text.strip()
            if stripped:
                text_parts.append(stripped)

        # Tables (each cell as a line)
        for table in doc.tables:
            for row in table.rows:
                row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_texts:
                    text_parts.append(" | ".join(row_texts))

        if not text_parts:
            raise ValueError("DOCX appears to contain no readable text.")

        return "\n".join(text_parts)

    except Exception as exc:
        raise RuntimeError(f"DOCX extraction failed: {exc}") from exc


def _extract_from_txt(file_bytes: bytes) -> str:
    """
    Decode a plain-text byte stream.

    Attempts UTF-8 first, falls back to latin-1 to handle legacy encodings.
    Raises RuntimeError if the file cannot be decoded.
    """
    for encoding in ("utf-8", "latin-1"):
        try:
            return file_bytes.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise RuntimeError(
        "TXT file could not be decoded as UTF-8 or Latin-1. "
        "Please convert the file to UTF-8 before uploading."
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_file_extension(filename: Optional[str]) -> str:
    """
    Return the lower-cased extension of *filename* (e.g. '.pdf').
    Raises HTTPException 400 if filename is missing or has no extension.
    """
    if not filename:
        raise HTTPException(status_code=400, detail="Uploaded file has no name.")
    ext = Path(filename).suffix.lower()
    if not ext:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot determine file type for '{filename}'. "
                   "Please include a proper file extension.",
        )
    return ext


def validate_file(filename: Optional[str], file_size: Optional[int] = None) -> str:
    """
    Validate filename extension and optional size.

    Returns the lower-cased extension on success.
    Raises HTTPException 400 / 413 on validation failure.
    """
    ext = get_file_extension(filename)

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Accepted types: {', '.join(sorted(SUPPORTED_EXTENSIONS))}."
            ),
        )

    if file_size is not None and file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"File size ({file_size / (1024 * 1024):.1f} MB) exceeds the "
                f"{MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB limit."
            ),
        )

    return ext


async def extract_text_from_upload(upload_file: UploadFile) -> dict:
    """
    Read an UploadFile, validate it, and extract its raw text content.

    Parameters
    ----------
    upload_file : UploadFile
        The file received from FastAPI's multipart form handler.

    Returns
    -------
    dict with keys:
        filename   (str)  – original filename
        extension  (str)  – lower-cased extension (.pdf / .docx / .txt)
        text       (str)  – extracted raw text
        char_count (int)  – character count of extracted text
        word_count (int)  – approximate word count

    Raises
    ------
    HTTPException  – on validation or extraction failure.
    """
    filename = upload_file.filename

    # Read all bytes first so we can check size before processing
    try:
        file_bytes: bytes = await upload_file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to read uploaded file: {exc}",
        ) from exc

    ext = validate_file(filename, file_size=len(file_bytes))

    logger.info("Extracting text from '%s' (%d bytes, type=%s)", filename, len(file_bytes), ext)

    # ── Dispatch to the correct extractor ──────────────────────────────────
    try:
        if ext == ".pdf":
            raw_text = _extract_from_pdf(file_bytes)
        elif ext == ".docx":
            raw_text = _extract_from_docx(file_bytes)
        elif ext == ".txt":
            raw_text = _extract_from_txt(file_bytes)
        else:
            # Should never reach here after validate_file, but be safe
            raise HTTPException(status_code=400, detail=f"Unhandled extension: {ext}")
    except HTTPException:
        raise
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected error during extraction for '%s'", filename)
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected extraction error: {exc}",
        ) from exc

    # ── Compute basic stats ────────────────────────────────────────────────
    char_count = len(raw_text)
    word_count = len(raw_text.split())

    logger.info(
        "Extraction complete: '%s' → %d chars, %d words",
        filename, char_count, word_count,
    )

    return {
        "filename": filename,
        "extension": ext,
        "text": raw_text,
        "char_count": char_count,
        "word_count": word_count,
    }

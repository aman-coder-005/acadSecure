"""
similarity.py — Module 3: Semantic Similarity Detection
========================================================
Implements similarity comparison to detect both baseline plagiarism (exact
matches) and semantic paraphrasing.

Key approaches:
  1. TF-IDF + Cosine Similarity: Fast, whole-document comparison for
     identifying exact matches and high overlap.
  2. Sentence Transformers (all-MiniLM-L6-v2): Deep semantic embeddings
     for identifying paraphrased sentences even when words differ.

Lazy loading is used for the SentenceTransformer model to ensure fast
startup.
"""

import logging
from typing import List, Dict, Any, Tuple
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# Lazy-loaded SentenceTransformer model
_ST_MODEL = None

def _get_st_model():
    """Lazy load the all-MiniLM-L6-v2 model. Mocks if not installed."""
    global _ST_MODEL
    if _ST_MODEL is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
            _ST_MODEL = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("SentenceTransformer model loaded.")
        except ImportError:
            logger.warning("sentence_transformers not installed — semantic similarity disabled. Only TF-IDF will be used.")
            _ST_MODEL = None  # Explicitly None so we can skip semantic checks
    return _ST_MODEL

def compute_tfidf_similarity(source_text: str, target_texts: List[str]) -> List[float]:
    """
    Compute TF-IDF cosine similarity between a source document and multiple target documents.
    """
    if not source_text.strip() or not any(t.strip() for t in target_texts):
        return [0.0] * len(target_texts)

    vectorizer = TfidfVectorizer()
    all_texts = [source_text] + target_texts
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
        # Compare the first document (source) to all others (targets)
        cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
        return cosine_sim[0].tolist()
    except ValueError: # happens if all texts contain only stopwords or are empty
        return [0.0] * len(target_texts)

def compute_semantic_similarity(source_sentences: List[str], target_sentences: List[str], threshold: float = 0.75) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Compute semantic similarity between sentences using Sentence Transformers.
    Returns 0.0 and empty matches if model is not available.
    """
    if not source_sentences or not target_sentences:
        return 0.0, []

    model = _get_st_model()
    if model is None:
        logger.debug("Semantic model unavailable — skipping semantic check.")
        return 0.0, []

    # Generate embeddings
    source_embeddings = model.encode(source_sentences, convert_to_tensor=False)
    target_embeddings = model.encode(target_sentences, convert_to_tensor=False)
    
    # Compute cosine similarity between all pairs of sentences
    sim_matrix = cosine_similarity(source_embeddings, target_embeddings)
    
    matches = []
    total_sim = 0.0
    match_count = 0

    for i, row in enumerate(sim_matrix):
        best_match_idx = np.argmax(row)
        best_score = float(row[best_match_idx])
        
        if best_score >= threshold:
            matches.append({
                "source_sentence": source_sentences[i],
                "target_sentence": target_sentences[best_match_idx],
                "score": best_score
            })
            total_sim += best_score
            match_count += 1
            
    avg_semantic_sim = (total_sim / match_count) if match_count > 0 else 0.0
    
    # Sort matches by score descending
    matches.sort(key=lambda x: x["score"], reverse=True)
    
    return avg_semantic_sim, matches

def check_similarity(new_doc: Dict[str, Any], stored_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compare a new preprocessed document against all stored documents.
    Returns the similarity report.
    """
    if not stored_docs:
        return {
            "max_similarity": 0.0,
            "matches": [],
            "message": "No previous documents to compare against."
        }

    # Extract preprocessing data from new_doc — it can be passed either as
    # the full document store record {"preprocessing": {...}, ...}
    # OR as the preprocessing dict directly {"clean_text": ..., "sentences": ...}
    preprocessing_data = new_doc.get("preprocessing") or new_doc
    new_clean_text = preprocessing_data.get("clean_text", "")
    new_sentences = preprocessing_data.get("sentences", [])

    if not new_clean_text.strip():
        logger.warning("check_similarity: source document has no clean_text — was it preprocessed?")
        return {
            "max_similarity": 0.0,
            "matches": [],
            "message": "Source document has not been preprocessed yet."
        }
    
    target_clean_texts = [doc.get("preprocessing", {}).get("clean_text", "") for doc in stored_docs]
    
    # 1. TF-IDF baseline similarity
    tfidf_scores = compute_tfidf_similarity(new_clean_text, target_clean_texts)
    
    results = []
    
    # 2. Detailed semantic check for top TF-IDF matches (or all if small dataset)
    # To optimize, we could only semantic-check those with tfidf > 0.1, but for thoroughness
    # we'll check all that have some similarity or if the dataset is small.
    for idx, doc in enumerate(stored_docs):
        target_sentences = doc.get("preprocessing", {}).get("sentences", [])
        tfidf_score = tfidf_scores[idx]
        
        avg_semantic, sentence_matches = compute_semantic_similarity(
            new_sentences, 
            target_sentences,
            threshold=0.75
        )
        
        # We define overall similarity as a weighted combo or max of tfidf/semantic
        # Let's take the max of tfidf and avg_semantic as the document similarity score
        doc_similarity = max(tfidf_score, avg_semantic)
        
        if doc_similarity > 0.1: # Only report if there's *some* similarity
            results.append({
                "doc_id": doc["doc_id"],
                "filename": doc["filename"],
                "submitter": doc.get("submitter", "anonymous"),
                "overall_similarity": round(doc_similarity * 100, 2),
                "tfidf_similarity": round(tfidf_score * 100, 2),
                "semantic_similarity": round(avg_semantic * 100, 2),
                "matching_sentences": sentence_matches[:5] # Top 5 sentence matches
            })
            
    # Sort by overall similarity
    results.sort(key=lambda x: x["overall_similarity"], reverse=True)
    
    max_sim = results[0]["overall_similarity"] if results else 0.0
    
    return {
        "max_similarity": max_sim,
        "matches": results,
        "message": f"Found {len(results)} similar documents." if results else "No significant similarity found."
    }

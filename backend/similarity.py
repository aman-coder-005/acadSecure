"""
similarity.py — Module 3: Semantic Similarity Detection
========================================================
Two-layer similarity detection:
  1. Word TF-IDF cosine similarity  — catches exact/near-exact matches.
  2. Character n-gram TF-IDF cosine similarity — catches paraphrased text.
     Why char n-grams? They match subword patterns, so "neural network" and
     "neural net" share many character trigrams even though the words differ.
     This is a lightweight alternative to deep semantic embeddings (no PyTorch).
"""

import logging
from typing import List, Dict, Any, Tuple
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


def compute_tfidf_similarity(source_text: str, target_texts: List[str]) -> List[float]:
    """Word-level TF-IDF cosine similarity: catches exact word overlap."""
    if not source_text.strip() or not any(t.strip() for t in target_texts):
        return [0.0] * len(target_texts)

    try:
        vectorizer = TfidfVectorizer()
        matrix = vectorizer.fit_transform([source_text] + target_texts)
        scores = cosine_similarity(matrix[0:1], matrix[1:])
        return scores[0].tolist()
    except ValueError:
        return [0.0] * len(target_texts)


def compute_semantic_similarity(
    source_sentences: List[str],
    target_sentences: List[str],
    threshold: float = 0.60,
) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Character n-gram TF-IDF cosine similarity at sentence level.

    Detects paraphrasing: two sentences that mean the same thing but use
    different words still share many 3-5 character substrings (e.g. suffixes,
    prefixes, stems). This gives a genuine 'semantic' score without needing
    any deep learning model.

    Threshold lowered to 0.60 (vs 0.75 for word TF-IDF) because char n-gram
    scores are naturally lower than word-level scores.
    """
    if not source_sentences or not target_sentences:
        return 0.0, []

    try:
        vectorizer = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5), min_df=1)
        all_sentences = source_sentences + target_sentences
        matrix = vectorizer.fit_transform(all_sentences)

        src_mat = matrix[:len(source_sentences)]
        tgt_mat = matrix[len(source_sentences):]
        sim_matrix = cosine_similarity(src_mat, tgt_mat)
    except Exception as exc:
        logger.warning("Semantic similarity failed: %s", exc)
        return 0.0, []

    matches = []
    total_sim = 0.0
    match_count = 0

    for i, row in enumerate(sim_matrix):
        best_idx = int(np.argmax(row))
        best_score = float(row[best_idx])

        if best_score >= threshold:
            matches.append({
                "source_sentence": source_sentences[i],
                "target_sentence": target_sentences[best_idx],
                "score": round(best_score, 4),
            })
            total_sim += best_score
            match_count += 1

    avg_semantic_sim = (total_sim / match_count) if match_count > 0 else 0.0
    matches.sort(key=lambda x: x["score"], reverse=True)

    return avg_semantic_sim, matches


def check_similarity(new_doc: Dict[str, Any], stored_docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compare a new preprocessed document against all stored documents.
    Returns similarity report with word TF-IDF and semantic (char n-gram) scores.
    """
    if not stored_docs:
        return {
            "max_similarity": 0.0,
            "matches": [],
            "message": "No previous documents to compare against.",
        }

    # Support both full doc store record and bare preprocessing dict
    preprocessing_data = new_doc.get("preprocessing") or new_doc
    new_clean_text = preprocessing_data.get("clean_text", "")
    new_sentences  = preprocessing_data.get("sentences", [])

    if not new_clean_text.strip():
        logger.warning("check_similarity: source document has no clean_text — was it preprocessed?")
        return {
            "max_similarity": 0.0,
            "matches": [],
            "message": "Source document has not been preprocessed yet.",
        }

    target_clean_texts = [
        doc.get("preprocessing", {}).get("clean_text", "") for doc in stored_docs
    ]

    # Layer 1 — word TF-IDF
    tfidf_scores = compute_tfidf_similarity(new_clean_text, target_clean_texts)

    results = []

    for idx, doc in enumerate(stored_docs):
        target_sentences = doc.get("preprocessing", {}).get("sentences", [])
        tfidf_score = tfidf_scores[idx]

        # Layer 2 — character n-gram semantic
        avg_semantic, sentence_matches = compute_semantic_similarity(
            new_sentences,
            target_sentences,
            threshold=0.60,
        )

        # Overall = weighted: TF-IDF 60% + Semantic 40%
        doc_similarity = (tfidf_score * 0.6) + (avg_semantic * 0.4)

        if doc_similarity > 0.05:
            results.append({
                "doc_id":            doc["doc_id"],
                "filename":          doc["filename"],
                "submitter":         doc.get("submitter", "anonymous"),
                "overall_similarity": round(doc_similarity * 100, 2),
                "tfidf_similarity":   round(tfidf_score * 100, 2),
                "semantic_similarity": round(avg_semantic * 100, 2),
                "matching_sentences": sentence_matches[:5],
            })

    results.sort(key=lambda x: x["overall_similarity"], reverse=True)
    max_sim = results[0]["overall_similarity"] if results else 0.0

    return {
        "max_similarity": max_sim,
        "matches": results,
        "message": f"Found {len(results)} similar documents." if results else "No significant similarity found.",
    }

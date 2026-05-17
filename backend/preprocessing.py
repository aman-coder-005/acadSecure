"""
preprocessing.py — Module 2: Text Preprocessing
=================================================
Provides a deterministic, multi-stage NLP pipeline that transforms raw
extracted text into clean, normalised tokens suitable for:

  • TF-IDF vectorization   (Module 3)
  • Sentence Transformers  (Module 3)
  • AI-detection features  (Module 4)
  • Collusion matrix       (Module 5)

Pipeline stages (in order):
  1. Unicode normalisation + BOM stripping
  2. Sentence segmentation  (NLTK Punkt)
  3. Word tokenisation       (NLTK word_tokenize)
  4. Lowercasing
  5. Punctuation & special-character removal
  6. Numeric token removal
  7. Short-token removal     (len < 2)
  8. Stopword removal        (NLTK English corpus)
  9. Lemmatisation           (spaCy en_core_web_sm)
 10. Re-join to clean string + stats computation

Lazy model loading: NLTK data and the spaCy model are loaded once on
first call and cached in module-level globals, keeping startup fast.
"""

from __future__ import annotations

import logging
import re
import unicodedata
from functools import lru_cache
from typing import Optional

import nltk.data as _nltk_data
import nltk.downloader as _nltk_downloader
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize

logger = logging.getLogger(__name__)

# ── Ensure required NLTK corpora are present ──────────────────────────────
_NLTK_PACKAGES = ["punkt", "punkt_tab", "stopwords", "wordnet", "omw-1.4"]

def _ensure_nltk_data() -> None:
    for pkg in _NLTK_PACKAGES:
        try:
            # Try to locate; if missing, download silently
            _nltk_data.find(f"tokenizers/{pkg}" if "punkt" in pkg else f"corpora/{pkg}")
        except LookupError:
            logger.info("Downloading missing NLTK package: %s", pkg)
            _nltk_downloader.download(pkg, quiet=True)

_ensure_nltk_data()

# ── Module-level singletons (lazy-initialised) ─────────────────────────────
_SPACY_NLP = None          # spacy.Language instance
_STOP_WORDS: set[str] = set()


def _get_spacy() :
    """Return the cached spaCy pipeline, loading it on first call."""
    global _SPACY_NLP
    if _SPACY_NLP is None:
        import spacy  # import here so the module loads even without spacy installed
        logger.info("Loading spaCy model 'en_core_web_sm'…")
        _SPACY_NLP = spacy.load(
            "en_core_web_sm",
            # Disable components we don't need for lemmatisation — speeds things up
            disable=["parser", "ner"],
        )
        logger.info("spaCy model loaded.")
    return _SPACY_NLP


def _get_stopwords() -> set[str]:
    """Return the cached English stop-word set."""
    global _STOP_WORDS
    if not _STOP_WORDS:
        _STOP_WORDS = set(stopwords.words("english"))
    return _STOP_WORDS


# ── Regex patterns (compiled once at import time) ─────────────────────────
_RE_SPECIAL = re.compile(r"[^a-zA-Z0-9\s]")   # keep alphanumeric + whitespace
_RE_DIGITS  = re.compile(r"^\d+$")             # purely numeric token
_RE_MULTI_SPACE = re.compile(r"\s+")           # collapse whitespace


# ── Core helper functions ──────────────────────────────────────────────────

def _normalise_unicode(text: str) -> str:
    """
    Strip BOM, normalise to NFC, and remove non-printable control characters
    (except standard whitespace like \\n and \\t).
    """
    # Remove BOM (U+FEFF) that Set-Content -Encoding UTF8 adds on Windows
    text = text.lstrip("\ufeff")
    # NFC normalisation — ensures é == é etc.
    text = unicodedata.normalize("NFC", text)
    # Remove non-printable characters
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C" or ch in "\n\t\r ")
    return text


def _segment_sentences(text: str) -> list[str]:
    """Split text into sentences using NLTK's Punkt tokeniser."""
    return sent_tokenize(text)


def _tokenise_words(sentence: str) -> list[str]:
    """Word-tokenise a single sentence using NLTK."""
    return word_tokenize(sentence)


def _clean_token(token: str) -> Optional[str]:
    """
    Apply lowercasing, punctuation removal, digit filtering, and
    length-based filtering to a single token.

    Returns None if the token should be discarded.
    """
    token = token.lower()
    token = _RE_SPECIAL.sub("", token)  # strip punctuation
    token = token.strip()

    if not token:
        return None
    if _RE_DIGITS.match(token):        # skip pure numbers
        return None
    if len(token) < 2:                 # skip single-character tokens
        return None
    return token


def _remove_stopwords(tokens: list[str], stop_words: set[str]) -> list[str]:
    """Remove English stop-words from a token list."""
    return [t for t in tokens if t not in stop_words]


def _lemmatise(tokens: list[str]) -> list[str]:
    """
    Lemmatise tokens using spaCy.

    Processes a space-joined string through the pipeline (only tagger +
    morphologiser are active) and extracts lemma_ for each token.
    """
    nlp = _get_spacy()
    # spaCy works best with a real sentence; join with spaces
    doc = nlp(" ".join(tokens))
    return [token.lemma_ for token in doc if token.lemma_.strip()]


# ── Public API ─────────────────────────────────────────────────────────────

def preprocess_text(raw_text: str) -> dict:
    """
    Run the full preprocessing pipeline on *raw_text*.

    Parameters
    ----------
    raw_text : str
        Raw text as returned by the extraction module.

    Returns
    -------
    dict
        {
          "sentences"        : list[str]   – original sentences (for per-sentence similarity)
          "tokens"           : list[str]   – final cleaned + lemmatised tokens
          "clean_text"       : str         – tokens joined as a single string (for TF-IDF)
          "original_length"  : int         – char count of input
          "processed_length" : int         – char count of clean_text
          "sentence_count"   : int
          "token_count"      : int         – token count before stopword removal
          "filtered_token_count" : int     – token count after stopword removal + lemmatisation
          "stopwords_removed": int         – how many stop-words were dropped
        }
    """
    if not raw_text or not raw_text.strip():
        return {
            "sentences": [],
            "tokens": [],
            "clean_text": "",
            "original_length": 0,
            "processed_length": 0,
            "sentence_count": 0,
            "token_count": 0,
            "filtered_token_count": 0,
            "stopwords_removed": 0,
        }

    original_length = len(raw_text)

    # ── Stage 1: Unicode normalisation ────────────────────────────────────
    text = _normalise_unicode(raw_text)

    # ── Stage 2: Sentence segmentation ────────────────────────────────────
    sentences = _segment_sentences(text)

    # ── Stages 3-7: Tokenise, lowercase, clean, filter ────────────────────
    all_raw_tokens: list[str] = []
    for sentence in sentences:
        word_tokens = _tokenise_words(sentence)
        for tok in word_tokens:
            cleaned = _clean_token(tok)
            if cleaned:
                all_raw_tokens.append(cleaned)

    token_count = len(all_raw_tokens)

    # ── Stage 8: Stopword removal ─────────────────────────────────────────
    stop_words = _get_stopwords()
    no_stop_tokens = _remove_stopwords(all_raw_tokens, stop_words)
    stopwords_removed = token_count - len(no_stop_tokens)

    # ── Stage 9: Lemmatisation ────────────────────────────────────────────
    if no_stop_tokens:
        lemmatised = _lemmatise(no_stop_tokens)
        # Post-lemmatisation cleaning (lemmas can introduce punctuation)
        final_tokens = [
            t.lower() for t in lemmatised
            if t.strip() and len(t.strip()) >= 2 and not _RE_DIGITS.match(t.strip())
        ]
    else:
        final_tokens = []

    # ── Stage 10: Rebuild clean text ──────────────────────────────────────
    clean_text = " ".join(final_tokens)

    logger.info(
        "Preprocessing complete: %d chars → %d sentences → %d raw tokens "
        "→ %d after stopword removal → %d after lemmatisation",
        original_length, len(sentences), token_count,
        len(no_stop_tokens), len(final_tokens),
    )

    return {
        "sentences": sentences,
        "tokens": final_tokens,
        "clean_text": clean_text,
        "original_length": original_length,
        "processed_length": len(clean_text),
        "sentence_count": len(sentences),
        "token_count": token_count,
        "filtered_token_count": len(final_tokens),
        "stopwords_removed": stopwords_removed,
    }


def preprocess_batch(texts: list[str]) -> list[dict]:
    """
    Preprocess a list of raw texts in sequence.

    Returns a list of preprocessing result dicts in the same order as *texts*.
    This is used by the similarity and collusion modules which compare multiple
    submissions at once.
    """
    results = []
    for i, text in enumerate(texts):
        logger.info("Batch preprocessing document %d/%d", i + 1, len(texts))
        results.append(preprocess_text(text))
    return results

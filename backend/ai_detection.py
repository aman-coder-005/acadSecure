"""
ai_detection.py — Module 4: AI-Generated Content Detection
============================================================
Uses a pretrained RoBERTa model from HuggingFace for AI content detection.
Model: Hello-SimpleAI/chatgpt-detector-roberta  (~500MB, downloads once)

The model is lazy-loaded on first request and cached for subsequent calls.
Text is truncated to 512 tokens (RoBERTa limit).
"""

import logging
from typing import Dict

logger = logging.getLogger(__name__)

_DETECTOR = None
_MODEL_NAME = "Hello-SimpleAI/chatgpt-detector-roberta"


def _get_detector():
    """Lazy-load the RoBERTa detector pipeline. Downloads model on first run."""
    global _DETECTOR
    if _DETECTOR is None:
        print(f"[AI Detection] Loading model '{_MODEL_NAME}' (first time may take a few minutes)...")
        logger.info("Loading AI detection model: %s", _MODEL_NAME)

        from transformers import pipeline
        _DETECTOR = pipeline(
            "text-classification",
            model=_MODEL_NAME,
            truncation=True,
            max_length=512,
        )

        print("[AI Detection] Model loaded successfully.")
        logger.info("AI detection model loaded.")
    return _DETECTOR


def detect_ai_content(text: str) -> Dict[str, float]:
    """
    Predict whether text is AI-generated using RoBERTa.

    The model outputs labels: 'ChatGPT' or 'Human'
    with a confidence score.

    Returns:
        { "ai_probability": 0-100, "human_probability": 0-100 }
    """
    if not text or not text.strip():
        return {"ai_probability": 0.0, "human_probability": 0.0}

    try:
        detector = _get_detector()

        # Truncate to ~2000 chars before tokenization (model handles token truncation too)
        trimmed = text.strip()[:2000]
        result = detector(trimmed)[0]

        label = result["label"]      # 'ChatGPT' or 'Human'
        score = float(result["score"])

        if label == "ChatGPT":
            ai_prob    = round(score * 100, 2)
            human_prob = round((1 - score) * 100, 2)
        else:
            human_prob = round(score * 100, 2)
            ai_prob    = round((1 - score) * 100, 2)

        logger.info("AI Detection Result: %s (%.3f) -> AI=%.2f%%, Human=%.2f%%", label, score, ai_prob, human_prob)

        return {
            "ai_probability":    ai_prob,
            "human_probability": human_prob,
        }

    except Exception as exc:
        logger.error("AI detection failed: %s", exc)
        return {"ai_probability": 0.0, "human_probability": 0.0}

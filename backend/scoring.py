"""
Module 6: Integrity Scoring
Computes the overall originality score and risk labels based on
plagiarism, AI, and collusion percentages.
"""

def get_risk_label(percentage: float) -> str:
    """
    Returns a risk label based on the percentage.
    < 30 = LOW
    < 70 = MEDIUM
    >= 70 = HIGH
    """
    if percentage < 30:
        return "LOW"
    elif percentage < 70:
        return "MEDIUM"
    else:
        return "HIGH"

def calculate_integrity_score(plagiarism_percent: float, ai_percent: float, collusion_risk_percent: float) -> dict:
    """
    Compute: Originality Score = 100 - (0.4 × plagiarism%) - (0.4 × ai%) - (0.2 × collusion_risk%)
    """
    # Ensure percentages are within 0-100 range
    plagiarism_percent = max(0.0, min(100.0, plagiarism_percent))
    ai_percent = max(0.0, min(100.0, ai_percent))
    collusion_risk_percent = max(0.0, min(100.0, collusion_risk_percent))

    originality_score = 100.0 - (0.4 * plagiarism_percent) - (0.4 * ai_percent) - (0.2 * collusion_risk_percent)
    
    # Final check to ensure it's between 0 and 100
    originality_score = max(0.0, min(100.0, originality_score))
    
    return {
        "originality_score": round(originality_score, 2),
        "plagiarism_risk": get_risk_label(plagiarism_percent),
        "ai_risk": get_risk_label(ai_percent),
        "collusion_risk": get_risk_label(collusion_risk_percent),
        "details": {
            "plagiarism_percent": round(plagiarism_percent, 2),
            "ai_percent": round(ai_percent, 2),
            "collusion_risk_percent": round(collusion_risk_percent, 2)
        }
    }

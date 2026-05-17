from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_score_endpoint():
    payload = {
        "plagiarism_percent": 25.0,
        "ai_percent": 15.0,
        "collusion_risk_percent": 10.0
    }
    # Expected originality_score = 100 - (0.4*25) - (0.4*15) - (0.2*10) = 100 - 10 - 6 - 2 = 82
    response = client.post("/score", json=payload)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
    assert response.status_code == 200
    assert response.json()["originality_score"] == 82.0
    assert response.json()["plagiarism_risk"] == "LOW"
    assert response.json()["ai_risk"] == "LOW"
    assert response.json()["collusion_risk"] == "LOW"
    print("Test passed successfully!")

if __name__ == "__main__":
    test_score_endpoint()

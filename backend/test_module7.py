from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch
import hashlib

client = TestClient(app)

# Mock _DOCUMENT_STORE directly
import main
doc_id = "test_doc_blockchain"
dummy_text = "This is a dummy document for testing blockchain integration."
doc_hash = hashlib.sha256(dummy_text.encode("utf-8")).hexdigest()

main._DOCUMENT_STORE[doc_id] = {
    "doc_id": doc_id,
    "text": dummy_text
}

@patch("main.store_report_on_chain")
def test_store_blockchain_report(mock_store):
    mock_store.return_value = ("0xabc123", 42)
    
    payload = {
        "doc_id": doc_id,
        "originality_score": 85.0,
        "plagiarism_risk": "LOW",
        "ai_risk": "MEDIUM",
        "collusion_risk": "LOW"
    }
    
    response = client.post("/blockchain/store", json=payload)
    print("Store Status:", response.status_code)
    print("Store JSON:", response.json())
    
    assert response.status_code == 200
    assert response.json()["tx_hash"] == "0xabc123"
    assert response.json()["block_number"] == 42
    assert response.json()["doc_hash"] == doc_hash
    mock_store.assert_called_once()

@patch("main.verify_document_on_chain")
@patch("main.get_report_from_chain")
def test_verify_blockchain_report(mock_get, mock_verify):
    mock_verify.return_value = True
    mock_get.return_value = {
        "doc_hash": doc_hash,
        "originality_score": 85.0,
        "plagiarism_risk": "LOW",
        "ai_risk": "MEDIUM",
        "collusion_risk": "LOW",
        "timestamp": 1234567890,
        "submitter": "0x123..."
    }
    
    response = client.get(f"/blockchain/verify/{doc_hash}")
    print("Verify Status:", response.status_code)
    print("Verify JSON:", response.json())
    
    assert response.status_code == 200
    assert response.json()["is_verified"] is True
    assert response.json()["report"]["originality_score"] == 85.0

if __name__ == "__main__":
    test_store_blockchain_report()
    test_verify_blockchain_report()
    print("Module 7 endpoints working correctly with mocked blockchain calls.")

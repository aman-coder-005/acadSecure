"""
test_module5.py — Module 5 verification script
Run with: python test_module5.py
"""
import requests
import json
from collusion import detect_collusion

def run_tests():
    print("=" * 60)
    print("TEST: Module 5 - Collusion Detection")
    print("=" * 60)
    
    # 1. Unit test (Direct function call)
    print("1. Unit test (Direct function call)...")
    docs = [
        {"doc_id": "1", "submitter": "Alice", "filename": "mock.txt", "preprocessing": {"clean_text": "machine learning is great and fun"}},
        {"doc_id": "2", "submitter": "Bob", "filename": "mock.txt", "preprocessing": {"clean_text": "machine learning is great and fun"}}, # Colluding with Alice
        {"doc_id": "3", "submitter": "Charlie", "filename": "mock.txt", "preprocessing": {"clean_text": "i prefer to study history and ancient rome"}} # Not colluding
    ]
    
    res = detect_collusion(docs, threshold=0.75)
    print(f"   Nodes: {len(res['nodes'])}")
    print(f"   Links: {len(res['links'])}")
    print(f"   Clusters: {len(res['clusters'])}")
    
    assert len(res['nodes']) == 3
    assert len(res['links']) == 1 # Alice and Bob
    assert len(res['clusters']) == 1 # One collusion group
    assert "Alice" in res['clusters'][0]['members']
    assert "Bob" in res['clusters'][0]['members']
    print("  [PASS] Unit tests OK\n")

    # 2. Live API test
    print("2. Live API test (POST /collusion)...")
    base_url = "http://localhost:8000"
    
    try:
        # Clear existing? We can just upload 3 docs
        # Upload Alice
        text1 = "The study of deep neural networks involves backpropagation."
        with open("doc_alice.txt", "w", encoding="utf-8") as f: f.write(text1)
        r1 = requests.post(f"{base_url}/upload", files={"files": open("doc_alice.txt", "rb")}, data={"submitter": "Alice"})
        doc1_id = r1.json()["results"][0]["doc_id"]
        requests.post(f"{base_url}/preprocess/{doc1_id}")
        
        # Upload Bob (Copy of Alice)
        with open("doc_bob.txt", "w", encoding="utf-8") as f: f.write(text1)
        r2 = requests.post(f"{base_url}/upload", files={"files": open("doc_bob.txt", "rb")}, data={"submitter": "Bob"})
        doc2_id = r2.json()["results"][0]["doc_id"]
        requests.post(f"{base_url}/preprocess/{doc2_id}")
        
        # Upload Charlie
        text3 = "Shakespeare wrote many famous plays during the Elizabethan era."
        with open("doc_charlie.txt", "w", encoding="utf-8") as f: f.write(text3)
        r3 = requests.post(f"{base_url}/upload", files={"files": open("doc_charlie.txt", "rb")}, data={"submitter": "Charlie"})
        doc3_id = r3.json()["results"][0]["doc_id"]
        requests.post(f"{base_url}/preprocess/{doc3_id}")
        
        # Run Collusion Detection
        r_collusion = requests.post(f"{base_url}/collusion?threshold=0.75", timeout=10)
        
        if r_collusion.status_code == 200:
            data = r_collusion.json()
            print(f"   Status: 200 OK")
            print(f"   Detected {len(data['clusters'])} collusion rings.")
            print(f"   Links: {len(data['links'])}")
            print("  [PASS] /collusion OK\n")
        else:
            print(f"  [FAIL] {r_collusion.status_code}: {r_collusion.text}\n")
    except requests.exceptions.ConnectionError:
        print("  [SKIP] Server not running — start with: python main.py\n")
        
    print("ALL MODULE 5 TESTS COMPLETE")

if __name__ == "__main__":
    run_tests()

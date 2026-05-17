"""
test_module3.py — Module 3 verification script
Run with: python test_module3.py
"""
import requests
import json
import time

def run_tests():
    print("=" * 60)
    print("TEST: Module 3 - Semantic Similarity (Live API)")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # 1. Upload Doc 1 (Original)
    print("1. Uploading Doc 1 (Original)...")
    text1 = "Deep neural networks are highly effective for image recognition tasks. They learn hierarchical feature representations."
    with open("doc1.txt", "w", encoding="utf-8") as f: f.write(text1)
    
    r1 = requests.post(f"{base_url}/upload", files={"files": open("doc1.txt", "rb")})
    doc1_id = r1.json()["results"][0]["doc_id"]
    
    # Preprocess Doc 1
    requests.post(f"{base_url}/preprocess/{doc1_id}")
    print(f"   -> doc1_id: {doc1_id}")

    # 2. Upload Doc 2 (Paraphrased)
    print("2. Uploading Doc 2 (Paraphrased)...")
    text2 = "For tasks involving identifying images, neural networks with many layers work exceptionally well because they extract features at multiple levels."
    with open("doc2.txt", "w", encoding="utf-8") as f: f.write(text2)
    
    r2 = requests.post(f"{base_url}/upload", files={"files": open("doc2.txt", "rb")})
    doc2_id = r2.json()["results"][0]["doc_id"]
    
    # Preprocess Doc 2
    requests.post(f"{base_url}/preprocess/{doc2_id}")
    print(f"   -> doc2_id: {doc2_id}")
    
    # 3. Check similarity for Doc 2
    print("3. Checking Similarity for Doc 2...")
    r3 = requests.post(f"{base_url}/similarity/{doc2_id}")
    if r3.status_code == 200:
        data = r3.json()
        print(f"   Status: 200 OK")
        print(f"   Max Similarity: {data['max_similarity']}%")
        print(f"   Matches: {len(data['matches'])}")
        if data['matches']:
            match = data['matches'][0]
            print(f"   Top Match TF-IDF Sim: {match['tfidf_similarity']}%")
            print(f"   Top Match Semantic Sim: {match['semantic_similarity']}%")
        print("  [PASS] /similarity/{doc_id} OK\n")
    else:
        print(f"  [FAIL] {r3.status_code}: {r3.text}\n")
        
    print("ALL MODULE 3 TESTS COMPLETE")

if __name__ == "__main__":
    try:
        run_tests()
    except requests.exceptions.ConnectionError:
        print("Server not running. Please start the server using 'python main.py'")

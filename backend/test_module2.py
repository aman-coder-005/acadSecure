"""
test_module2.py — Module 2 verification script
Run with: python test_module2.py
"""
import json
import requests

# ── 1. Unit-level pipeline test (no server required) ──────────────────────
from preprocessing import preprocess_text, preprocess_batch

SAMPLE = (
    "Machine learning is a subset of artificial intelligence. "
    "Deep neural networks learn complex patterns from large datasets. "
    "Students often paraphrase content from academic papers without proper citation. "
    "This constitutes plagiarism and violates academic integrity policies."
)

print("=" * 60)
print("TEST 1: Direct preprocessing pipeline")
print("=" * 60)
result = preprocess_text(SAMPLE)

print(f"  Sentences detected  : {result['sentence_count']}")
print(f"  Raw tokens          : {result['token_count']}")
print(f"  Stopwords removed   : {result['stopwords_removed']}")
print(f"  Final tokens        : {result['filtered_token_count']}")
print(f"  Sample tokens       : {result['tokens'][:12]}")
print(f"  Clean text preview  : {result['clean_text'][:100]}...")

assert result["sentence_count"] == 4, "Expected 4 sentences"
assert result["filtered_token_count"] > 0, "No tokens produced"
assert result["stopwords_removed"] > 0, "Stopwords not removed"
assert "learn" in result["tokens"] or "learning" in result["tokens"], "Lemmatisation may have failed"
print("  [PASS] All assertions passed\n")

# ── 2. Batch preprocessing test ────────────────────────────────────────────
print("=" * 60)
print("TEST 2: Batch preprocessing (2 documents)")
print("=" * 60)
texts = [SAMPLE, "Artificial intelligence transforms modern education systems."]
batch = preprocess_batch(texts)
assert len(batch) == 2, "Batch must return same count as input"
print(f"  Doc 1 tokens: {batch[0]['filtered_token_count']}")
print(f"  Doc 2 tokens: {batch[1]['filtered_token_count']}")
print("  [PASS] Batch preprocessing OK\n")

# ── 3. Edge-case: empty text ───────────────────────────────────────────────
print("=" * 60)
print("TEST 3: Empty text edge case")
print("=" * 60)
empty = preprocess_text("")
assert empty["sentence_count"] == 0
assert empty["tokens"] == []
print("  [PASS] Empty text handled gracefully\n")

# ── 4. Live API test: POST /preprocess ────────────────────────────────────
print("=" * 60)
print("TEST 4: POST /preprocess (live API)")
print("=" * 60)
try:
    r = requests.post(
        "http://localhost:8000/preprocess",
        json={"text": SAMPLE},
        timeout=30,
    )
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    print(f"  Status              : {r.status_code} OK")
    print(f"  sentence_count      : {data['sentence_count']}")
    print(f"  filtered_token_count: {data['filtered_token_count']}")
    print(f"  stopwords_removed   : {data['stopwords_removed']}")
    print(f"  Sample tokens       : {data['tokens'][:8]}")
    print("  [PASS] /preprocess endpoint OK\n")
except requests.exceptions.ConnectionError:
    print("  [SKIP] Server not running — start with: python main.py\n")

# ── 5. Live API test: POST /preprocess/{doc_id} ───────────────────────────
print("=" * 60)
print("TEST 5: POST /preprocess/{doc_id} (upload then preprocess)")
print("=" * 60)
try:
    # First upload a document
    with open("test_doc.txt", "rb") as f:
        upload_r = requests.post(
            "http://localhost:8000/upload",
            files=[("files", ("test_doc.txt", f, "text/plain"))],
            data={"submitter": "test_student"},
            timeout=15,
        )
    assert upload_r.status_code == 200, f"Upload failed: {upload_r.text}"
    doc_id = upload_r.json()["results"][0]["doc_id"]
    print(f"  Uploaded doc_id     : {doc_id}")

    # Now preprocess by ID
    prep_r = requests.post(
        f"http://localhost:8000/preprocess/{doc_id}",
        timeout=30,
    )
    assert prep_r.status_code == 200, f"Expected 200, got {prep_r.status_code}: {prep_r.text}"
    pdata = prep_r.json()
    print(f"  sentence_count      : {pdata['sentence_count']}")
    print(f"  filtered_token_count: {pdata['filtered_token_count']}")
    print(f"  Tokens              : {pdata['tokens']}")

    # Verify cache works (call again — should be instant)
    prep_r2 = requests.post(
        f"http://localhost:8000/preprocess/{doc_id}",
        timeout=10,
    )
    assert prep_r2.status_code == 200
    print("  [PASS] /preprocess/{doc_id} + cache OK\n")

    # 404 test
    bad_r = requests.post("http://localhost:8000/preprocess/nonexistent-id", timeout=5)
    assert bad_r.status_code == 404
    print(f"  [PASS] 404 on bad doc_id: {bad_r.json()['detail']}\n")

except requests.exceptions.ConnectionError:
    print("  [SKIP] Server not running — start with: python main.py\n")

print("=" * 60)
print("ALL MODULE 2 TESTS COMPLETE")
print("=" * 60)

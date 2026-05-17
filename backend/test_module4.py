"""
test_module4.py — Module 4 verification script
Run with: python test_module4.py
"""
import requests
import json
from ai_detection import detect_ai_content

def run_tests():
    print("=" * 60)
    print("TEST: Module 4 - AI-Generated Content Detection")
    print("=" * 60)
    
    # 1. Test unit function directly
    print("1. Unit test (Direct function call)...")
    human_text = "I honestly just wrote this because I had to finish the assignment tonight."
    ai_text = "In conclusion, it is important to note that the implications are vast."
    
    h_res = detect_ai_content(human_text)
    a_res = detect_ai_content(ai_text)
    
    print(f"   Human Text -> Human Prob: {h_res['human_probability']}%, AI Prob: {h_res['ai_probability']}%")
    print(f"   AI Text    -> Human Prob: {a_res['human_probability']}%, AI Prob: {a_res['ai_probability']}%")
    
    assert h_res['human_probability'] > h_res['ai_probability'], "Failed to detect human text."
    assert a_res['ai_probability'] > a_res['human_probability'], "Failed to detect AI text."
    print("  [PASS] Unit tests OK\n")

    # 2. Live API test
    print("2. Live API test (POST /ai-detect)...")
    base_url = "http://localhost:8000"
    
    try:
        r = requests.post(
            f"{base_url}/ai-detect",
            json={"text": "Furthermore, the multifaceted nature of this paradigm shift cannot be understated."},
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            print(f"   Status: 200 OK")
            print(f"   AI Prob: {data['ai_probability']}% | Human Prob: {data['human_probability']}%")
            print("  [PASS] /ai-detect OK\n")
        else:
            print(f"  [FAIL] {r.status_code}: {r.text}\n")
    except requests.exceptions.ConnectionError:
        print("  [SKIP] Server not running — start with: python main.py\n")
        
    print("ALL MODULE 4 TESTS COMPLETE")

if __name__ == "__main__":
    run_tests()

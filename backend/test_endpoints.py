import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_health():
    """Test health endpoint"""
    print("\n=== Testing Health Endpoint ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.status_code == 200

def test_signup():
    """Test signup endpoint"""
    print("\n=== Testing Signup ===")
    data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    response = requests.post(f"{BASE_URL}/auth/signup", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_login():
    """Test login endpoint"""
    print("\n=== Testing Login ===")
    data = {
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_get_me(token):
    """Test get current user endpoint"""
    print("\n=== Testing Get Me ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_upload_vcf(token):
    """Test VCF upload endpoint"""
    print("\n=== Testing VCF Upload ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a simple test VCF file
    vcf_content = """##fileformat=VCFv4.2
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene name">
##INFO=<ID=RS,Number=1,Type=String,Description="rsID">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	SAMPLE
chr1	100	rs123	A	G	.	PASS	GENE=CYP2D6;RS=rs1065852	GT	0/1
"""
    
    files = {"file": ("test.vcf", vcf_content, "text/plain")}
    response = requests.post(f"{BASE_URL}/upload-vcf", headers=headers, files=files)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_query_drug(token):
    """Test drug query endpoint"""
    print("\n=== Testing Drug Query ===")
    headers = {"Authorization": f"Bearer {token}"}
    data = {"drug_name": "WARFARIN"}
    response = requests.post(f"{BASE_URL}/query-drug", headers=headers, json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

def test_my_analyses(token):
    """Test get analyses endpoint"""
    print("\n=== Testing My Analyses ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/my-analyses", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")

if __name__ == "__main__":
    print("Starting API Tests...")
    
    # Test health
    if not test_health():
        print("Health check failed!")
        exit(1)
    
    # Test signup (or login if user exists)
    token = test_signup()
    if not token:
        print("Signup failed, trying login...")
        token = test_login()
    
    if not token:
        print("Authentication failed!")
        exit(1)
    
    print(f"\nAccess Token: {token[:50]}...")
    
    # Test authenticated endpoints
    test_get_me(token)
    test_upload_vcf(token)
    test_my_analyses(token)
    test_query_drug(token)
    
    print("\n=== All Tests Complete ===")

import requests
import json

# Test the pharmacogenomics API
url = "http://localhost:8000/analyze"

try:
    with open("sample_patient.vcf", "rb") as f:
        files = {"file": ("sample_patient.vcf", f, "text/plain")}
        data = {
            "drugs": "CODEINE,WARFARIN,CLOPIDOGREL",
            "patient_id": "TEST_001"
        }
        
        response = requests.post(url, files=files, data=data)
        
        if response.status_code == 200:
            print("✅ Success!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
except Exception as e:
    print(f"❌ Exception: {e}")

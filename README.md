Here is a **complete, competition-ready README.md** you can directly use and customize.

---

# 🧬 PharmaGuard – AI-Powered Pharmacogenomic Risk Analyzer

> Preventing adverse drug reactions through precision genomics and AI.

---

## 🌍 Live Application

🔗 **Live Demo:** [https://rainbow-kulfi-5e6179.netlify.app/](https://rainbow-kulfi-5e6179.netlify.app/)
🎥 **LinkedIn Demo Video:** [https://linkedin.com/your-video-link](https://linkedin.com/your-video-link)

---

## 📌 Problem Statement

Adverse drug reactions cause over 100,000 deaths annually in the United States. Many are preventable through pharmacogenomic testing — analyzing genetic variants that affect drug metabolism.

PharmaGuard is an AI-powered web application that:

* Parses authentic VCF genomic files
* Identifies clinically relevant pharmacogenomic variants
* Predicts drug-specific risks
* Provides CPIC-aligned dosing recommendations
* Generates structured LLM-based clinical explanations

---

## 🏗 Architecture Overview

```
Frontend (Next.js + Tailwind)
        ↓
FastAPI Backend
        ↓
VCF Parsing Engine
        ↓
Pharmacogenomic Rule Engine
        ↓
LLM Explanation Generator
        ↓
Structured JSON Output
```

---

## 🧠 Core Features

### 1️⃣ VCF File Parsing

* Supports VCF v4.2 format
* Validates file size (≤ 5MB)
* Extracts:

  * Gene
  * rsID
  * Star alleles
  * Genotype (GT field)

### 2️⃣ Pharmacogenomic Analysis

Analyzes 6 critical genes:

* CYP2D6
* CYP2C19
* CYP2C9
* SLCO1B1
* TPMT
* DPYD

### 3️⃣ Supported Drugs

* CODEINE
* WARFARIN
* CLOPIDOGREL
* SIMVASTATIN
* AZATHIOPRINE
* FLUOROURACIL

### 4️⃣ Risk Prediction Labels

* Safe
* Adjust Dosage
* Toxic
* Ineffective
* Unknown

### 5️⃣ CPIC-Aligned Clinical Recommendations

All dosing recommendations are aligned with CPIC (Clinical Pharmacogenetics Implementation Consortium) guidelines.

### 6️⃣ LLM-Generated Clinical Explanation

Structured explanation including:

* Summary
* Biological mechanism
* Variant citations
* Clinical confidence statement

---

## 📦 Output JSON Schema

The application strictly follows the required structured format:

```json
{
  "patient_id": "PATIENT_XXX",
  "drug": "DRUG_NAME",
  "timestamp": "ISO8601_timestamp",
  "risk_assessment": {
    "risk_label": "Safe|Adjust Dosage|Toxic|Ineffective|Unknown",
    "confidence_score": 0.0,
    "severity": "none|low|moderate|high|critical"
  },
  "pharmacogenomic_profile": {
    "primary_gene": "GENE_SYMBOL",
    "diplotype": "*X/*Y",
    "phenotype": "PM|IM|NM|RM|URM|Unknown",
    "detected_variants": []
  },
  "clinical_recommendation": {},
  "llm_generated_explanation": {},
  "quality_metrics": {
    "vcf_parsing_success": true,
    "variants_analyzed": 0,
    "llm_response_generated": true
  }
}
```

Schema compliance is enforced using Pydantic validation.

---

## 🛠 Tech Stack

### Frontend

* Next.js
* React
* Tailwind CSS
* shadcn/ui
* React Dropzone

### Backend

* FastAPI
* Python
* Pydantic
* Uvicorn

### Genomics

* cyvcf2 (VCF parsing)

### AI Integration

* OpenAI API
* Structured JSON prompting

### Deployment

* Frontend: Vercel
* Backend: Render

---

## 🚀 Installation Guide

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/pharmaguard.git
cd pharmaguard
```

---

### 2️⃣ Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

Create `.env` file:

```
OPENAI_API_KEY=your_api_key_here
```

Run backend:

```bash
uvicorn main:app --reload
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Documentation

### POST `/analyze`

**Request:**

* Multipart file upload (.vcf)
* Drug name(s)

**Response:**

* Structured JSON (see schema above)

---

## 🧪 Usage Example

1. Upload VCF file
2. Enter drug name (e.g., CODEINE)
3. Click Analyze
4. View:

   * Risk label (color-coded)
   * Gene phenotype
   * CPIC recommendation
   * LLM explanation
5. Download JSON result

---

## 🎯 Deterministic Risk Engine

Risk labels are determined via rule-based logic aligned with CPIC guidelines.

Example:

* CYP2D6 Poor Metabolizer + CODEINE → Toxic
* CYP2C19 Poor Metabolizer + CLOPIDOGREL → Ineffective
* TPMT Poor Metabolizer + AZATHIOPRINE → Toxic

LLM is used only for explanation — not for clinical decision logic.

---

## 🧪 Sample Test VCF Files

Located in:

```
/sample_vcfs/
```

Includes:

* CYP2D6 Poor Metabolizer example
* CYP2C19 Intermediate example
* DPYD toxicity case

---

## 📊 Quality & Safety Controls

* File validation
* Strict JSON schema enforcement
* Deterministic rule engine
* Structured LLM output validation
* Graceful error handling

---

## 🎥 Demo Video Includes

* Architecture walkthrough
* Live VCF upload
* Drug risk prediction
* JSON schema verification
* LLM explanation generation

---

## 👥 Team Members

* Avinash Shetty
* Sarthak Rana
* Vaibhav Baviskar

---

## 📌 Submission Details

* Problem Statement: Pharmacogenomic AI Risk Prediction
* GitHub Repository: (this repo)
* Live Application URL: (see above)
* LinkedIn Demo: (see above)

---

## ⚖ Disclaimer

This application is for educational and competition purposes only.
It is not a substitute for professional medical advice or clinical decision-making.

---

## 🏁 Final Note

PharmaGuard bridges genomics and AI to enable precision medicine — combining deterministic pharmacogenomic rules with explainable large language models to reduce preventable adverse drug reactions.

* A deployment guide section tailored for Render/Vercel
* A CPIC alignment explanation section to boost evaluation score

# Pharmacogenomics Analysis Backend

AI-powered backend for analyzing patient genetic data (VCF files) to predict personalized pharmacogenomic risks.

## Features

- ✅ Parses VCF files (Variant Call Format v4.2)
- ✅ Analyzes 6 critical genes: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
- ✅ Predicts drug-specific risks: Safe, Adjust Dosage, Toxic, Ineffective, Unknown
- ✅ Supports 6 drugs: CODEINE, WARFARIN, CLOPIDOGREL, SIMVASTATIN, AZATHIOPRINE, FLUOROURACIL
- ✅ Generates LLM-powered clinical explanations
- ✅ Provides CPIC guideline-based recommendations

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

### 3. Run Server

```bash
uvicorn main:app --reload --port 8000
```

Server will start at: `http://localhost:8000`

## API Endpoints

### POST /dashboard/analyze

Analyze VCF file for pharmacogenomic risks.

**Request:**
- `file`: VCF file (multipart/form-data)
- `drugs`: Comma-separated drug names (e.g., "CODEINE,WARFARIN")
- `patient_id`: Optional patient identifier (default: "PATIENT_001")

**Example using curl:**

```bash
curl -X POST "http://localhost:8000/dashboard/analyze" \
  -F "file=@patient_sample.vcf" \
  -F "drugs=CODEINE,WARFARIN" \
  -F "patient_id=PATIENT_123"
```

**Response:**

```json
[
  {
    "patient_id": "PATIENT_123",
    "drug": "CODEINE",
    "timestamp": "2024-01-15T10:30:00Z",
    "risk_assessment": {
      "risk_label": "Toxic",
      "confidence_score": 0.92,
      "severity": "high"
    },
    "pharmacogenomic_profile": {
      "primary_gene": "CYP2D6",
      "diplotype": "*1/*4",
      "phenotype": "IM",
      "detected_variants": [...]
    },
    "clinical_recommendation": {
      "guideline_reference": "CPIC Guideline for CYP2D6 and Codeine",
      "recommended_action": "Use label-recommended dosage with monitoring",
      "dose_adjustment": "Standard dose with close monitoring"
    },
    "llm_generated_explanation": {
      "summary": "...",
      "mechanism_of_action": "...",
      "variant_citations": ["rs3892097"],
      "confidence_statement": "..."
    },
    "quality_metrics": {
      "vcf_parsing_success": true,
      "variants_analyzed": 2,
      "llm_response_generated": true
    }
  }
]
```

### GET /health

Health check endpoint.

## Architecture

### 1. VCF Parser (`vcf_parser.py`)
- Parses VCF files using vcfpy
- Extracts variants for 6 target genes
- Returns structured variant data

### 2. Diplotype Analyzer (`diplotype_analyzer.py`)
- Maps variants to star alleles
- Determines diplotypes (*X/*Y)
- Calculates phenotypes (PM, IM, NM, RM, UM)

### 3. Risk Engine (`risk_engine.py`)
- Applies drug-gene-phenotype rules
- Determines risk labels and severity
- Provides confidence scores

### 4. LLM Service (`llm_service.py`)
- Generates clinical explanations
- Cites specific variants
- Explains biological mechanisms

### 5. Lookup Tables (`lookup_tables.py`)
- RSID to star allele mappings
- Diplotype to phenotype mappings
- Drug-gene-phenotype risk rules
- CPIC recommendations

## Supported Drugs & Genes

| Drug | Gene | Metabolizer Types |
|------|------|-------------------|
| CODEINE | CYP2D6 | PM, IM, NM, UM |
| WARFARIN | CYP2C9 | PM, IM, NM |
| CLOPIDOGREL | CYP2C19 | PM, IM, NM, RM, UM |
| SIMVASTATIN | SLCO1B1 | PM, IM, NM |
| AZATHIOPRINE | TPMT | PM, IM, NM |
| FLUOROURACIL | DPYD | PM, IM, NM |

## VCF File Requirements

- Format: VCF v4.2
- Size: ≤ 5MB
- Required INFO fields:
  - `GENE`: Gene symbol
  - `RS`: rsID
  - `STAR`: Star allele (optional)
- Required FORMAT field:
  - `GT`: Genotype

## Testing

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Notes

- LLM explanations are generated using OpenAI GPT-4
- Risk assessment is deterministic (rule-based)
- Phenotype determination follows CPIC guidelines
- All recommendations cite CPIC guidelines

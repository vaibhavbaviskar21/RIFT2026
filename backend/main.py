from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from datetime import datetime
import os

from models import DrugAnalysisResponse, RiskAssessment, PharmacogenomicProfile, ClinicalRecommendation, LLMExplanation, QualityMetrics
from vcf_parser import parse_vcf
from diplotype_analyzer import determine_diplotype
from risk_engine import assess_risk, get_recommendation
# from llm_service import generate_explanation
from lookup_tables import DRUG_GENE_RISK

app = FastAPI(title="Pharmacogenomics Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze", response_model=List[DrugAnalysisResponse])
async def analyze_pharmacogenomics(
    file: UploadFile = File(...),
    drugs: str = Form(...),
    patient_id: str = Form("PATIENT_001")
):
    """Analyze VCF file for pharmacogenomic risks"""
    
    # Validate file
    if not file.filename.endswith('.vcf'):
        raise HTTPException(status_code=400, detail="Only .vcf files allowed")
    
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB")
    
    # Parse VCF
    content = await file.read()
    variants, parsing_success = parse_vcf(content)
    
    if not parsing_success:
        raise HTTPException(status_code=400, detail="Failed to parse VCF file")
    
    # Parse drug list
    drug_list = [d.strip().upper() for d in drugs.split(',')]
    
    results = []
    
    for drug in drug_list:
        if drug not in DRUG_GENE_RISK:
            continue
        
        # Get target gene for drug
        gene = DRUG_GENE_RISK[drug]["gene"]
        
        # Determine diplotype and phenotype
        diplotype, phenotype = determine_diplotype(variants, gene)
        
        # Get gene-specific variants
        gene_variants = [v for v in variants if v.gene == gene]
        
        # Assess risk
        risk_data = assess_risk(drug, phenotype)
        
        # Get recommendation
        recommendation = get_recommendation(drug, phenotype)
        
        # Generate LLM explanation (fallback without OpenAI)
        variant_rsids = [v.rsid for v in gene_variants]
        llm_explanation = {
            "summary": f"Patient has {phenotype} phenotype for {gene}, resulting in {risk_data['risk_label']} risk with {drug}.",
            "mechanism_of_action": f"{gene} is responsible for metabolizing {drug}. The {phenotype} phenotype affects the rate of drug metabolism.",
            "variant_citations": variant_rsids,
            "confidence_statement": "Based on CPIC guidelines and detected genetic variants."
        }
        
        # Build response
        response = DrugAnalysisResponse(
            patient_id=patient_id,
            drug=drug,
            timestamp=datetime.utcnow().isoformat() + "Z",
            risk_assessment=RiskAssessment(
                risk_label=risk_data["risk_label"],
                confidence_score=risk_data["confidence"],
                severity=risk_data["severity"]
            ),
            pharmacogenomic_profile=PharmacogenomicProfile(
                primary_gene=gene,
                diplotype=diplotype,
                phenotype=phenotype,
                detected_variants=gene_variants
            ),
            clinical_recommendation=ClinicalRecommendation(**recommendation),
            llm_generated_explanation=LLMExplanation(**llm_explanation),
            quality_metrics=QualityMetrics(
                vcf_parsing_success=parsing_success,
                variants_analyzed=len(gene_variants),
                llm_response_generated=False
            )
        )
        
        results.append(response)
    
    return results

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pharmacogenomics-api"}

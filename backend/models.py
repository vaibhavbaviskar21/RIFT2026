from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime

class Variant(BaseModel):
    rsid: str
    gene: str
    star_allele: Optional[str] = None
    genotype: str
    chromosome: str
    position: int

class RiskAssessment(BaseModel):
    risk_label: str
    confidence_score: float
    severity: str

class PharmacogenomicProfile(BaseModel):
    primary_gene: str
    diplotype: str
    phenotype: str
    detected_variants: List[Variant]

class ClinicalRecommendation(BaseModel):
    guideline_reference: str
    recommended_action: str
    dose_adjustment: str

class LLMExplanation(BaseModel):
    summary: str
    mechanism_of_action: str
    variant_citations: List[str]
    confidence_statement: str

class QualityMetrics(BaseModel):
    vcf_parsing_success: bool
    variants_analyzed: int
    llm_response_generated: bool

class DrugAnalysisResponse(BaseModel):
    patient_id: str
    drug: str
    timestamp: str
    risk_assessment: RiskAssessment
    pharmacogenomic_profile: PharmacogenomicProfile
    clinical_recommendation: ClinicalRecommendation
    llm_generated_explanation: LLMExplanation
    quality_metrics: QualityMetrics

# Auth Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: str

# Drug Query Models
class DrugQueryRequest(BaseModel):
    drug_name: str

class DrugQueryResponse(BaseModel):
    drug: str
    risk_assessment: RiskAssessment
    recommendation: ClinicalRecommendation
    llm_explanation: LLMExplanation
    phenotype: str
    diplotype: str

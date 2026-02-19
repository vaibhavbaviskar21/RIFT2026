from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime
import os
import json
from dotenv import load_dotenv

load_dotenv()

from models import (
    DrugAnalysisResponse, RiskAssessment, PharmacogenomicProfile, 
    ClinicalRecommendation, LLMExplanation, QualityMetrics,
    SignupRequest, LoginRequest, AuthResponse, UserResponse,
    DrugQueryRequest, DrugQueryResponse, Variant
)
from vcf_parser import parse_vcf, variants_to_dict
from diplotype_analyzer import determine_diplotype
from risk_engine import assess_risk, get_recommendation
from llm_service import generate_drug_analysis, generate_explanation
from lookup_tables import DRUG_GENE_RISK
from database import db
from auth import hash_password, verify_password, create_access_token, decode_access_token

app = FastAPI(title="Pharmacogenomics Analysis API")
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Initialize database connection on startup"""
    await db.connect()
    print("Database connected successfully")

@app.on_event("shutdown")
async def shutdown():
    """Close database connection on shutdown"""
    try:
        await db.disconnect()
        print("Database disconnected")
    except:
        pass

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return current user"""
    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        user = await db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@app.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """User signup endpoint"""
    try:
        existing_user = await db.get_user_by_email(request.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        password_hash = hash_password(request.password)
        user = await db.create_user(
            email=request.email,
            password_hash=password_hash,
            full_name=request.full_name
        )
        
        access_token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
        
        return AuthResponse(
            access_token=access_token,
            user_id=str(user["id"]),
            email=user["email"],
            full_name=user["full_name"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")

@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """User login endpoint"""
    try:
        user = await db.get_user_by_email(request.email)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not verify_password(request.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        access_token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
        
        return AuthResponse(
            access_token=access_token,
            user_id=str(user["id"]),
            email=user["email"],
            full_name=user["full_name"]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.get("/auth/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        id=str(current_user["id"]),
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user["created_at"].isoformat()
    )

@app.post("/upload-vcf")
async def upload_vcf(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    """Upload and parse VCF file, save to database"""
    try:
        if not file.filename.endswith('.vcf'):
            raise HTTPException(status_code=400, detail="Only .vcf files allowed")
        
        content = await file.read()
        file_size = len(content)
        
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB")
        
        vcf_upload = await db.create_vcf_upload(
            user_id=str(current_user["id"]),
            filename=file.filename,
            file_size=file_size
        )
        
        variants, parsing_success, error_message = parse_vcf(content)
        
        if not parsing_success:
            await db.update_vcf_upload(str(vcf_upload["id"]), False, 0)
            raise HTTPException(status_code=400, detail=error_message or "Failed to parse VCF file")
        
        if not variants:
            await db.update_vcf_upload(str(vcf_upload["id"]), False, 0)
            raise HTTPException(status_code=400, detail="No pharmacogenomic variants found in VCF file")
        
        variant_dicts = variants_to_dict(variants)
        saved_count = await db.save_genetic_variants(
            user_id=str(current_user["id"]),
            vcf_upload_id=str(vcf_upload["id"]),
            variants=variant_dicts
        )
        
        await db.update_vcf_upload(str(vcf_upload["id"]), True, saved_count)
        
        genes_analyzed = set(v.gene for v in variants)
        pgx_profiles = []
        
        for gene in genes_analyzed:
            diplotype, phenotype = determine_diplotype(variants, gene)
            
            profile = await db.save_pgx_profile(
                user_id=str(current_user["id"]),
                gene=gene,
                diplotype=diplotype,
                phenotype=phenotype
            )
            pgx_profiles.append({
                "gene": gene,
                "diplotype": diplotype,
                "phenotype": phenotype
            })
        
        drug_analyses = []
        for drug, drug_data in DRUG_GENE_RISK.items():
            gene = drug_data["gene"]
            
            if gene not in genes_analyzed:
                continue
            
            gene_variants = [v for v in variants if v.gene == gene]
            diplotype, phenotype = determine_diplotype(gene_variants, gene)
            
            risk_data = assess_risk(drug, phenotype)
            recommendation = get_recommendation(drug, phenotype)
            
            variant_rsids = [v.rsid for v in gene_variants]
            llm_explanation = generate_explanation(
                drug=drug,
                gene=gene,
                diplotype=diplotype,
                phenotype=phenotype,
                variants=variant_rsids,
                guideline=recommendation["guideline_reference"],
                risk_label=risk_data["risk_label"]
            )
            
            await db.save_drug_analysis(
                user_id=str(current_user["id"]),
                drug=drug,
                gene=gene,
                risk_label=risk_data["risk_label"],
                severity=risk_data["severity"],
                confidence_score=risk_data["confidence"],
                phenotype=phenotype,
                diplotype=diplotype,
                recommendation=recommendation,
                llm_explanation=llm_explanation
            )
            
            drug_analyses.append({
                "drug": drug,
                "risk_label": risk_data["risk_label"],
                "severity": risk_data["severity"]
            })
        
        return {
            "message": "VCF file processed successfully",
            "upload_id": str(vcf_upload["id"]),
            "variants_saved": saved_count,
            "genes_analyzed": pgx_profiles,
            "drug_analyses": drug_analyses
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VCF upload failed: {str(e)}")

@app.post("/query-drug")
async def query_drug(request: DrugQueryRequest, current_user = Depends(get_current_user)):
    """Query any drug and get AI analysis based on user's genetic data"""
    try:
        drug_name = request.drug_name.strip()
        
        all_variants = await db.get_user_variants(str(current_user["id"]))
        
        if not all_variants:
            raise HTTPException(
                status_code=404, 
                detail="No genetic data found. Please upload your VCF file first."
            )
        
        variants_summary = [{
            "rsid": v["rsid"],
            "gene": v["gene"],
            "genotype": v["genotype"],
            "star_allele": v["star_allele"] if "star_allele" in v and v["star_allele"] else None
        } for v in all_variants]
        
        ai_response = generate_drug_analysis(drug_name, variants_summary)
        
        return {
            "drug": drug_name,
            "analysis": ai_response,
            "genes_analyzed": list(set(v["gene"] for v in all_variants))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Drug query failed: {str(e)}")

@app.get("/my-analyses")
async def get_my_analyses(current_user = Depends(get_current_user)):
    """Get all drug analyses for current user"""
    try:
        analyses = await db.get_all_drug_analyses(str(current_user["id"]))
        
        return {
            "user_id": str(current_user["id"]),
            "total_analyses": len(analyses),
            "analyses": [
                {
                    "drug": a["drug"],
                    "gene": a["gene"],
                    "risk_label": a["risk_label"],
                    "severity": a["severity"],
                    "phenotype": a["phenotype"],
                    "diplotype": a["diplotype"],
                    "created_at": a["created_at"].isoformat()
                }
                for a in analyses
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analyses: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Pharmacogenomics API", "docs": "/docs"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        if db.database:
            return {
                "status": "healthy", 
                "service": "pharmacogenomics-api",
                "database": "connected"
            }
        else:
            return {
                "status": "degraded",
                "service": "pharmacogenomics-api",
                "database": "disconnected"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "pharmacogenomics-api",
            "error": str(e)
        }

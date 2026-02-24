import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional
from llm_service import generate_explanation, generate_general_drug_analysis

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()

from models import (
    DrugQueryRequest, DrugAnalysisResponse, RiskAssessment,
    PharmacogenomicProfile, ClinicalRecommendation, LLMExplanation,
    QualityMetrics, SignupRequest, LoginRequest, AuthResponse, UserResponse,
    Variant
)
from vcf_parser import parse_vcf, variants_to_dict
from diplotype_analyzer import determine_diplotype
from risk_engine import assess_risk, get_recommendation
from llm_service import generate_explanation
from lookup_tables import DRUG_GENE_RISK
from database import db
from auth import hash_password, verify_password, create_access_token, decode_access_token

# --- Logging setup ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Rate limiter ---
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await db.connect()
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        logger.warning("Server will start but database operations will fail")
    yield
    # Shutdown
    await db.disconnect()
    logger.info("Database disconnected")

app = FastAPI(
    title="Pharmacogenomics Analysis API",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# --- Authentication dependency ---
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
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

# --- Auth endpoints ---
@app.post("/auth/signup", response_model=AuthResponse)
@limiter.limit("5/minute")
async def signup(request: Request, signup_req: SignupRequest):
    # ... (unchanged, but add request param for limiter)
    try:
        existing_user = await db.get_user_by_email(signup_req.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        password_hash = hash_password(signup_req.password)
        user = await db.create_user(
            email=signup_req.email,
            password_hash=password_hash,
            full_name=signup_req.full_name
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
        logger.error(f"Signup failed: {e}")
        raise HTTPException(status_code=500, detail="Signup failed")

@app.post("/auth/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, login_req: LoginRequest):
    # ... (unchanged, add limiter)
    try:
        user = await db.get_user_by_email(login_req.email)
        if not user or not verify_password(login_req.password, user["password"]):
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
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@app.get("/auth/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user["id"]),
        email=current_user["email"],
        full_name=current_user["full_name"],
        created_at=current_user["created_at"].isoformat()
    )

# --- VCF upload (now only saves variants and profiles) ---
@app.post("/upload-vcf")
@limiter.limit("5/minute")
async def upload_vcf(
    request: Request,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    try:
        if not file.filename.endswith('.vcf'):
            raise HTTPException(status_code=400, detail="Only .vcf files allowed")

        content = await file.read()
        file_size = len(content)
        if file_size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB")

        # Create upload record
        vcf_upload = await db.create_vcf_upload(
            user_id=str(current_user["id"]),
            filename=file.filename,
            file_size=file_size
        )

        # Parse VCF
        variants, parsing_success, error_message = parse_vcf(content)
        if not parsing_success:
            await db.update_vcf_upload(str(vcf_upload["id"]), False, 0)
            raise HTTPException(status_code=400, detail=error_message or "Failed to parse VCF")

        if not variants:
            await db.update_vcf_upload(str(vcf_upload["id"]), False, 0)
            raise HTTPException(status_code=400, detail="No pharmacogenomic variants found")

        # ------------------------------------------------------------------
        # REPLACE OLD DATA: Delete all existing variants and PGx profiles
        # for this user before inserting the new ones.
        # ------------------------------------------------------------------
        await db.delete_user_variants(str(current_user["id"]))
        await db.delete_user_pgx_profiles(str(current_user["id"]))

        # Save new variants to DB
        variant_dicts = variants_to_dict(variants)
        saved_count = await db.save_genetic_variants(
            user_id=str(current_user["id"]),
            vcf_upload_id=str(vcf_upload["id"]),
            variants=variant_dicts
        )
        await db.update_vcf_upload(str(vcf_upload["id"]), True, saved_count)

        # Determine diplotypes/phenotypes for each unique gene
        genes_analyzed = set(v.gene for v in variants)
        pgx_profiles = []
        for gene in genes_analyzed:
            diplotype, phenotype = determine_diplotype(variants, gene)
            await db.save_pgx_profile(
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

        return {
            "message": "VCF file processed successfully",
            "upload_id": str(vcf_upload["id"]),
            "variants_saved": saved_count,
            "genes_analyzed": pgx_profiles
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"VCF upload failed: {e}")
        raise HTTPException(status_code=500, detail="VCF upload failed")

# --- Drug query endpoint (now with rate limit and async LLM) ---
@app.post("/query-drug", response_model=DrugAnalysisResponse)
@limiter.limit("10/minute")
async def query_drug(
    request: Request,
    query_req: DrugQueryRequest,
    current_user = Depends(get_current_user)
):
    try:
        drug_name = query_req.drug_name.upper().strip()
        user_id = str(current_user["id"])

        if drug_name in DRUG_GENE_RISK:
            # --- Known drug ---
            gene = DRUG_GENE_RISK[drug_name]["gene"]
            variants_db = await db.get_user_variants(user_id, gene)
            if not variants_db:
                raise HTTPException(status_code=404, detail=f"No genetic data for {gene}. Upload VCF first.")

            # ✅ Correct Variant construction with keyword arguments
            variants = [
                Variant(
                    rsid=v["rsid"],
                    gene=v["gene"],
                    star_allele=v["star_allele"],
                    genotype=v["genotype"],
                    chromosome=v["chromosome"],
                    position=v["position"]
                )
                for v in variants_db
            ]

            diplotype, phenotype = determine_diplotype(variants, gene)
            risk_raw = assess_risk(drug_name, phenotype)
            recommendation = get_recommendation(drug_name, phenotype)
            variant_rsids = [v.rsid for v in variants]

            llm_explanation = await generate_explanation(
                drug=drug_name, gene=gene, diplotype=diplotype,
                phenotype=phenotype, variants=variant_rsids,
                guideline=recommendation["guideline_reference"],
                risk_label=risk_raw["risk_label"]
            )

            # Prepare risk_data with correct key 'confidence_score'
            risk_data = {
                "risk_label": risk_raw["risk_label"],
                "confidence_score": risk_raw["confidence"],
                "severity": risk_raw["severity"]
            }
            primary_gene = gene

        else:
            # --- Unknown drug ---
            all_variants_db = await db.get_user_variants(user_id)  # all genes
            if not all_variants_db:
                raise HTTPException(status_code=404, detail="No genetic data found. Upload VCF first.")

            # ✅ Correct Variant construction with keyword arguments
            all_variants = [
                Variant(
                    rsid=v["rsid"],
                    gene=v["gene"],
                    star_allele=v["star_allele"],
                    genotype=v["genotype"],
                    chromosome=v["chromosome"],
                    position=v["position"]
                )
                for v in all_variants_db
            ]

            llm_result = await generate_general_drug_analysis(drug_name, all_variants)

            # Map LLM result to expected structures
            risk_data = {
                "risk_label": llm_result["risk_label"],
                "confidence_score": llm_result["confidence"],   # renamed
                "severity": llm_result["severity"]
            }
            recommendation = {
                "guideline_reference": llm_result.get("guideline_reference", "AI‑generated"),
                "recommended_action": llm_result["recommended_action"],
                "dose_adjustment": llm_result.get("dose_adjustment", "")
            }
            llm_explanation = {k: llm_result[k] for k in ["summary", "mechanism_of_action", "variant_citations", "confidence_statement"]}
            diplotype = "Multiple"
            phenotype = "Assessed by AI"
            variants = all_variants
            primary_gene = "Multiple"

        # --- Build common response (using unpacking for models) ---
        return DrugAnalysisResponse(
            patient_id=user_id,
            drug=drug_name,
            timestamp=datetime.utcnow().isoformat() + "Z",
            risk_assessment=RiskAssessment(**risk_data),
            pharmacogenomic_profile=PharmacogenomicProfile(
                primary_gene=primary_gene,
                diplotype=diplotype,
                phenotype=phenotype,
                detected_variants=variants
            ),
            clinical_recommendation=ClinicalRecommendation(**recommendation),
            llm_generated_explanation=LLMExplanation(**llm_explanation),
            quality_metrics=QualityMetrics(
                vcf_parsing_success=True,
                variants_analyzed=len(variants),
                llm_response_generated=True
            )
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Drug query failed: {e}")
        raise HTTPException(status_code=500, detail="Drug query failed")
# --- Other endpoints (my-analyses, health) unchanged but add rate limiting if desired ---
@app.get("/my-analyses")
@limiter.limit("10/minute")
async def get_my_analyses(request: Request, current_user = Depends(get_current_user)):
    # ... unchanged
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

@app.get("/")
async def root():
    return {"message": "Pharmacogenomics API", "docs": "/docs"}

@app.get("/health")
async def health_check():
    try:
        if db.database:
            return {"status": "healthy", "database": "connected"}
        else:
            return {"status": "degraded", "database": "disconnected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
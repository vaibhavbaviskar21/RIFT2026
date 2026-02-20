from databases import Database
from typing import Optional, List, Dict
import os
from datetime import datetime

class DatabaseService:
    """
    Database service for managing pharmacogenomic data in PostgreSQL via Supabase.
    Handles user authentication, VCF uploads, genetic variants, and drug analyses.
    """
    
    def __init__(self):
        self.database: Optional[Database] = None
        
    async def connect(self):
        """Initialize async database connection pool"""
        try:
            database_url = os.getenv("DATABASE_URL")
            if not database_url:
                raise Exception("DATABASE_URL not found in environment variables")
            
            # Disable prepared statement cache — required for Supabase (PgBouncer)
            self.database = Database(database_url, statement_cache_size=0)
            await self.database.connect()
            return True
        except Exception as e:
            print(f"Database connection error: {e}")
            raise Exception(f"Failed to connect to database: {str(e)}")
    
    async def disconnect(self):
        """Close database connection pool"""
        try:
            if self.database:
                await self.database.disconnect()
        except Exception as e:
            print(f"Database disconnect error: {e}")
    
    async def create_user(self, email: str, password_hash: str, full_name: Optional[str] = None):
        """Create a new user"""
        try:
            query = """
                INSERT INTO users (email, password, full_name)
                VALUES (:email, :password, :full_name)
                RETURNING id, email, full_name, created_at, updated_at
            """
            user = await self.database.fetch_one(
                query=query,
                values={"email": email, "password": password_hash, "full_name": full_name}
            )
            return user
        except Exception as e:
            raise Exception(f"Failed to create user: {str(e)}")
    
    async def get_user_by_email(self, email: str):
        """Get user by email"""
        try:
            query = "SELECT * FROM users WHERE email = :email"
            user = await self.database.fetch_one(query=query, values={"email": email})
            return user
        except Exception as e:
            raise Exception(f"Failed to get user: {str(e)}")
    
    async def get_user_by_id(self, user_id: str):
        """Get user by ID"""
        try:
            query = "SELECT * FROM users WHERE id = :user_id"
            user = await self.database.fetch_one(query=query, values={"user_id": user_id})
            return user
        except Exception as e:
            raise Exception(f"Failed to get user: {str(e)}")
    
    async def create_vcf_upload(self, user_id: str, filename: str, file_size: int):
        """Create VCF upload record"""
        try:
            query = """
                INSERT INTO vcf_uploads (user_id, filename, file_size)
                VALUES (:user_id, :filename, :file_size)
                RETURNING id, user_id, filename, upload_date, file_size, parsing_success, total_variants
            """
            upload = await self.database.fetch_one(
                query=query,
                values={"user_id": user_id, "filename": filename, "file_size": file_size}
            )
            return upload
        except Exception as e:
            raise Exception(f"Failed to create VCF upload: {str(e)}")
    
    async def update_vcf_upload(self, upload_id: str, parsing_success: bool, total_variants: int):
        """Update VCF upload status"""
        try:
            query = """
                UPDATE vcf_uploads 
                SET parsing_success = :parsing_success, total_variants = :total_variants
                WHERE id = :upload_id
                RETURNING id
            """
            upload = await self.database.fetch_one(
                query=query,
                values={"upload_id": upload_id, "parsing_success": parsing_success, "total_variants": total_variants}
            )
            return upload
        except Exception as e:
            raise Exception(f"Failed to update VCF upload: {str(e)}")
    
    async def save_genetic_variants(self, user_id: str, vcf_upload_id: str, variants: List[Dict]):
        """Save genetic variants in bulk"""
        try:
            query = """
                INSERT INTO genetic_variants 
                (user_id, vcf_upload_id, rsid, gene, star_allele, genotype, chromosome, position)
                VALUES (:user_id, :vcf_upload_id, :rsid, :gene, :star_allele, :genotype, :chromosome, :position)
            """
            
            values = [
                {
                    "user_id": user_id,
                    "vcf_upload_id": vcf_upload_id,
                    "rsid": v["rsid"],
                    "gene": v["gene"],
                    "star_allele": v.get("star_allele"),
                    "genotype": v["genotype"],
                    "chromosome": v["chromosome"],
                    "position": v["position"]
                }
                for v in variants
            ]
            
            if values:
                await self.database.execute_many(query=query, values=values)
            
            return len(variants)
        except Exception as e:
            raise Exception(f"Failed to save genetic variants: {str(e)}")
    
    async def save_pgx_profile(self, user_id: str, gene: str, diplotype: str, phenotype: str, activity_score: Optional[float] = None):
        """Save or update pharmacogenomic profile"""
        try:
            query = """
                INSERT INTO user_pgx_profiles (user_id, gene, diplotype, phenotype, activity_score)
                VALUES (:user_id, :gene, :diplotype, :phenotype, :activity_score)
                ON CONFLICT (user_id, gene) 
                DO UPDATE SET diplotype = :diplotype, phenotype = :phenotype, 
                              activity_score = :activity_score, updated_at = NOW()
                RETURNING id
            """
            profile = await self.database.fetch_one(
                query=query,
                values={
                    "user_id": user_id,
                    "gene": gene,
                    "diplotype": diplotype,
                    "phenotype": phenotype,
                    "activity_score": activity_score
                }
            )
            return profile
        except Exception as e:
            raise Exception(f"Failed to save PGx profile: {str(e)}")
    
    async def save_drug_analysis(self, user_id: str, drug: str, gene: str, risk_label: str, 
                                 severity: str, confidence_score: float, phenotype: str, 
                                 diplotype: str, recommendation: Dict, llm_explanation: Dict):
        """Save or update drug analysis"""
        try:
            import json
            query = """
                INSERT INTO drug_analyses 
                (user_id, drug, gene, risk_label, severity, confidence_score, phenotype, diplotype, recommendation, llm_explanation)
                VALUES (:user_id, :drug, :gene, :risk_label, :severity, :confidence_score, :phenotype, :diplotype, :recommendation, :llm_explanation)
                ON CONFLICT (user_id, drug) 
                DO UPDATE SET gene = :gene, risk_label = :risk_label, severity = :severity,
                              confidence_score = :confidence_score, phenotype = :phenotype,
                              diplotype = :diplotype, recommendation = :recommendation,
                              llm_explanation = :llm_explanation, created_at = NOW()
                RETURNING id
            """
            analysis = await self.database.fetch_one(
                query=query,
                values={
                    "user_id": user_id,
                    "drug": drug,
                    "gene": gene,
                    "risk_label": risk_label,
                    "severity": severity,
                    "confidence_score": confidence_score,
                    "phenotype": phenotype,
                    "diplotype": diplotype,
                    "recommendation": json.dumps(recommendation),
                    "llm_explanation": json.dumps(llm_explanation)
                }
            )
            return analysis
        except Exception as e:
            raise Exception(f"Failed to save drug analysis: {str(e)}")
    
    async def get_user_variants(self, user_id: str, gene: Optional[str] = None):
        """Get user's genetic variants"""
        try:
            if gene:
                query = "SELECT * FROM genetic_variants WHERE user_id = :user_id AND gene = :gene"
                variants = await self.database.fetch_all(query=query, values={"user_id": user_id, "gene": gene})
            else:
                query = "SELECT * FROM genetic_variants WHERE user_id = :user_id"
                variants = await self.database.fetch_all(query=query, values={"user_id": user_id})
            
            return variants
        except Exception as e:
            raise Exception(f"Failed to get variants: {str(e)}")
    
    async def get_drug_analysis(self, user_id: str, drug: str):
        """Get drug analysis for user"""
        try:
            query = "SELECT * FROM drug_analyses WHERE user_id = :user_id AND drug = :drug"
            analysis = await self.database.fetch_one(query=query, values={"user_id": user_id, "drug": drug})
            return analysis
        except Exception as e:
            raise Exception(f"Failed to get drug analysis: {str(e)}")
    
    async def get_all_drug_analyses(self, user_id: str):
        """Get all drug analyses for user"""
        try:
            query = "SELECT * FROM drug_analyses WHERE user_id = :user_id ORDER BY created_at DESC"
            analyses = await self.database.fetch_all(query=query, values={"user_id": user_id})
            return analyses
        except Exception as e:
            raise Exception(f"Failed to get drug analyses: {str(e)}")

db = DatabaseService()

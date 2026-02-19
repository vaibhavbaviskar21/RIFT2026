import os
from openrouter import OpenRouter
from typing import Dict, List
import json

client = OpenRouter(
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
    server_url="https://ai.hackclub.com/proxy/v1"
)

def generate_drug_analysis(drug_name: str, variants: List[Dict]) -> Dict:
    """Generate AI analysis for any drug based on user's genetic data"""
    
    fallback = {
        "risk_label": "Unknown",
        "severity": "Unknown",
        "confidence_score": 0.0,
        "recommendation": {
            "action": "Consult healthcare provider",
            "details": f"Unable to generate analysis for {drug_name}. Please check your API configuration."
        },
        "explanation": f"Analysis unavailable for {drug_name}. Please ensure API key is configured."
    }
    
    if not os.getenv("OPENROUTER_API_KEY"):
        return fallback
    
    variants_text = "\n".join([
        f"- {v['rsid']} in {v['gene']}: {v['genotype']}" + 
        (f" (allele: {v['star_allele']})" if v.get('star_allele') else "")
        for v in variants
    ])
    
    genes = ", ".join(set(v['gene'] for v in variants))
    
    prompt = f"""You are a clinical pharmacogenomics expert. Analyze how the drug {drug_name} interacts with the patient's genetic profile.

**PATIENT'S GENETIC DATA:**
{variants_text}

**Genes Available:** {genes}

**YOUR TASK:**
Provide a comprehensive pharmacogenomic analysis of {drug_name} for THIS patient:

1. Identify which genes (from the patient's data) are relevant to {drug_name} metabolism
2. Explain how the patient's specific variants affect {drug_name} efficacy and safety
3. Provide personalized recommendations for dosing or alternatives
4. Assess the risk level: choose ONE from (Safe, Adjust Dosage, Toxic Risk, Ineffective, No Interaction)
5. Assess severity: choose ONE from (Low, Medium, High, Critical)
6. Provide confidence score (0.0 to 1.0)
7. Cite relevant clinical guidelines (CPIC, FDA, etc.)

Be specific to THIS patient's genetic variants. If {drug_name} doesn't interact with their available genes, use "No Interaction" risk label.

**Output Format (JSON only):**
{{
  "risk_label": "Safe|Adjust Dosage|Toxic Risk|Ineffective|No Interaction",
  "severity": "Low|Medium|High|Critical",
  "confidence_score": 0.85,
  "recommendation": {{
    "action": "Brief action statement",
    "details": "Detailed clinical recommendation with dosing guidance"
  }},
  "explanation": "Comprehensive explanation of how patient's genetic variants affect this drug"
}}

Return ONLY valid JSON, no markdown or additional text."""

    try:
        response = client.chat.send(
            model="qwen/qwen-2.5-72b-instruct",
            messages=[
                {"role": "system", "content": "You are a pharmacogenomics expert providing personalized drug analysis. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            stream=False
        )
        
        content = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()
        
        result = json.loads(content)
        
        # Validate required fields
        required = ["risk_label", "severity", "confidence_score", "recommendation", "explanation"]
        if not all(field in result for field in required):
            print(f"LLM response missing required fields")
            return fallback
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"LLM JSON parsing error: {e}")
        print(f"Content received: {content if 'content' in locals() else 'No content'}")
        return fallback
    except Exception as e:
        print(f"LLM generation error: {e}")
        import traceback
        traceback.print_exc()
        return fallback

def _get_phenotype_description(phenotype: str) -> str:
    """Get human-readable description of phenotype"""
    descriptions = {
        "PM": "Poor Metabolizer - significantly reduced enzyme activity",
        "IM": "Intermediate Metabolizer - reduced enzyme activity",
        "NM": "Normal Metabolizer - normal enzyme activity",
        "RM": "Rapid Metabolizer - increased enzyme activity",
        "UM": "Ultrarapid Metabolizer - significantly increased enzyme activity"
    }
    return descriptions.get(phenotype, "Unknown metabolizer status")

def generate_explanation(
    drug: str,
    gene: str,
    diplotype: str,
    phenotype: str,
    variants: List[str],
    guideline: str,
    risk_label: str
) -> Dict:
    """Generate LLM-powered clinical explanation for pharmacogenomic analysis"""
    
    fallback = {
        "summary": f"Patient has {phenotype} phenotype for {gene}, resulting in {risk_label} risk with {drug}.",
        "mechanism_of_action": f"{gene} metabolizes {drug}. {phenotype} phenotype affects drug metabolism.",
        "variant_citations": variants,
        "confidence_statement": "Based on CPIC guidelines and detected variants."
    }
    
    if not os.getenv("OPENROUTER_API_KEY"):
        return fallback
    
    prompt = f"""You are a clinical pharmacogenomics expert providing personalized drug analysis based on patient genetic data.

**PATIENT'S GENETIC DATA (Retrieved from their VCF file):**
- Drug Being Analyzed: {drug}
- Metabolizing Gene: {gene}
- Patient's Diplotype: {diplotype}
- Patient's Phenotype: {phenotype} ({_get_phenotype_description(phenotype)})
- Patient's Detected Variants: {', '.join(variants) if variants else 'None detected'}

**CLINICAL RISK ASSESSMENT:**
- Risk Level: {risk_label}
- Clinical Guideline: {guideline}

**YOUR TASK:**
Provide a comprehensive, personalized analysis of how THIS SPECIFIC PATIENT'S genetic makeup affects their response to {drug}.

1. **Summary**: Explain in 2-3 sentences how the patient's specific variants ({', '.join(variants) if variants else 'their genetic profile'}) and {phenotype} phenotype affect their {drug} metabolism and why this results in {risk_label} risk.

2. **Mechanism of Action**: Describe in detail:
   - How {gene} normally metabolizes {drug}
   - How the patient's {diplotype} diplotype and {phenotype} phenotype specifically alter this metabolism
   - What clinical effects this has on drug efficacy and safety for THIS patient

3. **Variant Analysis**: Reference the patient's specific variants ({', '.join(variants) if variants else 'genetic profile'}) and explain their functional impact.

4. **Confidence Statement**: Explain the evidence quality based on {guideline} and the patient's variant detection.

**IMPORTANT**: Make this analysis PERSONAL to the patient's genetic data. Don't give generic information.

**Output Format (JSON only):**
{{
  "summary": "Personalized 2-3 sentence summary explaining THIS patient's specific risk based on their genetic variants",
  "mechanism_of_action": "Detailed explanation of how THIS patient's {diplotype} and {phenotype} specifically affects {drug} metabolism",
  "variant_citations": {json.dumps(variants)},
  "confidence_statement": "Evidence quality statement based on CPIC guidelines and this patient's variant detection"
}}

Return ONLY valid JSON, no markdown or additional text."""

    try:
        response = client.chat.send(
            model="qwen/qwen-2.5-72b-instruct",
            messages=[
                {"role": "system", "content": "You are a pharmacogenomics expert providing evidence-based clinical interpretations. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            stream=False
        )
        
        content = response.choices[0].message.content.strip()
        result = json.loads(content)
        
        required_fields = ["summary", "mechanism_of_action", "variant_citations", "confidence_statement"]
        if not all(field in result for field in required_fields):
            print(f"LLM response missing required fields, using fallback")
            return fallback
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"LLM JSON parsing error: {e}")
        return fallback
    except Exception as e:
        print(f"LLM generation error: {e}")
        return fallback

def generate_comprehensive_analysis(variants: List[Dict], pgx_profiles: List[Dict]) -> Dict:
    """Generate comprehensive genetic analysis with harmful/safe drugs"""
    
    fallback = {
        "harmful_drugs": [],
        "safe_drugs": [],
        "recommendations": {
            "lifestyle": "Consult healthcare provider for personalized recommendations.",
            "monitoring": "Regular health checkups recommended."
        },
        "full_report": "Unable to generate comprehensive analysis. Please check API configuration."
    }
    
    if not os.getenv("OPENROUTER_API_KEY"):
        return fallback
    
    variants_text = "\n".join([
        f"- {v['rsid']} in {v['gene']}: {v['genotype']}" + 
        (f" (allele: {v['star_allele']})" if v.get('star_allele') else "")
        for v in variants[:20]
    ])
    
    profiles_text = "\n".join([
        f"- {p['gene']}: {p['diplotype']} ({p['phenotype']} metabolizer)"
        for p in pgx_profiles
    ])
    
    prompt = f"""You are a clinical pharmacogenomics expert. Analyze this patient's complete genetic profile to identify ALL medications they should avoid or use with caution.

**PATIENT'S COMPLETE GENETIC PROFILE:**

**Detected Variants:**
{variants_text}

**Pharmacogenomic Profiles:**
{profiles_text}

**YOUR TASK:**
Provide a COMPREHENSIVE analysis covering:

1. **Harmful/High-Risk Medications**: List ALL medications this patient should NEVER take or use with extreme caution based on their genetic profile. Include:
   - Drug name
   - Why it's dangerous for THIS patient
   - Specific genetic reason (gene + phenotype)
   - Severity level (Critical/High/Moderate)

2. **Safe Medications**: List medications that are SAFE for this patient based on their genetic profile

3. **Clinical Recommendations**:
   - Lifestyle modifications
   - Monitoring requirements
   - Alternative medication classes to consider
   - What to tell their doctor

4. **Full Report**: Comprehensive summary explaining their overall pharmacogenomic risk profile

**IMPORTANT**: Be thorough and specific. This is a one-time comprehensive analysis.

**Output Format (JSON only):**
{{
  "harmful_drugs": [
    {{
      "drug": "Drug name",
      "reason": "Why dangerous for this patient",
      "gene": "Relevant gene",
      "phenotype": "Patient's phenotype",
      "severity": "Critical|High|Moderate",
      "alternatives": "Suggested alternatives"
    }}
  ],
  "safe_drugs": [
    {{
      "drug": "Drug name",
      "reason": "Why safe for this patient",
      "gene": "Relevant gene"
    }}
  ],
  "recommendations": {{
    "lifestyle": "Lifestyle recommendations",
    "monitoring": "What to monitor",
    "doctor_discussion": "Key points to discuss with doctor"
  }},
  "full_report": "Comprehensive 3-4 paragraph summary of patient's pharmacogenomic profile and overall risk assessment"
}}

Return ONLY valid JSON, no markdown."""

    try:
        response = client.chat.send(
            model="qwen/qwen-2.5-72b-instruct",
            messages=[
                {"role": "system", "content": "You are a pharmacogenomics expert providing comprehensive genetic analysis. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            stream=False
        )
        
        content = response.choices[0].message.content.strip()
        
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
            content = content.strip()
        
        result = json.loads(content)
        
        required = ["harmful_drugs", "safe_drugs", "recommendations", "full_report"]
        if not all(field in result for field in required):
            print(f"LLM response missing required fields")
            return fallback
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"LLM JSON parsing error: {e}")
        return fallback
    except Exception as e:
        print(f"LLM generation error: {e}")
        return fallback

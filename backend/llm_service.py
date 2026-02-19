import os
from openrouter import OpenRouter
from typing import Dict, List
import json

client = OpenRouter(
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
    server_url="https://ai.hackclub.com/proxy/v1"
)

def generate_drug_analysis(drug_name: str, variants: List[Dict]) -> str:
    """Generate AI analysis for any drug based on user's genetic data"""
    
    fallback = f"Unable to generate analysis for {drug_name}. Please check your API key."
    
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
4. Assess the risk level (Safe/Adjust Dosage/Toxic/Ineffective)
5. Cite relevant clinical guidelines (CPIC, FDA, etc.)

Be specific to THIS patient's genetic variants. If {drug_name} doesn't interact with their available genes, explain that clearly.

Provide a detailed, actionable clinical analysis."""

    try:
        response = client.chat.send(
            model="qwen/qwen-2.5-72b-instruct",
            messages=[
                {"role": "system", "content": "You are a pharmacogenomics expert providing personalized drug analysis."},
                {"role": "user", "content": prompt}
            ],
            stream=False
        )
        
        return response.choices[0].message.content.strip()
        
    except Exception as e:
        print(f"LLM generation error: {e}")
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
    """
    Generate LLM-powered clinical explanation for pharmacogenomic analysis.
    
    Uses RAG approach:
    1. Retrieves patient genetic data (variants, diplotype, phenotype)
    2. Augments with clinical guidelines and risk assessment
    3. Generates contextualized explanation via LLM
    
    Args:
        drug: Drug name being analyzed
        gene: Primary metabolizing gene
        diplotype: Patient's gene diplotype (e.g., *1/*2)
        phenotype: Metabolizer phenotype (PM/IM/NM/RM/UM)
        variants: List of detected variant rsIDs
        guideline: CPIC guideline reference
        risk_label: Computed risk level
    
    Returns:
        Dict with summary, mechanism_of_action, variant_citations, confidence_statement
    """
    
    # Fallback response if no API key
    fallback = {
        "summary": f"Patient has {phenotype} phenotype for {gene}, resulting in {risk_label} risk with {drug}.",
        "mechanism_of_action": f"{gene} metabolizes {drug}. {phenotype} phenotype affects drug metabolism.",
        "variant_citations": variants,
        "confidence_statement": "Based on CPIC guidelines and detected variants."
    }
    
    if not os.getenv("OPENROUTER_API_KEY"):
        return fallback
    
    # RAG: Construct context-rich prompt with retrieved patient data + clinical knowledge
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
        # Generate LLM response with optimized parameters
        response = client.chat.send(
            model="qwen/qwen-2.5-72b-instruct",
            messages=[
                {"role": "system", "content": "You are a pharmacogenomics expert providing evidence-based clinical interpretations. Always return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            stream=False
        )
        
        content = response.choices[0].message.content.strip()
        
        # Parse and validate JSON response
        result = json.loads(content)
        
        # Ensure all required fields are present
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

import os
import json
import logging
from models import Variant
from typing import Dict, List
from openai import AsyncOpenAI
from dotenv import load_dotenv 
from pathlib import Path
current_dir = Path(__file__).parent.absolute()
env_path = current_dir / '.env'

# Load .env explicitly from the backend directory
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger(__name__)

# Debug: check API key
api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
if api_key:
    logger.info(f"✅ API key loaded. First 10 chars: {api_key[:10]}")
else:
    logger.error(f"❌ No API key found in environment. Tried loading from: {env_path}")


load_dotenv()
logger = logging.getLogger(__name__)

# Debug: Print API key status
api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
if api_key:
    logger.info(f"✅ API key found. First 10 chars: {api_key[:10]}")
else:
    logger.error("❌ No API key found in environment! Check .env file.")

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", os.getenv("OPENAI_API_KEY", "")),
    default_headers={
        "HTTP-Referer": "https://your-app-url.com",  # Replace with your actual URL
        "X-Title": "PharmaGuard",
    }
)

async def generate_explanation(
    drug: str,
    gene: str,
    diplotype: str,
    phenotype: str,
    variants: List[str],
    guideline: str,
    risk_label: str
) -> Dict:
    """Generate clinical explanation using LLM (async)."""
    fallback_response = {
        "summary": f"Patient genetics indicate a {risk_label} profile for {drug} based on {gene} metabolism. Clinical correlation required.",
        "mechanism_of_action": f"The {gene} gene produces enzymes responsible for metabolizing {drug}. The {phenotype} status suggests altered enzymatic activity.",
        "variant_citations": variants if variants else ["Clinical findings based on phenotype"],
        "confidence_statement": "Fallback: Automated risk assessment based on CPIC guidelines."
    }

    if not os.getenv("OPENROUTER_API_KEY") and not os.getenv("OPENAI_API_KEY"):
        logger.warning("No API key found, returning fallback")
        return fallback_response

    try:
        system_prompt = "You are an expert clinical geneticist."
        user_prompt = f"""
        Analyze the following pharmacogenomic result:
        
        - Drug: {drug}
        - Gene: {gene}
        - Phenotype: {phenotype}
        - Diplotype: {diplotype}
        - Risk Label: {risk_label}
        - Detected Variants: {', '.join(variants)}
        
        Task:
        1. Return exactly 2-3 sentences explaining the biological mechanism of why this specific variant affects this drug's metabolism.
        2. You MUST cite the specific variant (e.g. "{diplotype} results in...") in your explanation.
        3. Provide a mechanism of action.
        
        Output Requirement:
        Return a JSON object valid for the following structure:
        {{
            "summary": "2-3 sentences clinical explanation...",
            "mechanism_of_action": "Technical biological description...",
            "variant_citations": ["List of variants cited..."],
            "confidence_statement": "High/Moderate/Low based on..."
        }}
        """

        response = await client.chat.completions.create(
            model="openai/gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=300
        )

        content = response.choices[0].message.content
        if not content:
            return fallback_response

        result = json.loads(content)
        required_keys = ["summary", "mechanism_of_action", "variant_citations", "confidence_statement"]
        for key in required_keys:
            if key not in result:
                result[key] = fallback_response[key]
        return result

    except Exception as e:
        logger.error(f"LLM Service Error: {e}")
        return fallback_response
async def generate_general_drug_analysis(drug: str, variants: List[Variant]) -> Dict:
    """
    Use LLM to assess a drug based on all user variants (any gene).
    Returns a dict with keys:
        risk_label, confidence, severity,
        recommended_action, dose_adjustment (optional guideline_reference),
        summary, mechanism_of_action, variant_citations, confidence_statement
    """
    fallback = {
        "risk_label": "Unknown",
        "confidence": 0.0,
        "severity": "none",
        "recommended_action": "Consult a healthcare provider",
        "dose_adjustment": "Standard dosing with caution",
        "summary": f"No specific genetic data available for {drug}. Clinical judgment required.",
        "mechanism_of_action": "Insufficient data to determine mechanism.",
        "variant_citations": [],
        "confidence_statement": "Low confidence – no predefined gene‑drug association."
    }

    if not variants:
        return fallback

    # Build a concise description of the user's variants
    variants_text = "\n".join([
        f"- {v.rsid} ({v.gene}): {v.genotype} (allele {v.star_allele or 'unknown'})"
        for v in variants[:20]  # limit to avoid huge prompts
    ])
    if len(variants) > 20:
        variants_text += f"\n... and {len(variants)-20} more variants."

    system_prompt = "You are an expert clinical pharmacogenomics consultant."
    user_prompt = f"""
    A patient has the following genetic variants:
    {variants_text}

    They are considering taking the drug: {drug}.

    Based on your knowledge of pharmacogenomics, answer these questions:
    1. Which of the patient's genes (if any) are known to affect the metabolism or response to {drug}?
    2. What is the likely risk (e.g., "Toxic", "Ineffective", "Adjust Dosage", "Safe")? Provide a confidence score (0-1) and severity ("none","low","moderate","high","critical").
    3. Provide a specific recommended action and, if applicable, a dose adjustment suggestion.
    4. Write a short 2‑3 sentence clinical summary explaining the biological mechanism.
    5. List the specific variants (RSIDs) that contributed to this assessment.

    Return a JSON object with exactly these fields:
    {{
        "risk_label": "string",
        "confidence": float,
        "severity": "string",
        "recommended_action": "string",
        "dose_adjustment": "string",
        "summary": "string",
        "mechanism_of_action": "string",
        "variant_citations": ["rs123", "rs456"],
        "confidence_statement": "string"
    }}
    """

    try:
        response = await client.chat.completions.create(
            model="openai/gpt-4o",  # or another capable model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=500
        )
        content = response.choices[0].message.content
        if not content:
            return fallback
        result = json.loads(content)
        # Ensure all expected keys exist
        expected_keys = ["risk_label", "confidence", "severity", "recommended_action", 
                         "dose_adjustment", "summary", "mechanism_of_action", 
                         "variant_citations", "confidence_statement"]
        for key in expected_keys:
            if key not in result:
                result[key] = fallback.get(key, "")
        return result
    except Exception as e:
        logger.error(f"General LLM drug analysis failed: {e}")
        return fallback
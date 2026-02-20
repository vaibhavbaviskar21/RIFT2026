import os
import json
import google.generativeai as genai
from typing import Dict, List

# Initialize Google Gemini SDK
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("OPENROUTER_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def generate_explanation_gemini(
    drug: str,
    gene: str,
    diplotype: str,
    phenotype: str,
    variants: List[str],
    guideline: str,
    risk_label: str
) -> Dict:
    """
    Generates a clinical biological explanation using the native Google Gemini SDK.
    This replaces the OpenRouter/OpenAI based service to avoid consistent API errors.
    """
    
    fallback_response = {
        "summary": f"Pharmacogenomic analysis reveals a {risk_label} metabolic profile for {drug} mediated by the {gene} gene ({diplotype}).",
        "mechanism_of_action": f"The {gene} genotype dictates the enzymatic conversion of {drug}. Current results suggest {phenotype} status.",
        "variant_citations": variants if variants else ["Clinical data based on diplotype"],
        "confidence_statement": "Provider-based risk assessment."
    }

    if not api_key:
        print("❌ Gemini Service Error: No GOOGLE_API_KEY or OPENROUTER_API_KEY found.")
        return fallback_response

    try:
        model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        model = genai.GenerativeModel(model_name)
        
        prompt = f"""
        You are a Clinical Pharmacogenomics Expert.
        
        Analyze this result:
        - Drug: {drug}
        - Gene: {gene}
        - Phenotype: {phenotype}
        - Diplotype: {diplotype}
        - Risk Level: {risk_label}
        - RSIDs: {', '.join(variants)}
        
        Task:
        1. Explain the biological mechanism of why this diplotype affects this drug.
        2. Keep it to 2-3 professional sentences.
        3. Mention the specific Gene ({gene}) and Drug ({drug}).
        
        Output MUST be valid JSON with these keys:
        {{
            "summary": "...",
            "mechanism_of_action": "...",
            "variant_citations": ["..."],
            "confidence_statement": "..."
        }}
        """

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                candidate_count=1,
                max_output_tokens=500,
                temperature=0.2,
                response_mime_type="application/json"
            )
        )

        if not response.text:
            return fallback_response

        result = json.loads(response.text)
        
        # Ensure all keys exist
        for key in ["summary", "mechanism_of_action", "variant_citations", "confidence_statement"]:
            if key not in result:
                result[key] = fallback_response[key]
                
        return result

    except Exception as e:
        print(f"❌ Gemini SDK Error: {str(e)}")
        return fallback_response

import os
import json
from openai import OpenAI
from typing import Dict, List

# Initialize Client (Support for OpenRouter & OpenAI)
api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY", "")
base_url = "https://openrouter.ai/api/v1" if os.getenv("OPENROUTER_API_KEY") else None

client = OpenAI(api_key=api_key, base_url=base_url)

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
    Generates a highly accurate, clinical biological explanation for pharmacogenomic analysis.
    
    Wraps the OpenAI API call in a safety block to ensure the API never crashes.
    Returns a dictionary matching the LLMExplanation Pydantic model.
    """
    
    # ---------------------------------------------------------
    # CRITICAL FALLBACK (Safe Demo Mode)
    # ---------------------------------------------------------
    fallback_response = {
        "summary": f"Patient genetics indicate a {risk_label} profile for {drug} based on {gene} metabolism. Clinical correlation required.",
        "mechanism_of_action": f"The {gene} gene produces enzymes responsible for metabolizing {drug}. The {phenotype} status suggests altered enzymatic activity.",
        "variant_citations": variants if variants else ["Clinical findings based on phenotype"],
        "confidence_statement": "Fallback: Automated risk assessment based on CPIC guidelines."
    }

    # Ensure API Key exists before attempting call
    if not api_key:
        print("❌ LLM Service Error: No API Key found (OPENAI_API_KEY or OPENROUTER_API_KEY)")
        return fallback_response

    try:
        # ---------------------------------------------------------
        # 2. Strict Rules for the LLM Prompt
        # ---------------------------------------------------------
        
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

        # Prepare completion parameters
        kwargs = {
            "model": os.getenv("LLM_MODEL", "google/gemini-2.0-flash-001"),
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 500
        }

        # Some providers/models on OpenRouter don't support response_format
        # We'll try to use it but catch the error if it fails
        try:
            response = client.chat.completions.create(
                **kwargs,
                response_format={"type": "json_object"} if "gemini" not in kwargs["model"].lower() else None
            )
        except Exception:
            response = client.chat.completions.create(**kwargs)

        content = response.choices[0].message.content
        if not content:
            return fallback_response

        # Parse JSON output (handle markdown blocks if present)
        clean_content = content.strip()
        if clean_content.startswith("```json"):
            clean_content = clean_content.replace("```json", "", 1).rsplit("```", 1)[0].strip()
        elif clean_content.startswith("```"):
            clean_content = clean_content.replace("```", "", 1).rsplit("```", 1)[0].strip()
            
        try:
            result = json.loads(clean_content)
        except json.JSONDecodeError:
            print(f"❌ Failed to parse LLM JSON: {clean_content[:100]}...")
            return fallback_response
        
        # Validate keys exist for Pydantic model
        required_keys = ["summary", "mechanism_of_action", "variant_citations", "confidence_statement"]
        for key in required_keys:
            if key not in result:
                result[key] = fallback_response.get(key, "Information unavailable")

        return result

    except Exception as e:
        # Failsafe: Log error and return fallback to prevent crash
        print(f"❌ LLM Service Error: {str(e)}")
        return fallback_response

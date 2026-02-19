import os
import json
from openai import OpenAI
from typing import Dict, List

# Initialize OpenAI Client
# Uses the API key from environment variables
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

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
    if not os.getenv("OPENAI_API_KEY"):
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

        # ---------------------------------------------------------
        # 3. Safe Integration & Error Handling
        # ---------------------------------------------------------
        response = client.chat.completions.create(
            model="gpt-4o",  # Using gpt-4o for JSON mode support & accuracy
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3, # Low temperature for clinical consistency
            max_tokens=300
        )

        content = response.choices[0].message.content
        if not content:
            return fallback_response

        # Parse JSON output
        result = json.loads(content)
        
        # Validate keys exist for Pydantic model
        required_keys = ["summary", "mechanism_of_action", "variant_citations", "confidence_statement"]
        for key in required_keys:
            if key not in result:
                result[key] = fallback_response[key]

        return result

    except Exception as e:
        # Failsafe: Log error and return fallback to prevent crash
        print(f"❌ LLM Service Error: {str(e)}")
        return fallback_response

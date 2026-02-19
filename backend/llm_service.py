import os
from openai import OpenAI
from typing import Dict, List
import json

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
    """Generate LLM explanation for pharmacogenomic result"""
    
    if not os.getenv("OPENAI_API_KEY"):
        return {
            "summary": f"Patient has {phenotype} phenotype for {gene}, resulting in {risk_label} risk with {drug}.",
            "mechanism_of_action": f"{gene} metabolizes {drug}. {phenotype} phenotype affects drug metabolism.",
            "variant_citations": variants,
            "confidence_statement": "Based on CPIC guidelines and detected variants."
        }
    
    prompt = f"""You are a clinical pharmacogenomics expert. Generate a concise explanation in JSON format.

Drug: {drug}
Gene: {gene}
Diplotype: {diplotype}
Phenotype: {phenotype}
Detected Variants: {', '.join(variants)}
Risk Assessment: {risk_label}
Guideline: {guideline}

Provide ONLY a JSON object with these exact fields:
{{
  "summary": "2-3 sentence clinical summary",
  "mechanism_of_action": "Explain how the gene affects drug metabolism",
  "variant_citations": {json.dumps(variants)},
  "confidence_statement": "Statement about evidence quality"
}}

Return ONLY valid JSON, no other text."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a pharmacogenomics expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        content = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        result = json.loads(content)
        return result
        
    except Exception as e:
        print(f"LLM error: {e}")
        return {
            "summary": f"Patient has {phenotype} phenotype for {gene}, resulting in {risk_label} risk with {drug}.",
            "mechanism_of_action": f"{gene} metabolizes {drug}. {phenotype} phenotype affects drug metabolism.",
            "variant_citations": variants,
            "confidence_statement": "Based on CPIC guidelines and detected variants."
        }

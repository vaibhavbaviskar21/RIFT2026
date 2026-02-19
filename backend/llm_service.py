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
    
    if not os.getenv("OPENAI_API_KEY"):
        return fallback
    
    # RAG: Construct context-rich prompt with retrieved patient data + clinical knowledge
    prompt = f"""You are a clinical pharmacogenomics expert analyzing drug-gene interactions.

**Patient Genetic Profile (Retrieved from Database):**
- Drug: {drug}
- Gene: {gene}
- Diplotype: {diplotype}
- Phenotype: {phenotype}
- Detected Variants: {', '.join(variants) if variants else 'None'}

**Clinical Context (Augmented Knowledge):**
- Risk Assessment: {risk_label}
- Guideline Reference: {guideline}

**Task:** Generate a clinical explanation that:
1. Explains how the patient's genetic variants affect {drug} metabolism
2. Describes the mechanism of action for {gene}
3. Justifies the {risk_label} risk assessment
4. Provides actionable clinical insights

**Output Format (JSON only):**
{{
  "summary": "2-3 sentence clinical summary explaining the patient's risk and genetic basis",
  "mechanism_of_action": "Detailed explanation of how {gene} metabolizes {drug} and how the {phenotype} phenotype impacts this process",
  "variant_citations": {json.dumps(variants)},
  "confidence_statement": "Statement about evidence quality based on CPIC guidelines and variant detection"
}}

Return ONLY valid JSON, no markdown or additional text."""

    try:
        # Generate LLM response with optimized parameters
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Fast, cost-effective model
            messages=[
                {
                    "role": "system", 
                    "content": "You are a pharmacogenomics expert providing evidence-based clinical interpretations. Always return valid JSON."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Low temperature for consistent, factual responses
            max_tokens=600,   # Sufficient for detailed explanation
            response_format={"type": "json_object"}  # Force JSON output
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

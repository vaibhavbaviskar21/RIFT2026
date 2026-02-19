from typing import Dict
from lookup_tables import DRUG_GENE_RISK, CPIC_RECOMMENDATIONS

def assess_risk(drug: str, phenotype: str) -> Dict:
    """Assess risk for drug-phenotype combination"""
    
    drug_upper = drug.upper()
    
    if drug_upper not in DRUG_GENE_RISK:
        return {
            "risk_label": "Unknown",
            "severity": "none",
            "confidence": 0.0,
            "gene": "Unknown"
        }
    
    drug_data = DRUG_GENE_RISK[drug_upper]
    gene = drug_data["gene"]
    
    risk_data = drug_data.get(phenotype, {
        "risk": "Unknown",
        "severity": "none",
        "confidence": 0.5
    })
    
    return {
        "risk_label": risk_data["risk"],
        "severity": risk_data["severity"],
        "confidence": risk_data["confidence"],
        "gene": gene
    }

def get_recommendation(drug: str, phenotype: str) -> Dict:
    """Get CPIC recommendation for drug-phenotype"""
    
    drug_upper = drug.upper()
    
    if drug_upper not in CPIC_RECOMMENDATIONS:
        return {
            "guideline_reference": "No guideline available",
            "recommended_action": "Consult pharmacist or physician",
            "dose_adjustment": "Standard dosing with monitoring"
        }
    
    rec = CPIC_RECOMMENDATIONS[drug_upper].get(phenotype, {
        "guideline": "No specific guideline",
        "action": "Use clinical judgment",
        "dose_adjustment": "Standard dosing"
    })
    
    return {
        "guideline_reference": rec.get("guideline", ""),
        "recommended_action": rec.get("action", ""),
        "dose_adjustment": rec.get("dose_adjustment", "")
    }

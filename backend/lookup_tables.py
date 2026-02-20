# Pharmacogenomic lookup tables based on CPIC guidelines

# RS ID to Star Allele mapping
RSID_TO_STAR = {
    # CYP2D6
    "rs3892097": "*4",
    "rs1065852": "*10",
    "rs28371725": "*41",
    "rs5030655": "*6",
    "rs16947": "*2",
    
    # CYP2C19
    "rs4244285": "*2",
    "rs4986893": "*3",
    "rs12248560": "*17",
    "rs28399504": "*4",
    
    # CYP2C9
    "rs1799853": "*2",
    "rs1057910": "*3",
    "rs9332131": "*5",
    
    # SLCO1B1
    "rs4149056": "*5",
    "rs2306283": "*1B",
    
    # TPMT
    "rs1800462": "*2",
    "rs1800460": "*3A",
    "rs1142345": "*3C",
    
    # DPYD
    "rs3918290": "*2A",
    "rs55886062": "*13",
    "rs67376798": "*2B",
}

# Star allele activity scores (for CYP2D6)
STAR_ACTIVITY = {
    "*1": 1.0,
    "*2": 1.0,
    "*4": 0.0,
    "*6": 0.0,
    "*10": 0.5,
    "*41": 0.5,
}

# Diplotype to Phenotype mapping
DIPLOTYPE_TO_PHENOTYPE = {
    # CYP2D6 (activity score based)
    "CYP2D6": {
        0.0: "PM",      # Poor Metabolizer
        0.5: "IM",      # Intermediate Metabolizer
        1.0: "IM",
        1.5: "NM",      # Normal Metabolizer
        2.0: "NM",
        2.5: "UM",      # Ultrarapid Metabolizer
        3.0: "UM",
    },
    
    # CYP2C19
    "CYP2C19": {
        "*1/*1": "NM",
        "*1/*2": "IM",
        "*2/*2": "PM",
        "*1/*17": "RM",
        "*17/*17": "UM",
        "*2/*17": "IM",
    },
    
    # CYP2C9
    "CYP2C9": {
        "*1/*1": "NM",
        "*1/*2": "IM",
        "*1/*3": "IM",
        "*2/*2": "PM",
        "*2/*3": "PM",
        "*3/*3": "PM",
    },
    
    # SLCO1B1
    "SLCO1B1": {
        "*1/*1": "NM",
        "*1/*5": "IM",
        "*5/*5": "PM",
    },
    
    # TPMT
    "TPMT": {
        "*1/*1": "NM",
        "*1/*2": "IM",
        "*1/*3A": "IM",
        "*1/*3C": "IM",
        "*2/*2": "PM",
        "*3A/*3A": "PM",
        "*3C/*3C": "PM",
    },
    
    # DPYD
    "DPYD": {
        "*1/*1": "NM",
        "*1/*2A": "IM",
        "*2A/*2A": "PM",
    },
}

# Drug-Gene-Phenotype to Risk mapping
DRUG_GENE_RISK = {
    "CODEINE": {
        "gene": "CYP2D6",
        "PM": {"risk": "Ineffective", "severity": "moderate", "confidence": 0.95},
        "IM": {"risk": "Adjust Dosage", "severity": "low", "confidence": 0.85},
        "NM": {"risk": "Safe", "severity": "none", "confidence": 0.98},
        "UM": {"risk": "Toxic", "severity": "high", "confidence": 0.92},
    },
    
    "WARFARIN": {
        "gene": "CYP2C9",
        "PM": {"risk": "Toxic", "severity": "high", "confidence": 0.93},
        "IM": {"risk": "Adjust Dosage", "severity": "moderate", "confidence": 0.88},
        "NM": {"risk": "Safe", "severity": "none", "confidence": 0.97},
    },
    
    "CLOPIDOGREL": {
        "gene": "CYP2C19",
        "PM": {"risk": "Ineffective", "severity": "high", "confidence": 0.94},
        "IM": {"risk": "Adjust Dosage", "severity": "moderate", "confidence": 0.87},
        "NM": {"risk": "Safe", "severity": "none", "confidence": 0.96},
        "RM": {"risk": "Safe", "severity": "none", "confidence": 0.95},
        "UM": {"risk": "Safe", "severity": "none", "confidence": 0.95},
    },
    
    "SIMVASTATIN": {
        "gene": "SLCO1B1",
        "PM": {"risk": "Toxic", "severity": "high", "confidence": 0.91},
        "IM": {"risk": "Adjust Dosage", "severity": "moderate", "confidence": 0.86},
        "NM": {"risk": "Safe", "severity": "none", "confidence": 0.97},
    },
    
    "AZATHIOPRINE": {
        "gene": "TPMT",
        "PM": {"risk": "Toxic", "severity": "critical", "confidence": 0.96},
        "IM": {"risk": "Adjust Dosage", "severity": "high", "confidence": 0.90},
        "NM": {"risk": "Safe", "severity": "none", "confidence": 0.98},
    },
    
    "FLUOROURACIL": {
        "gene": "DPYD",
        "PM": {"risk": "Toxic", "severity": "critical", "confidence": 0.95},
        "IM": {"risk": "Adjust Dosage", "severity": "high", "confidence": 0.89},
        "NM": {"risk": "Safe", "severity": "none", "confidence": 0.97},
    },

    "PARACETAMOL": {
        "gene": "CYP2D6",
        "PM": {"risk": "Safe", "severity": "none", "confidence": 0.90},
        "IM": {"risk": "Safe", "severity": "none", "confidence": 0.92},
        "NM": {"risk": "Safe", "severity": "none", "confidence": 0.95},
        "UM": {"risk": "Potential Toxicity", "severity": "moderate", "confidence": 0.85},
    },
}

# CPIC Recommendations
CPIC_RECOMMENDATIONS = {
    "CODEINE": {
        "PM": {
            "guideline": "CPIC Guideline for CYP2D6 and Codeine",
            "action": "Avoid codeine use. Select alternative analgesic.",
            "dose_adjustment": "Use alternative (e.g., morphine, hydromorphone)",
        },
        "IM": {
            "guideline": "CPIC Guideline for CYP2D6 and Codeine",
            "action": "Use label-recommended dosage with monitoring",
            "dose_adjustment": "Standard dose with close monitoring",
        },
        "NM": {
            "guideline": "CPIC Guideline for CYP2D6 and Codeine",
            "action": "Use label-recommended dosage",
            "dose_adjustment": "Standard dose",
        },
        "UM": {
            "guideline": "CPIC Guideline for CYP2D6 and Codeine",
            "action": "Avoid codeine. Risk of toxicity.",
            "dose_adjustment": "Use alternative analgesic",
        },
    },
    
    "WARFARIN": {
        "PM": {
            "guideline": "CPIC Guideline for CYP2C9 and Warfarin",
            "action": "Reduce initial dose by 50-70%",
            "dose_adjustment": "Start with 0.5-2mg daily, frequent INR monitoring",
        },
        "IM": {
            "guideline": "CPIC Guideline for CYP2C9 and Warfarin",
            "action": "Reduce initial dose by 25-50%",
            "dose_adjustment": "Start with 3mg daily, monitor INR closely",
        },
        "NM": {
            "guideline": "CPIC Guideline for CYP2C9 and Warfarin",
            "action": "Use standard dosing protocol",
            "dose_adjustment": "Standard 5mg daily with INR monitoring",
        },
    },
    
    "CLOPIDOGREL": {
        "PM": {
            "guideline": "CPIC Guideline for CYP2C19 and Clopidogrel",
            "action": "Use alternative antiplatelet (prasugrel, ticagrelor)",
            "dose_adjustment": "Switch to prasugrel 10mg or ticagrelor 90mg BID",
        },
        "IM": {
            "guideline": "CPIC Guideline for CYP2C19 and Clopidogrel",
            "action": "Consider alternative or increased dose",
            "dose_adjustment": "Consider prasugrel/ticagrelor or increase to 150mg loading",
        },
        "NM": {
            "guideline": "CPIC Guideline for CYP2C19 and Clopidogrel",
            "action": "Use standard dosing",
            "dose_adjustment": "75mg daily maintenance dose",
        },
        "RM": {
            "guideline": "CPIC Guideline for CYP2C19 and Clopidogrel",
            "action": "Use standard dosing",
            "dose_adjustment": "75mg daily maintenance dose",
        },
        "UM": {
            "guideline": "CPIC Guideline for CYP2C19 and Clopidogrel",
            "action": "Use standard dosing",
            "dose_adjustment": "75mg daily maintenance dose",
        },
    },
    
    "SIMVASTATIN": {
        "PM": {
            "guideline": "CPIC Guideline for SLCO1B1 and Simvastatin",
            "action": "Use lower dose or alternative statin",
            "dose_adjustment": "Max 20mg daily or switch to pravastatin/rosuvastatin",
        },
        "IM": {
            "guideline": "CPIC Guideline for SLCO1B1 and Simvastatin",
            "action": "Reduce dose or consider alternative",
            "dose_adjustment": "Max 40mg daily with monitoring",
        },
        "NM": {
            "guideline": "CPIC Guideline for SLCO1B1 and Simvastatin",
            "action": "Use standard dosing",
            "dose_adjustment": "Standard dose up to 80mg daily",
        },
    },
    
    "AZATHIOPRINE": {
        "PM": {
            "guideline": "CPIC Guideline for TPMT and Azathioprine",
            "action": "Reduce dose to 10% of standard or use alternative",
            "dose_adjustment": "0.5mg/kg/day or consider alternative immunosuppressant",
        },
        "IM": {
            "guideline": "CPIC Guideline for TPMT and Azathioprine",
            "action": "Reduce dose to 30-70% of standard",
            "dose_adjustment": "Start 1-1.5mg/kg/day with CBC monitoring",
        },
        "NM": {
            "guideline": "CPIC Guideline for TPMT and Azathioprine",
            "action": "Use standard dosing",
            "dose_adjustment": "2-3mg/kg/day with routine monitoring",
        },
    },
    
    "FLUOROURACIL": {
        "PM": {
            "guideline": "CPIC Guideline for DPYD and Fluorouracil",
            "action": "Avoid fluorouracil or reduce dose by 50%",
            "dose_adjustment": "Select alternative or 50% dose reduction with close monitoring",
        },
        "IM": {
            "guideline": "CPIC Guideline for DPYD and Fluorouracil",
            "action": "Reduce dose by 25-50%",
            "dose_adjustment": "Start at 50% dose, titrate based on toxicity",
        },
        "NM": {
            "guideline": "CPIC Guideline for DPYD and Fluorouracil",
            "action": "Use standard dosing protocol",
            "dose_adjustment": "Standard protocol-based dosing",
        },
    },

    "PARACETAMOL": {
        "PM": {
            "guideline": "Standard Pharmacogenomic Guidelines",
            "action": "Safe to use standard labeling",
            "dose_adjustment": "Standard dose",
        },
        "IM": {
            "guideline": "Standard Pharmacogenomic Guidelines",
            "action": "Safe to use standard labeling",
            "dose_adjustment": "Standard dose",
        },
        "NM": {
            "guideline": "Standard Pharmacogenomic Guidelines",
            "action": "Safe to use standard labeling",
            "dose_adjustment": "Standard dose",
        },
        "UM": {
            "guideline": "Standard Pharmacogenomic Guidelines/Clinical Alerts",
            "action": "Use with caution",
            "dose_adjustment": "Monitor for potential hepatotoxicity if high consumption",
        },
    },
}

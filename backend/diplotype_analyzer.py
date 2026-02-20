from typing import List, Tuple
from models import Variant
from lookup_tables import RSID_TO_STAR, STAR_ACTIVITY, DIPLOTYPE_TO_PHENOTYPE

def determine_diplotype(variants: List[Variant], gene: str) -> Tuple[str, str]:
    """
    Determine diplotype and phenotype from variants.
    
    Prioritizes detected variants over wild-type (*1).
    Handles compound heterozygosity by collecting all variant alleles found.
    """
    
    # Filter variants for specific gene
    gene_variants = [v for v in variants if v.gene == gene]
    
    # Collect variant alleles (exclude *1 defaults here)
    variant_alleles = []
    
    for variant in gene_variants:
        gt = variant.genotype
        star = variant.star_allele or RSID_TO_STAR.get(variant.rsid, None)
        
        if not star or star == "*1":
            continue
        
        # If Heterozygous (0/1 or 1/0), add one copy of the variant
        if gt in ["0/1", "1/0"]:
            variant_alleles.append(star)
            
        # If Homozygous (1/1), add two copies
        elif gt == "1/1":
            variant_alleles.append(star)
            variant_alleles.append(star)
    
    # Construct final diplotype pair
    if not variant_alleles:
        final_alleles = ["*1", "*1"]
    elif len(variant_alleles) == 1:
        final_alleles = ["*1", variant_alleles[0]]
    else:
        # If >2 variants found, take the first two (simplification without phasing)
        # Ideally, we'd prioritize loss-of-function alleles, but for now we take the first 2 found
        final_alleles = variant_alleles[:2]
    
    # Sort alleles for consistent representation (e.g., *1/*4 instead of *4/*1)
    # Custom sort to ensure *1 is always first if present
    final_alleles.sort(key=lambda x: (x != "*1", x)) 
    
    diplotype = f"{final_alleles[0]}/{final_alleles[1]}"
    
    # Determine phenotype
    phenotype = get_phenotype(gene, diplotype, final_alleles)
    
    return diplotype, phenotype

def get_phenotype(gene: str, diplotype: str, alleles: List[str]) -> str:
    """Map diplotype to phenotype"""
    
    # CYP2D6 uses activity score
    if gene == "CYP2D6":
        score = sum(STAR_ACTIVITY.get(a, 1.0) for a in alleles)
        pheno_map = DIPLOTYPE_TO_PHENOTYPE.get(gene, {})
        
        # Find closest activity score
        for activity, pheno in sorted(pheno_map.items()):
            if score <= activity:
                return pheno
        return "UM"
    
    # Other genes use direct diplotype mapping
    pheno_map = DIPLOTYPE_TO_PHENOTYPE.get(gene, {})
    return pheno_map.get(diplotype, "Unknown")

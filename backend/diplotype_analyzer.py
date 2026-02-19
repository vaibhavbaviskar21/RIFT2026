from typing import List, Tuple
from models import Variant
from lookup_tables import RSID_TO_STAR, STAR_ACTIVITY, DIPLOTYPE_TO_PHENOTYPE

def determine_diplotype(variants: List[Variant], gene: str) -> Tuple[str, str]:
    """Determine diplotype and phenotype from variants"""
    
    # Filter variants for specific gene
    gene_variants = [v for v in variants if v.gene == gene]
    
    if not gene_variants:
        return "*1/*1", "Unknown"
    
    # Collect alleles
    alleles = []
    for variant in gene_variants:
        gt = variant.genotype
        star = variant.star_allele or RSID_TO_STAR.get(variant.rsid, None)
        
        if not star:
            continue
        
        if gt in ["0/1", "1/0"]:
            alleles.append("*1")
            alleles.append(star)
        elif gt == "1/1":
            alleles.append(star)
            alleles.append(star)
    
    # Default to wild-type if no variants
    if not alleles:
        alleles = ["*1", "*1"]
    elif len(alleles) == 1:
        alleles.append("*1")
    
    # Sort alleles for consistency
    alleles.sort()
    diplotype = f"{alleles[0]}/{alleles[1]}"
    
    # Determine phenotype
    phenotype = get_phenotype(gene, diplotype, alleles)
    
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

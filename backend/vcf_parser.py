from typing import List
from models import Variant

TARGET_GENES = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"]

def parse_vcf(file_content: bytes) -> tuple[List[Variant], bool]:
    """Parse VCF file and extract pharmacogenomic variants"""
    variants = []
    success = True
    
    try:
        lines = file_content.decode('utf-8').split('\n')
        
        for line in lines:
            # Skip headers and empty lines
            if line.startswith('#') or not line.strip():
                continue
            
            fields = line.split('\t')
            if len(fields) < 9:
                continue
            
            chrom, pos, id_field, ref, alt, qual, filter_field, info_field, format_field = fields[:9]
            
            # Parse INFO field
            info = {}
            for item in info_field.split(';'):
                if '=' in item:
                    key, value = item.split('=', 1)
                    info[key] = value
            
            gene = info.get('GENE', '')
            
            # Filter for target genes only
            if gene not in TARGET_GENES:
                continue
            
            rsid = info.get('RS', id_field if id_field != '.' else '')
            star_allele = info.get('STAR', None)
            
            # Extract genotype from sample
            genotype = '0/0'
            if len(fields) > 9:
                sample_data = fields[9]
                format_keys = format_field.split(':')
                sample_values = sample_data.split(':')
                
                if 'GT' in format_keys:
                    gt_index = format_keys.index('GT')
                    if gt_index < len(sample_values):
                        genotype = sample_values[gt_index]
            
            variant = Variant(
                rsid=rsid,
                gene=gene,
                star_allele=star_allele,
                genotype=genotype,
                chromosome=chrom,
                position=int(pos)
            )
            variants.append(variant)
        
    except Exception as e:
        success = False
        print(f"VCF parsing error: {e}")
    
    return variants, success

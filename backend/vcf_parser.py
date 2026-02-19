from typing import List, Dict
from models import Variant

TARGET_GENES = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"]

def parse_vcf(file_content: bytes) -> tuple[List[Variant], bool, str]:
    """Parse VCF file and extract pharmacogenomic variants"""
    variants = []
    success = True
    error_message = ""
    
    try:
        # Decode file content
        try:
            lines = file_content.decode('utf-8').split('\n')
        except UnicodeDecodeError:
            return [], False, "Invalid file encoding. VCF file must be UTF-8 encoded."
        
        if not lines:
            return [], False, "VCF file is empty."
        
        variant_count = 0
        for line_num, line in enumerate(lines, 1):
            # Skip headers and empty lines
            if line.startswith('#') or not line.strip():
                continue
            
            try:
                fields = line.split('\t')
                if len(fields) < 9:
                    continue
                
                chrom, pos, id_field, ref, alt, qual, filter_field, info_field, format_field = fields[:9]
                
                # Validate position
                try:
                    position = int(pos)
                except ValueError:
                    continue
                
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
                    position=position
                )
                variants.append(variant)
                variant_count += 1
                
            except Exception as e:
                # Log but continue processing other variants
                print(f"Error parsing line {line_num}: {e}")
                continue
        
        if variant_count == 0:
            return [], False, f"No pharmacogenomic variants found for target genes: {', '.join(TARGET_GENES)}"
        
    except Exception as e:
        success = False
        error_message = f"VCF parsing error: {str(e)}"
        print(error_message)
    
    return variants, success, error_message

def variants_to_dict(variants: List[Variant]) -> List[Dict]:
    """Convert Variant objects to dictionaries for database storage"""
    return [
        {
            "rsid": v.rsid,
            "gene": v.gene,
            "star_allele": v.star_allele,
            "genotype": v.genotype,
            "chromosome": v.chromosome,
            "position": v.position
        }
        for v in variants
    ]

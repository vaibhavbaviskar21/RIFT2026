import os

# Configuration for the generated files
NUM_FILES = 5
TARGET_SIZE_MB = 3
FILE_EXTENSION = ".vcf"

# Genes and variants based on RIFT 2026 requirements
PGX_VARIANTS = [
    {"chrom": "10", "pos": "94842866", "rsid": "rs4244285", "ref": "G", "alt": "A", "gene": "CYP2C19", "star": "*2"},
    {"chrom": "10", "pos": "94842867", "rsid": "rs4986893", "ref": "G", "alt": "A", "gene": "CYP2C19", "star": "*3"},
    {"chrom": "12", "pos": "21178611", "rsid": "rs4149056", "ref": "T", "alt": "C", "gene": "SLCO1B1", "star": "*5"},
    {"chrom": "22", "pos": "42126611", "rsid": "rs12248560", "ref": "C", "alt": "T", "gene": "CYP2D6", "star": "*17"},
    {"chrom": "19", "pos": "38499000", "rsid": "rs1234567", "ref": "A", "alt": "G", "gene": "CYP2C9", "star": "*2"},
    {"chrom": "7", "pos": "99612000", "rsid": "rs7654321", "ref": "C", "alt": "T", "gene": "TPMT", "star": "*3C"},
    {"chrom": "1", "pos": "97543210", "rsid": "rs1111111", "ref": "G", "alt": "A", "gene": "DPYD", "star": "*2A"}
]

VCF_HEADER = """##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene Name">
##INFO=<ID=STAR,Number=1,Type=String,Description="Star Allele">
##INFO=<ID=RS,Number=1,Type=String,Description="RSID">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE
"""

def generate_vcf(file_name, target_size_mb):
    target_bytes = target_size_mb * 1024 * 1024
    current_bytes = 0
    
    with open(file_name, 'w') as f:
        # Write the mandatory header
        f.write(VCF_HEADER)
        current_bytes = len(VCF_HEADER.encode('utf-8'))
        
        # 1. Write the "Critical" PGx variants first to ensure they are present
        for v in PGX_VARIANTS:
            line = f"{v['chrom']}\t{v['pos']}\t{v['rsid']}\t{v['ref']}\t{v['alt']}\t100\tPASS\tGENE={v['gene']};STAR={v['star']};RS={v['rsid']}\tGT\t0/1\n"
            f.write(line)
            current_bytes += len(line.encode('utf-8'))
            
        # 2. Fill the rest with dummy genomic data to hit the 3MB target
        # This simulates a real VCF which would have thousands of non-PGx variants
        dummy_counter = 0
        while current_bytes < target_bytes:
            dummy_pos = 100000 + dummy_counter
            dummy_line = f"1\t{dummy_pos}\trs{dummy_pos}\tA\tG\t30\tPASS\tGENE=DUMMY;STAR=*1;RS=rs{dummy_pos}\tGT\t0/1\n"
            line_bytes = dummy_line.encode('utf-8')
            
            # Check if adding this line exceeds the target significantly
            if current_bytes + len(line_bytes) > target_bytes:
                break
                
            f.write(dummy_line)
            current_bytes += len(line_bytes)
            dummy_counter += 1

    print(f"Generated: {file_name} ({os.path.getsize(file_name) / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    print(f"🚀 Starting generation of {NUM_FILES} VCF files...")
    for i in range(1, NUM_FILES + 1):
        file_name = f"sample_patient_{i:03d}{FILE_EXTENSION}"
        generate_vcf(file_name, TARGET_SIZE_MB)
    print("\n✅ Done. Use these files to test your 'PharmaGuard' uploader and parser.")
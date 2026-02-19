# PowerShell test script for the pharmacogenomics API

$uri = "http://localhost:8000/analyze"
$vcfFile = "sample_patient.vcf"

# Read file content
$fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $vcfFile))
$fileContent = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes)

# Create boundary
$boundary = [System.Guid]::NewGuid().ToString()

# Build multipart form data
$LF = "`r`n"
$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"sample_patient.vcf`"",
    "Content-Type: text/plain$LF",
    $fileContent,
    "--$boundary",
    "Content-Disposition: form-data; name=`"drugs`"$LF",
    "CODEINE,WARFARIN,CLOPIDOGREL",
    "--$boundary",
    "Content-Disposition: form-data; name=`"patient_id`"$LF",
    "TEST_001",
    "--$boundary--$LF"
) -join $LF

# Send request
try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
    
    Write-Host "✅ Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception.Response
}

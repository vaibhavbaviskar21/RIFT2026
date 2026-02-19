# Test Health Endpoint
Write-Host "`n=== Testing Health Endpoint ===" -ForegroundColor Green
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get
$response | ConvertTo-Json

# Test Signup
Write-Host "`n=== Testing Signup ===" -ForegroundColor Green
$signupBody = @{
    email = "test@example.com"
    password = "testpassword123"
    full_name = "Test User"
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/auth/signup" -Method Post -Body $signupBody -ContentType "application/json"
    $token = $signupResponse.access_token
    Write-Host "Signup successful! Token: $($token.Substring(0,50))..." -ForegroundColor Green
} catch {
    Write-Host "Signup failed (user might exist), trying login..." -ForegroundColor Yellow
    
    # Test Login
    $loginBody = @{
        email = "test@example.com"
        password = "testpassword123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "Login successful! Token: $($token.Substring(0,50))..." -ForegroundColor Green
}

# Test Get Me
Write-Host "`n=== Testing Get Me ===" -ForegroundColor Green
$headers = @{
    Authorization = "Bearer $token"
}
$meResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/auth/me" -Method Get -Headers $headers
$meResponse | ConvertTo-Json

Write-Host "`n=== All Basic Tests Passed ===" -ForegroundColor Green

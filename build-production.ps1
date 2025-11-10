Write-Host "=== Production Build Script ===" -ForegroundColor Cyan

Write-Host "`nCleaning build and cache..." -ForegroundColor Yellow
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }

Write-Host "`nSetting environment variables..." -ForegroundColor Yellow
$env:REACT_APP_API_URL = "/api"
$env:REACT_APP_ENV = "production"
Write-Host "REACT_APP_API_URL = $env:REACT_APP_API_URL"
Write-Host "REACT_APP_ENV = $env:REACT_APP_ENV"

Write-Host "`nBuilding production frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== Verifying Build ===" -ForegroundColor Cyan

    $mainJs = Get-ChildItem -Path "build\static\js" -Filter "main.*.js" | Select-Object -First 1
    if ($mainJs) {
        $content = Get-Content $mainJs.FullName -Raw
        $localhostCount = ([regex]::Matches($content, "localhost:4000")).Count
        $apiCount = ([regex]::Matches($content, '"/api"')).Count

        Write-Host "`nBuild verification:" -ForegroundColor Yellow
        Write-Host "  localhost:4000 occurrences: $localhostCount (should be 0)"
        Write-Host "  /api occurrences: $apiCount (should be 13+)"

        if ($localhostCount -eq 0 -and $apiCount -gt 0) {
            Write-Host "`nBuild is correct!" -ForegroundColor Green
        } else {
            Write-Host "`nBuild verification FAILED!" -ForegroundColor Red
        }
    }
} else {
    Write-Host "`nBuild FAILED!" -ForegroundColor Red
}

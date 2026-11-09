# Install Product Shipping OS Skills Globally on Windows (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "📦 Installing Product Shipping OS Skills..." -ForegroundColor Cyan

$sourceDir = Join-Path $PSScriptRoot "..\.agents\skills"
$targetDir = Join-Path $env:USERPROFILE ".gemini\config\skills"

if (-not (Test-Path $targetDir)) {
    Write-Host "Creating target skills directory: $targetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$skills = Get-ChildItem -Directory -Path $sourceDir

foreach ($skill in $skills) {
    $destination = Join-Path $targetDir $skill.Name
    Write-Host " -> Installing skill: $($skill.Name)" -ForegroundColor Green
    Copy-Item -Path $skill.FullName -Destination $destination -Recurse -Force
}

Write-Host "✨ All skills successfully installed globally!" -ForegroundColor Cyan
Write-Host "You can now use /ship-mvp, /ship-arch, /ship-design, /ship-slice, /ship-pay, /ship-test, /ship-scale, /ship-audit, /ship-fix in any project!" -ForegroundColor White

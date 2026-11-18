# Create an isolated worktree + Docker stack for one feature (Windows PowerShell).
# usage: .\scripts\feature.ps1 -Name alerts -Slot 1
#   -> ..\sh-alerts on branch feat/alerts, web :3001, api :4001, postgres :5433
param(
  [Parameter(Mandatory = $true)][ValidatePattern('^[a-z0-9][a-z0-9-]*$')][string]$Name,
  [Parameter(Mandatory = $true)][ValidateRange(1, 9)][int]$Slot,
  [switch]$NoDocker
)
$ErrorActionPreference = 'Stop'

$Root = (git rev-parse --show-toplevel).Trim()
$Dir = Join-Path (Split-Path $Root -Parent) "sh-$Name"
$Branch = "feat/$Name"
$WebPort = 3000 + $Slot; $ApiPort = 4000 + $Slot; $DbPort = 5432 + $Slot

if (Test-Path $Dir) { throw "$Dir already exists. Pick another name or run .\scripts\feature-rm.ps1 -Name $Name" }

git -C $Root show-ref --verify --quiet "refs/heads/$Branch"
if ($LASTEXITCODE -eq 0) { git -C $Root worktree add $Dir $Branch } else { git -C $Root worktree add $Dir -b $Branch }
if ($LASTEXITCODE -ne 0) { throw 'git worktree add failed' }
Set-Location $Dir

# Ports only. No secrets. docker compose reads this file automatically.
# (ASCII + LF so docker compose parses it the same as on Linux.)
"WEB_PORT=$WebPort`nAPI_PORT=$ApiPort`nDB_PORT=$DbPort`n" | Set-Content -NoNewline -Encoding ascii .env

pnpm install
if ($LASTEXITCODE -ne 0) { throw 'pnpm install failed' }

if (-not $NoDocker) {
  docker compose -p "sh-$Name" up -d --build
  if ($LASTEXITCODE -ne 0) { throw 'docker compose up failed' }
}

Write-Host ""
Write-Host "Feature stack 'sh-$Name' (slot $Slot) is ready."
Write-Host "  folder     $Dir"
Write-Host "  branch     $Branch"
Write-Host "  dashboard  http://localhost:$WebPort"
Write-Host "  api        http://localhost:$ApiPort/api/health"
Write-Host "  postgres   localhost:$DbPort"
Write-Host "Next: cd `"$Dir`" and start your agent there."

# Pre-session check for Windows PowerShell. The real work is in verify-setup.mjs.
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "X node not found. Install Node.js 22 or newer first (see the install checklist)." -ForegroundColor Red
  exit 1
}
node (Join-Path $PSScriptRoot 'verify-setup.mjs')
exit $LASTEXITCODE

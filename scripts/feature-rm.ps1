# Tear down a feature stack after its branch is merged (or abandoned).
# usage: .\scripts\feature-rm.ps1 -Name alerts [-KeepBranch]
param(
  [Parameter(Mandatory = $true)][string]$Name,
  [switch]$KeepBranch
)
$Root = (git rev-parse --show-toplevel).Trim()
$Dir = Join-Path (Split-Path $Root -Parent) "sh-$Name"

if (Test-Path $Dir) {
  Push-Location $Dir
  docker compose -p "sh-$Name" down -v
  Pop-Location
  git -C $Root worktree remove $Dir
}
if (-not $KeepBranch) {
  # -d (not -D): refuses to delete a branch that isn't merged yet.
  git -C $Root branch -d "feat/$Name"
  if ($LASTEXITCODE -ne 0) { Write-Host "Branch feat/$Name not deleted (not merged?). Keep it, or delete it yourself." }
}
Write-Host "Removed sh-$Name."

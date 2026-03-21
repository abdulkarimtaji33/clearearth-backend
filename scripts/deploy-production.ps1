# Windows: run from clearearth-backend repo root. Requires OpenSSH client + Git Bash (or WSL bash).
#   .\scripts\deploy-production.ps1
# Optional: $env:DEPLOY_HOST = "root@72.60.223.25"; $env:GIT_BRANCH = "main"; $env:SKIP_MIGRATE = "1"

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Resolve-Path (Join-Path $here "..")
$bash = @(
  "C:\Program Files\Git\bin\bash.exe",
  "C:\Program Files (x86)\Git\bin\bash.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $bash) {
  Write-Error "Git Bash not found. Install Git for Windows or run: wsl bash scripts/deploy-production.sh from repo root"
}

Set-Location $backendRoot
& $bash -lc "bash scripts/deploy-production.sh"

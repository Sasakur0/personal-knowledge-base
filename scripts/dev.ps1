param(
  [switch]$BackendOnly,
  [switch]$DesktopOnly
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not $DesktopOnly) {
  Write-Host "Starting backend at http://127.0.0.1:8000 ..."
  Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$repoRoot'; .\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000"
  ) | Out-Null
}

if (-not $BackendOnly) {
  Write-Host "Starting desktop dev app ..."
  Push-Location (Join-Path $repoRoot "desktop")
  try {
    npm run dev
  }
  finally {
    Pop-Location
  }
}

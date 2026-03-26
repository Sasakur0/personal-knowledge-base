param(
  [switch]$SkipBackend,
  [switch]$SkipDesktop,
  [ValidateSet("nsis", "portable", "msi")]
  [string]$Target = "nsis"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendExeOutDir = Join-Path $repoRoot "backend\dist"
$desktopBackendResourceDir = Join-Path $repoRoot "desktop\resources\backend"

Write-Host "Building Windows package for PersonalKnowledgeBaseAssistant ($Target)..."

if (-not $SkipBackend) {
  Write-Host "1/3 Build backend executable with PyInstaller"
  Push-Location $repoRoot
  try {
    & .\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
    & .\.venv\Scripts\pyinstaller.exe backend\launcher.py `
      --name pkb_backend `
      --onefile `
      --distpath $backendExeOutDir `
      --workpath "$repoRoot\backend\build" `
      --specpath "$repoRoot\backend"
  }
  finally {
    Pop-Location
  }

  New-Item -ItemType Directory -Force -Path $desktopBackendResourceDir | Out-Null
  Copy-Item -Force (Join-Path $backendExeOutDir "pkb_backend.exe") (Join-Path $desktopBackendResourceDir "pkb_backend.exe")
}

if (-not $SkipDesktop) {
  Write-Host "2/3 Install desktop dependencies"
  Push-Location (Join-Path $repoRoot "desktop")
  try {
    npm install
    Write-Host "3/3 Build renderer/main and package Windows target: $Target"
    if ($Target -eq "nsis") {
      npm run package:win
    }
    elseif ($Target -eq "portable") {
      npm run package:portable
    }
    else {
      npm run package:msi
    }
  }
  finally {
    Pop-Location
  }
}

Write-Host "Windows build finished. Artifacts are in desktop\\dist\\installer"

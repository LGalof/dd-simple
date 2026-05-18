$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$node = Join-Path $root ".tools\node22\node.exe"
$tsx = Join-Path $root "node_modules\tsx\dist\cli.mjs"
$vite = Join-Path $root "node_modules\vite\bin\vite.js"
$apiRoot = Join-Path $root "apps\api"
$webRoot = Join-Path $root "apps\web"
$composeFile = Join-Path $root "infra\docker-compose.yml"

Write-Host "Starting Postgres..."
try {
  & docker compose -f $composeFile up -d postgres | Out-Host
} catch {
  Write-Warning "Could not start Postgres with Docker. If registration fails, start Docker Desktop and rerun this command."
}

Write-Host "Starting API on http://localhost:4000 ..."
$apiArgs = ('"{0}" src/index.ts' -f $tsx)
$apiProcess = Start-Process -FilePath $node -ArgumentList $apiArgs -WorkingDirectory $apiRoot -PassThru

try {
  Start-Sleep -Seconds 2
  Write-Host "Starting web app on http://127.0.0.1:5173 ..."

  Push-Location $webRoot
  try {
    & $node $vite --host 127.0.0.1
  } finally {
    Pop-Location
  }
} finally {
  if ($apiProcess -and -not $apiProcess.HasExited) {
    Stop-Process -Id $apiProcess.Id -Force
  }
}

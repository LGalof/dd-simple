$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$node = "node"
$vite = Join-Path $root "node_modules\vite\bin\vite.js"
$webRoot = Join-Path $root "apps\web"

Push-Location $webRoot
try {
  & $node $vite --host 127.0.0.1
} finally {
  Pop-Location
}

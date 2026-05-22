$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$node = "node"
$tsx = Join-Path $root "node_modules\tsx\dist\cli.mjs"
$apiRoot = Join-Path $root "apps\api"

Push-Location $apiRoot
try {
  & $node $tsx "src\index.ts"
} finally {
  Pop-Location
}

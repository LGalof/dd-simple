param(
  [string]$RenderDatabaseUrl,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

if (-not $RenderDatabaseUrl) {
  $RenderDatabaseUrl = Read-Host "Paste the Render EXTERNAL Database URL"
}

if (-not $RenderDatabaseUrl.StartsWith("postgresql://")) {
  throw "RenderDatabaseUrl must start with postgresql://"
}

if ($RenderDatabaseUrl -notmatch "sslmode=") {
  $separator = "?"

  if ($RenderDatabaseUrl.Contains("?")) {
    $separator = "&"
  }

  $RenderDatabaseUrl = "$RenderDatabaseUrl${separator}sslmode=require"
}

$containerName = "dd-simple-postgres"
$localDatabaseUrl = "postgresql://ddsimple:ddsimple@localhost:5432/ddsimple?schema=public"

docker inspect $containerName *> $null

if ($LASTEXITCODE -ne 0) {
  throw "Docker container '$containerName' is not running. Start it with: docker compose -f infra/docker-compose.yml up -d"
}

if (-not $Force) {
  Write-Host ""
  Write-Host "This will replace the data in your Render PostgreSQL database with your local database."
  Write-Host "Use the Render EXTERNAL Database URL, not the internal one."
  $confirmation = Read-Host "Type COPY to continue"

  if ($confirmation -ne "COPY") {
    Write-Host "Cancelled."
    exit 0
  }
}

Write-Host "Copying local PostgreSQL data to Render..."

docker exec `
  --env LOCAL_DATABASE_URL=$localDatabaseUrl `
  --env RENDER_DATABASE_URL=$RenderDatabaseUrl `
  $containerName `
  sh -c 'pg_dump --clean --if-exists --no-owner --no-privileges "$LOCAL_DATABASE_URL" | psql "$RENDER_DATABASE_URL"'

if ($LASTEXITCODE -ne 0) {
  throw "Database copy failed."
}

Write-Host "Database copy completed."

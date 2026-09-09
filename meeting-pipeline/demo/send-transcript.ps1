param(
    [Parameter(Mandatory = $true)][string]$TranscriptFile,
    [string]$Title,
    [string]$ItemsFile
)

$ErrorActionPreference = "Stop"

$url = $env:PIPELINE_WEBTRIGGER_URL
if (-not $url) { throw "Set PIPELINE_WEBTRIGGER_URL (run: forge webtrigger)" }

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $Title) { $Title = [IO.Path]::GetFileNameWithoutExtension($TranscriptFile) }
if (-not $ItemsFile) { $ItemsFile = Join-Path $root "fixtures\work-items.json" }

$transcript = Get-Content -Raw -Encoding UTF8 $TranscriptFile
$items = Get-Content -Raw -Encoding UTF8 $ItemsFile | ConvertFrom-Json
$body = @{
    transcript    = $transcript
    meeting_title = $Title
    attendees     = @("Danny", "Sarah", "Marcus", "Priya", "Jake", "Alex", "Sam")
    date          = (Get-Date -Format "yyyy-MM-dd")
    items         = @($items)
} | ConvertTo-Json -Depth 6

$headers = @{ "Content-Type" = "application/json" }
if ($env:INGEST_TOKEN) { $headers["X-Ingest-Token"] = $env:INGEST_TOKEN }

$response = Invoke-RestMethod -Method Post -Uri $url -Body $body -Headers $headers

$response | ConvertTo-Json -Depth 6

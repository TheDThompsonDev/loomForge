# Post a transcript to the pipeline web trigger (Windows twin of
# send-transcript.sh). Demonstrates the HMAC signing the trigger requires.
# Usage:
#   $env:PIPELINE_WEBTRIGGER_URL="https://..."; $env:PIPELINE_SHARED_SECRET="..."
#   .\send-transcript.ps1 ..\fixtures\real-meeting.txt "Weekly platform sync"
#   .\send-transcript.ps1 ..\fixtures\real-meeting.txt -GenerateDoc
param(
    [Parameter(Mandatory = $true)][string]$TranscriptFile,
    [string]$Title,
    [switch]$GenerateDoc
)

$ErrorActionPreference = "Stop"

$url = $env:PIPELINE_WEBTRIGGER_URL
$secret = $env:PIPELINE_SHARED_SECRET
if (-not $url) { throw "Set PIPELINE_WEBTRIGGER_URL (run: forge webtrigger)" }
if (-not $secret) { throw "Set PIPELINE_SHARED_SECRET (must match the forge variable)" }

if (-not $Title) { $Title = [IO.Path]::GetFileNameWithoutExtension($TranscriptFile) }

$transcript = Get-Content -Raw -Encoding UTF8 $TranscriptFile
$body = @{
    transcript    = $transcript
    meeting_title = $Title
    attendees     = @("Danny", "Sarah", "Marcus", "Priya", "Jake", "Alex", "Sam")
    date          = (Get-Date -Format "yyyy-MM-dd")
    generate_doc  = [bool]$GenerateDoc
} | ConvertTo-Json -Depth 4

$bodyBytes = [Text.Encoding]::UTF8.GetBytes($body)
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($secret)
$signature = ($hmac.ComputeHash($bodyBytes) | ForEach-Object { $_.ToString("x2") }) -join ""

$response = Invoke-RestMethod -Method Post -Uri $url -Body $bodyBytes `
    -ContentType "application/json" `
    -Headers @{ "x-pipeline-signature" = $signature }

$response | ConvertTo-Json -Depth 6

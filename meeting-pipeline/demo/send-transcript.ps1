# Post captured input to the pipeline web trigger (Windows twin of
# send-transcript.sh).
#   $env:PIPELINE_WEBTRIGGER_URL="https://..."
#   .\send-transcript.ps1 ..\fixtures\real-meeting.txt "Weekly platform sync"
#   .\send-transcript.ps1 ..\fixtures\real-meeting.txt -GenerateDoc
param(
    [Parameter(Mandatory = $true)][string]$TranscriptFile,
    [string]$Title,
    [switch]$GenerateDoc
)

$ErrorActionPreference = "Stop"

$url = $env:PIPELINE_WEBTRIGGER_URL
if (-not $url) { throw "Set PIPELINE_WEBTRIGGER_URL (run: forge webtrigger)" }

if (-not $Title) { $Title = [IO.Path]::GetFileNameWithoutExtension($TranscriptFile) }

$transcript = Get-Content -Raw -Encoding UTF8 $TranscriptFile
$body = @{
    transcript    = $transcript
    meeting_title = $Title
    attendees     = @("Danny", "Sarah", "Marcus", "Priya", "Jake", "Alex", "Sam")
    date          = (Get-Date -Format "yyyy-MM-dd")
    generate_doc  = [bool]$GenerateDoc
} | ConvertTo-Json -Depth 4

$response = Invoke-RestMethod -Method Post -Uri $url -Body $body `
    -ContentType "application/json"

$response | ConvertTo-Json -Depth 6

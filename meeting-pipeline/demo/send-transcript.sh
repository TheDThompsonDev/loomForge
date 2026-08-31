#!/usr/bin/env bash
# Post captured input to the pipeline web trigger.
#   PIPELINE_WEBTRIGGER_URL=https://... \
#     ./send-transcript.sh ../fixtures/real-meeting.txt "Weekly platform sync"
set -euo pipefail

FILE="${1:?usage: send-transcript.sh <input-file> [title] [generate_doc:true|false]}"
TITLE="${2:-$(basename "$FILE" .txt)}"
GENERATE_DOC="${3:-false}"

: "${PIPELINE_WEBTRIGGER_URL:?set PIPELINE_WEBTRIGGER_URL (forge webtrigger to print it)}"

BODY=$(jq -n \
  --rawfile transcript "$FILE" \
  --arg title "$TITLE" \
  --arg date "$(date +%Y-%m-%d)" \
  --argjson doc "$GENERATE_DOC" \
  '{transcript: $transcript, meeting_title: $title, attendees: ["Danny", "Sarah", "Marcus", "Priya", "Jake", "Alex", "Sam"], date: $date, generate_doc: $doc}')

curl -sS -X POST "$PIPELINE_WEBTRIGGER_URL" \
  -H "Content-Type: application/json" \
  --data-binary "$BODY" | jq .

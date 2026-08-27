#!/usr/bin/env bash
# Post a transcript to the pipeline. Usage:
#   PIPELINE_WEBTRIGGER_URL=https://... PIPELINE_SHARED_SECRET=... \
#     ./send-transcript.sh ../fixtures/real-meeting.txt "Weekly platform sync"
#
# Requires: curl, jq, openssl
set -euo pipefail

FILE="${1:?usage: send-transcript.sh <transcript-file> [meeting-title] [generate_doc:true|false]}"
TITLE="${2:-$(basename "$FILE" .txt)}"
GENERATE_DOC="${3:-false}"

: "${PIPELINE_WEBTRIGGER_URL:?set PIPELINE_WEBTRIGGER_URL (forge webtrigger to print it)}"
: "${PIPELINE_SHARED_SECRET:?set PIPELINE_SHARED_SECRET (must match the forge variable)}"

BODY=$(jq -n \
  --rawfile transcript "$FILE" \
  --arg title "$TITLE" \
  --arg date "$(date +%Y-%m-%d)" \
  --argjson doc "$GENERATE_DOC" \
  '{transcript: $transcript, meeting_title: $title, attendees: ["Danny", "Sarah", "Marcus", "Priya", "Jake", "Alex", "Sam"], date: $date, generate_doc: $doc}')

SIGNATURE=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$PIPELINE_SHARED_SECRET" -hex | sed 's/^.*= //')

curl -sS -X POST "$PIPELINE_WEBTRIGGER_URL" \
  -H "Content-Type: application/json" \
  -H "x-pipeline-signature: $SIGNATURE" \
  --data-binary "$BODY" | jq .

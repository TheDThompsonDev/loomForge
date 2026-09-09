#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="${1:?usage: send-transcript.sh <input-file> [title] [items-json]}"
TITLE="${2:-$(basename "$FILE" .txt)}"
ITEMS_FILE="${3:-$ROOT/fixtures/work-items.json}"

: "${PIPELINE_WEBTRIGGER_URL:?set PIPELINE_WEBTRIGGER_URL (forge webtrigger to print it)}"

BODY=$(jq -n \
  --rawfile transcript "$FILE" \
  --arg title "$TITLE" \
  --arg date "$(date +%Y-%m-%d)" \
  --slurpfile items "$ITEMS_FILE" \
  '{transcript: $transcript, meeting_title: $title, attendees: ["Danny", "Sarah", "Marcus", "Priya", "Jake", "Alex", "Sam"], date: $date, items: $items[0]}')

CURL_ARGS=(
  -sS -X POST "$PIPELINE_WEBTRIGGER_URL"
  -H "Content-Type: application/json"
)
if [[ -n "${INGEST_TOKEN:-}" ]]; then
  CURL_ARGS+=(-H "X-Ingest-Token: ${INGEST_TOKEN}")
fi

curl "${CURL_ARGS[@]}" --data-binary "$BODY" | jq .

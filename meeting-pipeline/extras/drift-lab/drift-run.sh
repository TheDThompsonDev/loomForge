#!/usr/bin/env bash
# Start a drift session: N naked runs + M shelled runs on one transcript.
# Usage:
#   PIPELINE_WEBTRIGGER_URL=... PIPELINE_SHARED_SECRET=... \
#     ./drift-run.sh ../fixtures/trap-meeting.txt 20 3
set -euo pipefail

FILE="${1:?usage: drift-run.sh <transcript-file> [naked-runs] [shelled-runs]}"
NAKED="${2:-20}"
SHELLED="${3:-3}"
TITLE="$(basename "$FILE" .txt)"

: "${PIPELINE_WEBTRIGGER_URL:?set PIPELINE_WEBTRIGGER_URL}"
: "${PIPELINE_SHARED_SECRET:?set PIPELINE_SHARED_SECRET}"

BODY=$(jq -n \
  --rawfile transcript "$FILE" \
  --arg title "$TITLE (drift)" \
  --arg date "$(date +%Y-%m-%d)" \
  '{transcript: $transcript, meeting_title: $title, attendees: ["Danny", "Sarah", "Marcus", "Priya", "Jake", "Alex", "Sam"], date: $date}')

SIGNATURE=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$PIPELINE_SHARED_SECRET" -hex | sed 's/^.*= //')

RESPONSE=$(curl -sS -X POST "${PIPELINE_WEBTRIGGER_URL}?mode=drift&runs=${NAKED}&shelled_runs=${SHELLED}" \
  -H "Content-Type: application/json" \
  -H "x-pipeline-signature: $SIGNATURE" \
  --data-binary "$BODY")
echo "$RESPONSE" | jq .

COMPARE_PATH=$(echo "$RESPONSE" | jq -r '.compare_url // empty')
if [ -n "$COMPARE_PATH" ]; then
  echo
  echo "When runs finish, view results:"
  echo "  ${PIPELINE_WEBTRIGGER_URL}${COMPARE_PATH}"
  echo "or open demo/drift-viewer.html and paste that URL."
fi

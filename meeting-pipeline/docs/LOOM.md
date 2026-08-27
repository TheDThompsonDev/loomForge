# Loom Ingestion

Resolved against current docs (August 2026): **Loom has no public API.**

## The facts

- Atlassian states it directly: "Loom does not offer an open API at this time" (support.atlassian.com/loom/docs/does-loom-have-an-open-api). The Loom SDKs cover recording and embedding only.
- There are no webhooks, no new-video events, no transcript endpoint, and no polling API.
- Transcripts exist and are auto-generated, but export is UI-only via the copy transcript button.
- The feature request for API transcript access is open: https://jira.atlassian.com/browse/LOOM-56

## The default path: paste plus link

1. Record the meeting in Loom. The transcript auto-generates.
2. Copy the transcript from the Loom UI.
3. Post it with the `loom_url` field included:

```json
{
  "transcript": "...",
  "meeting_title": "Weekly platform sync",
  "attendees": ["Danny", "Sarah"],
  "date": "2026-08-26",
  "loom_url": "https://www.loom.com/share/abc123"
}
```

Every created ticket then links back to the recording under "Source recording". Full traceability, no scraping, no egress.

## The opt-in fetcher: URL to transcript, eyes open

[src/ingestion/loomTranscript.js](../src/ingestion/loomTranscript.js) can fetch the transcript directly from a Loom URL, using the same internal endpoints Loom's own web player uses. It is off by default. Turning it on means accepting three tradeoffs:

1. **It is unsupported.** Loom can change or block these endpoints any day, including demo day. The code deep-searches responses instead of trusting exact shapes and always fails gracefully into "paste the transcript instead". Even so, never make a live demo depend on it.
2. **It costs the zero-egress story.** Enabling it requires declaring `www.loom.com` and `*.loom.com` egress in the manifest (the entries are there, commented out). The permissions section then reads "one narrowly scoped egress, and here is why" instead of "none".
3. **Terms-of-service gray zone.** Use it on your own videos.

To enable: uncomment the manifest egress entries, redeploy, then run `forge variables set LOOM_TRANSCRIPT_FETCH true`.

## If LOOM-56 ever ships

The seam is ready. A webhook or poller would land in `src/ingestion/`, normalize into the same payload shape shown above, and enter the pipeline at step 3. Nothing downstream changes.

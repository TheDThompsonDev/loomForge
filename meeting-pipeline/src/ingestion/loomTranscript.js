// UNOFFICIAL Loom transcript fetch, read docs/LOOM.md before enabling.
//
// Loom has no public transcript API (documented; LOOM-56 tracks the
// request). This module uses the same internal endpoints Loom's own web
// player uses. That means: unsupported, may break without notice, and OFF
// by default. It exists so the demo can show URL → transcript when Danny
// chooses to accept that risk for his own videos.
//
// Enable:
//   1. manifest.yml → uncomment the external.fetch loom entries
//   2. forge variables set LOOM_TRANSCRIPT_FETCH true
//
// Strategy (both best-effort, deep-searching responses rather than relying
// on exact shapes, so minor Loom changes don't break us):
//   A. POST loom.com/graphql FetchVideoTranscript → captions URL
//   B. GET the share page HTML → find a captions/VTT URL in embedded JSON
// Then fetch the VTT and flatten to plain text. Any failure returns
// { ok: false, reason }, the caller falls back to asking for a paste.
const api = require("@forge/api");

function loomVideoId(loomUrl) {
  const match = /loom\.com\/share\/([a-f0-9]{16,})/i.exec(loomUrl || "");
  return match ? match[1] : null;
}

async function fetchLoomTranscript(loomUrl) {
  if (process.env.LOOM_TRANSCRIPT_FETCH !== "true") {
    return {
      ok: false,
      reason:
        "Loom transcript fetch is disabled (no public Loom API exists; the unofficial " +
        "fetcher is opt-in, see docs/LOOM.md). Paste the transcript from the Loom page instead.",
    };
  }
  const videoId = loomVideoId(loomUrl);
  if (!videoId) {
    return { ok: false, reason: "Could not parse a video id from that Loom URL." };
  }

  try {
    const captionsUrl = (await tryGraphql(videoId)) || (await trySharePage(loomUrl));
    if (!captionsUrl) {
      return {
        ok: false,
        reason:
          "Loom did not expose a captions file for this video (it may be private, still " +
          "processing, or Loom changed their internals). Paste the transcript instead.",
      };
    }

    const vttResponse = await api.fetch(captionsUrl);
    if (!vttResponse.ok) {
      return { ok: false, reason: `Captions download failed (HTTP ${vttResponse.status}).` };
    }
    const transcript = vttToText(await vttResponse.text());
    if (transcript.length < 50) {
      return { ok: false, reason: "Captions file was empty or too short." };
    }
    return { ok: true, transcript };
  } catch (error) {
    console.warn("[Loom] transcript fetch failed:", error.message);
    return { ok: false, reason: `Loom fetch failed: ${error.message}. Paste the transcript instead.` };
  }
}

async function tryGraphql(videoId) {
  const response = await api.fetch("https://www.loom.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operationName: "FetchVideoTranscript",
      variables: { videoId, password: null },
      query:
        "query FetchVideoTranscript($videoId: ID!, $password: String) {\n" +
        "  fetchVideoTranscript(videoId: $videoId, password: $password) {\n" +
        "    ... on VideoTranscriptDetails {\n      captions_source_url\n      source_url\n    }\n" +
        "    __typename\n  }\n}",
    }),
  });
  if (!response.ok) return null;
  return findCaptionsUrl(await response.json());
}

async function trySharePage(loomUrl) {
  const response = await api.fetch(loomUrl, {
    headers: { Accept: "text/html" },
  });
  if (!response.ok) return null;
  const html = await response.text();
  const match =
    /"captions_source_url"\s*:\s*"([^"]+)"/.exec(html) ||
    /https:\/\/[^"'\s]+\.vtt[^"'\s]*/.exec(html);
  return match ? JSON.parse(`"${match[1] || match[0]}"`) : null;
}

// Walk any JSON shape looking for a captions/VTT URL, resilient to Loom
// renaming wrapper fields.
function findCaptionsUrl(node) {
  if (typeof node === "string") {
    return /^https:\/\/.+(\.vtt|captions)/i.test(node) ? node : null;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findCaptionsUrl(item);
      if (found) return found;
    }
    return null;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node)) {
      if (/captions?_?(source_)?url|transcript_url/i.test(key) && typeof value === "string") {
        return value;
      }
      const found = findCaptionsUrl(value);
      if (found) return found;
    }
  }
  return null;
}

// WEBVTT → plain text: drop the header, cue ids, timestamps, and inline
// styling tags; collapse the rest into readable lines.
function vttToText(vtt) {
  const lines = vtt.split(/\r?\n/);
  const out = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^WEBVTT/i.test(line)) continue;
    if (/^(NOTE|STYLE|REGION)\b/.test(line)) continue;
    if (/-->/.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    out.push(line.replace(/<[^>]+>/g, ""));
  }
  // De-duplicate consecutive identical caption lines (VTT rolling captions).
  const deduped = out.filter((line, i) => line !== out[i - 1]);
  return deduped.join(" ").replace(/\s+/g, " ").trim();
}

module.exports = { fetchLoomTranscript, loomVideoId, vttToText };

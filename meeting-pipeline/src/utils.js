function truncate(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": ["application/json"] },
    body: JSON.stringify(body),
  };
}

// Collapse whitespace runs and strip smart quotes so that a quote which is
// verbatim-in-substance still matches after LLM whitespace/quote drift.
// Anything beyond this normalization is a real mismatch and gets dropped.
function normalizeForMatch(text) {
  return (text || "")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function newId(prefix) {
  // Timestamp + random suffix: sortable, collision-safe enough for a demo app.
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${rand}`;
}

function elapsedMs(start) {
  return Date.now() - start;
}

module.exports = { truncate, jsonResponse, normalizeForMatch, newId, elapsedMs };

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

function newId(prefix) {
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${Date.now()}-${rand}`;
}

module.exports = { truncate, jsonResponse, newId };

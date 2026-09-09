const { ISSUE_KEY } = require("./config");

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

function header(request, name) {
  const headers = request.headers || {};
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  if (!key) return undefined;
  const value = headers[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseIssueKey(value) {
  const key = String(value || "").trim().toUpperCase();
  return ISSUE_KEY.test(key) ? key : null;
}

function adfToText(node, acc = []) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.type === "text" && node.text) acc.push(node.text);
  if (Array.isArray(node.content)) {
    for (const child of node.content) adfToText(child, acc);
    if (node.type === "paragraph" || node.type === "heading") acc.push("\n");
  }
  return acc.join("").replace(/\n{3,}/g, "\n\n").trim();
}

function asUserError(error) {
  if (error && (error.name === "NEEDS_AUTHENTICATION_ERR" || error.name === "NeedsAuthenticationError")) {
    return "asUser() needs the person in this chat to have permission for that API. Check the app scopes and their Jira/Confluence access.";
  }
  return error instanceof Error ? error.message : String(error);
}

module.exports = {
  truncate,
  jsonResponse,
  newId,
  header,
  parseIssueKey,
  adfToText,
  asUserError,
};

const { FETCH_HOSTS, LIMITS } = require("../config");
const { truncate } = require("../utils");

function parseAllowedUrl(raw) {
  let url;
  try {
    url = new URL(String(raw).trim());
  } catch {
    return { ok: false, error: "source_url is not a valid URL" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, error: "Only https URLs are allowed" };
  }
  if (url.username || url.password) {
    return { ok: false, error: "URLs must not include credentials" };
  }

  const host = url.hostname.toLowerCase();
  const allowed = FETCH_HOSTS.some((entry) => host === entry);
  if (!allowed) {
    return {
      ok: false,
      error:
        `Host "${host}" is not in the workshop allowlist (${FETCH_HOSTS.join(", ")}). ` +
        "Add the domain to FETCH_HOSTS and to permissions.external.fetch.backend.",
    };
  }

  return { ok: true, url };
}

function toPlainText(body, contentType) {
  const type = (contentType || "").toLowerCase();
  if (type.includes("application/json")) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchSource(rawUrl) {
  const parsed = parseAllowedUrl(rawUrl);
  if (!parsed.ok) return parsed;

  // Studio-built agents cannot declare egress. This fetch is the Forge extra:
  // the host must be listed in permissions.external.fetch.backend or Forge returns 403.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.SOURCE_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { Accept: "text/html, application/json, text/plain" },
    });

    if (response.status === 403) {
      return {
        ok: false,
        error:
          `Forge blocked ${parsed.url.hostname}. Declare it under ` +
          "permissions.external.fetch.backend and redeploy.",
      };
    }
    if (!response.ok) {
      return { ok: false, error: `Source returned HTTP ${response.status}` };
    }

    const buf = await response.arrayBuffer();
    const slice = buf.byteLength > LIMITS.MAX_SOURCE_BYTES
      ? buf.slice(0, LIMITS.MAX_SOURCE_BYTES)
      : buf;
    const raw = new TextDecoder("utf-8").decode(slice);
    const text = truncate(toPlainText(raw, response.headers.get("content-type")), LIMITS.MAX_SOURCE_CHARS);

    return {
      ok: true,
      url: parsed.url.toString(),
      status: response.status,
      truncated: raw.length > LIMITS.MAX_SOURCE_CHARS || buf.byteLength > LIMITS.MAX_SOURCE_BYTES,
      text,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      return { ok: false, error: `Timed out fetching ${parsed.url.hostname}` };
    }
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchSource, parseAllowedUrl };

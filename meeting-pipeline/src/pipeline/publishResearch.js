const api = require("@forge/api");
const { route } = api;
const storage = require("../storage");
const { commentIssue } = require("./commentIssue");

async function publishResearch({ issueKey, title, findings, sourceUrl }) {
  const existing = await storage.getResearch(issueKey);
  if (existing?.pageUrl) {
    return { ok: true, resumed: true, ...existing };
  }

  const spaceKey = process.env.CONFLUENCE_SPACE_KEY;
  if (!spaceKey) {
    return {
      ok: false,
      error: "CONFLUENCE_SPACE_KEY not set (forge variables set CONFLUENCE_SPACE_KEY <key>)",
    };
  }

  const spaceId = await resolveSpaceId(spaceKey);
  const pageTitle = `${title} (${issueKey})`;

  const response = await api.asUser().requestConfluence(route`/wiki/api/v2/pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      spaceId,
      status: "current",
      title: pageTitle,
      body: {
        representation: "storage",
        value: renderStorageFormat({ issueKey, findings, sourceUrl }),
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return { ok: false, error: `Confluence API ${response.status}: ${errorBody}` };
  }

  const result = await response.json();
  const pageUrl = buildPageUrl(result);
  const record = { issueKey, pageId: result.id, pageUrl, title: pageTitle };

  await storage.saveResearch(issueKey, record);
  await commentIssue({
    issueKey,
    asUser: true,
    lines: [
      { prefix: "Research published: ", text: pageTitle, strong: true },
      { link: pageUrl },
    ],
  });
  console.log(`[Research] ${issueKey} -> ${pageUrl}`);
  return { ok: true, resumed: false, ...record };
}

async function resolveSpaceId(spaceKey) {
  const response = await api.asUser().requestConfluence(
    route`/wiki/api/v2/spaces?keys=${spaceKey}&limit=1`
  );
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Confluence space lookup ${response.status}: ${errorBody}`);
  }
  const data = await response.json();
  const space = (data.results || [])[0];
  if (!space?.id) {
    throw new Error(`No Confluence space found with key "${spaceKey}"`);
  }
  return String(space.id);
}

function buildPageUrl(result) {
  const webui = result._links?.webui || `/spaces/${result.spaceId}/pages/${result.id}`;
  if (/^https?:\/\//.test(webui)) return webui;
  const base = (result._links?.base || "").replace(/\/$/, "");
  if (base) return `${base}${webui.startsWith("/") ? "" : "/"}${webui}`;
  return `/wiki${webui.startsWith("/") ? "" : "/"}${webui}`;
}

function renderStorageFormat({ issueKey, findings, sourceUrl }) {
  const parts = [];
  parts.push(
    `<p>Research for <ac:structured-macro ac:name="jira">` +
      `<ac:parameter ac:name="key">${esc(issueKey)}</ac:parameter>` +
      `</ac:structured-macro>, written by the Meeting Pipeline agent.</p>`
  );
  if (sourceUrl) {
    parts.push(`<p>Source: <a href="${esc(sourceUrl)}">${esc(sourceUrl)}</a></p>`);
  }
  parts.push(`<h2>Findings</h2>`);
  parts.push(paragraphs(findings));
  return parts.join("\n");
}

function paragraphs(text) {
  return String(text)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join("\n");
}

function esc(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { publishResearch, renderStorageFormat, buildPageUrl };

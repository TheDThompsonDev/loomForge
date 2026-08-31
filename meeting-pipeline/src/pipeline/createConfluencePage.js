const api = require("@forge/api");
const { route } = api;

async function createConfluencePage({ meeting, createdTickets, jobId }) {
  const spaceKey = process.env.CONFLUENCE_SPACE_KEY;
  if (!spaceKey) {
    throw new Error("CONFLUENCE_SPACE_KEY not set (forge variables set CONFLUENCE_SPACE_KEY <key>)");
  }

  const spaceId = await resolveSpaceId(spaceKey);
  const title = `${meeting.meetingTitle} (${meeting.date || new Date().toISOString().slice(0, 10)})`;
  const payload = {
    spaceId,
    status: "current",
    title,
    body: {
      representation: "storage",
      value: renderStorageFormat({ meeting, createdTickets, jobId }),
    },
  };

  const response = await api.asApp().requestConfluence(route`/wiki/api/v2/pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Confluence API ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const pageUrl = buildPageUrl(result);
  console.log(`[Confluence] Created page ${result.id}: ${title}`);
  return { pageId: result.id, pageUrl, title };
}

async function resolveSpaceId(spaceKey) {
  const response = await api.asApp().requestConfluence(
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

function renderStorageFormat({ meeting, createdTickets, jobId }) {
  const parts = [];

  parts.push(
    `<ac:structured-macro ac:name="info"><ac:rich-text-body><p>` +
      `Created by meeting-pipeline from <strong>${esc(meeting.meetingTitle)}</strong>` +
      `${meeting.date ? ` (${esc(meeting.date)})` : ""}` +
      `${meeting.attendees?.length ? `, attendees: ${esc(meeting.attendees.join(", "))}` : ""}.` +
      `</p></ac:rich-text-body></ac:structured-macro>`
  );

  parts.push(`<h2>Captured input</h2>`);
  parts.push(paragraphs(meeting.transcript));

  if (createdTickets.length > 0) {
    parts.push(`<h2>Tracked in Jira</h2><ul>`);
    for (const t of createdTickets) {
      parts.push(
        `<li><ac:structured-macro ac:name="jira">` +
          `<ac:parameter ac:name="key">${esc(t.issueKey)}</ac:parameter>` +
          `</ac:structured-macro> ${esc(t.summary || "")}</li>`
      );
    }
    parts.push(`</ul>`);
  }

  parts.push(`<hr/><p><em>Pipeline job: ${esc(jobId)}</em></p>`);
  return parts.join("\n");
}

function paragraphs(text) {
  return text
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

module.exports = { createConfluencePage, renderStorageFormat, buildPageUrl };

const api = require("@forge/api");
const { route } = api;
const { composePlanOfRecord, renderPlanOfRecord } = require("./planOfRecord");

async function createMeetingPage({ meeting, items, tickets, jobId }) {
  const spaceKey = process.env.CONFLUENCE_SPACE_KEY;
  if (!spaceKey) {
    throw new Error("CONFLUENCE_SPACE_KEY not set (forge variables set CONFLUENCE_SPACE_KEY <key>)");
  }

  const spaceId = await resolveSpaceId(spaceKey);
  const doc = composePlanOfRecord({ meeting, items, tickets });
  const title = doc.title;

  const response = await api.asApp().requestConfluence(route`/wiki/api/v2/pages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      spaceId,
      status: "current",
      title,
      body: {
        representation: "storage",
        value: renderPlanOfRecord({ doc, meeting, tickets, jobId }),
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Confluence API ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const pageUrl = buildPageUrl(result, spaceKey);
  console.log(`[Confluence] Created page ${result.id}: ${title} ${pageUrl}`);
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

function buildPageUrl(result, spaceKey) {
  const webui = result._links?.webui;
  if (webui && /^https?:\/\//.test(webui)) return webui;
  const base = (result._links?.base || "").replace(/\/$/, "");
  if (webui && base) return `${base}${webui.startsWith("/") ? "" : "/"}${webui}`;
  if (webui) return webui.startsWith("/wiki") ? webui : `/wiki${webui.startsWith("/") ? "" : "/"}${webui}`;
  return `/wiki/spaces/${spaceKey}/pages/${result.id}`;
}

module.exports = { createMeetingPage };

// AI slot 2 of 2. One job: given validated action items plus org context,
// suggest owner, epic, and related work. The org context itself is fetched
// by deterministic code, the AI only interprets it.
//
// Context source, in order of preference:
//   1. Teamwork Graph API (EAP), person↔work relationships via
//      api.asApp().requestTeamworkGraph(). Gated behind an allowlist, so it
//      is opt-in via TEAMWORK_GRAPH_ENABLED=true. See docs/TEAMWORK-GRAPH.md.
//   2. Fallback (default): Jira issue search + Confluence page search.
//      Clearly marked, per spec §7.
const api = require("@forge/api");
const { route } = api;
const { callModel } = require("../llm");

const ENRICHMENT_SYSTEM_PROMPT = `You enrich engineering action items with organizational context.

You will receive a list of action items extracted from a meeting, plus context about existing work in the organization (open tickets, recent documents, and the people connected to them).

Respond only with a valid JSON object, no markdown, no code fences:

{
  "enriched_items": [
    {
      "suggested_owner": "best-match person based on who owns related work, or null",
      "suggested_epic": "epic key (e.g. PROJ-12) this belongs under, or null",
      "related_tickets": ["issue keys from the provided context that overlap with this item"],
      "related_docs": ["document titles from the provided context that are relevant"]
    }
  ]
}

Hard rules:
- Return exactly one entry per action item, in the same order.
- Only reference tickets, docs, epics, and people that appear in the provided context. Never invent a key, a title, or a name.
- If the context contains no good match, null and empty arrays are the correct answer.`;

async function enrich({ actionItems, meetingTitle }) {
  const context = await gatherOrgContext(actionItems);

  const user = `Meeting: ${meetingTitle}

Action items:
${JSON.stringify(actionItems.map(({ summary, description, suggested_owner }) => ({ summary, description, suggested_owner })), null, 2)}

Organizational context (source: ${context.source}):
${JSON.stringify(context.data, null, 2)}`;

  const result = await callModel({
    system: ENRICHMENT_SYSTEM_PROMPT,
    user,
    maxTokens: 4096,
  });
  return { ...result, contextSource: context.source };
}

// ── Deterministic context gathering ────────────────────────────────────

async function gatherOrgContext(actionItems) {
  if (process.env.TEAMWORK_GRAPH_ENABLED === "true") {
    try {
      const data = await queryTeamworkGraph(actionItems);
      return { source: "teamwork-graph", data };
    } catch (error) {
      console.warn("[Enricher] Teamwork Graph query failed, using fallback:", error.message);
    }
  }
  const data = await searchFallback(actionItems);
  return { source: "jira-confluence-search (fallback)", data };
}

// Teamwork Graph (EAP). Requires the app to be allowlisted and the
// read:graph:jira scope. Kept minimal: for the keywords in each action
// item, ask the graph for related work items and the people attached.
async function queryTeamworkGraph(actionItems) {
  const keywords = topKeywords(actionItems);
  // Cypher via the Teamwork Graph GraphQL wrapper. Shape verified against
  // developer.atlassian.com/platform/teamwork-graph/ (EAP; may change).
  const query = `
    MATCH (w:WorkItem)
    WHERE ${keywords.map((_, i) => `toLower(w.title) CONTAINS $kw${i}`).join(" OR ")}
    OPTIONAL MATCH (p:User)-[:ASSIGNED_TO|:WORKS_ON]-(w)
    RETURN w.key AS key, w.title AS title, w.status AS status, collect(p.name) AS people
    LIMIT 25`;
  const variables = Object.fromEntries(keywords.map((kw, i) => [`kw${i}`, kw.toLowerCase()]));

  const response = await api.asApp().requestTeamworkGraph(query, variables);
  if (!response.ok) {
    throw new Error(`Teamwork Graph HTTP ${response.status}`);
  }
  return await response.json();
}

// Fallback: plain Jira + Confluence REST search on action item keywords.
async function searchFallback(actionItems) {
  const keywords = topKeywords(actionItems);
  const [tickets, docs] = await Promise.all([
    searchJira(keywords),
    searchConfluence(keywords),
  ]);
  return { open_tickets: tickets, recent_docs: docs };
}

async function searchJira(keywords) {
  try {
    const jql = `statusCategory != Done AND text ~ "${keywords.join(" ")}" ORDER BY updated DESC`;
    const response = await api.asApp().requestJira(
      route`/rest/api/3/search/jql?jql=${jql}&maxResults=15&fields=summary,assignee,status,parent,issuetype`
    );
    if (!response.ok) {
      console.warn(`[Enricher] Jira search failed: HTTP ${response.status}`);
      return [];
    }
    const data = await response.json();
    return (data.issues || []).map((issue) => ({
      key: issue.key,
      summary: issue.fields?.summary,
      type: issue.fields?.issuetype?.name,
      status: issue.fields?.status?.name,
      assignee: issue.fields?.assignee?.displayName || null,
      epic: issue.fields?.parent?.key || null,
    }));
  } catch (error) {
    console.warn("[Enricher] Jira search error:", error.message);
    return [];
  }
}

async function searchConfluence(keywords) {
  try {
    const cql = `type=page AND text ~ "${keywords.join(" ")}" ORDER BY lastmodified DESC`;
    const response = await api
      .asApp()
      .requestConfluence(route`/wiki/rest/api/search?cql=${cql}&limit=10`);
    if (!response.ok) {
      // Confluence may simply not be present on the site, that's fine.
      console.warn(`[Enricher] Confluence search skipped: HTTP ${response.status}`);
      return [];
    }
    const data = await response.json();
    return (data.results || []).map((r) => ({
      title: r.content?.title || r.title,
      lastModified: r.lastModified,
    }));
  } catch (error) {
    console.warn("[Enricher] Confluence search error:", error.message);
    return [];
  }
}

// Cheap deterministic keyword picker: most frequent meaningful words across
// action item summaries. Good enough to scope a search; the AI never sees
// anything the search didn't return.
const STOPWORDS = new Set(
  "the a an and or but for with from into onto to of in on at by is are was were be been will would should could can need needs make making set setting get add update fix new our we they it this that".split(" ")
);

function topKeywords(actionItems, max = 6) {
  const counts = new Map();
  for (const item of actionItems) {
    const words = `${item.summary} ${item.description}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/);
    for (const w of words) {
      if (w.length < 4 || STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

module.exports = { enrich };

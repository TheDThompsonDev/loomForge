// Step 11: Jira ticket creation. Adapted from the WhatsApp app's
// createJiraIssue / buildAdfDescription pattern. Tickets land in the
// project's default column ("Review" in the demo board) with the
// meeting-pipeline label; a human moves them to "Approved for Agent".
const api = require("@forge/api");
const { route } = api;
const { LIMITS, LABELS, JIRA_PRIORITY_NAMES } = require("../config");
const { truncate } = require("../utils");

// alreadyCreated maps item index → issue key from a previous attempt of the
// same job; onCreated persists each new key immediately. Together they make
// a Forge retry resume instead of double-creating tickets.
async function createTickets({ items, meeting, jobId, alreadyCreated = {}, onCreated }) {
  const projectKey = process.env.JIRA_PROJECT_KEY || "MEET";
  const created = [];
  const failed = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (alreadyCreated[i]) {
      console.log(`[Jira] item ${i} already created as ${alreadyCreated[i]} (retry), skipping`);
      created.push({ issueKey: alreadyCreated[i], summary: item.summary, resumed: true });
      continue;
    }
    let result;
    try {
      result = await createOne({ item, meeting, projectKey, jobId });
    } catch (error) {
      console.error(`[Jira] Failed to create ticket "${item.summary}":`, error.message);
      failed.push({ summary: item.summary, error: error.message });
      continue;
    }
    created.push(result);

    if (onCreated) {
      // A checkpoint-save failure is not a ticket failure: the ticket
      // exists. The in-memory checkpoint still has the key and the next
      // successful save persists it.
      try {
        await onCreated(i, result.issueKey);
      } catch (error) {
        console.warn(`[Jira] Checkpoint save failed after creating ${result.issueKey}:`, error.message);
      }
    }
  }

  return { created, failed };
}

async function createOne({ item, meeting, projectKey, jobId }) {
  const labels = [LABELS.PIPELINE, LABELS.NEEDS_REVIEW];
  if (item.possible_duplicates && item.possible_duplicates.length > 0) {
    labels.push(LABELS.POSSIBLE_DUPLICATE);
  }

  const payload = {
    fields: {
      project: { key: projectKey },
      issuetype: { name: "Task" },
      summary: truncate(item.summary, LIMITS.MAX_JIRA_SUMMARY),
      description: buildAdfDescription({ item, meeting, jobId }),
      labels,
    },
  };

  if (item.priority && JIRA_PRIORITY_NAMES[item.priority]) {
    payload.fields.priority = { name: JIRA_PRIORITY_NAMES[item.priority] };
  }

  // asApp(): queue consumers run in a background context with no user
  // session (same reasoning as the WhatsApp app, asUser() breaks with
  // AUTH_TYPE_UNAVAILABLE after reinstalls).
  const response = await api.asApp().requestJira(route`/rest/api/3/issue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Jira API ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  console.log(`[Jira] Created ${result.key}: ${item.summary}`);
  return { issueKey: result.key, summary: item.summary };
}

// ADF description: every section a reviewer needs to approve or reject in
// one glance, including the verbatim evidence quote that got this item
// through the gate.
function buildAdfDescription({ item, meeting, jobId }) {
  const content = [];

  content.push(paragraph([strong("Created by meeting-pipeline"), text(` from "${meeting.meetingTitle}"${meeting.date ? ` (${meeting.date})` : ""}`)]));

  content.push(heading("Description"));
  for (const para of item.description.split(/\n\n+/)) {
    if (para.trim()) content.push(paragraph([text(para.trim())]));
  }

  content.push(heading("Evidence from transcript"));
  content.push({
    type: "blockquote",
    content: [paragraph([em(`"${item.evidence_quote}"`)])],
  });

  if (item.acceptance_criteria.length > 0) {
    content.push(heading("Acceptance criteria"));
    content.push({
      type: "bulletList",
      content: item.acceptance_criteria.map((c) => ({
        type: "listItem",
        content: [paragraph([text(c)])],
      })),
    });
  }

  const facts = [];
  if (item.suggested_owner) facts.push(`Suggested owner: ${item.suggested_owner}`);
  if (item.suggested_epic) facts.push(`Suggested epic: ${item.suggested_epic}`);
  if (item.related_tickets && item.related_tickets.length > 0) {
    facts.push(`Related tickets: ${item.related_tickets.join(", ")}`);
  }
  if (item.related_docs && item.related_docs.length > 0) {
    facts.push(`Related docs: ${item.related_docs.join("; ")}`);
  }
  facts.push(`Extraction confidence: ${Math.round(item.confidence * 100)}%`);

  content.push(heading("Pipeline context"));
  for (const fact of facts) content.push(paragraph([text(fact)]));

  if (item.possible_duplicates && item.possible_duplicates.length > 0) {
    content.push(heading("Possible duplicates (review before approving)"));
    for (const dup of item.possible_duplicates) {
      content.push(
        paragraph([
          text(`${dup.key}, "${dup.summary}" (${dup.status}, ${Math.round(dup.similarity * 100)}% similar)`),
        ])
      );
    }
  }

  content.push({ type: "rule" });
  if (meeting.loomUrl) {
    content.push(
      paragraph([
        strong("Source recording: "),
        {
          type: "text",
          text: meeting.loomUrl,
          marks: [{ type: "link", attrs: { href: meeting.loomUrl } }],
        },
      ])
    );
  }
  content.push(paragraph([em(`Pipeline job: ${jobId}`)]));

  return { type: "doc", version: 1, content };
}

// ADF micro-helpers
const text = (t) => ({ type: "text", text: t });
const strong = (t) => ({ type: "text", text: t, marks: [{ type: "strong" }] });
const em = (t) => ({ type: "text", text: t, marks: [{ type: "em" }] });
const paragraph = (content) => ({ type: "paragraph", content });
const heading = (t) => ({
  type: "heading",
  attrs: { level: 3 },
  content: [text(t)],
});

module.exports = { createTickets, buildAdfDescription };

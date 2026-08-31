const api = require("@forge/api");
const { route } = api;
const { LIMITS, LABELS } = require("../config");
const { truncate } = require("../utils");

async function createTickets({ meeting, jobId, alreadyCreated = {}, onCreated }) {
  const projectKey = process.env.JIRA_PROJECT_KEY || "MEET";
  const created = [];
  const failed = [];
  const summary = meeting.meetingTitle;

  if (alreadyCreated[0]) {
    console.log(`[Jira] already created as ${alreadyCreated[0]} (retry), skipping`);
    created.push({ issueKey: alreadyCreated[0], summary, resumed: true });
    return { created, failed };
  }

  try {
    const result = await createOne({ meeting, projectKey, jobId });
    created.push(result);
    if (onCreated) {
      try {
        await onCreated(0, result.issueKey);
      } catch (error) {
        console.warn(`[Jira] Checkpoint save failed after creating ${result.issueKey}:`, error.message);
      }
    }
  } catch (error) {
    console.error(`[Jira] Failed to create ticket "${summary}":`, error.message);
    failed.push({ summary, error: error.message });
  }

  return { created, failed };
}

async function createOne({ meeting, projectKey, jobId }) {
  const payload = {
    fields: {
      project: { key: projectKey },
      issuetype: { name: "Task" },
      summary: truncate(meeting.meetingTitle, LIMITS.MAX_JIRA_SUMMARY),
      description: buildAdfDescription({ meeting, jobId }),
      labels: [LABELS.PIPELINE, LABELS.NEEDS_REVIEW],
    },
  };

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
  console.log(`[Jira] Created ${result.key}: ${meeting.meetingTitle}`);
  return { issueKey: result.key, summary: meeting.meetingTitle };
}

function buildAdfDescription({ meeting, jobId }) {
  const content = [];

  content.push(
    paragraph([
      strong("Created by meeting-pipeline"),
      text(`${meeting.date ? ` (${meeting.date})` : ""}`),
    ])
  );

  if (meeting.attendees?.length) {
    content.push(paragraph([text(`Attendees: ${meeting.attendees.join(", ")}`)]));
  }

  content.push(heading("Captured input"));
  for (const para of meeting.transcript.split(/\n\n+/)) {
    if (para.trim()) content.push(paragraph([text(para.trim())]));
  }

  content.push({ type: "rule" });
  content.push(paragraph([em(`Pipeline job: ${jobId}`)]));

  return { type: "doc", version: 1, content };
}

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

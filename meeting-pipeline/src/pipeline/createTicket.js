const api = require("@forge/api");
const { route } = api;
const { LIMITS, LABELS } = require("../config");
const { truncate } = require("../utils");

async function createTicket({ meeting, item, jobId, alreadyCreated }) {
  if (alreadyCreated) {
    console.log(`[Jira] already created as ${alreadyCreated} (retry), skipping`);
    return {
      issueKey: alreadyCreated,
      summary: item.summary,
      route: item.route,
      resumed: true,
    };
  }

  const projectKey = process.env.JIRA_PROJECT_KEY || "MEET";
  const labels = [LABELS.PIPELINE, LABELS.NEEDS_REVIEW];
  if (item.route === "agent") {
    labels.push(LABELS.ASSIGN_TO_AGENT);
  }

  const payload = {
    fields: {
      project: { key: projectKey },
      issuetype: { name: "Task" },
      summary: truncate(item.summary, LIMITS.MAX_JIRA_SUMMARY),
      description: buildAdfDescription({ meeting, item, jobId }),
      labels,
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
  console.log(`[Jira] Created ${result.key}: ${item.summary} (${item.route})`);
  return { issueKey: result.key, summary: item.summary, route: item.route };
}

function buildAdfDescription({ meeting, item, jobId }) {
  const content = [];

  content.push(
    paragraph([
      strong("Created by meeting-pipeline"),
      text(`${meeting.date ? ` (${meeting.date})` : ""}`),
      text(` · route: ${item.route}`),
    ])
  );

  if (item.owner) {
    content.push(paragraph([text(`Owner from the meeting: ${item.owner}`)]));
  }
  if (meeting.attendees?.length) {
    content.push(paragraph([text(`Attendees: ${meeting.attendees.join(", ")}`)]));
  }

  if (item.detail) {
    content.push(heading("Work item"));
    for (const para of item.detail.split(/\n\n+/)) {
      if (para.trim()) content.push(paragraph([text(para.trim())]));
    }
  }

  content.push(heading("From meeting"));
  content.push(paragraph([text(meeting.meetingTitle)]));

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

module.exports = { createTicket, buildAdfDescription };

const storage = require("../storage");
const { commentIssue } = require("./commentIssue");
const { LABELS, AGENT_HANDOFF_STATUS } = require("../config");

function isHandoffEvent(event) {
  if (event.eventType === "avi:jira:assigned:issue") {
    return true;
  }
  const target = process.env.AGENT_HANDOFF_STATUS || AGENT_HANDOFF_STATUS;
  const items = event.changelog?.items || [];
  return items.some((item) => item.field === "status" && item.toString === target);
}

async function onAgentHandoff(event) {
  const issueKey = event.issue?.key;
  const labels = event.issue?.fields?.labels || [];
  if (!issueKey || !labels.includes(LABELS.ASSIGN_TO_AGENT)) {
    return;
  }
  if (!isHandoffEvent(event)) {
    return;
  }

  const existing = await storage.getHandoff(issueKey);
  if (existing) {
    return;
  }

  // The ticket is now a job. This app does not pick the agent —
  // Meeting Pipeline, Copilot, or any assignable agent can take it.
  await commentIssue({
    issueKey,
    asUser: false,
    lines: [
      {
        prefix: "Agent task triggered. ",
        text: "This ticket is ready for an assignable agent (Meeting Pipeline, Copilot, or another custom agent).",
      },
    ],
  });

  await storage.saveHandoff(issueKey, {
    issueKey,
    eventType: event.eventType,
    triggeredAt: new Date().toISOString(),
  });
  console.log(`[Handoff] agent task triggered for ${issueKey}`);
}

module.exports = { onAgentHandoff, isHandoffEvent };

const LIMITS = {
  MIN_INPUT_CHARS: 20,
  MAX_INPUT_CHARS: 60000,
  MAX_TITLE_CHARS: 200,
  MAX_ATTENDEES: 30,
  MAX_JIRA_SUMMARY: 255,
  MAX_ITEMS: 8,
  MAX_ITEM_DETAIL: 4000,
  MAX_FINDINGS_CHARS: 20000,
  MAX_SOURCE_CHARS: 8000,
  MAX_SOURCE_BYTES: 100000,
  SOURCE_TIMEOUT_MS: 8000,
};

const LABELS = {
  PIPELINE: "meeting-pipeline",
  NEEDS_REVIEW: "needs-review",
  ASSIGN_TO_AGENT: "assign-to-agent",
};

const STORE = {
  JOB: "job:",
  RESEARCH: "research:",
  HANDOFF: "handoff:",
};

const AGENT_HANDOFF_STATUS = "Approved for Agent";

// Domains this app is allowed to fetch. Each one must also appear in
// permissions.external.fetch.backend — Forge rejects undeclared hosts.
const FETCH_HOSTS = [
  "developer.atlassian.com",
  "support.atlassian.com",
  "en.wikipedia.org",
  "www.wikipedia.org",
];

const ISSUE_KEY = /^[A-Z][A-Z0-9_]+-\d+$/i;

module.exports = {
  LIMITS,
  LABELS,
  STORE,
  FETCH_HOSTS,
  ISSUE_KEY,
  AGENT_HANDOFF_STATUS,
};

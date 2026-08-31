const LIMITS = {
  MIN_INPUT_CHARS: 20,
  MAX_INPUT_CHARS: 60000,
  MAX_TITLE_CHARS: 200,
  MAX_ATTENDEES: 30,
  MAX_JIRA_SUMMARY: 255,
};

const LABELS = {
  PIPELINE: "meeting-pipeline",
  NEEDS_REVIEW: "needs-review",
};

const STORE = {
  JOB: "job:",
};

module.exports = { LIMITS, LABELS, STORE };

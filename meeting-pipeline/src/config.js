// Central knobs for the pipeline. Everything deterministic lives in code;
// these are the only tunables.

const LIMITS = {
  // Ingestion payload bounds (step 3 of the pipeline)
  MIN_TRANSCRIPT_CHARS: 200,
  MAX_TRANSCRIPT_CHARS: 60000,
  MAX_TITLE_CHARS: 200,
  MAX_ATTENDEES: 30,

  // Jira field bounds
  MAX_SUMMARY_LENGTH: 120, // action item summaries stay short and scannable
  MAX_JIRA_SUMMARY: 255, // Jira's own summary field limit

  // Schema gate
  MAX_REPAIR_ATTEMPTS: 1, // one repair attempt, then dead-letter
  MAX_ACTION_ITEMS: 15,
  MAX_DECISIONS: 15,
};

const PRIORITIES = ["highest", "high", "medium", "low"];

const JIRA_PRIORITY_NAMES = {
  highest: "Highest",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const LABELS = {
  PIPELINE: "meeting-pipeline",
  NEEDS_REVIEW: "needs-review",
  POSSIBLE_DUPLICATE: "possible-duplicate",
};

// Storage key prefixes. Forge KV storage is a flat store; prefixes give us
// cheap namespacing.
const STORE = {
  JOB: "job:", // job state + checkpoints, keyed by jobId
  DEAD_LETTER: "dlq:", // dead-lettered jobs with reason
  METRICS: "metrics:", // per-run cost/latency
  COUNTER: "counter:tickets-created",
};

module.exports = { LIMITS, PRIORITIES, JIRA_PRIORITY_NAMES, LABELS, STORE };

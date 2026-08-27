// The comparison artifact: everything the gallery (and the JSON endpoint)
// needs to show scatter vs cluster, computed fresh from stored runs.
const storage = require("../storage");
const { analyzeRunSet } = require("./metrics");

async function buildComparison(sessionId) {
  const session = await storage.getDriftSession(sessionId);
  if (!session) return null;

  const [nakedRuns, shelledRuns] = await Promise.all([
    storage.getDriftRuns(sessionId, "naked", session.nakedRuns),
    storage.getDriftRuns(sessionId, "shelled", session.shelledRuns),
  ]);

  const nakedDone = nakedRuns.filter(Boolean);
  const shelledDone = shelledRuns.filter(Boolean);

  return {
    session: {
      id: sessionId,
      meetingTitle: session.meetingTitle,
      attendees: session.attendees,
      createdAt: session.createdAt,
      naked_requested: session.nakedRuns,
      shelled_requested: session.shelledRuns,
      naked_complete: nakedDone.length,
      shelled_complete: shelledDone.length,
      done:
        nakedDone.length >= session.nakedRuns &&
        shelledDone.length >= session.shelledRuns,
    },
    naked: {
      runs: nakedDone,
      set_metrics: analyzeRunSet(nakedDone.map((r) => r.metrics)),
      total_usage: totalUsage(nakedDone),
    },
    shelled: {
      runs: shelledDone,
      set_metrics: analyzeRunSet(shelledDone.map((r) => r.metrics)),
      total_usage: totalUsage(shelledDone),
    },
  };
}

function totalUsage(runs) {
  return runs.reduce(
    (acc, r) => ({
      input_tokens: acc.input_tokens + (r.usage?.input_tokens || 0),
      output_tokens: acc.output_tokens + (r.usage?.output_tokens || 0),
      total_tokens: acc.total_tokens + (r.usage?.total_tokens || 0),
      total_latency_ms: acc.total_latency_ms + (r.latencyMs || 0),
    }),
    { input_tokens: 0, output_tokens: 0, total_tokens: 0, total_latency_ms: 0 }
  );
}

module.exports = { buildComparison };

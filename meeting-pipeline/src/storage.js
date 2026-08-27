// Thin helpers over Forge KV storage (@forge/kvs). One value per key,
// values capped at 240 KiB, a job doc (transcript + checkpoints) stays
// well under it. The job doc is the pipeline's whole state machine.
// @forge/api v8 moved KV storage into its own package; the API surface
// (get/set by key) is unchanged.
const { kvs: storage } = require("@forge/kvs");
const { STORE } = require("./config");

async function saveJob(jobId, state) {
  await storage.set(`${STORE.JOB}${jobId}`, { ...state, updatedAt: new Date().toISOString() });
}

async function getJob(jobId) {
  return storage.get(`${STORE.JOB}${jobId}`);
}

async function deadLetter(jobId, reason, detail) {
  console.error(`[DLQ] job ${jobId}: ${reason}`, detail || "");
  await storage.set(`${STORE.DEAD_LETTER}${jobId}`, {
    jobId,
    reason,
    detail: detail || null,
    at: new Date().toISOString(),
  });
}

async function recordMetrics(runId, metrics) {
  await storage.set(`${STORE.METRICS}${runId}`, {
    ...metrics,
    at: new Date().toISOString(),
  });
}

async function incrementTicketCounter(by = 1) {
  try {
    const current = (await storage.get(STORE.COUNTER)) || 0;
    await storage.set(STORE.COUNTER, current + by);
  } catch (error) {
    console.warn("Failed to update ticket counter:", error.message);
  }
}

module.exports = {
  saveJob,
  getJob,
  deadLetter,
  recordMetrics,
  incrementTicketCounter,
};

// Shared entry logic for every front door. The web trigger (HTTP), the
// Custom UI console, and the Rovo agent actions all call these functions,
// auth differs per door, the pipeline does not.
//
// Workshop concepts here: @forge/events (async queue: accept fast, work
// later) and @forge/kvs (the job doc IS the state machine).
const { Queue } = require("@forge/events");
const storage = require("./storage");
const { newId } = require("./utils");
const { fetchLoomTranscript } = require("./ingestion/loomTranscript");

const pipelineQueue = new Queue({ key: "pipeline-queue" });

// payload: the validated output of validateIngestPayload().
async function createPipelineJob(payload) {
  const jobId = newId("job");
  await storage.saveJob(jobId, {
    status: "queued",
    meetingTitle: payload.meetingTitle,
    attendees: payload.attendees,
    date: payload.date,
    loomUrl: payload.loomUrl,
    generateDoc: Boolean(payload.generateDoc),
    transcript: payload.transcript,
  });
  // The event carries only the id, async event payloads are size-capped,
  // and the transcript already lives in storage.
  await pipelineQueue.push({ body: { jobId } });
  console.log(`[Ingest] job ${jobId} queued: "${payload.meetingTitle}"`);
  return { jobId };
}

// Pre-validation step shared by every door: if the caller gave a Loom URL
// but no transcript, try to fetch the transcript from Loom (opt-in,
// unofficial, see src/ingestion/loomTranscript.js). Returns the body ready
// for validateIngestPayload, or the errors to show the caller.
async function resolveIngestBody(rawBody) {
  let body;
  try {
    body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody || {};
  } catch {
    return { ok: false, errors: ["Body is not valid JSON"] };
  }
  if ((!body.transcript || !String(body.transcript).trim()) && body.loom_url) {
    const loom = await fetchLoomTranscript(body.loom_url);
    if (!loom.ok) return { ok: false, errors: [loom.reason] };
    body = { ...body, transcript: loom.transcript };
  }
  return { ok: true, body };
}

module.exports = { createPipelineJob, resolveIngestBody };

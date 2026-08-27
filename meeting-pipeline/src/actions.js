// Rovo action handlers, exposed as MCP tools via the rovo:mcp module
// (Preview). These are the same entry points as the web trigger, minus the
// HMAC: invocations arrive through Rovo, already authenticated and scoped
// by the platform. Same validation, same pipeline, different front door.
const { validateIngestPayload } = require("./ingestion/validate");
const { createPipelineJob, resolveIngestBody } = require("./service");
const storage = require("./storage");

// Tool: submit a meeting transcript to the pipeline.
// Inputs: transcript, meeting_title, attendees (comma-separated), date?, loom_url?
exports.submitTranscript = async (payload) => {
  const resolved = await resolveIngestBody({
    transcript: payload.transcript,
    meeting_title: payload.meeting_title,
    attendees: splitAttendees(payload.attendees),
    date: payload.date || undefined,
    loom_url: payload.loom_url || undefined,
    generate_doc: payload.generate_doc === true || payload.generate_doc === "true",
  });
  if (!resolved.ok) {
    return { success: false, errors: resolved.errors };
  }
  const validation = validateIngestPayload(resolved.body);
  if (!validation.ok) {
    return { success: false, errors: validation.errors };
  }
  const { jobId } = await createPipelineJob(validation.payload);
  return {
    success: true,
    jobId,
    message:
      "Transcript accepted. Extraction and enrichment are gated by code; " +
      "tickets will appear in the Review column for human approval" +
      (validation.payload.generateDoc ? ", and a strategy doc will be published to Confluence." : "."),
  };
};

// Tool: check the status of a pipeline job. Read-only; lets the agent
// answer "did my meeting finish processing, and what did it create?"
exports.getJobStatus = async (payload) => {
  const jobId = payload.job_id;
  if (!jobId) {
    return { success: false, errors: ["job_id is required"] };
  }
  const job = await storage.getJob(jobId);
  if (!job) {
    return { success: false, errors: [`No pipeline job ${jobId}`] };
  }
  // Sanitized for an agent's context window: status and outcomes, not the
  // 60KB transcript.
  return {
    success: true,
    status: job.status,
    meetingTitle: job.meetingTitle,
    tickets_created: job.result?.created || [],
    items_rejected_by_evidence_gate: (job.checkpoint?.dropped || []).map((d) => d.summary),
    confluence_page: job.result?.confluencePage || null,
    error: job.error || null,
  };
};

function splitAttendees(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    return value.split(",").map((a) => a.trim()).filter(Boolean);
  }
  return [];
}

const Resolver = require("@forge/resolver").default;
const { validateIngestPayload } = require("../ingestion/validate");
const { createPipelineJob } = require("../service");
const storage = require("../storage");

const resolver = new Resolver();

resolver.define("submitMeeting", async ({ payload }) => {
  try {
    const validation = validateIngestPayload({
      transcript: payload.transcript,
      meeting_title: payload.meeting_title,
      attendees: payload.attendees,
      date: payload.date || new Date().toISOString().slice(0, 10),
      generate_doc: payload.generate_doc,
      items: payload.items,
    });
    if (!validation.ok) {
      return { ok: false, errors: validation.errors };
    }
    const { jobId } = await createPipelineJob(validation.payload);
    return {
      ok: true,
      jobId,
      itemCount: validation.payload.items.length,
      generateDoc: validation.payload.generateDoc,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submit failed";
    console.error("submitMeeting failed:", message);
    return { ok: false, errors: [message] };
  }
});

resolver.define("getJob", async ({ payload }) => {
  const jobId = payload?.jobId;
  if (!jobId) return { ok: false, error: "jobId is required" };
  const job = await storage.getJob(jobId);
  if (!job) return { ok: false, error: `No job ${jobId}` };
  return { ok: true, job: summarizeJob(jobId, job) };
});

function summarizeJob(jobId, job) {
  return {
    jobId,
    meetingTitle: job.meetingTitle || "",
    status: job.status || "unknown",
    updatedAt: job.updatedAt || "",
    generateDoc: Boolean(job.generateDoc),
    failedAt: job.failedAt || null,
    error: job.error || job.checkpoint?.splitError || null,
    tickets: (job.result?.tickets || []).map((ticket) => ({
      issueKey: ticket.issueKey,
      summary: ticket.summary,
      route: ticket.route,
    })),
    confluencePage: job.result?.confluencePage || null,
    docError: job.result?.docError || null,
  };
}

exports.handler = resolver.getDefinitions();

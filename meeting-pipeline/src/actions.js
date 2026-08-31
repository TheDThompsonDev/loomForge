const { validateIngestPayload } = require("./ingestion/validate");
const { createPipelineJob } = require("./service");
const storage = require("./storage");

exports.submitTranscript = async (payload) => {
  const validation = validateIngestPayload({
    transcript: payload.transcript,
    meeting_title: payload.meeting_title,
    attendees: splitAttendees(payload.attendees),
    date: payload.date || undefined,
    generate_doc: payload.generate_doc === true || payload.generate_doc === "true",
  });
  if (!validation.ok) {
    return { success: false, errors: validation.errors };
  }
  const { jobId } = await createPipelineJob(validation.payload);
  return {
    success: true,
    jobId,
    message:
      "Input accepted. A Jira ticket will appear in Review for human approval" +
      (validation.payload.generateDoc ? ", and a Confluence page will be published." : "."),
  };
};

exports.getJobStatus = async (payload) => {
  const jobId = payload.job_id;
  if (!jobId) {
    return { success: false, errors: ["job_id is required"] };
  }
  const job = await storage.getJob(jobId);
  if (!job) {
    return { success: false, errors: [`No pipeline job ${jobId}`] };
  }
  return {
    success: true,
    status: job.status,
    meetingTitle: job.meetingTitle,
    tickets_created: job.result?.created || [],
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

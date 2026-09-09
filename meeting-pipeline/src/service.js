const { Queue } = require("@forge/events");
const storage = require("./storage");
const { newId } = require("./utils");

const pipelineQueue = new Queue({ key: "pipeline-queue" });

async function createPipelineJob(payload) {
  const jobId = newId("job");
  await storage.saveJob(jobId, {
    status: "queued",
    meetingTitle: payload.meetingTitle,
    attendees: payload.attendees,
    date: payload.date,
    transcript: payload.transcript,
    items: payload.items,
    generateDoc: Boolean(payload.generateDoc),
  });

  await pipelineQueue.push({ body: { jobId } });
  console.log(`[Ingest] job ${jobId} queued: "${payload.meetingTitle}"`);
  return { jobId };
}

module.exports = { createPipelineJob };

const { jsonResponse } = require("./utils");
const { validateIngestPayload } = require("./ingestion/validate");
const { createTickets } = require("./pipeline/createTickets");
const { createConfluencePage } = require("./pipeline/createConfluencePage");
const { createPipelineJob } = require("./service");
const storage = require("./storage");

exports.handleIngest = async (request) => {
  const validation = validateIngestPayload(request.body);
  if (!validation.ok) {
    return jsonResponse(400, { error: "Invalid payload", details: validation.errors });
  }

  const { jobId } = await createPipelineJob(validation.payload);
  return jsonResponse(202, {
    status: "accepted",
    jobId,
    message: "Input accepted. A Jira ticket will appear in Review shortly.",
  });
};

exports.processPipelineJob = async (event) => {
  const { jobId } = event.body;
  const job = await storage.getJob(jobId);
  if (!job) {
    console.error(`[Pipeline] job ${jobId} not found in storage`);
    return;
  }

  const meeting = {
    meetingTitle: job.meetingTitle,
    attendees: job.attendees,
    date: job.date,
    transcript: job.transcript,
  };
  const checkpoint = job.checkpoint || {};

  let phase = job.status;
  const save = (status, extra = {}) => {
    phase = status;
    return storage.saveJob(jobId, {
      ...job,
      status,
      checkpoint,
      error: null,
      failedAt: null,
      ...extra,
    });
  };

  try {
    checkpoint.createdKeys = checkpoint.createdKeys || {};
    await save("creating-tickets");
    const { created, failed } = await createTickets({
      meeting,
      jobId,
      alreadyCreated: checkpoint.createdKeys,
      onCreated: async (index, issueKey) => {
        checkpoint.createdKeys[index] = issueKey;
        await save("creating-tickets");
      },
    });

    if (job.generateDoc && !checkpoint.confluencePage) {
      await save("writing-doc");
      try {
        checkpoint.confluencePage = await createConfluencePage({
          meeting,
          createdTickets: created,
          jobId,
        });
        await save("writing-doc");
      } catch (error) {
        console.error(`[Pipeline] Confluence page failed (ticket unaffected):`, error.message);
        checkpoint.docError = error.message;
      }
    }

    await save("done", {
      result: {
        created,
        failed,
        confluencePage: checkpoint.confluencePage || null,
        docError: checkpoint.docError || null,
      },
    });
    console.log(`[Pipeline] job ${jobId} done: ${created.length} ticket(s) created`);
  } catch (error) {
    console.error(`[Pipeline] job ${jobId} failed:`, error);
    await storage.saveJob(jobId, {
      ...job,
      status: "failed",
      failedAt: phase,
      error: error.message,
      checkpoint,
    });
    throw error;
  }
};

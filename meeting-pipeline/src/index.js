const { jsonResponse, header } = require("./utils");
const { validateIngestPayload } = require("./ingestion/validate");
const { createTicket } = require("./pipeline/createTicket");
const { createMeetingPage } = require("./pipeline/createMeetingPage");
const { commentIssue } = require("./pipeline/commentIssue");
const { onAgentHandoff } = require("./pipeline/onAgentHandoff");
const { createPipelineJob } = require("./service");
const { splitMeeting } = require("./pipeline/splitMeeting");
const { needsLlmSplit } = require("./ingestion/validate");
const storage = require("./storage");

exports.handleIngest = async (request) => {
  const expected = process.env.INGEST_TOKEN;
  if (expected && header(request, "x-ingest-token") !== expected) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  const validation = validateIngestPayload(request.body);
  if (!validation.ok) {
    return jsonResponse(400, { error: "Invalid payload", details: validation.errors });
  }

  const { jobId } = await createPipelineJob(validation.payload);
  const agentCount = validation.payload.items.filter((item) => item.route === "agent").length;
  return jsonResponse(202, {
    status: "accepted",
    jobId,
    itemCount: validation.payload.items.length,
    agentItemCount: agentCount,
    message: `${validation.payload.items.length} work item(s) accepted. Tickets will appear in Review. ${agentCount} labeled assign-to-agent.`,
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
  let items = job.items || [];
  const checkpoint = job.checkpoint || {};
  checkpoint.createdKeys = checkpoint.createdKeys || {};

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
    if (!checkpoint.splitDone && needsLlmSplit(items, meeting.transcript)) {
      await save("splitting");
      const split = await splitMeeting({
        meetingTitle: meeting.meetingTitle,
        attendees: meeting.attendees,
        transcript: meeting.transcript,
      });
      if (split.ok) {
        items = split.items;
        job.items = items;
      } else {
        checkpoint.splitError = split.error;
      }
      checkpoint.splitDone = true;
      await save("splitting");
    }

    await save("creating-tickets");
    const tickets = [];
    for (let index = 0; index < items.length; index += 1) {
      const ticket = await createTicket({
        meeting,
        item: items[index],
        jobId,
        alreadyCreated: checkpoint.createdKeys[index],
      });
      checkpoint.createdKeys[index] = ticket.issueKey;
      tickets.push(ticket);
      await save("creating-tickets");
    }

    if (job.generateDoc && !checkpoint.confluencePage) {
      await save("writing-doc");
      try {
        checkpoint.confluencePage = await createMeetingPage({
          meeting,
          items,
          tickets,
          jobId,
        });
        await commentPageOnTickets(tickets, checkpoint.confluencePage);
        await save("writing-doc");
      } catch (error) {
        console.error(`[Pipeline] Confluence page failed (tickets unaffected):`, error.message);
        checkpoint.docError = error.message;
      }
    }

    await save("done", {
      result: {
        tickets,
        confluencePage: checkpoint.confluencePage || null,
        docError: checkpoint.docError || null,
      },
    });
    console.log(`[Pipeline] job ${jobId} done: ${tickets.map((t) => t.issueKey).join(", ")}`);
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

async function commentPageOnTickets(tickets, page) {
  if (!page?.pageUrl) return;
  for (const ticket of tickets) {
    if (!ticket.issueKey) continue;
    await commentIssue({
      issueKey: ticket.issueKey,
      asUser: false,
      lines: [
        { prefix: "Meeting notes published: ", text: page.title, strong: true },
        { link: page.pageUrl },
      ],
    });
  }
}

exports.onAgentHandoff = onAgentHandoff;

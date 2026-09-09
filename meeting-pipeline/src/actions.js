const { validateIngestPayload } = require("./ingestion/validate");
const { createPipelineJob } = require("./service");
const { loadIssue } = require("./pipeline/loadIssue");
const { fetchSource } = require("./pipeline/fetchSource");
const { publishResearch } = require("./pipeline/publishResearch");
const storage = require("./storage");
const { parseIssueKey, asUserError } = require("./utils");
const { LIMITS } = require("./config");

exports.submitTranscript = async (payload) => {
  const validation = validateIngestPayload({
    transcript: payload.transcript,
    meeting_title: payload.meeting_title,
    attendees: splitAttendees(payload.attendees),
    date: payload.date || undefined,
    items: payload.items,
    generate_doc: payload.generate_doc,
  });
  if (!validation.ok) {
    return { success: false, errors: validation.errors };
  }
  const { jobId } = await createPipelineJob(validation.payload);
  const agentCount = validation.payload.items.filter((item) => item.route === "agent").length;
  return {
    success: true,
    jobId,
    itemCount: validation.payload.items.length,
    agentItemCount: agentCount,
    message:
      `${validation.payload.items.length} work item(s) accepted. Tickets land in Review. ` +
      `${agentCount} labeled assign-to-agent — move those to Approved for Agent (or assign them) to trigger an agent task.`,
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

  const tickets = job.result?.tickets || [];
  const research = [];
  for (const ticket of tickets) {
    if (!ticket.issueKey) continue;
    const page = await storage.getResearch(ticket.issueKey);
    const handoff = await storage.getHandoff(ticket.issueKey);
    if (page || handoff) {
      research.push({
        issueKey: ticket.issueKey,
        page: page || null,
        handoff: handoff || null,
      });
    }
  }

  return {
    success: true,
    status: job.status,
    meetingTitle: job.meetingTitle,
    tickets,
    confluencePage: job.result?.confluencePage || null,
    docError: job.result?.docError || null,
    generateDoc: Boolean(job.generateDoc),
    research,
    error: job.error || null,
  };
};

exports.loadResearchContext = async (payload) => {
  const issueKey = resolveIssueKey(payload);
  if (!issueKey) {
    return { success: false, errors: ["issue_key is required (e.g. MEET-12)"] };
  }

  try {
    const issue = await loadIssue(issueKey);
    if (!issue.ok) {
      return { success: false, errors: [issue.error] };
    }

    let source = null;
    if (payload.source_url) {
      source = await fetchSource(payload.source_url);
    }

    return {
      success: true,
      issue,
      source,
      instruction:
        "Synthesize findings, risks, and a recommendation from the issue and any fetched source. Then call publish-research when the user wants it written up.",
    };
  } catch (error) {
    return { success: false, errors: [asUserError(error)] };
  }
};

exports.publishResearchDoc = async (payload) => {
  const issueKey = resolveIssueKey(payload);
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const findings = typeof payload.findings === "string" ? payload.findings.trim() : "";
  const sourceUrl = typeof payload.source_url === "string" ? payload.source_url.trim() : "";

  const errors = [];
  if (!issueKey) errors.push("issue_key is required (e.g. MEET-12)");
  if (!title) errors.push("title is required");
  if (!findings) errors.push("findings are required");
  if (findings.length > LIMITS.MAX_FINDINGS_CHARS) {
    errors.push(`findings too long (max ${LIMITS.MAX_FINDINGS_CHARS} chars)`);
  }
  if (errors.length) return { success: false, errors };

  try {
    const published = await publishResearch({
      issueKey,
      title,
      findings,
      sourceUrl: sourceUrl || undefined,
    });
    if (!published.ok) {
      return { success: false, errors: [published.error] };
    }
    return {
      success: true,
      issueKey: published.issueKey,
      pageId: published.pageId,
      pageUrl: published.pageUrl,
      title: published.title,
      resumed: published.resumed,
    };
  } catch (error) {
    return { success: false, errors: [asUserError(error)] };
  }
};

function resolveIssueKey(payload) {
  return parseIssueKey(payload.issue_key) || parseIssueKey(payload.context?.jira?.issueKey);
}

function splitAttendees(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    return value.split(",").map((a) => a.trim()).filter(Boolean);
  }
  return [];
}

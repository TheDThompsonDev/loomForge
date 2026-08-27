// Entry points. Deterministic code owns the flow; AI fills exactly two
// slots (extract, enrich) out of the ~14 pipeline steps. Every handler
// here is orchestration; the work lives in the specialized modules.
// @forge/resolver v2 ships an ESM default export only, so grab .default in CJS.
const Resolver = require("@forge/resolver").default;

const { jsonResponse } = require("./utils");
const { verifySignature, getSignatureHeader } = require("./ingestion/auth");
const { validateIngestPayload } = require("./ingestion/validate");
const { extract } = require("./pipeline/extractor");
const { enrich } = require("./pipeline/enricher");
const { validateExtraction, validateEnrichment } = require("./pipeline/schemaGate");
const { flagDuplicates } = require("./pipeline/dedupe");
const { createTickets } = require("./pipeline/createTickets");
const { writeStrategyDoc, validateStrategyDoc } = require("./pipeline/docWriter");
const { createStrategyPage } = require("./pipeline/createConfluencePage");
const { createPipelineJob, resolveIngestBody } = require("./service");
const storage = require("./storage");
const { LIMITS } = require("./config");

// ── Steps 1-4: web trigger (verify, validate, enqueue, fast ACK) ───────

exports.handleIngest = async (request) => {
  // Step 2: signature check before anything else touches the body.
  const secret = process.env.PIPELINE_SHARED_SECRET;
  if (!secret) {
    console.error("PIPELINE_SHARED_SECRET not set");
    return jsonResponse(500, { error: "Server misconfigured: shared secret missing" });
  }
  const signature = getSignatureHeader(request);
  if (!signature) {
    return jsonResponse(401, { error: "Missing x-pipeline-signature header" });
  }
  if (!verifySignature(secret, request.body, signature)) {
    console.error("Invalid pipeline signature: request rejected");
    return jsonResponse(403, { error: "Invalid signature" });
  }

  // Step 3: deterministic payload validation (after an optional Loom
  // transcript fetch when only a loom_url was provided).
  const resolved = await resolveIngestBody(request.body);
  if (!resolved.ok) {
    return jsonResponse(400, { error: "Invalid payload", details: resolved.errors });
  }
  const validation = validateIngestPayload(resolved.body);
  if (!validation.ok) {
    return jsonResponse(400, { error: "Invalid payload", details: validation.errors });
  }
  const payload = validation.payload;

  // Step 4: enqueue and ACK fast. The transcript lives in storage, not on
  // the event (async event payloads are size-capped).
  const { jobId } = await createPipelineJob(payload);
  return jsonResponse(202, {
    status: "accepted",
    jobId,
    message: "Transcript accepted. Tickets will appear in the Review column shortly.",
  });
};

// ── Steps 5-11: queue consumer (the pipeline itself) ───────────────────

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
    loomUrl: job.loomUrl || null,
  };
  // Every phase checkpoints into the job doc, so a Forge retry after a
  // mid-job crash resumes where it left off: no re-extraction (the AI is
  // nondeterministic, a retry could otherwise produce different tickets),
  // and no double-created tickets.
  const checkpoint = job.checkpoint || {};
  const stepMetrics = job.stepMetrics || {};

  // Single writer for job state. Tracks the current phase (so a failure can
  // record where it happened) and clears any error left by a previous
  // attempt, so a job that fails once and succeeds on retry does not end
  // "done" while still carrying a stale error message.
  let phase = job.status;
  const save = (status, extra = {}) => {
    phase = status;
    return storage.saveJob(jobId, {
      ...job,
      status,
      checkpoint,
      stepMetrics,
      error: null,
      failedAt: null,
      ...extra,
    });
  };

  try {
    // Step 6 [AI-1] + Step 7 [CODE]: extract, then gate with repair loop.
    let dropped;
    if (checkpoint.items) {
      console.log(`[Pipeline] job ${jobId}: resuming from checkpointed extraction`);
      dropped = checkpoint.dropped || [];
    } else {
      await save("extracting");
      const gateResult = await extractWithGate(jobId, job);
      stepMetrics.extract = gateResult.usage;
      dropped = gateResult.dropped;
      checkpoint.items = gateResult.validated.action_items;
      checkpoint.decisions = gateResult.validated.decisions;
      checkpoint.dropped = dropped;
      await save("extracted");
    }

    if (dropped.length > 0) {
      console.warn(
        `[Pipeline] evidence gate dropped ${dropped.length} item(s):`,
        dropped.map((d) => `"${d.summary}" (quote not in transcript)`).join("; ")
      );
    }

    if (checkpoint.items.length === 0) {
      await save("done", {
        result: { created: [], note: "No action items survived extraction + evidence gate" },
      });
      await storage.recordMetrics(jobId, {
        kind: "pipeline",
        tickets_created: 0,
        items_dropped_by_gate: dropped.length,
        steps: stepMetrics,
      });
      return;
    }

    // Step 8 [AI-2] + Step 9 [CODE]: enrich, then gate. Enrichment failure
    // is non-fatal, validated items proceed without enrichment rather
    // than dying on a nice-to-have. Step 10 [CODE]: dedupe (flag, don't
    // discard). Checkpointed together as the final ticket-ready item list.
    if (!checkpoint.finalItems) {
      await save("enriching");
      let items = checkpoint.items;
      try {
        const enrichResult = await enrich({ actionItems: items, meetingTitle: job.meetingTitle });
        stepMetrics.enrich = { usage: enrichResult.usage, latencyMs: enrichResult.latencyMs };
        const enrichGate = validateEnrichment(enrichResult.text, items);
        if (enrichGate.ok) {
          items = enrichGate.value;
          console.log(`[Pipeline] enriched ${items.length} items via ${enrichResult.contextSource}`);
        } else {
          console.warn("[Pipeline] enrichment failed gate, proceeding un-enriched:", enrichGate.errors.join("; "));
        }
      } catch (error) {
        console.warn("[Pipeline] enrichment errored, proceeding un-enriched:", error.message);
      }

      checkpoint.finalItems = await flagDuplicates(items);
      await save("enriched");
    } else {
      console.log(`[Pipeline] job ${jobId}: resuming from checkpointed enrichment`);
    }

    // Step 11 [CODE]: create tickets in the Review column, checkpointing
    // each created key so a retry never re-creates one.
    checkpoint.createdKeys = checkpoint.createdKeys || {};
    await save("creating-tickets");
    const { created, failed } = await createTickets({
      items: checkpoint.finalItems,
      meeting,
      jobId,
      alreadyCreated: checkpoint.createdKeys,
      onCreated: async (index, issueKey) => {
        checkpoint.createdKeys[index] = issueKey;
        await save("creating-tickets");
      },
    });
    await storage.incrementTicketCounter(created.filter((c) => !c.resumed).length);

    // Step 11b [AI-3] + [CODE]: optional strategy doc → Confluence.
    // Non-fatal: tickets are the primary product; a doc failure is
    // recorded on the job, not thrown (which would re-run the whole job).
    if (job.generateDoc && !checkpoint.confluencePage) {
      await save("writing-doc");
      try {
        checkpoint.confluencePage = await generateStrategyDoc({
          job,
          jobId,
          meeting,
          decisions: checkpoint.decisions || [],
          items: checkpoint.items,
          createdTickets: created,
          stepMetrics,
        });
        // Persist immediately: page creation is the one side effect
        // Confluence will not deduplicate for us on a retry.
        await save("writing-doc");
      } catch (error) {
        console.error(`[Pipeline] strategy doc failed (tickets unaffected):`, error.message);
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
    await storage.recordMetrics(jobId, {
      kind: "pipeline",
      tickets_created: created.length,
      items_dropped_by_gate: dropped.length,
      steps: stepMetrics,
    });
    console.log(`[Pipeline] job ${jobId} done: ${created.length} tickets created, ${dropped.length} dropped by gate`);

    // Steps 12-14 happen outside this code: human review moves tickets to
    // "Approved for Agent", Jira Automation routes by label to the
    // assignable agent, the agent opens a PR. See docs/JIRA-SETUP.md.
  } catch (error) {
    console.error(`[Pipeline] job ${jobId} failed:`, error);
    // Keep the checkpoint: the retry that follows this throw resumes from
    // it instead of re-running the AI or re-creating tickets. failedAt
    // records which stage died, so the console can render it truthfully.
    await storage.saveJob(jobId, {
      ...job,
      status: "failed",
      failedAt: phase,
      error: error.message,
      checkpoint,
      stepMetrics,
    });
    throw error; // let Forge retry semantics apply
  }
};

// Step 11b: AI-3 writes the strategy doc, gate 3 validates it (structure
// plus the no-dropped-decisions cross-check), one repair attempt, then
// deterministic code renders and publishes the Confluence page.
async function generateStrategyDoc({ job, jobId, meeting, decisions, items, createdTickets, stepMetrics }) {
  let attempt = await writeStrategyDoc({
    meetingTitle: job.meetingTitle,
    transcript: job.transcript,
    decisions,
    actionItems: items,
  });
  let gate = validateStrategyDoc(attempt.text, decisions);
  stepMetrics.doc = { usage: attempt.usage, latencyMs: attempt.latencyMs };

  if (!gate.ok) {
    console.warn("[Pipeline] strategy doc failed gate, repairing:", gate.errors.join("; "));
    attempt = await writeStrategyDoc({
      meetingTitle: job.meetingTitle,
      transcript: job.transcript,
      decisions,
      actionItems: items,
      repairError: gate.errors.join("\n"),
    });
    gate = validateStrategyDoc(attempt.text, decisions);
    stepMetrics.doc.repaired = true;
  }
  if (!gate.ok) {
    throw new Error(`Strategy doc failed gate after repair: ${gate.errors.join("; ")}`);
  }

  const page = await createStrategyPage({ doc: gate.value, meeting, createdTickets, jobId });
  return page;
}

// Step 7's repair loop, extracted for clarity: one repair attempt with the
// validator errors fed back, then dead-letter.
async function extractWithGate(jobId, job) {
  const args = {
    meetingId: jobId,
    meetingTitle: job.meetingTitle,
    attendees: job.attendees,
    transcript: job.transcript,
  };

  let attempt = await extract(args);
  let gate = validateExtraction(attempt.text, job.transcript);
  let usage = { first: attempt.usage, latencyMs: attempt.latencyMs, repaired: false };

  for (let retry = 0; !gate.ok && retry < LIMITS.MAX_REPAIR_ATTEMPTS; retry++) {
    console.warn(`[Pipeline] extraction failed gate (attempt ${retry + 1}):`, gate.errors.join("; "));
    attempt = await extract({ ...args, repairError: gate.errors.join("\n") });
    gate = validateExtraction(attempt.text, job.transcript);
    usage = { ...usage, repair: attempt.usage, repaired: true };
  }

  if (!gate.ok) {
    await storage.deadLetter(jobId, "extraction failed schema gate after repair", {
      errors: gate.errors,
      raw_output: attempt.text,
    });
    throw new Error(`Extraction dead-lettered: ${gate.errors.join("; ")}`);
  }

  return { validated: gate.value, dropped: gate.dropped, usage };
}

// ── Console resolver (Jira global page frontend) ───────────────────────

const resolver = new Resolver();

// The in-product front door: the console form submits here. No HMAC needed;
// the caller is a logged-in Jira user inside the app's own page.
resolver.define("submitMeeting", async ({ payload }) => {
  const resolved = await resolveIngestBody(payload);
  if (!resolved.ok) return { ok: false, errors: resolved.errors };
  const validation = validateIngestPayload(resolved.body);
  if (!validation.ok) return { ok: false, errors: validation.errors };
  const { jobId } = await createPipelineJob(validation.payload);
  return { ok: true, jobId };
});

// Job status for the console's live timeline. Sanitized: everything the
// UI needs, minus the transcript (which can be 60KB).
resolver.define("getJob", async ({ payload }) => {
  const job = await storage.getJob(payload.jobId);
  if (!job) return null;
  return {
    status: job.status,
    failedAt: job.failedAt || null,
    meetingTitle: job.meetingTitle,
    generateDoc: Boolean(job.generateDoc),
    error: job.error || null,
    dropped: (job.checkpoint?.dropped || []).map((d) => ({
      summary: d.summary,
      evidence_quote: d.evidence_quote,
    })),
    itemCount: job.checkpoint?.items?.length ?? null,
    created: job.result?.created || [],
    failed: job.result?.failed || [],
    confluencePage: job.result?.confluencePage || job.checkpoint?.confluencePage || null,
    docError: job.result?.docError || job.checkpoint?.docError || null,
    updatedAt: job.updatedAt,
  };
});

exports.consoleResolver = resolver.getDefinitions();


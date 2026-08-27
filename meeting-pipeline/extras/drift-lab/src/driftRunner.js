// Drift Mode: run the same transcript through (a) the naked prompt with no
// shell — no schema gate, no context, no rules — and (b) the full shelled
// pipeline extraction, N times each. Store everything; judge nothing here.
// The comparison endpoint and gallery do the judging with numbers.
//
// Fan-out design: the web trigger stores the transcript ONCE under the
// session, then pushes tiny {sessionId, mode, index} events to the drift
// queue (async event payloads are capped at 200 KB per push — the
// transcript never rides on the event). Each consumer invocation performs
// exactly one model call. 20 runs = 20 parallel-ish consumer invocations.
const { callModel } = require("../llm");
const { extract } = require("../pipeline/extractor");
const { validateExtraction } = require("../pipeline/schemaGate");
const { analyzeNakedRun, analyzeShelledRun } = require("./metrics");
const storage = require("../storage");
const { LIMITS } = require("../config");

// The naked prompt, verbatim from the spec. No schema. No rules. No shell.
const NAKED_PROMPT = "Read this meeting transcript and create Jira tickets for the action items.";

async function runNaked({ sessionId, index, session }) {
  const started = new Date().toISOString();
  try {
    const result = await callModel({
      system: null,
      user: `${NAKED_PROMPT}\n\n${session.transcript}`,
      maxTokens: 8192,
    });

    const metrics = analyzeNakedRun(result.text, session.transcript, session.attendees);

    await storage.saveDriftRun(sessionId, "naked", index, {
      index,
      mode: "naked",
      startedAt: started,
      raw_output: result.text,
      usage: result.usage,
      latencyMs: result.latencyMs,
      model: result.model,
      metrics,
    });
    console.log(
      `[Drift] naked run ${index}: ${metrics.action_item_count} items, ` +
        `${metrics.hallucinated_fields.length} hallucinated fields, ${result.latencyMs}ms`
    );
  } catch (error) {
    console.error(`[Drift] naked run ${index} failed:`, error.message);
    await storage.saveDriftRun(sessionId, "naked", index, {
      index,
      mode: "naked",
      startedAt: started,
      error: error.message,
    });
  }
}

async function runShelled({ sessionId, index, session }) {
  const started = new Date().toISOString();
  try {
    // Same extraction path as the real pipeline: strict prompt, schema
    // gate, one repair attempt. (No enrichment/Jira here — drift measures
    // the extraction step only.)
    let result = await extract({
      meetingId: sessionId,
      meetingTitle: session.meetingTitle,
      attendees: session.attendees,
      transcript: session.transcript,
    });
    let gate = validateExtraction(result.text, session.transcript);
    let repaired = false;

    if (!gate.ok) {
      repaired = true;
      const repairResult = await extract({
        meetingId: sessionId,
        meetingTitle: session.meetingTitle,
        attendees: session.attendees,
        transcript: session.transcript,
        repairError: gate.errors.join("\n"),
      });
      result = {
        ...repairResult,
        usage: sumUsage(result.usage, repairResult.usage),
        latencyMs: result.latencyMs + repairResult.latencyMs,
      };
      gate = validateExtraction(result.text, session.transcript);
    }

    const run = {
      index,
      mode: "shelled",
      startedAt: started,
      usage: result.usage,
      latencyMs: result.latencyMs,
      model: result.model,
      repaired,
    };

    if (gate.ok) {
      run.validated = gate.value;
      run.dropped_by_gate = gate.dropped;
      run.metrics = analyzeShelledRun(gate.value, gate.dropped);
      console.log(
        `[Drift] shelled run ${index}: ${run.metrics.action_item_count} items kept, ` +
          `${gate.dropped.length} dropped by evidence gate${repaired ? " (after repair)" : ""}`
      );
    } else {
      run.error = `Failed schema gate after repair: ${gate.errors.join("; ")}`;
      run.raw_output = result.text;
      console.error(`[Drift] shelled run ${index} dead-lettered:`, run.error);
    }

    await storage.saveDriftRun(sessionId, "shelled", index, run);
  } catch (error) {
    console.error(`[Drift] shelled run ${index} failed:`, error.message);
    await storage.saveDriftRun(sessionId, "shelled", index, {
      index,
      mode: "shelled",
      startedAt: started,
      error: error.message,
    });
  }
}

function sumUsage(a = {}, b = {}) {
  return {
    input_tokens: (a.input_tokens || 0) + (b.input_tokens || 0),
    output_tokens: (a.output_tokens || 0) + (b.output_tokens || 0),
    total_tokens: (a.total_tokens || 0) + (b.total_tokens || 0),
  };
}

function clampRuns(requested, fallback) {
  const n = parseInt(requested, 10);
  if (isNaN(n) || n < 1) return fallback;
  return Math.min(n, LIMITS.MAX_DRIFT_RUNS);
}

module.exports = { runNaked, runShelled, clampRuns, NAKED_PROMPT };

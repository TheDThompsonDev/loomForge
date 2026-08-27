// AI slot 3 of 3. One job: turn a meeting (transcript + the ALREADY
// VALIDATED decisions and action items from gates 1-2) into a strategy
// document, not minutes, not a transcript summary.
//
// Gate philosophy: prose can't be verbatim-checked like evidence quotes,
// so this gate is proportional to blast radius, a doc is reviewed prose,
// not an executable work item. The gate enforces structure, bounds, and
// one hard rule: the decisions section must cover the gate-1-validated
// decisions (code cross-checks; the AI cannot silently drop a recorded
// dissent).
const { callModel } = require("../llm");
const { stripCodeFences } = require("./schemaGate");
const { normalizeForMatch } = require("../utils");

const DOC_SYSTEM_PROMPT = `You turn engineering meetings into strategy documents that people actually want to read.

You will receive a meeting transcript plus the validated decisions and action items already extracted from it. Write a strategy document, NOT meeting minutes, NOT a play-by-play of who said what. The reader is someone who was not in the meeting and needs to understand where things stand and why, in five minutes.

Respond only with a valid JSON object, no markdown, no code fences:

{
  "title": "document title (not the meeting title verbatim, name the strategy, e.g. 'Checkout latency: plan of record')",
  "executive_summary": "3-5 sentences: what changed as a result of this meeting",
  "context": "the situation before the meeting: the problems, the pressures, why these topics came up. 1-3 paragraphs.",
  "decisions": [
    { "decision": "what was decided", "rationale": "why, based on the discussion", "dissent": "recorded objection or tradeoff acknowledged, or null" }
  ],
  "risks_and_open_questions": ["things left unresolved, dependencies, or risks the discussion surfaced"],
  "action_plan": "1-2 paragraphs tying the action items into a coherent sequence, what happens first and why the order matters",
  "explicitly_deferred": ["things the meeting explicitly decided NOT to do or postponed, with the stated reason"]
}

Hard rules:
- Every validated decision you were given MUST appear in your decisions array (you may merge duplicates and improve wording, but never drop one, especially not one with dissent).
- Do not invent commitments, owners, or dates that are not in the inputs.
- Do not quote the transcript at length; synthesize.
- explicitly_deferred matters: a good strategy doc records what was ruled out, so the same debate doesn't happen again next month.`;

async function writeStrategyDoc({ meetingTitle, transcript, decisions, actionItems, repairError }) {
  let user = `Meeting title: ${meetingTitle}

Validated decisions (every one must appear in your decisions array):
${JSON.stringify(decisions, null, 2)}

Validated action items (for the action_plan section):
${JSON.stringify(
    actionItems.map(({ summary, suggested_owner, priority }) => ({ summary, suggested_owner, priority })),
    null,
    2
  )}

Transcript:
"""
${transcript}
"""`;

  if (repairError) {
    user += `

Your previous response failed validation with these errors:
${repairError}

Return a corrected JSON object that fixes every error listed. Same rules apply.`;
  }

  return callModel({ system: DOC_SYSTEM_PROMPT, user, maxTokens: 8192 });
}

// ── Gate 3 ─────────────────────────────────────────────────────────────

function validateStrategyDoc(raw, validatedDecisions) {
  const errors = [];

  let doc;
  try {
    doc = typeof raw === "string" ? JSON.parse(stripCodeFences(raw)) : raw;
  } catch (e) {
    return { ok: false, errors: [`Output is not valid JSON: ${e.message}`] };
  }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    return { ok: false, errors: ["Output must be a single JSON object"] };
  }

  requireText(doc, "title", 5, 200, errors);
  requireText(doc, "executive_summary", 50, 2000, errors);
  requireText(doc, "context", 50, 6000, errors);
  requireText(doc, "action_plan", 50, 6000, errors);

  if (!Array.isArray(doc.decisions) || doc.decisions.length === 0) {
    errors.push("decisions must be a non-empty array");
  } else {
    doc.decisions.forEach((d, i) => {
      if (!d || typeof d.decision !== "string" || d.decision.trim().length === 0) {
        errors.push(`decisions[${i}].decision must be a non-empty string`);
      }
      if (!d || typeof d.rationale !== "string" || d.rationale.trim().length === 0) {
        errors.push(`decisions[${i}].rationale must be a non-empty string`);
      }
    });
  }

  for (const field of ["risks_and_open_questions", "explicitly_deferred"]) {
    if (!Array.isArray(doc[field]) || doc[field].some((x) => typeof x !== "string")) {
      errors.push(`${field} must be an array of strings`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  // The hard rules, checked by code. Match on keyword overlap: wording may
  // differ, substance may not.
  // Rule 1: no validated decision may be dropped.
  // Rule 2: a decision that carried recorded dissent must keep a dissent.
  // Without rule 2 the model could keep the decision but quietly delete
  // the objection, which is exactly the laundering this gate exists to stop.
  const ruleErrors = [];
  for (const original of validatedDecisions) {
    const match = doc.decisions.find(
      (d) => keywordOverlap(original.text, `${d.decision} ${d.rationale}`) >= 0.4
    );
    if (!match) {
      ruleErrors.push(
        `The validated decision "${original.text}" is missing from your decisions array. Include every provided decision.`
      );
    } else if (original.dissent && !(typeof match.dissent === "string" && match.dissent.trim())) {
      ruleErrors.push(
        `The decision "${original.text}" has recorded dissent ("${original.dissent}") but your matching entry has no dissent. Recorded dissent must be preserved.`
      );
    }
  }
  if (ruleErrors.length > 0) {
    return { ok: false, errors: ruleErrors };
  }

  return {
    ok: true,
    value: {
      title: doc.title.trim(),
      executive_summary: doc.executive_summary.trim(),
      context: doc.context.trim(),
      decisions: doc.decisions.map((d) => ({
        decision: d.decision.trim(),
        rationale: d.rationale.trim(),
        dissent: typeof d.dissent === "string" && d.dissent.trim() ? d.dissent.trim() : null,
      })),
      risks_and_open_questions: doc.risks_and_open_questions.map((s) => s.trim()).filter(Boolean),
      action_plan: doc.action_plan.trim(),
      explicitly_deferred: doc.explicitly_deferred.map((s) => s.trim()).filter(Boolean),
    },
  };
}

function requireText(doc, field, min, max, errors) {
  const v = doc[field];
  if (typeof v !== "string" || v.trim().length < min) {
    errors.push(`${field} must be a string of at least ${min} characters`);
  } else if (v.length > max) {
    errors.push(`${field} exceeds ${max} characters`);
  }
}

function keywordOverlap(a, b) {
  const wordsA = new Set(significantWords(a));
  const wordsB = new Set(significantWords(b));
  if (wordsA.size === 0) return 1;
  let hit = 0;
  for (const w of wordsA) if (wordsB.has(w)) hit++;
  return hit / wordsA.size;
}

function significantWords(text) {
  return normalizeForMatch(text)
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4);
}

module.exports = { writeStrategyDoc, validateStrategyDoc };

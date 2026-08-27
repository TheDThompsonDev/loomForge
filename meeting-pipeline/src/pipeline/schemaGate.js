const { LIMITS, PRIORITIES } = require("../config");
const { normalizeForMatch } = require("../utils");

// ── Gate 1: extraction output (step 7) ─────────────────────────────────
//
// Hand-rolled on purpose. A schema library would work, but the gate is the
// point of the demo: every rule the AI output must pass is visible here as
// plain code, and every failure produces a human-readable error string that
// feeds the repair loop.
//
// Returns:
//   { ok: true, value, dropped: [...] }    The validated doc, plus any action
//                                          items dropped by the evidence gate.
//   { ok: false, errors: [...] }           Structural failure; candidate for
//                                          one repair attempt, then DLQ.

function validateExtraction(raw, transcript) {
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

  if (typeof doc.meeting_id !== "string" || doc.meeting_id.length === 0) {
    errors.push("meeting_id must be a non-empty string");
  }

  // decisions
  const decisions = [];
  if (!Array.isArray(doc.decisions)) {
    errors.push("decisions must be an array");
  } else {
    if (doc.decisions.length > LIMITS.MAX_DECISIONS) {
      errors.push(`too many decisions (max ${LIMITS.MAX_DECISIONS})`);
    }
    doc.decisions.forEach((d, i) => {
      if (!d || typeof d !== "object") {
        errors.push(`decisions[${i}] must be an object`);
        return;
      }
      if (typeof d.text !== "string" || d.text.trim().length === 0) {
        errors.push(`decisions[${i}].text must be a non-empty string`);
        return;
      }
      decisions.push({
        text: d.text.trim(),
        made_by: nullableString(d.made_by),
        dissent: nullableString(d.dissent),
      });
    });
  }

  // action_items: structural checks first
  const items = [];
  if (!Array.isArray(doc.action_items)) {
    errors.push("action_items must be an array");
  } else {
    if (doc.action_items.length > LIMITS.MAX_ACTION_ITEMS) {
      errors.push(`too many action_items (max ${LIMITS.MAX_ACTION_ITEMS})`);
    }
    doc.action_items.forEach((item, i) => {
      const itemErrors = validateActionItemShape(item, i);
      if (itemErrors.length > 0) {
        errors.push(...itemErrors);
      } else {
        items.push(normalizeActionItem(item));
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors };

  // The evidence gate: the anti-hallucination check. This is NOT a repairable
  // error: an item whose evidence_quote does not appear in the transcript
  // has no receipts, so it is dropped and logged, never retried into
  // existence.
  const normalizedTranscript = normalizeForMatch(transcript);
  const kept = [];
  const dropped = [];
  for (const item of items) {
    if (normalizedTranscript.includes(normalizeForMatch(item.evidence_quote))) {
      kept.push(item);
    } else {
      dropped.push({
        summary: item.summary,
        evidence_quote: item.evidence_quote,
        reason: "evidence_quote not found verbatim in transcript",
      });
    }
  }

  return {
    ok: true,
    value: { meeting_id: doc.meeting_id, decisions, action_items: kept },
    dropped,
  };
}

function validateActionItemShape(item, i) {
  const errors = [];
  const at = `action_items[${i}]`;

  if (!item || typeof item !== "object") return [`${at} must be an object`];

  if (typeof item.summary !== "string" || item.summary.trim().length === 0) {
    errors.push(`${at}.summary must be a non-empty string`);
  } else if (item.summary.length > LIMITS.MAX_SUMMARY_LENGTH) {
    errors.push(`${at}.summary exceeds ${LIMITS.MAX_SUMMARY_LENGTH} chars`);
  }

  if (typeof item.description !== "string" || item.description.trim().length === 0) {
    errors.push(`${at}.description must be a non-empty string`);
  }

  if (typeof item.evidence_quote !== "string" || item.evidence_quote.trim().length === 0) {
    errors.push(`${at}.evidence_quote must be a non-empty string`);
  }

  if (item.suggested_owner != null && typeof item.suggested_owner !== "string") {
    errors.push(`${at}.suggested_owner must be a string or null`);
  }

  if (item.priority != null && !PRIORITIES.includes(String(item.priority).toLowerCase())) {
    errors.push(`${at}.priority must be one of ${PRIORITIES.join("|")} or null`);
  }

  if (item.acceptance_criteria != null) {
    if (!Array.isArray(item.acceptance_criteria)) {
      errors.push(`${at}.acceptance_criteria must be an array of strings`);
    } else if (item.acceptance_criteria.some((c) => typeof c !== "string")) {
      errors.push(`${at}.acceptance_criteria entries must all be strings`);
    }
  }

  if (
    typeof item.confidence !== "number" ||
    isNaN(item.confidence) ||
    item.confidence < 0 ||
    item.confidence > 1
  ) {
    errors.push(`${at}.confidence must be a number between 0 and 1`);
  }

  return errors;
}

function normalizeActionItem(item) {
  return {
    summary: item.summary.trim(),
    description: item.description.trim(),
    evidence_quote: item.evidence_quote.trim(),
    suggested_owner: nullableString(item.suggested_owner),
    priority: item.priority ? String(item.priority).toLowerCase() : null,
    acceptance_criteria: Array.isArray(item.acceptance_criteria)
      ? item.acceptance_criteria.map((c) => c.trim()).filter((c) => c.length > 0)
      : [],
    confidence: item.confidence,
  };
}

// ── Gate 2: enrichment output (step 9) ─────────────────────────────────
//
// The enricher returns, per action item, the same item plus enrichment
// fields. We only trust the enrichment fields; the original item fields
// are taken from OUR validated copy, never from the AI's echo. The AI
// cannot mutate what already passed gate 1.

function validateEnrichment(raw, originalItems) {
  const errors = [];

  let doc;
  try {
    doc = typeof raw === "string" ? JSON.parse(stripCodeFences(raw)) : raw;
  } catch (e) {
    return { ok: false, errors: [`Output is not valid JSON: ${e.message}`] };
  }

  const enriched = Array.isArray(doc) ? doc : doc?.enriched_items;
  if (!Array.isArray(enriched)) {
    return { ok: false, errors: ["Output must contain an enriched_items array"] };
  }
  if (enriched.length !== originalItems.length) {
    return {
      ok: false,
      errors: [
        `enriched_items has ${enriched.length} entries but ${originalItems.length} action items were provided; return exactly one entry per item, in order`,
      ],
    };
  }

  const merged = originalItems.map((original, i) => {
    const e = enriched[i] || {};
    const at = `enriched_items[${i}]`;

    if (e.suggested_owner != null && typeof e.suggested_owner !== "string") {
      errors.push(`${at}.suggested_owner must be a string or null`);
    }
    if (e.suggested_epic != null && typeof e.suggested_epic !== "string") {
      errors.push(`${at}.suggested_epic must be a string or null`);
    }
    if (e.related_tickets != null && !isStringArray(e.related_tickets)) {
      errors.push(`${at}.related_tickets must be an array of strings`);
    }
    if (e.related_docs != null && !isStringArray(e.related_docs)) {
      errors.push(`${at}.related_docs must be an array of strings`);
    }

    return {
      ...original, // gate-1-validated fields win, always
      suggested_owner: nullableString(e.suggested_owner) || original.suggested_owner,
      suggested_epic: nullableString(e.suggested_epic),
      related_tickets: isStringArray(e.related_tickets) ? e.related_tickets : [],
      related_docs: isStringArray(e.related_docs) ? e.related_docs : [],
    };
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: merged };
}

// ── helpers ────────────────────────────────────────────────────────────

function stripCodeFences(text) {
  // The prompt says "no code fences" but the gate assumes the model will
  // sometimes disobey. Deterministic code absorbs that, silently.
  return text.replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
}

function nullableString(v) {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function isStringArray(v) {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

module.exports = { validateExtraction, validateEnrichment, stripCodeFences };

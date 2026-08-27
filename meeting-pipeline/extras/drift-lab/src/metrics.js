// Divergence metrics for drift mode. All deterministic heuristics — the
// point on stage is that CODE measures what the AI did, run by run.
//
// Naked runs return freeform text (that's the point of running naked), so
// per-run metrics are best-effort parses. Shelled runs are schema-validated
// JSON, so their metrics are exact.
const { normalizeForMatch } = require("../utils");
const { stripCodeFences } = require("../pipeline/schemaGate");

// ── Per-run metrics ────────────────────────────────────────────────────

function analyzeNakedRun(outputText, transcript, attendees) {
  const items = parseTicketsBestEffort(outputText);
  const normalizedTranscript = normalizeForMatch(transcript);

  const owners = [];
  const priorities = [];
  const hallucinatedFields = [];

  for (const item of items) {
    if (item.owner) {
      owners.push(item.owner);
      if (!appearsInTranscript(item.owner, normalizedTranscript, attendees)) {
        hallucinatedFields.push({ field: "owner", value: item.owner });
      }
    }
    if (item.priority) {
      priorities.push(item.priority);
      if (!normalizedTranscript.includes(item.priority.toLowerCase())) {
        hallucinatedFields.push({ field: "priority", value: item.priority });
      }
    }
    if (item.dueDate && !normalizedTranscript.includes(normalizeForMatch(item.dueDate))) {
      hallucinatedFields.push({ field: "due_date", value: item.dueDate });
    }
  }

  return {
    action_item_count: items.length,
    item_summaries: items.map((i) => i.summary).filter(Boolean),
    owners_assigned: owners.length,
    priorities_given: priorities.length,
    hallucinated_fields: hallucinatedFields,
    parse_method: items.parseMethod || "heuristic",
  };
}

function analyzeShelledRun(validated, droppedByGate) {
  return {
    action_item_count: validated.action_items.length,
    item_summaries: validated.action_items.map((i) => i.summary),
    owners_assigned: validated.action_items.filter((i) => i.suggested_owner).length,
    priorities_given: validated.action_items.filter((i) => i.priority).length,
    hallucinated_fields: [], // by construction: the gate already dropped them
    dropped_by_evidence_gate: droppedByGate.length,
    parse_method: "schema-validated",
  };
}

// ── Run-set metrics (the scatter-vs-cluster numbers) ───────────────────

function analyzeRunSet(runMetrics) {
  const valid = runMetrics.filter(Boolean);
  if (valid.length === 0) return null;

  const counts = valid.map((m) => m.action_item_count);

  // Distinct ticket sets: two runs "agree" when their normalized summary
  // sets are identical. Naked runs scatter; shelled runs cluster.
  const signatures = new Set(
    valid.map((m) =>
      (m.item_summaries || [])
        .map((s) => normalizeForMatch(s))
        .sort()
        .join("|")
    )
  );

  return {
    runs: valid.length,
    item_count_min: Math.min(...counts),
    item_count_max: Math.max(...counts),
    item_count_mean: round2(counts.reduce((a, b) => a + b, 0) / counts.length),
    item_count_stddev: round2(stddev(counts)),
    distinct_ticket_sets: signatures.size,
    total_owners_assigned: sum(valid, "owners_assigned"),
    total_priorities_given: sum(valid, "priorities_given"),
    total_hallucinated_fields: valid.reduce(
      (acc, m) => acc + (m.hallucinated_fields?.length || 0),
      0
    ),
  };
}

// ── Best-effort ticket parsing for naked output ────────────────────────

function parseTicketsBestEffort(outputText) {
  const text = stripCodeFences(outputText || "");

  // 1. Model may have returned JSON anyway.
  try {
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed)
      ? parsed
      : parsed.action_items || parsed.tickets || parsed.issues || null;
    if (Array.isArray(arr)) {
      const items = arr.map((t) => ({
        summary: t.summary || t.title || t.name || "",
        owner: t.owner || t.assignee || t.suggested_owner || null,
        priority: normalizePriority(t.priority),
        dueDate: t.due_date || t.dueDate || t.deadline || null,
      }));
      items.parseMethod = "json";
      return items;
    }
  } catch {
    // fall through to text heuristics
  }

  // 2. Text heuristics: split into ticket-ish blocks on numbered items,
  //    "Ticket N", or markdown headers, then scan each block for fields.
  const blocks = text
    .split(/\n(?=\s*(?:\d+[.)]\s|[-*]\s+\*\*|#{1,3}\s|Ticket\s+\d+|\*\*Ticket))/i)
    .map((b) => b.trim())
    .filter((b) => b.length > 20);

  const items = blocks
    .map((block) => {
    const summaryMatch =
      block.match(/(?:summary|title)\s*[:*]+\s*(.+)/i) ||
      block.match(/^\s*(?:\d+[.)]\s*|[-*]\s+|#{1,3}\s*)(?:\*\*)?([^\n*]+)/);
    const ownerMatch = block.match(/(?:assignee|owner|assigned to)\s*[:*]+\s*([^\n,;(]+)/i);
    const priorityMatch = block.match(/priority\s*[:*]+\s*(\w+)/i);
    const dueMatch = block.match(/(?:due(?:\s+date)?|deadline)\s*[:*]+\s*([^\n]+)/i);

      return {
        summary: summaryMatch ? summaryMatch[1].trim().replace(/\*+$/, "") : "",
        owner: ownerMatch ? cleanValue(ownerMatch[1]) : null,
        priority: priorityMatch ? normalizePriority(priorityMatch[1]) : null,
        dueDate: dueMatch ? cleanValue(dueMatch[1]) : null,
      };
    })
    // A block with no summary is preamble/closing chatter, not a ticket.
    .filter((item) => item.summary.length > 0);
  items.parseMethod = "heuristic";
  return items;
}

function appearsInTranscript(name, normalizedTranscript, attendees) {
  const n = normalizeForMatch(name);
  if (!n || n === "unassigned" || n === "tbd" || n === "none" || n === "null") return true;
  if (normalizedTranscript.includes(n)) return true;
  // First-name match against attendee list ("Sarah Chen" ↔ "Sarah")
  const first = n.split(" ")[0];
  return (attendees || []).some((a) => normalizeForMatch(a).includes(first));
}

function normalizePriority(p) {
  if (!p || typeof p !== "string") return null;
  const v = p.trim().toLowerCase();
  return ["highest", "high", "medium", "low", "lowest", "critical", "urgent"].includes(v) ? v : null;
}

function cleanValue(v) {
  const cleaned = v.trim().replace(/\*+/g, "").trim();
  return cleaned.length > 0 && cleaned.length < 60 ? cleaned : null;
}

const sum = (arr, field) => arr.reduce((acc, m) => acc + (m[field] || 0), 0);
const round2 = (n) => Math.round(n * 100) / 100;
function stddev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length);
}

module.exports = { analyzeNakedRun, analyzeShelledRun, analyzeRunSet, parseTicketsBestEffort };

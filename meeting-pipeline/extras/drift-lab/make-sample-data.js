// Generates demo/sample-comparison.json — a realistic mock of a finished
// drift session (20 naked runs scattering, 3 shelled runs converging) so
// the viewers can be seen fully populated before anything is deployed.
// Deterministic (seeded) so the sample is stable across runs.
const fs = require("node:fs");
const path = require("node:path");
const { analyzeRunSet } = require("../src/drift/metrics");

let seed = 42;
function rand() {
  // xorshift — deterministic sample data
  seed ^= seed << 13; seed ^= seed >> 17; seed ^= seed << 5;
  return Math.abs(seed % 1000) / 1000;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// The trap meeting's real items (what SHOULD be extracted)...
const realItems = [
  "Scope the audit log CSV export before committing to an approach",
  "Add contract test suite on partner endpoints (unowned; blocks the search rewrite)",
];
// ...and the bait naked mode falls for.
const inventedItems = [
  "Build streaming CSV export for audit log before Q3 renewal",
  "Implement search ranking rewrite with new embedding model",
  "Build Slack digest bot",
  "Assign intern to admin dark mode project",
  "Review vendor embedding API pricing for finance",
  "Set up log viewer cleanup project",
  "Schedule Meridian renewal preparation meeting",
];
const inventedOwners = ["Alex", "Sam", "Danny", "Jordan", "the intern"];
const inventedPriorities = ["high", "highest", "medium"];
const inventedDeadlines = ["before Q3 renewal", "end of quarter", "next sprint"];

function nakedRun(index) {
  const count = 3 + Math.floor(rand() * 6); // 3–8 items
  const summaries = [];
  const hallucinated = [];
  const pool = [...realItems, ...inventedItems];
  let owners = 0, priorities = 0;
  for (let i = 0; i < count; i++) {
    const s = pool.splice(Math.floor(rand() * pool.length), 1)[0] || `Extra task ${i}`;
    summaries.push(s);
    if (rand() > 0.35) {
      owners++;
      const owner = pick(inventedOwners);
      if (owner !== "Danny" && owner !== "Alex" && owner !== "Sam") {
        hallucinated.push({ field: "owner", value: owner });
      } else if (rand() > 0.5) {
        hallucinated.push({ field: "owner", value: owner });
      }
    }
    if (rand() > 0.4) {
      priorities++;
      hallucinated.push({ field: "priority", value: pick(inventedPriorities) });
    }
    if (rand() > 0.75) {
      hallucinated.push({ field: "due_date", value: pick(inventedDeadlines) });
    }
  }
  return {
    index,
    mode: "naked",
    startedAt: new Date(Date.UTC(2026, 7, 26, 14, 0, index)).toISOString(),
    usage: {
      input_tokens: 900 + Math.floor(rand() * 60),
      output_tokens: 350 + Math.floor(rand() * 500),
      total_tokens: 0,
    },
    latencyMs: 3200 + Math.floor(rand() * 4800),
    model: "claude-sonnet-5",
    metrics: {
      action_item_count: count,
      item_summaries: summaries,
      owners_assigned: owners,
      priorities_given: priorities,
      hallucinated_fields: hallucinated,
      parse_method: "heuristic",
    },
  };
}

function shelledRun(index) {
  return {
    index,
    mode: "shelled",
    startedAt: new Date(Date.UTC(2026, 7, 26, 14, 5, index)).toISOString(),
    usage: { input_tokens: 1450, output_tokens: 610 + index, total_tokens: 0 },
    latencyMs: 6100 + index * 400,
    model: "claude-sonnet-5",
    repaired: false,
    metrics: {
      action_item_count: realItems.length,
      item_summaries: [...realItems],
      owners_assigned: 0,
      priorities_given: 0,
      hallucinated_fields: [],
      dropped_by_evidence_gate: index === 1 ? 1 : 0,
      parse_method: "schema-validated",
    },
  };
}

const naked = Array.from({ length: 20 }, (_, i) => nakedRun(i));
const shelled = Array.from({ length: 3 }, (_, i) => shelledRun(i));
for (const r of [...naked, ...shelled]) {
  r.usage.total_tokens = r.usage.input_tokens + r.usage.output_tokens;
}

const totalUsage = (runs) =>
  runs.reduce(
    (acc, r) => ({
      input_tokens: acc.input_tokens + r.usage.input_tokens,
      output_tokens: acc.output_tokens + r.usage.output_tokens,
      total_tokens: acc.total_tokens + r.usage.total_tokens,
      total_latency_ms: acc.total_latency_ms + r.latencyMs,
    }),
    { input_tokens: 0, output_tokens: 0, total_tokens: 0, total_latency_ms: 0 }
  );

const comparison = {
  session: {
    id: "drift-sample-0000000000-demo",
    meetingTitle: "trap-meeting (drift) — SAMPLE DATA",
    attendees: ["Danny", "Alex", "Sam"],
    createdAt: "2026-08-26T14:00:00.000Z",
    naked_requested: 20,
    shelled_requested: 3,
    naked_complete: 20,
    shelled_complete: 3,
    done: true,
  },
  naked: {
    runs: naked,
    set_metrics: analyzeRunSet(naked.map((r) => r.metrics)),
    total_usage: totalUsage(naked),
  },
  shelled: {
    runs: shelled,
    set_metrics: analyzeRunSet(shelled.map((r) => r.metrics)),
    total_usage: totalUsage(shelled),
  },
};

const demoDir = path.join(__dirname, "..", "demo");
const out = path.join(demoDir, "sample-comparison.json");
fs.writeFileSync(out, JSON.stringify(comparison, null, 2));
console.log(`Wrote ${out}`);

// Also emit a double-clickable viewer with the sample baked in — no server,
// no paste, just open it.
const viewer = fs.readFileSync(path.join(demoDir, "drift-viewer.html"), "utf8");
const injected = viewer.replace(
  "<script>",
  `<script>window.SAMPLE_DATA = ${JSON.stringify(comparison)};</script>\n<script>`
);
const sampleOut = path.join(demoDir, "drift-viewer-sample.html");
fs.writeFileSync(sampleOut, injected);
console.log(`Wrote ${sampleOut} (double-click to view, no server needed)`);
console.log(
  `naked: ${comparison.naked.set_metrics.distinct_ticket_sets} distinct sets, ` +
    `${comparison.naked.set_metrics.total_hallucinated_fields} hallucinated fields | ` +
    `shelled: ${comparison.shelled.set_metrics.distinct_ticket_sets} set(s), 0 hallucinated`
);

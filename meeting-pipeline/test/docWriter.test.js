const { test } = require("node:test");
const assert = require("node:assert");

const { validateStrategyDoc } = require("../src/pipeline/docWriter");

const decisions = [
  { text: "Tax rate caching is priority one, owned by Sarah, in review by Friday", made_by: "Danny", dissent: null },
  {
    text: "Build a server-side notification rate limit with deliberately capped scope",
    made_by: "Danny",
    dissent: "Danny notes the rate limit treats a symptom",
  },
];

const goodDoc = {
  title: "Checkout latency: plan of record",
  executive_summary:
    "The team committed to caching tax rates per region as the priority-one fix for checkout latency, and approved a deliberately scoped server-side notification rate limit despite reservations about treating a symptom.",
  context:
    "Checkout p95 latency has degraded to 4.2 seconds since the tax calculation change shipped, driven by a synchronous vendor call that also causes payment worker timeouts. Separately, marketing notification volume spiked opt-outs.",
  decisions: [
    {
      decision: "Cache tax rates per region, priority one, owned by Sarah with review by Friday",
      rationale: "One cache fixes both checkout latency and the payment worker timeouts caused by the same vendor call.",
      dissent: null,
    },
    {
      decision: "Build a server-side notification rate limit with capped scope",
      rationale: "Four pushes in one hour doubled opt-outs; a config-value cap is a day of work.",
      dissent: "Danny notes the rate limit treats a symptom of a marketing calendar problem.",
    },
  ],
  risks_and_open_questions: ["Tax rate change frequency is unverified; if rates change often the cache design gets harder."],
  action_plan:
    "Sarah lands the tax rate cache first since it unblocks both latency and worker timeouts, targeting review by Friday. The notification rate limit follows as an independent, deliberately scoped change: a per-user daily cap as a config value with no UI attached.",
  explicitly_deferred: ["A notification dashboard for marketing, can be funded next quarter if they want it."],
};

test("valid strategy doc passes gate 3", () => {
  const result = validateStrategyDoc(goodDoc, decisions);
  assert.ok(result.ok, JSON.stringify(result.errors));
  assert.strictEqual(result.value.decisions.length, 2);
  assert.ok(result.value.decisions[1].dissent);
});

test("gate 3 rejects a doc that drops a validated decision", () => {
  const doc = structuredClone(goodDoc);
  doc.decisions = [doc.decisions[0]]; // silently dropping the contested decision
  const result = validateStrategyDoc(doc, decisions);
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors[0].includes("missing from your decisions array"), result.errors[0]);
});

test("gate 3 rejects a doc that keeps a decision but strips its recorded dissent", () => {
  const doc = structuredClone(goodDoc);
  doc.decisions[1].dissent = null; // decision kept, objection laundered out
  const result = validateStrategyDoc(doc, decisions);
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors[0].includes("dissent must be preserved"), result.errors[0]);
});

test("gate 3 rejects structural failures with repairable errors", () => {
  const result = validateStrategyDoc(
    { title: "x", executive_summary: "too short", decisions: [], risks_and_open_questions: "nope" },
    decisions
  );
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("executive_summary")));
  assert.ok(result.errors.some((e) => e.includes("decisions must be a non-empty array")));
  assert.ok(result.errors.some((e) => e.includes("risks_and_open_questions")));
});

test("gate 3 strips code fences", () => {
  const fenced = "```json\n" + JSON.stringify(goodDoc) + "\n```";
  const result = validateStrategyDoc(fenced, decisions);
  assert.ok(result.ok);
});

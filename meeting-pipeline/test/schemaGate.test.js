const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const { validateExtraction, validateEnrichment } = require("../src/pipeline/schemaGate");

const fixturesDir = path.join(__dirname, "..", "fixtures");
const realTranscript = fs.readFileSync(path.join(fixturesDir, "real-meeting.txt"), "utf8");
const trapTranscript = fs.readFileSync(path.join(fixturesDir, "trap-meeting.txt"), "utf8");
const realExpected = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, "expected", "real-meeting.json"), "utf8")
);
const trapExpected = JSON.parse(
  fs.readFileSync(path.join(fixturesDir, "expected", "trap-meeting.json"), "utf8")
);

test("expected real-meeting output passes the gate with nothing dropped", () => {
  const result = validateExtraction(realExpected, realTranscript);
  assert.ok(result.ok, JSON.stringify(result.errors));
  assert.strictEqual(result.dropped.length, 0);
  assert.strictEqual(result.value.action_items.length, 4);
  assert.strictEqual(result.value.decisions.length, 3);
});

test("expected trap-meeting output passes the gate with nothing dropped", () => {
  const result = validateExtraction(trapExpected, trapTranscript);
  assert.ok(result.ok, JSON.stringify(result.errors));
  assert.strictEqual(result.dropped.length, 0);
  assert.strictEqual(result.value.action_items.length, 2);
  // The trap's correct output has NO owners, NO priorities, NO deadlines.
  for (const item of result.value.action_items) {
    assert.strictEqual(item.suggested_owner, null);
    assert.strictEqual(item.priority, null);
  }
});

test("evidence gate drops an item whose quote is not in the transcript", () => {
  const doc = structuredClone(realExpected);
  doc.action_items.push({
    summary: "Ship the Slack digest bot before the Q3 deadline",
    description: "Hallucinated: nobody committed to this.",
    evidence_quote: "We agreed the digest bot ships by end of Q3.",
    suggested_owner: "Alex",
    priority: "high",
    acceptance_criteria: [],
    confidence: 0.8,
  });

  const result = validateExtraction(doc, realTranscript);
  assert.ok(result.ok);
  assert.strictEqual(result.dropped.length, 1);
  assert.match(result.dropped[0].reason, /not found verbatim/);
  assert.strictEqual(result.value.action_items.length, 4); // originals kept
});

test("evidence gate tolerates whitespace and smart-quote drift, nothing more", () => {
  const doc = structuredClone(trapExpected);
  // Same words, curly apostrophe + collapsed spacing, should still match.
  doc.action_items[1].evidence_quote = "Not yet.  It’s unowned. It blocks the rewrite though, so it matters.";
  const result = validateExtraction(doc, trapTranscript);
  assert.ok(result.ok);
  assert.strictEqual(result.dropped.length, 0);
});

test("structural failures return repairable error strings", () => {
  const bad = {
    meeting_id: "m1",
    decisions: "not an array",
    action_items: [
      {
        summary: "x".repeat(200), // too long
        description: "",
        evidence_quote: "quote",
        priority: "urgent!!", // bad enum
        confidence: 3, // out of range
      },
    ],
  };
  const result = validateExtraction(bad, "transcript with quote in it");
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("decisions must be an array")));
  assert.ok(result.errors.some((e) => e.includes("summary exceeds")));
  assert.ok(result.errors.some((e) => e.includes("priority")));
  assert.ok(result.errors.some((e) => e.includes("confidence")));
});

test("markdown code fences are stripped before parsing", () => {
  const fenced = "```json\n" + JSON.stringify(trapExpected) + "\n```";
  const result = validateExtraction(fenced, trapTranscript);
  assert.ok(result.ok);
});

test("enrichment gate merges enrichment but cannot mutate gate-1 fields", () => {
  const originals = validateExtraction(realExpected, realTranscript).value.action_items;
  const enrichment = {
    enriched_items: originals.map(() => ({
      suggested_owner: "Enriched Owner",
      suggested_epic: "PROJ-1",
      related_tickets: ["PROJ-42"],
      related_docs: ["Runbook"],
      summary: "ATTEMPTED OVERWRITE", // must be ignored
      confidence: 0.01, // must be ignored
    })),
  };
  const result = validateEnrichment(enrichment, originals);
  assert.ok(result.ok, JSON.stringify(result.errors));
  assert.strictEqual(result.value[0].suggested_epic, "PROJ-1");
  assert.strictEqual(result.value[0].summary, originals[0].summary);
  assert.strictEqual(result.value[0].confidence, originals[0].confidence);
});

test("enrichment gate rejects wrong item count", () => {
  const originals = validateExtraction(realExpected, realTranscript).value.action_items;
  const result = validateEnrichment({ enriched_items: [{}] }, originals);
  assert.strictEqual(result.ok, false);
  assert.match(result.errors[0], /exactly one entry per item/);
});

const assert = require("assert");
const { validateIngestPayload } = require("../src/ingestion/validate");
const { parseIssueKey, adfToText, truncate } = require("../src/utils");
const { parseAllowedUrl } = require("../src/pipeline/fetchSource");
const { composePlanOfRecord, renderPlanOfRecord } = require("../src/pipeline/planOfRecord");
const { extractJson } = require("../src/pipeline/llmText");
const { needsLlmSplit } = require("../src/ingestion/validate");
const sampleItems = require("../fixtures/work-items.json");

function check(name, fn) {
  try {
    fn();
    console.log(`ok  ${name}`);
  } catch (error) {
    console.error(`fail  ${name}`);
    throw error;
  }
}

check("rejects empty ingest", () => {
  const result = validateIngestPayload({});
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("transcript")));
});

check("accepts a meeting payload", () => {
  const result = validateIngestPayload({
    transcript: "We need to cache tax rates per region before Friday.",
    meeting_title: "Weekly platform sync",
    attendees: ["Danny", "Sarah"],
    date: "2026-09-08",
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.payload.meetingTitle, "Weekly platform sync");
  assert.deepStrictEqual(result.payload.attendees, ["Danny", "Sarah"]);
  assert.strictEqual(result.payload.items.length, 1);
  assert.strictEqual(result.payload.items[0].route, "human");
  assert.strictEqual(result.payload.generateDoc, false);
});

check("accepts comma-separated attendees and generate_doc", () => {
  const result = validateIngestPayload({
    transcript: "We need to cache tax rates per region before Friday.",
    meeting_title: "Weekly platform sync",
    attendees: "Danny, Sarah, Marcus",
    generate_doc: true,
  });
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(result.payload.attendees, ["Danny", "Sarah", "Marcus"]);
  assert.strictEqual(result.payload.generateDoc, true);
});

check("splits human and agent work items", () => {
  const result = validateIngestPayload({
    transcript: "We need to cache tax rates per region before Friday.",
    meeting_title: "Weekly platform sync",
    items: [
      { summary: "Cache tax rates", owner: "Sarah", route: "human" },
      { summary: "Research vendor pricing", route: "agent" },
    ],
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.payload.items[1].route, "agent");
});

check("rejects a bad route", () => {
  const result = validateIngestPayload({
    transcript: "We need to cache tax rates per region before Friday.",
    meeting_title: "Weekly platform sync",
    items: [{ summary: "Nope", route: "robot" }],
  });
  assert.strictEqual(result.ok, false);
});

check("parses issue keys", () => {
  assert.strictEqual(parseIssueKey("meet-12"), "MEET-12");
  assert.strictEqual(parseIssueKey("not a key"), null);
});

check("flattens ADF", () => {
  const text = adfToText({
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
      { type: "paragraph", content: [{ type: "text", text: "World" }] },
    ],
  });
  assert.ok(text.includes("Hello"));
  assert.ok(text.includes("World"));
});

check("allowlists egress hosts", () => {
  assert.strictEqual(parseAllowedUrl("https://en.wikipedia.org/wiki/Cache").ok, true);
  assert.strictEqual(parseAllowedUrl("http://en.wikipedia.org/wiki/Cache").ok, false);
  assert.strictEqual(parseAllowedUrl("https://evil.example/x").ok, false);
  assert.strictEqual(parseAllowedUrl("https://user:pass@en.wikipedia.org/x").ok, false);
});

check("truncates with ellipsis", () => {
  assert.strictEqual(truncate("abcdef", 5), "ab...");
});

check("composes a plan-of-record page from work items", () => {
  const meeting = {
    meetingTitle: "Weekly platform sync",
    attendees: ["Danny", "Sarah"],
    date: "2026-09-08",
    transcript: "Sarah takes tax caching. Marcus hotfixes Android.",
  };
  const tickets = sampleItems.map((item, i) => ({
    issueKey: `SMS-${120 + i}`,
    summary: item.summary,
    route: item.route,
  }));
  const doc = composePlanOfRecord({ meeting, items: sampleItems, tickets });
  assert.match(doc.title, /plan of record/);
  assert.ok(doc.decisions.length >= 5);
  assert.ok(doc.risks.length >= 1);
  const html = renderPlanOfRecord({ doc, meeting, tickets, jobId: "job-test" });
  assert.ok(html.includes("Executive summary"));
  assert.ok(html.includes("Decisions"));
  assert.ok(html.includes("Action plan"));
  assert.ok(html.includes("Risks"));
  assert.ok(html.includes("ac:name=\"jira\""));
  assert.ok(html.includes("SMS-120"));
});

check("unwraps fenced LLM JSON", () => {
  const raw = extractJson("```json\n[{\"summary\":\"Cache tax rates\"}]\n```");
  assert.ok(raw.includes("Cache tax rates"));
});

check("detects the one-item bag that should be split", () => {
  const transcript = "Sarah takes tax caching.";
  assert.strictEqual(
    needsLlmSplit([{ summary: "Weekly", detail: transcript, owner: "", route: "human" }], transcript),
    true
  );
  assert.strictEqual(needsLlmSplit(sampleItems, transcript), false);
});

console.log("\nAll checks passed.");

const assert = require("assert");
const { validateIngestPayload } = require("../src/ingestion/validate");
const { parseIssueKey, adfToText, truncate } = require("../src/utils");
const { parseAllowedUrl } = require("../src/pipeline/fetchSource");

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

console.log("\nAll checks passed.");

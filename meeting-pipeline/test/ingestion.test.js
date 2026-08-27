const { test } = require("node:test");
const assert = require("node:assert");
const crypto = require("node:crypto");

const { validateIngestPayload } = require("../src/ingestion/validate");
const { verifySignature } = require("../src/ingestion/auth");

const goodBody = JSON.stringify({
  transcript: "T".repeat(300),
  meeting_title: "Weekly sync",
  attendees: ["Danny", "Sarah"],
  date: "2026-08-26",
});

test("valid payload passes", () => {
  const result = validateIngestPayload(goodBody);
  assert.ok(result.ok, JSON.stringify(result.errors));
  assert.strictEqual(result.payload.meetingTitle, "Weekly sync");
  assert.deepStrictEqual(result.payload.attendees, ["Danny", "Sarah"]);
});

test("missing transcript and title are both reported", () => {
  const result = validateIngestPayload("{}");
  assert.strictEqual(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("transcript")));
  assert.ok(result.errors.some((e) => e.includes("meeting_title")));
});

test("transcript length bounds enforced", () => {
  const short = validateIngestPayload(
    JSON.stringify({ transcript: "too short", meeting_title: "x" })
  );
  assert.ok(short.errors.some((e) => e.includes("too short")));

  const long = validateIngestPayload(
    JSON.stringify({ transcript: "T".repeat(70000), meeting_title: "x" })
  );
  assert.ok(long.errors.some((e) => e.includes("too long")));
});

test("generate_doc must be boolean and defaults to false", () => {
  const on = validateIngestPayload(
    JSON.stringify({ transcript: "T".repeat(300), meeting_title: "x", generate_doc: true })
  );
  assert.ok(on.ok);
  assert.strictEqual(on.payload.generateDoc, true);

  const off = validateIngestPayload(JSON.stringify({ transcript: "T".repeat(300), meeting_title: "x" }));
  assert.strictEqual(off.payload.generateDoc, false);

  const bad = validateIngestPayload(
    JSON.stringify({ transcript: "T".repeat(300), meeting_title: "x", generate_doc: "yes" })
  );
  assert.ok(bad.errors.some((e) => e.includes("generate_doc")));
});

test("non-JSON body rejected", () => {
  const result = validateIngestPayload("transcript=hello");
  assert.strictEqual(result.ok, false);
});

test("HMAC signature round-trip", () => {
  const secret = "demo-secret";
  const signature = crypto.createHmac("sha256", secret).update(goodBody, "utf8").digest("hex");
  assert.strictEqual(verifySignature(secret, goodBody, signature), true);
  assert.strictEqual(verifySignature(secret, goodBody + " ", signature), false);
  assert.strictEqual(verifySignature("wrong-secret", goodBody, signature), false);
  assert.strictEqual(verifySignature(secret, goodBody, "not-a-signature"), false);
});

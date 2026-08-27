const { test } = require("node:test");
const assert = require("node:assert");

const {
  analyzeNakedRun,
  analyzeRunSet,
  parseTicketsBestEffort,
} = require("../src/drift/metrics");

const transcript =
  "Danny: Sarah will cache the tax rates. Marcus: I'll hotfix the rotation crash. Danny: that one is urgent.";
const attendees = ["Danny", "Sarah Chen", "Marcus"];

test("parses JSON-shaped naked output", () => {
  const output = JSON.stringify({
    tickets: [
      { title: "Cache tax rates", assignee: "Sarah", priority: "High" },
      { title: "Hotfix rotation crash", assignee: "Marcus" },
    ],
  });
  const items = parseTicketsBestEffort(output);
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].owner, "Sarah");
  assert.strictEqual(items[0].priority, "high");
});

test("parses markdown-shaped naked output", () => {
  const output = `Here are the Jira tickets:

1. **Cache tax rates per region**
   Assignee: Sarah
   Priority: High

2. **Hotfix rotation crash on Android**
   Assignee: Marcus
   Due date: end of sprint`;
  const items = parseTicketsBestEffort(output);
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].owner, "Sarah");
  assert.strictEqual(items[1].dueDate, "end of sprint");
});

test("flags hallucinated owner and due date, not real ones", () => {
  const output = `1. Cache tax rates
   Assignee: Sarah
2. Update the roadmap deck
   Assignee: Jennifer
   Due date: Friday EOD
   Priority: highest`;
  const metrics = analyzeNakedRun(output, transcript, attendees);
  assert.strictEqual(metrics.action_item_count, 2);
  const fields = metrics.hallucinated_fields.map((f) => `${f.field}:${f.value}`);
  assert.ok(fields.includes("owner:Jennifer"), fields.join(", "));
  assert.ok(fields.some((f) => f.startsWith("due_date:")));
  assert.ok(fields.some((f) => f.startsWith("priority:highest")));
  assert.ok(!fields.includes("owner:Sarah"));
});

test("run-set metrics: scatter vs cluster", () => {
  const scattered = [
    { action_item_count: 3, item_summaries: ["a", "b", "c"], owners_assigned: 3, priorities_given: 2, hallucinated_fields: [{}, {}] },
    { action_item_count: 6, item_summaries: ["a", "d", "e", "f", "g", "h"], owners_assigned: 6, priorities_given: 6, hallucinated_fields: [{}] },
    { action_item_count: 4, item_summaries: ["a", "b", "x", "y"], owners_assigned: 1, priorities_given: 0, hallucinated_fields: [] },
  ];
  const clustered = [
    { action_item_count: 4, item_summaries: ["a", "b", "c", "d"], owners_assigned: 2, priorities_given: 1, hallucinated_fields: [] },
    { action_item_count: 4, item_summaries: ["a", "b", "c", "d"], owners_assigned: 2, priorities_given: 1, hallucinated_fields: [] },
    { action_item_count: 4, item_summaries: ["d", "c", "b", "a"], owners_assigned: 2, priorities_given: 1, hallucinated_fields: [] },
  ];

  const scatter = analyzeRunSet(scattered);
  const cluster = analyzeRunSet(clustered);

  assert.strictEqual(scatter.distinct_ticket_sets, 3);
  assert.strictEqual(cluster.distinct_ticket_sets, 1); // order-insensitive
  assert.strictEqual(scatter.total_hallucinated_fields, 3);
  assert.strictEqual(cluster.total_hallucinated_fields, 0);
  assert.ok(scatter.item_count_stddev > cluster.item_count_stddev);
  assert.strictEqual(cluster.item_count_stddev, 0);
});

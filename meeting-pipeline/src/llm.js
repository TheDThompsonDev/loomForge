// The ONLY file that talks to a model. All three AI slots (extractor,
// enricher, doc writer) route through callModel() so that metrics, model
// choice, and error handling live in exactly one place.
//
// Uses the Forge LLMs API: Atlassian-hosted Claude, invoked in-platform.
// No external egress, no API key to manage, which is why the manifest has
// no external.fetch section at all.
const { elapsedMs } = require("./utils");

const DEFAULT_MODEL = process.env.PIPELINE_MODEL || "claude-sonnet-5";

// Lazy: @forge/llm binds to the Forge runtime at import, which would make
// every module that transitively touches this one untestable outside the
// sandbox. Resolved on first model call instead.
let chatFn = null;
function chat(prompt) {
  if (!chatFn) chatFn = require("@forge/llm").chat;
  return chatFn(prompt);
}

// Returns { text, usage: {input_tokens, output_tokens, total_tokens}, latencyMs, model }
async function callModel({ system, user, model = DEFAULT_MODEL, maxTokens = 4096 }) {
  const started = Date.now();

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });

  const response = await chat({
    model,
    messages,
    max_completion_tokens: maxTokens,
    // Note: claude-sonnet-5 / opus-5 reject temperature/top_p, omit both.
  });

  const text = response?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("LLM returned an empty completion");
  }

  return {
    text,
    usage: response.usage || { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    latencyMs: elapsedMs(started),
    model,
  };
}

module.exports = { callModel, DEFAULT_MODEL };

const { chat } = require("@forge/llm");
const { parseItems } = require("../ingestion/validate");
const { LIMITS } = require("../config");
const { extractJson, contentToText } = require("./llmText");

const MODEL = "claude-sonnet-4-6";

const SYSTEM = [
  "Split a meeting into concrete Jira work items.",
  "Return ONLY a JSON array. No markdown. No prose.",
  "Each item: {\"summary\":\"string\",\"detail\":\"string\",\"owner\":\"string\",\"route\":\"human\"|\"agent\"}.",
  "route is agent for research, investigation, or a recommendation.",
  "route is human for implementation with a named owner.",
  `At most ${LIMITS.MAX_ITEMS} items.`,
].join(" ");

async function splitMeeting({ meetingTitle, attendees, transcript }) {
  try {
    const response = await chat({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content:
            `Title: ${meetingTitle}\n` +
            `Attendees: ${(attendees || []).join(", ") || "(none)"}\n\n` +
            transcript,
        },
      ],
    });
    const raw = contentToText(response?.choices?.[0]?.message?.content);
    const parsed = parseItems(extractJson(raw), meetingTitle, transcript);
    if (!parsed.ok) {
      return { ok: false, error: parsed.errors.join("; ") };
    }
    return { ok: true, items: parsed.items };
  } catch (error) {
    const detail = error?.context?.responseText || (error instanceof Error ? error.message : String(error));
    return { ok: false, error: `Forge LLM split failed: ${detail}` };
  }
}

module.exports = { splitMeeting };

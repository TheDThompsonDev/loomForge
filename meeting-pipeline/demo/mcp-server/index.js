#!/usr/bin/env node
// Local MCP server for the meeting-pipeline Forge app.
//
// Why this exists: the app's rovo:mcp module exposes its tools to Rovo
// agents inside Atlassian, but external exposure of Forge MCP tools hasn't
// shipped yet. This ~100-line wrapper gives any MCP client (Claude Code,
// Claude Desktop) the same three tools by signing requests to the app's
// web trigger. Runs on the laptop; nothing new deployed.
//
// Setup:
//   cd demo/mcp-server && npm install
//   claude mcp add meeting-pipeline -e PIPELINE_WEBTRIGGER_URL=<url> \
//     -e PIPELINE_SHARED_SECRET=<secret> -- node <abs-path>/index.js
import { createHmac } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = process.env.PIPELINE_WEBTRIGGER_URL;
const SECRET = process.env.PIPELINE_SHARED_SECRET;
if (!BASE_URL || !SECRET) {
  console.error("Set PIPELINE_WEBTRIGGER_URL and PIPELINE_SHARED_SECRET");
  process.exit(1);
}

const server = new McpServer({ name: "meeting-pipeline", version: "1.0.0" });

async function signedPost(query, payload) {
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", SECRET).update(body, "utf8").digest("hex");
  const response = await fetch(`${BASE_URL}${query}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pipeline-signature": signature,
    },
    body,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Pipeline HTTP ${response.status}: ${text}`);
  return JSON.parse(text);
}

function asResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

server.registerTool(
  "submit_transcript",
  {
    description:
      "Submit a meeting transcript to the meeting-pipeline Forge app. Extraction and " +
      "enrichment are schema-gated in deterministic code; tickets appear in the Jira " +
      "Review column for human approval. Returns the pipeline job id.",
    inputSchema: {
      transcript: z.string().min(200).describe("Full meeting transcript text"),
      meeting_title: z.string().describe("Short meeting title"),
      attendees: z.array(z.string()).optional().describe("Attendee names"),
      date: z.string().optional().describe("Meeting date, ISO-8601"),
      loom_url: z.string().optional().describe("Optional loom.com/share link"),
      generate_doc: z.boolean().optional().describe("Also publish a synthesized strategy doc to Confluence"),
    },
  },
  async (args) => asResult(await signedPost("", args))
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("meeting-pipeline MCP server running (stdio)");

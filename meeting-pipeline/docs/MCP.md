# MCP Integration

The pipeline is reachable by agents three ways. The validation and pipeline are identical in all three; only the front door and auth differ. Verified against Atlassian docs, August 2026.

## 1. Atlassian Remote MCP Server (GA): the Jira half, zero code

`mcp.atlassian.com` is generally available, with OAuth 2.1 and 72+ tools across Jira, Confluence, Compass, JSM, and Bitbucket. Because the pipeline's human gate lives in Jira, any MCP client can already work it:

```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp/authv2
```

Ask Claude to find open `meeting-pipeline` tickets, read the evidence quote, add the `agent:rovo` label, and transition the ticket to "Approved for Agent". That is the human gate, operated through an agent the human is driving.

Note: this server exposes product CRUD and search only. It cannot invoke Rovo agents or automations directly. The transition plus label is what fires our routing automation, which is exactly how the pipeline is designed.

## 2. rovo:agent plus rovo:mcp: the app's own tools, in platform

The manifest declares two Forge actions, `submit-transcript` and `get-job-status`, attached to the Meeting Pipeline `rovo:agent` (talk to it in Rovo chat). They are also listed under `rovo:mcp` (Preview), which surfaces them under Connected Apps in Rovo Studio for other custom agents to call as tools.

Preview caveats for `rovo:mcp`:

- Tools surface to Rovo agents inside Atlassian, not yet to arbitrary external MCP clients. External exposure (the `mcp.atlassian.com/v1/forge/...` URL from RFC-134) is roadmap.
- Preview features can change shape. Re-verify against the Forge changelog before deploying. If `forge lint` rejects `rovo:mcp` on your channel, comment out that block; the actions still work through the `rovo:agent`.

Handlers live in [src/actions.js](../src/actions.js). They skip the HMAC because Rovo invocations arrive platform-authenticated, but they run the identical validation and pipeline as the web trigger.

## 3. Local MCP wrapper: Claude drives the app directly

[demo/mcp-server](../demo/mcp-server) is a small stdio MCP server that wraps the web trigger with HMAC signing. It exists because external MCP exposure of Forge tools has not shipped, and because a live demo wants the fewest moving parts between Claude and the app.

```bash
cd demo/mcp-server && npm install
claude mcp add meeting-pipeline \
  -e PIPELINE_WEBTRIGGER_URL=<url> \
  -e PIPELINE_SHARED_SECRET=<secret> \
  -- node <absolute-path>/demo/mcp-server/index.js
```

Tool: `submit_transcript`, including the `generate_doc` option.

## Putting the three together

1. Claude, via the local wrapper: "Submit this meeting transcript and write the strategy doc." Returns a job id.
2. Tickets appear in Review. Claude, via the Atlassian Remote MCP Server: "Show me the tickets this created, then approve the caching one and route it to Rovo."
3. The Meeting Pipeline agent, in Rovo chat: "What did job X create?" It answers through `get-job-status`.

Three integration surfaces, one pipeline, and every mutation still passes the same gates.

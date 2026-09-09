# Atlassian MCP: stay in the editor

The board is still the product. You do not need to bounce into Jira after every deploy to ask "did it work?" The **Atlassian Rovo MCP Server** talks to the same site you just installed on. You ask Cursor. Cursor searches Jira. You keep building.

If you skip this, the labs still work. You will just spend the day as a tab tourist.

This is not a second pipeline. **Do not create tickets through MCP in this workshop.** The Apps page, the queue, and Forge LLM are the point. MCP is how you **check**.

## Install it now

Do this in [Setup](SETUP.md) or before Lab 1. Node is already a requirement. Cursor is the client we are using in the room.

### Option A: Cursor marketplace (preferred)

1. Open Cursor.
2. Go to the **Atlassian** plugin: [cursor.com/marketplace/atlassian](https://cursor.com/marketplace/atlassian).
3. Install it.
4. When it asks you to connect, complete the browser OAuth flow.

Use the **same Atlassian account** you used for `forge login`. Pick the **developer site** from Setup, not work Jira. If you auth to the company site, you will search a board that does not have your workshop tickets and you will think the pipeline is broken.

### Option B: MCP config by hand

Cursor Settings, then MCP, then add a server:

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp/authv2"
    }
  }
}
```

Save. Restart the agent pane if it does not wake up. Complete OAuth when prompted.

Official background: [Atlassian Rovo MCP Server](https://support.atlassian.com/atlassian-rovo-mcp-server/docs/getting-started-with-the-atlassian-remote-mcp-server/).

## The gate

Ask Cursor, in this repo:

> Search Jira on my developer site for recently created issues in project `YOURKEY`.

You should get a real JQL result, even if it is empty. If the tool is missing, the plugin is not connected. If it searches the wrong site, you OAuth'd the wrong cloud.

If a site admin has to authorize the app the first time, that is the same class of problem as the VPN. Fix it before Lab 1, not while the room is watching a spinner.

## How we use it in the labs

After each lab that writes to Jira or Confluence, there is a **Check it with MCP** prompt. Paste it. Read the answer. Then go back to the code.

| After | You are looking for |
|---|---|
| Lab 1 | A pipeline ticket whose **reporter is the app**, labeled `meeting-pipeline` |
| Lab 2 | Same ticket. The button came back before Jira finished |
| Lab 3 | Several issues from one run. Some also labeled `assign-to-agent` |
| Lab 4 | A Confluence page titled `…plan of record…`, and comments that link it |
| Lab 5 | One comment that says **Agent task triggered** |
| Lab 6 / 7 | Research page or assignee change on that issue |

If MCP is down, open the board. The product still has to be true in Jira. MCP is the faster witness.

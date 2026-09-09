# Meeting Pipeline

An advanced Forge workshop app. A meeting becomes several Jira tickets. Some of those tickets are for people. Some are labeled for an assignable agent. Approving or assigning an agent-routed ticket triggers a task — this Forge Rovo agent, Copilot, or another custom agent can take it.

This checkout is the working app. Attendees clone it. Start with [docs/SETUP.md](docs/SETUP.md), then the [labs](docs/labs/README.md). [docs/WORKSHOP.md](docs/WORKSHOP.md) is the concept-to-code map.

## How it works

```
CAPTURE                         HANDOFF                         WORK
----------------                ----------------                ----------------
Apps page    ─┐                 Approved for Agent              Meeting Pipeline
Web trigger  ─┼─► KVS + queue   or assignee change      ──►    Copilot
Rovo chat    ─┘   asApp Jira    Forge trigger comments          any assignable agent
                  N tickets     only for assign-to-agent
                  optional plan of record
```

## The pipeline

| Step | What happens | Where |
|---|---|---|
| 1 | Notes arrive: Apps page, web trigger, or Rovo agent | `src/console/`, `src/index.js`, `src/actions.js` |
| 2 | Validate meeting + work items (`human` or `agent`) | `src/ingestion/validate.js` |
| 3 | Job saved to storage, queued, fast ACK | `src/service.js` |
| 4 | Forge LLM splits notes into work items (if they were not pre-split) | `src/pipeline/splitMeeting.js` |
| 5 | Queue consumer creates one ticket per item, optional plan of record | `src/pipeline/createTicket.js`, `createMeetingPage.js` |
| 6 | Human reviews | Jira board |
| 7 | Agent-routed ticket approved or assigned → task triggered | `src/pipeline/onAgentHandoff.js` |
| 8 | An agent does the work (this one can publish research to Confluence) | `src/pipeline/loadIssue.js`, `publishResearch.js` |

## Quick start

```bash
npm install
npm run build:ui         # iframe serves static/console, not src/console

forge register           # then paste the new app id into manifest.yml
forge deploy
forge install

forge variables set JIRA_PROJECT_KEY <your-project-key>
forge variables set CONFLUENCE_SPACE_KEY <space>
forge variables set AGENT_HANDOFF_STATUS "Approved for Agent"
forge webtrigger         # prints the ingestion URL
```

Then follow [docs/JIRA-SETUP.md](docs/JIRA-SETUP.md) for board columns.

Open **Apps → Meeting Pipeline** in Jira. Hit **Load sample transcript** (or paste notes) and **Run the pipeline**. The load button fills the form and checks the Confluence box. That is the normal way work enters the app. Forge LLM splits the notes. Ticket count is not a fixture.

The web trigger is the scripted door to the same spine. The demo script attaches `fixtures/work-items.json`, so that path **skips** the model and always creates the same five tickets (two `assign-to-agent`):

```bash
PIPELINE_WEBTRIGGER_URL=https://... \
  ./demo/send-transcript.sh fixtures/real-meeting.txt "Weekly platform sync"
```

Move one agent-routed ticket to **Approved for Agent** and watch the trigger comment.

## Configuration

| Forge variable | Purpose |
|---|---|
| `JIRA_PROJECT_KEY` | Target project. Code falls back to `MEET` if this is unset. Use your real key. |
| `CONFLUENCE_SPACE_KEY` | Space for the plan of record and later research pages |
| `AGENT_HANDOFF_STATUS` | Status that triggers an agent task (default `Approved for Agent`) |
| `INGEST_TOKEN` | Optional. If set, the web trigger requires header `X-Ingest-Token` |

## Documentation

| Doc | Contents |
|---|---|
| [docs/SETUP.md](docs/SETUP.md) | Laptop, VPN, Forge CLI, developer site. Do this first. |
| [docs/labs/README.md](docs/labs/README.md) | The workshop. You clone this working app and peel it. |
| [docs/MCP.md](docs/MCP.md) | Atlassian MCP in Cursor. Check tickets. Do not create them. |
| [docs/WORKSHOP.md](docs/WORKSHOP.md) | Concept-to-code map |
| [docs/JIRA-SETUP.md](docs/JIRA-SETUP.md) | Board columns, handoff, optional Copilot Automation |

# Meeting Pipeline

An advanced Forge workshop app. A meeting becomes several Jira tickets. Some of those tickets are for people. Some are labeled for an assignable agent. Approving or assigning an agent-routed ticket triggers a task — this Forge Rovo agent, Copilot, or another custom agent can take it.

This app exists to be read. Start with [docs/WORKSHOP.md](docs/WORKSHOP.md).

## How it works

```
CAPTURE                         HANDOFF                         WORK
----------------                ----------------                ----------------
Apps page    ─┐                 Approved for Agent              Meeting Pipeline
Web trigger  ─┼─► KVS + queue   or assignee change      ──►    Copilot
Rovo chat    ─┘   asApp Jira    Forge trigger comments          any assignable agent
                  N tickets     only for assign-to-agent
                  optional Confluence notes page
```

## The pipeline

| Step | What happens | Where |
|---|---|---|
| 1 | Notes arrive: Apps page, web trigger, or Rovo agent | `src/console/`, `src/index.js`, `src/actions.js` |
| 2 | Validate meeting + work items (`human` or `agent`) | `src/ingestion/validate.js` |
| 3 | Job saved to storage, queued, fast ACK | `src/service.js` |
| 4 | Queue consumer creates one ticket per item, optional meeting page | `src/pipeline/createTicket.js`, `createMeetingPage.js` |
| 5 | Human reviews | Jira board |
| 6 | Agent-routed ticket approved or assigned → task triggered | `src/pipeline/onAgentHandoff.js` |
| 7 | An agent does the work (this one can publish research to Confluence) | `src/pipeline/loadIssue.js`, `publishResearch.js` |

## Quick start

```bash
npm install

forge register           # then paste the new app id into manifest.yml
forge deploy
forge install

forge variables set JIRA_PROJECT_KEY MEET
forge variables set CONFLUENCE_SPACE_KEY <space>
forge webtrigger         # prints the ingestion URL
```

Then follow [docs/JIRA-SETUP.md](docs/JIRA-SETUP.md) for board columns.

Open **Apps → Meeting Pipeline** in Jira. Paste notes (or Load sample notes), check **Also write a Confluence page**, and create tickets. That is the normal way work enters the app.

The web trigger is the scripted door to the same spine:

```bash
PIPELINE_WEBTRIGGER_URL=https://... \
  ./demo/send-transcript.sh fixtures/real-meeting.txt "Weekly platform sync"
```

Five tickets land in Review. Two have `assign-to-agent`. Move one of those to **Approved for Agent** and watch the trigger comment.

## Configuration

| Forge variable | Purpose |
|---|---|
| `JIRA_PROJECT_KEY` | Target project (default `MEET`) |
| `CONFLUENCE_SPACE_KEY` | Space for meeting-notes pages and later research pages |
| `AGENT_HANDOFF_STATUS` | Status that triggers an agent task (default `Approved for Agent`) |
| `INGEST_TOKEN` | Optional. If set, the web trigger requires header `X-Ingest-Token` |

## Documentation

| Doc | Contents |
|---|---|
| [docs/WORKSHOP.md](docs/WORKSHOP.md) | Concept-to-code map and suggested workshop flow |
| [docs/JIRA-SETUP.md](docs/JIRA-SETUP.md) | Board columns, handoff, optional Copilot Automation |

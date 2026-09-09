# Advanced Forge Workshop: Concept to Code Map

This checkout is the working app. You clone it, then open these files. The [labs](labs/README.md) are that walk.

This app exists to teach Forge. Every concept maps to a file you can open, read, and change.

The product is a meeting pipeline:

> A meeting is captured. It becomes several Jira tickets, with state in Forge storage. Some of those tickets are for people. Some are labeled for an assignable agent. Moving or assigning an agent-routed ticket **triggers a task**. The agent that takes it can be this Forge Rovo agent, Copilot, or another custom agent. If this agent does the work, findings can land in Confluence.

People capture a meeting on the **Apps** page. That form is the human front door: paste notes, create tickets, optionally write a plan of record. The web trigger and the Rovo agent hit the same spine for scripts and chat. If the payload has no `items` (or only the default one-item bag), Forge LLM splits the notes on the consumer. If `items` are already a real list, the model is skipped.

What we deliberately do **not** ship:

- A second HTTP door (`endpoint` / Forge REST APIs). The web trigger is the machine door, not the only door.
- A three-slot LLM extraction mill. One `@forge/llm` `chat()` on the queue consumer splits pasted notes. Code still owns Jira. If the model fails, one human ticket covers the meeting.
- Jira Automation as the only way to start agent work. The Forge trigger in this app is the handoff.

## Concept 1: Capturing input

| Where | What it teaches |
|---|---|
| `manifest.yml`, `jira:globalPage` and [src/console/](../src/console/) | The human front door (Custom UI). Title, notes, optional Confluence checkbox, live pipeline timeline. Resolver: [src/resolvers/page.js](../src/resolvers/page.js). |
| `manifest.yml`, `webtrigger` module | The machine HTTP door. Forge does not authenticate it; `INGEST_TOKEN` is optional. |
| [src/ingestion/validate.js](../src/ingestion/validate.js) | Deterministic payload validation, including work items, `route: human \| agent`, and `generate_doc`. |
| [src/service.js](../src/service.js) | The shared spine the Apps page, web trigger, and Rovo agent all call. |

## Concept 2: Async events

Accept fast, work later.

| Where | What it teaches |
|---|---|
| `manifest.yml`, `consumer` module, and [src/service.js](../src/service.js) | The `@forge/events` Queue. Ingest returns in milliseconds; the consumer creates the tickets. |
| Event bodies carry only `{ jobId }` | Async event payloads are size capped. Big data lives in storage; events carry pointers. |

## Concept 3: State with @forge/kvs

| Where | What it teaches |
|---|---|
| [src/storage.js](../src/storage.js) | Thin KV helpers. One value per key. |
| Job docs (`job:`) | Status plus per-item checkpoints so a retry does not double-create tickets. |
| Handoff docs (`handoff:`) | The agent task has already been triggered for this issue. |
| Research docs (`research:`) | The published page for an issue, so publish is idempotent too. |

## Concept 4: `asApp()` versus `asUser()`

Same `@forge/api` methods. Different principals. Both appear in this app on purpose.

| Where | Principal | Why |
|---|---|---|
| [src/pipeline/createTicket.js](../src/pipeline/createTicket.js) | `api.asApp().requestJira()` | Queue consumers have no user. |
| [src/pipeline/createMeetingPage.js](../src/pipeline/createMeetingPage.js) | `api.asApp().requestConfluence()` | Optional plan of record, same consumer, no user. |
| [src/pipeline/onAgentHandoff.js](../src/pipeline/onAgentHandoff.js) | `api.asApp()` comment | Product triggers have no user. |
| [src/pipeline/loadIssue.js](../src/pipeline/loadIssue.js) | `api.asUser().requestJira()` | Agent actions run as the person in the chat. |
| [src/pipeline/publishResearch.js](../src/pipeline/publishResearch.js) | `api.asUser().requestConfluence()` | Research write-up under that person's Confluence permissions. |

## Concept 5: Fan-out, then a triggered agent task

This is the product.

| Where | What it teaches |
|---|---|
| `manifest.yml` `modules.llm` and [src/pipeline/splitMeeting.js](../src/pipeline/splitMeeting.js) | One `@forge/llm` `chat()` on the consumer (`claude-sonnet-4-6`). Model returns JSON. Fallback is one human ticket. |
| [src/pipeline/createTicket.js](../src/pipeline/createTicket.js) | One meeting → N tickets. `route: agent` adds the `assign-to-agent` label. |
| `manifest.yml`, `trigger` module | `avi:jira:updated:issue` and `avi:jira:assigned:issue`, filtered to that label, `ignoreSelf: true`. |
| [src/pipeline/onAgentHandoff.js](../src/pipeline/onAgentHandoff.js) | Approval or assignment **triggers the task**. The app does not pick which agent runs it. |

This Forge agent is one worker. Copilot or a Studio agent can take the same ticket. The ticket is the job.

## Concept 6: A Forge-powered Rovo agent (one of the workers)

| Where | What it teaches |
|---|---|
| `manifest.yml`, `rovo:agent` module | A Rovo agent whose abilities are this app's actions. |
| `action` modules and [src/actions.js](../src/actions.js) | Actions are Forge functions with declared inputs. `actionVerb` GET vs CREATE vs TRIGGER. |

Studio-built agents get Atlassian's tools. Forge-powered agents get **your** functions. That is the difference worth opening a file for.

## Concept 7: External fetch (the Forge extra)

| Where | What it teaches |
|---|---|
| `manifest.yml`, `permissions.external.fetch.backend` | Every host a function calls must be declared. Undeclared hosts fail as HTTP 403. |
| [src/pipeline/fetchSource.js](../src/pipeline/fetchSource.js) | Allowlist, https only, timeout, size cap. Optional on `load-research-context`. |

## Concept 8: Confluence — meeting notes, then research

Two writes, two principals.

| Where | What it teaches |
|---|---|
| [src/pipeline/createMeetingPage.js](../src/pipeline/createMeetingPage.js) and [src/pipeline/planOfRecord.js](../src/pipeline/planOfRecord.js) | Optional ingest-time plan of record: summary, decisions, action plan with live `jira` macros, risks. `asApp`, from the queue. |
| [src/pipeline/publishResearch.js](../src/pipeline/publishResearch.js) | Later research write-up. `asUser`, from the agent action. |

This checkout is the **working app**. Attendees clone it, register their own app id, and walk the files. The labs are that walk. We have not carved a hollow starter yet.

## Suggested workshop flow

Follow **[docs/labs](labs/README.md)** after [Setup](SETUP.md). The short version:

1. **Setup, then Lab 0.** Register your own app id. Deploy. The page talks to a resolver, not to Jira.
2. **Labs 1 to 6.** Peel the clone: who creates the ticket, why the queue exists, Forge LLM, plan of record, handoff comment, this Rovo agent as one worker.
3. **Lab 7.** Studio, in the browser. Not more files in this repo.
4. **MCP.** Connect it after Setup. Use it to **check** tickets and pages. Do not create workshop tickets through MCP.

## Fixtures

| File | Purpose |
|---|---|
| `fixtures/real-meeting.txt` | The longer weekly sync used by `demo/send-transcript.sh`. The **Load sample transcript** button pastes a shorter version of the same standup (Sarah, Marcus, Priya). |
| `fixtures/work-items.json` | A known five-item split (two `route: agent`). Used by `demo/send-transcript.sh` and `npm run check`. That scripted path skips Forge LLM. The Apps page does not load this file. |

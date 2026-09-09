# Advanced Forge Workshop: Concept to Code Map

This app exists to teach Forge. Every concept maps to a file you can open, read, and change.

The product is a meeting pipeline:

> A meeting is captured. It becomes several Jira tickets, with state in Forge storage. Some of those tickets are for people. Some are labeled for an assignable agent. Moving or assigning an agent-routed ticket **triggers a task**. The agent that takes it can be this Forge Rovo agent, Copilot, or another custom agent. If this agent does the work, findings can land in Confluence.

People capture a meeting on the **Apps** page. That form is the human front door: paste notes, create tickets, optionally write a Confluence page. The web trigger and the Rovo agent hit the same spine for scripts and chat.

What we deliberately do **not** ship:

- A second HTTP door (`endpoint` / Forge REST APIs). The web trigger is the machine door, not the only door.
- An LLM extraction mill. Work items arrive already split (the form's sample, a fixture, or the Rovo agent). Pasted notes alone become one Review ticket covering the meeting.
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
| `manifest.yml`, `consumer` module, and [src/service.js](../src/service.js) | The `@forge/events` Queue. The trigger ACKs in milliseconds; the consumer creates the tickets. |
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
| [src/pipeline/createMeetingPage.js](../src/pipeline/createMeetingPage.js) | `api.asApp().requestConfluence()` | Optional meeting-notes page, same consumer, no user. |
| [src/pipeline/onAgentHandoff.js](../src/pipeline/onAgentHandoff.js) | `api.asApp()` comment | Product triggers have no user. |
| [src/pipeline/loadIssue.js](../src/pipeline/loadIssue.js) | `api.asUser().requestJira()` | Agent actions run as the person in the chat. |
| [src/pipeline/publishResearch.js](../src/pipeline/publishResearch.js) | `api.asUser().requestConfluence()` | Research write-up under that person's Confluence permissions. |

## Concept 5: Fan-out, then a triggered agent task

This is the product.

| Where | What it teaches |
|---|---|
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

## Suggested workshop flow

1. **Read the manifest top to bottom** (10 minutes). Page, web trigger, queue, trigger, agent, scopes, egress.
2. **Deploy.** `forge register`, paste the id, `forge deploy`, `forge install --upgrade` if egress was just added. Set `JIRA_PROJECT_KEY` and `CONFLUENCE_SPACE_KEY`.
3. **Capture from Apps.** Open **Apps → Meeting Pipeline**. Paste notes (or Load sample notes). Check the Confluence box. Create tickets. Watch the job resolve to issue keys and a page link.
4. **Machine door (optional).** `demo/send-transcript.sh` hits the same spine. Five tickets; two have `assign-to-agent`.
5. **Human gate.** Move an `assign-to-agent` ticket to **Approved for Agent** (or assign it). The Forge trigger comments that an agent task has started.
6. **Pick an agent.** Chat with Meeting Pipeline on that ticket, or hand the same ticket to Copilot / another agent. The ticket is the contract.
7. **If this agent works it.** `load-research-context`, optional Wikipedia fetch, `publish-research`.
8. **`asApp` vs `asUser`.** Open `createTicket.js` / `createMeetingPage.js` next to `loadIssue.js` / `publishResearch.js`.

## Fixtures

| File | Purpose |
|---|---|
| `fixtures/real-meeting.txt` | A messy weekly sync. |
| `fixtures/work-items.json` | The five tickets that meeting becomes. Two are `route: agent`. |

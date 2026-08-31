# Advanced Forge Workshop: Concept to Code Map

This app exists to teach Forge. Every box in the workshop diagram maps to a specific module and file you can open, read, and modify.

The flow being taught:

> Something triggers capture of an input. The input becomes a Jira ticket, with state in Forge storage. The ticket can be handed to an assignable agent. The output can land in a Confluence doc. The work is solved and tracked.

## Concept 1: Capturing input

| Where | What it teaches |
|---|---|
| `manifest.yml`, `webtrigger` module | The app's public HTTP front door. |
| [src/ingestion/validate.js](../src/ingestion/validate.js) | Deterministic payload validation before anything expensive runs. |
| [src/service.js](../src/service.js) | The shared spine both the web trigger and the Rovo agent call. |

## Concept 2: Async events

Accept fast, work later.

| Where | What it teaches |
|---|---|
| `manifest.yml`, `consumer` module, and [src/service.js](../src/service.js) | The `@forge/events` Queue. The trigger ACKs in milliseconds; the consumer does the Jira and Confluence writes. |
| Event bodies carry only `{ jobId }` | Async event payloads are size capped. Big data lives in storage; events carry pointers. |

## Concept 3: State with @forge/kvs

| Where | What it teaches |
|---|---|
| [src/storage.js](../src/storage.js) | Thin KV helpers. One value per key. |
| The job doc | Status plus checkpoints so a Forge retry does not double-create a ticket. |

## Concept 4: Jira as the system of record

| Where | What it teaches |
|---|---|
| [src/pipeline/createTickets.js](../src/pipeline/createTickets.js) | `api.asApp().requestJira()`. |
| The `asApp()` versus `asUser()` choice | Queue consumers have no user context; background work uses `asApp()`. |

## Concept 5: The assignable agent

| Where | What it teaches |
|---|---|
| `manifest.yml`, `rovo:agent` module | A Rovo agent whose abilities are this app's actions. |
| `manifest.yml`, `action` modules, and [src/actions.js](../src/actions.js) | Actions are Forge functions with declared inputs: `submit-transcript` and `get-job-status`. |
| [docs/JIRA-SETUP.md](JIRA-SETUP.md) | The Jira side: board columns and handing a ticket to an agent. |

## Concept 6: Confluence output

| Where | What it teaches |
|---|---|
| [src/pipeline/createConfluencePage.js](../src/pipeline/createConfluencePage.js) | `api.asApp().requestConfluence()` with storage-format XHTML, including the `jira` macro so tickets render as live cards. |

## Suggested workshop flow

1. **Read the manifest top to bottom** (10 minutes). It is the app's whole contract.
2. **Deploy.** `forge register`, paste the id into the manifest, `forge deploy`, `forge install`. Set `JIRA_PROJECT_KEY` and `CONFLUENCE_SPACE_KEY`.
3. **Door 1, the web trigger.** Submit `fixtures/real-meeting.txt` with `demo/send-transcript.sh`. Watch a ticket land in Review.
4. **Door 2, the agent.** Talk to the Meeting Pipeline Rovo agent. Same pipeline, agent front door.
5. **Confluence.** Re-run with the doc option and open the page.

## Fixture

| File | Purpose |
|---|---|
| `fixtures/real-meeting.txt` | A messy, realistic sync you can POST at the web trigger. |

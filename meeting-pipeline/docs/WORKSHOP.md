# Advanced Forge Workshop: Concept to Code Map

This app exists to teach Forge. Every box in the workshop diagram maps to a specific module and file you can open, read, and modify.

The flow being taught:

> Something triggers capture of an input. The input becomes a Jira ticket, with state in Forge storage. The ticket is handed to an assignable agent. The agent's output lands in a Confluence doc. The work is solved and tracked.

Our concrete version of that flow: a meeting transcript goes in; gated, evidence-checked Jira tickets and a synthesized Confluence strategy doc come out.

## Concept 1: Capturing input

Web triggers and the in-product console.

| Where | What it teaches |
|---|---|
| `manifest.yml`, `webtrigger` module | The app's public HTTP front door. Forge gives you zero auth on a web trigger; you build it yourself. |
| [src/ingestion/auth.js](../src/ingestion/auth.js) | HMAC-SHA256 request signing with `timingSafeEqual`. The demo scripts in `demo/` sign the exact bytes they send. |
| [src/ingestion/validate.js](../src/ingestion/validate.js) | Deterministic payload validation before anything expensive runs. |
| [src/console](../src/console) and the `jira:globalPage` module | The second front door: a Custom UI page inside Jira. Same pipeline, different auth story. The resolver runs for a logged-in user, so no HMAC is needed. |

Teaching beat: two doors, one pipeline, and auth is a per-door decision. [src/service.js](../src/service.js) is the shared spine both doors call.

## Concept 2: Async events

Accept fast, work later.

| Where | What it teaches |
|---|---|
| `manifest.yml`, `consumer` module, and [src/service.js](../src/service.js) | The `@forge/events` Queue. The trigger ACKs in milliseconds; the consumer does minutes of work. |
| `timeoutSeconds: 300` on the `pipeline-worker` function | Consumers default to 55 seconds. You extend that on the function module, not the consumer module. |
| Event bodies carry only `{ jobId }` | Async event payloads are size capped (200KB per push). Big data lives in storage; events carry pointers. |

## Concept 3: State with @forge/kvs

| Where | What it teaches |
|---|---|
| [src/storage.js](../src/storage.js) | Thin KV helpers. One value per key, 240KiB cap per value. |
| The job doc | The whole pipeline is a state machine stored in one KV value: current status plus phase checkpoints. |
| Checkpointing in `processPipelineJob` ([src/index.js](../src/index.js)) | Forge retries failed async events. Without checkpoints, a retry re-runs the nondeterministic AI and double-creates tickets. With them, a retry resumes exactly where it died. This is the difference between demo code and production code. |

## Concept 4: Jira as the system of record

| Where | What it teaches |
|---|---|
| [src/pipeline/createTickets.js](../src/pipeline/createTickets.js) | `api.asApp().requestJira()` with ADF descriptions, labels, and priorities. |
| The `asApp()` versus `asUser()` choice | Queue consumers have no user context; `asUser()` throws `AUTH_TYPE_UNAVAILABLE` there. Rule of thumb: background work uses `asApp()`, user-clicked work uses `asUser()`. |
| [src/pipeline/dedupe.js](../src/pipeline/dedupe.js) | The read side: JQL search plus a deterministic similarity check. Duplicates are flagged for the human, never auto-discarded. |

## Concept 5: AI slots behind code gates

| Where | What it teaches |
|---|---|
| `manifest.yml`, `llm` module, and [src/llm.js](../src/llm.js) | The `@forge/llm` API: Atlassian-hosted Claude, called in platform. No external egress, no API key. Token usage returns on every response. |
| [extractor.js](../src/pipeline/extractor.js), [enricher.js](../src/pipeline/enricher.js), [docWriter.js](../src/pipeline/docWriter.js) | Three AI slots out of roughly fifteen steps. AI fills designated slots; deterministic code owns the flow. |
| [src/pipeline/schemaGate.js](../src/pipeline/schemaGate.js) | Every AI output passes a hand-rolled schema gate. The evidence rule: every action item must quote the transcript word for word, verified by a code substring match. Failures get one repair attempt with the validator errors fed back, then dead-letter. |

## Concept 6: The assignable agent

| Where | What it teaches |
|---|---|
| `manifest.yml`, `rovo:agent` module | A Rovo agent whose abilities are this app's actions. Ask it to process a meeting in Rovo chat and it calls the same pipeline. |
| `manifest.yml`, `action` modules, and [src/actions.js](../src/actions.js) | Actions are Forge functions with declared inputs. They are the agent's tool belt: `submit-transcript` and `get-job-status`. |
| `manifest.yml`, `rovo:mcp` module (Preview) | The same actions exposed as MCP tools for agents outside Rovo chat. `demo/mcp-server` additionally wraps the web trigger for external MCP clients such as Claude. |
| [docs/JIRA-SETUP.md](JIRA-SETUP.md) | The Jira side: board columns, the human "Approved for Agent" gate, and label-based automation routing to a coding agent. |

## Concept 7: Confluence output

| Where | What it teaches |
|---|---|
| [src/pipeline/createConfluencePage.js](../src/pipeline/createConfluencePage.js) | `api.asApp().requestConfluence()` with storage-format XHTML, including the `jira` macro so tickets render as live cards inside the doc. |
| [src/pipeline/docWriter.js](../src/pipeline/docWriter.js) | The doc is a synthesis (summary, decisions with dissent, risks, plan, explicitly deferred items), not minutes. Gate 3's code-checked rule: the AI cannot silently drop a validated decision. |

## Concept 8: External APIs as a deliberate extra

| Where | What it teaches |
|---|---|
| `manifest.yml`, `permissions` section | Scopes are the least-privilege contract. `external.fetch` is absent by default, so nothing leaves the platform. |
| [src/ingestion/loomTranscript.js](../src/ingestion/loomTranscript.js) and [docs/LOOM.md](LOOM.md) | The one candidate egress: fetching a transcript from a Loom URL. It is an unofficial API, flag gated, and requires an explicit manifest egress declaration. A good discussion piece: what does one egress line cost, and when is it worth paying? |

## Suggested workshop flow

1. **Read the manifest top to bottom** (10 minutes). It is annotated per concept, and the manifest is the app's whole contract.
2. **Preview locally.** Run `npm run preview:console`, then double-click `demo/console-preview/index.html`. You see the target experience, including a simulated gate rejection, before deploying anything.
3. **Deploy.** `forge register`, paste the id into the manifest, `forge deploy`, `forge install`. Set `PIPELINE_SHARED_SECRET`, `JIRA_PROJECT_KEY`, and `CONFLUENCE_SPACE_KEY`.
4. **Door 1, the web trigger.** Submit `fixtures/real-meeting.txt` with `demo/send-transcript.ps1`. Discuss HMAC, the queue, and checkpoints while it runs. Watch tickets land in Review.
5. **Door 2, the console.** Open Apps, then Meeting Pipeline. Run `fixtures/trap-meeting.txt` with the strategy doc box ticked. Watch the evidence gate reject a baited item live in the timeline, then open the Confluence page.
6. **Door 3, the agent.** Talk to the Meeting Pipeline Rovo agent. Same pipeline, agent front door.
7. **Stretch labs.** Enable the Loom fetcher and discuss the egress tradeoff. Wire the Jira automation routing. Try Teamwork Graph if you have EAP access. An optional lab on measuring AI nondeterminism lives in `extras/drift-lab/`.

## Fixtures

| File | Purpose |
|---|---|
| `fixtures/real-meeting.txt` | A messy, realistic sync. Correct extraction: 4 action items, 3 decisions, one with recorded dissent. |
| `fixtures/trap-meeting.txt` | Engineered bait: vague ownership, implied deadlines, an explicitly rejected project. Ungated AI invents tickets from it; the evidence gate strips them. |
| `fixtures/expected/*.json` | Canonical correct outputs. `npm test` runs 19 deterministic tests against them without a single LLM call. |

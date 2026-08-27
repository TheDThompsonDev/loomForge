# Meeting Pipeline

An advanced Forge workshop app. A meeting transcript goes in. Evidence-checked Jira tickets and a synthesized Confluence strategy document come out. A human approves every ticket before any agent touches it.

Every module in this codebase exists to teach a Forge concept. Start with [docs/WORKSHOP.md](docs/WORKSHOP.md) for the full concept-to-code map.

## How it works

```
INPUT                      PROCESSING                     OUTPUT
--------------             --------------                 --------------
Web trigger (HMAC)         Async events queue             requestJira()
Custom UI console    -->   Job doc in @forge/kvs    -->   requestConfluence()
Rovo agent action          (checkpointed)                 Human review gate
                           3 AI slots via @forge/llm,
                           each behind a code gate
```

Deterministic code owns the flow. AI fills three designated slots (extract, enrich, write the doc), and every AI output must pass a code gate before it touches Jira or Confluence.

The sharpest gate: every action item must include an `evidence_quote` that appears word for word in the transcript, verified by a code substring match. No receipts, no ticket.

## The pipeline, step by step

| Step | Type | What happens | Where |
|---|---|---|---|
| 1 | Trigger | Input arrives: web trigger, console, or Rovo agent | `src/index.js`, `src/actions.js` |
| 2 | Code | HMAC-SHA256 signature check (web trigger only) | `src/ingestion/auth.js` |
| 3 | Code | Payload validation | `src/ingestion/validate.js` |
| 4 | Code | Job saved to storage, queued, fast ACK | `src/service.js` |
| 5 | Code | Queue consumer picks up (checkpointed, retry safe) | `src/index.js` |
| 6 | AI 1 | Extract decisions and action items | `src/pipeline/extractor.js` |
| 7 | Code | Schema gate plus verbatim evidence check | `src/pipeline/schemaGate.js` |
| 8 | AI 2 | Enrich with org context | `src/pipeline/enricher.js` |
| 9 | Code | Second schema gate | `src/pipeline/schemaGate.js` |
| 10 | Code | Dedupe check (flag, never auto-discard) | `src/pipeline/dedupe.js` |
| 11 | Code | Create tickets in the Review column | `src/pipeline/createTickets.js` |
| 11b | AI 3 | Optional strategy doc, gated, published to Confluence | `src/pipeline/docWriter.js`, `createConfluencePage.js` |
| 12 | Human | Review, then move to "Approved for Agent" | Jira board |
| 13 | Code | Automation routes by label to a coding agent | [docs/JIRA-SETUP.md](docs/JIRA-SETUP.md) |
| 14 | Agent | Agent works, opens a PR, moves ticket to "PR Ready" | No auto-merge |

## Three front doors, one pipeline

All three converge on [src/service.js](src/service.js). Only the auth story differs.

1. **Web trigger.** HTTP plus HMAC signing. Driven by `demo/send-transcript.ps1` or `.sh`.
2. **The console.** Apps, then Meeting Pipeline, inside Jira. Paste a transcript or a Loom URL, optionally tick the strategy doc box, and watch the pipeline timeline animate live: gates lighting up, rejections called out in red, ticket links appearing, and the Confluence page link at the end.
3. **The Rovo agent.** A `rovo:agent` named Meeting Pipeline whose actions call the same code. The actions are also exposed as MCP tools. See [docs/MCP.md](docs/MCP.md).

## The strategy document

Not minutes. AI slot 3 synthesizes:

- Executive summary and context
- Decisions with rationale and recorded dissent
- Risks and open questions
- An action plan that embeds the created tickets as live Jira cards
- An "explicitly deferred" section, so ruled-out ideas stay ruled out

Gate 3 enforces one hard rule in code: the document cannot silently drop a validated decision. Dissent cannot be edited out of the record.

## Quick start

```bash
npm install
npm test                 # 19 deterministic gate tests; no LLM, no deploy needed
npm run preview:console  # local, double-clickable console preview (simulated run)
npm run build:ui         # bundle the Custom UI before deploying

forge register           # then paste the new app id into manifest.yml
forge deploy
forge install

forge variables set --encrypt PIPELINE_SHARED_SECRET <random-string>
forge variables set JIRA_PROJECT_KEY MEET
forge variables set CONFLUENCE_SPACE_KEY <space>
forge webtrigger         # prints the ingestion URL
```

Then follow [docs/JIRA-SETUP.md](docs/JIRA-SETUP.md) for board columns and automation (steps 12 through 14).

## Configuration

| Forge variable | Purpose |
|---|---|
| `PIPELINE_SHARED_SECRET` (encrypted) | HMAC secret for the web trigger |
| `JIRA_PROJECT_KEY` | Target project (default `MEET`) |
| `CONFLUENCE_SPACE_KEY` | Space for strategy docs; required for the doc option |
| `PIPELINE_MODEL` | Forge LLM model id (default `claude-sonnet-5`) |
| `TEAMWORK_GRAPH_ENABLED` | `true` only with EAP access. See [docs/TEAMWORK-GRAPH.md](docs/TEAMWORK-GRAPH.md) |
| `LOOM_TRANSCRIPT_FETCH` | `true` enables the unofficial URL-to-transcript fetcher; requires manifest egress. See [docs/LOOM.md](docs/LOOM.md) |

## Documentation

| Doc | Contents |
|---|---|
| [docs/WORKSHOP.md](docs/WORKSHOP.md) | Start here. Concept-to-code map and the suggested workshop flow |
| [docs/JIRA-SETUP.md](docs/JIRA-SETUP.md) | Board columns, automation rules, agent routing |
| [docs/MCP.md](docs/MCP.md) | The MCP surfaces: Atlassian Remote MCP, rovo:mcp, local wrapper |
| [docs/LOOM.md](docs/LOOM.md) | Why Loom ingestion is paste-first, and the opt-in fetcher |
| [docs/TEAMWORK-GRAPH.md](docs/TEAMWORK-GRAPH.md) | EAP status, scopes, and the fallback design |

The `extras/drift-lab/` folder holds an optional add-on lab about measuring AI output nondeterminism. It is not part of the core workshop.

# Meeting Pipeline

An advanced Forge workshop app. An input is captured. A Jira ticket is created and stored in Forge KV. A Rovo agent can run the same pipeline. Optionally a Confluence page is written so the work is tracked.

Start with [docs/WORKSHOP.md](docs/WORKSHOP.md) for the concept-to-code map.

## How it works

```
INPUT                 PROCESSING              OUTPUT
--------------        --------------          --------------
Web trigger     -->   Job doc in @forge/kvs   requestJira()
Rovo agent            Queue consumer     -->  requestConfluence()
                                              Human review gate
```

## The pipeline

| Step | What happens | Where |
|---|---|---|
| 1 | Input arrives: web trigger or Rovo agent | `src/index.js`, `src/actions.js` |
| 2 | Payload validation | `src/ingestion/validate.js` |
| 3 | Job saved to storage, queued, fast ACK | `src/service.js` |
| 4 | Queue consumer creates a Jira ticket | `src/pipeline/createTickets.js` |
| 5 | Optional Confluence page | `src/pipeline/createConfluencePage.js` |
| 6 | Human reviews the ticket | Jira board |

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

Then follow [docs/JIRA-SETUP.md](docs/JIRA-SETUP.md) for board columns and agent routing.

## Configuration

| Forge variable | Purpose |
|---|---|
| `JIRA_PROJECT_KEY` | Target project (default `MEET`) |
| `CONFLUENCE_SPACE_KEY` | Space for pages; required for the doc option |

## Documentation

| Doc | Contents |
|---|---|
| [docs/WORKSHOP.md](docs/WORKSHOP.md) | Concept-to-code map and suggested workshop flow |
| [docs/JIRA-SETUP.md](docs/JIRA-SETUP.md) | Board columns and agent routing |

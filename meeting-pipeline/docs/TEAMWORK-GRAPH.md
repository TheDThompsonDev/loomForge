# Teamwork Graph Enrichment

Resolved against current docs (August 2026): **the API exists, but it is EAP-gated.**

## The facts

- Docs: developer.atlassian.com/platform/teamwork-graph
- Forge apps call it via `api.asApp().requestTeamworkGraph(query, variables)`, a GraphQL wrapper that executes Cypher relationship queries.
- Scope: `read:graph:jira`, an org-wide read of objects and relationships.
- Person-to-work lookups are exactly what it models: users, teams, work items, and documents, with the relationships between them.
- The gate: apps must be allowlisted for the EAP, and Atlassian recommends installing such apps only in test organizations for now.

## How this app handles it

`gatherOrgContext()` in [src/pipeline/enricher.js](../src/pipeline/enricher.js) picks one of two context sources:

1. **Teamwork Graph**, when `TEAMWORK_GRAPH_ENABLED=true`. Requires EAP allowlisting and uncommenting `read:graph:jira` in the manifest. Runs a Cypher query for work items matching the action items' keywords, returning related work and the people attached to it.
2. **The fallback, on by default and clearly marked.** A deterministic Jira JQL search (open tickets by keyword, with assignee and epic) plus a Confluence CQL search (recent pages by keyword). The enrichment prompt is told which source it received, so nothing pretends to be graph-powered when it is not.

Either way, the AI only sees context that deterministic code fetched. The enrichment gate rejects malformed output and cannot mutate fields that already passed gate 1.

## Workshop framing

With EAP access: flip the flag and show owner suggestions coming from the graph, which knows who works on what.

Without it: the demo is identical through the fallback, and the honest line is that the Teamwork Graph call is written and flag-gated, waiting on the EAP.

# Jira Setup: Steps 12 to 14

The code creates tickets and stops. Everything after that is Jira board configuration and automation rules, set up once in the Jira UI.

## 1. Board columns

Create or map these columns on the target project's board, left to right:

| Column | Status | Who moves tickets in |
|---|---|---|
| Review | To Do (default) | The pipeline (step 11 lands here) |
| Approved for Agent | custom status | A human, after review (step 12, human gate one) |
| In Progress | In Progress | The agent, on pickup |
| PR Ready | custom status | The agent, after opening the PR (step 14) |
| Done | Done | A human, after PR review and merge (human gate two lives in the PR) |

Add the two custom statuses via Project settings, then Statuses (team-managed projects) or the workflow editor (company-managed projects).

## 2. Routing automation (step 13)

Project settings, then Automation, then Create rule:

1. **Trigger.** Issue transitioned to `Approved for Agent`.
2. **Condition.** Issue matches JQL: `labels = "meeting-pipeline"`.
3. **Branches, one per agent:**
   - If `labels = "agent:rovo"`: assign the issue to the Rovo dev agent, or use the "Use Rovo agent" automation action (its output is available as `{{agentResponse}}` for a follow-up comment).
   - If `labels = "agent:copilot"`: assign to the GitHub Copilot agent user.
   - Fallback branch (no `agent:*` label): add the label `agent:rovo` and re-trigger, or assign a default.
4. **Optional final action.** Add a comment: `Routed by automation. No auto-merge: a human reviews the PR.`

The human reviewer picks the agent by adding the `agent:*` label during review. Routing stays a human decision, made as part of the approval.

## 3. Agent pickup (step 14)

Two variants, depending on the kind of ticket. Both are pure Jira configuration; the app is not involved past this point.

### Variant A: coding agent, ticket becomes a PR

Whichever assignable coding agent you use, configure it in its own surface to:

1. Work only issues assigned to it in status `Approved for Agent`.
2. Move the issue to `In Progress` on pickup.
3. Open a PR referencing the issue key.
4. Move the issue to `PR Ready` when the PR is up.

No auto-merge anywhere. The PR merge is the second human gate.

### Variant B: research agent, ticket becomes a Confluence doc

This is the research-spike flow from the workshop diagram: the approved ticket is handed to an agent that investigates and writes its findings up. Build it as an automation branch:

1. **Branch condition.** `labels = "agent:research"` (the reviewer adds this label during approval, same as any other routing label).
2. **Action.** "Use Rovo agent", pointed at a research-capable agent, with a prompt like: `Research the feasibility of the work described in {{issue.key}}: {{issue.summary}}. {{issue.description}}. Summarize findings, risks, and a recommendation.`
3. **Follow-up actions.** The agent's output is available as `{{agentResponse}}`. Use a "Create Confluence page" automation action (or a comment plus a manual page) to publish it, and add a comment on the issue linking the page.
4. **Transition.** Move the issue to `PR Ready` (or a `Researched` column if you add one).

Known rough edge: the "Use Rovo agent" action runs with the rule editor's permissions and can occasionally rate-limit; keep a retry or a manual fallback in the workshop script.

## 4. Note on where the AI instructions live

The pipeline's AI slots run in code via the Forge LLMs API, so their prompts live in version control (`src/pipeline/extractor.js`, `enricher.js`, `docWriter.js`) rather than inside an automation rule. That means the prompts are code-reviewable and diffable. If you want an additional interactive agent, the manifest's `rovo:agent` module is the pattern to extend.

# Jira Setup

The app creates a ticket and stops. Everything after that is Jira board configuration and automation, set up once in the Jira UI.

## 1. Board columns

Create or map these columns on the target project's board, left to right:

| Column | Status | Who moves tickets in |
|---|---|---|
| Review | To Do (default) | The pipeline |
| Approved for Agent | custom status | A human, after review |
| In Progress | In Progress | The agent, on pickup |
| Done | Done | A human, after the work is accepted |

Add the custom status via Project settings, then Statuses (team-managed) or the workflow editor (company-managed).

## 2. Hand the ticket to a research agent

This is the research-spike flow: the approved ticket is assigned to an agent that investigates and writes findings up.

Project settings, then Automation, then Create rule:

1. **Trigger.** Issue transitioned to `Approved for Agent`.
2. **Condition.** Issue matches JQL: `labels = "meeting-pipeline"`.
3. **Action.** "Use Rovo agent", pointed at a research-capable agent, with a prompt like: `Research the work described in {{issue.key}}: {{issue.summary}}. {{issue.description}}. Summarize findings, risks, and a recommendation.`
4. **Follow-up.** The agent's output is available as `{{agentResponse}}`. Publish it to Confluence (or comment the issue with the page link) and transition the issue.

The "Use Rovo agent" action runs with the rule editor's permissions and can rate-limit; keep a manual fallback in the workshop script.

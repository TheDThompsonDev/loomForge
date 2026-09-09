# Jira Setup

The app creates tickets and stops. Review is a human gate. Agent-routed tickets (`assign-to-agent`) become a triggered task when they are approved or assigned. The app does not choose which agent runs.

## 1. Board columns

Create or map these columns on the target project's board, left to right:

| Column | Status | Who moves tickets in |
|---|---|---|
| Review | To Do (default) | The pipeline |
| Approved for Agent | custom status, exact name | A human, only for `assign-to-agent` tickets |
| In Progress | In Progress | The agent or human who picked the work up |
| Done | Done | A human, after the work is accepted |

Add the custom status via Project settings, then Statuses (team-managed) or the workflow editor (company-managed). The status name must be exactly `Approved for Agent` unless you set `AGENT_HANDOFF_STATUS`.

## 2. Which tickets go to an agent

The pipeline labels some items `assign-to-agent`. Those are research / recommendation work. Implementation tickets stay unlabeled and stay with people.

Handoff, either way:

1. Move an `assign-to-agent` ticket to `Approved for Agent`, or assign it.
2. The Forge trigger comments: an agent task has started.
3. Give the ticket to **any** assignable agent — this app's Meeting Pipeline agent, Copilot, or a Studio-built agent.

Example for this Forge agent:

> Research MEET-14. Fetch https://en.wikipedia.org/api/rest_v1/page/summary/Cache_(computing) as context. Then publish the write-up.

## 3. Optional: also route to Copilot via Automation

If you want Copilot (or another Rovo agent) to start automatically on the same handoff, add a Jira Automation rule:

1. **Trigger.** Issue transitioned to `Approved for Agent`.
2. **Condition.** `labels = assign-to-agent`.
3. **Action.** Use the Copilot / Rovo agent of your choice.

That rule is extra. The Forge trigger in this app already marks the task as started. Keep a manual chat fallback in the workshop script.

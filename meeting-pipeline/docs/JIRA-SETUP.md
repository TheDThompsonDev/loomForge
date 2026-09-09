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

Add the custom status via Project settings, then Statuses (team-managed) or the workflow editor (company-managed). The status name must be exactly `Approved for Agent` unless you set `AGENT_HANDOFF_STATUS`. A question mark on the end is a different status. The trigger will not see it.

## 2. Which tickets go to an agent

Every pipeline ticket gets `meeting-pipeline` and `needs-review`. Research / recommendation items also get `assign-to-agent`. Implementation tickets stay with people. They are not unlabeled.

Handoff, either way:

1. Move an `assign-to-agent` ticket to `Approved for Agent`, or assign it.
2. The Forge trigger comments: **Agent task triggered.** The ticket is ready for an assignable agent.
3. Give the ticket to **any** assignable agent — this app's Meeting Pipeline agent, Copilot, or a Studio-built agent.

Example for this Forge agent:

> Research YOURKEY-14. Fetch https://en.wikipedia.org/api/rest_v1/page/summary/Cache_(computing) as context. Then publish the write-up.

## 3. Studio and Automation

The workshop builds the worker in **[Lab 7](labs/07-studio.md)**. Assign that Studio agent on an `assign-to-agent` ticket the same way you assign a person.

If you want the agent to start when the column changes, add a Jira Automation rule:

1. **Trigger.** Issue transitioned to `Approved for Agent`.
2. **Condition.** `labels = assign-to-agent`.
3. **Action.** Use the Copilot / Rovo agent of your choice.

That rule is extra. The Forge trigger in this app already marks the task as started. Keep a manual chat fallback in the workshop script.

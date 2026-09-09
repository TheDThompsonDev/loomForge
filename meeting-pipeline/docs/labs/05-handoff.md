# Lab 5: The ticket is the job

Some of those issues are for Sarah. Some are labeled **`assign-to-agent`**. If nothing happens when you move one, the label is a sticker.

Today, approve or assign an agent-routed ticket and the app comments **Agent task triggered**. It does not pick who runs.

## The belief we are killing

**"The pipeline should start the agent."**

If Forge invokes Meeting Pipeline from this trigger, you have decided the worker. Copilot cannot take it. A Studio research agent cannot take it. You built a chatbot launcher with extra steps.

The ticket is the contract. The column means ready. The assignee means which specialist. This app only says: the job exists.

## Why we do it this way

Listen for **`avi:jira:updated:issue`** and **`avi:jira:assigned:issue`**. Filter to the label. Comment as the app. Remember the issue in KVS so a second event does not comment twice.

**`ignoreSelf: true`** is not optional seasoning. The comment is an issue update. Without the flag, that update is another event, which comments again, which updates again. The app DDoSes itself and the ticket becomes a novel.

We do not call `@forge/llm` here. We do not call Rovo here. Lab 6 is one worker that can pick the job up. Half B is the rest.

## What you are not changing

A custom field. A workflow validator. Do not point this trigger at the Rovo agent. You can add an Automation rule later that assigns Copilot on the same status. That rule is extra. This trigger still has to be safe without it.

## 1. Make the column real

On the developer site, follow [Jira Setup](../JIRA-SETUP.md) if you have not. You need a status named exactly **`Approved for Agent`**, because that is the variable you set in Lab 0.

If the name drifts, the trigger will watch a column that does not exist and you will move tickets into a void. A question mark on the end of the status name is a different status. I have seen that one live. It will not match.

## 2. Read the trigger out loud

Open **`manifest.yml`**. Find `agent-handoff`.

```yml
filter:
  ignoreSelf: true
  expression: event.issue.fields?.labels?.includes("assign-to-agent") == true
```

Read those two lines out loud. Label first, so human tickets can move all day without waking the worker. `ignoreSelf` second, so our comment cannot wake us.

The handler string is `index.onAgentHandoff`. Naming things is still hard. Match the two strings.

## 3. Decide if this event is a handoff

Open **`src/pipeline/onAgentHandoff.js`**. Two yeses and you continue. Anything else, return.

Assignment is a handoff. A status change to `AGENT_HANDOFF_STATUS` (or the env var) is a handoff. A summary edit is not. A comment is not. If you skip the changelog check, every sneeze on that issue is an agent task.

If the issue does not have **`assign-to-agent`**, return. The manifest filter should already catch that. The function checks again anyway. Defense in depth is cheaper than a comment on Sarah's hotfix.

## 4. Comment once

If `storage.getHandoff(issueKey)` already exists, return. Retries and double events are normal. Two comments is how the room loses trust.

Then comment as the app. **`commentIssue`**, `asUser: false`.

The text says the ticket is ready for **an** assignable agent: this Forge agent, Copilot, or another custom agent. It does not name a winner.

The handoff record is saved **after** the comment. If you save first and the comment fails, you skip the comment forever and think you are idempotent.

## 5. Prove it on the board

Move an **`assign-to-agent`** ticket to **Approved for Agent**, or assign it. You should see one comment. Move a human ticket. You should see nothing from the app.

If you want the scare lab, and only if the room can handle it: temporarily set `ignoreSelf: false`, deploy, move one ticket, and watch the comment storm. Then put the flag back. That is the belief, killed live.

## Check it with MCP

> Get Jira issue YOUR-AGENT-KEY and list the comments. Is there exactly one comment that says Agent task triggered?

If you see a stack of the same comment, `ignoreSelf` is off or the handoff record did not save.

## You are done when

An agent-routed ticket gets exactly one **Agent task triggered** comment when it is approved or assigned. Human tickets stay quiet. The app did not open a chat.

## Why we stop here

The job is on the board. Nobody has done the work. Lab 6 is this Forge Rovo agent as **one** worker, not the pipeline. After that, the second half of the day is Studio.

# Lab 7: Build a specialist in Studio

You cloned a working Forge pipeline and peeled it. Notes became tickets. Some of those tickets are labeled **`assign-to-agent`**. Lab 5 commented **Agent task triggered**. Lab 6 proved **this** Forge agent can pick one up.

Monday, somebody at work will ask you to show an agent. They will not wait for `forge deploy`. They want a specialist they can assign like Sarah. That is Studio.

This lab is how you walk back in with something in the browser, not only something in a repo.

## The belief we are killing

**"I need a Forge app to have an agent, and one agent should do everything."**

Forge is how you built the **job**. Studio is how you staff it. A research agent, a docs agent, and Copilot can all sit on the same board. If you stuff every skill into Meeting Pipeline, you will rebuild HR inside a prompt.

## Why we do it this way

Studio-built agents get **Atlassian's tools**: read the issue, search the site, write a comment, draft a page. They do not get `@forge/llm` in your function, and they do not get your egress allowlist. Wikipedia is still a Forge trick.

That is the comparison you take to work:

| | Forge agent (Lab 6) | Studio agent (this lab) |
|---|---|---|
| Where you build it | `manifest.yml` and functions | Rovo Studio in the browser |
| What it can do | **Your** actions | Jira, Confluence, and the tools Studio offers |
| Egress | Hosts you declare | Not your `fetch` allowlist |
| How work starts | Someone chats it, or you assign it | Same: assign it like a human |
| What you show Monday | A deployed app | A specialist that exists on the site |

The ticket does not care which column you used. **`assign-to-agent`** still means ready. You still pick the worker with the assignee field.

## What you are not writing

More files in `meeting-pipeline`. If you open `src/` in this lab, you are in the wrong half of the day.

You are also not replacing Lab 3. Studio does not parse the meeting on the Apps page. The pipeline still creates the work. Studio does the ticket.

## 1. Pick a real job

Stay on the developer site. Open the board. Find a ticket this pipeline created that has **`assign-to-agent`**. Prefer one you already moved to **Approved for Agent**, so Lab 5 already left a comment.

If you do not have that ticket, run the pipeline once, then hand off one agent-routed issue. Do not invent a homework ticket in another project. The story only lands if the work came from the meeting.

Write the issue key on a sticky note. You will assign your new agent to **that** key.

## 2. Open Studio

Rovo has to be available on the site. If Studio is missing on the provisioned developer site, use the shared workshop site the instructor gives you. Do not spend thirty minutes hunting a menu that IT turned off. That is Setup energy, and we already paid that tax.

Open **Rovo Studio** (Agents, Studio, or Create agent, depending on what the site is showing today). Create a **new agent**. Name it like a teammate, not like a feature.

Good: `Meeting research`. Bad: `AI Helper 3`. You are about to assign this the way you assign Priya. Priya is not named `AI Helper 3`.

## 3. Write a specialist, not a company

The instructions are the job description. Keep them narrower than Lab 6.

Tell it:

- You work **Jira tickets** that are labeled `assign-to-agent`.
- You read the issue first. You do not invent a summary that is nicer than the ticket.
- You write findings, risks, and a recommendation on that ticket (comment) or on a Confluence page if the tools allow it.
- You are **one** specialist. You do not create five new epics. You do not rewrite the pipeline. You do not claim you fetched a URL unless a tool result says you did.
- Implementation tickets are not your job. If Sarah owns a hotfix, you leave it alone.

If you paste the entire Meeting Pipeline prompt in here, you have cloned Lab 6 in a worse editor. The point of Studio is a **narrow** worker you would actually assign.

## 4. Give it knowledge and tools, not your hopes

Turn on the Jira tools so it can read and comment on the issue. Turn on Confluence if you want the write-up next to the plan of record from Lab 4.

If Studio lets you attach knowledge, point it at the space you set in Lab 0, or at the plan of record page this job already created. That is the meeting's system of record. A random public URL is not.

Do not chase Wikipedia here. That fetch is Forge. If you need it, assign **Meeting Pipeline** from Lab 6 instead. Different worker. Same ticket. That sentence is the demo you take to work.

## 5. Assign it like a human

Open the sticky-note issue. In the **assignee** field, pick **your Studio agent**.

Stay on the ticket. Watch. You want a comment, a transition, or a page link that a human could have left. If nothing happens, start a chat with that agent **on the issue** and tell it to work the ticket it is assigned. Manual chat is the fallback. It is not a failure. Labs die when people pretend Automation is required for the first win.

The Forge comment from Lab 5 should already be there. Your Studio agent is answering that comment, not replacing the pipeline.

## 6. Optional: Automation so you can walk away

If the room has time, add a Jira Automation rule so the next handoff starts this agent without a chat.

1. **Trigger:** work item transitioned to **Approved for Agent**.
2. **Condition:** `labels = assign-to-agent`.
3. **Action:** assign (or start) **your Studio agent**, not Meeting Pipeline, not "any agent."

That rule is how you show the Monday story: the board is the router. You approve. A specialist starts. You did not open a sidebar and remember to paste the key.

If Automation is locked down on the site, skip it and tell the room why. A working assign-and-chat is worth more than a rule you cannot save.

## 7. What you say at work

You do not say "we built an AI." You say this:

A meeting lands in Jira as tickets. Some stay with people. Some are labeled for an agent. Approving that ticket starts a job. **We staff the job in Studio**, the same way we staff Sarah. If we need a fetch the platform will not allow, we use a Forge agent with declared egress. The ticket never changes.

If they ask which half to copy first, send them to Studio. If they ask how the tickets got there, send them to the Forge app.

## Check it with MCP

> Get Jira issue YOUR-AGENT-KEY. Who is the assignee? What is the latest comment?

You want your Studio agent on the assignee field, and new work on the ticket that did not come from you typing in Jira.

## You are done when

Your Studio agent exists, it has a name a human would use, and it has done work on a real `assign-to-agent` ticket this pipeline created. You can explain Forge vs Studio in one table without opening `src/`.

## Why we stop here

Half A is the system that keeps going after the request returns. Half B is the teammate you can make in a browser and take back to a team that does not want a manifest.

The ticket was the bridge the whole day. You just walked across it.

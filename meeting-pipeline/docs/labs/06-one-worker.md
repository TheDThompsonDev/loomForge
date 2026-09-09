# Lab 6: One worker, not the pipeline

The ticket is ready. Someone has to do the research. Today that someone can be **this** Forge-powered Rovo agent.

It is not the only someone. Copilot can take the same issue. A Studio agent can take it. If you build this lab like the agent *is* the product, you will fight Half B for the rest of the afternoon.

## The belief we are killing

**"Studio agents and Forge agents are the same, and retries are harmless."**

Studio agents get Atlassian's tools. They cannot declare egress. Forge agents get **your** functions. Wikipedia is a 403 until you list the host. That is the extra.

Publish has to remember the page. If you do not, a retry writes a second Confluence doc and the ticket grows a family.

## Why we do it this way

**`asUser()`** for load and publish. The person in the chat owns the page and can see the issue. The queue was the app. The chat is a human.

Actions are Forge functions with declared inputs. `actionVerb` GET versus CREATE versus TRIGGER is you telling Rovo what kind of thing this is. It is not decoration.

Parse still lives in the pipeline. If this agent captures a meeting, it should send notes to `submit-transcript` **without** inventing an `items` array. Same `createPipelineJob` spine. Two doors. One product. If it passes a pre-split list, Forge LLM never runs.

## What you are not changing

Do not start the agent from the Lab 5 trigger. The job is already ready. This lab is how *this* worker picks it up. Do not paste a second `rovo:agent` block on top of the one that is already here.

The prompt lives in `manifest.yml`. Read it. Notice it says send notes to `submit-transcript` and **do not invent a work-item array**. Notice it says **one assignable agent, not the only one**. Notice it says never claim a fetch or a page unless the tool result says so. That is you protecting the room from a confident liar.

## 1. The agent is already in the manifest

Open **`manifest.yml`**. Find `rovo:agent`, the four `action` modules, and `permissions.external.fetch.backend`.

If you want the YAML in one place without hunting the file, [snippets/rovo-modules.yml](snippets/rovo-modules.yml) is the same block.

Undeclared hosts fail as **HTTP 403**, not as a maybe. `developer.atlassian.com`, `support.atlassian.com`, `en.wikipedia.org`, and `www.wikipedia.org` are listed because this worker fetches them. Studio cannot get that sentence.

## 2. Load the issue as the person in the chat

Open **`src/pipeline/loadIssue.js`**.

```js
const response = await api.asUser().requestJira(
  route`/rest/api/3/issue/${issueKey}?fields=summary,description,status,labels`
);
```

If Jira says 404, that user cannot see it, or it does not exist. The code says that. It does not say "Forge failed." `adfToText` flattens the description. The agent needs words, not a document tree.

## 3. Fetch is a privilege

Open **`src/pipeline/fetchSource.js`**. Only **https**. Only hosts in `FETCH_HOSTS`. Time out. Cap the size. If the status is 403, the error says **Forge blocked this host** and tells them to declare it. That sentence is the lab.

Do not fetch in the trigger. Do not fetch as the app on behalf of a chat that did not ask. This is an action the person invoked.

## 4. Publish as the user, remember first

Open **`src/pipeline/publishResearch.js`**. If `storage.getResearch(issueKey)` already has a `pageUrl`, return it. That is the retry.

The POST is **`asUser().requestConfluence`**. Same page API as Lab 4, different principal. The write-up should show up as the person in the chat.

**Save the research record, then comment.** If you comment first and die, a retry creates a second page. If you save first, a retry returns the same URL. Same idea as ticket checkpoints. Different shelf in KVS.

`commentIssue` with `asUser: true` so the comment matches the page author.

## 5. Actions are thin wrappers

Open **`src/actions.js`**. Four functions, none of them clever.

- **`submitTranscript`**: validate, `createPipelineJob`, tell them how many items are `assign-to-agent`. Same spine as the page.
- **`getJobStatus`**: read the job, plus any research and handoff records. Report. Do not create.
- **`loadResearchContext`**: `loadIssue`, optional `fetchSource`. Then tell the model to synthesize, not to pretend.
- **`publishResearchDoc`**: validate title and findings, call `publishResearch`.

If an `asUser` call needs auth, `asUserError` already has the sentence.

## 6. Use the worker

Open an **`assign-to-agent`** ticket you already handed off. Chat with **Meeting Pipeline**. Ask it to research the issue. If you have a Wikipedia URL on the allowlist, pass it. Then ask it to publish.

You should get a Confluence page that is yours, a comment on the ticket, and a second publish that does not clone the page.

Then say this out loud: Copilot could have been the assignee instead. The pipeline would not change.

## Check it with MCP

> Get Jira issue YOUR-AGENT-KEY. Is there a research comment with a Confluence link? Search Confluence for that title. If I ask again, is there still only one page?

Two pages means publish did not persist before the comment.

## You are done when

This agent can load a ticket, optionally fetch a declared host, and publish once. The Apps page still parses with Forge LLM. The trigger still does not pick a worker.

## Why we stop here

Half A is the pipeline. You can paste a meeting, get tickets, get a plan of record, mark agent work, and let one Forge agent do a ticket.

**[Lab 7](07-studio.md)** is Rovo Studio. You build a specialist in the browser, assign it like a human, and walk out with something you can show at work on Monday. Not more files in this repo.

The ticket was the whole point.

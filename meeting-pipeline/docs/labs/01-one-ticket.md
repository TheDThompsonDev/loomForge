# Lab 1: Who creates the ticket

Lab 0 gave you a door. `invoke` left the iframe. The resolver said yes. Somebody still has to talk to Jira.

The first Forge app everyone writes puts `api.asUser().requestJira()` **in the resolver**. You click, you wait, a ticket shows up with your name on it. That app is honest. It is also the wrong architecture for a meeting. This clone already moved create onto a worker. Today we open the files and learn **who** is allowed to call Jira, and why that word changes.

## The belief we are killing

**"asUser and asApp are style. Pick one and stay consistent."**

Same methods. Different **who**. If you treat them as a lint rule, you will call Jira as a user who is not there, or write a page as an app and wonder why it never shows up in your recent docs.

## Why we do it this way

The person who clicked is still here **only** while the resolver is running. The worker that creates tickets has **no user**. `asApp()` is not a preference. It is the only principal left.

Chat is the opposite. Lab 6 loads the issue as the person talking. `asUser()` is how that page shows up as them.

We start with one messy ticket in our heads because that is the honest first product: prove Jira will take work from this app at all. Fan-out is Lab 3. The queue is Lab 2. Identity is today.

## What you are not changing

Do not move create back into the resolver "to feel the wait." Do not swap `asApp` to `asUser` on the worker to see what breaks on stage. Open the files. Run the app. Look at the reporter.

## 1. Run it if you have not

Stay on **Apps → Meeting Pipeline**. **Load sample transcript**. Run.

Watch the timeline leave Queued and print issue keys. Open one of those issues. Look at **reporter**. It should be the **app**, not you. That is the sentence this lab exists to make real.

If Lab 0 already produced tickets, open one of those. Same lesson. You do not need a second meeting unless you want one.

## 2. The resolver still does not call Jira

Open **`src/resolvers/page.js`**. `submitMeeting` validates, then calls `createPipelineJob`, then returns `{ ok: true, jobId }`.

`invoke` will hand you whatever the form sent. Trust is not a strategy. **`validateIngestPayload`** is the gate. The web trigger and the Rovo agent hit this same shape later. One gate. Every door.

`getJob` only reads. If you start creating tickets in `getJob`, polling becomes a ticket factory, and the room will invent a new religion. Read. Return. Stop.

`route` in the pipeline files is how Forge builds a Jira URL so the platform can attach the right scopes. Plain string concat is how you get a mystery 401 later.

## 3. Create lives here, as the app

Open **`src/pipeline/createTicket.js`**.

```js
const response = await api.asApp().requestJira(route`/rest/api/3/issue`, {
```

Same `requestJira` you would have put in the resolver. The word that matters is **`asApp()`**.

If this POST lived in `submitMeeting` as `asUser()`, the ticket would look like you made it, because you did. That is the first app. Put that on a sticky note. The second this create moved off the click, that user was gone.

`JIRA_PROJECT_KEY` is the variable from Lab 0. `buildAdfDescription` is why Jira descriptions are a tree instead of a string. Glance at it. Do not rewrite it.

`alreadyCreated` is a checkpoint. Queues retry. Lab 2 will make you care about that. Today, notice it exists so one meeting does not become two of the same ticket.

## 4. asUser is still in this repo

Open **`src/pipeline/loadIssue.js`**. That GET is `asUser()`. The person in the chat has to be able to see the issue.

Two principals, one app, on purpose. Worker writes as the app. Chat reads as the human. If you "standardize" them, one of those stories dies.

## Check it with MCP

If [Atlassian MCP](../MCP.md) is connected, stay in Cursor:

> Get Jira issue YOURKEY-123 and tell me the reporter and whether it is labeled meeting-pipeline.

The reporter should be the **app**. If you see yourself, create is not running where we think it is.

## You are done when

You can point at `createTicket.js` and say **app**. You can point at `loadIssue.js` and say **user**. You have opened a ticket this pipeline created and confirmed the reporter.

It may still be several tickets from one standup. We are not unpacking the model yet. We are proving Jira will listen, and we know who spoke.

## Why we stop here

Identity first, then timing. Lab 2 is why the button does not wait for that POST.

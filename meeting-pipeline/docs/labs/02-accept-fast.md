# Lab 2: Accept fast

Lab 1 showed you who talks to Jira. The ticket's reporter is the app because create runs on a worker with no user.

The other half of that move is **when**. If create stayed in the resolver, the button would sit on Submitting while Jira wrote the issue. If the tab closed, nothing would still be creating. Today we open the queue.

## The belief we are killing

**"The button should wait until Jira is done. That is how I know it worked."**

That is how every first app feels safe. It is also how you teach the user that Forge is a spinner. The timeline already knows how to poll. Let it do its job.

## Why we do it this way

The resolver says yes in milliseconds. The **meeting lives in KVS**. The queue carries **`{ jobId }`**, not the transcript.

Forge async events are size-capped. If you put the whole standup on the event, you will learn that the hard way in front of people. A pointer is the decision. Storage is the filing cabinet.

## What you are not changing

Leave the page chrome alone. Do not put the transcript on the event body "so it is simpler." Do not push before you write.

## 1. Watch the button, not the board

**Load sample transcript**. Run. **Watch the button.** It should come back fast. The timeline sits on **Queued**, then moves through **Parse the meeting**, then shows issue keys.

That pause you do **not** feel on the button is the thing a first app would have stolen from you. We stole it on purpose.

## 2. The queue is already declared

Open **`manifest.yml`**. Find `consumer` and the `pipeline-worker` function. The `queue:` name must match `Queue({ key })` in code. If they drift, you push into a hole and wonder why life is empty.

`timeoutSeconds: 120` is there because Lab 3 is about to ask a model. A 25 second default is how you fail in public.

## 3. Save the meeting, push a pointer

Open **`src/service.js`**. This function is the spine. The page, the web trigger, and Rovo all call it.

```js
await storage.saveJob(jobId, { status: "queued", /* meeting fields */ });
await pipelineQueue.push({ body: { jobId } });
return { jobId };
```

**Storage first, then the push.** If you push first and the write fails, a worker wakes up looking for a job that does not exist. If you write and never push, the timeline sits on Queued forever and you will start checking wifi. Order matters.

The event body is `{ jobId }`. Not the notes. Not the attendees. The notes already live under `job:`.

Open **`src/storage.js`** if you want to see how thin that cabinet is. One value per key. Jobs, handoffs, and research pages each get a shelf.

## 4. The resolver stays boring

Open **`src/resolvers/page.js`** again. `submitMeeting` validates, calls `createPipelineJob`, returns `{ jobId }`. That is the whole click.

If create were still in this file, you would have a slow button **and** a queue that creates a second ticket. Do not collect both.

`getJob` stays a read. The worker changes `status` from `queued` to `creating-tickets` to `done`. The timeline you already have moves by itself.

## 5. The worker is the one who waits

Open **`src/index.js`**. `processPipelineJob` reads the job. If it is missing, it logs and stops. Then it creates tickets through `createTicket.js` as the **app**.

Before each POST it looks at `job.checkpoint.createdKeys`. If that index already has a key, it skips. After a successful create, it writes the key back.

Queues retry. If you do not remember the issue key, the room gets two tickets for one meeting and someone will joke that the pipeline is "highly available."

## 6. The machine door is the same spine

Optional. Open the `webtrigger` module in the manifest and `handleIngest` in `index.js`. It validates, calls `createPipelineJob`, and returns 202. Same spine. No second REST API.

```bash
forge webtrigger
```

That prints a URL. `demo/send-transcript.sh` can hit it later if you want a scripted door. The queue is still the point.

## Check it with MCP

> Get Jira issue YOURKEY-123 and tell me the reporter and whether it is labeled meeting-pipeline.

The reporter should be the **app**, not you. That is `asApp()` on the worker. Combined with a fast button, that is this lab.

## You are done when

You can point at `service.js` and say: write the meeting, push a pointer, return. You can point at `processPipelineJob` and say: that is who waits on Jira.

## Why we stop here

You still have a standup that wants to be several tickets. Lab 3 is the model that splits the notes. This queue is why the button does not wait for Claude.

# Lab 3: Parse, then fan-out

Lab 2 made the button fast. A meeting is still not one grocery bag. Sarah's tax cache, Marcus's hotfix, and Priya's rate limit are not the same job. Thursday still cannot tell who owns what.

Forge LLM parses the meeting. Your code still owns Jira. That split is the product.

## The belief we are killing

**"The chat agent is how you parse a meeting."**

Rovo is great. The Apps page has no chat. The web trigger has no chat. If parse lives in a conversation, "paste notes, several tickets appear" is a lie you tell from the stage.

The model returns JSON. **`createTicket.js`** writes issues. If you let the model call Jira, you will spend the rest of the day arguing with a summary that almost rhymes.

## Why we do it this way

One `@forge/llm` **`chat()`** on the **consumer**. The model is slow. That is why Lab 2 exists. The timeline can show a splitting stage while the button is already free.

`route: "agent"` becomes the label **`assign-to-agent`**. A label is something any worker and any Automation rule can see. A custom field is a workshop in a hole. Subtasks are a graph nobody wants to filter.

If the model fails, one human ticket covering the meeting, plus `splitError` on the job. **Load sample transcript** still pastes notes only. It does not send `fixtures/work-items.json`. That file is for `demo/send-transcript.sh` and `npm run check`. If you pass a real `items` array, `needsLlmSplit` is false and `chat()` does not run.

## What you are not changing

Do not add a second model that writes Confluence prose. The plan of record is Lab 4, and it is composed from the items you already have. Do not wire the load button to `fixtures/work-items.json`. That skips the lesson.

## 1. Feel the split, not the bag

If you already ran the pipeline in Lab 0, open those issues. You should see **several** keys, not one transcript dump. At least one should carry **`assign-to-agent`**.

If you only ever got one ticket and an error on the timeline, the model failed and the fallback did its job. Run again. If it fails twice, we still finish the day with the grocery bag. That is allowed. Inventing tickets to save the demo is not.

## 2. The LLM is a module, not a key in `.env`

Open **`manifest.yml`**. Find `modules.llm`. Adding that module is a **major version**. Admins have to approve it. In this room you are the admin. That friction is the lesson: this is Atlassian-hosted AI, not a secret you hid on the laptop.

`package.json` has `@forge/llm`. The module without the package fails lint. The package without the module fails at runtime. Both have to be there.

## 3. Ask for work items, not a poem

Open **`src/pipeline/splitMeeting.js`**.

```js
const { chat } = require("@forge/llm");

const response = await chat({
  model: "claude-sonnet-4-6",
  messages: [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Title: ${meetingTitle}\nAttendees: ${attendees}\n\n${transcript}` },
  ],
});
```

The system prompt wants a JSON array of `{ summary, detail, owner, route }` where `route` is `"human"` or `"agent"`.

**Research, investigation, recommendation:** `agent`. **Implementation with a named owner:** `human`. Cap it. Eight items is plenty. A standup is not an epic generator.

The user message is the title, attendees, and notes. That is the whole input. Do not also send your hopes and dreams.

`llmText.js` unwraps markdown fences and reads `choices[0].message.content`. It lives in its own file so `npm run check` can run on Node without loading `@forge/llm` (that package throws `Forge runtime not found` outside Forge). That is a boring reason and a real one.

When the array comes back, `parseItems` in `validate.js` checks it: summary required, route must be `human` or `agent`. If parse fails or the model errors, return `{ ok: false, error }`. The consumer falls back. Do not invent tickets.

## 4. Parse on the worker, not in the resolver

Open **`src/index.js`**. After the job loads, `needsLlmSplit` asks: do we only have the default one-item bag (one human item whose detail is the whole transcript)? If yes, and `checkpoint.splitDone` is false, call `splitMeeting`.

Save the items onto the job **before** you create anything. If the worker retries, you do not want a second `chat()` that returns a different five tickets and then double-creates.

If split fails, keep the single human item, set `checkpoint.splitError` so the timeline can tell the truth, and continue. The room still gets a ticket. The room does not get a mystery.

## 5. One ticket per item, label the agent ones

The create loop is a loop for real.

```js
for (let index = 0; index < items.length; index += 1) {
  const ticket = await createTicket({
    meeting,
    item: items[index],
    jobId,
    alreadyCreated: checkpoint.createdKeys[index],
  });
  checkpoint.createdKeys[index] = ticket.issueKey;
}
```

In **`createTicket.js`**, every issue gets `meeting-pipeline` and `needs-review`. If `item.route === "agent"`, it also gets **`assign-to-agent`**.

That label is the contract for Labs 5 and 6. It is not a vibe. It is how the trigger knows which tickets are jobs for an agent, and which ones stay with Sarah.

## Check it with MCP

> Search Jira for issues in project YOURKEY labeled meeting-pipeline, created in the last hour. Which ones also have assign-to-agent? List keys and summaries.

You want more than one issue, and at least one agent-routed key. If you only get the grocery bag ticket, split did not run or the model failed.

## You are done when

One messy meeting became several tickets. Some are human. Some are labeled for an agent. The button did not wait for the model. The model did not wait in a chat sidebar.

## Why we stop here

The board finally looks like the call. If the Confluence box was checked, a plan of record may already exist. Lab 4 is why that page is composed, not generated, and why it is written as the app. Lab 5 is the column that means "this one is a job."

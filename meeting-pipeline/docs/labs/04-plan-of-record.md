# Lab 4: Plan of record

The board has tickets. Six months from now someone will ask why tax caching was P1, and a Slack search is a bad answer. The plan of record is the home. If you already ran with the box checked, you already have one. Today we open how it got there.

The checkbox on the form is already there: **Also write a plan of record to Confluence.** Today we open the write.

## The belief we are killing

**"The app is me. A page is a snapshot of the meeting."**

The worker is still **`asApp()`**. There is still no user. If you write this page as you, it will show up under your recent pages and people will think you typed it. You did not. The pipeline did.

A static list of issue keys dies the moment a ticket moves. Live Jira macros stay honest. The doc is a window, not minutes.

## Why we do it this way

Parse already happened. We do not call a second LLM to write executive prose. **`planOfRecord.js`** composes sections from the items and tickets you have: summary, context, decisions, action plan, risks, deferred.

That is a product decision. Deterministic docs you can teach. Surprise essays you cannot.

The write is optional. Tickets still matter if Confluence is having a day. If the page fails, save `docError` and leave the issues alone.

## What you are not changing

The storage HTML. The info panel. The `jira` macro tags. Glance at `planOfRecord.js`. Do not restyle Confluence in a flagship lab.

## 1. The box is already on the form

The checkbox label is **Also write a plan of record to Confluence.** **Load sample transcript** checks it for you. If you already ran from that button in Lab 0, you may already have a page. Open it. If you ran with the box off, check it and run again.

`generateDoc` is a flag on the job. The worker only writes when that flag is true and `checkpoint.confluencePage` is empty.

## 2. Write the page as the app

Open **`src/pipeline/createMeetingPage.js`**. It finds the space, joins a URL, and POSTs.

```js
const response = await api.asApp().requestConfluence(route`/wiki/api/v2/pages`, {
```

**`asApp()`**. Same reason as the tickets. `composePlanOfRecord` builds `doc` first. `CONFLUENCE_SPACE_KEY` is the variable from Lab 0. If it is missing, you get a sentence a human can read, not a stack trace.

Open **`src/pipeline/planOfRecord.js`** and look at the action plan. Those `jira` macros are why we wait until tickets exist. Do not write the page before the create loop. You would publish a plan of record with no cards.

## 3. The worker calls it after tickets

Open **`src/index.js`** again. After the create loop, if `job.generateDoc` is true and `checkpoint.confluencePage` is empty:

1. Status becomes `writing-doc` so the timeline moves.
2. `createMeetingPage` runs.
3. The page lands on the checkpoint.
4. If it throws, `checkpoint.docError` is set and the function keeps going. Tickets stay.

The page is in its own try. A Confluence 403 should not fail the Jira work. The meeting already became tickets. The page is the extra.

## 4. Put the link where people actually look

Nobody hunts for an `asApp` page under their own profile. Open the comment helper used after the page lands. **`commentIssue`** writes the URL onto each ticket. `asUser: false` means the app comments. Same principal. Same story.

## 5. Prove the window

When the timeline says the page is published, open it. Then move one of the tickets on the board, refresh the Confluence page, and watch the card change. That is the window.

If the page fails, the timeline should show a warning and the tickets should still be there. That is success too. We did not couple the meeting to a wiki outage.

## Check it with MCP

> Search Confluence on my developer site for pages titled plan of record created today. Then get Jira issue YOURKEY-123 and tell me if there is a comment with a wiki link.

You should get a page and a comment. If the tickets exist and the page does not, read `docError` on the job. That is still a pass for Jira.

## You are done when

Tickets exist either way. With the box checked, a plan of record exists, the tickets are live cards, and each issue has a comment that can find the page.

## Why we stop here

The meeting has a board and a document. Agent-routed tickets still sit in Review like everyone else. Lab 5 is the column that means "this one is a job."

# Lab 0: The front door

You know this meeting. Checkout is slow, Android is crashing, and somebody should own the push rate limit. Everybody nods. Somebody says they will send the recap. If good intentions created tickets, your backlog would be a public company!

Thursday shows up and the recap is a Slack thread, a doc called `notes-final-v2`, and three different memories of who owns tax caching. The board does not know the call happened. You are the person who stays after, copying sentences into Jira by hand, or you are the person waiting on tickets that never land.

You did not forget the meeting. The meeting forgot to become tickets, which is worse, because now it is your problem.

**That is the job this app is for.** Notes go in. Work shows up on the board. Some of it stays with people. Some of it is ready for an agent. You already live in Jira. The pipeline should live there too.

You cloned the working app. The door is already built. Today we **deploy** it onto your developer site and we learn why this page is not a website. Staring at `index.html` in the editor does not count.

**If [Setup](../SETUP.md) is not done, go back.** We do not deploy from a laptop that cannot log into Forge.

## 1. This clone is not your app yet

The `app.id` in `manifest.yml` belongs to the instructor tree. If you deploy with that id, you are trying to ship someone else's app. **Register your own.**

```bash
npm install
npm run build:ui
forge register
```

`forge register` prints an app id. **Paste that id** into `manifest.yml` under `app.id`, then:

```bash
forge deploy
forge install
```

Install it on **Jira**, on the **developer site** from Setup. When the CLI asks for a site URL, that is the one you provisioned, not work Jira. If it offers **Confluence** too, install that now so we are not coming back later.

Then set the variables **now**, while the CLI is already in your hands.

Open the developer site. Pick a Jira project and copy its **key** (the prefix on issues, like `DEV` or `KAN`). Open Confluence, pick a space, and copy its **space key**. Do not invent `MEET`. Use what is actually on your site.

```bash
forge variables set JIRA_PROJECT_KEY <your-project-key>
forge variables set CONFLUENCE_SPACE_KEY <your-space-key>
forge variables set AGENT_HANDOFF_STATUS "Approved for Agent"
```

That last one matches the column we will use when an agent-routed ticket is ready. Set it now so the name is not a surprise in Lab 5.

Open that site and go to **Apps → Meeting Pipeline**. You should see the form. That is the view of the app, attached to the project. The rest of the day happens on that live page, not in a browser tab pointed at localhost.

## The belief we are killing

You just opened a form **inside Jira**. It has fields and a button. Every app you have shipped at work taught you what happens next: click, `fetch`, talk to the API, done.

That instinct is correct for a website. It is how you would build this on a Friday if nobody said the word Forge. It is also how you lose twenty minutes staring at Network tab while Jira ignores you.

**The page is not allowed to call Jira.** Not because you wrote the fetch wrong. Because this is not your server, and that button does not get the user's Jira session.

## Why that is wrong

Custom UI is static files in an **iframe**, and that iframe does not have the user's Jira session the way your laptop does. `fetch` to Jira dies. `requestJira` **does not exist** in the browser.

The page can talk to **your function**, and your function is what talks to Jira.

That hop is `@forge/bridge` `invoke`. The function lives in a **resolver**. That pair is Custom UI in Forge, and the stylesheet is not. I will say this once with love: if you start tweaking card radius, we have lost the plot.

We picked Custom UI because this console has to **poll** and paint a **timeline**. UI Kit is the default for Forge UI. This page is the exception.

## 2. Open the door that is already here

Open **`src/console/main.js`**. Find the submit handler. The payload is just form fields. The line that leaves the iframe is:

```js
const result = await invoke("submitMeeting", payload);
```

`watchJob` polls with `invoke("getJob", { jobId })`. **`invoke` is not `fetch`.** The string `"submitMeeting"` must match a function in the resolver. If the names drift, the page fails and Jira never hears about it.

Open **`src/resolvers/page.js`**. The `Resolver` import uses `.default`. It looks weird. **Do not "fix" it.** That is the correct import.

`submitMeeting` validates, then calls `createPipelineJob`. It does **not** call Jira. That is the door: accept a job id, let the page poll. Jira happens later, on a worker. We will open that worker in Lab 2.

Glance at `index.html` and `style.css` if you want. Do not restyle them. Your taste is excellent. Save it for a side project named after a coffee.

## 3. See the door work

1. Stay on **Apps → Meeting Pipeline**.
2. Hit **Load sample transcript**. Title, attendees, and notes should appear so nobody in this room is typing "Sarah said the tax vendor is slow." That button also checks the Confluence box. It does **not** inject a pre-split ticket list. Forge LLM still has to parse.
3. Hit **Run the pipeline**.

This is a finished app, so the timeline will not sit on Queued forever. You should see **Parse the meeting**, then tickets, then a plan of record if the box stayed checked. That is the live product. The rest of the labs peel what you just watched. If you want to wait on tickets until Lab 1, do not hit Run yet. Most of you will hit Run. That is fine. We will still open the files.

Custom UI is a **build**. If you edit `src/console` later, `static/console` is what the iframe serves.

```bash
npm run build:ui
forge deploy
```

Skip the build, refresh forever, and you will start questioning your career.

## You are done when

The app is installed on **your** developer site, with **your** app id and **your** project key. You can open **Meeting Pipeline** and see the form. You can point at `invoke` in `main.js` and `submitMeeting` in `page.js` and say those two strings have to match.

## Why we stop here

If we start in `createTicket.js`, you will think Forge is a form that waits on `requestJira`. The door is the first lesson. Lab 1 is who is allowed to talk to Jira after the door closes.

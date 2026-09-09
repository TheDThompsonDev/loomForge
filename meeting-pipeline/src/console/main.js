import { invoke, router } from "@forge/bridge";

const STAGES = [
  { key: "queued", name: "Queued", detail: "Job accepted, waiting for a worker (async events queue)" },
  { key: "creating-tickets", name: "Create Jira tickets", detail: "requestJira() puts tickets in the Review column for human approval" },
  { key: "writing-doc", name: "Write Confluence page", detail: "requestConfluence() publishes the plan of record with live Jira cards" },
  { key: "done", name: "Done", detail: "" },
];

const form = document.getElementById("meeting-form");
const formErr = document.getElementById("form-err");
let pollTimer = null;
let useSampleItems = false;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formErr.textContent = "";
  const generateDoc = document.getElementById("f-doc").checked;
  const payload = {
    transcript: document.getElementById("f-transcript").value.trim(),
    meeting_title: document.getElementById("f-title").value.trim(),
    attendees: document.getElementById("f-attendees").value.split(",").map((a) => a.trim()).filter(Boolean),
    generate_doc: generateDoc,
    use_sample_items: useSampleItems,
  };

  const submitBtn = document.getElementById("f-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  try {
    const result = await invoke("submitMeeting", payload);
    if (!result.ok) {
      formErr.textContent = (result.errors || ["Submit failed"]).join("; ");
      return;
    }
    watchJob(result.jobId, generateDoc);
  } catch (err) {
    formErr.textContent = `Submit failed: ${err.message || err}`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Run the pipeline";
  }
});

document.getElementById("f-fixture").addEventListener("click", () => {
  document.getElementById("f-title").value = "Weekly platform sync";
  document.getElementById("f-attendees").value = "Danny, Sarah, Marcus, Priya, Jake";
  document.getElementById("f-transcript").value =
    "Danny: Alright, we're recording. Checkout latency first. Sarah?\n\n" +
    "Sarah: p95 is at 4.2 seconds since the tax change shipped, it's the synchronous vendor call. " +
    "If we cache the tax rates per region we fix both this and the payment worker timeouts. Two, three days.\n\n" +
    "Danny: Okay, Sarah takes the tax rate caching. Priority one, in review by Friday.\n\n" +
    "Marcus: Tuesday's release crashes on Android 13 when users rotate during checkout, about eight hundred " +
    "sessions a day. I can repro it now. I'll hotfix off the 4.1 tag, cherry-picked, not from the release branch.\n\n" +
    "Priya: And Jake can pair with me next week on the Android push registration flow, the provider migration " +
    "is half done. Also, we sent four marketing pushes in one hour last Thursday and opt-outs doubled.\n\n" +
    "Danny: Do the rate limit, but cap the scope: max pushes per user per day, config value, no UI. " +
    "Decisions on record: tax caching P1 with Sarah, Marcus hotfixes from the 4.1 tag, Jake pairs with Priya, " +
    "Priya builds the rate limit. I still think the rate limit treats a symptom, noting my dissent. Done.";
  document.getElementById("f-doc").checked = true;
  useSampleItems = true;
  formErr.textContent = "";
});

function watchJob(jobId, generateDoc) {
  clearInterval(pollTimer);
  renderTimeline({ status: "queued", generateDoc, tickets: [] }, jobId);
  pollTimer = setInterval(async () => {
    try {
      const result = await invoke("getJob", { jobId });
      if (!result?.ok || !result.job) return;
      renderTimeline(result.job, jobId);
      if (result.job.status === "done" || result.job.status === "failed") {
        clearInterval(pollTimer);
      }
    } catch {}
  }, 2000);
}

function renderTimeline(job, jobId) {
  const stages = STAGES.filter((s) => s.key !== "writing-doc" || job.generateDoc);
  const failed = job.status === "failed";
  const tickets = job.tickets || job.created || [];
  const anchor = failed ? job.failedAt || "queued" : job.status;
  let currentIndex = stages.findIndex((s) => s.key === anchor);
  if (currentIndex === -1) currentIndex = failed ? 0 : stages.length - 1;

  const html = stages
    .map((stage, i) => {
      let state = "pending";
      if (i < currentIndex) state = "done";
      else if (i === currentIndex) {
        if (failed) state = "failed";
        else state = job.status === "done" ? "done" : "active";
      }

      let detail = stage.detail;
      if (stage.key === "creating-tickets" && tickets.length) {
        detail =
          `Created ${tickets.length} ticket(s): ` +
          tickets
            .map((t) => `<a class="ticket-link" data-key="${esc(t.issueKey)}">${esc(t.issueKey)}</a>`)
            .join("");
      }
      if (stage.key === "writing-doc") {
        if (job.confluencePage?.pageUrl) {
          detail = `Published: <a class="page-link" data-href="${esc(job.confluencePage.pageUrl)}">${esc(job.confluencePage.title)}</a>`;
        } else if (job.docError) {
          detail = `<div class="warn-summary">Doc failed (tickets unaffected): ${esc(job.docError)}</div>`;
        }
      }
      if (stage.key === "done" && job.status === "done") {
        const pageBit = job.confluencePage?.pageUrl
          ? ` <a class="page-link" data-href="${esc(job.confluencePage.pageUrl)}">${esc(job.confluencePage.title)}</a>`
          : "";
        detail = `<div class="done-summary">${tickets.length} ticket(s) in Review.${pageBit}</div>`;
      }
      if (failed && state === "failed") detail = esc(job.error || "Failed. See forge logs for details.");

      return `<div class="step ${state}"><div class="dot"></div>
        <div class="body"><div class="name">${esc(stage.name)}</div>
        <div class="detail">${detail}</div></div></div>`;
    })
    .join("");

  document.getElementById("timeline").innerHTML =
    `<section class="card"><h2>Pipeline run <span class="run-id">${esc(jobId)}</span></h2>${html}</section>`;

  bindTicketLinks(document.getElementById("timeline"));
}

function openProductUrl(path) {
  try {
    router.open(path);
  } catch {
    window.open(path, "_blank");
  }
}

function bindTicketLinks(root) {
  root.querySelectorAll(".ticket-link[data-key]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      openProductUrl(`/browse/${el.dataset.key}`);
    });
  });
  root.querySelectorAll(".page-link[data-href]").forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      openProductUrl(el.dataset.href);
    });
  });
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

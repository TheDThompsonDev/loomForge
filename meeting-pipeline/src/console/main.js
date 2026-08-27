// Meeting Pipeline console, Custom UI (workshop concept: a static bundle
// inside the product, talking to backend functions through the resolver
// via @forge/bridge). Submits a meeting, then polls the job and animates
// the pipeline timeline as each stage completes.
import { invoke, router } from "@forge/bridge";

// Pipeline stages in display order, keyed by the job's status values.
const STAGES = [
  { key: "queued", name: "Queued", detail: "Job accepted, waiting for a worker (async events queue)" },
  { key: "extracting", name: "AI 1: Extract", detail: "Forge LLM reads the transcript for decisions and action items" },
  { key: "extracted", name: "Gate 1: Evidence check", detail: "Code verifies every item quotes the transcript verbatim; no receipts, no ticket" },
  { key: "enriching", name: "AI 2: Enrich + Gate 2", detail: "Org context added via Jira/Confluence search; the AI cannot change what already passed gate 1" },
  { key: "enriched", name: "Dedupe", detail: "Similar open tickets flagged for the reviewer, never auto-discarded" },
  { key: "creating-tickets", name: "Create Jira tickets", detail: "requestJira() puts tickets in the Review column for human approval" },
  { key: "writing-doc", name: "AI 3: Strategy doc", detail: "Synthesized Confluence page via requestConfluence(): decisions, dissent, risks, plan" },
  { key: "done", name: "Done", detail: "" },
];

const form = document.getElementById("meeting-form");
const formErr = document.getElementById("form-err");
let pollTimer = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formErr.textContent = "";
  const generateDoc = document.getElementById("f-doc").checked;
  const payload = {
    transcript: document.getElementById("f-transcript").value.trim(),
    meeting_title: document.getElementById("f-title").value.trim(),
    attendees: document.getElementById("f-attendees").value.split(",").map((a) => a.trim()).filter(Boolean),
    loom_url: document.getElementById("f-loom").value.trim() || undefined,
    generate_doc: generateDoc,
  };
  if (!payload.transcript) delete payload.transcript; // let the Loom fetch try

  const submitBtn = document.getElementById("f-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";
  try {
    const result = await invoke("submitMeeting", payload);
    if (!result.ok) {
      formErr.textContent = result.errors.join("; ");
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
});

function watchJob(jobId, generateDoc) {
  clearInterval(pollTimer);
  renderTimeline({ status: "queued", generateDoc, created: [], dropped: [] }, jobId);
  pollTimer = setInterval(async () => {
    try {
      const job = await invoke("getJob", { jobId });
      if (!job) return;
      renderTimeline(job, jobId);
      if (job.status === "done" || job.status === "failed") clearInterval(pollTimer);
    } catch {
      /* transient poll errors: keep trying */
    }
  }, 2500);
}

function renderTimeline(job, jobId) {
  const stages = STAGES.filter((s) => s.key !== "writing-doc" || job.generateDoc);
  const failed = job.status === "failed";
  // On failure, anchor to the stage that was running when the job died
  // (failedAt), so completed stages stay green, the dead one shows red,
  // and unreached stages stay pending.
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
      if (stage.key === "extracted" && job.dropped?.length) {
        detail += job.dropped
          .map(
            (d) =>
              `<div class="gate-drop">Dropped: "${esc(d.summary)}" (evidence quote not found in the transcript)</div>`
          )
          .join("");
      }
      if (stage.key === "creating-tickets" && job.created?.length) {
        detail =
          `Created ${job.created.length} ticket(s): ` +
          job.created
            .map((t) => `<a class="ticket-link" data-key="${esc(t.issueKey)}">${esc(t.issueKey)}</a>`)
            .join("");
      }
      if (stage.key === "writing-doc") {
        if (job.confluencePage) {
          detail = `Published: <a href="${esc(job.confluencePage.pageUrl)}" target="_blank" rel="noreferrer">${esc(job.confluencePage.title)}</a>`;
        } else if (job.docError) {
          detail = `Doc failed (tickets unaffected): ${esc(job.docError)}`;
        }
      }
      if (stage.key === "done" && job.status === "done") {
        detail = `<div class="done-summary">${job.created?.length || 0} ticket(s) in Review${job.confluencePage ? ", strategy doc published" : ""}${job.dropped?.length ? `, ${job.dropped.length} item(s) rejected by the evidence gate` : ""}.</div>`;
      }
      if (failed && state === "failed") detail = esc(job.error || "Failed. See forge logs for details.");

      return `<div class="step ${state}"><div class="dot"></div>
        <div class="body"><div class="name">${esc(stage.name)}</div>
        <div class="detail">${detail}</div></div></div>`;
    })
    .join("");

  document.getElementById("timeline").innerHTML =
    `<section class="card"><h2>Pipeline run <span class="run-id">${esc(jobId)}</span></h2>${html}</section>`;

  document.querySelectorAll(".ticket-link[data-key]").forEach((el) => {
    el.addEventListener("click", () => {
      try {
        router.open(`/browse/${el.dataset.key}`);
      } catch {
        window.open(`/browse/${el.dataset.key}`, "_blank");
      }
    });
  });
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Builds demo/console-preview/, the Custom UI console, viewable locally by
// double-click. @forge/bridge is swapped for a stub that simulates a full
// pipeline run (each poll advances one stage, including a gate rejection),
// so workshop attendees see the exact in-Jira experience without deploying.
//   npm run preview:console
const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const srcDir = path.join(root, "src", "console");
const outDir = path.join(root, "demo", "console-preview");

fs.mkdirSync(outDir, { recursive: true });

const stubPath = path.join(outDir, ".bridge-stub.mjs");
fs.writeFileSync(
  stubPath,
  `// Simulated pipeline run: each getJob poll advances one stage, so the
// timeline animates the way a real run does.
let generateDoc = false;
let polls = 0;
const STAGE_SEQUENCE = ["queued", "extracting", "extracted", "enriching", "enriched", "creating-tickets", "writing-doc", "done"];
function simulatedJob() {
  const stages = STAGE_SEQUENCE.filter((s) => s !== "writing-doc" || generateDoc);
  const status = stages[Math.min(polls, stages.length - 1)];
  const idx = stages.indexOf(status);
  const past = (s) => idx > stages.indexOf(s);
  return {
    status,
    meetingTitle: "Weekly platform sync (preview)",
    generateDoc,
    error: null,
    dropped: past("extracting")
      ? [{ summary: "Ship the Slack digest bot before Q3", evidence_quote: "We agreed the digest bot ships by Q3." }]
      : [],
    itemCount: past("extracting") ? 4 : null,
    created: past("enriched")
      ? [
          { issueKey: "MEET-101", summary: "Cache tax rates per region" },
          { issueKey: "MEET-102", summary: "Hotfix Android 13 rotation crash from the 4.1 tag" },
          { issueKey: "MEET-103", summary: "Server-side notification rate limit (config value, no UI)" },
        ]
      : [],
    failed: [],
    confluencePage:
      generateDoc && status === "done"
        ? { pageId: "12345", pageUrl: "#preview-only", title: "Checkout latency: plan of record (2026-08-27)" }
        : null,
    docError: null,
    updatedAt: new Date().toISOString(),
  };
}

export const invoke = async (name, payload) => {
  if (name === "submitMeeting") {
    generateDoc = Boolean(payload && payload.generate_doc);
    polls = 0;
    return { ok: true, jobId: "job-preview-000-demo" };
  }
  if (name === "getJob") {
    polls += 1;
    return simulatedJob();
  }
  throw new Error("unknown resolver: " + name);
};

export const router = {
  open: (url) => window.alert("Preview only. In Jira this opens " + url),
};
`
);

esbuild.buildSync({
  entryPoints: [path.join(srcDir, "main.js")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  alias: { "@forge/bridge": stubPath },
  outfile: path.join(outDir, "bundle.js"),
});

// Emit ONE self-contained html: CSS and JS inlined. A double-clicked file
// then renders correctly regardless of where it is copied or how it is
// opened; there is no stylesheet or script to lose.
const html = fs.readFileSync(path.join(srcDir, "index.html"), "utf8");
const css = fs.readFileSync(path.join(srcDir, "style.css"), "utf8");
const js = fs.readFileSync(path.join(outDir, "bundle.js"), "utf8");
const inlined = html
  .replace('<link rel="stylesheet" href="style.css">', `<style>\n${css}\n</style>`)
  .replace('<script src="bundle.js"></script>', `<script>\n${js}\n</script>`);
fs.writeFileSync(path.join(outDir, "index.html"), inlined, "utf8");
fs.rmSync(path.join(outDir, "bundle.js"));
fs.rmSync(stubPath);

console.log(`Built local console preview → ${path.relative(root, outDir)}\\index.html (single file, double-click to view)`);

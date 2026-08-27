# drift-lab (optional extra — not part of the core workshop)

This is the parked "Drift Mode" from an earlier iteration of the app: run
the same transcript N times with no guardrails vs N times through the gated
pipeline, store every run, and visualize how the ungated runs scatter (item
counts, invented owners/deadlines) while gated runs converge.

It was cut from the main app because it teaches a point about **AI
nondeterminism**, not about **Forge** — and this codebase's job is teaching
Forge. It's kept here because the measurement harness is genuinely useful
if you ever want to demonstrate *why* the schema/evidence gates exist,
with numbers instead of assertions.

Contents:

- `src/` — the drift runner, deterministic divergence metrics, and the
  comparison builder (imports paths assume it lives back under the app's
  `src/drift/`; re-wiring it also needs its queue/consumer/web-trigger
  branches restored — check this folder's files against git-less history in
  KEYNOTE-RUNBOOK.md for what was removed).
- `drift-viewer.html` / `drift-viewer-sample.html` — standalone dark-theme
  visualization; the `-sample` variant has fake data baked in and opens by
  double-click.
- `make-sample-data.js` — deterministic sample-data generator.
- `metrics.test.js` — the metric tests (ran under `npm test` when this was
  wired in).
- `KEYNOTE-RUNBOOK.md` — the old keynote runbook that used all this.

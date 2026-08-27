# CYC26 keynote runbook

Rule zero: **pre-run everything.** Every live moment has a pre-seeded
duplicate and a screenshot backup.

## T-minus 1 day (pre-seed)

- [ ] `forge deploy` to production environment; `forge install --upgrade` confirmed on the demo site
- [ ] Board columns + automation rules verified per [JIRA-SETUP.md](JIRA-SETUP.md)
- [ ] Run `demo/send-transcript.ps1 fixtures\real-meeting.txt` → confirm 4 tickets in Review ≤ 60s (acceptance #1)
- [ ] Run drift on the trap: `demo/send-transcript.ps1 fixtures\trap-meeting.txt -Drift -NakedRuns 20 -ShelledRuns 3`
- [ ] Open drift-viewer with the compare URL → confirm gallery renders 20 naked + 3 shelled (acceptance #2, #3)
- [ ] Confirm at least one naked run invented an owner/deadline for the trap (acceptance #4 raw material)
- [ ] Confirm shelled runs' `dropped_by_evidence_gate` fired at least once across runs, or seed it: the gate demo also works by showing the DLQ/log line from `forge logs`
- [ ] Walk one ticket end-to-end: approve → label `agent:…` → agent PR → PR Ready (acceptance #5)
- [ ] Screenshot EVERYTHING at each beat (backups). Store in `demo/screenshots/`
- [ ] Save a known-good drift `sessionId` and its compare URL in a note; the viewer remembers the last URL

## Stage sequence (suggested beats)

1. **The promise**: post `real-meeting.txt` live (or roll the pre-run). Tickets appear in Review with evidence quotes in the description. "The AI didn't get to touch Jira. Code did, after checking receipts."
2. **The manifest slide**: show the `permissions` section of `manifest.yml`. Four scopes. **No external egress.** "Everything you just saw — the model runs inside the platform. The manifest is the contract, and this is the entire permissions section." (acceptance #6 — the actions/tools section is the *capabilities* slide, a separate beat if you want it)
3. **The drift reveal**: drift-viewer, pre-loaded. Left panel: 20 naked runs, N distinct ticket sets, hallucinated owners on the trap transcript. Right panel: shelled runs, 1 ticket set, zero hallucinations survived. "Same model. Same transcript. The difference is the shell."
4. **The receipts**: open the trap ticket that names no owner. "It said 'somebody should' — so the field is null. The naked runs picked a name. Confidence is not evidence."
5. **The MCP beat**: from Claude, submit a transcript via the local MCP wrapper, then approve a ticket via the Atlassian Remote MCP Server (label + transition). "The whole pipeline is agent-addressable — and every mutation still goes through the same gates." (see docs/MCP.md for the setup and the optional Rovo-side variant)
6. **The handoff**: the approved ticket that became a PR, sitting in PR Ready. "Human approved it in, human merges it out. The agent did the middle."
7. **The bill**: token counts + latency from the viewer footer. "That demo cost N tokens and M seconds, and I can tell you that because the platform reports it per request."

## Acceptance criteria mapping (spec §11)

| # | Criterion | Where verified |
|---|---|---|
| 1 | Transcript → Review column ≤ 60s | pre-seed checklist |
| 2 | 20 naked runs stored + gallery + divergence metrics | drift-viewer / Drift Gallery |
| 3 | ≥3 shelled runs converge | drift-viewer right panel |
| 4 | Evidence gate rejects a hallucinated item | trap drift session; also `npm test` (deterministic proof) |
| 5 | One ticket end-to-end to PR Ready | pre-seed checklist |
| 6 | Manifest on one slide, nothing unexplained | manifest.yml (35 lines, zero egress) |
| 7 | Pre-seeded state + screenshot backups | this runbook |

## Failure modes, live

- Wi-Fi dies → save the compare JSON ahead of time (`curl "<compare-url>" > demo/backup-comparison.json`); the drift-viewer input accepts the raw JSON pasted directly, fully offline. Screenshots as the last resort.
- LLM 429s mid-demo → the pre-run drift session is already in storage; never re-run live.
- A naked run behaves (no hallucination) → you have 20; the metrics aggregate always shows the scatter.

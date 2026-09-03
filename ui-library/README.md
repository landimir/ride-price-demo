# Ride Price Mobile UI Flow Library

An internal, Mobbin-style visual record of the Ride Price portal: every mobile flow captured from
the working application at **390 × 844**, organised into sequential user journeys, with the action
that causes each transition, the branches, and the UX findings attached to the exact screen.

**Start here:** open [`master-flow/index.html`](master-flow/index.html) in a browser.

| Folder | What it holds |
|---|---|
| `current/<area>/NN-name.png` | The current capture, one numbered screenshot per meaningful step, grouped by product area |
| `master-flow/index.html` | The master visual flow — all flows left-to-right with actions, branches, issues, lightbox |
| `reports/flow-manifest.json` | Machine-readable flows: every screen with its screenshot, hash, action → next, branches, issues, automated checks |
| `master-flow/improvement-view.html` | The improvement system's companion page: per area, the original screenshots + existing comment cards + the deepened diagnosis, Mobbin reference direction, and the Ride Price adaptation |
| `reports/screen-improvement-matrix.json` | Hand-maintained source of truth for the improvement system — one area at a time; recommendations, owner directions/decisions, Mobbin patterns |
| `reports/ui-improvement-report.md` · `reports/opportunity-board.md` · `reports/mobbin-reference-summary.md` | Generated from the matrix by `tools/build-improvements.mjs` |
| `reports/ux-audit.md` | Findings by severity (Critical / Major / Minor / Observation) with screen and area to investigate |
| `reports/issues.json` | The audited findings (hand-maintained source for the audit and the master page) |
| `reports/changelog.md` | Per-version added / changed / removed flows and screens, new / resolved issues |
| `reports/library-summary.md` | Counts and the flow list for the current version |
| `reports/version.json` | Version number, capture time, app commit |
| `versions/vNNN/` | Every previous version, untouched (current + master-flow + reports + issues) |
| `issues/` | Supporting issue screenshots, when a finding needs a close-up |
| `tools/` | The capture system (see below) |

## Rules
- Mobile only. The viewport never changes between versions so screenshots compare.
- Screenshots are untouched captures. Nothing is redesigned, recopied or fixed while documenting —
  problems are recorded, not solved.
- The app's simulated flows run against the seeded demo data on a local static server in headless
  Chrome. No real data, no real sends, no destructive actions.

## Updating it
Tell Claude Code **"Update UI Screenshot Library"** (the repo skill `.claude/skills/update-ui-screenshot-library`),
or by hand:

```bash
node ride-price-ui-library/tools/update.mjs     # preserve previous version, recapture, build, changelog
```

then read the added/changed screenshots, edit `reports/issues.json`, and run
`node ride-price-ui-library/tools/build.mjs` again.

**The improvement system** (2026-08-23) sits beside the library: edit
`reports/screen-improvement-matrix.json` (one product area per review round,
owner decisions recorded as they land), then
`node ride-price-ui-library/tools/build-improvements.mjs` regenerates the
improvement view and its three reports. `tools/preview-improvements.mjs`
renders it headless for a visual check. Individual flows: `node ride-price-ui-library/tools/capture.mjs <flowId>` (each flow is stamped with the repo commit at capture time — `RP_COMMIT` from update.mjs, else `git rev-parse HEAD`). After touching the automated checks in `lib.mjs`, run `node ride-price-ui-library/tools/selfcheck.mjs`: it drives the overlap check over `tools/fixtures/overlap.html`, where text scrolled under a pinned dialog footer must NOT count and two texts drawn on top of each other must. It also proves the barcode fixture cache ignores anything captured the old way, and that no flow ships the same image twice — two byte-identical screenshots inside one flow mean a step did not advance, which is how v019 published “Both sides received” as a copy of the screen before it.

## How the tools work
`tools/flows.mjs` is the source of truth — a list of flows, each a list of steps with a `do(session)`
that drives the real app the way a user would (clicks, typing, photo uploads), the screen name,
the action that leads onward, and branch pointers (`flowId/stepKey`). `capture.mjs` walks them at
390 × 844 through the repo's own CDP harness (`harness/cdp.mjs`), screenshots each state (a modal
or open drawer at the viewport only; a page with a fixed bottom bar at the viewport plus a secondary
full-length `.scroll.png`; any other page taller than the phone full-length, capped at 3,200px —
never cropped), and runs automated visual checks (horizontal overflow, off-screen elements, clipped
text, text overlap, small touch targets). `build.mjs` renders the master page and reports from the
manifest plus the audited `issues.json`. `update.mjs` wraps it all with versioning and the changelog.

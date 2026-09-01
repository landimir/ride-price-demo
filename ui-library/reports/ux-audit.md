# Ride Price Mobile UI — UX Audit (v015)

Captured 2026-09-01T02:44:15.719Z · viewport 390×844 · app 37c6b9f7f4c949efb98ea0a75fd6f35d860763da

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 0 |
| Minor | 2 |
| Observation | 2 |

Severity scale: **Critical** — the user cannot complete the flow · **Major** — the flow continues but the experience is significantly impaired · **Minor** — polish / consistency · **Observation** — worth reviewing, not necessarily broken.

## Critical (0)

_None recorded._

## Major (0)

_None recorded._

## Minor (2)

### RP-UI-012 — Training Licenses & Registrations · Training Registrations

- **Screenshot:** `current/04-training-materials/02-training-registrations.png`
- **Issue:** The registration cards are print-sized (112mm wide) and wider than the phone; their right-hand side (SAMPLE overprint, amounts, expiry) is cut off in view with no visible scroll affordance.
- **Observation:** By recorded decision the props are never scaled (they must print at true size); on a phone the grid scrolls horizontally, but nothing says so.
- **Suggested area to investigate:** .props-grid horizontal scroll hint at ≤720px

### RP-UI-029 — All (app-wide) · Desking accessories, search fields, filter sheet

- **Screenshot:** `current/09-desking/02-pencil-finance.png`
- **Issue:** The touch floor is 40px for every control (owner, 2026-08-31), but harness/touchfloor.mjs audits only pressable controls — button, link, role=button. Extending it to native form fields measures 14 real shortfalls: the desking accessory checkbox rows at 20px (eight of them), the test-drive delivery-preference rows at 22, the inventory search field at 21 and the deals search field at 25, the .switch control at 46x26, the client-link demo option row at 30, and #mMaxPrice at 38.
- **Observation:** Found by widening the audit on 2026-08-31 and measured, not estimated. It was not restyled in that change: the job there was to implement the owner's ruling on the NUMBER, and lifting 14 form controls is a design change across desking, inventory search and the filter sheet that deserves its own review. The harness states the scope boundary at its selector rather than implying coverage it does not have.
- **Suggested area to investigate:** portal.css .opt-row, .switch, .m-search input, #dealSearch, #mMaxPrice

## Observation (2)

### RP-UI-022 — Finance Menu · Manager sign-off — Advisor view

- **Screenshot:** `current/14-finance-menu/01-signoff-gate-advisor.png`
- **Issue:** The Advisor's gate is a deliberate dead end — four statuses and the line "Waiting for Team Lead." — but it offers no next action at all. V3 removed the older note that told the reader to switch roles, so nothing on the screen connects the wait to the role control in the top bar.
- **Observation:** The role control is now a labelled pill ("Advisor" / "Team Lead"), which is a real improvement on the unlabelled segmented control this was first filed against. What remains is that a trainee reading the gate is not told where the handoff happens.
- **Suggested area to investigate:** menu route gate(), .fm-note copy

### RP-UI-023 — Home — Deals Queue & Navigation · My Deals (landing — Advisor)

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** No authentication exists: the portal opens straight on the floor queue, with the Advisor / Team Lead role sheet on the queue top bar standing in for identity.
- **Observation:** By design for a demo/training tool — documented here so the absence of a login flow is not read as missing documentation.
- **Suggested area to investigate:** n/a

## Automated checks per screen

The capture run measures each screen for horizontal overflow, elements beyond the viewport, clipped text, text overlap and small touch targets. Two thresholds are in play and they are not the same: this capture script flags anything under **36px**, while the touch floor itself is **40px for every control** (owner, 2026-08-31 — one number, no small-variant tier). So a target in the 36-39px band is reported only by the eye, and anything under 36px is caught by both. `harness/touchfloor.mjs` is what actually enforces the floor across every route — for pressable controls (`button`, links, `role=button`); native form fields sit outside its selector, and their measured shortfalls are RP-UI-029's finding, not this harness's coverage. These are hints that were reviewed by eye; the findings above are the reviewed result. Raw values live in `flow-manifest.json` under each screen's `checks`.

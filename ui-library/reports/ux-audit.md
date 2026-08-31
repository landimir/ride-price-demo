# Ride Price Mobile UI — UX Audit (v014)

Captured 2026-08-31T15:38:56.125Z · viewport 390×844 · app 5ad39ea0726b18e7f904c60bdd7214a0c0579821

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 0 |
| Minor | 3 |
| Observation | 2 |

Severity scale: **Critical** — the user cannot complete the flow · **Major** — the flow continues but the experience is significantly impaired · **Minor** — polish / consistency · **Observation** — worth reviewing, not necessarily broken.

## Critical (0)

_None recorded._

## Major (0)

_None recorded._

## Minor (3)

### RP-UI-005 — Discovery Session · Discovery — question 1

- **Screenshot:** `current/05-discovery/01-question-1.png`
- **Issue:** The deal crumb controls (Buyer, Jacket, and the screen's back/forward link) wrap into three rows on a phone, pushing the working area ~120px down. The same row appears on every deal screen (discovery, vehicles, test drive, trade, desking, agreement, credit, menu, print).
- **Observation:** Consistent, but it costs a sixth of the phone screen before the content starts. A single compact row (icon buttons, or the back link folded into the title) would recover it.
- **Suggested area to investigate:** dealTitle() crumb markup; .crumb-btn / #pageActions wrapping at ≤720px

### RP-UI-012 — Training Licenses & Registrations · Training Registrations

- **Screenshot:** `current/04-training-materials/02-training-registrations.png`
- **Issue:** The registration cards are print-sized (112mm wide) and wider than the phone; their right-hand side (SAMPLE overprint, amounts, expiry) is cut off in view with no visible scroll affordance.
- **Observation:** By recorded decision the props are never scaled (they must print at true size); on a phone the grid scrolls horizontally, but nothing says so.
- **Suggested area to investigate:** .props-grid horizontal scroll hint at ≤720px

### RP-UI-028 — All (app-wide) · Crumb bars, drawer navigation, props printables

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** ui-context documents TWO floors — buttons >=44px at <=720px, and >=40px only for small variants. The small-variant floor is now met everywhere (PR #59). The general floor is not: 23 ordinary controls sit at 40-43px, including the standard small button (.btn--sm) used across the crumb bars, the drawer's navigation rows at 42px, #drawerReset, the two props print buttons, and .dr-clientadd at 43 wide.
- **Observation:** Not a regression — this is the pre-existing scale of the app's small button, and it predates the touch-floor pass. Lifting it changes visual weight on many screens at once, so it is an owner decision rather than a bug fix. harness/touchfloor.mjs pins the count at 23: it may shrink, never grow, and a new member fails the run.
- **Suggested area to investigate:** portal.css .btn--sm, .drawer__nav a, #drawerReset, .dr-clientadd

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

The capture run measures each screen for horizontal overflow, elements beyond the viewport, clipped text, text overlap and small touch targets. Two thresholds are in play and they are not the same: the script flags anything under **36px**, while the audit holds small variants to a **40px** floor. So a target in the 36-39px band is reported only by the eye, and anything under 36px is caught by both. These are hints that were reviewed by eye; the findings above are the reviewed result. Raw values live in `flow-manifest.json` under each screen's `checks`.

# Ride Price Mobile UI — UX Audit (v013)

Captured 2026-08-31T03:00:32.356Z · viewport 390×844 · app 3e6afbbbc5788969846336be6db09ffa9334cd6d

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 0 |
| Minor | 5 |
| Observation | 2 |

Severity scale: **Critical** — the user cannot complete the flow · **Major** — the flow continues but the experience is significantly impaired · **Minor** — polish / consistency · **Observation** — worth reviewing, not necessarily broken.

## Critical (0)

_None recorded._

## Major (0)

_None recorded._

## Minor (5)

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

### RP-UI-015 — Snap All — burst capture · Three shots taken

- **Screenshot:** `current/18-snap-all/02-thumbs.png`
- **Issue:** The per-thumbnail remove controls (×) are 24×24px, under the phone touch floor (≥40px for small variants).
- **Observation:** Also 34px zoom / page buttons on the client review screen and the advisor document review.
- **Suggested area to investigate:** .sa-thumb__x, .dr-zoom button, .dr-pagetools button sizing at ≤720px

### RP-UI-024 — All (app-wide) · Customer identified (advisor)

- **Screenshot:** `current/02-customer-onboarding/09-remote-ready.png`
- **Issue:** The role pill in the master deal header (.m-rolebtn) is 65x35 to 82x35px — under the 40px small-variant touch floor the phone layout documents. Measured across the v013 capture set it appears on 8 of the 20 flows, on every master-canvas screen.
- **Observation:** Height only; the width is fine. It is the control that switches Advisor and Team Lead, so it is tapped constantly in training.
- **Suggested area to investigate:** portal.css .m-rolebtn

### RP-UI-025 — All (app-wide) · Add optional document

- **Screenshot:** `current/15-deal-jacket/06-add-optional.png`
- **Issue:** The master bottom sheet's close control (.m-close) is squeezed to 28x40 in the jacket and measures 30x34 to 34x34 elsewhere — under the 40px touch floor. Measured across the v013 capture set it appears on 8 of the 20 flows, in every master sheet — including the new Print full packet sheet.
- **Observation:** Not a trap — every sheet also dismisses on the scrim and on Escape — but it is a small target on a frequent control, and the jacket's long sheet titles squeeze it further.
- **Suggested area to investigate:** portal.css .m-sheettop / #jkSheet .m-close

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

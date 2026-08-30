# Ride Price Mobile UI — UX Audit (v011)

Captured 2026-08-29T22:02:41.282Z · viewport 390×844 · app eed2fa48cf8ce77071d0e5b424446bb728bcec3c

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 0 |
| Minor | 9 |
| Observation | 2 |

Severity scale: **Critical** — the user cannot complete the flow · **Major** — the flow continues but the experience is significantly impaired · **Minor** — polish / consistency · **Observation** — worth reviewing, not necessarily broken.

## Critical (0)

_None recorded._

## Major (0)

_None recorded._

## Minor (9)

### RP-UI-005 — Discovery Session · Discovery — question 1

- **Screenshot:** `current/05-discovery/01-question-1.png`
- **Issue:** The deal crumb controls (Buyer, Jacket, and the screen's back/forward link) wrap into three rows on a phone, pushing the working area ~120px down. The same row appears on every deal screen (discovery, vehicles, test drive, trade, desking, agreement, credit, menu, print).
- **Observation:** Consistent, but it costs a sixth of the phone screen before the content starts. A single compact row (icon buttons, or the back link folded into the title) would recover it.
- **Suggested area to investigate:** dealTitle() crumb markup; .crumb-btn / #pageActions wrapping at ≤720px

### RP-UI-006 — Finance Menu · Step 1 — Purchase Terms

- **Screenshot:** `current/14-finance-menu/05-purchase-terms.png`
- **Issue:** The five-step menu stepper wraps into three rows of pills on a phone.
- **Observation:** It still reads correctly; a horizontally scrolling stepper or numbers-only pills would keep it to one row.
- **Suggested area to investigate:** .stepper at ≤720px

### RP-UI-007 — Finance Menu · Deal finalized

- **Screenshot:** `current/14-finance-menu/16-deal-finalized.png`
- **Issue:** The finalize toast says the deal "now shows dark blue in the Deals list" — copy from the retired deals table. Since the deals-queue redesign a finalized deal leaves the active list into the folded Archived section.
- **Observation:** Stale copy, not a functional problem; the Deals screen itself is correct.
- **Suggested area to investigate:** menu route #finalize toast text

### RP-UI-008 — Finance Menu · Step 5 — Financial Contracts

- **Screenshot:** `current/14-finance-menu/15-financial-contracts.png`
- **Issue:** In the Repayment Options printable, a long product line (Key Replacement — 3 yr — lost or damaged remotes) wraps its price onto its own line, left-aligned under the label, breaking the money column.
- **Observation:** Only on long labels at phone width; the amount stays readable.
- **Suggested area to investigate:** .doc .lines li wrapping at ≤720px (overflow-wrap rule)

### RP-UI-009 — Finance Menu · Custom package — products moved, payment toggled

- **Screenshot:** `current/14-finance-menu/08-repayment-custom.png`
- **Issue:** The Toggle Payment control sits below the Accept Custom Package CTA and the 'Continue without products' link, so the reveal of the custom payment comes after the decision it informs.
- **Observation:** Order of operations on the phone layout; desktop keeps it inside the column.
- **Suggested area to investigate:** step2() phone layout, #togglePay placement

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

### RP-UI-024 — Customer Onboarding — the Customer Resolver · Customer identified (advisor)

- **Screenshot:** `current/02-customer-onboarding/09-remote-ready.png`
- **Issue:** The role pill in the master deal header (.m-rolebtn) is 65x35px — under the 40px small-variant touch floor the phone layout documents.
- **Observation:** It opens the drawer, so it is a real target, not decoration. Introduced with the master deal header (PR #51) and now visible on far more screens because the resolver, credit and agreement all use that header. Raising it to 40px is a one-line change in the .m-rolebtn padding.
- **Suggested area to investigate:** portal.css .m-rolebtn

### RP-UI-025 — Deal Jacket & Compliance · Add optional document

- **Screenshot:** `current/15-deal-jacket/06-add-optional.png`
- **Issue:** The sheet's close control is squeezed to 28×40 — the long title plus the flexible header row shrink it below its own 40px box, under the touch floor.
- **Observation:** The automated small-target check measured .m-close at 28x40 on this sheet only; every other jacket sheet keeps 40x40. The header row needs flex: none on the close (or a min-width), so a long title wraps instead of eating the control.
- **Suggested area to investigate:** portal.css .m-sheettop / #jkSheet .m-close

## Observation (2)

### RP-UI-022 — Finance Menu · Team Lead sign-off required — Advisor view

- **Screenshot:** `current/14-finance-menu/01-signoff-gate-advisor.png`
- **Issue:** The advisor's dead end here is intentional (the note says to switch to Team Lead), but the role switch it refers to is the unlabelled segmented control in the app bar.
- **Observation:** A trainee who has not used the app bar switch may not connect the instruction to the control.
- **Suggested area to investigate:** sign-off gate note copy / role switch affordance

### RP-UI-023 — Home — Deals Queue & Navigation · My Deals (landing — Advisor)

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** No authentication exists: the portal opens straight on the floor queue, with the Advisor / Team Lead role sheet on the queue top bar standing in for identity.
- **Observation:** By design for a demo/training tool — documented here so the absence of a login flow is not read as missing documentation.
- **Suggested area to investigate:** n/a

## Automated checks per screen

The capture run measures each screen for horizontal overflow, elements beyond the viewport, clipped text, text overlap and small touch targets (<36px — the automated hint threshold, set a little under the 40px floor the audit holds small variants to, so a finding below 40px comes from the eye, not the script). These are hints that were reviewed by eye; the findings above are the reviewed result. Raw values live in `flow-manifest.json` under each screen's `checks`.

# Ride Price Mobile UI — UX Audit (v007)

Captured 2026-08-27T16:17:22.903Z · viewport 390×844 · app 2838cc4fa90b4704858db2b6eeecc98ecd685d33

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 2 |
| Minor | 12 |
| Observation | 5 |

Severity scale: **Critical** — the user cannot complete the flow · **Major** — the flow continues but the experience is significantly impaired · **Minor** — polish / consistency · **Observation** — worth reviewing, not necessarily broken.

## Critical (0)

_None recorded._

## Major (2)

### RP-UI-001 — Desking — Calculate Payments · Calculate Payments — Finance

- **Screenshot:** `current/09-desking/02-pencil-finance.png`
- **Issue:** On a phone the desking screen is a single ~2,700px column: the Monthly Payment hero — the reason the screen exists — sits about 1,300px below the fold, while the Continue → action lives at the very top in the crumb area.
- **Observation:** The flow completes, but the advisor scrolls down to read the payment, adjusts terms further down still, and scrolls all the way back up to continue. A sticky payment summary or a bottom action bar would keep the number and the next step in view.
- **Suggested area to investigate:** portal.css .grid--pencil phone collapse; desk route chrome actions (#deskContinue)

### RP-UI-002 — Credit Application (Lending Lane) · Credit application — Individual

- **Screenshot:** `current/11-credit-application/01-application.png`
- **Issue:** The credit application is one uninterrupted form longer than 3,200px on a phone, with no section navigation or progress indication; the Submit button and the validation summary are at the far end.
- **Observation:** Every field is labelled and required fields are marked, so it can be completed — but on a phone it reads as an endless scroll. Grouping into Applicant / Residence / Employment steps (or collapsible sections) would fit the phone floor better.
- **Suggested area to investigate:** credit route form layout (.fields, section headings)

## Minor (12)

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

### RP-UI-010 — Credit Application (Lending Lane) · Approved (simulated)

- **Screenshot:** `current/11-credit-application/04-approved.png`
- **Issue:** Two buttons lead to the same place with different names: 'Continue → Menu' in the page header and 'Continue → Manager Sign-Off' in the body.
- **Observation:** Duplicate action with inconsistent labelling; one name (the sign-off is what comes next) would remove the doubt.
- **Suggested area to investigate:** credit route renderApproved() chrome + body links

### RP-UI-011 — Credit Application (Lending Lane) · Application — validation errors

- **Screenshot:** `current/11-credit-application/03-validation-errors.png`
- **Issue:** The validation toast listing the missing fields covers the applicant-type radio text ('With another person…') while it shows.
- **Observation:** Transient; field-level errors underneath are clear. Toasts sit at mid-bottom of the viewport and cover whatever is there on many screens (also seen over the Create Customer State field, the jacket dock and the agreement lines).
- **Suggested area to investigate:** #toast position / content offset at ≤720px

### RP-UI-012 — Training Licenses & Registrations · Training Registrations

- **Screenshot:** `current/04-training-materials/02-training-registrations.png`
- **Issue:** The registration cards are print-sized (112mm wide) and wider than the phone; their right-hand side (SAMPLE overprint, amounts, expiry) is cut off in view with no visible scroll affordance.
- **Observation:** By recorded decision the props are never scaled (they must print at true size); on a phone the grid scrolls horizontally, but nothing says so.
- **Suggested area to investigate:** .props-grid horizontal scroll hint at ≤720px

### RP-UI-013 — Vehicle Selection · Your Journey menu

- **Screenshot:** `current/06-vehicle-selection/05-your-journey-menu.png`
- **Issue:** The Your Journey popover opens over the vehicle card's own title, stock and price, hiding what the advisor is choosing for.
- **Observation:** Five plain-text items; opening below the button (or as a bottom sheet on phones) would keep the vehicle visible.
- **Suggested area to investigate:** .jmenu positioning in .vcard

### RP-UI-015 — Snap All — burst capture · Three shots taken

- **Screenshot:** `current/18-snap-all/02-thumbs.png`
- **Issue:** The per-thumbnail remove controls (×) are 24×24px, under the phone touch floor (≥40px for small variants).
- **Observation:** Also 34px zoom / page buttons on the client review screen and the advisor document review.
- **Suggested area to investigate:** .sa-thumb__x, .dr-zoom button, .dr-pagetools button sizing at ≤720px

### RP-UI-016 — Desking — Calculate Payments · Calculate Payments — Lease

- **Screenshot:** `current/09-desking/03-pencil-lease.png`
- **Issue:** The estimated-credit-score slider is a 16px-tall native range input — a small target on a phone for the control that changes the rate tier.
- **Observation:** Works, but easy to miss with a thumb.
- **Suggested area to investigate:** #scoreRange styling (thumb/track size) at ≤720px

### RP-UI-017 — Home — Deals Queue & Navigation · Funded contracts auto-archived

- **Screenshot:** `current/01-home-and-navigation/06-funded-archive.png`
- **Issue:** The 'Archived — funded contracts' disclosure is a 20px-tall text row — the only way to reach finished deals, under the touch floor.
- **Observation:** Still true after the 2026-08-23 role-aware queue: the Team Lead deliberately keeps the original view including this fold (owner decision), so the disclosure row remains the only way a manager reaches finished deals; the minimum fix is restyling the row to the 44px floor. The Advisor no longer has the fold at all — their funded deals sit at the end of the one list under a DONE chip.
- **Suggested area to investigate:** .dl-archive summary sizing

## Observation (5)

### RP-UI-019 — F&I Product Presentation · Advisor script open

- **Screenshot:** `current/13-fi-presentation/03-advisor-script-open.png`
- **Issue:** Tapping 💬 Advisor Script (and M/D Budget) opens content below the fold of the fixed Prev/Next bar; at the top of the page nothing visibly changes.
- **Observation:** The library had to scroll to show the change; a user may think the tap did nothing.
- **Suggested area to investigate:** present route: scroll the opened block into view, or open it as a sheet

### RP-UI-020 — Vehicle Selection · Browse inventory (no deal)

- **Screenshot:** `current/06-vehicle-selection/07-inventory-browse.png`
- **Issue:** In browse mode (drawer → Vehicle Search without a customer visit) every card still shows a Your Journey menu whose items only produce a 'Start a customer visit first' toast.
- **Observation:** Honest, but a disabled/hidden menu in browse mode would set the expectation before the tap.
- **Suggested area to investigate:** vehicles route, id === "browse" branch

### RP-UI-021 — Vehicle Selection · Vehicle Search — inventory

- **Screenshot:** `current/06-vehicle-selection/01-inventory.png`
- **Issue:** The inventory is one long page (the 12-vehicle demo already exceeds 3,200px on a phone) with the filter panel taking the whole first screen.
- **Observation:** Fine at demo size; a collapsed filter bar on phones would bring the first vehicle above the fold.
- **Suggested area to investigate:** .grid--side phone collapse

### RP-UI-022 — Finance Menu · Team Lead sign-off required — Advisor view

- **Screenshot:** `current/14-finance-menu/01-signoff-gate-advisor.png`
- **Issue:** The advisor's dead end here is intentional (the note says to switch to Team Lead), but the role switch it refers to is the unlabelled segmented control in the app bar.
- **Observation:** A trainee who has not used the app bar switch may not connect the instruction to the control.
- **Suggested area to investigate:** sign-off gate note copy / role switch affordance

### RP-UI-023 — Home — Deals Queue & Navigation · My Deals (landing — Advisor)

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** No authentication exists: the portal opens straight on the floor queue, with the Advisor / Team Lead switch standing in for identity.
- **Observation:** By design for a demo/training tool — documented here so the absence of a login flow is not read as missing documentation.
- **Suggested area to investigate:** n/a

## Automated checks per screen

The capture run measures each screen for horizontal overflow, elements beyond the viewport, clipped text, text overlap and small touch targets (<36px — the automated hint threshold, set a little under the 40px floor the audit holds small variants to, so a finding below 40px comes from the eye, not the script). These are hints that were reviewed by eye; the findings above are the reviewed result. Raw values live in `flow-manifest.json` under each screen's `checks`.

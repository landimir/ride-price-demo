# Ride Price Mobile UI Library — Changelog

## v003 — 2026-08-22

App commit: d2e1c8b · 20 flows · 110 screens · previous: v002

### Added
- none

### Changed (screenshot bytes differ from the previous version)
- Home — Deals Queue & Navigation · Reset demo data — confirm
- Home — Deals Queue & Navigation · Role switched to Team Lead
- Customer Onboarding — Find a Customer · Search results — match found
- Customer Onboarding — Find a Customer · Search results — no match
- Customer Onboarding — Find a Customer · Create Customer
- Customer Onboarding — Find a Customer · Create Customer — validation
- Scan Driver's License · Scan — front of licence
- Scan Driver's License · Scan — back of licence
- Scan Driver's License · Reading barcode…
- Scan Driver's License · Not recognized
- Scan Driver's License · Potential match found (prop 1)
- Scan Driver's License · Verify — existing customer found
- Scan Driver's License · Verify — new customer (prop 3)
- Scan Driver's License · Phone number already on file
- Training Licenses & Registrations · Training Licenses
- Training Licenses & Registrations · Training Registrations
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — filter applied
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · Vehicle details
- Vehicle Selection · Your Journey menu
- Vehicle Selection · Quote — follow-up only
- Vehicle Selection · Browse inventory (no deal)
- Test Drive Agreement · Scan licence (test-drive mode)
- Test Drive Agreement · Terms signed — Driver One
- Test Drive Agreement · Test drive in progress
- Test Drive Agreement · End Test Drive — odometer
- Trade-In Evaluation & Proof of Ownership · Evaluated trade value
- Trade-In Evaluation & Proof of Ownership · Proof of ownership complete
- Desking — Calculate Payments · Calculate Payments — Finance
- Desking — Calculate Payments · Calculate Payments — Lease
- Desking — Calculate Payments · Calculate Payments — Cash
- Base Payment Agreement · Agreement — signed
- Base Payment Agreement · Redesk — void & redesk confirm
- Credit Application (Lending Lane) · Application — validation errors
- Buyers on the Deal (Co-Buyer) · Buyers on this deal
- Buyers on the Deal (Co-Buyer) · Search existing customer
- Buyers on the Deal (Co-Buyer) · Co-buyer added
- Buyers on the Deal (Co-Buyer) · Swap is a Team Lead action
- F&I Product Presentation · Advisor script open
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Sign-off — jacket locked (Team Lead)
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Override the jacket lock
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Sign-off — ready
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 1 — Purchase Terms
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Purchase Terms — all boxes presented
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Custom package — products moved, payment toggled
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Client initials
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Continue without products — custom box must be initialed
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Continue without products — confirm
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Acknowledgement signed, forms selected
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 5 — Financial Contracts
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Deal finalized
- Deal Jacket & Compliance · Advisor script sheet
- Deal Jacket & Compliance · Mark received — record by hand
- Deal Jacket & Compliance · Request from the client — list
- Deal Jacket & Compliance · Upload a document
- Deal Jacket & Compliance · Add Optional / Custom Form
- Deal Jacket & Compliance · Queue row — scan blocked (back missing)
- Deal Jacket & Compliance · Queue row — verified instantly
- Send Text Request (advisor → client) · Jacket after sending — Resend Link
- Client Document Upload (customer's phone) · Row blocked — back of licence missing
- Client Document Upload (customer's phone) · Row verified
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · All documents verified
- Client Document Upload (customer's phone) · Receipt — your documents
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Print Center & Printables · Print preview — Base Payment Agreement
- Print Center & Printables · Print preview — MV-82 (training sample)

### Removed
- none

### New issues
- none

### Resolved issues
- RP-UI-003 — Customer Onboarding — Find a Customer · Create Customer (dialog footer below the fold; toast over the State field)
- RP-UI-004 — Customer Onboarding — Find a Customer · Search results (page did not scroll to the results)

**What actually changed (read by eye):** PR #42 closes the two findings on **Find a Customer** — after Search the page scrolls the Results panel into view (not visible in a full-length capture, noted on the step), the Create Customer dialog is capped to the screen with Cancel / Save & Start Visit in a pinned footer and the form scrolling inside, and an empty Save marks every missing field in red with the reason under it (one short toast, lifted clear of the footer). The same pinned footer and marks reach the **Scan Driver's License** verify screens (06–08). Every other "changed" entry above differs only in live values the app renders at capture time (minted deal numbers, clock times, capture dates) — not in design. Tooling: the automated overlap check now clips each text rect to its scrolling ancestors, so text scrolled under a pinned footer is no longer reported as overlapping it; that also dropped one icon-vs-checkmark pair on the presentation rail (a tile edge clipped by the rail) — no real overlap was lost, the other 4 on that screen still report.

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v002 — 2026-08-21

App commit: d80aa7b · 20 flows · 110 screens · previous: v001

### Added
- none

### Changed (screenshot bytes differ from the previous version)
- Home — Deals Queue & Navigation · Active Deals (landing)
- Home — Deals Queue & Navigation · Navigation drawer
- Home — Deals Queue & Navigation · Reset demo data — confirm
- Home — Deals Queue & Navigation · Pipeline filter — no match
- Home — Deals Queue & Navigation · Role switched to Team Lead
- Home — Deals Queue & Navigation · Funded contracts auto-archived
- Scan Driver's License · Reading barcode…
- Training Licenses & Registrations · Training Licenses
- Training Licenses & Registrations · Training Registrations
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — filter applied
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · Vehicle details
- Vehicle Selection · Your Journey menu
- Vehicle Selection · Quote — follow-up only
- Base Payment Agreement · Agreement — signed
- F&I Product Presentation · Product presentation — rate
- F&I Product Presentation · Advisor script open
- Deal Jacket & Compliance · Add Optional / Custom Form
- Send Text Request (advisor → client) · Jacket after sending — Resend Link
- Client Document Upload (customer's phone) · Receipt — your documents
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Print Center & Printables · Print preview — Base Payment Agreement
- Print Center & Printables · Print preview — MV-82 (training sample)

### Removed
- none

### New issues
- none

### Resolved issues
- none

**What actually changed (read by eye):** the six **Home — Deals Queue** screens carry PR #39 — the card is one clean tap target (no chevron, no ×), the header is a single row, chips are pinned top-right. Every other entry in the list above differs only in live values the app renders at capture time — minted deal numbers, clock times on stamps and toasts, the capture date on printables — not in design; no issue was opened or resolved. RP-UI-017 was reworded to say the chevron/× are gone.

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v001 — 2026-08-21

App commit: 0dc637d · 20 flows · 110 screens · previous: none (first capture)

### Added
- first capture — every flow and screen is new:
  - Home — Deals Queue & Navigation (6 screens)
  - Customer Onboarding — Find a Customer (5 screens)
  - Scan Driver's License (8 screens)
  - Training Licenses & Registrations (2 screens)
  - Discovery Session (3 screens)
  - Vehicle Selection (7 screens)
  - Test Drive Agreement (7 screens)
  - Trade-In Evaluation & Proof of Ownership (4 screens)
  - Desking — Calculate Payments (5 screens)
  - Base Payment Agreement (3 screens)
  - Credit Application (Lending Lane) (4 screens)
  - Buyers on the Deal (Co-Buyer) (4 screens)
  - F&I Product Presentation (4 screens)
  - Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts (16 screens)
  - Deal Jacket & Compliance (11 screens)
  - Send Text Request (advisor → client) (3 screens)
  - Client Document Upload (customer's phone) (10 screens)
  - Snap All — burst capture (4 screens)
  - Document Review (advisor) (1 screens)
  - Print Center & Printables (3 screens)

### Changed
- n/a

### Removed
- none

### New issues
- 23 recorded in reports/issues.json (0 Critical · 2 Major · 15 Minor · 6 Observation) — see reports/ux-audit.md

### Resolved issues
- none

_Captured from main at the commit above (PR #37 deals queue, before the deals-polish refinement round). Later versions are written by tools/update.mjs, which diffs the manifests and screenshot bytes._

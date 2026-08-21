# Ride Price Mobile UI Library — Changelog

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

# Ride Price Mobile UI Library — Changelog

## v020 — 2026-09-03

App commit: 153b35f · 20 flows · 136 screens · previous: v019

**Why this version exists.** v019 published *Both sides received* as a
byte-for-byte copy of *Front received, back needed* — the capture step never
reached the state it documents. Its client-link visit reloaded the page, and
the captured photos live only in memory, so the front was wiped before the
back went on; and the file input is a single-file camera input, so two files
in one event yield one page. Both are corrected, and the screen now shows
both sides Received with "System Verified (simulated)". `selfcheck.mjs` gained
the guard that would have caught it: two byte-identical screenshots inside
one flow, when neither declares a reused screen, mean a step did not advance.
Most of the other entries below are the clock in the captured screens moving.

### Added
- none

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · Stage filter — no match
- Home — Active Floor & Navigation · In showroom — an active visit
- Scan Driver's License · Manual search — customer found
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — question 1, customer-first
- Discovery Session · Discovery complete (sheet)
- Discovery Session · Visit details (sheet)
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Vehicle Selection · Browse inventory (no visit)
- Test Drive Agreement · Test drive in progress
- Test Drive Agreement · End test drive — odometer
- Desking — Calculate Payments · Base Payment Huddle
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Finance Menu — Sign-Off Gate and Four Stages · Taxes & fees (sheet)
- Deal Jacket & Compliance · Deal forms — expanded
- Deal Jacket & Compliance · Completed — already in the jacket
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Receipt — your documents
- Document Review (advisor) · Front received, back needed
- Document Review (advisor) · Both sides received
- Documents — Print Center & Printables · Preview — Base Payment Agreement
- Documents — Print Center & Printables · Preview — MV-82 (training sample)
- Documents — Print Center & Printables · Preview — Repayment Options

### Removed
- none

### New issues
- none

### Resolved issues
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v019 — 2026-09-03

App commit: 838460e · 20 flows · 136 screens · previous: v018

### Added
- Document Review (advisor) · Front received, back needed
- Document Review (advisor) · Add back of driver's license
- Document Review (advisor) · Both sides received

_Corrected by hand: the generated entry said "none" because the archive it compared against had been polluted. See the note at the end of this entry._

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · Stage filter — no match
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · Customer identified (advisor)
- Scan Driver's License · Manual search — customer found
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Visit details (sheet)
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Vehicle Selection · Browse inventory (no visit)
- Test Drive Agreement · Test drive in progress
- Test Drive Agreement · End test drive — odometer
- Desking — Calculate Payments · Base Payment Huddle
- Desking — Calculate Payments · Calculate Payments — Lease
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Buyers on the Deal (Co-Buyer) · Co-buyer — contextual actions
- Finance Menu — Sign-Off Gate and Four Stages · Taxes & fees (sheet)
- Finance Menu — Sign-Off Gate and Four Stages · Deal finalized
- Deal Jacket & Compliance · Completed — already in the jacket
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Upload your documents
- Client Document Upload (customer's phone) · Receipt — your documents
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Front received, back needed
- Document Review (advisor) · Both sides received
- Documents — Print Center & Printables · Documents
- Documents — Print Center & Printables · Preview — Base Payment Agreement
- Documents — Print Center & Printables · Preview — MV-82 (training sample)
- Documents — Print Center & Printables · Preview — Repayment Options

### Removed
- Document Review (advisor) · Review — Driver's License, page 1 of 2

_Corrected by hand, same reason._

### New issues
- none

### Resolved issues
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._


**Correction (2026-09-03).** This entry was generated against a polluted
baseline. `tools/capture.mjs doc-review` was run on its own before
`update.mjs`, so the working manifest already carried the new steps when
update archived it as v018 — and the changelog then compared v019 against
itself for that flow, reporting no additions or removals. `versions/v018`
has been rebuilt from the commit that shipped it (734941c) and the two lists
above recomputed. The lesson is the one already written into
ai-workflow-rules.md: do not leave ad-hoc verification captures in the
working copy, because the archive is taken from it.

## v018 — 2026-09-02

App commit: 15bf247 · 20 flows · 134 screens · previous: v017

### Added
- none

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · Stage filter — no match
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · Waiting for customer — progressive status
- Customer Onboarding — the Customer Resolver · Customer identified (advisor)
- Scan Driver's License · Manual search — customer found
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — the last question is the hand-off
- Discovery Session · Discovery complete (sheet)
- Discovery Session · Visit details (sheet)
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Vehicle Selection · Browse inventory (no visit)
- Base Payment Agreement · Void signature and redesk? (sheet)
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Buyers on the Deal (Co-Buyer) · Co-buyer — contextual actions
- Finance Menu — Sign-Off Gate and Four Stages · Taxes & fees (sheet)
- Finance Menu — Sign-Off Gate and Four Stages · Deal finalized
- Deal Jacket & Compliance · Deal forms — expanded
- Deal Jacket & Compliance · Completed — already in the jacket
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Receipt — your documents
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Documents — Print Center & Printables · Preview — Base Payment Agreement
- Documents — Print Center & Printables · Preview — MV-82 (training sample)
- Documents — Print Center & Printables · Preview — Repayment Options

### Removed
- none

### New issues
- none

### Resolved issues
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v017 — 2026-09-02

App commit: 136b892 · 20 flows · 134 screens · previous: v016

### Added
- Training Documents · Licenses
- Training Documents · License preview — both sides
- Training Documents · Registrations
- Training Documents · Registration preview
- Test Drive Agreement · Ready to test drive
- Test Drive Agreement · Add another driver
- Test Drive Agreement · Review & sign
- Test Drive Agreement · License needs attention

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · More sheet — secondary navigation
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · No license available — manual fallback
- Customer Onboarding — the Customer Resolver · Waiting for customer — progressive status
- Scan Driver's License · Manual search — customer found
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Visit details (sheet)
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Test Drive Agreement · Test drive in progress
- Test Drive Agreement · End test drive — odometer
- Test Drive Agreement · Test drive complete
- Desking — Calculate Payments · Calculate Payments — Cash
- Base Payment Agreement · Agreement — ready to sign
- Base Payment Agreement · Void signature and redesk? (sheet)
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Deal Jacket & Compliance · Deal forms — expanded
- Deal Jacket & Compliance · Completed — already in the jacket
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · Receipt — your documents
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Documents — Print Center & Printables · Preview — Base Payment Agreement
- Documents — Print Center & Printables · Preview — MV-82 (training sample)
- Documents — Print Center & Printables · Preview — Repayment Options

### Removed
- Training Licenses & Registrations · Training Licenses
- Training Licenses & Registrations · Training Registrations
- Test Drive Agreement · E-signature authorization
- Test Drive Agreement · License & terms
- Test Drive Agreement · Scan license (test-drive mode)
- Test Drive Agreement · Terms signed — Driver One

### New issues
- none

### Resolved issues
- RP-UI-012 (Minor) — the 112mm registration card clipped on a phone. Resolved by this version's Training Documents rebuild; recorded by hand after the entry was generated, because the board still carried it at build time. See reports/retired-issues.md for the scope.

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v016 — 2026-09-01

App commit: ed0ea19 · 20 flows · 132 screens · previous: v015

### Added
- Trade-In Evaluation & Proof of Ownership · Proof of ownership (sheet) — conditional questions

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · Stage filter — no match
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · No license available — manual fallback
- Customer Onboarding — the Customer Resolver · Customer identified (advisor)
- Scan Driver's License · Manual search — customer found
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — question 1, customer-first
- Discovery Session · Visit details (sheet)
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Test Drive Agreement · Terms signed — Driver One
- Test Drive Agreement · End Test Drive — odometer
- Trade-In Evaluation & Proof of Ownership · Trade value — the appraisal first
- Trade-In Evaluation & Proof of Ownership · Trade ready — items for Team Lead
- Trade-In Evaluation & Proof of Ownership · Trade ready — ownership review complete
- Desking — Calculate Payments · Base Payment Huddle
- Desking — Calculate Payments · Calculate Payments — Lease
- Desking — Calculate Payments · Calculate Payments — Cash
- Base Payment Agreement · Agreement — ready to sign
- Base Payment Agreement · Agreement — signed
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Deal Jacket & Compliance · Deal forms — expanded
- Deal Jacket & Compliance · Completed — already in the jacket
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · Receipt — your documents
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Documents — Print Center & Printables · Preview — Base Payment Agreement
- Documents — Print Center & Printables · Preview — MV-82 (training sample)
- Documents — Print Center & Printables · Preview — Repayment Options

### Removed
- Trade-In Evaluation & Proof of Ownership · Evaluated trade value

### New issues
- none

### Resolved issues
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v015 — 2026-09-01

App commit: 37c6b9f · 20 flows · 132 screens · previous: v014

### Added
- Discovery Session · Discovery complete (sheet)
- Discovery Session · Visit details (sheet)
- Discovery Session · Stage-aware — a vehicle chosen upstream

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · Stage filter — no match
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · Customer identified (advisor)
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — question 1, customer-first
- Discovery Session · Discovery — mid-interview, Back appears
- Discovery Session · Discovery — the last question is the hand-off
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Test Drive Agreement · Terms signed — Driver One
- Test Drive Agreement · End Test Drive — odometer
- Trade-In Evaluation & Proof of Ownership · Evaluated trade value
- Trade-In Evaluation & Proof of Ownership · Proof of ownership complete
- Desking — Calculate Payments · Calculate Payments — Lease
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Buyers on the Deal (Co-Buyer) · Co-buyer — contextual actions
- Finance Menu — Sign-Off Gate and Four Stages · Taxes & fees (sheet)
- Deal Jacket & Compliance · Deal forms — expanded
- Deal Jacket & Compliance · Completed — already in the jacket
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Receipt — your documents
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Documents — Print Center & Printables · Preview — Base Payment Agreement
- Documents — Print Center & Printables · Preview — MV-82 (training sample)
- Documents — Print Center & Printables · Preview — Repayment Options

### Removed
- none

### New issues
- none

### Resolved issues
- RP-UI-005 (Minor) — The deal crumb controls (Buyer, Jacket, and the screen's back/forward link) wrap into three rows on a phone, pushing the working area ~120px down. The same row appears on every deal screen (discovery, vehicles, test drive, trade, desking, agreement, credit, menu, print).

### Amended issues (kept, but re-filed or reworded)
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v014 — 2026-08-31

App commit: 5ad39ea · 20 flows · 129 screens · previous: v013

### Added
- none

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · My deals (landing — Advisor)
- Home — Active Floor & Navigation · More sheet — secondary navigation
- Home — Active Floor & Navigation · Reset demo data — confirm
- Home — Active Floor & Navigation · Switch demo role
- Home — Active Floor & Navigation · Active floor (Team Lead)
- Home — Active Floor & Navigation · Stage filter — no match
- Home — Active Floor & Navigation · Date range / history sheet
- Home — Active Floor & Navigation · Funded history in range
- Home — Active Floor & Navigation · Advisor — completed deal ends the list
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · Find customer — the resolver
- Customer Onboarding — the Customer Resolver · Search results
- Customer Onboarding — the Customer Resolver · Customer found — confirm + registration address
- Customer Onboarding — the Customer Resolver · Use a different address (sheet)
- Customer Onboarding — the Customer Resolver · Search results — no match
- Customer Onboarding — the Customer Resolver · No license available — manual fallback
- Customer Onboarding — the Customer Resolver · Send secure upload link (sheet)
- Customer Onboarding — the Customer Resolver · Waiting for customer — progressive status
- Customer Onboarding — the Customer Resolver · Customer identified (advisor)
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · Vehicle details sheet
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Vehicle Selection · Browse inventory (no visit)
- Desking — Calculate Payments · Base Payment Huddle
- Desking — Calculate Payments · Calculate Payments — Finance
- Desking — Calculate Payments · Calculate Payments — Lease
- Desking — Calculate Payments · Calculate Payments — Cash
- Desking — Calculate Payments · Compare payments — sheet
- Desking — Calculate Payments · Payment Comparison — full page
- Base Payment Agreement · Agreement — ready to sign
- Base Payment Agreement · Agreement — signed
- Base Payment Agreement · Void signature and redesk? (sheet)
- Credit Application (Lending Lane) · Verify your identity (pre-application gate)
- Credit Application (Lending Lane) · Identity verified
- Credit Application (Lending Lane) · Step 1 — Application type & applicant
- Credit Application (Lending Lane) · Joint — co-buyer needed
- Credit Application (Lending Lane) · Send co-buyer link (sheet)
- Credit Application (Lending Lane) · Link sent — persistent status
- Credit Application (Lending Lane) · Invalid submit — inline summary
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Credit Application (Lending Lane) · Approved (simulated)
- Buyers on the Deal (Co-Buyer) · Buyers on this deal
- Buyers on the Deal (Co-Buyer) · Add co-buyer — the resolver's entries
- Buyers on the Deal (Co-Buyer) · Co-buyer attached
- Buyers on the Deal (Co-Buyer) · Co-buyer — contextual actions
- Buyers on the Deal (Co-Buyer) · Remove — second tap confirms
- Buyers on the Deal (Co-Buyer) · Team Lead — Change roles visible
- Buyers on the Deal (Co-Buyer) · Change buyer roles? — confirmation
- F&I Product Presentation · Presentation — Rate
- F&I Product Presentation · Vehicle service contract
- F&I Product Presentation · Mileage changes the warranty window
- F&I Product Presentation · Advisor script (sheet)
- F&I Product Presentation · Monthly / daily budget (sheet)
- Finance Menu — Sign-Off Gate and Four Stages · Manager sign-off — Advisor view
- Finance Menu — Sign-Off Gate and Four Stages · Manager sign-off — jacket blocking (Team Lead)
- Finance Menu — Sign-Off Gate and Four Stages · Resolve Deal Jacket blocker
- Finance Menu — Sign-Off Gate and Four Stages · Stage 1 — Review the deal terms
- Finance Menu — Sign-Off Gate and Four Stages · Taxes & fees (sheet)
- Finance Menu — Sign-Off Gate and Four Stages · Stage 2 — Choose a protection package
- Finance Menu — Sign-Off Gate and Four Stages · Custom package — figure withheld
- Finance Menu — Sign-Off Gate and Four Stages · Accept package — client initials
- Finance Menu — Sign-Off Gate and Four Stages · Continue without products
- Finance Menu — Sign-Off Gate and Four Stages · Stage 3 — Disclosures & forms
- Finance Menu — Sign-Off Gate and Four Stages · Additional deal forms (sheet)
- Finance Menu — Sign-Off Gate and Four Stages · Stage 4 — Final review
- Finance Menu — Sign-Off Gate and Four Stages · Deal finalized
- Deal Jacket & Compliance · Deal Jacket — funding readiness
- Deal Jacket & Compliance · Advisor script sheet
- Deal Jacket & Compliance · Deal forms — expanded
- Deal Jacket & Compliance · Document row — contextual actions
- Deal Jacket & Compliance · Mark received — a person's word
- Deal Jacket & Compliance · Add optional document
- Deal Jacket & Compliance · Completed — already in the jacket
- Deal Jacket & Compliance · Driver's License — back still needed
- Deal Jacket & Compliance · Jacket complete — the dock unlocks
- Customer document request (from the jacket) · Request documents — secure link
- Customer document request (from the jacket) · Jacket after sending — Requested
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · Receipt — your documents
- Client Document Upload (customer's phone) · What we need — bottom sheet
- Client Document Upload (customer's phone) · Review capture — 2 pages
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Documents — Print Center & Printables · Print full packet (sheet)
- Documents — Print Center & Printables · Preview — Base Payment Agreement
- Documents — Print Center & Printables · Preview — MV-82 (training sample)
- Documents — Print Center & Printables · Preview — Repayment Options

### Removed
- none

### New issues
- RP-UI-029 (Minor) — The touch floor is 40px for every control (owner, 2026-08-31), but harness/touchfloor.mjs audits only pressable controls — button, link, role=button. Extending it to native form fields measures 14 real shortfalls: the desking accessory checkbox rows at 20px (eight of them), the test-drive delivery-preference rows at 22, the inventory search field at 21 and the deals search field at 25, the .switch control at 46x26, the client-link demo option row at 30, and #mMaxPrice at 38.

### Resolved issues
- RP-UI-015 (Minor) — The per-thumbnail remove controls (×) are 24×24px, under the phone touch floor (≥40px for small variants).
- RP-UI-024 (Minor) — The role pill in the master deal header (.m-rolebtn) is 65x35 to 82x35px — under the 40px small-variant touch floor the phone layout documents. Measured across the v013 capture set it appears on 8 of the 20 flows, on every master-canvas screen.
- RP-UI-025 (Minor) — The master bottom sheet's close control (.m-close) is squeezed to 28x40 in the jacket and measures 30x34 to 34x34 elsewhere — under the 40px touch floor. Measured across the v013 capture set it appears on 8 of the 20 flows, in every master sheet — including the new Print full packet sheet.

### Amended issues (kept, but re-filed or reworded)
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v013 — 2026-08-31

App commit: 3e6afbb · 20 flows · 129 screens · previous: v012

### Added
- Documents — Print Center & Printables · Print full packet (sheet)
- Documents — Print Center & Printables · Documents — two documents not ready

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · Use a different address (sheet)
- Customer Onboarding — the Customer Resolver · No license available — manual fallback
- Customer Onboarding — the Customer Resolver · Customer identified (advisor)
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Test Drive Agreement · End Test Drive — odometer
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Buyers on the Deal (Co-Buyer) · Remove — second tap confirms
- Deal Jacket & Compliance · Deal forms — expanded
- Deal Jacket & Compliance · Completed — already in the jacket
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Receipt — your documents
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Documents — Print Center & Printables · Documents
- Documents — Print Center & Printables · Preview — Base Payment Agreement
- Documents — Print Center & Printables · Preview — MV-82 (training sample)
- Documents — Print Center & Printables · Preview — Repayment Options

### Removed
- none

### New issues
- none

### Resolved issues
- RP-UI-008 (Minor) — On the Repayment Options printable, a product line long enough to wrap drops its price onto its own line, left-aligned under the label, breaking the money column. Re-measured on the v012 capture: 6 of the 7 purchased rows wrap this way — only "GAP Coverage — Full loan term" keeps its amount on the line. The original filing understated this as one long label.

### Amended issues (kept, but re-filed or reworded)
- RP-UI-024 — wording corrected
- RP-UI-025 — wording corrected

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v012 — 2026-08-30

App commit: e0a7560 · 20 flows · 127 screens · previous: v011

### Added
- Finance Menu — Sign-Off Gate and Four Stages · Resolve Deal Jacket blocker
- Finance Menu — Sign-Off Gate and Four Stages · Stage 1 — Review the deal terms
- Finance Menu — Sign-Off Gate and Four Stages · Taxes & fees (sheet)
- Finance Menu — Sign-Off Gate and Four Stages · Stage 2 — Choose a protection package
- Finance Menu — Sign-Off Gate and Four Stages · Custom package — figure withheld
- Finance Menu — Sign-Off Gate and Four Stages · Accept package — client initials
- Finance Menu — Sign-Off Gate and Four Stages · Continue without products
- Finance Menu — Sign-Off Gate and Four Stages · Stage 3 — Disclosures & forms
- Finance Menu — Sign-Off Gate and Four Stages · Additional deal forms (sheet)
- Finance Menu — Sign-Off Gate and Four Stages · Stage 4 — Final review

- Print Center & Printables · Print preview — Repayment Options
### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · No license available — manual fallback
- Customer Onboarding — the Customer Resolver · Customer identified (advisor)
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Test Drive Agreement · End Test Drive — odometer
- Desking — Calculate Payments · Calculate Payments — Cash
- Base Payment Agreement · Agreement — ready to sign
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Finance Menu — Sign-Off Gate and Four Stages · Manager sign-off — Advisor view
- Finance Menu — Sign-Off Gate and Four Stages · Manager sign-off — jacket blocking (Team Lead)
- Finance Menu — Sign-Off Gate and Four Stages · Deal finalized
- Deal Jacket & Compliance · Completed — already in the jacket
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · Receipt — your documents
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Print Center & Printables · Print preview — Base Payment Agreement
- Print Center & Printables · Print preview — MV-82 (training sample)

### Removed
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Override the jacket lock
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Sign-off — ready
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 1 — Purchase Terms
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Purchase Terms — all boxes presented
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 3 — Repayment Options (Preferred)
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Custom package — products moved, payment toggled
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Client initials
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Package accepted
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Continue without products — custom box must be initialed
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Continue without products — confirm
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 4 — Disclosure Forms
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Acknowledgement signed, forms selected
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 5 — Financial Contracts

### New issues
- none

### Resolved issues
- RP-UI-006 (Minor) — The five-step menu stepper wraps into three rows of pills on a phone.
- RP-UI-007 (Minor) — The finalize toast says the deal "now shows dark blue in the Deals list" — copy from the retired deals table. Since the deals-queue redesign a finalized deal leaves the active list into the folded Archived section.
- RP-UI-009 (Minor) — The Toggle Payment control sits below the Accept Custom Package CTA and the 'Continue without products' link, so the reveal of the custom payment comes after the decision it informs.

### Amended issues (kept, but re-filed or reworded)
- RP-UI-008 — re-filed against current/20-print-center/04-print-repayment.png; wording corrected
- RP-UI-022 — wording corrected
- RP-UI-024 — wording corrected
- RP-UI-025 — wording corrected

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v011 — 2026-08-29

App commit: eed2fa4 · 20 flows · 129 screens · previous: v010

### Added
- Buyers on the Deal (Co-Buyer) · Buyers on this deal
- Buyers on the Deal (Co-Buyer) · Add co-buyer — the resolver's entries
- Buyers on the Deal (Co-Buyer) · Co-buyer — contextual actions
- Buyers on the Deal (Co-Buyer) · Remove — second tap confirms
- Buyers on the Deal (Co-Buyer) · Team Lead — Change roles visible
- Buyers on the Deal (Co-Buyer) · Change buyer roles? — confirmation

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · Customer identified (advisor)
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Test Drive Agreement · License & terms
- Test Drive Agreement · End Test Drive — odometer
- Desking — Calculate Payments · Base Payment Huddle
- Desking — Calculate Payments · Calculate Payments — Cash
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Buyers on the Deal (Co-Buyer) · Co-buyer attached
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 3 — Repayment Options (Preferred)
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Custom package — products moved, payment toggled
- Deal Jacket & Compliance · Deal forms — expanded
- Deal Jacket & Compliance · Completed — already in the jacket
- Customer document request (from the jacket) · Customer request — delivery status
- Client Document Upload (customer's phone) · Receipt — your documents
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Print Center & Printables · Print preview — Base Payment Agreement
- Print Center & Printables · Print preview — MV-82 (training sample)

### Removed
- Buyers on the Deal (Co-Buyer) · Buyers on this deal
- Buyers on the Deal (Co-Buyer) · Search existing customer
- Buyers on the Deal (Co-Buyer) · Swap is a Team Lead action

**What actually changed (hand interpretation):** the Buyers surface was
rebuilt to the owner's Buyers on Deal V2 package (PR #54) — the added and
removed lists are that one change: the old modal's four steps became the
seven sheet states (one Add co-buyer action into the canonical Customer
Resolver, contextual confirmed removal, Team Lead-only Change roles behind a
confirmation). Everything under "Changed" is live data (deal numbers, clock
times, dates); no other screen's design moved. No new findings — the sheet's
controls clear the touch floor, and the small targets the checks flag on
these screens (the role pill, desking's text links) are the standing
RP-UI-024 family, visible behind the sheet, not new.

### New issues
- none

### Resolved issues
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v010 — 2026-08-29

App commit: 19607ac · 20 flows · 126 screens · previous: v009

### Added
- Deal Jacket & Compliance · Deal forms — expanded
- Deal Jacket & Compliance · Document row — contextual actions
- Deal Jacket & Compliance · Mark received — a person's word
- Deal Jacket & Compliance · Add optional document
- Deal Jacket & Compliance · Completed — already in the jacket
- Deal Jacket & Compliance · Driver's licence — back still needed
- Customer document request (from the jacket) · Request documents — secure link
- Customer document request (from the jacket) · Jacket after sending — Requested
- Customer document request (from the jacket) · Customer request — delivery status

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · In showroom — an active visit
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Vehicle Selection · Browse inventory (no visit)
- Test Drive Agreement · License & terms
- Test Drive Agreement · End Test Drive — odometer
- Desking — Calculate Payments · Base Payment Huddle
- Base Payment Agreement · Agreement — ready to sign
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 3 — Repayment Options (Preferred)
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Custom package — products moved, payment toggled
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Acknowledgement signed, forms selected
- Deal Jacket & Compliance · Deal Jacket — funding readiness
- Deal Jacket & Compliance · Advisor script sheet
- Deal Jacket & Compliance · Jacket complete — the dock unlocks
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · Receipt — your documents
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Print Center & Printables · Print preview — Base Payment Agreement
- Print Center & Printables · Print preview — MV-82 (training sample)

### Removed
- Deal Jacket & Compliance · Deal forms & jacket — opened
- Deal Jacket & Compliance · Missing form — row actions
- Deal Jacket & Compliance · Mark received — record by hand
- Deal Jacket & Compliance · Request from the client — list
- Deal Jacket & Compliance · Upload a document
- Deal Jacket & Compliance · Add Optional / Custom Form
- Deal Jacket & Compliance · Queue row — scan blocked (back missing)
- Deal Jacket & Compliance · Queue row — verified instantly
- Send Text Request (advisor → client) · Send Text Request — composer
- Send Text Request (advisor → client) · Jacket after sending — Resend Link
- Send Text Request (advisor → client) · Resend — composer

**What actually changed (hand interpretation):** the Deal Jacket was rebuilt
to the owner's V2 replication package (PR #53) — the added and removed lists
above are that one change: the old two-list jacket and the separate Send Text
Request pages became three buckets with contextual sheets, and requesting
documents is now a sheet on the jacket itself. Nearly every entry under
"Changed" is live data (minted deal numbers, clock times, dates), not design;
the real visual deltas outside the jacket are none. New issue RP-UI-025
(below) came out of this capture's automated small-target check.

### New issues
- RP-UI-025 (Minor) — the Add-optional sheet's close control is squeezed to 28×40 by its long title, under the touch floor.

### Resolved issues
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v009 — 2026-08-28

App commit: cc9d106 · 20 flows · 128 screens · previous: v008

### Added
- Home — Active Floor & Navigation · More sheet — secondary navigation
- Home — Active Floor & Navigation · Switch demo role
- Home — Active Floor & Navigation · Active floor (Team Lead)
- Home — Active Floor & Navigation · Stage filter — no match
- Home — Active Floor & Navigation · Date range / history sheet
- Home — Active Floor & Navigation · Funded history in range
- Home — Active Floor & Navigation · Advisor — completed deal ends the list
- Home — Active Floor & Navigation · In showroom — an active visit
- Customer Onboarding — the Customer Resolver · Find customer — the resolver
- Customer Onboarding — the Customer Resolver · Customer found — confirm + registration address
- Customer Onboarding — the Customer Resolver · Use a different address (sheet)
- Customer Onboarding — the Customer Resolver · Search results — no match
- Customer Onboarding — the Customer Resolver · No license available — manual fallback
- Customer Onboarding — the Customer Resolver · Send secure upload link (sheet)
- Customer Onboarding — the Customer Resolver · Waiting for customer — progressive status
- Customer Onboarding — the Customer Resolver · Customer identified (advisor)
- Scan Driver's License · Couldn't read the license (sheet)
- Scan Driver's License · Manual search — customer found
- Scan Driver's License · Confirm customer (certain match)
- Scan Driver's License · Confirm customer (ambiguous — prop 1)
- Scan Driver's License · New customer (prop 3)
- Scan Driver's License · Customer ready
- Credit Application (Lending Lane) · Verify your identity (pre-application gate)
- Credit Application (Lending Lane) · Identity verified
- Credit Application (Lending Lane) · Step 1 — Application type & applicant
- Credit Application (Lending Lane) · Joint — co-buyer needed
- Credit Application (Lending Lane) · Send co-buyer link (sheet)
- Credit Application (Lending Lane) · Link sent — persistent status
- Credit Application (Lending Lane) · Deal summary (contextual sheet)
- F&I Product Presentation · Mileage changes the warranty window
- F&I Product Presentation · Advisor script (sheet)

### Removed
- Home — Deals Queue & Navigation · Navigation drawer
- Home — Deals Queue & Navigation · Role switched to Team Lead
- Home — Deals Queue & Navigation · Pipeline filter — no match
- Home — Deals Queue & Navigation · Funded contracts auto-archived
- Home — Deals Queue & Navigation · Advisor — funded deal ends the list
- Customer Onboarding — Find a Customer · Find a Customer
- Customer Onboarding — Find a Customer · Search results — no match
- Customer Onboarding — Find a Customer · Create Customer
- Customer Onboarding — Find a Customer · Create Customer — validation
- Scan Driver's License · Intro — scan a driver's license
- Scan Driver's License · Processing your scan
- Scan Driver's License · That didn't read
- Scan Driver's License · Search results
- Scan Driver's License · We found a matching customer (prop 1)
- Scan Driver's License · Review customer — read-first document
- Scan Driver's License · Edit sheet (bottom sheet)
- Scan Driver's License · Create new customer (prop 3)
- Scan Driver's License · Customer added / updated
- Credit Application (Lending Lane) · Credit application — Individual
- Credit Application (Lending Lane) · Joint application — no co-buyer yet
- F&I Product Presentation · Advisor script open

### Changed (screenshot bytes differ from the previous version)
- Home — Active Floor & Navigation · My deals (landing — Advisor)
- Home — Active Floor & Navigation · Reset demo data — confirm
- Customer Onboarding — the Customer Resolver · Search results
- Scan Driver's License · Scan — front of license
- Scan Driver's License · Scan — flip to the back
- Scan Driver's License · Find customer manually (sheet)
- Scan Driver's License · Phone already in use (sheet)
- Scan Driver's License · Verify the phone number (sheet)
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · Vehicle details sheet
- Vehicle Selection · What's next? — after choosing
- Vehicle Selection · Quote — follow-up only
- Vehicle Selection · Browse inventory (no visit)
- Test Drive Agreement · Scan license (test-drive mode)
- Test Drive Agreement · End Test Drive — odometer
- Desking — Calculate Payments · Base Payment Huddle
- Desking — Calculate Payments · Calculate Payments — Finance
- Desking — Calculate Payments · Calculate Payments — Lease
- Desking — Calculate Payments · Calculate Payments — Cash
- Desking — Calculate Payments · Compare payments — sheet
- Desking — Calculate Payments · Payment Comparison — full page
- Base Payment Agreement · Agreement — ready to sign
- Base Payment Agreement · Agreement — signed
- Base Payment Agreement · Void signature and redesk? (sheet)
- Credit Application (Lending Lane) · Invalid submit — inline summary
- Credit Application (Lending Lane) · Approved (simulated)
- Buyers on the Deal (Co-Buyer) · Search existing customer
- F&I Product Presentation · Presentation — Rate
- F&I Product Presentation · Vehicle service contract
- F&I Product Presentation · Monthly / daily budget (sheet)
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Acknowledgement signed, forms selected
- Deal Jacket & Compliance · Upload a document
- Deal Jacket & Compliance · Add Optional / Custom Form
- Send Text Request (advisor → client) · Jacket after sending — Resend Link
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · Receipt — your documents
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Print Center & Printables · Print preview — Base Payment Agreement
- Print Center & Printables · Print preview — MV-82 (training sample)

### New issues
- RP-UI-024 (Minor) — the master deal header role pill is 65×35px, under the 40px small-target floor

### Resolved issues
- RP-UI-002 (Major) — the credit application is no longer one 3,200px form: it is the four-step wizard
- RP-UI-010 (Minor) — the approved screen has ONE forward action now (Manager Sign-Off), not two names for it
- RP-UI-011 (Minor) — credit validation is inline; no toast covers the application-type controls
- RP-UI-017 (Minor) — the 20px Archived fold is gone; funded contracts live behind the Team Lead date/history sheet
- RP-UI-019 (Observation) — the advisor script is a bottom sheet, not content opening below the fold


_Hand-written interpretation (the mechanical diff cannot say this):_

This release is the Master Replication rollout reaching the whole advisor path, so six flows were
rebuilt rather than restyled — home, customer onboarding, the license scan, the base payment
agreement, the credit application and the F&I presentation. That is why 31 screens are new and 21
are gone: the step keys changed with the architecture (the scan journey alone went from fourteen
screens to two decisions plus exception sheets). The 46 "changed" entries are mostly live values —
deal numbers, clock times, arrival times — plus the screens that inherited the master canvas.

One defect was found by eye during this audit and fixed before the capture was accepted: on the
advisor's remote-ready card the identity badge was pushed off the right edge at 390px, because the
name block could not shrink. The audit also reports offscreen tiles on the F&I presentation rail and
text overlapping the fixed bottom docks; both were measured and are capture artifacts, not defects —
the rail scrolls horizontally by design, and the docks are cleared by the pages' own bottom padding
(verified at 390×844 on the credit and deals screens).

The changelog tool was fixed in this release too: it had been diffing against the working manifest,
so a run that died at capture left the new step keys behind and the next run reported "Added: none"
while forty screens had been replaced. It now diffs against the archived previous version, which
cannot drift. This entry was recomputed by hand against versions/v008 after that fix.

## v008 — 2026-08-27

App commit: 1b22445 · 20 flows · 118 screens · previous: v007

### Added
- Vehicle Selection · What's next? — after choosing
- Desking — Calculate Payments · Compare payments — sheet

### Changed (screenshot bytes differ from the previous version)
- Home — Deals Queue & Navigation · My Deals (landing — Advisor)
- Home — Deals Queue & Navigation · Navigation drawer
- Home — Deals Queue & Navigation · Reset demo data — confirm
- Home — Deals Queue & Navigation · Role switched to Team Lead
- Home — Deals Queue & Navigation · Pipeline filter — no match
- Home — Deals Queue & Navigation · Funded contracts auto-archived
- Home — Deals Queue & Navigation · Advisor — funded deal ends the list
- Customer Onboarding — Find a Customer · Find a Customer
- Customer Onboarding — Find a Customer · Search results — match found
- Customer Onboarding — Find a Customer · Search results — no match
- Customer Onboarding — Find a Customer · Create Customer
- Customer Onboarding — Find a Customer · Create Customer — validation
- Scan Driver's License · Intro — scan a driver's license
- Scan Driver's License · Capture — front of license
- Scan Driver's License · Capture — back of license
- Scan Driver's License · Processing your scan
- Scan Driver's License · That didn't read
- Scan Driver's License · Enter license manually
- Scan Driver's License · Search results
- Scan Driver's License · We found a matching customer (prop 1)
- Scan Driver's License · Review customer — read-first document
- Scan Driver's License · Edit sheet (bottom sheet)
- Scan Driver's License · Create new customer (prop 3)
- Scan Driver's License · Information conflict
- Scan Driver's License · Verify the number (bottom sheet)
- Scan Driver's License · Customer added / updated
- Training Licenses & Registrations · Training Licenses
- Training Licenses & Registrations · Training Registrations
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — Used only
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · Vehicle details sheet
- Vehicle Selection · Quote — follow-up only
- Vehicle Selection · Browse inventory (no visit)
- Test Drive Agreement · E-signature authorization
- Test Drive Agreement · License & terms
- Test Drive Agreement · Scan license (test-drive mode)
- Test Drive Agreement · Terms signed — Driver One
- Test Drive Agreement · Test drive in progress
- Test Drive Agreement · End Test Drive — odometer
- Test Drive Agreement · Test drive completed
- Trade-In Evaluation & Proof of Ownership · Trade-In Evaluation
- Trade-In Evaluation & Proof of Ownership · Proof of ownership — gaps flagged
- Trade-In Evaluation & Proof of Ownership · Evaluated trade value
- Trade-In Evaluation & Proof of Ownership · Proof of ownership complete
- Desking — Calculate Payments · Base Payment Huddle
- Desking — Calculate Payments · Calculate Payments — Finance
- Desking — Calculate Payments · Calculate Payments — Lease
- Desking — Calculate Payments · Calculate Payments — Cash
- Desking — Calculate Payments · Payment Comparison — full page
- Base Payment Agreement · Agreement — ready to sign
- Base Payment Agreement · Agreement — signed
- Base Payment Agreement · Redesk — void & redesk confirm
- Credit Application (Lending Lane) · Credit application — Individual
- Credit Application (Lending Lane) · Joint application — no co-buyer yet
- Credit Application (Lending Lane) · Application — validation errors
- Credit Application (Lending Lane) · Approved (simulated)
- Buyers on the Deal (Co-Buyer) · Buyers on this deal
- Buyers on the Deal (Co-Buyer) · Search existing customer
- Buyers on the Deal (Co-Buyer) · Co-buyer added
- Buyers on the Deal (Co-Buyer) · Swap is a Team Lead action
- F&I Product Presentation · Product presentation — rate
- F&I Product Presentation · Vehicle service contract
- F&I Product Presentation · Advisor script open
- F&I Product Presentation · Monthly/daily budget impact
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Team Lead sign-off required — Advisor view
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Sign-off — jacket locked (Team Lead)
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Override the jacket lock
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Sign-off — ready
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 1 — Purchase Terms
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Purchase Terms — all boxes presented
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 3 — Repayment Options (Preferred)
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Custom package — products moved, payment toggled
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Client initials
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Package accepted
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Continue without products — custom box must be initialed
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Continue without products — confirm
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 4 — Disclosure Forms
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Acknowledgement signed, forms selected
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Step 5 — Financial Contracts
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Deal finalized
- Deal Jacket & Compliance · Deal Jacket — overview
- Deal Jacket & Compliance · Advisor script sheet
- Deal Jacket & Compliance · Deal forms & jacket — opened
- Deal Jacket & Compliance · Missing form — row actions
- Deal Jacket & Compliance · Mark received — record by hand
- Deal Jacket & Compliance · Request from the client — list
- Deal Jacket & Compliance · Upload a document
- Deal Jacket & Compliance · Add Optional / Custom Form
- Deal Jacket & Compliance · Queue row — scan blocked (back missing)
- Deal Jacket & Compliance · Queue row — verified instantly
- Deal Jacket & Compliance · Jacket complete — dock unlocks sign-off
- Send Text Request (advisor → client) · Send Text Request — composer
- Send Text Request (advisor → client) · Jacket after sending — Resend Link
- Send Text Request (advisor → client) · Resend — composer
- Client Document Upload (customer's phone) · Text message with the link
- Client Document Upload (customer's phone) · Upload your documents
- Client Document Upload (customer's phone) · Row blocked — back of license missing
- Client Document Upload (customer's phone) · Row verified
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · All documents verified
- Client Document Upload (customer's phone) · Receipt — your documents
- Client Document Upload (customer's phone) · What we need — bottom sheet
- Client Document Upload (customer's phone) · Review capture — 2 pages
- Client Document Upload (customer's phone) · Too blurry to read — refused on the row
- Snap All — burst capture · Snap All — camera
- Snap All — burst capture · Three shots taken
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Print Center & Printables · Print Center
- Print Center & Printables · Print preview — Base Payment Agreement
- Print Center & Printables · Print preview — MV-82 (training sample)

### Removed
- Vehicle Selection · Your Journey menu

### New issues
- none

### Resolved issues
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v007 — 2026-08-27

App commit: 2838cc4 · 20 flows · 117 screens · previous: v006

Recovered entry: this release was captured but its changelog entry was never
written. The figures above come from `versions/v007/reports/`, which holds the
full manifest and its issue board; the per-screen diff against v006 was not
recorded at the time and is not reconstructed here rather than guessed.

## v006 — 2026-08-26

App commit: 2a29a56 · 20 flows · 117 screens · previous: v005

Recovered entry: same as above — captured on the day the customer upload page
landed, written up only now. See `versions/v006/reports/` for the manifest and
the issue board as they stood.

## v005 — 2026-08-24

App commit: 89f260a · 20 flows · 114 screens · previous: v004

### Added
- Scan Driver's License · Intro — identity check
- Scan Driver's License · Training-license help (in-journey peek)
- Scan Driver's License · Complete — customer is ready

### Changed (screenshot bytes differ from the previous version)
- Customer Onboarding — Find a Customer · Create Customer — validation
- Scan Driver's License · Capture — front of license
- Scan Driver's License · Capture — back of license
- Scan Driver's License · Checking the license
- Scan Driver's License · Not recognized
- Scan Driver's License · Possible match (prop 1)
- Scan Driver's License · Customer confirmed — changed fields
- Scan Driver's License · New customer — license details ready (prop 3)
- Scan Driver's License · Phone number conflict
- Training Licenses & Registrations · Training Registrations
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — filter applied
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · Your Journey menu
- Vehicle Selection · Quote — follow-up only
- Test Drive Agreement · Scan license (test-drive mode)
- Test Drive Agreement · End Test Drive — odometer
- Desking — Calculate Payments · Calculate Payments — Cash
- Base Payment Agreement · Agreement — ready to sign
- Base Payment Agreement · Agreement — signed
- Base Payment Agreement · Redesk — void & redesk confirm
- Credit Application (Lending Lane) · Joint application — no co-buyer yet
- F&I Product Presentation · Advisor script open
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Acknowledgement signed, forms selected
- Deal Jacket & Compliance · Upload a document
- Deal Jacket & Compliance · Add Optional / Custom Form
- Send Text Request (advisor → client) · Jacket after sending — Resend Link
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · Receipt — your documents
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Print Center & Printables · Print preview — Base Payment Agreement
- Print Center & Printables · Print preview — MV-82 (training sample)

### Removed
- none

### New issues
- none

### Resolved issues
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

## v004 — 2026-08-23

App commit: da321ec · 20 flows · 111 screens · previous: v003

_Read of this entry: the scan flow is the real change — rebuilt to the owner's v2 prototype (PR #46: full-screen journey, intro and completion screens, in-journey help, summary-first review, evidence cards) and re-documented as 11 steps; Create Customer's validation capture changed because phone AND email are both required now (owner rule 2026-08-23). The test-drive "Scan license" capture changed with the same journey. Every other "changed" entry is live values — clock times, minted deal numbers, dates — plus the known sub-pixel jitter; the designs are unchanged. No issue cards were added or resolved: the scanner had none, and the two Majors (desking fold, credit-app length) stand._

**What actually changed:** the Home flow — the role-aware queue from PR #44. The landing is now the Advisor's guided view (My Deals, no pills, the VIN + STK line, a Next line, a chevron); the Team Lead screens show the original floor view with the VIN line and chevron added; a new seventh screen documents the Advisor's funded-deal tail (no archive fold for that role). Every other "changed" entry is live values — clock times, computed dates, minted deal numbers — not design; the desking, agreement, presentation and printable layouts are unchanged (the MV-82's 8 recorded overlaps persist as before). RP-UI-017's note now records that the archive fold is Team Lead-only by decision.

### Added
- Home — Deals Queue & Navigation · Advisor — funded deal ends the list

### Changed (screenshot bytes differ from the previous version)
- Home — Deals Queue & Navigation · My Deals (landing — Advisor)
- Home — Deals Queue & Navigation · Navigation drawer
- Home — Deals Queue & Navigation · Reset demo data — confirm
- Home — Deals Queue & Navigation · Role switched to Team Lead
- Home — Deals Queue & Navigation · Pipeline filter — no match
- Home — Deals Queue & Navigation · Funded contracts auto-archived
- Scan Driver's License · Reading barcode…
- Discovery Session · Discovery — question 1
- Discovery Session · Discovery — mid-interview
- Discovery Session · Discovery — last question
- Vehicle Selection · Vehicle Search — inventory
- Vehicle Selection · Inventory — filter applied
- Vehicle Selection · Inventory — no vehicles match
- Vehicle Selection · Your Journey menu
- Vehicle Selection · Quote — follow-up only
- Test Drive Agreement · End Test Drive — odometer
- Desking — Calculate Payments · Calculate Payments — Cash
- Base Payment Agreement · Agreement — ready to sign
- Base Payment Agreement · Agreement — signed
- Base Payment Agreement · Redesk — void & redesk confirm
- F&I Product Presentation · Advisor script open
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Custom package — products moved, payment toggled
- Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts · Acknowledgement signed, forms selected
- Deal Jacket & Compliance · Add Optional / Custom Form
- Send Text Request (advisor → client) · Jacket after sending — Resend Link
- Client Document Upload (customer's phone) · Insurance flagged — expires within 45 days
- Client Document Upload (customer's phone) · Receipt — your documents
- Snap All — burst capture · Auto-sort results
- Snap All — burst capture · Results — exception accepted
- Document Review (advisor) · Review — Driver's License, page 1 of 2
- Print Center & Printables · Print preview — Base Payment Agreement
- Print Center & Printables · Print preview — MV-82 (training sample)

### Removed
- none

### New issues
- none

### Resolved issues
- none

_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._

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
- Scan Driver's License · Scan — front of license
- Scan Driver's License · Scan — back of license
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
- Test Drive Agreement · Scan license (test-drive mode)
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
- Client Document Upload (customer's phone) · Row blocked — back of license missing
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

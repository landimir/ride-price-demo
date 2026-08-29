# Ride Price Mobile UI Library — Changelog

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

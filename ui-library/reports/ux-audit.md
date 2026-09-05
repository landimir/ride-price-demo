# Ride Price Mobile UI — UX Audit (v022)

Captured 2026-09-05T11:26:36.556Z · viewport 390×844 · app 17c4a3b9de28ae0e75d9ed7a6e588dea673f325f

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 1 |
| Minor | 9 |
| Observation | 6 |

Severity scale: **Critical** — the user cannot complete the flow · **Major** — the flow continues but the experience is significantly impaired · **Minor** — polish / consistency · **Observation** — worth reviewing, not necessarily broken.

## Critical (0)

_None recorded._

## Major (1)

### RP-UI-032 — Customer Onboarding — the Customer Resolver · Waiting for customer — progressive status

- **Screenshot:** `current/02-customer-onboarding/08-waiting-for-customer.png`
- **Issue:** The link path now says the link went out and nothing says the demo did not send anything. The banner reads “Secure link sent · (646) 555-0900 · Text”; the send sheet before it (07) dropped “Demo — no text or email is really sent; the customer view opens on this device”; and the customer-identified screen after it (09) describes a real remote session — “Secure session · Opened on the customer's device”, “License photo · Read from the upload” — where v021 said “Opened on this device (demo)” and “Read from the training prop”. A trainee is told a text was sent and a customer uploaded, and neither happened.
- **Observation:** The chrome rule (v022) removed lede and helper copy from the 19 screens and made the banner slot the one place DEMO appears; the Advisor banner says “Sample data only”, which covers the data, not the sending. The demo is a training tool with no network (architecture invariant), so a screen that claims a send needs one honest line somewhere on the path — the banner slot is the package's own place for it. Copy decision on package screens, so filed rather than changed.
- **Suggested area to investigate:** app.js — the resolver's link path (obSendGo / waiting status / remote-ready) on the kit; the banner slot

## Minor (9)

### RP-UI-029 — All (app-wide) · Desking accessories, search fields, filter sheet

- **Screenshot:** `current/09-desking/02-pencil-finance.png`
- **Issue:** The touch floor is 40px for every control (owner, 2026-08-31), but harness/touchfloor.mjs audits only pressable controls — button, link, role=button. Extending it to native form fields measures 14 real shortfalls: the desking accessory checkbox rows at 20px (eight of them), the test-drive delivery-preference rows at 22, the inventory search field at 21 and the deals search field at 25, the .switch control at 46x26, the client-link demo option row at 30, and #mMaxPrice at 38.
- **Observation:** Found by widening the audit on 2026-08-31 and measured, not estimated. It was not restyled in that change: the job there was to implement the owner's ruling on the NUMBER, and lifting 14 form controls is a design change across desking, inventory search and the filter sheet that deserves its own review. The harness states the scope boundary at its selector rather than implying coverage it does not have.
- **Suggested area to investigate:** portal.css .opt-row, .switch, .m-search input, #dealSearch, #mMaxPrice

### RP-UI-031 — Home — Active Floor & Navigation · My deals (landing — Advisor)

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** Three gaps in the owner UI kit (v022.2) that the 19 chrome screens inherit: the wordmark (.rp-wordmark, 116x23) and the resolver search action (.rp-button-navy, 73x36) carry no 40px hit extension — and the Team Lead's date control (.rp-filter__control, 58x20), the only way into the date range / funded history sheet, has none either, where v021 drew it as a 40px pill — against the kit comment that every interactive element has one and the 40px floor for everything (owner, 2026-08-31); .rp-page reserves a flat 104px on a destination and 140px on a task beside bars whose height grows with env(safe-area-inset-bottom), masked today only because index.html carries no viewport-fit=cover; and .rp-search__input drops its outline with no :focus-within on the field, so keyboard focus on the search is invisible. harness/touchfloor.mjs exits 1 on the first two, deliberately.
- **Observation:** Reported, not patched: the kit is the owner design asset and is never restyled in this repo (CLAUDE.md), so these wait for kit v022.3 — two ::before hit-extension rules and one focus ring close all three. The wordmark shows on every Home screen; the search action on the resolver (current/02-customer-onboarding/01-resolver-idle.png). Filed with library v022, the first version captured on the kit. harness/touchfloor.mjs walks its routes as the Advisor, so the Team Lead's date control is outside what it measures; the library's own check flags it on four Home screens.
- **Suggested area to investigate:** ride-price-portal/assets/ride-price-mobile.css (the owner UI kit) — v022.3, never here

### RP-UI-033 — Customer Onboarding — the Customer Resolver · Waiting for customer — progressive status

- **Screenshot:** `current/02-customer-onboarding/08-waiting-for-customer.png`
- **Issue:** The task's step counter skips a step on the link path: the send sheet opens over “Step 1 of 3” and the next screen reads “Step 3 of 3” — step 2 never appears — while the found-customer and manual paths show “Step 2 of 3” before they leave the task.
- **Observation:** The Task template's “task name + step” line is part of the chrome rule; the three paths through the resolver number their steps differently. Either the link path has a second step to show, or the counter should read the path's own length.
- **Suggested area to investigate:** app.js — the resolver's Task header step index

### RP-UI-034 — Scan Driver's License · Confirm customer (certain match)

- **Screenshot:** `current/03-license-scan/06-scan-confirm.png`
- **Issue:** The identity column on the customer card is squeezed beside the “License match” pill: the name “Cheri Bridwell” breaks onto two lines and the one-sentence subtitle “Existing customer · license ending 0102” onto four. In v021 both fit on one line each. The kit's Inter is wider than the device face the screen was laid out for, and the card gives the pill its full width first.
- **Observation:** A layout on a kit screen, not the kit: the pill could wrap under the identity, or take a fixed width and let the column keep the rest. The only one of the eleven scan screens the face change hurt.
- **Suggested area to investigate:** app.js / portal.css — the scan flow's confirm card (identity column vs. match pill)

### RP-UI-038 — Snap All · Capture

- **Screenshot:** `current/18-snap-all/01-capture.png`
- **Issue:** The Gallery button uses an emoji glyph, against the standing rule that every icon slot carries a line icon from the one set, never emoji (owner ruling; RP_ICON).
- **Observation:** Snap All predates the icon ruling and has not been through a replication package; the glyph is the last emoji the library can find in a control.
- **Suggested area to investigate:** app.js — Snap All capture screen, the Gallery control

### RP-UI-039 — Snap All · Results — accepted

- **Screenshot:** `current/18-snap-all/04-results-accepted.png`
- **Issue:** The demo note is hidden behind the sticky Confirm button — the automated overlap check flags it (.dr-demonote against #saSave) and the capture shows it: the note's last line sits under the button.
- **Observation:** The page reserves no room for its own sticky control; the note needs the same bottom reservation the deal screens give their docks.
- **Suggested area to investigate:** portal.css — Snap All results, bottom reservation beside the sticky Confirm

### RP-UI-040 — Snap All · Results

- **Screenshot:** `current/18-snap-all/03-results.png`
- **Issue:** Three “Accept anyway” link buttons measure 88x28, under the 40px touch floor, and the fixed action column squeezes the row titles into fragments — “Driver's / License” and “Proof of / Income / (Paystub)” wrap to two and three lines.
- **Observation:** harness/touchfloor.mjs walks routes as the Advisor and does not reach the results state behind a scan, so it never measures this control; measure it there or give the links the same 40px hit extension the app's other link buttons carry. The title column needs the width the action column is taking.
- **Suggested area to investigate:** app.js / portal.css — Snap All results rows (.dr-linkbtn.sa-override)

### RP-UI-041 — Client Document Upload (customer's phone) · Text message with the link

- **Screenshot:** `current/17-client-document-upload/01-sms.png`
- **Issue:** The only way into the customer's flow is a 144x19 inline text link inside the message bubble — under the 40px touch floor, on the one screen that a customer, not an advisor, taps.
- **Observation:** The simulated text is a demo prop, but the tap target is real: a link-styled block with a 40px hit area keeps the bubble's look.
- **Suggested area to investigate:** app.js / portal.css — the client link's simulated SMS bubble

### RP-UI-042 — Client Document Upload (customer's phone) · Document sheet

- **Screenshot:** `current/17-client-document-upload/08-document-sheet.png`
- **Issue:** Two link buttons on the sheet are 27px tall, under the 40px touch floor: “Other income type” (106x27) and “See a good example” (115x27).
- **Observation:** Same family as RP-UI-029's native controls and the Snap All links: link-styled buttons the floor harness does not reach. A ::before hit extension or a 40px min-height closes both.
- **Suggested area to investigate:** portal.css — the client upload sheet's link buttons

## Observation (6)

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

### RP-UI-035 — Scan Driver's License · New customer (prop 3)

- **Screenshot:** `current/03-license-scan/08-scan-new-customer.png`
- **Issue:** The primary “Create customer” button is cut in half at the bottom edge of the viewport: the new-customer form lays its call to action inline below the fields rather than in the Task template's pinned action dock, so on a phone the advisor scrolls, or dismisses the keyboard, to reach it.
- **Observation:** The chrome rule gives every task an action dock for exactly this control; the scan flow's form still keeps its own. Below the fold the library cannot show it either (see the v022 changelog on kit-screen captures).
- **Suggested area to investigate:** app.js — the scan flow's new-customer form; the Task template's dock

### RP-UI-036 — Scan Driver's License · New customer (prop 3)

- **Screenshot:** `current/03-license-scan/08-scan-new-customer.png`
- **Issue:** The helper line “Demo tool — sample data only.” under the Email field is set in the red danger colour although nothing is wrong yet, so an untouched, empty form reads as if it already failed validation.
- **Observation:** A note is muted or ink; red is the validation voice on every other screen. Same field family as the resolver's fallback form.
- **Suggested area to investigate:** app.js / portal.css — the scan flow's new-customer form helper

### RP-UI-037 — Home — Active Floor & Navigation · My deals (landing — Advisor)

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** The VIN + STK identifier line is the smallest and lightest text on the deal card — 10.5px in the muted grey (rgb 115,115,125 on white, about 4.7:1, AA by a hair and marginal in sunlight) — while the flow calls VIN and stock two of the four load-bearing identifiers on every row, and the standing rule is that load-bearing text is ink because the app is used outdoors. v021 drew it darker and in mono.
- **Observation:** The kit's .rp-card__meta draws it this way on purpose (text face, tabular figures, muted) and the kit is the binding artifact, never restyled here — so this is a question for the kit's next revision, not a portal.css change. The flow note that still called the line mono was corrected with v022.
- **Suggested area to investigate:** ride-price-mobile.css .rp-card__meta (the owner UI kit) — a kit decision

### RP-UI-043 — Customer Onboarding — the Customer Resolver · No license available — manual fallback

- **Screenshot:** `current/02-customer-onboarding/06-manual-fallback.png`
- **Issue:** The manual fallback is now the task title and four bare fields. The note that made it fallback-only (“if a license or license photo becomes available, use it instead”) and the line that both phone and email are required are gone, and no field is marked required until validation says so.
- **Observation:** The chrome rule removed helper copy from the 19 screens by design; the two rules still hold in validation (customerMissing requires first, last, phone, email, address and ZIP). Whether the fallback-only rule needs a line on the screen is the package's call — filed so the change is on record, since the library's step note used to describe the copy.
- **Suggested area to investigate:** app.js — the resolver's manual fallback on the kit

## Automated checks per screen

The capture run measures each screen for horizontal overflow, elements beyond the viewport, clipped text, text overlap and small touch targets. Two thresholds are in play and they are not the same: this capture script flags anything under **36px**, while the touch floor itself is **40px for every control** (owner, 2026-08-31 — one number, no small-variant tier). So a target in the 36-39px band is reported only by the eye, and anything under 36px is caught by both. `harness/touchfloor.mjs` is what actually enforces the floor across every route — for pressable controls (`button`, links, `role=button`); native form fields sit outside its selector, and their measured shortfalls are RP-UI-029's finding, not this harness's coverage. These are hints that were reviewed by eye; the findings above are the reviewed result. Raw values live in `flow-manifest.json` under each screen's `checks`.

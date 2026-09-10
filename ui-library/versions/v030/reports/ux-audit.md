# Ride Price Mobile UI — UX Audit (v030)

Captured 2026-09-10T04:11:17.144Z · viewport 390×844 · app 0a93d7cddd33644bc577b9b9bbbd4095a6334c46

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 1 |
| Minor | 10 |
| Observation | 9 |

Severity scale: **Critical** — the user cannot complete the flow · **Major** — the flow continues but the experience is significantly impaired · **Minor** — polish / consistency · **Observation** — worth reviewing, not necessarily broken.

## Critical (0)

_None recorded._

## Major (1)

### RP-UI-032 — Customer Onboarding — the Customer Resolver · Waiting for customer — progressive status

- **Screenshot:** `current/02-customer-onboarding/08-waiting-for-customer.png`
- **Issue:** The link path now says the link went out and nothing says the demo did not send anything. The banner reads “Secure link sent · (646) 555-0900 · Text”; the send sheet before it (07) dropped “Demo — no text or email is really sent; the customer view opens on this device”; and the customer-identified screen after it (09) describes a real remote session — “Secure session · Opened on the customer's device”, “License photo · Read from the upload” — where v021 said “Opened on this device (demo)” and “Read from the training prop”. A trainee is told a text was sent and a customer uploaded, and neither happened.
- **Observation:** The chrome rule (v022) removed lede and helper copy from the 19 screens and made the banner slot the one place DEMO appears; the Advisor banner says “Sample data only”, which covers the data, not the sending. The demo is a training tool with no network (architecture invariant), so a screen that claims a send needs one honest line somewhere on the path — the banner slot is the package's own place for it. Copy decision on package screens, so filed rather than changed.
- **Suggested area to investigate:** app.js — the resolver's link path (obSendGo / waiting status / remote-ready) on the kit; the banner slot

## Minor (10)

### RP-UI-029 — All (app-wide) · Desking accessories, search fields, filter sheet

- **Screenshot:** `current/09-desking/02-pencil-finance.png`
- **Issue:** The touch floor is 40px for every control (owner, 2026-08-31), but harness/touchfloor.mjs audits only pressable controls — button, link, role=button. Extending it to native form fields measured 14 real shortfalls, 13 of them still open: the desking accessory checkbox rows at 20px (eight of them), the test-drive delivery-preference rows at 22, the inventory search field at 21 and the deals search field at 25, the .switch control at 46x26, the client-link demo option row at 30, and #mMaxPrice at 38 — the last of which closed with the vehicle-selection package (v025), where the filter sheet's price cap became the kit's 46px field.
- **Observation:** Found by widening the audit on 2026-08-31 and measured, not estimated. It was not restyled in that change: the job there was to implement the owner's ruling on the NUMBER, and lifting 14 form controls is a design change across desking, inventory search and the filter sheet that deserves its own review. The harness states the scope boundary at its selector rather than implying coverage it does not have.
- **Suggested area to investigate:** portal.css .opt-row, .switch, .m-search input, #dealSearch (#mMaxPrice closed with v025 and is listed above as history, not as somewhere to look)

### RP-UI-031 — Home — Active Floor & Navigation · My deals (landing — Advisor)

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** Three gaps in the owner UI kit (v022.2) that the 19 chrome screens inherit: the wordmark (.rp-wordmark, 116x23) and the resolver search action (.rp-button-navy, 73x36) carry no 40px hit extension — and the Team Lead's date control (.rp-filter__control, 58x20), the only way into the date range / funded history sheet, has none either, where v021 drew it as a 40px pill — against the kit comment that every interactive element has one and the 40px floor for everything (owner, 2026-08-31); .rp-page reserves a flat 104px on a destination and 140px on a task beside bars whose height grows with env(safe-area-inset-bottom), masked today only because index.html carries no viewport-fit=cover; and .rp-search__input drops its outline with no :focus-within on the field, so keyboard focus on the search is invisible. harness/touchfloor.mjs exits 1 on the first two, deliberately.
- **Observation:** Reported, not patched: the kit is the owner design asset and is never restyled in this repo (CLAUDE.md), so these wait for kit v022.3. THREE ::before hit-extension rules (the wordmark, the resolver search action and the Team Lead date control) and one focus ring close four of the five; the fifth, .rp-page's flat 104/140px reservation beside bars that grow with env(safe-area-inset-bottom), is a layout change and is closed by neither — it stays listed here so the remediation cannot read as complete while it is outstanding. The wordmark shows on every Home screen; the search action on the resolver (current/02-customer-onboarding/01-resolver-idle.png). Filed with library v022, the first version captured on the kit. harness/touchfloor.mjs walks its routes as the Advisor, so the Team Lead's date control is outside what it measures; the library's own check flags it on four Home screens.
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

### RP-UI-041 — Client Document Upload (customer's phone) · Text message with the link

- **Screenshot:** `current/17-client-document-upload/01-sms.png`
- **Issue:** The only way into the customer's flow is a 144x19 inline text link inside the message bubble — under the 40px touch floor, on the one screen that a customer, not an advisor, taps.
- **Observation:** The simulated text is a demo prop, but the tap target is real: a link-styled block with a 40px hit area keeps the bubble's look.
- **Suggested area to investigate:** app.js / portal.css — the client link's simulated SMS bubble

### RP-UI-042 — Client Document Upload (customer's phone) · Document sheet

- **Screenshot:** `current/17-client-document-upload/08-document-sheet.png`
- **Issue:** Two link buttons on the sheet are 27px tall, under the 40px touch floor: “Other income type” (106x27) and “See a good example” (115x27).
- **Observation:** Same family as RP-UI-029's native controls: link-styled buttons the floor harness does not reach. Snap All was the third of this family and closed it in v030, with a 44px ::after extension carried on its own class — the same device works here. A ::before hit extension or a 40px min-height closes both.
- **Suggested area to investigate:** portal.css — the client upload sheet's link buttons

### RP-UI-044 — Scan Driver's License · Confirm customer (ambiguous — prop 1)

- **Screenshot:** `current/03-license-scan/07-scan-ambiguous.png`
- **Issue:** On a PAGE the kit's unselected option row is invisible as a control. `.rp-option` fills with `--rp-canvas` and carries a transparent border, and `.rp-page` is that same canvas — so "Different guest — create new" has no edge and no fill of its own, and a pixel scan across the row's band returns one uniform #F2F2F7. The selected row reads as a card and the unselected one as loose text beside a circle, which is the wrong signal for the single question this screen exists to ask: same person, or a different guest?
- **Observation:** A kit matter, not this app's: the owner's board draws screen 07's option rows directly on the page too, so the app matches the board exactly and no override belongs in portal.css. Inside a sheet the pair reads correctly, because a sheet is `--rp-surface` and the canvas fill separates from it. Closing it needs one rule in the kit — a border or a surface fill for `.rp-option` when it is not on a surface — so it is filed for the kit's next revision.
- **Suggested area to investigate:** ride-price-mobile.css .rp-option (the owner UI kit) — never here

### RP-UI-045 — Scan Driver's License · Manual search — customer found

- **Screenshot:** `current/03-license-scan/05-scan-manual-result.png`
- **Issue:** The "Results (1)" section label sits flush under the gradient Search button, inside the button's own pink shadow: the button's fill ends at y=696 and rows 698–705 are its glow, with the label starting immediately after. The label reads as part of the button rather than as the heading of the list below it.
- **Observation:** The kit gives `.rp-section` a bottom margin and no top margin, and `.rp-stack` adds the gap between siblings — but the sheet lays these out itself, so nothing separates the primary from the label that follows. Measured on the capture, not estimated.
- **Suggested area to investigate:** app.js — the scan's manual-search sheet, the gap between the primary and the results label

### RP-UI-047 — Vehicle Selection · Vehicle details — sheet

- **Screenshot:** `current/06-vehicle-selection/04-vehicle-details.png`
- **Issue:** The details sheet reports the odometer under a label that means something else: the last spec row reads "Interior — Gray · 5 mi". The sheet has no mileage row of its own, so the only place mileage appears is folded into the interior line.
- **Observation:** The board's own sheet has three spec rows (VIN, Engine, Interior) and no mileage row, and the app pairs the interior with the odometer to keep the count — so the screen matches the board while saying something the label does not mean. The card above already carries the mileage in its meta line, so the honest fix is to drop it from the row rather than invent a fourth.
- **Suggested area to investigate:** app.js — the vehicle details sheet's second rp-kv group

### RP-UI-050 — Vehicle Selection · Inventory — sort and segmented controls

- **Screenshot:** `current/06-vehicle-selection/01-inventory.png`
- **Issue:** Two more kit controls sit under the 40px touch floor at 390px, and neither is covered by RP-UI-031: the inventory sort control (.rp-sort, 117x19) and the segmented control on the training-documents screens (.rp-segment__item, 172x36, on both Licenses and Registrations). The sort control is the smaller breach by far — 19px tall is under half the floor, and it is the only way to reorder the list. RP-UI-031 filed the same class of gap for .rp-wordmark (116x23) and .rp-button-navy (73x36) at library v022 and noted that harness/touchfloor.mjs exits 1 on them deliberately; these two arrived later, with the vehicle-selection and training-documents packages, and were never added. touchfloor now reports five, of which only two were on the list.
- **Observation:** Reported, not patched: the kit is the owner's design asset and its classes are never restyled in this repo (CLAUDE.md), so this waits for a kit revision alongside RP-UI-031 — the same two ::before hit-extension rules would close all four. Measured by harness/touchfloor.mjs across 769 painted controls on 22 routes at 390px; the fifth control it reports, .rp-wordmark, is already in RP-UI-031.
- **Suggested area to investigate:** Touch targets

## Observation (9)

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

### RP-UI-046 — Training Documents · License preview — both sides

- **Screenshot:** `current/04-training-materials/02-license-preview.png`
- **Issue:** The prop now renders on screen in the kit's Inter while it still PRINTS in the app font, so the preview sheet — a screen whose only job is to show what will come out of the printer — no longer matches the paper. With byte-identical prop data the card reflows between the two: the field line that breaks one way on screen breaks another way in print.
- **Observation:** Both halves are deliberate and both are right on their own. The hub is a kit screen, so `body[data-canvas="kit"]` gives it Inter; `@media print` forces `--app-font` on paper, which is what keeps every printable byte-identical to main (printcmp, 0 of 11 differ). What nobody decided is that a preview may disagree with its own print. The fix is a decision, not a patch: either the prop artwork pins its own face in both media, or the preview is stated to be indicative.
- **Suggested area to investigate:** portal.css — the prop families (prop-card, reg-card) and the print face

### RP-UI-048 — Vehicle Selection · Notification — vehicle reserved

- **Screenshot:** `current/06-vehicle-selection/08-vehicle-reserved.png`
- **Issue:** On the reserved alert every load-bearing word is muted grey: the title "Vehicle reserved" samples the kit's ink, but the body that carries the vehicle, the stock number, who signed, at what time and that this deal stays open is `.rp-alert__body` at 12.5px in `--rp-muted` (#6E6E78). The standing rule is that load-bearing text is ink, because the app is used outdoors.
- **Observation:** The kit defines the component that way and the app uses it as given, so this is the kit's decision to revisit — the same shape as RP-UI-037 on the deal card's VIN line. Worth pairing with that one when the palette is settled.
- **Suggested area to investigate:** ride-price-mobile.css .rp-alert__body (the owner UI kit) — a kit decision

### RP-UI-049 — Credit Application (Lending Lane) · Deal summary (contextual sheet)

- **Screenshot:** `current/11-credit-application/08-deal-summary-sheet.png`
- **Issue:** The customer-facing Deal summary lists Cash Price, Sales Tax, Cash Down and Trade-In Amount and then an Amount Financed that the four of them cannot produce: the trade is shown GROSS while the financed figure is computed from the trade NET of its payoff, and neither the payoff, the rebates nor the fees appear as lines. A customer adding up what is on the screen gets a different number from the one printed under it.
- **Observation:** Pre-existing and outside the three kit packages — surfaced because this capture re-read the screen beside its twin. The screen is honest about every number it shows; what is missing is the two lines that would make them reconcile.
- **Suggested area to investigate:** app.js — the credit application's deal-summary sheet

## Automated checks per screen

The capture run measures each screen for horizontal overflow, elements beyond the viewport, clipped text, text overlap and small touch targets. Two thresholds are in play and they are not the same: this capture script flags anything under **36px**, while the touch floor itself is **40px for every control** (owner, 2026-08-31 — one number, no small-variant tier). So a target in the 36-39px band is reported only by the eye, and anything under 36px is caught by both. `harness/touchfloor.mjs` is what actually enforces the floor across every route — for pressable controls (`button`, links, `role=button`); native form fields sit outside its selector, and their measured shortfalls are RP-UI-029's finding, not this harness's coverage. These are hints that were reviewed by eye; the findings above are the reviewed result. Raw values live in `flow-manifest.json` under each screen's `checks`.

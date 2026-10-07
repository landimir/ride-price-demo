# Ride Price Mobile UI — UX Audit (v050)

Captured 2026-10-06T15:51:22.934Z · viewport 390×844 · app e95e81c6b211b87631a488ff09a942c1b767c165

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 14 |
| Minor | 31 |
| Observation | 9 |

Severity scale: **Critical** — the user cannot complete the flow · **Major** — the flow continues but the experience is significantly impaired · **Minor** — polish / consistency · **Observation** — worth reviewing, not necessarily broken.

## Critical (0)

_None recorded._

## Major (14)

### RP-UI-032 — Customer Onboarding — the Customer Resolver · Waiting for customer — progressive status

- **Screenshot:** `current/02-customer-onboarding/12-waiting-for-customer.png`
- **Issue:** The link path now says the link went out and nothing says the demo did not send anything. The banner reads “Secure link sent · (646) 555-0900 · Text”; the send sheet before it (09) dropped “Demo — no text or email is really sent; the customer view opens on this device”; and the customer-identified screen after it (11) describes a real remote session — “Secure session · Opened on the customer's device”, “License photo · Read from the upload” — where v021 said “Opened on this device (demo)” and “Read from the training prop”. A trainee is told a text was sent and a customer uploaded, and neither happened.
- **Observation:** The chrome rule (v022) removed lede and helper copy from the 19 screens and made the banner slot the one place DEMO appears; the Advisor banner says “Sample data only”, which covers the data, not the sending. The demo is a training tool with no network (architecture invariant), so a screen that claims a send needs one honest line somewhere on the path — the banner slot is the package's own place for it. Copy decision on package screens, so filed rather than changed. v043: still so. The kit's rule of no demo copy and the owner's 2026-09-28 "Don't add unnecessary text to the screen" now weigh against a line on the path, so this is the owner's to rule, not a copy fix.
- **Suggested area to investigate:** app.js — the resolver's link path (obSendGo / waiting status / remote-ready) on the kit; the banner slot

### RP-UI-062 — Trade-In Evaluation & Proof of Ownership · Trade ready — ownership review complete

- **Screenshot:** `current/08-trade-in/07-ownership-complete.png`
- **Issue:** The ownership review is marked complete while its own answers contradict the value card. The recorded answer to "Does the title show a lienholder?" is No, yet the card deducts "Payoff $10,750" and reads "Ownership review complete" and "No unanswered ownership items."
- **Observation:** A payoff with no lienholder on the title is a contradiction the review should raise, not close: John's equity depends on which answer is true. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Trade-In's ownership review and value card

### RP-UI-063 — Trade-In Evaluation & Proof of Ownership · Trade ready — a fresh figure after re-running

- **Screenshot:** `current/08-trade-in/13-appraisal-rerun.png`
- **Issue:** The same 2016 Toyota RAV4 in Good condition is $15,500 at 61,200 miles (the seed) and $5,150 at 70,000 miles after Re-run, turning +$4,750 of equity into −$5,600. A newer 2018 Honda Civic at 61,200 miles and Good is $9,850.
- **Observation:** These cannot all come from one evaluator: the seeded $15,500 is a stored figure the evaluator does not produce, so re-running John's trade unchanged would move a value he has already been shown, or the mileage step is far too steep. The owner's rule is that the math is always correct. Found by the v043 audit.
- **Suggested area to investigate:** app.js / data.js — the trade evaluator and the seed's trade value

### RP-UI-064 — Credit Application (Lending Lane) · Identity verified

- **Screenshot:** `current/11-credit-application/02-identity-verified.png`
- **Issue:** The lane contradicts itself about John's license. The gate reads "Driver's license · Not on file — scan it in the resolver · Needed" beside a photo row that "Confirms the person matches the license"; after the photo it says "Identity verified" while the license row still reads Needed. Step 1 then shows "Driver's license T-0000101" "From the record", "Verified on the previous step".
- **Observation:** The license is either on the record or not. As drawn, the app claims a verification its own checklist says did not happen, with no license to compare the photo against. Either the gate reads the license the application reads, or "Identity verified" waits for it. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the credit application's identity gate

### RP-UI-065 — Credit Application (Lending Lane) · Send a secure link to the applicant (sheet)

- **Screenshot:** `current/11-credit-application/21-identity-link-sheet.png`
- **Issue:** The identity link for John uses the co-buyer's words. The sheet is for "Deal #48201 · John Smith" at John's own number, but its steps read "They verify identity first · Photo against their own license" and "Then their own fields only · Nothing about John is shown to them".
- **Observation:** Telling the advisor that nothing about John is shown to John is wrong, and they/their for John breaks the owner's rule of names, not pronouns. The applicant's link needs its own words. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the credit application's secure-link sheet, the applicant's case

### RP-UI-066 — Buyers on the Deal (Co-Buyer) · After removal — Cheri's Removed row and the audit line

- **Screenshot:** `current/12-buyers-and-co-buyer/06-removed-state.png`
- **Issue:** After a clean removal the sheet says "Tap to see Cheri on Customers — reattaching Cheri starts a new application, it does not reopen that one." (v044; at v043 it read "Tap for Cheri's profile and the withdrawn application — …") The confirmation one screen earlier listed "Credit activity · None yet": there is no application to withdraw or reopen.
- **Observation:** The lending-lane wording, right on the post-lane removal, shown where no application existed. The line belongs only where one was withdrawn. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the buyers sheet's Removed row

### RP-UI-067 — F&I Product Presentation · Monthly / daily budget (sheet)

- **Screenshot:** `current/13-fi-presentation/04-budget-impact.png`
- **Issue:** The VSC budget sheet tells John "Monthly $45.83" and "Daily $1.51" ("≈ $1.51 a day over 60 months"): the $2,750 price over 60 months with no finance charge. Financed on the deal, the same VSC adds about $50 a month, and the Finance Menu shows it at that.
- **Observation:** John sees one monthly figure for the product in the presentation and a larger one a screen later; the smaller is the one that sells it. The budget should be the product financed at the deal's rate and term, as the menu prices it (KA-013: the Finance Menu's math is always correct). Found by the v043 audit.
- **Suggested area to investigate:** app.js — route present/:id, the budget impact sheet

### RP-UI-068 — F&I Product Presentation · Rate — before the credit approval

- **Screenshot:** `current/13-fi-presentation/11-rate-gated.png`
- **Issue:** With no approval, the Rate card still presents the rate as won: "A rate you actually qualified for.", "The rate on this menu comes from the lender's real approval of your credit application — not an estimate. We submitted to the lender you preferred…", and three green checks starting "Based on your actual lender approval". Only a small grey line says "Submit the credit application to present the qualified rate."
- **Observation:** The number and the Approved pill are gone, as this capture was meant to prove, but the headline, body and checks still tell John an application was submitted and approved. The unapproved card needs its own words, with no approval claims and no checks. Found by the v043 audit.
- **Suggested area to investigate:** app.js / data.js — the presentation's Rate copy before an approval

### RP-UI-069 — Snap All — burst capture · Back in the jacket — batch saved

- **Screenshot:** `current/18-snap-all/09-batch-saved.png`
- **Issue:** The license the batch just completed is counted as owed by the customer: under "Waiting on customer · 2 documents · 2 needed" the Driver's License row reads "John Smith: review needed", and it counts toward "2 items need the customer" and "Request 2 documents". The screen before said "Both sides captured · review pending".
- **Observation:** A review the advisor owes is filed as a document the customer owes, so the request button would ask John for a license he just handed over. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Deal Jacket's buckets after Snap All saves a license

### RP-UI-070 — Document Review (advisor) · Requested — nothing received yet

- **Screenshot:** `current/19-document-review/07-requested.png`
- **Issue:** Nothing has been received ("Front · Needed", "Back · Needed", "No license images received."), yet the viewer shows the after-reload placeholder "Preview unavailable · Driver's License · Front · Only the receipt record is saved between sessions.", as if a front had arrived.
- **Observation:** The placeholder belongs to a received page whose picture did not survive a reload; with nothing received the viewer should say nothing arrived. Found by the v043 audit.
- **Suggested area to investigate:** app.js — Document review's viewer placeholder

### RP-UI-071 — Documents — Print Center & Printables · Funded deal whose vehicle left the catalog — lands on the jacket

- **Screenshot:** `current/20-print-center/18-documents-vehicle-gone.png`
- **Issue:** The funded jacket contradicts itself. It is subtitled "John Smith · no vehicle yet" under "FUNDING SIGN-OFF · Signed off by Jordan Reyes"; its readiness card says the Lien Release Letter "holds funding sign-off" beside "11 items remaining"; and the insurance row has a check-mark icon beside a "Needed" pill.
- **Observation:** A signed-off, funded deal reads as not ready and without a car. Which lines should hold once sign-off is recorded is the question; the icon should follow the status. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Deal Jacket after funding, when the vehicle has left the catalog

### RP-UI-072 — Training Documents · Print all 5 — registrations on paper

- **Screenshot:** `current/04-training-materials/07-print-registrations.png`
- **Issue:** The registrations print at their true 112 mm (about 423 px) inside the 390 px phone: every card runs off the right edge, cutting the stamp ("TRAINI"), the expiry ("Expires 04/18/2") and the fees ("32.5", "146.7" where the preview reads 32.50 and 146.75). The library's check measures 33 px of overflow.
- **Observation:** On a phone the printable page cannot be read in full before printing, and the amounts it shows are wrong by what is cut. The preview scales the same document and fits. Found by the v043 audit.
- **Suggested area to investigate:** portal.css — the registration print layout at phone width

### RP-UI-073 — Discovery — the guided consultation · Stage 1 — the sample slide

- **Screenshot:** `current/05-discovery/01-stage-intro.png`
- **Issue:** The stage headline runs past the stage's right edge and is cut mid-word: "Let's start with the SUV you d", "How much more room do you", "Comfort for everyone on boar". On Size & space the cut headline is the only place the question appears.
- **Observation:** Filed on the kit gap the owner ruled on (D-SM3 = A: a second .rp-stage rule clips). The advisor cannot read what is being asked; the headline should wrap. Found by the v043 audit.
- **Suggested area to investigate:** ride-price-mobile.css .rp-stage — the kit gap D-SM3

### RP-UI-074 — Base Payment Agreement · Agreement — Lease

- **Screenshot:** `current/10-base-payment-agreement/08-agreement-lease.png`
- **Issue:** The lease agreement's "Total taxes & fees" reads $462.20: the $432.50 of one-time fees plus $29.70, one month of the tax on the payment. The printout adds them the same way. The pencil stopped mixing the two in #211 (MR-12, Desking's DK-025): its Fees & tax reads "$1,027.50 + $29.70 / mo".
- **Observation:** A figure on the paper John signs adds amounts of two kinds. It goes with the owner's answer on the New York lease tax (DK-054), which moves the lease's tax to signing. Found by the v043 audit, on the full-length capture.
- **Suggested area to investigate:** app.js — the agreement's terms and its printout, a lease's taxes and fees

## Minor (31)

### RP-UI-029 — All (app-wide) · Desking accessories, search fields, filter sheet

- **Screenshot:** `current/09-desking/02-pencil-finance.png`
- **Issue:** The touch floor is 40px for every control (owner, 2026-08-31), but harness/touchfloor.mjs audits only pressable controls — button, link, role=button. Extending it to native form fields measured 14 real shortfalls on 2026-08-31. Still open, as measured then: the test-drive delivery-preference rows at 22, the inventory search field at 21 and the deals search field at 25, the .switch control at 46x26, and the client-link demo option row at 30. Closed since: #mMaxPrice at 38, with the vehicle-selection package (v025), and the eight desking accessory checkbox rows at 20, which are the kit's option cards in v043.
- **Observation:** Found by widening the audit on 2026-08-31 and measured, not estimated. It was not restyled in that change: the job there was to implement the owner's ruling on the NUMBER, and lifting 14 form controls is a design change across desking, inventory search and the filter sheet that deserves its own review. The harness states the scope boundary at its selector rather than implying coverage it does not have. v043 did not re-measure the fields still open; the next audit with the widened harness will.
- **Suggested area to investigate:** portal.css .switch, .m-search input, #dealSearch, the test-drive delivery rows, the client-link demo option row (the desking rows and #mMaxPrice are closed and listed as history)

### RP-UI-031 — Home — Active Floor & Navigation · My deals (landing — Advisor)

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** Three gaps in the owner UI kit (v022.2) that the 19 chrome screens inherit: the wordmark (.rp-wordmark, 116x23) and the resolver search action (.rp-button-navy, 73x36) carry no 40px hit extension — and the Team Lead's date control (.rp-filter__control, 58x20), the only way into the date range / funded history sheet, has none either, where v021 drew it as a 40px pill — against the kit comment that every interactive element has one and the 40px floor for everything (owner, 2026-08-31); .rp-page reserves a flat 104px on a destination and 140px on a task beside bars whose height grows with env(safe-area-inset-bottom), masked today only because index.html carries no viewport-fit=cover; and .rp-search__input drops its outline with no :focus-within on the field, so keyboard focus on the search is invisible. harness/touchfloor.mjs exits 1 on the first two, deliberately.
- **Observation:** Reported, not patched: the kit is the owner design asset and is never restyled in this repo (CLAUDE.md), so these wait for kit v022.3. THREE ::before hit-extension rules (the wordmark, the resolver search action and the Team Lead date control) and one focus ring close four of the five; the fifth, .rp-page's flat 104/140px reservation beside bars that grow with env(safe-area-inset-bottom), is a layout change and is closed by neither — it stays listed here so the remediation cannot read as complete while it is outstanding. The wordmark shows on every Home screen; the search action on the resolver (current/02-customer-onboarding/01-resolver-idle.png). Filed with library v022, the first version captured on the kit. harness/touchfloor.mjs walks its routes as the Advisor, so the Team Lead's date control is outside what it measures; the library's own check flags it on four Home screens.
- **Suggested area to investigate:** ride-price-portal/assets/ride-price-mobile.css (the owner UI kit) — v022.3, never here

### RP-UI-034 — Scan Driver's License · Confirm customer (certain match)

- **Screenshot:** `current/03-license-scan/07-scan-confirm.png`
- **Issue:** The identity column on the customer card is squeezed beside the “License match” pill: the name “Cheri Bridwell” breaks onto two lines and the one-sentence subtitle “Existing customer · license ending 0102” onto four. In v021 both fit on one line each. The kit's Inter is wider than the device face the screen was laid out for, and the card gives the pill its full width first.
- **Observation:** A layout on a kit screen, not the kit: the pill could wrap under the identity, or take a fixed width and let the column keep the rest. The only one of the eleven scan screens the face change hurt. v043: milder. The name now fits on one line; the subtitle still leaves "0102" alone on a second line.
- **Suggested area to investigate:** app.js / portal.css — the scan flow's confirm card (identity column vs. match pill)

### RP-UI-050 — Vehicle Selection · Inventory — sort and segmented controls

- **Screenshot:** `current/06-vehicle-selection/03-inventory.png`
- **Issue:** Two more kit controls sit under the 40px touch floor at 390px, and neither is covered by RP-UI-031: the inventory sort control (.rp-sort, 117x19) and the segmented control on the training-documents screens (.rp-segment__item, 172x36, on both Licenses and Registrations). The sort control is the smaller breach by far — 19px tall is under half the floor, and it is the only way to reorder the list. RP-UI-031 filed the same class of gap for .rp-wordmark (116x23) and .rp-button-navy (73x36) at library v022 and noted that harness/touchfloor.mjs exits 1 on them deliberately; these two arrived later, with the vehicle-selection and training-documents packages, and were never added. touchfloor now reports five, of which only two were on the list.
- **Observation:** Reported, not patched: the kit is the owner's design asset and its classes are never restyled in this repo (CLAUDE.md), so this waits for a kit revision alongside RP-UI-031 — two more ::before hit-extension rules would close these two, and with the three RP-UI-031 already asks for (.rp-wordmark, .rp-button-navy and the Team Lead's .rp-filter__control) that is five control types in all. Measured by harness/touchfloor.mjs across 769 painted controls on 22 routes at 390px; the fifth control it reports, .rp-wordmark, is already in RP-UI-031.
- **Suggested area to investigate:** Touch targets

### RP-UI-055 — Customer document request (from the jacket) · Jacket after sending — Requested

- **Screenshot:** `current/16-document-request/04-request-sent.png`
- **Issue:** The inline status the send returns is laid under the jacket's sticky funding sign-off dock. After sending, the status line and the View status control sit at the bottom of the customer group and the dock covers them: in the capture the gradient resend button is clipped to a sliver and the status line beneath it is hidden behind the dock's own FUNDING SIGN-OFF heading. The same overlap is visible once the customer has started uploading (current/16-document-request/07-request-progress.png), where only a few characters of the status banner show through from under the dock. The V2 package moved delivery status inline precisely so it would be read without leaving the jacket, and the dock hides it.
- **Observation:** Surfaced by the coverage work — the sent and in-progress jacket states had never been captured. Scrolling reveals the line, so nothing is lost permanently; it is the resting state that is covered. v043: worse on the in-progress state, where the status banner is now wholly under the sign-off dock; the dock also cuts through "Request 3 documents" on the jacket before any send. v044: right after the send the jacket now scrolls the status line into view above the dock (04-request-sent), so the sent state reads; once the customer has started uploading it is under the dock again (07-request-progress), and the dock still cuts through "Request 3 documents" before any send.
- **Suggested area to investigate:** app.js — the deal jacket's customer group and sign-off dock

### RP-UI-075 — Customer Onboarding — the Customer Resolver · Find customer — the resolver

- **Screenshot:** `current/02-customer-onboarding/01-resolver-idle.png`
- **Issue:** The resolver's license rows explain themselves: "Best when the customer has the license in the showroom." and "Customer has a license photo on their phone. It uploads directly to Ride Price." The same doors on the co-buyer and driver missions add "Same scan and confirm flow", "Search by name, phone, email, or license." and "Scan, then confirm."
- **Observation:** Helper text, which the kit (no lede, no helper text) and the owner's 2026-09-28 "Don't add unnecessary text to the screen" rule out; the titles "Scan physical license" and "Send secure upload link" stand on their own. Also on the test drive's Add driver and the buyers' Add co-buyer. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the resolver's doors, and the mission doors that reuse them

### RP-UI-076 — Customer Onboarding — the Customer Resolver · Customer identified (advisor)

- **Screenshot:** `current/02-customer-onboarding/13-remote-ready.png`
- **Issue:** The remote session's step list changes between the waiting screen and this one ("Link sent" becomes "Secure session", the photo steps swap places, a "Second license side" step appears), and the new step carries a policy line instead of a status: "Request later only when a workflow needs it".
- **Observation:** The advisor follows one session across the two screens, so its steps should keep their names and order, and every step line should be a status. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the resolver's remote session steps

### RP-UI-077 — Scan Driver's License · Review both sides (readable pair)

- **Screenshot:** `current/03-license-scan/13-scan-pair-review.png`
- **Issue:** "Review both sides" opens with a lede and a demo sentence set tight under the title: "Compare the name and license number on the front with the barcode details. The demo does not compare them automatically." Only one photo is on the screen.
- **Observation:** The checkbox already carries the instruction, and the DEMO band already marks the demo. The screen asks for a comparison of two sides but shows one. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the scanner's pair review

### RP-UI-078 — Discovery — the guided consultation · Stage 1 — the sample slide

- **Screenshot:** `current/05-discovery/01-stage-intro.png`
- **Issue:** Every Discovery stage ends with a line explaining its two controls: "Tap ✓ when they're done, × to redo", "Tap ✓ to keep, × to redo", "Tap ✓ to see the options". The first calls the customer named in the top bar "they".
- **Observation:** Helper text under the owner's rule, and a pronoun where the owner's style is a name. If ✓ and × need names, they belong in the controls' accessible labels. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Discovery stage's hint line

### RP-UI-079 — Test Drive Agreement · Insurance company (sheet)

- **Screenshot:** `current/07-test-drive/03-insurance-sheet.png`
- **Issue:** The test drive's sheets describe themselves: "One field, carried onto the agreement.", "Identify the driver through the Customer Resolver.", "One final odometer reading closes the session."; the license exception adds "Nothing else about the customer is asked again."
- **Observation:** Explanations of the app, not labels or statuses; the titles and field labels already say what each sheet is for. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the test drive's sheet subtitles and license exception

### RP-UI-080 — Credit Application (Lending Lane) · Step 4 — Review, signature needed

- **Screenshot:** `current/11-credit-application/12-review-step.png`
- **Issue:** The credit application explains itself: "The only applicant field the record does not hold.", "Verified on the previous step · tap to review, nothing to retype", "From the record — nothing to retype"; and the consent ends "Demo — no real inquiry ever occurs."
- **Observation:** The authorization is a disclosure and stays; the demo sentence and the helper lines are the copy the kit and the owner's rule exclude. "From the record" works alone as a label. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the credit application's steps and consent

### RP-UI-081 — Buyers on the Deal (Co-Buyer) · Back on the deal — the new co-buyer attached, the sheet reopened

- **Screenshot:** `current/12-buyers-and-co-buyer/11-created-receipt.png`
- **Issue:** The buyers sheet here opens with "One primary buyer. Add a co-buyer only when the deal needs one.", and is drawn in an older design: uppercase labels, bordered cards, a purple "Primary" pill and no close. The same sheet elsewhere in the flow is the kit's, with neither.
- **Observation:** One sheet, two designs in one flow, and the older one has no way to close. The receipt should be the kit sheet showing the new co-buyer's row. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the buyers sheet reopened after a co-buyer is created by hand

### RP-UI-082 — Finance Menu — Sign-Off Gate and Four Stages · Custom package — figure withheld

- **Screenshot:** `current/14-finance-menu/09-options-custom.png`
- **Issue:** Under the masked "$●●●.●●" the card adds "Reveal it when you are ready to present" above the "Show custom payment" button.
- **Observation:** The button says what it does; the line only coaches. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Finance Menu's custom package card

### RP-UI-083 — Deal Jacket & Compliance · Add optional document

- **Screenshot:** `current/15-deal-jacket/07-add-optional.png`
- **Issue:** The optional-document sheets explain the counting: "9 available · counted separately from the required package", "unchanged — optional documents are counted separately", and on Remove "Taken in by hand. The jacket keeps the record, not the paper. Counted as an optional document — it is not part of the required package." The readiness card adds a paragraph after its count.
- **Observation:** The values already make the point ("Required package 15 items", "After adding 5 of 15 · 2 optional"). Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Deal Jacket's optional documents and readiness card

### RP-UI-084 — Client Document Upload (customer's phone) · Upload your documents

- **Screenshot:** `current/17-client-document-upload/02-landing.png`
- **Issue:** Demo sentences on the customer's own pages: "Training demo · files stay on this device.", "PDF preview unavailable in this demo.", and on the advisor's request status "The customer's phone is played by this same browser — open it to run the upload side of the demo."
- **Observation:** The "Demo · advisor view" pill already marks the demo on the customer's own pages, which draw no DEMO band (the owner's ruling, kept by KA-009), and the advisor's pages draw the band. The "simulate an unreadable photo" checkbox is a control the training needs, and stays. Found by the v043 audit; the observation amended by the v047 audit.
- **Suggested area to investigate:** app.js — the client link's pages and the request status sheet

### RP-UI-085 — Document Review (advisor) · Document actions (overflow sheet)

- **Screenshot:** `current/19-document-review/05-document-actions.png`
- **Issue:** Document review explains its gestures and its storage: "Double-tap or pinch the document", "Only the receipt record is saved between sessions.", "The client link and the jacket queue both offer the retake." "Replace license images" has no icon or chevron, so it reads as a label.
- **Observation:** Found by the v043 audit.
- **Suggested area to investigate:** app.js — Document review's action sheet and viewer

### RP-UI-086 — Documents — Print Center & Printables · Preview — MV-82 (training sample)

- **Screenshot:** `current/20-print-center/05-print-mv82.png`
- **Issue:** The printed MV-82 carries a paragraph about the app: "Recreates the New York vehicle registration / title application for training. A box the portal cannot fill from the deal is printed empty for hand completion — the app never invents a value."
- **Observation:** A form handed to a customer explains the software that printed it. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the print center's MV-82

### RP-UI-087 — Home — Active Floor & Navigation · More sheet — secondary navigation

- **Screenshot:** `current/01-home-and-navigation/02-more-sheet.png`
- **Issue:** The More sheet's row reads "New customer visit — Open the customer resolver", and the manual form's way back "Back to resolver". The screen they name is titled "New visit" and "Find customer"; "resolver" appears nowhere on it.
- **Observation:** Internal wording; the labels should use the screen's own names. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the More sheet and the manual form's back link

### RP-UI-088 — Home — Active Floor & Navigation · Active floor (Team Lead)

- **Screenshot:** `current/01-home-and-navigation/04-team-lead-floor.png`
- **Issue:** The Team Lead's floor counts a Discovery deal as Desking: the chip reads "Desking 2" over one Desking card and one Discovery card. With "All 0" chosen, the empty state says "No deals in this stage — Choose another stage or start a new visit."; on a search miss, "No showroom visits" titles "None match this search."
- **Observation:** Each count and title should say what is true: a stage's own deals, no active deals, and nothing found for the search. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Home floor's stage chips and empty states

### RP-UI-089 — Customer Onboarding — the Customer Resolver · Waiting for customer — sent to a helper's number

- **Screenshot:** `current/02-customer-onboarding/20-helper-waiting.png`
- **Issue:** The banner says the link went to "(929) 555-0143 (a helper's number)", but the Channels card lists the same number as plain "Mobile · (929) 555-0143". The cancel confirm reads "Nothing the customer has not sent yet is lost.", and the whose-upload subtitle breaks its ISO date mid-way ("born 1983-09-" / "08").
- **Observation:** The helper's number reads as the customer's own mobile, the confusion this path exists to prevent; a destructive confirm should say plainly what goes; and the app writes dates as MM/DD/YYYY elsewhere. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the resolver's helper-number path

### RP-UI-090 — Test Drive Agreement · License needs attention — expired, with its date

- **Screenshot:** `current/07-test-drive/24-license-expired.png`
- **Issue:** The row says "Expired 01/01/2020" and the dock "License expired", but the row's badge says "Incomplete". On the driver mission's third step the top bar reads "New visit" and the "Adding a test-drive driver" notice is gone.
- **Observation:** The badge should agree with the row, and the mission should keep its own name to the end. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the test drive's license row and the driver mission's last step

### RP-UI-091 — Trade-In Evaluation & Proof of Ownership · Run evaluation — a negative odometer refused

- **Screenshot:** `current/08-trade-in/10-refused-odometer.png`
- **Issue:** With "-5" in Mileage the message reads "Add the mileage — the evaluation is calculated from it", as if the box were empty; and with "2018 Honda Civic" typed, the card still reads "Trade vehicle" while the dock reads "2018 Civic".
- **Observation:** The neighbors name the rule broken ("a payoff cannot be negative"); this one should say mileage cannot be negative. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Trade-In's appraisal refusals and card title

### RP-UI-092 — Desking — Calculate Payments · Present — Your total (Cash)

- **Screenshot:** `current/09-desking/12-present-cash.png`
- **Issue:** The cash presentation shows "Your price $41,431.00", "Your trade credit +$4,750.00", "Included $3,396.13" and "Total due $39,577.13"; the parts add up to $40,077.13. The $500.00 rebate that closes the gap is not on the screen.
- **Observation:** A customer adding up the screen gets a total $500 higher than the one shown (chrome rule §17: the column adds up). Compare shows "Rebate −$500.00". To build with the owner's answers on Present and Compare (DK-050). Found by the v043 audit.
- **Suggested area to investigate:** app.js — route desk/:id, Present on a cash deal

### RP-UI-093 — Desking — Calculate Payments · Pencil — sent for approval

- **Screenshot:** `current/09-desking/14-work-submitted.png`
- **Issue:** The "Sent to Jordan Reyes for approval" status row is broken: its check icon sits alone on the first line and the words drop to the next, flush left, under a row laid out correctly.
- **Observation:** Found by the v043 audit.
- **Suggested area to investigate:** app.js — the pencil's approval notice

### RP-UI-094 — Base Payment Agreement · Agreement — ready to sign

- **Screenshot:** `current/10-base-payment-agreement/01-agreement-unsigned.png`
- **Issue:** "Acknowledgement" in the dock note ("Ready for acknowledgement"), the sign panel's line ("The typed name is recorded as the acknowledgement signature", itself helper text) and the printout's title, "Customer Acknowledgement of Basic Terms of Agreement"; the Finance Menu's acknowledgment says "the options initialled". The US spellings are "acknowledgment" and "initialed", as the buyers sheets write it.
- **Observation:** The owner's rule is US spelling everywhere. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the agreement's dock and printout, the Finance Menu's acknowledgment

### RP-UI-095 — Buyers on the Deal (Co-Buyer) · Change roles after the lane — the lender line

- **Screenshot:** `current/12-buyers-and-co-buyer/17-lane-roles-confirm.png`
- **Issue:** The sheet says the deal has a submitted joint application, yet the chip reads "Jacket · 4 of 16"; the same post-lane deal reads "6 of 16" on the screens before it (v044; at v043, 4 of 15 and 5 of 15: the co-buyer's identity record now counts in both).
- **Observation:** Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Jacket chip on the buyers sheet after the lending lane

### RP-UI-096 — Finance Menu — Sign-Off Gate and Four Stages · Stage 1 — a one-pay deal's terms

- **Screenshot:** `current/14-finance-menu/28-terms-onepay.png`
- **Issue:** The one-pay reads "$12,459.96 total", "paid in full at signing", yet its Taxes & fees row reads "$1,027.50 + $28.21 / mo": a monthly amount on a deal with no monthly payments. The lease packages' four pills run into their borders, the last about 2 px from the edge.
- **Observation:** A one-pay's tax is in its payments, paid up front, as the desk's itemize sheet says. Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Finance Menu's terms row on a one-pay, and the lease package pills

### RP-UI-097 — Deal Jacket & Compliance · Deal Jacket — funding readiness

- **Screenshot:** `current/15-deal-jacket/01-jacket-overview.png`
- **Issue:** Count templates read badly at small numbers ("The other 0 are deal forms your team completes.", "Capture all 2 here instead"); the insurance, delivery and TQI rows use a check-mark icon beside "Needed"; toasts land on controls on the customer's phone.
- **Observation:** Found by the v043 audit.
- **Suggested area to investigate:** app.js — the Deal Jacket's counts and row icons; the client link's toasts

### RP-UI-098 — Client Document Upload (customer's phone) · Other income type — noted

- **Screenshot:** `current/17-client-document-upload/13-other-income.png`
- **Issue:** After Other income type, the sheet says "Ashley knows you're paid another way — Ashley will ask you for another proof of income", yet still reads as needing two paystubs.
- **Observation:** Found by the v043 audit.
- **Suggested area to investigate:** app.js — the client link's paystub sheet after another income type

### RP-UI-099 — Snap All — burst capture · Auto-sort results

- **Screenshot:** `current/18-snap-all/04-results.png`
- **Issue:** The insurance card is filed under the heading "Verified 1" although its row reads "Accepted with exception — Expires within 45 days" with the "Exception accepted" badge.
- **Observation:** An exception is not a verification. Found by the v043 audit.
- **Suggested area to investigate:** app.js — Snap All's results groups

### RP-UI-100 — Documents — Print Center & Printables · Preview — Deal Cover Sheet

- **Screenshot:** `current/20-print-center/07-print-cover.png`
- **Issue:** The cover sheet prints "Deal Type / Stage: Finance · Menu" for a deal the Documents screen calls "FINALIZED WITH DOCUMENTS OUTSTANDING". The printed quote's note reads "Quick quote saved 9/28/2026, 11:46:53 AM" under a header dated "Sep 28, 2026".
- **Observation:** Found by the v043 audit.
- **Suggested area to investigate:** app.js — the print center's cover sheet and quote

## Observation (9)

### RP-UI-023 — Home — Deals Queue & Navigation · My Deals (landing — Advisor)

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** No authentication exists: the portal opens straight on the floor queue, with the Advisor / Team Lead role sheet standing in for identity — opened only in Customer Onboarding since 2026-09-18 (owner ruling B), not from the queue's top bar.
- **Observation:** By design for a demo/training tool — documented here so the absence of a login flow is not read as missing documentation.
- **Suggested area to investigate:** n/a

### RP-UI-037 — Home — Active Floor & Navigation · My deals (landing — Advisor)

- **Screenshot:** `current/01-home-and-navigation/01-deals-queue.png`
- **Issue:** The VIN + STK identifier line is the smallest and lightest text on the deal card — 10.5px in the muted grey (rgb 115,115,125 on white, about 4.7:1, AA by a hair and marginal in sunlight) — while the flow calls VIN and stock two of the four load-bearing identifiers on every row, and the standing rule is that load-bearing text is ink because the app is used outdoors. v021 drew it darker and in mono.
- **Observation:** The kit's .rp-card__meta draws it this way on purpose (text face, tabular figures, muted) and the kit is the binding artifact, never restyled here — so this is a question for the kit's next revision, not a portal.css change. The flow note that still called the line mono was corrected with v022.
- **Suggested area to investigate:** ride-price-mobile.css .rp-card__meta (the owner UI kit) — a kit decision

### RP-UI-043 — Customer Onboarding — the Customer Resolver · No license available — manual fallback

- **Screenshot:** `current/02-customer-onboarding/08-manual-fallback.png`
- **Issue:** The manual fallback is now the task title, three fields (name, mobile phone or email, address) and the box for someone helping. The note that made it fallback-only (“if a license or license photo becomes available, use it instead”) is gone, and no field is marked required until validation says so.
- **Observation:** The chrome rule removed helper copy from the 19 screens by design; the two rules still hold in validation (the form requires a first and last name, one way to reach the customer, which is a phone or an email, or a helper's number or address with the box ticked (LS-058), and an address with a ZIP). Whether the fallback-only rule needs a line on the screen is the package's call — filed so the change is on record, since the library's step note used to describe the copy. v046: the fields are what the kit asks for; unless the owner wants the fallback rule on the screen, this closes as by design.
- **Suggested area to investigate:** app.js — the resolver's manual fallback on the kit

### RP-UI-046 — Training Documents · License preview — both sides

- **Screenshot:** `current/04-training-materials/02-license-preview.png`
- **Issue:** The prop now renders on screen in the kit's Inter while it still PRINTS in the app font, so the preview sheet — a screen whose only job is to show what will come out of the printer — no longer matches the paper. With byte-identical prop data the card reflows between the two: the field line that breaks one way on screen breaks another way in print.
- **Observation:** Both halves are deliberate and both are right on their own. The hub is a kit screen, so `body[data-canvas="kit"]` gives it Inter; `@media print` forces `--app-font` on paper, which is what keeps every printable byte-identical to main (printcmp, 0 of 11 differ). What nobody decided is that a preview may disagree with its own print. The fix is a decision, not a patch: either the prop artwork pins its own face in both media, or the preview is stated to be indicative.
- **Suggested area to investigate:** portal.css — the prop families (prop-card, reg-card) and the print face

### RP-UI-048 — Vehicle Selection · Notification — vehicle reserved

- **Screenshot:** `current/06-vehicle-selection/15-vehicle-reserved.png`
- **Issue:** On the reserved alert every load-bearing word is muted grey: the title "Vehicle reserved" samples the kit's ink, but the body that carries the vehicle, the stock number, who signed, at what time and that this deal stays open is `.rp-alert__body` at 12.5px in `--rp-muted` (#6E6E78). The standing rule is that load-bearing text is ink, because the app is used outdoors.
- **Observation:** The kit defines the component that way and the app uses it as given, so this is the kit's decision to revisit — the same shape as RP-UI-037 on the deal card's VIN line. Worth pairing with that one when the palette is settled.
- **Suggested area to investigate:** ride-price-mobile.css .rp-alert__body (the owner UI kit) — a kit decision

### RP-UI-101 — Desking — Calculate Payments · Accessories (sheet)

- **Screenshot:** `current/09-desking/22-accessories-sheet.png`
- **Issue:** Every kit sheet's close is a 32 px circle (the library's check reads ".rp-sheet__close 32x32" on 60 screens), under the owner's 40 px floor though its ::before reaches 40; the stage chips and the presentation's product chips are 32 px tall; the presentation's "Buyer" control is 55 × 20.
- **Observation:** Kit components, so a kit matter, alongside RP-UI-031 and RP-UI-050. Found by the v043 audit.
- **Suggested area to investigate:** ride-price-mobile.css — .rp-sheet__close, .rp-chip (the owner UI kit)

### RP-UI-102 — Customer Onboarding — the Customer Resolver · Customer found — confirm + registration address

- **Screenshot:** `current/02-customer-onboarding/04-customer-found.png`
- **Issue:** The sample emails use testing.com, a registered public domain: "jsmithtest@testing.com", "cbridwell@testing.com", "malvarez@testing.com", and the placeholder "name@testing.com".
- **Observation:** Not a business name on the screen, so outside the rule as written; a reserved domain (example.com) or a Ride Price one would name no one. The owner's to rule. Found by the v043 audit.
- **Suggested area to investigate:** data.js — the seed's emails; app.js — the placeholder

### RP-UI-103 — Desking — Calculate Payments · Game plan — the huddle

- **Screenshot:** `current/09-desking/01-huddle-gate.png`
- **Issue:** Text about John uses they and them: "How are they paying?", "Send a secure link to their phone", "A co-buyer applies with them."
- **Observation:** The owner's style is names: "How is John paying?", "Send a secure link to John's phone" (W-088). Found by the v043 audit. The Game plan's two Discovery questions ("Is the incentivized rate or the rebate better for them?", "Do they trade frequently?") went with the owner's Game plan cut (D-SM6, v049).
- **Suggested area to investigate:** app.js — the huddle's tracks and the credit application's lines

### RP-UI-104 — Scan Driver's License · Confirm customer — the name changed

- **Screenshot:** `current/03-license-scan/28-scan-name-changed.png`
- **Issue:** On The name changed, Edit license details is drawn under the dock until the page is scrolled: the scanned address takes two lines, the page grows past the dock, and the first paint shows Ask a Team Lead where the link is. Scrolled to the end, the link sits clear of the dock (its box overlaps the dock's top by 4 px; a tap lands on the link).
- **Observation:** The library's overlap check reads it at first paint. Nothing is lost, since the page scrolls, but the one way to put a misread right is out of sight on the case that most needs it. Found by the v044 audit.
- **Suggested area to investigate:** Confirm customer: the page and its dock

## Automated checks per screen

The capture run measures each screen for horizontal overflow, elements beyond the viewport, clipped text, text overlap, small touch targets, a sheet that does not fit the screen (its top above the screen with nothing to scroll it, or its Close off the screen), text under the contrast floor (WCAG 2.x: 4.5:1, or 3:1 for large text; text on a gradient is measured under the text itself, text on an image and disabled controls are not), a control a screen reader meets with no name (read from the browser's accessibility tree), text that shows a value the page failed to make (NaN, undefined, null, Infinity, [object Object]), one id on two elements, a picture that did not load, and an error the page logged (an uncaught exception, console.error, a resource that did not load). Two thresholds are in play and they are not the same: this capture script flags anything under **36px**, while the touch floor itself is **40px for every control** (owner, 2026-08-31 — one number, no small-variant tier). So a target in the 36-39px band is reported only by the eye, and anything under 36px is caught by both. `harness/touchfloor.mjs` is what actually enforces the floor across every route — for pressable controls (`button`, links, `role=button`); native form fields sit outside its selector, and their measured shortfalls are RP-UI-029's finding, not this harness's coverage. These are hints that were reviewed by eye; the findings above are the reviewed result. Raw values live in `flow-manifest.json` under each screen's `checks`.

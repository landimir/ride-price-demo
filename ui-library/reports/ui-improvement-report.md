# Ride Price Mobile UI — Improvement Report

Improvement view v001 · built on flow library v003 (app d2e1c8b) · updated 2026-08-23

This report takes each product area of the Ride Price mobile experience, starts from the comment cards the screenshot library already carries, deepens them, adds what the screenshots themselves show, and attaches what stronger mobile apps do (Mobbin references) — then translates each lesson back into Ride Price's own vocabulary: navy foundation, the orange-to-pink gradient for the one main forward action, Poppins, one button radius, the existing component families. Nothing here redesigns Ride Price into another brand.

**Areas are reviewed one at a time.** 1 of 20 so far; the rest are listed at the end in the order they will be taken.

| | Count |
|---|---|
| Recommendations | 7 |
| Existing Comment Expanded | 2 |
| Newly Detected UI Issue | 3 |
| Pattern Opportunity | 2 |
| High priority | 3 |
| Medium priority | 1 |
| Low priority | 3 |
| Severity Critical | 0 |
| Severity Major | 2 |
| Severity Minor | 3 |
| Severity Observation | 2 |

Finding types: **Existing Comment Expanded** — the library already flagged it and this deepens it · **Newly Detected UI Issue** — found by looking at the screenshot · **Pattern Opportunity** — nothing is broken, a better structure exists. Severity keeps the audit's scale; priority is the order to fix in, and a Minor that repeats across screens can be High.

## Home — Deals Queue & Navigation

6 screens · reviewed 2026-08-23 · 7 recommendations

**Screens:** 01 Active Deals (landing) · 02 Navigation drawer · 03 Reset demo data — confirm · 04 Pipeline filter — no match · 05 Role switched to Team Lead · 06 Funded contracts auto-archived

**Documented issues before this review:** RP-UI-023 (Observation) on 01 Active Deals (landing); RP-UI-017 (Minor) on 06 Funded contracts auto-archived

### Owner direction — Role-aware queue (owner concept, 2026-08-23)

The owner answered the Home module with a concept of his own: the Team Lead and the advisor do not use the queue the same way, so the amount of guidance and the density change by role while the core deal information stays identical. Both roles see the same four identifiers in the same positions; the manager gets compact rows to sweep 40–50 deals fast, the advisor gets the same rows plus a next-step line because they hold fewer deals and need to know what to do next.

**Principles:**
1. Information priority, a hard rule: 1 customer full name · 2 full VIN · 3 stock number · 4 deal stage. Always visible on every deal row, never hidden or demoted by a later redesign; the vehicle description sits under them.
2. Team Lead view = high-density queue: compact rows, stage badge aligned right, the whole row is the tap (navigation), no repeated buttons, no progress bars, no tall cards. Goal: scan the whole floor.
3. Advisor view = guided queue: same rows and positions, plus one 'Next: …' line per deal naming the workflow action (Calculate payments, Upload insurance binder, Complete credit application, Review F&I products). Goal: know what to do next.
4. Navigation and action are different things: tapping a row opens the deal; the Next line is the work. Nothing on the queue should look like a primary button that is only navigation.
5. Filters are an operational dashboard: Active Deals (n), then All / Desking / F&I / Docs / Done with counts — the count pattern borrowed from the references, the look staying Ride Price.
6. One design language for both roles; only density and guidance change. Ride Price identity preserved: navy, the gradient for meaningful emphasis, rounded containers, stage colours.

**Open choices before building:**
- Light, not dark: the concept is drawn as a dark interface; the real phone surface is light (#f2f2f8) with white cards, and the app's rule is that a concept shows where things go, not what the colours are. Adopted as layout and hierarchy on the existing light surface unless the owner decides otherwise.
- + New Customer Visit is missing from the concept — it is the queue's one forward action and the way a visit starts. It must keep a home (bottom bar, or under the pills — RP-IMP-001).
- The concept's bottom tab bar (Deals · Search · Customers · Menu) is app-wide chrome, not a queue change — the app uses the hamburger drawer everywhere. Adopting tabs is a separate decision that touches every screen (the same call the owner made on the jacket mockups' chrome).
- Row chevrons: the owner removed per-card chevrons from this screen on 2026-08-21 ("stray characters"); the concept brings them back as the 'row is tappable' cue. One or the other.
- The DEMO chip and the Advisor / Team Lead switch are standing rules (visible demo marker; the switch stands in for identity). The concept's DEALS chip and AB avatar would replace them; the avatar could open the role switch, the DEMO chip stays.
- Stage vocabulary: the app has three buckets (Desking, F&I / Docs, Funded) and chips DESKING / F&I READY / FUNDED; the concept has five (Desking, Credit, F&I, Docs, Done). Five maps cleanly onto the deal stages (credit · menu · forms/jacket · complete) and is the better dashboard — adopting it means the chips and pills change together.
- Already true in the data: deals carry an advisor, and the list is already 'mine' for an advisor and 'all' for a Team Lead — so 'My Deals (n)' vs 'Active Deals (n)' costs only the title. VINs are on the catalog for every vehicle.

Converges with: RP-IMP-002 (Done / Funded becomes a pill with a count — the owner concept confirms it); RP-IMP-003 (the advisor row carries an explicit Next line — confirmed; the concept drops it from the Team Lead view on purpose); RP-IMP-001 (the concept moves navigation to a bottom bar — the thumb-zone point, answered differently; see the open choices)

**What already works:** The landing screen is genuinely calm: one title carrying the live count, one gradient action, one search field, three pills with counts and a clean whole-card deal tile with its status chip pinned to the corner — nothing competes, which is exactly what the best work-queue screens do. The role switch is a visible segmented control and its toast names the acting person, so the no-login decision reads as deliberate rather than missing. The drawer orients a first-time user well (dealership, advisor name and role, WORKFLOW vs RESOURCES) and keeps the destructive reset at the very bottom behind a branded confirm whose red button is the only danger-styled control in the flow. Empty states speak instead of going blank.

**Strongest recommendations:**
1. Put the one forward action where the thumb is: on a phone, anchor + New Customer Visit in a thin bottom bar (or full-width under the pills) instead of the top-right corner — and use the same page-bar rule on Find a Customer and the Training pages, which put their actions at the top the same way.
2. Give finished deals a real control: a fourth pill 'Funded (n)' in the existing pill row, or at minimum a 48px ink-coloured section row with a chevron, instead of the 20px grey 'Archived — funded contracts' text (RP-UI-017).
3. Make the deal card say what comes next ('Next · Game Plan With the Team Lead' in the stage colour) and stop the camera inside a VIN search field promising a VIN scan when it opens the licence scanner.
4. Keep the gradient rare: the drawer's active item should be a tint with an indicator bar, not a second gradient while the page's gradient CTA is still visible behind it.

### RP-IMP-001 — The only forward action sits in the hardest thumb zone while 60% of the screen is empty

- **Screen:** 01 Active Deals (landing) (`current/01-home-and-navigation/01-deals-queue.png`) — also on Home — Deals Queue & Navigation · 04 Pipeline filter — no match; Home — Deals Queue & Navigation · 05 Role switched to Team Lead; Home — Deals Queue & Navigation · 06 Funded contracts auto-archived; Customer Onboarding — Find a Customer · 01 Find a Customer; Training Licenses & Registrations · 01 Training Licenses; Training Licenses & Registrations · 02 Training Registrations
- **Type:** Pattern Opportunity · **Category:** interaction · **Severity:** Major · **Priority:** High · **Fix size:** medium

**A. Current Ride Price screen.** The screen's one gradient action, + New Customer Visit (163×44 at the top-right, y≈75–117), sits in the hardest one-handed reach zone while everything below y≈370 is empty. The same page-top placement repeats on Find a Customer (Scan license / Create Customer at y≈140–180) and on both Training pages (Print at y≈140–195), and the page-bar layout differs between them — home puts the action on the title row, the other pages stack it under the subtitle.

**B. Why it is a problem.** An advisor uses this outdoors, one-handed, many times a day; the most frequent action belongs where the thumb rests. A first-time trainee also reads top-left to bottom-right and meets the search field and pills before the 'start here' control. Three slightly different page-bar layouts make each page feel different without a reason.

**C. Mobbin reference direction — bottom-anchored primary action on a list / queue screen; one page-header rule (title + one primary action).** Work-queue and checkout screens keep the list at the top and the single forward action in a bottom bar or floating button: monday.com's My Work uses one FAB, ClickUp puts Create in the centre of the bottom bar, Careem's add-ons screen pins 'Total | Next' in a bottom bar with a 'Next step' line above it, Booking.com pins the total and Next below a long list. The list stays clean; the action is always under the thumb.
- [monday.com](https://mobbin.com/screens/9407b31a-f185-4f13-bf49-15daa73b3b21) — My Work queue — bucket tiles with counts, one list, a single floating + action bottom-right
- [ClickUp](https://mobbin.com/screens/3e06d063-e0a2-497e-8880-167964137670) — Inbox — search, tabs with counts, filter chips, and Create as the centre action of the bottom bar
- [Careem](https://mobbin.com/screens/160656d3-ef01-4163-87bc-ca4c2abd7551) — Add-ons — list above, a pinned bottom bar carrying the running total and Next, with 'Next step: Date & time' stated above the list
- [Booking.com](https://mobbin.com/screens/4866022b-0da2-40c5-9a0d-0f32c50bf4b5) — Choose your cover — options list, total and Next pinned at the bottom

**D. Ride Price adaptation.** Keep the gradient for exactly this one action and keep the title-with-count, search field and pills as they are. On a phone, anchor + New Customer Visit as a full-width gradient button in a thin white bottom bar (top hairline, the shared 16px button radius, ≥48px tall) — or as a full-width gradient button directly under the pills when the list is short. Desktop keeps the title-row placement. Then apply one page-bar rule across home, Find a Customer and the Training pages (title + subtitle, then the action) so the eye learns one layout. Note: the current one-row title + action layout is the owner's own 2026-08-20 sample, so this is a proposal against his layout, not a defect — his call. **Stays:** Gradient = this one action; the title with live count; the search field; the pill row with counts; the whole-card tap; desktop layout unchanged.

*Implementation note:* route('deals') and renderChrome() page-bar markup in ride-price-portal/assets/app.js; .pagebar / .btn--grad / a new phone-only bottom bar rule in assets/portal.css (inside @media screen and (max-width: 720px)).

### RP-IMP-002 — Finished deals hide behind a 20px grey caption

- **Screen:** 06 Funded contracts auto-archived (`current/01-home-and-navigation/06-funded-archive.png`)
- **Type:** Existing Comment Expanded (builds on RP-UI-017 — accurate but incomplete — beyond the 20px height, the row is muted grey text on the page background (load-bearing text should be ink), its only affordance is a 10px ▼, and it is visually indistinguishable from the empty-state sentence 40px above it; it is also the only way a manager reaches a finished deal once the title reads ACTIVE DEALS (0).) · **Category:** interaction · **Severity:** Minor · **Priority:** High · **Fix size:** small

**A. Current Ride Price screen.** '▼ Archived — funded contracts (1)' (362×20 at y≈378) is a muted 13px text row under the 44px touch floor, styled like a caption, sitting directly under an equally muted empty-state sentence. A Team Lead whose deal just funded sees a (0) title, a grey sentence and a grey row — no obvious control to reach the contract.

**B. Why it is a problem.** Finished deals are what a manager checks most (sign-off, DMS push, funding). Hiding them behind a caption-sized disclosure costs a mis-tap or a moment of 'where did it go' — exactly the hesitation a manager should never have on the home screen.

**C. Mobbin reference direction — segmented filter with a completed / archived segment; collapsible section row with count and trailing chevron.** Queue apps make 'done' a first-class place: ClickUp's inbox has a Cleared tab beside Important and Snoozed, monday.com shows a 'Hide done items' chip so done items are a visible toggle, Outlook's drawer lists Archive as a full-height row with its count. Done is a filter, not a footnote.
- [ClickUp](https://mobbin.com/screens/3e06d063-e0a2-497e-8880-167964137670) — Important · Other 1 · Snoozed · Cleared — finished items are a tab with the same weight as the others
- [monday.com](https://mobbin.com/screens/9407b31a-f185-4f13-bf49-15daa73b3b21) — 'Hide done items' as a visible, tappable chip at the top of the queue
- [Microsoft Outlook](https://mobbin.com/screens/5516b226-0b53-45f0-abf7-a4c9e69fbf86) — Archive as a full-height drawer row with a count badge, same size as Inbox

**D. Ride Price adaptation.** Preferred: add 'Funded (n)' as a fourth pill in the existing pill row — same 44px pill component, navy when active, green dot like the FUNDED chip — so finished deals are one tap away and the pills stay the only filter mechanism. Minimum: restyle the disclosure as a full-width 48px row in ink (navy 700) with the count in a navy pill on the right and a chevron that rotates on open, separated from the empty-state sentence by a hairline. Owner concept 2026-08-23: Done becomes a pill with its count in the same row — the preferred option above, confirmed. **Stays:** The card itself (FUNDED chip, whole-card tap), the empty-state sentence, the no-per-card-delete rule.

*Implementation note:* .dl-archive summary in assets/portal.css and the <details class="dl-archive"> block in route('deals'); the pill row is .dl-pills / dealsUI.pipe.

### RP-IMP-003 — The card does not say what comes next, and the search-field camera promises the wrong scan

- **Screen:** 01 Active Deals (landing) (`current/01-home-and-navigation/01-deals-queue.png`) — also on Home — Deals Queue & Navigation · 05 Role switched to Team Lead; Home — Deals Queue & Navigation · 04 Pipeline filter — no match; Home — Deals Queue & Navigation · 06 Funded contracts auto-archived
- **Type:** Newly Detected UI Issue · **Category:** informational · **Severity:** Minor · **Priority:** Medium · **Fix size:** small

**A. Current Ride Price screen.** The deal card's third line 'Game Plan With the Team Lead' is the next action but carries no 'Next' marker, so it reads as a status or a note. Separately, the camera button inside 'Search stock, customer, or VIN…' (right end of the field, y≈172) opens the licence scanner — but a camera inside a VIN search field universally reads as 'scan a VIN', and on a phone there is no tooltip to correct that.

**B. Why it is a problem.** Two small ambiguities on the first screen a trainee sees: the card does not tell the advisor what to do when they open the deal — the one piece of orientation a queue card should give — and the camera promises inventory lookup and delivers a licence flow (surprise, then back-out).

**C. Mobbin reference direction — list card with an explicit next-step line; icon-only action with unambiguous meaning or a labelled entry point.** Good queue rows carry a one-line status that says what is next or what is wrong: ClickUp rows read 'Task is overdue. Due date was…', Careem states 'Next step: Date & time' under the progress bar, Grab Driver puts the what-happens-next line under the active timeline node. Icon-only actions inside a search field are reserved for searching the same thing (Under Armour's barcode icon in a product search searches products).
- [ClickUp](https://mobbin.com/screens/3e06d063-e0a2-497e-8880-167964137670) — Each row's second line is an explicit status sentence
- [Careem](https://mobbin.com/screens/160656d3-ef01-4163-87bc-ca4c2abd7551) — 'Next step: Date & time' named in plain words under the progress bar
- [Grab Driver](https://mobbin.com/screens/094b300e-f89e-480f-a72a-762788d331f9) — The active step carries a one-line 'what happens next' under it
- [Under Armour](https://mobbin.com/screens/21d5125b-35f1-4b55-a69f-fe55b6e9fe11) — A scan icon inside a product search field scans a product barcode — the icon matches what the field searches

**D. Ride Price adaptation.** Keep the search field and the whole-card tap. Prefix the card's third line with 'Next ·' in the chip's stage colour (orange for Desking, blue for F&I, green for Funded) — a status cue, so no glyph is needed. For the camera: either drop the in-field button (the gradient New Customer Visit and Find a Customer's Scan license already own that entry) or move it out of the field as a small navy-outlined 'Scan license' chip to the right of the search — one of the two, not both. Owner concept 2026-08-23: the advisor view carries 'Next: Calculate payments →' as a line of its own under the identifiers; the Team Lead view omits it for density. **Stays:** Card structure (name, vehicle · stock, status line, chip); the search field; the scanner itself.

*Implementation note:* #dealScanBtn (.dl-search__cam) and .dl-card__next in route('deals'); dealNextAction() supplies the line.

### RP-IMP-004 — The drawer spends the brand gradient on a selected state

- **Screen:** 02 Navigation drawer (`current/01-home-and-navigation/02-navigation-drawer.png`) — also on Home — Deals Queue & Navigation · 03 Reset demo data — confirm
- **Type:** Newly Detected UI Issue · **Category:** visual · **Severity:** Minor · **Priority:** Low · **Fix size:** small

**A. Current Ride Price screen.** The drawer paints the active item 'Deals List' with the orange→pink brand gradient (278×40 at y≈175–213) while the gradient + New Customer Visit button is still visible on the page behind it; the drawer's own 'New Customer Visit' is a dashed gold outline. The gradient is defined in the UI rules as 'the single main forward action on a screen', and here it marks a selection instead.

**B. Why it is a problem.** The gradient earns its meaning by being rare; using it as a selection highlight in global navigation dilutes the one visual rule the app relies on to say 'press this to move forward'. Small, but it is on a surface every user opens.

**C. Mobbin reference direction — navigation drawer with an active-item highlight (tint or indicator bar) distinct from the primary action.** Drawers mark the current place quietly and save colour for actions: Outlook tints the active folder row in the brand blue with a count badge, Spotify and X keep rows plain with the identity header doing the orienting, Nextdoor lists a second identity as an ordinary row. None paint the selected row in the app's CTA colour.
- [Microsoft Outlook](https://mobbin.com/screens/5516b226-0b53-45f0-abf7-a4c9e69fbf86) — Active folder = tinted row + count badge; favourites first; help/settings pinned at the bottom
- [Spotify](https://mobbin.com/screens/5867a8ca-fcc6-4749-b59e-ceccfa7493ff) — Identity header, plain rows, one section label — colour reserved for badges
- [X](https://mobbin.com/screens/296ece73-7630-4846-a67b-8d4772ef70a0) — Profile header with an account switcher; menu rows plain; settings at the bottom

**D. Ride Price adaptation.** Keep the drawer structure, the gold WORKFLOW / RESOURCES labels and the dashed gold 'New Customer Visit' row. Mark the active item with a translucent white tint plus a 3px gold (or orange) left indicator bar, white 700 text — so the dashed gold row is the only accent in the list. The reset confirm dialog is right as it is (red outline = destructive only). **Stays:** Drawer chrome blue, identity header, section labels, the dashed New Customer Visit item, the bottom-pinned reset.

*Implementation note:* The active nav item class in the drawer markup (renderChrome / drawer builder, app.js) and its rule in assets/portal.css (.drawer).

### RP-IMP-005 — A filter with no matches contradicts the title and offers no way back

- **Screen:** 04 Pipeline filter — no match (`current/01-home-and-navigation/04-pipeline-filter-empty.png`)
- **Type:** Newly Detected UI Issue · **Category:** informational · **Severity:** Observation · **Priority:** Low · **Fix size:** small

**A. Current Ride Price screen.** With F&I / Docs (0) selected the list says only 'No deals match that filter.' while the title still reads ACTIVE DEALS (1); the sentence does not say where the one deal is and offers no one-tap way back to All.

**B. Why it is a problem.** A trainee sees '1' in the title and 'no deals' in the list at the same moment — a tiny contradiction that costs a second of doubt; closing the loop in the sentence removes it.

**C. Mobbin reference direction — filtered-list empty state that names the filter and offers a clear-filters action.** Every strong filtered empty state does two things: says the filter is the reason, and gives a button out. Google Drive, Wise, Quizlet and Tabby all pair 'no results with these filters' with a single 'Clear filters' / 'Clear all' button directly under the sentence.
- [Google Drive](https://mobbin.com/screens/f9f86637-40e2-4126-a850-5106dc9cf02a) — 'No matching results' + a Clear filters button; the active filter chips stay visible above
- [Wise](https://mobbin.com/screens/0cdba498-dc6c-40a0-97fb-9acb9b7a417f) — 'Your filters have returned no results' + Clear filters pill
- [Quizlet](https://mobbin.com/screens/0230bbe1-bbd9-4605-96b2-0810ffd26bd4) — Sentence names the filters; one Clear filters button

**D. Ride Price adaptation.** Keep the pills. Change the sentence to name the state ('No deals in F&I / Docs — 1 in Desking') and add a ghost 'Show all' button under it that selects the All pill. Same muted sentence / ink button styling as the other empty state. **Stays:** The pill row, the counts, the existing empty-state styling.

*Implementation note:* paint() in route('deals'), the empty-list branch.

### RP-IMP-006 — No login by design — keep the 'who am I' cue consistent

- **Screen:** 01 Active Deals (landing) (`current/01-home-and-navigation/01-deals-queue.png`) — also on Home — Deals Queue & Navigation · 05 Role switched to Team Lead
- **Type:** Existing Comment Expanded (builds on RP-UI-023 — accurate — it records a decision and stays an Observation; incomplete only in that it does not note where the identity cue lives: the acting person is named only in the drawer header ('Ashley Collins · Client Advisor') and, after a switch, in a 4-second toast ('Now acting as Team Lead — Jordan Reyes'); the app bar shows the role but never the name.) · **Category:** informational · **Severity:** Observation · **Priority:** Low · **Fix size:** small

**A. Current Ride Price screen.** No login is by design; the only persistent 'who am I' cue is inside the drawer, and the role switch confirms itself with a toast while nothing else on the page changes (same list, same CTA).

**B. Why it is a problem.** For a demo/training tool this is acceptable; the only risk is a trainee forgetting they are in Team Lead mode and later meeting (or missing) role-gated steps without knowing why. Not a bug — a cue to keep consistent.

**C. Mobbin reference direction — role / persona switcher with a persistent indicator.** Apps with two identities keep the current one visible where the switch is: X shows the account avatar beside the switcher, Nextdoor lists the second identity as a named row under the profile header, Spotify's drawer header names the account with 'Add account' directly under it. The switch and the name live together.
- [X](https://mobbin.com/screens/296ece73-7630-4846-a67b-8d4772ef70a0) — Account switcher avatar beside the profile header — the current identity is always visible
- [Nextdoor](https://mobbin.com/screens/4e6ef4c3-a9b5-4a54-a33b-1c68a091a873) — Name + place header, then the second identity as a named row

**D. Ride Price adaptation.** Keep the segmented Advisor / Team Lead switch exactly as it is. Make sure the drawer header follows the switch (name and role of the acting person), and on wider phones consider a one-line name under the app-bar switch ('Jordan Reyes'). No login, no avatar, nothing heavier. **Stays:** No authentication; the app-bar segmented switch; the toast.

*Implementation note:* roleName() and the app-bar switch / drawer header in renderChrome(), app.js.

### RP-IMP-007 — Role-aware queue: same four identifiers for everyone, dense rows for the Team Lead, a Next line for the advisor

- **Screen:** 01 Active Deals (landing) (`current/01-home-and-navigation/01-deals-queue.png`) — also on Home — Deals Queue & Navigation · 05 Role switched to Team Lead; Home — Deals Queue & Navigation · 06 Funded contracts auto-archived
- **Type:** Pattern Opportunity · **Category:** structural · **Severity:** Major · **Priority:** High · **Fix size:** medium

**A. Current Ride Price screen.** The queue shows the same card to both roles: name, vehicle · stock, a status line and a chip. It carries no VIN (the identifier a manager and a lender both use), the three buckets lump Credit, F&I and Docs into one pill, and a Team Lead with a full floor would scroll ~110px cards one at a time. The role switch changes who is acting but not what the screen is for.

**B. Why it is a problem.** A Team Lead sweeps 40–50 deals many times a day and needs to see where the floor stands without opening anything; an advisor holds a handful and needs to know what to do next on each. One layout serves neither well: too tall for the manager, too quiet for the advisor.

**C. Mobbin reference direction — dense operational list with right-aligned status and count filters (manager); the same list with a per-row next-step line (individual contributor).** Queue and inbox screens on Mobbin that serve volume use compact rows with a right-aligned status and tabs that carry counts (ClickUp, monday.com); screens that serve one person's work add a one-line 'what next' under the active item (Careem, Grab Driver). The lesson is not either layout — it is that density and guidance are the variables, and the core identifiers are not.
- [ClickUp](https://mobbin.com/screens/3e06d063-e0a2-497e-8880-167964137670) — Tabs with counts, compact rows, one status sentence per row
- [monday.com](https://mobbin.com/screens/9407b31a-f185-4f13-bf49-15daa73b3b21) — Bucket counts above a single dense list
- [Careem](https://mobbin.com/screens/160656d3-ef01-4163-87bc-ca4c2abd7551) — 'Next step: …' stated in plain words above the list
- [Grab Driver](https://mobbin.com/screens/094b300e-f89e-480f-a72a-762788d331f9) — One 'what happens next' line under the active step

**D. Ride Price adaptation.** Adopt the owner's role-aware hybrid on the existing light surface: every row shows name (700), then VIN and stock on one mono line, then the vehicle, with the stage badge pinned right in the existing badge colours; the whole row is the tap. Team Lead (all deals): rows only, ~80px, five pills with counts (All · Desking · Credit · F&I · Docs · Done). Advisor (my deals): the same rows plus a 'Next: …' line in the stage colour from dealNextAction(). Keep + New Customer Visit as the one gradient action (RP-IMP-001 decides where), the DEMO chip and the role switch in the app bar, the drawer as navigation until a bottom tab bar is decided app-wide, and the no-chevron rule unless the owner reverses it. **Stays:** Light surface and white cards; navy / chrome blue; gradient only on + New Customer Visit; DEMO chip; the Advisor / Team Lead switch; the search field; the drawer.

*Implementation note:* route('deals') card template and paint() (the 'mine' filter at app.js ~526 already splits the roles); .dl-card / .dl-pills in portal.css; dealNextAction() for the advisor line; the five-way bucket needs a stage→bucket map beside dealBucket().

## Not yet reviewed — next in line

1. Customer Onboarding — Find a Customer (5 screens)
2. Scan Driver's License (8 screens)
3. Training Licenses & Registrations (2 screens)
4. Discovery Session (3 screens)
5. Vehicle Selection (7 screens)
6. Test Drive Agreement (7 screens)
7. Trade-In Evaluation & Proof of Ownership (4 screens)
8. Desking — Calculate Payments (5 screens)
9. Base Payment Agreement (3 screens)
10. Credit Application (Lending Lane) (4 screens)
11. Buyers on the Deal (Co-Buyer) (4 screens)
12. F&I Product Presentation (4 screens)
13. Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts (16 screens)
14. Deal Jacket & Compliance (11 screens)
15. Send Text Request (advisor → client) (3 screens)
16. Client Document Upload (customer's phone) (10 screens)
17. Snap All — burst capture (4 screens)
18. Document Review (advisor) (1 screens)
19. Print Center & Printables (3 screens)

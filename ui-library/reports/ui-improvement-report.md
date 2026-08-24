# Ride Price Mobile UI — Improvement Report

Improvement view v001 · built on flow library v004 (app da321ec) · updated 2026-08-23

This report takes each product area of the Ride Price mobile experience, starts from the comment cards the screenshot library already carries, deepens them, adds what the screenshots themselves show, and attaches what stronger mobile apps do (Mobbin references) — then translates each lesson back into Ride Price's own vocabulary: navy foundation, the orange-to-pink gradient for the one main forward action, Poppins, one button radius, the existing component families. Nothing here redesigns Ride Price into another brand.

**Areas are reviewed one at a time.** 2 of 20 so far; the rest are listed at the end in the order they will be taken.

| | Count |
|---|---|
| Recommendations | 20 |
| Existing Comment Expanded | 2 |
| Newly Detected UI Issue | 12 |
| Pattern Opportunity | 6 |
| High priority | 8 |
| Medium priority | 5 |
| Low priority | 7 |
| Severity Critical | 0 |
| Severity Major | 7 |
| Severity Minor | 8 |
| Severity Observation | 5 |

Finding types: **Existing Comment Expanded** — the library already flagged it and this deepens it · **Newly Detected UI Issue** — found by looking at the screenshot · **Pattern Opportunity** — nothing is broken, a better structure exists. Severity keeps the audit's scale; priority is the order to fix in, and a Minor that repeats across screens can be High.

## Home — Deals Queue & Navigation

7 screens · reviewed 2026-08-23 · 7 recommendations

**Screens:** 01 My Deals (landing — Advisor) · 02 Navigation drawer · 03 Reset demo data — confirm · 04 Role switched to Team Lead · 05 Pipeline filter — no match · 06 Funded contracts auto-archived · 07 Advisor — funded deal ends the list

**Documented issues before this review:** RP-UI-023 (Observation) on 01 My Deals (landing — Advisor); RP-UI-017 (Minor) on 06 Funded contracts auto-archived

### Owner direction — Role-aware queue (owner concept, 2026-08-23)

The owner answered the Home module with a concept of his own: the Team Lead and the advisor do not use the queue the same way, so the amount of guidance and the density change by role while the core deal information stays identical. Both roles see the same four identifiers in the same positions; the manager gets compact rows to sweep 40–50 deals fast, the advisor gets the same rows plus a next-step line because they hold fewer deals and need to know what to do next.

**Principles:**
1. Information priority, a hard rule: 1 customer full name · 2 full VIN · 3 stock number · 4 deal stage — on every deal row, BOTH roles, ONCE A VEHICLE IS ON THE DEAL. Two stated exceptions: during discovery the identifier line is absent by decision (blank while rapport is built, auto-populated on vehicle selection), and a value the app does not know renders an honest 'Pending' / 'Pending stock-in' — never an invention. No later redesign may hide or demote the identifiers; the vehicle description sits under them. (Reaffirmed on the built screens: the Team Lead card gained the VIN line on the owner's correction.)
2. FINAL role split: the Team Lead keeps the original two-lane floor view (All / Desking / F&I-Docs pills with counts, classic cards with a plain status line, funded contracts in the Archived fold) plus the VIN line and the chevron. The advisor gets the guided view: no filter pills, rows with a 'Next: …' line per active deal, funded deals at the end of the one list.
3. Navigation and action are different things: tapping a row opens the deal; the Next line is the work. Nothing on the queue should look like a primary button that is only navigation.
4. One design language for both roles; only density and guidance change. Ride Price identity preserved: navy, the gradient for meaningful emphasis, rounded containers, stage colours.

**Open choices before building:**
- Light, not dark: the concept is drawn as a dark interface; the real phone surface is light (#f2f2f8) with white cards, and the app's rule is that a concept shows where things go, not what the colours are. Adopted as layout and hierarchy on the existing light surface unless the owner decides otherwise.
- + New Customer Visit is missing from the concept — it is the queue's one forward action and the way a visit starts. It must keep a home (bottom bar, or under the pills — RP-IMP-001).
- The concept's bottom tab bar (Deals · Search · Customers · Menu) is app-wide chrome, not a queue change — the app uses the hamburger drawer everywhere. Adopting tabs is a separate decision that touches every screen (the same call the owner made on the jacket mockups' chrome).
- Row chevrons: the owner removed per-card chevrons from this screen on 2026-08-21 ("stray characters"); the concept brings them back as the 'row is tappable' cue. One or the other.
- The DEMO chip and the Advisor / Team Lead switch are standing rules (visible demo marker; the switch stands in for identity). The concept's DEALS chip and AB avatar would replace them; the avatar could open the role switch, the DEMO chip stays.
- Stage vocabulary: the app has three buckets (Desking, F&I / Docs, Funded) and chips DESKING / F&I READY / FUNDED; the concept has five (Desking, Credit, F&I, Docs, Done). Five maps cleanly onto the deal stages (credit · menu · forms/jacket · complete) and is the better dashboard — adopting it means the chips and pills change together.
- Already true in the data: deals carry an advisor, and the list is already 'mine' for an advisor and 'all' for a Team Lead — so 'My Deals (n)' vs 'Active Deals (n)' costs only the title. VINs are on the catalog for every vehicle.

**Superseded during the build:**
- Original concept, withdrawn during the build (owner, 2026-08-23): a high-density five-pill dashboard for the Team Lead (All / Desking / Credit / F&I / Docs / Done with counts, dense ~80px rows). Tried on screen; the owner kept the original two-lane queue — a team leader reads what is being desked and what is allocated to finance. Do not re-propose.
- Original concept, narrowed during the build: the five-bucket stage vocabulary (DESKING · CREDIT · F&I · DOCS · DONE) survives only as the ADVISOR's row chips; the Team Lead pills and chips stayed the original three-lane set.

**Decided:**
1. Light surface — take the concept's layout and hierarchy only; colours stay Ride Price's (owner, 2026-08-23).
2. + New Customer Visit stays — the queue's one gradient action keeps its home (owner, 2026-08-23).
3. No bottom tab bar — the drawer stays the app's navigation (owner, 2026-08-23).
4. Row chevrons come back as the 'row is tappable' cue on the queue (owner, 2026-08-23 — reverses the 2026-08-21 removal for this design).
5. App bar keeps its original style for now — DEMO chip and the Advisor / Team Lead segmented switch (owner, 2026-08-23).
6. Stage vocabulary — recommended mapping (owner asked for help, 2026-08-23): five buckets derived from the deal stage, one deal in exactly one bucket so the counts add up: DESKING = discovery · vehicle · test drive · desking · signed (orange, badge--prog) · CREDIT = credit (purple, badge--menu — the app already owns this colour) · F&I = menu (blue, badge--new) · DOCS = forms (navy-tinted, badge--type) · DONE = complete (navy filled, badge--done — Ride Price's funded chip, not the concept's green). 'All' counts the active four; DONE is its own pill. (In the five-pill concept this replaced the grey 'Archived' fold — that applies to the ADVISOR only in the final state: their funded deals sit at the end of the one list with no fold. The Team Lead's original view, kept by the later decision, retains the Archived fold; RP-UI-017's minimum row-styling fix stays open for it.) A deal that still owes documents while in F&I stays in F&I — the advisor's Next line says 'Missing insurance card', the pill says where the deal is. All five colours already exist in portal.css; nothing new is introduced.
7. Advisor view carries NO filter pills (owner, 2026-08-23, on the built screenshot): a good advisor does ten deals a day and scrolls them fine — the count dashboard is the Team Lead's tool. The advisor gets search, the rows with their Next lines, and their funded deals at the end of the same list under the DONE chip; search covers everything they own. The five pills with counts stay on the Team Lead view only.
8. Team Lead view stays UNCHANGED from the original queue (owner, 2026-08-23, final): All / Desking / F&I-Docs pills with counts, the classic cards (name, vehicle · Stk, status line, DESKING / F&I READY / FUNDED chips), funded contracts in the Archived fold — with ONE addition (owner, 2026-08-23, after testing on his phone): the VIN + STK mono line under the name, because the four-identifier hard rule holds for every role. A team leader reads two lanes — what is being desked and what is allocated to finance — so the five-bucket dashboard and the dense VIN rows were dropped for that role. The role-aware split lands entirely on the advisor: no pills, rows with name · VIN · stock · stage chip · chevron, a Next line per active deal, funded deals at the end of the one list.
9. Universal VIN visibility on the advisor queue (owner requirement, 2026-08-23): once a vehicle is on a deal, the VIN renders on the advisor row whether or not the unit is stocked in. Built as a vehicle-identity snapshot on the deal itself (deal.vehicle = { vin, stock }) — stamped the moment a vehicle is attached, migrated in load() for saved deals, so the VIN survives an unstocked/in-transit unit or a later catalog change. Display: both known → VIN + STK in bold mono; VIN only → 'STK Pending stock-in'; VIN unknown → 'Pending' (the app never invents a value); no vehicle → 'No vehicle selected yet'. A snapshot that disagrees with the deal's current stock is ignored and the row re-resolves fresh (a swapped vehicle can never show the old unit's VIN). Search also matches the deal-carried VIN/stock. The Team Lead's classic card only gains the honest fallback line ('VIN x · Stock pending stock-in') for a unit the catalog cannot name; its layout is untouched. Sync is by construction: every render reads the one Store.
10. Discovery blank state (owner, 2026-08-23): while the advisor is logging the customer in and building rapport, the card shows only the name, the stage line and the badge — no vehicle placeholder text. The identifier line auto-populates (VIN + STK) the moment a vehicle lands on the deal or a quote starts. Both roles.

Converges with: RP-IMP-002 (Done / Funded becomes a pill with a count — the owner concept confirms it); RP-IMP-003 (the advisor row carries an explicit Next line — confirmed; the concept drops it from the Team Lead view on purpose); RP-IMP-001 (the concept moves navigation to a bottom bar — the thumb-zone point, answered differently; see the open choices)

**What already works:** The queue is genuinely calm in both of its views (as reviewed, and still after the build): one title carrying the live count, one gradient action, one search field, and clean whole-row tap targets with the status chip pinned to the corner — nothing competes, which is exactly what the best work-queue screens do. The pill dashboard with live counts lives on the Team Lead screen (the Advisor landing deliberately has none). The role switch is a visible segmented control and its toast names the acting person, so the no-login decision reads as deliberate rather than missing. The drawer orients a first-time user well (dealership, advisor name and role, WORKFLOW vs RESOURCES) and keeps the destructive reset at the very bottom behind a branded confirm whose red button is the only danger-styled control in the flow. Empty states speak instead of going blank.

**Strongest recommendations:**
1. Put the one forward action where the thumb is: on a phone, anchor + New Customer Visit in a thin bottom bar (or full-width under the pills) instead of the top-right corner — and use the same page-bar rule on Find a Customer and the Training pages, which put their actions at the top the same way.
2. Give finished deals a real control: a fourth pill 'Funded (n)' in the existing pill row, or at minimum a 48px ink-coloured section row with a chevron, instead of the 20px grey 'Archived — funded contracts' text (RP-UI-017).
3. Make the deal card say what comes next ('Next · Game Plan With the Team Lead' in the stage colour) and stop the camera inside a VIN search field promising a VIN scan when it opens the licence scanner.
4. Keep the gradient rare: the drawer's active item should be a tint with an indicator bar, not a second gradient while the page's gradient CTA is still visible behind it.

### RP-IMP-001 — The only forward action sits in the hardest thumb zone while 60% of the screen is empty

- **Screen:** 01 My Deals (landing — Advisor) (`current/01-home-and-navigation/01-deals-queue.png`) — also on Home — Deals Queue & Navigation · 05 Pipeline filter — no match; Home — Deals Queue & Navigation · 04 Role switched to Team Lead; Home — Deals Queue & Navigation · 06 Funded contracts auto-archived; Customer Onboarding — Find a Customer · 01 Find a Customer; Training Licenses & Registrations · 01 Training Licenses; Training Licenses & Registrations · 02 Training Registrations
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

**D. Ride Price adaptation.** Preferred: add 'Funded (n)' as a fourth pill in the existing pill row — same 44px pill component, navy when active, green dot like the FUNDED chip — so finished deals are one tap away and the pills stay the only filter mechanism. Minimum: restyle the disclosure as a full-width 48px row in ink (navy 700) with the count in a navy pill on the right and a chevron that rotates on open, separated from the empty-state sentence by a hairline. Owner concept 2026-08-23: Done becomes a pill with its count in the same row — the preferred option above, confirmed. Final (owner, 2026-08-23): the Team Lead keeps the original Archived fold — RP-UI-017's row styling remains open as the minimum fix if wanted; for the advisor the question dissolved (their funded deals sit at the end of the list). **Stays:** The card itself (FUNDED chip, whole-card tap), the empty-state sentence, the no-per-card-delete rule.

*Implementation note:* .dl-archive summary in assets/portal.css and the <details class="dl-archive"> block in route('deals'); the pill row is .dl-pills / dealsUI.pipe.

### RP-IMP-003 — The card does not say what comes next, and the search-field camera promises the wrong scan

- **Screen:** 01 My Deals (landing — Advisor) (`current/01-home-and-navigation/01-deals-queue.png`) — also on Home — Deals Queue & Navigation · 04 Role switched to Team Lead; Home — Deals Queue & Navigation · 05 Pipeline filter — no match; Home — Deals Queue & Navigation · 06 Funded contracts auto-archived
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

- **Screen:** 05 Pipeline filter — no match (`current/01-home-and-navigation/05-pipeline-filter-empty.png`)
- **Type:** Newly Detected UI Issue · **Category:** informational · **Severity:** Observation · **Priority:** Low · **Fix size:** small

**A. Current Ride Price screen.** With F&I / Docs (0) selected the list says only 'No deals match that filter.' while the title still reads ACTIVE DEALS (1); the sentence does not say where the one deal is and offers no one-tap way back to All.

**B. Why it is a problem.** A trainee sees '1' in the title and 'no deals' in the list at the same moment — a tiny contradiction that costs a second of doubt; closing the loop in the sentence removes it.

**C. Mobbin reference direction — filtered-list empty state that names the filter and offers a clear-filters action.** Every strong filtered empty state does two things: says the filter is the reason, and gives a button out. Google Drive, Wise and Quizlet all pair 'no results with these filters' with a single 'Clear filters' / 'Clear all' button directly under the sentence.
- [Google Drive](https://mobbin.com/screens/f9f86637-40e2-4126-a850-5106dc9cf02a) — 'No matching results' + a Clear filters button; the active filter chips stay visible above
- [Wise](https://mobbin.com/screens/0cdba498-dc6c-40a0-97fb-9acb9b7a417f) — 'Your filters have returned no results' + Clear filters pill
- [Quizlet](https://mobbin.com/screens/0230bbe1-bbd9-4605-96b2-0810ffd26bd4) — Sentence names the filters; one Clear filters button

**D. Ride Price adaptation.** Keep the pills. Change the sentence to name the state ('No deals in F&I / Docs — 1 in Desking') and add a ghost 'Show all' button under it that selects the All pill. Same muted sentence / ink button styling as the other empty state. **Stays:** The pill row, the counts, the existing empty-state styling.

*Implementation note:* paint() in route('deals'), the empty-list branch.

### RP-IMP-006 — No login by design — keep the 'who am I' cue consistent

- **Screen:** 01 My Deals (landing — Advisor) (`current/01-home-and-navigation/01-deals-queue.png`) — also on Home — Deals Queue & Navigation · 04 Role switched to Team Lead
- **Type:** Existing Comment Expanded (builds on RP-UI-023 — accurate — it records a decision and stays an Observation; incomplete only in that it does not note where the identity cue lives: the acting person is named only in the drawer header ('Ashley Collins · Client Advisor') and, after a switch, in a 4-second toast ('Now acting as Team Lead — Jordan Reyes'); the app bar shows the role but never the name.) · **Category:** informational · **Severity:** Observation · **Priority:** Low · **Fix size:** small

**A. Current Ride Price screen.** No login is by design; the only persistent 'who am I' cue is inside the drawer, and the role switch confirms itself with a toast while nothing else on the page changes (same list, same CTA).

**B. Why it is a problem.** For a demo/training tool this is acceptable; the only risk is a trainee forgetting they are in Team Lead mode and later meeting (or missing) role-gated steps without knowing why. Not a bug — a cue to keep consistent.

**C. Mobbin reference direction — role / persona switcher with a persistent indicator.** Apps with two identities keep the current one visible where the switch is: X shows the account avatar beside the switcher, Nextdoor lists the second identity as a named row under the profile header, Spotify's drawer header names the account with 'Add account' directly under it. The switch and the name live together.
- [X](https://mobbin.com/screens/296ece73-7630-4846-a67b-8d4772ef70a0) — Account switcher avatar beside the profile header — the current identity is always visible
- [Nextdoor](https://mobbin.com/screens/4e6ef4c3-a9b5-4a54-a33b-1c68a091a873) — Name + place header, then the second identity as a named row

**D. Ride Price adaptation.** Keep the segmented Advisor / Team Lead switch exactly as it is. Make sure the drawer header follows the switch (name and role of the acting person), and on wider phones consider a one-line name under the app-bar switch ('Jordan Reyes'). No login, no avatar, nothing heavier. **Stays:** No authentication; the app-bar segmented switch; the toast.

*Implementation note:* roleName() and the app-bar switch / drawer header in renderChrome(), app.js.

### RP-IMP-007 — Role-aware queue: same four identifiers for everyone, dense rows for the Team Lead, a Next line for the advisor

- **Screen:** 01 My Deals (landing — Advisor) (`current/01-home-and-navigation/01-deals-queue.png`) — also on Home — Deals Queue & Navigation · 04 Role switched to Team Lead; Home — Deals Queue & Navigation · 06 Funded contracts auto-archived
- **Type:** Pattern Opportunity · **Category:** structural · **Severity:** Major · **Priority:** High · **Fix size:** medium

**A. Current Ride Price screen.** The queue shows the same card to both roles: name, vehicle · stock, a status line and a chip. It carries no VIN (the identifier a manager and a lender both use), the three buckets lump Credit, F&I and Docs into one pill, and a Team Lead with a full floor would scroll ~110px cards one at a time. The role switch changes who is acting but not what the screen is for.

**B. Why it is a problem.** A Team Lead sweeps 40–50 deals many times a day and needs to see where the floor stands without opening anything; an advisor holds a handful and needs to know what to do next on each. One layout serves neither well: too tall for the manager, too quiet for the advisor.

**C. Mobbin reference direction — dense operational list with right-aligned status and count filters (manager); the same list with a per-row next-step line (individual contributor).** Queue and inbox screens on Mobbin that serve volume use compact rows with a right-aligned status and tabs that carry counts (ClickUp, monday.com); screens that serve one person's work add a one-line 'what next' under the active item (Careem, Grab Driver). The lesson is not either layout — it is that density and guidance are the variables, and the core identifiers are not.
- [ClickUp](https://mobbin.com/screens/3e06d063-e0a2-497e-8880-167964137670) — Tabs with counts, compact rows, one status sentence per row
- [monday.com](https://mobbin.com/screens/9407b31a-f185-4f13-bf49-15daa73b3b21) — Bucket counts above a single dense list
- [Careem](https://mobbin.com/screens/160656d3-ef01-4163-87bc-ca4c2abd7551) — 'Next step: …' stated in plain words above the list
- [Grab Driver](https://mobbin.com/screens/094b300e-f89e-480f-a72a-762788d331f9) — One 'what happens next' line under the active step

**D. Ride Price adaptation.** FINAL (after the owner's corrections on built screenshots): every row, both roles, shows name (700), the mono VIN + STK line (an unstocked unit shows 'STK Pending stock-in'; a missing value 'Pending', never invented; blank during discovery), the vehicle, the stage chip, and a chevron — the whole row is the tap. Advisor ('My Deals'): no filter pills, the five stage chips, a 'Next: …' line in the stage colour per active deal, funded deals at the end of the one list, Clear search on an empty search. Team Lead ('Active Deals'): the original floor view — All / Desking / F&I-Docs pills with live counts, classic cards with a plain status line and DESKING / F&I READY / FUNDED chips, the Archived fold. + New Customer Visit stays the one gradient action; DEMO chip, role switch and drawer unchanged; light surface. The five-pill Team Lead dashboard was tried and withdrawn — see direction.superseded. **Stays:** Light surface and white cards; navy / chrome blue; gradient only on + New Customer Visit; DEMO chip; the Advisor / Team Lead switch; the search field; the drawer. Chevrons return by decision.

*Implementation note:* route('deals') card template and paint() (the 'mine' filter at app.js ~526 already splits the roles); .dl-card / .dl-pills in portal.css; dealNextAction() for the advisor line; the five-way bucket needs a stage→bucket map beside dealBucket().

## Scan Driver's License

8 screens · reviewed 2026-08-23 · 13 recommendations

**Screens:** 01 Scan — front of licence · 02 Scan — back of licence · 03 Reading barcode… · 04 Not recognized · 05 Potential match found (prop 1) · 06 Verify — existing customer found · 07 Verify — new customer (prop 3) · 08 Phone number already on file

**Documented issues before this review:** none

### Owner direction — Intake of the external draft (owner's new working method, 2026-08-23)

First run of the best-of-both loop: the owner exported this flow's ZIP from the library, an outside AI produced a 25-recommendation package in the system's format, and this area is the verified merge of that draft with the session analysts' independent findings. Every Mobbin link in the package was checked (all 14 resolve; a fabricated control 404s). Severities were recalibrated to the audit scale, collisions with the decision record were killed or turned into explicit owner questions, and each keeper is anchored in the code.

**Principles:**
1. External packages are drafts, not decisions: anything that contradicts a recorded decision or invariant is surfaced to the owner with the recorded reason — never silently adopted, never silently dropped.
2. References must resolve and lessons must be pattern-level; the adaptation is always re-expressed in Ride Price's own components and rules.
3. Where the two reviewers disagree, the disagreement is recorded on the recommendation instead of being averaged away.

**Open choices before building:**
- Q1 — Summary-first verify (RP-IMP-010): both the external draft and the session analysts independently propose replacing the fully-editable verify form with a read-first summary ('From the license' card, old → new markers on changed fields, per-field Edit). This REVERSES decision 11 (2026-08-11: review-and-confirm, fully editable — the ritual is the checkpoint). It cannot be adopted without the owner explicitly reversing that decision.
- Q2 — The scanner's shell (RP-IMP-009): the external draft wants the whole journey out of the modal into a full-screen flow (its strongest structural idea; large change touching the shared modal() contract hardened in PR #42); the session analysts propose the smaller move — short dialogs anchor as bottom sheets so the buttons land in the thumb zone, tall verify steps stay as they are. Or leave the shell untouched. Owner's pick.

**Superseded during the build:**

**Decided:**

**What already works:** The staged ritual reads clearly: the three-step chips (1 · Front, 2 · Back, 3 · Verify) with green-done / navy-current states say exactly where the user is, the instruction names the side in caps, the capture frame is itself the control with 'Upload a photo' as an honest fallback, and the refusal screen teaches instead of scolding. The hint is straight about the demo ('Real IDs cannot be read'). The match cascade surfaces ambiguity instead of guessing — the possible-match and phone-conflict interstitials exist precisely so the app never links records silently. Both the external draft and the session analysts called this a strong foundation.

**Strongest recommendations:**
1. Make the match and conflict screens evidence-rich: show the scanned facts against the on-file record as one comparison (dates in MM/DD/YYYY), name the colliding phone number, and offer 'Back — fix the number' — the identity decisions are the highest-stakes taps in the flow and currently carry the least context.
2. Say what the button does: 'Save & Start Visit →' / 'Create & Start Visit →' — the verify CTAs also start the visit, and the manual path already says so.
3. Fix the real bug both reviewers circled from different angles: the 'training license' help links tear down the scan mid-flow (hash navigation closes the dialog); an in-dialog prop peek keeps the flow alive and makes the training guidance prominent without inventing a 'Training Mode'.
4. Decide the two structural questions recorded below: summary-first verify (it reverses your 2026-08-11 fully-editable decision — both reviewers independently proposed it) and the dialog shell (full-screen journey vs bottom-sheet short dialogs vs as-is).

### RP-IMP-008 — The training-license help links tear down the scan, and the demo guidance whispers

- **Screen:** 01 Scan — front of licence (`current/03-license-scan/01-scan-front.png`) — also on Scan Driver's License · 02 Scan — back of licence; Scan Driver's License · 04 Not recognized
- **Type:** Newly Detected UI Issue · **Category:** interaction · **Severity:** Major · **Priority:** High · **Fix size:** small

**A. Current Ride Price screen.** The 'training license' links in the hints (84×29 and 151×20 — under the small-target floor) navigate to #/props, and the hash change closes the scan dialog mid-flow (verified in openScanFlow) — help costs the user their captured front. Meanwhile the one sentence that prevents the most predictable failure ('Real IDs cannot be read — use a printed training license') is small muted text.

**B. Why it is a problem.** A trainee who taps 'what licenses?' loses the scan and starts over; a trainee who misses the hint scans a real ID and meets a refusal they could have been spared. The most useful guidance in the flow is the least visible thing on it.

**C. Mobbin reference direction — ID capture with prominent accepted-document guidance and in-context help.** Capture flows keep guidance inside the journey: N26 shows a 'get your document ready' sheet with make-sure bullets before the camera; Wise names the side and what must be visible; State Farm keeps 'Enter ID details manually' as a full-width in-flow fallback. None of them navigate away from the capture to explain it.
- [N26](https://mobbin.com/screens/43382779-a524-44ae-a418-b6bf7eb93cf0) — 'Get your document ready' — make-sure bullets in a sheet before the camera, inside the flow
- [Wise](https://mobbin.com/screens/1aa66a67-7fdf-4bcc-9ded-0a1ddbb826f0) — The side named, the requirement stated, nothing leaves the journey
- [State Farm](https://mobbin.com/screens/f99f346c-71a7-4828-838d-75bec29d1fd9) — Manual entry as an in-flow, full-width fallback

**D. Ride Price adaptation.** Keep the dialog, stepper, capture frame and hint copy. Promote the demo line to one bold ink sentence under the instruction ('Demo — only the 5 printed training licenses can be read'), and replace the tear-down links with a ≥40px ghost button 'See a training license' that opens an in-dialog peek (one prop's front and back thumbnails, Close returns to the step with the captured front intact). No 'Training Mode' concept — decision 5 stands; this is visibility, not a mode. **Stays:** The dialog ritual, the stepper, the frame-as-control, the Upload fallback, the neutral refusal voice, decision 5 (no mode).

*Implementation note:* openScanFlow() in app.js (the hashchange teardown and the hint markup on steps 1/2 and the refusal); the peek reuses the modal body swap, not a second modal.

### RP-IMP-009 — Where the scan journey lives: full screen, bottom sheets, or the current modal (owner question Q2)

- **Screen:** 01 Scan — front of licence (`current/03-license-scan/01-scan-front.png`) — also on Scan Driver's License · 05 Potential match found (prop 1); Scan Driver's License · 08 Phone number already on file
- **Type:** Pattern Opportunity · **Category:** structural · **Severity:** Major · **Priority:** Medium · **Fix size:** major

**A. Current Ride Price screen.** The centred modal carries the whole journey: capture, processing, refusal, matching, and the long verify forms. Short steps end high on the screen (the possible-match and phone-conflict buttons sit at y≈240–340), so the highest-stakes taps live at the top of a 844px viewport; the external draft reads the shell itself as too small for what the flow became.

**B. Why it is a problem.** One-handed use puts the decision buttons in the hardest reach zone on exactly the screens where a wrong tap links or forks a customer record; and a shell that keeps changing height reads as jumpy.

**C. Mobbin reference direction — focused identity-scan journey owning the mobile screen.** The identity flows reviewed (DoorDash Dasher, Turo, Chime, State Farm) treat ID capture as a task that owns the screen: lightweight progress up top, one task per screen, fallbacks secondary. The external draft's lesson is the full-screen journey; the session analysts' smaller lesson is that short decision dialogs should anchor to the bottom edge so the buttons land in the thumb zone.
- [Turo](https://mobbin.com/flows/ae6568f6-f71e-4a64-a158-eb80d867d9ce) — Scanning a driver's license as a focused full-screen flow
- [DoorDash Dasher](https://mobbin.com/flows/cfb0e2cd-ecb5-42f1-bca1-c41d7a454ec9) — Identity verification journey — one task per screen, light progress
- [Chime](https://mobbin.com/flows/9d0a1507-23f6-4dce-8beb-785ebcc3cdff) — Verify-identity flow with capture, coaching and review as siblings

**D. Ride Price adaptation.** Owner's pick, recorded as Q2: (a) full-screen scan route — the external draft's direction, the largest change, touches the shared modal()/setModalFoot contract hardened in PR #42; (b) the analysts' middle path — short dialogs (possible match, phone conflict, refusal) anchor as bottom sheets so their buttons land at y≈700–800, tall verify steps unchanged, one CSS-level change to the shared dialog; or (c) leave the shell as is and take only the content fixes. The area's other recommendations work under any of the three. **Stays:** The staged ritual (front → back → verify), the stepper, every invariant; under (b) the dialog component and its pinned-footer behaviour.

*Implementation note:* (a) a new route + chrome; (b) .modal placement variant at ≤720px in portal.css (the backdrop flex alignment), no handler changes; (c) nothing.

### RP-IMP-010 — Summary-first verify — both reviewers propose it; it reverses decision 11 (owner question Q1)

- **Screen:** 07 Verify — new customer (prop 3) (`current/03-license-scan/07-scan-verify-new.png`) — also on Scan Driver's License · 06 Verify — existing customer found
- **Type:** Pattern Opportunity · **Category:** structural · **Severity:** Major · **Priority:** High · **Fix size:** medium

**A. Current Ride Price screen.** The verify step renders every scanned value as a large editable input, so the screen says 'fill out a form' although the scan already did the work; the instruction says 'check every field, then ask the guest for their contact details', but the ask-the-guest fields sit below the fold behind seven license fields the advisor only needs to read.

**B. Why it is a problem.** The advisor's real tasks are two: confirm what the license said, and collect what it could not say. A wall of inputs makes the fast path feel slow, buries the only fields that need typing, and hides which values changed on an existing customer.

**C. Mobbin reference direction — summary-first review of extracted data with per-field edit.** Review screens for extracted data show values as read-first rows with an explicit Edit affordance and group them logically: Cash App's confirm screen (rows + Edit), Stake's about-you review, Kit's grouped identity/address cards, Greenlight's confirm-your-information card. Editing is one tap away but not the default posture.
- [Cash App](https://mobbin.com/screens/5b7cf0d7-41d9-4290-ad82-62bbd2f744ba) — Confirm information — compact summary rows with per-item Edit
- [Stake](https://mobbin.com/screens/04d0d056-6ab7-404b-bc57-3a022a3cb6ce) — Review extracted personal details with edit affordances
- [Kit](https://mobbin.com/screens/43319bae-45cf-48bf-a583-f5caf25aeeeb) — Grouped identity / address review cards with edit icons
- [Greenlight](https://mobbin.com/screens/2ab995a3-438e-4e02-b68b-1aa1af233715) — 'Confirm your information' summary card with one Edit path

**D. Ride Price adaptation.** DECISION REQUIRED — this reverses decision 11 (2026-08-11: the verify screen is review-and-confirm, FULLY editable; the ritual is the teaching checkpoint). The proposal both reviewers reached independently: step 3 becomes a read-first 'From the license' card (name, DOB, licence, state, expires, address — ink, two columns), an existing customer's changed fields marked 'old → new', a ghost Edit expanding any group back to inputs, and the ask-the-guest contact fields (email, phone) as the only open inputs, above the pinned footer. If the owner keeps decision 11, the surviving slice is: group the form into 'From the license' / 'Ask the guest' sections with the contact fields first, and mark changed values — fully editable throughout. **Stays:** Scans always parse clean (no fake-error theater); the pinned footer; markMissing/customerMissing on save; the match-outcome banner.

*Implementation note:* The verify-step body in openScanFlow() (shared with the credit app's marking helpers — flagged as shared-code); grouping is markup inside the existing modal body.

### RP-IMP-011 — The verify CTAs understate what they do — they also start the visit

- **Screen:** 06 Verify — existing customer found (`current/03-license-scan/06-scan-verify-existing.png`) — also on Scan Driver's License · 07 Verify — new customer (prop 3)
- **Type:** Newly Detected UI Issue · **Category:** informational · **Severity:** Minor · **Priority:** High · **Fix size:** small

**A. Current Ride Price screen.** 'Update Customer →' and 'Create Customer →' also start the visit and land on Discovery, but only the manual path's dialog says so ('Save & Start Visit →'). The same outcome wears two names depending on the door the advisor came through.

**B. Why it is a problem.** A button that does more than it says costs trust the first time it surprises; and the inconsistency with the manual path makes the app feel like two apps.

**C. Mobbin reference direction — CTAs that state the real outcome.** Confirmation CTAs across the reviewed flows name the whole outcome, not the database verb — 'Agree and reserve', 'Confirm updates', 'Activate your plan'. The winning pattern is the outcome the user cares about, with a quiet line above it summarising the side effect ('3 fields will be updated').
- [Cash App](https://mobbin.com/screens/42e423db-c08c-449c-98b6-178c52d5ac69) — The CTA names the produced outcome (Create form), edits stay per-row
- [Beli](https://mobbin.com/screens/d4de8ae9-dde3-4f42-bc98-ea19f3a1216b) — 'Agree and reserve' — one CTA carrying both effects by name

**D. Ride Price adaptation.** Label both verify CTAs with the outcome — 'Save & Start Visit →' (existing) and 'Create & Start Visit →' (new) — matching the Create Customer dialog word for word; on an existing customer add the quiet caption above the footer: 'n fields will be updated from the license.' Navy filled stays the modal confirm. **Stays:** Button roles and colours; the pinned footer; the navigation target (Discovery).

*Implementation note:* setModalFoot markup for the two verify steps in openScanFlow(); the caption derives from the same diff RP-IMP-010 computes.

### RP-IMP-012 — The possible-match screen asks a high-stakes question with a one-line clue

- **Screen:** 05 Potential match found (prop 1) (`current/03-license-scan/05-scan-possible-match.png`)
- **Type:** Newly Detected UI Issue · **Category:** informational · **Severity:** Major · **Priority:** High · **Fix size:** small

**A. Current Ride Price screen.** 'License reads: John Smith · DOB 1987-03-14 · T-0000101' is one 13px muted line — with the date in ISO against the app's own MM/DD/YYYY rule — and the on-file record is described only by name. The advisor decides link-vs-create without seeing what the CRM actually holds, and the external draft filed this as its top identity risk (recalibrated Critical → Major: the flow completes).

**B. Why it is a problem.** Linking the wrong record contaminates a customer file; creating a duplicate splits one. This is the most consequential tap in the flow and it currently carries less context than a deal card.

**C. Mobbin reference direction — duplicate-account decision with identity evidence ('Is this you?').** Duplicate-account prompts show the evidence as one decision object: Uber's 'Is this you?' presents the matched account's identifying facts with confirm/deny as the only actions; LINE confirms a known account by showing what it knows. The pattern is a comparison the user can actually judge, not an assertion to trust.
- [Uber](https://mobbin.com/screens/e29b477a-32d4-4615-96d7-1d27213b54f2) — Existing-account match — the evidence and the decision as one object
- [LINE](https://mobbin.com/screens/22683c13-9c12-47e4-9c20-8b3a44f665ee) — Known-account match — simple identity confirmation with the known facts shown

**D. Ride Price adaptation.** Keep the crimson banner and the two-choice cascade (decision 8: both outcomes stay one tap away). Replace the muted line with an ink two-column comparison card — 'License: John Smith · DOB 03/14/1987 · T-0000101' against 'On file: John Smith · Astoria, NY · DOB —' (absent values shown as —, never invented; dates in MM/DD/YYYY per the app rule). 'Yes — use this record' stays navy primary; 'No — create a new customer' becomes ghost with a one-line caution ('creates a second John Smith'). **Stays:** The cascade order and both outcomes (decision 8); the banner; the neutral voice; tri-state honesty for absent fields.

*Implementation note:* The possible-match step markup in openScanFlow(); the on-file column reads the matched customer record; dateUS() for the DOB.

### RP-IMP-013 — The phone-conflict screen hides the number it is warning about

- **Screen:** 08 Phone number already on file (`current/03-license-scan/08-scan-phone-conflict.png`)
- **Type:** Newly Detected UI Issue · **Category:** informational · **Severity:** Major · **Priority:** High · **Fix size:** small

**A. Current Ride Price screen.** 'That phone number is on file for John Smith.' — without showing the number, who the scanned person is, or what 'Link to that record' will actually do; and there is no way back to simply fix a mistyped digit, though a typo is the likeliest cause. (External draft filed Critical; recalibrated — the flow completes.)

**B. Why it is a problem.** The advisor must choose between linking two people and forking a record, blind to the one fact in question. The cheapest correct outcome — fix the number — is not on the screen at all.

**C. Mobbin reference direction — conflict resolution showing the evidence and the consequence of each action.** The reviewed conflict and failure screens win by naming the thing and the consequence: Chase UK's scan failure explains and offers the recovery most likely to fix it; Uber's match screen shows the colliding identity before asking. The lesson: evidence, consequence, and the fix-it path on one card.
- [Uber](https://mobbin.com/screens/e29b477a-32d4-4615-96d7-1d27213b54f2) — The colliding account shown before the decision
- [Chase UK](https://mobbin.com/screens/36260299-2210-4fe6-8f64-83b025e12e25) — Failure explained + the recovery action most likely to fix the diagnosed problem

**D. Ride Price adaptation.** Show the evidence in the banner — '(718) 555-0134 is on file for John Smith' — and under it one line per action saying its consequence ('Link: this scan updates John Smith's record' / 'Keep as new: two customers will share this number'). Add a third quiet ghost action 'Back — fix the number' returning to the verify form with the phone field focused. Buttons keep their roles; the crimson banner stays. **Stays:** The guard itself, both original outcomes, the banner, the neutral voice.

*Implementation note:* The phone-conflict step in openScanFlow(); 'Back' re-renders the verify step with state intact (the captured data is already in route state).

### RP-IMP-014 — The refusal explains four things in one small paragraph

- **Screen:** 04 Not recognized (`current/03-license-scan/04-scan-not-recognized.png`)
- **Type:** Newly Detected UI Issue · **Category:** informational · **Severity:** Minor · **Priority:** Medium · **Fix size:** small

**A. Current Ride Price screen.** The not-recognized copy mixes the demo limitation, real-system behaviour, damaged-barcode advice and the manual fallback into one small block. The external draft wanted cause-specific diagnosis on top — killed: the recognizer cannot know why an image failed (it finds a prop marker or refuses; invariant 4) — but the copy structure critique stands.

**B. Why it is a problem.** A trainee mid-refusal needs one thing at a time: why this can happen, and what to do next. Four ideas in one paragraph means none lands.

**C. Mobbin reference direction — scan-failure coaching, one message and one recovery at a time.** Chime's scan-issues screen coaches capture problems as short scannable bullets (glare, blur, framing); Chase UK pairs one explanation with the one recovery. Neither writes a paragraph.
- [Chime](https://mobbin.com/screens/b5f8b32b-2309-426f-9dbc-5007eaf680ef) — Common scan issues as short coaching bullets
- [Chase UK](https://mobbin.com/screens/36260299-2210-4fe6-8f64-83b025e12e25) — One explanation, one matched recovery action

**D. Ride Price adaptation.** Restructure the copy only: the headline stays; then two short lines — 'In this demo, only the 5 printed training licenses can be read.' and 'Blurry or shadowed photo? Retake usually fixes it.' — then the two actions as today (Retake primary per decision 13, Enter manually secondary). No diagnosis is claimed the app cannot make. **Stays:** Retake-then-manual order (decision 13); the neutral teaching voice; no cause classification (invariant 4).

*Implementation note:* The refusal step's copy block in openScanFlow(); pairs with RP-IMP-008's prop peek.

### RP-IMP-015 — The processing state sets no time expectation

- **Screen:** 03 Reading barcode… (`current/03-license-scan/03-scan-reading.png`)
- **Type:** Newly Detected UI Issue · **Category:** informational · **Severity:** Observation · **Priority:** Low · **Fix size:** small

**A. Current Ride Price screen.** 'Reading barcode…' says what is happening but not how long it should take (about one second in the demo).

**B. Why it is a problem.** Tiny, but a stated expectation is what makes a wait feel handled rather than stuck — and it teaches the trainee what the real system's wait feels like.

**C. Mobbin reference direction — processing state with a time expectation.** Kraken's ID-processing state names the wait and sets the expectation, revealing recovery only if the wait turns abnormal.
- [Kraken](https://mobbin.com/screens/d2516872-142d-4210-a85c-c2f8c1771036) — Processing ID — clear status plus a time expectation

**D. Ride Price adaptation.** Add one muted line under the spinner: 'This usually takes a few seconds.' Nothing else. **Stays:** The one-second simulated beat; the stepper state.

*Implementation note:* The processing step copy in openScanFlow().

### RP-IMP-016 — The dialog height jumps twice around the one-second spinner

- **Screen:** 03 Reading barcode… (`current/03-license-scan/03-scan-reading.png`)
- **Type:** Newly Detected UI Issue · **Category:** visual · **Severity:** Observation · **Priority:** Low · **Fix size:** small

**A. Current Ride Price screen.** The sheet collapses from ~470px to ~260px for the spinner and re-expands for the result — two height jumps in two seconds. The external draft additionally wanted the stepper to indicate the transition toward verify; the analysts keep '2 · Back' highlighted (processing belongs to the capture step) — the analysts' reading is recorded as the truer one.

**B. Why it is a problem.** A sheet that pulses reads as instability exactly at the moment the app is doing its one piece of magic.

**C. Mobbin reference direction — stable-footprint processing state.** Kraken processes inside the same visual footprint the capture used — the surface holds still while the state changes.
- [Kraken](https://mobbin.com/screens/d2516872-142d-4210-a85c-c2f8c1771036) — Processing without the surface changing size

**D. Ride Price adaptation.** Render the spinner inside the capture frame's own footprint (the 248×155 box, dashed becomes solid), Upload disabled, so the dialog height holds through capture → reading → result. The stepper stays on '2 · Back'. **Stays:** The spinner, the copy (plus RP-IMP-015's line), the stepper logic.

*Implementation note:* The processing step markup in openScanFlow() reuses the frame container instead of replacing it.

### RP-IMP-017 — The back step could show what the barcode side should look like

- **Screen:** 02 Scan — back of licence (`current/03-license-scan/02-scan-back.png`)
- **Type:** Pattern Opportunity · **Category:** visual · **Severity:** Minor · **Priority:** Medium · **Fix size:** small

**A. Current Ride Price screen.** Step 2 says 'BACK — barcode side' in words, but the frame is the same empty dashed box as the front step; nothing shows where the wide strip sits or warns about glare — the two failure causes a paper prop actually has.

**B. Why it is a problem.** The physical test is paper under indoor light; a one-glance silhouette of the strip plus a glare hint prevents the most common retakes before they happen.

**C. Mobbin reference direction — capture frame matching the shape being captured.** Uber's back-of-license capture draws a barcode-shaped guide; Wise tells the user the whole document must fit and details must be clear. The frame teaches, not just crops.
- [Uber](https://mobbin.com/screens/177128f6-fb23-43a2-86a3-a3bb6030297b) — A barcode-shaped guide for the back side
- [Wise](https://mobbin.com/screens/1aa66a67-7fdf-4bcc-9ded-0a1ddbb826f0) — 'Make sure all details are clear and the whole ID fits'

**D. Ride Price adaptation.** Inside step 2's frame, draw a faint wide-strip silhouette (CSS bars, no asset) where the marker sits on the props, and add one hint line: 'Lay it flat — avoid glare on the stripe.' No live viewfinder (invariant 5); this is the pre-capture illustration. **Stays:** The frame-as-control, the file-input capture path, the front-thumbnail-with-retake.

*Implementation note:* Step 2 frame markup in openScanFlow() + a small CSS block; the silhouette echoes .pd-mark__bars styling at reduced opacity.

### RP-IMP-018 — Small capture-step polish: the photo action as a visible button, the status attached, Retake labelled

- **Screen:** 01 Scan — front of licence (`current/03-license-scan/01-scan-front.png`) — also on Scan Driver's License · 02 Scan — back of licence
- **Type:** Newly Detected UI Issue · **Category:** visual · **Severity:** Minor · **Priority:** Low · **Fix size:** small

**A. Current Ride Price screen.** Three small things pull the same way: the primary photo action lives implicitly in the dashed frame while 'Upload a photo' looks like the only button; 'Front captured ✓' renders as a detached footer status; and retaking the front is a small text link after the thumbnail.

**B. Why it is a problem.** First-time users press what looks pressable. The fallback outdressing the primary is backwards, and unlabelled micro-controls fail the outdoor thumb.

**C. Mobbin reference direction — capture screen with an explicit primary shutter action and labelled secondary controls.** DoorDash's capture step leads with an explicit primary start action and keeps upload secondary; Careem shows the step count and the fallback as clearly ranked choices.
- [DoorDash Dasher](https://mobbin.com/screens/ba16f42f-4618-4073-bac9-e2ed76770bed) — ID photo scan — explicit primary action, ranked fallback
- [Careem](https://mobbin.com/screens/f2ca14ce-db32-4bb0-8f4f-36fe2d75055c) — ID capture — step count + upload fallback, clearly secondary

**D. Ride Price adaptation.** Put a navy '📷 Take photo' pill inside the frame (the frame stays tappable — the pill names what the tap does; on phones it opens the camera as today), demote 'Upload a photo' to ghost, attach 'Front captured ✓' to the stepper chip as its done-state detail, and give retake a ≥40px labelled ghost control ('Retake front'). No glyph rule exception needed — 📷 already marks the camera control on the deals search by precedent… keep the label text-first if the rule is read strictly. **Stays:** The file-input capture path, frame-as-control, thumbnail.

*Implementation note:* Steps 1–2 markup in openScanFlow(); mind the no-glyph-on-buttons rule — 'Take photo' text with the camera as a status glyph beside the frame satisfies it.

### RP-IMP-019 — Closing mid-scan discards captured work silently

- **Screen:** 06 Verify — existing customer found (`current/03-license-scan/06-scan-verify-existing.png`) — also on Scan Driver's License · 02 Scan — back of licence
- **Type:** Newly Detected UI Issue · **Category:** interaction · **Severity:** Minor · **Priority:** Medium · **Fix size:** small

**A. Current Ride Price screen.** The X and Cancel close the whole journey at any step without saying the captured front/back and parsed data are gone; nothing distinguishes 'leave the scan' from 'go back a step'.

**B. Why it is a problem.** Losing two captures and a parse to a mis-tap is a restart the advisor feels; a two-second confirm is cheaper than one re-scan.

**C. Mobbin reference direction — in-flow back vs leave-journey exit semantics.** The reviewed identity flows separate back (within the journey) from exit (abandon), and the exit from a part-done capture asks once.
- [Chime](https://mobbin.com/flows/9d0a1507-23f6-4dce-8beb-785ebcc3cdff) — Back within the flow; leaving a part-done verification asks

**D. Ride Price adaptation.** Once a capture exists, X/Cancel go through confirmModal ('Leave the scan? The captured photos and details will be discarded.' — Leave / Keep scanning). Before any capture, close stays instant. Verify against the code first: if a discard confirm already exists on some steps, unify it. **Stays:** confirmModal (never native confirm); instant close on the empty first step.

*Implementation note:* openScanFlow()'s close/[data-close] handling, gated on captured state.

### RP-IMP-020 — The step chips: strong orientation, at a vertical price — recorded disagreement

- **Screen:** 01 Scan — front of licence (`current/03-license-scan/01-scan-front.png`)
- **Type:** Pattern Opportunity · **Category:** visual · **Severity:** Observation · **Priority:** Low · **Fix size:** small

**A. Current Ride Price screen.** The external draft reads the three step pills as heavy (they look like segmented controls and spend scarce modal height); the session analysts praised the same chips as the flow's best orientation device. Recorded as a disagreement, not a defect.

**B. Why it is a problem.** Only worth touching if Q2 moves the shell — a full-screen journey would want the lighter '1 of 3' + thin bar treatment; the current modal wears the chips fine.

**C. Mobbin reference direction — lightweight scan progress.** DoorDash and Careem use a step count plus thin progress and let the capture instruction dominate.
- [Careem](https://mobbin.com/screens/f2ca14ce-db32-4bb0-8f4f-36fe2d75055c) — Step count + thin progress, instruction dominant

**D. Ride Price adaptation.** No change on its own. If Q2 chooses the full-screen shell, revisit with the lighter treatment ('Scan license · 1 of 3' + thin gradient progress). **Stays:** The chips, today.

*Implementation note:* Only alongside RP-IMP-009 option (a).

## Not yet reviewed — next in line

1. Customer Onboarding — Find a Customer (5 screens)
2. Training Licenses & Registrations (2 screens)
3. Discovery Session (3 screens)
4. Vehicle Selection (7 screens)
5. Test Drive Agreement (7 screens)
6. Trade-In Evaluation & Proof of Ownership (4 screens)
7. Desking — Calculate Payments (5 screens)
8. Base Payment Agreement (3 screens)
9. Credit Application (Lending Lane) (4 screens)
10. Buyers on the Deal (Co-Buyer) (4 screens)
11. F&I Product Presentation (4 screens)
12. Finance Menu — Sign-Off, Terms, Repayment Options, Forms, Contracts (16 screens)
13. Deal Jacket & Compliance (11 screens)
14. Send Text Request (advisor → client) (3 screens)
15. Client Document Upload (customer's phone) (10 screens)
16. Snap All — burst capture (4 screens)
17. Document Review (advisor) (1 screens)
18. Print Center & Printables (3 screens)

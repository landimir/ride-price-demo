# Ride Price — Mobbin Reference Summary

Updated 2026-08-23. One entry per reference family used by the improvement review so far. Each was looked up on Mobbin for a specific Ride Price problem; the screens are listed so they can be opened, and the lesson is what Ride Price takes — structure and clarity, never the other app's brand. Nothing here says "copy X": the adaptation always re-expresses the pattern in Ride Price's navy, gradient, Poppins and existing components.

## M3 · Work queue / home with one dominant action

**Ride Price problem it was looked up for:** Home — Deals Queue: is the first screen oriented, and does it make finished deals reachable?

**What was reviewed:**
- [monday.com](https://mobbin.com/screens/9407b31a-f185-4f13-bf49-15daa73b3b21) — My Work — bucket tiles with counts, one list, one floating + action
- [ClickUp](https://mobbin.com/screens/3e06d063-e0a2-497e-8880-167964137670) — Inbox — search, tabs with counts (including Cleared), filter chips, rows with a status sentence
- [Matter](https://mobbin.com/screens/cf05d193-c232-4bd5-87f6-3f1d21db6603) — Queue — the active filter as a removable chip under the title

**Common pattern across the references:** Title with a count, segmented filters with counts, a clean card/row list where each row's second line is a plain status sentence, one create action, and 'done' as a first-class filter.

**Lesson most relevant to Ride Price:** Ride Price's queue already has the right bones. The gains are the card's next-step line, a real place for finished deals, and the single action under the thumb.

**Should influence:** Home — Deals Queue; any future list screen (vehicles, customers).

Used by: RP-IMP-001, RP-IMP-002, RP-IMP-003, RP-IMP-007

## M5 · Status rows and 'what happens next' lines

**Ride Price problem it was looked up for:** Rows and cards that should tell the user the next step or the current state in one line.

**What was reviewed:**
- [Grab Driver](https://mobbin.com/screens/094b300e-f89e-480f-a72a-762788d331f9) — Vertical timeline with a one-line 'what happens next' under the active node
- [Speechify](https://mobbin.com/screens/fc68b660-9afc-44d0-ba6b-2f31894a6e05) — Checklist card — done items struck through, the next item bold
- [MoonPay](https://mobbin.com/screens/7b8e43b3-ed3a-473a-b921-7a60c914ee02) — Each requirement a row with a green check or pending icon

**Common pattern across the references:** Status is a row-level icon plus a short word; done items recede; the next thing is the boldest thing; one sentence under the active item says what happens next.

**Lesson most relevant to Ride Price:** Say 'Next ·' on the deal card; later areas (jacket, client upload) use the same rule for document rows.

**Should influence:** Home deal card; Deal Jacket rows; Client Document Upload rows.

Used by: RP-IMP-003, RP-IMP-007

## M17 · Navigation drawer and identity header

**Ride Price problem it was looked up for:** Home — the drawer's active state and the role switch's 'who am I' cue.

**What was reviewed:**
- [Microsoft Outlook](https://mobbin.com/screens/5516b226-0b53-45f0-abf7-a4c9e69fbf86) — Account header, favourites first with count badges, secondary folders, help/settings pinned bottom; active row tinted
- [Spotify](https://mobbin.com/screens/5867a8ca-fcc6-4749-b59e-ceccfa7493ff) — Profile header with 'Add account' under it, plain rows, one section label
- [X](https://mobbin.com/screens/296ece73-7630-4846-a67b-8d4772ef70a0) — Profile header, account-switcher avatar, plain rows, settings at the bottom
- [Nextdoor](https://mobbin.com/screens/4e6ef4c3-a9b5-4a54-a33b-1c68a091a873) — Name + place header, a second identity as a named row

**Common pattern across the references:** Identity at the top (name, role/place, a switcher beside it), grouped plain rows, the active place marked with a tint or bar, counts as badges, destructive/settings pinned at the bottom.

**Lesson most relevant to Ride Price:** Ride Price's drawer already has this shape; spend the gradient only on the forward action, mark 'you are here' with a tint + bar, and keep the acting person's name where the role switch is.

**Should influence:** Home drawer and app bar.

Used by: RP-IMP-004, RP-IMP-006

## M18 · Filtered empty state with a way out

**Ride Price problem it was looked up for:** Home — the pipeline filter with zero matches.

**What was reviewed:**
- [Google Drive](https://mobbin.com/screens/f9f86637-40e2-4126-a850-5106dc9cf02a) — 'No matching results' + Clear filters; chips stay visible
- [Wise](https://mobbin.com/screens/0cdba498-dc6c-40a0-97fb-9acb9b7a417f) — 'Your filters have returned no results' + Clear filters pill
- [Quizlet](https://mobbin.com/screens/0230bbe1-bbd9-4605-96b2-0810ffd26bd4) — Names the filters, one Clear filters button

**Common pattern across the references:** The sentence blames the filter, not the data, and one button clears it.

**Lesson most relevant to Ride Price:** Name the state and give a 'Show all' — the title count and the list should never disagree without the sentence explaining why.

**Should influence:** Home pipeline pills; vehicle search 'no match'; customer search 'no match'.

Used by: RP-IMP-005

## M19 · Bottom-anchored primary action on a list or long screen

**Ride Price problem it was looked up for:** Home (and Find a Customer, Training) — the page's one forward action sits at the top of the screen.

**What was reviewed:**
- [Careem](https://mobbin.com/screens/160656d3-ef01-4163-87bc-ca4c2abd7551) — List above, 'Total | Next' pinned in a bottom bar
- [Booking.com](https://mobbin.com/screens/4866022b-0da2-40c5-9a0d-0f32c50bf4b5) — Options list, total + Next pinned at the bottom
- [ANZ Plus](https://mobbin.com/screens/a8cd9bc8-1a4d-44b2-86fa-986c67c11185) — Continue then a pinned summary card — the result and the next step travel together at the bottom
- [Zillow](https://mobbin.com/screens/b41cd10a-f8dc-4a53-9f87-5f8c7980394d) — Hero number at the top, collapsible sections, pinned CTA row at the bottom

**Common pattern across the references:** The forward action lives in a thin bottom bar (white, hairline, one strong button, sometimes a summary value beside it); the page content scrolls under it; the header orients but does not act.

**Lesson most relevant to Ride Price:** Give the gradient action a fixed home at the bottom on phones — the same home on every screen — and let the page bar carry the title, count and context only.

**Should influence:** Home, Find a Customer, Training pages now; Desking, Credit Application and the Finance Menu later (same rule, bigger gain).

Used by: RP-IMP-001

## M20 · Focused ID-scan journey

**Ride Price problem it was looked up for:** Scan Driver's License — does the shell fit what the flow became, and how do back/exit behave?

**What was reviewed:**
- [DoorDash Dasher](https://mobbin.com/flows/cfb0e2cd-ecb5-42f1-bca1-c41d7a454ec9) — Verifying identity — one task per screen, light progress, secondary fallbacks
- [Turo](https://mobbin.com/flows/ae6568f6-f71e-4a64-a158-eb80d867d9ce) — Scanning a driver's license as a focused full-screen flow
- [Chime](https://mobbin.com/flows/9d0a1507-23f6-4dce-8beb-785ebcc3cdff) — Capture, coaching and review as sibling screens; back vs exit separated
- [State Farm](https://mobbin.com/flows/17ad65bd-82dd-455a-97eb-0bffd6f5e12e) — License scan with manual entry as an always-visible fallback

**Common pattern across the references:** Identity capture owns the screen; simple back/exit up top; one dominant task per screen; manual entry visible but secondary; leaving a part-done capture asks once.

**Lesson most relevant to Ride Price:** Ride Price's ritual is right; the open question is the shell (owner Q2) — and back-vs-exit semantics apply at any answer.

**Should influence:** Scan Driver's License; the test-drive licence scan reuses whatever is decided.

Used by: RP-IMP-009, RP-IMP-019, RP-IMP-020

## M21 · Scan-failure coaching and processing states

**Ride Price problem it was looked up for:** Scan Driver's License — the refusal copy and the reading beat.

**What was reviewed:**
- [Chime](https://mobbin.com/screens/b5f8b32b-2309-426f-9dbc-5007eaf680ef) — Common scan issues as short coaching bullets (glare, blur, framing)
- [Chase UK](https://mobbin.com/screens/36260299-2210-4fe6-8f64-83b025e12e25) — Scan failure — one explanation, one matched recovery
- [Kraken](https://mobbin.com/screens/d2516872-142d-4210-a85c-c2f8c1771036) — Processing ID — status + time expectation, stable surface

**Common pattern across the references:** Short cause-shaped coaching, one recovery per message, a processing state that names the wait and holds still.

**Lesson most relevant to Ride Price:** Ride Price adapts the structure only — it must not claim diagnosis it cannot make (the recognizer finds a prop or refuses; invariant 4).

**Should influence:** The refusal, reading and capture-hint steps of the scanner.

Used by: RP-IMP-014, RP-IMP-015, RP-IMP-016

## M22 · Duplicate-identity decisions with evidence

**Ride Price problem it was looked up for:** Scan Driver's License — the possible-match and phone-conflict interstitials.

**What was reviewed:**
- [Uber](https://mobbin.com/screens/e29b477a-32d4-4615-96d7-1d27213b54f2) — 'Is this you?' — the matched account's facts shown with the decision
- [LINE](https://mobbin.com/screens/22683c13-9c12-47e4-9c20-8b3a44f665ee) — Known-account confirmation showing what is known

**Common pattern across the references:** The evidence, the consequence of each action, and the cheap fix-it path presented as one decision object.

**Lesson most relevant to Ride Price:** Show the scanned facts against the on-file record (absent values as — , never invented), name the colliding datum, and offer the typo fix.

**Should influence:** Possible match, phone conflict; any future dedupe prompt.

Used by: RP-IMP-012, RP-IMP-013

## M23 · Summary-first review of extracted data

**Ride Price problem it was looked up for:** Scan Driver's License — the verify steps (owner Q1: reverses decision 11 if adopted).

**What was reviewed:**
- [Cash App](https://mobbin.com/screens/5b7cf0d7-41d9-4290-ad82-62bbd2f744ba) — Confirm information — summary rows with per-item Edit
- [Stake](https://mobbin.com/screens/04d0d056-6ab7-404b-bc57-3a022a3cb6ce) — Review extracted details, edit affordances per field
- [Kit](https://mobbin.com/screens/43319bae-45cf-48bf-a583-f5caf25aeeeb) — Grouped identity/address review cards with edit icons
- [Greenlight](https://mobbin.com/screens/2ab995a3-438e-4e02-b68b-1aa1af233715) — Summary card + one Edit path + a single accept control

**Common pattern across the references:** Extracted values render read-first, grouped; Edit is one tap away; the only open inputs are the ones the system could not fill.

**Lesson most relevant to Ride Price:** Both reviewers proposed it independently — but in Ride Price it reverses a recorded owner decision (11), so it ships only on the owner's explicit reversal; the compatible slice is grouping + changed-value markers.

**Should influence:** Scan verify (both variants); the test-drive licence verify; any future extracted-data review.

Used by: RP-IMP-010

## M4 · ID capture, one instruction per step

**Ride Price problem it was looked up for:** Scan Driver's License — the capture steps' guidance, frame and fallback.

**What was reviewed:**
- [Wise](https://mobbin.com/screens/1aa66a67-7fdf-4bcc-9ded-0a1ddbb826f0) — 'Back side of your ID' — the side named, requirements stated, big shutter
- [Uber](https://mobbin.com/screens/177128f6-fb23-43a2-86a3-a3bb6030297b) — A barcode-shaped guide for the back side
- [State Farm](https://mobbin.com/screens/f99f346c-71a7-4828-838d-75bec29d1fd9) — 'Scan the barcode on the back' + manual entry as a full-width fallback
- [Chase UK](https://mobbin.com/screens/4de35236-d5e1-429a-bd7b-42855b899374) — A dashed border guide — 'move your ID inside the border'
- [N26](https://mobbin.com/screens/43382779-a524-44ae-a418-b6bf7eb93cf0) — 'Get your document ready' make-sure bullets before the camera

**Common pattern across the references:** One instruction per step, the side named, a frame shaped like the thing being captured, a visible manual fallback, guidance inside the journey.

**Lesson most relevant to Ride Price:** Ride Price has no live viewfinder (invariant 5), so the lesson lands on the pre-capture screen: the shaped illustration, one sentence, one big capture control, the fallback visible — and help that never leaves the flow.

**Should influence:** Scanner capture steps; the test-drive licence scan; the deal-document scan entry.

Used by: RP-IMP-008, RP-IMP-017, RP-IMP-018

## M10 · Review & confirm before an action with consequences

**Ride Price problem it was looked up for:** Verify/confirm screens whose one button commits multiple effects.

**What was reviewed:**
- [Wealthsimple](https://mobbin.com/screens/bbc659bb-b399-4c1d-aab2-7db05de763d0) — 'Please review your agreement' — documents as links, one checkbox, Confirm + an edit path
- [Greenlight](https://mobbin.com/screens/2ab995a3-438e-4e02-b68b-1aa1af233715) — 'Confirm your information' summary with Edit, one accept control
- [Cash App](https://mobbin.com/screens/42e423db-c08c-449c-98b6-178c52d5ac69) — Rows with Edit; the CTA names the produced outcome
- [Beli](https://mobbin.com/screens/d4de8ae9-dde3-4f42-bc98-ea19f3a1216b) — 'Agree and reserve' — one CTA carrying both effects by name

**Common pattern across the references:** The figures being agreed to sit beside the accept control, an edit path is visible, and the CTA names the whole outcome.

**Lesson most relevant to Ride Price:** Ride Price's verify CTAs must say they start the visit; the summary-vs-form posture is the separate Q1.

**Should influence:** Scan verify CTAs; the agreement and disclosure confirms; the menu initials modal.

Used by: RP-IMP-011

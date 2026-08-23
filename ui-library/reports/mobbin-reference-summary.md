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

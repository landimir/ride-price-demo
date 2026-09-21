# Ride Price Mobile UI — Opportunity Board

Updated 2026-09-18 · 2 of 20 product areas reviewed · 21 recommendations so far, 5 open. This board is generated from the screen improvement matrix and grows as each area is reviewed — until every area is in, "top" means top of what has been reviewed.

## Top opportunities (open only — by priority, then severity, then how widely they repeat)

| # | Id | Area | Opportunity | Priority | Severity | Size | Status |
|---|---|---|---|---|---|---|---|
| 1 | RP-IMP-001 | Home — Deals Queue & Navigation | The only forward action sits in the hardest thumb zone while 60% of the screen is empty | High | Major | medium | Open — still open on Home: the owner's call, since New visit sits on his own title-row layout |
| 2 | RP-IMP-003 | Home — Deals Queue & Navigation | The card does not say what comes next, and the search-field camera promises the wrong scan | Medium | Minor | small | Partly built — PR #44 built the Next line; the camera half is still open |
| 3 | RP-IMP-004 | Home — Deals Queue & Navigation | The drawer spends the brand gradient on a selected state | Low | Minor | small | Open |
| 4 | RP-IMP-006 | Home — Deals Queue & Navigation | No login by design — keep the 'who am I' cue consistent | Low | Observation | small | Open — its Home-switch part superseded by owner ruling B (2026-09-18) |
| 5 | RP-IMP-005 | Home — Deals Queue & Navigation | A filter with no matches contradicts the title and offers no way back | Low | Observation | small | Open |

## Closed

_Kept as the record of what was recommended and how it ended — out of the ranking. Each status is read from the recommendation's own note._

| Id | Area | Recommendation | Status | How it closed | Closed on |
|---|---|---|---|---|---|
| RP-IMP-007 | Home — Deals Queue & Navigation | Role-aware queue: same four identifiers for everyone, dense rows for the Team Lead, a Next line for the advisor | Built | PR #44, after the owner's corrections on built screenshots | 2026-08-23 |
| RP-IMP-008 | Scan Driver's License | The training-license help links tear down the scan, and the demo guidance whispers | Resolved | PR #49 | 2026-08-26 |
| RP-IMP-010 | Scan Driver's License | Summary-first verify — both reviewers propose it; it reverses decision 11 (owner question Q1) | Built | PR #46; decision 11 reversed by the owner | 2026-08-24 |
| RP-IMP-012 | Scan Driver's License | The possible-match screen asks a high-stakes question with a one-line clue | Resolved | PRs #46/#49 | 2026-08-26 |
| RP-IMP-013 | Scan Driver's License | The phone-conflict screen hides the number it is warning about | Resolved | PR #49, with the owner's 2026-08-25 addition | 2026-08-26 |
| RP-IMP-011 | Scan Driver's License | The verify CTAs understate what they do — they also start the visit | Resolved | PR #49 | 2026-08-26 |
| RP-IMP-002 | Home — Deals Queue & Navigation | Finished deals hide behind a 20px grey caption | Resolved | Home v3 removed the Archived fold | 2026-08-28 |
| RP-IMP-021 | Scan Driver's License | Step 0 — the how-it-works intro with the advisor word track | Built | scan journey v2 (PR #46), then trimmed by the owner's corrections | 2026-08-24 |
| RP-IMP-009 | Scan Driver's License | Where the scan journey lives: full screen, bottom sheets, or the current modal (owner question Q2) | Built | the full-screen journey: the owner's answer to Q2 (2026-08-23), built in PR #46 | 2026-08-24 |
| RP-IMP-019 | Scan Driver's License | Closing mid-scan discards captured work silently | Resolved | PR #49 | 2026-08-26 |
| RP-IMP-014 | Scan Driver's License | The refusal explains four things in one small paragraph | Resolved | PR #49 | 2026-08-26 |
| RP-IMP-017 | Scan Driver's License | The back step could show what the barcode side should look like | Resolved | PR #49 | 2026-08-26 |
| RP-IMP-018 | Scan Driver's License | Small capture-step polish: the photo action as a visible button, the status attached, Retake labelled | Superseded | the v3 camera panel, PR #49 | 2026-08-26 |
| RP-IMP-015 | Scan Driver's License | The processing state sets no time expectation | Resolved | PR #49 | 2026-08-26 |
| RP-IMP-016 | Scan Driver's License | The dialog height jumps twice around the one-second spinner | Obsolete | the journey went full-screen, so no dialog is left to jump | 2026-08-27 |
| RP-IMP-020 | Scan Driver's License | The step chips: strong orientation, at a vertical price — recorded disagreement | Superseded | five step dots in the one-row chrome, PR #49 | 2026-08-26 |

## Which areas need the most attention

| Area | Open | High priority, open | Closed |
|---|---|---|---|
| Home — Deals Queue & Navigation | 5 | 1 | 2 |
| Scan Driver's License | 0 | 0 | 14 |

## Open issues that repeat across screens

- **RP-IMP-001** — The only forward action sits in the hardest thumb zone while 60% of the screen is empty — on 5 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation; Customer Onboarding — the Customer Resolver)
- **RP-IMP-003** — The card does not say what comes next, and the search-field camera promises the wrong scan — on 4 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation)
- **RP-IMP-004** — The drawer spends the brand gradient on a selected state — on 2 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation)
- **RP-IMP-006** — No login by design — keep the 'who am I' cue consistent — on 2 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation)

## Biggest overall gains

- The role-aware queue (RP-IMP-007, BUILT in PR #44): the four identifiers on every row for both roles; the advisor gains the guided Next line without pills; the Team Lead keeps his two-lane floor view. The four-identifier rule is the principle every later list screen inherits.
- One fixed home for the forward action on phones (a bottom bar) — delivered across the deal flows, and the same change the remaining Majors will need. (2026-08-27: the desking screens and the Base Payment Agreement carry that pinned bottom dock — the master canvas made it the house pattern; the credit application and the F&I presentation carry it as of 2026-08-28; the finance menu is the one left. 2026-09-10, CodeRabbit #98: this row was filed against HOME and its opening sentence said the bar fixes Home's thumb reach "now", which was never built — Home keeps + New Customer Visit on the title row, the owner's own 2026-08-20 sample layout, his call. A first correction added that fact in this parenthetical and left the opening sentence claiming the opposite, which is how a note ends up arguing with itself; the sentence itself is fixed now. What this row records is the pattern the other flows adopted; on Home the bottom bar is still only a proposal, RP-IMP-001, open until the owner decides.)
- 'Next ·' on the card — built for the advisor in PR #44 (RP-IMP-003, partly built): the home screen answers an advisor's first question without a tap. (2026-09-09: 'Done as a first-class filter' was listed here as a gain too, and it was never built that way. What shipped: the FILTER PILLS render for the TEAM LEAD only and are All / Desking / F&I — there is no Done pill, and the advisor gets no pills at all. Their funded deals end the one list under a 'Completed' section heading, while the Team Lead reaches funded contracts through the date/history sheet. The row's own STAGE CHIP is a different control and renders for BOTH roles: dealRow() emits .rp-badge unconditionally, and the only role gate near it is whether a complete deal reads 'Funded · <date>' or 'Done'. DEAL_BUCKETS does define a 'done' bucket, but dealBucket() uses it for that row chip and badge, never for a filter. 2026-09-10, CodeRabbit #98: this note called the Team Lead's pills 'stage chips', which is the row control's name, and so denied the advisor a chip they have. A first correction fixed the second half and left the first half using the wrong name — both are named for what they are now. The Done filter stays a proposal, not a delivered gain.)

## Where to start

1. Open now: 5 of 21 recommendations, all on Home — RP-IMP-001 (where New visit lives on phones: a proposal against the owner's own title-row layout, his call), the camera half of RP-IMP-003, RP-IMP-004, RP-IMP-005 and RP-IMP-006. Home moved to the owner's kit after its 2026-08-23 review, so check each against today's screen before building from it.
2. Scan Driver's License: all 14 recommendations are closed — built, resolved, superseded or obsolete (see Closed). The flow has been reworked several times since its review, most recently on the owner's kit (package v023, 2026-09-05) and by the scanner merged in PR #106 (2026-09-18), so a fresh review of that area starts from today's screens.
3. (2026-08-31) RP-UI-017 (the Team Lead Archived row's touch target) was listed on this board as still open for five versions after it was retired — the 20px Archived fold is gone and funded contracts live behind the Team Lead date/history sheet. See reports/retired-issues.md. Both corrections now live in screen-improvement-matrix.json, the file this board is generated from, so rebuilding cannot drop them.
4. (2026-09-02) Training Documents V3 replaced the two prop pages with one hub, so the old training screenshots are gone. RP-IMP-001 listed both as places it also appeared; those two entries are removed rather than repointed, because the finding describes a mostly-empty screen whose only forward action sits in the hard thumb zone, and the new hub is a full list of pair rows — whether it still applies there is a question for the area's own review, not an assumption to carry forward.

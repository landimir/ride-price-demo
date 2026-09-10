# Ride Price Mobile UI — Opportunity Board

Updated 2026-09-10 · 2 of 20 product areas reviewed · 21 recommendations so far. This board is generated from the screen improvement matrix and grows as each area is reviewed — until every area is in, "top" means top of what has been reviewed.

## Top opportunities (by priority, then severity, then how widely they repeat)

| # | Id | Area | Opportunity | Priority | Severity | Size |
|---|---|---|---|---|---|---|
| 1 | RP-IMP-001 | Home — Deals Queue & Navigation | The only forward action sits in the hardest thumb zone while 60% of the screen is empty | High | Major | medium |
| 2 | RP-IMP-007 | Home — Deals Queue & Navigation | Role-aware queue: same four identifiers for everyone, dense rows for the Team Lead, a Next line for the advisor | High | Major | medium |
| 3 | RP-IMP-008 | Scan Driver's License | The training-license help links tear down the scan, and the demo guidance whispers | High | Major | small |
| 4 | RP-IMP-010 | Scan Driver's License | Summary-first verify — both reviewers propose it; it reverses decision 11 (owner question Q1) | High | Major | medium |
| 5 | RP-IMP-012 | Scan Driver's License | The possible-match screen asks a high-stakes question with a one-line clue | High | Major | small |
| 6 | RP-IMP-013 | Scan Driver's License | The phone-conflict screen hides the number it is warning about | High | Major | small |
| 7 | RP-IMP-011 | Scan Driver's License | The verify CTAs understate what they do — they also start the visit | High | Minor | small |
| 8 | RP-IMP-002 | Home — Deals Queue & Navigation | Finished deals hide behind a 20px grey caption | High | Minor | small |
| 9 | RP-IMP-021 | Scan Driver's License | Step 0 — the how-it-works intro with the advisor word track | High | Minor | small |
| 10 | RP-IMP-009 | Scan Driver's License | Where the scan journey lives: full screen, bottom sheets, or the current modal (owner question Q2) | Medium | Major | major |

## Which areas need the most attention

| Area | Recommendations | High priority |
|---|---|---|
| Scan Driver's License | 14 | 6 |
| Home — Deals Queue & Navigation | 7 | 3 |

## Issues that repeat across screens

- **RP-IMP-001** — The only forward action sits in the hardest thumb zone while 60% of the screen is empty — on 5 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation; Customer Onboarding — the Customer Resolver)
- **RP-IMP-003** — The card does not say what comes next, and the search-field camera promises the wrong scan — on 4 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation)
- **RP-IMP-004** — The drawer spends the brand gradient on a selected state — on 2 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation)
- **RP-IMP-006** — No login by design — keep the 'who am I' cue consistent — on 2 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation)
- **RP-IMP-007** — Role-aware queue: same four identifiers for everyone, dense rows for the Team Lead, a Next line for the advisor — on 3 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation)
- **RP-IMP-008** — The training-license help links tear down the scan, and the demo guidance whispers — on 3 screens (Scan Driver's License)
- **RP-IMP-009** — Where the scan journey lives: full screen, bottom sheets, or the current modal (owner question Q2) — on 3 screens (Scan Driver's License)
- **RP-IMP-010** — Summary-first verify — both reviewers propose it; it reverses decision 11 (owner question Q1) — on 2 screens (Scan Driver's License)
- **RP-IMP-011** — The verify CTAs understate what they do — they also start the visit — on 2 screens (Scan Driver's License)
- **RP-IMP-018** — Small capture-step polish: the photo action as a visible button, the status attached, Retake labelled — on 2 screens (Scan Driver's License)
- **RP-IMP-019** — Closing mid-scan discards captured work silently — on 2 screens (Scan Driver's License)

## Biggest overall gains

- The role-aware queue (RP-IMP-007, BUILT): the four identifiers on every row for both roles; the advisor gains the guided Next line without pills; the Team Lead keeps his two-lane floor view. The four-identifier rule is the principle every later list screen inherits.
- One fixed home for the forward action on phones (a bottom bar) — delivered across the deal flows, and the same change the remaining Majors will need. (2026-08-27: the desking screens and the Base Payment Agreement carry that pinned bottom dock — the master canvas made it the house pattern; the credit application and the F&I presentation carry it as of 2026-08-28; the finance menu is the one left. 2026-09-10, CodeRabbit #98: this row was filed against HOME and its opening sentence said the bar fixes Home's thumb reach "now", which was never built and is not going to be — Home keeps + New Customer Visit on the title row, the owner's own 2026-08-20 sample layout, his call. A first correction added that fact in this parenthetical and left the opening sentence claiming the opposite, which is how a note ends up arguing with itself; the sentence itself is fixed now. For Home this row is CLOSED, not pending. What it records is a pattern the other flows adopted.)
- 'Next ·' on the card — a small change that makes the home screen answer an advisor's first question without a tap. (2026-09-09: 'Done as a first-class filter' was listed here as a gain too, and it was never built that way. What shipped: the FILTER PILLS render for the TEAM LEAD only and are All / Desking / F&I — there is no Done pill, and the advisor gets no pills at all. Their funded deals end the one list under a 'Completed' section heading, while the Team Lead reaches funded contracts through the date/history sheet. The row's own STAGE CHIP is a different control and renders for BOTH roles: dealRow() emits .rp-badge unconditionally, and the only role gate near it is whether a complete deal reads 'Funded · <date>' or 'Done'. DEAL_BUCKETS does define a 'done' bucket, but dealBucket() uses it for that row chip and badge, never for a filter. 2026-09-10, CodeRabbit #98: this note called the Team Lead's pills 'stage chips', which is the row control's name, and so denied the advisor a chip they have. A first correction fixed the second half and left the first half using the wrong name — both are named for what they are now. This stays listed as a PROPOSAL, not a delivered gain.)

## Where to start

1. Scan Driver's License is REVIEWED (area 2 of 20 in review order) via the first external-draft intake: 14 recommendations, two owner questions answered (Q1 summary-first verify vs decision 11; Q2 the scanner's shell), four external items killed on invariants/decisions — see the area's intake record.
2. Build order once the owner answers (SUPERSEDED by item 4 below, 2026-09-01 — scan-v2 rebuilt the flow, so RP-IMP-012 and RP-IMP-013 describe screens that no longer exist and nothing here is picked up before the area is re-reviewed; kept as the record of what was planned): RP-IMP-012 + 013 (the identity screens), RP-IMP-008 (the tear-down bug + guidance), RP-IMP-011 (CTA outcomes), then the Q1/Q2-dependent work.
3. Still open from Home: where + New Customer Visit lives on phones (RP-IMP-001).
4. (2026-09-01) The Scan Driver's License rows above predate the owner's scan-v2 package (2026-08-28), which rebuilt the flow and answered both owner questions — at least RP-IMP-012 and RP-IMP-013 describe screens that no longer exist in that form. The area needs a re-review against the built v2 before anything here is picked up; do not build from these rows as written. (2026-09-10, CodeRabbit #98: this caution has been partly overtaken. RP-IMP-012 and RP-IMP-013 were re-scored on 2026-08-27 and stand as SUPERSEDED — delivered by the v2 rebuild in PRs #46/#49 — and RP-IMP-011 and RP-IMP-008 with them, so those four are settled rather than waiting. The flow was then rebuilt a SECOND time by the owner's kit package v023 on 2026-09-05, which is what the eleven screens in the library show today. What still holds is the narrower half: any scan row here that has not been individually re-scored describes pre-v2 screens, so read the row's own status before building from it.)
5. (2026-08-31) RP-UI-017 (the Team Lead Archived row's touch target) was listed on this board as still open for five versions after it was retired — the 20px Archived fold is gone and funded contracts live behind the Team Lead date/history sheet. See reports/retired-issues.md. Both corrections now live in screen-improvement-matrix.json, the file this board is generated from, so rebuilding cannot drop them.
6. (2026-09-02) Training Documents V3 replaced the two prop pages with one hub, so the old training screenshots are gone. RP-IMP-001 listed both as places it also appeared; those two entries are removed rather than repointed, because the finding describes a mostly-empty screen whose only forward action sits in the hard thumb zone, and the new hub is a full list of pair rows — whether it still applies there is a question for the area's own review, not an assumption to carry forward.

# Ride Price Mobile UI — Opportunity Board

Updated 2026-08-28 · 2 of 20 product areas reviewed · 21 recommendations so far. This board is generated from the screen improvement matrix and grows as each area is reviewed — until every area is in, "top" means top of what has been reviewed.

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

- **RP-IMP-001** — The only forward action sits in the hardest thumb zone while 60% of the screen is empty — on 7 screens (Home — Deals Queue & Navigation; Home — Active Floor & Navigation; Customer Onboarding — the Customer Resolver; Training Licenses & Registrations)
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
- One fixed home for the forward action on phones (a bottom bar) — it fixes Home's thumb reach now and is the same change the desking, credit-application and finance-menu Majors will need later. (2026-08-27: the desking screens and the Base Payment Agreement now carry that pinned bottom dock — the master canvas made it the house pattern; the credit application and the F&I presentation carry it as of 2026-08-28; the finance menu is the one left.)
- 'Done' as a first-class filter and 'Next ·' on the card — two small changes that make the home screen answer a manager's and an advisor's first questions without a tap.

## Where to start

1. Scan Driver's License is REVIEWED (area 2 of 20 in review order) via the first external-draft intake: 14 recommendations, two owner questions answered (Q1 summary-first verify vs decision 11; Q2 the scanner's shell), four external items killed on invariants/decisions — see the area's intake record.
2. Build order once the owner answers: RP-IMP-012 + 013 (the identity screens), RP-IMP-008 (the tear-down bug + guidance), RP-IMP-011 (CTA outcomes), then the Q1/Q2-dependent work.
3. Still open from Home: where + New Customer Visit lives on phones (RP-IMP-001). (RP-UI-017, the Team Lead Archived row's touch target, was listed here as still open long after it was retired at v009 — the 20px Archived fold is gone and funded contracts live behind the Team Lead date/history sheet. Corrected 2026-08-31.)

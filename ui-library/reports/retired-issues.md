# Retired audit findings

Why each finding left the board, and what holds it fixed.

## v008 (2026-08-27, PR #51)

- **RP-UI-001** — Fixed on PR #51 (2026-08-27). The pencil was rebuilt from the owner's desking prototype: the payment bar is pinned at every width, tracks the terms live, and carries Continue beside the figure, so the number and the next step are never more than a thumb apart. deskreach.mjs holds the finding permanently — it scrolls the column and asserts both are on screen at every position.
- **RP-UI-016** — Fixed on PR #51 (2026-08-27). The credit slider is a 44px interaction area with a 28px thumb over the tier gradient, and it is one control — the decorative dot beside it is gone. deskreach.mjs asserts the 44px floor and that exactly one range input sits in the bar.
- **RP-UI-013** — Fixed on PR #51 (2026-08-27). The Your Journey popover is gone: the card's first tap opens a details sheet, and the journey appears once — after a vehicle is chosen — in a next-steps sheet that keeps the chosen vehicle visible above the actions, so nothing covers what the advisor is choosing.
- **RP-UI-020** — Fixed on PR #51 (2026-08-27). Browse mode no longer carries a per-card menu at all. One page-level banner says what a customer visit unlocks, and the details sheet withholds 'Choose this vehicle' rather than offering an action that cannot complete. masterpages.mjs holds the gate.
- **RP-UI-021** — Fixed on PR #51 (2026-08-27). The filter panel no longer occupies the first screen: vehicle type is a compact chip rail and everything else lives in a Filters sheet, so inventory is what the phone opens on.

## v009 (2026-08-28)

- **RP-UI-017** — The 20px grey "Archived — funded contracts" fold is gone. Funded contracts live behind the Team Lead's date/history sheet, so there is no undersized text row standing in for a control. (This one sat on the opportunity board as "still open" for five versions after it was retired; corrected 2026-08-31.)
- **RP-UI-002**, **RP-UI-010**, **RP-UI-011**, **RP-UI-019** — Retired with the Home v3 package. See the v009 changelog entry for what each described; the queue that carried them was replaced wholesale.

## v012 (2026-08-30, PR #55)

- **RP-UI-006** — The five-step menu stepper wrapped into three rows of pills on a phone. Finance Menu V3 replaced it with four stage pills on one row, and `menu3.mjs` asserts they never wrap and never overflow at 390px.
- **RP-UI-007** — The finalize toast cited the retired deals table ("now shows dark blue in the Deals list"). There is no finalize toast now; the completion screen says the deal left the active queue.
- **RP-UI-009** — Toggle Payment sat below the Accept CTA, so the custom payment was revealed after the decision it informs. "Show custom payment" now sits inside the payment card, above the product list and the dock.

## v013 (2026-08-31, PR #57)

- **RP-UI-008** — A long product label pushed its price onto the next line, left-aligned, and the money column stopped being a column (6 of 7 rows on the Repayment Options printable). `.lines li` is a two-column grid now: the label wraps inside its own column and the amount stays right-aligned. `print2.mjs` measures every amount on five printables at four widths.

## v014 (2026-08-31, PR #59)

- **RP-UI-024** — The role pill was 65×35 to 82×35 on 8 of 20 flows, under the 40px small-variant floor. Now ≥40px. `touchfloor.mjs` holds it.
- **RP-UI-025** — The master sheet's close was 34×34, and 28×40 in the jacket because a long sheet title squeezed it inside the flex header. Now 40×40 with `flex: none`, so a title cannot compress it. `touchfloor.mjs` holds it.
- **RP-UI-015** — The Snap All thumbnail remove control was 24×24. A 40px disc would have covered a third of a 76px thumbnail, so the button is 40px and transparent with the visible 24px badge drawn inside it — the tap area meets the floor, the badge is unchanged and stays pinned at the tile's corner.

**What holds all three:** `harness/touchfloor.mjs` walks 22 registered routes at 390px, opens every sheet on each, and reports any small-variant control under 40px. It refuses to pass on a redirected hash, a short route list, or fewer than 300 controls measured — an audit that reached nothing reports nothing.

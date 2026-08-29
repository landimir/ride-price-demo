# Retired audit findings

Why each finding left the board, and what holds it fixed.

## v008 (2026-08-27, PR #51)

- **RP-UI-001** — Fixed on PR #51 (2026-08-27). The pencil was rebuilt from the owner's desking prototype: the payment bar is pinned at every width, tracks the terms live, and carries Continue beside the figure, so the number and the next step are never more than a thumb apart. deskreach.mjs holds the finding permanently — it scrolls the column and asserts both are on screen at every position.
- **RP-UI-016** — Fixed on PR #51 (2026-08-27). The credit slider is a 44px interaction area with a 28px thumb over the tier gradient, and it is one control — the decorative dot beside it is gone. deskreach.mjs asserts the 44px floor and that exactly one range input sits in the bar.
- **RP-UI-013** — Fixed on PR #51 (2026-08-27). The Your Journey popover is gone: the card's first tap opens a details sheet, and the journey appears once — after a vehicle is chosen — in a next-steps sheet that keeps the chosen vehicle visible above the actions, so nothing covers what the advisor is choosing.
- **RP-UI-020** — Fixed on PR #51 (2026-08-27). Browse mode no longer carries a per-card menu at all. One page-level banner says what a customer visit unlocks, and the details sheet withholds 'Choose this vehicle' rather than offering an action that cannot complete. masterpages.mjs holds the gate.
- **RP-UI-021** — Fixed on PR #51 (2026-08-27). The filter panel no longer occupies the first screen: vehicle type is a compact chip rail and everything else lives in a Filters sheet, so inventory is what the phone opens on.

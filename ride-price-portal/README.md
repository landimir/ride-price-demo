# Ride Price Portal (demo)

A working recreation of the Ride Price dealer software — the screens shown throughout the training binder — as a plain HTML/CSS/JS single-page app. The full deal journey runs end-to-end with real payment math, using demo data stored in the browser (localStorage).

> **Demo tool only.** There is no backend — never enter real SSNs or personal data. The credit application accepts `000-00-0000`.

## The flow

| Screen | What it does |
|---|---|
| **Deals** | Dashboard + deals list with stage badges. Finalized deals turn dark blue, just like the real system. |
| **Find a Customer** | Search-first workflow, Create Customer modal with the binder's required-field rules. |
| **Discovery Session** | The 7-question "week in the life of your vehicle" interview. |
| **Vehicle Search** | Filterable demo inventory with the **Your Journey** menu (Test Drive / Trade Appraisal / Calculate Payment / Quote). |
| **Test Drive Agreement** | E-signature authorization → license & terms → in-progress → end-drive odometer capture. |
| **Trade-In Evaluation** | The "introduce your friend, the trade expert" flow with a mock valuation engine. |
| **Calculate Payments** | Full desking screen: Finance / Lease / Cash / One-Pay, accessories, trade & rebate, tax credit toggle, credit-score slider (sets rate tier), live word track, Compare Payments. |
| **Base Payment Agreement** | Signed acknowledgement doc, Redesk (voids signature), print for the deal folder. |
| **Lending Lane** | Credit application (Individual/Joint per Reg B) → instant demo approval with a qualified rate below the agreed rate. |
| **Menu (4 steps)** | Purchase Terms disclosure bars (Agreed/Qualified/Disclosure — lease and cash get their own boxes) → Repayment Options with Preferred/Standard/Budget + drag-to-Custom (300% rule) → Benefits acknowledgement + deal forms → Financial contracts, DMS push, Finalize. |

## Payment math

- **Finance** — standard amortization over term at APR; taxes computed on price minus trade allowance when the tax credit applies (CO-style state/county/city/RTD rates).
- **Lease** — residual % of MSRP by term (mileage-adjusted), money-factor rent charge, monthly use tax, cap-cost-reduction tax.
- **Cash** — total due with taxes/fees/trade equity.
- **One-Pay** — all base payments up front at a reduced money factor.
- Credit tiers map the score slider to agreed/qualified APRs and lease factors.

## Running it

Static site, no build: double-click `index.html`, or serve with `npx http-server -p 8322`.
**Reset demo data** (Deals page) restores the seeded customers/deal.

Files: `index.html` (shell) · `assets/portal.css` (UI) · `assets/data.js` (inventory, products, programs, rates) · `assets/calc.js` (deal math) · `assets/app.js` (router + views).

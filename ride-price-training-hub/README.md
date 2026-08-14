# Ride Price Training Hub

A static website rebuilt from the Ride Price sales training binder (Playbook v3.1) — every step of the client journey, word tracks, and objection-handling plays, organized and searchable.

## Pages

| Page | Contents |
|---|---|
| `index.html` | Home — 12-step client journey, section directory, golden rules, printable resources |
| `process.html` | Client entry, discovery, vehicle selection, test drive, trade evaluation, lending lane, warranty overview & service walk |
| `base-payment.html` | Huddle, T.A.C.C., presentation order & full word tracks (finance/lease/cash/one-pay), compare payments, terms of agreement |
| `menus.html` | Finance / lease / cash menu flows, 300% rule, VSC walkthrough, custom programs, post-menu forms |
| `leasing.html` | Benefits, terminology glossary, lease-end options, common leasing concerns |
| `objections.html` | All objection plays with live search and a flashcard practice mode |

## Running it

It's a fully static site — no build step.

- **Quick look:** double-click `index.html` (works straight from the file system).
- **Local server (recommended):** from this folder run `npx http-server -p 8321` and open <http://localhost:8321>.
- **Hosting:** drop the folder onto any static host (Netlify, GitHub Pages, SharePoint, etc.).

## Notes

- Interactive features (search, flashcards, copy-to-clipboard, accordions) are plain JavaScript in `assets/app.js` — no frameworks or dependencies.
- Ride Price sales training material.

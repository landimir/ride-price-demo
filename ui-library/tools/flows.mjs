/* Ride Price UI Library — the flows.
   Each flow is a sequential user journey; each step says how a user gets
   there from the previous screen (do), what the screen is, and which action
   leads onward (action / next / branches). Steps drive the real app through
   its own controls wherever a user would; Store shortcuts are used only to
   reach a precondition quickly (e.g. an approved credit app) and are noted.

   A step that the step before it does NOT lead to says `standalone: true` —
   a screen worth documenting that belongs to no point in the sequence. The
   board then draws a gap where its arrow would be and ends the sequence at
   the card above; nothing else about the step changes.

   Folder names are the product areas. Keep keys stable across versions —
   they are the identity the changelog diffs against. */
import { VIEWPORT, FIXTURES, join, existsSync } from "./lib.mjs";
import { statSync } from "node:fs";

/* Bump this whenever the way a fixture is CAPTURED changes. A size check
   alone cannot tell a good old fixture from a good new one, and the two are
   not interchangeable: before 2026-09-02 the barcode was screenshotted from
   the props page at its grid size, and it is now read from the pair's preview
   sheet (review find on the replay of #72).

   The version lives in the FILENAME, not in a stamp beside the files. A
   shared stamp has to be written at some moment, and whatever moment is
   chosen, the props captured after it reuse their old images — writing it
   after the first capture marked the whole directory current and defeated
   the check entirely (second review find). A versioned name has no such
   moment: an out-of-date fixture is simply a file nobody asks for. */
const FIXTURE_CAPTURE_VERSION = "2026-09-02-preview-pair";
export const fixtureName = (prop) => `prop${prop}-barcode.${FIXTURE_CAPTURE_VERSION}.png`;

const D = "d-demo1"; /* the seeded demo deal */
/* what the Documents button promised before the packet opened, for the packet's own check */
let packetPromised = 0;
/* an agreement opens on an approved choice since W-004 (2026-09-23): John's choice of the deal's own figure, submitted
   and approved by Jordan, and the agreement opened on its snapshot, as Continue leaves it. A step sets the deal type
   first, when it wants another */
const APPROVED = `{ const d = Store.deal("${D}"), v = Store.vehicle(d.stock), r = RIDE_PRICE_CALC.calc(d, v), lease = d.dealType === "lease" || d.dealType === "onepay", now = new Date().toISOString();
  d.huddle.done = true; d.desk.customerChose = { term: r.term || 0, down: d.dealType === "cash" ? 0 : lease ? d.desk.dueAtSigning : d.desk.downPayment, payment: d.dealType === "cash" ? r.totalDue : d.dealType === "onepay" ? r.onePayTotal : r.payment, at: now, inputs: deskInputs(d) };
  d.desk.presentedAt = now; d.desk.approvalRequestedAt = now; d.desk.approvalRequestedBy = "Ashley Collins"; d.desk.approvedAt = now; d.desk.approvedBy = "Jordan Reyes";
  d.basePayment = { signedAt: null, snapshot: agreementSnapshot(d, v) }; d.stage = "signed"; }`;
const wait = (ms) => new Promise(r => setTimeout(r, ms));
/* the toast of the step before is not part of this screen: three v022 captures
   had one covering the very line the screen exists to show. toast() recreates
   the node on its next call, so removing it costs nothing. */
/* the role control appears only in Customer Onboarding (owner ruling B,
   2026-09-18): a flow that needs another role switches there and comes back */
const switchRole = async (s, role, back) => { await s.go("#/visit"); await s.click("#obRole", { wait: 300 }); await s.click(`.rp-sheet:not([hidden]) [data-role="${role}"]`, { wait: 500 }); if (back) await s.go(back); };
/* Codex Phase 53 (LS-018): every picked photo waits on its review screen until
   Use front / Use back; a readable pair then asks "Review both sides" */
const captureBoth = async (s, front, back) => {
  await s.upload("#scanBody input[data-cap]", [front], { wait: 700 });
  await s.click("#scanBody [data-capture-use]", { wait: 500 });
  await s.upload("#scanBody input[data-cap]", [back], { wait: 2200 });
  if (await s.exists("#scanBody [data-capture-use]:not([disabled])")) await s.click("#scanBody [data-capture-use]", { wait: 700 });
};
const confirmPair = async (s) => { if (await s.exists("#scPairMatch")) { await s.click("#scPairMatch", { wait: 150 }); await s.click("#scPairContinue", { wait: 1200 }); } };
const clearToast = (s) => s.eval(`(() => { const t = document.getElementById("toast"); if (t) t.remove(); return true; })()`);
/* LS-071 and W-119: a Possible duplicate row picked by its name, and Same person
   chosen on Confirm customer, with the license's address when it asks which to keep */
const pickOnSheet = async (s, name) => {
  const ok = await s.eval(`(() => { const b = [...document.querySelectorAll("#scSheet [data-pik]")].find((x) => ((x.querySelector(".rp-row__title") || {}).textContent || "").trim() === ${JSON.stringify(name)}); if (!b) return false; b.click(); return true; })()`);
  if (!ok) throw new Error("no Possible duplicate row for " + name);
  await wait(600);
};
const samePersonOn = async (s) => {
  await s.click('#scanBody [data-opt="same"]', { wait: 250 });
  await s.eval(`(() => { const r = document.querySelector('#scanBody [name="scAddress"][value="license"]'); if (r && !r.checked) r.closest("label").click(); return true; })()`);
  await wait(200);
};
/* mutate state WITHOUT re-rendering — the current route may still be the previous
   flow's screen, and some routes write state when they render (the presentation
   forces menu.step = 2). Every ev() is followed by s.go(), which reloads the app. */
const ev = (s, js) => s.eval(`(() => { ${js}; Store.save(); return true; })()`);
/* the pencil remembers which accordions are open across redraws, so a step
   that wants one open or shut taps its head only when it is not already so */
const setAcc = async (s, want) => { for (const [k, on] of Object.entries(want)) { const isOn = await s.eval(`(() => { const h = document.querySelector('[data-acc="${k}"]'); return !!h && h.getAttribute("aria-expanded") === "true"; })()`); if (isOn !== on) await s.click(`[data-acc="${k}"]`, { wait: 250 }); } };

/* a recognizable license barcode image, rendered from the app's own Training
   Licenses page (prop 1 = the seed customer John Smith, prop 3 = a new
   persona). Generated once per run into tools/fixtures/. */
async function barcodePng(s, prop) {
  const path = join(FIXTURES, fixtureName(prop));
  /* the name carries the capture version, so anything reachable here was
     captured the current way; only the blank-image case is left to guard */
  if (existsSync(path) && statSync(path).size > 800) return path;
  if (existsSync(path)) console.log(`  regenerating ${path} — ${statSync(path).size} bytes, too small to be a barcode`);
  /* the props page is laid out for desktop; render there, but ALWAYS put the
     phone viewport back — a throw here must not leave the rest of the run at
     1280 wide while the manifest still says 390 */
  await s.c.setViewport(1280, 900);
  try {
    await s.go("#/props");
    /* Training Documents V3 (2026-09-02) stopped drawing the props on the
       page: the license lives in its pair row's PREVIEW sheet, and the only
       other .prop-barcode nodes are in the hidden print root. Open the pair
       whose barcode this is, and read it there. */
    if (!await s.eval(`(() => { const b = document.querySelector('[data-pair="${prop}"]'); if (!b) return false; b.click(); return true; })()`))
      throw new Error(`no pair row ${prop} on #/props — the training hub did not render`);
    await wait(450);
    const r = await s.eval(`(() => { const el = document.querySelector(".tdoc-preview .prop-barcode"); if (!el) return null;
      el.scrollIntoView(); const b = el.getBoundingClientRect();
      return { x: b.left + window.scrollX - 12, y: b.top + window.scrollY - 12, width: b.width + 24, height: b.height + 24 }; })()`);
    /* a zero-sized rect is still an object, so the old !r guard passed on a
       display:none element and wrote a blank 24x24 PNG that the scanner then
       silently failed to read. Measure the barcode, not its presence. */
    if (!r || r.width < 60 || r.height < 20)
      throw new Error(`the .prop-barcode for prop ${prop} is not visibly rendered (${r ? Math.round(r.width) + "x" + Math.round(r.height) : "absent"}) — a blank fixture would break the scan flow silently`);
    await s.c.shot(path, r);
  } finally {
    await s.c.setViewport(VIEWPORT.width, VIEWPORT.height);
  }
  return path;
}

/* menu / F&I preconditions on the seed deal, layered on demand */
/* the Finance Menu opens on the credit application's agreed-rate answer, its way on to Manager sign-off
   (credit/approved-agreed-rate). A lender rate that moved is re-presented first (W-111, #190); the seed carried only
   the old qualifiedApr field, so the menu priced at 3.9% under an agreed 3.5% payment no screen had re-presented */
const MENU_READY = `
  const d = Store.deal("${D}");
  d.creditApp = { approved: true, customerId: d.customerId, coBuyerId: null /* Codex 9c5501d: an approval names its applicants */, submitted: new Date().toISOString(), lender: "Ride Price Financial", agreedApr: 3.5, approvedApr: 3.5, leaseFactor: 0.00087, employer: "Ride Price" };
  d.basePayment = { signedAt: new Date().toISOString(), sigName: "John Smith", snapshot: RIDE_PRICE_CALC.calc(d, Store.vehicle(d.stock)) };
  d.huddle.done = true; d.stage = "menu";`;
const SIGNED_OFF = MENU_READY + ` d.signoff = { by: RIDE_PRICE_DATA.dealership.teamLead, at: new Date().toISOString() };`;

export const FLOWS = [
  /* ------------------------------------------------------------ */
  { id: "home", area: "01-home-and-navigation", title: "Home — Active Floor & Navigation",
    description: "The portal opens on the queue, rebuilt to the owner's home v3 package (2026-08-28). Showroom visits are their own section — an active visit is not a deal stage — and a visit with no vehicle yet shows only the name and arrival time, never a placeholder (the owner's standing rule, reasserted on the v3 reference). Stage vocabulary is three everywhere: DESKING, F&I, DONE. The Advisor reads My deals with a Next line per row; the Team Lead reads Active floor with All / Desking / F&I chips and a manager-only date control that governs the funded history, never the live floor. Both roles keep the four identifiers on every deal row — name, VIN, stock, stage. There is no login: the role sheet stands in for authentication, and it opens only in Customer Onboarding (owner ruling B, 2026-09-18) — Home's top bar carries no role control.",
    steps: [
      { key: "deals-queue", screen: "My deals (landing — Advisor)", do: async (s) => { await s.reset(); await s.go("#/deals"); },
        action: "Tap More in the bottom nav", next: "more-sheet",
        branches: [{ action: "Tap a deal row", to: "desking/huddle-gate" }, { action: "Tap New visit", to: "onboarding/resolver-idle" }, { action: "Tap the scan button beside the search", to: "license-scan/scan-front" }, { action: "Tap Inventory in the bottom nav", to: "vehicles/inventory-browse" }, { action: "Tap Customers in the bottom nav", to: "home/customers-list" }],
        notes: "The Advisor's guided view: the VIN + STK line under the name in the text face with tabular figures, the vehicle, the stage chip, and a 'Next: …' line read from real deal state. The DEMO chip rides the top bar as the standing demo marker." },
      { key: "more-sheet", screen: "More sheet — secondary navigation", do: async (s) => { await s.click("#dqMore"); }, action: "Tap Reset demo data", next: "reset-demo-confirm",
        branches: [{ action: "Inventory", to: "vehicles/inventory-browse" }, { action: "New customer visit", to: "onboarding/resolver-idle" }, { action: "Training documents", to: "training/licenses" }],
        notes: "Secondary destinations stay out of the queue until asked for. Every row icon is a line icon from the one set." },
      { key: "reset-demo-confirm", screen: "Reset demo data — confirm", do: async (s) => { await s.click("#dqReset", { wait: 400 }); }, action: "Cancel, then switch to Team Lead in New visit", next: "team-lead-floor",
        notes: "Destructive action behind a branded confirm (never the native confirm())." },
      { key: "team-lead-floor", screen: "Active floor (Team Lead)", do: async (s) => { await s.click("#dqSheet [data-sheet-close]", { wait: 300 }); await switchRole(s, "teamlead", "#/deals"); }, action: "Tap the F&I chip", next: "stage-filter-empty",
        notes: "Three chips that fit the screen — All / Desking / F&I — with live counts, plus the manager-only date control and its summary line. Funded contracts are not among the chips." },
      { key: "stage-filter-empty", screen: "Stage filter — no match", do: async (s) => { await s.click('.dq-chipbtn[data-pipe="fni"]'); }, action: "Tap All, then open the date control", next: "date-history-sheet",
        notes: "An empty stage says so instead of going blank. (Team Lead only; the Advisor view has no chips.)" },
      { key: "date-history-sheet", screen: "Date range / history sheet", do: async (s) => { await s.click('.dq-chipbtn[data-pipe="all"]'); await s.click("#dqDateBtn", { wait: 300 }); }, action: "Toggle Include funded contracts", next: "funded-history",
        notes: "Manager-only. The window governs the funded HISTORY — the live floor is always current, so an active deal never disappears because it started last week." },
      { key: "funded-history", screen: "Funded history in range", do: async (s) => { await ev(s, `const d = Store.deal("${D}"); d.stage = "complete"; d.forms.finalized = true; d.createdAt = new Date().toISOString();`); await s.go("#/deals"); await s.click("#dqDateBtn", { wait: 300 }); await s.click("#dqFundedToggle", { wait: 400 }); },
        action: "Switch back to Advisor (in New visit)", next: "advisor-completed",
        notes: "Funded contracts appear only behind the date control, labeled with the window they belong to." },
      { key: "advisor-completed", screen: "Advisor — completed deal ends the list", do: async (s) => { await switchRole(s, "advisor", "#/deals"); },
        action: "Tap the completed deal", next: "finance-menu/deal-finalized",
        notes: "The Advisor has no history control: their funded deals sit under a Completed label at the end of the one list, with no Next line — search still finds them." },
      /* the seed already puts John in the showroom, so setting John's visit here
         re-shot the landing byte for byte (v022 audit). A SECOND guest, with no
         vehicle chosen, is the state the landing does not show. */
      { key: "showroom-visit", screen: "In showroom — an active visit", do: async (s) => { await s.reset(); await ev(s, `(() => { const d = JSON.parse(JSON.stringify(Store.deal("${D}"))); d.id = "d-show"; d.dealNo = "48277"; d.customerId = "c-demo2"; d.stage = "discovery"; d.stock = null; d.vehicle = null; d.createdAt = new Date().toISOString(); const at = new Date(); at.setHours(11, 52, 0, 0); d.visit = { arrivedAt: at.toISOString() }; Store.s.deals.push(d); })();`); await s.go("#/deals"); },
        action: "Tap the showroom row", next: "discovery/stage-intro",
        notes: "A second guest, logged in with no vehicle chosen: Cheri's row reads the name and the arrival and nothing else — no vehicle placeholder, ever (owner rule 2026-08-23, reasserted 2026-08-28). Presence is a state the advisor sets by finishing the resolver, never the deal’s stage (chrome rule v022 §10): John is in the showroom AND John's deal is Desking, so John appears in both lists." },
      /* --- scenario coverage (lib/coverage, 2026-09-22): the states the
         home-navigation register describes that the sequence above never
         reached — search, empty floors, the Team Lead's assign, the test log */
      { key: "home-search", screen: "Search in use — matches as you type", standalone: true, do: async (s) => { await s.reset(); await s.go("#/deals"); await s.type("#dealSearch", "smith"); },
        action: "Type something nobody matches", next: "home-search-miss",
        notes: "One box finds a deal by name, phone, VIN, stock or deal number as the advisor types — no Search button, and the count line agrees with the rows (HN-012, HN-013)." },
      { key: "home-search-miss", screen: "Search miss — No deals found", do: async (s) => { await s.type("#dealSearch", "zzz"); },
        action: "Tap Clear search", next: "home/deals-queue",
        notes: "A miss says so and offers Clear search; the showroom list says 'None match this search' rather than going blank (HN-033)." },
      { key: "home-empty", screen: "My deals — nothing in progress", standalone: true, do: async (s) => { await s.reset(); await ev(s, `Store.s.deals = [];`); await s.go("#/deals"); },
        action: "Tap New visit", next: "onboarding/resolver-idle",
        notes: "An Advisor with no deals reads 'No deals in progress' and the way to start one; there is no Clear search because nothing was searched (HN-033)." },
      { key: "teamlead-empty-floor", screen: "Active floor — empty (Team Lead)", standalone: true, do: async (s) => { await s.reset(); await switchRole(s, "teamlead"); await ev(s, `Store.s.deals = [];`); await s.go("#/deals"); },
        action: "Switch back to Advisor", next: "contention-alert",
        notes: "The Team Lead's two sections each say their own true reason: 'No showroom visits' and 'No deals in this stage' (HN-033)." },
      { key: "contention-alert", screen: "My deals — vehicle contention alert", standalone: true, do: async (s) => { await s.reset(); await switchRole(s, "advisor"); await s.go("#/demo/vehicle-reserved"); await clearToast(s); },
        action: "Tap Choose another vehicle", next: "vehicles/inventory-browse",
        notes: "Another advisor signed on the car John is working: the alert sits above My deals with one real action, and × dismisses it while the card keeps its status (HN-022, chrome rule §14). The Team Lead's floor carries the status on the card and no alert." },
      { key: "date-range-refused", screen: "Custom range — From after To is refused", standalone: true, do: async (s) => { await s.reset(); await switchRole(s, "teamlead", "#/deals"); await s.click("#dqDateBtn", { wait: 300 }); await s.click('[data-range="custom"]', { wait: 200 }); await s.type("#dqFrom", "2026-09-20"); await s.type("#dqTo", "2026-09-10"); await s.click("#dqApplyRange", { wait: 300 }); },
        action: "Fix the dates, tap Apply range", next: "home/funded-history",
        notes: "A window that starts after it ends is refused beside the field, not applied silently to an empty history (HN-021)." },
      /* DS-026 (D-SM4 = B, 2026-09-22): assigning is a floor act. Cheri is
         checked in by the Team Lead through the resolver, so Cheri's visit belongs
         to nobody until the floor hands it to an advisor. */
      { key: "teamlead-unassigned", screen: "Active floor — a visit not yet assigned", standalone: true, do: async (s) => { await s.reset(); await switchRole(s, "teamlead"); await s.type("#obSearch", "Bridwell"); await s.click("#searchBtn", { wait: 400 }); await s.click("[data-found]", { wait: 300 }); await s.click("#obConfirm", { wait: 700 }); await s.go("#/deals"); },
        action: "Tap Cheri's showroom row", next: "visit-sheet-assign",
        notes: "A visit the Team Lead registered is under no salesperson: Cheri's showroom row ends '· Not assigned' until the floor hands it to an advisor (OB-043, DS-026). John's visit, started by an advisor, shows nothing extra." },
      { key: "visit-sheet-assign", screen: "Visit sheet — Assign to an advisor (Team Lead)", do: async (s) => { const ok = await s.eval(`(() => { const b = [...document.querySelectorAll("[data-visit]")].find(x => /Not assigned/.test(x.textContent)); if (!b) return false; b.click(); return true; })()`); if (!ok) throw new Error("no unassigned showroom row on the floor"); await wait(400); },
        action: "Tap Assign to an advisor", next: "assign-sheet",
        branches: [{ action: "Open deal", to: "discovery/stage-intro" }, { action: "Left the showroom", to: "home/team-lead-floor" }],
        notes: "The Team Lead's sheet for an unassigned visit: Open deal, Assign to an advisor (it reads Reassign once assigned), and Left the showroom, which checks the customer out (HN-019)." },
      { key: "assign-sheet", screen: "Assign — one row per advisor", do: async (s) => { await s.click("#dqAssign", { wait: 400 }); },
        action: "Tap Ashley Collins", next: "assigned-floor",
        notes: "Every advisor on the seed as a kit row; the one who has it now says so. One tap is the referral." },
      { key: "assigned-floor", screen: "Active floor — assigned to Ashley", do: async (s) => { await s.click('[data-assign="Ashley Collins"]', { wait: 500 }); },
        action: "Switch to Advisor (in New visit)", next: "visit-sheet-advisor",
        notes: "The pick writes the advisor, the toast names Ashley, and the row drops 'Not assigned'. From here Cheri is in Ashley's My deals." },
      { key: "visit-sheet-advisor", screen: "Visit sheet — the advisor's own (no assign control)", do: async (s) => { await switchRole(s, "advisor", "#/deals"); const ok = await s.eval(`(() => { const b = [...document.querySelectorAll("[data-visit]")].find(x => /Bridwell/.test(x.textContent)); if (!b) return false; b.click(); return true; })()`); if (!ok) throw new Error("Cheri's visit is not in Ashley's My deals"); await wait(400); },
        action: "Tap Open deal", next: "discovery/stage-intro",
        notes: "An advisor's own visit sheet has Open deal and Left the showroom only — assigning is the Team Lead's act (DS-026 control)." },
      /* the test log (master v1.2, HN-037..042): off until started, the
         hand-over screen, and Clear behind the kit's dialog. The sequence ends
         with the log cleared so no later capture records under an indicator. */
      { key: "testlog-off", screen: "Test log — off, nothing recorded", standalone: true, do: async (s) => { await s.reset(); await s.go("#/deals"); await s.click("#dqMore"); await s.click("#dqLogSend", { wait: 600 }); },
        action: "Tap Start recording", next: "testlog-recording",
        notes: "More → Send test log. Outside a designated test preview the recorder is off and says so; one tap starts it (HN-037)." },
      { key: "testlog-recording", screen: "Test log — recording, events on the log", do: async (s) => { await s.click("#tlToggle", { wait: 500 }); await s.click("#tlClose", { wait: 400 }); await s.type("#dealSearch", "jo"); await s.type("#dealSearch", ""); await s.click('.rp-tab[href="#/vehicles/browse"]', { wait: 500 }); await s.go("#/deals"); await s.click("#dqMore"); await s.click("#dqLogSend", { wait: 600 }); },
        action: "Tap Send by email, or Clear the log", next: "testlog-clear-confirm",
        notes: "Every tap, keystroke count, screen and sheet is on the log by its control — never the words typed or a customer's name. Send by email opens the phone's mail app with the log; Close returns Home (HN-038, HN-041)." },
      { key: "testlog-clear-confirm", screen: "Clear the test log? — confirm", do: async (s) => { await s.click("#tlClear", { wait: 300 }); },
        action: "Tap Clear the log", next: "testlog-cleared",
        notes: "Clear asks first in the kit's dialog; Keep it is the safe answer (HN-042)." },
      { key: "testlog-cleared", screen: "Test log — cleared and stopped", do: async (s) => { await s.click("#chDialogGo", { wait: 500 }); },
        action: "Tap Close", next: "home/deals-queue",
        notes: "Clearing empties the log, stops recording and drops its storage slot; the deal store is untouched (HN-040, HN-042)." },
      /* KA-008 (the owner's answer A, 2026-09-28): the third tab is the Customers list, a destination; New visit,
         which the tab used to open, has its own address (#/visit) and stays behind Home's pill and More */
      { key: "customers-list", screen: "Customers — every customer on file", standalone: true, do: async (s) => { await s.reset(); await s.go("#/deals"); await s.click('.rp-tab[href="#/customers"]', { wait: 500 }); },
        expect: async (s) => (await s.eval("location.hash")) === "#/customers" && Number(await s.eval(`document.querySelectorAll(".rp-screen--destination .rp-row[data-customer]").length`)) === 4 ? null : "the Customers tab should open the list of the seed's four customers",
        action: "Tap John Smith's row", next: "desking/huddle-gate",
        branches: [{ action: "New customer visit, in More", to: "onboarding/resolver-idle" }],
        notes: "The third tab is a place, not a task: every customer on file, newest record first, each with where that customer stands. John is in the showroom, desking the Santa Fe; Marcus is remote, a secure link sent at 11:38; Priya and Cheri show how to reach them. John's row opens John's deal where it stands; the other rows wait for the customer's own page, which is not built yet (KA-008; the owner's two questions, both answered A on Sep 28, at 11:25 and 11:26 PM)." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "onboarding", area: "02-customer-onboarding", title: "Customer Onboarding — the Customer Resolver",
    description: "One resolver everywhere Ride Price needs a person (owner's onboarding v3 package, 2026-08-28): one universal search over name, phone, email or license number, then the two license paths — scan the physical card, or send the customer a secure upload link. There is no top-level Create Customer; manual entry survives only as the stated fallback when there is neither a license nor a usable photo. A found customer is confirmed together with their registration address, which is sourced, one-tap confirmed, and never silently overwritten.",
    entry: { from: "home/deals-queue", action: "Tap New visit" },
    steps: [
      { key: "resolver-idle", screen: "Find customer — the resolver", do: async (s) => { await s.reset(); await s.go("#/visit"); }, action: "Type 'Smith', tap Search", next: "search-results",
        branches: [{ action: "Scan physical license", to: "license-scan/scan-front" }, { action: "Send secure upload link", to: "onboarding/send-link-sheet" }, { action: "Tap a recent customer", to: "onboarding/customer-found" }],
        notes: "Search first, then the two license paths as full-width action rows, then recent customers — which appear only in this idle state. Ride Price searches existing profiles before anything is created." },
      { key: "search-results", screen: "Search results", do: async (s) => { await s.type("#obSearch", "Smith"); await s.click("#searchBtn", { wait: 400 }); }, action: "Tap the customer", next: "customer-found-open-visit",
        notes: "One field takes a name, phone, email or license number — the advisor does not have to know which identifier they hold." },
      { key: "customer-found-open-visit", screen: "Customer found — already in the showroom", do: async (s) => { await s.click("[data-found]", { wait: 300 }); }, action: "Tap Continue John's visit", next: "desking/huddle-gate",
        notes: "Since PR #107 (D-HN10 B with the owner's showroom protocol): a customer with an open visit is offered that visit, never a second one. In the showroom Continue is the only action; once the visit has ended a 'Start a new visit anyway' link appears under it." },
      { key: "customer-found", screen: "Customer found — confirm + registration address", standalone: true, do: async (s) => { await s.go("#/deals"); await s.go("#/visit"); await s.type("#obSearch", "Bridwell"); await s.click("#searchBtn", { wait: 400 }); await s.click("[data-found]", { wait: 300 }); }, action: "Tap Confirm address & start visit", next: "discovery/stage-intro",
        branches: [{ action: "Use a different address", to: "onboarding/address-sheet" }],
        notes: "The customer and the registration address are confirmed in ONE decision region; the way back is the task's close control. The address is marked Required — and named as the CRM's when it came from a match — because it feeds registration, tax calculations, credit and paperwork — confirming here means nobody is asked to type it again." },
      { key: "address-sheet", screen: "Use a different address (sheet)", do: async (s) => { await s.click("#obOtherAddr", { wait: 300 }); await s.type("#obSheetAddr", "12 Main St, Astoria, NY 11106"); },
        action: "Pick the standardized address", next: "discovery/stage-intro",
        notes: "ONE address search field — never separate street / city / state / ZIP boxes. The demo standardizes against its own ZIP table and offers the result to tap; an unparseable string is refused rather than guessed at." },
      { key: "role-sheet", screen: "Switch roles — on New visit, the one role control", standalone: true, do: async (s) => { await s.go("#/deals"); await s.go("#/visit"); await s.click("#obRole", { wait: 300 }); }, action: "Choose Team Lead", next: "home/team-lead-floor",
        notes: "Owner ruling 2026-09-18 (\"B The codex way\"): the role control appears ONLY here, in Customer Onboarding — never on Home or any other screen, never inside Scan License. Home's band names the Team Lead while acting as one (\"Acting as Jordan Reyes\"); as the Advisor it reads \"Sample data only\"." },
      { key: "no-match", screen: "Search results — no match", do: async (s) => { await s.go("#/visit"); await s.type("#obSearch", "Zzz"); await s.click("#searchBtn", { wait: 400 }); }, action: "Tap 'No license available · add manually'", next: "manual-fallback",
        notes: "A miss names the other paths rather than jumping straight to a create form." },
      { key: "manual-fallback", screen: "No license available — manual fallback", do: async (s) => { await s.click("#obManual", { wait: 300 }); }, action: "Fill the four fields, tap Confirm & start visit", next: "discovery/stage-intro",
        branches: [{ action: "Confirm with a field that will not do", to: "onboarding/manual-refused" }],
        notes: "The task title and four fields — no helper copy on the kit (chrome rule v022). The two rules hold in validation rather than on the screen: use a license or a license photo if one turns up, and both contact channels are required (RP-UI-043 records the copy that left)." },
      { key: "manual-refused", screen: "Manual form — refused beside each field", do: async (s) => { await s.type("#obName", "Cheri"); await s.type("#obPhone", "555"); await s.type("#obEmail", "x"); await s.type("#obAddr", "Astoria"); await s.click("#obManualSave", { wait: 300 }); },
        action: "Fix the fields, tap Confirm again", next: "manual-duplicate",
        notes: "Nothing is created from a one-word name, a number that is not ten digits, an email without an @ and a dot, or an address missing its street, town or ZIP — each refusal sits beside its own field (OB-006, OB-008, OB-009, OB-049)." },
      { key: "manual-duplicate", screen: "Already on file — the same phone", do: async (s) => { await s.type("#obName", "Dana Whitfield"); await s.type("#obPhone", "(718) 555-0134"); await s.type("#obEmail", "dwhitfield@testing.com"); await s.type("#obAddr", "20 Ditmars Blvd, Astoria, NY 11106"); await s.click("#obManualSave", { wait: 400 }); },
        action: "Tap Use John Smith on file", next: "customer-found",
        branches: [{ action: "Create a new record anyway", to: "discovery/stage-intro" }],
        notes: "D-OB1: a phone, email or license already on file stops the save and names who holds it; creating anyway is a deliberate second tap. A matching name only is asked about, not blocked (OB-001)." },
      { key: "send-link-sheet", screen: "Send secure upload link (sheet)", do: async (s) => { await s.go("#/visit"); await s.click("#obSendLink", { wait: 300 }); }, action: "Pick Text or Email, enter that contact, tap Send secure link", next: "waiting-for-customer",
        notes: "The customer uploads their license directly into Ride Price — the UI never asks anyone to text or email an ID image to a salesperson. One contact method — the chosen channel (Text or Email) — with a checkbox for a helper's number (D-OB6, PR #108). Nothing on the kit screen says the demo sends no text or email (RP-UI-032)." },
      { key: "waiting-for-customer", screen: "Waiting for customer — progressive status", do: async (s) => { await s.type("#obLinkPhone", "(646) 555-0900"); await s.type("#obLinkEmail", "guest@testing.com"); await s.click("#obSendGo", { wait: 400 }); },
        action: "Tap Open customer view", next: "onboarding/remote-ready",
        notes: "Four separate states — link sent, license photo, identity photo, registration address — never collapsed into one binary 'verified' badge. The demo has no network, so the customer view opens on this device; the banner reads as a real send (RP-UI-032)." },
      { key: "remote-ready", screen: "Customer identified (advisor)", do: async (s, ctx) => {
          const png = await barcodePng(s, 3);
          await ev(s, `Store.s.idSession = { id: "s-demo", phone: "(646) 555-0900", email: "guest@testing.com", channel: "Text", sentAt: new Date().toISOString(), photoAt: null, persona: null, matchId: null, faceAt: null, addressChoice: null, addressConfirmedAt: null, doneAt: null };`);
          await s.go("#/idverify");
          await s.upload("[data-upcap]", [png], { wait: 900 });
          await s.upload("[data-facecap]", [ctx.photos[0]], { wait: 500 });
          await s.click("[data-pick]", { wait: 500 });
          await s.go("#/visit"); },
        action: "Tap Start visit", next: "discovery/stage-intro",
        notes: "The advisor sees the finished session with its progressive statuses — and the second license side stays an honest Pending line rather than blocking the visit. The confirmed registration address carries onto the record." },
      /* --- scenario coverage (lib/coverage, 2026-09-22): the resolver states
         the onboarding register describes that the sequence above never
         reached — a record with no address, the two missions, the send
         sheet's other channel and refusals, a helper's number, the dialogs
         that guard a session, and the upload that came back on someone
         else's number */
      { key: "found-no-address", screen: "Customer found — no registration address yet", standalone: true, do: async (s) => { await s.reset(); await s.go("#/visit"); await s.type("#obSearch", "Alvarez"); await s.click("#searchBtn", { wait: 400 }); await s.click("[data-found]", { wait: 300 }); },
        action: "Tap Add a registration address", next: "onboarding/address-sheet",
        notes: "Marcus's profile came from a secure link and has no address on file: Confirm stays disabled and the link under it reads Add a registration address — a visit never starts on a missing address (OB-010)." },
      { key: "mission-cobuyer", screen: "Add co-buyer — the resolver on a mission", standalone: true, do: async (s) => { await s.reset(); await s.go("#/desk/" + D); await s.eval(`(() => { resolverMission = { kind: "cobuyer", dealId: "${D}", back: "#/desk/${D}", open: null }; navigate("#/visit"); return true; })()`); await wait(500); },
        action: "Search Cheri, tap Cheri", next: "mission-cobuyer-found",
        notes: "Sent here from the deal's buyers sheet: the task title reads Add co-buyer and the notice says what the errand is, so nobody starts a second visit by mistake (OB-026). The mission survives a reload (OB-004)." },
      { key: "mission-cobuyer-found", screen: "Co-buyer found — attach, not start", do: async (s) => { await s.type("#obSearch", "Bridwell"); await s.click("#searchBtn", { wait: 400 }); await s.click("[data-found]", { wait: 300 }); },
        action: "Tap Confirm address & attach co-buyer", next: "desking/huddle-gate",
        notes: "The primary reads 'attach co-buyer': confirming attaches Cheri to John's deal and returns to the desk — no new deal, and John can never be John's own co-buyer (OB-021..024)." },
      { key: "mission-driver", screen: "Add driver — from a test drive", standalone: true, do: async (s) => { await s.reset(); await s.go("#/testdrive/" + D); await s.eval(`(() => { resolverMission = { kind: "driver", dealId: "${D}", back: "#/testdrive/${D}", open: null }; navigate("#/visit"); return true; })()`); await wait(500); },
        action: "Find the driver, confirm", next: "test-drive/drive-setup",
        notes: "The same resolver on its other errand: the title reads Add driver and the notice says 'Adding a test-drive driver'; the pick returns to the test drive it came from (OB-021, OB-026)." },
      { key: "send-link-email", screen: "Send secure upload link — by email", standalone: true, do: async (s) => { await s.reset(); await s.go("#/visit"); await s.click("#obSendLink", { wait: 300 }); await s.click('#obChannel [data-ch="Email"]', { wait: 300 }); },
        action: "Tap Text to switch back", next: "send-link-refused",
        notes: "The other channel: Email chosen shows the email field only, and the helper line speaks of an address — one contact method, the chosen one (D-OB6, OB-053)." },
      { key: "send-link-refused", screen: "Send secure upload link — a number that cannot receive it", do: async (s) => { await s.click('#obChannel [data-ch="Text"]', { wait: 300 }); await s.type("#obLinkPhone", "555"); await s.click("#obSendGo", { wait: 300 }); },
        action: "Type the full number, tick the helper box, tap Send", next: "helper-waiting",
        notes: "Three digits are not a mobile: the sheet refuses beside the field and sends nothing (OB-007)." },
      { key: "helper-waiting", screen: "Waiting for customer — sent to a helper's number", do: async (s) => { await s.type("#obLinkPhone", "(929) 555-0143"); await s.eval(`(() => { const b = document.querySelector("#obLinkHelper"); b.checked = true; b.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`); await s.click("#obSendGo", { wait: 500 }); },
        action: "Tap Cancel this secure link", next: "cancel-link-confirm",
        notes: "D-OB3: a grandfather helped by a sibling — the link goes to the helper's phone and the screen says so; that number is recorded as the helper's and never becomes the customer's own (OB-047)." },
      { key: "cancel-link-confirm", screen: "Cancel this secure link? — confirm", do: async (s) => { await s.click("#obCancelSession", { wait: 400 }); },
        action: "Tap Keep it", next: "idle-session-banner",
        notes: "D-OB2: a link in flight is never dropped by one accidental tap; Keep it is the safe answer (OB-005)." },
      { key: "idle-session-banner", screen: "Find customer — a secure upload is open", do: async (s) => { await s.go("#/visit"); },
        action: "Tap the banner to return to the waiting screen", next: "waiting-for-customer",
        notes: "Back on the resolver's first step the open link rides a banner above the search; tapping Send secure upload link again goes to it instead of starting a second one (OB-027, OB-029)." },
      { key: "helper-ready", screen: "Customer identified — answered from a helper's number", standalone: true, do: async (s) => { await s.reset(); await ev(s, `Store.s.idSession = { id: "s-helper", phone: "(929) 555-0143", email: "", channel: "Text", sentAt: new Date().toISOString(), photoAt: new Date().toISOString(), faceAt: new Date().toISOString(), addressConfirmedAt: new Date().toISOString(), doneAt: new Date().toISOString(), matchId: null, persona: { first: "Dana", middle: "K", last: "Whitfield", dob: "1983-09-08", address: "210 Clinton St", city: "Brooklyn", state: "NY", zip: "11201", license: { number: "T-0000104", state: "NY", expires: "2029-09-08" } }, addressChoice: { address: "210 Clinton St", city: "Brooklyn", state: "NY", zip: "11201" }, helper: true };`); await s.go("#/visit"); },
        action: "Tap Discard this upload", next: "discard-upload-confirm",
        notes: "The finished session's line says the link was answered from a helper's number, so the advisor knows the phone on screen is not the customer's (OB-047). A finished upload takes over the first step until it is attached or discarded (OB-029)." },
      { key: "discard-upload-confirm", screen: "Discard Dana's upload? — confirm", do: async (s) => { await s.click("#obDiscardSession", { wait: 400 }); },
        action: "Tap Keep it", next: "remote-ready",
        notes: "D-OB2: the photo, the face check and the confirmed address are not lost to one tap; the dialog names what would go (OB-005)." },
      { key: "whose-upload", screen: "Whose upload is this? — another record holds that number", standalone: true, do: async (s) => { await s.reset(); await ev(s, `Store.s.idSession = { id: "s-whose", phone: "(646) 555-0900", email: "", channel: "Text", sentAt: new Date().toISOString(), photoAt: new Date().toISOString(), faceAt: new Date().toISOString(), addressConfirmedAt: new Date().toISOString(), doneAt: new Date().toISOString(), matchId: null, persona: { first: "Dana", middle: "K", last: "Whitfield", dob: "1983-09-08", address: "210 Clinton St", city: "Brooklyn", state: "NY", zip: "11201", license: { number: "T-0000104", state: "NY", expires: "2029-09-08" } }, addressChoice: { address: "210 Clinton St", city: "Brooklyn", state: "NY", zip: "11201" } };`); await s.go("#/visit"); await s.click("#obAttach", { wait: 700 }); },
        action: "Tap Create Dana, or 'It is Marcus — update the record'", next: "discovery/stage-intro",
        notes: "D-OB3: the upload came back on Marcus's number but reads Dana. Nobody's record is overwritten by a shared phone — the advisor says whose it is (OB-002, OB-047)." },
    ] },

  /* ------------------------------------------------------------ */  { id: "license-scan", area: "03-license-scan", title: "Scan Driver's License",
    description: "The prop-license scanner on the owner's UI kit (package v023, 2026-09-05): twelve screens as a kit Task inside New visit — Close returns to the resolver, the title carries the two-part step, and the DEMO band is the only environment marker. The advisor still experiences two decisions — capture the license, then confirm the customer — and everything else is automation or an exception sheet in the kit's own sheet. Only the five printed training props can ever be recognized. Prop 1 matches a seed customer by name (ambiguous → the same-person question as two option rows), prop 2 carries a license on file (certain match), 3–5 create new customers. Phone AND email are both required on every record; the scan asks for no credit score.",
    entry: { from: "onboarding/resolver-idle", action: "Tap Scan physical license" },
    steps: [
      { key: "scan-front", screen: "Scan — front of license", do: async (s) => { await s.reset(); await s.go("#/visit"); await s.click("#scanBtn", { wait: 400 }); }, action: "Take / choose the front photo", next: "scan-review-front",
        expect: async (s) => {
          const t = await s.text("#scanBody .rp-topbar__title");
          if (!t.includes("Scan license") || !t.includes("Step 1 of 2")) return "the Task top bar should read Scan license / Step 1 of 2 · Scan, got: " + t;
          if (await s.exists("#scanBody .chip--demo, #scanBody .rp-wordmark")) return "the training chip or the wordmark is back on a scan screen";
          return null;
        },
        notes: "The kit's Task: Close returns to the resolver, the title is 'Scan license' and the second line is the two-part step. The capture card owns the screen — a dashed frame with corner marks and the license drawn inside it — and the dock carries one gradient primary with one text link. No lede, no device disclaimer, no demo sentence: the DEMO band in the banner slot is the only environment marker." },
      { key: "scan-review-front", screen: "Review front — the photo waits for Use front", do: async (s, ctx) => { await s.upload("#scanBody input[data-cap]", [ctx.photos[0]], { wait: 700 }); }, action: "Tap Use front", next: "scan-back",
        branches: [{ action: "Retake / Choose another", to: "license-scan/scan-front" }],
        notes: "Codex Phase 53 (LS-018, the wrong gallery image): the picked photo is shown as it was chosen and attaches only on Use front; Retake or Choose another replaces it without touching anything saved." },
      { key: "scan-back", screen: "Scan — flip to the back", do: async (s) => { await s.click("#scanBody [data-capture-use]", { wait: 500 }); }, action: "Capture the back", next: "scan-reject",
        notes: "The SAME screen flips to its back phase — front and back belong to one session, never two journey steps. 'Front captured · ready for the back' is an inline state chip and the frame now draws the barcode side, which is the side the recognizer actually reads." },
      { key: "scan-reject", screen: "Review back — the barcode could not be read", do: async (s, ctx) => { await s.upload("#scanBody input[data-cap]", [ctx.photos[1]], { wait: 1400 }); }, action: "Tap Find customer manually", next: "scan-manual",
        branches: [{ action: "Try again", to: "license-scan/scan-back" }],
        notes: "A failed read stays on its review (owner, 2026-09-18: the Codex version): the unreadable photo is shown, the failure is named, Use back is disabled, Retake and Find customer manually sit on the screen — no pop-up." },
      { key: "scan-manual", screen: "Find customer manually (sheet)", do: async (s) => { await s.click("#scanBody [data-manual]", { wait: 400 }); }, action: "Type a license number, tap Search", next: "scan-manual-result",
        notes: "A CRM SEARCH by license number and issuing state — never a card read. Two fields in the kit's field row, one primary; nothing typed here is treated as data recovered from a license, and no persona is invented." },
      { key: "scan-manual-result", screen: "Manual search — customer found", do: async (s) => { await s.type("#mnNum", "T-0000102"); await s.click("#mnGo", { wait: 400 }); }, action: "Tap Use", next: "discovery/stage-intro",
        branches: [{ action: "No match · create new customer", to: "onboarding/manual-fallback" }],
        notes: "A hit is a result row with the kit's navy Use action; a miss is the kit's empty state saying plainly that nothing on file carries that number, with the create path under it. Use hands the found customer straight to the visit — the license was never read, so there is nothing to confirm against it." },
      { key: "scan-confirm", screen: "Confirm customer (certain match)", do: async (s, ctx) => {
          /* a clean store: an unfinished scan left by an earlier step is a saved draft now (Codex Phase 52), and the scanner would open its resume card */
          await s.reset(); const png = await barcodePng(s, 2);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); },
        action: "Tap Confirm & continue", next: "scan-done",
        branches: [{ action: "This isn't Cheri", to: "license-scan/scan-new-customer" }],
        expect: async (s) => {
          const t = await s.text("#scanBody");
          if (!t.includes("License match")) return "the match tag should state the real basis (License match)";
          if (!t.includes("Updates from this license · 2") || !t.includes("Cheri L Bridwell") || !t.includes("11/02/2031")) return "the updates group should list what this license changes — the middle initial on the name and the renewed expiry — and nothing else";
          return null;
        },
        notes: "Identity is the hero and the tag states the REAL match basis, never an invented confidence. Contact completeness is a step row. The updates group lists ONLY what the license changes: the seed gives Cheri's record the prop's own address and number, so the updates are the middle initial the license carries and the renewed expiry — when nothing changed at all, there is no group." },
      { key: "scan-ambiguous", screen: "Confirm customer (ambiguous — prop 1)", scenario: true, do: async (s, ctx) => {
          /* a clean store: an unfinished scan left by an earlier step is a saved draft now (Codex Phase 52), and the scanner would open its resume card */
          await s.reset(); const png = await barcodePng(s, 1);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); },
        action: "Choose 'Different guest — create new', tap Continue", next: "scan-new-customer",
        notes: "When the match is only a guess the screen asks the same-person question outright, as two option rows over one Continue, and shows the scanned license beside the record so the two can actually be compared. Nothing is ever merged silently." },
      { key: "scan-new-customer", screen: "New customer (prop 3)", do: async (s, ctx) => {
          /* a clean store: an unfinished scan left by an earlier step is a saved draft now (Codex Phase 52), and the scanner would open its resume card */
          await s.reset(); const png = await barcodePng(s, 3);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); },
        action: "Type the number already on file, tap Create customer", next: "scan-conflict",
        notes: "Identity is a READ-ONLY summary from the license — the advisor never retypes card data. The only asks are what a license cannot say: phone and email. No credit score at the door; the record starts at the neutral default." },
      { key: "scan-conflict", screen: "Phone already in use (sheet)", do: async (s) => { await s.type("#svPhone", "(646) 555-0900"); await s.click("[data-save]", { wait: 600 }); await s.click('#scSheet [data-opt="link"]', { wait: 200 }); },
        action: "Choose 'Verify the number and link this license', tap Continue", next: "scan-verify-code",
        branches: [{ action: "Keep profiles separate", to: "license-scan/scan-done" }, { action: "Use a different number", to: "license-scan/scan-new-customer" }],
        expect: async (s) => {
          const t = await s.text("#scSheet");
          if (!t.includes("On another customer")) return "the sheet should say the number is on another customer's profile";
          if (!t.includes("Show whose")) return "and offer Show whose, without naming the customer (LS-068)";
          if (!t.includes("link this license")) return "Marcus's remote profile holds no license and carries Marcus's name, so linking should be offered (KA-010)";
          return null;
        },
        notes: "No license carries a phone number, so this compares the number just typed against the record already holding it: here Marcus's own, created by the secure upload link Marcus completed before any scan, which holds no license (the kit's seed, scenario 09). The sheet says the number is on another customer's profile without naming the customer, with Show whose to see it (LS-068); two option rows and one primary follow. Nothing merges until the number is verified by a code to the phone on file. Linking is offered when that record holds the same issuer and license number, or holds no license at all and carries the license's own first and last name, with no other record holding the license (KA-010); a stranger's profile is never offered it." },
      { key: "scan-verify-code", screen: "Verify the phone number (sheet)", do: async (s) => { await s.click("[data-continue]", { wait: 1400 }); }, action: "Tap Verify & link", next: "scan-done",
        expect: async (s) => {
          const t = await s.text("#scSheet");
          if (t.includes("would read") || t.includes("Demo:")) return "the demo-code sentence is back on the verify sheet";
          const filled = Number(await s.eval(`Array.from(document.querySelectorAll("#scSheet .rp-code__box")).map(b => b.textContent).join("").length`));
          if (filled !== 6) return "in demo mode the six boxes fill themselves about a second after the sheet opens; got " + filled + " digits";
          return null;
        },
        notes: "Linking overwrites an existing record, so it is gated: six boxes, and a wrong code merges nothing. The sheet opens here from Verify & link on the number typed; the same sheet opens from Same person on Confirm customer when the profile came from a secure link and holds no license (W-119: Marcus picked under Possible duplicate, a name-and-birthday match, or a Choose customer row). In demo mode the text 'arrives' about a second after the sheet opens and the boxes fill themselves — the code is shown nowhere else, and the rehearsal reads like the real thing (owner's decision, v023)." },
      { key: "scan-done", screen: "Customer ready", do: async (s) => { await s.click("[data-verify]", { wait: 700 }); await clearToast(s); },
        action: "Tap Continue to visit", next: "discovery/stage-intro",
        branches: [{ action: "Scan another license", to: "license-scan/scan-front" }],
        expect: async (s) => {
          const one = Number(await s.eval(`Store.s.customers.filter(function (x) { return x.last === "Alvarez"; }).length`));
          if (one !== 1) return "the verified code should link onto Marcus's own record, not write a second — found " + one;
          const t = await s.text("#scanBody");
          if (!t.includes("malvarez@testing.com")) return "Marcus's own email should survive a link where none was typed";
          return null;
        },
        notes: "Completion is LOCAL feedback on the confirmation surface — the kit's success notice, the customer, and the visit as the dominant next action, with no full-screen ceremony. The verified code linked the scanned license onto the profile the link created: one Marcus, Marcus's own email kept. Continue to visit is the check-in moment. Scan another restarts in place for the advisor with two guests at the desk." },
      /* ---- the scan's other states (lib/coverage, 2026-09-22): every screen
         the scanner suites reach that the journey above walks past. Each one
         starts clean and is driven through the app's own controls. ---- */
      { key: "scan-pair-review", screen: "Review both sides (readable pair)", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 2);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await clearToast(s); },
        action: "Tick the match, tap Continue", next: "scan-confirm",
        branches: [{ action: "These sides do not match", to: "license-scan/scan-back" }],
        expect: async (s) => (await s.exists("#scPairMatch")) ? null : "the pair review with its match checkbox should be on screen",
        notes: "Once both sides read, the advisor compares them before anything is looked up: both photos, one checkbox that says the name and number belong to the same person, and Continue does nothing until it is ticked." },
      { key: "scan-manual-miss", screen: "Manual search — nothing on file", standalone: true, do: async (s, ctx) => {
          await s.reset(); await s.go("#/visit"); await s.click("#scanBtn", { wait: 400 });
          await s.upload("#scanBody input[data-cap]", [ctx.photos[0]], { wait: 700 }); await s.click("#scanBody [data-capture-use]", { wait: 500 });
          await s.upload("#scanBody input[data-cap]", [ctx.photos[1]], { wait: 1400 });
          await s.click("#scanBody [data-manual]", { wait: 400 }); await s.type("#mnNum", "T-0009999"); await s.click("#mnGo", { wait: 400 }); },
        action: "Tap No match · create new customer", next: "onboarding/manual-fallback",
        expect: async (s) => (await s.exists("#scSheet .rp-empty") && await s.exists("#scSheet [data-create]")) ? null : "a miss should be the kit's empty state with the create path under it",
        notes: "A number nobody on file carries: the sheet says so plainly and offers to create the customer. Nothing typed here is treated as if it came off a license." },
      { key: "scan-new-customer-required", screen: "New customer — contact required", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 3);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s);
          await s.click("[data-save]", { wait: 400 }); },
        action: "Fill phone and email, tap Create customer", next: "scan-done",
        expect: async (s) => Number(await s.eval(`document.querySelectorAll("#scanBody .f-err").length`)) >= 2 ? null : "both contact fields should be marked",
        notes: "Create customer with nothing typed creates nothing: both contact fields are marked and the record is not written. A phone and an email are the two things a license cannot give." },
      { key: "scan-duplicate", screen: "Possible duplicate (sheet)", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 3);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s);
          await s.type("#svPhone", "(646) 555-0155"); await s.type("#svEmail", "marcus2@testing.com"); await s.click("[data-save]", { wait: 500 }); },
        action: "Pick Marcus's record: Confirm customer, where Same person sends the code first", next: "scan-verify-code",
        branches: [{ action: "Create new customer", to: "license-scan/scan-done" }],
        expect: async (s) => (await s.text("#scSheet")).includes("Possible duplicate") ? null : "the duplicate sheet should be up",
        notes: "A new number and a new email, but the name looks like Marcus who is already on file: before a second record is written the sheet shows the look-alike and asks. Creating anyway says on the action itself that it makes a second record. Picking Marcus goes on to Confirm customer; Marcus's profile came from a secure link and holds no license, so Same person there sends the code to the phone on file first, and the license joins only after the right code (W-119). A profile made in the showroom keeps Same person with no code." },
      { key: "scan-conflict-separate", screen: "Phone already in use — no link offered", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 3);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s);
          await s.type("#svPhone", "(917) 555-0164"); await s.click("[data-save]", { wait: 600 }); },
        action: "Keep profiles separate, or use a different number", next: "scan-done",
        expect: async (s) => (!await s.exists('#scSheet [data-opt="link"]') && await s.exists('#scSheet [data-opt="separate"]')) ? null : "Priya Patel's number on Marcus's license: the sheet must not offer linking to a stranger's profile",
        notes: "The same conflict sheet as above, but the number typed is on Priya Patel's profile, and the license is Marcus's: a profile that is not the license's person is never offered the link (KA-010), so the link option is simply absent and only Keep separate or a different number remain. The sheet still names nobody until Show whose (LS-068)." },
      { key: "scan-verify-wrong-code", screen: "Verify the phone number — wrong code", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 3);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s);
          await s.type("#svPhone", "(646) 555-0900"); await s.click("[data-save]", { wait: 600 }); await s.click('#scSheet [data-opt="link"]', { wait: 200 });
          await s.click("[data-continue]", { wait: 1400 });
          await s.type("#svCodeInput", "000000"); await s.click("[data-verify]", { wait: 500 }); },
        action: "Resend code, or enter the right one", next: "scan-verify-code",
        expect: async (s) => { const n = Number(await s.eval(`Store.s.customers.filter(function (x) { return x.last === "Alvarez"; }).length`)); const linked = await s.eval(`(Store.customer("c-demo4").license || {}).number || ""`); return (n === 1 && linked === "" && await s.exists("#scSheet .f-err, #scSheet [role=alert], #scSheet .rp-field__error")) ? null : "a wrong code should be refused on the sheet and join nothing to Marcus's profile (" + linked + ")"; },
        notes: "Six wrong digits: the sheet marks the code and nothing joins — Marcus's remote profile still holds no license, and nobody new is made. Resend code is the way forward." },
      { key: "scan-leave", screen: "Leave the scan? (sheet)", standalone: true, do: async (s, ctx) => {
          await s.reset(); await s.go("#/visit"); await s.click("#scanBtn", { wait: 400 });
          await s.upload("#scanBody input[data-cap]", [ctx.photos[0]], { wait: 700 }); await s.click("#scanBody [data-capture-use]", { wait: 500 });
          await s.click("#scClose", { wait: 400 }); },
        action: "Tap Save and return", next: "scan-unfinished",
        branches: [{ action: "Keep scanning", to: "license-scan/scan-back" }, { action: "Discard", to: "onboarding/resolver-idle" }],
        expect: async (s) => (await s.text("#scSheet")).includes("Leave the scan?") ? null : "a part-done scan should ask before closing",
        notes: "Closing a scan that already has a front asks first. Save and return keeps the unfinished scan on this phone; Keep scanning goes back to exactly where it was; discarding is explicit. An untouched scan closes at once with no question." },
      { key: "scan-unfinished", screen: "Unfinished scans", do: async (s) => { await s.click("#scSaveLater", { wait: 500 }); await s.click("#scanBtn", { wait: 500 }); },
        action: "Tap the saved scan", next: "scan-resume",
        branches: [{ action: "Start a new scan", to: "license-scan/scan-front" }],
        expect: async (s) => (await s.exists("#scUnfinished [data-draft]")) ? null : "the saved scan should be listed under Unfinished scans",
        notes: "Since LS-084 (the owner's answer of 2026-09-24, B), each walk-in's unfinished scan is kept under its own name: the next tap on Scan physical license lists them, by the name the barcode read (or Front saved when it was not read yet), and Start a new scan starts clean for the next guest." },
      { key: "scan-resume", screen: "Resume license scan", do: async (s) => { await s.click("#scUnfinished [data-draft]", { wait: 500 }); },
        action: "Tap Resume scan", next: "scan-back",
        branches: [{ action: "Discard and start a new scan", to: "license-scan/scan-front" }],
        expect: async (s) => (await s.exists("#scResume")) ? null : "the saved draft should offer Resume scan",
        notes: "The saved scan shows who it was for, which sides were captured and when, and the saved photo; Resume picks up at the side still missing. It survives a page reload." },
      { key: "scan-multiple-licenses", screen: "Review front — more than one license", standalone: true, do: async (s) => {
          /* a photo with two training barcodes in it, drawn by the app's own
             barcode artwork (as the decoder suite does) — the one picture the
             scanner refuses on purpose. Generated once per run into tools/fixtures/. */
          const path = join(FIXTURES, `two-licenses.${FIXTURE_CAPTURE_VERSION}.png`);
          await s.reset(); await s.go("#/visit");
          if (!existsSync(path) || statSync(path).size < 800) {
            const data = await s.eval(`(async () => { const cv = document.createElement("canvas"); cv.width = 900; cv.height = 650; const x = cv.getContext("2d"); x.fillStyle = "white"; x.fillRect(0, 0, 900, 650);
              for (const [id, y] of [[1, 60], [2, 350]]) { const img = new Image(); img.src = "data:image/svg+xml;base64," + btoa(RIDE_PRICE_SCAN.barcodeSVG(id)); await img.decode(); x.drawImage(img, 50, y, 650, 100); }
              return cv.toDataURL("image/png"); })()`);
            (await import("node:fs")).writeFileSync(path, Buffer.from(String(data).split(",")[1], "base64"));
          }
          await s.click("#scanBtn", { wait: 400 });
          await s.upload("#scanBody input[data-cap]", [path], { wait: 1600 }); },
        action: "Retake / Choose another", next: "scan-front",
        expect: async (s) => ((await s.text("#scanBody")).includes("More than one license") && await s.eval(`!!document.querySelector("#scanBody [data-capture-use]")?.disabled`)) ? null : "two licenses in one photo should be refused on the review with Use front disabled",
        notes: "Two licenses in one photo is refused, not guessed at: the review names the problem, Use front is disabled and nothing is saved. The advisor takes a photo of one license." },
      { key: "scan-testdrive-mismatch", screen: "Test drive · license — the name does not match", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 3);
          await ev(s, `const c = Store.customer("c-demo1"); delete c.license; const d = Store.deal("${D}"); d.customerId = "c-demo1"; d.testDrive = { done: false }; d.stage = "testdrive";`);
          await s.go(`#/testdrive/${D}`); await s.click("#tdFixLicense", { wait: 400 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); await wait(300); },
        action: "Tap Use these details — the name is not changed", next: "test-drive/license-exception",
        expect: async (s) => ((await s.text("#scanBody")).includes("Check the name") && await s.exists("#scanBody .rp-notice--conflict")) ? null : "a card in another name should warn before the drive borrows it",
        notes: "Reached from Test Drive's Complete license: the same scanner in its test-drive dress. The card read is Marcus's, the driver is John, so the screen warns instead of rewriting anyone's record — the drive cannot borrow someone else's license. Four fields to verify against the card, one action." },
      { key: "scan-testdrive-read", screen: "Test drive · license — License read", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 1);
          await ev(s, `const c = Store.customer("c-demo1"); delete c.license; const d = Store.deal("${D}"); d.customerId = "c-demo1"; d.testDrive = { done: false }; d.stage = "testdrive";`);
          await s.go(`#/testdrive/${D}`); await s.click("#tdFixLicense", { wait: 400 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); await wait(300); },
        action: "Tap Use these details", next: "test-drive/ready",
        expect: async (s) => ((await s.text("#scanBody .rp-title")).trim() === "License read" && !await s.exists("#scanBody .rp-notice")) ? null : "John's own card should reach the plain License read screen with no notice",
        notes: "John's own card: the details read off the license sit in four fields for a glance, with no warning and no green success card — nothing is complete until Use these details puts the license on John's profile and the drive continues." },
      { key: "scan-cobuyer-block", screen: "Co-buyer identity — that's the primary buyer", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 1);
          await ev(s, `Store.customer("c-demo1").license = { number: "T-0000101", state: "NY", expires: "2030-01-01" };`);
          await s.go(`#/desk/${D}`); await s.click('[data-sheet-open="buyers"]'); await s.click("#byAdd"); await s.click("#byScan", { wait: 500 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); await wait(300); },
        action: "Scan a different license", next: "scan-front",
        branches: [{ action: "Cancel", to: "buyers/buyers-sheet" }],
        expect: async (s) => ((await s.text("#scanBody")).includes("primary buyer") && await s.exists("[data-rescan]")) ? null : "scanning the buyer's own license as a co-buyer should be blocked outright",
        notes: "Reached from Buyers → Add co-buyer → Scan physical license. The license scanned is John's own, and John is the buyer: the buyer cannot also be the co-buyer, so the scan stops here and offers a different license." },
      /* ---- the email code and the identity questions a Team Lead answers
         (LS-071 and LS-047, 2026-10-01). Each starts clean. ---- */
      { key: "scan-code-email", screen: "Verify the phone number — Email the code instead", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 3);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s);
          await s.type("#svPhone", "(646) 555-0155"); await s.type("#svEmail", "marcus2@testing.com"); await s.click("[data-save]", { wait: 600 });
          await pickOnSheet(s, "Marcus Alvarez"); await samePersonOn(s); await s.click("#scanBody [data-save]", { wait: 1400 }); },
        action: "Tap Email the code instead", next: "scan-done",
        expect: async (s) => (await s.exists("#scSheet [data-email-code]")) ? null : "Marcus's profile has an email, so the code sheet should offer Email the code instead (LS-071)",
        notes: "LS-071, the owner's answer A of 2026-09-28: a guest who can't get texts gets the code by email. Marcus picked under Possible duplicate, then Same person: the code goes to the phone on file, and because the profile has an email the sheet also offers Email the code instead, to the email on the profile, never the one typed in this scan. The sheet does not show the address (LS-068)." },
      { key: "scan-no-contact", screen: "Confirm customer — no phone or email on file", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 3);
          await ev(s, `const c = Store.customer("c-demo4"); c.phone = ""; c.email = "";`);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s);
          await s.type("#svPhone", "(646) 555-0199"); await s.type("#svEmail", "marcus2@testing.com"); await s.click("[data-save]", { wait: 600 });
          await pickOnSheet(s, "Marcus Alvarez"); await samePersonOn(s); await s.click("#scanBody [data-save]", { wait: 700 }); },
        action: "Tap Ask a Team Lead", next: null,
        expect: async (s) => (await s.text("#scIdentityConflict")).includes("No phone or email on file") ? null : "a profile with neither a phone nor an email should ask a Team Lead (LS-071's second part)",
        notes: "LS-071's second part: with no email, Jordan confirms. Marcus's profile has neither a phone nor an email, so no code can reach it: Same person says so under the title and offers Ask a Team Lead, and nothing joins until Jordan confirms who the guest is." },
      { key: "scan-name-changed", screen: "Confirm customer — the name changed", standalone: true, do: async (s, ctx) => {
          await s.reset(); const png = await barcodePng(s, 2);
          await s.go("#/visit"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s);
          await s.click("#scEditLicense", { wait: 500 }); await s.type("#scEditLast", "Smith"); await s.click("#scEditSave", { wait: 900 });
          await confirmPair(s); await clearToast(s); },
        action: "Tap Ask a Team Lead", next: "scan-name-asked",
        branches: [{ action: "Scan a different license", to: "license-scan/scan-front" }],
        expect: async (s) => (await s.text("#scIdentityConflict")).includes("The name changed") ? null : "a license with Cheri's number and birthday and another last name should say The name changed (LS-047)",
        notes: "LS-047, the owner's answer A: Cheri Bridwell renews her license as Cheri Smith, with the same number and birthday. No printed Cheri Smith card exists, so the picture takes the owner's own way there: Cheri's card, Edit license details, last name Smith. The notice gives both names, and nothing is written until a Team Lead answers." },
      { key: "scan-name-asked", screen: "Confirm customer — asked a Team Lead", do: async (s) => { await s.click("#scAskLead", { wait: 700 }); },
        action: "Tap Done", next: "lead-name-review",
        expect: async (s) => (await s.text("#scIdentityConflict")).includes("Asked a Team Lead") ? null : "after Ask a Team Lead the notice should say the name waits for the answer",
        notes: "The request is kept on Cheri's record with both names and the details it rests on. Cheri's name is unchanged, and the scan waits under Unfinished scans until the answer." },
      { key: "lead-name-review", screen: "Needs you — Jordan confirms the name", do: async (s) => { await s.click("#scAskedDone", { wait: 500 }); await switchRole(s, "teamlead", "#/deals"); await s.click('#dqNeeds [data-review-kind="identity"]', { wait: 600 }); },
        action: "Choose The license is right, tap Confirm", next: "formerly-row",
        expect: async (s) => (await s.exists('#dqSheet [data-idpick="scanned"]')) ? null : "Jordan's sheet should offer the license's name and the record's",
        notes: "Only a Team Lead sees the request. Jordan's sheet shows both names, the license and the birthday, and two options, The license is right and The record is right, with no Decline button (as for a birthday, LS-045)." },
      { key: "formerly-row", screen: "New visit — Formerly Cheri Bridwell", do: async (s) => {
          await s.click('#dqSheet [data-idpick="scanned"]', { wait: 200 }); await s.click("#idReviewGo", { wait: 700 });
          await switchRole(s, "advisor", "#/visit"); await s.type("#obSearch", "Cheri"); await s.click("#searchBtn", { wait: 400 }); },
        action: "Tap the customer", next: "onboarding/customer-found-open-visit",
        expect: async (s) => (await s.text("#view")).includes("Formerly Cheri Bridwell") ? null : "after Jordan confirms, the record keeps Formerly Cheri Bridwell (LS-047)",
        notes: "The license is right: Cheri's record takes the license's name and keeps the old one. Formerly Cheri Bridwell shows on the rows that pick a person, and on no paper and no deal title." },
    ] },

  { id: "training", area: "04-training-materials", title: "Training Documents",
    description: "One hub for both printable prop sets, on the owner's UI kit (package v024, 2026-09-05): a sub-destination under More — the Destination skeleton with the More tab active, the wordmark (no role control — it appears only in Customer Onboarding, owner ruling B), the DEMO band, and the floating tab bar as the way around. Five training driver's licenses (the only things the scanner recognizes) and their five matching registrations, as compact pair rows; the document itself appears only inside its preview sheet — scaled to the phone, printed at true millimetre size.",
    entry: { from: "home/more-sheet", action: "Training documents" },
    steps: [
      { key: "licenses", screen: "Licenses", do: async (s) => { await s.reset(); await s.go("#/props"); }, action: "Tap a pair row", next: "license-preview",
        branches: [{ action: "Registrations", to: "training/registrations" }, { action: "Print all 5", to: "training/licenses" }, { action: "More reopens its sheet", to: "home/more-sheet" }],
        expect: async (s) => {
          if (!await s.exists(".rp-screen--destination .rp-tabbar #dqMore.rp-tab--active")) return "the hub should wear the Destination skeleton with the More tab active";
          if (await s.exists("#tdocBack, .rp-topbar__close")) return "a sub-destination has no back chevron — the tab bar is the way around";
          const t = await s.text(".rp-page");
          if (t.includes("not valid for any purpose") || t.includes("100% scale")) return "the lede and the footer helper should be gone (v024)";
          return null;
        },
        notes: "A place, not a task: the count line replaces the lede, the segmented control is the kit's, Print all is the kit's pill in the title row, and each pair is a row with the pair number as a text tile. The 'not valid' wording stays on the printed props themselves, where it belongs — that is artwork, not interface copy." },
      { key: "license-preview", screen: "License preview — both sides", do: async (s) => { await s.click('[data-pair="1"]', { wait: 420 }); }, action: "Close", next: "registrations",
        expect: async (s) => {
          if (!await s.exists("#tdocSheet .rp-sheet__sub")) return "the sheet should carry the pair as its subtitle line";
          const n = Number(await s.eval(`document.querySelectorAll("#tdocSheet button").length`));
          if (n !== 2) return "one primary and the × close, no outlined Close button — found " + n + " buttons";
          return null;
        },
        notes: "A license prop is two sides: the back carries the barcode, and that barcode is the only thing the scanner can read. The sheet names the person and the pair in its subtitle, shows both faces, and offers one primary — the × is the close." },
      { key: "registrations", screen: "Registrations", do: async (s) => { await s.click("[data-sheet-close]", { wait: 300 }); await s.click('[data-type="registration"]', { wait: 320 }); }, action: "Tap a pair row", next: "registration-preview",
        notes: "The same page, second segment: the rows now carry the registration number and the vehicle it belongs to — the customer's current car, a trade-in candidate, never the vehicle in their deal." },
      { key: "registration-preview", screen: "Registration preview", do: async (s) => { await s.click('[data-pair="1"]', { wait: 460 }); }, action: null, next: null,
        expect: async (s) => {
          const fits = await s.eval(`(function () { var w = document.querySelector(".tdoc-preview"), el = w && w.querySelector(".reg-card"); if (!el) return "no registration in the sheet"; var r = el.getBoundingClientRect(), b = w.getBoundingClientRect(); return (r.right <= b.right + 1 && r.left >= b.left - 1) ? "" : "the 112mm card spills out of its wrapper"; })()`);
          return fits || null;
        },
        notes: "RP-UI-012 stays resolved: the 112mm document is scaled to the viewport here — measured, not assumed — while printing keeps its true physical size. The scaling and the print set are all that remains of this screen's own CSS family; the chrome is the kit's." },
      /* ---- what the printer gets (lib/coverage, 2026-09-22): the print set
         is state the screen arms, and on paper the screen is gone. These are
         shot under print media — every step below puts screen media back
         FIRST, and the flow ends on a screen step so nothing leaks into the
         next flow's captures. ---- */
      { key: "print-one-pair", screen: "Print this sample — one pair on paper", standalone: true, do: async (s) => {
          await s.c.send("Emulation.setEmulatedMedia", { media: "" });
          await s.reset(); await s.go("#/props"); await s.click('[data-pair="1"]', { wait: 420 });
          await s.c.send("Emulation.setEmulatedMedia", { media: "print" }); await wait(350); },
        action: "Close the sheet — all five are armed again", next: "print-all-5",
        expect: async (s) => {
          const n = Number(await s.eval(`document.querySelectorAll("#tdocPrint .tdoc-page").length`));
          if (n !== 1) return "opening one pair should arm exactly that pair — " + n + " pages armed";
          const gone = await s.eval(`getComputedStyle(document.querySelector(".rp-screen")).display === "none" && getComputedStyle(document.querySelector("#tdocPrint")).display === "block"`);
          return gone ? null : "in print the screen should be gone and only the print set remain";
        },
        notes: "What Print this sample sends to the printer with pair 01 open: one page, the license front and back at their true 85.6 × 54 mm, and none of the app's chrome. The screen you were looking at is not on the paper." },
      { key: "print-all-5", screen: "Print all — the license set on paper", do: async (s) => {
          await s.c.send("Emulation.setEmulatedMedia", { media: "" }); await wait(200);
          await s.click("[data-sheet-close]", { wait: 300 });
          await s.c.send("Emulation.setEmulatedMedia", { media: "print" }); await wait(350); },
        action: "Switch to Registrations", next: "print-registrations",
        expect: async (s) => { const want = Number((await s.text("#tdocPrintAll")).replace(/\D+/g, "")); const n = Number(await s.eval(`document.querySelectorAll("#tdocPrint .tdoc-page").length`)); return n === want && want > 0 ? null : "closing the sheet should re-arm every pair Print all counts: " + want + " counted, " + n + " armed"; },
        notes: "With no sheet open, Print all prints the whole license set, one pair per page, every one at true card size; its count is the pairs shown, nine since the four new training cards (#202)." },
      { key: "print-registrations", screen: "Print all 5 — registrations on paper", do: async (s) => {
          await s.c.send("Emulation.setEmulatedMedia", { media: "" }); await wait(200);
          await s.click('[data-type="registration"]', { wait: 320 });
          await s.c.send("Emulation.setEmulatedMedia", { media: "print" }); await wait(350); },
        action: "Tap More in the tab bar", next: "hub-more-sheet",
        expect: async (s) => { const r = Number(await s.eval(`document.querySelectorAll("#tdocPrint .reg-card").length`)), l = Number(await s.eval(`document.querySelectorAll("#tdocPrint .prop-card").length`)); return (r === 5 && l === 0) ? null : "the registrations tab should print registrations only — " + r + " registrations, " + l + " licenses"; },
        notes: "The print set follows the tab on screen: on Registrations, Print all 5 prints the five registrations at 112 × 140 mm and no licenses." },
      { key: "hub-more-sheet", screen: "More from the hub — the way out", do: async (s) => {
          await s.c.send("Emulation.setEmulatedMedia", { media: "" }); await wait(200);
          await s.go("#/props/registrations"); await s.click("#dqMore", { wait: 400 }); },
        action: "Tap Training documents to close it, or any other row", next: "home/more-sheet",
        expect: async (s) => (await s.exists(".rp-tabbar #dqMore.rp-tab--active") && await s.exists("#dqSheet:not([hidden]), .rp-sheet:not([hidden])")) ? null : "More should reopen its sheet over the hub with the More tab still marked",
        notes: "The hub has no back chevron; the tab bar is the way out. More reopens its sheet over the page it already marks, and tapping the hub's own row simply closes it." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "discovery", area: "05-discovery", title: "Discovery — the guided consultation",
    description: "The guided consultation of 2026-09-10 brought back onto the kit as it ships (D-SM1 = B, 2026-09-21): one stage per topic with a sample slide, the customer's sample reply as chips, ✓ to confirm, Skip to leave a topic out; the profile at the end is the hand-off, and ✓ there moves the visit to the vehicle stage and opens Vehicle selection filtered by what was confirmed. No opener (D-SM2 = A, 2026-09-22): it opens on the first stage. Sample replies only — no microphone, transcription or extraction, ever. The old question list is erased.",
    entry: { from: "onboarding/customer-found", action: "Confirm address & start visit" },
    steps: [
      { key: "stage-intro", screen: "Stage 1 — the sample slide", do: async (s, ctx) => { await s.reset(); await s.go("#/visit"); await s.click('[data-found="c-demo2"]', { wait: 400 }); await s.click('#obConfirm', { wait: 600 }); ctx.dealId = await s.eval('location.hash.split("/").pop()'); await s.go("#/discovery/" + ctx.dealId); await s.eval("location.reload()"); await s.settle(700); },
        action: "Tap ✓", next: "stage-question",
        branches: [{ action: "Tap ×", to: "home/deals-queue" }],
        notes: "Opens here — no session screen, no switches, no Start. The top bar is the customer's name and the ×; the stage carries the question and Tap to play (a sample slide, no video supplied). The voice bar's dots are decoration and say so to assistive tech. Kit gap on file (D-SM3 = A): the kit names .rp-stage twice and the second rule clips the question at the edge." },
      { key: "stage-question", screen: "Current vehicle — the sample reply as chips", do: async (s) => { await s.click(".rp-voice__accept", { wait: 450 }); },
        action: "Tap the Sunroof chip", next: "stage-chip-toggled",
        expect: async (s) => (await s.exists("#dcSkip")) ? null : "Skip this topic appears on a question",
        notes: "The sample reply becomes chips the advisor can toggle with the customer; Skip this topic appears here, not on the intro. Kit gap: the feature chips are 34 px tall against the 40 px touch floor." },
      { key: "stage-chip-toggled", screen: "Current vehicle — a chip turned on", do: async (s) => { await s.click('[data-feature="sunroof"]', { wait: 300 }); await s.eval("location.reload()"); await s.settle(700); },
        action: "Tap ✓", next: "stage-skip",
        expect: async (s) => (await s.eval(`document.querySelector('[data-feature="sunroof"]').getAttribute("aria-pressed") === "true"`)) ? null : "the toggled chip should survive a reload",
        notes: "Sunroof is on. The toggle saved the moment it was tapped — this picture is taken after a reload, and the same question comes back with the choice kept. ✓ records the reply (marked simulated) and moves on." },
      { key: "stage-skip", screen: "Size & space — Skip this topic", do: async (s) => { await s.click(".rp-voice__accept", { wait: 450 }); },
        action: "Tap Skip this topic", next: "stage-seating",
        notes: "Skip lives on the stage itself: the topic is recorded as skipped, not answered, and nothing from it reaches the profile." },
      { key: "stage-seating", screen: "Seating & family", do: async (s) => { await s.click("#dcSkip", { wait: 450 }); },
        action: "Tap ✓", next: "stage-drivetrain",
        notes: "The chips are labeled words (Second row space, Third row access), never the keys the app stores." },
      { key: "stage-drivetrain", screen: "Drivetrain", do: async (s) => { await s.click(".rp-voice__accept", { wait: 450 }); },
        action: "Tap ✓", next: "stage-lane-support",
        notes: "Confirming this topic puts AWD among the musts that Vehicle selection filters by." },
      { key: "stage-lane-support", screen: "Lane support — the shared stage", do: async (s) => { await s.click(".rp-voice__accept", { wait: 450 }); },
        action: "Tap ✓", next: "stage-reverse-safety",
        expect: async (s) => (await s.eval(`(document.querySelector('[data-feature="reverseBraking"]') || {}).disabled === true`)) ? null : "on Lane support the reverse-braking chip is not the topic and should be disabled",
        notes: "Lane support and Reverse safety share one stage. Here the Reverse braking chip is disabled — it is not this topic — though the kit draws a disabled chip no differently, so the picture cannot tell the two apart." },
      { key: "stage-reverse-safety", screen: "Reverse safety — the shared stage, the other way", do: async (s) => { await s.click(".rp-voice__accept", { wait: 450 }); },
        action: "Tap ✓", next: "profile",
        expect: async (s) => (await s.eval(`(document.querySelector('[data-feature="laneCentering"]') || {}).disabled === true`)) ? null : "on Reverse safety the lane chip is not the topic and should be disabled",
        notes: "The same stage with the roles swapped: now Lane centering is the disabled chip, and only the sample line under the stage tells the two topics apart." },
      { key: "profile", screen: "The profile — the hand-off", do: async (s) => { await s.click(".rp-voice__accept", { wait: 450 }); },
        action: "Reload the page", next: "profile-reload",
        branches: [{ action: "Tap ✓", to: "vehicles/inventory-from-discovery" }, { action: "Tap ×", to: "discovery/profile-change" }],
        expect: async (s) => { const q = (await s.text("#dcQuestion")).trim(); if (q !== "Your profile is ready.") return "the profile should be up, got: " + q; if (await s.exists("#dcSkip")) return "no Skip on the profile"; const c = await s.text(".rp-stage__labels"); if (!/Sunroof/.test(c) || /Cargo room/.test(c)) return "the profile should carry the toggled Sunroof and nothing from the skipped topic, got: " + c; return null; },
        notes: "Every confirmed preference as a chip — Blind spot warning, AWD, Sunroof, Seats 5+ — and nothing from the skipped topic. No Skip here; the voice label says what ✓ does. The visit is still in discovery until ✓." },
      { key: "profile-reload", screen: "The profile after a reload", do: async (s) => { await s.eval("location.reload()"); await s.settle(700); },
        action: "Tap ×", next: "profile-change",
        expect: async (s) => ((await s.text("#dcQuestion")).trim() === "Your profile is ready.") ? null : "a reload should land on the profile",
        notes: "Closing the browser and coming back lands on the profile, not on question one — the consultation is kept until ✓ hands it off." },
      { key: "profile-change", screen: "× on the profile — back to the first question", do: async (s) => { await s.click(".rp-voice__cancel", { wait: 450 }); },
        action: "Tap ✓ through every topic", next: "profile-again",
        expect: async (s) => { if (!/keep/i.test(await s.text("#dcQuestion"))) return "× should go back to the first question"; if (!await s.eval(`document.querySelector('[data-feature="sunroof"]').getAttribute("aria-pressed") === "true"`)) return "the answers should be kept"; return null; },
        notes: "Change something: the first question comes back with every answer kept — Sunroof is still on — so the advisor changes only what the customer wants changed." },
      { key: "profile-again", screen: "Confirmed through — the profile again", do: async (s) => { for (let i = 0; i < 8 && (await s.text("#dcQuestion")).trim() !== "Your profile is ready."; i++) await s.click(".rp-voice__accept", { wait: 450 }); },
        action: "Tap ✓", next: "vehicles/inventory-from-discovery",
        expect: async (s) => ((await s.text("#dcQuestion")).trim() === "Your profile is ready.") ? null : "confirming through should return to the profile",
        notes: "✓ through the topics returns to the same profile. ✓ here moves the visit to the vehicle stage, records discovery done and the filters, and opens Vehicle selection filtered by what was confirmed." },
      { key: "close-to-home", screen: "× in the top bar — back to the visits", scenario: true, do: async (s) => { await s.reset(); await s.go("#/visit"); await s.click('[data-found="c-demo2"]', { wait: 400 }); await s.click('#obConfirm', { wait: 600 }); const id = await s.eval('location.hash.split("/").pop()'); await s.go("#/discovery/" + id); await s.click(".rp-topbar__close", { wait: 600 }); },
        action: null, next: null,
        expect: async (s) => (await s.eval(`location.hash === "#/deals" && document.body.dataset.screen === "deals" && !document.querySelector("#discoveryConsultation")`)) ? null : "× should tear Discovery down and render Home",
        notes: "Leaving is one tap: Discovery is gone and Home is drawn in its place, with Cheri Bridwell's visit still in the showroom section — the consultation is not lost." },
      { key: "vehicle-selected", screen: "A visit with a vehicle already chosen", scenario: true, do: async (s) => { await s.reset(); await s.go("#/discovery/d-demo1"); await s.eval("location.reload()"); await s.settle(700); },
        action: null, next: null,
        notes: "John Smith's Discovery opens on its stage like any other; the vehicle chosen upstream is not on this screen — no VIN, stock number or payment anywhere in Discovery." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "vehicles", area: "06-vehicle-selection", title: "Vehicle Selection",
    description: "Choosing the car on the owner's UI kit (package v025 r5, 2026-09-05). Inside a visit it is a Task whose top bar carries the customer's full name and nothing else — no step, no status, no deal number, because numbers exist only after F&I — and Close returns to the visit; without a visit it is the Inventory destination with the tab bar. The frame is fixed and the list scrolls inside it, the whole card is the tap target, the type chips and Filters ride a rail with the active filter count, and every secondary decision is a sheet with one primary. Vehicle contention (chrome rule §14) is never drawn here: two informational states that appear only on deal cards and in the alert at the top of My deals, and neither blocks a choice.",
    entry: { from: "discovery/profile", action: "Tap ✓ on the profile" },
    steps: [
      { key: "inventory-from-discovery", screen: "Arrived from Discovery — the musts stated, 1 of 1", do: async (s) => { await s.reset(); await ev(s, `var d = Store.deal("${D}"); d.stock = null; d.vehicle = null; d.stage = "vehicle"; d.discovery = Object.assign(d.discovery || {}, { done: true, consultationFilters: { version: 2, source: "consultation-confirmed", must: ["blindSpot", "awd"], keep: ["sunroof"], nice: [], minSeats: 5, dogsWeekly: true } });`); await s.go(`#/vehicles/${D}`); },
        action: "Tap Turn off Discovery filters", next: "inventory-discovery-off",
        expect: async (s) => {
          const n = await s.text(".rp-notice");
          if (!/Discovery musts: Blind spot warning · AWD · 5\+ seats/.test(n)) return "the notice should state the musts in words, got: " + n;
          const cards = Number(await s.eval(`document.querySelectorAll("[data-detail]").length`));
          if (cards !== 1 || !/Santa Fe/.test(await s.text("#view"))) return "only the Santa Fe should fit (got " + cards + ")";
          if (!/Discovery match/.test(await s.text("#vsSort"))) return "the list should be sorted by Discovery match";
          return null;
        },
        notes: "What ✓ on the profile lands on. The filters Discovery confirmed are set on the deal as a shortcut here; the notice says the musts in plain words (Blind spot warning · AWD · 5+ seats), only the one car that fits is listed — the Santa Fe, 1 of 1 — and the sort reads Discovery match." },
      { key: "inventory-discovery-off", screen: "Discovery filters off — the whole lot", do: async (s) => { await s.click("#vsDiscovery", { wait: 500 }); },
        action: "Tap the sort", next: "inventory",
        expect: async (s) => {
          if (!/filters off/i.test(await s.text(".rp-notice"))) return "the notice should say the Discovery filters are off";
          if (Number(await s.eval(`document.querySelectorAll("[data-detail]").length`)) < 2) return "the whole inventory should be back";
          if (/Discovery match/.test(await s.text("#vsSort"))) return "the sort should fall back to price";
          return null;
        },
        notes: "One tap shows the whole inventory again — the sort falls back to price, high to low — and the same link turns the Discovery filters back on." },
      { key: "inventory", screen: "Vehicle search — inventory", do: async (s) => { await s.reset(); await ev(s, `var d = Store.deal("${D}"); d.stock = null; d.vehicle = null; d.stage = "vehicle";`); await s.go(`#/vehicles/${D}`); },
        action: "Tap the sort", next: "inventory-sort-low",
        expect: async (s) => {
          const t = await s.text(".rp-topbar__title");
          if (t.trim() !== "John Smith") return "the task top bar carries the customer's full name and nothing else, got: " + t;
          if (await s.exists(".rp-topbar__title small")) return "no step line inside a visit — the page eyebrow and title name the work";
          if (await s.exists(".rp-vstatus")) return "contention is never drawn in inventory";
          return null;
        },
        notes: "Content first: the customer context card is gone — the top bar's name carries it — and the filter panel that used to own the first screen is one Filters chip on the rail. The frame is fixed; only the list scrolls." },
      { key: "inventory-sort-low", screen: "Inventory — price low to high", do: async (s) => { await s.click("#vsSort", { wait: 350 }); },
        action: "Tap the Used chip", next: "inventory-filtered",
        expect: async (s) => (/low to high/.test(await s.text("#vsSort"))) ? null : "the sort control should flip in place to low to high",
        notes: "The sort flips in place under the list heading — no sheet, no reload — and the cheapest car leads." },
      { key: "inventory-filtered", screen: "Inventory — Used only", do: async (s) => { await s.click("#vsSort", { wait: 300 }); await s.click('.rp-chip[data-type="Used"]'); }, action: "Open Filters, tap Hyundai", next: "filters-sheet",
        notes: "The chip rail scrolls sideways and the count line under the list heading follows the filter — one used vehicle in the seed." },
      { key: "filters-sheet", screen: "Filters — the sheet, counting on the primary", do: async (s) => { await s.click('.rp-chip[data-type="All"]'); await s.click("#vsFilters", { wait: 250 }); await s.click('#vsSheet .rp-chip[data-opt="make"][data-val="Hyundai"]', { wait: 300 }); },
        action: "Cap the price at $1,000, tap Show", next: "inventory-no-match",
        expect: async (s) => {
          const p = await s.text("#vsSheet .rp-primary");
          if (!/^Show \d+ vehicles?$/.test(p.trim())) return "the primary should count the result, got: " + p;
          if (!await s.exists("#mMaxPrice")) return "the price cap field should be in the sheet";
          return null;
        },
        notes: "Make, body style and sort as chips, the price cap a field; every change recounts on the primary — Show 5 vehicles for Hyundai — so the advisor knows before closing what the list will hold. Clear all is the one link." },
      { key: "inventory-no-match", screen: "Inventory — no vehicles match", do: async (s) => { await s.type("#mMaxPrice", "1000"); await s.click("#vsSheet .rp-primary[data-sheet-close]", { wait: 250 }); },
        action: "Clear all filters; tap a vehicle", next: "vehicle-details",
        notes: "One quiet recovery object with a single navy action — not a giant illustration. The Filters chip carries the count of what is active." },
      { key: "vehicle-details", screen: "Vehicle details — sheet", do: async (s) => { await s.click("#vsClearEmpty", { wait: 250 }); await s.click('[data-detail="7H21313"]', { wait: 320 }); }, action: "Tap Choose this vehicle", next: "next-steps",
        expect: async (s) => {
          const t = await s.text("#vsSheet");
          if (!t.includes("5NMS4DAL4NH457995")) return "the sheet should show the deal's own car (VIN 5NMS4DAL4NH457995)";
          if (await s.exists("#vsSheet .rp-vstatus, #vsSheet .rp-notice--working, #vsSheet .rp-notice--reserved")) return "contention is never drawn in the details sheet either";
          return null;
        },
        notes: "The whole card is the tap target, and the first tap shows the object rather than five competing actions. Two key/value groups — the money, then the car — one primary, and the × as the close." },
      { key: "next-steps", screen: "What's next? — after choosing", do: async (s) => { await s.click("[data-choose]", { wait: 300 }); }, action: "Tap Test drive", next: "test-drive/ready",
        branches: [{ action: "Trade appraisal", to: "trade/trade-evaluation" }, { action: "Calculate payment", to: "desking/huddle-gate" }, { action: "Quote", to: "vehicles/quote-blocked" }],
        notes: "The chosen vehicle stays visible above the five actions, so the next decision keeps its context. The VIN and stock are captured onto the deal at this moment — and any other advisor already working that car is told, without anyone being blocked." },
      { key: "quote-blocked", screen: "Quote — follow-up only", do: async (s) => { await s.click('[data-act="quote"]', { wait: 300 }); }, action: null, next: null,
        notes: "The restriction is one subtitle line with a real next action under it (Save quote for follow-up), replacing a paragraph and a toast that disappeared before it could be read." },
      { key: "inventory-browse", screen: "Browse inventory (no visit)", do: async (s) => { await s.go("#/vehicles/browse"); await s.click("[data-detail]", { wait: 320 }); }, action: null, next: null,
        expect: async (s) => {
          if (await s.exists("[data-choose]")) return "browsing without a visit has no deal to put a car on — the sheet should offer no Choose";
          if (!await s.exists(".rp-screen--destination .rp-tabbar")) return "browse is a destination and carries the tab bar";
          return null;
        },
        notes: "Reached from the Inventory tab without a customer visit. The page-level banner explaining what unlocks is gone: the details sheet simply has no Choose action, rather than a dead control on every card." },
      { key: "close-to-discovery", screen: "Close — back to the visit in Discovery", scenario: true, do: async (s) => { await s.reset(); await ev(s, `var d = Store.deal("${D}"); d.stock = null; d.vehicle = null; d.stage = "vehicle";`); await s.go(`#/vehicles/${D}`); await s.click("#vsClose", { wait: 700 }); },
        action: null, next: null,
        expect: async (s) => (await s.eval(`location.hash === "#/discovery/${D}"`)) ? null : "Close should return to the visit's own screen, got " + await s.eval("location.hash"),
        notes: "× on Vehicle selection goes back to where the visit is — John Smith's Discovery — not to Home." },
      { key: "contention-working-card", screen: "My deals — the car is also on Nadia's deal", scenario: true, do: async (s) => { await s.reset(); await ev(s, `var d = Store.deal("${D}"); d.stock = null; d.vehicle = null; d.stage = "vehicle"; Store.s.deals.push(Object.assign(JSON.parse(JSON.stringify(d)), { id: "d-nadia", customerId: "c-demo2", stock: "7H21313", stage: "desking", advisor: "Nadia R.", visit: null }));`); await s.go(`#/vehicles/${D}`); await s.click('[data-detail="7H21313"]', { wait: 400 }); await s.click("[data-choose]", { wait: 500 }); await s.go("#/deals"); await clearToast(s); },
        action: null, next: null,
        expect: async (s) => {
          if (await s.exists(".rp-alert")) return "the working alert is Nadia's, not ours — My deals should carry no alert";
          const st = await s.text(".rp-card .rp-vstatus--working");
          if (!/Also selected by Nadia R\./.test(st)) return "our deal card should say the car is also on Nadia's deal, got: " + st;
          return null;
        },
        notes: "Nadia R. already has the Santa Fe on an open deal and the advisor chose it anyway — nothing blocked the choice. Back on My deals there is no alert for us; John's card simply says Also selected by Nadia R. under the VIN line." },
      { key: "contention-working-alert", screen: "Nadia's My deals — Also selected", scenario: true, do: async (s) => { await ev(s, `Store.s.advisor = "Nadia R."`); await s.go("#/deals"); },
        action: null, next: null,
        expect: async (s) => {
          const t = await s.text(".rp-alert--working");
          if (!/Also selected/.test(t)) return "the advisor already on the car should be told, got: " + t;
          return null;
        },
        notes: "The same moment from the other phone: Nadia, the advisor already working the car, is the one told — one alert at the top of Nadia's My deals saying Ashley Collins also selected it for John Smith, and nobody else hears about it. Seen here by signing this device in as Nadia (a shortcut; the demo has one advisor)." },
      { key: "vehicle-reserved", screen: "Notification — vehicle reserved", scenario: true, do: async (s) => { await s.reset(); await s.go("#/demo/vehicle-reserved"); await clearToast(s); },
        action: "Tap × on the alert", next: "reserved-dismissed",
        branches: [{ action: "Tap Choose another vehicle", to: "vehicles/inventory" }],
        expect: async (s) => {
          const t = await s.text(".rp-alert");
          if (!t.includes("Vehicle reserved") || !t.includes("Nadia R.")) return "the alert should name the state and who signed, got: " + t;
          if (!await s.exists(".rp-card .rp-vstatus--reserved")) return "the deal card should carry the same reserved status";
          return null;
        },
        notes: "A later moment than the screens above: Nadia R.'s buyer's order on this car is signed, so every advisor with it on an open deal gets one alert at the top of My deals with a single real action, and their deal card carries the same status under the VIN line. Neither state blocks anything — John's deal stays open." },
      { key: "reserved-dismissed", screen: "Alert dismissed — the card keeps its status", do: async (s) => { await s.click("[data-alert-close]", { wait: 400 }); await s.eval("location.reload()"); await s.settle(700); },
        action: "Switch to Team Lead", next: "reserved-team-lead",
        expect: async (s) => {
          if (await s.exists(".rp-alert")) return "the dismissed alert should stay dismissed after a reload";
          if (!await s.exists(".rp-card .rp-vstatus--reserved")) return "the card should still carry Reserved by another deal";
          return null;
        },
        notes: "× dismisses the alert and it stays dismissed after a reload; the card's Reserved by another deal · Nadia R. line stays where it is, and the deal is still open." },
      { key: "reserved-team-lead", screen: "Active floor (Team Lead) — the status, no alert", do: async (s) => { await switchRole(s, "teamlead", "#/deals"); },
        action: null, next: null,
        expect: async (s) => {
          if (await s.exists(".rp-alert")) return "the Team Lead's floor carries no alert";
          if (!await s.exists(".rp-card .rp-vstatus--reserved")) return "the floor's card should carry the reserved status";
          return null;
        },
        notes: "The Team Lead sees the same status on the deal card and no alert — the alert is addressed to the deal's advisor. Funding or voiding Nadia's deal releases the hold; Reset demo data clears everything." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "test-drive", area: "07-test-drive", title: "Test Drive Agreement",
    description: "A short active-session workflow, not a legal form on a phone: Ready → Review & sign → Drive in progress → End drive → Complete. The license is read from the customer profile and never asked for again; additional drivers come through the one Customer Resolver. The pictures run on the seed deal with Cheri Bridwell as its customer, since Cheri’s profile carries a complete license, where John Smith’s does not until the scan. Since LS-117 every person on the Drivers row is checked like the buyer: adding John, who has no license on file, holds the drive at License needs attention until John’s license is complete.",
    entry: { from: "vehicles/next-steps", action: "Tap Test Drive" },
    steps: [
      /* the seed deal, re-pointed at Cheri (the seed customer with a complete
         license) and with its drive not yet run: the flow starts before
         anyone has asked for the insurance, so the row reads Not on file */
      { key: "ready", screen: "Ready to test drive", do: async (s) => { await s.reset(); await ev(s, `const d = Store.deal("${D}"); d.customerId = "c-demo2"; d.testDrive = { done: false }; d.stage = "testdrive";`); await s.go(`#/testdrive/${D}`); },
        action: "Tap the customer · vehicle row", next: "deal-details",
        branches: [{ action: "Review & sign", to: "test-drive/review-sign" }, { action: "Add (insurance)", to: "test-drive/insurance-sheet" }, { action: "Add driver", to: "test-drive/add-driver" }, { action: "Complete license (when the profile's license is missing)", to: "test-drive/license-exception" }],
        notes: "The license row reads the customer profile and calls it Ready. There is no test-drive license form and no second scanner. Insurance reads Not on file until someone asks, the drivers row names the customer, the terms card states the limit and where the agreement is stored, and the one primary — Review & sign — sits in the dock. No deal number on the page." },
      { key: "deal-details", screen: "Deal details (sheet)", do: async (s) => { await s.click("#tdDeal", { wait: 380 }); }, action: "Done, then tap Add on the insurance row", next: "insurance-sheet",
        notes: "The one place the deal number lives: customer, vehicle with stock, deal number and stage. Escape or Done closes it." },
      { key: "insurance-sheet", screen: "Insurance company (sheet)", do: async (s) => { await s.click("#tdSheet [data-sheet-close]", { wait: 300 }); await s.click("#tdInsurance", { wait: 380 }); await s.type("#tdInsInput", "Ride Price Insurance"); }, action: "Tap Save", next: "insurance-saved",
        notes: "One field, nothing else. A tap on the dimmed page behind it cancels." },
      { key: "insurance-saved", screen: "Ready — the insurance company on its row", do: async (s) => { await s.click("#tdInsSave", { wait: 400 }); }, action: "Tap Add driver", next: "add-driver",
        notes: "Save puts the company on the row and the link becomes Edit. It is kept on the deal's test drive and printed on the agreement." },
      { key: "add-driver", screen: "Add another driver", do: async (s) => { await s.click("#tdAddDriver", { wait: 380 }); }, action: "Tap Find existing customer", next: "driver-resolver",
        branches: [{ action: "Scan physical license", to: "test-drive/driver-scan-door" }, { action: "Send secure upload link", to: "test-drive/driver-send-link" }],
        notes: "Three doors into the one Customer Resolver — search, scan, secure upload link. A name and license number are never typed here." },
      { key: "driver-resolver", screen: "Customer Resolver — on a driver mission", do: async (s) => { await s.click('#tdSheet [data-open="search"]', { wait: 600 }); }, action: "Tap John Smith", next: "driver-found",
        notes: "The same resolver New visit uses, with one difference: the context notice says it is adding a test-drive driver, so the person picked here joins the drive rather than starting a visit." },
      { key: "driver-found", screen: "Customer found — Confirm address & add driver", do: async (s) => { await s.click('[data-found="c-demo1"]', { wait: 500 }); }, action: "Tap Confirm address & add driver", next: "driver-attached",
        notes: "The resolver runs exactly as it always does; only the confirm button names what it will do. Picking Cheri, the customer, is refused: Cheri is already the driver." },
      { key: "driver-attached", screen: "License needs attention — the added driver has no license", do: async (s) => { await s.click("#obConfirm", { wait: 700 }); },
        expect: async (s) => {
          if ((await s.eval("location.hash")) !== `#/testdrive/${D}`) return "confirming the driver should return to the test drive";
          const t = await s.text("#view");
          if (!t.includes("License needs attention") || !t.includes("John Smith’s license") || !t.includes("John’s license needed")) return "John has no license on file, so the drive should wait for John's license (LS-117)";
          return null;
        },
        action: "Tap Complete license", next: "driver-license",
        notes: "Confirming returns to the test drive with both names on the drivers row. The driver is stored as a customer record, never as typed text, and picking the same person again does not double them. Every driver is checked like the buyer (LS-117): John has no license on file, so his row reads Incomplete, the title reads License needs attention, and the dock asks for John's license instead of Review & sign." },
      { key: "driver-license", screen: "Ready — two drivers, both licensed", do: async (s) => { await ev(s, `Store.customer("c-demo1").license = { number: "T-0000101", state: "NY", expires: "2030-01-01" };`); await s.go(`#/testdrive/${D}`); },
        expect: async (s) => (await s.exists("#tdSign")) ? null : "with John's license on file the drive should be ready to sign",
        action: "Tap Add driver", next: "driver-remove",
        notes: "With John's license on file both license rows read Ready and Review & sign is back in the dock. (Reached here by putting John's license on his record; on the phone it is Complete license, which opens John's own scan, and only John's card can finish it.)" },
      { key: "driver-remove", screen: "Add another driver — the added driver, with Remove", do: async (s) => { await s.click("#tdAddDriver", { wait: 380 }); }, action: "Close, then tap Review & sign", next: "review-sign",
        notes: "The sheet lists who has been added under the three doors; Remove takes them off the deal and the row." },
      { key: "review-sign", screen: "Review & sign", do: async (s) => { await s.click("#tdSheet [data-sheet-close]", { wait: 300 }); await s.click("#tdSign", { wait: 400 }); }, action: "Tap Sign & start without ticking the authorization", next: "sign-refused",
        branches: [{ action: "View full agreement", to: "test-drive/agreement-printable" }],
        notes: "One sheet: the agreement's own terms, the electronic-signature authorization and the customer signature. Nothing is typed — the signature is the customer on the deal." },
      { key: "sign-refused", screen: "Review & sign — refused without the authorization", do: async (s) => { await s.eval(`(() => { const sh = document.querySelector("#tdSheet"); sh.scrollTop = sh.scrollHeight; return true; })()`); await s.settle(200); await s.click("#tdSignGo", { wait: 300 }); },
        expect: async (s) => /authorization/.test(await s.text("#toast")) ? null : "the refusal toast should ask for the authorization",
        action: "Tick the authorization, tap Sign & start test drive", next: "in-progress",
        notes: "Signing without the tick is refused in words, and the message lifts clear of the very button it is about. Nothing was signed. The tick is kept the moment it is given." },
      { key: "in-progress", screen: "Test drive in progress", do: async (s) => { await clearToast(s); await s.click("#tdEsign", { wait: 150 }); await s.click("#tdSignGo", { wait: 500 }); }, action: "Tap End drive", next: "end-drive",
        notes: "Reduced chrome: the vehicle, the live status, the starting odometer, the mileage limit, an elapsed clock and one action. The signed agreement is already in the Deal Jacket — the badge in the context row counts it on this very screen." },
      { key: "end-drive", screen: "End test drive — odometer", do: async (s) => { await s.click("#tdEnd", { wait: 380 }); }, action: "Type a reading below the start, tap Complete test drive", next: "odometer-refused",
        notes: "One field, prefilled at the start reading plus the limit." },
      { key: "odometer-refused", screen: "End test drive — a reading below the start refused", do: async (s) => { await s.type("#tdEndOdo", "3"); await s.click("#tdComplete", { wait: 300 }); },
        expect: async (s) => (await s.exists("#tdSheet .f-err")) ? null : "the odometer field should carry the refusal",
        action: "Correct the reading, tap Complete test drive", next: "completed",
        notes: "A reading lower than the car left with is refused on the field itself and spoken, and the message clears the button. The drive stays open." },
      { key: "completed", screen: "Test drive complete", do: async (s) => { await clearToast(s); await s.type("#tdEndOdo", "22"); await s.click("#tdComplete", { wait: 460 }); }, action: "Tap the one next step", next: "trade/trade-evaluation",
        branches: [{ action: "Calculate payment instead", to: "desking/huddle-gate" }],
        notes: "The facts — who is back, the vehicle, start → end odometer, the signed agreement stored in the Deal Jacket, the miles driven — and one primary action chosen from the deal: this deal has a trade, so Start trade evaluation leads and the payment is the quiet link. No dock." },
      { key: "completed-no-trade", screen: "Test drive complete — no trade on the deal", scenario: true, do: async (s) => { await ev(s, `Store.deal("${D}").trade.has = false;`); await s.go(`#/testdrive/${D}`); }, action: "Tap Calculate payment", next: "desking/huddle-gate",
        notes: "Same screen, the other deal shape: with no trade, Calculate payment is the primary and 'Customer has a trade' is the quiet link. The navigating link moves the deal to Desking." },
      { key: "completed-over-limit", screen: "Test drive complete — returned past the limit", scenario: true, do: async (s) => { await ev(s, `const d = Store.deal("${D}"); d.trade.has = true; d.testDrive.completedMiles = 32;`); await s.go(`#/testdrive/${D}`); }, action: "Tap Start trade evaluation", next: "trade/trade-evaluation",
        notes: "A return past the authorized distance is recorded and flagged Over limit — never refused, because refusing it would force a false number onto a signed record. (Reached here by setting the reading on the record; on the phone it is the odometer sheet.)" },
      { key: "agreement-printable", screen: "Printable Test Drive Agreement", standalone: true, do: async (s) => { await s.hash(`#/print/${D}/testdrive`); }, action: null, next: null,
        notes: "The paper reads the frozen record: the license, the additional driver, the insurance company and the return odometer print from the snapshot taken when the customer signed — a signed document never recomputes." },
      { key: "completed-seed-record", screen: "Test drive complete — a drive recorded before this screen", scenario: true, do: async (s) => { await s.reset(); await s.go(`#/testdrive/${D}`); }, action: "Tap Start trade evaluation", next: "trade/trade-evaluation",
        notes: "The demo's seeded drive, from before e-signing existed: the row says Test drive recorded and that the paper is in the Deal Jacket — it never claims a signature it did not take. Inside the limit, the odometer row is simply Recorded." },
      { key: "license-exception", screen: "License needs attention", do: async (s) => { await s.reset(); await ev(s, `const c = Store.customer("c-demo1"); delete c.license; Store.deal("${D}").customerId = "c-demo1"; Store.deal("${D}").testDrive = { done: false }; Store.deal("${D}").stage = "testdrive";`); await s.go(`#/testdrive/${D}`); },
        action: "Tap Complete license", next: "license-scan-mode",
        notes: "The exact missing item is named — No license on file — with one action. No form, and no Review & sign until the license is complete." },
      { key: "license-scan-mode", screen: "Scan license — opened from the test drive", do: async (s) => { await s.click("#tdFixLicense", { wait: 500 }); }, action: "Capture both sides of the card", next: "license-mismatch",
        notes: "The canonical scanner in its test-drive mode: the eyebrow says Test drive, and saving a matching card returns here with the profile holding both sides and the row Ready." },
      /* the prop-3 barcode fixture is rendered from the props page, which
         leaves the scanner — so it is fetched first and the exception state
         re-seeded, then the scan is driven from the test drive's own button */
      { key: "license-mismatch", screen: "Verify — the card reads a different name", do: async (s, ctx) => {
          const png = await barcodePng(s, 3);
          await s.reset(); await ev(s, `const c = Store.customer("c-demo1"); delete c.license; Store.deal("${D}").customerId = "c-demo1"; Store.deal("${D}").testDrive = { done: false }; Store.deal("${D}").stage = "testdrive";`); await s.go(`#/testdrive/${D}`);
          await s.click("#tdFixLicense", { wait: 500 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); },
        expect: async (s) => (await s.text("#scanBody")).includes("Check the name") ? null : "the verify screen should flag that the card carries a different name",
        action: "Save — refused; the test drive stays on the exception", next: null,
        notes: "A card with another person's name is flagged before anything is saved: the verdict is the name, not the number, so editing the license number to match changes nothing. The customer's record is untouched and the test drive stays on License needs attention." },
      { key: "license-expired", screen: "License needs attention — expired, with its date", scenario: true, do: async (s) => { await s.reset(); await ev(s, `Store.customer("c-demo2").license.expires = "2020-01-01"; const d = Store.deal("${D}"); d.customerId = "c-demo2"; d.testDrive = { done: false }; d.stage = "testdrive";`); await s.go(`#/testdrive/${D}`); }, action: "Tap Complete license", next: "license-scan-mode",
        notes: "An expired license is named with the date it expired, and the dock says License expired." },
      { key: "license-front-only", screen: "License needs attention — review pending", scenario: true, do: async (s) => { await s.reset(); await ev(s, `Store.customer("c-demo2").onboard = { secondSide: "pending" }; const d = Store.deal("${D}"); d.customerId = "c-demo2"; d.testDrive = { done: false }; d.stage = "testdrive";`); await s.go(`#/testdrive/${D}`); }, action: "Tap Complete license", next: "license-scan-mode",
        notes: "Only one side captured: the row says another side or a review is needed, and the dock says License review pending." },
      { key: "license-no-expiry", screen: "License needs attention — no expiration date", scenario: true, do: async (s) => { await s.reset(); await ev(s, `Store.customer("c-demo2").license.expires = ""; const d = Store.deal("${D}"); d.customerId = "c-demo2"; d.testDrive = { done: false }; d.stage = "testdrive";`); await s.go(`#/testdrive/${D}`); }, action: "Tap Complete license", next: "license-scan-mode",
        notes: "A license with no usable expiration date cannot be called unexpired, so it is not ready either — the row says the date is not on file." },
      /* a secure upload that finished on a driver mission: the session is
         seeded as the customer's phone would have left it */
      { key: "driver-upload-identified", screen: "Customer identified — Add as driver", scenario: true, do: async (s) => { await s.reset(); await ev(s, `const d = Store.deal("${D}"); d.customerId = "c-demo2"; d.testDrive = { done: false, insurance: "Ride Price Insurance", addlDriverIds: ["c-demo1"] }; d.stage = "testdrive";
          const now = new Date().toISOString(); const p = RIDE_PRICE_SCAN.personaFor(3);
          Store.s.idSession = { id: "s-td", phone: "(555) 555-0100", email: "driver@testing.com", channel: "Text", sentAt: now, photoAt: now, persona: p, matchId: null, faceAt: now, addressChoice: { address: p.address, city: p.city, state: p.state, zip: p.zip }, addressConfirmedAt: now, doneAt: now, mission: { kind: "driver", dealId: "${D}", back: "#/testdrive/${D}" } };`); await s.go("#/visit"); },
        action: "Tap Add as driver", next: "driver-upload-attached",
        notes: "When the customer finishes the secure upload on their phone, the resolver opens on the identified person and its button says Add as driver — the upload was sent for the drive, so that is what it does." },
      { key: "driver-upload-attached", screen: "Ready — the uploaded driver attached", do: async (s) => { await s.click("#obAttach", { wait: 700 }); },
        expect: async (s) => (await s.eval("location.hash")) === `#/testdrive/${D}` ? null : "attaching the uploaded driver should return to the test drive",
        action: "Tap Add driver, then Scan physical license", next: "driver-scan-door",
        notes: "Back on Ready with the uploaded person as the next driver; the driver added before is untouched." },
      { key: "driver-scan-door", screen: "Scan physical license — the resolver's own scanner", do: async (s) => { await s.click("#tdAddDriver", { wait: 380 }); await s.click('#tdSheet [data-open="scan"]', { wait: 700 }); }, action: "Close — back to the test drive", next: null,
        notes: "The second door opens the resolver's own scanner, exactly as New visit shows it — there is no second scanner in the test drive. What it reads comes back as a driver because the mission was set when the door was tapped." },
      { key: "driver-send-link", screen: "Send secure upload link — the resolver's own send sheet", standalone: true, do: async (s) => { await s.go(`#/testdrive/${D}`); await s.click("#tdAddDriver", { wait: 380 }); await s.click('#tdSheet [data-open="sendlink"]', { wait: 700 }); }, action: "Send — the customer uploads from their phone", next: "test-drive/driver-upload-identified",
        notes: "The third door: the resolver's send sheet, on the driver mission, so what comes back attaches as a driver." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "trade", area: "08-trade-in", title: "Trade-In Evaluation & Proof of Ownership",
    description: "Rebuilt customer-flow-first on the owner's V2 replication package (2026-09-01): the appraisal and the full ownership questionnaire are never two long forms on one page. Trade details → Value → Ownership review → Continue, one state at a time; ownership is a conditional bottom sheet asking only what previous answers make relevant, Not sure is a recorded unknown (never silently No), a stale payoff is its own named gap, and gaps queue for Team Lead sign-off while Calculate payment stays live — the advisor is never blocked.",
    entry: { from: "vehicles/next-steps", action: "Tap Trade Appraisal" },
    steps: [
      { key: "trade-evaluation", screen: "Trade value — the appraisal first", do: async (s) => { await s.reset();
          /* the seed answers ownership from the trade documents on file; this
             flow is the review itself, so it opens on one nobody has run. */
          await ev(s, `const d = Store.deal("${D}"); d.trade.ownership = {}; delete d.trade.ownershipReviewedAt;`);
          await s.go(`#/trade/${D}`); }, action: "Tap the customer · vehicle row", next: "details-sheet",
        branches: [{ action: "Review ownership", to: "trade/ownership-roots" }, { action: "Edit a field — the figure is withdrawn until Run evaluation", to: "trade/appraisal-edit" }],
        notes: "The seed trade is already evaluated, so the screen opens on the value state: the appraisal card with the evaluated-value hero inside it, then a small Proof of ownership card counting the answers still needed. One compact context row (customer · selected purchase vehicle · Jacket); the deal number lives in the details sheet behind it. Editing any appraisal field swaps the hero back to Run evaluation — the number on screen is never one the current inputs did not produce." },
      { key: "details-sheet", screen: "Deal details (sheet)", do: async (s) => { await s.click("#tvDeal", { wait: 380 }); }, action: "Done, then tap Review ownership", next: "ownership-roots",
        notes: "The one place the deal number lives: customer, the selected vehicle and the deal number with its stage. Nothing here is on the page behind it." },
      { key: "ownership-roots", screen: "Proof of ownership (sheet) — the three root questions", do: async (s) => { await s.click("#tvSheet [data-sheet-close]", { wait: 300 }); await s.click("#ownBtn", { wait: 400 }); }, action: "Answer title No, lienholder Yes, paid off No", next: "ownership-followups",
        notes: "Before any answer: title in hand, a lien on the title, and whether the person trading is the titled owner. Yes / No / Not sure on each; nothing else is asked yet, and the appraisal form is never open at the same time." },
      { key: "ownership-followups", screen: "Proof of ownership — follow-ups revealed mid-way", do: async (s) => {
          const answer = async (key, tri) => { await s.click(`#tvSheet [data-key="${key}"] button[data-tri="${tri}"]`, { wait: 300 }); };
          await answer("titleInHand", "no"); await answer("lienOnTitle", "yes"); await answer("paidOff", "no"); },
        action: "Answer the rest, with a payoff dated last year", next: "ownership-sheet",
        notes: "Only what the answers make relevant appears: title No reveals the duplicate-title question, a lienholder reveals paid-off, and not paid off reveals the payoff question — whose good-through date waits until a payoff is on file. Changing an answer back withdraws its follow-ups." },
      { key: "ownership-sheet", screen: "Proof of ownership (sheet) — every relevant question answered", do: async (s) => {
          const answer = async (key, tri) => { await s.click(`#tvSheet [data-key="${key}"] button[data-tri="${tri}"]`, { wait: 300 }); };
          await answer("duplicateStarted", "unsure"); await answer("payoffReceived", "yes");
          await s.type("#oGood", "01/01/2025"); await s.eval(`(() => { const g = document.querySelector("#oGood"); g.dispatchEvent(new Event("change")); return true; })()`);
          await s.click(`#tvSheet [data-key="isTitledOwner"] button[data-tri="unsure"]`, { wait: 300 }); },
        action: "Tap Save ownership review", next: "ownership-gaps",
        notes: "Three root questions; follow-ups appear only when the triggering answer makes them relevant — title No reveals the duplicate-title question, a lienholder reveals paid-off, not-paid-off reveals the payoff chain. Yes / No / Not sure, and Not sure records an unknown that still reads 'not recorded' at sign-off." },
      /* the arrow out of this card is the one the capture below actually
         walks — reopen the sheet, answer the roots, save — and it has to SAY
         so. It read "Tap Calculate payment" until 2026-09-09, the same words
         the next card's exit arrow carries, so the strip showed the label
         twice running against two different destinations: this one at the
         card beside it, that one at Desking. Same words, different road, and
         nothing on the board told them apart. Calculate payment from this
         state is still live and still lands on the Desking huddle — but it is
         not the road to the card on the right, so as of the same day it is a
         BRANCH and no longer this step's `next`. Everywhere else in this file
         `next` names where the step's own action lands; leaving Desking there
         described a destination the action had stopped going to, and
         capture.mjs copies the field verbatim into flow-manifest.json, so the
         published manifest repeated it. The rendered board never did — a
         non-terminal card goes through arrow(), which prints the action alone,
         and only a terminus's next is drawn — which is exactly why the wrong
         value could sit there unnoticed. (CodeRabbit, PR #95.) */
      { key: "ownership-gaps", screen: "Trade ready — items for Team Lead", do: async (s) => { await s.click("#ownSave", { wait: 500 }); }, action: "Reopen the review, answer the rest, tap Save ownership review", next: "ownership-complete",
        branches: [{ action: "Calculate payment", to: "desking/huddle-gate" }, { action: "Edit ownership answers", to: "trade/ownership-sheet" }, { action: "Edit appraisal", to: "trade/appraisal-edit" }],
        notes: "The value hero stays visible; each gap is named in the amber list under the Sign-off badge — the expired payoff as its own line with its date, a Not sure as 'not recorded' — under 'N items for Team Lead / Advisor can continue', and Calculate payment stays live: it goes to the same Desking huddle the card beside this one exits to, gaps and all, because a gap queues for Team Lead rather than blocking the advisor. Required paperwork the answers make mandatory is listed on the card." },
      { key: "ownership-complete", screen: "Trade ready — ownership review complete", do: async (s) => {
          await s.click("#ownEdit", { wait: 400 });
          const answer = async (key, tri) => { await s.click(`#tvSheet [data-key="${key}"] button[data-tri="${tri}"]`, { wait: 300 }); };
          await answer("titleInHand", "yes"); await answer("lienOnTitle", "no"); await answer("isTitledOwner", "yes");
          await s.click("#ownSave", { wait: 500 }); },
        action: "Tap View answers", next: "view-answers",
        branches: [{ action: "Calculate payment", to: "desking/huddle-gate" }],
        notes: "Every root answer recorded and no follow-up left relevant: the card resolves to Ownership review complete with a green Complete badge and a View answers link. This state survives a reload." },
      { key: "view-answers", screen: "View answers (sheet) — the recorded review", do: async (s) => { await s.click("#ownEdit", { wait: 400 }); }, action: "Close, then tap Edit appraisal", next: "appraisal-edit",
        notes: "The same sheet, opened from a complete card: every answer shows as it was recorded, and any of them can still be changed." },
      { key: "appraisal-edit", screen: "Edit appraisal — the figure withdrawn until it is re-run", do: async (s) => { await s.click("#tvSheet [data-sheet-close]", { wait: 300 }); await s.click("#apprEdit", { wait: 400 }); await s.type("#tMiles", "70000"); }, action: "Type a negative odometer, tap Run evaluation", next: "refused-odometer",
        notes: "Edit appraisal reopens the form with the recorded values, and the moment a field changes the value is gone from the screen — Run evaluation stands in its place, because a number the current inputs did not produce is never shown. The typed mileage survives." },
      { key: "refused-odometer", screen: "Run evaluation — a negative odometer refused", do: async (s) => { await s.type("#tMiles", "-5"); await s.click("#evalDock", { wait: 300 }); },
        expect: async (s) => /Add the mileage/.test(await s.text("#toast")) ? null : "a negative odometer should be asked for again",
        action: "Correct the mileage, type a model year of 2030, tap Run evaluation", next: "refused-year",
        notes: "A reading below zero is asked for again, the cursor lands in the box, and nothing is written over the reading before it. The message clears the dock — it never covers its own button." },
      { key: "refused-year", screen: "Run evaluation — a model year outside 1981–2026 refused", do: async (s) => { await clearToast(s); await s.type("#tMiles", "70000"); await s.type("#tYear", "2030"); await s.click("#evalDock", { wait: 300 }); },
        expect: async (s) => /Check the model year/.test(await s.text("#toast")) ? null : "a year past the window should be refused by name",
        action: "Correct the year, type a negative payoff, tap Run evaluation", next: "refused-payoff",
        notes: "A year the box would not accept is refused, not priced: the window is named — 1981 to 2026 — the cursor lands on the year, and the stored year stays the last one that evaluated. Nothing is appraised above a new car or below the VIN standard's edge." },
      { key: "refused-payoff", screen: "Run evaluation — a negative payoff refused", do: async (s) => { await clearToast(s); await s.type("#tYear", "2016"); await s.type("#tPayoff", "-100"); await s.click("#evalDock", { wait: 300 }); },
        expect: async (s) => /payoff cannot be negative/.test(await s.text("#toast")) ? null : "a negative payoff should be refused with the rule named",
        action: "Correct the payoff, tap Run evaluation", next: "appraisal-rerun",
        notes: "A minus sign on the payoff would add to the equity instead of taking from it, so it is refused with the rule named and nothing is written. An empty payoff box is an answer — not financed — and a typed 0 is a loan paid down to nothing." },
      { key: "appraisal-rerun", screen: "Trade ready — a fresh figure after re-running", do: async (s) => { await clearToast(s); await s.type("#tPayoff", "10750"); await s.click("#evalDock", { wait: 500 }); /* the app's own "saved" toast is the tap's echo, not this screen */ await clearToast(s); },
        expect: async (s) => (await s.text("#view h1.rp-title")).trim() === "Trade ready" ? null : "re-running should return to the reviewed result",
        action: "Tap Calculate payment", next: "desking/huddle-gate",
        notes: "Re-running prices the trade anew from the corrected inputs — 70,000 miles on the 2016 RAV4 against the same payoff — and returns to the reviewed result with the ownership review still complete. Staleness is state, not a trick of the screen." },
      /* a DIFFERENT deal, and deliberately so: the seeded trade arrives
         already appraised, so nothing above this ever shows the form before
         anybody has typed in it — which is the state two 2026-09-09 rulings
         are entirely about. Captured from a fresh visit for the second seed
         customer.

         `standalone` says that in the one place the board can act on it: the
         step above does not lead here, so no arrow is drawn into this card,
         and the sequence — with its link on to Desking — ends at the card
         above instead. It stays appended rather than inserted; moving it
         would only relocate the same false claim, since the arrow out of it
         would then say that typing in this deal's blank form produces the
         other deal's appraised RAV4, with both route hashes on show. */
      { key: "appraisal-empty", screen: "The appraisal form before anyone has typed", do: async (s) => {
          await s.reset();
          const id = await s.eval(`(() => {
            const before = new Set(Store.s.deals.map(d => d.id)); startVisit("c-demo2");
            const made = Store.s.deals.filter(d => !before.has(d.id));
            return made.length === 1 ? made[0].id : ""; })()`);
          if (!id) throw new Error("no fresh visit was created — the empty-state capture would show the seeded trade instead");
          await s.go(`#/trade/${id}`); },
        action: "Type the vehicle, the VIN, the mileage and the payoff", next: "appraisal-typed", standalone: true,
        notes: "A trade nobody has described yet, on a deal that is not the demo's: the details state, with Run evaluation as the one action and no value anywhere. Every box is empty, and the gray ghost text in them states a SHAPE (YYYY, 17 characters) or names a SOURCE (Odometer) — never an example vehicle, and never the deal's own values, which at a glance are indistinguishable from a filled box. Vehicle carries no ghost at all: its label already says year make model. Model year and Mileage used to arrive pre-filled with a hard-coded 2018 and 60,000, left over from an older demo vehicle; the year is now read back out of what the advisor types in Vehicle (year make model), the mileage can be read from nothing and so is asked for, and Run evaluation names whatever is still missing rather than appraising a car whose age or use it guessed. The context row carries no vehicle because this visit has not selected one." },
      { key: "appraisal-typed", screen: "The appraisal form filled in, not yet evaluated", do: async (s) => { await s.type("#tDesc", "2018 Honda Civic"); await s.type("#tVin", "2HGFC2F59JH000000"); await s.type("#tMiles", "61200"); await s.type("#tPayoff", "10750"); await s.click('#tCond [data-cond="Good"]', { wait: 200 }); }, action: "Tap Run evaluation", next: "appraisal-run",
        notes: "The year is read out of what was typed in Vehicle and shown in the Model year box — it is paint, not a record, until someone types a year of their own. The card title follows the description. Still no value: Run evaluation is the one action, in the card and in the dock." },
      { key: "appraisal-run", screen: "Trade value — the fresh trade evaluated", focus: "#tvValue", do: async (s) => { await s.click("#evalDock", { wait: 500 }); await clearToast(s); },
        expect: async (s) => (await s.text("#tvValue .rp-value__amount")).trim() === "$9,850" ? null : "2018 / 61,200 / Good should compute $9,850, got " + await s.text("#tvValue .rp-value__amount"),
        action: "Tap Review ownership", next: "ownership-roots",
        notes: "2018, 61,200 miles, Good: $9,850 against a $10,750 payoff — negative equity $900 — computed, never typed. The value card appears with the ownership card under it, and the dock now reads the evaluated value with Review ownership as the action." },
      { key: "seed-trade-ready", screen: "Trade ready — the seeded trade, one gap from its documents", scenario: true, do: async (s) => { await s.reset(); await s.go(`#/trade/${D}`); }, action: "Tap Calculate payment", next: "desking/huddle-gate",
        notes: "The demo as it ships: John Smith's 2016 RAV4 valued $15,500 against a $10,750 payoff — $4,750 of equity — with the ownership answered from the documents on file and exactly one item for Team Lead, the payoff statement that expired 01/01/2025." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "desking", area: "09-desking", title: "Desking — Calculate Payments",
    description: "The owner's desking package (v029, 2026-09-04) on the UI kit: eight screens, one route, all of them the kit's Task with the customer's full name in the bar and no deal number — a worked deal has none until the lending lane pushes it to F&I. Two modes, and the difference is who is holding the phone. WORK is the advisor's: the huddle that captures the trial close in the customer's own words and the payment they named, the deal-type control, the payment hero, the accordions, and a 3x3 option grid whose every cell is the real calculator. PRESENT turns the phone around: Close becomes Done, and the customer sees the car, two wins, the grid with one recommended cell, the payment to the cent, one line of fine print with a real incentive date, and one commitment action whose tap writes the structure onto the deal. New York's taxable base is stated on the screen it is taken on, and the four fees are itemised rather than bundled.",
    entry: { from: "home/deals-queue", action: "Tap the deal card (Continue)" },
    steps: [
      { key: "huddle-gate", screen: "Game plan — the huddle", do: async (s) => { await s.reset(); await s.go(`#/desk/${D}`); }, action: "Confirm how they're paying, tap Open the pencil", next: "pencil-finance",
        notes: "Advisor-only. The trial close is captured in the customer's words and the payment they named is written down. The named payment is read back on the option grid, where it picks the recommended cell; the trial close is quoted back to the advisor on the pencil, under the payment — never on the customer's screen (D-SM5 = B). No deal number: the deal is not numbered until F&I." },
      { key: "pencil-finance", screen: "Pencil — Finance", do: async (s) => { await s.click('#hPayRow [data-pay="finance"]'); await s.click("#hConfirm", { wait: 400 }); }, action: "Tap Payment options", next: "options",
        branches: [{ action: "Compare finance and lease", to: "desking/present-compare" }, { action: "Trade evaluation", to: "trade/trade-evaluation" }, { action: "Present to customer", to: "desking/present-payment" }],
        notes: "The screen opens on the payment, with the customer's own trial close quoted under it for the advisor (D-SM5 = B). The price accordion runs MSRP → your price → saving; the trade shows equity as a credit; fees and tax are five lines, with the sales-tax row naming the base it is taken on." },
      { key: "options", screen: "Payment options — the 3x3 grid", do: async (s) => { await s.click("#dkOptions", { wait: 350 }); }, action: "Tap Present to customer", next: "present-payment",
        notes: "The choice close, built before the phone turns: three terms across, three cash-down rows, one recommended cell — the option nearest the payment the customer named. Three columns, never four; four is a spreadsheet." },
      { key: "present-payment", screen: "Present — Your payment", do: async (s) => { await s.click("#dkPresent", { wait: 400 }); }, action: "Done, then Compare finance and lease", next: "present-compare",
        branches: [{ action: "This one works", to: "desking/work-chose" }],
        notes: "Present mode: Close is a dark Done (neither mode carries a role control — it appears only in Customer Onboarding). The order is deliberate — the car, two wins (price against MSRP, trade credit), the grid with the recommended cell as the anchor, then one line of fine print carrying a real incentive date. Nothing internal is on screen." },
      { key: "present-compare", screen: "Present — Own or lease", do: async (s) => { await s.click("#dkClose", { wait: 300 }); await s.click("#dkCompare", { wait: 400 }); }, action: "Customer taps Finance works", next: "work-chose",
        notes: "Two cards, the recommended one outlined. 'Included' is one row that names its own total and opens the itemization on tap — summarizing is fine, a label with no figure conceals." },
      { key: "work-chose", screen: "Back in Work — the customer chose", do: async (s) => { await s.click("#dkFinance", { wait: 450 }); }, action: "Deal type → Lease", next: "pencil-lease",
        branches: [{ action: "Submit for Team Lead approval", to: "desking/work-submitted" }],
        notes: "The customer's own tap is the trial close: the term and cash down are written to the deal and shown as a status row on the pencil — not a toast, because nothing that disappears can be the record of anything." },
      { key: "pencil-lease", screen: "Pencil — Lease", do: async (s) => { await s.click('[data-type="lease"]', { wait: 350 }); }, action: "Deal type → Cash", next: "pencil-cash",
        notes: "The hero's terms line is derived from the deal type; the residual has its own accordion, and the two lease-only fees are disclosed with the rest." },
      { key: "pencil-cash", screen: "Pencil — Cash", do: async (s) => { await s.click('[data-type="cash"]', { wait: 350 }); }, action: "Deal type → One Pay", next: "pencil-onepay",
        branches: [{ action: "Tap Present to customer", to: "desking/present-cash" }],
        notes: "The label and the unit word are derived from the deal type — 'Total due' and 'total', never a monthly framing on a cash deal. The column reconciles on the screen rather than behind accordions, and the rebate names its kind: customer cash, so it survives a cash purchase." },
      /* ---- lib/coverage: every state a person can see on this route ---- */
      { key: "pencil-onepay", screen: "Pencil — One Pay", do: async (s) => { await s.click('[data-type="onepay"]', { wait: 350 }); }, action: "Tap Present to customer", next: "present-onepay",
        notes: "The fourth deal type: one lease payment made in full at signing. The hero reads 'Total due' with the lease's term and mileage, and the residual accordion is back because the structure is a lease." },
      { key: "present-onepay", screen: "Present — Your total (One Pay)", do: async (s) => { await s.click("#dkPresent", { wait: 400 }); }, action: "Done, Deal type → Lease, Present", next: "present-lease",
        notes: "Present mode on a one-pay lease: no grid, because there is nothing to choose between — the car, the price win, the one total, and the fine print without an APR." },
      { key: "present-lease", screen: "Present — Your payment (Lease)", do: async (s) => { await s.click("#dkClose", { wait: 300 }); await s.click('[data-type="lease"]', { wait: 350 }); await s.click("#dkPresent", { wait: 400 }); }, action: "Done, Deal type → Cash, Present", next: "present-cash",
        notes: "A lease presents one payment with its due-at-signing and mileage, never the finance grid. The fine print says 'with approved credit' and no rate — a lease is quoted on a money factor." },
      { key: "present-cash", screen: "Present — Your total (Cash)", do: async (s) => { await s.click("#dkClose", { wait: 300 }); await s.click('[data-type="cash"]', { wait: 350 }); await s.click("#dkPresent", { wait: 400 }); }, action: "Customer taps This one works", next: "work-chose-cash",
        notes: "A cash purchase has no fine print at all — there is no credit approval and no rate to disclose — so the customer sees the car, the price against MSRP, the trade credit, and the total." },
      { key: "work-chose-cash", screen: "Back in Work — the customer chose the cash total", do: async (s) => { await s.click("#dkTake", { wait: 450 }); }, action: "Tap Submit for Team Lead approval", next: "work-submitted",
        notes: "The status row names the total the customer agreed to, in the cash unit. The hero loses its Present button once a choice is recorded; the dock moves on to the Team Lead." },
      { key: "work-submitted", screen: "Pencil — sent for approval", do: async (s) => { await s.click("#dkSubmit", { wait: 450 }); }, action: "The Team Lead approves (Active floor → Needs you → Review → Approve); then Continue — base payment agreement", next: "agreement/agreement-unsigned",
        notes: "A second status row records who the deal went to and when, and that the agreement opens when Jordan approves; the dock waits, its primary disabled on the kit's gate dock, and Present again stays (W-004, the owner's \"Build it as drawn\", 2026-09-23). No toast: the request is a row on the screen, not a pill that fades." },
      { key: "present-cell-picked", screen: "Present — the customer taps a different cell", scenario: true, do: async (s) => { await s.reset(); await ev(s, `Store.deal("${D}").huddle.done = true;`); await s.go(`#/desk/${D}`); await s.click("#dkPresent", { wait: 400 }); await s.click('[data-cell="5000-72"]', { wait: 350 }); }, action: "This one works", next: "work-chose-other",
        notes: "The recommended cell keeps its tag; the cell the customer tapped is outlined as the one they are looking at. Both are on screen so the customer can compare their pick with the anchor." },
      { key: "work-chose-other", screen: "Back in Work — the customer's own cell", do: async (s) => { await s.click("#dkTake", { wait: 450 }); }, action: "Tap Payment options", next: "options-after-choice",
        notes: "The choice row and the hero both carry the cell the customer picked — 72 months at $5,000 down — not the recommended one. The customer's tap wrote the structure onto the deal." },
      { key: "options-after-choice", screen: "Payment options — after the choice", do: async (s) => { await s.click("#dkOptions", { wait: 350 }); }, action: "Close returns to the pencil", next: "desking/work-chose-other",
        notes: "The grid does not move with the choice: the recommended cell is still the one nearest the payment the customer named in the huddle, so the anchor stays honest even after they picked something else." },
      { key: "pencil-trade-negative", screen: "Pencil — trade with negative equity", scenario: true, do: async (s) => { await s.reset(); await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; d.trade.payoff = 18500;`); await s.go(`#/desk/${D}`); await s.click('[data-acc="price"]', { wait: 250 }); await s.click('[data-acc="trade"]', { wait: 350 }); }, focus: '[data-acc="trade"]', action: "Tap Present to customer", next: "present-trade-negative",
        notes: "The customer owes more than the trade is worth: the accordion summary reads as a minus, the row is labeled 'Negative equity', and it is never colored as a saving. The link to the trade evaluation stays in the accordion." },
      { key: "present-trade-negative", screen: "Present — no trade win when equity is negative", do: async (s) => { await s.click("#dkPresent", { wait: 400 }); }, action: "Done", next: "desking/pencil-trade-negative",
        notes: "Only one win card: the price against MSRP. Negative equity is never dressed as a win, so the trade card is simply absent and the number stays in the payment detail." },
      { key: "pencil-feetax", screen: "Pencil — Fees & tax open", scenario: true, do: async (s) => { await s.reset(); await ev(s, `Store.deal("${D}").huddle.done = true;`); await s.go(`#/desk/${D}`); await s.click('[data-acc="price"]', { wait: 250 }); await s.click('[data-acc="feetax"]', { wait: 350 }); }, focus: '[data-acc="feetax"]', action: "Open Rebates and Accessories", next: "pencil-rebates-accessories",
        notes: "Four fee lines itemised, never a bundled total, and the sales-tax row names the New York base it is taken on — a tax figure with no stated base cannot be checked." },
      { key: "pencil-rebates-accessories", screen: "Pencil — Rebates and Accessories open", do: async (s) => { await s.click('[data-acc="feetax"]', { wait: 250 }); await s.click('[data-acc="rebates"]', { wait: 250 }); await s.click('[data-acc="accessories"]', { wait: 350 }); }, focus: '[data-acc="rebates"]', action: "Tap Edit on Accessories", next: "accessories-sheet",
        notes: "The rebate names its kind — customer cash — with a source note saying it applies to any deal type. Accessories list what is on the car with an Edit row; both accordions carry their own Edit." },
      { key: "accessories-sheet", screen: "Accessories (sheet)", do: async (s) => { await s.click('[data-sheet-open="accessories"]', { wait: 400 }); }, action: "Done; open the option grid, tap Change terms", next: "terms-sheet-finance",
        notes: "Every catalog accessory with its price, the ones on the deal checked. A tap toggles it and the pencil under the sheet recalculates at once." },
      { key: "terms-sheet-finance", screen: "Change terms (sheet) — finance", do: async (s) => { await s.click("#dkSheet [data-sheet-close]", { wait: 300 }); await s.click("#dkOptions", { wait: 350 }); await s.click("#dkTerms", { wait: 400 }); }, action: "Save terms; Deal type → Lease, Rebates → Edit", next: "terms-sheet-lease",
        notes: "What the advisor actually adjusts on a finance pencil: the grid's three terms, the APR, cash down and the rebate. Work mode only — never drawn while the phone faces the customer." },
      { key: "terms-sheet-lease", screen: "Change terms (sheet) — lease", do: async (s) => { await s.click("#dkSheet [data-sheet-close]", { wait: 300 }); await s.click("#dkClose", { wait: 350 }); await s.click('[data-type="lease"]', { wait: 350 }); await setAcc(s, { price: false, rebates: true }); await s.click('[data-sheet-open="terms"]', { wait: 400 }); }, action: "Save terms; open Residual and Fees & tax", next: "pencil-lease-fees",
        notes: "A lease has no option grid, so its terms are reached from the Rebates accordion's Edit, or from Fees & tax's \"Change how the tax is paid · Edit\": lease term, miles per year, New York tax (At signing, as a new lease opens, or In the lease), due at signing and the rebate." },
      { key: "pencil-lease-fees", screen: "Pencil — Lease with Residual and Fees & tax open", do: async (s) => { await s.click("#dkSheet [data-sheet-close]", { wait: 300 }); await setAcc(s, { rebates: false, accessories: false, residual: true, feetax: true }); }, focus: '[data-acc="feetax"]', action: "Compare finance and lease, tap Included", next: "compare-itemize",
        notes: "The residual as a dollar figure and a percent of MSRP, then the two lease-only fees: acquisition, and the disposition fee marked as charged at lease end so nobody reads it into the payment. New York's tax is named at signing, on the payments, the money down and the rebate, never the trade, and \"Change how the tax is paid · Edit\" opens Change terms, where it can go into the lease instead." },
      { key: "compare-itemize", screen: "What is included (sheet)", do: async (s) => { await s.click('[data-type="finance"]', { wait: 350 }); await s.click("#dkCompare", { wait: 400 }); await s.click("#dkItemize", { wait: 400 }); }, action: "Done", next: "desking/present-compare",
        notes: "The 'Included' row on the comparison opens its own itemization: the accessories, the four fees and the tax with its base. A summary is fine; a label with no figure behind it is not." },
      { key: "huddle-lease-track", screen: "Game plan — Lease chosen", scenario: true, do: async (s) => { await s.reset(); await s.go(`#/desk/${D}`); await s.click('#hPayRow [data-pay="lease"]', { wait: 350 }); }, action: "Open the pencil", next: "desking/pencil-lease",
        notes: "Choosing how they are paying changes the discovery question under it — for a lease, whether they trade often and drive few miles. The deal type on the pencil follows this choice." },
      { key: "huddle-no-trade", screen: "Game plan — no trade on the deal", scenario: true, do: async (s) => { await s.reset(); await ev(s, `const d = Store.deal("${D}"); d.trade.has = false; d.trade.value = 0; d.trade.payoff = 0;`); await s.go(`#/desk/${D}`); }, focus: "#hTrade", action: "Open the pencil", next: "desking/pencil-finance",
        notes: "Without an evaluated trade the toggle reads 'Trade evaluation needed' and sits off. The pencil that follows has no Trade accordion and the presentation has no trade win." },
      { key: "desk-no-vehicle", screen: "Blocked — no vehicle on the deal", scenario: true, do: async (s) => { await s.reset(); await s.go("#/deals"); await ev(s, `const d = Store.deal("${D}"); d.stock = null; d.vehicle = null;`); await s.hash(`#/desk/${D}`); await wait(300); }, action: "Lands on its own vehicle search — no tap", next: "vehicles/inventory",
        notes: "Desking needs a car to price. Opening the pencil on a deal with none says 'Pick a vehicle first' and lands on vehicle selection for that deal instead of drawing an empty pencil." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "agreement", area: "10-base-payment-agreement", title: "Base Payment Agreement",
    description: "The signed acknowledgement of the base terms, rebuilt on the owner's base-payment golden (2026-08-27): the payment summary card with its status pill, the two party surfaces, the flat term rows, the acknowledgement readable on the page, and the sign panel. Redesk never voids on the first tap — signed or not, it confirms in a bottom sheet.",
    entry: { from: "desking/work-chose", action: "Tap Submit for Team Lead approval; the Team Lead approves; then Continue" },
    steps: [
      /* the pencil's forward action is the customer's choice, then the Team
         Lead request, then Continue, the way the advisor gets here since the
         owner's package v029; since W-004 (2026-09-23) Continue waits for the
         Team Lead's approval, given here from the Active floor's Review */
      { key: "agreement-unsigned", screen: "Agreement — ready to sign", do: async (s) => { await s.reset(); await ev(s, `Store.deal("${D}").huddle.done = true;`); await s.go(`#/desk/${D}`); await s.click("#dkPresent", { wait: 400 }); await s.click("#dkTake", { wait: 400 }); await s.click("#dkSubmit", { wait: 400 }); await switchRole(s, "teamlead", "#/deals"); await s.click("#dqNeeds [data-review]", { wait: 900 }); await s.click("#dkApprove", { wait: 600 }); await switchRole(s, "advisor", `#/desk/${D}`); await s.click("#dkContinue", { wait: 600 }); }, action: "Type the name, tap Sign agreement", next: "agreement-signed",
        notes: "The base payment is the dominant value with 'Ready to sign' opposite it; the dock carries the figure and the one action. The unit word is derived from the deal type — a cash deal reads 'total', never '/mo'." },
      { key: "agreement-signed", screen: "Agreement — signed", do: async (s) => { await s.click("#bpDockGo", { wait: 500 }); }, action: "Tap Redesk payment", next: "redesk-confirm",
        branches: [{ action: "Continue (credit application)", to: "credit/identity-gate" }, { action: "Print for deal folder", to: "print-center/print-preview" }],
        notes: "Who signed, when, and the signature stay on the page, and Print and Redesk become contextual rows beneath it. The figures above them are still recalculated live — an open item in the spec, with the owner. The dock flips to 'Next step · Credit application unlocked'; on a cash deal that step refuses the deal and sends it back to the pencil (reported)." },
      { key: "redesk-confirm", screen: "Void signature and redesk? (sheet)", do: async (s) => { await clearToast(s); await s.click("#bpRedeskRow", { wait: 400 }); }, action: "Tap Void & redesk", next: "redesk-voided",
        branches: [{ action: "Cancel keeps the signature", to: "agreement/agreement-signed" }],
        notes: "Destructive behavior behind a confirmation sheet that states exactly what voiding means, with the payment restated. Cancel preserves the signed state — the golden's own rule, and a real fix: the previous unsigned Redesk cleared the agreement silently." },
      /* ---- lib/coverage: every state a person can see on this route ---- */
      { key: "redesk-voided", screen: "Voided — back on the pencil", do: async (s) => { await s.click("#bpRedeskGo", { wait: 600 }); }, action: "Continue — base payment agreement", next: "agreement/agreement-unsigned",
        notes: "Void & redesk clears the agreement, puts the deal back in Desking and opens the pencil. The customer's earlier choice and the approval request are still rows on the pencil, so the advisor can see what was agreed before the numbers move." },
      { key: "agreement-typed-name", screen: "Sign panel — the typed name paints the signature", scenario: true, do: async (s) => { await s.reset(); await ev(s, APPROVED); await s.go(`#/agreement/${D}`); await s.type("#bpSig", "John Smith"); }, focus: ".bp-signpanel", action: "Clear the name, tap Sign agreement", next: "agreement-empty-name",
        notes: "The customer types their name and the script preview under the field follows every keystroke. The typed name is what gets recorded as the acknowledgement signature." },
      { key: "agreement-empty-name", screen: "Refused — no name to sign with", do: async (s) => { await s.type("#bpSig", "  "); await s.click("#bpDockGo", { wait: 300 }); }, focus: ".bp-signpanel", action: "Tap Redesk payment", next: "redesk-unsigned-sheet",
        notes: "Sign agreement with a blank name records nothing and says why. The field takes focus so the next tap is in the right place." },
      { key: "redesk-unsigned-sheet", screen: "Return to desking? (sheet)", do: async (s) => { await clearToast(s); await s.click("#bpRedesk", { wait: 400 }); }, action: "Redesk payment", next: "desking/pencil-finance",
        branches: [{ action: "Cancel", to: "agreement/agreement-unsigned" }],
        notes: "Even unsigned, Redesk confirms first. The sheet's wording is the unsigned one — there is no signature to void — and the payment is restated so the advisor knows which structure they are leaving." },
      { key: "agreement-lease", screen: "Agreement — Lease", scenario: true, do: async (s) => { await s.reset(); await ev(s, `Store.deal("${D}").dealType = "lease";` + APPROVED); await s.go(`#/agreement/${D}`); }, action: "Sign agreement", next: "agreement/agreement-signed",
        notes: "The summary keeps 'Base monthly payment' but its meta reads term, miles and Lease; the term rows swap Term / APR for Term / Miles, add the residual and due at signing." },
      { key: "agreement-cash", screen: "Agreement — Cash", scenario: true, do: async (s) => { await s.reset(); await ev(s, `Store.deal("${D}").dealType = "cash";` + APPROVED); await s.go(`#/agreement/${D}`); }, action: "Sign agreement", next: "agreement/agreement-signed",
        notes: "'Estimated total due' with the unit word 'total' in the dock — never '/mo' on a cash deal. No finance-term rows leak in: no APR, no down payment, no amount financed." },
      { key: "agreement-onepay", screen: "Agreement — One Pay", scenario: true, do: async (s) => { await s.reset(); await ev(s, `Store.deal("${D}").dealType = "onepay";` + APPROVED); await s.go(`#/agreement/${D}`); }, action: "Sign agreement", next: "agreement/agreement-signed",
        notes: "'Due at signing — One Pay': one lease total paid up front, so the dock unit is 'total' and the closing row is the one-pay amount rather than a run of monthly payments." },
      { key: "agreement-printable", screen: "Printable — Base Payment Agreement", scenario: true, do: async (s) => { await s.reset(); await ev(s, APPROVED); await s.go(`#/agreement/${D}`); await s.type("#bpSig", "John Smith"); await s.click("#bpDockGo", { wait: 500 }); await clearToast(s); await s.hash(`#/print/${D}/agreement`); await wait(400); }, action: "Back", next: "agreement/agreement-signed",
        notes: "Print for deal folder opens the paper version of what was signed. The payment, the taxes and fees and the amount financed come from the snapshot frozen at signing; five lines — MSRP, selling price, rebates, trade value and payoff, and the down payment — are still read live from the deal, and a deal with no snapshot falls back to a live calculation (reported)." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "credit", area: "11-credit-application", title: "Credit Application (Lending Lane)",
    description: "The lender application rebuilt to the owner's credit goldens (2026-08-28). Identity verification is a pre-application gate; the application itself is four steps — Applicant, Residence, Employment, Review — instead of one 3,200px form. Validation lives in the wizard's own working copy, so a step that is not on screen still validates: an invalid submit shows an inline summary, marks the fields, and returns to the first invalid step with nothing saved. The SSN accepts only 000-00-0000.",
    entry: { from: "agreement/agreement-signed", action: "Tap Continue" },
    steps: [
      { key: "identity-gate", screen: "Verify your identity (pre-application gate)", do: async (s) => { await s.reset({ approved: false }); await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; d.basePayment = { signedAt: new Date().toISOString(), sigName: "John Smith", snapshot: RIDE_PRICE_CALC.calc(d, Store.vehicle(d.stock)) }; d.stage = "credit";`); await s.go(`#/credit/${D}`); },
        action: "Take the identity photo", next: "identity-verified",
        branches: [{ action: "Send secure link to phone", to: "onboarding/send-link-sheet" }],
        notes: "Before the application begins: what is already on file (license, phone, email) and one dominant Take photo action, which opens the phone's own camera. The demo states plainly that the photo is confirmed on the device and discarded, and that no real biometric match occurs." },
      { key: "identity-verified", screen: "Identity verified", do: async (s, ctx) => { await s.upload("[data-idcap]", [ctx.photos[0]], { wait: 600 }); }, action: "Tap Continue", next: "applicant-step",
        notes: "The checklist states what actually happened — a photo was captured — and never claims a face was matched. The verification is recorded once on the deal and never re-gates." },
      { key: "applicant-step", screen: "Step 1 — Application type & applicant", do: async (s) => { await s.click("#caIdGo", { wait: 500 }); }, action: "Choose Joint application", next: "joint-remote",
        notes: "Application type leads as two large choice rows, then the applicant fields — prefilled from the record, so only what is missing needs typing. The four-step progress bar and the dock's 'Next: Residence' say where this sits." },
      { key: "joint-remote", screen: "Joint — co-buyer needed", do: async (s) => { await s.click('[data-atype="joint"]', { wait: 300 }); }, action: "Tap Send co-buyer link", next: "send-cobuyer-link",
        branches: [{ action: "Scan co-buyer license", to: "license-scan/scan-front" }, { action: "Choose existing customer", to: "buyers/buyers-sheet" }],
        notes: "Regulation B joint-credit certification stays in the choice copy. The secure link LEADS the co-buyer paths (owner v2 hierarchy) with scan and choose-existing as the secondary row — the co-buyer does not have to be in the showroom." },
      { key: "send-cobuyer-link", screen: "Send co-buyer link (sheet)", do: async (s) => { await s.click('[data-sheet-open="link-cobuyer"]', { wait: 400 }); }, action: "Tap Send secure link", next: "link-sent-status",
        notes: "Recipient, both channels, and what happens next: the co-buyer verifies identity first, then completes only their own fields. The demo says plainly that nothing is really sent." },
      { key: "link-sent-status", screen: "Link sent — persistent status", do: async (s) => { await s.type("#caLinkTo", "(347) 555-1212"); await s.click("#caLinkSend", { wait: 500 }); }, action: "Done, then walk to Review", next: "validation-errors",
        notes: "After sending, the sheet BECOMES a status view rather than vanishing into a toast: link sent, then opened / identity verified / application submitted, which stay honestly Waiting because no link really went out." },
      { key: "validation-errors", screen: "Invalid submit — inline summary", do: async (s) => {
          await s.click("[data-sheet-close]", { wait: 300 });
          await s.click('[data-atype="individual"]', { wait: 300 });
          for (let i = 0; i < 4; i++) await s.click("#caGo", { wait: 350 }); },
        action: "Fix the fields, submit", next: "individual-applicant",
        notes: "Submit with fields missing stays on Review: the summary counts the misses (\"Five missing · zero invalid\") and says nothing has been saved or sent, inline, never a toast over the controls; John's panel lists each missing field, and Fix John's items is its one action." },
      { key: "deal-summary-sheet", screen: "Deal summary (contextual sheet)", do: async (s) => { await s.click('[data-sheet-open="summary"]', { wait: 400 }); }, action: "Close", next: "individual-applicant",
        notes: "'Synced from your worksheet' became Deal summary with a subordinate 'Updated from worksheet · time' line (owner v2, Option A). It opens from a header chip so the numbers can be inspected without losing the form position, and appears inline only from Residence onward." },

      /* ---- the individual path, every step, ending in a REAL submission
         (harness/creditapp.mjs, the happy path) ---- */
      { key: "individual-applicant", screen: "Step 1 — Individual application, the record row open", standalone: true, focus: "[data-record]", do: async (s) => {
          await s.reset({ approved: false });
          await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; d.basePayment = { signedAt: new Date().toISOString(), sigName: "John Smith", snapshot: RIDE_PRICE_CALC.calc(d, Store.vehicle(d.stock)) }; d.stage = "credit"; d.identity = { customerId: d.customerId, verifiedAt: new Date().toISOString() }; /* the license was scanned two flows ago (03): the record carries what it read */ const cu = Store.customer(d.customerId); cu.middle = "A"; cu.dob = "1987-03-14"; cu.license = { number: "T-0000101", state: "NY", expires: "2029-03-14" };`);
          await s.go(`#/credit/${D}`);
          await s.click('[data-atype="individual"]', { wait: 300 });
          await s.click("[data-record]", { wait: 300 });
          await s.type("#ca_ssn", "000000000"); },
        action: "Tap Next: Residence", next: "residence-step",
        notes: "Identity is already verified, so the wizard opens straight away. The SSN is the only field to type — it masks itself to 000-00-0000 — and the name, date of birth and license sit in a read-only row that opens on a tap, showing the full legal name as the license reads it." },
      { key: "residence-step", screen: "Step 2 — Residence", focus: "#ca_housePmt", do: async (s) => { await s.click("#caGo", { wait: 400 }); await s.type("#ca_housePmt", "1800"); },
        action: "Tap Next: Employment", next: "employment-step",
        notes: "The address comes from the record; the advisor adds only the housing payment. The Deal summary chip is available from here on." },
      { key: "employment-step", screen: "Step 3 — Employment", do: async (s) => { await s.click("#caGo", { wait: 400 }); await s.type("#ca_employer", "Ride Price"); await s.type("#ca_occupation", "Project manager"); await s.type("#ca_income", "6500"); },
        action: "Tap Next: Review", next: "review-step",
        notes: "Employer, occupation and monthly income — the three things a lender asks that no record already holds." },
      { key: "review-step", screen: "Step 4 — Review, signature needed", do: async (s) => { await s.click("#caGo", { wait: 450 }); },
        action: "Accept the electronic signature, then Review & submit", next: "lender-answer",
        notes: "With every field filled the panel reads Signature needed: the electronic signature and credit authorization is its own consent row, never counted among the fields. Submit stays inert until it is accepted." },
      { key: "lender-answer", screen: "Approved — the lender's answer to a real submission", do: async (s) => { await s.click('[data-flag="consent"]', { wait: 300 }); await s.click("#caGo", { wait: 700 }); },
        action: "Tap Re-present the new payment", next: "desking/present-mode",
        notes: "The real path ends here: the seeded lender approves at 3.9% against the agreed 3.5%, so the screen states the difference in the customer's unit — the payment — and the forward action is to re-present, never to continue silently." },
      { key: "approved-agreed-rate", screen: "Approved at the agreed rate", standalone: true, do: async (s) => {
          await s.reset({ approved: false });
          await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; d.identity = { customerId: d.customerId, verifiedAt: new Date().toISOString() }; d.creditApp = { approved: true, status: "approved", customerId: d.customerId, coBuyerId: null, submitted: new Date().toISOString(), lender: "Ride Price Financial", agreedApr: 3.5, approvedApr: 3.5, employer: "Ride Price", form: { consent: { electronicSignature: true, acceptedAt: new Date().toISOString() } } }; d.stage = "menu";`);
          await s.go(`#/credit/${D}`); },
        action: "Tap Manager sign-off", next: "finance-menu/signoff-gate-advisor",
        notes: "The other outcome the app renders: the lender matched the agreed rate, so there is one payment, the agreed one, with the amount financed, and Manager sign-off is the one forward action. The app has no declined or conditional screen — every submission in the demo is approved." },

      /* ---- the joint application with a co-buyer attached: the three
         states of the Review step (creditapp.mjs, §19) ---- */
      { key: "joint-cobuyer-attached", screen: "Step 1 — Joint, co-buyer attached and waiting on Cheri's link", standalone: true, do: async (s) => {
          await s.reset({ approved: false });
          await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; d.stage = "credit"; d.identity = { customerId: d.customerId, verifiedAt: new Date().toISOString() }; d.coBuyerId = "c-demo2"; d.creditRemote = { cobuyer: { customerId: d.coBuyerId, primaryCustomerId: d.customerId, channel: "text", to: "(347) 555-1212", sentAt: new Date().toISOString() } };`);
          await s.go(`#/credit/${D}`);
          await s.click('[data-atype="joint"]', { wait: 300 }); },
        action: "Walk to Review", next: "joint-gaps",
        notes: "Once Cheri is on the deal the co-buyer paths give way to Cheri's own panel: Cheri's identity, fields and joint authorization, each with a status, plus Resend and Cheri is in the showroom as the escape hatches." },
      { key: "joint-gaps", screen: "Review — gaps on both sides, Cheri's blocked", do: async (s) => { for (let i = 0; i < 3; i++) await s.click("#caGo", { wait: 400 }); },
        action: "Tap Fix John's items", next: "joint-mark-ready",
        notes: "One panel per applicant. Only the advisor's own work is a primary — Fix John's items — and the dock never offers submission while either half is open; the note says why." },
      { key: "joint-mark-ready", screen: "Review — John's half done, waiting on Cheri", do: async (s) => {
          await s.click('[data-appl-cta="fix"]', { wait: 400 }); await s.type("#ca_ssn", "000000000");
          await s.click("#caGo", { wait: 400 }); await s.type("#ca_housePmt", "1800");
          await s.click("#caGo", { wait: 400 }); await s.type("#ca_employer", "Ride Price"); await s.type("#ca_occupation", "Project manager"); await s.type("#ca_income", "6500");
          await s.click("#caGo", { wait: 450 }); await s.click('[data-flag="consent"]', { wait: 300 }); },
        action: "Tap Mark John ready · waiting on Cheri", next: "joint-both-complete",
        notes: "John's panel reads Complete; the primary is internal completion, not submission, and the advisor can park the deal instead of sitting on the screen. Regulation B is named as the rule that is waiting." },
      { key: "joint-both-complete", screen: "Review — both complete, ready for lenders", do: async (s) => { await s.click("#caMarkReady", { wait: 400 }); await s.go("#/demo/cobuyer-ready"); },
        action: "Tap Review & submit to lenders", next: "lender-answer",
        branches: [{ action: "View Cheri's answers", to: "answers-sheet" }],
        notes: "Cheri's link is played out by the demo route (#/demo/cobuyer-ready) — the app has no co-buyer phone screen. Both panels read Complete, the three Regulation B conditions are stated as data rows, and only now does the primary elevate to lenders." },
      { key: "answers-sheet", screen: "Cheri's answers (sheet)", do: async (s) => { await s.click('[data-appl-cta="answers-co"]', { wait: 400 }); },
        action: "Close", next: "joint-both-complete",
        notes: "A complete panel offers View Cheri's answers: what Cheri submitted from Cheri's own phone, read-only." },
      { key: "joint-no-cobuyer", screen: "Joint submit with nobody attached", standalone: true, do: async (s) => {
          await s.reset({ approved: false });
          await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; d.stage = "credit"; d.identity = { customerId: d.customerId, verifiedAt: new Date().toISOString() };`);
          await s.go(`#/credit/${D}`);
          await s.click('[data-atype="joint"]', { wait: 300 }); await s.type("#ca_ssn", "000000000");
          await s.click("#caGo", { wait: 400 }); await s.type("#ca_housePmt", "1800");
          await s.click("#caGo", { wait: 400 }); await s.type("#ca_employer", "Ride Price"); await s.type("#ca_occupation", "Project manager"); await s.type("#ca_income", "6500");
          await s.click("#caGo", { wait: 450 }); await s.click('[data-flag="consent"]', { wait: 300 }); await s.click("#caGo", { wait: 450 }); },
        action: "Attach the co-buyer, or switch to Individual", next: "joint-remote",
        notes: "A joint application chosen but no co-buyer on the deal: the condition is stated on the screen, with what to do about it, and nothing has been saved or sent." },
      { key: "identity-link-sheet", screen: "Send a secure link to the applicant (sheet)", standalone: true, do: async (s) => {
          await s.reset({ approved: false });
          await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; d.stage = "credit";`);
          await s.go(`#/credit/${D}`);
          await s.click('[data-sheet-open="link-applicant"]', { wait: 400 }); },
        action: "Tap Send", next: "identity-gate",
        notes: "The gate's second path: the customer verifies identity from their own phone. One channel on a segment, one destination field." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "buyers", area: "12-buyers-and-co-buyer", title: "Buyers on the Deal (Co-Buyer)",
    description: "The owner's Buyers on Deal V2 (2026-08-29): one bottom sheet from the Buyer chip — the primary buyer, an optional co-buyer, and one Add co-buyer action that opens the canonical Customer Resolver (search, scan, secure upload; manual creation only after a true no-match). Management is contextual and confirmed: removal keeps the customer profile, and Change roles is Team Lead-only, visible only with two buyers — an Advisor never sees a role control.",
    entry: { from: "credit/joint-remote", action: "Tap the Buyers row" },
    steps: [
      { key: "buyers-sheet", screen: "Buyers on this deal", do: async (s) => { await s.reset(); await s.go(`#/desk/${D}`); await s.click('[data-sheet-open="buyers"]'); }, action: "Tap Add co-buyer", next: "add-cobuyer",
        branches: [{ action: "Tap the primary buyer's row", to: "credit/identity-gate" }] },
      { key: "add-cobuyer", screen: "Add co-buyer — the resolver's entries", do: async (s) => { await s.click("#byAdd"); await s.type("#byQ", "Bridwell"); }, action: "Tap the CRM match", next: "cobuyer-added",
        branches: [{ action: "Scan physical license", to: "license-scan/scan-front" }, { action: "Send secure upload link", to: "onboarding/send-link-sheet" }],
        notes: "Search dedupes at the source — people already on the deal never appear; manual creation is offered only after a true no-match." },
      { key: "cobuyer-added", screen: "Co-buyer attached", do: async (s) => { await s.click("[data-pick]"); await ev(s, `const t = document.querySelector("#toast"); if (t) t.remove();`); }, action: "Tap the co-buyer's row", next: "cobuyer-actions",
        notes: "The second row appearing is the feedback; Add co-buyer disappears. An Advisor still sees no role control." },
      { key: "cobuyer-actions", screen: "Co-buyer — contextual actions", do: async (s) => { await s.click("#byCo"); }, action: "Tap Remove from deal", next: "remove-confirm" },
      { key: "remove-confirm", screen: "Remove — second tap confirms", do: async (s) => { await s.click("#byRemove"); }, action: "Tap Remove from deal", next: "removed-state",
        notes: "The clean case: no credit activity, so three data rows and no consequence list — the relationship comes off, Cheri's profile is kept, and an Advisor may do it." },
      { key: "removed-state", screen: "After removal — Cheri's Removed row and the audit line", do: async (s) => { await s.click('[data-by="go"]', { wait: 500 }); },
        action: "Tap Add a different co-buyer", next: "add-cobuyer",
        notes: "Removal returns to a state, not the beginning: Cheri's row stays under Removed from this deal with the time and who did it, the customer record is never deleted, and the action beside it is unambiguous." },
      { key: "team-lead-roles", screen: "Team Lead — Change roles visible", do: async (s) => {
          await s.reset(); await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; d.coBuyerId = "c-demo2"; Store.s.role = "teamlead";`);
          await s.go(`#/desk/${D}`); await s.click('[data-sheet-open="buyers"]');
        }, action: "Tap Change roles", next: "change-roles-confirm",
        notes: "The link exists only for a Team Lead and only with two buyers — never a control that ends in a permission toast." },
      { key: "change-roles-confirm", screen: "Change buyer roles? — confirmation", do: async (s) => { await s.click("#byRoles"); }, action: null, next: null,
        notes: "Confirms before swapping customerId/coBuyerId (the fields the roles live in); a signed benefits acknowledgement is voided and the sheet says so first." },

      /* ---- the resolver mission: a true no-match creates the co-buyer in the
         canonical resolver and comes back with the sheet reopened (BY-009) ---- */
      { key: "add-no-match", screen: "Add co-buyer — a true no-match offers create", standalone: true, do: async (s) => {
          await s.reset(); await s.go(`#/desk/${D}`); await s.click('[data-sheet-open="buyers"]'); await s.click("#byAdd"); await s.type("#byQ", "Nobody Here", { wait: 400 }); },
        action: "Tap Create a new customer", next: "create-manual",
        notes: "Create a new customer appears only when nobody in the CRM matches — never beside a list of matches. Scan and secure upload stay available beneath it." },
      { key: "create-manual", screen: "Customer Resolver — manual entry, on the co-buyer mission", do: async (s) => { await s.click("#byCreate", { wait: 700 }); },
        action: "Fill the four fields, tap Save", next: "created-receipt",
        notes: "Create hands off to the one Customer Resolver at its manual entry rather than a second form. The mission rides on the session, so a reload still knows this person is being attached, not started as a visit." },
      { key: "created-receipt", screen: "Back on the deal — the new co-buyer attached, the sheet reopened", do: async (s) => {
          await s.type("#obName", "Dana Whitfield"); await s.type("#obPhone", "(212) 555-0199"); await s.type("#obEmail", "dwhitfield@testing.com"); await s.type("#obAddr", "12 Oak St, Brooklyn, NY 11201");
          await s.click("#obManualSave", { wait: 900 }); await clearToast(s); },
        action: "Close", next: null,
        notes: "Saving returns to the screen the advisor left, starts no new visit, and reopens the buyers sheet with the new person in the Co-buyer row as the receipt." },

      /* ---- after the lending lane: authority follows consequence (BY-010, BY-011) ---- */
      { key: "lane-cobuyer-actions", screen: "After the lane — Cheri's sheet names Cheri's state", standalone: true, do: async (s) => {
          await s.reset({ approved: false });
          await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; Store.s.role = "advisor"; d.coBuyerId = "c-demo2";
            d.identity = { verifiedAt: new Date().toISOString() }; d.coIdentity = { verifiedAt: new Date().toISOString() };
            d.creditApp = { submitted: new Date().toISOString(), approved: true, status: "approved", lender: "Ride Price Financial", approvedApr: 3.9, agreedApr: 3.5, form: { joint: true } };
            d.menu.ackSigned = true; d.menu.ackName = "John Smith";
            jacketReceive(d, "idverify-cobuyer", "app"); jacketReceive(d, "creditapp", "app"); jacketReceive(d, "approval", "app");`);
          await s.go(`#/desk/${D}`); await s.click('[data-sheet-open="buyers"]'); await s.click("#byCo"); },
        action: "Tap Remove from deal", next: "lane-remove-ask",
        notes: "The deal has been through the lending lane: a submitted joint application, both identities filed, the acknowledgment signed. Cheri's sheet says so before any action is offered." },
      { key: "lane-remove-ask", screen: "Advisor — every consequence listed, Ask a Team Lead", do: async (s) => { await s.click("#byRemove"); },
        action: "Tap Ask a Team Lead", next: "lane-request-pending",
        notes: "Once credit exists, 'kept' alone is a half-truth: the withdrawn application, the void authorization and acknowledgment, and the credit pull that stays on Cheri's file are all listed, each reassuring row with its limit. The destructive button is absent for an Advisor — the primary is to ask." },
      { key: "lane-request-pending", screen: "Removal requested — pending with a Team Lead", do: async (s) => { await s.click('[data-by="go"]', { wait: 500 }); },
        action: "Hand the phone to a Team Lead", next: "lane-teamlead-sheet",
        notes: "The ask is recorded on the deal and nothing is removed. Cheri's sheet now carries the pending request, who made it and when — it is the Team Lead's to approve." },
      { key: "lane-teamlead-sheet", screen: "Team Lead — the removal sheet, stamped with who asked", standalone: true, do: async (s) => {
          await ev(s, `Store.s.role = "teamlead";`); await s.go(`#/desk/${D}`); await s.click('[data-sheet-open="buyers"]'); await s.click("#byCo"); await s.click("#byRemove"); },
        action: "Tap Remove from deal", next: "lane-withdrawn-state",
        notes: "The same consequences, now with the destructive action and a Team Lead action line that records who requested it and when. Cancel stays in the Team Lead's own view." },
      { key: "lane-withdrawn-state", screen: "After removal — Cheri's Removed row and the withdrawn audit line", do: async (s) => { await s.click('[data-by="go"]', { wait: 500 }); },
        action: "Tap Add a different co-buyer", next: "add-cobuyer",
        notes: "Removal returns to a state, not the beginning: Cheri's row stays with Removed, the time, the Team Lead's name and what was withdrawn. The jacket count does not fall — the documents are marked withdrawn, and reattaching Cheri starts a new application rather than reopening this one." },
      { key: "lane-roles-confirm", screen: "Change roles after the lane — the lender line", standalone: true, do: async (s) => {
          await s.reset({ approved: false });
          await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; Store.s.role = "teamlead"; d.coBuyerId = "c-demo2";
            d.identity = { verifiedAt: new Date().toISOString() }; d.coIdentity = { verifiedAt: new Date().toISOString() };
            d.creditApp = { submitted: new Date().toISOString(), approved: true, status: "approved", lender: "Ride Price Financial", approvedApr: 3.9, agreedApr: 3.5, form: { joint: true } };
            d.menu.ackSigned = true; d.menu.ackName = "John Smith";`);
          await s.go(`#/desk/${D}`); await s.click('[data-sheet-open="buyers"]'); await s.click("#byRoles"); },
        action: "Cancel", next: "team-lead-roles",
        notes: "With a submitted joint application the swap lists a third consequence: both applicants stay on the application, but the primary on file with the lender changes. The result is stated before the action." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "presentation", area: "13-fi-presentation", title: "F&I Product Presentation",
    description: "Step 2 of the menu on the master canvas (owner's presentation golden, 2026-08-27): a product rail of line-icon tiles, one product card at a time with the customer benefit first, and the advisor's own tools — script, budget impact, details — in bottom sheets so the card stays the thing the customer sees. The rail follows the deal type: a lease shows Lease-End Protection, a cash deal has no Rate or Term tile.",
    entry: { from: "finance-menu/options", action: "Tap Present each product" },
    steps: [
      { key: "product-rail", screen: "Presentation — Rate", do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF); await s.go(`#/present/${D}`); }, action: "Tap the VSC tile", next: "service-contract",
        notes: "The rail carries every product in the real program, each with a line icon; the dock counts what has been presented and names the next product. The qualified rate stays gated behind the real credit approval — before it, the card says to submit the application first." },
      { key: "service-contract", screen: "Vehicle service contract", do: async (s) => { await s.click('[data-tile="vsc7"]', { wait: 300 }); }, action: "Drag the mileage slider", next: "mileage-recalculated",
        notes: "Kicker, headline, the detail pill, the body and the benefit list — the customer benefit is visible before any price." },
      { key: "mileage-recalculated", screen: "Mileage changes the warranty window", do: async (s) => { await ev(s, `(() => { const r = document.querySelector("#mpMiles"); r.value = "25000"; r.dispatchEvent(new Event("input", { bubbles: true })); })();`); },
        action: "Tap Budget impact", next: "budget-impact",
        notes: "The slider recomputes the REAL factory-coverage window from the mileage — at 25,000 miles a year the factory comprehensive coverage is gone in about 17 months. Nothing here is a fixed marketing number." },
      { key: "budget-impact", screen: "Monthly / daily budget (sheet)", do: async (s) => { await s.click("#mpBudget", { wait: 400 }); }, action: "Back to product, then More product details", next: "more-details-sheet",
        notes: "Both figures are DERIVED from the deal — the product price over the real term — not typed in by the advisor. The reference prototype asked for the number to be entered; the app already knows it." },
      /* ---- lib/coverage: every state a person can see on this route ---- */
      { key: "more-details-sheet", screen: "More product details (sheet)", do: async (s) => { await s.click("#fpSheet [data-sheet-close]", { wait: 300 }); await s.click("#mpMore", { wait: 400 }); }, action: "Back to product, tap the Term tile", next: "term-tile",
        notes: "The advisor's reference for the product in front of the customer: the detail pill, the body and every benefit on one list. It closes back to the same card." },
      { key: "term-tile", screen: "Presentation — Term", do: async (s) => { await s.click("#fpSheet [data-sheet-close]", { wait: 300 }); await s.click('[data-tile="term"]', { wait: 300 }); }, action: "Tap the Rate tile, then See why this rate is credible", next: "rate-credible-sheet",
        notes: "Term is presented like a product: the benefit of the structure the customer chose, with no product price because there is none. The tiles already presented carry a check on the rail." },
      { key: "rate-credible-sheet", screen: "See why this rate is credible (sheet)", do: async (s) => { await s.click('[data-tile="rate"]', { wait: 300 }); await s.click("#mpMore", { wait: 400 }); }, action: "Done, tap Maintenance", next: "product-maintenance",
        notes: "The rate card's own sheet: the points the advisor uses to stand behind the qualified rate. Done, not Back to product — the rate is not a product." },
      { key: "product-maintenance", screen: "Pre-Paid Maintenance", do: async (s) => { await s.click("#fpSheet [data-sheet-close]", { wait: 300 }); await s.click('[data-tile="ppm8"]', { wait: 300 }); }, action: "Tap Next: Tire & Wheel", next: "product-tire-wheel",
        notes: "Each product card has the same shape — kicker, headline, detail pill, body, benefits — so the customer learns to read it once. The dock counts what has been presented so far." },
      { key: "product-tire-wheel", screen: "Tire and Wheel", do: async (s) => { await s.click("#mpNext", { wait: 300 }); }, action: "Tap Next: GAP", next: "product-gap",
        notes: "Tires and wheels against the road itself. Next moves to the program's next product, and the rail marks each one already presented." },
      { key: "product-gap", screen: "GAP Coverage — the last product, 6 of 6", do: async (s) => { await s.click("#mpNext", { wait: 300 }); }, action: "Next: Choose a package", next: "finance-menu/options",
        expect: async (s) => /Next: Choose a package/.test(await s.text("#mpNext")) ? null : "the last product's button should name where it goes",
        notes: "The gap between what the customer owes and what insurance pays. It is the last product of the Preferred program (your kit's four), so the dock counts 6 of 6 and its button names where it goes, Next: Choose a package (RP-UI-061)." },
      { key: "rate-gated", screen: "Rate — before the credit approval", scenario: true, do: async (s) => { await s.reset(); await ev(s, MENU_READY + ` d.creditApp = null;`); await s.go(`#/present/${D}`); }, action: null, next: null,
        notes: "Without a real approval the Rate card shows no qualified rate and no approved dot — it says to submit the application first. A rate that has not been won is never presented as if it had." },
      { key: "rail-lease", screen: "Lease rail — Lease-End Protection", scenario: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.dealType = "lease";`); await s.go(`#/present/${D}`); await s.click('[data-tile="lep"]', { wait: 300 }); }, action: "Next product", next: "presentation/product-maintenance",
        notes: "A lease runs the lease program: Rate and Term stay, and the first product is Lease-End Protection — excess wear and mileage at turn-in — which a purchase never shows." },
      { key: "rail-cash", screen: "Cash rail — no Rate or Term tile", scenario: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.dealType = "cash";`); await s.go(`#/present/${D}`); }, action: "Next product", next: "presentation/product-maintenance",
        notes: "A cash buyer has no rate and no term to present, so the rail opens on the service contract and the dock counts the products only." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "finance-menu", area: "14-finance-menu", title: "Finance Menu — Sign-Off Gate and Four Stages",
    description: "The owner's Finance Menu V3 (2026-08-30). A Manager sign-off gate reads four upstream statuses — base payment agreement, credit application, test drive, Deal Jacket — and recreates none of their detail; an Advisor is simply told it is waiting on the Team Lead. Then four stages, Terms → Options → Forms → Finalize, as one row of pills that never wraps. The money leads every stage and the detail hides behind one tap: taxes behind View, the form catalog behind Choose. Finalize is the single closeout — the DMS push folded into it rather than standing as a second button.",
    entry: { from: "credit/approved-agreed-rate", action: "Continue → Manager sign-off" },
    steps: [
      { key: "signoff-gate-advisor", screen: "Manager sign-off — Advisor view", do: async (s) => { await s.reset(); await ev(s, MENU_READY); await s.go(`#/menu/${D}`); }, action: "Tap Ask Jordan Reyes to approve", next: "gate-asked",
        branches: [{ action: "Park the deal", to: "finance-menu/gate-parked" }],
        notes: "Four statuses and nothing more. The Advisor sees no approval or override control — only who it is waiting on, and the two things they can do: ask the Team Lead, or park the deal." },
      { key: "gate-asked", screen: "Manager sign-off — the Team Lead has been asked", do: async (s) => { await s.click("#fmAsk"); }, action: "Switch role to Team Lead (in New visit — the only place the role control appears)", next: "signoff-gate-locked",
        notes: "Asking is recorded on the deal: the button now reads that Jordan Reyes has been asked, and the Team Lead's gate will show the request with its time." },
      { key: "signoff-gate-locked", screen: "Manager sign-off — jacket blocking (Team Lead)", do: async (s) => { await switchRole(s, "teamlead", `#/menu/${D}`); }, action: "Tap Resolve Deal Jacket blocker", next: "override-sheet",
        notes: "Approve stays disabled while the jacket is outstanding, and the dock says why. The Approval block says who asked; the time is in the Deal Jacket's History (#192). The test drive is advisory and does not block." },
      { key: "override-sheet", screen: "Resolve Deal Jacket blocker", do: async (s) => { await s.click('[data-sheet-open="override"]'); }, action: "Type a reason, Record override", next: "override-recorded",
        notes: "The override names the deal and the Team Lead it is attributed to. It needs a typed reason and says plainly that the missing documents remain missing." },
      { key: "override-recorded", screen: "Manager sign-off — override recorded, Approve available", do: async (s) => { await s.type("#fmReason", "Lien release confirmed with the lender"); await s.click("#fmReasonGo"); }, action: "Tap Approve", next: "terms",
        notes: "The jacket row carries the Override pill and the banner says the override is recorded; who recorded it and why are in the Deal Jacket, and its History. Approve is the live action. The documents are still outstanding and the screen does not pretend otherwise." },
      { key: "terms", screen: "Stage 1 — Review the deal terms", do: async (s) => { await s.click("#fmApprove"); }, action: "Tap View on Taxes & fees", next: "terms-fees",
        notes: "One payment leads the card: the agreed payment at the approved rate, with its taxes and fees behind View and the structure under it. Who approved and when are in the Deal Jacket's History (#192), never a toast." },
      { key: "terms-fees", screen: "Taxes & fees (sheet)", do: async (s) => { await clearToast(s); await s.click('[data-sheet-open="fees"]'); }, action: "Close, tap Mark presented", next: "options",
        notes: "The itemization lives here, not on the page." },
      { key: "options", screen: "Stage 2 — Choose a protection package", do: async (s) => { await s.click("#fmSheet [data-sheet-close]"); await s.click("#fmNext"); }, action: "Tap Custom; move a product across", next: "options-custom",
        branches: [{ action: "Present each product", to: "presentation/product-rail" }, { action: "No products", to: "finance-menu/decline-sheet" }],
        notes: "The four package pills fit one row; the payment sits directly beneath them, above the product list." },
      { key: "options-custom", screen: "Custom package — figure withheld", do: async (s) => { await s.click('[data-pack="standard"]'); await s.click('[data-move][data-src="standard"]'); await s.click('[data-pack="custom"]'); }, action: "Tap Show custom payment", next: "options-custom-revealed",
        notes: "Custom withholds its payment until the advisor reveals it, and the dock does not leak it either. The first product moved sets the custom column's rate and term." },
      { key: "options-custom-revealed", screen: "Custom package — payment revealed", do: async (s) => { await s.click("#fmReveal"); }, action: "Tap Accept", next: "accept-initials",
        notes: "The custom payment is the agreed payment plus the products spread over the term, and the row states the difference over the agreed payment in dollars." },
      { key: "accept-initials", screen: "Accept package — client initials", do: async (s) => { await s.click("#fmAccept"); }, action: "Enter initials, Accept package", next: "forms",
        notes: "The sheet states the products' total, what they cost over the term, and how much of that is finance charge — before the customer initials." },
      { key: "decline-sheet", screen: "Continue without products", do: async (s) => { await s.click("#fmSheet [data-sheet-close]", { wait: 250 }); await s.click("#fmNone"); }, action: "Enter initials, Continue without products", next: "forms",
        notes: "Declining is a recorded choice with initials, and it clears the custom box rather than refusing with a blocked toast." },
      { key: "forms", screen: "Stage 3 — Disclosures & forms", do: async (s) => { await ev(s, `const d = Store.deal("${D}"); d.menu.selectedProgram = "custom"; d.menu.initials = "JS"; d.menu.custom = ["vsc7"]; d.menu.customSource = "standard"; d.menu.termsPresented = true; d.menu.step = 4; d.menu.maxStep = 4; d.menu.v5 = true;`); await s.go(`#/menu/${D}`); }, action: "Tap Choose on Additional deal forms", next: "forms-catalog",
        notes: "The acknowledgment is required and the additional forms optional, said in words. Continue stays disabled until the benefits acknowledgement is signed, and the dock says so." },
      { key: "forms-catalog", screen: "Additional deal forms (sheet)", do: async (s) => { await s.click('[data-sheet-open="catalog"]'); }, action: "Close, tap Sign on the acknowledgement", next: "forms-ack-sheet",
        notes: "Anything the trade requires is selected and locked here." },
      { key: "forms-ack-sheet", screen: "Benefits acknowledgment (sheet)", do: async (s) => { await s.click("#fmSheet [data-sheet-close]"); await s.click('[data-sheet-open="ack"]'); }, action: "Tap Sign acknowledgment", next: "forms-ack-signed",
        notes: "The customer signs what they chose; signing files a document in the jacket." },
      { key: "forms-ack-signed", screen: "Stage 3 — acknowledgment signed", do: async (s) => { await s.click("#fmSignGo"); await clearToast(s); }, action: "Tap Continue", next: "final-review",
        notes: "The row reads Signed, and Continue is now available; the time and who signed are in the Deal Jacket's History (#192). The signed acknowledgment is filed in the jacket as a document the deal produced — counted apart from the fifteen required, so the chip stays at 4 of 15. No toast carries any of it." },
      { key: "final-review", screen: "Stage 4 — Final review", do: async (s) => { await s.click("#fmNext"); }, action: "Tap Finalize with documents outstanding", next: "finalize-override",
        branches: [{ action: "Print center", to: "print-center/print-center" }],
        notes: "Five readiness rows summarize the journey, then the repayment summary. One dominant action, and which one depends on the jacket: with every required document filed the dock reads Finalize deal, and while any is outstanding that button is not rendered at all (§22) — the dock offers the attributed override instead and names the count. This capture is the outstanding case, which is where the demo deal stands." },
      { key: "finalize-override", screen: "Finalize with documents outstanding", do: async (s) => { await s.click("#fmOverrideFinal"); },
        action: "Type a reason, Finalize", next: "deal-finalized",
        notes: "A second attribution, not a repeat of the first: the sign-off override let the Team Lead approve the menu, and this one pushes the deal to the DMS with documents still missing. The sheet lists exactly which, and says the closeout screen will name them." },
      { key: "deal-finalized", screen: "Deal finalized", do: async (s) => {
          await s.type("#fmFinReason", "Lender funded on the approved package; lien release follows from the payoff bank");
          await s.click("#fmFinGo"); }, action: "Return to Deals", next: "home/advisor-completed",
        notes: "The DMS push is recorded against the Team Lead who approved the deal, with the reason and the outstanding documents named on the closeout." },
      /* ---- scenarios the main sequence does not pass through ---- */
      { key: "gate-parked", screen: "Park the deal — back on My deals", scenario: true, do: async (s) => { await s.reset(); await ev(s, MENU_READY); await s.go(`#/menu/${D}`); await s.click("#fmPark", { wait: 600 }); }, action: null, next: null,
        notes: "Parking records the approval request and takes the Advisor back to the queue; the deal keeps its place and its stage while it waits for the Team Lead." },
      { key: "terms-rate-history", screen: "Stage 1 — the payment agreed again at the lender's rate", scenario: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.creditApp.approvedApr = 3.9; d.creditApp.agreedApr = 3.5; d.creditApp.agreedPayment = 701.79; d.creditApp.submitted = new Date(Date.now() - 60000).toISOString();
          /* re-presented at the lender's rate: John chose the new payment, Jordan approved it and John signed it again (W-111) */
          d.desk.apr = 3.9; { const v = Store.vehicle(d.stock), r = RIDE_PRICE_CALC.calc(d, v), now = new Date().toISOString();
          d.desk.customerChose = { term: r.term, down: d.desk.downPayment, payment: r.payment, at: now, inputs: deskInputs(d) };
          d.desk.approvalRequestedAt = now; d.desk.approvalRequestedBy = "Ashley Collins"; d.desk.approvedAt = now; d.desk.approvedBy = "Jordan Reyes";
          d.basePayment = { signedAt: now, sigName: "John Smith", snapshot: agreementSnapshot(d, v) }; }`); await s.go(`#/menu/${D}`); }, action: null, next: null,
        notes: "The lender approved at 3.9% against the 3.5% first agreed: once John has chosen the new payment, Jordan has approved it and John has signed it again (W-111), it is the one payment on the card. The original is in the Deal Jacket's History (#192), never a second live payment." },
      { key: "final-review-clean", screen: "Stage 4 — nothing outstanding, Finalize deal", scenario: true, do: async (s) => {
          await s.reset();
          await ev(s, SIGNED_OFF + ` jacketDocs(d).forEach(doc => { if (doc.id !== "form-license" && !jacketState(d, doc.id)) jacketReceive(d, doc.id, "hand"); }); const at = new Date().toISOString(); licenseBuyerIds(d).forEach(customerId => setClientRecord(d, "form-license", customerId, { customerId, state: "accepted", receiptRevision: 1, pages: 2, sides: { front: { receivedAt: at }, back: { receivedAt: at } }, review: { customerId, receiptRevision: 1, reviewedAt: at, by: "Jordan Reyes" } })); syncLicenseReceipt(d);`);
          await s.go(`#/menu/${D}`);
          await s.click("#fmNext"); await s.click("#fmAccept"); await s.type("#fmIni", "JS"); await s.click("#fmIniGo");
          await s.click('[data-sheet-open="ack"]'); await s.click("#fmSignGo");
          await s.go(`#/menu/${D}`); await s.click("#fmNext"); },
        action: "Tap Finalize deal", next: "deal-finalized-clean",
        notes: "With every required document filed the gate opens: the single closeout is Finalize deal, the jacket row reads none outstanding, and the repayment summary states the total of payments. The menu record and acknowledgment the deal produced are counted apart and never move the fifteen." },
      { key: "deal-finalized-clean", screen: "Deal finalized — clean", do: async (s) => { await s.click("#fmFinal", { wait: 500 }); }, action: "Return to Deals", next: "home/advisor-completed",
        notes: "The one honest clean finish: the headline is unqualified, the jacket line says none outstanding, and the deal leaves the active queue." },
      { key: "terms-cash", screen: "Stage 1 — a cash deal's terms", scenario: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.dealType = "cash";`); await s.go(`#/menu/${D}`); }, action: "Tap Mark presented", next: "options-cash",
        notes: "No financing, so the card leads with the total due rather than a monthly payment, and the jacket asks for ten documents instead of fifteen. The unit follows the deal type." },
      { key: "options-cash", screen: "Stage 2 — packages on a cash deal", do: async (s) => { await s.click("#fmNext"); await clearToast(s); }, action: null, next: null,
        notes: "Three packages instead of four — there is no Budget package on a cash deal — and each prices as a total rather than per month." },
      { key: "terms-lease", screen: "Stage 1 — a lease's terms", scenario: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.dealType = "lease";`); await s.go(`#/menu/${D}`); }, action: "Tap Mark presented", next: "options-lease",
        notes: "A lease reads per month like a finance deal; the demo seed carries the same structure, so the figures match the financed terms." },
      { key: "options-lease", screen: "Stage 2 — packages on a lease", do: async (s) => { await s.click("#fmNext"); await clearToast(s); }, action: null, next: null,
        notes: "The packages are the lease ones — Full Service, Standard and Limited Lease plus Custom — with Lease-End Protection among the products, priced per month over the lease term." },
      { key: "terms-onepay", screen: "Stage 1 — a one-pay deal's terms", scenario: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.dealType = "onepay";`); await s.go(`#/menu/${D}`); }, action: null, next: null,
        notes: "One payment up front: the unit reads total rather than per month, the way a cash deal does." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "deal-jacket", area: "15-deal-jacket", title: "Deal Jacket & Compliance",
    description: "The owner's Deal Jacket V2 (2026-08-29): compliance complexity behind the interface. One funding-readiness object answers whether the deal can fund, then three buckets — Waiting on customer, Deal forms and Completed, the last two collapsed until the advisor opens them. Rows are whole tap targets that open a contextual sheet; there is no permanent button rail. Requesting customer documents happens in a sheet on this page, so the advisor never leaves the jacket.",
    entry: { from: "desking/pencil-finance", action: "Tap the Jacket chip" },
    steps: [
      { key: "jacket-overview", screen: "Deal Jacket — funding readiness", do: async (s) => { await s.reset(); await s.go(`#/jacket/${D}`); }, action: "Open Deal forms", next: "deal-forms",
        branches: [{ action: "Request N documents", to: "document-request/request-sheet" }, { action: "Capture all N here instead", to: "snap-all/capture" }, { action: "Print Center", to: "print-center/print-center" }, { action: "Complete sign-off →", to: "finance-menu/signoff-gate-advisor" }] },
      { key: "deal-forms", screen: "Deal forms — expanded", focus: "#jkFormsToggle", do: async (s) => { await s.click("#jkFormsToggle"); }, action: "Tap a form row", next: "document-actions",
        notes: "Collapsed by default at every width — the package locks progressive disclosure." },
      { key: "document-actions", screen: "Document row — contextual actions", do: async (s) => { await s.click('.rp-doc[data-open="form-privacy"]'); }, action: "Tap Mark received", next: "mark-received",
        notes: "A document this portal printed is offered the marker scan; one that arrives from outside never is — there is nothing to read." },
      { key: "mark-received", screen: "Mark received — a person's word", do: async (s) => { await s.click("#jkMark"); }, action: "Tap Mark received", next: "mark-received-done",
        notes: "States plainly that Ride Price did not scan or verify the document, names who takes it in, and says how far the count moves — by one — before moving it." },
      { key: "mark-received-done", screen: "Marked received — the count moved by one", focus: ".rp-ready", do: async (s) => { await s.click("#jkMarkGo", { wait: 500 }); await clearToast(s); }, action: "Tap the Auto Insurance row", next: "customer-document-actions",
        notes: "4 of 15 became 5 of 15 and the outcome line followed; the Deal forms bucket stays open and the page stays where the advisor was." },
      { key: "customer-document-actions", screen: "Customer document — capture, never a marker scan", do: async (s) => { if (await s.exists("#jkSheet:not([hidden]) [data-sheet-close]")) await s.click("#jkSheet [data-sheet-close]"); await s.click('.rp-doc[data-open="form-insurance"]'); }, action: "Close; tap + Add optional document", next: "add-optional",
        notes: "A document that arrives from outside has no marker strip to read, so it is offered a photo instead — the row is never a dead end." },
      { key: "add-optional", screen: "Add optional document", do: async (s) => { await s.click("#jkSheet [data-sheet-close]"); await s.click("#jkAddOpt"); }, action: "Pick a document, tap Add", next: "optional-added",
        notes: "The sheet says the required package stays at fifteen and why: optional documents are counted apart, and it states what the count will read after." },
      { key: "optional-added", screen: "Optional document added — counted apart", focus: "#jkAddOpt", do: async (s, ctx) => {
          ctx.extra = await s.eval(`(() => { const sel = document.getElementById("jkAddSel"); const o = [...sel.options].find(x => x.value); sel.value = o.value; return o.value; })()`);
          await s.click("#jkAddGo", { wait: 500 }); },
        action: "Mark it received, open it from Completed", next: "optional-remove",
        notes: "The new row joins Deal forms as an extra, just above Add optional document; the required count does not move, because an optional document never enters the fifteen." },
      { key: "optional-remove", screen: "Optional document — Remove from this deal", focus: "#jkDoneToggle", do: async (s, ctx) => {
          await s.click(`#jkFormsToggleBody .rp-doc[data-open="${ctx.extra}"]`); await s.click("#jkMark"); await s.click("#jkMarkGo", { wait: 500 });
          await s.eval(`(() => { const b = document.getElementById("jkDoneToggle"); if (b.getAttribute("aria-expanded") !== "true") b.click(); return true; })()`); await s.settle(300);
          await s.click(`#jkDoneToggleBody .rp-doc[data-open="${ctx.extra}"]`); },
        action: "Tap Remove from this deal", next: "completed-bucket",
        notes: "Only a document someone added by hand offers Remove; a computed requirement never does. Removing it returns the ledger to where it was." },
      { key: "completed-bucket", screen: "Completed — already in the jacket", focus: "#jkDoneToggle", do: async (s) => { await s.click("#jkDrop", { wait: 500 }); await clearToast(s); await s.eval(`(() => { const b = document.getElementById("jkDoneToggle"); if (b.getAttribute("aria-expanded") !== "true") b.click(); return true; })()`); await s.settle(300); }, action: "Tap the Driver's License row in Waiting on customer", next: "license-back-needed",
        notes: "The Completed bucket holds what is already filed — the trade paperwork and the Privacy Policy marked received earlier, each row repeating the person's name and never claiming the app read it. The removed optional document is gone and the ledger is back where it was. A license still missing a side is the customer's to finish, so it stays in the customer bucket the route opens by default." },
      { key: "license-back-needed", screen: "Driver's License — back still needed", do: async (s) => {
          await ev(s, `const d = Store.deal("${D}"); const cl = jacketClientOf(d);
            /* John's front arrived and the back did not, in the per-buyer receipt's own shape */
            delete cl["form-license"]; const at = new Date().toISOString();
            setClientRecord(d, "form-license", d.customerId, { customerId: d.customerId, state: "rejected", rejectedReason: RIDE_PRICE_DATA.clientDocs.license.missingPage.title, tries: 1, pages: 1, receiptRevision: 1, sides: { front: { receivedAt: at, via: "customer" }, back: null } });
            syncLicenseReceipt(d); Store.save();`);
          await s.go(`#/jacket/${D}`); await s.click('.rp-doc[data-open="form-license"]');
        }, action: "Tap Capture back", next: "jacket-complete",
        notes: "The exception is local to the license: the front is received and the back is needed, and Add missing back asks only for the side that is missing." },
      { key: "jacket-complete", screen: "Jacket complete — the dock unlocks", do: async (s) => { await ev(s, `const d = Store.deal("${D}"); jacketDocs(d).forEach(x => jacketReceive(d, x.id, "hand")); /* a license is complete with both sides, reviewed */ const at = new Date().toISOString(); licenseBuyerIds(d).forEach(customerId => setClientRecord(d, "form-license", customerId, { customerId, state: "accepted", receiptRevision: 1, pages: 2, sides: { front: { receivedAt: at }, back: { receivedAt: at } }, review: { customerId, receiptRevision: 1, reviewedAt: at, by: "Ashley Collins" } })); syncLicenseReceipt(d);`); await s.go(`#/jacket/${D}`); }, action: "Tap Complete sign-off →", next: "finance-menu/signoff-gate-advisor",
        notes: "Every document recorded (by hand, for the capture) — sign-off stays locked until this point. Fifteen of fifteen, Ready for sign-off, and no request button left because nothing is left to request." },
      /* ---- scenarios the main sequence does not pass through ---- */
      { key: "retake-needed", screen: "Auto Insurance — Retake needed, with its reason", scenario: true, do: async (s) => {
          await s.reset(); await ev(s, `const d = Store.deal("${D}"); const cl = jacketClientOf(d); cl["form-insurance"] = { state: "rejected", rejectedReason: DR_UNREADABLE, tries: 1, pages: 1 };`);
          await s.go(`#/jacket/${D}`); }, action: null, next: null,
        notes: "A document rejected for its own reason reads Retake needed and the row says why, so the advisor never has to open it to find out. Only the license wears Back needed." },
      { key: "paystub-missing-page", screen: "Proof of Income — second paystub missing", scenario: true, do: async (s) => {
          await s.reset(); await ev(s, `const d = Store.deal("${D}"); const cl = jacketClientOf(d); cl["form-paystub"] = { state: "rejected", rejectedReason: RIDE_PRICE_DATA.clientDocs.paystub.missingPage.title, tries: 1, pages: 1 };`);
          await s.go(`#/jacket/${D}`); }, action: "Tap the Proof of Income row", next: "paystub-actions",
        notes: "The paystub's missing page is the paystub's own beat: Retake needed, with its reason on the row." },
      { key: "paystub-actions", screen: "Proof of Income — the ordinary action sheet", do: async (s) => { await s.click('.rp-doc[data-open="form-paystub"]'); }, action: null, next: null,
        notes: "Another photo appends through the ordinary sheet — Take photo, Upload file, Mark received. It is not the license's sheet and never asks for a barcode." },
      { key: "jacket-cash", screen: "A cash deal's jacket — ten required", scenario: true, do: async (s) => {
          await s.reset(); await ev(s, `Store.deal("${D}").dealType = "cash";`); await s.go(`#/jacket/${D}`);
          await s.click("#jkFormsToggle"); await s.click("#jkDoneToggle"); await s.settle(300); }, action: null, next: null,
        notes: "No lender, so the package derives itself smaller: the pill, the outcome line and the three buckets all report the same ten-document ledger." },
      { key: "jacket-lease", screen: "A lease's jacket — all fifteen", scenario: true, do: async (s) => {
          await s.reset(); await ev(s, `Store.deal("${D}").dealType = "lease";`); await s.go(`#/jacket/${D}`);
          await s.click("#jkFormsToggle"); await s.click("#jkDoneToggle"); await s.settle(300); }, action: null, next: null,
        notes: "A lease needs everything a financed deal needs; the buckets hold every document exactly once." },
      { key: "jacket-cobuyer-identity", screen: "A deal with a co-buyer — the co-buyer's identity record", scenario: true, focus: '.rp-doc[data-open="idverify-cobuyer"]', do: async (s) => {
          await s.reset(); await ev(s, `Store.deal("${D}").coBuyerId = "c-demo2";`); await s.go(`#/jacket/${D}`); await s.click("#jkFormsToggle"); await s.settle(300); }, action: null, next: null,
        expect: async (s) => (await s.text("#view")).includes("Co-buyer identity") ? null : "John's deal with Cheri as co-buyer should owe the co-buyer's identity record",
        notes: "The owner's answer B of 2026-09-28 on a photo that didn't match: every signer is positively identified before delivery. With Cheri Bridwell on John's deal as co-buyer, the co-buyer's identity record is one more required document, counted in the jacket's total like the buyer's, and it holds sign-off until it is filed." },
      { key: "signoff-override-unlocked", screen: "Sign-off unlocked by a recorded override", scenario: true, focus: ".rp-notice--reserved", do: async (s) => {
          await s.reset(); await ev(s, `const d = Store.deal("${D}"); jacketOf(d).override = { by: "Jordan Reyes", at: new Date().toISOString(), reason: "Lien release is in the mail" };`);
          await s.go(`#/jacket/${D}`); }, action: "Tap Complete sign-off →", next: "finance-menu/signoff-gate-advisor",
        notes: "The override is the one way past the gate while documents are outstanding: the jacket says who unlocked it and why, and still counts the items remaining rather than pretending they arrived." },
      { key: "tracking-advisor-capture", screen: "Request status — the customer's uploads, not the advisor's", scenario: true, do: async (s) => {
          await s.reset(); await ev(s, `const d = Store.deal("${D}"); jacketSendRequest(d, ["form-insurance", "form-paystub"]); const cl = jacketClientOf(d); cl["form-insurance"].via = "advisor"; cl["form-insurance"].state = "accepted"; cl["form-insurance"].acceptedAt = new Date().toISOString();`);
          await s.go(`#/jacket/${D}`); await s.click("#jkTrack"); }, action: null, next: null,
        branches: [{ action: "Resend link", to: "document-request/resend-sheet" }],
        notes: "After a request went out and the advisor photographed the insurance card in the showroom, the tracking sheet still reports the customer: Waiting, and 0 uploads — an advisor capture is not the customer opening the link." },
      { key: "license-reviewed", screen: "License reviewed and filed — the count moves by one", scenario: true, focus: '#jkDoneToggleBody .rp-doc[data-open="form-license"]', do: async (s, ctx) => {
          /* the seed's license front is a legacy record with no buyer on it; bind
             it to John Smith the way the jacket harness does, so the row opens
             the review viewer rather than the capture sheet (a precondition
             shortcut, not a user action) */
          await s.reset();
          await ev(s, `const d = Store.deal("${D}"); const r = d.jacket.client && d.jacket.client["form-license"]; if (r && !r.buyers) { const at = r.receivedAt; r.customerId = d.customerId; r.receiptRevision = 1; r.sides = { front: { receivedAt: at, via: r.via || "advisor" }, back: null }; delete d.jacket.client["form-license"]; setClientRecord(d, "form-license", d.customerId, r); syncLicenseReceipt(d); }`);
          await s.go(`#/jacket/${D}`);
          await s.click('.rp-doc[data-open="form-license"]', { wait: 600 }); await s.click("#drvAdd");
          await s.upload("#drvFile", [ctx.photos[0], ctx.photos[1]], { wait: 800 });
          if (!await s.exists("#drvReview")) { await s.click("#drvAdd"); await s.upload("#drvFile", [ctx.photos[0], ctx.photos[1]], { wait: 800 }); }
          await s.click("#drvReview", { wait: 900 }); await s.click("#drvBack", { wait: 600 });
          await s.eval(`(() => { const b = document.getElementById("jkDoneToggle"); if (b.getAttribute("aria-expanded") !== "true") b.click(); return true; })()`); await s.settle(300); },
        action: null, next: null,
        notes: "Receiving both sides alone does not move the count; the explicit review does, by exactly one — 4 of 15 to 5 of 15 — and the license lands in Completed. Nothing else in the ledger changes." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "document-request", area: "16-document-request", title: "Customer document request (from the jacket)",
    description: "One secure link for every customer document still missing. The V2 package folded the old Send Text Request page and its Resend twin into a bottom sheet on the jacket: sending and resending never leave the Deal Jacket, and delivery status returns inline in the customer group rather than on a route of its own.",
    entry: { from: "deal-jacket/jacket-overview", action: "Tap Request N documents" },
    steps: [
      { key: "request-sheet", screen: "Request documents — secure link", do: async (s) => { await s.reset(); await s.go(`#/jacket/${D}`); await s.click("#jkRequest"); }, action: "Untick every document, then tap Send", next: "request-none-picked",
        branches: [{ action: "Tap Send secure request", to: "document-request/request-sending" }],
        notes: "Every missing document arrives ticked, so the usual tap sends them all. The privacy line is the point: the customer uploads directly into Ride Price, never through the salesperson's texts or photo library." },
      { key: "request-none-picked", screen: "Nothing ticked — the send is refused", do: async (s) => {
          for (let i = 0; i < 3; i++) if (await s.exists(`#jkSheet [data-pick]:checked`)) await s.click("#jkSheet [data-pick]:checked", { wait: 80 });
          await s.click("#jkSend", { wait: 150 }); },
        action: "Tick them back, tap Send secure request", next: "request-sending",
        notes: "An advisor who unticks everything has nothing to send. The sheet stays open and says so — the link is never sent empty." },
      { key: "request-sending", screen: "Sending the secure link", do: async (s) => {
          await clearToast(s);
          for (let i = 0; i < 3; i++) if (await s.exists(`#jkSheet [data-pick]:not(:checked)`)) await s.click("#jkSheet [data-pick]:not(:checked)", { wait: 80 });
          await s.click("#jkSend", { wait: 60 }); },
        action: "(the send finishes on its own)", next: "request-sent",
        notes: "For under a second the sheet is only the title: nothing to tap while the message goes. Leaving the jacket mid-send cancels it rather than sending behind the advisor's back." },
      { key: "request-sent", screen: "Jacket after sending — Requested", do: async (s) => { for (let i = 0; i < 50 && !await s.exists("#jkTrack"); i++) await s.settle(100); await s.settle(300); }, action: "Tap View status", next: "request-tracking",
        notes: "Rows turn Requested — a license with a side already on file reads Receipt incomplete instead, and names the side still missing. An inline banner carries the status — no toast, and no page change — and the button now offers a Resend." },
      { key: "request-tracking", screen: "Customer request — delivery status (waiting)", do: async (s) => { await s.click("#jkTrack"); }, action: "Tap Resend link", next: "resend-sheet",
        branches: [{ action: "Open the customer's phone", to: "client-upload/sms" }],
        notes: "Four lines: sent, delivered, whether the customer has opened it, and how many of the asked documents came back. Nothing has happened on the customer's side yet, so it reads Waiting and 0 of 3." },
      { key: "resend-sheet", screen: "Resend documents", do: async (s) => { await s.click("#jkResend"); }, action: "Tap Resend secure request", next: "request-sent",
        notes: "The same sheet under a Resend title, still listing what is missing — a resend goes out as one link again, never a second thread of texts." },
      { key: "request-progress", screen: "Jacket — the customer has started uploading", standalone: true, do: async (s, ctx) => {
          await s.reset(); await s.go(`#/jacket/${D}`); await s.click("#jkRequest"); await s.click("#jkSend", { wait: 1200 });
          await s.click("#jkTrack"); await s.click("#jkOpenPhone", { wait: 600 }); await s.click("[data-open-client]");
          /* the insurance card is accepted on its first photo, with its exception (KA-003) */
          await s.upload('[data-upload-input="form-insurance"]', [ctx.photos[2]]);
          await s.go(`#/jacket/${D}`); },
        action: "Tap view status", next: "request-tracking-opened",
        notes: "The customer answered from their phone: the insurance card is in, and the banner counts down to the two still pending." },
      { key: "request-tracking-opened", screen: "Customer request — opened, 1 of 3 uploaded", do: async (s) => { await s.click("#jkTrack"); }, action: "Open the customer's phone", next: "client-upload/sms",
        notes: "The same four lines once the customer has acted: Opened, and 1 of 3 — only what the customer sent through the link counts, never a document the advisor captured in the showroom." },
    ] },

  /* ------------------------------------------------------------ */  { id: "client-upload", area: "17-client-document-upload", title: "Client Document Upload (customer's phone)",
    description: "What the customer sees from the text link, rebuilt from the owner's upload prototype (2026-08-27) in Ride Price colors. This is the customer's OWN page: no app bar, no role switch, no debug strip — a white edge-to-edge canvas reached from a text message by someone who does not work at the dealership. One row per requested document with a line icon and a plain what-to-bring subtitle, an \"n of N ready\" progress line, and one dominant action. Verification is simulated with scripted beats (the license needs both sides, insurance flags once, two paystubs). An unreadable photo is refused plainly — \"Too blurry to read\" — with the retake on the row, never a coaching screen.",
    entry: { from: "document-request/request-tracking", action: "Open the customer's phone" },
    steps: [
      { key: "sms", screen: "Document request — what the link opens", do: async (s) => { await s.reset();
          /* the seed hands the customer a license whose front the advisor
             already captured in the resolver. This flow is the both-sides
             journey, so it opens with neither side on file. */
          await ev(s, `const j = Store.deal("${D}").jacket; delete j.client["form-license"]; clientPhotosSet("${D}", "form-license", []);`);
          await s.go(`#/clientlink/${D}/sms`); }, action: "Tap the link", next: "landing",
        notes: "The advisor sends the request; this is the message as the customer receives it. The link is the only way in — no account, no password." },
      { key: "landing", screen: "Upload your documents", do: async (s) => { await s.click("[data-open-client]"); }, action: "Add the license (one side)", next: "row-blocked",
        branches: [{ action: "Tap a document row", to: "client-upload/document-sheet" }, { action: "Add documents", to: "snap-all/client-capture" }, { action: "Save & finish later", to: "client-upload/save-later" }],
        notes: "The heading runs straight into the progress line — the explanatory paragraph was cut (owner, 2026-08-27): \"0 of 3 ready\" and the submit button already carry the send-when-ready model." },
      { key: "row-blocked", screen: "Row blocked — back of license missing", do: async (s, ctx) => { await s.upload('[data-upload-input="form-license"]', [ctx.photos[0]]); }, action: "Retake Photo (the back)", next: "row-verified",
        notes: "A blocked row keeps its ONE-TAP retake rather than making the whole row the control — the prototype's version cost an extra tap on the screen where the customer is already stuck." },
      { key: "row-verified", screen: "License sent — being reviewed", do: async (s, ctx) => { await s.upload('[data-upload-input="form-license"]', [ctx.photos[1]]); }, action: "Add the insurance card", next: "insurance-blurry",
        notes: "Both sides are in, so the row counts as ready and the progress line moves — but a license is never called verified by the customer's phone. It reads Sent — being reviewed, with Replace on the row, until an advisor reviews it in the jacket." },
      /* KA-003 (the owner's answer A of 2026-09-28): the card is taken the first time; the prototype's scripted refusal
         ("Expires within 45 days") and its retake are gone. A blurry photo is the refusal the row path still has */
      { key: "insurance-blurry", screen: "Insurance photo too blurry — refused on the row", do: async (s) => { await clearToast(s); await s.click('[data-detail="form-insurance"]'); await s.click("#drBad", { wait: 150 }); await s.click('[data-capture="camera"]'); }, action: "Retake the insurance", next: "insurance-accepted",
        notes: "The refusal names the real reason on the row itself. The toast lifts clear of the sticky action bar, the same way it already did for dialog footers. A refused photo does not spend the card's exception: that goes with the first card taken." },
      { key: "insurance-accepted", screen: "Insurance taken — the row says why it needs attention", do: async (s, ctx) => { await s.upload('[data-upload-input="form-insurance"]', [ctx.photos[2]]); }, action: "Tap Submit what's ready (2/3)", next: "receipt-partial",
        notes: "The card John has expires in 12 days, so it is taken the first time and its row says why it needs attention: Accepted, in the attention colour, \"Expires <date>. Coverage must be in force at delivery.\" The retake replaced the refused photo. Two of three ready: the customer can already send what is done." },
      { key: "receipt-partial", screen: "Receipt — partway through", do: async (s) => { await clearToast(s); await s.click("[data-receipt]"); }, action: "Back to upload", next: "paystub-one-of-two",
        notes: "Three groups, and only the ones that apply: what is already in the Deal Jacket, what is awaiting the advisor's review, and what is still needed. The button says Back to upload while something is missing." },
      { key: "paystub-one-of-two", screen: "Paystub — second stub still needed", do: async (s, ctx) => { await s.click("[data-back-landing]"); await s.upload('[data-upload-input="form-paystub"]', [ctx.photos[4]]); }, action: "Add the second stub", next: "all-verified",
        notes: "Two stubs are required, so one is a blocked row like the license's missing side — the row says which page is missing and offers the retake." },
      { key: "all-verified", screen: "Every row ready — the license still awaiting review", do: async (s, ctx) => { await s.upload('[data-upload-input="form-paystub"]', [ctx.photos[2]]); }, action: "Tap Submit documents", next: "receipt",
        notes: "Only when every row is ready does one submit button replace the add/submit-what's-ready pair. Ready is not the same as verified: the paystub cleared on the spot and the insurance card was taken with its exception, while John Smith's license still reads Sent — being reviewed until an advisor looks at it." },
      { key: "receipt", screen: "Receipt — your documents", do: async (s) => { await clearToast(s); await s.click("[data-receipt]"); }, action: "Back to status", next: "landing",
        notes: "What landed, when, and that it is already in the Deal Jacket." },
      { key: "document-sheet", screen: "What we need — bottom sheet", do: async (s) => { await s.reset(); await s.go(`#/clientlink/${D}`); await s.click('[data-detail="form-paystub"]'); }, action: "Tap See a good example", next: "good-example",
        branches: [{ action: "Choose from library (two files)", to: "client-upload/review-capture" }, { action: "Choose a PDF", to: "client-upload/review-pdf" }, { action: "Simulate an unreadable photo → Take a photo", to: "client-upload/unreadable-refused" }],
        notes: "A sheet OVER the list, not a page that replaces it (owner, 2026-08-27), so the customer never loses their place; it dismisses by tapping the list behind it or by Escape. No requirements list: telling someone what a good photo looks like before they have taken one is text for its own sake — the refusal afterwards is the part that helps." },
      { key: "good-example", screen: "See a good example — the one-line answer", do: async (s) => { await s.click("[data-example]", { wait: 250 }); }, action: "Tap Other income type", next: "other-income",
        notes: "One sentence in a toast, not a coaching page: corners visible, current dates, readable text. The sheet stays where it is." },
      { key: "other-income", screen: "Other income type — noted", do: async (s) => { await clearToast(s); await s.click("[data-other-income]", { wait: 250 }); }, action: "Choose from library (two files)", next: "review-capture",
        notes: "Only the paystub offers this. A customer paid some other way is not sent looking for a stub they do not have — the advisor requests the right alternative." },
      { key: "review-capture", screen: "Review capture — 2 pages", do: async (s, ctx) => { await clearToast(s); await s.upload("#drCapLib", [ctx.photos[0], ctx.photos[1]]); }, action: "Done (2)", next: "landing",
        notes: "Deliberately still a full screen — it is a photo viewer with pinch-zoom and page arrows, and wants the room a sheet cannot give." },
      { key: "unreadable-refused", screen: "Too blurry to read — refused on the row", do: async (s) => { await s.click("[data-use]", { wait: 500 }); await wait(1900); /* let the verify toast clear */ await s.click('[data-detail="form-insurance"]'); await s.click("#drBad", { wait: 150 }); await s.click('[data-capture="camera"]'); }, action: "Tap the refused row", next: "sheet-blocked-reason",
        notes: "Replaces the old three-card Glare / Blur / cropped coaching screen (owner, 2026-08-27): \"when a scanner works very well, it should tell someone that it's too blurry to be uploaded\". It routes through the same rejection every other refusal uses — the row says why and offers the retake." },
      { key: "sheet-blocked-reason", screen: "What we need — the refusal carried into the sheet", do: async (s) => { await clearToast(s); await s.click('[data-detail="form-insurance"]'); }, action: "Take a photo", next: "review-capture",
        notes: "Opening a refused document's sheet repeats the reason at the top, so the customer choosing how to retake it still sees why. The three capture methods are unchanged." },
      { key: "review-pdf", screen: "Review capture — a PDF, no preview", standalone: true, do: async (s) => {
          await s.reset(); await s.go(`#/clientlink/${D}`); await s.click('[data-detail="form-insurance"]');
          /* a file instead of a photo: the smallest thing a browser calls a PDF, generated on the spot like the photo squares */
          const { writeFileSync } = await import("node:fs"); const pdf = join(FIXTURES, "binder.pdf"); writeFileSync(pdf, "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
          await s.upload("#drCapPdf", [pdf]); },
        action: "Use this", next: "landing",
        notes: "Choose a PDF is the third way in, for someone whose insurer emailed the binder. The demo cannot draw a PDF page, and says so in the frame instead of showing a blank — Use this still files it." },
      { key: "save-later", screen: "Save & finish later", standalone: true, do: async (s) => { await s.reset(); await s.go(`#/clientlink/${D}`); await s.click("[data-save-later]", { wait: 250 }); }, action: "Reopen the same link later", next: "landing",
        notes: "Nothing to save: every upload already landed as it was verified. The line tells the customer the same link brings them back to where they stopped." },
    ] },

  { id: "snap-all", area: "18-snap-all", title: "Snap All — burst capture",
    description: "Shoot every outstanding document in one go; the simulated sorter deals the shots onto the queue and shows what verified, what needs attention, and what is still missing. On the UI kit since the owner's Snap All package (2026-09-09): the kit's Task, with a camera, a strip of captures, a result row whose actions sit under a full-width title, and a sorting screen between the two. The same route serves the customer from the client link, where the kit's turned-to-the-customer mode hides the role control.",
    entry: { from: "deal-jacket/jacket-overview", action: "Tap Capture all here instead" },
    steps: [
      { key: "capture", screen: "Snap All — camera", do: async (s) => { await s.reset(); await s.go(`#/snapall/${D}/advisor`); }, action: "Shutter, or Gallery", next: "thumbs",
        branches: [{ action: "Pick a file that is not a photo", to: "snap-all/bad-file" }],
        notes: "The dock states where the batch is going even with nothing in it — disabled, reading Process photos. The viewfinder names what goes in it (paper, card or ID); the shutter opens the device camera." },
      { key: "thumbs", screen: "Three photos in the batch", do: async (s, ctx) => { await s.upload("#saLib", [ctx.photos[0], ctx.photos[1], ctx.photos[2]]); }, action: "Process 3 photos & auto-sort", next: "sorting",
        branches: [{ action: "Tap a tile", to: "snap-all/photo-review" }, { action: "Close with photos in the batch", to: "snap-all/leave-guard" }],
        notes: "The strip exists only when a photo does. Each tile opens the photo it stands for; the 24px remove circle over its corner owns a 44px hit region." },
      { key: "sorting", screen: "Sorting the batch", do: async (s) => { await s.click("#saProcess", { wait: 60 }); }, action: "(the sort finishes on its own)", next: "results",
        notes: "The one state with no dock. Transient by design — the batch is being dealt onto the queue." },
      { key: "results", screen: "Auto-sort results", do: async (s) => { for (let i = 0; i < 50 && !await s.exists("#saSave"); i++) await s.settle(100); }, action: "Undo on the insurance card", next: "results-declined",
        notes: "Each row's title has the full width and its two actions sit underneath at 44px, the repair naming the page it wants — Add back, Add paystub. The insurance card is taken on the first pass with its exception (KA-003): it sits under Verified wearing an amber Exception accepted badge, with Undo beside it and the reason on the row." },
      { key: "results-declined", screen: "Results — the exception declined", do: async (s) => { await s.click('[data-sa-undo="form-insurance"]'); }, action: "Accept anyway, then Add back on the driver's license", next: "aimed-capture",
        notes: "Undo declines the card: the flag comes back with its retake and Accept anyway, and the next pass keeps it declined. Confirmed like this, the card is filed as refused, and the next card, on any path, is a new card and comes clean. Accept anyway takes it back with its exception, which survives a re-sort." },
      { key: "aimed-capture", screen: "Capture the missing page", do: async (s) => { await s.click('[data-sa-accept="form-insurance"]'); await s.click('[data-sa-retake="form-license"]'); }, action: "Take the page", next: "aim-candidate",
        notes: "An aim holds exactly one candidate and destroys nothing on the way in — cancelling leaves the batch as it found it. The gallery drops multi-select while a page is aimed." },
      { key: "aim-candidate", screen: "The page is in — the dock wakes", do: async (s, ctx) => {
          await s.upload("#saLib", [ctx.photos[3]]);
          for (let i = 0; i < 50 && await s.eval(`document.getElementById("saUseAim").disabled`); i++) await s.settle(100);
        }, action: "Use photo & return", next: "license-complete",
        notes: "The candidate joins the strip as a fourth tile and Use photo & return lights up. A second pick replaces the candidate rather than adding a page nobody asked for." },
      { key: "license-complete", screen: "The license now complete", do: async (s) => { await s.click("#saUseAim", { wait: 600 }); }, action: "Confirm & save", next: "batch-saved",
        notes: "Two sides on file, so the license moves to Review pending — a burst never verifies a license, an advisor does. The insurance keeps its accepted exception through the re-sort, and the paystub still wants its second stub." },
      { key: "batch-saved", screen: "Back in the jacket — batch saved", do: async (s) => { await s.click("#saSave", { wait: 700 }); }, action: "Open a received row", next: "deal-jacket/jacket-overview",
        notes: "Confirm writes the pages and the reasons into the jacket and returns there. The insurance is filed with its exception, the license row reads Review needed, and the unresolved paystub lands as Retake needed with its reason — the burst never files a flag as verified." },
      { key: "results-partial", screen: "Results — two documents still needed", standalone: true, do: async (s, ctx) => {
          await s.reset(); await s.go(`#/snapall/${D}/advisor`);
          await s.upload("#saLib", [ctx.photos[0]]);
          await s.click("#saProcess", { wait: 60 });
          for (let i = 0; i < 50 && !await s.exists("#saSave"); i++) await s.settle(100);
        }, action: "Take more, or Confirm & save what landed",
        notes: "One photo cannot cover three documents: the insurance card took it and is taken with its exception (KA-003), and the license and paystubs the batch never reached sit under Still needed. Confirming files only what landed; the rest stays on the customer." },
      { key: "photo-review", screen: "Review one photo", standalone: true, do: async (s, ctx) => {
          await s.reset(); await s.go(`#/snapall/${D}/advisor`);
          await s.upload("#saLib", [ctx.photos[0], ctx.photos[1], ctx.photos[2]]);
          await s.click("[data-shot]", { wait: 450 });
        }, action: "Remove photo", next: "remove-guard",
        notes: "Nothing could look at a capture before the kit conversion — only delete it. The gradient carries Keep here; Remove is the quiet link." },
      { key: "remove-guard", screen: "Remove this photo?", do: async (s) => { await s.click("#saDrop", { wait: 450 }); }, action: "Remove photo, or Keep photo", next: "thumbs",
        notes: "A photo leaves the batch only through this question, whether it came from the review sheet or the circle on its tile. The other photos stay where they are." },
      { key: "leave-guard", screen: "Leaving an unsorted batch", standalone: true, do: async (s, ctx) => {
          await s.reset(); await s.go(`#/snapall/${D}/advisor`);
          await s.upload("#saLib", [ctx.photos[0], ctx.photos[1]]);
          await s.click("#saClose", { wait: 450 });
        }, action: "Leave capture, or Keep capturing",
        notes: "The batch is session-only, so leaving is what discards it — the sheet says how many. Owner's call on the screenshots: the gradient carries the action the sheet was raised to do, and the quiet link is the way out. The focus goes to the link, not the gradient." },
      { key: "bad-file", screen: "Not a photo — nothing added", standalone: true, do: async (s) => {
          await s.reset(); await s.go(`#/snapall/${D}/advisor`);
          /* a file the browser cannot decode as an image, generated on the spot like the photo squares */
          const { writeFileSync } = await import("node:fs"); const junk = join(FIXTURES, "not-a-photo.png"); writeFileSync(junk, "this is not a picture");
          await s.upload("#saLib", [junk], { wait: 500 }); },
        action: "Shutter, or Gallery",
        notes: "A file the phone cannot open as a picture is refused with one line and the batch is left exactly as it was — still empty here. The camera's own permission prompt is the phone's, not a screen of this app." },
      { key: "client-capture", screen: "Snap All from the customer's phone", standalone: true, do: async (s) => {
          await s.reset(); await s.go(`#/clientlink/${D}`); await s.click("[data-snapall]", { wait: 600 }); },
        action: "Shutter, or Gallery",
        notes: "The same screen reached from the customer's Add documents: no dealership band and no role control (PI-005), because this is the customer's own page. The marked Demo · advisor view is the trainer's way back; Close returns to the customer's list." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "doc-review", area: "19-document-review", title: "Document Review (advisor)",
    description: "A viewer, not another Deal Jacket screen: the document takes the viewport, the deal context is quiet, and an exception appears only when it affects the document on screen. A missing license side is named inline with one action to fix it.",
    entry: { from: "deal-jacket/completed-bucket", action: "Tap a received customer document, then View" },
    steps: [
      { key: "front-only", screen: "Front received, back needed",
        do: async (s, ctx) => { await s.reset();
          await ev(s, `const j = Store.deal("${D}").jacket; delete j.client["form-license"]; clientPhotosSet("${D}", "form-license", []);`);
          await s.go(`#/clientlink/${D}`);
          await s.upload('[data-upload-input="form-license"]', [ctx.photos[0]]);
          await s.hash(`#/docreview/${D}/form-license`);
          /* the CLIENT LINK toasts the blocked upload; it is not this screen
             speaking, but it is still on screen for two seconds and would sit
             across the status card in the capture */
          await wait(2100); },
        action: "Tap Add missing back", next: "add-back",
        notes: "The missing side is stated on the status card, never toasted, and a front-only license is not called verified." },
      { key: "add-back", screen: "Add back of driver's license",
        do: async (s) => { await s.click("#drvAdd", { wait: 420 }); },
        /* the label names the branch this capture actually follows. It used
           to say "Scan the back" while the next screen was the state the
           OTHER branch produces, so the flow promised the advisor path and
           documented the customer one (review find). */
        action: "Send the secure upload link", next: "complete",
        notes: "Two choices only: capture the side on this device, or send the secure link the customer uploads through. This capture follows the link." },
      { key: "complete", screen: "Both sides received",
        /* TWO things this step must not do, both learned the hard way.
           s.go() RELOADS, and the captured photos live only in memory, so
           going to the client link here wiped the front that step 1 put
           there — the second upload started from nothing and this screen
           re-shot the front-only state, byte for byte. And the input is a
           single-file camera input (no [multiple]), so handing it two files
           at once yields ONE page, not two: the back is a second upload
           event, in the same page life. */
        do: async (s, ctx) => { await s.eval(`(() => { const b = document.querySelector("[data-sheet-close]"); if (b) b.click(); return true; })()`);
          await s.hash(`#/clientlink/${D}`);
          await s.upload('[data-upload-input="form-license"]', [ctx.photos[1]]);
          await s.hash(`#/docreview/${D}/form-license`);
          await wait(2100); },
        action: "Tap Mark reviewed", next: "reviewed",
        /* the two rows RP-UI-030 asked for, asserted rather than assumed: Source
           is where the sides came from — both from the customer here — and
           Verification is what checked them. The empty string is "as expected". */
        expect: async (s) => { const rows = await s.eval(`[...document.querySelectorAll(".rp-kv__row")].map(d => d.querySelector("span").textContent.trim() + ": " + d.querySelector("span:last-child").textContent.trim()).filter(x => /^(Source|Verification):/.test(x)).join(" | ")`); /* Verification reads Not verified until someone reviews it (Codex LS-116: two revision-bound sides and an explicit review) */ return rows === "Source: Customer upload | Verification: Not verified" ? "" : "the status card rows read " + JSON.stringify(rows); },
        notes: "The missing side lands in place — no separate success page, whichever branch delivered it — and both sides stay reviewable." },
      { key: "reviewed", screen: "License reviewed — the dock is gone",
        do: async (s) => { await s.click("#drvReview", { wait: 900 }); await clearToast(s); },
        action: "← Deal Jacket", next: "deal-jacket/jacket-overview",
        expect: async (s) => { const t = (await s.text("#view section[aria-label='Document status'] .rp-row__title")).trim(); if (t !== "License reviewed") return "the status should read License reviewed, got " + JSON.stringify(t); return (await s.exists("#view .rp-dock")) ? "the dock should be gone once the document is complete" : null; },
        notes: "Mark reviewed records this buyer's review — separately from verification — and with nothing left to do the dock disappears; Close in the top bar is the one way back to the jacket." },
      { key: "document-actions", screen: "Document actions (overflow sheet)",
        do: async (s) => { await s.click("#drvMore", { wait: 400 }); },
        action: "Tap Zoom", next: "zoomed",
        branches: [{ action: "Replace license images", to: "doc-review/add-back" }],
        expect: async (s) => ((await s.text("#drvSheet .rp-sheet__title")).trim() === "Document actions" && await s.exists("#drvZoom")) ? null : "the overflow should carry the secondary actions",
        notes: "The secondary actions live behind one link under the document: replace the license images, and zoom for anyone who cannot double-tap. Neither Back nor the primary is repeated here." },
      { key: "zoomed", screen: "Zoomed in on the document",
        do: async (s) => { await s.click("#drvZoom", { wait: 450 }); },
        action: "Double-tap to zoom back out", next: null,
        expect: async (s) => { const tf = await s.eval(`(document.querySelector(".document-review-image") || {}).style?.transform || ""`); return /scale\(1\.[1-9]/.test(tf) ? null : "the document should be enlarged (" + tf + ")"; },
        notes: "Zoom is a gesture — double-tap the document — with this explicit way in from the overflow. The document grows in place; the status card and the chips stay where they were." },

      /* ---- the viewer's other states (lib/coverage, 2026-09-22) ---- */
      { key: "requested", screen: "Requested — nothing received yet", standalone: true,
        do: async (s) => { await s.reset();
          await ev(s, `const d = Store.deal("${D}"); delete jacketOf(d).client["form-license"]; jacketSendRequest(d, ["form-license"]);`);
          await s.go(`#/docreview/${D}/form-license`); },
        action: "Tap Add front (scan it, or send the link again)", next: "add-back",
        expect: async (s) => {
          const chips = await s.eval(`[...document.querySelectorAll("#view .rp-chip[data-side]")].map(e => e.textContent.trim()).join(" / ")`);
          if (/Received/.test(chips) || chips.split(" / ").length !== 2) return "both sides offered and neither Received before an upload, got: " + chips;
          if (await s.exists("#drvViewer img.document-review-image")) return "no image should be shown for a bare request";
          const t = (await s.text("#view section[aria-label='Document status'] .rp-row__title")).trim();
          return t === "Front needed" ? null : "the status should name the first missing side, got " + JSON.stringify(t);
        },
        notes: "The secure link went out and the customer has sent nothing: both sides are offered, neither reads Received, no image, no source claimed. A request is not a receipt." },
      { key: "preview-unavailable", screen: "Front received — preview unavailable after a reload", standalone: true,
        do: async (s, ctx) => { await s.reset();
          await ev(s, `const j = Store.deal("${D}").jacket; delete j.client["form-license"]; clientPhotosSet("${D}", "form-license", []);`);
          await s.go(`#/clientlink/${D}`);
          await s.upload('[data-upload-input="form-license"]', [ctx.photos[0]]);
          /* s.go RELOADS: the receipt record survives, the photo itself does not */
          await s.go(`#/docreview/${D}/form-license`); },
        action: "Tap Add missing back", next: "add-back",
        expect: async (s) => (await s.exists("#drvViewer .rp-empty") && (await s.text("#drvViewer")).includes("Only the receipt record is saved between sessions.")) ? null : "the honest placeholder should stand in for the photo",
        notes: "Only the receipt record is saved between sessions, so after a reload the front is still credited as received while an honest placeholder stands where the photo was — the status card and the one action are unchanged." },
      { key: "advisor-back", screen: "Both sides — the customer's front, the advisor's back", standalone: true,
        /* the Source row is the point of this picture and it sits under the
           fold, so the shot is taken where a person scrolls to read it */
        focus: "#view .rp-kv",
        do: async (s, ctx) => { await s.reset();
          await ev(s, `const j = Store.deal("${D}").jacket; delete j.client["form-license"]; clientPhotosSet("${D}", "form-license", []);`);
          await s.go(`#/clientlink/${D}`);
          await s.upload('[data-upload-input="form-license"]', [ctx.photos[0]]);
          await s.hash(`#/docreview/${D}/form-license`); await wait(2100);
          await s.click("#drvAdd", { wait: 420 });
          await s.upload("#drvFile", [ctx.photos[1]], { wait: 900 }); await clearToast(s); },
        action: "Tap Mark reviewed", next: "reviewed",
        expect: async (s) => { const rows = await s.eval(`[...document.querySelectorAll(".rp-kv__row")].map(d => d.querySelector("span").textContent.trim() + ": " + d.querySelector("span:last-child").textContent.trim()).filter(x => /^Source:/.test(x)).join(" | ")`); return rows === "Source: Customer upload + advisor capture" ? null : "the source row should name both hands, got " + JSON.stringify(rows); },
        notes: "The other branch of Add missing back: Scan back now on this phone. The back lands in place like the customer's would, and the Source row now says who supplied each side — the customer's front is never relabelled by the advisor's capture." },
      { key: "insurance-page", screen: "Auto Insurance Card — pages, not sides", standalone: true,
        do: async (s, ctx) => { await s.reset();
          await s.go(`#/clientlink/${D}`);
          await s.upload('[data-upload-input="form-insurance"]', [ctx.photos[2] || ctx.photos[0]]);
          await s.hash(`#/docreview/${D}/form-insurance`); await wait(2100); },
        action: "← Deal Jacket", next: "deal-jacket/jacket-overview",
        expect: async (s) => { const t = (await s.text("#view .rp-topbar__title")).trim(), h = (await s.text("#drvTitle")).trim(); if (t !== "John Smith" || h !== "Auto Insurance Card (Binder)") return "the top bar should name John and the page's title the document (W-101), got " + JSON.stringify([t, h]); const chips = await s.eval(`[...document.querySelectorAll("#view .rp-chip[data-side]")].map(e => e.textContent.trim()).join(" / ")`); return /Front|Back/.test(chips) ? "an insurance card has pages, not sides: " + chips : null; },
        notes: "The same viewer for a single-page document: John's name in the top bar and the card as the page's title (W-101), the one page numbered rather than called a front, and no second side asked for." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "print-center", area: "20-print-center", title: "Documents — Print Center & Printables",
    description: "The owner's Print Center V2 (2026-08-30). A print center is a document utility, not a dashboard: the deal in two quiet lines, one dominant Print full packet action, then two grouped lists — Deal packet and Additional forms — whose rows are themselves the tap target. Status appears only where a document is NOT ready, so a finished deal shows no badges at all. Preview is deliberately sparse: one toolbar with Back and a single Print / PDF, then the paper. The MV-82 recreation keeps its TRAINING SAMPLE treatment.",
    entry: { from: "finance-menu/final-review", action: "Tap Open on Print center" },
    steps: [
      { key: "print-center", screen: "Documents", do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.menu.selectedProgram = "preferred"; d.menu.initials = "JS"; d.menu.ackSigned = true; d.testDrive.done = true; d.testDrive.signed = true; d.forms.selected = ["reg","privacy","odometer"]; d.forms.finalized = true; d.stage = "complete";`); await s.go(`#/forms/${D}`); }, action: "Tap Print full packet", next: "packet-sheet",
        branches: [{ action: "Tap any document row", to: "print-center/print-preview" }],
        notes: "Rows are fully tappable — no per-row 'Preview & print' link, and no repeated Ready badge. Every document here is ready, so no status pill appears at all." },
      { key: "packet-sheet", screen: "Print full packet (sheet)", do: async (s) => { await s.click("#pcPacket"); }, action: "Cancel, then look at a deal with gaps", next: "documents-exceptions",
        notes: "The count in the button is the packet: index, count and packet all read one list." },
      { key: "documents-exceptions", screen: "Documents — two documents not ready", do: async (s) => { await s.click("#pcSheet [data-sheet-close]", { wait: 250 }); await ev(s, `const d = Store.deal("${D}"); d.basePayment = null; d.testDrive.done = false; d.testDrive.signed = false;`); await s.go(`#/forms/${D}`); }, action: "Tap Base Payment Agreement", next: "print-preview",
        notes: "Status is an exception, never a badge on every row: Unsigned and Not started appear, the rest stay quiet." },
      { key: "print-preview", screen: "Preview — Base Payment Agreement", do: async (s) => { await ev(s, SIGNED_OFF + ` d.testDrive.done = true; d.testDrive.signed = true;`); await s.hash(`#/print/${D}/agreement`); }, action: "Back to Documents; open the MV-82", next: "print-mv82",
        notes: "One compact toolbar and the paper. No role switch, no Buyer/Jacket chips, and no second Print control at the bottom." },
      { key: "print-mv82", screen: "Preview — MV-82 (training sample)", do: async (s) => { await s.hash(`#/print/${D}/form-reg`); }, action: "Back; open Repayment Options", next: "print-repayment" },
      { key: "print-repayment", screen: "Preview — Repayment Options", do: async (s) => { await ev(s, `const d = Store.deal("${D}"); d.menu.selectedProgram = "preferred"; d.menu.initials = "JS"; d.menu.ackSigned = true;`); await s.hash(`#/print/${D}/repayment`); }, action: "Back; open the Deal Cover Sheet", next: "print-cover",
        notes: "The menu record: what was purchased, what was declined, and the acknowledgement signature. Every price sits in a right-aligned column — a long product label wraps inside the label column and never displaces its amount (RP-UI-008, fixed 2026-08-30)." },
      /* every printable the Documents list can open gets its own picture (lib/coverage,
         2026-09-22) — the seed deal is finished, so each one prints with real figures */
      { key: "print-cover", screen: "Preview — Deal Cover Sheet", do: async (s) => { await s.hash(`#/print/${D}/cover`); }, action: "Back; open the Test Drive Agreement", next: "print-testdrive",
        notes: "The first page of the packet: deal type and stage, the payment, the trade, who signed off, and the documentation checklist the Team Lead ticks." },
      { key: "print-testdrive", screen: "Preview — Test Drive Agreement", do: async (s) => { await s.hash(`#/print/${D}/testdrive`); }, action: "Back; open the Delivery Checklist", next: "print-delivery",
        notes: "The same agreement the customer signed on the phone before the drive, on paper for the folder." },
      { key: "print-delivery", screen: "Preview — Delivery Checklist", do: async (s) => { await s.hash(`#/print/${D}/delivery`); }, action: "Back; open Applied Rebates", next: "print-rebates",
        notes: "Every form the catalog knows, grouped, with a tick beside the ones chosen on the finance menu — the three ticked here are the three the Documents list prints." },
      { key: "print-rebates", screen: "Preview — Applied Rebates", do: async (s) => { await s.hash(`#/print/${D}/rebates`); }, action: "Back; open the Privacy Policy", next: "print-form-privacy",
        notes: "This row only exists when the deal carries a rebate; a deal with none has no rebate sheet and one document fewer in the packet." },
      { key: "print-form-privacy", screen: "Preview — Privacy Policy (additional form)", do: async (s) => { await s.hash(`#/print/${D}/form-privacy`); }, action: "Back; open the Odometer Disclosure", next: "print-form-odometer",
        notes: "An additional form from the catalog: a generic sheet headed with the form's name and its group. The MV-82 is the one form with its own drawn recreation." },
      { key: "print-form-odometer", screen: "Preview — Odometer Disclosure Statement (additional form)", do: async (s) => { await s.hash(`#/print/${D}/form-odometer`); }, action: "Back to Documents; Print full packet → Open the packet", next: "print-packet",
        notes: "The trade-in form, printed the same generic way." },
      { key: "print-packet", screen: "Preview — the full packet", do: async (s) => { await s.go(`#/forms/${D}`); packetPromised = Number(((await s.text("#pcPacket")).match(/(\d+) docs?/) || [])[1] || 0); await s.click("#pcPacket", { wait: 300 }); await s.click("#pcSheet .rp-primary", { wait: 600 }); },
        expect: async (s) => { const n = await s.eval(`document.querySelectorAll(".pc-printroot .print-doc").length`); return packetPromised > 0 && n === packetPromised ? "" : `the packet prints ${n} documents, not the ${packetPromised} the button promised`; },
        notes: "Open the packet prints every document the list shows, in list order, with a page break between each — the button's count, the list and the paper are one list. The picture is the start; the scroll capture holds the rest." },
      { key: "documents-quote", screen: "Documents — with a saved quote (10 docs)", scenario: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.menu.selectedProgram = "preferred"; d.menu.initials = "JS"; d.menu.ackSigned = true; d.testDrive.done = true; d.testDrive.signed = true; d.forms.selected = ["reg","privacy","odometer"]; d.forms.finalized = true; d.stage = "complete"; d.quotes = [{ at: new Date().toISOString(), stock: d.stock, dealType: d.dealType, summary: RIDE_PRICE_CALC.calc(d, Store.vehicle(d.stock)).payment }];`); await s.go(`#/forms/${D}`); },
        expect: async (s) => { const t = await s.text("#pcPacket"); return /10 docs/.test(t) ? "" : `the packet button reads "${t.trim()}"`; },
        action: "Tap Saved Quote", next: "print-quote",
        notes: "A quick quote saved during the visit joins the Deal packet as a tenth row, and the button counts it — the packet prints it too." },
      { key: "print-quote", screen: "Preview — Saved Quote", do: async (s) => { await s.click(`a[href="#/print/${D}/quote"]`, { wait: 500 }); }, action: null, next: null,
        notes: "The follow-up quote as it was emailed: vehicle, deal type and the estimated figure — with the line that a quote is never something to buy from." },
      { key: "documents-bare", screen: "Documents — no rebates, no forms (5 docs)", scenario: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.menu.selectedProgram = "preferred"; d.menu.initials = "JS"; d.menu.ackSigned = true; d.testDrive.done = true; d.testDrive.signed = true; d.trade.rebates = 0; d.forms.selected = []; d.forms.finalized = true; d.stage = "complete";`); await s.go(`#/forms/${D}`); },
        expect: async (s) => { const t = await s.text("#pcPacket"); return /5 docs/.test(t) && await s.exists(".rp-empty") ? "" : `the packet button reads "${t.trim()}"`; },
        action: null, next: null,
        notes: "The smallest packet: the five core documents, no rebate sheet, and and the Additional forms group saying no forms were selected." },
      { key: "print-packet-cash", screen: "Preview — the packet on a cash deal", scenario: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.menu.selectedProgram = "preferred"; d.menu.initials = "JS"; d.menu.ackSigned = true; d.testDrive.done = true; d.testDrive.signed = true; d.forms.selected = ["reg","privacy","odometer"]; d.forms.finalized = true; d.stage = "complete"; d.dealType = "cash"; d.basePayment.snapshot = RIDE_PRICE_CALC.calc(d, Store.vehicle(d.stock));`); await s.go(`#/print/${D}/packet`); },
        expect: async (s) => { const t = await s.eval(`document.body.textContent`); return /NaN|undefined|Infinity/.test(t) ? "the cash packet shows NaN / undefined" : /Total Due/.test(t) ? "" : "the cover sheet does not read Total Due"; },
        action: null, next: null,
        notes: "The same packet when the customer pays cash: the cover reads Total Due instead of a monthly payment, and the rebate sheet drops its 'amount financed' line. Every figure still prints — no NaN on cash, lease or one-pay." },
      { key: "documents-vehicle-gone", screen: "Funded deal whose vehicle left the catalog — lands on the jacket", standalone: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.menu.selectedProgram = "preferred"; d.menu.initials = "JS"; d.menu.ackSigned = true; d.testDrive.done = true; d.testDrive.signed = true; d.forms.selected = ["reg","privacy","odometer"]; d.forms.finalized = true; d.stage = "complete"; d.stock = "GONE-9999";`); await s.go(`#/forms/${D}`); },
        expect: async (s) => { const h = await s.eval(`location.hash`); return h.includes("/jacket/") ? "" : `landed on ${h}`; },
        action: null, next: null,
        notes: "A funded contract cannot be priced again, so Documents, any preview and the packet all send it to its record, the Deal Jacket — never to vehicle selection, which would offer to hang a new unit on a signed deal." },
      { key: "documents-open-vehicle-gone", screen: "Open deal whose vehicle left the catalog — sent to choose one", standalone: true, do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF + ` d.testDrive.done = true; d.testDrive.signed = true; d.forms.selected = ["reg","privacy","odometer"]; d.stage = "forms"; d.stock = "GONE-9999";`); await s.go(`#/forms/${D}`); },
        expect: async (s) => { const h = await s.eval(`location.hash`); return h.includes("/vehicles/") ? "" : `landed on ${h}`; },
        action: null, next: null,
        notes: "The other half of the rule: a deal still in progress can be repaired, so Documents sends it to pick a vehicle instead of showing an empty list." },
    ] },
];

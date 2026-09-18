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
const wait = (ms) => new Promise(r => setTimeout(r, ms));
/* the toast of the step before is not part of this screen: three v022 captures
   had one covering the very line the screen exists to show. toast() recreates
   the node on its next call, so removing it costs nothing. */
/* the role control appears only in Customer Onboarding (owner ruling B,
   2026-09-18): a flow that needs another role switches there and comes back */
const switchRole = async (s, role, back) => { await s.go("#/customers"); await s.click(".rp-role", { wait: 300 }); await s.click(`.rp-sheet:not([hidden]) [data-role="${role}"]`, { wait: 500 }); if (back) await s.go(back); };
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
/* mutate state WITHOUT re-rendering — the current route may still be the previous
   flow's screen, and some routes write state when they render (the presentation
   forces menu.step = 2). Every ev() is followed by s.go(), which reloads the app. */
const ev = (s, js) => s.eval(`(() => { ${js}; Store.save(); return true; })()`);

/* a recognisable license barcode image, rendered from the app's own Training
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
       page: the licence lives in its pair row's PREVIEW sheet, and the only
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
const MENU_READY = `
  const d = Store.deal("${D}");
  d.creditApp = { approved: true, customerId: d.customerId, coBuyerId: null /* Codex 9c5501d: an approval names its applicants */, submitted: new Date().toISOString(), lender: "US Bank", qualifiedApr: 3.9, leaseFactor: 0.00087, employer: "Demo Co" };
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
        branches: [{ action: "Tap a deal row", to: "desking/huddle-gate" }, { action: "Tap New visit", to: "onboarding/resolver-idle" }, { action: "Tap the scan button beside the search", to: "license-scan/scan-front" }, { action: "Tap Inventory / Customers in the bottom nav", to: "vehicles/inventory-browse" }],
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
        notes: "Funded contracts appear only behind the date control, labelled with the window they belong to." },
      { key: "advisor-completed", screen: "Advisor — completed deal ends the list", do: async (s) => { await switchRole(s, "advisor", "#/deals"); },
        action: "Tap the completed deal", next: "finance-menu/deal-finalized",
        notes: "The Advisor has no history control: their funded deals sit under a Completed label at the end of the one list, with no Next line — search still finds them." },
      /* the seed already puts John in the showroom, so setting his visit here
         re-shot the landing byte for byte (v022 audit). A SECOND guest, with no
         vehicle chosen, is the state the landing does not show. */
      { key: "showroom-visit", screen: "In showroom — an active visit", do: async (s) => { await s.reset(); await ev(s, `(() => { const d = JSON.parse(JSON.stringify(Store.deal("${D}"))); d.id = "d-show"; d.dealNo = "48277"; d.customerId = "c-demo2"; d.stage = "discovery"; d.stock = null; d.vehicle = null; d.createdAt = new Date().toISOString(); const at = new Date(); at.setHours(11, 52, 0, 0); d.visit = { arrivedAt: at.toISOString() }; Store.s.deals.push(d); })();`); await s.go("#/deals"); },
        action: "Tap the showroom row", next: "discovery/question-1",
        notes: "A second guest, logged in with no vehicle chosen: her row reads the name and the arrival and nothing else — no vehicle placeholder, ever (owner rule 2026-08-23, reasserted 2026-08-28). Presence is a state the advisor sets by finishing the resolver, never the deal’s stage (chrome rule v022 §10): John is in the showroom AND his deal is Desking, so he appears in both lists." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "onboarding", area: "02-customer-onboarding", title: "Customer Onboarding — the Customer Resolver",
    description: "One resolver everywhere Ride Price needs a person (owner's onboarding v3 package, 2026-08-28): one universal search over name, phone, email or license number, then the two license paths — scan the physical card, or send the customer a secure upload link. There is no top-level Create Customer; manual entry survives only as the stated fallback when there is neither a license nor a usable photo. A found customer is confirmed together with their registration address, which is sourced, one-tap confirmed, and never silently overwritten.",
    entry: { from: "home/deals-queue", action: "Tap New visit" },
    steps: [
      { key: "resolver-idle", screen: "Find customer — the resolver", do: async (s) => { await s.reset(); await s.go("#/customers"); }, action: "Type 'Smith', tap Search", next: "search-results",
        branches: [{ action: "Scan physical license", to: "license-scan/scan-front" }, { action: "Send secure upload link", to: "onboarding/send-link-sheet" }, { action: "Tap a recent customer", to: "onboarding/customer-found" }],
        notes: "Search first, then the two license paths as full-width action rows, then recent customers — which appear only in this idle state. Ride Price searches existing profiles before anything is created." },
      { key: "search-results", screen: "Search results", do: async (s) => { await s.type("#obSearch", "Smith"); await s.click("#searchBtn", { wait: 400 }); }, action: "Tap the customer", next: "customer-found-open-visit",
        notes: "One field takes a name, phone, email or license number — the advisor does not have to know which identifier they hold." },
      { key: "customer-found-open-visit", screen: "Customer found — already in the showroom", do: async (s) => { await s.click("[data-found]", { wait: 300 }); }, action: "Tap Continue John's visit", next: "desking/huddle-gate",
        notes: "Since PR #107 (D-HN10 B with the owner's showroom protocol): a customer with an open visit is offered that visit, never a second one. In the showroom Continue is the only action; once the visit has ended a 'Start a new visit anyway' link appears under it." },
      { key: "customer-found", screen: "Customer found — confirm + registration address", standalone: true, do: async (s) => { await s.go("#/deals"); await s.go("#/customers"); await s.type("#obSearch", "Bridwell"); await s.click("#searchBtn", { wait: 400 }); await s.click("[data-found]", { wait: 300 }); }, action: "Tap Confirm address & start visit", next: "discovery/question-1",
        branches: [{ action: "Use a different address", to: "onboarding/address-sheet" }],
        notes: "The customer and the registration address are confirmed in ONE decision region; the way back is the task's close control. The address is marked Required — and named as the CRM's when it came from a match — because it feeds registration, tax calculations, credit and paperwork — confirming here means nobody is asked to type it again." },
      { key: "address-sheet", screen: "Use a different address (sheet)", do: async (s) => { await s.click("#obOtherAddr", { wait: 300 }); await s.type("#obSheetAddr", "12 Main St, Astoria, NY 11106"); },
        action: "Pick the standardized address", next: "discovery/question-1",
        notes: "ONE address search field — never separate street / city / state / ZIP boxes. The demo standardizes against its own ZIP table and offers the result to tap; an unparseable string is refused rather than guessed at." },
      { key: "role-sheet", screen: "Switch role — only in Customer Onboarding", standalone: true, do: async (s) => { await s.go("#/deals"); await s.go("#/customers"); await s.click(".rp-role", { wait: 300 }); }, action: "Choose Team Lead", next: "home/team-lead-floor",
        notes: "Owner ruling 2026-09-18 (\"B The codex way\"): the role control appears ONLY here, in Customer Onboarding — never on Home or any other screen, never inside Scan License. Home's band still says who is acting, with no Switch." },
      { key: "no-match", screen: "Search results — no match", do: async (s) => { await s.go("#/customers"); await s.type("#obSearch", "Zzz"); await s.click("#searchBtn", { wait: 400 }); }, action: "Tap 'No license available · add manually'", next: "manual-fallback",
        notes: "A miss names the other paths rather than jumping straight to a create form." },
      { key: "manual-fallback", screen: "No license available — manual fallback", do: async (s) => { await s.click("#obManual", { wait: 300 }); }, action: "Fill the four fields, tap Confirm & start visit", next: "discovery/question-1",
        notes: "The task title and four fields — no helper copy on the kit (chrome rule v022). The two rules hold in validation rather than on the screen: use a license or a license photo if one turns up, and both contact channels are required (RP-UI-043 records the copy that left)." },
      { key: "send-link-sheet", screen: "Send secure upload link (sheet)", do: async (s) => { await s.go("#/customers"); await s.click("#obSendLink", { wait: 300 }); }, action: "Pick Text or Email, enter that contact, tap Send secure link", next: "waiting-for-customer",
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
          await s.go("#/customers"); },
        action: "Tap Start visit", next: "discovery/question-1",
        notes: "The advisor sees the finished session with its progressive statuses — and the second license side stays an honest Pending line rather than blocking the visit. The confirmed registration address carries onto the record." },
    ] },

  /* ------------------------------------------------------------ */  { id: "license-scan", area: "03-license-scan", title: "Scan Driver's License",
    description: "The prop-license scanner on the owner's UI kit (package v023, 2026-09-05): twelve screens as a kit Task inside New visit — Close returns to the resolver, the title carries the two-part step, and the DEMO band is the only environment marker. The advisor still experiences two decisions — capture the license, then confirm the customer — and everything else is automation or an exception sheet in the kit's own sheet. Only the five printed training props can ever be recognised. Prop 1 matches a seed customer by name (ambiguous → the same-person question as two option rows), prop 2 carries a license on file (certain match), 3–5 create new customers. Phone AND email are both required on every record; the scan asks for no credit score.",
    entry: { from: "onboarding/resolver-idle", action: "Tap Scan physical license" },
    steps: [
      { key: "scan-front", screen: "Scan — front of license", do: async (s) => { await s.reset(); await s.go("#/customers"); await s.click("#scanBtn", { wait: 400 }); }, action: "Take / choose the front photo", next: "scan-review-front",
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
      { key: "scan-manual-result", screen: "Manual search — customer found", do: async (s) => { await s.type("#mnNum", "T-0000102"); await s.click("#mnGo", { wait: 400 }); }, action: "Tap Use", next: "discovery/question-1",
        branches: [{ action: "No match · create new customer", to: "onboarding/manual-fallback" }],
        notes: "A hit is a result row with the kit's navy Use action; a miss is the kit's empty state saying plainly that nothing on file carries that number, with the create path under it. Use hands the found customer straight to the visit — the licence was never read, so there is nothing to confirm against it." },
      { key: "scan-confirm", screen: "Confirm customer (certain match)", do: async (s, ctx) => {
          /* a clean store: an unfinished scan left by an earlier step is a saved draft now (Codex Phase 52), and the scanner would open its resume card */
          await s.reset(); const png = await barcodePng(s, 2);
          await s.go("#/customers"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); },
        action: "Tap Confirm & continue", next: "scan-done",
        branches: [{ action: "This isn't Cheri", to: "license-scan/scan-new-customer" }],
        expect: async (s) => {
          const t = await s.text("#scanBody");
          if (!t.includes("License match")) return "the match tag should state the real basis (License match)";
          if (!t.includes("Updates from this license · 2") || !t.includes("Cheri L Bridwell") || !t.includes("11/02/2031")) return "the updates group should list what this licence changes — the middle initial on the name and the renewed expiry — and nothing else";
          return null;
        },
        notes: "Identity is the hero and the tag states the REAL match basis, never an invented confidence. Contact completeness is a step row. The updates group lists ONLY what the license changes: the seed gives Cheri's record the prop's own address and number, so the updates are the middle initial the licence carries and the renewed expiry — when nothing changed at all, there is no group." },
      { key: "scan-ambiguous", screen: "Confirm customer (ambiguous — prop 1)", scenario: true, do: async (s, ctx) => {
          /* a clean store: an unfinished scan left by an earlier step is a saved draft now (Codex Phase 52), and the scanner would open its resume card */
          await s.reset(); const png = await barcodePng(s, 1);
          await s.go("#/customers"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); },
        action: "Choose 'Different guest — create new', tap Continue", next: "scan-new-customer",
        notes: "When the match is only a guess the screen asks the same-person question outright, as two option rows over one Continue, and shows the scanned license beside the record so the two can actually be compared. Nothing is ever merged silently." },
      { key: "scan-new-customer", screen: "New customer (prop 3)", do: async (s, ctx) => {
          /* a clean store: an unfinished scan left by an earlier step is a saved draft now (Codex Phase 52), and the scanner would open its resume card */
          await s.reset(); const png = await barcodePng(s, 3);
          await s.go("#/customers"); await s.click("#scanBtn", { wait: 300 });
          await captureBoth(s, ctx.photos[0], png); await confirmPair(s); await clearToast(s); },
        action: "Type the number already on file, tap Create customer", next: "scan-conflict",
        notes: "Identity is a READ-ONLY summary from the license — the advisor never retypes card data. The only asks are what a license cannot say: phone and email. No credit score at the door; the record starts at the neutral default." },
      { key: "scan-conflict", screen: "Phone already in use (sheet)", do: async (s) => { await ev(s, `Store.customer("c-demo4").license = structuredClone(RIDE_PRICE_SCAN.personaFor(3).license)`); await s.type("#svPhone", "(646) 555-0900"); await s.click("[data-save]", { wait: 600 }); await s.click('#scSheet [data-opt="link"]', { wait: 200 }); },
        action: "Choose 'Verify the number and link this license', tap Continue", next: "scan-verify-code",
        branches: [{ action: "Keep profiles separate", to: "license-scan/scan-done" }, { action: "Use a different number", to: "license-scan/scan-new-customer" }],
        expect: async (s) => {
          const t = await s.text("#scSheet");
          if (!t.includes("Marcus Alvarez")) return "the conflict should name whose profile holds the number";
          if (!t.includes("secure upload link")) return "and how that profile came to be — it was created by his own link";
          return null;
        },
        notes: "No license carries a phone number, so this compares the number just TYPED against the record already holding it — and the seed makes that record Marcus's own, created by the secure upload link he completed before any scan. The notice says whose profile it is and where it came from; two option rows and one primary follow. Nothing merges until the number is verified. Linking is offered only when that record already carries the same issuer and licence number (Codex dbd80c0, identity safeguards) — name and phone alone never link two people, and then the choice has no default; the capture seeds Marcus's record with his licence to show that path." },
      { key: "scan-verify-code", screen: "Verify the phone number (sheet)", do: async (s) => { await s.click("[data-continue]", { wait: 1400 }); }, action: "Tap Verify & link", next: "scan-done",
        expect: async (s) => {
          const t = await s.text("#scSheet");
          if (t.includes("would read") || t.includes("Demo:")) return "the demo-code sentence is back on the verify sheet";
          const filled = Number(await s.eval(`Array.from(document.querySelectorAll("#scSheet .rp-code__box")).map(b => b.textContent).join("").length`));
          if (filled !== 6) return "in demo mode the six boxes fill themselves about a second after the sheet opens; got " + filled + " digits";
          return null;
        },
        notes: "Linking overwrites an existing record off a typed number, so it is gated: six boxes, and a wrong code merges nothing. In demo mode the text 'arrives' about a second after the sheet opens and the boxes fill themselves — the code is shown nowhere else, and the rehearsal reads like the real thing (owner's decision, v023)." },
      { key: "scan-done", screen: "Customer ready", do: async (s) => { await s.click("[data-verify]", { wait: 700 }); await clearToast(s); },
        action: "Tap Continue to visit", next: "discovery/question-1",
        branches: [{ action: "Scan another license", to: "license-scan/scan-front" }],
        expect: async (s) => {
          const one = Number(await s.eval(`Store.s.customers.filter(function (x) { return x.last === "Alvarez"; }).length`));
          if (one !== 1) return "the verified code should link onto Marcus's own record, not write a second — found " + one;
          const t = await s.text("#scanBody");
          if (!t.includes("malvarez@testing.com")) return "his own email should survive a link where none was typed";
          return null;
        },
        notes: "Completion is LOCAL feedback on the confirmation surface — the kit's success notice, the customer, and the visit as the dominant next action, with no full-screen ceremony. The verified code linked the scanned licence onto the profile the link created: one Marcus, his own email kept. Continue to visit is the check-in moment. Scan another restarts in place for the advisor with two guests at the desk." },
    ] },

  { id: "training", area: "04-training-materials", title: "Training Documents",
    description: "One hub for both printable prop sets, on the owner's UI kit (package v024, 2026-09-05): a sub-destination under More — the Destination skeleton with the More tab active, the wordmark (no role control — it appears only in Customer Onboarding, owner ruling B), the DEMO band, and the floating tab bar as the way around. Five training driver's licenses (the only things the scanner recognises) and their five matching registrations, as compact pair rows; the document itself appears only inside its preview sheet — scaled to the phone, printed at true millimetre size.",
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
        notes: "A place, not a task: the count line replaces the lede, the segmented control is the kit's, Print all 5 is the kit's pill in the title row, and each pair is a row with the pair number as a text tile. The 'not valid' wording stays on the printed props themselves, where it belongs — that is artwork, not interface copy." },
      { key: "license-preview", screen: "License preview — both sides", do: async (s) => { await s.click('[data-pair="1"]', { wait: 420 }); }, action: "Close", next: "registrations",
        expect: async (s) => {
          if (!await s.exists("#tdocSheet .rp-sheet__sub")) return "the sheet should carry the pair as its subtitle line";
          const n = Number(await s.eval(`document.querySelectorAll("#tdocSheet button").length`));
          if (n !== 2) return "one primary and the × close, no outlined Close button — found " + n + " buttons";
          return null;
        },
        notes: "A licence prop is two sides: the back carries the barcode, and that barcode is the only thing the scanner can read. The sheet names the person and the pair in its subtitle, shows both faces, and offers one primary — the × is the close." },
      { key: "registrations", screen: "Registrations", do: async (s) => { await s.click("[data-sheet-close]", { wait: 300 }); await s.click('[data-type="registration"]', { wait: 320 }); }, action: "Tap a pair row", next: "registration-preview",
        notes: "The same page, second segment: the rows now carry the registration number and the vehicle it belongs to — the customer's current car, a trade-in candidate, never the vehicle in their deal." },
      { key: "registration-preview", screen: "Registration preview", do: async (s) => { await s.click('[data-pair="1"]', { wait: 460 }); }, action: null, next: null,
        expect: async (s) => {
          const fits = await s.eval(`(function () { var w = document.querySelector(".tdoc-preview"), el = w && w.querySelector(".reg-card"); if (!el) return "no registration in the sheet"; var r = el.getBoundingClientRect(), b = w.getBoundingClientRect(); return (r.right <= b.right + 1 && r.left >= b.left - 1) ? "" : "the 112mm card spills out of its wrapper"; })()`);
          return fits || null;
        },
        notes: "RP-UI-012 stays resolved: the 112mm document is scaled to the viewport here — measured, not assumed — while printing keeps its true physical size. The scaling and the print set are all that remains of this screen's own CSS family; the chrome is the kit's." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "discovery", area: "05-discovery", title: "Discovery Session",
    description: "The week-in-the-life interview, rebuilt customer-first on the owner's V2 replication package (2026-08-31): nothing about a vehicle — year, make, model, VIN, stock or payment — appears before one has actually been selected, and the early object is a VISIT in every user-facing word. One stage-aware context row replaced the old three-row crumb block (RP-UI-005, retired with this version); everything secondary lives in the Visit details sheet. One question per screen, answers persist on every keystroke, and the hand-off states plainly that no vehicle has been selected yet.",
    entry: { from: "onboarding/customer-found", action: "Confirm address & start visit" },
    steps: [
      { key: "question-1", screen: "Discovery — question 1, customer-first", do: async (s, ctx) => { await s.reset(); await s.go("#/customers"); await s.click('[data-found="c-demo2"]', { wait: 400 }); await s.click('#obConfirm', { wait: 600 }); ctx.dealId = await s.eval(`location.hash.split("/").pop()`); },
        action: "Answer, tap Next →", next: "question-mid",
        branches: [{ action: "Tap the customer row", to: "discovery/visit-details" }, { action: "Tap the Jacket chip", to: "deal-jacket/jacket-overview" }],
        notes: "The context is ONE row — `Cheri Bridwell · Discovery` with compact Jacket access — where three stacked rows used to open with a deal number and 'no vehicle yet'. No Deal #, no vehicle, no coaching card; the eyebrow and title carry the hierarchy." },
      { key: "question-mid", screen: "Discovery — mid-interview, Back appears", do: async (s) => { for (let i = 0; i < 3; i++) { await s.type("#dvAns", "Daily commute, weekend trips upstate."); await s.click("#dvNext", { wait: 250 }); } },
        action: "Keep answering to the last question", next: "question-last",
        notes: "Back appears only after question 1, and the autosave line names where the words go — typing alone persists the answer; Next is navigation, not a save button." },
      { key: "question-last", screen: "Discovery — the last question is the hand-off", do: async (s) => { for (let i = 0; i < 8; i++) { const last = await s.eval(`document.querySelector("#dvNext").textContent.includes("Find vehicles")`); if (last) break; await s.type("#dvAns", "Two kids, one dog."); await s.click("#dvNext", { wait: 250 }); } await s.type("#dvAns", "Quiet and comfortable, good visibility."); },
        action: "Tap Find vehicles →", next: "discovery-complete",
        notes: "The final CTA is Find vehicles — wording that admits none is chosen yet, replacing 'Pick Vehicle'." },
      { key: "discovery-complete", screen: "Discovery complete (sheet)", do: async (s) => { await s.click("#dvNext", { wait: 350 }); },
        action: "Tap Find matching vehicles", next: "vehicles/inventory",
        branches: [{ action: "Back to questions", to: "discovery/question-last" }],
        notes: "Status rows, not prose: the real answer count ('7 of 7 discovery answers saved') and a Vehicle row reading Not selected yet. The stage advances on the link that navigates — Back to questions cannot strand the visit in a stage it never entered." },
      { key: "visit-details", screen: "Visit details (sheet)", scenario: true, do: async (s) => { await s.reset(); await s.go("#/customers"); await s.click('[data-found="c-demo2"]', { wait: 400 }); await s.click('#obConfirm', { wait: 600 }); await s.click("#dvVisit", { wait: 350 }); },
        action: "Tap Done", next: "question-1",
        branches: [{ action: "Tap Co-buyer", to: "buyers/buyers-sheet" }],
        notes: "Reached from any question by tapping the customer row. Everything the old crumb block shouted, on demand: the primary buyer with an honest three-state identity status (confirmed / licence photo on file / not verified), co-buyer as a real action, stage, visit number, registration address — and the one place that says No vehicle selected." },
      { key: "vehicle-selected", screen: "Stage-aware — a vehicle chosen upstream", scenario: true, do: async (s) => { await s.reset(); await s.go("#/discovery/d-demo1"); },
        action: null, next: null,
        notes: "The same row reports the workflow's actual state: `John Smith · 2022 Hyundai Santa Fe` once a vehicle exists — and still no VIN, stock number or payment anywhere on the screen." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "vehicles", area: "06-vehicle-selection", title: "Vehicle Selection",
    description: "Choosing the car on the owner's UI kit (package v025 r5, 2026-09-05). Inside a visit it is a Task whose top bar carries the customer's full name and nothing else — no step, no status, no deal number, because numbers exist only after F&I — and Close returns to the visit; without a visit it is the Inventory destination with the tab bar. The frame is fixed and the list scrolls inside it, the whole card is the tap target, the type chips and Filters ride a rail with the active filter count, and every secondary decision is a sheet with one primary. Vehicle contention (chrome rule §14) is never drawn here: two informational states that appear only on deal cards and in the alert at the top of My deals, and neither blocks a choice.",
    entry: { from: "discovery/discovery-complete", action: "Tap Find matching vehicles" },
    steps: [
      { key: "inventory", screen: "Vehicle search — inventory", do: async (s) => { await s.reset(); await ev(s, `var d = Store.deal("${D}"); d.stock = null; d.vehicle = null; d.stage = "vehicle";`); await s.go(`#/vehicles/${D}`); },
        action: "Tap the Used chip", next: "inventory-filtered",
        expect: async (s) => {
          const t = await s.text(".rp-topbar__title");
          if (t.trim() !== "John Smith") return "the task top bar carries the customer's full name and nothing else, got: " + t;
          if (await s.exists(".rp-topbar__title small")) return "no step line inside a visit — the page eyebrow and title name the work";
          if (await s.exists(".rp-vstatus")) return "contention is never drawn in inventory";
          return null;
        },
        notes: "Content first: the customer context card is gone — the top bar's name carries it — and the filter panel that used to own the first screen is one Filters chip on the rail. The frame is fixed; only the list scrolls." },
      { key: "inventory-filtered", screen: "Inventory — Used only", do: async (s) => { await s.click('.rp-chip[data-type="Used"]'); }, action: "Open Filters, cap the price at $1,000", next: "inventory-no-match",
        notes: "The chip rail scrolls sideways and the count line under the list heading follows the filter — one used vehicle in the seed." },
      { key: "inventory-no-match", screen: "Inventory — no vehicles match", do: async (s) => { await s.click('.rp-chip[data-type="All"]'); await s.click("#vsFilters", { wait: 250 }); await s.type("#mMaxPrice", "1000"); await s.click("#vsSheet .rp-primary[data-sheet-close]", { wait: 250 }); },
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
      { key: "vehicle-reserved", screen: "Notification — vehicle reserved", scenario: true, do: async (s) => { await s.reset(); await s.go("#/demo/vehicle-reserved"); await clearToast(s); },
        action: "Tap Choose another vehicle", next: "inventory",
        expect: async (s) => {
          const t = await s.text(".rp-alert");
          if (!t.includes("Vehicle reserved") || !t.includes("Nadia R.")) return "the alert should name the state and who signed, got: " + t;
          if (!await s.exists(".rp-card .rp-vstatus--reserved")) return "the deal card should carry the same reserved status";
          return null;
        },
        notes: "A later moment than the screens above: Nadia R.'s buyer's order on this car is signed, so every advisor with it on an open deal gets one alert at the top of My deals with a single real action, and their deal card carries the same status under the VIN line. Neither state blocks anything — John's deal stays open — and dismissing the alert leaves the card's status where it is." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "test-drive", area: "07-test-drive", title: "Test Drive Agreement",
    description: "A short active-session workflow, not a legal form on a phone: Ready → Review & sign → Drive in progress → End drive → Complete. The licence is read from the customer profile and never asked for again; additional drivers come through the one Customer Resolver.",
    entry: { from: "vehicles/next-steps", action: "Tap Test Drive" },
    steps: [
      { key: "ready", screen: "Ready to test drive", do: async (s) => { await s.reset(); await ev(s, `const d = Store.deal("${D}"); d.customerId = "c-demo2"; d.testDrive = { done: false, insurance: "Demo Mutual" }; d.stage = "testdrive";`); await s.go(`#/testdrive/${D}`); },
        action: "Tap Review & sign", next: "review-sign",
        branches: [{ action: "Add driver", to: "test-drive/add-driver" }, { action: "Complete license (when the profile's licence is missing)", to: "test-drive/license-exception" }],
        notes: "The licence row reads the customer profile. There is no test-drive licence form and no second scanner." },
      { key: "add-driver", screen: "Add another driver", do: async (s) => { await s.click("#tdAddDriver", { wait: 380 }); }, action: "Close", next: "review-sign",
        notes: "Three doors into the one Customer Resolver — search, scan, secure upload link. A name and licence number are never typed here." },
      { key: "review-sign", screen: "Review & sign", do: async (s) => { await s.click("[data-sheet-close]", { wait: 300 }); await s.click("#tdSign", { wait: 400 }); }, action: "Tick the authorization, tap Sign & start test drive", next: "in-progress",
        notes: "One sheet: the agreement's own terms, the electronic-signature authorization and the customer signature." },
      { key: "in-progress", screen: "Test drive in progress", do: async (s) => { await s.click("#tdEsign", { wait: 150 }); await s.click("#tdSignGo", { wait: 500 }); }, action: "Tap End drive", next: "end-drive",
        notes: "Reduced chrome: the vehicle, the live status, the starting odometer, the mileage limit, an elapsed clock and one action. The signed agreement is already in the Deal Jacket." },
      { key: "end-drive", screen: "End test drive — odometer", do: async (s) => { await s.click("#tdEnd", { wait: 380 }); }, action: "Tap Complete test drive", next: "completed" },
      { key: "completed", screen: "Test drive complete", do: async (s) => { await s.click("#tdComplete", { wait: 460 }); }, action: "Tap the one next step", next: "trade/trade-evaluation",
        branches: [{ action: "Calculate payment instead", to: "desking/huddle-gate" }],
        notes: "One primary action, chosen from the deal: Trade evaluation when there is a trade, Calculate payment when there is not." },
      { key: "license-exception", screen: "License needs attention", do: async (s) => { await s.reset(); await ev(s, `const c = Store.customer("c-demo1"); delete c.license; Store.deal("${D}").customerId = "c-demo1"; Store.deal("${D}").testDrive = { done: false }; Store.deal("${D}").stage = "testdrive";`); await s.go(`#/testdrive/${D}`); },
        action: "Tap Complete license — the canonical Scan License flow opens and returns here", next: null,
        notes: "The exact missing item is named. Missing, front-only and expired each say which." },
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
          await s.go(`#/trade/${D}`); }, action: "Tap Review ownership", next: "ownership-sheet",
        notes: "The seed trade is already evaluated, so the screen opens on the value state: the appraisal card with the evaluated-value hero inside it, then a small Proof of ownership card counting the answers still needed. One compact context row (customer · selected purchase vehicle · Jacket); the deal number lives in the details sheet behind it. Editing any appraisal field swaps the hero back to Run evaluation — the number on screen is never one the current inputs did not produce." },
      { key: "ownership-sheet", screen: "Proof of ownership (sheet) — conditional questions", do: async (s) => {
          await s.click("#ownBtn", { wait: 400 });
          const answer = async (key, tri) => { await s.click(`#tvSheet [data-key="${key}"] button[data-tri="${tri}"]`, { wait: 300 }); };
          await answer("titleInHand", "no"); await answer("duplicateStarted", "unsure");
          await answer("lienOnTitle", "yes"); await answer("paidOff", "no"); await answer("payoffReceived", "yes");
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
        branches: [{ action: "Calculate payment", to: "desking/huddle-gate" }, { action: "Edit ownership answers", to: "trade/ownership-sheet" }, { action: "Edit appraisal", to: "trade/trade-evaluation" }],
        notes: "The value hero stays visible; each gap is named in the amber list — the expired payoff as its own line with its date — under 'N items for Team Lead / Advisor can continue', and Calculate payment stays live: it goes to the same Desking huddle the card beside this one exits to, gaps and all, because a gap queues for Team Lead rather than blocking the advisor. Required paperwork the answers make mandatory is listed on the card." },
      { key: "ownership-complete", screen: "Trade ready — ownership review complete", do: async (s) => {
          await s.click("#ownEdit", { wait: 400 });
          const answer = async (key, tri) => { await s.click(`#tvSheet [data-key="${key}"] button[data-tri="${tri}"]`, { wait: 300 }); };
          await answer("titleInHand", "yes"); await answer("lienOnTitle", "no"); await answer("isTitledOwner", "yes");
          await s.click("#ownSave", { wait: 500 }); },
        action: "Tap Calculate payment", next: "desking/huddle-gate",
        notes: "Every root answer recorded and no follow-up left relevant: the card resolves to Ownership review complete with a green Complete badge and a View answers link." },
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
        action: "Type the vehicle, then Run evaluation", next: "trade-evaluation", standalone: true,
        notes: "A trade nobody has described yet, on a deal that is not the demo's. Every box is empty, and the grey ghost text in them states a SHAPE (YYYY, 17 characters) or names a SOURCE (Odometer) — never an example vehicle, and never the deal's own values, which at a glance are indistinguishable from a filled box. Vehicle carries no ghost at all: its label already says year make model. Model year and Mileage used to arrive pre-filled with a hard-coded 2018 and 60,000, left over from an older demo vehicle; the year is now read back out of what the advisor types in Vehicle (year make model), the mileage can be read from nothing and so is asked for, and Run evaluation names whatever is still missing rather than appraising a car whose age or use it guessed. The context row carries no vehicle because this visit has not selected one." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "desking", area: "09-desking", title: "Desking — Calculate Payments",
    description: "The owner's desking package (v029, 2026-09-04) on the UI kit: eight screens, one route, all of them the kit's Task with the customer's full name in the bar and no deal number — a worked deal has none until the lending lane pushes it to F&I. Two modes, and the difference is who is holding the phone. WORK is the advisor's: the huddle that captures the trial close in the customer's own words and the payment they named, the deal-type control, the payment hero, the accordions, and a 3x3 option grid whose every cell is the real calculator. PRESENT turns the phone around: Close becomes Done, and the customer sees the car, two wins, the grid with one recommended cell, the payment to the cent, one line of fine print with a real incentive date, and one commitment action whose tap writes the structure onto the deal. New York's taxable base is stated on the screen it is taken on, and the four fees are itemised rather than bundled.",
    entry: { from: "home/deals-queue", action: "Tap the deal card (Continue)" },
    steps: [
      { key: "huddle-gate", screen: "Game plan — the huddle", do: async (s) => { await s.reset(); await s.go(`#/desk/${D}`); }, action: "Confirm how they're paying, tap Open the pencil", next: "pencil-finance",
        notes: "Advisor-only. The trial close is captured in the customer's words and the payment they named is written down; both are reused when presenting, and the named payment is what picks the recommended cell in the grid. No deal number: the deal is not numbered until F&I." },
      { key: "pencil-finance", screen: "Pencil — Finance", do: async (s) => { await s.click('#hPayRow [data-pay="finance"]'); await s.click("#hConfirm", { wait: 400 }); }, action: "Tap Payment options", next: "options",
        branches: [{ action: "Compare finance and lease", to: "desking/present-compare" }, { action: "Trade evaluation", to: "trade/trade-evaluation" }, { action: "Present to customer", to: "desking/present-payment" }],
        notes: "The screen opens on the payment. The price accordion runs MSRP → your price → saving; the trade shows equity as a credit; fees and tax are five lines, with the sales-tax row naming the base it is taken on." },
      { key: "options", screen: "Payment options — the 3x3 grid", do: async (s) => { await s.click("#dkOptions", { wait: 350 }); }, action: "Tap Present to customer", next: "present-payment",
        notes: "The choice close, built before the phone turns: three terms across, three cash-down rows, one recommended cell — the option nearest the payment the customer named. Three columns, never four; four is a spreadsheet." },
      { key: "present-payment", screen: "Present — Your payment", do: async (s) => { await s.click("#dkPresent", { wait: 400 }); }, action: "Done, then Compare finance and lease", next: "present-compare",
        branches: [{ action: "This one works", to: "desking/work-chose" }],
        notes: "Present mode: Close is a dark Done (neither mode carries a role control — it appears only in Customer Onboarding). The order is deliberate — the car, two wins (price against MSRP, trade credit), the grid with the recommended cell as the anchor, then one line of fine print carrying a real incentive date. Nothing internal is on screen." },
      { key: "present-compare", screen: "Present — Own or lease", do: async (s) => { await s.click("#dkClose", { wait: 300 }); await s.click("#dkCompare", { wait: 400 }); }, action: "Customer taps Finance works", next: "work-chose",
        notes: "Two cards, the recommended one outlined. 'Included' is one row that names its own total and opens the itemisation on tap — summarising is fine, a label with no figure conceals." },
      { key: "work-chose", screen: "Back in Work — the customer chose", do: async (s) => { await s.click("#dkFinance", { wait: 450 }); }, action: "Deal type → Lease", next: "pencil-lease",
        branches: [{ action: "Submit for Team Lead approval", to: "agreement/agreement-unsigned" }],
        notes: "The customer's own tap is the trial close: the term and cash down are written to the deal and shown as a status row on the pencil — not a toast, because nothing that disappears can be the record of anything." },
      { key: "pencil-lease", screen: "Pencil — Lease", do: async (s) => { await s.click('[data-type="lease"]', { wait: 350 }); }, action: "Deal type → Cash", next: "pencil-cash",
        notes: "The hero's terms line is derived from the deal type; the residual has its own accordion, and the two lease-only fees are disclosed with the rest." },
      { key: "pencil-cash", screen: "Pencil — Cash", do: async (s) => { await s.click('[data-type="cash"]', { wait: 350 }); }, action: "Tap Present to customer", next: "agreement/agreement-unsigned",
        notes: "The label and the unit word are derived from the deal type — 'Total due' and 'total', never a monthly framing on a cash deal. The column reconciles on the screen rather than behind accordions, and the rebate names its kind: customer cash, so it survives a cash purchase." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "agreement", area: "10-base-payment-agreement", title: "Base Payment Agreement",
    description: "The signed acknowledgement of the base terms, rebuilt on the owner's base-payment golden (2026-08-27): the payment summary card with its status pill, the two party surfaces, the flat term rows, the acknowledgement readable on the page, and the sign panel. Redesk never voids on the first tap — signed or not, it confirms in a bottom sheet.",
    entry: { from: "desking/work-chose", action: "Tap Submit for Team Lead approval, then Continue" },
    steps: [
      /* the pencil's forward action is the customer's choice, then the Team
         Lead request, then Continue — three taps, the way the advisor gets
         here since the owner's package v029 */
      { key: "agreement-unsigned", screen: "Agreement — ready to sign", do: async (s) => { await s.reset(); await ev(s, `Store.deal("${D}").huddle.done = true;`); await s.go(`#/desk/${D}`); await s.click("#dkPresent", { wait: 400 }); await s.click("#dkTake", { wait: 400 }); await s.click("#dkSubmit", { wait: 400 }); await s.click("#dkContinue", { wait: 600 }); }, action: "Type the name, tap Sign agreement", next: "agreement-signed",
        notes: "The base payment is the dominant value with 'Ready to sign' opposite it; the dock carries the figure and the one action. The unit word is derived from the deal type — a cash deal reads 'total', never '/mo'." },
      { key: "agreement-signed", screen: "Agreement — signed", do: async (s) => { await s.click("#bpDockGo", { wait: 500 }); }, action: "Tap Redesk payment", next: "redesk-confirm",
        branches: [{ action: "Continue (credit application)", to: "credit/identity-gate" }, { action: "Print for deal folder", to: "print-center/print-preview" }],
        notes: "The signed acknowledgement is permanent on the page — who signed, when, and the signature — and Print and Redesk become contextual rows beneath it. The dock flips to 'Next step · Credit application unlocked'." },
      { key: "redesk-confirm", screen: "Void signature and redesk? (sheet)", do: async (s) => { await clearToast(s); await s.click("#bpRedeskRow", { wait: 400 }); }, action: "Cancel keeps the signature", next: "agreement/agreement-signed",
        notes: "Destructive behaviour behind a confirmation sheet that states exactly what voiding means, with the payment restated. Cancel preserves the signed state — the golden's own rule, and a real fix: the previous unsigned Redesk cleared the agreement silently." },
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
        action: "Fix the fields, submit", next: "approved",
        notes: "The summary counts the misses, names them, states the demo SSN rule, and says nothing has been saved or sent — inline, never a toast over the controls — and the wizard returns to the first invalid step with those fields marked." },
      { key: "deal-summary-sheet", screen: "Deal summary (contextual sheet)", do: async (s) => { await s.click('[data-sheet-open="summary"]', { wait: 400 }); }, action: "Close", next: "approved",
        notes: "'Synced from your worksheet' became Deal summary with a subordinate 'Updated from worksheet · time' line (owner v2, Option A). It opens from a header chip so the numbers can be inspected without losing the form position, and appears inline only from Residence onward." },
      { key: "approved", screen: "Approved (simulated)", do: async (s) => { await ev(s, `const d = Store.deal("${D}"); d.identity = { customerId: d.customerId, verifiedAt: new Date().toISOString() }; /* Codex 9c5501d: Credit accepts identity only when it names the primary applicant */ d.creditApp = { approved: true, customerId: d.customerId, coBuyerId: null /* Codex 9c5501d: an approval names its applicants */, submitted: new Date().toISOString(), lender: "US Bank", qualifiedApr: 3.9, leaseFactor: 0.00087, employer: "Demo Co", form: { consent: { electronicSignature: true, acceptedAt: new Date().toISOString() } } }; d.stage = "menu";`); await s.go(`#/credit/${D}`); },
        action: "Tap Continue", next: "finance-menu/signoff-gate-advisor",
        notes: "Reached via the store shortcut (a real submission needs every required field). Loan status, the lender, the qualified rate against the agreed structure, lender reassignment, and ONE forward action — Manager Sign-Off. Because identity was verified up front, the note says delivery will not repeat that step." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "buyers", area: "12-buyers-and-co-buyer", title: "Buyers on the Deal (Co-Buyer)",
    description: "The owner's Buyers on Deal V2 (2026-08-29): one bottom sheet from the Buyer chip — the primary buyer, an optional co-buyer, and one Add co-buyer action that opens the canonical Customer Resolver (search, scan, secure upload; manual creation only after a true no-match). Management is contextual and confirmed: removal keeps the customer profile, and Change roles is Team Lead-only, visible only with two buyers — an Advisor never sees a role control.",
    entry: { from: "discovery/visit-details", action: "Tap Co-buyer in Visit details" },
    steps: [
      { key: "buyers-sheet", screen: "Buyers on this deal", do: async (s) => { await s.reset(); await s.go(`#/desk/${D}`); await s.click('[data-sheet-open="buyers"]'); }, action: "Tap Add co-buyer", next: "add-cobuyer",
        branches: [{ action: "Tap the primary buyer's row", to: "credit/identity-gate" }] },
      { key: "add-cobuyer", screen: "Add co-buyer — the resolver's entries", do: async (s) => { await s.click("#byAdd"); await s.type("#byQ", "Bridwell"); }, action: "Tap the CRM match", next: "cobuyer-added",
        branches: [{ action: "Scan physical license", to: "license-scan/scan-front" }, { action: "Send secure upload link", to: "onboarding/send-link-sheet" }],
        notes: "Search dedupes at the source — people already on the deal never appear; manual creation is offered only after a true no-match." },
      { key: "cobuyer-added", screen: "Co-buyer attached", do: async (s) => { await s.click("[data-pick]"); await ev(s, `const t = document.querySelector("#toast"); if (t) t.remove();`); }, action: "Tap the co-buyer's row", next: "cobuyer-actions",
        notes: "The second row appearing is the feedback; Add co-buyer disappears. An Advisor still sees no role control." },
      { key: "cobuyer-actions", screen: "Co-buyer — contextual actions", do: async (s) => { await s.click("#byCo"); }, action: "Tap Remove from deal", next: "remove-confirm" },
      { key: "remove-confirm", screen: "Remove — second tap confirms", do: async (s) => { await s.click("#byRemove"); }, action: null, next: null,
        notes: "Removal takes the relationship off the deal and keeps the customer profile." },
      { key: "team-lead-roles", screen: "Team Lead — Change roles visible", do: async (s) => {
          await s.reset(); await ev(s, `const d = Store.deal("${D}"); d.huddle.done = true; d.coBuyerId = "c-demo2"; Store.s.role = "teamlead";`);
          await s.go(`#/desk/${D}`); await s.click('[data-sheet-open="buyers"]');
        }, action: "Tap Change roles", next: "change-roles-confirm",
        notes: "The link exists only for a Team Lead and only with two buyers — never a control that ends in a permission toast." },
      { key: "change-roles-confirm", screen: "Change buyer roles? — confirmation", do: async (s) => { await s.click("#byRoles"); }, action: null, next: null,
        notes: "Confirms before swapping customerId/coBuyerId (the fields the roles live in); a signed benefits acknowledgement is voided and the sheet says so first." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "presentation", area: "13-fi-presentation", title: "F&I Product Presentation",
    description: "Step 2 of the menu on the master canvas (owner's presentation golden, 2026-08-27): a product rail of line-icon tiles, one product card at a time with the customer benefit first, and the advisor's own tools — script, budget impact, details — in bottom sheets so the card stays the thing the customer sees. The rail follows the deal type: a lease shows Lease-End Protection, a cash deal has no Rate or Term tile.",
    entry: { from: "finance-menu/options", action: "Tap Present on Product presentation" },
    steps: [
      { key: "product-rail", screen: "Presentation — Rate", do: async (s) => { await s.reset(); await ev(s, SIGNED_OFF); await s.go(`#/present/${D}`); }, action: "Tap the VSC tile", next: "service-contract",
        notes: "The rail carries every product in the real program, each with a line icon; the dock counts what has been presented and names the next product. The qualified rate stays gated behind the real credit approval — before it, the card says to submit the application first." },
      { key: "service-contract", screen: "Vehicle service contract", do: async (s) => { await s.click('[data-tile="vsc10"]', { wait: 300 }); }, action: "Drag the mileage slider", next: "mileage-recalculated",
        notes: "Kicker, headline, the detail pill, the body and the benefit list — the customer benefit is visible before any price." },
      { key: "mileage-recalculated", screen: "Mileage changes the warranty window", do: async (s) => { await ev(s, `(() => { const r = document.querySelector("#mpMiles"); r.value = "25000"; r.dispatchEvent(new Event("input", { bubbles: true })); })();`); },
        action: "Tap Budget impact", next: "budget-impact",
        notes: "The slider recomputes the REAL factory-coverage window from the mileage — at 25,000 miles a year the factory comprehensive coverage is gone in about 17 months. Nothing here is a fixed marketing number." },
      { key: "budget-impact", screen: "Monthly / daily budget (sheet)", do: async (s) => { await s.click("#mpBudget", { wait: 400 }); }, action: "Back to product, Next product", next: "finance-menu/options",
        notes: "Both figures are DERIVED from the deal — the product price over the real term — not typed in by the advisor. The reference prototype asked for the number to be entered; the app already knows it." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "finance-menu", area: "14-finance-menu", title: "Finance Menu — Sign-Off Gate and Four Stages",
    description: "The owner's Finance Menu V3 (2026-08-30). A Manager sign-off gate reads four upstream statuses — base payment agreement, credit application, test drive, Deal Jacket — and recreates none of their detail; an Advisor is simply told it is waiting on the Team Lead. Then four stages, Terms → Options → Forms → Finalize, as one row of pills that never wraps. The money leads every stage and the detail hides behind one tap: taxes behind View, the form catalog behind Choose. Finalize is the single closeout — the DMS push folded into it rather than standing as a second button.",
    entry: { from: "credit/approved", action: "Continue → Manager sign-off" },
    steps: [
      { key: "signoff-gate-advisor", screen: "Manager sign-off — Advisor view", do: async (s) => { await s.reset(); await ev(s, MENU_READY); await s.go(`#/menu/${D}`); }, action: "Switch role to Team Lead (in New visit — the only place the role control appears)", next: "signoff-gate-locked",
        notes: "Four statuses and nothing more. The Advisor sees no approval or override control — only who it is waiting on." },
      { key: "signoff-gate-locked", screen: "Manager sign-off — jacket blocking (Team Lead)", do: async (s) => { await switchRole(s, "teamlead", `#/menu/${D}`); }, action: "Tap Resolve Deal Jacket blocker", next: "override-sheet",
        notes: "Approve stays disabled while the jacket is outstanding. The test drive is advisory and does not block." },
      { key: "override-sheet", screen: "Resolve Deal Jacket blocker", do: async (s) => { await s.click('[data-sheet-open="override"]'); }, action: "Type a reason, Record override", next: "terms",
        notes: "The override needs a typed reason and says plainly that the missing documents remain missing." },
      { key: "terms", screen: "Stage 1 — Review the deal terms", do: async (s) => { await s.type("#fmReason", "Lien release confirmed with the lender"); await s.click("#fmReasonGo"); await s.click("#fmApprove"); }, action: "Tap View on Taxes & fees", next: "terms-fees",
        notes: "The payment comparison leads the card; the agreed and qualified figures sit on one line." },
      { key: "terms-fees", screen: "Taxes & fees (sheet)", do: async (s) => { await clearToast(s); await s.click('[data-sheet-open="fees"]'); }, action: "Close, tap Mark presented", next: "options",
        notes: "The itemisation lives here, not on the page." },
      { key: "options", screen: "Stage 2 — Choose a protection package", do: async (s) => { await s.click("#fmSheet [data-sheet-close]"); await s.click("#fmNext"); }, action: "Tap Custom; move a product across", next: "options-custom",
        branches: [{ action: "Present each product", to: "presentation/product-rail" }, { action: "No products", to: "finance-menu/decline-sheet" }],
        notes: "The four package pills fit one row; the payment sits directly beneath them, above the product list." },
      { key: "options-custom", screen: "Custom package — figure withheld", do: async (s) => { await s.click('[data-pack="standard"]'); await s.click('[data-move][data-src="standard"]'); await s.click('[data-pack="custom"]'); }, action: "Tap Show custom payment, then Accept", next: "accept-initials",
        notes: "Custom withholds its payment until the advisor reveals it, and the dock does not leak it either. The first product moved sets the custom column's rate and term." },
      { key: "accept-initials", screen: "Accept package — client initials", do: async (s) => { await s.click("#fmReveal"); await s.click("#fmAccept"); }, action: "Enter initials, Accept package", next: "forms" },
      { key: "decline-sheet", screen: "Continue without products", do: async (s) => { await s.click("#fmSheet [data-sheet-close]", { wait: 250 }); await s.click("#fmNone"); }, action: "Enter initials, Continue without products", next: "forms",
        notes: "Declining is a recorded choice with initials, and it clears the custom box rather than refusing with a blocked toast." },
      { key: "forms", screen: "Stage 3 — Disclosures & forms", do: async (s) => { await ev(s, `const d = Store.deal("${D}"); d.menu.selectedProgram = "custom"; d.menu.initials = "JS"; d.menu.custom = ["vsc7"]; d.menu.customSource = "standard"; d.menu.termsPresented = true; d.menu.step = 4; d.menu.maxStep = 4; d.menu.v5 = true;`); await s.go(`#/menu/${D}`); }, action: "Tap Choose on Additional deal forms", next: "forms-catalog",
        notes: "Continue stays disabled until the benefits acknowledgement is signed." },
      { key: "forms-catalog", screen: "Additional deal forms (sheet)", do: async (s) => { await s.click('[data-sheet-open="catalog"]'); }, action: "Close, sign the acknowledgement", next: "final-review",
        notes: "Anything the trade requires is selected and locked here." },
      { key: "final-review", screen: "Stage 4 — Final review", do: async (s) => { await s.click("#fmSheet [data-sheet-close]"); await s.click('[data-sheet-open="ack"]'); await s.click("#fmSignGo"); await s.click("#fmNext"); }, action: "Tap Finalize with documents outstanding", next: "finalize-override",
        branches: [{ action: "Print centre", to: "print-center/print-center" }],
        notes: "Five readiness rows summarise the journey, then the repayment summary. One dominant action, and which one depends on the jacket: with every required document filed the dock reads Finalize deal, and while any is outstanding that button is not rendered at all (§22) — the dock offers the attributed override instead and names the count. This capture is the outstanding case, which is where the demo deal stands." },
      { key: "finalize-override", screen: "Finalize with documents outstanding", do: async (s) => { await s.click("#fmOverrideFinal"); },
        action: "Type a reason, Finalize", next: "deal-finalized",
        notes: "A second attribution, not a repeat of the first: the sign-off override let the Team Lead approve the menu, and this one pushes the deal to the DMS with documents still missing. The sheet lists exactly which, and says the closeout screen will name them." },
      { key: "deal-finalized", screen: "Deal finalized", do: async (s) => {
          await s.type("#fmFinReason", "Lender funded on the approved package; lien release follows from the payoff bank");
          await s.click("#fmFinGo"); }, action: "Return to Deals", next: "home/advisor-completed",
        notes: "The DMS push is recorded against the Team Lead who approved the deal, with the reason and the outstanding documents named on the closeout." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "deal-jacket", area: "15-deal-jacket", title: "Deal Jacket & Compliance",
    description: "The owner's Deal Jacket V2 (2026-08-29): compliance complexity behind the interface. One funding-readiness object answers whether the deal can fund, then three buckets — Waiting on customer, Deal forms and Completed, the last two collapsed until the advisor opens them. Rows are whole tap targets that open a contextual sheet; there is no permanent button rail. Requesting customer documents happens in a sheet on this page, so the advisor never leaves the jacket.",
    entry: { from: "discovery/question-1", action: "Tap the Jacket chip in the context row" },
    steps: [
      { key: "jacket-overview", screen: "Deal Jacket — funding readiness", do: async (s) => { await s.reset(); await s.go(`#/jacket/${D}`); }, action: "Open Deal forms", next: "deal-forms",
        branches: [{ action: "Request N documents", to: "document-request/request-sheet" }, { action: "Capture all here instead", to: "snap-all/capture" }, { action: "Print Center", to: "print-center/print-center" }, { action: "Complete sign-off →", to: "finance-menu/signoff-gate-advisor" }] },
      { key: "deal-forms", screen: "Deal forms — expanded", focus: "#jkFormsToggle", do: async (s) => { await s.click("#jkFormsToggle"); }, action: "Tap a form row", next: "document-actions",
        notes: "Collapsed by default at every width — the package locks progressive disclosure." },
      { key: "document-actions", screen: "Document row — contextual actions", do: async (s) => { await s.click('.rp-doc[data-open="form-privacy"]'); }, action: "Tap Mark received", next: "mark-received",
        notes: "A document this portal printed is offered the marker scan; one that arrives from outside never is — there is nothing to read." },
      { key: "mark-received", screen: "Mark received — a person's word", do: async (s) => { await s.click("#jkMark"); }, action: "Close; tap + Add optional document", next: "add-optional",
        notes: "States plainly that Ride Price did not scan or verify the document." },
      { key: "add-optional", screen: "Add optional document", do: async (s) => { await s.click("#jkSheet [data-sheet-close]"); await s.click("#jkAddOpt"); }, action: "Close; open Completed", next: "completed-bucket" },
      { key: "completed-bucket", screen: "Completed — already in the jacket", focus: "#jkDoneToggle", do: async (s) => { await s.click("#jkSheet [data-sheet-close]"); await s.click("#jkDoneToggle"); }, action: "Tap the Driver's License row in Waiting on customer", next: "license-back-needed",
        notes: "The Completed bucket holds what is already filed — the trade paperwork, the ID verification and the test drive. A licence still missing a side is the customer's to finish, so it stays in the customer bucket the route opens by default." },
      { key: "license-back-needed", screen: "Driver's License — back still needed", do: async (s) => {
          await ev(s, `const d = Store.deal("${D}"); const cl = jacketClientOf(d);
            cl["form-license"] = { state: "rejected", rejectedReason: RIDE_PRICE_DATA.clientDocs.license.missingPage.title, tries: 1, pages: 1 }; Store.save();`);
          await s.go(`#/jacket/${D}`); await s.click('.rp-doc[data-open="form-license"]');
        }, action: "Tap Capture back", next: "jacket-complete",
        notes: "The exception is local to the licence: the row says Back needed and the sheet asks only for the missing side." },
      { key: "jacket-complete", screen: "Jacket complete — the dock unlocks", do: async (s) => { await ev(s, `const d = Store.deal("${D}"); jacketDocs(d).forEach(x => jacketReceive(d, x.id, "hand"));`); await s.go(`#/jacket/${D}`); }, action: "Tap Complete sign-off →", next: "finance-menu/signoff-gate-advisor",
        notes: "Every document recorded (by hand, for the capture) — sign-off stays locked until this point." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "document-request", area: "16-document-request", title: "Customer document request (from the jacket)",
    description: "One secure link for every customer document still missing. The V2 package folded the old Send Text Request page and its Resend twin into a bottom sheet on the jacket: sending and resending never leave the Deal Jacket, and delivery status returns inline in the customer group rather than on a route of its own.",
    entry: { from: "deal-jacket/jacket-overview", action: "Tap Request N documents" },
    steps: [
      { key: "request-sheet", screen: "Request documents — secure link", do: async (s) => { await s.reset(); await s.go(`#/jacket/${D}`); await s.click("#jkRequest"); }, action: "Tap Send secure request", next: "request-sent",
        notes: "The privacy line is the point: the customer uploads directly into Ride Price, never through the salesperson's texts or photo library." },
      { key: "request-sent", screen: "Jacket after sending — Requested", do: async (s) => { await s.click("#jkSend", { wait: 1200 }); }, action: "Tap View status", next: "request-tracking",
        notes: "Rows turn Requested and an inline banner carries the status — no toast, and no page change." },
      { key: "request-tracking", screen: "Customer request — delivery status", do: async (s) => { await s.click("#jkTrack"); }, action: "Open the customer's phone", next: "client-upload/sms",
        branches: [{ action: "Resend link", to: "document-request/request-sheet" }] },
    ] },

  /* ------------------------------------------------------------ */  { id: "client-upload", area: "17-client-document-upload", title: "Client Document Upload (customer's phone)",
    description: "What the customer sees from the text link, rebuilt from the owner's upload prototype (2026-08-27) in Ride Price colours. This is the customer's OWN page: no app bar, no role switch, no debug strip — a white edge-to-edge canvas reached from a text message by someone who does not work at the dealership. One row per requested document with a line icon and a plain what-to-bring subtitle, an \"n of N ready\" progress line, and one dominant action. Verification is simulated with scripted beats (the license needs both sides, insurance flags once, two paystubs). An unreadable photo is refused plainly — \"Too blurry to read\" — with the retake on the row, never a coaching screen.",
    entry: { from: "document-request/request-tracking", action: "Open the customer's phone" },
    steps: [
      { key: "sms", screen: "Document request — what the link opens", do: async (s) => { await s.reset();
          /* the seed hands the customer a licence whose front the advisor
             already captured in the resolver. This flow is the both-sides
             journey, so it opens with neither side on file. */
          await ev(s, `const j = Store.deal("${D}").jacket; delete j.client["form-license"]; clientPhotosSet("${D}", "form-license", []);`);
          await s.go(`#/clientlink/${D}/sms`); }, action: "Tap the link", next: "landing",
        notes: "The advisor sends the request; this is the message as the customer receives it. The link is the only way in — no account, no password." },
      { key: "landing", screen: "Upload your documents", do: async (s) => { await s.click("[data-open-client]"); }, action: "Add the license (one side)", next: "row-blocked",
        branches: [{ action: "Tap a document row", to: "client-upload/document-sheet" }, { action: "Add documents (burst)", to: "snap-all/capture" }],
        notes: "The heading runs straight into the progress line — the explanatory paragraph was cut (owner, 2026-08-27): \"0 of 3 ready\" and the submit button already carry the send-when-ready model." },
      { key: "row-blocked", screen: "Row blocked — back of license missing", do: async (s, ctx) => { await s.upload('[data-upload-input="form-license"]', [ctx.photos[0]]); }, action: "Retake Photo (the back)", next: "row-verified",
        notes: "A blocked row keeps its ONE-TAP retake rather than making the whole row the control — the prototype's version cost an extra tap on the screen where the customer is already stuck." },
      { key: "row-verified", screen: "Row verified", do: async (s, ctx) => { await s.upload('[data-upload-input="form-license"]', [ctx.photos[1]]); }, action: "Add the insurance card", next: "insurance-flagged",
        notes: "A verified row carries a quiet green pill; the progress line and percentage move with it." },
      { key: "insurance-flagged", screen: "Insurance flagged — expires within 45 days", do: async (s, ctx) => { await s.upload('[data-upload-input="form-insurance"]', [ctx.photos[2]]); }, action: "Retake; add both paystubs", next: "all-verified",
        notes: "The refusal names the real reason on the row itself. The toast lifts clear of the sticky action bar, the same way it already did for dialog footers." },
      { key: "all-verified", screen: "All documents verified", do: async (s, ctx) => { await s.upload('[data-upload-input="form-insurance"]', [ctx.photos[3]]); await s.upload('[data-upload-input="form-paystub"]', [ctx.photos[4]]); await s.upload('[data-upload-input="form-paystub"]', [ctx.photos[2]]); }, action: "Tap Submit documents", next: "receipt",
        notes: "Only when everything is ready does the single green submit replace the add/submit-what's-ready pair." },
      { key: "receipt", screen: "Receipt — your documents", do: async (s) => { await s.click("[data-receipt]"); }, action: "Back to status", next: "landing",
        notes: "What landed, when, and that it is already in the Deal Jacket." },
      { key: "document-sheet", screen: "What we need — bottom sheet", do: async (s) => { await s.reset(); await s.go(`#/clientlink/${D}`); await s.click('[data-detail="form-paystub"]'); }, action: "Choose from library (two files)", next: "review-capture",
        branches: [{ action: "Simulate an unreadable photo → Take a photo", to: "client-upload/unreadable-refused" }],
        notes: "A sheet OVER the list, not a page that replaces it (owner, 2026-08-27), so the customer never loses their place; it dismisses by tapping the list behind it or by Escape. No requirements list: telling someone what a good photo looks like before they have taken one is text for its own sake — the refusal afterwards is the part that helps." },
      { key: "review-capture", screen: "Review capture — 2 pages", do: async (s, ctx) => { await s.upload("#drCapLib", [ctx.photos[0], ctx.photos[1]]); }, action: "Done (2)", next: "landing",
        notes: "Deliberately still a full screen — it is a photo viewer with pinch-zoom and page arrows, and wants the room a sheet cannot give." },
      { key: "unreadable-refused", screen: "Too blurry to read — refused on the row", do: async (s) => { await s.click("[data-use]", { wait: 500 }); await wait(1900); /* let the verify toast clear */ await s.click('[data-detail="form-insurance"]'); await s.click("#drBad", { wait: 150 }); await s.click('[data-capture="camera"]'); }, action: "Retake Photo", next: "document-sheet",
        notes: "Replaces the old three-card Glare / Blur / cropped coaching screen (owner, 2026-08-27): \"when a scanner works very well, it should tell someone that it's too blurry to be uploaded\". It routes through the same rejection every other refusal uses — the row says why and offers the retake." },
    ] },

  { id: "snap-all", area: "18-snap-all", title: "Snap All — burst capture",
    description: "Shoot every outstanding document in one go; the simulated sorter deals the shots onto the queue and shows what verified, what needs attention, and what is still missing. On the UI kit since the owner's Snap All package (2026-09-09): the kit's Task, with a camera, a strip of captures, a result row whose actions sit under a full-width title, and a sorting screen between the two. The same route serves the customer from the client link, where the kit's turned-to-the-customer mode hides the role control.",
    entry: { from: "deal-jacket/jacket-overview", action: "Tap Capture all here instead" },
    steps: [
      { key: "capture", screen: "Snap All — camera", do: async (s) => { await s.reset(); await s.go(`#/snapall/${D}/advisor`); }, action: "Shutter, or Gallery", next: "thumbs",
        notes: "The dock states where the batch is going even with nothing in it — disabled, reading Process photos. The viewfinder says No live preview because the panel is drawn, not a camera feed: the shutter opens the device camera." },
      { key: "thumbs", screen: "Three photos in the batch", do: async (s, ctx) => { await s.upload("#saLib", [ctx.photos[0], ctx.photos[1], ctx.photos[2]]); }, action: "Process 3 photos & auto-sort", next: "sorting",
        notes: "The strip exists only when a photo does. Each tile opens the photo it stands for; the 24px remove circle over its corner owns a 44px hit region." },
      { key: "sorting", screen: "Sorting the batch", do: async (s) => { await s.click("#saProcess", { wait: 60 }); }, action: "(the sort finishes on its own)", next: "results",
        notes: "The one state with no dock. Transient by design — the batch is being dealt onto the queue." },
      { key: "results", screen: "Auto-sort results", do: async (s) => { for (let i = 0; i < 50 && !await s.exists("#saSave"); i++) await s.settle(100); }, action: "Accept anyway on a flagged row", next: "results-accepted",
        notes: "Each row's title has the full width and its two actions sit underneath at 44px, the repair naming the page it wants — Retake, Add back, Add paystub. The demo note stands above the dock rather than under it." },
      { key: "results-accepted", screen: "Results — exception accepted", do: async (s) => { await s.click("[data-sa-accept]"); }, action: "Add back on the driver's license", next: "aimed-capture",
        notes: "The override wears an amber badge with Undo beside it, and the reason it was accepted over stays on the row. It survives a re-sort; Undo puts the flag back for the next pass too." },
      { key: "aimed-capture", screen: "Capture the missing page", do: async (s) => { await s.click('[data-sa-retake="form-license"]'); }, action: "Take the page, then Use photo & return", next: "license-complete",
        notes: "An aim holds exactly one candidate and destroys nothing on the way in — cancelling leaves the batch as it found it. The gallery drops multi-select while a page is aimed." },
      { key: "license-complete", screen: "The license now complete", do: async (s, ctx) => {
          await s.upload("#saLib", [ctx.photos[3]]);
          for (let i = 0; i < 50 && await s.eval(`document.getElementById("saUseAim").disabled`); i++) await s.settle(100);
          await s.click("#saUseAim", { wait: 600 });
        }, action: "Confirm & save to deal jacket", next: "deal-jacket/jacket-overview",
        notes: "Two sides on file, so the licence verifies; the insurance beat is already spent. Confirm writes the pages and the reasons into the jacket and returns there." },
      { key: "photo-review", screen: "Review one photo", standalone: true, do: async (s, ctx) => {
          await s.reset(); await s.go(`#/snapall/${D}/advisor`);
          await s.upload("#saLib", [ctx.photos[0], ctx.photos[1], ctx.photos[2]]);
          await s.click("[data-shot]", { wait: 450 });
        }, action: "Keep photo, or Remove photo",
        notes: "Nothing could look at a capture before the kit conversion — only delete it. The gradient carries Keep here; Remove is the quiet link." },
      { key: "leave-guard", screen: "Leaving an unsorted batch", standalone: true, do: async (s, ctx) => {
          await s.reset(); await s.go(`#/snapall/${D}/advisor`);
          await s.upload("#saLib", [ctx.photos[0], ctx.photos[1]]);
          await s.click("#saClose", { wait: 450 });
        }, action: "Leave capture, or Keep capturing",
        notes: "The batch is session-only, so leaving is what discards it — the sheet says how many. Owner's call on the screenshots: the gradient carries the action the sheet was raised to do, and the quiet link is the way out. The focus goes to the link, not the gradient." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "doc-review", area: "19-document-review", title: "Document Review (advisor)",
    description: "A viewer, not another Deal Jacket screen: the document takes the viewport, the deal context is quiet, and an exception appears only when it affects the document on screen. A missing licence side is named inline with one action to fix it.",
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
        notes: "The missing side is stated on the status card, never toasted, and a front-only licence is not called verified." },
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
        action: "← Deal Jacket", next: "deal-jacket/jacket-overview",
        /* the two rows RP-UI-030 asked for, asserted rather than assumed: Source
           is where the sides came from — both from the customer here — and
           Verification is what checked them. The empty string is "as expected". */
        expect: async (s) => { const rows = await s.eval(`[...document.querySelectorAll(".rp-kv__row")].map(d => d.querySelector("span").textContent.trim() + ": " + d.querySelector("span:last-child").textContent.trim()).filter(x => /^(Source|Verification):/.test(x)).join(" | ")`); /* Verification reads Not verified until someone reviews it (Codex LS-116: two revision-bound sides and an explicit review) */ return rows === "Source: Customer upload | Verification: Not verified" ? "" : "the status card rows read " + JSON.stringify(rows); },
        notes: "The missing side lands in place — no separate success page, whichever branch delivered it — and both sides stay reviewable." },
    ] },

  /* ------------------------------------------------------------ */
  { id: "print-center", area: "20-print-center", title: "Documents — Print Center & Printables",
    description: "The owner's Print Center V2 (2026-08-30). A print centre is a document utility, not a dashboard: the deal in two quiet lines, one dominant Print full packet action, then two grouped lists — Deal packet and Additional forms — whose rows are themselves the tap target. Status appears only where a document is NOT ready, so a finished deal shows no badges at all. Preview is deliberately sparse: one toolbar with Back and a single Print / PDF, then the paper. The MV-82 recreation keeps its TRAINING SAMPLE treatment.",
    entry: { from: "finance-menu/final-review", action: "Tap Open on Print centre" },
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
      { key: "print-repayment", screen: "Preview — Repayment Options", do: async (s) => { await ev(s, `const d = Store.deal("${D}"); d.menu.selectedProgram = "preferred"; d.menu.initials = "JS"; d.menu.ackSigned = true;`); await s.hash(`#/print/${D}/repayment`); }, action: null, next: null,
        notes: "The menu record: what was purchased, what was declined, and the acknowledgement signature. Every price sits in a right-aligned column — a long product label wraps inside the label column and never displaces its amount (RP-UI-008, fixed 2026-08-30)." },
    ] },
];

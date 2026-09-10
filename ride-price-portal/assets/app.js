/* ============================================================
   Ride Price Portal — application
   Vanilla JS SPA · hash router · localStorage persistence
   ============================================================ */
"use strict";

/* ---------------- store ---------------- */
const Store = (function () {
  const KEY = "ride_price_portal_v1";
  let state = null;

  function fresh() {
    return {
      customers: RIDE_PRICE_DATA.seedCustomers.map(c => Object.assign({}, c)),
      deals: [seedDeal(), seedFundedDeal()],
      advisor: RIDE_PRICE_DATA.dealership.advisor,
      role: "advisor"
    };
  }

  /* the funded contract in the seed (chrome rule v022): Priya Patel, a 2023
     Kia Telluride the catalog does not stock — the deal's own vehicle
     snapshot carries it. Complete, finalized, dated Aug 14, so it appears
     only behind the Team Lead's date control with funded included. */
  function seedFundedDeal() {
    return {
      id: "d-demo2", dealNo: 48044, customerId: "c-demo3", stock: null, dealType: "finance",
      vehicle: { vin: "5XYP3DHC4PG312907", stock: "7K11842", year: 2023, make: "Kia", model: "Telluride" },
      /* the Team Lead handled it, so the advisor's own list never shows it —
         the seed says it is visible only behind the date control */
      stage: "complete", createdAt: "2026-08-14T15:05:00Z", advisor: RIDE_PRICE_DATA.dealership.teamLead,
      discovery: { answers: {}, done: true }, testDrive: { done: true }, huddle: { done: true },
      /* the same trade literal startVisit builds, and deliberately byte-identical
         to it: two constructors that disagree split the demo into two shapes.
         No `payoff` — the note at startVisit says why. */
      trade: { has: false, value: 0, rebates: 0, applyTaxCredit: true },
      desk: { term: 72, apr: 4.9, downPayment: 2500, leaseTerm: 36, milesPerYear: 12000, leaseFactor: 0.0015, dueAtSigning: 2500, accessories: [], daysToFirst: 45 },
      basePayment: null, creditApp: { approved: true, lender: "US Bank" },
      menu: { step: 4, barsDone: [1, 2, 3, 4], custom: [], customSource: null, selectedProgram: null, initials: "PP", ackSigned: true },
      forms: { selected: [], finalized: true },
      /* a contract does not fund with an empty jacket. Every document
         jacketDocs() requires of THIS shape of deal — finance, no trade, no
         co-buyer, approved credit, no menu program — is filed by hand by the
         Team Lead at the moment it funded. Enumerated rather than computed:
         calling jacketDocs() from inside the store at boot would tie the
         first paint to a function that may one day read the store back, and
         a boot that cannot start is worse than a seed that drifts. walk2
         asserts the two agree, so a drift goes red instead of silent. */
      jacket: { docs: fundedJacketDocs(), extra: [], req: {} }
    };
  }
  function fundedJacketDocs() {
    const at = "2026-08-14T15:05:00Z", by = RIDE_PRICE_DATA.dealership.teamLead;
    const out = {};
    /* a funded contract's jacket holds everything that shape of deal needs,
       the lending lane's own records included: it was approved and delivered,
       so the identity record, the application that went to the lender and the
       answer that came back are all on file. walk2 asserts this list against
       jacketDocs(). */
    ["idverify-primary", "form-license", "form-privacy", "form-reg", "form-insurance",
     "form-contracts", "form-creditmatch", "form-riskdisc", "form-paystub", "creditapp",
     "approval", "testdrive", "form-tqi", "form-settings", "delivery"].forEach(id => { out[id] = { how: "hand", by, at }; });
    return out;
  }

  /* the friendly number on the folder tab; ids stay the routing key */
  function mintDealNo() {
    let n;
    do { n = 10000 + Math.floor(Math.random() * 90000); }
    while (state && state.deals.some(d => d.dealNo === n));
    return n;
  }

  /* 11:38 today, but never ahead of the clock: opened at 09:00 the demo would
     otherwise say a customer arrived two and a half hours from now. A day back
     keeps the hour the seed data names and puts it in the past. */
  function seedArrival() {
    const d = new Date(); d.setHours(11, 38, 0, 0);
    if (d.getTime() > Date.now()) d.setDate(d.getDate() - 1);
    return d.toISOString();
  }

  function seedDeal() {
    return {
      id: "d-demo1", dealNo: 48201, customerId: "c-demo1", stock: "7H21313", dealType: "finance",
      stage: "desking", createdAt: "2026-07-14T17:20:00Z",
      /* SEED-DATA v022: John is in the showroom, arrived 11:38 today — presence
         is this stamp, his deal stays Desking */
      visit: { arrivedAt: seedArrival() },
      discovery: { answers: { week: "Daily commute to Midtown, weekend trips upstate.", family: "Two kids, one dog." }, done: true },
      testDrive: { done: true, completedMiles: 12 },
      /* the trade is the vehicle on John's registration prop (training pair
         01): a 2016 Toyota RAV4, VIN 4T1TRAININGSAMP01. The seed's own
         reasoning — the registration he hands over as proof of ownership has
         to name the car he is trading, which v021's Tucson did not.
         There is deliberately NO `year` key, dropped 2026-09-09 together with
         the load() migration that used to stamp one. The description already
         says 2016 and `descYear` reads it back on every render, so a stored
         2016 here is a copy of a reading — the exact thing `runEval` deletes
         one screen away. It bought nothing while it was here: `yearBoxAttrs`
         paints the same 2016 either way (a stored year equal to the derived
         one is carried as paint, not as an answer), and the first press of
         Run evaluation deleted it — so its whole effect was to leave the seed
         in a shape the app itself can no longer produce.
         `value` and `payoff` stay as literals for the reason the year cannot:
         nothing can re-derive them. They are the demo's equity story — $4,750
         of it — and NOT this formula's answer for a 2016 at 61,200 miles,
         which is $5,650; evaluating the untouched seed re-prices it, as the
         VIN migration in load() also notes. The
         ownership answers are read from the documents on file (§13b): the
         title is in hand with one lien recorded, the vehicle is not paid off,
         and the payoff statement expired 01/01/2025 — one gap, the only one. */
      trade: {
        has: true, desc: "2016 Toyota RAV4", vin: "4T1TRAININGSAMP01", miles: 61200, condition: "Good",
        value: 15500, payoff: 10750, rebates: 500, applyTaxCredit: true,
        ownership: seedTradeOwnership(), ownershipReviewedAt: "2026-09-04T13:40:00Z"
      },
      /* the huddle is still to be run — the advisor confirms it — but the two
         things the customer already said are on the record, in his own words,
         because the desking screens read them back: the trial close is quoted
         when presenting, and the payment he named picks the recommended cell */
      huddle: { done: false, trialClose: "If the numbers make sense, we'd take it today.", namedPayment: "Around $700 a month" },
      desk: { term: 60, apr: 3.5, downPayment: 1000, leaseTerm: 36, milesPerYear: 12000, leaseFactor: 0.00117, dueAtSigning: 1000, accessories: ["mats", "tint"], daysToFirst: 45 },
      basePayment: null, creditApp: null,
      menu: { step: 1, barsDone: [], custom: [], customSource: null, selectedProgram: null, initials: "", ackSigned: false },
      forms: { selected: [], finalized: false },
      /* the demo deal is found mid-jacket — see RIDE_PRICE_DATA.seedJacket */
      jacket: { docs: seedJacketDocs(), extra: [], req: {}, client: seedLicenseFront() }
    };
  }

  /* the answers the trade documents produce, in the app's own tri-state terms:
     title in hand, one lien on it (Harbor Auto Finance), not paid off, a payoff
     statement on file that expired 01/01/2025, and the customer is the titled
     owner. tradeOwnershipGaps() reads exactly one gap out of this — the expired
     payoff — which is what the seed says Team Lead sign-off is waiting on. */
  function seedTradeOwnership() {
    return {
      titleInHand: true, lienOnTitle: true, paidOff: false,
      payoffReceived: true, payoffGoodThrough: "2025-01-01", isTitledOwner: true
    };
  }

  /* stamped this morning so the records read like today's work, and recorded
     by hand — nothing in the seed was ever scanned or machine-checked */
  /* The license front was captured in the Customer Resolver at 11:41, three
     minutes after he arrived — this visit, not a historical profile scan. The
     row therefore reads "Back needed" and never a bare "Needed", which would
     send the advisor to ask for a document the store already holds (§19a).

     It is seeded as a CLIENT PIPELINE record, not a second field beside it:
     that pipeline already models one side in and the other missing, and a
     capture appended to it completes the document through the same path every
     other side goes through. Two ledgers of one fact is how a document taken
     out of the jacket came to read "Requested" forever. */
  function seedLicenseFront() {
    const at = new Date(); at.setHours(11, 41, 0, 0);
    if (at.getTime() > Date.now()) at.setDate(at.getDate() - 1);
    const lic = RIDE_PRICE_DATA.clientDocs.license;
    return {
      "form-license": {
        state: "rejected", rejectedReason: lic.missingPage.title,
        pages: 1, draftPages: 1, tries: 1,
        receivedAt: at.toISOString(),
        /* the store captured it, not the customer: the tracking sheet must not
           report the link as opened by somebody who never saw it */
        via: "advisor", sideVia: ["advisor"],
        capturedIn: "the Customer Resolver"
      }
    };
  }

  function seedJacketDocs() {
    const out = {};
    const at = new Date(); at.setHours(9, 15, 0, 0);
    (RIDE_PRICE_DATA.seedJacket || []).forEach((s, i) => {
      const t = new Date(at.getTime() + i * 11 * 60000);
      out[s.id] = { how: "hand", by: RIDE_PRICE_DATA.dealership.advisor || "Ashley Collins", at: t.toISOString() };
      if (s.note) out[s.id].note = s.note;
    });
    return out;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : fresh();
    } catch (e) { state = fresh(); }
    if (!state.customers) state = fresh();
    /* deals saved before deal numbers existed get one minted at load — a
       migration write, not a display-path write */
    let minted = false;
    state.deals.forEach(d => { if (!d.dealNo) { d.dealNo = mintDealNo(); minted = true; } });
    /* the demo deal gained its mid-jacket seed after this browser may have
       saved a blob without one. Only a deal that has NO jacket at all is
       seeded: an existing jacket — even an emptied one — is somebody's work
       and is left alone. */
    const demo = state.deals.find(d => d.id === "d-demo1");
    if (demo && !demo.jacket) { demo.jacket = { docs: seedJacketDocs(), extra: [], req: {}, client: seedLicenseFront() }; minted = true; }
    /* a blob saved before the license front was on record gets it, so its row
       reads "Back needed" like every other browser's. Guarded on the field
       being ABSENT: an emptied pipeline is somebody's work, the same rule the
       jacket and the trade ownership already follow. */
    if (demo && demo.jacket && demo.jacket.client === undefined) { demo.jacket.client = seedLicenseFront(); minted = true; }
    /* the seed trade gained a VIN after this browser may have saved a blob
       without one. The predicate is VEHICLE IDENTITY — desc and mileage —
       deliberately not whole-struct equality: condition, value and payoff
       are appraisal details of the same fictional Tucson, and Run Evaluation
       itself rewrites `value` on the untouched seed, so demanding full
       equality would deny the migration to any browser that ever pressed
       the demo's own button. A trade whose desc or mileage changed is the
       user's own vehicle, and an absent VIN there means "never recorded",
       which is the true state. */
    if (demo && demo.trade && demo.trade.vin === undefined &&
        demo.trade.desc === "2018 Hyundai Tucson" && demo.trade.miles === 61200) {
      demo.trade.vin = "KM8TRAININGSAMP06"; minted = true;
    }
    /* the seed trade became the vehicle on John's registration prop on
       2026-09-04 — a 2016 Toyota RAV4 — because the registration he hands
       over as proof of ownership names that car and the old Tucson matched no
       prop. Only a trade that is still the untouched seed Tucson is rewritten
       (identity, not appraisal: desc, VIN and mileage together), so a trade
       anyone has edited or re-appraised is left alone. The migration above
       runs first, so a blob old enough to have no VIN at all arrives here
       already stamped and converges on the same record. */
    if (demo && demo.trade && demo.trade.desc === "2018 Hyundai Tucson" &&
        demo.trade.vin === "KM8TRAININGSAMP06" && demo.trade.miles === 61200) {
      demo.trade.desc = "2016 Toyota RAV4"; demo.trade.vin = "4T1TRAININGSAMP01"; minted = true;
    }
    /* NO year migration runs here, and the empty space is the point (removed
       2026-09-09, one day after it was added). It stamped `year: 2016` onto a
       seed trade that had none, because the form then fell back to a
       hard-coded 2018 and contradicted its own header. Its guard was
       "described as a 2016 RAV4, on the seed VIN, with NO year recorded" —
       and hours later the appraisal stopped PERSISTING a year it had only
       read out of `desc`, which turned that guard's third clause from the
       signature of an old blob into the ORDINARY shape of an evaluated trade.
       A migration whose predicate matches the steady state is not a migration:
       it re-fired on every load, re-saved the whole store, and put back the
       record `runEval` had just deliberately deleted — the branch's own rule
       ("a reading is never a record") broken on the demo deal specifically.
       No tightening was available, because there is nothing to tighten
       against: an old blob and a freshly evaluated one are the SAME bytes.
       Nor was anything lost with it. What it existed to produce was 2016 in
       the Model year box, and `yearBoxAttrs` paints `descYear(desc)` whenever
       no year is recorded — on exactly the blobs this guard named, since it
       required `desc === "2016 Toyota RAV4"`, from which `descYear` returns
       2016. The box was never the migration's work. `seedDeal` lost its own
       `year: 2016` in the same change and for the same reason.
       A blob still carrying a stale 2016 — written by this migration or by
       the seed before it — is left alone rather than swept: `yearBoxAttrs`
       already reads a stored year equal to the derived one as paint, so it
       renders identically and clears itself the next time the trade is
       evaluated, and a delete pass would be unable to tell it from a 2016 the
       advisor typed under a 2016 description. */
    /* the payoff box stopped printing a hard 0 on 2026-09-09, and this is the
       other half of it: startVisit used to seed `payoff: 0` on a trade nobody
       had appraised, so a deal already in this browser would keep painting a
       black 0 — read as "this trade is paid off" — while every deal made
       after the change showed the box empty. Two behaviours on one screen is
       the drift the flow-by-flow rollout exists to avoid.
       Five migrations run above this one. Two key on the seed's VIN — the
       mint on that VIN being ABSENT and the RAV4 rewrite on it being present
       — two more key on the demo deal by id, and only the dealNo mint, like
       this pass, walks every deal. This one keys on no
       identity at all, because the stale zeros live in the deals the USER
       started, which is where the defect shows and where no seed VIN was ever
       written.
       What makes an unkeyed pass safe is the whole predicate, not `has`
       alone: seedDeal writes `has: true` and `payoff: 10750` in one literal,
       so `has !== true` proves nothing by itself. `payoff === 0 && !value` is
       the guard that does the work. A trade that has been evaluated always
       carries a value — runEval's floor is 1500 before the condition factor,
       so it cannot write a falsy one — and the seeded trade carries 15500
       beside its payoff. Both writers are excluded by construction, which
       leaves the initializer that no longer writes a zero as the only source
       of one. It cannot misfire on a typed 0 either: markStale never saves, so
       a payoff typed and abandoned is never persisted. `value: 0` is left
       alone — it has no box of its own to lie in. */
    state.deals.forEach(d => {
      if (d.trade && d.trade.has !== true && d.trade.payoff === 0 && !d.trade.value) {
        delete d.trade.payoff; minted = true;
      }
    });
    /* the customer's own words, on a huddle nobody has run yet. A huddle that
       is done, or that already holds either field, is the advisor's own work
       and is never overwritten. */
    if (demo && demo.huddle && !demo.huddle.done && !demo.huddle.trialClose && !demo.huddle.namedPayment) {
      demo.huddle.trialClose = "If the numbers make sense, we'd take it today.";
      demo.huddle.namedPayment = "Around $700 a month";
      minted = true;
    }
    /* and the ownership answers the trade documents produce. Only a trade with
       NO ownership object at all — a single recorded answer is somebody's
       review, and an object emptied back to {} is a real state, the advisor
       having cleared what was there. Stamping over an emptied one would
       reinstate a review nobody ran, and it would do it on every load. */
    if (demo && demo.trade && demo.trade.has && demo.trade.vin === "4T1TRAININGSAMP01" &&
        demo.trade.ownership === undefined) {
      demo.trade.ownership = seedTradeOwnership();
      demo.trade.ownershipReviewedAt = demo.trade.ownershipReviewedAt || "2026-09-04T13:40:00Z";
      minted = true;
    }
    /* deals gained a vehicle-identity snapshot (vin + stock) on 2026-08-23 so
       the advisor queue shows the VIN even when the unit is not stocked in or
       the catalog entry later changes (owner requirement: universal VIN
       visibility once a vehicle reaches desking). Saved deals whose stock
       still resolves are stamped once; a deal whose stock no longer resolves
       keeps what it has — the app never invents a value. */
    state.deals.forEach(d => {
      const v = d.stock ? RIDE_PRICE_DATA.inventory.find(x => x.stock === d.stock) : null;
      if (!d.vehicle && d.stock) {
        if (v) { d.vehicle = { vin: v.vin, stock: v.stock, year: v.year, make: v.make, model: v.model }; minted = true; }
      } else if (v && d.vehicle && d.vehicle.stock === d.stock && d.vehicle.make === undefined) {
        /* the snapshot gained year/make/model on 2026-09-04 so the row and the
           search can still name the unit after it leaves the catalog. A blob
           saved before then is filled in now, while the catalog can still say
           — and only a snapshot that agrees with the deal's stock: a stale
           one is left for vehicleIds() to reject, exactly as before. */
        d.vehicle.year = v.year; d.vehicle.make = v.make; d.vehicle.model = v.model; minted = true;
      }
    });
    /* the second seed customer gained a licence and date of birth on
       2026-08-25 so the manual licence-number search has something to find in
       a demo nobody has scanned into yet. Only a record that still has NEITHER
       is stamped: a licence already there is the user's own scan, and a record
       whose name was edited is no longer the seed. */
    const seedC = state.customers.find(x => x.id === "c-demo2");
    if (seedC && !seedC.license && !seedC.dob && seedC.last === "Bridwell") {
      const src = RIDE_PRICE_DATA.seedCustomers.find(x => x.id === "c-demo2");
      if (src && src.license) { seedC.license = Object.assign({}, src.license); seedC.dob = src.dob; minted = true; }
    }
    /* the chrome rule (2026-09-04) put three new things in the seed, and
       load() is the migration boundary: every browser that had already opened
       the demo — the owner's phone and every public-demo visitor among them —
       keeps its saved blob, and without these it gets Home with NO showroom
       section at all and a Team Lead date control with no funded history.
       Each is guarded so it stamps once and never overwrites somebody's work. */
    /* presence: only a deal that has never had a visit at all. An emptied or
       ended visit is a real state; a delivered deal is off the floor anyway. */
    if (demo && demo.visit === undefined && demo.stage !== "complete") {
      demo.visit = { arrivedAt: seedArrival() }; minted = true;
    }
    /* the funded contract behind the Team Lead's date control, and the customer
       it belongs to. Keyed on the id: a blob that already holds them is left
       alone. Absence can only mean a blob saved before 2026-09-04 — the app has
       no path that deletes a customer or a deal, and Store.reset() re-seeds by
       design — so absence is the whole guard; a tombstone would guard nothing. */
    if (!state.deals.some(d => d.id === "d-demo2")) { state.deals.push(seedFundedDeal()); minted = true; }
    if (!state.customers.some(c => c.id === "c-demo3")) {
      const src = RIDE_PRICE_DATA.seedCustomers.find(c => c.id === "c-demo3");
      if (src) { state.customers.push(Object.assign({}, src)); minted = true; }
    }
    /* the scan-license package (seed v023) put Marcus Alvarez in the CRM
       before any scan — the profile his secure link created — and moved
       Cheri to Grand Army Plaza. Same guards as above: the record by id, and
       the address only while it is still the old seed value, because an
       address somebody changed is theirs. */
    if (!state.customers.some(c => c.id === "c-demo4")) {
      const src = RIDE_PRICE_DATA.seedCustomers.find(c => c.id === "c-demo4");
      if (src) { state.customers.push(Object.assign({}, src)); minted = true; }
    }
    if (seedC && seedC.address === "88 Garfield Pl" && seedC.zip === "11215") {
      const src = RIDE_PRICE_DATA.seedCustomers.find(x => x.id === "c-demo2");
      if (src) { Object.assign(seedC, { address: src.address, city: src.city, state: src.state, zip: src.zip }); minted = true; }
    }
    if (minted) save();
    return state;
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function reset() { localStorage.removeItem(KEY); state = fresh(); save(); }

  return {
    load, save, reset, mintDealNo,
    get s() { return state; },
    customer(id) { return state.customers.find(c => c.id === id); },
    deal(id) { return state.deals.find(d => d.id === id); },
    vehicle(stock) { return RIDE_PRICE_DATA.inventory.find(v => v.stock === stock); }
  };
})();

/* ---------------- utils ---------------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* dates: ISO in state, MM/DD/YYYY on screen. Native date inputs open the OS
   picker on phones — same brand break as native selects — so date fields are
   masked text inputs marked data-date (mask wired once in boot) */
const dateUS = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  return m ? m[2] + "/" + m[3] + "/" + m[1] : String(iso || "");
};
const dateISO = (us) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(us || "").trim());
  if (!m) return "";
  const month = +m[1], day = +m[2], year = +m[3];
  const days = [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (!days || day < 1 || day > days) return "";
  return year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
};
const uid = (p) => p + "-" + Math.random().toString(36).slice(2, 9);
const money = RIDE_PRICE_CALC.money, money0 = RIDE_PRICE_CALC.money0;
const today = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

let toastTimer;
function toast(msg) {
  let t = $("#toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  /* a bar pinned to the bottom of a phone is where the user just tapped — a
     toast there would cover the button, and an instruction covering the
     button it is about is no instruction (owner, 2026-09-08). Four surfaces
     are measured: a dialog's pinned foot, the customer upload page's sticky
     action bar (owner prototype, 2026-08-26), the Base Payment Agreement's
     sticky bar (`.desk-sticky`, named for the route it used to live on), and
     the Master Replication dock. Measured, not assumed: a bar sitting short
     of the bottom, or none at all, keeps the CSS default.

     2026-09-09 — this comment promised "the lowest one wins" while the code
     was a || chain that stopped at the FIRST selector to match anything at
     all. That is correct only while no screen puts two of these on the floor
     together, an invariant nothing enforced and nothing tested; the promise
     is now the code. The two differ on exactly one reachable screen today:
     the drawer's Reset-demo confirm sits high on the page, so its foot is NOT
     anchored — the chain stopped at it and fell back to 26px, this measures
     it, drops it, and still clears the page bar behind it. Invisible either
     way, because that dialog closes before it toasts. Rejected: keeping the
     chain and rewriting this comment to admit first-match, which documents
     the trap instead of removing it — the next flow to gain a dock is where
     it would have fired.

     KNOWN GAP, deliberately left open here: FOUR bottom-pinned bars are
     unmeasured, not two, and half of them are ours. The kit's are `.rp-dock`
     (what chDock draws) and `.rp-signoff` (the jacket's funding sign-off);
     ours are `.mp-dock` on the presentation walkthrough and `.drv-dock` on
     document review. So the scan flow's "Fill in the fields marked in red"
     lands on #svSave on every route that has no dock in this list. The two
     reasons are not the same one. The kit's pair reaches around twenty
     screens a trade-appraisal package cannot run in the browser and
     photograph, and nothing here is done until it has been. Ours are simply
     out of this change's reach: no toast it touches fires on either screen,
     so there is nothing it could have measured — a scope boundary, not a
     verification cost. All four are the next improvement, not a line to slip
     in. */
  /* measured AFTER the paint that follows this call: many callers toast and
     then render the screen the toast belongs to, so measuring now would read
     the outgoing screen — which is how a toast ended up underneath the
     desking payment bar it was supposed to sit above. */
  const place = () => {
    const tops = [$("#modalBack .modal__foot"), $(".dr-clientbottom"), $(".desk-sticky"), $(".tv-dock")]
      .filter(Boolean).map(el => el.getBoundingClientRect())
      .filter(r => r.bottom > window.innerHeight - 80)
      .map(r => r.top);
    t.style.bottom = tops.length ? Math.round(window.innerHeight - Math.min(...tops) + 12) + "px" : "";
  };
  place();
  requestAnimationFrame(place);
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2100);
}

/* title is TEXT and is escaped here, once, at the boundary — callers pass a
   plain string and must not pre-escape it. bodyHtml/footHtml are markup by
   contract and stay raw; whatever builds them escapes its own values. */
function modal(title, bodyHtml, footHtml) {
  closeModal();
  const back = document.createElement("div");
  back.className = "modal-back open";
  back.id = "modalBack";
  back.innerHTML = `<div class="modal">
    <div class="modal__head"><h3>${esc(title)}</h3><button data-close>×</button></div>
    <div class="modal__body">${bodyHtml}</div>
    ${footHtml ? `<div class="modal__foot">${footHtml}</div>` : ""}
  </div>`;
  back.addEventListener("click", (e) => { if (e.target === back || e.target.hasAttribute("data-close")) closeModal(); });
  document.body.appendChild(back);
  return back;
}
function closeModal() { const m = $("#modalBack"); if (m) m.remove(); }

/* a multi-step dialog swaps its footer per step — the buttons live in the
   pinned .modal__foot, never at the end of the scrolling body, so they are
   always on screen; html "" removes the footer for steps that have none */
function setModalFoot(html) {
  const m = $("#modalBack .modal"); if (!m) return;
  let f = $(".modal__foot", m);
  if (!html) { if (f) f.remove(); return; }
  if (!f) { f = document.createElement("div"); f.className = "modal__foot"; m.appendChild(f); }
  f.innerHTML = html;
}

/* required-field marks, shared by every form that validates on submit: clear
   the previous round inside root, paint each miss on its own field with the
   reason under it, scroll the first one to the centre and focus it. bad is
   [{ el, msg }]; returns how many, so a caller can `if (markMissing(...)) return`. */
function markMissing(root, bad) {
  $$(".f-err", root).forEach(el => el.remove());
  $$("input, textarea, select", root).forEach(el => { el.style.borderColor = ""; });
  bad.forEach(({ el, msg }) => {
    el.style.borderColor = "var(--crimson)";
    el.insertAdjacentHTML("afterend", `<span class="f-err">${esc(msg)}</span>`);
  });
  if (bad.length) {
    bad[0].el.scrollIntoView({ block: "center", behavior: "smooth" });
    bad[0].el.focus({ preventScroll: true });
  }
  return bad.length;
}

/* the customer record's required set — ONE place for Create Customer and the
   license-scan verify form: first & last name, email AND phone (both
   required — owner rule 2026-08-23), address & ZIP. Field ids are
   prefix + First/Last/Email/Phone/Addr/Zip, looked up inside root. */
function customerMissing(vals, prefix, root) {
  const bad = [], need = (suffix, okv, msg) => { if (!okv) bad.push({ el: $("#" + prefix + suffix, root), msg }); };
  need("First", vals.first, "Required"); need("Last", vals.last, "Required");
  /* both contact channels are required (owner rule, 2026-08-23 — supersedes
     the earlier either/or): every customer record carries phone AND email */
  need("Email", vals.email, "Required"); need("Phone", vals.phone, "Required");
  need("Addr", vals.address, "Required"); need("Zip", vals.zip, "Required");
  return bad;
}

/* branded replacement for confirm(): destructive actions get a real dialog */
function confirmModal(title, bodyHtml, confirmLabel, onConfirm) {
  modal(title, `<p style="margin:0">${bodyHtml}</p>`,
    `<button class="btn btn--ghost" data-close>Cancel</button>
     <button class="btn btn--danger" id="confirmGo">${confirmLabel}</button>`);
  $("#confirmGo").onclick = () => { closeModal(); onConfirm(); };
}

/* the client initials to select a program; on a phone this is reached through
   the Accept button rather than a box wedged into a column header */
function initialsModal(programLabel, onAccept) {
  modal("Client initials", `<p style="margin:0 0 12px">Have the client initial to accept <b>${esc(programLabel)}</b>.</p>
    <label class="f"><span class="lab">Initials</span><input id="iniModalInput" type="text" maxlength="4" placeholder="initial" autocomplete="off"></label>`,
    `<button class="btn btn--ghost" data-close>Cancel</button>
     <button class="btn btn--grad" id="iniModalGo">Accept</button>`);
  const inp = $("#iniModalInput");
  if (inp) inp.focus();
  const go = () => {
    const val = (inp.value || "").trim().toUpperCase();
    if (!val) { inp.style.borderColor = "var(--crimson)"; return; }
    closeModal(); onAccept(val);
  };
  $("#iniModalGo").onclick = go;
  if (inp) inp.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } };
}

const DEAL_TYPES = { finance: "Finance", lease: "Lease", cash: "Cash", onepay: "One Pay" };
const STAGES = {
  discovery: { label: "Discovery", badge: "badge--new", route: (d) => `#/discovery/${d.id}` },
  vehicle: { label: "Vehicle Selection", badge: "badge--new", route: (d) => `#/vehicles/${d.id}` },
  testdrive: { label: "Test Drive", badge: "badge--prog", route: (d) => `#/testdrive/${d.id}` },
  desking: { label: "Desking", badge: "badge--prog", route: (d) => `#/desk/${d.id}` },
  signed: { label: "Base Signed", badge: "badge--prog", route: (d) => `#/agreement/${d.id}` },
  credit: { label: "Credit App", badge: "badge--prog", route: (d) => `#/credit/${d.id}` },
  menu: { label: "Menu", badge: "badge--menu", route: (d) => `#/menu/${d.id}` },
  forms: { label: "Forms", badge: "badge--menu", route: (d) => `#/menu/${d.id}` },
  /* the finance menu needs a vehicle it can PRICE — a catalog unit — and
     refuses a deal without one, so a funded contract carried by its own
     snapshot (the v022 seed's unstocked Telluride) was a row that bounced
     straight back to Home. The same is true of a stock number the catalog no
     longer holds: truthy, but nothing to price. Either way the deal's record
     is its jacket, which needs only the deal — the rule the two print entries
     already apply. */
  complete: { label: "Complete", badge: "badge--done", route: (d) => d.stock && Store.vehicle(d.stock) ? `#/menu/${d.id}` : `#/jacket/${d.id}` }
};

/* output flows into innerHTML (renderChrome crumbs) — escape here, at the source */
/* THE rule for reading a deal's vehicle snapshot, in one place: it speaks
   only while it agrees with the deal's current stock (exact match), or when
   the deal has no stock at all — the unstocked case the funded seed lives in.
   A snapshot that disagrees is not a vehicle; the catalog re-resolves instead,
   so a stale unit is never paired with a new stock number (review, PR #44).
   Every reader — vehicleIds(), dealTitle(), the jacket header — comes here. */
function vehicleSnapshot(deal) {
  return deal.vehicle && (deal.stock ? deal.vehicle.stock === deal.stock : true) ? deal.vehicle : null;
}
function dealTitle(deal, bare) {
  const c = Store.customer(deal.customerId);
  const cb = deal.coBuyerId ? Store.customer(deal.coBuyerId) : null; /* missing record = no co-buyer */
  /* the catalog first; then the deal's own snapshot, but only while it agrees
     with the deal's stock (or the deal has none — the funded seed's Telluride
     is carried by its snapshot alone). A funded contract must never read
     "no vehicle yet" on its own jacket. */
  const catalog = Store.vehicle(deal.stock);
  const snap = vehicleSnapshot(deal); /* the words may be absent on a blob from before 2026-09-04 */
  const v = catalog || (snap && snap.make ? snap : null);
  const names = `${c ? esc(c.first + " " + c.last) : "—"}${cb ? " + " + esc(cb.first + " " + cb.last) : ""}`;
  const jkc = jacketCounts(deal);
  const line = `${deal.dealNo ? `<b class="crumb-no">Deal #${esc(deal.dealNo)}</b> · ` : ""}${names} · ${v ? esc(v.year + " " + v.make + " " + v.model) : "no vehicle yet"}`;
  if (bare) return line; /* the desking screens repeat these chips in flow */
  return line +
    `
    <button class="crumb-btn" data-buyers="${esc(deal.id)}" title="Buyers on this deal">${cb ? "👥 Buyers" : "👤 Buyer"}</button>
    <a class="crumb-btn" href="#/jacket/${esc(deal.id)}" title="Documents this deal needs" aria-label="Deal jacket${jkc.missing ? ` — ${jkc.missing} document(s) still outstanding` : ""}">📁 Jacket<b class="crumb-btn__n">${esc(jacketChipText(deal))}</b></a>`;
}

/* ---------------- Buyers on the deal, V2 (owner's replication package) -----
   The owner's "Buyers on Deal V2" package (2026-08-29) rebuilt buyer
   management as one bottom sheet: the primary buyer, an optional co-buyer,
   and ONE action — Add co-buyer — that opens the canonical Customer
   Resolver. The old modal's separate Scan / Search buttons are gone (the
   package forbids rebuilding resolver entry points at the buyer level), and
   so is the always-visible Swap: an Advisor never sees a role control at
   all, and a Team Lead sees "Change roles" only when both roles are filled —
   never a button that exists just to explain a permission failure in a toast.

   Every management action is contextual and confirmed: removing the
   co-buyer takes two taps and keeps the customer profile; changing roles
   confirms first and carries the old swap's business rule — a signed
   benefits acknowledgement is voided by the swap and the sheet says so
   before, not after. */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-buyers]");
  if (b) { e.preventDefault(); openBuyersSheet(b.dataset.buyers); }
});

/* ============================================================
   Buyers on the deal (owner's package v033, 2026-09-04)
   ============================================================
   Who the deal and the paperwork belong to: a primary buyer and, when the
   deal needs one, a co-buyer. It is NOT a joint credit application — that is
   an election made in the lending lane, with its own conditions (§19, §21) —
   and nothing here may imply one.

   The sheet renders inside whichever kit screen opened it, because a sheet is
   the kit's own overlay and lives in the screen it covers. The unconverted
   master screens keep their own sheet until their packages land; both go
   through the same helpers below, so the rules cannot drift apart.

   §21, and it is the whole shape of this flow: **authority follows
   consequence.** Removing a buyer is cheap before the lending lane runs and
   expensive after it, so the sheet the advisor sees changes with the deal:

   - Before any credit activity: three data rows. The relationship comes off,
     the person is kept. That is the whole story and the sheet says so.
   - After identity verification, a submitted application, a credit pull or a
     signed acknowledgment: every affected artifact is listed BEFORE any
     destructive control is reachable, and for an Advisor there is no
     destructive control at all — the primary is **Ask a Team Lead**. The
     Team Lead's own sheet carries the action, stamped with who asked and when.

   Removal returns to a STATE, not to the beginning: the count falls to one
   buyer, the Jacket does not fall, and the removed person keeps the full
   customer row — initials, name, phone — plus a dated audit line naming who
   removed her and what was withdrawn. Reattaching her starts a NEW
   application; a withdrawn one is never reopened. */

/* has anything happened that removal would undo? A credit pull has no record
   of its own — the demo writes the approval in the same breath as the
   submission — so a submitted application stands for it. */
function creditActivity(deal) {
  const a = deal.creditApp;
  if (a && !a.withdrawnAt && (a.submitted || a.status === "pending-cobuyer")) return true;
  if (deal.coIdentity && deal.coIdentity.verifiedAt) return true;
  if (deal.menu && deal.menu.ackSigned) return true;
  return false;
}
/* the app's live approval: an application that was withdrawn with the
   co-buyer is not one the menu may price off, and the jacket does not go on
   asking for the lender's stipulation because of it. The record itself stays
   — the lender did approve, and that is history, not a live term. */
function creditLive(deal) {
  const a = deal.creditApp;
  return !!(a && a.approved && !a.withdrawnAt);
}
/* everyone already on the deal is filtered out at the SOURCE, so a duplicate
   can never be offered rather than being offered and then refused */
function buyersFind(deal, query) {
  const t = String(query || "").trim().toLowerCase();
  const td = t.replace(/[^0-9]/g, "");
  if (!t) return [];
  return Store.s.customers
    .filter(x => x.id !== deal.customerId && x.id !== deal.coBuyerId)
    .filter(x => (x.first + " " + x.last).toLowerCase().includes(t)
      || (td && String(x.phone || "").replace(/[^0-9]/g, "").includes(td))
      || (x.license && x.license.number && x.license.number.toLowerCase().includes(t)))
    .slice(0, 6);
}
/* what a removal costs, in the order it matters. The list is derived from the
   deal, so a sheet can never promise less than the removal actually does. */
function buyersConsequences(deal) {
  const out = [];
  const a = deal.creditApp;
  if (a && !a.withdrawnAt && a.submitted) {
    out.push("The joint application is withdrawn — it cannot be converted to an individual one");
    out.push("Her joint-credit authorization is void");
  }
  if (deal.menu && deal.menu.ackSigned) out.push("Her signed benefits acknowledgment is void and must be re-signed if she returns");
  if (a && !a.withdrawnAt && a.approved) out.push("The credit pull already made stays on her file — removal does not undo it");
  return out;
}
/* the removal itself: the pointer comes off, the person is kept, and what was
   withdrawn is recorded against the deal so the state afterwards can say it.
   Jacket documents are MARKED withdrawn, never deleted — which is why the
   count does not fall (§19a). */
function buyersRemove(deal, opts) {
  const o = opts || {};
  const cbId = deal.coBuyerId;
  if (!cbId) return;
  const withdrew = [];
  const a = deal.creditApp;
  if (a && !a.withdrawnAt && a.submitted) {
    a.withdrawnAt = new Date().toISOString();
    a.withdrawnBy = roleName();
    withdrew.push("joint application withdrawn");
    ["creditapp", "approval", "idverify-cobuyer"].forEach(id => {
      const rec = jacketRead(deal).docs[id];
      if (rec) rec.withdrawn = { at: a.withdrawnAt, by: roleName() };
    });
  }
  if (deal.menu && deal.menu.ackSigned) {
    deal.menu.ackSigned = false; delete deal.menu.ackName;
    withdrew.push("benefits acknowledgment void");
  }
  (deal.coBuyerRemovals = deal.coBuyerRemovals || []).push({
    customerId: cbId, at: new Date().toISOString(), by: roleName(),
    byRole: isTeamLead() ? "teamlead" : "advisor",
    requestedBy: o.requestedBy || null, requestedAt: o.requestedAt || null,
    withdrew
  });
  delete deal.coBuyerId;
  delete deal.coBuyerRemoveRequest;
  Store.save();
}
const buyersLastRemoval = (deal) => (deal.coBuyerRemovals || [])[(deal.coBuyerRemovals || []).length - 1] || null;

/* ---------------------------------------------------------------
   the kit sheet: ten states, rendered into the screen that owns it
   --------------------------------------------------------------- */
function buyersKitSheet(deal, sheets, onChange) {
  const ui = { state: "list" };
  const initials = (c) => esc(((c.first || " ")[0] + (c.last || " ")[0]).toUpperCase());
  const timeUS = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const co = () => deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;

  const buyerRow = (c, roleLabel, isCo, attrs, metaLines) => `
    <button type="button" class="rp-buyer"${metaLines ? ` style="align-items:flex-start"` : ""} ${attrs || ""}>
      <span class="rp-initials">${initials(c)}</span>
      <span class="rp-row__body"><span class="rp-buyer__name">${esc(c.first + " " + c.last)}</span>
        <span class="rp-buyer__meta">${esc(c.phone || c.email || "no contact on file")}</span>
        ${(metaLines || []).map(m => `<span class="rp-buyer__meta">${esc(m)}</span>`).join("")}</span>
      ${roleLabel ? `<span class="rp-buyer__role${isCo ? " rp-buyer__role--co" : ""}">${esc(roleLabel)}</span>` : ""}
      <span class="rp-row__chevron"></span></button>`;
  const tileRow = (title, sub, glyph, attrs) => `
    <button type="button" class="rp-row" ${attrs}><span class="rp-tile">${rpGlyph(glyph)}</span>
      <span class="rp-row__body"><span class="rp-row__title">${esc(title)}</span><span class="rp-row__sub">${esc(sub)}</span></span>
      <span class="rp-row__chevron"></span></button>`;
  const kvRow = (label, val, src) => `<div class="rp-kv__row${src ? " rp-kv__row--src" : ""}"><span>${esc(label)}</span><span>${esc(val)}</span>${src ? `<span class="rp-kv__src">${esc(src)}</span>` : ""}</div>`;
  /* the board's own two-up action row: the kit's dialog actions are
     right-aligned at 40px for a centred dialog, and these are 52px
     full-width inside a sheet. Reported, drawn the board's way. */
  const actions = (cancelLabel, goLabel, goKind) => `<div class="rp-dialog__actions" style="justify-content:stretch;gap:10px">
    <button type="button" class="rp-dialog__button rp-dialog__button--quiet" style="flex:1;height:52px;border-radius:15px" data-by="cancel">${esc(cancelLabel)}</button>
    <button type="button" class="rp-dialog__button${goKind === "danger" ? " rp-dialog__button--destructive" : ""}" style="flex:1;height:52px;border-radius:15px${goKind === "danger" ? "" : ";background:var(--rp-gradient);color:#fff"}" data-by="go">${esc(goLabel)}</button>
  </div>`;
  const consequencesBlock = () => {
    const list = buyersConsequences(deal);
    if (!list.length) return "";
    return `<div class="rp-consequences"><strong>What removing her does</strong>
      <ul>${list.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
  };
  /* every reassuring row states its own limit once credit activity exists —
     "kept" and "retained" are half-truths on their own (§21) */
  const keptRows = () => `<div class="rp-kv">
    ${kvRow("Her customer profile", "Kept", "the person is not deleted — her credit history from this deal is not erased")}
    ${kvRow("Jacket documents", "Retained", "the documents stay in the jacket — marked withdrawn, not removed")}</div>`;

  function html() {
    const c = Store.customer(deal.customerId);
    const cb = co();
    const removed = buyersLastRemoval(deal);
    const req = deal.coBuyerRemoveRequest;

    if (ui.state === "add") {
      const hits = buyersFind(deal, ui.q);
      return `${chSheetHead("Add co-buyer")}
        <div class="rp-search rp-search--action" style="background:var(--rp-canvas)">${rpGlyph("search")}
          <input class="rp-search__input" id="byQ" autofocus style="background:none" value="${esc(ui.q || "")}" placeholder="Name, phone, email, or license" aria-label="Search customers">
          <button type="button" class="rp-button-navy" id="byQGo">Search</button></div>
        ${ui.q ? (hits.length
          ? `<div class="rp-section">Result${hits.length === 1 ? "" : "s"}</div><div class="rp-group">
              ${hits.map(x => buyerRow(x, "", false, `data-pick="${esc(x.id)}"`)).join("")}</div>`
          : `<div class="rp-empty"><strong>No match</strong>Nobody in the CRM matches that.
              <div style="height:12px"></div><button type="button" class="rp-button-navy" id="byCreate">Create a new customer</button></div>`) : ""}
        <div class="rp-section">Identify from a license</div>
        <div class="rp-group">
          ${tileRow("Scan physical license", "Same scan and confirm flow", "license", `id="byScan"`)}
          ${tileRow("Send secure upload link", "They upload from their own phone", "upload", `id="byLink"`)}
        </div>`;
    }

    if (ui.state === "actions" && cb) {
      /* the sheet names who she is and what state she is in, because it covers
         the page header (§18a) */
      const sub = creditActivity(deal)
        ? `Co-buyer on this deal · on a submitted joint application`
        : `Co-buyer on this deal · no credit activity yet`;
      return `${chSheetHead(`${cb.first} ${cb.last}`)}
        <p class="rp-sheet__sub">${esc(sub)}</p>
        <div class="rp-group">
          ${tileRow("View customer profile", "Phone, email, address, history", "customers", `id="byView"`)}
          ${tileRow("Scan her license", "She is here in the showroom", "license", `id="byScan"`)}
          ${tileRow("Send secure upload link", "She uploads from her own phone", "upload", `id="byLink"`)}
        </div>
        ${req ? `<div class="rp-notice rp-notice--working"><strong>Removal requested</strong>${esc(req.by)} asked a Team Lead at ${esc(timeUS(req.at))} — it is theirs to approve</div>` : ""}
        <div style="height:6px"></div>
        <button type="button" class="rp-dialog__button rp-dialog__button--destructive" style="width:100%;height:52px;border-radius:15px" id="byRemove">Remove from deal</button>`;
    }

    if (ui.state === "remove" && cb) {
      /* the clean case: three data rows, and that really is the whole story */
      if (!creditActivity(deal)) {
        return `${chSheetHead(`Remove ${cb.first} from this deal?`)}
          <p class="rp-sheet__sub">Second tap confirms</p>
          <div class="rp-kv">
            ${kvRow("Relationship", "Comes off the deal")}
            ${kvRow("Her customer profile", "Kept")}
            ${kvRow("Credit activity", "None yet")}</div>
          ${actions("Cancel", "Remove from deal", "danger")}`;
      }
      /* the consequential case. An Advisor sees every consequence and can ASK;
         the destructive control is not on this sheet at all — absent, not
         disabled — because authority follows consequence (§21). */
      if (!isTeamLead()) {
        return `${chSheetHead(`Remove ${cb.first} from this deal?`)}
          <p class="rp-sheet__sub">She is on a submitted joint application · a Team Lead must approve this</p>
          ${consequencesBlock()}${keptRows()}
          ${actions("Cancel", "Ask a Team Lead", "primary")}`;
      }
      return `${chSheetHead(`Remove ${cb.first} from this deal?`)}
        <p class="rp-sheet__sub">Team Lead action${req ? ` · requested by the ${esc(req.byRole === "teamlead" ? "Team Lead" : "advisor")} ${esc(timeUS(req.at))}` : ""}</p>
        ${consequencesBlock()}${keptRows()}
        ${actions("Cancel", "Remove from deal", "danger")}`;
    }

    if (ui.state === "roles" && cb) {
      return `${chSheetHead(`Make ${cb.first} the primary buyer?`)}
        <p class="rp-sheet__sub">Team Lead action · ${esc(c.first)} becomes the co-buyer</p>
        <div class="rp-consequences"><strong>What changes with the swap</strong><ul>
          ${deal.menu && deal.menu.ackSigned ? `<li>The signed benefits acknowledgment is void and must be re-signed by the new primary</li>` : ""}
          <li>Title and registration paperwork regenerate in the new order</li>
          ${creditActivity(deal) ? `<li>The submitted joint application keeps both applicants; the primary on file with the lender changes</li>` : ""}
        </ul></div>
        <div class="rp-kv">
          ${kvRow("Primary", `${cb.first} ${cb.last}`)}
          ${kvRow("Co-buyer", `${c.first} ${c.last}`)}</div>
        ${actions("Cancel", "Change roles", "primary")}`;
    }

    /* ---- the list, in its three shapes: one buyer, two buyers, and after a
       removal — which is a STATE, not the beginning (§21) ---- */
    const removedRow = removed && !cb ? (() => {
      const person = Store.customer(removed.customerId);
      if (!person) return "";
      const line = `Removed ${timeUS(removed.at)} by ${removed.by}${removed.withdrew.length ? " · " + removed.withdrew.join(" · ") : ""}`;
      return `<div class="rp-section">Removed from this deal</div>
        ${buyerRow(person, "Removed", true, `data-removed="${esc(person.id)}"`, [line])}
        <p class="rp-fine" style="text-align:left;margin:-4px 0 12px">Tap for her profile and the withdrawn application — reattaching her starts a new application, it does not reopen that one.</p>`;
    })() : "";

    return `${chSheetHead("Buyers on this deal")}
      ${cb && isTeamLead() ? `<button type="button" class="rp-sheet__action" id="byRoles">Change roles</button>` : ""}
      <div class="rp-section">Primary buyer</div>
      ${buyerRow(c, "Primary", false, `id="byPrimary"`)}
      ${cb ? `<div class="rp-section">Co-buyer</div>${buyerRow(cb, "Co-buyer", true, `id="byCo"`)}` : removedRow}
      ${cb ? "" : `<div style="height:6px"></div><button type="button" class="rp-primary" id="byAdd">${removed ? "Add a different co-buyer" : "Add co-buyer"}</button>`}`;
  }

  function wire(sheet) {
    const cb = co();
    /* a data change re-renders the SCREEN behind the sheet — which destroys
       the sheet node and reopens it through the controller — so the module
       must not also open it, or it renders twice */
    const changed = () => { if (onChange) onChange(); else open(); };
    const back = (state) => { ui.state = state; open(); };

    const primary = $("#byPrimary", sheet);
    if (primary) primary.onclick = () => { sheets.close(); navigate(`#/credit/${deal.id}`); };
    const coRow = $("#byCo", sheet); if (coRow) coRow.onclick = () => back("actions");
    const add = $("#byAdd", sheet); if (add) add.onclick = () => { ui.q = ""; back("add"); };
    const roles = $("#byRoles", sheet); if (roles) roles.onclick = () => back("roles");
    const rem = $("#byRemove", sheet); if (rem) rem.onclick = () => back("remove");
    /* her removed row is still a person the advisor may need to call */
    const removedRow = $("[data-removed]", sheet);
    if (removedRow) removedRow.onclick = () => { sheets.close(); navigate("#/customers"); };

    const q = $("#byQ", sheet);
    if (q) {
      q.oninput = () => {
        ui.q = q.value;
        const pos = q.selectionStart;
        open();
        const q2 = $("#byQ"); if (q2) { q2.focus(); q2.setSelectionRange(pos, pos); }
      };
      const goBtn = $("#byQGo", sheet); if (goBtn) goBtn.onclick = () => { ui.q = q.value; open(); };
    }
    $$("[data-pick]", sheet).forEach(b => b.onclick = () => {
      /* attaching a co-buyer is a RELATIONSHIP: it files no document and it
         does not create a joint credit application (§19a, §21) */
      deal.coBuyerId = b.dataset.pick;
      Store.save();
      ui.state = "list"; changed();
    });
    const create = $("#byCreate", sheet);
    if (create) create.onclick = () => {
      resolverMission = { kind: "cobuyer", dealId: deal.id, back: location.hash, open: "manual" };
      sheets.close(); navigate("#/customers");
    };
    const scan = $("#byScan", sheet);
    if (scan) scan.onclick = () => {
      const wasAttached = !!cb;
      sheets.close();
      /* both scanner entries hand back into THIS flow — from the add sheet to
         the attached state, from her actions back to her actions */
      openScanFlow({ mode: "cobuyer", deal, onDone: () => {
        document.body.dataset.canvas = "kit";
        ui.state = wasAttached ? "actions" : "list";
        changed();
      } });
    };
    const link = $("#byLink", sheet);
    if (link) link.onclick = () => {
      resolverMission = { kind: "cobuyer", dealId: deal.id, back: location.hash, open: "sendlink" };
      sheets.close(); navigate("#/customers");
    };
    const cancel = $('[data-by="cancel"]', sheet);
    if (cancel) cancel.onclick = () => {
      /* cancelling a consequential request stays in the Team Lead's own view —
         a cancel never hands the phone back to the requesting role (§21) */
      ui.state = ui.state === "roles" ? "list" : (creditActivity(deal) && isTeamLead()) ? "list" : "actions";
      open();
    };
    const go = $('[data-by="go"]', sheet);
    if (go) go.onclick = () => {
      if (ui.state === "roles") {
        const tmp = deal.customerId; deal.customerId = deal.coBuyerId; deal.coBuyerId = tmp;
        if (deal.menu && deal.menu.ackSigned) { deal.menu.ackSigned = false; delete deal.menu.ackName; }
        Store.save(); ui.state = "list"; changed();
        return;
      }
      if (creditActivity(deal) && !isTeamLead()) {
        /* the Advisor's ask: recorded on the deal, so the Team Lead's sheet
           can say who asked and when */
        /* the record keeps WHO asked; the Team Lead's sheet names the ROLE,
           which is what tells them whose request this is to approve */
        deal.coBuyerRemoveRequest = { customerId: deal.coBuyerId, by: roleName(), byRole: isTeamLead() ? "teamlead" : "advisor", at: new Date().toISOString() };
        Store.save(); ui.state = "actions"; changed();
        return;
      }
      const req = deal.coBuyerRemoveRequest;
      buyersRemove(deal, { requestedBy: req && req.by, requestedAt: req && req.at });
      ui.state = "list"; changed();
    };
  }

  function open() { sheets.open(html(), wire); }
  open();
  return { open, go: (state) => { ui.state = state; open(); } };
}

function openBuyersSheet(dealId) {
  const deal = Store.deal(dealId);
  if (!deal) return;
  /* one body-level sheet, usable over any screen the Buyer chip lives on.
     The Escape listener and the hashchange teardown follow the jacket's
     discipline: a listener must never outlive the surface it serves. */
  const old = $("#byScrim"); if (old) old.remove();
  const scrim = document.createElement("div");
  scrim.className = "m-scrim show"; scrim.id = "byScrim";
  scrim.innerHTML = `<div class="m-sheet" role="dialog" aria-modal="true" aria-label="Buyers on this deal" id="bySheet"></div>`;
  document.body.appendChild(scrim);
  const sheet = $("#bySheet");

  const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } };
  function teardown() {
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("hashchange", teardown);
    scrim.remove();
  }
  function close() { teardown(); }
  document.addEventListener("keydown", onKey, true);
  window.addEventListener("hashchange", teardown);
  scrim.onclick = (e) => { if (e.target === scrim) close(); };

  const initials = (c) => esc(((c.first || " ")[0] + (c.last || " ")[0]).toUpperCase());
  const digits = (v) => String(v || "").replace(/\D/g, "");
  const row = (c, roleLabel, coMod, data) => `
    <button type="button" class="by2-row" ${data}>
      <span class="by2-avatar">${initials(c)}</span>
      <span class="by2-rowmain"><span class="by2-rowname">${esc(c.first + " " + c.last)}</span>
        <span class="by2-rowsub">${esc(c.phone || c.email || "no contact on file")}</span></span>
      <span class="by2-pill${coMod ? " by2-pill--co" : ""}">${roleLabel}</span>
      <span class="by2-go">›</span>
    </button>`;

  /* the sheet's states: list → row actions → a confirmation, or → add */
  function render(state, arg) {
    const c = Store.customer(deal.customerId);
    const cb = deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;

    if (state === "actions" && cb) {
      sheet.innerHTML = `<div class="m-handle"></div>
        <div class="by2-head"><h2>${esc(cb.first + " " + cb.last)}</h2></div>
        <p class="by2-sub">Co-buyer on this deal</p>
        <div class="by2-actions">
          <button type="button" class="by2-actionbtn" id="byView">View customer profile</button>
          <button type="button" class="by2-actionbtn by2-actionbtn--danger" id="byRemove">Remove from deal</button>
        </div>`;
      $("#byView", sheet).onclick = () => { close(); navigate(`#/credit/${deal.id}`); };
      $("#byRemove", sheet).onclick = () => render("confirmRemove");
      return;
    }

    if (state === "confirmRemove" && cb) {
      /* the same authority rule the kit sheet enforces (§21), because it is
         about the deal and the role, not about which canvas the advisor
         happens to be standing on: once credit activity exists, every
         consequence is listed and an Advisor can only ASK */
      const consequences = buyersConsequences(deal);
      const mustAsk = creditActivity(deal) && !isTeamLead();
      const req = deal.coBuyerRemoveRequest;
      sheet.innerHTML = `<div class="m-handle"></div>
        <div class="by2-head"><h2>Remove ${esc(cb.first)} from this deal?</h2></div>
        <p class="by2-sub">${consequences.length
          ? (mustAsk ? "She is on a submitted joint application — a Team Lead must approve this"
            : `Team Lead action${req ? ` · requested by the ${esc(req.byRole === "teamlead" ? "Team Lead" : "advisor")}` : ""}`)
          : "Second tap confirms"}</p>
        ${consequences.length
          ? `<div class="by2-confirmcard"><strong>What removing her does</strong>
              <ul>${consequences.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
              <p>Her customer profile is <b>kept</b> — the person is not deleted, and her credit history from this deal is not erased. Jacket documents are <b>retained</b>, marked withdrawn rather than removed.</p></div>`
          : `<div class="by2-confirmcard"><strong>The relationship comes off the deal.</strong>
              <p>${esc(cb.first + " " + cb.last)}'s customer profile is kept — nothing about the person is deleted.</p></div>`}
        <div class="by2-confirmrow">
          <button type="button" class="by2-actionbtn" id="byCancel">Cancel</button>
          ${mustAsk
            ? `<button type="button" class="by2-actionbtn by2-actionbtn--primary" id="byAsk">Ask a Team Lead</button>`
            : `<button type="button" class="by2-actionbtn by2-actionbtn--danger" id="byRemoveGo">Remove from deal</button>`}
        </div>`;
      $("#byCancel", sheet).onclick = () => render("actions");
      const ask = $("#byAsk", sheet);
      if (ask) ask.onclick = () => {
        deal.coBuyerRemoveRequest = { customerId: deal.coBuyerId, by: roleName(), byRole: "advisor", at: new Date().toISOString() };
        Store.save(); render("actions");
      };
      const go = $("#byRemoveGo", sheet);
      if (go) go.onclick = () => {
        const r0 = deal.coBuyerRemoveRequest;
        buyersRemove(deal, { requestedBy: r0 && r0.by, requestedAt: r0 && r0.at });
        router(); render("list");
      };
      return;
    }

    if (state === "confirmRoles" && cb) {
      /* the old swap's business rule survives, said BEFORE the action: a
         signed benefits acknowledgement was signed with the buyers in their
         current positions, so the swap voids it */
      const ackWarn = deal.menu.ackSigned
        ? `<p class="by2-ackwarn">The benefits acknowledgement was signed with the buyers in their current positions. Changing roles clears it — <strong>the client must sign it again</strong>.</p>` : "";
      sheet.innerHTML = `<div class="m-handle"></div>
        <div class="by2-head"><h2>Change buyer roles?</h2></div>
        <p class="by2-sub">Team Lead action</p>
        <div class="by2-confirmcard"><strong>Make ${esc(cb.first + " " + cb.last)} the primary buyer</strong>
          <p>${esc(c.first + " " + c.last)} will become the co-buyer.<br>
          Downstream credit and deal workflows update to the new role assignment.</p></div>
        ${ackWarn}
        <div class="by2-confirmrow">
          <button type="button" class="by2-actionbtn" id="byCancel">Cancel</button>
          <button type="button" class="by2-actionbtn by2-actionbtn--primary" id="byRolesGo">Change roles</button>
        </div>`;
      $("#byCancel", sheet).onclick = () => render("list");
      $("#byRolesGo", sheet).onclick = () => {
        const tmp = deal.customerId; deal.customerId = deal.coBuyerId; deal.coBuyerId = tmp;
        if (deal.menu.ackSigned) {
          deal.menu.ackSigned = false; delete deal.menu.ackName;
          toast("Roles changed — the benefits acknowledgement must be signed again");
        } else toast("Buyer roles changed");
        Store.save(); router(); render("list");
      };
      return;
    }

    if (state === "add" && !cb) {
      sheet.innerHTML = `<div class="m-handle"></div>
        <div class="by2-head"><h2>Add co-buyer</h2></div>
        <p class="by2-sub">Find or identify the customer. Ride Price checks duplicates before attaching.</p>
        <input type="search" class="by2-search" id="byQ" placeholder="Name, phone, or license #" aria-label="Search customers">
        <div id="byHits"></div>
        <div class="by2-seclab">Identify from a license</div>
        <button type="button" class="by2-row" id="byScan">
          <span class="by2-iconwell">${rpIcon("idcard")}</span>
          <span class="by2-rowmain"><span class="by2-rowname">Scan physical license</span>
            <span class="by2-rowsub">Use the same Scan → Confirm flow.</span></span>
          <span class="by2-go">›</span>
        </button>
        <button type="button" class="by2-row" id="byLink">
          <span class="by2-iconwell">${rpIcon("swap")}</span>
          <span class="by2-rowmain"><span class="by2-rowname">Send secure upload link</span>
            <span class="by2-rowsub">Customer uploads directly into Ride Price.</span></span>
          <span class="by2-go">›</span>
        </button>
        <div class="by2-note"><strong>Manual creation appears only after a true no-match.</strong>
          <p>No second customer-entry system.</p></div>`;
      const q = $("#byQ", sheet);
      q.focus();
      q.oninput = () => {
        const t = q.value.trim().toLowerCase(), td = digits(q.value);
        const box = $("#byHits", sheet);
        if (!t) { box.innerHTML = ""; return; }
        /* dedupe at the source: people already on the deal never appear */
        const hits = Store.s.customers.filter(x => x.id !== deal.customerId && x.id !== deal.coBuyerId).filter(x =>
          (x.first + " " + x.last).toLowerCase().includes(t) ||
          (td && digits(x.phone).includes(td)) ||
          (x.license && x.license.number && x.license.number.toLowerCase().includes(t))
        ).slice(0, 6);
        box.innerHTML = hits.length
          ? hits.map(x => `<button type="button" class="by2-row" data-pick="${esc(x.id)}">
              <span class="by2-avatar">${initials(x)}</span>
              <span class="by2-rowmain"><span class="by2-rowname">${esc(x.first + " " + x.last)}</span>
                <span class="by2-rowsub">${esc(x.phone || x.email || "no contact on file")} · Existing customer</span></span>
              <span class="by2-go">›</span>
            </button>`).join("")
          : `<button type="button" class="by2-row" id="byCreate">
              <span class="by2-iconwell">${rpIcon("user")}</span>
              <span class="by2-rowmain"><span class="by2-rowname">No match — create new customer</span>
                <span class="by2-rowsub">Opens the Customer Resolver's manual entry.</span></span>
              <span class="by2-go">›</span>
            </button>`;
        $$("[data-pick]", box).forEach(b => b.onclick = () => {
          deal.coBuyerId = b.dataset.pick; Store.save();
          toast("Co-buyer added to the deal");
          router(); render("list");
        });
        const create = $("#byCreate", box);
        if (create) create.onclick = () => {
          resolverMission = { kind: "cobuyer", dealId: deal.id, back: location.hash, open: "manual" };
          close(); navigate("#/customers");
        };
      };
      $("#byScan", sheet).onclick = () => {
        close();
        openScanFlow({ mode: "cobuyer", deal, onDone: () => { router(); openBuyersSheet(deal.id); } });
      };
      $("#byLink", sheet).onclick = () => {
        resolverMission = { kind: "cobuyer", dealId: deal.id, back: location.hash, open: "sendlink" };
        close(); navigate("#/customers");
      };
      return;
    }

    /* ---- the list ---- */
    sheet.innerHTML = `<div class="m-handle"></div>
      <div class="by2-head"><h2>Buyers on this deal</h2>
        ${cb && isTeamLead() ? `<button type="button" class="by2-roleslink" id="byRoles">Change roles</button>` : ""}</div>
      <p class="by2-sub">One primary buyer. Add a co-buyer only when the deal needs one.</p>
      <div class="by2-seclab">Primary buyer</div>
      ${row(c, "Primary", false, `id="byPrimary"`)}
      ${cb ? `
        <div class="by2-seclab">Co-buyer</div>
        ${row(cb, "Co-buyer", true, `id="byCo"`)}
        <div class="by2-banner">✓ Co-buyer attached to this deal</div>` : `
        <button type="button" class="by2-cta" id="byAdd">Add co-buyer</button>
        <div class="by2-note"><strong>One action opens the Customer Resolver.</strong>
          <p>Search CRM, scan a license, or send a secure upload link.</p></div>`}`;
    /* the whole row is the object: the primary continues into the credit
       application context; the co-buyer opens its contextual actions */
    $("#byPrimary", sheet).onclick = () => { close(); navigate(`#/credit/${deal.id}`); };
    const co = $("#byCo", sheet); if (co) co.onclick = () => render("actions");
    const add = $("#byAdd", sheet); if (add) add.onclick = () => render("add");
    const roles = $("#byRoles", sheet); if (roles) roles.onclick = () => render("confirmRoles");
  }
  render("list");
}

/* ---------------- branded form controls ----------------
   A native <select> opens the OS bottom sheet on phones, which can't be
   styled. Any select marked data-ui="seg" (segmented buttons) or
   data-ui="dd" (styled dropdown) is hidden and driven by a generated
   control; value + change events flow through the select, so existing
   handlers keep working. Options marked data-ph are placeholders and get
   no button. A MutationObserver in boot re-enhances after every render. */
function enhanceControls() {
  $$("select[data-ui]:not([data-enhanced])").forEach(sel => {
    sel.dataset.enhanced = "1";
    const options = [...sel.options].filter(o => !o.hasAttribute("data-ph"));
    const wrap = document.createElement("div");
    if (sel.dataset.ui === "seg") {
      wrap.className = "seg" + (sel.dataset.variant ? " seg--" + sel.dataset.variant : "");
      wrap.setAttribute("role", "group");
      if (sel.title) wrap.setAttribute("aria-label", sel.title);
      wrap.innerHTML = options.map(o =>
        `<button type="button" class="seg__opt${o.selected ? " on" : ""}" data-v="${esc(o.value)}">${esc(o.text)}</button>`).join("");
      wrap.onclick = (e) => {
        const b = e.target.closest(".seg__opt"); if (!b) return;
        sel.value = b.dataset.v;
        wrap.querySelectorAll(".seg__opt").forEach(x => x.classList.toggle("on", x === b));
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      };
    } else {
      const cur = sel.selectedOptions[0];
      const curText = cur && !cur.hasAttribute("data-ph") ? cur.text : (sel.dataset.placeholder || "Select…");
      wrap.className = "dd";
      wrap.innerHTML = `<button type="button" class="dd__btn" aria-haspopup="listbox" aria-expanded="false"><span>${esc(curText)}</span><i>▾</i></button>
        <div class="dd__list" role="listbox">${options.map(o =>
          `<button type="button" class="dd__opt${o.selected ? " on" : ""}" role="option" data-v="${esc(o.value)}">${esc(o.text)}</button>`).join("")}</div>`;
      const btn = wrap.querySelector(".dd__btn");
      btn.onclick = () => btn.setAttribute("aria-expanded", String(wrap.classList.toggle("open")));
      wrap.querySelector(".dd__list").onclick = (e) => {
        const b = e.target.closest(".dd__opt"); if (!b) return;
        sel.value = b.dataset.v;
        btn.querySelector("span").textContent = b.textContent;
        wrap.querySelectorAll(".dd__opt").forEach(x => x.classList.toggle("on", x === b));
        wrap.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      };
    }
    sel.after(wrap);
  });
}

/* ---------------- roles ---------------- */
const isTeamLead = () => Store.s.role === "teamlead";
const roleName = () => isTeamLead() ? RIDE_PRICE_DATA.dealership.teamLead : Store.s.advisor;
const roleTitle = () => isTeamLead() ? "Team Lead" : "Client Advisor";

/* ---------------- chrome ---------------- */
function renderChrome(title, crumbs, actionsHtml) {
  $("#appbarStore").textContent = RIDE_PRICE_DATA.dealership.name;
  $("#appbarUser").innerHTML = `Welcome <b>${esc(roleName())}</b>
    <select id="roleSwitch" data-ui="seg" data-variant="bar" title="Switch role">
      <option value="advisor" ${!isTeamLead() ? "selected" : ""}>Advisor</option>
      <option value="teamlead" ${isTeamLead() ? "selected" : ""}>Team Lead</option>
    </select>`;
  $("#roleSwitch").onchange = (e) => {
    Store.s.role = e.target.value; Store.save();
    toast("Now acting as " + roleTitle() + " — " + roleName());
    router();
  };
  $("#pageTitle").textContent = title;
  $("#pageCrumbs").innerHTML = crumbs || "";
  $("#pageActions").innerHTML = actionsHtml || "";
  /* per-screen styling hook; routes that want it re-set it after this call */
  document.body.dataset.screen = "";
  document.body.dataset.canvas = "";
  document.body.classList.remove("script-open");
}

/* ---------------- router ---------------- */
/* a scan that ends in "create new" from an entry point with no create
   callback sets this; the customers route consumes it once on arrival */
let scanWantsCreate = false;
/* the buyers sheet sends the advisor into the canonical Customer Resolver on
   a MISSION — attach the person it resolves as this deal's co-buyer instead
   of starting a new visit. Consumed once by the customers route on arrival,
   the same contract as scanWantsCreate; a secure-upload session created
   under a mission carries it on the session itself, so it survives a
   reload where this module flag cannot. */
let resolverMission = null;
const routes = [];
function route(pattern, fn) { routes.push({ pattern, fn }); }
function navigate(hash) { location.hash = hash; }
/* a route that immediately forwards somewhere else must REPLACE its history
   entry, not push over it — pushing leaves the dead hash behind the new one,
   so Back returns to it and it forwards again: a loop the user cannot Back
   out of (measured on the retired composer hash — two Backs and still stuck).
   Use this, never navigate(), for any guard or retired route that redirects. */
/* a route that redirects is not a place anyone stood: it must not become
   the hash Back returns to, or Back lands on the alias, gets redirected
   forward again, and the advisor is looped on a screen that has no app bar
   to leave by (review find — my own first fix had exactly this hole). */
let routerReplacing = false;
function redirect(hash) { routerReplacing = true; location.replace(hash); }
/* the hash this router last rendered. A screen on the master canvas has no
   app bar, so when it is the FIRST page in a tab its back control has nowhere
   to go; this is what it falls back to. Deliberately not history.length —
   that counts entries the fallback itself adds, so a Back that pushed
   #/deals made the next Back believe there was history to pop. */
let routerPrevHash = null, routerCurHash = null;
function router() {
  const hash = location.hash || "#/deals";
  const parts = hash.replace(/^#\//, "").split("/");
  for (const r of routes) {
    const p = r.pattern.split("/");
    if (p.length !== parts.length) continue;
    const params = {};
    let ok = true;
    p.forEach((seg, i) => {
      if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(parts[i]);
      else if (seg !== parts[i]) ok = false;
    });
    if (ok) {
      if (hash !== routerCurHash) {
        /* arriving BY a redirect: the hash we are leaving was the alias, so
           keep whatever was behind it instead of recording the alias */
        if (!routerReplacing) routerPrevHash = routerCurHash;
        routerCurHash = hash;
        routerReplacing = false;
      }
      r.fn(params); window.scrollTo(0, 0); return;
    }
  }
  navigate("#/deals");
}

const view = () => $("#view");

/* ============================================================
   VIEW: Deals — the active floor queue
   (owner mockup 2026-08-20: layout from the sample, every value live)
   ============================================================ */

/* screen state at module level so typing and pill picks survive re-renders;
   the brand logo resets both and re-pulls the queue (owner spec) */
const dealsUI = { q: "", pipe: "all", range: "today", from: "", to: "", funded: false };

/* Two queues, one route (owner, 2026-08-23): the Team Lead's floor view is
   UNCHANGED from the original — All / Desking / F&I-Docs pills, the classic
   cards, funded contracts folded under Archived — because a team leader reads
   two lanes: what is being desked and what is allocated to finance. The
   advisor gets the guided view: no filter dashboard, rows carrying the four
   identifiers (name, VIN, stock, stage) with a Next line, funded deals at the
   end of the same list. */

/* the Team Lead's two pipeline lanes: before a signed base the deal is being
   desked; from the signed base on, the work is F&I and documents. A complete
   deal is funded and leaves the active queue into the archive fold. */
const FNI_STAGES = ["signed", "credit", "menu", "forms"];
const dealPipe = (d) => d.stage === "complete" ? "funded" : (FNI_STAGES.indexOf(d.stage) >= 0 ? "fni" : "desking");

/* v3 (owner package, 2026-08-28): showroom visits are their own section, not
   a deal stage, so the buckets cover desked work only — three stages
   everywhere: DESKING, F&I, DONE. The five-chip advisor vocabulary of
   2026-08-23 is superseded by this package. */
const SHOWROOM_STAGES = ["discovery", "vehicle", "testdrive"];
/* "In showroom" is a STATE the advisor sets (chrome rule v022 §10): the
   resolver's start-visit actions check the customer in, stamping the deal's
   visit with an arrival time. The deal's stage never changes the showroom
   count — John can be Desking and in the showroom at once. Deals from before
   the field keep the old reading (an early stage meant "on the floor"), so
   nothing saved earlier disappears. How a visit ENDS is an open item the
   package told us not to invent: a checked-in customer stays listed until
   the code gains a check-out. */
function inShowroom(d) {
  /* a funded deal is off the floor on BOTH paths. The stage does not put a
     customer in the showroom, but it does take a delivered one out of it:
     without this the stamp outlives the deal and Home reads "In showroom 1 /
     Arrived 11:38 · Done" beside "0 active" for good, since nothing ends a
     visit yet. Check-out is still the package's open item. */
  if (d.visit) return !!d.visit.arrivedAt && !d.visit.endedAt && d.stage !== "complete";
  return SHOWROOM_STAGES.indexOf(d.stage) >= 0 && d.stage !== "complete";
}
function arrivedLabel(d) {
  const at = d.visit && d.visit.arrivedAt ? d.visit.arrivedAt : d.createdAt;
  /* "Arrived 11:38" — the hour and minute, as the package writes it */
  /* h23 explicitly: hour12:false may resolve to h24 on some engines, and a
     visit five minutes after midnight would read "Arrived 24:05" */
  return at ? new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false, hourCycle: "h23" }) : "";
}

/* ============================================================
   CHROME RULE (owner's handoff v022, 2026-09-04) — two templates, one
   definition each, for the 19 mobile screens of Home and the resolver.
   DESTINATION: wordmark left, role control right, floating tab bar.
   TASK: close left, task name + step centred, the same role control, an
   action dock or nothing. The banner slot under the status bar is the only
   place the environment and impersonation appear — the DEMO chip and the
   floating "Now acting as" pill are gone. Sheets open over either template
   without changing it.
   ============================================================ */
/* The chrome glyph set (kit icons/glyphs/, 24px grid, currentColor), inlined
   so the stroke takes the surrounding colour — an <img> cannot. The files in
   assets/icons/glyphs/ are the source; this map is those files verbatim. */
const RP_GLYPH = {
  "check": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12l4.5 4.5L19 7\" stroke-width=\"2.2\"/></svg>",
  "chevron-down": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 9l6 6 6-6\"/></svg>",
  "chevron": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 6l6 6-6 6\"/></svg>",
  "close": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 6l12 12M18 6L6 18\" stroke-width=\"2\"/></svg>",
  "customers": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21c0-4 4-6 8-6s8 2 8 6\"/></svg>",
  "deals": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 3h9l4 4v14H6z\"/><path d=\"M9 12h6M9 16h6\"/></svg>",
  "document": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 3h9l4 4v14H6z\"/><path d=\"M9 12h6M9 16h6\"/></svg>",
  "hub": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1\"/></svg>",
  "inventory": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 14l2-5h12l2 5v4H4z\"/><circle cx=\"7.5\" cy=\"16\" r=\"1.5\"/><circle cx=\"16.5\" cy=\"16\" r=\"1.5\"/></svg>",
  "license": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"2.5\"/><circle cx=\"8\" cy=\"12\" r=\"2.3\"/><path d=\"M13 10h5M13 14h5\"/></svg>",
  "more": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><circle cx=\"6\" cy=\"12\" r=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><circle cx=\"18\" cy=\"12\" r=\"2\"/></svg>",
  "scan": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4\"/><path d=\"M7 12h10\"/></svg>",
  "search": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"10.5\" cy=\"10.5\" r=\"6.5\"/><path d=\"M15.5 15.5L21 21\"/></svg>",
  "trash": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3\"/></svg>",
  "upload": "<svg class=\"rp-icon\" xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 9l6-6 6 6M12 3v12\"/><path d=\"M4 20h16\"/></svg>"
};
const rpGlyph = (name) => RP_GLYPH[name] || RP_GLYPH.document;
/* The liquid-glass family ships at assets/icons/glass/<mode>/ and NOTHING in
   the app draws it: a row group wears the flat glyph tile, everywhere (owner,
   2026-09-04), and the set is kept for the app mark alone. There is no helper
   for it, because a helper nobody calls is a helper that rots — the files are
   the asset, and the mark can load one directly when it needs to. */
const CH_TABS = [["deals", "#/deals", "deals", "Deals"], ["inventory", "#/vehicles/browse", "inventory", "Inventory"], ["customers", "#/customers", "customers", "Customers"], ["more", null, "more", "More"]];
const roleInitials = () => isTeamLead() ? "TL" : "A";
/* the banner slot — Advisor: sample data; Team Lead: who is being acted as,
   with the inline Switch that opens the role sheet */
function chBanner() {
  return isTeamLead()
    ? `<div class="rp-banner"><span class="rp-banner__dot"></span><span class="rp-banner__tag">DEMO</span><span class="rp-banner__text">Acting as ${esc(roleName())}</span><button type="button" class="rp-banner__action" data-role-open>Switch</button></div>`
    : `<div class="rp-banner"><span class="rp-banner__dot"></span><span class="rp-banner__tag">DEMO</span><span class="rp-banner__text">Sample data only</span></div>`;
}
/* the role control — identical on both templates; tapping opens the role sheet */
const chRole = () => `<button type="button" class="rp-role" data-role-open aria-label="Switch role"><span class="rp-role__avatar">${roleInitials()}</span>${isTeamLead() ? "Team Lead" : "Advisor"}${rpGlyph("chevron-down")}</button>`;
/* the wordmark: the words "Ride Price" — the kit's class, the kit's gradient */
const chWordmark = () => `<a class="rp-wordmark" href="#/deals" aria-label="Ride Price — Deals">Ride Price</a>`;
/* the top bar for either template */
function chTop(opts) {
  if (opts.template === "task") {
    return `<header class="rp-topbar">
      <button type="button" class="rp-topbar__close" id="${opts.closeId || "chClose"}" aria-label="${esc(opts.closeLabel || "Close")}">${rpGlyph("close")}</button>
      <div class="rp-topbar__title">${esc(opts.title)}${opts.step ? `<small>${esc(opts.step)}</small>` : ""}</div>
      ${chRole()}</header>`;
  }
  return `<header class="rp-topbar">${chWordmark()}${chRole()}</header>`;
}
/* the floating tab bar — Destination only; the kit refuses it on a task */
function chTabbar(active) {
  return `<nav class="rp-tabbar" aria-label="Primary">${CH_TABS.map(([key, href, icon, label]) => {
    const on = key === active;
    /* More is a button, not a link — and on a sub-destination (Training
       documents) it is the active tab, whose tap reopens its sheet */
    if (!href) return `<button type="button" class="rp-tab${on ? " rp-tab--active" : ""}" id="dqMore"${on ? ' aria-current="page"' : ""}>${rpGlyph(icon)}${label}</button>`;
    return on ? `<span class="rp-tab rp-tab--active" aria-current="page">${rpGlyph(icon)}${label}</span>`
              : `<a class="rp-tab" href="${href}">${rpGlyph(icon)}${label}</a>`;
  }).join("")}</nav>`;
}
/* the action dock — Task only: one primary, at most one text link under it */
const chDock = (primaryHtml, linkHtml) => `<div class="rp-dock">${primaryHtml}${linkHtml || ""}</div>`;
/* the whole frame: the kit's screen skeletons. Only .rp-page scrolls. The
   scrim and sheet live INSIDE the screen, hidden until opened. */
function chShell(opts, content, dockHtml, sheetIds) {
  const task = opts.template === "task";
  const ids = sheetIds || { scrim: "chScrim", sheet: "chSheet" };
  /* opts.cls carries a kit screen modifier the caller owns — today only
     rp-screen--present, the desking mode where the phone is turned to the
     customer (the kit hides the role control and darkens the close itself) */
  return `<div class="rp-screen ${task ? "rp-screen--task" + (dockHtml ? "" : " rp-screen--nodock") : "rp-screen--destination"}${opts.cls ? " " + opts.cls : ""}">
    ${chBanner()}${chTop(opts)}
    <main class="rp-page rp-stack">${content}</main>
    ${dockHtml || ""}${task ? "" : chTabbar(opts.active)}
    <div class="rp-scrim" id="${ids.scrim}" hidden></div><div class="rp-sheet" id="${ids.sheet}" role="dialog" aria-modal="true" tabindex="-1" hidden></div>
  </div>`;
}
/* one sheet opener for the kit's overlay: grab handle, then the screen's html */
/* onClose, when given, runs after a sheet that was open is closed — by the
   scrim, Escape, a data-sheet-close control or close() itself — so a screen
   whose state follows the sheet (the training hub's print set) has one place
   to hear it. Not on a navigation: the route change only detaches. */
function chSheetOpener(scrimId, sheetId, onClose) {
  const scrim = () => $("#" + scrimId), sheet = () => $("#" + sheetId);
  /* what opened it, and the two listeners that are bound only while it is up */
  let opener = null, onKey = null, onHash = null;
  const detach = () => {
    if (onKey) { document.removeEventListener("keydown", onKey); onKey = null; }
    if (onHash) { window.removeEventListener("hashchange", onHash); onHash = null; }
  };
  const close = () => {
    detach();
    /* the router can replace #view while a sheet is open — the More sheet's
       rows are links — so the scrim and the sheet may be gone by the time a
       later Escape reaches this. Closing what is no longer there is a no-op,
       not a TypeError, and the listener has already taken itself off. */
    const sc = scrim(), sh = sheet();
    const wasOpen = !!(sh && !sh.hidden);
    if (sc) sc.hidden = true;
    if (sh) sh.hidden = true;
    if (wasOpen && onClose) onClose();
    /* aria-modal hides the page behind the sheet, so a cursor left on the
       control that opened it has nothing to read and no way out. Put it back
       where it came from — and only if that control is still on the page. */
    if (opener && document.contains(opener) && opener.focus) opener.focus();
    opener = null;
  };
  const open = (html, onMount) => {
    detach();   /* a second open without a close in between must not leak the first listener */
    /* remember what opened it BEFORE focus moves into the sheet — close()
       hands focus back to this, and had nothing to hand it to. A second
       open from inside the sheet (a dialog raised over it) keeps the first
       opener: the control on the page is still the way back. */
    const from = document.activeElement;
    if (from && from !== document.body && !(sheet() && sheet().contains(from))) opener = from;
    /* the screen has ONE sheet node and every sheet reuses it, so its shape is
       reset here rather than by whoever changed it. chDialog() turns it into a
       centred dialog and used to change it back in its own two buttons only —
       the scrim, which closes through this module, restored nothing, and the
       next sheet on that screen opened as a floating box. One owner, and a
       later caller cannot forget it. */
    sheet().className = "rp-sheet";
    sheet().innerHTML = `<div class="rp-sheet__grab"></div>${html}`;
    scrim().hidden = false; sheet().hidden = false;
    scrim().onclick = close;
    $$("[data-sheet-close]", sheet()).forEach(b => b.onclick = close);
    if (onMount) onMount(sheet());
    /* a dialog with no name is announced as "dialog" and nothing else. It
       names itself from its own heading, after onMount so chDialog's title
       is there too; a sheet with no heading carries no stale name. */
    const t = sheet().querySelector(".rp-sheet__title, .rp-dialog__title");
    if (t) { if (!t.id) t.id = sheetId + "Title"; sheet().setAttribute("aria-labelledby", t.id); }
    else sheet().removeAttribute("aria-labelledby");
    onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    /* a sheet row can be a LINK — the More sheet's are — so the screen can be
       replaced without close() ever running. The null guards in close() keep
       that from throwing, but the listener would still be there, one more per
       navigation, each holding the element that opened it. The route change
       takes them off itself. */
    onHash = () => { detach(); opener = null; };
    window.addEventListener("hashchange", onHash);
    /* a sheet whose work starts in a field marks it autofocus (inert on
       inserted markup, so it is only a marker) — the code and search sheets;
       otherwise the first control, which is the close */
    const first = sheet().querySelector("[autofocus]") || sheet().querySelector("button, [href], input, select, textarea");
    (first || sheet()).focus();
  };
  return { open, close };
}
/* The kit reserves a FIXED strip at the foot of a scrolling page for the dock
   that sits over it — 140px on a Task, 150px on a gate since v022.19, down
   from 250px. A dock whose copy wraps at 320px is taller than that, and the
   last control on the page ends up underneath it. The kit is the owner's
   asset and a gap in it is reported, never restyled, so the SCREEN reserves
   what its own dock actually needs: one inline value, measured after paint,
   applied only when the kit's reservation falls short, and never touching the
   kit's rule for any other screen. Reported for v022.19. */
function chFitDock(dockSel) {
  const page = $(".rp-page"), dock = $(dockSel || ".rp-dock");
  if (!page || !dock) return;
  const need = Math.ceil(dock.getBoundingClientRect().height) + 28;
  const have = parseFloat(getComputedStyle(page).paddingBottom) || 0;
  if (need > have) page.style.paddingBottom = need + "px";
}
const chSheetHead = (title) => `<div class="rp-sheet__head"><h2 class="rp-sheet__title">${esc(title)}</h2><button type="button" class="rp-sheet__close" data-sheet-close aria-label="Close">${rpGlyph("close")}</button></div>`;
/* the role sheet — one definition, opened from the role control or the
   banner's Switch on any of the 19 screens */
function chRoleSheet(sheets, afterSwitch) {
  const lead = isTeamLead();
  const opt = (key, title, sub, on) => `<button type="button" class="rp-option${on ? " rp-option--on" : ""}" data-role="${key}"><span><span class="rp-option__title">${title}</span><span class="rp-option__sub">${sub}</span></span><span class="rp-radio${on ? " rp-radio--on" : ""}">${on ? rpGlyph("check") : ""}</span></button>`;
  sheets.open(`${chSheetHead("Switch role")}
    ${opt("advisor", "Advisor", "Guided queue with the next action on each deal", !lead)}
    ${opt("teamlead", "Team Lead", "Active floor, showroom visits, and date-based history", lead)}`, (sheet) => {
    $$("[data-role]", sheet).forEach(b => b.onclick = () => {
      Store.s.role = b.dataset.role === "teamlead" ? "teamlead" : "advisor";
      Store.save(); sheets.close();
      if (afterSwitch) afterSwitch();
    });
  });
}
/* root scopes the wiring: a task drawn OVER a kit screen (the scan, inside the
   resolver's frame) binds its own role control and leaves the screen
   underneath bound to its own sheet */
function chWireRole(sheets, afterSwitch, root) {
  $$("[data-role-open]", root).forEach(b => b.onclick = () => chRoleSheet(sheets, afterSwitch));
}
/* the kit's dialog, inside the screen: title, one sentence, quiet + destructive */
function chDialog(sheets, title, body, actionLabel, onConfirm) {
  sheets.open(`<div class="rp-dialog__title">${esc(title)}</div><p class="rp-dialog__body">${esc(body)}</p>
    <div class="rp-dialog__actions"><button type="button" class="rp-dialog__button rp-dialog__button--quiet" data-sheet-close>Cancel</button><button type="button" class="rp-dialog__button rp-dialog__button--destructive" id="chDialogGo">${esc(actionLabel)}</button></div>`, (sheet) => {
    /* the shape is restored by the opener on the next open, so no dismissal
       path has to remember to undo this one */
    sheet.classList.add("rp-dialog"); sheet.classList.remove("rp-sheet");
    const grab = sheet.querySelector(".rp-sheet__grab"); if (grab) grab.remove();
    $("#chDialogGo", sheet).onclick = () => { sheets.close(); onConfirm(); };
  });
}
/* the More sheet: secondary destinations, and the reset behind the kit's
   dialog. One definition — opened from the tab bar on Home and on every
   sub-destination that carries the More tab (Training documents, v024).
   The row for the screen already on show closes the sheet instead of
   navigating nowhere. */
function chMoreSheet(sheets) {
  /* flat glyph tiles: a row group is all-flat or all-glass, and this one has
     no family icon for the hub, so it is flat throughout */
  const row = (href, icon, title, sub) => {
    const here = href === (location.hash || "#/deals").split("/registrations")[0];
    return `<a class="rp-row" href="${href}"${href.indexOf("../") === 0 ? ` target="_blank" rel="noopener"` : ""}${here ? ` aria-current="page" data-here` : ""}><span class="rp-tile">${rpGlyph(icon)}</span><span class="rp-row__body"><span class="rp-row__title">${title}</span><span class="rp-row__sub">${sub}</span></span><span class="rp-row__chevron"></span></a>`;
  };
  sheets.open(`${chSheetHead("More")}
    <div class="rp-group">
    ${row("#/vehicles/browse", "inventory", "Inventory", "Browse or search vehicles")}
    ${row("#/customers", "customers", "New customer visit", "Open the customer resolver")}
    ${row("#/props", "document", "Training documents", "Prop licenses and registrations")}
    ${row("../ride-price-training-hub/index.html", "hub", "Training hub", "Guides and practice flows")}
    </div>
    <div class="rp-group rp-group--spaced">
    <button type="button" class="rp-row rp-row--destructive" id="dqReset"><span class="rp-tile">${rpGlyph("trash")}</span><span class="rp-row__body"><span class="rp-row__title">Reset demo data</span><span class="rp-row__sub">Return the demo to its original seed state</span></span><span class="rp-row__chevron"></span></button>
    </div>`, (sheet) => {
    $$("[data-here]", sheet).forEach(a => a.onclick = (e) => { e.preventDefault(); sheets.close(); });
    $("#dqReset", sheet).onclick = () => {
      sheets.close();
      /* the kit's dialog, in place of the app-wide confirm (Home 03) */
      chDialog(sheets, "Reset demo data?", "All deals and customers you created will be removed and the demo returns to its seed state.", "Reset demo data", () => {
        Store.reset(); navigate("#/deals"); router(); toast("Demo data reset");
      });
    };
  });
}
const DEAL_BUCKETS = [
  { id: "desking", label: "Desking", chip: "DESKING", badge: "badge--prog", stages: ["discovery", "vehicle", "testdrive", "desking"] },
  { id: "fni", label: "F&I", chip: "F&I", badge: "badge--new", stages: ["signed", "credit", "menu", "forms"] },
  { id: "done", label: "Done", chip: "DONE", badge: "badge--done", stages: ["complete"] }
];
const dealBucket = (d) => DEAL_BUCKETS.find(b => b.stages.indexOf(d.stage) >= 0) || DEAL_BUCKETS[0];

/* the card's status line — the deal's immediate next action, read from the
   same state the screen behind the tap will show */
function dealNextAction(d) {
  switch (d.stage) {
    case "discovery": return "Discovery Interview In Progress";
    case "vehicle": return "Selecting a Vehicle";
    case "testdrive": return d.testDrive && d.testDrive.done ? "Test Drive Complete · Next Step Pending" : "Test Drive In Progress";
    case "desking":
      if (d.trade && d.trade.has && !(Number(d.trade.value) > 0)) return "Pending Trade Appraisal";
      if (!d.huddle || !d.huddle.done) return "Game Plan With the Team Lead";
      return "Customer Reviewing Quote";
    case "signed": return "Base Signed · Credit App Next";
    case "credit": return "Credit Application In Progress";
    case "complete": return "Funded";
  }
  /* menu / forms — the sign-off gate first, then the documents */
  if (d.stage === "menu" && !d.signoff) return "Awaiting Team Lead Sign-Off";
  const led = jacketLedgers(d);
  if (led.missing > 0) {
    const q = clientQueue(d);
    const m = q.length ? docMeta(q[0]) : null;
    return m ? "Missing " + m.label : led.accepted + "/" + led.total + " Docs Verified";
  }
  return led.accepted + "/" + led.total + " Docs Verified · Ready to Finalize";
}

route("deals", () => {
  /* Advisor sees the deals assigned to them; Team Lead sees the whole floor.
     A deal saved before deals carried an advisor belongs to the demo's one
     advisor — that is who created it. */
  const lead = isTeamLead();
  const mine = Store.s.deals.filter(d => lead || !d.advisor || d.advisor === Store.s.advisor);
  const bySeen = (a, b) => (b.createdAt || "").localeCompare(a.createdAt || "");
  /* v3: In showroom is a separate active-visits section, not a deal stage */
  /* v022: presence is its own list and never moves a deal out of the deal
     list — a customer in the showroom with a desking deal is in BOTH */
  const showroom = mine.filter(inShowroom).sort(bySeen);
  const act = mine.filter(d => d.stage !== "complete").sort(bySeen);
  const funded = mine.filter(d => d.stage === "complete").sort(bySeen);

  renderChrome(lead ? "Active Floor" : "My Deals", "", "");
  document.body.dataset.screen = "deals";
  /* "kit", not "master": the two chrome screens need the app bar and the view
     padding gone, and nothing else. The master canvas also re-declares --ink,
     --surface and body color, and body[data-canvas] outranks the kit own body
     rule, so a kit screen was painting in the master ink (#121A35) on the
     master canvas (#F7F7F7) instead of the kit tokens it is meant to carry. */
  document.body.dataset.canvas = "kit";

  /* one resolver for the vehicle identity a row may show: the deal's own
     snapshot first (survives unstocked units and catalog changes), the
     catalog as fallback for blobs saved before the snapshot existed */
  function vehicleIds(d) {
    const v = Store.vehicle(d.stock);
    /* the snapshot speaks only while it agrees with the deal's current stock:
       exact match, or the deal has no stock at all (the unstocked case). A
       snapshot without a stock is NOT accepted against a stocked deal — if
       that stock stops resolving, the row would pair the old unstocked VIN
       with the new stock number (review, PR #44). A stale snapshot
       re-resolves fresh from the catalog instead of showing the old unit. */
    const snap = vehicleSnapshot(d);
    return {
      v, snap,   /* the VALIDATED snapshot — the row and the search read this, never d.vehicle raw */
      vin: (v && v.vin) || (snap && snap.vin) || null,
      stock: d.stock || (snap && snap.stock) || null
    };
  }

  /* the Team Lead's history window (v3: the date control governs HISTORY —
     the live floor is always current, an active deal never disappears
     because it started last week) */
  const rangeWin = () => {
    const now = new Date();
    const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dealsUI.range === "yesterday") { const y = new Date(d0); y.setDate(y.getDate() - 1); return { from: y, to: d0, label: "Yesterday" }; }
    if (dealsUI.range === "7d") { const f = new Date(d0); f.setDate(f.getDate() - 6); return { from: f, to: null, label: "Last 7 days" }; }
    if (dealsUI.range === "30d") { const f = new Date(d0); f.setDate(f.getDate() - 29); return { from: f, to: null, label: "Last 30 days" }; }
    if (dealsUI.range === "custom") {
      const f = dealsUI.from ? new Date(dealsUI.from + "T00:00") : null;
      let t = dealsUI.to ? new Date(dealsUI.to + "T00:00") : null;
      if (t) { t = new Date(t); t.setDate(t.getDate() + 1); }
      return { from: f, to: t, label: (dealsUI.from || "…") + " – " + (dealsUI.to || "…") };
    }
    return { from: d0, to: null, label: "Today" };
  };
  /* when a deal funded — the DMS closeout stamp Finalize already writes
     (`dms.at`, menu V3), not a second field recording the same moment. A deal
     completed before that stamp existed keeps its opening date, which is the
     only date it holds; the app never guesses a later one. One definition, so
     the badge and the date range cannot disagree. */
  const fundedOnISO = (d) => (d.dms && d.dms.at) || d.createdAt || "";
  const fundedInRange = () => {
    const w = rangeWin();
    return funded.filter(d => { const at = new Date(fundedOnISO(d) || 0); return (!w.from || at >= w.from) && (!w.to || at < w.to); });
  };

  const counts = {
    all: act.length,
    desking: act.filter(d => dealPipe(d) === "desking").length,
    fni: act.filter(d => dealPipe(d) === "fni").length
  };

  /* search matches name, vehicle, stock, VIN, deal #, or phone — punctuation
     dropped on both sides so "(555) 12" finds the digits it contains */
  function matches(d) {
    const q = dealsUI.q.trim().toLowerCase();
    if (!q) return true;
    const c = Store.customer(d.customerId), { v, snap } = vehicleIds(d);
    const hay = [
      c ? c.first + " " + c.last : "", c && c.phone ? c.phone : "",
      v ? v.year + " " + v.make + " " + v.model : "", v ? v.stock : "", v && v.vin ? v.vin : "",
      /* the snapshot's WORDS too, not only its numbers: an unstocked deal
         (the funded seed's Telluride) shows a vehicle the catalog does not
         hold, and searching the name the row displays found nothing while the
         empty state blamed the date range. The VALIDATED snapshot, the same one
         the row draws — a stale one on a re-stocked deal must not match either. */
      snap ? [snap.year, snap.make, snap.model, snap.vin, snap.stock].filter(Boolean).join(" ") : "",
      d.dealNo ? "#" + d.dealNo : "", d.trade && d.trade.vin ? d.trade.vin : ""
    ].join(" ").toLowerCase();
    return hay.indexOf(q) >= 0 ||
      hay.replace(/[^a-z0-9]/g, "").indexOf(q.replace(/[^a-z0-9]/g, "")) >= 0;
  }

  /* one deal row (v3): the four identifiers hold for every role — name, the
     mono VIN/STK line with honest Pending fallbacks, the vehicle, the stage
     chip — plus the advisor's Next line, and the chevron as the tap cue */
  function dealRow(d, { next = true } = {}) {
    const c = Store.customer(d.customerId);
    const st = STAGES[d.stage] || STAGES.discovery;
    const b = dealBucket(d);
    const name = c ? c.first + " " + c.last : "—";
    const { v, snap, vin, stock } = vehicleIds(d);
    /* the vehicle line reads the deal's own snapshot when the catalog has
       no such unit (the funded seed) */
    const veh = v ? v.year + " " + v.make + " " + v.model : (snap && snap.make ? [snap.year, snap.make, snap.model].filter(Boolean).join(" ") : "");
    /* the VIN/STK line in the text face with tabular figures (kit) */
    const ids = vin || stock
      ? `<div class="rp-card__meta dq-ids">VIN ${vin ? esc(vin) : "Pending"} · STK ${stock ? esc(stock) : "Pending stock-in"}</div>`
      : "";
    /* the badge (kit): Title Case as written in the data, never uppercase —
       Desking amber; Done and Funded positive, a funded contract carrying
       the month and day it funded */
    const fundedISO = fundedOnISO(d);
    const fundedOn = d.stage === "complete" && lead && fundedISO ? " · " + new Date(fundedISO).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
    const chip = d.stage === "complete" ? (lead ? "Funded" + fundedOn : "Done") : b.label;
    const positive = d.stage === "complete";
    /* the "Next:" › is the kit's, generated by CSS — no chevron element */
    return `<a class="rp-card dq-row" href="${esc(st.route(d))}" aria-label="Open ${esc(name)}'s deal">
      <span class="rp-badge${positive ? " rp-badge--positive" : ""}">${esc(chip)}</span>
      <div class="rp-card__name">${esc(name)}</div>
      ${veh ? `<div class="rp-card__line">${esc(veh)}</div>` : ""}
      ${ids}
      ${vehicleStatusHtml(d)}
      ${next && b.id !== "done" ? `<div class="rp-card__next">Next: ${esc(dealNextAction(d))}</div>` : ""}
    </a>`;
  }

  /* showroom visit row — never a vehicle placeholder (owner rule 2026-08-23,
     reasserted on the v3 reference 2026-08-28): the meta is the vehicle when
     one is chosen and the arrival time, nothing else */
  /* the presence row (v022 §10): initials, name, "Arrived HH:MM · <stage>".
     Never a vehicle placeholder (owner rule 2026-08-23); the stage is the
     deal's, read alongside, and it never moves the row. */
  function visitRow(d) {
    const c = Store.customer(d.customerId);
    const st = STAGES[d.stage] || STAGES.discovery;
    const b = dealBucket(d);
    const name = c ? c.first + " " + c.last : "—";
    const arrived = arrivedLabel(d);
    return `<a class="rp-row dq-visit" href="${esc(st.route(d))}" aria-label="Open ${esc(name)}">
      <span class="rp-initials">${esc(((c && c.first[0]) || "") + ((c && c.last[0]) || ""))}</span>
      <span class="rp-row__body"><span class="rp-row__title">${esc(name)}</span>
      <span class="rp-row__sub dq-visitmeta">${arrived ? "Arrived " + esc(arrived) + " · " : ""}${esc(b.label)}</span></span>
      <span class="rp-row__chevron"></span>
    </a>`;
  }

  function showroomHtml(rows) {
    return `<div class="dq-showroom"><div class="rp-section">In showroom · ${rows.length}</div>
      ${rows.length ? `<div class="rp-group">${rows.map(visitRow).join("")}</div>` : `<div class="rp-empty"><strong>No showroom visits</strong>${dealsUI.q.trim() ? "None match this search." : "Start a new visit to check a customer in."}</div>`}</div>`;
  }

  view().innerHTML = chShell({ template: "destination", active: "deals" }, `
      <div class="rp-eyebrow">${lead ? "Floor overview" : "Sales floor"}</div>
      <div class="rp-title-row"><h1 class="rp-title dq-title">${lead ? "Active floor" : "My deals"}</h1><a class="rp-pill-primary dq-newvisit" href="#/customers">New visit</a></div>
      <p class="rp-count" id="dqCount"></p>
      <div id="dqAlerts"></div>
      <div class="rp-search">${rpGlyph("search")}<input class="rp-search__input" id="dealSearch" placeholder="Search customer, VIN, or stock" aria-label="Search deals" value="${esc(dealsUI.q)}"><button type="button" class="rp-search__scan" id="dealScanBtn" aria-label="Scan a driver's license to start a visit">${rpGlyph("scan")}</button></div>
      ${lead ? `<div class="rp-filter">
        <span id="dqDateSummary"></span>
        <button type="button" class="rp-filter__control" id="dqDateBtn"><span id="dqDateLabel"></span>${rpGlyph("chevron-down")}</button>
      </div>` : ""}
      <div id="dqShowroom"></div>
      ${lead ? `<div class="rp-section">Deals</div>
      <div class="rp-chips" role="group" aria-label="Filter deals by stage">
        <button type="button" class="rp-chip dq-chipbtn" data-pipe="all">All ${counts.all}</button>
        <button type="button" class="rp-chip dq-chipbtn" data-pipe="desking"><span class="rp-chip__dot"></span>Desking ${counts.desking}</button>
        <button type="button" class="rp-chip dq-chipbtn" data-pipe="fni"><span class="rp-chip__dot rp-chip__dot--fi"></span>F&amp;I ${counts.fni}</button>
      </div>` : `<div class="rp-section" id="dqSectionLabel">In progress</div>`}
      <div id="dealList"></div>
      <div id="dqFunded"></div>`, null, { scrim: "dqScrim", sheet: "dqSheet" });

  const sheets = chSheetOpener("dqScrim", "dqSheet");
  const openSheet5 = sheets.open, closeSheet5 = sheets.close;

  function paint() {
    if (!lead) dealsUI.pipe = "all";
    const q = dealsUI.q.trim();
    /* the sets the lists below actually draw, computed ONCE — the summary
       line used to count the whole floor while the lists counted the search,
       so a search that matched nothing still read "1 in showroom · 1 active
       deal" over two empty states (review lesson 7) */
    const showRows = showroom.filter(matches);
    const actRows = act.filter(matches);
    const searching = !!q;
    /* the showroom section renders for BOTH roles — an advisor's own visit
       must stay reachable even though it is no longer a deal stage */
    /* vehicle contention (§14): the alerts at the top of My deals, for the
       advisor's own open deals — one real action, × dismisses and the
       card's status stays. The Team Lead's floor carries the status on the
       cards and no alert. */
    $("#dqAlerts").innerHTML = lead ? "" : myAlerts().map(a => `<div class="rp-alert${a.kind === "working" ? " rp-alert--working" : ""}" data-alert="${esc(a.id)}">
      <div class="rp-alert__title">${esc(a.title)}</div><div class="rp-alert__body">${esc(a.body)}</div>
      <a class="rp-alert__action" href="#/vehicles/${esc(a.dealId)}">Choose another vehicle</a>
      <button type="button" class="rp-alert__close" data-alert-close="${esc(a.id)}" aria-label="Dismiss">${rpGlyph("close")}</button></div>`).join("");
    $$("[data-alert-close]").forEach(b => b.onclick = () => {
      const al = (Store.s.alerts || []).find(x => x.id === b.dataset.alertClose);
      if (al) { al.dismissed = true; Store.save(); }
      paint();
    });
    $("#dqShowroom").innerHTML = (showroom.length || lead) ? showroomHtml(showRows) : "";
    if (lead) {
      $$(".dq-chipbtn").forEach(p => {
        const on = p.dataset.pipe === dealsUI.pipe;
        p.classList.toggle("rp-chip--on", on); p.classList.toggle("active", on);
        p.setAttribute("aria-pressed", String(on));
      });
      const w = rangeWin();
      $("#dqDateLabel").textContent = w.label;
      $("#dqDateSummary").textContent = `${w.label} · ${dealsUI.funded ? "active + funded" : "active floor"}`;
      $("#dqCount").textContent = `${showRows.length} in showroom · ${actRows.length} active deal${actRows.length === 1 ? "" : "s"}`;
      const pool = act.filter(d => dealsUI.pipe === "all" || dealPipe(d) === dealsUI.pipe);
      const rows = pool.filter(matches);
      $("#dealList").innerHTML = rows.length
        ? `<div>${rows.map(d => dealRow(d, { next: false })).join("")}</div>`
        : `<div class="rp-empty"><strong>${pool.length ? "No deals match that search" : "No deals in this stage"}</strong>${pool.length ? "Try another name, VIN, or stock number." : "Choose another stage or start a new visit."}</div>`;
      const hist = fundedInRange().filter(matches);
      $("#dqFunded").innerHTML = dealsUI.funded
        ? `<div class="rp-section">Funded · ${hist.length} <span>${esc(w.label)}</span></div>
           ${hist.length ? `<div>${hist.map(d => dealRow(d, { next: false })).join("")}</div>` : `<div class="rp-empty"><strong>No funded contracts</strong>None in this range.</div>`}`
        : "";
    } else {
      const active = actRows;
      const done = funded.filter(matches);
      $("#dqCount").textContent = `${actRows.length} active`;
      $("#dqSectionLabel").textContent = "In progress";
      let html = active.length ? `<div>${active.map(d => dealRow(d)).join("")}</div>` : "";
      if (!active.length && !done.length && !showRows.length) {
        html = searching
          ? `<div class="rp-empty"><strong>No deals found</strong>Try another name, VIN, or stock number.<button type="button" class="rp-link" id="dealShowAll">Clear search</button></div>`
          : `<div class="rp-empty"><strong>No deals in progress</strong>Start a new visit to open one.</div>`;
      }
      /* v022 Home 09: a completed deal ends the list and In progress shows
         its empty state rather than vanishing. Not gated on `searching`: a
         search whose only hit is a completed deal took neither branch and
         drew the heading over nothing, with Completed straight beneath it. */
      if (!active.length && html === "") html = searching
        ? `<div class="rp-empty"><strong>No deals in progress match</strong>The match is under Completed.<button type="button" class="rp-link" id="dealShowAll">Clear search</button></div>`
        : `<div class="rp-empty"><strong>No deals in progress</strong>Start a new visit to open one.</div>`;
      $("#dealList").innerHTML = html;
      $("#dqFunded").innerHTML = done.length
        ? `<div class="rp-section">Completed</div><div>${done.map(d => dealRow(d, { next: false })).join("")}</div>`
        : "";
      const sa = $("#dealShowAll");
      if (sa) sa.onclick = () => { dealsUI.q = ""; $("#dealSearch").value = ""; paint(); };
    }
  }

  $("#dealSearch").oninput = (e) => { dealsUI.q = e.target.value; paint(); };
  $$(".dq-chipbtn").forEach(p => p.onclick = () => { dealsUI.pipe = p.dataset.pipe; paint(); });
  $("#dealScanBtn").onclick = () => openScanFlow({ mode: "customer", onDone: (cust) => {
    /* same stamp as the resolver's scan path: the license address was just
       confirmed through the scan's own review */
    cust.onboard = Object.assign({}, cust.onboard, { licensePhotoAt: new Date().toISOString(), address: { confirmedAt: new Date().toISOString(), source: "license" } });
    Store.save();
    startVisit(cust.id);
  } });

  /* the role sheet (v022): one definition, opened from the role control or
     the banner's Switch. No toast — the banner now says who is acting. */
  chWireRole(sheets, () => { dealsUI.pipe = "all"; router(); });

  /* date/history sheet — Team Lead only (v3): history windows plus the
     funded toggle; funded left the active chips for good */
  const dateBtn = $("#dqDateBtn");
  if (dateBtn) dateBtn.onclick = () => {
    const options = [["today", "Today", "Default active-floor view"], ["yesterday", "Yesterday", "Review floor activity in this period"], ["7d", "Last 7 days", "Review floor activity in this period"], ["30d", "Last 30 days", "Review floor activity in this period"], ["custom", "Custom range", "Choose a specific start and end date"]];
    openSheet5(`${chSheetHead("Date range")}
      ${options.map(([key, label, sub]) => `<button type="button" class="rp-option${dealsUI.range === key ? " rp-option--on" : ""}" data-range="${key}"><span><span class="rp-option__title">${label}</span><span class="rp-option__sub">${sub}</span></span><span class="rp-radio${dealsUI.range === key ? " rp-radio--on" : ""}">${dealsUI.range === key ? rpGlyph("check") : ""}</span></button>`).join("")}
      <div id="dqCustomWrap"${dealsUI.range === "custom" ? "" : " hidden"} style="margin-top:12px">
        <div class="ca-fieldrow">
          <div><label class="ca-lab" for="dqFrom">From</label><input class="ca-input" id="dqFrom" type="date" value="${esc(dealsUI.from)}"></div>
          <div><label class="ca-lab" for="dqTo">To</label><input class="ca-input" id="dqTo" type="date" value="${esc(dealsUI.to)}"></div>
        </div>
        <button type="button" class="rp-primary" id="dqApplyRange">Apply range</button>
      </div>
      <button type="button" class="rp-toggle-row" id="dqFundedToggle" role="switch" aria-checked="${dealsUI.funded ? "true" : "false"}" style="width:100%">Include funded contracts<span class="rp-toggle${dealsUI.funded ? " rp-toggle--on" : ""}"></span></button>`, (sheet) => {
      $$("[data-range]", sheet).forEach(b => b.onclick = () => {
        dealsUI.range = b.dataset.range;
        if (dealsUI.range === "custom") { $("#dqCustomWrap", sheet).hidden = false; return; }
        closeSheet5(); paint();
      });
      const apply = $("#dqApplyRange", sheet);
      if (apply) apply.onclick = () => {
        dealsUI.from = $("#dqFrom", sheet).value; dealsUI.to = $("#dqTo", sheet).value;
        dealsUI.range = "custom";
        closeSheet5(); paint();
      };
      $("#dqFundedToggle", sheet).onclick = () => { dealsUI.funded = !dealsUI.funded; closeSheet5(); paint(); };
    });
  };

  /* More sheet (v3): secondary destinations stay out of the queue — one
     definition, shared with the sub-destinations that carry the tab */
  $("#dqMore").onclick = () => chMoreSheet(sheets);

  paint();
});

route("customers", () => {
  renderChrome("Find a Customer", "", "");
  document.body.dataset.canvas = "kit";   /* see the deals route */
  document.body.dataset.screen = "resolver";
  /* the unified Customer Resolver (owner's onboarding v3 package, 2026-08-28):
     one resolver for every place Ride Price needs a person. Search first,
     then a physical-license scan or a secure self-upload; manual entry is
     the fallback only. There is no top-level Create Customer any more. */

  const st = { mode: "idle", results: null, found: null, source: "record" };
  /* the scan flow's no-match create and the deals-camera hand-off both land
     on the manual fallback now (the flag is consumed exactly once) */
  if (scanWantsCreate) { scanWantsCreate = false; st.mode = "manual"; }
  /* the buyers sheet's mission (consumed once, like the flag above): the
     resolver runs exactly as it always does, but the person it resolves is
     attached to the deal as the co-buyer instead of starting a visit */
  const mission = resolverMission; resolverMission = null;
  /* two mission kinds share the resolver: "cobuyer" (the buyers sheet) and
     "driver" (the test drive's additional driver) — the person is resolved
     exactly the same way; only what finish() does with them differs */
  const missionDeal = mission && (mission.kind === "cobuyer" || mission.kind === "driver") ? Store.deal(mission.dealId) : null;
  if (missionDeal && mission.open === "manual") st.mode = "manual";

  /* the one exit for every resolver path. The dedupe guard is absolute: the
     primary cannot co-sign their own loan, and an already-attached co-buyer
     is not attached twice. On attach, the advisor returns to the deal screen
     they came from with the buyers sheet reopened — the second row appearing
     IS the feedback (the package prefers local state over toast spam). */
  function finish(customerId, sessionMission) {
    const m = sessionMission || mission;
    if (m && m.kind === "driver") {
      /* the additional test-drive driver: attached to the deal's test drive by
         customer id (never a typed name), the primary never duplicated — they
         are already the driver — and a repeat resolve of the same person is
         idempotent. The name row appearing on the Ready screen is the feedback. */
      const dDeal = Store.deal(m.dealId);
      if (!dDeal) { toast("That visit is no longer on the floor"); navigate("#/deals"); return; }
      if (customerId === dDeal.customerId) { toast("That's the customer on this deal — they're already the driver"); st.mode = "idle"; st.results = null; st.found = null; render(); return; }
      const dtd = dDeal.testDrive = dDeal.testDrive || { done: false };
      dtd.addlDriverIds = dtd.addlDriverIds || [];
      if (!dtd.addlDriverIds.includes(customerId)) dtd.addlDriverIds.push(customerId);
      Store.save();
      navigate(m.back || "#/testdrive/" + dDeal.id);
      return;
    }
    const mDeal = m && m.kind === "cobuyer" ? Store.deal(m.dealId) : null;
    if (mDeal) {
      if (customerId === mDeal.customerId) { toast("That's the primary buyer — a co-buyer must be a different person"); st.mode = "idle"; st.results = null; st.found = null; render(); return; }
      /* resolve the pointer, not the raw id: a dangling coBuyerId means "no
         co-buyer, never an error" (the documented contract every other
         reader follows) — a raw check would let the sheet offer Add while
         every resolver completion got refused (review find). Re-resolving
         the SAME person is an idempotent success, not a refusal. */
      const existingCo = mDeal.coBuyerId ? Store.customer(mDeal.coBuyerId) : null;
      if (existingCo && existingCo.id !== customerId) { toast("This deal already has a co-buyer"); st.mode = "idle"; render(); return; }
      mDeal.coBuyerId = customerId; Store.save();
      const back = m.back || "#/desk/" + mDeal.id;
      if (location.hash === back) { router(); openBuyersSheet(mDeal.id); }
      else {
        /* reopen the sheet once the origin screen has painted — armed only
           when a navigation is actually coming, or the once-listener would
           fire on the next unrelated hash change */
        window.addEventListener("hashchange", () => setTimeout(() => openBuyersSheet(mDeal.id), 80), { once: true });
        navigate(back);
      }
      return;
    }
    startVisit(customerId);
  }

  const session = () => Store.s.idSession || null;

  const initials = (c) => esc(((c.first || " ")[0] + (c.last || " ")[0]).toUpperCase());
  /* the Task template (chrome rule v022): Close on the left, the task name and
     its step in the centre, the same role control on the right; the primary
     action in a dock at the bottom, its alternative as a text link. The step
     is the resolver's own: 1 find, 2 confirm, 3 the customer's session. */
  const taskTitle = () => missionDeal ? (mission.kind === "driver" ? "Add driver" : "Add co-buyer") : "New visit";
  const shell = (content, step, dockHtml) => chShell({ template: "task", title: taskTitle(), step }, content, dockHtml, { scrim: "obScrim", sheet: "obSheet" });
  /* no lede under a task title (v022 §5) — the title and the eyebrow carry it */
  const heroHtml = (eyebrow, title) => `<div class="rp-eyebrow">${eyebrow}</div><h1 class="rp-title">${title}</h1>`;
  /* the mission is state the advisor needs, not instruction: shown only when there is one */
  const contextPill = () => missionDeal ? `<div class="rp-notice">${mission.kind === "driver" ? "Adding a test-drive driver" : "Adding a co-buyer to this deal"}</div>` : "";
  const primaryBtn = (id, label, off) => `<button type="button" class="rp-primary" id="${id}"${off ? " disabled" : ""}>${label}</button>`;
  const linkBtn = (id, label) => `<button type="button" class="rp-link" id="${id}">${label}</button>`;

  /* ---- sheets ---- */
  const obSheets = chSheetOpener("obScrim", "obSheet");
  const openSheet4 = obSheets.open, closeSheet4 = obSheets.close;
  /* sheet heads carry no helper sentence (v022 §5) */
  const sheetHead4 = (title) => chSheetHead(title);

  /* one address parser for the single-field rule: "street, city, ST 12345",
     or "street, 12345" completed from the demo ZIP table. Never a guess —
     an unparseable string stays unparsed and the field says the format. */
  function parseAddress(text) {
    const t = String(text || "").trim();
    let m = t.match(/^(.+?),\s*(.+?),\s*([A-Za-z]{2})\.?\s+(\d{5})$/);
    if (m) return { address: m[1].trim(), city: m[2].trim(), state: m[3].toUpperCase(), zip: m[4] };
    m = t.match(/^(.+?),?\s+(\d{5})$/);
    if (m && RIDE_PRICE_DATA.zipLookup[m[2]]) {
      const hit = RIDE_PRICE_DATA.zipLookup[m[2]];
      return { address: m[1].replace(/,$/, "").trim(), city: hit.city, state: hit.state, zip: m[2] };
    }
    return null;
  }
  const fmtAddr = (a) => `${a.address}, ${a.city}, ${a.state} ${a.zip}`;
  /* a CRM record can hold no address at all. fmtAddr would render ", ,  " and
     the screen would offer to confirm it, so ask first: a registration address
     needs a street and a town to be one. Read the fields BEFORE coercing —
     String(undefined) is the seven characters "undefined", which trims to
     something truthy and would wave through the very record this guards. */
  const str = (x) => typeof x === "string" ? x.trim() : "";
  /* all four: a record with a street and a town but no state or ZIP would
     otherwise be offered for confirmation and stamped confirmedAt with holes
     in it. Manual entry already requires the ZIP (customerMissing) and
     parseAddress() never yields one without the other two, so nothing that
     reaches this screen honestly is turned away by it. */
  const hasAddr = (a) => !!(a && str(a.address) && str(a.city) && str(a.state) && str(a.zip));

  /* the one write path for a confirmed registration address — explicit
     choice, never a silent overwrite; the record keeps its single address
     that every downstream surface already reads */
  function confirmAddress(c, a, source) {
    /* the stamp says a person confirmed a real address. Refuse to write one
       for an address that is not there, whichever caller asks: a confirmedAt
       over an empty record would tell every downstream screen the address was
       checked when nobody was ever shown one. */
    if (!hasAddr(a)) return false;
    Object.assign(c, { address: a.address, city: a.city, state: a.state, zip: a.zip });
    c.onboard = Object.assign({}, c.onboard, { address: { confirmedAt: new Date().toISOString(), source } });
    Store.save();
    return true;
  }

  /* ---- idle: search, the two license paths, recent customers ---- */
  function idleHtml() {
    const s = session();
    /* recent customers: those with a name on file and a place to show. Every
       seeded record now carries both, so this is defending against an imported
       or half-typed record rather than a seed — an empty sub-line is not a row,
       and a record with no LAST name rendered as "First undefined".
       Filtered BEFORE the limit: slicing to five first meant one unusable
       record hid a usable older one instead of taking its own place. rowSub is
       declared above the list because the filter calls it. */
    const rowSub = (c) => [c.phone, [c.city, c.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ");
    const recent = Store.s.customers.slice()
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      .filter(c => str(c.first) && str(c.last) && rowSub(c))
      .slice(0, 5);
    return shell(`
      ${heroHtml("Customer onboarding", "Find customer")}
      ${contextPill()}
      ${s ? `<button type="button" class="ob-session" id="obSession">
        <span class="ob-sessiondot${s.doneAt ? " done" : ""}"></span>
        <span class="ob-sessioncopy"><b>${s.doneAt ? "Customer finished the secure upload" : "Waiting for the customer's upload"}</b><small>${esc(s.phone || s.email)}</small></span>
        <span class="sc2-go">›</span></button>` : ""}
      <div class="rp-search rp-search--action">${rpGlyph("search")}<input class="rp-search__input" id="obSearch" placeholder="Name, phone, email, or license" aria-label="Search customers"><button type="button" class="rp-button-navy" id="searchBtn">Search</button></div>
      ${st.results ? resultsHtml() : ""}
      <div class="rp-group">
        <button type="button" class="rp-row" id="scanBtn"><span class="rp-tile">${rpGlyph("license")}</span><span class="rp-row__body"><span class="rp-row__title">Scan physical license</span><span class="rp-row__sub">Best when the customer has the license in the showroom.</span></span><span class="rp-row__chevron"></span></button>
        <button type="button" class="rp-row" id="obSendLink"><span class="rp-tile">${rpGlyph("upload")}</span><span class="rp-row__body"><span class="rp-row__title">Send secure upload link</span><span class="rp-row__sub">Customer has a license photo on their phone. It uploads directly to Ride Price.</span></span><span class="rp-row__chevron"></span></button>
      </div>
      ${st.results ? "" : `
      <div class="rp-section">Recent customers</div><div class="rp-group">
        ${recent.map(c => `<button type="button" class="rp-row" data-found="${esc(c.id)}"><span class="rp-initials">${initials(c)}</span><span class="rp-row__body"><span class="rp-row__title">${esc(c.first + " " + c.last)}</span><span class="rp-row__sub">${esc(rowSub(c))}</span></span><span class="rp-row__chevron"></span></button>`).join("")}
      </div>`}`, "Step 1 of 3");
  }

  function resultsHtml() {
    const hits = st.results;
    /* a miss names the other paths — the licence rows stay below — and offers
       manual entry as a link, never as a form (v022 Onboarding 05) */
    if (!hits.length) return `<div class="rp-empty"><strong>No matches</strong>Nothing on file matches that search.<button type="button" class="rp-link" id="obManual">No license available · add manually</button></div>`;
    return `<div class="rp-section">Results (${hits.length})</div><div class="rp-group">
      ${hits.map(c => `<button type="button" class="rp-row" data-found="${esc(c.id)}"><span class="rp-initials">${initials(c)}</span><span class="rp-row__body"><span class="rp-row__title">${esc(c.first + " " + c.last)}</span><span class="rp-row__sub">${esc([c.phone, [c.city, c.state].filter(Boolean).join(", ")].filter(Boolean).join(" · "))}</span></span><span class="rp-row__chevron"></span></button>`).join("")}
    </div>`;
  }

  /* ---- found: confirm the customer and the registration address ---- */
  function foundHtml() {
    const c = st.found;
    const a = { address: c.address, city: c.city, state: c.state, zip: c.zip };
    /* nothing on file is not an address to confirm: the primary stays off and
       the link becomes the way to supply one, so no run can stamp
       "address confirmed" over a record that holds none */
    const on = hasAddr(a);
    return shell(`
      ${heroHtml("Customer onboarding", "Customer found")}
      ${contextPill()}
      <section class="rp-match">
        <div class="rp-match__head"><span class="rp-initials">${initials(c)}</span>
          <span class="rp-row__body"><span class="rp-row__title">${esc(c.first + " " + c.last)}</span><span class="rp-row__sub">Existing Ride Price customer</span></span>
          <span class="rp-tag rp-tag--match">CRM match</span></div>
        <div class="rp-match__kv"><span>Phone</span><span>${c.phone ? esc(c.phone) : "Not on file"}</span></div>
        <div class="rp-match__kv"><span>Email</span><span>${c.email ? esc(c.email) : "Not on file"}</span></div>
        <div class="rp-match__addr">
          <div class="rp-match__addr-head">Registration address<span class="rp-tag rp-tag--required">Required</span></div>
          <div class="rp-match__addr-line">${on ? esc(fmtAddr(a)) : "No address on file"}</div>
        </div>
      </section>`, "Step 2 of 3",
      chDock(primaryBtn("obConfirm", "Confirm address & " + (missionDeal ? (mission.kind === "driver" ? "add driver" : "attach co-buyer") : "start visit"), !on), linkBtn("obOtherAddr", on ? "Use a different address" : "Add a registration address")));
  }

  /* ---- manual fallback: minimum typing, one address field ---- */
  function manualHtml() {
    return shell(`
      ${heroHtml("Customer onboarding", "No license available")}
      <div class="rp-field"><label class="rp-field__label" for="obName">Full name</label><input class="rp-field__input" id="obName" placeholder="First Last"></div>
      <div class="rp-field"><label class="rp-field__label" for="obPhone">Mobile phone</label><input class="rp-field__input" id="obPhone" type="tel" placeholder="(555) 555-5555"></div>
      <div class="rp-field"><label class="rp-field__label" for="obEmail">Email</label><input class="rp-field__input" id="obEmail" type="email" placeholder="name@testing.com"></div>
      <div class="rp-field"><label class="rp-field__label" for="obAddr">Registration address</label><input class="rp-field__input" id="obAddr" placeholder="Street, city, ST 12345">
        <div id="obAddrHint"></div></div>`, "Step 2 of 3",
      chDock(primaryBtn("obManualSave", "Confirm & start visit"), linkBtn("obBack", "Back to resolver")));
  }

  /* ---- remote session: waiting + ready (advisor side) ---- */
  function waitingHtml() {
    const s = session();
    const row = (okFlag, label, sub, value) => `<div class="rp-step"><span class="rp-step__mark${okFlag ? " rp-step__mark--done" : ""} ob-statusicon${okFlag ? "" : " pending"}">${okFlag ? rpGlyph("check") : ""}</span><div><span class="rp-step__title">${label}</span>${sub ? `<span class="rp-step__sub">${sub}</span>` : ""}</div><span class="rp-status${okFlag ? " rp-status--positive" : ""} ob-statusvalue${okFlag ? "" : " pending"}">${value}</span></div>`;
    /* the channels are what is on record so far; the address arrives with
       the licence (v022 Onboarding 08) */
    return shell(`
      ${heroHtml("Customer onboarding", "Waiting for customer")}
      <div class="rp-notice">Secure link sent · ${esc(s.phone || s.email)} · ${esc(s.channel)}</div>
      <div class="rp-steps">
        ${row(true, "Link sent", "Secure Ride Price session created", "Complete")}
        ${row(!!s.photoAt, "License photo", s.photoAt ? "Read from the training prop" : "Waiting for customer upload", s.photoAt ? "Received" : "Pending")}
        ${row(!!s.faceAt, "Identity photo", s.faceAt ? "Captured on the customer's device" : "Face step follows the upload", s.faceAt ? "Captured" : "Pending")}
        ${row(!!s.addressConfirmedAt, "Registration address", s.addressConfirmedAt ? "Confirmed by the customer" : "Customer confirms the extracted address", s.addressConfirmedAt ? "Confirmed" : "Pending")}
      </div>
      <div class="rp-section">Channels</div>
      <div class="rp-group">
        <div class="rp-match__kv" style="border-top:0"><span>Mobile</span><span>${esc(s.phone || "Not on record")}</span></div>
        <div class="rp-match__kv"><span>Email</span><span>${esc(s.email || "Not on record")}</span></div>
      </div>`, "Step 3 of 3",
      chDock(`<a class="rp-primary" href="#/idverify">Open customer view</a>`, linkBtn("obCancelSession", "Cancel this secure link")));
  }

  function remoteReadyHtml() {
    const s = session();
    const p = s.persona;
    const linked = s.matchId ? Store.customer(s.matchId) : null;
    const a = s.addressChoice;
    const row = (okFlag, label, sub, value) => `<div class="rp-step"><span class="rp-step__mark${okFlag ? " rp-step__mark--done" : ""} ob-statusicon${okFlag ? "" : " pending"}">${okFlag ? rpGlyph("check") : ""}</span><div><span class="rp-step__title">${label}</span>${sub ? `<span class="rp-step__sub">${sub}</span>` : ""}</div><span class="rp-status${okFlag ? " rp-status--positive" : ""} ob-statusvalue${okFlag ? "" : " pending"}">${value}</span></div>`;
    /* the label names what finish() will do with this person: the session's
       own mission first (it outlives this page), else the page's */
    const k = ((session() && session().mission) || mission || {}).kind;
    const attachLabel = k === "driver" ? "Add as driver" : k === "cobuyer" ? "Attach as co-buyer" : "Start visit";
    return shell(`
      ${heroHtml("Customer onboarding", "Customer identified")}
      <section class="rp-match"><div class="rp-match__head"><span class="rp-initials">${initials(p)}</span>
        <span class="rp-row__body"><span class="rp-row__title">${esc(p.first + " " + p.last)}</span><span class="rp-row__sub">Remote session${linked ? " · existing customer" : ""}</span></span>
        <span class="rp-tag rp-tag--match">Identity captured</span></div></section>
      <div class="rp-steps" style="margin-top:14px">
        ${row(true, "Secure session", "Opened on the customer's device", "Complete")}
        ${row(true, "Identity photo", "Captured and discarded", "Captured")}
        ${row(true, "License photo", "Read from the upload", "Received")}
        ${row(false, "Second license side", "Request later only when a workflow needs it", "Pending")}
      </div>
      <section class="rp-match"><div class="rp-match__addr" style="border-top:0">
        <div class="rp-match__addr-head">Registration address<span class="rp-tag rp-tag--match">Confirmed</span></div>
        <div class="rp-match__addr-line">${esc(fmtAddr(a))}</div>
        <div class="rp-row__sub">Confirmed by customer from the license</div></div></section>`, "Step 3 of 3",
      chDock(primaryBtn("obAttach", attachLabel), linkBtn("obDiscardSession", "Discard this upload")));
  }

  /* ---- render + wiring ---- */
  function render() {
    const s = session();
    if (st.mode === "idle" && s && s.doneAt) st.mode = "remote-ready";
    view().innerHTML =
      st.mode === "found" ? foundHtml()
      : st.mode === "manual" ? manualHtml()
      : st.mode === "waiting" ? waitingHtml()
      : st.mode === "remote-ready" ? remoteReadyHtml()
      : idleHtml();
    /* the Task template's Close returns to the launching screen: the
       mission's own way back when there is one, else the queue */
    /* the board captions read "Close -> 01": a step inside the task returns to
       the resolver's first step; from the first step, Close returns to the
       launching screen — the mission's own way back when there is one, else
       the queue. The board has no "search again" link; Close is that path. */
    const close = $("#chClose"); if (close) close.onclick = () => {
      if (st.mode === "found" || st.mode === "manual") { st.mode = "idle"; st.results = null; st.found = null; render(); return; }
      navigate((mission && mission.back) || "#/deals");
    };
    chWireRole(obSheets, () => render());
    wire();
  }

  function wire() {
    const scrim = $("#obScrim");
    if (scrim) scrim.onclick = (e) => { if (e.target === scrim || e.target.closest("[data-sheet-close]")) closeSheet4(); };

    $$("[data-found]").forEach(b => b.onclick = () => { st.found = Store.customer(b.dataset.found); st.mode = "found"; render(); window.scrollTo(0, 0); });
    const back = $("#obBack"); if (back) back.onclick = () => { st.mode = "idle"; st.results = null; st.found = null; render(); };

    const sb = $("#searchBtn");
    if (sb) {
      const run = () => {
        const q = $("#obSearch").value.trim().toLowerCase();
        if (!q) { $("#obSearch").focus(); return; }
        const digits = q.replace(/\D/g, "");
        const norm = (x) => String(x || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
        st.results = Store.s.customers.filter(c =>
          (c.first + " " + c.last).toLowerCase().includes(q) ||
          c.last.toLowerCase().includes(q) ||
          (digits.length >= 4 && c.phone.replace(/\D/g, "").includes(digits)) ||
          c.email.toLowerCase().includes(q) ||
          (c.license && norm(c.license.number).includes(norm(q))));
        render();
        const inp = $("#obSearch"); inp.value = q; /* the query survives the render */
      };
      sb.onclick = run;
      $("#obSearch").onkeydown = (e) => { if (e.key === "Enter") run(); };
    }

    const scan = $("#scanBtn");
    if (scan) scan.onclick = () => openScanFlow({
      mode: "customer",
      onManual: () => { st.mode = "manual"; render(); },
      onDone: (cust) => {
        /* the scan already confirmed identity and wrote the license address —
           record it as the confirmed registration address (source: license) */
        cust.onboard = Object.assign({}, cust.onboard, { licensePhotoAt: new Date().toISOString(), address: { confirmedAt: new Date().toISOString(), source: "license" } });
        Store.save();
        finish(cust.id);
      }
    });

    const send = $("#obSendLink"); if (send) send.onclick = openSendSheet;
    const sess = $("#obSession"); if (sess) sess.onclick = () => { st.mode = session().doneAt ? "remote-ready" : "waiting"; render(); };
    const cancelS = $("#obCancelSession"); if (cancelS) cancelS.onclick = () => { Store.s.idSession = null; Store.save(); st.mode = "idle"; render(); };
    const discard = $("#obDiscardSession"); if (discard) discard.onclick = () => { Store.s.idSession = null; Store.save(); st.mode = "idle"; render(); };
    const man = $("#obManual"); if (man) man.onclick = () => { st.mode = "manual"; render(); window.scrollTo(0, 0); };

    const confirmBtn = $("#obConfirm");
    if (confirmBtn) confirmBtn.onclick = () => {
      const c = st.found;
      if (!confirmAddress(c, { address: c.address, city: c.city, state: c.state, zip: c.zip }, "record")) return;
      finish(c.id);
    };
    const other = $("#obOtherAddr");
    if (other) other.onclick = () => openAddressSheet((a) => { if (confirmAddress(st.found, a, "chosen")) finish(st.found.id); });

    const manualSave = $("#obManualSave");
    if (manualSave) manualSave.onclick = () => {
      const name = $("#obName").value.trim();
      const parts = name.split(/\s+/);
      const phone = $("#obPhone").value.trim(), email = $("#obEmail").value.trim();
      const parsed = parseAddress($("#obAddr").value);
      const bad = [];
      if (parts.length < 2) bad.push({ el: $("#obName"), msg: name ? "First and last name" : "Required" });
      if (!phone) bad.push({ el: $("#obPhone"), msg: "Required" });
      if (!email) bad.push({ el: $("#obEmail"), msg: "Required" });
      if (!parsed) bad.push({ el: $("#obAddr"), msg: $("#obAddr").value.trim() ? "Enter as street, city, ST 12345" : "Required" });
      if (markMissing(view(), bad)) return;
      const c = {
        id: uid("c"), first: parts.slice(0, -1).join(" "), middle: "", last: parts[parts.length - 1],
        phone, email, creditScore: 700, createdAt: new Date().toISOString(),
        address: parsed.address, city: parsed.city, state: parsed.state, zip: parsed.zip,
        onboard: { address: { confirmedAt: new Date().toISOString(), source: "typed" } }
      };
      Store.s.customers.push(c); Store.save();
      toast("Customer created");
      finish(c.id);
    };
    const addrInp = $("#obAddr");
    if (addrInp) addrInp.oninput = () => {
      const parsed = parseAddress(addrInp.value);
      $("#obAddrHint").innerHTML = parsed
        ? `<button type="button" class="ob-lookup" id="obAddrUse"><strong>${esc(fmtAddr(parsed))}</strong><span>Use this standardized address</span></button>` : "";
      const use = $("#obAddrUse");
      if (use) use.onclick = () => { addrInp.value = fmtAddr(parsed); $("#obAddrHint").innerHTML = ""; };
    };

    const attach = $("#obAttach");
    if (attach) attach.onclick = () => {
      const s = session();
      /* a session created under a co-buyer mission carries it — captured
         before the session is cleared, so a reload between send and attach
         (which loses the module flag) still attaches instead of starting a
         visit */
      const sMission = s.mission || null;
      const p = s.persona, a = s.addressChoice;
      let c = s.matchId ? Store.customer(s.matchId) : null;
      /* the licence number is the strong match, and a profile the link itself
         created has none (seed v023: Marcus, phone and email on record, no
         licence) — so a completed session would write a SECOND record with
         the same number. Fall back to the profile that already holds this
         session's phone, and only while it carries no licence of its own:
         a record with a different licence is a different person who happens
         to share a number, and that case still creates. */
      if (!c) {
        const dig = (x) => String(x || "").replace(/\D/g, "");
        c = Store.s.customers.find(x => dig(x.phone) && dig(x.phone) === dig(s.phone) && !(x.license && x.license.number)) || null;
      }
      if (c) {
        Object.assign(c, {
          first: p.first, middle: p.middle || "", last: p.last, dob: p.dob || c.dob,
          license: { number: p.license.number, state: p.license.state, expires: p.license.expires || "" }
        });
        /* the session's channels fill a gap, never overwrite: the advisor typed
           them into the link sheet, and a record's own email is the customer's */
        if (!c.phone && s.phone) c.phone = s.phone;
        if (!c.email && s.email) c.email = s.email;
      } else {
        c = {
          id: uid("c"), first: p.first, middle: p.middle || "", last: p.last, dob: p.dob || "",
          phone: s.phone, email: s.email, creditScore: 700, createdAt: new Date().toISOString(),
          address: a.address, city: a.city, state: a.state, zip: a.zip,
          license: { number: p.license.number, state: p.license.state, expires: p.license.expires || "" }
        };
        Store.s.customers.push(c);
      }
      Object.assign(c, { address: a.address, city: a.city, state: a.state, zip: a.zip });
      c.onboard = Object.assign({}, c.onboard, {
        phoneAt: s.doneAt, faceAt: s.faceAt, licensePhotoAt: s.photoAt, secondSide: "pending",
        address: { confirmedAt: s.addressConfirmedAt, source: "license" }
      });
      /* the mission guard runs BEFORE the session is spent: a refusal must
         leave the completed upload intact — clearing first threw away the
         customer's finished session over the advisor's mistake, forcing a
         whole new link (review find). The identity updates written above are
         that person's own data and rightly stay. */
      if (sMission && sMission.kind === "driver") {
        const mD = Store.deal(sMission.dealId);
        if (mD && c.id === mD.customerId) { Store.save(); toast("That's the customer on this deal — they're already the driver"); return; }
      }
      if (sMission && sMission.kind === "cobuyer") {
        const mD = Store.deal(sMission.dealId);
        if (mD && c.id === mD.customerId) { Store.save(); toast("That's the primary buyer — a co-buyer must be a different person"); return; }
        /* same contract as finish(): the pointer resolves or it is nothing */
        const existingCo = mD && mD.coBuyerId ? Store.customer(mD.coBuyerId) : null;
        if (existingCo && existingCo.id !== c.id) { Store.save(); toast("This deal already has a co-buyer"); return; }
      }
      Store.s.idSession = null;
      Store.save();
      finish(c.id, sMission);
    };
  }

  function openSendSheet() {
    openSheet4(`${sheetHead4("Send secure upload link")}
      <div class="rp-segment" id="obChannel"><button type="button" class="rp-segment__item rp-segment__item--on active" data-ch="Text">Text</button><button type="button" class="rp-segment__item" data-ch="Email">Email</button></div>
      <div class="rp-field"><label class="rp-field__label" for="obLinkPhone">Customer mobile</label><input class="rp-field__input" id="obLinkPhone" type="tel" placeholder="(555) 555-5555"></div>
      <div class="rp-field"><label class="rp-field__label" for="obLinkEmail">Email</label><input class="rp-field__input" id="obLinkEmail" type="email" placeholder="name@testing.com"></div>
      <button type="button" class="rp-primary" id="obSendGo">Send secure link</button>`, (sheet) => {
      let channel = "Text";
      $$("#obChannel button", sheet).forEach(b => b.onclick = () => {
        channel = b.dataset.ch;
        $$("#obChannel button", sheet).forEach(x => { x.classList.toggle("rp-segment__item--on", x === b); x.classList.toggle("active", x === b); });
      });
      $("#obSendGo", sheet).onclick = () => {
        const phone = $("#obLinkPhone", sheet).value.trim(), email = $("#obLinkEmail", sheet).value.trim();
        /* both channels are required on every customer record (v3 rule,
           reaffirmed by SEED-DATA v022.2 — Marcus has both on record) */
        const bad = [];
        if (!phone) bad.push({ el: $("#obLinkPhone", sheet), msg: "Required" });
        if (!email) bad.push({ el: $("#obLinkEmail", sheet), msg: "Required" });
        if (markMissing(sheet, bad)) return;
        Store.s.idSession = { id: uid("s"), phone, email, channel, sentAt: new Date().toISOString(), photoAt: null, persona: null, matchId: null, faceAt: null, addressChoice: null, addressConfirmedAt: null, doneAt: null };
        /* a link sent on the buyers sheet's mission attaches as co-buyer when
           it completes — recorded on the session, which outlives this page */
        if (missionDeal) Store.s.idSession.mission = { kind: mission.kind, dealId: missionDeal.id, back: mission.back };
        Store.save();
        closeSheet4();
        st.mode = "waiting"; render(); window.scrollTo(0, 0);
      };
    });
  }

  function openAddressSheet(onPick) {
    openSheet4(`${sheetHead4("Use a different address")}
      <div class="rp-field"><label class="rp-field__label" for="obSheetAddr">Search address</label><input class="rp-field__input" id="obSheetAddr" placeholder="Street, city, ST 12345"></div>
      <div id="obSheetOut"></div>`, (sheet) => {
      const inp = $("#obSheetAddr", sheet);
      inp.oninput = () => {
        const parsed = parseAddress(inp.value);
        $("#obSheetOut", sheet).innerHTML = parsed
          ? `<div class="rp-group"><button type="button" class="rp-row" data-pickaddr><span class="rp-row__body"><span class="rp-row__title">${esc(fmtAddr(parsed))}</span><span class="rp-row__sub">Use this standardized address</span></span><span class="rp-row__chevron"></span></button></div>` : "";
        const pick = $("[data-pickaddr]", sheet);
        if (pick) pick.onclick = () => { closeSheet4(); onPick(parsed); };
      };
      inp.focus();
    });
  }

  render();
  /* the buyers sheet's "Send secure upload link" lands here mid-mission with
     the send sheet already open — one tap on the buyers sheet, one screen.
     Never over an EXISTING session: render() has just put the waiting or
     remote-ready screen up for it, and the sheet's Send would overwrite a
     finished upload with one tap (review find). The advisor decides what
     happens to a session in flight. */
  if (missionDeal && mission.open === "sendlink" && !session()) openSendSheet();
  /* the test drive's "Scan physical license" door: the resolver's own scan,
     opened for the advisor, so the scan → confirm → attach path is the one
     every other scan takes */
  if (missionDeal && mission.open === "scan") { const sb = $("#scanBtn"); if (sb) sb.click(); }
});

/* the customer's own secure-upload session (onboarding v3): opened from the
   advisor's waiting screen — the demo has no network (invariant 2), so the
   "link" opens here and every screen says so. Photos are read by the prop
   recognizer and discarded; the identity photo is never even read. */
route("idverify", () => {
  renderChrome("Secure Identity Upload", "", "");
  document.body.dataset.canvas = "master";
  const s = Store.s.idSession;

  const shell = (content) => `
    <div class="ca-app" style="max-width:560px">
      <div class="ob-clienttop"><span class="m-wordmark"><span class="rideprice">Ride</span><span class="price">PRICE</span></span></div>
      <div class="ob-main">${content}</div>
    </div>`;
  const heroHtml = (eyebrow, title, lead) => `<div class="ca-eyebrow">${eyebrow}</div><h1 class="ob-h1">${title}</h1>${lead ? `<p class="ob-lead">${lead}</p>` : ""}`;

  if (!s) {
    view().innerHTML = shell(`${heroHtml("Secure identity upload", "No active session", "Ask the advisor to send a new secure link from the customer resolver.")}
      <a class="ob-primary ob-linkbtn" href="#/customers">Back to Ride Price</a>`);
    return;
  }

  function render() {
    if (!s.photoAt) renderUpload();
    else if (!s.faceAt) renderFace();
    else if (!s.addressConfirmedAt) renderAddress();
    else renderDoneView();
  }

  function renderUpload() {
    view().innerHTML = shell(`
      ${heroHtml("Secure identity upload", "Upload your driver&rsquo;s license", "Choose the license photo already saved on your phone, or take a new one. Your ID uploads directly to Ride Price.")}
      <div class="ob-privacy"><strong>Your license is not sent to the salesperson.</strong> The image goes from your device directly into the secure Ride Price profile. <b>Demo — only the 5 printed training licenses can be read, from their barcode side, and photos are discarded after reading.</b></div>
      <div class="sc2-capture">
        <div class="sc2-frame"><div class="sc2-cardart" aria-hidden="true"><span class="sc2-cardface">${rpIcon("user")}</span><span class="sc2-cardlines"><i></i><i></i><i></i></span></div></div>
        <div class="sc2-captitle">Upload your license</div>
        <p class="sc2-captip">Use the training prop&rsquo;s barcode side — that is the side the demo can read.</p>
        <div id="obUpNote"></div>
      </div>
      <div class="sc2-actions">
        <label class="sc2-primary sc2-cap">Choose license photo<input type="file" accept="image/*" data-upcap hidden></label>
        <label class="sc2-secondary sc2-cap">Take a photo<input type="file" accept="image/*" capture="environment" data-upcap hidden></label>
      </div>`);
    $$("[data-upcap]").forEach(inp => inp.onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      $("#obUpNote").innerHTML = `<div class="sc2-status"><span class="sc2-statusicon">✓</span><div><b>Reading&hellip;</b></div></div>`;
      RIDE_PRICE_SCAN.recognizeFile(f).then((res) => {
        if (!Store.s.idSession || Store.s.idSession.id !== s.id) return; /* session was cancelled */
        if (res && res.ok && res.persona) {
          s.photoAt = new Date().toISOString();
          s.persona = res.persona;
          const m = findLicenseMatch(res.persona);
          s.matchId = m.customer && m.type === "license number" ? m.customer.id : null;
          Store.save();
          render();
          window.scrollTo(0, 0);
        } else {
          $("#obUpNote").innerHTML = `<div class="sc2-status"><span class="sc2-statusicon" style="background:#FFF3F0;color:#B42318">!</span><div><b>Couldn&rsquo;t read that photo</b><br><span>The demo reads only the printed training prop&rsquo;s barcode side — try that side.</span></div></div>`;
        }
      }).catch(() => {
        $("#obUpNote").innerHTML = `<div class="sc2-status"><span class="sc2-statusicon" style="background:#FFF3F0;color:#B42318">!</span><div><b>Couldn&rsquo;t read that photo</b><br><span>The demo reads only the printed training prop&rsquo;s barcode side.</span></div></div>`;
      });
    });
  }

  function renderFace() {
    const p = s.persona;
    view().innerHTML = shell(`
      ${heroHtml("Identity verification", "Confirm it&rsquo;s you", "Take a quick photo so the dealership can confirm you match the license that was uploaded.")}
      <div class="ob-notice"><span>✓</span><div><strong>License read</strong>${esc(p.first + " " + p.last)} · ${esc(p.license.number)} · ${esc(p.license.state)}</div></div>
      <div class="ob-selfie">${rpIcon("user")}</div>
      <div class="ob-privacy"><strong>Why this helps:</strong> it protects the application from someone using a photo of another person&rsquo;s license. <b>Demo — the photo is confirmed on this device and discarded; no real biometric match occurs.</b></div>
      <div class="sc2-actions">
        <label class="sc2-primary sc2-cap">Take identity photo<input type="file" accept="image/*" capture="user" data-facecap hidden></label>
        <label class="sc2-secondary sc2-cap">Choose a photo<input type="file" accept="image/*" data-facecap hidden></label>
      </div>`);
    $$("[data-facecap]").forEach(inp => inp.onchange = (e) => {
      if (!e.target.files || !e.target.files.length) return;
      if (!Store.s.idSession || Store.s.idSession.id !== s.id) return;
      s.faceAt = new Date().toISOString();
      Store.save();
      render(); window.scrollTo(0, 0);
    });
  }

  function renderAddress() {
    const p = s.persona;
    const lic = { address: p.address, city: p.city, state: p.state, zip: p.zip };
    const linked = s.matchId ? Store.customer(s.matchId) : null;
    const crm = linked ? { address: linked.address, city: linked.city, state: linked.state, zip: linked.zip } : null;
    const same = crm && `${crm.address}|${crm.zip}`.toLowerCase() === `${lic.address}|${lic.zip}`.toLowerCase();
    const fmt = (a) => `${a.address}, ${a.city}, ${a.state} ${a.zip}`;
    const choose = (a) => { s.addressChoice = a; s.addressConfirmedAt = new Date().toISOString(); s.doneAt = new Date().toISOString(); Store.save(); render(); window.scrollTo(0, 0); };
    view().innerHTML = shell(`
      ${heroHtml("Registration", "Confirm registration address", "This address is used for vehicle registration and deal calculations — confirming it here means nobody asks you to type it again.")}
      ${crm && !same ? `
      <p class="ob-helper" style="margin-top:0">The address on the license differs from the one on file. Which should be used?</p>
      <div class="ob-addressoptions">
        <button type="button" class="ob-addressoption" data-pick="lic"><strong>${esc(fmt(lic))}</strong><span>From the license just uploaded</span></button>
        <button type="button" class="ob-addressoption" data-pick="crm"><strong>${esc(fmt(crm))}</strong><span>Already on the Ride Price record</span></button>
      </div>` : `
      <div class="ob-addresscard">
        <div class="ob-addresshead"><div><div class="ob-addresstitle">Registration address</div><div class="ob-source">From the uploaded license</div></div>${same ? `<span class="ob-badge">Matches record</span>` : `<span class="ob-pill">Required</span>`}</div>
        <div class="ob-addressvalue">${esc(fmt(lic))}</div>
        ${same ? `<div class="ob-matchline">✓ Matches the customer record</div>` : ""}
        <button type="button" class="ob-primary" data-pick="lic">Use this address</button>
      </div>`}`);
    $$("[data-pick]").forEach(b => b.onclick = () => choose(b.dataset.pick === "crm" ? crm : lic));
  }

  function renderDoneView() {
    view().innerHTML = shell(`
      <div class="ob-ready"><div class="ob-readycheck">✓</div><h2>You&rsquo;re all set</h2>
        <p>Your information went directly to Ride Price — the advisor never receives your license image through text or email.</p></div>
      <div class="ob-statuslist">
        <div class="ob-statusrow"><span class="ob-statusicon">✓</span><div><div class="ob-statuslabel">Identity photo</div></div><span class="ob-statusvalue">Captured</span></div>
        <div class="ob-statusrow"><span class="ob-statusicon">✓</span><div><div class="ob-statuslabel">License photo</div></div><span class="ob-statusvalue">Received</span></div>
        <div class="ob-statusrow"><span class="ob-statusicon pending">•</span><div><div class="ob-statuslabel">Second license side</div><div class="ob-statussub">Can be added later when a workflow requires it</div></div><span class="ob-statusvalue pending">Pending</span></div>
        <div class="ob-statusrow"><span class="ob-statusicon">✓</span><div><div class="ob-statuslabel">Registration address</div></div><span class="ob-statusvalue">Confirmed</span></div>
      </div>
      <a class="ob-primary ob-linkbtn" href="#/customers">Return to advisor view</a>`);
  }

  render();
});

/* start a visit for a known customer — used by the Find-a-Customer screen
   and the deals queue's scanner button. The advisor of record is stamped at
   creation so the role switcher can scope the floor to "my deals".
   Deliberately Store.s.advisor, not roleName(): the field is the salesperson
   RESPONSIBLE for the deal, not who tapped the button. A visit the Team Lead
   starts still belongs to the floor advisor — stamping the lead's name would
   orphan the deal from every advisor's view with no reassignment UI. */
function startVisit(customerId) {
  const deal = {
    id: uid("d"), dealNo: Store.mintDealNo(), customerId, stock: null, dealType: "finance", stage: "discovery",
    createdAt: new Date().toISOString(), advisor: Store.s.advisor,
    discovery: { answers: {}, done: false },
    testDrive: { done: false },
    /* no `payoff`: a visit that has not reached the trade screen has not been
       asked about a loan, and seeding a 0 there made the appraisal form claim
       the car was paid off — the same false assertion the year and mileage
       boxes were cleared of on 2026-09-08/09. `value: 0` STAYS: it has no
       input box, every reader takes it through `|| 0` or `> 0`, and dropping
       it would only widen the money(undefined) surface on the printables for
       no visible gain. */
    trade: { has: false, value: 0, rebates: 0, applyTaxCredit: true },
    huddle: { done: false },
    desk: { term: 60, apr: 4.5, downPayment: 1000, leaseTerm: 36, milesPerYear: 12000, leaseFactor: 0.0015, dueAtSigning: 1000, accessories: [], daysToFirst: 45 },
    basePayment: null, creditApp: null,
    menu: { step: 1, barsDone: [], custom: [], customSource: null, selectedProgram: null, initials: "", ackSigned: false },
    forms: { selected: [], finalized: false }
  };
  const cust = Store.customer(customerId);
  const tier = RIDE_PRICE_CALC.creditTier(cust.creditScore || 700);
  deal.desk.apr = tier.agreedApr;
  deal.desk.leaseFactor = tier.leaseFactor;
  /* check-in (chrome rule v022 §10): finishing the resolver — a confirmed
     customer, a scanned licence, a manual entry — is the advisor bringing
     the customer in. Presence is this stamp, not the deal's stage. Whether a
     secure-link session counts as present before arrival is an open item;
     the code keeps doing what it did (it checks in). */
  deal.visit = { arrivedAt: deal.createdAt };
  Store.s.deals.push(deal); Store.save();
  navigate(`#/discovery/${deal.id}`);
}

/* ============================================================
   LICENSE SCAN — prop-license capture, match & verify (demo)
   Recognition is simulated: only the 5 printed training props
   can ever resolve (see assets/scan.js). Photos are never stored.
   ============================================================ */
/* the printed prop face keeps its own silhouette — the licence artwork the
   training documents render and print, untouched by the scan chrome */
const SCAN_SILHOUETTE = `<svg viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="20" cy="15" r="9"/><path d="M4 48c0-10 7-16 16-16s16 6 16 16z"/></svg>`;

/* Certain matches apply silently; ambiguous ones (`ask` set) get a confirmation
   prompt in the scan flow. Name+DOB-differs falls through: that's a different person. */
function findLicenseMatch(p) {
  const norm = (s) => String(s || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const cs = Store.s.customers;
  const nameEq = (x) => x.first.toLowerCase() === p.first.toLowerCase() && x.last.toLowerCase() === p.last.toLowerCase();
  /* two states can issue the same number — require the state too when both sides have one */
  let c = cs.find(x => x.license && norm(x.license.number) === norm(p.license.number)
    && (!x.license.state || !p.license.state || norm(x.license.state) === norm(p.license.state)));
  if (c) return { type: "license number", customer: c };
  c = cs.find(x => x.dob && x.dob === p.dob && nameEq(x));
  if (c) return { type: "date of birth and name", customer: c };
  c = cs.find(x => x.dob && x.dob === p.dob);
  if (c) return { type: "date of birth", customer: c, ask: "dob" };
  /* a profile that exists only because a secure upload link was sent — made
     remotely, no license ever read — carries a CLAIMED name, not a verified
     identity, so it is never taken as a name-only match. What links it is
     the phone number, and only after the guest reads the code back (seed
     v023: Marcus). Once a license is on it, it matches like any record. */
  c = cs.find(x => !x.dob && nameEq(x) && !(x.createdVia === "link" && !x.license));
  if (c) return { type: "name", customer: c, ask: "name" };
  return { type: null, customer: null };
}

function openScanFlow(opts) {
  const o = Object.assign({ mode: "customer" }, opts);
  const st = { frontDone: false, persona: null, match: null, render: null, saved: false, manNum: "", manState: "NY", stage: "front", sv: null, pick: null, fields: {}, procFile: null };
  modal("Scan Driver's License", `<div id="scanBody"></div>`);
  const body = $("#scanBody");
  /* the scan is a Task on the kit (owner's scan-license package v023): two
     decisions — Scan, then Confirm — with every exception in the kit's
     sheet. The frame stays the app's modal because five doors open this
     flow (the resolver, the deals search, the test drive, the buyers sheet)
     and each brings its own onDone; the modal shell only carries them, and
     the kit's Task skeleton is drawn inside it. Recognition itself still
     only ever reads the five printed props (invariant 4). */
  const backEl = $("#modalBack");
  backEl.classList.add("modal-back--journey");
  $(".modal", backEl).classList.add("modal--journey");
  setModalFoot(""); /* the actions live in the kit's dock */
  /* a kit screen paints on the kit canvas: the body carries it while the
     flow is up and gets its own back on close — but not on a navigation,
     where the route that took over has already set its own (the router is
     registered before this flow's hashchange listener, so it runs first) */
  const prevCanvas = document.body.dataset.canvas, roleAtOpen = Store.s.role;
  document.body.dataset.canvas = "kit";
  const sheets = chSheetOpener("scScrim", "scSheet");

  /* one teardown for every exit path — dismissal, navigation, or save */
  function cleanup(navigated) {
    st.cancelled = true;
    window.removeEventListener("hashchange", abandon);
    backEl.removeEventListener("click", onDismiss);
    document.removeEventListener("click", leaveGuard, true);
    sheets.close();
    if (navigated) return;
    document.body.dataset.canvas = prevCanvas;
    /* the role control is live on every task screen; a switch made here has
       to reach the screen underneath, whose chrome still shows the role it
       was drawn with */
    if (Store.s.role !== roleAtOpen) router();
  }
  /* the backdrop is only reachable on a desktop, beside the phone frame; the
     modal's own listener has already closed it by the time this runs */
  function onDismiss(e) { if (e.target === backEl) cleanup(false); }
  function abandon() { cleanup(true); closeModal(); } /* navigating away abandons the scan */
  /* leaving a part-done scan asks once (captured photos and parsed details
     would be discarded). Capture-phase on document so it runs before the
     modal's own close handler; nothing captured — or already saved — closes
     instantly. The close control asks through requestClose() on its own. */
  function leaveGuard(e) {
    if (st.cancelled || st.saved || !document.contains(backEl)) return;
    if (e.target !== backEl || !st.frontDone) return;
    e.preventDefault(); e.stopImmediatePropagation();
    renderLeaveConfirm();
  }
  document.addEventListener("click", leaveGuard, true);
  backEl.addEventListener("click", onDismiss);
  window.addEventListener("hashchange", abandon);
  const done = () => { closeModal(); cleanup(false); };
  const requestClose = () => { if (st.frontDone && !st.saved) renderLeaveConfirm(); else done(); };
  const live = () => !st.cancelled && document.contains(body);

  /* ---- the Task chrome: title "Scan license", the two-part step as the
     subtitle, the DEMO band as the only environment marker (no wordmark, no
     progress bar, no training chip — v023). The eyebrow names the mode. ---- */
  const CONFIRM_STAGES = ["confirm", "new", "done", "block", "td"];
  const stepLabel = () => CONFIRM_STAGES.includes(st.stage) ? "Step 2 of 2 · Confirm" : "Step 1 of 2 · Scan";
  const EYEBROW = o.mode === "testdrive" ? "Test drive · license" : o.mode === "cobuyer" ? "Co-buyer identity" : "Customer identity";
  /* no lede under a task title (chrome rule §5) — the eyebrow and the title carry it */
  const hero = (titleHtml) => `<div class="rp-eyebrow">${EYEBROW}</div><h1 class="rp-title">${titleHtml}</h1>`;
  const initials = (first, last) => esc(((first || " ")[0] + (last || " ")[0]).toUpperCase().trim() || "?");
  /* everything that belongs to the guest just scanned — cleared wherever a
     fresh scan starts, so nothing leaks into the next guest's journey */
  const resetGuest = () => { st.frontDone = false; st.persona = null; st.match = null; st.sv = null; st.pick = null; st.fields = {}; st.procFile = null; };
  const doneMark = () => `<span class="rp-step__mark rp-step__mark--done">${rpGlyph("check")}</span>`;
  /* both cells are markup by contract — callers esc() their own values */
  const kvRow = (labelHtml, valueHtml) => `<div class="rp-kv__row"><span>${labelHtml}</span><span>${valueHtml}</span></div>`;
  const fullName = (p) => [p.first, p.middle, p.last].filter(Boolean).join(" ");
  const fmtAddr = (p) => `${p.address}, ${p.city}, ${p.state} ${p.zip}`;
  const licLine = (l) => l.number + (l.state ? " · " + l.state : "");
  const primary = (attrs, labelHtml) => `<button type="button" class="rp-primary" ${attrs}>${labelHtml}</button>`;
  const link = (attrs, labelHtml) => `<button type="button" class="rp-link" ${attrs}>${labelHtml}</button>`;
  const field = (id, label, type, value, placeholder) => `<div class="rp-field"><label class="rp-field__label" for="${id}">${label}</label><input class="rp-field__input" id="${id}" type="${type}"${type === "tel" ? ` inputmode="tel"` : ""} autocomplete="off" placeholder="${esc(placeholder || "")}" value="${esc(value || "")}"></div>`;
  const dateField = (id, label, value) => `<div class="rp-field"><label class="rp-field__label" for="${id}">${label}</label><input class="rp-field__input" id="${id}" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(value || "")}"></div>`;
  /* the kit's option row (title, sub, radio) — one on at a time */
  const option = (key, titleHtml, subHtml, on) => `<button type="button" class="rp-option${on ? " rp-option--on" : ""}" data-opt="${key}"><span><span class="rp-option__title">${titleHtml}</span><span class="rp-option__sub">${subHtml}</span></span><span class="rp-radio${on ? " rp-radio--on" : ""}">${on ? rpGlyph("check") : ""}</span></button>`;
  /* the role control repaints whichever screen is up, so a pick already made
     has to survive it: keep st.pick when this surface actually offers it (the
     confirm's same/new and the conflict sheet's link/separate are disjoint
     sets), else start at the surface's own default. Review lesson 6 — a
     re-render must not undo what the user set. */
  function wireOptions(root, initial) {
    const offered = $$("[data-opt]", root).map(b => b.dataset.opt);
    st.pick = offered.indexOf(st.pick) >= 0 ? st.pick : initial;
    $$("[data-opt]", root).forEach(b => b.onclick = () => {
      st.pick = b.dataset.opt;
      $$("[data-opt]", root).forEach(x => {
        const on = x === b, r = $(".rp-radio", x);
        x.classList.toggle("rp-option--on", on); r.classList.toggle("rp-radio--on", on); r.innerHTML = on ? rpGlyph("check") : "";
      });
    });
    /* the initial state has to agree with st.pick after the line above kept
       an earlier one — otherwise the radio says "Same person" while the pick
       is "new" */
    $$("[data-opt]", root).forEach(x => {
      const on = x.dataset.opt === st.pick, r = $(".rp-radio", x);
      x.classList.toggle("rp-option--on", on); r.classList.toggle("rp-radio--on", on); r.innerHTML = on ? rpGlyph("check") : "";
    });
  }
  /* what the advisor has typed but not yet saved, across a repaint: the role
     switch rebuilds every field from state, so the live values are snapshotted
     by id first and put back after (review lesson 6). Cleared with the working
     values whenever a new guest's scan starts. */
  const syncFields = () => { $$("input[id]", body).forEach(i => { st.fields[i.id] = i.value; }); };
  const restoreFields = () => { $$("input[id]", body).forEach(i => { if (st.fields[i.id] !== undefined) i.value = st.fields[i.id]; }); };
  /* every screen is the kit's Task skeleton inside the modal; a sheet left
     open by the screen before is closed with it, listeners and all */
  function screen(content, dockHtml) {
    sheets.close();
    body.innerHTML = chShell({ template: "task", title: "Scan license", step: stepLabel(), closeId: "scClose" }, content, dockHtml, { scrim: "scScrim", sheet: "scSheet" });
  }
  /* the camera and the library are hidden file inputs; the dock's real
     buttons open them — a label cannot be the kit's button */
  const CAPTURE_INPUTS = `<input type="file" accept="image/*" capture="environment" data-cap data-src="camera" hidden><input type="file" accept="image/*" data-cap data-src="library" hidden>`;
  function wire(renderFn) {
    st.render = renderFn;
    $$("[data-cap]", body).forEach(inp => inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (f && st.onCapture) st.onCapture(f);
    });
    $$("[data-cap-btn]", body).forEach(b => b.onclick = () => { const inp = $(`[data-cap][data-src="${b.dataset.capBtn}"]`, body); if (inp) inp.click(); });
    const close = $("#scClose", body); if (close) close.onclick = requestClose;
    chWireRole(sheets, () => { if (!st.render) return; syncFields(); st.render(); restoreFields(); }, body);
  }
  const openSheet = (html, onMount) => sheets.open(html, (sheet) => { if (onMount) onMount(sheet, sheets.close); });

  /* leaving a part-done scan asks once, in the kit's dialog */
  function renderLeaveConfirm() {
    chDialog(sheets, "Leave the scan?", "The captured photos and parsed details will be discarded.", "Leave", () => done());
  }

  /* ---- Screen 1: scan. Front and back are phases of one architecture. ---- */
  function renderScan(side) {
    const isBack = side === "back";
    st.stage = isBack ? "back" : "front";
    screen(`${hero("Scan driver&rsquo;s license")}
      <div class="rp-capture">
        <div class="rp-capture__frame">${isBack
          ? `<div class="rp-capture__barcode" aria-hidden="true"><i></i></div>`
          : `<div class="rp-capture__card" aria-hidden="true"><div class="rp-capture__portrait">${rpGlyph("customers")}</div><div class="rp-capture__lines"><i></i><i></i><i></i></div></div>`}</div>
        <p class="rp-capture__hint">${isBack ? "Flip to the back" : "Position the front inside the frame"}</p>
        ${isBack ? `<div class="rp-capture__state">${doneMark()}Front captured · ready for the back</div>` : ""}
      </div>${CAPTURE_INPUTS}`,
      chDock(primary(`data-cap-btn="camera"`, isBack ? "Capture back" : "Take photo"), link(`data-cap-btn="library"`, "Choose from library")));
    st.onCapture = isBack ? (file) => renderProcessing(file) : (file) => {
      st.frontDone = true;
      /* opportunistic: if this photo already shows the barcode side, skip the
         wait — recognition still only ever reads the known prop barcodes */
      const gen = st.frontGen = (st.frontGen || 0) + 1;
      RIDE_PRICE_SCAN.recognizeFile(file).then((res) => {
        if (res && res.ok && res.persona && !st.cancelled && st.frontGen === gen && st.stage === "back" && document.contains(body)) {
          toast("Barcode detected on that photo — skipping ahead");
          renderProcessing(null, res.persona);
        }
      }).catch(() => { /* front photo without a barcode is the normal case */ });
      renderScan("back");
    };
    wire(() => renderScan(side));
  }

  /* processing and the CRM search are system states, not journey steps: they
     render inline on the capture card, with no action to take. Every entry
     takes a generation token; navigating away or a newer read invalidates the
     old resolve (review lesson 5 — a stale recognizeFile must never paint
     this screen). */
  function renderProcessing(file, personaAlready) {
    st.stage = "processing";
    const gen = st.procGen = (st.procGen || 0) + 1;
    const mine = () => live() && st.procGen === gen;
    st.procFile = file;
    screen(`${hero("Scan driver&rsquo;s license")}
      <div class="rp-capture">
        <div class="rp-capture__frame"><div class="rp-capture__barcode" aria-hidden="true"><i></i></div></div>
        <p class="rp-capture__hint">Reading the license</p>
        <div class="rp-capture__state">${doneMark()}Front and back captured</div>
      </div>`);
    /* a repaint (the role switch) re-reads the same file: a new generation, the old resolve discarded */
    /* only the persona THIS call was given — st.persona may still hold the
       previous guest's (the block screen's rescan leaves it), and a repaint
       that reused it would resolve the new capture to the old identity */
    wire(() => renderProcessing(st.procFile, personaAlready));
    const settle = (p) => { if (!mine()) return; if (p) { st.persona = p; afterRecognize(); } else renderReject(); };
    if (personaAlready) { setTimeout(() => settle(personaAlready), 700); return; }
    RIDE_PRICE_SCAN.recognizeFile(file).then((res) => {
      setTimeout(() => settle(res && res.ok ? res.persona : null), 500);
    }).catch(() => { if (mine()) renderReject(); });
  }

  /* failed read is an exception sheet over the capture screen — the advisor
     never leaves the scanner to recover. One line of camera guidance. */
  function renderReject() {
    renderScan("back");
    openSheet(`${chSheetHead("We couldn’t read the license")}
      <p class="rp-sheet__sub">Keep the whole barcode inside the frame and avoid glare.</p>
      ${primary("data-sheet-close", "Try again")}
      ${o.mode === "customer" ? link("data-manual", "Find customer manually") : ""}`, (sheet, close) => {
      const m = $("[data-manual]", sheet);
      if (m) m.onclick = () => { close(); renderManual(); };
    });
  }

  /* manual CRM search (exception sheet): by license number and issuing state
     ONLY — nothing typed here is ever treated as data read from a card, and
     no persona is invented (recorded honesty decision) */
  function renderManual() {
    openSheet(`${chSheetHead("Find customer manually")}
      <div class="rp-field-row">
        <div class="rp-field"><label class="rp-field__label" for="mnNum">License number</label><input class="rp-field__input" id="mnNum" autocomplete="off" autofocus value="${esc(st.manNum)}"></div>
        <div class="rp-field"><label class="rp-field__label" for="mnState">State</label><input class="rp-field__input" id="mnState" maxlength="2" autocomplete="off" value="${esc(st.manState)}"></div>
      </div>
      ${primary(`id="mnGo"`, "Search")}
      <div id="mnOut"></div>`, (sheet, close) => {
      const run = () => {
        st.manNum = $("#mnNum", sheet).value.trim();
        st.manState = $("#mnState", sheet).value.trim().toUpperCase();
        if (!st.manNum) return markMissing(sheet, [{ el: $("#mnNum", sheet), msg: "Required" }]);
        const norm = (s) => String(s || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
        const hit = Store.s.customers.find(x => x.license && norm(x.license.number) === norm(st.manNum)
          && (!x.license.state || !st.manState || norm(x.license.state) === norm(st.manState)));
        $("#mnOut", sheet).innerHTML = hit
          ? `<div class="rp-section">Results (1)</div><div class="rp-group"><div class="rp-row"><span class="rp-initials">${initials(hit.first, hit.last)}</span><span class="rp-row__body"><span class="rp-row__title">${esc(hit.first + " " + hit.last)}</span><span class="rp-row__sub">${esc(licLine(hit.license))}</span></span><button type="button" class="rp-button-navy" data-use>Use</button></div></div>`
          : `<div class="rp-empty"><strong>No match</strong>No customer carries that license number${st.manState ? " in " + esc(st.manState) : ""}.${o.mode === "customer" ? link("data-create", "Create new customer") : ""}</div>`;
        const use = $("[data-use]", sheet);
        if (use) use.onclick = () => { close(); done(); if (o.onDone) o.onDone(hit, null, { type: "license number", customer: hit }); };
        const cr = $("[data-create]", sheet);
        /* an entry with no onManual (the deals-queue camera) still gets a real
           create path: Find a Customer opens with the manual fallback ready
           (the PR #49 fix — the flag is consumed exactly once) */
        if (cr) cr.onclick = () => {
          close(); done();
          if (o.onManual) return o.onManual();
          scanWantsCreate = true;
          if (location.hash === "#/customers") router(); else navigate("#/customers");
        };
      };
      $("#mnGo", sheet).onclick = run;
      $("#mnNum", sheet).onkeydown = (e) => { if (e.key === "Enter") run(); };
    });
  }

  /* recognition succeeded — route by mode, then by the match cascade. A
     certain match confirms; an ambiguous one asks on the same confirm screen
     (never merged silently); nothing on file creates. */
  function afterRecognize() {
    const p = st.persona;
    if (o.mode === "testdrive") return renderVerifyTd(p);
    const m = findLicenseMatch(p);
    if (o.mode === "cobuyer" && m.customer) {
      if (m.customer.id === o.deal.customerId) return renderBlock();
      if (m.customer.id === o.deal.coBuyerId) return renderBlock("already");
    }
    if (m.customer) { st.match = m; return renderConfirm(m); }
    st.match = m;
    renderNewCustomer();
  }

  /* hard block, no override: the scan resolved to a person already on this deal */
  function renderBlock(kind) {
    st.stage = "block";
    screen(`${hero(kind === "already" ? "Already the co-buyer" : "That&rsquo;s the primary buyer")}
      <div class="rp-notice rp-notice--conflict"><strong>${esc(fullName(st.persona))}</strong>${kind === "already"
        ? "This license resolves to the person already attached as the co-buyer."
        : "A person can&rsquo;t co-sign their own loan — the co-buyer must be a different guest."}</div>`,
      chDock(primary("data-rescan", "Scan a different license"), link("data-cancel", "Cancel")));
    $("[data-rescan]", body).onclick = () => { resetGuest(); renderScan("front"); };
    $("[data-cancel]", body).onclick = () => done();
    wire(() => renderBlock(kind));
  }

  /* one label per type findLicenseMatch() can return — the tag states the
     REAL basis, never an invented confidence (CodeRabbit, PR #49); the short
     form sits on the Identity matched row */
  const BASIS = {
    "license number": "License match",
    "date of birth and name": "Name and birthday match",
    "date of birth": "Same birthday",
    "name": "Name match",
    "your selection": "Your selection"
  };
  const BASIS_SHORT = { "license number": "License", "date of birth and name": "Name & birthday", "date of birth": "Birthday", "name": "Name", "your selection": "Selected" };

  /* the working values (ISO dates) every save path writes from */
  function seedSv(ex) {
    const p = st.persona;
    return st.sv = st.sv || {
      first: p.first, middle: p.middle || "", last: p.last,
      dob: p.dob || "", address: p.address, city: p.city, state: p.state, zip: p.zip,
      email: ex ? ex.email : "", phone: ex ? ex.phone : "",
      license: { number: p.license.number, state: p.license.state, expires: p.license.expires || "" }
    };
  }
  const svVals = () => ({
    first: st.sv.first, middle: st.sv.middle, last: st.sv.last,
    dob: st.sv.dob, address: st.sv.address, city: st.sv.city,
    state: st.sv.state, zip: st.sv.zip,
    email: st.sv.email, phone: st.sv.phone,
    license: { number: st.sv.license.number, state: st.sv.license.state, expires: st.sv.license.expires }
  });
  const normPhone = (s) => String(s || "").replace(/\D/g, "");

  /* what the scanned license changes on the record — delta-only (the board):
     when nothing changed, nothing is listed. The new value alone; the row
     names what the license brings, not what it replaces. */
  function deltasFor(ex, sv) {
    const chg = [];
    const push = (label, oldV, newV, isDate) => { if (newV && (!oldV || String(oldV) !== String(newV))) chg.push({ label, newV, isDate }); };
    push("Name", ex.first + " " + ex.last, sv.first + " " + sv.last);
    push("Date of birth", ex.dob, sv.dob, true);
    push("License", ex.license && ex.license.number ? licLine(ex.license) : "", licLine(sv.license));
    push("Expires", ex.license && ex.license.expires, sv.license.expires, true);
    push("Address", ex.address ? fmtAddr(ex) : "", fmtAddr(sv));
    return chg;
  }

  /* ---- Screen 2: confirm. A certain match confirms with the updates the
     license brings; an ambiguous one shows the scanned license beside the
     record and asks the same-person question as two option rows — nothing
     merges without a human yes. ---- */
  function renderConfirm(m) {
    st.stage = "confirm";
    const p = st.persona, ex = m.customer;
    const sv = seedSv(ex);
    const chg = deltasFor(ex, sv);
    const needContact = !ex.phone || !ex.email; /* both channels required (owner rule) */
    const ask = !!m.ask;
    const basis = BASIS[m.type] || "Match found";
    const last4 = ex.license && ex.license.number ? ex.license.number.slice(-4) : null;
    const addsDob = !!(p.dob && !ex.dob);
    screen(`${hero("Confirm customer")}
      <div class="rp-match">
        <div class="rp-match__head"><span class="rp-initials">${initials(ex.first, ex.last)}</span>
          <span class="rp-row__body"><span class="rp-row__title">${esc(fullName(ex))}</span><span class="rp-row__sub">Existing customer${last4 ? " · license ending " + esc(last4) : ""}${o.mode === "cobuyer" ? " · will be attached as the co-buyer" : ""}</span></span>
          <span class="rp-tag rp-tag--match">${esc(basis)}</span></div>
        ${ask ? "" : `<div class="rp-step">${doneMark()}<div><span class="rp-step__title">Identity matched</span></div><span class="rp-status rp-status--positive">${esc(BASIS_SHORT[m.type] || "Match")}</span></div>`}
        ${needContact
          ? `<div class="rp-step"><span class="rp-step__mark"></span><div><span class="rp-step__title">Contact incomplete</span></div><span class="rp-status">${!ex.phone && !ex.email ? "Phone & email needed" : !ex.phone ? "Phone needed" : "Email needed"}</span></div>`
          : `<div class="rp-step">${doneMark()}<div><span class="rp-step__title">Phone &amp; email on file</span></div><span class="rp-status rp-status--positive">Complete</span></div>`}
      </div>
      <div style="height:16px"></div>
      ${ask ? `<div class="rp-kv"><div class="rp-kv__head">The license just scanned</div>
        ${kvRow("Name", esc(fullName(p)))}${kvRow("Date of birth", p.dob ? esc(dateUS(p.dob)) : "—")}${kvRow("License", esc(licLine(p.license)))}${kvRow("Address", esc(fmtAddr(p)))}</div>`
      : chg.length ? `<div class="rp-kv"><div class="rp-kv__head">Updates from this license · ${chg.length}</div>
        ${chg.map(c2 => kvRow(esc(c2.label), esc(c2.isDate ? dateUS(c2.newV) : c2.newV))).join("")}</div>` : ""}
      ${needContact ? `${!ex.phone ? field("svPhone", "Mobile phone", "tel", sv.phone, "(718) 555-5555") : ""}${!ex.email ? field("svEmail", "Email", "email", sv.email, "name@testing.com") : ""}` : ""}
      ${ask ? option("same", `Same person — update ${esc(ex.first)}&rsquo;s record`, `Adds the license${addsDob ? " and date of birth" : ""} to the profile`, true)
        + option("new", "Different guest — create new", "Starts a new customer from the license", false) : ""}`,
      ask ? chDock(primary("data-save", "Continue"))
          : chDock(primary("data-save", "Confirm &amp; continue"), link("data-notme", `This isn&rsquo;t ${esc(ex.first)}`)));
    if (ask) wireOptions(body, "same");
    const toCreate = () => { st.match = { type: null, customer: null }; st.sv = null; renderNewCustomer(); };
    $("[data-save]", body).onclick = () => {
      if (ask && st.pick === "new") return toCreate();
      if (needContact) {
        if (!ex.phone) sv.phone = $("#svPhone", body).value.trim();
        if (!ex.email) sv.email = $("#svEmail", body).value.trim();
        const bad = [];
        if (!sv.phone) bad.push({ el: $("#svPhone", body), msg: "Required" });
        if (!sv.email) bad.push({ el: $("#svEmail", body), msg: "Required" });
        if (markMissing(body, bad)) return toast("Fill in the fields marked in red");
      }
      saveFrom(svVals(), ex);
    };
    const notme = $("[data-notme]", body); if (notme) notme.onclick = toCreate;
    wire(() => renderConfirm(m));
  }

  /* new customer: identity is a read-only summary from the license — the
     advisor never retypes card data. The only asks are what a license cannot
     say: phone and email (both required; owner rule). No credit score is
     asked (owner, 2026-08-25) — the record starts at the neutral default. */
  function renderNewCustomer() {
    st.stage = "new";
    const sv = seedSv(null);
    screen(`${hero("New customer")}
      <div class="rp-kv">
        ${kvRow("Name", esc(fullName(sv)))}
        ${kvRow("License", esc(licLine(sv.license) + (sv.license.expires ? " · exp " + dateUS(sv.license.expires) : "")))}
        ${kvRow("Date of birth", sv.dob ? esc(dateUS(sv.dob)) : "—")}
        ${kvRow("Address", esc(fmtAddr(sv)))}
      </div>
      ${field("svPhone", "Mobile phone", "tel", sv.phone, "(718) 555-5555")}
      ${field("svEmail", "Email", "email", sv.email, "name@testing.com")}`,
      chDock(primary("data-save", o.mode === "cobuyer" ? "Add as co-buyer" : "Create customer")));
    $("[data-save]", body).onclick = () => {
      sv.phone = $("#svPhone", body).value.trim();
      sv.email = $("#svEmail", body).value.trim();
      /* an empty form marks every missing field at once; with a number
         typed, the number is read first — one already on file opens the
         conflict sheet, and on the link path the profile's own email
         completes the record. Every path that CREATES requires both. */
      if (!sv.phone) { requireContact(svVals()); return; }
      saveFrom(svVals(), null);
    };
    wire(renderNewCustomer);
  }

  /* single save tail for every path (direct, phone-link, phone-keep): write
     the store, then the local done state — no ceremonial success screen */
  function finishSave(cust, wasExisting, warnMsg) {
    if (o.mode === "cobuyer") o.deal.coBuyerId = cust.id;
    Store.save();
    if (o.mode === "cobuyer") {
      done(); toast(warnMsg || "Co-buyer added — " + cust.first + " " + cust.last);
      if (o.onDone) o.onDone(cust, st.persona, st.match);
      return;
    }
    st.saved = true;
    if (warnMsg) toast(warnMsg);
    renderDone(cust, wasExisting);
  }

  /* every path that writes a NEW record writes a complete one: the same
     required set and the same marks as Create Customer, on the form underneath */
  function requireContact(vals) {
    const bad = customerMissing(vals, "sv", body);
    if (markMissing(body, bad)) { toast("Fill in the fields marked in red"); return false; }
    return true;
  }

  function saveFrom(vals, ex) {
    const phoneDigits = normPhone(vals.phone);
    const mkNew = () => {
      const cust = Object.assign({ id: uid("c"), creditScore: 700, createdAt: new Date().toISOString() }, vals);
      Store.s.customers.push(cust);
      return cust;
    };
    if (ex) {
      /* matched already — a typed phone belonging to someone ELSE is likelier a typo
         or a shared phone than a wrong match: warn, don't switch */
      const other = phoneDigits && Store.s.customers.find(x => x.id !== ex.id && normPhone(x.phone) === phoneDigits);
      Object.assign(ex, vals);
      finishSave(ex, true, other ? "Saved — heads up: that phone number is also on file for " + other.first + " " + other.last : null);
    } else {
      /* about to create — the typed phone is the last chance to catch a duplicate */
      const dup = phoneDigits && Store.s.customers.find(x => normPhone(x.phone) === phoneDigits);
      if (dup) return renderPhoneConflict(dup, vals, mkNew);
      if (!requireContact(vals)) return;
      /* and a near-miss on the name or birthday is worth one look before a
         second record for the same person is written */
      const near = nearMatches(vals);
      if (near.length) return renderDuplicates(near, vals, mkNew);
      finishSave(mkNew(), false);
    }
  }

  /* customers close enough to be the same person: same surname with the same
     first initial, or the same date of birth. An exact license or name+DOB hit
     never reaches here — findLicenseMatch() already routed those to a match. */
  function nearMatches(vals) {
    const lc = (s) => String(s || "").trim().toLowerCase();
    return Store.s.customers.filter(x => {
      if (lc(x.last) === lc(vals.last) && lc(x.first)[0] === lc(vals.first)[0]) return true;
      return !!(vals.dob && x.dob === vals.dob);
    }).slice(0, 5);
  }

  /* possible duplicate (exception sheet): explicit confirmation before a
     second record for the same person is written — never merged silently */
  function renderDuplicates(cands, vals, mkNew) {
    openSheet(`${chSheetHead("Possible duplicate")}
      <div class="rp-group">${cands.map((c2, i) => `<button type="button" class="rp-row" data-pik="${i}"><span class="rp-initials">${initials(c2.first, c2.last)}</span><span class="rp-row__body"><span class="rp-row__title">${esc(fullName(c2))}</span><span class="rp-row__sub">${esc(c2.phone || c2.email || "No contact on file")}</span></span><span class="rp-row__chevron"></span></button>`).join("")}</div>
      <p class="rp-sheet__sub">Creating new adds a second record with this name.</p>
      ${primary("data-none", "Create new customer")}`, (sheet, close) => {
      $$("[data-pik]", sheet).forEach(b => b.onclick = () => {
        close();
        st.match = { type: "your selection", customer: cands[+b.dataset.pik] };
        st.sv = null;
        renderConfirm(st.match);
      });
      $("[data-none]", sheet).onclick = () => { close(); finishSave(mkNew(), false); };
    });
  }

  /* the typed phone matches an existing record (exception sheet): whose it
     is and how that profile came to be, then the choice as two option rows.
     Nothing merges until the number is verified. */
  function renderPhoneConflict(dup, vals, mkNew) {
    const isPrimary = o.mode === "cobuyer" && dup.id === o.deal.customerId;
    const via = dup.createdVia === "link" ? "created from a secure upload link" : "an existing customer";
    openSheet(`${chSheetHead("This number is already in use")}
      <div class="rp-notice rp-notice--conflict"><strong>${esc(vals.phone)}</strong>On ${esc(dup.first + " " + dup.last)}&rsquo;s profile — ${via}, ${dup.license && dup.license.number ? "license on file" : "no license on file"}.${isPrimary ? " That&rsquo;s the primary buyer on this deal, so linking isn&rsquo;t available." : ""}</div>
      ${isPrimary ? "" : option("link", "Verify the number and link this license", "The scanned license joins the existing profile", true)}
      ${option("separate", "Keep profiles separate", "Creates a second customer record", isPrimary)}
      <div style="height:8px"></div>
      ${primary("data-continue", "Continue")}
      ${link("data-pfix", "Use a different number")}`, (sheet, close) => {
      wireOptions(sheet, isPrimary ? "separate" : "link");
      $("[data-continue]", sheet).onclick = () => {
        close();
        if (st.pick === "link") return renderVerifyCode(dup, vals);
        if (!requireContact(vals)) return; /* a second record needs its own email */
        finishSave(mkNew(), false);
      };
      $("[data-pfix]", sheet).onclick = () => {
        close();
        st.sv.phone = "";
        const ph = $("#svPhone", body);
        if (ph) { ph.value = ""; ph.scrollIntoView({ block: "center" }); ph.focus(); }
      };
    });
  }

  /* the verified number links the scanned identity onto the profile that
     owns it: everything the license says, the number itself, and the typed
     email only when one was typed — a profile's own email is never blanked
     by an empty field */
  function linkOnto(c, vals) {
    const v = Object.assign({}, vals);
    if (!v.email) delete v.email;
    Object.assign(c, v);
  }

  /* linking overwrites someone's existing record off a TYPED number, so it is
     gated behind a code verification (owner, 2026-08-25): the guest reads
     back the code sent to that number. Six display boxes over one real
     field, because the kit draws the boxes as static cells. Wrong code
     merges nothing. */
  function renderVerifyCode(dup, vals) {
    const mint = () => String(Math.floor(100000 + Math.random() * 900000));
    let code = mint(), timer = null;
    openSheet(`${chSheetHead("Verify the phone number")}
      <p class="rp-sheet__sub">Enter the six-digit code sent to ${esc(vals.phone)}.</p>
      <div class="rp-code" id="svCode">${Array.from({ length: 6 }, (_, i) => `<div class="rp-code__box${i === 0 ? " rp-code__box--active" : ""}" aria-hidden="true"></div>`).join("")}</div>
      <input class="sr-only" id="svCodeInput" inputmode="numeric" autocomplete="one-time-code" maxlength="6" autofocus aria-label="Six-digit code">
      ${primary("data-verify", "Verify &amp; link")}
      ${link("data-resend", "Resend code")}`, (sheet, close) => {
      const inp = $("#svCodeInput", sheet), boxes = $$(".rp-code__box", sheet);
      const paint = () => { const v = inp.value; boxes.forEach((b, i) => { b.textContent = v[i] || ""; b.classList.toggle("rp-code__box--active", i === Math.min(v.length, 5)); }); };
      inp.oninput = () => { inp.value = inp.value.replace(/\D/g, "").slice(0, 6); paint(); };
      $("#svCode", sheet).onclick = () => inp.focus();
      /* demo mode (owner, v023 — decided): the text "arrives" about a second
         after the sheet opens — the six boxes fill as if the guest read the
         code back — and Verify & link proceeds. Nothing leaves the device
         (invariant 2) and the code is shown nowhere else. A field the
         advisor has already started is left alone. Production behaviour is
         unchanged: the guest reads the code, the advisor types it. */
      const arrive = () => { clearTimeout(timer); timer = setTimeout(() => { if (document.contains(inp) && !inp.value) { inp.value = code; paint(); } }, 1000); };
      arrive();
      $("[data-resend]", sheet).onclick = () => { code = mint(); inp.value = ""; paint(); arrive(); };
      $("[data-verify]", sheet).onclick = () => {
        const typed = inp.value;
        if (typed !== code) return markMissing(sheet, [{ el: inp, msg: typed ? "Code doesn’t match" : "Required" }]);
        clearTimeout(timer); close();
        linkOnto(dup, vals);
        finishSave(dup, true);
      };
    });
  }

  /* completion is local feedback on the confirm surface — the success
     notice, the customer, and the visit as the dominant next action. "Scan
     another" restarts in place with a clean slate. */
  function renderDone(cust, wasExisting) {
    st.stage = "done";
    screen(`<div class="rp-notice rp-notice--success">${doneMark()}Customer ready · ${wasExisting ? "profile updated" : "new profile created"}</div>
      ${hero(esc(fullName(cust)))}
      <div class="rp-kv">
        ${kvRow("License", cust.license && cust.license.number ? esc(licLine(cust.license)) : "—")}
        ${kvRow("Phone", esc(cust.phone || "—"))}
        ${kvRow("Email", esc(cust.email || "—"))}
        ${kvRow("Address", cust.address && cust.city ? esc(fmtAddr(cust)) : "—")}
      </div>`,
      chDock(primary("data-go", "Continue to visit"), link("data-more", "Scan another license")));
    $("[data-go]", body).onclick = () => { done(); if (o.onDone) o.onDone(cust, st.persona, st.match); };
    /* a fresh scan needs a clean slate: the old persona, working values and
       match must not leak into the next guest's journey */
    $("[data-more]", body).onclick = () => {
      resetGuest();
      st.saved = false; st.manNum = ""; st.manState = "NY";
      renderScan("front");
    };
    wire(() => renderDone(cust, wasExisting));
  }

  /* test-drive mode: verify the card in hand for the drive. On a name
     mismatch the card may belong to someone else — fill the agreement but
     never write that identity onto this customer's record. */
  function renderVerifyTd(p) {
    st.stage = "td";
    const c = o.deal ? Store.customer(o.deal.customerId) : null;
    const mismatch = c && (c.first.toLowerCase() !== p.first.toLowerCase() || c.last.toLowerCase() !== p.last.toLowerCase());
    screen(`${hero(mismatch ? "Check the name" : "License read")}
      ${mismatch
        ? `<div class="rp-notice rp-notice--conflict"><strong>${esc(p.first + " " + p.last)}</strong>The license reads a different name from this deal&rsquo;s customer, ${esc(c.first + " " + c.last)}. The name on file won&rsquo;t be changed here.</div>`
        : ""}
      ${field("svDl", "License number", "text", p.license.number)}
      ${field("svDlState", "Issuing state", "text", p.license.state)}
      ${dateField("svDlExp", "Expires", dateUS(p.license.expires))}
      ${dateField("svDob", "Date of birth", dateUS(p.dob))}`,
      chDock(primary(`id="svSave"`, "Use these details")));
    $("#svSave", body).onclick = () => {
      const expText = $("#svDlExp", body).value.trim(), dobText = $("#svDob", body).value.trim();
      const expires = expText ? dateISO(expText) : "";
      const dob = dobText ? dateISO(dobText) : "";
      const lic = { number: $("#svDl", body).value.trim(), state: $("#svDlState", body).value.trim(), expires };
      const bad = [];
      if (!lic.number) bad.push({ el: $("#svDl", body), msg: "Required" });
      if (expText && !expires) bad.push({ el: $("#svDlExp", body), msg: "Enter MM/DD/YYYY" });
      if (dobText && !dob) bad.push({ el: $("#svDob", body), msg: "Enter MM/DD/YYYY" });
      if (markMissing(body, bad)) return toast("Fill in the fields marked in red");
      if (c && !mismatch) { c.dob = dob || c.dob; c.license = lic; Store.save(); }
      done();
      /* samePerson is the name verdict taken BEFORE any field was edited —
         a caller must not re-derive it from the editable license number */
      if (o.onDone) o.onDone(c, Object.assign({}, p, { license: lic, samePerson: !mismatch }));
    };
    wire(() => renderVerifyTd(p));
  }

  renderScan("front");
}

/* ============================================================
   VIEW: Training Documents V3 — owner's replication package, 2026-09-02.

   The package's architecture in one line: TRAINING DOCUMENTS → LICENSES /
   REGISTRATIONS → PAIR ROW → PREVIEW → PRINT. One hub, one segmented
   control, one dominant Print all 5, and five COMPACT pair rows — never
   five print-sized documents in the scrolling list. That is what closes
   RP-UI-012: the 112mm registration was wider than the phone and its right
   edge was clipped with nothing on screen to say so. A document is now
   rendered only inside its own preview sheet, scaled to the viewport, while
   printing still lays it out at true physical size.

   `#/regprops` is kept as an alias onto the registrations tab — the drawer,
   the More sheet and the flow library all link to it.

   Two things the golden could not decide for this app:
   - A licence prop is TWO sides. The back carries the barcode, and that
     barcode is the only thing the scanner can read (invariant 4), so the
     preview and the print set both carry front and back. The golden draws a
     single face because its licence is a picture, not a working prop.
   - The golden prints a registration at 112 x 83mm; ours is the owner's own
     112 x 140mm recreation of the sample he supplied (2026-08-19), whose
     fields are laid out for that height. Squashing it would not "preserve
     true physical dimensions" — it would break the document — so the
     recreation keeps its size and the difference is stated to him.
   ============================================================ */
const propField = (l, v) => `<span class="fld">${l}</span>${esc(v)}`;

/* the two faces of a training licence, extracted so the hub can put them in
   a preview sheet and in the print set from one definition */
function licPropFront(p) {
  const F = propField;
  return `<div class="prop-card">
    <div class="prop-head"><span>NEW YORK &middot; USA</span><b>TRAINING SAMPLE</b></div>
    <div class="prop-body">
      <div class="prop-photo">${SCAN_SILHOUETTE}</div>
      <div class="prop-fields">
        <div class="prop-name">${esc(p.last)}<br>${esc(p.first)} ${esc(p.middle)}</div>
        <div>${F("4d DL", p.license.number)} &nbsp; ${F("9 CLS", p.cls)}</div>
        <div>${F("3 DOB", p.dob)} &nbsp; ${F("4b EXP", p.license.expires)}</div>
        <div>${F("8", p.address + ", " + p.city + ", " + p.state + " " + p.zip)}</div>
        <div>${F("15 SEX", p.sex)} ${F("18 EYES", p.eyes)} ${F("16 HGT", p.hgt)} ${F("4a ISS", p.issued)}</div>
      </div>
    </div>
    <div class="prop-watermark">SAMPLE</div>
    <div class="prop-foot">TRAINING PROP &mdash; NOT A GOVERNMENT DOCUMENT</div>
  </div>`;
}
function licPropBack(p) {
  return `<div class="prop-card">
    <div class="prop-back-top">TRAINING SAMPLE &middot; SCAN THIS SIDE</div>
    ${RIDE_PRICE_SCAN.barcodeSVG(p.prop, "prop-barcode")}
    <div class="prop-fine">${esc(p.last.toUpperCase())} &middot; PROP ${esc(p.prop)} OF 5 &middot; This card exists for Ride Price sales
      training only. The barcode encodes a prop number &mdash; no personal data. It has no value and identifies no one.</div>
    <div class="prop-foot">NOT A GOVERNMENT DOCUMENT</div>
  </div>`;
}

function trainingPairs() {
  return RIDE_PRICE_DATA.licenseProps.map(p => ({
    prop: p.prop,
    id: String(p.prop).padStart(2, "0"),
    name: `${p.first}${p.middle ? " " + p.middle : ""} ${p.last}`.replace(/\s+/g, " ").trim(),
    person: p,
    reg: RIDE_PRICE_DATA.registrationProps.find(r => r.prop === p.prop) || null,
  }));
}

function trainingDocsView(tab) {
  renderChrome("Training Documents", "", "");
  document.body.dataset.canvas = "kit";
  document.body.dataset.screen = "tdoc";
  /* a sub-destination under More (owner's training-documents package v024):
     the Destination skeleton with the More tab active — wordmark, role
     control, the DEMO band, the floating tab bar as the way around. No back
     chevron: the tab bar leaves, and More reopens its sheet. The prop
     renderer and the print pipeline are exactly what V3 built (RP-UI-012
     stays closed); only the hub and the sheet chrome moved onto the kit. */

  const pairs = trainingPairs();
  let type = /^reg/i.test(tab || "") ? "registration" : "license";
  /* the scale is a function of the sheet's width, so it has to be recomputed
     when that width changes — rotate the phone with a preview open and a
     mount-time scale would let the 112mm card reach past the sheet again */
  let sheetFit = null, rearm = true;
  /* the print set returns to the whole tab once no single pair is open —
     through the opener's close hook, so the scrim, Escape and the × all
     re-arm it. The hashchange teardown turns the hook off FIRST: the router
     is registered before any view, so by then it has rendered the new view,
     and a stale closure re-arming the print set would prime the browser's
     own print (Ctrl+P, the OS share sheet) with the tab the advisor just
     left. Teardown drops listeners and touches nothing else. */
  const sheets = chSheetOpener("tdocScrim", "tdocSheet", () => {
    if (sheetFit) { window.removeEventListener("resize", sheetFit); sheetFit = null; }
    if (rearm) setPrintSet(pairs.map(p => p.prop));
  });
  const teardown = () => { rearm = false; sheets.close(); window.removeEventListener("hashchange", teardown); };
  window.addEventListener("hashchange", teardown);

  /* WHAT PRINTS is a rendered set, never a CSS guess: the print root holds
     exactly the documents the action asked for, at their true millimetre
     size, and the print stylesheet hides everything else. */
  function setPrintSet(props) {
    const root = $("#tdocPrint"); if (!root) return;
    root.innerHTML = props.map(n => {
      const pair = pairs.find(x => x.prop === n); if (!pair) return "";
      return type === "license"
        ? `<div class="tdoc-page">${licPropFront(pair.person)}${licPropBack(pair.person)}</div>`
        : pair.reg ? `<div class="tdoc-page">${regPropHtml(pair.reg)}</div>` : "";
    }).join("");
  }

  function rowsHtml() {
    return pairs.map(p => {
      const meta = type === "license"
        ? `License ${esc(p.person.license.number)}`
        : p.reg ? `Registration ${esc(p.reg.docNo)} &middot; ${esc(p.reg.year)} ${esc(p.reg.make)}`
          : "No registration on file";
      return `<button type="button" class="rp-row" data-pair="${esc(p.prop)}"><span class="rp-tile rp-tile--label">${esc(p.id)}</span><span class="rp-row__body"><span class="rp-row__title">${esc(p.name)}</span><span class="rp-row__sub">${meta}</span></span><span class="rp-row__chevron"></span></button>`;
    }).join("");
  }

  function render() {
    /* the print root sits beside the screen, not inside it: the kit's screen
       is the viewport and hides its overflow, and in print it is the screen
       that disappears */
    view().innerHTML = chShell({ template: "destination", active: "more" }, `
      <div class="rp-eyebrow">Training</div>
      <div class="rp-title-row"><h1 class="rp-title">Training documents</h1><button type="button" class="rp-pill-primary" id="tdocPrintAll">Print all ${pairs.length}</button></div>
      <p class="rp-count">${pairs.length} matched pairs</p>
      <div class="rp-segment">${["license", "registration"].map(t => `<button type="button" class="rp-segment__item${type === t ? " rp-segment__item--on" : ""}" data-type="${t}" aria-pressed="${type === t}">${t === "license" ? "Licenses" : "Registrations"}</button>`).join("")}</div>
      <div class="rp-group">${rowsHtml()}</div>`, null, { scrim: "tdocScrim", sheet: "tdocSheet" })
      + `<div class="tdoc-printroot" id="tdocPrint" aria-hidden="true"></div>`;

    $$(".rp-segment [data-type]").forEach(b => b.onclick = () => {
      type = b.dataset.type;
      /* the tab lives in the URL, so a reload and the alias route both land
         on the same screen the advisor was looking at */
      history.replaceState(null, "", type === "license" ? "#/props" : "#/props/registrations");
      render();
    });
    $("#tdocPrintAll").onclick = () => { setPrintSet(pairs.map(p => p.prop)); window.print(); };
    $$("[data-pair]").forEach(b => b.onclick = () => openPair(Number(b.dataset.pair)));
    $("#dqMore").onclick = () => chMoreSheet(sheets);
    chWireRole(sheets, render);
    setPrintSet(pairs.map(p => p.prop));
  }

  /* RP-UI-012 in one function. These documents are millimetre-sized because
     they have to PRINT at true size, so the preview scales them rather than
     reflowing them. Measure the width the sheet actually gives, divide by
     the width the document really wants, and never scale UP — a licence
     already narrower than the sheet is left alone. The wrapper is then given
     the scaled height, or the transform leaves a hole underneath it. */
  function fitPreview(sh) {
    const wrap = $(".tdoc-preview", sh); if (!wrap) return;
    const docs = $$(".prop-card, .reg-card", wrap);
    if (!docs.length) return;
    const pad = 28; /* the wrapper's own left+right padding */
    const avail = wrap.clientWidth - pad;
    let widest = 0;
    docs.forEach(d => { d.style.transform = "none"; widest = Math.max(widest, d.offsetWidth); });
    const scale = widest > 0 ? Math.min(1, avail / widest) : 1;
    wrap.style.setProperty("--tdoc-scale", String(scale));
    docs.forEach(d => { d.style.transform = ""; });
    let h = 0;
    docs.forEach((d, i) => { h += d.offsetHeight * scale + (i ? 10 : 0); });
    wrap.style.height = Math.ceil(h + pad) + "px";
  }

  /* the preview sheet: the pair as its subtitle, the document, one primary.
     The × is the close; the true-size sentence lives with the print, not on
     the screen (v024). */
  function openPair(prop) {
    const p = pairs.find(x => x.prop === prop); if (!p) return;
    const doc = type === "license"
      ? `<div class="tdoc-preview tdoc-preview--lic">${licPropFront(p.person)}${licPropBack(p.person)}</div>`
      : p.reg ? `<div class="tdoc-preview">${regPropHtml(p.reg)}</div>`
        : `<p class="tdoc-empty">No training registration exists for this pair.</p>`;
    sheets.open(`${chSheetHead(type === "license" ? "Training license" : "Training registration")}
      <p class="rp-sheet__sub">${esc(p.name)} &middot; Pair ${esc(p.id)}</p>
      ${doc}
      <div style="height:6px"></div>
      <button type="button" class="rp-primary" id="tdocPrintOne">Print this sample</button>`, (sh) => {
      $("#tdocPrintOne", sh).onclick = () => { setPrintSet([prop]); window.print(); };
      fitPreview(sh);
      if (sheetFit) window.removeEventListener("resize", sheetFit);
      /* guarded on the sheet still being open: a resize after close must not
         resurrect a measurement on a hidden element */
      sheetFit = () => { const sc = $("#tdocScrim"); if (sc && !sc.hidden) fitPreview(sh); };
      window.addEventListener("resize", sheetFit);
    });
    setPrintSet([prop]);
  }

  render();
}

route("props", () => trainingDocsView(""));
route("props/:tab", ({ tab }) => trainingDocsView(tab));
/* the old registrations route keeps working */
route("regprops", () => redirect("#/props/registrations"));

/* ============================================================
   VIEW: Training Registrations (printable trade-in props)
   ============================================================ */

/* The strip along the bottom of a real registration is a dense 2D barcode.
   Ours is a woven tile — every filled run exactly two modules wide, every gap
   the same, each row phase-shifted — so it reads as machine print at arm's
   length and can encode nothing. That is an invariant, not a shortcut: this
   project runs two recognisers over photographs of paper, both require a
   start guard at least three modules wide behind a quiet zone, and a pattern
   whose longest run anywhere is two cannot contain one at any offset in
   either direction. `harness/regprops.mjs` asserts the runs stay bounded. */
const REG_FENCE = { rows: 9, runs: 52, unit: 2 };
function regFenceSVG() {
  const { rows, runs, unit } = REG_FENCE;
  const runW = unit * 2, period = unit * 4, rowH = 5, rects = [];
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * runW;
    for (let i = 0; i < runs; i++) {
      rects.push(`<rect x="${off + i * period}" y="${r * rowH}" width="${runW}" height="${rowH - 1}"/>`);
    }
  }
  return `<svg class="reg-fence" viewBox="0 0 ${runs * period + runW} ${rows * rowH - 1}" preserveAspectRatio="none"
    role="img" aria-label="Decorative strip — not a working barcode">${rects.join("")}</svg>`;
}

/* DEC 12 2019 — the issue-date format the sample registrations print */
const regIssued = (iso) => {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).replace(",", "").toUpperCase();
};
/* 12/11/21 — the two-digit expiry the samples print */
const regExpires = (iso) => {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${String(d.getFullYear()).slice(2)}`;
};

function regPropHtml(r) {
  const p = RIDE_PRICE_DATA.licenseProps.find(x => x.prop === r.prop);
  /* DUESBURY,AYANNA,M — the sample's comma-packed name format */
  const name = p ? `${p.last},${p.first}${p.middle ? "," + p.middle : ""}`.toUpperCase() : "SAMPLE,VEHICLE";
  const addr = p ? p.address.toUpperCase() : "1 SAMPLE STREET";
  const city = p ? p.city.toUpperCase() : "ALBANY";
  const zip = p ? p.zip : "12345";
  return `<div class="reg-card">
    <div class="reg-keep">Keep this document to show to the police and courts.</div>
    <div class="reg-paper">
      <div class="reg-head">
        <span class="reg-form">TS-639TR (SAMPLE)</span>
        <b>NEW YORK STATE REGISTRATION DOCUMENT</b>
        <span class="reg-sampletag">TRAINING<br>SAMPLE</span>
      </div>
      <div class="reg-body">
        <div class="reg-line">${esc(r.plateType)} ${esc(r.cls)}</div>
        <div class="reg-line">${esc(r.plate)}</div>
        <div class="reg-line"><span class="reg-c1">${esc(r.year)} ${esc(r.make.toUpperCase())}</span>${esc(r.transferable)}</div>
        <div class="reg-line"><span class="reg-c1">${esc(r.body)} ${esc(r.color)}</span>${esc(r.vin)}</div>
        <div class="reg-line"><span class="reg-c1">${esc(r.weight)} ${esc(r.fuel)} ${esc(r.cyl)}</span>${esc(r.docNo)} ${esc(regIssued(r.issued))}</div>
        <div class="reg-line"><span class="reg-c1 reg-microlabels"><span>Wt/Seats</span><span>Fuel/Cyl</span></span>${esc(r.office)}</div>
        <div class="reg-expires">Expires <b>${esc(regExpires(r.expires))}</b></div>
        <div class="reg-ownerrow">
          <div class="reg-owner">
            <div>${esc(name)}</div>
            <div>${esc(addr)}</div>
            <div>${esc(city)}&nbsp;&nbsp;&nbsp;&nbsp;NY ${esc(zip)}</div>
          </div>
          <div class="reg-right">
            <div>*${esc(r.region)}*</div>
            <div>${esc(r.annualChg)}</div>
          </div>
        </div>
        <div class="reg-chglabels"><b>ANNUAL CHG</b><span>AMT PAID (INCL ADD CHG)</span></div>
        <div class="reg-foot">
          <b>${esc(r.docNo)}</b>
          <span>VOID IF ALTERED EXCEPT FOR ADDRESS</span>
          <i>${esc(r.amtPaid)}</i>
        </div>
      </div>
      <div class="reg-overprint" aria-hidden="true"><span>SAMPLE</span></div>
    </div>
    <div class="reg-legend">TRAINING SAMPLE — NOT A GOVERNMENT DOCUMENT · NOT VALID FOR ANY PURPOSE</div>
    ${regFenceSVG()}
  </div>`;
}


/* ============================================================
   VIEW: Discovery Session
   ============================================================ */
/* ============================================================
   VIEW: Discovery Session V2 — owner's replication package, 2026-08-31.

   The package's product rule is one sentence: DISCOVERY IS CUSTOMER-FIRST.
   Nothing about a vehicle — year, make, model, trim, VIN, stock, payment —
   may appear before a vehicle has actually been selected. The old screen
   opened with `Deal #83306 · Cheri Bridwell · no vehicle yet` on a fresh
   visit — leading with a deal number the advisor never uses at this stage,
   and volunteering the vehicle's absence where the package wants the
   absence itself to say it.

   That line, the Buyer pill, the Jacket pill and the Deals-list button were
   three stacked rows (RP-UI-005). They collapse to ONE: the customer and the
   stage on the left, compact Jacket access on the right. Everything else —
   visit number, co-buyer, identity, registration address, and the fact that
   no vehicle is chosen — moves into the Visit details sheet, on demand.

   The early object is a VISIT in user-facing language. A deal id still
   exists underneath; it is simply not what the advisor is shown.
   ============================================================ */
route("discovery/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const c = Store.customer(deal.customerId);
  const qs = RIDE_PRICE_DATA.discoveryQuestions;
  /* a vehicle may legitimately exist if one was selected upstream — the rule
     is that Discovery never invents one, not that it hides a real choice */
  const v = deal.stock ? Store.vehicle(deal.stock) : null;
  const jkc = jacketCounts(deal);
  const custName = `${c.first} ${c.last}`;
  let idx = 0;

  /* the golden's shell: back, wordmark, role. No crumb block. */
  const dvTop = () => `<div class="dv-top">
    <button type="button" class="dv-back" id="dvBack" aria-label="Back">‹</button>
    <div class="dv-brand"><span>Ride</span> PRICE</div>
    <span class="dv-spacer"></span>
    <button type="button" class="dv-role" id="dvRole">${isTeamLead() ? "Team Lead" : "Advisor"}</button>
  </div>`;

  /* ONE row. The left half opens Visit details; the right is Jacket. Both
     clear the 40px floor. Stage-aware per the package: the vehicle appears
     here only once one has actually been selected. */
  const contextRow = () => `<div class="dv-context">
    <button type="button" class="dv-ctxmain" id="dvVisit">
      <strong>${esc(custName)}</strong>
      <span>&middot; ${v ? esc(`${v.year} ${v.make} ${v.model}`) : "Discovery"}</span>
    </button>
    <a class="dv-jacket" href="#/jacket/${esc(deal.id)}" aria-label="Deal Jacket — ${esc(jacketChipText(deal))} required documents complete${jkc.missing ? `, ${esc(jkc.missing)} still outstanding` : ""}">
      <span class="dv-jacket__box">${rpIcon("folder")}<b>${esc(jacketChipText(deal))}</b></span>
    </a>
  </div>`;

  let sheetKey = null;
  const closeSheet = () => {
    const sc = $("#dvScrim"); if (sc) sc.classList.remove("show");
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
  };
  const teardown = () => { closeSheet(); window.removeEventListener("hashchange", teardown); };
  window.addEventListener("hashchange", teardown);
  const openSheet = (html, onMount) => {
    const sh = $("#dvSheet"); if (!sh) return;
    sh.innerHTML = `<div class="m-handle"></div>${html}`;
    $("#dvScrim").classList.add("show");
    if (sheetKey) document.removeEventListener("keydown", sheetKey, true);
    sheetKey = (e) => { if (e.key === "Escape") { e.preventDefault(); closeSheet(); } };
    document.addEventListener("keydown", sheetKey, true);
    $$("[data-sheet-close]", sh).forEach(b => b.onclick = closeSheet);
    if (onMount) onMount(sh);
  };

  /* everything the old crumb row shouted, disclosed on demand instead */
  function visitSheet() {
    const co = deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;
    const addr = c.onboard && c.onboard.address && c.onboard.address.confirmedAt;
    /* three identity states, not two (review-lessons pattern 4). Formal
       verification is deal.identity, recorded by the Lending Lane much
       later; a licence photographed at onboarding is c.onboard.licensePhotoAt.
       Reading only the first shows a scanned-in customer as an amber
       "not verified", which tells the advisor something false. */
    const idOk = deal.identity && deal.identity.verifiedAt;
    const idScan = c.onboard && c.onboard.licensePhotoAt;
    const idPill = idOk ? ["", "Identity confirmed"]
      : idScan ? [" dv-status--scan", "Licence photo on file"]
      : [" dv-status--wait", "Identity not verified"];
    openSheet(`
      <h2 class="dv-sheettitle">Visit details</h2>
      <div class="dv-seclab">Customer</div>
      <div class="dv-row">
        <div class="dv-rowmain"><div class="dv-rowname">${esc(custName)}</div>
          <div class="dv-rowsub">Primary buyer</div></div>
        <span class="dv-status${idPill[0]}">${idPill[1]}</span>
      </div>
      <button type="button" class="dv-row dv-row--link" id="dvCoBuyer" data-buyers="${esc(deal.id)}">
        <div class="dv-rowmain"><div class="dv-rowname">Co-buyer</div></div>
        <span class="dv-rowval${co ? " dv-rowval--strong" : ""}">${co ? esc(`${co.first} ${co.last}`) : "None added"}</span>
        <span class="dv-chev" aria-hidden="true">&rsaquo;</span>
      </button>
      <div class="dv-seclab">Visit</div>
      <div class="dv-row"><div class="dv-rowmain"><div class="dv-rowsub">Stage</div></div>
        <span class="dv-rowval dv-rowval--strong">${esc((STAGES[deal.stage] || {}).label || deal.stage)}</span></div>
      <div class="dv-row"><div class="dv-rowmain"><div class="dv-rowsub">Visit #</div></div>
        <span class="dv-rowval dv-rowval--strong">V${esc(deal.dealNo || "—")}</span></div>
      <div class="dv-row"><div class="dv-rowmain"><div class="dv-rowsub">Registration address</div></div>
        <span class="dv-rowval dv-rowval--strong">${addr ? "Confirmed" : "Not confirmed"}</span></div>
      <div class="dv-seclab">Vehicle</div>
      ${v ? `<div class="dv-row"><div class="dv-rowmain">
          <div class="dv-rowname">${esc(`${v.year} ${v.make} ${v.model}`)}</div>
          <div class="dv-rowsub">Selected before this session</div></div></div>`
        : `<div class="dv-row"><div class="dv-rowmain">
            <div class="dv-rowname">No vehicle selected</div>
            <div class="dv-rowsub">Vehicle context appears after Discovery.</div></div></div>`}
      <div class="dv-actions"><button type="button" class="dv-sheetbtn" data-sheet-close>Done</button></div>`, (sh) => {
      /* the delegated [data-buyers] handler on document opens the buyers
         sheet; close this one first so they do not stack */
      const cb = $("#dvCoBuyer", sh);
      if (cb) cb.addEventListener("click", closeSheet);
    });
  }

  function render() {
    const q = qs[idx];
    const saved = deal.discovery.answers[q.key] || "";
    const last = idx === qs.length - 1;
    const pct = Math.round(((idx + 1) / qs.length) * 100);

    /* no crumbs: dealTitle() would build the Deal #/"no vehicle yet" line this
       screen exists to remove. The master canvas hides .pagebar anyway, but
       not building it is the guarantee that survives a CSS change. */
    renderChrome("Discovery Session", "", "");
    document.body.dataset.canvas = "master";
    document.body.dataset.screen = "discovery";

    view().innerHTML = `
      <div class="m-app">
        ${dvTop()}
        <main class="dv-main">
          <div class="dv-eyebrow">Customer discovery</div>
          <h1 class="dv-title">Discovery Session</h1>
          ${contextRow()}
          <div class="dv-progress"><span style="width:${pct}%"></span></div>

          <section class="dv-question">
            <div class="dv-cats">Trips · Family · Pets · Activities · Commute · Drive</div>
            <h2 class="dv-qtitle">${esc(q.title)}</h2>
            <p class="dv-qhint">${esc(q.hint)}</p>
            <textarea class="dv-answer" id="dvAns" placeholder="Capture the conversation in their words…">${esc(saved)}</textarea>
            <div class="dv-autosave"><i></i><span id="dvSaved">Autosaved to customer discovery</span></div>
            <div class="dv-qactions">
              ${idx === 0 ? "" : `<button type="button" class="dv-secondary" id="dvBackQ">← Back</button>`}
              <span class="dv-grow"></span>
              <button type="button" class="dv-primary" id="dvNext">${last ? "Find vehicles →" : "Next →"}</button>
            </div>
          </section>
        </main>
      </div>
      <div class="m-scrim" id="dvScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="dvSheet"></div></div>`;

    $("#dvBack").onclick = () => history.back();
    $("#dvRole").onclick = () => $("#hamburgerBtn").click();
    $("#dvVisit").onclick = visitSheet;
    const scrim = $("#dvScrim");
    if (scrim) scrim.onclick = (e) => { if (e.target === scrim) closeSheet(); };

    const ans = $("#dvAns");
    ans.focus();
    /* autosave is the package's word, so it has to be true: every keystroke
       persists, not just the Next tap */
    ans.oninput = () => { saveAns(); };

    const back = $("#dvBackQ");
    if (back) back.onclick = () => { saveAns(); idx--; render(); };
    $("#dvNext").onclick = () => {
      saveAns();
      if (!last) { idx++; render(); return; }
      /* the questions really are answered, so record that now. The STAGE is
         a different claim: it says where the visit has got to, and the visit
         has not reached vehicle selection until the advisor goes there. The
         package's own rule 10 is that context may evolve only after the step
         actually happens, and "Back to questions" below must not leave a
         visit sitting in a stage it never entered. Advanced on the link that
         navigates, the way #toDesk and #toDesk2 already do. */
      deal.discovery.done = true;
      Store.save();
      /* the golden's hand-off is STATUS ROWS, not prose (rule 12: the
         hierarchy explains the screen), and it must state plainly that no
         vehicle is chosen yet. The answer count is the real one — the golden
         hard-codes 7, but an advisor can reach here with blanks. */
      const answered = qs.filter(q2 => (deal.discovery.answers[q2.key] || "").trim()).length;
      openSheet(`
        <h2 class="dv-sheettitle">Discovery complete</h2>
        <div class="dv-row">
          <div class="dv-rowmain"><div class="dv-rowname">${esc(custName)}</div>
            <div class="dv-rowsub">${esc(answered)} of ${esc(qs.length)} discovery answers saved</div></div>
          <span class="dv-status">Complete</span>
        </div>
        <div class="dv-row">
          <div class="dv-rowmain"><div class="dv-rowname">Vehicle</div>
            <div class="dv-rowsub">${v ? esc(`${v.year} ${v.make} ${v.model}`) : "Not selected yet"}</div></div>
        </div>
        <div class="dv-actions">
          <a class="dv-sheetbtn dv-sheetbtn--primary" id="dvToVehicles" href="#/vehicles/${esc(deal.id)}">Find matching vehicles</a>
          <button type="button" class="dv-sheetbtn" data-sheet-close>Back to questions</button>
        </div>`, (sh) => {
        const go = $("#dvToVehicles", sh);
        if (go) go.onclick = () => { if (deal.stage === "discovery") { deal.stage = "vehicle"; Store.save(); } };
      });
    };
  }
  function saveAns() {
    const el = $("#dvAns"); if (!el) return;
    deal.discovery.answers[qs[idx].key] = el.value; Store.save();
  }
  render();
});

/* ============================================================
   VIEW: Vehicle Search
   ============================================================ */
/* ---------------- master system helpers (Master Replication, 2026-08-27) ---------------- */
/* the master top bar: back circle, centred brand, advisor avatar (opens the drawer) */
function masterTop() {
  return `<div class="m-topbar"><div class="m-toprow">
    <button class="m-circle" id="mBack" aria-label="Back">‹</button>
    <div class="m-brand">Ride Price</div>
    <button class="m-avatar" id="mAvatar" aria-label="Open navigation menu">${esc((roleName()[0] || "A").toUpperCase())}</button>
  </div></div>`;
}
function wireMasterTop() {
  const b = $("#mBack"), a = $("#mAvatar");
  if (b) b.onclick = () => history.back();
  if (a) a.onclick = () => $("#hamburgerBtn").click();
}
/* the deal header (owner's desking prototype): wordmark left, deal + role right */
function deskTop(deal) {
  return `<div class="m-topbar"><div class="m-dealrow">
    <div class="m-wordmark"><span class="rideprice">Ride</span><span class="price">PRICE</span></div>
    <div class="m-dealside">${deal.dealNo ? `<span class="m-dealno">Deal #${esc(deal.dealNo)}</span>` : ""}<button class="m-rolebtn" id="mRole">${isTeamLead() ? "Team Lead" : "Advisor"}</button></div>
  </div></div>`;
}
function wireDeskTop() {
  const r = $("#mRole");
  if (r) r.onclick = () => $("#hamburgerBtn").click(); /* the drawer carries nav and the role switch */
}
/* the golden example's flat car illustration, coloured from the vehicle's hue */
/* the tint a vehicle's flat car image sits on — one definition, because the
   inventory card, the choice row and desking's present-mode hero all draw the
   same car and a second copy would drift */
const vehicleTint = (v) => `background:linear-gradient(145deg,hsl(${esc(v.hue)},42%,94%),hsl(${esc(v.hue)},36%,86%))`;
function mCarSvg(v, cls) {
  const color = `hsl(${esc(v.hue)}, 58%, 52%)`;
  return `<svg class="${cls || "m-carsvg"}" viewBox="0 0 260 130" aria-hidden="true">
    <ellipse cx="130" cy="106" rx="94" ry="10" fill="rgba(0,0,0,.09)"/>
    <path d="M45 78h18l18-31c5-9 14-14 25-14h49c12 0 23 5 31 14l24 31h13c9 0 16 7 16 16v7H28v-7c0-9 7-16 17-16Z" fill="${color}"/>
    <path d="M93 45h60c7 0 12 2 17 7l20 24H70l14-24c3-5 5-7 9-7Z" fill="#D8EFF6"/>
    <path d="M130 45v31" stroke="#A9CAD3" stroke-width="4"/>
    <rect x="49" y="81" width="21" height="11" rx="5" fill="#FFE9A8"/>
    <rect x="194" y="81" width="21" height="11" rx="5" fill="#FFB1B9"/>
    <circle cx="75" cy="101" r="19" fill="#292929"/><circle cx="75" cy="101" r="9" fill="#A8A8A8"/>
    <circle cx="192" cy="101" r="19" fill="#292929"/><circle cx="192" cy="101" r="9" fill="#A8A8A8"/>
  </svg>`;
}

/* ============================================================
   VEHICLE CONTENTION — chrome rule §14 (vehicle-selection package v025)

   Several customers may have the same vehicle on their worksheets. Two
   informational states, and neither blocks Choose this vehicle:
   - Working is DERIVED: every open deal that carries the stock. When a
     second advisor chooses a car already on an open deal, the advisors
     already on it are told (noteWorking).
   - Reserved is RECORDED: the buyer's order signed by customer and manager
     (Desking / F&I, not drawn yet) calls reserveVehicle(); funded or voided
     calls releaseVehicle(). Every advisor with the car on an open deal gets
     the alert at the top of My deals — and the push, which this demo
     delivers as a toast.
   Nothing is drawn in inventory or the details sheet; only deal cards
   (My deals, Active floor) and the alert carry a state.
   ============================================================ */
const dealOpen = (d) => d.stage !== "complete";
/* the advisor a deal belongs to: the seed deal carries none (it predates the
   field), and a deal with no advisor is the demo advisor's own */
const dealAdvisor = (d) => d.advisor || Store.s.advisor;
/* "2:14" — the hour and minute as the package writes them on an alert */
const clockLabel = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s?[AP]M$/i, "");
function vehicleHold(stock) { return stock && Store.s.holds ? Store.s.holds[stock] || null : null; }
function workingDeals(stock, exceptId) { return Store.s.deals.filter(d => d.stock === stock && dealOpen(d) && d.id !== exceptId); }
const vehicleLabel = (stock) => { const v = Store.vehicle(stock); return v ? `${v.year} ${v.make} ${v.model}` : stock; };
const custOf = (d) => { const c = Store.customer(d.customerId); return c ? `${c.first} ${c.last}` : "the customer"; };
/* addressed to the deal's advisor, so a Team Lead acting as one sees theirs */
function pushAlert(a) {
  Store.s.alerts = Store.s.alerts || [];
  Store.s.alerts.push(Object.assign({ id: uid("n"), at: new Date().toISOString(), dismissed: false }, a));
}
function reserveVehicle(stock, by, atISO) {
  const at = atISO || new Date().toISOString();
  Store.s.holds = Store.s.holds || {};
  Store.s.holds[stock] = { state: "reserved", by, at };
  workingDeals(stock).forEach(d => pushAlert({ kind: "reserved", stock, dealId: d.id, advisor: dealAdvisor(d), title: "Vehicle reserved",
    body: `${vehicleLabel(stock)} · ${stock} — buyer’s order signed ${clockLabel(at)} by ${by}${by.slice(-1) === "." ? "" : "."} Your deal for ${custOf(d)} stays open.` }));
  Store.save();
}
function releaseVehicle(stock) {
  if (Store.s.holds && Store.s.holds[stock]) { delete Store.s.holds[stock]; Store.save(); }
}
function noteWorking(stock, deal) {
  workingDeals(stock, deal.id).filter(o => dealAdvisor(o) !== dealAdvisor(deal)).forEach(o => pushAlert({ kind: "working", stock, dealId: o.id, advisor: dealAdvisor(o), title: "Also selected",
    body: `${dealAdvisor(deal)} also selected ${vehicleLabel(stock)} · ${stock}, for ${custOf(deal)}. Your deal for ${custOf(o)} stays open.` }));
}
/* the alerts for the advisor on this device — undismissed, on deals still on file */
function myAlerts() { return (Store.s.alerts || []).filter(a => !a.dismissed && a.advisor === Store.s.advisor && Store.deal(a.dealId)); }
/* the card's status line: Reserved outranks Working; nothing when neither */
function vehicleStatusHtml(d) {
  if (!d.stock || !dealOpen(d)) return "";
  const hold = vehicleHold(d.stock);
  if (hold) return `<div><span class="rp-vstatus rp-vstatus--reserved">Reserved by another deal · ${esc(hold.by)}</span></div>`;
  const other = workingDeals(d.stock, d.id).find(o => dealAdvisor(o) !== dealAdvisor(d));
  return other ? `<div><span class="rp-vstatus rp-vstatus--working">Also selected by ${esc(dealAdvisor(other))}</span></div>` : "";
}
/* the seed's contention example (SEED-DATA v025, screen 08): a later moment
   than the rest of the seed, so the demo enters it on purpose. Reset clears it. */
route("demo/vehicle-reserved", () => {
  const ex = RIDE_PRICE_DATA.contentionExample;
  const at = new Date(); const [h, m] = ex.time.split(":").map(Number); at.setHours(h, m, 0, 0);
  reserveVehicle(ex.stock, ex.by, at.toISOString());
  toast(`Vehicle reserved — ${ex.by} signed on ${ex.stock}`);
  redirect("#/deals");
});

route("vehicles/:id", ({ id }) => {
  const deal = id === "browse" ? null : Store.deal(id);
  if (id !== "browse" && !deal) return navigate("#/deals");
  renderChrome(deal ? "Vehicle Selection" : "Inventory", "", "");
  document.body.dataset.canvas = "kit";
  document.body.dataset.screen = "vehicles";
  /* vehicle selection on the kit (owner's package v025, r5): inside a visit
     it is a Task whose top bar carries the customer's full name and nothing
     else — no step, no status, no deal number (numbers exist only after
     F&I) — and Close returns to the visit; without a visit it is the
     Inventory destination. The frame is fixed and the list scrolls inside
     .rp-page; the whole card is the tap target; every secondary decision is
     the kit's sheet with one primary. Contention (§14) is never drawn here —
     not on a card, not in the details sheet. Routes, filter logic and the
     five next-step targets are unchanged. */

  const makes = [...new Set(RIDE_PRICE_DATA.inventory.map(v => v.make))];
  const bodies = [...new Set(RIDE_PRICE_DATA.inventory.map(v => v.body))];
  const cust = deal ? Store.customer(deal.customerId) : null;
  /* the browse state survives sheet opens but resets on route entry */
  const ui = { type: "All", make: "All", body: "All", maxPrice: null, sort: "hi", search: "", sheet: null };
  /* the sheet's own closes — scrim, Escape, the × — report back, so the
     next render does not raise the sheet again */
  const sheets = chSheetOpener("vsScrim", "vsSheet", () => { ui.sheet = null; });

  function filtered() {
    let list = RIDE_PRICE_DATA.inventory.slice();
    if (ui.type !== "All") list = list.filter(v => v.type === ui.type);
    if (ui.make !== "All") list = list.filter(v => v.make === ui.make);
    if (ui.body !== "All") list = list.filter(v => v.body === ui.body);
    if (ui.maxPrice) list = list.filter(v => v.selling <= ui.maxPrice);
    const q = ui.search.trim().toLowerCase();
    if (q) list = list.filter(v => [v.make, v.model, v.trim, v.stock, v.vin].join(" ").toLowerCase().includes(q));
    list.sort((a, b) => ui.sort === "hi" ? b.selling - a.selling : a.selling - b.selling);
    return list;
  }
  const filterCount = () => (ui.make !== "All" ? 1 : 0) + (ui.body !== "All" ? 1 : 0) + (ui.maxPrice ? 1 : 0);
  const clearAll = () => { ui.type = "All"; ui.make = "All"; ui.body = "All"; ui.maxPrice = null; ui.search = ""; };

  /* the five next steps — unchanged targets, the board's words */
  const JOURNEY = [
    { act: "test", icon: "car", t: "Test drive", d: "Start the customer test-drive flow" },
    { act: "trade", icon: "swap", t: "Trade appraisal", d: "Evaluate a trade and proof of ownership" },
    { act: "calc", icon: "dollar", t: "Calculate payment", d: "Open desking with this vehicle" },
    { act: "quote", icon: "page", t: "Quote", d: "Follow-up only during a visit" },
    { act: "savequote", icon: "check", t: "Save quote", d: "Save this structure for follow-up" }
  ];

  /* the app's vehicle images stay: the flat car on the vehicle's own tint */
  const tint = vehicleTint;
  const vName = (v) => `${v.year} ${v.make} ${v.model}`;
  const vMeta = (v) => `Stock ${v.stock} · ${v.miles.toLocaleString()} mi · ${v.ext} · ${v.drive}`;
  /* the kit's vehicle card: a button in the list — the whole card is the
     tap target, no "View vehicle details" line — and a plain block in the
     details sheet */
  const vehicleHtml = (v, inSheet) => {
    const body = `<div class="rp-vehicle__media" style="${tint(v)}"><span class="rp-vehicle__tag">${esc(v.type.toUpperCase())}</span>${mCarSvg(v, "rp-icon")}</div>
      <div class="rp-vehicle__body">
        <div class="rp-vehicle__name">${esc(vName(v))}</div>
        <div class="rp-vehicle__trim">${esc(v.trim)}</div>
        <div class="rp-vehicle__meta">${esc(vMeta(v))}</div>
        <div class="rp-vehicle__price"><strong>${money0(v.selling)}</strong>${v.msrp !== v.selling ? `<s>MSRP ${money0(v.msrp)}</s>` : ""}</div>
      </div>`;
    return inSheet ? `<div class="rp-vehicle rp-vehicle--sheet">${body}</div>`
      : `<button type="button" class="rp-vehicle" data-detail="${esc(v.stock)}" aria-label="${esc(vName(v))} details">${body}</button>`;
  };
  const choiceHtml = (v) => `<div class="rp-choice"><span class="rp-choice__thumb" style="${tint(v)}">${mCarSvg(v, "rp-icon")}</span><span><div class="rp-choice__title">${esc(vName(v) + " " + v.trim)}</div><div class="rp-choice__sub">${money0(v.selling)} · Stock ${esc(v.stock)} · on the deal</div></span></div>`;
  /* both cells are markup by contract — callers esc() their own values */
  const kvRow = (labelHtml, valueHtml) => `<div class="rp-kv__row"><span>${labelHtml}</span><span>${valueHtml}</span></div>`;

  function sheetHtml() {
    const sh = ui.sheet;
    if (sh.kind === "details") {
      const v = Store.vehicle(sh.stock);
      /* one primary, and only inside a visit — browsing has no deal to put
         the car on, so the sheet simply has no Choose */
      return `${chSheetHead("Vehicle details")}
        ${vehicleHtml(v, true)}
        <div class="rp-kv">${kvRow("MSRP", money0(v.msrp))}${kvRow("Selling price", money0(v.selling))}${v.includedOptions ? kvRow("Included options", money0(v.includedOptions)) : ""}</div>
        <div class="rp-kv">${kvRow("VIN", esc(v.vin))}${kvRow("Engine", esc(v.engine + " · " + v.mpg + " MPG"))}${kvRow("Interior", esc(v.int + " · " + v.miles.toLocaleString() + " mi"))}</div>
        ${deal ? `<button type="button" class="rp-primary" data-choose="${esc(v.stock)}">Choose this vehicle</button>` : ""}`;
    }
    if (sh.kind === "next") {
      const v = Store.vehicle(sh.stock);
      return `${chSheetHead("What’s next?")}${choiceHtml(v)}
        <div class="rp-group">${JOURNEY.map(j => `<button type="button" class="rp-row" data-act="${j.act}" data-stock="${esc(v.stock)}"><span class="rp-tile">${rpIconGlyph(j.icon)}</span><span class="rp-row__body"><span class="rp-row__title">${j.t}</span><span class="rp-row__sub">${j.d}</span></span><span class="rp-row__chevron"></span></button>`).join("")}</div>`;
    }
    if (sh.kind === "quote") {
      const v = Store.vehicle(sh.stock);
      return `${chSheetHead("Quote")}<p class="rp-sheet__sub">Quotes are sent after the visit, from the deal.</p>${choiceHtml(v)}
        <button type="button" class="rp-primary" data-act="savequote" data-stock="${esc(v.stock)}">Save quote for follow-up</button>
        <button type="button" class="rp-link" data-back-next="${esc(v.stock)}">Back to next steps</button>`;
    }
    /* filters: the same four controls, as the kit's chips and a field */
    const chip = (group, val, label) => `<button type="button" class="rp-chip${ui[group] === val ? " rp-chip--on" : ""}" data-opt="${esc(group)}" data-val="${esc(val)}">${esc(label)}</button>`;
    const n = filtered().length;
    return `${chSheetHead("Filters")}
      <div class="rp-section">Make</div><div class="rp-chips">${chip("make", "All", "All")}${makes.map(m => chip("make", m, m)).join("")}</div>
      <div class="rp-section">Body style</div><div class="rp-chips">${chip("body", "All", "All")}${bodies.map(b => chip("body", b, b)).join("")}</div>
      <div class="rp-field"><label class="rp-field__label" for="mMaxPrice">Max price</label><input class="rp-field__input" id="mMaxPrice" type="number" inputmode="numeric" step="1000" placeholder="No limit" value="${esc(ui.maxPrice || "")}"></div>
      <div class="rp-section">Sort</div><div class="rp-chips">${chip("sort", "hi", "Price: high to low")}${chip("sort", "lo", "Price: low to high")}</div>
      <div style="height:8px"></div>
      <button type="button" class="rp-primary" data-sheet-close>Show ${n} vehicle${n === 1 ? "" : "s"}</button>
      <button type="button" class="rp-link" id="mClearAll">Clear all</button>`;
  }

  function render() {
    const list = filtered();
    const fc = filterCount();
    const content = `
      <div class="rp-eyebrow">${deal ? "Vehicle selection" : "Inventory"}</div>
      <h1 class="rp-title">${deal ? "Choose a vehicle" : "Browse inventory"}</h1>
      <div class="rp-search">${rpGlyph("search")}<input class="rp-search__input" id="vsSearch" placeholder="Make, model, stock or VIN" value="${esc(ui.search)}" aria-label="Search inventory"></div>
      <div class="rp-chips rp-chips--rail" role="group" aria-label="Vehicle type">
        ${["All", "New", "Used", "CPO"].map(t => `<button type="button" class="rp-chip${ui.type === t ? " rp-chip--on" : ""}" data-type="${t}" aria-pressed="${ui.type === t}">${t}</button>`).join("")}
        <button type="button" class="rp-chip" id="vsFilters" aria-label="More filters">Filters${fc ? `<span class="rp-chip__count">${fc}</span>` : ""}</button>
      </div>
      <div class="rp-listhead"><div><div class="rp-section">Available vehicles</div><div class="rp-listhead__meta">${list.length} vehicle${list.length === 1 ? "" : "s"}</div></div>
        <button type="button" class="rp-sort" id="vsSort">Price: ${ui.sort === "hi" ? "high to low" : "low to high"}${rpGlyph("chevron-down")}</button></div>
      ${list.length ? list.map(v => vehicleHtml(v, false)).join("") : `<div class="rp-empty"><strong>No vehicles match</strong>Nothing in stock fits those filters.<div style="height:12px"></div><button type="button" class="rp-button-navy" id="vsClearEmpty">Clear all filters</button></div>`}`;
    const ids = { scrim: "vsScrim", sheet: "vsSheet" };
    if (!ui.sheet) sheets.close(); /* a sheet the last render left up takes its listeners with it */
    view().innerHTML = deal
      ? chShell({ template: "task", title: `${cust.first} ${cust.last}`, closeId: "vsClose" }, content, null, ids)
      : chShell({ template: "destination", active: "inventory" }, content, null, ids);
    wire();
    if (ui.sheet) sheets.open(sheetHtml(), wireSheet);
  }

  function wire() {
    /* Close returns to the visit — the discovery screen, whose next steps
       sent the advisor here */
    const close = $("#vsClose"); if (close) close.onclick = () => navigate(`#/discovery/${deal.id}`);
    const more = $("#dqMore"); if (more) more.onclick = () => chMoreSheet(sheets);
    chWireRole(sheets, render);
    const search = $("#vsSearch");
    search.oninput = () => {
      ui.search = search.value;
      /* re-render everything below without stealing the keyboard focus */
      const pos = search.selectionStart;
      render();
      const s2 = $("#vsSearch"); s2.focus(); s2.setSelectionRange(pos, pos);
    };
    $$(".rp-chip[data-type]").forEach(b => b.onclick = () => { ui.type = b.dataset.type; render(); });
    $("#vsFilters").onclick = () => { ui.sheet = { kind: "filters" }; render(); };
    $("#vsSort").onclick = () => { ui.sort = ui.sort === "hi" ? "lo" : "hi"; render(); };
    $$("[data-detail]").forEach(el => el.onclick = () => { ui.sheet = { kind: "details", stock: el.dataset.detail }; render(); });
    const clearEmpty = $("#vsClearEmpty");
    if (clearEmpty) clearEmpty.onclick = () => { clearAll(); render(); };
  }

  function wireSheet(sheet) {
    $$("[data-opt]", sheet).forEach(b => b.onclick = () => { ui[b.dataset.opt] = b.dataset.opt === "sort" ? b.dataset.val : (ui[b.dataset.opt] === b.dataset.val ? "All" : b.dataset.val); render(); });
    const mp = $("#mMaxPrice", sheet);
    if (mp) mp.onchange = () => { ui.maxPrice = parseFloat(mp.value) || null; render(); };
    const clearAllBtn = $("#mClearAll", sheet);
    if (clearAllBtn) clearAllBtn.onclick = () => { clearAll(); render(); };

    $$("[data-choose]", sheet).forEach(b => b.onclick = () => {
      /* the deal keeps its own vehicle identity from the moment of attachment,
         so the queue's VIN survives an unstocked unit or a catalog change */
      const stock = b.dataset.choose;
      const vsel = Store.vehicle(stock);
      deal.stock = stock;
      /* the words too: the row and the search draw year/make/model from this
         snapshot once the catalog no longer holds the unit (review, #79) */
      deal.vehicle = vsel ? { vin: vsel.vin, stock: vsel.stock, year: vsel.year, make: vsel.make, model: vsel.model } : { vin: null, stock };
      /* contention (§14): the advisors already working this car are told;
         nobody is blocked, and nothing about it is drawn here */
      noteWorking(stock, deal);
      Store.save();
      ui.sheet = { kind: "next", stock };
      render();
    });
    const backNext = $("[data-back-next]", sheet);
    if (backNext) backNext.onclick = () => { ui.sheet = { kind: "next", stock: backNext.dataset.backNext }; render(); };

    $$("[data-act]", sheet).forEach(btn => btn.onclick = () => {
      const stock = btn.dataset.stock, act = btn.dataset.act;
      if (!deal) return;
      if (act === "quote") { ui.sheet = { kind: "quote", stock }; render(); return; }
      if (act === "test") { deal.stage = "testdrive"; Store.save(); navigate(`#/testdrive/${deal.id}`); }
      else if (act === "trade") navigate(`#/trade/${deal.id}`);
      else if (act === "calc") { deal.stage = deal.basePayment ? deal.stage : "desking"; Store.save(); navigate(`#/desk/${deal.id}`); }
      else if (act === "savequote") {
        const vv = Store.vehicle(stock);
        const r = RIDE_PRICE_CALC.calc(deal, vv);
        (deal.quotes = deal.quotes || []).push({
          at: new Date().toISOString(), stock, dealType: deal.dealType,
          summary: deal.dealType === "cash" ? r.totalDue : (deal.dealType === "onepay" ? r.onePayTotal : r.payment)
        });
        Store.save();
        toast(`Quote saved in Ride Price — structure emailed to ${Store.customer(deal.customerId).email} (demo)`);
        ui.sheet = { kind: "next", stock };
        render();
      }
    });
  }
  render();
});

/* ============================================================
   VIEW: Test Drive Agreement V2 — owner's replication package, 2026-09-01.

   The package's thesis: a short active-session workflow, never a legal
   form squeezed onto a phone. The visible path is Ready → Review & sign →
   Drive in progress → End drive → Complete, and the advisor makes three
   decisions in it: sign, end, and the one context-aware next step.

   Nothing about identity is asked twice. The license is READ from the
   customer profile (the source of truth since the license-scan decision in
   architecture.md); when it is missing, front-only or expired the screen
   opens the canonical Scan License flow in its test-drive mode and comes
   back — there is no test-drive license form and no second scanner.
   Additional drivers are resolved through the one Customer Resolver on a
   "driver" mission, never typed as "Name – license #".

   The per-deal signed record is unchanged: signing snapshots the license,
   insurance, drivers and mileage limit onto deal.testDrive exactly as the
   previous screen did, so the printable agreement and the jacket's
   auto-filed copy read the same fields they always read (a signed document
   never recomputes). Two fields are additive: `addlDriverIds` (the resolved
   drivers; `addlDriver` stays the frozen name string the printable prints)
   and `startedAt` / `endedAt` for the session clock. */
route("testdrive/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const v = Store.vehicle(deal.stock);
  /* a truthy stock is not a resolved vehicle (a catalog change, a hand-edited
     blob) — the same guard the Documents and print routes carry; everything
     below is built from the vehicle */
  if (!v) return redirect(`#/vehicles/${deal.id}`);
  const c = Store.customer(deal.customerId);
  const td = deal.testDrive = deal.testDrive || { done: false };
  const custName = `${c.first} ${c.last}`;
  const vehName = `${v.year} ${v.make} ${v.model}`;
  const LIMIT = td.miles || 20;
  const startOdo = td.startOdo != null ? td.startOdo : v.miles;

  /* the license as the profile holds it — three ways to be not ready, each
     named exactly (the package: "show the exact missing item") */
  function licenseState() {
    const lic = c.license;
    if (!lic || !lic.number) return { ok: false, meta: "No license on file", short: "No license on file" };
    if (c.onboard && c.onboard.secondSide === "pending") return { ok: false, meta: "Front received · back still needed", short: "License back pending" };
    /* "unexpired" is a claim about a date: no date, or one that does not
       parse, is not ready either (review find) */
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lic.expires || "");
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
    /* a calendar date that the Date constructor would quietly normalise
       ("2027-02-30" → March 2) is not a date on file either (review find) */
    const real = d && !isNaN(d.getTime()) && d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3];
    if (!real) return { ok: false, meta: "Expiration date not on file", short: "License expiry missing" };
    const t = new Date(); t.setHours(0, 0, 0, 0);
    if (d < t) return { ok: false, meta: `Expired ${dateUS(lic.expires)}`, short: "License expired" };
    const last4 = String(lic.number).replace(/\W/g, "").slice(-4);
    return { ok: true, meta: `${lic.state || "—"} · ending ${last4} · expires ${dateUS(lic.expires)}` };
  }
  const drivers = () => (td.addlDriverIds || []).map(cid => Store.customer(cid)).filter(Boolean);
  const driverNames = () => [custName].concat(drivers().map(d => `${d.first} ${d.last}`));

  const stateOf = () => td.done ? "done" : td.started ? "active" : licenseState().ok ? "ready" : "attention";

  const tdTop = () => `<div class="dv-top">
    <button type="button" class="dv-back" id="tdBack" aria-label="Back">‹</button>
    <div class="dv-brand"><span>Ride</span> PRICE</div>
    <span class="dv-spacer"></span>
    <button type="button" class="dv-role" id="tdRole">${isTeamLead() ? "Team Lead" : "Advisor"}</button>
  </div>`;
  /* counted on every render: signing files the agreement, and the badge
     must say so on the very next paint (review find) */
  const contextRow = () => { const jkc = jacketCounts(deal); return `<div class="dv-context">
    <button type="button" class="dv-ctxmain" id="tdDeal">
      <strong>${esc(custName)}</strong>
      <span>&middot; ${esc(vehName)}</span>
    </button>
    <a class="dv-jacket" href="#/jacket/${esc(deal.id)}" aria-label="Deal Jacket — ${esc(jacketChipText(deal))} required documents complete${jkc.missing ? `, ${esc(jkc.missing)} still outstanding` : ""}">
      <span class="dv-jacket__box">${rpIcon("folder")}<b>${esc(jacketChipText(deal))}</b></span>
    </a>
  </div>`; };

  /* one row anatomy for every operational fact: icon · title · meta · a
     status pill or a text action on the right */
  const row = (icon, title, meta, right) => `<div class="td-row">
    <span class="td-rowicon">${rpIcon(icon)}</span>
    <div class="td-rowmain"><div class="td-rowtitle">${title}</div><div class="td-rowmeta">${meta}</div></div>
    ${right}
  </div>`;
  const status = (kind, label) => `<span class="td-status td-status--${kind}">${label}</span>`;

  let sheetKey = null;
  const closeSheet = () => {
    const sc = $("#tdScrim"); if (sc) sc.classList.remove("show");
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
  };
  let timer = null;
  const stopTimer = () => { if (timer) { clearInterval(timer); timer = null; } };
  const teardown = () => { closeSheet(); stopTimer(); window.removeEventListener("hashchange", teardown); };
  window.addEventListener("hashchange", teardown);
  const openSheet = (html, onMount) => {
    const sh = $("#tdSheet"); if (!sh) return;
    sh.innerHTML = `<div class="m-handle"></div>${html}`;
    $("#tdScrim").classList.add("show");
    if (sheetKey) document.removeEventListener("keydown", sheetKey, true);
    sheetKey = (e) => { if (e.key === "Escape") { e.preventDefault(); closeSheet(); } };
    document.addEventListener("keydown", sheetKey, true);
    $$("[data-sheet-close]", sh).forEach(b => b.onclick = closeSheet);
    if (onMount) onMount(sh);
  };
  const sheetHead = (title, sub) => `<div class="m-sheettop"><h2 class="tv-sheettitle td-sheettitle">${title}</h2>
    <button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>
    ${sub ? `<p class="td-sheetsub">${sub}</p>` : ""}`;

  /* ---- the states ---- */
  function readyBody() {
    const lic = licenseState();
    return `<section class="tv-card td-list">
      ${row("idcard", "Driver&rsquo;s license", esc(lic.meta), status("ok", "Ready"))}
      ${row("umbrella", "Insurance company", td.insurance ? esc(td.insurance) : "Not on file",
        `<button type="button" class="td-link" id="tdInsurance">${td.insurance ? "Edit" : "Add"}</button>`)}
      ${row("user", "Drivers", esc(driverNames().join(", ")),
        `<button type="button" class="td-link" id="tdAddDriver">Add driver</button>`)}
    </section>
    <section class="tv-card">
      <h2 class="td-cardtitle">Test drive terms</h2>
      <p class="td-cardsub">Key terms are summarized here. The full agreement is shown before signing.</p>
      <div class="td-summary">
        <span class="k">Vehicle</span><span class="v">${esc(vehName)}</span>
        <span class="k">Maximum distance</span><span class="v">${esc(LIMIT)} miles</span>
        <span class="k">Return condition</span><span class="v">Return at agreed time</span>
        <span class="k">Agreement storage</span><span class="v">Deal Jacket</span>
      </div>
    </section>`;
  }

  function attentionBody() {
    const lic = licenseState();
    return `<section class="tv-card td-list">
      ${row("idcard", "Driver&rsquo;s license", esc(lic.meta), status("warn", "Incomplete"))}
    </section>
    <div class="td-callout"><strong>Required before the drive.</strong> A complete, unexpired license on the customer profile. Nothing else about the customer is asked again.</div>`;
  }

  function activeBody() {
    return `<section class="td-session">
      <span class="td-live"><i></i>Out on the road</span>
      <div class="td-art">${mCarSvg(v)}</div>
      <div class="td-herovehicle">${esc(`${vehName} ${v.trim || ""}`.trim())}</div>
      <div class="td-meta">Stock ${esc(v.stock)} &middot; agreement signed</div>
      <div class="td-timer" id="tdTimer" aria-label="Elapsed">${esc(elapsed())}</div>
      <div class="td-meta">Started odometer ${esc(startOdo.toLocaleString())} mi &middot; up to ${esc(LIMIT)} miles</div>
    </section>
    <div class="td-callout"><strong>Deal Jacket updated automatically.</strong> The signed Test Drive Agreement is already attached; there is nothing else to file.</div>`;
  }

  function doneBody() {
    const end = td.completedMiles || 0;
    /* the reading is recorded whatever it is — refusing it would force a
       false number onto a signed record; a drive past the authorized
       distance is flagged here instead (the terms already make the customer
       answerable for it) */
    const driven = Math.max(0, end - startOdo);
    const over = driven > LIMIT;
    const hasTrade = !!(deal.trade && deal.trade.has);
    return `<div class="td-doneicon">${rpIcon("check")}</div>
    <div class="td-center">
      <div class="td-herovehicle">${esc(custName)} is back</div>
      <div class="td-meta">${esc(vehName)} &middot; ${esc(startOdo.toLocaleString())} &rarr; ${esc(end.toLocaleString())} mi</div>
    </div>
    <section class="tv-card td-list td-list--done">
      ${(() => {
        /* the row states what the record can prove: an e-signature made
           here, a jacket receipt however it arrived, or neither — a drive
           recorded before this screen (the seed) was never e-signed and
           must not say it was (review find) */
        const filed = jacketState(deal, "testdrive");
        const title = td.signed ? "Agreement signed" : "Test drive recorded";
        const meta = filed ? (filed.how === "esign" ? "Stored in Deal Jacket" : "In the Deal Jacket") : "Agreement not in the Deal Jacket";
        return row("check", title, meta, filed ? status("ok", "Complete") : status("warn", "Not filed"));
      })()}
      ${row("wheel", "Return odometer", `${esc(end.toLocaleString())} mi &middot; ${esc(driven.toLocaleString())} driven${over ? `, over the ${esc(LIMIT)}-mile limit` : ""}`, over ? status("warn", "Over limit") : status("ok", "Recorded"))}
    </section>
    <section class="tv-card">
      <h2 class="td-cardtitle">Next step</h2>
      <p class="td-cardsub">${hasTrade ? "This deal has a trade to evaluate first." : "No trade on this deal — go straight to the payment."}</p>
      ${hasTrade
        ? `<a class="tv-primary" id="tdNext" href="#/trade/${esc(deal.id)}">Start trade evaluation</a>
           <a class="td-link td-link--wide" id="tdToDesk" href="#/desk/${esc(deal.id)}">Calculate payment instead</a>`
        : `<a class="tv-primary" id="tdNext" href="#/desk/${esc(deal.id)}">Calculate payment</a>
           <a class="td-link td-link--wide" id="tdTrade" href="#/trade/${esc(deal.id)}">Customer has a trade</a>`}
    </section>`;
  }

  function elapsed() {
    if (!td.startedAt) return "00:00";
    const s = Math.max(0, Math.floor((Date.now() - new Date(td.startedAt).getTime()) / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const two = (n) => String(n).padStart(2, "0");
    return h ? `${h}:${two(m)}:${two(sec)}` : `${two(m)}:${two(sec)}`;
  }

  function render() {
    const st = stateOf();
    renderChrome("Test Drive Agreement", "", "");
    document.body.dataset.canvas = "master";
    document.body.dataset.screen = "testdrive";
    stopTimer();

    /* a drive already in progress from before the clock existed: the session
       started when the agreement was signed; start counting from now rather
       than showing nothing */
    if (st === "active" && !td.startedAt) { td.startedAt = new Date().toISOString(); Store.save(); }

    const eyebrow = st === "active" ? "Active session" : "Test drive";
    const title = { ready: "Ready to test drive", attention: "License needs attention", active: "Test drive in progress", done: "Test drive complete" }[st];
    const body = { ready: readyBody, attention: attentionBody, active: activeBody, done: doneBody }[st]();
    const dock = st === "ready" ? `<div class="tv-dockmeta"><span>Next</span><b>Agreement review</b></div>
        <button type="button" class="tv-primary tv-dockgo" id="tdSign">Review &amp; sign</button>`
      : st === "attention" ? `<div class="tv-dockmeta"><span>Required before drive</span><b>${esc(licenseState().short)}</b></div>
        <button type="button" class="tv-primary tv-dockgo" id="tdFixLicense">Complete license</button>`
      : st === "active" ? `<div class="tv-dockmeta"><span>Session</span><b>Test drive in progress</b></div>
        <button type="button" class="tv-primary tv-dockgo" id="tdEnd">End drive</button>`
      : "";

    view().innerHTML = `
      <div class="m-app${dock ? "" : " td-nodock"}">
        ${tdTop()}
        <main class="tv-main">
          <div class="dv-eyebrow">${eyebrow}</div>
          <h1 class="dv-title">${title}</h1>
          ${contextRow()}
          ${body}
        </main>
        ${dock ? `<div class="tv-dock">${dock}</div>` : ""}
      </div>
      <div class="m-scrim" id="tdScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="tdSheet"></div></div>`;

    $("#tdBack").onclick = () => history.back();
    $("#tdRole").onclick = () => $("#hamburgerBtn").click();
    $("#tdDeal").onclick = dealSheet;
    const scrim = $("#tdScrim");
    scrim.onclick = (e) => { if (e.target === scrim) closeSheet(); };

    const ins = $("#tdInsurance"); if (ins) ins.onclick = insuranceSheet;
    const ad = $("#tdAddDriver"); if (ad) ad.onclick = driverSheet;
    const sg = $("#tdSign"); if (sg) sg.onclick = signSheet;
    const fx = $("#tdFixLicense"); if (fx) fx.onclick = completeLicense;
    const en = $("#tdEnd"); if (en) en.onclick = endSheet;
    /* the navigating links advance the stage, the #toDesk pattern */
    const advance = () => { if (["vehicle", "testdrive"].includes(deal.stage)) { deal.stage = "desking"; Store.save(); } };
    ["tdToDesk", "tdNext"].forEach(bid => {
      const el = $("#" + bid);
      if (el && /#\/desk\//.test(el.getAttribute("href"))) el.onclick = advance;
    });

    if (st === "active") {
      /* the clock dies with its element: a render or a navigation that
         removes #tdTimer stops the interval rather than ticking a detached
         node forever (review-lessons pattern 5) */
      timer = setInterval(() => {
        const el = $("#tdTimer");
        if (!el) return stopTimer();
        el.textContent = elapsed();
      }, 1000);
    }
  }

  /* ---- exception: the canonical scan flow, then back here ---- */
  function completeLicense() {
    openScanFlow({
      mode: "testdrive", deal,
      onDone: (cust, p) => {
        /* the scan's test-drive mode writes the license onto the profile only
           when the card's name matches this customer; a mismatched card is
           reported and changes nothing — the drive cannot borrow someone
           else's license */
        const matched = !!(p && p.samePerson === true && cust && cust.license && p.license && cust.license.number === p.license.number);
        if (matched) {
          cust.onboard = Object.assign({}, cust.onboard, { licensePhotoAt: new Date().toISOString(), secondSide: "received" });
          Store.save();
        } else {
          toast("The card reads a different name — this customer's license was not changed");
        }
        if (location.hash === `#/testdrive/${deal.id}`) render();
      }
    });
  }

  /* ---- sheets ---- */
  function insuranceSheet() {
    openSheet(`${sheetHead("Insurance company", "One field, carried onto the agreement.")}
      <label class="tv-field"><span class="tv-label">Company</span>
        <input type="text" class="tv-input" id="tdInsInput" value="${esc(td.insurance || "")}" placeholder="Ask for the auto insurance company" autocomplete="off"></label>
      <div class="tv-sheetactions">
        <button type="button" class="tv-primary" id="tdInsSave">Save</button>
        <button type="button" class="tv-secondary" data-sheet-close>Cancel</button>
      </div>`, (sh) => {
      const inp = $("#tdInsInput", sh);
      inp.focus();
      const save = () => { td.insurance = inp.value.trim(); Store.save(); closeSheet(); render(); };
      $("#tdInsSave", sh).onclick = save;
      inp.onkeydown = (e) => { if (e.key === "Enter") save(); };
    });
  }

  /* three rows, three doors into the SAME resolver — a name and license
     number are never typed here */
  function driverSheet() {
    const added = drivers();
    const door = (icon, title, sub, open) => `<button type="button" class="td-row td-row--go" data-open="${open}">
      <span class="td-rowicon">${rpIcon(icon)}</span>
      <div class="td-rowmain"><div class="td-rowtitle">${title}</div><div class="td-rowmeta">${sub}</div></div>
      <span class="td-chev" aria-hidden="true">&rsaquo;</span>
    </button>`;
    openSheet(`${sheetHead("Add another driver", "Identify the driver through the Customer Resolver.")}
      <section class="tv-card td-list td-list--sheet">
        ${door("user", "Find existing customer", "Search by name, phone, email, or license.", "search")}
        ${door("idcard", "Scan physical license", "Scan, then confirm.", "scan")}
        ${door("upload", "Send secure upload link", "The customer uploads directly into Ride Price.", "sendlink")}
      </section>
      ${added.length ? `<div class="dv-seclab">Added drivers</div>${added.map(d => `<div class="td-row td-row--flat">
          <div class="td-rowmain"><div class="td-rowtitle">${esc(`${d.first} ${d.last}`)}</div><div class="td-rowmeta">Additional driver</div></div>
          <button type="button" class="td-link" data-remove="${esc(d.id)}">Remove</button></div>`).join("")}` : ""}`, (sh) => {
      $$("[data-open]", sh).forEach(b => b.onclick = () => {
        const open = b.dataset.open;
        resolverMission = { kind: "driver", dealId: deal.id, back: location.hash, open: open === "search" ? null : open };
        closeSheet(); navigate("#/customers");
      });
      $$("[data-remove]", sh).forEach(b => b.onclick = () => {
        td.addlDriverIds = (td.addlDriverIds || []).filter(x => x !== b.dataset.remove);
        Store.save(); render(); driverSheet();
      });
    });
  }

  function signSheet() {
    openSheet(`${sheetHead("Review &amp; sign", "One agreement, one signature, then the drive starts.")}
      <div class="td-terms"><strong>Test Drive Agreement</strong>
        <p>I have requested that the Dealership permit me to test drive the above-described vehicle for demonstration purposes, subject to the following terms and conditions:</p>
        <ol>${RIDE_PRICE_DATA.testDriveTerms.map(t => `<li>${esc(t)}</li>`).join("")}</ol>
        <a class="td-link" href="#/print/${esc(deal.id)}/testdrive">View full agreement</a>
      </div>
      <label class="td-check"><input type="checkbox" id="tdEsign" ${td.authSigned ? "checked" : ""}>
        <span>I agree to use an electronic signature for this Test Drive Agreement.</span></label>
      <div class="tv-label">Customer signature</div>
      <div class="td-sig"><span class="td-sigline">${esc(custName)}</span></div>
      <div class="tv-sheetactions">
        <button type="button" class="tv-primary" id="tdSignGo">Sign &amp; start test drive</button>
      </div>`, (sh) => {
      /* the authorization is a recorded answer, not a gate that evaporates:
         it persists the moment it is given (review-lessons pattern 2) */
      $("#tdEsign", sh).onchange = (e) => { td.authSigned = e.target.checked; Store.save(); };
      $("#tdSignGo", sh).onclick = () => {
        if (!$("#tdEsign", sh).checked) { toast("Confirm the electronic signature authorization first"); return; }
        const lic = licenseState();
        if (!lic.ok) { closeSheet(); render(); return toast("The license needs attention before the drive"); }
        const now = new Date().toISOString();
        Object.assign(td, {
          authSigned: true, signed: true, sigName: custName, signedAt: now,
          license: c.license.number, issuingState: c.license.state || "", expDate: c.license.expires || "",
          insurance: td.insurance || "", addlDriver: drivers().map(d => `${d.first} ${d.last}`).join(", "),
          miles: LIMIT, startOdo, started: true, startedAt: now
        });
        Store.save();
        /* the package's rule: the signed agreement is stored in the Deal
           Jacket by the act of signing — with its own "how", so the jacket
           still says how it knows (review find: jacketDocs REQUIRED the
           document after signing while nothing had filed it, so the screen
           said "attached" while the jacket counted it missing) */
        jacketReceive(deal, "testdrive", "esign");
        closeSheet();
        render();
      };
    });
  }

  function endSheet() {
    openSheet(`${sheetHead("End test drive", "One final odometer reading closes the session.")}
      <label class="tv-field"><span class="tv-label">Current odometer reading</span>
        <input type="number" class="tv-input" id="tdEndOdo" inputmode="numeric" min="${esc(startOdo)}" value="${esc(startOdo + LIMIT)}"></label>
      <div class="tv-sheetactions">
        <button type="button" class="tv-primary" id="tdComplete">Complete test drive</button>
      </div>`, (sh) => {
      $("#tdComplete", sh).onclick = () => {
        const inp = $("#tdEndOdo", sh);
        const n = parseInt(inp.value, 10);
        if (isNaN(n) || n < startOdo) {
          markMissing(sh, [{ el: inp, msg: `At least the starting ${startOdo.toLocaleString()} mi` }]);
          return toast("Enter the odometer reading");
        }
        td.completedMiles = n; td.done = true; td.endedAt = new Date().toISOString();
        Store.save();
        closeSheet();
        render();
      };
    });
  }

  /* the context row opens deal details — the one place Deal # belongs */
  function dealSheet() {
    openSheet(`
      <h2 class="tv-sheettitle">Deal details</h2>
      <div class="tv-choice"><div class="tv-detlab">Customer</div><div class="tv-detval">${esc(custName)}</div></div>
      <div class="tv-choice"><div class="tv-detlab">Vehicle</div><div class="tv-detval">${esc(`${vehName} ${v.trim || ""}`.trim())} &middot; stock ${esc(v.stock)}</div></div>
      <div class="tv-choice"><div class="tv-detlab">Deal</div><div class="tv-detval">#${esc(deal.dealNo || "—")} &middot; ${esc((STAGES[deal.stage] || {}).label || deal.stage)}</div></div>
      <div class="tv-sheetactions"><button type="button" class="tv-secondary" data-sheet-close>Done</button></div>`);
  }

  render();
});

/* ============================================================
   VIEW: Trade-In Evaluation V2 — owner's replication package, 2026-09-01.

   The package's architecture rule: the appraisal and the full ownership
   questionnaire are never two long forms on one page. The visible happy
   path is Trade details → Value → Ownership review → Continue. Ownership
   questions live in a bottom sheet and are CONDITIONAL — only follow-ups
   made relevant by previous answers appear. Unanswered stays unrecorded
   (never silently No), gaps queue for Team Lead sign-off without blocking
   the advisor, and a stale payoff is its own named gap.

   The data model is untouched: ownOf / tradeOwnershipGaps /
   requiredTradeForms / payoffExpired and the evaluation formula are the
   same ones the previous screen wrote. "Not sure" records null — a
   deliberate unknown; tradeOwnershipGaps already reads anything that is
   not true/false as "not recorded", so both never-asked (undefined) and
   not-sure (null) surface to the Team Lead in the same words.

   Two follow-ups the golden does not draw — lien release when the vehicle
   is paid off, and trade authorization when the person trading is not the
   titled owner — stay, under the package's own conditional rule: they were
   recorded compliance answers before this screen, and dropping them would
   regress sign-off. The context row and header reuse the dv- shell from
   Discovery V2: same component, one CSS definition. */
const ownOf = (deal) => (deal.trade && deal.trade.ownership) || {};

function payoffExpired(iso) {
  if (!iso) return false;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  return !isNaN(d.getTime()) && d < t;
}

function tradeOwnershipGaps(deal) {
  if (!deal.trade || !deal.trade.has) return [];
  const o = ownOf(deal), gaps = [];
  /* every question is tri-state, follow-ups included: "confirmed absent" and
     "never asked" are different statements to put in front of a manager */
  if (o.titleInHand === false) {
    if (o.duplicateStarted === true) gaps.push("Trade title not in hand — duplicate title process started, still outstanding");
    else if (o.duplicateStarted === false) gaps.push("Trade title not in hand, and the duplicate title process has not been started");
    else gaps.push("Trade title not in hand — not recorded whether the duplicate title process has been started");
  } else if (o.titleInHand !== true) {
    gaps.push("Not recorded whether the trade title is in hand");
  }
  if (o.lienOnTitle === true) {
    if (o.paidOff === true) {
      if (o.lienReleaseReceived === false) gaps.push("Lien on the title and the vehicle is paid off — no lien release on file");
      else if (o.lienReleaseReceived !== true) gaps.push("Lien on the title and the vehicle is paid off — not recorded whether a lien release was received");
    } else if (o.paidOff === false) {
      if (o.payoffReceived === false) gaps.push("Lien on the title and the vehicle is not paid off — no valid payoff on file");
      else if (o.payoffReceived !== true) gaps.push("Lien on the title and the vehicle is not paid off — not recorded whether a valid payoff was received");
      else if (!o.payoffGoodThrough) gaps.push("Payoff on file with no good-through date");
      else if (payoffExpired(o.payoffGoodThrough)) gaps.push("Payoff expired " + dateUS(o.payoffGoodThrough) + " — a fresh payoff is needed");
    } else {
      gaps.push("Lien on the title — not recorded whether the vehicle is paid off");
    }
  } else if (o.lienOnTitle !== false) {
    gaps.push("Not recorded whether the title shows a lienholder");
  }
  if (o.isTitledOwner === false) {
    if (o.authorizationReceived === false) gaps.push("The person trading is not the titled owner — no trade authorization or power of attorney on file");
    else if (o.authorizationReceived !== true) gaps.push("The person trading is not the titled owner — not recorded whether trade authorization or power of attorney was received");
  } else if (o.isTitledOwner !== true) {
    gaps.push("Not recorded whether the person trading is the titled owner");
  }
  return gaps;
}

/* the answers above make these deal forms mandatory */
function requiredTradeForms(deal) {
  if (!deal.trade || !deal.trade.has) return [];
  const o = ownOf(deal), req = [];
  if (o.titleInHand === false) req.push("title");
  if (o.lienOnTitle === true && o.paidOff === true) req.push("lienrel");
  if (o.isTitledOwner === false) req.push("poa");
  return req;
}
route("trade/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const c = Store.customer(deal.customerId);
  const v = deal.stock ? Store.vehicle(deal.stock) : null;
  const jkc = jacketCounts(deal);
  const custName = c ? `${c.first} ${c.last}` : "—";

  const tvTop = () => `<div class="dv-top">
    <button type="button" class="dv-back" id="tvBack" aria-label="Back">‹</button>
    <div class="dv-brand"><span>Ride</span> PRICE</div>
    <span class="dv-spacer"></span>
    <button type="button" class="dv-role" id="tvRole">${isTeamLead() ? "Team Lead" : "Advisor"}</button>
  </div>`;

  /* the compact Deal Context Bar. Vehicle selection has already occurred on
     this route, so the selected purchase vehicle may appear (package rule);
     without one the stage label stands in, the Discovery pattern. */
  const contextRow = () => `<div class="dv-context">
    <button type="button" class="dv-ctxmain" id="tvDeal">
      <strong>${esc(custName)}</strong>
      <span>&middot; ${v ? esc(`${v.year} ${v.make} ${v.model}`) : "Trade-in"}</span>
    </button>
    <a class="dv-jacket" href="#/jacket/${esc(deal.id)}" aria-label="Deal Jacket — ${esc(jacketChipText(deal))} required documents complete${jkc.missing ? `, ${esc(jkc.missing)} still outstanding` : ""}">
      <span class="dv-jacket__box">${rpIcon("folder")}<b>${esc(jacketChipText(deal))}</b></span>
    </a>
  </div>`;

  let sheetKey = null;
  /* the payoff date saves on change, but Escape, a scrim tap or Close can
     land before the field ever blurs — flush it on every close path so the
     autosave claim is true for the one field that is not a button */
  const flushDate = () => {
    const g = $("#oGood"); if (!g) return;
    const o = deal.trade.ownership; if (!o) return;
    o.payoffGoodThrough = g.value.trim() ? dateISO(g.value.trim()) : "";
    Store.save();
  };
  const closeSheet = () => {
    flushDate();
    const sc = $("#tvScrim"); if (sc) sc.classList.remove("show");
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
  };
  const teardown = () => { closeSheet(); window.removeEventListener("hashchange", teardown); };
  window.addEventListener("hashchange", teardown);
  const openSheet = (html, onMount) => {
    const sh = $("#tvSheet"); if (!sh) return;
    sh.innerHTML = `<div class="m-handle"></div>${html}`;
    $("#tvScrim").classList.add("show");
    if (sheetKey) document.removeEventListener("keydown", sheetKey, true);
    sheetKey = (e) => { if (e.key === "Escape") { e.preventDefault(); closeSheet(); } };
    document.addEventListener("keydown", sheetKey, true);
    $$("[data-sheet-close]", sh).forEach(b => b.onclick = closeSheet);
    if (onMount) onMount(sh);
  };

  /* the questions currently RELEVANT and unanswered — what the value card
     counts. Distinct from tradeOwnershipGaps, which speaks manager language
     about the same facts; both derive from one ownership object. */
  function openQuestions() {
    const o = ownOf(deal); let n = 0;
    const un = (x) => x !== true && x !== false;
    if (un(o.titleInHand)) n++;
    if (o.titleInHand === false && un(o.duplicateStarted)) n++;
    if (un(o.lienOnTitle)) n++;
    if (o.lienOnTitle === true) {
      if (un(o.paidOff)) n++;
      if (o.paidOff === true && un(o.lienReleaseReceived)) n++;
      if (o.paidOff === false && un(o.payoffReceived)) n++;
    }
    if (un(o.isTitledOwner)) n++;
    if (o.isTitledOwner === false && un(o.authorizationReceived)) n++;
    return n;
  }

  const heroCard = () => {
    const equity = (deal.trade.value || 0) - (deal.trade.payoff || 0);
    return `<div class="tv-hero">
      <span class="tv-hero__lab">Evaluated trade value</span>
      <div class="tv-hero__amt">${esc(money0(deal.trade.value || 0))}</div>
      <span class="tv-hero__sub">Payoff ${esc(money0(deal.trade.payoff || 0))} &middot; ${equity >= 0 ? "positive" : "negative"} equity ${esc(money0(Math.abs(equity)))}</span>
    </div>`;
  };

  /* the model year, READ rather than invented. The advisor types it once, in
     "Vehicle (year make model)" — this reads it back out of that same string
     so the number box under the description cannot contradict the header
     above it. Absent stays absent: with no year to read, the box renders
     EMPTY and its placeholder states the SHAPE rather than standing in for a
     value (2026-09-09), the `#tVin` rule ("an absent VIN renders as an empty
     field, not an invented value"). The window is the input's own min/max, so
     a derived year is always a value that box would accept; a year the
     advisor TYPED is shown back verbatim, in range or not, because it is
     theirs — and then refused by the evaluation rather than repaired, which
     is runEval's half of the same rule.

     The window ends at the app's OWN present, which the appraisal states once
     here rather than three times: the depreciation line below counts back from
     `APPRAISAL_YEAR`, so a window that ran ahead of it — a rolling
     `getFullYear() + 1`, say — would let the form derive a model year the
     formula then prices ABOVE a new car (2027 against a 2026 epoch adds a
     year's depreciation instead of removing one). One constant, and the two
     move together whenever the demo's present is moved on. */
  const APPRAISAL_YEAR = 2026;
  /* the two ends of the window are NOT symmetric, and deriving one from the
     other would invent a relationship that does not exist.

     The TOP is the app's own present because the formula counts back from it:
     a year above `APPRAISAL_YEAR` adds a year's depreciation instead of
     removing one. That end MUST track the epoch, and the note above says why.

     The BOTTOM is 1981, the first model year for which a 17-character VIN in
     a fixed format was required (NHTSA's rule at 49 CFR Part 565; before it,
     VINs ran anywhere from about 5 to 13 characters and no two manufacturers
     agreed). It is chosen because it is a property of THIS FORM rather than a
     guess about what a dealership takes in trade: `#tVin` below is
     `maxlength="17"`, its placeholder reads "17 characters", and `#tVinHint`
     counts "(n of 17)" as the advisor types. A vehicle older than the standard
     has no identifier this screen is shaped to hold. Stated at its real
     strength and no further: the VIN is never REQUIRED here and never checked,
     so a 1975 truck is not impossible to record, it is outside what the screen
     says a vehicle looks like — a stated assumption, not a hard wall.

     What the bottom is NOT for: pricing old cars accurately. It cannot do
     that and does not try. `base` below floors at $1,500, and with the
     odometer at zero everything at or below **2012** already reaches that
     floor — every year from 1981 to 2012 appraises at the same $1,500 x the
     condition factor. That floor is there to price a genuinely old car, and
     it is NOT a typo check — it cannot be one, because it cannot tell a 1985
     from a "1200" or a "1015" slipped in for 2015: all three land on $1,500
     and print a confident beater nobody appraised. Catching the typo is THIS
     WINDOW's work, and the window is the only thing that does it. The floor
     is what makes the window necessary, never a stand-in for it. `runEval`
     states the same division where it refuses the year.

     Rejected, and why:
     - **1998** (what this branch shipped on 2026-09-09) was arbitrary — no
       reader could check it — and it cost a real capability: `runEval` is the
       only thing that APPRAISES, the only path that turns this form into a
       `trade.value`, so refusing the year refused the whole trade, and a
       twenty-year-old car a dealership genuinely does take could not be
       recorded at all. The deal then printed as having no trade. (Not the
       only WRITER of that key, which would be false: `seedDeal` hand-authors
       the demo's value and payoff as a literal pair. Nothing hand-authors the
       advisor's.)
     - **1900, or any round number.** Nothing distinguishes it, so it drifts
       the moment someone edits it, and it buys no capability at all: there is
       no vehicle between 1900 and 1980 this form can identify. It only widens
       the band a typo passes through by eighty years.
     - **A sliding floor derived from the epoch** (`APPRAISAL_YEAR - 45`). The
       arithmetic hides the arbitrariness rather than removing it — 45 is as
       unarguable as 1998 was — and it makes the boundary move under records
       that already exist: the same 1981 trade appraises today and is refused
       once the demo's present is moved on, without anything about the vehicle
       having changed. 1981 is 1981 permanently.

     One more disagreement, deliberately left standing: `descYear`'s regex
     matches any `19xx`/`20xx`, so its floor is 1900 and this window's is 1981.
     They are different KINDS of test — the regex asks what a year-shaped token
     looks like, the window asks which ones this screen will price — and
     `descYear` composes them, returning null for a "1975 Bronco". The
     evaluation then ASKS for the year rather than deriving one, and refuses it
     if the advisor types 1975. Widening the regex to match three digits, or
     narrowing it to start at 1981, would put the boundary in two places. */
  const YEAR_MIN = 1981, YEAR_MAX = APPRAISAL_YEAR;
  /* one predicate, because two paths now ask it: the derivation below, which
     drops a year it cannot price, and runEval, which refuses one. A membership
     test rather than the same thing written twice as its own negation — a
     rewritten window that reaches only one of them is the failure this
     closes. */
  const inWindow = (y) => y >= YEAR_MIN && y <= YEAR_MAX;
  const descYear = (desc) => {
    /* anchored to the FRONT of the string, because the label above the box
       asks for "year make model" and the year is therefore the first word. A
       year-shaped token anywhere else belongs to a NAME: a BMW 2002 is a
       coupe built through 1976, and reading the model year off the model name
       appraises a fifty-year-old car as this year's. A description written the
       other way round ("Accord 2015") derives nothing and the evaluation asks
       for the year instead — this screen may decline to read a year, but it
       may never read the wrong one. */
    const m = String(desc || "").match(/^\s*((?:19|20)\d{2})\b/);
    const y = m ? +m[1] : 0;
    return inWindow(y) ? y : null;
  };

  /* a field renders EMPTY only when it is genuinely absent. Distinct from
     falsy: a recorded 0 — a paid-off trade, an odometer that really reads 0 —
     is somebody's answer and has to show as 0, not as a box waiting to be
     filled. All three number boxes go through it now. The payoff was the last
     one still printing `fld("payoff") || 0`, which put a black 0 in front of
     the advisor on a trade nobody had been asked about — "this trade is paid
     off", said by a screen with no basis for it (2026-09-09). Rejected:
     dropping the seeded zero and keeping the `|| 0`, because
     `String(undefined || 0)` is "0" as well — that box could not render empty
     whatever the store held. */
  const shown = (key) => { const v = fld(key); return v == null || v === "" ? "" : v; };

  /* the Model year box carries a year somebody RECORDED, or the one this
     screen reads out of the description on their behalf — and only the second
     kind may be moved when the description changes. Once the four digits are
     in the box the two are the same characters, so the provenance is written
     onto the box itself as `data-derived`: the element is the only thing that
     knows, a second painter would carry its own, and nothing rests on an
     invariant held by convention across the three places that read it.
     A stored year that says exactly what the description says counts as
     derived too, and that clause is what makes a blob written before
     2026-09-09 — when a derived year WAS persisted — follow a corrected
     description like every other. No load() migration, no hoisting this
     route's window out to module scope, and the stale record clears itself
     the next time the trade is evaluated. It heals such a blob only where the
     anchored `descYear` reproduces the stored number, which by construction
     leaves out the descriptions the anchoring was introduced to stop reading:
     a blob holding 2002 off "BMW 2002 tii" no longer derives anything, so its
     2002 fails the comparison and is carried as a record. That is the right
     way to fail — nothing now distinguishes it from a 2002 somebody typed,
     and treating an unreadable stored year as the advisor's own is the safe
     direction; the alternative is a screen quietly discarding a number it
     cannot account for. Its cost is that a year the advisor
     typed which AGREES with the description is treated as the screen's own:
     undetectable in principle, and the defensible half, because the
     description is the sentence they are looking at and their number agrees
     with it. Re-deriving at capture time cannot stand in for any of this —
     the description is precisely what has just been edited, so the comparison
     would always answer "different, therefore typed".
     Tested `=== ""`, deliberately not for truthiness: `shown` exists to
     separate an ABSENT answer from a falsy one, and a `||` here would hand a
     recorded 0 straight back to the derivation it was written to outrank. */
  const yearBoxAttrs = () => {
    const rec = shown("year"), der = String(descYear(fld("desc")) || "");
    return rec === "" || String(rec) === der
      ? `value="${esc(der)}" data-derived="${esc(der)}"`
      : `value="${esc(rec)}"`;
  };
  /* the model year AS A RECORD: the box, but only where it has been moved off
     what the screen painted there — including emptied, which hands the
     question back to the description. `data-derived` is absent on a box
     painted from a record, and `undefined` never equals a string, so such a
     box always reads as somebody's answer. Falls back to the store when the
     form is not mounted; no caller reaches it in that state, and none should. */
  const yearRecorded = () => {
    const el = $("#tYear");
    return el ? (el.value === el.dataset.derived ? "" : el.value) : shown("year");
  };

  /* the ghost text in an empty box teaches a SHAPE or names a SOURCE, never a
     vehicle (2026-09-09). Four boxes here still advertised the retired
     Tucson — `2018 Hyundai Tucson`, `KM8TRAININGSAMP06`, `2018`, `60000` —
     the record the RAV4 rewrite at load() retired, whispered back in grey
     under a header reading 2016 Toyota RAV4. (The VIN migration above MINTS
     that Tucson VIN on purpose, so the rewrite below it can recognise a
     pre-VIN blob: it is a waypoint the record passes through, never a value
     this form should offer.) Echoing the deal's OWN values instead was the
     other candidate and is worse than a wrong one: a grey 2016 under a 2016
     header is indistinguishable from a filled box at a glance, so it walks
     the advisor past a field nobody has answered — the `#tVin` rule beaten by
     styling rather than by markup. So `YYYY`, the year half of the
     `MM/DD/YYYY` mask the date boxes already spell, because a model year gets
     written '16 on paper; `17 characters`, the one thing the VIN label does
     not say, lowercase and spaced so it can never read as a scanned VIN;
     `Odometer` where there is no shape to teach, naming where the number is
     read from, as `No limit` on Max price and the test drive's "Ask for the
     auto insurance company" already do. The credit application's numeric
     boxes do carry example figures, but those invent a generic amount rather
     than one specific vehicle's odometer, which is the whole distinction.
     Vehicle keeps no ghost at all — its label already reads "year make
     model", so one could only repeat it or name a car that needs retiring the
     next time the prop changes. */
  const formCard = () => `<section class="tv-card">
    <h2 class="tv-cardtitle">${esc(fld("desc") || "Trade vehicle")}</h2>
    ${fld("desc") ? `<div class="tv-cardsub">Trade vehicle</div>` : ""}
    <label class="tv-field"><span class="tv-label">Vehicle (year make model)</span>
      <input type="text" class="tv-input" id="tDesc" value="${esc(fld("desc") || "")}"></label>
    <label class="tv-field"><span class="tv-label">VIN <span class="tv-labnote" id="tVinHint"></span></span>
      <input type="text" class="tv-input" id="tVin" value="${esc(fld("vin") || "")}" placeholder="17 characters" maxlength="17" autocapitalize="characters" autocomplete="off" spellcheck="false"></label>
    <div class="tv-grid2">
      <label class="tv-field"><span class="tv-label">Model year</span>
        <input type="number" class="tv-input" id="tYear" ${yearBoxAttrs()} placeholder="YYYY" min="${esc(YEAR_MIN)}" max="${esc(YEAR_MAX)}"></label>
      <label class="tv-field"><span class="tv-label">Mileage</span>
        <input type="number" class="tv-input" id="tMiles" value="${esc(shown("miles"))}" placeholder="Odometer" min="0"></label>
    </div>
    <label class="tv-field"><span class="tv-label">Payoff amount (if financed)</span>
      <input type="number" class="tv-input" id="tPayoff" value="${esc(shown("payoff"))}" step="100" min="0"></label>
    <div class="tv-field"><span class="tv-label">Condition</span>
      <div class="tv-seg" id="tCond">${["Excellent", "Good", "Fair", "Rough"].map(x =>
        `<button type="button" data-cond="${x}" class="${(fld("condition") || "Good") === x ? "on" : ""}">${x}</button>`).join("")}</div>
    </div>
    ${deal.trade.has && deal.trade.value && !editing ? heroCard()
      : `<button type="button" class="tv-primary" id="evalBtn">Run evaluation</button>`}
  </section>`;

  /* which of the three page states this deal is in. `editing` reopens the
     appraisal form from the result state — the golden has no way back into
     the appraisal once reviewed, which would strand a mis-keyed mileage. */
  let editing = false;
  /* the in-flight appraisal edit, captured by markStale so a render mid-edit
     rebuilds the form with the advisor's typing rather than the saved values */
  let draft = null;
  const stateOf = () => !deal.trade.has || !deal.trade.value || editing ? "details"
    : deal.trade.ownershipReviewedAt ? "result" : "value";
  const fld = (key) => draft && draft[key] != null ? draft[key] : deal.trade[key];

  function render() {
    const st = stateOf();
    renderChrome("Trade-In Evaluation", "", "");
    document.body.dataset.canvas = "master";
    document.body.dataset.screen = "trade";

    const gaps = tradeOwnershipGaps(deal);
    const openQ = openQuestions();
    const forms = requiredTradeForms(deal)
      .map(fid => (RIDE_PRICE_DATA.dealForms.find(f => f.id === fid) || {}).label).filter(Boolean);

    let body = "", dock = "";
    if (st === "details") {
      body = formCard();
      dock = `<div class="tv-dockmeta"><span>Trade</span><b>${esc(shortTrade())}</b></div>
        <button type="button" class="tv-primary tv-dockgo" id="evalDock">Run evaluation</button>`;
    } else if (st === "value") {
      body = formCard() + `
      <section class="tv-card">
        <h2 class="tv-cardtitle">Proof of ownership</h2>
        <div class="tv-ownrow">
          <span class="tv-sicon tv-sicon--need">!</span>
          <div class="tv-owncopy">
            <b>${esc(openQ)} ownership answer${openQ === 1 ? "" : "s"} needed</b>
            <span>Only relevant follow-ups will be shown.</span>
          </div>
          <span class="tv-badge tv-badge--warn">Review</span>
        </div>
        <button type="button" class="tv-secondary" id="ownBtn">Review ownership</button>
      </section>`;
      dock = `<div class="tv-dockmeta"><span>Evaluated value</span><b>${esc(money0(deal.trade.value))}</b></div>
        <button type="button" class="tv-primary tv-dockgo" id="ownDock">Review ownership</button>`;
    } else {
      const done = gaps.length === 0;
      body = heroCard() + `
      <section class="tv-card">
        <h2 class="tv-cardtitle">Ownership review</h2>
        <div class="tv-ownrow">
          <span class="tv-sicon ${done ? "tv-sicon--ok" : "tv-sicon--need"}">${done ? "✓" : "!"}</span>
          <div class="tv-owncopy">
            <b>${done ? "Ownership review complete" : `${esc(gaps.length)} item${gaps.length === 1 ? "" : "s"} for Team Lead`}</b>
            <span>${done ? "No unanswered ownership items." : "Advisor can continue."}</span>
          </div>
          <span class="tv-badge ${done ? "tv-badge--good" : "tv-badge--warn"}">${done ? "Complete" : "Sign-off"}</span>
        </div>
        ${done ? "" : `<div class="tv-gaps">${gaps.map(g => `<div class="tv-gapitem"><span>&bull;</span><div>${esc(g)}</div></div>`).join("")}</div>`}
        ${forms.length ? `<p class="tv-formsnote">Required paperwork: <b>${forms.map(esc).join(", ")}</b> — selected and locked on the deal forms step.</p>` : ""}
        <button type="button" class="tv-link" id="ownEdit">${done ? "View answers" : "Edit ownership answers"}</button>
      </section>
      <button type="button" class="tv-link tv-link--quiet" id="apprEdit">Edit appraisal</button>`;
      dock = `<div class="tv-dockmeta"><span>Trade saved</span><b>${esc(money0(deal.trade.value))}</b></div>
        <a class="tv-primary tv-dockgo" id="toDesk2" href="#/desk/${esc(deal.id)}">Calculate payment</a>`;
    }

    view().innerHTML = `
      <div class="m-app">
        ${tvTop()}
        <main class="tv-main">
          <div class="dv-eyebrow">Trade-in</div>
          <h1 class="dv-title">${st === "details" ? "Evaluate the trade" : st === "value" ? "Trade value" : "Trade ready"}</h1>
          ${contextRow()}
          ${body}
        </main>
        <div class="tv-dock">${dock}</div>
      </div>
      <div class="m-scrim" id="tvScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="tvSheet"></div></div>`;

    $("#tvBack").onclick = () => history.back();
    $("#tvRole").onclick = () => $("#hamburgerBtn").click();
    $("#tvDeal").onclick = dealSheet;
    const scrim = $("#tvScrim");
    if (scrim) scrim.onclick = (e) => { if (e.target === scrim) closeSheet(); };

    if (st !== "result") wireForm();
    const ob = $("#ownBtn"); if (ob) ob.onclick = ownershipSheet;
    const od = $("#ownDock"); if (od) od.onclick = ownershipSheet;
    const oe = $("#ownEdit"); if (oe) oe.onclick = ownershipSheet;
    const ed = $("#evalDock"); if (ed) ed.onclick = runEval;
    const ae = $("#apprEdit"); if (ae) ae.onclick = () => { editing = true; render(); };
    const td = $("#toDesk2");
    if (td) td.onclick = () => { if (["vehicle", "testdrive"].includes(deal.stage)) { deal.stage = "desking"; Store.save(); } };
  }

  function shortTrade() {
    const d = ($("#tDesc") ? $("#tDesc").value : deal.trade.desc) || "";
    const parts = d.trim().split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : (d || "Not entered");
  }

  /* an edited appraisal invalidates the number on screen: the hero yields to
     Run evaluation IN PLACE — a re-render here would eat the keystroke that
     caused it — and the dock follows. Nothing typed is validated-then-dropped
     (review-lessons pattern 2): every field is read back by runEval.
     The staleness is ALSO recorded in route state: without `editing = true`,
     any later render (saving the ownership sheet, for one) would paint the
     superseded figure again with the Run evaluation affordance gone — and
     the draft travels with it, so the render that follows an interleaved
     ownership save rebuilds the form with what the advisor actually typed,
     not the last-saved values. */
  function markStale() {
    editing = true;
    draft = {
      desc: ($("#tDesc") || {}).value, vin: ($("#tVin") || {}).value,
      /* the year captured is the RECORD, never the paint: a box still showing
         what this screen read out of the description is not an edit, and
         freezing it here was half of how a corrected description kept the
         year of the sentence it replaced (see yearRecorded, 2026-09-09). */
      year: yearRecorded(), miles: ($("#tMiles") || {}).value,
      payoff: ($("#tPayoff") || {}).value,
      condition: ($("#tCond button.on") || { dataset: {} }).dataset.cond,
    };
    const hero = $(".tv-card .tv-hero");
    if (hero) {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "tv-primary"; btn.id = "evalBtn";
      btn.textContent = "Run evaluation";
      btn.onclick = runEval;
      hero.replaceWith(btn);
    }
    if (!$("#evalDock")) {
      const dock = $(".tv-dock");
      if (dock) {
        dock.innerHTML = `<div class="tv-dockmeta"><span>Trade</span><b>${esc(shortTrade())}</b></div>
          <button type="button" class="tv-primary tv-dockgo" id="evalDock">Run evaluation</button>`;
        $("#evalDock").onclick = runEval;
      }
    }
  }

  function wireForm() {
    /* the VIN is copied off paper — the title or the printed training
       registration — so it cleans itself as typed: uppercase, punctuation
       dropped, and a quiet count while the 17 characters go in. */
    const vinHint = () => {
      const n = $("#tVin").value.length;
      $("#tVinHint").textContent = n === 0 || n === 17 ? "" : `(${n} of 17)`;
    };
    $("#tVin").oninput = () => {
      const el = $("#tVin");
      el.value = el.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      vinHint();
    };
    vinHint();
    $$("#tCond button").forEach(b => b.onclick = () => {
      $$("#tCond button").forEach(x => x.classList.toggle("on", x === b));
      markStale();
    });
    const eb = $("#evalBtn"); if (eb) eb.onclick = runEval;
    ["tDesc", "tVin", "tYear", "tMiles", "tPayoff"].forEach(fid => {
      const el = $("#" + fid); if (el) el.addEventListener("input", markStale);
    });
    const dm = $(".tv-dockmeta b");
    const td2 = $("#tDesc");
    if (td2) td2.addEventListener("input", () => {
      if (dm) dm.textContent = shortTrade();
      /* the derived year follows the description as it is typed. markStale
         deliberately does not re-render — that would eat the keystroke — so
         without this the box would go on showing the year of a sentence just
         corrected, the contradiction this screen was rebuilt to remove. Only
         a box still holding the paint is moved, plus an empty one, which is
         the advisor handing the question back to the description; a year they
         put there is never overwritten. The two "input" listeners on this
         field are order-independent: both read the same paint, and this one
         moves the box and its provenance together. */
      const y = $("#tYear");
      if (y && (y.value === y.dataset.derived || y.value === "")) {
        y.dataset.derived = String(descYear(td2.value) || ""); y.value = y.dataset.derived;
      }
    });
  }

  function runEval() {
    /* the appraisal is AGE and USE, and it has no other inputs of substance —
       so neither a missing year nor a missing mileage is a field to default.
       The year can still be READ, out of the description the advisor typed
       (the same resolution the form renders); mileage can be read from
       nothing, so it is asked for. Both are named in one ask rather than one
       per round trip, and the first empty box takes the cursor. Owner's
       ruling, 2026-09-09: "leave the mileage box empty like the year". */
    /* the year the advisor RECORDED is kept apart from the one the evaluation
       resolves. `||` reads a typed 0 as no answer at all and hands the year to
       the description, so without the raw number a box reading 0 would be
       appraised as a 2015 and then overwritten with it: absence and a number
       the box would not accept are different states, and only the first one
       falls back. The gate below asks the same question of the same raw
       number — `isNaN(typed)`, which only an empty box answers — so the two
       states get two different messages as well as two different fates.
       `yearRecorded` rather than the box itself, because a box
       still showing what this screen derived is not an answer (2026-09-09). */
    const typed = parseInt(yearRecorded(), 10);
    const year = typed || descYear($("#tDesc").value);
    /* the odometer is read the way the payoff below it is, and for the reason
       this line was not: type=number accepts scientific notation, so "1e5"
       really does arrive here, and parseInt stopped at the "e" and read 1.
       That 1 cleared `>= 0`, so a 100,000-mile trade was appraised as a
       1-mile one — some $5,500 high, stored as miles: 1, with nothing said
       anywhere. parseFloat reads the exponent AND still answers NaN for an
       empty box, which is what keeps the owner's ruling intact; a bare
       Number() would have read the empty box as 0 and appraised a car nobody
       measured. parseFloat behind isFinite is how the two other number reads
       in this file are written, but neither is this same test: the huddle's
       namedPayment takes `> 0`, which would refuse an odometer that genuinely
       reads 0 — the distinction this box turns on — and the desking terms
       sheet's `num()` takes `>= 0` but falls back to the stored figure
       instead of refusing. The line that matches this one exactly is the
       payoff gate below, added in the same change and for the same reason.
       isFinite also refuses an Infinity, which would clear `>= 0` and
       then JSON.stringify to null, bringing the odometer back out of
       localStorage as never-recorded. Rounded because an odometer is a
       whole-mile instrument and the figure is painted straight back into the
       box; to nearest rather than down, so a fractional entry does not tilt
       every trade high. */
    const miles = Math.round(parseFloat($("#tMiles").value));
    /* ABSENT and UNUSABLE are different answers, and only the first one is
       "Add the model year" (2026-09-09). `!year` alone conflated them: a
       typed 0 is falsy, so it falls through `||` to the description, and
       where the description carries no year either, the resolved half is null
       as well — so the advisor who HAD answered was told to add an answer,
       with the 0 the message calls missing still sitting in the box. It also
       contradicted the note two gates down, which says a typed 0 is refused
       by the window rather than read as a blank.
       `isNaN(typed)` is the half that asks the RECORD, and an empty box is
       the only thing that makes it NaN — a box holding 0, 1200 or 2030 is an
       answer, so it passes this gate untouched and the window below refuses
       it by name. Held in a variable rather than written twice, because the
       CURSOR reads the same question: with the toast naming mileage alone,
       `!year` would still have sent the caret to the year box. */
    const yearAbsent = !year && isNaN(typed);
    const need = [yearAbsent && "model year", !(isFinite(miles) && miles >= 0) && "mileage"].filter(Boolean);
    if (need.length) {
      toast(`Add the ${need.join(" and ")} — the evaluation is calculated from ${need.length > 1 ? "them" : "it"}`);
      (yearAbsent ? $("#tYear") : $("#tMiles")).focus();
      return;
    }
    /* a year the box would not accept is refused, not repaired (2026-09-09).
       Its min/max enforce nothing: there is no <form> in this portal and every
       button here is type="button", so no validity check ever runs and the
       attributes only ever drove the spinner. Only the DERIVED path was
       guarded, by the window above; the typed path is the one a human uses,
       and unguarded a 2030 against the 2026 epoch ADDS a year's depreciation
       instead of removing one and prints a used trade above a new car. Both
       ends, one test: 1200 falls through to the 1500 floor and prints a
       confident beater nobody appraised — the same lie, more quietly — and
       that floor exists to price a genuinely old car, never to catch a typo.
       The low end is 1981 rather than the 1998 this branch first shipped
       (see YEAR_MIN): 1998 refused cars a dealership really does take, and
       since this function is the only thing that APPRAISES — the only path
       that turns this form into a `trade.value`, `seedDeal`'s hand-authored
       literal being the whole of the exception — refusing the year refused
       the trade outright and the deal printed as having none.
       A 1995 evaluates now, at the $1,500 floor — the honest answer for it.
       Two clauses, but not two independent tests, and it would overstate them
       to write it that way: the raw box is the one that fires. A typed 0 is
       falsy, so `||` above hands the year to the description; where that
       description carries a year the resolved half sees a perfectly good 2015
       and the second clause alone refuses it, and where it carries none both
       clauses fire on the same 0 — the absence gate passes a typed 0 through
       on purpose, because it is an answer and not a blank.
       So the first clause is never the SOLE reason for a refusal: `descYear`
       returns an in-window year or null and nothing else, and the only way
       `year` is falsy at this point is `typed === 0`, which the second clause
       refuses anyway. It stays because it costs one
       comparison and holds the line if `descYear` ever returns a year it did
       not check: defence in depth, deliberately not a second distinct test.
       Rejected: clamping the year, or the age via Math.max(0, ...) — either
       appraises from a number the advisor did not enter, the defect class this
       screen was rebuilt to remove, and the age clamp would then STORE the
       2030 it priced as a 2026, so the record and the money disagree. Checked
       after the absence gate so an empty box still takes the cursor first. */
    if (!inWindow(year) || (!isNaN(typed) && !inWindow(typed))) {
      toast(`Check the model year — the evaluation only appraises ${YEAR_MIN} to ${YEAR_MAX}`);
      $("#tYear").focus();
      return;
    }
    const condBtn = $("#tCond button.on");
    const cond = condBtn ? condBtn.dataset.cond : "Good";
    const factor = { Excellent: 1.06, Good: 1.0, Fair: 0.9, Rough: 0.78 }[cond] || 1;
    const base = Math.max(1500, 30000 - (APPRAISAL_YEAR - year) * 2100 - miles * 0.055);
    const value = Math.round(base * factor / 50) * 50;
    /* an empty payoff box is an ANSWER. The label reads "(if financed)", so a
       blank one says the trade is not financed, and the evaluation never asks
       for it — the refusal below fires only on a number it will not take,
       never on an empty box. It is not the only box that may be left empty,
       and calling it that was overstated: the VIN is never checked at all,
       Vehicle may go empty once a year is typed, and Model year may go empty
       once the description carries one. Only the mileage is asked for
       unconditionally. What is peculiar to the payoff is that its emptiness
       MEANS something, which is why the key is deleted rather than stored.
       Recording that answer as 0 would paint a 0 straight back into the box on
       the render below: the same "this trade is paid off" the form was just
       cleared of, one tap later. So an empty box leaves the key ABSENT, and a
       typed 0 — a loan paid down to nothing — is recorded as 0, the shown()
       rule the mileage already follows (2026-09-09). */
    const payoffTyped = $("#tPayoff").value;
    /* and a payoff the box would not accept is refused here, for the reason
       the odometer above it is: that read gained parseFloat/isFinite/>= 0 in
       this same change while the payoff, one line below, kept parseFloat with
       `|| 0` behind it and no test of either kind.
       A negative payoff does not merely store wrong — the hero on the customer
       side computes `(value || 0) - (payoff || 0)`, so a minus sign ADDS to
       the equity and the screen shows more of it than the trade has. isFinite
       is here for the Infinity the odometer note describes, which clears
       `>= 0` and then JSON.stringify to null. Placed
       immediately before the Object.assign because nothing has been persisted
       yet at this point, so the early return leaves the deal exactly as the
       advisor left it; `min="0"` on the box matches `#tMiles` on the same card
       and, like it, enforces nothing on its own — there is no <form> here, so
       the attribute only ever drove the spinner. The toast names the case a
       human actually reaches. */
    const payoffNum = payoffTyped === "" ? 0 : parseFloat(payoffTyped);
    if (!(isFinite(payoffNum) && payoffNum >= 0)) {
      toast("Check the payoff — a payoff cannot be negative");
      $("#tPayoff").focus(); return;
    }
    deal.trade = Object.assign(deal.trade, {
      has: true, desc: $("#tDesc").value, vin: $("#tVin").value, miles, condition: cond, value,
      rebates: deal.trade.rebates || 0, applyTaxCredit: true
    });
    /* both keys are set or DELETED here rather than inside the assign, which
       cannot remove one — and that assign has to stay an assign: it is what
       carries `ownership` and `ownershipReviewedAt` across a re-evaluation,
       where a fresh literal would drop a finished trade back out of the
       result state.
       A year READ out of the description is not a record of one, so it is not
       written. Storing it froze one wording of that sentence into a number
       that then OUTRANKED every later correction of it: type "2015 Honda
       Accord", evaluate, notice the typo, fix it to 2016 — and the box, and
       the price, still said 2015, through a reload, because by then nothing
       could tell the screen's own reading from the advisor's own answer.
       `desc` IS the record, and the year is re-read from it every time it is
       needed, so the two cannot drift. Deleted rather than skipped: clearing
       the box is how the advisor hands the question back to the description,
       and a leftover year would refuse it. */
    if (typed) deal.trade.year = typed; else delete deal.trade.year;
    if (payoffTyped === "") delete deal.trade.payoff; else deal.trade.payoff = parseFloat(payoffTyped) || 0;
    Store.save();
    editing = false;
    draft = null;
    toast("Trade value saved to the deal");
    render();
  }

  /* ---- proof of ownership: the contextual sheet ---- */
  /* Yes = true, No = false, Not sure = null (a recorded unknown). Both null
     and never-asked read as "not recorded" in the manager's gap language. */
  const triBtns = (key, val) => `<div class="tv-tri" data-key="${key}">${[
    ["yes", "Yes", val === true], ["no", "No", val === false], ["unsure", "Not sure", val === null]]
    .map(([k, lab, on]) => `<button type="button" data-tri="${k}" class="${on ? "on" : ""}">${lab}</button>`).join("")}</div>`;

  function ownershipSheet() {
    const o = deal.trade.ownership = deal.trade.ownership || {};
    const row = (label, key) => `<div class="tv-choice"><div class="tv-choicelabel">${label}</div>${triBtns(key, o[key])}</div>`;
    let html = `<h2 class="tv-sheettitle">Proof of ownership</h2>` + row("Title in hand?", "titleInHand");
    if (o.titleInHand === false) html += row("Duplicate title process started?", "duplicateStarted");
    html += row("Does the title show a lienholder?", "lienOnTitle");
    if (o.lienOnTitle === true) {
      html += row("Is the vehicle paid off?", "paidOff");
      if (o.paidOff === true) html += row("Lien release received?", "lienReleaseReceived");
      if (o.paidOff === false) {
        html += row("Valid payoff received?", "payoffReceived");
        if (o.payoffReceived === true) html += `<div class="tv-choice"><div class="tv-choicelabel">Payoff good through</div>
          <input type="text" class="tv-input" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" id="oGood" value="${esc(dateUS(o.payoffGoodThrough || ""))}"></div>`;
      }
    }
    html += row("Is the person trading the titled owner?", "isTitledOwner");
    if (o.isTitledOwner === false) html += row("Trade authorization / power of attorney received?", "authorizationReceived");
    /* "Close", not "Cancel": every tri tap and the date field already saved
       (autosave is how the sheet survives its own re-renders), so this
       button discards nothing — it closes without stamping the review as
       complete. A label must state what the code does. */
    html += `<div class="tv-sheetactions">
      <button type="button" class="tv-primary" id="ownSave">Save ownership review</button>
      <button type="button" class="tv-secondary" data-sheet-close>Close</button>
    </div>`;
    openSheet(html, (sh) => {
      $$(".tv-tri button", sh).forEach(b => b.onclick = () => {
        const key = b.closest(".tv-tri").dataset.key;
        o[key] = b.dataset.tri === "yes" ? true : b.dataset.tri === "no" ? false : null;
        Store.save();
        /* conditional questions appear immediately after the triggering
           answer — the sheet re-renders around the same open state */
        ownershipSheet();
      });
      const g = $("#oGood", sh);
      if (g) g.onchange = () => { o.payoffGoodThrough = g.value.trim() ? dateISO(g.value.trim()) : ""; Store.save(); };
      $("#ownSave", sh).onclick = () => {
        flushDate();
        deal.trade.ownershipReviewedAt = new Date().toISOString();
        Store.save();
        closeSheet();
        render();
      };
    });
  }

  /* the context row opens deal details — the one place Deal # belongs */
  function dealSheet() {
    openSheet(`
      <h2 class="tv-sheettitle">Deal details</h2>
      <div class="tv-choice"><div class="tv-detlab">Customer</div><div class="tv-detval">${esc(custName)}</div></div>
      <div class="tv-choice"><div class="tv-detlab">Selected vehicle</div><div class="tv-detval">${v ? esc(`${v.year} ${v.make} ${v.model}`) : "Not selected yet"}</div></div>
      <div class="tv-choice"><div class="tv-detlab">Deal</div><div class="tv-detval">#${esc(deal.dealNo || "—")} &middot; ${esc((STAGES[deal.stage] || {}).label || deal.stage)}</div></div>
      <div class="tv-sheetactions"><button type="button" class="tv-secondary" data-sheet-close>Done</button></div>`);
  }

  render();
});

/* ============================================================
   VIEW: Desking — Calculate Payments
   (owner's package v029, 2026-09-04, on the UI kit v022.19)
   ============================================================
   Eight screens on one route, all of them the kit's Task skeleton: the top
   bar carries the customer's full name and nothing else — no step, no
   status, and no deal number, because a worked deal has none until the
   lending lane pushes it to F&I (chrome rule §16).

   Two modes, and the difference is who is looking at the phone (§15).
   WORK is the advisor's — the huddle, the deal-type control, the payment
   hero, the accordions, the option grid — and every internal field lives
   here and nowhere else. PRESENT is the same route with the kit's
   `rp-screen--present`: the kit hides the role control and darkens the close
   into Done, and the screen carries the car, two wins, the grid, the payment
   and one line of fine print. Nothing internal, no hedge words ("estimated"
   is gone from every customer-facing number — the fine print carries the
   condition once), and one commitment action whose tap IS the trial close.

   The money reconciles on the screen (§17): every figure the total depends
   on is drawn, the four fees are itemized rather than bundled, and the tax
   names the base it is taken on (§19b). The rebate says what kind it is
   (§17b) — customer cash, so it survives the cash tab.

   Three things v021 had are deliberately gone: the "Game plan set" toast
   (the segmented control shows the deal type, and a toast cannot be the
   record of anything — §24), the pinned estimated-payment bar (the hero and
   the dock carry the figure), and the full-page Compare route, replaced by
   the present-mode comparison below. */
route("desk/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  if (!deal.stock) { toast("Pick a vehicle first"); return navigate(`#/vehicles/${deal.id}`); }
  const v = Store.vehicle(deal.stock);
  const c = Store.customer(deal.customerId);
  if (["discovery", "vehicle", "testdrive"].includes(deal.stage)) { deal.stage = "desking"; Store.save(); }

  /* huddle backfill: deals already past the pencil don't re-huddle */
  if (!deal.huddle) deal.huddle = { done: false };
  if (!deal.huddle.done && ((deal.basePayment && deal.basePayment.signedAt) || ["signed", "credit", "menu", "forms", "complete"].includes(deal.stage))) {
    deal.huddle.done = true; deal.huddle.backfilled = true; Store.save();
  }

  renderChrome("Calculate Payments", "", "");
  document.body.dataset.screen = "desk";
  document.body.dataset.canvas = "kit";

  const PAY_TRACKS = {
    finance: "Is the incentivized rate or the rebate better for them?",
    lease: "Do they trade frequently? Are they a low-mileage driver?",
    cash: "Will they be writing a check or obtaining a cashier's check?",
    onepay: "Low-mileage driver who would rather not have a monthly payment?"
  };

  /* the board's grid: three terms across, three cash-down rows. Three
     columns, never four — three is a choice, four is a spreadsheet (§15). */
  const GRID_TERMS = [48, 60, 72];
  const GRID_DOWNS = [1000, 3000, 5000];

  const timeUS = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const isLease = () => deal.dealType === "lease" || deal.dealType === "onepay";
  const isCash = () => deal.dealType === "cash";
  const custName = `${c.first} ${c.last}`;
  const vehicleFull = `${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}`;
  const vehicleShort = `${v.year} ${v.make} ${v.model}`;
  /* the compact row drops the make, as the board does: it is the car already
     on the deal, and the row is 220px wide */
  const vehicleCompact = `${v.year} ${v.model}${v.trim ? " " + v.trim : ""}`;

  const ui = {
    mode: deal.huddle.done ? "pencil" : "huddle",
    open: { price: true, residual: false, trade: false, rebates: false, accessories: false, feetax: false },
    sheet: null,
    sel: null      /* the cell the customer is looking at in present mode */
  };
  const sheets = chSheetOpener("dkScrim", "dkSheet", () => { ui.sheet = null; });

  /* ---------- the numbers ---------- */
  /* every grid cell is the real calculator run on a clone of this deal, so a
     cell can never drift from the pencil it sits under */
  function cellPayment(down, term) {
    const clone = JSON.parse(JSON.stringify(deal));
    clone.dealType = "finance";
    clone.desk.downPayment = down; clone.desk.term = term;
    return RIDE_PRICE_CALC.finance(clone, v).payment;
  }
  function gridCells() {
    const out = [];
    GRID_DOWNS.forEach(down => GRID_TERMS.forEach(term => out.push({ down, term, payment: cellPayment(down, term) })));
    return out;
  }
  /* the payment the customer named in the huddle, as a number — "Around $700
     a month" is $700. Absent or unparseable is null, and the grid then
     recommends the structure the deal already carries. */
  function namedPayment() {
    const raw = String((deal.huddle && deal.huddle.namedPayment) || "");
    const n = parseFloat(raw.replace(/[^0-9.]/g, ""));
    return isFinite(n) && n > 0 ? n : null;
  }
  /* The recommended cell is the option NEAREST the payment the customer
     named, shorter term winning a tie. The package's prompt says "the
     highest option that sits at or under it", but no cell sits under the
     $700 John named once the corrected New York base is applied — the
     board's own recommendation, 60 months at $1,000 down, is $1.79 above it.
     The board and the seed both name that cell, so nearest is the rule that
     reproduces them; the divergence is reported to the owner rather than
     resolved silently. */
  function recommended() {
    const cells = gridCells(), named = namedPayment();
    if (!named) {
      return cells.find(x => x.down === deal.desk.downPayment && x.term === deal.desk.term)
        || cells.find(x => x.down === 1000 && x.term === 60) || cells[0];
    }
    return cells.reduce((best, x) => {
      const d = Math.abs(x.payment - named), bd = Math.abs(best.payment - named);
      return d < bd || (d === bd && x.term < best.term) ? x : best;
    }, cells[0]);
  }

  const incentive = RIDE_PRICE_DATA.financeIncentive;
  /* the incentive's real end date, and only while the deal is actually
     quoted at that rate — a deadline that is not real is the fastest way to
     lose a customer's trust (§15) */
  const aprLine = () => {
    const apr = `${deal.desk.apr}% APR`;
    return incentive && deal.desk.apr === incentive.apr
      ? `${apr} through ${new Date(incentive.through + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : apr;
  };
  const heroFigure = (r) => isCash() ? r.totalDue : deal.dealType === "onepay" ? r.onePayTotal : r.payment;
  const heroLabel = () => isCash() || deal.dealType === "onepay" ? "Total due" : "Monthly payment";
  const heroUnit = () => isCash() || deal.dealType === "onepay" ? "total" : "/ mo";
  const heroTerms = (r) => isCash()
    ? `${esc(vehicleCompact)} · cash, no financing`
    : deal.dealType === "onepay"
      ? `${r.term} months · ${r.miles.toLocaleString()} mi/yr · paid in full at signing`
      : isLease()
        ? `${r.term} months · ${r.miles.toLocaleString()} mi/yr · ${money0(deal.desk.dueAtSigning)} due at signing · with approved credit`
        : `${r.term} months · ${aprLine()} · ${money0(deal.desk.downPayment)} down · with approved credit`;

  /* ---------- the pieces the screens are built from ---------- */
  /* the chip row the buyers board (v033) draws on this screen: who the deal
     belongs to, and what is in the folder. The Buyers chip carries the count
     and opens the kit sheet inside THIS screen — a sheet is the kit's own
     overlay and lives in the screen it covers. No deal number anywhere on
     these screens (§16), and the Jacket count does not move here: desking is
     pre-bureau drafting and files no document (§19a). */
  const chipRow = () => {
    const buyers = 1 + (deal.coBuyerId && Store.customer(deal.coBuyerId) ? 1 : 0);
    return `<div class="rp-chiprow">
      <button type="button" class="rp-chip" data-sheet-open="buyers">${rpGlyph("customers")}Buyers · ${buyers}</button>
      ${chJacketChip(deal)}
    </div>`;
  };
  /* the car on the deal — the board's own row */
  const vehicleRow = () => `<div class="rp-choice"><span class="rp-choice__thumb" style="${vehicleTint(v)}">${mCarSvg(v, "rp-icon")}</span>
    <span><div class="rp-choice__title">${esc(vehicleCompact)}</div><div class="rp-choice__sub">Stock ${esc(v.stock)} · ${esc(v.ext)}</div></span></div>`;

  const segment = () => `<div class="rp-segment" style="grid-template-columns:repeat(4,1fr)" role="tablist" aria-label="Deal type">
    ${Object.entries(DEAL_TYPES).map(([k, l]) => `<button type="button" class="rp-segment__item${deal.dealType === k ? " rp-segment__item--on" : ""}" data-type="${k}" role="tab" aria-selected="${deal.dealType === k}">${esc(l)}</button>`).join("")}</div>`;

  const priceHero = (r, action) => `<div class="rp-price">
    <div class="rp-price__label">${esc(heroLabel())}</div>
    <div class="rp-price__amount">${money(heroFigure(r))}<small>${esc(heroUnit())}</small></div>
    <div class="rp-price__terms">${heroTerms(r)}</div>
    ${action ? `<button type="button" class="rp-price__action" id="dkHeroPresent">Present</button>` : ""}</div>`;

  const kvRow = (label, val, srcHtml) => `<div class="rp-kv__row${srcHtml ? " rp-kv__row--src" : ""}"><span>${label}</span><span>${val}</span>${srcHtml ? `<span class="rp-kv__src">${srcHtml}</span>` : ""}</div>`;

  /* the board rotates the chevron on an open accordion with an inline style —
     the kit draws no open state for rp-acc, so the board's own device is used
     here and the gap is reported rather than patched in CSS */
  /* the head and the toggle rows below carry an inline width because the kit
     sizes neither for the element they have to be: `.rp-row` is given
     `width: 100%` so it can be a button, `.rp-acc__head` and `.rp-toggle-row`
     are not, and a button is inline-level, so both shrink to their text and
     the summary lands against the title. Reported as a kit gap; the width is
     on the element, never a rule over a kit class. */
  const acc = (key, title, sum, rows) => `<div class="rp-acc">
    <button type="button" class="rp-acc__head" style="width:100%" data-acc="${key}" aria-expanded="${ui.open[key] ? "true" : "false"}">${esc(title)}<span class="rp-acc__sum">${sum}</span>${ui.open[key] ? rpGlyph("chevron-down").replace('class="rp-icon"', 'class="rp-icon" style="transform:rotate(180deg)"') : rpGlyph("chevron-down")}</button>
    ${ui.open[key] ? `<div class="rp-acc__body">${rows}</div>` : ""}</div>`;

  const feeRows = () => RIDE_PRICE_DATA.fees.map(f => kvRow(esc(f.label), money(f.amount))).join("");
  /* a lease is taxed on the payment and a purchase on the vehicle, so the row
     states which — and a purchase names the base it is taken on, because a
     tax figure with no stated base cannot be checked (§19b) */
  const taxRow = (r) => isLease()
    ? r.taxes.rows.map(t => kvRow(esc(t.label), money(t.amount))).join("")
    : kvRow(`Sales tax · ${RIDE_PRICE_CALC.taxPct(RIDE_PRICE_CALC.totalTaxRate())}% on ${money(RIDE_PRICE_CALC.taxableBase(deal, v))}`, money(r.taxes.total));
  /* the two fees a lease carries that a purchase does not. The disposition fee
     is charged at lease END, so it never enters the payment and the row says
     so — disclosed on the pencil, exactly as the app has always disclosed it. */
  const leaseFeeRows = () => isLease()
    ? kvRow("Acquisition Fee", money(RIDE_PRICE_DATA.leaseFees.acquisition))
      + kvRow("Disposition Fee (at lease end)", money(RIDE_PRICE_DATA.leaseFees.disposition))
    : "";

  function accordions(r) {
    const equity = (deal.trade.value || 0) - (deal.trade.payoff || 0);
    const saving = v.msrp - (v.selling + v.includedOptions);
    const price = acc("price", "Vehicle price", money(v.selling + v.includedOptions),
      kvRow("MSRP", money(v.msrp)) + kvRow("Your price", money(v.selling + v.includedOptions))
      + (saving > 0 ? kvRow("Saving", `<span class="rp-delta">−${money(saving)}</span>`) : ""));
    const trade = deal.trade.has
      ? acc("trade", "Trade", `${equity >= 0 ? "+" : "−"}${money(Math.abs(equity))}`,
        kvRow("Allowance", money(deal.trade.value || 0)) + kvRow("Payoff", money(deal.trade.payoff || 0))
        + kvRow(equity >= 0 ? "Equity" : "Negative equity", `<span class="${equity >= 0 ? "rp-delta" : ""}">${equity >= 0 ? "+" : "−"}${money(Math.abs(equity))}</span>`)
        + `<div class="rp-kv__row"><span>Trade evaluation</span><span><a class="rp-row__action" href="#/trade/${esc(deal.id)}">Open</a></span></div>`)
      : "";
    /* the rebate names its kind on the row, because the same figure is valid
       on one deal type and invalid on another (§17b) */
    const rebates = acc("rebates", "Rebates", `−${money(deal.trade.rebates || 0)}`,
      kvRow("Customer cash", `−${money(deal.trade.rebates || 0)}`, "applies to any deal type, including a cash purchase")
      + `<div class="rp-kv__row"><span>Change the rebate</span><span><button type="button" class="rp-row__action" data-sheet-open="terms">Edit</button></span></div>`);
    const accessories = acc("accessories", "Accessories", money(r.accessories),
      (deal.desk.accessories.length
        ? deal.desk.accessories.map(a2 => { const x = RIDE_PRICE_DATA.accessories.find(y => y.id === a2); return x ? kvRow(esc(x.name), money(x.price)) : ""; }).join("")
        : kvRow("None selected", money(0)))
      + `<div class="rp-kv__row"><span>Change accessories</span><span><button type="button" class="rp-row__action" data-sheet-open="accessories">Edit</button></span></div>`);
    const feetax = acc("feetax", "Fees & tax", money(r.fees + r.taxes.total), feeRows() + leaseFeeRows() + taxRow(r));
    const residual = isLease() ? acc("residual", "Residual", money(r.residual),
      kvRow("Residual value", money(r.residual)) + kvRow("Percent of MSRP", (r.residualPct * 100).toFixed(1) + "%")) : "";
    return price + residual + trade + rebates + accessories + feetax;
  }

  function grid(present) {
    const rec = recommended();
    const sel = ui.sel;
    const head = `<div class="rp-grid__hdr"><span>Cash down</span>${GRID_TERMS.map(t => `<span>${t} mo</span>`).join("")}</div>`;
    const rows = GRID_DOWNS.map(down => `<div class="rp-grid__row"><span class="rp-grid__down">${money0(down)}</span>${GRID_TERMS.map(term => {
      const isRec = rec.down === down && rec.term === term;
      const isOn = !!sel && sel.down === down && sel.term === term && !isRec;
      const cls = `rp-grid__cell${isRec ? " rp-grid__cell--rec" : ""}${isOn ? " rp-grid__cell--on" : ""}`;
      const body = `${isRec ? `<span class="rp-grid__tag">Recommended</span>` : ""}<span>${money(cellPayment(down, term))}<small>/ mo</small></span>`;
      return present
        ? `<button type="button" class="${cls}" data-cell="${down}-${term}" aria-pressed="${isRec || isOn}">${body}</button>`
        : `<div class="${cls}">${body}</div>`;
    }).join("")}</div>`).join("");
    return `<div class="rp-grid">${head}${rows}</div>`;
  }

  const presentVehicle = () => `<div class="rp-present-vehicle">
    <div class="rp-present-vehicle__thumb" style="${vehicleTint(v)}">${mCarSvg(v, "rp-icon")}</div>
    <div class="rp-present-vehicle__name">${esc(vehicleFull)}</div>
    <div class="rp-present-vehicle__sub">${esc(v.ext)} · ${esc(v.drive)} · Stock ${esc(v.stock)}</div></div>`;

  /* two wins, and only when they are wins: a saving against MSRP, and trade
     equity as a credit. Negative equity is never dressed as a win (§15) —
     it stays a plain row in the payment detail. */
  function wins() {
    const saving = v.msrp - (v.selling + v.includedOptions);
    const equity = (deal.trade.value || 0) - (deal.trade.payoff || 0);
    const cards = [];
    cards.push(`<div class="rp-win"><div class="rp-win__label">Your price</div>
      <div class="rp-win__value">${money(v.selling + v.includedOptions)}</div>
      <div class="rp-win__label">MSRP ${money(v.msrp)}${saving > 0 ? ` · <span class="rp-delta">save ${money(saving)}</span>` : ""}</div></div>`);
    if (deal.trade.has && equity > 0) {
      cards.push(`<div class="rp-win"><div class="rp-win__label">Your trade credit</div>
        <div class="rp-win__value rp-win__value--good">+${money(equity)}</div>
        <div class="rp-win__label">${esc(tradeShort())} · after payoff</div></div>`);
    }
    return `<div class="rp-wins">${cards.join("")}</div>`;
  }
  /* "2016 Toyota RAV4" reads as "2016 RAV4" on a customer-facing card */
  function tradeShort() {
    const parts = String(deal.trade.desc || "").split(" ");
    return parts.length > 2 ? parts[0] + " " + parts.slice(2).join(" ") : (deal.trade.desc || "Your trade");
  }
  /* one line of fine print, and only what is true of the deal in front of the
     customer: a cash purchase is subject to no credit approval and no rate,
     and a lease is quoted on a money factor rather than the incentivized APR
     (§15 — the condition is stated once, and never invented) */
  const fineLine = (financed) => {
    const showApr = financed === undefined ? !isCash() && !isLease() : financed;
    if (financed === undefined && isCash()) return "";
    return `<div class="rp-fine">With approved credit${showApr ? ` · ${aprLine()}` : ""}</div>`;
  };

  /* ---------- 01 · the huddle ---------- */
  function huddleScreen() {
    const h = deal.huddle;
    const paying = h.paying || deal.dealType;
    const content = `<div class="rp-eyebrow">First pencil</div>
      <h1 class="rp-title">Game plan</h1>
      ${chipRow()}
      ${vehicleRow()}
      <div class="rp-field"><label class="rp-field__label" for="hTrial">Trial close — in the customer&rsquo;s words</label>
        <textarea class="rp-textarea" id="hTrial" placeholder="&ldquo;If the numbers make sense, we&rsquo;d take it today.&rdquo;">${esc(h.trialClose || "")}</textarea></div>
      <div class="rp-field"><label class="rp-field__label" for="hNamed">Payment the customer named</label>
        <input class="rp-field__input" id="hNamed" value="${esc(h.namedPayment || "")}" placeholder="Around $700 a month"></div>
      <div class="rp-section">How are they paying?</div>
      <div class="rp-choice-grid" id="hPayRow" role="radiogroup" aria-label="How are they paying">
        ${Object.entries(DEAL_TYPES).map(([k, l]) => `<button type="button" class="rp-option${paying === k ? " rp-option--on" : ""}" data-pay="${k}" role="radio" aria-checked="${paying === k}">
          <span><span class="rp-option__title">${esc(l)}</span></span>
          <span class="rp-radio${paying === k ? " rp-radio--on" : ""}">${paying === k ? rpGlyph("check") : ""}</span></button>`).join("")}
      </div>
      <div class="rp-group"><div class="rp-row"><span class="rp-row__body">
        <span class="rp-row__title">Discovery question</span>
        <span class="rp-row__sub" id="hTrack">${esc(PAY_TRACKS[paying])}</span></span></div></div>
      <button type="button" class="rp-toggle-row" style="width:100%" id="hTrade" aria-pressed="${h.trade != null ? h.trade : deal.trade.has}">
        ${deal.trade.has && deal.trade.value ? `Trade evaluated · ${money0(deal.trade.value)}` : "Trade evaluation needed"}
        <span class="rp-toggle${(h.trade != null ? h.trade : deal.trade.has) ? " rp-toggle--on" : ""}"></span></button>
      <button type="button" class="rp-toggle-row" style="width:100%" id="hStock" aria-pressed="${h.inStock !== false}">Vehicle in stock today
        <span class="rp-toggle${h.inStock !== false ? " rp-toggle--on" : ""}"></span></button>`;
    render(content, chDock(`<button type="button" class="rp-primary" id="hConfirm">Open the pencil</button>`));

    let payingSel = paying, tradeOn = h.trade != null ? h.trade : deal.trade.has, stockOn = h.inStock !== false;
    $$("#hPayRow [data-pay]").forEach(b => b.onclick = () => {
      payingSel = b.dataset.pay;
      $$("#hPayRow [data-pay]").forEach(x => {
        const on = x === b;
        x.classList.toggle("rp-option--on", on);
        x.setAttribute("aria-checked", String(on));
        const radio = x.querySelector(".rp-radio");
        radio.classList.toggle("rp-radio--on", on);
        radio.innerHTML = on ? rpGlyph("check") : "";
      });
      $("#hTrack").textContent = PAY_TRACKS[payingSel];
    });
    const toggle = (sel, get, set) => { const el = $(sel); el.onclick = () => { set(!get()); el.setAttribute("aria-pressed", String(get())); el.querySelector(".rp-toggle").classList.toggle("rp-toggle--on", get()); }; };
    toggle("#hTrade", () => tradeOn, (x) => tradeOn = x);
    toggle("#hStock", () => stockOn, (x) => stockOn = x);
    $("#hConfirm").onclick = () => {
      Object.assign(deal.huddle, {
        done: true, at: new Date().toISOString(),
        by: `${Store.s.advisor} + ${RIDE_PRICE_DATA.dealership.teamLead}`,
        trialClose: $("#hTrial").value.trim(),
        namedPayment: $("#hNamed").value.trim(),
        paying: payingSel, trade: tradeOn, inStock: stockOn
      });
      deal.dealType = payingSel;
      Store.save();
      /* no toast: the deal-type control on the pencil says which it is, and
         nothing that disappears may be the record of anything (§24) */
      ui.mode = "pencil"; draw();
    };
  }

  /* ---------- 02 / 06 / 07 / 08 · the pencil ---------- */
  function pencilScreen() {
    const r = RIDE_PRICE_CALC.calc(deal, v);
    const chose = deal.desk.customerChose;
    const asked = deal.desk.approvalRequestedAt;
    const cashColumn = () => `<div class="rp-kv"><div class="rp-kv__head">Cash purchase</div>
      ${kvRow("Your price", money(v.selling + v.includedOptions))}
      ${r.accessories ? kvRow("Accessories", money(r.accessories)) : ""}
      ${kvRow("Taxes and fees", money(r.fees + r.taxes.total))}
      ${deal.trade.rebates ? kvRow("Rebate", `−${money(deal.trade.rebates)}`, "customer cash — applies to a cash purchase, not tied to financing") : ""}
      ${deal.trade.has ? kvRow("Trade credit", `−${money(r.netTrade)}`) : ""}
      <div class="rp-kv__row" style="border-top:1px solid var(--rp-ink)"><span style="color:var(--rp-ink);font-weight:740">Total due</span><span style="font-weight:760">${money(r.totalDue)}</span></div></div>`;

    const content = `<div class="rp-eyebrow">Desking</div>
      <h1 class="rp-title">Calculate payments</h1>
      ${chipRow()}
      ${isCash() ? "" : vehicleRow()}
      ${chose ? `<div class="rp-notice rp-notice--success"><span class="rp-step__mark rp-step__mark--done">${rpGlyph("check")}</span>Customer chose ${isCash() ? `${money(chose.payment)} total` : deal.dealType === "onepay" ? `${chose.term} months · ${money(chose.payment)} paid in full` : `${chose.term} months · ${money0(chose.down)} down · ${money(chose.payment)} / mo`}</div>` : ""}
      ${asked ? `<div class="rp-notice"><span class="rp-step__mark rp-step__mark--done">${rpGlyph("check")}</span>Sent to ${esc(RIDE_PRICE_DATA.dealership.teamLead)} for approval · ${esc(timeUS(asked))}</div>` : ""}
      ${segment()}
      ${priceHero(r, !chose)}
      ${isCash() ? cashColumn() : ""}
      ${isCash() || isLease() ? "" : `<div class="rp-group"><button type="button" class="rp-row" id="dkOptions">
        <span class="rp-row__body"><span class="rp-row__title">Payment options</span>
        <span class="rp-row__sub">${GRID_TERMS.join(" / ")} months × ${money0(GRID_DOWNS[0])}–${money0(GRID_DOWNS[GRID_DOWNS.length - 1])} down</span></span>
        <span class="rp-row__chevron"></span></button></div>`}
      ${accordions(r)}`;

    const dock = chose && !asked
      ? chDock(`<button type="button" class="rp-primary" id="dkSubmit">Submit for Team Lead approval</button>`, `<button type="button" class="rp-link" id="dkPresent">Present again</button>`)
      : chose && asked
        ? chDock(`<button type="button" class="rp-primary" id="dkContinue">Continue — base payment agreement</button>`, `<button type="button" class="rp-link" id="dkPresent">Present again</button>`)
        : chDock(`<button type="button" class="rp-primary" id="dkPresent">Present to customer</button>`,
          `<button type="button" class="rp-link" id="dkCompare">${isCash() ? "Compare" : "Compare finance and lease"}</button>`);
    render(content, dock);

    /* a new deal type is a new structure, so the payment the customer agreed
       to is no longer the payment on screen — the choice comes off with it
       rather than sitting over a number they never saw */
    $$("[data-type]").forEach(b => b.onclick = () => {
      if (deal.dealType !== b.dataset.type) {
        delete deal.desk.customerChose; delete deal.desk.approvalRequestedAt; delete deal.desk.approvalRequestedBy;
      }
      deal.dealType = b.dataset.type; Store.save(); draw();
    });
    const opts = $("#dkOptions"); if (opts) opts.onclick = () => { ui.mode = "options"; draw(); };
    const hero = $("#dkHeroPresent"); if (hero) hero.onclick = () => goPresent();
    const pres = $("#dkPresent"); if (pres) pres.onclick = () => goPresent();
    const cmp = $("#dkCompare"); if (cmp) cmp.onclick = () => { ui.mode = "compare"; draw(); };
    const submit = $("#dkSubmit");
    if (submit) submit.onclick = () => {
      /* the request is recorded on the screen, not announced in a toast: the
         Team Lead's own approval screen is not drawn yet, and a waiting role
         still gets the action it has (§23, §24) */
      deal.desk.approvalRequestedAt = new Date().toISOString();
      deal.desk.approvalRequestedBy = Store.s.advisor;
      Store.save(); draw();
    };
    const cont = $("#dkContinue");
    if (cont) cont.onclick = () => {
      deal.basePayment = { signedAt: null, snapshot: RIDE_PRICE_CALC.calc(deal, v) };
      if (deal.stage === "desking") deal.stage = "signed";
      Store.save();
      navigate(`#/agreement/${deal.id}`);
    };
  }

  /* ---------- 03 · the option grid ---------- */
  function optionsScreen() {
    const named = deal.huddle.namedPayment;
    const rec = recommended();
    const content = `<div class="rp-eyebrow">Desking</div>
      <h1 class="rp-title">Payment options</h1>
      ${chipRow()}
      ${vehicleRow()}
      <div class="rp-section">Finance · ${aprLine()} · rebate and trade credit applied</div>
      ${grid(false)}
      ${named ? `<div class="rp-group"><div class="rp-row"><span class="rp-row__body">
        <span class="rp-row__title">Customer named</span>
        <span class="rp-row__sub">&ldquo;${esc(named)}&rdquo; — ${rec.term} months · ${money0(rec.down)} down is the anchor</span></span></div></div>` : ""}`;
    render(content, chDock(`<button type="button" class="rp-primary" id="dkPresent">Present to customer</button>`,
      `<button type="button" class="rp-link" id="dkTerms">Change terms</button>`));
    $("#dkPresent").onclick = () => goPresent();
    $("#dkTerms").onclick = () => { ui.sheet = "terms"; draw(); };
  }

  /* ---------- 04 · present — your payment ---------- */
  function presentScreen() {
    const r = RIDE_PRICE_CALC.calc(deal, v);
    const finance = !isCash() && !isLease();
    const content = `<div class="rp-eyebrow">${finance ? "Three ways to own it" : isCash() ? "Your purchase" : "Your lease"}</div>
      <h1 class="rp-title">${finance ? "Your payment" : isCash() ? "Your total" : "Your payment"}</h1>
      ${presentVehicle()}
      ${wins()}
      ${finance ? grid(true) : priceHero(r, false)}
      ${fineLine()}`;
    render(content, chDock(`<button type="button" class="rp-primary" id="dkTake">This one works</button>`), "present");
    $$("[data-cell]").forEach(b => b.onclick = () => {
      const [down, term] = b.dataset.cell.split("-").map(Number);
      ui.sel = { down, term, payment: cellPayment(down, term) };
      draw();
    });
    $("#dkTake").onclick = () => commit();
  }

  /* ---------- 05 · present — own or lease ---------- */
  function compareScreen() {
    const mk = (type) => {
      const clone = JSON.parse(JSON.stringify(deal)); clone.dealType = type;
      return RIDE_PRICE_CALC.calc(clone, v);
    };
    const f = mk("finance"), l = mk("lease");
    const equity = (deal.trade.value || 0) - (deal.trade.payoff || 0);
    const included = f.accessories + f.fees + f.taxes.total;
    const recFinance = deal.dealType !== "lease";
    const content = `<div class="rp-eyebrow">Own or lease</div>
      <h1 class="rp-title">Two ways to drive it</h1>
      ${presentVehicle()}
      <div class="rp-wins">
        <div class="rp-win"${recFinance ? ` style="border:2px solid var(--rp-ink)"` : ""}><div class="rp-win__label">Finance · ${f.term} mo</div>
          <div class="rp-win__value">${money(f.payment)}</div>
          <div class="rp-win__label">${money0(deal.desk.downPayment)} down · you own it</div></div>
        <div class="rp-win"${recFinance ? "" : ` style="border:2px solid var(--rp-ink)"`}><div class="rp-win__label">Lease · ${l.term} mo</div>
          <div class="rp-win__value">${money(l.payment)}</div>
          <div class="rp-win__label">${money0(deal.desk.dueAtSigning)} at signing · ${Math.round(l.miles / 1000)}k mi/yr</div></div>
      </div>
      <div class="rp-kv">
        ${kvRow("Your price", money(v.selling + v.includedOptions))}
        ${deal.trade.has && equity > 0 ? kvRow("Trade credit", `<span class="rp-delta">+${money(equity)}</span>`) : ""}
        ${deal.trade.rebates ? kvRow("Rebate", `<span class="rp-delta">−${money(deal.trade.rebates)}</span>`) : ""}
        <div class="rp-kv__row rp-kv__row--src"><span>Included</span><span>${money(included)}</span>
          <span class="rp-kv__src"><button type="button" class="rp-row__action" id="dkItemize" style="padding:0">accessories, tax and four fee lines — tap to itemize</button></span></div>
      </div>
      <div style="height:12px"></div>
      ${fineLine(true)}`;
    render(content, chDock(`<button type="button" class="rp-primary" id="dkFinance">Finance works</button>`,
      `<button type="button" class="rp-link" id="dkLease">Show the lease</button>`), "present");
    $("#dkItemize").onclick = () => { ui.sheet = "itemize"; draw(); };
    $("#dkFinance").onclick = () => { deal.dealType = "finance"; Store.save(); commit(); };
    $("#dkLease").onclick = () => { deal.dealType = "lease"; Store.save(); ui.mode = "present"; draw(); };
  }

  /* the customer's own tap is the trial close: it writes the structure they
     chose onto the deal and hands the phone back to Work (§15) */
  function commit() {
    if (!isCash() && !isLease()) {
      const cell = ui.sel || recommended();
      deal.desk.term = cell.term;
      deal.desk.downPayment = cell.down;
      deal.desk.customerChose = { term: cell.term, down: cell.down, payment: cell.payment, at: new Date().toISOString() };
    } else {
      const r = RIDE_PRICE_CALC.calc(deal, v);
      deal.desk.customerChose = { term: r.term || 0, down: isCash() ? 0 : deal.desk.dueAtSigning, payment: heroFigure(r), at: new Date().toISOString() };
    }
    Store.save();
    ui.mode = "pencil"; ui.sel = null; draw();
  }
  function goPresent() { ui.sel = null; ui.mode = "present"; draw(); }

  /* ---------- the sheets ---------- */
  function sheetHtml() {
    if (ui.sheet === "itemize") {
      const r = RIDE_PRICE_CALC.calc(deal, v);
      return `${chSheetHead("What is included")}
        <p class="rp-sheet__sub">${esc(vehicleCompact)} · ${esc(custName)}</p>
        <div class="rp-kv">
          ${deal.desk.accessories.map(a2 => { const x = RIDE_PRICE_DATA.accessories.find(y => y.id === a2); return x ? kvRow(esc(x.name), money(x.price)) : ""; }).join("")}
          ${feeRows()}
          ${taxRow(r)}
        </div>
        <button type="button" class="rp-primary" data-sheet-close>Done</button>`;
    }
    if (ui.sheet === "accessories") {
      return `${chSheetHead("Accessories")}
        <p class="rp-sheet__sub">${esc(vehicleShort)} · Stock ${esc(v.stock)}</p>
        ${RIDE_PRICE_DATA.accessories.map(a2 => {
          const on = deal.desk.accessories.includes(a2.id);
          return `<button type="button" class="rp-option${on ? " rp-option--on" : ""}" data-acc="${esc(a2.id)}" aria-pressed="${on}">
            <span><span class="rp-option__title">${esc(a2.name)}</span><span class="rp-option__sub">${money0(a2.price)}</span></span>
            <span class="rp-radio${on ? " rp-radio--on" : ""}">${on ? rpGlyph("check") : ""}</span></button>`;
        }).join("")}
        <button type="button" class="rp-primary" data-sheet-close>Done</button>`;
    }
    /* terms: what the advisor actually adjusts on a pencil. Work mode only —
       nothing here is ever drawn while the phone is turned to the customer. */
    const opt = (attr, val, label, on) => `<button type="button" class="rp-segment__item${on ? " rp-segment__item--on" : ""}" data-${attr}="${val}" aria-pressed="${on}">${esc(label)}</button>`;
    const three = (html) => `<div class="rp-segment" style="grid-template-columns:repeat(3,1fr)">${html}</div>`;
    return `${chSheetHead("Change terms")}
      <p class="rp-sheet__sub">${esc(custName)} · ${esc(vehicleShort)}</p>
      ${isCash() ? "" : isLease()
        ? `<div class="rp-field"><span class="rp-field__label">Term</span>${three(RIDE_PRICE_DATA.leaseTerms.slice(0, 3).map(t => opt("lterm", t, t + " mo", deal.desk.leaseTerm === t)).join(""))}</div>
           <div class="rp-field"><span class="rp-field__label">Miles per year</span>${three(RIDE_PRICE_DATA.milesOptions.map(m2 => opt("miles", m2, (m2 / 1000) + "k", deal.desk.milesPerYear === m2)).join(""))}</div>
           <div class="rp-field"><label class="rp-field__label" for="dkDas">Due at signing</label><input class="rp-field__input" id="dkDas" type="number" step="100" value="${esc(String(deal.desk.dueAtSigning))}"></div>`
        : `<div class="rp-field"><span class="rp-field__label">Term</span>${three(GRID_TERMS.map(t => opt("term", t, t + " mo", deal.desk.term === t)).join(""))}</div>
           <div class="rp-field"><label class="rp-field__label" for="dkApr">APR %</label><input class="rp-field__input" id="dkApr" type="number" step="0.1" value="${esc(String(deal.desk.apr))}"></div>
           <div class="rp-field"><label class="rp-field__label" for="dkDown">Cash down</label><input class="rp-field__input" id="dkDown" type="number" step="100" value="${esc(String(deal.desk.downPayment))}"></div>`}
      <div class="rp-field"><label class="rp-field__label" for="dkRebate">Rebate — customer cash</label><input class="rp-field__input" id="dkRebate" type="number" step="100" value="${esc(String(deal.trade.rebates || 0))}"></div>
      <button type="button" class="rp-primary" id="dkTermsSave">Save terms</button>`;
  }
  function wireSheet(sheet) {
    $$("[data-acc]", sheet).forEach(b => b.onclick = () => {
      const id2 = b.dataset.acc;
      const at = deal.desk.accessories.indexOf(id2);
      if (at >= 0) deal.desk.accessories.splice(at, 1); else deal.desk.accessories.push(id2);
      Store.save(); draw();
    });
    $$("[data-term]", sheet).forEach(b => b.onclick = () => { deal.desk.term = parseInt(b.dataset.term, 10); Store.save(); draw(); });
    $$("[data-lterm]", sheet).forEach(b => b.onclick = () => { deal.desk.leaseTerm = parseInt(b.dataset.lterm, 10); Store.save(); draw(); });
    $$("[data-miles]", sheet).forEach(b => b.onclick = () => { deal.desk.milesPerYear = parseInt(b.dataset.miles, 10); Store.save(); draw(); });
    const save = $("#dkTermsSave", sheet);
    if (save) save.onclick = () => {
      const num = (sel, fallback) => { const el = $(sel, sheet); if (!el) return fallback; const n = parseFloat(el.value); return isFinite(n) && n >= 0 ? n : fallback; };
      deal.desk.apr = num("#dkApr", deal.desk.apr);
      deal.desk.downPayment = num("#dkDown", deal.desk.downPayment);
      deal.desk.dueAtSigning = num("#dkDas", deal.desk.dueAtSigning);
      deal.trade.rebates = num("#dkRebate", deal.trade.rebates || 0);
      Store.save(); ui.sheet = null; sheets.close(); draw();
    };
  }

  /* ---------- the frame ---------- */
  function render(content, dockHtml, mode) {
    const present = mode === "present";
    if (!ui.sheet) sheets.close();
    view().innerHTML = chShell({
      template: "task", title: custName, closeId: "dkClose",
      closeLabel: present ? "Done — back to work" : "Close",
      cls: present ? "rp-screen--present" : ""
    }, content, dockHtml, { scrim: "dkScrim", sheet: "dkSheet" });
    /* Close leaves the screen it is on: from present mode it is Done and hands
       the phone back to the advisor, from the option grid it returns to the
       pencil the grid was opened from, and from the pencil itself it leaves
       the task for the visit. A drill-down that could only go forward would
       be a dead end (§23). */
    $("#dkClose").onclick = () => {
      if (present || ui.mode === "options") { ui.mode = "pencil"; ui.sel = null; return draw(); }
      navigate(`#/discovery/${deal.id}`);
    };
    chWireRole(sheets, draw);
    $$("[data-acc]").forEach(b => { if (b.dataset.acc && ui.open[b.dataset.acc] !== undefined) b.onclick = () => { ui.open[b.dataset.acc] = !ui.open[b.dataset.acc]; draw(); }; });
    $$("[data-sheet-open]").forEach(b => b.onclick = () => { ui.sheet = b.dataset.sheetOpen; if (b.dataset.sheetOpen === "buyers") buyers = null; draw(); });
    /* the buyers sheet is its own module with its own states; the screen keeps
       the handle so a re-render reopens it where it was, not at the top */
    if (ui.sheet === "buyers") { if (buyers) buyers.open(); else buyers = buyersKitSheet(deal, sheets, () => draw()); }
    else if (ui.sheet) sheets.open(sheetHtml(), wireSheet);
  }
  let buyers = null;

  function draw() {
    if (ui.mode === "huddle") return huddleScreen();
    if (ui.mode === "options") return optionsScreen();
    if (ui.mode === "present") return presentScreen();
    if (ui.mode === "compare") return compareScreen();
    pencilScreen();
  }
  draw();
});

/* the full-page Compare route is retired: the comparison the customer sees
   is the present-mode one above (package v029). The hash stays a redirect so
   a bookmark or a history entry lands on the pencil rather than nowhere. */
route("compare/:id", ({ id }) => redirect(`#/desk/${id}`));

/* ============================================================
   VIEW: Base Payment Agreement
   ============================================================ */
route("agreement/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const v = Store.vehicle(deal.stock);
  const c = Store.customer(deal.customerId);
  const r = RIDE_PRICE_CALC.calc(deal, v);
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const isCash = deal.dealType === "cash";
  const signed = deal.basePayment && deal.basePayment.signedAt;

  renderChrome("Base Payment Agreement", dealTitle(deal), "");
  document.body.dataset.screen = "desk";
  document.body.dataset.canvas = "master";

  /* the figure the deal type actually produces — the unit word is derived,
     never assumed (review lesson 9) */
  const sumLabel = isCash ? "Estimated total due" : deal.dealType === "onepay" ? "Due at signing — One Pay" : "Base monthly payment";
  const sumAmt = isCash ? money(r.totalDue) : deal.dealType === "onepay" ? money(r.onePayTotal) : money(r.payment);
  const sumMeta = isCash ? "Cash purchase"
    : deal.dealType === "onepay" ? `${esc(String(r.term))} months · ${esc(r.miles.toLocaleString())} mi/yr · One-Pay Lease`
    : isLease ? `${esc(String(r.term))} months · ${esc(r.miles.toLocaleString())} mi/yr · Lease`
    : `${esc(String(r.term))} months · ${esc(String(r.apr))}% APR · Finance`;
  const vehMeta = `Your price ${money(r.yourPrice)} · ` + (isCash ? `Total due ${money(r.totalDue)}`
    : deal.dealType === "onepay" ? `One-pay total ${money(r.onePayTotal)}`
    : isLease ? `Due at signing ${money0(deal.desk.dueAtSigning)}`
    : `Total amount financed ${money(r.amountFinanced)}`);
  const dockUnit = isCash || deal.dealType === "onepay" ? "total" : "/ mo";

  const trow = (label, val, cls) => `<div class="bp-trow${cls ? " " + cls : ""}"><span>${label}</span><strong>${val}</strong></div>`;
  const sigName = signed ? (deal.basePayment.sigName || c.first + " " + c.last) : c.first + " " + c.last;
  const signedWhen = () => {
    const dt = new Date(deal.basePayment.signedAt);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " · " + dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  const jk = jacketCounts(deal);

  view().innerHTML = `${deskTop(deal)}
  <div class="dk-wrap">
    <div class="dk-eyebrow">DESKING</div>
    <h1>Base payment agreement</h1>

    <div class="dk-chips" style="margin-top:14px">
      <button type="button" class="dk-chip" data-buyers="${esc(deal.id)}">${rpIcon("user")} Buyer</button>
      <a class="dk-chip" href="#/jacket/${esc(deal.id)}">${rpIcon("folder")} Jacket ${esc(jacketChipText(deal))}</a>
      <button type="button" class="dk-linkbtn" id="bpRedesk">Redesk payment</button>
    </div>

    <div class="bp-summary" style="margin-top:18px">
      <div class="bp-sumtop">
        <div>
          <div class="bp-sumlabel">${sumLabel}</div>
          <div class="bp-payment">${esc(sumAmt)}</div>
          <div class="bp-paymeta">${sumMeta}</div>
        </div>
        <div class="bp-status${signed ? " bp-status--signed" : ""}">${signed ? "Signed" : "Ready to sign"}</div>
      </div>
      <div class="bp-divider"></div>
      <div class="bp-vehline">${esc(v.year)} ${esc(v.make)} ${esc(v.model)}</div>
      <div class="bp-vehmeta">${vehMeta}</div>
    </div>

    <div class="dk-section" style="border-top:0;padding-bottom:0">
      <h2 class="bp-h2">Agreement details</h2>
      <div class="bp-parties">
        <div class="bp-party"><div class="bp-pname">${esc(c.first)} ${esc(c.last)}</div>
          <div class="bp-pmeta">${esc(c.phone)}<br>${esc(c.email)}<br>${esc(c.address)}, ${esc(c.city)}, ${esc(c.state)} ${esc(c.zip)}</div></div>
        <div class="bp-party"><div class="bp-pname">${esc(Store.s.advisor)} — ${esc(RIDE_PRICE_DATA.dealership.name)}</div>
          <div class="bp-pmeta">${esc(RIDE_PRICE_DATA.dealership.phone)}<br>${esc(RIDE_PRICE_DATA.dealership.address)}<br>Date: ${esc(today())}</div></div>
      </div>
    </div>

    <div class="bp-terms" style="margin-top:22px">
      ${trow("Deal type", esc(DEAL_TYPES[deal.dealType]))}
      ${!isCash && !isLease ? trow("Term / APR", `${esc(String(r.term))} months / ${esc(String(r.apr))}%`) : ""}
      ${isLease ? trow("Term / Miles", `${esc(String(r.term))} months / ${esc(r.miles.toLocaleString())} mi-yr`) : ""}
      ${trow("MSRP", money(v.msrp))}
      ${trow("Selling price (incl. options)", money(v.selling + v.includedOptions))}
      ${trow("Accessories", money(r.accessories))}
      ${trow("Your price", money(r.yourPrice), "bp-trow--total")}
      ${deal.trade.rebates ? trow("Rebates", "−" + money(deal.trade.rebates)) : ""}
      ${deal.trade.value ? trow("Trade value / payoff", `${money(deal.trade.value)} / ${money(deal.trade.payoff || 0)}`) : ""}
      ${isLease ? trow("Residual (lease end value)", money(r.residual)) : ""}
      ${trow("Total taxes &amp; fees", money((r.taxes.total || 0) + RIDE_PRICE_CALC.totalFees()))}
      ${!isCash && !isLease ? trow("Down payment", money(deal.desk.downPayment))
        + trow("Total amount financed", money(r.amountFinanced), "bp-trow--total")
        + trow(`${esc(String(r.term))} monthly payments (inc. taxes)`, money(r.payment), "bp-trow--pay") : ""}
      ${deal.dealType === "lease" ? trow("Due at signing", money(deal.desk.dueAtSigning))
        + trow(`${esc(String(r.term))} monthly payments (inc. taxes)`, money(r.payment), "bp-trow--pay") : ""}
      ${deal.dealType === "onepay" ? trow("One-pay total due at signing", money(r.onePayTotal), "bp-trow--pay") : ""}
      ${isCash ? trow("Total due", money(r.totalDue), "bp-trow--pay") : ""}
    </div>

    <p class="bp-ack" style="margin-top:20px">I/We have agreed to an approximate base payment structure per the terms above. I/We understand these payment terms are based on a standard rate and are subject to the dealership's ability to obtain approval of the lending institution — the rate may be higher or lower based on my credit score and other factors lenders use in approving financing. <strong>This is a ballpark structure, not a purchase.</strong></p>

    ${signed ? `
    <div class="dk-section" style="border-top:0;padding-bottom:0">
      <h2 class="bp-h2">Agreement signed</h2>
      <div class="bp-signed">
        <div class="bp-signedhead"><div class="bp-check">✓</div>
          <div style="flex:1"><div class="bp-signedtitle">${esc(c.first)} ${esc(c.last)} acknowledged the base terms</div>
            <div class="bp-signedtime">Signed ${esc(signedWhen())}</div></div></div>
        <div class="bp-signedsig">${esc(sigName)}</div>
      </div>
      <div class="bp-actions">
        <a class="bp-actrow" href="#/print/${esc(deal.id)}/agreement"><span class="bp-actcopy"><strong>Print for deal folder</strong><small>Open the printable agreement</small></span><span class="bp-chev">›</span></a>
        <button type="button" class="bp-actrow" id="bpRedeskRow"><span class="bp-actcopy"><strong>Redesk payment</strong><small>Voids this signature and reopens desking</small></span><span class="bp-chev">›</span></button>
      </div>
    </div>` : `
    <div class="dk-section" style="border-top:0;padding-bottom:0">
      <h2 class="bp-h2">Sign agreement</h2>
      <div class="bp-signpanel">
        <label class="bp-lab" for="bpSig">Type name to sign</label>
        <input class="bp-nameinput" type="text" id="bpSig" value="${esc(sigName)}" autocomplete="off">
        <div class="bp-sigpreview" id="bpPreview">${esc(sigName)}</div>
        <div class="bp-sighelp">The typed name is recorded as the acknowledgement signature for this base payment structure.</div>
      </div>
    </div>`}

    <div class="desk-sticky">
      <div class="desk-sticky__copy"><span>${signed ? "Next step" : "Base payment"}</span>
        <div class="desk-sticky__val"><b>${esc(sumAmt)}</b><span class="desk-sticky__unit">${dockUnit}</span></div>
        <span class="desk-sticky__sub">${signed ? "Credit application unlocked" : "Ready for acknowledgement"}</span></div>
      <button type="button" class="btn btn--grad desk-sticky__go" id="bpDockGo">${signed ? "Continue" : "Sign agreement"}</button>
    </div>
  </div>
  <div class="m-scrim" id="bpScrim"><div class="m-sheet" role="dialog" aria-modal="true" aria-label="Redesk payment">
    <div class="m-handle"></div>
    <div class="m-sheettop"><div class="m-sheettitle">${signed ? "Void signature and redesk?" : "Return to desking?"}</div><button type="button" class="m-close" id="bpSheetClose" aria-label="Close">✕</button></div>
    <div class="bp-sheetcopy">${signed
      ? `Redesking voids the signed base payment agreement. <b>${esc(c.first)}</b> will need to review and sign the new structure before the credit application can continue.`
      : "Return to Calculate Payments to change the base structure before the customer signs."}</div>
    <div class="bp-highlight"><strong>${esc(sumAmt)}${isCash || deal.dealType === "onepay" ? " total" : " / month"}</strong><span>${sumMeta}</span></div>
    <div class="bp-sheetacts"><button type="button" class="m-ghost" id="bpSheetCancel">Cancel</button><button type="button" class="bp-danger" id="bpRedeskGo">${signed ? "Void &amp; redesk" : "Redesk payment"}</button></div>
  </div></div>`;

  wireDeskTop();

  const sig = $("#bpSig");
  if (sig) sig.oninput = (e) => { $("#bpPreview").textContent = e.target.value; };

  $("#bpDockGo").onclick = () => {
    if (signed) return navigate(`#/credit/${deal.id}`);
    const name = $("#bpSig").value.trim();
    if (!name) { toast("Enter the customer name before signing"); $("#bpSig").focus(); return; }
    deal.basePayment = { signedAt: new Date().toISOString(), sigName: name, snapshot: r };
    deal.stage = "credit"; Store.save(); router();
    toast("Base payment signed — client agreed to the ballpark structure");
  };

  /* redesk always confirms in the sheet — signed or not, it never voids on
     the first tap (the golden's interaction rule) */
  const scrim = $("#bpScrim");
  const openSheet2 = () => scrim.classList.add("show");
  const closeSheet2 = () => scrim.classList.remove("show");
  $("#bpRedesk").onclick = openSheet2;
  const row = $("#bpRedeskRow"); if (row) row.onclick = openSheet2;
  $("#bpSheetClose").onclick = closeSheet2;
  $("#bpSheetCancel").onclick = closeSheet2;
  scrim.onclick = (e) => { if (e.target === scrim) closeSheet2(); };
  $("#bpRedeskGo").onclick = () => {
    deal.basePayment = null;
    if (["signed", "credit"].includes(deal.stage)) deal.stage = "desking";
    Store.save(); navigate(`#/desk/${deal.id}`);
  };
});

/* ============================================================
   VIEW: Credit Application — the lending lane
   (owner's package v032, 2026-09-04, on the UI kit v022.18)
   ============================================================
   Eleven screens on one route, all of them the kit's Task with the customer's
   full name in the bar. This is the F&I push, so it is where the deal number
   is assigned and first shown (§16) — nothing before it displays one.

   The wizard's machinery is unchanged: one working copy `F`, `reqForStep()`
   per step honouring the conditional sections, validation on submit only,
   nothing saved or sent until every rule passes, the demo SSN rule, the masks,
   and the payload written field for field. What changed is everything the
   advisor sees, and three rules that are not cosmetic:

   §18b — verified record data is a READ-ONLY block, never a prefilled input
   that can fall behind the dock. On step 1 the name, date of birth and the
   licence verified at the gate collapse into one expandable row, and the SSN
   is the only field to type.

   §19 — a joint application cannot go to a lender until BOTH applicants have
   complete fields, verified identity and joint-credit authorization. Internal
   completion is not lender submission, so the primary action names which one
   it is: "Fix John's items" with gaps, "Mark John ready · waiting on Cheri"
   when only his half is done, and "Review & submit to lenders" only when both
   halves exist. One panel per applicant — one person's actionable items are
   never mixed with another's blocked ones.

   §17a — a validation summary reviews the whole draft, so it sits at Review ·
   4 of 4 rather than sending the step indicator backwards; tapping a named
   item is what navigates to that field's step.

   §17 — the deal summary reconciles on the screen: every line the total
   depends on is drawn, fees are itemised, the tax names its base, and the
   approval states the difference in the customer's unit (the payment), with
   both totals of payments and their arithmetic on their own rows. */
/* a route can be re-entered without a hashchange — renderChrome() calls
   router() on a role switch, and the buyers sheet calls it on every change —
   so the credit lane's delegated input writer keeps its removal handle out
   here, where a second entry can find it. A stale one holds an older F and
   writes into a form nobody is looking at. */
let creditInputOff = null;
/* what the advisor has typed but not yet marked ready. The route can be
   re-entered without a hashchange — the buyers sheet calls router() on every
   change, renderChrome() calls it on a role switch — and F is a fresh object
   literal each time, so without this the keystrokes since the last save are
   lost. Kept out here for exactly as long as the route is the current screen;
   the teardown that removes the input listener clears it too. */
let creditWorking = null;
route("credit/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  /* a truthy stock is not a resolved vehicle, and the approved screen prices
     against the unit — same guard, same destination as the menu, the print
     centre and the test drive. It REPLACES rather than pushes: navigate()
     would leave this hash in the history, so Back would land on it, run the
     guard again, and add another entry each time (review, #88). */
  if (!deal.stock || !Store.vehicle(deal.stock)) return redirect("#/deals");
  /* and a cash purchase has no lender, so it has no application. The rest of
     the app already knows: jacketDocs() files neither lending-lane record for
     a cash deal, and cash() returns no term and no amount financed, so the
     deal summary read an undefined total of payments. The lane does not open,
     and it says why rather than bouncing in silence (§23). */
  if (deal.dealType === "cash") {
    toast("A cash purchase has no credit application");
    return redirect(`#/desk/${deal.id}`);
  }
  const c = Store.customer(deal.customerId);
  const app = deal.creditApp;

  renderChrome("Credit Application", "", "");
  document.body.dataset.screen = "credit";
  document.body.dataset.canvas = "kit";

  /* resolve the record, not just the id — a dangling coBuyerId must behave as
     "no co-buyer" here exactly as it does in dealTitle() and the submit guard */
  const cbRec = () => deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;

  const v = Store.vehicle(deal.stock);
  const r = RIDE_PRICE_CALC.calc(deal, v);
  const custName = `${c.first} ${c.last}`;
  /* the legal name is the name as the license reads it — a different field
     from the display name the chrome uses (§20) */
  const legalName = [c.first, c.middle, c.last].filter(Boolean).join(" ");
  const scanned = !!(c.dob && c.license && c.license.number);
  const timeUS = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const sheets = chSheetOpener("caScrim", "caSheet", () => { ui.sheet = null; });
  const ui = { sheet: null, recordOpen: false, channel: null, mode: null };

  /* the wizard's working copy — inputs write here and submit validates here,
     so a step that is not in the DOM still validates (the golden's own
     data + requiredByStep architecture). Prefills come from the record. */
  const F = {
    appType: cbRec() ? "joint" : "individual",
    creditType: deal.dealType === "lease" || deal.dealType === "onepay" ? "Lease" : "Retail",
    primaryUse: "Personal, family or household",
    first: c.first, middle: c.middle || "", last: c.last,
    dob: dateUS(c.dob || ""), ssn: "", dl: (c.license && c.license.number) || deal.testDrive.license || "",
    phone: c.phone, email: c.email, marital: "",
    coRel: "Joint Applicant", coFirst: "", coLast: "", coDob: "", coDl: "", coAddr: "", coZip: "", coCity: "", coState: "",
    address: c.address, zip: c.zip, city: c.city, state: c.state,
    housing: "Own", housePmt: "", resYrs: "3", prevAddr: "",
    mailDiff: false, mailAddr: "", mailZip: "", mailCity: "", mailState: "",
    employer: "", occupation: "", empPhone: "", empYrs: "4",
    income: "", otherIncome: "", otherSource: "",
    prevEmp: "", prevOcc: "", prevEmpYrs: "",
    selfEmp: false, dBk: false, dBkNote: "", dAlias: false, dAliasNote: "", dRepo: false, dRepoNote: "",
    refsOpen: false, refBank: "", refAcctType: "", refKinName: "", refKinPhone: "", refKinRel: "", refP1: "", refP2: "",
    consent: false
  };
  /* co-applicant identity prefills from the record, never from typed state */
  const seedCo = () => {
    const cb = cbRec(); if (!cb) return;
    Object.assign(F, { coFirst: cb.first, coLast: cb.last, coDob: dateUS(cb.dob || ""), coDl: (cb.license && cb.license.number) || "", coAddr: cb.address || "", coZip: cb.zip || "", coCity: cb.city || "", coState: cb.state || "" });
  };
  /* a draft the advisor already marked ready comes back the way they left it,
     and anything typed since then comes back on top of it — a re-entry is not
     a new visit. The co-applicant is reseeded LAST, because identity prefills
     from the record and never from typed state: parking a deal and then
     replacing the co-buyer would otherwise reopen the application with the new
     person's name beside the previous person's date of birth, licence and
     address, and submit() would persist it. */
  if (deal.creditApp && deal.creditApp.draft) Object.assign(F, deal.creditApp.draft);
  if (creditWorking && creditWorking.id === deal.id) Object.assign(F, creditWorking.form);
  seedCo();
  creditWorking = { id: deal.id, form: F, step: creditWorking && creditWorking.id === deal.id ? creditWorking.step : null };

  const STEP_NAMES = ["Applicant", "Residence", "Employment", "Review"];
  const st = { step: 1, err: null };

  const under3 = (x) => { const n = parseFloat(x); return !isNaN(n) && n < 3; };
  /* required keys per step, honouring the conditional sections — a section
     that is not active requires nothing */
  const reqForStep = (n) => {
    if (n === 1) {
      /* the SSN is the only field on this step, and that is the point (§18b):
         name, date of birth and the licence are verified record data shown
         read-only, so they cannot be required here — a required item with no
         input to fix it is a dead end, and what is genuinely absent from the
         record is reported by the identity gate above, whose fix is to scan
         the licence in the resolver. The co-buyer's identity comes from her
         own record the same way, so it is required only once she is attached
         and only as far as her record can answer. */
      const ks = [["ssn", "Social Security number"]];
      if (F.appType === "joint" && cbRec()) ks.push(["coFirst", "Co-buyer first name"], ["coLast", "Co-buyer last name"]);
      return ks;
    }
    if (n === 2) {
      const ks = [["address", "Address"], ["housePmt", "Monthly rent or mortgage"], ["resYrs", "Time at address"]];
      if (under3(F.resYrs)) ks.push(["prevAddr", "Previous address"]);
      return ks;
    }
    if (n === 3) {
      const ks = [["employer", "Employer"], ["occupation", "Occupation"], ["empYrs", "Time at employer"], ["income", "Gross monthly income"]];
      if (under3(F.empYrs)) ks.push(["prevEmp", "Previous employer"]);
      if (F.dBk) ks.push(["dBkNote", "Bankruptcy explanation"]);
      if (F.dAlias) ks.push(["dAliasNote", "Alias explanation"]);
      if (F.dRepo) ks.push(["dRepoNote", "Repossession explanation"]);
      return ks;
    }
    return [];
  };
  const DATE_KEYS = ["dob", "coDob"];
  /* MISSING and INVALID are two different states with two different words and
     two different counts (§19): a field that holds a value is never reported
     as missing, and the demo's SSN rule produces an invalid, not a gap. */
  const problem = (key) => {
    const val2 = String(F[key] || "").trim();
    if (!val2) return { kind: "missing", msg: "Required" };
    if (key === "ssn" && val2.replace(/\D/g, "") !== "000000000") return { kind: "invalid", msg: "this demo accepts 000-00-0000" };
    if (DATE_KEYS.includes(key) && !dateISO(val2)) return { kind: "invalid", msg: "enter MM/DD/YYYY" };
    return null;
  };
  /* every problem on the primary applicant's FIELDS, with the step each lives
     on. The electronic signature is deliberately not among them: it is not a
     field the lender asks for, it is the applicant's signature, and mixing it
     into the tally would make the count disagree with the list beside it
     (review lesson 7). It is its own row, with its own status. */
  function johnProblems() {
    const out = [];
    for (const n of [1, 2, 3]) for (const [k, label] of reqForStep(n)) {
      const p = problem(k);
      if (p) out.push({ k, label, n, kind: p.kind, msg: p.msg });
    }
    return out;
  }
  const johnFieldsComplete = () => johnProblems().length === 0;
  const johnComplete = () => johnFieldsComplete() && F.consent;
  const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
  const countWord = (n) => WORDS[n] || String(n);

  /* the co-buyer's own half, which the advisor cannot fill: her identity, her
     fields, and the joint-credit authorization only she can give (§19). Absent
     is Waiting — never false, and never assumed done. */
  const coState = () => {
    const rec = (deal.creditRemote && deal.creditRemote.cobuyer) || {};
    return {
      rec, sent: !!rec.sentAt, opened: !!rec.openedAt,
      identity: !!rec.identityAt, fields: !!rec.fieldsAt, authorized: !!rec.authorizedAt,
      complete: !!(rec.identityAt && rec.fieldsAt && rec.authorizedAt)
    };
  };
  const isJoint = () => F.appType === "joint";

  /* ---------------- the kit pieces ---------------- */
  const chipRow = () => `<div class="rp-chiprow">
    <button type="button" class="rp-chip" data-buyers-open>Buyers · ${1 + (cbRec() ? 1 : 0)}</button>
    ${r ? `<button type="button" class="rp-chip" data-sheet-open="summary">Deal summary</button>` : ""}
    ${chJacketChip(deal)}
  </div>`;

  const subLine = () => `<p class="rp-count" style="margin-bottom:12px">Deal #${esc(deal.dealNo)}${v ? ` · ${esc(v.year + " " + v.model + (v.trim ? " " + v.trim : ""))}` : ""}</p>`;

  const stepBar = (name, i) => `<div class="rp-steps-bar"><span class="rp-steps-bar__name">${esc(name)}</span><span class="rp-steps-bar__pos">Step ${i} of 4</span></div>
    <div class="rp-progress"><div class="rp-progress__bar" style="width:${Math.round(i / 4 * 100)}%"></div></div>`;

  const fieldErr = (key) => st.err && st.err.keys.has(key);
  const field = (label, key, opts = {}) => `
    <div class="rp-field${fieldErr(key) ? " rp-field--error" : ""}">
      <label class="rp-field__label" for="ca_${key}">${esc(label)}</label>
      <input class="rp-field__input" id="ca_${key}" data-key="${key}" ${opts.date ? `data-date maxlength="10" inputmode="numeric"` : ""} ${opts.ssn ? `data-ssn maxlength="11" inputmode="numeric"` : ""} ${opts.zip ? `data-zip="${opts.zip}" maxlength="5" inputmode="numeric"` : ""} ${opts.type ? `type="${opts.type}"` : `type="text"`} ${opts.inputmode && !opts.date && !opts.ssn && !opts.zip ? `inputmode="${opts.inputmode}"` : ""} value="${esc(F[key])}" placeholder="${esc(opts.placeholder || "")}">
      ${fieldErr(key) ? `<div class="rp-field__err">${esc(st.err.keys.get(key))}</div>` : ""}</div>`;
  const option = (title, sub, on, attrs) => `<button type="button" class="rp-option${on ? " rp-option--on" : ""}" ${attrs}>
    <span><span class="rp-option__title">${esc(title)}</span>${sub ? `<span class="rp-option__sub">${esc(sub)}</span>` : ""}</span>
    <span class="rp-radio${on ? " rp-radio--on" : ""}">${on ? rpGlyph("check") : ""}</span></button>`;
  /* the kit's segment is two columns; a wider one carries the board's own
     inline template, reported rather than restyled */
  const segment = (options, key) => `<div class="rp-segment"${options.length !== 2 ? ` style="grid-template-columns:repeat(${options.length},1fr)"` : ""}>
    ${options.map(o => `<button type="button" class="rp-segment__item${F[key] === o ? " rp-segment__item--on" : ""}" data-seg="${key}" data-val="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
  const toggleRow = (label, key) => `<button type="button" class="rp-toggle-row" style="width:100%" data-flag="${key}" aria-pressed="${F[key] ? "true" : "false"}">${esc(label)}
    <span class="rp-toggle${F[key] ? " rp-toggle--on" : ""}"></span></button>`;
  const kvRow = (label, val, src) => `<div class="rp-kv__row${src ? " rp-kv__row--src" : ""}"><span>${label}</span><span>${val}</span>${src ? `<span class="rp-kv__src">${src}</span>` : ""}</div>`;
  const stepRow = (title, sub, status, done) => `<div class="rp-step">
    <span class="rp-step__mark${done ? " rp-step__mark--done" : ""}">${done ? rpGlyph("check") : ""}</span>
    <div><span class="rp-step__title">${esc(title)}</span><span class="rp-step__sub">${esc(sub)}</span></div>
    <span class="rp-status${done ? " rp-status--positive" : ""}">${esc(status)}</span></div>`;

  /* one applicant panel. A blocked panel's actions are still drawn — they are
     the advisor's escape hatches — but none of them is the primary, because
     none of them is the advisor's own work to do (§19). */
  function applPanel(o) {
    const initials = o.name.split(" ").slice(0, 2).map(w => w[0]).join("");
    const items = (o.items || []).map(x => `<li>${x}</li>`).join("");
    const ctas = (o.ctas || []).map((x, i) => `<button type="button" class="${i === 0 && !o.blocked ? "rp-appl__cta--primary" : ""}" data-appl-cta="${esc(x.act)}">${esc(x.label)}</button>`).join("");
    return `<div class="rp-appl${o.blocked ? " rp-appl--blocked" : ""}">
      <div class="rp-appl__bar${o.ok ? "" : " rp-appl__bar--wait"}"><i style="width:${o.pct}%"></i></div>
      <div class="rp-appl__head"><span class="rp-initials">${esc(initials)}</span>
        <span class="rp-row__body"><span class="rp-appl__name">${esc(o.name)}</span><span class="rp-appl__role">${esc(o.role)}</span></span>
        <span class="rp-status${o.ok ? " rp-status--positive" : ""}">${esc(o.status)}</span></div>
      ${items || ctas ? `<div class="rp-appl__body">${items ? `<ul>${items}</ul>` : ""}<div class="rp-appl__cta">${ctas}</div></div>` : ""}</div>`;
  }

  /* ---------------- 01 / 02 · the identity gate ---------------- */
  /* the capture uses the phone's own camera through a file input (invariant 5
     — no getUserMedia, so it works over LAN http); the photo is never read or
     stored, and the checklist says a photo was captured and discarded. It
     never claims a face was matched. */
  function identityScreen(verified) {
    const lic = c.license && c.license.number;
    const licSub = lic ? `${esc((c.license.state || "NY"))} · ending ${esc(String(lic).slice(-4))} · scanned` : "Not on file — scan it in the resolver";
    const list = verified
      ? `<div class="rp-steps">
          ${stepRow("Photo captured", "Confirmed on this device, then discarded", "Done", true)}
          ${stepRow("Driver's license", licSub, lic ? "On file" : "Needed", !!lic)}
          ${stepRow("Phone and email", "Both on record", "On file", true)}</div>`
      : `<div class="rp-steps">
          ${stepRow("Driver's license", licSub, lic ? "On file" : "Needed", !!lic)}
          ${stepRow("Phone", c.phone, "On file", true)}
          ${stepRow("Email", c.email, "On file", true)}
          ${stepRow("Photo of the customer", "Confirms the person matches the license", "Needed", false)}</div>`;
    const content = `<div class="rp-eyebrow">Identity verification</div>
      <h1 class="rp-title" style="font-size:26px">${verified ? "Identity verified" : "Verify your identity"}</h1>
      <div class="rp-idgate"><div class="rp-idgate__ring${verified ? " rp-idgate__ring--ok" : ""}"><i>${verified ? rpGlyph("check") : rpGlyph("customers")}</i></div>
        <div class="rp-idgate__title">${verified ? "Verified" : "Take a quick photo"}</div></div>
      ${list}`;
    const dock = verified
      ? chDock(`<button type="button" class="rp-primary" id="caIdGo">Continue to the application</button>`)
      : chDock(`<label class="rp-primary" style="display:grid;place-items:center">Take photo<input type="file" accept="image/*" capture="user" data-idcap hidden></label>`,
        `<button type="button" class="rp-link" data-sheet-open="link-applicant">Send a secure link to their phone</button>`);
    paint(content, dock);
    $$("[data-idcap]").forEach(inp => inp.onchange = (e) => {
      if (!e.target.files || !e.target.files.length) return; /* a cancelled picker verifies nothing */
      deal.identity = { verifiedAt: new Date().toISOString() };
      /* his identity record is a document, and it files here (§19a) */
      jacketReceive(deal, "idverify-primary", "app");
      Store.save();
      ui.mode = "identity-ok"; draw();
    });
    const go = $("#caIdGo"); if (go) go.onclick = () => { ui.mode = "wizard"; draw(); };
  }

  /* ---------------- 03–06 · the four-step wizard ---------------- */
  function applicantStep() {
    const co = cbRec();
    const cs = coState();
    const joint = isJoint();
    const coPaths = `<div class="rp-section">Co-buyer</div>
      <div class="rp-group">
        <button type="button" class="rp-row" data-sheet-open="link-cobuyer"><span class="rp-tile">${rpGlyph("upload")}</span>
          <span class="rp-row__body"><span class="rp-row__title">Send a secure link</span><span class="rp-row__sub">They complete their part from their own phone</span></span>
          <span class="rp-row__chevron"></span></button>
        <button type="button" class="rp-row" id="caCoScan"><span class="rp-tile">${rpGlyph("license")}</span>
          <span class="rp-row__body"><span class="rp-row__title">Scan their license</span><span class="rp-row__sub">They are here in the showroom</span></span>
          <span class="rp-row__chevron"></span></button>
        <button type="button" class="rp-row" data-buyers="${esc(deal.id)}"><span class="rp-tile">${rpGlyph("customers")}</span>
          <span class="rp-row__body"><span class="rp-row__title">Choose an existing customer</span><span class="rp-row__sub">Already in the CRM</span></span>
          <span class="rp-row__chevron"></span></button>
      </div>`;
    /* an attached co-buyer is a person on the deal, not a form to fill: her
       identity comes from her own record and her progress from her own link */
    const coAttached = co ? `<div class="rp-section">Co-buyer</div>
      ${applPanel({
        name: `${co.first} ${co.last}`, role: "Co-buyer · joint",
        status: cs.complete ? "Complete" : cs.sent ? "Waiting" : "Not started", ok: cs.complete,
        pct: cs.complete ? 100 : cs.identity ? 66 : cs.opened ? 34 : cs.sent ? 18 : 8,
        blocked: !cs.complete,
        items: cs.complete ? [] : [
          `Identity verification — ${cs.identity ? `verified ${esc(timeUS(cs.rec.identityAt))}` : cs.opened ? `link opened ${esc(timeUS(cs.rec.openedAt))}` : cs.sent ? "waiting on her link" : "no link sent yet"}`,
          `Her residence, employment and income — ${cs.fields ? "submitted" : "waiting"}`,
          `Joint credit authorization — ${cs.authorized ? "signed" : "waiting"}`
        ],
        ctas: cs.complete ? [] : [{ act: "resend", label: `Resend the ${esc(channelWord())} to ${esc(co.first)}` }, { act: "showroom", label: "She is in the showroom" }]
      })}` : coPaths;

    return `<div class="rp-section">Application type</div>
      ${option("Individual application", "One applicant completes this application", !joint, `data-atype="individual"`)}
      ${option("Joint application", "A co-buyer applies with them. In accordance with Regulation B, you certify they are applying for joint credit.", joint, `data-atype="joint"`)}
      ${joint ? coAttached : ""}
      <div class="rp-section">Applicant</div>
      ${field("Social Security number", "ssn", { ssn: true, placeholder: "000-00-0000" })}
      <p class="rp-fine" style="text-align:left;margin:-6px 0 14px">The only applicant field the record does not hold.</p>
      <div class="rp-acc">
        <button type="button" class="rp-acc__head" style="width:100%" data-record aria-expanded="${ui.recordOpen}">Full legal name, date of birth, license
          <span class="rp-acc__sum">From the record</span>${ui.recordOpen ? rpGlyph("chevron-down").replace('class="rp-icon"', 'class="rp-icon" style="transform:rotate(180deg)"') : rpGlyph("chevron-down")}</button>
        ${ui.recordOpen ? `<div class="rp-acc__body">
          ${kvRow("Full legal name", esc(legalName))}
          ${kvRow("Date of birth", esc(F.dob || "Not on file"))}
          ${kvRow("Driver's license", esc(F.dl || "Not on file"))}
        </div>` : ""}
      </div>
      <p class="rp-fine" style="text-align:left;margin:-4px 0 0">Verified on the previous step · tap to review, nothing to retype</p>
      <div class="rp-section" style="margin-top:20px">Credit type</div>
      ${segment(["Retail", "Lease", "Balloon"], "creditType")}`;
  }

  function residenceStep() {
    return `<div class="rp-section">Residence</div>
      ${field("Street address", "address")}
      ${field("ZIP code", "zip", { zip: "city,state" })}
      ${field("City", "city")}
      ${field("State", "state")}
      <div class="rp-section">Residential status</div>
      ${segment(["Own", "Rent", "Buying", "Parents", "Other"], "housing")}
      ${field("Monthly rent or mortgage", "housePmt", { inputmode: "numeric", placeholder: "1,800" })}
      ${field("Time at address (years)", "resYrs", { inputmode: "decimal" })}
      ${under3(F.resYrs) ? field("Previous full address", "prevAddr", { placeholder: "Street, city, state, ZIP" }) : ""}
      ${toggleRow("Mailing address is different", "mailDiff")}
      ${F.mailDiff ? `<div style="height:12px"></div>${field("Mailing address", "mailAddr")}${field("ZIP code", "mailZip", { zip: "mailCity,mailState" })}${field("City", "mailCity")}${field("State", "mailState")}` : ""}`;
  }

  function employmentStep() {
    return `<div class="rp-section">Employment and income</div>
      ${field("Employer", "employer", { placeholder: "Employer name" })}
      ${field("Occupation", "occupation", { placeholder: "e.g. Project manager" })}
      ${field("Employer phone", "empPhone", { type: "tel", placeholder: "(000) 000-0000" })}
      ${field("Time at employer (years)", "empYrs", { inputmode: "decimal" })}
      ${field("Gross monthly income", "income", { inputmode: "numeric", placeholder: "6,500" })}
      ${field("Other monthly income", "otherIncome", { inputmode: "numeric", placeholder: "0" })}
      ${field("Other income source", "otherSource", { placeholder: "e.g. rental income" })}
      ${under3(F.empYrs) ? field("Previous employer", "prevEmp") + field("Previous occupation", "prevOcc") + field("Years there", "prevEmpYrs", { inputmode: "decimal" }) : ""}
      ${toggleRow("Self-employed", "selfEmp")}
      <div class="rp-section" style="margin-top:20px">Disclosures</div>
      ${toggleRow("Filed bankruptcy?", "dBk")}${F.dBk ? `<div style="height:12px"></div>${field("Please explain", "dBkNote")}` : ""}
      ${toggleRow("Obtained credit under another name?", "dAlias")}${F.dAlias ? `<div style="height:12px"></div>${field("Please explain", "dAliasNote")}` : ""}
      ${toggleRow("Had a vehicle repossessed?", "dRepo")}${F.dRepo ? `<div style="height:12px"></div>${field("Please explain", "dRepoNote")}` : ""}
      <div style="height:14px"></div>
      ${toggleRow("Bank and references (optional)", "refsOpen")}
      ${F.refsOpen ? `<div style="height:12px"></div>
        ${field("Bank reference", "refBank", { placeholder: "Bank or credit union name" })}
        ${field("Nearest relative not living with you", "refKinName", { placeholder: "Name" })}
        ${field("Relative's phone", "refKinPhone", { type: "tel", placeholder: "(000) 000-0000" })}
        ${field("Relationship", "refKinRel", { placeholder: "e.g. sister" })}
        ${field("Personal reference", "refP1", { placeholder: "Name · phone" })}
        ${field("Personal reference 2", "refP2", { placeholder: "Name · phone" })}` : ""}`;
  }

  /* Review is where the whole draft is judged (§17a), so the validation
     summary and the applicant panels live here — never on the step of the
     first offending field. */
  function reviewStep() {
    const co = cbRec(), cs = coState();
    const probs = johnProblems();
    const missing = probs.filter(p => p.kind === "missing").length;
    const invalid = probs.filter(p => p.kind === "invalid").length;
    /* the summary is its own kind of error — a joint application with nobody
       attached has no field to mark, and gating on johnProblems() alone left
       the advisor tapping submit with nothing on the screen changing */
    const showErrors = !!st.err && (!johnComplete() || !!st.err.summary);
    /* the head counts in words and the panel in digits, as the board writes
       them; both count the same set — the fields */
    const errHead = probs.length
      ? `${countWord(missing)} missing · ${countWord(invalid)} invalid`.replace(/^./, ch => ch.toUpperCase())
      : "Electronic signature needed";
    const johnItems = probs.map(p => `${esc(p.label)} — ${p.kind === "invalid" ? `<i>invalid</i> · ${esc(p.msg)}` : `<b>missing</b>`}`);
    /* the signature is a separate condition, so it is a separate row and it is
       never counted among the fields */
    if (johnFieldsComplete() && !F.consent) johnItems.push("Electronic signature — <b>not accepted</b>");

    const johnPanel = applPanel({
      name: `${c.first} ${c.last}`, role: isJoint() ? "Primary applicant · joint" : "Applicant",
      status: johnComplete() ? "Complete" : probs.length ? `${missing} missing · ${invalid} invalid` : "Signature needed",
      ok: johnComplete(), pct: johnComplete() ? 100 : Math.max(20, Math.round(100 - probs.length * 9)),
      items: johnComplete() ? [] : johnItems,
      ctas: johnComplete() ? [{ act: "answers-john", label: "View his answers" }] : [{ act: "fix", label: `Fix ${esc(c.first)}'s items` }]
    });
    const coPanel = co ? applPanel({
      name: `${co.first} ${co.last}`, role: "Co-buyer · joint",
      status: cs.complete ? "Complete" : "Waiting", ok: cs.complete,
      pct: cs.complete ? 100 : cs.identity ? 66 : cs.opened ? 34 : cs.sent ? 18 : 8,
      blocked: !cs.complete,
      items: cs.complete ? [] : [
        `Identity verification — ${cs.identity ? `verified ${esc(timeUS(cs.rec.identityAt))}` : cs.opened ? `link opened ${esc(timeUS(cs.rec.openedAt))}` : cs.sent ? "waiting on her link" : "no link sent yet"}`,
        `Her residence, employment and income — ${cs.fields ? "submitted" : "not started"}`,
        `Joint credit authorization — ${cs.authorized ? "signed" : "waiting"}`
      ],
      ctas: cs.complete ? [{ act: "answers-co", label: "View her answers" }] : [{ act: "resend", label: `Resend the ${esc(channelWord())} to ${esc(co.first)}` }, { act: "showroom", label: "She is in the showroom" }]
    }) : "";

    const ready = isJoint() && co && johnComplete() && cs.complete;
    /* a summary error names a condition rather than a field, so it heads the
       block itself and the count follows what is actually listed */
    const summaryErr = st.err && st.err.summary && johnComplete() ? st.err.summary : "";
    return `${showErrors ? `<div class="rp-errors"><div class="rp-errors__head"><span class="rp-tile">${summaryErr ? 1 : probs.length || 1}</span>${esc(summaryErr || errHead)}</div>
      <ul>${summaryErr ? `<li>Attach the co-buyer, or change the application to an individual one.</li>` : ""}<li>Nothing has been saved or sent.${co && !cs.complete ? ` ${esc(co.first)}'s items are not yours to fix.` : ""}</li></ul></div>` : ""}
      ${isJoint() ? `<div class="rp-section">Applicants</div>${johnPanel}${coPanel}` : `<div class="rp-section">Applicant</div>${johnPanel}`}
      ${ready ? `<div class="rp-kv"><div class="rp-kv__head">Ready for lenders</div>
        ${kvRow("Both identities verified", "Photo against each license")}
        ${kvRow("Joint credit authorization", "Signed by both")}
        ${kvRow("Fields complete", "Applicant, residence, employment, review")}</div>` : ""}
      ${johnComplete() ? "" : `<div class="rp-section">Consent</div>
        ${option("Electronic signature and credit authorization", "Checking this is the applicant's electronic signature, authorizing Ride Price to obtain credit bureau reports. Demo — no real inquiry ever occurs.", F.consent, `data-flag="consent"`)}`}`;
  }

  /* the dock says which action this is: internal completion or lender
     submission — never "submit to lenders" before both halves exist (§19) */
  function reviewDock() {
    const co = cbRec(), cs = coState();
    if (isJoint() && co && johnComplete() && cs.complete) {
      return chDock(`<button type="button" class="rp-primary" id="caGo">Review &amp; submit to lenders</button>`,
        `<button type="button" class="rp-link" id="caBack">Back to the application</button>`);
    }
    if (isJoint() && co && johnComplete()) {
      return `<div class="rp-dock">
        <div class="rp-gatenote">Regulation B — both applicants must authorize the joint credit pull</div>
        <button type="button" class="rp-primary" id="caMarkReady">Mark ${esc(c.first)} ready · waiting on ${esc(co.first)}</button>
        <button type="button" class="rp-link" id="caPark">Park the deal</button></div>`;
    }
    if (isJoint() && co) {
      return `<div class="rp-dock">
        <div class="rp-gatenote">A joint application goes to lenders only when both applicants are complete</div>
        <button type="button" class="rp-primary" id="caGo">Fix ${esc(c.first)}'s items</button></div>`;
    }
    return chDock(`<button type="button" class="rp-primary" id="caGo">${johnComplete() ? "Review &amp; submit to lenders" : "Submit application"}</button>`);
  }

  function wizardScreen() {
    const body = st.step === 1 ? applicantStep() : st.step === 2 ? residenceStep() : st.step === 3 ? employmentStep() : reviewStep();
    const content = `<div class="rp-eyebrow">Lending lane</div>
      <h1 class="rp-title" style="font-size:26px">Credit application</h1>
      ${subLine()}
      ${chipRow()}
      ${stepBar(STEP_NAMES[st.step - 1], st.step)}
      ${body}`;
    const dock = st.step < 4
      ? chDock(`<button type="button" class="rp-primary" id="caGo">Next: ${esc(STEP_NAMES[st.step])}</button>`)
      : reviewDock();
    paint(content, dock, st.step === 4 ? "rp-screen--gate" : "");

    $$("[data-atype]").forEach(el => el.onclick = () => { F.appType = el.dataset.atype; draw(); });
    $$("[data-seg]").forEach(b => b.onclick = () => { F[b.dataset.seg] = b.dataset.val; draw(); });
    $$("[data-flag]").forEach(b => b.onclick = () => { F[b.dataset.flag] = !F[b.dataset.flag]; draw(); });
    const rec = $("[data-record]"); if (rec) rec.onclick = () => { ui.recordOpen = !ui.recordOpen; draw(); };
    const scan = $("#caCoScan"); if (scan) scan.onclick = () => coScan();
    $$("[data-appl-cta]").forEach(b => b.onclick = () => applAction(b.dataset.applCta));
    const go = $("#caGo");
    if (go) go.onclick = () => {
      if (st.step < 4) { st.step++; st.err = null; draw(); return; }
      submit();
    };
    const back = $("#caBack"); if (back) back.onclick = () => { st.step = 1; draw(); };
    const mark = $("#caMarkReady"); if (mark) mark.onclick = () => markReady();
    const park = $("#caPark"); if (park) park.onclick = () => { markReady(true); navigate("#/deals"); };
  }

  /* an applicant panel's own actions */
  function applAction(act) {
    /* tapping a named item is what navigates to that field's step (§17a); with
       the fields done, the one thing left is the signature, which is here */
    if (act === "fix") { const p = johnProblems()[0]; if (p) { st.step = p.n; draw(); } return; }
    if (act === "resend") { ui.sheet = "link-cobuyer"; draw(); return; }
    if (act === "showroom") { coScan(); return; }
    if (act === "answers-john") { ui.sheet = "answers-john"; draw(); return; }
    if (act === "answers-co") { ui.sheet = "answers-co"; draw(); return; }
  }
  /* the co-buyer scan returns into THIS flow rather than rebuilding the route
     from scratch, so the step and the draft survive it */
  function coScan() {
    openScanFlow({ mode: "cobuyer", deal, onDone: () => {
      const cb = cbRec();
      if (cb) {
        /* she was verified in person: that is her identity record, and it
           files as her own document (§19a) */
        deal.creditRemote = deal.creditRemote || {};
        const rec = deal.creditRemote.cobuyer = deal.creditRemote.cobuyer || {};
        if (!rec.identityAt) { rec.identityAt = new Date().toISOString(); jacketReceive(deal, "idverify-cobuyer", "app"); }
        Store.save();
        seedCo();
      }
      document.body.dataset.canvas = "kit";
      draw();
    } });
  }
  const channelWord = () => {
    const rec = (deal.creditRemote && deal.creditRemote.cobuyer) || {};
    return rec.channel === "email" ? "email" : "text";
  };

  function markReady(parked) {
    const a = deal.creditApp = deal.creditApp || {};
    a.status = "pending-cobuyer";
    a.primaryReadyAt = new Date().toISOString();
    a.draft = Object.assign({}, F);
    Store.save();
    if (!parked) draw();
  }

  /* ---------------- the sheets ---------------- */
  function sheetHtml() {
    const co = cbRec(), cs = coState();
    if (ui.sheet === "summary") return summarySheet();
    if (ui.sheet === "answers-john" || ui.sheet === "answers-co") return answersSheet(ui.sheet === "answers-co");
    /* the link sheet takes ONE channel, chosen on a segment as the resolver's
       does, so the status view can name the channel actually used */
    const toCo = ui.sheet === "link-cobuyer";
    const who = toCo ? co : c;
    const rec = toCo ? cs.rec : ((deal.creditRemote && deal.creditRemote.applicant) || {});
    const name = who ? `${who.first} ${who.last}` : "the co-buyer";
    const ctx = `Deal #${esc(deal.dealNo)} · ${esc(custName)}${toCo ? ` · joint application · to ${esc(name)}` : ""}`;
    if (rec.sentAt) {
      /* the status view: it stays on the screen instead of vanishing into a
         toast, and nothing claims progress that has not happened */
      return `${chSheetHead(toCo ? "Co-buyer link" : "Application link")}
        <p class="rp-sheet__sub">${ctx}</p>
        <div class="rp-steps">
          ${stepRow(`Link sent by ${rec.channel === "email" ? "email" : "text"}`, `${esc(rec.to || "")} · ${esc(timeUS(rec.sentAt))}`, "Sent", true)}
          ${stepRow("Opened", rec.openedAt ? `${esc(timeUS(rec.openedAt))}` : "Waiting on the co-buyer", rec.openedAt ? "Opened" : "Waiting", !!rec.openedAt)}
          ${stepRow("Identity verified", "Photo against their license", rec.identityAt ? "Verified" : "Waiting", !!rec.identityAt)}
          ${stepRow("Their fields submitted", "Residence, employment, income", rec.fieldsAt ? "Submitted" : "Waiting", !!rec.fieldsAt)}
        </div>
        <button type="button" class="rp-primary" data-sheet-close>Done</button>
        <button type="button" class="rp-link" id="caResend">Resend the ${rec.channel === "email" ? "email" : "text"} to ${esc(who ? who.first : "them")}</button>`;
    }
    const channel = ui.channel || "text";
    const to = channel === "email" ? (who && who.email) || "" : (who && who.phone) || "";
    return `${chSheetHead(toCo ? "Send co-buyer link" : "Send application link")}
      <p class="rp-sheet__sub">${ctx}</p>
      <div class="rp-segment">
        <button type="button" class="rp-segment__item${channel === "text" ? " rp-segment__item--on" : ""}" data-channel="text">Text</button>
        <button type="button" class="rp-segment__item${channel === "email" ? " rp-segment__item--on" : ""}" data-channel="email">Email</button>
      </div>
      <div class="rp-field"><label class="rp-field__label" for="caLinkTo">${channel === "email" ? "Email" : "Mobile"}</label>
        <input class="rp-field__input" id="caLinkTo" autofocus value="${esc(to)}" placeholder="${channel === "email" ? "name@example.com" : "(000) 000-0000"}"></div>
      <div class="rp-steps" style="margin-top:4px">
        ${stepRow("They verify identity first", "Photo against their own license", "First", false)}
        ${stepRow("Then their own fields only", `Nothing about ${esc(c.first)} is shown to them`, "Second", false)}
      </div>
      <div class="rp-field__err" id="caLinkErr" hidden>Enter ${channel === "email" ? "an email address" : "a mobile number"} for the link</div>
      <button type="button" class="rp-primary" id="caLinkSend">Send secure link</button>`;
  }

  function wireSheet(sheet) {
    $$("[data-channel]", sheet).forEach(b => b.onclick = () => { ui.channel = b.dataset.channel; draw(); });
    const send = $("#caLinkSend", sheet);
    if (send) send.onclick = () => {
      const to = $("#caLinkTo", sheet).value.trim();
      if (!to) { $("#caLinkErr", sheet).hidden = false; return; }
      const target = ui.sheet === "link-cobuyer" ? "cobuyer" : "applicant";
      deal.creditRemote = deal.creditRemote || {};
      const prev = deal.creditRemote[target] || {};
      deal.creditRemote[target] = Object.assign({}, prev, { channel: ui.channel || "text", to, sentAt: new Date().toISOString() });
      Store.save();
      draw();
    };
    const resend = $("#caResend", sheet);
    if (resend) resend.onclick = () => {
      const target = ui.sheet === "link-cobuyer" ? "cobuyer" : "applicant";
      deal.creditRemote[target].sentAt = new Date().toISOString();
      Store.save();
      draw();
    };
  }

  /* the deal summary that reconciles: every line the total depends on is on
     the screen, fees itemised, the tax naming its base (§17, §19b) */
  function summarySheet() {
    const acc = r.accessories;
    const equity = (deal.trade.value || 0) - (deal.trade.payoff || 0);
    const totalOfPayments = RIDE_PRICE_CALC.round2(r.payment * r.term);
    return `${chSheetHead("Deal summary")}
      <p class="rp-sheet__sub">Deal #${esc(deal.dealNo)}${v ? ` · ${esc(v.year + " " + v.model + (v.trim ? " " + v.trim : ""))}` : ""} · updated from the worksheet</p>
      <div class="rp-kv"><div class="rp-kv__head">Vehicle</div>
        ${kvRow("Cash price", money(v.selling + v.includedOptions))}
        ${acc ? kvRow("Accessories", money(acc)) : ""}
        ${RIDE_PRICE_DATA.fees.map(f => kvRow(esc(f.label), money(f.amount))).join("")}
        ${kvRow(`Sales tax · ${RIDE_PRICE_CALC.taxPct(RIDE_PRICE_CALC.totalTaxRate())}% on ${money(RIDE_PRICE_CALC.taxableBase(deal, v))}`, money(r.taxes.total))}
      </div>
      <div class="rp-kv"><div class="rp-kv__head">Credits and payoff</div>
        ${deal.trade.rebates ? kvRow("Rebate · customer cash", `−${money(deal.trade.rebates)}`) : ""}
        ${deal.trade.has ? kvRow("Trade allowance", `−${money(deal.trade.value || 0)}`) + kvRow("Trade payoff", `+${money(deal.trade.payoff || 0)}`) : ""}
        ${kvRow("Cash down", `−${money(deal.desk.downPayment || 0)}`)}
      </div>
      <div class="rp-kv"><div class="rp-kv__head">Structure</div>
        ${kvRow("Term", `${esc(String(r.term))} months`)}
        ${kvRow("Rate agreed with the customer", `${esc(String(deal.desk.apr))}% APR`)}
        ${kvRow("Payment", `${money(r.payment)} / mo`)}
        ${kvRow(`Total of payments · ${esc(String(r.term))} × ${money(r.payment)}`, money(totalOfPayments))}
        <div class="rp-kv__row" style="border-top:1px solid var(--rp-ink)"><span style="color:var(--rp-ink);font-weight:740">Amount financed</span><span style="font-weight:760">${money(r.amountFinanced)}</span></div>
      </div>
      <a class="rp-link" href="#/desk/${esc(deal.id)}">Edit on the pencil</a>`;
  }

  /* a read-only review drawer, one per applicant — four steps, no editing */
  function answersSheet(forCo) {
    const co = cbRec();
    const who = forCo ? co : c;
    const rows = forCo
      ? [["Full legal name", [co.first, co.middle, co.last].filter(Boolean).join(" ")],
         ["Date of birth", F.coDob || "—"], ["Driver's license", F.coDl || "—"],
         ["Address", [F.coAddr, F.coCity, F.coState].filter(Boolean).join(", ") || "—"],
         ["Relationship on the deal", F.coRel]]
      : [["Full legal name", legalName], ["Date of birth", F.dob || "—"], ["Driver's license", F.dl || "—"],
         ["Social Security number", F.ssn ? "On file" : "—"],
         ["Address", [F.address, F.city, F.state].filter(Boolean).join(", ") + " " + (F.zip || "")],
         ["Housing", `${F.housing}${F.housePmt ? ` · $${F.housePmt} / mo` : ""}`],
         ["Time at address", `${F.resYrs} years`],
         ["Employer", F.employer || "—"], ["Occupation", F.occupation || "—"],
         ["Time at employer", `${F.empYrs} years`],
         ["Gross monthly income", F.income ? `$${F.income} / mo` : "—"],
         ["Electronic signature", F.consent ? "Accepted" : "Not accepted"]];
    return `${chSheetHead(`${who.first}'s answers`)}
      <p class="rp-sheet__sub">Deal #${esc(deal.dealNo)} · read-only · four steps</p>
      <div class="rp-kv">${rows.map(([a, b]) => kvRow(esc(a), esc(String(b)))).join("")}</div>
      <button type="button" class="rp-primary" data-sheet-close>Done</button>`;
  }

  /* ---------------- 11 · approved, at a different rate ---------------- */
  /* When the lender approves at terms other than the ones the customer agreed
     to, the screen states the difference in the customer's unit — the payment,
     not the rate — and the forward action is to re-present (§18). Every figure
     derives from the two payments on screen, so the per-month difference and
     the term total multiply out against each other (§17). */
  function approvedScreen() {
    const a = deal.creditApp;
    const agreedApr = a.agreedApr != null ? a.agreedApr : deal.desk.apr;
    const approvedApr = a.approvedApr != null ? a.approvedApr : a.qualifiedApr;
    const base = RIDE_PRICE_CALC.calc(deal, v);
    const agreedPay = a.agreedPayment != null ? a.agreedPayment : base.payment;
    const approvedPay = RIDE_PRICE_CALC.round2(RIDE_PRICE_CALC.amortize(base.amountFinanced, approvedApr, base.term));
    const term = base.term;
    const agreedTotal = RIDE_PRICE_CALC.round2(agreedPay * term);
    const approvedTotal = RIDE_PRICE_CALC.round2(approvedPay * term);
    const diff = RIDE_PRICE_CALC.round2(approvedPay - agreedPay);
    const diffTotal = RIDE_PRICE_CALC.round2(diff * term);
    const moved = Math.abs(diff) >= 0.01;
    const content = `<div class="rp-eyebrow">Lending lane</div>
      <h1 class="rp-title" style="font-size:26px">Approved</h1>
      ${subLine()}
      ${chipRow()}
      <div class="rp-approval" style="padding:12px 16px 10px"><span class="rp-approval__badge">${rpGlyph("check")}Approved by ${esc(a.lender)}</span></div>
      <div class="rp-kv">
        <div class="rp-kv__head"${moved ? ` style="color:#A54600"` : ""}>${moved ? "The rate moved — the payment changed" : "Approved at the agreed rate"}</div>
        ${kvRow(`Agreed · ${esc(String(agreedApr))}% APR`, `${money(agreedPay)} / mo`, `total of payments ${term} × ${money(agreedPay)} = ${money(agreedTotal)}`)}
        ${kvRow(`Approved · ${esc(String(approvedApr))}% APR`, `${money(approvedPay)} / mo`, `total of payments ${term} × ${money(approvedPay)} = ${money(approvedTotal)}`)}
        ${kvRow("Amount financed", money(base.amountFinanced), "unchanged — only the rate moved")}
        <div class="rp-kv__row rp-kv__row--src" style="border-top:1px solid var(--rp-ink)"><span style="color:var(--rp-ink);font-weight:740">Difference</span><span style="font-weight:760">${diff >= 0 ? "+" : "−"}${money(Math.abs(diff))} / mo</span><span class="rp-kv__src">${diff >= 0 ? "+" : "−"}${money(Math.abs(diffTotal))} over the term</span></div>
      </div>`;
    const dock = moved
      ? chDock(`<button type="button" class="rp-primary" id="caRepresent">Re-present the new payment</button>`,
        `<a class="rp-link" href="#/menu/${esc(deal.id)}">Manager sign-off</a>`)
      : chDock(`<a class="rp-primary" style="display:grid;place-items:center" href="#/menu/${esc(deal.id)}">Manager sign-off</a>`);
    paint(content, dock);
    const rp = $("#caRepresent");
    /* re-presenting hands the phone back to desking's present mode on the
       APPROVED number: the customer agreed to a payment, and a new payment is
       a new agreement (§18) */
    if (rp) rp.onclick = () => { deal.desk.apr = approvedApr; delete deal.desk.customerChose; Store.save(); navigate(`#/desk/${deal.id}`); };
  }

  /* ---------------- submit ---------------- */
  function submit() {
    /* a joint application with nobody attached cannot go to a lender */
    if (isJoint() && !cbRec()) {
      st.err = { keys: new Map(), summary: "No co-buyer is attached." };
      st.step = 4; draw();
      return;
    }
    const bad = johnProblems();
    if (bad.length || !F.consent) {
      st.err = { keys: new Map(bad.map(b => [b.k, b.msg])) };
      st.step = 4; draw();
      return;
    }
    /* §19: internal completion is not lender submission — both halves first */
    if (isJoint() && !coState().complete) { markReady(); return; }

    const tier = RIDE_PRICE_CALC.creditTier(c.creditScore || 700);
    const submittedAt = new Date().toISOString();
    const outcome = RIDE_PRICE_DATA.approvalOutcome;
    const base = v ? RIDE_PRICE_CALC.calc(deal, v) : null;
    deal.creditApp = {
      submitted: submittedAt, approved: true, status: "approved",
      /* the lender's answer is the demo's own seeded outcome: a rate derived
         from a credit tier would put this deal at 2.49% and contradict every
         board and the finance menu that prices off it. The agreed rate is
         snapshotted here because re-presenting overwrites desk.apr. */
      lender: outcome.lender, approvedApr: outcome.apr, qualifiedApr: outcome.apr,
      agreedApr: deal.desk.apr, agreedPayment: base ? base.payment : null,
      leaseFactor: Math.max(0.00001, tier.leaseFactor - 0.0003),
      employer: F.employer,
      form: {
        consent: { electronicSignature: true, acceptedAt: submittedAt },
        dob: dateISO(F.dob), coDob: dateISO(F.coDob) || null,
        creditType: F.creditType, primaryUse: F.primaryUse,
        joint: isJoint(), coRel: isJoint() ? F.coRel : "",
        marital: F.marital,
        housing: F.housing, housePmt: F.housePmt.trim(), resYrs: F.resYrs.trim(),
        prevAddress: under3(F.resYrs) ? F.prevAddr.trim() : "",
        mailing: F.mailDiff
          ? { address: F.mailAddr.trim(), city: F.mailCity.trim(), state: F.mailState.trim(), zip: F.mailZip.trim() } : null,
        occupation: F.occupation.trim(), selfEmployed: F.selfEmp,
        employerPhone: F.empPhone.trim(), empYrs: F.empYrs.trim(),
        income: F.income.trim(), otherIncome: F.otherIncome.trim(), otherSource: F.otherSource.trim(),
        prevEmployer: under3(F.empYrs) ? F.prevEmp.trim() : "", prevOccupation: F.prevOcc.trim(), prevEmpYrs: F.prevEmpYrs.trim(),
        disclosures: {
          bankruptcy: F.dBk ? F.dBkNote.trim() : null,
          alias: F.dAlias ? F.dAliasNote.trim() : null,
          repossession: F.dRepo ? F.dRepoNote.trim() : null
        },
        references: {
          bank: F.refBank.trim(), acctType: F.refAcctType,
          kin: F.refKinName.trim() ? { name: F.refKinName.trim(), phone: F.refKinPhone.trim(), relationship: F.refKinRel.trim() } : null,
          personal: [F.refP1.trim(), F.refP2.trim()].filter(Boolean)
        }
      }
    };
    /* two documents file here, in order: the application itself — ONE document,
       which is why it could not file while half of it did not exist — and the
       lender's approval (§19a) */
    jacketReceive(deal, "creditapp", "app");
    jacketReceive(deal, "approval", "app");
    deal.stage = "menu"; Store.save();
    ui.mode = "approved"; draw();
  }

  /* ---------------- the frame ---------------- */
  function paint(content, dockHtml, cls) {
    if (!ui.sheet) sheets.close();
    view().innerHTML = chShell({ template: "task", title: custName, closeId: "caClose", cls: cls || "" },
      content, dockHtml, { scrim: "caScrim", sheet: "caSheet" });
    $("#caClose").onclick = () => navigate(`#/agreement/${deal.id}`);
    chWireRole(sheets, draw);
    $$("[data-sheet-open]").forEach(b => b.onclick = () => { ui.sheet = b.dataset.sheetOpen; ui.channel = null; draw(); });
    $$("[data-buyers-open]").forEach(b => b.onclick = () => { ui.sheet = "buyers"; buyers = null; draw(); });
    /* the buyers sheet is its own module with its own states; the screen holds
       the handle so a re-render reopens it where it was rather than at the top */
    if (ui.sheet === "buyers") { if (buyers) buyers.open(); else buyers = buyersKitSheet(deal, sheets, () => draw()); }
    else if (ui.sheet) sheets.open(sheetHtml(), wireSheet);
  }
  let buyers = null;

  function draw() {
    /* record where the wizard is, so a router() re-entry — the buyers sheet
       calls it on every change — puts the advisor back on the step they were
       working rather than on step 1 */
    if (creditWorking && creditWorking.id === deal.id) creditWorking.step = st.step;
    if (ui.mode === "approved") return approvedScreen();
    if (ui.mode === "identity") return identityScreen(false);
    if (ui.mode === "identity-ok") return identityScreen(true);
    wizardScreen();
  }

  /* one delegated writer: masks applied here so the stored value matches what
     the document-level [data-date] mask paints (both are idempotent). A
     complete demo ZIP fills city + state, in state and on screen. */
  if (creditInputOff) creditInputOff();
  const onCreditInput = (e) => {
    const el = e.target.closest("[data-key]");
    if (!el) return;
    if (el.hasAttribute("data-ssn")) {
      const dg = el.value.replace(/\D/g, "").slice(0, 9);
      el.value = dg.length > 5 ? dg.slice(0, 3) + "-" + dg.slice(3, 5) + "-" + dg.slice(5)
        : dg.length > 3 ? dg.slice(0, 3) + "-" + dg.slice(3) : dg;
    }
    if (el.hasAttribute("data-date")) {
      const dg = el.value.replace(/\D/g, "").slice(0, 8);
      el.value = dg.length > 4 ? dg.slice(0, 2) + "/" + dg.slice(2, 4) + "/" + dg.slice(4)
        : dg.length > 2 ? dg.slice(0, 2) + "/" + dg.slice(2) : dg;
    }
    if (el.dataset.zip !== undefined && el.dataset.zip !== "") {
      el.value = el.value.replace(/\D/g, "").slice(0, 5);
      const hit = el.value.length === 5 && RIDE_PRICE_DATA.zipLookup[el.value];
      if (hit) {
        const [cityKey, stateKey] = el.dataset.zip.split(",");
        F[cityKey] = hit.city; F[stateKey] = hit.state;
        const cityEl = $("#ca_" + cityKey), stateEl = $("#ca_" + stateKey);
        if (cityEl) cityEl.value = hit.city;
        if (stateEl) stateEl.value = hit.state;
      }
    }
    F[el.dataset.key] = el.value;
  };
  view().addEventListener("input", onCreditInput);
  /* the handle lives OUTSIDE the route, because the leak is a second entry
     into the route rather than a second screen: it is cleared on the way in
     above, and on the way out here */
  /* Two different departures. A RE-ENTRY calls this to take the previous
     entry's listener off, and must leave the working copy alone — clearing it
     there is what sent the advisor back to step 1 the moment they attached a
     co-buyer. Leaving the route for real ends the working copy with it. */
  const off = (leaving) => {
    const el = view(); if (el) el.removeEventListener("input", onCreditInput);
    window.removeEventListener("hashchange", onLeave);
    if (creditInputOff === off) creditInputOff = null;
    if (leaving && creditWorking && creditWorking.id === deal.id) creditWorking = null;
  };
  const onLeave = () => off(true);
  creditInputOff = off;
  window.addEventListener("hashchange", onLeave);

  /* the gate comes before the application; an already-approved deal never
     re-gates, and a deal parked on a pending co-buyer opens on Review */
  if (app && app.approved) ui.mode = "approved";
  else if (!(deal.identity && deal.identity.verifiedAt)) ui.mode = "identity";
  else {
    ui.mode = "wizard";
    if (app && app.status === "pending-cobuyer") st.step = 4;
    else if (creditWorking && creditWorking.id === deal.id && creditWorking.step) st.step = creditWorking.step;
  }
  draw();
});

/* the co-buyer finishing her half at home is a real sequence of events the
   demo cannot receive over a network (invariant 2), so it is entered on
   purpose — the same device the vehicle-reservation example uses. */
route("demo/cobuyer-ready", () => {
  const deal = Store.deal("d-demo1");
  if (!deal) return navigate("#/deals");
  deal.creditRemote = deal.creditRemote || {};
  const rec = deal.creditRemote.cobuyer = deal.creditRemote.cobuyer || { channel: "text", to: "(347) 555-1212", sentAt: new Date().toISOString() };
  /* minutes AGO: the screen states when she did each thing, and a stamp ahead
     of the clock claims a verification that has not happened yet — the same
     reason seedArrival() puts John's arrival in the past */
  const t = (agoMins) => new Date(Date.now() - agoMins * 60000).toISOString();
  rec.openedAt = rec.openedAt || t(3);
  if (!rec.identityAt) { rec.identityAt = t(2); jacketReceive(deal, "idverify-cobuyer", "app"); }
  rec.fieldsAt = rec.fieldsAt || t(1);
  rec.authorizedAt = rec.authorizedAt || t(1);
  Store.save();
  redirect(`#/credit/${deal.id}`);
});
/* ============================================================
   Menu step numbering — the persisted 1..5 contract
   ============================================================
   The product presentation is step 2 and lives on its own route. The V3
   finance menu shows four stages (Terms/Options/Forms/Finalize) and maps
   them onto steps 1/3/4/5; this migration brings blobs saved before the
   presentation became its own step onto the same numbering. The old
   five-label stepper it used to feed retired with the V3 rebuild. */
function migrateMenuV5(deal) {
  const M = deal.menu;
  if (!M || M.v5) return;
  if (M.step >= 2) M.step += 1;
  if ((M.maxStep || 1) >= 2) M.maxStep = (M.maxStep || 1) + 1;
  M.v5 = true; Store.save();
}

/* ============================================================
   VIEW: Step 2 — Preferred product presentation walkthrough
   ============================================================ */
route("present/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const v = Store.vehicle(deal.stock);
  const c = Store.customer(deal.customerId);
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const isCash = deal.dealType === "cash";
  const progSet = RIDE_PRICE_DATA.programs[isLease ? "lease" : isCash ? "cash" : "finance"];
  const prog = progSet.preferred;
  const term = isLease ? deal.desk.leaseTerm : deal.desk.term;

  /* tiles: rate & term first (skip rate on cash/lease where it isn't presented), then every Preferred product */
  const tileKeys = [...(isCash ? [] : ["rate", "term"]), ...prog.products];
  let sel = tileKeys[0];
  const visited = new Set([sel]);
  let miles = deal.desk.milesPerYear || 15000;

  /* this IS step 2 of the menu */
  migrateMenuV5(deal);
  const M2 = deal.menu;
  M2.step = 2; M2.maxStep = Math.max(M2.maxStep || 1, 2); Store.save();
  const toOptions = () => {
    M2.presented = true; M2.step = 3; M2.maxStep = Math.max(M2.maxStep || 1, 3); Store.save();
    navigate(`#/menu/${deal.id}`);
  };
  const backToTerms = () => { M2.step = 1; Store.save(); navigate(`#/menu/${deal.id}`); };

  renderChrome("Product Presentation", dealTitle(deal), "");
  document.body.dataset.screen = "present";
  document.body.dataset.canvas = "master";

  /* rail icons: line icons only (owner ruling) — the presentations' emoji
     never reach an icon slot */
  const PRESENT_ICON = {
    rate: "percent", term: "calendar", vsc10: "shield", vsc7: "shield",
    ppm8: "wrench", ppm3: "wrench", gap: "umbrella", multi: "box",
    appear: "sparkle", lep: "key", wind: "windshield", roadhaz: "wheel",
    keyrep: "key", tlp: "carplus", recovery: "radar"
  };

  function tileInfo(key) {
    const p = RIDE_PRICE_CALC.productById(key);
    const pres = RIDE_PRICE_DATA.presentations[key] || {};
    return {
      key,
      label: pres.label || (p ? p.name : key),
      short: pres.short || pres.label || (p ? p.name : key),
      icon: rpIcon(PRESENT_ICON[key] || "shield"),
      headline: pres.headline || "",
      body: pres.body || "",
      benefits: pres.benefits || [],
      product: p || null
    };
  }

  function mdBudget(p) {
    const monthly = p.price / term;
    const daily = monthly * 12 / 365;
    return { monthly, daily };
  }

  /* VSC mileage math — the real factory coverage window */
  const mileageMath = () => {
    const factoryMonths = Math.round(Math.min(36, 36000 / miles * 12));
    const vscYears = sel === "vsc10" ? 10 : 7;
    const vscMiles = sel === "vsc10" ? 120000 : 100000;
    const vscMonths = Math.round(Math.min(vscYears * 12, vscMiles / miles * 12));
    const end = new Date();
    end.setMonth(end.getMonth() + vscMonths);
    return { factoryMonths, vscYears, vscMiles, endLabel: end.toLocaleDateString("en-US", { month: "long", year: "numeric" }) };
  };
  const mileCopy = () => {
    const mm = mileageMath();
    return `At <b>${esc(miles.toLocaleString())} miles a year</b>, the factory comprehensive coverage expires in <b>${mm.factoryMonths} months</b>. This benefit mirrors the manufacturer for up to <b>${mm.vscYears} years / ${mm.vscMiles.toLocaleString()} miles</b> — peace of mind until <b class="mp-good">${esc(mm.endLabel)}</b>.`;
  };

  const benefitHtml = (b) => `<div class="mp-benefit"><span class="mp-check">✓</span><span>${esc(b)}</span></div>`;

  function rateRows() {
    const q = deal.creditApp || {};
    if (!q.approved) return `<p class="mp-hint">Submit the credit application to present the qualified rate.</p>`;
    return `<div class="mp-compare">
      <div class="mp-cmprow"><span>Agreed rate (structure)</span><strong>${esc(String(deal.desk.apr))}%</strong></div>
      <div class="mp-cmprow good"><span>Qualified rate (${esc(q.lender)})</span><strong>${esc(String(q.qualifiedApr))}%</strong></div>
    </div>`;
  }

  function cardHtml(t) {
    const q = deal.creditApp || {};
    return `<section class="mp-card">
      <div class="mp-kicker">${esc(t.label.toUpperCase())}</div>
      <div class="mp-titlerow"><h2 class="mp-title">${esc(t.headline)}</h2>${t.key === "rate" && q.approved ? `<span class="mp-dot" aria-label="Approved"></span>` : ""}</div>
      ${t.product ? `<div class="mp-pills"><span class="mp-pill">${esc(t.product.detail)}</span></div>` : ""}
      <p class="mp-body">${esc(t.body)}</p>
      ${t.benefits.length ? `<div class="mp-benefits">${t.benefits.map(benefitHtml).join("")}</div>` : ""}
      ${t.key === "rate" ? rateRows() : ""}
      ${sel === "vsc10" || sel === "vsc7" ? `
      <div class="mp-mileage">
        <div class="mp-miletop"><div class="mp-miletitle">Your driving changes the warranty timeline</div><div class="mp-milevalue" id="mpMileVal">${esc(miles.toLocaleString())} mi/yr</div></div>
        <input class="mp-range" id="mpMiles" type="range" min="5000" max="25000" step="2500" value="${esc(String(miles))}" aria-label="Annual mileage">
        <p class="mp-milecopy" id="mpMileCopy">${mileCopy()}</p>
      </div>` : ""}
      ${t.product ? `<div class="mp-actions">
        <button type="button" class="mp-ghost" id="mpBudget">Budget impact</button>
      </div>` : ""}
      <button type="button" class="mp-textbtn" id="mpMore">${t.key === "rate" ? "See why this rate is credible" : "More product details"}</button>
    </section>`;
  }

  const sheetTop = (title) => `<div class="m-sheettop"><div class="m-sheettitle">${esc(title)}</div><button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>`;
  const openSheet2 = (html) => { $("#mpSheet").innerHTML = `<div class="m-handle"></div>${html}`; $("#mpScrim").classList.add("show"); };
  const closeSheet2 = () => $("#mpScrim").classList.remove("show");

  function render() {
    const t = tileInfo(sel);
    const i = tileKeys.indexOf(sel);
    const last = i === tileKeys.length - 1;
    view().innerHTML = `
    <div class="m-app">
      ${masterTop()}
      <div class="m-hero">
        <div class="m-eyebrow">F&amp;I · ${esc(prog.label.toUpperCase())} · PRODUCT PRESENTATION</div>
        <h1 class="m-h1">Present the protection</h1>
      </div>
      <div class="m-context">
        <div class="m-context-copy">
          <div class="m-context-name">${esc(c.first + " " + c.last)}</div>
          <div class="m-context-meta">${deal.dealNo ? `Deal #${esc(deal.dealNo)} · ` : ""}${esc(v.year + " " + v.make + " " + v.model)}</div>
        </div>
        <button type="button" class="m-rolepill" data-buyers="${esc(deal.id)}">Buyer</button>
      </div>
      <nav class="mp-rail" aria-label="Products">
        ${tileKeys.map(k => {
          const ti = tileInfo(k);
          return `<button type="button" class="mp-tab${k === sel ? " active" : ""}" data-tile="${esc(k)}" aria-pressed="${k === sel}">
            ${visited.has(k) && k !== sel ? `<span class="mp-seen" aria-label="Presented">✓</span>` : ""}
            <span class="mp-tabicon">${ti.icon}</span><span>${esc(ti.short)}</span>
          </button>`;
        }).join("")}
      </nav>
      <div class="mp-content">${cardHtml(t)}</div>
    </div>
    <div class="mp-dock">
      <div class="mp-dockcopy">
        <div class="mp-docklab">Now presenting · ${visited.size} of ${tileKeys.length}</div>
        <div class="mp-dockval">${esc(t.label)}</div>
      </div>
      <button type="button" class="mp-primary" id="mpNext">${last ? "Done — Repayment Options" : `Next: ${esc(tileInfo(tileKeys[i + 1]).short)}`}</button>
    </div>
    <div class="m-scrim" id="mpScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="mpSheet"></div></div>`;

    wireMasterTop();
    $("#mBack").onclick = backToTerms; /* back returns to Purchase Terms, not history */

    $$("[data-tile]").forEach(b => b.onclick = () => { sel = b.dataset.tile; visited.add(sel); render(); });
    /* render() replaces the rail, which resets scrollLeft to 0 — on a phone
       that leaves the tile you just tapped off-screen. Re-centre it. */
    const rail = $(".mp-rail"), onTile = $(".mp-tab.active");
    if (rail && onTile && rail.scrollWidth > rail.clientWidth) {
      const r = rail.getBoundingClientRect(), tr = onTile.getBoundingClientRect();
      rail.scrollLeft += (tr.left - r.left) - (r.width - tr.width) / 2;
    }

    $("#mpNext").onclick = () => {
      if (last) return toOptions();
      sel = tileKeys[i + 1]; visited.add(sel); render();
    };

    /* the sheet shell is re-rendered closed; content is injected on open */
    const scrim = $("#mpScrim");
    scrim.onclick = (e) => { if (e.target === scrim || e.target.closest("[data-sheet-close]")) closeSheet2(); };

    const mpMiles = $("#mpMiles");
    if (mpMiles) mpMiles.oninput = () => {
      miles = parseInt(mpMiles.value, 10);
      $("#mpMileVal").textContent = miles.toLocaleString() + " mi/yr";
      $("#mpMileCopy").innerHTML = mileCopy();
    };

    const budgetBtn = $("#mpBudget");
    if (budgetBtn) budgetBtn.onclick = () => {
      const b = mdBudget(t.product);
      openSheet2(`${sheetTop("Monthly / daily budget")}
        <p class="mp-body" style="margin-top:0">The impact of ${esc(t.label)} inside the ${esc(String(term))}-month structure — derived from the deal, not typed in.</p>
        <div class="mp-budget">
          <div class="mp-stat"><div class="mp-statlab">Monthly</div><div class="mp-statval">${esc(money(b.monthly))}</div></div>
          <div class="mp-stat"><div class="mp-statlab">Daily</div><div class="mp-statval">${esc(money(b.daily))}</div></div>
        </div>
        <p class="mp-sheetnote">≈ ${esc(money(b.daily))} a day over ${esc(String(term))} months.</p>
        <button type="button" class="mp-primary mp-wide" data-sheet-close>Back to product</button>`);
    };

    $("#mpMore").onclick = () => openSheet2(`${sheetTop(t.label)}
      ${t.product ? `<div class="mp-pills" style="margin-top:0"><span class="mp-pill">${esc(t.product.detail)}</span></div>` : ""}
      <p class="mp-body">${esc(t.body)}</p>
      <div class="mp-morelist">${t.benefits.map(b => `<div class="mp-morerow">✓ ${esc(b)}</div>`).join("")}</div>
      <button type="button" class="mp-primary mp-wide" data-sheet-close>${t.key === "rate" || t.key === "term" ? "Done" : "Back to product"}</button>`);
  }

  render();
});

/* ============================================================
   VIEW: Finance menu — the sign-off gate and four stages
   (owner's package v034, 2026-09-04, on the UI kit v022.18)
   ============================================================
   Fourteen screens on one route, all of them the kit's Task: the customer's
   full name in the bar, the deal number in the subtitle — legitimate here,
   because this is after the F&I push (§16) — and one chip row that does not
   wrap.

   Four rules shape it, and none of them is cosmetic:

   §22 — A CLOSEOUT CANNOT CONTRADICT ITS OWN READINESS. Required and optional
   documents are different sets, and the finalize gate counts only what is
   required to fund and deliver. Finalize is UNAVAILABLE while a required
   document is missing — absent, with the missing documents named — and the
   only way past it is an attributed Team Lead override that says what it will
   record. The screen that follows an override says the deal was finalized
   WITH documents outstanding, and lists them. "Finance complete" and "2
   outstanding" never stand unqualified on one screen.

   §23 — A DEAD-END SCREEN IS A BUG. The Advisor's gate names who it waits on
   AND gives the Advisor the actions they have: ask the approver, or park the
   deal and move to another desk task.

   §24 — TOASTS ARE NOT STATE. "Approved by Jordan Reyes" and "Acknowledgment
   signed" are rows on the screen, not pills that fade. Nothing that
   disappears is the record of anything.

   §22a / §22b — the ledger reconciles both ways (required filed of required
   total, plus optional, and every change has a named cause on the screen that
   caused it), and product money is derived: a package payment is the agreed
   payment plus the amortization of the products it contains, so the delta on
   the row always amortizes back to the products beside it.

   Everything the five-step menu enforced survives: the persisted 1..5 step
   under four stages, the gate's required three with the test drive advisory,
   the custom column's withheld figure, its source column setting rate and
   term, initials selecting a program, a decline being a recorded choice,
   trade-locked forms, the acknowledgment gate, and the DMS push folded into
   Finalize and recorded against the Team Lead who approved the deal. */
route("menu/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const v = Store.vehicle(deal.stock);
  /* the menu needs a vehicle it can PRICE — a catalog unit. A deal carried by
     its own snapshot has nothing to price, and its record is its jacket. */
  if (!v) return navigate(deal.stage === "complete" ? `#/jacket/${deal.id}` : `#/vehicles/${deal.id}`);
  const c = Store.customer(deal.customerId);
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const isCash = deal.dealType === "cash";
  const progSet = RIDE_PRICE_DATA.programs[isLease ? "lease" : isCash ? "cash" : "finance"];
  const M = deal.menu;
  migrateMenuV5(deal);
  const custName = `${c.first} ${c.last}`;
  const lead = RIDE_PRICE_DATA.dealership.teamLead;
  const timeUS = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const colLabel = (key) => key === "custom" ? "Custom" : key === "none" ? "No products" : (progSet[key] || {}).label || key;

  renderChrome("Finance Menu", "", "");
  document.body.dataset.screen = "menu";
  document.body.dataset.canvas = "kit";

  const ui = { sheet: null, pack: null, packScroll: 0, taxOpen: false };
  const sheets = chSheetOpener("fmScrim", "fmSheet", () => { ui.sheet = null; });
  let buyers = null;

  /* ONE definition of a program's spec, so Options and Finalize cannot
     disagree about what the client initialed. A program that does not exist
     on this deal type resolves to null rather than throwing. */
  const programSpec = (key) => {
    if (key === "custom") {
      const src = M.customSource === "budget" && progSet.budget ? progSet.budget : null;
      return { label: "Custom", products: M.custom, termAdj: src ? src.termAdj : 0, aprAdj: src ? src.aprAdj : 0 };
    }
    return progSet[key] || null;
  };
  /* a snapshot from a different deal type is not this deal's snapshot */
  const snapshot = () => {
    const s = deal.basePayment && deal.basePayment.snapshot;
    return s && s.dealType === deal.dealType ? s : RIDE_PRICE_CALC.calc(deal, v);
  };
  if ((M.maxStep || 1) < M.step) { M.maxStep = M.step; Store.save(); }
  if (!deal.signoff && deal.stage === "complete") {
    deal.signoff = { by: lead, at: deal.createdAt, backfilled: true }; Store.save();
  }
  const STEP_OF = [1, 3, 4, 5];
  const STAGES = ["Terms", "Options", "Forms", "Finalize"];
  const stageOf = (step) => step >= 5 ? 3 : step >= 4 ? 2 : step >= 3 ? 1 : 0;
  /* the agreed payment is the one the customer actually agreed to — the
     re-presented figure when the lender moved the rate (§18), which is why
     the menu prices at the approved rate and the original is history */
  const agreed = () => {
    const a = deal.creditApp;
    const apr = creditLive(deal) && a.approvedApr != null ? a.approvedApr : deal.desk.apr;
    const r = RIDE_PRICE_CALC.finance(deal, v, { apr, term: deal.desk.term });
    return { apr, payment: r.payment, result: r };
  };

  /* ---------- the kit pieces ---------- */
  const chipRow = () => {
    const led = jacketLedger(deal);
    const buyersN = 1 + (deal.coBuyerId && Store.customer(deal.coBuyerId) ? 1 : 0);
    return `<div class="rp-chiprow">
      <button type="button" class="rp-chip" data-sheet-open="buyers">Buyers · ${buyersN}</button>
      ${chJacketChip(deal)}
      <a class="rp-chip" href="#/vehicles/${esc(deal.id)}">${esc(v.stock)}</a>
    </div>`;
  };
  const subLine = () => `<p class="rp-count" style="margin-bottom:12px">Deal #${esc(deal.dealNo)} · ${esc(custName)}</p>`;
  const stageBar = (cur) => `<div class="rp-stages">${STAGES.map((n, i) => {
    const done = i < cur;
    return `<div class="rp-stage${i === cur ? " rp-stage--on" : done ? " rp-stage--done" : ""}">${done ? rpGlyph("check") + esc(n) : `${i + 1} ${esc(n)}`}</div>`;
  }).join("")}</div>`;
  const gateRows = (rows) => `<div class="rp-gate">${rows.map(r => `<div class="rp-gate__row">
    <span class="rp-row__body"><span class="rp-gate__name">${esc(r.name)}</span><span class="rp-gate__sub">${esc(r.sub)}</span></span>
    <span class="rp-status${r.state === "ok" ? " rp-status--positive" : r.state === "blocked" ? " rp-status--blocked" : ""}">${esc(r.status)}</span></div>`).join("")}</div>`;
  const kvRow = (label, val, src) => `<div class="rp-kv__row${src ? " rp-kv__row--src" : ""}"><span>${label}</span><span>${val}</span>${src ? `<span class="rp-kv__src">${src}</span>` : ""}</div>`;
  const kvBlock = (head, rows, foot) => `<div class="rp-kv">${head ? `<div class="rp-kv__head">${esc(head)}</div>` : ""}${rows.join("")}
    ${foot ? `<div class="rp-kv__row" style="border-top:1px solid var(--rp-ink)"><span style="color:var(--rp-ink);font-weight:740">${esc(foot[0])}</span><span style="font-weight:760">${foot[1]}</span></div>` : ""}</div>`;
  const priceCard = (label, amount, terms, extra) => `<div class="rp-price">
    <div class="rp-price__label">${esc(label)}</div>
    <div class="rp-price__amount">${amount}<small>${isCash || deal.dealType === "onepay" ? "total" : "/ mo"}</small></div>
    <div class="rp-price__terms">${terms}</div>${extra || ""}</div>`;
  const consequences = (title, items) => `<div class="rp-consequences"><strong>${esc(title)}</strong>
    <ul>${items.map(x => `<li>${x}</li>`).join("")}</ul></div>`;
  const doneNotice = (text) => `<div class="rp-notice rp-notice--success"><span class="rp-step__mark rp-step__mark--done">${rpGlyph("check")}</span>${esc(text)}</div>`;

  /* the jacket line every gate shows, in the ledger's own words (§22a) */
  /* The sign-off override lets APPROVAL past a missing document; it does not
     let the CLOSEOUT past one, and it never supplies the document. So the row
     reads Override where that override is what unblocked the screen, and
     Blocked at the finalize gate, where an earlier reason means nothing and
     the only way through is its own attributed override (§22). */
  const jacketRow = (atFinalize) => {
    const led = jacketLedger(deal);
    const jov = jacketRead(deal).override;
    const excused = !!jov && !atFinalize;
    return {
      name: "Deal Jacket",
      sub: led.ready
        ? `${led.requiredFiled} of ${led.requiredTotal} · ${led.optionalFiled} optional`
        : `${led.requiredFiled} of ${led.requiredTotal} · ${led.outstanding.length} outstanding${led.conditionalOutstanding.length ? `, ${led.conditionalOutstanding.length} conditional` : ""}`,
      status: led.ready ? "Complete" : excused ? "Override" : "Blocked",
      state: led.ready ? "ok" : excused ? "warn" : "blocked"
    };
  };

  /* ---------- 01 / 02 / 03 · the sign-off gate ---------- */
  function gateScreen() {
    const led = jacketLedger(deal);
    const jov = jacketRead(deal).override;
    const a = deal.creditApp;
    const rows = [
      { name: "Base payment agreement", sub: deal.basePayment && deal.basePayment.signedAt ? `Signed ${timeUS(deal.basePayment.signedAt)}` : "Not signed",
        status: deal.basePayment && deal.basePayment.signedAt ? "Ready" : "Blocked", state: deal.basePayment && deal.basePayment.signedAt ? "ok" : "blocked" },
      { name: "Credit application",
        sub: creditLive(deal) ? `Approved · ${a.lender} · ${a.approvedApr != null ? a.approvedApr : a.qualifiedApr}% APR`
          : a && a.withdrawnAt ? "Withdrawn with the co-buyer" : a ? "Submitted" : "Not submitted",
        status: creditLive(deal) ? "Ready" : "Blocked", state: creditLive(deal) ? "ok" : "blocked" },
      /* the test drive is recorded and does not block — it is advisory, and
         the word on the row says so rather than a pill that looks like a gate */
      { name: "Test drive", sub: deal.testDrive.done ? `Completed${deal.testDrive.completedMiles ? ` · ${deal.testDrive.completedMiles} miles` : ""}` : "Not completed", status: "Advisory", state: "" },
      jacketRow()
    ];
    const blockers = rows.filter((r, i) => r.state === "blocked" && i !== 2);
    const canApprove = blockers.length === 0 || (blockers.length === 1 && blockers[0].name === "Deal Jacket" && jov);
    const req = M.approvalRequestedAt;

    const approvalKv = isTeamLead()
      ? kvBlock("Approval", [
        kvRow("Requested", req ? `${esc(timeUS(req))} · by the ${esc(M.approvalRequestedBy || "advisor")}` : "Not yet requested"),
        kvRow("Yours to approve", `${esc(lead)} · Team Lead`)])
      : kvBlock("Approval", [
        kvRow("Yours to approve", "No — Advisor"),
        kvRow("Waiting on", `${esc(lead)} · Team Lead`),
        ...(req ? [kvRow("Requested", `${esc(timeUS(req))} · by you`)] : [])]);

    const resolveRow = isTeamLead() && !led.ready && !jov ? `<div class="rp-group">
      <button type="button" class="rp-row" data-sheet-open="override"><span class="rp-tile">${rpGlyph("document")}</span>
        <span class="rp-row__body"><span class="rp-row__title">Resolve the Deal Jacket blocker</span>
          <span class="rp-row__sub">${esc(led.blocking.slice(0, 2).map(d => d.label).join(" · "))}${led.blocking.length > 2 ? ` · and ${led.blocking.length - 2} more` : ""}</span></span>
        <span class="rp-row__chevron"></span></button></div>` : "";

    const content = `<div class="rp-eyebrow">Finance handoff</div>
      <h1 class="rp-title" style="font-size:26px">Manager sign-off</h1>
      ${subLine()}${chipRow()}
      ${gateRows(rows)}
      ${approvalKv}
      ${jov ? doneNotice(`Override recorded ${timeUS(jov.at)} by ${jov.by} — ${jov.reason}`) : ""}
      ${resolveRow}`;

    /* §23: the waiting role gets the actions it actually has */
    const dock = isTeamLead()
      ? (canApprove
        ? chDock(`<button type="button" class="rp-primary" id="fmApprove">Approve finance menu</button>`)
        : `<div class="rp-dock"><div class="rp-gatenote">Approve stays unavailable while a required document is outstanding</div>
            <button type="button" class="rp-primary" disabled>Approve finance menu</button></div>`)
      : `<div class="rp-dock"><div class="rp-gatenote">An Advisor cannot approve the finance menu</div>
          <button type="button" class="rp-primary" id="fmAsk">${req ? `${esc(lead)} has been asked` : `Ask ${esc(lead)} to approve`}</button>
          <button type="button" class="rp-link" id="fmPark">Park the deal</button></div>`;
    paint(content, dock, "rp-screen--gate");

    const ap = $("#fmApprove");
    if (ap) ap.onclick = () => {
      /* the approval is a ROW on the next screen, not a toast (§24) */
      deal.signoff = { by: lead, at: new Date().toISOString() };
      Store.save(); draw();
    };
    const ask = $("#fmAsk");
    if (ask) ask.onclick = () => {
      M.approvalRequestedAt = M.approvalRequestedAt || new Date().toISOString();
      M.approvalRequestedBy = "advisor";
      Store.save(); draw();
    };
    const park = $("#fmPark");
    if (park) park.onclick = () => {
      M.approvalRequestedAt = M.approvalRequestedAt || new Date().toISOString();
      M.approvalRequestedBy = "advisor";
      Store.save(); navigate("#/deals");
    };
  }

  /* ---------- stage 1 · the terms ---------- */
  function termsScreen() {
    const ag = agreed();
    const snap = snapshot();
    const a = deal.creditApp || {};
    const r = ag.result;
    const totalOfPayments = RIDE_PRICE_CALC.round2(ag.payment * deal.desk.term);
    const historyRows = [];
    if (creditLive(deal) && a.agreedApr != null && a.agreedApr !== ag.apr && a.agreedPayment != null) {
      historyRows.push(kvRow("Originally presented", `${money(a.agreedPayment)} / mo · ${esc(String(a.agreedApr))}% APR`));
      historyRows.push(kvRow("Re-presented and agreed", `${esc(a.submitted ? timeUS(a.submitted) : "")} · ${esc(String(ag.apr))}% APR`));
    }
    const content = `<div class="rp-eyebrow">Finance menu</div>
      <h1 class="rp-title" style="font-size:26px">Review the deal terms</h1>
      ${subLine()}${chipRow()}
      ${stageBar(0)}
      ${priceCard("Agreed payment", isCash ? money(snap.totalDue) : money(ag.payment),
        isCash ? `${esc(v.year + " " + v.model)} · cash, no financing`
          : `${deal.desk.term} months · ${esc(String(ag.apr))}% APR · ${money0(deal.desk.downPayment)} down`)}
      ${historyRows.length ? kvBlock("Rate history", historyRows) : ""}
      <div class="rp-acc">
        <button type="button" class="rp-acc__head" style="width:100%" data-sheet-open="fees">Taxes &amp; fees
          <span class="rp-acc__sum">${money(r.fees + r.taxes.total)}</span>${rpGlyph("chevron")}</button>
      </div>
      ${kvBlock("Structure", [
        kvRow("Amount financed", money(r.amountFinanced)),
        kvRow("Total of payments", money(totalOfPayments))])}`;
    const dock = `<div class="rp-dock">
      ${deal.signoff ? `<div class="rp-gatenote">Approved ${esc(timeUS(deal.signoff.at))} by ${esc(deal.signoff.by)}</div>` : ""}
      <button type="button" class="rp-primary" id="fmNext">${M.termsPresented ? "Continue" : "Mark presented"}</button></div>`;
    paint(content, dock, "rp-screen--gate");
    $("#fmNext").onclick = () => {
      if (!M.termsPresented) { M.termsPresented = true; M.termsPresentedAt = new Date().toISOString(); Store.save(); }
      go(1);
    };
  }

  /* ---------- stage 2 · the packages ---------- */
  function optionsScreen() {
    const cols = Object.entries(progSet).map(([key, p]) => RIDE_PRICE_CALC.menuColumn(deal, v, key, p));
    const customResult = RIDE_PRICE_CALC.menuColumn(deal, v, "custom", programSpec("custom"));
    if (!ui.pack) ui.pack = M.selectedProgram && M.selectedProgram !== "none" ? M.selectedProgram : cols[0].key;
    const isCustom = ui.pack === "custom";
    const col = isCustom ? customResult : (cols.find(x => x.key === ui.pack) || cols[0]);
    const ag = agreed();
    /* Custom withholds its figure until the advisor reveals it, and the dock
       must not leak what the panel is concealing */
    const hidden = isCustom && !M.showCustomPay;
    const shownProducts = isCustom ? M.custom : col.products.filter(pid => !M.custom.includes(pid));
    const delta = RIDE_PRICE_CALC.round2(col.payment - ag.payment);

    const pkgRow = `<div class="rp-pkg">${[...cols.map(x => ({ key: x.key, label: x.label })), { key: "custom", label: "Custom" }]
      .map(t => `<button type="button" class="rp-pkg__item${ui.pack === t.key ? " rp-pkg__item--on" : ""}" data-pack="${esc(t.key)}">${esc(t.label)}</button>`).join("")}</div>`;

    const payCard = hidden
      ? `<div class="rp-price"><div class="rp-withheld"><div class="rp-withheld__label">Custom payment</div>
          <div class="rp-withheld__mask">$&bull;&bull;&bull;.&bull;&bull;</div>
          <div class="rp-price__terms">Reveal it when you are ready to present</div></div>
          <div style="height:8px"></div>
          <button type="button" class="rp-button-navy" style="width:100%;height:44px;border-radius:14px" id="fmReveal">Show custom payment</button></div>`
      /* every package payment states its difference from the agreed payment,
         so a bigger number never appears without the delta beside it (§22b) */
      : priceCard(`${col.label} ${col.isTotal ? "total" : "payment"}`, money(col.payment),
        `${col.term || deal.desk.term} months · ${esc(String(col.apr != null ? col.apr : ag.apr))}% APR${delta > 0 ? ` · +${money(delta)} over the agreed payment` : delta < 0 ? ` · ${money(delta)} against the agreed payment` : " · the agreed payment"}`);

    const products = shownProducts.length
      ? `<div class="rp-group">${shownProducts.map(pid => {
        const p = RIDE_PRICE_CALC.productById(pid);
        return `<div class="rp-product"><span class="rp-product__tick">${rpGlyph("check")}</span>
          <span class="rp-row__body"><span class="rp-product__name">${esc(p.name)}</span>
            <span class="rp-product__terms">${esc(p.detail)} · ${money0(p.price)}</span></span>
          ${isCustom
            ? `<button type="button" class="rp-product__action" data-return="${esc(pid)}">Remove</button>`
            : `<button type="button" class="rp-product__action" data-move="${esc(pid)}" data-src="${esc(col.key)}">&rarr; Custom</button>`}</div>`;
      }).join("")}</div>`
      : `<div class="rp-empty"><strong>${isCustom ? "The custom box is empty" : "Everything moved to Custom"}</strong>${isCustom
        ? "Send products here from another package. The first product's package sets the rate and term."
        : "Every product in this package has been moved across."}</div>`;

    const content = `<div class="rp-eyebrow">Finance menu</div>
      <h1 class="rp-title" style="font-size:26px">Choose a protection package</h1>
      ${subLine()}${chipRow()}
      ${stageBar(1)}
      ${M.termsPresentedAt ? doneNotice(`Terms marked presented ${timeUS(M.termsPresentedAt)}`) : ""}
      ${pkgRow}
      ${payCard}
      ${products}
      <div class="rp-group"><a class="rp-row" href="#/present/${esc(deal.id)}"><span class="rp-tile">${rpGlyph("document")}</span>
        <span class="rp-row__body"><span class="rp-row__title">${M.presented ? "Re-present the products" : "Present each product"}</span>
          <span class="rp-row__sub">${M.presented ? "Presented to the customer" : "Before the payment, one at a time"}</span></span>
        <span class="rp-row__chevron"></span></a></div>
      ${M.selectedProgram && M.selectedProgram !== "none"
        ? doneNotice(`Accepted ${colLabel(M.selectedProgram)} · initials ${M.initials || "—"}${M.acceptedAt ? ` · ${timeUS(M.acceptedAt)}` : ""}`)
        : M.selectedProgram === "none" ? doneNotice(`Continued without products · initials ${M.initials || "—"}`) : ""}`;

    const dock = M.selectedProgram
      ? chDock(`<button type="button" class="rp-primary" id="fmGo">Continue</button>`)
      : chDock(`<button type="button" class="rp-primary" id="fmAccept">Accept ${esc(col.label)}</button>`,
        `<button type="button" class="rp-link" id="fmNone">Continue without products</button>`);
    paint(content, dock);

    const packRow = $(".rp-pkg");
    if (packRow && ui.packScroll) packRow.scrollLeft = ui.packScroll;
    $$("[data-pack]").forEach(b => b.onclick = () => {
      const row = $(".rp-pkg"); ui.packScroll = row ? row.scrollLeft : 0;
      ui.pack = b.dataset.pack; draw();
    });
    const rev = $("#fmReveal"); if (rev) rev.onclick = () => { M.showCustomPay = true; Store.save(); draw(); };
    $$("[data-move]").forEach(b => b.onclick = () => {
      const pid = b.dataset.move, src = b.dataset.src;
      if (!M.custom.length) M.customSource = src;
      if (!M.custom.includes(pid)) M.custom.push(pid);
      M.showCustomPay = false; Store.save(); ui.pack = "custom"; draw();
    });
    $$("[data-return]").forEach(b => b.onclick = () => {
      M.custom = M.custom.filter(x => x !== b.dataset.return);
      if (!M.custom.length) M.customSource = null;
      M.showCustomPay = false; Store.save(); draw();
    });
    const go2 = $("#fmGo"); if (go2) go2.onclick = () => go(2);
    const acc = $("#fmAccept");
    if (acc) acc.onclick = () => {
      if (isCustom && !M.custom.length) return;
      ui.sheet = "accept"; draw();
    };
    const none = $("#fmNone"); if (none) none.onclick = () => { ui.sheet = "decline"; draw(); };
  }

  /* ---------- stage 3 · disclosures and forms ---------- */
  function formsScreen() {
    const reqForms = requiredTradeForms(deal);
    reqForms.forEach(fid => { if (!deal.forms.selected.includes(fid)) deal.forms.selected.push(fid); });
    if (reqForms.length) Store.save();
    const chosen = deal.forms.selected.length;
    /* required and optional are SEPARATE (§22): the acknowledgment blocks
       Continue, additional forms never do */
    const rows = [
      { name: "Benefits acknowledgment", sub: M.ackSigned ? `Signed${M.ackSignedAt ? ` ${timeUS(M.ackSignedAt)}` : ""} · ${M.ackName || custName}` : "Required · records what was offered and what was refused",
        status: M.ackSigned ? "Complete" : "Not signed", state: M.ackSigned ? "ok" : "blocked" },
      { name: "Additional deal forms", sub: chosen ? `Optional · ${chosen} selected` : "Optional · none selected", status: "Optional", state: "" }
    ];
    const content = `<div class="rp-eyebrow">Finance menu</div>
      <h1 class="rp-title" style="font-size:26px">Disclosures &amp; forms</h1>
      ${subLine()}${chipRow()}
      ${stageBar(2)}
      ${gateRows(rows)}
      <div class="rp-group">
        ${M.ackSigned ? "" : `<button type="button" class="rp-row" data-sheet-open="ack"><span class="rp-tile">${rpGlyph("document")}</span>
          <span class="rp-row__body"><span class="rp-row__title">Client signs the acknowledgment</span><span class="rp-row__sub">On this device</span></span>
          <span class="rp-row__chevron"></span></button>`}
        <button type="button" class="rp-row" data-sheet-open="catalog"><span class="rp-tile">${rpGlyph("document")}</span>
          <span class="rp-row__body"><span class="rp-row__title">Choose additional forms</span><span class="rp-row__sub">Anything the trade requires is already selected</span></span>
          <span class="rp-row__chevron"></span></button>
      </div>`;
    const dock = M.ackSigned
      ? chDock(`<button type="button" class="rp-primary" id="fmNext">Continue</button>`)
      : `<div class="rp-dock"><div class="rp-gatenote">Continue stays unavailable until the acknowledgment is signed</div>
          <button type="button" class="rp-primary" disabled>Continue</button></div>`;
    paint(content, dock, "rp-screen--gate");
    const nx = $("#fmNext");
    if (nx) nx.onclick = () => { deal.stage = "forms"; Store.save(); go(3); };
  }

  /* ---------- stage 4 · the closeout ---------- */
  function finalizeScreen() {
    if (deal.forms.finalized) return finalizedScreen();
    const selKey = M.selectedProgram;
    const spec = selKey && selKey !== "none" ? programSpec(selKey) : null;
    const colResult = spec ? RIDE_PRICE_CALC.menuColumn(deal, v, selKey, spec) : null;
    const led = jacketLedger(deal);
    const ag = agreed();
    const rows = [
      { name: "Manager sign-off", sub: deal.signoff ? `Approved ${timeUS(deal.signoff.at)} · ${deal.signoff.by}` : "Not approved", status: deal.signoff ? "Complete" : "Blocked", state: deal.signoff ? "ok" : "blocked" },
      { name: "Terms presented", sub: M.termsPresented ? (M.termsPresentedAt ? `Marked ${timeUS(M.termsPresentedAt)}` : "Marked presented") : "Not presented", status: M.termsPresented ? "Complete" : "Blocked", state: M.termsPresented ? "ok" : "blocked" },
      { name: "Protection decision",
        sub: selKey === "none" ? "Declined — no products"
          : colResult ? `${colLabel(selKey)} · ${money(colResult.payment)}${colResult.isTotal ? "" : " / mo"}`
          : selKey ? `${colLabel(selKey)} — not offered on this deal type; choose again` : "Not chosen",
        status: selKey === "none" || colResult ? "Complete" : "Blocked", state: selKey === "none" || colResult ? "ok" : "blocked" },
      { name: "Benefits acknowledgment", sub: M.ackSigned ? `Signed${M.ackSignedAt ? ` ${timeUS(M.ackSignedAt)}` : ""}` : "Not signed", status: M.ackSigned ? "Complete" : "Blocked", state: M.ackSigned ? "ok" : "blocked" },
      jacketRow(true)
    ];
    const otherBlockers = rows.slice(0, 4).filter(r => r.state === "blocked");
    const canFinalize = otherBlockers.length === 0 && led.ready;
    const pay = colResult ? colResult.payment : isCash ? snapshot().totalDue : ag.payment;
    const totalOfPayments = RIDE_PRICE_CALC.round2(pay * deal.desk.term);

    const content = `<div class="rp-eyebrow">Finance menu</div>
      <h1 class="rp-title" style="font-size:26px">Final review</h1>
      ${subLine()}${chipRow()}
      ${stageBar(3)}
      ${gateRows(rows)}
      ${canFinalize
        ? kvBlock(`Repayment · ${money(pay)}${isCash ? " total" : ` / mo for ${deal.desk.term} months at ${String(ag.apr)}% APR`}`,
          [kvRow("Total of payments", money(totalOfPayments))])
        : led.ready ? "" : consequences("Finalizing is unavailable",
          led.blocking.map(d => `${esc(d.label)} — ${esc(d.whyShort || d.why || "still outstanding")}`))}`;

    /* §22: Finalize is ABSENT while a required document is missing. The only
       way past is an attributed override that says what it will record. */
    const dock = canFinalize
      ? `<div class="rp-dock"><div class="rp-gatenote">Finalizing pushes the deal to the DMS</div>
          <button type="button" class="rp-primary" id="fmFinal">Finalize deal</button>
          <a class="rp-link" href="#/forms/${esc(deal.id)}">Print center</a></div>`
      : otherBlockers.length
        ? `<div class="rp-dock"><div class="rp-gatenote">${esc(otherBlockers[0].name)} is still outstanding</div>
            <button type="button" class="rp-primary" disabled>Finalize deal</button></div>`
        : `<div class="rp-dock"><div class="rp-gatenote">Override · marked finalized with ${led.blocking.length} document${led.blocking.length === 1 ? "" : "s"} missing</div>
            <button type="button" class="rp-primary" id="fmOverrideFinal">Finalize with documents outstanding</button>
            <a class="rp-link" href="#/jacket/${esc(deal.id)}">Open the Deal Jacket</a></div>`;
    paint(content, dock, "rp-screen--gate");

    const fb = $("#fmFinal");
    if (fb) fb.onclick = () => doFinalize([]);
    const ov = $("#fmOverrideFinal");
    if (ov) ov.onclick = () => { ui.sheet = "finalize-override"; draw(); };
  }

  /* the one closeout: the DMS push is folded into Finalize rather than being
     a second action, and it is recorded against the Team Lead who approved
     the deal (§22c — a closeout says HOW it happened, not only that it did) */
  function doFinalize(outstandingIds, reason) {
    deal.forms.finalized = true; deal.stage = "complete";
    deal.dms = {
      at: new Date().toISOString(),
      by: (deal.signoff && deal.signoff.by) || lead,
      how: "auto",
      outstanding: outstandingIds
    };
    if (outstandingIds.length) { deal.forms.finalizedOutstanding = true; deal.forms.finalizedReason = reason || ""; }
    Store.save(); draw();
  }

  function finalizedScreen() {
    const led = jacketLedger(deal);
    const dms = deal.dms || {};
    const out = (dms.outstanding || []).map(id => (docMeta(id) || {}).label || id);
    const selKey = M.selectedProgram;
    const spec = selKey && selKey !== "none" ? programSpec(selKey) : null;
    const colResult = spec ? RIDE_PRICE_CALC.menuColumn(deal, v, selKey, spec) : null;
    const pay = colResult ? colResult.payment : isCash ? snapshot().totalDue : agreed().payment;
    const content = `<div class="rp-eyebrow">Finance menu</div>
      <h1 class="rp-title" style="font-size:26px">${out.length ? "Deal finalized with documents outstanding" : "Deal finalized"}</h1>
      ${subLine()}${chipRow()}
      ${doneNotice(`Pushed to the DMS ${dms.at ? timeUS(dms.at) : ""} · ${dms.by || lead}`)}
      ${out.length ? consequences(`Finalized with ${out.length} document${out.length === 1 ? "" : "s"} outstanding`,
        out.map(l => esc(l)).concat(deal.forms.finalizedReason ? [`Override reason — ${esc(deal.forms.finalizedReason)}`] : [])) : ""}
      ${kvBlock("The push", [
        kvRow("How", "Automatically, on Finalize"),
        kvRow("Confirmation", "None — there is no second step"),
        kvRow("By", esc(dms.by || lead))])}
      ${kvBlock("What was sent", [
        kvRow("Deal", `#${esc(deal.dealNo)} · closed`),
        kvRow("Queue", "Out of the active Deals list"),
        kvRow("Deal Jacket", `${led.requiredFiled} of ${led.requiredTotal} required · ${led.optionalFiled} optional${led.ready ? " · none outstanding" : ` · ${led.blocking.length} outstanding`}`),
        kvRow("Payment", `${money(pay)}${isCash ? " total" : ` / mo · ${deal.desk.term} months`}`)])}`;
    paint(content, chDock(`<a class="rp-primary" style="display:grid;place-items:center" href="#/deals">Return to Deals</a>`,
      `<a class="rp-link" href="#/forms/${esc(deal.id)}">Print center</a>`));
  }

  /* ---------- the sheets ---------- */
  function sheetHtml() {
    const ag = agreed();
    if (ui.sheet === "fees") {
      const r = ag.result;
      const base = RIDE_PRICE_CALC.taxableBase(deal, v);
      return `${chSheetHead("Taxes & fees")}
        <p class="rp-sheet__sub">New York · price plus accessories plus the documentation fee, less the trade allowance</p>
        ${kvBlock(`Sales tax on ${money(base)}`, r.taxes.rows.map(t => kvRow(esc(t.label), money(t.amount))), ["Tax subtotal", money(r.taxes.total)])}
        ${kvBlock("Fees", RIDE_PRICE_DATA.fees.map(f => kvRow(esc(f.label), money(f.amount))), ["Fee subtotal", money(r.fees)])}
        ${kvBlock(null, [kvRow("Taxes and fees", money(r.fees + r.taxes.total))], ["Amount financed", money(r.amountFinanced)])}
        <button type="button" class="rp-primary" data-sheet-close>Done</button>`;
    }
    if (ui.sheet === "accept" || ui.sheet === "decline") {
      const decline = ui.sheet === "decline";
      const col = ui.pack === "custom"
        ? RIDE_PRICE_CALC.menuColumn(deal, v, "custom", programSpec("custom"))
        : RIDE_PRICE_CALC.menuColumn(deal, v, ui.pack, programSpec(ui.pack));
      const products = (col.products || []).map(pid => RIDE_PRICE_CALC.productById(pid)).filter(Boolean);
      const productsTotal = col.productsTotal != null ? col.productsTotal : products.reduce((s, p) => s + p.price, 0);
      const delta = RIDE_PRICE_CALC.round2(col.payment - ag.payment);
      const termCost = RIDE_PRICE_CALC.round2(delta * deal.desk.term);
      const financeCharge = RIDE_PRICE_CALC.round2(termCost - productsTotal);
      if (decline) {
        return `${chSheetHead("Continue without products")}
          <p class="rp-sheet__sub">The customer declines every optional product · recorded on the benefits acknowledgment</p>
          <div class="rp-kv">
            ${kvRow("Payment", `${money(ag.payment)} / mo`, "the agreed payment, unchanged")}
            ${M.custom.length ? kvRow("Custom box", "Cleared", "the products already moved across are removed") : ""}
          </div>
          <div class="rp-field"><label class="rp-field__label" for="fmDecIni">Client initials</label>
            <input class="rp-field__input" id="fmDecIni" autofocus maxlength="4" placeholder="JS" autocomplete="off"></div>
          <button type="button" class="rp-primary" id="fmDecGo">Continue without products</button>`;
      }
      /* the sheet states what the customer is agreeing to in their own unit
         AND over the term, with the finance charge separated (§22b) */
      return `${chSheetHead(`Accept ${col.label}`)}
        <p class="rp-sheet__sub">${esc(products.map(p => p.name).join(" · ") || "No products")}</p>
        <div class="rp-kv"><div class="rp-kv__head">What the customer is agreeing to</div>
          ${kvRow("Products added", money(productsTotal), esc(products.map(p => `${p.name} ${money(p.price)}`).join(" + ")))}
          ${kvRow("Agreed payment", `${money(ag.payment)} / mo`)}
          ${kvRow(`${esc(col.label)} payment`, `${money(col.payment)} / mo`, `${money(productsTotal)} financed over ${deal.desk.term} months at ${esc(String(col.apr != null ? col.apr : ag.apr))}%`)}
          <div class="rp-kv__row rp-kv__row--src" style="border-top:1px solid var(--rp-ink)"><span style="color:var(--rp-ink);font-weight:740">Difference</span><span style="font-weight:760">+${money(delta)} / mo</span>
            <span class="rp-kv__src">+${money(termCost)} over ${deal.desk.term} months — ${money(productsTotal)} of products and ${money(financeCharge)} of finance charge</span></div>
        </div>
        <div class="rp-field"><label class="rp-field__label" for="fmIni">Client initials</label>
          <input class="rp-field__input" id="fmIni" autofocus maxlength="4" placeholder="JS" autocomplete="off"></div>
        <button type="button" class="rp-primary" id="fmIniGo">Accept package</button>`;
    }
    if (ui.sheet === "ack") {
      return `${chSheetHead("Benefits acknowledgment")}
        <p class="rp-sheet__sub">Deal #${esc(deal.dealNo)} · ${esc(custName)}</p>
        <p class="rp-fine" style="text-align:left">The benefits and protection options available have been explained to me/us and I/we choose the options initialed (${esc(M.initials || "—")}). I/We hold the Dealer harmless for my/our refusal of any optional benefit or protection.</p>
        <div class="rp-field"><span class="rp-field__label">Signature</span>
          <div class="rp-initials-box" style="letter-spacing:.02em;font-size:18px">${esc(custName)}</div></div>
        <button type="button" class="rp-primary" id="fmSignGo">Sign acknowledgment</button>`;
    }
    if (ui.sheet === "catalog") {
      const reqForms = requiredTradeForms(deal);
      const groups = {};
      RIDE_PRICE_DATA.dealForms.forEach(f => { (groups[f.group] = groups[f.group] || []).push(f); });
      const picked = deal.forms.selected;
      const adding = picked.filter(fid => !jacketState(deal, "form-" + fid)).length;
      return `${chSheetHead("Additional deal forms")}
        <p class="rp-sheet__sub">Anything the trade requires is selected here and locked to the deal</p>
        ${Object.entries(groups).map(([g, list]) => `<div class="rp-section">${esc(g)}</div>
          ${list.map(f => {
            const locked = reqForms.includes(f.id);
            const on = picked.includes(f.id);
            return `<button type="button" class="rp-check" data-form="${esc(f.id)}"${locked ? " disabled" : ""}>
              <span class="rp-check__box${on ? " rp-check__box--on" : ""}">${on ? rpGlyph("check") : ""}</span>
              <span>${esc(f.label)}${locked ? " · required by the trade" : ""}</span></button>`;
          }).join("")}`).join("")}
        <div style="height:6px"></div>
        <button type="button" class="rp-primary" id="fmFormsGo">${adding ? `Add ${adding} form${adding === 1 ? "" : "s"} to the jacket` : "Done"}</button>`;
    }
    if (ui.sheet === "finalize-override") {
      const led = jacketLedger(deal);
      return `${chSheetHead("Finalize with documents outstanding")}
        <p class="rp-sheet__sub">Deal #${esc(deal.dealNo)} · Team Lead action · attributed to ${esc(lead)}</p>
        ${consequences("What this records", led.blocking.map(d => `${esc(d.label)} — still missing after finalizing`)
          .concat(["The closeout screen will say the deal was finalized with documents outstanding, and name them"]))}
        <div class="rp-field"><label class="rp-field__label" for="fmFinReason">Reason</label>
          <input class="rp-field__input" id="fmFinReason" autofocus placeholder="Why the deal is finalized without these"></div>
        <button type="button" class="rp-primary" id="fmFinGo">Finalize with documents outstanding</button>`;
    }
    /* the sign-off override */
    const led = jacketLedger(deal);
    return `${chSheetHead("Resolve the Deal Jacket blocker")}
      <p class="rp-sheet__sub">Deal #${esc(deal.dealNo)} · Team Lead action · attributed to ${esc(lead)}</p>
      ${consequences("The documents stay missing", led.blocking.map(d => `${esc(d.label)} — ${esc(d.why || "outstanding")}`)
        .concat(["An override records a reason; it does not supply the documents"]))}
      <div class="rp-field"><label class="rp-field__label" for="fmReason">Reason</label>
        <input class="rp-field__input" id="fmReason" autofocus placeholder="Why the deal proceeds without these"></div>
      <button type="button" class="rp-primary" id="fmReasonGo">Record override</button>`;
  }

  function wireSheet(sheet) {
    const need = (sel) => { const el = $(sel, sheet); if (!el) return null; const val = (el.value || "").trim(); if (!val) { el.classList.add("rp-field__input"); el.style.borderColor = "var(--rp-danger)"; return null; } return val; };
    const reason = $("#fmReasonGo", sheet);
    if (reason) reason.onclick = () => {
      const val = need("#fmReason"); if (!val) return;
      const led = jacketLedger(deal);
      jacketOf(deal).override = { by: lead, at: new Date().toISOString(), reason: val, docs: led.blocking.map(d => d.id) };
      Store.save(); ui.sheet = null; sheets.close(); draw();
    };
    const finGo = $("#fmFinGo", sheet);
    if (finGo) finGo.onclick = () => {
      const val = need("#fmFinReason"); if (!val) return;
      const led = jacketLedger(deal);
      ui.sheet = null; sheets.close();
      doFinalize(led.blocking.map(d => d.id), val);
    };
    const iniGo = $("#fmIniGo", sheet);
    if (iniGo) iniGo.onclick = () => {
      const val = need("#fmIni"); if (!val) return;
      M.selectedProgram = ui.pack; M.initials = val; M.acceptedAt = new Date().toISOString();
      Store.save(); ui.sheet = null; sheets.close(); go(2);
    };
    const decGo = $("#fmDecGo", sheet);
    if (decGo) decGo.onclick = () => {
      const val = need("#fmDecIni"); if (!val) return;
      M.selectedProgram = "none"; M.initials = val; M.acceptedAt = new Date().toISOString();
      M.custom = []; M.customSource = null; M.showCustomPay = false;
      Store.save(); ui.sheet = null; sheets.close(); go(2);
    };
    const signGo = $("#fmSignGo", sheet);
    if (signGo) signGo.onclick = () => {
      M.ackSigned = true; M.ackName = custName; M.ackSignedAt = new Date().toISOString();
      /* the acknowledgment is a DOCUMENT: it files, and the count moves with
         a named cause on the screen that caused it (§19a, §22a) */
      jacketReceive(deal, "form-fimenu", "esign", "Signed on this device");
      Store.save(); ui.sheet = null; sheets.close(); draw();
    };
    $$("[data-form]", sheet).forEach(b => b.onclick = () => {
      const fid = b.dataset.form;
      const at = deal.forms.selected.indexOf(fid);
      if (at >= 0) deal.forms.selected.splice(at, 1); else deal.forms.selected.push(fid);
      Store.save(); draw();
    });
    const formsGo = $("#fmFormsGo", sheet);
    if (formsGo) formsGo.onclick = () => {
      /* the action states how many are being added, so the chip's new count
         has a stated cause (§22a) */
      deal.forms.selected.forEach(fid => { if (!jacketState(deal, "form-" + fid)) jacketReceive(deal, "form-" + fid, "app", "Selected from the catalog"); });
      Store.save(); ui.sheet = null; sheets.close(); draw();
    };
  }

  /* ---------- the frame ---------- */
  function paint(content, dockHtml, cls) {
    if (!ui.sheet) sheets.close();
    view().innerHTML = chShell({ template: "task", title: custName, closeId: "fmClose", cls: cls || "" },
      content, dockHtml, { scrim: "fmScrim", sheet: "fmSheet" });
    $("#fmClose").onclick = () => navigate("#/deals");
    chFitDock();
    chWireRole(sheets, draw);
    $$("[data-sheet-open]").forEach(b => b.onclick = () => { ui.sheet = b.dataset.sheetOpen; if (b.dataset.sheetOpen === "buyers") buyers = null; draw(); });
    if (ui.sheet === "buyers") { if (buyers) buyers.open(); else buyers = buyersKitSheet(deal, sheets, () => draw()); }
    else if (ui.sheet) sheets.open(sheetHtml(), wireSheet);
  }

  function go(stageIdx) {
    M.step = STEP_OF[stageIdx];
    M.maxStep = Math.max(M.maxStep || 1, M.step);
    ui.sheet = null;
    Store.save(); draw();
  }

  function draw() {
    if (!deal.signoff) return gateScreen();
    if (deal.forms.finalized) return finalizedScreen();
    ({ 0: termsScreen, 1: optionsScreen, 2: formsScreen, 3: finalizeScreen }[stageOf(M.step)] || termsScreen)();
  }
  draw();
});

/* ============================================================
   DEAL JACKET — the documents this deal needs, and what came back
   ============================================================
   The jacket keeps a RECORD, never a file: which document, who took
   it in, when, and how it was established. Two states, and they are
   never blurred together — "verified" means the app read a marker it
   printed itself, "marked received" means a person said so. The app
   can only ever recognise its own paper; a title, a bank letter or an
   insurance card is unreadable by design (invariant 4).             */

/* documents that arrive from outside the dealership — the app prints no
   marker on these and can never identify one, so they are hand-recorded */
const JACKET_OUTSIDE = ["license", "insurance", "title", "lienrel", "paystub",
  "tradetitle", "tradereg", "payoff"];

/* jacketOf() creates the record and is for the write paths only. Reading is
   jacketRead(): dealTitle() calls it on every render of every deal screen, and
   a display path that writes to state is how a reset stops coming back clean. */
function jacketOf(deal) {
  if (!deal.jacket) deal.jacket = { docs: {}, extra: [] };
  if (!deal.jacket.docs) deal.jacket.docs = {};
  if (!deal.jacket.extra) deal.jacket.extra = [];
  return deal.jacket;
}

const EMPTY_JACKET = { docs: {}, extra: [], req: {}, override: null, client: {}, reqSentAt: null };
function jacketRead(deal) {
  const j = deal && deal.jacket;
  if (!j) return EMPTY_JACKET;
  return { docs: j.docs || {}, extra: j.extra || [], req: j.req || {}, override: j.override || null, client: j.client || {}, reqSentAt: j.reqSentAt || null };
}

/* jacket document ids match the print route: a core printable is its own
   key ("agreement"), a deal form is "form-" + its id ("form-title") */
function docMeta(docId) {
  if (!docId) return null;
  if (docId.indexOf("form-") === 0) {
    const f = RIDE_PRICE_DATA.dealForms.find(x => x.id === docId.slice(5));
    return f ? { id: docId, label: f.label, group: f.group, code: f.code,
      origin: JACKET_OUTSIDE.includes(f.id) ? "outside" : "app" } : null;
  }
  const p = RIDE_PRICE_DATA.printedDocs.find(x => x.id === docId);
  return p ? { id: docId, label: p.label, group: p.group, code: p.code, origin: "app" } : null;
}

function docIdByCode(code) {
  const f = RIDE_PRICE_DATA.dealForms.find(x => x.code === code);
  if (f) return "form-" + f.id;
  const p = RIDE_PRICE_DATA.printedDocs.find(x => x.code === code);
  return p ? p.id : null;
}

/* ---- the deal jacket's ledger (owner's package v035) -----------------------
   What this particular deal needs, worked out from the deal itself, in three
   classes — and the class is the model, not a flag somebody sets:

   REQUIRED     what has to be in the jacket before this deal can fund. Fifteen
                items for a financed deal with a trade, which is the shape of
                the demo deal; a cash deal, or one with no trade, derives its
                own smaller package. That is why the count always states the
                denominator it derived and never a bare number: "Jacket · 11"
                has been read as eleven filed on one board and eleven
                outstanding on another, and both shipped (§19a).
   OPTIONAL     recorded on the deal, counted apart, never in the denominator —
                the co-buyer's identity record (absent on an individual deal,
                so it cannot sit in a universal package), the lender's approval
                notice (an incoming bank decision, not a borrower disclosure),
                and the records the deal produces on its way through. They
                appear once they exist.
   CONDITIONAL  the lien release, which only a financed trade needs. It stays
                out of the denominator — a deal with no trade would otherwise
                carry a permanent phantom — and instead HOLDS funding sign-off
                for the deals it does apply to (§18).

   requiredTradeForms() stays the authority on the three forms the trade's own
   ownership answers lock. */
function jacketDocs(deal) {
  const out = [];
  /* whyShort is the phone's status tag (owner usability pass, 2026-08-16:
     one status line per card); the long reason stays for desktop */
  const add = (id, why, whyShort, kind) => {
    const m = docMeta(id);
    if (!m || out.some(d => d.id === id)) return;
    out.push(Object.assign({ why, whyShort: whyShort || why, added: false, kind: kind || "required" }, m));
  };
  /* an optional record joins the list once it EXISTS — filed, or added by
     hand. Listing every optional document the store could ever attach would
     put a dozen rows an advisor cannot act on into a screen whose entire job
     is "what are we waiting on" (§23); unfiled ones live in the Add optional
     document catalogue instead. */
  /* a document somebody added BY HAND stays hand-added: the loop at the end
     owns it, keeps added:true, and that is what lets it be removed again. If
     this shortcut claimed it first the row would lose its Remove. */
  const byHand = jacketRead(deal).extra;
  const opt = (id, why, whyShort) => {
    if (jacketState(deal, id) && byHand.indexOf(id) < 0) add(id, why, whyShort, "optional");
  };
  const isCash = deal.dealType === "cash";
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const cb = deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;
  const hasTrade = !!(deal.trade && deal.trade.has);

  /* --- required, in the order the ledger numbers them --- */
  if (hasTrade) {
    add("form-tradetitle", "The title to the vehicle being traded in", "Trade title");
    add("form-tradereg", "The registration that proves who owns it", "Trade registration");
    add("form-payoff", "What the lienholder is owed, and the date it is good through", "Trade payoff");
  }
  add("idverify-primary", "The buyer photographed against the license on file", "Identity record");
  add("form-license", cb ? "Identity for both buyers on the deal" : "Identity for the buyer", "Identity");
  add("form-insurance", "Coverage has to be proven before the car leaves the lot", "Required for delivery");
  if (!isCash) add("form-paystub", "Income the lender will want to see", "Proof of income");
  add("form-privacy", "Handed to every client at delivery", "Required at delivery");
  add("form-reg", "Registers and titles the new vehicle in New York", "Title & registration");
  if (!isCash) {
    add("form-contracts", isLease ? "The lease agreement itself" : "The retail instalment contract itself", isLease ? "Lease contract" : "Retail contract");
    add("form-creditmatch", "The signed application must match what went to the lender", "Lender match");
    add("form-riskdisc", "Required whenever credit decides the rate", "Credit disclosure");
  }
  add("form-tqi", "The delivery quality walk, done with the client", "Delivery walk");
  /* the primary regulatory record of the application. It reads Needed until
     the lane submits, rather than appearing out of nowhere with the count
     already moved — every change has a cause on the screen that caused it */
  if (!isCash) add("creditapp", cb ? "The joint application both applicants completed" : "The application that goes to the lender", "Submitted application");
  add("delivery", "The delivery checklist itself, signed off", "Delivery sign-off");

  /* --- conditional: required when it applies, never in the denominator ---
     A deal with no trade would otherwise carry these as permanent phantoms,
     which is exactly why the owner's ledger keeps them out of the fifteen. */
  if (hasTrade && tradeNeedsLienRelease(deal)) {
    add("form-lienrel", "The trade carries a lien — funding does not sign off until the lender releases it", "Lien release", "conditional");
  }
  /* the trade's own ownership answers still select and lock these on the deal
     forms step; requiredTradeForms() stays their authority */
  if (hasTrade) requiredTradeForms(deal).forEach(fid => add("form-" + fid, "Required by the trade's own ownership answers", "Trade requirement", "conditional"));

  /* --- optional: counted apart, listed once they exist --- */
  opt("idverify-cobuyer", "The co-buyer's own identity record", "Co-buyer identity");
  opt("approval", "The lender's answer on the terms it approved", "Lender approval");
  opt("agreement", "The base terms the client signed", "Signed base terms");
  opt("testdrive", "Signed before the client drove the car", "Signed pre-drive");
  opt("form-appraisal", "What the trade was valued at, and why", "Trade valuation");
  opt("form-odometer", "Federal odometer disclosure for the trade", "Trade odometer");
  opt("form-plates", "The client's plates move to the new vehicle", "Plate transfer");
  opt("form-title", "Required by the trade's own ownership answers", "Trade requirement");
  opt("form-poa", "Signed because the titled owner is not the buyer", "Power of attorney");
  opt("form-settings", "Phone, seats and mirrors set before handover", "Handover setup");
  opt("form-accsheet", "What was fitted to the car, and what it cost", "Accessories");
  opt("form-fimenu", "The products the client initialed for", "Menu initials");
  opt("repayment", "What was purchased and what was declined", "Menu record");
  opt("form-gapwaiver", "GAP was purchased — the waiver goes in the jacket", "GAP purchased");

  /* anything the advisor added by hand, or a scan brought in unprompted */
  jacketRead(deal).extra.forEach(id => {
    const m = docMeta(id);
    if (m && !out.some(d => d.id === id)) out.push(Object.assign({ why: "Added to this deal by hand", whyShort: "Added by hand", added: true, kind: "optional" }, m));
  });
  return out;
}

/* A lien release is a prerequisite only when the trade carries a lien. A deal
   with no trade, or a free-and-clear title, never needs one — which is exactly
   why it is not a sixteenth required item.

   requiredTradeForms() names a NARROWER case: a lien that has already been
   paid off, where the release is the document the forms step locks. Funding is
   the wider question — a lien on the title holds sign-off whether or not the
   payoff has gone out yet — so this is the authority for the jacket and that
   one stays the authority for the forms step. */
function tradeNeedsLienRelease(deal) {
  return ownOf(deal).lienOnTitle === true;
}

/* the documents an advisor can attach by hand: the catalogue minus the
   required package, minus whatever is already on the deal. Derived, so the
   sheet states its own number and it cannot drift from the list it offers. */
function jacketOptionalCatalog(deal) {
  const have = jacketDocs(deal).map(d => d.id);
  return RIDE_PRICE_DATA.dealForms.map(f => "form-" + f.id)
    .filter(id => have.indexOf(id) < 0).map(id => docMeta(id)).filter(Boolean);
}

/* the product ids the client actually chose, whichever column they chose from */
function menuChosenProducts(deal) {
  const M = deal.menu || {};
  if (!M.selectedProgram || M.selectedProgram === "none") return [];
  if (M.selectedProgram === "custom") return M.custom || [];
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const set = RIDE_PRICE_DATA.programs[isLease ? "lease" : deal.dealType === "cash" ? "cash" : "finance"];
  const p = set && set[M.selectedProgram];
  return (p && p.products) || [];
}

function jacketState(deal, docId) { return jacketRead(deal).docs[docId] || null; }

function jacketCounts(deal) {
  const docs = jacketDocs(deal);
  const inJacket = docs.filter(d => jacketState(deal, d.id));
  return { total: docs.length, have: inJacket.length, missing: docs.length - inJacket.length };
}

/* A count is only meaningful with its denominator (§19a). This returns both,
   the optional tally separately, the conditional documents that apply to THIS
   deal, and the outstanding list by name — because "2 outstanding" and a route
   to each is the difference between a gate an advisor can act on and a number
   they can only stare at.

   The three classes come from jacketDocs(), which is where the deal's own
   shape decides them; nothing here re-derives what is required, so the gate
   and the chip cannot disagree. */
function jacketLedger(deal) {
  const docs = jacketDocs(deal);
  const filedIn = (list) => list.filter(d => jacketState(deal, d.id));
  const required = docs.filter(d => d.kind === "required");
  const optional = docs.filter(d => d.kind === "optional");
  const conditional = docs.filter(d => d.kind === "conditional");
  const outstanding = required.filter(d => !jacketState(deal, d.id));
  const conditionalOut = conditional.filter(d => !jacketState(deal, d.id));
  return {
    requiredTotal: required.length, requiredFiled: filedIn(required).length,
    optionalTotal: optional.length, optionalFiled: filedIn(optional).length,
    conditional, conditionalOutstanding: conditionalOut,
    filed: filedIn(docs).length, total: docs.length,
    outstanding,
    /* what actually holds sign-off. A lien release is out of the DENOMINATOR,
       not out of the gate (§18), so the two lists are different lengths and
       the screens say so: "14 of 15 · 1 outstanding, 1 conditional". */
    blocking: outstanding.concat(conditionalOut),
    ready: outstanding.length === 0 && conditionalOut.length === 0
  };
}

/* THE jacket count, everywhere it is written. A bare number is never
   acceptable (§19a), so one helper owns the format and it cannot drift between
   screens. It tracks REQUIRED only: adding an optional document leaves it
   where it was, and the optional tally is stated separately. */
function jacketRequired(deal) { return jacketDocs(deal).filter(d => d.kind === "required"); }
function jacketChipText(deal) {
  const req = jacketRequired(deal);
  return `${req.filter(d => jacketState(deal, d.id)).length} of ${req.length}`;
}
function chJacketChip(deal) {
  return `<a class="rp-chip" href="#/jacket/${esc(deal.id)}">Jacket · ${esc(jacketChipText(deal))}</a>`;
}

/* a two-sided document that has one side on file: the client pipeline holds
   it as rejected for its own missing-page reason, which is the SAME record a
   capture appends to. There is no second store of sides — jacketDocs() gives
   the document, this says whether one side of it is already in (§19a). */
function jacketPartial(deal, docId) {
  const m = clientMeta(docId);
  const r = jacketClient(deal)[docId];
  return !!(m && m.missingPage && r && r.state === "rejected" && r.rejectedReason === m.missingPage.title && !jacketState(deal, docId));
}

/* outstanding documents, worded for a manager reading a checklist */
function jacketGaps(deal) {
  return jacketDocs(deal).filter(d => !jacketState(deal, d.id)).map(d => d.label + " — not in the deal jacket");
}

function jacketReceive(deal, docId, how, note) {
  const j = jacketOf(deal);
  if (!jacketDocs(deal).some(d => d.id === docId) && !j.extra.includes(docId)) j.extra.push(docId);
  j.docs[docId] = { how, by: roleName(), at: new Date().toISOString() };
  if (note) j.docs[docId].note = note;
  Store.save();
}

function jacketRemove(deal, docId) {
  const j = jacketOf(deal);
  delete j.docs[docId];
  /* taking a document back out returns it to "not yet collected" — the
     client pipeline record goes with it, or the row would wear a stale
     Requested/accepted state that a resend could never refresh (its guard
     rightly skips accepted records). Review find. */
  if (j.client) delete j.client[docId];
  if (j.req) delete j.req[docId];
  Store.save();
}

/* jacketRequest and its j.req stamp are retired: the client pipeline record
   (jacket.client) is the one ledger of what was requested. Old blobs may
   still carry j.req entries — they are ignored everywhere and cleaned up
   per-document by jacketRemove. */

/* ---------------- the document-request flow (owner's v2 prototype) ----------------
   Three customer documents travel a state machine:
     requested → received → accepted, or requested/received → rejected →
     the client retakes through the SAME link → received → accepted.
   Two ledgers stay separate at all times: RECEIVED counts a file the moment
   it lands (a rejected file still landed); ACCEPTED counts only what the
   advisor pressed Accept on, and the funding gate reads accepted only.
   Accepted documents live in jacket.docs like everything else (how:"client");
   the in-flight pipeline lives in jacket.client. Records only — the photos a
   client "sends" exist solely in this session's memory, below. */

const CLIENT_QUEUE_IDS = ["form-insurance", "form-license", "form-paystub"];

/* ---- ONE icon set for every icon slot (owner rule, 2026-08-27) ------------
   Every icon in the app's UI slots is a line icon from here: same 24-grid,
   same 1.7 stroke, currentColor, no fill. Emoji are not icons — they render
   differently on every phone, cannot take the surrounding colour, and the
   mixture is what made these screens look unrelated. Add a new key here and
   reference it; never inline an emoji into an icon slot.
   Slots that must use this set: .dr-rowicon, .dr-sheetact__ico,
   .scan-tip__icon, .dk-chip, and the .sa-card rows. (Emoji stay fine in
   prose and in the drawer's own nav list, which is not an icon slot.) ---- */
const RP_ICON = {
  shield: `<path d="M12 3 5 6v5.5c0 4.3 2.9 8.3 7 9.5 4.1-1.2 7-5.2 7-9.5V6l-7-3z"/>`,
  idcard: `<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5 16.4c.6-1.6 2-2.5 3.5-2.5s2.9.9 3.5 2.5M15 10h4M15 13.5h3"/>`,
  page: `<path d="M6 2.5h8.5L19 7v14.5H6z"/><path d="M14 2.5V7h5M9 12h6M9 15.5h6M9 8.5h2"/>`,
  file: `<path d="M6 2.5h8.5L19 7v14.5H6z"/><path d="M14 2.5V7h5"/>`,
  camera: `<path d="M3 8.5h3.2l1.6-2.4h8.4l1.6 2.4H21v11H3z"/><circle cx="12" cy="13.6" r="3.6"/>`,
  images: `<rect x="3" y="6" width="14" height="11" rx="2"/><path d="M7 3.5h14v11"/><path d="m5 15 3.4-3.4 2.6 2.6 2.2-2.2L17 15.6"/>`,
  lock: `<rect x="4.5" y="10" width="15" height="10.5" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>`,
  user: `<circle cx="12" cy="8" r="3.6"/><path d="M4.8 20.5c.9-3.4 3.8-5.3 7.2-5.3s6.3 1.9 7.2 5.3"/>`,
  folder: `<path d="M3 5.5h6l2 2.5h10v11.5H3z"/>`,
  car: `<path d="M4 16.5h16v-2.8c0-1.2-.9-2.1-2.1-2.1h-1.8l-2.7-3.5c-.5-.7-1.3-1.1-2.2-1.1h-2.7c-.9 0-1.7.4-2.2 1.1l-2.7 3.5h-.5c-1.2 0-2.1.9-2.1 2.1v2.8z"/><circle cx="8.2" cy="16.8" r="1.9"/><circle cx="15.8" cy="16.8" r="1.9"/>`,
  swap: `<path d="M6.5 8.5h11M14.5 5.5l3 3-3 3M17.5 15.5h-11M9.5 12.5l-3 3 3 3"/>`,
  dollar: `<path d="M12 3.5v17M16 7.3c-.8-1.3-2.2-2.1-3.9-2.1-2.1 0-3.7 1.2-3.7 3 0 3.9 7.7 2 7.7 5.9 0 1.8-1.7 3-4 3-1.9 0-3.4-.8-4.2-2.2"/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
  sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/>`,
  percent: `<path d="M5 19 19 5"/><circle cx="7.2" cy="7.2" r="2.7"/><circle cx="16.8" cy="16.8" r="2.7"/>`,
  calendar: `<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4"/>`,
  wrench: `<path d="M20.5 6.7a5 5 0 0 1-6.6 6.6L7 20.2a2.1 2.1 0 0 1-3-3l6.9-6.9a5 5 0 0 1 6.6-6.6l-3.3 3.3.8 2.7 2.7.8z"/>`,
  umbrella: `<path d="M12 3.5a8.8 8.8 0 0 1 8.8 8.5H3.2A8.8 8.8 0 0 1 12 3.5z"/><path d="M12 12v6.3a2.1 2.1 0 0 0 4.2 0"/>`,
  box: `<path d="m12 2.8 8.5 4.4v9.6L12 21.2l-8.5-4.4V7.2z"/><path d="M3.5 7.2 12 11.6l8.5-4.4M12 11.6v9.6"/>`,
  sparkle: `<path d="M12 3.5 13.8 9.2l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.7-5.7-1.8 5.7-1.8z"/><path d="M19.2 3.2v3.2M20.8 4.8h-3.2"/>`,
  key: `<circle cx="7.5" cy="15.5" r="4"/><path d="m10.5 12.5 8-8M15.5 7.5l3 3M12.8 10.2l2.2 2.2"/>`,
  wheel: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5V9M12 15v5.5M3.5 12H9M15 12h5.5"/>`,
  windshield: `<path d="M3.5 18.5 6 6.5h12l2.5 12z"/><path d="m10 9.5 1.8 2-1.4 1.8 1.8 2.2"/>`,
  carplus: `<path d="M4 17h14v-2.6c0-1.1-.8-1.9-1.9-1.9h-1.6l-2.4-3.2c-.5-.6-1.2-1-2-1H7.7c-.8 0-1.5.4-2 1l-2.4 3.2h-.4c-1.1 0-1.9.8-1.9 1.9"/><circle cx="7.4" cy="17.3" r="1.8"/><circle cx="14.6" cy="17.3" r="1.8"/><path d="M19.5 3.5v5M17 6h5"/>`,
  radar: `<circle cx="12" cy="12" r="1.6"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 19a10 10 0 0 1 0-14M19 5a10 10 0 0 1 0 14"/>`,
  bank: `<path d="m3.5 9 8.5-5.5L20.5 9v1.5h-17z"/><path d="M5.5 10.5v7M10 10.5v7M14 10.5v7M18.5 10.5v7M4 17.5h16M3 20.5h18"/>`,
  dots: `<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>`,
  trash: `<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5M10 10.5v7M14 10.5v7"/>`,
  upload: `<path d="M12 16.5V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15"/>`,
  close: `<path d="M6 6l12 12M18 6 6 18"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  alert: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.6v5.2M12 16.3h.01"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`
};
const rpIcon = (k) => `<svg viewBox="0 0 24 24">${RP_ICON[k] || RP_ICON.file}</svg>`;
/* the same icons in the glyph set's own terms — stroke, currentColor, the
   rp-icon box — for a kit tile the glyph files do not cover (the next-step
   rows of vehicle selection: car, swap, dollar, page, check). Reported with
   v025 as a kit gap. */
const rpIconGlyph = (k) => `<svg class="rp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RP_ICON[k] || RP_ICON.file}</svg>`;
/* the customer's document rows, keyed by the document they stand for. The
   KEY is the shared thing: a client row draws the plain svg, a kit tile draws
   the same glyph through .rp-icon so the kit sizes it, and neither has to
   know the other's shape. */
const DR_ROW_ICON_KEY = { "form-insurance": "shield", "form-license": "idcard", "form-paystub": "page", default: "file" };
const drRowIconKey = (docId) => DR_ROW_ICON_KEY[docId] || DR_ROW_ICON_KEY.default;
const DR_ROW_ICON = Object.keys(DR_ROW_ICON_KEY).reduce((m, k) => (m[k] = rpIcon(DR_ROW_ICON_KEY[k]), m), {});
function clientMeta(docId) { return RIDE_PRICE_DATA.clientDocs[docId.replace(/^form-/, "")] || null; }

function jacketClient(deal) {
  const j = deal && deal.jacket;
  return (j && j.client) || {};
}
function jacketClientOf(deal) {
  const j = jacketOf(deal);
  if (!j.client) j.client = {};
  return j.client;
}
/* which of the three this deal actually needs, still in flight */
function clientQueue(deal) {
  const need = jacketDocs(deal).map(d => d.id);
  return CLIENT_QUEUE_IDS.filter(id => need.includes(id) && !jacketState(deal, id));
}
function jacketLedgers(deal) {
  const docs = jacketDocs(deal);
  const cl = jacketClient(deal);
  const accepted = docs.filter(d => jacketState(deal, d.id)).length;
  const landed = docs.filter(d => !jacketState(deal, d.id) && cl[d.id] && cl[d.id].state !== "requested").length;
  return { total: docs.length, accepted, received: accepted + landed, missing: docs.length - accepted };
}

/* One secure request, one ledger. The jacket owned this write; the document
   viewer's "Send secure upload link" needs exactly the same thing, and a
   second copy of it is how a removed document once read "Requested" forever
   (the two-ledger bug the jacket comment describes). One function, two
   callers. */
function jacketSendRequest(deal, ids) {
  const j = jacketOf(deal);
  const cl = jacketClientOf(deal);
  const at = new Date().toISOString();
  j.reqSentAt = at;
  ids.forEach(qid => {
    /* a rejected record keeps its rejection and its preserved pages: the
       reason, and the side already on file, are exactly what the retake
       needs. What every document on the send gets is the send's stamp. */
    if (!cl[qid] || cl[qid].state === "requested") cl[qid] = { state: "requested" };
    cl[qid].requestedAt = at;
  });
  Store.save();
}

/* the photos a client captures live for THIS session only — a JS map of
   object URLs, never the Store, never localStorage (owner decision + the
   quota measurement). A reload forgets them; the records survive. */
const CLIENT_PHOTOS = {};
function clientPhotoKey(dealId, docId) { return dealId + ":" + docId; }
function clientPhotos(dealId, docId) { return CLIENT_PHOTOS[clientPhotoKey(dealId, docId)] || []; }
function clientPhotosSet(dealId, docId, urls) { CLIENT_PHOTOS[clientPhotoKey(dealId, docId)] = urls; }
function clientPhotoDrop(dealId, docId, idx) {
  const urls = clientPhotos(dealId, docId);
  const gone = urls.splice(idx, 1);
  gone.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
}
/* replacing a page set must revoke the old URLs, or every recapture leaks
   the earlier blobs for the rest of the session */
function clientPhotosClear(dealId, docId) {
  clientPhotos(dealId, docId).forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
  clientPhotosSet(dealId, docId, []);
}

/* the prototype stamps these with a time, which reads right on the day and
   says nothing a week later — so it is the time while it is still today,
   and the date once it is not. One or the other, never both. */
const drStamp = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* the simulated instant verification (owner's prototype, 2026-08-18): a
   missing page blocks until the count is met, the insurance card is flagged
   once on its first complete attempt, everything else verifies on the spot.
   Nothing reads a photo (invariant 4) — each document's beat sheet lives on
   its clientDocs entry, and the jacket record says the check was simulated. */
/* the first-attempt beat's text, with its date computed at run time */
function drFirstIssueText(m) {
  const dte = new Date(); dte.setDate(dte.getDate() + m.firstIssue.days);
  return m.firstIssue.title + " (" + dte.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ")";
}

function drIssueFor(deal, docId) {
  const m = clientMeta(docId);
  const r = jacketClient(deal)[docId] || {};
  const pages = clientPhotos(deal.id, docId).length || r.pages || 0;
  if (m.minPages && pages < m.minPages && m.missingPage) return m.missingPage.title;
  if (m.firstIssue && !(r.tries > 0)) return drFirstIssueText(m);
  return null;
}

/* The one thing a reader that works well says when it cannot read a photo.
   It replaces the old three-card coaching screen (owner, 2026-08-26): the
   customer is told plainly and given the retake, not taught photography. */
const DR_UNREADABLE = "Too blurry to read";
function drRejectUnreadable(deal, docId) {
  const rc = jacketClientOf(deal);
  const r = rc[docId] || (rc[docId] = {});
  r.tries = (r.tries || 0) + 1;
  r.receivedAt = new Date().toISOString();
  r.state = "rejected";
  r.rejectedReason = DR_UNREADABLE;
  Store.save();
  return { ok: false, issue: DR_UNREADABLE };
}

function drAutoVerify(deal, docId) {
  const clw = jacketClientOf(deal);
  const r = clw[docId] || (clw[docId] = {});
  const issue = drIssueFor(deal, docId);
  r.tries = (r.tries || 0) + 1;
  r.receivedAt = new Date().toISOString();
  r.pages = clientPhotos(deal.id, docId).length || 1;
  r.draftPages = r.pages;
  if (issue) {
    r.state = "rejected";
    r.rejectedReason = issue;
    Store.save();
    return { ok: false, issue };
  }
  r.state = "accepted";
  r.acceptedAt = r.receivedAt;
  r.rejectedReason = null;
  Store.save();
  jacketReceive(deal, docId, "sort");
  return { ok: true };
}

/* pinch-to-zoom on a photo stage (the prototype's gesture). Touch only —
   the ± buttons stay the mouse and keyboard path. Scales the node directly
   during the gesture so it tracks the fingers, then commits to state. */
function drPinchZoom(stage, st, onEnd) {
  if (!stage) return;
  const art = () => stage.querySelector(".dr-photo, .dr-photoart");
  const gap = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  let start = 0, from = 1;
  stage.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) { start = gap(e.touches); from = st.zoom; }
  }, { passive: true });
  stage.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 2 || !start) return;
    e.preventDefault();
    st.zoom = Math.max(.75, Math.min(1.9, from * (gap(e.touches) / start)));
    const el = art(); if (el) el.style.transform = `scale(${st.zoom})`;
  }, { passive: false });
  stage.addEventListener("touchend", () => {
    if (!start) return;
    start = 0;
    if (onEnd) onEnd();
  }, { passive: true });
}

/* a page with no drawable preview (a PDF — rendering one would need a
   reader library, invariant 3) is kept as an empty entry: it still counts
   as a page everywhere, and every stage falls through to the placeholder */
function drPreviewUrl(file) {
  return (file.type || "").indexOf("image/") === 0 ? URL.createObjectURL(file) : "";
}

/* an upload replaces the document's pages, except while the block is a
   missing page — then new shots append, so front + back can arrive one at
   a time (the prototype's preserving rule) */
/* V3 — provenance is PER SIDE. Stamp the pages a single capture event added
   (indices from `before` up to the current count) with who took them. The
   customer paths must write "customer" explicitly: a whole-document
   via:"advisor" (an advisor scanned the front after the link went out) would
   otherwise claim a back the customer uploaded afterwards (review find). */
/* who took each side, resolved: an explicit sideVia entry wins; otherwise
   the whole-document via ("advisor" means every side), else the customer. */
function drSideVia(r, n) {
  return Array.from({ length: n }, (_, i) => (r.sideVia && r.sideVia[i]) || (r.via === "advisor" ? "advisor" : "customer"));
}
/* did the CUSTOMER do anything with this record — upload any side? The
   tracking sheet reports what the customer did with the link, so a document
   the advisor started but the customer retook counts as theirs (review find). */
function drCustomerTouched(r) {
  if (!r) return false;
  const n = Math.max(r.pages || 0, r.draftPages || 0, (r.sideVia || []).length);
  return drSideVia(r, n).some(v => v === "customer");
}
function drStampSides(deal, docId, indices, via) {
  const r = jacketClient(deal)[docId]; if (!r) return;
  r.sideVia = r.sideVia || [];
  for (const i of indices) r.sideVia[i] = via;
  Store.save();
}
/* the indices from `from` to the end of the current set */
function drSidesFrom(deal, docId, from) {
  const n = clientPhotos(deal.id, docId).length;
  return Array.from({ length: Math.max(0, n - from) }, (_, k) => from + k);
}
/* returns the index the new pages START at: 0 when the set was replaced (a
   retake), the old length when a missing page was appended. A retake that
   replaces one page with one page leaves the count unchanged, so "count
   before" cannot tell the caller which pages are new — this can (review find). */
function drAddShots(deal, docId, files) {
  const m = clientMeta(docId);
  const r = jacketClient(deal)[docId];
  /* Preserving is for the RETAKE of one missing side: it keeps the side
     already on file so the new one lands beside it. A capture that supplies
     the whole document is a replacement — preserving there leaves a blank
     page in the set and a two-sided licence reports "3 of 3". Reachable since
     the seed started carrying the front the resolver captured. */
  const preserving = r && r.state === "rejected" && m.missingPage
    && r.rejectedReason === m.missingPage.title
    && !(m.minPages && files.length >= m.minPages);
  if (!preserving) clientPhotosClear(deal.id, docId);
  const urls = clientPhotos(deal.id, docId).slice();
  /* photos live only in the session that captured them (owner decision);
     after a reload the record still says one page arrived but the set is
     empty. Keep the record's count as empty slots — every renderer already
     shows a placeholder for a missing image — so the new side lands where
     it belongs and the count reaches what the document needs. */
  if (preserving) while (urls.length < (r.pages || 0)) urls.push(null);
  const from = urls.length;
  Array.from(files).forEach(f => urls.push(drPreviewUrl(f)));
  clientPhotosSet(deal.id, docId, urls);
  return from;
}

/* remove a hand-added document from the deal entirely — computed ones stay */
function jacketDrop(deal, docId) {
  const j = jacketOf(deal);
  j.extra = j.extra.filter(x => x !== docId);
  delete j.docs[docId];
  Store.save();
}

/* the marker token is device-local on purpose: it is minted here, by this
   browser, the first time this device prints for the deal. A token from
   another device means nothing here — which is exactly how the cross-device
   case comes to fail out loud instead of quietly guessing. */
function dealToken(deal) {
  if (deal.docToken) return deal.docToken;
  const used = new Set(Store.s.deals.map(d => d.docToken).filter(Boolean));
  const max = RIDE_PRICE_DOCSCAN.MAX_TOKEN;
  let t = 0;
  for (let tries = 0; tries < 40 && !t; tries++) {
    const cand = 1 + Math.floor(Math.random() * max);
    if (!used.has(cand)) t = cand;
  }
  /* every token taken: mint nothing rather than duplicate one, or a scan
     would confidently file a document against somebody else's deal */
  if (!t) { for (let c = 1; c <= max && !t; c++) if (!used.has(c)) t = c; }
  if (!t) return 0;
  deal.docToken = t;
  Store.save();
  return t;
}

function dealByToken(token) { return Store.s.deals.find(d => d.docToken === token) || null; }

/* the strip printed at the foot of every page the portal generates. It carries
   an identifier and nothing else — a document-type code and this device's deal
   token — so the paper never holds a field value a camera could read off it. */
function docMarkerHtml(deal, docId) {
  const m = docMeta(docId);
  if (!m) return "";
  const token = dealToken(deal);
  if (!token) return ""; /* no token to be had — the page prints unmarked and is recorded by hand */
  return `<span class="pd-mark">${RIDE_PRICE_DOCSCAN.markerSVG(m.code, token, "pd-mark__bars")}<span class="pd-mark__cap">deal jacket marker</span></span>`;
}

const jacketStamp = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

/* which glyph a jacket row wears: the document's own kind, not its state */
const JK_ROW_GLYPH = {
  "form-license": "license", "idverify-cobuyer": "customers", "idverify-primary": "customers",
  "form-insurance": "check", "form-tqi": "check", "delivery": "check"
};

/* ---------------- Deal Jacket & Compliance (owner's package v035) ----------
   Eleven screens on one route, all of them the kit's Task: the customer's name
   in the bar and NO deal number, because the jacket is reached from Discovery,
   before the F&I push (§16).

   The three-bucket architecture the v025 package settled is unchanged — what
   are we waiting on from the customer, what does the team still owe, and is
   the deal fundable — and so is every rule it enforced: the jacket keeps a
   RECORD and never a file, Mark received says plainly that nothing was scanned
   or verified, only paper this portal printed carries a marker to read, and
   funding sign-off stays locked until nothing is outstanding, with the Team
   Lead's recorded override still honoured.

   What v035 corrects:

   §19a  The count carries its denominator everywhere, and a two-sided
         document is not filed until both sides are in. The license front
         arrived in the resolver at 11:41, so its row reads "Back needed" —
         never Complete, and never a bare "Needed" that would send an advisor
         to ask for a document the store is already holding.
   §25   One item resolves one item. Capturing the back files the LICENSE and
         nothing else; the sheet that files a document says so before it does
         it. A complete jacket is a later moment with its own screen.
   §26   Responsibility is not a channel. A team form is printed, scanned back,
         uploaded signed or marked received — it is never offered the
         customer's upload path, and it never appears in the customer request,
         even though the store hands it over at delivery.                    */
route("jacket/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const cst = Store.customer(deal.customerId);
  const custName = cst ? `${cst.first} ${cst.last}` : "—";
  /* catalog first, then the deal's own snapshot while it agrees with the
     deal's stock (or the deal has none): a funded contract carried by its
     snapshot — the seed's Telluride — read "no vehicle yet" on its own jacket */
  const veh = Store.vehicle(deal.stock) || (vehicleSnapshot(deal) && vehicleSnapshot(deal).make ? vehicleSnapshot(deal) : null);
  const vehName = veh ? `${veh.year} ${veh.model}${veh.trim ? " " + veh.trim : ""}` : "no vehicle yet";
  /* the printables price against a catalog unit, and both print entries send a
     deal without one back HERE — so an action that opens one from this screen
     would be a link to the screen it is on. The same test the guards use. */
  const printable = !!Store.vehicle(deal.stock);
  /* both internal buckets start collapsed at every width — progressive
     disclosure is locked by the package, and the advisor opens Deal forms
     only to work them */
  /* custOpen null means "follow the work": open while something is waiting,
     collapsed once nothing is, until somebody says otherwise */
  const ui = { custOpen: null, formsOpen: false, doneOpen: false, sheet: null, justFiled: null };
  const sheets = chSheetOpener("jkScrim", "jkSheet", () => { ui.sheet = null; buyers = null; });
  let camDoc = null;        /* which customer document the camera is filling */
  let sendLock = false;     /* a send is in flight — the sheet may not close */
  let keyGuard = null;      /* the capture listener that enforces that lock */
  let buyers = null;        /* the shared buyers sheet, while it is open */
  /* the consequence block the kit draws for anything that changes a record */
  const consequences = (title, items) => `<div class="rp-consequences"><strong>${esc(title)}</strong>
    <ul>${items.map(x => `<li>${x}</li>`).join("")}</ul></div>`;
  /* this view re-renders whole: marking a document received from a row far
     down the page would otherwise jump the advisor back to the top, losing
     the place they were working (review lesson 6). Scroll is state here. */
  let firstPaint = true;

  /* A confirmed send may not be dismissed away. During the brief sending
     window the scrim and Escape are inert, or the advisor's own "I'm done"
     gesture after tapping Send silently discarded the request with no
     feedback (review find). Navigating away still cancels — the route change
     and the timer's own liveness check do not come through here. The kit's
     opener owns both dismissal paths, so the lock takes them off it and puts
     them back rather than reaching inside it. */
  function lockSend(on) {
    sendLock = on;
    const sc = $("#jkScrim");
    if (on) {
      if (sc) sc.onclick = null;
      keyGuard = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); } };
      document.addEventListener("keydown", keyGuard, true);
    } else {
      if (sc) sc.onclick = () => sheets.close();
      if (keyGuard) { document.removeEventListener("keydown", keyGuard, true); keyGuard = null; }
    }
  }

  /* ---- what the buckets hold, and who owes each row (§26) ---- */
  const inJacket = (d) => !!jacketState(deal, d.id);
  const isCustomerDoc = (d) => CLIENT_QUEUE_IDS.includes(d.id);
  /* Responsibility, worked out from what the document IS — never a flag:
     a customer document is one the customer supplies; an outside document is
     paper somebody hands over and the store reads; a team form is a form the
     store completes; a record is one Ride Price files itself when an event
     happens. The channel follows from this, and never the other way (§26). */
  function responsibility(d) {
    if (isCustomerDoc(d)) return "customer";
    if (d.origin === "outside") return "outside";
    return d.id.indexOf("form-") === 0 ? "form" : "record";
  }
  const RESP_TAG = { customer: "Customer", outside: "Handed over", form: "Team form", record: "Record" };
  /* the two-sided exception stays local to the LICENSE (the package's own
     rule): the paystub also has a missing-page beat ("Second paystub is
     missing"), and matching any missing page here sent that rejection to the
     license sheet with "add the back barcode side" instructions (review
     find). jacketPartial() is the shared test for a document with one side
     on file; this says which document is allowed to wear it here. */
  const licenseHalfIn = (d) => d.id === "form-license" && jacketPartial(deal, d.id);
  /* Requested is derived from the client pipeline record alone — the j.req
     stamp is write-only history, and reading it here made a document taken
     back out of the jacket say "Requested" forever (review find). The
     two-sided state outranks it: a licence whose front is in reads Back
     needed whether or not a link went out (§19a). */
  function rowState(d) {
    if (inJacket(d)) return { label: "Complete", cls: "rp-doc__state--done" };
    if (licenseHalfIn(d)) return { label: "Back needed", cls: "rp-doc__state--part" };
    const r = jacketClient(deal)[d.id];
    if (r && r.state === "rejected") return { label: "Retake needed", cls: "rp-doc__state--part" };
    if (r && r.state === "requested") return { label: "Requested", cls: "" };
    return { label: "Needed", cls: "" };
  }

  /* what the Completed row says it knows — the distinction the old screen
     drew between a machine check and a person's word is kept word for word */
  function receivedLine(d) {
    const st = jacketState(deal, d.id); if (!st) return "";
    const how = st.how === "scan" ? "Camera scan · verified"
      : st.how === "client" ? "Customer upload · accepted"
        : st.how === "sort" ? "Snap & Sort · auto-filed (demo)"
          : st.how === "esign" ? "Signed electronically · filed on signing"
            : st.how === "app" ? "Recorded by Ride Price · filed by the event itself"
              : "Marked received by " + st.by;
    return how + " · " + jacketStamp(st.at);
  }
  /* the why-line an outstanding row wears: its responsibility first, so an
     advisor can tell at a glance whose job it is without opening it (§26) */
  function whyLine(d) {
    const st = rowState(d);
    if (st.label === "Back needed" && d.id === "form-license") {
      const r = jacketClient(deal)[d.id];
      return r && r.capturedIn ? `Front captured in ${r.capturedIn} · back missing` : "Front captured · back missing";
    }
    const r = jacketClient(deal)[d.id];
    if (r && r.state === "rejected" && r.rejectedReason) return r.rejectedReason;
    if (d.kind === "conditional") return `Required by this trade · ${d.whyShort}`;
    if (d.kind === "optional") return `Optional · not counted in the required package`;
    if (isCustomerDoc(d)) return (clientMeta(d.id) || {}).plainReason || d.whyShort;
    return `${RESP_TAG[responsibility(d)]} · ${d.whyShort}`;
  }

  /* ---------------- the frame ---------------- */
  function render() {
    const keep = $(".rp-page") ? $(".rp-page").scrollTop : 0;
    const docs = jacketDocs(deal);
    const jk = jacketRead(deal);
    const led = jacketLedger(deal);
    const ov = jk.override;

    /* the buckets partition the OUTSTANDING work by who owes it, and hold
       everything already in. Optional documents live in Completed, which is
       exactly why they never reach the denominator (§19a). */
    const custWaiting = docs.filter(d => isCustomerDoc(d) && !inJacket(d));
    const formsWaiting = docs.filter(d => !isCustomerDoc(d) && !inJacket(d) && d.kind === "required");
    const condWaiting = docs.filter(d => !inJacket(d) && (d.kind === "conditional" || (d.kind === "optional" && !isCustomerDoc(d))));
    const completed = docs.filter(inJacket);
    const done = led.requiredFiled, total = led.requiredTotal;
    const rem = total - done;
    const pct = total ? Math.round(done / total * 100) : 0;
    const reqSent = !!jk.reqSentAt;
    /* what the banner may claim: only documents actually ON the open request
       and still owed by the customer. Counting all of custWaiting overstated
       a partial send, and counting only state "requested" hid the banner
       entirely when every document on the send was sitting rejected — the one
       confirmation of that send (review find). */
    const reqPending = reqSent ? custWaiting.filter(d => {
      const r = jacketClient(deal)[d.id];
      /* on THIS send, and still owed. A rejected document is still owed — the
         link shows it with its retake — but one rejected before any link went
         out was never on a send and may not be counted as though it were. */
      return !!r && r.requestedAt === jk.reqSentAt;
    }) : [];
    /* sign-off unlocks when nothing required and nothing conditional is
       outstanding; a Team Lead's recorded override is the one documented way
       past it and still counts (owner, 2026-08-16) */
    const fundable = led.ready || !!ov;
    const addable = jacketOptionalCatalog(deal);
    const buyersN = 1 + (deal.coBuyerId && Store.customer(deal.coBuyerId) ? 1 : 0);

    const note = rem === 0
      ? `<b>Jacket complete.</b> All ${total} required items are recorded.${led.optionalFiled ? ` ${led.optionalFiled} optional document${led.optionalFiled === 1 ? "" : "s"} added.` : ""}`
      : ui.justFiled
        ? `<b>${esc(ui.justFiled)} filed.</b> ${custWaiting.length} item${custWaiting.length === 1 ? "" : "s"} still need the customer; the other ${formsWaiting.length} ${formsWaiting.length === 1 ? "is a deal form" : "are deal forms"} your team completes.`
      : custWaiting.length
        ? `<b>${custWaiting.length} item${custWaiting.length === 1 ? " needs" : "s need"} the customer.</b> The other ${formsWaiting.length} ${formsWaiting.length === 1 ? "is a deal form" : "are deal forms"} your team completes.`
        : `<b>All customer documents are in.</b> The ${formsWaiting.length} remaining ${formsWaiting.length === 1 ? "is a deal form" : "are deal forms"} your team completes.`;
    /* a conditional document is named, never folded into the denominator: it
       holds sign-off for the deals it applies to and does not exist for the
       rest (§18) */
    const condNote = led.conditionalOutstanding.length
      ? ` ${esc(led.conditionalOutstanding.map(d => d.label).join(" and "))} ${led.conditionalOutstanding.length === 1 ? "is" : "are"} required by this trade and hold${led.conditionalOutstanding.length === 1 ? "s" : ""} funding sign-off without entering the count.`
      : "";

    /* the kit draws a bucket head as a div; ours has to open and close, so it
       is a button — and a button shrinks to its content here because only
       .rp-row carries width:100%. Reported as a kit gap; the board's own
       geometry is kept with the one inline width. */
    const bucket = (opts) => `<div class="rp-bucket">
      <button type="button" class="rp-bucket__head" style="width:100%" id="${opts.id}" aria-expanded="${!!opts.open}" aria-controls="${opts.id}Body">
        <span class="rp-row__body"><span class="rp-bucket__title">${esc(opts.title)}</span>
          <span class="rp-bucket__sub">${esc(opts.sub)}</span></span>
        <span class="rp-bucket__badge${opts.badgeCls ? " " + opts.badgeCls : ""}">${esc(opts.badge)}</span>
        <span style="${opts.open ? "transform:rotate(180deg)" : ""}">${rpGlyph("chevron-down")}</span></button>
      <div id="${opts.id}Body">${opts.open ? `<div class="rp-bucket__body">${opts.body}</div>` : ""}</div>
    </div>`;

    const docRow = (d) => {
      const st = inJacket(d) ? rowState(d)
        : d.kind === "conditional" ? { label: "Conditional", cls: "rp-doc__state--part" }
          : d.kind === "optional" ? { label: "Optional", cls: "" }
            : rowState(d);
      const sub = inJacket(d) ? receivedLine(d) : whyLine(d);
      return `<button type="button" class="rp-doc" data-open="${esc(d.id)}">
        <span class="rp-tile">${rpGlyph(JK_ROW_GLYPH[d.id] || "document")}</span>
        <span class="rp-row__body"><span class="rp-doc__name">${esc(d.label)}</span>
          <span class="rp-doc__why">${esc(sub)}</span></span>
        <span class="rp-doc__state${st.cls ? " " + st.cls : ""}">${esc(st.label)}</span></button>`;
    };

    /* §26 — the request path holds the three documents the CUSTOMER owes and
       nothing else. A team form handed over at delivery is still the store's
       to complete, and putting it here teaches an advisor to chase the
       store's own paperwork. */
    const custBody = custWaiting.length
      ? custWaiting.map(docRow).join("") + `<div style="padding:12px 16px 14px">
          <button type="button" class="rp-primary" id="jkRequest">${reqSent ? `Resend secure request (${custWaiting.length})` : `Request ${custWaiting.length} document${custWaiting.length === 1 ? "" : "s"}`}</button>
          ${custWaiting.length > 1 ? `<button type="button" class="rp-link" id="jkSnapAll">Capture all ${custWaiting.length} here instead</button>` : ""}
          ${reqPending.length ? `<button type="button" class="rp-link" id="jkTrack">Secure request sent · ${reqPending.length} still pending · view status</button>` : ""}
        </div>`
      : `<div class="rp-doc"><span class="rp-row__body"><span class="rp-doc__why">All customer documents are in the jacket.</span></span></div>`;

    const formsBody = (formsWaiting.length || condWaiting.length
      ? formsWaiting.concat(condWaiting).map(docRow).join("")
      : `<div class="rp-doc"><span class="rp-row__body"><span class="rp-doc__why">All required deal forms are complete.</span></span></div>`)
      + `<button type="button" class="rp-doc" id="jkAddOpt" style="justify-content:center">
          <span class="rp-doc__name" style="color:var(--rp-blue)">+ Add optional document</span></button>`;

    /* the Completed badge counts the REQUIRED package, so it and the chip say
       the same number; the optional documents are listed in the bucket and
       counted in its sub-line, which is what keeps the rows and the badge from
       disagreeing (the board reads 15 with one optional named). */
    const doneBody = completed.length
      ? completed.map(docRow).join("")
      : `<div class="rp-doc"><span class="rp-row__body"><span class="rp-doc__why">Nothing is in the jacket yet.</span></span></div>`;

    const content = `<div class="rp-crumb">${esc(custName)} <b>·</b> ${esc(vehName)} <b>·</b> Deal jacket</div>
      <div class="rp-chiprow">
        <button type="button" class="rp-chip" data-sheet-open="buyers">Buyers · ${buyersN}</button>
        ${chJacketChip(deal)}
        ${veh && veh.stock ? `<a class="rp-chip" href="#/vehicles/${esc(deal.id)}">${esc(veh.stock)}</a>` : ""}
      </div>
      <div class="rp-ready">
        <div class="rp-ready__head">
          <div><div class="rp-ready__label">Funding readiness</div>
            <div class="rp-ready__hero">${rem ? `${rem} item${rem === 1 ? "" : "s"} remaining` : "Ready for sign-off"}</div></div>
          <span class="rp-ready__count${rem ? "" : " rp-ready__count--done"}">${done} of ${total} complete</span>
        </div>
        <div class="rp-ready__bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Deal jacket ${done} of ${total} required documents complete"><i style="width:${pct}%"></i></div>
        <div class="rp-ready__note">${note}${condNote}</div>
      </div>
      ${bucket({ id: "jkCustToggle", title: "Waiting on customer", sub: `${custWaiting.length} document${custWaiting.length === 1 ? "" : "s"}`,
        badge: custWaiting.length ? `${custWaiting.length} needed` : "Complete", badgeCls: custWaiting.length ? "" : "rp-bucket__badge--done",
        open: ui.custOpen === null ? custWaiting.length > 0 : ui.custOpen, body: custBody })}
      ${bucket({ id: "jkFormsToggle", title: "Deal forms", sub: "Internal forms and signatures",
        badge: formsWaiting.length ? `${formsWaiting.length} remaining` : condWaiting.length ? "Conditional only" : "Complete",
        badgeCls: formsWaiting.length ? "" : "rp-bucket__badge--done",
        open: ui.formsOpen, body: formsBody })}
      ${bucket({ id: "jkDoneToggle", title: "Completed", sub: led.optionalFiled ? `Already in the jacket · ${led.optionalFiled} optional` : "Already in the jacket",
        badge: String(done), badgeCls: "rp-bucket__badge--count", open: ui.doneOpen, body: doneBody })}
      ${ov && !led.ready ? `<div class="rp-notice rp-notice--reserved">Sign-off unlocked by override — ${esc(ov.by)}: “${esc(ov.reason)}”</div>` : ""}
      ${printable ? `<a class="rp-link" href="#/forms/${esc(deal.id)}">Print center</a>`
        : `<p class="rp-count">Printing needs the unit in inventory — this contract's vehicle is on the record only.</p>`}`;

    const dock = `<div class="rp-signoff">
      <div><div class="rp-signoff__label">Funding sign-off</div>
        <div class="rp-signoff__state">${deal.signoff ? `Signed off by ${esc(deal.signoff.by)}` : rem ? `${rem} item${rem === 1 ? "" : "s"} remaining` : "Jacket complete"}</div></div>
      <button type="button" class="rp-signoff__btn rp-signoff__btn--${fundable || deal.signoff ? "on" : "off"}" id="jkSignoff"${fundable || deal.signoff ? "" : " disabled"}>${deal.signoff ? "View sign-off" : fundable ? "Complete sign-off →" : "Not ready"}</button>
    </div>`;

    renderChrome("Deal Jacket", dealTitle(deal), "");
    document.body.dataset.canvas = "kit";
    document.body.dataset.screen = "jacket";
    view().innerHTML = chShell({ template: "task", title: custName, closeId: "jkClose", cls: "rp-screen--gate" },
      content, dock, { scrim: "jkScrim", sheet: "jkSheet" })
      + `<input type="file" accept="image/*" capture="environment" id="jkCam" hidden>
         <input type="file" accept="image/*" id="jkFile" hidden>`;

    $("#jkClose").onclick = () => navigate("#/deals");
    chFitDock(".rp-signoff");
    chWireRole(sheets, render);
    wire(custWaiting, addable, docs);
    /* a sheet that owns its own state is re-opened after the redraw its own
       change caused, or attaching a co-buyer would close the sheet that did it */
    if (ui.sheet === "buyers") { if (buyers) buyers.open(); else buyers = buyersKitSheet(deal, sheets, () => render()); }
    /* keep the advisor where they were working. The page can be shorter after
       a document moves buckets, so clamp rather than restoring blind. */
    const page = $(".rp-page");
    if (firstPaint) firstPaint = false;
    else if (page) page.scrollTop = Math.min(keep, Math.max(0, page.scrollHeight - page.clientHeight));
  }

  /* ---------------- the sheets ---------------- */

  /* 03 — one secure request carries every customer document still missing.
     The advisor stays here: sending and resending never leave the jacket. */
  function requestSheet(waiting) {
    const reqSent = !!jacketRead(deal).reqSentAt;
    sheets.open(`${chSheetHead(reqSent ? "Resend documents" : "Request documents")}
      <p class="rp-sheet__sub">${esc(custName)}${cst && cst.phone ? " · " + esc(cst.phone) : ""}</p>
      <div class="rp-group">
        ${waiting.map(d => `<label class="rp-row" style="width:100%"><span class="rp-row__body">
          <span class="rp-row__title">${esc(d.label)}</span>
          <span class="rp-row__sub">${esc((clientMeta(d.id) || {}).plainReason || d.whyShort)}</span></span>
          <input type="checkbox" checked data-pick="${esc(d.id)}" aria-label="${esc(d.label)}"></label>`).join("")}
      </div>
      <p class="rp-count">Ride Price sends a secure link. The customer uploads directly into Ride Price — document images do not pass through the salesperson's text messages or photo library. Demo: the message is simulated and nothing leaves this device.</p>
      <button type="button" class="rp-primary" id="jkSend">${reqSent ? "Resend" : "Send"} secure request</button>`,
      (sh) => {
        $("#jkSend", sh).onclick = () => {
          const picked = $$("[data-pick]", sh).filter(c => c.checked).map(c => c.dataset.pick);
          if (!picked.length) return toast("Choose at least one document");
          sh.innerHTML = `<div class="rp-sheet__grab"></div><div class="rp-sheet__head"><h2 class="rp-sheet__title">Sending the secure link…</h2></div>`;
          lockSend(true);
          /* NAVIGATING AWAY mid-send must not let the timer write state and
             repaint over whatever screen is showing by then */
          const alive = () => document.contains(sh) && !!$("#jkScrim") && !$("#jkScrim").hidden;
          setTimeout(() => {
            if (!alive()) { lockSend(false); return; }
            jacketSendRequest(deal, picked);
            lockSend(false);
            sheets.close();
            /* no toast: the package puts this feedback in the jacket itself,
               where it stays readable */
            render();
          }, 800);
        };
      });
  }

  /* delivery status, local to the jacket — never its own route */
  function trackingSheet(waiting) {
    const jk = jacketRead(deal);
    /* one set, read twice: the numerator and the denominator must describe the
       same documents or the sheet reports two different truths (lesson 7).
       Advisor-side captures are excluded from BOTH — this sheet reports what
       the CUSTOMER did with the link, and an in-showroom scan is not the
       customer opening or uploading anything (review find). */
    const cl = jacketClient(deal);
    const asked = CLIENT_QUEUE_IDS.filter(qid => cl[qid] && (cl[qid].state === "requested" ? cl[qid].via !== "advisor" : drCustomerTouched(cl[qid])));
    const uploaded = asked.filter(qid => cl[qid].state !== "requested");
    const step = (label, value, pending) => `<div class="rp-kv__row"><span>${esc(label)}</span><span>${esc(value)}${pending ? "" : ""}</span></div>`;
    sheets.open(`${chSheetHead("Customer request")}
      <p class="rp-sheet__sub">Sent to ${esc(custName)}${cst && cst.phone ? " · " + esc(cst.phone) : ""}</p>
      <div class="rp-kv">
        ${step("Link sent", jacketStamp(jk.reqSentAt))}
        ${step("Delivered", jacketStamp(jk.reqSentAt))}
        ${step("Customer opened", uploaded.length ? "Opened" : "Waiting")}
        ${step("Documents uploaded", `${uploaded.length} of ${asked.length}`)}
      </div>
      <p class="rp-count">The customer's phone is played by this same browser — open it to run the upload side of the demo.</p>
      <button type="button" class="rp-primary" id="jkOpenPhone">Open the customer's phone</button>
      <button type="button" class="rp-link" id="jkResend">Resend link</button>`,
      (sh) => {
        $("#jkResend", sh).onclick = () => requestSheet(waiting);
        $("#jkOpenPhone", sh).onclick = () => { sheets.close(); navigate("#/clientlink/" + deal.id + "/sms"); };
      });
  }

  /* 05 — one contextual sheet per row, and the actions follow WHO owes the
     document rather than how it might arrive (§26). A team form is printed,
     scanned back, uploaded signed or marked received; it is never offered the
     customer's upload path, and the sheet says what it is. */
  function docSheet(d) {
    if (inJacket(d)) return recordSheet(d);
    const resp = responsibility(d);
    if (resp === "customer" && licenseHalfIn(d)) return licenseSheet(d);

    const row = (rid, icon, title, sub) => `<button type="button" class="rp-row" id="${rid}">
      <span class="rp-tile">${rpGlyph(icon)}</span>
      <span class="rp-row__body"><span class="rp-row__title">${esc(title)}</span>
        <span class="rp-row__sub">${esc(sub)}</span></span><span class="rp-row__chevron"></span></button>`;

    let rows = "", sub = "";
    if (resp === "customer") {
      sub = (clientMeta(d.id) || {}).plainReason || d.whyShort;
      rows = row("jkCapture", "scan", d.id === "form-license" ? "Finish license capture" : "Take photo",
        d.id === "form-license" ? "Capture front and back in one session" : "Use this device camera")
        + row("jkUpload", "upload", "Upload file", "A document already on this device")
        + row("jkMark", "check", "Mark received", "Record it as in hand without a scan");
    } else if (resp === "form") {
      sub = "Deal form · your team completes it, then hands it over at delivery";
      rows = (printable ? row("jkPrint", "document", "Print it", "Print Center · with the Ride Price marker strip") : "")
        + row("jkCapture", "scan", "Scan it back", "Reads the marker strip Ride Price printed on it")
        + row("jkUpload", "upload", "Upload a signed copy", "A file already on this device")
        + row("jkMark", "check", "Mark received", "Record it as in hand without a scan");
    } else if (resp === "record") {
      /* a record files itself when its event happens, so the sheet says which
         event and offers the way to it rather than a channel that cannot
         produce it (§23, §26) */
      sub = "Record · Ride Price files this itself when the event happens";
      rows = (d.id === "creditapp" ? row("jkGoCredit", "document", "Open the credit application", "It files here the moment the application is submitted") : "")
        + row("jkUpload", "upload", "Upload a copy", "A file already on this device")
        + row("jkMark", "check", "Mark received", "Record it as in hand without a scan");
    } else {
      sub = "Handed over by the customer · the store reads it and keeps the record";
      rows = row("jkUpload", "upload", "Upload a copy", "A file already on this device")
        + row("jkMark", "check", "Mark received", "Record it as in hand without a scan");
    }

    sheets.open(`${chSheetHead(d.label)}
      <p class="rp-sheet__sub">${esc(sub)}</p>
      <div class="rp-group">${rows}</div>`,
      (sh) => {
        const cap = $("#jkCapture", sh);
        if (cap) cap.onclick = () => {
          sheets.close();
          if (resp === "customer") openCam(d.id, true);
          else openDocScanFlow(deal, render, { expect: d.id, onHand: () => markSheet(d) });
        };
        const pr = $("#jkPrint", sh);
        if (pr) pr.onclick = () => { sheets.close(); navigate(`#/print/${deal.id}/${d.id}`); };
        const gc = $("#jkGoCredit", sh);
        if (gc) gc.onclick = () => { sheets.close(); navigate("#/credit/" + deal.id); };
        $("#jkUpload", sh).onclick = () => {
          sheets.close();
          if (resp === "customer") openCam(d.id, false);
          else uploadFlow(d);
        };
        $("#jkMark", sh).onclick = () => markSheet(d);
      });
  }

  /* 09 — a two-sided document is not filed until both sides are in. The
     front's stamp says WHERE it came from, so it cannot read as a scan off an
     old profile, and the sheet never offers to file the document whole. */
  function licenseSheet(d) {
    const r = jacketClient(deal)[d.id] || {};
    sheets.open(`${chSheetHead("Finish the driver's license")}
      <p class="rp-sheet__sub">Front received · the back is still required</p>
      <div class="rp-kv">
        <div class="rp-kv__row"><span>Front</span><span>${r.receivedAt ? esc("Captured " + jacketStamp(r.receivedAt)) : "Captured"}</span></div>
        <div class="rp-kv__row rp-kv__row--src"><span>Back</span><span>Required</span>
          <span class="rp-kv__src">the barcode side · the document is not filed until both sides are in${r.capturedIn ? ` · the front came from ${esc(r.capturedIn)}, this visit` : ""}</span></div>
      </div>
      <button type="button" class="rp-primary" id="jkBack">Capture back</button>`,
      (sh) => { $("#jkBack", sh).onclick = () => { sheets.close(); openCam(d.id, true); }; });
  }

  /* 06 — a manual receipt is exactly that: the jacket records that a person
     took the document in, never that Ride Price read or verified it. And it
     says how far the count moves before it moves it (§25). */
  function markSheet(d) {
    const led = jacketLedger(deal);
    const after = d.kind === "required" ? `${led.requiredFiled + 1} of ${led.requiredTotal}` : `${led.requiredFiled} of ${led.requiredTotal}`;
    sheets.open(`${chSheetHead("Mark received")}
      <p class="rp-sheet__sub">${esc(d.label)} · ${esc(RESP_TAG[responsibility(d)].toLowerCase())}</p>
      <div class="rp-field"><label class="rp-field__label" for="jkNote">Source or note (optional)</label>
        <textarea class="rp-textarea" id="jkNote" rows="3" maxlength="120" placeholder="e.g. signed in the showroom, filed by hand"></textarea></div>
      ${consequences("Nothing is read and nothing is verified", [
        `Recorded against this deal as taken in by ${esc(roleName())}`,
        "Ride Price did not scan the document or check its contents",
        d.kind === "required"
          ? `The count moves by one — this item only, to ${esc(after)}`
          : `Counted as an optional document — the required count stays at ${esc(after)}`
      ])}
      <button type="button" class="rp-primary" id="jkMarkGo">Mark received</button>`,
      (sh) => {
        $("#jkMarkGo", sh).onclick = () => {
          jacketReceive(deal, d.id, "hand", ($("#jkNote", sh).value || "").trim());
          sheets.close(); render();
        };
      });
  }

  /* 08 — what the jacket holds for something already in, and the way back out */
  function recordSheet(d) {
    const st = jacketState(deal, d.id); if (!st) return;
    /* a deal form opens as a printable, which needs the catalog unit — with
       none, the print route would only send the reader back to this jacket */
    const viewable = d.origin !== "outside"
      ? (printable ? `#/print/${esc(deal.id)}/${esc(d.id)}` : null)
      : (st.how === "client" || st.how === "sort") && CLIENT_QUEUE_IDS.includes(d.id)
        ? `#/docreview/${esc(deal.id)}/${esc(d.id)}` : null;
    sheets.open(`${chSheetHead(d.label)}
      <p class="rp-sheet__sub">${esc(receivedLine(d))}</p>
      <p class="rp-count">${st.how === "scan" ? "Verified — the app read the marker it printed on this page."
        : st.how === "sort" ? "Auto-filed by Snap &amp; Sort (demo — a simulated check)."
          : st.how === "client" ? "Uploaded by the customer through the secure link and accepted after review."
            : st.how === "esign" ? "Signed electronically in the app and filed by the act of signing."
              : st.how === "app" ? "Ride Price created this record itself when the event happened. Nobody handed anything over, and nothing was scanned."
                : "Taken in by hand. The jacket keeps the record, not the paper."}${st.note ? " Note: " + esc(st.note) : ""}${d.kind === "optional" ? " Counted as an optional document — it is not part of the required package." : ""}</p>
      ${viewable ? `<a class="rp-primary" href="${esc(viewable)}" style="display:grid;place-items:center">View</a>` : ""}
      <button type="button" class="rp-link" id="jkUndo">Take back out</button>
      ${d.added ? `<button type="button" class="rp-link" id="jkDrop">Remove from this deal</button>` : ""}`,
      (sh) => {
        $("#jkUndo", sh).onclick = () => { jacketRemove(deal, d.id); sheets.close(); render(); };
        const drop = $("#jkDrop", sh);
        if (drop) drop.onclick = () => { jacketDrop(deal, d.id); sheets.close(); toast("Taken off this deal"); render(); };
      });
  }

  /* 07 — adding an optional document leaves the required package where it is,
     and the sheet says so before the tap rather than after (§19a) */
  function addOptSheet(addable) {
    const led = jacketLedger(deal);
    sheets.open(`${chSheetHead("Add optional document")}
      <p class="rp-sheet__sub">${addable.length} available · counted separately from the required package</p>
      <div class="rp-field"><label class="rp-field__label" for="jkAddSel">Document</label>
        <select class="rp-field__input" id="jkAddSel">
          <option value="" selected>Choose a document (${addable.length} available)</option>
          ${addable.map(f => `<option value="${esc(f.id)}">${esc(f.label)} — ${esc(f.group)}</option>`).join("")}
        </select></div>
      <div class="rp-kv">
        <div class="rp-kv__row rp-kv__row--src"><span>Required package</span><span>${led.requiredTotal} items</span>
          <span class="rp-kv__src">unchanged — optional documents are counted separately</span></div>
        <div class="rp-kv__row"><span>After adding</span><span>${led.requiredFiled} of ${led.requiredTotal} · ${led.optionalTotal + 1} optional</span></div>
      </div>
      <button type="button" class="rp-primary" id="jkAddGo">Add document</button>`,
      (sh) => {
        $("#jkAddGo", sh).onclick = () => {
          const aid = $("#jkAddSel", sh).value;
          if (!aid) return toast("Choose a document first");
          const j = jacketOf(deal);
          if (!j.extra.includes(aid)) { j.extra.push(aid); Store.save(); }
          sheets.close(); render();
        };
      });
  }

  /* the upload path for internal paper: the photo proves the document is in
     hand and is then discarded — nothing is stored and nothing is read from
     it (owner, 2026-08-16 / invariant 4). The record is what the jacket keeps. */
  function uploadFlow(d) {
    sheets.open(`${chSheetHead("Upload a signed copy")}
      <p class="rp-sheet__sub">${esc(d.label)}</p>
      <label class="rp-row" style="width:100%"><span class="rp-tile">${rpGlyph("upload")}</span>
        <span class="rp-row__body"><span class="rp-row__title" id="jkUplLabel">Photograph the document</span>
          <span class="rp-row__sub">The photo confirms it is in hand and is then discarded</span></span>
        <input type="file" accept="image/*" id="jkUplFile" hidden></label>
      <div class="rp-field"><label class="rp-field__label" for="jkUplNote">Source or note (optional)</label>
        <input type="text" class="rp-field__input" id="jkUplNote" maxlength="120" placeholder="e.g. faxed by the credit union"></div>
      <p class="rp-count">The jacket keeps the record, not the paper. Recorded as taken in by ${esc(roleName())}.</p>
      <button type="button" class="rp-primary" id="jkUplGo" disabled>Mark received</button>
      <button type="button" class="rp-link" id="jkUplHand">Without a photo</button>`,
      (sh) => {
        const f = $("#jkUplFile", sh);
        f.onchange = () => {
          if (f.files && f.files[0]) {
            $("#jkUplLabel", sh).textContent = "Photo taken — nothing is uploaded or kept";
            $("#jkUplGo", sh).disabled = false;
          }
        };
        /* the note travels with the receipt — dropping it left no way to say
           where a photographed payoff letter came from (review find) */
        const receive = () => { jacketReceive(deal, d.id, "hand", ($("#jkUplNote", sh).value || "").trim()); sheets.close(); render(); };
        $("#jkUplGo", sh).onclick = receive;
        $("#jkUplHand", sh).onclick = receive;
      });
  }

  /* the customer documents run the same instant check the secure link runs */
  function openCam(docId, useCamera) {
    camDoc = docId;
    const inp = $(useCamera ? "#jkCam" : "#jkFile");
    if (inp) { inp.value = ""; inp.click(); }
  }

  /* ---------------- wiring ---------------- */
  function wire(custWaiting, addable, docs) {
    $$("[data-open]").forEach(b => b.onclick = () => {
      const d = docs.find(x => x.id === b.dataset.open);
      if (d) docSheet(d);
    });
    $$("[data-sheet-open]").forEach(b => b.onclick = () => { ui.sheet = b.dataset.sheetOpen; buyers = null; render(); });
    if ($("#jkRequest")) $("#jkRequest").onclick = () => requestSheet(custWaiting);
    if ($("#jkTrack")) $("#jkTrack").onclick = () => trackingSheet(custWaiting);
    if ($("#jkSnapAll")) $("#jkSnapAll").onclick = () => navigate("#/snapall/" + deal.id + "/advisor");
    if ($("#jkAddOpt")) $("#jkAddOpt").onclick = () => addOptSheet(addable);
    /* one item resolves one item, and one head opens one bucket (§25) */
    $("#jkCustToggle").onclick = () => { ui.custOpen = !(ui.custOpen === null ? custWaiting.length > 0 : ui.custOpen); render(); };
    $("#jkFormsToggle").onclick = () => { ui.formsOpen = !ui.formsOpen; render(); };
    $("#jkDoneToggle").onclick = () => { ui.doneOpen = !ui.doneOpen; render(); };
    const so = $("#jkSignoff");
    if (so && !so.disabled) so.onclick = () => navigate("#/menu/" + deal.id);

    const onPick = (inp) => () => {
      if (!inp.files || !inp.files.length || !camDoc) return;
      const docId = camDoc;
      const from = drAddShots(deal, docId, inp.files);
      const result = drAutoVerify(deal, docId);
      /* the record says WHO captured it: without this, an in-showroom scan
         made the tracking sheet claim the customer opened the link and
         uploaded — actions they never took (review find). The flag is
         whole-document, so it is set only when this capture REPLACED the set;
         appending a missing side to a front the customer sent stamps that
         side alone. */
      const rec = jacketClient(deal)[docId];
      if (rec) {
        if (from === 0) { rec.via = "advisor"; rec.sideVia = []; }
        drStampSides(deal, docId, drSidesFrom(deal, docId, from), "advisor");
      }
      Store.save();
      /* §25 — the confirmation names the ONE document it resolved, so the
         screen never implies the capture cleared anything else. It is state
         for exactly one render: the note tells the advisor what changed, and
         the next thing they do is not still about this. */
      const label = (docMeta(docId) || {}).label || "The document";
      toast(result.ok ? "✓ " + label + " filed. Nothing else moved." : "Blocked: " + result.issue);
      camDoc = null;
      ui.justFiled = result.ok ? label : null;
      render();
      ui.justFiled = null;
    };
    const cam = $("#jkCam"); if (cam) cam.onchange = onPick(cam);
    const file = $("#jkFile"); if (file) file.onchange = onPick(file);
  }

  render();
});

/* ---------------- scanning a document back into the jacket ---------------- */

function openDocScanFlow(deal, onDone, opts) {
  opts = opts || {};
  modal("Scan a deal document", `<div id="dscanBody"></div>`);
  const body = $("#dscanBody");
  const st = {};

  const backEl = $("#modalBack");
  function cleanup() {
    st.cancelled = true;
    window.removeEventListener("hashchange", abandon);
    backEl.removeEventListener("click", onDismiss);
  }
  function onDismiss(e) { if (e.target === backEl || e.target.hasAttribute("data-close")) cleanup(); }
  function abandon() { cleanup(); closeModal(); }
  backEl.addEventListener("click", onDismiss);
  window.addEventListener("hashchange", abandon);
  const finish = () => { cleanup(); closeModal(); if (onDone) onDone(); };
  const live = () => !st.cancelled && document.contains(body);

  function renderCapture() {
    body.innerHTML = `
      <div class="scan-stage">
        <p class="scan-instruct">Photograph the <b>marker strip</b> at the foot of the page.</p>
        <label class="scan-frame scan-frame--tap scan-cap">
          <span class="scan-frame__icon">📷</span><span class="scan-frame__label">Tap to photograph the document</span>
          <input type="file" accept="image/*" capture="environment" data-dcap>
        </label>
        <div class="scan-actions">
          <label class="btn btn--ghost btn--sm scan-cap">Upload a photo<input type="file" accept="image/*" data-dcap></label>
          ${opts.onHand ? `<button class="btn btn--ghost btn--sm" id="dscanHand">Mark received by hand instead</button>` : ""}
        </div>
        <p class="hint" style="margin-top:12px">Only documents this portal printed carry a marker. A title, a bank letter or an insurance card has nothing to read — mark those received by hand.</p>
      </div>`;
    $$("[data-dcap]", body).forEach(inp => inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (f) renderProcessing(f);
    });
    const hand = $("#dscanHand", body);
    if (hand) hand.onclick = () => { cleanup(); closeModal(); opts.onHand(); };
  }

  function renderProcessing(file) {
    body.innerHTML = `<div class="scan-stage"><div class="scan-spin"></div><p class="scan-instruct">Reading the marker…</p></div>`;
    const t0 = Date.now();
    RIDE_PRICE_DOCSCAN.readMarkerFile(file).then((res) => {
      const wait = Math.max(0, 700 - (Date.now() - t0));
      setTimeout(() => { if (live()) renderResult(res); }, wait);
    });
  }

  function fail(title, msg, extra) {
    body.innerHTML = `
      <div class="scan-banner scan-banner--warn"><b>${title}</b><br>${msg}</div>
      <div class="scan-actions">
        <button class="btn btn--ghost btn--sm" id="dscanRetry">Try another photo</button>
        ${extra || ""}
        <button class="btn btn--primary btn--sm" data-close id="dscanClose">Close</button>
      </div>`;
    $("#dscanRetry").onclick = renderCapture;
    $("#dscanClose").onclick = finish;
  }

  function renderResult(res) {
    if (!res || !res.found) {
      return fail("No Ride Price marker found",
        "Nothing on that photo carries a marker this portal printed. If the document came from outside the dealership — a title, a lien release, an insurance card — the app cannot read it. Close this and mark it received by hand.");
    }
    const docId = docIdByCode(res.code);
    const meta = docId ? docMeta(docId) : null;
    if (!meta) {
      return fail("Marker not recognised",
        "That marker is not a document this version of the portal knows about.");
    }
    const owner = dealByToken(res.token);
    /* the honest cross-device failure: we can always say WHAT the paper is,
       and we refuse to guess which deal it belongs to (decision 19) */
    if (!owner) {
      return fail("This is a " + esc(meta.label) + " — but not from this device",
        "The marker says which document this is, but the deal it was printed for is not on this device. Open the deal on the device that printed it, or mark the document received by hand here.");
    }
    if (owner.id !== deal.id) {
      const oc = Store.customer(owner.customerId);
      return fail("This is a " + esc(meta.label) + " — for a different deal",
        "The marker points at <b>" + esc(oc ? oc.first + " " + oc.last : "another deal") + "</b>, not the deal you have open.",
        `<a class="btn btn--ghost btn--sm" href="#/jacket/${esc(owner.id)}">Open that jacket</a>`);
    }
    const already = jacketState(deal, docId);
    /* a scan opened from a specific row that finds a different document says
       so before the confirm — the scan is still valid, but nobody should
       file it thinking it was the row they tapped */
    const expected = opts.expect && opts.expect !== docId ? docMeta(opts.expect) : null;
    body.innerHTML = `
      <div class="scan-banner scan-banner--found"><b>${esc(meta.label)}</b><br>
        Verified — the portal read the marker it printed on this page.${already ? " It is already in the jacket; confirming updates the record." : ""}</div>
      ${expected ? `<div class="scan-banner scan-banner--warn">You scanned from the <b>${esc(expected.label)}</b> row — this page is a <b>${esc(meta.label)}</b>. Confirming files it as a ${esc(meta.label)}.</div>` : ""}
      <label class="f"><span class="lab">Note (optional)</span><input type="text" id="dscanNote" maxlength="80" placeholder="e.g. both signatures collected"></label>
      <div class="scan-actions">
        <button class="btn btn--ghost btn--sm" id="dscanRetry2">Scan another</button>
        <button class="btn btn--grad btn--sm" id="dscanSave">Put it in the jacket</button>
      </div>`;
    $("#dscanRetry2").onclick = renderCapture;
    $("#dscanSave").onclick = () => {
      jacketReceive(deal, docId, "scan", ($("#dscanNote").value || "").trim());
      toast(meta.label + " — verified and filed");
      finish();
    };
  }

  renderCapture();
}
/* ============================================================
   VIEW: document request flow — composer, simulated client link,
   advisor review (owner's v2 prototype, 2026-08-16). The "SMS" and
   the client's phone are played by this same browser: the demo is
   one device, the send is theater like the credit pull, and the
   photos a client "sends" live only in this session's memory.
   ============================================================ */

function drVehicleShort(v) { return v ? `${v.year} ${v.model}` : "new vehicle"; }
function drLogoMark() {
  return RIDE_PRICE_DATA.dealership.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

/* The prototype's DEBUG strip is gone (Document Review V2, 2026-09-02). The
   document viewer was its last render site — docreq had already retired and
   snapall stopped drawing it — and the package forbids developer counters on
   a screen an advisor reads. drWireDebug stays: the "Demo · advisor view"
   button on the customer-side screens is still a [data-dbg] control. */
function drWireDebug(deal) {
  $$("[data-dbg]").forEach(b => b.onclick = () => navigate(b.dataset.dbg === "advisor" ? "#/jacket/" + deal.id : "#/clientlink/" + deal.id));
}

/* The composer and the resend page are gone: the owner's V2 package folds
   requesting documents into a bottom sheet on the jacket itself, so the
   advisor never leaves it. Both hashes stay routable and land on the jacket,
   because a saved link or a bookmark from the old flow must not dead-end —
   via redirect(), which replaces the dead history entry (see its comment).
   The id rides through as the router delivered it: router() decodes each
   segment with decodeURIComponent, and every hash the app builds writes ids
   the same bare way, so re-encoding here would be the odd one out. */
route("docreq/:id", ({ id }) => redirect("#/jacket/" + id));
route("docreq/:id/:mode", ({ id }) => redirect("#/jacket/" + id));

/* ---------------- the simulated client phone ---------------- */

route("clientlink/:id", ({ id }) => drClientLink(id, "landing"));
route("clientlink/:id/:start", ({ id, start }) => drClientLink(id, start));

function drClientLink(id, startScreen) {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const ds = RIDE_PRICE_DATA.dealership;
  const cst = Store.customer(deal.customerId);
  const v = Store.vehicle(deal.stock);
  const st = { screen: startScreen === "sms" ? "sms" : "landing", docId: null, badPhoto: false, zoom: 1, page: 0, source: "camera" };
  /* the sheet's Escape handler, held in the view's scope so every render can
     detach the previous one — see wire(). Leaving the route entirely does NOT
     re-run wire(), so the teardown below is what stops a listener outliving
     the whole view: its closeSheet() calls render(), which would paint this
     view over whichever route the user has since moved to (CodeRabbit, #50).
     Same shape as the scan journey's and Snap All's own hashchange cleanup. */
  let sheetKey = null;
  function drClientCleanup() {
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
    window.removeEventListener("hashchange", drClientCleanup);
  }
  window.addEventListener("hashchange", drClientCleanup);

  renderChrome("Client link", dealTitle(deal), "");
  document.body.dataset.screen = "clientlink";

  const cl = () => jacketClient(deal);
  const rec = (docId) => cl()[docId] || null;
  const stateOf = (docId) => jacketState(deal, docId) ? "accepted" : (rec(docId) ? rec(docId).state : "needed");
  const queueIds = () => CLIENT_QUEUE_IDS.filter(q => jacketDocs(deal).some(d => d.id === q));
  const doneCount = () => queueIds().filter(q => stateOf(q) === "accepted").length;

  function trustHeader(sub) {
    return `<div class="dr-trust">
      <div class="dr-dealerline"><span class="dr-logomark">${esc(drLogoMark())}</span>
        <span class="dr-dealercopy"><b>${esc(ds.name)}</b><span>${esc(Store.s.advisor)} · Sales Advisor · ${esc(ds.phone)}</span></span></div>
      ${sub}
    </div>`;
  }

  /* each row carries its own camera trigger (owner's prototype): Add Photo
     opens the native capture, the simulated check answers on the spot.
     Legacy "received" records (pre-2026-08-18 saves) still render sanely. */
  function clientRowHtml(docId) {
    const d = docMeta(docId); const m = clientMeta(docId);
    const s = stateOf(docId); const r = rec(docId);
    const blocked = s === "rejected";
    const status = s === "accepted" ? "Verified" : s === "received" ? "Sent — being reviewed" : blocked ? "Needs a new photo" : "";
    const cls = s === "accepted" ? "accepted" : s === "received" ? "received" : "rejected";
    /* the right-hand control is one word, or a status pill once the document
       has a state of its own (owner prototype, 2026-08-26) */
    const action = s === "accepted"
      ? `<span class="dr-pill dr-pill--ok">Verified</span>`
      /* a blocked row keeps its ONE-TAP retake: the prototype makes the row
         itself the control, which costs the customer an extra tap on the very
         screen where they are already stuck. The crimson status line under the
         title carries the "fix needed" meaning instead of a pill. */
      : `<button type="button" class="dr-clientadd" data-trigger-upload="${esc(docId)}" aria-controls="drUpl-${esc(docId)}">${blocked ? "Retake Photo" : s === "received" ? "Replace" : "Add"}</button><input id="drUpl-${esc(docId)}" class="dr-hiddeninput" type="file" accept="image/*" capture="environment" data-upload-input="${esc(docId)}">`;
    /* the row body opens the document's own screen — what we need, a good
       example, the other capture methods and the multi-page review. The row's
       own subtitle says what the document IS; its state says where it stands. */
    return `<div class="dr-clientrow">
      <span class="dr-rowicon" aria-hidden="true">${DR_ROW_ICON[docId] || DR_ROW_ICON.default}</span>
      <button type="button" class="dr-itemcopy dr-itemopen" ${s === "accepted" ? "disabled" : `data-detail="${esc(docId)}"`}>
        <b>${esc(d.label)}</b>
        <span class="dr-rowsub">${esc(m.sub || "")}</span>
        ${status ? `<span class="dr-status dr-status--${cls}">${esc(status)}</span>` : ""}${blocked ? `<span class="dr-blockhint">${esc(r.rejectedReason || "")}</span>` : ""}
      </button>
      ${action}
    </div>`;
  }

  function render() {
    const host = view();
    if (st.screen === "sms") host.innerHTML = smsScreen();
    else if (st.screen === "receipt") host.innerHTML = receiptScreen();
    else if (st.screen === "review") host.innerHTML = reviewScreen();
    else host.innerHTML = landingScreen();
    /* the document's own detail is a sheet ON the list — the list is drawn
       first and stays behind it (owner, 2026-08-27) */
    if (st.screen === "detail") host.insertAdjacentHTML("beforeend", detailSheet());
    /* the advisor DEBUG strip does not belong on a page a customer opens from
       a text message (open audit finding; owner prototype, 2026-08-26). The
       trainer keeps one clearly-marked way back to the advisor view. */
    host.insertAdjacentHTML("beforeend", `<button type="button" class="dr-demoexit" data-dbg="advisor">Demo · advisor view</button>`);
    wire();
    drWireDebug(deal);
    drPinchZoom($(".dr-stage"), st, render);
  }

  /* the document's own screen: what we need, a good example, the capture
     methods, and the demo switch that exercises the unreadable refusal */
  /* "What we need" is a sheet over the list, not a page that replaces it
     (owner, 2026-08-27) — the customer keeps their place. The long
     requirement paragraph is gone: the `checks` are the very things the
     reader looks for, so listing them is shorter AND truer than prose. */
  function detailSheet() {
    const d = docMeta(st.docId); const m = clientMeta(st.docId);
    const r = rec(st.docId);
    const note = m.multiNote || "";
    const noteHead = note.split(".")[0];
    const act = (kind, ico, label, sub, primary) => `<button type="button" class="dr-sheetact${primary ? " dr-sheetact--primary" : ""}" data-capture="${kind}">
      <span class="dr-sheetact__ico" aria-hidden="true">${ico}</span>
      <span><b>${esc(label)}</b><span>${esc(sub)}</span></span>
      <span class="dr-sheetact__go" aria-hidden="true">›</span></button>`;
    return `<div class="dr-sheetback" id="drSheetBack">
      <div class="dr-sheet" role="dialog" aria-modal="true" aria-label="${esc(d.label)}">
        <span class="dr-sheet__handle" aria-hidden="true"></span>
        <div class="dr-sheet__head">
          <div><span class="dr-sheet__eyebrow">What we need</span>
            <h2>${esc(d.label)}</h2>
            <span class="dr-sheet__sub">${esc(m.sub || "")}</span></div>
          <button type="button" class="dr-sheet__x" data-back-landing aria-label="Close">×</button>
        </div>
        ${r && r.state === "rejected" ? `<p class="dr-sheetnote dr-sheetnote--warn"><b>${esc(r.rejectedReason || "")}</b></p>` : ""}
        ${note ? `<p class="dr-sheetnote"><b>${esc(noteHead)}.</b>${m.altIncome ? ` <button type="button" class="dr-linkbtn" data-other-income>Other income type</button>` : ""}</p>` : ""}
        <div class="dr-sheetacts">
          ${act("camera", rpIcon("camera"), "Take a photo", "Use your phone camera", true)}
          ${act("library", rpIcon("images"), "Choose from library", "Select an existing photo")}
          ${act("pdf", rpIcon("file"), "Choose a PDF", "If you have a file instead")}
        </div>
        <p class="dr-sheetnote"><button type="button" class="dr-linkbtn" data-example>See a good example</button></p>
        <label class="opt-row dr-badtoggle"><input type="checkbox" id="drBad" ${st.badPhoto ? "checked" : ""}><span class="opt-row__label">Demo only: simulate an unreadable photo.</span></label>
        <input type="file" accept="image/*" capture="environment" id="drCapCam" hidden>
        <input type="file" accept="image/*" multiple id="drCapLib" hidden>
        <input type="file" accept="application/pdf" id="drCapPdf" hidden>
      </div>
    </div>`;
  }

  /* the multi-page review, before anything is committed */
  function reviewScreen() {
    const urls = clientPhotos(deal.id, st.docId);
    const pages = Math.max(1, urls.length);
    st.page = Math.min(st.page, pages - 1);
    const u = urls[st.page];
    return `<div class="dr-client">
      <div class="dr-detailhead"><button class="dr-back" data-back-detail aria-label="Back">‹</button><b>Review capture</b></div>
      <div class="dr-clientbody">
        <div class="dr-stage">${u
          ? `<img class="dr-photo" src="${esc(u)}" alt="Captured page ${st.page + 1}" style="transform:scale(${st.zoom})">`
          : `<div class="dr-photoart" style="transform:scale(${st.zoom})"></div>`}
          <div class="dr-zoom"><button type="button" data-zoom="-" aria-label="Zoom out">−</button><button type="button" data-zoom="+" aria-label="Zoom in">＋</button></div></div>
        ${u ? "" : `<p class="hint" style="text-align:center">A PDF cannot be drawn without a reader library, so this page shows a placeholder — the record still counts it.</p>`}
        <div class="dr-pagetools"><button type="button" data-page="-" ${st.page === 0 ? "disabled" : ""} aria-label="Previous page">←</button><b>${st.page + 1} of ${pages}</b><button type="button" data-page="+" ${st.page >= pages - 1 ? "disabled" : ""} aria-label="Next page">→</button></div>
        <div class="dr-reviewactions"><button type="button" data-retake>↻ Retake</button><button type="button" data-add-page>＋ Add page</button></div>
        <div class="dr-reviewactions"><button type="button" data-move="-" ${st.page === 0 ? "disabled" : ""}>Move earlier</button><button type="button" data-move="+" ${st.page >= pages - 1 ? "disabled" : ""}>Move later</button></div>
        <button type="button" class="dr-savelater" data-del-page ${urls.length <= 1 ? "disabled" : ""}>Delete this page</button>
        <p class="hint" style="text-align:center">Reorder or delete pages before you send them. The photos stay on this device and are never uploaded or kept.</p>
        <button type="button" class="dr-clientcta" data-use>${pages > 1 ? `Done (${pages})` : "Use this"}</button>
        <input type="file" accept="image/*" capture="environment" id="drCapMore" hidden>
      </div>
    </div>`;
  }

  /* the coaching screen the demo toggle reaches */

  function smsScreen() {
    const first = (Store.s.advisor || "").split(" ")[0];
    const n = clientQueue(deal).length || queueIds().length;
    return `<div class="dr-client dr-sms">
      <div class="dr-smstop"><span class="dr-smsback">‹</span><span class="dr-logomark">${esc(drLogoMark())}</span>
        <span class="dr-dealercopy"><b>${esc(ds.name)} · ${esc(first)}</b><span>${esc(ds.phone)}</span></span></div>
      <div class="dr-msgwrap">
        <div class="dr-bubble">${esc(ds.name)} — ${esc(first)} here.<br><br>To finish paperwork on your ${esc(drVehicleShort(v))}, please upload your ${n} required item${n === 1 ? "" : "s"} here:<br><br><a href="#" data-open-client>rideprice.com/u/${esc(deal.dealNo || "")}</a></div>
      </div>
      <div class="dr-smsfooter"><span>＋</span><span class="dr-msginput">Text Message</span><span class="dr-smssend">↑</span></div>
    </div>`;
  }

  function landingScreen() {
    const sent = doneCount();
    const all = queueIds().length;
    const pct = all ? Math.round((sent / all) * 100) : 0;
    /* one dominant action: submit once everything is ready, otherwise the
       quiet way out. Snap All stays as the batch path for a customer holding
       all three documents at once. */
    const bottom = sent === all && all
      ? `<button class="dr-clientcta dr-clientcta--green" data-receipt>Submit documents ✓</button>`
      : `${clientQueue(deal).length ? `<button class="dr-clientcta" data-snapall>Add documents</button>` : ""}
         ${sent ? `<button class="dr-clientcta dr-clientcta--secondary" data-receipt>Submit what's ready (${sent}/${all})</button>` : ""}
         <button class="dr-clientcta dr-clientcta--text" data-save-later>Save &amp; finish later</button>`;
    return `<div class="dr-client">
      ${trustHeader(`<div class="dr-trustmeta"><b>${esc(drVehicleShort(v))}</b> · Deal #${esc(deal.dealNo || "")}</div>`)}
      <div class="dr-clientbody">
        <p class="dr-eyebrow">Secure document upload</p>
        <h1>Upload your documents</h1>
        <div class="dr-progress">
          <div class="dr-progress__row"><span>${sent} of ${all} ready</span><span>${pct}%</span></div>
          <div class="dr-progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="${all}" aria-valuenow="${sent}" aria-label="${sent} of ${all} documents ready">
            <span class="dr-progress__fill" style="width:${pct}%"></span></div>
        </div>
        <p class="dr-seclab">Requested documents</p>
        ${queueIds().map(clientRowHtml).join("")}
        <p class="dr-demonote">Training demo — this page sends nothing and stores nothing off this device.</p>
      </div>
      <div class="dr-clientbottom">${bottom}</div>
    </div>`;
  }

  function receiptScreen() {
    const okIds = queueIds().filter(q => stateOf(q) === "accepted");
    const missing = queueIds().filter(q => stateOf(q) !== "accepted");
    return `<div class="dr-client">
      ${trustHeader(`<div class="dr-trustmeta"><b>Thanks${cst ? ", " + esc(cst.first) : ""}.</b> Verified documents move into the Deal Jacket immediately.</div>`)}
      <div class="dr-clientbody">
        <h1>Your documents</h1>
        ${okIds.length ? okIds.map(q => {
          const d = docMeta(q); const jst = jacketState(deal, q);
          const urls = clientPhotos(deal.id, q);
          return `<div class="dr-clientrow">
            ${urls[0] ? `<img class="dr-rthumb" src="${esc(urls[0])}" alt="">` : `<span class="dr-rthumb"></span>`}
            <span class="dr-itemcopy"><b>${esc(d.label)}</b><span class="dr-status dr-status--accepted">Verified · ${esc(drStamp(jst && jst.at) || "just now")}</span></span>
            <span class="dr-chip dr-chip--accepted">In the Jacket</span></div>`;
        }).join("") : `<div class="dr-needbox"><b>No documents have been verified yet.</b></div>`}
        ${missing.length
          ? `<div class="dr-needbox"><b>${missing.length} still needed</b><span>${missing.map(q => esc(docMeta(q).label)).join(" · ")}</span></div>`
          : `<div class="dr-success"><b>All ${okIds.length} requested items are verified.</b><p>They are already in the Deal Jacket.</p></div>`}
        <button class="dr-savelater" data-back-landing>${missing.length ? "Back to upload" : "Back to status"}</button>
      </div>
    </div>`;
  }

  /* commit whatever the review holds, through the one verification engine */
  /* provenance travels WITH the draft pages. st.draftVia is parallel to the
     photo set: one entry per page, "customer" for a page this device took,
     the record's own value for a page kept from before. Every operation that
     reorders the set — retake, add, delete, move — reorders this too, and
     commit writes it in final order. An index set could not survive a move
     (review find: moving a customer's back ahead of the advisor's front
     stamped the advisor's page as the customer's). */
  const draftSeed = () => {
    const r = jacketClient(deal)[st.docId] || {};
    return drSideVia(r, clientPhotos(deal.id, st.docId).length);
  };
  const draftAfterAdd = (from) => {
    const n = clientPhotos(deal.id, st.docId).length;
    const kept = (st.draftVia || draftSeed()).slice(0, from);
    st.draftVia = kept.concat(Array.from({ length: n - from }, () => "customer"));
  };
  function useCapture() {
    const result = drAutoVerify(deal, st.docId);
    const r = jacketClient(deal)[st.docId];
    if (r) { r.sideVia = (st.draftVia || draftSeed()).slice(); Store.save(); }
    st.draftVia = null;
    toast(result.ok ? "✓ Verified instantly and added to the Deal Jacket." : "Upload blocked: " + result.issue);
    st.screen = "landing"; st.zoom = 1; st.page = 0; render();
  }

  function wire() {
    $$("[data-open-client]").forEach(a => a.onclick = (e) => { e.preventDefault(); st.screen = "landing"; render(); });
    $$("[data-back-landing]").forEach(b => b.onclick = () => { st.screen = "landing"; st.zoom = 1; render(); });
    /* a sheet dismisses the way sheets do: tap the dimmed list behind it, or
       press Escape. wire() runs on EVERY render, so detaching first is what
       guarantees exactly zero or one listener no matter which path closed the
       sheet — the X uses the generic data-back-landing handler, which does not
       know about this one, and a leaked listener would later yank the customer
       back to the list from a different screen (CodeRabbit, PR #50). */
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
    const sheetBack = $("#drSheetBack");
    if (sheetBack) {
      const closeSheet = () => { st.screen = "landing"; st.zoom = 1; render(); };
      sheetKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); closeSheet(); } };
      document.addEventListener("keydown", sheetKey, true);
      sheetBack.addEventListener("click", (e) => { if (e.target === sheetBack) closeSheet(); });
    }
    $$("[data-back-detail]").forEach(b => b.onclick = () => { st.screen = "detail"; st.zoom = 1; render(); });
    $$("[data-save-later]").forEach(b => b.onclick = () => toast("Saved. Reopen this same link to continue where you left off."));
    $$("[data-receipt]").forEach(b => b.onclick = () => { st.screen = "receipt"; render(); });
    $$("[data-snapall]").forEach(b => b.onclick = () => navigate("#/snapall/" + deal.id + "/client"));
    $$("[data-detail]").forEach(b => b.onclick = () => {
      st.docId = b.dataset.detail; st.badPhoto = false; st.zoom = 1; st.page = 0; st.screen = "detail"; render();
    });
    $$("[data-example]").forEach(b => b.onclick = () => toast("A good photo: all four corners visible, current dates, readable text."));
    $$("[data-other-income]").forEach(b => b.onclick = () => toast("Other income type noted — your advisor can request the right alternative."));
    const bad = $("#drBad");
    if (bad) bad.onchange = () => { st.badPhoto = bad.checked; };
    /* the fast path: the row's own button, straight to the verdict */
    $$("[data-trigger-upload]").forEach(b => b.onclick = (e) => {
      e.preventDefault();
      const inp = $("#drUpl-" + b.dataset.triggerUpload);
      if (inp) { inp.value = ""; inp.click(); }
    });
    $$("[data-upload-input]").forEach(inp => inp.onchange = () => {
      if (!inp.files || !inp.files.length) return;
      const docId = inp.dataset.uploadInput;
      const from = drAddShots(deal, docId, inp.files);
      const result = drAutoVerify(deal, docId);
      drStampSides(deal, docId, drSidesFrom(deal, docId, from), "customer");
      toast(result.ok ? "✓ Verified instantly and added to the Deal Jacket." : "Upload blocked: " + result.issue);
      render();
    });
    /* the considered path: a capture method, then the review */
    const capIds = { camera: "#drCapCam", library: "#drCapLib", pdf: "#drCapPdf" };
    $$("[data-capture]").forEach(b => b.onclick = () => {
      st.source = b.dataset.capture;
      /* an unreadable photo gets the plain refusal, not a photography lesson
         (owner, 2026-08-26): "when a scanner works very well, it should tell
         someone that it's too blurry to be uploaded". It goes through the same
         rejection the flow already uses for every other refusal, so the row
         says why and offers its one-tap retake. */
      if (st.badPhoto) {
        st.badPhoto = false;
        drRejectUnreadable(deal, st.docId);
        toast("Upload blocked: " + DR_UNREADABLE);
        st.screen = "landing"; render(); return;
      }
      const inp = $(capIds[st.source]);
      if (inp) { inp.value = ""; inp.click(); }
    });
    ["#drCapCam", "#drCapLib", "#drCapPdf"].forEach(sel => {
      const inp = $(sel);
      if (inp) inp.onchange = () => {
        if (!inp.files || !inp.files.length) return;
        /* a fresh capture replaces the working set, except while the block
           is a missing page — then it adds to it (same rule as the fast path) */
        const from = drAddShots(deal, st.docId, inp.files);
        draftAfterAdd(from);
        st.page = Math.max(0, clientPhotos(deal.id, st.docId).length - 1);
        st.zoom = 1; st.screen = "review"; render();
      };
    });
    const more = $("#drCapMore");
    if (more) more.onchange = () => {
      if (!more.files || !more.files.length) return;
      const urls = clientPhotos(deal.id, st.docId).slice();
      const add = Array.from(more.files).map(drPreviewUrl);
      const via = st.draftVia || draftSeed();
      if (more.dataset.replace === "1") {
        try { URL.revokeObjectURL(urls[st.page]); } catch (e) {}
        urls.splice(st.page, 1, ...add);
        via.splice(st.page, 1, ...add.map(() => "customer"));
      } else { urls.push(...add); via.push(...add.map(() => "customer")); st.page = urls.length - 1; }
      st.draftVia = via;
      more.dataset.replace = "";
      clientPhotosSet(deal.id, st.docId, urls);
      render();
    };
    $$("[data-retake]").forEach(b => b.onclick = () => { if (more) { more.dataset.replace = "1"; more.value = ""; more.click(); } });
    $$("[data-add-page]").forEach(b => b.onclick = () => { if (more) { more.dataset.replace = ""; more.value = ""; more.click(); } });
    $$("[data-del-page]").forEach(b => b.onclick = () => {
      const via = st.draftVia || draftSeed(); via.splice(st.page, 1); st.draftVia = via;
      clientPhotoDrop(deal.id, st.docId, st.page);
      st.page = Math.max(0, st.page - 1); render();
    });
    $$("[data-move]").forEach(b => b.onclick = () => {
      const urls = clientPhotos(deal.id, st.docId).slice();
      const to = b.dataset.move === "+" ? st.page + 1 : st.page - 1;
      if (to < 0 || to >= urls.length) return;
      [urls[st.page], urls[to]] = [urls[to], urls[st.page]];
      const via = st.draftVia || draftSeed(); [via[st.page], via[to]] = [via[to], via[st.page]]; st.draftVia = via;
      clientPhotosSet(deal.id, st.docId, urls);
      st.page = to; render();
    });
    $$("[data-zoom]").forEach(b => b.onclick = () => {
      st.zoom = b.dataset.zoom === "+" ? Math.min(1.9, st.zoom + .15) : Math.max(.75, st.zoom - .15); render();
    });
    $$("[data-page]").forEach(b => b.onclick = () => {
      const pages = Math.max(1, clientPhotos(deal.id, st.docId).length);
      st.page = b.dataset.page === "+" ? Math.min(pages - 1, st.page + 1) : Math.max(0, st.page - 1);
      st.zoom = 1; render();
    });
    $$("[data-use]").forEach(b => b.onclick = useCapture);
  }

  render();
}

/* ---------------- the document view: the photos, and how it got here ----------------
   The owner's prototype made this read-only (2026-08-18): verification is
   instant and simulated, so there is no second Accept — the screen shows the
   pages, the record, and says plainly that the check was scripted. */

/* ============================================================
   VIEW: Document Review V2 — owner's replication package, 2026-09-02.

   Its core rule is one sentence: DOCUMENT REVIEW IS A VIEWER, NOT ANOTHER
   DEAL JACKET SCREEN. The document takes the viewport; the deal context is
   quiet; a compliance exception appears only when it affects the document
   actually on screen.

   What the package removes from this screen, and why each was there:
   - the Advisor / Team Lead switch and the Buyer / Jacket pills (the old app
     chrome — this is a viewer, not a dashboard),
   - the DEBUG strip (staff furniture; it stays on the other document-flow
     screens, where a deal is being worked rather than read),
   - the second "Back to Deal Jacket" (the header's back arrow and the dock
     button are one path each, not two labelled duplicates),
   - the permanent +/- zoom buttons (double-tap and pinch zoom instead; the
     overflow carries an explicit Zoom for anyone who cannot gesture),
   - and the blocking toast when a side is missing. A missing side is a
     STATE OF THIS DOCUMENT, so it is shown inline on the status card and
     acted on from one dock button.

   Front and back are not a new data model: `clientMeta(docId).minPages` has
   said 2 for the licence since the client-capture round, and the pages are
   the captured photos. Front-only is therefore `pages < minPages`, which is
   exactly the package's "front received, back needed" — and it is never
   called verified.
   ============================================================ */
route("docreview/:id/:docId", ({ id, docId }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const d = docMeta(docId); const m = clientMeta(docId);
  if (!d || !m) return navigate("#/jacket/" + id);
  const c = Store.customer(deal.customerId);

  /* the viewer's own state: which side is shown, and whether it is zoomed */
  const st = { side: 0, zoom: 1 };
  let sheetKey = null;

  const rec = () => jacketClient(deal)[docId] || null;
  const urls = () => clientPhotos(deal.id, docId);
  /* how many pages have actually ARRIVED. A bare { state: "requested" }
     record — which is precisely what jacketSendRequest writes — means the
     customer has been asked and has sent nothing, so it counts as zero. An
     earlier "|| 1" floor here made the side control say "Front · Received"
     for a document nobody had uploaded (review find). */
  const captured = () => {
    const r = rec();
    if (!r || r.state === "requested") return 0;
    return (r.pages || r.draftPages) || urls().length || 0;
  };
  /* how many side controls to draw: what arrived, or what the document needs */
  const pageCount = () => Math.max(1, captured(), m.minPages || 1);
  /* a licence is the one document whose pages are SIDES; everything else
     numbers them. Read from the catalog, never from the id. */
  const sideNames = () => (m.minPages === 2 && /front and back/i.test(m.sub || ""))
    ? ["Front", "Back"]
    : Array.from({ length: Math.max(pageCount(), m.minPages || 1) }, (_, i) => `Page ${i + 1}`);
  /* the exception this screen is allowed to show: a side this document still
     needs. Not a general compliance state — only what is missing HERE. A
     document that was merely requested has no exception to show yet. */
  const missingIdx = () => {
    const r = rec(); if (!r || r.state === "requested") return -1;
    const need = m.minPages || 1;
    return captured() < need ? captured() : -1;
  };

  const closeSheet = () => {
    const sc = $("#drvScrim"); if (sc) sc.classList.remove("show");
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
  };
  const teardown = () => { closeSheet(); window.removeEventListener("hashchange", teardown); };
  window.addEventListener("hashchange", teardown);
  const openSheet = (html, onMount) => {
    const sh = $("#drvSheet"); if (!sh) return;
    sh.innerHTML = `<div class="m-handle"></div>${html}`;
    $("#drvScrim").classList.add("show");
    if (sheetKey) document.removeEventListener("keydown", sheetKey, true);
    sheetKey = (e) => { if (e.key === "Escape") { e.preventDefault(); closeSheet(); } };
    document.addEventListener("keydown", sheetKey, true);
    $$("[data-sheet-close]", sh).forEach(b => b.onclick = closeSheet);
    if (onMount) onMount(sh);
  };

  /* one status, derived once and read by both the card and the dock — the
     label and the action must never describe different states (lesson 7) */
  function status() {
    const r = rec(), done = jacketState(deal, docId), miss = missingIdx();
    if (done) {
      /* V3: the disclosure is one short sentence. What checked it is the
         Verification row under the card, not this title. */
      return done.how === "sort"
        ? { kind: "good", title: "System verified (simulated)", body: "Demo result only. No image data was read." }
        : { kind: "good", title: `Accepted${done.how === "client" ? " by " + done.by : ""}`, body: `In the jacket since ${jacketStamp(done.at)}.${done.note ? " Note: " + done.note : ""}` };
    }
    /* ORDER MATTERS. drAutoVerify records a document short of a side as
       state "rejected" with rejectedReason set to the document's own
       missingPage title, so a generic rejected-branch first would shadow the
       specific one and the advisor would never be told WHICH side, or that
       adding it is the fix (review find). A rejection for any other reason —
       an unreadable photo, say — still gets the generic language. */
    if (r && r.state === "rejected" && miss < 0) {
      return { kind: "warn", title: r.rejectedReason || "Needs a new photo", body: "The client link and the jacket queue both offer the retake." };
    }
    if (miss >= 0) {
      const names = sideNames();
      /* V3 copy rule: name exactly what is missing — no timestamp, no coaching */
      const first = r && r.receivedAt ? `${names[0]} received. ` : "";
      return { kind: "warn", title: `${names[miss]} of ${d.label.toLowerCase()} needed`, body: `${first}Add the ${names[miss].toLowerCase()} to complete this document.` };
    }
    if (!r || r.state === "requested") {
      return { kind: "warn", title: "Nothing on file yet", body: "The customer has not sent this document." };
    }
    return { kind: "good", title: `${d.label} capture complete`, body: `${captured() > 1 ? "Both sides are" : "It is"} stored in the Deal Jacket.` };
  }

  /* V3 — SOURCE is where the sides came from; VERIFICATION is what checked
     them. They were one line before, and every automatic acceptance was
     filed as "Snap & Sort", so a customer's own upload changed its story the
     moment it was accepted (RP-UI-030, closed by this package). The record
     keeps one flag per side: sideVia[i] is "advisor" when that side was
     captured on this device, "customer" otherwise; a whole-document
     via:"advisor" (the jacket's camera pick, an advisor-side burst) covers
     every side. Absent means the customer's own device, as it always has. */
  const sideVia = (r) => drSideVia(r, captured());
  function sourceLine() {
    const r = rec();
    /* a bare { state: "requested" } record means the customer has been ASKED
       and has sent nothing — naming them as the source of an upload that has
       not happened is the same false claim the page count made (review
       find). No source until something arrives. */
    if (!r || r.state === "requested" || !captured()) return "&mdash;";
    const v = sideVia(r);
    const adv = v.filter(x => x === "advisor").length;
    if (adv === 0) return "Customer upload";
    if (adv === v.length) return "Advisor capture";
    return "Customer upload + advisor capture";
  }
  /* what checked it, in plain words. "Simulated" is the demo's honesty line:
     nothing here reads a photo. */
  function verificationLine() {
    const done = jacketState(deal, docId); if (!done) return null;
    return done.how === "sort" ? "Simulated" : done.how === "scan" ? "Marker read" : done.how === "esign" ? "Signed in the app"
      : done.how === "client" ? "Reviewed" : done.how === "app" ? "Recorded by the app" : "Marked received";
  }

  function render() {
    renderChrome(d.label, "", "");
    document.body.dataset.canvas = "master";
    document.body.dataset.screen = "docreview";

    const names = sideNames();
    const have = captured();
    /* a document can lose a side (a rejected page is dropped), so the
       selected index is clamped every render */
    st.side = Math.min(st.side, Math.max(0, names.length - 1));
    const u = urls()[st.side];
    const s = status();
    const miss = missingIdx();
    /* the link was sent from this screen and the side has not landed yet.
       V3: once complete, the dock goes and the top-left Back is the only
       way out — a second labelled Back was the duplicate the package bans. */
    const r0 = rec();
    const waiting = miss >= 0 && !!(r0 && r0.linkSentAt);
    const ctx = [c ? `${c.first} ${c.last}` : null, deal.dealNo ? `Deal #${deal.dealNo}` : null].filter(Boolean).join(" · ");

    view().innerHTML = `
      <div class="m-app drv-app${miss >= 0 ? " drv-app--dock" : ""}">
        <header class="drv-top">
          <button type="button" class="drv-icon" id="drvBack" aria-label="Back to Deal Jacket">&lsaquo;</button>
          <div class="drv-topcopy">
            <div class="drv-title">${esc(d.label)}</div>
            <div class="drv-meta">${esc(ctx)}</div>
          </div>
          <button type="button" class="drv-icon" id="drvMore" aria-label="More document actions">&hellip;</button>
        </header>
        <main class="drv-page">
          <div class="drv-viewer" id="drvViewer">
            ${u
              ? `<img class="drv-paper${st.zoom > 1 ? " drv-paper--zoom" : ""}" src="${esc(u)}" alt="${esc(d.label)} — ${esc(names[st.side] || "page")}" style="transform:scale(${esc(st.zoom)})">`
              : `<div class="drv-placeholder"><span class="drv-phmark">TRAINING PREVIEW</span>
                   <b>${esc(d.label)}${names[st.side] ? " &middot; " + esc(names[st.side].toUpperCase()) : ""}</b>
                   <p>The photo lived only in the session that captured it. The record is what the jacket keeps.</p></div>`}
          </div>
          <div class="drv-sides">
            ${names.map((n, i) => {
              const need = i >= have;
              return `<button type="button" class="drv-side${need ? " drv-side--need" : i === st.side ? " on" : ""}" data-side="${esc(i)}">
                ${esc(n)} &middot; ${need ? "Needed" : "Received"}</button>`;
            }).join("")}
          </div>
          <section class="drv-status">
            <div class="drv-statusrow">
              <span class="drv-dot drv-dot--${esc(s.kind)}">${s.kind === "good" ? rpIcon("check") : "!"}</span>
              <div class="drv-statuscopy"><strong>${esc(s.title)}</strong><p>${esc(s.body)}</p></div>
            </div>
            <div class="drv-detail"><span>Source</span><strong>${sourceLine()}</strong></div>
            ${verificationLine() ? `<div class="drv-detail"><span>Verification</span><strong>${esc(verificationLine())}</strong></div>` : ""}
            ${waiting ? `<div class="drv-waiting">${rpIcon("clock")} Link sent &middot; waiting for customer upload</div>` : ""}
          </section>
        </main>
        ${miss >= 0 ? `<div class="drv-dock">
          <button type="button" class="tv-primary drv-go" id="drvAdd">${waiting ? "Manage" : "Add"} missing ${esc((names[miss] || "page").toLowerCase())}</button>
        </div>` : ""}
      </div>
      <div class="m-scrim" id="drvScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="drvSheet"></div></div>`;

    $("#drvBack").onclick = () => navigate("#/jacket/" + deal.id);
    $("#drvMore").onclick = moreSheet;
    const add = $("#drvAdd"); if (add) add.onclick = addSideSheet;
    $$("[data-side]").forEach(b => b.onclick = () => {
      const i = Number(b.dataset.side);
      /* tapping a side that has not arrived offers the way to get it, rather
         than showing an empty frame */
      if (i >= captured()) return addSideSheet();
      st.side = i; st.zoom = 1; render();
    });
    const scrim = $("#drvScrim");
    scrim.onclick = (e) => { if (e.target === scrim) closeSheet(); };
    /* gesture zoom, as the package asks: double-tap toggles, pinch is
       continuous. No permanent +/- buttons on the viewer. */
    const stage = $("#drvViewer");
    stage.ondblclick = () => { st.zoom = st.zoom > 1 ? 1 : 1.6; render(); };
    drPinchZoom(stage, st, render);
  }

  /* the exception sheet: the two ways this app can actually get a side */
  function addSideSheet() {
    const names = sideNames();
    const miss = Math.max(0, missingIdx());
    const what = (names[miss] || "page").toLowerCase();
    const choice = (icon, title, sub, attr) => `<button type="button" class="drv-choice" ${attr}>
      <span class="drv-well">${rpIcon(icon)}</span>
      <span class="drv-choicecopy"><strong>${esc(title)}</strong><span>${esc(sub)}</span></span>
      <span class="drv-chev" aria-hidden="true">&rsaquo;</span></button>`;
    openSheet(`
      <h2 class="tv-sheettitle drv-sheettitle">Add ${esc(what)} of ${esc(d.label.toLowerCase())}</h2>
      <section class="drv-choices">
        ${choice("camera", "Scan " + what + " now", "Use this device to capture the missing side.", `id="drvScan"`)}
        ${choice("upload", "Send secure upload link", "Customer uploads directly into Ride Price.", `id="drvLink"`)}
      </section>
      <input id="drvFile" class="drv-file" type="file" accept="image/*" capture="environment" hidden>
      <p class="drv-note">Uploads go directly into Ride Price &mdash; never through the salesperson&rsquo;s phone.${(rec() || {}).linkSentAt
        ? ` Link already sent &mdash; demo: <a href="#/clientlink/${esc(deal.id)}">open the customer view</a> on this device.` : ""}</p>`, (sh) => {
      const file = $("#drvFile", sh);
      $("#drvScan", sh).onclick = () => { file.value = ""; file.click(); };
      file.onchange = () => {
        if (!file.files || !file.files.length) return;
        const from = drAddShots(deal, docId, file.files);
        const result = drAutoVerify(deal, docId);
        /* this sheet captures on THIS device — the advisor’s. Without the
           marker the jacket counts it as customer activity and the tracking
           sheet claims they opened the link and uploaded, which they never
           did. The same fix was already made for the jacket’s camera pick
           (review find); this capture site was missed. Absent via still
           means the customer’s own device. */
        const cr = jacketClient(deal)[docId];
        if (cr) {
          /* V3: provenance is PER SIDE. Only the side captured here is the
             advisor's; the front the customer sent stays theirs, so Source
             can read "Customer upload + advisor capture" instead of
             rewriting the whole document's history. via:"advisor" is NOT
             set here — that flag means every side. */
          drStampSides(deal, docId, drSidesFrom(deal, docId, from), "advisor");
          delete cr.linkSentAt;
          Store.save();
        }
        void result;
        /* V3: no success sheet, no toast. The viewer switches to the side
           that just arrived and the card says what the document now is. */
        closeSheet();
        st.side = Math.max(0, captured() - 1); st.zoom = 1;
        render();
      };
      $("#drvLink", sh).onclick = () => {
        jacketSendRequest(deal, [docId]);
        /* jacketSendRequest leaves a record that already holds a side
           alone, so the front stays on file; this marker is what the card's
           waiting strip and the dock's "Manage" label read */
        const cr = jacketClient(deal)[docId];
        if (cr) { cr.linkSentAt = new Date().toISOString(); Store.save(); }
        /* V3: no confirmation sheet — the card shows the waiting state */
        closeSheet(); render();
      };
    });
  }

  /* the overflow: secondary viewer actions only, never a duplicate of the
     dock's primary (package rule) */
  function moreSheet() {
    openSheet(`
      <h2 class="tv-sheettitle drv-sheettitle">Document actions</h2>
      <section class="drv-choices">
        <button type="button" class="drv-choice" id="drvZoom">
          <span class="drv-well">${rpIcon("radar")}</span>
          <span class="drv-choicecopy"><strong>${st.zoom > 1 ? "Reset zoom" : "Zoom document"}</strong><span>Double-tap or pinch the document does the same.</span></span>
          <span class="drv-chev" aria-hidden="true">&rsaquo;</span></button>
      </section>`, (sh) => {
      $("#drvZoom", sh).onclick = () => { st.zoom = st.zoom > 1 ? 1 : 1.6; closeSheet(); render(); };
    });
  }

  render();
});

/* ============================================================
   VIEW: Snap All Documents — burst capture + simulated auto-sort
   (owner's burst-capture prototype, 2026-08-18). One screen serves
   both sides: the advisor opens it from the jacket queue, the
   client from the landing page. The photos live in this session's
   memory like every client capture, and the "identification" is
   the same theater as the credit pull — nothing reads a photo
   (invariant 4), so the sort deals the shots onto the documents
   this deal still needs, in order, and the screen says so.
   ============================================================ */

/* Snap All — burst capture, on the kit since the owner's package (2026-09-09).
   The chrome is the kit's Task: banner, top bar, groups, dock, sheet and
   dialog. Reached from the jacket by the advisor and from the client landing
   by the customer — and on the customer's side the screen carries the kit's
   own rp-screen--present, the modifier for "the phone is turned to the
   customer", which hides the role control. That is the 2026-08-27 decision
   ("no app bar, no role switch" on the client's page) kept with the kit's own
   device rather than a rule of ours over one of its classes. */
route("snapall/:id/:origin", ({ id, origin }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const backHash = origin === "advisor" ? "#/jacket/" + deal.id : "#/clientlink/" + deal.id;
  /* the sort's targets: the customer documents still outstanding */
  const targets = clientQueue(deal);
  /* redirect, not navigate: after a committed batch empties the queue, Back
     re-enters this route, and a pushed guard would bounce forward forever —
     the same trap the retired composer hash had (review find) */
  if (!targets.length) return redirect(backHash);
  const cst = Store.customer(deal.customerId);
  const custName = cst ? cst.first + " " + cst.last : "";
  const clientSide = origin !== "advisor";
  const sheets = chSheetOpener("saScrim", "saSheet");

  /* shots are session-only object URLs until Confirm hands them to a
     document's page set; leaving the screen releases whatever was not kept.
     `overrides` outlives a single sort on purpose — see acceptRow. */
  const st = { screen: "capture", shots: [], results: null, aim: null, aimShot: null,
               passes: 0, beat: {}, overrides: {}, sorting: false };
  const releaseShot = (s) => { try { URL.revokeObjectURL(s.url); } catch (e) {} };
  function cleanup() { st.shots.forEach(releaseShot); st.shots = []; window.removeEventListener("hashchange", cleanup); }
  window.addEventListener("hashchange", cleanup);

  /* the kit sizes .rp-tile's glyph itself; everything else on this screen is
     sized on one of our own classes, never by a rule over .rp-icon */
  const saIcon = (k, cls) => `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${RP_ICON[k] || RP_ICON.file}</svg>`;
  const plural = (n, one, many) => n + " " + (n === 1 ? one : many);

  function buildResults() {
    st.passes++;
    /* deal the shots onto the outstanding documents in order — the demo's
       honest version of "identify": it cannot read them, so it does not try.
       A shot keeps its document once dealt (or aimed by a retake), so a
       second pass cannot shuffle earlier shots onto different documents. */
    const fed = {};
    st.shots.forEach((s, i) => {
      const tid = s.target || (s.target = targets[i % targets.length]);
      (fed[tid] = fed[tid] || []).push(s);
    });
    const rows = targets.map(tid => {
      const d = docMeta(tid); const m = clientMeta(tid);
      const shots = fed[tid] || [];
      const base = { id: tid, title: d.label, sub: (m && m.sub) || "", shots };
      if (!shots.length) return Object.assign(base, { status: "missing" });
      /* the burst obeys the same rules the row path does: enough pages
         first, then the document's own first-attempt beat. Without this a
         two-sided document could pass here on a single shot while the same
         photo is refused one screen away. */
      const rec = jacketClient(deal)[tid] || {};
      if (m.minPages && shots.length < m.minPages && m.missingPage)
        return Object.assign(base, { status: "attention", kind: "pages", issue: m.missingPage.title, fix: m.missingPage.action || "Add the page" });
      if (m.firstIssue && !(rec.tries > 0) && !st.beat[tid]) {
        st.beat[tid] = true;
        return Object.assign(base, { status: "attention", kind: "issue", issue: drFirstIssueText(m), fix: "Retake" });
      }
      return Object.assign(base, { status: "verified", detail: "Matched: " + (cst ? custName : "this deal") + " · " + m.sortDetail });
    });
    /* an exception the advisor already ruled on survives the next pass, and
       which way it survives depends on what the exception WAS (RP-SA-004).
       A missing page is fixed by the page: once the document has its sides
       the override retires with the flag it covered. An expiry is not fixed
       by another photo — the second pass clears the flag only because the
       demo flags a document once — so a document accepted over one keeps
       saying so, with its reason, until Undo. Without this the advisor could
       take one more photo of something else and the jacket would record the
       insurance as plainly verified. */
    rows.forEach(r => {
      const ov = st.overrides[r.id];
      if (!ov) return;
      if (r.status === "attention") return acceptRow(r);
      if (ov.kind === "pages") return void delete st.overrides[r.id];
      r.issue = r.issue || ov.issue;
      acceptRow(r);
    });
    return rows;
  }

  function acceptRow(r) {
    st.overrides[r.id] = { issue: r.issue, kind: r.kind };
    r.status = "verified"; r.override = true;
    r.detail = "Accepted with exception — " + r.issue;
  }
  function undoRow(r) {
    delete st.overrides[r.id];
    /* the row keeps its issue and its kind, so putting it back is a status
       change and nothing else — the pages it actually has are untouched */
    r.status = "attention"; r.override = false; r.detail = null;
  }

  function commit() {
    const at = new Date().toISOString();
    const clw = jacketClientOf(deal);
    st.results.forEach(r => {
      if (r.status === "missing") return;
      /* the kept shots become this document's pages — the same session-only
         home every client capture uses; the records are what persists */
      clientPhotosClear(deal.id, r.id);
      clientPhotosSet(deal.id, r.id, r.shots.map(s => s.url));
      const rec = clw[r.id] || (clw[r.id] = {});
      rec.pages = r.shots.length;
      rec.draftPages = r.shots.length;
      rec.receivedAt = at;
      /* an advisor-side burst is not customer activity — the jacket's
         delivery tracking must not credit it to the customer's phone */
      if (origin === "advisor") rec.via = "advisor";
      /* V3: a burst REPLACES every page, so the per-side record is rewritten
         whole — stale entries from an earlier capture would otherwise outrank
         the burst's own origin (review find) */
      rec.sideVia = r.shots.map(() => origin === "advisor" ? "advisor" : "customer");
      rec.tries = (rec.tries || 0) + 1; /* a burst pass counts as an attempt, so a later per-row retake is not re-flagged */
      if (r.status === "verified") {
        rec.state = "accepted"; rec.acceptedAt = at; rec.rejectedReason = null;
        jacketReceive(deal, r.id, "sort", r.override ? "Accepted with exception — " + r.issue : "");
      } else {
        /* an unresolved flag files as a rejection, so the existing redo loop
           carries it: the client link shows the reason, Review stays open */
        rec.state = "rejected"; rec.rejectedReason = r.issue;
      }
    });
    Store.save();
    st.shots = []; /* the kept URLs now belong to the documents */
    toast("Batch sorted. Verified documents moved into the Deal Jacket.");
    navigate(backHash);
  }

  /* ---------------- the three screens ---------------- */

  const contextRow = () => `<div class="rp-listhead">
    <span class="rp-eyebrow">Deal #${esc(deal.dealNo || "—")}</span>
    <span class="rp-listhead__meta">${esc(custName)}</span></div>`;

  function captureScreen() {
    const n = st.shots.length, aim = st.aim;
    return `<div class="sa-capture">
      ${contextRow()}
      <h1 class="rp-title">${aim ? (aim.kind === "pages" ? "Add the missing page." : "Retake this document.") : "Capture everything."}</h1>
      <p class="rp-count">${aim ? esc(aim.title + " · " + aim.issue) : "One batch. Every outstanding document."}</p>
      <div class="sa-finder">
        <i class="sa-corner sa-corner--tl"></i><i class="sa-corner sa-corner--tr"></i><i class="sa-corner sa-corner--bl"></i><i class="sa-corner sa-corner--br"></i>
        <span class="sa-finder__label">No live preview</span>
        ${saIcon("camera", "sa-finder__ico")}
        <b class="sa-finder__title">${aim ? "Frame the page it is missing." : "Paper, card or ID."}</b>
        <p class="sa-finder__copy">${aim ? "Your other photos stay in the batch." : "Take them one after another. Sort the batch when you are ready."}</p>
      </div>
      ${n ? `<div class="sa-thumbs" aria-label="Captured photos">${st.shots.map((s, i) => `
        <span class="sa-thumb">
          <button type="button" class="sa-thumb__open" data-shot="${esc(s.id)}" aria-label="Review photo ${i + 1}"><img src="${esc(s.url)}" alt=""></button>
          <span class="sa-thumb__n">${i + 1}</span>
          <button type="button" class="sa-thumb__x sa-hit" data-unshot="${esc(s.id)}" aria-label="Remove photo ${i + 1}">${saIcon("close", "")}</button>
        </span>`).join("")}</div>` : ""}
      <div class="sa-tools">
        <button type="button" class="rp-chip sa-gallery sa-hit" id="saGallery">${saIcon("images", "")}Gallery</button>
        <button type="button" class="sa-shutter" id="saShutter" aria-label="Take a photo"><span></span></button>
        <span class="sa-count"><strong>${n}</strong>${n === 1 ? "photo" : "photos"}</span>
      </div>
    </div>`;
  }

  function sortingScreen() {
    return `<div class="sa-sorting" id="saSorting">
      <span class="sa-spinner" aria-hidden="true"></span>
      <h1 class="rp-title">Sorting your batch.</h1>
      <p class="rp-count">Dealing the photos onto the documents this deal still needs.</p>
      <span class="rp-status">${plural(st.shots.length, "photo", "photos")}</span>
    </div>`;
  }

  function docRow(r) {
    const pages = r.shots.length;
    const meta = pages ? plural(pages, "photo", "photos") + (r.sub ? " · " + r.sub : "") : r.sub;
    const needs = r.status === "attention";
    return `<div class="sa-doc">
      <div class="sa-doc__head"><span class="rp-tile">${rpIconGlyph(drRowIconKey(r.id))}</span>
        <div class="sa-doc__body">
          <span class="sa-doc__title">${esc(r.title)}</span>
          <p class="sa-doc__meta">${esc(meta)}</p>
          ${needs ? `<p class="sa-doc__issue">${saIcon("alert", "")}${esc(r.issue)}</p>`
                  : r.override ? `<p class="sa-doc__meta">${esc(r.detail)}</p>`
                  : r.detail ? `<p class="sa-doc__meta">${esc(r.detail)}</p>` : ""}
        </div></div>
      ${needs ? `<div class="sa-doc__acts">
          <button type="button" class="sa-act sa-act--fix sa-hit" data-sa-retake="${esc(r.id)}">${saIcon(r.kind === "pages" ? "plus" : "camera", "")}${esc(r.fix || "Retake")}</button>
          <button type="button" class="sa-act sa-hit" data-sa-accept="${esc(r.id)}">Accept anyway</button>
        </div>`
        : r.status === "verified" ? `<div class="sa-doc__status">
          <span class="rp-status ${r.override ? "rp-status--warn" : "rp-status--positive"}">${r.override ? "Exception accepted" : "Verified"}</span>
          ${r.override ? `<button type="button" class="sa-act sa-hit" data-sa-undo="${esc(r.id)}">Undo</button>` : ""}
        </div>` : ""}
    </div>`;
  }

  function resultsScreen() {
    const ok = st.results.filter(r => r.status === "verified");
    const attn = st.results.filter(r => r.status === "attention");
    const missing = st.results.filter(r => r.status === "missing");
    const landed = st.results.length - missing.length;
    const group = (label, rows) => rows.length
      ? `<div class="rp-listhead"><span class="rp-section">${label}</span><span class="rp-listhead__meta">${rows.length}</span></div>
         <div class="rp-group">${rows.map(docRow).join("")}</div>` : "";
    return `${contextRow()}
      <h1 class="rp-title">Your batch, sorted.</h1>
      <div class="sa-summary">
        <span>${plural(st.shots.length, "photo", "photos")} · ${landed} of ${st.results.length} documents</span>
        <button type="button" class="sa-more sa-hit" id="saMore">${saIcon("plus", "")}Take more</button>
      </div>
      ${group("Verified", ok)}
      ${group("Needs attention", attn)}
      ${group("Still needed", missing)}
      <p class="sa-note">${saIcon("lock", "")}<span>Demo — the sorting is simulated. Nothing is read from your photos and they never leave this device.</span></p>`;
  }

  /* ---------------- what the dock carries ---------------- */

  function dockHtml() {
    if (st.screen === "sorting") return null;
    if (st.screen === "results") return chDock(`<button type="button" class="rp-primary" id="saSave">Confirm &amp; save to deal jacket</button>`);
    const n = st.shots.length;
    /* the destination is on show even with nothing to send there — a primary
       that is missing until the batch is non-empty leaves the screen with no
       stated next step (the owner's board supersedes the 2026-08-18 rule that
       hid it) */
    if (st.aim) return chDock(`<button type="button" class="rp-primary" id="saUseAim"${st.aimShot ? "" : " disabled"}>Use photo &amp; return</button>`);
    return chDock(`<button type="button" class="rp-primary" id="saProcess"${n ? "" : " disabled"}>${n ? `Process ${plural(n, "photo", "photos")} &amp; auto-sort` : "Process photos"}</button>`);
  }

  /* ---------------- the sheets, and what they guard ---------------- */

  function reviewPhoto(sid) {
    const i = st.shots.findIndex(s => s.id === sid); if (i < 0) return;
    const s = st.shots[i];
    sheets.open(`${chSheetHead("Review photo")}
      <p class="rp-sheet__sub">Photo ${i + 1} of ${st.shots.length}</p>
      <div class="sa-stage"><img src="${esc(s.url)}" alt="Captured photo ${i + 1}"></div>
      <button type="button" class="rp-primary" data-sheet-close>Keep photo</button>
      <button type="button" class="rp-link sa-hit" id="saDrop">Remove photo</button>`, (sheet) => {
      /* the dialog opens over this sheet, so close first: the opener holds
         one sheet node per screen and the dialog reshapes it */
      $("#saDrop", sheet).onclick = () => { sheets.close(); confirmRemove(sid); };
    });
  }

  /* Owner's call, 2026-09-09, on the screenshots: "always leave the gradient,
     I love that part." So a confirmation on this screen is his board's SHEET
     and not the kit's grey/red dialog — the primary carries the thing the
     sheet was raised to do, and the quiet link is the way out. The dialog is
     unchanged everywhere else it is used; this is the one screen he ruled on.
     `sheets.open` supplies the grab handle and names the sheet from the
     title, so the shape here is only what sits under it. */
  function confirmSheet(title, body, goLabel, keepLabel, onConfirm) {
    sheets.open(`<h2 class="rp-sheet__title">${esc(title)}</h2>
      <p class="sa-confirmcopy">${esc(body)}</p>
      <button type="button" class="rp-primary" id="saConfirmGo">${esc(goLabel)}</button>
      <button type="button" class="rp-link sa-hit" data-sheet-close>${esc(keepLabel)}</button>`, (sheet) => {
      $("#saConfirmGo", sheet).onclick = () => { sheets.close(); onConfirm(); };
    });
  }

  function confirmRemove(sid) {
    if (!st.shots.some(s => s.id === sid)) return;
    confirmSheet("Remove this photo?", "The other photos stay in the batch.", "Remove photo", "Keep photo", () => {
      const j = st.shots.findIndex(s => s.id === sid);
      if (j < 0) return;
      /* a candidate for an aimed page is the aim's own photo — dropping it
         puts the dock back to disabled rather than leaving a stale id */
      if (st.aimShot === sid) st.aimShot = null;
      releaseShot(st.shots[j]); st.shots.splice(j, 1); render();
    });
  }

  /* Close: while a page is aimed this cancels the aim rather than the batch,
     because the batch is not what was entered. Otherwise a batch that has not
     been sorted is protected — the shots are session-only and leaving is what
     discards them. */
  function closeScreen() {
    if (st.aim) { cancelAim(); return; }
    if (!st.shots.length) return navigate(backHash);
    confirmSheet("Leave this capture?",
      `The ${plural(st.shots.length, "photo", "photos")} in this batch have not been saved to the deal jacket, and leaving clears them.`,
      "Leave capture", "Keep capturing", () => navigate(backHash));
  }

  function cancelAim() {
    /* the candidate goes with the aim; the pages that were already on file
       for that document are never touched by a cancel */
    if (st.aimShot) {
      const j = st.shots.findIndex(s => s.id === st.aimShot);
      if (j >= 0) { releaseShot(st.shots[j]); st.shots.splice(j, 1); }
    }
    st.aim = null; st.aimShot = null;
    st.screen = st.results ? "results" : "capture";
    render();
  }

  /* ---------------- capture ---------------- */

  function addFiles(files, source) {
    const list = Array.from(files || []);
    if (!list.length) return;
    /* the batch keeps the order they were PICKED, not the order the decodes
       happened to finish: one slot per file, filled in place, and nothing is
       appended until every probe has settled. A green-red-blue pick came back
       red-green-blue before this — measured, in the screenshots. */
    const slots = new Array(list.length).fill(null);
    let left = list.length, bad = 0;
    const settled = () => {
      if (--left) return;
      const kept = slots.filter(Boolean);
      /* an aimed page holds ONE candidate: whatever it was holding is released
         so a second pick replaces it rather than adding a page nobody asked for */
      if (st.aim && kept.length) {
        if (st.aimShot) {
          const j = st.shots.findIndex(x => x.id === st.aimShot);
          if (j >= 0) { releaseShot(st.shots[j]); st.shots.splice(j, 1); }
        }
        st.aimShot = kept[0].id;
      }
      st.shots.push(...kept);
      /* a file the browser cannot decode is not a photo: say so, and leave
         every photo already in the batch exactly where it was */
      if (bad) toast(bad === 1 ? "That file could not be read as a photo — nothing was added."
                               : bad + " files could not be read as photos and were not added.");
      render();
    };
    list.forEach((f, i) => {
      const url = URL.createObjectURL(f);
      const probe = new Image();
      probe.onload = () => { slots[i] = { id: uid("s"), url, source, target: st.aim ? st.aim.id : null }; settled(); };
      probe.onerror = () => { try { URL.revokeObjectURL(url); } catch (e) {} bad++; settled(); };
      probe.src = url;
    });
  }

  function startSort() {
    if (st.sorting) return;
    st.sorting = true; st.screen = "sorting"; render();
    /* NAVIGATING AWAY mid-sort must not let the timer write state and repaint
       over whatever screen is showing by then — the jacket's send lock learned
       this the hard way */
    const alive = () => !!$("#saSorting") && document.contains($("#saSorting"));
    setTimeout(() => {
      st.sorting = false;
      if (!alive()) return;
      st.results = buildResults(); st.screen = "results"; render();
    }, 850);
  }

  /* ---------------- paint ---------------- */

  function render() {
    const content = (st.screen === "results" ? resultsScreen() : st.screen === "sorting" ? sortingScreen() : captureScreen())
      /* the trainer's way back to the advisor's side rides INSIDE the page:
         the kit's screen is the viewport and clips anything after it */
      + (clientSide ? `<button type="button" class="dr-demoexit" data-dbg="advisor">Demo · advisor view</button>` : "");
    const step = st.screen === "results" ? "Auto-sort results" : st.screen === "sorting" ? "Auto-sorting" : "Capture documents";

    renderChrome("Snap All", dealTitle(deal), "");
    document.body.dataset.canvas = "kit";
    document.body.dataset.screen = "snapall";
    view().innerHTML = chShell(
      { template: "task", title: "Snap All", step, closeId: "saClose", closeLabel: "Close capture",
        cls: clientSide ? "rp-screen--present" : "" },
      content, dockHtml(), { scrim: "saScrim", sheet: "saSheet" })
      + `<input type="file" accept="image/*" capture="environment" id="saCam" hidden>
         <input type="file" accept="image/*"${st.aim ? "" : " multiple"} id="saLib" hidden>`;

    $("#saClose").onclick = closeScreen;
    chFitDock();
    /* the customer's screen has no role control to wire — the kit hides it */
    if (!clientSide) chWireRole(sheets, render);
    drWireDebug(deal);

    if (st.screen === "sorting") return;

    if (st.screen === "results") {
      $("#saSave").onclick = commit;
      $("#saMore").onclick = () => { st.screen = "capture"; render(); };
      $$("[data-sa-retake]").forEach(b => b.onclick = () => {
        const flagged = st.results.find(r => r.id === b.dataset.saRetake);
        if (!flagged) return;
        /* a bad photo is replaced; a missing page is added to — the same
           rule the row path follows, so the two never disagree */
        if (flagged.kind !== "pages") {
          flagged.shots.forEach(releaseShot);
          st.shots = st.shots.filter(s => s.target !== flagged.id);
        }
        st.aim = { id: flagged.id, title: flagged.title, issue: flagged.issue, kind: flagged.kind };
        st.aimShot = null;
        st.screen = "capture"; render();
      });
      $$("[data-sa-accept]").forEach(b => b.onclick = () => {
        const r = st.results.find(x => x.id === b.dataset.saAccept);
        if (r) { acceptRow(r); render(); }
      });
      $$("[data-sa-undo]").forEach(b => b.onclick = () => {
        const r = st.results.find(x => x.id === b.dataset.saUndo);
        if (r) { undoRow(r); render(); }
      });
      return;
    }

    $("#saShutter").onclick = () => { const inp = $("#saCam"); inp.value = ""; inp.click(); };
    $("#saGallery").onclick = () => { const inp = $("#saLib"); inp.value = ""; inp.click(); };
    [["#saCam", "camera"], ["#saLib", "gallery"]].forEach(([sel, source]) => {
      const inp = $(sel);
      inp.onchange = () => addFiles(inp.files, source);
    });
    $$("[data-shot]").forEach(b => b.onclick = () => reviewPhoto(b.dataset.shot));
    $$("[data-unshot]").forEach(b => b.onclick = () => confirmRemove(b.dataset.unshot));
    if ($("#saProcess")) $("#saProcess").onclick = startSort;
    if ($("#saUseAim")) $("#saUseAim").onclick = () => {
      st.aim = null; st.aimShot = null;
      st.results = buildResults(); st.screen = "results"; render();
    };
  }

  render();
});

/* ============================================================
   DOCUMENT DATA — the shared layer every recreated form draws on
   ============================================================
   The owner's reusable structure (recorded 2026-08-16 with the MV-82 field
   inventory): customer information → address → vehicle information →
   lienholder → dealer/plate information. Built once, so the next recreated
   form starts here instead of re-deriving.

   The honesty contract: every value is either read from deal state or LEFT
   ABSENT (null) — nothing is invented. A printed form renders an absent
   value as an empty box to be completed by hand, the same statement the
   tri-state ownership fields make on screen: "nobody was asked" is not an
   answer the app may fabricate. */
const MV_BODY_CODES = { SUV: "SUBN", Wagon: "SUBN", Sedan: "4DSD" };

function docData(deal) {
  const c = Store.customer(deal.customerId) || {};
  /* the id is a pointer resolved through the store; a dangling coBuyerId
     means "no co-buyer", never an error (the PR #12 lesson, kept) */
  const co = deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;
  const v = Store.vehicle(deal.stock);
  const zip = RIDE_PRICE_DATA.zipLookup[c.zip] || {};
  const person = (r) => r ? {
    name: [r.last, r.first, r.middle].filter(Boolean).join(", "),
    dob: r.dob || null,
    sex: null,                            /* never held on a customer record */
    license: (r.license && r.license.number) || null,
    licenseExpires: (r.license && r.license.expires) || null,
    phone: r.phone || null,
    mobile: null,                         /* never collected */
    email: r.email || null
  } : null;
  return {
    customer: person(c),
    coRegistrant: person(co),
    address: {
      street: c.address || null,
      apt: null,                          /* never collected */
      city: c.city || null, state: c.state || null, zip: c.zip || null,
      county: zip.county || null          /* the ZIP directory carries county
                                             precisely because forms ask */
    },
    vehicle: v ? {
      year: v.year, make: v.make, model: v.model,
      bodyCode: MV_BODY_CODES[v.body] || null,
      colorCode: v.colorCode || null,
      vin: v.vin,
      odometer: v.miles, mileageBrand: "ACTUAL",
      weight: v.weight || null, seats: v.seats || null,
      fuel: v.fuel || null, cyl: v.cyl || null
    } : null,
    /* a lien exists once financing is real: an approved application names
       the lender. Cash is a true NONE; an unapproved financed deal is an
       honest blank — the lender is not known yet. */
    lienholder: deal.dealType === "cash" ? { none: true, name: null }
      : (creditLive(deal) && deal.creditApp.lender)
        ? { none: false, name: deal.creditApp.lender }
        : { none: false, name: null },
    dealerPlate: {
      dealer: RIDE_PRICE_DATA.dealership.name,
      dealerAddress: RIDE_PRICE_DATA.dealership.address,
      stock: deal.stock || null, dealNo: deal.dealNo || null
      /* plate transfer / new-plate choice is not recorded on a deal —
         the Transfer Plates Registration is its own document (code 8) */
    }
  };
}

/* ============================================================
   VIEW: Print Center + printable deal documents
   ============================================================ */

/* Forms that recreate a real government document. They print with the same
   TRAINING SAMPLE treatment as the prop licences — banner, watermark, footer —
   because a filled lookalike sitting on a public demo must never be mistakable
   for a real filing. Owner-approved 2026-08-19; the recommendation had been on
   the table since 2026-08-16.
   Like JACKET_OUTSIDE this is a derived list, not a stored field: classifying
   another form is one edit here and no saved deal needs migrating. Ids are
   dealForms ids, with or without the print route's "form-" prefix. */
const GOV_FORMS = ["reg"];
const isGovForm = (docId) => GOV_FORMS.includes(String(docId || "").replace(/^form-/, ""));

function printDocs(deal) {
  const v = Store.vehicle(deal.stock);
  const c = Store.customer(deal.customerId);
  const snap = (deal.basePayment && deal.basePayment.snapshot) || (v ? RIDE_PRICE_CALC.calc(deal, v) : null);
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const isCash = deal.dealType === "cash";
  const ds = RIDE_PRICE_DATA.dealership;

  const sig = (name, label) => `<div class="pd-sig">
    <div class="line">${name ? `<span class="script">${esc(name)}</span><br>` : "<br>"}${label}</div>
    <div class="line"><br>Date</div>
  </div>`;

  function shell(title, body, docId) {
    /* the watermark wraps the body only, never the footer: the marker strip
       lives down there and a camera has to read it off paper. */
    const sample = isGovForm(docId);
    return `<article class="print-doc">
      <header class="pd-head">
        <div class="brand"><span class="rideprice">Ride</span><span class="price">PRICE</span></div>
        <div class="pd-store"><b>${ds.name}</b><br>${ds.address} · ${ds.phone}</div>
      </header>
      ${sample ? `<div class="pd-sample">Training Sample — not a government document</div>` : ""}
      <h1 class="pd-title">${title}</h1>
      <div class="pd-meta">
        <span><b>${esc(c.first)} ${esc(c.last)}</b> · ${esc(c.phone)}</span>
        <span>${v ? `${esc(v.year)} ${esc(v.make)} ${esc(v.model)} ${esc(v.trim)} · Stock ${esc(v.stock)} · VIN ${esc(v.vin)}` : "No vehicle selected"}</span>
        <span>${today()} · ${DEAL_TYPES[deal.dealType]} · Advisor: ${esc(Store.s.advisor)}</span>
      </div>
      ${sample ? `<div class="pd-samplewrap"><div class="pd-watermark" aria-hidden="true"><span>TRAINING SAMPLE</span></div>${body}</div>` : body}
      <footer class="pd-foot"><span>${ds.name} — demo document for training use only · ${sample ? "not a government document" : "not a real contract"}</span>
        ${docMarkerHtml(deal, docId)}</footer>
    </article>`;
  }

  const docs = {};

  /* the trade rows below take value and payoff through `|| 0`, and since
     2026-09-09 that is not belt and braces. An unfinanced trade now records
     its payoff by leaving the key ABSENT, while the appraisal's own floor
     (1500 x 0.78) guarantees a truthy value beside it — so the two
     value-gated rows became reachable with the payoff undefined, and
     money(undefined) prints "$NaN" on a document the customer signs. The
     cover sheet's row is weaker still: gated on `has` alone, it is the one
     printable a trade that never went through Run evaluation can reach.
     Rejected: coercing inside money()/money0() in calc.js, which would kill
     the class in one line and also hide a genuinely missing figure on every
     other screen — ten sibling trade reads already guard at the call site,
     so that is the file's convention. */
  docs.cover = () => shell("Deal Cover Sheet", `
    <ul class="lines">
      <li><span>Deal Type / Stage</span><b class="amt">${DEAL_TYPES[deal.dealType]} · ${(STAGES[deal.stage] || {}).label || deal.stage}</b></li>
      ${snap ? `<li><span>${isCash ? "Total Due" : isLease ? "Monthly Payment (lease)" : "Monthly Payment"}</span>
        <b class="amt">${money(isCash ? snap.totalDue : (deal.dealType === "onepay" ? snap.onePayTotal : snap.payment))}</b></li>` : ""}
      <li><span>Trade</span><b class="amt">${deal.trade.has ? `${esc(deal.trade.desc || "documented")} · ${money0(deal.trade.value || 0)} / payoff ${money0(deal.trade.payoff || 0)}` : "None"}</b></li>
      <li><span>Team Lead sign-off</span><b class="amt">${deal.signoff ? esc(deal.signoff.by) : "Pending"}</b></li>
    </ul>
    <h3 class="pd-h3">Required documentation checklist</h3>
    <ul class="pd-checks">
      ${["Driver's license copy", "Proof of insurance / updated insurance card", "Signed base payment agreement",
         "Credit application submitted (Lending Lane)", "Trade title & lien release letter (if trade)",
         "Vehicle registration (if trade)", "Rebate eligibility confirmed", "Cover sheet reviewed by Team Lead"]
        .map(x => `<li><i></i>${x}</li>`).join("")}
    </ul>
    <p class="pd-note">This transition is a pivotal point — completed efficiently, it keeps the client experience on time.</p>
    ${sig("", "Client Advisor")}`, "cover");

  docs.agreement = () => shell("Customer Acknowledgement of Basic Terms of Agreement", `
    <ul class="lines">
      ${!isCash && !isLease && snap ? `<li><span>Term / APR</span><b class="amt">${snap.term} months / ${snap.apr}%</b></li>` : ""}
      ${isLease && snap ? `<li><span>Term / Miles</span><b class="amt">${snap.term} months / ${snap.miles.toLocaleString()} mi-yr</b></li>` : ""}
      <li><span>MSRP</span><b class="amt">${money(v.msrp)}</b></li>
      <li><span>Selling Price (incl. options)</span><b class="amt">${money(v.selling + v.includedOptions)}</b></li>
      <li><span>Accessories</span><b class="amt">${money(snap ? snap.accessories : 0)}</b></li>
      <li><span><b>Your Price</b></span><b class="amt">${money(snap ? snap.yourPrice : 0)}</b></li>
      ${deal.trade.rebates ? `<li><span>Rebates</span><b class="amt">−${money(deal.trade.rebates)}</b></li>` : ""}
      ${deal.trade.value ? `<li><span>Trade Value / Payoff</span><b class="amt">${money(deal.trade.value)} / ${money(deal.trade.payoff || 0)}</b></li>` : ""}
      ${isLease && snap ? `<li><span>Residual (lease end value)</span><b class="amt">${money(snap.residual)}</b></li>` : ""}
      ${snap ? `<li><span>Total Taxes &amp; Fees</span><b class="amt">${money((snap.taxes.total || 0) + (snap.fees || 0))}</b></li>` : ""}
      ${!isCash && !isLease && snap ? `<li><span>Down Payment</span><b class="amt">${money(deal.desk.downPayment)}</b></li>
        <li><span>Total Amount Financed</span><b class="amt">${money(snap.amountFinanced)}</b></li>
        <li class="total"><span>${snap.term} Monthly Payments (inc. taxes)</span><b class="amt">${money(snap.payment)}</b></li>` : ""}
      ${deal.dealType === "lease" && snap ? `<li class="total"><span>${snap.term} Monthly Payments (inc. taxes)</span><b class="amt">${money(snap.payment)}</b></li>` : ""}
      ${deal.dealType === "onepay" && snap ? `<li class="total"><span>One-Pay Total Due At Signing</span><b class="amt">${money(snap.onePayTotal)}</b></li>` : ""}
      ${isCash && snap ? `<li class="total"><span>Total Due</span><b class="amt">${money(snap.totalDue)}</b></li>` : ""}
    </ul>
    <p class="pd-note">I/We have agreed to an approximate base payment structure per the terms above, subject to lender approval. This is a ballpark structure, not a purchase.</p>
    ${sig(deal.basePayment && deal.basePayment.sigName, "Customer")}
    ${sig(Store.s.advisor, "Client Advisor — " + ds.name)}`, "agreement");

  docs.repayment = () => {
    const progSet = RIDE_PRICE_DATA.programs[isLease ? "lease" : isCash ? "cash" : "finance"];
    const selKey = deal.menu.selectedProgram;
    const purchased = selKey && selKey !== "none" ? (selKey === "custom" ? deal.menu.custom : (progSet[selKey] || {}).products || []) : [];
    const declined = [...new Set(Object.values(progSet).flatMap(p => p.products))].filter(pid => !purchased.includes(pid));
    return shell("Repayment Options", `
      <h3 class="pd-h3">Purchased products</h3>
      <ul class="lines">
        ${purchased.length ? purchased.map(pid => { const p = RIDE_PRICE_CALC.productById(pid); return `<li><span>${esc(p.name)} — ${esc(p.detail)}</span><b class="amt">${money(p.price)}</b></li>`; }).join("") : `<li><span>No products selected</span><b class="amt">${money(0)}</b></li>`}
      </ul>
      <h3 class="pd-h3">Declined products</h3>
      <p class="pd-note">${declined.length ? declined.map(pid => { const p = RIDE_PRICE_CALC.productById(pid); return esc(p.name) + " (" + esc(p.detail) + ")"; }).join(" · ") : "None"}</p>
      <p class="pd-note">The benefits and protection option(s) available have been explained to me/us and I/we choose the option(s) initialed (${esc(deal.menu.initials || "—")}). I/We hold the Dealer harmless for my/our refusal of any optional benefit or protection.</p>
      ${sig(deal.menu.ackSigned ? (deal.menu.ackName || c.first + " " + c.last) : "", "Customer")}`, "repayment");
  };

  docs.testdrive = () => shell("Test Drive Agreement", `
    <ul class="lines">
      <li><span>Driver's License #</span><b class="amt">${esc(deal.testDrive.license || "—")}</b></li>
      <li><span>Issuing State / Expiration</span><b class="amt">${esc(deal.testDrive.issuingState || "—")} / ${esc(deal.testDrive.expDate || "—")}</b></li>
      <li><span>Additional Driver(s)</span><b class="amt">${esc(deal.testDrive.addlDriver || "None")}</b></li>
      <li><span>Insurance Company</span><b class="amt">${esc(deal.testDrive.insurance || "—")}</b></li>
      <li><span>Authorized Mileage</span><b class="amt">${deal.testDrive.miles || 20} miles</b></li>
      ${deal.testDrive.done ? `<li><span>Completed — odometer</span><b class="amt">${(deal.testDrive.completedMiles || 0).toLocaleString()} mi</b></li>` : ""}
    </ul>
    <h3 class="pd-h3">Terms &amp; conditions</h3>
    <ol class="pd-terms">${RIDE_PRICE_DATA.testDriveTerms.map(t => `<li>${esc(t)}</li>`).join("")}</ol>
    ${sig(deal.testDrive.signed ? (deal.testDrive.sigName || c.first + " " + c.last) : "", "Customer")}
    ${sig(Store.s.advisor, "Client Advisor — " + ds.name)}`, "testdrive");

  docs.delivery = () => {
    const groups = {};
    RIDE_PRICE_DATA.dealForms.forEach(f => { (groups[f.group] = groups[f.group] || []).push(f); });
    return shell("Delivery Checklist", Object.entries(groups).map(([g, forms]) => `
      <h3 class="pd-h3">${esc(g)}</h3>
      <ul class="pd-checks">${forms.map(f => `<li><i>${deal.forms.selected.includes(f.id) ? "✓" : ""}</i>${esc(f.label)}</li>`).join("")}</ul>`).join("") +
      `${sig("", "Client Advisor")}${sig("", "Delivery Coordinator")}`, "delivery");
  };

  docs.rebates = () => shell("Applied Rebates", `
    <ul class="lines">
      <li><span>Manufacturer / dealer rebates applied to this transaction</span><b class="amt">${money(deal.trade.rebates || 0)}</b></li>
      ${snap && !isCash && !isLease ? `<li><span>Reflected in total amount financed</span><b class="amt">${money(snap.amountFinanced)}</b></li>` : ""}
    </ul>
    <p class="pd-note">Rebate eligibility was reviewed and confirmed with the client during the base payment presentation. The amount above has been applied to the deal structure and is reflected in the agreed figures.</p>
    <ul class="pd-checks">
      <li><i></i>Eligibility requirements reviewed with client</li>
      <li><i></i>Rebate amount disclosed in base payment presentation</li>
      <li><i></i>Supporting documentation collected (if required)</li>
    </ul>
    ${sig(deal.basePayment && deal.basePayment.sigName, "Customer")}
    ${sig(Store.s.advisor, "Client Advisor — " + ds.name)}`, "rebates");

  docs.quote = () => {
    const q = (deal.quotes || [])[(deal.quotes || []).length - 1];
    if (!q) return shell("Saved Quote", `<p class="pd-note">No saved quotes on this deal yet.</p>`, "quote");
    const qv = Store.vehicle(q.stock) || v;
    return shell("Saved Quote", `
      <ul class="lines">
        <li><span>Vehicle</span><b class="amt">${qv.year} ${esc(qv.make)} ${esc(qv.model)} · Stock ${q.stock}</b></li>
        <li><span>Deal Type</span><b class="amt">${DEAL_TYPES[q.dealType]}</b></li>
        <li class="total"><span>${q.dealType === "cash" ? "Estimated Total Due" : q.dealType === "onepay" ? "Estimated One-Pay Total" : "Estimated Monthly Payment"}</span><b class="amt">${money(q.summary)}</b></li>
      </ul>
      <p class="pd-note">Quick quote saved ${new Date(q.at).toLocaleString()} and emailed to ${esc(c.email)}. Quotes are for follow-up only — there is no option to purchase from a quote, and figures are estimates subject to credit approval.</p>`, "quote");
  };

  /* The MV-82 recreation (owner, 2026-08-20): the real form's field
     inventory rendered from the shared docData() layer. A box the deal
     cannot fill prints EMPTY for hand completion — the form never invents
     a value; that is the whole point of the layer's honesty contract.
     The GOV_FORMS training-sample treatment applies through shell(). */
  docs.mv82 = () => {
    const D = docData(deal);
    const f = (label, value, cls) => `<div class="mv-f${cls ? " " + cls : ""}"><span>${label}</span><b>${value == null || value === "" ? "&nbsp;" : esc(String(value))}</b></div>`;
    const ck = (on, label) => `<span class="mv-ck"><i>${on ? "✕" : ""}</i>${esc(label)}</span>`;
    const personRow = (p2, blankAll) => `
      ${f("NAME (LAST, FIRST, MIDDLE)", blankAll ? null : p2 && p2.name && p2.name.toUpperCase(), "mv-w3")}
      ${f("DATE OF BIRTH", blankAll ? null : p2 && dateUS(p2.dob || ""))}
      ${f("SEX", null)}
      ${f("DRIVER LICENSE ID", blankAll ? null : p2 && p2.license)}
      ${f("LICENSE EXPIRES", blankAll ? null : p2 && dateUS(p2.licenseExpires || ""))}
      ${f("TELEPHONE", blankAll ? null : p2 && p2.phone)}
      ${f("MOBILE PHONE", null)}
      ${f("EMAIL", blankAll ? null : p2 && p2.email, "mv-w3")}`;
    return shell("Registration & Title Application", `
      <p class="mv-note">Recreates the New York vehicle registration / title application for
      training. A box the portal cannot fill from the deal is printed empty for hand
      completion — the app never invents a value.</p>

      <div class="mv-sec">
        <h4>1 · Registrant</h4>
        <div class="mv-grid">${personRow(D.customer, false)}</div>
        <div class="mv-cks"><b>REGISTRANT IS</b>
          ${ck(true, "Individual")}${ck(false, "Business / Company")}
          <b class="mv-gap">CHANGES</b>
          ${ck(false, "Name change")}${ck(false, "Address change")}${ck(false, "No CID")}
        </div>
      </div>

      <div class="mv-sec">
        <h4>2 · Address</h4>
        <div class="mv-grid">
          ${f("STREET ADDRESS", D.address.street, "mv-w3")}
          ${f("APT NO.", D.address.apt)}
          ${f("CITY", D.address.city)}
          ${f("STATE", D.address.state)}
          ${f("ZIP", D.address.zip)}
          ${f("COUNTY", D.address.county)}
        </div>
      </div>

      <div class="mv-sec">
        <h4>3 · Co-Registrant${D.coRegistrant ? "" : " — none on this deal"}</h4>
        <div class="mv-grid">${personRow(D.coRegistrant, !D.coRegistrant)}</div>
      </div>

      <div class="mv-sec">
        <h4>4 · Vehicle</h4>
        <div class="mv-grid">
          ${f("YEAR", D.vehicle && D.vehicle.year)}
          ${f("MAKE", D.vehicle && D.vehicle.make && D.vehicle.make.toUpperCase())}
          ${f("MODEL", D.vehicle && D.vehicle.model, "mv-w2")}
          ${f("BODY TYPE", D.vehicle && D.vehicle.bodyCode)}
          ${f("COLOR", D.vehicle && D.vehicle.colorCode)}
          ${f("ODOMETER (MI)", D.vehicle && D.vehicle.odometer)}
          ${f("MILEAGE BRAND", D.vehicle && D.vehicle.mileageBrand)}
          ${f("VEHICLE IDENTIFICATION NUMBER", D.vehicle && D.vehicle.vin, "mv-w3")}
          ${f("UNLADEN WEIGHT", D.vehicle && D.vehicle.weight)}
          ${f("SEATS", D.vehicle && D.vehicle.seats)}
          ${f("FUEL", D.vehicle && D.vehicle.fuel)}
          ${f("CYLINDERS", D.vehicle && D.vehicle.cyl)}
          ${f("OFFICE USE ONLY", null)}
        </div>
      </div>

      <div class="mv-sec">
        <h4>5 · Lienholder</h4>
        <div class="mv-grid">
          ${f("LIENHOLDER NAME — IF NONE, WRITE “NONE”", D.lienholder.none ? "NONE" : D.lienholder.name, "mv-w3")}
          ${f("LIEN FILING CODE", null)}
          ${f("LIENHOLDER MAILING ADDRESS", null, "mv-w4")}
        </div>
      </div>

      <div class="mv-sec">
        <h4>6 · Dealer / Plates</h4>
        <div class="mv-grid">
          ${f("SELLING DEALER", D.dealerPlate.dealer, "mv-w2")}
          ${f("DEALER ADDRESS", D.dealerPlate.dealerAddress, "mv-w2")}
          ${f("STOCK NO.", D.dealerPlate.stock)}
          ${f("DEAL NO.", D.dealerPlate.dealNo)}
          ${f("PLATE NUMBER (IF TRANSFER)", null, "mv-w2")}
        </div>
        <div class="mv-cks"><b>PLATES</b>
          ${ck(false, "New plates")}${ck(false, "Transfer plates")}
          <span class="mv-hint">— the Transfer Plates Registration is its own document</span>
        </div>
      </div>

      ${sig("", "Registrant")}`, "form-reg");
  };

  docs.generic = (formId) => {
    if (formId === "reg") return docs.mv82();
    const f = RIDE_PRICE_DATA.dealForms.find(x => x.id === formId) || { label: formId, group: "Deal Forms" };
    return shell(esc(f.label), `
      <p class="pd-note">This ${esc(f.group.toLowerCase().replace(/s$/, ""))} is part of the deal packet for the transaction referenced above.
      The undersigned acknowledges the ${esc(f.label)} has been reviewed, completed, and accepted as part of this transaction.</p>
      <ul class="pd-checks">
        <li><i></i>Reviewed with the client</li>
        <li><i></i>All required fields completed</li>
        <li><i></i>Copy provided to the client</li>
      </ul>
      ${sig("", "Customer")}
      ${sig("", "Client Advisor — " + ds.name)}`, "form-" + formId);
  };

  return docs;
}

/* ============================================================
   VIEW: Documents (Print Center V2) — owner's replication package,
   2026-08-30. A print centre is a document utility, not a dashboard.

   The old screen gave every printable a standalone card with its own
   "Preview & print →" link and a "Ready" badge, which made nine documents
   read as nine decisions. The package's shape is a compact grouped list:
   one dominant packet action, two groups, and rows that are themselves the
   tap target. Status appears only where a document is NOT ready — repeating
   "Ready" nine times says nothing.

   Locked by the package: the Documents → Preview → Print/PDF architecture,
   the two groups, fully tappable rows, the single packet action, sparse
   preview chrome, the right-aligned repayment price column, and the MV-82
   training-sample treatment. Colour is the editable variable.

   Two standing owner overrides applied over the golden, as on every package:
   the signature gradient on the dominant action where the golden draws flat
   black, and line icons rather than the golden's emoji.
   ============================================================ */
/* ONE list of what this deal's packet contains, used by the Documents index,
   by the "Print full packet · N docs" count, and by the packet itself.

   These were three separate expressions and they disagreed: the index listed
   a Saved Quote the packet never printed, and it counted a completed test
   drive that the packet skipped unless it was *signed*. So the button
   promised more documents than came out of the printer. A label and a list
   describing the same set get computed once (review lesson 7).

   A row's status is an EXCEPTION or nothing, per the package: `note` is the
   quiet metadata line, `flag` is the rare pill. */
function printCentreDocs(deal) {
  const signedBase = !!(deal.basePayment && deal.basePayment.signedAt);
  const drove = !!(deal.testDrive.done || deal.testDrive.signed);
  const core = [
    { key: "cover", icon: "folder", label: "Deal Cover Sheet", note: "Deal packet" },
    { key: "agreement", icon: "check", label: "Base Payment Agreement",
      note: signedBase ? "Signed" : "", flag: signedBase ? null : "Unsigned" },
    { key: "repayment", icon: "page", label: "Repayment Options",
      note: deal.menu.selectedProgram ? "Signed · package decision" : "",
      flag: deal.menu.selectedProgram ? null : "No package chosen" },
    { key: "testdrive", icon: "car", label: "Test Drive Agreement",
      note: deal.testDrive.done ? "Completed" : deal.testDrive.signed ? "Signed" : "",
      flag: drove ? null : "Not started" },
    { key: "delivery", icon: "box", label: "Delivery Checklist",
      note: `${deal.forms.selected.length} form${deal.forms.selected.length === 1 ? "" : "s"} selected` }
  ];
  if (deal.trade.rebates > 0) core.push({ key: "rebates", icon: "dollar", label: "Applied Rebates", note: `${money(deal.trade.rebates)} applied` });
  if (deal.quotes && deal.quotes.length) core.push({ key: "quote", icon: "sparkle", label: "Saved Quote", note: `${deal.quotes.length} saved` });
  const selected = deal.forms.selected.map(fid => RIDE_PRICE_DATA.dealForms.find(f => f.id === fid)).filter(Boolean);
  return { core, selected };
}

route("forms/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const c = Store.customer(deal.customerId);
  /* A truthy stock number is not a resolved vehicle — a blob saved against
     inventory that no longer carries that stock leaves Store.vehicle()
     undefined, and every printable here is built from the vehicle. Offering
     the rows anyway sent the reader to a blank preview with no way back.
     Send them where the deal can actually be repaired instead. */
  const v = deal.stock ? Store.vehicle(deal.stock) : null;
  /* the printables price against the catalog unit, so a deal with none is
     sent to choose one — unless it is COMPLETE. Its vehicle is the snapshot on
     the record and cannot be priced again, and "choose a vehicle" would offer
     to hang a catalog unit on a funded contract. That deal's record is its
     jacket, which needs only the deal. */
  if (!v) return redirect(deal.stage === "complete" ? `#/jacket/${deal.id}` : `#/vehicles/${deal.id}`);
  const jkc = jacketCounts(deal);

  const { core, selected } = printCentreDocs(deal);
  const total = core.length + selected.length;

  const row = (href, icon, title, note, flag) => `
    <a class="pc-row" href="${href}">
      <span class="pc-icon">${rpIcon(icon)}</span>
      <span class="pc-rowmain">
        <span class="pc-rowtitle">${esc(title)}</span>
        ${note ? `<span class="pc-rowmeta">${esc(note)}</span>` : ""}
      </span>
      <span class="pc-rowright">
        ${flag ? `<span class="pc-flag">${esc(flag)}</span>` : ""}
        <span class="pc-chev" aria-hidden="true">›</span>
      </span>
    </a>`;

  /* The package forbids a role switch on the print screens, and deskTop()
     carries one. This bar is the wordmark alone, as the golden draws it. */
  const pcTop = () => `<div class="m-topbar"><div class="m-dealrow">
    <div class="m-wordmark"><span class="rideprice">Ride</span><span class="price">PRICE</span></div>
  </div></div>`;

  renderChrome("Documents", dealTitle(deal), "");
  document.body.dataset.canvas = "master";
  document.body.dataset.screen = "printcentre";

  view().innerHTML = `
    <div class="m-app">
      ${pcTop()}
      <main class="pc-main">
        <div class="pc-eyebrow">${deal.forms.finalized ? "Finance complete" : "Deal in progress"}</div>
        <h1 class="pc-title">Documents</h1>
        <div class="pc-meta">
          <div class="pc-metaline"><strong>${esc(c.first + " " + c.last)}</strong>${v ? " · " + esc(v.year + " " + v.make + " " + v.model) : ""}</div>
          <div class="pc-metaline">${deal.dealNo ? "Deal #" + esc(deal.dealNo) + " · " : ""}Jacket ${esc(jacketChipText(deal))}</div>
        </div>
        <button type="button" class="pc-hero" id="pcPacket">Print full packet · ${total} doc${total === 1 ? "" : "s"}</button>

        <div class="pc-sechead"><h2>Deal packet</h2><span class="pc-count">· ${core.length}</span></div>
        <div class="pc-group">
          ${core.map(d => row(`#/print/${esc(deal.id)}/${esc(d.key)}`, d.icon, d.label, d.note, d.flag)).join("")}
        </div>

        <div class="pc-sechead"><h2>Additional forms</h2><span class="pc-count">· ${selected.length}</span></div>
        ${selected.length
          ? `<div class="pc-group">${selected.map(f => row(`#/print/${esc(deal.id)}/form-${esc(f.id)}`, "page", f.label, f.group)).join("")}</div>`
          : `<div class="pc-empty">No forms selected yet — choose them on the finance menu&rsquo;s <a href="#/menu/${esc(deal.id)}">Forms</a> stage.</div>`}
      </main>
    </div>
    <div class="m-scrim" id="pcScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="pcSheet"></div></div>`;

  /* one sheet, one listener, torn down with the route */
  let sheetKey = null;
  const closeSheet = () => {
    const sc = $("#pcScrim"); if (sc) sc.classList.remove("show");
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
  };
  const teardown = () => { closeSheet(); window.removeEventListener("hashchange", teardown); };
  window.addEventListener("hashchange", teardown);

  $("#pcPacket").onclick = () => {
    const sh = $("#pcSheet");
    sh.innerHTML = `<div class="m-handle"></div>
      <div class="m-sheettop"><div><h2>Print full packet</h2>
        <p class="m-sheetsub">${total} document${total === 1 ? "" : "s"} · page breaks included</p></div>
        <button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>
      <div class="pc-actions">
        <a class="pc-btn pc-btn--primary" href="#/print/${esc(deal.id)}/packet">Open the packet</a>
        <button type="button" class="pc-btn" data-sheet-close>Cancel</button>
      </div>`;
    $("#pcScrim").classList.add("show");
    if (sheetKey) document.removeEventListener("keydown", sheetKey, true);
    sheetKey = (e) => { if (e.key === "Escape") { e.preventDefault(); closeSheet(); } };
    document.addEventListener("keydown", sheetKey, true);
    $$("[data-sheet-close]", sh).forEach(b => b.onclick = closeSheet);
  };
  const scrim = $("#pcScrim");
  if (scrim) scrim.onclick = (e) => { if (e.target === scrim) closeSheet(); };
});

/* ---------- Print Preview: the paper is the primary object ----------
   One compact toolbar, one Print / PDF action, and nothing else. No role
   switch, no Buyer/Jacket chips, no second dock repeating the same action
   at the bottom — all four are named acceptance failures in the package. */
route("print/:id/:doc", ({ id, doc }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  /* the same guard as Documents: printDocs() builds every document from the
     vehicle, so a stock number that no longer resolves rendered a blank view */
  /* the printables price against the catalog unit. A deal that has none — or
     whose unit has left the catalog — is sent to choose one, UNLESS it is
     complete: its vehicle is the snapshot on the record, nothing can be priced
     again, and "choose a vehicle" would offer to rewrite a funded contract.
     Same rule as the Print Center's guard; the jacket is that deal's record. */
  if (!deal.stock || !Store.vehicle(deal.stock)) return redirect(deal.stage === "complete" ? `#/jacket/${deal.id}` : `#/vehicles/${deal.id}`);
  const docs = printDocs(deal);

  let html = "";
  if (doc === "packet") {
    /* exactly the documents the index lists and the button counts — see
       printCentreDocs(). Building this set a second time is what let the
       count and the packet drift apart. */
    const { core, selected } = printCentreDocs(deal);
    html = [...core.map(d => docs[d.key]()), ...selected.map(f => docs.generic(f.id))].join("");
  } else if (doc.startsWith("form-")) {
    /* `form-` is a prefix, not a guarantee. docs.generic() falls back to the
       raw key as the document's title, so an unknown suffix rendered a
       printable headed "not-a-real-form" — a document describing something
       that does not exist. Validate against the catalog and redirect. */
    const fid = doc.slice(5);
    if (!RIDE_PRICE_DATA.dealForms.some(f => f.id === fid)) return redirect(`#/forms/${deal.id}`);
    html = docs.generic(fid);
  } else if (docs[doc]) {
    html = docs[doc]();
  } else {
    return redirect(`#/forms/${deal.id}`);
  }

  renderChrome("Print Preview", dealTitle(deal), "");
  document.body.dataset.canvas = "master";
  document.body.dataset.screen = "printpreview";

  view().innerHTML = `
    <div class="m-app">
      <div class="pc-toolbar">
        <a class="pc-back" href="#/forms/${esc(deal.id)}">← Documents</a>
        <span class="pc-toolspacer"></span>
        <button type="button" class="pc-print" id="printNow">Print / PDF</button>
      </div>
      <div class="pc-paperwrap"><div class="print-area">${html}</div></div>
    </div>`;
  $("#printNow").onclick = () => window.print();
});

/* ---------------- boot ---------------- */
Store.load();
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
  /* the logo hard-refreshes the floor queue: search and pipeline filter
     cleared, list re-pulled (owner spec, 2026-08-20) */
  $("#brandHome").onclick = () => { dealsUI.q = ""; dealsUI.pipe = "all"; dealsUI.arch = false; navigate("#/deals"); router(); };
  $$("[data-nav]").forEach(a => a.onclick = (e) => { e.preventDefault(); navigate(a.dataset.nav); });

  /* hamburger navigation drawer */
  const drawer = $("#drawer"), overlay = $("#drawerOverlay"), burger = $("#hamburgerBtn");
  function setDrawer(open) {
    drawer.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
  }
  burger.onclick = () => setDrawer(!drawer.classList.contains("open"));
  overlay.onclick = () => setDrawer(false);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setDrawer(false); });
  $$("[data-drawer-link]").forEach(a => a.addEventListener("click", () => setDrawer(false)));
  $("#drawerReset").onclick = () => {
    confirmModal("Reset demo data", "Reset all portal data back to the demo seed? Every deal and customer you created will be gone.", "Reset demo data", () => {
      Store.reset(); setDrawer(false); navigate("#/deals"); router(); toast("Demo data reset");
    });
  };
  function syncDrawer() {
    $("#drawerStore").textContent = RIDE_PRICE_DATA.dealership.name;
    $("#drawerUser").textContent = Store.s.advisor + " · Client Advisor";
    const h = location.hash || "#/deals";
    $$(".drawer__nav a").forEach(a => a.classList.toggle("active",
      a.getAttribute("href") === h && !a.classList.contains("drawer__cta")));
  }
  window.addEventListener("hashchange", syncDrawer);
  syncDrawer();

  /* date mask: digits type as MM/DD/YYYY on every data-date field */
  document.addEventListener("input", (e) => {
    const el = e.target.closest("[data-date]");
    if (!el) return;
    const dg = el.value.replace(/\D/g, "").slice(0, 8);
    el.value = dg.length > 4 ? dg.slice(0, 2) + "/" + dg.slice(2, 4) + "/" + dg.slice(4)
      : dg.length > 2 ? dg.slice(0, 2) + "/" + dg.slice(2) : dg;
  });

  /* branded controls: enhance after every render, close open dropdowns on
     outside taps. The observer covers views that re-render themselves. */
  new MutationObserver(enhanceControls).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("click", (e) => {
    $$(".dd.open").forEach(d => {
      if (!d.contains(e.target)) {
        d.classList.remove("open");
        d.querySelector(".dd__btn").setAttribute("aria-expanded", "false");
      }
    });
  });

  router();
  enhanceControls();
});

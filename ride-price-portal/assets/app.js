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
      deals: [seedDeal()],
      advisor: RIDE_PRICE_DATA.dealership.advisor,
      role: "advisor"
    };
  }

  /* the friendly number on the folder tab; ids stay the routing key */
  function mintDealNo() {
    let n;
    do { n = 10000 + Math.floor(Math.random() * 90000); }
    while (state && state.deals.some(d => d.dealNo === n));
    return n;
  }

  function seedDeal() {
    return {
      id: "d-demo1", dealNo: 48201, customerId: "c-demo1", stock: "7H21313", dealType: "finance",
      stage: "desking", createdAt: "2026-07-14T17:20:00Z",
      discovery: { answers: { week: "Daily commute to Midtown, weekend trips upstate.", family: "Two kids, one dog." }, done: true },
      testDrive: { done: true, completedMiles: 12 },
      trade: { has: true, desc: "2018 Hyundai Tucson", vin: "KM8TRAININGSAMP06", miles: 61200, condition: "Good", value: 15500, payoff: 10750, rebates: 500, applyTaxCredit: true },
      huddle: { done: false },
      desk: { term: 60, apr: 3.5, downPayment: 1000, leaseTerm: 36, milesPerYear: 12000, leaseFactor: 0.00117, dueAtSigning: 1000, accessories: ["mats", "tint"], daysToFirst: 45 },
      basePayment: null, creditApp: null,
      menu: { step: 1, barsDone: [], custom: [], customSource: null, selectedProgram: null, initials: "", ackSigned: false },
      forms: { selected: [], finalized: false },
      /* the demo deal is found mid-jacket — see RIDE_PRICE_DATA.seedJacket */
      jacket: { docs: seedJacketDocs(), extra: [], req: {} }
    };
  }

  /* stamped this morning so the records read like today's work, and recorded
     by hand — nothing in the seed was ever scanned or machine-checked */
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
    if (demo && !demo.jacket) { demo.jacket = { docs: seedJacketDocs(), extra: [], req: {} }; minted = true; }
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
    /* deals gained a vehicle-identity snapshot (vin + stock) on 2026-08-23 so
       the advisor queue shows the VIN even when the unit is not stocked in or
       the catalog entry later changes (owner requirement: universal VIN
       visibility once a vehicle reaches desking). Saved deals whose stock
       still resolves are stamped once; a deal whose stock no longer resolves
       keeps what it has — the app never invents a value. */
    state.deals.forEach(d => {
      if (!d.vehicle && d.stock) {
        const v = RIDE_PRICE_DATA.inventory.find(x => x.stock === d.stock);
        if (v) { d.vehicle = { vin: v.vin, stock: v.stock }; minted = true; }
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
  /* a footer pinned to the bottom of a phone is where the user just tapped —
     a toast there would cover the button. Measured, not assumed: a
     footer-less dialog, or one sitting short of the bottom, keeps the default.
     The customer's upload page has a sticky action bar of its own and needs
     the same lift (owner prototype, 2026-08-26), so both are considered and
     the lowest one wins. */
  /* measured AFTER the paint that follows this call: many callers toast and
     then render the screen the toast belongs to, so measuring now would read
     the outgoing screen — which is how a toast ended up underneath the
     desking payment bar it was supposed to sit above. */
  const place = () => {
    const foot = $("#modalBack .modal__foot") || $(".dr-clientbottom") || $(".desk-sticky");
    const fr = foot && foot.getBoundingClientRect();
    t.style.bottom = fr && fr.bottom > window.innerHeight - 80 ? Math.round(window.innerHeight - fr.top + 12) + "px" : "";
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
  complete: { label: "Complete", badge: "badge--done", route: (d) => `#/menu/${d.id}` }
};

/* output flows into innerHTML (renderChrome crumbs) — escape here, at the source */
function dealTitle(deal, bare) {
  const c = Store.customer(deal.customerId);
  const cb = deal.coBuyerId ? Store.customer(deal.coBuyerId) : null; /* missing record = no co-buyer */
  const v = Store.vehicle(deal.stock);
  const names = `${c ? esc(c.first + " " + c.last) : "—"}${cb ? " + " + esc(cb.first + " " + cb.last) : ""}`;
  const jkc = jacketCounts(deal);
  const line = `${deal.dealNo ? `<b class="crumb-no">Deal #${esc(deal.dealNo)}</b> · ` : ""}${names} · ${v ? esc(v.year + " " + v.make + " " + v.model) : "no vehicle yet"}`;
  if (bare) return line; /* the desking screens repeat these chips in flow */
  return line +
    `
    <button class="crumb-btn" data-buyers="${esc(deal.id)}" title="Buyers on this deal">${cb ? "👥 Buyers" : "👤 Buyer"}</button>
    <a class="crumb-btn" href="#/jacket/${esc(deal.id)}" title="Documents this deal needs" aria-label="Deal jacket${jkc.missing ? ` — ${jkc.missing} document(s) still outstanding` : ""}">📁 Jacket${jkc.missing ? `<b class="crumb-btn__n">${jkc.missing}</b>` : ""}</a>`;
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
      sheet.innerHTML = `<div class="m-handle"></div>
        <div class="by2-head"><h2>Remove ${esc(cb.first)} from this deal?</h2></div>
        <p class="by2-sub">Second tap confirms</p>
        <div class="by2-confirmcard"><strong>The relationship comes off the deal.</strong>
          <p>${esc(cb.first + " " + cb.last)}'s customer profile is kept — nothing about the person is deleted.</p></div>
        <div class="by2-confirmrow">
          <button type="button" class="by2-actionbtn" id="byCancel">Cancel</button>
          <button type="button" class="by2-actionbtn by2-actionbtn--danger" id="byRemoveGo">Remove from deal</button>
        </div>`;
      $("#byCancel", sheet).onclick = () => render("actions");
      $("#byRemoveGo", sheet).onclick = () => {
        delete deal.coBuyerId; Store.save();
        toast("Co-buyer removed — their customer record is kept");
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
function redirect(hash) { location.replace(hash); }

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
    if (ok) { r.fn(params); window.scrollTo(0, 0); return; }
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
    case "testdrive": return "Test Drive In Progress";
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
  const showroom = mine.filter(d => SHOWROOM_STAGES.indexOf(d.stage) >= 0).sort(bySeen);
  const act = mine.filter(d => SHOWROOM_STAGES.indexOf(d.stage) < 0 && d.stage !== "complete").sort(bySeen);
  const funded = mine.filter(d => d.stage === "complete").sort(bySeen);

  renderChrome(lead ? "Active Floor" : "My Deals", "", "");
  document.body.dataset.screen = "deals";
  document.body.dataset.canvas = "master";

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
    const snap = d.vehicle && (d.stock ? d.vehicle.stock === d.stock : true) ? d.vehicle : null;
    return {
      v,
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
  const fundedInRange = () => {
    const w = rangeWin();
    return funded.filter(d => { const at = new Date(d.createdAt || 0); return (!w.from || at >= w.from) && (!w.to || at < w.to); });
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
    const c = Store.customer(d.customerId), v = Store.vehicle(d.stock);
    const hay = [
      c ? c.first + " " + c.last : "", c && c.phone ? c.phone : "",
      v ? v.year + " " + v.make + " " + v.model : "", v ? v.stock : "", v && v.vin ? v.vin : "",
      d.vehicle ? (d.vehicle.vin || "") + " " + (d.vehicle.stock || "") : "",
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
    const { v, vin, stock } = vehicleIds(d);
    const ids = vin || stock
      ? `<span class="dq-ids"><span>VIN ${vin ? `<b>${esc(vin)}</b>` : "Pending"}</span><span>STK ${stock ? `<b>${esc(stock)}</b>` : "Pending stock-in"}</span></span>`
      : "";
    return `<a class="dq-row" href="${esc(st.route(d))}" aria-label="Open ${esc(name)}'s deal">
      <span class="dq-name">${esc(name)}</span>
      <span class="dq-stage dq-stage--${esc(b.id)}">${esc(b.chip)}</span>
      ${v ? `<span class="dq-veh">${esc(v.year + " " + v.make + " " + v.model)}</span>` : ""}
      ${ids}
      ${next && b.id !== "done" ? `<span class="dq-next">Next: ${esc(dealNextAction(d))} →</span>` : ""}
      <span class="dq-chev" aria-hidden="true">›</span>
    </a>`;
  }

  /* showroom visit row — never a vehicle placeholder (owner rule 2026-08-23,
     reasserted on the v3 reference 2026-08-28): the meta is the vehicle when
     one is chosen and the arrival time, nothing else */
  function visitRow(d) {
    const c = Store.customer(d.customerId);
    const st = STAGES[d.stage] || STAGES.discovery;
    const { v } = vehicleIds(d);
    const arrived = d.createdAt ? new Date(d.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
    const meta = [v ? v.year + " " + v.make + " " + v.model : null, arrived ? "arrived " + arrived : null].filter(Boolean).join(" · ");
    return `<a class="dq-visit" href="${esc(st.route(d))}" aria-label="Open ${esc(c ? c.first + " " + c.last : "visit")}">
      <span class="dq-name dq-name--visit">${esc(c ? c.first + " " + c.last : "—")}</span>
      <span class="dq-visitmeta">${esc(meta)}</span>
      <span class="dq-showroompill">IN SHOWROOM</span>
    </a>`;
  }

  function showroomHtml(rows) {
    return `<div class="dq-showroom"><div class="dq-subhead"><b>In showroom · ${rows.length}</b><span>Active visits</span></div>
      ${rows.length ? `<div class="dq-list">${rows.map(visitRow).join("")}</div>` : `<p class="dq-empty">No showroom visits${dealsUI.q.trim() ? " match this search" : ""}.</p>`}</div>`;
  }

  view().innerHTML = `
  <div class="dq-app">
    <div class="dq-topbar">
      <div class="m-wordmark"><span class="rideprice">Ride</span><span class="price">PRICE</span></div>
      <div class="dq-topside"><span class="chip--demo">DEMO</span>
        <button type="button" class="m-rolebtn" id="dqRole">${lead ? "Team Lead" : "Advisor"} ▾</button></div>
    </div>
    <div class="dq-content">
      <div class="dq-titlerow">
        <div><div class="ca-eyebrow" style="margin-bottom:5px">${lead ? "Floor overview" : "Sales floor"}</div>
          <h1 class="dq-title">${lead ? "Active floor" : "My deals"}</h1>
          <div class="dq-count" id="dqCount"></div></div>
        <a class="dq-newvisit" href="#/customers">New visit</a>
      </div>
      <div class="dq-searchwrap">
        <label class="dq-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="dealSearch" placeholder="Search customer, VIN, or stock" aria-label="Search deals" value="${esc(dealsUI.q)}"></label>
        <button type="button" class="dq-scanbtn" id="dealScanBtn" aria-label="Scan a driver's license to start a visit">${rpIcon("idcard")}</button>
      </div>
      ${lead ? `<div class="dq-managermeta">
        <div class="dq-datesummary" id="dqDateSummary"></div>
        <button type="button" class="dq-datebtn" id="dqDateBtn"><span id="dqDateLabel"></span> ▾</button>
      </div>` : ""}
      <div id="dqShowroom"></div>
      ${lead ? `<div class="dq-sectionlabel">Deals</div>
      <div class="dq-seg" role="group" aria-label="Filter deals by stage">
        <button type="button" class="dq-chipbtn" data-pipe="all">All ${counts.all}</button>
        <button type="button" class="dq-chipbtn" data-pipe="desking"><i class="dq-dot dq-dot--amber"></i>Desking ${counts.desking}</button>
        <button type="button" class="dq-chipbtn" data-pipe="fni"><i class="dq-dot dq-dot--blue"></i>F&amp;I ${counts.fni}</button>
      </div>` : `<div class="dq-sectionlabel" id="dqSectionLabel">In progress</div>`}
      <div id="dealList"></div>
      <div id="dqFunded"></div>
    </div>
    <nav class="dq-nav" aria-label="Primary">
      <span class="dq-navbtn active" aria-current="page">${rpIcon("page")}<span>Deals</span></span>
      <a class="dq-navbtn" href="#/vehicles/browse">${rpIcon("car")}<span>Inventory</span></a>
      <a class="dq-navbtn" href="#/customers">${rpIcon("user")}<span>Customers</span></a>
      <button type="button" class="dq-navbtn" id="dqMore">${rpIcon("dots")}<span>More</span></button>
    </nav>
  </div>
  <div class="m-scrim" id="dqScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="dqSheet"></div></div>`;

  const openSheet5 = (html, onMount) => { $("#dqSheet").innerHTML = `<div class="m-handle"></div>${html}`; $("#dqScrim").classList.add("show"); if (onMount) onMount($("#dqSheet")); };
  const closeSheet5 = () => $("#dqScrim").classList.remove("show");
  $("#dqScrim").onclick = (e) => { if (e.target === $("#dqScrim") || e.target.closest("[data-sheet-close]")) closeSheet5(); };

  function paint() {
    if (!lead) dealsUI.pipe = "all";
    const q = dealsUI.q.trim();
    const showRows = showroom.filter(matches);
    const searching = !!q;
    /* the showroom section renders for BOTH roles — an advisor's own visit
       must stay reachable even though it is no longer a deal stage */
    $("#dqShowroom").innerHTML = (showroom.length || lead) ? showroomHtml(showRows) : "";
    if (lead) {
      $$(".dq-chipbtn").forEach(p => {
        const on = p.dataset.pipe === dealsUI.pipe;
        p.classList.toggle("active", on);
        p.setAttribute("aria-pressed", String(on));
      });
      const w = rangeWin();
      $("#dqDateLabel").textContent = w.label;
      $("#dqDateSummary").textContent = `${w.label} · ${dealsUI.funded ? "active + funded" : "active floor"}`;
      $("#dqCount").textContent = `${showroom.length} in showroom · ${act.length} active deal${act.length === 1 ? "" : "s"}`;
      const pool = act.filter(d => dealsUI.pipe === "all" || dealPipe(d) === dealsUI.pipe);
      const rows = pool.filter(matches);
      $("#dealList").innerHTML = rows.length
        ? `<div class="dq-list">${rows.map(d => dealRow(d, { next: false })).join("")}</div>`
        : `<div class="dq-empty dq-empty--box"><h3>${pool.length ? "No deals match that search" : "No deals in this stage"}</h3><p>${pool.length ? "Try another customer name, VIN, or stock number." : "Choose another stage or start a new customer visit."}</p></div>`;
      const hist = fundedInRange().filter(matches);
      $("#dqFunded").innerHTML = dealsUI.funded
        ? `<div class="dq-subhead" style="margin-top:26px"><b>Funded · ${hist.length}</b><span>${esc(w.label)}</span></div>
           ${hist.length ? `<div class="dq-list">${hist.map(d => dealRow(d, { next: false })).join("")}</div>` : `<p class="dq-empty">No funded contracts in this range.</p>`}`
        : "";
    } else {
      const active = act.filter(matches);
      const done = funded.filter(matches);
      $("#dqCount").textContent = `${act.length} active`;
      $("#dqSectionLabel").textContent = active.length ? "In progress" : "Completed";
      let html = active.length ? `<div class="dq-list">${active.map(d => dealRow(d)).join("")}</div>` : "";
      if (!active.length && !done.length && !showRows.length) {
        html = searching
          ? `<div class="dq-empty dq-empty--box"><h3>No deals found</h3><p>Try another customer name, VIN, or stock number.</p><p class="dq-empty--act"><button type="button" class="sc2-textbtn" id="dealShowAll">Clear search</button></p></div>`
          : `<div class="dq-empty dq-empty--box"><h3>No active deals</h3><p>Start a new customer visit to begin.</p></div>`;
      }
      $("#dealList").innerHTML = html;
      $("#dqFunded").innerHTML = done.length
        ? `<div class="dq-sectionlabel" style="margin-top:28px">Completed</div><div class="dq-list">${done.map(d => dealRow(d, { next: false })).join("")}</div>`
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

  /* role sheet (v3): the switch lives on the queue's own chrome */
  $("#dqRole").onclick = () => {
    const opt = (key, title, sub, on) => `<button type="button" class="dq-roleopt${on ? " active" : ""}" data-role="${key}"><span><b>${title}</b><small>${sub}</small></span>${on ? `<span class="dq-check">✓</span>` : ""}</button>`;
    openSheet5(`<div class="m-sheettop"><div class="m-sheettitle">Switch demo role</div><button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>
      <p class="ob-sheetdesc">This demo has no sign-in. Choose the floor view you want to preview.</p>
      ${opt("advisor", "Advisor", "Guided queue with the next action on each deal", !lead)}
      ${opt("teamlead", "Team Lead", "Compact active pipeline, showroom visits, and date-based history", lead)}`, (sheet) => {
      $$("[data-role]", sheet).forEach(b => b.onclick = () => {
        Store.s.role = b.dataset.role === "teamlead" ? "teamlead" : "advisor";
        dealsUI.pipe = "all"; Store.save();
        closeSheet5();
        toast("Now acting as " + (isTeamLead() ? RIDE_PRICE_DATA.dealership.teamLead : Store.s.advisor));
        router();
      });
    });
  };

  /* date/history sheet — Team Lead only (v3): history windows plus the
     funded toggle; funded left the active chips for good */
  const dateBtn = $("#dqDateBtn");
  if (dateBtn) dateBtn.onclick = () => {
    const options = [["today", "Today", "Default active-floor view"], ["yesterday", "Yesterday", "Review floor activity in this period"], ["7d", "Last 7 days", "Review floor activity in this period"], ["30d", "Last 30 days", "Review floor activity in this period"], ["custom", "Custom range", "Choose a specific start and end date"]];
    openSheet5(`<div class="m-sheettop"><div class="m-sheettitle">Date range</div><button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>
      <p class="ob-sheetdesc">Team Lead only. Keep the everyday queue on Today and expand the funded history only when needed.</p>
      ${options.map(([key, label, sub]) => `<button type="button" class="dq-roleopt${dealsUI.range === key ? " active" : ""}" data-range="${key}"><span><b>${label}</b><small>${sub}</small></span>${dealsUI.range === key ? `<span class="dq-check">✓</span>` : ""}</button>`).join("")}
      <div id="dqCustomWrap"${dealsUI.range === "custom" ? "" : " hidden"} style="margin-top:12px">
        <div class="ca-fieldrow">
          <div><label class="ca-lab" for="dqFrom">From</label><input class="ca-input" id="dqFrom" type="date" value="${esc(dealsUI.from)}"></div>
          <div><label class="ca-lab" for="dqTo">To</label><input class="ca-input" id="dqTo" type="date" value="${esc(dealsUI.to)}"></div>
        </div>
        <button type="button" class="ob-primary" id="dqApplyRange">Apply range</button>
      </div>
      <button type="button" class="dq-roleopt${dealsUI.funded ? " active" : ""}" id="dqFundedToggle"><span><b>Include funded contracts</b><small>Historical deals stay out of the active-stage chips</small></span>${dealsUI.funded ? `<span class="dq-check">✓</span>` : ""}</button>`, (sheet) => {
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

  /* More sheet (v3): secondary destinations stay out of the queue */
  $("#dqMore").onclick = () => {
    const row = (href, icon, title, sub, extra) => `<a class="dq-morerow${extra || ""}" href="${href}"${href.indexOf("../") === 0 ? ` target="_blank" rel="noopener"` : ""}><span class="ob-iconwell">${rpIcon(icon)}</span><span class="dq-moremain"><b>${title}</b><small>${sub}</small></span><span class="sc2-go">›</span></a>`;
    openSheet5(`<div class="m-sheettop"><div class="m-sheettitle">More</div><button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>
      <p class="ob-sheetdesc">Secondary tools stay out of the queue until you need them.</p>
      ${row("#/vehicles/browse", "car", "Inventory", "Browse or search vehicles")}
      ${row("#/customers", "user", "New customer visit", "Open the universal Customer Resolver")}
      ${row("#/props", "idcard", "Training licenses", "Print the prop licenses to practice scanning")}
      ${row("#/regprops", "page", "Training registrations", "Print the trade-in registration props")}
      ${row("../ride-price-training-hub/index.html", "sun", "Training hub", "Guides and practice flows")}
      <button type="button" class="dq-morerow dq-morerow--danger" id="dqReset"><span class="ob-iconwell">${rpIcon("trash")}</span><span class="dq-moremain"><b>Reset demo data</b><small>Return the demo to its original seed state</small></span><span class="sc2-go">›</span></button>`, (sheet) => {
      $("#dqReset", sheet).onclick = () => {
        closeSheet5();
        confirmModal("Reset demo data", "Reset all portal data back to the demo seed? Every deal and customer you created will be gone.", "Reset demo data", () => {
          Store.reset(); navigate("#/deals"); router(); toast("Demo data reset");
        });
      };
    });
  };

  paint();
});

route("customers", () => {
  renderChrome("Find a Customer", "", "");
  document.body.dataset.canvas = "master";
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
  const missionDeal = mission && mission.kind === "cobuyer" ? Store.deal(mission.dealId) : null;
  if (missionDeal && mission.open === "manual") st.mode = "manual";

  /* the one exit for every resolver path. The dedupe guard is absolute: the
     primary cannot co-sign their own loan, and an already-attached co-buyer
     is not attached twice. On attach, the advisor returns to the deal screen
     they came from with the buyers sheet reopened — the second row appearing
     IS the feedback (the package prefers local state over toast spam). */
  function finish(customerId, sessionMission) {
    const m = sessionMission || mission;
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
  const shell = (content) => `
    <div class="ca-app" style="max-width:600px">
      ${deskTop({ dealNo: null })}
      <div class="ob-main">${content}</div>
    </div>
    <div class="m-scrim" id="obScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="obSheet"></div></div>`;
  const heroHtml = (eyebrow, title, lead) => `<div class="ca-eyebrow">${eyebrow}</div><h1 class="ob-h1">${title}</h1>${lead ? `<p class="ob-lead">${lead}</p>` : ""}`;
  const contextPill = () => `<div class="ob-context"><span class="ob-pill"><span class="ob-dot"></span>${missionDeal ? "Adding a co-buyer to this deal" : "Start new customer visit"}</span></div>`;

  /* ---- sheets ---- */
  let sheetClose = null;
  const openSheet4 = (html, onMount) => {
    $("#obSheet").innerHTML = `<div class="m-handle"></div>${html}`;
    $("#obScrim").classList.add("show");
    if (onMount) onMount($("#obSheet"));
  };
  const closeSheet4 = () => $("#obScrim").classList.remove("show");
  const sheetHead4 = (title, sub) => `<div class="m-sheettop"><div class="m-sheettitle">${esc(title)}</div><button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>${sub ? `<p class="ob-sheetdesc">${sub}</p>` : ""}`;

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

  /* the one write path for a confirmed registration address — explicit
     choice, never a silent overwrite; the record keeps its single address
     that every downstream surface already reads */
  function confirmAddress(c, a, source) {
    Object.assign(c, { address: a.address, city: a.city, state: a.state, zip: a.zip });
    c.onboard = Object.assign({}, c.onboard, { address: { confirmedAt: new Date().toISOString(), source } });
    Store.save();
  }

  /* ---- idle: search, the two license paths, recent customers ---- */
  function idleHtml() {
    const s = session();
    const recent = Store.s.customers.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);
    return shell(`
      ${heroHtml("Customer onboarding", "Find customer", "Search the CRM, scan a physical license, or let the customer securely upload a license photo from their own phone.")}
      ${contextPill()}
      ${s ? `<button type="button" class="ob-session" id="obSession">
        <span class="ob-sessiondot${s.doneAt ? " done" : ""}"></span>
        <span class="ob-sessioncopy"><b>${s.doneAt ? "Customer finished the secure upload" : "Waiting for the customer's upload"}</b><small>${esc(s.phone || s.email)}</small></span>
        <span class="sc2-go">›</span></button>` : ""}
      <div class="ob-search"><span class="ob-searchicon">${rpIcon("user")}</span><input id="obSearch" placeholder="Name, phone, email, or license #" aria-label="Search customers"><button type="button" class="ob-searchbtn" id="searchBtn">Search</button></div>
      <div class="ob-helper">Ride Price searches existing profiles before any new customer is created.</div>
      <div class="ob-or">or identify from a license</div>
      <div>
        <button type="button" class="ob-action" id="scanBtn"><span class="ob-iconwell">${rpIcon("idcard")}</span><span class="ob-actionmain"><span class="ob-actiontitle">Scan physical license</span><span class="ob-actionsub">Best when the customer has the license in the showroom.</span></span><span class="sc2-go">›</span></button>
        <button type="button" class="ob-action" id="obSendLink"><span class="ob-iconwell">${rpIcon("swap")}</span><span class="ob-actionmain"><span class="ob-actiontitle">Send secure upload link</span><span class="ob-actionsub">Customer has a license photo on their phone. The image uploads directly to Ride Price.</span></span><span class="sc2-go">›</span></button>
      </div>
      ${st.results ? resultsHtml() : `
      <section class="ob-section"><div class="ob-sectiontitle">Recent customers</div><div class="ob-rows">
        ${recent.map(c => `<button type="button" class="ob-row" data-found="${esc(c.id)}"><span class="ob-avatar">${initials(c)}</span><span class="ob-rowmain"><span class="ob-rowtitle">${esc(c.first + " " + c.last)}</span><span class="ob-rowsub">${esc(c.phone)} · ${esc(c.city)}, ${esc(c.state)}</span></span><span class="sc2-go">›</span></button>`).join("")}
      </div></section>`}`);
  }

  function resultsHtml() {
    const hits = st.results;
    if (!hits.length) return `<section class="ob-section"><div class="ob-sectiontitle">No matches</div>
      <p class="ob-helper" style="margin-top:0">Nothing on file matches that search. Scan the license, send a secure upload link, or add the customer manually.</p>
      <button type="button" class="sc2-textbtn" id="obManual">No license available · add manually</button></section>`;
    return `<section class="ob-section"><div class="ob-sectiontitle">Results (${hits.length})</div><div class="ob-rows">
      ${hits.map(c => `<button type="button" class="ob-row" data-found="${esc(c.id)}"><span class="ob-avatar">${initials(c)}</span><span class="ob-rowmain"><span class="ob-rowtitle">${esc(c.first + " " + c.last)}</span><span class="ob-rowsub">${esc(c.phone)} · ${esc(c.city)}, ${esc(c.state)}</span></span><span class="sc2-go">›</span></button>`).join("")}
    </div></section>`;
  }

  /* ---- found: confirm the customer and the registration address ---- */
  function foundHtml() {
    const c = st.found;
    const a = { address: c.address, city: c.city, state: c.state, zip: c.zip };
    return shell(`
      ${heroHtml("Customer onboarding", "Customer found", "Confirm the customer and the address Ride Price should use for registration and tax calculations.")}
      ${contextPill()}
      <div class="ob-card">
        <div class="ob-resulthead"><span class="ob-avatar">${initials(c)}</span>
          <div><div class="ob-rowtitle">${esc(c.first + " " + c.last)}</div><div class="ob-rowsub">Existing Ride Price customer</div></div>
          <span class="ob-badge">CRM match</span></div>
        <div class="ob-facts">
          <div class="ob-fact"><span>Phone</span><strong>${esc(c.phone)}</strong></div>
          <div class="ob-fact"><span>Email</span><strong>${esc(c.email)}</strong></div>
        </div>
      </div>
      <div class="ob-addresscard">
        <div class="ob-addresshead"><div><div class="ob-addresstitle">Registration address</div><div class="ob-source">Customer record</div></div><span class="ob-pill">Required</span></div>
        <div class="ob-addressvalue">${esc(fmtAddr(a))}</div>
        <div class="ob-addressnote">Ride Price carries this address into registration, tax calculations, credit, and deal paperwork so the customer is not asked again.</div>
        <button type="button" class="ob-primary" id="obConfirm">Confirm address &amp; ${missionDeal ? "attach co-buyer" : "start visit"}</button>
        <button type="button" class="sc2-textbtn ob-center" id="obOtherAddr">Use a different address</button>
      </div>
      <button type="button" class="sc2-textbtn ob-center" id="obBack">Not the right customer? Search again</button>`);
  }

  /* ---- manual fallback: minimum typing, one address field ---- */
  function manualHtml() {
    return shell(`
      ${heroHtml("Customer onboarding", "No license available", "Use this only when the customer has neither a physical license nor a usable photo.")}
      <div class="ob-notice"><span>!</span><div><strong>Fallback only</strong>If a license or license photo becomes available, use it instead so Ride Price can read the identity and address automatically.</div></div>
      <div class="ob-field"><label class="ca-lab" for="obName">Full name</label><input class="ca-input" id="obName" placeholder="First Last"></div>
      <div class="ob-field"><label class="ca-lab" for="obPhone">Mobile phone</label><input class="ca-input" id="obPhone" type="tel" placeholder="(718) 555-5555"></div>
      <div class="ob-field"><label class="ca-lab" for="obEmail">Email</label><input class="ca-input" id="obEmail" type="email" placeholder="name@testing.com"></div>
      <div class="ob-field"><label class="ca-lab" for="obAddr">Registration address</label><input class="ca-input" id="obAddr" placeholder="Street, city, ST 12345">
        <div id="obAddrHint"></div></div>
      <p class="ob-helper">Both phone and email are required on every customer record. <span class="demo-note">Demo tool — sample data only.</span></p>
      <button type="button" class="ob-primary" id="obManualSave">Confirm &amp; start visit</button>
      <button type="button" class="sc2-textbtn ob-center" id="obBack">Back to resolver</button>`);
  }

  /* ---- remote session: waiting + ready (advisor side) ---- */
  function waitingHtml() {
    const s = session();
    const row = (okFlag, label, sub, value) => `<div class="ob-statusrow"><span class="ob-statusicon${okFlag ? "" : " pending"}">${okFlag ? "✓" : "•"}</span><div><div class="ob-statuslabel">${label}</div>${sub ? `<div class="ob-statussub">${sub}</div>` : ""}</div><span class="ob-statusvalue${okFlag ? "" : " pending"}">${value}</span></div>`;
    return shell(`
      ${heroHtml("Customer onboarding", "Waiting for customer", "The secure Ride Price session is ready. The customer uploads their license photo from their own phone — never by texting it to the salesperson.")}
      <div class="ob-notice"><span>✓</span><div><strong>Secure link prepared</strong>${esc(s.phone || s.email)} · ${esc(s.channel)}<br><b>Demo — no text or email is really sent; open the customer view on this device to play the customer.</b></div></div>
      <div class="ob-statuslist">
        ${row(true, "Link sent", "Secure Ride Price session created", "Complete")}
        ${row(!!s.photoAt, "License photo", s.photoAt ? "Read from the training prop" : "Waiting for customer upload", s.photoAt ? "Received" : "Pending")}
        ${row(!!s.faceAt, "Identity photo", s.faceAt ? "Captured on the customer's device" : "Face step follows the upload", s.faceAt ? "Captured" : "Pending")}
        ${row(!!s.addressConfirmedAt, "Registration address", s.addressConfirmedAt ? "Confirmed by the customer" : "Customer confirms the extracted address", s.addressConfirmedAt ? "Confirmed" : "Pending")}
      </div>
      <a class="ob-primary ob-linkbtn" href="#/idverify">Open customer view</a>
      <button type="button" class="sc2-textbtn ob-center" id="obBack">Back to customer resolver</button>
      <button type="button" class="sc2-textbtn ob-center" id="obCancelSession">Cancel this secure link</button>`);
  }

  function remoteReadyHtml() {
    const s = session();
    const p = s.persona;
    const linked = s.matchId ? Store.customer(s.matchId) : null;
    const a = s.addressChoice;
    const row = (okFlag, label, sub, value) => `<div class="ob-statusrow"><span class="ob-statusicon${okFlag ? "" : " pending"}">${okFlag ? "✓" : "•"}</span><div><div class="ob-statuslabel">${label}</div>${sub ? `<div class="ob-statussub">${sub}</div>` : ""}</div><span class="ob-statusvalue${okFlag ? "" : " pending"}">${value}</span></div>`;
    return shell(`
      ${heroHtml("Customer onboarding", "Customer identified", `${esc(p.first)} completed the secure phone flow. Start the visit now — the second license side stays a specific pending item instead of blocking everything.`)}
      <div class="ob-card"><div class="ob-resulthead"><span class="ob-avatar">${initials(p)}</span>
        <div><div class="ob-rowtitle">${esc(p.first + " " + p.last)}</div><div class="ob-rowsub">Remote secure upload${linked ? " · existing customer" : " · new customer"}</div></div>
        <span class="ob-badge">Identity photo captured</span></div></div>
      <div class="ob-statuslist" style="margin-top:14px">
        ${row(true, "Secure session", "Opened on this device (demo)", "Complete")}
        ${row(true, "Identity photo", "Demo — captured and discarded; no real biometric match", "Captured")}
        ${row(true, "License photo", "Read from the training prop", "Received")}
        ${row(false, "Second license side", "Request later only when a workflow needs the full document", "Pending")}
      </div>
      <div class="ob-addresscard">
        <div class="ob-addresshead"><div><div class="ob-addresstitle">Registration address</div><div class="ob-source">Confirmed by customer · from the license</div></div><span class="ob-badge">Confirmed</span></div>
        <div class="ob-addressvalue">${esc(fmtAddr(a))}</div>
        <div class="ob-addressnote">Carried into tax calculations, credit, registration, and paperwork.</div>
        <button type="button" class="ob-primary" id="obAttach">${(session() && session().mission) || missionDeal ? "Attach as co-buyer" : "Start visit"}</button>
        <button type="button" class="sc2-textbtn ob-center" id="obDiscardSession">Discard this upload</button>
      </div>`);
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
    wireDeskTop();
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
      confirmAddress(c, { address: c.address, city: c.city, state: c.state, zip: c.zip }, "record");
      finish(c.id);
    };
    const other = $("#obOtherAddr");
    if (other) other.onclick = () => openAddressSheet((a) => { confirmAddress(st.found, a, "chosen"); finish(st.found.id); });

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
      if (c) {
        Object.assign(c, {
          first: p.first, middle: p.middle || "", last: p.last, dob: p.dob || c.dob,
          license: { number: p.license.number, state: p.license.state, expires: p.license.expires || "" }
        });
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
    openSheet4(`${sheetHead4("Send secure upload link", "The customer uploads the license directly to Ride Price — never by texting or emailing it to the salesperson.")}
      <div class="ob-channel" id="obChannel"><button type="button" class="active" data-ch="Text">Text</button><button type="button" data-ch="Email">Email</button></div>
      <div class="ob-field"><label class="ca-lab" for="obLinkPhone">Customer mobile</label><input class="ca-input" id="obLinkPhone" type="tel" placeholder="(718) 555-5555"></div>
      <div class="ob-field"><label class="ca-lab" for="obLinkEmail">Email</label><input class="ca-input" id="obLinkEmail" type="email" placeholder="name@testing.com"></div>
      <div class="ob-privacy"><strong>Private by design:</strong> the upload link creates a secure Ride Price session. The salesperson receives status, not a copy in personal messages. <b>Demo — no text or email is really sent; the customer view opens on this device.</b></div>
      <p class="ob-helper" style="margin:0 0 4px">Both channels are kept on the record — phone and email are required on every customer profile.</p>
      <button type="button" class="ob-primary" id="obSendGo">Send secure link</button>`, (sheet) => {
      let channel = "Text";
      $$("#obChannel button", sheet).forEach(b => b.onclick = () => {
        channel = b.dataset.ch;
        $$("#obChannel button", sheet).forEach(x => x.classList.toggle("active", x === b));
      });
      $("#obSendGo", sheet).onclick = () => {
        const phone = $("#obLinkPhone", sheet).value.trim(), email = $("#obLinkEmail", sheet).value.trim();
        const bad = [];
        if (!phone) bad.push({ el: $("#obLinkPhone", sheet), msg: "Required" });
        if (!email) bad.push({ el: $("#obLinkEmail", sheet), msg: "Required" });
        if (markMissing(sheet, bad)) return;
        Store.s.idSession = { id: uid("s"), phone, email, channel, sentAt: new Date().toISOString(), photoAt: null, persona: null, matchId: null, faceAt: null, addressChoice: null, addressConfirmedAt: null, doneAt: null };
        /* a link sent on the buyers sheet's mission attaches as co-buyer when
           it completes — recorded on the session, which outlives this page */
        if (missionDeal) Store.s.idSession.mission = { kind: "cobuyer", dealId: missionDeal.id, back: mission.back };
        Store.save();
        closeSheet4();
        st.mode = "waiting"; render(); window.scrollTo(0, 0);
      };
    });
  }

  function openAddressSheet(onPick) {
    openSheet4(`${sheetHead4("Use a different address", "One address search field — no separate street, city, state and ZIP typing.")}
      <div class="ob-field"><label class="ca-lab" for="obSheetAddr">Search address</label><input class="ca-input" id="obSheetAddr" placeholder="Street, city, ST 12345"></div>
      <div id="obSheetHint" class="ob-helper" style="margin-top:0">Type the address as street, city, ST 12345 — the demo standardizes against its ZIP table.</div>
      <div id="obSheetOut"></div>`, (sheet) => {
      const inp = $("#obSheetAddr", sheet);
      inp.oninput = () => {
        const parsed = parseAddress(inp.value);
        $("#obSheetOut", sheet).innerHTML = parsed
          ? `<button type="button" class="ob-lookup" data-pickaddr><strong>${esc(fmtAddr(parsed))}</strong><span>Use this standardized address</span></button>` : "";
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
    trade: { has: false, value: 0, payoff: 0, rebates: 0, applyTaxCredit: true },
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
  Store.s.deals.push(deal); Store.save();
  navigate(`#/discovery/${deal.id}`);
}

/* ============================================================
   LICENSE SCAN — prop-license capture, match & verify (demo)
   Recognition is simulated: only the 5 printed training props
   can ever resolve (see assets/scan.js). Photos are never stored.
   ============================================================ */
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
  c = cs.find(x => !x.dob && nameEq(x));
  if (c) return { type: "name", customer: c, ask: "name" };
  return { type: null, customer: null };
}

function openScanFlow(opts) {
  const o = Object.assign({ mode: "customer" }, opts);
  const st = { frontDone: false, persona: null, match: null, render: null, saved: false, manNum: "", manState: "NY", stage: "front", sv: null };
  modal("Scan Driver's License", `<div id="scanBody"></div>`);
  const body = $("#scanBody");
  /* the scan is the master package's two-decision flow (owner's simplified v2,
     2026-08-28): capture the license, then confirm the customer. Everything
     else is a system state or an exception sheet. Recognition itself still
     only ever reads the five printed props (invariant 4). */
  const backEl = $("#modalBack");
  backEl.classList.add("modal-back--journey");
  $(".modal", backEl).classList.add("modal--journey");
  setModalFoot(""); /* the master flow's actions live in the page */

  /* one teardown for every exit path — dismissal, navigation, or save */
  function cleanup() {
    st.cancelled = true;
    window.removeEventListener("hashchange", abandon);
    backEl.removeEventListener("click", onDismiss);
    document.removeEventListener("click", leaveGuard, true);
    if (sheetClose) sheetClose();
  }
  function onDismiss(e) { if (e.target === backEl || e.target.hasAttribute("data-close")) cleanup(); }
  function abandon() { cleanup(); closeModal(); } /* navigating away abandons the scan */
  /* leaving a part-done scan asks once (captured photos and parsed details
     would be discarded). Capture-phase on document so it runs before the
     modal's own close handler; nothing captured — or already saved — closes
     instantly. */
  function leaveGuard(e) {
    if (st.cancelled || st.saved || !document.contains(backEl)) return;
    if (!(e.target === backEl || (backEl.contains(e.target) && e.target.hasAttribute("data-close")))) return;
    if (!st.frontDone) return; /* nothing to lose yet */
    e.preventDefault(); e.stopImmediatePropagation();
    renderLeaveConfirm();
  }
  document.addEventListener("click", leaveGuard, true);
  backEl.addEventListener("click", onDismiss);
  window.addEventListener("hashchange", abandon);
  const done = () => { cleanup(); closeModal(); };
  const live = () => !st.cancelled && document.contains(body);

  /* chrome (golden): brand row with the demo chip — the marker's one home in
     the journey (standing rule) — and the two-part Scan / Confirm progress */
  function top() {
    const confirmSide = ["confirm", "new", "done", "block", "td"].includes(st.stage);
    return `<div class="sc2-top">
      <div class="sc2-brandrow">
        <div class="sc2-brand"><span>Ride</span> Price</div>
        <div class="sc2-context"><span class="chip--demo">TRAINING · PROPS ONLY</span>
          <button type="button" class="sc2-close" data-close aria-label="Close">×</button></div>
      </div>
      <div class="sc2-progress" aria-label="Scan, then confirm">
        <div class="sc2-step ${confirmSide ? "done" : "active"}">1&nbsp; Scan</div>
        <div class="sc2-step ${confirmSide ? "active" : ""}">2&nbsp; Confirm</div>
      </div>
    </div>`;
  }
  const hero = (title, sub) => `<div class="sc2-eyebrow">Customer identity</div><h1 class="sc2-h1">${title}</h1>${sub ? `<p class="sc2-sub">${sub}</p>` : ""}`;
  const initials = (first, last) => esc(((first || " ")[0] + (last || " ")[0]).toUpperCase().trim() || "?");

  function wire(renderFn) {
    st.render = renderFn;
    $$("[data-cap]", body).forEach(inp => inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (f && st.onCapture) st.onCapture(f);
    });
  }

  /* ---- exception sheets: one at a time, scrim tap and Escape both close.
     Sheets overlay the current screen, so closing one never re-renders. ---- */
  let sheetClose = null;
  function openSheet(html, onMount) {
    if (sheetClose) sheetClose();
    const sb = document.createElement("div");
    sb.className = "sc2-sheetback";
    sb.innerHTML = `<div class="sc2-sheet" role="dialog" aria-modal="true"><div class="sc2-handle" aria-hidden="true"></div>${html}</div>`;
    $(".modal", backEl).appendChild(sb);
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    const close = () => { document.removeEventListener("keydown", onKey, true); sb.remove(); if (sheetClose === close) sheetClose = null; };
    document.addEventListener("keydown", onKey, true);
    sb.addEventListener("click", (e) => { if (e.target === sb || e.target.closest("[data-sheet-close]")) close(); });
    sheetClose = close;
    if (onMount) onMount($(".sc2-sheet", sb), close);
    return close;
  }
  const sheetHead = (title, sub) => `<div class="sc2-sheethead"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div><button type="button" class="sc2-sheetx" data-sheet-close aria-label="Close">×</button></div>`;

  /* leaving a part-done scan asks once; the sheet overlays, so Keep scanning
     simply closes it and the screen underneath is untouched */
  function renderLeaveConfirm() {
    openSheet(`${sheetHead("Leave the scan?", "The captured photos and parsed details will be discarded.")}
      <div class="sc2-sheetactions">
        <button type="button" class="sc2-primary" data-sheet-close>Keep scanning</button>
        <button type="button" class="sc2-textbtn" data-leave>Leave — discard the scan</button>
      </div>`, (sheet) => { $("[data-leave]", sheet).onclick = () => { if (sheetClose) sheetClose(); done(); }; });
  }

  /* ---- Screen 1: scan. Front and back are phases of one architecture. ---- */
  function renderScan(side) {
    const isBack = side === "back";
    st.stage = isBack ? "back" : "front";
    body.innerHTML = `${top()}
      <div class="sc2-page">
        ${hero("Scan driver&rsquo;s license", isBack
          ? "Front captured. Keep the camera open and flip the license over."
          : o.mode === "testdrive" ? "Verify the guest&rsquo;s license for the drive — both sides in one session."
          : o.mode === "cobuyer" ? "Scan the co-buyer&rsquo;s license — both sides in one session."
          : "Capture both sides in one session. Ride Price reads the license and checks the CRM automatically.")}
        <section class="sc2-capture">
          <div class="sc2-frame">${isBack
            ? `<div class="sc2-barcode" aria-hidden="true"></div>`
            : `<div class="sc2-cardart" aria-hidden="true"><span class="sc2-cardface">${rpIcon("user")}</span><span class="sc2-cardlines"><i></i><i></i><i></i></span></div>`}</div>
          <div class="sc2-captitle">${isBack ? "Flip to the back" : "Position the front inside the frame"}</div>
          <p class="sc2-captip">${isBack ? "Keep the barcode flat and avoid glare." : "Hold steady. The full license should be visible."}</p>
          ${isBack ? `<div class="sc2-status"><span class="sc2-statusicon">✓</span><div><b>Front captured</b><br><span>Ready for the back</span></div></div>` : ""}
        </section>
        <div class="sc2-actions">
          <label class="sc2-primary sc2-cap">${isBack ? "Capture back" : "Take photo"}<input type="file" accept="image/*" capture="environment" data-cap hidden></label>
          <label class="sc2-secondary sc2-cap">Choose photo<input type="file" accept="image/*" data-cap hidden></label>
        </div>
        <p class="sc2-micro">Photos are read on this device and discarded. Only the <b>5 printed training licenses</b> can be recognized — there is no reader for a real ID.</p>
      </div>`;
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
     render inline on the scan architecture. Every entry takes a generation
     token; navigating away or a newer read invalidates the old resolve
     (review lesson 5 — a stale recognizeFile must never paint this screen). */
  function renderProcessing(file, personaAlready) {
    st.stage = "processing";
    const gen = st.procGen = (st.procGen || 0) + 1;
    const mine = () => live() && st.procGen === gen;
    body.innerHTML = `${top()}
      <div class="sc2-page">
        ${hero("Reading license", "No extra step is required. Ride Price is reading the barcode and checking the CRM in the background.")}
        <section class="sc2-capture sc2-capture--busy">
          <span class="sc2-spin" aria-hidden="true"></span>
          <div class="sc2-captitle">Checking Ride Price…</div>
          <p class="sc2-captip">Reading identity details · Searching customer records</p>
          <div class="sc2-status"><span class="sc2-statusicon">✓</span><div><b>Front and back captured</b><br><span>No action needed</span></div></div>
        </section>
      </div>`;
    st.render = () => renderProcessing(null, st.persona); /* resume only re-shows the busy state */
    const settle = (p) => { if (!mine()) return; if (p) { st.persona = p; afterRecognize(); } else renderReject(); };
    if (personaAlready) { setTimeout(() => settle(personaAlready), 700); return; }
    RIDE_PRICE_SCAN.recognizeFile(file).then((res) => {
      setTimeout(() => settle(res && res.ok ? res.persona : null), 500);
    }).catch(() => { if (mine()) renderReject(); });
  }

  /* failed read is an exception sheet over the capture screen — the advisor
     never leaves the scanner to recover */
  function renderReject() {
    renderScan("back");
    openSheet(`${sheetHead("We couldn&rsquo;t read the license", "We couldn&rsquo;t find the barcode. Keep the whole barcode visible and avoid glare.")}
      <p class="sc2-sheethint">Only the 5 printed training licenses can be recognized — there is no reader for a real ID.</p>
      <div class="sc2-sheetactions">
        <button type="button" class="sc2-primary" data-sheet-close>Try again</button>
        ${o.mode === "customer" ? `<button type="button" class="sc2-secondary" data-manual>Find customer manually</button>` : ""}
      </div>`, (sheet, close) => {
      const m = $("[data-manual]", sheet);
      if (m) m.onclick = () => { close(); renderManual(); };
    });
  }

  /* manual CRM search (exception sheet): by license number and issuing state
     ONLY — nothing typed here is ever treated as data read from a card, and
     no persona is invented (recorded honesty decision) */
  function renderManual() {
    openSheet(`${sheetHead("Find customer", "Search the CRM by license number and issuing state. Typed details are a search — never a card read.")}
      <div class="sc2-searchbox">
        <input class="sc2-input" id="mnNum" placeholder="License #" value="${esc(st.manNum)}" aria-label="License number">
        <input class="sc2-input sc2-input--state" id="mnState" maxlength="2" value="${esc(st.manState)}" aria-label="Issuing state">
        <button type="button" class="sc2-primary sc2-searchgo" id="mnGo">Search</button>
      </div>
      <div id="mnOut"></div>`, (sheet, close) => {
      const run = () => {
        st.manNum = $("#mnNum", sheet).value.trim();
        st.manState = $("#mnState", sheet).value.trim().toUpperCase();
        if (!st.manNum) return markMissing(sheet, [{ el: $("#mnNum", sheet), msg: "Required" }]);
        const norm = (s) => String(s || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
        const hit = Store.s.customers.find(x => x.license && norm(x.license.number) === norm(st.manNum)
          && (!x.license.state || !st.manState || norm(x.license.state) === norm(st.manState)));
        $("#mnOut", sheet).innerHTML = hit
          ? `<div class="sc2-result"><span class="sc2-person">${rpIcon("user")}</span><div style="min-width:0"><b>${esc(hit.first + " " + hit.last)}</b><span>${esc(hit.license.number + (hit.license.state ? " · " + hit.license.state : ""))}</span></div><button type="button" class="sc2-use" data-use>Use</button></div>`
          : `<p class="sc2-noresult">No customer carries that license number${st.manState ? " in " + esc(st.manState) : ""}.</p>
             ${o.mode === "customer" ? `<button type="button" class="sc2-textbtn" data-create>No match · create new customer</button>` : ""}`;
        const use = $("[data-use]", sheet);
        if (use) use.onclick = () => { close(); done(); if (o.onDone) o.onDone(hit, null, { type: "license number", customer: hit }); };
        const cr = $("[data-create]", sheet);
        /* an entry with no onManual (the deals-queue camera) still gets a real
           create path: Find a Customer opens with the Create dialog ready
           (the PR #49 fix — the flag is consumed exactly once) */
        if (cr) cr.onclick = () => {
          close(); done();
          if (o.onManual) return o.onManual();
          scanWantsCreate = true;
          if (location.hash === "#/customers") router(); else navigate("#/customers");
        };
      };
      $("#mnGo", sheet).onclick = run;
      $("#mnNum", sheet).focus();
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
    body.innerHTML = `${top()}
      <div class="sc2-page">
        ${hero(kind === "already" ? "Already the co-buyer" : "That&rsquo;s the primary buyer", kind === "already"
          ? "This license resolves to the person already attached as the co-buyer."
          : "A person can&rsquo;t co-sign their own loan — the co-buyer must be a different guest.")}
        <div class="sc2-actions" style="margin-top:26px">
          <button type="button" class="sc2-primary" data-rescan>Scan a different license</button>
          <button type="button" class="sc2-textbtn" data-close>Cancel</button>
        </div>
      </div>`;
    $("[data-rescan]").onclick = () => { st.frontDone = false; renderScan("front"); };
    wire(() => renderBlock(kind));
  }

  /* one label per type findLicenseMatch() can return — the badge states the
     REAL basis, never an invented confidence (CodeRabbit, PR #49) */
  const BASIS = {
    "license number": "License match",
    "date of birth and name": "Name and birthday match",
    "date of birth": "Same birthday",
    "name": "Name match",
    "your selection": "Your selection"
  };

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

  /* what the scanned license changes on the record — delta-only (golden):
     when nothing changed, nothing is listed */
  function deltasFor(ex, sv) {
    const chg = [];
    const push = (label, oldV, newV, isDate) => { if (newV && (!oldV || String(oldV) !== String(newV))) chg.push({ label, oldV: oldV || null, newV, isDate }); };
    push("Name", ex.first + " " + ex.last, sv.first + " " + sv.last);
    push("Date of birth", ex.dob, sv.dob, true);
    push("License #", ex.license && ex.license.number, sv.license.number);
    push("Expires", ex.license && ex.license.expires, sv.license.expires, true);
    push("Address", ex.address, sv.address);
    return chg;
  }

  /* ---- Screen 2: confirm. Certain matches confirm with a delta; ambiguous
     ones carry the explicit same-person question plus the scanned license
     for a real comparison — nothing merges without a human yes. ---- */
  function renderConfirm(m) {
    st.stage = "confirm";
    const p = st.persona, ex = m.customer;
    const sv = seedSv(ex);
    const chg = deltasFor(ex, sv);
    const needContact = !ex.phone || !ex.email; /* both channels required (owner rule) */
    const ask = !!m.ask;
    const basis = BASIS[m.type] || "Match found";
    const last4 = ex.license && ex.license.number ? ex.license.number.slice(-4) : null;
    body.innerHTML = `${top()}
      <div class="sc2-page">
        ${hero("Confirm customer", ask
          ? (m.ask === "dob" ? "Same birthday as a customer on file. Same person, or a different guest?" : "The name matches a customer on file. Compare the two before continuing.")
          : "Ride Price found an existing customer. Review only what changed, then continue.")}
        <section class="sc2-found">
          <div class="sc2-foundhead">
            <span class="sc2-person">${rpIcon("user")}</span>
            <div><h2>${esc([ex.first, ex.middle, ex.last].filter(Boolean).join(" "))}</h2>
              <p>Existing customer${last4 ? " · license ending " + esc(last4) : ""}${o.mode === "cobuyer" ? " · will be attached as the co-buyer" : ""}</p></div>
            <span class="sc2-badge">${esc(basis)}</span>
          </div>
          <div class="sc2-checks">
            <div class="sc2-checkrow"><span class="sc2-checkmark">✓</span><b>${ask ? "Possible identity match" : "Identity matched"}</b><span>${esc(basis)}</span></div>
            ${needContact
              ? `<div class="sc2-checkrow"><span class="sc2-checkmark sc2-checkmark--off">–</span><b>Contact incomplete</b><span>${!ex.phone && !ex.email ? "Phone & email needed" : !ex.phone ? "Phone needed" : "Email needed"}</span></div>`
              : `<div class="sc2-checkrow"><span class="sc2-checkmark">✓</span><b>Phone &amp; email already on file</b><span>Complete</span></div>`}
          </div>
        </section>
        ${ask ? `<section class="sc2-newsummary"><div class="sc2-sumhead">The license just scanned</div>
          <div class="sc2-sumrow"><span>Name</span><b>${esc([p.first, p.middle, p.last].filter(Boolean).join(" "))}</b></div>
          <div class="sc2-sumrow"><span>Date of birth</span><b>${p.dob ? esc(dateUS(p.dob)) : "—"}</b></div>
          <div class="sc2-sumrow"><span>License</span><b>${esc(p.license.number + " · " + p.license.state)}</b></div>
          <div class="sc2-sumrow"><span>Address</span><b>${esc(p.address + ", " + p.city + ", " + p.state + " " + p.zip)}</b></div>
        </section>` : ""}
        ${chg.length ? `<section class="sc2-update">
          <div class="sc2-updatehead"><b>${chg.length} update${chg.length === 1 ? "" : "s"} from this license</b><span>Only changed data is shown</span></div>
          <div class="sc2-delta">
            ${chg.map(c2 => `<div class="sc2-deltarow"><div class="sc2-deltalabel">${esc(c2.label)}</div>
              <div class="sc2-deltavalues">${c2.oldV ? `<span class="sc2-old">${esc(c2.isDate ? dateUS(c2.oldV) : c2.oldV)}</span><span class="sc2-arrow">→</span>` : `<span class="sc2-newtag">New</span>`}<span class="sc2-new">${esc(c2.isDate ? dateUS(c2.newV) : c2.newV)}</span></div></div>`).join("")}
          </div>
        </section>` : ""}
        ${needContact ? `<div class="sc2-fields">
          ${!ex.phone ? `<div class="sc2-field"><label for="svPhone">Mobile phone</label><input class="sc2-input" id="svPhone" type="tel" inputmode="tel" placeholder="(718) 555-5555" value="${esc(sv.phone)}"></div>` : ""}
          ${!ex.email ? `<div class="sc2-field"><label for="svEmail">Email</label><input class="sc2-input" id="svEmail" type="email" placeholder="name@testing.com" value="${esc(sv.email)}"></div>` : ""}
          <p class="sc2-micro" style="text-align:left;margin-top:0">Both phone and email are required on every customer record.</p>
        </div>` : ""}
        <div class="sc2-actions">
          <button type="button" class="sc2-primary" data-save>${ask ? "Same person — update &amp; continue" : chg.length ? "Update &amp; continue" : "Confirm &amp; continue"}</button>
          ${ask
            ? `<button type="button" class="sc2-secondary" data-notme>Different guest — create new</button>`
            : `<button type="button" class="sc2-textbtn" data-notme>This isn&rsquo;t ${esc(ex.first)}</button>`}
          <button type="button" class="sc2-textbtn" data-again>Search manually</button>
        </div>
      </div>`;
    $("[data-save]").onclick = () => {
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
    $("[data-notme]").onclick = () => { st.match = { type: null, customer: null }; st.sv = null; renderNewCustomer(); };
    $("[data-again]").onclick = () => renderManual();
    wire(() => renderConfirm(m));
  }

  /* new customer: identity is a read-only summary from the license — the
     advisor never retypes card data. The only asks are what a license cannot
     say: phone and email (both required; owner rule). No credit score is
     asked (owner, 2026-08-25) — the record starts at the neutral default. */
  function renderNewCustomer() {
    st.stage = "new";
    const sv = seedSv(null);
    body.innerHTML = `${top()}
      <div class="sc2-page">
        ${hero("New customer", `No CRM match was found. The license already filled the identity details — only add what the license cannot provide.${o.mode === "cobuyer" ? " They&rsquo;ll be attached as the co-buyer." : ""}`)}
        <section class="sc2-newsummary">
          <div class="sc2-sumrow"><span>Name</span><b>${esc([sv.first, sv.middle, sv.last].filter(Boolean).join(" "))}</b></div>
          <div class="sc2-sumrow"><span>License</span><b>${esc(sv.license.number + " · " + sv.license.state + (sv.license.expires ? " · exp " + dateUS(sv.license.expires) : ""))}</b></div>
          <div class="sc2-sumrow"><span>Date of birth</span><b>${sv.dob ? esc(dateUS(sv.dob)) : "—"}</b></div>
          <div class="sc2-sumrow"><span>Address</span><b>${esc(sv.address + ", " + sv.city + ", " + sv.state + " " + sv.zip)}</b></div>
        </section>
        <div class="sc2-fields">
          <div class="sc2-field"><label for="svPhone">Mobile phone</label><input class="sc2-input" id="svPhone" type="tel" inputmode="tel" autocomplete="off" placeholder="(718) 555-5555" value="${esc(sv.phone)}"></div>
          <div class="sc2-field"><label for="svEmail">Email</label><input class="sc2-input" id="svEmail" type="email" autocomplete="off" placeholder="name@testing.com" value="${esc(sv.email)}"></div>
          <p class="sc2-micro" style="text-align:left;margin-top:0">Phone and email are required for the customer profile. <span class="demo-note">Demo tool — sample data only.</span></p>
        </div>
        <div class="sc2-actions">
          <button type="button" class="sc2-primary" data-save>${o.mode === "cobuyer" ? "Add as co-buyer" : "Create customer"}</button>
          <button type="button" class="sc2-textbtn" data-rescan>Scan again</button>
        </div>
      </div>`;
    $("[data-save]").onclick = () => {
      sv.phone = $("#svPhone", body).value.trim();
      sv.email = $("#svEmail", body).value.trim();
      /* the same required set and the same marks as Create Customer */
      const bad = customerMissing(svVals(), "sv", body);
      if (markMissing(body, bad)) return toast("Fill in the fields marked in red");
      saveFrom(svVals(), null);
    };
    $("[data-rescan]").onclick = () => { st.frontDone = false; st.sv = null; st.persona = null; st.match = null; renderScan("front"); };
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
    openSheet(`${sheetHead("Possible duplicate", "We found similar customers. Select the correct one, or create new.")}
      ${cands.map((c2, i) => `<button type="button" class="sc2-result sc2-result--pick" data-pik="${i}">
        <span class="sc2-person sc2-person--init">${initials(c2.first, c2.last)}</span>
        <div style="min-width:0"><b>${esc([c2.first, c2.middle, c2.last].filter(Boolean).join(" "))}</b><span>${esc(c2.phone || c2.email || "No contact on file")}</span></div>
        <span class="sc2-go" aria-hidden="true">›</span>
      </button>`).join("")}
      <div class="sc2-sheetactions">
        <button type="button" class="sc2-secondary" data-none>None of these — create new</button>
        <p class="sc2-sheethint">Creating new adds a second record with this name to the CRM.</p>
      </div>`, (sheet, close) => {
      $$("[data-pik]", sheet).forEach(b => b.onclick = () => {
        close();
        st.match = { type: "your selection", customer: cands[+b.dataset.pik] };
        st.sv = null;
        renderConfirm(st.match);
      });
      $("[data-none]", sheet).onclick = () => { close(); finishSave(mkNew(), false); };
    });
  }

  /* the typed phone matches an existing record (exception sheet): the
     evidence, what each action does, and the cheap typo fix. Nothing merges
     until the number is verified. */
  function renderPhoneConflict(dup, vals, mkNew) {
    const isPrimary = o.mode === "cobuyer" && dup.id === o.deal.customerId;
    openSheet(`${sheetHead("This phone number is already in use", "Verify ownership before linking customer information to another CRM profile.")}
      <div class="sc2-conflict"><b>${esc(vals.phone)}</b>
        <p>This number is currently on ${esc(dup.first + " " + dup.last)}&rsquo;s profile${dup.dob ? " (born " + esc(dateUS(dup.dob)) + ")" : ""}. Nothing will be merged until the number is verified.</p>
        ${isPrimary ? `<p><b>That&rsquo;s the primary buyer on this deal</b> — they can&rsquo;t also be the co-buyer, so linking isn&rsquo;t available here.</p>` : ""}</div>
      <div class="sc2-sheetactions">
        ${isPrimary ? "" : `<button type="button" class="sc2-primary" data-plink>Verify number &amp; link</button>`}
        <button type="button" class="sc2-secondary" data-pfix>Use a different number</button>
        <button type="button" class="sc2-textbtn" data-pnew>Keep profiles separate</button>
      </div>`, (sheet, close) => {
      const link = $("[data-plink]", sheet);
      if (link) link.onclick = () => { close(); renderVerifyCode(dup, vals); };
      $("[data-pnew]", sheet).onclick = () => { close(); finishSave(mkNew(), false); };
      $("[data-pfix]", sheet).onclick = () => {
        close();
        st.sv.phone = "";
        const ph = $("#svPhone", body);
        if (ph) { ph.value = ""; ph.scrollIntoView({ block: "center" }); ph.focus(); }
      };
    });
  }

  /* linking overwrites someone's existing record off a TYPED number, so it is
     gated behind a code verification (owner, 2026-08-25): the guest reads
     back the code sent to that number. This demo has no network path
     (invariant), so the sheet says so and shows the code the guest "received"
     — the rehearsal stays the real one. Wrong code merges nothing. */
  function renderVerifyCode(dup, vals) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    openSheet(`${sheetHead("Verify the phone number", `Ask the guest to read back the six-digit code sent to ${esc(vals.phone)} — it proves the number is theirs before the records link.`)}
      <div class="sc2-code" id="svCode">${Array.from({ length: 6 }, (_, i) => `<input maxlength="1" inputmode="numeric" aria-label="Code digit ${i + 1}">`).join("")}</div>
      <div class="sc2-demo"><b>Demo:</b> nothing leaves this device, so no text was really sent — the code on the guest&rsquo;s phone would read <b>${esc(code)}</b>.</div>
      <div class="sc2-sheetactions">
        <button type="button" class="sc2-primary" data-verify>Verify &amp; link</button>
        <button type="button" class="sc2-textbtn" data-sheet-close>Cancel</button>
      </div>`, (sheet, close) => {
      const boxes = $$("#svCode input", sheet);
      boxes.forEach((b, i) => b.oninput = () => {
        b.value = b.value.replace(/\D/g, "").slice(0, 1);
        if (b.value && boxes[i + 1]) boxes[i + 1].focus();
      });
      boxes[0].focus();
      $("[data-verify]", sheet).onclick = () => {
        const typed = boxes.map(b => b.value).join("");
        if (typed !== code) return markMissing(sheet, [{ el: boxes[0], msg: typed ? "Code doesn't match" : "Required" }]);
        close();
        Object.assign(dup, vals);
        finishSave(dup, true);
      };
    });
  }

  /* completion is local feedback on the confirm surface — the success bar,
     the customer, and the visit as the dominant next action. "Scan another"
     restarts in place with a clean slate. */
  function renderDone(cust, wasExisting) {
    st.stage = "done";
    body.innerHTML = `${top()}
      <div class="sc2-page">
        <div class="sc2-successbar"><span class="sc2-statusicon">✓</span>Customer ready · ${wasExisting ? "profile updated" : "new profile created"}</div>
        ${hero(esc([cust.first, cust.middle, cust.last].filter(Boolean).join(" ")), wasExisting
          ? "The record is up to date from the license and ready to continue."
          : "Identity details came from the license. Phone and email are confirmed on the customer profile.")}
        <section class="sc2-newsummary">
          <div class="sc2-sumrow"><span>License</span><b>${cust.license && cust.license.number ? esc(cust.license.number + (cust.license.state ? " · " + cust.license.state : "")) : "—"}</b></div>
          <div class="sc2-sumrow"><span>Phone</span><b>${esc(cust.phone || "—")}</b></div>
          <div class="sc2-sumrow"><span>Email</span><b>${esc(cust.email || "—")}</b></div>
        </section>
        <div class="sc2-actions">
          <button type="button" class="sc2-primary sc2-primary--accent" data-go>Continue to visit</button>
          <button type="button" class="sc2-textbtn" data-more>Scan another license</button>
        </div>
      </div>`;
    $("[data-go]").onclick = () => { done(); if (o.onDone) o.onDone(cust, st.persona, st.match); };
    /* a fresh scan needs a clean slate: the old persona, working values and
       match must not leak into the next guest's journey */
    $("[data-more]").onclick = () => {
      st.frontDone = false; st.persona = null; st.match = null;
      st.sv = null; st.saved = false; st.manNum = ""; st.manState = "NY";
      renderScan("front");
    };
    st.render = () => renderDone(cust, wasExisting);
  }

  /* test-drive mode: verify the card in hand for the drive. On a name
     mismatch the card may belong to someone else — fill the agreement but
     never write that identity onto this customer's record. */
  function renderVerifyTd(p) {
    st.stage = "td";
    const c = o.deal ? Store.customer(o.deal.customerId) : null;
    const mismatch = c && (c.first.toLowerCase() !== p.first.toLowerCase() || c.last.toLowerCase() !== p.last.toLowerCase());
    body.innerHTML = `${top()}
      <div class="sc2-page">
        ${hero(mismatch ? "Check the name" : "License read", mismatch
          ? `The license reads <b>${esc(p.first + " " + p.last)}</b>, but this deal&rsquo;s customer is <b>${esc(c.first + " " + c.last)}</b>. Double-check you have the right guest — the name on file won&rsquo;t be changed here.`
          : `${c ? "For " + esc(c.first + " " + c.last) + ". " : ""}Verify each field against the card before continuing.`)}
        <div class="sc2-fields">
          <div class="sc2-field"><label for="svDl">License # <span class="sc2-req">*</span></label><input class="sc2-input" id="svDl" type="text" value="${esc(p.license.number)}"></div>
          <div class="sc2-field"><label for="svDlState">Issuing State</label><input class="sc2-input" id="svDlState" type="text" value="${esc(p.license.state)}"></div>
          <div class="sc2-field"><label for="svDlExp">Expires</label><input class="sc2-input" id="svDlExp" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(dateUS(p.license.expires))}"></div>
          <div class="sc2-field"><label for="svDob">Date of Birth</label><input class="sc2-input" id="svDob" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(dateUS(p.dob))}"></div>
        </div>
        <div class="sc2-actions">
          <button type="button" class="sc2-primary" id="svSave">Use These Details</button>
        </div>
      </div>`;
    $("#svSave").onclick = () => {
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
      if (o.onDone) o.onDone(c, Object.assign({}, p, { license: lic }));
    };
    wire(() => renderVerifyTd(p));
  }

  renderScan("front");
}

/* ============================================================
   VIEW: Training licenses (printable props)
   ============================================================ */
route("props", () => {
  renderChrome("Training Licenses", "Print, cut out, and practice scanning — every identity is fictional",
    `<button class="btn btn--grad btn--sm" id="printProps">🖨 Print props</button>`);
  const F = (l, v) => `<span class="fld">${l}</span>${esc(v)}`;
  view().innerHTML = `
    <section class="props-guide">
      <h2>How to use these cards</h2>
      <ol class="props-steps">
        <li><b>Print at 100% scale.</b> Turn <i>off</i> “Fit to page” or “Shrink to fit” in the print dialog.
          A card should measure 3⅜ × 2⅛ inches — the same as a credit card. The barcode only reads at true size.</li>
        <li><b>Cut out one person.</b> Each has a front and a back. The <b>back is the side that scans</b> —
          the front is there so you practise checking the details against it.</li>
        <li><b>Scan it.</b> Go to <a href="#/customers">Find a Customer</a> and tap <b>Scan license</b>,
          or start from the Test Drive agreement. Photograph the front, then the back.</li>
      </ol>
      <p class="props-guide__foot">These five cards are the only thing the scanner recognises. It cannot read a
        real driver's licence, and the barcode holds nothing but a card number — no personal details.</p>
    </section>
    <div class="props-grid">
      ${RIDE_PRICE_DATA.licenseProps.map(p => `
       <div class="prop-pair">
        <div class="prop-card">
          <div class="prop-head"><span>NEW YORK · USA</span><b>TRAINING SAMPLE</b></div>
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
          <div class="prop-foot">TRAINING PROP — NOT A GOVERNMENT DOCUMENT</div>
        </div>
        <div class="prop-card">
          <div class="prop-back-top">TRAINING SAMPLE · SCAN THIS SIDE</div>
          ${RIDE_PRICE_SCAN.barcodeSVG(p.prop, "prop-barcode")}
          <div class="prop-fine">${esc(p.last.toUpperCase())} · PROP ${p.prop} OF 5 · This card exists for Ride Price sales
            training only. The barcode encodes a prop number — no personal data. It has no value and identifies no one.</div>
          <div class="prop-foot">NOT A GOVERNMENT DOCUMENT</div>
        </div>
       </div>`).join("")}
    </div>`;
  $("#printProps").onclick = () => window.print();
});

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

route("regprops", () => {
  renderChrome("Training Registrations", "Print, cut out, and practise the trade-in conversation — every identity is fictional",
    `<button class="btn btn--grad btn--sm" id="printRegProps">🖨 Print registrations</button>`);
  view().innerHTML = `
    <section class="props-guide">
      <h2>How to use these</h2>
      <ol class="props-steps">
        <li><b>Print at 100% scale.</b> Turn <i>off</i> “Fit to page” or “Shrink to fit”, the same as the
          training licences, so the card comes out the size a customer actually hands you.</li>
        <li><b>Pair each one with its licence.</b> Registration 1 belongs to the same person as
          <a href="#/props">training licence 1</a> — the names and addresses match, so a trainee can practise
          checking one document against the other.</li>
        <li><b>Use it on a trade.</b> Start a deal with a trade-in and work the
          proof-of-ownership conversation from the paper in your hand.</li>
      </ol>
      <p class="props-guide__foot">Nothing here scans. These are for the conversation, not the camera —
        the app has no way to read a registration, and the strip along the bottom is decorative.
        The layout follows a real New York registration so the rehearsal looks right; every value on it
        is invented.</p>
    </section>
    <div class="props-grid">
      ${RIDE_PRICE_DATA.registrationProps.map(regPropHtml).join("")}
    </div>`;
  $("#printRegProps").onclick = () => window.print();
});

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
    <a class="dv-jacket" href="#/jacket/${esc(deal.id)}" aria-label="Deal Jacket${jkc.missing ? ` — ${esc(jkc.missing)} of ${esc(jkc.total)} documents still outstanding` : " — all documents in"}">
      <span class="dv-jacket__box">${rpIcon("folder")}${jkc.missing ? `<b>${esc(jkc.missing)}</b>` : ""}</span>
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
function mCarSvg(v) {
  const color = `hsl(${esc(v.hue)}, 58%, 52%)`;
  return `<svg class="m-carsvg" viewBox="0 0 260 130" aria-hidden="true">
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

route("vehicles/:id", ({ id }) => {
  const deal = id === "browse" ? null : Store.deal(id);
  if (id !== "browse" && !deal) return navigate("#/deals");
  renderChrome("Vehicle Search", "", "");
  document.body.dataset.canvas = "master";

  const makes = [...new Set(RIDE_PRICE_DATA.inventory.map(v => v.make))];
  const bodies = [...new Set(RIDE_PRICE_DATA.inventory.map(v => v.body))];
  const cust = deal ? Store.customer(deal.customerId) : null;
  /* the browse state survives sheet opens but resets on route entry */
  const ui = { type: "All", make: "All", body: "All", maxPrice: null, sort: "hi", search: "", sheet: null };

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

  /* the golden's journey rows, carried over with the app's line icons */
  const JOURNEY = [
    { act: "test", icon: "car", t: "Test Drive", d: "Start the customer test-drive flow" },
    { act: "trade", icon: "swap", t: "Trade Appraisal", d: "Evaluate a trade and proof of ownership" },
    { act: "calc", icon: "dollar", t: "Calculate Payment", d: "Open desking with this vehicle selected" },
    { act: "quote", icon: "page", t: "Quote", d: "Quick Quote is follow-up only during a visit" },
    { act: "savequote", icon: "check", t: "Save Quote", d: "Save this structure for follow-up" }
  ];

  const cardHtml = (v) => `
    <div class="m-vcard" data-detail="${esc(v.stock)}" role="button" tabindex="0" aria-label="${esc(v.year + " " + v.make + " " + v.model)} details">
      <div class="m-photo" style="background:linear-gradient(145deg,hsl(${esc(v.hue)},42%,94%),hsl(${esc(v.hue)},36%,86%))">
        <span class="m-badge">${esc(v.type.toUpperCase())}</span>${mCarSvg(v)}
      </div>
      <div class="m-cardbody">
        <div class="m-cardtitle">${esc(v.year)} ${esc(v.make)} ${esc(v.model)}</div>
        <div class="m-cardtrim">${esc(v.trim)}</div>
        <div class="m-cardmeta">Stock ${esc(v.stock)} · ${esc(v.miles.toLocaleString())} mi · ${esc(v.ext)} · ${esc(v.drive)}</div>
        <div class="m-pricerow"><span class="m-price">${money0(v.selling)}</span>${v.msrp !== v.selling ? `<span class="m-msrp">MSRP ${money0(v.msrp)}</span>` : ""}</div>
        <div class="m-cardhint"><span>View vehicle details</span><span>›</span></div>
      </div>
    </div>`;

  const summaryHtml = (v) => `
    <div class="m-summary">
      <div class="m-thumb" style="background:linear-gradient(145deg,hsl(${esc(v.hue)},42%,94%),hsl(${esc(v.hue)},36%,86%))">${mCarSvg(v)}</div>
      <div><div class="m-sumtitle">${esc(v.year)} ${esc(v.make)} ${esc(v.model)} ${esc(v.trim)}</div>
        <div class="m-summeta">${money0(v.selling)} · Stock ${esc(v.stock)}</div></div>
    </div>`;

  function sheetHtml() {
    const sh = ui.sheet;
    if (!sh) return "";
    if (sh.kind === "details") {
      const v = Store.vehicle(sh.stock);
      return `
      <div class="m-sheettop"><div class="m-sheettitle">Vehicle details</div><button class="m-close" data-sheet-close aria-label="Close">✕</button></div>
      <div class="m-sheetphoto" style="background:linear-gradient(145deg,hsl(${esc(v.hue)},42%,94%),hsl(${esc(v.hue)},36%,86%))">${mCarSvg(v)}</div>
      <h2>${esc(v.year)} ${esc(v.make)} ${esc(v.model)}</h2>
      <div class="m-sheetsub">${esc(v.trim)} · ${esc(v.ext)} · ${esc(v.drive)}</div>
      <div class="m-specgroup">
        <div class="m-specrow"><span>MSRP</span><strong>${money(v.msrp)}</strong></div>
        <div class="m-specrow"><span>Selling price</span><strong>${money(v.selling)}</strong></div>
        ${v.includedOptions ? `<div class="m-specrow"><span>Included options</span><strong>${money(v.includedOptions)}</strong></div>` : ""}
      </div>
      <p class="m-desc">${esc(v.blurb)}</p>
      <p class="m-desc" style="margin-top:0">VIN ${esc(v.vin)} · ${esc(v.engine)} · ${esc(v.mpg)} MPG · ${esc(v.int)} interior · ${esc(v.miles.toLocaleString())} miles</p>
      <div class="m-sheetactions">
        ${deal ? `<button class="m-primary" data-choose="${esc(v.stock)}">Choose this vehicle</button>` : ""}
        <button class="m-ghost" data-sheet-close>Back to inventory</button>
      </div>`;
    }
    if (sh.kind === "next") {
      const v = Store.vehicle(sh.stock);
      return `
      <div class="m-sheettop"><div class="m-sheettitle">What&rsquo;s next?</div><button class="m-close" data-sheet-close aria-label="Close">✕</button></div>
      ${summaryHtml(v)}
      <div class="m-jlist">
        ${JOURNEY.map(j => `<button class="m-jrow" data-act="${j.act}" data-stock="${esc(v.stock)}">
          <span class="m-actionicon">${rpIcon(j.icon)}</span>
          <span><strong>${j.t}</strong><small>${j.d}</small></span>
          <span class="m-chev">›</span></button>`).join("")}
      </div>`;
    }
    if (sh.kind === "quote") {
      const v = Store.vehicle(sh.stock);
      return `
      <div class="m-sheettop"><div class="m-sheettitle">Quote</div><button class="m-close" data-sheet-close aria-label="Close">✕</button></div>
      <div class="m-quoteicon">${rpIcon("page")}</div>
      <h2>Quick Quote is for follow-up only</h2>
      <p class="m-quotecopy">During an active client visit, keep the conversation in the guided deal flow. You can save this ${esc(v.year)} ${esc(v.make)} ${esc(v.model)} structure now and send a quote later.</p>
      ${summaryHtml(v)}
      <div class="m-sheetactions">
        <button class="m-primary" data-act="savequote" data-stock="${esc(v.stock)}">Save quote for follow-up</button>
        <button class="m-textbtn" data-back-next="${esc(v.stock)}">Back to next steps</button>
      </div>`;
    }
    /* filters */
    const opt = (group, val, label) => `<button class="m-opt${ui[group] === val ? " selected" : ""}" data-opt="${esc(group)}" data-val="${esc(val)}">${esc(label)}</button>`;
    return `
      <div class="m-sheettop"><div class="m-sheettitle">Filters</div><button class="m-close" data-sheet-close aria-label="Close">✕</button></div>
      <div class="m-fsection"><h3>Make</h3><div class="m-optgrid">${opt("make", "All", "All")}${makes.map(m => opt("make", m, m)).join("")}</div></div>
      <div class="m-fsection"><h3>Body style</h3><div class="m-optgrid">${opt("body", "All", "All")}${bodies.map(b => opt("body", b, b)).join("")}</div></div>
      <div class="m-fsection"><h3>Max price</h3>
        <div class="m-priceinput"><span>$</span><input type="number" id="mMaxPrice" step="1000" placeholder="No limit" value="${esc(ui.maxPrice || "")}"></div></div>
      <div class="m-fsection"><h3>Sort</h3><div class="m-optgrid">${opt("sort", "hi", "Price: high to low")}${opt("sort", "lo", "Price: low to high")}</div></div>
      <div class="m-ffoot"><button class="m-clearlink" id="mClearAll">Clear all</button><button class="m-primary" data-sheet-close>Show ${filtered().length} vehicle${filtered().length === 1 ? "" : "s"}</button></div>`;
  }

  function render() {
    const list = filtered();
    const fc = filterCount();
    view().innerHTML = `
    <div class="m-app">
      ${masterTop()}
      <div class="m-hero">
        <div class="m-eyebrow">${deal ? "VEHICLE SELECTION" : "INVENTORY"}</div>
        <h1 class="m-h1">${deal ? "Choose a vehicle" : "Browse inventory"}</h1>
      </div>
      ${deal ? `
      <div class="m-context">
        <div class="m-context-copy">
          <div class="m-context-name">${esc(cust.first + " " + cust.last)}</div>
          <div class="m-context-meta">Deal #${esc(deal.dealNo)} · ${deal.stock ? esc(drVehicleShort(Store.vehicle(deal.stock))) + " selected" : "No vehicle selected"}</div>
        </div>
        <span class="m-rolepill">Buyer</span>
      </div>` : `
      <div class="m-banner">
        <strong>Browsing without a visit</strong>
        <p>Test drives, trades, and payments unlock after you start a customer visit — inventory stays open for a look around.</p>
        <button class="m-smallbtn" data-nav="#/customers">Start a customer visit</button>
      </div>`}
      <div class="m-searchwrap">
        <div class="m-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.2-3.2"></path></svg>
          <input id="mSearch" placeholder="Make, model, stock or VIN" value="${esc(ui.search)}" aria-label="Search inventory">
        </div>
      </div>
      <div class="m-chips" role="tablist" aria-label="Vehicle type">
        ${["All", "New", "Used", "CPO"].map(t => `<button class="m-chip${ui.type === t ? " active" : ""}" data-type="${t}" role="tab" aria-selected="${ui.type === t}">${t}</button>`).join("")}
        <button class="m-chip${fc ? " filter-active" : ""}" id="mFilters" aria-label="More filters">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M7 12h10M10 18h4"></path></svg>
          Filters${fc ? ` <span class="m-chipcount">${fc}</span>` : ""}
        </button>
      </div>
      <div class="m-results">
        <div><div class="m-restitle">Available vehicles</div><div class="m-resmeta">${list.length} vehicle${list.length === 1 ? "" : "s"}</div></div>
        <button class="m-sort" id="mSort">Price: ${ui.sort === "hi" ? "high to low" : "low to high"}</button>
      </div>
      ${list.length ? `<div class="m-inv">${list.map(cardHtml).join("")}</div>` : `
      <div class="m-empty">
        <div class="m-emptyicon"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg></div>
        <h2>No vehicles match</h2>
        <p>Nothing in stock fits those filters. Loosen one and the lot opens back up.</p>
        <button class="m-smallbtn" id="mClearEmpty">Clear all filters</button>
      </div>`}
      <div class="m-scrim${ui.sheet ? " show" : ""}" id="mScrim"><div class="m-sheet" role="dialog" aria-modal="true"><div class="m-handle"></div>${sheetHtml()}</div></div>
    </div>`;
    wire();
  }

  const clearAll = () => { ui.type = "All"; ui.make = "All"; ui.body = "All"; ui.maxPrice = null; ui.search = ""; };

  function wire() {
    wireMasterTop();
    const search = $("#mSearch");
    search.oninput = () => {
      ui.search = search.value;
      /* re-render everything below without stealing the keyboard focus */
      const pos = search.selectionStart;
      render();
      const s2 = $("#mSearch"); s2.focus(); s2.setSelectionRange(pos, pos);
    };
    $$(".m-chip[data-type]").forEach(b => b.onclick = () => { ui.type = b.dataset.type; render(); });
    /* [data-nav] is bound once at boot, so anything a route renders needs its
       own binding — the browse banner's button was dead without this */
    $$("[data-nav]", view()).forEach(b => b.onclick = (e) => { e.preventDefault(); navigate(b.dataset.nav); });
    $("#mFilters").onclick = () => { ui.sheet = { kind: "filters" }; render(); };
    $("#mSort").onclick = () => { ui.sort = ui.sort === "hi" ? "lo" : "hi"; render(); };
    $$("[data-detail]").forEach(el => {
      el.onclick = () => { ui.sheet = { kind: "details", stock: el.dataset.detail }; render(); };
      el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } };
    });
    const clearEmpty = $("#mClearEmpty");
    if (clearEmpty) clearEmpty.onclick = () => { clearAll(); render(); };

    /* sheet wiring */
    const scrim = $("#mScrim");
    if (scrim) {
      scrim.onclick = (e) => { if (e.target === scrim) { ui.sheet = null; render(); } };
      $$("[data-sheet-close]").forEach(b => b.onclick = () => { ui.sheet = null; render(); });
    }
    $$("[data-opt]").forEach(b => b.onclick = () => { ui[b.dataset.opt] = b.dataset.opt === "sort" ? b.dataset.val : (ui[b.dataset.opt] === b.dataset.val ? "All" : b.dataset.val); render(); });
    const mp = $("#mMaxPrice");
    if (mp) mp.onchange = () => { ui.maxPrice = parseFloat(mp.value) || null; render(); };
    const clearAllBtn = $("#mClearAll");
    if (clearAllBtn) clearAllBtn.onclick = () => { clearAll(); render(); };

    $$("[data-choose]").forEach(b => b.onclick = () => {
      /* the deal keeps its own vehicle identity from the moment of attachment,
         so the queue's VIN survives an unstocked unit or a catalog change */
      const stock = b.dataset.choose;
      const vsel = Store.vehicle(stock);
      deal.stock = stock;
      deal.vehicle = vsel ? { vin: vsel.vin, stock: vsel.stock } : { vin: null, stock };
      Store.save();
      ui.sheet = { kind: "next", stock };
      render();
    });
    const backNext = $("[data-back-next]");
    if (backNext) backNext.onclick = () => { ui.sheet = { kind: "next", stock: backNext.dataset.backNext }; render(); };

    $$("[data-act]").forEach(btn => btn.onclick = () => {
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
  /* Escape closes whichever sheet is up; the listener leaves with the route
     (the leak pattern review caught twice on the client sheets) */
  const mOnKey = (e) => { if (e.key === 'Escape' && ui.sheet) { ui.sheet = null; render(); } };
  document.addEventListener('keydown', mOnKey);
  const mCleanup = () => { document.removeEventListener('keydown', mOnKey); window.removeEventListener('hashchange', mCleanup); };
  window.addEventListener('hashchange', mCleanup);
});

/* ============================================================
   VIEW: Test Drive
   ============================================================ */
route("testdrive/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const v = Store.vehicle(deal.stock);
  const c = Store.customer(deal.customerId);
  const td = deal.testDrive;

  renderChrome("Test Drive Agreement", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/vehicles/${esc(deal.id)}">← Vehicle Search</a>`);

  function phaseAuth() {
    view().innerHTML = `
      <div class="panel panel--navyhead">
        <div class="panel__head"><h2>Authorization of Electronic Signature</h2></div>
        <div class="panel__body">
          <p class="small">As part of the purchase/lease of this vehicle <b>${esc(v.year)} ${esc(v.make)} ${esc(v.model)} / ${esc(v.vin)} / ${esc(v.stock)}</b>, the documents checked below apply to this transaction.</p>
          <p class="flex"><span class="badge badge--approved">✓ Included</span> <b style="font-size:13.5px">Test Drive Agreement</b></p>
          <div class="note note--wt"><span class="lab">Word track</span>“You'll find many of the things we do here are different from traditional dealerships; and one of the ways we're different is by using electronic signatures. These are legally binding signatures just like ink signatures, and you're authorizing the use of your electronic signature.”</div>
          <div class="radio-row">
            <label><input type="radio" name="docdel"> Email at the following address</label>
            <label><input type="radio" name="docdel" checked> Printed documents</label>
          </div>
          <div class="grid grid--2">
            <div>
              <label class="f"><span class="lab">Type buyer name</span><input type="text" id="sigName" value="${esc(c.first + " " + c.last)}"></label>
              <span class="lab" style="font-size:12px;font-weight:700;color:var(--ink)">Review your signature</span>
              <div class="sig-box" id="sigPreview">${esc(c.first + " " + c.last)}</div>
              <label class="opt-row mt">
                <input type="checkbox" id="sigAck">
                <span class="opt-row__label">I understand that checking this box constitutes a legal signature confirming that I acknowledge and agree to the above Terms of Acceptance.</span></label>
            </div>
          </div>
          <div class="right mt"><button class="btn btn--grad" id="authNext">Continue →</button></div>
        </div>
      </div>`;
    $("#sigName").oninput = (e) => { $("#sigPreview").textContent = e.target.value; };
    $("#authNext").onclick = () => {
      if (!$("#sigAck").checked) return toast("The client must check the acknowledgement box");
      td.authSigned = true; td.sigName = $("#sigName").value; Store.save(); render();
    };
  }

  function phaseAgreement() {
    view().innerHTML = `
      <div class="grid grid--2">
        <div class="panel">
          <div class="panel__head"><h2>Customer Info</h2>
            <div class="right"><button class="btn btn--sm btn--ghost" id="tdScan">🪪 Scan license</button></div></div>
          <div class="panel__body">
            <div class="fields">
              <label class="f"><span class="lab">Driver's License # <i class="req">*</i></span><input type="text" id="dl" value="${esc(td.license || (c.license && c.license.number) || "")}" placeholder="987654321"></label>
              <label class="f"><span class="lab">Issuing State</span><input type="text" id="dlState" value="${esc(td.issuingState || (c.license && c.license.state) || c.state)}"></label>
              <label class="f"><span class="lab">Expiration Date</span><input type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" id="dlExp" value="${esc(dateUS(td.expDate || (c.license && c.license.expires) || ""))}"></label>
              <label class="f"><span class="lab">Additional Driver(s)</span><input type="text" id="addl" value="${esc(td.addlDriver || "")}" placeholder="Name – license #"></label>
              <label class="f"><span class="lab">Insurance Company</span><input type="text" id="ins" value="${esc(td.insurance || "")}" placeholder="Ask for auto insurance co."></label>
              <label class="f"><span class="lab">Mileage you will be driving</span><input type="number" id="tdMiles" value="${td.miles || 20}"></label>
            </div>
            <h2 style="font-size:13px;text-transform:uppercase;color:var(--navy);letter-spacing:.5px">Return Agreement</h2>
            <div class="flex mt">
              <button class="btn btn--primary btn--sm" id="drv1">Sign &amp; Accept Terms — Driver One</button>
              <span id="drv1ok" class="badge badge--approved" style="display:${td.signed ? "inline-block" : "none"}">Signed</span>
            </div>
            <label class="f mt"><span class="lab">Advisor signature</span></label>
            <div class="sig-box">${esc(Store.s.advisor)}</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel__head"><h2>Terms &amp; Conditions</h2></div>
          <div class="panel__body small" style="max-height:430px;overflow:auto">
            <p>I have requested that the Dealership permit me to test drive the above-described vehicle for demonstration purposes, subject to the following terms and conditions:</p>
            <ol>${RIDE_PRICE_DATA.testDriveTerms.map(t => `<li style="margin:8px 0">${esc(t)}</li>`).join("")}</ol>
          </div>
        </div>
      </div>
      <div class="flex mt">
        <button class="btn btn--ghost" id="printTd">🖨 Print for extended drive</button>
        <div class="push"></div>
        <button class="btn btn--grad" id="tdNext">Next →</button>
      </div>
      <p class="note">Verify client information against their driver license. Ensure the address is current, and add their auto insurance company to the agreement.</p>`;
    $("#tdScan").onclick = () => openScanFlow({
      mode: "testdrive", deal,
      onDone: (cust, persona) => {
        const dl = $("#dl"); if (!dl) return; /* view navigated away mid-scan */
        dl.value = persona.license.number;
        $("#dlState").value = persona.license.state;
        $("#dlExp").value = dateUS(persona.license.expires);
        toast("License captured — verify the details against the card");
      }
    });
    $("#drv1").onclick = () => {
      if (!$("#dl").value.trim()) return toast("Enter the driver's license #");
      td.signed = true; $("#drv1ok").style.display = "inline-block"; Store.save(); toast("Terms signed & accepted");
    };
    $("#printTd").onclick = () => window.print();
    $("#tdNext").onclick = () => {
      if (!td.signed) return toast("Driver One must sign & accept the terms first");
      const expText = $("#dlExp").value.trim();
      const expDate = expText ? dateISO(expText) : "";
      if (expText && !expDate) return toast("Enter a valid expiration date (MM/DD/YYYY)");
      td.license = $("#dl").value; td.issuingState = $("#dlState").value; td.expDate = expDate;
      td.addlDriver = $("#addl").value; td.insurance = $("#ins").value; td.miles = parseInt($("#tdMiles").value, 10) || 20;
      td.started = true; Store.save(); render();
    };
  }

  function phaseDrive() {
    view().innerHTML = `
      <div class="panel panel--navyhead">
        <div class="panel__head"><h2>Test Drive In Progress</h2><div class="right"><span class="badge badge--prog">🚗 out on the road</span></div></div>
        <div class="panel__body center" style="padding:44px 20px">
          <div style="font-size:64px">${v.emoji}</div>
          <h3 style="color:var(--navy);margin:8px 0 2px">${esc(v.year)} ${esc(v.make)} ${esc(v.model)} ${esc(v.trim)}</h3>
          <p class="small">Stock ${esc(v.stock)} · started odometer ${esc(v.miles.toLocaleString())} mi</p>
          <button class="btn btn--grad" id="endBtn" style="margin-top:14px">End Test Drive</button>
        </div>
      </div>`;
    $("#endBtn").onclick = () => {
      modal("End Test Drive", `
        <label class="f"><span class="lab">Current odometer reading</span><input type="number" id="endMiles" value="${v.miles + (td.miles || 20)}"></label>`,
        `<button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--primary" id="completeTd">Complete Test Drive</button>`);
      $("#completeTd").onclick = () => {
        td.completedMiles = parseInt($("#endMiles").value, 10) || 0;
        td.done = true; Store.save(); closeModal(); render();
      };
    };
  }

  function phaseDone() {
    view().innerHTML = `
      <div class="panel">
        <div class="panel__head"><h2>Test Drive Complete</h2><div class="right"><span class="badge badge--approved">✓ Completed</span></div></div>
        <div class="panel__body center" style="padding:36px 20px">
          <p>How did they like the <b>${esc(v.year)} ${esc(v.make)} ${esc(v.model)}</b>?</p>
          <div class="note note--wt" style="text-align:left"><span class="lab">Next move</span>Give a proper introduction to your team lead. If there is a trade, run the trade evaluation — otherwise go straight to Calculate Payment.</div>
          <div class="flex" style="justify-content:center;margin-top:18px">
            <a class="btn btn--primary" href="#/trade/${esc(deal.id)}">Trade Evaluation</a>
            <a class="btn btn--grad" href="#/desk/${esc(deal.id)}" id="toDesk">Calculate Payment →</a>
          </div>
        </div>
      </div>`;
    $("#toDesk").onclick = () => { if (deal.stage === "testdrive") { deal.stage = "desking"; Store.save(); } };
  }

  function render() {
    if (!td.authSigned) phaseAuth();
    else if (!td.started) phaseAgreement();
    else if (!td.done) phaseDrive();
    else phaseDone();
  }
  render();
});

/* ============================================================
   VIEW: Trade Evaluation
   ============================================================ */
/* ---- trade proof of ownership (owner rules, 2026-08-15) ----
   Every trade needs acceptable proof of ownership: the title, or a duplicate
   title process under way; a lien release when the title shows a lien and the
   vehicle is paid off, or a valid payoff when it is not; and authorization
   when the person trading is not the titled owner.
   Gaps never block the advisor — they surface to the manager at sign-off. */
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

  const o = ownOf(deal);
  /* tri-state: unrecorded is a real answer here — "we never asked" is not
     the same as "no", and both are gaps until proven otherwise */
  const triSel = (id, val) => `<select id="${id}" data-ui="seg">    <option value="" ${val === true || val === false ? "" : "selected"}>—</option>    <option value="yes" ${val === true ? "selected" : ""}>Yes</option>    <option value="no" ${val === false ? "selected" : ""}>No</option></select>`;

  renderChrome("Trade-In Evaluation", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/desk/${esc(deal.id)}">Skip → Calculate Payment</a>`);

  view().innerHTML = `
    <div class="panel panel--navyhead">
      <div class="panel__head"><h2>Interactive Trade Evaluation</h2></div>
      <div class="panel__body">
        <div class="note note--wt"><span class="lab">Set the stage</span>“We will obtain your vehicle's VIN and the actual mileage. This allows our evaluator to access all book values, auction values, and most importantly, true market values of vehicles for sale just like yours. We invite you to join us for an interactive walk-around of your vehicle and a short drive — after all, who knows your car better than you?”</div>
        <div class="fields">
          <label class="f"><span class="lab">Trade vehicle (year make model)</span><input type="text" id="tDesc" value="${esc(deal.trade.desc || "")}" placeholder="2018 Hyundai Tucson"></label>
          <label class="f"><span class="lab">VIN <span class="lab-note" id="tVinHint"></span></span><input type="text" id="tVin" value="${esc(deal.trade.vin || "")}" placeholder="KM8TRAININGSAMP06" maxlength="17" autocapitalize="characters" autocomplete="off" spellcheck="false"></label>
          <label class="f"><span class="lab">Model year</span><input type="number" id="tYear" value="${deal.trade.year || 2018}" min="1998" max="2026"></label>
          <label class="f"><span class="lab">Mileage</span><input type="number" id="tMiles" value="${deal.trade.miles || 60000}"></label>
          <label class="f"><span class="lab">Condition</span><select id="tCond" data-ui="seg">
            ${["Excellent", "Good", "Fair", "Rough"].map(o => `<option ${deal.trade.condition === o ? "selected" : ""}>${o}</option>`).join("")}</select></label>
          <label class="f"><span class="lab">Payoff amount (if financed)</span><span class="minput"><input type="number" id="tPayoff" value="${esc(String(deal.trade.payoff || 0))}" step="100"></span></label>
        </div>
        <button class="btn btn--primary" id="evalBtn">Run Evaluation</button>
        <div id="evalOut" class="mt"></div>
      </div>
    </div>
    <div class="panel">
      <div class="panel__head"><h2>Proof of Ownership</h2></div>
      <div class="panel__body">
        <p class="small">The dealership must hold acceptable proof of ownership before it can accept a trade. Anything missing is flagged to a manager at sign-off — it never stops you working the deal.</p>
        <div class="fields">
          <label class="f"><span class="lab">Title in hand?</span>${triSel("oTitle", o.titleInHand)}</label>
          <label class="f" id="wDup"><span class="lab">Duplicate title process started?</span>${triSel("oDup", o.duplicateStarted)}</label>
          <label class="f"><span class="lab">Does the title show a lienholder?</span>${triSel("oLien", o.lienOnTitle)}</label>
          <label class="f" id="wPaid"><span class="lab">Is the vehicle paid off?</span>${triSel("oPaid", o.paidOff)}</label>
          <label class="f" id="wRel"><span class="lab">Lien release received?</span>${triSel("oRel", o.lienReleaseReceived)}</label>
          <label class="f" id="wPay"><span class="lab">Valid payoff received?</span>${triSel("oPay", o.payoffReceived)}</label>
          <label class="f" id="wGood"><span class="lab">Payoff good through</span><input type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" id="oGood" value="${esc(dateUS(o.payoffGoodThrough || ""))}"></label>
          <label class="f"><span class="lab">Is the person trading the titled owner?</span>${triSel("oOwner", o.isTitledOwner)}</label>
          <label class="f" id="wAuth"><span class="lab">Trade authorization / power of attorney received?</span>${triSel("oAuth", o.authorizationReceived)}</label>
        </div>
        <div id="ownOut" class="mt"></div>
      </div>
    </div>
    <p class="note">Transparency wins: keep documents reflecting current market value and any reconditioning needed. Get your manager involved when questions arise.</p>`;

  /* ---- proof of ownership ---- */
  const triGet = (id) => { const v = $("#" + id).value; return v === "yes" ? true : v === "no" ? false : undefined; };
  function syncOwnership() {
    const own = deal.trade.ownership = deal.trade.ownership || {};
    own.titleInHand = triGet("oTitle");
    own.duplicateStarted = triGet("oDup");
    own.lienOnTitle = triGet("oLien");
    own.paidOff = triGet("oPaid");
    own.lienReleaseReceived = triGet("oRel");
    own.payoffReceived = triGet("oPay");
    own.isTitledOwner = triGet("oOwner");
    own.authorizationReceived = triGet("oAuth");
    const gt = $("#oGood").value.trim();
    own.payoffGoodThrough = gt ? dateISO(gt) : "";
    Store.save();
    /* only ask what the previous answer makes relevant */
    const show = (wrap, on) => { const el = $("#" + wrap); if (el) el.style.display = on ? "" : "none"; };
    show("wDup", own.titleInHand === false);
    show("wPaid", own.lienOnTitle === true);
    show("wRel", own.lienOnTitle === true && own.paidOff === true);
    show("wPay", own.lienOnTitle === true && own.paidOff === false);
    show("wGood", own.lienOnTitle === true && own.paidOff === false && own.payoffReceived === true);
    show("wAuth", own.isTitledOwner === false);
    renderOwnershipSummary();
  }
  function renderOwnershipSummary() {
    const gaps = deal.trade.has ? tradeOwnershipGaps(deal) : [];
    const forms = requiredTradeForms(deal);
    const formNames = forms.map(fid => (RIDE_PRICE_DATA.dealForms.find(f => f.id === fid) || {}).label).filter(Boolean);
    $("#ownOut").innerHTML = !deal.trade.has
      ? `<p class="hint">Run the evaluation to record this trade, then these answers count towards sign-off.</p>`
      : gaps.length
        ? `<div class="note note--wt"><span class="lab">Flagged to a manager at sign-off</span><ul class="checks">${gaps.map(g => `<li class="bad">${esc(g)}</li>`).join("")}</ul>` +
          (formNames.length ? `<p class="small" style="margin:10px 0 0">Required paperwork: <b>${formNames.map(esc).join(", ")}</b> — selected and locked on the deal forms step.</p>` : "") + `</div>`
        : `<div class="note"><ul class="checks"><li>Proof of ownership complete — nothing to flag</li></ul>` +
          (formNames.length ? `<p class="small" style="margin:10px 0 0">Required paperwork: <b>${formNames.map(esc).join(", ")}</b>.</p>` : "") + `</div>`;
  }
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

  ["oTitle", "oDup", "oLien", "oPaid", "oRel", "oPay", "oOwner", "oAuth"].forEach(id => {
    const el = $("#" + id); if (el) el.onchange = syncOwnership;
  });
  $("#oGood").onchange = syncOwnership;
  syncOwnership();

  $("#evalBtn").onclick = () => {
    const year = parseInt($("#tYear").value, 10) || 2018;
    const miles = parseInt($("#tMiles").value, 10) || 60000;
    const cond = $("#tCond").value;
    const factor = { Excellent: 1.06, Good: 1.0, Fair: 0.9, Rough: 0.78 }[cond] || 1;
    const base = Math.max(1500, 30000 - (2026 - year) * 2100 - miles * 0.055);
    const value = Math.round(base * factor / 50) * 50;
    const payoff = parseFloat($("#tPayoff").value) || 0;
    deal.trade = Object.assign(deal.trade, {
      has: true, desc: $("#tDesc").value, vin: $("#tVin").value, year, miles, condition: cond, value, payoff,
      rebates: deal.trade.rebates || 0, applyTaxCredit: true
    });
    Store.save();
    renderOwnershipSummary();
    const equity = value - payoff;
    $("#evalOut").innerHTML = `
      <div class="pay-hero" style="max-width:420px">
        <span class="lab">Evaluated Trade Value</span>
        <div class="amt">${money0(value)}</div>
        <span class="sub">Payoff ${money0(payoff)} → ${equity >= 0 ? "positive equity " + money0(equity) : "negative equity " + money0(equity)}</span>
      </div>
      <div class="flex mt"><a class="btn btn--grad" href="#/desk/${esc(deal.id)}" id="toDesk2">Calculate Payment →</a></div>`;
    $("#toDesk2").onclick = () => { if (["vehicle", "testdrive"].includes(deal.stage)) { deal.stage = "desking"; Store.save(); } };
    toast("Trade value saved to the deal");
  };
});

/* ============================================================
   VIEW: Calculate Payments (desking)
   ============================================================ */
/* Audit RP-UI-001: on a phone the pencil is a long column and the Monthly
   Payment hero sat 822px below the fold while Continue lived at the top.
   This bar pins the live number and the forward action together. It renders
   inside the view, which render() rewrites on every change, so it can never
   drift from the hero above it. Since the prototype round (2026-08-27) it
   shows at every width, styled as the neutral blur bar in the centred column. */
function deskStickyBar(r, isCash, isLease, deal) {
  const label = isCash ? "Total due" : deal.dealType === "onepay" ? "Due at signing" : "Estimated payment";
  const amount = isCash ? money(r.totalDue) : deal.dealType === "onepay" ? money(r.onePayTotal) : money(r.payment);
  const unit = isCash || deal.dealType === "onepay" ? "total" : "/ mo";
  return `<div class="desk-sticky">
    <div class="desk-sticky__copy"><span>${esc(label)}</span>
      <div class="desk-sticky__val"><b>${esc(amount)}</b><span class="desk-sticky__unit">${unit}</span></div></div>
    <button type="button" class="btn btn--grad desk-sticky__go" id="deskContinueSticky">Continue</button>
  </div>`;
}

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

  const PAY_TRACKS = {
    finance: { q: "Is there an incentivized rate, or is a rebate better?", wt: "“Can we arrange your financing on your behalf?”" },
    lease: { q: "Do they trade frequently? Are they a low-mileage driver?", wt: "“Have you ever considered leasing?”" },
    cash: { q: "Will they be writing a check or obtaining a cashier's check?", wt: "“Where will we be sending the title?”" },
    onepay: { q: "Low-mileage driver who hates monthly payments?", wt: "“Have you ever considered a one-pay lease?”" }
  };

  function renderHuddle() {
    const h = deal.huddle;
    const paying = h.paying || deal.dealType;
    renderChrome("Base Payment Huddle", dealTitle(deal, true), "");
    document.body.dataset.screen = "desk"; /* the prototype has one header — the flow carries the title */
    document.body.dataset.canvas = "master";
    /* the owner's desking prototype (2026-08-27), 1:1: eyebrow → h1 → deal
       meta → chips, then one bordered section per question. The RP accent
       lives ONLY on the two notice banners and the primary action; toggles,
       inputs and choice cards keep the neutral default grammar. */
    view().innerHTML = `${deskTop(deal)}
    <div class="dk-wrap">
      <div class="dk-headrow"><div class="dk-eyebrow" style="margin:0">FIRST PENCIL</div>${h.done ? `<button type="button" class="dk-linkbtn" id="huddleCancel">Back to the pencil</button>` : ""}</div>
      <h1>Get the game plan aligned.</h1>
      <div class="dk-meta"><b>${esc(c.first + " " + c.last)}</b> · ${esc(v.year + " " + v.make + " " + v.model)} ${esc(v.trim || "")}<br>Before showing numbers, confirm how the customer wants to buy.</div>
      <div class="dk-chips">
        <button type="button" class="dk-chip" data-buyers="${esc(deal.id)}">${rpIcon("user")} Buyer</button>
        <a class="dk-chip" href="#/jacket/${esc(deal.id)}">${rpIcon("folder")} Jacket ${jacketCounts(deal).missing ? `<b>${jacketCounts(deal).missing}</b>` : ""}</a>
      </div>

      <div class="dk-section">
        <div class="dk-sechead"><h2 class="dk-h2">What was the answer to the trial close?</h2>
          <p class="dk-subline">Capture the customer&rsquo;s words, not an interpretation.</p></div>
        <input type="text" id="hTrial" class="dk-input" value="${esc(h.trialClose || "")}" placeholder="e.g. If the numbers make sense, we'd take it today.">
      </div>

      <div class="dk-section">
        <div class="dk-sechead"><h2 class="dk-h2">How are they paying?</h2>
          <p class="dk-subline">This choice unlocks the first pencil.</p></div>
        <div class="dk-choices" id="hPayRow" role="radiogroup" aria-label="How are they paying">
          ${Object.entries(DEAL_TYPES).map(([k, l]) => `<button type="button" class="dk-choice${paying === k ? " active" : ""}" data-pay="${k}" role="radio" aria-checked="${paying === k}"><span>${esc(l)}</span><span class="dot"></span></button>`).join("")}
        </div>
      </div>

      <div class="dk-section">
        <div class="dk-notice" id="hPayTrack"><strong>Discovery question</strong>${PAY_TRACKS[paying].q} ${PAY_TRACKS[paying].wt}</div>
        <div class="dk-card dk-card--pad" style="margin-top:14px">
          <div class="dk-switchrow">
            <div class="dk-switchcopy">Trade evaluation needed${deal.trade.has && deal.trade.value ? `<small>Current documented trade: ${money0(deal.trade.value)}</small>` : ""}</div>
            <label class="switch"><input type="checkbox" id="hTrade" ${h.trade != null ? (h.trade ? "checked" : "") : (deal.trade.has ? "checked" : "")} aria-label="Trade evaluation needed"><span class="sl"></span></label>
          </div>
          <div class="dk-switchrow">
            <div class="dk-switchcopy">Vehicle is in stock today<small>${esc(v.year + " " + v.make + " " + v.model)} · Stock ${esc(v.stock)}</small></div>
            <label class="switch"><input type="checkbox" id="hStock" ${h.inStock === false ? "" : "checked"} aria-label="Vehicle is in stock today"><span class="sl"></span></label>
          </div>
        </div>
      </div>

      <div class="dk-section">
        <label class="dk-lab" for="hNotes">Anything else before the pencil?</label>
        <textarea id="hNotes" class="dk-textarea" placeholder="Objections, must-haves, co-buyer, timing…">${esc(h.notes || "")}</textarea>
      </div>

      <div class="dk-section">
        <div class="dk-notice"><strong>Team Lead + Advisor</strong>Game plan the first pencil together before any numbers are shown.</div>
        <div class="dk-actions">
          <a class="dk-secondary" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none" href="#/trade/${esc(deal.id)}">Trade evaluation</a>
          <button type="button" class="dk-primary" id="hConfirm">Game plan the pencil</button>
        </div>
      </div>
    </div>`;

    let payingSel = paying;
    $$("#hPayRow [data-pay]").forEach(b => b.onclick = () => {
      payingSel = b.dataset.pay;
      $$("#hPayRow [data-pay]").forEach(x => { x.classList.toggle("active", x === b); x.setAttribute("aria-checked", String(x === b)); });
      const t = PAY_TRACKS[payingSel];
      $("#hPayTrack").innerHTML = `<strong>Discovery question</strong>${t.q} ${t.wt}`;
    });
    wireDeskTop();
    const cancel = $("#huddleCancel");
    if (cancel) cancel.onclick = () => render();
    $("#hConfirm").onclick = () => {
      Object.assign(deal.huddle, {
        done: true, at: new Date().toISOString(),
        by: `${Store.s.advisor} + ${RIDE_PRICE_DATA.dealership.teamLead}`,
        trialClose: $("#hTrial").value.trim(),
        paying: payingSel,
        trade: $("#hTrade").checked,
        inStock: $("#hStock").checked,
        notes: $("#hNotes").value.trim()
      });
      deal.dealType = payingSel;
      Store.save();
      toast("Game plan set — pencil unlocked as " + DEAL_TYPES[payingSel]);
      render();
    };
  }

  /* which accordions are open survives the full re-render each change makes;
     the prototype opens Vehicle price and Payment terms by default */
  const ui = { open: { price: true, terms: true, accessories: false, trade: false, credit: false, taxes: false, script: false } };

  function render() {
    renderChrome("Calculate Payments", dealTitle(deal, true),
      `<button class="btn btn--ghost btn--sm" id="huddleBtn">Huddle</button>
       <button class="btn btn--grad btn--sm" id="deskContinue">Continue</button>`);
    document.body.dataset.screen = "desk";
    document.body.dataset.canvas = "master";
    $("#huddleBtn").onclick = () => renderHuddle();
    const r = RIDE_PRICE_CALC.calc(deal, v);
    const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
    const isCash = deal.dealType === "cash";
    const score = c.creditScore || 700;
    const tier = RIDE_PRICE_CALC.creditTier(score);
    const accTotal = r.accessories;
    const accCount = deal.desk.accessories.length;

    /* the hero states the figure the deal type actually produces */
    const heroLabel = isCash ? "Estimated total due" : deal.dealType === "onepay" ? "Due at signing — One Pay" : "Estimated monthly payment";
    const heroAmt = isCash ? money(r.totalDue) : deal.dealType === "onepay" ? money(r.onePayTotal) : money(r.payment);
    const heroUnit = isCash || deal.dealType === "onepay" ? "" : `<span class="unit">/mo</span>`;
    const heroSub = isCash ? "Cash purchase · trade and rebate applied"
      : isLease ? `${r.term} months · ${r.miles.toLocaleString()} mi/yr · ${money0(deal.desk.dueAtSigning)} due at signing`
      : `${r.term} months · ${r.apr}% APR · ${money0(deal.desk.downPayment)} down`;

    const acc = (key, label, sum, body, extra) => `
      <details class="dk-acc" data-acc-key="${key}" ${ui.open[key] ? "open" : ""}>
        <summary>${label}${sum ? ` <span class="dk-accsum">${sum}</span>` : ""}</summary>
        <div class="dk-accbody${extra || ""}">${body}</div>
      </details>`;
    const row = (label2, val, cls) => `<div class="row${cls ? " " + cls : ""}"><span>${label2}</span><b class="amt">${val}</b></div>`;

    view().innerHTML = `${deskTop(deal)}
    <div class="dk-wrap">
      <div class="dk-eyebrow">DESKING</div>
      <div class="dk-headrow">
        <div><h1 style="margin-bottom:7px">Calculate payments</h1>
          <div class="dk-meta" style="margin:0"><b>${esc(c.first + " " + c.last)}</b> · ${esc(v.year + " " + v.make + " " + v.model)} ${esc(v.trim || "")}</div></div>
        <button type="button" class="dk-linkbtn" id="dkHuddleLink">Huddle</button>
      </div>

      <div class="dk-chips" style="margin-top:18px">
        <button type="button" class="dk-chip" data-buyers="${esc(deal.id)}">${rpIcon("user")} Buyer</button>
        <a class="dk-chip" href="#/jacket/${esc(deal.id)}">${rpIcon("folder")} Jacket ${jacketCounts(deal).missing ? `<b>${jacketCounts(deal).missing}</b>` : ""}</a>
      </div>

      <div class="dk-seg" id="dkTypes" role="tablist" aria-label="Deal type">
        ${Object.entries(DEAL_TYPES).map(([k, l]) => `<button type="button" data-type="${k}" class="${deal.dealType === k ? "active" : ""}" role="tab" aria-selected="${deal.dealType === k}">${esc(l)}</button>`).join("")}
      </div>

      <div class="dk-vehicle">
        <div class="dk-vehicle-art" style="background:linear-gradient(145deg,hsl(${esc(v.hue)},42%,94%),hsl(${esc(v.hue)},36%,86%))" aria-hidden="true">${mCarSvg(v)}</div>
        <div><h3>${esc(v.year + " " + v.make + " " + v.model)} ${esc(v.trim || "")}</h3>
          <p>Stock ${esc(v.stock)} · VIN ${esc(v.vin)}</p>
          <p>Your price ${money0(r.yourPrice)}</p></div>
      </div>

      <div class="dk-hero pay-hero">
        <div class="hero-top"><span>${heroLabel}</span><span>${esc(tier.label)} credit</span></div>
        <div class="amt">${heroAmt}${heroUnit}</div>
        <div class="sub">${heroSub}</div>
        <div class="acts">
          <button type="button" class="dk-secondary" id="dkCompare">Compare</button>
          <button type="button" class="dk-secondary" id="dkEditTerms">Edit terms</button>
        </div>
      </div>

      <div class="dk-section" style="padding-top:0">
        ${acc("price", "Vehicle price", null, `<div class="dk-prices">
          ${row("MSRP", money(v.msrp))}
          ${row("Selling price", money(v.selling))}
          ${row("Included options", money(v.includedOptions))}
          ${row("Accessories", money(accTotal))}
          ${row("Your price", money(r.yourPrice), "total")}
          ${isLease ? row("Residual", money(r.residual)) + row("Residual %", (r.residualPct * 100).toFixed(1) + "%") : ""}
        </div>`, " dk-prices")}

        ${acc("accessories", "Accessories", `${accCount} selected · ${money0(accTotal)}`, RIDE_PRICE_DATA.accessories.map(a => `
          <div class="dk-accessory"><label><input type="checkbox" data-acc="${a.id}" ${deal.desk.accessories.includes(a.id) ? "checked" : ""}>${esc(a.name)}</label><b>${money0(a.price)}</b></div>`).join(""))}

        ${acc("trade", "Trade & rebates", deal.trade.rebates ? money0(deal.trade.rebates) + " rebate" : (deal.trade.value ? money0(deal.trade.value) + " trade" : "none"), `
          <div class="dk-2col">
            <div><label class="dk-lab">Trade value</label><div class="dk-moneywrap"><input id="tradeVal" class="dk-money" type="number" step="100" value="${esc(String(deal.trade.value || 0))}"></div></div>
            <div><label class="dk-lab">Trade payoff</label><div class="dk-moneywrap"><input id="tradePay" class="dk-money" type="number" step="100" value="${esc(String(deal.trade.payoff || 0))}"></div></div>
          </div>
          <div class="dk-2col" style="margin-top:14px">
            <div><label class="dk-lab">Rebate</label><div class="dk-moneywrap"><input id="rebates" class="dk-money" type="number" step="100" value="${esc(String(deal.trade.rebates || 0))}"></div></div>
            <div style="display:flex;align-items:flex-end"><div class="dk-switchrow" style="width:100%;padding:0 0 9px">
              <div class="dk-switchcopy" style="font-size:13px">Apply tax credit</div>
              <label class="switch"><input type="checkbox" id="taxCredit" ${deal.trade.applyTaxCredit ? "checked" : ""} aria-label="Apply tax credit"><span class="sl"></span></label>
            </div></div>
          </div>
          <p style="margin:14px 0 0"><a class="dk-linkbtn" href="#/trade/${esc(deal.id)}">Import Trade</a></p>`)}

        ${acc("terms", "Payment terms", null, isCash
          ? `<div class="dk-notice"><strong>Cash purchase</strong>No finance term is needed. Trade, rebate, taxes and fees are reflected in the total due.</div>`
          : isLease ? `
          <div class="dk-2col">
            <div><label class="dk-lab">Term</label><div class="dk-3col" id="dkLeaseTerms">${RIDE_PRICE_DATA.leaseTerms.map(t => `<button type="button" class="dk-opt${deal.desk.leaseTerm === t ? " active" : ""}" data-lterm="${t}">${t}</button>`).join("")}</div></div>
            <div><label class="dk-lab">Miles / year</label><div class="dk-3col" id="dkMiles">${RIDE_PRICE_DATA.milesOptions.map(m2 => `<button type="button" class="dk-opt${deal.desk.milesPerYear === m2 ? " active" : ""}" data-miles="${m2}">${m2 / 1000}k</button>`).join("")}</div></div>
          </div>
          ${deal.dealType === "lease" ? `<div style="margin-top:14px"><label class="dk-lab">Due at signing</label><div class="dk-moneywrap"><input id="das" class="dk-money" type="number" step="100" value="${esc(String(deal.desk.dueAtSigning))}"></div></div>` : ""}
          <div class="dk-prices" style="margin-top:14px">
            ${row("Lease Factor", (deal.dealType === "onepay" ? Math.max(0.00001, deal.desk.leaseFactor - 0.0004) : deal.desk.leaseFactor).toFixed(5))}
            ${row("Acquisition Fee", money(RIDE_PRICE_DATA.leaseFees.acquisition))}
            ${row("Security Deposit", "$0.00")}
            ${row("Disposition Fee (at lease end)", money(RIDE_PRICE_DATA.leaseFees.disposition))}
          </div>` : `
          <label class="dk-lab">Term</label>
          <div class="dk-3col" id="dkFinTerms">${RIDE_PRICE_DATA.financeTerms.map(t => `<button type="button" class="dk-opt${deal.desk.term === t ? " active" : ""}" data-term="${t}">${t}</button>`).join("")}</div>
          <div class="dk-2col" style="margin-top:14px">
            <div><label class="dk-lab">APR %</label><input id="apr" class="dk-input" type="number" step="0.1" value="${deal.desk.apr}"></div>
            <div><label class="dk-lab">Down payment</label><div class="dk-moneywrap"><input id="down" class="dk-money" type="number" step="100" value="${esc(String(deal.desk.downPayment))}"></div></div>
          </div>
          <label class="dk-lab" style="margin-top:14px">Days to first payment</label>
          <div class="dk-3col" id="dkDtf">${[30, 45, 60].map(d2 => `<button type="button" class="dk-opt${deal.desk.daysToFirst === d2 ? " active" : ""}" data-days="${d2}">${d2}</button>`).join("")}</div>`)}

        ${acc("credit", "Estimated credit score", `${score} · ${esc(tier.label)}`, `
          <div class="credit-bar">
            <div class="bar">
              <input type="range" min="450" max="850" step="5" value="${score}" id="scoreRange" class="score-range" aria-label="Estimated credit score">
            </div>
            <div class="cap"><span>450</span><b style="color:var(--ink)">${score} · ${esc(tier.label)}</b><span>850</span></div>
          </div>
          <div style="font-size:12px;color:var(--muted);margin-top:10px">Based on the credit the client provided — never assume.</div>`)}

        ${acc("taxes", "Taxes & fees", null, `<div class="dk-prices">
          ${r.taxes.rows.map(t => row(esc(t.label), money(t.amount))).join("")}
          ${row("Total Fees", money(RIDE_PRICE_CALC.totalFees()))}
          ${!isCash && !isLease ? row("Amount Financed", money(r.amountFinanced), "total") : ""}
        </div>`)}

        ${acc("script", "Advisor word track", null, `<div class="dk-wordtrack">
          <div class="label">BASE PAYMENT WORD TRACK</div>
          <div>${wordTrack(r)}</div>
          <div class="stop">🤫 Stop talking. Wait for your client to respond.</div>
        </div>`)}
      </div>
      ${deskStickyBar(r, isCash, isLease, deal)}
    </div>
    ${compareSheetHtml()}`;

    /* accordion open-state survives the redraw each change triggers */
    $$("details.dk-acc", view()).forEach(d2 => d2.addEventListener("toggle", () => { ui.open[d2.dataset.accKey] = d2.open; }));

    /* bindings */
    $("#dkHuddleLink").onclick = () => renderHuddle();
    $$("#dkTypes [data-type]").forEach(b => b.onclick = () => { deal.dealType = b.dataset.type; Store.save(); render(); });
    $$("[data-acc]").forEach(cb => cb.onchange = () => {
      deal.desk.accessories = $$("[data-acc]").filter(x => x.checked).map(x => x.dataset.acc);
      Store.save(); render();
    });
    const bind = (idSel, fn) => { const el2 = $(idSel); if (el2) el2.onchange = (e) => { fn(e); Store.save(); render(); }; };
    bind("#tradeVal", e => deal.trade.value = parseFloat(e.target.value) || 0);
    bind("#tradePay", e => deal.trade.payoff = parseFloat(e.target.value) || 0);
    bind("#rebates", e => deal.trade.rebates = parseFloat(e.target.value) || 0);
    bind("#taxCredit", e => deal.trade.applyTaxCredit = e.target.checked);
    bind("#apr", e => deal.desk.apr = parseFloat(e.target.value) || 0);
    bind("#down", e => deal.desk.downPayment = parseFloat(e.target.value) || 0);
    bind("#das", e => deal.desk.dueAtSigning = parseFloat(e.target.value) || 0);
    const pick = (sel, fn) => $$(sel).forEach(b => b.onclick = () => { fn(b); Store.save(); render(); });
    pick("#dkFinTerms [data-term]", b => deal.desk.term = parseInt(b.dataset.term, 10));
    pick("#dkDtf [data-days]", b => deal.desk.daysToFirst = parseInt(b.dataset.days, 10));
    pick("#dkLeaseTerms [data-lterm]", b => deal.desk.leaseTerm = parseInt(b.dataset.lterm, 10));
    pick("#dkMiles [data-miles]", b => deal.desk.milesPerYear = parseInt(b.dataset.miles, 10));
    bind("#scoreRange", e => {
      c.creditScore = parseInt(e.target.value, 10);
      const t2 = RIDE_PRICE_CALC.creditTier(c.creditScore);
      deal.desk.apr = t2.agreedApr; deal.desk.leaseFactor = t2.leaseFactor;
    });
    $("#dkEditTerms").onclick = () => {
      ui.open.terms = true;
      const d2 = $('[data-acc-key="terms"]'); if (d2) { d2.open = true; d2.scrollIntoView({ block: "start", behavior: "smooth" }); }
    };
    wireDeskTop();
    wireCompareSheet();
    /* one handler, both entries — the crumb button and the sticky bar must do
       exactly the same thing, not merely look alike */
    const goOn = () => {
      deal.basePayment = { signedAt: null, snapshot: RIDE_PRICE_CALC.calc(deal, v) };
      if (["desking"].includes(deal.stage)) deal.stage = "signed";
      Store.save();
      navigate(`#/agreement/${deal.id}`);
    };
    $("#deskContinue").onclick = goOn;
    const stickyGo = $("#deskContinueSticky"); if (stickyGo) stickyGo.onclick = goOn;
  }

  /* Compare payments as a bottom sheet on the pencil (prototype): finance and
     lease side by side, each from the real calculator on a cloned deal — the
     same honest math the #/compare route uses. Selecting one sets the deal
     type and drops the sheet. */
  function compareSheetHtml() {
    const mk = (type) => {
      const clone = JSON.parse(JSON.stringify(deal)); clone.dealType = type;
      return RIDE_PRICE_CALC.calc(clone, v);
    };
    const f = mk("finance"), l = mk("lease");
    return `
    <div class="dk-scrim" id="dkScrim"></div>
    <div class="dk-sheet" id="dkSheet" role="dialog" aria-modal="true" aria-label="Compare payments">
      <div class="dk-sheet-inner">
        <div class="dk-handle"></div>
        <div class="dk-sheetbar"><h2>Compare payments</h2><button type="button" class="dk-close" id="dkSheetClose" aria-label="Close">×</button></div>
        <div style="font-size:14px;color:var(--muted);line-height:1.45">Compare the two primary deal structures without leaving the pencil. A rebate applies to every deal type; cash down applies to a finance deal, and a lease uses the due-at-signing figure instead.</div>
        <div class="dk-cmpcard">
          <div class="top"><h3>Finance</h3><span class="dk-badge">${f.term} months</span></div>
          <div class="price">${money(f.payment)} / mo</div>
          <div class="dk-prices">
            <div class="row"><span>Vehicle price</span><b>${money(f.yourPrice)}</b></div>
            <div class="row"><span>Cash down</span><b>${money(deal.desk.downPayment)}</b></div>
            <div class="row"><span>APR</span><b>${f.apr}%</b></div>
          </div>
          <button type="button" class="dk-primary dk-wide" data-pick-type="finance">Select finance</button>
        </div>
        <div class="dk-cmpcard">
          <div class="top"><h3>Lease</h3><span class="dk-badge">${l.term} months · ${l.miles / 1000}k</span></div>
          <div class="price">${money(l.payment)} / mo</div>
          <div class="dk-prices">
            <div class="row"><span>Vehicle price</span><b>${money(l.yourPrice)}</b></div>
            <div class="row"><span>Residual</span><b>${money(l.residual)}</b></div>
            <div class="row"><span>Due at signing</span><b>${money(deal.desk.dueAtSigning)}</b></div>
          </div>
          <button type="button" class="dk-primary dk-wide" data-pick-type="lease">Select lease</button>
        </div>
        <p style="margin:16px 0 0;text-align:center"><a class="dk-linkbtn" href="#/compare/${esc(deal.id)}">Full comparison — all four deal types</a></p>
      </div>
    </div>`;
  }
  function wireCompareSheet() {
    const scrim = $("#dkScrim"), sheet = $("#dkSheet");
    if (!scrim || !sheet) return;
    const openSheet2 = () => { scrim.classList.add("show"); sheet.classList.add("show"); };
    const closeSheet2 = () => { scrim.classList.remove("show"); sheet.classList.remove("show"); };
    $("#dkCompare").onclick = openSheet2;
    $("#dkSheetClose").onclick = closeSheet2;
    scrim.onclick = closeSheet2;
    $$("[data-pick-type]").forEach(b => b.onclick = () => { deal.dealType = b.dataset.pickType; Store.save(); render(); });
  }

  function wordTrack(r) {
    const cName = c ? c.first : "Client";
    const accNames = deal.desk.accessories.map(a2 => (RIDE_PRICE_DATA.accessories.find(x => x.id === a2) || {}).name).filter(Boolean);
    const accPhrase = accNames.length ? ` With the included options and the accessories you chose of ${accNames.join(", ").toLowerCase()},` : " With the included options,";
    const tradePhrase = deal.trade.value > 0 ? (deal.trade.payoff > 0 ? " With us paying off your trade, and" : " Including your trade, and") : "";
    const rebatePhrase = deal.trade.rebates > 0 ? ` congratulations, you qualified for the ${money0(deal.trade.rebates)} rebate,` : "";
    if (deal.dealType === "cash") {
      return `“OK ${esc(cName)}, for your ${v.year} ${v.make} ${v.model}, the MSRP is ${money(v.msrp)}. Your selling price is ${money(v.selling)}.${accPhrase} your price is ${money(r.yourPrice)}.${tradePhrase}${rebatePhrase} including your taxes and fees, your total due is ${money(r.totalDue)}.”`;
    }
    if (deal.dealType === "lease" || deal.dealType === "onepay") {
      return `“OK ${esc(cName)}, for your ${v.year} ${v.make} ${v.model}, these lease terms are based on ${r.miles.toLocaleString()} miles per year, is that correct? ${deal.dealType === "lease" ? `And with your ${money0(deal.desk.dueAtSigning)} due at signing, correct? Excellent. ` : ""}The MSRP is ${money(v.msrp)}. Your selling price is ${money(v.selling)}.${accPhrase} your price is ${money(r.yourPrice)}. If you wanted to purchase your vehicle at the end of the lease, you could do so for ${money(r.residual)} PLUS TAXES &amp; FEES.${tradePhrase}${rebatePhrase} including your taxes and fees, at a standard ${r.term} month term, based on the credit you provided, ${deal.dealType === "onepay" ? `your one-pay total is ${money(r.onePayTotal)}.` : `your payment is ${money(r.payment)}.`}”`;
    }
    return `“OK ${esc(cName)}, for your ${v.year} ${v.make} ${v.model}, the MSRP is ${money(v.msrp)}. Your selling price is ${money(v.selling)}.${accPhrase} your price is ${money(r.yourPrice)}.${tradePhrase}${rebatePhrase} including your taxes and fees, at a standard ${r.term} month term, based on the credit score you provided, you are still putting down ${money0(deal.desk.downPayment)} correct? Your payment is ${money(r.payment)}.”`;
  }

  if (!deal.huddle.done) renderHuddle(); else render();
});

/* ============================================================
   VIEW: Compare Payments
   ============================================================ */
route("compare/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const v = Store.vehicle(deal.stock);
  const c = Store.customer(deal.customerId);

  renderChrome("Payment Comparison", "", "");
  document.body.dataset.screen = "desk";
  document.body.dataset.canvas = "master";

  const sides = [deal.dealType === "lease" ? "finance" : deal.dealType, deal.dealType === "lease" ? "lease" : "lease"];

  function colHtml(side, i) {
    const clone = JSON.parse(JSON.stringify(deal));
    clone.dealType = side;
    const r = RIDE_PRICE_CALC.calc(clone, v);
    const head = side === "cash" ? money(r.totalDue) : side === "onepay" ? money(r.onePayTotal) : money(r.payment);
    const unit = side === "cash" || side === "onepay" ? "total" : "/ mo";
    const badge = side === "cash" ? "cash purchase"
      : side === "onepay" ? `${r.term} months · one payment`
      : side === "lease" ? `${r.term} months · ${Math.round(r.miles / 1000)}k`
      : `${r.term} months`;
    const row = (l, val) => `<div class="m-specrow"><span>${l}</span><strong>${val}</strong></div>`;
    return `<div class="dk-cmpcard">
      <div class="dk-cmphead"><b>${esc(DEAL_TYPES[side])}</b><span class="dk-badge">${esc(badge)}</span></div>
      <div class="dk-typerow" role="tablist" aria-label="Deal type for this card">
        ${Object.entries(DEAL_TYPES).map(([k, l]) => `<button type="button" class="m-chip dk-typechip${side === k ? " active" : ""}" data-side="${i}" data-val="${k}" role="tab" aria-selected="${side === k}">${esc(l)}</button>`).join("")}
      </div>
      <div class="price">${esc(head)} <span class="unit">${unit}</span></div>
      <div class="m-specgroup">
        ${row("Vehicle price", money(r.yourPrice))}
        ${row("Accessories", money(r.accessories))}
        ${row("Rebate", money(deal.trade.rebates || 0))}
        ${row("Trade allowance", money(deal.trade.value || 0))}
        ${row("Trade payoff", money(deal.trade.payoff || 0))}
        ${row("Total Fees", money(RIDE_PRICE_CALC.totalFees()))}
        ${side === "lease" || side === "onepay"
          ? row("Miles per year", (deal.desk.milesPerYear).toLocaleString())
            + row("Residual", money(r.residual))
            + row("Lease factor", r.factor.toFixed(5))
            + row("Term", `${r.term} months`)
          : side === "cash" ? row("Taxes", money(r.taxes.total))
          : row("Cash down", money(deal.desk.downPayment))
            + row("APR", `${deal.desk.apr}%`)
            + row("Term", `${r.term} months`)}
      </div>
      <button type="button" class="dk-primary" style="width:100%;margin-top:16px" data-save="${side}">Select ${esc(DEAL_TYPES[side].toLowerCase())}</button>
    </div>`;
  }

  function render() {
    view().innerHTML = `${deskTop(deal)}
    <div class="dk-wrap dk-wrap--wide">
      <div class="dk-eyebrow">DESKING</div>
      <div class="dk-headrow">
        <div><h1 style="margin-bottom:7px">Compare payments</h1>
          <div class="dk-meta" style="margin:0"><b>${esc(c.first + " " + c.last)}</b> · ${esc(v.year + " " + v.make + " " + v.model)} ${esc(v.trim || "")}</div></div>
        <a class="dk-linkbtn" href="#/desk/${esc(deal.id)}" style="text-align:right">Back to the pencil</a>
      </div>
      <div class="dk-notice" style="margin-top:16px"><strong>Before you switch</strong>A rebate applies to every deal type. Cash down applies to a finance deal; a lease uses the due-at-signing figure instead.</div>
      <div class="dk-cmpgrid">${sides.map((s, i) => colHtml(s, i)).join("")}</div>
    </div>`;
    wireDeskTop();
    $$("[data-side]").forEach(b => b.onclick = () => { sides[+b.dataset.side] = b.dataset.val; render(); });
    $$("[data-save]").forEach(b => b.onclick = () => {
      deal.dealType = b.dataset.save; Store.save();
      toast(`Deal type set to ${DEAL_TYPES[deal.dealType]}`);
      navigate(`#/desk/${deal.id}`);
    });
  }
  render();
});

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
      <a class="dk-chip" href="#/jacket/${esc(deal.id)}">${rpIcon("folder")} Jacket ${jk.missing ? `<b>${esc(String(jk.missing))}</b>` : ""}</a>
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
      ${deal.trade.value ? trow("Trade value / payoff", `${money(deal.trade.value)} / ${money(deal.trade.payoff)}`) : ""}
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
   VIEW: Lending Lane — credit application
   ============================================================ */
route("credit/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const c = Store.customer(deal.customerId);
  const app = deal.creditApp;

  renderChrome("Lending Lane — Credit Application", dealTitle(deal), "");
  document.body.dataset.canvas = "master";

  /* resolve the record, not just the id — a dangling coBuyerId must behave as
     "no co-buyer" here exactly as it does in dealTitle() and the submit guard */
  const cbRec = () => deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;

  const v = deal.stock ? Store.vehicle(deal.stock) : null;
  const r = v ? RIDE_PRICE_CALC.calc(deal, v) : null;
  const scanned = !!(c.dob && c.license && c.license.number);

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
  /* co-applicant identity prefills from the record, never from typed state —
     the record is the source of truth, same as the primary's fields */
  const seedCo = () => {
    const cb = cbRec(); if (!cb) return;
    Object.assign(F, { coFirst: cb.first, coLast: cb.last, coDob: dateUS(cb.dob || ""), coDl: (cb.license && cb.license.number) || "", coAddr: cb.address || "", coZip: cb.zip || "", coCity: cb.city || "", coState: cb.state || "" });
  };
  seedCo();

  const STEP_NAMES = ["Applicant", "Residence", "Employment", "Review"];
  const st = { step: 1, err: null };

  const under3 = (x) => { const n = parseFloat(x); return !isNaN(n) && n < 3; };
  /* required keys per step, honouring the conditional sections — a section
     that is not active requires nothing (the same invariant the old
     render-only-while-active DOM carried) */
  const reqForStep = (n) => {
    if (n === 1) {
      const ks = [["first", "First Name"], ["last", "Last Name"], ["dob", "Date of Birth"], ["ssn", "SSN"], ["dl", "Driver License"], ["phone", "Phone"], ["email", "Email"]];
      if (F.appType === "joint" && cbRec()) ks.push(["coFirst", "Co-Buyer First Name"], ["coLast", "Co-Buyer Last Name"], ["coDob", "Co-Buyer Date of Birth"], ["coDl", "Co-Buyer Driver License"]);
      return ks;
    }
    if (n === 2) {
      const ks = [["address", "Address"], ["housePmt", "Monthly Rent/Mortgage"], ["resYrs", "Time at Address"]];
      if (under3(F.resYrs)) ks.push(["prevAddr", "Previous Address"]);
      return ks;
    }
    if (n === 3) {
      const ks = [["employer", "Employer"], ["occupation", "Occupation"], ["empYrs", "Time at Employer"], ["income", "Gross Monthly Income"]];
      if (under3(F.empYrs)) ks.push(["prevEmp", "Previous Employer"]);
      if (F.dBk) ks.push(["dBkNote", "Bankruptcy explanation"]);
      if (F.dAlias) ks.push(["dAliasNote", "Alias explanation"]);
      if (F.dRepo) ks.push(["dRepoNote", "Repossession explanation"]);
      return ks;
    }
    return [];
  };
  const DATE_KEYS = ["dob", "coDob"];
  const problem = (key) => {
    const val2 = String(F[key] || "").trim();
    if (!val2) return "Required";
    /* demo rule: the only SSN this tool ever accepts is the sample one */
    if (key === "ssn" && val2.replace(/\D/g, "") !== "000000000") return "Demo tool — the SSN is always 000-00-0000";
    if (DATE_KEYS.includes(key) && !dateISO(val2)) return "Enter MM/DD/YYYY";
    return null;
  };

  /* ---------------- templates (golden anatomy, ca- family) ---------------- */
  const fieldErr = (key) => st.err && st.err.keys.has(key);
  const field = (label, key, opts = {}) => `
    <div><label class="ca-lab" for="ca_${key}">${label}${opts.req ? ` <span class="ca-req">*</span>` : ""}</label>
      <input class="ca-input${fieldErr(key) ? " error" : ""}" id="ca_${key}" data-key="${key}" ${opts.date ? `data-date maxlength="10" inputmode="numeric"` : ""} ${opts.ssn ? `data-ssn maxlength="11" inputmode="numeric"` : ""} ${opts.zip ? `data-zip="${opts.zip}" maxlength="5" inputmode="numeric"` : ""} ${opts.type ? `type="${opts.type}"` : `type="text"`} ${opts.inputmode && !opts.date && !opts.ssn && !opts.zip ? `inputmode="${opts.inputmode}"` : ""} value="${esc(F[key])}" placeholder="${esc(opts.placeholder || "")}">
      ${fieldErr(key) ? `<div class="ca-errtext">${esc(st.err.keys.get(key))}</div>` : ""}</div>`;
  const seg = (options, key, cls) => `<div class="ca-seg ${cls}">${options.map(o => `<button type="button" class="ca-segbtn${F[key] === o ? " active" : ""}" data-seg="${key}" data-val="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
  const switchRow = (label, key) => `<div class="ca-switchrow"><span>${label}</span><label class="switch"><input type="checkbox" data-flag="${key}" ${F[key] ? "checked" : ""} aria-label="${label}"><span class="sl"></span></label></div>`;
  const alertBox = (html) => `<div class="ca-alert"><div class="ca-alerticon">!</div><div>${html}</div></div>`;
  const stepAlert = (n) => {
    if (!st.err || st.err.alertStep !== n) return "";
    return alertBox(st.err.summary);
  };

  /* remote completion (v2): the send-link path is simulated honestly — the
     demo has no network (invariant 2), so the sheet says so plainly and the
     statuses stay waiting, the same pattern as the scan journey's code
     verification. Real per-target sends are recorded on deal.creditRemote. */
  const sentPill = (t) => deal.creditRemote && deal.creditRemote[t] ? `<span class="ca-sentpill">Link sent</span>` : "";
  function individualRemoteHtml() {
    return `<div class="ca-remote">
      <div class="ca-remotetop"><div><strong>Finish on customer&rsquo;s phone</strong><span>Send ${esc(c.first)} a secure link to continue this same application on mobile.</span></div>${sentPill("applicant")}</div>
      <button type="button" class="ca-linkaction" data-linksheet="applicant"><span class="ca-linkcopy"><strong>Send to ${esc(c.phone)}</strong><span>Starts with identity verification before any credit fields.</span></span><span class="ca-roundarrow">→</span></button></div>`;
  }
  function jointRemoteHtml() {
    return `<div class="ca-remote">
      <div class="ca-remotetop"><div><strong>Co-buyer needed</strong><span>No co-buyer is attached yet. The fastest option is to send the co-buyer a secure mobile link.</span></div>${deal.creditRemote && deal.creditRemote.cobuyer ? `<span class="ca-sentpill">Link sent</span>` : `<span class="ca-notpill">Not attached</span>`}</div>
      <button type="button" class="ca-linkaction" data-linksheet="cobuyer"><span class="ca-linkcopy"><strong>Send co-buyer link</strong><span>They verify identity and complete their part remotely.</span></span><span class="ca-roundarrow">→</span></button>
      <div class="ca-actionrow"><button type="button" class="ca-secondary ca-secondary--soft" id="caCoScan">Scan co-buyer license</button><button type="button" class="ca-secondary ca-secondary--soft" data-buyers="${esc(deal.id)}">Choose existing customer</button></div></div>`;
  }
  function attachedCoHtml() {
    const cb = cbRec();
    return `<div class="ca-joint">
      <div class="ca-jointtop"><div><strong>Co-applicant</strong><span>Identity prefilled from <b>${esc(cb.first + " " + cb.last)}</b>&rsquo;s record. Employment and income go on the dealership&rsquo;s paper form.</span></div>
        <button type="button" class="ca-managelink" data-buyers="${esc(deal.id)}">Manage buyers</button></div>
      <div class="ca-fieldgrid" style="margin-top:14px">
        <div><label class="ca-lab" for="ca_coRel">This Person Is A</label><select class="ca-input" id="ca_coRel" data-key="coRel">
          ${["Joint Applicant", "Spousal Joint Applicant", "Co-signer / Guarantor"].map(o => `<option ${F.coRel === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        <div class="ca-fieldrow">${field("First Name", "coFirst", { req: true })}${field("Last Name", "coLast", { req: true })}</div>
        <div class="ca-fieldrow">${field("Date of Birth", "coDob", { req: true, date: true, placeholder: "MM/DD/YYYY" })}${field("Driver License", "coDl", { req: true })}</div>
        ${field("Address", "coAddr")}
        <div class="ca-fieldrow">${field("ZIP Code", "coZip", { zip: "coCity,coState" })}${field("City", "coCity")}</div>
        ${field("State", "coState")}
      </div></div>`;
  }

  function applicantHtml() {
    return `<div class="ca-card">
      <h2 class="ca-cardtitle">Application type</h2>
      <p class="ca-cardsub">Choose how the customer wants to apply. A remote participant can complete their portion from their own phone.</p>
      ${stepAlert(1)}
      <div class="ca-choice${F.appType === "individual" ? " active" : ""}" data-atype="individual" role="radio" aria-checked="${F.appType === "individual"}" tabindex="0"><div class="ca-radio"></div><div class="ca-choicetext"><strong>Individual application</strong><span>One applicant completes this application.</span></div></div>
      <div class="ca-choice${F.appType === "joint" ? " active" : ""}" data-atype="joint" role="radio" aria-checked="${F.appType === "joint"}" tabindex="0"><div class="ca-radio"></div><div class="ca-choicetext"><strong>Joint application</strong><span>A co-buyer will apply together. In accordance with Regulation B, you certify that you are applying for joint credit.</span></div></div>
      ${F.appType === "joint" ? (cbRec() ? attachedCoHtml() : jointRemoteHtml()) : individualRemoteHtml()}
      <div class="ca-rule"></div>
      <label class="ca-lab">Credit Type <span class="ca-req">*</span></label>${seg(["Retail", "Lease", "Balloon"], "creditType", "cols3")}
      <div style="height:16px"></div>
      <label class="ca-lab">Primary Use</label>${seg(["Personal, family or household", "Business or commercial"], "primaryUse", "cols2")}
      <div class="ca-rule"></div>
      <h2 class="ca-cardtitle" style="font-size:18px">Applicant information</h2>
      <p class="ca-cardsub">Known customer information is prefilled. Only complete what is missing.</p>
      <span class="ca-demo">DEMO — sample data only, never real SSNs</span>
      ${scanned ? `<span class="ca-scanpill">✓ Filled from license scan</span>` : ""}
      <div class="ca-fieldgrid">
        <div class="ca-fieldrow">${field("First Name", "first", { req: true })}${field("Middle", "middle")}</div>
        ${field("Last Name", "last", { req: true })}
        <div class="ca-fieldrow">${field("Date of Birth", "dob", { req: true, date: true, placeholder: "MM/DD/YYYY" })}${field("SSN", "ssn", { req: true, ssn: true, placeholder: "000-00-0000" })}</div>
        ${field("Driver License", "dl", { req: true })}
        <div class="ca-fieldrow">${field("Phone", "phone", { req: true, type: "tel" })}${field("Email", "email", { req: true, type: "email" })}</div>
        <div><label class="ca-lab">Marital Status</label>${seg(["Married", "Unmarried", "Separated"], "marital", "cols3")}</div>
      </div></div>`;
  }

  function residenceHtml() {
    return `<div class="ca-card">
      <h2 class="ca-cardtitle">Residence</h2>
      <p class="ca-cardsub">Current address and housing obligations used by the lender.</p>
      ${stepAlert(2)}
      <div class="ca-fieldgrid">
        ${field("Address", "address", { req: true })}
        <div class="ca-fieldrow">${field("ZIP Code", "zip", { zip: "city,state" })}${field("City", "city")}</div>
        ${field("State", "state")}
        <div><label class="ca-lab">Residential Status <span class="ca-req">*</span></label>${seg(["Own", "Rent", "Buying", "Parents", "Other"], "housing", "cols5")}</div>
        <div class="ca-fieldrow">${field("Monthly Rent / Mortgage Payment", "housePmt", { req: true, inputmode: "numeric", placeholder: "1,800" })}${field("Time at Address (years)", "resYrs", { req: true, inputmode: "decimal" })}</div>
        ${under3(F.resYrs) ? field("Previous Full Address (under 3 years at current)", "prevAddr", { req: true, placeholder: "Street, city, state, ZIP" }) : ""}
        ${switchRow("Mailing address is different", "mailDiff")}
        ${F.mailDiff ? `${field("Mailing Address", "mailAddr")}
          <div class="ca-fieldrow">${field("ZIP Code", "mailZip", { zip: "mailCity,mailState" })}${field("City", "mailCity")}</div>
          ${field("State", "mailState")}` : ""}
      </div></div>`;
  }

  function employmentHtml() {
    return `<div class="ca-card">
      <h2 class="ca-cardtitle">Employment &amp; income</h2>
      <p class="ca-cardsub">Employment history and monthly income used for the lending decision.</p>
      ${stepAlert(3)}
      <div class="ca-fieldgrid">
        ${field("Employer", "employer", { req: true, placeholder: "Employer name" })}
        ${field("Occupation", "occupation", { req: true, placeholder: "e.g. Project manager" })}
        <div class="ca-fieldrow">${field("Employer Phone", "empPhone", { type: "tel", placeholder: "(000) 000-0000" })}${field("Time at Employer (years)", "empYrs", { req: true, inputmode: "decimal" })}</div>
        <div class="ca-fieldrow">${field("Gross Monthly Income", "income", { req: true, inputmode: "numeric", placeholder: "6,500" })}${field("Other Monthly Income", "otherIncome", { inputmode: "numeric", placeholder: "0" })}</div>
        ${field("Other Income Source", "otherSource", { placeholder: "e.g. rental income" })}
        ${under3(F.empYrs) ? `${field("Previous Employer (under 3 years at current)", "prevEmp", { req: true })}
          <div class="ca-fieldrow">${field("Previous Occupation", "prevOcc")}${field("Years There", "prevEmpYrs", { inputmode: "decimal" })}</div>` : ""}
        ${switchRow("Self-Employed", "selfEmp")}
      </div>
      <div class="ca-rule"></div>
      <h3 class="ca-h3">Disclosures</h3>
      ${switchRow("Filed bankruptcy?", "dBk")}${F.dBk ? field("Please explain", "dBkNote", { req: true }) : ""}
      ${switchRow("Obtained credit under another name?", "dAlias")}${F.dAlias ? field("Please explain", "dAliasNote", { req: true }) : ""}
      ${switchRow("Had a vehicle repossessed?", "dRepo")}${F.dRepo ? field("Please explain", "dRepoNote", { req: true }) : ""}
      <button type="button" class="ca-secondary ca-secondary--soft ca-full" id="caRefsToggle">${F.refsOpen ? "−" : "+"} Optional — bank &amp; references</button>
      ${F.refsOpen ? `<div class="ca-fieldgrid">
        ${field("Bank Reference", "refBank", { placeholder: "Bank or credit union name" })}
        <div><label class="ca-lab" for="ca_refAcctType">Account Type</label><select class="ca-input" id="ca_refAcctType" data-key="refAcctType">
          <option value="" ${!F.refAcctType ? "selected" : ""} hidden>—</option>${["Checking", "Savings"].map(o => `<option ${F.refAcctType === o ? "selected" : ""}>${o}</option>`).join("")}</select></div>
        ${field("Nearest Relative Not Living With You", "refKinName", { placeholder: "Name" })}
        <div class="ca-fieldrow">${field("Relative's Phone", "refKinPhone", { type: "tel", placeholder: "(000) 000-0000" })}${field("Relationship", "refKinRel", { placeholder: "e.g. sister" })}</div>
        ${field("Personal Reference", "refP1", { placeholder: "Name · phone" })}
        ${field("Personal Reference 2", "refP2", { placeholder: "Name · phone" })}
      </div>` : ""}</div>`;
  }

  function reviewHtml() {
    return `<div class="ca-card">
      <h2 class="ca-cardtitle">Review application</h2>
      <p class="ca-cardsub">Confirm the information before sending this demo application for a simulated lender decision.</p>
      ${stepAlert(4)}
      <div class="ca-review">
        <div class="ca-revrow"><span>Identity</span><strong>${deal.identity && deal.identity.verifiedAt ? "Verified" : "—"}</strong></div>
        <div class="ca-revrow"><span>Applicant</span><strong>${esc(F.first + " " + F.last)}</strong></div>
        <div class="ca-revrow"><span>Application</span><strong>${F.appType === "joint" ? "Joint" : "Individual"} · ${esc(F.creditType)}</strong></div>
        ${F.appType === "joint" && cbRec() ? `<div class="ca-revrow"><span>Co-applicant</span><strong>${esc(F.coFirst + " " + F.coLast)} · ${esc(F.coRel)}</strong></div>` : ""}
        <div class="ca-revrow"><span>Residence</span><strong>${esc([F.address, F.city, F.state].filter(Boolean).join(", "))} ${esc(F.zip)}</strong></div>
        <div class="ca-revrow"><span>Housing</span><strong>${esc(F.housing)} · ${F.housePmt ? "$" + esc(F.housePmt) + "/mo" : "—"}</strong></div>
        <div class="ca-revrow"><span>Employment</span><strong>${F.employer ? esc(F.employer) : "Missing employer"}</strong></div>
        <div class="ca-revrow"><span>Gross income</span><strong>${F.income ? "$" + esc(F.income) + "/mo" : "—"}</strong></div>
      </div>
      <label class="ca-consent${fieldErr("consent") ? " error" : ""}">
        <input type="checkbox" data-flag="consent" ${F.consent ? "checked" : ""}>
        <span><strong>Consent &amp; disclosures.</strong> I understand that checking this box constitutes my electronic signature, and I authorize Ride Price to obtain credit bureau reports in connection with this application. <b>Demo — no real inquiry ever occurs.</b></span></label>
    </div>`;
  }

  const wsRow = (label, val) => `<div class="ca-wsrow"><span>${label}</span><strong>${val}</strong></div>`;
  /* Deal Summary Option A (v2): customer-facing title, the source line
     subordinate and muted. The time is honest — the rows are computed from
     the live worksheet at render. */
  const worksheetHtml = () => !r ? "" : `<div class="ca-ws">
    <div class="ca-wshead"><div><div class="ca-wstitle">Deal summary</div><div class="ca-wssource"><span class="ca-sourcedot"></span>Updated from worksheet · ${esc(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }))}</div></div><a class="ca-managelink" href="#/desk/${esc(deal.id)}">Edit</a></div>
    <div class="ca-wsrows">
      ${wsRow("Vehicle", `${esc(v.year)} ${esc(v.make)} ${esc(v.model)} · ${esc(v.stock)}`)}
      ${wsRow("MSRP", money(v.msrp))}
      ${wsRow("Cash Price", money(r.yourPrice))}
      ${wsRow("Sales Tax", money(r.taxes.total || 0))}
      ${wsRow("Cash Down", money(deal.desk.downPayment || 0))}
      ${wsRow("Trade-In Amount", money(deal.trade.value || 0))}
      ${deal.dealType === "cash" ? wsRow("Total Due", money(r.totalDue))
        : wsRow("Amount Financed", money(r.amountFinanced)) + wsRow("Term / Estimated Payment", `${esc(String(r.term))} mo · ${money(r.payment)}`)}
    </div></div>`;

  const headerHtml = () => `
    <div class="ca-eyebrow">Lending lane</div>
    <div class="ca-headrow"><h1 class="ca-h1">Credit application</h1><a class="ca-linkbtn" href="#/agreement/${esc(deal.id)}">Base Payment</a></div>
    <p class="ca-subtitle">${deal.dealNo ? `<strong>Deal #${esc(deal.dealNo)}</strong> · ` : ""}${esc(c.first + " " + c.last)}${v ? `<br><span>${esc(v.year + " " + v.make + " " + v.model)}</span>` : ""}</p>
    <div class="dk-chips" style="margin-top:20px;margin-bottom:0">
      <button type="button" class="dk-chip" data-buyers="${esc(deal.id)}">${rpIcon("user")} Buyer</button>
      ${r ? `<button type="button" class="dk-chip" id="caDealSum">${rpIcon("page")} Deal summary</button>` : ""}
      <a class="dk-chip" href="#/jacket/${esc(deal.id)}">${rpIcon("folder")} Jacket ${jacketCounts(deal).missing ? `<b>${esc(String(jacketCounts(deal).missing))}</b>` : ""}</a>
    </div>`;

  const progressHtml = () => `<div class="ca-progressbox">
    <div class="ca-progressmeta"><strong>${STEP_NAMES[st.step - 1]}</strong><span>Step ${st.step} of 4</span></div>
    <div class="ca-progress"><div style="width:${st.step * 25}%"></div></div></div>`;

  /* the contextual sheets (v2): Deal summary, and the secure-link send /
     status views. One shell per surface; a send marks the sheet dirty so
     closing repaints the surface's Link-sent pills. */
  let repaint = () => {};
  let sheetDirty = false;
  const sheetTop3 = (title) => `<div class="m-sheettop"><div class="m-sheettitle">${esc(title)}</div><button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>`;
  const openSheet3 = (html) => { $("#caSheet").innerHTML = `<div class="m-handle"></div>${html}`; $("#caScrim").classList.add("show"); };
  function wireSheetShell() {
    const scrim = $("#caScrim");
    if (!scrim) return;
    scrim.onclick = (e) => {
      if (e.target === scrim || e.target.closest("[data-sheet-close]")) {
        scrim.classList.remove("show");
        if (sheetDirty) { sheetDirty = false; repaint(); }
      }
    };
  }
  const openSummarySheet = () => openSheet3(`${sheetTop3("Deal summary")}${worksheetHtml()}`);
  function openLinkSheet(target) {
    const isCo = target === "cobuyer";
    const cb = cbRec();
    const name = isCo ? (cb ? cb.first + " " + cb.last : "Co-buyer") : c.first + " " + c.last;
    const phone = isCo ? (cb ? cb.phone : "") : c.phone;
    const email = isCo ? (cb ? cb.email : "") : c.email;
    openSheet3(`${sheetTop3(isCo ? "Send co-buyer link" : "Send application link")}
      <p class="ca-sheetsub">${isCo ? "The co-buyer can complete their part without being in the showroom." : `Let ${esc(c.first)} continue this application on their own phone.`}</p>
      <div class="ca-recipient"><small>${isCo ? "Recipient" : "Customer"}</small><strong>${esc(name)}</strong></div>
      <div class="ca-fieldgrid">
        <div><label class="ca-lab" for="clPhone">Phone number</label><input class="ca-input" id="clPhone" type="tel" value="${esc(phone)}" placeholder="(000) 000-0000"></div>
        <div><label class="ca-lab" for="clEmail">Email</label><input class="ca-input" id="clEmail" type="email" value="${esc(email)}" placeholder="name@example.com"></div>
      </div>
      <div class="ca-consent" style="cursor:default"><span><strong>What happens next.</strong> The recipient opens the link on mobile, completes identity verification first, and then continues only their required credit-application fields. <b>Demo — no text or email is really sent; the link and its statuses are simulated on this device.</b></span></div>
      <div class="ca-errtext" id="clErr" hidden>Enter a phone number or an email for the link</div>
      <button type="button" class="mp-primary mp-wide" id="clSend">Send secure link</button>`);
    $("#clSend").onclick = () => {
      const phone2 = $("#clPhone").value.trim(), email2 = $("#clEmail").value.trim();
      if (!phone2 && !email2) { $("#clErr").hidden = false; return; }
      deal.creditRemote = deal.creditRemote || {};
      deal.creditRemote[target] = { phone: phone2, email: email2, sentAt: new Date().toISOString() };
      Store.save();
      sheetDirty = true;
      renderLinkStatus(target);
    };
  }
  function renderLinkStatus(target) {
    const isCo = target === "cobuyer";
    const rec = deal.creditRemote[target];
    openSheet3(`${sheetTop3(isCo ? "Co-buyer link sent" : "Application link sent")}
      <div class="ca-sentstate"><div class="ca-senticon">✓</div><h3>Sent successfully</h3>
        <p>${isCo ? "The co-buyer can verify their identity and complete their portion from home." : `${esc(c.first)} can verify their identity and continue the application on their phone.`}</p></div>
      <div class="ca-statuslist">
        <div class="ca-statusitem"><strong>Link sent</strong><span>${esc(new Date(rec.sentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }))}</span></div>
        <div class="ca-statusitem"><strong>Opened</strong><span>Waiting</span></div>
        <div class="ca-statusitem"><strong>Identity verified</strong><span>Waiting</span></div>
        <div class="ca-statusitem"><strong>Application submitted</strong><span>Waiting</span></div>
      </div>
      <p class="ca-sheetsub" style="margin-top:14px">Demo — no text or email was really sent; the statuses are simulated and stay waiting.</p>
      <button type="button" class="mp-primary mp-wide" data-sheet-close>Done</button>`);
  }

  function render() {
    repaint = render;
    const stepHtml = st.step === 1 ? applicantHtml() : st.step === 2 ? residenceHtml() : st.step === 3 ? employmentHtml() : reviewHtml();
    view().innerHTML = `
    <div class="ca-app">
      ${deskTop(deal)}
      <div class="ca-page">
        ${headerHtml()}
        ${progressHtml()}
        ${stepHtml}
        ${st.step >= 2 ? worksheetHtml() : ""}
      </div>
    </div>
    <div class="ca-dock">
      <div class="ca-dockinfo"><small>${st.step < 4 ? "Next" : "Lending Lane"}</small><strong>${st.step < 4 ? STEP_NAMES[st.step] : "Ready to submit"}</strong></div>
      <button type="button" class="mp-primary" id="caGo">${st.step < 4 ? "Continue" : "Submit application"} →</button>
    </div>
    <div class="m-scrim" id="caScrim"><div class="m-sheet m-sheet--wide" role="dialog" aria-modal="true" id="caSheet"></div></div>`;
    wireDeskTop();
    wire();
  }

  function wire() {
    wireSheetShell();
    $$("[data-atype]").forEach(el => {
      const pick = () => { F.appType = el.dataset.atype; render(); };
      el.onclick = pick;
      el.onkeydown = (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); pick(); } };
    });
    $$("[data-seg]").forEach(b => b.onclick = () => { F[b.dataset.seg] = b.dataset.val; render(); });
    $$("[data-flag]").forEach(sw => sw.onchange = () => { F[sw.dataset.flag] = sw.checked; render(); });
    const refs = $("#caRefsToggle");
    if (refs) refs.onclick = () => { F.refsOpen = !F.refsOpen; render(); };
    const sc = $("#caCoScan");
    if (sc) sc.onclick = () => openScanFlow({ mode: "cobuyer", deal, onDone: () => router() });
    const ds = $("#caDealSum");
    if (ds) ds.onclick = openSummarySheet;
    $$("[data-linksheet]").forEach(b => b.onclick = () => openLinkSheet(b.dataset.linksheet));
    $("#caGo").onclick = () => { if (st.step < 4) { st.step++; st.err = null; render(); window.scrollTo({ top: 0, behavior: "smooth" }); } else submit(); };
  }

  /* identity verification (v2): a pre-application gate. The capture uses the
     phone's own camera through a file input (invariant 5 — no getUserMedia,
     works over LAN http); the photo is never read or stored, and the page
     says plainly that no real biometric match occurs in the demo. */
  function renderIdentity(verified) {
    repaint = () => renderIdentity(verified);
    renderChrome("Lending Lane — Identity Verification", dealTitle(deal), "");
    document.body.dataset.canvas = "master";
    const lic = c.license && c.license.number;
    const checklist = verified ? `
      <div class="ca-checklist">
        <div class="ca-checkrow"><div class="ca-checkmark">✓</div><strong>Photo captured for verification</strong><span>Done</span></div>
        <div class="ca-checkrow"><div class="ca-checkmark">✓</div><strong>Phone number on file</strong><span>${esc(c.phone)}</span></div>
        <div class="ca-checkrow"><div class="ca-checkmark">✓</div><strong>Email on file</strong><span>On file</span></div>
      </div>` : `
      <div class="ca-checklist">
        <div class="ca-checkrow">${lic ? `<div class="ca-checkmark">✓</div><strong>Driver&rsquo;s license on file</strong><span>${esc(lic)}</span>` : `<div class="ca-checkmark ca-checkmark--off">–</div><strong>Driver&rsquo;s license</strong><span>Not on file</span>`}</div>
        <div class="ca-checkrow"><div class="ca-checkmark">✓</div><strong>Phone number on file</strong><span>${esc(c.phone)}</span></div>
        <div class="ca-checkrow"><div class="ca-checkmark">✓</div><strong>Email on file</strong><span>On file</span></div>
      </div>`;
    view().innerHTML = `
    <div class="ca-app">
      ${deskTop(deal)}
      <div class="ca-page">
        <div class="ca-eyebrow">Identity verification</div>
        <div class="ca-headrow"><h1 class="ca-h1">${verified ? "Identity verified" : "Verify your identity"}</h1><a class="ca-linkbtn" href="#/agreement/${esc(deal.id)}">Cancel</a></div>
        <p class="ca-subtitle">${verified ? `<strong>${esc(c.first + " " + c.last)}</strong> is ready to continue to the credit application.` : `Before the credit application begins, confirm that the customer matches the driver&rsquo;s license already on file.`}</p>
        <div class="ca-card">
          <div class="ca-verifywrap">
            <div class="ca-faceframe${verified ? " verified" : ""}"><div class="ca-faceicon">${verified ? rpIcon("check") : rpIcon("user")}</div></div>
            <h2>${verified ? "You&rsquo;re verified" : "Take a quick photo"}</h2>
            <p>${verified ? "Identity verification is recorded for this application." : "The photo confirms the customer matches the driver&rsquo;s license on file and helps protect the application from fraud."}</p>
            ${checklist}
            <div class="ca-privacy">${rpIcon("lock")}<span>Demo — the photo is confirmed on this device and discarded; no real biometric match occurs.</span></div>
            ${verified ? "" : `<p class="ca-uploadline"><label class="ca-uploadlink"><u>or upload a photo</u><input type="file" accept="image/*" data-idcap hidden></label></p>`}
          </div>
        </div>
        <div class="ca-remote">
          <div class="ca-remotetop"><div><strong>Customer wants to use their own phone?</strong><span>Send a secure application link. The customer starts with this same identity-verification step, then completes the application on mobile.</span></div>${sentPill("applicant")}</div>
          <button type="button" class="ca-secondary ca-full" data-linksheet="applicant">Send secure link to phone</button>
        </div>
      </div>
    </div>
    <div class="ca-dock">
      <div class="ca-dockinfo"><small>${verified ? "Next" : "Required before application"}</small><strong>${verified ? "Application type" : "Identity verification"}</strong></div>
      ${verified
        ? `<button type="button" class="mp-primary" id="idGo">Continue →</button>`
        : `<label class="mp-primary ca-caplabel">Take photo<input type="file" accept="image/*" capture="user" data-idcap hidden></label>`}
    </div>
    <div class="m-scrim" id="caScrim"><div class="m-sheet m-sheet--wide" role="dialog" aria-modal="true" id="caSheet"></div></div>`;
    wireDeskTop();
    wireSheetShell();
    $$("[data-idcap]").forEach(inp => inp.onchange = (e) => {
      if (!e.target.files || !e.target.files.length) return; /* a cancelled picker verifies nothing */
      deal.identity = { verifiedAt: new Date().toISOString() };
      Store.save();
      renderIdentity(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    const idGo = $("#idGo");
    if (idGo) idGo.onclick = () => render();
    $$("[data-linksheet]").forEach(b => b.onclick = () => openLinkSheet(b.dataset.linksheet));
  }

  /* one delegated writer: masks applied here so the stored value matches what
     the document-level [data-date] mask paints (both are idempotent). A
     complete demo ZIP fills city + state, in state and on screen. */
  view().addEventListener("input", (e) => {
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
  });
  view().addEventListener("change", (e) => {
    const el = e.target.closest("select[data-key]");
    if (el) F[el.dataset.key] = el.value;
  });

  function submit() {
    /* a joint application with nobody attached cannot go to a lender */
    if (F.appType === "joint" && !cbRec()) {
      st.err = { keys: new Map(), alertStep: 1, summary: `<strong>No co-buyer is attached.</strong><br>Scan the co-buyer&rsquo;s license, choose an existing customer, or select Individual application.` };
      st.step = 1; render(); window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const bad = [];
    for (const n of [1, 2, 3]) for (const [k, label] of reqForStep(n)) {
      const msg = problem(k);
      if (msg) bad.push({ k, label, msg, n });
    }
    if (bad.length) {
      const firstStep = bad[0].n;
      st.err = {
        keys: new Map(bad.map(b => [b.k, b.msg])),
        alertStep: firstStep,
        summary: `<strong>${bad.length} required item${bad.length === 1 ? "" : "s"} need${bad.length === 1 ? "s" : ""} attention.</strong><br>${esc(bad.map(b => b.label).join(", "))}.${bad.some(b => b.k === "ssn") ? " For this demo, SSN must be 000-00-0000." : ""} Nothing has been saved or sent.`
      };
      st.step = firstStep; render(); window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!F.consent) {
      st.err = { keys: new Map([["consent", "Required"]]), alertStep: 4, summary: `<strong>Application not submitted.</strong><br>The applicant must check the electronic-signature consent box. Nothing has been saved or sent.` };
      render();
      return;
    }
    const tier = RIDE_PRICE_CALC.creditTier(c.creditScore || 700);
    const submittedAt = new Date().toISOString();
    /* the simulated approval is untouched (decision 25) — the form details are
       captured alongside it as the application of record, field for field */
    deal.creditApp = {
      submitted: submittedAt, approved: true,
      lender: RIDE_PRICE_DATA.lenders[0], qualifiedApr: tier.qualifiedApr, leaseFactor: Math.max(0.00001, tier.leaseFactor - 0.0003),
      employer: F.employer,
      form: {
        consent: { electronicSignature: true, acceptedAt: submittedAt },
        dob: dateISO(F.dob), coDob: dateISO(F.coDob) || null,
        creditType: F.creditType, primaryUse: F.primaryUse,
        joint: F.appType === "joint", coRel: F.appType === "joint" ? F.coRel : "",
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
    deal.stage = "menu"; Store.save();
    renderApproved(true);
  }

  function renderApproved(justNow) {
    repaint = () => renderApproved();
    const a = deal.creditApp;
    renderChrome("Lending Lane — Credit Application", dealTitle(deal), "");
    document.body.dataset.canvas = "master";
    view().innerHTML = `
    <div class="ca-app">
      ${deskTop(deal)}
      <div class="ca-page">
        ${headerHtml()}
        <div class="ca-card" style="margin-top:26px">
          <div class="ca-statusline"><div class="ca-eyebrow" style="margin:0">Loan status</div><span class="ca-statuspill">✓ Approved</span></div>
          <div class="ca-approvalhero">
            <div class="ca-bankicon">${rpIcon("bank")}</div>
            <h2>Approved by ${esc(a.lender)}</h2>
            <p>Qualified rate: <strong>${esc(String(a.qualifiedApr))}% APR</strong><br><span>agreed structure was ${esc(String(deal.desk.apr))}%</span></p>
          </div>
          <div class="ca-selectline"><label class="ca-lab" for="assignLender">Assign Lender</label>
            <select class="ca-input" id="assignLender">${RIDE_PRICE_DATA.lenders.map(l => `<option ${l === a.lender ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>
          ${deal.identity && deal.identity.verifiedAt
            ? `<div class="ca-wait"><div class="ca-eyebrow">Identity complete</div><p>Identity verification is already complete, so the advisor does not need to repeat that step during delivery.</p></div>`
            : `<div class="ca-wait"><div class="ca-eyebrow">While you waited</div><p>The Manufacturer Warranty Overview and Service Walk are complete and the Cover Sheet is printed. Next: the Team Lead signs off on the deal and delivers it to Processing — then the menu gets built.</p></div>`}
        </div>
      </div>
    </div>
    <div class="ca-dock">
      <div class="ca-dockinfo"><small>Next step</small><strong>Manager Sign-Off</strong></div>
      <a class="mp-primary" style="display:inline-flex;align-items:center;text-decoration:none" href="#/menu/${esc(deal.id)}">Continue →</a>
    </div>
    <div class="m-scrim" id="caScrim"><div class="m-sheet m-sheet--wide" role="dialog" aria-modal="true" id="caSheet"></div></div>`;
    wireDeskTop();
    wireSheetShell();
    const ds = $("#caDealSum");
    if (ds) ds.onclick = openSummarySheet;
    $("#assignLender").onchange = (e) => {
      a.lender = e.target.value; Store.save();
      toast("Lender assigned: " + a.lender);
      renderApproved();
    };
    if (justNow) toast("Application approved — qualified rate " + a.qualifiedApr + "%");
  }

  /* v2 gate: identity verification comes before the application begins; an
     already-approved deal never re-gates */
  if (app && app.approved) renderApproved();
  else if (!(deal.identity && deal.identity.verifiedAt)) renderIdentity(false);
  else render();
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
        <button type="button" class="mp-dark" id="mpScript">Advisor script</button>
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

    const scriptBtn = $("#mpScript");
    if (scriptBtn) scriptBtn.onclick = () => {
      const isVsc = sel === "vsc10" || sel === "vsc7";
      const lead = isVsc ? `<b>&ldquo;${esc(c.first)}, you told me you drive about ${esc(miles.toLocaleString())} miles a year.</b> At that pace the factory comprehensive coverage is gone in about ${mileageMath().factoryMonths} months.&rdquo; ` : "";
      openSheet2(`${sheetTop("Advisor script")}
        <div class="mp-script">${lead}${esc(t.body)}</div>
        <p class="mp-sheetnote">Tie it down to what they told you in discovery — the benefit must make sense to <b>them</b> (WIIFM).</p>
        <p class="mp-sheetnote"><b>The 300% rule:</b> present every product without attempting to close after each one. Ask which option they choose only after Preferred, Standard, and Budget have all been presented.</p>
        <button type="button" class="mp-primary mp-wide" data-sheet-close>Back to product</button>`);
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
   VIEW: Finance Menu V3 (owner's replication package, 2026-08-29)
   ============================================================
   Manager sign-off gate, then four stages: Terms → Options → Forms →
   Finalize. The package's copy rule is structural: no instructional
   paragraph under an operational page title, so each screen explains
   itself through labels, state, amounts and one dominant action.

   The persisted `menu.step` keeps its old 1..5 numbering — saved deals in
   localStorage carry it and there is no migration — while the UI shows the
   package's four stages. Step 2 remains the product presentation on its own
   route, reached from Options rather than sitting in the stage row.

   Every business rule the old five-step menu enforced survives: the gate's
   required checks, the Team Lead's recorded jacket override, the initials
   that select a program, the custom box's source column setting rate and
   term, the withheld custom figure, the decline path's initials rule, the
   trade-locked forms, the benefits acknowledgement gate, and the DMS push
   recorded against the Team Lead who approved the deal. */
route("menu/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const v = Store.vehicle(deal.stock);
  const c = Store.customer(deal.customerId);
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const isCash = deal.dealType === "cash";
  const progSet = RIDE_PRICE_DATA.programs[isLease ? "lease" : isCash ? "cash" : "finance"];
  const M = deal.menu;
  migrateMenuV5(deal);
  const colLabel = (key) => key === "custom" ? "Custom" : key === "none" ? "No products" : (progSet[key] || {}).label || key;

  /* ONE definition of a program's spec, so Options and Finalize cannot
     disagree about what the client initialed — Finalize used to rebuild the
     custom column with termAdj/aprAdj of 0 and quoted a different payment
     than the one on the screen the client put their initials on. A program
     that does not exist on this deal type (a finance deal switched to cash
     after Budget was selected) resolves to null rather than throwing. */
  const programSpec = (key) => {
    if (key === "custom") {
      const src = M.customSource === "budget" && progSet.budget ? progSet.budget : null;
      return { label: "Custom", products: M.custom,
        termAdj: src ? src.termAdj : 0, aprAdj: src ? src.aprAdj : 0 };
    }
    return progSet[key] || null;
  };

  /* The signed snapshot is frozen at signing time and carries only the fields
     of the deal type it was calculated for. The desking screens can change
     `dealType` afterwards without clearing it, and reading a finance snapshot
     as a one-pay deal printed `$NaN` on the customer-facing card. A snapshot
     from a different deal type is not this deal's snapshot. */
  const snapshot = () => {
    const s = deal.basePayment && deal.basePayment.snapshot;
    return s && s.dealType === deal.dealType ? s : RIDE_PRICE_CALC.calc(deal, v);
  };
  if ((M.maxStep || 1) < M.step) { M.maxStep = M.step; Store.save(); }
  /* a deal finalized before sign-off existed keeps its history honest */
  if (!deal.signoff && deal.stage === "complete") {
    deal.signoff = { by: RIDE_PRICE_DATA.dealership.teamLead, at: deal.createdAt, backfilled: true }; Store.save();
  }

  /* the stage row is four; the persisted step is five. One map, both ways. */
  const STEP_OF = [1, 3, 4, 5];
  const STAGES = ["Terms", "Options", "Forms", "Finalize"];
  const stageOf = (step) => step >= 5 ? 3 : step >= 4 ? 2 : step >= 3 ? 1 : 0;

  let sheetKey = null;
  function teardown() {
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
    window.removeEventListener("hashchange", teardown);
    const sc = $("#fmScrim"); if (sc) sc.classList.remove("show");
  }
  window.addEventListener("hashchange", teardown);

  function openSheet(html, onMount) {
    const sh = $("#fmSheet"); if (!sh) return;
    sh.innerHTML = `<div class="m-handle"></div>${html}`;
    $("#fmScrim").classList.add("show");
    if (sheetKey) document.removeEventListener("keydown", sheetKey, true);
    sheetKey = (e) => { if (e.key === "Escape") { e.preventDefault(); closeSheet(); } };
    document.addEventListener("keydown", sheetKey, true);
    $$("[data-sheet-close]", sh).forEach(b => b.onclick = closeSheet);
    if (onMount) onMount(sh);
  }
  function closeSheet() {
    const sc = $("#fmScrim"); if (sc) sc.classList.remove("show");
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
  }
  const sheetHead = (title, sub) => `<div class="m-sheettop"><div><h2>${esc(title)}</h2>${sub ? `<p class="m-sheetsub">${esc(sub)}</p>` : ""}</div>
    <button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>`;

  const chips = () => `<div class="fm-chips">
    ${deal.dealNo ? `<span class="fm-chip">Deal #${esc(deal.dealNo)}</span>` : ""}
    <span class="fm-chip">${esc(c.first + " " + c.last)}</span>
    <span class="fm-chip">${esc(v.year + " " + v.make + " " + v.model)}</span>
    <a class="fm-chip fm-chip--link" href="#/jacket/${esc(deal.id)}">Jacket ${jacketCounts(deal).have}/${jacketCounts(deal).total}</a>
  </div>`;

  const shell = (eyebrow, title, body, dock) => `
    <div class="m-app">
      ${deskTop(deal)}
      <main class="fm-main">
        <div class="fm-eyebrow">${esc(eyebrow)}</div>
        <h1 class="fm-title">${esc(title)}</h1>
        ${chips()}
        ${body}
      </main>
      ${dock || ""}
    </div>
    <div class="m-scrim" id="fmScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="fmSheet"></div></div>`;

  /* the golden names the selected package on Options and the stage word
     elsewhere — the dock says what you are about to act on */
  const dock = (stageIdx, btnHtml, strong) => `<div class="fm-dock">
    <div class="fm-dockcopy"><small>Step ${stageIdx + 1} of 4</small><strong>${esc(strong || STAGES[stageIdx])}</strong></div>
    ${btnHtml}</div>`;

  const stageRow = (activeIdx) => `<div class="fm-stages">
    ${STAGES.map((s, i) => {
      const reached = stageOf(Math.max(M.step, M.maxStep || 1)) >= i || deal.stage === "complete";
      const cls = i === activeIdx ? "fm-stage fm-stage--on" : i < activeIdx ? "fm-stage fm-stage--done" : "fm-stage";
      return `<button type="button" class="${cls}" data-stage="${i}"${reached ? "" : " disabled"}>${i < activeIdx ? "✓ " : (i + 1) + " "}${esc(s)}</button>`;
    }).join("")}</div>`;

  /* ---------- the gate: four upstream statuses, nothing recreated ---------- */
  function gate() {
    const jkc = jacketCounts(deal);
    const jov = jacketRead(deal).override;
    const rows = [
      { name: "Base payment agreement", sub: deal.basePayment && deal.basePayment.signedAt ? "Signed" : "Not signed", ok: !!(deal.basePayment && deal.basePayment.signedAt) },
      { name: "Credit application", sub: deal.creditApp && deal.creditApp.approved ? "Approved" : deal.creditApp ? "Submitted" : "Not submitted", ok: !!(deal.creditApp && deal.creditApp.approved) },
      { name: "Test drive", sub: deal.testDrive.done ? "Completed" : "Not completed", ok: !!deal.testDrive.done },
      { name: "Deal Jacket", sub: jkc.missing ? (jov ? `Override recorded by ${jov.by}` : `${jkc.missing} item${jkc.missing === 1 ? "" : "s"} outstanding`) : "Complete", ok: !jkc.missing || !!jov }
    ];
    /* the test drive stays advisory, exactly as it always has — the required
       three are the payment agreement, the credit decision and the jacket */
    const blockers = rows.filter((r, i) => !r.ok && i !== 2);
    const ready = blockers.length === 0;
    const jacketBlocked = jkc.missing && !jov;

    renderChrome("Manager Sign-Off", dealTitle(deal), "");
    document.body.dataset.canvas = "master";
    document.body.dataset.screen = "menu";
    view().innerHTML = shell("Finance handoff", "Manager sign-off", `
      <div class="fm-card">
        <h2 class="fm-cardtitle">Ready for finance</h2>
        <div class="fm-rows">
          ${rows.map(r => `<div class="fm-row">
            <div class="fm-rowmain"><div class="fm-rowname">${esc(r.name)}</div><div class="fm-rowsub">${esc(r.sub)}</div></div>
            <span class="fm-pill${r.ok ? "" : " fm-pill--bad"}">${r.ok ? "Ready" : "Blocked"}</span>
          </div>`).join("")}
        </div>
      </div>
      ${isTeamLead() ? `
        <div class="fm-actions">
          ${jacketBlocked ? `<button type="button" class="fm-btn" id="fmResolve">Resolve Deal Jacket blocker</button>` : ""}
          <button type="button" class="fm-btn fm-btn--primary" id="fmApprove"${ready ? "" : " disabled"}>Approve finance menu</button>
        </div>`
        : `<div class="fm-note">Waiting for Team Lead.</div>`}`);
    wireDeskTop();

    const ap = $("#fmApprove");
    if (ap && !ap.disabled) ap.onclick = () => {
      deal.signoff = { by: RIDE_PRICE_DATA.dealership.teamLead, at: new Date().toISOString() };
      Store.save();
      toast("Approved by " + RIDE_PRICE_DATA.dealership.teamLead);
      render();
    };
    const rs = $("#fmResolve");
    if (rs) rs.onclick = () => openSheet(`${sheetHead("Resolve Deal Jacket blocker", "Override records a reason; missing documents remain missing.")}
      <div class="fm-field"><label for="fmReason">Reason</label>
        <textarea class="fm-input" id="fmReason" rows="3" maxlength="160" placeholder="e.g. Lien release confirmed and funding lock reviewed"></textarea></div>
      <div class="fm-actions">
        <button type="button" class="fm-btn fm-btn--primary" id="fmReasonGo">Record override</button>
        <button type="button" class="fm-btn" data-sheet-close>Cancel</button>
      </div>`, (sh) => {
        $("#fmReasonGo", sh).onclick = () => {
          const reason = ($("#fmReason", sh).value || "").trim();
          if (!reason) { $("#fmReason", sh).style.borderColor = "var(--fm-bad)"; return; }
          jacketOf(deal).override = { by: RIDE_PRICE_DATA.dealership.teamLead, at: new Date().toISOString(), reason };
          Store.save(); closeSheet(); toast("Override recorded"); render();
        };
      });
  }

  /* ---------- stage 1: Terms ---------- */
  function terms() {
    const snap = snapshot();
    const q = deal.creditApp || {};
    const qualified = !isCash && !isLease && q.approved
      ? RIDE_PRICE_CALC.finance(deal, v, { apr: q.qualifiedApr, term: deal.desk.term }) : null;
    /* cash and lease quote a total, not a monthly payment — the pair is
       labelled from the deal type, never suffixed blind (calc.js isTotal) */
    const isOnePay = deal.dealType === "onepay";
    const agreedAmt = isCash ? snap.totalDue : isOnePay ? snap.onePayTotal : snap.payment;
    const agreedLab = isCash ? "Cash total" : isOnePay ? "One-pay total" : "Agreed payment";
    const agreedSub = isCash ? "Total due" : isOnePay ? `Paid in full · ${snap.term} mo lease`
      : isLease ? `${snap.term} mo lease` : `${snap.term} mo @ ${snap.apr}%`;
    const feeNames = isLease
      ? "acquisition fee, cap cost reduction tax, monthly sales tax"
      /* a summary line, not the itemisation — the rates and the word "fee"
         belong in the sheet behind View, and carrying them here wrapped the
         card to twice the golden height */
      : (snap.taxes && snap.taxes.rows || []).map(t => t.label).concat(RIDE_PRICE_DATA.fees.map(f => f.label))
          .map(l => l.replace(/\s*@.*$/, "").replace(/\s+fee$/i, "")).join(", ").toLowerCase();

    const say = isCash
      ? `“The total due is ${money(snap.totalDue)}. If you financed instead, the payment would be ${money(RIDE_PRICE_CALC.finance(deal, v, { apr: deal.desk.apr, term: deal.desk.term }).payment)} a month. Next we'll review your protection choices.”`
      : isOnePay
        /* a one-pay lease has no monthly payment — snap.payment is 0 here, so
           the lease sentence would read "$0.00 a month" */
        ? `“Your one-pay total is ${money(snap.onePayTotal)}, paid in full at signing for the full ${snap.term} months. The lease-end value is ${money(snap.residual)}. Next we'll review your protection choices.”`
      : isLease
        ? `“Your payment is ${money(snap.payment)} a month for ${snap.term} months, including ${money(snap.monthlyTax)} of monthly sales tax. The lease-end value is ${money(snap.residual)}. Next we'll review your protection choices.”`
        : qualified
          ? `“Earlier we agreed to ${money(snap.payment)} for ${snap.term} months at ${snap.apr}%. You qualified at ${q.qualifiedApr}%, which changes the base payment to ${money(qualified.payment)}. Next we'll review your protection choices.”`
          : `“Earlier we agreed to ${money(snap.payment)} for ${snap.term} months at ${snap.apr}%. Once the credit application comes back we'll confirm the qualified payment. Next we'll review your protection choices.”`;

    body(0, `
      <div class="fm-card">
        <h2 class="fm-cardtitle">Payment comparison</h2>
        <div class="fm-pair">
          <div class="fm-quote"><div class="fm-quotelab">${agreedLab}</div>
            <div class="fm-quoteamt">${money(agreedAmt)}</div><div class="fm-quotesub">${esc(agreedSub)}</div></div>
          <div class="fm-quote"><div class="fm-quotelab">Qualified payment</div>
            <div class="fm-quoteamt">${qualified ? money(qualified.payment) : "—"}</div>
            <div class="fm-quotesub">${qualified ? `${qualified.term} mo @ ${q.qualifiedApr}%` : isCash || isLease ? "Not applicable" : "Awaiting credit"}</div></div>
        </div>
        <div class="fm-split">
          <div class="fm-splitmain"><div class="fm-splittitle">Taxes &amp; fees</div>
            <div class="fm-splitsub">${esc(feeNames)}</div></div>
          <button type="button" class="fm-view" id="fmFees">View</button>
        </div>
      </div>
      <div class="fm-card">
        <h2 class="fm-cardtitle">Customer explanation</h2>
        <p class="fm-say">${esc(say)}</p>
      </div>`,
      dock(0, `<button type="button" class="fm-dockbtn" id="fmNext">${M.termsPresented ? "Continue" : "Mark presented"}</button>`));

    $("#fmFees").onclick = () => {
      const rows = isLease
        /* derive the combined row rather than reading snap.payment: onePay()
           zeroes payment while keeping the lease-derived components, so
           reading it printed $0.00 directly under the two figures it is the
           sum of. lease() defines payment as exactly this sum. */
        ? [["Monthly base payment", snap.basePayment], ["Sales tax on base payment", snap.monthlyTax],
           ["Base payment with taxes", RIDE_PRICE_CALC.round2(snap.basePayment + snap.monthlyTax)],
           ["Acquisition fee", snap.acquisitionFee],
           ["Sales tax on cap cost reduction", snap.ccrTax]]
        : (snap.taxes && snap.taxes.rows || []).map(t => [t.label, t.amount]).concat(RIDE_PRICE_DATA.fees.map(f => [f.label, f.amount]));
      const total = isLease
        ? ["Total due at signing", deal.dealType === "onepay" ? snap.onePayTotal : deal.desk.dueAtSigning]
        : [isCash ? "Total due" : "Amount financed", isCash ? snap.totalDue : snap.amountFinanced];
      openSheet(`${sheetHead("Taxes & fees", esc(RIDE_PRICE_DATA.dealership.state || "New York") + " · itemised")}
        <ul class="fm-lines">
          ${rows.map(r => `<li><span>${esc(r[0])}</span><b>${money(r[1])}</b></li>`).join("")}
          <li class="fm-total"><span>${esc(total[0])}</span><b>${money(total[1])}</b></li>
        </ul>`);
    };
    $("#fmNext").onclick = () => {
      if (!M.termsPresented) { M.termsPresented = true; Store.save(); }
      go(1);
    };
  }

  /* ---------- stage 2: Options ---------- */
  let pack = null, packScroll = 0;
  function options() {
    const cols = Object.entries(progSet).map(([key, p]) => RIDE_PRICE_CALC.menuColumn(deal, v, key, p));
    const customResult = RIDE_PRICE_CALC.menuColumn(deal, v, "custom", programSpec("custom"));
    if (!pack) pack = M.selectedProgram && M.selectedProgram !== "none" ? M.selectedProgram : cols[0].key;
    const isCustom = pack === "custom";
    const col = isCustom ? customResult : (cols.find(x => x.key === pack) || cols[0]);
    /* Custom withholds its figure until the advisor reveals it — the dock
       must not leak what the panel is concealing */
    const hidden = isCustom && !M.showCustomPay;
    const suffix = col.isTotal ? "" : "<small>/mo</small>";
    const shownProducts = isCustom ? M.custom : col.products.filter(pid => !M.custom.includes(pid));

    body(1, `
      <div class="fm-packs">
        ${[...cols.map(x => ({ key: x.key, label: x.label })), { key: "custom", label: "Custom" }]
          .map(t => `<button type="button" class="fm-pack${pack === t.key ? " fm-pack--on" : ""}" data-pack="${esc(t.key)}">${esc(t.label)}</button>`).join("")}
      </div>
      <div class="fm-card">
        <div class="fm-paylab">${esc(col.label)} ${col.isTotal ? "total" : "payment"}</div>
        <div class="fm-payamt">${hidden ? "— — —" : money(col.payment)}${hidden ? "" : suffix}</div>
        <div class="fm-paysub">${hidden ? "Reveal the payment when you are ready" : esc(col.detail)}</div>
        ${hidden ? `<div class="fm-actions"><button type="button" class="fm-btn" id="fmReveal">Show custom payment</button></div>` : ""}
        <div class="fm-prods">
          ${shownProducts.length ? shownProducts.map(pid => {
            const p = RIDE_PRICE_CALC.productById(pid);
            return `<div class="fm-prod">
              <span class="fm-prodtick">✓</span>
              <span class="fm-prodmain">${esc(p.name)} — ${esc(p.detail)}<span class="fm-prodprice"> · ${money0(p.price)}</span></span>
              ${isCustom
                ? `<button type="button" class="fm-move" data-return="${esc(pid)}">Remove</button>`
                : `<button type="button" class="fm-move" data-move="${esc(pid)}" data-src="${esc(col.key)}">→ Custom</button>`}
            </div>`;
          }).join("") : `<div class="fm-empty">${isCustom
            ? "Send products here from another package to build a custom program. The first product's package sets the rate and term."
            : "Every product in this package has been moved to Custom."}</div>`}
        </div>
      </div>
      <div class="fm-card">
        <div class="fm-split" style="margin-top:0;padding-top:0;border-top:0">
          <div class="fm-splitmain"><div class="fm-splittitle">Product presentation</div>
            <div class="fm-splitsub">${M.presented ? "Presented to the customer" : "Present each product before the payment"}</div></div>
          <a class="fm-view" href="#/present/${esc(deal.id)}">${M.presented ? "Re-present" : "Present"}</a>
        </div>
      </div>
      ${M.selectedProgram && M.selectedProgram !== "none" ? `<div class="fm-card">
        <h2 class="fm-cardtitle">Accepted</h2>
        <div class="fm-row"><div class="fm-rowmain"><div class="fm-rowname">${esc(colLabel(M.selectedProgram))}</div>
          <div class="fm-rowsub">Initials ${esc(M.initials || "—")}</div></div><span class="fm-tick">✓</span></div>
      </div>` : ""}`,
      dock(1, `<button type="button" class="fm-dockbtn" id="fmAccept">${M.selectedProgram && M.selectedProgram !== "none" ? "Continue" : `Accept ${esc(col.label)}`}</button>
        <button type="button" class="fm-docklink" id="fmNone">No products</button>`, col.label));

    /* options() rebuilds the whole view, and the pill row scrolls when the
       lease programs' long labels overflow it. Without this the row snaps
       back to the start on every tap and the pill the user just pressed
       jumps out from under their finger. */
    const packRow = $(".fm-packs");
    if (packRow && packScroll) packRow.scrollLeft = packScroll;
    $$("[data-pack]").forEach(b => b.onclick = () => {
      const row = $(".fm-packs");
      packScroll = row ? row.scrollLeft : 0;
      pack = b.dataset.pack; options();
    });
    const rev = $("#fmReveal"); if (rev) rev.onclick = () => { M.showCustomPay = true; Store.save(); options(); };
    $$("[data-move]").forEach(b => b.onclick = () => {
      const pid = b.dataset.move, src = b.dataset.src;
      /* the old menu guarded against a cash deal pulling from Budget with a
         blocked toast. A cash deal has no Budget program to pull from, so the
         guard could never fire — the absence of the column is the rule now,
         and a customSource left over from a finance session is neutralised
         where the adjustment is read, not here. */
      if (!M.custom.length) M.customSource = src;
      if (!M.custom.includes(pid)) M.custom.push(pid);
      M.showCustomPay = false; Store.save(); options();
    });
    $$("[data-return]").forEach(b => b.onclick = () => {
      M.custom = M.custom.filter(x => x !== b.dataset.return);
      if (!M.custom.length) M.customSource = null;
      M.showCustomPay = false; Store.save(); options();
    });

    $("#fmAccept").onclick = () => {
      if (M.selectedProgram && M.selectedProgram !== "none") return go(2);
      if (isCustom && !M.custom.length) return toast("The custom box is empty — add a product first");
      openSheet(`${sheetHead("Accept " + col.label, hidden ? "" : money(col.payment) + (col.isTotal ? " total" : " per month"))}
        <div class="fm-field"><label for="fmIni">Client initials</label>
          <input class="fm-input" id="fmIni" maxlength="4" placeholder="JS" autocomplete="off"></div>
        <div class="fm-actions"><button type="button" class="fm-btn fm-btn--primary" id="fmIniGo">Accept package</button></div>`,
        (sh) => {
          const inp = $("#fmIni", sh); inp.focus();
          $("#fmIniGo", sh).onclick = () => {
            const val = (inp.value || "").trim();
            if (!val) { inp.style.borderColor = "var(--fm-bad)"; return; }
            M.selectedProgram = pack; M.initials = val; Store.save();
            closeSheet(); toast("Client initialed: " + col.label); go(2);
          };
        });
    };
    $("#fmNone").onclick = () => {
      /* one confirmation, and never a blocked toast for the custom box:
         declining clears what was built rather than refusing (package) */
      openSheet(`${sheetHead("Continue without products", "The customer declines every optional product.")}
        <div class="fm-field"><label for="fmDecIni">Client initials</label>
          <input class="fm-input" id="fmDecIni" maxlength="4" placeholder="JS" autocomplete="off"></div>
        <p class="jk2-privacy">The benefits acknowledgement on the next step records the refusal.${M.custom.length ? " The custom box is cleared." : ""}</p>
        <div class="fm-actions"><button type="button" class="fm-btn fm-btn--primary" id="fmDecGo">Continue without products</button></div>`,
        (sh) => {
          const inp = $("#fmDecIni", sh); inp.focus();
          $("#fmDecGo", sh).onclick = () => {
            const val = (inp.value || "").trim();
            if (!val) { inp.style.borderColor = "var(--fm-bad)"; return; }
            M.selectedProgram = "none"; M.initials = val;
            M.custom = []; M.customSource = null; M.showCustomPay = false;
            Store.save(); closeSheet(); go(2);
          };
        });
    };
  }

  /* ---------- stage 3: Forms ---------- */
  function forms() {
    const reqForms = requiredTradeForms(deal);
    reqForms.forEach(fid => { if (!deal.forms.selected.includes(fid)) deal.forms.selected.push(fid); });
    if (reqForms.length) Store.save();
    const chosen = deal.forms.selected.length;

    body(2, `
      <div class="fm-card">
        <h2 class="fm-cardtitle">Benefits acknowledgement</h2>
        <p class="fm-say">The benefits and protection options available have been explained, and the customer may choose or refuse optional products.</p>
        ${M.ackSigned
          ? `<div class="fm-split"><div class="fm-splitmain"><div class="fm-splittitle">${esc(M.ackName || c.first + " " + c.last)}</div>
              <div class="fm-splitsub">Signed · initials ${esc(M.initials || "—")}</div></div>
              <span class="fm-pill">Signed</span></div>`
          : `<div class="fm-actions"><button type="button" class="fm-btn fm-btn--primary" id="fmSign">Client signs acknowledgement</button></div>`}
      </div>
      <div class="fm-card">
        <div class="fm-split" style="margin-top:0;padding-top:0;border-top:0">
          <div class="fm-splitmain"><div class="fm-splittitle">Additional deal forms</div>
            <div class="fm-splitsub">${chosen ? `${chosen} selected` : "None selected"}</div></div>
          <button type="button" class="fm-view" id="fmForms">Choose</button>
        </div>
      </div>`,
      dock(2, `<button type="button" class="fm-dockbtn" id="fmNext"${M.ackSigned ? "" : " disabled"}>Continue</button>`));

    const sign = $("#fmSign");
    if (sign) sign.onclick = () => openSheet(`${sheetHead("Benefits acknowledgement", c.first + " " + c.last)}
      <p class="jk2-privacy">The benefits and protection option(s) available have been explained to me/us and I/we choose the option(s) initialed (${esc(M.initials || "—")}). I/We hold the Dealer harmless for my/our refusal of any optional benefit or protection.</p>
      <div class="fm-sig">${esc(c.first + " " + c.last)}</div>
      <div class="fm-actions"><button type="button" class="fm-btn fm-btn--primary" id="fmSignGo">Sign acknowledgement</button></div>`,
      (sh) => {
        $("#fmSignGo", sh).onclick = () => {
          M.ackSigned = true; M.ackName = c.first + " " + c.last; Store.save();
          closeSheet(); toast("Acknowledgement signed"); forms();
        };
      });

    $("#fmForms").onclick = () => {
      const groups = {};
      RIDE_PRICE_DATA.dealForms.forEach(f => { (groups[f.group] = groups[f.group] || []).push(f); });
      openSheet(`${sheetHead("Additional deal forms", "Anything the trade requires is selected and locked.")}
        ${Object.entries(groups).map(([g, list]) => `
          <div class="fm-grouplab">${esc(g)}</div>
          ${list.map(f => { const locked = reqForms.includes(f.id);
            return `<label class="fm-formrow"><input type="checkbox" data-form="${esc(f.id)}"${deal.forms.selected.includes(f.id) ? " checked" : ""}${locked ? " disabled" : ""}>
              <span class="fm-formmain">${esc(f.label)}${locked ? `<span class="fm-formlock">required by the trade</span>` : ""}</span></label>`;
          }).join("")}`).join("")}
        <div class="fm-actions"><button type="button" class="fm-btn fm-btn--primary" data-sheet-close>Done</button></div>`,
        (sh) => {
          $$("[data-form]", sh).forEach(cb => cb.onchange = () => {
            const picked = $$("[data-form]", sh).filter(x => x.checked).map(x => x.dataset.form);
            /* locked forms are disabled inputs and never report checked —
               put them back or the trade's paperwork quietly disappears */
            reqForms.forEach(fid => { if (!picked.includes(fid)) picked.push(fid); });
            deal.forms.selected = picked; Store.save();
          });
        });
    };
    const nx = $("#fmNext");
    if (nx && !nx.disabled) nx.onclick = () => { deal.stage = "forms"; Store.save(); go(3); };
  }

  /* ---------- stage 4: Finalize ---------- */
  function finalize() {
    if (deal.forms.finalized) return finalized();
    const selKey = M.selectedProgram;
    const spec = selKey && selKey !== "none" ? programSpec(selKey) : null;
    const purchased = spec ? spec.products : [];
    const colResult = spec ? RIDE_PRICE_CALC.menuColumn(deal, v, selKey, spec) : null;
    const snap = snapshot();
    const jkc = jacketCounts(deal);
    const jov = jacketRead(deal).override;
    const ready = [
      { name: "Manager sign-off", sub: "Complete", ok: true },
      { name: "Terms presented", sub: M.termsPresented ? "Complete" : "Not presented", ok: !!M.termsPresented },
      /* a program chosen before the deal type changed no longer exists here;
         say so rather than reporting a decision that cannot be priced */
      { name: "Protection decision",
        sub: selKey === "none" ? "Declined — no products"
          : colResult ? `${colLabel(selKey)} · ${money(colResult.payment)}${colResult.isTotal ? "" : "/mo"}`
          : selKey ? `${colLabel(selKey)} — not offered on this deal type; choose again`
          : "Not chosen",
        ok: selKey === "none" || !!colResult },
      { name: "Benefits acknowledgement", sub: M.ackSigned ? "Signed" : "Not signed", ok: !!M.ackSigned },
      { name: "Deal Jacket", sub: `${jkc.have} / ${jkc.total}${jkc.missing && jov ? " · override recorded" : ""}`, ok: !jkc.missing || !!jov }
    ];
    const canFinalize = ready.every(r => r.ok);

    body(3, `
      <div class="fm-card">
        <h2 class="fm-cardtitle">Ready to finalize</h2>
        <div class="fm-rows">
          ${ready.map(r => `<div class="fm-row">
            <div class="fm-rowmain"><div class="fm-rowname">${esc(r.name)}</div><div class="fm-rowsub">${esc(r.sub)}</div></div>
            <span class="fm-tick${r.ok ? "" : " fm-prodtick--off"}">${r.ok ? "✓" : "•"}</span>
          </div>`).join("")}
        </div>
      </div>
      <div class="fm-card">
        <h2 class="fm-cardtitle">Repayment summary</h2>
        <ul class="fm-lines">
          ${purchased.length ? purchased.map(pid => { const p = RIDE_PRICE_CALC.productById(pid);
            return `<li><span>${esc(p.name)}</span><b>${money(p.price)}</b></li>`; }).join("")
            : `<li><span>No products selected</span><b>${money(0)}</b></li>`}
          <li class="fm-total"><span>${colResult ? (colResult.isTotal ? "Total due" : "Monthly payment") : isCash ? "Total due" : "Monthly payment"}</span>
            <b>${money(colResult ? colResult.payment : isCash ? snap.totalDue : deal.dealType === "onepay" ? snap.onePayTotal : snap.payment)}</b></li>
        </ul>
        <div class="fm-split">
          <div class="fm-splitmain"><div class="fm-splittitle">Print centre</div>
            <div class="fm-splitsub">Repayment options page and the selected forms</div></div>
          <a class="fm-view" href="#/forms/${esc(deal.id)}">Open</a>
        </div>
      </div>`,
      dock(3, `<button type="button" class="fm-dockbtn" id="fmFinal"${canFinalize ? "" : " disabled"}>Finalize deal</button>`));

    const fb = $("#fmFinal");
    if (fb && !fb.disabled) fb.onclick = () => {
      /* one closeout action: the DMS delivery is part of finalizing, not a
         second primary button (package). The push is recorded against the
         Team Lead who approved the deal — the dealership's standing rule
         that a Team Lead is responsible for it, kept without inventing a
         second gate the package does not describe. */
      deal.forms.finalized = true; deal.stage = "complete";
      deal.dms = { at: new Date().toISOString(), by: (deal.signoff && deal.signoff.by) || RIDE_PRICE_DATA.dealership.teamLead };
      Store.save();
      render();
    };
  }

  function finalized() {
    const jkc = jacketCounts(deal);
    renderChrome("Finance Menu", dealTitle(deal), "");
    document.body.dataset.canvas = "master";
    document.body.dataset.screen = "menu";
    view().innerHTML = `
      <div class="m-app">
        ${deskTop(deal)}
        <main class="fm-main">
          <div class="fm-done">
            <div class="fm-donetick">✓</div>
            <div class="fm-eyebrow">Finance complete</div>
            <h1 class="fm-title">Deal finalized</h1>
            <p class="fm-donesay">The completed package was pushed to the DMS.${deal.dealNo ? ` Deal #${esc(deal.dealNo)}` : " This deal"} has moved out of the active Deals queue.</p>
          </div>
          <div class="fm-card">
            <div class="fm-rows">
              <div class="fm-row"><div class="fm-rowmain"><div class="fm-rowname">DMS push</div>
                <div class="fm-rowsub">Completed${deal.dms && deal.dms.by ? ` · ${esc(deal.dms.by)}` : ""}</div></div><span class="fm-pill">Sent</span></div>
              <div class="fm-row"><div class="fm-rowmain"><div class="fm-rowname">Deal Jacket</div>
                <div class="fm-rowsub">${jkc.have} / ${jkc.total}</div></div>
                <span class="fm-pill${jkc.missing ? " fm-pill--bad" : ""}">${jkc.missing ? jkc.missing + " outstanding" : "Complete"}</span></div>
            </div>
          </div>
          <div class="fm-actions">
            <a class="fm-btn fm-btn--primary" href="#/deals" style="display:grid;place-items:center;text-decoration:none">Return to Deals</a>
            <a class="fm-btn" href="#/forms/${esc(deal.id)}" style="display:grid;place-items:center;text-decoration:none">Print centre</a>
          </div>
        </main>
      </div>
      <div class="m-scrim" id="fmScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="fmSheet"></div></div>`;
    wireDeskTop();
  }

  /* ---------- shared frame ---------- */
  function body(stageIdx, cards, dockHtml) {
    renderChrome("Finance Menu", dealTitle(deal), "");
    document.body.dataset.canvas = "master";
    document.body.dataset.screen = "menu";
    const titles = ["Review the deal terms", "Choose a protection package", "Disclosures & forms", "Final review"];
    view().innerHTML = shell("Finance menu", titles[stageIdx],
      `${stageRow(stageIdx)}${cards}`, dockHtml);
    wireDeskTop();
    $$("[data-stage]").forEach(b => { if (!b.disabled) b.onclick = () => go(parseInt(b.dataset.stage, 10)); });
    const scrim = $("#fmScrim");
    if (scrim) scrim.onclick = (e) => { if (e.target === scrim) closeSheet(); };
  }

  function go(stageIdx) {
    M.step = STEP_OF[stageIdx];
    M.maxStep = Math.max(M.maxStep || 1, M.step);
    Store.save();
    render();
  }

  function render() {
    closeSheet();
    if (!deal.signoff) return gate();
    if (deal.forms.finalized) return finalized();
    ({ 0: terms, 1: options, 2: forms, 3: finalize }[stageOf(M.step)] || terms)();
  }
  render();
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
const JACKET_OUTSIDE = ["license", "insurance", "title", "lienrel", "paystub"];

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

/* What this particular deal needs, worked out from the deal itself. This is
   the same idea as requiredTradeForms() widened to the whole packet — that
   function stays the authority on the three forms it locks. */
function jacketDocs(deal) {
  const out = [];
  /* whyShort is the phone's status tag (owner usability pass, 2026-08-16:
     one status line per card); the long reason stays for desktop */
  const add = (id, why, whyShort) => {
    const m = docMeta(id);
    if (!m || out.some(d => d.id === id)) return;
    out.push(Object.assign({ why, whyShort: whyShort || why, added: false }, m));
  };
  const isCash = deal.dealType === "cash";
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const cb = deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;

  add("form-license", cb ? "Identity for both buyers on the deal" : "Identity for the buyer", "Identity");
  add("form-privacy", "Handed to every client at delivery", "Required at delivery");
  add("form-reg", "Registers and titles the new vehicle in New York", "Title & registration");
  add("form-insurance", "Coverage has to be proven before the car leaves the lot", "Required for delivery");
  if (deal.basePayment && deal.basePayment.signedAt) add("agreement", "The base terms the client signed", "Signed base terms");
  if (!isCash) {
    add("form-contracts", isLease ? "The lease agreement itself" : "The retail instalment contract itself", isLease ? "Lease contract" : "Retail contract");
    add("form-creditmatch", "The signed application must match what went to the lender", "Lender match");
    add("form-riskdisc", "Required whenever credit decides the rate", "Credit disclosure");
  }
  if (deal.trade && deal.trade.has) {
    add("form-appraisal", "What the trade was valued at, and why", "Trade valuation");
    add("form-plates", "The client's plates move to the new vehicle", "Plate transfer");
    add("form-odometer", "Federal odometer disclosure for the trade", "Trade odometer");
    /* the trade answers already select and lock these on the forms step */
    requiredTradeForms(deal).forEach(fid => add("form-" + fid, "Required by the trade — locked on the deal forms step", "Trade requirement"));
  }
  /* a stip only exists once a lender has asked for it — an approved credit
     app is the moment the lender enters the deal */
  if (!isCash && deal.creditApp && deal.creditApp.approved) add("form-paystub", "Lender stipulation — proof of income", "Lender stips");
  if (deal.menu && deal.menu.selectedProgram && deal.menu.selectedProgram !== "none") {
    add("form-fimenu", "The products the client initialed for", "Menu initials");
    add("repayment", "What was purchased and what was declined", "Menu record");
    if (menuChosenProducts(deal).includes("gap")) add("form-gapwaiver", "GAP was purchased — the waiver goes in the jacket", "GAP purchased");
  }
  if (deal.testDrive && (deal.testDrive.signed || deal.testDrive.done)) add("testdrive", "Signed before the client drove the car", "Signed pre-drive");
  add("form-tqi", "The delivery quality walk, done with the client", "Delivery walk");
  add("form-settings", "Phone, seats and mirrors set before handover", "Handover setup");
  add("delivery", "The delivery checklist itself, signed off", "Delivery sign-off");

  /* anything the advisor added by hand, or a scan brought in unprompted */
  jacketRead(deal).extra.forEach(id => {
    const m = docMeta(id);
    if (m && !out.some(d => d.id === id)) out.push(Object.assign({ why: "Added to this deal by hand", whyShort: "Added by hand", added: true }, m));
  });
  return out;
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
  upload: `<path d="M12 16.5V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15"/>`
};
const rpIcon = (k) => `<svg viewBox="0 0 24 24">${RP_ICON[k] || RP_ICON.file}</svg>`;
/* the customer's document rows, keyed by the document they stand for */
const DR_ROW_ICON = {
  "form-insurance": rpIcon("shield"),
  "form-license": rpIcon("idcard"),
  "form-paystub": rpIcon("page"),
  default: rpIcon("file")
};
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
function drAddShots(deal, docId, files) {
  const m = clientMeta(docId);
  const r = jacketClient(deal)[docId];
  const preserving = r && r.state === "rejected" && m.missingPage && r.rejectedReason === m.missingPage.title;
  if (!preserving) clientPhotosClear(deal.id, docId);
  const urls = clientPhotos(deal.id, docId).slice();
  Array.from(files).forEach(f => urls.push(drPreviewUrl(f)));
  clientPhotosSet(deal.id, docId, urls);
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

/* ---------------- the deal jacket, V2 (owner's replication package) --------
   The owner's "Deal Jacket & Customer Requests V2" package (2026-08-29)
   folded the old compliance screen and the separate Send Text Request route
   into one surface on the master canvas. Its thesis: compliance complexity
   belongs behind the interface, so the advisor answers three questions fast —
   what are we waiting on from the customer, what forms does the team still
   owe, and is the deal fundable. Hence three buckets (Waiting on customer,
   Deal forms collapsed, Completed collapsed), one funding-readiness object
   instead of a row of counters, and a bottom sheet for every secondary
   decision so requesting documents never leaves the jacket.

   Every rule the old screen enforced survives: the jacket keeps a RECORD and
   never a file, Mark received says plainly that nothing was scanned or
   verified, only documents this portal printed carry a marker to read, and
   funding sign-off stays locked until nothing is outstanding — with the Team
   Lead's recorded override still honoured. */
route("jacket/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  /* both internal buckets start collapsed — progressive disclosure is locked
     by the package, and the advisor opens Deal forms only to work them */
  const ui = { formsOpen: false, completedOpen: false };
  let camDoc = null;        /* which customer document the camera is filling */
  let sheetKey = null;      /* the Escape handler the open sheet installed */
  let sendLock = false;     /* a send is in flight — the sheet may not close */
  /* this view re-renders whole: marking a document received from a row far
     down the page would otherwise jump the advisor back to the top, losing
     the place they were working (review lesson 6). Scroll is state here. */
  let firstPaint = true;

  /* a listener must never outlive the view: leaving the route does not re-run
     the wiring, so a stale Escape handler would call render() and paint the
     jacket over whichever screen the user moved to (the lesson from PR #50) */
  function teardown() {
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
    window.removeEventListener("hashchange", teardown);
  }
  window.addEventListener("hashchange", teardown);

  /* ---- what the buckets hold ---- */
  const inJacket = (d) => !!jacketState(deal, d.id);
  const isCustomerDoc = (d) => CLIENT_QUEUE_IDS.includes(d.id);
  /* the licence exception is local to the LICENCE (the package's own rule) —
     the paystub also has a missingPage beat ("Second paystub is missing"),
     and matching any missing page here sent that rejection to the licence
     sheet with "add the back barcode side" instructions (review find) */
  function backMissing(docId) {
    if (docId !== "form-license") return false;
    const m = clientMeta(docId); const r = jacketClient(deal)[docId];
    return !!(m && m.missingPage && r && r.state === "rejected" && r.rejectedReason === m.missingPage.title);
  }
  /* Requested is derived from the client pipeline record alone — the j.req
     stamp is write-only history, and reading it here made a document taken
     back out of the jacket say "Requested" forever (review find) */
  function custStatus(d) {
    const r = jacketClient(deal)[d.id];
    if (r && r.state === "rejected") return backMissing(d.id) ? { cls: "blocked", label: "Back needed" } : { cls: "blocked", label: "Retake needed" };
    if (r && r.state === "requested") return { cls: "requested", label: "Requested" };
    return { cls: "", label: "Needed" };
  }

  /* ---- the sheet, one per screen, carrying every secondary decision ---- */
  function openSheet(html, onMount) {
    const sh = $("#jkSheet"); if (!sh) return;
    sh.innerHTML = `<div class="m-handle"></div>${html}`;
    $("#jkScrim").classList.add("show");
    if (sheetKey) document.removeEventListener("keydown", sheetKey, true);
    sheetKey = (e) => { if (e.key === "Escape") { e.preventDefault(); closeSheet(); } };
    document.addEventListener("keydown", sheetKey, true);
    $$("[data-sheet-close]", sh).forEach(b => b.onclick = closeSheet);
    if (onMount) onMount(sh);
  }
  function closeSheet() {
    /* a confirmed send may not be dismissed away: during the brief sending
       window Escape and a scrim tap are inert, or the advisor's own "I'm
       done" gesture after tapping Send silently discarded the request with
       no feedback (review find). Navigating away still cancels — teardown
       and the timer's own liveness check do not come through here. */
    if (sendLock) return;
    const sc = $("#jkScrim"); if (sc) sc.classList.remove("show");
    if (sheetKey) { document.removeEventListener("keydown", sheetKey, true); sheetKey = null; }
  }
  const sheetHead = (title, sub) => `<div class="m-sheettop"><div><h2>${esc(title)}</h2>${sub ? `<p class="m-sheetsub">${esc(sub)}</p>` : ""}</div>
    <button type="button" class="m-close" data-sheet-close aria-label="Close">✕</button></div>`;

  function render() {
    const keepScroll = window.scrollY;
    const docs = jacketDocs(deal);
    const jk = jacketRead(deal);
    const cst = Store.customer(deal.customerId);
    const veh = Store.vehicle(deal.stock);
    const ov = jk.override;

    const custWaiting = docs.filter(d => isCustomerDoc(d) && !inJacket(d));
    const formsWaiting = docs.filter(d => !isCustomerDoc(d) && !inJacket(d));
    const completed = docs.filter(inJacket);
    const total = docs.length;
    const done = completed.length;
    const rem = total - done;
    const pct = total ? Math.round(done / total * 100) : 0;
    const reqSent = !!jk.reqSentAt;
    /* what the banner may claim: only documents actually ON the open request
       and still owed by the customer. Counting all of custWaiting overstated
       a partial send (3 pending beside two rows reading Needed), and counting
       only state "requested" hid the banner entirely when every document on
       the send was sitting rejected — the one confirmation of that send
       (review find). A rejected document is still owed: the link shows it
       with its retake. Gated on reqSent, or an advisor-side rejection with
       no send yet would claim a request went out. */
    const reqPending = reqSent ? custWaiting.filter(d => {
      const r = jacketClient(deal)[d.id];
      return !!r && (r.state === "requested" || r.state === "rejected");
    }) : [];
    /* sign-off unlocks at complete; a Team Lead's recorded override is the
       one documented way past it and still counts (owner, 2026-08-16) */
    const fundable = rem === 0 || !!ov;
    const addable = RIDE_PRICE_DATA.dealForms.filter(f => !docs.some(d => d.id === "form-" + f.id));

    renderChrome("Deal Jacket", dealTitle(deal), "");
    document.body.dataset.canvas = "master";
    document.body.dataset.screen = "jacket";

    const rowHtml = (d, kind) => {
      const st = kind === "customer" ? custStatus(d)
        : kind === "done" ? { cls: "done", label: "In jacket" }
          : { cls: "", label: "Needed" };
      /* a refused document says WHY on its own row — the reason was recorded
         but invisible here, so "Retake needed" gave no clue what was wrong */
      const rej = kind === "customer" && st.cls === "blocked" ? (jacketClient(deal)[d.id] || {}).rejectedReason : null;
      const sub = kind === "done" ? receivedLine(d)
        : rej ? rej
          : (isCustomerDoc(d) ? (clientMeta(d.id) || {}).plainReason || d.whyShort : d.whyShort);
      return `<button type="button" class="jk2-row" data-open="${esc(d.id)}" data-kind="${esc(kind)}">
        <span class="jk2-icon">${DR_ROW_ICON[d.id] || DR_ROW_ICON.default}</span>
        <span class="jk2-rowcopy"><span class="jk2-rowtitle">${esc(d.label)}</span><span class="jk2-rowsub">${esc(sub)}</span></span>
        <span class="jk2-status${st.cls ? " jk2-status--" + st.cls : ""}">${esc(st.label)}</span>
      </button>`;
    };

    view().innerHTML = `
      <div class="m-app">
        ${deskTop(deal)}
        <main class="jk2-main">
          <div class="jk2-crumb">${deal.dealNo ? `Deal #${esc(deal.dealNo)}` : "This deal"} <i>›</i> ${cst ? esc(cst.first + " " + cst.last) : "—"} <i>›</i> Deal jacket</div>
          <div class="jk2-context">
            <div class="jk2-contextmeta"><strong>${cst ? esc(cst.first + " " + cst.last) : "—"}</strong>
              <span>${veh ? esc(veh.year + " " + veh.make + " " + veh.model) : "no vehicle yet"}</span></div>
            ${deal.dealNo ? `<div class="jk2-dealno">#${esc(deal.dealNo)}</div>` : ""}
          </div>

          <section class="jk2-hero">
            <div class="jk2-herotop">
              <div><div class="jk2-eyebrow">Funding readiness</div>
                <h1 class="jk2-herotitle">${rem ? `${rem} item${rem === 1 ? "" : "s"} remaining` : "Ready for sign-off"}</h1></div>
              <div class="jk2-count${rem ? "" : " jk2-count--good"}">${done} of ${total} complete</div>
            </div>
            <div class="jk2-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Deal jacket ${pct}% complete"><span style="width:${pct}%"></span></div>
            <p class="jk2-note">${rem
        ? custWaiting.length
          ? `<b>${custWaiting.length} item${custWaiting.length === 1 ? " needs" : "s need"} the customer.</b> ${formsWaiting.length ? `The other ${formsWaiting.length} ${formsWaiting.length === 1 ? "is a deal form" : "are deal forms"} your team completes.` : "All deal forms are complete."}`
          : `<b>All customer documents are in.</b> The ${formsWaiting.length} remaining ${formsWaiting.length === 1 ? "is a deal form" : "are deal forms"} your team completes.`
        : `<b>Jacket complete.</b> Everything required for funding sign-off is recorded.`}</p>
          </section>

          <section class="jk2-section">
            <div class="jk2-sechead">
              <div class="jk2-secmain"><div class="jk2-sectitle">Waiting on customer</div>
                <div class="jk2-secsub">${custWaiting.length} document${custWaiting.length === 1 ? "" : "s"}</div></div>
              <div class="jk2-badge jk2-badge--${custWaiting.length ? "warn" : "good"}">${custWaiting.length ? `${custWaiting.length} needed` : "Complete"}</div>
            </div>
            ${custWaiting.length
        ? `<div class="jk2-rows">${custWaiting.map(d => rowHtml(d, "customer")).join("")}</div>`
        : `<div class="jk2-inline jk2-inline--flush">All customer documents are in the jacket.</div>`}
            ${reqPending.length ? `<div class="jk2-inline">✓ Secure request sent · ${reqPending.length} document${reqPending.length === 1 ? "" : "s"} still pending · <button type="button" class="jk2-smalllink" id="jkTrack">View status</button></div>` : ""}
            ${custWaiting.length ? `<div class="jk2-secactions">
              <button type="button" class="jk2-primary" id="jkRequest">${reqSent ? `Resend secure request (${custWaiting.length})` : `Request ${custWaiting.length} document${custWaiting.length === 1 ? "" : "s"}`}</button>
              ${custWaiting.length > 1 ? `<button type="button" class="jk2-linkbtn" id="jkSnapAll">Capture all ${custWaiting.length} here instead</button>` : ""}
            </div>` : ""}
          </section>

          <section class="jk2-section">
            <button type="button" class="jk2-sechead" id="jkFormsToggle" aria-expanded="${ui.formsOpen}" aria-controls="jkFormsRows">
              <span class="jk2-secmain"><span class="jk2-sectitle">Deal forms</span>
                <span class="jk2-secsub">Internal forms and signatures</span></span>
              <span class="jk2-badge jk2-badge--${formsWaiting.length ? "warn" : "good"}">${formsWaiting.length ? `${formsWaiting.length} remaining` : "Complete"}</span>
              <span class="jk2-chev${ui.formsOpen ? " jk2-chev--open" : ""}" aria-hidden="true">⌄</span>
            </button>
            <div id="jkFormsRows">${ui.formsOpen ? `
              ${formsWaiting.length
        ? `<div class="jk2-rows">${formsWaiting.map(d => rowHtml(d, "form")).join("")}</div>`
        : `<div class="jk2-inline jk2-inline--flush">All required deal forms are complete.</div>`}
              <div class="jk2-secactions"><button type="button" class="jk2-linkbtn" id="jkAddOpt">+ Add optional document</button></div>` : ""}</div>
          </section>

          <section class="jk2-section">
            <button type="button" class="jk2-sechead" id="jkDoneToggle" aria-expanded="${ui.completedOpen}" aria-controls="jkDoneRows">
              <span class="jk2-secmain"><span class="jk2-sectitle">Completed</span>
                <span class="jk2-secsub">Already in the jacket</span></span>
              <span class="jk2-badge jk2-badge--good">${done}</span>
              <span class="jk2-chev${ui.completedOpen ? " jk2-chev--open" : ""}" aria-hidden="true">⌄</span>
            </button>
            <div id="jkDoneRows">${ui.completedOpen ? (completed.length
        ? `<div class="jk2-rows">${completed.map(d => rowHtml(d, "done")).join("")}</div>`
        : `<div class="jk2-inline jk2-inline--flush jk2-inline--warn">Nothing is in the jacket yet.</div>`) : ""}</div>
          </section>

          ${ov && rem ? `<div class="jk2-inline jk2-inline--warn jk2-inline--bare">Sign-off unlocked by override — ${esc(ov.by)}: “${esc(ov.reason)}”</div>` : ""}

          <button type="button" class="jk2-smalllink" id="jkScript">Advisor script</button>
          <a class="jk2-smalllink" href="#/forms/${esc(deal.id)}">Print Center</a>
        </main>

        <div class="jk2-dock">
          <div class="jk2-dockcopy"><small>Funding sign-off</small>
            <strong>${deal.signoff ? `Signed off by ${esc(deal.signoff.by)}` : rem ? `${rem} item${rem === 1 ? "" : "s"} remaining` : "Jacket complete"}</strong></div>
          <button type="button" class="jk2-dockbtn" id="jkSignoff"${fundable || deal.signoff ? "" : " disabled"}>${deal.signoff ? "View sign-off" : fundable ? "Complete sign-off →" : "Not ready"}</button>
        </div>
      </div>
      <div class="m-scrim" id="jkScrim"><div class="m-sheet" role="dialog" aria-modal="true" id="jkSheet"></div></div>
      <input type="file" accept="image/*" capture="environment" id="jkCam" hidden>
      <input type="file" accept="image/*" id="jkFile" hidden>`;

    wireDeskTop();
    wire(custWaiting, addable);
    /* keep the advisor where they were working. The page can be shorter after
       a document moves buckets, so clamp rather than restoring blind. */
    if (firstPaint) firstPaint = false;
    else window.scrollTo(0, Math.min(keepScroll, Math.max(0, document.body.scrollHeight - window.innerHeight)));
  }

  /* what the Completed row says it knows — the distinction the old screen
     drew between a machine check and a person's word is kept word for word */
  function receivedLine(d) {
    const st = jacketState(deal, d.id); if (!st) return "";
    const how = st.how === "scan" ? "Camera scan · verified"
      : st.how === "client" ? "Customer upload · accepted"
        : st.how === "sort" ? "Snap & Sort · auto-filed (demo)"
          : "Marked received by " + st.by;
    return how + " · " + jacketStamp(st.at);
  }

  /* ---- the sheets ---- */

  /* one secure request carries every customer document still missing. The
     advisor stays here: sending and resending never leave the jacket. */
  function requestSheet(waiting) {
    const cst = Store.customer(deal.customerId);
    const reqSent = !!jacketRead(deal).reqSentAt;
    openSheet(`${sheetHead(reqSent ? "Resend documents" : "Request documents", cst ? cst.first + " " + cst.last + (cst.phone ? " · " + cst.phone : "") : "")}
      <div class="jk2-choicelist">
        ${waiting.map(d => `<label class="jk2-choice"><input type="checkbox" checked data-pick="${esc(d.id)}">
          <span class="jk2-choicecopy"><strong>${esc(d.label)}</strong><span>${esc((clientMeta(d.id) || {}).plainReason || d.whyShort)}</span></span></label>`).join("")}
      </div>
      <p class="jk2-privacy">Ride Price sends a secure link. The customer uploads directly into Ride Price — document images do not pass through the salesperson's text messages or photo library.</p>
      <p class="demo-note">Demo — the message is simulated; nothing leaves this device.</p>
      <div class="jk2-sheetactions jk2-sheetactions--single">
        <button type="button" class="jk2-sheetbtn jk2-sheetbtn--primary" id="jkSend">${reqSent ? "Resend" : "Send"} secure request</button></div>`,
      (sh) => {
        $("#jkSend", sh).onclick = () => {
          const picked = $$("[data-pick]", sh).filter(c => c.checked).map(c => c.dataset.pick);
          if (!picked.length) return toast("Choose at least one document");
          sh.innerHTML = `<div class="m-handle"></div><div class="scan-stage"><div class="scan-spin"></div><p class="scan-instruct">Sending the secure link…</p></div>`;
          /* the send window is the same liveness problem the old composer had:
             NAVIGATING AWAY mid-send must not let the timer write state and
             repaint over whatever screen is showing by then. Dismissal is a
             different case: sendLock makes Escape and the scrim inert until
             the send lands, so a confirmed send cannot be silently thrown
             away by an "I'm done" tap on the backdrop (review find). */
          sendLock = true;
          const alive = () => document.contains(sh) && !!$("#jkScrim") && $("#jkScrim").classList.contains("show");
          setTimeout(() => {
            if (!alive()) { sendLock = false; return; }
            sendRequest(picked);
            sendLock = false;
            closeSheet();
            /* no toast: the package puts this feedback in the jacket itself,
               where it stays readable — the inline banner under the customer
               rows says what was sent and offers the delivery status */
            render();
          }, 800);
        };
      });
  }

  /* one secure link covers every document ticked, and the client pipeline
     record is the ONE ledger of it. A document already accepted is never
     reset, and a rejected one keeps its rejection — the reason and the
     preserved pages (the licence front) are exactly what the customer's
     retake needs. (The old j.req stamp is no longer written: two ledgers
     recording the same send is how a removed document came to read
     "Requested" forever — review find.) */
  function sendRequest(ids) {
    const j = jacketOf(deal);
    const cl = jacketClientOf(deal);
    const at = new Date().toISOString();
    j.reqSentAt = at;
    ids.forEach(qid => {
      if (!cl[qid] || cl[qid].state === "requested") cl[qid] = { state: "requested", requestedAt: at };
    });
    Store.save();
  }

  /* delivery status, local to the jacket — never its own route */
  function trackingSheet(waiting) {
    const cst = Store.customer(deal.customerId);
    const jk = jacketRead(deal);
    /* one set, read twice: the numerator and the denominator must describe the
       same documents or the sheet reports two different truths (lesson 7).
       Advisor-side captures (via: "advisor") are excluded from BOTH — this
       sheet reports what the CUSTOMER did with the link, and an in-showroom
       scan is not the customer opening or uploading anything (review find). */
    const cl = jacketClient(deal);
    const asked = CLIENT_QUEUE_IDS.filter(qid => cl[qid] && cl[qid].via !== "advisor");
    const uploaded = asked.filter(qid => cl[qid].state !== "requested");
    openSheet(`${sheetHead("Customer request", cst ? "Sent to " + cst.first + " " + cst.last + (cst.phone ? " · " + cst.phone : "") : "")}
      <div class="jk2-track">
        <div class="jk2-trackrow"><span class="jk2-dot">✓</span><b>Link sent</b><span>${esc(jacketStamp(jk.reqSentAt))}</span></div>
        <div class="jk2-trackrow"><span class="jk2-dot">✓</span><b>Delivered</b><span>${esc(jacketStamp(jk.reqSentAt))}</span></div>
        <div class="jk2-trackrow${uploaded.length ? "" : " jk2-trackrow--pending"}"><span class="jk2-dot">${uploaded.length ? "✓" : "•"}</span><b>Customer opened</b><span>${uploaded.length ? "Opened" : "Waiting"}</span></div>
        <div class="jk2-trackrow${uploaded.length ? "" : " jk2-trackrow--pending"}"><span class="jk2-dot">${uploaded.length ? "✓" : "•"}</span><b>Documents uploaded</b><span>${uploaded.length} of ${asked.length}</span></div>
      </div>
      <p class="jk2-privacy">The customer's phone is played by this same browser — open it to run the upload side of the demo.</p>
      <div class="jk2-sheetactions">
        <button type="button" class="jk2-sheetbtn" id="jkResend">Resend link</button>
        <button type="button" class="jk2-sheetbtn jk2-sheetbtn--primary" data-sheet-close>Done</button></div>
      <div class="jk2-sheetactions jk2-sheetactions--single">
        <button type="button" class="jk2-sheetbtn" id="jkOpenPhone">Open the customer's phone</button></div>`,
      (sh) => {
        $("#jkResend", sh).onclick = () => requestSheet(waiting);
        $("#jkOpenPhone", sh).onclick = () => { closeSheet(); navigate("#/clientlink/" + deal.id + "/sms"); };
      });
  }

  /* one contextual sheet per row — no permanent button rail on the rows */
  function docSheet(d, kind) {
    if (kind === "done") return recordSheet(d);
    if (isCustomerDoc(d) && backMissing(d.id)) return licenseSheet(d);
    const customer = isCustomerDoc(d);
    const outside = d.origin === "outside";
    /* only paper this portal printed carries a marker to read; a title or an
       insurance card has nothing to scan, so it is never offered one */
    const capture = customer
      ? { title: d.id === "form-license" ? "Finish license capture" : "Take photo", sub: d.id === "form-license" ? "Capture front and back in one session" : "Use this device camera" }
      : outside ? null
        : { title: "Scan the document", sub: "Reads the marker strip Ride Price printed on it" };
    openSheet(`${sheetHead(d.label, customer ? (clientMeta(d.id) || {}).plainReason || d.whyShort : d.why)}
      <div class="jk2-choicelist">
        ${capture ? `<button type="button" class="jk2-choice" id="jkCapture"><span class="jk2-icon">${rpIcon("camera")}</span>
          <span class="jk2-choicecopy"><strong>${esc(capture.title)}</strong><span>${esc(capture.sub)}</span></span><span class="jk2-go">›</span></button>` : ""}
        <button type="button" class="jk2-choice" id="jkUpload"><span class="jk2-icon">${rpIcon("upload")}</span>
          <span class="jk2-choicecopy"><strong>Upload file</strong><span>Choose a document already on this device</span></span><span class="jk2-go">›</span></button>
        <button type="button" class="jk2-choice" id="jkMark"><span class="jk2-icon">${rpIcon("check")}</span>
          <span class="jk2-choicecopy"><strong>Mark received</strong><span>Record a document received outside Ride Price</span></span><span class="jk2-go">›</span></button>
      </div>`,
      (sh) => {
        const cap = $("#jkCapture", sh);
        if (cap) cap.onclick = () => {
          closeSheet();
          if (customer) openCam(d.id, true);
          else openDocScanFlow(deal, render, { expect: d.id, onHand: () => markSheet(d) });
        };
        $("#jkUpload", sh).onclick = () => {
          closeSheet();
          if (customer) openCam(d.id, false);
          else uploadFlow(d);
        };
        $("#jkMark", sh).onclick = () => markSheet(d);
      });
  }

  /* the licence exception stays local to the licence — a focused sheet, never
     a toast that explains a requirement and then disappears */
  function licenseSheet(d) {
    openSheet(`${sheetHead("Finish driver's license", "Front received · back still required")}
      <div class="jk2-inline jk2-inline--warn jk2-inline--bare">The front is already saved. Add the back barcode side to finish this document.</div>
      <div class="jk2-sheetactions jk2-sheetactions--single">
        <button type="button" class="jk2-sheetbtn jk2-sheetbtn--primary" id="jkBack">Capture back</button></div>`,
      (sh) => { $("#jkBack", sh).onclick = () => { closeSheet(); openCam(d.id, true); }; });
  }

  /* a manual receipt is exactly that: the jacket records that a person took
     the document in, and never implies Ride Price read or verified it */
  function markSheet(d) {
    openSheet(`${sheetHead("Mark received", d.label)}
      <div class="jk2-field"><label for="jkNote">Source or note <i>(optional)</i></label>
        <textarea class="jk2-input" id="jkNote" rows="3" maxlength="120" placeholder="e.g. received from the customer in the showroom"></textarea></div>
      <p class="jk2-privacy">Recorded against this deal as taken in by ${esc(roleName())}. Nothing is uploaded and nothing is read — this records the item in the jacket without pretending Ride Price scanned or verified it.</p>
      <div class="jk2-sheetactions jk2-sheetactions--single">
        <button type="button" class="jk2-sheetbtn jk2-sheetbtn--primary" id="jkMarkGo">Mark received</button></div>`,
      (sh) => {
        $("#jkMarkGo", sh).onclick = () => {
          jacketReceive(deal, d.id, "hand", ($("#jkNote", sh).value || "").trim());
          closeSheet(); toast("Marked received by " + roleName()); render();
        };
      });
  }

  /* what the jacket holds for something already in — and the way back out */
  function recordSheet(d) {
    const st = jacketState(deal, d.id); if (!st) return;
    const viewable = d.origin !== "outside"
      ? `#/print/${esc(deal.id)}/${esc(d.id)}`
      : (st.how === "client" || st.how === "sort") && CLIENT_QUEUE_IDS.includes(d.id)
        ? `#/docreview/${esc(deal.id)}/${esc(d.id)}` : null;
    openSheet(`${sheetHead(d.label, receivedLine(d))}
      <p class="jk2-privacy">${st.how === "scan" ? "Verified — the app read the marker it printed on this page."
        : st.how === "sort" ? "Auto-filed by Snap &amp; Sort (demo — a simulated check)."
          : st.how === "client" ? "Uploaded by the customer through the secure link and accepted after review."
            : "Taken in by hand. The jacket keeps the record, not the paper."}${st.note ? " Note: " + esc(st.note) : ""}</p>
      <div class="jk2-sheetactions${viewable ? "" : " jk2-sheetactions--single"}">
        ${viewable ? `<a class="jk2-sheetbtn" href="${esc(viewable)}">View</a>` : ""}
        <button type="button" class="jk2-sheetbtn" id="jkUndo">Take back out</button></div>
      ${d.added ? `<div class="jk2-sheetactions jk2-sheetactions--single"><button type="button" class="jk2-sheetbtn" id="jkDrop">Remove from this deal</button></div>` : ""}`,
      (sh) => {
        $("#jkUndo", sh).onclick = () => { jacketRemove(deal, d.id); closeSheet(); render(); };
        const drop = $("#jkDrop", sh);
        if (drop) drop.onclick = () => { jacketDrop(deal, d.id); closeSheet(); toast("Taken off this deal"); render(); };
      });
  }

  /* optional forms stay behind a link, never a permanent top-level workflow.
     The list is the portal's own form set — a free-typed name would create a
     document the print route could not render. */
  function addOptSheet(addable) {
    openSheet(`${sheetHead("Add optional document", "Add only what this deal genuinely needs — it counts against the jacket until it comes in.")}
      <div class="jk2-field"><label for="jkAddSel">Document</label>
        <select class="jk2-input" id="jkAddSel">
          <option value="" selected>Choose a document (${addable.length} available)</option>
          ${addable.map(f => `<option value="form-${esc(f.id)}">${esc(f.label)} — ${esc(f.group)}</option>`).join("")}
        </select></div>
      <div class="jk2-sheetactions jk2-sheetactions--single">
        <button type="button" class="jk2-sheetbtn jk2-sheetbtn--primary" id="jkAddGo">Add document</button></div>`,
      (sh) => {
        $("#jkAddGo", sh).onclick = () => {
          const aid = $("#jkAddSel", sh).value;
          if (!aid) return toast("Choose a document first");
          const j = jacketOf(deal);
          if (!j.extra.includes(aid)) { j.extra.push(aid); Store.save(); }
          closeSheet(); toast("Added to this deal's jacket"); render();
        };
      });
  }

  function scriptSheet() {
    openSheet(`${sheetHead("Advisor script", "Use only when you need a quick word track.")}
      <div class="jk2-script">
        <p>“I'm going to send you one secure Ride Price link for the few documents we still need.”</p>
        <p>“Upload them straight from your phone — you don't need to text or email anything private to me.”</p>
        <p>“As they arrive, your deal jacket updates on its own, and we keep the delivery date.”</p>
      </div>`);
  }

  /* the upload path for internal paper: the photo proves the document is in
     hand and is then discarded — nothing is stored and nothing is read from
     it (owner, 2026-08-16 / invariant 4). The record is what the jacket keeps. */
  function uploadFlow(d) {
    openSheet(`${sheetHead("Upload file", d.label)}
      <label class="scan-frame scan-frame--tap scan-cap">
        <span class="scan-frame__icon">${rpIcon("camera")}</span><span class="scan-frame__label" id="jkUplLabel">Photograph the document</span>
        <input type="file" accept="image/*" id="jkUplFile"></label>
      <div class="jk2-field"><label for="jkUplNote">Source or note <i>(optional)</i></label>
        <input type="text" class="jk2-input" id="jkUplNote" maxlength="120" placeholder="e.g. faxed by the credit union"></div>
      <p class="jk2-privacy">The photo confirms it is in hand and is then discarded — the jacket keeps the record, not the paper. Recorded as taken in by ${esc(roleName())}.</p>
      <div class="jk2-sheetactions">
        <button type="button" class="jk2-sheetbtn" id="jkUplHand">Without a photo</button>
        <button type="button" class="jk2-sheetbtn jk2-sheetbtn--primary" id="jkUplGo" disabled>Mark received</button></div>`,
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
        const receive = () => { jacketReceive(deal, d.id, "hand", ($("#jkUplNote", sh).value || "").trim()); closeSheet(); toast("Marked received by " + roleName()); render(); };
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

  /* ---- wiring ---- */
  function wire(custWaiting, addable) {
    const docs = jacketDocs(deal);
    $$("[data-open]").forEach(b => b.onclick = () => {
      const d = docs.find(x => x.id === b.dataset.open);
      if (d) docSheet(d, b.dataset.kind);
    });
    const scrim = $("#jkScrim");
    if (scrim) scrim.onclick = (e) => { if (e.target === scrim) closeSheet(); };

    if ($("#jkRequest")) $("#jkRequest").onclick = () => requestSheet(custWaiting);
    if ($("#jkTrack")) $("#jkTrack").onclick = () => trackingSheet(custWaiting);
    if ($("#jkSnapAll")) $("#jkSnapAll").onclick = () => navigate("#/snapall/" + deal.id + "/advisor");
    if ($("#jkAddOpt")) $("#jkAddOpt").onclick = () => addOptSheet(addable);
    $("#jkScript").onclick = scriptSheet;
    $("#jkFormsToggle").onclick = () => { ui.formsOpen = !ui.formsOpen; render(); };
    $("#jkDoneToggle").onclick = () => { ui.completedOpen = !ui.completedOpen; render(); };
    const so = $("#jkSignoff");
    if (so && !so.disabled) so.onclick = () => navigate("#/menu/" + deal.id);

    const onPick = (inp) => () => {
      if (!inp.files || !inp.files.length || !camDoc) return;
      drAddShots(deal, camDoc, inp.files);
      const result = drAutoVerify(deal, camDoc);
      /* the record says WHO captured it: without this, an in-showroom scan
         made the tracking sheet claim the customer opened the link and
         uploaded — actions they never took (review find). Absent via means
         the customer's own device, so records from before this field — and
         every real client upload — keep counting as theirs. */
      const rec = jacketClient(deal)[camDoc];
      if (rec) { rec.via = "advisor"; Store.save(); }
      toast(result.ok ? "✓ Verified. Moved to Completed." : "Blocked: " + result.issue);
      camDoc = null;
      render();
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

/* the prototype's DEBUG strip: live ledger counters plus one-tap jumps
   between the two "devices" this one browser is playing. Rendered on the
   document-flow screens, where a deal is in hand. */
function drDebugStrip(deal) {
  const led = jacketLedgers(deal);
  return `<div class="dr-debug"><b>DEBUG</b><span>received ${led.received}/${led.total}</span><span>accepted ${led.accepted}/${led.total}</span><span class="dr-debug__sp"></span><button type="button" data-dbg="advisor">Advisor</button><button type="button" data-dbg="client">Client link</button></div>`;
}
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
  function useCapture() {
    const result = drAutoVerify(deal, st.docId);
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
      drAddShots(deal, docId, inp.files);
      const result = drAutoVerify(deal, docId);
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
        drAddShots(deal, st.docId, inp.files);
        st.page = Math.max(0, clientPhotos(deal.id, st.docId).length - 1);
        st.zoom = 1; st.screen = "review"; render();
      };
    });
    const more = $("#drCapMore");
    if (more) more.onchange = () => {
      if (!more.files || !more.files.length) return;
      const urls = clientPhotos(deal.id, st.docId).slice();
      const add = Array.from(more.files).map(drPreviewUrl);
      if (more.dataset.replace === "1") {
        try { URL.revokeObjectURL(urls[st.page]); } catch (e) {}
        urls.splice(st.page, 1, ...add);
      } else { urls.push(...add); st.page = urls.length - 1; }
      more.dataset.replace = "";
      clientPhotosSet(deal.id, st.docId, urls);
      render();
    };
    $$("[data-retake]").forEach(b => b.onclick = () => { if (more) { more.dataset.replace = "1"; more.value = ""; more.click(); } });
    $$("[data-add-page]").forEach(b => b.onclick = () => { if (more) { more.dataset.replace = ""; more.value = ""; more.click(); } });
    $$("[data-del-page]").forEach(b => b.onclick = () => {
      clientPhotoDrop(deal.id, st.docId, st.page);
      st.page = Math.max(0, st.page - 1); render();
    });
    $$("[data-move]").forEach(b => b.onclick = () => {
      const urls = clientPhotos(deal.id, st.docId).slice();
      const to = b.dataset.move === "+" ? st.page + 1 : st.page - 1;
      if (to < 0 || to >= urls.length) return;
      [urls[st.page], urls[to]] = [urls[to], urls[st.page]];
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

route("docreview/:id/:docId", ({ id, docId }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const d = docMeta(docId); const m = clientMeta(docId);
  if (!d || !m) return navigate("#/jacket/" + id);
  const st = { zoom: 1, page: 0 };

  renderChrome(d.label, dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/jacket/${esc(deal.id)}">← Deal Jacket</a>`);
  document.body.dataset.screen = "docreview";

  function render() {
    const r = jacketClient(deal)[docId];
    const done = jacketState(deal, docId);
    const urls = clientPhotos(deal.id, docId);
    const pages = Math.max(1, (r && (r.pages || r.draftPages)) || urls.length || 1);
    st.page = Math.min(st.page, pages - 1);
    const u = urls[st.page];
    const statusBox = done
      ? done.how === "sort"
        ? `<div class="dr-doneline"><b>✓ System Verified (simulated)</b><p>${esc(m.verifiedSummary || "")} Nothing was read from the photos — the demo scripts this result.</p></div>`
        : `<div class="dr-doneline"><b>✓ Accepted${done.how === "client" ? " by " + esc(done.by) : ""}</b><p>In the jacket since ${esc(jacketStamp(done.at))}.${done.note ? " Note: " + esc(done.note) : ""}</p></div>`
      : r && r.state === "rejected"
        ? `<div class="dr-doneline dr-doneline--blocked"><b>⚠ ${esc(r.rejectedReason || "Needs a new photo")}</b><p>The client link and the jacket queue both offer the retake.</p></div>`
        : "";
    view().innerHTML = `
      <div class="dr-reviewwrap">
        <div class="dr-reviewhead"><b>${esc(d.label)}</b>
          <span>${done ? "System verified " + esc(jacketStamp(done.at)) : r && r.receivedAt ? "Received " + esc(drStamp(r.receivedAt)) : "Nothing on file yet"} · ${pages} page${pages === 1 ? "" : "s"}</span></div>
        <div class="dr-stage">${u ? `<img class="dr-photo" src="${esc(u)}" alt="Document page" style="transform:scale(${st.zoom})">` : `<div class="dr-photoart" style="transform:scale(${st.zoom})"></div>`}
          <div class="dr-zoom"><button type="button" data-zoom="-" aria-label="Zoom out">−</button><button type="button" data-zoom="+" aria-label="Zoom in">＋</button></div></div>
        <div class="dr-pagetools"><button type="button" data-page="-" ${st.page === 0 ? "disabled" : ""} aria-label="Previous page">←</button><b>Page ${st.page + 1} of ${pages}</b><button type="button" data-page="+" ${st.page >= pages - 1 ? "disabled" : ""} aria-label="Next page">→</button></div>
        ${u ? "" : `<p class="hint" style="text-align:center">The photo lived only in the session that captured it — the record is what the jacket keeps.</p>`}
        ${statusBox}
        <a class="btn btn--ghost dr-donereturn" href="#/jacket/${esc(deal.id)}">← Back to Deal Jacket</a>
      </div>`;
    view().insertAdjacentHTML("beforeend", drDebugStrip(deal));
    wire();
    drWireDebug(deal);
    drPinchZoom($(".dr-stage"), st, render);
  }

  function wire() {
    $$("[data-zoom]").forEach(b => b.onclick = () => { st.zoom = b.dataset.zoom === "+" ? Math.min(1.9, st.zoom + .15) : Math.max(.75, st.zoom - .15); render(); });
    $$("[data-page]").forEach(b => b.onclick = () => {
      const r = jacketClient(deal)[docId];
      const urls = clientPhotos(deal.id, docId);
      const pages = Math.max(1, (r && (r.pages || r.draftPages)) || urls.length || 1);
      st.page = b.dataset.page === "+" ? Math.min(pages - 1, st.page + 1) : Math.max(0, st.page - 1); render();
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

  renderChrome("Snap All Documents", dealTitle(deal), "");
  /* reached from the client link, this is still the CUSTOMER's page and keeps
     their canvas — no app bar, no role switch (owner, 2026-08-27; the chrome
     was leaking back in here after the client page had shed it) */
  const clientSide = origin !== "advisor";
  document.body.dataset.screen = clientSide ? "clientlink" : "snapall";

  /* shots are session-only object URLs until Confirm hands them to a
     document's page set; leaving the screen releases whatever was not kept */
  const st = { screen: "capture", shots: [], results: null, retakeNote: "", passes: 0, retakeTarget: null, beat: {} };
  const releaseShot = (s) => { try { URL.revokeObjectURL(s.url); } catch (e) {} };
  function cleanup() { st.shots.forEach(releaseShot); st.shots = []; window.removeEventListener("hashchange", cleanup); }
  window.addEventListener("hashchange", cleanup);

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
    return targets.map(tid => {
      const d = docMeta(tid); const m = clientMeta(tid);
      const shots = fed[tid] || [];
      const base = { id: tid, icon: m.icon, title: d.label, shots };
      if (!shots.length) return Object.assign(base, { status: "missing" });
      /* the burst obeys the same rules the row path does: enough pages
         first, then the document's own first-attempt beat. Without this a
         two-sided document could pass here on a single shot while the same
         photo is refused one screen away. */
      const rec = jacketClient(deal)[tid] || {};
      if (m.minPages && shots.length < m.minPages && m.missingPage)
        return Object.assign(base, { status: "attention", kind: "pages", issue: m.missingPage.title });
      if (m.firstIssue && !(rec.tries > 0) && !st.beat[tid]) {
        st.beat[tid] = true;
        return Object.assign(base, { status: "attention", kind: "issue", issue: drFirstIssueText(m) });
      }
      return Object.assign(base, { status: "verified", detail: "Matched: " + (cst ? cst.first + " " + cst.last : "this deal") + " · " + m.sortDetail });
    });
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

  function captureScreen() {
    const n = st.shots.length;
    return `<div class="sa-wrap">
      <div class="sa-cam">
        <div class="sa-camtop"><button type="button" class="sa-x" id="saClose" aria-label="Close">×</button><b>Snap All Documents</b><span></span></div>
        <div class="sa-viewfinder"><b>Hold steady over any paper, card, or ID</b>
          <span>Take photos one after another. The system will identify and sort them automatically.</span></div>
        ${st.retakeNote ? `<p class="sa-retakenote">${esc(st.retakeNote)}</p>` : ""}
        ${n ? `<div class="sa-thumbs">${st.shots.map((s, i) => `
          <span class="sa-thumb"><img src="${esc(s.url)}" alt="Captured photo ${i + 1}">
            <button type="button" class="sa-thumb__x" data-unshot="${esc(s.id)}" aria-label="Remove photo ${i + 1}"><i>×</i></button></span>`).join("")}</div>` : ""}
        <div class="sa-controls">
          <button type="button" class="sa-gallery" id="saGallery"><span aria-hidden="true">🖼️</span>Gallery</button>
          <button type="button" class="sa-shutter" id="saShutter" aria-label="Snap photo"><span></span></button>
          <span></span>
        </div>
        <input type="file" accept="image/*" capture="environment" id="saCam" hidden>
        <input type="file" accept="image/*" multiple id="saLib" hidden>
        ${n ? `<button type="button" class="sa-process" id="saProcess">Process ${n} Photo${n === 1 ? "" : "s"} &amp; Auto-Sort →</button>` : ""}
        <p class="demo-note">Demo — the sorting is simulated; nothing is read from your photos and they never leave this device.</p>
      </div>
    </div>`;
  }

  function resultsScreen() {
    const ok = st.results.filter(r => r.status === "verified");
    const attn = st.results.filter(r => r.status === "attention");
    const missing = st.results.filter(r => r.status === "missing");
    return `<div class="sa-wrap">
      <div class="sa-results">
        <div class="sa-reshead"><h2>Upload Results</h2><p>Deal #${esc(deal.dealNo || "")}${cst ? " • " + esc(cst.first + " " + cst.last) : ""}</p></div>
        <div class="sa-resbody">
          ${ok.length ? `<p class="sa-grouplab sa-grouplab--green">Verified (${ok.length})</p>` + ok.map(r => `
            <div class="sa-card"><span class="dr-rowicon" aria-hidden="true">${DR_ROW_ICON[r.id] || DR_ROW_ICON.default}</span>
              <span class="sa-cardcopy"><b>${esc(r.title)}</b><span>${esc(r.detail)} · ${r.shots.length} page${r.shots.length === 1 ? "" : "s"}</span></span>
              <span class="sa-verified">Verified</span></div>`).join("") : ""}
          ${attn.length ? `<p class="sa-grouplab sa-grouplab--amber">Needs attention (${attn.length})</p>` + attn.map(r => `
            <div class="sa-card">
              <span class="dr-rowicon" aria-hidden="true">${DR_ROW_ICON[r.id] || DR_ROW_ICON.default}</span>
              <span class="sa-cardcopy"><b>${esc(r.title)}</b>
                <span class="sa-issue">${esc(r.issue)}</span>
                <button type="button" class="dr-linkbtn sa-override" data-sa-accept="${esc(r.id)}">Accept anyway</button></span>
              <button type="button" class="dr-clientadd" data-sa-retake="${esc(r.id)}">${r.kind === "pages" ? "Add the page" : "Retake"}</button>
            </div>`).join("") : ""}
          ${missing.length ? `<p class="sa-grouplab">Still needed (${missing.length})</p>` + missing.map(r => `
            <div class="sa-card sa-card--missing"><span class="dr-rowicon" aria-hidden="true">${DR_ROW_ICON[r.id] || DR_ROW_ICON.default}</span>
              <span class="sa-cardcopy"><b>${esc(r.title)}</b><span>No photo landed on this one</span></span></div>`).join("") : ""}
          <p class="dr-demonote">Demo — the sorting is simulated. Nothing is read from your photos and they never leave this device.</p>
        </div>
        <button type="button" class="sa-save" id="saSave">Confirm &amp; Save to Deal Jacket →</button>
      </div>
    </div>`;
  }

  function render() {
    view().innerHTML = st.screen === "results" ? resultsScreen() : captureScreen();
    /* the DEBUG counters are staff furniture and this screen is often the
       customer's (owner, 2026-08-27). The ✕ already returns wherever they came
       from, so the strip added nothing here; the trainer keeps the marked demo
       control on the customer side, as on the upload page. */
    if (clientSide) view().insertAdjacentHTML("beforeend", `<button type="button" class="dr-demoexit" data-dbg="advisor">Demo · advisor view</button>`);
    drWireDebug(deal);
    if (st.screen === "results") {
      $("#saSave").onclick = commit;
      $$("[data-sa-retake]").forEach(b => b.onclick = () => {
        const flagged = st.results.find(r => r.id === b.dataset.saRetake);
        if (!flagged) return;
        /* a bad photo is replaced; a missing page is added to — the same
           rule the row path follows, so the two never disagree */
        if (flagged.kind !== "pages") {
          flagged.shots.forEach(releaseShot);
          st.shots = st.shots.filter(s => s.target !== flagged.id);
        }
        st.retakeTarget = flagged.id;
        st.retakeNote = flagged.kind === "pages"
          ? "Add the missing page for " + flagged.title + " — the next shots go to it."
          : "Retake " + flagged.title + " — capture the current document.";
        st.screen = "capture"; render();
      });
      $$("[data-sa-accept]").forEach(b => b.onclick = () => {
        const r = st.results.find(x => x.id === b.dataset.saAccept);
        if (!r) return;
        r.status = "verified";
        r.detail = "Accepted with exception — " + r.issue;
        r.override = true;
        render();
      });
      return;
    }
    $("#saClose").onclick = () => navigate(backHash); /* the hashchange cleanup releases the shots */
    $("#saShutter").onclick = () => { const inp = $("#saCam"); inp.value = ""; inp.click(); };
    $("#saGallery").onclick = () => { const inp = $("#saLib"); inp.value = ""; inp.click(); };
    [["#saCam", "camera"], ["#saLib", "gallery"]].forEach(([sel, source]) => {
      const inp = $(sel);
      inp.onchange = () => {
        Array.from(inp.files || []).forEach(f => st.shots.push({ id: uid("s"), url: URL.createObjectURL(f), source, target: st.retakeTarget }));
        render();
      };
    });
    $$("[data-unshot]").forEach(b => b.onclick = () => {
      const i = st.shots.findIndex(s => s.id === b.dataset.unshot);
      if (i >= 0) { releaseShot(st.shots[i]); st.shots.splice(i, 1); render(); }
    });
    if ($("#saProcess")) $("#saProcess").onclick = () => { st.results = buildResults(); st.screen = "results"; render(); };
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
      : (deal.creditApp && deal.creditApp.approved && deal.creditApp.lender)
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

  docs.cover = () => shell("Deal Cover Sheet", `
    <ul class="lines">
      <li><span>Deal Type / Stage</span><b class="amt">${DEAL_TYPES[deal.dealType]} · ${(STAGES[deal.stage] || {}).label || deal.stage}</b></li>
      ${snap ? `<li><span>${isCash ? "Total Due" : isLease ? "Monthly Payment (lease)" : "Monthly Payment"}</span>
        <b class="amt">${money(isCash ? snap.totalDue : (deal.dealType === "onepay" ? snap.onePayTotal : snap.payment))}</b></li>` : ""}
      <li><span>Trade</span><b class="amt">${deal.trade.has ? `${esc(deal.trade.desc || "documented")} · ${money0(deal.trade.value)} / payoff ${money0(deal.trade.payoff)}` : "None"}</b></li>
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
      ${deal.trade.value ? `<li><span>Trade Value / Payoff</span><b class="amt">${money(deal.trade.value)} / ${money(deal.trade.payoff)}</b></li>` : ""}
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
  if (!v) return redirect(`#/vehicles/${deal.id}`);
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
          <div class="pc-metaline">${deal.dealNo ? "Deal #" + esc(deal.dealNo) + " · " : ""}Jacket ${jkc.have}/${jkc.total}</div>
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
  if (!deal.stock || !Store.vehicle(deal.stock)) return redirect(`#/vehicles/${deal.id}`);
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

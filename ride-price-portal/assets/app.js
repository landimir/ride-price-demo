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

/* ---------------- buyers on a deal (add / scan / swap / drop) ---------------- */
/* crumbs are re-set as innerHTML on every render, so the control is wired once, by delegation */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-buyers]");
  if (b) { e.preventDefault(); openBuyersModal(b.dataset.buyers); }
});

function openBuyersModal(dealId) {
  const deal = Store.deal(dealId);
  if (!deal) return;
  modal("Buyers on this deal", `<div id="buyersBody"></div>`);

  /* each card is a tap target routing to the application profile — affordance
     is the chevron plus hover/active states, nothing louder (owner spec) */
  const card = (cust, roleLabel, chipMod) => `<div class="buyer-card buyer-card--link" role="button" tabindex="0" title="Open the credit application">
    <div class="who"><b>${esc(cust.first + " " + cust.last)}</b><br>
      <span class="small">${esc(cust.phone || cust.email || "no contact on file")}</span></div>
    <span class="chip ${chipMod || ""}">${roleLabel}</span>
    <span class="buyer-card__go">›</span>
  </div>`;

  function render() {
    const body = $("#buyersBody");
    if (!body) return; /* modal dismissed */
    const c = Store.customer(deal.customerId);
    const cb = deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;
    body.innerHTML = `
      ${card(c, "Primary")}
      ${cb ? `
        <div class="by-swaprow"><button class="btn btn--ghost btn--sm" id="bySwap" title="Swap primary and co-buyer">⇄ Swap</button></div>
        ${card(cb, "Co-Buyer", "chip--co")}
        <p class="hint" id="byConfirmNote" style="display:none;margin:8px 0 0"></p>
        <div class="right mt"><button class="btn btn--danger btn--sm" id="byDrop">Remove co-buyer</button></div>` : `
        <div class="by-tiles mt">
          <button class="btn btn--grad" id="byScan">🪪 Scan Driver's License</button>
          <button class="btn btn--ghost" id="bySearchBtn">🔎 Search Existing Customer</button>
        </div>
        <div id="bySearchWrap" style="display:none" class="mt">
          <input type="search" id="bySearch" placeholder="Name, phone, or license #" aria-label="Search customers" style="width:100%">
          <div id="byResults" class="mt"></div>
        </div>`}`;

    $$(".buyer-card--link", body).forEach(el => {
      const go = (e) => {
        if (e.target.closest("button")) return;
        closeModal();
        navigate(`#/credit/${deal.id}`);
      };
      el.onclick = go;
      el.onkeydown = (e) => {
        if (e.target.closest("button")) return; /* guard before preventDefault, or a nested button's own key action dies */
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(e); }
      };
    });

    const scanBtn = $("#byScan", body);
    if (scanBtn) scanBtn.onclick = () => {
      closeModal(); /* the scan flow owns the modal */
      openScanFlow({ mode: "cobuyer", deal, onDone: () => router() });
    };

    /* typeahead over the CRM — name, phone digits, or license number */
    const searchBtn = $("#bySearchBtn", body);
    if (searchBtn) searchBtn.onclick = () => {
      searchBtn.style.display = "none";
      $("#bySearchWrap", body).style.display = "";
      const inp = $("#bySearch", body);
      inp.focus();
      const digits = (v) => String(v || "").replace(/\D/g, "");
      inp.oninput = () => {
        const q = inp.value.trim().toLowerCase(), qd = digits(inp.value);
        const box = $("#byResults", body);
        if (!q) { box.innerHTML = ""; return; }
        const hits = Store.s.customers.filter(x => x.id !== deal.customerId).filter(x =>
          (x.first + " " + x.last).toLowerCase().includes(q) ||
          (qd && digits(x.phone).includes(qd)) ||
          (x.license && x.license.number && x.license.number.toLowerCase().includes(q))
        ).slice(0, 8);
        box.innerHTML = hits.length
          ? hits.map(x => `<button class="buyer-card buyer-pick" data-pick="${esc(x.id)}">
              <span class="who"><b>${esc(x.first + " " + x.last)}</b><br>
              <span class="small">${esc(x.phone || x.email || "no contact on file")}</span></span>
            </button>`).join("")
          : `<p class="small muted" style="margin:4px 2px">No matching customers.</p>`;
        $$("[data-pick]", box).forEach(btn => btn.onclick = () => {
          deal.coBuyerId = btn.dataset.pick; Store.save();
          toast("Co-buyer added to the deal");
          router(); render();
        });
      };
    };

    /* swap sits between the cards for everyone; the action itself is a
       Team Lead call (owner decision 2026-08-14 — visible, gated, no hiding) */
    const swap = $("#bySwap", body);
    if (swap) swap.onclick = () => {
      if (!isTeamLead()) return toast("Swapping buyers is a Team Lead action — switch roles first");
      if (deal.menu.ackSigned && !swap.dataset.confirm) {
        swap.dataset.confirm = "1";
        swap.textContent = "⇄ Confirm swap";
        swap.classList.remove("btn--ghost"); swap.classList.add("btn--danger");
        const note = $("#byConfirmNote", body);
        note.style.display = "";
        note.innerHTML = `The benefits acknowledgement was signed with the buyers in their current positions. Swapping clears it — <b>the client must sign it again</b>.`;
        return;
      }
      const tmp = deal.customerId; deal.customerId = deal.coBuyerId; deal.coBuyerId = tmp;
      if (deal.menu.ackSigned) {
        deal.menu.ackSigned = false; delete deal.menu.ackName;
        toast("Buyers swapped — the benefits acknowledgement must be signed again");
      } else toast("Buyers swapped");
      Store.save(); router(); render();
    };

    const drop = $("#byDrop", body);
    if (drop) drop.onclick = () => {
      if (!drop.dataset.confirm) {
        drop.dataset.confirm = "1";
        drop.textContent = "Confirm — remove co-buyer";
        return;
      }
      delete deal.coBuyerId; Store.save();
      toast("Co-buyer removed — their customer record is kept");
      router(); render();
    };
  }
  render();
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
const routes = [];
function route(pattern, fn) { routes.push({ pattern, fn }); }
function navigate(hash) { location.hash = hash; }

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
const dealsUI = { q: "", pipe: "all", arch: false };

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

/* the advisor's five stage chips, read from the deal's stage so every deal
   wears exactly one. Each is one of the app's existing status badges. */
const DEAL_BUCKETS = [
  { id: "desking", label: "Desking", chip: "DESKING", badge: "badge--prog", stages: ["discovery", "vehicle", "testdrive", "desking"] },
  { id: "credit", label: "Credit", chip: "CREDIT", badge: "badge--menu", stages: ["signed", "credit"] },
  { id: "fni", label: "F&I", chip: "F&I", badge: "badge--new", stages: ["menu"] },
  { id: "docs", label: "Docs", chip: "DOCS", badge: "badge--type", stages: ["forms"] },
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
  const act = mine.filter(d => d.stage !== "complete").sort(bySeen);
  const funded = mine.filter(d => d.stage === "complete").sort(bySeen);
  const counts = {
    all: act.length,
    desking: act.filter(d => dealPipe(d) === "desking").length,
    fni: act.filter(d => dealPipe(d) === "fni").length
  };

  /* one baseline row: title + primary action, no stacked subtitle
     (owner refinement, 2026-08-20). The Team Lead reads the floor, the
     advisor reads their own deals — the title says which (owner, 2026-08-23). */
  renderChrome(`${lead ? "Active Deals" : "My Deals"} (${act.length})`, "",
    `<a class="btn btn--grad" href="#/customers">＋ New Customer Visit</a>`);
  document.body.dataset.screen = "deals";

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

  /* Team Lead card — unchanged classic: the whole card is the click target,
     no chevron, no per-card controls (owner refinement, 2026-08-20; kept on
     the owner's instruction 2026-08-23); the chip is pinned to the corner */
  function leadCard(d) {
    const c = Store.customer(d.customerId), { v, vin, stock } = vehicleIds(d);
    const st = STAGES[d.stage] || STAGES.discovery;
    const pipe = dealPipe(d);
    const chip = pipe === "funded" ? `<span class="dl-chip badge--done">FUNDED</span>`
      : pipe === "fni" ? `<span class="dl-chip badge--new">F&amp;I READY</span>`
      : `<span class="dl-chip badge--prog">DESKING</span>`;
    const name = c ? c.first + " " + c.last : "—";
    /* the four identifiers hold for the Team Lead too (owner hard rule,
       2026-08-23): name, VIN, stock, stage — same mono line as the advisor's,
       the rest of the classic card unchanged. During discovery the line is
       simply absent (owner, 2026-08-23): a blank while rapport is being
       built, auto-populated the moment a vehicle lands on the deal. */
    const ids = vin || stock
      ? `<span class="dl-card__ids"><span>VIN ${vin ? `<b>${esc(vin)}</b>` : "Pending"}</span> <span>STK ${stock ? `<b>${esc(stock)}</b>` : "Pending stock-in"}</span></span>`
      : "";
    return `<a class="dl-card dl-card--classic" href="${esc(st.route(d))}" aria-label="Open ${esc(name)}'s deal">
      <b class="dl-card__name">${esc(name)}</b>
      ${ids}
      ${v ? `<span class="dl-card__veh">${esc(v.year + " " + v.make + " " + v.model)}</span>` : ""}
      <span class="dl-card__status">${esc(dealNextAction(d))}</span>
      ${chip}
      <span class="dl-card__chev" aria-hidden="true">›</span>
    </a>`;
  }

  /* Advisor row (owner direction, 2026-08-23): the four identifiers — name,
     VIN, stock, stage — the whole row the tap, a chevron as the cue, and a
     Next line saying what to do on this deal. Funded rows drop the Next line;
     the DONE chip already says it. */
  function advisorCard(d) {
    const c = Store.customer(d.customerId);
    const st = STAGES[d.stage] || STAGES.discovery;
    const b = dealBucket(d);
    const name = c ? c.first + " " + c.last : "—";
    /* universal VIN visibility (owner, 2026-08-23): once a vehicle is on the
       deal, the VIN renders whether or not the unit is stocked in — a known
       value in bold, a missing one as an honest Pending, never invented.
       During discovery the line is simply absent (owner, 2026-08-23): blank
       while rapport is built, auto-populated on vehicle selection. */
    const { v, vin, stock } = vehicleIds(d);
    const ids = vin || stock
      ? `<span class="dl-card__ids"><span>VIN ${vin ? `<b>${esc(vin)}</b>` : "Pending"}</span> <span>STK ${stock ? `<b>${esc(stock)}</b>` : "Pending stock-in"}</span></span>`
      : "";
    return `<a class="dl-card" href="${esc(st.route(d))}" aria-label="Open ${esc(name)}'s deal">
      <b class="dl-card__name">${esc(name)}</b>
      <span class="dl-chip ${esc(b.badge)}">${esc(b.chip)}</span>
      ${ids}
      ${v ? `<span class="dl-card__veh">${esc(v.year + " " + v.make + " " + v.model)}</span>` : ""}
      ${b.id === "done" ? "" : `<span class="dl-card__next dl-card__next--${esc(b.id)}">Next: ${esc(dealNextAction(d))} →</span>`}
      <span class="dl-card__chev" aria-hidden="true">›</span>
    </a>`;
  }

  view().innerHTML = `
    <div class="dl-search">
      <span class="dl-search__icon" aria-hidden="true">🔍</span>
      <input type="search" id="dealSearch" placeholder="Search stock, customer, or VIN…" aria-label="Search deals by customer, stock number, VIN, or phone" value="${esc(dealsUI.q)}">
      <button type="button" class="dl-search__cam" id="dealScanBtn" title="Scan a training license to start a visit" aria-label="Scan a driver's license to start a visit">📷</button>
    </div>
    ${lead ? `<div class="dl-pills" role="group" aria-label="Filter deals by pipeline stage">
      <button type="button" class="dl-pill" data-pipe="all">All (${counts.all})</button>
      <button type="button" class="dl-pill" data-pipe="desking"><i class="dl-dot dl-dot--desking" aria-hidden="true"></i>Desking (${counts.desking})</button>
      <button type="button" class="dl-pill" data-pipe="fni"><i class="dl-dot dl-dot--fni" aria-hidden="true"></i>F&amp;I / Docs (${counts.fni})</button>
    </div>` : ""}
    <div class="dl-list" id="dealList"></div>
    ${lead && funded.length ? `
    <details class="dl-archive"${dealsUI.arch ? " open" : ""}>
      <summary>Archived — funded contracts (${funded.length})</summary>
      <div class="dl-list">${funded.map(leadCard).join("")}</div>
    </details>` : ""}`;

  /* any re-render (role switch, logo refresh) must not snap the archive shut */
  const det = $(".dl-archive");
  if (det) det.ontoggle = () => { dealsUI.arch = det.open; };

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

  function paint() {
    if (!lead) dealsUI.pipe = "all";
    $$(".dl-pill").forEach(p => {
      const on = p.dataset.pipe === dealsUI.pipe;
      p.classList.toggle("on", on);
      p.setAttribute("aria-pressed", String(on));
    });
    /* Team Lead: the active floor through the lane filter, archive below.
       Advisor: active deals then their funded ones, one list, search over all. */
    const pool = lead
      ? act.filter(d => dealsUI.pipe === "all" || dealPipe(d) === dealsUI.pipe)
      : act.concat(funded);
    const rows = pool.filter(matches);
    /* the Team Lead's empty states are the original queue's; the advisor's
       empty search names the search and offers the way back */
    const searching = !!dealsUI.q.trim();
    const empty = pool.length || (lead && act.length)
      ? `<p class="dl-empty">${lead ? "No deals match that filter." : "No deals match that search."}</p>` +
        (!lead && searching ? `<p class="dl-empty dl-empty--act"><button type="button" class="btn btn--ghost btn--sm" id="dealShowAll">Clear search</button></p>` : "")
      : `<p class="dl-empty">No active deals — start a new customer visit.</p>`;
    $("#dealList").innerHTML = rows.length ? rows.map(lead ? leadCard : advisorCard).join("") : empty;
    const sa = $("#dealShowAll");
    if (sa) sa.onclick = () => { dealsUI.q = ""; $("#dealSearch").value = ""; paint(); };
  }

  $("#dealSearch").oninput = (e) => { dealsUI.q = e.target.value; paint(); };
  $$(".dl-pill").forEach(p => p.onclick = () => { dealsUI.pipe = p.dataset.pipe; paint(); });
  $("#dealScanBtn").onclick = () => openScanFlow({ mode: "customer", onDone: (cust) => startVisit(cust.id) });
  paint();
});

/* ============================================================
   VIEW: Find a Customer
   ============================================================ */
route("customers", () => {
  renderChrome("Find a Customer", `Search first — Ride Price checks the CRM and all prior entries`,
    `<button class="btn btn--grad" id="scanBtn">🪪 Scan license</button>
     <button class="btn btn--primary" id="createBtn">👤＋ Create Customer</button>`);

  const recent = Store.s.customers.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  view().innerHTML = `
    <div class="grid grid--side">
      <div class="panel">
        <div class="panel__head"><h2>Customer Search</h2></div>
        <div class="panel__body">
          <div class="radio-row">
            <label><input type="radio" name="ctype" checked> Individual</label>
            <label><input type="radio" name="ctype"> Company</label>
          </div>
          <label class="f"><span class="lab">Phone</span><input type="tel" id="qPhone" placeholder="(000) 000-0000"></label>
          <label class="f"><span class="lab">Email</span><input type="email" id="qEmail" placeholder="email@email.com"></label>
          <label class="f"><span class="lab">Last Name</span><input type="text" id="qLast" placeholder="Last"></label>
          <label class="f"><span class="lab">First Name</span><input type="text" id="qFirst" placeholder="First"></label>
          <button class="btn btn--primary" id="searchBtn" style="width:100%;justify-content:center">Search</button>
        </div>
      </div>
      <div>
        <div class="panel" id="resultsPanel" hidden>
          <div class="panel__head"><h2>Results</h2></div>
          <div class="panel__body" id="results"></div>
        </div>
        <div class="panel">
          <div class="panel__head"><h2>Recent Customers</h2></div>
          <div class="tbl-scroll"><table class="tbl"><thead><tr><th>Customer</th><th>Contact</th><th>Last Activity</th><th></th></tr></thead>
          <tbody>${recent.map(c => customerRow(c)).join("")}</tbody></table></div>
        </div>
      </div>
    </div>`;

  function customerRow(c) {
    return `<tr><td data-label="Customer"><b>${esc(c.last)}, ${esc(c.first)}</b><div class="small">${esc(c.city)}, ${esc(c.state)} ${esc(c.zip)}</div></td>
      <td class="small" data-label="Contact">${esc(c.phone)}<br>${esc(c.email)}</td>
      <td class="small" data-label="Last Activity">${new Date(c.createdAt).toLocaleDateString()}</td>
      <td class="right acts"><button class="btn btn--sm btn--grad" data-start="${esc(c.id)}">Start Visit →</button></td></tr>`;
  }

  function doSearch() {
    const rp = $("#resultsPanel"); rp.hidden = false;
    const ph = $("#qPhone").value.replace(/\D/g, "");
    const em = $("#qEmail").value.trim().toLowerCase();
    const ln = $("#qLast").value.trim().toLowerCase();
    const fn = $("#qFirst").value.trim().toLowerCase();
    if (!ph && !em && !ln && !fn) {
      $("#results").innerHTML = `<p class="center muted" style="padding:26px 0">Enter at least one field to search.</p>`;
    } else {
      const hits = Store.s.customers.filter(c =>
        (ph && c.phone.replace(/\D/g, "").includes(ph)) ||
        (em && c.email.toLowerCase().includes(em)) ||
        (ln && c.last.toLowerCase().includes(ln)) ||
        (fn && c.first.toLowerCase().includes(fn)));
      $("#results").innerHTML = hits.length
        ? `<div class="tbl-scroll"><table class="tbl"><tbody>${hits.map(c => customerRow(c)).join("")}</tbody></table></div>`
        : `<p class="center muted" style="padding:20px 0">No matches found. <br><button class="btn btn--primary btn--sm mt" id="createBtn2">👤＋ Create Customer</button></p>`;
      bindStart();
      const c2 = $("#createBtn2"); if (c2) c2.onclick = openCreate;
    }
    /* on a phone the Results panel stacks under the whole search form, so a
       tap on Search rendered ≈700px below the fold and looked like nothing
       happened (RP-UI-004) — every outcome, the empty-fields message included,
       now brings the panel into view. "nearest" is a no-op when it is already
       visible (the desktop side column). A result list taller than the screen
       aligns its top edge, so the margin is measured from whatever bars are
       sticky at this width (the app bar; the page bar too above 720px) and
       the Results heading stays out from under them. */
    const stickyH = $$(".appbar, .pagebar").filter(el => getComputedStyle(el).position === "sticky").reduce((s, el) => s + el.offsetHeight, 0);
    rp.style.scrollMarginTop = (stickyH + 8) + "px";
    rp.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  $("#searchBtn").onclick = doSearch;
  /* property assignment, not addEventListener: #view outlives the render, so a
     listener would stack up and fire this view's doSearch on later screens */
  view().onkeydown = (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT" && $("#qPhone")) doSearch(); };

  function bindStart() {
    $$("[data-start]").forEach(b => b.onclick = () => startVisit(b.dataset.start));
  }
  bindStart();

  function openCreate() {
    modal("Create Customer", `
      <div class="fields">
        <label class="f"><span class="lab">First Name <i class="req">*</i></span><input id="nFirst" type="text"></label>
        <label class="f"><span class="lab">Middle Name</span><input id="nMiddle" type="text"></label>
        <label class="f"><span class="lab">Last Name <i class="req">*</i></span><input id="nLast" type="text"></label>
        <label class="f"><span class="lab">Email <i class="req">*</i></span><input id="nEmail" type="email"></label>
        <label class="f"><span class="lab">Phone <i class="req">*</i></span><input id="nPhone" type="tel" placeholder="(718) 555-5555"></label>
        <label class="f"><span class="lab">Est. Credit Score</span><input id="nScore" type="number" min="400" max="850" value="700"></label>
        <label class="f"><span class="lab">Address <i class="req">*</i></span><input id="nAddr" type="text"></label>
        <label class="f"><span class="lab">ZIP Code <i class="req">*</i></span><input id="nZip" type="text"></label>
        <label class="f"><span class="lab">City</span><input id="nCity" type="text" value="Astoria"></label>
        <label class="f"><span class="lab">State</span><input id="nState" type="text" value="NY"></label>
      </div>
      <p class="hint">Required: first &amp; last name, phone and email, address and zip code. <span class="demo-note">Demo tool — use sample data only.</span></p>`,
      `<button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--primary" id="saveCust">Save &amp; Start Visit →</button>`);
    $("#saveCust").onclick = () => {
      const c = {
        id: uid("c"), first: $("#nFirst").value.trim(), middle: $("#nMiddle").value.trim(), last: $("#nLast").value.trim(),
        email: $("#nEmail").value.trim(), phone: $("#nPhone").value.trim(),
        creditScore: parseInt($("#nScore").value, 10) || 700,
        address: $("#nAddr").value.trim(), zip: $("#nZip").value.trim(),
        city: $("#nCity").value.trim(), state: $("#nState").value.trim(), createdAt: new Date().toISOString()
      };
      /* every miss is marked on its own field at once and the first one is
         scrolled to inside the dialog, so the message does not depend on a
         toast landing somewhere the user happens to be looking (RP-UI-003);
         the toast only points at the marks */
      if (markMissing($("#modalBack"), customerMissing(c, "n", $("#modalBack")))) return toast("Fill in the fields marked in red");
      Store.s.customers.push(c); Store.save();
      closeModal(); toast("Customer created");
      startVisit(c.id);
    };
  }
  $("#createBtn").onclick = openCreate;
  /* consumed once — a later visit to this screen must not reopen the dialog */
  if (scanWantsCreate) { scanWantsCreate = false; openCreate(); }
  $("#scanBtn").onclick = () => openScanFlow({
    mode: "customer",
    onManual: openCreate,
    onDone: (cust) => startVisit(cust.id)
  });

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
/* the journey is five steps wide: intro · front · back · read · review */
const SCAN_STEPS = 5;

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
  const st = { frontUrl: null, persona: null, match: null, backFrom: null, render: null, saved: false, manNum: "", manState: "NY" };
  modal("Scan Driver's License", `<div id="scanBody"></div>`);
  const body = $("#scanBody");
  /* the scan is a focused journey (owner's v2 prototype, 2026-08-23): it owns
     the phone screen with its own top row, hero headers, camera visuals and a
     pinned gradient step action. Production-shaped UI — recognition itself
     still only ever reads the five printed props (invariant 4). */
  const backEl = $("#modalBack");
  backEl.classList.add("modal-back--journey");
  $(".modal", backEl).classList.add("modal--journey");

  /* one teardown for every exit path — dismissal, navigation, or save */
  function cleanup() {
    st.cancelled = true;
    if (st.frontUrl) { try { URL.revokeObjectURL(st.frontUrl); } catch (e) { /* noop */ } st.frontUrl = null; }
    window.removeEventListener("hashchange", abandon);
    backEl.removeEventListener("click", onDismiss);
    document.removeEventListener("click", leaveGuard, true);
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
    if (!st.frontUrl) return; /* nothing to lose yet */
    e.preventDefault(); e.stopImmediatePropagation();
    renderLeaveConfirm();
  }
  document.addEventListener("click", leaveGuard, true);
  backEl.addEventListener("click", onDismiss);
  window.addEventListener("hashchange", abandon);
  const done = () => { cleanup(); closeModal(); };
  const live = () => !st.cancelled && document.contains(body);

  /* the journey chrome (owner v2): back circle · brand · help circle, then
     the thin gradient progress bar. Help opens the training-license peek. */
  /* minimalist chrome (owner mockup r2, 2026-08-25): one row — a bare ← / ×,
     the five progress pills inline, and the demo chip. No wordmark, no help
     circle. The chip stays despite the mockup omitting all badges: the demo
     marker is a standing rule, and this is its one home in the journey. */
  function top(pct) {
    /* ← inside the journey, × at its ends (intro / complete) */
    const atEnd = st.stage === "intro" || st.saved;
    const lit = Math.max(1, Math.min(SCAN_STEPS, Math.round(pct / (100 / SCAN_STEPS))));
    const segs = Array.from({ length: SCAN_STEPS }, (_, i) =>
      `<i class="${i < lit - 1 ? "done" : i === lit - 1 ? "now" : ""}"></i>`).join("");
    return `<div class="scan-top">
      ${st.saved ? `<button type="button" class="scan-top__btn" data-close aria-label="Close">×</button>` : `<button type="button" class="scan-top__btn" data-nav-back aria-label="${atEnd ? "Close" : "Back"}">${atEnd ? "×" : "←"}</button>`}
      <div class="scan-steps" role="progressbar" aria-valuemin="1" aria-valuemax="${SCAN_STEPS}" aria-valuenow="${lit}" aria-label="Step ${lit} of ${SCAN_STEPS}">${segs}</div>
      <span class="chip--demo">TRAINING · PROPS ONLY</span>
    </div>`;
  }
  const foot = (html) => setModalFoot(html ? `<div class="scan-foot">${html}</div>` : "");

  function wire(renderFn, navBack) {
    st.render = renderFn;
    $$("[data-cap]", body).forEach(inp => inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (f && st.onCapture) st.onCapture(f);
    });
    const nb = $("[data-nav-back]", body);
    if (nb) nb.onclick = () => {
      if (navBack) return navBack();
      /* at the journey's first screen ← leaves; a part-done scan asks once */
      if (st.frontUrl) renderLeaveConfirm(); else done();
    };
  }

  /* The in-journey "?" help peek is gone with the r2 chrome (the mockup's
     header carries no help control). The props knowledge it held lives where
     it always did: the Training Licenses page in the menu, and the
     not-recognized screen when a scan actually fails. */

  /* leaving a part-done scan asks once; Keep scanning restores the exact step */
  function renderLeaveConfirm() {
    const resume = st.render;
    foot(`<button type="button" class="btn btn--primary scan-cta" data-keep>Keep scanning</button>
      <button type="button" class="btn scan-cta scan-cta--text" data-leave>Leave — discard the scan</button>`);
    body.innerHTML = `${top(st.pct || 20)}
      <div class="scan-hero">
        <h1>Leave the scan?</h1>
        <p>The captured photos and parsed details will be discarded.</p>
      </div>`;
    $("[data-keep]").onclick = () => resume ? resume() : renderIntro();
    $("[data-leave]").onclick = () => done();
    const nb = $("[data-nav-back]", body); if (nb) nb.onclick = () => resume ? resume() : renderIntro();
  }

  /* step 0 — the intro (owner v2): purpose, the card visual, the get-ready
     tip and the advisor's ask. In production this page is where a real
     consent disclosure would live; the demo never fakes one. */
  /* the intro (owner mockup r2): title + one line, the flat card graphic,
     then exactly two benefit cards. The word-track card is gone on the
     owner's r2 table; the second card keeps the mockup's "Works in any
     light" headline over a subline that is true of this app (the phone's
     own camera does the exposure — there is no auto-detect to enable). */
  function renderIntro() {
    st.stage = "intro"; st.pct = 20;
    foot(`<button type="button" class="btn btn--primary scan-cta" data-begin>Begin Scanning</button>`);
    body.innerHTML = `${top(20)}
      <div class="scan-hero">
        <h1>Scan a driver&rsquo;s<br>license</h1>
        <p>We&rsquo;ll capture the front and back to find or create a customer.</p>
      </div>
      <div class="scan-visual">
        <div class="scan-idcard" aria-hidden="true">
          <div class="scan-idcard__state">NEW YORK</div><div class="scan-idcard__demo">TRAINING SAMPLE</div>
          <div class="scan-idcard__body"><span class="scan-idcard__photo"></span>
            <span class="scan-idcard__lines"><i></i><i></i><i></i><i></i></span></div>
        </div>
      </div>
      <div class="scan-tip"><span class="scan-tip__icon" aria-hidden="true">${rpIcon("lock")}</span>
        <span><strong>Fast &amp; secure</strong>We only use this to find your customer — the photos are read on this phone and discarded.</span></div>
      <div class="scan-tip"><span class="scan-tip__icon scan-tip__icon--sun" aria-hidden="true">${rpIcon("sun")}</span>
        <span><strong>Works in any light</strong>The phone&rsquo;s own camera handles focus and exposure — no special setup.</span></div>
      <p class="scan-demo-hint">Only the 5 printed training licenses can be recognized — there is no reader for a real ID.</p>`;
    $("[data-begin]").onclick = () => renderFront();
    wire(renderIntro);
  }

  /* the capture screens (owner v2): a hero instruction over a dark camera
     visual with the framing guide — an illustration, not a viewfinder
     (invariant 5: the camera itself opens natively on tap) */
  function capture(side) {
    const front = side === "front";
    /* the full-bleed viewfinder (owner mockup r2): no outer card — the dark
       panel owns the middle of the screen, with corner brackets, the flash
       bolt and the shutter drawn as part of the illustration. None of the
       three is its own control: the whole panel is the control, and a tap
       anywhere opens the phone's own camera (invariant 5 — there is no live
       viewfinder for a flash to belong to). */
    return `<label class="scan-cam scan-cam--v3 scan-cap">
        <span class="scan-cam__frame">
          <span class="scan-cam__brackets" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          ${front
            ? `<span class="scan-idcard scan-idcard--infield" aria-hidden="true">
                <span class="scan-idcard__state">NEW YORK</span><span class="scan-idcard__demo">TRAINING SAMPLE</span>
                <span class="scan-idcard__body"><span class="scan-idcard__photo"></span>
                <span class="scan-idcard__lines"><i></i><i></i><i></i><i></i></span></span></span>`
            : `<span class="scan-backcard" aria-hidden="true"><span class="scan-backcard__lab">BACK OF LICENSE</span>
                <span class="scan-backcard__bars"></span><span class="scan-backcard__line"></span></span>`}
          <span class="scan-scanline" aria-hidden="true"></span>
        </span>
        <span class="scan-flash" aria-hidden="true">⚡</span>
        <span class="scan-shutter" aria-hidden="true"></span>
        <span class="scan-camtip">${front ? "Avoid glare and keep all four corners visible." : "Keep the whole barcode visible and steady."}</span>
        <input type="file" accept="image/*" capture="environment" data-cap>
      </label>
    <p class="scan-upload"><label class="scan-cap"><u>or upload a photo</u><input type="file" accept="image/*" data-cap></label></p>`;
  }

  function renderFront() {
    st.stage = "front"; st.pct = 40;
    foot(`<button type="button" class="btn btn--primary scan-cta" data-shoot>Capture Front</button>`);
    body.innerHTML = `${top(40)}
      <div class="scan-hero scan-hero--left scan-hero--tight">
        <h1>Scan the front<br>of the license</h1>
        <p>Center the license in the frame.</p>
      </div>
      ${capture("front")}`;
    st.onCapture = (file) => {
      if (st.frontUrl) { try { URL.revokeObjectURL(st.frontUrl); } catch (e) { /* noop */ } }
      st.frontUrl = URL.createObjectURL(file);
      /* a retaken front makes any in-flight recognition of the old photo stale */
      const gen = st.frontGen = (st.frontGen || 0) + 1;
      renderBack();
      /* opportunistic: if this photo already shows the barcode side, skip the
         wait — recognition still only ever reads the known prop barcodes */
      RIDE_PRICE_SCAN.recognizeFile(file).then((res) => {
        if (res && res.ok && res.persona && !st.cancelled && st.frontGen === gen && st.stage === "back" && document.contains(body)) {
          toast("Barcode detected on that photo — skipping ahead");
          renderProcessing(file);
        }
      }).catch(() => { /* front photo without a barcode is the normal case */ });
    };
    $("[data-shoot]").onclick = () => { const i = $("input[data-cap]", body); if (i) i.click(); };
    wire(renderFront, () => renderIntro());
  }

  function renderBack() {
    st.stage = "back"; st.pct = 60;
    foot(`<button type="button" class="btn btn--primary scan-cta" data-shoot>Capture Back</button>`);
    body.innerHTML = `${top(60)}
      <div class="scan-hero scan-hero--left scan-hero--tight">
        <h1>Scan the back<br>of the license</h1>
        <p>Center the barcode side in the frame.</p>
      </div>
      ${capture("back")}
      <div class="scan-captured">Front captured
        ${st.frontUrl ? `<img class="scan-thumb" src="${st.frontUrl}" alt="front of license">` : "✓"}
        <button type="button" class="btn btn--ghost btn--sm" data-retake>Retake front</button></div>`;
    st.onCapture = (file) => renderProcessing(file);
    $("[data-shoot]").onclick = () => { const i = $("input[data-cap]", body); if (i) i.click(); };
    $("[data-retake]", body).onclick = () => renderFront();
    wire(renderBack, () => renderFront());
  }

  /* processing (owner v2): the spinner, and a checklist that only claims what
     is true — both captures exist, and the match cascade IS the CRM check */
  function renderProcessing(file) {
    st.stage = "processing"; st.pct = 80;
    foot("");
    /* three rows, each naming real work: the barcode read, the match cascade,
       then assembling the review. A row only ticks when its step has actually
       finished — the list is a status display, not an animation. */
    const procRow = (key, label) => `<div class="scan-procrow" data-proc="${key}"><span>${label}</span><i>✓</i></div>`;
    body.innerHTML = `${top(80)}
      <div class="scan-hero scan-hero--tight">
        <h1>Processing<br>your scan</h1>
        <p>Extracting information and searching for matches&hellip;</p>
      </div>
      <div class="scan-ring" aria-hidden="true"></div>
      <div class="scan-proc" role="status" aria-live="polite">
        ${procRow("read", "Reading license")}
        ${procRow("match", "Finding customer")}
        ${procRow("prep", "Verifying details")}
      </div>`;
    /* A recognition already in flight must not paint over a screen the user
       has since moved to — `live()` alone cannot tell, because the journey
       body is still in the document after a back or a leave-and-resume
       (review lesson 5). Every entry takes a generation; navigating away
       bumps it and strands the older callback. */
    const gen = st.procGen = (st.procGen || 0) + 1;
    const mine = () => live() && st.procGen === gen;
    /* mark step `key` done and light the next one; a stale run is a no-op */
    const step = (key, next) => {
      if (!mine()) return;
      const el = $(`[data-proc="${key}"]`, body);
      if (el) { el.classList.remove("is-now"); el.classList.add("is-done"); }
      const nx = next && $(`[data-proc="${next}"]`, body);
      if (nx) nx.classList.add("is-now");
    };
    const first = $(`[data-proc="read"]`, body); if (first) first.classList.add("is-now");
    const t0 = Date.now();
    RIDE_PRICE_SCAN.recognizeFile(file).then((res) => {
      /* a floor on each stage so the list is readable even on an instant read */
      setTimeout(() => {
        step("read", "match");
        setTimeout(() => {
          step("match", "prep");
          setTimeout(() => {
            if (!mine()) return; /* dismissed, or navigated away mid-scan */
            step("prep", null);
            if (res && res.ok && res.persona) { st.persona = res.persona; afterRecognize(); }
            else renderReject();
          }, 420);
        }, 420);
      }, Math.max(0, 700 - (Date.now() - t0)));
    }).catch(() => { if (mine()) renderReject(); });
    /* the back arrow is a real control here: it strands this read and returns
       to the capture step. Resuming a part-done scan re-enters processing
       (and re-reads the same photo) rather than dropping to the intro. */
    wire(() => renderProcessing(file), () => { st.procGen++; renderBack(); });
  }

  function renderReject() {
    st.stage = "back"; st.pct = 60;
    foot(`<button type="button" class="btn btn--primary scan-cta" data-retry>Retake photo</button>
      ${o.mode === "customer" ? `<button type="button" class="btn scan-cta scan-cta--text" data-manual>Enter license manually</button>` : ""}`);
    /* one idea per line: the demo limit, then the capture fix. No cause is
       diagnosed — the recognizer finds a prop marker or refuses (invariant 4). */
    body.innerHTML = `${top(60)}
      <div class="scan-hero">
        <h1>That didn&rsquo;t read</h1>
        <p>We couldn't find the barcode. Keep the whole barcode visible and avoid glare.</p>
        <p class="scan-demo-hint" style="margin:14px 0 0;text-align:left">In this demo only the 5 printed training licenses can be read.</p>
      </div>`;
    $("[data-retry]").onclick = () => renderBack();
    /* the manual licence SEARCH is a customer-mode path only: a co-buyer or
       test-drive scan is verifying a card in someone's hand, and there is no
       Create Customer form behind those to fall back to */
    const man = $("[data-manual]"); if (man) man.onclick = () => renderManual();
    wire(renderReject, () => renderBack());
  }

  /* manual entry (owner mockup s7): typing the license number searches the
     CRM directly. It is a SEARCH, never a read — nothing typed here is
     treated as license data recovered from the card, and no persona is
     invented, so the only outcomes are an existing customer or the full
     Create Customer form. */
  function renderManual() {
    st.stage = "manual"; st.pct = 40;
    foot(`<button type="button" class="btn btn--primary scan-cta" data-search>Search</button>
      <button type="button" class="btn scan-cta scan-cta--text" data-cancel>Cancel</button>`);
    const states = ["NY", "NJ", "CT", "PA", "CA", "FL", "TX"];
    body.innerHTML = `${top(40)}
      <div class="scan-hero scan-hero--left scan-hero--tight">
        <h1>Enter license manually</h1>
        <p>Type the license number to search for a customer. This searches your records — it does not read the card.</p>
      </div>
      <div class="scan-form">
        <label for="svManNum">License number</label>
        <span class="scan-form__wrap">
          <input id="svManNum" type="text" autocomplete="off" spellcheck="false" placeholder="T-0000101" value="${esc(st.manNum || "")}" style="padding-right:48px">
          <button type="button" class="scan-form__clear" data-clear aria-label="Clear the license number">×</button>
        </span>
        <label for="svManState">Issuing state</label>
        <select id="svManState">${states.map(s => `<option value="${s}"${(st.manState || "NY") === s ? " selected" : ""}>${s}</option>`).join("")}</select>
        <div class="scan-subtle">The 5 training licenses are numbered T-0000101 to T-0000105 (NY).</div>
      </div>`;
    const numEl = $("#svManNum", body);
    $("[data-clear]", body).onclick = () => { numEl.value = ""; numEl.focus(); };
    $("[data-cancel]").onclick = () => renderBack();
    $("[data-search]").onclick = () => {
      const num = numEl.value.trim();
      st.manNum = num; st.manState = $("#svManState", body).value;
      if (!num) { markMissing(body, [{ el: numEl, msg: "Required" }]); return toast("Enter a license number to search"); }
      renderManualResults(num, st.manState);
    };
    wire(renderManual, () => renderBack());
  }

  /* manual results (owner mockup s8): the one card, or an honest empty state */
  function renderManualResults(num, state) {
    st.stage = "manual"; st.pct = 60;
    const norm = (s) => String(s || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
    const hit = Store.s.customers.find(x => x.license && norm(x.license.number) === norm(num)
      && (!x.license.state || !state || norm(x.license.state) === norm(state))) || null;
    foot(hit
      ? `<button type="button" class="btn btn--primary scan-cta" data-use>Review Customer</button>
         <button type="button" class="btn scan-cta scan-cta--text" data-new>No match, create new</button>`
      : `<button type="button" class="btn btn--primary scan-cta" data-new>Create a new customer</button>
         <button type="button" class="btn scan-cta scan-cta--text" data-again>Search again</button>`);
    body.innerHTML = `${top(60)}
      <div class="scan-hero scan-hero--tight">
        <h1>${hit ? "Search results" : "No customer on<br>that number"}</h1>
        <p>${hit
          ? `We found a matching customer on license <b>${esc(num)}</b>${state ? " · " + esc(state) : ""}.`
          : `Nothing in your records carries license <b>${esc(num)}</b>${state ? " · " + esc(state) : ""}. Check the number, or create the customer from scratch.`}</p>
      </div>
      ${hit ? personDoc(hit, "License match", [
        ["Date of birth", hit.dob ? dateUS(hit.dob) : null],
        ["Phone", hit.phone],
        ["Address", hit.address ? hit.address + ", " + hit.city + ", " + hit.state + " " + hit.zip : null],
        ["License", hit.license && hit.license.number ? hit.license.number + (hit.license.state ? " · " + hit.license.state : "") : null]
      ]) : ""}`;
    if (hit) $("[data-use]").onclick = () => { done(); if (o.onDone) o.onDone(hit, null, { type: "license number", customer: hit }); };
    const again = $("[data-again]"); if (again) again.onclick = () => renderManual();
    /* nothing was read, so there is no persona to pre-fill from: manual
       "create" hands off to the full Create Customer form. Not every
       customer-mode caller supplies one (the deals-queue camera does not), so
       the fallback lands on Find a Customer with that dialog already open —
       never a button that just closes the journey and does nothing. */
    $("[data-new]").onclick = () => {
      done();
      if (o.onManual) return o.onManual();
      scanWantsCreate = true;
      if (location.hash === "#/customers") router(); else navigate("#/customers");
    };
    wire(() => renderManualResults(num, state), () => renderManual());
  }

  /* recognition succeeded — route to the right screen. Certain matches go straight
     to verify; ambiguous ones ask first; a co-buyer scan that resolves to someone
     already on the deal is blocked outright. */
  function afterRecognize() {
    const p = st.persona;
    if (o.mode === "testdrive") return renderVerifyTd(p);
    const m = findLicenseMatch(p);
    if (o.mode === "cobuyer" && m.customer) {
      if (m.customer.id === o.deal.customerId) return renderBlock();
      if (m.customer.id === o.deal.coBuyerId) return renderBlock("already");
    }
    /* every match now stops at the Match Found screen first (owner mockup s5);
       only a scan with nothing on file goes straight to Create New */
    if (m.customer) return renderMatchFound(m);
    st.match = m;
    st.backFrom = null; /* nothing on file: the capture step is what came before */
    renderVerifyNew();
  }

  /* hard block, no override: the scan resolved to a person already on this deal */
  function renderBlock(kind) {
    st.stage = "verify"; st.pct = 100;
    foot(`<button type="button" class="btn btn--primary scan-cta" data-rescan>Scan a different license</button>
      <button type="button" class="btn scan-cta scan-cta--text" data-close>Cancel</button>`);
    body.innerHTML = `${top(100)}
      <div class="scan-hero">
        <h1>${kind === "already" ? "Already the co-buyer" : "That&rsquo;s the primary buyer"}</h1>
        <p>${kind === "already"
          ? "This license resolves to the person already attached as the co-buyer."
          : "A person can&rsquo;t co-sign their own loan — the co-buyer must be a different guest."}</p>
      </div>`;
    $("[data-rescan]").onclick = () => renderFront();
    wire(() => renderBlock(kind), () => renderBack());
  }

  /* the identity facts a card can honestly show; absent values render as — */
  /* a review screen's ← returns to whichever screen chose it — the match, the
     duplicate list — and to the capture step when the scan went straight there */
  const reviewBack = () => st.backFrom || (() => renderBack());
  const initials = (first, last) => esc(((first || " ")[0] + (last || " ")[0]).toUpperCase().trim() || "?");

  /* one data row on a document surface: small label over a readable value.
     `meta` is a quiet line under the value ("was …"); `act` a text action.
     An absent value renders — */
  const docRow = (label, val, opts) => {
    const o2 = opts || {};
    return `<div class="scan-row"${o2.attr ? " " + o2.attr : ""}>
      <div><span class="scan-row__lab">${esc(label)}</span>
        <span class="scan-row__val">${val ? esc(val) : "—"}</span>
        ${o2.meta ? `<span class="scan-row__meta${o2.metaChg ? " scan-row__meta--chg" : ""}">${esc(o2.meta)}</span>` : ""}</div>
      ${o2.act ? `<button type="button" class="scan-act" ${o2.act.attr}>${esc(o2.act.label)}</button>` : ""}
    </div>`;
  };

  /* the customer document the match, review and search screens all share:
     one soft surface — name, a quiet status pill stating the REAL match
     basis (never an invented confidence), then plain rows. */
  const personDoc = (c, pill, rows, sub) => `<div class="scan-doc scan-doc--head">
    <div class="scan-dochead">
      <div><b>${esc([c.first, c.middle, c.last].filter(Boolean).join(" "))}</b>${sub ? `<small>${esc(sub)}</small>` : ""}</div>
      ${pill ? `<span class="scan-pill">${esc(pill)}</span>` : ""}
    </div>
    ${rows.map(r => docRow(r[0], r[1], r[2])).join("")}
  </div>`;

  /* the bottom sheet: one focused secondary decision at a time — never a
     modal inside a modal. Outside tap dismisses; content wires itself. */
  function openSheet(title, contentHTML, onMount) {
    const old = $(".scan-sheet-back", backEl); if (old) old.remove();
    const sb = document.createElement("div");
    sb.className = "scan-sheet-back";
    sb.innerHTML = `<div class="scan-sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <span class="scan-sheet__handle" aria-hidden="true"></span>
      <h2>${esc(title)}</h2>
      <div class="scan-sheet__body">${contentHTML}</div>
    </div>`;
    $(".modal", backEl).appendChild(sb);
    /* the journey renders as a dialog on desktop too, so the sheet has to be
       dismissible from the keyboard — and the listener has to come off with
       it, or a later Escape would reach a sheet that no longer exists */
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
    const close = () => { document.removeEventListener("keydown", onKey, true); sb.remove(); };
    document.addEventListener("keydown", onKey, true);
    sb.addEventListener("click", (e) => { if (e.target === sb) close(); });
    if (onMount) onMount(sb, close);
    return close;
  }

  /* ambiguous match (owner v2): the on-file record and the scanned license as
     two cards the trainee can actually compare. The badge states the REAL
     match basis — never an invented confidence percentage. */
  /* match found (owner mockup s5) — now shown for EVERY match, not only the
     ambiguous ones: the advisor sees who the scan resolved to before anything
     is attached. The badge states the real basis; when the match is only a
     guess (`ask`) the scanned license is shown underneath so the two records
     can actually be compared, which is the whole point of that screen. */
  function renderMatchFound(m) {
    st.stage = "verify"; st.pct = 100;
    const p = st.persona, ex = m.customer;
    st.backFrom = () => renderMatchFound(m);
    /* one label per type findLicenseMatch() can return — a name+DOB hit is a
       stronger match than a name alone and must not be understated as one
       (CodeRabbit, PR #49). The pill states the real basis, never a score. */
    const BASIS = {
      "license number": "License match",
      "date of birth and name": "Name and birthday match",
      "date of birth": "Same birthday",
      "name": "Name match"
    };
    const basis = BASIS[m.type] || "Match found";
    foot(`<button type="button" class="btn btn--primary scan-cta" data-link>${m.ask === "dob" ? "Same person — review their record" : "Review Customer"}</button>
      <button type="button" class="btn scan-cta scan-cta--text" data-new>${m.ask === "dob" ? "Different guest — create new" : "No, create a new customer"}</button>`);
    /* only what answers "is this the same customer?" — identity facts, no
       CRM metadata (visit counts and ids do not identify a person) */
    body.innerHTML = `${top(100)}
      <div class="scan-hero scan-hero--tight">
        <h1>We found a<br>matching customer</h1>
        <p>${m.ask === "dob"
          ? "Same birthday as a customer on file. Same person, or a different guest?"
          : m.ask
            ? "The name matches a customer on file. Compare the two before continuing."
            : "Review the details below."}</p>
      </div>
      ${personDoc(ex, basis, [
        ["Date of birth", ex.dob ? dateUS(ex.dob) : null],
        ["Phone", ex.phone],
        ["Address", ex.address ? ex.address + ", " + ex.city + ", " + ex.state + " " + ex.zip : null],
        ["License", ex.license && ex.license.number ? ex.license.number + (ex.license.state ? " · " + ex.license.state : "") : null]
      ])}
      ${m.ask ? `<h2 class="scan-h2">The license just scanned</h2>
      ${personDoc(p, null, [
        ["Date of birth", p.dob ? dateUS(p.dob) : null],
        ["Address", p.address + ", " + p.city + ", " + p.state + " " + p.zip],
        ["License", p.license.number + " · " + p.license.state]
      ], "Not yet in your records")}` : ""}`;
    $("[data-link]").onclick = () => { st.match = { type: m.type, customer: m.customer }; renderVerifyExisting(); };
    $("[data-new]").onclick = () => { st.match = { type: null, customer: null }; renderVerifyNew(); };
    wire(() => renderMatchFound(m), () => renderBack());
  }

  /* the working values (ISO dates); the review screens edit into this */
  function seedSv(ex) {
    const p = st.persona;
    return st.sv = st.sv || {
      first: p.first, middle: p.middle || "", last: p.last,
      dob: p.dob || "", address: p.address, city: p.city, state: p.state, zip: p.zip,
      email: ex ? ex.email : "", phone: ex ? ex.phone : "",
      license: { number: p.license.number, state: p.license.state, expires: p.license.expires || "" }
    };
  }
  const normPhone = (s) => String(s || "").replace(/\D/g, "");

  /* single save tail for every path (direct, phone-link, phone-keep): write
     the store, then the completion screen — the visit starts from there */
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
    renderComplete(cust, wasExisting);
  }

  function saveFrom(vals, ex) {
    const phoneDigits = normPhone(vals.phone);
    const mkNew = () => {
      /* the scan never asks for a credit score (owner, 2026-08-25 — it is not
         on the license and not the advisor's guess to make at the door): the
         record starts at the neutral default and is set later on the desk,
         where the tier is actually worked. */
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
         second record for the same person is written (owner mockup s6C) */
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

  /* possible duplicate (owner mockup s6C): the candidates as pickable rows.
     Picking one opens the normal existing-customer review, so the trainee
     still sees exactly what the scan would change before anything is saved. */
  function renderDuplicates(cands, vals, mkNew) {
    st.stage = "verify"; st.pct = 100;
    foot(`<button type="button" class="btn btn--ghost scan-cta scan-cta--ghost" data-none>None of these — create new</button>
      <p class="scan-foot-hint">Creating new adds a second record with this name to the CRM.</p>`);
    body.innerHTML = `${top(100)}
      <div class="scan-hero scan-hero--tight">
        <h1>Possible duplicate</h1>
        <p>We found similar customers. Select the correct one, or create new.</p>
      </div>
      <div class="scan-piks">
        ${cands.map((c, i) => `<button type="button" class="scan-pik" data-pik="${i}">
          <span class="scan-avatar">${initials(c.first, c.last)}</span>
          <span style="min-width:0"><b>${esc([c.first, c.middle, c.last].filter(Boolean).join(" "))}</b><small>${esc(c.phone || c.email || "No contact on file")}</small></span>
          <span class="scan-pik__go" aria-hidden="true">›</span>
        </button>`).join("")}
      </div>`;
    $$("[data-pik]", body).forEach(b => b.onclick = () => {
      st.match = { type: "your selection", customer: cands[+b.dataset.pik] };
      /* only the review opened from here goes back to the list — the Create
         New screen this list came from must keep its own earlier target */
      st.backFrom = () => renderDuplicates(cands, vals, mkNew);
      renderVerifyExisting();
    });
    $("[data-none]").onclick = () => finishSave(mkNew(), false);
    wire(() => renderDuplicates(cands, vals, mkNew), () => renderVerifyNew());
  }

  const svVals = () => ({
    first: st.sv.first, middle: st.sv.middle, last: st.sv.last,
    dob: st.sv.dob, address: st.sv.address, city: st.sv.city,
    state: st.sv.state, zip: st.sv.zip,
    email: st.sv.email, phone: st.sv.phone,
    license: { number: st.sv.license.number, state: st.sv.license.state, expires: st.sv.license.expires }
  });

  /* existing customer (owner v2 s6): what CHANGED from the license as open
     inputs with the previous value under each; everything already matching
     in a confirmed card. Saving updates the record and moves to completion. */
  function renderVerifyExisting() {
    st.stage = "verify"; st.pct = 100;
    const p = st.persona, m = st.match, ex = m.customer;
    const sv = seedSv(ex);
    const chg = [];
    const push = (key, label, oldV, newV, input) => { if (newV && (!oldV || String(oldV) !== String(newV))) chg.push({ key, label, oldV: oldV || null, input }); };
    push("name", "Name", (ex.first + " " + ex.last), (sv.first + " " + sv.last), "name");
    push("dob", "Date of birth", ex.dob, sv.dob, "date");
    push("license", "License #", ex.license && ex.license.number, sv.license.number, "text");
    push("expires", "License expires", ex.license && ex.license.expires, sv.license.expires, "date");
    push("address", "Address", ex.address, sv.address, "text");
    const needContact = !ex.phone || !ex.email; /* both channels required (owner rule) */
    const chgOf = (k) => chg.find(c => c.key === k);
    foot(`${chg.length ? `<p class="scan-foot-hint" style="margin:0 0 8px">${chg.length} field${chg.length === 1 ? "" : "s"} will be updated from the license</p>` : ""}
      <button type="button" class="btn btn--primary scan-cta" data-save>Use This Customer</button>
      <button type="button" class="btn scan-cta scan-cta--text" data-again>Search Again</button>`);
    /* one document (spec s20): every final value as a read-first row. A row
       the license changed shows the new value with a quiet "was …" line and
       an Edit text action that opens a focused sheet — read mode first,
       inputs only when the user chooses to edit. */
    const wasOf = (c) => c.oldV ? "Updated from license · was " + (c.input === "date" ? dateUS(c.oldV) : c.oldV) : "New from license · not on file before";
    const editable = (key, label, val) => {
      const c = chgOf(key);
      return docRow(label, val, c
        ? { meta: wasOf(c), metaChg: true, act: { label: "Edit", attr: `data-editex="${esc(key)}"` } }
        : {});
    };
    body.innerHTML = `${top(100)}
      <div class="scan-hero scan-hero--tight">
        <h1>Review customer</h1>
        <p>Confirm the details match the license we scanned.${chg.length ? "" : " Everything on file already matches."}${o.mode === "cobuyer" ? " They&rsquo;ll be attached as the co-buyer." : ""}</p>
      </div>
      <div class="scan-doc scan-doc--head">
        <div class="scan-dochead">
          <div><b>${esc([sv.first, sv.middle, sv.last].filter(Boolean).join(" "))}</b><small>Existing customer · matched by ${esc(m.type)}</small></div>
          ${chgOf("name") ? `<button type="button" class="scan-act" data-editex="name">Edit</button>` : ""}
        </div>
        ${chgOf("name") ? `<div class="scan-row"><div><span class="scan-row__meta scan-row__meta--chg">${esc(wasOf(chgOf("name")))}</span></div></div>` : ""}
        ${editable("dob", "Date of birth", sv.dob ? dateUS(sv.dob) : null)}
        ${ex.phone ? docRow("Phone", ex.phone) : ""}
        ${ex.email ? docRow("Email", ex.email) : ""}
        ${editable("address", "Address", sv.address + ", " + sv.city + ", " + sv.state + " " + sv.zip)}
        ${editable("license", "License", sv.license.number + (sv.license.state ? " · " + sv.license.state : ""))}
        ${editable("expires", "License expires", sv.license.expires ? dateUS(sv.license.expires) : null)}
      </div>
      ${needContact ? `<h2 class="scan-h2">Contact</h2>
      <div class="scan-form">
        <label for="svPhone">Mobile phone</label>
        <input id="svPhone" type="tel" placeholder="(718) 555-5555" value="${esc(sv.phone)}">
        <label for="svEmail">Email</label>
        <input id="svEmail" type="email" placeholder="name@testing.com" value="${esc(sv.email)}">
        <div class="scan-subtle">Both phone and email are required on every customer record.</div>
      </div>` : ""}
      <p class="scan-demo-hint">Demo tool — sample data only.</p>`;
    $("[data-again]").onclick = () => renderManual();
    /* Edit opens a sheet for that one field; Save writes into the working
       values and re-renders the document. Typed contact values are stashed
       first so an edit round-trip cannot lose them. */
    const stashContact = () => { if (needContact) { sv.phone = $("#svPhone", body).value.trim(); sv.email = $("#svEmail", body).value.trim(); } };
    $$("[data-editex]", body).forEach(btn => btn.onclick = () => {
      stashContact();
      const key = btn.dataset.editex;
      const c = chgOf(key);
      const dateInput = (f, val) => `<input data-f="${f}" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(val ? dateUS(val) : "")}">`;
      const content = key === "name"
        ? `<div class="scan-form"><label>First name</label><input data-f="first" type="text" value="${esc(sv.first)}">
           <label>Last name</label><input data-f="last" type="text" value="${esc(sv.last)}"></div>`
        : key === "dob"
          ? `<div class="scan-form"><label>Date of birth</label>${dateInput("dob", sv.dob)}</div>`
          : key === "expires"
            ? `<div class="scan-form"><label>License expires</label>${dateInput("expires", sv.license.expires)}</div>`
            : key === "license"
              ? `<div class="scan-form"><label>License number</label><input data-f="lnum" type="text" value="${esc(sv.license.number)}"></div>`
              : `<div class="scan-form"><label>Street address</label><input data-f="address" type="text" value="${esc(sv.address)}"></div>`;
      openSheet("Edit " + (c ? c.label.toLowerCase() : key), `${content}
        ${c && c.oldV ? `<p class="scan-subtle">On file before this scan: ${esc(c.input === "date" ? dateUS(c.oldV) : c.oldV)}</p>` : ""}
        <div class="scan-sheet__acts">
          <button type="button" class="btn btn--primary scan-cta" data-apply>Save</button>
          <button type="button" class="btn scan-cta scan-cta--text" data-cancel-sheet>Cancel</button>
        </div>`, (sheet, close) => {
        $("[data-cancel-sheet]", sheet).onclick = close;
        $("[data-apply]", sheet).onclick = () => {
          const get = (f) => { const i = $(`[data-f="${f}"]`, sheet); return i ? i.value.trim() : null; };
          const bad = [];
          /* every field in the sheet is required to save (owner, 2026-08-25):
             an emptied field marks — it never silently keeps the old value */
          const need = (f) => { if (get(f) === "") bad.push({ el: $(`[data-f="${f}"]`, sheet), msg: "Required" }); };
          /* and a typed-but-invalid date never erases a stored one */
          const dateOf = (f, cur) => { const t = get(f); if (t && !dateISO(t)) { bad.push({ el: $(`[data-f="${f}"]`, sheet), msg: "Enter MM/DD/YYYY" }); return cur; } return t ? dateISO(t) : ""; };
          if (key === "name") { need("first"); need("last"); }
          else if (key === "dob") need("dob");
          else if (key === "expires") need("expires");
          else if (key === "license") need("lnum");
          else if (key === "address") need("address");
          const dobV = key === "dob" ? dateOf("dob", sv.dob) : null;
          const expV = key === "expires" ? dateOf("expires", sv.license.expires) : null;
          if (markMissing(sheet, bad)) return;
          if (key === "name") { sv.first = get("first"); sv.last = get("last"); }
          else if (key === "dob") sv.dob = dobV;
          else if (key === "expires") sv.license.expires = expV;
          else if (key === "license") sv.license.number = get("lnum");
          else if (key === "address") sv.address = get("address");
          close(); renderVerifyExisting();
        };
        const first = $("input", sheet); if (first) first.focus();
      });
    });
    $("[data-save]").onclick = () => {
      stashContact();
      const bad = [];
      if (needContact) {
        if (!sv.phone) bad.push({ el: $("#svPhone", body), msg: "Required" });
        if (!sv.email) bad.push({ el: $("#svEmail", body), msg: "Required" });
      }
      if (markMissing(body, bad)) return toast("Fill in the fields marked in red");
      saveFrom(svVals(), ex);
    };
    wire(renderVerifyExisting, reviewBack());
  }

  /* new customer (owner v2 s7): the license details as read-first rows with
     per-row Edit; the only typing asked for is what the license cannot say */
  function renderVerifyNew() {
    st.stage = "verify"; st.pct = 100;
    const p = st.persona;
    const sv = seedSv(null);
    foot(`<button type="button" class="btn btn--primary scan-cta" data-save>${o.mode === "cobuyer" ? "Add as Co-Buyer" : "Create Customer"}</button>`);
    /* read-first (spec s21): what the license said, as a document — the only
       typing asked for is what the license cannot say. Edit is a word. */
    const row = (key, label, val) => `<div class="scan-row" data-field="${esc(key)}">
      <div><span class="scan-row__lab">${esc(label)}</span>
        <span class="scan-row__val" data-show>${esc(val)}</span></div>
      <button type="button" class="scan-act" data-edit aria-label="Edit ${esc(label)}">Edit</button>
    </div>`;
    body.innerHTML = `${top(100)}
      <div class="scan-hero scan-hero--tight">
        <h1>Create new customer</h1>
        <p>The license filled these in. Check each line, then add the guest&rsquo;s contact details.${o.mode === "cobuyer" ? " They&rsquo;ll be attached as the co-buyer." : ""}</p>
      </div>
      <h2 class="scan-h2">From the driver&rsquo;s license</h2>
      <div class="scan-doc">
        ${row("name", "Name", [sv.first, sv.middle, sv.last].filter(Boolean).join(" "))}
        ${row("license", "License", sv.license.number + " · " + sv.license.state + (sv.license.expires ? " · exp " + dateUS(sv.license.expires) : ""))}
        ${row("dob", "Date of birth", sv.dob ? dateUS(sv.dob) : "—")}
        ${row("address", "Address", sv.address + ", " + sv.city + ", " + sv.state + " " + sv.zip)}
      </div>
      <h2 class="scan-h2">Contact</h2>
      <div class="scan-form">
        <label for="svPhone">Mobile phone</label>
        <input id="svPhone" type="tel" inputmode="tel" autocomplete="off" placeholder="(718) 555-5555" value="${esc(sv.phone)}">
        <label for="svEmail">Email</label>
        <input id="svEmail" type="email" autocomplete="off" placeholder="name@testing.com" value="${esc(sv.email)}">
        <div class="scan-subtle">Both phone and email are required. <span class="demo-note">Demo tool — sample data only.</span></div>
      </div>`;
    /* per-row edit opens a focused bottom sheet with the real granular
       inputs (dates stay masked MM/DD/YYYY — never a native picker) */
    const forms = {
      name: () => `<input data-f="first" type="text" value="${esc(sv.first)}" placeholder="First" aria-label="First name">
        <input data-f="middle" type="text" value="${esc(sv.middle)}" placeholder="Middle" aria-label="Middle name">
        <input data-f="last" type="text" value="${esc(sv.last)}" placeholder="Last" aria-label="Last name">`,
      license: () => `<input data-f="lnum" type="text" value="${esc(sv.license.number)}" placeholder="License #" aria-label="License number">
        <input data-f="lstate" type="text" value="${esc(sv.license.state)}" placeholder="State" aria-label="Issuing state">
        <input data-f="lexp" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(sv.license.expires ? dateUS(sv.license.expires) : "")}" aria-label="Expires">`,
      dob: () => `<input data-f="dob" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(sv.dob ? dateUS(sv.dob) : "")}" aria-label="Date of birth">`,
      address: () => `<input data-f="address" type="text" value="${esc(sv.address)}" placeholder="Street" aria-label="Street">
        <input data-f="city" type="text" value="${esc(sv.city)}" placeholder="City" aria-label="City">
        <input data-f="state" type="text" value="${esc(sv.state)}" placeholder="State" aria-label="State">
        <input data-f="zip" type="text" value="${esc(sv.zip)}" placeholder="ZIP" aria-label="ZIP">`
    };
    const shows = {
      name: () => [sv.first, sv.middle, sv.last].filter(Boolean).join(" "),
      license: () => sv.license.number + " · " + sv.license.state + (sv.license.expires ? " · exp " + dateUS(sv.license.expires) : ""),
      dob: () => sv.dob ? dateUS(sv.dob) : "—",
      address: () => sv.address + ", " + sv.city + ", " + sv.state + " " + sv.zip
    };
    const sheetTitles = { name: "Edit name", license: "Edit license", dob: "Edit date of birth", address: "Edit address" };
    $$("[data-edit]", body).forEach(btn => btn.onclick = () => {
      const rowEl = btn.closest(".scan-row"), key = rowEl.dataset.field;
      /* typed contact must survive the sheet round-trip */
      sv.phone = $("#svPhone", body).value.trim(); sv.email = $("#svEmail", body).value.trim();
      openSheet(sheetTitles[key], `<div class="scan-form" data-form="${esc(key)}">${forms[key]()}</div>
        <div class="scan-sheet__acts">
          <button type="button" class="btn btn--primary scan-cta" data-apply>Save</button>
          <button type="button" class="btn scan-cta scan-cta--text" data-cancel-sheet>Cancel</button>
        </div>`, (sheet, close) => {
        $("[data-cancel-sheet]", sheet).onclick = close;
        const formEl = $(`[data-form="${key}"]`, sheet);
        const first = $("input", formEl); if (first) first.focus();
        $("[data-apply]", sheet).onclick = () => {
          const get = (f) => { const i = $(`[data-f="${f}"]`, formEl); return i ? i.value.trim() : null; };
          const bad = [];
          /* every field in the sheet is required to save (owner, 2026-08-25).
             The one exception is the middle name — a guest may simply not
             have one, so an empty middle is a fact, not a miss. */
          const need = (f) => { if (!get(f)) bad.push({ el: $(`[data-f="${f}"]`, formEl), msg: "Required" }); };
          const dateOf = (f, cur) => { const t = get(f); if (t && !dateISO(t)) { bad.push({ el: $(`[data-f="${f}"]`, formEl), msg: "Enter MM/DD/YYYY" }); return cur; } return t ? dateISO(t) : ""; };
          if (key === "name") { need("first"); need("last"); }
          if (key === "license") { need("lnum"); need("lstate"); need("lexp"); }
          if (key === "dob") need("dob");
          if (key === "address") { need("address"); need("city"); need("state"); need("zip"); }
          const dobV = key === "dob" ? dateOf("dob", sv.dob) : null;
          const expV = key === "license" ? dateOf("lexp", sv.license.expires) : null;
          if (markMissing(formEl, bad)) return;
          if (key === "name") { sv.first = get("first"); sv.middle = get("middle"); sv.last = get("last"); }
          if (key === "license") { sv.license.number = get("lnum"); sv.license.state = get("lstate"); sv.license.expires = expV; }
          if (key === "dob") sv.dob = dobV;
          if (key === "address") { sv.address = get("address"); sv.city = get("city"); sv.state = get("state"); sv.zip = get("zip"); }
          $("[data-show]", rowEl).textContent = shows[key]();
          close();
        };
      });
    });
    $("[data-save]").onclick = () => {
      sv.email = $("#svEmail", body).value.trim();
      sv.phone = $("#svPhone", body).value.trim();
      /* the same required set and the same marks as Create Customer */
      const bad = customerMissing(svVals(), "sv", body);
      if (markMissing(body, bad)) return toast("Fill in the fields marked in red");
      saveFrom(svVals(), null);
    };
    wire(renderVerifyNew, reviewBack());
  }

  /* the typed phone matches an existing record — the evidence, what each
     action does, and the cheap typo fix, all on one card */
  function renderPhoneConflict(dup, vals, mkNew) {
    st.stage = "verify"; st.pct = 100;
    const isPrimary = o.mode === "cobuyer" && dup.id === o.deal.customerId;
    foot(`${isPrimary ? "" : `<button type="button" class="btn btn--primary scan-cta" data-plink>Link to that record</button>`}
      <button type="button" class="btn btn--ghost scan-cta scan-cta--ghost" data-pnew>Keep as a new customer</button>
      <button type="button" class="btn scan-cta scan-cta--text" data-pfix>Back — fix the number</button>`);
    /* calm explanation (spec s23): the page stays neutral — red touches only
       the conflicting number itself. The real conflict this app can have is
       the number just typed already belonging to someone else (no license
       carries a phone), so that is what the two groups show. */
    body.innerHTML = `${top(100)}
      <div class="scan-hero scan-hero--tight">
        <h1>Information conflict</h1>
        <p>The phone number entered belongs to another customer.</p>
      </div>
      <div class="scan-conflict">
        <div class="scan-row">
          <div><span class="scan-row__lab">Phone entered</span>
            <span class="scan-row__val scan-row__val--bad">${esc(vals.phone)}</span></div>
        </div>
        <div class="scan-row">
          <div><span class="scan-row__lab">Customer already using this number</span>
            <span class="scan-row__val">${esc(dup.first + " " + dup.last)}</span>
            ${dup.dob ? `<span class="scan-row__meta">Born ${esc(dateUS(dup.dob))}</span>` : ""}</div>
        </div>
      </div>
      <p class="scan-ask">Is this the same person?</p>
      <div class="scan-conseq">
        ${isPrimary ? "" : `<p><b>Link to that record</b> saves the scanned details onto ${esc(dup.first + " " + dup.last)}&rsquo;s record — no duplicate is created.</p>`}
        <p><b>Keep as a new customer</b> means two customers will share this phone number.</p>
        ${isPrimary ? `<p><b>That&rsquo;s the primary buyer on this deal</b> — they can&rsquo;t also be the co-buyer, so linking isn&rsquo;t available here.</p>` : ""}
      </div>`;
    /* linking overwrites someone's existing record off a TYPED number, so it
       is gated behind a code verification (owner, 2026-08-25): the guest
       reads back the code sent to that number, proving the number is theirs
       before anything merges. In production the code goes out by text; this
       demo has no network path (invariant), so the sheet says so and shows
       the code the guest "received" — the rehearsal stays the real one. */
    const link = $("[data-plink]");
    if (link) link.onclick = () => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      openSheet("Verify the number", `
        <p class="scan-conseq" style="margin:0 0 4px"><b>A 6-digit code was sent to ${esc(vals.phone)}.</b> Ask the guest to read it back — it proves the number is theirs before the records link.</p>
        <div class="scan-form">
          <label for="svLinkCode">Verification code</label>
          <input id="svLinkCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-digit code">
        </div>
        <p class="scan-subtle">Demo: nothing leaves this device, so no text was really sent — the code on the guest&rsquo;s phone would read <b>${esc(code)}</b>.</p>
        <div class="scan-sheet__acts">
          <button type="button" class="btn btn--primary scan-cta" data-verify>Verify &amp; Link</button>
          <button type="button" class="btn scan-cta scan-cta--text" data-cancel-sheet>Cancel</button>
        </div>`, (sheet, close) => {
        $("[data-cancel-sheet]", sheet).onclick = close;
        const inp = $("#svLinkCode", sheet); inp.focus();
        $("[data-verify]", sheet).onclick = () => {
          const typed = inp.value.trim();
          if (typed !== code) return markMissing(sheet, [{ el: inp, msg: typed ? "Code doesn't match" : "Required" }]);
          close();
          Object.assign(dup, vals); finishSave(dup, true);
        };
      });
    };
    $("[data-pnew]").onclick = () => finishSave(mkNew(), false);
    $("[data-pfix]").onclick = () => { st.sv.phone = ""; renderVerifyNew(); setTimeout(() => { const ph = $("#svPhone", body); if (ph) { ph.scrollIntoView({ block: "center" }); ph.focus(); } }, 50); };
    wire(() => renderPhoneConflict(dup, vals, mkNew), () => renderVerifyNew());
  }

  /* completion (owner mockup s9): the drawn ring, the name, then the visit.
     "Scan another license" restarts the journey in place rather than closing
     and reopening it — the advisor with two guests at the desk never leaves. */
  function renderComplete(cust, wasExisting) {
    st.stage = "complete"; st.pct = 100;
    foot(`<button type="button" class="btn btn--primary scan-cta" data-go>Continue to Visit</button>
      <button type="button" class="btn scan-cta scan-cta--text" data-more>Scan Another License</button>`);
    body.innerHTML = `${top(100)}
      <div class="scan-hero" style="text-align:center;padding-top:40px">
        <div class="scan-done" aria-hidden="true"><svg viewBox="0 0 52 52"><path d="M12 27.5 21.5 37 40 17"/></svg></div>
        <h1>${wasExisting ? "Customer updated" : "Customer added"}</h1>
        <p class="scan-donename">${esc([cust.first, cust.middle, cust.last].filter(Boolean).join(" "))}</p>
        <p>The customer is ready to continue.</p>
      </div>`;
    $("[data-go]").onclick = () => { done(); if (o.onDone) o.onDone(cust, st.persona, st.match); };
    /* a fresh scan needs a clean slate: the old photo, persona, working values
       and back-target must not leak into the next guest's journey */
    $("[data-more]").onclick = () => {
      if (st.frontUrl) { try { URL.revokeObjectURL(st.frontUrl); } catch (e) { /* noop */ } }
      st.frontUrl = null; st.persona = null; st.match = null; st.backFrom = null;
      st.sv = null; st.saved = false; st.manNum = ""; st.manState = "NY";
      renderIntro();
    };
    st.render = () => renderComplete(cust, wasExisting);
  }

  function renderVerifyTd(p) {
    st.stage = "verify"; st.pct = 100;
    const c = o.deal ? Store.customer(o.deal.customerId) : null;
    const mismatch = c && (c.first.toLowerCase() !== p.first.toLowerCase() || c.last.toLowerCase() !== p.last.toLowerCase());
    foot(`<button type="button" class="btn btn--primary scan-cta" id="svSave">Use These Details</button>`);
    body.innerHTML = `${top(100)}
      <div class="scan-hero scan-hero--tight">
        <h1>${mismatch ? "Check the name" : "License read"}</h1>
        <p>${mismatch
          ? `The license reads <b>${esc(p.first + " " + p.last)}</b>, but this deal's customer is <b>${esc(c.first + " " + c.last)}</b>. Double-check you have the right guest — the name on file won't be changed here.`
          : `${c ? "For " + esc(c.first + " " + c.last) + ". " : ""}Verify each field against the card before continuing.`}</p>
      </div>
      <div class="fields" style="padding:0 26px">
        <label class="f"><span class="lab">License # <i class="req">*</i></span><input id="svDl" type="text" value="${esc(p.license.number)}"></label>
        <label class="f"><span class="lab">Issuing State</span><input id="svDlState" type="text" value="${esc(p.license.state)}"></label>
        <label class="f"><span class="lab">Expires</span><input id="svDlExp" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(dateUS(p.license.expires))}"></label>
        <label class="f"><span class="lab">Date of Birth</span><input id="svDob" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(dateUS(p.dob))}"></label>
      </div>`;
    $("#svSave").onclick = () => {
      const expText = $("#svDlExp", body).value.trim(), dobText = $("#svDob", body).value.trim();
      const expires = expText ? dateISO(expText) : "";
      const dob = dobText ? dateISO(dobText) : "";
      const lic = { number: $("#svDl", body).value.trim(), state: $("#svDlState", body).value.trim(), expires };
      /* the same marks as every other form: the miss is shown on its field */
      const bad = [];
      if (!lic.number) bad.push({ el: $("#svDl", body), msg: "Required" });
      if (expText && !expires) bad.push({ el: $("#svDlExp", body), msg: "Enter MM/DD/YYYY" });
      if (dobText && !dob) bad.push({ el: $("#svDob", body), msg: "Enter MM/DD/YYYY" });
      if (markMissing(body, bad)) return toast("Fill in the fields marked in red");
      /* on a name mismatch the card may belong to someone else — fill the agreement
         but never write that identity onto this customer's record */
      if (c && !mismatch) { c.dob = dob || c.dob; c.license = lic; Store.save(); }
      done();
      if (o.onDone) o.onDone(c, Object.assign({}, p, { license: lic }));
    };
    wire(() => renderVerifyTd(p), () => renderBack());
  }

  renderIntro();
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
route("discovery/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const qs = RIDE_PRICE_DATA.discoveryQuestions;
  let idx = 0;

  renderChrome("Discovery Session", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/deals">Deals list</a>`);

  function render() {
    const q = qs[idx];
    const saved = deal.discovery.answers[q.key] || "";
    view().innerHTML = `
      <div class="disco-progress">${qs.map((_, i) => `<i class="${i <= idx ? "on" : ""}"></i>`).join("")}</div>
      <div class="disco">
        <span class="steps">Trips · Family · Pets · Activities · Commute · Drive</span>
        <h2>${esc(q.title)}</h2>
        <span class="hint">${esc(q.hint)}</span>
        <textarea id="ans" placeholder="Capture the conversation — this pushes to the CRM…">${esc(saved)}</textarea>
        <div class="nav">
          <button class="btn btn--ghost" id="backBtn" ${idx === 0 ? `disabled style="visibility:hidden"` : ""}>← Back</button>
          <button class="btn btn--grad" id="nextBtn">${idx === qs.length - 1 ? "Pick Vehicle →" : "Next →"}</button>
        </div>
      </div>
      <p class="note">Build rapport and keep it an organic conversation. Fact-find, confirm, and enter it here — it will be pushed into the CRM.</p>`;
    $("#ans").focus();
    $("#backBtn").onclick = () => { saveAns(); idx--; render(); };
    $("#nextBtn").onclick = () => {
      saveAns();
      if (idx === qs.length - 1) {
        deal.discovery.done = true;
        if (deal.stage === "discovery") deal.stage = "vehicle";
        Store.save();
        navigate(`#/vehicles/${deal.id}`);
      } else { idx++; render(); }
    };
  }
  function saveAns() { deal.discovery.answers[qs[idx].key] = $("#ans").value; Store.save(); }
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

  function jointHtml() {
    const cb = cbRec();
    if (!cb) return `<div class="ca-joint">
      <div class="ca-jointtop"><div><strong>Co-buyer needed</strong><span>No co-buyer is attached to this deal yet.</span></div><span class="ca-notpill">Not attached</span></div>
      <div class="ca-twobtns">
        <button type="button" class="ca-secondary" id="caCoScan">Scan co-buyer license</button>
        <button type="button" class="ca-secondary" data-buyers="${esc(deal.id)}">Choose existing customer</button>
      </div></div>`;
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
      <h2 class="ca-cardtitle">Applicant</h2>
      <p class="ca-cardsub">Tell the lender who is applying and how this application should be structured.</p>
      <span class="ca-demo">DEMO — sample data only, never real SSNs</span>
      ${scanned ? `<span class="ca-scanpill">✓ Filled from license scan</span>` : ""}
      ${stepAlert(1)}
      <div class="ca-rule"></div>
      <div class="ca-choice${F.appType === "individual" ? " active" : ""}" data-atype="individual" role="radio" aria-checked="${F.appType === "individual"}" tabindex="0"><div class="ca-radio"></div><div class="ca-choicetext"><strong>Individual application</strong><span>Applying for credit in your own name, relying on your own income and assets.</span></div></div>
      <div class="ca-choice${F.appType === "joint" ? " active" : ""}" data-atype="joint" role="radio" aria-checked="${F.appType === "joint"}" tabindex="0"><div class="ca-radio"></div><div class="ca-choicetext"><strong>With another person</strong><span>In accordance with Regulation B, you certify that you are applying for joint credit.</span></div></div>
      ${F.appType === "joint" ? jointHtml() : ""}
      <div class="ca-rule"></div>
      <label class="ca-lab">Credit Type <span class="ca-req">*</span></label>${seg(["Retail", "Lease", "Balloon"], "creditType", "cols3")}
      <div style="height:16px"></div>
      <label class="ca-lab">Primary Use</label>${seg(["Personal, family or household", "Business or commercial"], "primaryUse", "cols2")}
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
  const worksheetHtml = () => !r ? "" : `<div class="ca-ws">
    <div class="ca-wshead"><strong>Synced from your worksheet</strong><a class="ca-managelink" href="#/desk/${esc(deal.id)}">Edit</a></div>
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
      <a class="dk-chip" href="#/jacket/${esc(deal.id)}">${rpIcon("folder")} Jacket ${jacketCounts(deal).missing ? `<b>${esc(String(jacketCounts(deal).missing))}</b>` : ""}</a>
    </div>`;

  const progressHtml = () => `<div class="ca-progressbox">
    <div class="ca-progressmeta"><strong>${STEP_NAMES[st.step - 1]}</strong><span>Step ${st.step} of 4</span></div>
    <div class="ca-progress"><div style="width:${st.step * 25}%"></div></div></div>`;

  function render() {
    const stepHtml = st.step === 1 ? applicantHtml() : st.step === 2 ? residenceHtml() : st.step === 3 ? employmentHtml() : reviewHtml();
    view().innerHTML = `
    <div class="ca-app">
      ${deskTop(deal)}
      <div class="ca-page">
        ${headerHtml()}
        ${progressHtml()}
        ${stepHtml}
        ${worksheetHtml()}
      </div>
    </div>
    <div class="ca-dock">
      <div class="ca-dockinfo"><small>${st.step < 4 ? "Next" : "Lending Lane"}</small><strong>${st.step < 4 ? STEP_NAMES[st.step] : "Ready to submit"}</strong></div>
      <button type="button" class="mp-primary" id="caGo">${st.step < 4 ? "Continue" : "Submit application"} →</button>
    </div>`;
    wireDeskTop();
    wire();
  }

  function wire() {
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
    $("#caGo").onclick = () => { if (st.step < 4) { st.step++; st.err = null; render(); window.scrollTo({ top: 0, behavior: "smooth" }); } else submit(); };
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
          <div class="ca-wait"><div class="ca-eyebrow">While you waited</div><p>The Manufacturer Warranty Overview and Service Walk are complete and the Cover Sheet is printed. Next: the Team Lead signs off on the deal and delivers it to Processing — then the menu gets built.</p></div>
        </div>
      </div>
    </div>
    <div class="ca-dock">
      <div class="ca-dockinfo"><small>Next step</small><strong>Manager Sign-Off</strong></div>
      <a class="mp-primary" style="display:inline-flex;align-items:center;text-decoration:none" href="#/menu/${esc(deal.id)}">Continue →</a>
    </div>`;
    wireDeskTop();
    $("#assignLender").onchange = (e) => {
      a.lender = e.target.value; Store.save();
      toast("Lender assigned: " + a.lender);
      renderApproved();
    };
    if (justNow) toast("Application approved — qualified rate " + a.qualifiedApr + "%");
  }

  if (app && app.approved) renderApproved(); else render();
});

/* ============================================================
   Shared 5-step menu stepper — the product presentation is step 2
   ============================================================ */
const MENU_STEPS = ["Purchase Terms", "Product Presentation", "Repayment Options", "Disclosure Forms", "Financial Contracts"];

function migrateMenuV5(deal) {
  const M = deal.menu;
  if (!M || M.v5) return;
  if (M.step >= 2) M.step += 1;
  if ((M.maxStep || 1) >= 2) M.maxStep = (M.maxStep || 1) + 1;
  M.v5 = true; Store.save();
}

function menuStepperHtml(deal, active) {
  const M = deal.menu;
  const maxReach = Math.max(active, M.maxStep || 1, deal.stage === "complete" ? 5 : 1);
  return `<div class="stepper">${MENU_STEPS.map((s, i) => {
    const n = i + 1;
    const cls = n < active ? "done" : n === active ? "on" : "";
    return n <= maxReach
      ? `<button type="button" class="st ${cls}" data-step="${n}" title="Go to ${s}"><i>${n < active ? "✓" : n}</i> ${s}</button>`
      : `<span class="st ${cls}"><i>${n}</i> ${s}</span>`;
  }).join("")}</div>`;
}

function bindMenuStepper(deal, onLocalStep) {
  $$(".stepper [data-step]").forEach(b => b.onclick = () => {
    const n = parseInt(b.dataset.step, 10);
    if (n === 2) { deal.menu.step = 2; Store.save(); navigate(`#/present/${deal.id}`); return; }
    deal.menu.step = n; Store.save();
    if (onLocalStep) onLocalStep(); else navigate(`#/menu/${deal.id}`);
  });
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
   VIEW: Menu (4-step)
   ============================================================ */
route("menu/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const v = Store.vehicle(deal.stock);
  const c = Store.customer(deal.customerId);
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const isCash = deal.dealType === "cash";
  const progSet = RIDE_PRICE_DATA.programs[isLease ? "lease" : isCash ? "cash" : "finance"];
  const M = deal.menu;
  migrateMenuV5(deal);
  /* backfill for deals saved before step navigation existed */
  if ((M.maxStep || 1) < M.step) { M.maxStep = M.step; Store.save(); }
  /* backfill sign-off for deals finalized before the Team Lead role existed */
  if (!deal.signoff && deal.stage === "complete") {
    deal.signoff = { by: RIDE_PRICE_DATA.dealership.teamLead, at: deal.createdAt, backfilled: true }; Store.save();
  }

  /* ---- Manager Sign-Off gate: the Team Lead delivers the deal to Processing ---- */
  if (!deal.signoff) {
    const c2 = Store.customer(deal.customerId);
    const checks = [
      { label: "Base payment agreement signed", ok: !!(deal.basePayment && deal.basePayment.signedAt), req: true },
      { label: "Credit application approved", ok: !!(deal.creditApp && deal.creditApp.approved), req: true },
      { label: "Test drive completed", ok: !!deal.testDrive.done, req: false },
      { label: "Trade documented" + (deal.trade.has ? ` — ${esc(deal.trade.desc || "")}` : " (no trade)"), ok: deal.trade.has ? deal.trade.value > 0 : true, req: false },
      /* proof of ownership: operational gaps, surfaced to the manager and
         never blocking (owner, 2026-08-15) */
      ...(deal.trade.has
        ? (tradeOwnershipGaps(deal).length
            ? tradeOwnershipGaps(deal).map(g => ({ label: g, ok: false, req: false }))
            : [{ label: "Trade proof of ownership complete", ok: true, req: false }])
        : []),
      { label: "Cover sheet printed for the deal folder", ok: true, req: false },
      /* the jacket LOCKS sign-off (owner, 2026-08-16 — supersedes flag-only for
         the jacket specifically), but a Team Lead can override with a recorded
         reason, so the exception still routes to a manager the way the trade
         ownership gaps do. Those gaps themselves stay flag-never-block. */
      ...(function () {
        const jkc = jacketCounts(deal);
        const jov = jacketRead(deal).override;
        if (!jkc.missing) return [{ label: "Deal jacket complete — every document collected", ok: true, req: false }];
        if (jov) return [{ label: `Deal jacket — ${jkc.missing} outstanding · override recorded by ${esc(jov.by)}: “${esc(jov.reason)}”`, ok: true, req: false }];
        return [{ label: `Deal jacket — ${jkc.missing} document(s) still outstanding — funding locked`, ok: false, req: true, jacket: true }];
      })()
    ];
    const ready = checks.filter(x => x.req).every(x => x.ok);
    const jacketLocked = checks.some(x => x.jacket);
    renderChrome("Manager Sign-Off", dealTitle(deal),
      `<a class="btn btn--ghost btn--sm" href="#/credit/${esc(deal.id)}">← Lending Lane</a>`);
    view().innerHTML = `
      <div class="panel panel--navyhead" style="max-width:720px;margin:0 auto">
        <div class="panel__head"><h2>Team Lead Sign-Off Required</h2>
          <div class="right"><span class="badge badge--prog">awaiting sign-off</span></div></div>
        <div class="panel__body">
          <p class="small">The Team Lead signs off on the deal and delivers it to the Processing Team before the menu is built. Game-plan review for <b>${esc(c2.first)} ${esc(c2.last)}</b>:</p>
          <ul class="checks" style="margin-top:14px">
            ${checks.map(x => `<li class="${x.ok ? "ok" : "bad"}">${x.ok ? x.label : `${x.label}${x.req ? " — required" : ""}`} </li>`).join("")}
          </ul>
          ${isTeamLead()
            ? `${jacketLocked ? `<div class="note note--red mt">Funding sign-off is locked while jacket documents are outstanding. If one is genuinely on its way — a lien release in the mail — the Team Lead can override; the override and its reason are recorded on the deal.</div>` : ""}
               <div class="right mt">
                 ${jacketLocked ? `<button class="btn btn--ghost" id="jkOverrideBtn">Override the jacket lock</button>` : ""}
                 <button class="btn btn--grad" id="signoffBtn" ${ready ? "" : "disabled"}>✍ Manager Sign-Off — deliver to Processing</button>
               </div>`
            : `<div class="note note--red mt">You are acting as <b>Client Advisor</b>. Get your Team Lead to the desk — switch to <b>Team Lead</b> to sign off as <b>${esc(RIDE_PRICE_DATA.dealership.teamLead)}</b>.</div>`}
        </div>
      </div>`;
    const so = $("#signoffBtn");
    if (so) so.onclick = () => {
      deal.signoff = { by: RIDE_PRICE_DATA.dealership.teamLead, at: new Date().toISOString() };
      Store.save();
      toast("Signed off by " + RIDE_PRICE_DATA.dealership.teamLead + " — delivered to Processing");
      router();
    };
    const ov = $("#jkOverrideBtn");
    if (ov) ov.onclick = () => {
      modal("Override the jacket lock", `
        <p class="small">${jacketCounts(deal).missing} document(s) are still outstanding. The override is recorded on the deal with your name and reason — it does not mark anything received.</p>
        <label class="f"><span class="lab">Reason <i class="req">*</i></span><input type="text" id="jkOvReason" maxlength="120" placeholder="e.g. lien release confirmed in the mail from the credit union"></label>`,
        `<button class="btn btn--ghost" data-close>Cancel</button>
         <button class="btn btn--primary" id="jkOvGo">Record override</button>`);
      $("#jkOvGo").onclick = () => {
        const reason = ($("#jkOvReason").value || "").trim();
        if (!reason) { $("#jkOvReason").style.borderColor = "var(--crimson)"; return; }
        const j = jacketOf(deal);
        j.override = { by: RIDE_PRICE_DATA.dealership.teamLead, at: new Date().toISOString(), reason };
        Store.save();
        closeModal();
        toast("Override recorded — sign-off unlocked");
        router();
      };
    };
    return;
  }

  function chrome() {
    renderChrome(isLease ? "Lease Menu" : isCash ? "Cash Menu" : "Finance Menu", dealTitle(deal),
      `<a class="btn btn--ghost btn--sm" href="#/deals">Deals list</a>`);
  }

  /* ---------- step 1: purchase terms / disclosure ---------- */
  function step1() {
    const snap = (deal.basePayment && deal.basePayment.snapshot) || RIDE_PRICE_CALC.calc(deal, v);
    const q = deal.creditApp || {};
    const qualified = !isCash && !isLease && q.approved
      ? RIDE_PRICE_CALC.finance(deal, v, { apr: q.qualifiedApr, term: deal.desk.term }) : null;

    let bars;
    if (isCash) {
      /* live-system behavior: even cash buyers are shown the financing alternative */
      const finAgreed = RIDE_PRICE_CALC.finance(deal, v, { apr: deal.desk.apr, term: deal.desk.term });
      const finQual = q.approved ? RIDE_PRICE_CALC.finance(deal, v, { apr: q.qualifiedApr, term: deal.desk.term }) : null;
      bars = [
        { key: "balance", label: "Total Balance", body: `Total Due: <b>${money(snap.totalDue)}</b> — discuss the dollar amount line by line.` },
        { key: "lien", label: "Lien", body: `We must obtain lien holder information for title — if any portion of the balance is to be borrowed, a lien must be recorded.` },
        { key: "agreed", label: "Agreed Payment", body: `<span class="note note--wt" style="display:block;margin:0"><span class="lab">If they chose to finance instead</span>“Your Agreed Monthly Payment of: <b>${money(finAgreed.payment)}</b> for ${finAgreed.term} months @ ${deal.desk.apr}% APR.”</span>` },
        { key: "qualified", label: "Qualified Payment", body: finQual
          ? `<span class="note note--wt" style="display:block;margin:0"><span class="lab">The financing seed</span>“Your Qualified Monthly Payment is: <b>${money(finQual.payment)}</b> for ${finQual.term} months @ ${q.qualifiedApr}% APR — and that keeps ${money(snap.totalDue - deal.desk.downPayment)} in your pocket today.”</span>`
          : `Submit the credit application to reveal the qualified financing payment.` },
        { key: "disclosure", label: "Disclosure", body: `“We will review your options and you can choose which program you prefer.” Proceed as you would with a finance menu — the customizable box can convert this to a finance structure with <b>Switch to Finance</b>.` }
      ];
    } else if (isLease) {
      const l = snap;
      bars = [
        { key: "taxpay", label: "Sales Tax on Monthly Payment", body: `${(deal.desk.milesPerYear).toLocaleString()} miles per year for ${l.term} months — monthly sales tax is an addition to any base monthly payment quoted. Your sales tax is <b>${money(l.monthlyTax)}</b> per month at a rate of ${RIDE_PRICE_CALC.taxPct(RIDE_PRICE_CALC.totalTaxRate())}%.` },
        { key: "ccrtax", label: "Sales Tax on Cap Cost Reduction", body: `We are required, by law, to collect and forward these taxes: a total of <b>${money(l.ccrTax)}</b> at ${RIDE_PRICE_CALC.taxPct(RIDE_PRICE_CALC.totalTaxRate())}% on capitalized cost reduction.` },
        { key: "lev", label: "Lease End Value", body: `The lease end value for your vehicle is <b>${money(l.residual)}</b>. You may be responsible for costs over and above the lease end value at lease termination.` },
        { key: "disclosure", label: "Disclosure — Your Responsibility", body: `Excessive wear and use includes, but is not limited to: mechanical defects; broken or missing parts and keys; damaged body, fenders, lights or glass; chipped paint; interior rips, stains or burns; tires with less than 1/8" tread; and any condition making the vehicle unsafe or unlawful to operate. <i>Explaining a lessee's responsibilities generates the need for the protections you're about to show.</i>` }
      ];
    } else {
      bars = [
        { key: "agreed", label: "Agreed Payment", body: `<span class="note note--wt" style="display:block;margin:0"><span class="lab">Word track</span>“Earlier you agreed to a payment of <b>${money(snap.payment)}</b> for ${snap.term} months at ${snap.apr}%, correct?”</span>` },
        { key: "qualified", label: "Qualified Payment", body: qualified ? `<span class="note note--wt" style="display:block;margin:0"><span class="lab">Word track</span>“Great news — you qualified for <b>${q.qualifiedApr}%</b> for ${qualified.term} months, correcting your payment to <b>${money(qualified.payment)}</b>. And that will buy the car today. However…”</span>` : "Submit the credit application to reveal the qualified payment." },
        { key: "disclosure", label: "Disclosure", body: `<span class="note note--wt" style="display:block;margin:0"><span class="lab">Word track</span>“Based on our conversations, that may or may not be the best way to own your vehicle. We will review your options and choose which you prefer.”</span>` }
      ];
    }

    const lineRows = isLease
      ? `<li><span>Monthly Base Payment</span><b class="amt">${money(snap.basePayment)}</b></li>
         <li><span>Sales Tax on Base Payment</span><b class="amt">${money(snap.monthlyTax)}</b></li>
         <li><span>Base Payment with Taxes</span><b class="amt">${money(snap.payment)}</b></li>
         <li><span>Acquisition Fee</span><b class="amt">${money(snap.acquisitionFee)}</b></li>
         <li><span>Sales Tax on Cap Cost Reduction</span><b class="amt">${money(snap.ccrTax)}</b></li>
         <li class="total"><span>Total Due At Signing</span><b class="amt">${money(deal.dealType === "onepay" ? snap.onePayTotal : deal.desk.dueAtSigning)}</b></li>`
      : `${(snap.taxes && snap.taxes.rows || []).map(t => `<li><span>${t.label}</span><b class="amt">${money(t.amount)}</b></li>`).join("")}
         ${RIDE_PRICE_DATA.fees.map(f => `<li><span>${f.label}</span><b class="amt">${money(f.amount)}</b></li>`).join("")}
         <li class="total"><span>${isCash ? "Total Due" : "Balance / Amount Financed"}</span><b class="amt">${money(isCash ? snap.totalDue : snap.amountFinanced)}</b></li>`;

    view().innerHTML = `${menuStepperHtml(deal, M.step)}
      <div class="grid grid--2">
        <div class="panel">
          <div class="panel__head"><h2>Customer Acknowledgement of Basic Terms</h2></div>
          <div class="panel__body"><ul class="lines">${lineRows}</ul>
          <p class="hint mt">Explain each number in detail and receive confirmation from your client before moving on.</p></div>
        </div>
        <div>
          <div class="black-bars">${bars.map(b => `
            <div class="bbar ${M.barsDone.includes(b.key) ? "done" : ""}" data-bar="${b.key}">
              <button type="button">${M.barsDone.includes(b.key) ? "✓ " : ""}${b.label}<span class="pl">＋</span></button>
              <div class="bbody">${b.body}</div>
            </div>`).join("")}
          </div>
          <div class="flex mt"><a class="btn btn--ghost" href="#/credit/${esc(deal.id)}">← Lending Lane</a><div class="push"></div><button class="btn btn--grad" id="s1next">Next →</button></div>
        </div>
      </div>`;

    $$("[data-bar]").forEach(el => {
      el.querySelector("button").onclick = () => {
        el.classList.toggle("open");
        if (!M.barsDone.includes(el.dataset.bar)) { M.barsDone.push(el.dataset.bar); el.classList.add("done"); Store.save(); }
      };
    });
    $("#s1next").onclick = () => {
      if (M.barsDone.length < bars.length) return toast("Open and present every box before proceeding");
      /* step 2 IS the product presentation — always */
      M.step = 2; M.maxStep = Math.max(M.maxStep || 1, 2); Store.save();
      navigate(`#/present/${deal.id}`);
    };
  }

  /* ---------- step 2: repayment options ---------- */
  /* which program the phone tab bar is showing. Deliberately not persisted:
     it is a view position, not deal state. */
  let mTab = null;
  function step2() {
    const cols = Object.entries(progSet).map(([key, p]) => RIDE_PRICE_CALC.menuColumn(deal, v, key, p));
    if (!mTab) mTab = cols[0].key;
    const customResult = RIDE_PRICE_CALC.menuColumn(deal, v, "custom", {
      label: "Custom", products: M.custom,
      termAdj: M.customSource === "budget" ? (progSet.budget ? progSet.budget.termAdj : 0) : 0,
      aprAdj: M.customSource === "budget" ? (progSet.budget ? progSet.budget.aprAdj : 0) : 0
    });

    function iniBoxHtml(key) {
      const isSel = M.selectedProgram === key;
      return `<div class="ini-box ${isSel ? "ini-box--set" : ""}">
        <input type="text" maxlength="4" data-ini="${key}" value="${isSel ? esc(M.initials) : ""}" placeholder="initial" aria-label="Client initials — select this program">
        <button type="button" class="ini-clear" data-clear="${key}">Clear</button>
      </div>`;
    }

    const activeCol = mTab === "custom" ? customResult : (cols.find(c => c.key === mTab) || cols[0]);
    const acceptLabel = mTab === "custom" ? "Custom" : activeCol.label;
    const acceptPay = mTab === "custom" ? customResult.payment : activeCol.payment;
    /* Custom deliberately withholds its figure until Toggle Payment is used —
       the Accept button must not leak what the column is concealing. */
    const acceptHidden = mTab === "custom" && !M.showCustomPay;
    /* on cash and one-pay, menuColumn returns a TOTAL DUE, not a monthly
       payment (calc.js: isTotal). Never suffix that with "/mo". */
    const acceptSuffix = activeCol.isTotal ? " total" : "/mo";
    const acceptFigure = acceptHidden ? "" : ` (${money(acceptPay)}${acceptSuffix})`;

    function prodHtml(pid, colKey) {
      const p = RIDE_PRICE_CALC.productById(pid);
      return `<div class="mprod" draggable="true" data-prod="${pid}" data-from="${colKey}">
        <div><b>${p.name}</b><span>${p.detail}<span class="mprice"> · ${money0(p.price)}</span></span></div>
        ${colKey === "custom"
          ? `<button class="mv mv--x" data-return="${pid}">✕ remove</button>`
          : `<button class="mv" data-move="${pid}" data-src="${colKey}">→ Custom</button>`}
      </div>`;
    }

    view().innerHTML = `${menuStepperHtml(deal, M.step)}
      <div class="flex" style="margin-bottom:14px">
        <p class="note note--wt advscript-item" style="flex:1;min-width:min(280px,100%);margin:0"><span class="lab">Take control — the 300% rule</span>${M.presented ? `Every product has been presented — now show the options and let the client choose.` : `Present every product before showing payments.`} When they push back: <i>“Which product do you see the least amount of value in?”</i></p>
        <a class="btn advscript-item ${M.presented ? "btn--ghost" : "btn--grad"}" href="#/present/${esc(deal.id)}">🎤 ${M.presented ? "Re-present products" : `Present ${cols[0].label} →`}</a>
      </div>
      <div class="mtabs" role="tablist">
        ${[...cols.map(c => ({ key: c.key, label: c.label })), { key: "custom", label: "Custom" }]
          .map(t => `<button type="button" role="tab" class="mtab ${mTab === t.key ? "on" : ""}" data-mtab="${t.key}" aria-selected="${mTab === t.key}">${esc(t.label)}</button>`).join("")}
      </div>
      <div class="menu-grid" data-activetab="${mTab}">
        ${cols.map(col => `
          <div class="mcol ${M.selectedProgram === col.key ? "mcol--active" : ""}" data-col="${col.key}">
            <div class="mcol__mhead">
              <div class="mh-top"><span class="mh-star">★</span><b>${esc(col.label.toUpperCase())}</b>${col.key === "preferred" ? `<span class="pop-chip">Most Popular</span>` : ""}</div>
              <div class="mh-bot"><span>${col.detail}</span><b class="mh-pay">${money(col.payment)}</b></div>
            </div>
            <div class="mcol__head"><h3>${col.label}</h3>${col.key === "preferred" ? `<span class="pop-chip">Most Popular</span>` : ""}${iniBoxHtml(col.key)}</div>
            <div class="mcol__products">
              ${col.products.filter(pid => !M.custom.includes(pid)).map(pid => prodHtml(pid, col.key)).join("") || `<div class="mcol__empty">all products moved</div>`}
            </div>
            <div class="mcol__pay"><span>${col.detail}</span><b>${money(col.payment)}</b></div>
          </div>`).join("")}
        <div class="mcol ${M.selectedProgram === "custom" ? "mcol--active" : ""}" data-col="custom" id="customCol">
          <div class="mcol__mhead">
            <div class="mh-top"><span class="mh-star">★</span><b>CUSTOM</b></div>
            <div class="mh-bot"><span>${M.showCustomPay ? customResult.detail : "Custom payment"}</span><b class="mh-pay">${M.showCustomPay ? money(customResult.payment) : "— — —"}</b></div>
          </div>
          <div class="mcol__head"><h3>Custom</h3>${iniBoxHtml("custom")}</div>
          <div class="mcol__products">
            ${M.custom.length ? M.custom.map(pid => prodHtml(pid, "custom")).join("") : `<div class="mcol__empty">Send products here to build a custom program.<br>The first product's source column sets the rate &amp; term.</div>`}
          </div>
          <div class="mcol__pay"><span id="togglePayLab">${M.showCustomPay ? customResult.detail : "Custom payment"}</span><b>${M.showCustomPay ? money(customResult.payment) : "— — —"}</b></div>
        </div>
      </div>
      <div class="mfoot">
        <button type="button" class="advscript-card" id="menuAdvToggle" aria-expanded="false">
          <span class="advscript-card__ico" aria-hidden="true">💡</span>
          <span class="advscript-card__lab">Advisor Script</span>
          <span class="advscript-card__chev" aria-hidden="true">▾</span>
        </button>
        <button type="button" class="btn btn--grad macpt" id="menuAccept">Accept ${esc(acceptLabel)} Package${acceptFigure} →</button>
        <button type="button" class="mdecline" id="menuDecline">Continue without products</button>
      </div>
      <div class="flex mt">
        <button class="btn btn--primary" id="togglePay">Toggle Payment</button>
        ${isCash ? `<button class="btn btn--ghost" id="switchFin">Switch to Finance</button>` : ""}
        <div class="push"></div>
        <button class="btn btn--ghost" id="backS1">← Back</button>
        <button class="btn btn--grad" id="s2next">Next →</button>
      </div>
      <p class="note advscript-item">Products can move from Preferred and Standard into Custom. ${isCash ? "You cannot pull from Budget on a cash deal unless you switch the deal to finance." : "Moving remaining products from Standard provides payment relief."} It's possible to move forward with no products — but anything in the custom box must be initialed.</p>`;

    /* phone tab bar */
    $$("[data-mtab]").forEach(b => b.onclick = () => { mTab = b.dataset.mtab; step2(); });

    /* on a phone the whole product row is the control that sends it to Custom;
       the button it replaces is hidden at that width, never removed */
    const phone = () => window.matchMedia("(max-width: 720px)").matches;
    $$(".mprod[data-from]").forEach(row => row.addEventListener("click", (e) => {
      if (!phone() || e.target.closest("button")) return;
      const btn = row.querySelector("[data-move]") || row.querySelector("[data-return]");
      if (btn) btn.click();
    }));

    const advBtn = $("#menuAdvToggle");
    if (advBtn) {
      advBtn.setAttribute("aria-expanded", String(document.body.classList.contains("script-open")));
      advBtn.onclick = () => {
        const open = document.body.classList.toggle("script-open");
        advBtn.setAttribute("aria-expanded", String(open));
      };
    }

    $("#menuAccept").onclick = () => {
      if (mTab === "custom" && !M.custom.length) return toast("The custom box is empty — add a product first");
      initialsModal(acceptLabel, (val) => {
        M.selectedProgram = mTab; M.initials = val; Store.save();
        toast("Client initialed: " + acceptLabel);
        step2();
      });
    };
    $("#menuDecline").onclick = () => {
      if (M.custom.length && !M.selectedProgram) return toast("Anything in the custom box must be initialed");
      confirmModal("Move forward with no products?",
        "The client is declining every product on the menu. This is a legitimate outcome — the deal continues without a protection program.",
        "Continue without products", () => {
          M.selectedProgram = "none"; M.initials = "";
          M.step = 4; M.maxStep = Math.max(M.maxStep || 1, 4); Store.save(); render();
        });
    };

    /* move buttons */
    $$("[data-move]").forEach(b => b.onclick = () => {
      const pid = b.dataset.move, src = b.dataset.src;
      if (isCash && src === "budget") return toast("Cash deals can't pull from Budget — switch to finance first");
      if (!M.custom.length) M.customSource = src;
      if (!M.custom.includes(pid)) M.custom.push(pid);
      M.showCustomPay = false; Store.save(); step2();
    });
    $$("[data-return]").forEach(b => b.onclick = () => {
      M.custom = M.custom.filter(x => x !== b.dataset.return);
      if (!M.custom.length) M.customSource = null;
      M.showCustomPay = false; Store.save(); step2();
    });

    /* drag & drop */
    $$(".mprod").forEach(p => {
      p.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ pid: p.dataset.prod, from: p.dataset.from }));
        p.classList.add("ghost");
      });
      p.addEventListener("dragend", () => p.classList.remove("ghost"));
    });
    const custom = $("#customCol");
    custom.addEventListener("dragover", (e) => { e.preventDefault(); custom.classList.add("dragover"); });
    custom.addEventListener("dragleave", () => custom.classList.remove("dragover"));
    custom.addEventListener("drop", (e) => {
      e.preventDefault(); custom.classList.remove("dragover");
      try {
        const { pid, from } = JSON.parse(e.dataTransfer.getData("text/plain"));
        if (from === "custom") return;
        if (isCash && from === "budget") return toast("Cash deals can't pull from Budget — switch to finance first");
        if (!M.custom.length) M.customSource = from;
        if (!M.custom.includes(pid)) M.custom.push(pid);
        M.showCustomPay = false; Store.save(); step2();
      } catch (err) { /* ignore */ }
    });

    $("#togglePay").onclick = () => { M.showCustomPay = true; Store.save(); step2(); };
    const sw = $("#switchFin");
    if (sw) sw.onclick = () => {
      deal.dealType = "finance"; Store.save(); toast("Deal switched to Finance"); render();
    };
    const colLabel = (key) => key === "custom" ? "Custom" : progSet[key].label;
    $$("[data-ini]").forEach(inp => inp.onchange = () => {
      const key = inp.dataset.ini;
      const val = inp.value.trim().toUpperCase();
      if (!val) {
        if (M.selectedProgram === key) { M.selectedProgram = null; M.initials = ""; }
      } else {
        if (key === "custom" && !M.custom.length) { inp.value = ""; return toast("The custom box is empty — add a product first"); }
        M.selectedProgram = key; M.initials = val;
      }
      Store.save(); step2();
      if (val) toast("Client initialed: " + colLabel(key));
    });
    $$("[data-clear]").forEach(b => b.onclick = () => {
      const key = b.dataset.clear;
      if (M.selectedProgram === key) { M.selectedProgram = null; M.initials = ""; Store.save(); toast("Selection cleared"); }
      step2();
    });
    $("#backS1").onclick = () => { M.step = 2; Store.save(); navigate(`#/present/${deal.id}`); };
    $("#s2next").onclick = () => {
      if (M.custom.length && M.selectedProgram !== "custom" && !M.selectedProgram) return toast("Anything in the custom box must be initialed — have the client initial a program box");
      if (!M.selectedProgram) {
        return confirmModal("Move forward with no products?",
          "No program has been initialed. The deal continues without a protection program.",
          "Continue without products", () => {
            M.selectedProgram = "none"; M.initials = "";
            M.step = 4; M.maxStep = Math.max(M.maxStep || 1, 4); Store.save(); render();
          });
      }
      M.step = 4; M.maxStep = Math.max(M.maxStep || 1, 4); Store.save(); render();
    };
  }

  /* ---------- step 3: disclosure forms ---------- */
  function step3() {
    /* the trade ownership answers make some forms mandatory — select them and
       lock them, so paperwork the deal depends on cannot quietly go missing */
    const reqForms = requiredTradeForms(deal);
    reqForms.forEach(fid => { if (!deal.forms.selected.includes(fid)) deal.forms.selected.push(fid); });
    if (reqForms.length) Store.save();
    const groups = {};
    RIDE_PRICE_DATA.dealForms.forEach(f => { (groups[f.group] = groups[f.group] || []).push(f); });
    view().innerHTML = `${menuStepperHtml(deal, M.step)}
      <div class="panel">
        <div class="panel__head"><h2>Benefits Acknowledgement</h2></div>
        <div class="panel__body">
          <p class="small">“The benefits and protection option(s) available have been explained to me/us and I/we choose the option(s) initialed above. I/We hold the Dealer harmless for my/our refusal of any optional benefit or protection.”</p>
          ${M.ackSigned
            ? `<div class="sig-box">${esc(M.ackName || c.first + " " + c.last)}</div><p class="small">Signed ${today()} · initials ${esc(M.initials || "—")}</p>`
            : `<button class="btn btn--primary" id="ackSign">✍ Client signs acknowledgement</button>`}
        </div>
      </div>
      <div class="panel">
        <div class="panel__head"><h2>Deal Forms — select the forms you need to print</h2></div>
        <div class="panel__body">
          <div class="grid grid--2">
          ${Object.entries(groups).map(([g, forms]) => `
            <div><h3 style="font-size:13px;text-transform:uppercase;color:var(--navy);margin:0 0 8px">${g}</h3>
            ${forms.map(f => { const locked = reqForms.includes(f.id); return `<label class="opt-row${locked ? " opt-row--locked" : ""}"><span class="switch"><input type="checkbox" data-form="${f.id}" ${deal.forms.selected.includes(f.id) ? "checked" : ""} ${locked ? "disabled" : ""}><span class="sl"></span></span><span class="opt-row__label">${esc(f.label)}${locked ? ` <b class="req-tag">required by the trade</b>` : ""}</span></label>`; }).join("")}</div>`).join("")}
          </div>
          <p class="hint">Additional forms may be printed by your team lead or processing department.</p>
        </div>
      </div>
      <div class="flex"><button class="btn btn--ghost" id="backS2">← Back</button><div class="push"></div><button class="btn btn--grad" id="s3next">Continue →</button></div>`;

    const ack = $("#ackSign");
    if (ack) ack.onclick = () => { M.ackSigned = true; M.ackName = c.first + " " + c.last; Store.save(); step3(); toast("Acknowledgement signed"); };
    $$("[data-form]").forEach(cb => cb.onchange = () => {
      const picked = $$("[data-form]").filter(x => x.checked).map(x => x.dataset.form);
      /* locked forms are disabled inputs; keep them in the list regardless */
      reqForms.forEach(fid => { if (!picked.includes(fid)) picked.push(fid); });
      deal.forms.selected = picked;
      Store.save();
    });
    $("#backS2").onclick = () => { M.step = 3; M.maxStep = Math.max(M.maxStep || 1, 3); Store.save(); render(); };
    $("#s3next").onclick = () => {
      if (!M.ackSigned) return toast("The client must sign the benefits acknowledgement first");
      M.step = 5; M.maxStep = 5; deal.stage = "forms"; Store.save(); render();
    };
  }

  /* ---------- step 4: financial contracts / finalize ---------- */
  function step4() {
    const selKey = M.selectedProgram;
    const purchased = selKey && selKey !== "none"
      ? (selKey === "custom" ? M.custom : progSet[selKey].products) : [];
    const declined = [...new Set(Object.values(progSet).flatMap(p => p.products))].filter(pid => !purchased.includes(pid));
    const colResult = selKey && selKey !== "none"
      ? RIDE_PRICE_CALC.menuColumn(deal, v, selKey, selKey === "custom"
        ? { label: "Custom", products: M.custom, termAdj: 0, aprAdj: 0 }
        : progSet[selKey]) : null;
    const snap = (deal.basePayment && deal.basePayment.snapshot) || RIDE_PRICE_CALC.calc(deal, v);
    const done = deal.forms.finalized;

    view().innerHTML = `${menuStepperHtml(deal, M.step)}
      <div class="doc">
        <div class="doc-brand"><span style="font-size:22px;font-weight:800;font-style:italic;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent">Ride</span><span style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--navy)">PRICE</span></div>
        <h2>Repayment Options — ${RIDE_PRICE_DATA.dealership.name}</h2>
        <div class="two">
          <div><b>${esc(c.first)} ${esc(c.last)}</b><br>${esc(c.phone)}<br>${esc(c.address)}, ${esc(c.city)} ${esc(c.zip)}</div>
          <div class="right"><b>${esc(v.year)} ${esc(v.make)} ${esc(v.model)}</b><br>VIN ${esc(v.vin)} · Stock ${esc(v.stock)}<br>${esc(DEAL_TYPES[deal.dealType])}${colResult && colResult.term ? ` · ${colResult.term} mo${colResult.apr ? " @ " + colResult.apr.toFixed(2) + "%" : ""}` : ""}</div>
        </div>
        <h3 style="font-size:13px;color:var(--navy);margin:10px 0 4px">Purchased Products</h3>
        <ul class="lines small">
          ${purchased.length ? purchased.map(pid => { const p = RIDE_PRICE_CALC.productById(pid); return `<li><span>${p.name} — ${p.detail}</span><b class="amt">${money(p.price)}</b></li>`; }).join("") : `<li><span class="muted">No products selected</span><b class="amt">$0.00</b></li>`}
          ${colResult ? `<li class="total"><span>${colResult.isTotal ? "Total Due" : "Monthly Payment (inc. products & taxes)"}</span><b class="amt">${money(colResult.payment)}</b></li>`
            : `<li class="total"><span>${isCash ? "Total Due" : "Monthly Payment"}</span><b class="amt">${money(isCash ? snap.totalDue : (deal.dealType === "onepay" ? snap.onePayTotal : snap.payment))}</b></li>`}
        </ul>
        <h3 style="font-size:13px;color:var(--crimson);margin:14px 0 4px">Declined Products</h3>
        <p class="small">${declined.length ? declined.map(pid => RIDE_PRICE_CALC.productById(pid).name + " (" + RIDE_PRICE_CALC.productById(pid).detail + ")").join(" · ") : "None"}</p>
        <p class="fine">The benefits and protection option(s) available have been explained to me/us and I/we choose the option(s) initialed (${esc(M.initials || "—")}). I/We hold the Dealer harmless for my/our refusal of any optional benefit or protection.</p>
        <div class="sig-box" style="margin-top:12px">${esc(c.first + " " + c.last)}</div>
      </div>
      <div class="flex mt" style="max-width:760px;margin:16px auto 0">
        <button class="btn btn--ghost" id="backS3">← Back</button>
        <a class="btn btn--ghost" href="#/deals">Return to Deals List</a>
        <button class="btn btn--primary" id="dmsPush">DMS Push</button>
        <a class="btn btn--ghost" href="#/forms/${esc(deal.id)}">🖨 Print Center</a>
        <div class="push"></div>
        ${done ? `<span class="badge badge--approved" style="padding:10px 18px">✓ Deal Finalized</span>` : `<button class="btn btn--grad" id="finalize">Finalize Deal</button>`}
      </div>
      <p class="note" style="max-width:760px;margin:14px auto">Print the repayment options page for your processor or team lead — it shows what was purchased and declined. Review each document with your client, collect signatures, then finalize. Team leads are responsible for the DMS push.</p>`;

    $("#backS3").onclick = () => { M.step = 4; Store.save(); render(); };
    $("#dmsPush").onclick = () => {
      if (!isTeamLead()) return toast("Team Leads are responsible for the DMS push — switch to Team Lead first");
      toast("Pushed to DMS ✓ by " + RIDE_PRICE_DATA.dealership.teamLead + " (demo)");
    };
    const fin = $("#finalize");
    if (fin) fin.onclick = () => {
      deal.forms.finalized = true; deal.stage = "complete"; Store.save(); step4();
      toast("🎉 Deal finalized — it now shows dark blue in the Deals list");
    };
  }

  function render() {
    if (M.step === 2) return navigate(`#/present/${deal.id}`);
    chrome();
    /* renderChrome() cleared this; step 3 is the one with a phone layout */
    document.body.dataset.screen = M.step === 3 ? "menu3" : "";
    ({ 1: step1, 3: step2, 4: step3, 5: step4 }[Math.min(5, Math.max(1, M.step))] || step1)();
    bindMenuStepper(deal, render);
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
  Store.save();
}

/* the simulated client request — a stamp on the deal, nothing leaves the device */
function jacketRequest(deal, docIds) {
  const j = jacketOf(deal);
  if (!j.req) j.req = {};
  const at = new Date().toISOString();
  docIds.forEach(id => { j.req[id] = at; });
  Store.save();
}

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
  bank: `<path d="m3.5 9 8.5-5.5L20.5 9v1.5h-17z"/><path d="M5.5 10.5v7M10 10.5v7M14 10.5v7M18.5 10.5v7M4 17.5h16M3 20.5h18"/>`
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

/* ---------------- the jacket screen ---------------- */

route("jacket/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  /* both lists fold on a phone and open where there is room (desktop) —
     same query the stylesheet uses, so 720px exactly is a phone on both
     sides. The missing list gets the same treatment as the jacket list so
     the screen opens as a summary and expands on demand (owner, 2026-08-18). */
  const roomy = !window.matchMedia("(max-width: 720px)").matches;
  /* one section holds every dealer form and everything already collected
     (owner declutter, 2026-08-18): the screen offers exactly two places to
     look — what the customer still owes, and everything else */
  let showForms = roomy;

  function render() {
    const docs = jacketDocs(deal);
    const n = jacketCounts(deal);
    const outstanding = docs.filter(d => !jacketState(deal, d.id));
    const received = docs.filter(d => jacketState(deal, d.id));
    const jk = jacketRead(deal);
    const cst = Store.customer(deal.customerId);
    const veh = Store.vehicle(deal.stock);
    const pct = n.total ? Math.round(n.have / n.total * 100) : 0;
    const ov = jk.override;
    const addable = RIDE_PRICE_DATA.dealForms.filter(f => !docs.some(d => d.id === "form-" + f.id));

    /* the script button rides the phone header; desktop hides that card, so
       it also sits in the page actions where desktop can reach it */
    renderChrome("Deal Jacket", dealTitle(deal),
      `<button class="btn btn--ghost btn--sm" id="jkScriptTop">💡 Script</button>
       <a class="btn btn--ghost btn--sm" href="#/forms/${esc(deal.id)}">🖨 Print Center</a>
       <button class="btn btn--grad btn--sm" id="jkScan">📷 Scan a document</button>`);
    document.body.dataset.screen = "jacket";

    /* what the banner says about the funding gate — the sign-off itself lives
       on the Manager Sign-Off screen; this line mirrors its state */
    const gateLine = deal.signoff
      ? `<span class="jk-gate__ok">✓ Signed off by ${esc(deal.signoff.by)} · ${esc(jacketStamp(deal.signoff.at))}</span>`
      : n.missing
        ? (ov
          ? `<span class="jk-gate__ov">Sign-off unlocked by override — ${esc(ov.by)}: “${esc(ov.reason)}”</span>`
          : `<span class="jk-gate__warn">⚠ ${n.missing} item${n.missing === 1 ? "" : "s"} needed before funding sign-off.</span>`)
        : `<span class="jk-gate__ok">✓ Jacket complete — ready for funding sign-off</span>`;

    /* rows replicate the owner's phone mockup (2026-08-16, reaffirmed): one
       primary action pinned right — Scan for the app's own paper, Upload for
       anything from outside. The secondary actions stay in the DOM and fold
       behind a tap on the row text on phones; desktop shows them inline. */
    const led = jacketLedgers(deal);
    const cl = jacketClient(deal);
    const queue = clientQueue(deal);
    const reqSent = !!jk.reqSentAt;
    /* the queue owns its three; the general missing list keeps the rest */
    const dealerMissing = outstanding.filter(d => !queue.includes(d.id));

    /* the customer-documents queue (owner's prototype, matched 2026-08-18):
       the whole row is a tap target that opens the camera and verifies
       instantly through the same simulated check the client link runs */
    const queueRow = (id) => {
      const d = docs.find(x => x.id === id);
      const m = clientMeta(id); const r = cl[id];
      const blocked = r && r.state === "rejected";
      /* the row carries its own action, per the owner's wireframe — the
         whole row stays tappable, and the button says what the tap does */
      return `<div class="jk-row dr-qrow dr-qrow--snap" data-snaprow="${esc(id)}" role="button" tabindex="0" aria-label="Scan ${esc(d.label)}">
        <span class="dr-qicon">${m.icon}</span>
        <span class="jk-row__main"><b>${esc(d.label)}</b>
          <span class="jk-row__why${blocked ? " jk-row__why--blocked" : ""}">${blocked ? `⚠ ${esc(r.rejectedReason || "")}` : esc(m.plainReason)}</span></span>
        <button type="button" class="btn btn--sm jk-rowscan" data-snapbtn="${esc(id)}">📷 ${blocked ? "Retake" : "Scan"}</button>
      </div>`;
    };

    const missRow = (d) => `
      <div class="jk-row jk-row--miss">
        <span class="jk-row__mark jk-row__mark--miss">!</span>
        <button type="button" class="jk-row__main jk-row__disclose" data-toggles-row aria-expanded="false">
          <b>${esc(d.label)}</b>
          ${d.origin === "outside" ? `<span class="jk-chip">arrives from outside</span>` : ""}
          ${d.added ? `<span class="jk-chip jk-chip--added">added by hand</span>` : ""}
          <span class="jk-row__why"><i class="jk-miss">Missing</i> · <span class="jk-why-l">${esc(d.why)}</span><span class="jk-why-s">${esc(d.whyShort)}</span></span>
          ${jk.req[d.id] ? `<span class="jk-row__req">Requested from the client · ${esc(jacketStamp(jk.req[d.id]))}</span>` : ""}
        </button>
        <div class="jk-row__act">
          ${d.origin !== "outside"
            ? `<button class="btn btn--primary btn--sm" data-scan="${esc(d.id)}">📷 Scan</button>`
            : `<button class="btn btn--primary btn--sm" data-upl="${esc(d.id)}">⬆ Upload</button>`}
        </div>
        <div class="jk-row__more">
          <button class="btn btn--ghost btn--sm" data-take="${esc(d.id)}">Mark received</button>
          <button class="btn btn--ghost btn--sm" data-req="${esc(d.id)}">Request</button>
          ${d.added ? `<button class="btn btn--ghost btn--sm" data-drop="${esc(d.id)}">Remove</button>` : ""}
        </div>
      </div>`;

    /* every collected row gets View, as the mockup draws (owner overwrote the
       View/Record split, 2026-08-16): an app document opens the app's own
       rendering, an outside document opens the record the jacket holds. The
       Source line keeps the machine-check / person's-word distinction. */
    const inRow = (d) => {
      const st = jacketState(deal, d.id);
      const verified = st.how === "scan";
      return `
      <div class="jk-row jk-row--in">
        <span class="jk-row__mark">✓</span>
        <button type="button" class="jk-row__main jk-row__disclose" data-toggles-row aria-expanded="false">
          <b>${esc(d.label)}</b>
          ${d.origin === "outside" ? `<span class="jk-chip">arrives from outside</span>` : ""}
          ${d.added ? `<span class="jk-chip jk-chip--added">added by hand</span>` : ""}
          <span class="jk-row__why"><span class="jk-why-l">${esc(d.why)}</span><span class="jk-why-s">${esc(d.whyShort)}</span></span>
          <span class="jk-row__state">Source: ${verified ? "Camera Scan · Verified" : st.how === "client" ? "Client Upload · Accepted" : st.how === "sort" ? "Snap &amp; Sort · Auto-filed (demo)" : "Manual Entry · Received by " + esc(st.by)} · ${esc(jacketStamp(st.at))}${st.note ? " · " + esc(st.note) : ""}</span>
        </button>
        <div class="jk-row__act">
          ${d.origin !== "outside"
            ? `<a class="btn btn--ghost btn--sm jk-view" href="#/print/${esc(deal.id)}/${esc(d.id)}">View</a>`
            : (st.how === "client" || st.how === "sort") && CLIENT_QUEUE_IDS.includes(d.id)
              ? `<a class="btn btn--ghost btn--sm jk-view" href="#/docreview/${esc(deal.id)}/${esc(d.id)}">View</a>`
              : `<button class="btn btn--ghost btn--sm jk-view" data-rec="${esc(d.id)}">View</button>`}
        </div>
        <div class="jk-row__more">
          <button class="btn btn--ghost btn--sm" data-undo="${esc(d.id)}">Take back out</button>
        </div>
      </div>`;
    };

    /* the compliance card, the queue card and the In-The-Jacket accordion
       replicate the owner's prototype (2026-08-18, second match round) */
    const gateTone = deal.signoff || !n.missing ? "ok" : ov ? "ov" : "warn";
    view().innerHTML = `
      <div class="jk-phonehead">
        <span class="jk-phonehead__ava" aria-hidden="true">${cst ? esc(cst.first[0]) : "?"}</span>
        <div class="jk-phonehead__who"><b>${cst ? esc(cst.first + " " + cst.last) : "—"}</b><span>${veh ? esc(veh.year + " " + veh.make + " " + veh.model) : "no vehicle yet"}</span></div>
        ${deal.dealNo ? `<b class="jk-phonehead__no">#${esc(deal.dealNo)}</b>` : ""}
        <button type="button" class="jk-scriptbtn" id="jkScriptBtn" aria-label="Advisor script">💡</button>
      </div>
      <div class="jk-comp">
        <div class="jk-comp__top"><h2>Deal Jacket Compliance</h2><b class="jk-comp__count">${led.accepted} / ${led.total} Docs (${pct}%)</b></div>
        <div class="jk-comp__track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Deal jacket compliance ${pct}% complete">
          <span class="jk-comp__fill" style="width:${pct}%"></span>
        </div>
        <div class="jk-comp__warn jk-comp__warn--${gateTone}"><p class="jk-gate">${gateLine}</p></div>
      </div>
      ${queue.length || Object.keys(cl).length ? `
      <section class="jk-col dr-queue">
        <h3 class="jk-col__head jk-col__head--red">Customer documents <span class="jk-count--miss">(${queue.length})</span>
          <span class="dr-qaction">${reqSent
            ? `<button class="btn btn--grad btn--sm" id="drResend">Resend Link</button>`
            : `<button class="btn btn--grad btn--sm" id="drCompose">Send Text Request</button>`}</span></h3>
        ${reqSent ? `<p class="jk-reqstamp">Requested ${esc(drStamp(jk.reqSentAt))}</p>` : ""}
        <div class="jk-card">
          ${queue.length ? queue.map(queueRow).join("") : `<p class="note">All customer documents are verified. ✓</p>`}
        </div>
        ${queue.length > 1 ? `<a class="btn jk-snapall" href="#/snapall/${esc(deal.id)}/advisor">📷 Snap All ${queue.length} Documents</a>` : ""}
        ${queue.length ? `<input type="file" accept="image/*" capture="environment" id="jkSnapCam" hidden>` : ""}
      </section>` : ""}
      <section class="jk-col jk-col--forms">
        <button type="button" class="jk-intoggle" id="jkFormsToggle" aria-expanded="${showForms}">
          <span class="jk-intoggle__left"><span class="jk-incheck${dealerMissing.length ? " jk-incheck--miss" : ""}" aria-hidden="true">📁</span>
            <span class="jk-intitle">Deal forms &amp; jacket</span>
            <span class="jk-incount${dealerMissing.length ? " jk-incount--miss" : ""}">${dealerMissing.length ? dealerMissing.length + " missing" : led.accepted + "/" + led.total + " verified"}</span></span>
          <span class="jk-intoggle__ctl">${showForms ? "Hide" : "Show"} <span class="jk-inchev${showForms ? " jk-inchev--open" : ""}" aria-hidden="true">▼</span></span>
        </button>
        ${showForms ? `<div class="jk-incontent">
          ${dealerMissing.length ? `<p class="jk-grouplab jk-grouplab--miss">Still needed (${dealerMissing.length})</p>
            <button class="btn btn--ghost jk-reqall" id="jkReqAll">Request all missing from the client</button>
            ${dealerMissing.map(missRow).join("")}`
          : `<p class="note">${queue.length
              ? "No dealer forms outstanding — the customer documents above are still to come."
              : "Nothing outstanding — every document this deal needs is in the jacket."}</p>`}
          ${received.length ? `<p class="jk-grouplab jk-grouplab--in">In the jacket (${led.accepted}/${led.total})</p>${received.map(inRow).join("")}` : ""}
          <button type="button" class="jk-addopt" id="jkAddOpt" aria-expanded="false">＋ Add Optional / Custom Form</button>
          <div class="jk-addrow" id="jkAddRow" hidden>
            <label class="f"><span class="lab">This deal also needs</span>
              <select id="jkAdd" data-ui="dd" data-placeholder="+ Add Custom Form (${addable.length} available)">
                <option value="" data-ph selected hidden>+ Add Custom Form (${addable.length} available)</option>
                ${addable.map(f => `<option value="form-${esc(f.id)}">${esc(f.label)} — ${esc(f.group)}</option>`).join("")}
              </select></label>
            <p class="hint">Only add what this deal genuinely needs — an item added here counts against the jacket until it comes in.</p>
          </div>
        </div>` : ""}
      </section>
      <div class="jk-signoff">
        <span class="jk-signoff__ico" aria-hidden="true">${deal.signoff || !n.missing || ov ? "✓" : "🔒"}</span>
        <p>${deal.signoff
          ? `Deal signed off by <b>${esc(deal.signoff.by)}</b> · ${esc(jacketStamp(deal.signoff.at))}`
          : n.missing && !ov
            ? `Funding sign-off is <b>locked</b> until ${n.missing} outstanding document${n.missing === 1 ? " is" : "s are"} received. A Team Lead can override at sign-off, with a recorded reason.`
            : n.missing && ov
              ? `Sign-off unlocked by override — <b>${esc(ov.by)}</b>: “${esc(ov.reason)}”`
              : `Every document is in. The deal is ready for Manager Sign-Off.`}</p>
        ${deal.signoff ? "" : `<a class="btn ${n.missing && !ov ? "btn--ghost" : "btn--primary"} btn--sm" href="#/menu/${esc(deal.id)}">Go to Manager Sign-Off</a>`}
      </div>
      <div class="jk-bottombar">
        <a class="btn btn--ghost" href="${esc(STAGES[deal.stage] ? STAGES[deal.stage].route(deal) : "#/deals")}">← Back to Deal</a>
        ${led.missing === 0
          ? `<a class="btn dr-funding" href="#/menu/${esc(deal.id)}">Complete Deal &amp; Sign-off →</a>`
          : `<button type="button" class="btn jk-dockinfo" disabled aria-disabled="true">${led.missing} doc${led.missing === 1 ? "" : "s"} needed</button>`}
      </div>`;

    /* one modal for marking received; the note is optional, the by-name
       record is the point */
    function takeModal(docId) {
      const m = docMeta(docId);
      modal("Mark received — " + m.label, `
        <p class="small">Recorded against this deal as taken in by <b>${esc(roleName())}</b>. Nothing is uploaded — the jacket keeps the record, not the paper.</p>
        <label class="f"><span class="lab">Note (optional)</span><input type="text" id="jkNoteIn" maxlength="80" placeholder="e.g. faxed by the credit union"></label>`,
        `<button class="btn btn--ghost" data-close>Cancel</button>
         <button class="btn btn--primary" id="jkNoteGo">Mark received</button>`);
      $("#jkNoteGo").onclick = () => {
        jacketReceive(deal, docId, "hand", ($("#jkNoteIn").value || "").trim());
        closeModal(); toast("Marked received by " + roleName()); render();
      };
    }

    /* the mockup's Upload button, on the app's terms: the photo proves the
       paper is in hand, then it is discarded — nothing is stored (owner
       decision, 2026-08-16) and nothing is read from it (invariant 4). The
       record is what the jacket keeps. */
    function uploadFlow(docId) {
      const m = docMeta(docId);
      if (!m) return;
      modal("Upload — " + m.label, `
        <label class="scan-frame scan-frame--tap scan-cap">
          <span class="scan-frame__icon">📷</span><span class="scan-frame__label" id="jkUplLabel">Photograph the document</span>
          <input type="file" accept="image/*" capture="environment" id="jkUplFile">
        </label>
        <p class="small" style="margin-top:10px">The photo confirms it is in hand and is then discarded — the jacket keeps the record, not the paper. Recorded as taken in by <b>${esc(roleName())}</b>.</p>
        <label class="f"><span class="lab">Note (optional)</span><input type="text" id="jkUplNote" maxlength="80" placeholder="e.g. faxed by the credit union"></label>`,
        `<button class="btn btn--ghost" data-close>Cancel</button>
         <button class="btn btn--ghost" id="jkUplHand">Mark received without a photo</button>
         <button class="btn btn--primary" id="jkUplGo" disabled>Mark received</button>`);
      /* Upload means the paper was sighted — completing it without a photo
         would let the button say something that did not happen. The no-photo
         path stays one tap away and is recorded the same way. */
      const fileIn = $("#jkUplFile");
      if (fileIn) fileIn.onchange = () => {
        if (fileIn.files && fileIn.files[0]) {
          $("#jkUplLabel").textContent = "Photo taken — nothing is uploaded or kept";
          $("#jkUplGo").disabled = false;
        }
      };
      const receive = () => {
        jacketReceive(deal, docId, "hand", ($("#jkUplNote").value || "").trim());
        closeModal(); toast("Marked received by " + roleName()); render();
      };
      $("#jkUplGo").onclick = receive;
      $("#jkUplHand").onclick = receive;
    }

    /* an outside document has no paper here — show what the jacket holds */
    function recordModal(docId) {
      const m = docMeta(docId); const st = jacketState(deal, docId);
      if (!m || !st) return;
      modal("The record — " + m.label, `
        <p class="small">This document arrives from outside the dealership, so the jacket keeps the record, not the paper.</p>
        <ul class="jk-reqlist">
          <li>${st.how === "scan" ? "Verified — the app read its own marker" : st.how === "sort" ? "Auto-filed by Snap &amp; Sort (demo — simulated check)" : st.how === "client" ? "Accepted after advisor review" : "Marked received by <b>" + esc(st.by) + "</b>"}</li>
          <li>Taken in ${esc(jacketStamp(st.at))}</li>
          ${st.note ? `<li>Note: ${esc(st.note)}</li>` : ""}
        </ul>`,
        `<button class="btn btn--primary" data-close>Close</button>`);
    }

    /* the simulated client request — same theater as the credit pull: it
       looks real, and nothing leaves the device */
    function requestFlow(ids) {
      const metas = ids.map(docMeta).filter(Boolean);
      if (!metas.length) return;
      modal("Request documents from the client", `
        <p class="small">Sends <b>${cst ? esc(cst.first + " " + cst.last) : "the client"}</b> a secure link listing what the deal still needs${cst && cst.phone ? ` at <b>${esc(cst.phone)}</b>` : ""}.</p>
        <ul class="jk-reqlist">${metas.map(x => `<li>${esc(x.label)}</li>`).join("")}</ul>
        <p class="demo-note">Demo — the message is simulated; nothing leaves this device.</p>`,
        `<button class="btn btn--ghost" data-close>Cancel</button>
         <button class="btn btn--grad" id="jkReqGo">Send request</button>`);
      /* same liveness guard as openDocScanFlow: navigating away or dismissing
         during the send window must cancel it, or the timer closes whatever
         modal is open by then and paints jacket markup over another screen */
      const back = $("#modalBack");
      const st = {};
      function cleanup() {
        st.cancelled = true;
        window.removeEventListener("hashchange", abandon);
        back.removeEventListener("click", onDismiss);
      }
      function onDismiss(e) { if (e.target === back || e.target.hasAttribute("data-close")) cleanup(); }
      function abandon() { cleanup(); closeModal(); }
      back.addEventListener("click", onDismiss);
      window.addEventListener("hashchange", abandon);
      $("#jkReqGo").onclick = () => {
        $("#modalBack .modal__body").innerHTML = `<div class="scan-stage"><div class="scan-spin"></div><p class="scan-instruct">Sending the request…</p></div>`;
        const foot = $("#modalBack .modal__foot"); if (foot) foot.remove();
        setTimeout(() => {
          if (st.cancelled || !document.contains(back)) return;
          cleanup();
          jacketRequest(deal, metas.map(x => x.id));
          closeModal(); toast("Request sent" + (cst ? " to " + cst.first : "")); render();
        }, 900);
      };
    }

    const wireScan = (el) => { if (el) el.onclick = () => openDocScanFlow(deal, render); };
    wireScan($("#jkScan"));
    /* a queue row is a camera trigger (owner's prototype): snap, then the
       same simulated check the client link runs. While a document is blocked
       on a missing page, another snap appends — front, then back. */
    let snapDoc = null;
    const openCam = (id) => { snapDoc = id; const inp = $("#jkSnapCam"); if (inp) { inp.value = ""; inp.click(); } };
    $$("[data-snaprow]").forEach(row => {
      row.onclick = () => openCam(row.dataset.snaprow);
      row.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCam(row.dataset.snaprow); } };
    });
    /* the button and its row do the same thing — without stopping the
       bubble the camera would open twice */
    $$("[data-snapbtn]").forEach(b => b.onclick = (e) => { e.stopPropagation(); openCam(b.dataset.snapbtn); });
    const snapCam = $("#jkSnapCam");
    if (snapCam) snapCam.onchange = () => {
      if (!snapCam.files || !snapCam.files.length || !snapDoc) return;
      drAddShots(deal, snapDoc, snapCam.files);
      const result = drAutoVerify(deal, snapDoc);
      toast(result.ok ? "✓ Verified instantly. Moved to In the Jacket." : "Upload blocked: " + result.issue);
      render();
    };
    /* a row's Scan carries which document is expected, so the flow can offer
       the hand-record path for exactly that document */
    $$("[data-scan]").forEach(b => b.onclick = () => openDocScanFlow(deal, render, { expect: b.dataset.scan, onHand: () => takeModal(b.dataset.scan) }));
    $$("[data-upl]").forEach(b => b.onclick = () => uploadFlow(b.dataset.upl));
    /* on phones the secondary actions fold behind the row-text disclosure —
       a real <button>, so it is keyboard operable, with aria-expanded kept true */
    $$("[data-toggles-row]").forEach(el => el.onclick = () => {
      const open = el.closest(".jk-row").classList.toggle("jk-row--open");
      el.setAttribute("aria-expanded", String(open));
    });
    $$("[data-take]").forEach(b => b.onclick = (e) => { e.stopPropagation(); takeModal(b.dataset.take); });
    $$("[data-undo]").forEach(b => b.onclick = () => { jacketRemove(deal, b.dataset.undo); render(); });
    /* only a hand-added document can leave the list; a computed one is needed
       whether or not anybody wants it there */
    $$("[data-drop]").forEach(b => b.onclick = () => { jacketDrop(deal, b.dataset.drop); render(); toast("Taken off this deal"); });
    $$("[data-rec]").forEach(b => b.onclick = () => recordModal(b.dataset.rec));
    $$("[data-req]").forEach(b => b.onclick = () => requestFlow([b.dataset.req]));
    /* one bulk request trigger — the top of the missing list (owner usability
       pass, 2026-08-16: duplicate Request triggers removed) */
    if ($("#jkReqAll")) $("#jkReqAll").onclick = () => requestFlow(dealerMissing.map(d => d.id));
    if ($("#drCompose")) $("#drCompose").onclick = () => navigate("#/docreq/" + deal.id);
    if ($("#drResend")) $("#drResend").onclick = () => navigate("#/docreq/" + deal.id + "/resend");
    $("#jkFormsToggle").onclick = () => { showForms = !showForms; render(); };
    /* the script is a sheet off the header now, not a card in the flow */
    const scriptSheet = () => modal("Advisor Script", `
      <p class="hint">“Ask for the title while you're valuing the trade — it's in the glovebox today, not at delivery.”</p>
      <p class="hint">“When the lender asks for stips, tell the client the same day — a paystub photo tonight beats a funding delay on Friday.”</p>
      <p class="hint">“Walk the jacket before the delivery appointment — hunting paperwork with the client at the desk kills the celebration.”</p>`,
      `<button class="btn btn--primary" data-close>Close</button>`);
    $("#jkScriptBtn").onclick = scriptSheet;
    if ($("#jkScriptTop")) $("#jkScriptTop").onclick = scriptSheet;
    const addOpt = $("#jkAddOpt");
    if (addOpt) addOpt.onclick = () => {
      const row = $("#jkAddRow");
      const open = row.hidden;
      row.hidden = !open;
      addOpt.setAttribute("aria-expanded", String(open));
    };
    const addSel = $("#jkAdd");
    if (addSel) addSel.onchange = () => {
      const aid = addSel.value; if (!aid) return;
      const j = jacketOf(deal);
      if (!j.extra.includes(aid)) { j.extra.push(aid); Store.save(); }
      render();
      toast("Added to this deal's jacket");
    };
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

function drComposer(id, mode) {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const isResend = mode === "resend";
  const cst = Store.customer(deal.customerId);
  /* one count drives both the list and the button: a first-time send covers
     documents not yet requested-or-landed; a resend covers everything still
     on the link (anything not accepted) */
  const queue = isResend ? clientQueue(deal) : clientQueue(deal).filter(d => {
    const r = jacketClient(deal)[d];
    return !r || r.state === "requested";
  });
  renderChrome(isResend ? "Resend document request" : "Request documents", dealTitle(deal), "");
  document.body.dataset.screen = "docreq";
  view().innerHTML = `
    <div class="dr-sheet">
      <div class="dr-sheethead"><h2>${isResend ? "Resend document request" : "Request documents"}</h2>
        <a class="dr-close" href="#/jacket/${esc(deal.id)}" aria-label="Close">×</a></div>
      <div class="dr-sheetbody">
        <div class="dr-person"><span class="dr-kicker">Send to</span>
          <b>${cst ? esc(cst.first + " " + cst.last) : "—"}</b>
          <span>${cst ? esc(cst.phone || "") : ""}</span></div>
        <div class="dr-items">
          ${queue.length ? queue.map(qid => {
            const d = docMeta(qid); const m = clientMeta(qid);
            return `<div class="dr-item"><span class="dr-qicon">${m.icon}</span>
              <span class="dr-itemcopy"><b>${esc(d.label)}</b><span>${esc(m.plainReason)}</span></span>
              <span class="dr-itemcheck">✓</span></div>`;
          }).join("") : `<p class="note">No new customer documents need a first-time request.</p>`}
        </div>
        <p class="demo-note">Demo — the text is simulated; the client's phone is played by this same browser and nothing leaves this device.</p>
        <button class="btn dr-bigcta" id="drSend" ${queue.length === 0 ? "disabled" : ""}>${isResend ? "Resend Text Request" : "Send Text Request"} (${queue.length} item${queue.length === 1 ? "" : "s"}) →</button>
        <a class="dr-cancel" href="#/jacket/${esc(deal.id)}">Cancel</a>
      </div>
    </div>`;
  view().insertAdjacentHTML("beforeend", drDebugStrip(deal));
  drWireDebug(deal);
  $("#drSend").onclick = () => {
    const j = jacketOf(deal);
    const cl = jacketClientOf(deal);
    const at = new Date().toISOString();
    j.reqSentAt = at;
    clientQueue(deal).forEach(qid => {
      if (!cl[qid] || cl[qid].state === "requested") cl[qid] = { state: "requested", requestedAt: at };
    });
    Store.save();
    toast(isResend ? "Fresh link sent" : "Text request sent");
    navigate("#/clientlink/" + deal.id + "/sms");
  };
}
route("docreq/:id", ({ id }) => drComposer(id));
route("docreq/:id/:mode", ({ id, mode }) => drComposer(id, mode));

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
          <div class="dr-zoom"><button data-zoom="-">−</button><button data-zoom="+">＋</button></div></div>
        <div class="dr-pagetools"><button data-page="-" ${st.page === 0 ? "disabled" : ""}>←</button><b>Page ${st.page + 1} of ${pages}</b><button data-page="+" ${st.page >= pages - 1 ? "disabled" : ""}>→</button></div>
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
  if (!targets.length) return navigate(backHash);
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
            <button type="button" class="sa-thumb__x" data-unshot="${esc(s.id)}" aria-label="Remove photo ${i + 1}">×</button></span>`).join("")}</div>` : ""}
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
        ${purchased.length ? purchased.map(pid => { const p = RIDE_PRICE_CALC.productById(pid); return `<li><span>${p.name} — ${p.detail}</span><b class="amt">${money(p.price)}</b></li>`; }).join("") : `<li><span>No products selected</span><b class="amt">$0.00</b></li>`}
      </ul>
      <h3 class="pd-h3">Declined products</h3>
      <p class="pd-note">${declined.length ? declined.map(pid => RIDE_PRICE_CALC.productById(pid).name + " (" + RIDE_PRICE_CALC.productById(pid).detail + ")").join(" · ") : "None"}</p>
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

route("forms/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  renderChrome("Print Center", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/menu/${esc(deal.id)}">← Menu</a>
     <a class="btn btn--ghost btn--sm" href="#/jacket/${esc(deal.id)}">📁 Deal Jacket</a>
     <a class="btn btn--grad btn--sm" href="#/print/${esc(deal.id)}/packet">🖨 Print full packet</a>`);

  const core = [
    { key: "cover", icon: "📁", label: "Deal Cover Sheet", note: "Snapshot + required-documentation checklist" },
    { key: "agreement", icon: "✍️", label: "Base Payment Agreement", note: deal.basePayment && deal.basePayment.signedAt ? "Signed — ready for the deal folder" : "Not signed yet" },
    { key: "repayment", icon: "📋", label: "Repayment Options", note: deal.menu.selectedProgram ? "Purchased & declined products" : "No program selected yet" },
    { key: "testdrive", icon: "🚗", label: "Test Drive Agreement", note: deal.testDrive.done ? "Completed" : deal.testDrive.signed ? "Signed" : "Not started" },
    { key: "delivery", icon: "✅", label: "Delivery Checklist", note: `${deal.forms.selected.length} form(s) selected in the menu` }
  ];
  if (deal.trade.rebates > 0) core.push({ key: "rebates", icon: "🏷️", label: "Applied Rebates", note: `${money(deal.trade.rebates)} applied to this deal` });
  if (deal.quotes && deal.quotes.length) core.push({ key: "quote", icon: "📧", label: "Saved Quote", note: `${deal.quotes.length} saved — latest ${money(deal.quotes[deal.quotes.length - 1].summary)}` });
  const selected = deal.forms.selected.map(fid => RIDE_PRICE_DATA.dealForms.find(f => f.id === fid)).filter(Boolean);

  view().innerHTML = `
    <div class="grid grid--3">
      ${core.map(d => `<a class="card card--link" href="#/print/${esc(deal.id)}/${esc(d.key)}">
        <span class="icon">${esc(d.icon)}</span><h3>${esc(d.label)}</h3><p>${esc(d.note)}</p>
        <span class="go">Preview &amp; print →</span></a>`).join("")}
    </div>
    <h3 style="color:var(--navy);margin:26px 0 10px">Selected deal forms (from Disclosure Forms step)</h3>
    ${selected.length ? `<div class="grid grid--3">
      ${selected.map(f => `<a class="card card--link" href="#/print/${esc(deal.id)}/form-${esc(f.id)}">
        <span class="icon">📄</span><h3>${esc(f.label)}</h3><p>${esc(f.group)}</p>
        <span class="go">Preview &amp; print →</span></a>`).join("")}
    </div>` : `<p class="note">No forms selected yet — choose them on the menu's <a href="#/menu/${esc(deal.id)}">Disclosure Forms</a> step.</p>`}
    <p class="hint mt">The full packet prints every document with page breaks.</p>`;
});

route("print/:id/:doc", ({ id, doc }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const docs = printDocs(deal);
  renderChrome("Print Preview", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/forms/${esc(deal.id)}">← Print Center</a>
     <button class="btn btn--grad btn--sm" id="printNow">🖨 Print / Save as PDF</button>`);

  let html = "";
  if (doc === "packet") {
    html = [docs.cover(), docs.agreement(),
      deal.trade.rebates > 0 ? docs.rebates() : "", docs.repayment(),
      deal.testDrive.signed ? docs.testdrive() : "", docs.delivery(),
      ...deal.forms.selected.map(fid => docs.generic(fid))].join("");
  } else if (doc.startsWith("form-")) {
    html = docs.generic(doc.slice(5));
  } else if (docs[doc]) {
    html = docs[doc]();
  } else {
    return navigate(`#/forms/${deal.id}`);
  }
  view().innerHTML = `<div class="print-area">${html}</div>`;
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

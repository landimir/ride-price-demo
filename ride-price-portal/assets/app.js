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

  function seedDeal() {
    return {
      id: "d-demo1", customerId: "c-demo1", stock: "7H21313", dealType: "finance",
      stage: "desking", createdAt: "2026-07-14T17:20:00Z",
      discovery: { answers: { week: "Daily commute to Midtown, weekend trips upstate.", family: "Two kids, one dog." }, done: true },
      testDrive: { done: true, completedMiles: 12 },
      trade: { has: true, desc: "2018 Hyundai Tucson", miles: 61200, condition: "Good", value: 15500, payoff: 10750, rebates: 500, applyTaxCredit: true },
      huddle: { done: false },
      desk: { term: 60, apr: 3.5, downPayment: 1000, leaseTerm: 36, milesPerYear: 12000, leaseFactor: 0.00117, dueAtSigning: 1000, accessories: ["mats", "tint"], daysToFirst: 45 },
      basePayment: null, creditApp: null,
      menu: { step: 1, barsDone: [], custom: [], customSource: null, selectedProgram: null, initials: "", ackSigned: false },
      forms: { selected: [], finalized: false }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : fresh();
    } catch (e) { state = fresh(); }
    if (!state.customers) state = fresh();
    return state;
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function reset() { localStorage.removeItem(KEY); state = fresh(); save(); }

  return {
    load, save, reset,
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
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2100);
}

function modal(title, bodyHtml, footHtml) {
  closeModal();
  const back = document.createElement("div");
  back.className = "modal-back open";
  back.id = "modalBack";
  back.innerHTML = `<div class="modal">
    <div class="modal__head"><h3>${title}</h3><button data-close>×</button></div>
    <div class="modal__body">${bodyHtml}</div>
    ${footHtml ? `<div class="modal__foot">${footHtml}</div>` : ""}
  </div>`;
  back.addEventListener("click", (e) => { if (e.target === back || e.target.hasAttribute("data-close")) closeModal(); });
  document.body.appendChild(back);
  return back;
}
function closeModal() { const m = $("#modalBack"); if (m) m.remove(); }

/* branded replacement for confirm(): destructive actions get a real dialog */
function confirmModal(title, bodyHtml, confirmLabel, onConfirm) {
  modal(title, `<p style="margin:0">${bodyHtml}</p>`,
    `<button class="btn btn--ghost" data-close>Cancel</button>
     <button class="btn btn--danger" id="confirmGo">${confirmLabel}</button>`);
  $("#confirmGo").onclick = () => { closeModal(); onConfirm(); };
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
function dealTitle(deal) {
  const c = Store.customer(deal.customerId);
  const cb = deal.coBuyerId ? Store.customer(deal.coBuyerId) : null; /* missing record = no co-buyer */
  const v = Store.vehicle(deal.stock);
  const names = `${c ? esc(c.first + " " + c.last) : "—"}${cb ? " + " + esc(cb.first + " " + cb.last) : ""}`;
  return `${names} · ${v ? esc(v.year + " " + v.make + " " + v.model) : "no vehicle yet"}
    <button class="crumb-btn" data-buyers="${esc(deal.id)}" title="Buyers on this deal">${cb ? "👥 Buyers" : "👤 Buyer"}</button>`;
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
  document.body.classList.remove("script-open");
}

/* ---------------- router ---------------- */
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
   VIEW: Deals dashboard
   ============================================================ */
route("deals", () => {
  const deals = Store.s.deals.slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const active = deals.filter(d => d.stage !== "complete").length;
  const complete = deals.filter(d => d.stage === "complete").length;

  renderChrome("Deals", `${RIDE_PRICE_DATA.dealership.name} · ${today()}`,
    `<button class="btn btn--danger btn--sm" id="resetDemo">Reset demo data</button>
     <a class="btn btn--grad" href="#/customers">＋ New customer visit</a>`);

  view().innerHTML = `
    <div class="kpis">
      <div class="kpi"><b>${deals.length}</b><span>Total deals</span></div>
      <div class="kpi"><b>${active}</b><span>In progress</span></div>
      <div class="kpi"><b>${complete}</b><span>Finalized</span></div>
      <div class="kpi"><b>${Store.s.customers.length}</b><span>Customers</span></div>
    </div>
    <div class="panel">
      <div class="panel__head"><h2>Deals</h2>
        <div class="right"><input type="text" id="dealSearch" placeholder="Customer, stock, or VIN…" style="width:230px;max-width:100%"></div>
      </div>
      <div class="tbl-scroll"><table class="tbl" id="dealsTbl">
        <thead><tr><th>Date</th><th>Customer</th><th>Vehicle : Stock #</th><th>Deal Type</th><th>Stage</th><th></th></tr></thead>
        <tbody>
        ${deals.length ? deals.map(d => {
          const c = Store.customer(d.customerId), v = Store.vehicle(d.stock);
          const st = STAGES[d.stage] || STAGES.discovery;
          return `<tr data-row="${d.id}" class="${d.stage === "complete" ? "tbl-row--done" : ""}">
            <td class="small" data-label="Date">${new Date(d.createdAt).toLocaleDateString()}</td>
            <td data-label="Customer"><b>${c ? esc(c.last + ", " + c.first) : "—"}</b></td>
            <td class="small" data-label="Vehicle">${v ? esc(v.year + " " + v.make + " " + v.model) + " : " + v.stock : "<span class='muted'>not selected</span>"}</td>
            <td data-label="Deal Type"><span class="badge badge--type">${DEAL_TYPES[d.dealType]}</span></td>
            <td data-label="Stage"><span class="badge ${d.stage === "menu" && !d.signoff ? "badge--prog" : st.badge}">${d.stage === "menu" && !d.signoff ? "Awaiting Sign-Off" : st.label}</span></td>
            <td class="right acts">
              <a class="btn btn--sm ${d.stage === "complete" ? "btn--ghost" : "btn--primary"}" href="${st.route(d)}">${d.stage === "complete" ? "Review" : "Continue"}</a>
              ${d.stock ? `<a class="btn btn--sm btn--ghost" href="#/forms/${d.id}">Forms</a>` : ""}
              <button class="btn btn--sm btn--danger" data-del="${d.id}">×</button>
            </td></tr>`;
        }).join("") : `<tr><td colspan="6" class="center muted" style="padding:34px">No deals yet — start a new customer visit.</td></tr>`}
        </tbody></table></div>
    </div>`;

  $("#resetDemo").onclick = () => {
    confirmModal("Reset demo data", "Reset all portal data back to the demo seed? Every deal and customer you created will be gone.", "Reset demo data",
      () => { Store.reset(); router(); toast("Demo data reset"); });
  };
  $("#dealSearch").oninput = (e) => {
    const q = e.target.value.toLowerCase();
    $$("#dealsTbl tbody tr").forEach(tr => { tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none"; });
  };
  $$("[data-del]").forEach(b => b.onclick = () => {
    const d = Store.s.deals.find(x => x.id === b.dataset.del);
    const c = d && Store.customer(d.customerId);
    confirmModal("Delete deal", `Delete ${c ? esc(c.first + " " + c.last) + "'s" : "this"} deal? This can't be undone.`, "Delete deal", () => {
      Store.s.deals = Store.s.deals.filter(x => x.id !== b.dataset.del);
      Store.save(); router();
    });
  });
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
      <td class="right acts"><button class="btn btn--sm btn--grad" data-start="${c.id}">Start Visit →</button></td></tr>`;
  }

  function doSearch() {
    $("#resultsPanel").hidden = false;
    const ph = $("#qPhone").value.replace(/\D/g, "");
    const em = $("#qEmail").value.trim().toLowerCase();
    const ln = $("#qLast").value.trim().toLowerCase();
    const fn = $("#qFirst").value.trim().toLowerCase();
    if (!ph && !em && !ln && !fn) { $("#results").innerHTML = `<p class="center muted" style="padding:26px 0">Enter at least one field to search.</p>`; return; }
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
      <p class="hint">Required: first &amp; last name, either email or phone, address and zip code. <span class="demo-note">Demo tool — use sample data only.</span></p>`,
      `<button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--primary" id="saveCust">Save</button>`);
    $("#saveCust").onclick = () => {
      const c = {
        id: uid("c"), first: $("#nFirst").value.trim(), middle: $("#nMiddle").value.trim(), last: $("#nLast").value.trim(),
        email: $("#nEmail").value.trim(), phone: $("#nPhone").value.trim(),
        creditScore: parseInt($("#nScore").value, 10) || 700,
        address: $("#nAddr").value.trim(), zip: $("#nZip").value.trim(),
        city: $("#nCity").value.trim(), state: $("#nState").value.trim(), createdAt: new Date().toISOString()
      };
      if (!c.first || !c.last) return toast("First and last name are required");
      if (!c.email && !c.phone) return toast("Provide an email or a phone number");
      if (!c.address || !c.zip) return toast("Address and zip code are required");
      Store.s.customers.push(c); Store.save();
      closeModal(); toast("Customer created");
      startVisit(c.id);
    };
  }
  $("#createBtn").onclick = openCreate;
  $("#scanBtn").onclick = () => openScanFlow({
    mode: "customer",
    onManual: openCreate,
    onDone: (cust) => startVisit(cust.id)
  });

  function startVisit(customerId) {
    const deal = {
      id: uid("d"), customerId, stock: null, dealType: "finance", stage: "discovery",
      createdAt: new Date().toISOString(),
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
});

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
  const st = { frontUrl: null, persona: null, match: null };
  modal("Scan Driver's License", `<div id="scanBody"></div>`);
  const body = $("#scanBody");

  /* one teardown for every exit path — dismissal, navigation, or save */
  const backEl = $("#modalBack");
  function cleanup() {
    st.cancelled = true;
    if (st.frontUrl) { try { URL.revokeObjectURL(st.frontUrl); } catch (e) { /* noop */ } st.frontUrl = null; }
    window.removeEventListener("hashchange", abandon);
    backEl.removeEventListener("click", onDismiss);
  }
  function onDismiss(e) { if (e.target === backEl || e.target.hasAttribute("data-close")) cleanup(); }
  function abandon() { cleanup(); closeModal(); } /* navigating away abandons the scan */
  backEl.addEventListener("click", onDismiss);
  window.addEventListener("hashchange", abandon);
  const done = () => { cleanup(); closeModal(); };
  const live = () => !st.cancelled && document.contains(body);

  function dots(step) {
    const order = ["front", "back", "verify"];
    const labels = { front: "1 · Front", back: "2 · Back", verify: "3 · Verify" };
    const idx = order.indexOf(step);
    return `<div class="scan-steps">${order.map((s, i) =>
      `<span class="${i < idx ? "done" : i === idx ? "on" : ""}">${labels[s]}</span>`).join("")}</div>`;
  }

  function captureInputs(frameLabel) {
    /* the frame IS the capture control — no dead box above the real button */
    return `<label class="scan-frame scan-frame--tap scan-cap">
      <span class="scan-frame__icon">📷</span><span class="scan-frame__label">${frameLabel}</span>
      <input type="file" accept="image/*" capture="environment" data-cap>
    </label>
    <div class="scan-actions">
      <label class="btn btn--ghost btn--sm scan-cap">Upload a photo<input type="file" accept="image/*" data-cap></label>
    </div>
    <p class="hint" style="margin-top:12px">Use a printed <a href="#/props" data-props-link>training license</a> — sample data only. Real IDs cannot be read.</p>`;
  }

  function wireCapture(handler) {
    $$("[data-cap]", body).forEach(inp => inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (f) handler(f);
    });
    $$("[data-props-link]", body).forEach(a => a.onclick = done);
  }

  function renderFront() {
    body.innerHTML = `${dots("front")}
      <div class="scan-stage">
        <p class="scan-instruct">Photograph the <b>FRONT</b> of the guest's license.</p>
        ${captureInputs("Tap to photograph the front")}
      </div>`;
    st.stage = "front";
    wireCapture((file) => {
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
    });
  }

  function renderBack() {
    st.stage = "back";
    body.innerHTML = `${dots("back")}
      <div class="scan-stage">
        <p class="scan-instruct">Now photograph the <b>BACK</b> — the barcode side.</p>
        ${captureInputs("Tap to photograph the back")}
        <p class="hint" style="margin-top:12px">Front captured
          ${st.frontUrl ? `<img class="scan-thumb" src="${st.frontUrl}" alt="front of license">` : "✓"}
          · <a href="#" data-retake>retake front</a></p>
      </div>`;
    wireCapture((file) => renderProcessing(file));
    $("[data-retake]", body).onclick = (e) => { e.preventDefault(); renderFront(); };
  }

  function renderProcessing(file) {
    st.stage = "processing";
    body.innerHTML = `${dots("back")}
      <div class="scan-stage">
        <div class="scan-spin"></div>
        <p class="scan-instruct">Reading barcode…</p>
      </div>`;
    const t0 = Date.now();
    RIDE_PRICE_SCAN.recognizeFile(file).then((res) => {
      setTimeout(() => {
        if (!live()) return; /* dismissed or navigated away mid-scan */
        if (res && res.ok && res.persona) { st.persona = res.persona; afterRecognize(); }
        else renderReject();
      }, Math.max(0, 1100 - (Date.now() - t0)));
    }).catch(() => { if (live()) renderReject(); });
  }

  function renderReject() {
    body.innerHTML = `${dots("back")}
      <div class="scan-stage">
        <div style="font-size:44px">🚫</div>
        <h3 style="color:var(--navy);margin:8px 0 4px">Not recognized</h3>
        <p class="scan-instruct">Please use a <a href="#/props" data-props-link>sample training license</a>.<br>
          <span class="hint">Real IDs can't be read by this demo — and in the real system a damaged barcode means the same thing: fall back to manual entry.</span></p>
        <div class="scan-actions">
          <button class="btn btn--primary" data-retry>Retake photo</button>
          <button class="btn btn--ghost btn--sm" data-manual>Enter manually</button>
        </div>
      </div>`;
    $("[data-retry]", body).onclick = () => renderBack();
    $("[data-manual]", body).onclick = () => { done(); if (o.onManual) o.onManual(); };
    $$("[data-props-link]", body).forEach(a => a.onclick = done);
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
    if (m.ask) return renderAskMatch(m);
    st.match = m;
    renderVerify();
  }

  /* hard block, no override: the scan resolved to a person already on this deal */
  function renderBlock(kind) {
    body.innerHTML = `${dots("verify")}
      <div class="scan-stage">
        <div style="font-size:44px">🚫</div>
        <h3 style="color:var(--navy);margin:8px 0 4px">${kind === "already" ? "Already the co-buyer" : "That's the primary buyer on this deal."}</h3>
        <p class="scan-instruct"><span class="hint">${kind === "already"
          ? "This license resolves to the person already attached as the co-buyer."
          : "A person can't co-sign their own loan — the co-buyer must be a different guest."}</span></p>
        <div class="scan-actions">
          <button class="btn btn--primary" data-rescan>Scan a different license</button>
          <button class="btn btn--ghost btn--sm" data-close>Cancel</button>
        </div>
      </div>`;
    $("[data-rescan]", body).onclick = () => renderFront();
  }

  /* ambiguous match — the trainee decides, nothing is applied silently */
  function renderAskMatch(m) {
    const p = st.persona, ex = m.customer;
    const msg = m.ask === "dob"
      ? `<b>Same birthday as ${esc(ex.first + " " + ex.last)}</b> (${esc(ex.dob)}). Same person with a new name, or a different guest?`
      : `<b>${esc(ex.first + " " + ex.last)}</b> is already in your CRM. Is this them?`;
    body.innerHTML = `${dots("verify")}
      <div class="scan-banner scan-banner--warn"><b>Potential match found.</b><br>${msg}</div>
      <p class="hint">License reads: <b>${esc(p.first + " " + p.last)}</b> · DOB ${esc(p.dob)} · ${esc(p.license.number)}</p>
      <div class="scan-actions">
        <button class="btn btn--primary" data-link>${m.ask === "dob" ? "Same person — update their record" : "Yes — link to that record"}</button>
        <button class="btn btn--ghost" data-new>${m.ask === "dob" ? "Different guest — create new" : "No — create a new customer"}</button>
      </div>`;
    $("[data-link]", body).onclick = () => {
      st.match = { type: m.type, customer: m.customer };
      renderVerify();
    };
    $("[data-new]", body).onclick = () => {
      st.match = { type: null, customer: null };
      renderVerify();
    };
  }

  function renderVerify() {
    const p = st.persona;
    const m = st.match, ex = m.customer;
    const nameChanged = ex && (ex.first.toLowerCase() !== p.first.toLowerCase() || ex.last.toLowerCase() !== p.last.toLowerCase());
    const asCo = o.mode === "cobuyer" ? " They'll be attached to this deal as the co-buyer." : "";
    body.innerHTML = `${dots("verify")}
      ${ex
        ? `<div class="scan-banner scan-banner--found"><b>Existing customer found</b> — ${esc(ex.first + " " + ex.last)} (matched by ${m.type}). Saving updates their record.${asCo}${nameChanged ? `<br>Name on file will update to <b>${esc(p.first + " " + p.last)}</b>.` : ""}</div>`
        : `<div class="scan-banner scan-banner--new"><b>New customer.</b> Check every field against the front of the license, then ask the guest for their contact details.${asCo}</div>`}
      <div class="fields">
        <label class="f"><span class="lab">First Name <i class="req">*</i></span><input id="svFirst" type="text" value="${esc(p.first)}"></label>
        <label class="f"><span class="lab">Middle Name</span><input id="svMiddle" type="text" value="${esc(p.middle || "")}"></label>
        <label class="f"><span class="lab">Last Name <i class="req">*</i></span><input id="svLast" type="text" value="${esc(p.last)}"></label>
        <label class="f"><span class="lab">Date of Birth</span><input id="svDob" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(dateUS(p.dob))}"></label>
        <label class="f"><span class="lab">License #</span><input id="svDl" type="text" value="${esc(p.license.number)}"></label>
        <label class="f"><span class="lab">Issuing State</span><input id="svDlState" type="text" value="${esc(p.license.state)}"></label>
        <label class="f"><span class="lab">Expires</span><input id="svDlExp" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(dateUS(p.license.expires))}"></label>
        <label class="f"><span class="lab">Address <i class="req">*</i></span><input id="svAddr" type="text" value="${esc(p.address)}"></label>
        <label class="f"><span class="lab">City</span><input id="svCity" type="text" value="${esc(p.city)}"></label>
        <label class="f"><span class="lab">State</span><input id="svState" type="text" value="${esc(p.state)}"></label>
        <label class="f"><span class="lab">ZIP Code <i class="req">*</i></span><input id="svZip" type="text" value="${esc(p.zip)}"></label>
        <label class="f"><span class="lab">Email <i class="req">*</i></span><input id="svEmail" type="email" value="${esc(ex ? ex.email : "")}"></label>
        <label class="f"><span class="lab">Phone <i class="req">*</i></span><input id="svPhone" type="tel" value="${esc(ex ? ex.phone : "")}" placeholder="(718) 555-5555"></label>
        ${ex ? "" : `<label class="f"><span class="lab">Est. Credit Score</span><input id="svScore" type="number" min="400" max="850" value="700"></label>`}
      </div>
      <p class="hint">Required: first &amp; last name, either email or phone, address and zip code. <span class="demo-note">Demo tool — sample data only.</span></p>
      <div class="flex mt" style="justify-content:flex-end;gap:10px">
        <button class="btn btn--ghost" data-close>Cancel</button>
        <button class="btn btn--primary" id="svSave">${o.mode === "cobuyer" ? "Add as Co-Buyer" : ex ? "Update Customer" : "Create Customer"} →</button>
      </div>`;

    const normPhone = (s) => String(s || "").replace(/\D/g, "");

    /* single save tail for every path (direct, phone-link, phone-keep) */
    function finishSave(cust, wasExisting, warnMsg) {
      if (o.mode === "cobuyer") o.deal.coBuyerId = cust.id;
      Store.save(); done();
      toast(warnMsg || (o.mode === "cobuyer"
        ? "Co-buyer added — " + cust.first + " " + cust.last
        : wasExisting ? "Customer record updated from license" : "Customer created from license"));
      if (o.onDone) o.onDone(cust, p, m);
    }

    $("#svSave", body).onclick = () => {
      const val = (id) => $("#" + id, body).value.trim();
      /* blank optional dates are fine; a typed-but-invalid one must never
         silently erase a stored date on an existing record */
      const dobText = val("svDob"), expText = val("svDlExp");
      const dob = dobText ? dateISO(dobText) : "";
      const expires = expText ? dateISO(expText) : "";
      if ((dobText && !dob) || (expText && !expires)) return toast("Enter valid dates (MM/DD/YYYY)");
      const vals = {
        first: val("svFirst"), middle: val("svMiddle"), last: val("svLast"),
        dob, address: val("svAddr"), city: val("svCity"),
        state: val("svState"), zip: val("svZip"),
        email: val("svEmail"), phone: val("svPhone"),
        license: { number: val("svDl"), state: val("svDlState"), expires }
      };
      if (!vals.first || !vals.last) return toast("First and last name are required");
      if (!vals.email && !vals.phone) return toast("Provide an email or a phone number");
      if (!vals.address || !vals.zip) return toast("Address and zip code are required");
      /* read the score now — the phone-conflict screen replaces the form, taking #svScore with it */
      const scoreEl = $("#svScore", body);
      const score = (scoreEl && parseInt(scoreEl.value, 10)) || 700;
      /* compare on DIGITS, not the raw field: a digitless entry ("n/a") normalizes to
         "" and would otherwise match every customer who has no phone on file */
      const phoneDigits = normPhone(vals.phone);
      const mkNew = () => {
        const cust = Object.assign({ id: uid("c"), creditScore: score, createdAt: new Date().toISOString() }, vals);
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
        finishSave(mkNew(), false);
      }
    };

    /* the typed phone matches an existing record — link instead of duplicating, or keep as new */
    function renderPhoneConflict(dup, vals, mkNew) {
      const isPrimary = o.mode === "cobuyer" && dup.id === o.deal.customerId;
      body.innerHTML = `${dots("verify")}
        <div class="scan-banner scan-banner--warn">That phone number is on file for <b>${esc(dup.first + " " + dup.last)}</b>.</div>
        <p class="hint">Linking saves the scanned details onto that record instead of creating a duplicate profile.${isPrimary ? "<br><b>That's the primary buyer on this deal</b> — they can't also be the co-buyer, so linking isn't available here." : ""}</p>
        <div class="scan-actions">
          ${isPrimary ? "" : `<button class="btn btn--primary" data-plink>Link to that record</button>`}
          <button class="btn btn--ghost" data-pnew>Keep as a new customer</button>
        </div>`;
      const link = $("[data-plink]", body);
      if (link) link.onclick = () => { Object.assign(dup, vals); finishSave(dup, true); };
      $("[data-pnew]", body).onclick = () => finishSave(mkNew(), false);
    }
  }

  function renderVerifyTd(p) {
    const c = o.deal ? Store.customer(o.deal.customerId) : null;
    const mismatch = c && (c.first.toLowerCase() !== p.first.toLowerCase() || c.last.toLowerCase() !== p.last.toLowerCase());
    body.innerHTML = `${dots("verify")}
      ${mismatch
        ? `<div class="scan-banner scan-banner--warn"><b>Heads up:</b> the license reads <b>${esc(p.first + " " + p.last)}</b>, but this deal's customer is <b>${esc(c.first + " " + c.last)}</b>. Double-check you have the right guest — the name on file won't be changed here.</div>`
        : `<div class="scan-banner scan-banner--found"><b>License read${c ? " for " + esc(c.first + " " + c.last) : ""}.</b> Verify each field against the card before continuing.</div>`}
      <div class="fields">
        <label class="f"><span class="lab">License # <i class="req">*</i></span><input id="svDl" type="text" value="${esc(p.license.number)}"></label>
        <label class="f"><span class="lab">Issuing State</span><input id="svDlState" type="text" value="${esc(p.license.state)}"></label>
        <label class="f"><span class="lab">Expires</span><input id="svDlExp" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(dateUS(p.license.expires))}"></label>
        <label class="f"><span class="lab">Date of Birth</span><input id="svDob" type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" value="${esc(dateUS(p.dob))}"></label>
      </div>
      <div class="flex mt" style="justify-content:flex-end;gap:10px">
        <button class="btn btn--ghost" data-close>Cancel</button>
        <button class="btn btn--primary" id="svSave">Use These Details →</button>
      </div>`;
    $("#svSave", body).onclick = () => {
      const expText = $("#svDlExp", body).value.trim(), dobText = $("#svDob", body).value.trim();
      const expires = expText ? dateISO(expText) : "";
      const dob = dobText ? dateISO(dobText) : "";
      if ((expText && !expires) || (dobText && !dob)) return toast("Enter valid dates (MM/DD/YYYY)");
      const lic = { number: $("#svDl", body).value.trim(), state: $("#svDlState", body).value.trim(), expires };
      if (!lic.number) return toast("License number is required");
      /* on a name mismatch the card may belong to someone else — fill the agreement
         but never write that identity onto this customer's record */
      if (c && !mismatch) { c.dob = dob || c.dob; c.license = lic; Store.save(); }
      done();
      if (o.onDone) o.onDone(c, Object.assign({}, p, { license: lic }));
    };
  }

  renderFront();
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
route("vehicles/:id", ({ id }) => {
  const deal = id === "browse" ? null : Store.deal(id);
  if (id !== "browse" && !deal) return navigate("#/deals");

  renderChrome("Vehicle Search", deal ? dealTitle(deal) : "Browsing inventory",
    deal ? `<a class="btn btn--ghost btn--sm" href="#/discovery/${deal.id}">← Discovery</a>` : "");

  const makes = [...new Set(RIDE_PRICE_DATA.inventory.map(v => v.make))];
  const bodies = [...new Set(RIDE_PRICE_DATA.inventory.map(v => v.body))];

  view().innerHTML = `
    <div class="grid grid--side">
      <div class="panel" style="align-self:start">
        <div class="panel__head"><h2>Filters</h2><div class="right"><button class="btn btn--sm btn--ghost" id="resetF">Reset</button></div></div>
        <div class="panel__body">
          <label class="f"><span class="lab">Vehicle Type</span><select id="fType" data-ui="seg"><option value="">All</option><option>New</option><option>Used</option><option>CPO</option></select></label>
          <label class="f"><span class="lab">Make</span><select id="fMake" data-ui="seg"><option value="">All</option>${makes.map(m => `<option>${m}</option>`).join("")}</select></label>
          <label class="f"><span class="lab">Body Style</span><select id="fBody" data-ui="seg"><option value="">All</option>${bodies.map(b => `<option>${b}</option>`).join("")}</select></label>
          <label class="f"><span class="lab">Max Price</span><span class="minput"><input type="number" id="fPrice" placeholder="50,000" step="1000"></span></label>
          <label class="f"><span class="lab">Sort By</span><select id="fSort" data-ui="seg"><option value="hi">High → low</option><option value="lo">Low → high</option></select></label>
        </div>
      </div>
      <div id="vwrap"></div>
    </div>`;

  function render() {
    let list = RIDE_PRICE_DATA.inventory.slice();
    const t = $("#fType").value, m = $("#fMake").value, b = $("#fBody").value, p = parseFloat($("#fPrice").value);
    if (t) list = list.filter(v => v.type === t);
    if (m) list = list.filter(v => v.make === m);
    if (b) list = list.filter(v => v.body === b);
    if (p) list = list.filter(v => v.selling <= p);
    list.sort((a, bb) => $("#fSort").value === "hi" ? bb.selling - a.selling : a.selling - bb.selling);

    $("#vwrap").innerHTML = `<div class="vgrid">${list.map(v => `
      <div class="vcard">
        <div class="vimg" style="background:linear-gradient(140deg,hsl(${v.hue},42%,90%),hsl(${v.hue},38%,78%))">
          <span class="tag badge badge--type">${v.type}</span>${v.emoji}
        </div>
        <div class="vbody">
          <h3>${v.year} ${esc(v.make)} ${esc(v.model)}<br><span style="font-size:12.5px;font-weight:400">${esc(v.trim)}</span></h3>
          <div class="vmeta">Stock ${v.stock} · ${v.miles.toLocaleString()} mi · ${esc(v.ext)} · ${v.drive}</div>
          <div class="vprice"><b>${money0(v.selling)}</b>${v.msrp !== v.selling ? `<s>MSRP ${money0(v.msrp)}</s>` : ""}</div>
          <div class="flex"><button class="btn btn--sm btn--ghost" data-detail="${v.stock}">Details</button></div>
          <div class="journey">
            <button class="btn btn--primary btn--sm" data-journey="${v.stock}">Your Journey ▾</button>
            <div class="jmenu" id="jm-${v.stock}">
              <button data-act="test" data-stock="${v.stock}">Test Drive</button>
              <button data-act="trade" data-stock="${v.stock}">Trade Appraisal</button>
              <button data-act="calc" data-stock="${v.stock}">Calculate Payment</button>
              <button data-act="quote" data-stock="${v.stock}">Quote</button>
              <button data-act="savequote" data-stock="${v.stock}">Save Quote</button>
            </div>
          </div>
        </div>
      </div>`).join("") || `<p class="muted">No vehicles match those filters.</p>`}</div>`;

    $$("[data-journey]").forEach(btn => btn.onclick = (e) => {
      e.stopPropagation();
      const menu = $("#jm-" + btn.dataset.journey);
      $$(".jmenu.open").forEach(m2 => { if (m2 !== menu) m2.classList.remove("open"); });
      menu.classList.toggle("open");
    });
    $$("[data-detail]").forEach(btn => btn.onclick = () => {
      const v = Store.vehicle(btn.dataset.detail);
      modal(`${v.year} ${v.make} ${v.model} ${v.trim}`, `
        <div class="vimg" style="height:120px;border-radius:12px;background:linear-gradient(140deg,hsl(${v.hue},42%,90%),hsl(${v.hue},38%,78%));display:grid;place-items:center;font-size:56px">${v.emoji}</div>
        <ul class="lines mt">
          <li><span>MSRP</span><b class="amt">${money(v.msrp)}</b></li>
          <li><span>Selling Price</span><b class="amt">${money(v.selling)}</b></li>
          ${v.includedOptions ? `<li><span>Included Options</span><b class="amt">${money(v.includedOptions)}</b></li>` : ""}
        </ul>
        <p class="small mt">${esc(v.blurb)}</p>
        <p class="small">VIN ${v.vin} · ${v.engine} · ${v.mpg} MPG · ${esc(v.int)} interior · ${v.miles.toLocaleString()} miles</p>`,
        `<button class="btn btn--ghost" data-close>Close</button>`);
    });
    $$(".jmenu button").forEach(btn => btn.onclick = () => {
      const stock = btn.dataset.stock, act = btn.dataset.act;
      if (!deal) return toast("Start a customer visit first (Customers → Start Visit)");
      deal.stock = stock;
      if (deal.stage === "vehicle") deal.stage = act === "test" ? "testdrive" : act === "calc" ? "desking" : deal.stage;
      Store.save();
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
        const cust = Store.customer(deal.customerId);
        toast(`Quote saved in Ride Price — structure emailed to ${cust.email} (demo)`);
      }
      else toast("Quick Quote is for follow-up only — not during the client visit");
    });
  }
  ["fType", "fMake", "fBody", "fPrice", "fSort"].forEach(fid => $("#" + fid).onchange = render);
  $("#resetF").onclick = () => { ["fType", "fMake", "fBody", "fPrice"].forEach(fid => $("#" + fid).value = ""); render(); };
  /* persistent, registered once: {once:true} left reopened menus with no dismiss path */
  if (!document.jmenuCloser) {
    document.jmenuCloser = true;
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".journey") || e.target.closest(".jmenu button"))
        $$(".jmenu.open").forEach(m => m.classList.remove("open"));
    });
  }
  render();
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
    `<a class="btn btn--ghost btn--sm" href="#/vehicles/${deal.id}">← Vehicle Search</a>`);

  function phaseAuth() {
    view().innerHTML = `
      <div class="panel panel--navyhead">
        <div class="panel__head"><h2>Authorization of Electronic Signature</h2></div>
        <div class="panel__body">
          <p class="small">As part of the purchase/lease of this vehicle <b>${v.year} ${v.make} ${v.model} / ${v.vin} / ${v.stock}</b>, the documents checked below apply to this transaction.</p>
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
          <h3 style="color:var(--navy);margin:8px 0 2px">${v.year} ${v.make} ${v.model} ${esc(v.trim)}</h3>
          <p class="small">Stock ${v.stock} · started odometer ${v.miles.toLocaleString()} mi</p>
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
          <p>How did they like the <b>${v.year} ${v.make} ${v.model}</b>?</p>
          <div class="note note--wt" style="text-align:left"><span class="lab">Next move</span>Give a proper introduction to your team lead. If there is a trade, run the trade evaluation — otherwise go straight to Calculate Payment.</div>
          <div class="flex" style="justify-content:center;margin-top:18px">
            <a class="btn btn--primary" href="#/trade/${deal.id}">Trade Evaluation</a>
            <a class="btn btn--grad" href="#/desk/${deal.id}" id="toDesk">Calculate Payment →</a>
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
route("trade/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");

  renderChrome("Trade-In Evaluation", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/desk/${deal.id}">Skip → Calculate Payment</a>`);

  view().innerHTML = `
    <div class="panel panel--navyhead">
      <div class="panel__head"><h2>Interactive Trade Evaluation</h2></div>
      <div class="panel__body">
        <div class="note note--wt"><span class="lab">Set the stage</span>“We will obtain your vehicle's VIN and the actual mileage. This allows our evaluator to access all book values, auction values, and most importantly, true market values of vehicles for sale just like yours. We invite you to join us for an interactive walk-around of your vehicle and a short drive — after all, who knows your car better than you?”</div>
        <div class="fields">
          <label class="f"><span class="lab">Trade vehicle (year make model)</span><input type="text" id="tDesc" value="${esc(deal.trade.desc || "")}" placeholder="2018 Hyundai Tucson"></label>
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
    <p class="note">Transparency wins: keep documents reflecting current market value and any reconditioning needed. Get your manager involved when questions arise.</p>`;

  $("#evalBtn").onclick = () => {
    const year = parseInt($("#tYear").value, 10) || 2018;
    const miles = parseInt($("#tMiles").value, 10) || 60000;
    const cond = $("#tCond").value;
    const factor = { Excellent: 1.06, Good: 1.0, Fair: 0.9, Rough: 0.78 }[cond] || 1;
    const base = Math.max(1500, 30000 - (2026 - year) * 2100 - miles * 0.055);
    const value = Math.round(base * factor / 50) * 50;
    const payoff = parseFloat($("#tPayoff").value) || 0;
    deal.trade = Object.assign(deal.trade, {
      has: true, desc: $("#tDesc").value, year, miles, condition: cond, value, payoff,
      rebates: deal.trade.rebates || 0, applyTaxCredit: true
    });
    Store.save();
    const equity = value - payoff;
    $("#evalOut").innerHTML = `
      <div class="pay-hero" style="max-width:420px">
        <span class="lab">Evaluated Trade Value</span>
        <div class="amt">${money0(value)}</div>
        <span class="sub">Payoff ${money0(payoff)} → ${equity >= 0 ? "positive equity " + money0(equity) : "negative equity " + money0(equity)}</span>
      </div>
      <div class="flex mt"><a class="btn btn--grad" href="#/desk/${deal.id}" id="toDesk2">Calculate Payment →</a></div>`;
    $("#toDesk2").onclick = () => { if (["vehicle", "testdrive"].includes(deal.stage)) { deal.stage = "desking"; Store.save(); } };
    toast("Trade value saved to the deal");
  };
});

/* ============================================================
   VIEW: Calculate Payments (desking)
   ============================================================ */
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
    renderChrome("Base Payment Huddle", dealTitle(deal),
      h.done ? `<button class="btn btn--ghost btn--sm" id="huddleCancel">← Back to the pencil</button>` : "");
    view().innerHTML = `
      <div class="panel panel--navyhead" style="max-width:780px;margin:0 auto">
        <div class="panel__head"><h2>Touch the Desk — Post-Demo Team Lead Huddle</h2>
          <div class="right"><span class="badge badge--prog">before the pencil</span></div></div>
        <div class="panel__body">
          <label class="f"><span class="lab">1 · What was the answer to the trial close?</span>
            <input type="text" id="hTrial" value="${esc(h.trialClose || "")}" placeholder="e.g. “If the numbers make sense, we'd take it home today.”"></label>

          <span class="lab" style="display:block;font-size:12px;font-weight:700;color:var(--ink);margin-bottom:4px">2 · How are they paying for the car?</span>
          <div class="radio-row" id="hPayRow">
            ${Object.entries(DEAL_TYPES).map(([k, l]) => `<label><input type="radio" name="hPay" value="${k}" ${paying === k ? "checked" : ""}> ${l}</label>`).join("")}
          </div>
          <div class="note note--wt" id="hPayTrack"><span class="lab">Discovery question</span>${PAY_TRACKS[paying].q}<br>${PAY_TRACKS[paying].wt}</div>

          <div class="grid grid--2" style="margin-top:6px">
            <label class="opt-row">
              <span class="switch"><input type="checkbox" id="hTrade" ${h.trade != null ? (h.trade ? "checked" : "") : (deal.trade.has ? "checked" : "")}><span class="sl"></span></span>
              <span class="opt-row__label">3 · Trade evaluation needed${deal.trade.has && deal.trade.value ? ` — documented (${money0(deal.trade.value)})` : ""}</span>
            </label>
            <label class="opt-row">
              <span class="switch"><input type="checkbox" id="hStock" ${h.inStock === false ? "" : "checked"}><span class="sl"></span></span>
              <span class="opt-row__label">4 · Car in stock today — ${v.year} ${esc(v.make)} ${esc(v.model)} · ${v.stock}</span>
            </label>
          </div>

          <label class="f"><span class="lab">5 · Is there anything else?</span>
            <textarea id="hNotes" placeholder="Objections heard, must-haves, co-buyer, timing…">${esc(h.notes || "")}</textarea></label>

          <div class="note note--red">The Team Lead and Client Advisor will <b>“game plan”</b> the initial pencil together before any numbers are shown.</div>
          <div class="flex mt">
            ${deal.trade.has || h.trade ? `<a class="btn btn--ghost btn--sm" href="#/trade/${deal.id}">Trade evaluation →</a>` : ""}
            <div class="push"></div>
            <button class="btn btn--grad" id="hConfirm">🤝 Game plan the pencil →</button>
          </div>
        </div>
      </div>`;

    $$('#hPayRow input[name="hPay"]').forEach(r => r.onchange = () => {
      const t = PAY_TRACKS[r.value];
      $("#hPayTrack").innerHTML = `<span class="lab">Discovery question</span>${t.q}<br>${t.wt}`;
    });
    const cancel = $("#huddleCancel");
    if (cancel) cancel.onclick = () => render();
    $("#hConfirm").onclick = () => {
      const payingSel = ($('#hPayRow input[name="hPay"]:checked') || {}).value;
      if (!payingSel) return toast("Pick how they're paying — it sets the pencil");
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

  function render() {
    renderChrome("Calculate Payments", dealTitle(deal),
      `<button class="btn btn--ghost btn--sm" id="huddleBtn">🤝 Huddle</button>
       <a class="btn btn--ghost btn--sm" href="#/compare/${deal.id}">More… Compare Payments</a>
       <button class="btn btn--grad btn--sm" id="deskContinue">Continue →</button>`);
    $("#huddleBtn").onclick = () => renderHuddle();
    const r = RIDE_PRICE_CALC.calc(deal, v);
    const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
    const isCash = deal.dealType === "cash";
    const score = c.creditScore || 700;
    const pct = Math.min(100, Math.max(0, (score - 450) / (850 - 450) * 100));

    view().innerHTML = `
    <div class="grid grid--pencil">
      <div>
        <div class="panel">
          <div class="panel__head"><h2>Vehicle</h2>
            <div class="right"><label class="f" style="margin:0"><select id="dealType" data-ui="seg" title="Deal type">
              ${Object.entries(DEAL_TYPES).map(([k, l]) => `<option value="${k}" ${deal.dealType === k ? "selected" : ""}>${l}</option>`).join("")}
            </select></label></div>
          </div>
          <div class="panel__body">
            <div class="flex">
              <div class="vimg" style="width:110px;height:74px;border-radius:10px;background:linear-gradient(140deg,hsl(${v.hue},42%,90%),hsl(${v.hue},38%,78%));display:grid;place-items:center;font-size:38px">${v.emoji}</div>
              <div>
                <b style="color:var(--navy)">${v.year} ${v.make} ${v.model} | ${esc(v.trim)}</b>
                <div class="small">Stock ${v.stock} · VIN ${v.vin}</div>
              </div>
            </div>
            <ul class="lines mt">
              <li><span>MSRP</span><b class="amt">${money(v.msrp)}</b></li>
              <li><span>ⓘ Selling Price</span><b class="amt">${money(v.selling)}</b></li>
              <li><span>ⓘ Included Options</span><b class="amt">${money(v.includedOptions)}</b></li>
              <li><span>Accessories</span><b class="amt">${money(r.accessories)}</b></li>
              <li class="total"><span>ⓘ Your Price</span><b class="amt">${money(r.yourPrice)}</b></li>
              ${isLease ? `<li><span>Residual $</span><b class="amt">${money(r.residual)}</b></li>
              <li class="sub"><span>Residual %</span><b class="amt">${(r.residualPct * 100).toFixed(1)}%</b></li>` : ""}
            </ul>
          </div>
        </div>

        <div class="panel">
          <div class="panel__head"><h2>Customized Options — Accessories</h2></div>
          <div class="panel__body">
            <div class="fields fields--tight">
              ${RIDE_PRICE_DATA.accessories.map(a => `<label class="opt-row">
                <input type="checkbox" data-acc="${a.id}" ${deal.desk.accessories.includes(a.id) ? "checked" : ""}><span class="opt-row__label">${a.name}</span><span class="opt-row__val">${money0(a.price)}</span></label>`).join("")}
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__head"><h2>Trade &amp; Rebate</h2>
            <div class="right"><a class="btn btn--sm btn--ghost" href="#/trade/${deal.id}">Import Trade</a></div></div>
          <div class="panel__body">
            <div class="fields fields--tight">
              <label class="f"><span class="lab">Trade Value</span><span class="minput"><input type="number" id="tradeVal" value="${esc(String(deal.trade.value || 0))}" step="100"></span></label>
              <label class="f"><span class="lab">Trade Payoff</span><span class="minput"><input type="number" id="tradePay" value="${esc(String(deal.trade.payoff || 0))}" step="100"></span></label>
              <label class="f"><span class="lab">ⓘ Rebates</span><span class="minput"><input type="number" id="rebates" value="${esc(String(deal.trade.rebates || 0))}" step="100"></span></label>
              <label class="opt-row" style="align-self:end"><span class="switch"><input type="checkbox" id="taxCredit" ${deal.trade.applyTaxCredit ? "checked" : ""}><span class="sl"></span></span><span class="opt-row__label">Apply Tax Credit</span></label>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="panel">
          <div class="panel__head"><h2>Payment Terms</h2></div>
          <div class="panel__body">
            ${isCash ? "" : isLease ? `
              <div class="fields fields--tight">
                <label class="f"><span class="lab">Term</span><select id="leaseTerm" data-ui="seg">${RIDE_PRICE_DATA.leaseTerms.map(t => `<option ${deal.desk.leaseTerm === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
                <label class="f"><span class="lab">Miles Per Year</span><select id="mpy" data-ui="seg">${RIDE_PRICE_DATA.milesOptions.map(m2 => `<option value="${m2}" ${deal.desk.milesPerYear === m2 ? "selected" : ""}>${m2 / 1000}k</option>`).join("")}</select></label>
                ${deal.dealType === "lease" ? `<label class="f"><span class="lab">Due At Signing</span><span class="minput"><input type="number" id="das" value="${esc(String(deal.desk.dueAtSigning))}" step="100"></span></label>` : ""}
              </div>
              <ul class="lines small">
                <li><span>Lease Factor</span><b class="amt">${(deal.dealType === "onepay" ? Math.max(0.00001, deal.desk.leaseFactor - 0.0004) : deal.desk.leaseFactor).toFixed(5)}</b></li>
                <li><span>Acquisition Fee</span><b class="amt">${money(RIDE_PRICE_DATA.leaseFees.acquisition)}</b></li>
                <li><span>Security Deposit</span><b class="amt">$0.00</b></li>
              </ul>` : `
              <div class="fields fields--tight">
                <label class="f"><span class="lab">Term</span><select id="finTerm" data-ui="seg">${RIDE_PRICE_DATA.financeTerms.map(t => `<option ${deal.desk.term === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
                <label class="f"><span class="lab">APR %</span><input type="number" id="apr" value="${deal.desk.apr}" step="0.1"></label>
                <label class="f"><span class="lab">Down Payment</span><span class="minput"><input type="number" id="down" value="${esc(String(deal.desk.downPayment))}" step="100"></span></label>
                <label class="f"><span class="lab">Days to First Payment</span><select id="dtf" data-ui="seg">${[30, 45, 60].map(d2 => `<option ${deal.desk.daysToFirst === d2 ? "selected" : ""}>${d2}</option>`).join("")}</select></label>
              </div>`}
            <div class="pay-hero mt">
              ${isCash ? `<span class="lab">Total Due</span><div class="amt">${money(r.totalDue)}</div><span class="sub">cash purchase</span>`
              : deal.dealType === "onepay" ? `<span class="lab">Due At Signing — One Pay</span><div class="amt">${money(r.onePayTotal)}</div><span class="sub">${r.term} months · ${r.miles.toLocaleString()} mi/yr</span>`
              : `<span class="lab">Monthly Payment</span><div class="amt">${money(r.payment)}</div>
                 <span class="sub">${isLease ? `${r.term} mo · ${r.miles.toLocaleString()} mi/yr · ${money(deal.desk.dueAtSigning)} due at signing` : `${r.term} mo @ ${r.apr}% · ${money(deal.desk.downPayment)} down`}</span>`}
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel__head"><h2>Estimated Credit Score</h2></div>
          <div class="panel__body">
            <div class="credit-bar">
              <div class="bar"><div class="dot" style="left:clamp(10px, ${pct}%, calc(100% - 10px))"></div></div>
              <div class="cap"><span>450</span><b style="color:var(--navy)">${score} · ${RIDE_PRICE_CALC.creditTier(score).label}</b><span>850</span></div>
            </div>
            <input type="range" min="450" max="850" step="5" value="${score}" id="scoreRange" style="width:100%">
            <p class="hint">Based on the credit the client provided — never assume.</p>
          </div>
        </div>

        <div class="panel">
          <div class="panel__head"><h2>Taxes &amp; Fees</h2></div>
          <div class="panel__body">
            <ul class="lines small">
              ${r.taxes.rows.map(t => `<li><span>${t.label}</span><b class="amt">${money(t.amount)}</b></li>`).join("")}
              <li><span>Total Fees</span><b class="amt">${money(RIDE_PRICE_CALC.totalFees())}</b></li>
              ${!isCash && !isLease ? `<li class="total"><span>Amount Financed</span><b class="amt">${money(r.amountFinanced)}</b></li>` : ""}
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="note note--wt"><span class="lab">Base payment word track</span>${wordTrack(r)}</div>
    <p class="note note--red">🤫 Stop talking! Wait for your client to respond.</p>`;

    /* bindings */
    $("#dealType").onchange = (e) => { deal.dealType = e.target.value; Store.save(); render(); };
    $$("[data-acc]").forEach(cb => cb.onchange = () => {
      deal.desk.accessories = $$("[data-acc]").filter(x => x.checked).map(x => x.dataset.acc);
      Store.save(); render();
    });
    const bind = (idSel, fn) => { const el2 = $(idSel); if (el2) el2.onchange = (e) => { fn(e); Store.save(); render(); }; };
    bind("#tradeVal", e => deal.trade.value = parseFloat(e.target.value) || 0);
    bind("#tradePay", e => deal.trade.payoff = parseFloat(e.target.value) || 0);
    bind("#rebates", e => deal.trade.rebates = parseFloat(e.target.value) || 0);
    bind("#taxCredit", e => deal.trade.applyTaxCredit = e.target.checked);
    bind("#finTerm", e => deal.desk.term = parseInt(e.target.value, 10));
    bind("#apr", e => deal.desk.apr = parseFloat(e.target.value) || 0);
    bind("#down", e => deal.desk.downPayment = parseFloat(e.target.value) || 0);
    bind("#dtf", e => deal.desk.daysToFirst = parseInt(e.target.value, 10));
    bind("#leaseTerm", e => deal.desk.leaseTerm = parseInt(e.target.value, 10));
    bind("#mpy", e => deal.desk.milesPerYear = parseInt(e.target.value, 10));
    bind("#das", e => deal.desk.dueAtSigning = parseFloat(e.target.value) || 0);
    bind("#scoreRange", e => {
      c.creditScore = parseInt(e.target.value, 10);
      const tier = RIDE_PRICE_CALC.creditTier(c.creditScore);
      deal.desk.apr = tier.agreedApr; deal.desk.leaseFactor = tier.leaseFactor;
    });
    $("#deskContinue").onclick = () => {
      deal.basePayment = { signedAt: null, snapshot: RIDE_PRICE_CALC.calc(deal, v) };
      if (["desking"].includes(deal.stage)) deal.stage = "signed";
      Store.save();
      navigate(`#/agreement/${deal.id}`);
    };
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

  renderChrome("Payment Comparison", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/desk/${deal.id}">← Calculate Payments</a>`);

  const sides = [deal.dealType === "lease" ? "finance" : deal.dealType, deal.dealType === "lease" ? "lease" : "lease"];

  function colHtml(side, i) {
    const clone = JSON.parse(JSON.stringify(deal));
    clone.dealType = side;
    const r = RIDE_PRICE_CALC.calc(clone, v);
    const head = side === "cash" ? money(r.totalDue) : side === "onepay" ? money(r.onePayTotal) : money(r.payment);
    return `<div class="panel">
      <div class="panel__head"><h2>Payment: ${head}</h2>
        <div class="right"><select data-side="${i}" data-ui="dd" title="Deal type">${Object.entries(DEAL_TYPES).map(([k, l]) => `<option value="${k}" ${side === k ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
      <div class="panel__body">
        <ul class="lines small">
          <li><span>Vehicle Price</span><b class="amt">${money(r.yourPrice)}</b></li>
          <li><span>Accessories</span><b class="amt">${money(r.accessories)}</b></li>
          <li><span>Rebate</span><b class="amt">${money(deal.trade.rebates || 0)}</b></li>
          <li><span>Trade Allowance</span><b class="amt">${money(deal.trade.value || 0)}</b></li>
          <li><span>Trade Payoff</span><b class="amt">${money(deal.trade.payoff || 0)}</b></li>
          <li><span>Total Fees</span><b class="amt">${money(RIDE_PRICE_CALC.totalFees())}</b></li>
          ${side === "lease" || side === "onepay"
            ? `<li><span>Miles Per Year</span><b class="amt">${(deal.desk.milesPerYear).toLocaleString()}</b></li>
               <li><span>Residual</span><b class="amt">${money(r.residual)}</b></li>
               <li><span>Lease Factor</span><b class="amt">${r.factor.toFixed(5)}</b></li>
               <li><span>Term</span><b class="amt">${r.term} months</b></li>`
            : side === "cash" ? `<li><span>Taxes</span><b class="amt">${money(r.taxes.total)}</b></li>`
            : `<li><span>Cash Down</span><b class="amt">${money(deal.desk.downPayment)}</b></li>
               <li><span>APR</span><b class="amt">${deal.desk.apr}%</b></li>
               <li><span>Term</span><b class="amt">${r.term} months</b></li>`}
        </ul>
        <button class="btn btn--primary mt" data-save="${side}" style="width:100%;justify-content:center">Save — select this deal type</button>
      </div>
    </div>`;
  }

  function render() {
    view().innerHTML = `
      <p class="note">Rebates and cash down <b>will not carry over</b> when changing deal types.</p>
      <div class="grid grid--2">${sides.map((s, i) => colHtml(s, i)).join("")}</div>`;
    $$("[data-side]").forEach(sel => sel.onchange = (e) => { sides[+sel.dataset.side] = e.target.value; render(); });
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

  renderChrome("Base Payment — Terms of Agreement", dealTitle(deal),
    `<a class="btn btn--danger btn--sm" href="#/desk/${deal.id}" id="redesk">Redesk Payment</a>
     ${signed ? `<a class="btn btn--grad btn--sm" href="#/credit/${deal.id}">Continue → Credit Application</a>` : ""}`);

  view().innerHTML = `
    <div class="doc">
      <div class="doc-brand"><span style="font-size:22px;font-weight:800;font-style:italic;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent">Ride</span><span style="font-size:10px;font-weight:700;letter-spacing:2px;color:var(--navy)">PRICE</span></div>
      <h2>Customer Acknowledgement of Basic Terms of Agreement</h2>
      <div class="two">
        <div><b>${esc(c.first)} ${esc(c.last)}</b><br>${esc(c.phone)}<br>${esc(c.email)}<br>${esc(c.address)}, ${esc(c.city)}, ${esc(c.state)} ${esc(c.zip)}</div>
        <div class="right"><b>${esc(Store.s.advisor)} — ${RIDE_PRICE_DATA.dealership.name}</b><br>${RIDE_PRICE_DATA.dealership.phone}<br>${RIDE_PRICE_DATA.dealership.address}<br>Date: ${today()}</div>
      </div>
      <ul class="lines">
        <li><span>Deal Type</span><b class="amt">${DEAL_TYPES[deal.dealType]}</b></li>
        ${!isCash && !isLease ? `<li><span>Term / APR</span><b class="amt">${r.term} months / ${r.apr}%</b></li>` : ""}
        ${isLease ? `<li><span>Term / Miles</span><b class="amt">${r.term} months / ${r.miles.toLocaleString()} mi-yr</b></li>` : ""}
        <li><span>MSRP</span><b class="amt">${money(v.msrp)}</b></li>
        <li><span>Selling Price (incl. options)</span><b class="amt">${money(v.selling + v.includedOptions)}</b></li>
        <li><span>Accessories</span><b class="amt">${money(r.accessories)}</b></li>
        <li><span><b>Your Price</b></span><b class="amt">${money(r.yourPrice)}</b></li>
        ${deal.trade.rebates ? `<li class="neg"><span>Rebates</span><b class="amt">−${money(deal.trade.rebates)}</b></li>` : ""}
        ${deal.trade.value ? `<li><span>Trade Value / Payoff</span><b class="amt">${money(deal.trade.value)} / ${money(deal.trade.payoff)}</b></li>` : ""}
        ${isLease ? `<li><span>Residual (lease end value)</span><b class="amt">${money(r.residual)}</b></li>` : ""}
        <li><span>Total Taxes &amp; Fees</span><b class="amt">${money((r.taxes.total || 0) + RIDE_PRICE_CALC.totalFees())}</b></li>
        ${!isCash && !isLease ? `<li><span>Down Payment</span><b class="amt">${money(deal.desk.downPayment)}</b></li>
          <li><span>Total Amount Financed</span><b class="amt">${money(r.amountFinanced)}</b></li>
          <li class="total"><span>${r.term} Monthly Payments (inc. taxes)</span><b class="amt">${money(r.payment)}</b></li>` : ""}
        ${deal.dealType === "lease" ? `<li><span>Due At Signing</span><b class="amt">${money(deal.desk.dueAtSigning)}</b></li>
          <li class="total"><span>${r.term} Monthly Payments (inc. taxes)</span><b class="amt">${money(r.payment)}</b></li>` : ""}
        ${deal.dealType === "onepay" ? `<li class="total"><span>One-Pay Total Due At Signing</span><b class="amt">${money(r.onePayTotal)}</b></li>` : ""}
        ${isCash ? `<li class="total"><span>Total Due</span><b class="amt">${money(r.totalDue)}</b></li>` : ""}
      </ul>
      <p class="fine">I/We have agreed to an approximate base payment structure per the terms above. I/We understand these payment terms are based on a standard rate and are subject to the dealership's ability to obtain approval of the lending institution — the rate may be higher or lower based on my credit score and other factors lenders use in approving financing. <b>This is a ballpark structure, not a purchase.</b></p>
      <div class="sig-line">
        ${signed
          ? `<div class="sig-box">${esc(deal.basePayment.sigName || c.first + " " + c.last)}</div><p class="small">Signed ${new Date(deal.basePayment.signedAt).toLocaleString()}</p>`
          : `<label class="f"><span class="lab">Type name to sign</span><input type="text" id="bpSig" value="${esc(c.first + " " + c.last)}"></label>
             <div class="sig-box" id="bpPreview">${esc(c.first + " " + c.last)}</div>`}
      </div>
    </div>
    <div class="flex mt" style="max-width:760px;margin:16px auto 0">
      ${signed
        ? `<a class="btn btn--ghost" href="#/print/${deal.id}/agreement">🖨 Print for deal folder</a>
           <div class="push"></div><a class="btn btn--grad" href="#/credit/${deal.id}">Continue → Credit Application</a>`
        : `<div class="push"></div><button class="btn btn--grad" id="signBp">✍ Sign Base Payment Agreement</button>`}
    </div>
    ${signed ? `<p class="note" style="max-width:760px;margin:14px auto">Print this and put it in the deal folder. <b>Redesk Payment</b> voids this signed agreement and reopens the desking screen.</p>` : ""}`;

  const sig = $("#bpSig");
  if (sig) sig.oninput = (e) => { $("#bpPreview").textContent = e.target.value; };
  const signBtn = $("#signBp");
  if (signBtn) signBtn.onclick = () => {
    deal.basePayment = { signedAt: new Date().toISOString(), sigName: $("#bpSig").value, snapshot: r };
    deal.stage = "credit"; Store.save(); router();
    toast("Base payment signed — client agreed to the ballpark structure");
  };
  $("#redesk").onclick = (e) => {
    if (!signed) {
      deal.basePayment = null;
      if (["signed", "credit"].includes(deal.stage)) deal.stage = "desking";
      Store.save();
      return;
    }
    e.preventDefault();
    confirmModal("Redesk Payment", "Redesking voids the signed base payment agreement — the client will need to sign the new structure.", "Void & redesk", () => {
      deal.basePayment = null;
      if (["signed", "credit"].includes(deal.stage)) deal.stage = "desking";
      Store.save(); navigate(`#/desk/${deal.id}`);
    });
  };
});

/* ============================================================
   VIEW: Lending Lane — credit application
   ============================================================ */
route("credit/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  const c = Store.customer(deal.customerId);
  const app = deal.creditApp;

  renderChrome("Lending Lane — Credit Application", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/agreement/${deal.id}">← Base Payment</a>`);

  if (app && app.approved) return renderApproved();

  /* resolve the record, not just the id — a dangling coBuyerId must behave as
     "no co-buyer" here exactly as it does in dealTitle() and the submit guard */
  const cbRec = () => deal.coBuyerId ? Store.customer(deal.coBuyerId) : null;

  const v = deal.stock ? Store.vehicle(deal.stock) : null;
  const r = v ? RIDE_PRICE_CALC.calc(deal, v) : null;
  const scanned = !!(c.dob && c.license && c.license.number);

  view().innerHTML = `
    <div class="panel panel--navyhead">
      <div class="panel__head"><h2>Ride Price Credit Application</h2>
        <div class="right"><span class="chip chip--demo">DEMO — sample data only, never real SSNs</span></div></div>
      <div class="panel__body">
        <div class="fields">
          <label class="f"><span class="lab">Credit Type <i class="req">*</i></span><select id="caType" data-ui="seg">
            ${["Retail", "Lease", "Balloon"].map(t => `<option ${(deal.dealType === "lease" || deal.dealType === "onepay" ? "Lease" : "Retail") === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
          <label class="f"><span class="lab">Primary Use</span><select id="caUse" data-ui="seg">
            <option selected>Personal, family or household</option><option>Business or commercial</option></select></label>
        </div>
        <div class="radio-row">
          <label><input type="radio" name="atype" id="atypeInd" ${cbRec() ? "" : "checked"}><span><b>Individually:</b> applying for individual credit in your own name, relying on your own income and assets.</span></label>
          <label><input type="radio" name="atype" id="atypeJoint" ${cbRec() ? "checked" : ""}><span><b>With another person:</b> in accordance with Regulation B, you certify that you are applying for joint credit.</span></label>
        </div>

        <h3 style="font-size:13px;text-transform:uppercase;color:var(--navy);margin:14px 0 6px">Applicant
          ${scanned ? `<span class="badge badge--approved" style="margin-left:8px">✓ filled from license scan</span>` : ""}</h3>
        <div class="fields">
          <label class="f"><span class="lab">First Name <i class="req">*</i></span><input type="text" id="caFirst" data-req="First Name" value="${esc(c.first)}"></label>
          <label class="f"><span class="lab">Middle</span><input type="text" id="caMiddle" value="${esc(c.middle || "")}"></label>
          <label class="f"><span class="lab">Last Name <i class="req">*</i></span><input type="text" id="caLast" data-req="Last Name" value="${esc(c.last)}"></label>
          <label class="f"><span class="lab">Date of Birth <i class="req">*</i></span><input type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" id="caDob" data-req="Date of Birth" value="${esc(dateUS(c.dob || ""))}"></label>
          <label class="f"><span class="lab">SSN <i class="req">*</i></span><input type="text" id="caSsn" data-req="SSN" data-ssn inputmode="numeric" maxlength="11" placeholder="000-00-0000"></label>
          <label class="f"><span class="lab">Driver License <i class="req">*</i></span><input type="text" id="caDl" data-req="Driver License" value="${esc((c.license && c.license.number) || deal.testDrive.license || "")}"></label>
          <label class="f"><span class="lab">Phone <i class="req">*</i></span><input type="tel" id="caPhone" data-req="Phone" value="${esc(c.phone)}"></label>
          <label class="f"><span class="lab">Email <i class="req">*</i></span><input type="email" id="caEmail" data-req="Email" value="${esc(c.email)}"></label>
          <label class="f"><span class="lab">Marital Status</span><select id="caMar" data-ui="seg"><option value="" data-ph selected hidden>Select Status</option><option>Married</option><option>Unmarried</option><option>Separated</option></select></label>
        </div>

        <h3 style="font-size:13px;text-transform:uppercase;color:var(--navy);margin:14px 0 6px">Residence</h3>
        <div class="fields">
          <label class="f"><span class="lab">Address <i class="req">*</i></span><input type="text" id="caAddr" data-req="Address" value="${esc(c.address)}"></label>
          <label class="f"><span class="lab">ZIP Code</span><input type="text" id="caZip" inputmode="numeric" maxlength="5" data-zip data-zip-city="caCity" data-zip-state="caState" value="${esc(c.zip)}"></label>
          <label class="f"><span class="lab">City</span><input type="text" id="caCity" value="${esc(c.city)}"></label>
          <label class="f"><span class="lab">State</span><input type="text" id="caState" value="${esc(c.state)}"></label>
          <label class="f"><span class="lab">Residential Status <i class="req">*</i></span><select id="caHouse" data-ui="seg"><option>Own</option><option>Rent</option><option>Buying</option><option>Parents</option><option>Other</option></select></label>
          <label class="f"><span class="lab">Monthly Rent / Mortgage Payment <i class="req">*</i></span><span class="minput"><input type="number" id="caHousePmt" data-req="Monthly Rent/Mortgage" placeholder="1,800" step="50"></span></label>
          <label class="f"><span class="lab">Time at Address (years) <i class="req">*</i></span><input type="number" id="caResYrs" data-req="Time at Address" value="3" min="0" step="0.5"></label>
        </div>
        <div id="prevAddrWrap"></div>
        <label class="opt-row" style="margin-top:4px"><span class="switch"><input type="checkbox" id="caMailDiff"><span class="sl"></span></span><span class="opt-row__label">Mailing address is different</span></label>
        <div id="mailWrap"></div>

        <h3 style="font-size:13px;text-transform:uppercase;color:var(--navy);margin:14px 0 6px">Employment &amp; Income</h3>
        <div class="fields">
          <label class="f"><span class="lab">Employer <i class="req">*</i></span><input type="text" id="caEmp" data-req="Employer" placeholder="Employer name"></label>
          <label class="f"><span class="lab">Occupation <i class="req">*</i></span><input type="text" id="caOcc" data-req="Occupation" placeholder="e.g. Project manager"></label>
          <label class="f"><span class="lab">Employer Phone</span><input type="tel" id="caEmpPhone" placeholder="(000) 000-0000"></label>
          <label class="f"><span class="lab">Time at Employer (years) <i class="req">*</i></span><input type="number" id="caEmpYrs" data-req="Time at Employer" value="4" min="0" step="0.5"></label>
          <label class="f"><span class="lab">Gross Monthly Income <i class="req">*</i></span><span class="minput"><input type="number" id="caIncome" data-req="Gross Monthly Income" placeholder="6,500" step="100"></span></label>
          <label class="f"><span class="lab">Other Monthly Income</span><span class="minput"><input type="number" id="caOther" placeholder="0" step="100"></span></label>
          <label class="f"><span class="lab">Other Income Source</span><input type="text" id="caOtherSrc" placeholder="e.g. rental income"></label>
          <label class="opt-row" style="align-self:end"><span class="switch"><input type="checkbox" id="caSelfEmp"><span class="sl"></span></span><span class="opt-row__label">Self-Employed</span></label>
        </div>
        <div id="prevEmpWrap"></div>

        <h3 style="font-size:13px;text-transform:uppercase;color:var(--navy);margin:14px 0 6px">Disclosures</h3>
        ${[["dBk", "Filed bankruptcy?"], ["dAlias", "Obtained credit under another name?"], ["dRepo", "Had a vehicle repossessed?"]].map(([did, q]) => `
          <label class="opt-row"><span class="switch"><input type="checkbox" id="${did}" data-disc><span class="sl"></span></span><span class="opt-row__label">${q}</span></label>
          <div id="${did}Wrap"></div>`).join("")}

        <div id="coWrap"></div>

        <div class="mt"><button type="button" class="btn btn--ghost btn--sm" id="refsToggle">＋ Optional — bank &amp; references</button></div>
        <div id="refsWrap"></div>
      </div>
    </div>

    ${r ? `
    <div class="panel">
      <div class="panel__head"><h2>Synced From Your Worksheet</h2><div class="right"><a class="btn btn--ghost btn--sm" href="#/desk/${deal.id}">Edit in desking</a></div></div>
      <div class="panel__body">
        <ul class="lines small">
          <li><span>Vehicle</span><b class="amt amt--wrap">${v.year} ${esc(v.make)} ${esc(v.model)} · ${esc(v.stock)}</b></li>
          <li><span>MSRP</span><b class="amt">${money(v.msrp)}</b></li>
          <li><span>Cash Price</span><b class="amt">${money(r.yourPrice)}</b></li>
          <li><span>Sales Tax</span><b class="amt">${money(r.taxes.total || 0)}</b></li>
          <li><span>Cash Down</span><b class="amt">${money(deal.desk.downPayment || 0)}</b></li>
          <li><span>Trade-In Amount</span><b class="amt">${money(deal.trade.value || 0)}</b></li>
          ${deal.dealType === "cash" ? `<li class="total"><span>Total Due</span><b class="amt">${money(r.totalDue)}</b></li>`
            : `<li class="total"><span>Amount Financed</span><b class="amt">${money(r.amountFinanced)}</b></li>
               <li class="sub"><span>Term / Estimated Payment</span><b class="amt">${r.term} mo · ${money(r.payment)}</b></li>`}
        </ul>
      </div>
    </div>` : ""}

    <div class="panel">
      <div class="panel__body">
        <label class="opt-row" style="margin-bottom:10px">
          <input type="checkbox" id="caConsent">
          <span class="opt-row__label">I understand that checking this box constitutes my electronic signature, and I authorize Ride Price to obtain credit bureau reports in connection with this application. <span class="demo-note">Demo — no real inquiry ever occurs.</span></span></label>
        <div class="right"><button class="btn btn--grad" id="caSubmit">Submit Application</button></div>
      </div>
    </div>
`;

  /* co-buyer section: identity only, prefilled from their record (never from typed
     state — the record is the source of truth, same as the primary's fields above).
     Individual REMOVES the section rather than hiding it: submit validates every
     [data-req] on the page, so hidden required fields would block it invisibly. */
  function coHtml() {
    const cb = cbRec();
    if (!cb) return `
      <h3 style="font-size:13px;text-transform:uppercase;color:var(--navy);margin:14px 0 6px">Co-Buyer</h3>
      <div class="scan-banner scan-banner--new"><b>No co-buyer on this deal yet.</b> Scan their license, or attach an existing customer.</div>
      <div class="flex" style="gap:10px;flex-wrap:wrap">
        <button type="button" class="btn btn--primary btn--sm" id="caCoScan">🪪 Scan co-buyer license</button>
        <button type="button" class="btn btn--ghost btn--sm" data-buyers="${esc(deal.id)}">Choose existing customer</button>
      </div>`;
    return `
      <h3 style="font-size:13px;text-transform:uppercase;color:var(--navy);margin:14px 0 6px">Co-Applicant Information</h3>
      <div class="fields">
        <label class="f" style="grid-column:1/-1"><span class="lab">This Person Is A</span><select id="caCoRel" data-ui="seg">
          <option selected>Joint Applicant</option><option>Spousal Joint Applicant</option><option>Co-signer / Guarantor</option></select></label>
        <label class="f"><span class="lab">First Name <i class="req">*</i></span><input type="text" id="coFirst" data-req="Co-Buyer First Name" value="${esc(cb.first)}"></label>
        <label class="f"><span class="lab">Last Name <i class="req">*</i></span><input type="text" id="coLast" data-req="Co-Buyer Last Name" value="${esc(cb.last)}"></label>
        <label class="f"><span class="lab">Date of Birth <i class="req">*</i></span><input type="text" data-date inputmode="numeric" maxlength="10" placeholder="MM/DD/YYYY" id="coDob" data-req="Co-Buyer Date of Birth" value="${esc(dateUS(cb.dob || ""))}"></label>
        <label class="f"><span class="lab">Driver License <i class="req">*</i></span><input type="text" id="coDl" data-req="Co-Buyer Driver License" value="${esc((cb.license && cb.license.number) || "")}"></label>
        <label class="f"><span class="lab">Address</span><input type="text" id="coAddr" value="${esc(cb.address || "")}"></label>
        <label class="f"><span class="lab">ZIP Code</span><input type="text" id="coZip" inputmode="numeric" maxlength="5" data-zip data-zip-city="coCity" data-zip-state="coState" value="${esc(cb.zip || "")}"></label>
        <label class="f"><span class="lab">City</span><input type="text" id="coCity" value="${esc(cb.city || "")}"></label>
        <label class="f"><span class="lab">State</span><input type="text" id="coState" value="${esc(cb.state || "")}"></label>
      </div>
      <p class="hint">Prefilled from <b>${esc(cb.first + " " + cb.last)}</b>'s record · <a href="#" data-buyers="${esc(deal.id)}">manage buyers</a>. Employment and income go on the dealership's paper form.</p>`;
  }
  function renderCoWrap() {
    $("#coWrap").innerHTML = $("#atypeJoint").checked ? coHtml() : "";
    const sc = $("#caCoScan");
    if (sc) sc.onclick = () => openScanFlow({ mode: "cobuyer", deal, onDone: () => router() });
  }
  $("#atypeInd").onchange = renderCoWrap;
  $("#atypeJoint").onchange = renderCoWrap;
  renderCoWrap();

  /* conditional sections render into the DOM only while active — submit
     validates every [data-req] on the page, so a hidden required field
     would block it invisibly (same invariant as the co-buyer section) */
  const under3 = (id2) => { const n = parseFloat($("#" + id2).value); return !isNaN(n) && n < 3; };
  function renderPrevAddr() {
    $("#prevAddrWrap").innerHTML = under3("caResYrs") ? `<div class="fields">
      <label class="f"><span class="lab">Previous Full Address (under 3 years at current) <i class="req">*</i></span>
        <input type="text" id="caPrevAddr" data-req="Previous Address" placeholder="Street, city, state, ZIP"></label></div>` : "";
  }
  function renderPrevEmp() {
    $("#prevEmpWrap").innerHTML = under3("caEmpYrs") ? `<div class="fields">
      <label class="f"><span class="lab">Previous Employer (under 3 years at current) <i class="req">*</i></span>
        <input type="text" id="caPrevEmp" data-req="Previous Employer"></label>
      <label class="f"><span class="lab">Previous Occupation</span><input type="text" id="caPrevOcc"></label>
      <label class="f"><span class="lab">Years There</span><input type="number" id="caPrevEmpYrs" min="0" step="0.5"></label></div>` : "";
  }
  $("#caResYrs").oninput = renderPrevAddr;
  $("#caEmpYrs").oninput = renderPrevEmp;
  renderPrevAddr(); renderPrevEmp();

  $("#caMailDiff").onchange = () => {
    $("#mailWrap").innerHTML = $("#caMailDiff").checked ? `<div class="fields mt">
      <label class="f"><span class="lab">Mailing Address</span><input type="text" id="caMailAddr"></label>
      <label class="f"><span class="lab">ZIP Code</span><input type="text" id="caMailZip" inputmode="numeric" maxlength="5" data-zip data-zip-city="caMailCity" data-zip-state="caMailState"></label>
      <label class="f"><span class="lab">City</span><input type="text" id="caMailCity"></label>
      <label class="f"><span class="lab">State</span><input type="text" id="caMailState"></label></div>` : "";
  };

  $$("[data-disc]").forEach(sw => sw.onchange = () => {
    $("#" + sw.id + "Wrap").innerHTML = sw.checked ? `<label class="f" style="margin:2px 0 10px"><span class="lab">Please explain <i class="req">*</i></span>
      <input type="text" id="${sw.id}Note" data-req="Disclosure explanation"></label>` : "";
  });

  $("#refsToggle").onclick = () => {
    const open = !$("#refsWrap").innerHTML;
    $("#refsToggle").textContent = open ? "− Optional — bank & references" : "＋ Optional — bank & references";
    $("#refsWrap").innerHTML = open ? `<div class="fields mt">
      <label class="f"><span class="lab">Bank Reference</span><input type="text" id="refBank" placeholder="Bank or credit union name"></label>
      <label class="f"><span class="lab">Account Type</span><select id="refAcctType" data-ui="seg"><option value="" data-ph selected hidden>—</option><option>Checking</option><option>Savings</option></select></label>
      <label class="f"><span class="lab">Nearest Relative Not Living With You</span><input type="text" id="refKinName" placeholder="Name"></label>
      <label class="f"><span class="lab">Relative's Phone</span><input type="tel" id="refKinPhone" placeholder="(000) 000-0000"></label>
      <label class="f"><span class="lab">Relationship</span><input type="text" id="refKinRel" placeholder="e.g. sister"></label>
      <label class="f"><span class="lab">Personal Reference</span><input type="text" id="refP1" placeholder="Name · phone"></label>
      <label class="f"><span class="lab">Personal Reference 2</span><input type="text" id="refP2" placeholder="Name · phone"></label>
    </div>` : "";
  };

  /* SSN mask: digits only, dashed as XXX-XX-XXXX while typing */
  $("#caSsn").oninput = (e) => {
    const dg = e.target.value.replace(/\D/g, "").slice(0, 9);
    e.target.value = dg.length > 5 ? dg.slice(0, 3) + "-" + dg.slice(3, 5) + "-" + dg.slice(5)
      : dg.length > 3 ? dg.slice(0, 3) + "-" + dg.slice(3) : dg;
  };

  /* a complete demo ZIP fills city + state — delegated so the co-buyer fields
     (re-rendered by the Joint toggle) stay wired without re-binding */
  view().addEventListener("input", (e) => {
    const z = e.target.closest("[data-zip]");
    if (!z) return;
    z.value = z.value.replace(/\D/g, "").slice(0, 5);
    const hit = z.value.length === 5 && RIDE_PRICE_DATA.zipLookup[z.value];
    if (!hit) return;
    const cityEl = $("#" + z.dataset.zipCity), stateEl = $("#" + z.dataset.zipState);
    if (cityEl) cityEl.value = hit.city;
    if (stateEl) stateEl.value = hit.state;
  });

  $("#caSubmit").onclick = () => {
    if ($("#atypeJoint").checked && !cbRec()) return toast("Add a co-buyer or select Individually");
    $$("[data-req]").forEach(el => { el.style.borderColor = ""; });
    $$(".f-err", view()).forEach(el => el.remove());
    const bad = [];
    $$("[data-req]").forEach(el => {
      if (!el.value.trim()) bad.push({ el, msg: "Required" });
      /* demo rule: the only SSN this tool ever accepts is the sample one */
      else if (el.id === "caSsn" && el.value.replace(/\D/g, "") !== "000000000") bad.push({ el, msg: "Demo tool — the SSN is always 000-00-0000" });
      else if (el.hasAttribute("data-date") && !dateISO(el.value)) bad.push({ el, msg: "Enter MM/DD/YYYY" });
    });
    if (bad.length) {
      bad.forEach(({ el, msg }) => {
        el.style.borderColor = "var(--crimson)";
        el.insertAdjacentHTML("afterend", `<span class="f-err">${msg}</span>`);
      });
      bad[0].el.scrollIntoView({ block: "center", behavior: "smooth" });
      bad[0].el.focus({ preventScroll: true });
      return toast("Missing: " + bad.map(b => b.el.dataset.req).join(", "));
    }
    if (!$("#caConsent").checked) {
      $("#caConsent").scrollIntoView({ block: "center", behavior: "smooth" });
      return toast("The applicant must check the electronic-signature consent box");
    }
    const val = (id2) => { const el = $("#" + id2); return el ? el.value.trim() : ""; };
    const tier = RIDE_PRICE_CALC.creditTier(c.creditScore || 700);
    const submittedAt = new Date().toISOString();
    /* the simulated approval is untouched (decision 25) — the form details are
       captured alongside it as the application of record */
    deal.creditApp = {
      submitted: submittedAt, approved: true,
      lender: RIDE_PRICE_DATA.lenders[0], qualifiedApr: tier.qualifiedApr, leaseFactor: Math.max(0.00001, tier.leaseFactor - 0.0003),
      employer: $("#caEmp").value,
      form: {
        consent: { electronicSignature: true, acceptedAt: submittedAt },
        dob: dateISO(val("caDob")), coDob: dateISO(val("coDob")) || null,
        creditType: val("caType"), primaryUse: val("caUse"),
        joint: $("#atypeJoint").checked, coRel: val("caCoRel"),
        marital: val("caMar"),
        housing: val("caHouse"), housePmt: val("caHousePmt"), resYrs: val("caResYrs"),
        prevAddress: val("caPrevAddr"),
        mailing: $("#caMailDiff").checked
          ? { address: val("caMailAddr"), city: val("caMailCity"), state: val("caMailState"), zip: val("caMailZip") } : null,
        occupation: val("caOcc"), selfEmployed: $("#caSelfEmp").checked,
        employerPhone: val("caEmpPhone"), empYrs: val("caEmpYrs"),
        income: val("caIncome"), otherIncome: val("caOther"), otherSource: val("caOtherSrc"),
        prevEmployer: val("caPrevEmp"), prevOccupation: val("caPrevOcc"), prevEmpYrs: val("caPrevEmpYrs"),
        disclosures: {
          bankruptcy: $("#dBk").checked ? val("dBkNote") : null,
          alias: $("#dAlias").checked ? val("dAliasNote") : null,
          repossession: $("#dRepo").checked ? val("dRepoNote") : null
        },
        references: {
          bank: val("refBank"), acctType: val("refAcctType"),
          kin: val("refKinName") ? { name: val("refKinName"), phone: val("refKinPhone"), relationship: val("refKinRel") } : null,
          personal: [val("refP1"), val("refP2")].filter(Boolean)
        }
      }
    };
    deal.stage = "menu"; Store.save();
    renderApproved(true);
  };

  function renderApproved(justNow) {
    const a = deal.creditApp;
    renderChrome("Lending Lane — Credit Application", dealTitle(deal), `<a class="btn btn--grad btn--sm" href="#/menu/${deal.id}">Continue → Menu</a>`);
    view().innerHTML = `
      <div class="panel">
        <div class="panel__head"><h2>Loan Status</h2><div class="right"><span class="badge badge--approved">✓ Approved</span></div></div>
        <div class="panel__body center" style="padding:38px 20px">
          <div style="font-size:52px">🏦</div>
          <h3 style="color:var(--navy);margin:10px 0 4px">Approved by ${esc(a.lender)}</h3>
          <p>Qualified rate: <b style="color:var(--green)">${a.qualifiedApr}% APR</b> (agreed structure was ${deal.desk.apr}%)</p>
          <label class="f" style="max-width:280px;margin:6px auto 0"><span class="lab">Assign Lender</span>
            <select id="assignLender" data-ui="dd">${RIDE_PRICE_DATA.lenders.map(l => `<option ${l === a.lender ? "selected" : ""}>${l}</option>`).join("")}</select>
          </label>
          <div class="note note--wt" style="text-align:left;max-width:560px;margin:18px auto"><span class="lab">While you waited</span>The Manufacturer Warranty Overview and Service Walk are complete and the Cover Sheet is printed. Next: the Team Lead signs off on the deal and delivers it to Processing — then the menu gets built.</div>
          <a class="btn btn--grad" href="#/menu/${deal.id}">Continue → Manager Sign-Off</a>
        </div>
      </div>`;
    $("#assignLender").onchange = (e) => {
      a.lender = e.target.value; Store.save();
      toast("Lender assigned: " + a.lender);
      renderApproved();
    };
    if (justNow) toast("Application approved — qualified rate " + a.qualifiedApr + "%");
  }
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
  const isLease = deal.dealType === "lease" || deal.dealType === "onepay";
  const isCash = deal.dealType === "cash";
  const progSet = RIDE_PRICE_DATA.programs[isLease ? "lease" : isCash ? "cash" : "finance"];
  const prog = progSet.preferred;
  const term = isLease ? deal.desk.leaseTerm : deal.desk.term;

  /* tiles: rate & term first (skip rate on cash/lease where it isn't presented), then every Preferred product */
  const tileKeys = [...(isCash ? [] : ["rate", "term"]), ...prog.products];
  let sel = tileKeys[0];
  const visited = new Set([sel]);

  /* this IS step 2 of the menu */
  migrateMenuV5(deal);
  const M2 = deal.menu;
  M2.step = 2; M2.maxStep = Math.max(M2.maxStep || 1, 2); Store.save();
  const toOptions = () => {
    M2.presented = true; M2.step = 3; M2.maxStep = Math.max(M2.maxStep || 1, 3); Store.save();
    navigate(`#/menu/${deal.id}`);
  };

  renderChrome(`Step 2 · ${prog.label} — Product Presentation`, dealTitle(deal),
    `<button class="btn btn--ghost btn--sm" id="retOptsTop">Continue to Repayment Options →</button>`);
  $("#retOptsTop").onclick = toOptions;
  document.body.dataset.screen = "present";

  function tileInfo(key) {
    const p = RIDE_PRICE_CALC.productById(key);
    const pres = RIDE_PRICE_DATA.presentations[key] || {};
    return {
      key,
      label: pres.label || (p ? p.name : key),
      short: pres.short || pres.label || (p ? p.name : key),
      icon: pres.icon || "🛡️",
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

  function render() {
    const t = tileInfo(sel);
    const allSeen = visited.size >= tileKeys.length;
    view().innerHTML = `${menuStepperHtml(deal, 2)}
      <div class="ptiles">
        ${tileKeys.map(k => {
          const ti = tileInfo(k);
          return `<button type="button" class="ptile ${k === sel ? "on" : ""} ${visited.has(k) ? "seen" : ""}" data-tile="${k}">
            <span class="pt-icon">${ti.icon}</span><span class="pt-long">${ti.label}</span><span class="pt-short">${ti.short}</span>${visited.has(k) && k !== sel ? `<span class="pt-check">✓</span>` : ""}
          </button>`;
        }).join("")}
      </div>

      <div class="panel present-detail">
        <div class="panel__body" style="padding:28px 30px">
          <div class="flex" style="align-items:flex-start">
            <div style="flex:1;min-width:min(260px,100%)">
              <h2 style="margin:0;font-size:22px;color:var(--navy)">${t.label}${t.product ? ` <span style="font-size:13px;font-weight:600">· ${t.product.detail}</span>` : ""}</h2>
              <h3 style="margin:14px 0 6px;font-size:17px">${t.headline}</h3>
              <p style="max-width:760px">${t.body}</p>
              ${t.benefits.length ? `<h4 style="margin:14px 0 4px">Benefits:</h4>
              <ul class="checks">${t.benefits.map(b => `<li>${b}</li>`).join("")}</ul>` : ""}
              ${sel === "rate" ? rateBody() : ""}
              ${sel === "vsc10" || sel === "vsc7" ? `
              <div class="note" style="max-width:560px">
                <b>Your driving affects the warranty</b> — their annual mileage:
                <input type="range" id="mwoMiles" min="5000" max="25000" step="2500" value="${deal.desk.milesPerYear || 15000}" style="width:100%;margin:10px 0 4px">
                <div id="mwoOut" class="small"></div>
              </div>` : ""}
              ${t.product ? `<p class="hint mt advscript-item">Tie it down to what they told you in discovery — the benefit must make sense to <b>them</b> (WIIFM).</p>` : ""}
            </div>
            ${t.product ? `
            <div class="pcol advscript-item">
              <button class="btn btn--primary" id="mdBudget">M/D Budget</button>
              <button class="btn btn--ghost" id="moreInfo">More Info</button>
              <div id="mdOut"></div>
            </div>` : ""}
          </div>
          <button type="button" class="advscript-toggle" id="advToggle" aria-expanded="${document.body.classList.contains("script-open")}"><span aria-hidden="true">💬</span> Advisor Script</button>
        </div>
      </div>

      <div class="flex mt pnav">
        <button class="btn btn--ghost" id="backToTerms">← Purchase Terms</button>
        <span class="pill ${allSeen ? "pill--hot" : ""}" style="padding:8px 16px">${visited.size} / ${tileKeys.length} presented</span>
        <div class="push"></div>
        <button class="btn btn--ghost" id="prevTile">← Prev</button>
        <button class="btn btn--grad" id="nextTile">${tileKeys.indexOf(sel) === tileKeys.length - 1 ? "Done — Repayment Options →" : "Next product →"}</button>
      </div>
      <p class="note note--wt advscript-item"><span class="lab">The 300% rule</span>Present every product without attempting to close after each one. Ask which option they choose only after Preferred, Standard, and Budget have all been presented.</p>`;

    bindMenuStepper(deal);
    $$("[data-tile]").forEach(b => b.onclick = () => { sel = b.dataset.tile; visited.add(sel); render(); });
    /* render() replaces the rail, which resets scrollLeft to 0 — on a phone
       that leaves the tile you just tapped off-screen. Re-centre it.
       Measured off rects, not offsetLeft: .ptile is position:relative, so its
       offsetParent is not the rail. */
    const rail = $(".ptiles"), onTile = $(".ptile.on");
    if (rail && onTile && rail.scrollWidth > rail.clientWidth) {
      const r = rail.getBoundingClientRect(), t = onTile.getBoundingClientRect();
      rail.scrollLeft += (t.left - r.left) - (r.width - t.width) / 2;
    }
    $("#backToTerms").onclick = () => { M2.step = 1; Store.save(); navigate(`#/menu/${deal.id}`); };
    const advBtn = $("#advToggle");
    if (advBtn) advBtn.onclick = () => {
      const open = document.body.classList.toggle("script-open");
      advBtn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    const prev = $("#prevTile"), next = $("#nextTile");
    prev.disabled = tileKeys.indexOf(sel) === 0;
    /* desktop hides a disabled Prev via CSS; the phone bar greys it in place
       so the two buttons do not jump when you reach the first product */
    prev.onclick = () => { sel = tileKeys[Math.max(0, tileKeys.indexOf(sel) - 1)]; visited.add(sel); render(); };
    next.onclick = () => {
      const i = tileKeys.indexOf(sel);
      if (i === tileKeys.length - 1) return toOptions();
      sel = tileKeys[i + 1]; visited.add(sel); render();
    };
    /* VSC mileage slider — reveal the real factory coverage window */
    const mwo = $("#mwoMiles");
    if (mwo) {
      const updMwo = () => {
        const m = parseInt(mwo.value, 10);
        const factoryMonths = Math.round(Math.min(36, 36000 / m * 12));
        const vscYears = sel === "vsc10" ? 10 : 7;
        const vscMiles = sel === "vsc10" ? 120000 : 100000;
        const vscMonths = Math.round(Math.min(vscYears * 12, vscMiles / m * 12));
        const end = new Date();
        end.setMonth(end.getMonth() + vscMonths);
        const endLabel = end.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        $("#mwoOut").innerHTML = `At <b>${m.toLocaleString()} miles a year</b>, the factory comprehensive coverage expires in
          <b>${factoryMonths} months</b>. This benefit mirrors the manufacturer for up to <b>${vscYears} years / ${vscMiles.toLocaleString()} miles</b>
          — peace of mind until <b style="color:var(--green)">${endLabel}</b>.`;
      };
      mwo.oninput = updMwo;
      updMwo();
    }

    const md = $("#mdBudget");
    if (md) md.onclick = () => {
      const b = mdBudget(t.product);
      $("#mdOut").innerHTML = `<div class="pay-hero" style="padding:12px 14px"><span class="lab">Impact on payment</span>
        <div class="amt" style="font-size:22px">${money(b.monthly)}<span style="font-size:12px;color:#cfcde6">/mo</span></div>
        <span class="sub">≈ ${money(b.daily)} a day over ${term} months</span></div>`;
    };
    const mi = $("#moreInfo");
    if (mi) mi.onclick = () => modal(t.label, `
      <div class="center" style="padding:8px 0 2px;font-size:44px">${t.icon}</div>
      <h3 class="center" style="margin:4px 0 10px">${t.headline}</h3>
      <p class="small">${t.body}</p>
      <ul class="checks small">${t.benefits.map(b => `<li>${b}</li>`).join("")}</ul>`,
      `<button class="btn btn--ghost" data-close>Close</button>`);
  }

  function rateBody() {
    const q = deal.creditApp || {};
    if (!q.approved) return `<p class="hint">Submit the credit application to present the qualified rate.</p>`;
    return `<ul class="lines small" style="max-width:420px">
      <li><span>Agreed rate (structure)</span><b class="amt">${deal.desk.apr}%</b></li>
      <li><span>Qualified rate (${esc(q.lender)})</span><b class="amt" style="color:var(--green)">${q.qualifiedApr}%</b></li>
    </ul>`;
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
      { label: "Cover sheet printed for the deal folder", ok: true, req: false }
    ];
    const ready = checks.filter(x => x.req).every(x => x.ok);
    renderChrome("Manager Sign-Off", dealTitle(deal),
      `<a class="btn btn--ghost btn--sm" href="#/credit/${deal.id}">← Lending Lane</a>`);
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
            ? `<div class="right mt"><button class="btn btn--grad" id="signoffBtn" ${ready ? "" : "disabled"}>✍ Manager Sign-Off — deliver to Processing</button></div>
               `
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
          <div class="flex mt"><a class="btn btn--ghost" href="#/credit/${deal.id}">← Lending Lane</a><div class="push"></div><button class="btn btn--grad" id="s1next">Next →</button></div>
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
  function step2() {
    const cols = Object.entries(progSet).map(([key, p]) => RIDE_PRICE_CALC.menuColumn(deal, v, key, p));
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

    function prodHtml(pid, colKey) {
      const p = RIDE_PRICE_CALC.productById(pid);
      return `<div class="mprod" draggable="true" data-prod="${pid}" data-from="${colKey}">
        <div><b>${p.name}</b><span>${p.detail} · ${money0(p.price)}</span></div>
        ${colKey === "custom"
          ? `<button class="mv mv--x" data-return="${pid}">✕ remove</button>`
          : `<button class="mv" data-move="${pid}" data-src="${colKey}">→ Custom</button>`}
      </div>`;
    }

    view().innerHTML = `${menuStepperHtml(deal, M.step)}
      <div class="flex" style="margin-bottom:14px">
        <p class="note note--wt" style="flex:1;min-width:min(280px,100%);margin:0"><span class="lab">Take control — the 300% rule</span>${M.presented ? `Every product has been presented — now show the options and let the client choose.` : `Present every product before showing payments.`} When they push back: <i>“Which product do you see the least amount of value in?”</i></p>
        <a class="btn ${M.presented ? "btn--ghost" : "btn--grad"}" href="#/present/${deal.id}">🎤 ${M.presented ? "Re-present products" : `Present ${cols[0].label} →`}</a>
      </div>
      <div class="menu-grid">
        ${cols.map(col => `
          <div class="mcol ${M.selectedProgram === col.key ? "mcol--active" : ""}" data-col="${col.key}">
            <div class="mcol__head"><h3>${col.label}</h3>${iniBoxHtml(col.key)}</div>
            <div class="mcol__products">
              ${col.products.filter(pid => !M.custom.includes(pid)).map(pid => prodHtml(pid, col.key)).join("") || `<div class="mcol__empty">all products moved</div>`}
            </div>
            <div class="mcol__pay"><span>${col.detail}</span><b>${money(col.payment)}</b></div>
          </div>`).join("")}
        <div class="mcol ${M.selectedProgram === "custom" ? "mcol--active" : ""}" data-col="custom" id="customCol">
          <div class="mcol__head"><h3>Custom</h3>${iniBoxHtml("custom")}</div>
          <div class="mcol__products">
            ${M.custom.length ? M.custom.map(pid => prodHtml(pid, "custom")).join("") : `<div class="mcol__empty">Send products here to build a custom program.<br>The first product's source column sets the rate &amp; term.</div>`}
          </div>
          <div class="mcol__pay"><span id="togglePayLab">${M.showCustomPay ? customResult.detail : "Custom payment"}</span><b>${M.showCustomPay ? money(customResult.payment) : "— — —"}</b></div>
        </div>
      </div>
      <div class="flex mt">
        <button class="btn btn--primary" id="togglePay">Toggle Payment</button>
        ${isCash ? `<button class="btn btn--ghost" id="switchFin">Switch to Finance</button>` : ""}
        <div class="push"></div>
        <button class="btn btn--ghost" id="backS1">← Back</button>
        <button class="btn btn--grad" id="s2next">Next →</button>
      </div>
      <p class="note">Products can move from Preferred and Standard into Custom. ${isCash ? "You cannot pull from Budget on a cash deal unless you switch the deal to finance." : "Moving remaining products from Standard provides payment relief."} It's possible to move forward with no products — but anything in the custom box must be initialed.</p>`;

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
        if (!confirm("Move forward with no products selected?")) return;
        M.selectedProgram = "none"; M.initials = "";
      }
      M.step = 4; M.maxStep = Math.max(M.maxStep || 1, 4); Store.save(); render();
    };
  }

  /* ---------- step 3: disclosure forms ---------- */
  function step3() {
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
            ${forms.map(f => `<label class="opt-row"><span class="switch"><input type="checkbox" data-form="${f.id}" ${deal.forms.selected.includes(f.id) ? "checked" : ""}><span class="sl"></span></span><span class="opt-row__label">${f.label}</span></label>`).join("")}</div>`).join("")}
          </div>
          <p class="hint">Additional forms may be printed by your team lead or processing department.</p>
        </div>
      </div>
      <div class="flex"><button class="btn btn--ghost" id="backS2">← Back</button><div class="push"></div><button class="btn btn--grad" id="s3next">Continue →</button></div>`;

    const ack = $("#ackSign");
    if (ack) ack.onclick = () => { M.ackSigned = true; M.ackName = c.first + " " + c.last; Store.save(); step3(); toast("Acknowledgement signed"); };
    $$("[data-form]").forEach(cb => cb.onchange = () => {
      deal.forms.selected = $$("[data-form]").filter(x => x.checked).map(x => x.dataset.form);
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
          <div class="right"><b>${v.year} ${v.make} ${v.model}</b><br>VIN ${v.vin} · Stock ${v.stock}<br>${DEAL_TYPES[deal.dealType]}${colResult && colResult.term ? ` · ${colResult.term} mo${colResult.apr ? " @ " + colResult.apr.toFixed(2) + "%" : ""}` : ""}</div>
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
        <a class="btn btn--ghost" href="#/forms/${deal.id}">🖨 Print Center</a>
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
    ({ 1: step1, 3: step2, 4: step3, 5: step4 }[Math.min(5, Math.max(1, M.step))] || step1)();
    bindMenuStepper(deal, render);
  }
  render();
});

/* ============================================================
   VIEW: Print Center + printable deal documents
   ============================================================ */
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

  function shell(title, body) {
    return `<article class="print-doc">
      <header class="pd-head">
        <div class="brand"><span class="rideprice">Ride</span><span class="price">PRICE</span></div>
        <div class="pd-store"><b>${ds.name}</b><br>${ds.address} · ${ds.phone}</div>
      </header>
      <h1 class="pd-title">${title}</h1>
      <div class="pd-meta">
        <span><b>${esc(c.first)} ${esc(c.last)}</b> · ${esc(c.phone)}</span>
        <span>${v ? `${v.year} ${esc(v.make)} ${esc(v.model)} ${esc(v.trim)} · Stock ${v.stock} · VIN ${v.vin}` : "No vehicle selected"}</span>
        <span>${today()} · ${DEAL_TYPES[deal.dealType]} · Advisor: ${esc(Store.s.advisor)}</span>
      </div>
      ${body}
      <footer class="pd-foot">${ds.name} — demo document for training use only · not a real contract</footer>
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
    ${sig("", "Client Advisor")}`);

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
    ${sig(Store.s.advisor, "Client Advisor — " + ds.name)}`);

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
      ${sig(deal.menu.ackSigned ? (deal.menu.ackName || c.first + " " + c.last) : "", "Customer")}`);
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
    ${sig(Store.s.advisor, "Client Advisor — " + ds.name)}`);

  docs.delivery = () => {
    const groups = {};
    RIDE_PRICE_DATA.dealForms.forEach(f => { (groups[f.group] = groups[f.group] || []).push(f); });
    return shell("Delivery Checklist", Object.entries(groups).map(([g, forms]) => `
      <h3 class="pd-h3">${g}</h3>
      <ul class="pd-checks">${forms.map(f => `<li><i>${deal.forms.selected.includes(f.id) ? "✓" : ""}</i>${f.label}</li>`).join("")}</ul>`).join("") +
      `${sig("", "Client Advisor")}${sig("", "Delivery Coordinator")}`);
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
    ${sig(Store.s.advisor, "Client Advisor — " + ds.name)}`);

  docs.quote = () => {
    const q = (deal.quotes || [])[(deal.quotes || []).length - 1];
    if (!q) return shell("Saved Quote", `<p class="pd-note">No saved quotes on this deal yet.</p>`);
    const qv = Store.vehicle(q.stock) || v;
    return shell("Saved Quote", `
      <ul class="lines">
        <li><span>Vehicle</span><b class="amt">${qv.year} ${esc(qv.make)} ${esc(qv.model)} · Stock ${q.stock}</b></li>
        <li><span>Deal Type</span><b class="amt">${DEAL_TYPES[q.dealType]}</b></li>
        <li class="total"><span>${q.dealType === "cash" ? "Estimated Total Due" : q.dealType === "onepay" ? "Estimated One-Pay Total" : "Estimated Monthly Payment"}</span><b class="amt">${money(q.summary)}</b></li>
      </ul>
      <p class="pd-note">Quick quote saved ${new Date(q.at).toLocaleString()} and emailed to ${esc(c.email)}. Quotes are for follow-up only — there is no option to purchase from a quote, and figures are estimates subject to credit approval.</p>`);
  };

  docs.generic = (formId) => {
    const f = RIDE_PRICE_DATA.dealForms.find(x => x.id === formId) || { label: formId, group: "Deal Forms" };
    return shell(f.label, `
      <p class="pd-note">This ${f.group.toLowerCase().replace(/s$/, "")} is part of the deal packet for the transaction referenced above.
      The undersigned acknowledges the ${f.label} has been reviewed, completed, and accepted as part of this transaction.</p>
      <ul class="pd-checks">
        <li><i></i>Reviewed with the client</li>
        <li><i></i>All required fields completed</li>
        <li><i></i>Copy provided to the client</li>
      </ul>
      ${sig("", "Customer")}
      ${sig("", "Client Advisor — " + ds.name)}`);
  };

  return docs;
}

route("forms/:id", ({ id }) => {
  const deal = Store.deal(id); if (!deal) return navigate("#/deals");
  renderChrome("Print Center", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/menu/${deal.id}">← Menu</a>
     <a class="btn btn--grad btn--sm" href="#/print/${deal.id}/packet">🖨 Print full packet</a>`);

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
      ${core.map(d => `<a class="card card--link" href="#/print/${deal.id}/${d.key}">
        <span class="icon">${d.icon}</span><h3>${d.label}</h3><p>${d.note}</p>
        <span class="go">Preview &amp; print →</span></a>`).join("")}
    </div>
    <h3 style="color:var(--navy);margin:26px 0 10px">Selected deal forms (from Disclosure Forms step)</h3>
    ${selected.length ? `<div class="grid grid--3">
      ${selected.map(f => `<a class="card card--link" href="#/print/${deal.id}/form-${f.id}">
        <span class="icon">📄</span><h3>${f.label}</h3><p>${f.group}</p>
        <span class="go">Preview &amp; print →</span></a>`).join("")}
    </div>` : `<p class="note">No forms selected yet — choose them on the menu's <a href="#/menu/${deal.id}">Disclosure Forms</a> step.</p>`}
    <p class="hint mt">The full packet prints every document with page breaks.</p>`;
});

route("print/:id/:doc", ({ id, doc }) => {
  const deal = Store.deal(id); if (!deal || !deal.stock) return navigate("#/deals");
  const docs = printDocs(deal);
  renderChrome("Print Preview", dealTitle(deal),
    `<a class="btn btn--ghost btn--sm" href="#/forms/${deal.id}">← Print Center</a>
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
  $("#brandHome").onclick = () => navigate("#/deals");
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

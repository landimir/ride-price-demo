/* Test log — a recorder for the owner's hands-on pass (his request,
   2026-09-15), rebuilt to the master's TEST-LOG-CONTRACT (v1.2, 2026-09-15).
   It records what the app DID, never what anyone typed or read: allowlisted
   events only — a tap by its control id, a screen by its route template, an
   edit by its field id, a refusal by its field, a sheet by its id, a toast by
   a short hash of its wording, an error scrubbed to its file and line, a slow
   answer by its bucket, a rescue by a guard. No field values, no lengths of
   values, no labels or other DOM text, no names, no file names, no full URLs;
   entity ids are run-local pseudonyms (d1, c2). Nothing leaves the phone on
   its own: the log is handed over from the Test log screen (More → Send test
   log) by mail, share or select-and-copy.
   Recording starts by itself only in a designated test preview — a deployment
   whose folder ends in "-preview" (the demo site's onboarding-preview/), or a
   browser where the switch ride_price_testpreview is set to 1 (the harness,
   a LAN test) — and is off everywhere else until started from the Test log
   screen. Stop persists for that browser. Bounds: 5,000 events or 1 MiB,
   oldest dropped first and counted; seven-day expiry; storage refusing the
   write disables persistence and says so, the flow never breaks. */
(function () {
  "use strict";
  const KEY = "ride_price_touchlog_v2";
  const SCHEMA = 2;
  const MAX_EVENTS = 5000, MAX_BYTES = 1024 * 1024, MAX_AGE = 7 * 24 * 3600 * 1000;
  const designated = () => {
    try { if (localStorage.getItem("ride_price_testpreview") === "1") return true; } catch (e) { /* no storage: not designated */ }
    return /-preview\//.test(location.pathname);
  };
  const runId = () => Math.random().toString(36).slice(2, 8);
  const fresh = (on) => ({ v: SCHEMA, on, run: on ? runId() : null, startedAt: on ? Date.now() : null, seq: 0, dropped: 0, persist: true, events: [], ids: {} });
  let state = read();
  function read() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || "null");
      if (s && s.v === SCHEMA && Array.isArray(s.events)) {
        if (s.startedAt && Date.now() - s.startedAt > MAX_AGE) return fresh(designated()); /* expired: a new run, same rule */
        return s;
      }
    } catch (e) { /* unreadable: start clean */ }
    return fresh(designated());
  }
  let saveTimer = null, saving = false;
  function save() {
    if (saveTimer || !state.persist) return;
    saveTimer = setTimeout(() => {
      saveTimer = null; if (saving) return; saving = true;
      try {
        let s = JSON.stringify(state);
        while (s.length > MAX_BYTES && state.events.length) { const cut = Math.ceil(state.events.length / 10); state.events.splice(0, cut); state.dropped += cut; s = JSON.stringify(state); }
        localStorage.setItem(KEY, s);
      } catch (e) {
        /* quota or storage refused: keep recording in memory, say so once, never log the logger */
        state.persist = false; state.events.push({ n: ++state.seq, t: ms(), ts: now(), k: "storage", d: "persistence off: storage refused the write", r: routeOf(location.hash) });
      } finally { saving = false; }
    }, 150);
  }
  const now = () => new Date().toISOString();
  /* wall clock from the run's start, not performance.now(): the log lives
     across reloads and his third log restarted at +7 s after a reload (OB-058) */
  const ms = () => state.startedAt ? Date.now() - state.startedAt : 0;
  const t = (e) => (e.t / 1000).toFixed(1);
  /* entity ids become run-local pseudonyms: d-nwf33ug → d1 */
  const pseud = (id) => { const p = id[0]; if (!state.ids[id]) state.ids[id] = p + (Object.keys(state.ids).filter(k => k[0] === p).length + 1); return state.ids[id]; };
  const routeOf = (h) => String(h || "#/deals").split("?")[0].replace(/\b([dcsv])-[a-z0-9]{5,}\b/g, (m) => ":" + pseud(m)).replace(/\/\d+(?=\/|$)/g, "/:n");
  function push(kind, detail, extra) {
    if (!state.on) return;
    const e = { n: ++state.seq, t: ms(), ts: now(), k: kind, d: detail || "", r: routeOf(location.hash) };
    if (extra) Object.assign(e, extra);
    state.events.push(e);
    if (state.events.length > MAX_EVENTS) { const over = state.events.length - MAX_EVENTS; state.events.splice(0, over); state.dropped += over; }
    save();
  }
  /* a control by its stable id — never its words */
  const CONTROLS = "button, a, [role='button'], input, select, textarea, .rp-row, .rp-card, .rp-chip, .rp-option, .rp-tab";
  function ident(el) {
    const c = el.closest(CONTROLS);
    if (!c) return null;
    const id = c.id || (c.dataset.found !== undefined ? "data-found" : c.dataset.pickaddr !== undefined ? "data-pickaddr" : c.dataset.ch !== undefined ? "data-ch" : "");
    const tag = c.tagName.toLowerCase();
    const cls = [...c.classList].find(k => /^(rp|ob|ch|dv|tl|ca|dq|sc|mn)-/.test(k)) || "";
    const href = tag === "a" && c.getAttribute("href") ? " → " + routeOf(c.getAttribute("href")) : "";
    return { id: id ? "#" + id : tag + (cls ? "." + cls : ""), tag, type: c.type || "", href };
  }
  let changes = 0, lastFilePick = 0;
  /* taps — capture phase, so a handler that re-renders cannot hide the target;
     a keyboard activation (Enter/Space) arrives as a click with detail 0 */
  document.addEventListener("click", (e) => {
    if (!state.on) return;
    const via = e.detail === 0 ? " via key" : "";
    const c = ident(e.target);
    if (!c) { push("tap", (e.target.closest(".rp-scrim, .drawer-overlay, .m-scrim") ? "backdrop" : "none") + via); return; }
    if (c.tag === "input" || c.tag === "select" || c.tag === "textarea") {
      if (c.type === "file") { lastFilePick = Date.now(); push("picker", c.id); return; }
      push("focus", c.id); return;
    }
    push("tap", c.id + c.href + via);
    const before = changes, tapAt = Date.now();
    setTimeout(() => { if (state.on && changes === before && lastFilePick < tapAt) push("no-effect", c.id, { code: "no-change-1s" }); }, 1000);
  }, true);
  /* editing — that it happened, per field, never the key, value or length;
     a burst on one field is one line with a count */
  let lastEdit = null;
  document.addEventListener("input", (e) => {
    if (!state.on) return;
    const el = e.target; if (!el || !("value" in el) || el.type === "file") return;
    const id = el.id ? "#" + el.id : el.tagName.toLowerCase();
    const last = state.events[state.events.length - 1];
    if (lastEdit === id && last && last.k === "edit" && last.d === id) { last.c = (last.c || 1) + 1; save(); return; }
    lastEdit = id; push("edit", id);
  }, true);
  document.addEventListener("focusin", () => { lastEdit = null; }, true);
  /* screens */
  window.addEventListener("hashchange", () => { changes++; push("screen", routeOf(location.hash)); });
  /* errors — scrubbed: the file and line, a short message with anything quoted, any number run and any path removed */
  const scrub = (s) => String(s || "").replace(/(["'`]).*?\1/g, "…").replace(/\d{3,}/g, "#").replace(/[A-Za-z]:[\\/][^\s]+|https?:\/\/[^\s]+/g, "[path]").slice(0, 80);
  window.addEventListener("error", (e) => push("error", `${scrub(e.message)} @ ${(e.filename || "").split("/").pop().split("?")[0]}:${e.lineno}`));
  window.addEventListener("unhandledrejection", (e) => push("error", "unhandled promise: " + scrub(e.reason && e.reason.message || e.reason)));
  /* sheets, dialogs and refusals by id — the one sheet node, its hidden
     attribute AND its content (a dialog raised over a sheet replaces the
     content in the same task as the close/open) */
  let lastSheet = null;
  new MutationObserver((muts) => {
    changes += muts.length;
    if (!state.on) return;
    const seen = new Set();
    for (const m of muts) {
      if (m.type === "childList") for (const n of m.addedNodes) if (n.nodeType === 1 && n.classList && n.classList.contains("f-err")) { const f = n.previousElementSibling; push("refused", f && f.id ? "#" + f.id : "field"); }
      if (m.type === "attributes" && m.attributeName !== "hidden") continue;
      const el = m.target.nodeType === 1 ? m.target.closest(".rp-sheet") : null;
      if (!el || seen.has(el)) continue;
      seen.add(el);
      const dialog = !!el.querySelector(".rp-dialog__title, #chDialogGo");
      const name = (el.id ? "#" + el.id : ".rp-sheet") + (dialog ? " dialog" : "");
      if (el.hidden) { if (lastSheet) { push("sheet-close", lastSheet); lastSheet = null; } }
      else if (name !== lastSheet) { lastSheet = name; push("sheet-open", name); }
    }
  }).observe(document.documentElement, { attributes: true, childList: true, subtree: true });
  /* toasts: the app's global toast() is wrapped; the wording is kept as a
     short hash so two toasts can be told apart without keeping the words */
  const hash6 = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h.toString(36).slice(0, 6); };
  const wrapToast = () => {
    if (typeof window.toast !== "function" || window.toast.__touchlog) return false;
    const orig = window.toast;
    const wrapped = function (msg) { push("toast", "t" + hash6(msg)); return orig.apply(this, arguments); };
    wrapped.__touchlog = true; window.toast = wrapped; return true;
  };
  if (!wrapToast()) window.addEventListener("DOMContentLoaded", wrapToast);
  /* slow answers by bucket: the event that carries the work (click, keydown,
     input), once per tap, when it took longer than three frames */
  const bucket = (d) => d < 100 ? "50-100ms" : d < 300 ? "100-300ms" : d < 1000 ? "300-1000ms" : ">1s";
  let lastSlow = -1;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!/^(click|keydown|input|pointerup)$/.test(e.name) || e.duration < 50) continue; const key = Math.round(e.startTime); if (key === lastSlow) continue; lastSlow = key; push("slow", e.name, { code: bucket(e.duration) }); } }).observe({ type: "event", durationThreshold: 50, buffered: false }); } catch (e) { /* no event timing here */ }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) push("slow", "long task", { code: bucket(e.duration) }); }).observe({ type: "longtask", buffered: false }); } catch (e) { /* no long-task timing here */ }

  const storeKB = () => { try { return Math.round((localStorage.getItem("ride_price_portal_v1") || "").length / 1024); } catch (e) { return -1; } };
  const device = () => { const w = Math.min(screen.width, screen.height); const cat = w < 600 ? "phone" : w < 1000 ? "tablet" : "desktop"; const ua = navigator.userAgent; const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : "other"; return `${cat} · ${os} · ${innerWidth}×${innerHeight}`; };
  const build = () => (document.querySelector('script[src*="app.js"]') || { src: "" }).src.split("v=")[1] || "unstamped";
  const where = () => location.host + "/" + ((location.pathname.match(/\/([^/]+-preview)\//) || [])[1] || "root");
  function header() {
    return [`Ride Price test log · schema ${SCHEMA} · run ${state.run || "—"}`, `build ${build()} · ${where()} · ${designated() ? "designated test preview" : "not a designated preview"}`,
      `started ${state.startedAt ? new Date(state.startedAt).toISOString() : "—"} · store ${storeKB()} KB · ${state.persist ? "persisted" : "NOT persisted (storage refused)"}${state.dropped ? ` · ${state.dropped} oldest events dropped` : ""}`,
      device(), ""].join("\n");
  }
  const line = (e) => `${String(e.n).padStart(4)} +${t(e).padStart(7)}s  ${e.k.padEnd(11)} ${e.d}${e.c ? ` ×${e.c}` : ""}${e.code ? ` [${e.code}]` : ""}  @${e.r}`;
  /* the quiet indicator: a dot in the corner while recording (styled in portal.css, our own class) */
  let dot = null;
  const indicator = () => {
    if (!document.body) return;
    if (!dot) { dot = document.createElement("span"); dot.className = "tl-dot"; dot.setAttribute("role", "img"); dot.setAttribute("aria-label", "Test log recording"); dot.title = "Test log recording"; document.body.appendChild(dot); }
    dot.hidden = !state.on;
  };
  const api = {
    on: () => state.on,
    designated,
    count: () => state.events.length,
    dropped: () => state.dropped,
    persisted: () => state.persist,
    start() { state = fresh(true); push("start", `store ${storeKB()} KB`); save(); indicator(); },
    stop() { push("stop", `store ${storeKB()} KB`); state.on = false; save(); indicator(); },
    clear() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; } state = fresh(false); try { localStorage.removeItem(KEY); } catch (e) { /* nothing to remove */ } indicator(); },
    /* app hooks: a guard's rescue to Home, or anything the app wants on the record — routes are templated here */
    note: (kind, detail) => push(kind, routeOf(detail)),
    text() { return header() + state.events.map(line).join("\n") + `\n— end of log · ${state.events.length} events${state.dropped ? ` (+${state.dropped} dropped)` : ""}\n`; },
    json() { return JSON.stringify({ schema: SCHEMA, run: state.run, build: build(), where: where(), designated: designated(), startedAt: state.startedAt, device: device(), persisted: state.persist, dropped: state.dropped, events: state.events }); }
  };
  window.RIDE_PRICE_TOUCHLOG = api;
  if (state.on && state.startedAt && !state.events.length) push("start", `store ${storeKB()} KB`);
  if (document.body) indicator(); else window.addEventListener("DOMContentLoaded", indicator);
})();

/* Test log — a recorder for the owner's hands-on pass (his request, 2026-09-15).
   Off by default; switched on from More. While on, it writes what the app DID
   to its own slot in localStorage (never the deal store): every tap with what
   was tapped, every screen change, sheet, dialog, toast and search keystroke,
   plus what he cannot see or describe — a script error, a tap that changed
   nothing within a second, an input that took longer than a frame to answer, a
   rescue to Home by a bad-link guard, the store's size. Nothing leaves the
   phone on its own: the log is handed over from the Test log screen (More →
   Send test log) by mail, share, or select-and-copy. No secure-context API is
   required for any of that. Fixtures are the demo's fictional people; the log
   also carries whatever is typed. */
(function () {
  "use strict";
  const KEY = "ride_price_touchlog_v1";
  const CAP = 600;
  let state = read();
  function read() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && Array.isArray(s.events)) return s; } catch (e) { /* unreadable: start clean */ }
    return { on: false, startedAt: null, events: [] };
  }
  let saveTimer = null;
  function save() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => { saveTimer = null; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota: the log is the first thing to drop */ } }, 150);
  }
  const t = () => state.startedAt ? ((Date.now() - state.startedAt) / 1000).toFixed(1) : "0.0";
  function push(kind, detail) {
    if (!state.on) return;
    state.events.push({ t: t(), k: kind, d: detail || "", h: location.hash || "#/deals" });
    if (state.events.length > CAP) state.events.splice(0, state.events.length - CAP);
    save();
  }
  /* what a control is called, the way the owner would name it */
  function label(el) {
    const c = el.closest("button, a, [role='button'], input, select, textarea, .rp-row, .rp-card, .rp-chip, .rp-option, .rp-tab");
    if (!c) return null;
    const name = c.getAttribute("aria-label") || (c.tagName === "INPUT" || c.tagName === "TEXTAREA" ? (c.placeholder || c.name || c.id) : (c.textContent || "").replace(/\s+/g, " ").trim());
    const sel = c.tagName.toLowerCase() + (c.id ? "#" + c.id : "") + (c.classList.length ? "." + c.classList[0] : "");
    return { name: (name || "").slice(0, 60), sel };
  }
  /* "did anything happen": a counter bumped by every DOM mutation and every
     screen change, so a sheet that opened and closed inside the second still
     counts as an effect (the first version compared before/after snapshots
     and called the visit sheet a dead tap) */
  let changes = 0;

  /* taps — capture phase, so a handler that re-renders cannot hide the target */
  document.addEventListener("click", (e) => {
    if (!state.on) return;
    const l = label(e.target);
    if (!l) { push("tap", "(nothing tappable)"); return; }
    if (l.sel.indexOf("input") === 0 || l.sel.indexOf("select") === 0 || l.sel.indexOf("textarea") === 0) { push("focus", `${l.name} (${l.sel})`); return; }
    push("tap", `${l.name} (${l.sel})`);
    const before = changes;
    setTimeout(() => { if (state.on && changes === before) push("no-effect", `${l.name} — nothing changed within 1 s`); }, 1000);
  }, true);
  /* typing — one entry per keystroke, the value as it stands */
  document.addEventListener("input", (e) => {
    if (!state.on) return;
    const el = e.target; if (!el || !("value" in el)) return;
    push("type", `${el.id || el.placeholder || el.tagName} = "${String(el.value).slice(0, 40)}"`);
  }, true);
  /* screens */
  window.addEventListener("hashchange", () => { changes++; push("screen", location.hash || "#/deals"); });
  /* errors — the things no tester can report */
  window.addEventListener("error", (e) => push("ERROR", `${e.message} @ ${(e.filename || "").split("/").pop()}:${e.lineno}`));
  window.addEventListener("unhandledrejection", (e) => push("ERROR", "unhandled promise: " + String(e.reason && e.reason.message || e.reason).slice(0, 120)));
  /* sheets and dialogs: the one sheet node — its hidden attribute AND its
     content, because a dialog raised over a sheet replaces the content in the
     same task as the close/open and the attribute alone never shows it */
  let lastSheet = null;
  new MutationObserver((muts) => {
    changes += muts.length;
    if (!state.on) return;
    const seen = new Set();
    for (const m of muts) {
      const el = m.target.nodeType === 1 ? m.target.closest(".rp-sheet") : null;
      if (!el || seen.has(el)) continue;
      seen.add(el);
      const title = el.querySelector(".rp-sheet__title, .rp-dialog__title");
      const name = title ? title.textContent.trim().slice(0, 60) : "(untitled)";
      if (el.hidden) { if (lastSheet) { push("sheet-close", lastSheet); lastSheet = null; } }
      else if (name !== lastSheet) { lastSheet = name; push("sheet-open", name); }
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["hidden"], childList: true, subtree: true });
  /* toasts: the app's global toast() is wrapped, so the words that flashed are kept */
  const wrapToast = () => {
    if (typeof window.toast !== "function" || window.toast.__touchlog) return false;
    const orig = window.toast;
    const wrapped = function (msg) { push("toast", String(msg).slice(0, 80)); return orig.apply(this, arguments); };
    wrapped.__touchlog = true; window.toast = wrapped; return true;
  };
  if (!wrapToast()) window.addEventListener("DOMContentLoaded", wrapToast);
  /* slow answers: an input whose handling took longer than a frame (Chrome and
     Safari 16.4+; silently absent elsewhere), and long tasks where reported */
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 16) push("slow", `${e.name} took ${Math.round(e.duration)} ms`); }).observe({ type: "event", durationThreshold: 16, buffered: false }); } catch (e) { /* no event timing here */ }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) push("slow", `long task ${Math.round(e.duration)} ms`); }).observe({ type: "longtask", buffered: false }); } catch (e) { /* no long-task timing here */ }

  const storeKB = () => { try { return Math.round((localStorage.getItem("ride_price_portal_v1") || "").length / 1024); } catch (e) { return -1; } };
  function header() {
    const stamp = (document.querySelector('script[src*="app.js"]') || { src: "" }).src.split("v=")[1] || "unstamped";
    let role = "?"; try { role = JSON.parse(localStorage.getItem("ride_price_portal_v1") || "{}").role || "advisor"; } catch (e) { /* unreadable */ }
    return [`Ride Price test log`, `build ${stamp} · ${location.origin}${location.pathname}`, `started ${state.startedAt ? new Date(state.startedAt).toISOString() : "—"} · role ${role} · store ${storeKB()} KB`, `${screen.width}×${screen.height} · ${navigator.userAgent}`, ""].join("\n");
  }
  const api = {
    on: () => state.on,
    count: () => state.events.length,
    start() { state = { on: true, startedAt: Date.now(), events: [] }; push("start", `store ${storeKB()} KB`); save(); },
    stop() { push("stop", `store ${storeKB()} KB`); state.on = false; save(); },
    clear() { if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; } state = { on: false, startedAt: null, events: [] }; try { localStorage.removeItem(KEY); } catch (e) { /* nothing to remove */ } },
    /* app hooks: a guard's rescue to Home, or anything the app wants on the record */
    note: (kind, detail) => push(kind, detail),
    text() { return header() + state.events.map(e => `+${e.t}s  ${e.k.padEnd(11)} ${e.d}  @${e.h}`).join("\n") + "\n"; }
  };
  window.RIDE_PRICE_TOUCHLOG = api;
})();

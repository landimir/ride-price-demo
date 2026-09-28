/* The simulated services — redesign phase 2 (the owner's ruling "Simulated
   services with tester switches", 2026-09-22; the pictures he approved
   2026-09-23: docs/workflows/redesign/visuals/decision-services-*.png).

   The demo has no network: every "server" it stands for runs in the page, so
   the failures a dealership meets every day — a lender that does not answer,
   a text that does not go out, a dropped connection, a session that ended,
   a phone that will not save — could never happen here. This layer is where
   each pretend server answers, so a tester (the switches in More) or a test
   can make it answer slowly, fail, go offline or end the session, and every
   flow shows the state it was designed for.

   Normal answers at once, exactly as the app always has, so nothing about a
   normal run changes. The switches live on the phone (localStorage), not in
   the demo's data; Reset demo data sets them back to normal too.

   A call resolves with the work's result, or rejects with a ServiceError
   whose kind says which state to draw: "failed", "offline" or "session". */
const RIDE_PRICE_SERVICES = (function () {
  const KEY = "ride_price_switches";
  const ALL = ["normal", "slow", "failing", "offline", "signed-out"];
  /* one row per pretend server, in the order the tester panel lists them */
  const LIST = [
    { id: "lender", name: "Lender decision", what: "Sending the credit application", modes: ALL },
    { id: "links", name: "Text and email links", what: "The secure links a customer opens", modes: ALL },
    { id: "search", name: "Customer search", what: "Finding someone already on file", modes: ALL },
    { id: "reading", name: "License reading", what: "The scanner reading a license", modes: ALL },
    /* the identity check can also say no: the photo does not match the license (the owner's answer of 2026-09-24) */
    { id: "identity", name: "Identity check", what: "Verifying who a customer is", modes: ALL.concat("no-match") },
    { id: "uploads", name: "Document uploads", what: "Photos and files for the Deal Jacket", modes: ALL },
    { id: "dms", name: "DMS push", what: "Finalizing the deal", modes: ALL },
    /* the phone itself: it saves or it refuses — it is never slow or signed out */
    { id: "saving", name: "Saving on this phone", what: "Every change you make", modes: ["normal", "failing"] }
  ];
  const MODES = {
    normal: { name: "Normal", what: "Answers in about a second" },
    slow: { name: "Slow", what: "Answers after twenty seconds" },
    failing: { name: "Failing", what: "Answers with an error" },
    offline: { name: "Offline", what: "No connection at all" },
    "signed-out": { name: "Signed out", what: "The session has ended" },
    "no-match": { name: "Says no", what: "The photo does not match the license" }
  };
  /* the phone's own failure reads as what it is */
  const SAVING_FAILING = { name: "Failing", what: "The phone refuses to save" };
  const SLOW_MS = 20000, FAIL_MS = 1200;
  /* how long slow and failing take; a test shortens them (setTiming), the panel never does */
  let timing = { slowMs: SLOW_MS, failMs: FAIL_MS };
  function setTiming(t) { timing = { slowMs: (t && t.slowMs) || SLOW_MS, failMs: (t && t.failMs) || FAIL_MS }; }

  let state = read();
  function read() {
    try { const s = JSON.parse(localStorage.getItem(KEY) || "{}"); return s && typeof s === "object" ? s : {}; }
    catch (e) { return {}; }
  }
  function write() {
    try { if (Object.keys(state).length) localStorage.setItem(KEY, JSON.stringify(state)); else localStorage.removeItem(KEY); }
    catch (e) { /* the switches cannot be kept on this phone: they last for this page only */ }
  }
  const byId = (id) => LIST.find((s) => s.id === id) || null;
  function mode(id) {
    const s = byId(id); if (!s) return "normal";
    const m = state[id];
    return s.modes.indexOf(m) >= 0 ? m : "normal";
  }
  function announce() { try { window.dispatchEvent(new Event("ride-price:switches")); } catch (e) { /* no event: nothing listens */ } }
  function set(id, m) {
    const s = byId(id); if (!s || s.modes.indexOf(m) < 0) return;
    if (m === "normal") delete state[id]; else state[id] = m;
    write(); announce();
  }
  function reset() { state = {}; write(); announce(); }
  /* signing in again renews the session for every server at once */
  function signIn() {
    let changed = false;
    for (const id of Object.keys(state)) if (state[id] === "signed-out") { delete state[id]; changed = true; }
    if (changed) { write(); announce(); }
  }
  const on = () => LIST.filter((s) => mode(s.id) !== "normal").map((s) => ({ id: s.id, name: s.name, mode: mode(s.id) }));
  /* the words for a switch that is on, as the DEMO band says them */
  /* short, so every switch fits on a phone-width band beside DEMO and Change
     (the panel keeps the full names) */
  const PHRASE = {
    lender: "the lender", links: "links", search: "search", reading: "the reader",
    identity: "the ID check", uploads: "uploads", dms: "the DMS push", saving: "saving"
  };
  const MODE_PHRASE = { slow: "is slow", failing: "is failing", offline: "is offline", "signed-out": "is signed out", "no-match": "says no" };
  /* two of them are plural on the band: "texts and emails are failing" */
  const PLURAL = ["links", "uploads"];
  function describe() {
    const list = on();
    if (!list.length) return "";
    if (list.length > 1) return `${list.length} switches are on`;
    const s = list[0];
    if (s.id === "saving") return "saving is refused";
    const verb = MODE_PHRASE[s.mode];
    return `${PHRASE[s.id]} ${PLURAL.indexOf(s.id) >= 0 ? verb.replace(/^is /, "are ") : verb}`;
  }
  /* the phone is offline for real, or a tester made a server so */
  const reallyOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;
  const anyOffline = () => reallyOffline() || on().some((s) => s.mode === "offline");

  class ServiceError extends Error {
    constructor(service, kind) {
      super(`${(byId(service) || { name: service }).name}: ${kind}`);
      this.name = "ServiceError"; this.service = service; this.kind = kind;
    }
  }
  const later = (ms) => new Promise((r) => setTimeout(r, ms));
  /* one pretend call. `work` runs only when the server answers, so a failed
     call has done nothing; `opts.slowMs` / `opts.failMs` give one call its own
     length */
  async function call(id, work, opts) {
    const m = reallyOffline() && id !== "saving" ? "offline" : mode(id);
    if (m === "offline") throw new ServiceError(id, "offline");
    if (m === "signed-out") throw new ServiceError(id, "session");
    if (m === "slow") await later((opts && opts.slowMs) || timing.slowMs);
    if (m === "failing") { await later((opts && opts.failMs) || timing.failMs); throw new ServiceError(id, "failed"); }
    /* an answer, not a failure: the server answered, and its answer is no */
    if (m === "no-match") return { match: false };
    return typeof work === "function" ? work() : undefined;
  }
  /* the phone refusing to save: the same error a full phone raises, so every
     path that already handles a full phone handles this one */
  function checkSave() {
    if (mode("saving") !== "failing") return;
    let err;
    try { err = new DOMException("This phone refused to save (tester switch).", "QuotaExceededError"); }
    catch (e) { err = new Error("This phone refused to save (tester switch)."); err.name = "QuotaExceededError"; }
    throw err;
  }
  const modesFor = (id) => { const s = byId(id); return s ? s.modes.map((m) => ({ id: m, ...(id === "saving" && m === "failing" ? SAVING_FAILING : MODES[m]) })) : []; };

  return { LIST, MODES, SLOW_MS, setTiming, list: () => LIST.slice(), mode, set, reset, signIn, on, describe, anyOffline, reallyOffline, call, checkSave, modesFor, ServiceError };
})();

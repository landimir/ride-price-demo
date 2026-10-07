/* Ride Price UI Library — shared browser session.
   Drives the portal in headless Chrome at the canonical phone viewport
   (390 × 844, mobile emulation) using the repo's own CDP harness, so the
   library is captured by the same machinery that verifies the app. */
import { launchChrome, CDP, staticServer, makePng } from "../../harness/cdp.mjs";
import { PORTAL } from "../../harness/paths.mjs";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const VIEWPORT = { width: 390, height: 844 };
export const LIB = join(dirname(fileURLToPath(import.meta.url)), "..");
export const CURRENT = join(LIB, "current");
export const REPORTS = join(LIB, "reports");
export const MASTER = join(LIB, "master-flow");
export const VERSIONS = join(LIB, "versions");
export const ISSUES = join(LIB, "issues");
export const FIXTURES = join(LIB, "tools", "fixtures");

const settle = (ms = 300) => new Promise(r => setTimeout(r, ms));

export class Session {
  /* root: the portal to serve, the repo's own unless a tool passes a copy (versions.mjs captures a changed copy) */
  constructor({ http = 8466, cdp = 9366, root = PORTAL } = {}) { this.http = http; this.cdp = cdp; this.root = root; this.base = `http://127.0.0.1:${http}/`; }

  async open() {
    this.srv = await staticServer(this.root, this.http);
    const { proc, ws } = await launchChrome(this.cdp);
    this.proc = proc;
    this.c = new CDP(ws); await this.c.connect();
    /* what the page logs as an error, kept for checks() (a favicon the static server does not have is not the app's). It
       listens before the app's first load, on a blank tab with the browser's log on, so an error the app makes while it
       starts is the first screen's, not lost (CodeRabbit on #259) */
    this.errors = [];
    const note = (s) => { if (!/favicon/.test(s)) this.errors.push(s); };
    this.c.on("Runtime.exceptionThrown", (p) => note("uncaught: " + String((p.exceptionDetails.exception && p.exceptionDetails.exception.description) || p.exceptionDetails.text).split("\n")[0].slice(0, 160)));
    this.c.on("Runtime.consoleAPICalled", (p) => { if (p.type === "error" || p.type === "assert") note("console." + p.type + ": " + p.args.map((a) => (a.value !== undefined ? String(a.value) : a.description || a.type)).join(" ").slice(0, 160)); });
    this.c.on("Log.entryAdded", (p) => { if (p.entry.level === "error") note("log: " + String(p.entry.text).slice(0, 120) + (p.entry.url ? " (" + String(p.entry.url).replace(/^.*\//, "") + ")" : "")); });
    await this.c.openTab("about:blank");
    await this.c.send("Log.enable");
    await this.c.goto(this.base);
    await this.c.setViewport(VIEWPORT.width, VIEWPORT.height);
    await this.c.appReady();
    return this;
  }
  async close() { try { this.proc.kill(); } catch {} try { this.srv.close(); } catch {} }

  eval(expr) { return this.c.eval(expr); }
  settle(ms) { return settle(ms); }

  /* demo seed, plus the one state every harness uses so the jacket's client
     queue exists (an approved credit app makes the paystub/insurance/licence
     queue meaningful). Nothing here is invented customer data. */
  async reset({ approved = true } = {}) {
    /* the tester switches are kept on the phone, apart from the demo data: the service-states flow turns them on, and
       every reset turns them back to normal so no other screen is captured with a pretend server failing */
    await this.c.eval(`(() => { if (typeof RIDE_PRICE_SERVICES !== "undefined") RIDE_PRICE_SERVICES.reset(); Store.reset(); ${approved ? `Store.deal("d-demo1").creditApp = { approved: true, lender: "Ride Price Financial" }; Store.save();` : ""} return true; })()`);
  }

  /* navigate to a hash and re-boot so route-entry state (phone/desktop
     decisions, module state) is exactly what a user landing there gets */
  async go(hash, { reload = true } = {}) {
    await this.c.goto(this.base + "#" + hash.replace(/^#/, ""));
    if (reload) { await this.c.eval(`location.reload()`); await settle(500); await this.c.loaded(); await this.c.appReady(); }
    await settle(250);
    const at = await this.c.eval(`location.hash`);
    return at;
  }
  /* in-app navigation (no reload) — what a tap on a link does */
  async hash(hash) { await this.c.eval(`location.hash = ${JSON.stringify("#" + hash.replace(/^#/, ""))}`); await settle(350); }

  async click(selector, { nth = 0, wait = 350 } = {}) {
    const ok = await this.c.eval(`(() => { const els = document.querySelectorAll(${JSON.stringify(selector)}); const el = els[${nth}]; if (!el) return false; el.click(); return true; })()`);
    if (!ok) throw new Error("no element to click: " + selector + (nth ? ` [${nth}]` : ""));
    await settle(wait);
  }
  /* click the first visible element whose text contains `text` (buttons/links) */
  async clickText(text, { within = "body", wait = 350 } = {}) {
    const ok = await this.c.eval(`(() => {
      const root = document.querySelector(${JSON.stringify(within)}) || document;
      const els = [...root.querySelectorAll("button, a, [role=button], summary, label")];
      const el = els.find(e => e.offsetParent !== null && (e.textContent || "").replace(/\\s+/g, " ").trim().includes(${JSON.stringify(text)}));
      if (!el) return false; el.click(); return true; })()`);
    if (!ok) throw new Error("no visible control with text: " + text);
    await settle(wait);
  }
  async type(selector, value, { wait = 250 } = {}) {
    const ok = await this.c.eval(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false;
      el.focus(); el.value = ${JSON.stringify(value)}; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
    if (!ok) throw new Error("no input: " + selector);
    await settle(wait);
  }
  async upload(selector, files, { wait = 450 } = {}) { await this.c.setFiles(selector, files); await settle(wait); }
  async scrollTo(y) { await this.c.eval(`window.scrollTo(0, ${y})`); await settle(150); }
  exists(selector) { return this.c.eval(`!!document.querySelector(${JSON.stringify(selector)})`); }
  text(selector = "body") { return this.c.eval(`(document.querySelector(${JSON.stringify(selector)}) || {}).textContent || ""`); }

  /* the screenshot: what the user sees at 390 × 844. A modal or open drawer is
     captured at the viewport only (the overlay is what is on screen). A page
     with a fixed bottom bar is captured at the viewport too, plus a secondary
     full-length ".scroll.png" so nothing below the fold is lost. Any other
     page taller than the phone is captured full-length — never cropped. */
  async shot(path, { maxHeight = 6400, focus = null } = {}) {
    mkdirSync(dirname(path), { recursive: true });
    /* every step here is driven by script, and Chrome paints its focus ring
       for script-moved focus the way it does for a keyboard — so the close
       button a sheet focuses when it opens wore a black ring in 28 pictures
       that a finger tap never shows (measured 2026-09-18 on the scanner: by
       touch, no ring on any step; by script, a ring on every title that took
       focus). Clear a keyboard-only ring before the picture; a text field
       keeps its focus, which a phone does show. */
    await this.c.eval(`(() => { const a = document.activeElement;
      if (a && a !== document.body && a.matches(":focus-visible") && !a.matches("input:not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable]:not([contenteditable=false])")) a.blur(); })()`);
    /* a step may name the element that changed; on a fixed-bar page the
       viewport shot then shows that region (a user would have scrolled to it) */
    if (focus) await this.c.eval(`(() => { const el = document.querySelector(${JSON.stringify(focus)}); if (el) el.scrollIntoView({ block: "center" }); })()`);
    else await this.c.eval(`window.scrollTo(0, 0)`);
    await settle(200);
    const m = await this.c.eval(`(() => {
      const H = ${VIEWPORT.height};
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
      /* a kit sheet is up when its scrim shows */
      const overlay = !!document.querySelector("#modalBack") || !!document.querySelector(".drawer.open") || [...document.querySelectorAll(".rp-scrim")].some(vis);
      let fixedBar = false;
      for (const el of document.querySelectorAll("body *")) {
        if (!vis(el)) continue;
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed") continue;
        if (el.matches(".appbar, #toast, .drawer, .drawer-overlay, #modalBack") || el.closest("#modalBack")) continue;
        const r = el.getBoundingClientRect();
        if (r.top < H && r.bottom > 0 && r.height < H * 0.6) { fixedBar = true; break; }
      }
      const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, H);
      /* the kit's screens (v022.25) are one phone-high shell that scrolls inside .rp-page, under a dock drawn over its
         foot, so the document is never taller than the phone: what .rp-page hides below is measured here */
      const page = [...document.querySelectorAll(".rp-page")].find((el) => vis(el) && /(auto|scroll)/.test(getComputedStyle(el).overflowY));
      const inner = page ? Math.max(0, page.scrollHeight - page.clientHeight) : 0;
      return { overlay, fixedBar, height, inner };
    })()`);
    const out = { width: VIEWPORT.width, height: VIEWPORT.height, scroll: null, pageHeight: m.height + (m.overlay ? 0 : m.inner), overlay: m.overlay, fixedBar: m.fixedBar };
    /* the clip is in document coordinates — a focused (scrolled) viewport shot
       starts at the current scroll offset, so sticky/fixed chrome lands where
       the user sees it */
    const top = focus ? await this.c.eval(`window.scrollY`) : 0;
    if (!m.overlay && m.inner > 4) {
      /* a kit screen longer than the phone: the picture is what the phone shows (scrolled to the focus, when a step
         names one), and a full-length ".scroll.png" shows the rest. The phone is made as tall as the page for it, so
         the shell lays everything out at once, the dock at its foot; then it goes back to 390 × 844 */
      await this.c.shot(path, { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height });
      const sp = path.slice(0, -4) + ".scroll.png", full = Math.min(VIEWPORT.height + m.inner, maxHeight);
      const was = await this.c.eval(`(() => { const p = [...document.querySelectorAll(".rp-page")].find((el) => el.getBoundingClientRect().height > 0); if (!p) return 0; const t = p.scrollTop; p.scrollTop = 0; return t; })()`);
      /* the phone goes back to 390 × 844 and the page to where it was even when the resize or the picture throws,
         so a failed picture never leaves every screen after it tall (CodeRabbit on #221) */
      try {
        await this.c.setViewport(VIEWPORT.width, full); await settle(350);
        await this.c.shot(sp, { x: 0, y: 0, width: VIEWPORT.width, height: full });
      } finally {
        await this.c.setViewport(VIEWPORT.width, VIEWPORT.height); await settle(250);
        await this.c.eval(`(() => { const p = [...document.querySelectorAll(".rp-page")].find((el) => el.getBoundingClientRect().height > 0); if (p) p.scrollTop = ${Number(was) || 0}; })()`);
      }
      out.scroll = sp;
    } else if (m.overlay || m.height <= VIEWPORT.height) {
      await this.c.shot(path, { x: 0, y: top, width: VIEWPORT.width, height: VIEWPORT.height });
    } else if (m.fixedBar) {
      await this.c.shot(path, { x: 0, y: top, width: VIEWPORT.width, height: VIEWPORT.height });
      const sp = path.slice(0, -4) + ".scroll.png";
      await this.c.shot(sp, { x: 0, y: 0, width: VIEWPORT.width, height: Math.min(m.height, maxHeight) });
      out.scroll = sp;
    } else {
      out.height = Math.min(m.height, maxHeight);
      await this.c.shot(path, { x: 0, y: 0, width: VIEWPORT.width, height: out.height });
    }
    return out;
  }

  /* automated visual checks, read from the live DOM at capture time. These are
     hints for the audit, not verdicts — every flagged screen is eyeballed. */
  async checks() {
    const result = await this.c.eval(`(() => {
      const W = ${VIEWPORT.width}, H = ${VIEWPORT.height};
      const out = { hOverflow: 0, offscreen: [], tinyTargets: [], clipped: [], overlaps: [], sheetFit: [], lowContrast: [], holes: [], dupIds: [], brokenImages: [] };
      out.hOverflow = Math.max(0, document.documentElement.scrollWidth - W);
      const drawerOpen = !!document.querySelector(".drawer.open"), modal = document.querySelector("#modalBack");
      const scope = modal ? modal : (drawerOpen ? document.querySelector(".drawer") : document.body);
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        if (!(r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0")) return false;
        if (!drawerOpen && el.closest(".drawer")) return false; /* off-canvas by design */
        if (el.matches("select[data-ui], input[type=radio], input[type=checkbox]") || el.closest("[data-ui]")) return false; /* enhanced controls: the visible twin is measured */
        if (el.matches("#toast")) return false;
        return !!el.closest(scope === document.body ? "body" : (modal ? "#modalBack" : ".drawer")) ; };
      const label = (el) => (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\\s+/).slice(0,2).join(".") : "") + " " + ((el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 28));
      for (const el of document.querySelectorAll("body *")) {
        if (!vis(el)) continue;
        const r = el.getBoundingClientRect();
        if (el.closest(".tbl-scroll, .props-grid, .reg-card, .prop-card, .ptiles, .sa-thumbs")) continue; /* intentional horizontal scrollers */
        if ((r.right > W + 1 || r.left < -1) && r.width < 5000) out.offscreen.push(label(el) + " [" + Math.round(r.left) + ".." + Math.round(r.right) + "]");
      }
      for (const el of document.querySelectorAll("button, a[href], input:not([type=hidden]), select, [role=button], summary")) {
        if (!vis(el)) continue;
        if (el.closest(".dr-debug")) continue;
        const r = el.getBoundingClientRect();
        if (r.height < 36 || r.width < 36) out.tinyTargets.push(label(el) + " " + Math.round(r.width) + "x" + Math.round(r.height));
      }
      for (const el of document.querySelectorAll("body *")) {
        if (!vis(el)) continue;
        const cs = getComputedStyle(el);
        if ((cs.overflowX === "hidden" || cs.overflowX === "clip" || cs.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 2 && /\\S/.test(el.textContent || "") && !el.matches("input,textarea,select"))
          out.clipped.push(label(el) + " " + el.scrollWidth + ">" + el.clientWidth);
      }
      /* text-vs-text overlap among leaf elements with their own text. Each
         rect is first clipped to every scrolling ancestor (overflow auto /
         scroll / hidden): text scrolled under a dialog's pinned footer is not
         on screen, so it cannot overlap the footer's buttons. */
      const clipTo = (el, r) => { let p = el.parentElement; let c = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        while (p && p !== document.body) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(cs.overflowY + cs.overflowX)) { const pr = p.getBoundingClientRect(); c = { left: Math.max(c.left, pr.left), top: Math.max(c.top, pr.top), right: Math.min(c.right, pr.right), bottom: Math.min(c.bottom, pr.bottom) }; } p = p.parentElement; }
        return { left: c.left, top: c.top, right: c.right, bottom: c.bottom, width: c.right - c.left, height: c.bottom - c.top }; };
      const leaves = [...document.querySelectorAll("body *")].filter(el => vis(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && !el.closest(".dr-debug"));
      const rects = leaves.map(el => ({ el, r: clipTo(el, el.getBoundingClientRect()) })).filter(x => x.r.width > 2 && x.r.height > 2 && x.r.top < 4000);
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const ix = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const iy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (ix > 4 && iy > 4) out.overlaps.push(label(a.el) + " <> " + label(b.el));
      }
      /* a sheet fits the screen: its top is on the screen, or it scrolls inside itself; and its Close is on the screen. A kit sheet has no height limit,
         so one taller than the phone clips at the top, where its title and its Close are (W-151) */
      for (const sh of document.querySelectorAll(".rp-sheet")) {
        if (sh.hidden || !vis(sh)) continue;
        const r = sh.getBoundingClientRect(), cs = getComputedStyle(sh), x = sh.querySelector(".rp-sheet__close"), xr = x ? x.getBoundingClientRect() : null;
        const scrolls = /(auto|scroll)/.test(cs.overflowY) && cs.maxHeight !== "none";
        if (r.top < -1 && !scrolls) out.sheetFit.push(label(sh) + " top " + Math.round(r.top) + ", height " + Math.round(r.height) + " on a " + H + " screen" + (xr && xr.bottom <= 0 ? ", its Close is above the screen" : ""));
        else if (xr && (xr.bottom <= 0 || xr.top >= H)) out.sheetFit.push(label(sh) + " its Close is off the screen (" + Math.round(xr.top) + ")");
      }
      /* text contrast (WCAG 2.x): each visible text element's colour against the first opaque background behind it, 4.5:1, or 3:1 for large text (24px, or 18.66px bold).
         Text on a gradient is measured against the colours under the text itself; text on an image is not measured; disabled controls are exempt, as WCAG exempts them. */
      const rgbOf = (s) => { if (!s || s.indexOf("(") < 0) return null; const p = s.slice(s.indexOf("(") + 1, s.lastIndexOf(")")).split(",").map(x => parseFloat(x)); if (p.length < 3 || p.some(x => Number.isNaN(x))) return null; return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
      const ratio = (x, y) => { const p = lum(x), q = lum(y); return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05); };
      const mix = (f, g) => ({ r: f.r * f.a + g.r * (1 - f.a), g: f.g * f.a + g.g * (1 - f.a), b: f.b * f.a + g.b * (1 - f.a), a: 1 });
      const hex = (c) => "#" + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
      const sheetUp = [...document.querySelectorAll(".rp-sheet")].find(x => !x.hidden && vis(x));
      const under = (el) => {
        const layers = [];
        for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
          /* a video, a photo or a canvas drawn behind the text: what is under it cannot be read from the page */
          if ([...p.children].some(ch => /^(VIDEO|IMG|CANVAS|PICTURE)$/i.test(ch.tagName) && ch !== el && !ch.contains(el) && getComputedStyle(ch).position === "absolute")) return null;
          const cs = getComputedStyle(p), img = cs.backgroundImage;
          if (img && img !== "none") {
            if (img.indexOf("gradient(") < 0) return null;
            const stops = []; let i = 0; while ((i = img.indexOf("rgb", i)) >= 0) { const j = img.indexOf(")", i); const c = rgbOf(img.slice(i, j + 1)); if (c) stops.push(c); i = j; }
            if (!stops.length || stops.some(s => s.a < 0.98) || layers.length) return null; /* a see-through stop, or a translucent layer over a gradient: not measured */
            return { stops, box: p.getBoundingClientRect() };
          }
          const c = rgbOf(cs.backgroundColor);
          if (c && c.a > 0.98) { let base = c; for (let k = layers.length - 1; k >= 0; k--) base = mix(layers[k], base); return { color: base }; }
          if (c && c.a > 0.02) layers.push(c);
        }
        let base = { r: 255, g: 255, b: 255, a: 1 }; for (let k = layers.length - 1; k >= 0; k--) base = mix(layers[k], base);
        return { color: base };
      };
      const seenPairs = new Set();
      for (const el of document.querySelectorAll("body *")) {
        if (!vis(el) || (sheetUp && !sheetUp.contains(el)) || el.closest(".dr-debug, .sr-only, [aria-hidden=true]") || el.matches(":disabled") || el.closest("[aria-disabled=true]")) continue;
        if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
        const cs = getComputedStyle(el), fg = rgbOf(cs.color); if (!fg || fg.a < 0.2) continue; /* a nearly clear colour is decoration, a watermark */
        const bg = under(el); if (!bg) continue;
        const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700, large = size >= 24 || (size >= 18.66 && bold), need = large ? 3 : 4.5;
        let worst = Infinity, where = "";
        if (bg.color) { worst = ratio(mix(fg, bg.color), bg.color); where = hex(bg.color); }
        else {
          const rg = document.createRange(); rg.selectNodeContents(el); const tr = rg.getBoundingClientRect(), w = bg.box.width || 1, n = bg.stops.length;
          const t0 = Math.min(1, Math.max(0, (tr.left - bg.box.left) / w)), t1 = Math.min(1, Math.max(0, (tr.right - bg.box.left) / w));
          for (let k = 0; k <= 10; k++) {
            const u = t0 + (t1 - t0) * k / 10, pos = u * (n - 1), i0 = Math.min(Math.max(n - 2, 0), Math.floor(pos)), f = n > 1 ? pos - i0 : 0, a0 = bg.stops[i0], b0 = bg.stops[Math.min(n - 1, i0 + 1)];
            const c = { r: a0.r + (b0.r - a0.r) * f, g: a0.g + (b0.g - a0.g) * f, b: a0.b + (b0.b - a0.b) * f, a: 1 }; const r = ratio(mix(fg, c), c); if (r < worst) { worst = r; where = hex(c); }
          }
        }
        if (worst < need) { const key = hex(fg) + ">" + where + ">" + size + bold; if (seenPairs.has(key)) continue; seenPairs.add(key); out.lowContrast.push(label(el) + " | " + hex(fg) + " on " + where + (bg.stops ? " (gradient, worst under the text)" : "") + " | " + worst.toFixed(2) + ":1, needs " + need + " | " + size + "px" + (bold ? " bold" : "")); }
      }
      /* a hole in the words: text that shows a value the page failed to make, "$NaN", "undefined", "null", "Infinity", "[object Object]" (DK-054's "Amount financed $NaN" was on a screen
         for weeks). Whole words only, so "Nullify" is not one. The regex's backslashes are doubled: this is a template literal, and a lone \\b would be a backspace. */
      const HOLE = /\\b(undefined|NaN|null|Infinity)\\b|\\[object \\w+\\]/;
      for (const el of document.querySelectorAll("body *")) {
        if (out.holes.length >= 4) break;
        if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.tagName) || !vis(el)) continue;
        let s = ""; for (const n of el.childNodes) if (n.nodeType === 3) s += n.textContent + " ";
        if (/^(INPUT|TEXTAREA)$/.test(el.tagName) && el.type !== "password") s += " " + (el.value || "");
        const t = s.replace(/\\s+/g, " ").trim(), m = HOLE.exec(t);
        if (m) out.holes.push(label(el) + " | " + t.slice(Math.max(0, m.index - 24), m.index + 36));
      }
      /* two elements with one id: a label points at the wrong field, a link scrolls to the wrong place, and a script's getElementById finds only the first */
      const idCount = new Map(); for (const el of document.querySelectorAll("[id]")) if (el.id) idCount.set(el.id, (idCount.get(el.id) || 0) + 1);
      for (const [id, n] of idCount) if (n > 1) out.dupIds.push("#" + id + " x" + n);
      /* a picture that did not load: the browser's broken-image box, or an img with no source */
      for (const im of document.querySelectorAll("img")) { if (!vis(im)) continue; if ((im.complete && im.naturalWidth === 0) || !im.getAttribute("src")) out.brokenImages.push(label(im) + " | " + (im.getAttribute("src") || "no src").slice(0, 60)); }
      out.offscreen = out.offscreen.slice(0, 8); out.tinyTargets = out.tinyTargets.slice(0, 12); out.clipped = out.clipped.slice(0, 8); out.overlaps = out.overlaps.slice(0, 8); out.sheetFit = out.sheetFit.slice(0, 4); out.lowContrast = out.lowContrast.slice(0, 8);
      out.holes = out.holes.slice(0, 4); out.dupIds = out.dupIds.slice(0, 6); out.brokenImages = out.brokenImages.slice(0, 4);
      return out;
    })()`);
    result.unnamed = await this.unnamedControls();
    /* what the page logged as an error since the last screen: an uncaught exception, console.error, a resource that did not load (the browser's own log) */
    result.console = this.takeErrors();
    return result;
  }

  /* the errors logged since they were last taken, once each, and the log emptied: by checks() for its screen, and by the
     capture for a step that failed before its screen was checked, so they are that step's and never the next screen's */
  takeErrors() {
    return this.errors ? this.errors.splice(0).filter((e, i, all) => all.indexOf(e) === i).slice(0, 6) : [];
  }
  /* a control a screen reader meets with no name (LS-124): a button, link, field or other control the browser's accessibility tree gives no name, on the screen and not in a
     closed drawer (an open drawer is on the screen, and its controls are audited: CodeRabbit on #260). Read from the tree, not from the markup, so a name from a label, an aria attribute or the text inside all count. */
  async unnamedControls() {
    const ROLES = new Set(["button", "link", "textbox", "searchbox", "combobox", "checkbox", "radio", "switch", "tab", "menuitem", "slider", "spinbutton", "listbox", "option"]);
    await this.c.send("Accessibility.enable");
    /* a tree the browser cannot give is the audit's failure, not a nameless control: nothing here catches it, so capture.mjs records the screen's step as capture-failed, with the reason */
    const { nodes } = await this.c.send("Accessibility.getFullAXTree");
    const out = []; let tried = 0, lost = 0;
    for (const n of nodes) {
      if (n.ignored || !n.role || !ROLES.has(n.role.value) || !n.backendDOMNodeId) continue;
      if (((n.name && n.name.value) || "").trim()) continue;
      tried++;
      try {
        const { object } = await this.c.send("DOM.resolveNode", { backendNodeId: n.backendDOMNodeId });
        const r = await this.c.send("Runtime.callFunctionOn", { objectId: object.objectId, returnByValue: true, functionDeclaration: "function () { const b = this.getBoundingClientRect(); if (this.closest('.drawer:not(.open), [hidden]') || !(b.width > 0 && b.height > 0)) return null; return this.tagName.toLowerCase() + (this.id ? '#' + this.id : '') + (typeof this.className === 'string' && this.className ? '.' + this.className.trim().split(/\\s+/)[0] : '') + ' (' + n.role + ')'; }".replace("n.role", JSON.stringify(n.role.value)) });
        if (r.result && r.result.value) out.push(r.result.value);
      } catch { lost++; } /* one node the browser cannot resolve (detached since the tree was read, or in another frame) costs that node, not the screen's whole list */
    }
    /* but every candidate lost is a tool that cannot see the page, not a page with nothing wrong */
    if (tried && lost === tried) throw new Error(`the accessibility tree named ${tried} control(s) without a name and none could be looked up in the page`);
    return out.slice(0, 8);
  }


  /* fixtures: coloured squares for document uploads (the app's verification
     is simulated and reads nothing from a photo — see architecture invariant 4) */
  fixtures() {
    mkdirSync(FIXTURES, { recursive: true });
    const out = [];
    [[220, 40, 40], [40, 160, 60], [40, 80, 220], [230, 180, 40], [150, 60, 200]].forEach((rgb, i) => {
      const p = join(FIXTURES, `photo${i + 1}.png`); if (!existsSync(p)) makePng(p, ...rgb, 48); out.push(p);
    });
    return out;
  }
}

export const pad2 = (n) => String(n).padStart(2, "0");
export { settle, writeFileSync, mkdirSync, existsSync, join };

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
  constructor({ http = 8466, cdp = 9366 } = {}) { this.http = http; this.cdp = cdp; this.base = `http://127.0.0.1:${http}/`; }

  async open() {
    this.srv = await staticServer(PORTAL, this.http);
    const { proc, ws } = await launchChrome(this.cdp);
    this.proc = proc;
    this.c = new CDP(ws); await this.c.connect();
    await this.c.openTab(this.base);
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
    await this.c.eval(`(() => { Store.reset(); ${approved ? `Store.deal("d-demo1").creditApp = { approved: true, lender: "US Bank" }; Store.save();` : ""} return true; })()`);
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
  async shot(path, { maxHeight = 3200, focus = null } = {}) {
    mkdirSync(dirname(path), { recursive: true });
    /* a step may name the element that changed; on a fixed-bar page the
       viewport shot then shows that region (a user would have scrolled to it) */
    if (focus) await this.c.eval(`(() => { const el = document.querySelector(${JSON.stringify(focus)}); if (el) el.scrollIntoView({ block: "center" }); })()`);
    else await this.c.eval(`window.scrollTo(0, 0)`);
    await settle(200);
    const m = await this.c.eval(`(() => {
      const H = ${VIEWPORT.height};
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
      const overlay = !!document.querySelector("#modalBack") || !!document.querySelector(".drawer.open");
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
      return { overlay, fixedBar, height };
    })()`);
    const out = { width: VIEWPORT.width, height: VIEWPORT.height, scroll: null, pageHeight: m.height, overlay: m.overlay, fixedBar: m.fixedBar };
    /* the clip is in document coordinates — a focused (scrolled) viewport shot
       starts at the current scroll offset, so sticky/fixed chrome lands where
       the user sees it */
    const top = focus ? await this.c.eval(`window.scrollY`) : 0;
    if (m.overlay || m.height <= VIEWPORT.height) {
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
  checks() {
    return this.c.eval(`(() => {
      const W = ${VIEWPORT.width}, H = ${VIEWPORT.height};
      const out = { hOverflow: 0, offscreen: [], tinyTargets: [], clipped: [], overlaps: [] };
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
      out.offscreen = out.offscreen.slice(0, 8); out.tinyTargets = out.tinyTargets.slice(0, 12); out.clipped = out.clipped.slice(0, 8); out.overlaps = out.overlaps.slice(0, 8);
      return out;
    })()`);
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

/* Ride Price UI Library — the cut board's pictures and data.

   The owner marks screens to keep, change or remove on a published page (board/index.html), one flow at a time,
   every screen in its order with the scenario that draws it. An artifact holds at most 511 files, and the library
   has more screens than that, so each flow's pictures are packed into a few tall JPEG strips (390 px wide, at most
   STRIP_MAX tall, the same width the app is captured at) and the page shows each screen as its slice of a strip.

   Run:  node ride-price-ui-library/tools/board.mjs
   Reads reports/flow-manifest.json and reports/version.json; writes board/sprites/*.jpg and board/board-data.json
   (both ignored by git: rebuilt for every publish) and keeps board/first-seen.json (committed), the library version
   each screen first appeared in, so a screen added later reads "New" on the board. */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { launchChrome, CDP, staticServer } from "../../harness/cdp.mjs";
import { LIB } from "./lib.mjs";

const BOARD = join(LIB, "board");
const SPRITES = join(BOARD, "sprites");
const BUILD = join(BOARD, ".build");
const STRIP_MAX = 12000;   /* a captured page this tall stays well inside Chrome's own screenshot limit */
const WIDTH = 390;
const QUALITY = 85;        /* small text at 1x stays readable */

const manifest = JSON.parse(readFileSync(join(LIB, "reports/flow-manifest.json"), "utf8"));
const version = JSON.parse(readFileSync(join(LIB, "reports/version.json"), "utf8"));
const firstSeenPath = join(BOARD, "first-seen.json");
/* { initial: the version the board started from, screens: { id: that version, or the day a screen was added since } } */
const seen = existsSync(firstSeenPath) ? JSON.parse(readFileSync(firstSeenPath, "utf8")) : { initial: version.version, screens: {} };
const firstSeen = seen.screens;
const initial = Object.keys(firstSeen).length === 0;
const ADDED = initial ? seen.initial : new Date().toISOString().slice(0, 10);

/* a PNG's height, from its header */
const pngSize = (file) => { const b = readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

rmSync(SPRITES, { recursive: true, force: true }); rmSync(BUILD, { recursive: true, force: true });
mkdirSync(SPRITES, { recursive: true }); mkdirSync(BUILD, { recursive: true });

/* plan the strips: each flow's screens in order, a new strip when the next picture would pass STRIP_MAX */
const strips = [];
const flows = manifest.flows.map((f) => {
  let strip = null, n = 0;
  const screens = [];
  for (const s of f.screens) {
    if (s.status && s.status !== "ok") continue;
    const rel = s.scrollShot || s.screenshot;
    if (!rel || !existsSync(join(LIB, rel))) continue;
    const { w, h } = pngSize(join(LIB, rel));
    if (w !== WIDTH) throw new Error(`${f.id}/${s.key}: ${w} px wide, the board expects ${WIDTH}`);
    if (!strip || strip.h + h > STRIP_MAX) { strip = { file: `${f.area}-${++n}.jpg`, h: 0, tiles: [] }; strips.push(strip); }
    const id = `${f.id}__${s.key}`;
    if (!firstSeen[id]) firstSeen[id] = ADDED;
    screens.push({
      id, key: s.key, step: s.step, title: s.screen, notes: s.notes || "", action: s.action || "",
      branches: (s.branches || []).map((b) => b.action).filter(Boolean),
      reusedFrom: s.reusedFrom || null, firstSeen: firstSeen[id],
      shot: { sprite: strip.file, top: strip.h, h },
    });
    strip.tiles.push({ src: "/" + rel.split("\\").join("/"), h });
    strip.h += h;
  }
  return { id: f.id, area: f.area, title: f.title, description: f.description || "", screens };
});

/* draw each strip in headless Chrome and keep it as a JPEG */
const PORT = 8467, CDP_PORT = 9367;
const srv = await staticServer(LIB, PORT);
const { proc, ws } = await launchChrome(CDP_PORT);
const c = new CDP(ws); await c.connect();
await c.openTab("about:blank");
try {
  for (const st of strips) {
    const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff}img{display:block;width:${WIDTH}px}</style>`
      + st.tiles.map((t) => `<img src="${t.src}" width="${WIDTH}" height="${t.h}">`).join("");
    const page = join(BUILD, st.file.replace(/\.jpg$/, ".html"));
    writeFileSync(page, html);
    await c.setViewport(WIDTH, Math.min(st.h, 2000));
    await c.goto(`http://127.0.0.1:${PORT}/board/.build/${st.file.replace(/\.jpg$/, ".html")}`);
    const ok = await c.eval(`Promise.all([...document.images].map((i) => i.decode().then(() => i.naturalHeight > 0, () => false))).then((r) => r.every(Boolean))`);
    if (!ok) throw new Error(`${st.file}: a picture did not load`);
    const { data } = await c.send("Page.captureScreenshot", { format: "jpeg", quality: QUALITY, captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: WIDTH, height: st.h, scale: 1 } });
    writeFileSync(join(SPRITES, st.file), Buffer.from(data, "base64"));
  }
} finally {
  try { await c.send("Browser.close", {}, false); } catch { /* already gone */ }
  try { proc.kill(); } catch { /* already gone */ }
  srv.close();
  rmSync(BUILD, { recursive: true, force: true });
}

const data = { library: version.version, appCommit: manifest.appCommit, capturedAt: manifest.capturedAt,
  builtAt: new Date().toISOString(), initialVersion: seen.initial, flows };
writeFileSync(join(BOARD, "board-data.json"), JSON.stringify(data));
writeFileSync(firstSeenPath, JSON.stringify({ initial: seen.initial, screens: Object.fromEntries(Object.entries(firstSeen).sort()) }, null, 1) + "\n");
const screens = flows.reduce((n, f) => n + f.screens.length, 0);
console.log(`board: ${flows.length} flows, ${screens} screens in ${strips.length} strips → ${BOARD}`);

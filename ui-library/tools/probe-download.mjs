/* Exercise the downloads in headless Chrome: open a flow menu and request
   its PNG and ZIP, then the app bar's whole-library ZIP, and check real files
   land in a temp folder. The archives are then PROVED, not counted: every
   entry's CRC-32 is recomputed over its bytes, the central directory has to
   name every entry walked, and the screenshot bytes have to be the files on
   disk, one for one. Also saves a desktop crop of a flow header for the
   owner to see. */
import { launchChrome, CDP, staticServer } from "../../harness/cdp.mjs";
import { createHash } from "node:crypto";
import { LIB, join } from "./lib.mjs";
import { mkdtempSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
const srv = await staticServer(LIB, 8464);
const { proc, ws } = await launchChrome(9364);
const c = new CDP(ws); await c.connect();
const dl = mkdtempSync(join(tmpdir(), "rp-dl-"));
await c.openTab("http://127.0.0.1:8464/master-flow/index.html");
await c.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: dl, eventsEnabled: true }, false);
await c.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await new Promise(r => setTimeout(r, 1200));
const wait = (ms) => new Promise(r => setTimeout(r, ms));
/* open the menu on the licence-scan flow, then ask for both formats */
await c.eval(`document.querySelector("#home .dl").click()`); await wait(200);
console.log("menu open:", await c.eval(`!document.querySelector("#home .dlmenu").hidden`));
await c.eval(`document.querySelector("#home").scrollIntoView()`); await wait(300);
await c.shot(join(LIB, "tools", "master-download-menu.png"), { x: 0, y: await c.eval("window.scrollY"), width: 1440, height: 520 });
await c.eval(`document.querySelector('#home [data-dl="png"]').click()`);
for (let i = 0; i < 60 && !readdirSync(dl).some(f => f.endsWith(".png")); i++) await wait(250);
await c.eval(`document.querySelector("#home .dl").click()`); await wait(200);
await c.eval(`document.querySelector('#home [data-dl="zip"]').click()`);
for (let i = 0; i < 60 && !readdirSync(dl).some(f => f.endsWith(".zip")); i++) await wait(250);
await wait(800);
const files = readdirSync(dl).map(f => f + " " + statSync(join(dl, f)).size + "B");
console.log("downloads:", JSON.stringify(files));
const err = await c.eval(`(document.querySelector("#home .busy") || {}).textContent || ""`);
console.log("error text:", JSON.stringify(err));
/* lightbox save link */
await c.eval(`document.querySelector("#home .scr .zoom").click()`); await wait(200);
console.log("lightbox save:", await c.eval(`(() => { const a = document.getElementById("lbDl"); return a.getAttribute("download") + " <- " + a.getAttribute("href").split("/").slice(-3).join("/"); })()`));
/* the whole library as one archive, from the app-bar control. The per-flow
   ZIP is unchanged beside it — both are checked below. */
await c.eval(`window.scrollTo(0, 0); document.querySelector(".dl--all").click()`); await wait(200);
console.log("all-menu open:", await c.eval(`!document.querySelector(".dlwrap--all .dlmenu").hidden`));
await c.eval(`document.querySelector('[data-dl="all"]').click()`);
for (let i = 0; i < 400 && !readdirSync(dl).some(f => f.startsWith("ride-price-ui-library-")); i++) await wait(250);
await wait(1200);
console.log("all-note:", JSON.stringify(await c.eval(`(document.querySelector(".dlwrap--all .dlnote") || {}).textContent || ""`)));
proc.kill(); srv.close();
/* validate the bytes, not just the file names: a real PNG with sane dimensions,
   and ZIPs that are sound end to end. Two ZIPs land in the same folder now,
   so the per-flow one is picked by what it is NOT — never by directory order */
import { readFileSync, existsSync } from "node:fs";
const pngName = readdirSync(dl).find(f => f.endsWith(".png"));
const zipName = readdirSync(dl).find(f => f.endsWith(".zip") && !f.startsWith("ride-price-ui-library-"));
if (!pngName || !zipName) { console.log("FAIL: a download is missing"); process.exit(1); }
const png = readFileSync(join(dl, pngName));
const sig = png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
console.log(`png: ${pngName} ${png.length}B signature=${sig} ${w}x${h}`);
if (!sig || w < 390 * 2 || h < 844) { console.log("FAIL: the composed PNG is not a valid multi-screen image"); process.exit(1); }
/* a ZIP walked entry by entry and proved: the CRC-32 in every local header is
   recomputed over the entry's bytes; the end record's count has to agree with
   the entries walked; and every central-directory record — the part a reader
   actually extracts BY — has to agree with the local entry it points at on
   name, CRC, both sizes and offset. A corrupt payload, an archive cut off
   before its directory, or a directory that names a different layout fails
   here instead of counting as present (review, #80). */
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const parseZip = (z) => {
  const entries = []; let off = 0;
  while (off + 30 <= z.length && z.readUInt32LE(off) === 0x04034b50) {
    const crc = z.readUInt32LE(off + 14), sz = z.readUInt32LE(off + 18), n = z.readUInt16LE(off + 26), x = z.readUInt16LE(off + 28);
    const data = z.subarray(off + 30 + n + x, off + 30 + n + x + sz);
    entries.push({ name: z.toString("utf8", off + 30, off + 30 + n), data, crc, size: sz, usize: z.readUInt32LE(off + 22), at: off, crcOk: data.length === sz && crc32(data) === crc });
    off += 30 + n + x + sz;
  }
  /* the end-of-central-directory record closes a comment-less archive with the
     directory's count, size and start; each record in it is then held against
     the local entry at the offset it names */
  const eocd = z.length >= 22 && z.readUInt32LE(z.length - 22) === 0x06054b50 ? z.length - 22 : -1;
  const central = eocd < 0 ? -1 : z.readUInt16LE(eocd + 10);
  const mismatches = [];
  if (eocd >= 0) {
    let c = z.readUInt32LE(eocd + 16), i = 0;
    const cdEnd = c + z.readUInt32LE(eocd + 12);
    while (c + 46 <= z.length && c < cdEnd && z.readUInt32LE(c) === 0x02014b50) {
      const crc = z.readUInt32LE(c + 16), csz = z.readUInt32LE(c + 20), usz = z.readUInt32LE(c + 24), n = z.readUInt16LE(c + 28), x = z.readUInt16LE(c + 30), k = z.readUInt16LE(c + 32), at = z.readUInt32LE(c + 42);
      const name = z.toString("utf8", c + 46, c + 46 + n), e = entries[i];
      if (!e || e.name !== name || e.crc !== crc || e.size !== csz || e.usize !== usz || e.at !== at) mismatches.push(name || ("#" + i));
      c += 46 + n + x + k; i++;
    }
    /* and the walk has to end exactly where the end record says the directory
       ends, which has to be the end record itself: a directory that declares
       a different size than it walks is a different archive (review, #80) */
    if (c !== cdEnd || cdEnd !== eocd) mismatches.push("central directory bounds");
    if (i !== central) mismatches.push("directory walked " + i + " of " + central);
  }
  return { entries, names: entries.map(e => e.name), central, mismatches };
};
const sound = (label, zp) => {
  const bad = zp.entries.filter(e => !e.crcOk).map(e => e.name);
  if (bad.length) { console.log(`FAIL: ${label} — CRC mismatch on ${bad.length} entr${bad.length === 1 ? "y" : "ies"} (${bad.slice(0, 3).join(", ")})`); process.exit(1); }
  if (zp.central !== zp.entries.length) { console.log(`FAIL: ${label} — the central directory names ${zp.central} entries, ${zp.entries.length} were walked (truncated?)`); process.exit(1); }
  if (zp.mismatches.length) { console.log(`FAIL: ${label} — the central directory disagrees with the local entries on ${zp.mismatches.length} record${zp.mismatches.length === 1 ? "" : "s"} (${zp.mismatches.slice(0, 3).join(", ")})`); process.exit(1); }
};
/* the screenshot bytes have to be the files on disk, one for one: the sorted
   digests of the archive's PNG entries must equal the sorted digests of the
   manifest's screenshots — so a wrong, stale or duplicated image cannot pass
   on its name alone */
const sha1 = (b) => createHash("sha1").update(b).digest("hex");
const diskDigests = (flows) => flows.flatMap(f => f.screens.filter(sc => existsSync(join(LIB, sc.screenshot))).map(sc => sha1(readFileSync(join(LIB, sc.screenshot))))).sort();
const zipDigests = (zp) => zp.entries.filter(e => e.name.endsWith(".png")).map(e => sha1(e.data)).sort();
const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const manifest = JSON.parse(readFileSync(join(LIB, "reports", "flow-manifest.json"), "utf8"));
/* the per-flow ZIP: that flow's screenshots plus its README, read from the
   manifest, not remembered — the home flow has grown twice since this said six */
const homeFlow = manifest.flows.find(f => f.id === "home");
const zp = parseZip(readFileSync(join(dl, zipName))); sound(zipName, zp);
const names = zp.names, pngs = names.filter(n => n.endsWith(".png")).length, readme = names.some(n => n.endsWith("/README.md"));
console.log(`zip: ${zipName} ${zp.entries.length} entries pngs=${pngs} readme=${readme} crc=ok central=${zp.central} directory=agrees`);
if (pngs !== homeFlow.screens.length || !readme) { console.log("FAIL: the ZIP does not carry the flow's screenshots plus README.md"); process.exit(1); }
if (!sameList(zipDigests(zp), diskDigests([homeFlow]))) { console.log("FAIL: the per-flow ZIP's screenshot bytes are not the flow's files"); process.exit(1); }
/* the whole-library archive: every screenshot on the page, one README per
   flow, a top-level README, the changelog and the version record */
const allName = readdirSync(dl).find(f => f.startsWith("ride-price-ui-library-") && f.endsWith(".zip"));
if (!allName) { console.log("FAIL: the whole-library ZIP did not land"); process.exit(1); }
const ap = parseZip(readFileSync(join(dl, allName))); sound(allName, ap); const an = ap.names;
const wantShots = manifest.flows.reduce((n, f) => n + f.screens.length, 0), wantFlows = manifest.flows.length;
const root = allName.replace(/\.zip$/, "") + "/";
const aPngs = an.filter(n => n.endsWith(".png")).length, aReadmes = an.filter(n => /\/README\.md$/.test(n) && n.split("/").length === 3).length;
const topReadme = an.includes(root + "README.md"), changelog = an.includes(root + "reports/changelog.md"), verRec = an.includes(root + "reports/version.json");
console.log(`all: ${allName} ${ap.entries.length} entries pngs=${aPngs}/${wantShots} flow-readmes=${aReadmes}/${wantFlows} top-readme=${topReadme} changelog=${changelog} version=${verRec} crc=ok central=${ap.central} directory=agrees`);
if (aPngs !== wantShots || aReadmes !== wantFlows || !topReadme || !changelog || !verRec) { console.log("FAIL: the whole-library ZIP is incomplete"); process.exit(1); }
if (!sameList(zipDigests(ap), diskDigests(manifest.flows))) { console.log("FAIL: the whole-library ZIP's screenshot bytes are not the library's files"); process.exit(1); }
/* and the per-flow ZIP still stands beside it, untouched in shape: EVERY one
   of its entries is inside the archive under the same folder */
const missing = names.filter(n => !an.includes(root + n));
if (missing.length) { console.log("FAIL: the per-flow folder layout is not reproduced inside the whole-library archive (" + missing.slice(0, 3).join(", ") + ")"); process.exit(1); }
console.log("PASS");

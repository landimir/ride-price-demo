/* The automated overlap check is used on every screen the library captures,
   so it has to be right in both directions: text that is scrolled under a
   dialog's pinned footer is NOT an overlap (it is clipped by the scrolling
   body, not on screen), and two texts really drawn on top of each other IS
   one. fixtures/overlap.html holds one of each; this runs Session.checks()
   against it and asserts both outcomes.  node tools/selfcheck.mjs */
import { join } from "node:path";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { Session, FIXTURES } from "./lib.mjs";

/* The fixture is GENERATED, not committed — tools/fixtures/ is gitignored in
   its entirety, so overlap.html has never existed in a fresh clone and this
   file died on its first querySelector: "Cannot read properties of null
   (reading 'offsetTop')". It read as an overlap-detector bug for two sessions
   and was never one; the detector was fine and the fixture was absent. Every
   other fixture here is made on demand (photos, barcode pairs) and this one
   is now too, so the tool runs from a clean checkout.

   The geometry is what the assertions below measure, not decoration:
   .body scrolls and .foot is pinned under it, so the body's clip edge IS the
   footer's top; #second is placed far enough down that scrolling it to the
   edge leaves a 10px sliver on screen while its UNCLIPPED box would still
   cover #save — which is exactly the false positive the detector must not
   report. #textA and #textB are the true positive, two texts drawn on the
   same spot, and they carry no word the "not reported" assertion greps for. */
const OVERLAP_FIXTURE = join(FIXTURES, "overlap.html");
if (!existsSync(OVERLAP_FIXTURE)) {
  mkdirSync(FIXTURES, { recursive: true });
  writeFileSync(OVERLAP_FIXTURE, [
    '<!doctype html><meta charset="utf-8"><title>overlap fixture</title>',
    "<style>",
    "  body { margin: 0; font: 14px/1.4 system-ui, sans-serif; }",
    "  .dialog { width: 320px; height: 240px; margin: 24px; border: 1px solid #ccc; display: flex; flex-direction: column; background: #fff; }",
    "  /* position: relative makes .body the offsetParent, so #second's",
    "     offsetTop is measured in the scrolling content and the scroll maths",
    "     below is the maths the assertions describe */",
    "  .body { position: relative; flex: 1; min-height: 0; overflow-y: auto; padding: 12px; }",
    "  .body p { margin: 0; }",
    "  #first { margin-bottom: 200px; }",
    "  .foot { flex: none; height: 56px; display: flex; align-items: center; justify-content: flex-end; padding: 0 12px; border-top: 1px solid #ccc; background: #fff; }",
    "  #save { height: 36px; padding: 0 16px; font: inherit; }",
    "  .stack { position: relative; margin: 24px; height: 44px; }",
    "  #textA, #textB { position: absolute; left: 0; top: 0; width: 260px; }",
    "</style>",
    '<div class="dialog">',
    '  <div class="body">',
    '    <p id="first">A first paragraph, well above the fold of this scrolling body.</p>',
    '    <p id="second">A paragraph tall enough that its box would cover the pinned button, but the body clips it away long before it gets there.</p>',
    "  </div>",
    '  <div class="foot"><button id="save">Save</button></div>',
    "</div>",
    '<div class="stack"><span id="textA">Two texts drawn on one spot</span><span id="textB">And here is the other one</span></div>',
    "",
  ].join(String.fromCharCode(10)));
  console.log("generated " + OVERLAP_FIXTURE);
}

const s = await new Session({ http: 8467, cdp: 9367 }).open();
let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) { pass++; console.log("  ok   " + label); } else { fail++; console.log("  FAIL " + label); } };

await s.c.goto("file:///" + join(FIXTURES, "overlap.html").replace(/\\/g, "/"));
await s.settle(200);
/* scroll the dialog body so the second paragraph sits under the footer — the
   fixture's geometry, confirmed here rather than assumed */
const geo = await s.eval(`(() => { const b = document.querySelector(".body"), p = document.querySelector("#second"); b.scrollTop = p.offsetTop - b.clientHeight + 10; const pr = p.getBoundingClientRect(); const f = document.querySelector(".foot").getBoundingClientRect(); const btn = document.querySelector("#save").getBoundingClientRect(); const body = b.getBoundingClientRect(); return { pTop: pr.top, pBottom: pr.bottom, fTop: f.top, btnTop: btn.top, btnBottom: btn.bottom, bodyBottom: body.bottom }; })()`);
ok(geo.pTop < geo.fTop && geo.pBottom > geo.btnTop + 8, `the control: unclipped, the second paragraph's box would cover the Save button (p ${Math.round(geo.pTop)}–${Math.round(geo.pBottom)}, button ${Math.round(geo.btnTop)}–${Math.round(geo.btnBottom)})`);
ok(geo.bodyBottom <= geo.fTop + 1, "and the body's clip edge is the footer's top");

const out = await s.checks();
const ov = out.overlaps;
ok(ov.length === 1, `exactly one overlap reported (${ov.length}): ${ov.join(" | ")}`);
ok(ov.some(x => x.includes("textA") && x.includes("textB")), "it is the two texts drawn on top of each other");
ok(!ov.some(x => /Save|second|Second/.test(x)), "text scrolled under the pinned footer is not reported");

/* The barcode fixture cache, and the regression the review asked for.

   Two defects have now been filed against this cache. First it returned a
   BLANK image (the generator screenshotted an element the training-documents
   hub had made invisible) and its own guard could not fire, because a
   zero-sized rect is still an object. Then the fix for that trusted any file
   over 800 bytes, so a perfectly good image captured the OLD way — from the
   props page rather than the pair's preview — was reused as though it were
   the new one. A shared version stamp beside the files did not settle it
   either: written after the first successful capture, it marked the whole
   directory current and every later prop reused its stale file.

   The version now lives in the filename, so an out-of-date fixture is a file
   nobody asks for and no ordering can defeat it. This asserts exactly the
   case the review named: two OLD, valid-SIZE fixtures on disk must not be
   reachable. */
console.log("\nthe barcode fixture cache ignores anything captured the old way");
{
  const { fixtureName } = await import("./flows.mjs");
  const { FIXTURES } = await import("./lib.mjs");
  const { writeFileSync: wf, existsSync: ex, mkdirSync: mk, rmSync: rm } = await import("node:fs");
  const { join: j } = await import("node:path");
  mk(FIXTURES, { recursive: true });
  /* two plausible leftovers from the previous capture path: right size, right
     name for that era, wrong provenance */
  const legacy = [j(FIXTURES, "prop2-barcode.png"), j(FIXTURES, "prop3-barcode.png")];
  legacy.forEach(f => wf(f, Buffer.alloc(2400, 7)));
  ok(legacy.every(f => ex(f)), "two old valid-size fixtures are on disk");
  const wanted = [2, 3].map(n => j(FIXTURES, fixtureName(n)));
  ok(wanted.every(f => !legacy.includes(f)),
    `the generator asks for a different file now (${fixtureName(2)})`);
  ok(fixtureName(2).includes("2026-09-02-preview-pair"),
    "and that name carries the capture version, so it cannot collide with the old one");
  ok(fixtureName(2) !== fixtureName(3), "each prop keeps its own fixture");
  legacy.forEach(f => rm(f, { force: true }));
}


/* A STEP THAT DID NOT ADVANCE ships as a screenshot of the previous state,
   and nothing in the pipeline noticed. v019 published "Both sides received"
   as a byte-for-byte copy of "Front received, back needed": the step used
   s.go(), which reloads, and the captured photos live only in memory, so the
   front was wiped and the shot re-took the earlier screen.

   Two identical files inside one flow is that failure with no innocent
   explanation — a genuinely repeated screen declares `reusedFrom`. Checking
   the bytes needs no knowledge of what any screen should look like, which is
   why it can be trusted on flows nobody is reading today. */
console.log("\nno step in a flow silently re-shoots the state before it");
{
  const { createHash } = await import("node:crypto");
  const { readFileSync: rf, existsSync: ex } = await import("node:fs");
  const { CURRENT: CUR, REPORTS: REP } = await import("./lib.mjs");
  const { join: j } = await import("node:path");
  const man = JSON.parse(rf(j(REP, "flow-manifest.json"), "utf8"));
  const dups = [], missing = [];
  for (const f of man.flows) {
    const seen = new Map();
    for (const sc of f.screens) {
      const p = j(CUR, "..", sc.screenshot);
      if (!ex(p)) { missing.push(`${f.id}/${sc.key}`); continue; }
      /* the primary PNG is the 844px viewport crop. A step whose only change
         lands BELOW the fold — a box ticked far down a long form under a
         fixed bar — would leave that crop identical while the full-page
         .scroll.png differs, and a hash of the crop alone would call it a
         duplicate. Fold the scroll variant into the hash when there is one,
         so "identical" means identical all the way down. */
      const scroll = p.replace(/.png$/, ".scroll.png");
      const h = createHash("md5").update(rf(p)).update(ex(scroll) ? rf(scroll) : Buffer.alloc(0)).digest("hex");
      /* reusedFrom is the one licence to repeat an image, so it has to NAME
         the screen being reused and that screen has to be the identical one.
         A typo, a forward reference, or a pointer at some unrelated step
         would otherwise wave any duplicate through (review find). */
      const excused = sc.reusedFrom && seen.get(h) === String(sc.reusedFrom).split("/").pop();
      if (seen.has(h) && !excused) dups.push(`${f.id}: ${seen.get(h)} and ${sc.key} are the same image${sc.reusedFrom ? ` (reusedFrom names "${sc.reusedFrom}", which is not it)` : ""}`);
      else if (!seen.has(h)) seen.set(h, sc.key);
    }
  }
  ok(man.flows.length > 0 && !missing.length, `every screenshot the manifest names is on disk (${man.flows.length} flows${missing.length ? ", missing " + missing.join(", ") : ""})`);
  ok(!dups.length, dups.length ? `QA: ${dups.join(" | ")}` : "no flow shows the same image twice without declaring a reused screen");
}
console.log(`\n${pass} passed, ${fail} failed`);
await s.close();
if (fail) process.exit(1);

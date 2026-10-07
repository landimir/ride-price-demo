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

/* W-151, the Deal summary sheet: a kit sheet has no height limit, so one taller than the phone clips at the top, where its title and its Close are, and nothing scrolls it.
   The library flagged nothing for two versions. The check reads a visible .rp-sheet whose top is above the screen and which does not scroll inside itself, or whose Close is off the
   screen. Three sheets, one at a time: the tall one must be reported, the one that fits and the tall one that scrolls must not. */
console.log("\nthe sheet-fit check");
{
  const SHEETFIT = join(FIXTURES, "sheetfit.html");
  mkdirSync(FIXTURES, { recursive: true });
  writeFileSync(SHEETFIT, [
    '<!doctype html><meta charset="utf-8"><title>sheet fit fixture</title>',
    "<style>",
    "  body { margin: 0; font: 14px/1.4 system-ui, sans-serif; background: #f2f2f7; }",
    "  .screen { position: relative; width: 390px; height: 844px; overflow: hidden; }",
    "  .rp-sheet { position: absolute; left: 0; right: 0; bottom: 0; background: #fff; }",
    "  .rp-sheet__close { position: absolute; right: 12px; top: 12px; width: 32px; height: 32px; }",
    "  .rp-sheet p { margin: 0; padding: 12px 16px; }",
    "  #tall .fill { height: 1000px; } #fits .fill { height: 300px; } #scrolls { max-height: 700px; overflow-y: auto; } #scrolls .fill { height: 1000px; }",
    "</style>",
    '<div class="screen">',
    '  <div class="rp-sheet" id="tall" hidden><button class="rp-sheet__close" aria-label="Close"></button><p>A sheet taller than the screen</p><div class="fill"></div></div>',
    '  <div class="rp-sheet" id="fits" hidden><button class="rp-sheet__close" aria-label="Close"></button><p>A sheet that fits</p><div class="fill"></div></div>',
    '  <div class="rp-sheet" id="scrolls" hidden><button class="rp-sheet__close" aria-label="Close"></button><p>A tall sheet that scrolls inside itself</p><div class="fill"></div></div>',
    "</div>",
    ""
  ].join(String.fromCharCode(10)));
  await s.c.goto("file:///" + SHEETFIT.replace(/\\/g, "/"));
  await s.settle(200);
  const show = async (id) => { await s.eval('document.querySelectorAll(".rp-sheet").forEach((e) => { e.hidden = e.id !== ' + JSON.stringify(id) + '; }); true'); return (await s.checks()).sheetFit; };
  const tall = await show("tall"), fits = await show("fits"), scrolls = await show("scrolls");
  ok(tall.length === 1 && /top -\d+/.test(tall[0]) && /Close is above the screen/.test(tall[0]), "a sheet taller than the screen is reported, with its Close above the screen: " + tall.join(" | "));
  ok(fits.length === 0, "a sheet that fits is not reported");
  ok(scrolls.length === 0, "a tall sheet that scrolls inside itself is not reported");
}

/* text contrast (LS-122): WCAG 2.x. The kit's own gradient, #FF7A00 to #FF0055, under white text is 2.6:1 at its orange end; the scanner's darker one, #B85400 to #D60047, passes. */
console.log("\nthe text-contrast check");
{
  const CONTRAST = join(FIXTURES, "contrast.html");
  writeFileSync(CONTRAST, [
    '<!doctype html><meta charset="utf-8"><title>contrast fixture</title>',
    "<style>",
    "  body { margin: 0; font: 16px/1.4 system-ui, sans-serif; background: #fff; }",
    "  .t { padding: 8px 16px; }",
    "  #low { color: #aaaaaa; } #ok { color: #333333; } #big { color: #888888; font-size: 28px; }",
    "  .g { width: 220px; padding: 12px; text-align: center; color: #fff; font-weight: 700; font-size: 15px; border: 0; margin: 8px 16px; display: block; }",
    "  #kit { background: linear-gradient(100deg, #ff7a00, #ff0055); } #dark { background: linear-gradient(100deg, #b85400, #d60047); }",
    "  #off { background: linear-gradient(100deg, #ff7a00, #ff0055); opacity: .32; }",
    "</style>",
    '<div class="t" id="low">Pale grey text on white</div><div class="t" id="ok">Dark text on white</div><div class="t" id="big">Large pale text</div>',
    '<button class="g" id="kit">The kit gradient</button><button class="g" id="dark">The darker gradient</button><button class="g" id="off" disabled>A disabled button</button>',
    ""
  ].join(String.fromCharCode(10)));
  await s.c.goto("file:///" + CONTRAST.replace(/\\/g, "/"));
  await s.settle(200);
  const low = (await s.checks()).lowContrast;
  const named = (id) => low.filter((x) => x.includes("#" + id));
  ok(named("low").length === 1 && /2\.3\d:1, needs 4\.5/.test(named("low")[0]), "pale grey on white is reported at 2.3:1 against 4.5:1: " + named("low").join(" | "));
  ok(named("ok").length === 0, "dark text on white is not reported");
  ok(named("big").length === 0, "28px text at 3.5:1 is held to 3:1 and passes");
  ok(named("kit").length === 1 && /gradient/.test(named("kit")[0]), "white text on the kit's gradient is reported, measured under the text: " + named("kit").join(" | "));
  ok(named("dark").length === 0, "white text on the scanner's darker gradient is not reported");
  ok(named("off").length === 0, "a disabled control is exempt");
}

/* LS-124: a screen reader meets a button with no name as "button". The check reads the browser's accessibility tree, so a name from aria-label, from the text inside or from a
   label all count, and a control with none of them is reported. */
console.log("\nthe unnamed-control check");
{
  const UNNAMED = join(FIXTURES, "unnamed.html");
  writeFileSync(UNNAMED, [
    '<!doctype html><meta charset="utf-8"><title>unnamed fixture</title>',
    "<style>button, input, a { display: block; margin: 8px; min-width: 60px; min-height: 40px; }</style>",
    '<button id="bare"></button>',
    '<button id="aria" aria-label="Close"></button>',
    '<button id="text">Take photo</button>',
    '<label for="field">Contact</label><input id="field">',
    '<input id="loose">',
    '<a id="link" href="#x">Back to resolver</a>',
    ""
  ].join(String.fromCharCode(10)));
  await s.c.goto("file:///" + UNNAMED.replace(/\\/g, "/"));
  await s.settle(200);
  const un = (await s.checks()).unnamed;
  ok(un.length === 2 && un.some((x) => x.includes("#bare")) && un.some((x) => x.includes("#loose")), "a button and a field with no name are reported, and only those: " + un.join(" | "));
  /* the audit's own failures (CodeRabbit on #257): one node the browser cannot resolve costs that node, not the list; a tree it cannot give stops the screen's capture with the reason and is
     never drawn as a nameless control; and every candidate lost is a failure too, never "nothing wrong" */
  const real = s.c.send.bind(s.c);
  const under = async (stub) => { s.c.send = stub; try { return { got: await s.unnamedControls() }; } catch (e) { return { err: String(e && e.message || e) }; } finally { s.c.send = real; } };
  let resolves = 0;
  const one = await under((m, p, ...r) => (m === "DOM.resolveNode" && resolves++ === 0) ? Promise.reject(new Error("no such node")) : real(m, p, ...r));
  ok(one.got && one.got.length === 1 && one.got[0].includes("#loose"), "one node the browser cannot resolve is skipped, and the other nameless control is still reported: " + JSON.stringify(one));
  const noTree = await under((m, p, ...r) => m === "Accessibility.getFullAXTree" ? Promise.reject(new Error("tree unavailable")) : real(m, p, ...r));
  ok(noTree.err && /tree unavailable/.test(noTree.err), "a tree the browser cannot give is an error for the capture, not a nameless control: " + JSON.stringify(noTree));
  /* a drawer: closed, it is off the screen by design and its controls are not the screen's; open, they are (CodeRabbit on #260) */
  const DRAWER = join(FIXTURES, "drawer.html");
  writeFileSync(DRAWER, '<!doctype html><meta charset="utf-8"><title>drawer fixture</title><style>button { display: block; margin: 8px; min-width: 60px; min-height: 40px; }</style>' +
    '<div class="drawer open"><button id="inOpen"></button></div><div class="drawer"><button id="inClosed"></button></div>' + String.fromCharCode(10));
  await s.c.goto("file:///" + DRAWER.replace(/\\/g, "/"));
  await s.settle(200);
  const inDrawer = await s.unnamedControls();
  ok(inDrawer.some((x) => x.includes("#inOpen")) && !inDrawer.some((x) => x.includes("#inClosed")), "a nameless button in an open drawer is reported, and one in a closed drawer is not: " + inDrawer.join(" | "));
  const allLost = await under((m, p, ...r) => m === "DOM.resolveNode" ? Promise.reject(new Error("no such node")) : real(m, p, ...r));
  ok(allLost.err && /none could be looked up/.test(allLost.err), "every nameless candidate lost is an error too, not a page with nothing wrong: " + JSON.stringify(allLost));
}

/* four checks that need no judgement of what a screen should look like: a hole in the words ("$NaN", "undefined": DK-054's summary showed "Amount financed $NaN"), one id on two
   elements, a picture that did not load, and what the page logs as an error. Each is planted once and its lookalike left clean: "nullify", "Infiniti" and "banana" hold the letters
   of null, Infinity and NaN and are not holes. */
console.log("\nthe hole, duplicate-id, broken-picture and console checks");
{
  const HOLES = join(FIXTURES, "holes.html");
  writeFileSync(HOLES, [
    '<!doctype html><meta charset="utf-8"><title>holes fixture</title>',
    "<style>body { font: 16px/1.4 system-ui, sans-serif; } p, div { margin: 6px 12px; }</style>",
    '<p id="hole1">Amount financed $NaN</p>',
    '<p id="hole2">Payment: undefined / mo</p>',
    '<input id="hole3" value="NaN">',
    '<p id="clean1">Amount financed $12,000.00</p>',
    '<p id="clean2">nullify the warranty, Infiniti, banana</p>',
    '<div id="dupe">first</div><div id="dupe">second</div><div id="solo">alone</div>',
    '<img id="broken" src="missing-picture.png" width="40" height="40" alt="">',
    '<img id="fine" alt="" width="8" height="8" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">',
    ""
  ].join(String.fromCharCode(10)));
  await s.c.goto("file:///" + HOLES.replace(/\\/g, "/"));
  await s.settle(500);
  const first = await s.checks();
  ok(first.holes.length === 3 && ["hole1", "hole2", "hole3"].every((id) => first.holes.some((x) => x.includes("#" + id))), "the three planted holes are reported: " + first.holes.join(" | "));
  ok(!first.holes.some((x) => /clean1|clean2/.test(x)), "a money figure and the words nullify, Infiniti and banana are not holes");
  ok(first.dupIds.length === 1 && first.dupIds[0].startsWith("#dupe x2"), "the one id on two elements is reported, and the unique one is not: " + first.dupIds.join(" | "));
  ok(first.brokenImages.length === 1 && first.brokenImages[0].includes("#broken"), "the picture that did not load is reported, and the one that did is not: " + first.brokenImages.join(" | "));
  ok(first.console.some((x) => x.includes("missing-picture.png")), "the browser's own log of the failed load is kept: " + first.console.join(" | "));
  await s.eval('setTimeout(() => { throw new Error("planted exception"); }, 0); console.error("planted console error"); true');
  await s.settle(300);
  const second = await s.checks();
  ok(second.console.some((x) => x.includes("planted exception")) && second.console.some((x) => x.includes("planted console error")), "an uncaught exception and a console.error are kept: " + second.console.join(" | "));
  ok((await s.checks()).console.length === 0, "and the next screen starts with an empty log");
  /* a step that fails before its screen is checked: the capture takes what it logged (capture.mjs), so the next screen
     reports only its own (CodeRabbit on #258) */
  await s.eval('console.error("logged by a step that failed"); true');
  await s.settle(200);
  const taken = s.takeErrors();
  await s.eval('console.error("logged by the next screen"); true');
  await s.settle(200);
  const next = (await s.checks()).console;
  ok(taken.some((x) => x.includes("logged by a step that failed")) && next.length === 1 && next[0].includes("logged by the next screen"),
    "what a failed step logged is taken for that step, and the next screen reports only its own: " + JSON.stringify({ taken, next }));
  /* a page that errs while it first loads: a session opened on it reports that on its first screen, because it listens
     before the first load (CodeRabbit on #259). The page stands in for the app (a Store, so the session sees it ready) */
  const STARTUP = join(FIXTURES, "startup-errors.html");
  writeFileSync(STARTUP, '<!doctype html><meta charset="utf-8"><title>startup fixture</title><script>window.Store = {}; console.error("logged while the page starts"); setTimeout(() => { throw new Error("thrown while the page starts"); }, 0);</script><p>started</p>' + String.fromCharCode(10));
  const s2 = new Session({ http: 8468, cdp: 9368 });
  s2.base = "file:///" + STARTUP.replace(/\\/g, "/");
  let atStart = [];
  try { await s2.open(); await s2.settle(300); atStart = (await s2.checks()).console; } finally { await s2.close(); }
  ok(atStart.some((x) => x.includes("logged while the page starts")) && atStart.some((x) => x.includes("thrown while the page starts")),
    "what the page logs while it first loads is the first screen's: " + atStart.join(" | "));
}

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

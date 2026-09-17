/* Ride Price UI Library — capture.
   Walks every flow in flows.mjs like a user at 390 × 844, takes one
   full-screen screenshot per meaningful step, runs the automated visual
   checks on each, and writes reports/flow-manifest.json.

   Run:  node ride-price-ui-library/tools/capture.mjs [flowId ...]
   (no args = every flow). Screenshots land in current/<area>/NN-name.png. */
import { Session, CURRENT, REPORTS, LIB, pad2, writeFileSync, mkdirSync, join } from "./lib.mjs";
import { FLOWS } from "./flows.mjs";
import { rmSync, existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const only = process.argv.slice(2);
const flows = only.length ? FLOWS.filter(f => only.includes(f.id) || only.includes(f.area)) : FLOWS;
if (!flows.length) throw new Error("no flows match " + only.join(", "));

const s = await new Session().open();
const photos = s.fixtures();
/* the app commit each flow is stamped with: update.mjs passes RP_COMMIT; a
   partial re-run (node capture.mjs <flowId>) used to leave it empty, which made
   those flows read as captured against no commit at all — ask git instead */
let APP_COMMIT = process.env.RP_COMMIT || null;
if (!APP_COMMIT) { try { APP_COMMIT = execSync("git rev-parse HEAD", { cwd: LIB, encoding: "utf8" }).trim(); } catch { APP_COMMIT = null; } }
const manifest = { library: "Ride Price Mobile UI Library", viewport: "390x844", capturedAt: new Date().toISOString(),
  appCommit: APP_COMMIT, flows: [] };

let shots = 0, failed = 0;
for (const flow of flows) {
  console.log(`\n== ${flow.area} — ${flow.title}`);
  const dir = join(CURRENT, flow.area);
  if (!only.length || only.includes(flow.id) || only.includes(flow.area)) { if (existsSync(dir)) rmSync(dir, { recursive: true, force: true }); }
  mkdirSync(dir, { recursive: true });
  /* each flow records when and against which commit IT was captured; a partial
     re-run updates only these, never the top-level stamps of the full run */
  const out = { id: flow.id, area: flow.area, title: flow.title, description: flow.description || "", entry: flow.entry || null,
    capturedAt: new Date().toISOString(), appCommit: APP_COMMIT, screens: [] };
  let n = 0;
  const ctx = { photos }; /* shared across this flow's steps */
  for (const step of flow.steps) {
    n++;
    const file = `${pad2(n)}-${step.key}.png`;
    const rel = `current/${flow.area}/${file}`;
    const rec = { step: n, key: step.key, screen: step.screen, screenshot: rel, hash: null, action: step.action || null,
      next: step.next || null, branches: step.branches || [], notes: step.notes || "", status: step.status || "ok",
      /* a step the flow does not lead INTO — build.mjs draws a gap before it
         and ends the sequence at the card above. Written only when the flow
         sets it, so no other screen's record in the manifest moves. */
      ...(step.standalone ? { standalone: true } : {}),
      reusedFrom: step.reusedFrom || null, checks: null, error: null };
    try {
      await step.do(s, ctx);
      rec.hash = await s.eval(`location.hash`);
      /* a step may state what its screen has to show. A capture that shows
         something else is recorded as a failure with the reason, and shot
         below like any other failure — never filed as the state it was meant
         to document. First use: the document viewer's completed screen, the
         one RP-UI-030 was retired against (v022). */
      if (step.expect) { const why = await step.expect(s); if (why) throw new Error("expectation not met: " + why); }
      const size = await s.shot(join(dir, file), { focus: step.focus || null });
      rec.size = { width: size.width, height: size.height, pageHeight: size.pageHeight };
      rec.scrollShot = size.scroll ? rel.replace(/.png$/, ".scroll.png") : null;
      rec.checks = await s.checks();
      shots++;
      const flags = [];
      if (rec.checks.hOverflow) flags.push(`h-overflow +${rec.checks.hOverflow}px`);
      if (rec.checks.offscreen.length) flags.push(`offscreen ${rec.checks.offscreen.length}`);
      if (rec.checks.tinyTargets.length) flags.push(`tiny ${rec.checks.tinyTargets.length}`);
      if (rec.checks.clipped.length) flags.push(`clipped ${rec.checks.clipped.length}`);
      if (rec.checks.overlaps.length) flags.push(`overlap ${rec.checks.overlaps.length}`);
      console.log(`  ${pad2(n)} ${step.key.padEnd(34)} ${String(rec.hash).padEnd(30)} ${size.height}px ${flags.join(" · ")}`);
    } catch (e) {
      failed++;
      rec.status = "capture-failed"; rec.error = String(e.message || e).slice(0, 300);
      console.log(`  ${pad2(n)} ${step.key.padEnd(34)} FAILED: ${rec.error}`);
      try { await s.shot(join(dir, file)); } catch { /* nothing to save */ }
    }
    out.screens.push(rec);
  }
  manifest.flows.push(out);
}

mkdirSync(REPORTS, { recursive: true });
/* a partial run (flow ids given) merges into the existing manifest */
const mfPath = join(REPORTS, "flow-manifest.json");
if (only.length && existsSync(mfPath)) {
  const prev = JSON.parse(readFileSync(mfPath, "utf8"));
  for (const f of manifest.flows) { const i = prev.flows.findIndex(x => x.id === f.id); if (i >= 0) prev.flows[i] = f; else prev.flows.push(f); }
  prev.flows.sort((a, b) => a.area.localeCompare(b.area));
  /* top-level capturedAt/appCommit stay those of the last FULL run — the version record is stamped from them; each flow carries its own */
  writeFileSync(mfPath, JSON.stringify(prev, null, 2));
} else {
  writeFileSync(mfPath, JSON.stringify(manifest, null, 2));
}
console.log(`\n${shots} screenshots, ${failed} failed steps → ${mfPath}`);
await s.close();
if (failed) process.exitCode = 1;

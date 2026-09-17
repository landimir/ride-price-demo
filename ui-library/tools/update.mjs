/* Ride Price UI Library — "Update UI Screenshot Library".
   1. preserve the previous version (current/ + master-flow/ + reports/ → versions/vNNN/)
   2. recapture every flow at 390 × 844 (capture.mjs)
   3. rebuild the master flow page and reports (build.mjs)
   4. diff the new manifest against the previous one → reports/changelog.md entry
      (added / removed flows and screens, changed screens, new / resolved issues)
   Never destroys a previous capture. Run: node ride-price-ui-library/tools/update.mjs */
import { LIB, CURRENT, REPORTS, MASTER, VERSIONS, join, writeFileSync, mkdirSync, existsSync } from "./lib.mjs";
import { readFileSync, cpSync, readdirSync, rmSync, statSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const read = (p, fb) => existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fb;
const mfPath = join(REPORTS, "flow-manifest.json"), verPath = join(REPORTS, "version.json"), issPath = join(REPORTS, "issues.json");
const prevVersion = read(verPath, null);
const prevIssues = read(issPath, []);
/* 1. preserve — BEFORE the baseline is read, so the baseline can always come
   from the archive rather than from a working copy that a failed run may
   already have overwritten */
let nextNo = 1;
if (prevVersion) {
  const n = parseInt(String(prevVersion.version).replace(/\D/g, ""), 10) || 0;
  const dest = join(VERSIONS, prevVersion.version);
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
    for (const d of ["current", "master-flow", "reports", "issues"]) if (existsSync(join(LIB, d))) cpSync(join(LIB, d), join(dest, d), { recursive: true });
    /* the archived master page must point at its own screenshots */
    const idx = join(dest, "master-flow", "index.html");
    if (existsSync(idx)) writeFileSync(idx, readFileSync(idx, "utf8").replace(/\.\.\/current\//g, "../current/"));
    console.log(`preserved ${prevVersion.version} → versions/${prevVersion.version}/`);
  } else console.log(`versions/${prevVersion.version} already exists — left untouched`);
  nextNo = n + 1;
}
const version = "v" + String(nextNo).padStart(3, "0");
let commit = null; try { commit = execSync("git rev-parse HEAD", { cwd: LIB, encoding: "utf8" }).trim(); } catch {}

/* The changelog's baseline is the ARCHIVED previous version — never the
   working copy. A run that dies at capture leaves the working manifest
   carrying the NEW step keys while version.json still names the old version;
   reading that as "previous" makes the next run report "Added: none" however
   much the flows were rewritten (hit for real on 2026-08-28). Step 1 above
   guarantees the archive exists, so a missing one means the archive is
   damaged — stop rather than quietly diff against the wrong thing. */
const prevRoot = prevVersion ? join(VERSIONS, prevVersion.version) : null;
const archivedMf = prevRoot ? join(prevRoot, "reports", "flow-manifest.json") : null;
if (prevVersion && !existsSync(archivedMf)) {
  /* deliberately NOT "delete the archive and re-run": by this point capture
     may already have replaced the working reports, so re-archiving would file
     the NEW artifacts as the previous version and the changelog would compare
     a release against itself (CodeRabbit, PR #52) */
  throw new Error(`versions/${prevVersion.version}/reports/flow-manifest.json is missing — the previous version's archive is incomplete, so the changelog would have no honest baseline. Restore that file from the ${prevVersion.version} artifact (git history or a backup) before re-running. Do NOT delete versions/${prevVersion.version} and re-archive: the working copy may already hold the new capture, which would then be recorded as the previous version.`);
}
const prevManifest = prevVersion ? read(archivedMf, null) : null;
const prevHashes = {}; /* screenshot path → sha1 of the previous capture */
if (prevManifest) for (const f of prevManifest.flows) for (const sc of f.screens) { const p = join(prevRoot, sc.screenshot); if (existsSync(p)) prevHashes[sc.screenshot] = createHash("sha1").update(readFileSync(p)).digest("hex"); }

/* 2. capture — a child that fails stops the update: nothing below (version
   record, reports, changelog) may describe a partial or stale capture */
const run = (script) => {
  const r = spawnSync(process.execPath, [join(LIB, "tools", script)], { stdio: "inherit", env: { ...process.env, RP_COMMIT: commit || "" } });
  if (r.error) throw r.error;
  if (r.signal) throw new Error(`${script} was killed by ${r.signal}`);
  if (r.status !== 0) throw new Error(`${script} exited ${r.status} — fix the failing step(s) in flows.mjs, re-run "node tools/capture.mjs <flowId>" for that flow, then "node tools/build.mjs"; the previous version is preserved and nothing else was written`);
};
run("capture.mjs");
const manifest = read(mfPath, null);
if (!manifest) throw new Error("capture produced no manifest");
writeFileSync(verPath, JSON.stringify({ version, capturedAt: manifest.capturedAt, appCommit: commit }, null, 2));

/* 3. build */
run("build.mjs");

/* 4. changelog — only what the two manifests can prove */
const flat = (m) => { const o = {}; if (!m) return o; for (const f of m.flows) for (const sc of f.screens) o[`${f.id}/${sc.key}`] = { flow: f.title, screen: sc.screen, shot: sc.screenshot, status: sc.status }; return o; };
const before = flat(prevManifest), after = flat(manifest);
const flowsBefore = new Set((prevManifest ? prevManifest.flows : []).map(f => f.id)), flowsAfter = new Set(manifest.flows.map(f => f.id));
/* Every added/removed screen is listed, including the screens of a brand-new
   or deleted flow. Skipping those and emitting one `flow:` line instead meant
   a new flow with six screens moved the total by six while contributing a
   single list item, so previous - removed + added stopped reconciling. The
   flow line stays as context and says how many screens follow it. */
const nScreens = (m, id) => m.flows.find(f => f.id === id).screens.length;
const addedFlows = manifest.flows.filter(f => !flowsBefore.has(f.id)).map(f => `${f.title} — its ${nScreens(manifest, f.id)} screen(s) are listed below`);
const removedFlows = (prevManifest ? prevManifest.flows : []).filter(f => !flowsAfter.has(f.id)).map(f => `${f.title} — its ${nScreens(prevManifest, f.id)} screen(s) are listed below`);
const addedScreens = Object.keys(after).filter(k => !before[k]).map(k => `${after[k].flow} · ${after[k].screen}`);
const removedScreens = Object.keys(before).filter(k => !after[k]).map(k => `${before[k].flow} · ${before[k].screen}`);
const changed = [];
for (const k of Object.keys(after)) if (before[k]) {
  /* the previous hash is keyed by the PREVIOUS path — a step can keep its
     flow/key while its file name moves (a step inserted ahead of it) */
  const p = join(LIB, after[k].shot);
  if (!existsSync(p) || !prevHashes[before[k].shot]) continue;
  const h = createHash("sha1").update(readFileSync(p)).digest("hex");
  if (h !== prevHashes[before[k].shot]) changed.push(`${after[k].flow} · ${after[k].screen}`);
}
const issues = read(issPath, []);
const prevIds = new Set(prevIssues.map(i => i.id)), curIds = new Set(issues.map(i => i.id));
const newIssues = issues.filter(i => !prevIds.has(i.id)).map(i => `${i.id} (${i.severity}) — ${i.issue}`);
const resolvedIssues = prevIssues.filter(i => !curIds.has(i.id)).map(i => `${i.id} (${i.severity}) — ${i.issue}`);
const list = (arr) => arr.length ? arr.map(x => `- ${x}`).join("\n") : "- none";
const entry = [`## ${version} — ${manifest.capturedAt.slice(0, 10)}`, "", `App commit: ${commit ? commit.slice(0, 7) : "n/a"} · ${manifest.flows.length} flows · ${Object.keys(after).length} screens · previous: ${prevVersion ? prevVersion.version : "none (first capture)"}`, "",
  "### Added", prevManifest ? list([...addedFlows.map(f => `flow added: ${f}`), ...addedScreens]) : "- first capture — every flow and screen is new", "",
  "### Changed (screenshot bytes differ from the previous version)", prevManifest ? list(changed) : "- n/a", "",
  "### Removed", prevManifest ? list([...removedFlows.map(f => `flow removed: ${f}`), ...removedScreens]) : "- none", "",
  "### New issues", list(newIssues), "", "### Resolved issues", list(resolvedIssues), "",
  "_Note: a 'changed' screen means the pixels differ between captures — re-read the two screenshots to say what changed; issues are only new/resolved if reports/issues.json says so._", ""].join("\n");
const clPath = join(REPORTS, "changelog.md");
/* the previous log may have been checked out with CRLF or a BOM — strip its
   heading either way so the file keeps exactly one */
const prevLog = existsSync(clPath) ? readFileSync(clPath, "utf8").replace(/^﻿?# Ride Price Mobile UI Library — Changelog\r?\n\r?\n/, "") : "";
writeFileSync(clPath, `# Ride Price Mobile UI Library — Changelog\n\n${entry}\n${prevLog}`);
console.log(`\n${version} written; changelog updated. Now: eyeball changed/added screenshots, update reports/issues.json, and re-run build.mjs if issues changed.`);

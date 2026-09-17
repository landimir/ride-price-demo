/* Rewrite the newest changelog entry from what the artifacts actually say
   now — both its issue sections and its screenshot lists.

   update.mjs writes the changelog and then the documented procedure keeps
   working: the audit edits issues.json, and a flow with selector drift gets
   re-run through `capture.mjs <flowId>`. Every one of those steps happens
   AFTER the entry was written, so the entry describes a state that no longer
   exists — issue sections that always said "none", and an Added/Changed/
   Removed list that misses whatever the later captures touched.

   This re-derives all of it against the archived previous version, which is
   the same baseline update.mjs uses. Run it last, before the final
   build.mjs. Idempotent: running it twice lands where running it once does. */
import { LIB, REPORTS, CURRENT, VERSIONS, join } from "./lib.mjs";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
const version = JSON.parse(readFileSync(join(REPORTS, "version.json"), "utf8"));
const cur = JSON.parse(readFileSync(join(REPORTS, "issues.json"), "utf8"));

/* the baseline is the previous version's ARCHIVED issues.json, never the
   working copy — the working copy is already the new state */
const n = Number(String(version.version).replace(/^v/, ""));
const prevDir = join(LIB, "versions", "v" + String(n - 1).padStart(3, "0"), "reports", "issues.json");
if (!existsSync(prevDir)) throw new Error("no archived issues.json for the previous version at " + prevDir);
const prev = JSON.parse(readFileSync(prevDir, "utf8"));

const byId = (a) => Object.fromEntries(a.map(i => [i.id, i]));
const P = byId(prev), C = byId(cur);
const line = (i) => `- ${i.id} (${i.severity}) — ${i.issue}`;
const added = cur.filter(i => !P[i.id]).map(line);
const gone = prev.filter(i => !C[i.id]).map(line);
/* a finding that survived but was re-filed or reworded is neither new nor
   resolved, and saying nothing about it is how a stale entry looks correct */
const amended = cur.filter(i => P[i.id] && (
  P[i.id].issue !== i.issue || P[i.id].screenshot !== i.screenshot || P[i.id].severity !== i.severity
)).map(i => {
  const p = P[i.id];
  const what = [];
  if (p.screenshot !== i.screenshot) what.push(`re-filed against ${i.screenshot}`);
  if (p.severity !== i.severity) what.push(`${p.severity} → ${i.severity}`);
  if (p.issue !== i.issue && !what.length) what.push("wording corrected");
  else if (p.issue !== i.issue) what.push("wording corrected");
  return `- ${i.id} — ${what.join("; ")}`;
});
const list = (a) => a.length ? a.join("\n") : "- none";

/* ---- the screenshot lists, re-derived the way update.mjs derives them ----
   Same baseline (the archived previous manifest), same hash comparison. A
   flow re-run through capture.mjs after update.mjs changes bytes that the
   entry never recorded, which is how a "Changed" list of 25 sat beside 30
   genuinely different files. */
const prevRoot = join(VERSIONS, "v" + String(n - 1).padStart(3, "0"));
const prevMfPath = join(prevRoot, "reports", "flow-manifest.json");
if (!existsSync(prevMfPath)) throw new Error("no archived flow-manifest.json at " + prevMfPath);
const prevMf = JSON.parse(readFileSync(prevMfPath, "utf8"));
const mf = JSON.parse(readFileSync(join(REPORTS, "flow-manifest.json"), "utf8"));

const flat = (m) => { const o = {}; for (const f of m.flows) for (const sc of f.screens) o[`${f.id}/${sc.key}`] = { flow: f.title, screen: sc.screen, shot: sc.screenshot }; return o; };
const before = flat(prevMf), after = flat(mf);
const flowsBefore = new Set(prevMf.flows.map(f => f.id)), flowsAfter = new Set(mf.flows.map(f => f.id));
const sha = (p) => existsSync(p) ? createHash("sha1").update(readFileSync(p)).digest("hex") : null;
const prevHashes = {};
for (const f of prevMf.flows) for (const sc of f.screens) { const h = sha(join(prevRoot, sc.screenshot)); if (h) prevHashes[sc.screenshot] = h; }

/* Every added/removed screen is listed, including the screens of a brand-new
   or deleted flow. The old behaviour skipped those and emitted a single
   `flow:` line instead, so a new flow with six screens moved the total by six
   while contributing one list item — previous − removed + added stopped
   reconciling, which is the exact inconsistency this entry gets audited for.
   The flow line stays as context and says how many screens follow it. */
const nScreens = (m, id) => m.flows.find(f => f.id === id).screens.length;
const addedFlows = mf.flows.filter(f => !flowsBefore.has(f.id))
  .map(f => `flow added: ${f.title} — its ${nScreens(mf, f.id)} screen(s) are listed below`);
const removedFlows = prevMf.flows.filter(f => !flowsAfter.has(f.id))
  .map(f => `flow removed: ${f.title} — its ${nScreens(prevMf, f.id)} screen(s) are listed below`);
const addedScreens = Object.keys(after).filter(k => !before[k]).map(k => `${after[k].flow} · ${after[k].screen}`);
const removedScreens = Object.keys(before).filter(k => !after[k]).map(k => `${before[k].flow} · ${before[k].screen}`);
const changedScreens = [];
for (const k of Object.keys(after)) {
  if (!before[k]) continue;
  const h = sha(join(LIB, after[k].shot));
  const p = prevHashes[before[k].shot];
  if (h && p && h !== p) changedScreens.push(`${after[k].flow} · ${after[k].screen}`);
}
const bullets = (a) => a.length ? a.map(x => `- ${x}`).join("\n") : "- none";

const clPath = join(REPORTS, "changelog.md");
let log = readFileSync(clPath, "utf8");
const head = `## ${version.version} — `;
const start = log.indexOf(head);
if (start < 0) throw new Error(`the newest changelog entry is not ${version.version}`);
const next = log.indexOf("\n## ", start + 1);
const entry = log.slice(start, next < 0 ? log.length : next);

/* The log is checked out with CRLF on Windows, so every newline in these
   patterns has to tolerate the carriage return. A \n-only pattern matched
   nothing, and this tool then printed its counts while changing the file not
   at all — the exact "green while doing nothing" failure it exists to fix. */
const NL = "\\r?\\n";
const section = (name) => new RegExp(`### ${name}${NL}[\\s\\S]*?(?=${NL}### |${NL}_Note:)`);
const AMENDED = "### Amended issues (kept, but re-filed or reworded)";
const CHANGED_HEAD = "### Changed (screenshot bytes differ from the previous version)";
let out = entry
  .replace(section("Added"), `### Added\n${bullets([...addedFlows, ...addedScreens])}\n`)
  .replace(section("Changed \\(screenshot bytes differ from the previous version\\)"), `${CHANGED_HEAD}\n${bullets(changedScreens)}\n`)
  .replace(section("Removed"), `### Removed\n${bullets([...removedFlows, ...removedScreens])}\n`)
  .replace(section("New issues"), `### New issues\n${list(added)}\n`)
  .replace(section("Resolved issues"), `### Resolved issues\n${list(gone)}\n`);
/* the header's screen count has to agree with what was actually captured */
out = out.replace(/(· )\d+( screens · previous)/, `$1${Object.keys(after).length}$2`);
/* The Amended section is REPLACED when it is already there and inserted when
   it is not. The first version only ever inserted, so a second run on the
   same entry — the normal case when the audit is revised — left a stale list
   standing and then failed its own verification. Editing twice must land on
   the same result as editing once. */
if (new RegExp(`### Amended issues`).test(out)) {
  out = out.replace(section("Amended issues \\(kept, but re-filed or reworded\\)"), `${AMENDED}\n${list(amended)}\n`);
} else {
  out = out.replace(new RegExp(`(### Resolved issues${NL}[\\s\\S]*?)(${NL}_Note:)`),
    `$1\n${AMENDED}\n${list(amended)}\n$2`);
}
/* refuse to report success without having written the content */
for (const [name, body] of [
  ["Added", bullets([...addedFlows, ...addedScreens])],
  ["Changed (screenshot bytes differ", bullets(changedScreens)],
  ["Removed", bullets([...removedFlows, ...removedScreens])],
  ["New issues", list(added)], ["Resolved issues", list(gone)], ["Amended issues", list(amended)]]) {
  const i = out.indexOf("### " + name);
  if (i < 0) throw new Error(`the "${name}" section was not written — the entry format changed`);
  const first = body.split("\n")[0];
  if (!out.slice(i, i + 8000).includes(first))
    throw new Error(`the "${name}" section did not take its new content ("${first.slice(0, 60)}") — refusing to report success`);
}
writeFileSync(clPath, log.slice(0, start) + out + (next < 0 ? "" : log.slice(next)));
console.log(`${version.version} changelog refreshed — screens: ${addedScreens.length + addedFlows.length} added, ${changedScreens.length} changed, ${removedScreens.length + removedFlows.length} removed; issues: ${added.length} new, ${gone.length} resolved, ${amended.length} amended`);

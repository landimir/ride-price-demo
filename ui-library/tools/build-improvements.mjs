#!/usr/bin/env node
/* Ride Price Mobile UI Improvement System — renderer.
   Reads reports/screen-improvement-matrix.json (hand-maintained, the source of truth — one area at a
   time), reports/flow-manifest.json and reports/issues.json, and writes:
     master-flow/improvement-view.html   the companion visual page (original screenshot stays the reference)
     reports/ui-improvement-report.md    flow-by-flow report
     reports/opportunity-board.md        the quick-scan summary (top opportunities, repeats, where to start)
     reports/mobbin-reference-summary.md the pattern lessons, one per reference family
   No dependencies; run with `node ride-price-ui-library/tools/build-improvements.mjs`. */
"use strict";
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPORTS = join(ROOT, "reports");
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const manifest = read(join(REPORTS, "flow-manifest.json"));
const issues = read(join(REPORTS, "issues.json"));
const matrix = read(join(REPORTS, "screen-improvement-matrix.json"));
const version = existsSync(join(REPORTS, "version.json")) ? read(join(REPORTS, "version.json")) : {};

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SEV = ["Critical", "Major", "Minor", "Observation"];
const PRI = ["High", "Medium", "Low"];
const TYPES = ["Existing Comment Expanded", "Newly Detected UI Issue", "Pattern Opportunity"];
const typeKey = (t) => ({ "Existing Comment Expanded": "expanded", "Newly Detected UI Issue": "new", "Pattern Opportunity": "pattern" }[t] || "other");
const issueById = Object.fromEntries(issues.map(i => [i.id, i]));
const flowById = Object.fromEntries(manifest.flows.map(f => [f.id, f]));
const patternById = Object.fromEntries((matrix.patterns || []).map(p => [p.id, p]));

/* every issue id any archived version ever carried — the history a retired
   finding still legitimately belongs to */
const everKnownIssue = (() => {
  const known = new Set();
  const vdir = join(ROOT, "versions");
  if (existsSync(vdir)) for (const v of readdirSync(vdir)) {
    const p = join(vdir, v, "reports", "issues.json");
    if (!existsSync(p)) continue;
    try { for (const i of JSON.parse(readFileSync(p, "utf8"))) known.add(i.id); } catch { /* an unreadable archive proves nothing */ }
  }
  return (id) => known.has(id);
})();

/* ---- consistency checks: a recommendation must point at a real screen, a real issue, a real pattern ---- */
const problems = [];
for (const a of matrix.areas) {
  const f = flowById[a.flowId];
  if (!f) { problems.push(`area ${a.flowId}: no such flow in the manifest`); continue; }
  for (const r of a.recommendations || []) {
    if (!f.screens.some(s => s.screenshot === r.screenshot)) problems.push(`${r.id}: screenshot ${r.screenshot} is not in flow ${a.flowId}`);
    for (const x of r.alsoOn || []) if (!manifest.flows.some(ff => ff.screens.some(s => s.screenshot === x))) problems.push(`${r.id}: alsoOn ${x} is not in the manifest`);
    /* an expanded comment may name a finding that has since been FIXED and
       retired from issues.json — that is the point of retiring one, and the
       provenance is still true. Accept an id that any archived version knew;
       a typo, which no version ever carried, still fails (2026-08-28). */
    if (r.existingComment && !issueById[r.existingComment] && !everKnownIssue(r.existingComment)) problems.push(`${r.id}: existingComment ${r.existingComment} is in neither issues.json nor any archived version`);
    if (r.findingType === "Existing Comment Expanded" && !r.existingComment) problems.push(`${r.id}: Existing Comment Expanded without an existingComment id`);
    if (!SEV.includes(r.severity)) problems.push(`${r.id}: severity ${r.severity}`);
    if (!PRI.includes(r.priority)) problems.push(`${r.id}: priority ${r.priority}`);
    if (!TYPES.includes(r.findingType)) problems.push(`${r.id}: findingType ${r.findingType}`);
    for (const p of r.patterns || []) if (!patternById[p]) problems.push(`${r.id}: pattern ${p} is not in matrix.patterns`);
  }
}
if (problems.length) { console.error("screen-improvement-matrix.json is inconsistent:\n  " + problems.join("\n  ")); process.exit(1); }

const reviewed = matrix.areas.filter(a => a.status === "reviewed");
const pending = manifest.flows.filter(f => !reviewed.some(a => a.flowId === f.id));
const allRecs = reviewed.flatMap(a => (a.recommendations || []).map(r => ({ ...r, flowId: a.flowId, flow: a.flow })));
const count = (list, key, vals) => vals.reduce((o, v) => (o[v] = list.filter(x => x[key] === v).length, o), {});
const sevTotals = count(allRecs, "severity", SEV), priTotals = count(allRecs, "priority", PRI), typeTotals = count(allRecs, "findingType", TYPES);
const screenOf = (a, r) => flowById[a.flowId].screens.find(s => s.screenshot === r.screenshot);
const pad2 = (n) => String(n).padStart(2, "0");
const stamp = matrix.updated || "";

/* ============================ the companion page ============================ */
const css = `
:root{--chrome:#071b49;--chrome-2:#0b255d;--navy:#262254;--ink:#34314e;--muted:#6f6c88;--bg:#f2f2f8;--line:#e3e1ef;--card:#fff;--radius:14px;
--grad:linear-gradient(92deg,#f7b733,#ff7a00 38%,#ff4d5a 70%,#c9184a);--crit:#c62828;--major:#e65100;--minor:#b46811;--obs:#1e5aa8;--ok:#1f8a4c;--high:#c9184a;--med:#e07a00;--low:#1e5aa8}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:Poppins,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--ink);font-size:14px;line-height:1.5}
a{color:inherit}
.appbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;padding:10px 22px;background:linear-gradient(90deg,var(--chrome),var(--chrome-2));color:#fff}
.brand{font-weight:800;font-size:20px;letter-spacing:.3px}.brand i{font-style:italic;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}.brand span{font-weight:700;font-size:12px;letter-spacing:2px;margin-left:6px;opacity:.9}
.appbar .ver{margin-left:auto;font-size:12px;opacity:.9}.appbar a.back{color:#fff;font-size:12.5px;font-weight:600;text-decoration:none;opacity:.9;border:1px solid rgba(255,255,255,.35);border-radius:99px;padding:3px 10px}.appbar a.back:hover{opacity:1;background:rgba(255,255,255,.08)}
.chip{border:1px solid #f7b733;color:#f7b733;border-radius:99px;padding:2px 10px;font-size:11px;font-weight:800;letter-spacing:1px}
.layout{display:grid;grid-template-columns:260px 1fr;min-height:calc(100vh - 52px)}
.side{background:#fff;border-right:1px solid var(--line);padding:18px 14px;position:sticky;top:52px;height:calc(100vh - 52px);overflow:auto}
.side h4{margin:8px 8px 6px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted)}
.side a{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;color:var(--navy)}.side a:hover{background:var(--bg)}.side a small{color:var(--muted);font-weight:600;white-space:nowrap}
.side a.pending{color:var(--muted)}.dot{display:inline-block;width:8px;height:8px;border-radius:99px;background:var(--line);margin-right:6px;flex:none}.dot--done{background:var(--ok)}
.main{padding:22px 26px 60px;min-width:0}
.hero{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:20px 22px;margin-bottom:22px;display:grid;grid-template-columns:1.4fr 1fr;gap:20px}
.hero h1{margin:0 0 4px;font-size:22px;color:var(--navy)}.hero h1::after{content:"";display:block;height:4px;width:54px;background:var(--grad);border-radius:99px;margin-top:6px}
.hero p{margin:6px 0;color:var(--ink)}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.stat{background:var(--bg);border-radius:12px;padding:10px 12px}.stat b{display:block;font-size:22px;color:var(--navy)}.stat span:not([class]){font-size:11.5px;color:var(--muted)}
.sev{display:inline-block;border-radius:99px;padding:2px 9px;font-size:10.5px;font-weight:800;letter-spacing:.4px;color:#fff;vertical-align:middle}.sev--Critical{background:var(--crit)}.sev--Major{background:var(--major)}.sev--Minor{background:var(--minor)}.sev--Observation{background:var(--obs)}
.pri{display:inline-block;border-radius:99px;padding:2px 9px;font-size:10.5px;font-weight:800;letter-spacing:.4px;border:1.5px solid;vertical-align:middle}.pri--High{color:var(--high);border-color:var(--high)}.pri--Medium{color:var(--med);border-color:var(--med)}.pri--Low{color:var(--low);border-color:var(--low)}
.type{display:inline-block;border-radius:6px;padding:2px 8px;font-size:10.5px;font-weight:800;letter-spacing:.3px;background:var(--bg);color:var(--navy);vertical-align:middle}.type--expanded{background:#ecebf5}.type--new{background:#fdeee6;color:#9a3b00}.type--pattern{background:#e6f2ec;color:#1b6b3a}.type--src{background:#eef4fd;color:#2c5597}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--muted);margin:0 0 18px;align-items:center}.legend b{color:var(--navy)}
.area{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:18px 20px;margin-bottom:26px}
.area>header{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}.area h2{margin:0;font-size:17px;color:var(--navy);text-transform:uppercase;letter-spacing:.6px}.area h2 small{color:var(--muted);font-weight:600;letter-spacing:0;text-transform:none;margin-left:8px}
.area .meta{margin-left:auto;font-size:12px;color:var(--muted)}
.works{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:12px 0 18px}.works>div{background:var(--bg);border-radius:12px;padding:12px 14px}.works h4{margin:0 0 6px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted)}.works p{margin:0;font-size:13px}.works ol{margin:0;padding-left:18px;font-size:13px}.works li{margin:3px 0}
.dir{background:linear-gradient(180deg,#fff7ed,#fff);border:1px solid #f7b733;border-radius:12px;padding:14px 16px;margin:0 0 18px}.dir h4{margin:0 0 4px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#9a3b00}.dir h3{margin:0 0 6px;font-size:15px;color:var(--navy)}.dir p{margin:4px 0;font-size:13px}.dir .cols{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:8px}.dir ol,.dir ul{margin:4px 0 0;padding-left:18px;font-size:12.5px}.dir li{margin:3px 0}.dir .conv{font-size:12px;color:var(--muted);margin-top:8px}.dir .dec{margin-top:10px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 12px}.dir .dec h4{color:var(--ok)}
.shot{display:grid;grid-template-columns:300px 1fr;gap:18px;padding:16px 0;border-top:1px solid var(--line)}
.shot:first-of-type{border-top:0}
.frame{position:relative;width:300px;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 8px 24px rgba(38,34,84,.08)}
.frame img{display:block;width:300px;height:auto}.frame.tall{max-height:650px;overflow:auto}
.frame .n{position:absolute;left:10px;top:10px;background:var(--navy);color:#fff;font-weight:800;font-size:11px;border-radius:99px;padding:2px 8px;letter-spacing:.5px;z-index:1}
.frame .zoom{display:block;border:0;padding:0;background:none;cursor:zoom-in;width:100%}
.shotmeta h3{margin:10px 0 2px;font-size:13.5px;color:var(--navy)}.hash{font-size:11px;color:var(--muted);font-family:ui-monospace,Consolas,monospace}
.notes{font-size:12px;color:var(--ink);margin:6px 0}
.issue{border-left:3px solid var(--line);padding:4px 8px;margin:6px 0;font-size:12px;background:#fbfbfd}.issue--Critical{border-color:var(--crit)}.issue--Major{border-color:var(--major)}.issue--Minor{border-color:var(--minor)}.issue--Observation{border-color:var(--obs)}
.issue b{display:block;font-size:11.5px}.issue p{margin:2px 0}
.cards{display:grid;gap:12px;min-width:0}
.rec{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:#fff}
.rec--High{border-left:4px solid var(--high)}.rec--Medium{border-left:4px solid var(--med)}.rec--Low{border-left:4px solid var(--low)}
.rec .top{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px}.rec .top .id{font-weight:800;color:var(--navy);font-size:12px;font-family:ui-monospace,Consolas,monospace}
.rec h4{margin:2px 0 8px;font-size:14px;color:var(--navy)}
.rec .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px}.rec .grid>div{min-width:0}
.rec h5{margin:0 0 3px;font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted)}.rec p{margin:0 0 6px;font-size:12.5px}
.rec .adapt{grid-column:1/-1;background:var(--bg);border-radius:10px;padding:10px 12px}.rec .adapt p{margin:0 0 4px}
.refs{list-style:none;margin:4px 0 0;padding:0;font-size:12px}.refs li{margin:2px 0}.refs a{color:var(--navy);font-weight:700}.refs span{color:var(--muted)}
.foot{font-size:11.5px;color:var(--muted);margin-top:6px}.foot b{color:var(--ink)}
.also{font-size:11.5px;color:var(--muted)}.also a{color:var(--navy);font-weight:600}
.none{font-size:12.5px;color:var(--muted);font-style:italic;padding:4px 0}
.pendbox{background:#fff;border:1px dashed var(--line);border-radius:var(--radius);padding:16px 20px;margin-bottom:26px}.pendbox h2{margin:0 0 8px;font-size:15px;color:var(--navy);text-transform:uppercase;letter-spacing:.6px}.pendbox ol{margin:0;padding-left:20px;columns:2;font-size:13px}.pendbox li{margin:2px 0;break-inside:avoid}
.patterns{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:18px 20px;margin-bottom:26px}.patterns h2{margin:0 0 10px;font-size:17px;color:var(--navy);text-transform:uppercase;letter-spacing:.6px}
.pat{border-top:1px solid var(--line);padding:12px 0}.pat:first-of-type{border-top:0}.pat h3{margin:0 0 4px;font-size:14px;color:var(--navy)}.pat p{margin:3px 0;font-size:12.5px}.pat .used{font-size:11.5px;color:var(--muted)}
.lb{position:fixed;inset:0;background:rgba(7,27,73,.86);display:none;align-items:center;justify-content:center;z-index:50;flex-direction:column;gap:10px}.lb.open{display:flex}.lb img{max-height:88vh;max-width:92vw;border-radius:14px;background:#fff}.lb .cap{color:#fff;font-size:13px}
@media (max-width:1000px){.layout{grid-template-columns:1fr}.side{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}.hero,.works,.rec .grid,.dir .cols{grid-template-columns:1fr}.shot{grid-template-columns:1fr}.frame,.frame img{width:100%}.pendbox ol{columns:1}}

@media (max-width:720px){
  .appbar{flex-wrap:wrap;gap:8px 10px;padding:9px 16px}
  .appbar input{order:3;width:100%;max-width:none}
  .appbar .ver{order:4;width:100%;margin-left:0;font-size:11px;line-height:1.45}
  .appbar a.back{order:2}
  .side{padding:12px 10px}
  .stats{grid-template-columns:repeat(2,1fr)}
  .stat{min-width:0}
  .stat b{font-size:19px}
  .main{padding:16px 14px 48px}
  .hero,.area,.patterns,.pendbox{padding:15px 14px}
  .area,.shot,.patterns,.pendbox{scroll-margin-top:150px}
}
@media print{.appbar,.side,.lb{display:none}.layout{display:block}.main{padding:0}.area,.patterns,.pendbox{break-inside:avoid}}
`;
const sevBadge = (s) => `<span class="sev sev--${esc(s)}">${esc(s)}</span>`;
const priBadge = (p) => `<span class="pri pri--${esc(p)}">${esc(p)} priority</span>`;
const typeBadge = (t) => `<span class="type type--${typeKey(t)}">${esc(t)}</span>`;
const shotId = (flowId, sc) => `${flowId}-${sc.key}`;
const masterHref = (flowId, sc) => `index.html#${esc(flowId)}-${esc(sc.key)}`;
const screenByShot = (shot) => { for (const f of manifest.flows) { const s = f.screens.find(x => x.screenshot === shot); if (s) return { f, s }; } return null; };

const refList = (refs) => refs && refs.length ? `<ul class="refs">${refs.map(r => `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.app)}</a> <span>— ${esc(r.shows)}</span></li>`).join("")}</ul>` : "";
const recCard = (r) => `<article class="rec rec--${esc(r.priority)}" id="${esc(r.id)}">
  <div class="top"><span class="id">${esc(r.id)}</span>${typeBadge(r.findingType)}${sevBadge(r.severity)}${priBadge(r.priority)}<span class="type">${esc(r.category)}</span>${r.source ? `<span class="type type--src">${esc(r.source)}</span>` : ""}</div>
  <h4>${esc(r.title || r.issueSummary)}</h4>
  <div class="grid">
    <div><h5>A · What is wrong on the screen</h5><p>${esc(r.issueSummary)}</p>${r.existingComment ? `<p class="also">Builds on <b>${esc(r.existingComment)}</b>${r.commentAssessment ? ` — ${esc(r.commentAssessment)}` : ""}</p>` : ""}</div>
    <div><h5>B · Why it is a problem</h5><p>${esc(r.whyItMatters)}</p></div>
    <div><h5>C · What better apps do <span style="text-transform:none;letter-spacing:0">(${esc(r.mobbinPatternNeeded)})</span></h5><p>${esc(r.referenceInsight)}</p>${refList(r.references)}</div>
    <div class="adapt"><h5>D · What Ride Price should do</h5><p>${esc(r.ridePriceRecommendation)}</p>${r.whatStays ? `<p><b>Stays:</b> ${esc(r.whatStays)}</p>` : ""}<p class="foot"><b>Fix size:</b> ${esc(r.fixSize)}${r.implementationNote ? ` · <b>Where:</b> ${esc(r.implementationNote)}` : ""}</p></div>
  </div>
  ${r.alsoOn && r.alsoOn.length ? `<p class="also">Same thing on: ${r.alsoOn.map(x => { const m = screenByShot(x); return m ? `<a href="${masterHref(m.f.id, m.s)}">${esc(m.f.title)} · ${pad2(m.s.step)} ${esc(m.s.screen)}</a>` : esc(x); }).join(" · ")}</p>` : ""}
</article>`;

const shotBlock = (a, sc, recs) => {
  const tall = (sc.size && sc.size.height > 844) || !!sc.scrollShot;
  return `<div class="shot" id="${esc(shotId(a.flowId, sc))}">
    <div>
      <div class="frame${tall ? " tall" : ""}"><span class="n">${pad2(sc.step)}</span>
        <button type="button" class="zoom" data-cap="${esc(a.flow)} · ${pad2(sc.step)} ${esc(sc.screen)}"><img loading="lazy" src="../${esc(sc.screenshot)}" alt="${esc(sc.screen)}"></button></div>
      <div class="shotmeta"><h3>${esc(sc.screen)}</h3><div class="hash">${esc(sc.hash || "")} · <a href="${masterHref(a.flowId, sc)}">in the flow library ↗</a>${sc.scrollShot ? ` · <a href="../${esc(sc.scrollShot)}" target="_blank">full length ↓</a>` : ""}</div>
        ${sc.notes ? `<p class="notes">${esc(sc.notes)}</p>` : ""}
        ${sc.issues && sc.issues.length ? sc.issues.map(i => `<div class="issue issue--${esc(i.severity)}"><b>${sevBadge(i.severity)} ${esc(i.id)} — existing comment</b><p>${esc(i.issue)}</p>${i.observation ? `<p><em>${esc(i.observation)}</em></p>` : ""}</div>`).join("") : ""}
      </div>
    </div>
    <div class="cards">${recs.length ? recs.map(recCard).join("") : `<p class="none">No separate recommendation for this screen — it is covered by the area notes above${sc.issues && sc.issues.length ? " and its existing comment stands as written" : ""}.</p>`}</div>
  </div>`;
};

const dirHtml = (d) => `<div class="dir"><h4>Owner direction</h4><h3>${esc(d.title)}</h3><p>${esc(d.summary)}</p><div class="cols"><div><h4>Principles</h4><ol>${(d.principles || []).map(x => `<li>${esc(x)}</li>`).join("")}</ol></div><div><h4>Open choices before building</h4><ul>${(d.openChoices || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>${d.superseded && d.superseded.length ? `<h4 style="margin-top:10px">Superseded during the build</h4><ul>${d.superseded.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</div></div>${d.decisions && d.decisions.length ? `<div class="dec"><h4>Decided</h4><ol>${d.decisions.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>` : ""}${d.converges && d.converges.length ? `<p class="conv">Converges with: ${d.converges.map(esc).join(" · ")}</p>` : ""}${d.intake ? `<div class="dec"><h4 style="color:#2c5597">Intake record — external draft</h4><p style="font-size:12.5px;margin:0 0 6px">${esc(d.intake.source)}</p><h4>Killed, with reasons</h4><ul>${d.intake.killed.map(x => `<li>${esc(x)}</li>`).join("")}</ul><p style="font-size:12.5px;margin:6px 0 0"><b>Recalibrated:</b> ${esc(d.intake.recalibrated)}</p></div>` : ""}</div>`;
const areaHtml = (a) => {
  const f = flowById[a.flowId];
  const recs = a.recommendations || [];
  const byShot = {}; for (const r of recs) (byShot[r.screenshot] ||= []).push(r);
  return `<section class="area" id="${esc(a.flowId)}">
  <header><h2>${esc(a.flow)}<small>${f.screens.length} screens · ${recs.length} recommendation${recs.length === 1 ? "" : "s"}</small></h2><span class="meta">reviewed ${esc(a.reviewedOn || stamp)}</span></header>
  ${f.description ? `<p class="notes">${esc(f.description)}</p>` : ""}
  ${a.direction ? dirHtml(a.direction) : ""}
  <div class="works"><div><h4>What already works</h4><p>${esc(a.whatWorks)}</p></div><div><h4>Strongest recommendations</h4><ol>${(a.strongest || []).map(s => `<li>${esc(s)}</li>`).join("")}</ol></div></div>
  ${f.screens.map(sc => shotBlock(a, sc, byShot[sc.screenshot] || [])).join("")}
</section>`;
};

const patternsHtml = (matrix.patterns || []).length ? `<section class="patterns" id="patterns"><h2>Mobbin reference patterns used so far</h2><p class="notes">Each pattern is a family of screens from other apps that solve one problem well. The lesson is what Ride Price takes from it — never the other app's look.</p>
${(matrix.patterns || []).filter(p => allRecs.some(r => (r.patterns || []).includes(p.id))).map(p => `<div class="pat" id="${esc(p.id)}"><h3>${esc(p.id)} · ${esc(p.name)}</h3><p><b>Common pattern:</b> ${esc(p.commonPattern)}</p><p><b>Lesson for Ride Price:</b> ${esc(p.lesson)}</p>${refList(p.references)}<p class="used">Used by: ${allRecs.filter(r => (r.patterns || []).includes(p.id)).map(r => `<a href="#${esc(r.id)}">${esc(r.id)}</a>`).join(", ")}</p></div>`).join("")}</section>` : "";

const sideHtml = manifest.flows.map(f => { const a = reviewed.find(x => x.flowId === f.id); return a
  ? `<a href="#${esc(f.id)}"><span><span class="dot dot--done"></span>${esc(f.title)}</span><small>${(a.recommendations || []).length}</small></a>`
  : `<a class="pending" href="#pending"><span><span class="dot"></span>${esc(f.title)}</span><small>next</small></a>`; }).join("");

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ride Price Mobile UI — Improvement View</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${css}</style></head>
<body>
<header class="appbar"><div class="brand"><i>Ride</i><span>PRICE</span></div><span class="chip">UI IMPROVEMENT</span><a class="back" href="index.html">← Flow library</a>
  <span class="ver">improvement view ${esc(matrix.version || "")} · on library ${esc(version.version || "")}${version.appCommit ? ` · app ${esc(String(version.appCommit).slice(0, 7))}` : ""} · matrix updated ${esc(stamp)}</span></header>
<div class="layout">
  <nav class="side"><h4>Product areas</h4>${sideHtml}<h4>Reports</h4><a href="../reports/ui-improvement-report.md">Improvement report</a><a href="../reports/opportunity-board.md">Opportunity board</a><a href="../reports/mobbin-reference-summary.md">Mobbin reference summary</a><a href="../reports/screen-improvement-matrix.json">Screen matrix (JSON)</a></nav>
  <main class="main">
    <section class="hero">
      <div><h1>Ride Price Mobile UI — Improvement View</h1>
        <p>The second layer on the flow library: the same screenshots, their existing comment cards, and — for each — a stronger diagnosis, what better mobile apps do (Mobbin references), and what Ride Price should do next while staying Ride Price: navy foundation, orange-to-pink gradient for the one main action, Poppins, one button radius.</p>
        <p>Reviewed <b>one product area at a time</b>. The original screenshot always stays as the reference point; nothing here is a redesign.</p></div>
      <div class="stats"><div class="stat"><b>${reviewed.length} / ${manifest.flows.length}</b><span>areas reviewed</span></div><div class="stat"><b>${allRecs.length}</b><span>recommendations</span></div><div class="stat"><b>${(matrix.patterns || []).filter(p => allRecs.some(r => (r.patterns || []).includes(p.id))).length}</b><span>Mobbin patterns</span></div>
        <div class="stat"><b>${priTotals.High}</b><span>${priBadge("High")}</span></div><div class="stat"><b>${priTotals.Medium}</b><span>${priBadge("Medium")}</span></div><div class="stat"><b>${priTotals.Low}</b><span>${priBadge("Low")}</span></div></div>
    </section>
    <p class="legend"><b>Finding types:</b> ${typeBadge("Existing Comment Expanded")} the library already flagged it, deepened here · ${typeBadge("Newly Detected UI Issue")} found by looking at the screenshot · ${typeBadge("Pattern Opportunity")} nothing broken, a better structure exists · <b>Severity</b> is the audit scale; <b>priority</b> is the order to fix in.</p>
    ${reviewed.map(areaHtml).join("")}
    ${pending.length ? `<section class="pendbox" id="pending"><h2>Not yet reviewed — next in line</h2><p class="notes">Areas are taken one at a time, in the order the flow library lists them. Their existing comment cards stand in the flow library until their turn.</p><ol>${pending.map(f => `<li>${esc(f.title)} <small>(${f.screens.length} screens${issues.filter(i => f.screens.some(s => s.screenshot === i.screenshot)).length ? `, ${issues.filter(i => f.screens.some(s => s.screenshot === i.screenshot)).length} existing comment${issues.filter(i => f.screens.some(s => s.screenshot === i.screenshot)).length === 1 ? "" : "s"}` : ""})</small></li>`).join("")}</ol></section>` : ""}
    ${patternsHtml}
  </main>
</div>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Enlarged screenshot" tabindex="-1"><img id="lbImg" alt=""><div class="cap" id="lbCap"></div></div>
<script>
  const lb = document.getElementById("lb"), lbImg = document.getElementById("lbImg"), lbCap = document.getElementById("lbCap"); let opener = null;
  document.addEventListener("click", (e) => {
    const z = e.target.closest(".zoom"); if (z) { const im = z.querySelector("img"); lbImg.src = im.src; lbImg.alt = im.alt; lbCap.textContent = z.dataset.cap; opener = z; lb.classList.add("open"); lb.focus(); return; }
    if (e.target === lb || e.target === lbImg) { lb.classList.remove("open"); if (opener) opener.focus(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lb.classList.contains("open")) { lb.classList.remove("open"); if (opener) opener.focus(); } });
</script>
</body></html>`;
writeFileSync(join(ROOT, "master-flow", "improvement-view.html"), html);

/* ============================ the report ============================ */
const md = [];
md.push(`# Ride Price Mobile UI — Improvement Report`, "", `Improvement view ${matrix.version || ""} · built on flow library ${version.version || ""} (app ${String(version.appCommit || "").slice(0, 7)}) · matrix updated ${stamp}`, "",
  `This report takes each product area of the Ride Price mobile experience, starts from the comment cards the screenshot library already carries, deepens them, adds what the screenshots themselves show, and attaches what stronger mobile apps do (Mobbin references) — then translates each lesson back into Ride Price's own vocabulary: navy foundation, the orange-to-pink gradient for the one main forward action, Poppins, one button radius, the existing component families. Nothing here redesigns Ride Price into another brand.`, "",
  `**Areas are reviewed one at a time.** ${reviewed.length} of ${manifest.flows.length} so far; the rest are listed at the end in the order they will be taken.`, "",
  `| | Count |`, `|---|---|`, `| Recommendations | ${allRecs.length} |`,
  ...TYPES.map(t => `| ${t} | ${typeTotals[t]} |`), ...PRI.map(p => `| ${p} priority | ${priTotals[p]} |`), ...SEV.map(s => `| Severity ${s} | ${sevTotals[s]} |`), "",
  `Finding types: **Existing Comment Expanded** — the library already flagged it and this deepens it · **Newly Detected UI Issue** — found by looking at the screenshot · **Pattern Opportunity** — nothing is broken, a better structure exists. Severity keeps the audit's scale; priority is the order to fix in, and a Minor that repeats across screens can be High.`, "");
for (const a of reviewed) {
  const f = flowById[a.flowId]; const recs = a.recommendations || [];
  md.push(`## ${a.flow}`, "", `${f.screens.length} screens · reviewed ${a.reviewedOn || stamp} · ${recs.length} recommendation${recs.length === 1 ? "" : "s"}`, "");
  md.push(`**Screens:** ${f.screens.map(s => `${pad2(s.step)} ${s.screen}`).join(" · ")}`, "");
  const existing = f.screens.flatMap(s => (s.issues || []).map(i => `${i.id} (${i.severity}) on ${pad2(s.step)} ${s.screen}`));
  md.push(`**Documented issues before this review:** ${existing.length ? existing.join("; ") : "none"}`, "");
  if (a.direction) md.push(`### Owner direction — ${a.direction.title}`, "", a.direction.summary, "", `**Principles:**`, ...a.direction.principles.map((x, i) => `${i + 1}. ${x}`), "", `**Open choices before building:**`, ...a.direction.openChoices.map(x => `- ${x}`), "", ...(a.direction.superseded ? [`**Superseded during the build:**`, ...a.direction.superseded.map(x => `- ${x}`), ""] : []), ...(a.direction.decisions ? [`**Decided:**`, ...a.direction.decisions.map((x, i) => `${i + 1}. ${x}`), ""] : []), ...(a.direction.converges ? [`Converges with: ${a.direction.converges.join("; ")}`, ""] : []));
  md.push(`**What already works:** ${a.whatWorks}`, "", `**Strongest recommendations:**`, ...(a.strongest || []).map((s, i) => `${i + 1}. ${s}`), "");
  for (const r of recs) {
    const sc = screenOf(a, r);
    md.push(`### ${r.id} — ${r.title || r.issueSummary}`, "",
      `- **Screen:** ${pad2(sc.step)} ${sc.screen} (\`${r.screenshot}\`)${r.alsoOn && r.alsoOn.length ? ` — also on ${r.alsoOn.map(x => { const m = screenByShot(x); return m ? `${m.f.title} · ${pad2(m.s.step)} ${m.s.screen}` : x; }).join("; ")}` : ""}`,
      `- **Type:** ${r.findingType}${r.existingComment ? ` (builds on ${r.existingComment}${r.commentAssessment ? ` — ${r.commentAssessment}` : ""})` : ""} · **Category:** ${r.category} · **Severity:** ${r.severity} · **Priority:** ${r.priority} · **Fix size:** ${r.fixSize}`, "",
      `**A. Current Ride Price screen.** ${r.issueSummary}`, "",
      `**B. Why it is a problem.** ${r.whyItMatters}`, "",
      `**C. Mobbin reference direction — ${r.mobbinPatternNeeded}.** ${r.referenceInsight}`,
      ...(r.references || []).map(x => `- [${x.app}](${x.url}) — ${x.shows}`), "",
      `**D. Ride Price adaptation.** ${r.ridePriceRecommendation}${r.whatStays ? ` **Stays:** ${r.whatStays}` : ""}`, "",
      ...(r.implementationNote ? [`*Implementation note:* ${r.implementationNote}`, ""] : []));
  }
}
if (pending.length) md.push(`## Not yet reviewed — next in line`, "", ...pending.map((f, i) => `${i + 1}. ${f.title} (${f.screens.length} screen${f.screens.length === 1 ? "" : "s"})`), "");
writeFileSync(join(REPORTS, "ui-improvement-report.md"), md.join("\n"));

/* ============================ the opportunity board ============================ */
const rank = (r) => PRI.indexOf(r.priority) * 10 + SEV.indexOf(r.severity) - (r.alsoOn ? Math.min(r.alsoOn.length, 5) * 0.5 : 0);
const top = [...allRecs].sort((x, y) => rank(x) - rank(y)).slice(0, 10);
const repeats = allRecs.filter(r => r.alsoOn && r.alsoOn.length);
const byFlow = reviewed.map(a => ({ flow: a.flow, n: (a.recommendations || []).length, high: (a.recommendations || []).filter(r => r.priority === "High").length })).sort((x, y) => y.high - x.high || y.n - x.n);
const board = [`# Ride Price Mobile UI — Opportunity Board`, "", `Updated ${stamp} · ${reviewed.length} of ${manifest.flows.length} product areas reviewed · ${allRecs.length} recommendations so far. This board is generated from the screen improvement matrix and grows as each area is reviewed — until every area is in, "top" means top of what has been reviewed.`, "",
  `## Top opportunities (by priority, then severity, then how widely they repeat)`, "", `| # | Id | Area | Opportunity | Priority | Severity | Size |`, `|---|---|---|---|---|---|---|`,
  ...top.map((r, i) => `| ${i + 1} | ${r.id} | ${r.flow} | ${r.title || r.issueSummary} | ${r.priority} | ${r.severity} | ${r.fixSize} |`), "",
  `## Which areas need the most attention`, "", `| Area | Recommendations | High priority |`, `|---|---|---|`, ...byFlow.map(b => `| ${b.flow} | ${b.n} | ${b.high} |`), "",
  `## Issues that repeat across screens`, "", ...(repeats.length ? repeats.map(r => `- **${r.id}** — ${r.title || r.issueSummary} — on ${1 + r.alsoOn.length} screens (${r.flow}${r.alsoOn.map(x => { const m = screenByShot(x); return m && m.f.title !== r.flow ? "; " + m.f.title : ""; }).filter((v, i, arr) => v && arr.indexOf(v) === i).join("")})`) : ["_None recorded yet._"]), "",
  `## Biggest overall gains`, "", ...(matrix.board && matrix.board.biggestGains ? matrix.board.biggestGains.map(s => `- ${s}`) : ["_Written once enough areas are reviewed to compare._"]), "",
  `## Where to start`, "", ...(matrix.board && matrix.board.whereToStart ? matrix.board.whereToStart.map((s, i) => `${i + 1}. ${s}`) : ["_See the top of this board._"]), ""];
writeFileSync(join(REPORTS, "opportunity-board.md"), board.join("\n"));

/* ============================ the Mobbin reference summary ============================ */
const pats = (matrix.patterns || []).filter(p => allRecs.some(r => (r.patterns || []).includes(p.id)));
const refmd = [`# Ride Price — Mobbin Reference Summary`, "", `Updated ${stamp}. One entry per reference family used by the improvement review so far. Each was looked up on Mobbin for a specific Ride Price problem; the screens are listed so they can be opened, and the lesson is what Ride Price takes — structure and clarity, never the other app's brand. Nothing here says "copy X": the adaptation always re-expresses the pattern in Ride Price's navy, gradient, Poppins and existing components.`, ""];
for (const p of pats) {
  refmd.push(`## ${p.id} · ${p.name}`, "", `**Ride Price problem it was looked up for:** ${p.problem}`, "", `**What was reviewed:**`, ...(p.references || []).map(r => `- [${r.app}](${r.url}) — ${r.shows}`), "",
    `**Common pattern across the references:** ${p.commonPattern}`, "", `**Lesson most relevant to Ride Price:** ${p.lesson}`, "", `**Should influence:** ${p.influence}`, "",
    `Used by: ${allRecs.filter(r => (r.patterns || []).includes(p.id)).map(r => r.id).join(", ")}`, "");
}
if (!pats.length) refmd.push("_No patterns recorded yet._", "");
writeFileSync(join(REPORTS, "mobbin-reference-summary.md"), refmd.join("\n"));

console.log(`improvement view: ${reviewed.length}/${manifest.flows.length} areas, ${allRecs.length} recommendations, ${pats.length} patterns → master-flow/improvement-view.html, reports/ui-improvement-report.md, reports/opportunity-board.md, reports/mobbin-reference-summary.md`);

/* Ride Price UI Library — build the master flow page and the reports from
   reports/flow-manifest.json + reports/issues.json + reports/version.json.
   Pure generation: no browser, no app changes. Run after capture.mjs. */
import { LIB, REPORTS, MASTER, join, writeFileSync, mkdirSync, existsSync } from "./lib.mjs";
import { readFileSync } from "node:fs";

const read = (p, fallback) => existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback;
const manifest = read(join(REPORTS, "flow-manifest.json"), null);
if (!manifest) throw new Error("no flow-manifest.json — run capture.mjs first");
const issues = read(join(REPORTS, "issues.json"), []);
const version = read(join(REPORTS, "version.json"), { version: "v001", capturedAt: manifest.capturedAt, appCommit: manifest.appCommit });

/* attach issues to screens by screenshot path, and fold them into the manifest */
const byShot = {};
for (const is of issues) (byShot[is.screenshot] ||= []).push(is);
for (const f of manifest.flows) for (const sc of f.screens) sc.issues = (byShot[sc.screenshot] || []).map(i => ({ id: i.id, severity: i.severity, issue: i.issue, observation: i.observation || "", area: i.area || "" }));
writeFileSync(join(REPORTS, "flow-manifest.json"), JSON.stringify(manifest, null, 2));

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SEV = ["Critical", "Major", "Minor", "Observation"];
const sevCount = (list) => SEV.reduce((o, s) => (o[s] = list.filter(i => i.severity === s).length, o), {});
const totals = sevCount(issues);
const screenCount = manifest.flows.reduce((n, f) => n + f.screens.length, 0);
const branchCount = manifest.flows.reduce((n, f) => n + f.screens.reduce((m, s) => m + (s.branches ? s.branches.length : 0), 0), 0)
  + manifest.flows.filter(f => f.entry).length;
const flowIndex = Object.fromEntries(manifest.flows.map(f => [f.id, f]));
const screenById = (ref) => { /* "flowId/stepKey" */
  const [fid, key] = String(ref).split("/"); const f = flowIndex[fid]; if (!f) return null;
  const sc = f.screens.find(s => s.key === key); return sc ? { flow: f, screen: sc } : null;
};
const refLabel = (ref) => { const r = screenById(ref); return r ? `${r.flow.title} · ${String(r.screen.step).padStart(2, "0")} ${r.screen.screen}` : ref; };
const refHref = (ref) => { const r = screenById(ref); return r ? `#${r.flow.id}-${r.screen.key}` : "#"; };

/* ---------------- master-flow/index.html ---------------- */
const css = `
:root{--chrome:#071b49;--chrome-2:#0b255d;--navy:#262254;--ink:#34314e;--muted:#6f6c88;--bg:#f2f2f8;--line:#e3e1ef;--card:#fff;--radius:14px;
--grad:linear-gradient(92deg,#f7b733,#ff7a00 38%,#ff4d5a 70%,#c9184a);--crit:#c62828;--major:#e65100;--minor:#b46811;--obs:#1e5aa8;--ok:#1f8a4c}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:Poppins,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--ink);font-size:14px;line-height:1.5}
a{color:inherit}
.appbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:14px;padding:10px 22px;background:linear-gradient(90deg,var(--chrome),var(--chrome-2));color:#fff}
.brand{font-weight:800;font-size:20px;letter-spacing:.3px}.brand i{font-style:italic;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}.brand span{font-weight:700;font-size:12px;letter-spacing:2px;margin-left:6px;opacity:.9}
.appbar .ver{font-size:12px;opacity:.9}.appbar .dlwrap--all{margin-left:auto}.appbar .dl.dl--all{width:auto;min-width:36px;padding:0 12px;font-size:13px;letter-spacing:.2px;white-space:nowrap}.appbar input{border:0;border-radius:16px;padding:8px 14px;font:inherit;font-size:13px;width:260px;max-width:40vw}
.chip{border:1px solid #f7b733;color:#f7b733;border-radius:99px;padding:2px 10px;font-size:11px;font-weight:800;letter-spacing:1px}
.layout{display:grid;grid-template-columns:260px 1fr;min-height:calc(100vh - 52px)}
.side{background:#fff;border-right:1px solid var(--line);padding:18px 14px;position:sticky;top:52px;height:calc(100vh - 52px);overflow:auto}
.side h4{margin:8px 8px 6px;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:var(--muted)}
.side a{display:flex;justify-content:space-between;gap:8px;padding:8px 10px;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;color:var(--navy)}.side a:hover{background:var(--bg)}.side a small{color:var(--muted);font-weight:600}
.main{padding:22px 26px 80px;min-width:0}
.hero{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:18px 22px;margin-bottom:22px;display:grid;grid-template-columns:1.4fr 1fr;gap:18px}
.hero h1{margin:0 0 4px;font-size:22px;color:var(--navy)}.hero h1::after{content:"";display:block;height:4px;width:54px;background:var(--grad);border-radius:99px;margin-top:6px}
.hero p{margin:6px 0;color:var(--ink)}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.stat{background:var(--bg);border-radius:12px;padding:10px 12px}.stat b{display:block;font-size:22px;color:var(--navy)}.stat span:not([class]){font-size:11.5px;color:var(--muted)}
.sev{display:inline-block;border-radius:99px;padding:2px 9px;font-size:10.5px;font-weight:800;letter-spacing:.4px;color:#fff}.sev--Critical{background:var(--crit)}.sev--Major{background:var(--major)}.sev--Minor{background:var(--minor)}.sev--Observation{background:var(--obs)}
.flow{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:18px 20px;margin-bottom:24px;scroll-margin-top:70px}
.flow header{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}.flow h2{margin:0;font-size:17px;color:var(--navy);text-transform:uppercase;letter-spacing:.6px}.flow h2 small{color:var(--muted);font-weight:600;letter-spacing:0;text-transform:none;margin-left:8px}
.dlwrap{position:relative;margin-left:auto}.dl{width:36px;height:36px;border-radius:99px;border:1.5px solid var(--line);background:#fff;color:var(--navy);font-size:16px;font-weight:800;cursor:pointer;line-height:1}.dl:hover,.dl[aria-expanded="true"]{border-color:var(--navy);background:var(--bg)}.dl:focus-visible{outline:3px solid #f7b733;outline-offset:2px}
.dl,.dlmenu button{touch-action:manipulation}
.dlwrap{display:flex;align-items:center;gap:8px;margin-left:auto;flex-wrap:wrap;justify-content:flex-end;max-width:100%;min-width:0}
.dlwrap .dl{order:2;flex:none}.dlwrap .dlmenu,.dlwrap .dlnote{order:1;min-width:0} /* pills grow leftward; the arrow never moves */
.dlmenu{flex-wrap:wrap;justify-content:flex-end}
@media (max-width:560px){.flow .dlwrap{width:100%}.dlmenu button{flex:1 1 0}} /* narrow: a flow header's pills take their own line, never overflowing the header — the app bar's pill stays on the brand row, so the sticky bar does not grow past its scroll margin */
.dlmenu{display:flex;gap:6px;align-items:center}.dlmenu[hidden]{display:none}
.dlmenu button{border:1px solid var(--line);background:#fff;font:inherit;font-size:12.5px;font-weight:700;color:var(--navy);padding:8px 13px;border-radius:99px;cursor:pointer;white-space:nowrap}
.dlmenu button:hover,.dlmenu button:focus-visible{border-color:var(--navy);background:var(--bg);outline:none}.dlnote{color:var(--muted);font-size:12px;padding:6px 4px;white-space:nowrap}
.appbar .dlnote{position:absolute;right:0;top:calc(100% + 12px);z-index:1;background:#fff;color:var(--navy);border:1px solid var(--line);border-radius:10px;padding:7px 11px;box-shadow:0 8px 22px rgba(38,34,84,.18);white-space:normal;text-align:right;width:max-content;max-width:min(320px,80vw)} /* the bar's note is a popover under the pill: in the row it read 3:1 on the navy, grew the sticky bar while counting, and an error pushed a tablet sideways */
.lbdl{position:absolute;right:18px;bottom:10px;color:#fff;font-weight:700;text-decoration:none;border:1.5px solid rgba(255,255,255,.7);border-radius:99px;padding:6px 12px;font-size:12.5px}.lbdl:hover{background:rgba(255,255,255,.15)}
.flow .desc{margin:4px 0 10px;color:var(--ink)}.entry{font-size:12.5px;color:var(--muted);margin:0 0 12px}.entry a{color:var(--navy);font-weight:700}
.strip{display:flex;gap:0;overflow-x:auto;padding:6px 2px 14px;align-items:flex-start}
.scr{flex:0 0 auto;width:250px;scroll-margin-top:70px}.scr .frame{position:relative;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:#111;box-shadow:0 8px 22px rgba(38,34,84,.12)}
.scr .zoom{display:block;width:100%;padding:0;border:0;background:#fff;cursor:zoom-in;font:inherit}.scr .zoom:focus-visible{outline:3px solid #f7b733;outline-offset:-3px}
.scr img{display:block;width:100%;height:auto;max-height:540px;object-fit:cover;object-position:top;background:#fff}
.scr .tall::after{content:"scrolls ↓";position:absolute;right:8px;bottom:8px;background:rgba(7,27,73,.8);color:#fff;font-size:10px;padding:2px 7px;border-radius:99px}
.scr .n{position:absolute;left:10px;top:10px;background:var(--navy);color:#fff;font-weight:800;font-size:11px;border-radius:99px;padding:2px 8px;letter-spacing:.5px}
.scr .flags{position:absolute;right:10px;top:10px;display:flex;gap:4px}
.scr h3{margin:10px 0 2px;font-size:13.5px;color:var(--navy)}.scr .hash{font-size:11px;color:var(--muted);font-family:ui-monospace,Consolas,monospace}
.scr .notes{font-size:12px;color:var(--ink);margin:6px 0 0}
.scr details{margin-top:6px;font-size:12px}.scr summary{cursor:pointer;font-weight:700}.issue{border-left:3px solid var(--line);padding:4px 8px;margin:6px 0}.issue--Critical{border-color:var(--crit)}.issue--Major{border-color:var(--major)}.issue--Minor{border-color:var(--minor)}.issue--Observation{border-color:var(--obs)}
.issue b{display:block;font-size:11.5px}.issue p{margin:2px 0;font-size:12px}.auto{font-size:11px;color:var(--muted);margin-top:4px;white-space:pre-wrap}
.arrow{flex:0 0 auto;width:96px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:230px;text-align:center;font-size:11.5px;color:var(--ink)}
.arrow .line{width:100%;height:2px;background:linear-gradient(90deg,var(--line),var(--navy));position:relative;margin-bottom:6px}.arrow .line::after{content:"";position:absolute;right:-1px;top:-4px;border:5px solid transparent;border-left:7px solid var(--navy)}
.arrow .act{font-weight:700;color:var(--navy);max-width:92px}
.branches{margin:6px 0 0;padding:0;list-style:none;font-size:12px}.branches li{margin:2px 0}.branches li::before{content:"↳ ";color:var(--muted)}.branches a{color:var(--navy);font-weight:700;text-decoration:none}
.status{display:inline-block;font-size:10.5px;font-weight:800;border-radius:99px;padding:2px 8px;background:#fdecec;color:var(--crit);margin-left:6px}
.lb{position:fixed;inset:0;background:rgba(7,27,73,.88);display:none;align-items:flex-start;justify-content:center;overflow:auto;z-index:50;padding:24px}.lb.open{display:flex}.lb img{width:390px;max-width:94vw;height:auto;border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.5)}.lb .cap{position:fixed;left:0;right:0;bottom:0;background:rgba(7,27,73,.92);color:#fff;padding:10px 20px;font-size:13px}
.map{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:16px 20px;margin-bottom:22px}.map h2{margin:0 0 10px;font-size:15px;color:var(--navy);text-transform:uppercase;letter-spacing:.6px}
.map ol{margin:0;padding-left:20px;columns:2;column-gap:30px;font-size:13px}.map li{break-inside:avoid;margin:3px 0}.map li small{color:var(--muted)}
.hidden{display:none!important}
@media (max-width:900px){.layout{grid-template-columns:1fr}.side{position:static;height:auto;border-right:0;border-bottom:1px solid var(--line)}.hero{grid-template-columns:1fr}.map ol{columns:1}}
@media (max-width:720px){
  .appbar{flex-wrap:wrap;gap:8px 10px;padding:9px 16px}
  .appbar input{order:3;width:100%;max-width:none}
  .appbar .ver{order:4;width:100%;margin-left:0;font-size:11px;line-height:1.45}
  .appbar a.back{order:2}
  .appbar .dlwrap--all{order:2;margin-left:auto;position:static} /* at these widths the popover anchors to the bar, below the pill, not to the pill inside it */
  .appbar .dlnote{right:16px;top:calc(100% + 6px)}
  .side{padding:12px 10px}
  .stats{grid-template-columns:repeat(2,1fr)}
  .stat{min-width:0}
  .stat b{font-size:19px}
  .main{padding:16px 14px 64px}
  .hero{padding:16px 15px}
  .flow,.map{padding:15px 14px}
  /* the wrapped bar is taller than the desktop one, and it is sticky — an
     anchor jump must clear its real height, not the old 70px */
  .flow,.scr{scroll-margin-top:150px}
}
`;

const sevBadge = (s) => `<span class="sev sev--${s}">${s}</span>`;
const screenCard = (f, sc) => {
  const worst = SEV.find(s => sc.issues.some(i => i.severity === s));
  const auto = sc.checks ? [
    sc.checks.hOverflow ? `horizontal overflow +${sc.checks.hOverflow}px` : null,
    sc.checks.offscreen.length ? `off-screen (${sc.checks.offscreen.length}): ${sc.checks.offscreen.join("; ")}` : null,
    sc.checks.clipped.length ? `clipped text (${sc.checks.clipped.length}): ${sc.checks.clipped.join("; ")}` : null,
    sc.checks.overlaps.length ? `overlap (${sc.checks.overlaps.length}): ${sc.checks.overlaps.join("; ")}` : null,
    sc.checks.tinyTargets.length ? `small targets <36px (${sc.checks.tinyTargets.length}): ${sc.checks.tinyTargets.join("; ")}` : null,
  ].filter(Boolean) : [];
  const tall = (sc.size && sc.size.height > 844) || !!sc.scrollShot;
  return `<article class="scr" id="${esc(f.id)}-${esc(sc.key)}"${sc.standalone ? " data-standalone" : ""} data-search="${esc((f.title + " " + sc.screen + " " + (sc.notes || "") + " " + sc.issues.map(i => i.issue).join(" ")).toLowerCase())}">
    <div class="frame${tall ? " tall" : ""}">
      <span class="n">${String(sc.step).padStart(2, "0")}</span>
      ${worst ? `<span class="flags">${sevBadge(worst)}</span>` : ""}
      <button type="button" class="zoom" aria-label="Enlarge screenshot: ${esc(sc.screen)}" data-cap="${esc(f.title)} · ${String(sc.step).padStart(2, "0")} ${esc(sc.screen)} · ${esc(sc.hash || "")}"><img loading="lazy" src="../${esc(sc.screenshot)}" alt="${esc(sc.screen)}"></button>
    </div>
    <h3>${esc(sc.screen)}${sc.status && sc.status !== "ok" ? `<span class="status">${esc(sc.status)}</span>` : ""}</h3>
    <div class="hash">${esc(sc.hash || "")}${sc.scrollShot ? ` · <a href="../${esc(sc.scrollShot)}" target="_blank">full length ↓</a>` : ""}</div>
    ${sc.notes ? `<p class="notes">${esc(sc.notes)}</p>` : ""}
    ${sc.branches && sc.branches.length ? `<ul class="branches">${sc.branches.map(b => `<li>${esc(b.action)} → <a href="${refHref(b.to)}">${esc(refLabel(b.to))}</a></li>`).join("")}</ul>` : ""}
    ${sc.issues.length ? `<details open><summary>${sc.issues.length} issue${sc.issues.length > 1 ? "s" : ""}</summary>${sc.issues.map(i => `<div class="issue issue--${i.severity}"><b>${sevBadge(i.severity)} ${esc(i.id)}</b><p>${esc(i.issue)}</p>${i.observation ? `<p><em>${esc(i.observation)}</em></p>` : ""}</div>`).join("")}</details>` : ""}
    ${auto.length ? `<details><summary>automated checks (${auto.length})</summary><div class="auto">${esc(auto.join("\n"))}</div></details>` : ""}
    ${sc.error ? `<p class="notes" style="color:var(--crit)">capture error: ${esc(sc.error)}</p>` : ""}
  </article>`;
};
const arrow = (sc) => sc.action ? `<div class="arrow"><div class="line"></div><div class="act">${esc(sc.action)}</div></div>` : `<div class="arrow" style="width:28px"></div>`;
const gap = `<div class="arrow" style="width:28px"></div>`;
/* the link OUT of the strip — the action, then the screen it lands on, named
   and linked. Only a cross-flow ref ("flowId/stepKey") draws one: a next
   inside the flow is already said by the arrow to the card beside it, and
   build renders it nowhere else. */
const exitArrow = (sc) => sc.next && typeof sc.next === "string" && sc.next.includes("/")
  ? `<div class="arrow"><div class="line"></div><div class="act">${esc(sc.action || "")}<br><a href="${refHref(sc.next)}" style="font-weight:600">${esc(refLabel(sc.next))}</a></div></div>` : "";
/* What goes BETWEEN two cards. A step marked `standalone` is not reached from
   the card before it: 08-trade-in/05 is the appraisal form before anyone has
   typed, captured on a DIFFERENT deal and appended rather than inserted
   because the steps above it are one deal's sequence (2026-09-09 ruling).
   Nothing in the flow leads there, so no arrow is drawn into it — a plain gap
   instead — and the card before it is where the sequence ENDS, so that card
   carries the strip's link out. Without this, 04's "Tap Calculate payment"
   pointed at the blank form and the trade strip had NO exit link into Desking
   at all. Say that and no more: Desking's own inbound links never depended on
   this strip — Home's deal row, Vehicles' next-steps and Test Drive's
   completed screen each branch to desking/huddle-gate, branch lists render on
   their own cards, and Desking's section header states its entry from Home.
   A standalone card leads nowhere further along the strip either, so it is a
   terminus in its own right and its own next renders the same way any
   terminus's does. Both of those hold wherever the card sits, and that is
   what the last term is for: whenever no arrow is drawn and a card still
   follows, the 28px gap is emitted, so a standalone card in the MIDDLE of a
   strip is spaced on BOTH sides instead of butting against its neighbour —
   .strip is gap:0, the separator is the only thing holding two cards apart.
   (Today's only standalone step is last, so that arm is unreachable; it is
   written anyway because the arm that would be missing is invisible until
   some flow appends a second such step.) With no standalone step in a flow
   the two conditions collapse to the old rule exactly: an action arrow after
   every card but the last, the cross-flow link after the last, nothing else. */
const sep = (screens, i) => {
  const cur = screens[i], nxt = screens[i + 1];
  const leadsOn = !!nxt && !cur.standalone && !nxt.standalone;
  return leadsOn ? arrow(cur) : exitArrow(cur) + (nxt ? gap : "");
};

const flowsHtml = manifest.flows.map(f => `
<section class="flow" id="${esc(f.id)}" data-flow>
  <header><h2>${esc(f.title)}<small>${f.screens.length} screens</small></h2>${f.screens.some(s => s.status !== "ok") ? `<span class="status">contains incomplete / failed captures</span>` : ""}
    <div class="dlwrap"><button type="button" class="dl" aria-haspopup="menu" aria-expanded="false" aria-label="Download this flow" title="Download this flow">⬇</button>
      <div class="dlmenu" role="menu" hidden><button type="button" role="menuitem" data-dl="png">Flow as one image (PNG)</button><button type="button" role="menuitem" data-dl="zip">Screenshots (ZIP)</button></div></div></header>
  ${f.description ? `<p class="desc">${esc(f.description)}</p>` : ""}
  ${f.entry ? `<p class="entry">↳ Reached from <a href="${refHref(f.entry.from)}">${esc(refLabel(f.entry.from))}</a> — <b>${esc(f.entry.action)}</b></p>` : ""}
  <div class="strip">${f.screens.map((sc, i) => screenCard(f, sc) + sep(f.screens, i)).join("")}</div>
</section>`).join("");

const sideHtml = manifest.flows.map(f => `<a href="#${esc(f.id)}">${esc(f.title)}<small>${f.screens.length}</small></a>`).join("");
const mapHtml = `<div class="map"><h2>How the product connects</h2><ol>${manifest.flows.map(f => `<li><a href="#${esc(f.id)}">${esc(f.title)}</a> <small>— ${f.screens.length} screens${f.entry ? `; from ${esc(refLabel(f.entry.from))}` : "; entry point"}</small></li>`).join("")}</ol></div>`;

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ride Price Mobile UI Flow Library — ${esc(version.version)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>${css}</style></head>
<body>
<header class="appbar"><div class="brand"><i>Ride</i><span>PRICE</span></div><span class="chip">UI LIBRARY</span>
  <input id="q" type="search" placeholder="Filter screens, flows, issues…" aria-label="Filter">
  <div class="dlwrap dlwrap--all"><button type="button" class="dl dl--all" aria-haspopup="menu" aria-expanded="false" aria-label="All: download the whole library" title="Download the whole library">⬇ All</button>
    <div class="dlmenu" role="menu" hidden><button type="button" role="menuitem" data-dl="all">Whole library (ZIP)</button></div></div>
  <span class="ver">${esc(version.version)} · captured ${esc((version.capturedAt || "").slice(0, 16).replace("T", " "))} · viewport 390×844${version.appCommit ? ` · app ${esc(String(version.appCommit).slice(0, 7))}` : ""}</span></header>
<div class="layout">
  <nav class="side"><h4>Product areas</h4>${sideHtml}<h4>Reports</h4><a href="../reports/ux-audit.md">UX audit</a><a href="../reports/flow-manifest.json">Flow manifest</a><a href="../reports/changelog.md">Changelog</a><a href="../reports/library-summary.md">Summary</a></nav>
  <main class="main">
    <section class="hero">
      <div><h1>Ride Price Mobile UI Flow Library</h1>
        <p>Every mobile flow of the working Ride Price portal, captured as a user sees it at 390 × 844, organised as sequential journeys. Read left to right: each arrow names the action that caused the next screen; branches list where else a screen can go; flagged screens carry their UX findings.</p>
        <p>The screenshots are untouched captures of the real application. Nothing here was redesigned — problems are documented, not fixed.</p></div>
      <div class="stats"><div class="stat"><b>${manifest.flows.length}</b><span>flows</span></div><div class="stat"><b>${screenCount}</b><span>screens</span></div><div class="stat"><b>${branchCount}</b><span>branches</span></div>
        <div class="stat"><b>${totals.Critical}</b><span>${sevBadge("Critical")}</span></div><div class="stat"><b>${totals.Major}</b><span>${sevBadge("Major")}</span></div><div class="stat"><b>${totals.Minor} / ${totals.Observation}</b><span>${sevBadge("Minor")} ${sevBadge("Observation")}</span></div></div>
    </section>
    ${mapHtml}
    ${flowsHtml}
  </main>
</div>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Enlarged screenshot" tabindex="-1"><img id="lbImg" alt=""><div class="cap"><span id="lbCap"></span><a id="lbDl" class="lbdl" href="#" download>⬇ Save this screen</a></div></div>
<script>
  /* lightbox: opened from a real button (keyboard-operable), dialog semantics,
     focus moves in on open and back to the trigger on close, Escape closes */
  const lb = document.getElementById("lb"), lbImg = document.getElementById("lbImg"), lbCap = document.getElementById("lbCap");
  let lbOpener = null;
  const lbDl = document.getElementById("lbDl");
  const openLb = (btn) => { const img = btn.querySelector("img"); lbImg.src = img.src; lbImg.alt = img.alt; lbCap.textContent = btn.dataset.cap;
    lbDl.href = img.src; lbDl.setAttribute("download", img.src.split("/").slice(-2).join("-")); lbOpener = btn; lb.classList.add("open"); lb.focus(); };
  lbDl.addEventListener("click", (e) => e.stopPropagation());

  /* ---- per-flow downloads: the flow as one composed image, or its screenshots as a ZIP.
     Both read the screenshots the page already shows; they need the page served from a
     web address (the browser blocks reading images from a file:// page). ---- */
  const saveBlob = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); };
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  /* everything the page says about a screen travels with the download: the
     route, the notes, the branch lines and every finding with its severity */
  const flowScreens = (sec) => [...sec.querySelectorAll(".scr")].map(scr => {
    const img = scr.querySelector("img"); let act = "", exitTo = ""; let n = scr.nextElementSibling;
    /* the separator after this card. An EXIT one carries a link to another
       flow as well as the action, so the two are read apart: textContent alone
       glues "Tap Calculate payment" onto the flow it leads to and the README
       prints the pair as one sentence. A plain gap has no .act at all and
       leaves both empty. */
    if (n && n.classList.contains("arrow")) {
      const a = n.querySelector(".act");
      if (a) {
        const link = a.querySelector("a");
        exitTo = link ? link.textContent.replace(/[ \\t\\r\\n]+/g, " ").trim() : "";
        act = [...a.childNodes].filter(cn => cn.nodeName !== "A").map(cn => cn.textContent).join(" ").replace(/[ \\t\\r\\n]+/g, " ").trim();
      }
    }
    const txt = (el) => el ? el.textContent.replace(/[ \\t\\r\\n]+/g, " ").trim() : "";
    const hashEl = scr.querySelector(".hash"); const hash = hashEl ? txt(hashEl).split(" · ")[0] : "";
    return { src: img.src, file: img.src.split("/").pop(), n: scr.querySelector(".n").textContent, name: txt(scr.querySelector("h3")).replace(/capture-failed$/, "").trim(), act,
      /* the card the strip draws no arrow into — the downloads must not draw one either */
      standalone: scr.hasAttribute("data-standalone"), exitTo,
      hash, notes: txt(scr.querySelector(".notes")),
      branches: [...scr.querySelectorAll(".branches li")].map(li => "↳ " + txt(li)),
      issues: [...scr.querySelectorAll(".issue")].map(is => ({ sev: txt(is.querySelector(".sev")), id: txt(is.querySelector("b")).replace(txt(is.querySelector(".sev")), "").trim(), text: [...is.querySelectorAll("p")].map(p => txt(p)) })) };
  });
  const flowMeta = (sec) => ({ title: sec.querySelector("h2").childNodes[0].textContent.trim(), desc: (sec.querySelector(".desc") || {}).textContent || "", entry: (sec.querySelector(".entry") || {}).textContent || "" });
  const SEVC = { Critical: "#c62828", Major: "#e65100", Minor: "#b46811", Observation: "#1e5aa8" };
  const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("could not load " + src)); i.src = src; });
  const wrap = (ctx, text, max) => { const words = text.split(/\\s+/), lines = []; let line = ""; for (const w of words) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; } if (line) lines.push(line); return lines; };
  /* the text block under a screen: name, route, notes, branches, findings.
     Drawn through one routine so the pre-pass (measure) and the paint pass
     lay out identically; returns the height used. */
  function caption(ctx, s, x, y, W, paint) {
    const F = "Poppins, system-ui, sans-serif"; let yy = y;
    const para = (text, font, color, lh, indent) => { if (!text) return; ctx.font = font; const lines = wrap(ctx, text, W - (indent || 0)); for (const ln of lines) { yy += lh; if (paint) { ctx.fillStyle = color; ctx.fillText(ln, x + (indent || 0), yy); } } };
    para(s.n + "  " + s.name, "700 15px " + F, "#262254", 20);
    if (s.hash) { yy += 2; para(s.hash, "500 11px ui-monospace, Consolas, monospace", "#6f6c88", 15); }
    if (s.notes) { yy += 6; para(s.notes, "400 12.5px " + F, "#34314e", 17); }
    if (s.branches.length) { yy += 6; for (const b of s.branches) para(b, "600 12px " + F, "#262254", 16); }
    for (const is of s.issues) {
      yy += 10;
      if (paint) { ctx.fillStyle = SEVC[is.sev] || "#6f6c88"; ctx.beginPath(); ctx.roundRect(x, yy, 3, 18 + is.text.length * 0, 2); ctx.fill(); }
      const top = yy;
      ctx.font = "800 11px " + F; const pillW = ctx.measureText(is.sev.toUpperCase()).width + 16;
      if (paint) { ctx.fillStyle = SEVC[is.sev] || "#6f6c88"; ctx.beginPath(); ctx.roundRect(x + 10, yy + 2, pillW, 18, 9); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillText(is.sev.toUpperCase(), x + 18, yy + 15); ctx.fillStyle = "#262254"; ctx.font = "700 12px " + F; ctx.fillText(is.id, x + 10 + pillW + 8, yy + 15); }
      yy += 22;
      is.text.forEach((t, k) => para(t, (k === 0 ? "500 12px " : "italic 400 12px ") + F, k === 0 ? "#34314e" : "#6f6c88", 16, 10));
      if (paint) { ctx.fillStyle = SEVC[is.sev] || "#6f6c88"; ctx.fillRect(x, top, 3, yy - top + 4); }
    }
    return yy - y;
  }
  async function flowPng(sec) {
    const { title } = flowMeta(sec);
    const shots = flowScreens(sec);
    const imgs = await Promise.all(shots.map(s => loadImg(s.src)));
    const W = 390, GAP = 150, PAD = 40, TOP = 110, MAXH = 1500;
    const scale = (im) => Math.min(1, MAXH / im.naturalHeight);
    const hs = imgs.map(im => Math.round(im.naturalHeight * scale(im)));
    const maxH = Math.max(...hs);
    const measure = document.createElement("canvas").getContext("2d");
    const capH = Math.max(...shots.map(s => caption(measure, s, 0, 0, W, false))) + 40;
    const c = document.createElement("canvas"); c.width = PAD * 2 + shots.length * W + (shots.length - 1) * GAP; c.height = TOP + maxH + capH + PAD;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f2f2f8"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#262254"; ctx.font = "800 28px Poppins, system-ui, sans-serif"; ctx.fillText(title.toUpperCase(), PAD, 56);
    ctx.fillStyle = "#6f6c88"; ctx.font = "600 14px Poppins, system-ui, sans-serif"; ctx.fillText(document.title + " · " + shots.length + " screens", PAD, 82);
    shots.forEach((s, i) => {
      const x = PAD + i * (W + GAP), im = imgs[i], h = hs[i];
      ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(38,34,84,.18)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8; ctx.fillRect(x, TOP, W, h); ctx.shadowColor = "transparent";
      ctx.drawImage(im, 0, 0, im.naturalWidth, Math.round(h / scale(im)), x, TOP, W, h);
      ctx.strokeStyle = "#e3e1ef"; ctx.lineWidth = 1; ctx.strokeRect(x + .5, TOP + .5, W - 1, h - 1);
      ctx.fillStyle = "#262254"; ctx.beginPath(); ctx.roundRect(x + 10, TOP + 10, 34, 22, 11); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "800 12px Poppins, system-ui, sans-serif"; ctx.fillText(s.n, x + 18, TOP + 26);
      caption(ctx, s, x, TOP + maxH + 12, W, true);
    });
    /* arrows and action labels in a second pass, so no card paints over them */
    shots.forEach((s, i) => {
      /* the last card leads out of the flow, not to the card beside it, and a
         standalone card is not led into at all — both leave the space blank */
      if (i >= shots.length - 1 || shots[i + 1].standalone) return;
      const x = PAD + i * (W + GAP), ax = x + W + 14, ay = TOP + Math.min(maxH, 844) / 2, lineW = GAP - 28;
      ctx.strokeStyle = "#262254"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + lineW, ay); ctx.stroke();
      ctx.fillStyle = "#262254"; ctx.beginPath(); ctx.moveTo(ax + lineW, ay - 6); ctx.lineTo(ax + lineW + 10, ay); ctx.lineTo(ax + lineW, ay + 6); ctx.fill();
      ctx.font = "700 12px Poppins, system-ui, sans-serif"; ctx.textAlign = "center";
      wrap(ctx, s.act || "", GAP - 24).slice(0, 5).forEach((ln, k) => ctx.fillText(ln, ax + lineW / 2, ay + 22 + k * 16));
      ctx.textAlign = "left";
    });
    const blob = await new Promise(res => c.toBlob(res, "image/png"));
    if (!blob) throw new Error("no image");
    saveBlob(blob, "ride-price-" + slug(title) + ".png");
  }
  /* a store-only ZIP (no compression — PNGs are already compressed), written by hand */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    const u16 = (n) => [n & 255, (n >> 8) & 255], u32 = (n) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >>> 24) & 255];
    for (const f of files) {
      const name = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      const head = new Uint8Array([0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(name.length), ...u16(0)]);
      parts.push(head, name, f.data);
      central.push(new Uint8Array([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(sz), ...u32(sz), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), name);
      off += head.length + name.length + sz;
    }
    const cdSize = central.reduce((n, p) => n + p.length, 0);
    const end = new Uint8Array([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(off), ...u16(0)]);
    return new Blob([...parts, ...central, end], { type: "application/zip" });
  }
  async function flowZip(sec) {
    const { title } = flowMeta(sec);
    const shots = flowScreens(sec);
    const files = [];
    for (const s of shots) { const r = await fetch(s.src); if (!r.ok) throw new Error("could not fetch " + s.src); files.push({ name: slug(title) + "/" + s.file, data: new Uint8Array(await r.arrayBuffer()) }); }
    /* the comments travel with the screenshots */
    files.push({ name: slug(title) + "/README.md", data: new TextEncoder().encode(flowReadme(sec, shots)) });
    saveBlob(zip(files), "ride-price-" + slug(title) + ".zip");
  }
  /* the flow README, as text — shared by the per-flow ZIP and the whole-library ZIP */
  function flowReadme(sec, shots) {
    const { title, desc, entry } = flowMeta(sec);
    const md = ["# " + title, "", document.title, "", desc.trim(), entry.trim(), ""];
    shots.forEach((s, i) => {
      /* an action that leaves the flow is still an action. It was being
         dropped once the card after it went standalone — which is how the
         trade flow's own exit into Desking vanished from every download of it
         (CodeRabbit, PR #96) — and the last card's exit had never been written
         down at all, because the old test only asked whether another card
         followed. Named an EXIT rather than an action to next, since the
         screen it reaches is not the one beside it. */
      const step = s.exitTo ? "- Exit: " + (s.act ? s.act + " → " : "") + s.exitTo
        : (s.act && i < shots.length - 1 && !shots[i + 1].standalone ? "- Action to next: " + s.act : "");
      md.push("## " + s.n + " " + s.name, "", "- Screenshot: " + s.file, s.hash ? "- Route: " + s.hash : "", step);
      if (s.notes) md.push("- Notes: " + s.notes);
      for (const b of s.branches) md.push("- " + b);
      for (const is of s.issues) { md.push("- **" + is.sev + " " + is.id + "**: " + is.text[0]); for (const t of is.text.slice(1)) md.push("  - " + t); }
      md.push("");
    });
    return md.join(String.fromCharCode(10));
  }
  /* every flow in one archive. A folder per flow with its screenshots and
     README (the same files the per-flow ZIP produces), plus a top-level
     README naming the version and listing the flows, the changelog and the
     version record. Store-only like the per-flow ZIP; one fetch per screenshot
     is the cost, and the note counts them so the wait is not a blank. */
  async function libraryZip(note) {
    const secs = [...document.querySelectorAll(".flow")];
    const ver = (document.querySelector(".appbar .ver") || {}).textContent || "";
    const root = "ride-price-ui-library-" + (ver.match(/v\\d{3}/) || ["current"])[0] + "/";
    const total = secs.reduce((n, sec) => n + sec.querySelectorAll(".scr").length, 0);
    const files = []; let done = 0;
    const top = ["# Ride Price Mobile UI Flow Library", "", ver.trim(), "", "One folder per flow. Each holds that flow's screenshots and a README with the route, the notes, the branch lines and every finding — the same files the per-flow download produces.", "", "## Flows", ""];
    for (const sec of secs) {
      const { title } = flowMeta(sec); const shots = flowScreens(sec); const dir = root + slug(title) + "/";
      top.push("- " + title + " — " + shots.length + " screen" + (shots.length === 1 ? "" : "s") + " (" + slug(title) + "/)");
      for (const s of shots) {
        const r = await fetch(s.src); if (!r.ok) throw new Error("could not fetch " + s.src);
        files.push({ name: dir + s.file, data: new Uint8Array(await r.arrayBuffer()) });
        done++;
        /* the count is for eyes — a live region rewritten once per screenshot
           would read every number aloud, so the note is busy while it counts
           and the screen reader hears the outcome */
        if (note) { note.setAttribute("aria-busy", "true"); note.textContent = "Preparing… " + done + " of " + total; }
      }
      files.push({ name: dir + "README.md", data: new TextEncoder().encode(flowReadme(sec, shots)) });
    }
    top.push("", "## Reports", "", "- reports/changelog.md — what changed in every version", "- reports/version.json — the capture record for this version", "");
    files.unshift({ name: root + "README.md", data: new TextEncoder().encode(top.join(String.fromCharCode(10))) });
    for (const rep of ["changelog.md", "version.json"]) {
      /* the top README names both, so an archive without one would lie */
      const r = await fetch("../reports/" + rep); if (!r.ok) throw new Error("could not fetch reports/" + rep);
      files.push({ name: root + "reports/" + rep, data: new Uint8Array(await r.arrayBuffer()) });
    }
    saveBlob(zip(files), root.slice(0, -1) + ".zip");
  }
  document.addEventListener("click", async (e) => {
    const tog = e.target.closest(".dl");
    if (tog) { if (tog.__tapped) { tog.__tapped = false; return; } toggleMenu(tog); return; }
    const item = e.target.closest(".dlmenu [data-dl]");
    if (item) { if (item.__tapped) { item.__tapped = false; return; } selectItem(item); }
  });
  function toggleMenu(tog) {
    const wrap = tog.closest(".dlwrap"), note = wrap.querySelector(".dlnote");
    /* the menu and the status popover are mutually exclusive: a finished note
       clears when the menu opens; while Preparing… the note IS the state */
    if (note) { if (note.textContent.startsWith("Preparing")) return; note.remove(); }
    const m = tog.nextElementSibling; const open = m.hidden;
    document.querySelectorAll(".dlmenu").forEach(x => { x.hidden = true; x.previousElementSibling.setAttribute("aria-expanded", "false"); });
    m.hidden = !open; tog.setAttribute("aria-expanded", String(open));
  }
  /* selecting an option closes the menu at once; progress and errors show in
     a small note popover of their own (the owner's report, 2026-08-24) */
  async function selectItem(item) {
    const menu = item.closest(".dlmenu"), wrap = item.closest(".dlwrap"), sec = item.closest(".flow"), kind = item.dataset.dl;
    menu.hidden = true; menu.previousElementSibling.setAttribute("aria-expanded", "false");
    menu.previousElementSibling.focus(); /* focus returns to the toggle */
    const note = document.createElement("div"); note.className = "dlnote"; note.setAttribute("role", "status"); note.textContent = "Preparing…"; wrap.appendChild(note);
    try { await (kind === "all" ? libraryZip(note) : kind === "png" ? flowPng(sec) : flowZip(sec)); }
    catch (err) { note.removeAttribute("aria-busy"); note.textContent = location.protocol === "file:" ? "Downloads need the page served from a web address (the public link) — a file opened directly cannot read its own images." : "Could not prepare the download: " + err.message; return; }
    note.remove();
  }
  /* touch and pen act on pointerup — a zoomable desktop-width page on a phone
     can swallow or delay the synthesized click entirely (the owner's arrow
     tap did nothing). The click that may still follow is suppressed once;
     mouse and keyboard keep the plain click path. */
  /* the suppression token expires: when no compatibility click follows a
     touch tap (the swallowed-click case), a later mouse or keyboard
     activation of the same control must not be consumed */
  const tapped = (el) => { el.__tapped = true; clearTimeout(el.__tapT); el.__tapT = setTimeout(() => { el.__tapped = false; }, 700); };
  document.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse") return;
    const tog = e.target.closest(".dl");
    if (tog) { tapped(tog); toggleMenu(tog); return; }
    const item = e.target.closest(".dlmenu [data-dl]");
    if (item) { tapped(item); selectItem(item); }
  });
  /* the open menu (and any finished note) closes on a tap ANYWHERE outside it.
     pointerdown, not click: mobile browsers do not reliably deliver document-
     level clicks from taps on non-interactive page content. A note that is
     still counting stays — the same test toggleMenu uses, because the text
     moves on from the bare "Preparing…" at the first screenshot, and a note
     removed mid-way would let a second run start over the first and lose
     the error the first one ends in. */
  const closeMenus = () => { document.querySelectorAll(".dlmenu").forEach(x => { x.hidden = true; x.previousElementSibling.setAttribute("aria-expanded", "false"); }); document.querySelectorAll(".dlnote").forEach(x => { if (!x.textContent.startsWith("Preparing")) x.remove(); }); };
  document.addEventListener("pointerdown", (e) => {
    /* a touch tap on these controls activates on pointerup below — cancel the
       compatibility click at the source so it cannot ghost-activate whatever
       sits at those coordinates after the layout settles */
    if (e.pointerType !== "mouse" && e.target.closest(".dl, .dlmenu [data-dl]")) e.preventDefault();
    if (!e.target.closest(".dlwrap")) closeMenus();
  }, true);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = [...document.querySelectorAll(".dlmenu")].find(m => !m.hidden);
    closeMenus();
    if (open) open.previousElementSibling.focus(); /* focus returns to the toggle */
  });
  const closeLb = () => { if (!lb.classList.contains("open")) return; lb.classList.remove("open"); if (lbOpener) { lbOpener.focus(); lbOpener = null; } };
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".scr .zoom"); if (btn) { openLb(btn); return; }
    if (e.target.closest("#lb")) closeLb();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLb(); });
  document.getElementById("q").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll(".scr").forEach(s => s.classList.toggle("hidden", !!q && !s.dataset.search.includes(q)));
    document.querySelectorAll("[data-flow]").forEach(f => f.classList.toggle("hidden", !!q && ![...f.querySelectorAll(".scr")].some(s => !s.classList.contains("hidden"))));
  });
</script>
</body></html>`;
mkdirSync(MASTER, { recursive: true });
writeFileSync(join(MASTER, "index.html"), html);
/* and it has to PARSE. This whole page script is emitted from a template
   literal above, so an escape that is right HERE can be wrong in the file:
   a whitespace class written with single backslashes emits a real tab and a
   real newline, which ends the regex literal and takes every handler on the
   board down with it — downloads included. Nothing else catches that.
   `node --check` reads this file, where those characters sit legally inside
   the template; and a test that runs its own copy of the extracted logic
   only ever proves the copy works. The artifact is the one place the defect
   exists, so the artifact is what is read — here, at the moment it is
   written, rather than by whoever opens the board next. Shipped once, in
   PR #96, with the downloads dead in the published version. */
for (const [, src] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
  if (!src.trim()) continue;
  try { new Function(src); }
  catch (e) {
    throw new Error(`master-flow/index.html: the emitted page script does not parse — ${e.message}\nAlmost always an escape in the template: a regex or string in the emitted code needs its backslashes doubled so they survive the template literal.`);
  }
}

/* ---------------- reports/ux-audit.md ---------------- */
const audit = [];
audit.push(`# Ride Price Mobile UI — UX Audit (${version.version})`, "", `Captured ${version.capturedAt} · viewport 390×844 · app ${version.appCommit || "n/a"}`, "",
  `| Severity | Count |`, `|---|---|`, ...SEV.map(s => `| ${s} | ${totals[s]} |`), "");
audit.push("Severity scale: **Critical** — the user cannot complete the flow · **Major** — the flow continues but the experience is significantly impaired · **Minor** — polish / consistency · **Observation** — worth reviewing, not necessarily broken.", "");
for (const s of SEV) {
  const list = issues.filter(i => i.severity === s);
  audit.push(`## ${s} (${list.length})`, "");
  if (!list.length) { audit.push("_None recorded._", ""); continue; }
  for (const i of list) {
    audit.push(`### ${i.id} — ${i.flow} · ${i.screen}`, "", `- **Screenshot:** \`${i.screenshot}\``, `- **Issue:** ${i.issue}`);
    if (i.observation) audit.push(`- **Observation:** ${i.observation}`);
    if (i.area) audit.push(`- **Suggested area to investigate:** ${i.area}`);
    audit.push("");
  }
}
audit.push("## Automated checks per screen", "", "The capture run measures each screen for horizontal overflow, elements beyond the viewport, clipped text, text overlap and small touch targets. Two thresholds are in play and they are not the same: this capture script flags anything under **36px**, while the touch floor itself is **40px for every control** (owner, 2026-08-31 — one number, no small-variant tier). So a target in the 36-39px band is reported only by the eye, and anything under 36px is caught by both. `harness/touchfloor.mjs` is what actually enforces the floor across every route — for pressable controls (`button`, links, `role=button`); native form fields sit outside its selector, and their measured shortfalls are RP-UI-029's finding, not this harness's coverage. These are hints that were reviewed by eye; the findings above are the reviewed result. Raw values live in `flow-manifest.json` under each screen's `checks`.", "");
writeFileSync(join(REPORTS, "ux-audit.md"), audit.join("\n"));

/* ---------------- reports/library-summary.md ---------------- */
const sum = [`# Ride Price Mobile UI Library`, "", `Version: ${version.version}`, `Captured: ${version.capturedAt}`, `App commit: ${version.appCommit || "n/a"}`, `Viewport: 390 × 844 (long screens captured full-length)`, "",
  `Flows discovered: ${manifest.flows.length}`, `Screens documented: ${screenCount}`, `Branches documented: ${branchCount}`, "",
  `UX Audit:`, ...SEV.map(s => `- ${s}: ${totals[s]}`), "", `## Flows`, "", `| # | Flow | Screens | Entry |`, `|---|---|---|---|`,
  ...manifest.flows.map((f, i) => `| ${i + 1} | ${f.title} | ${f.screens.length} | ${f.entry ? refLabel(f.entry.from) + " — " + f.entry.action : "entry point"} |`), "",
  `## Incomplete or failed captures`, "",
  ...(manifest.flows.flatMap(f => f.screens.filter(s => s.status !== "ok").map(s => `- ${f.title} · ${String(s.step).padStart(2, "0")} ${s.screen}: ${s.status}${s.error ? " — " + s.error : ""}`)).length
    ? manifest.flows.flatMap(f => f.screens.filter(s => s.status !== "ok").map(s => `- ${f.title} · ${String(s.step).padStart(2, "0")} ${s.screen}: ${s.status}${s.error ? " — " + s.error : ""}`))
    : ["_None._"]), ""];
writeFileSync(join(REPORTS, "library-summary.md"), sum.join("\n"));
console.log(`built master-flow/index.html, ux-audit.md, library-summary.md — ${manifest.flows.length} flows, ${screenCount} screens, ${issues.length} issues`);

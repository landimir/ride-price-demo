/* Versions of one library screen, for the owner to pick between on the cut board.
   Each version is the app with a few exact text changes, captured the way the library captures that screen, so he
   picks between real screens, not drawings. The app itself is never touched: every version runs on a copy.

   Run:  node ride-price-ui-library/tools/versions.mjs <spec.mjs>
   A spec (board/versions/<flow>__<key>.mjs) default-exports
     { screen: "<flowId>/<key>", question, versions: [{ id: "a", label, note?, patches: [{ file, find, replace }] }] }
   where file is relative to ride-price-portal/ and find must occur exactly once; a version with no patches is the app
   as it is. Writes board/choices/<flow>__<key>-<id>.png per version, and board/choices/<flow>__<key>.json: the
   document Claude writes to the board's `choices` collection (the pictures are published beside the page). Neither is
   committed: board/README.md says how they are published, and a choice shows on the page only once both are in. */
import { Session, LIB, join, mkdirSync, writeFileSync } from "./lib.mjs";
import { FLOWS } from "./flows.mjs";
import { PORTAL } from "../../harness/paths.mjs";
import { cpSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (!process.argv[2]) throw new Error("usage: node versions.mjs <spec.mjs>");
const spec = (await import(pathToFileURL(resolve(process.argv[2])).href)).default;
const [flowId, key] = String(spec.screen).split("/");
const flow = FLOWS.find((f) => f.id === flowId);
if (!flow) throw new Error("no flow " + flowId);
const at = flow.steps.findIndex((s) => s.key === key);
if (at < 0) throw new Error(`no step ${key} in ${flowId}`);
/* a scenario or standalone step sets up its own state; any other is reached through the steps before it */
let from = at;
while (from > 0 && !flow.steps[from].scenario && !flow.steps[from].standalone) from--;
if (!spec.versions || spec.versions.length < 2) throw new Error("a choice needs at least two versions");

const OUT = join(LIB, "board", "choices");
mkdirSync(OUT, { recursive: true });
const id = `${flowId}__${key}`;
const doc = { flow: flowId, key, title: flow.steps[at].screen, question: spec.question || "", options: [], at: new Date().toISOString() };

for (const v of spec.versions) {
  /* the copy goes whatever stops the version: a find that is not there once, a browser that will not open, a step that
     fails (CodeRabbit on #270) */
  const root = mkdtempSync(join(tmpdir(), "rp-version-"));
  let s = null;
  try {
    cpSync(PORTAL, root, { recursive: true });
    for (const p of v.patches || []) {
      const f = join(root, p.file);
      const t = readFileSync(f, "utf8");
      /* the files are checked out with CRLF: a find written with \n is matched in the file's own line endings */
      const eol = t.includes("\r\n") ? "\r\n" : "\n";
      const find = p.find.replace(/\r?\n/g, eol), replace = p.replace.replace(/\r?\n/g, eol);
      const n = t.split(find).length - 1;
      if (n !== 1) throw new Error(`version ${v.id}: ${p.file} has the text ${n} times, not once — ${p.find.slice(0, 90)}`);
      writeFileSync(f, t.split(find).join(replace));
    }
    /* held before open(), so a server or browser it started is closed even when it fails partway */
    s = new Session({ root });
    await s.open();
    const ctx = { photos: s.fixtures() };
    for (let i = from; i <= at; i++) await flow.steps[i].do(s, ctx);
    if (v.check) { const why = await v.check(s); if (why) throw new Error(`version ${v.id} does not show what it says: ${why}`); }
    const file = `${id}-${v.id}.png`;
    const size = await s.shot(join(OUT, file), { focus: flow.steps[at].focus || null });
    doc.options.push({ id: v.id, label: v.label, note: v.note || "", img: "choices/" + file, w: size.width, h: size.height });
    console.log(`  ${v.id}  ${v.label} — ${size.width}×${size.height}`);
  } finally {
    if (s) await s.close();
    rmSync(root, { recursive: true, force: true });
  }
}
writeFileSync(join(OUT, id + ".json"), JSON.stringify(doc, null, 1) + "\n");
console.log(`${doc.options.length} versions of ${spec.screen} → ${OUT}`);

/* Render master-flow/improvement-view.html in headless Chrome, assert it really
   built (areas, screenshots loaded, recommendation cards present) and save
   desktop screenshots where OUT points (default: the repo-ignored scratch dir
   passed as argv[2]; falls back to tools/). Not part of the library itself. */
import { launchChrome, CDP, staticServer } from "../../harness/cdp.mjs";
import { LIB, join } from "./lib.mjs";
const OUT = process.argv[2] || join(LIB, "tools");
const srv = await staticServer(LIB, 8466);
const { proc, ws } = await launchChrome(9366);
const c = new CDP(ws); await c.connect();
await c.openTab("http://127.0.0.1:8466/master-flow/improvement-view.html");
await c.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
const info = await c.eval(`(async () => {
  const imgs = [...document.querySelectorAll(".frame img")];
  imgs.forEach(i => { i.loading = "eager"; });
  await Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise(res => { i.addEventListener("load", res, { once: true }); i.addEventListener("error", res, { once: true }); })));
  return { areas: document.querySelectorAll(".area").length, shots: document.querySelectorAll(".shot").length, recs: document.querySelectorAll(".rec").length,
    imgs: imgs.length, broken: imgs.filter(i => i.naturalWidth === 0).length, patterns: document.querySelectorAll(".pat").length, title: document.title };
})()`);
console.log(JSON.stringify(info));
if (!info.areas || !info.recs) { proc.kill(); srv.close(); throw new Error("the improvement view rendered no areas / recommendations"); }
if (!info.shots || !info.imgs) { proc.kill(); srv.close(); throw new Error("the improvement view rendered no screenshot blocks / images — a preview of an empty page proves nothing"); }
if (info.broken) { proc.kill(); srv.close(); throw new Error(`${info.broken} screenshot image(s) failed to load in improvement-view.html`); }
await c.shot(join(OUT, "improvement-preview-1.png"), { x: 0, y: 0, width: 1440, height: 1000 });
await c.eval(`document.querySelector(".area .shot").scrollIntoView()`); await new Promise(r => setTimeout(r, 600));
let y = await c.eval(`window.scrollY`);
await c.shot(join(OUT, "improvement-preview-2.png"), { x: 0, y, width: 1440, height: 1000 });
await c.eval(`document.querySelector("#RP-IMP-002").scrollIntoView()`); await new Promise(r => setTimeout(r, 600));
y = await c.eval(`window.scrollY`);
await c.shot(join(OUT, "improvement-preview-3.png"), { x: 0, y, width: 1440, height: 1000 });
proc.kill(); srv.close();

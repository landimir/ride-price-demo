/* Render master-flow/index.html in headless Chrome and save a desktop
   screenshot next to it (tools/master-preview.png) — a quick visual check that
   the page builds and the images resolve. Not part of the library itself. */
import { launchChrome, CDP, staticServer } from "../../harness/cdp.mjs";
import { LIB, join } from "./lib.mjs";
const srv = await staticServer(LIB, 8465);
const { proc, ws } = await launchChrome(9365);
const c = new CDP(ws); await c.connect();
await c.openTab("http://127.0.0.1:8465/master-flow/index.html");
await c.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
/* force every lazy image to load, wait for each to settle, then judge — a
   preview that only logs would report success over missing screenshots */
const info = await c.eval(`(async () => {
  const imgs = [...document.querySelectorAll(".scr img")];
  imgs.forEach(i => { i.loading = "eager"; });
  await Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise(res => { i.addEventListener("load", res, { once: true }); i.addEventListener("error", res, { once: true }); })));
  return { flows: document.querySelectorAll("[data-flow]").length, screens: document.querySelectorAll(".scr").length,
    imgs: imgs.length, broken: imgs.filter(i => i.naturalWidth === 0).length,
    issues: document.querySelectorAll(".issue").length, title: document.title };
})()`);
console.log(JSON.stringify(info));
if (!info.flows || !info.screens) { proc.kill(); srv.close(); throw new Error("the master page rendered no flows/screens"); }
if (info.broken) { proc.kill(); srv.close(); throw new Error(`${info.broken} screenshot image(s) failed to load in master-flow/index.html`); }
await c.shot(join(LIB, "tools", "master-preview.png"), { x: 0, y: 0, width: 1440, height: 1000 });
await c.eval(`document.querySelector("#finance-menu").scrollIntoView()`); await new Promise(r => setTimeout(r, 800));
const y = await c.eval(`window.scrollY`);
await c.shot(join(LIB, "tools", "master-preview-2.png"), { x: 0, y, width: 1440, height: 1000 });
proc.kill(); srv.close();

/* Viewport screenshots of the master page for the owner: a flow header with the
   download icon, and the open download menu. */
import { launchChrome, CDP, staticServer } from "../../harness/cdp.mjs";
import { LIB, join } from "./lib.mjs";
import { writeFileSync } from "node:fs";
const srv = await staticServer(LIB, 8463);
const { proc, ws } = await launchChrome(9363);
const c = new CDP(ws); await c.connect();
await c.openTab("http://127.0.0.1:8463/master-flow/index.html");
await c.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 760, deviceScaleFactor: 1, mobile: false });
await new Promise(r => setTimeout(r, 1200));
const vshot = async (path) => { const { data } = await c.send("Page.captureScreenshot", { format: "png" }); writeFileSync(path, Buffer.from(data, "base64")); };
await c.eval(`(() => { const y = document.querySelector("#license-scan").getBoundingClientRect().top + window.scrollY - 70; window.scrollTo({ top: y, behavior: "instant" }); return window.scrollY; })()`); await new Promise(r => setTimeout(r, 500));
await vshot(join(LIB, "tools", "master-download-icon.png"));
await c.eval(`document.querySelector("#license-scan .dl").click()`); await new Promise(r => setTimeout(r, 300));
await vshot(join(LIB, "tools", "master-download-menu.png"));
proc.kill(); srv.close();
console.log("shots written");

/* ============================================================
   Ride Price Portal — deal-document marker (simulated recognition)
   Encodes/decodes the marker the portal prints on documents it
   generated itself. It carries an identifier and nothing else:
   a document-type code and a device-local deal token. No field
   values travel on the paper, there is no OCR, and a document the
   portal did not print can never be identified.

   Deliberately a DIFFERENT symbology from the prop-license strip
   in scan.js — different start guard, payload length, stop guard
   and checksum — so neither reader can ever resolve the other's
   mark. `selfTest()` proves that in both directions.
   ============================================================ */
"use strict";

const RIDE_PRICE_DOCSCAN = (function () {

  /* ---------- symbology (single source of truth) ----------
     runs in modules, alternating black/white, starting black:
     quiet(4) | START 3,3,1,1 | 24 × (bar 1|3 + space 1) | STOP 3,1,3 | quiet(4)
     payload bits = code(6) | token(10) | check(8), most significant first.

     The license strip opens 3,1,1,1 and this one opens 3,3,1,1, and both
     decoders demand a quiet zone before the start guard — so neither can
     find a foothold anywhere in the other's mark. See selfTest().        */
  const WIDE = 3, QUIET = 4, BITS = 24;
  const CODE_BITS = 6, TOKEN_BITS = 10;
  const MAX_CODE = (1 << CODE_BITS) - 1, MAX_TOKEN = (1 << TOKEN_BITS) - 1;

  const checkOf = (code, token) => ((code * 7 + token * 13 + 0x5A) & 0xFF);

  function payloadFor(code, token) {
    /* returns an array of 24 bits, most significant first */
    const bits = [];
    const push = (val, n) => { for (let b = n - 1; b >= 0; b--) bits.push((val >> b) & 1); };
    push(code & MAX_CODE, CODE_BITS);
    push(token & MAX_TOKEN, TOKEN_BITS);
    push(checkOf(code & MAX_CODE, token & MAX_TOKEN), 8);
    return bits;
  }

  function readPayload(bits) {
    if (bits.length !== BITS) return null;
    let code = 0, token = 0, check = 0, i = 0;
    for (let b = 0; b < CODE_BITS; b++, i++) code = (code << 1) | bits[i];
    for (let b = 0; b < TOKEN_BITS; b++, i++) token = (token << 1) | bits[i];
    for (let b = 0; b < 8; b++, i++) check = (check << 1) | bits[i];
    if (check !== checkOf(code, token)) return null;
    if (!code) return null; /* code 0 is never issued */
    return { code, token };
  }

  function runWidths(code, token) {
    const w = [3, 3, 1, 1];
    payloadFor(code, token).forEach(bit => w.push(bit ? WIDE : 1, 1));
    w.push(3, 1, 3);
    return w;
  }

  /* marker strip as an SVG string; CSS controls the physical size */
  function markerSVG(code, token, cls) {
    const runs = runWidths(code, token);
    const total = runs.reduce((a, b) => a + b, 0) + QUIET * 2;
    let x = QUIET, rects = "";
    runs.forEach((w, i) => {
      if (i % 2 === 0) rects += `<rect x="${x}" y="0" width="${w}" height="12"/>`;
      x += w;
    });
    return `<svg class="${cls || ""}" viewBox="0 0 ${total} 12" preserveAspectRatio="none" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Document marker ${code}-${token}">${rects}</svg>`;
  }

  /* ---------- image loading ---------- */
  function loadBitmap(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: "from-image" })
        .catch(() => createImageBitmap(file))
        .catch(() => loadViaImg(file));
    }
    return loadViaImg(file);
  }
  function loadViaImg(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("unreadable image")); };
      img.src = url;
    });
  }

  function raster(src, targetW) {
    const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
    if (!sw || !sh) return null;
    const scale = Math.min(1, targetW / sw);
    const w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    /* paper is white: without this, a transparent PNG rasterizes as solid black */
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(src, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    const lum = new Uint8Array(w * h);
    for (let i = 0, j = 0; j < lum.length; i += 4, j++) {
      lum[j] = (px[i] * 77 + px[i + 1] * 150 + px[i + 2] * 29) >> 8;
    }
    return { lum, w, h };
  }

  /* ---------- scanline decoding ---------- */

  /* luminance samples → black/white bits via sliding-window mean + hysteresis */
  function binarize(samples) {
    const n = samples.length;
    const win = Math.max(31, Math.min(91, (n >> 4) | 1));
    const half = win >> 1;
    const prefix = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) prefix[i + 1] = prefix[i] + samples[i];
    const bits = new Uint8Array(n); /* 1 = black */
    let cur = 0;
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - half), b = Math.min(n, i + half + 1);
      const mean = (prefix[b] - prefix[a]) / (b - a);
      if (samples[i] < mean - 9) cur = 1;
      else if (samples[i] > mean + 9) cur = 0;
      bits[i] = cur;
    }
    return bits;
  }

  function runsOf(bits) {
    const runs = [];
    let cur = bits[0], n = 1;
    for (let i = 1; i < bits.length; i++) {
      if (bits[i] === cur) n++;
      else { runs.push({ b: cur === 1, n }); cur = bits[i]; n = 1; }
    }
    runs.push({ b: cur === 1, n });
    return runs;
  }

  const near = (v, target, tol) => Math.abs(v - target) <= tol;

  /* find start…stop in a run sequence; returns {code, token} or null */
  function decodeRuns(runs) {
    const need = 4 + BITS * 2 + 3;
    for (let i = 0; i + need <= runs.length; i++) {
      if (!runs[i].b) continue;
      const r0 = runs[i].n, r1 = runs[i + 1].n, r2 = runs[i + 2].n, r3 = runs[i + 3].n;
      const m = (r0 + r1 + r2 + r3) / 8; /* start guard spans 8 modules */
      if (m < 1.6) continue;
      if (runs[i + 1].b || !runs[i + 2].b || runs[i + 3].b) continue;
      if (!near(r0 / m, 3, 0.85) || !near(r1 / m, 3, 0.85) ||
          !near(r2 / m, 1, 0.6) || !near(r3 / m, 1, 0.6)) continue;
      if (i > 0 && runs[i - 1].n < 2.2 * m) continue; /* quiet zone (line edge counts) */

      const bits = [];
      let ok = true, mm = m;
      for (let k = 0; k < BITS && ok; k++) {
        const bar = runs[i + 4 + 2 * k], space = runs[i + 5 + 2 * k];
        if (!bar.b || space.b) { ok = false; break; }
        const bw = bar.n / mm, sw = space.n / mm;
        if (sw < 0.3 || sw > 2.1) { ok = false; break; }
        if (bw > 1.9 && bw < 4.6) { bits.push(1); mm = mm * 0.75 + (bar.n / 3) * 0.25; }
        else if (bw > 0.35 && bw <= 1.9) { bits.push(0); mm = mm * 0.75 + bar.n * 0.25; }
        else { ok = false; break; }
        mm = mm * 0.8 + space.n * 0.2;
      }
      if (!ok) continue;
      const s0 = runs[i + 4 + BITS * 2], s1 = runs[i + 5 + BITS * 2], s2 = runs[i + 6 + BITS * 2];
      if (!s0.b || s1.b || !s2.b) continue;
      if (!near(s0.n / mm, 3, 1.1) || !near(s1.n / mm, 1, 0.7) || !near(s2.n / mm, 3, 1.1)) continue;
      const got = readPayload(bits);
      if (got) return got;
    }
    return null;
  }

  /* sample a family of parallel lines across the raster at angle theta */
  function scanDirection(img, theta) {
    const { lum, w, h } = img;
    const dx = Math.cos(theta), dy = Math.sin(theta);
    const px = -dy, py = dx; /* perpendicular */
    const cx = w / 2, cy = h / 2;
    const L = Math.ceil(Math.sqrt(w * w + h * h));
    /* denser than the license reader on purpose: that strip fills a card,
       this one is a thin band at the foot of a whole sheet of paper */
    const lines = 120, span = L / 2;
    for (let li = 0; li < lines; li++) {
      const off = -span + (li + 0.5) * (L / lines);
      const ox = cx + px * off, oy = cy + py * off;
      const samples = new Uint8Array(L);
      let inside = false;
      for (let s = 0; s < L; s++) {
        const x = Math.round(ox + dx * (s - L / 2)), y = Math.round(oy + dy * (s - L / 2));
        if (x < 0 || y < 0 || x >= w || y >= h) { samples[s] = 255; continue; }
        samples[s] = lum[y * w + x];
        inside = true;
      }
      if (!inside) continue;
      const runs = runsOf(binarize(samples));
      let got = decodeRuns(runs);
      if (!got) got = decodeRuns(runs.slice().reverse());
      if (got) return got;
    }
    return null;
  }

  function scanRaster(img) {
    const base = [0, 0.14, -0.14, 0.30, -0.30, 0.49, -0.49];
    for (const a of base) {
      let got = scanDirection(img, a);
      if (got) return got;
      got = scanDirection(img, a + Math.PI / 2);
      if (got) return got;
    }
    return null;
  }

  /* ---------- public API ---------- */
  /* deliberately NOT the same signature as RIDE_PRICE_SCAN.recognizeFile:
     the two readers are different features and must not be interchangeable */
  async function readMarkerFile(file) {
    let bmp;
    try { bmp = await loadBitmap(file); }
    catch (e) { return { found: false }; }
    try {
      const srcW = bmp.width || bmp.naturalWidth || 0;
      const targets = Array.from(new Set([1400, 1100, 800, 550].map(t => Math.min(t, srcW))));
      for (const targetW of targets) {
        if (!targetW) break;
        const img = raster(bmp, targetW);
        if (!img) break;
        const got = scanRaster(img);
        if (got) return { found: true, code: got.code, token: got.token };
      }
    } catch (e) {
      return { found: false }; /* contract: resolve, never reject */
    } finally {
      if (bmp && bmp.close) bmp.close();
    }
    return { found: false };
  }

  /* ---------- standing separation check (architecture invariant 4) ----------
     A license prop must never resolve here, and a document marker must never
     resolve in the license reader. Run against the run-width sequences both
     encoders produce, which is the layer where a collision would start. */
  function selfTest() {
    const fails = [];
    if (typeof RIDE_PRICE_SCAN === "undefined") return { ok: false, fails: ["scan.js is not loaded — separation cannot be checked"] };
    /* Take the license runs from the license encoder's REAL output rather than
       re-deriving the symbology here. A copy would keep asserting separation
       from an old start guard after scan.js changed, and still pass. */
    const licenceRuns = (id) => {
      const rects = [];
      RIDE_PRICE_SCAN.barcodeSVG(id).replace(/<rect x="([\d.]+)"[^>]*width="([\d.]+)"/g,
        (m, x, w) => { rects.push([+x, +w]); return m; });
      if (!rects.length) return null;
      rects.sort((a, b) => a[0] - b[0]);
      const w = [];
      rects.forEach(([x, wd], i) => {
        w.push(wd);                                    /* black run */
        if (i < rects.length - 1) w.push(rects[i + 1][0] - (x + wd)); /* white gap */
      });
      return w;
    };
    /* MOD is pixels per module: both decoders reject anything under ~1.6,
       because a real scanline crosses each module several pixels wide */
    const MOD = 4;
    const toRuns = (widths) => {
      const runs = [{ b: false, n: 40 * MOD }]; /* quiet zone */
      widths.forEach((n, i) => runs.push({ b: i % 2 === 0, n: n * MOD }));
      runs.push({ b: false, n: 40 * MOD });
      return runs;
    };
    /* 1. every license prop must be unreadable by the document decoder */
    const licenceStrips = [];
    for (let id = 1; id <= 5; id++) {
      const w = licenceRuns(id);
      if (!w) { fails.push("license prop " + id + " produced no strip to test against"); continue; }
      const r = toRuns(w);
      licenceStrips.push([id, r]);
      if (decodeRuns(r) || decodeRuns(r.slice().reverse())) fails.push("license prop " + id + " decoded as a document marker");
    }
    if (licenceStrips.length !== 5) fails.push("expected 5 license strips to test, got " + licenceStrips.length);
    /* 2. document markers must round-trip, and must be unreadable as licenses */
    const licenceDecode = (runs) => {
      /* the license decoder's own start guard, applied here so the check does
         not depend on scan.js exposing its internals */
      for (let i = 0; i + 23 < runs.length; i++) {
        if (!runs[i].b) continue;
        const m = (runs[i].n + runs[i + 1].n + runs[i + 2].n + runs[i + 3].n) / 6;
        if (m < 1.6) continue;
        if (!near(runs[i].n / m, 3, 0.85) || !near(runs[i + 1].n / m, 1, 0.6) ||
            !near(runs[i + 2].n / m, 1, 0.6) || !near(runs[i + 3].n / m, 1, 0.6)) continue;
        if (i > 0 && runs[i - 1].n < 2.2 * m) continue;
        return true; /* a license start guard got a foothold — that is the failure */
      }
      return false;
    };
    /* THE POSITIVE CONTROL, and it earns its keep twice. Without it every
       assertion here is a negative — a broken licenceRuns() or a typo in
       licenceDecode() would report perfect separation while proving nothing.
       It is also the drift alarm: licenceDecode() re-states scan.js's start
       guard from outside, so if scan.js ever changes that guard, this stops
       finding a foothold in a real license strip and the check goes red. */
    licenceStrips.forEach(([id, r]) => {
      if (!licenceDecode(r) && !licenceDecode(r.slice().reverse())) {
        fails.push("control failed: the license start guard was not found in license prop " + id +
          " — either scan.js changed its symbology or this check is broken, and every separation result above is meaningless");
      }
    });
    [[1, 0], [7, 1], [16, 511], [41, 1023], [47, 42], [63, 1023]].forEach(([code, token]) => {
      const r = toRuns(runWidths(code, token));
      const back = decodeRuns(r);
      if (!back || back.code !== code || back.token !== token) fails.push("marker " + code + "/" + token + " failed to round-trip");
      /* a scanline crossing the strip the other way yields the mirrored run
         list; scanDirection tries both, so the mirror only has to not lie */
      const rev = decodeRuns(r.slice().reverse());
      if (rev && (rev.code !== code || rev.token !== token)) fails.push("marker " + code + "/" + token + " read backwards as a different document");
      if (licenceDecode(r) || licenceDecode(r.slice().reverse())) fails.push("marker " + code + "/" + token + " gave the license reader a foothold");
    });
    /* 3. a corrupted payload must be refused, never guessed at */
    const bad = payloadFor(7, 5); bad[bad.length - 1] ^= 1;
    if (readPayload(bad)) fails.push("a corrupted checksum was accepted");
    return { ok: fails.length === 0, fails };
  }

  return { markerSVG, readMarkerFile, selfTest, MAX_CODE, MAX_TOKEN };
})();

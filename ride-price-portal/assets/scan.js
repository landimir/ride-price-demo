/* ============================================================
   Ride Price Portal — license scan (simulated recognition)
   Encodes/decodes the prop-license training barcode. The decoder
   can ONLY match the known prop symbology — there is no OCR and
   no real-barcode support, so a real ID can never be read.
   ============================================================ */
"use strict";

const RIDE_PRICE_SCAN = (function () {

  /* ---------- symbology (single source of truth) ----------
     runs in modules, alternating black/white, starting black:
     quiet(4) | START 3,1,1,1 | 8 × (bar 1|3 + space 1) | STOP 1,1,3 | quiet(4)
     payload byte = (propId << 4) | (propId XOR 0xF)              */
  const WIDE = 3, QUIET = 4;

  const payloadFor = (id) => ((id & 0xF) << 4) | ((id ^ 0xF) & 0xF);

  function idFromPayload(p) {
    const hi = (p >> 4) & 0xF, lo = p & 0xF;
    if (lo !== ((hi ^ 0xF) & 0xF)) return 0;
    return (hi >= 1 && hi <= 5) ? hi : 0;
  }

  function runWidths(id) {
    const w = [3, 1, 1, 1];
    const p = payloadFor(id);
    for (let b = 7; b >= 0; b--) w.push(((p >> b) & 1) ? WIDE : 1, 1);
    w.push(1, 1, 3);
    return w;
  }

  /* barcode strip as an SVG string; CSS controls the physical size */
  function barcodeSVG(id, cls) {
    const runs = runWidths(id);
    const total = runs.reduce((a, b) => a + b, 0) + QUIET * 2;
    let x = QUIET, rects = "";
    runs.forEach((w, i) => {
      if (i % 2 === 0) rects += `<rect x="${x}" y="0" width="${w}" height="12"/>`;
      x += w;
    });
    return `<svg class="${cls || ""}" viewBox="0 0 ${total} 12" preserveAspectRatio="none" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Training barcode ${id}">${rects}</svg>`;
  }

  /* ---------- image loading ---------- */
  // Demo resource limits. Pixel limits are checked after browser decoding;
  // they are not a substitute for a production upload-processing boundary.
  const MAX_FILE_BYTES = 20 * 1024 * 1024, MAX_IMAGE_PIXELS = 64 * 1000 * 1000;
  async function loadBitmap(file) {
    if (!file || !Number.isFinite(file.size) || file.size <= 0) throw new Error('unreadable-image');
    if (file.size > MAX_FILE_BYTES) throw new Error('file-too-large');
    const mime = String(file.type || '').split(';', 1)[0].trim().toLowerCase();
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp'];
    if (mime && !allowed.includes(mime)) throw new Error('unsupported-image');
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const starts = values => values.every((value, index) => bytes[index] === value);
    const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
    const detected = starts([137,80,78,71,13,10,26,10]) ? 'image/png'
      : starts([255,216,255]) ? 'image/jpeg'
      : ascii(0,4) === 'RIFF' && ascii(8,12) === 'WEBP' ? 'image/webp'
      : ['GIF87a','GIF89a'].includes(ascii(0,6)) ? 'image/gif'
      : ascii(0,2) === 'BM' ? 'image/bmp' : '';
    if (!detected || (mime && mime !== detected)) throw new Error('unsupported-image');
    // Decode the inspected raster type; never let browser MIME sniffing admit SVG.
    file = new Blob([file], { type: detected });
    let bitmap;
    if (window.createImageBitmap) {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
        .catch(() => createImageBitmap(file))
        .catch(() => loadViaImg(file));
    } else bitmap = await loadViaImg(file);
    const width = bitmap.width || bitmap.naturalWidth, height = bitmap.height || bitmap.naturalHeight;
    if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
      bitmap.close?.();
      throw new Error('image-too-large');
    }
    return bitmap;
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
    const scale = Math.min(1, targetW / Math.max(sw, sh));
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

  /* Collect distinct training identities; never let scan order choose a guest. */
  function decodeRuns(runs, found) {
    for (let i = 0; i < runs.length - 22; i++) {
      if (!runs[i].b) continue;
      const r0 = runs[i].n, r1 = runs[i + 1].n, r2 = runs[i + 2].n, r3 = runs[i + 3].n;
      let m = (r0 + r1 + r2 + r3) / 6;
      if (m < 1.6) continue;
      if (!near(r0 / m, 3, 0.85) || !near(r1 / m, 1, 0.6) ||
          !near(r2 / m, 1, 0.6) || !near(r3 / m, 1, 0.6)) continue;
      if (i > 0 && runs[i - 1].n < 2.2 * m) continue; /* quiet zone (line edge counts) */

      let bits = 0, ok = true, mm = m;
      for (let k = 0; k < 8 && ok; k++) {
        const bar = runs[i + 4 + 2 * k], space = runs[i + 5 + 2 * k];
        if (!bar.b || space.b) { ok = false; break; }
        const bw = bar.n / mm, sw = space.n / mm;
        if (sw < 0.3 || sw > 2.1) { ok = false; break; }
        if (bw > 1.9 && bw < 4.6) { bits = (bits << 1) | 1; mm = mm * 0.75 + (bar.n / 3) * 0.25; }
        else if (bw > 0.35 && bw <= 1.9) { bits = bits << 1; mm = mm * 0.75 + bar.n * 0.25; }
        else { ok = false; break; }
        mm = mm * 0.8 + space.n * 0.2;
      }
      if (!ok) continue;
      const s0 = runs[i + 20], s1 = runs[i + 21], s2 = runs[i + 22];
      if (!s0.b || s1.b || !s2.b) continue;
      if (!near(s0.n / mm, 1, 0.7) || !near(s1.n / mm, 1, 0.7) || !near(s2.n / mm, 3, 1.1)) continue;
      if (i + 23 < runs.length && !runs[i + 23].b && runs[i + 23].n < 2.2 * mm &&
          i + 24 < runs.length) continue; /* stop must be followed by quiet or line end */
      const id = idFromPayload(bits);
      if (id) found.add(id);
      if (found.size > 1) return;
    }
  }

  /* sample a family of parallel lines across the raster at angle theta */
  function scanDirection(img, theta, found) {
    const { lum, w, h } = img;
    const dx = Math.cos(theta), dy = Math.sin(theta);
    const px = -dy, py = dx; /* perpendicular */
    const cx = w / 2, cy = h / 2;
    const L = Math.ceil(Math.sqrt(w * w + h * h));
    const lines = 64, span = L / 2;
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
      decodeRuns(runs, found);
      if (found.size > 1) return;
      decodeRuns(runs.slice().reverse(), found);
      if (found.size > 1) return;
    }
  }

  function scanRaster(img, found) {
    const base = [0, 0.14, -0.14, 0.30, -0.30, 0.49, -0.49];
    for (const a of base) {
      scanDirection(img, a, found);
      if (found.size > 1) return;
      scanDirection(img, a + Math.PI / 2, found);
      if (found.size > 1) return;
    }
  }

  /* ---------- public API ---------- */
  const rejection = error => ({ ok: false, reason: ['file-too-large', 'image-too-large', 'unsupported-image'].includes(error?.message) ? error.message : 'unreadable-image' });
  async function validateImage(file) {
    let bitmap;
    try { bitmap = await loadBitmap(file); return { ok: true }; }
    catch (error) { return rejection(error); }
    finally { bitmap?.close?.(); }
  }
  async function previewFile(file) {
    const bitmap = await loadBitmap(file);
    try {
      const width = bitmap.width || bitmap.naturalWidth, height = bitmap.height || bitmap.naturalHeight;
      const scale = Math.min(1, 640 / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(width * scale)); canvas.height = Math.max(1, Math.round(height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', .75);
    } finally { bitmap.close?.(); }
  }
  async function recognizeFile(file) {
    let bmp;
    try { bmp = await loadBitmap(file); }
    catch (e) { return rejection(e); }
    try {
      const found = new Set();
      const srcW = Math.max(bmp.width || bmp.naturalWidth || 0, bmp.height || bmp.naturalHeight || 0);
      const targets = Array.from(new Set([1100, 800, 550, 350].map(t => Math.min(t, srcW))));
      for (let i = 0; i < targets.length; i++) {
        const targetW = targets[i];
        if (!targetW) break;
        const img = raster(bmp, targetW);
        if (!img) break;
        scanRaster(img, found);
        if (found.size > 1) return { ok: false, reason: "multiple-documents" };
        /* Let pending input and rendering run without skipping later identities. */
        if (i + 1 < targets.length) await new Promise(resolve => setTimeout(resolve, 0));
      }
      if (found.size === 1) {
        const id = found.values().next().value;
        return { ok: true, prop: id, persona: personaFor(id) };
      }
    } catch (e) {
      return { ok: false }; /* contract: resolve, never reject */
    } finally {
      if (bmp && bmp.close) bmp.close();
    }
    return { ok: false };
  }

  function personaFor(id) {
    return RIDE_PRICE_DATA.licenseProps.find(p => p.prop === id) || null;
  }

  return { barcodeSVG, recognizeFile, personaFor, validateImage, previewFile };
})();

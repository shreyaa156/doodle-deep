// Canvas helpers for the draw studio: bucket fill and exporting the finished drawing.

export function floodFill(ctx, x0, y0, hex) {
  const { width: w, height: h } = ctx.canvas;
  if (x0 < 0 || y0 < 0 || x0 >= w || y0 >= h) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const n = parseInt(hex.slice(1), 16);
  const fr = (n >> 16) & 255, fg = (n >> 8) & 255, fb = n & 255;
  const i0 = (y0 * w + x0) * 4;
  const tr = d[i0], tg = d[i0 + 1], tb = d[i0 + 2], ta = d[i0 + 3];
  if (ta > 200 && Math.abs(tr - fr) < 4 && Math.abs(tg - fg) < 4 && Math.abs(tb - fb) < 4) return;

  const match = (i) => {
    const a = d[i + 3];
    if (ta < 30) return a < 90; // filling empty water: spread through transparent pixels
    return a > 60 && Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) < 72;
  };

  // scanline fill
  const seen = new Uint8Array(w * h);
  const stack = [x0, y0];
  while (stack.length) {
    const y = stack.pop();
    let x = stack.pop();
    while (x >= 0 && !seen[y * w + x] && match((y * w + x) * 4)) x--;
    x++;
    let up = false, down = false;
    while (x < w && !seen[y * w + x] && match((y * w + x) * 4)) {
      const i = (y * w + x) * 4;
      seen[y * w + x] = 1;
      d[i] = fr; d[i + 1] = fg; d[i + 2] = fb; d[i + 3] = 255;
      if (y > 0) {
        const u = !seen[(y - 1) * w + x] && match(((y - 1) * w + x) * 4);
        if (u && !up) { stack.push(x, y - 1); up = true; } else if (!u) up = false;
      }
      if (y < h - 1) {
        const dn = !seen[(y + 1) * w + x] && match(((y + 1) * w + x) * 4);
        if (dn && !down) { stack.push(x, y + 1); down = true; } else if (!dn) down = false;
      }
      x++;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Crops to the drawn area, shrinks it and encodes it with a transparent background.
// Returns a data URL, or null if nothing was drawn.
export function exportDrawing(canvas) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const d = ctx.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (d[(y * w + x) * 4 + 3] > 10) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;

  const pad = 8;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
  x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;

  for (const max of [320, 240, 180]) {
    const k = Math.min(1, max / Math.max(cw, ch));
    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.round(cw * k));
    out.height = Math.max(1, Math.round(ch * k));
    const o = out.getContext('2d');
    o.imageSmoothingQuality = 'high';
    o.drawImage(canvas, x0, y0, cw, ch, 0, 0, out.width, out.height);
    let url = out.toDataURL('image/webp', 0.85);
    if (!url.startsWith('data:image/webp')) url = out.toDataURL('image/png');
    if (url.length < 200000) return url;
  }
  return null;
}

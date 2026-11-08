// Hand-painted canvas textures. Everything is generated, so the game ships
// without image files and still looks hand made.
export const FONT_D = 'Bungee, "Arial Black", Impact, sans-serif';

// Safari before iOS 16 has no roundRect on canvas
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Math.max(0, Math.min(Array.isArray(r) ? r[0] : r || 0, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath();
  };
}

export function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export function flamePath(g, x, y, s) {
  g.beginPath(); g.moveTo(x, y + s);
  g.bezierCurveTo(x - 0.78 * s, y + s, x - 0.9 * s, y + 0.15 * s, x - 0.48 * s, y - 0.38 * s);
  g.bezierCurveTo(x - 0.34 * s, y - 0.05 * s, x - 0.22 * s, y + 0.06 * s, x - 0.12 * s, y + 0.04 * s);
  g.bezierCurveTo(x - 0.28 * s, y - 0.45 * s, x + 0.02 * s, y - 0.78 * s, x + 0.14 * s, y - s);
  g.bezierCurveTo(x + 0.22 * s, y - 0.62 * s, x + 0.84 * s, y - 0.36 * s, x + 0.74 * s, y + 0.36 * s);
  g.bezierCurveTo(x + 0.68 * s, y + 0.82 * s, x + 0.42 * s, y + s, x, y + s); g.closePath();
}
export function sparkle(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); }
export function bubble(g, text, cx, cy, width, cols, seed, rot) {
  g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 200; g.font = `${fs}px ${FONT_D}`; fs *= width / g.measureText(text).width; g.font = `${fs}px ${FONT_D}`;
  g.translate(cx, cy); g.rotate(rot || -0.05);
  g.fillStyle = '#14082a'; for (let i = 16; i > 0; i--) g.fillText(text, i * fs * 0.006, i * fs * 0.008);
  const R = rng(seed || 3); g.lineWidth = fs * 0.07; g.strokeStyle = '#14082a';
  for (let i = 0; i < 8; i++) { const dx = (R() - 0.5) * width * 0.86, dl = fs * (0.12 + R() * 0.34), dw = fs * 0.05; g.beginPath(); g.roundRect(dx - dw / 2, fs * 0.28, dw, dl, dw / 2); g.arc(dx, fs * 0.28 + dl, dw * 0.75, 0, 7); g.stroke(); g.fillStyle = cols[2]; g.fill(); }
  g.lineJoin = 'round'; g.lineWidth = fs * 0.16; g.strokeStyle = '#14082a'; g.strokeText(text, 0, 0);
  g.fillStyle = 'rgba(255,255,255,.9)'; g.fillText(text, -fs * 0.03, -fs * 0.035);
  const gr = g.createLinearGradient(0, -fs * 0.42, 0, fs * 0.42); gr.addColorStop(0, cols[0]); gr.addColorStop(0.55, cols[1]); gr.addColorStop(1, cols[2]);
  g.fillStyle = gr; g.fillText(text, 0, 0);
  sparkle(g, -width * 0.5, -fs * 0.45, fs * 0.16, '#fff'); sparkle(g, width * 0.46, -fs * 0.3, fs * 0.11, '#fff'); sparkle(g, width * 0.2, fs * 0.62, fs * 0.08, '#fff6c0');
  g.restore();
}
function burst(g, x, y, r, txt) {
  g.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, rr = i % 2 ? r * 0.62 : r; g.lineTo(x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * 0.85); } g.closePath();
  g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = r * 0.08; g.strokeStyle = '#14082a'; g.stroke();
  g.font = `${r * 0.66}px ${FONT_D}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = r * 0.12; g.lineJoin = 'round'; g.strokeText(txt, x, y + r * 0.05); g.fillStyle = '#ff3b2e'; g.fillText(txt, x, y + r * 0.05);
}

export function makeArt() {
  const A = {};
  // concrete
  { const c = cv(512, 512), g = c.getContext('2d'), R = rng(3);
    g.fillStyle = '#cbc6d8'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) { const s = R() * 2.2 + 0.4; g.fillStyle = R() < 0.5 ? `rgba(60,50,90,${R() * 0.13})` : `rgba(255,255,255,${R() * 0.13})`; g.fillRect(R() * 512, R() * 512, s, s); }
    for (let i = 0; i < 14; i++) { const x = R() * 512, y = R() * 512, r = 20 + R() * 70, gg = g.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(70,60,100,${0.05 + R() * 0.07})`); gg.addColorStop(1, 'rgba(70,60,100,0)'); g.fillStyle = gg; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    g.strokeStyle = 'rgba(50,40,80,.3)'; g.lineWidth = 1.2; for (let i = 0; i < 5; i++) { let x = 60 + R() * 390, y = 60 + R() * 390; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 7; j++) { x += (R() - 0.5) * 36; y += (R() - 0.5) * 36; g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = 'rgba(20,16,30,.16)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(150 + R() * 210, 150 + R() * 210, 40 + R() * 80, R() * 6, R() * 6 + 0.8); g.stroke(); }
    A.concrete = c; }
  // side panels of the ramps: painted plywood, tiles every 10.24 m
  { const ppm = 100, c = cv(1024, 416), g = c.getContext('2d'), R = rng(11);
    const gr = g.createLinearGradient(0, 0, 0, 416); gr.addColorStop(0, '#30406f'); gr.addColorStop(1, '#1a2246'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 416);
    for (let i = 0; i < 2600; i++) { g.fillStyle = R() < 0.5 ? `rgba(255,255,255,${R() * 0.05})` : `rgba(0,0,0,${R() * 0.09})`; g.fillRect(R() * 1024, R() * 416, 2 + R() * 7, 1 + R() * 3); }
    g.strokeStyle = 'rgba(6,8,26,.6)'; g.lineWidth = 3;
    for (let x = 0; x <= 1024; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 416); g.stroke(); }
    g.beginPath(); g.moveTo(0, 416 - 1.3 * ppm); g.lineTo(1024, 416 - 1.3 * ppm); g.stroke();
    g.fillStyle = 'rgba(205,215,255,.4)';
    for (let x = 0; x <= 1024; x += 128) for (const y of [20, 140, 300, 396]) { g.beginPath(); g.arc(x - 9, y, 3, 0, 7); g.arc(x + 9, y, 3, 0, 7); g.fill(); }
    const tagCols = ['#86ff4d', '#4aa3ff', '#ff4fa3', '#ffd23f', '#ff7a1a'];
    for (let i = 0; i < 7; i++) { const x = 40 + R() * 940, y = 250 + R() * 130, w = 50 + R() * 50, h = 22 + R() * 10; g.save(); g.translate(x, y); g.rotate((R() - 0.5) * 0.4); g.fillStyle = '#0d0718'; g.beginPath(); g.roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 6); g.fill(); g.fillStyle = tagCols[i % 5]; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 5); g.fill(); g.restore(); }
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2.5; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) { let x = 30 + R() * 900, y = 200 + R() * 150; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += 8 + R() * 12; y += (R() - 0.5) * 20; g.lineTo(x, y); } g.stroke(); }
    const sh = g.createLinearGradient(0, 300, 0, 416); sh.addColorStop(0, 'rgba(10,6,20,0)'); sh.addColorStop(1, 'rgba(10,6,20,.55)'); g.fillStyle = sh; g.fillRect(0, 300, 1024, 116);
    A.panel = c; A.panelM = [10.24, 4.16]; }
  // decals for ramp sides and walls
  const decal = (wm, hm, draw) => { const ppm = 110, c = cv(Math.round(wm * ppm), Math.round(hm * ppm)); draw(c.getContext('2d'), c.width, c.height); return { canvas: c, w: wm, h: hm }; };
  A.decals = {
    vojta: decal(4.2, 1.7, (g, w, h) => bubble(g, 'VOJTA', w / 2, h * 0.42, w * 0.86, ['#fff06a', '#ff9a1f', '#ff3d2e'], 3, -0.05)),
    flame: decal(2.6, 3.0, (g, w, h) => {
      const ex = w / 2, ey = h * 0.42, er = w * 0.42; g.fillStyle = '#120a28'; g.beginPath(); g.arc(ex, ey, er, 0, 7); g.fill();
      g.lineWidth = er * 0.09; g.strokeStyle = '#ffb02e'; g.stroke(); g.lineWidth = er * 0.03; g.strokeStyle = '#ff5a1f'; g.beginPath(); g.arc(ex, ey, er * 0.86, 0, 7); g.stroke();
      const gr = g.createLinearGradient(0, ey + er * 0.7, 0, ey - er * 0.7); gr.addColorStop(0, '#ff3b2e'); gr.addColorStop(0.55, '#ff9a1f'); gr.addColorStop(1, '#ffe95c');
      flamePath(g, ex, ey + er * 0.05, er * 0.68); g.fillStyle = gr; g.fill(); g.lineWidth = er * 0.05; g.strokeStyle = '#14082a'; g.stroke();
      flamePath(g, ex + er * 0.02, ey + er * 0.3, er * 0.32); g.fillStyle = '#fff3a6'; g.fill();
      g.font = `${er * 0.26}px ${FONT_D}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = er * 0.07; g.strokeStyle = '#14082a'; g.lineJoin = 'round';
      g.strokeText('SKATEPARK', ex, ey + er + er * 0.3); g.fillStyle = '#ffe2a6'; g.fillText('SKATEPARK', ex, ey + er + er * 0.3); }),
    bum: decal(2.2, 1.6, (g, w, h) => burst(g, w / 2, h / 2, h * 0.42, 'BUM!')),
    flair: decal(3.2, 1.3, (g, w, h) => bubble(g, 'FLAIR', w / 2, h * 0.42, w * 0.84, ['#ffd0f5', '#ff5bd0', '#9a2bff'], 5, 0.04)),
    salto: decal(3.2, 1.3, (g, w, h) => bubble(g, 'SALTO', w / 2, h * 0.42, w * 0.84, ['#c8fff0', '#2ad1ff', '#2a5bff'], 9, -0.04)),
    turbo: decal(3.2, 1.3, (g, w, h) => bubble(g, 'TURBO', w / 2, h * 0.42, w * 0.84, ['#e8ff9a', '#86ff4d', '#20a020'], 7, 0.03)),
  };
  // back wall blocks with graffiti, two variants of 26 m
  const wall = (pieces, seed) => {
    const ppm = 70, Wm = 26, Hm = 2.6, c = cv(Wm * ppm, Math.round(Hm * ppm)), g = c.getContext('2d'), X = (x) => (x + 13) * ppm, Y = (y) => (Hm - y) * ppm, R = rng(seed);
    g.fillStyle = '#4c4569'; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(20,14,40,.45)'; g.lineWidth = 2;
    for (let r = 0; r < 7; r++) { const y = r * 0.4; g.beginPath(); g.moveTo(0, Y(y)); g.lineTo(c.width, Y(y)); g.stroke(); for (let x = -13 + (r % 2) * 0.4; x < 13; x += 0.8) { g.beginPath(); g.moveTo(X(x), Y(y)); g.lineTo(X(x), Y(y + 0.4)); g.stroke(); } }
    for (let i = 0; i < 1600; i++) { g.fillStyle = R() < 0.5 ? `rgba(255,255,255,${R() * 0.06})` : `rgba(0,0,0,${R() * 0.1})`; g.fillRect(R() * c.width, R() * c.height, 2 + R() * 4, 2 + R() * 3); }
    pieces(g, X, Y, ppm);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 8; i++) { let x = X(-12 + R() * 24), y = Y(0.4 + R() * 1.5); g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 6; j++) { x += 10 + R() * 16; y += (R() - 0.5) * 26; g.lineTo(x, y); } g.stroke(); }
    for (let i = 0; i < 14; i++) sparkle(g, X(-12.5 + R() * 25), Y(0.3 + R() * 2.1), 6 + R() * 9, R() < 0.5 ? '#fff' : '#ffd23f');
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, Y(0.3), c.width, c.height - Y(0.3));
    return c;
  };
  A.wallA = wall((g, X, Y, ppm) => {
    burst(g, X(-5.2), Y(1.3), 0.85 * ppm, 'BUM!');
    bubble(g, 'VOJTA', X(0.2), Y(1.3), 4.4 * ppm, ['#fff06a', '#ff9a1f', '#ff3d2e'], 13, -0.03);
    bubble(g, 'WOW', X(5.4), Y(1.25), 2.0 * ppm, ['#c8fff0', '#2ad1ff', '#2a5bff'], 9, 0.05);
    bubble(g, 'FLAIR', X(-9.8), Y(1.3), 2.4 * ppm, ['#ffd0f5', '#ff5bd0', '#9a2bff'], 5, -0.04);
    bubble(g, 'TURBO', X(9.8), Y(1.3), 2.4 * ppm, ['#e8ff9a', '#86ff4d', '#20a020'], 7, 0.03);
  }, 4);
  A.wallB = wall((g, X, Y, ppm) => {
    bubble(g, 'SKOK', X(-7.5), Y(1.3), 2.6 * ppm, ['#fff06a', '#ffb21f', '#ff6a1f'], 21, 0.04);
    const ex = X(0), ey = Y(1.3), r = 0.95 * ppm; g.fillStyle = '#120a28'; g.beginPath(); g.arc(ex, ey, r, 0, 7); g.fill(); g.lineWidth = r * 0.1; g.strokeStyle = '#ffb02e'; g.stroke();
    const gr = g.createLinearGradient(0, ey + r * 0.7, 0, ey - r * 0.7); gr.addColorStop(0, '#ff3b2e'); gr.addColorStop(0.55, '#ff9a1f'); gr.addColorStop(1, '#ffe95c'); flamePath(g, ex, ey, r * 0.66); g.fillStyle = gr; g.fill();
    bubble(g, 'SALTO', X(6.8), Y(1.3), 2.8 * ppm, ['#c8fff0', '#2ad1ff', '#2a5bff'], 17, -0.04);
    burst(g, X(-2.9), Y(1.6), 0.6 * ppm, 'WOW');
    burst(g, X(3.3), Y(0.9), 0.55 * ppm, 'BUM!');
  }, 8);
  // lit windows
  { const c = cv(256, 512), g = c.getContext('2d'), R = rng(8); g.fillStyle = '#000'; g.fillRect(0, 0, 256, 512);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 8; x++) { const v = R(); if (v < 0.34) { g.fillStyle = v < 0.29 ? `rgba(255,${190 + R() * 40 | 0},${110 + R() * 40 | 0},${0.6 + R() * 0.4})` : 'rgba(150,225,255,.85)'; g.fillRect(x * 32 + 9, y * 25.6 + 6, 14, 14); } }
    A.windows = c; }
  { const c = cv(64, 64), g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 64); g.moveTo(64, 0); g.lineTo(0, 64); g.stroke(); A.chain = c; }
  // soft light cone for floodlights
  { const c = cv(64, 256), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,240,215,.55)'); gr.addColorStop(1, 'rgba(255,240,215,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const sg = g.createLinearGradient(0, 0, 64, 0); sg.addColorStop(0, 'rgba(0,0,0,1)'); sg.addColorStop(0.5, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = sg; g.fillRect(0, 0, 64, 256); A.beam = c; }
  return A;
}

// helmet wraps (equirectangular, front of the helmet is the middle of the image)
export function helmetArt(type) {
  const c = cv(512, 256), g = c.getContext('2d');
  const base = { flame: ['#ff8f2e', '#ff5f14', '#b82c08'], ninja: ['#3a3646', '#1d1b25', '#0d0c12'], robot: ['#eef2fa', '#b6bfd2', '#6c7489'], dino: ['#7be36b', '#3fbf4a', '#21722a'] }[type] || ['#ff8f2e', '#ff5f14', '#b82c08'];
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, base[0]); gr.addColorStop(0.6, base[1]); gr.addColorStop(1, base[2]); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  const flames = (cols) => { const fl = (x0, d, col, sc) => { g.fillStyle = col; for (let i = 0; i < 3; i++) { const y = 98 + i * 24, L = (170 - i * 30) * sc; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + d * L * 0.35, y - 20 * sc, x0 + d * L * 0.55, y - 4); g.quadraticCurveTo(x0 + d * L * 0.78, y - 26 * sc, x0 + d * L, y - 12); g.quadraticCurveTo(x0 + d * L * 0.6, y + 14, x0, y + 18 * sc); g.closePath(); g.fill(); } };
    fl(236, -1, cols[0], 1); fl(276, 1, cols[0], 1); fl(236, -1, cols[1], 0.62); fl(276, 1, cols[1], 0.62); };
  const num = (txt, fill, stroke) => { g.font = `64px ${FONT_D}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.lineJoin = 'round'; g.strokeStyle = stroke; for (const x of [128, 384]) { g.strokeText(txt, x, 178); g.fillStyle = fill; g.fillText(txt, x, 178); } };
  if (type === 'flame') { flames(['#ffd23f', '#ff3b2e']); g.fillStyle = '#fff3e0'; g.fillRect(246, 0, 20, 96); g.fillRect(0, 0, 10, 90); g.fillRect(502, 0, 10, 90); num('7', '#fff', '#2a0d05'); }
  if (type === 'ninja') { g.fillStyle = '#d8262f'; g.fillRect(0, 70, 512, 26); g.fillStyle = '#ff5a5f'; g.fillRect(0, 70, 512, 6); num('N', '#d8262f', '#0d0c12'); }
  if (type === 'robot') { g.strokeStyle = 'rgba(40,50,70,.55)'; g.lineWidth = 4; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); } g.beginPath(); g.moveTo(0, 128); g.lineTo(512, 128); g.stroke(); g.fillStyle = '#5c6478'; for (let x = 16; x < 512; x += 64) for (const y of [40, 110, 150, 220]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } num('B', '#2ad1ff', '#1b2133'); }
  if (type === 'dino') { const R = rng(4); g.fillStyle = 'rgba(20,90,30,.55)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(R() * 512, 30 + R() * 200, 6 + R() * 14, 0, 7); g.fill(); } g.fillStyle = '#ffe14d'; g.fillRect(240, 0, 32, 70); num('R', '#ffe14d', '#14431a'); }
  g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, 236, 512, 20);
  return c;
}

/* ---------- sponsor: BoardBeat (deck shape, equalizer bars, two-tone word) ---------- */
export function drawBoardBeat(g, cx, cy, w) {
  const h = w * 0.3, r = h / 2;
  g.save(); g.translate(cx, cy);
  g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, r); g.fillStyle = '#14102a'; g.fill();
  g.lineWidth = h * 0.08; g.strokeStyle = '#2ad1ff'; g.shadowColor = '#2ad1ff'; g.shadowBlur = h * 0.25; g.stroke(); g.shadowBlur = 0;
  const bars = [0.35, 0.7, 1, 0.55, 0.85], bw = h * 0.1, bx = -w / 2 + r * 0.75;
  bars.forEach((v, i) => { const bh = h * 0.62 * v, gr = g.createLinearGradient(0, bh / 2, 0, -bh / 2); gr.addColorStop(0, '#2ad1ff'); gr.addColorStop(1, '#ff4fa3'); g.fillStyle = gr; g.beginPath(); g.roundRect(bx + i * bw * 1.55, -bh / 2, bw, bh, bw / 2); g.fill(); });
  g.textBaseline = 'middle'; g.textAlign = 'left';
  let fs = h * 0.52; g.font = `${fs}px ${FONT_D}`;
  const tw = g.measureText('BOARDBEAT').width, avail = w - (bx + 5 * bw * 1.55 + w / 2) - r * 0.6;
  if (tw > avail) { fs *= avail / tw; g.font = `${fs}px ${FONT_D}`; }
  const tx = bx + 5 * bw * 1.55 + h * 0.12;
  g.fillStyle = '#ffffff'; g.fillText('BOARD', tx, h * 0.04);
  g.fillStyle = '#ff4fa3'; g.fillText('BEAT', tx + g.measureText('BOARD').width, h * 0.04);
  g.restore();
}

const themeCache = {};
const tc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const noise = (g, w, h, n, R, dark, light) => { for (let i = 0; i < n; i++) { const s = R() * 2.4 + 0.5; g.fillStyle = R() < 0.5 ? `rgba(${dark},${R() * 0.16})` : `rgba(${light},${R() * 0.14})`; g.fillRect(R() * w, R() * h, s, s); } };
const THEME_ART = {
  // wooden ramp sides (same 10.24 x 4.16 m tile as the city panels)
  planks() { const c = tc(1024, 416), g = c.getContext('2d'), R = rng(41);
    for (let y = 0; y < 416; y += 26) { const v = 0.85 + R() * 0.3; g.fillStyle = `rgb(${120 * v | 0},${74 * v | 0},${40 * v | 0})`; g.fillRect(0, y, 1024, 26); g.fillStyle = 'rgba(30,14,4,.55)'; g.fillRect(0, y, 1024, 2.5); }
    for (let x = 0; x <= 1024; x += 128) { g.fillStyle = 'rgba(30,14,4,.6)'; g.fillRect(x - 2, 0, 5, 416); g.fillStyle = 'rgba(210,190,160,.55)'; for (let y = 13; y < 416; y += 26) { g.beginPath(); g.arc(x - 8, y, 2.2, 0, 7); g.arc(x + 8, y, 2.2, 0, 7); g.fill(); } }
    noise(g, 1024, 416, 4000, R, '40,20,6', '255,220,170');
    g.strokeStyle = 'rgba(60,30,10,.35)'; g.lineWidth = 1.3; for (let i = 0; i < 90; i++) { const y = R() * 416, x = R() * 1024; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 40, y + 3, x + 80, y - 3, x + 120 + R() * 80, y + 1); g.stroke(); }
    const moss = g.createLinearGradient(0, 300, 0, 416); moss.addColorStop(0, 'rgba(40,110,40,0)'); moss.addColorStop(1, 'rgba(40,110,40,.65)'); g.fillStyle = moss; g.fillRect(0, 300, 1024, 116);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${50 + R() * 40 | 0},${120 + R() * 60 | 0},${40 + R() * 20 | 0},.8)`; g.beginPath(); g.arc(R() * 1024, 360 + R() * 56, 4 + R() * 9, 0, 7); g.fill(); }
    return c; },
  woodTop() { const c = tc(512, 512), g = c.getContext('2d'), R = rng(43);
    for (let x = 0; x < 512; x += 32) { const v = 0.85 + R() * 0.25; g.fillStyle = `rgb(${205 * v | 0},${150 * v | 0},${98 * v | 0})`; g.fillRect(x, 0, 32, 512); g.fillStyle = 'rgba(70,35,12,.5)'; g.fillRect(x, 0, 2, 512); }
    noise(g, 512, 512, 5000, R, '60,30,10', '255,230,190');
    g.strokeStyle = 'rgba(30,20,10,.18)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(150 + R() * 210, 150 + R() * 210, 40 + R() * 80, R() * 6, R() * 6 + 0.8); g.stroke(); }
    return c; },
  bark() { const c = tc(256, 256), g = c.getContext('2d'), R = rng(44); g.fillStyle = '#5a3418'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(25,12,4,.7)'; g.lineWidth = 3; for (let i = 0; i < 40; i++) { const x = R() * 256; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 10, 80, x - 10, 170, x + 4, 256); g.stroke(); } noise(g, 256, 256, 1500, R, '20,10,0', '200,150,90'); return c; },
  dirtSide() { const c = tc(1024, 416), g = c.getContext('2d'), R = rng(51);
    const gr = g.createLinearGradient(0, 0, 0, 416); gr.addColorStop(0, '#b06a38'); gr.addColorStop(0.5, '#8a4f2a'); gr.addColorStop(1, '#5e341c'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 416);
    for (let y = 40; y < 416; y += 38 + R() * 30) { g.fillStyle = `rgba(${R() < 0.5 ? '60,30,14' : '220,150,90'},.18)`; g.fillRect(0, y, 1024, 6 + R() * 10); }
    noise(g, 1024, 416, 6000, R, '40,20,8', '255,200,140');
    for (let i = 0; i < 220; i++) { const x = R() * 1024, y = R() * 416, r = 2 + R() * 6; g.fillStyle = `rgb(${120 + R() * 60 | 0},${100 + R() * 50 | 0},${90 + R() * 40 | 0})`; g.beginPath(); g.ellipse(x, y, r * 1.3, r, R() * 3, 0, 7); g.fill(); }
    return c; },
  dirt() { const c = tc(512, 512), g = c.getContext('2d'), R = rng(52); g.fillStyle = '#c4874e'; g.fillRect(0, 0, 512, 512);
    noise(g, 512, 512, 12000, R, '90,50,20', '255,220,170');
    g.strokeStyle = 'rgba(80,40,15,.25)'; g.lineWidth = 6; for (let i = 0; i < 7; i++) { g.beginPath(); const y = R() * 512; g.moveTo(0, y); g.bezierCurveTo(170, y + 30, 340, y - 30, 512, y + 10); g.stroke(); }
    return c; },
  rock() { const c = tc(512, 512), g = c.getContext('2d'), R = rng(53);
    let y = 0; while (y < 512) { const hgt = 10 + R() * 40, t = R(); g.fillStyle = `rgb(${170 + t * 60 | 0},${70 + t * 40 | 0},${40 + t * 25 | 0})`; g.fillRect(0, y, 512, hgt); y += hgt; }
    noise(g, 512, 512, 6000, R, '60,20,10', '255,200,160'); return c; },
  sand() { const c = tc(512, 512), g = c.getContext('2d'), R = rng(54); g.fillStyle = '#d9a066'; g.fillRect(0, 0, 512, 512); noise(g, 512, 512, 9000, R, '120,70,30', '255,235,200'); return c; },
  truss() { const c = tc(1024, 416), g = c.getContext('2d'), R = rng(56);
    const gr = g.createLinearGradient(0, 0, 0, 416); gr.addColorStop(0, '#1a1f3e'); gr.addColorStop(1, '#10132a'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 416);
    noise(g, 1024, 416, 2500, R, '0,0,10', '150,170,255');
    const beam = (x1, y1, x2, y2, w, a) => { g.lineWidth = w; g.strokeStyle = `rgba(70,80,120,${a})`; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.lineWidth = w * 0.3; g.strokeStyle = `rgba(150,165,210,${a * 0.6})`; g.beginPath(); g.moveTo(x1 - 1, y1 - 1); g.lineTo(x2 - 1, y2 - 1); g.stroke(); };
    for (let x = 0; x <= 1024; x += 256) beam(x, 0, x, 416, 12, 0.9);
    beam(0, 208, 1024, 208, 9, 0.8); beam(0, 0, 1024, 0, 9, 0.8); beam(0, 416, 1024, 416, 9, 0.8);
    for (let x = 0; x < 1024; x += 256) for (let y = 0; y < 416; y += 208) beam(x, y + 208, x + 256, y, 5, 0.55);
    g.fillStyle = 'rgba(42,209,255,.55)'; for (let x = 128; x < 1024; x += 256) { g.fillRect(x - 2, 200, 4, 16); }
    return c; },
  skatelite() { const c = tc(512, 512), g = c.getContext('2d'), R = rng(55); g.fillStyle = '#565a78'; g.fillRect(0, 0, 512, 512); noise(g, 512, 512, 7000, R, '10,10,20', '200,200,255');
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2; for (let x = 0; x <= 512; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); } for (let y = 0; y <= 512; y += 256) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.06)'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(R() * 512, R() * 512, 50 + R() * 120, R() * 6, R() * 6 + 1); g.stroke(); } return c; },
  checker() { const c = tc(128, 96), g = c.getContext('2d'); for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 16, y * 16, 16, 16); } return c; },
  bannerBB() { const c = tc(1024, 256), g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#1d1640'); gr.addColorStop(1, '#0c0920'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 256);
    g.strokeStyle = 'rgba(42,209,255,.12)'; g.lineWidth = 18; for (let x = -256; x < 1024; x += 64) { g.beginPath(); g.moveTo(x, 256); g.lineTo(x + 256, 0); g.stroke(); }
    drawBoardBeat(g, 512, 128, 820); g.fillStyle = '#2ad1ff'; g.fillRect(0, 0, 1024, 8); g.fillRect(0, 248, 1024, 8); return c; },
  bannerFMX() { const c = tc(1024, 256), g = c.getContext('2d'); g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, 1024, 256);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#f2f2f2'; g.fillRect(i * 16, j * 16, 16, 16); g.fillRect(1024 - (i + 1) * 16, 192 + j * 16, 16, 16); }
    bubble(g, 'FMX', 512, 120, 420, ['#fff06a', '#ff9a1f', '#ff3d2e'], 31, -0.04); return c; },
  led(text, a, b) { const c = tc(1024, 256), g = c.getContext('2d'); g.fillStyle = '#05040c'; g.fillRect(0, 0, 1024, 256);
    if (text === 'BB') drawBoardBeat(g, 512, 128, 860);
    else { g.font = `150px ${FONT_D}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const gr = g.createLinearGradient(0, 40, 0, 220); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.shadowColor = b; g.shadowBlur = 30; let fs = 150; g.font = `${fs}px ${FONT_D}`; const tw = g.measureText(text).width; if (tw > 940) { fs *= 940 / tw; g.font = `${fs}px ${FONT_D}`; } g.fillText(text, 512, 134); g.shadowBlur = 0; }
    g.fillStyle = 'rgba(0,0,0,.35)'; for (let y = 0; y < 256; y += 4) g.fillRect(0, y, 1024, 1.5); for (let x = 0; x < 1024; x += 4) g.fillRect(x, 0, 1.5, 256); return c; },
};
export function themeArt(name, ...args) { const k = name + args.join('|'); return themeCache[k] || (themeCache[k] = THEME_ART[name](...args)); }

// extra decals for the new parks (painted on the near side of ramps)
export function themeDecal(key) {
  const k = 'decal:' + key; if (themeCache[k]) return themeCache[k];
  const make = (wm, hm, draw) => { const ppm = 110, c = tc(Math.round(wm * ppm), Math.round(hm * ppm)); draw(c.getContext('2d'), c.width, c.height); return { canvas: c, w: wm, h: hm }; };
  const D = {
    dino: () => make(4.0, 1.7, (g, w, h) => bubble(g, 'DINO', w / 2, h * 0.42, w * 0.82, ['#e8ff9a', '#5fe02c', '#1f8a20'], 61, -0.05)),
    rawr: () => make(4.2, 1.7, (g, w, h) => bubble(g, 'RAWR!', w / 2, h * 0.42, w * 0.86, ['#fff06a', '#ff9a1f', '#ff3d2e'], 62, 0.04)),
    bones: () => make(3.4, 1.4, (g, w, h) => { g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const x = w * (0.2 + i * 0.3), y = h * 0.5, l = h * 0.6; g.save(); g.translate(x, y); g.rotate(-0.5 + i * 0.5); g.strokeStyle = '#1c0a30'; g.lineWidth = h * 0.17; g.beginPath(); g.moveTo(-l / 2, 0); g.lineTo(l / 2, 0); g.stroke(); g.strokeStyle = '#fff6e0'; g.lineWidth = h * 0.11; g.stroke();
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) { g.fillStyle = '#1c0a30'; g.beginPath(); g.arc(sx * l / 2, sy * h * 0.06, h * 0.1, 0, 7); g.fill(); g.fillStyle = '#fff6e0'; g.beginPath(); g.arc(sx * l / 2, sy * h * 0.06, h * 0.07, 0, 7); g.fill(); } g.restore(); } }),
    fmx: () => make(4.0, 1.7, (g, w, h) => bubble(g, 'FMX', w / 2, h * 0.42, w * 0.7, ['#fff06a', '#ff9a1f', '#ff3d2e'], 63, -0.04)),
    bigair: () => make(6.0, 1.8, (g, w, h) => bubble(g, 'BIG AIR', w / 2, h * 0.42, w * 0.88, ['#c8fff0', '#2ad1ff', '#2a5bff'], 64, -0.03)),
    boardbeat: () => make(6.0, 2.0, (g, w, h) => drawBoardBeat(g, w / 2, h / 2, w * 0.94)),
  };
  return (themeCache[k] = D[key] ? D[key]() : null);
}

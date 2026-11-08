// Hand-painted canvas textures. Everything is generated, so the game ships
// without image files and still looks hand made.
export const FONT_D = 'Bungee, "Arial Black", Impact, sans-serif';

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

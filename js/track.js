// The park is one continuous side-view profile (a polyline from the left
// quarter pipe to the right one). Physics rides along it; the 3D world
// extrudes the same profile into concrete, so what you see is what you ride.

export const T = { R: 3.2, V: 0.45, DECK: 3.4, W: 5.2, G: -0.3 };
T.H = T.R + T.V;

export function buildTrack() {
  const pts = [];
  let cx = 0, cy = 0;
  const add = (x, y) => {
    const l = pts[pts.length - 1];
    if (!l || Math.hypot(x - l[0], y - l[1]) > 1e-4) pts.push([x, y]);
    cx = x; cy = y;
  };
  const flat = (x1) => { const n = Math.max(1, Math.ceil((x1 - cx) / 0.5)); const y = cy, x0 = cx; for (let i = 1; i <= n; i++) add(x0 + (x1 - x0) * i / n, y); };
  const line = (x1, y1) => { const x0 = cx, y0 = cy, n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.25)); for (let i = 1; i <= n; i++) add(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); };
  // smooth S-shaped slope (no sharp kink at the bottom) – used for landings
  const slope = (x1, y1) => { const x0 = cx, y0 = cy, n = Math.max(6, Math.ceil(Math.abs(x1 - x0) / 0.2)); for (let i = 1; i <= n; i++) { const t = i / n, e = t * t * (3 - 2 * t); add(x0 + (x1 - x0) * t, y0 + (y1 - y0) * e); } };
  const rollers = (n, lam, A) => { const x0 = cx, y0 = cy, steps = Math.ceil(n * lam / 0.2); for (let i = 1; i <= steps; i++) { const x = x0 + n * lam * i / steps; add(x, y0 + A * (1 - Math.cos(2 * Math.PI * (x - x0) / lam)) / 2); } };
  const kicker = (h, deg) => { const a = deg * Math.PI / 180, Rk = h / (1 - Math.cos(a)), x0 = cx, y0 = cy; for (let i = 1; i <= 16; i++) { const th = a * i / 16; add(x0 + Rk * Math.sin(th), y0 + Rk * (1 - Math.cos(th))); } };

  const { R, H } = T;
  // left quarter pipe: vertical top, then the transition
  add(0, H); add(0, R);
  for (let i = 1; i <= 32; i++) { const a = Math.PI + (Math.PI / 2) * (i / 32); add(R + R * Math.cos(a), R + R * Math.sin(a)); }
  flat(12);
  rollers(4, 4.4, 0.6);               // pump track waves
  flat(33);
  kicker(1.3, 38); const lip1 = cx;   // small table top
  flat(42.8);
  slope(47.6, 0);
  flat(52);
  line(55, 1.0); flat(62); line(65, 0); // funbox
  flat(71);
  kicker(2.0, 42); const lip2 = cx;   // mega jump
  flat(86);
  slope(92.6, 0);
  flat(98);
  rollers(3, 4.4, 0.5);
  flat(126);
  for (let i = 1; i <= 32; i++) { const a = -Math.PI / 2 + (Math.PI / 2) * (i / 32); add(126 + R * Math.cos(a), R + R * Math.sin(a)); }
  add(126 + R, H);
  const L = cx; // x of the right lip

  // segment tables
  const n = pts.length, S = new Float64Array(n), TX = new Float64Array(n), TY = new Float64Array(n), LEN = new Float64Array(n);
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dy);
    LEN[i] = l; TX[i] = dx / l; TY[i] = dy / l; S[i + 1] = S[i] + l;
  }
  // turn angle at each interior vertex (negative = convex = possible take-off)
  const TURN = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) {
    let d = Math.atan2(TY[i], TX[i]) - Math.atan2(TY[i - 1], TX[i - 1]);
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    TURN[i] = d;
  }
  const total = S[n - 1];

  function segAtS(s) {
    let lo = 0, hi = n - 2;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S[m] <= s) lo = m; else hi = m - 1; }
    return lo;
  }
  function at(s) {
    s = Math.max(0, Math.min(total, s));
    const i = segAtS(s), t = (s - S[i]) / (LEN[i] || 1);
    return { x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, tx: TX[i], ty: TY[i], i };
  }
  // ground height under x (ignores the two vertical quarter-pipe tops)
  function groundAt(x) {
    if (x <= 0) return { y: T.H + 50, tx: 0, ty: 1, s: 0 };
    if (x >= L) return { y: T.H + 50, tx: 0, ty: 1, s: total };
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m][0] <= x) lo = m; else hi = m; }
    let i = lo;
    while (i < n - 2 && Math.abs(TX[i]) < 1e-6) i++;
    const t = (x - pts[i][0]) / ((pts[i + 1][0] - pts[i][0]) || 1e-6);
    return { y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, tx: TX[i], ty: TY[i], s: S[i] + LEN[i] * Math.max(0, Math.min(1, t)) };
  }

  const rails = [
    { x0: 56.2, x1: 60.8, y: 1.48, kind: 'rail' },
    { x0: 114.5, x1: 121.5, y: 0.58, kind: 'ledge' },
  ];
  const rings = [
    { x: 41.4, y: 3.3, r: 1.15, axis: 'x' },
    { x: 82.6, y: 5.05, r: 1.3, axis: 'x' },
    { x: L - 0.62, y: H + 1.6, r: 1.15, axis: 'y' },
    { x: 0.62, y: H + 1.6, r: 1.15, axis: 'y' },
  ];
  return { pts, n, S, TX, TY, LEN, TURN, total, L, at, segAtS, groundAt, rails, rings, lips: [lip1, lip2], spawnX: 8 };
}

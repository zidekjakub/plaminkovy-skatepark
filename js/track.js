// Each park is one continuous side-view profile (a polyline from the left
// quarter pipe to the right one). Physics rides along it; the 3D world
// extrudes the same profile, so what you see is what you ride.
// Profiles are drawn with a small "turtle": straight lines and arcs.

export const T = { W: 5.2, G: -0.3, DECK: 3.4 };
const D = Math.PI / 180;

function builder() {
  const pts = [];
  let cx = 0, cy = 0, hd = 0;
  const add = (x, y) => {
    const l = pts[pts.length - 1];
    if (!l || Math.hypot(x - l[0], y - l[1]) > 1e-4) { if (l) hd = Math.atan2(y - l[1], x - l[0]); pts.push([x, y]); }
    cx = x; cy = y;
  };
  const b = {
    pts,
    get x() { return cx; }, get y() { return cy; },
    flat(x1) { const n = Math.max(1, Math.ceil((x1 - cx) / 0.5)), y = cy, x0 = cx; for (let i = 1; i <= n; i++) add(x0 + (x1 - x0) * i / n, y); hd = 0; return b; },
    line(x1, y1) { const x0 = cx, y0 = cy, n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.25)); for (let i = 1; i <= n; i++) add(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); return b; },
    // smooth S-shaped slope with no kink at either end (landings)
    slope(x1, y1) { const x0 = cx, y0 = cy, n = Math.max(6, Math.ceil(Math.abs(x1 - x0) / 0.2)); for (let i = 1; i <= n; i++) { const t = i / n, e = t * t * (3 - 2 * t); add(x0 + (x1 - x0) * t, y0 + (y1 - y0) * e); } hd = 0; return b; },
    rollers(n, lam, A) { const x0 = cx, y0 = cy, steps = Math.ceil(n * lam / 0.2); for (let i = 1; i <= steps; i++) { const x = x0 + n * lam * i / steps; add(x, y0 + A * (1 - Math.cos(2 * Math.PI * (x - x0) / lam)) / 2); } hd = 0; return b; },
    kicker(h, deg) { const a = deg * D, Rk = h / (1 - Math.cos(a)), x0 = cx, y0 = cy; for (let i = 1; i <= 16; i++) { const th = a * i / 16; add(x0 + Rk * Math.sin(th), y0 + Rk * (1 - Math.cos(th))); } hd = a; return b; },
    qpLeft(R, V, base = 0) { add(0, base + R + V); add(0, base + R); hd = -Math.PI / 2; return b.turn(0, R); },
    qpRight(R, V) { b.turn(90, R); return b.straight(V); },
    // arc from the current heading to toDeg with radius r (left turns are hollow, right turns are crests)
    turn(toDeg, r) {
      const th0 = hd, th1 = toDeg * D, d = th1 - th0;
      if (Math.abs(d) < 1e-6) return b;
      const n = Math.max(2, Math.ceil(Math.abs(d) * r / 0.22));
      if (d > 0) { const ox = cx - r * Math.sin(th0), oy = cy + r * Math.cos(th0); for (let i = 1; i <= n; i++) { const p = th0 + d * i / n; add(ox + r * Math.sin(p), oy - r * Math.cos(p)); } }
      else { const ox = cx + r * Math.sin(th0), oy = cy - r * Math.cos(th0); for (let i = 1; i <= n; i++) { const p = th0 + d * i / n; add(ox - r * Math.sin(p), oy + r * Math.cos(p)); } }
      hd = th1; return b;
    },
    straight(len) { const n = Math.max(1, Math.ceil(len / 0.3)), x0 = cx, y0 = cy, h = hd; for (let i = 1; i <= n; i++) add(x0 + Math.cos(h) * len * i / n, y0 + Math.sin(h) * len * i / n); hd = h; return b; },
    toY(y) { return b.straight((y - cy) / Math.sin(hd)); },
    toX(x) { return b.straight((x - cx) / Math.cos(hd)); },
    corner(deg) { hd = deg * D; return b; },
  };
  return b;
}

const PROFILES = {
  // City skatepark: concrete, pump track, two table tops, funbox, ledge
  mesto(b) {
    b.qpLeft(3.2, 0.45).flat(12).rollers(4, 4.4, 0.6).flat(33).kicker(1.3, 38).flat(42.8).slope(47.6, 0).flat(52)
      .line(55, 1.0).flat(62).line(65, 0).flat(71).kicker(2.0, 42).flat(86).slope(92.6, 0).flat(98).rollers(3, 4.4, 0.5).flat(126).qpRight(3.2, 0.45);
    const L = b.x;
    return {
      spawnX: 8,
      rails: [{ x0: 56.2, x1: 60.8, y: 1.48, kind: 'rail', base: 1.0 }, { x0: 114.5, x1: 121.5, y: 0.58, kind: 'ledge' }],
      rings: [{ x: 41.4, y: 3.3, r: 1.15, axis: 'x' }, { x: 82.6, y: 5.05, r: 1.3, axis: 'x' }],
      decals: [['vojta', -1.5, 0.9, 3.6], ['flair', 39.8, 0.62, 3.0], ['turbo', 58.5, 0.5, 2.3], ['vojta', 81.0, 0.95, 4.2], ['flame', L + 1.7, 1.75, 2.5]],
    };
  },
  // Dino jungle: wooden ramps, stegosaurus humps, a spine, a log and the T-rex jump
  dzungle(b) {
    b.qpLeft(3.4, 0.5).flat(11).rollers(3, 7.5, 1.3).flat(37)
      .turn(34, 4).toY(2.4).turn(-34, 0.8).toY(0.68).turn(0, 4)          // spine
      .flat(66).kicker(1.8, 40).flat(81).slope(87.5, 0).flat(93)           // T-rex table
      .rollers(2, 3.8, 0.55).flat(106).kicker(2.4, 36).flat(115).slope(126, 0).flat(132) // step-down
      .qpRight(3.4, 0.5);
    const L = b.x;
    return {
      spawnX: 7,
      rails: [{ x0: 54.5, x1: 63.5, y: 0.62, kind: 'log' }],
      rings: [{ x: 45.2, y: 3.9, r: 1.25, axis: 'x' }, { x: 77.4, y: 4.5, r: 1.25, axis: 'x' }, { x: 119.6, y: 4.7, r: 1.3, axis: 'x' }],
      decals: [['dino', -1.3, 1.05, 3.4], ['rawr', 75.5, 0.85, 3.6], ['bones', 120.6, 0.75, 3.0], ['dino', L + 1.7, 1.9, 2.8]],
    };
  },
  // FMX desert: dirt whoops, a double, a step-up to a plateau and the big steel ramp gap
  fmx(b) {
    b.qpLeft(3.6, 0.4).flat(12).rollers(6, 2.4, 0.38).flat(31)
      .kicker(1.6, 34).corner(-32).toY(0.5).turn(0, 2.5).straight(1.5).turn(30, 2.5).toY(2.0).turn(-24, 1.4).toY(0.7).turn(0, 6).flat(b.x + 6);
    b.kicker(1.2, 38).corner(-30).toY(0.6).turn(0, 1.5).straight(1).turn(48, 2).toY(3.2).turn(0, 2).straight(9).turn(-26, 3).toY(1.0).turn(0, 8);
    b.flat(b.x + 6);
    const big = b.x;
    b.kicker(3.4, 42).corner(-28).toY(1.2).turn(0, 4).straight(2).turn(26, 4).toY(4.6).turn(-26, 2.5).toY(1.3).turn(0, 10);
    b.flat(b.x + 8).qpRight(3.6, 0.4);
    const L = b.x;
    return {
      spawnX: 7, bigKicker: big,
      caps: { vert: 10, vy: 12, vx: 22 },
      rails: [],
      rings: [{ x: 41.9, y: 3.6, r: 1.2, axis: 'x' }, { x: 67.4, y: 3.9, r: 1.2, axis: 'x' }, { x: 109.6, y: 6.6, r: 1.4, axis: 'x' }],
      overlays: [{ from: big, kind: 'steel', len: 7.4 }],
      decals: [['fmx', -1.2, 1.1, 3.6], ['fmx', L + 1.8, 1.9, 2.8]],
    };
  },
  // Night arena mega ramp: 26 m roll-in tower, giant gap, 9 m quarter pipe
  mega(b) {
    b.qpLeft(1.8, 0.3, 26).flat(8).turn(-40, 6).toY(8).turn(32, 14);
    const lip = b.x;
    b.corner(-24).toY(3.0).turn(0, 6).straight(2).turn(24, 6).toY(7.4).turn(-30, 3).toY(2.0).turn(0, 14);
    b.flat(b.x + 16).qpRight(7, 0.8);
    const L = b.x;
    return {
      spawnX: 4.5,
      caps: { vert: 13, vy: 15, vx: 26 },
      cam: { zoomMax: 13, dist: 12 },
      rails: [],
      rings: [],
      ringJumps: [[0, 17.2, 1.7]],
      overlays: [{ from: -1, to: 1e3, kind: 'neon' }],
      decals: [['bigair', lip + 13, 2.2, 6.5], ['bigair', L + 1.9, 5.0, 3.2]],
      lip,
    };
  },
};

export function buildTrack(id = 'mesto') {
  const b = builder(), def = (PROFILES[id] || PROFILES.mesto)(b), pts = b.pts;
  const n = pts.length, S = new Float64Array(n), TX = new Float64Array(n), TY = new Float64Array(n), LEN = new Float64Array(n);
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dy);
    LEN[i] = l; TX[i] = dx / l; TY[i] = dy / l; S[i + 1] = S[i] + l;
  }
  // turn angle at each interior vertex (negative = crest = possible take-off)
  const TURN = new Float64Array(n);
  for (let i = 1; i < n - 1; i++) {
    let d = Math.atan2(TY[i], TX[i]) - Math.atan2(TY[i - 1], TX[i - 1]);
    while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    TURN[i] = d;
  }
  const total = S[n - 1], L = pts[n - 1][0], topL = pts[0][1], topR = pts[n - 1][1];
  function segAtS(s) { let lo = 0, hi = n - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (S[m] <= s) lo = m; else hi = m - 1; } return lo; }
  function at(s) {
    s = Math.max(0, Math.min(total, s));
    const i = segAtS(s), t = (s - S[i]) / (LEN[i] || 1);
    return { x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, tx: TX[i], ty: TY[i], i };
  }
  // ground height under x (ignores the two vertical quarter-pipe tops)
  function groundAt(x) {
    if (x <= 0) return { y: topL + 50, tx: 0, ty: 1, s: 0 };
    if (x >= L) return { y: topR + 50, tx: 0, ty: 1, s: total };
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m][0] <= x) lo = m; else hi = m; }
    let i = lo; while (i < n - 2 && Math.abs(TX[i]) < 1e-6) i++;
    const t = (x - pts[i][0]) / ((pts[i + 1][0] - pts[i][0]) || 1e-6);
    return { y: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t, tx: TX[i], ty: TY[i], s: S[i] + LEN[i] * Math.max(0, Math.min(1, t)) };
  }
  // sharp crests get a metal edge in 3D; the big ones are kicker lips
  const edges = [], lips = [];
  for (let i = 3; i < n - 3; i++) if (TURN[i] < -0.25) { edges.push(pts[i]); if (TURN[i] < -0.5 && TY[i - 1] > 0.3) lips.push(i); }
  const caps = Object.assign({ vert: 9.3, vy: 9.6, vx: 19 }, def.caps);
  // fire rings at the top of a jump, for the speed a kid reaches by holding the arrow
  const rings = [...def.rings];
  for (const [li, v, r] of def.ringJumps || []) {
    const i = lips[li]; if (i == null) continue;
    const vx = v * TX[i - 1], vy = v * TY[i - 1], t = vy / 9.81;
    rings.push({ x: pts[i][0] + vx * t, y: pts[i][1] + vy * t / 2 + 0.9, r: r || 1.3, axis: 'x' });
  }
  rings.push({ x: L - 0.62, y: topR + 1.6, r: 1.15, axis: 'y' }, { x: 0.62, y: topL + 1.6, r: 1.15, axis: 'y' });
  const ys = pts.map((p) => p[1]);
  return { id, pts, n, S, TX, TY, LEN, TURN, total, L, topL, topR, yMax: Math.max(...ys), at, segAtS, groundAt, edges, lips, caps, rings,
    rails: def.rails, decals: def.decals || [], overlays: def.overlays || [], spawnX: def.spawnX, cam: Object.assign({ zoomMax: 4, dist: 10 }, def.cam), def };
}

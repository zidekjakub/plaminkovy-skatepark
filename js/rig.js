// Rider skeleton in local metres: x forward, y up from the ground contact, z sideways.
// Pure math – the 3D model only places meshes on these points.
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]);
const nrm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function ik(a, b, l1, l2, pole) {
  const d = sub(b, a); let dist = len(d); const dn = mul(d, 1 / (dist || 1)); dist = Math.min(dist, l1 + l2 - 1e-4);
  const x = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, l1 * l1 - x * x));
  const p = nrm(sub(pole, mul(dn, dot(pole, dn))));
  return add(add(a, mul(dn, x)), mul(p, h));
}
const rotY = (p, c, ang) => { if (!ang) return p; const cw = Math.cos(ang), sw = Math.sin(ang), dx = p[0] - c[0], dz = p[2] - c[2]; return [c[0] + dx * cw + dz * sw, p[1], c[2] - dx * sw + dz * cw]; };

// pose: { crouch, whip, bar, sm (superman 0..1), nh (no hands 0..1), feetUp }
export function scooterRig(P) {
  const c = P.crouch, J = {}, col = [0.27, 0, 0];
  J.deckA = rotY([-0.34, 0.1, 0], col, P.whip); J.deckB = rotY([0.31, 0.1, 0], col, P.whip);
  J.wheelR = rotY([-0.27, 0.068, 0], col, P.whip); J.wheelF = [0.27, 0.068, 0];
  J.colBase = [0.27, 0.12, 0]; J.colTop = [0.22, 0.88, 0];
  const barAxis = [0.22, 0, 0];
  J.barL = rotY([0.22, 0.88, -0.23], barAxis, P.bar); J.barR = rotY([0.22, 0.88, 0.23], barAxis, P.bar);
  const fu = P.feetUp || 0, sm = P.sm || 0;
  let footB = [-0.17, 0.14 + fu, 0.07], footF = [0.04, 0.14 + fu, -0.07];
  let hipY = 0.8 - 0.32 * c + fu * 0.5, hipX = -0.07 - 0.07 * c;
  let hipB = [hipX, hipY, 0.085], hipF = [hipX + 0.02, hipY, -0.085];
  let chest = [hipX + 0.09 + 0.17 * c, hipY + 0.42 - 0.05 * c, 0];
  if (sm) { // superman: legs fly back, body stretches out behind the bars
    footB = lerp(footB, [-0.95, 0.75, 0.09], sm); footF = lerp(footF, [-0.95, 0.72, -0.09], sm);
    hipB = lerp(hipB, [-0.45, 0.8, 0.085], sm); hipF = lerp(hipF, [-0.45, 0.8, -0.085], sm);
    chest = lerp(chest, [-0.05, 0.92, 0], sm);
  }
  Object.assign(J, { footB, footF, hipB, hipF });
  J.toeB = add(footB, [0.15, 0, 0]); J.toeF = add(footF, [0.15, 0, 0]);
  J.pel = [(hipB[0] + hipF[0]) / 2, hipB[1], 0];
  J.kneeB = ik(hipB, footB, 0.42, 0.42, [1, 0.3 - sm * 1.5, 0.1]); J.kneeF = ik(hipF, footF, 0.42, 0.42, [1, 0.3 - sm * 1.5, -0.1]);
  J.chest = chest;
  arms(J, P, [0.22, 0.88, -0.2], [0.22, 0.88, 0.2]);
  return J;
}

export function bmxRig(P) {
  const c = P.crouch, J = {}, sm = P.sm || 0;
  J.wheelR = [-0.5, 0.26, 0]; J.wheelF = [0.5, 0.26, 0];
  J.bb = [-0.04, 0.3, 0]; J.seat = [-0.2, 0.74, 0]; J.ht = [0.36, 0.78, 0]; J.hb = [0.41, 0.6, 0];
  const steer = [0.38, 0, 0];
  J.stem = [0.34, 0.9, 0];
  J.barL = rotY([0.3, 1.02, -0.3], steer, P.bar); J.barR = rotY([0.3, 1.02, 0.3], steer, P.bar);
  J.barMidL = rotY([0.34, 0.92, -0.08], steer, P.bar); J.barMidR = rotY([0.34, 0.92, 0.08], steer, P.bar);
  J.forkL = [0.5, 0.26, -0.06]; J.forkR = [0.5, 0.26, 0.06];
  const cr = 0.17;
  J.pedalB = [J.bb[0] - cr, J.bb[1], 0.13]; J.pedalF = [J.bb[0] + cr, J.bb[1], -0.13];
  let footB = [J.pedalB[0], J.pedalB[1] + 0.04, 0.13], footF = [J.pedalF[0], J.pedalF[1] + 0.04, -0.13];
  let hipY = 1.0 - 0.3 * c, hipX = -0.22 - 0.05 * c;
  let hipB = [hipX, hipY, 0.09], hipF = [hipX + 0.02, hipY, -0.09];
  let chest = [hipX + 0.18 + 0.14 * c, hipY + 0.4 - 0.06 * c, 0];
  if (sm) {
    footB = lerp(footB, [-1.15, 1.05, 0.1], sm); footF = lerp(footF, [-1.15, 1.02, -0.1], sm);
    hipB = lerp(hipB, [-0.6, 1.1, 0.09], sm); hipF = lerp(hipF, [-0.6, 1.1, -0.09], sm);
    chest = lerp(chest, [-0.08, 1.2, 0], sm);
  }
  Object.assign(J, { footB, footF, hipB, hipF });
  J.toeB = add(footB, [0.15, 0, 0]); J.toeF = add(footF, [0.15, 0, 0]);
  J.pel = [(hipB[0] + hipF[0]) / 2, hipB[1], 0];
  J.kneeB = ik(hipB, footB, 0.44, 0.44, [1, 0.4 - sm * 1.5, 0.1]); J.kneeF = ik(hipF, footF, 0.44, 0.44, [1, 0.4 - sm * 1.5, -0.1]);
  J.chest = chest;
  arms(J, P, [0.3, 1.02, -0.28], [0.3, 1.02, 0.28]);
  return J;
}

function arms(J, P, gripL, gripR) {
  const ch = J.chest;
  J.shL = [ch[0] - 0.01, ch[1] + 0.04, -0.18]; J.shR = [ch[0] - 0.01, ch[1] + 0.04, 0.18];
  // hands leave the bars for no-hands and while the bars spin
  const off = Math.max(P.nh || 0, P.bar ? Math.sin(Math.min(Math.PI, P.bar / 2)) : 0);
  const upL = [ch[0] - 0.05, ch[1] + 0.55, -0.55], upR = [ch[0] - 0.05, ch[1] + 0.55, 0.55];
  J.handL = lerp(gripL, upL, off); J.handR = lerp(gripR, upR, off);
  J.elL = ik(J.shL, J.handL, 0.28, 0.28, [-0.5, -1, -0.7]); J.elR = ik(J.shR, J.handR, 0.28, 0.28, [-0.5, -1, 0.7]);
  J.head = [ch[0] + 0.07, ch[1] + 0.33, 0]; J.hood = [ch[0] - 0.1, ch[1] + 0.08, 0];
}

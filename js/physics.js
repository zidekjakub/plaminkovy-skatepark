// Arcade physics on the park profile. Forgiving on purpose: a 7-year-old
// should land most tricks, never get stuck, and always know why he crashed.
import { SCORE, FLIP_NAMES, STYLE_NAMES } from './data.js';

const G = 9.81, TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const wrap = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const LAND_OK = 1.12; // ~64° of landing help

export function stats(v) {
  return {
    vmax: 8.4 + 0.95 * v.speed,
    acc: 6.2 + 0.45 * v.speed,
    pop: 3.8 + 0.34 * v.jump,
    lipPop: 1.5 + 0.32 * v.jump,
    launch: 0.95 + 0.03 * v.jump,
    rot: 7.4 + 1.1 * v.spin,
    spinT: 0.64 - 0.05 * v.spin,
  };
}

export class Rider {
  constructor(track, vehicle, emit) {
    this.track = track; this.emit = emit || (() => {});
    this.setVehicle(vehicle);
    this.bigLips = [];
    for (let i = 1; i < track.n - 1; i++) if (track.TURN[i] < -0.15) this.bigLips.push(i);
    this.reset(track.spawnX);
  }
  setVehicle(v) { this.vehicle = v; this.st = stats(v); this.styleOrder = v.type === 'bmx' ? ['barspin', 'nohand', 'superman'] : ['tailwhip', 'barspin', 'superman']; }
  reset(x) {
    const g = this.track.groundAt(x);
    Object.assign(this, { mode: 'ground', s: g.s, v: 0, x, y: g.y, vx: 0, vy: 0, phi: Math.atan2(g.ty, g.tx), omega: 0, facing: 1,
      turnYaw: 0, turning: 0, spinYaw: 0, crouch: 0.15, landAbs: 0, jumpBuf: 0, turboT: 0, turboCD: 0, air: null,
      pose: { whip: 0, bar: 0, sm: 0, nh: 0, feetUp: 0 }, grindT: 0, rail: null, crashT: 0, wheel: 0, onGroundT: 1 });
  }
  get speed() { return this.mode === 'ground' || this.mode === 'grind' ? Math.abs(this.v) : Math.hypot(this.vx, this.vy); }
  get turboOn() { return this.turboT > 0; }
  get inAir() { return this.mode === 'air' || this.mode === 'vert'; }

  step(dt, inp) {
    if (inp.jumpPressed) this.jumpBuf = 0.24;
    this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    this.turboT = Math.max(0, this.turboT - dt); this.turboCD = Math.max(0, this.turboCD - dt);
    this.landAbs = Math.max(0, this.landAbs - dt * 3);
    if (this.mode === 'ground') this.groundStep(dt, inp);
    else if (this.mode === 'air') this.airStep(dt, inp);
    else if (this.mode === 'vert') this.vertStep(dt, inp);
    else if (this.mode === 'grind') this.grindStep(dt, inp);
    else if (this.mode === 'crash') this.crashStep(dt);
    this.lastX = inp.x;
    this.wheel += (this.mode === 'ground' || this.mode === 'grind' ? this.v : this.vx * 0.3) * dt / 0.07;
    if (this.turning) { this.turning = Math.max(0, this.turning - dt / 0.28); this.turnYaw = Math.PI * (1 - this.turning); if (!this.turning) { this.facing = -this.facing; this.turnYaw = 0; } }
  }

  /* ---------- riding ---------- */
  groundStep(dt, inp) {
    const tr = this.track, st = this.st;
    let p = tr.at(this.s);
    this.onGroundT += dt;
    if (inp.actionPressed && this.turboCD <= 0) { this.turboT = 3; this.turboCD = 6; this.emit('turbo'); }
    const turbo = this.turboT > 0, vmax = st.vmax + (turbo ? 4.5 : 0), acc = st.acc * (turbo ? 1.7 : 1);
    let a = -G * p.ty;
    if (inp.x) {
      const along = inp.x * p.tx;
      if (Math.abs(along) > 0.05) {
        const want = Math.sign(along);
        if (Math.sign(this.v) === -want && Math.abs(this.v) > 0.4) a += want * 11 * Math.abs(along);
        else if (Math.abs(this.v) < vmax) a += acc * along;
      }
    }
    if (turbo) { const dir = Math.sign(this.v) || this.facing * Math.sign(p.tx || 1); if (Math.abs(this.v) < vmax) a += dir * 4.5 * Math.abs(p.tx); }
    // pushing but barely moving (stuck in a dip between jumps): help him out
    this.stuckT = inp.x && Math.abs(this.v) < 1.5 ? (this.stuckT || 0) + dt : Math.max(0, (this.stuckT || 0) - dt * 2);
    if (this.stuckT > 1.0 && Math.abs(p.tx) > 0.05) a += Math.sign(inp.x * p.tx) * 11;
    a -= Math.sign(this.v) * 0.3 + this.v * Math.abs(this.v) * 0.0035;
    if (Math.abs(this.v) > vmax + 5 && p.ty * Math.sign(this.v) > -0.05) a -= Math.sign(this.v) * 1.5; // only trims crazy speeds; downhill speed is kept for big jumps
    this.v += a * dt;
    if (Math.abs(this.v) < 0.05 && !inp.x && Math.abs(p.ty) < 0.02) this.v = 0;

    // ollie, unless a kicker lip is coming up (then the buffer adds lip pop there)
    if (this.jumpBuf > 0 && this.onGroundT > 0.08 && !this.lipAhead(0.5)) { this.ollie(p); return; }

    const s0 = this.s, s1 = s0 + this.v * dt;
    if (this.v > 0) { for (let i = tr.segAtS(s0) + 1; i < tr.n - 1 && tr.S[i] <= s1; i++) if (tr.S[i] > s0 && this.tryTakeoff(i, 1)) return; }
    else if (this.v < 0) { for (let i = tr.segAtS(s0); i > 0 && tr.S[i] >= s1; i--) if (tr.S[i] < s0 && this.tryTakeoff(i, -1)) return; }
    if (s1 >= tr.total) { this.enterVert(1, Math.abs(this.v)); return; }
    if (s1 <= 0) { this.enterVert(-1, Math.abs(this.v)); return; }
    this.s = s1; p = tr.at(s1);
    this.x = p.x; this.y = p.y;
    this.phi = this.near(Math.atan2(p.ty, p.tx), this.phi);
    const want = Math.abs(this.v) > 0.5 && Math.abs(p.tx) > 0.3 ? Math.sign(this.v * p.tx) : this.facing;
    if (want !== this.facing && !this.turning) this.turning = 1;
    const i = p.i, k = i > 0 ? tr.TURN[i] / Math.max(0.05, tr.LEN[i]) : 0;
    const load = this.v * this.v * k / G;
    const target = clamp(0.14 + Math.max(0, load) * 0.3 + (this.jumpBuf > 0 ? 0.4 : 0) + this.landAbs * 0.6, 0, 0.85);
    this.crouch += (target - this.crouch) * Math.min(1, dt * 10);
    for (const key in this.pose) this.pose[key] *= Math.max(0, 1 - dt * 12);
  }
  near(a, ref) { return a + TAU * Math.round((ref - a) / TAU); }
  lipAhead(dist) {
    const tr = this.track, d = Math.sign(this.v) * Math.max(dist, Math.abs(this.v) * 0.22);
    if (!this.v) return false;
    const a = Math.min(this.s, this.s + d), b = Math.max(this.s, this.s + d);
    return this.bigLips.some((i) => tr.S[i] >= a && tr.S[i] <= b);
  }
  tryTakeoff(i, dir) {
    const tr = this.track, turn = tr.TURN[i];
    if (turn >= -0.01) return false;
    const inSeg = dir > 0 ? i - 1 : i, tx = tr.TX[inSeg], ty = tr.TY[inSeg];
    const k = -turn / Math.max(0.05, (tr.LEN[i - 1] + tr.LEN[i]) / 2);
    const big = turn < -0.15, popNow = this.jumpBuf > 0 && big;
    if (!(this.v * this.v * k > G * Math.max(0, tx) || popNow)) return false;
    const sp = this.v * (big ? this.st.launch : 1);
    this.vx = sp * tx; this.vy = sp * ty;
    if (popNow) { this.vy += this.st.lipPop; this.jumpBuf = 0; }
    this.x = tr.pts[i][0]; this.y = tr.pts[i][1]; this.s = tr.S[i];
    this.enterAir(big || popNow);
    return true;
  }
  ollie(p) {
    const pop = this.st.pop;
    this.vx = this.v * p.tx - p.ty * pop * 0.6; this.vy = this.v * p.ty + p.tx * pop;
    if (p.tx < 0.2 && Math.abs(p.ty) > 0.9) { this.vx = this.v * p.tx; this.vy = this.v * p.ty; }
    this.jumpBuf = 0; this.y += 0.02;
    this.enterAir(true);
  }
  newAir(vert) { return { t: 0, R: 0, facing0: this.facing, spins: 0, spinQ: 0, spinT: 0, styles: [], style: null, styleQ: 0, rings: new Set(), vert }; }
  enterAir(big) {
    if (this.turning) { this.turning = 0; this.turnYaw = 0; this.facing = Math.sign(this.vx) || this.facing; }
    this.capLaunch(); this.heldDir = this.lastX || 0;
    this.mode = 'air'; this.air = this.newAir(false); this.omega = 0;
    this.emit('takeoff', { x: this.x, y: this.y, big });
  }
  enterVert(side, v) {
    const vy = Math.min(this.track.caps.vert, v);
    if (vy < 1.2) { this.s = side > 0 ? this.track.total - 0.01 : 0.01; this.v = -side * 0.5; return; }
    this.mode = 'vert'; this.side = side; this.vx = 0; this.vy = vy;
    this.x = side > 0 ? this.track.L : 0; this.vTop = side > 0 ? this.track.topR : this.track.topL; this.y = this.vTop; this.vT = 2 * vy / G;
    if (this.turning) { this.turning = 0; this.turnYaw = 0; this.facing = side; }
    this.facing = side; this.heldDir = this.lastX || 0;
    this.air = this.newAir(true); this.omega = 0; this.phi = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    this.emit('takeoff', { x: this.x, y: this.y, big: true, vert: true });
  }

  /* ---------- flying ---------- */
  capLaunch() {
    // no rocket launches: a steep ollie on turbo would otherwise fly off the screen
    const c = this.track.caps; this.vy = Math.min(this.vy, c.vy); this.vx = clamp(this.vx, -c.vx, c.vx);
  }
  rotate(dt, inp, upright) {
    const st = this.st;
    // an arrow that was already held for riding when he left the ground does not flip him
    let ix = inp.x;
    if (this.heldDir) { if (ix === this.heldDir) ix = 0; else this.heldDir = 0; }
    let target;
    if (ix) target = -ix * st.rot;
    else {
      // Finish the flip by itself, but only if there is time before touchdown;
      // otherwise roll back to the wheels. Kids let go early and still land.
      const k = (this.phi - upright) / TAU;
      let goal = upright + TAU * Math.round(k);
      if (Math.abs(this.omega) > 1) {
        const d = Math.sign(this.omega), fwd = upright + TAU * (d > 0 ? Math.ceil(k) : Math.floor(k)), back = upright + TAU * (d > 0 ? Math.floor(k) : Math.ceil(k));
        const tl = this.timeToLand(), tF = Math.abs(fwd - this.phi) / st.rot, tB = Math.abs(back - this.phi) / st.rot + 0.1;
        goal = tF <= tl * 0.92 || tF <= tB ? fwd : back;
      }
      target = clamp((goal - this.phi) * 9, -st.rot, st.rot);
    }
    this.omega += (target - this.omega) * Math.min(1, dt * 14);
    this.phi += this.omega * dt; this.air.R += this.omega * dt;
  }
  timeToLand() {
    const h = this.mode === 'vert' ? this.y - this.vTop : this.y - this.track.groundAt(this.x + this.vx * 0.15).y;
    return (this.vy + Math.sqrt(Math.max(0, this.vy * this.vy + 2 * G * Math.max(0, h)))) / G;
  }
  tricks(dt, inp) {
    const a = this.air, st = this.st;
    if (inp.jumpPressed) a.spinQ++;
    if (a.spinT === 0 && a.spinQ > 0) { a.spinQ--; a.spinT = 1e-4; this.emit('spin'); }
    if (a.spinT > 0) { a.spinT += dt / st.spinT; if (a.spinT >= 1) { a.spinT = 0; a.spins++; } }
    this.spinYaw = a.spinT > 0 ? TAU * smooth(a.spinT) : 0;
    if (inp.actionPressed) a.styleQ++;
    if (!a.style && a.styleQ > 0) {
      a.styleQ--;
      const type = this.styleOrder[Math.min(a.styles.length, this.styleOrder.length - 1)];
      a.style = { type, t: 0, dur: type === 'superman' || type === 'nohand' ? 0.55 : 0.42 };
      this.emit('style');
    }
    const P = this.pose; P.whip = 0; P.bar = 0; P.sm = 0; P.nh = 0; P.feetUp = 0;
    if (a.style) {
      a.style.t += dt / a.style.dur;
      const p = Math.min(1, a.style.t), s = a.style.type;
      if (s === 'tailwhip') { P.whip = TAU * smooth(p); P.feetUp = 0.2 * Math.sin(Math.PI * p); }
      if (s === 'barspin') P.bar = TAU * smooth(p);
      if (s === 'superman') P.sm = Math.sin(Math.PI * p);
      if (s === 'nohand') P.nh = Math.sin(Math.PI * p);
      if (a.style.t >= 1) { a.styles.push(s); a.style = null; }
    }
    const rotating = Math.abs(this.omega) > 2;
    const tgt = rotating ? 0.62 : 0.28 + 0.1 * Math.sin(a.t * 3);
    this.crouch += (tgt - this.crouch) * Math.min(1, dt * 8);
  }
  rings(px, py) {
    const a = this.air, tr = this.track;
    const cx = this.x - Math.sin(this.phi) * 0.9, cy = this.y + Math.cos(this.phi) * 0.9;
    const pcx = px - Math.sin(this.phi) * 0.9, pcy = py + Math.cos(this.phi) * 0.9;
    tr.rings.forEach((r, i) => {
      if (a.rings.has(i)) return;
      let hit = false;
      if (r.axis === 'x') hit = (pcx - r.x) * (cx - r.x) <= 0 && Math.abs(cy - r.y) < r.r * 0.9;
      else hit = (pcy - r.y) * (cy - r.y) <= 0 && Math.abs(cx - r.x) < r.r * 1.05;
      if (hit) { a.rings.add(i); this.emit('ring', { i, x: r.x, y: r.y }); }
    });
  }
  airStep(dt, inp) {
    const a = this.air, tr = this.track;
    a.t += dt;
    const px = this.x, py = this.y;
    this.vy -= G * dt; this.vx *= 1 - 0.02 * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.rotate(dt, inp, 0);
    this.tricks(dt, inp);
    this.rings(px, py);
    if (this.x < 0.12) { this.x = 0.12; this.vx = Math.abs(this.vx) * 0.25; }
    if (this.x > tr.L - 0.12) { this.x = tr.L - 0.12; this.vx = -Math.abs(this.vx) * 0.25; }
    for (const r of tr.rails) {
      if (this.x >= r.x0 && this.x <= r.x1 && py >= r.y - 0.02 && this.y < r.y && this.vy < 0) { this.landRail(r); return; }
    }
    const g = tr.groundAt(this.x);
    if (this.y <= g.y) this.land(g);
  }
  vertStep(dt, inp) {
    const a = this.air, side = this.side;
    a.t += dt;
    const px = this.x, py = this.y;
    this.vy -= G * dt; this.y += this.vy * dt;
    const u = clamp(a.t / this.vT, 0, 1);
    this.x = (side > 0 ? this.track.L : 0) + side * 0.34 * Math.sin(Math.PI * u);
    this.turnYaw = Math.PI * smooth((u - 0.08) / 0.8);
    const wall = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    this.rotate(dt, inp, wall);
    this.tricks(dt, inp);
    this.rings(px, py);
    if (this.y <= this.vTop && this.vy < 0) {
      if (Math.abs(wrap(this.phi - wall)) > LAND_OK) { this.y = this.vTop; this.crash(); return; }
      this.phi = this.near(wall, this.phi);
      this.mode = 'ground'; this.s = side > 0 ? this.track.total - 0.001 : 0.001;
      this.v = side > 0 ? -Math.abs(this.vy) : Math.abs(this.vy);
      this.facing = -side; this.turnYaw = 0; this.spinYaw = 0; this.x = side > 0 ? this.track.L : 0; this.y = this.vTop;
      this.landed();
    }
  }
  land(g) {
    const n = Math.atan2(g.ty, g.tx);
    const intoTransition = Math.abs(wrap(this.phi)) < 0.5 && Math.abs(n) > 0.55; // flying upright into a curved ramp is riding, not falling
    if (Math.abs(wrap(this.phi - n)) > LAND_OK && !intoTransition) { this.y = g.y; this.crash(); return; }
    this.phi = this.near(n, this.phi);
    let v = this.vx * g.tx + this.vy * g.ty;
    this.v = v; this.s = g.s; this.y = g.y; this.mode = 'ground';
    this.landed();
  }
  landed() {
    const a = this.air;
    this.spinYaw = 0; this.turnYaw = 0; this.turning = 0;
    if (this.v) this.facing = Math.sign(this.v * (this.track.at(this.s).tx || 0)) || this.facing;
    this.landAbs = 1; this.onGroundT = 0; this.omega = 0;
    for (const key in this.pose) this.pose[key] = 0;
    this.emit('land', { x: this.x, y: this.y, speed: Math.abs(this.v), hard: a.t > 1 });
    this.score(a);
    this.air = null;
  }
  score(a) {
    const n = Math.round(Math.abs(a.R) / TAU), back = Math.sign(a.R) === a.facing0;
    const parts = [], names = [], kinds = new Set();
    if (a.vert && n >= 1) {
      parts.push(back ? SCORE.flairBack : SCORE.flairFront); names.push(back ? 'FLAIR DOZADU' : 'FLAIR DOPŘEDU'); kinds.add('flair');
      if (n > 1) { const m = Math.min(5, n - 1); parts.push(SCORE.flips[m]); names.push(FLIP_NAMES[m]); kinds.add('salto'); }
    } else if (n >= 1) {
      const m = Math.min(5, n); parts.push(SCORE.flips[m]); names.push(m === 1 ? (back ? 'SALTO DOZADU' : 'SALTO DOPŘEDU') : FLIP_NAMES[m]); kinds.add('salto');
    }
    if (a.spins) { parts.push(SCORE.spin * a.spins); names.push(a.spins === 1 ? 'VÝVRTKA' : a.spins === 2 ? 'DVOJITÁ VÝVRTKA' : `VÝVRTKA ×${a.spins}`); kinds.add('vyvrtka'); }
    for (const s of a.styles) { parts.push(SCORE.style); names.push(STYLE_NAMES[s]); kinds.add('trik'); }
    if (a.rings.size) { parts.push(SCORE.ring * a.rings.size); kinds.add('kruh'); }
    if (!names.length && !a.rings.size) { if (a.t > 0.45) { parts.push(SCORE.jump); names.push('SKOK'); } else return; }
    const mult = kinds.size >= 2 ? Math.min(5, kinds.size) : 1;
    const sum = parts.reduce((x, y) => x + y, 0);
    const title = names.length ? names.join(' + ') : 'OHNIVÝ KRUH';
    this.emit('trick', { title, ring: names.length ? a.rings.size : 0, parts, mult, pts: sum * mult, air: a.t });
  }
  /* ---------- rails ---------- */
  landRail(r) {
    if (Math.abs(wrap(this.phi)) > LAND_OK) { this.crash(); return; }
    this.y = r.y; this.phi = this.near(0, this.phi);
    this.v = Math.abs(this.vx) < 2.5 ? Math.sign(this.vx || this.facing) * 2.5 : this.vx;
    const a = this.air; this.air = null; this.spinYaw = 0; this.turnYaw = 0; this.omega = 0;
    this.facing = Math.sign(this.v);
    this.score(a);
    this.mode = 'grind'; this.rail = r; this.grindT = 0;
    this.emit('grindStart', { x: this.x, y: this.y });
  }
  grindStep(dt, inp) {
    const r = this.rail;
    this.grindT += dt;
    this.v -= Math.sign(this.v) * 0.8 * dt;
    this.x += this.v * dt; this.y = r.y;
    this.crouch += (0.35 - this.crouch) * Math.min(1, dt * 8);
    const off = this.x < r.x0 || this.x > r.x1;
    if (off || this.jumpBuf > 0) {
      if (this.grindT > 0.25) this.emit('trick', { title: 'GRIND', ring: 0, parts: [SCORE.grind], mult: 1, pts: SCORE.grind, small: true });
      this.emit('grindEnd');
      this.vx = this.v; this.vy = this.jumpBuf > 0 ? this.st.pop : 0.4; this.jumpBuf = 0;
      this.mode = 'air'; this.air = this.newAir(false); this.rail = null; this.heldDir = this.lastX || 0; this.capLaunch();
    }
  }
  /* ---------- crash ---------- */
  crash() {
    this.mode = 'crash'; this.crashT = 0; this.crashVx = this.vx * 0.45; this.air = null; this.turning = 0; this.spinYaw = 0; this.turnYaw = 0;
    for (const key in this.pose) this.pose[key] = 0;
    this.emit('crash', { x: this.x, y: this.y });
  }
  crashStep(dt) {
    this.crashT += dt;
    this.crashVx *= 1 - Math.min(1, dt * 2.2);
    this.x = clamp(this.x + this.crashVx * dt, 1, this.track.L - 1);
    const g = this.track.groundAt(this.x);
    this.y = g.y + 0.45 * Math.abs(Math.sin(this.crashT * 7)) * Math.exp(-this.crashT * 2.5);
    this.phi += 8 * dt * Math.exp(-this.crashT * 1.5);
    this.crouch = 0.8;
    if (this.crashT > 1.15) {
      const f = this.facing;
      this.reset(this.x); this.facing = f;
      this.emit('respawn');
    }
  }

  /* ---------- for the renderer ---------- */
  frame() {
    const c = Math.cos(this.phi), s = Math.sin(this.phi), F = this.facing;
    const f0 = [F * c, F * s, 0], u0 = [-s, c, 0], s0 = [0, 0, F];
    const psi = this.turnYaw + this.spinYaw, cy = Math.cos(psi), sy = Math.sin(psi);
    return {
      pos: [this.x, this.y, 0],
      f: [f0[0] * cy - s0[0] * sy, f0[1] * cy - s0[1] * sy, f0[2] * cy - s0[2] * sy],
      u: u0,
      s: [f0[0] * sy + s0[0] * cy, f0[1] * sy + s0[1] * cy, f0[2] * sy + s0[2] * cy],
    };
  }
}

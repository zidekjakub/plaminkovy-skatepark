import * as THREE from '../vendor/three/build/three.module.min.js';
import { scooterRig, bmxRig } from './rig.js';
import { helmetArt } from './art.js';

const cyl = new THREE.CylinderGeometry(1, 1, 1, 14), sph = new THREE.SphereGeometry(1, 18, 14), box = new THREE.BoxGeometry(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0), XA = new THREE.Vector3(1, 0, 0), vA = new THREE.Vector3(), vB = new THREE.Vector3(), vD = new THREE.Vector3();
function between(m, a, b, r) { vA.set(a[0], a[1], a[2]); vB.set(b[0], b[1], b[2]); vD.subVectors(vB, vA); const l = vD.length() || 1e-4; m.position.addVectors(vA, vB).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UP, vD.multiplyScalar(1 / l)); m.scale.set(r, l, r); }
function alongX(m, a, b, sy, sz) { vA.set(a[0], a[1], a[2]); vB.set(b[0], b[1], b[2]); vD.subVectors(vB, vA); const l = vD.length() || 1e-4; m.position.addVectors(vA, vB).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(XA, vD.multiplyScalar(1 / l)); m.scale.set(l, sy, sz); }

export function createRiderModel(scene, rider, vehicle) {
  const root = new THREE.Group(); root.matrixAutoUpdate = false; scene.add(root);
  const shadowy = [];
  const sil = !!rider.lock;
  const mat = (color, o = {}) => sil ? new THREE.MeshStandardMaterial({ color: 0x120d22, roughness: 0.9 }) : new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.7 }, o));
  const add = (geo, m, parent = root) => { const mesh = new THREE.Mesh(geo, m); mesh.castShadow = true; parent.add(mesh); shadowy.push(mesh); return mesh; };
  const metal = rider.metal ? { metalness: 0.6, roughness: 0.35 } : {};
  const M = {
    hoodie: mat(rider.hoodie ?? 0x555555, metal), hood: mat(rider.hood ?? 0x444444, metal), pants: mat(rider.pants ?? 0x333333, metal),
    shoe: mat(rider.shoe ?? 0xeeeeee, { roughness: 0.55 }), glove: mat(rider.glove ?? 0x111111),
    chrome: mat(0xc9cfdf, { metalness: 1, roughness: 0.3 }), dark: mat(0x1c1b26, { roughness: 0.85 }),
    frame: mat(vehicle.color, { metalness: 0.35, roughness: 0.35, emissive: vehicle.glow ? vehicle.color : 0x000000, emissiveIntensity: vehicle.glow ? 0.9 : 0 }),
    wheel: mat(vehicle.wheel, { roughness: 0.35, emissive: vehicle.type === 'scooter' ? vehicle.wheel : 0x000000, emissiveIntensity: 0.25 }),
    neon: sil ? mat(0) : new THREE.MeshStandardMaterial({ color: vehicle.wheel, emissive: vehicle.wheel, emissiveIntensity: 3.5 }),
  };
  const B = {};
  for (const n of ['thighB', 'shinB', 'thighF', 'shinF']) B[n] = add(cyl, M.pants);
  for (const n of ['kneeB', 'kneeF']) B[n] = add(sph, M.pants);
  for (const n of ['shoeB', 'shoeF']) B[n] = add(cyl, M.shoe);
  B.torso = add(cyl, M.hoodie); B.chestS = add(sph, M.hoodie); B.pelS = add(sph, M.pants); B.hood = add(sph, M.hood);
  for (const n of ['uaL', 'faL', 'uaR', 'faR']) B[n] = add(cyl, M.hoodie);
  for (const n of ['elbL', 'elbR', 'shL', 'shR']) B[n] = add(sph, M.hoodie);
  for (const n of ['gL', 'gR']) B[n] = add(sph, M.glove);
  // head
  const head = new THREE.Group(); root.add(head);
  const hTex = sil ? null : new THREE.CanvasTexture(helmetArt(rider.helmet)); if (hTex) hTex.colorSpace = THREE.SRGBColorSpace;
  add(new THREE.SphereGeometry(0.215, 36, 22), sil ? M.dark : new THREE.MeshPhysicalMaterial({ map: hTex, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.12, metalness: rider.helmet === 'robot' ? 0.4 : 0 }), head);
  const glowVisor = rider.helmet === 'robot';
  const visorMat = sil ? M.dark : new THREE.MeshPhysicalMaterial({ color: glowVisor ? 0x2ad1ff : rider.helmet === 'ninja' ? 0x3a0d12 : 0x1a2350, emissive: glowVisor ? 0x2ad1ff : 0x000000, emissiveIntensity: glowVisor ? 2.2 : 0, metalness: 0.4, roughness: 0.06, clearcoat: 1 });
  add(new THREE.SphereGeometry(0.222, 32, 16, Math.PI - 0.78, 1.56, Math.PI / 2 - 0.4, 0.6), visorMat, head);
  const extras = [];
  if (!sil && rider.extra === 'band') {
    for (const z of [-0.035, 0.035]) { const r = add(box, mat(0xd8262f), head); r.scale.set(0.34, 0.035, 0.07); r.position.set(-0.32, 0.02, z); r.rotation.z = 0.5; extras.push({ m: r, kind: 'band', z }); }
  }
  if (!sil && rider.extra === 'antenna') {
    const a = add(cyl, M.chrome, head); a.scale.set(0.012, 0.22, 0.012); a.position.set(-0.03, 0.31, 0);
    const b = add(sph, new THREE.MeshStandardMaterial({ color: 0xff3b2e, emissive: 0xff3b2e, emissiveIntensity: 3 }), head); b.scale.setScalar(0.04); b.position.set(-0.03, 0.43, 0);
  }
  if (!sil && rider.extra === 'dino') {
    const spikeM = mat(0xffe14d), cone = new THREE.ConeGeometry(1, 1, 8);
    [[0.05, 0.21], [-0.07, 0.2], [-0.17, 0.13]].forEach(([x, y], i) => { const s = add(cone, spikeM, head); s.scale.set(0.05, 0.13 - i * 0.015, 0.05); s.position.set(x, y + 0.04, 0); s.rotation.z = Math.atan2(-x, y) * 0.9; });
    for (let i = 0; i < 3; i++) { const s = add(cone, spikeM); s.scale.set(0.045, 0.11, 0.045); extras.push({ m: s, kind: 'spike', i }); }
    for (let i = 0; i < 4; i++) { const s = add(cone, M.hoodie); s.scale.set(0.09 - i * 0.018, 0.22, 0.09 - i * 0.018); extras.push({ m: s, kind: 'tail', i }); }
  }
  // vehicle
  const V = {};
  if (vehicle.type === 'scooter') {
    V.deck = add(box, M.frame); V.grip = add(box, M.dark); V.glow = add(box, M.neon);
    const wg = new THREE.CylinderGeometry(0.068, 0.068, 0.045, 24); wg.rotateX(Math.PI / 2);
    V.wR = add(wg, M.wheel); V.wF = add(wg, M.wheel);
    V.col = add(cyl, M.chrome); V.bar = add(cyl, M.chrome); V.gripL = add(cyl, M.glove); V.gripR = add(cyl, M.glove);
  } else {
    const tire = new THREE.TorusGeometry(0.24, 0.035, 10, 32), rim = new THREE.TorusGeometry(0.2, 0.014, 8, 32), spoke = new THREE.CylinderGeometry(0.006, 0.006, 0.4, 5);
    const wheel = () => { const g = new THREE.Group(); add(tire, M.dark, g); add(rim, M.wheel, g); for (let i = 0; i < 4; i++) { const s = add(spoke, M.chrome, g); s.rotation.z = i * Math.PI / 4; } const hub = add(cyl, M.chrome, g); hub.scale.set(0.035, 0.12, 0.035); hub.rotation.x = Math.PI / 2; root.add(g); return g; };
    V.wR = wheel(); V.wF = wheel();
    for (const n of ['seatT', 'topT', 'downT', 'csL', 'csR', 'ssL', 'ssR', 'fkL', 'fkR', 'headT', 'stem']) V[n] = add(cyl, M.frame);
    for (const n of ['barL', 'barR', 'riseL', 'riseR', 'crB', 'crF']) V[n] = add(cyl, M.chrome);
    V.gripL = add(cyl, M.glove); V.gripR = add(cyl, M.glove); V.seat = add(box, M.dark); V.pdB = add(box, M.dark); V.pdF = add(box, M.dark);
  }
  const m4 = new THREE.Matrix4(), vf = new THREE.Vector3(), vu = new THREE.Vector3(), vs = new THREE.Vector3(), SC = new THREE.Vector3();
  let t = 0;
  function update(frame, P, RS, wheelRot, dt = 0.016) {
    t += dt;
    vf.fromArray(frame.f); vu.fromArray(frame.u); vs.fromArray(frame.s); SC.set(RS, RS, RS);
    m4.makeBasis(vf, vu, vs).scale(SC).setPosition(frame.pos[0], frame.pos[1], frame.pos[2]);
    root.matrix.copy(m4); root.matrixWorldNeedsUpdate = true;
    const J = vehicle.type === 'bmx' ? bmxRig(P) : scooterRig(P);
    between(B.thighB, J.hipB, J.kneeB, 0.085); between(B.shinB, J.kneeB, J.footB, 0.072); between(B.thighF, J.hipF, J.kneeF, 0.085); between(B.shinF, J.kneeF, J.footF, 0.072);
    B.kneeB.position.fromArray(J.kneeB); B.kneeB.scale.setScalar(0.08); B.kneeF.position.fromArray(J.kneeF); B.kneeF.scale.setScalar(0.08);
    between(B.shoeB, J.footB, J.toeB, 0.058); between(B.shoeF, J.footF, J.toeF, 0.058);
    between(B.torso, J.pel, J.chest, 0.15); B.chestS.position.fromArray(J.chest); B.chestS.scale.set(0.17, 0.15, 0.2); B.pelS.position.fromArray(J.pel); B.pelS.scale.set(0.14, 0.12, 0.15);
    B.hood.position.fromArray(J.hood); B.hood.scale.setScalar(0.11);
    between(B.uaL, J.shL, J.elL, 0.062); between(B.faL, J.elL, J.handL, 0.055); between(B.uaR, J.shR, J.elR, 0.062); between(B.faR, J.elR, J.handR, 0.055);
    for (const [n, j, r] of [['elbL', J.elL, 0.06], ['elbR', J.elR, 0.06], ['shL', J.shL, 0.07], ['shR', J.shR, 0.07], ['gL', J.handL, 0.064], ['gR', J.handR, 0.064]]) { B[n].position.fromArray(j); B[n].scale.setScalar(r); }
    head.position.fromArray(J.head); head.rotation.z = 0.08;
    for (const e of extras) {
      if (e.kind === 'band') { e.m.rotation.z = 0.45 + 0.18 * Math.sin(t * 14 + e.z * 40); e.m.rotation.y = e.z * 3; }
      if (e.kind === 'spike') { const a = J.hood, b = J.pel, k = (e.i + 0.5) / 3; e.m.position.set(a[0] + (b[0] - a[0]) * k - 0.12, a[1] + (b[1] - a[1]) * k, 0); e.m.rotation.z = 1.2; }
      if (e.kind === 'tail') { const p = J.pel, w = Math.sin(t * 6 - e.i) * 0.08 * e.i; e.m.position.set(p[0] - 0.16 - e.i * 0.17, p[1] - 0.04 - e.i * 0.05, w); e.m.rotation.z = 1.75; }
    }
    if (vehicle.type === 'scooter') {
      alongX(V.deck, J.deckA, J.deckB, 0.05, 0.15); alongX(V.grip, J.deckA, J.deckB, 0.012, 0.13); V.grip.position.y += 0.03;
      alongX(V.glow, J.deckA, J.deckB, 0.012, 0.1); V.glow.position.y -= 0.035; V.glow.scale.x *= 0.85;
      V.wR.position.fromArray(J.wheelR); V.wR.rotation.set(0, P.whip || 0, -wheelRot); V.wF.position.fromArray(J.wheelF); V.wF.rotation.set(0, 0, -wheelRot);
      between(V.col, J.colBase, J.colTop, 0.021); between(V.bar, J.barL, J.barR, 0.018);
      const gl = [J.barL[0] + (J.barR[0] - J.barL[0]) * 0.2, J.barL[1], J.barL[2] + (J.barR[2] - J.barL[2]) * 0.2], gr = [J.barR[0] + (J.barL[0] - J.barR[0]) * 0.2, J.barR[1], J.barR[2] + (J.barL[2] - J.barR[2]) * 0.2];
      between(V.gripL, J.barL, gl, 0.03); between(V.gripR, J.barR, gr, 0.03);
    } else {
      V.wR.position.fromArray(J.wheelR); V.wR.rotation.z = -wheelRot; V.wF.position.fromArray(J.wheelF); V.wF.rotation.z = -wheelRot;
      between(V.seatT, J.bb, J.seat, 0.022); between(V.topT, J.seat, J.ht, 0.022); between(V.downT, J.bb, J.hb, 0.026); between(V.headT, J.hb, J.ht, 0.03);
      const rl = [J.wheelR[0], J.wheelR[1], -0.06], rr = [J.wheelR[0], J.wheelR[1], 0.06];
      between(V.csL, [J.bb[0], J.bb[1], -0.04], rl, 0.016); between(V.csR, [J.bb[0], J.bb[1], 0.04], rr, 0.016);
      between(V.ssL, [J.seat[0], J.seat[1] - 0.05, -0.03], rl, 0.014); between(V.ssR, [J.seat[0], J.seat[1] - 0.05, 0.03], rr, 0.014);
      between(V.fkL, [J.hb[0], J.hb[1], -0.05], J.forkL, 0.016); between(V.fkR, [J.hb[0], J.hb[1], 0.05], J.forkR, 0.016);
      between(V.stem, J.ht, J.stem, 0.024);
      between(V.riseL, J.stem, J.barMidL, 0.014); between(V.riseR, J.stem, J.barMidR, 0.014); between(V.barL, J.barMidL, J.barL, 0.016); between(V.barR, J.barMidR, J.barR, 0.016);
      between(V.gripL, J.barL, [J.barL[0] + (J.barMidL[0] - J.barL[0]) * 0.35, J.barL[1] + (J.barMidL[1] - J.barL[1]) * 0.35, J.barL[2] + (J.barMidL[2] - J.barL[2]) * 0.35], 0.028);
      between(V.gripR, J.barR, [J.barR[0] + (J.barMidR[0] - J.barR[0]) * 0.35, J.barR[1] + (J.barMidR[1] - J.barR[1]) * 0.35, J.barR[2] + (J.barMidR[2] - J.barR[2]) * 0.35], 0.028);
      V.seat.position.set(J.seat[0] - 0.02, J.seat[1] + 0.03, 0); V.seat.scale.set(0.24, 0.05, 0.11);
      between(V.crB, J.bb, J.pedalB, 0.014); between(V.crF, J.bb, J.pedalF, 0.014);
      V.pdB.position.fromArray(J.pedalB); V.pdB.scale.set(0.1, 0.025, 0.08); V.pdF.position.fromArray(J.pedalF); V.pdF.scale.set(0.1, 0.025, 0.08);
    }
  }
  function dispose() { scene.remove(root); root.traverse((o) => { if (o.isMesh) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
  return { root, update, dispose };
}

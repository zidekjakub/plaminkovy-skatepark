// Look and decor of each park. world.js builds the ramps from the track;
// each theme sets the light and air, picks the materials and adds its own world.
import { rng, themeArt } from './art.js';

const R3 = (a) => (Math.random() - 0.5) * a;

function mergeBoxes(THREE, geos) {
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of geos) { pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3); uv.set(g.attributes.uv.array, ov * 2);
    const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[oi + i] = ia[i] + ov; ov += g.attributes.position.count; oi += ia.length; g.dispose(); }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.setIndex(new THREE.BufferAttribute(idx, 1));
  return m;
}
// a flat sign facing the camera
function sign(c, canvas, x, y, z, w, h, glow) {
  const { THREE, add, tex, std } = c, t = tex(canvas);
  const m = add(new c.THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: t, roughness: 0.6, side: THREE.DoubleSide, emissive: glow ? 0xffffff : 0x000000, emissiveMap: glow ? t : null, emissiveIntensity: glow || 0 })));
  m.position.set(x, y, z); return m;
}
function instances(c, geo, mat, list, colors) {
  const { THREE, add } = c, m = add(new THREE.InstancedMesh(geo, mat, list.length)), o = new THREE.Object3D(), col = new THREE.Color();
  list.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.rotation.set(p[6] || 0, p[7] || 0, p[8] || 0); o.scale.set(p[3], p[4], p[5]); o.updateMatrix(); m.setMatrixAt(i, o.matrix); if (colors) m.setColorAt(i, col.set(colors[i % colors.length])); });
  m.castShadow = false; m.receiveShadow = false; return m;
}
function farCity(c, z0, z1, n, seed, tint = 0x0e0a1e) {
  const { THREE, add, tex, std, art, L, G } = c, R = rng(seed), winT = tex(art.windows), groups = new Map();
  for (let i = 0; i < n; i++) { const w = 8 + R() * 16, h = 10 + R() * 30, d = 8 + R() * 14, x = -260 + R() * (L + 520), z = z0 - R() * (z1 - z0);
    const rx = Math.max(1, Math.round(w / 14)), ry = Math.max(1, Math.round(h / 18)), key = rx + 'x' + ry, g = new THREE.BoxGeometry(w, h, d); g.translate(x, G + h / 2 - 4, z);
    if (!groups.has(key)) groups.set(key, { rx, ry, geos: [] }); groups.get(key).geos.push(g); }
  for (const { rx, ry, geos } of groups.values()) { const t = winT.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true; add(new THREE.Mesh(mergeBoxes(THREE, geos), std({ color: tint, roughness: 0.9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.3 }))); }
}
function treeRow(c, z0, z1, n, trunkCol, crownCol, seed) {
  const { THREE, std, L, G } = c, R = rng(seed), tr = [], cr = [];
  for (let i = 0; i < n; i++) { const x = -40 + i * ((L + 80) / n) + R() * 3, z = z0 - R() * (z1 - z0), sc = 0.9 + R() * 0.8;
    tr.push([x, G + 1.0 * sc, z, sc, sc, sc, 0, R() * 6]); cr.push([x, G + 3.0 * sc, z, sc * (1 + R() * 0.3), sc * (1.15 + R() * 0.4), sc]); }
  instances(c, new THREE.CylinderGeometry(0.14, 0.2, 2.0, 6), std({ color: trunkCol, roughness: 0.9 }), tr);
  instances(c, new THREE.IcosahedronGeometry(1.35, 0), std({ color: crownCol, roughness: 0.95, flatShading: true }), cr);
}

export const THEMES = {
  /* ---------------- city at sunset ---------------- */
  mesto: {
    sky: { top: '#130c36', mid: '#5c2468', hor: '#ff8a52', low: '#2a1638', sun: '#ffcf8a', stars: 0.8 }, sunDir: [0.48, 0.3, -0.82],
    fog: [0x7a3a64, 45, 260], hemi: [0x8d7bff, 0x2a1530, 0.75], sunLight: [0xffb27a, 3.1],
    cap: (a) => a.panel, surface: (a) => a.concrete, surfMat: { color: 0xbdb3d0 },
    railing: { color: 0xf2b52e, metalness: 0.3, roughness: 0.4 },
    ground: [0x2a2440, (a) => a.concrete], pad: [0x8a82a8, (a) => a.concrete],
    build(c) {
      const { THREE, add, tex, std, stick, shadow, art, L, W, G } = c;
      const wallZ = -W / 2 - 2.8, blank = std({ color: 0x4c4569, roughness: 0.9 }), dark = std({ color: 0x221a3c, metalness: 0.6, roughness: 0.45 });
      const wallMats = [art.wallA, art.wallB].map((cv) => std({ map: tex(cv), roughness: 0.9 }));
      const fenceMat = std({ map: tex(art.chain, [26 / 0.5, 1.5 / 0.5]), color: 0x3c3460, metalness: 0.6, roughness: 0.5, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
      for (let i = 0, x = -14; x < L + 20; i++, x += 26) {
        const w = add(new THREE.Mesh(new THREE.BoxGeometry(26, 2.6, 0.35), [blank, blank, blank, blank, wallMats[i % 2], blank])); w.position.set(x + 13, G + 1.3, wallZ); shadow(w);
        const f = add(new THREE.Mesh(new THREE.PlaneGeometry(26, 1.5), fenceMat)); f.position.set(x + 13, G + 2.6 + 0.75, wallZ);
        for (let k = 0; k < 26; k += 2.6) stick(dark, [x + k, G + 2.6, wallZ], [x + k, G + 4.15, wallZ], 0.04);
      }
      // sponsor banners hung on the fence
      for (const x of [20, 72, 112]) sign(c, themeArt('bannerBB'), x, G + 3.35, wallZ + 0.2, 5.2, 1.3);
      const beamMat = new THREE.MeshBasicMaterial({ map: tex(art.beam), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.16, fog: false });
      for (let x = -6; x < L + 10; x += 34) {
        const bz = wallZ - 1.4; stick(dark, [x, G, bz], [x, G + 9.5, bz], 0.11);
        const head = add(new THREE.Group()); head.position.set(x, G + 9.5, bz + 0.2); head.lookAt(x + 6, 0, 2);
        head.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.3), dark));
        for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.05), std({ color: 0xffffff, emissive: 0xfff2d8, emissiveIntensity: 3.5 })); l.position.set(-0.57 + i * 0.38, 0, 0.17); head.add(l); }
        const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 11, 24, 1, true), beamMat); beam.position.set(0, 0, 5.4); beam.rotation.x = -Math.PI / 2; head.add(beam);
      }
      farCity(c, 150, 280, 120, 31);
      treeRow(c, 36, 48, 56, 0x45305a, 0x55407e, 77);
      const cone = (x, z) => { const g = add(new THREE.Group()), c1 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 24), std({ color: 0xff6a1a, roughness: 0.5 })); c1.position.y = 0.34; g.add(c1);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.14, 0.09, 24), std({ color: 0xffffff, roughness: 0.4 })); band.position.y = 0.3; g.add(band); g.position.set(x, G, z); shadow(g); };
      for (const [x, z] of [[-4.6, 3.2], [-5.2, 4.2], [L + 4.6, 3.4], [30.5, -3.6], [49.5, 3.9], [68.5, -3.7], [95, 3.8], [112, -3.6]]) cone(x, z);
      const bench = (x, z) => { const g = add(new THREE.Group()), seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.45), std({ color: 0xff4fa3, roughness: 0.6 })); seat.position.y = 0.45; g.add(seat);
        for (const dx of [-0.75, 0.75]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.4), dark); leg.position.set(dx, 0.22, 0); g.add(leg); } g.position.set(x, G, z); shadow(g); };
      for (const [x, z] of [[20, -4.0], [88, -4.0], [124, 4.4]]) bench(x, z);
      const neon = std({ color: 0x86ff4d, emissive: 0x86ff4d, emissiveIntensity: 4 });
      { const g = add(new THREE.Group()), b = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.38, 0.26), std({ color: 0x2b2546, roughness: 0.6 })); b.position.y = 0.19; g.add(b);
        for (const dx of [-0.17, 0.17]) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 10, 28), neon); s.position.set(dx, 0.19, 0.135); g.add(s); } g.position.set(-2.2, c.track.topL, -1.4); shadow(g); }
      { const bp = add(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.26), std({ color: 0xff7a1a, roughness: 0.7 }))); bp.position.set(L + 2.4, c.track.topR + 0.28, -1.5); bp.rotation.y = 0.3; shadow(bp); }
    },
  },

  /* ---------------- dino jungle ---------------- */
  dzungle: {
    sky: { top: '#0b2a2e', mid: '#2f6a55', hor: '#ffcf73', low: '#1a3a2a', sun: '#ffe2a0', stars: 0.2 }, sunDir: [-0.45, 0.28, -0.85],
    fog: [0x5a8a62, 40, 230], hemi: [0xb0f0c0, 0x2a3a20, 0.85], sunLight: [0xffd9a0, 3.0], fill: [0xa0d8ff, 0.5],
    cap: () => themeArt('planks'), surface: () => themeArt('woodTop'), surfMat: { color: 0xffffff, roughness: 0.75 },
    railing: { color: 0x6a4020, roughness: 0.9 }, copingMat: { color: 0x7a7f8f, metalness: 0.8, roughness: 0.45 }, edgeMat: { color: 0x5a3a1a, roughness: 0.8 },
    ground: [0x5f7f3a, () => themeArt('dirt')], pad: [0x8a6a42, () => themeArt('dirt')],
    build(c) {
      const { THREE, add, std, stick, shadow, L, W, G } = c, R = rng(91);
      // jungle bushes and palms behind the track
      const bushes = [], greens = [0x2f7a3a, 0x3f9a44, 0x26662f, 0x4fae4a, 0x1f5a2a];
      for (let i = 0; i < 150; i++) { const far = R(), s = 0.9 + R() * 1.4 + far * 1.6; bushes.push([-30 + R() * (L + 60), G + s * 0.45, -6.5 - far * 22, s * 1.3, s * 0.85, s]); }
      instances(c, new THREE.IcosahedronGeometry(1, 1), std({ roughness: 0.95, flatShading: true }), bushes, greens);
      const trunks = [], leaves = [];
      for (let i = 0; i < 38; i++) {
        const x = -25 + i * ((L + 50) / 38) + R() * 3, z = -8 - R() * 16, h = 7 + R() * 6, lean = R3(0.3);
        trunks.push([x, G + h / 2, z, 1, h, 1, 0, 0, lean]);
        const tx = x - Math.sin(lean) * h / 2, ty = G + h / 2 + Math.cos(lean) * h / 2;
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + R(); leaves.push([tx, ty, z, 0.55, 3.2, 0.12, 0, a, 1.25]); }
      }
      instances(c, new THREE.CylinderGeometry(0.22, 0.32, 1, 7), std({ color: 0x6b4a2a, roughness: 0.9 }), trunks);
      const leafGeo = new THREE.ConeGeometry(1, 1, 4); leafGeo.translate(0, 0.5, 0);
      instances(c, leafGeo, std({ roughness: 0.8, flatShading: true }), leaves, [0x3fae4a, 0x2f8a3a, 0x5fc84a]);
      // hills and the volcano
      const hills = []; for (let i = 0; i < 14; i++) { const s = 30 + R() * 40; hills.push([-200 + R() * (L + 400), G - s * 0.3, -90 - R() * 80, s, s * (0.5 + R() * 0.3), s]); }
      instances(c, new THREE.SphereGeometry(1, 16, 10), std({ color: 0x2f5a35, roughness: 1 }), hills);
      const vx = L * 0.62, vz = -240;
      const volcano = add(new THREE.Mesh(new THREE.ConeGeometry(80, 85, 28, 1, true), std({ color: 0x3a2a26, roughness: 0.95, flatShading: true }))); volcano.position.set(vx, G + 42, vz);
      const crater = add(new THREE.Mesh(new THREE.CylinderGeometry(14, 16, 3, 24), std({ color: 0xff5a14, emissive: 0xff4a10, emissiveIntensity: 3 }))); crater.position.set(vx, G + 78, vz);
      for (let i = 0; i < 4; i++) { const lava = add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 46, 0.6), std({ color: 0xff6a1a, emissive: 0xff4a10, emissiveIntensity: 2.4 }))); const a = -0.5 + i * 0.32; lava.position.set(vx + Math.sin(a) * 38, G + 56, vz + 34); lava.rotation.set(-0.72, 0, a * 1.4); }
      // long-necked dinosaurs in the distance, T-rex statue by the big table, flying reptiles
      const dinoMat = std({ color: 0x6f8f6a, roughness: 0.8 }), darkGreen = std({ color: 0x4f8f3a, roughness: 0.7 }), eye = std({ color: 0xffe14d, emissive: 0xffd23f, emissiveIntensity: 2 });
      const ball = (g, m, x, y, z, sx, sy, sz) => { const b = new THREE.Mesh(c.shared.sph, m); b.position.set(x, y, z); b.scale.set(sx, sy, sz); b.castShadow = true; g.add(b); return b; };
      const necks = [];
      for (const [x, z, s] of [[28, -34, 1], [108, -44, 0.85], [-12, -52, 0.7]]) {
        const g = add(new THREE.Group()); g.position.set(x, G, z); g.scale.setScalar(s);
        ball(g, dinoMat, 0, 5.4, 0, 4.6, 2.6, 2.3);
        for (const [lx, lz] of [[-2.6, -1.2], [-2.6, 1.2], [2.4, -1.2], [2.4, 1.2]]) stick(dinoMat, [lx, 0, lz], [lx, 5, lz], 0.6, true, g);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(1.2, 9, 10), dinoMat); tail.position.set(-8, 4.4, 0); tail.rotation.z = 1.35; g.add(tail);
        const neck = new THREE.Group(); neck.position.set(3.6, 6.4, 0); g.add(neck);
        stick(dinoMat, [0, 0, 0], [3.2, 7.5, 0], 0.7, true, neck); ball(neck, dinoMat, 3.6, 8.1, 0, 1.3, 0.7, 0.75); ball(neck, eye, 4.3, 8.4, 0.5, 0.14, 0.14, 0.14);
        necks.push(neck);
      }
      { const g = add(new THREE.Group()); g.position.set(79.5, G, -4.2); g.rotation.y = -0.35;
        for (const lz of [-0.6, 0.6]) { stick(darkGreen, [-0.6, 0, lz], [-0.2, 1.8, lz], 0.42, true, g); stick(darkGreen, [-0.2, 1.8, lz], [-0.7, 3.4, lz], 0.55, true, g); }
        ball(g, darkGreen, -0.6, 4.2, 0, 2.5, 1.5, 1.3);
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5.5, 10), darkGreen); tail.position.set(-4.3, 3.6, 0); tail.rotation.z = 1.45; g.add(tail);
        stick(darkGreen, [1.4, 4.8, 0], [2.4, 6.0, 0], 0.65, true, g);
        ball(g, darkGreen, 3.2, 6.4, 0, 1.5, 0.75, 0.8);
        const jaw = new THREE.Mesh(c.shared.box, darkGreen); jaw.position.set(3.3, 5.55, 0); jaw.scale.set(2.2, 0.32, 1.1); jaw.rotation.z = -0.35; g.add(jaw);
        const teeth = std({ color: 0xfff6e0 }); for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 5), teeth); t.position.set(2.5 + i * 0.32, 5.95, (i % 2 ? 0.4 : -0.4)); t.rotation.z = Math.PI; g.add(t); }
        ball(g, eye, 3.6, 6.9, 0.62, 0.16, 0.16, 0.16); ball(g, eye, 3.6, 6.9, -0.62, 0.16, 0.16, 0.16);
        for (const lz of [-0.9, 0.9]) stick(darkGreen, [1.2, 4.3, lz], [1.9, 3.7, lz * 1.1], 0.14, false, g);
        shadow(g); }
      const ptero = [];
      for (let i = 0; i < 3; i++) {
        const g = add(new THREE.Group()), m = std({ color: 0x8a5a3a, roughness: 0.7, side: THREE.DoubleSide });
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 6), m); body.rotation.z = -Math.PI / 2; g.add(body);
        const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -0.8, 0, 3.4, 0.9, 0, 0.6], 3)); wg.computeVertexNormals();
        const w1 = new THREE.Mesh(wg, m), w2 = new THREE.Mesh(wg, m); w2.scale.z = -1; g.add(w1, w2);
        ptero.push({ g, w1, w2, r: 30 + i * 12, y: 18 + i * 4, cx: 40 + i * 35, sp: 0.18 + i * 0.05, ph: i * 2 });
      }
      // tiki torches along the back of the track
      const pole = std({ color: 0x5a3418, roughness: 0.9 });
      for (let x = 6; x < L - 4; x += 16) { const z = -W / 2 - 0.7; stick(pole, [x, G, z], [x, G + 2.3, z], 0.07, true); const cup = add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.35, 10), pole)); cup.position.set(x, G + 2.4, z); c.emitters.push([x, G + 2.55, z, 0.32]); }
      // rocks
      const rocks = []; for (let i = 0; i < 40; i++) { const s = 0.4 + R() * 1.2; rocks.push([-10 + R() * (L + 20), G + s * 0.3, (R() < 0.5 ? -1 : 1) * (W / 2 + 1 + R() * 3), s * 1.3, s, s, R(), R(), R()]); }
      instances(c, new THREE.IcosahedronGeometry(1, 0), std({ color: 0x7a7a6a, roughness: 1, flatShading: true }), rocks);
      // BoardBeat wooden signs
      for (const x of [16, 97]) { stick(pole, [x - 2, G, -3.8], [x - 2, G + 3.2, -3.8], 0.1, true); stick(pole, [x + 2, G, -3.8], [x + 2, G + 3.2, -3.8], 0.1, true); sign(c, themeArt('bannerBB'), x, G + 2.6, -3.7, 4.6, 1.15); }
      return {
        update(dt, t) {
          necks.forEach((n, i) => { n.rotation.z = 0.12 * Math.sin(t * 0.6 + i * 2); n.rotation.y = 0.2 * Math.sin(t * 0.35 + i); });
          for (const p of ptero) { const a = t * p.sp + p.ph; p.g.position.set(p.cx + Math.cos(a) * p.r, p.y + Math.sin(a * 2) * 1.5, -30 + Math.sin(a) * 14); p.g.rotation.y = -a + Math.PI; const f = Math.sin(t * 6 + p.ph) * 0.6; p.w1.rotation.x = f; p.w2.rotation.x = -f; }
        },
      };
    },
  },

  /* ---------------- FMX desert ---------------- */
  fmx: {
    sky: { top: '#2a2a6b', mid: '#c2557a', hor: '#ffb050', low: '#5a2a20', sun: '#ffe0a0', stars: 0.3 }, sunDir: [0.25, 0.12, -0.96],
    fog: [0xd88a5a, 60, 360], hemi: [0xffd0a0, 0x6a3a20, 0.9], sunLight: [0xffc080, 3.2], fill: [0xa0b0ff, 0.45],
    cap: () => themeArt('dirtSide'), surface: () => themeArt('dirt'), surfMat: { color: 0xffffff, roughness: 0.95 },
    copingMat: { color: 0x6a4020, roughness: 0.9 }, edgeMat: { color: 0x6a6e80, metalness: 0.7, roughness: 0.4 },
    ground: [0xe0a870, () => themeArt('sand')], dust: [0.8, 0.55, 0.32],
    build(c) {
      const { THREE, add, tex, std, stick, shadow, L, W, G, track } = c, R = rng(71);
      // mesas
      const rockT = tex(themeArt('rock'), [3, 2]);
      for (let i = 0; i < 11; i++) { const h = 25 + R() * 50, r = 30 + R() * 50, m = add(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.8, r, h, 7, 1), std({ map: rockT, color: 0xffffff, roughness: 1, flatShading: true }))); m.position.set(-220 + R() * (L + 440), G + h / 2, -150 - R() * 150); m.rotation.y = R() * 3; }
      const dunes = []; for (let i = 0; i < 18; i++) { const s = 18 + R() * 30; dunes.push([-150 + R() * (L + 300), G - s * 0.75, -50 - R() * 70, s * 1.6, s, s]); }
      instances(c, new THREE.SphereGeometry(1, 18, 10), std({ map: tex(themeArt('sand'), [4, 4]), color: 0xe8b07a, roughness: 1 }), dunes);
      // cacti
      const cactus = std({ color: 0x3f8a4a, roughness: 0.8 });
      for (let i = 0; i < 18; i++) {
        const x = -20 + R() * (L + 40), z = (R() < 0.75 ? -1 : 1) * (W / 2 + 3 + R() * 12), h = 2.2 + R() * 2.2, g = add(new THREE.Group()); g.position.set(x, G, z);
        stick(cactus, [0, 0, 0], [0, h, 0], 0.28, true, g);
        for (const s of [-1, 1]) { if (R() < 0.25) continue; const y = h * (0.35 + R() * 0.25); stick(cactus, [0, y, 0], [s * 0.7, y, 0], 0.18, true, g); stick(cactus, [s * 0.7, y, 0], [s * 0.7, y + 0.9 + R() * 0.6, 0], 0.18, true, g); }
      }
      // hay bales and barrels at the track edges
      const hay = []; for (let x = -6; x < L + 6; x += 3.2 + R() * 3) if (R() < 0.55) hay.push([x, G + 0.32, -W / 2 - 0.6, 1.3, 0.64, 0.7, 0, R3(0.3)]);
      instances(c, c.shared.box, std({ color: 0xe8c86a, roughness: 1 }), hay);
      const barrels = []; for (let i = 0; i < 16; i++) barrels.push([-8 + R() * (L + 16), G + 0.45, -W / 2 - 1.6 - R() * 3, 0.32, 0.9, 0.32]);
      instances(c, new THREE.CylinderGeometry(1, 1, 1, 12), std({ roughness: 0.5, metalness: 0.4 }), barrels, [0xd8262f, 0x2a6ef0, 0xffd23f]);
      // banner fence: BoardBeat and FMX
      const bz = -W / 2 - 2.2, bb = [], fm = [];
      for (let i = 0, x = -10; x < L + 10; i++, x += 4.2) (i % 2 ? fm : bb).push([x, G + 0.75, bz, 1, 1, 1]);
      instances(c, new THREE.PlaneGeometry(4, 1), std({ map: tex(themeArt('bannerBB')), roughness: 0.7, side: THREE.DoubleSide }), bb);
      instances(c, new THREE.PlaneGeometry(4, 1), std({ map: tex(themeArt('bannerFMX')), roughness: 0.7, side: THREE.DoubleSide }), fm);
      // start gate with the sponsor over the start
      const gx = track.spawnX - 1.6, gate = std({ color: 0x1d1640, roughness: 0.6 });
      for (const z of [-3.3, 3.3]) { const p = add(new THREE.Mesh(c.shared.box, gate)); p.scale.set(0.32, 5.6, 0.32); p.position.set(gx, track.groundAt(gx).y + 2.8, z); shadow(p); }
      sign(c, themeArt('bannerBB'), gx, track.groundAt(gx).y + 5.0, 0, 7.2, 1.8).castShadow = true;
      // checkered flags that wave
      const flagMat = std({ map: tex(themeArt('checker')), side: THREE.DoubleSide, roughness: 0.8 }), flags = [];
      for (const x of [2, 30, 52, 100, 128, L - 2]) { const z = -W / 2 - 1.2; stick(std({ color: 0xdddddd, metalness: 0.6 }), [x, G, z], [x, G + 4.2, z], 0.04, true); const f = add(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.85), flagMat)); f.geometry.translate(0.6, 0, 0); f.position.set(x, G + 3.75, z); flags.push(f); }
      // paddock: trucks behind the fence
      for (const [x, col] of [[18, 0xf2f2f2], [70, 0xd8262f], [124, 0x2a6ef0]]) {
        const g = add(new THREE.Group()); g.position.set(x, G, -16);
        const box = new THREE.Mesh(c.shared.box, std({ color: col, roughness: 0.5 })); box.scale.set(11, 3.4, 2.6); box.position.y = 2.4; g.add(box);
        const cab = new THREE.Mesh(c.shared.box, std({ color: 0x2a2840, roughness: 0.5 })); cab.scale.set(2.6, 2.8, 2.5); cab.position.set(7, 2.1, 0); g.add(cab);
        for (const wx of [-4, -2.6, 5.2, 7.4]) for (const wz of [-1.2, 1.2]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 14), std({ color: 0x15141c })); w.rotation.x = Math.PI / 2; w.position.set(wx, 0.55, wz); g.add(w); }
        shadow(g);
      }
      return { update(dt, t) { flags.forEach((f, i) => { f.rotation.y = 0.35 * Math.sin(t * 3 + i); f.rotation.z = 0.05 * Math.sin(t * 5 + i); }); } };
    },
  },

  /* ---------------- night arena mega ramp ---------------- */
  mega: {
    sky: { top: '#03040f', mid: '#0b1035', hor: '#1d2a6a', low: '#05060f', sun: '#5a6aa0', stars: 1.2 }, sunDir: [0.35, 0.62, -0.7],
    fog: [0x0b1030, 80, 420], hemi: [0x5a6ac0, 0x14142a, 0.8], sunLight: [0xa8b8ff, 1.6], fill: [0xc0d0ff, 0.6],
    exposure: 1.15, bloom: 0.9, shadow: { lr: 22, top: 24, bottom: -14 }, neon: [0x2ad1ff, 0xff4fa3],
    cap: () => themeArt('truss'), capMat: { roughness: 0.6, metalness: 0.4 }, surface: () => themeArt('skatelite'), surfMat: { color: 0xffffff, roughness: 0.55 },
    railing: { color: 0xc4cadb, metalness: 1, roughness: 0.35 }, edgeMat: { color: 0x2ad1ff, emissive: 0x2ad1ff, emissiveIntensity: 2 },
    ground: [0x1c1e30, (a) => a.concrete], pad: [0x2a2d45, (a) => a.concrete], decalGlow: 0.35,
    build(c) {
      const { THREE, add, tex, std, stick, shadow, L, W, G, fx } = c, R = rng(51);
      // grandstands full of fans
      const stand = std({ color: 0x1a1c2e, roughness: 0.9 }), x0 = -40, x1 = L + 40, fans = [], fanCols = [0xff4fa3, 0x2ad1ff, 0xffd23f, 0x86ff4d, 0xff7a1a, 0xffffff, 0xb04bff, 0xff3b2e];
      for (let s = 0; s < 7; s++) {
        const z = -12.5 - s * 1.3, h = 0.9 * (s + 1), m = add(new THREE.Mesh(c.shared.box, stand)); m.scale.set(x1 - x0, h, 1.3); m.position.set((x0 + x1) / 2, G + h / 2, z); m.receiveShadow = true;
        for (let x = x0 + 1; x < x1 - 1; x += 0.95 + R() * 0.5) if (R() < 0.85) fans.push([x, G + h + 0.32, z + R3(0.3), 0.42, 0.62 + R() * 0.15, 0.32, 0, R3(0.6)]);
      }
      instances(c, c.shared.box, std({ roughness: 0.8 }), fans, fanCols);
      const roof = add(new THREE.Mesh(c.shared.box, std({ color: 0x0e1020, roughness: 0.8 }))); roof.scale.set(x1 - x0, 0.6, 10); roof.position.set((x0 + x1) / 2, G + 13, -17);
      // LED boards in front of the stands and a big screen
      const leds = [themeArt('led', 'BB'), themeArt('led', 'MEGA RAMPA', '#fff3a0', '#ff8a1f'), themeArt('led', 'BIG AIR', '#c8fff0', '#2ad1ff')];
      for (let i = 0, x = x0 + 6; x < x1 - 4; i++, x += 8.4) sign(c, leds[i % 3], x, G + 0.9, -11.7, 8, 1.6, 1.4);
      const scr = sign(c, leds[0], L * 0.52, G + 21, -24, 22, 5.5, 1.6); scr.material.side = THREE.FrontSide;
      const frame = add(new THREE.Mesh(c.shared.box, std({ color: 0x15141c, metalness: 0.6, roughness: 0.4 }))); frame.scale.set(23, 6.5, 0.6); frame.position.set(L * 0.52, G + 21, -24.4);
      stick(std({ color: 0x2a2d45, metalness: 0.6 }), [L * 0.52, G, -24.6], [L * 0.52, G + 18, -24.6], 0.5);
      // light towers with beams and two real spotlights
      const towerMat = std({ color: 0x2a2d45, metalness: 0.7, roughness: 0.4 }), beamMat = new THREE.MeshBasicMaterial({ map: tex(c.art.beam), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.22, fog: false });
      const towers = [-14, L * 0.3, L * 0.62, L + 14];
      towers.forEach((x, i) => {
        stick(towerMat, [x, G, -28], [x, G + 34, -28], 0.45);
        const head = add(new THREE.Group()); head.position.set(x, G + 34, -27.5); head.lookAt(L * 0.45, 8, 0);
        head.add(new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.6), towerMat));
        for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.1), std({ color: 0xffffff, emissive: 0xeef4ff, emissiveIntensity: 5 })); l.position.set(-1.65 + a * 1.1, -0.55 + b * 1.1, 0.35); head.add(l); }
        const beam = new THREE.Mesh(new THREE.ConeGeometry(6, 34, 24, 1, true), beamMat); beam.position.set(0, 0, 17); beam.rotation.x = -Math.PI / 2; head.add(beam);
        if (i === 1 || i === 2) { const sp = new THREE.SpotLight(0xdde6ff, 2600, 0, 0.42, 0.6, 2); sp.position.set(x, G + 34, -27.5); sp.target.position.set(x + (i === 1 ? -6 : 10), 6, 0); add(sp); add(sp.target); }
      });
      // flags of light: neon arches over the start deck
      const t0 = c.track.topL;
      for (const z of [-2.8, 2.8]) stick(std({ color: 0xff4fa3, emissive: 0xff4fa3, emissiveIntensity: 3 }), [-2.6, t0, z], [-2.6, t0 + 4, z], 0.06);
      sign(c, themeArt('led', 'BB'), -2.6, t0 + 4.3, 0, 5.6, 1.4, 1.3).rotation.y = Math.PI / 2;
      let fwT = 2;
      return {
        update(dt, t, tgt) {
          // camera flashes in the crowd
          if (Math.random() < dt * 14) fx('firework-flash');
          fwT -= dt; if (fwT < 0) { fwT = 5 + Math.random() * 5; fx('firework', { x: tgt.x + R3(40), y: 26 + Math.random() * 10, z: -40 }); }
        },
        onTrick(d) { if (d.pts >= 20) for (let i = 0; i < Math.min(5, 1 + (d.pts / 25) | 0); i++) setTimeout(() => fx('firework', { x: c.track.L * Math.random(), y: 24 + Math.random() * 12, z: -38 }), i * 260); },
      };
    },
  },
};

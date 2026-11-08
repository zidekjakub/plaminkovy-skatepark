import * as THREE from '../vendor/three/build/three.module.min.js';
import { EffectComposer } from '../vendor/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/examples/jsm/postprocessing/OutputPass.js';
import { T } from './track.js';
import { rng } from './art.js';

export function createWorld(canvas, track, art) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x7a3a64, 45, 260);
  const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 700);
  const texs = [];
  const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } texs.push(t); return t; };
  const L = track.L, W = T.W, H = T.H, G = T.G;

  /* sky with sun and stars */
  const sunDir = new THREE.Vector3(0.48, 0.3, -0.82).normalize();
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color('#130c36') }, mid: { value: new THREE.Color('#5c2468') }, hor: { value: new THREE.Color('#ff8a52') }, low: { value: new THREE.Color('#2a1638') }, sunDir: { value: sunDir }, sunCol: { value: new THREE.Color('#ffcf8a') } },
    vertexShader: 'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
    fragmentShader: `uniform vec3 top,mid,hor,low,sunDir,sunCol;varying vec3 vD;
      float h31(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      void main(){vec3 d=normalize(vD);float h=d.y;
        vec3 c=mix(hor,mid,smoothstep(0.0,0.24,h));c=mix(c,top,smoothstep(0.2,0.7,h));c=mix(c,low,smoothstep(0.0,-0.1,h));
        float s=max(dot(d,normalize(sunDir)),0.);c+=sunCol*(smoothstep(0.9988,0.9993,s)*5.0+pow(s,70.)*0.7+pow(s,7.)*0.28);
        float st=step(0.9978,h31(floor(d*380.)))*smoothstep(0.3,0.65,h);c+=vec3(st)*0.8;
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), skyMat); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMat));
  scene.environment = pmrem.fromScene(envScene, 0.03, 0.1, 200).texture;

  /* lights */
  scene.add(new THREE.HemisphereLight(0x8d7bff, 0x2a1530, 0.75));
  const sun = new THREE.DirectionalLight(0xffb27a, 3.1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 12, bottom: -8, near: 1, far: 110 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0x9ab8ff, 0.6); fill.position.set(-12, 9, 16); scene.add(fill);

  /* materials */
  const M = {
    dark: new THREE.MeshStandardMaterial({ color: 0x221a3c, metalness: 0.6, roughness: 0.45 }),
    rail: new THREE.MeshStandardMaterial({ color: 0xf2b52e, metalness: 0.3, roughness: 0.4 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xc4cadb, metalness: 1, roughness: 0.42 }),
    neon: new THREE.MeshStandardMaterial({ color: 0x86ff4d, emissive: 0x86ff4d, emissiveIntensity: 4 }),
  };
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 14), UPV = new THREE.Vector3(0, 1, 0), tA = new THREE.Vector3(), tB = new THREE.Vector3(), tD = new THREE.Vector3();
  const stick = (mat, a, b, r, parent = scene) => { const m = new THREE.Mesh(cyl, mat); tA.set(...a); tB.set(...b); tD.subVectors(tB, tA); const l = tD.length(); m.position.addVectors(tA, tB).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UPV, tD.multiplyScalar(1 / l)); m.scale.set(r, l, r); m.castShadow = mat === M.rail; parent.add(m); return m; };
  const shadow = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

  /* the park: the riding profile extruded into concrete */
  const shp = new THREE.Shape(); shp.moveTo(-T.DECK, G); shp.lineTo(-T.DECK, H); track.pts.forEach(([x, y]) => shp.lineTo(x, y)); shp.lineTo(L + T.DECK, H); shp.lineTo(L + T.DECK, G); shp.lineTo(-T.DECK, G);
  const pg = new THREE.ExtrudeGeometry(shp, { depth: W, bevelEnabled: false, curveSegments: 1 }); pg.translate(0, 0, -W / 2);
  const panelTex = tex(art.panel, [1 / art.panelM[0], 1 / art.panelM[1]]); panelTex.offset.set(0, -G / art.panelM[1]);
  const park = new THREE.Mesh(pg, [new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.8 }), new THREE.MeshStandardMaterial({ map: tex(art.concrete, [0.3, 0.3]), color: 0xbdb3d0, roughness: 0.85 })]);
  park.castShadow = park.receiveShadow = true; scene.add(park);
  // decals painted on the near side of the ramps
  const decal = (d, x, y, w) => { const h = w * d.h / d.w; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex(d.canvas), transparent: true, alphaTest: 0.05, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 })); m.position.set(x, y, W / 2 + 0.012); m.receiveShadow = true; scene.add(m); };
  decal(art.decals.vojta, -1.5, 0.9, 3.6);
  decal(art.decals.flair, 39.8, 0.62, 3.0);
  decal(art.decals.turbo, 58.5, 0.5, 2.3);
  decal(art.decals.vojta, 81.0, 0.95, 4.2);
  decal(art.decals.flame, L + 1.7, 1.75, 2.5);
  // coping and lip edges
  for (const x of [0, L]) { const cp = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, W + 0.04, 20), M.chrome); cp.rotation.x = Math.PI / 2; cp.position.set(x, H, 0); cp.castShadow = true; scene.add(cp); }
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8f95ad, metalness: 0.5, roughness: 0.55 });
  const edge = (x, y) => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, W + 0.02), edgeMat); e.position.set(x, y + 0.01, 0); scene.add(e); };
  for (const [x, y] of [[track.lips[0], 1.3], [track.lips[1], 2.0], [55, 1.0], [62, 1.0]]) edge(x, y);
  // railings on the end decks
  for (const sd of [-1, 1]) {
    const x0 = sd < 0 ? -0.6 : L + 0.6, xo = sd < 0 ? -T.DECK + 0.12 : L + T.DECK - 0.12, zb = -W / 2 + 0.15;
    for (const x of [x0, (x0 + xo) / 2, xo]) stick(M.rail, [x, H, zb], [x, H + 1, zb], 0.035);
    for (const z of [-0.9, 0.9, W / 2 - 0.15]) stick(M.rail, [xo, H, z], [xo, H + 1, z], 0.035);
    stick(M.rail, [x0, H + 1, zb], [xo, H + 1, zb], 0.03); stick(M.rail, [x0, H + 0.5, zb], [xo, H + 0.5, zb], 0.025);
    stick(M.rail, [xo, H + 1, zb], [xo, H + 1, W / 2 - 0.15], 0.03); stick(M.rail, [xo, H + 0.5, zb], [xo, H + 0.5, W / 2 - 0.15], 0.025);
  }
  // grind rails sit a little behind the riding line; the rider slides over to them
  const RAIL_Z = -1.35;
  for (const r of track.rails) {
    if (r.kind === 'rail') {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, r.x1 - r.x0, 16), M.rail); bar.rotation.z = Math.PI / 2; bar.position.set((r.x0 + r.x1) / 2, r.y, RAIL_Z); bar.castShadow = true; scene.add(bar);
      for (const x of [r.x0 + 0.3, r.x1 - 0.3]) stick(M.rail, [x, 1.0, RAIL_Z], [x, r.y, RAIL_Z], 0.03);
    } else {
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(r.x1 - r.x0, r.y - G, 0.6), new THREE.MeshStandardMaterial({ map: tex(art.concrete, [2, 0.4]), color: 0x8f86b0, roughness: 0.8 }));
      ledge.position.set((r.x0 + r.x1) / 2, (r.y + G) / 2, RAIL_Z); shadow(ledge); scene.add(ledge);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(r.x1 - r.x0, 0.05, 0.64), M.chrome); cap.position.set((r.x0 + r.x1) / 2, r.y, RAIL_Z); scene.add(cap);
    }
  }
  // fire rings
  // two fire lights follow the two rings nearest the camera (cheaper than four on a phone)
  const ringLights = [0, 1].map(() => { const pl = new THREE.PointLight(0xff7a2a, 26, 0, 2); scene.add(pl); return pl; });
  for (const r of track.rings) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r.r, 0.085, 20, 80), new THREE.MeshStandardMaterial({ color: 0x2a160e, metalness: 0.7, roughness: 0.35, emissive: 0xff5a14, emissiveIntensity: 1.6 }));
    if (r.axis === 'x') m.rotation.y = Math.PI / 2; else m.rotation.x = Math.PI / 2;
    m.position.set(r.x, r.y, 0); scene.add(m);
    if (r.axis === 'x') { const zb = -W / 2 - 0.45; stick(M.dark, [r.x, G, zb], [r.x, r.y, zb], 0.06); stick(M.dark, [r.x, r.y, zb], [r.x, r.y, -r.r - 0.05], 0.045); }
  }
  /* ground, back walls, fence, floodlights */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ map: tex(art.concrete, [120, 120]), color: 0x2a2440, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.position.y = G; ground.receiveShadow = true; scene.add(ground);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(L + 30, 18), new THREE.MeshStandardMaterial({ map: tex(art.concrete, [(L + 30) / 6, 3]), color: 0x8a82a8, roughness: 0.9 })); pad.rotation.x = -Math.PI / 2; pad.position.set(L / 2, G + 0.005, -1); pad.receiveShadow = true; scene.add(pad);
  const wallZ = -W / 2 - 2.8, blank = new THREE.MeshStandardMaterial({ color: 0x4c4569, roughness: 0.9 });
  const wallMats = [art.wallA, art.wallB].map((c) => new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.9 }));
  const chainT = tex(art.chain, [26 / 0.5, 1.5 / 0.5]);
  const fenceMat = new THREE.MeshStandardMaterial({ map: chainT, color: 0x3c3460, metalness: 0.6, roughness: 0.5, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  for (let i = 0, x = -14; x < L + 20; i++, x += 26) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(26, 2.6, 0.35), [blank, blank, blank, blank, wallMats[i % 2], blank]); w.position.set(x + 13, G + 1.3, wallZ); shadow(w); scene.add(w);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(26, 1.5), fenceMat); f.position.set(x + 13, G + 2.6 + 0.75, wallZ); scene.add(f);
    for (let k = 0; k < 26; k += 2.6) stick(M.dark, [x + k, G + 2.6, wallZ], [x + k, G + 4.15, wallZ], 0.04);
  }
  const beamMat = new THREE.MeshBasicMaterial({ map: tex(art.beam), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.16, fog: false });
  for (let x = -6; x < L + 10; x += 34) {
    const bz = wallZ - 1.4; stick(M.dark, [x, G, bz], [x, G + 9.5, bz], 0.11);
    const head = new THREE.Group(); head.position.set(x, G + 9.5, bz + 0.2); head.lookAt(x + 6, 0, 2); scene.add(head);
    head.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.3), M.dark));
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d8, emissiveIntensity: 3.5 })); l.position.set(-0.57 + i * 0.38, 0, 0.17); head.add(l); }
    const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 11, 24, 1, true), beamMat); beam.position.set(0, 0, 5.4); beam.rotation.x = Math.PI / 2; head.add(beam);
  }
  /* far city: boxes merged per window pattern so the phone draws only a few meshes */
  { const R = rng(31), winT = tex(art.windows), groups = new Map();
    for (let i = 0; i < 120; i++) { const w = 8 + R() * 16, h = 10 + R() * 32, d = 8 + R() * 14, x = -260 + R() * (L + 520), z = -150 - R() * 130;
      const rx = Math.max(1, Math.round(w / 14)), ry = Math.max(1, Math.round(h / 18)), key = rx + 'x' + ry;
      const g = new THREE.BoxGeometry(w, h, d); g.translate(x, G + h / 2 - 4, z);
      if (!groups.has(key)) groups.set(key, { rx, ry, geos: [] }); groups.get(key).geos.push(g); }
    for (const { rx, ry, geos } of groups.values()) {
      const t = winT.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.needsUpdate = true;
      const m = new THREE.Mesh(mergeBoxes(geos), new THREE.MeshStandardMaterial({ color: 0x0e0a1e, roughness: 0.9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 1.3 })); scene.add(m); } }
  /* a row of trees between the park and the city */
  { const R = rng(77), n = 56, trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.2, 2.0, 6), new THREE.MeshStandardMaterial({ color: 0x45305a, roughness: 0.9 }), n),
      crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.35, 0), new THREE.MeshStandardMaterial({ color: 0x55407e, roughness: 0.95, flatShading: true }), n), o = new THREE.Object3D();
    for (let i = 0; i < n; i++) { const x = -40 + i * ((L + 80) / n) + R() * 3, z = -36 - R() * 12, sc = 0.9 + R() * 0.8;
      o.position.set(x, G + 1.0 * sc, z); o.scale.setScalar(sc); o.rotation.set(0, R() * 6, 0); o.updateMatrix(); trunk.setMatrixAt(i, o.matrix);
      o.position.set(x, G + (2.0 + 1.0) * sc, z); o.scale.set(sc * (1 + R() * 0.3), sc * (1.15 + R() * 0.4), sc); o.updateMatrix(); crown.setMatrixAt(i, o.matrix); }
    scene.add(trunk, crown); }
  /* props */
  const cone = (x, z) => { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0xff6a1a, roughness: 0.5 })); c.position.y = 0.34; g.add(c);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.14, 0.09, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })); band.position.y = 0.3; g.add(band);
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.44), new THREE.MeshStandardMaterial({ color: 0xd94f10 })); b.position.y = 0.025; g.add(b); g.position.set(x, G, z); scene.add(shadow(g)); };
  for (const [x, z] of [[-4.6, 3.2], [-5.2, 4.2], [L + 4.6, 3.4], [30.5, -3.6], [49.5, 3.9], [68.5, -3.7], [95, 3.8], [112, -3.6]]) cone(x, z);
  const bench = (x, z) => { const g = new THREE.Group(); const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.45), new THREE.MeshStandardMaterial({ color: 0xff4fa3, roughness: 0.6 })); seat.position.y = 0.45; g.add(seat);
    for (const dx of [-0.75, 0.75]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.4), M.dark); leg.position.set(dx, 0.22, 0); g.add(leg); } g.position.set(x, G, z); scene.add(shadow(g)); };
  for (const [x, z] of [[20, -4.0], [88, -4.0], [124, 4.4]]) bench(x, z);
  { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.38, 0.26), new THREE.MeshStandardMaterial({ color: 0x2b2546, roughness: 0.6 })); b.position.y = 0.19; g.add(b);
    for (const dx of [-0.17, 0.17]) { const s = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 10, 28), M.neon); s.position.set(dx, 0.19, 0.135); g.add(s); }
    g.position.set(-2.2, H, -1.4); scene.add(shadow(g)); }
  { const bp = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.56, 0.26), new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.7 })); bp.position.set(L + 2.4, H + 0.28, -1.5); bp.rotation.y = 0.3; scene.add(shadow(bp)); }
  // menu spotlight ring on the floor
  const menuRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.035, 10, 64), new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb02e, emissiveIntensity: 1.4 }));
  menuRing.rotation.x = Math.PI / 2; menuRing.position.set(track.spawnX, 0.03, 0); scene.add(menuRing);

  /* particles */
  const pointsMat = (colored) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { scale: { value: 300 } },
    vertexShader: `uniform float scale;attribute float life;attribute float size;${colored ? 'attribute vec3 col;varying vec3 vC;' : ''}varying float vL;
      void main(){vL=life;${colored ? 'vC=col;' : ''}vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=life>=1.0?0.0:size*(1.0-0.5*life)*scale/-mv.z;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `varying float vL;${colored ? 'varying vec3 vC;' : ''}
      void main(){float d=length(gl_PointCoord-0.5);float a=smoothstep(0.5,0.0,d);
      ${colored ? 'vec3 col=vC;' : 'vec3 col=mix(vec3(1.0,0.72,0.28),vec3(1.0,0.36,0.05),smoothstep(0.0,0.4,vL));col=mix(col,vec3(0.6,0.05,0.02),smoothstep(0.4,1.0,vL));'}
      float al=a*(1.0-vL);gl_FragColor=vec4(col*al*${colored ? '1.0' : '0.62'},al);}` });
  function pool(n, colored) {
    const geo = new THREE.BufferGeometry(), P3 = new Float32Array(n * 3), Lf = new Float32Array(n).fill(1), Sz = new Float32Array(n), Vl = new Float32Array(n * 3), Du = new Float32Array(n).fill(1), Gr = new Float32Array(n);
    geo.setAttribute('position', new THREE.BufferAttribute(P3, 3)); geo.setAttribute('life', new THREE.BufferAttribute(Lf, 1)); geo.setAttribute('size', new THREE.BufferAttribute(Sz, 1));
    let C = null; if (colored) { C = new Float32Array(n * 3); geo.setAttribute('col', new THREE.BufferAttribute(C, 3)); }
    const mat = pointsMat(colored), pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); let cur = 0;
    return { mat, spawn(p, v, dur, size, grav, col) { const i = cur; cur = (cur + 1) % n; P3.set(p, i * 3); Vl.set(v, i * 3); Lf[i] = 0; Du[i] = dur; Sz[i] = size; Gr[i] = grav; if (C && col) C.set(col, i * 3); },
      step(dt) { for (let i = 0; i < n; i++) { if (Lf[i] >= 1) continue; Lf[i] = Math.min(1, Lf[i] + dt / Du[i]); Vl[i * 3 + 1] += Gr[i] * dt; P3[i * 3] += Vl[i * 3] * dt; P3[i * 3 + 1] += Vl[i * 3 + 1] * dt; P3[i * 3 + 2] += Vl[i * 3 + 2] * dt; }
        geo.attributes.position.needsUpdate = geo.attributes.life.needsUpdate = geo.attributes.size.needsUpdate = true; if (C) geo.attributes.col.needsUpdate = true; } };
  }
  const flames = pool(900, false), sparks = pool(500, true);
  let flameAcc = 0;
  const R3 = (a) => (Math.random() - 0.5) * a;

  /* post */
  const ext = renderer.extensions, hdr = renderer.capabilities.isWebGL2 && (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'));
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: renderer.capabilities.isWebGL2 ? 4 : 0 });
  const composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.55, 0.86); composer.addPass(bloom); composer.addPass(new OutputPass());
  let W2 = 1, H2 = 1, pr = 1;
  let quality = 1, lastSize = [1, 1, 1];
  function resize(w, h, dpr) {
    W2 = w; H2 = h; lastSize = [w, h, dpr];
    pr = Math.min(dpr, 2) * quality; if (w * h * pr * pr > 2.4e6) pr = Math.sqrt(2.4e6 / (w * h)); pr = Math.max(1, pr);
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); composer.setPixelRatio(pr); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const sc = h * pr / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); flames.mat.uniforms.scale.value = sc; sparks.mat.uniforms.scale.value = sc;
  }

  /* camera */
  const cam = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), init: false };
  const tp = new THREE.Vector3(), tt = new THREE.Vector3();
  let time = 0, lead = 0, camY = 1.5, zoom = 0;
  function follow(r, dt) {
    const sp = r.inAir ? r.vx : r.v * (track.at(r.s).tx || 0);
    lead += ((Math.max(-3, Math.min(3, sp * 0.3))) - lead) * Math.min(1, dt * 1.5);
    const air = r.inAir ? Math.max(0, r.y - 1.5) : 0;
    camY += ((r.y * 0.6 + 1.4) - camY) * Math.min(1, dt * 3);
    zoom += ((Math.min(4, air * 0.7) + Math.min(2, Math.abs(sp) * 0.12)) - zoom) * Math.min(1, dt * 2);
    const x = r.x + lead;
    tp.set(x - 2.4, camY + 2.6 + zoom * 0.35, 10.0 + zoom); tt.set(x + 0.4, camY + 0.3, -0.3);
  }
  function applyCam(dt, snap) {
    const a = snap || !cam.init ? 1 : 1 - Math.exp(-dt * 4);
    cam.pos.lerp(tp, a); cam.tgt.lerp(tt, a); cam.init = true; camera.position.copy(cam.pos); camera.lookAt(cam.tgt);
  }

  /* per-frame */
  let riderZ = 0; const turboV = new THREE.Vector3();
  function update(dt, opts) {
    time += dt;
    const { mode, rider, model, frame } = opts;
    // camera
    if (mode === 'play' && rider) follow(rider, dt);
    else if (mode === 'menu') { const x = track.spawnX; tp.set(x + 2.7, 1.15, 6.6); tt.set(x - 0.1, 0.32, 0); }
    else { const x = 64 + 62 * Math.sin(time * 0.035); tp.set(x - 4, 6.2, 17); tt.set(x + 2, 1.6, -1); }
    applyCam(dt, opts.snap);
    menuRing.visible = mode === 'menu';
    // rider model
    if (model && frame) {
      let zt = 0;
      if (rider) for (const r of track.rails) { if (rider.mode === 'grind' && rider.rail === r) zt = RAIL_Z; else if (rider.inAir && rider.x > r.x0 - 1.2 && rider.x < r.x1 + 0.2 && rider.y > r.y - 0.1 && rider.vy < 0.5) zt = RAIL_Z; }
      riderZ += (zt - riderZ) * Math.min(1, dt * 7);
      const f2 = { pos: [frame.pos[0], frame.pos[1], frame.pos[2] + riderZ], f: frame.f, u: frame.u, s: frame.s };
      model.update(f2, opts.pose, opts.RS, opts.wheel, dt);
      if (rider && rider.turboOn) { const p = turboV.set(-0.34, 0.1, 0).applyMatrix4(model.root.matrix);
        for (let i = 0; i < 3; i++) sparks.spawn([p.x, p.y, p.z], [-frame.f[0] * 4 + R3(1), -frame.f[1] * 4 + R3(1), R3(1)], 0.22 + Math.random() * 0.18, 0.32, 0.5, [2.2, 0.9, 0.25]); }
      if (rider && rider.mode === 'grind') for (let i = 0; i < 2; i++) sparks.spawn([rider.x, rider.y, riderZ], [-rider.v * 0.3 + R3(2), 1 + Math.random() * 2.5, R3(1.5)], 0.3 + Math.random() * 0.3, 0.06, -9.8, [3, 2.3, 1.0]);
    }
    // shadows follow the action
    const fx = mode === 'play' && rider ? rider.x : mode === 'menu' ? track.spawnX : cam.tgt.x;
    sun.target.position.set(fx, 0, 0); sun.position.copy(sun.target.position).addScaledVector(sunDir, 45);
    // flames on every ring
    flameAcc += dt * 190 * track.rings.length;
    while (flameAcc > 1) { flameAcc--; const r = track.rings[(Math.random() * track.rings.length) | 0], a = Math.random() * Math.PI * 2, rr = r.r + R3(0.12);
      const p = r.axis === 'x' ? [r.x + R3(0.1), r.y + rr * Math.sin(a), rr * Math.cos(a)] : [r.x + rr * Math.cos(a), r.y + R3(0.1), rr * Math.sin(a)];
      flames.spawn(p, [R3(0.3), 1.1 + Math.random() * 1.3, R3(0.3)], 0.45 + Math.random() * 0.45, 0.38 + Math.random() * 0.3, 0.8); }
    flames.step(dt); sparks.step(dt);
    const near = track.rings.map((r, i) => [Math.abs(r.x - cam.tgt.x), i]).sort((a, b) => a[0] - b[0]);
    ringLights.forEach((l, k) => { const r = track.rings[near[k][1]]; l.position.set(r.x, r.y, 0.3); l.intensity = 22 + 6 * Math.sin(time * 23 + k) + 4 * Math.sin(time * 37 + k * 2); });
    composer.render(dt);
  }
  function fx(type, d) {
    if (type === 'takeoff') for (let i = 0; i < (d.big ? 36 : 14); i++) sparks.spawn([d.x, d.y, R3(0.6)], [R3(4), 1.5 + Math.random() * 4, R3(2.5)], 0.35 + Math.random() * 0.35, 0.07, -9.8, [3, 2.4, 1.2]);
    if (type === 'land') for (let i = 0; i < 18; i++) sparks.spawn([d.x, d.y + 0.05, R3(0.8)], [R3(3), 0.5 + Math.random() * 1.2, R3(2)], 0.4 + Math.random() * 0.4, 0.3, -1, [0.35, 0.3, 0.45]);
    if (type === 'ring') for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2; sparks.spawn([d.x, d.y, 0], [Math.cos(a) * 4, Math.sin(a) * 4, R3(3)], 0.5 + Math.random() * 0.4, 0.12, -3, [3, 1.6, 0.4]); }
    if (type === 'crash') for (let i = 0; i < 30; i++) sparks.spawn([d.x, d.y + 0.6, 0], [R3(5), Math.random() * 4, R3(3)], 0.6, 0.12, -6, [2.6, 2.4, 0.8]);
  }
  const pv = new THREE.Vector3();
  function project(p) { pv.set(p[0], p[1], p[2] + riderZ).project(camera); return { x: (pv.x + 1) / 2 * W2, y: (1 - pv.y) / 2 * H2 }; }
  function snapNext() { cam.init = false; }
  // lower the render resolution a step if the phone cannot keep up
  function setQuality(q) { if (q === quality) return; quality = q; resize(...lastSize); }
  return { scene, camera, renderer, resize, update, fx, project, snapNext, setQuality, get quality() { return quality; }, refreshTextures: () => texs.forEach((t) => (t.needsUpdate = true)) };
}

function mergeBoxes(geos) {
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of geos) { pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3); uv.set(g.attributes.uv.array, ov * 2);
    const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[oi + i] = ia[i] + ov; ov += g.attributes.position.count; oi += ia.length; g.dispose(); }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); m.setIndex(new THREE.BufferAttribute(idx, 1));
  return m;
}

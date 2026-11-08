import * as THREE from '../vendor/three/build/three.module.min.js';
import { EffectComposer } from '../vendor/three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/examples/jsm/postprocessing/OutputPass.js';
import { T } from './track.js';
import { themeDecal, themeArt } from './art.js';

// Shared 3D engine: renderer, sky, lights, particles and camera stay; the park
// (ramps and decor) is rebuilt by setPark() whenever another park is chosen.
export function createWorld(canvas, art) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x7a3a64, 45, 260);
  const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 900);

  /* sky with sun (or moon) and stars */
  const sunDir = new THREE.Vector3(0.48, 0.3, -0.82).normalize();
  const skyU = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, low: { value: new THREE.Color() }, sunDir: { value: sunDir }, sunCol: { value: new THREE.Color() }, stars: { value: 0.8 } };
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: skyU,
    vertexShader: 'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}',
    fragmentShader: `uniform vec3 top,mid,hor,low,sunDir,sunCol;uniform float stars;varying vec3 vD;
      float h31(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      void main(){vec3 d=normalize(vD);float h=d.y;
        vec3 c=mix(hor,mid,smoothstep(0.0,0.24,h));c=mix(c,top,smoothstep(0.2,0.7,h));c=mix(c,low,smoothstep(0.0,-0.1,h));
        float s=max(dot(d,normalize(sunDir)),0.);c+=sunCol*(smoothstep(0.9988,0.9993,s)*5.0+pow(s,70.)*0.7+pow(s,7.)*0.28);
        float st=step(0.9978,h31(floor(d*380.)))*smoothstep(0.3,0.65,h);c+=vec3(st)*stars;
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 48, 24), skyMat); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(); envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), skyMat));

  /* lights */
  const hemi = new THREE.HemisphereLight(0x8d7bff, 0x2a1530, 0.75); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb27a, 3.1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0x9ab8ff, 0.6); fill.position.set(-12, 9, 16); scene.add(fill);
  const ringLights = [0, 1].map(() => { const pl = new THREE.PointLight(0xff7a2a, 26, 0, 2); scene.add(pl); return pl; });

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
  const flames = pool(1100, false), sparks = pool(700, true);
  let flameAcc = 0, emitAcc = 0;
  const R3 = (a) => (Math.random() - 0.5) * a;

  const menuRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.035, 10, 64), new THREE.MeshStandardMaterial({ color: 0xffd23f, emissive: 0xffb02e, emissiveIntensity: 1.4 }));
  menuRing.rotation.x = Math.PI / 2; scene.add(menuRing);

  /* post */
  const ext = renderer.extensions, hdr = renderer.capabilities.isWebGL2 && (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float'));
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: renderer.capabilities.isWebGL2 ? 4 : 0 });
  const composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.55, 0.86); composer.addPass(bloom); composer.addPass(new OutputPass());
  let W2 = 1, H2 = 1, pr = 1, quality = 1, lastSize = [1, 1, 1];
  function resize(w, h, dpr) {
    W2 = w; H2 = h; lastSize = [w, h, dpr];
    pr = Math.min(dpr, 2) * quality; if (w * h * pr * pr > 2.4e6) pr = Math.sqrt(2.4e6 / (w * h)); pr = Math.max(1, pr);
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); composer.setPixelRatio(pr); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const sc = h * pr / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))); flames.mat.uniforms.scale.value = sc; sparks.mat.uniforms.scale.value = sc;
  }
  function setQuality(q) { if (q === quality) return; quality = q; resize(...lastSize); }

  /* ---------- the park ---------- */
  const shared = { cyl: new THREE.CylinderGeometry(1, 1, 1, 14), box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(1, 16, 12) };
  Object.values(shared).forEach((g) => (g.userData.shared = true));
  let park = null, envTex = null;
  function disposePark() {
    if (!park) return;
    scene.remove(park.group);
    park.group.traverse((o) => {
      if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
      const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of ms) { for (const k of ['map', 'emissiveMap', 'alphaMap']) if (m[k]) m[k].dispose(); m.dispose(); }
    });
    park = null;
  }
  function setPark(track, theme) {
    disposePark();
    const th = theme;
    // light and air
    skyU.top.value.set(th.sky.top); skyU.mid.value.set(th.sky.mid); skyU.hor.value.set(th.sky.hor); skyU.low.value.set(th.sky.low); skyU.sunCol.value.set(th.sky.sun); skyU.stars.value = th.sky.stars ?? 0.8;
    sunDir.set(...th.sunDir).normalize();
    scene.fog.color.set(th.fog[0]); scene.fog.near = th.fog[1]; scene.fog.far = th.fog[2];
    hemi.color.set(th.hemi[0]); hemi.groundColor.set(th.hemi[1]); hemi.intensity = th.hemi[2];
    sun.color.set(th.sunLight[0]); sun.intensity = th.sunLight[1];
    fill.color.set(th.fill?.[0] ?? 0x9ab8ff); fill.intensity = th.fill?.[1] ?? 0.6;
    renderer.toneMappingExposure = th.exposure ?? 1; bloom.strength = th.bloom ?? 0.7;
    const sh = th.shadow || { lr: 16, top: 12, bottom: -8 }; Object.assign(sun.shadow.camera, { left: -sh.lr, right: sh.lr, top: sh.top, bottom: sh.bottom, near: 1, far: 140 }); sun.shadow.camera.updateProjectionMatrix();
    if (envTex) envTex.dispose(); envTex = pmrem.fromScene(envScene, 0.03, 0.1, 200).texture; scene.environment = envTex;

    const group = new THREE.Group(); scene.add(group);
    const L = track.L, W = T.W, G = T.G, DK = T.DECK;
    const add = (o) => { group.add(o); return o; };
    const tex = (c, rep) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const UPV = new THREE.Vector3(0, 1, 0), tA = new THREE.Vector3(), tB = new THREE.Vector3(), tD = new THREE.Vector3();
    const stick = (mat, a, b, r, cast = false, parent = group) => { const m = new THREE.Mesh(shared.cyl, mat); tA.set(...a); tB.set(...b); tD.subVectors(tB, tA); const l = tD.length(); m.position.addVectors(tA, tB).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UPV, tD.multiplyScalar(1 / l)); m.scale.set(r, l, r); m.castShadow = cast; parent.add(m); return m; };
    const shadow = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

    // ramps: the riding profile extruded across the park
    const shp = new THREE.Shape(); shp.moveTo(-DK, G); shp.lineTo(-DK, track.topL); track.pts.forEach(([x, y]) => shp.lineTo(x, y)); shp.lineTo(L + DK, track.topR); shp.lineTo(L + DK, G); shp.lineTo(-DK, G);
    const pg = new THREE.ExtrudeGeometry(shp, { depth: W, bevelEnabled: false, curveSegments: 1 }); pg.translate(0, 0, -W / 2);
    const capTex = tex(th.cap(art), [1 / 10.24, 1 / 4.16]); capTex.offset.set(0, -G / 4.16);
    const capMat = std(Object.assign({ map: capTex, roughness: 0.8 }, th.capMat));
    const surfMat = std(Object.assign({ map: tex(th.surface(art), [0.3, 0.3]), roughness: 0.85 }, th.surfMat));
    const ramp = add(new THREE.Mesh(pg, [capMat, surfMat])); ramp.castShadow = ramp.receiveShadow = true;
    if (th.capMat?.alphaTest) ramp.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: capTex, alphaTest: 0.5 });
    // painted decals on the near side
    for (const [key, x, y, w] of track.decals) {
      const d = art.decals[key] || themeDecal(key); if (!d) continue;
      const m = add(new THREE.Mesh(new THREE.PlaneGeometry(w, w * d.h / d.w), std({ map: tex(d.canvas), transparent: true, alphaTest: 0.05, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, emissive: th.decalGlow ? 0xffffff : 0x000000, emissiveMap: th.decalGlow ? tex(d.canvas) : null, emissiveIntensity: th.decalGlow || 0 })));
      m.position.set(x, y, W / 2 + 0.012); m.receiveShadow = true;
    }
    // metal: coping on both quarter pipes and edges on sharp crests
    const metal = std({ color: 0xc4cadb, metalness: 1, roughness: 0.42 });
    for (const [x, y] of [[0, track.topL], [L, track.topR]]) { const cp = add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, W + 0.04, 20), th.copingMat ? std(th.copingMat) : metal)); cp.rotation.x = Math.PI / 2; cp.position.set(x, y, 0); cp.castShadow = true; }
    const edgeMat = std(th.edgeMat || { color: 0x8f95ad, metalness: 0.5, roughness: 0.55 });
    for (const [x, y] of track.edges) { const e = add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, W + 0.02), edgeMat)); e.position.set(x, y + 0.01, 0); }
    // railings on the end decks
    if (th.railing) {
      const rm = std(th.railing);
      for (const sd of [-1, 1]) {
        const top = sd < 0 ? track.topL : track.topR, x0 = sd < 0 ? -0.6 : L + 0.6, xo = sd < 0 ? -DK + 0.12 : L + DK - 0.12, zb = -W / 2 + 0.15;
        for (const x of [x0, (x0 + xo) / 2, xo]) stick(rm, [x, top, zb], [x, top + 1, zb], 0.035, true);
        for (const z of [-0.9, 0.9, W / 2 - 0.15]) stick(rm, [xo, top, z], [xo, top + 1, z], 0.035, true);
        stick(rm, [x0, top + 1, zb], [xo, top + 1, zb], 0.03, true); stick(rm, [x0, top + 0.5, zb], [xo, top + 0.5, zb], 0.025);
        stick(rm, [xo, top + 1, zb], [xo, top + 1, W / 2 - 0.15], 0.03, true); stick(rm, [xo, top + 0.5, zb], [xo, top + 0.5, W / 2 - 0.15], 0.025);
      }
    }
    // grind rails sit a little behind the riding line; the rider slides over to them
    const RAIL_Z = -1.35, yellow = std({ color: 0xf2b52e, metalness: 0.3, roughness: 0.4 });
    for (const r of track.rails) {
      if (r.kind === 'rail') {
        const bar = add(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, r.x1 - r.x0, 16), yellow)); bar.rotation.z = Math.PI / 2; bar.position.set((r.x0 + r.x1) / 2, r.y, RAIL_Z); bar.castShadow = true;
        for (const x of [r.x0 + 0.3, r.x1 - 0.3]) stick(yellow, [x, r.base ?? 0, RAIL_Z], [x, r.y, RAIL_Z], 0.03, true);
      } else if (r.kind === 'log') {
        const log = add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, r.x1 - r.x0 + 0.6, 18), std({ map: tex(themeArt('bark'), [1, 3]), roughness: 0.9 })));
        log.rotation.z = Math.PI / 2; log.position.set((r.x0 + r.x1) / 2, r.y - 0.2, RAIL_Z); shadow(log);
        const wood = std({ color: 0x4a2a12, roughness: 0.9 });
        for (const x of [r.x0 + 0.5, r.x1 - 0.5]) { stick(wood, [x - 0.25, G, RAIL_Z], [x, r.y - 0.25, RAIL_Z], 0.06, true); stick(wood, [x + 0.25, G, RAIL_Z], [x, r.y - 0.25, RAIL_Z], 0.06, true); }
      } else {
        const ledge = add(new THREE.Mesh(new THREE.BoxGeometry(r.x1 - r.x0, r.y - G, 0.6), std({ map: tex(art.concrete, [2, 0.4]), color: 0x8f86b0, roughness: 0.8 })));
        ledge.position.set((r.x0 + r.x1) / 2, (r.y + G) / 2, RAIL_Z); shadow(ledge);
        const cap = add(new THREE.Mesh(new THREE.BoxGeometry(r.x1 - r.x0, 0.05, 0.64), metal)); cap.position.set((r.x0 + r.x1) / 2, r.y, RAIL_Z);
      }
    }
    // fire rings on stands that stay out of the riding line
    const standMat = std({ color: 0x221a3c, metalness: 0.6, roughness: 0.45 });
    for (const r of track.rings) {
      const m = add(new THREE.Mesh(new THREE.TorusGeometry(r.r, 0.085, 20, 80), std({ color: 0x2a160e, metalness: 0.7, roughness: 0.35, emissive: 0xff5a14, emissiveIntensity: 1.6 })));
      if (r.axis === 'x') m.rotation.y = Math.PI / 2; else m.rotation.x = Math.PI / 2;
      m.position.set(r.x, r.y, 0);
      if (r.axis === 'x') { const zb = -W / 2 - 0.45; stick(standMat, [r.x, G, zb], [r.x, r.y, zb], 0.06); stick(standMat, [r.x, r.y, zb], [r.x, r.y, -r.r - 0.05], 0.045); }
    }
    // overlays along the riding surface: steel plates or neon edges
    for (const o of track.overlays) {
      const x0 = o.from, x1 = o.to ?? o.from + (o.len || 0);
      const seg = track.pts.filter(([x]) => x >= x0 - 1e-6 && x <= x1 + 1e-6);
      if (seg.length < 2) continue;
      if (o.kind === 'steel') {
        const pos = [], idx = [];
        seg.forEach(([x, y], i) => { pos.push(x, y + 0.02, -W / 2 + 0.05, x, y + 0.02, W / 2 - 0.05); if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } });
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
        const m = add(new THREE.Mesh(g, std({ color: 0x9aa3b8, metalness: 0.85, roughness: 0.35, side: THREE.DoubleSide }))); m.receiveShadow = true;
      } else if (o.kind === 'neon') {
        for (const [z, col] of [[W / 2 + 0.03, th.neon?.[0] ?? 0x2ad1ff], [-W / 2 - 0.03, th.neon?.[1] ?? 0xff4fa3]]) {
          const curve = new THREE.CatmullRomCurve3(seg.map(([x, y]) => new THREE.Vector3(x, y + 0.03, z)));
          add(new THREE.Mesh(new THREE.TubeGeometry(curve, seg.length * 2, 0.035, 6, false), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.8 })));
        }
      }
    }
    // ground
    const ground = add(new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), std({ map: tex(th.ground[1](art), [180, 180]), color: th.ground[0], roughness: 0.95 })));
    ground.rotation.x = -Math.PI / 2; ground.position.set(L / 2, G, 0); ground.receiveShadow = true;
    if (th.pad) { const pad = add(new THREE.Mesh(new THREE.PlaneGeometry(L + 30, 18), std({ map: tex(th.pad[1](art), [(L + 30) / 6, 3]), color: th.pad[0], roughness: 0.9 }))); pad.rotation.x = -Math.PI / 2; pad.position.set(L / 2, G + 0.005, -1); pad.receiveShadow = true; }

    const ctx = { THREE, group, track, art, add, tex, std, stick, shadow, shared, W, G, L, emitters: [], fx };
    const decor = th.build(ctx) || {};
    park = { group, track, theme: th, update: decor.update, onTrick: decor.onTrick, emitters: ctx.emitters };
    const sy = track.groundAt(track.spawnX).y; menuRing.position.set(track.spawnX, sy + 0.03, 0);
    cam.init = false;
  }

  /* camera */
  const cam = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), init: false };
  const tp = new THREE.Vector3(), tt = new THREE.Vector3();
  let time = 0, lead = 0, camY = 1.5, zoom = 0;
  function follow(r, dt) {
    const tr = park.track, sp = r.inAir ? r.vx : r.v * (tr.at(r.s).tx || 0);
    lead += ((Math.max(-3, Math.min(3, sp * 0.3))) - lead) * Math.min(1, dt * 1.5);
    const ground = tr.groundAt(Math.max(0.5, Math.min(tr.L - 0.5, r.x))).y, air = r.inAir ? Math.max(0, r.y - Math.min(ground, r.y) - 1) : 0;
    // in the air aim between the rider and the ground below, so both stay in the picture
    const cy = r.inAir ? Math.max((r.y + Math.min(ground, r.y)) / 2 + 1.2, r.y - 5) : Math.max(r.y * 0.6 + 1.4, r.y - 1.0);
    const zt = Math.min(tr.cam.zoomMax, air * 0.7) + Math.min(2, Math.abs(sp) * 0.12);
    if (!cam.init) { camY = cy; zoom = zt; lead = 0; }
    camY += (cy - camY) * Math.min(1, dt * 3);
    zoom += (zt - zoom) * Math.min(1, dt * 2);
    const x = r.x + lead;
    tp.set(x - 2.4, camY + 2.6 + zoom * 0.35, tr.cam.dist + zoom); tt.set(x + 0.4, camY + 0.3, -0.3);
  }
  function applyCam(dt) { const a = cam.init && dt > 0 ? 1 - Math.exp(-dt * 4) : 1; cam.pos.lerp(tp, a); cam.tgt.lerp(tt, a); cam.init = true; camera.position.copy(cam.pos); camera.lookAt(cam.tgt); }

  /* per frame */
  let riderZ = 0; const turboV = new THREE.Vector3();
  function update(dt, opts) {
    time += dt;
    const { mode, rider, model, frame } = opts, tr = park.track;
    if (mode === 'play' && rider) follow(rider, dt);
    else if (mode === 'menu') { const x = tr.spawnX, y = tr.groundAt(x).y; tp.set(x + 2.7, y + 1.15, 6.6); tt.set(x - 0.1, y + 0.32, 0); }
    else { const h = tr.yMax, x = tr.L / 2 + tr.L * 0.45 * Math.sin(time * 0.035); tp.set(x - 4, h * 0.45 + 6.2, 17 + h * 0.75); tt.set(x + 2, h * 0.3 + 1.6, -1); }
    applyCam(dt);
    menuRing.visible = mode === 'menu';
    if (model && frame) {
      let zt = 0;
      if (rider) for (const r of tr.rails) { if (rider.mode === 'grind' && rider.rail === r) zt = -1.35; else if (rider.inAir && rider.x > r.x0 - 1.2 && rider.x < r.x1 + 0.2 && rider.y > r.y - 0.1 && rider.vy < 0.5) zt = -1.35; }
      riderZ += (zt - riderZ) * Math.min(1, dt * 7);
      model.update({ pos: [frame.pos[0], frame.pos[1], frame.pos[2] + riderZ], f: frame.f, u: frame.u, s: frame.s }, opts.pose, opts.RS, opts.wheel, dt);
      if (rider && rider.turboOn) { const p = turboV.set(-0.34, 0.1, 0).applyMatrix4(model.root.matrix); for (let i = 0; i < 3; i++) sparks.spawn([p.x, p.y, p.z], [-frame.f[0] * 4 + R3(1), -frame.f[1] * 4 + R3(1), R3(1)], 0.22 + Math.random() * 0.18, 0.32, 0.5, [2.2, 0.9, 0.25]); }
      if (rider && rider.mode === 'grind') for (let i = 0; i < 2; i++) sparks.spawn([rider.x, rider.y, riderZ], [-rider.v * 0.3 + R3(2), 1 + Math.random() * 2.5, R3(1.5)], 0.3 + Math.random() * 0.3, 0.06, -9.8, [3, 2.3, 1.0]);
    }
    // the sun's shadow box follows the action
    const fx = mode === 'play' && rider ? rider.x : mode === 'menu' ? tr.spawnX : cam.tgt.x, fy = mode === 'play' && rider ? rider.y * 0.6 : mode === 'menu' ? tr.groundAt(tr.spawnX).y : cam.tgt.y * 0.5;
    sun.target.position.set(fx, fy, 0); sun.position.copy(sun.target.position).addScaledVector(sunDir, 60);
    // fire on every ring, torches and other theme fires
    flameAcc += dt * 190 * tr.rings.length;
    while (flameAcc > 1) { flameAcc--; const r = tr.rings[(Math.random() * tr.rings.length) | 0], a = Math.random() * Math.PI * 2, rr = r.r + R3(0.12);
      const p = r.axis === 'x' ? [r.x + R3(0.1), r.y + rr * Math.sin(a), rr * Math.cos(a)] : [r.x + rr * Math.cos(a), r.y + R3(0.1), rr * Math.sin(a)];
      flames.spawn(p, [R3(0.3), 1.1 + Math.random() * 1.3, R3(0.3)], 0.45 + Math.random() * 0.45, 0.38 + Math.random() * 0.3, 0.8); }
    if (park.emitters.length) { emitAcc += dt * 40 * park.emitters.length; while (emitAcc > 1) { emitAcc--; const e = park.emitters[(Math.random() * park.emitters.length) | 0]; flames.spawn([e[0] + R3(0.15), e[1], e[2] + R3(0.15)], [R3(0.2), 0.8 + Math.random() * 0.8, R3(0.2)], 0.35 + Math.random() * 0.3, e[3] || 0.3, 0.6); } }
    flames.step(dt); sparks.step(dt);
    const near = tr.rings.map((r, i) => [Math.abs(r.x - cam.tgt.x) + Math.abs(r.y - cam.tgt.y) * 0.5, i]).sort((a, b) => a[0] - b[0]);
    ringLights.forEach((l, k) => { const r = tr.rings[near[k % near.length][1]]; l.position.set(r.x, r.y, 0.3); l.intensity = 22 + 6 * Math.sin(time * 23 + k) + 4 * Math.sin(time * 37 + k * 2); });
    if (park.update) park.update(dt, time, cam.tgt);
    composer.render(dt);
  }
  function fx(type, d) {
    const th = park && park.theme;
    if (type === 'takeoff') for (let i = 0; i < (d.big ? 36 : 14); i++) sparks.spawn([d.x, d.y, R3(0.6)], [R3(4), 1.5 + Math.random() * 4, R3(2.5)], 0.35 + Math.random() * 0.35, 0.07, -9.8, [3, 2.4, 1.2]);
    if (type === 'land') { const c = th?.dust || [0.35, 0.3, 0.45]; for (let i = 0; i < (th?.dust ? 34 : 18); i++) sparks.spawn([d.x, d.y + 0.05, R3(0.8)], [R3(3), 0.5 + Math.random() * 1.2, R3(2)], 0.4 + Math.random() * 0.5, th?.dust ? 0.55 : 0.3, -1, c); }
    if (type === 'ring') for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2; sparks.spawn([d.x, d.y, 0], [Math.cos(a) * 4, Math.sin(a) * 4, R3(3)], 0.5 + Math.random() * 0.4, 0.12, -3, [3, 1.6, 0.4]); }
    if (type === 'crash') for (let i = 0; i < 30; i++) sparks.spawn([d.x, d.y + 0.6, 0], [R3(5), Math.random() * 4, R3(3)], 0.6, 0.12, -6, [2.6, 2.4, 0.8]);
    if (type === 'firework') { const cols = [[3, 0.6, 2], [0.5, 2.6, 3], [3, 2.6, 0.5], [0.8, 3, 1]], c = cols[(Math.random() * cols.length) | 0];
      for (let i = 0; i < 90; i++) { const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), s = 6 + Math.random() * 2; sparks.spawn([d.x, d.y, d.z], [Math.sin(b) * Math.cos(a) * s, Math.cos(b) * s, Math.sin(b) * Math.sin(a) * s], 1.1 + Math.random() * 0.5, 0.35, -3, c); } }
    if (type === 'firework-flash') { const tr = park.track; sparks.spawn([-30 + Math.random() * (tr.L + 60), T.G + 1.5 + Math.random() * 6, -13 - Math.random() * 8], [0, 0, 0], 0.12, 0.5, 0, [4, 4, 4]); }
    if (type === 'trick' && park.onTrick) park.onTrick(d);
  }
  const pv = new THREE.Vector3();
  function project(p) { pv.set(p[0], p[1], p[2] + riderZ).project(camera); return { x: (pv.x + 1) / 2 * W2, y: (1 - pv.y) / 2 * H2 }; }
  return { scene, camera, renderer, resize, setPark, update, fx, project, snapNext: () => { cam.init = false; }, setQuality, get quality() { return quality; }, get track() { return park && park.track; } };
}

import { RIDERS, VEHICLES, PARKS } from './data.js';
import { buildTrack } from './track.js';
import { Rider } from './physics.js';
import { makeArt } from './art.js';
import { createWorld } from './world.js';
import { THEMES } from './parks.js';
import { createRiderModel } from './riderModel.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { flameScreen } from './results.js';
import { createReading, createParent, GATE_DEFAULTS, fmtTime } from './reading.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = 'plaminkovy-skatepark-v1';
const store = (() => { const d = { total: 0, best: {}, rider: 'vojta', vehicle: 'modra', park: 'mesto', music: true, sfx: true, voice: true, tutorial: false };
  try { return Object.assign(d, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) { return d; } })();
store.gate = Object.assign({}, GATE_DEFAULTS, store.gate || {});
let saveT = 0; const save = (now) => { if (!now && performance.now() - saveT < 1500) return; saveT = performance.now(); try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {} };
const RS = 1.25, fmt = (n) => n.toLocaleString('cs-CZ');
const flamesWord = (n) => (n === 1 ? 'plamínek' : n >= 2 && n <= 4 ? 'plamínky' : 'plamínků');

// updates: look for a new version on every start and whenever the app comes back to the screen,
// then switch to it right away (or after the ride, so a run is never cut off)
let updateReady = false;
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const hadSW = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => {
    reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadSW || updateReady) return; updateReady = true;
    let riding = false; try { riding = screen === 'play'; } catch (_) {}
    if (!riding) location.reload();
  });
}

// fonts must be ready before the graffiti is painted
await Promise.race([Promise.all([document.fonts.load('80px Bungee'), document.fonts.load('40px "Lilita One"')]).catch(() => {}), new Promise((r) => setTimeout(r, 2500))]);

const art = makeArt();
const tracks = {};
const trackOf = (id) => tracks[id] || (tracks[id] = buildTrack(id));
if (!THEMES[store.park]) store.park = 'mesto';
let track = trackOf(store.park);
let world;
try { world = createWorld($('#gl'), art); world.setPark(track, THEMES[store.park]); }
catch (e) { $('#boot').textContent = 'Tenhle prohlížeč neumí 3D grafiku. Zkus Safari nebo Chrome.'; throw e; }
const audio = createAudio(store);
const input = createInput($('#hud'));
const hud = $('#hud');

/* ---------- 3D rider model ---------- */
let model = null, modelKey = '';
function ensureModel(r, v) { const k = r.id + '/' + v.id; if (k === modelKey) return; model && model.dispose(); model = createRiderModel(world.scene, r, v); modelKey = k; }
const riderDef = () => RIDERS.find((r) => r.id === store.rider) || RIDERS[0];
const vehDef = () => VEHICLES.find((v) => v.id === store.vehicle) || VEHICLES[0];
const vehLocked = (v) => store.total < v.unlock;

/* ---------- screens ---------- */
let screen = 'boot';
const SCREENS = { title: '#sTitle', rider: '#sRider', vehicle: '#sVehicle', park: '#sPark', results: '#sResults', read: '#sRead' };
function show(name) {
  screen = name;
  if (updateReady && name !== 'play') { location.reload(); return; }
  if (name !== 'read' && reading) reading.stop();
  for (const [k, sel] of Object.entries(SCREENS)) $(sel).hidden = k !== name;
  hud.hidden = name !== 'play' && name !== 'results';
  $$('.tot').forEach((e) => (e.textContent = fmt(store.total)));
  $('#totalTitle').textContent = fmt(store.total); $('#totalTitle').nextElementSibling.textContent = flamesWord(store.total) + ' celkem';
  if (name === 'rider') renderRider();
  if (name === 'vehicle') renderVehicle();
  if (name === 'park') renderParks();
  if (name === 'title') renderTitleTime();
  world.snapNext();
}
const click = () => audio.click();

// title
$$('.toggle').forEach((b) => { const k = b.dataset.set; b.setAttribute('aria-pressed', !!store[k]); b.onclick = () => { audio.init(); store[k] = !store[k]; b.setAttribute('aria-pressed', store[k]); audio.apply(); save(true); click(); }; });
$('#play').onclick = () => { audio.init(); click(); if (reading.needRead()) return goRead(); audio.say('Vyber si panáčka'); show('rider'); };
function renderTitleTime() {
  const g = store.gate, el = $('#titleTime'); el.hidden = !g.on;
  el.querySelector('span').textContent = g.left > 0 ? `Čas na hraní ${fmtTime(g.left)}` : 'Teď je čas na čtení';
}

/* ---------- reading between rides ---------- */
let reading = null;
reading = createReading({ store, save, audio, onPlay: () => startRide(), onMenu: () => show('title') });
const parent = createParent({ store, save, audio, onChange: () => { renderTitleTime(); updateClock(); } });
$('#parentBtn').onclick = () => { click(); parent.open(); };
function goRead() { $('#readGain').textContent = `+${store.gate.minutes} min`; show('read'); reading.start(); audio.say('Čas na čtení'); }
const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
$('#install').hidden = standalone || !/iPhone|iPad|iPod/.test(navigator.userAgent);

// 1. rider
let rIdx = Math.max(0, RIDERS.findIndex((r) => r.id === store.rider));
function dots(el, list, idx, locked) { el.innerHTML = list.map((x, i) => `<i class="${i === idx ? 'on' : locked(x) ? 'lk' : ''}"></i>`).join(''); }
function renderRider() {
  const r = RIDERS[rIdx], s = $('#sRider');
  ensureModel(r, vehDef());
  dots($('.dots', s), RIDERS, rIdx, (x) => !!x.lock);
  $('.name', s).textContent = r.lock ? '???' : r.name;
  const d = $('.desc', s); d.textContent = r.lock ? r.lock : r.desc; d.classList.toggle('lock', !!r.lock);
  $('.next', s).disabled = !!r.lock;
}
$$('#sRider .nav').forEach((b) => (b.onclick = () => { rIdx = (rIdx + +b.dataset.dir + RIDERS.length) % RIDERS.length; click(); renderRider(); if (!RIDERS[rIdx].lock) audio.say(RIDERS[rIdx].name); }));
$('#sRider .next').onclick = () => { store.rider = RIDERS[rIdx].id; save(true); click(); audio.say('Vyber si kolo nebo koloběžku'); show('vehicle'); };
$('#sRider .back').onclick = () => { click(); show('title'); };

// 2. vehicle
let vIdx = Math.max(0, VEHICLES.findIndex((v) => v.id === store.vehicle));
const flameIcons = (n) => Array.from({ length: 5 }, (_, i) => `<svg viewBox="0 0 40 52" class="${i < n ? '' : 'off'}"><use href="#flame"/></svg>`).join('');
function renderVehicle() {
  const v = VEHICLES[vIdx], s = $('#sVehicle');
  ensureModel(riderDef(), v);
  dots($('.dots', s), VEHICLES, vIdx, vehLocked);
  $('.name', s).textContent = v.name;
  $('.stats', s).innerHTML = `<span>Rychlost</span><span class="bar">${flameIcons(v.speed)}</span><span>Skok</span><span class="bar">${flameIcons(v.jump)}</span><span>Točení</span><span class="bar">${flameIcons(v.spin)}</span>`;
  const d = $('.desc', s), lk = vehLocked(v);
  d.textContent = lk ? `Odemkneš za ${fmt(v.unlock)} plamínků. Máš ${fmt(store.total)}.` : v.type === 'bmx' ? 'BMX kolo' : 'Koloběžka';
  d.classList.toggle('lock', lk);
  $('.next', s).disabled = lk;
}
$$('#sVehicle .nav').forEach((b) => (b.onclick = () => { vIdx = (vIdx + +b.dataset.dir + VEHICLES.length) % VEHICLES.length; click(); renderVehicle(); if (!vehLocked(VEHICLES[vIdx])) audio.say(VEHICLES[vIdx].name); }));
$('#sVehicle .next').onclick = () => { store.vehicle = VEHICLES[vIdx].id; save(true); click(); audio.say('Vyber si hřiště'); show('park'); };
$('#sVehicle .back').onclick = () => { click(); show('rider'); };

// 3. park
const PARK_ART = {
  mesto: '<rect width="160" height="100" fill="url(#pkS)"/><g fill="#24163f"><rect x="6" y="38" width="16" height="40"/><rect x="26" y="26" width="14" height="52"/><rect x="44" y="44" width="18" height="34"/><rect x="104" y="30" width="16" height="48"/><rect x="124" y="40" width="22" height="38"/></g><g fill="#ffcf78"><rect x="10" y="44" width="3" height="3"/><rect x="30" y="34" width="3" height="3"/><rect x="34" y="50" width="3" height="3"/><rect x="108" y="38" width="3" height="3"/><rect x="128" y="48" width="3" height="3"/></g><path d="M0 100V70h20q24 0 30 30zM160 100V70h-20q-24 0-30 30z" fill="#b9add6"/><circle cx="80" cy="62" r="10" fill="none" stroke="#ff8a1f" stroke-width="3"/>',
  plaz: '<rect width="160" height="100" fill="url(#pkS)"/><circle cx="120" cy="34" r="14" fill="#fff3a0"/><rect y="64" width="160" height="14" fill="#2ab7e8"/><rect y="78" width="160" height="22" fill="#f4d58a"/><path d="M34 80q-2-26 4-40" stroke="#6b3d1f" stroke-width="4" fill="none"/><path d="M38 40q-16-2-22 8M38 40q14-6 22 4M38 40q-4-12-14-14M38 40q8-12 18-10" stroke="#2f9a3a" stroke-width="5" fill="none" stroke-linecap="round"/>',
  fmx: '<rect width="160" height="100" fill="url(#pkS)"/><path d="M0 70h30l6-26h34l6 26h84v30H0z" fill="#b8552e"/><path d="M36 44h34" stroke="#e07a4a" stroke-width="3"/><path d="M0 100V84q30-14 52 0 8-16 22-16h10q20 0 34 16 22-10 42 0v16z" fill="#d9944e"/><path d="M60 68l18 16" stroke="#9aa3b8" stroke-width="5"/><circle cx="104" cy="52" r="10" fill="none" stroke="#ff8a1f" stroke-width="3"/><path d="M128 84V62m0 8h-6v-6m6 10h6v-8" stroke="#3f8a4a" stroke-width="4" fill="none" stroke-linecap="round"/>',
  mega: '<rect width="160" height="100" fill="url(#pkS)"/><g fill="#fff"><circle cx="18" cy="12" r="1.2"/><circle cx="70" cy="8" r="1"/><circle cx="150" cy="16" r="1.2"/></g><path d="M8 18h16v82H8z" fill="#2a2d45"/><path d="M24 18q10 0 16 30t22 40h-8" fill="none" stroke="#2ad1ff" stroke-width="3"/><path d="M8 18h16" stroke="#ff4fa3" stroke-width="3"/><path d="M62 88q10-14 24-14h10q12 0 18 14" fill="none" stroke="#2ad1ff" stroke-width="3"/><path d="M132 100q0-40 20-40" fill="none" stroke="#ff4fa3" stroke-width="3"/><circle cx="86" cy="44" r="11" fill="none" stroke="#ff8a1f" stroke-width="3"/><path d="M0 100V92h160v8z" fill="#1a1c2e"/><g fill="#ffd23f"><circle cx="40" cy="94" r="1.5"/><circle cx="60" cy="95" r="1.5"/><circle cx="100" cy="94" r="1.5"/><circle cx="120" cy="95" r="1.5"/></g>',
  sopka: '<rect width="160" height="100" fill="url(#pkS)"/><path d="M20 100 66 34h28l46 66z" fill="#3a1a22"/><path d="M66 34h28l-6 10-8-4-8 6z" fill="#ff5a14"/><path d="M80 34q-6-14 4-26q-2 12 8 18" fill="#ff8a1f"/><path d="M72 46q4 20-6 54" stroke="#ff3b2e" stroke-width="3" fill="none"/>',
  led: '<rect width="160" height="100" fill="url(#pkS)"/><path d="M0 100 46 30l30 40 24-28 60 58z" fill="#e8f6ff"/><path d="M46 30l-10 16 10-4 8 6zM100 42l-8 12 8-3 7 5z" fill="#fff"/><path d="M0 100 46 30l30 40" fill="none" stroke="#8fc8ec" stroke-width="2"/>',
  dzungle: '<rect width="160" height="100" fill="url(#pkS)"/><path d="M0 100V60q20-20 40 0t40 0 40 0 40 0v40z" fill="#1f7a3a"/><path d="M96 70q8-24 30-24 12 0 14 10-6 6-16 4l-6 10z" fill="#3fbf4a"/><circle cx="128" cy="52" r="2" fill="#123"/><path d="M110 46l4-8 4 7 4-8 3 9" fill="#ffe14d"/>',
  mesic: '<rect width="160" height="100" fill="url(#pkS)"/><g fill="#fff"><circle cx="20" cy="18" r="1.4"/><circle cx="60" cy="10" r="1"/><circle cx="140" cy="22" r="1.4"/><circle cx="100" cy="8" r="1"/></g><circle cx="128" cy="30" r="12" fill="#3a8be8"/><path d="M0 100V72q80-16 160 0v28z" fill="#9a98b8"/><ellipse cx="50" cy="84" rx="12" ry="4" fill="#77759a"/><ellipse cx="112" cy="88" rx="8" ry="3" fill="#77759a"/>',
};
function setPark(id) {
  if (!THEMES[id] || (id === store.park && world.track === trackOf(id))) return;
  store.park = id; save(true); track = trackOf(id); world.setPark(track, THEMES[id]);
}
function renderParks() {
  $('#parks').innerHTML = PARKS.map((p) => `<div class="park ${p.open ? '' : 'locked'} ${p.id === store.park ? 'on' : ''}" data-id="${p.id}" ${p.open ? 'role="button" tabindex="0"' : ''}><svg class="art" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="pkS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs>${PARK_ART[p.id]}</svg>${p.open ? (store.best[p.id] ? `<span class="prec">Rekord ${fmt(store.best[p.id].pts)}</span>` : '') : '<div class="lk"><svg viewBox="0 0 24 24"><use href="#lock"/></svg>Brzy</div>'}<h4>${p.name}</h4></div>`).join('');
  $$('#parks .park').forEach((el) => {
    const p = PARKS.find((q) => q.id === el.dataset.id); if (!p.open) return;
    el.onclick = () => { click(); setPark(p.id); renderParks(); audio.say(p.name); };
    el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') el.onclick(); };
  });
}
$('#sPark .next').onclick = () => { click(); startRide(); };
$('#sPark .back').onclick = () => { click(); show('vehicle'); };

/* ---------- riding ---------- */
let sim = null, session = null, paused = false;
const num = $('#num');
let timeUpT = -1, lastSec = -1;
function startRide() {
  if (reading.needRead()) return goRead();
  timeUpT = -1; updateClock();
  ensureModel(riderDef(), vehDef());
  sim = new Rider(track, vehDef(), onEvent);
  session = { flames: 0, shown: 0, best: { pts: 0, title: '' }, startTotal: store.total };
  num.textContent = '0'; unitEl.textContent = flamesWord(0); $('#best').textContent = fmt((store.best[store.park] || {}).pts || 0);
  input.clear(); paused = false;
  show('play'); world.snapNext();
  audio.init(); audio.hush();
  tutorial.start();
}
const unitEl = $('#counter .unit');
function setCount() { num.textContent = fmt(session.shown); unitEl.textContent = flamesWord(session.shown); num.classList.remove('bump'); void num.offsetWidth; num.classList.add('bump'); }
function pop(el) { el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
function tag(text, p, cls = '') { const t = $('#tag'); t.className = 'tag ' + cls; t.textContent = text; t.style.setProperty('--x', p.x + 'px'); t.style.setProperty('--y', p.y + 'px'); pop(t); }
function fly(from, to, add, delay) {
  const ses = session, el = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); el.setAttribute('viewBox', '0 0 40 52'); el.setAttribute('class', 'fly'); el.innerHTML = '<use href="#flame"/>'; hud.appendChild(el);
  const mx = from.x + (to.x - from.x) * 0.35 + (Math.random() - 0.5) * 80, my = Math.min(from.y, to.y) - 40 - Math.random() * 50;
  const an = el.animate([{ transform: `translate(${from.x}px,${from.y}px) scale(.4)`, opacity: 0 }, { transform: `translate(${mx}px,${my}px) scale(1.25)`, opacity: 1, offset: 0.4 }, { transform: `translate(${to.x}px,${to.y}px) scale(.7)`, opacity: 1 }], { duration: 650 + Math.random() * 200, delay, easing: 'ease-in', fill: 'backwards' });
  an.onfinish = () => { el.remove(); if (ses === session) { session.shown += add; setCount(); audio.coin(); } };
}
function onEvent(type, d) {
  if (type === 'takeoff') { world.fx('takeoff', d); audio.takeoff(d.big); tutorial.event('takeoff'); }
  else if (type === 'land') { world.fx('land', d); audio.land(d.hard); }
  else if (type === 'ring') { world.fx('ring', d); audio.ring(); tag('+4 KRUH', world.project([d.x, d.y + 1.2, 0])); }
  else if (type === 'spin') audio.spin();
  else if (type === 'style') audio.style();
  else if (type === 'turbo') audio.turbo();
  else if (type === 'crash') { world.fx('crash', d); audio.crash(); tag('BUM!', world.project([d.x, d.y + 1.5, 0]), 'bum'); }
  else if (type === 'trick') scored(d);
}
function scored(d) {
  session.flames += d.pts; store.total += d.pts; save();
  $('#ttlO').textContent = $('#ttlF').textContent = d.title;
  const sub = $('#sub'); sub.textContent = d.ring ? (d.ring > 1 ? `+ ${d.ring} OHNIVÉ KRUHY` : '+ OHNIVÝ KRUH') : ''; sub.hidden = !d.ring;
  $('#ptsT').textContent = d.mult > 1 ? `(${d.parts.join(' + ')}) × ${d.mult} = ${d.pts}` : d.parts.length > 1 ? `${d.parts.join(' + ')} = ${d.pts}` : `${d.pts}`;
  const c = $('#callout'); c.classList.toggle('small', !!d.small); pop(c);
  const from = world.project([sim.x, sim.y + 1, 0]), a = $('#counter svg').getBoundingClientRect(), to = { x: a.left + a.width / 2, y: a.top + a.height / 2 };
  const n = Math.min(12, d.pts); let left = d.pts; for (let i = 0; i < n; i++) { const k = Math.round(left / (n - i)); left -= k; fly(from, to, k, i * 55); }
  if (d.pts > session.best.pts) session.best = { pts: d.pts, title: d.title };
  const best = store.best[store.park] || { pts: 0 };
  if (d.pts > best.pts && d.pts >= 5) {
    store.best[store.park] = { pts: d.pts, title: d.title }; save(true); $('#best').textContent = fmt(d.pts);
    pop($('#rec')); audio.fanfare(true);
  } else audio.fanfare(d.pts >= 30);
  world.fx('trick', d);
  if (/SALTO|FLAIR/.test(d.title)) tutorial.event('flip');
}
$('#done').onclick = () => { if (screen !== 'play') return; click(); endRide(); };
function endRide() {
  if (screen !== 'play') return;
  save(true); input.clear();
  const unlocked = VEHICLES.filter((v) => v.unlock > session.startTotal && v.unlock <= store.total);
  show('results'); tutorial.stop();
  const tot = $('#resTotal');
  flameScreen($('#flameCanvas'), session.flames, (e) => (tot.textContent = fmt(Math.round(session.flames * e))));
  $('#resBest').innerHTML = session.best.pts ? `Nejlepší trik: <b>${session.best.title}</b> za ${fmt(session.best.pts)}` : 'Příště zkus skočit a udělat salto!';
  $('#resAll').innerHTML = `Celkem máš <b>${fmt(store.total)}</b> ${flamesWord(store.total)}`;
  const need = reading.needRead(); $('#resTime').hidden = !need; $('#resAgain span').textContent = need ? 'ČTENÍ' : 'JET ZNOVU';
  const u = $('#resUnlock'); u.hidden = !unlocked.length; u.textContent = unlocked.length ? `Odemčeno: ${unlocked.map((v) => v.name).join(', ')}!` : '';
}
$('#resAgain').onclick = () => { click(); startRide(); };
$('#resMenu').onclick = () => { click(); show('title'); };

/* ---------- first-ride hints ---------- */
const tutorial = (() => {
  const steps = [
    { text: 'Drž šipku a jeď!', key: 'right', done: () => sim && sim.speed > 5 },
    { text: 'Na rampě zmáčkni SKOK!', key: 'jump', ev: 'takeoff' },
    { text: 'Ve vzduchu drž šipku a toč salto!', key: 'left', ev: 'flip' },
  ];
  let i = -1, on = false;
  const el = $('#hint');
  function place() {
    if (!on || i < 0 || i >= steps.length) { el.hidden = true; return; }
    const b = input.btns[steps[i].key].getBoundingClientRect(); el.hidden = false; el.textContent = steps[i].text;
    const w = el.offsetWidth, x = Math.max(8, Math.min(innerWidth - w - 8, b.left + b.width / 2 - w / 2));
    el.style.left = x + 'px'; el.style.top = (b.top - el.offsetHeight - 22) + 'px'; el.style.setProperty('--ax', (b.left + b.width / 2 - x) + 'px');
  }
  return {
    start() { on = !store.tutorial; i = on ? 0 : -1; place(); },
    stop() { on = false; place(); },
    event(e) { if (on && steps[i] && steps[i].ev === e) this.next(); },
    next() { i++; if (i >= steps.length) { on = false; store.tutorial = true; save(true); } place(); },
    frame() { if (on && steps[i] && steps[i].done && steps[i].done()) this.next(); },
    place,
  };
})();
addEventListener('resize', () => tutorial.place());

/* ---------- loop ---------- */
const canvas = $('#gl');
function resize() { world.resize(innerWidth, innerHeight, window.devicePixelRatio || 1); }
addEventListener('resize', resize); resize();
document.addEventListener('visibilitychange', () => (document.hidden ? audio.suspend() : audio.resume()));
let last = performance.now(), clock = 0, slow = 0;
const portrait = matchMedia('(orientation: portrait) and (max-width: 900px)');
// iOS may drop the 3D context after a long time in the background: start fresh
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); save(true); });
canvas.addEventListener('webglcontextrestored', () => location.reload());
const idlePose = { crouch: 0.15, whip: 0, bar: 0, sm: 0, nh: 0, feetUp: 0 };
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
  let opts;
  if (portrait.matches) { requestAnimationFrame(frame); return; } // the rotate-phone screen is up
  if (screen === 'play') {
    // keep 60 fps: step the resolution down if frames keep running long
    slow = dt > 1 / 45 ? slow + dt : Math.max(0, slow - dt * 0.5);
    if (slow > 2.5 && world.quality > 0.6) { world.setQuality(world.quality > 0.85 ? 0.8 : 0.62); slow = 0; }
  }
  if ((screen === 'play' || screen === 'results') && sim) {
    if (screen === 'play' && !paused) {
      const inp = input.read(), sub = Math.max(1, Math.ceil(dt / (1 / 120)));
      for (let i = 0; i < sub; i++) sim.step(dt / sub, i === 0 ? inp : { x: inp.x, jumpPressed: false, actionPressed: false });
      audio.rolling(sim.speed, sim.mode === 'ground', sim.mode === 'grind');
      hudFrame(); tutorial.frame(); playClock(dt);
    } else audio.rolling(0, false, false);
    model.root.visible = true;
    opts = { mode: 'play', rider: sim, model, frame: sim.frame(), pose: { crouch: sim.crouch, ...sim.pose }, RS, wheel: sim.wheel };
  } else if (screen === 'rider' || screen === 'vehicle') {
    model.root.visible = true;
    const a = clock * 0.55 + 0.6, f = [Math.cos(a), 0, Math.sin(a)];
    opts = { mode: 'menu', model, frame: { pos: [track.spawnX, track.groundAt(track.spawnX).y, 0], f, u: [0, 1, 0], s: [-f[2], 0, f[0]] }, pose: { ...idlePose, crouch: 0.15 + 0.04 * Math.sin(clock * 2.2) }, RS, wheel: 0 };
  } else { if (model) model.root.visible = false; opts = { mode: 'title' }; }
  world.update(dt, opts);
  requestAnimationFrame(frame);
}
// play time: counts only while riding, survives restarts of the app
const clockEl = $('#clock'), clockT = $('#clockT');
function updateClock() {
  const g = store.gate; clockEl.hidden = !g.on; if (!g.on) return;
  clockT.textContent = fmtTime(g.left); clockEl.classList.toggle('low', g.left <= 30);
}
function playClock(dt) {
  const g = store.gate;
  if (timeUpT >= 0) {
    // time is up: let him land the trick, then end the ride
    timeUpT += dt;
    if ((timeUpT > 1.2 && sim.mode === 'ground') || timeUpT > 6) endRide();
    return;
  }
  if (!g.on) return;
  g.left = Math.max(0, g.left - dt);
  const sec = Math.ceil(g.left);
  if (sec !== lastSec) {
    lastSec = sec; updateClock(); save();
    if (sec <= 10 && sec > 0) audio.tick();
  }
  if (g.left <= 0) { save(true); timeUpT = 0; pop($('#tu')); audio.fanfare(false); }
}
const liveEl = $('#live'); let lastCd = '', lastAir = null;
function hudFrame() {
  if (sim.inAir !== lastAir) { lastAir = sim.inAir; hud.classList.toggle('air', sim.inAir); }
  const cd = (sim.turboT > 0 ? sim.turboT / 3 : Math.min(1, 1 - Math.max(0, sim.turboCD) / 3)).toFixed(2);
  if (cd !== lastCd) { lastCd = cd; input.btns.action.style.setProperty('--cd', cd); }
  let live = '';
  if (sim.inAir && sim.air) {
    const n = Math.floor(Math.abs(sim.air.R) / (Math.PI * 2) + 0.15), sp = sim.air.spins + (sim.air.spinT > 0.5 ? 1 : 0), parts = [];
    if (n) parts.push(sim.air.vert && n === 1 ? 'FLAIR' : `SALTO ${n}×`); if (sp) parts.push(sp > 1 ? `VÝVRTKA ${sp}×` : 'VÝVRTKA');
    sim.air.styles.forEach((s) => parts.push(s === 'tailwhip' ? 'TAILWHIP' : s === 'barspin' ? 'BARSPIN' : s === 'superman' ? 'SUPERMAN' : 'BEZ RUKOU'));
    live = parts.join(' + ');
  }
  if (liveEl.textContent !== live) liveEl.textContent = live;
}

show('title');
$('#boot').style.opacity = 0; setTimeout(() => $('#boot').remove(), 450);
requestAnimationFrame((t) => { last = t; frame(t); });
window.__game = { store, get track() { return track; }, setPark, world, get sim() { return sim; }, show, startRide, endRide, onEvent };

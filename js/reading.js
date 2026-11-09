// Reading gate: after the play time runs out, Vojta reads a short story and answers
// one question. A right answer gives a new block of play time; a wrong one gives a new story.
// Nothing here is spoken aloud, so the reading can't be skipped by listening.
import { TEXTS } from './texts.js';

const $ = (s) => document.querySelector(s);
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const countWords = (s) => s.split(/\s+/).filter(Boolean).length;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const BONUS = 20;
export const GATE_DEFAULTS = { v: 2, on: true, minutes: 2, left: 120, level: 1, streak: 0, miss: 0, recent: [], passed: [], reads: 0, ok: 0 };
export const fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function createReading({ store, save, audio, onPlay, onMenu }) {
  const g = store.gate;
  const body = $('#readBody'), next = $('#readNext'), label = $('#readNext span'), dots = $('#readDots'), foot = $('#sRead .foot'), head = $('#readHead');
  let cur = null, page = 0, phase = 'off', timer = 0, q = null, locked = false;

  function pick() {
    const lv = TEXTS.filter((t) => t.level === g.level);
    let pool = lv.filter((t) => !g.recent.includes(t.id) && !g.passed.includes(t.id));
    if (!pool.length) { g.passed = g.passed.filter((id) => !lv.some((t) => t.id === id)); pool = lv.filter((t) => !g.recent.includes(t.id)); }
    if (!pool.length) pool = lv;
    const t = pool[Math.floor(Math.random() * pool.length)];
    g.recent = [t.id, ...g.recent.filter((x) => x !== t.id)].slice(0, 6);
    save(true);
    return t;
  }

  function start() {
    cur = pick(); page = 0; renderPage();
  }

  function renderPage() {
    phase = 'text'; clearInterval(timer);
    head.textContent = 'Přečti si příběh';
    const para = cur.p[page];
    const sents = para.match(/[^.!?]+[.!?]+/g) || [para];
    body.className = 'rbody text';
    body.innerHTML = `<p>${sents.map((s) => `<span class="s">${esc(s.trim())}</span>`).join(' ')}</p>`;
    dots.innerHTML = cur.p.length > 1 ? cur.p.map((_, i) => `<i class="${i === page ? 'on' : i < page ? 'done' : ''}"></i>`).join('') : '';
    foot.hidden = false;
    label.textContent = page < cur.p.length - 1 ? 'DÁL' : 'HOTOVO';
    // the button wakes up after a calm reading time, so tapping straight through doesn't work
    const need = Math.max(5, countWords(para) * 0.6) * 1000, t0 = performance.now();
    next.classList.add('wait'); next.style.setProperty('--p', 0);
    timer = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / need);
      next.style.setProperty('--p', p.toFixed(3));
      if (p >= 1) { clearInterval(timer); next.classList.remove('wait'); }
    }, 100);
  }

  // tap a sentence to light it up: helps keep the place while reading
  body.addEventListener('click', (e) => {
    const s = e.target.closest('.s'); if (!s || phase !== 'text') return;
    const on = s.classList.contains('hl'); body.querySelectorAll('.s.hl').forEach((x) => x.classList.remove('hl')); if (!on) s.classList.add('hl');
  });

  next.addEventListener('click', () => {
    if (phase !== 'text' || next.classList.contains('wait')) return;
    audio.click();
    if (page < cur.p.length - 1) { page++; renderPage(); } else ask();
  });

  function ask() {
    phase = 'q'; locked = false; clearInterval(timer);
    q = cur.qs[Math.floor(Math.random() * cur.qs.length)];
    head.textContent = 'Otázka';
    foot.hidden = true;
    body.className = 'rbody quiz';
    body.innerHTML = `<p class="qq">${esc(q.q)}</p><div class="opts">${shuffle([q.a, ...q.o]).map((o) => `<button class="opt" type="button" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    body.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => choose(b)));
  }

  function choose(b) {
    if (locked) return; locked = true;
    const ok = b.dataset.v === q.a;
    g.reads++;
    body.querySelectorAll('.opt').forEach((x) => { x.disabled = true; if (x.dataset.v === q.a) x.classList.add(ok ? 'good' : 'right'); });
    if (ok) {
      b.classList.add('good');
      g.ok++; g.streak++; g.miss = 0;
      if (g.streak >= 3 && g.level < 3) { g.level++; g.streak = 0; }
      if (!g.passed.includes(cur.id)) g.passed.push(cur.id);
      g.left = g.minutes * 60; store.total += BONUS;
      audio.fanfare(true);
    } else {
      b.classList.add('bad');
      g.streak = 0; g.miss++;
      if (g.miss >= 2 && g.level > 1) { g.level--; g.miss = 0; }
      audio.oops();
    }
    save(true);
    setTimeout(() => (ok ? win() : lose()), ok ? 900 : 1300);
  }

  function win() {
    phase = 'win'; head.textContent = 'Super čtení!';
    body.className = 'rbody end';
    body.innerHTML = `<p class="big good">SPRÁVNĚ!</p>
      <p class="gain"><span><b>+${g.minutes}</b> ${g.minutes >= 5 ? 'minut' : 'minuty'} hraní</span><span><svg viewBox="0 0 40 52"><use href="#flame"/></svg><b>+${BONUS}</b> plamínků</span></p>
      <div class="row"><button class="ghost" type="button" data-a="menu">Menu</button><button class="big-arrow fire" type="button" data-a="play"><span>JEDEME!</span></button></div>`;
    body.querySelector('[data-a=menu]').onclick = () => { audio.click(); onMenu(); };
    body.querySelector('[data-a=play]').onclick = () => { audio.click(); onPlay(); };
  }

  function lose() {
    phase = 'lose'; head.textContent = 'Skoro!';
    body.className = 'rbody end';
    body.innerHTML = `<p class="big">Tohle nebylo ono.</p><p>Správně bylo: <b>${esc(q.a)}</b></p><p>Zkusíme jiný krátký příběh.</p>
      <div class="row"><button class="big-arrow" type="button" data-a="again"><span>DALŠÍ PŘÍBĚH</span></button></div>`;
    body.querySelector('[data-a=again]').onclick = () => { audio.click(); start(); };
  }

  return {
    start,
    stop() { clearInterval(timer); phase = 'off'; },
    needRead: () => !!g.on && g.left <= 0,
  };
}

// Parent settings behind a sum a 7-year-old can't do yet.
export function createParent({ store, save, audio, onChange }) {
  const g = store.gate, box = $('#parent'), gate = $('#pGate'), panel = $('#pPanel'), inp = $('#pIn');
  let ans = 0;
  function open() {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4); ans = a * b;
    $('#pQ').textContent = `${a} × ${b}`; inp.value = ''; $('#pErr').hidden = true;
    gate.hidden = false; panel.hidden = true; box.hidden = false;
  }
  function render() {
    $('#pOn').setAttribute('aria-pressed', !!g.on);
    $$('#pMin button').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.m === g.minutes));
    $('#pStats').innerHTML = `Přečteno <b>${g.reads}</b> ${g.reads === 1 ? 'příběh' : g.reads >= 2 && g.reads <= 4 ? 'příběhy' : 'příběhů'}, správně <b>${g.ok}</b>. Úroveň čtení: <b>${g.level}</b> ze 3. Zbývá hraní: <b>${fmtTime(g.left)}</b>.`;
  }
  const $$ = (s) => [...document.querySelectorAll(s)];
  $('#pOk').onclick = () => {
    if (parseInt(inp.value, 10) === ans) { inp.blur(); gate.hidden = true; panel.hidden = false; render(); audio.click(); }
    else { $('#pErr').hidden = false; inp.value = ''; }
  };
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#pOk').click(); });
  $('#pCancel').onclick = $('#pClose').onclick = () => { inp.blur(); box.hidden = true; onChange(); };
  $('#pOn').onclick = () => { g.on = !g.on; if (g.on && g.left > g.minutes * 60) g.left = g.minutes * 60; save(true); render(); };
  $$('#pMin button').forEach((b) => (b.onclick = () => { g.minutes = +b.dataset.m; g.left = Math.min(g.left, g.minutes * 60); save(true); render(); }));
  $('#pGive').onclick = () => { g.left = g.minutes * 60; save(true); render(); };
  return { open };
}

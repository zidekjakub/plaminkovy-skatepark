// Every sound is synthesised, so the game needs no audio files and works offline.
export function createAudio(settings) {
  let ctx = null, master, sfxBus, musicBus, noise, rollG, rollF, grindG, grindF, seqTimer = null, step = 0, nextT = 0;
  const S = settings;
  function init() {
    if (ctx) { ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = S.sfx ? 1 : 0; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = S.music ? 0.32 : 0; musicBus.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const loop = (filterType, f) => { const src = ctx.createBufferSource(); src.buffer = noise; src.loop = true; const flt = ctx.createBiquadFilter(); flt.type = filterType; flt.frequency.value = f; const g = ctx.createGain(); g.gain.value = 0; src.connect(flt).connect(g).connect(sfxBus); src.start(); return [g, flt]; };
    [rollG, rollF] = loop('bandpass', 400); rollF.Q.value = 0.8;
    [grindG, grindF] = loop('bandpass', 3200); grindF.Q.value = 6;
    startMusic();
  }
  const now = () => ctx.currentTime;
  function tone(type, f0, f1, dur, vol, when = 0, bus = sfxBus) {
    if (!ctx) return; const t = now() + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function hiss(f0, f1, dur, vol, type = 'bandpass', q = 1, when = 0, bus = sfxBus) {
    if (!ctx) return; const t = now() + when, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(bus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function rolling(speed, grounded, grinding) {
    if (!ctx) return; const t = now();
    rollG.gain.setTargetAtTime(grounded ? Math.min(0.22, speed * 0.018) : 0, t, 0.05); rollF.frequency.setTargetAtTime(250 + speed * 45, t, 0.05);
    grindG.gain.setTargetAtTime(grinding ? 0.12 : 0, t, 0.03);
  }
  // music: a short, upbeat loop in A minor (Am F C G)
  const chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function startMusic() {
    if (seqTimer) return; nextT = now() + 0.1; step = 0;
    seqTimer = setInterval(() => {
      if (!ctx) return;
      const sp = 60 / 124 / 4;
      while (nextT < now() + 0.15) { schedule(step, nextT); nextT += sp; step = (step + 1) % 64; }
    }, 30);
  }
  function schedule(i, t) {
    const when = t - now(), bar = Math.floor(i / 16), b = i % 16, ch = chords[bar];
    if (b % 4 === 0) tone('sine', 140, 45, 0.22, 0.55, when, musicBus);
    if (b === 4 || b === 12) hiss(1800, 900, 0.16, 0.22, 'bandpass', 0.7, when, musicBus);
    if (b % 2 === 1) hiss(8000, 7000, 0.04, 0.08, 'highpass', 0.5, when, musicBus);
    if (b % 2 === 0) tone('sawtooth', mtof(ch[0] - 24), mtof(ch[0] - 24), 0.2, 0.11, when, musicBus);
    const arp = [0, 1, 2, 1, 0, 2, 1, 2][b % 8]; if (b % 2 === 0) tone('square', mtof(ch[arp] + 12), mtof(ch[arp] + 12), 0.12, 0.035, when, musicBus);
  }
  let lastCoin = 0, voice = null;
  function pickVoice() { const vs = speechSynthesis.getVoices(); voice = vs.find((v) => /^cs/i.test(v.lang)) || null; }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  return {
    init,
    rolling,
    takeoff: (big) => hiss(600, 2400, big ? 0.4 : 0.25, big ? 0.3 : 0.18),
    land: (hard) => { tone('sine', hard ? 110 : 150, 45, 0.18, 0.5); hiss(900, 200, 0.12, 0.2, 'lowpass'); },
    ring: () => { hiss(300, 3000, 0.5, 0.35); tone('triangle', 660, 1320, 0.3, 0.12); },
    coin: () => { if (!ctx || now() - lastCoin < 0.045) return; lastCoin = now(); const f = 1300 + Math.random() * 300; tone('square', f, f * 1.5, 0.08, 0.06); },
    fanfare: (big) => { [0, 4, 7, 12].forEach((n, i) => tone('triangle', mtof(72 + n), mtof(72 + n), 0.18, 0.16, i * 0.07)); if (big) [0, 4, 7, 12, 16].forEach((n, i) => tone('square', mtof(79 + n), mtof(79 + n), 0.2, 0.06, 0.3 + i * 0.06)); },
    spin: () => hiss(1200, 3500, 0.3, 0.14),
    style: () => tone('triangle', 500, 900, 0.15, 0.12),
    crash: () => { hiss(600, 80, 0.5, 0.45, 'lowpass'); tone('sine', 400, 60, 0.6, 0.35); },
    turbo: () => { tone('sawtooth', 70, 260, 0.9, 0.14); hiss(400, 2500, 0.9, 0.18); },
    click: () => tone('triangle', 880, 1200, 0.07, 0.12),
    say(text) { if (!S.voice || !voice || !('speechSynthesis' in window)) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.voice = voice; u.lang = voice.lang; u.rate = 1.12; u.pitch = 1.15; speechSynthesis.speak(u); } catch (_) {} },
    apply() { if (!ctx) return; sfxBus.gain.value = S.sfx ? 1 : 0; musicBus.gain.value = S.music ? 0.32 : 0; },
    suspend() { ctx?.suspend?.(); }, resume() { ctx?.resume?.(); },
  };
}

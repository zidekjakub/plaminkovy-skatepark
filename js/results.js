// Vojta's idea: all flames from the ride pour onto the screen. The more there
// are, the smaller each one gets, until they are only dots.
import { flamePath } from './art.js';

export function flameScreen(canvas, count, onProgress) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
  const N = Math.min(count, 6000);
  if (!N) { onProgress && onProgress(1); return () => {}; }
  let s = Math.sqrt((w * h) / N), cols = Math.max(1, Math.floor(w / s)), rows = Math.ceil(N / cols);
  while (rows * s > h || cols * s > w) { s *= 0.97; cols = Math.max(1, Math.floor(w / s)); rows = Math.ceil(N / cols); }
  const ox = (w - cols * s) / 2;
  // one pre-drawn flame, stamped many times
  const spr = document.createElement('canvas'), ss = Math.max(4, Math.round(s * dpr));
  spr.width = spr.height = ss;
  { const q = spr.getContext('2d');
    if (s > 12) {
      const gr = q.createLinearGradient(0, ss, 0, 0); gr.addColorStop(0, '#ff3b2e'); gr.addColorStop(0.55, '#ff8a1f'); gr.addColorStop(1, '#ffe14d');
      flamePath(q, ss / 2, ss / 2, ss * 0.42); q.fillStyle = gr; q.fill();
      if (s > 26) { q.lineWidth = ss * 0.04; q.strokeStyle = '#2a0d05'; q.stroke(); flamePath(q, ss / 2, ss * 0.62, ss * 0.18); q.fillStyle = '#fff3a0'; q.fill(); }
    } else { q.fillStyle = '#ff9a1f'; q.beginPath(); q.arc(ss / 2, ss / 2, ss * 0.34, 0, 7); q.fill(); }
  }
  const dur = Math.min(3.2, 1.2 + N / 600) * 1000;
  let drawn = 0, raf = 0;
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 2), k = Math.floor(N * e);
    for (let i = drawn; i < k; i++) {
      const row = Math.floor(i / cols), inRow = Math.min(cols, N - row * cols), shift = (cols - inRow) * s / 2;
      const col = row % 2 ? inRow - 1 - (i % cols) : i % cols;
      g.drawImage(spr, ox + shift + col * s, h - (row + 1) * s, s, s);
    }
    drawn = k;
    onProgress && onProgress(e);
    if (p < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

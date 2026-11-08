// Four big buttons for two thumbs, plus keyboard and game controller.
// A thumb can slide between ◀ and ▶ without lifting.
export function createInput(root) {
  const holds = { left: 0, right: 0, jump: 0, action: 0 };
  const edge = { jump: false, action: false };
  const keyHolds = { left: false, right: false, jump: false, action: false };
  const btns = {}; root.querySelectorAll('[data-k]').forEach((b) => (btns[b.dataset.k] = b));
  const pointers = new Map();
  const press = (k) => { holds[k]++; if (holds[k] === 1 && k in edge) edge[k] = true; btns[k]?.classList.add('on'); };
  const release = (k) => { holds[k] = Math.max(0, holds[k] - 1); if (!holds[k] && !keyHolds[k]) btns[k]?.classList.remove('on'); };
  const keyAt = (x, y) => { const el = document.elementFromPoint(x, y); const b = el && el.closest && el.closest('[data-k]'); return b && root.contains(b) ? b.dataset.k : null; };
  root.addEventListener('pointerdown', (e) => { const k = keyAt(e.clientX, e.clientY); if (!k) return; e.preventDefault(); pointers.set(e.pointerId, k); press(k); try { root.setPointerCapture(e.pointerId); } catch (_) {} });
  root.addEventListener('pointermove', (e) => { const k = pointers.get(e.pointerId); if (!k) return; const k2 = keyAt(e.clientX, e.clientY); if (k2 && k2 !== k && (k === 'left' || k === 'right') && (k2 === 'left' || k2 === 'right')) { release(k); press(k2); pointers.set(e.pointerId, k2); } });
  const up = (e) => { const k = pointers.get(e.pointerId); if (!k) return; pointers.delete(e.pointerId); release(k); };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up); root.addEventListener('lostpointercapture', up);
  const KEYS = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyX: 'action', ShiftLeft: 'action', ShiftRight: 'action', ArrowDown: 'action', KeyS: 'action' };
  addEventListener('keydown', (e) => { const k = KEYS[e.code]; if (!k) return; e.preventDefault(); if (keyHolds[k]) return; keyHolds[k] = true; if (k in edge) edge[k] = true; btns[k]?.classList.add('on'); });
  addEventListener('keyup', (e) => { const k = KEYS[e.code]; if (!k) return; keyHolds[k] = false; if (!holds[k]) btns[k]?.classList.remove('on'); });
  const pad = { jump: false, action: false };
  function read() {
    let x = (holds.right || keyHolds.right ? 1 : 0) - (holds.left || keyHolds.left ? 1 : 0);
    const gp = navigator.getGamepads ? [...navigator.getGamepads()].find((g) => g) : null;
    if (gp) {
      const ax = gp.axes[0] || 0; if (Math.abs(ax) > 0.4) x = Math.sign(ax);
      if (gp.buttons[14]?.pressed) x = -1; if (gp.buttons[15]?.pressed) x = 1;
      const j = !!(gp.buttons[0]?.pressed), a = !!(gp.buttons[2]?.pressed || gp.buttons[1]?.pressed);
      if (j && !pad.jump) edge.jump = true; if (a && !pad.action) edge.action = true; pad.jump = j; pad.action = a;
    }
    const r = { x, jumpPressed: edge.jump, actionPressed: edge.action };
    edge.jump = edge.action = false;
    return r;
  }
  function clear() { for (const k in holds) holds[k] = 0; for (const k in keyHolds) keyHolds[k] = false; pointers.clear(); edge.jump = edge.action = false; Object.values(btns).forEach((b) => b.classList.remove('on')); }
  return { read, clear, btns };
}

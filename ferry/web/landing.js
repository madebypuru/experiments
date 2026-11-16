// Hero ticket: one live crossing, drawn by the approved engine (../print/ticket.js) and redrawn as it advances.
// The engine is not edited: the crossing state's dot position (Ticket.STATES.crossing.p) is set before each draw.
// ?t=<seconds> freezes the cycle at that second for screenshots. prefers-reduced-motion shows one still frame.
(() => {
  const CROSS = 14, HOLD = 6, CYCLE = CROSS + HOLD;   // placeholder: a 14 s crossing, matching the median in the copy
  const STEP = 500;                                   // redraw every half second
  const box = document.getElementById('ticket');
  const q = new URLSearchParams(location.search);
  const frozen = q.has('t') ? Math.max(0, parseFloat(q.get('t')) || 0) : null;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const base = { from: 'SOL', to: 'ETH', fromName: 'Solana', toName: 'Ethereum', seed: 7, ground: 'painting' };
  const clock = (s) => { const d = new Date(Date.UTC(2026, 10, 12, 14, 22, 5) + s * 1000); return d.toISOString().slice(11, 19); };

  let layout;
  function measure() {
    const vw = innerWidth, vh = box.parentElement.clientHeight, phone = vw <= 720;
    const size = phone ? 84 : 120, W = Ticket.width(size);
    const m = phone ? 20 : 64;
    const scale = phone ? Math.min(1, (vw - 2 * m) / W) : Math.min(1, Math.max(.7, (vw * .32) / W));
    const w = W * scale, h = size * scale;
    const x = phone ? (vw - w) / 2 : vw - m - w;
    const y = vh - (phone ? 40 : 72) - h;
    layout = { size, scale, x, y, w, h };
    Object.assign(box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
  }

  function draw(t) {
    const c = ((t % CYCLE) + CYCLE) % CYCLE, run = 0;   // one crossing per cycle, departing at 14:22:05
    let o;
    if (c < CROSS) {
      Ticket.STATES.crossing.p = Math.min(.96, .04 + .92 * (c / CROSS));
      o = { ...base, state: 'crossing', departs: layout.size === 120 ? clock(run) : clock(run).slice(0, 5) };
    } else {
      o = { ...base, state: 'arrived', departs: clock(run), arrives: clock(CROSS), arrivesExact: clock(CROSS), elapsed: CROSS + 's' };
    }
    box.textContent = '';
    Ticket.draw(box, { ...o, size: layout.size, scale: layout.scale, x: 0, y: 0 });
  }

  Ticket.ready.then(() => {
    measure();
    if (frozen !== null || still) { draw(frozen !== null ? frozen : 9); document.title += ' '; return; }
    const t0 = performance.now();
    const tick = () => draw((performance.now() - t0) / 1000);
    tick(); setInterval(tick, STEP);
    addEventListener('resize', () => { measure(); tick(); });
  });
})();

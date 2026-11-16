/* Ferry pattern engine, v3: one horizontal bar is the unit; the mark is what bars make when they meet.

   The mark, sliced at its step lines (measured from src/butterfly-mark.svg, left half, in channels c = 15.48 mark units).
   Each row is one bar per half; x runs from the half's outer edge (0) to its inner end; the inner end at 4.83c is the nose.
     row  height  outer  inner
     1    0.76    0      2.30
     2    1.51    0      3.60
     3    0.42    0      4.83
     4    2.78    1.57   4.83   (the notch on the outer side)
     5    0.48    0      4.83
     6    2.10    0      3.60
     7    1.15    0      2.30
   Half 4.83c wide, mark 9.20c tall, channel 1c, mark 10.66c wide. Bar-end corner radius 0.21c (convex corners only).
   A tread (the length step for the progression) is 1.25c.

   API
     Pattern.draw(target, opts, t = 0) -> Promise       one frame at time t (seconds)
     Pattern.play(target, opts)        -> stop()        loops; pauses when off screen or tab hidden; still under
                                                        prefers-reduced-motion; ?t=<seconds> in the page URL freezes a frame
     target: a <canvas>, or any sized element (a canvas is made to fill it).

   opts (all optional)
     scale       px per c                                    default 12
     columns     number of mark columns, or 'auto' to cover   default 'auto'
     rows        marks per column, or 'auto'                  default 'auto'
     columnGap   gap between columns, in c (>= 1)             default 3.5  (sets how far outer ends may grow: the
                                                                           channel c is always kept between columns)
     markGap     gap between marks down a column, in c        default 2.2
     offset      0 or 0.5: odd columns shift by half a mark   default 0.5
     originX/Y   px position of mark (0,0)'s top left         default: centred (auto) or block centred (counts)
     looseness   0 resolved .. 1 every bar at its loose length (outer end +-1..2 treads, seeded)   default 0
     colours     { figure, ground }                           default Harbour on Paper
     motion      'arrive' | 'tide' | 'swap' | 'none'          default 'none'
     duration    loop seconds                                 default arrive 10, tide 12, swap 8
     stagger     seconds the wave takes to cross the frame    default arrive 1.4, tide 0.35 x duration, swap 0.12 x duration
     seed        integer                                      default 1
     mask        image URL: the figure shows the image        default none
     maskBox     {x,y,w,h} px the image covers                default the whole canvas
     drift       image drift, fraction of width each way      default 0 (30 s loop)
     part        'bar' | 'pair' | 'mark': draw only that much of mark (0,0)   default the whole field
*/
(function (root) {
  const C = 15.48, T = 1.25, R = 3.29 / C, GAPMAX = 0.16;
  const Y = [0.52, 12.28, 35.71, 42.15, 85.22, 92.69, 125.13, 142.93].map(v => (v - 0.52) / C);
  const ROWS = [[0, 35.60], [0, 55.78], [0, 74.76], [24.26, 74.76], [0, 74.76], [0, 55.78], [0, 35.60]]
    .map(([o, i], k) => ({ o: o / C, i: i / C, y0: Y[k], y1: Y[k + 1] }));
  const HALF = 74.76 / C, MW = HALF * 2 + 1, MH = Y[7];
  const TAU = Math.PI * 2;
  const mod = (n, m) => ((n % m) + m) % m;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = x => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x)); // calm in-out, no overshoot
  function rand(seed, ...k) {
    let h = (Math.imul(seed | 0, 2654435761) ^ 0x5bd1e995) >>> 0;
    for (const v of k) { h = Math.imul(h ^ ((v | 0) + 0x9e3779b9), 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; }
    return (h >>> 0) / 4294967296;
  }
  const DUR = { arrive: 10, tide: 12, swap: 8, none: 30 };
  function norm(o) {
    const m = o.motion || 'none', d = o.duration || DUR[m];
    return {
      scale: 12, columns: 'auto', rows: 'auto', columnGap: 3.5, markGap: 2.2, offset: 0.5, looseness: 0, seed: 1, drift: 0,
      ...o, motion: m, duration: d,
      stagger: o.stagger ?? (m === 'arrive' ? 1.4 : m === 'tide' ? 0.35 * d : 0.12 * d),
      colours: { figure: '#2C454B', ground: '#F2EEE6', ...(o.colours || {}) },
    };
  }

  // Marks placed on the grid: top-left px of each mark, with its column/row index.
  function marks(o, W, H) {
    const s = o.scale, px = (MW + o.columnGap) * s, py = (MH + o.markGap) * s, out = [];
    const cnum = o.columns !== 'auto', rnum = o.rows !== 'auto';
    const ox = o.originX ?? (cnum ? (W - (o.columns * px - o.columnGap * s)) / 2 : (W - MW * s) / 2);
    const oy = o.originY ?? (rnum ? (H - (o.rows * py - o.markGap * s) - (o.columns > 1 ? o.offset * py : 0)) / 2 : (H - MH * s) / 2);
    const i0 = cnum ? 0 : Math.floor(-ox / px) - 1, i1 = cnum ? o.columns - 1 : Math.ceil((W - ox) / px);
    for (let i = i0; i <= i1; i++) {
      const sh = mod(i, 2) * o.offset * py;
      const j0 = rnum ? 0 : Math.floor((-oy - sh) / py) - 1, j1 = rnum ? o.rows - 1 : Math.ceil((H - oy - sh) / py);
      for (let j = j0; j <= j1; j++) out.push({ i, j, x: ox + i * px, y: oy + sh + j * py });
    }
    return out;
  }

  // Every bar at time t, in px, with per-corner radii [tl, tr, br, bl].
  function bars(o, W, H, t) {
    const s = o.scale, D = o.duration, cg = o.columnGap, out = [];
    const maxOut = Math.max(0, (cg - 1) / 2);           // outer ends may grow this far and still leave c between columns
    for (const mk of marks(o, W, H)) {
      if (o.part && (mk.i !== 0 || mk.j !== 0)) continue;
      for (const side of [-1, 1]) {
        if (o.part === 'bar' && side === 1) continue;
        const L = [];
        for (let k = 0; k < 7; k++) {
          const r = ROWS[k];
          if ((o.part === 'bar' || o.part === 'pair') && k !== 3) { L.push(null); continue; }
          const nose = k >= 2 && k <= 4, kk = nose ? 3 : k, rr = ROWS[kk];
          const cy = (mk.y + (rr.y0 + rr.y1) / 2 * s) / H, cx = (mk.x + (MW / 2 + side * HALF / 2) * s) / W;
          const delay = o.stagger * (0.75 * clamp(cy) + 0.25 * clamp(cx));
          const q = rand(o.seed, mk.i, mk.j, kk, side);
          const amp = q < 0.45 ? 1 : q < 0.7 ? 2 : -1;     // treads: grow 1 or 2, or shorten 1
          let ext = amp * o.looseness, slide = 0, m = o.looseness;
          if (o.motion === 'tide') {
            const w = mod((t - delay) / D + 0.5, 1), b = w < 0.5 ? Math.sin(Math.PI * w / 0.5) ** 2 : 0;
            ext += amp * b; m = Math.max(m, b);
          } else if (o.motion === 'arrive') {
            const a = mod((t - delay) / D, 1);
            const u = a < 0.3 ? 1 - ease(a / 0.3) : a < 0.65 ? 0 : a < 0.92 ? ease((a - 0.65) / 0.27) : 1;
            slide = u * (r.i + cg / 2 + 0.2); m = Math.max(m, u);
          }
          let a0 = clamp(ROWS[3].o - ext * T, -maxOut, r.i - 0.6 * T), a1 = r.i;   // outer end moves; inner end holds
          if (!nose) a0 = clamp(r.o - ext * T, -maxOut, r.i - 0.6 * T);
          else if (k !== 3) a0 = Math.min(r.o - Math.min(ext, 0) * T, a0); // the nose rows close the notch before they pass it
          a0 -= slide; a1 -= slide;
          const cut = a0 < -cg / 2; if (cut) a0 = -cg / 2;
          const inset = m * GAPMAX / 2, iTop = k === 3 || k === 4 ? 0 : inset, iBot = k === 2 || k === 3 ? 0 : inset; // the nose block stays whole
          L.push(a1 - a0 > 0.02 ? { a0, a1, y0: r.y0 + iTop, y1: r.y1 - iBot, cut, iTop, iBot } : null);
        }
        for (let k = 0; k < 7; k++) {
          const b = L[k]; if (!b) continue;
          const p = L[k - 1], n = L[k + 1], e = 1e-3, gapP = !p || b.iTop > e, gapN = !n || b.iBot > e;
          const rad = Math.min(R, (b.y1 - b.y0) / 2, (b.a1 - b.a0) / 2) * s;
          const oT = !b.cut && (gapP || p.a0 > b.a0 + e) ? rad : 0, iT = (gapP || p.a1 < b.a1 - e) ? rad : 0;
          const oB = !b.cut && (gapN || n.a0 > b.a0 + e) ? rad : 0, iB = (gapN || n.a1 < b.a1 - e) ? rad : 0;
          const y = mk.y + b.y0 * s, h = (b.y1 - b.y0) * s, w = (b.a1 - b.a0) * s;
          if (side < 0) out.push({ x: mk.x + b.a0 * s, y, w, h, r: [oT, iT, iB, oB] });
          else out.push({ x: mk.x + (MW - b.a1) * s, y, w, h, r: [iT, oT, oB, iB] });
        }
      }
    }
    return out;
  }

  // Swap: bands down the frame, each wiped left to right into the inverse, then wiped back; a wave of bands.
  function swapRegion(o, W, H, t) {
    const D = o.duration, s = mod(t / D + 0.2975, 1), hb = (MH + o.markGap) * o.scale / 4, n = Math.ceil(H / hb), P = new Path2D();
    let any = false;
    for (let b = 0; b < n; b++) {
      const bd = (b / n) * o.stagger / D;
      const x1 = W * ease((s - bd) / 0.35), x2 = W * ease((s - 0.5 - bd) / 0.35);
      if (x1 - x2 > 0.5) { P.rect(x2, b * hb, x1 - x2, hb + 0.5); any = true; }
    }
    return any ? P : null;
  }

  const imgs = {};
  const load = url => imgs[url] || (imgs[url] = new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; }));

  function canvasFor(target) {
    let cv = target;
    if (!(target instanceof HTMLCanvasElement)) {
      cv = target.querySelector('canvas.ferry-pattern');
      if (!cv) { cv = document.createElement('canvas'); cv.className = 'ferry-pattern'; cv.style.cssText = 'display:block;width:100%;height:100%'; target.appendChild(cv); }
    }
    const W = cv.clientWidth || target.clientWidth || cv.width, H = cv.clientHeight || target.clientHeight || cv.height, d = root.devicePixelRatio || 1;
    if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
    const ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
    return { ctx, W, H };
  }

  function render(target, o, t, img) {
    const { ctx, W, H } = canvasFor(target);
    const P = new Path2D();
    for (const b of bars(o, W, H, t)) P.roundRect(b.x, b.y, b.w, b.h, b.r);
    const paintImg = () => {
      const bx = o.maskBox || { x: 0, y: 0, w: W, h: H }, dr = o.drift || 0;
      const k = Math.max(bx.w / img.width, bx.h / img.height) * (1 + 2 * dr), dw = img.width * k, dh = img.height * k;
      const dx = dr * bx.w * Math.sin(TAU * t / 30);
      ctx.drawImage(img, bx.x + (bx.w - dw) / 2 + dx, bx.y + (bx.h - dh) / 2, dw, dh);
    };
    const fill = which => { if (which === 'figure' && img) paintImg(); else { ctx.fillStyle = o.colours[which]; ctx.fillRect(0, 0, W, H); } };
    const layer = (gnd, fig, region) => {
      ctx.save(); if (region) ctx.clip(region);
      fill(gnd); ctx.clip(P); fill(fig); ctx.restore();
    };
    ctx.clearRect(0, 0, W, H);
    layer('ground', 'figure');
    if (o.motion === 'swap') { const reg = swapRegion(o, W, H, t); if (reg) layer('figure', 'ground', reg); }
  }

  async function draw(target, opts = {}, t = 0) {
    const o = norm(opts), img = o.mask ? await load(o.mask) : null;
    render(target, o, t, img);
  }

  function play(target, opts = {}) {
    const o = norm(opts), q = new URLSearchParams(location.search);
    const fixed = q.has('t') ? +q.get('t') : opts.t ?? null;
    const still = root.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, alive = true, visible = true, t = 0, last = null, img = null;
    const ready = (o.mask ? load(o.mask) : Promise.resolve(null)).then(i => { img = i; });
    if (fixed !== null || still) { ready.then(() => render(target, still && fixed === null ? { ...o, motion: 'none' } : o, fixed ?? 0, img)); return () => {}; }
    const io = root.IntersectionObserver ? new IntersectionObserver(es => { visible = es[0].isIntersecting; last = null; }) : null;
    if (io) io.observe(target);
    const tick = now => {
      if (!alive) return;
      const on = visible && !document.hidden;
      if (on && last !== null) t += Math.min(0.1, (now - last) / 1000);
      last = on ? now : null;
      if (on) render(target, o, t, img);
      raf = requestAnimationFrame(tick);
    };
    ready.then(() => { if (alive) raf = requestAnimationFrame(tick); });
    return () => { alive = false; cancelAnimationFrame(raf); if (io) io.disconnect(); };
  }

  root.Pattern = { draw, play, bars, marks, ROWS, MARK: { width: MW, height: MH, half: HALF, tread: T, radius: R, channel: 1 } };
})(window);

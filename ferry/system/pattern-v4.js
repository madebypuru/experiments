/* Ferry pattern engine, v4: straits. The unit is one horizontal bar; bars meet in facing pairs across the channel.

   The field is ruled rows of shore bars running the full width. In every row the channel is exactly 1c wide; its
   position steps from row to row by whole treads, in long straight runs, so down the field each channel becomes a
   strait wandering between two shores. Row heights follow the mark's riser rhythm 0.76, 1.51, 3.68, 2.10, 1.15 (c).
   A land between two straits is two bars meeting at its midline: the right shore of one strait, the left shore of
   the next. Channel-facing ends carry the mark's corner radius 0.21c. A tread is 1.25c.
   Measured from src/butterfly-mark.svg (c = 15.48 units). The mark itself is drawn only with layout: 'mark'.

   API
     Pattern.draw(target, opts, t = 0) -> Promise       one frame at time t (seconds)
     Pattern.play(target, opts)        -> stop()        loops; pauses when off screen or tab hidden; still under
                                                        prefers-reduced-motion; ?t=<seconds> in the page URL freezes a frame
     target: a <canvas>, or any sized element (a canvas is made to fill it).

   opts (all optional)
     scale       px per c                                          default 12
     straits     number of straits across, or 'auto' (one per ~40c of width)   default 'auto'
     wander      how far a strait may stray from its course, in treads         default 3
     rowGap      ruled gap between rows, in c                       default 0.15
     rhythm      'shuffle' (seeded order of the risers each cycle) | 'mark' (in the mark's order)   default 'shuffle'
     bands       scale multipliers, top to bottom, e.g. [1, 1.5, 2]; equal-height bands, hard seams   default [1]
     rotate      0 | 90 (vertical shores, horizontal channels)     default 0
     area        {x,y,w,h} px: draw the field only in this box      default the whole canvas
     rows        number of rows, or 'auto'                          default 'auto'
     originY     px offset of the first row                         default 0
     margin      c: if set, the outer shore ends stop this far inside the edges (and are rounded)   default none
     walk        explicit channel offsets in treads, [[strait 0 per row], ...]   default seeded
     part        'bar' | 'pair': only the first bar, or the first facing pair     default the whole field
     colours     { figure, ground } (ground may be 'transparent')   default Harbour on Paper
     motion      'arrive' | 'tide' | 'swap' | 'none'               default 'none'
     duration    loop seconds                                       default arrive 10, tide 12, swap 8
     stagger     seconds the wave takes to cross the field          default arrive 1.4, tide 0.4 x duration, swap 0.12 x duration
     seed        integer                                            default 1
     mask        image URL: the figure shows the image              default none
     maskBox     {x,y,w,h} px the image covers                      default the whole canvas
     drift       image drift, fraction of width each way            default 0 (30 s loop)
     layout      'field' | 'mark' (the mark once, at originX/originY, height 9.2c x scale)   default 'field'
*/
(function (root) {
  const C = 15.48, T = 1.25, R = 3.29 / C;
  const RHY = [0.76, 1.51, 3.68, 2.10, 1.15];
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
      scale: 12, straits: 'auto', wander: 3, rowGap: 0.15, rhythm: 'shuffle', bands: [1], rotate: 0, rows: 'auto',
      originY: 0, margin: null, seed: 1, drift: 0, layout: 'field',
      ...o, motion: m, duration: d,
      stagger: o.stagger ?? (m === 'arrive' ? 1.4 : m === 'tide' ? 0.4 * d : 0.12 * d),
      colours: { figure: '#2C454B', ground: '#F2EEE6', ...(o.colours || {}) },
    };
  }

  // Rows of one band: heights in the riser rhythm, each strait's channel offset (treads) walking in long runs.
  function rowsFor(o, seed, n, y0, y1, s, last) {
    const rows = [], off = [], left = [], run = [], runY = [];
    for (let k = 0; k < n; k++) { off[k] = 0; run[k] = 0; left[k] = 2 + Math.floor(rand(seed, k, 0, 1) * 4); runY[k] = y0; }
    let y = y0 + (o.originY || 0);
    for (let i = 0; o.rows === 'auto' || i < o.rows; i++) {
      const cyc = Math.floor(i / 5), pos = i % 5;
      const h = o.rhythm === 'mark' ? RHY[pos] : RHY.map((v, j) => [rand(seed, cyc, j, 3), v]).sort((a, b) => a[0] - b[0])[pos][1];
      if (y >= y1 || (!last && y + h * s > y1)) break;
      for (let k = 0; k < n; k++) {
        if (o.walk) { off[k] = (o.walk[k] || [])[i] ?? off[k]; run[k] = i; continue; }
        if (left[k] === 0) {
          run[k]++; left[k] = 3 + Math.floor(rand(seed, k, run[k], 2) * 5); runY[k] = y;
          const mag = rand(seed, k, run[k], 4) < 0.6 ? 1 : 2;
          let dir = rand(seed, k, run[k], 5) < 0.5 ? -1 : 1;
          if (Math.abs(off[k] + dir * mag) > o.wander) dir = -dir;
          off[k] += dir * mag;
        }
        left[k]--;
      }
      rows.push({ y0: y, y1: y + h * s, off: off.slice(), run: run.slice(), runY: runY.slice() });
      y += (h + o.rowGap) * s;
    }
    return rows;
  }

  // Every bar at time t, in layout px (before rotation), with per-corner radii [tl, tr, br, bl].
  function bars(o, Wl, Hl, t) {
    const out = [], D = o.duration, nb = o.bands.length, bh = Hl / nb;
    for (let b = 0; b < nb; b++) {
      const s = o.scale * o.bands[b], Wc = Wl / s, seed = o.seed * 31 + b;
      const n = o.straits === 'auto' ? Math.max(1, Math.round(Wc / 40)) : o.straits;
      const xs = []; for (let k = 0; k < n; k++) xs.push(Math.round(((k + 0.5) / n * Wc + (rand(seed, k, 1) - 0.5) * 0.4 * Wc / n) / T) * T);
      const rows = rowsFor(o, seed, n, b * bh, (b + 1) * bh, s, b === nb - 1);
      const start = o.margin != null ? o.margin * s : -2 * s, end = o.margin != null ? Wl - o.margin * s : Wl + 2 * s;
      rows.forEach((r, ri) => {
        const h = r.y1 - r.y0, cy = clamp((r.y0 + r.y1) / 2 / Hl), L = [], Rr = [];
        for (let k = 0; k < n; k++) {
          let sh = 0;
          if (o.motion === 'tide') {         // the strait re-routes: each run shifts one tread and settles, then returns
            const q = rand(seed, k, r.run[k], 7), dl = q < 0.35 ? -1 : q < 0.7 ? 1 : 0;
            const w = mod((t - o.stagger * clamp(r.runY[k] / Hl)) / D, 1);
            sh = dl * (w < 0.2 ? ease(w / 0.2) : w < 0.5 ? 1 : w < 0.7 ? 1 - ease((w - 0.5) / 0.2) : 0);
          }
          const cx = (xs[k] + (r.off[k] + sh) * T) * s;
          L.push(cx - s / 2); Rr.push(cx + s / 2);
        }
        let u = 0;
        if (o.motion === 'arrive') {
          const a = mod((t - o.stagger * cy) / D, 1);
          u = a < 0.3 ? 1 - ease(a / 0.3) : a < 0.65 ? 0 : a < 0.92 ? ease((a - 0.65) / 0.27) : 1;
        }
        const rad = Math.min(R * s, h / 2);
        for (let j = 0; j <= n; j++) {
          const a = j === 0 ? start : Rr[j - 1], z = j === n ? end : L[j];
          if (z - a <= 0) continue;
          const mid = (a + z) / 2, halves = [];
          if (j > 0) halves.push({ E: a, A: j === n ? z : mid, outer: j === n && o.margin != null });          // faces the strait on its left
          if (j < n) halves.push({ E: z, A: j === 0 ? a : mid, outer: j === 0 && o.margin != null });          // faces the strait on its right
          for (const hv of halves) {
            if (o.part === 'bar' && !(ri === 0 && j === 0)) continue;
            if (o.part === 'pair' && !(ri === 0 && (j === 0 || (j === 1 && hv.E === a)))) continue;
            const E = hv.E + (hv.A - hv.E) * u, x0 = Math.min(E, hv.A), x1 = Math.max(E, hv.A), w = x1 - x0;
            if (w < 0.02 * s) continue;
            const rc = Math.min(rad, w / 2), ro = hv.outer ? rc : 0, right = hv.E > hv.A;
            out.push({ x: x0, y: r.y0, w, h, r: right ? [ro, rc, rc, ro] : [rc, ro, ro, rc] });
          }
        }
      });
    }
    return out;
  }

  // The mark once, resolved, sliced into its bars (frame A). Left half rows: [outer, inner] in mark units.
  const MY = [0.52, 12.28, 35.71, 42.15, 85.22, 92.69, 125.13, 142.93].map(v => (v - 0.52) / C);
  const MROWS = [[0, 35.60], [0, 55.78], [0, 74.76], [24.26, 74.76], [0, 74.76], [0, 55.78], [0, 35.60]].map(([a, b]) => [a / C, b / C]);
  const HALF = 74.76 / C, MW = HALF * 2 + 1, MH = MY[7];
  function markBars(o) {
    const s = o.scale, x0 = o.originX || 0, y0 = o.originY || 0, out = [], e = 1e-3;
    MROWS.forEach(([a0, a1], k) => {
      const p = MROWS[k - 1], n = MROWS[k + 1], rad = Math.min(R, (MY[k + 1] - MY[k]) / 2) * s;
      const oT = !p || p[0] > a0 + e ? rad : 0, iT = !p || p[1] < a1 - e ? rad : 0;
      const oB = !n || n[0] > a0 + e ? rad : 0, iB = !n || n[1] < a1 - e ? rad : 0;
      const y = y0 + MY[k] * s, h = (MY[k + 1] - MY[k]) * s, w = (a1 - a0) * s;
      out.push({ x: x0 + a0 * s, y, w, h, r: [oT, iT, iB, oB] });
      out.push({ x: x0 + (MW - a1) * s, y, w, h, r: [iT, oT, oB, iB] });
    });
    return out;
  }

  // Swap: bands down the field, each wiped across into the inverse and back; the wave runs down the rows.
  function swapRegion(o, Wl, Hl, t) {
    const D = o.duration, s = mod(t / D + 0.2975, 1), hb = Hl / 14, P = new Path2D();
    let any = false;
    for (let b = 0; b < 14; b++) {
      const bd = (b / 14) * o.stagger / D;
      const x1 = Wl * ease((s - bd) / 0.35), x2 = Wl * ease((s - 0.5 - bd) / 0.35);
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
    return { ctx: cv.getContext('2d'), W, H, d };
  }

  function render(target, o, t, img) {
    const { ctx, W, H, d } = canvasFor(target);
    const A = o.area || { x: 0, y: 0, w: W, h: H }, rot = o.rotate === 90;
    const Wl = rot ? A.h : A.w, Hl = rot ? A.w : A.h;
    const P = new Path2D();
    for (const b of (o.layout === 'mark' ? markBars(o) : bars(o, Wl, Hl, t))) P.roundRect(b.x, b.y, b.w, b.h, b.r);
    const base = () => ctx.setTransform(d, 0, 0, d, 0, 0);
    const local = () => { base(); if (o.layout === 'mark') return; ctx.translate(A.x, A.y); if (rot) { ctx.translate(A.w, 0); ctx.rotate(Math.PI / 2); } };
    const paintImg = () => {
      const bx = o.maskBox || { x: 0, y: 0, w: W, h: H }, dr = o.drift || 0;
      const k = Math.max(bx.w / img.width, bx.h / img.height) * (1 + 2 * dr), dw = img.width * k, dh = img.height * k;
      ctx.drawImage(img, bx.x + (bx.w - dw) / 2 + dr * bx.w * Math.sin(TAU * t / 30), bx.y + (bx.h - dh) / 2, dw, dh);
    };
    const fill = which => {
      base();
      if (which === 'figure' && img) return paintImg();
      if (o.colours[which] === 'transparent') return;
      ctx.fillStyle = o.colours[which]; ctx.fillRect(A.x, A.y, A.w, A.h);
    };
    const layer = (gnd, fig, region) => {
      ctx.save();
      if (region) { local(); ctx.clip(region); }
      base(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
      fill(gnd); local(); ctx.clip(P); fill(fig);
      ctx.restore();
    };
    base(); ctx.clearRect(0, 0, W, H);
    layer('ground', 'figure');
    if (o.motion === 'swap') { const reg = swapRegion(o, Wl, Hl, t); if (reg) layer('figure', 'ground', reg); }
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

  root.Pattern = { draw, play, bars, RHYTHM: RHY, MARK: { width: MW, height: MH, half: HALF, tread: T, radius: R, channel: 1 } };
})(window);

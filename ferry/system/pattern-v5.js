/* Ferry pattern engine, v5 (built on pass two).
   The kit: three blocks and a gap. A shore is a stack of blocks that differ only in how far they reach toward the channel:
     BACK  the shore's base reach            reach 0
     STEP  one tread further                 reach t1 = 1.30c
     NOSE  two treads further, meets channel reach t1 + t2 = 2.53c
   Heights are the mark's risers (a1 0.76c, a2 1.51c, nose 3.68c, b1 2.10c, b2 1.15c); BACK stretches are sums of them.
   A shore starts in the mark's order (BACK a1, STEP a2, NOSE, STEP b1, BACK b2) and continues in a seeded variation; levels only
   run 0..2, so no staircase ever exceeds two steps. Two shores mirror each other across a channel: exactly 1c between facing noses.
   c = the mark's channel (15.48 mark units); r = 0.21c, the mark's one corner radius, on every channel-side corner.

   Pattern.draw(opts, t) -> SVG markup for a w x h field. Options:
     w, h         field size in px
     s            px per c (unit scale)                       Q      channel pitch in c (default 14)
     seed         variation seed                              cols   distinct shore sequences across (default 3)
     ox, oy       field offset in px                          fig, ground   the two colours
     motion       'none' | 'arrive' | 'tide' | 'swap'         speed  time multiplier (default 1)
     bands        [{ y, h, scale }] horizontal bands at 1x / 1.5x / 2x (default one band)
     rotate       0 | 90 (90 = the Shoreline orientation, channels horizontal)
     routes       false; true draws straight crossing lines (kept as an option, off by default)
     maskOnly     true returns only the figure in the fig colour (for masks)
   Loops: Arrive 10 s (2.5 s in, 3.5 s hold, 2.5 s out, 1.5 s open), staggered so a wave crosses the frame;
   Tide 12 s (STEP <-> NOSE in a travelling wave, edge moves one tread); Swap 12 s (wipe to inverse, hold 2 s, wipe back).
   Pattern.play(render) runs render(t): pauses when hidden, still at the resolved state under reduced motion, ?t=<s> freezes. */
(function (root) {
  const C = 15.48;
  const M = { r: 3.29 / C, t1: 20.18 / C, t2: 18.98 / C, a1: 11.76 / C, a2: 23.42 / C, nose: 56.98 / C, b1: 32.44 / C, b2: 17.80 / C };
  M.depth = M.t1 + M.t2;
  const REACH = [0, M.t1, M.depth], KINDS = ['BACK', 'STEP', 'NOSE'];
  const TAU = Math.PI * 2;
  const mod = (n, m) => ((n % m) + m) % m;
  const ease = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const f = v => +v.toFixed(2);
  function rand(seed, ...k) {
    let h = (Math.imul(seed | 0, 2654435761) ^ 0x5bd1e995) >>> 0;
    for (const v of k) { h = Math.imul(h ^ ((v | 0) + 0x9e3779b9), 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; }
    return (h >>> 0) / 4294967296;
  }

  // One block: a rectangle from its back (xb) to its channel edge (xe), rows y0..y1, rounded only on the channel side.
  function block(xb, xe, y0, y1, r) {
    const w = Math.abs(xe - xb), h = y1 - y0;
    if (w < 0.3 || h < 0.3) return '';
    const k = Math.min(r, w / 2, h / 2), dir = Math.sign(xe - xb), sw = dir > 0 ? 1 : 0;
    return `M${f(xb)} ${f(y0)}L${f(xe - dir * k)} ${f(y0)}A${f(k)} ${f(k)} 0 0 ${sw} ${f(xe)} ${f(y0 + k)}L${f(xe)} ${f(y1 - k)}A${f(k)} ${f(k)} 0 0 ${sw} ${f(xe - dir * k)} ${f(y1)}L${f(xb)} ${f(y1)}Z`;
  }

  // A shore's block sequence (periodic): [level, height in c].
  function shoreSeq(seed, key) {
    const s = [[0, M.a1], [1, M.a2], [2, M.nose], [1, M.b1], [0, M.b2]];
    const n = 3 + Math.floor(rand(seed, key, 1) * 3);
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const opts = [0, 1, 2].filter(l => l !== prev);
      let l = opts[Math.floor(rand(seed, key, 10 + i) * opts.length)];
      if (i === n - 1 && l === 0) l = prev === 1 ? 2 : 1;
      const hs = l === 0 ? [M.nose + M.a2, 2 * M.nose, M.b1 + M.nose, M.nose + M.b2 + M.a2] : l === 1 ? [M.a2, M.b1, M.a1 + M.b2, M.b2] : [M.nose];
      s.push([l, hs[Math.floor(rand(seed, key, 30 + i) * hs.length)]]);
      prev = l;
    }
    return s;
  }

  // Motion envelopes.
  const arriveE = u => (u < 2.5 ? ease(u / 2.5) : u < 6 ? 1 : u < 8.5 ? 1 - ease((u - 6) / 2.5) : 0);
  const swapP = u => (u < 1 ? 0 : u < 5 ? ease((u - 1) / 4) : u < 7 ? 1 : u < 11 ? 1 - ease((u - 7) / 4) : 0);

  // The field's figure as one path d, over area a = { x, y, w, h }.
  function field(o, a, t) {
    const s = o.s, Q = o.Q || 14, cols = o.cols || 3, seed = o.seed || 1, R = M.r * s, ox = o.ox || 0;
    const xc = i => ox + i * Q * s;
    const i0 = Math.floor((a.x - ox) / (Q * s)) - 1, i1 = Math.ceil((a.x + a.w - ox) / (Q * s)) + 1;
    let d = '';
    const lines = [];
    for (let i = i0; i <= i1; i++) {
      const key = mod(i, cols), seq = shoreSeq(seed, key), N = seq.length;
      const cum = [0]; seq.forEach(([, h]) => cum.push(cum[cum.length - 1] + h * s));
      const Hs = cum[N], oy = (o.oy || 0) - rand(seed, key, 77) * Hs;
      const yAt = g => oy + Math.floor(g / N) * Hs + cum[mod(g, N)];
      const m0 = Math.floor((a.y - oy) / Hs) - 1, m1 = Math.ceil((a.y + a.h - oy) / Hs);
      const runLen = 3 + (key % 2);
      for (let m = m0; m <= m1; m++) {
        for (let k = 0; k < N; k++) {
          const [l, h] = seq[k], g = m * N + k, y0 = yAt(g), y1 = y0 + h * s;
          if (y1 < a.y - s || y0 > a.y + a.h + s) continue;
          let reach = REACH[l], e = 1;
          if (o.motion === 'tide' && l > 0 && rand(seed, key, k, 5) < 0.6) {
            const ph = (t * (o.speed || 1)) / 12 - ((y0 - a.y) / a.h) * 0.6 - ((xc(i) - a.x) / a.w) * 0.25;
            const w = 0.5 - 0.5 * Math.cos(TAU * ph);
            reach = l === 1 ? M.t1 + M.t2 * w : M.depth - M.t2 * w;
          }
          if (o.motion === 'arrive') {
            const yr = yAt(Math.floor(g / runLen) * runLen); // a run of blocks moves as one
            const delay = 1.3 * (xc(i) - a.x) / a.w + 0.5 * (yr - a.y) / a.h;
            e = arriveE(mod(t * (o.speed || 1) - delay, 10));
          }
          const gap = (0.5 + M.depth - reach) * s, half = (Q / 2) * s;
          const xl = xc(i) - half, xr = xc(i) + half;
          d += block(xl, xl + (half - gap) * e, y0, y1, R) + block(xr, xr - (half - gap) * e, y0, y1, R);
          if (o.routes && l === 0 && rand(seed, key, k, 9) < 0.5) lines.push([xc(i) - gap, xc(i) + gap, (y0 + y1) / 2]);
        }
      }
    }
    return { d, lines };
  }

  let uid = 0;
  function draw(o, t = 0) {
    const W = o.w, H = o.h, id = 'pt' + uid++, rot = o.rotate === 90;
    const aw = rot ? H : W, ah = rot ? W : H;
    const bands = o.bands || [{ y: 0, h: ah, scale: 1 }];
    let defs = bands.map((b, i) => `<clipPath id="${id}b${i}"><rect x="0" y="${f(b.y)}" width="${f(aw)}" height="${f(b.h)}"/></clipPath>`).join('');
    const body = col => bands.map((b, i) => {
      const so = Object.assign({}, o, { s: o.s * (b.scale || 1), seed: (o.seed || 1) + i * 13 });
      const fl = field(so, { x: 0, y: b.y, w: aw, h: b.h }, t);
      const ln = fl.lines.map(([x0, x1, y]) => `<path d="M${f(x0)} ${f(y)}H${f(x1)}" stroke="${col}" stroke-width="${f(M.r * so.s * 0.7)}"/>`).join('');
      return `<g clip-path="url(#${id}b${i})"><path d="${fl.d}" fill="${col}"/>${ln}</g>`;
    }).join('');
    let inner = o.maskOnly ? body(o.fig) : `<rect width="${f(aw)}" height="${f(ah)}" fill="${o.ground}"/>` + body(o.fig);
    if (o.motion === 'swap' && !o.maskOnly) {
      const p = swapP(mod(t * (o.speed || 1), 12)), xw = p * aw;
      if (xw > 0.5) {
        defs += `<clipPath id="${id}w"><rect x="0" y="0" width="${f(xw)}" height="${f(ah)}"/></clipPath>`;
        inner += `<g clip-path="url(#${id}w)"><rect width="${f(aw)}" height="${f(ah)}" fill="${o.fig}"/>${body(o.ground)}</g>`;
      }
    }
    if (rot) inner = `<g transform="translate(${f(W)} 0) rotate(90)">${inner}</g>`;
    return `<defs>${defs}</defs>${inner}`;
  }

  function play(render) {
    const q = new URLSearchParams(location.search), fixed = q.has('t') ? +q.get('t') : null;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (fixed !== null || still) { render(fixed ?? 4.5); return; } // 4.5 s: Arrive holds
    let t = 0, last = null, n = 0;
    const tick = now => {
      if (last !== null && !document.hidden) t += Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!document.hidden && (n++ & 1) === 0) render(t);
      requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', () => { last = null; });
    requestAnimationFrame(tick);
  }

  // The mark's two halves, as drawn in src/butterfly-mark.svg (165 x 142.93). Used only as the hero's windows, never tiled.
  const HALVES = [
    'M32.3115 0.521362C34.1289 0.521362 35.6025 1.99501 35.6025 3.81238V8.99109C35.6029 10.8082 37.0764 12.2811 38.8936 12.2811H52.4893C54.3066 12.2811 55.7803 13.7548 55.7803 15.5721V32.4159C55.7806 34.233 57.2541 35.7059 59.0713 35.7059H71.4707C73.2881 35.7059 74.7617 37.1796 74.7617 38.9969V89.3964C74.7614 91.2134 73.2878 92.6864 71.4707 92.6864H59.0713C57.2539 92.6864 55.7803 94.16 55.7803 95.9774V121.838C55.7799 123.655 54.3064 125.128 52.4893 125.128H38.8936C37.0762 125.128 35.6025 126.601 35.6025 128.419V139.64C35.6022 141.457 34.1287 142.93 32.3115 142.93H3.29102C1.47387 142.93 0.00035392 141.457 0 139.64V85.2245H20.9717C22.7889 85.2244 24.2615 83.7516 24.2617 81.9344V45.4393C24.2615 43.6222 22.7889 42.1484 20.9717 42.1483H0V3.81238C0 1.99501 1.47365 0.521362 3.29102 0.521362H32.3115Z',
    'M132.687 0C130.87 0.000201891 129.397 1.47381 129.397 3.29102V8.46973C129.397 10.2868 127.923 11.7596 126.106 11.7598H112.51C110.692 11.76 109.22 13.2336 109.219 15.0508V31.8945C109.219 33.7116 107.746 35.1844 105.928 35.1846H93.5271C91.7099 35.1848 90.2371 36.6584 90.2371 38.4756V88.875C90.2373 90.6921 91.71 92.1648 93.5271 92.165H105.928C107.746 92.1652 109.219 93.6388 109.219 95.4561V121.316C109.22 123.133 110.692 124.606 112.51 124.606H126.106C127.923 124.607 129.397 126.08 129.397 127.897V139.118C129.397 140.935 130.87 142.408 132.687 142.408H161.709C163.526 142.408 165 140.935 165 139.118V84.7061H144.028C142.211 84.7061 140.737 83.2331 140.737 81.416V44.9209C140.737 43.1036 142.211 41.6309 144.028 41.6309H165V3.29102C165 1.47376 163.526 0.00012137 161.709 0H132.687Z',
  ];

  root.Pattern = root.FerryPattern = {
    M, C, REACH, KINDS, rand, ease, block, shoreSeq, draw, play,
    halves: (x, y, h) => `<g transform="translate(${f(x)} ${f(y)}) scale(${(h / 142.93).toFixed(5)})">` + HALVES.map(d => `<path d="${d}"/>`).join('') + '</g>',
    drift: (t, w) => 0.03 * w * Math.sin(TAU * t / 30), // painting drift under windows: 3 percent over 30 s, seamless
  };
})(window);

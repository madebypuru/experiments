/* Ferry pattern engine, v2. Every measure is a ratio of the mark's channel c (15.48 mark units):
   r 0.21c corner radius; treads t1 1.30c, t2 1.23c; risers a1 0.76c, a2 1.51c; nose 3.68c; b1 2.10c, b2 1.15c.
   A half-profile (a1 a2 nose b1 b2) is 9.20c long and 2.53c deep. s = pixels per c. Every function takes t (seconds).
   Loops: tide 12 s, route 10 s (8 s crossing, 1 s hold, fades), wake 20 s, painting drift 30 s. */
(function (root) {
  const C = 15.48;
  const M = { r: 3.29 / C, t1: 20.18 / C, t2: 18.98 / C, a1: 11.76 / C, a2: 23.42 / C, nose: 56.98 / C, b1: 32.44 / C, b2: 17.80 / C };
  M.depth = M.t1 + M.t2;
  M.half = M.a1 + M.a2 + M.nose + M.b1 + M.b2;
  const TAU = Math.PI * 2;
  const mod = (n, m) => ((n % m) + m) % m;
  function rand(seed, ...k) {
    let h = (Math.imul(seed | 0, 2654435761) ^ 0x5bd1e995) >>> 0;
    for (const v of k) { h = Math.imul(h ^ ((v | 0) + 0x9e3779b9), 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; }
    return (h >>> 0) / 4294967296;
  }
  const f = v => +v.toFixed(2);

  // Orthogonal polyline with the mark's one corner radius on every corner.
  function rp(pts, r, closed) {
    const P = [];
    for (const p of pts) { const q = P[P.length - 1]; if (q && Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6) continue; P.push(p); }
    const Q = [];
    for (let i = 0; i < P.length; i++) {
      const a = Q[Q.length - 1], b = P[i], c = P[i + 1];
      if (a && c && Math.abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) < 1e-6) continue;
      Q.push(b);
    }
    const m = Q.length; let d = '';
    if (m === 1) return 'M' + f(Q[0][0]) + ' ' + f(Q[0][1]);
    for (let i = 0; i < m; i++) {
      const p = Q[i];
      if (!closed && (i === 0 || i === m - 1)) { d += (i === 0 ? 'M' : 'L') + f(p[0]) + ' ' + f(p[1]); continue; }
      const a = Q[(i - 1 + m) % m], b = Q[(i + 1) % m];
      const l1 = Math.hypot(p[0] - a[0], p[1] - a[1]), l2 = Math.hypot(b[0] - p[0], b[1] - p[1]);
      const k = Math.min(r, l1 / 2, l2 / 2);
      const u1 = [(p[0] - a[0]) / l1, (p[1] - a[1]) / l1], u2 = [(b[0] - p[0]) / l2, (b[1] - p[1]) / l2];
      const s = [p[0] - u1[0] * k, p[1] - u1[1] * k], e = [p[0] + u2[0] * k, p[1] + u2[1] * k];
      const cr = u1[0] * u2[1] - u1[1] * u2[0];
      d += (i === 0 ? 'M' : 'L') + f(s[0]) + ' ' + f(s[1]) + 'A' + f(k) + ' ' + f(k) + ' 0 0 ' + (cr > 0 ? 1 : 0) + ' ' + f(e[0]) + ' ' + f(e[1]);
    }
    return closed ? d + 'Z' : d;
  }
  function split(pts, fr) {
    const seg = []; let L = 0;
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(l); L += l; }
    let t = fr * L;
    for (let i = 0; i < seg.length; i++) {
      if (t <= seg[i]) { const p = pts[i], q = pts[i + 1], u = seg[i] ? t / seg[i] : 0; const X = [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]; return [pts.slice(0, i + 1).concat([X]), [X].concat(pts.slice(i + 1)), X]; }
      t -= seg[i];
    }
    const X = pts[pts.length - 1]; return [pts.slice(), [X], X];
  }

  // A route on its 10 s loop: fade in 0.5 s, cross at constant speed for 8 s (solid behind the dot, dotted ahead), hold 1 s, fade 0.5 s.
  function route(pts, t, off, s, lw = 1) {
    const u = mod(t + off, 10);
    let p, op;
    if (u < 0.5) { p = 0; op = u / 0.5; } else if (u < 8.5) { p = (u - 0.5) / 8; op = 1; } else if (u < 9.5) { p = 1; op = 1; } else { p = 1; op = (10 - u) / 0.5; }
    const [A, B, X] = split(pts, p), R = M.r * s;
    return { solid: p > 0 ? rp(A, R, false) : '', dotted: p < 1 ? rp(B, R, false) : '', dot: [X[0], X[1], M.a1 * 0.5 * s * lw], op, tw: R * 0.7 * lw, dw: R * 1.1 * lw, dg: M.a1 * 0.55 * s * lw };
  }

  // ---------- A. Shoreline: a coast. Each band edge is long uneven stretches at the mark's three depths, stepping only at turns,
  // with one full mark profile (the nose) per edge per tile. Facing noses often line up, one channel apart. Tide: the water widens
  // and narrows by one channel (each shore moves 0.25c in or out) over 12 s, bands out of phase.
  function coastSegs(seed, key, W) {
    const prof = [[M.a1, 0], [M.a2, 1], [M.nose, 2], [M.b1, 1], [M.b2, 0]];
    const rest = W - M.half, n = 2 + Math.floor(rand(seed, key, 1) * 2);
    const w = []; for (let i = 0; i < n; i++) w.push(0.5 + rand(seed, key, 10 + i));
    const sw = w.reduce((a, b) => a + b, 0);
    let lvl = rand(seed, key, 2) < 0.5 ? 0 : 1;
    const segs = prof.slice();
    for (let i = 0; i < n; i++) { segs.push([rest * w[i] / sw, lvl]); lvl = 1 - lvl; }
    return segs;
  }
  function coastEdge(ua, ub, vc, side, segs, x0, W, s, tide) {
    const cum = [0, M.t1, M.depth], pts = [];
    const v = L => vc + side * (0.5 + M.depth - cum[L] + tide) * s;
    const m0 = Math.floor((ua - x0) / (W * s)) - 1, m1 = Math.ceil((ub - x0) / (W * s)) + 1;
    for (let m = m0; m <= m1; m++) {
      let x = x0 + m * W * s;
      for (const [len, L] of segs) { pts.push([x, v(L)]); x += len * s; pts.push([x, v(L)]); }
    }
    return pts;
  }
  function shoreline(o, a, t = 0) {
    const s = o.s, W = o.W || 40, rows = o.rows || 4, seed = o.seed || 1, ox = o.ox || 0, oy = o.oy || 0;
    const Ps = o.P || [9.5, 13, 10.5, 15.5], keep = a.keep || (() => true);
    const P = j => Ps[mod(j, rows) % Ps.length];
    const cumY = [0]; for (let j = 0; j < rows; j++) cumY.push(cumY[j] + P(j));
    const H = cumY[rows];
    const vc = j => oy + (Math.floor(j / rows) * H + cumY[mod(j, rows)]) * s;
    const tide = j => 0.25 * Math.sin(TAU * t / 12 + TAU * mod(j, rows) / rows + 0.7);
    const lo = j => coastSegs(seed, mod(j, rows) * 2, W), up = j => coastSegs(seed, mod(j, rows) * 2 + 1, W);
    const x0lo = j => ox + rand(seed, mod(j, rows), 50) * W * s;
    const x0up = j => rand(seed, mod(j, rows), 51) < 0.6 ? x0lo(j) : ox + rand(seed, mod(j, rows), 52) * W * s;
    const ua = a.x - W * s, ub = a.x + a.w + W * s;
    const j0 = Math.floor((a.y - oy) / (H * s)) * rows - rows, j1 = Math.ceil((a.y + a.h - oy) / (H * s)) * rows + rows;
    const g = { fills: [], tile: { w: W * s, h: H * s } };
    for (let j = j0; j <= j1; j++) {
      if (vc(j) > a.y + a.h + 20 * s || vc(j + 1) < a.y - 20 * s || !keep(j)) continue;
      const top = coastEdge(ua, ub, vc(j), 1, lo(j), x0lo(j), W, s, tide(j));
      const bot = coastEdge(ua, ub, vc(j + 1), -1, up(j + 1), x0up(j + 1), W, s, tide(j + 1));
      g.fills.push(rp(top.concat(bot.reverse()), M.r * s, true));
    }
    return g;
  }

  // ---------- B. Crossings: vertical stepped shores (one nose per channel per tile) framing each channel; routes leave one shore,
  // cross straight or with one step (a1 or a2) and land on the facing shore. Channel pitch Q 10c, slot S 10c.
  function edge(ua, ub, vc, side, has, S, s, ou) {
    const vb = vc + side * (0.5 + M.depth) * s, v1 = vc + side * (0.5 + M.t2) * s, vn = vc + side * 0.5 * s;
    const pts = [[ua, vb]];
    const k0 = Math.floor((ua - ou) / (S * s)) - 1, k1 = Math.ceil((ub - ou) / (S * s)) + 1;
    for (let k = k0; k <= k1; k++) {
      if (!has(k)) continue;
      const u0 = ou + k * S * s + (S - M.half) / 2 * s;
      if (u0 < ua || u0 + M.half * s > ub) continue;
      const A = u0 + M.a1 * s, B = A + M.a2 * s, Cc = B + M.nose * s, D = Cc + M.b1 * s;
      pts.push([A, vb], [A, v1], [B, v1], [B, vn], [Cc, vn], [Cc, v1], [D, v1], [D, vb]);
    }
    pts.push([ub, vb]);
    return pts;
  }
  function crossings(o, a, t = 0) {
    const s = o.s, Q = o.Q || 10, S = o.S || 10, cols = o.cols || 2, slots = o.slots || 3, den = o.density ?? 0.8, seed = o.seed || 1;
    const ox = o.ox || 0, oy = o.oy || 0, keep = a.keep || (() => true), R = M.r * s;
    const ps = i => Math.floor(rand(seed, mod(i, cols), 7) * slots), has = i => k => mod(k, slots) === ps(i);
    const ua = a.y - S * s, ub = a.y + a.h + S * s, xc = i => ox + (i + 0.5) * Q * s;
    const i0 = Math.floor((a.x - ox) / (Q * s)) - 1, i1 = Math.ceil((a.x + a.w - ox) / (Q * s)) + 1;
    const k0 = Math.floor((a.y - oy) / (S * s)) - 1, k1 = Math.ceil((a.y + a.h - oy) / (S * s)) + 1;
    const T = p => p.map(([u, v]) => [v, u]);
    const g = { fills: [], strokes: [], sw: R, routes: [], tile: { w: cols * Q * s, h: slots * S * s } };
    for (let i = i0; i <= i1; i++) {
      if (!keep(i)) continue;
      const L = T(edge(ua, ub, xc(i), -1, has(i), S, s, oy)), Rt = T(edge(ua, ub, xc(i), 1, has(i), S, s, oy));
      if (o.mode === 'fill') { const nx = T(edge(ua, ub, xc(i + 1), -1, has(i + 1), S, s, oy)); g.fills.push(rp(Rt.concat(nx.reverse()), R, true)); }
      else g.strokes.push(rp(L, R, false), rp(Rt, R, false));
      const im = mod(i, cols);
      for (let k = k0; k <= k1; k++) {
        const km = mod(k, slots); if (km === ps(i)) continue;
        for (let q = 0; q < 3; q++) {
          if (rand(seed, im, km, 3 + q) >= den * [1, 0.85, 0.7][q]) continue;
          const lo = 1 + 4 * q, g1 = lo + Math.floor(rand(seed, im, km, 10 + q) * 4);
          let d = [-2, -1, 0, 1, 2][Math.floor(rand(seed, im, km, 20 + q) * 5)];
          if (g1 + d < lo || g1 + d > lo + 3) d = -d;
          if (g1 + d < lo || g1 + d > lo + 3) d = 0;
          const base = oy + k * S * s, y1 = base + g1 * M.a1 * s, y2 = base + (g1 + d) * M.a1 * s;
          const jx = xc(i) + [-1, 0, 1][Math.floor(rand(seed, im, km, 30 + q) * 3)] * M.t1 * 0.5 * s;
          const xs = xc(i) - (0.5 + M.depth) * s, xe = xc(i) + (0.5 + M.depth) * s;
          const rev = rand(seed, im, km, 50 + q) < 0.35; // some ferries run the other way
          let pts = d ? [[xs, y1], [jx, y1], [jx, y2], [xe, y2]] : [[xs, y1], [xe, y1]];
          if (rev) pts = pts.reverse();
          g.routes.push(route(pts, t, rand(seed, im, km, 40 + q) * 10, s, o.lw || 1));
        }
      }
    }
    return g;
  }

  // ---------- C. Wake: a V opening behind a point. The arms start one channel apart (the mark's channel) and step outward,
  // asymmetric (the two half-angles differ), steps lengthening with distance. Lines are born at the point at uneven
  // intervals, drift back and spread, thinning and fading over 20 s. dir: the way the V opens ('left', 'right', 'down', 'up').
  function wake(o, t = 0) {
    const s = o.s, seed = o.seed || 1, n = o.n || 6, A = 20, len = o.len || 40, sp = o.speed || 1.5;
    const ang = (o.ang || [17, 27]).map(d => Math.tan(d * Math.PI / 180));
    const map = {
      left: (u, v) => [o.x - u * s, o.y + v * s], right: (u, v) => [o.x + u * s, o.y + v * s],
      down: (u, v) => [o.x + v * s, o.y + u * s], up: (u, v) => [o.x + v * s, o.y - u * s],
    }[o.dir || 'left'];
    const treads = [M.t1, M.depth, M.nose, M.nose + M.t1, M.nose + M.depth, 2 * M.nose, 2 * M.nose + M.depth, 3 * M.nose];
    const lines = [];
    for (let k = 0; k < n; k++) {
      const off = (k + (rand(seed, k, 1) - 0.5) * 0.7) * A / n, a = mod(t + off, A), fr = a / A;
      const u0 = a * sp, w = M.r * s * (o.wMul || 1) * (1.5 - 1.1 * fr);
      const op = Math.min(1, a / 1.2) * Math.pow(1 - fr, 1.2);
      [-1, 1].forEach((sg, si) => {
        let u = u0, v = sg * 0.5; const pts = [[u, v]];
        const tn = ang[si] * (1 + 0.25 * fr);
        for (let i = 0; u - u0 < len; i++) { const tr = treads[Math.min(i, treads.length - 1)] * (1 + 0.5 * fr); u += tr; pts.push([u, v]); v += sg * tr * tn; pts.push([u, v]); }
        lines.push({ d: rp(pts.map(p => map(p[0], p[1])), M.r * s, false), w, op });
      });
    }
    return { lines };
  }

  // The mark's two halves, as drawn in src/butterfly-mark.svg (165 x 142.93).
  const HALVES = [
    'M32.3115 0.521362C34.1289 0.521362 35.6025 1.99501 35.6025 3.81238V8.99109C35.6029 10.8082 37.0764 12.2811 38.8936 12.2811H52.4893C54.3066 12.2811 55.7803 13.7548 55.7803 15.5721V32.4159C55.7806 34.233 57.2541 35.7059 59.0713 35.7059H71.4707C73.2881 35.7059 74.7617 37.1796 74.7617 38.9969V89.3964C74.7614 91.2134 73.2878 92.6864 71.4707 92.6864H59.0713C57.2539 92.6864 55.7803 94.16 55.7803 95.9774V121.838C55.7799 123.655 54.3064 125.128 52.4893 125.128H38.8936C37.0762 125.128 35.6025 126.601 35.6025 128.419V139.64C35.6022 141.457 34.1287 142.93 32.3115 142.93H3.29102C1.47387 142.93 0.00035392 141.457 0 139.64V85.2245H20.9717C22.7889 85.2244 24.2615 83.7516 24.2617 81.9344V45.4393C24.2615 43.6222 22.7889 42.1484 20.9717 42.1483H0V3.81238C0 1.99501 1.47365 0.521362 3.29102 0.521362H32.3115Z',
    'M132.687 0C130.87 0.000201891 129.397 1.47381 129.397 3.29102V8.46973C129.397 10.2868 127.923 11.7596 126.106 11.7598H112.51C110.692 11.76 109.22 13.2336 109.219 15.0508V31.8945C109.219 33.7116 107.746 35.1844 105.928 35.1846H93.5271C91.7099 35.1848 90.2371 36.6584 90.2371 38.4756V88.875C90.2373 90.6921 91.71 92.1648 93.5271 92.165H105.928C107.746 92.1652 109.219 93.6388 109.219 95.4561V121.316C109.22 123.133 110.692 124.606 112.51 124.606H126.106C127.923 124.607 129.397 126.08 129.397 127.897V139.118C129.397 140.935 130.87 142.408 132.687 142.408H161.709C163.526 142.408 165 140.935 165 139.118V84.7061H144.028C142.211 84.7061 140.737 83.2331 140.737 81.416V44.9209C140.737 43.1036 142.211 41.6309 144.028 41.6309H165V3.29102C165 1.47376 163.526 0.00012137 161.709 0H132.687Z',
  ];
  // Facing edges of the two halves in mark units: [yFrom, yTo, x].
  const LEFT_FACE = [[0.5, 12.28, 35.6], [12.28, 35.71, 55.78], [35.71, 92.69, 74.76], [92.69, 125.13, 55.78], [125.13, 142.93, 35.6]];
  const RIGHT_FACE = [[0, 11.76, 129.4], [11.76, 35.18, 109.22], [35.18, 92.17, 90.24], [92.17, 124.61, 109.22], [124.61, 142.41, 129.4]];
  const faceX = (F, y) => (F.find(([a, b]) => y >= a && y <= b) || F[0])[2];
  // Routes across the mark's own channel, in mark units: leave the left half at y1, land on the right half at y2.
  function markRoutes(x, y, h, t, specs) {
    const k = h / 142.93, s = C * k;
    return specs.map(([y1, y2, off, rev]) => {
      const xa = faceX(LEFT_FACE, y1), xb = faceX(RIGHT_FACE, y2), jx = (xa + xb) / 2;
      let pts = (y1 === y2 ? [[xa, y1], [xb, y2]] : [[xa, y1], [jx, y1], [jx, y2], [xb, y2]]).map(([u, v]) => [x + u * k, y + v * k]);
      if (rev) pts = pts.reverse();
      return route(pts, t, off, s, 0.55);
    });
  }

  function toSVG(g, { color, opacity = 1 }) {
    let o = '';
    for (const d of g.fills || []) o += `<path d="${d}" fill="${color}"/>`;
    for (const d of g.strokes || []) o += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${f(g.sw)}" stroke-linejoin="round"/>`;
    for (const r of g.routes || []) {
      if (r.op <= 0.001) continue;
      o += `<g opacity="${f(r.op * opacity)}">`;
      if (r.solid) o += `<path d="${r.solid}" fill="none" stroke="${color}" stroke-width="${f(r.tw)}" stroke-linecap="round"/>`;
      if (r.dotted) o += `<path d="${r.dotted}" fill="none" stroke="${color}" stroke-width="${f(r.dw)}" stroke-linecap="round" stroke-dasharray="0 ${f(r.dg)}"/>`;
      o += `<circle cx="${f(r.dot[0])}" cy="${f(r.dot[1])}" r="${f(r.dot[2])}" fill="${color}"/></g>`;
    }
    for (const l of g.lines || []) if (l.op > 0.001) o += `<path d="${l.d}" fill="none" stroke="${color}" stroke-width="${f(l.w)}" stroke-opacity="${f(l.op * opacity)}" stroke-linejoin="round" stroke-linecap="round"/>`;
    return o;
  }

  root.FerryPattern = {
    M, C, HALVES, rand,
    shoreline, crossings, wake, markRoutes,
    halves: (x, y, h) => `<g transform="translate(${f(x)} ${f(y)}) scale(${(h / 142.93).toFixed(5)})">` + HALVES.map(d => `<path d="${d}"/>`).join('') + '</g>',
    drift: (t, w) => 0.03 * w * Math.sin(TAU * t / 30), // painting drift under the windows: 3 percent, 30 s, seamless
    svg: toSVG,
  };
})(window);

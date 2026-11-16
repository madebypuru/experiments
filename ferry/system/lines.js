/* Ferry Lines: vertical-line pattern engine, rebuilt from the client's reference video.
   One unit: a full-height vertical line at an even pitch, weight falling from thick to hairline.
   Motion: lines change length, never position. A wave passes along the row (left to right by default).
   Loop (one `duration`): A erases, B draws, hold, B erases, A draws, hold.
     A = thick at the end of the wave (right), B = thick at the start (left).
     Every phase moves the same way: each line's free end travels from the top edge to the bottom edge,
     first line first. Erase = the top end retracts downward; draw = the line grows downward from the top.
   Edges are geometry, not filters: each line's left and right edges are displaced by seeded smooth noise
   fixed in y per line, so a line keeps its edge as it grows and shrinks.
   API: Lines.draw(canvas, opts) draws the frame at opts.t; Lines.play(canvas, opts) returns stop(). */
(function (root) {
  'use strict';

  var DEFAULTS = {
    w: 1080, h: 1080,
    count: 26,
    maxWeight: 0.6,      // of pitch
    minWeight: 0.03,     // of pitch (hairline); never below 0.75 css px
    ground: '#1B262B',   // Ferry Ink
    ink: '#2C454B',      // Ferry Harbour
    edge: 1,             // 0..1 wobble amount
    duration: 13,        // one full loop, seconds
    t: 0,
    seed: 7,
    dir: 1               // 1: wave left to right, -1: right to left
  };

  // Phase lengths of one half loop, in seconds at the default duration (from the video: erase 2.0, empty 0.2, draw 2.8).
  var PH = [2.0, 0.2, 2.8, 1.5];
  var PH_SUM = PH[0] + PH[1] + PH[2] + PH[3];
  var D_LINE = 0.3;      // share of a phase each line spends moving (about 10 of 26 lines move at once)

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeSine(x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); }
  // Tip travel: slow off the top edge, faster lower down, soft landing. No overshoot.
  function easeTip(x) { return 0.5 - 0.5 * Math.cos(Math.PI * Math.pow(x, 1.25)); }

  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  // 1D value noise, smooth, in [-1, 1]. Lattice values from a seeded generator.
  function makeNoise(rand, n) {
    var v = new Float32Array(n + 2);
    for (var i = 0; i < v.length; i++) v[i] = rand() * 2 - 1;
    return function (x) {
      var i0 = Math.floor(x), f = x - i0, a = v[((i0 % n) + n) % n], b = v[(((i0 + 1) % n) + n) % n];
      f = f * f * (3 - 2 * f);
      return a + (b - a) * f;
    };
  }

  var cache = null;
  function field(o) {
    var key = [o.w, o.h, o.count, o.seed].join('|');
    if (cache && cache.key === key) return cache;
    var step = Math.max(1.5, o.h / 420);
    var ns = Math.ceil(o.h / step) + 1;
    var lines = [];
    var rand = rng(o.seed * 9973 + 17);
    for (var k = 0; k < o.count; k++) {
      var nL1 = makeNoise(rand, 256), nL2 = makeNoise(rand, 256);
      var nR1 = makeNoise(rand, 256), nR2 = makeNoise(rand, 256);
      var nB = makeNoise(rand, 256), nS1 = makeNoise(rand, 256), nS2 = makeNoise(rand, 256);
      var L = new Float32Array(ns), R = new Float32Array(ns), B = new Float32Array(ns), S = new Float32Array(ns);
      // S: the swell and pinch both edges share (the line's width breathes along its length).
      // L, R: finer independent ragged detail on each edge.
      var ps1 = o.h * 0.03, ps2 = o.h * 0.012, pf1 = o.h * 0.008, pf2 = o.h * 0.0035, pb = o.h * 0.008;
      for (var j = 0; j < ns; j++) {
        var y = j * step;
        S[j] = 0.75 * nS1(y / ps1) + 0.25 * nS2(y / ps2);
        L[j] = 0.7 * nL1(y / pf1) + 0.3 * nL2(y / pf2);
        R[j] = 0.7 * nR1(y / pf1) + 0.3 * nR2(y / pf2);
        B[j] = nB(y / pb);
      }
      lines.push({ L: L, R: R, B: B, S: S });
    }
    cache = { key: key, step: step, ns: ns, lines: lines };
    return cache;
  }

  function ramp(u) { return Math.pow(u, 1.1); } // 0 at thin side, 1 at thick side

  // Per line, wave order k: segment [y0, y1], tip y (or -1), width factor.
  function frameState(o) {
    var N = o.count, h = o.h;
    var half = o.duration / 2, sc = half / PH_SUM;
    var e = PH[0] * sc, g = PH[1] * sc, d = PH[2] * sc;
    var lt = ((o.t % o.duration) + o.duration) % o.duration;
    var second = lt >= half;
    var tau = second ? lt - half : lt;
    var out = [];
    var stag = (1 - D_LINE) / Math.max(1, N - 1);
    for (var k = 0; k < N; k++) {
      var s = N > 1 ? k / (N - 1) : 0;
      var uA = s, uB = 1 - s;               // A thick at wave end, B thick at wave start
      var fromU = second ? uB : uA, toU = second ? uA : uB;
      var st = { y0: 0, y1: 0, tip: -1, u: fromU, fw: 1 };
      if (tau < e) {
        var p = tau / e, q = clamp01((p - k * stag) / D_LINE);
        var ty = h * easeTip(q);
        st.y0 = ty; st.y1 = h; st.tip = ty; st.u = fromU;
        st.fw = 1 - 0.88 * easeSine(clamp01((p - 0.12 * s) / 0.5));
      } else if (tau < e + g) {
        st.y0 = st.y1 = 0;
      } else if (tau < e + g + d) {
        var p2 = (tau - e - g) / d, q2 = clamp01((p2 - k * stag) / D_LINE);
        var ty2 = h * easeTip(q2);
        st.y0 = 0; st.y1 = ty2; st.tip = ty2; st.u = toU;
        st.fw = 0.12 + 0.88 * easeSine(clamp01((p2 - 0.3 * s) / 0.7));
      } else {
        st.y0 = 0; st.y1 = h; st.u = toU; st.fw = 1;
      }
      out.push(st);
    }
    return out;
  }

  function setup(canvas, o) {
    var dpr = root.devicePixelRatio || 1;
    var pw = Math.round(o.w * dpr), ph = Math.round(o.h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    canvas.style.width = o.w + 'px'; canvas.style.height = o.h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function render(ctx, o) {
    var f = field(o), N = o.count, pitch = o.w / N, step = f.step;
    var maxW = o.maxWeight * pitch, minW = Math.max(o.minWeight * pitch, 0.75);
    var states = frameState(o);
    ctx.fillStyle = o.ground;
    ctx.fillRect(0, 0, o.w, o.h);
    ctx.fillStyle = o.ink;
    ctx.beginPath();
    var tipZone = o.h * 0.07;
    for (var k = 0; k < N; k++) {
      var st = states[k];
      if (st.y1 - st.y0 < 0.5) continue;
      var ln = f.lines[k];
      var cx = (k + 0.5) * pitch;
      if (o.dir < 0) cx = o.w - cx;
      var target = minW + (maxW - minW) * ramp(st.u);
      var wdt = minW + (target - minW) * st.fw;
      var hw = wdt / 2;
      var swell = o.edge * 0.46 * hw, amp = o.edge * (0.1 * hw + 0.2 * minW);
      var thin = Math.pow(clamp01(1 - (wdt - minW) / (0.12 * pitch)), 2); // 1 for hairlines, 0 from 12% of pitch up
      var j0 = Math.floor(st.y0 / step), j1 = Math.ceil(st.y1 / step);
      if (j1 > f.ns - 1) j1 = f.ns - 1;
      var xs = [], ys = [], xr = [];
      for (var j = j0; j <= j1; j++) {
        var y = j * step;
        if (y < st.y0) y = st.y0;
        if (y > st.y1) y = st.y1;
        var m = 1;
        if (st.tip > 1 && st.tip < o.h - 1 && o.edge > 0 && thin > 0) {
          var dist = Math.abs(y - st.tip);
          if (dist < tipZone) {
            var near = 1 - dist / tipZone;               // 1 at the tip
            // hairlines break into short dashes near the moving tip: a hard gap, not a pinch
            m = (ln.B[j] * 0.5 + 0.5) < near * 0.75 * thin * o.edge ? 0 : 1;
          }
        }
        var hs = hw + swell * ln.S[j];
        xs.push(cx - (hs + amp * ln.L[j]) * m);
        xr.push(cx + (hs + amp * ln.R[j]) * m);
        ys.push(y);
      }
      if (ys.length < 2) continue;
      ctx.moveTo(xs[0], ys[0]);
      for (var a = 1; a < ys.length; a++) ctx.lineTo(xs[a], ys[a]);
      for (var b = ys.length - 1; b >= 0; b--) ctx.lineTo(xr[b], ys[b]);
      ctx.closePath();
    }
    ctx.fill();
  }

  function opts(o) {
    var r = {};
    for (var k in DEFAULTS) r[k] = DEFAULTS[k];
    if (o) for (var k2 in o) if (o[k2] !== undefined && o[k2] !== null) r[k2] = o[k2];
    return r;
  }

  function draw(canvas, o) {
    var r = opts(o);
    render(setup(canvas, r), r);
  }

  function play(canvas, o) {
    var r = opts(o), ctx = setup(canvas, r), start = null, raf = 0, t0 = r.t || 0, alive = true;
    function tick(now) {
      if (!alive) return;
      if (start === null) start = now;
      r.t = t0 + (now - start) / 1000;
      render(ctx, r);
      raf = root.requestAnimationFrame(tick);
    }
    raf = root.requestAnimationFrame(tick);
    return function stop() { alive = false; root.cancelAnimationFrame(raf); };
  }

  root.Lines = { draw: draw, play: play, defaults: DEFAULTS };
})(typeof window !== 'undefined' ? window : this);

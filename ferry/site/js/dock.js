// The departure dock, alive: the rowboats study (ferry/assets/rowboats/index.html) moved into a module.
// Seven boats painted in gouache by Paint, cut out as sprites, take turns backing out of their berths and rowing
// away, then come back bow first. Tap the water for a painted wave that rocks the boats; tap a boat to send it out.
// Changes from the study: everything is drawn in plate pixels into a layer the caller transforms; open water
// continues above the plate (the page paints it), so boats row on past the plate's top instead of vanishing;
// only boats 4 and 5 keep the schedule: they row out between the headline and the line beside it.
const BASE = '../assets/rowboats/';
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const img = src => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; });

export const LOOP = 20;
// [boat, leave start, leave end, return start, return end]
const TRIPS = [[4, 0.5, 6.5, 10, 16], [5, 4.5, 10.5, 13.6, 19.6]];
const BACK = { 0: [-.15, -.99], 1: [-.12, -.99], 2: [0, -1], 3: [.1, -.99], 4: [0, -1], 5: [-.37, -.93], 6: [.12, -.99] };
const V = 150, WAVE_LIFE = 3.2;

function shadowOf(spr) {
  const c = document.createElement('canvas'); c.width = spr.width + 40; c.height = spr.height + 40; const o = c.getContext('2d');
  o.filter = 'blur(7px)'; o.drawImage(spr, 20, 20); o.filter = 'none'; o.globalCompositeOperation = 'source-in';
  o.fillStyle = 'rgb(10,26,32)'; o.fillRect(0, 0, c.width, c.height); return c;
}

export async function loadDock() {
  const meta = await (await fetch(BASE + 'sprites.json')).json();
  const W = meta.W, H = meta.H, plate = await img(BASE + 'plate.png');
  const BOATS = [];
  for (const b of meta.boats) { b.spr = await img(`${BASE}boat${b.i}.png`); b.shadow = shadowOf(b.spr); BOATS.push(b); }

  // the plate's water, read once: where blue leads red the study counts it as water
  const mc = document.createElement('canvas'); mc.width = W; mc.height = H; const mo = mc.getContext('2d', { willReadFrequently: true });
  mo.drawImage(plate, 0, 0); const pd = mo.getImageData(0, 0, W, H);
  const water = new Uint8Array(W * H);
  for (let i = 0, k = 0; k < water.length; i += 4, k++) water[k] = pd.data[i + 2] - pd.data[i] >= 6 ? 1 : 0;
  for (let i = 0, k = 0; k < water.length; i += 4, k++) { const v = water[k] ? 255 : 0; pd.data[i] = pd.data[i + 1] = pd.data[i + 2] = 255; pd.data[i + 3] = v; }
  mo.putImageData(pd, 0, 0);
  const mcBlur = document.createElement('canvas'); mcBlur.width = W; mcBlur.height = H;
  { const b = mcBlur.getContext('2d'); b.filter = 'blur(3px)'; b.drawImage(mc, 0, 0); }
  const isWater = (x, y) => { x = Math.round(x); y = Math.round(y); if (x < 0 || x >= W) return false; if (y < 0) return true; if (y >= H) return false; return water[y * W + x] === 1; };

  let s = 11; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const RIP = [];
  for (let tries = 0; RIP.length < 300 && tries < 40000; tries++) {
    const x = Math.floor(r() * W), y = Math.floor(r() * H * .86); if (!water[y * W + x]) continue;
    RIP.push({ x, y, len: 10 + r() * 22, h: 1.6 + r() * 1.6, light: r() < .6, ph: r(), per: LOOP / (4 + Math.floor(r() * 4)), drift: 3 + r() * 4 });
  }

  let O = 0, autopilot = true, lastClick = -1e9; const USER = {}, WAVES = [], TRAIL = [];
  let frozen = false;
  function tripFor(b, T) {
    if (USER[b.i]) return { tr: USER[b.i], t: T };
    if (!autopilot && !frozen) return null;
    const tl = (((T - O) % LOOP) + LOOP) % LOOP; for (const tr of TRIPS) if (tr[0] === b.i) return { tr: tr.slice(1), t: tl };
    return null;
  }
  function pose(b, T) {
    let d = 0, dir = 1, moving = 0; const w = Math.PI * 2 / LOOP, rot0 = Math.sin(T * w * 2 + b.i * 1.3) * .006, dy = Math.sin(T * w * 3 + b.i) * .8;
    const D = b.cy + b.L * 1.2, f = tripFor(b, T);
    if (f) {
      const [a0, a1, r0, r1] = f.tr, t = f.t;
      if (t >= a0 && t < a1) { const u = (t - a0) / (a1 - a0); d = (u * u * (3 - 2 * u) * .7 + u * u * .3) * D; moving = 1; dir = b.i % 2 ? 1 : -1; }
      else if (t >= a1 && t < r0) d = D * 1.4;
      else if (t >= r0 && t < r1) { const u = (t - r0) / (r1 - r0); d = Math.pow(1 - u, 2.4) * D; moving = 1; dir = b.i % 2 ? -1 : 1; }
    }
    const clear = b.L * 1.05, k = ss(clear * .8, clear * 1.6, d), straight = Math.min(d, clear), beyond = Math.max(0, d - clear), bk = BACK[b.i] || [0, -1];
    const arc = Math.sin(Math.min(1, beyond / (D - clear)) * Math.PI);
    let x = b.cx + bk[0] * straight - b.ax[0] * beyond + (-b.ax[1]) * arc * 44 * dir * k;
    let y = b.cy + bk[1] * straight - b.ax[1] * beyond + b.ax[0] * arc * 44 * dir * k + dy * (1 - k);
    let rot = rot0 + Math.sin(Math.min(1, beyond / (D - clear)) * Math.PI * .9) * .1 * dir * k;
    for (const wv of WAVES) {
      const dist = Math.hypot(x - wv.x, y - wv.y), hit = wv.t0 + Math.max(0, dist - b.L * .4) / V, dt = T - hit; if (dt <= 0 || dt > 4.5) continue;
      const amp = wv.amp * Math.exp(-1.3 * dt) * Math.sin(dt * 6.5) / (1 + dist / 380), ux = (x - wv.x) / (dist || 1), uy = (y - wv.y) / (dist || 1);
      rot += amp * .04; x += ux * amp * 4; y += uy * amp * 4;
    }
    return { x, y, rot, moving, away: d > b.L * 1.3 };
  }
  function ring(g, x, y, age) { const R = 12 + age * 34, a = .32 * (1 - age / 2.6); g.strokeStyle = `rgba(190,220,224,${a})`; g.lineWidth = 2.2 - age * .5; g.beginPath(); g.ellipse(x, y, R * 1.25, R, 0, 0, Math.PI * 2); g.stroke(); }
  function rings(g, T) {
    if (frozen) {
      for (const b of BOATS) for (const [i, a0, a1, r0, r1] of TRIPS) {
        if (i !== b.i) continue;
        for (const [s0, s1] of [[a0, a1], [r0, r1]]) for (let te = s0; te < s1; te += .42) { const age = T - te; if (age < 0 || age > 2.6) continue; const p = pose(b, te); ring(g, p.x, p.y, age); }
      }
      return;
    }
    for (const q of TRAIL) { const age = T - q.t; if (age >= 0 && age <= 2.6) ring(g, q.x, q.y, age); }
  }
  function ripples(g, t) {
    for (const q of RIP) {
      const p = ((t / q.per + q.ph) % 1), a = Math.sin(p * Math.PI) * .26; if (a < .02) continue; const x = q.x + (p - .5) * q.drift * q.per;
      const c = q.light ? '150,190,190' : '14,40,48';
      for (let k = 0; k < 3; k++) {
        const w = q.len * (.45 + .25 * ((k * 37 + q.x) % 5) / 5), dx = (k - 1) * q.len * .32, dy = ((k * 13 + q.x) % 3 - 1) * q.h * .6;
        g.save(); g.translate(x + dx, q.y + dy); g.rotate(((q.x * 7 + k * 11) % 9 - 4) * .012); g.fillStyle = `rgba(${c},${a * (k === 1 ? 1 : .7)})`; g.fillRect(-w / 2, -q.h / 2, w, q.h * 1.3); g.restore();
      }
    }
  }
  // the viewer's waves: rings of brush dabs, kept to the water (open water above the plate counts)
  let waveCv, waveMask;
  function waves(g, T, ext) {
    if (!WAVES.length) return;
    const cv = g.canvas;
    if (!waveCv || waveCv.width !== cv.width || waveCv.height !== cv.height) {
      waveCv = document.createElement('canvas'); waveCv.width = cv.width; waveCv.height = cv.height;
      waveMask = document.createElement('canvas'); waveMask.width = cv.width; waveMask.height = cv.height;
    }
    const m = waveMask.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, cv.width, cv.height);
    m.setTransform(g.getTransform()); m.fillStyle = '#fff'; m.fillRect(-10, -ext, W + 20, ext + 2); m.drawImage(mcBlur, 0, 0);
    const q = waveCv.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, waveCv.width, waveCv.height); q.setTransform(g.getTransform());
    for (let n = WAVES.length - 1; n >= 0; n--) {
      const wv = WAVES[n], age = T - wv.t0; if (age > WAVE_LIFE + 1) { WAVES.splice(n, 1); continue; } if (age < 0) continue;
      for (let ri = 0; ri < 2; ri++) {
        const rr0 = V * age - ri * 26; if (rr0 < 4) continue; const life = 1 - age / WAVE_LIFE; if (life <= 0) continue;
        const N = Math.min(90, Math.max(8, Math.floor(rr0 * .12))), a0 = .52 * wv.amp * life * life * (1 - ri * .35);
        for (let k = 0; k < N; k++) {
          const h1 = Math.sin(k * 12.9898 + ri * 4.1 + wv.seed * 7) * 43758.5453, j1 = h1 - Math.floor(h1), h2 = Math.sin(k * 78.233 + ri * 2.7 + wv.seed * 3) * 24634.6345, j2 = h2 - Math.floor(h2);
          if (j2 < .22) continue;
          const th = (k + (j1 - .5) * .8) / N * Math.PI * 2 + ri * .21 + wv.seed, rr = rr0 + (j2 - .5) * 16 + (j1 - .5) * 10;
          const x = wv.x + Math.cos(th) * rr, y = wv.y + Math.sin(th) * rr, len = (8 + j1 * 16) * (1 + ri * .1), th2 = th + Math.PI / 2 + (j2 - .5) * .6, light = j1 > .33;
          q.save(); q.translate(x, y); q.rotate(th2); q.fillStyle = light ? `rgba(206,232,234,${a0 * (.45 + .55 * j2)})` : `rgba(8,30,38,${a0 * (.5 + .4 * j1)})`;
          q.fillRect(-len / 2, -(1.7 + j2), len, 3.4 + j2 * 1.8); q.restore();
        }
      }
    }
    q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'destination-in'; q.drawImage(waveMask, 0, 0); q.globalCompositeOperation = 'source-over';
    const tf = g.getTransform(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(waveCv, 0, 0); g.setTransform(tf);
  }

  function draw(g, T, isFrozen, ext) {
    frozen = isFrozen;
    if (frozen) T = ((T % LOOP) + LOOP) % LOOP;
    ripples(g, T); waves(g, T, ext); rings(g, T);
    const poses = BOATS.map(b => [b, pose(b, T)]).sort((p, q) => p[1].moving - q[1].moving);
    if (!frozen) for (const [b, p] of poses) if (p.moving && (!b.lastEmit || T - b.lastEmit > .42)) { TRAIL.push({ x: p.x, y: p.y, t: T }); b.lastEmit = T; }
    while (TRAIL.length && T - TRAIL[0].t > 3) TRAIL.shift();
    for (const [b, p] of poses) { if (p.y < -ext) continue; g.save(); g.translate(p.x + 10, p.y + 8); g.rotate(p.rot); g.globalAlpha = .42; g.drawImage(b.shadow, b.x0 - b.cx - 20, b.y0 - b.cy - 20); g.restore(); }
    for (const [b, p] of poses) { if (p.y < -ext) continue; g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.drawImage(b.spr, b.x0 - b.cx, b.y0 - b.cy); g.restore(); }
    if (!frozen && !autopilot && T - lastClick > 12 && !Object.keys(USER).length) { autopilot = true; O = T; }
    for (const i of Object.keys(USER)) if (T > USER[i][3]) delete USER[i];
  }

  function boatAt(x, y, T) {
    for (const b of BOATS) {
      const p = pose(b, T); if (p.away) continue; const dx = x - p.x, dy = y - p.y, u = dx * b.ax[0] + dy * b.ax[1], v = -dx * b.ax[1] + dy * b.ax[0];
      if (Math.abs(u) < b.L * .5 && Math.abs(v) < b.L * .16) return [b, p];
    }
    return null;
  }
  function handOver(T) {
    if (!autopilot) return; const tl = (((T - O) % LOOP) + LOOP) % LOOP;
    for (const [i, a0, a1, r0, r1] of TRIPS) if (tl >= a0 && tl < r1) USER[i] = [a0, a1, r0, r1].map(v => v - tl + T);
    autopilot = false;
  }
  // a tap: on a boat sends it out, on water lays a wave. amp < 1 for the pointer's passing waves.
  function poke(x, y, T, amp = 1) {
    const hit = amp === 1 && boatAt(x, y, T);
    if (hit) {
      const [b, p] = hit; handOver(T); lastClick = T; WAVES.push({ x: p.x, y: p.y, t0: T, seed: Math.random() * 6, amp: 1 });
      if (!USER[b.i]) { const tr = TRIPS.find(q => q[0] === b.i) || [b.i, 0, 6, 9.5, 15.5]; USER[b.i] = [T, T + (tr[2] - tr[1]), T + (tr[3] - tr[1]), T + (tr[4] - tr[1])]; }
      return 'boat';
    }
    if (!isWater(x, y)) return null;
    WAVES.push({ x, y, t0: T, seed: Math.random() * 6, amp });
    return 'water';
  }
  return { W, H, draw, poke, boatAt: (x, y, T) => !!boatAt(x, y, T), isWater };
}

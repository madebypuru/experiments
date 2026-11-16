// The lighthouse on stilts: Paint's four gouache plates of one scene (day, golden, dusk, night), adapted from
// ferry/assets/lighthouse for the site. Nothing here runs on the study's 24 s timer: draw(S) paints one moment
// from a state the caller computes (the hour, which lamps are lit, the beam, the ferry, the rings on the water).
// Only idle life reads S.t: the water's shimmer, the lamps' flicker, the moored ferry's bob.
const BASE = '../assets/lighthouse/';
export const W = 952, H = 1428;
export const LANTERN = { x: 482, y: 306 }, MOOR = [722, 1236];
export const WINDOWS = [[427, 515, 1.0], [422, 665, .9], [582, 740, 1], [705, 760, .8], [345, 700, .9], [717, 978, 1], [634, 780, .7]];
// the crossing: out from under the west pier, across the near water, in to the mooring by the east pier
export const ROUTE = [[40, 1394], [190, 1404], [340, 1396], [480, 1370], [590, 1326], [668, 1276], [MOOR[0], MOOR[1]]];
const LOOP = 24, FLAT = .36, V = 160, WAVE_LIFE = 3.3, FLATW = .42;

const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
export function bez(p, u) {
  const n = p.length - 1, s = Math.min(n - 1e-6, Math.max(0, u) * n), i = Math.floor(s), f = s - i;
  const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(n, i + 2)];
  const q = k => .5 * ((2 * b[k]) + (-a[k] + c[k]) * f + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * f * f + (-a[k] + 3 * b[k] - 3 * c[k] + d[k]) * f * f * f);
  return [q(0), q(1)];
}
// the hour, on the study's clock: dusk at 11, night 14 to 19, dawn back through dusk to day at 24
export function stage(t) {
  const k = [[0, 5, 'day', 'day'], [5, 8, 'day', 'golden'], [8, 11, 'golden', 'dusk'], [11, 14, 'dusk', 'night'], [14, 19, 'night', 'night'], [19, 21.5, 'night', 'dusk'], [21.5, 24, 'dusk', 'day']];
  for (const [a, b, p, q] of k) if (t >= a && t < b) return { p, q, m: ss(a, b, t) };
  return { p: 'day', q: 'day', m: 0 };
}
export const nightAt = t => t < 10 ? 0 : t < 13 ? ss(10, 13, t) : t < 19 ? 1 : ss(21.5, 19, t);
const AMB = { day: [1, 1, 1], golden: [1, .9, .74], dusk: [.8, .78, .92], night: [.36, .41, .66] };
// the beam's angle in its flattened plane: free, or swung onto a target as guide goes to 1
export function beamAngle(free, guide, target) {
  if (guide <= 0) return free;
  const aim = Math.atan2((target[1] - LANTERN.y) / FLAT, target[0] - LANTERN.x);
  return free + wrap(aim - free) * guide;
}

export async function loadLighthouse() {
  const plates = {};
  await Promise.all(['day', 'golden', 'dusk', 'night'].map(n => new Promise((r, j) => { const i = new Image(); i.onload = () => { plates[n] = i; r(); }; i.onerror = j; i.src = BASE + n + '.png'; })));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

  // Paint lifts a hard white disc for the moon; repaint it soft, in a haze
  const MOON = { x: 808, y: 114, r: 22 };
  function softenMoon(img) {
    const c = mk(), o = c.getContext('2d'); o.drawImage(img, 0, 0, W, H);
    const pr = MOON.r * 2.6, pc = document.createElement('canvas'); pc.width = pc.height = Math.ceil(pr * 2); const pg = pc.getContext('2d');
    pg.filter = 'blur(14px)'; pg.drawImage(img, MOON.x - pr - 40, MOON.y - pr, pr * 2, pr * 2, -40, 0, pr * 2, pr * 2); pg.drawImage(img, MOON.x - pr, MOON.y - pr, pr * 2, pr * 2, 0, 0, pr * 2, pr * 2); pg.filter = 'none';
    const fm = pg.createRadialGradient(pr, pr, 0, pr, pr, pr); fm.addColorStop(0, 'rgba(0,0,0,1)'); fm.addColorStop(.55, 'rgba(0,0,0,1)'); fm.addColorStop(1, 'rgba(0,0,0,0)');
    pg.globalCompositeOperation = 'destination-in'; pg.fillStyle = fm; pg.fillRect(0, 0, pr * 2, pr * 2); o.drawImage(pc, MOON.x - pr, MOON.y - pr);
    const halo = o.createRadialGradient(MOON.x, MOON.y, 0, MOON.x, MOON.y, MOON.r * 5); halo.addColorStop(0, 'rgba(236,230,214,.22)'); halo.addColorStop(.35, 'rgba(200,205,225,.07)'); halo.addColorStop(1, 'rgba(200,205,225,0)');
    o.fillStyle = halo; o.fillRect(MOON.x - MOON.r * 5, MOON.y - MOON.r * 5, MOON.r * 10, MOON.r * 10);
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * MOON.r * .92, x = MOON.x + Math.cos(a) * d, y = MOON.y + Math.sin(a) * d, sh = d / MOON.r;
      const v = Math.round(244 - sh * 22 - rnd() * 10); o.fillStyle = `rgba(${v},${v - 6},${v - 20},${.55 + rnd() * .4})`;
      o.save(); o.translate(x, y); o.rotate((rnd() - .5) * .8); o.fillRect(-4, -1.5, 8, 3); o.restore();
    }
    return c;
  }

  // short light and dark dabs on the water only, smaller and fainter toward the horizon
  const RIP = [];
  function makeRipples(img) {
    const c = mk(), o = c.getContext('2d'); o.drawImage(img, 0, 0, W, H); const d = o.getImageData(0, 0, W, H).data;
    for (let tries = 0; RIP.length < 380 && tries < 60000; tries++) {
      const x = Math.floor(rnd() * W), y = Math.floor(380 + rnd() * (H - 385)), k = (y * W + x) * 4;
      if (d[k + 2] - d[k] < 8) continue;
      const depth = (y - 380) / (H - 380);
      RIP.push({ x, y, len: 7 + depth * 26 * (.6 + rnd() * .8), h: 1.2 + depth * 2.2, light: rnd() < .55, ph: rnd(), per: LOOP / (5 + Math.floor(rnd() * 5)), drift: 3 + rnd() * 5, depth });
    }
  }
  function ripples(t, amb, n) {
    for (const r of RIP) {
      const p = ((t / r.per + r.ph) % 1), a = Math.sin(p * Math.PI) * (.12 + .24 * r.depth); if (a < .02) continue;
      const x = r.x + (p - .5) * r.drift * r.per, col = r.light ? [206, 226, 232] : [30, 66, 96], m = r.light ? amb : [1, 1, 1];
      const c = `${Math.round(col[0] * m[0])},${Math.round(col[1] * m[1])},${Math.round(col[2] * m[2])}`;
      for (let k = 0; k < 3; k++) {
        const w = r.len * (.45 + .25 * ((k * 37 + r.x) % 5) / 5), h = r.h * (1.4 + ((r.y + k) % 3) * .35), dx = (k - 1) * r.len * .32, dy = ((k * 13 + r.x) % 3 - 1) * r.h * .6;
        g.save(); g.translate(x + dx, r.y + dy); g.rotate(((r.x * 7 + k * 11) % 9 - 4) * .012); g.fillStyle = `rgba(${c},${a * (r.light ? 1 - .5 * n : 1) * (k === 1 ? 1 : .7)})`; g.fillRect(-w / 2, -h / 2, w, h); g.restore();
      }
    }
  }

  function glow(x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(.35, `rgba(${col},${a * .45})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }

  // the lamps, each lit on its own; the sweeping beam at its angle and strength
  const bc = mk();
  function lights(t, lamps, ang, sweep) {
    g.save(); g.globalCompositeOperation = 'screen';
    if (sweep > .01) {
      const q = bc.getContext('2d'); q.clearRect(0, 0, W, H); const L = 1250;
      for (const s0 of [0, Math.PI]) {
        const a = ang + s0, toward = Math.sin(a), k = sweep * (1 - ss(.05, .75, toward)); if (k <= .01) continue;
        q.save(); q.translate(LANTERN.x, LANTERN.y); q.scale(1, FLAT);
        for (const [sp, al] of [[.045, .32], [.1, .13], [.17, .06]]) {
          const gr = q.createRadialGradient(0, 0, 4, 0, 0, L); gr.addColorStop(0, `rgba(255,226,170,${al * k * 2})`); gr.addColorStop(.45, `rgba(255,220,160,${al * k})`); gr.addColorStop(1, 'rgba(255,220,160,0)');
          q.fillStyle = gr; q.beginPath(); q.moveTo(0, 0); q.arc(0, 0, L, a - sp, a + sp); q.closePath(); q.fill();
        }
        q.restore();
      }
      g.filter = 'blur(14px)'; g.drawImage(bc, 0, 0); g.filter = 'none';
    }
    const ln = lamps.lantern;
    if (ln > .01) { glow(LANTERN.x, LANTERN.y, 92, '255,214,140', .9 * ln); glow(LANTERN.x, LANTERN.y, 18, '255,246,220', ln); }
    WINDOWS.forEach(([x, y, s], i) => { const a = lamps.win[i] * s * (.85 + .15 * Math.sin(t * 1.7 + i * 2.3)); if (a > .01) { glow(x, y, 150, '255,170,90', .2 * a); glow(x, y, 46, '255,186,110', .5 * a); glow(x, y, 12, '255,220,160', .95 * a); } });
    if (ln > .01) for (let k = 0; k < 16; k++) {
      const yy = 1205 + k * 12 + ((k * 7) % 5) - 2, w = (6 + ((k * 29) % 11) + k * 1.4) * (.7 + .3 * Math.sin(t * 2.2 + k * 1.9)), x = 452 + Math.sin(t * 1.1 + k * 2.3) * (5 + k * .6) + ((k * 13) % 7 - 3);
      g.fillStyle = `rgba(255,214,150,${.3 * ln * (1 - k / 18) * (.6 + .4 * Math.sin(t * 3 + k))})`; g.save(); g.translate(x, yy); g.rotate(((k * 5) % 7 - 3) * .03); g.fillRect(-w / 2, -1.5, w, 2.5 + ((k * 3) % 2)); g.restore();
    }
    g.restore();
  }

  // the ferry: flat shapes rebuilt from short brush dabs sampled from them, so the edges break up like gouache
  function paintedFerry(L) {
    const B = L * .28, Wd = Math.ceil(L * 4), Hd = Math.ceil(B * 6), ox = L * 2.9, oy = Hd / 2;
    const base = document.createElement('canvas'); base.width = Wd; base.height = Hd; const b = base.getContext('2d'); b.translate(ox, oy);
    const hull = (dy, h, col, inset = 0) => { b.fillStyle = col; b.beginPath(); b.moveTo(-L * .5 + inset, -h / 2 + dy); b.lineTo(L * .3 - inset, -h / 2 + dy); b.quadraticCurveTo(L * .5 - inset * 1.5, dy, L * .3 - inset, h / 2 + dy); b.lineTo(-L * .5 + inset, h / 2 + dy); b.closePath(); b.fill(); };
    hull(B * .13, B, 'rgb(30,58,90)');
    hull(-B * .03, B * .84, 'rgb(232,228,218)', L * .01);
    b.fillStyle = 'rgb(250,248,242)'; b.fillRect(-L * .36, -B * .3, L * .56, B * .54);
    b.fillStyle = 'rgb(46,66,88)'; b.fillRect(-L * .34, B * .05, L * .52, B * .12);
    for (let k = 0; k < 8; k++) { b.fillStyle = 'rgb(222,220,214)'; b.fillRect(-L * .34 + k * L * .066, B * .05, L * .008, B * .12); }
    b.fillStyle = 'rgb(200,198,192)'; b.fillRect(-L * .36, B * .2, L * .56, B * .05);
    b.fillStyle = 'rgb(244,242,236)'; b.fillRect(-L * .22, -B * .24, L * .3, B * .3);
    b.fillStyle = 'rgb(52,72,94)'; b.fillRect(-L * .2, -B * .02, L * .26, B * .06);
    b.fillStyle = 'rgb(248,246,240)'; b.fillRect(L * .1, -B * .2, L * .13, B * .36);
    b.fillStyle = 'rgb(40,58,80)'; b.fillRect(L * .2, -B * .16, L * .025, B * .28);
    b.fillStyle = 'rgb(194,90,58)'; b.beginPath(); b.ellipse(-L * .04, -B * .1, L * .04, B * .13, 0, 0, Math.PI * 2); b.fill();
    b.fillStyle = 'rgb(40,40,46)'; b.fillRect(-L * .055, -B * .17, L * .03, B * .05);
    b.strokeStyle = 'rgb(70,70,78)'; b.lineWidth = Math.max(1, L * .008); b.beginPath(); b.moveTo(L * .26, -B * .05); b.lineTo(L * .34, -B * .05); b.stroke();
    for (const x of [-L * .44, L * .22]) { b.fillStyle = 'rgb(232,128,40)'; b.beginPath(); b.arc(x, -B * .36, Math.max(1.2, L * .016), 0, Math.PI * 2); b.fill(); }
    b.strokeStyle = 'rgba(255,255,255,.8)'; b.lineWidth = Math.max(.8, L * .005); b.beginPath(); b.moveTo(-L * .48, -B * .42); b.lineTo(L * .3, -B * .42); b.stroke();
    const bd = b.getImageData(0, 0, Wd, Hd).data;
    const out = document.createElement('canvas'); out.width = Wd; out.height = Hd; const o = out.getContext('2d');
    o.filter = `blur(${Math.max(.5, L * .004)}px)`; o.drawImage(base, 0, 0); o.filter = 'none';
    const dw = Math.max(2.4, L * .04), dh = Math.max(1.2, L * .014), N = Math.round(L * L * .14);
    for (let i = 0; i < N; i++) {
      const x = Math.floor(ox - L * .56 + rnd() * L * 1.12), y = Math.floor(oy - B * .72 + rnd() * B * 1.44), k = (y * Wd + x) * 4; if (bd[k + 3] < 100) continue;
      const j = (rnd() - .5) * 16; o.fillStyle = `rgb(${bd[k] + j | 0},${bd[k + 1] + j | 0},${bd[k + 2] + j | 0})`;
      o.save(); o.translate(x + (rnd() - .5) * dw * .3, y + (rnd() - .5) * dh * .6); o.rotate((rnd() - .5) * .35); o.fillRect(-dw / 2, -dh / 2, dw, dh); o.restore();
    }
    const W2 = document.createElement('canvas'); W2.width = Wd; W2.height = Hd; const w = W2.getContext('2d');
    const ww = Math.max(3, L * .055), wh = Math.max(1.6, L * .02);
    for (let i = 0; i < Math.round(L * 7); i++) {
      const u = Math.pow(rnd(), .8), side = rnd() < .5 ? -1 : 1, along = -L * .42 - u * L * 1.7, spread = B * (.35 + u * 1.5) + (rnd() - .5) * B * .6 * (.4 + u);
      const onV = rnd() < .5, y = onV ? side * spread : (rnd() - .5) * B * (.45 + u * .5), a = (1 - u) * (1 - u) * (onV ? .55 : .5) * (.5 + rnd() * .5), sz = .6 + rnd() * 1.1;
      w.fillStyle = `rgba(232,240,240,${a})`; w.save(); w.translate(ox + along + (rnd() - .5) * L * .08, oy + y); w.rotate((rnd() - .5) * .9); w.fillRect(-ww * .6 * sz, -wh * .7 * sz, ww * 1.2 * sz, wh * 1.4 * sz); w.restore();
    }
    return { img: out, wake: W2, ox, oy, L, B };
  }
  const SPR = {}, tc = document.createElement('canvas');
  function ferry(len, st, t, n, amb, rings) {
    st = { ...st, p: [...st.p] };
    for (const wv of rings) {
      const [x, y] = st.p, dist = Math.hypot(x - wv.x, (y - wv.y) / .42), dt = wv.age - Math.max(0, dist - len * .4) / V, k = len / 150; if (dt <= 0 || dt > 4.5) continue;
      const amp = Math.exp(-1.3 * dt) * Math.sin(dt * 5.5) / (1 + dist / 420); st.ang += amp * .04; st.p[1] += amp * 3 * k; st.p[0] += (x - wv.x) / (dist || 1) * amp * 2.5 * k;
    }
    const S = SPR[len] || (SPR[len] = paintedFerry(len)), L = S.L, B = S.B, [x, y] = st.p, ang = st.ang;
    tc.width = S.img.width; tc.height = S.img.height; const c = tc.getContext('2d');
    c.drawImage(S.img, 0, 0); c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgb(${amb.map(v => Math.round(v * 255)).join(',')})`; c.fillRect(0, 0, tc.width, tc.height);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(S.img, 0, 0); c.globalCompositeOperation = 'source-over';
    g.save(); g.translate(x, y); g.rotate(ang); if (Math.cos(ang) < 0) g.scale(1, -1);
    g.globalAlpha = .85 * (1 - .55 * n) * Math.min(1, .15 + st.speed * 1.4); g.drawImage(S.wake, -S.ox, -S.oy);
    g.globalAlpha = 1; g.fillStyle = 'rgba(20,40,70,.22)'; g.beginPath(); g.ellipse(L * .05, B * .5, L * .5, B * .4, 0, 0, Math.PI * 2); g.fill();
    g.drawImage(tc, -S.ox, -S.oy); g.restore();
    if (n > .01) {
      g.save(); g.globalCompositeOperation = 'screen';
      const fl = Math.cos(ang) < 0 ? -1 : 1, P = (px, py) => { py *= fl; return [x + Math.cos(ang) * px - Math.sin(ang) * py, y + Math.sin(ang) * px + Math.cos(ang) * py]; };
      for (let k = 0; k < 8; k++) {
        const [wx, wy] = P(-L * .31 + k * L * .066, B * .11); glow(wx, wy, L * .03, '255,220,150', .9 * n); glow(wx, wy, L * .08, '255,186,110', .25 * n);
        for (let r = 1; r < 6; r++) { g.fillStyle = `rgba(255,200,130,${.18 * n * (1 - r / 6)})`; g.fillRect(wx - 2 + Math.sin(t * 3 + k + r) * 2, wy + r * L * .07, 4, 2); }
      }
      const [mx, my] = P(L * .32, -B * .05); glow(mx, my, L * .09, '255,250,235', .85 * n);
      const [rx, ry] = P(L * .2, -B * .46), [gx, gy] = P(L * .2, B * .46); glow(rx, ry, L * .045, '255,80,60', .7 * n); glow(gx, gy, L * .045, '80,255,140', .6 * n);
      g.restore();
    }
  }

  // the lantern swung down into a searchlight: its pool on the target, a lane of glints on to the mooring
  const sc = mk();
  function searchlight(t, k, T, lane) {
    const q = sc.getContext('2d'); q.clearRect(0, 0, W, H);
    const [tx, ty] = T, dx = tx - LANTERN.x, dy = ty - LANTERN.y, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len, half = 95;
    const gr = q.createLinearGradient(LANTERN.x, LANTERN.y, tx, ty); gr.addColorStop(0, `rgba(255,230,180,${.6 * k})`); gr.addColorStop(.6, `rgba(255,222,165,${.36 * k})`); gr.addColorStop(1, `rgba(255,222,165,${.28 * k})`);
    q.fillStyle = gr; q.beginPath(); q.moveTo(LANTERN.x + nx * 4, LANTERN.y + ny * 4); q.lineTo(tx + nx * half, ty + ny * half * .35); q.lineTo(tx - nx * half, ty - ny * half * .35); q.lineTo(LANTERN.x - nx * 4, LANTERN.y - ny * 4); q.closePath(); q.fill();
    const pool = q.createRadialGradient(tx, ty, 0, tx, ty, 110); pool.addColorStop(0, `rgba(255,226,170,${.5 * k})`); pool.addColorStop(1, 'rgba(255,226,170,0)');
    q.save(); q.translate(tx, ty); q.scale(1, .34); q.translate(-tx, -ty); q.fillStyle = pool; q.fillRect(tx - 110, ty - 110, 220, 220); q.restore();
    g.save(); g.globalCompositeOperation = 'screen'; g.filter = 'blur(10px)'; g.drawImage(sc, 0, 0); g.filter = 'none';
    for (let i = 0; i < 26; i++) { const a = i * 2.399 + t * .9, r = Math.sqrt((i + .5) / 26) * 85; const x = tx + Math.cos(a) * r, y = ty + Math.sin(a) * r * .32; g.fillStyle = `rgba(255,232,190,${.5 * k * (1 - r / 95)})`; g.fillRect(x - 5, y, 10, 2); }
    if (lane) for (let i = 0; i < 18; i++) { const p = lane(i / 17), tw = .55 + .45 * Math.sin(t * 3 + i * 1.7); g.fillStyle = `rgba(255,220,160,${.3 * k * tw})`; g.fillRect(p[0] - 7, p[1] + 14, 14, 2); }
    g.restore();
  }

  // rings on the water, flattened by the high view, kept to the water by a mask cut from the day plate
  const WMASK = mk(), waveCv = mk();
  {
    const o = WMASK.getContext('2d'); o.drawImage(plates.day, 0, 0, W, H); const im = o.getImageData(0, 0, W, H), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const y = Math.floor(i / 4 / W), water = y > 250 && d[i + 2] - d[i] >= 8; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = water ? 255 : 0; }
    o.putImageData(im, 0, 0); o.filter = 'blur(3px)'; o.drawImage(WMASK, 0, 0); o.filter = 'none';
  }
  function waves(rings, amb, n) {
    if (!rings.length) return;
    const q = waveCv.getContext('2d'); q.clearRect(0, 0, W, H); let any = false;
    const Lc = [Math.round(206 * amb[0]), Math.round(232 * amb[1]), Math.round(234 * amb[2])], a1 = 1 - .2 * n;
    for (const wv of rings) {
      const age = wv.age; if (age < 0 || age > WAVE_LIFE) continue; any = true;
      for (let ri = 0; ri < 2; ri++) {
        const r = V * age - ri * 24; if (r < 4) continue; const life = 1 - age / WAVE_LIFE;
        const N = Math.min(80, Math.max(8, Math.floor(r * .11))), a0 = .5 * life * life * (1 - ri * .35);
        for (let k = 0; k < N; k++) {
          const h1 = Math.sin(k * 12.9898 + ri * 4.1 + wv.seed * 7) * 43758.5453, j1 = h1 - Math.floor(h1), h2 = Math.sin(k * 78.233 + ri * 2.7 + wv.seed * 3) * 24634.6345, j2 = h2 - Math.floor(h2);
          if (j2 < .22) continue;
          const th = (k + (j1 - .5) * .8) / N * Math.PI * 2 + ri * .21 + wv.seed, rr = r + (j2 - .5) * 14 + (j1 - .5) * 8;
          const x = wv.x + Math.cos(th) * rr, y = wv.y + Math.sin(th) * rr * FLATW, len = (9 + j1 * 15) * (1 + ri * .1) * (.6 + .4 * Math.abs(Math.sin(th))), light = j1 > .33;
          const tang = Math.atan2(Math.cos(th) * FLATW, -Math.sin(th)) + (j2 - .5) * .4;
          q.save(); q.translate(x, y); q.rotate(tang); q.fillStyle = light ? `rgba(${Lc},${a0 * a1 * (.45 + .55 * j2)})` : `rgba(14,34,56,${a0 * (.45 + .4 * j1)})`;
          q.fillRect(-len / 2, -(1.7 + j2), len, 3.4 + j2 * 1.8); q.restore();
        }
      }
    }
    if (!any) return;
    q.globalCompositeOperation = 'destination-in'; q.drawImage(WMASK, 0, 0); q.globalCompositeOperation = 'source-over'; g.drawImage(waveCv, 0, 0);
  }

  plates.night = softenMoon(plates.night);
  makeRipples(plates.day);

  // S = {hour, n, t, lamps:{lantern, win[7]}, beam:{ang, sweep, search, target, lane}, ferry:{p, ang, speed}, rings:[{x,y,age,seed}]}
  function draw(S) {
    seed = 99;
    const st = stage(S.hour), n = S.n;
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.drawImage(plates[st.p], 0, 0, W, H);
    if (st.m > 0) { g.globalAlpha = st.m; g.drawImage(plates[st.q], 0, 0, W, H); g.globalAlpha = 1; }
    const a = AMB[st.p], b = AMB[st.q], amb = [0, 1, 2].map(i => lerp(a[i], b[i], st.m));
    ripples(S.t, amb, n); waves(S.rings, amb, n);
    lights(S.t, S.lamps, S.beam.ang, S.beam.sweep);
    if (S.ferry) ferry(150, S.ferry, S.t, n, amb, S.rings);
    if (S.beam.search > .01) searchlight(S.t, S.beam.search, S.beam.target, S.beam.lane);
    return cv;
  }
  return { canvas: cv, draw };
}

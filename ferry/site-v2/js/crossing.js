// Beat 3, "The crossing". The lighthouse painting fills the screen and scroll is its clock: dusk deepens as the
// visitor arrives over the water, the ticket from the pier settles in the corner, and from the second it leaves the
// lamps light one by one, one per confirmation, while the ferry carrying it crosses the near water. At full night
// the beam swings off its sweep and holds on the ferry; at 41 seconds it moors and the FERRY POST postmark strikes
// the ticket at 12:04:44, with one ring spreading from the mooring. Then night lifts toward morning.
//
// Every story value below is a pure function of scroll (pre, local, tail), so it scrubs both ways and stops
// anywhere. Only idle life (shimmer, flicker, the beam's breathing and slow drift, the moored bob) reads time.
import { register } from './shell.js';
import { loadLighthouse, W, H, MOOR, ROUTE, bez, nightAt, beamAngle } from './lighthouse.js';
import { handPose } from './pier.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, k) => a + (b - a) * k;

// the script, in the section's local progress
const GO = 0.2, ARRIVE = 0.8, SECS = 41;
const eAt = L => SECS * clamp((L - GO) / (ARRIVE - GO));
const Lof = e => GO + (ARRIVE - GO) * e / SECS;
// sample crossing: left 12:04:03, arrives 12:04:44. Each fact lights its lamps (window indices into WINDOWS).
const STEPS = [
  { e: 0, line: 'Left Solana 12:04:03', lamps: ['lantern'] },
  { e: 2, line: 'Confirmed on Solana 12:04:05', lamps: [0, 1] },
  { e: 16, line: 'Confirmed on the route 12:04:19', lamps: [4, 2] },
  { e: 30, line: 'Reached Ethereum 12:04:33', lamps: [3, 6] },
  { e: 38, line: 'Confirmed on Ethereum 12:04:41', lamps: [5] },
  { e: 41, line: 'Arrived 12:04:44', lamps: [] },
];
// where the camera looks (plate y), keyed on u: pre-roll -1..0, the pin 0..1, the hand-over 1..1.25
const CAM = [[-1, 1130], [-0.25, 1130], [0.12, 545], [0.3, 545], [0.4, 420], [0.47, 440], [0.62, 1110], [0.8, 1085], [0.88, 1085], [1, 700], [1.25, 620]];
const camY = u => { for (let i = 1; i < CAM.length; i++) if (u <= CAM[i][0]) { const [a, ya] = CAM[i - 1], [b, yb] = CAM[i]; return lerp(ya, yb, ss(a, b, u)); } return CAM[CAM.length - 1][1]; };
// the hour on the scene's clock: 11 dusk (the pier's hour, deepening as the visitor arrives), 13 night, held to 19, back through dusk toward day
const hourAt = (pre, L, tail) => L <= 0 ? lerp(12.1, 12.6, pre) : L < .3 ? lerp(12.6, 14, L / .3) : L < .88 ? lerp(14, 19, (L - .3) / .58) : L < 1 ? lerp(19, 21.5, (L - .88) / .12) : lerp(21.5, 23, tail);

const SAMPLE = { size: 120, from: 'SOL', to: 'ETH', fromName: 'Solana', toName: 'Ethereum', departs: '12:04', seed: 3, x: 0, y: 0 };

export async function mountCrossing(mount) {
  mount.innerHTML = `
    <div class="cx-stage">
      <canvas class="cx-gl" aria-hidden="true"></canvas>
      <div class="cx-ticket" role="img" aria-label="Transfer ticket, SOL to ETH"><div class="part body"></div><div class="part stub"></div></div>
      <p class="cx-line" aria-live="polite"></p>
    </div>`;
  const stage = mount.querySelector('.cx-stage'), cvs = mount.querySelector('.cx-gl'), ctx = cvs.getContext('2d');
  const ticketEl = mount.querySelector('.cx-ticket'), bodyEl = mount.querySelector('.part.body'), stubEl = mount.querySelector('.part.stub'), lineEl = mount.querySelector('.cx-line');
  const [lh] = await Promise.all([loadLighthouse(), window.Ticket.ready]);

  const T = window.Ticket, TH = 120, TW = T.width(TH), TEAR = T.SIZES[TH].body;
  // the two halves meet on the perforation. The top edge is the paper's own, so the postmark runs off the paper
  // like a real cancel instead of hanging in the air; the other margins keep the shadow.
  bodyEl.style.clipPath = `polygon(-60px -3px, ${TEAR}px -3px, ${TEAR}px ${TH + 60}px, -60px ${TH + 60}px)`;
  stubEl.style.clipPath = `polygon(${TEAR}px -3px, ${TW + 60}px -3px, ${TW + 60}px ${TH + 60}px, ${TEAR}px ${TH + 60}px)`;

  // the ticket is redrawn only when what it prints changes: its state, the second, the dot's place
  let drawnKey = '', marks = [];
  function drawTicket(state, p, sec) {
    const key = `${state}|${sec}|${p.toFixed(3)}`; if (key === drawnKey) return; drawnKey = key;
    const o = { ...SAMPLE, state, elapsed: `${sec}s` };
    if (state === 'arrived') Object.assign(o, { arrives: '12:04:44', arrivesExact: '12:04:44', date: '14 NOV', year: '2026' });
    const C = T.STATES.crossing, keep = { p: C.p, tl: C.tl, tv: C.tv, onLine: C.onLine };
    // the crossing stub counts the seconds; the dot runs the whole route in step with them
    Object.assign(C, { p, tl: 'SO FAR', tv: q => q.elapsed, onLine: null });
    try { T.draw(bodyEl, o); T.draw(stubEl, o); } finally { Object.assign(C, keep); }
    marks = [...ticketEl.querySelectorAll('g[transform*="scale(.44)"]')].map(el => ({ el, base: el.getAttribute('transform') }));
    ticketEl.setAttribute('aria-label', state === 'arrived' ? 'Transfer ticket, SOL to ETH, arrived 12:04:44, crossed in 41 seconds, postmarked'
      : state === 'pier' ? 'Transfer ticket, SOL to ETH, departs 12:04' : `Transfer ticket, SOL to ETH, crossing, ${sec} seconds so far`);
  }

  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  let vwNow = 0, vhNow = 0;
  function resize(vw, vh) {
    if (vw === vwNow && vh === vhNow) return; vwNow = vw; vhNow = vh;
    cvs.width = Math.round(vw * dpr); cvs.height = Math.round(vh * dpr); cvs.style.width = vw + 'px'; cvs.style.height = vh + 'px';
    ctx.imageSmoothingQuality = 'high';
  }
  function station(vw) {
    const wide = vw >= 800, k = wide ? Math.min(1, vw * 0.34 / TW) : (vw - 40) / TW, left = wide ? 80 : 20, top = (wide ? 80 : 64) + 32;
    return { x: left + TEAR / 2 * k, y: top + TH / 2 * k, k, rot: -0.4, left, bottom: top + TH * k };
  }
  function place(el, P, dy, rot) {
    el.style.transform = `translate(${P.x.toFixed(2)}px,${(P.y + dy).toFixed(2)}px) rotate(${rot.toFixed(3)}deg) scale(${P.k.toFixed(4)}) translate(${-TEAR / 2}px,${-TH / 2}px)`;
  }

  let shown = false, lastKey = '';
  register(mount, {
    hide() { if (shown) { stage.style.visibility = 'hidden'; shown = false; } },
    frame(st) {
      const { vw, vh, pre, local: L0, tail, t } = st;
      if (!shown) { stage.style.visibility = 'visible'; shown = true; }
      resize(vw, vh);
      const L = pre < 1 ? 0 : L0;
      const key = `${vw}|${vh}|${pre.toFixed(4)}|${L.toFixed(5)}|${tail.toFixed(4)}`;
      if (st.still && key === lastKey) return; lastKey = key;
      const u = pre < 1 ? pre - 1 : L0 < 1 ? L0 : 1 + 0.25 * tail;

      // ---- the crossing's facts ----
      const e = eAt(L), sec = Math.floor(e + 1e-6), f = e / SECS, arrived = L >= ARRIVE;
      const hour = hourAt(pre, L, tail), n = nightAt(hour);
      const lit = s => ss(s.e, s.e + 0.9, e) * (L >= GO ? 1 : 0);
      const lamps = { lantern: 0, win: new Array(7).fill(0) };
      for (const s of STEPS) for (const l of s.lamps) { if (l === 'lantern') lamps.lantern = lit(s); else lamps.win[l] = lit(s); }
      const glowK = Math.max(n, L < .5 ? .55 : 0);
      lamps.lantern *= glowK; lamps.win = lamps.win.map(v => v * glowK);

      // ---- the ferry along its route, slowing into the mooring, then settled and bobbing ----
      const uF = lerp(f, 1 - (1 - f) * (1 - f), f);
      const fp = bez(ROUTE, uF), fq = bez(ROUTE, Math.min(1, uF + .01)), fpr = bez(ROUTE, Math.max(0, uF - .01));
      let fang = uF >= 1 ? Math.atan2(fp[1] - fpr[1], fp[0] - fpr[0]) : Math.atan2(fq[1] - fp[1], fq[0] - fp[0]);
      const settle = ss(ARRIVE, ARRIVE + .05, L);
      fang = lerp(fang, -0.1, settle);
      const ferry = { p: [fp[0], fp[1] + (arrived ? Math.sin(t * 1.2) * 1.2 : 0)], ang: fang, speed: L < GO ? 0 : 1 - uF };

      // ---- the beam: sweeps once the lantern is lit, finds the ferry at full night, holds it in, lets go ----
      const guide = ss(.46, .56, L) * (1 - ss(.84, .9, L));
      const target = arrived ? [MOOR[0], MOOR[1] + 6] : (() => { const a = bez(ROUTE, Math.min(1, uF + .08)); return [a[0], a[1] + 6]; })();
      const free = L * Math.PI * 9 + t * 0.1, breathe = .88 + .12 * Math.sin(t * .7);
      const beam = {
        ang: beamAngle(free, guide, target), sweep: lamps.lantern * n * breathe * (1 - ss(.6, 1, guide)),
        search: n * ss(.6, 1, guide) * breathe, target, lane: arrived ? null : k => bez(ROUTE, uF + (1 - uF) * k),
      };
      // ---- rings: one as it casts off, one as it lands ----
      const rings = [];
      const ageGo = (L - GO) * 66, ageArr = (L - ARRIVE) * 66;
      if (ageGo > 0 && ageGo < 4.5) rings.push({ x: ROUTE[0][0] + 20, y: ROUTE[0][1] + 6, age: ageGo, seed: 2.1 });
      if (ageArr > 0 && ageArr < 4.5) rings.push({ x: MOOR[0] + 10, y: MOOR[1] + 8, age: ageArr, seed: 1.3 });

      const plate = lh.draw({ hour, n, t: st.still ? 4.2 : t, lamps, beam, ferry, rings });

      // ---- camera: cover the screen, look where the story is ----
      const s = Math.max(vw / W, vh / H), pw = vw / s, ph = vh / s;
      const fy = camY(u), follow = clamp((fy - 600) / 500), fx = lerp(482, ferry.p[0], follow);
      const sx = clamp(fx - pw / 2, 0, W - pw), sy = clamp(fy - ph / 2, 0, H - ph);
      ctx.drawImage(plate, sx, sy, pw, ph, 0, 0, cvs.width, cvs.height);
      cvs.style.opacity = ss(0, 0.6, pre).toFixed(3);

      // ---- the ticket: handed over from the pier, then in its corner ----
      const S = station(vw), Hp = handPose(vw, vh), m = ss(.2, .9, pre);
      const P = { x: lerp(Hp.x, S.x, m), y: lerp(Hp.y, S.y, m), k: lerp(Hp.k, S.k, m) };
      const state = L < GO ? 'pier' : arrived ? 'arrived' : 'crossing';
      drawTicket(state, state === 'crossing' ? f : 0, state === 'arrived' ? SECS : sec);
      const landAge = Math.max(0, ageArr), dip = landAge > 0 && landAge < 4 ? Math.sin(landAge * 5.5) * Math.exp(-1.6 * landAge) : 0;
      const rot = lerp(Hp.rot, S.rot, m) + 0.35 * dip;
      place(bodyEl, P, 3 * dip, rot); place(stubEl, P, 3 * dip, rot);
      stubEl.style.opacity = ss(.35, .95, pre).toFixed(3);
      // at the hand-over it keeps the pier's light, then takes the painting's
      const pierLight = 1 - 0.28 * st.clock.night - 0.06 * st.clock.dusk;
      const sh = `drop-shadow(0 14px 21px rgba(11,26,30,.22))`, light = `brightness(${lerp(pierLight, 1 - .2 * n, ss(0, .6, pre)).toFixed(3)})`;
      bodyEl.style.filter = stubEl.style.filter = `${sh} ${light}`;
      // the postmark strikes at the arrival second: a quick press down onto the paper, once
      const press = ss(0, 0.6, landAge);
      for (const { el, base } of marks) {
        el.setAttribute('transform', `${base} translate(60 0) scale(${(1 + .18 * (1 - press)).toFixed(4)}) translate(-60 0)`);
        el.setAttribute('opacity', arrived ? Math.min(1, .25 + press).toFixed(3) : '0');
      }

      // ---- one plain line by the ticket, the newest fact ----
      let best = null, ba = 0;
      STEPS.forEach((s, i) => {
        const a0 = Lof(s.e), end = i === STEPS.length - 1 ? .875 : Math.min(Lof(s.e + 9), Lof(STEPS[i + 1].e));
        const a = ss(a0, a0 + .008, L) * (1 - ss(end - .008, end, L));
        if (a > ba) { ba = a; best = s; }
      });
      if (best && lineEl.textContent !== best.line) lineEl.textContent = best.line;
      lineEl.style.opacity = ba.toFixed(3);
      lineEl.style.left = (S.left + 2) + 'px'; lineEl.style.top = (S.bottom + 22) + 'px';
      lineEl.style.color = n > .5 ? '#F2EEE6' : '#1B262B';
    },
  });
}

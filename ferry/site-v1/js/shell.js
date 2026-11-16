// The page shell. One number drives everything: page progress p, 0 at the top of the page and 1 at the foot.
// The page clock is read from p: dusk at the departure dock (0), night over the crossing (0.5), morning at the
// far shore (1). Sections register a mount element and get, every frame they are on screen, their own progress.
//
//   import {register, clockAt, params} from './shell.js';
//   register(el, {frame(s){ ... }});
//   s = {p, local, tail, clock, t, dt, vw, vh, still}
//     local: 0 when the section's top meets the top of the viewport, 1 when its bottom meets the bottom
//     tail:  0..1 over the viewport height after local reaches 1 (for hand-overs into the next section)
//     clock: clockAt(p), see below
//     t:     seconds of running time (frozen by ?t=<s> or prefers-reduced-motion)
//
// ?p=<0..1> holds the page at that progress without scrolling (fixed stages render it exactly; in-flow content
// stays at the top), for screenshots. ?t=<s> freezes time-driven motion.

const Q = new URLSearchParams(location.search);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);

export const params = {
  p: Q.has('p') ? clamp(+Q.get('p')) : null,
  t: Q.has('t') ? +Q.get('t') : null,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
};
params.still = params.t !== null || params.reduced;
const STILL_T = params.t ?? 4.2;

export const COLORS = {
  paper: hex('#F2EEE6'), ink: hex('#1B262B'), harbour: hex('#2C454B'), seaGlass: hex('#6B8A94'),
  mist: hex('#C9CDBD'), stone: hex('#D2A57F'), seaGrass: hex('#7D8F69'), signal: hex('#D2602C'),
};

// The light of the page at progress p. Weights dusk + night + morning = 1.
// bg is the colour of open water at that hour: what the page shows wherever no painting is.
export function clockAt(p) {
  const toNight = ss(0, 0.5, p), toMorning = ss(0.5, 1, p);
  const night = toNight * (1 - toMorning), dusk = 1 - toNight, morning = toMorning;
  const duskBg = mix(COLORS.harbour, COLORS.ink, 0.35);
  const nightBg = mix(COLORS.ink, [0.07, 0.1, 0.13], 0.4);
  let bg = mix(duskBg, nightBg, toNight);
  bg = mix(bg, COLORS.paper, toMorning);
  return { p, dusk, night, morning, bg, dark: toMorning < 0.55 };
}

const sections = [];
export function register(el, hooks) { sections.push({ el, hooks, top: 0, h: 0 }); measure(); }

let vw = innerWidth, vh = innerHeight, maxScroll = 1;
function measure() {
  vw = innerWidth; vh = innerHeight;
  maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
  for (const s of sections) { const r = s.el.getBoundingClientRect(); s.top = r.top + scrollY; s.h = r.height; }
}
addEventListener('resize', measure);

const root = document.documentElement;
function paintChrome(clock) {
  const c = clock.bg.map(v => Math.round(v * 255));
  root.style.setProperty('--sea', `rgb(${c})`);
  root.dataset.light = clock.dark ? 'dark' : 'light';
}

let t0 = performance.now(), last = 0;
function tick(now) {
  const t = params.still ? STILL_T : (now - t0) / 1000, dt = Math.min(0.05, t - last); last = t;
  const y = params.p !== null ? params.p * maxScroll : scrollY;
  const p = params.p !== null ? params.p : clamp(y / maxScroll);
  const clock = clockAt(p);
  paintChrome(clock);
  for (const s of sections) {
    const run = Math.max(1, s.h - vh);
    const raw = (y - s.top) / run;
    const visible = y + vh > s.top && y < s.top + s.h + vh;   // a viewport of grace after the end, for the hand-over
    if (!visible) { if (s.on) { s.on = false; s.hooks.hide?.(); } continue; }
    s.on = true;
    s.hooks.frame({ p, local: clamp(raw), tail: clamp((y - s.top - run) / vh), clock, t, dt, vw, vh, still: params.still });
  }
  requestAnimationFrame(tick);
}

export function start() {
  measure();
  if (params.p !== null) { history.scrollRestoration = 'manual'; document.documentElement.style.overflow = 'hidden'; }
  requestAnimationFrame(tick);
}

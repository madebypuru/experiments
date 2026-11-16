// Ferry footer. The base is the live Ferry dock (footer-lib/dock-live.js, the rowboats study from
// ferry/assets/rowboats/index.html): boats back out of their berths and row away, then come back; tapping the water
// sends a painted wave that rocks them, tapping a boat sends it out. Where the painting stops, its top edge is laid as brush strokes (see below).
// ?t=<seconds> freezes the dock at that moment.
(function(){
const $ = s => document.querySelector(s);
const year = String(new Date().getFullYear());
$('#yr').textContent = year;

// ---- the stamp and its FERRY POST cancel, from the Ferry stamp icon engine ----
const F = window.FerryIcons, by = n => window.FERRY_LIBRARY.find(e => e.name === n);
document.body.insertAdjacentHTML('beforeend', F.SHADOW);
$('#stamp').innerHTML = F.stamp(by('BOW'), 0, 150);
// the engine's postmark, with the year along the bottom arc in place of its three dots
$('#postmark').innerHTML = F.postmark(by('LIGHTHOUSE'), 1, 132)
  .replace('<circle cx="-14" cy="97" r="2.6"/><circle cy="99" r="2.6"/><circle cx="14" cy="97" r="2.6"/>',
    `<text style="font:700 21px 'Ferry Sans';letter-spacing:7px" text-anchor="middle"><textPath href="#pm1yr" startOffset="50%">${year}</textPath></text>`)
  .replace('</defs>', '<path id="pm1yr" d="M-103 0 A103 103 0 0 0 103 0"/></defs>');

// ---- where the painting stops: the dock's own pixels shown through a mask laid as brush strokes ----
// The stroke model is Paint's gouache stroke (paint/gouache.js gcStroke): a Chaikin-smoothed path, a body that is full
// at the start and thins at the tail, round-ish caps, and bristle streaks that run out early. Here each stroke is laid
// into an alpha mask, so its colour is whatever the painting has under it, and a dry stroke lets the paper through.
// The contour wanders in long lazy runs across the width; strokes follow the water (near horizontal, sweeping, every
// length and width); a few run past it dry, a few specks land beyond, and bare paper shows in patches just inside.
const band = $('#harbour');
function rng(seed){ let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function paintEdge(){
  const W = band.clientWidth, H = band.clientHeight; if (!W || !H) return;
  const S = Math.min(1, W / 1440) * .55 + .45;                 // stroke scale: a phone gets smaller brushes, not a squashed edge
  const E = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--edge')) || 150;
  const r = rng(1836), R = (a, b) => a + (b - a) * r(), logn = (m, s) => m * Math.exp(s * (r() + r() + r() - 1.5));
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28];
  const C = x => E + 58 * S * Math.sin(x / (W * .23) + ph[0]) + 30 * S * Math.sin(x / 150 + ph[1]) + 12 * S * Math.sin(x / 61 + ph[2]) + 9 * S * Math.sin(x / (W * .61) + ph[3]);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  g.fillStyle = g.strokeStyle = '#fff'; g.lineCap = 'round';
  // the solid paint, a little below the contour, so the contour itself is made of strokes
  let wk = 0; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 6){ wk = wk * .85 + R(-1, 1) * 5; g.lineTo(x, C(x) + (40 + wk) * S); } g.lineTo(W, H); g.fill();
  // one stroke, after gcStroke: path, smoothed twice, width profile, body alpha, bristles running out
  function stroke(x, y, len, wd, ang, bend, body, dry){
    let P = []; const n = Math.max(3, Math.round(len / 30));
    for (let j = 0; j <= n; j++){ const t = j / n, a = ang + bend * (t - .5); P.push([x + Math.cos(a) * len * t, y + Math.sin(a) * len * t + bend * len * .12 * Math.sin(t * Math.PI) + R(-1, 1) * wd * .1]); }
    for (let it = 0; it < 2; it++){ const o = [P[0]]; for (let j = 0; j < P.length - 1; j++){ const a = P[j], b = P[j + 1]; o.push([.75 * a[0] + .25 * b[0], .75 * a[1] + .25 * b[1]], [.25 * a[0] + .75 * b[0], .25 * a[1] + .75 * b[1]]); } o.push(P[P.length - 1]); P = o; }
    const m = P.length, N = [];
    for (let j = 0; j < m; j++){ const a = P[Math.max(0, j - 1)], b = P[Math.min(m - 1, j + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; N.push([-dy / l, dx / l]); }
    const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    const width = t => wd / 2 * (t < .12 ? .4 + .6 * t / .12 : 1 - .7 * sm(.45, 1, t));   // loaded start, tapering tail
    if (body > 0){
      g.globalAlpha = body; g.beginPath();
      for (let j = 0; j < m; j++){ const t = j / (m - 1), hw = width(t) * R(.9, 1.05); g[j ? 'lineTo' : 'moveTo'](P[j][0] + N[j][0] * hw, P[j][1] + N[j][1] * hw); }
      for (let j = m - 1; j >= 0; j--){ const t = j / (m - 1), hw = width(t) * R(.9, 1.05); g.lineTo(P[j][0] - N[j][0] * hw, P[j][1] - N[j][1] * hw); }
      g.closePath(); g.fill();
    }
    // bristles: a loaded stroke gets a few, a dry drag is nothing but bristles with paper between them
    const nb = dry ? Math.max(4, Math.round(wd / 2.2)) : Math.max(2, Math.round(wd / 5));
    for (let b = 0; b < nb; b++){
      const off = (b / (nb - 1) - .5) * (dry ? .95 : .9) + R(-.05, .05), t0 = R(0, dry ? .25 : .08), t1 = dry ? R(.25, .95) : R(.85, 1.08);
      g.globalAlpha = dry ? R(.35, .9) : R(.5, .95); g.lineWidth = dry ? Math.max(1.6 * S, wd / nb * R(.55, 1)) : Math.max(.8, wd / nb * R(.4, .8)); g.beginPath();
      let first = true; for (let j = 0; j < m; j++){ const t = j / (m - 1); if (t < t0 || t > t1) continue;
        if (dry && !first && r() < .16){ g.stroke(); g.beginPath(); first = true; j += 1 + Math.floor(r() * 2); continue; }   // the brush skips on the paper's tooth
        const hw = width(Math.min(t, 1)) * 2 * off;
        g[first ? 'moveTo' : 'lineTo'](P[j][0] + N[j][0] * hw, P[j][1] + N[j][1] * hw); first = false; }
      g.stroke();
    }
    g.globalAlpha = 1;
  }
  const slope = x => Math.max(-.09, Math.min(.09, Math.atan2(C(x + 20) - C(x - 20), 40) * .6));   // water strokes stay near level
  // strokes laying the contour: overlapping, of every length and width, following the water and the contour's run
  for (let x = -80; x < W + 40;){
    const len = Math.min(380, logn(130, 1)) * S, wd = Math.min(56, logn(20, .7)) * S, y = C(x) + R(-10, 22) * S;
    stroke(x, y, len, wd, slope(x + len / 2) + R(-.07, .07), R(-.12, .12), R(.9, 1), false);
    // a second, lower stroke under it so the solid paint's own line never shows
    stroke(x + R(-30, 30) * S, C(x) + R(34, 60) * S, Math.min(len, 260 * S) * R(.4, .8), Math.max(wd, 26 * S), slope(x) + R(-.05, .05), R(-.1, .1), 1, false);
    x += len * R(.15, .45);
  }
  // runs past the edge: a loaded one now and then, more often a dry drag thinning out
  for (let i = 0, k = Math.round(W / 70); i < k; i++){
    const x = R(-40, W), dry = r() < .6, len = (dry ? Math.min(220, logn(90, .6)) : Math.min(380, logn(90, .8))) * S, wd = (dry ? R(10, 34) : R(6, 22)) * S;
    stroke(x, C(x + len / 2) - R(8, dry ? 34 : 50) * S, len, wd, slope(x) + R(-.1, .1), R(-.2, .2), dry ? 0 : R(.55, .9), dry);
  }
  // specks and stray marks beyond the edge, few and uneven
  for (let i = 0, k = Math.round(W / 110); i < k; i++){
    const x = R(0, W), y = C(x) - R(40, 120) * S;
    if (r() < .55) stroke(x, y, R(4, 14) * S, R(2, 5) * S, R(-.4, .4), 0, R(.6, 1), false);
    else stroke(x, y, R(25, 90) * S, R(2, 6) * S, R(-.1, .1), R(-.3, .3), 0, true);
  }
  // bare paper just inside: thin patches and dry gaps lifted out of the paint
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0, k = Math.round(W / 150); i < k; i++){
    const x = R(0, W), len = logn(70, .7) * S;
    stroke(x, C(x) + R(14, 60) * S, len, R(5, 18) * S, slope(x) + R(-.08, .08), R(-.2, .2), r() < .4 ? R(.5, .9) : 0, true);
  }
  g.globalCompositeOperation = 'source-over';
  const url = `url(${cv.toDataURL()})`;
  band.style.webkitMaskImage = url; band.style.maskImage = url;
}
paintEdge();
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(paintEdge, 120); });

// ---- pause the dock's loop while it is off screen, so the footer costs nothing until it is seen ----
let seen = true, held = null; const raf = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = cb => { if (seen) return raf(cb); held = cb; return 0; };
new IntersectionObserver(es => { seen = es[0].isIntersecting; if (seen && held){ const h = held; held = null; raf(h); } }).observe(band);
})();

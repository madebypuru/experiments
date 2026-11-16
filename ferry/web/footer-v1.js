// Ferry footer. The base is the live Ferry dock (footer-lib/dock-live.js, the rowboats study from
// ferry/assets/rowboats/index.html): boats back out of their berths and row away, then come back; tapping the water
// sends a painted wave that rocks them, tapping a boat sends it out. Its top edge dissolves into the page as brush strokes.
// ?t=<seconds> freezes the dock at that moment.
(function(){
const $ = s => document.querySelector(s), NS = 'http://www.w3.org/2000/svg';
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

// ---- the wordmark: the paths from the exported lockup, without the mark, cropped to their own bounds ----
fetch('../export/ferry-lockup-clean.svg').then(r => r.text()).then(txt => {
  const root = new DOMParser().parseFromString(txt, 'image/svg+xml').documentElement, svg = $('#wordmark');
  for (const p of root.children){ if (p.tagName !== 'path') continue; const q = document.createElementNS(NS, 'path'); q.setAttribute('d', p.getAttribute('d')); svg.appendChild(q); }
  const b = svg.getBBox(); svg.setAttribute('viewBox', `${b.x} ${b.y} ${b.width} ${b.height}`);
});

// ---- the painted edge: a mask of seeded brush strokes, so the dock's own paint reaches up into the page ----
const band = $('#harbour');
function rng(seed){ let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// one stroke: a long dab with a wavering top and bottom, a blunt loaded start and a dry end split into bristle tips
function stroke(r, x, y, len, h, rot){
  const n = Math.max(5, Math.round(len / 7)), top = [], bot = [];
  for (let i = 0; i <= n; i++){
    const u = i / n, thin = u < .08 ? .75 + u * 3 : u > .7 ? 1 - (u - .7) * 1.6 : 1;
    top.push([u * len, -h / 2 * thin + (r() - .5) * h * .12]);
    bot.push([u * len, h / 2 * thin + (r() - .5) * h * .12]);
  }
  const tips = 2 + Math.floor(r() * 3), end = [];       // the dry end: bristle tips of uneven length
  for (let k = 1; k <= tips; k++){ const yy = -h * .25 + h * .5 * k / (tips + 1); end.push([len + 6 + r() * len * .12, yy], [len - 2 - r() * 8, yy + h * .5 / (tips + 1) / 2]); }
  const pts = [[-(2 + r() * 4), (r() - .5) * h * .3], ...top, ...end, ...bot.reverse()];
  const c = Math.cos(rot), s = Math.sin(rot);
  return 'M' + pts.map(([px, py]) => `${(x + px * c - py * s).toFixed(1)} ${(y + px * s + py * c).toFixed(1)}`).join('L') + 'Z';
}
function paintEdge(){
  const W = band.clientWidth, H = band.clientHeight, E = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--edge')) || 200;
  const r = rng(1836), on = [], off = [];
  // a closing row of long strokes along the foot of the edge, so the solid paint starts as strokes, not a line
  for (let x = -60; x < W; x += 50 + r() * 70) on.push(stroke(r, x, E - 6 + (r() - .5) * 26, 120 + r() * 160, 22 + r() * 16, (r() - .5) * .06));
  // strokes reaching up, more and longer near the paint, fewer and shorter higher up
  const N = Math.round(W / 9);
  for (let i = 0; i < N; i++){
    const u = Math.pow(r(), 1.7), y = E - 12 - u * (E - 30), len = (50 + r() * 190) * (1 - u * .55), h = (9 + r() * 20) * (1 - u * .35);
    if (u > .6 && r() < .5) continue;
    on.push(stroke(r, r() * (W + 120) - 100, y, len, h, (r() - .5) * .09));
  }
  // a few thin spots just inside, where the brush ran dry
  for (let i = 0; i < W / 70; i++) off.push(stroke(r, r() * W, E + 14 + r() * 40, 18 + r() * 50, 3 + r() * 5, (r() - .5) * .08));
  const svg = `<svg xmlns="${NS}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect x="0" y="${E}" width="${W}" height="${H - E}" fill="#fff"/><path fill="#fff" d="${on.join('')}"/><path fill="#000" d="${off.join('')}"/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  band.style.webkitMaskImage = url; band.style.maskImage = url;
}
paintEdge();
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(paintEdge, 120); });

// ---- pause the dock's loop while it is off screen, so the footer costs nothing until it is seen ----
let seen = true, held = null; const raf = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = cb => { if (seen) return raf(cb); held = cb; return 0; };
new IntersectionObserver(es => { seen = es[0].isIntersecting; if (seen && held){ const h = held; held = null; raf(h); } }).observe(band);
})();

// Ferry icon library 01: six block prints, cut by one hand.
// Every icon is drawn in block units: a portrait block of 8 x 11 cells of 40 (320 x 440).
// shape: the silhouette subpaths (ink). cuts: knife lines carved out of the ink (paper), one width for all six.
// bite: paper removed from the silhouette (the life ring's stepped waterline). post: ink printed after the bite.
const HARBOUR = '#2C454B', INK = '#1B262B', PAPER = '#F2EEE6';
const CELL = 40, BW = 320, BH = 440, CUT = 7;

function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// a hand: nudge every coordinate a little, so nothing is ruler-straight
function hand(d, amt, seed){ const r = rng(seed); return d.replace(/-?\d+(\.\d+)?/g, n => (parseFloat(n) + (r() - .5) * 2 * amt).toFixed(1)); }
// a freehand closed loop: a circle with a wobbling radius, through Catmull-Rom points
function loop(cx, cy, rad, wob, seed, n = 14){
  const r = rng(seed), p = [];
  for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2, rr = rad + (r() - .5) * 2 * wob; p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  let d = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++){
    const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
const water = (y) => `M44 ${y} C82 ${y-6} 116 ${y+6} 160 ${y} C204 ${y-6} 238 ${y+6} 276 ${y-1} L274 ${y+14} C238 ${y+20} 202 ${y+8} 160 ${y+15} C118 ${y+22} 84 ${y+9} 46 ${y+16} Z`;

const ICONS = [
  { name: 'BOW', seed: 11,
    shape: [
      'M155 112 L165 112 L167 150 L153 150 Z',                       // short mast
      'M126 148 L194 147 L198 180 L122 181 Z',                       // wheelhouse top
      'M74 178 L246 176 L247 192 L234 194 L232 240 L88 241 L86 195 L73 193 Z', // bridge deck and wings
      // the hull: broad flare from the deck to the waterline; the stem meets the water in two steps, the mark's notch
      'M54 236 L266 234 C260 276 242 306 222 326 L186 326 L186 334 L171 334 L171 343 L149 343 L149 334 L134 334 L134 326 L98 326 C78 306 60 276 54 236 Z',
      water(356) ],
    cuts: [ 'M86 249 C112 278 138 304 155 321', 'M234 248 C208 278 182 304 165 321', 'M100 209 C132 205 188 212 220 207' ] },
  { name: 'LIGHTHOUSE', seed: 23,
    shape: [
      () => loop(160, 80, 7.5, 1.2, 4, 8),                           // finial
      'M131 114 C131 96 146 87 160 87 C174 87 189 96 189 114 Z',     // dome
      'M138 113 L182 113 L180 147 L140 147 Z',                       // lantern
      'M116 145 L204 144 L206 159 L114 160 Z',                       // gallery
      'M128 157 L192 157 L207 333 L113 333 Z',                       // tower
      'M103 331 L217 331 L217 344 L103 344 Z',                       // plinth, stepped out twice onto the water
      'M90 342 L230 342 L230 355 L90 355 Z',
      water(366) ],
    cuts: [ 'M160 119 L160 140', 'M181 172 C187 220 191 268 195 318', 'M125 238 C148 245 176 245 199 236' ] },
  { name: 'LIFE RING', seed: 37,
    shape: [ () => ({ d: loop(160, 202, 104, 2.4, 9, 16) + loop(160, 202, 46, 1.6, 12, 12), rule: 'evenodd' }) ],
    bite: [ 'M112 330 L112 299 L132 299 L132 290 L188 290 L188 299 L208 299 L208 330 Z' ],
    post: [ water(316) ],   // printed after the bite, so the stepped cut takes only the ring and the water stays whole
    cuts: (() => { const out = []; [[-45, 3], [-135, -4], [45, -3], [135, 4]].forEach(([a, tw]) => { const r1 = 53, r2 = 97, a1 = a * Math.PI / 180, a2 = (a + tw) * Math.PI / 180;
      out.push(`M${(160 + Math.cos(a1) * r1).toFixed(1)} ${(202 + Math.sin(a1) * r1).toFixed(1)} L${(160 + Math.cos(a2) * r2).toFixed(1)} ${(202 + Math.sin(a2) * r2).toFixed(1)}`); }); return out; })() },
  { name: 'BOLLARD', seed: 41,
    shape: [
      'M92 134 C92 104 122 90 160 90 C198 90 228 104 228 134 L226 147 L94 147 Z',   // cap
      'M114 144 L206 144 C196 200 196 270 204 320 L116 320 C124 270 124 200 114 144 Z', // waisted post
      'M198 195 C236 190 262 170 289 139 L302 152 C272 187 242 212 198 219 Z', // the mooring line, taut, rising to the ship
      'M92 318 L228 318 L228 333 L92 333 Z',                         // base, stepped out twice onto the quay
      'M78 331 L242 331 L242 346 L78 346 Z' ],
    cuts: [ 'M101 131 C130 124 190 124 219 131', 'M121 190 C146 182 176 184 199 193', 'M122 223 C147 215 176 217 199 225' ] },
  { name: 'GULL', seed: 53,
    shape: [
      'M95 152 C97 124 129 110 147 132 C157 145 162 161 191 176 C223 192 251 210 274 227 L263 237 C241 239 221 251 201 263 C181 275 150 279 128 267 C104 253 98 222 100 196 C100 184 98 176 94 171 L86 167 L55 163 L61 155 L92 154 Z',
      'M145 262 L152 262 L150 303 L143 303 Z', 'M163 266 L170 266 L170 303 L163 303 Z',  // legs
      'M118 300 L174 300 L174 308 L186 308 L186 316 L198 316 L198 388 L118 388 Z' ],   // piling; its top cut in two steps
    cuts: [ 'M116 141 L124 140', 'M151 180 C181 197 221 214 257 229', 'M160 216 C182 226 203 234 222 239' ] },
  { name: 'WAVE', seed: 67,
    shape: [ 'M56 364 L56 250 C56 176 108 122 170 122 C215 122 241 150 237 187 C235 207 214 217 198 209 C214 197 212 171 188 167 C162 163 144 189 152 215 C160 239 194 247 218 233 C234 222 256 214 272 222 C280 226 284 236 284 246 L284 336 L271 336 L271 350 L258 350 L258 364 Z' ],
    cuts: [ 'M80 346 C76 260 106 184 166 150', 'M104 350 C102 300 112 262 134 240', 'M196 272 C222 260 244 258 263 268' ] },
];

// resolve each icon into concrete paths, hand-nudged once so every use is the same cut
ICONS.forEach((ic, i) => {
  ic.paths = ic.shape.map((s, k) => { const v = typeof s === 'function' ? s() : s; const o = typeof v === 'string' ? { d: v } : v; o.d = hand(o.d, 1.3, ic.seed * 10 + k); return o; });
  // post paths keep the seed they had as shape paths, so their outline is unchanged
  ic.postD = (ic.post || []).map((d, k) => hand(d, 1.3, ic.seed * 10 + ic.shape.length + k));
  ic.cutsD = ic.cuts.map((c, k) => hand(c, 1.0, ic.seed * 7 + k));
  ic.biteD = (ic.bite || []);
});

function iconMask(id, ic, withCuts = true){
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${BW + 40}" height="${BH + 40}">
    ${ic.paths.map(p => `<path d="${p.d}" fill="#fff" ${p.rule ? `fill-rule="${p.rule}"` : ''}/>`).join('')}
    ${ic.biteD.map(d => `<path d="${d}" fill="#000"/>`).join('')}
    ${ic.postD.map(d => `<path d="${d}" fill="#fff"/>`).join('')}
    ${withCuts ? ic.cutsD.map(d => `<path d="${d}" fill="none" stroke="#000" stroke-width="${CUT}" stroke-linecap="round"/>`).join('') : ''}
  </mask>`;
}

// ink pressed from a carved block: wavering, chipped edges; mottled ink with specks; fuller at the rims
function printFilter(id, seed, opt = {}){
  const wav = opt.wav ?? 4.5, chip = opt.chip ?? 3, hole = opt.hole ?? 1;
  return `<filter id="${id}" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${seed}" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="${wav}" xChannelSelector="R" yChannelSelector="G" result="d1"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves="2" seed="${seed + 3}" result="c"/>
    <feDisplacementMap in="d1" in2="c" scale="${chip}" xChannelSelector="R" yChannelSelector="B" result="d2"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="${seed + 5}" result="sp"/>
    <feColorMatrix in="sp" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${-12 * hole} 0 0 0 ${1 + 7.6 * hole}" result="spA"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${seed + 7}" result="lo"/>
    <feColorMatrix in="lo" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 1.2 0 0 0.42" result="loA"/>
    <feComposite in="spA" in2="loA" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="m"/>
    <feComposite in="d2" in2="m" operator="in" result="body"/>
    <feMorphology in="d2" operator="erode" radius="2.4" result="er"/>
    <feComposite in="d2" in2="er" operator="out" result="rim"/>
    <feComposite in="rim" in2="loA" operator="in" result="rim2"/>
    <feMerge><feMergeNode in="body"/><feMergeNode in="rim2"/></feMerge>
  </filter>`;
}
// hairline grid and block edge: thin, slightly broken
function lineFilter(id, seed){
  return `<filter id="${id}" x="-4%" y="-4%" width="108%" height="108%">
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${seed}" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="${seed + 1}" result="b"/>
    <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -8 0 0 0 5.6" result="bA"/>
    <feComposite in="d" in2="bA" operator="in"/>
  </filter>`;
}

// stray gouge marks: slivers the knife left in the cleared ground, near the corners
function gouges(seed){
  const r = rng(seed), out = [];
  const corners = [[0, 0, 1, 1], [BW, 0, -1, 1], [0, BH, 1, -1], [BW, BH, -1, -1]];
  const pick = corners.slice().sort(() => r() - .5).slice(0, 3);
  pick.forEach(([cx, cy, sx, sy], k) => {
    const n = k === 0 ? 2 : 1 + (r() < .4 ? 1 : 0);
    const bx = cx + sx * (18 + r() * 30), by = cy + sy * (20 + r() * 34);
    const ang = Math.atan2(sy, sx) + Math.PI / 2 + (r() - .5) * .9;
    for (let j = 0; j < n; j++){
      const len = 13 + r() * 18, w = 1.6 + r() * 1.6, ox = bx + j * 7 * Math.cos(ang + Math.PI / 2), oy = by + j * 7 * Math.sin(ang + Math.PI / 2);
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
      const p0 = [ox - dx * len / 2, oy - dy * len / 2], p1 = [ox + dx * len / 2, oy + dy * len / 2];
      const m = [ox + dx * len * .1, oy + dy * len * .1];
      out.push(`M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Q${(m[0] + nx * w * 1.6).toFixed(1)} ${(m[1] + ny * w * 1.6).toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)} Q${(m[0] - nx * w).toFixed(1)} ${(m[1] - ny * w).toFixed(1)} ${p0[0].toFixed(1)} ${p0[1].toFixed(1)}Z`);
    }
  });
  return out;
}

// ---------- v2: Ferry's own print world: stamp-pad ink, stamps with the mark's stepped perforation ----------
// rubber-stamp ink, the postmark's routine from stamp.js: blotchy pressure x fine grain, ink spread a hair into the paper.
// ppu = screen pixels per user unit, so the grain is the same size on screen at every scale.
function inkFilter(id, seed, ppu){
  const g = 0.8 * ppu, b = 0.034 * ppu;   // cycles per unit
  const spread = (0.3 / ppu).toFixed(2);
  return `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
    <feMorphology in="SourceGraphic" operator="dilate" radius="${spread}" result="sp"/>
    <feGaussianBlur in="sp" stdDeviation="${(0.35 / ppu).toFixed(2)}" result="soft"/>
    <feTurbulence type="fractalNoise" baseFrequency="${(b * 1.1).toFixed(4)} ${(b * 1.5).toFixed(4)}" numOctaves="2" seed="${seed}" result="bl"/>
    <feTurbulence type="fractalNoise" baseFrequency="${g.toFixed(3)}" numOctaves="2" seed="${seed + 4}" result="gr"/>
    <feComposite in="bl" in2="gr" operator="arithmetic" k2=".7" k3=".5" k4="-0.2" result="m"/>
    <feColorMatrix in="m" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.5 0.05" result="a"/>
    <feComposite in="soft" in2="a" operator="in"/>
  </filter>`;
}
// pressure: the hand presses harder on one side
function pressure(id, ang, low){
  return `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(${ang} .5 .5)"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="${low}"/></linearGradient>
    <mask id="${id}" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#${id}g)"/></mask>`;
}
const STAMPW = 340, PPU = STAMPW / (SW + 80);
function stampFrame(ic, i){
  const k = `st${i}`, sc = 2.75, tx = SW / 2 - 160 * sc, ty = 650 - 220 * sc;
  const inner = `
  <defs>${iconMask(k + 'm', ic)}${inkFilter(k + 'i', 40 + i * 7, PPU)}${pressure(k + 'p', [200, 160, 230, 140, 210, 180][i], .55)}
    <mask id="${k}e" maskUnits="userSpaceOnUse" x="-60" y="-60" width="${SW + 120}" height="${SH + 120}">
      <g filter="url(#${k}rag)"><rect x="0" y="0" width="${SW}" height="${SH}" fill="#fff"/><g>${notches()}</g></g></mask>
    <filter id="${k}rag" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4"/></filter>
    <filter id="${k}paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="8" result="n"/>
      <feColorMatrix in="n" values="0 0 0 0 .32  0 0 0 0 .28  0 0 0 0 .22  0 0 0 .11 0" result="speck"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4" result="t"/>
      <feColorMatrix in="t" values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .07 0" result="tone"/>
      <feMerge><feMergeNode in="tone"/><feMergeNode in="speck"/></feMerge></filter>
  </defs>
  <g mask="url(#${k}e)">
    <rect width="${SW}" height="${SH}" fill="${PAPER}"/><rect width="${SW}" height="${SH}" filter="url(#${k}paper)"/>
    <rect x="${DES.x - 14}" y="${DES.y - 14}" width="${DES.w + 28}" height="${DES.h + 28}" fill="none" stroke="${INK}" stroke-width="2.6" opacity=".85"/>
    <text x="${DES.x + 34}" y="${DES.y + 62}" fill="${INK}" style="font:700 34px 'Ferry Sans';letter-spacing:7px">FERRY</text>
    <g mask="url(#${k}p)"><g filter="url(#${k}i)"><g transform="translate(${tx} ${ty}) scale(${sc})"><rect x="-10" y="-10" width="${BW + 20}" height="${BH + 20}" fill="${HARBOUR}" mask="url(#${k}m)"/></g></g></g>
    <text x="${SW / 2}" y="${DES.y + DES.h - 46}" text-anchor="middle" fill="${INK}" style="font:700 38px 'Ferry Sans';letter-spacing:11px">${ic.name}</text>
  </g>`;
  const H = STAMPW * (SH + 80) / (SW + 80);
  return `<svg class="stp" viewBox="-6 -6 ${STAMPW + 12} ${H + 12}"><g filter="url(#shStamp)"><svg x="0" y="0" width="${STAMPW}" height="${H}" viewBox="-40 -40 ${SW + 80} ${SH + 80}">${inner}</svg></g></svg>`;
}
// the quiet stamp shadow from stamp-01.html, in screen pixels
const SHADOW = `<svg width="0" height="0" style="position:absolute"><filter id="shStamp" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="0.9" result="c"/><feOffset in="c" dx="0.7" dy="1" result="co"/>
    <feComponentTransfer in="co" result="contact"><feFuncA type="linear" slope=".16"/></feComponentTransfer>
    <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="l"/><feOffset in="l" dx="2" dy="3" result="lo"/>
    <feComponentTransfer in="lo" result="lift"><feFuncA type="linear" slope=".05"/></feComponentTransfer>
    <feFlood flood-color="#0B1A1E"/><feComposite in2="lift" operator="in" result="liftC"/>
    <feFlood flood-color="#0B1A1E"/><feComposite in2="contact" operator="in" result="contactC"/>
    <feOffset in="SourceAlpha" dx="1.4" dy="1.8" result="sh"/><feComposite in="SourceAlpha" in2="sh" operator="out" result="rim"/>
    <feGaussianBlur in="rim" stdDeviation="0.6" result="rimS"/>
    <feFlood flood-color="#FFFDF7" flood-opacity=".75"/><feComposite in2="rimS" operator="in" result="rimC"/>
    <feMerge><feMergeNode in="liftC"/><feMergeNode in="contactC"/><feMergeNode in="SourceGraphic"/><feMergeNode in="rimC"/></feMerge>
  </filter></svg>`;
// a hand-stamped impression straight on the page: its own angle and pressure
const IMP = [[-3, 210, .5, .9], [2.5, 170, .62, .82], [-1.5, 250, .45, .88], [3.5, 120, .58, .86], [-4, 200, .52, .92], [1, 300, .6, .84]];
function impression(ic, i){
  const k = `im${i}`, [rot, ang, low, op] = IMP[i], ppu = 190 / (BW + 28);
  return `<svg class="imp" viewBox="-14 -14 ${BW + 28} ${BH + 28}" style="transform:rotate(${rot}deg)"><defs>${iconMask(k + 'm', ic)}${inkFilter(k + 'i', 60 + i * 11, ppu)}${pressure(k + 'p', ang, low)}</defs>
    <g mask="url(#${k}p)" opacity="${op}"><g filter="url(#${k}i)"><rect x="-10" y="-10" width="${BW + 20}" height="${BH + 20}" fill="${HARBOUR}" mask="url(#${k}m)"/></g></g></svg>`;
}

const VB = '2 62 316 316';   // the square every small icon is drawn in
function small(ic, i, size){
  const k = `s${i}_${size}`;
  return `<svg width="${size}" height="${size}" viewBox="${VB}"><defs>${iconMask(k, ic, size >= 32)}</defs>
    <rect x="-10" y="-10" width="${BW + 20}" height="${BH + 20}" fill="${INK}" mask="url(#${k})"/></svg>`;
}
const BUTTERFLY = `<path d="M32.3115 0.521362C34.1289 0.521362 35.6025 1.99501 35.6025 3.81238V8.99109C35.6029 10.8082 37.0764 12.2811 38.8936 12.2811H52.4893C54.3066 12.2811 55.7803 13.7548 55.7803 15.5721V32.4159C55.7806 34.233 57.2541 35.7059 59.0713 35.7059H71.4707C73.2881 35.7059 74.7617 37.1796 74.7617 38.9969V89.3964C74.7614 91.2134 73.2878 92.6864 71.4707 92.6864H59.0713C57.2539 92.6864 55.7803 94.16 55.7803 95.9774V121.838C55.7799 123.655 54.3064 125.128 52.4893 125.128H38.8936C37.0762 125.128 35.6025 126.601 35.6025 128.419V139.64C35.6022 141.457 34.1287 142.93 32.3115 142.93H3.29102C1.47387 142.93 0.00035392 141.457 0 139.64V85.2245H20.9717C22.7889 85.2244 24.2615 83.7516 24.2617 81.9344V45.4393C24.2615 43.6222 22.7889 42.1484 20.9717 42.1483H0V3.81238C0 1.99501 1.47365 0.521362 3.29102 0.521362H32.3115Z"/><path d="M132.687 0C130.87 0.000201891 129.397 1.47381 129.397 3.29102V8.46973C129.397 10.2868 127.923 11.7596 126.106 11.7598H112.51C110.692 11.76 109.22 13.2336 109.219 15.0508V31.8945C109.219 33.7116 107.746 35.1844 105.928 35.1846H93.5271C91.7099 35.1848 90.2371 36.6584 90.2371 38.4756V88.875C90.2373 90.6921 91.71 92.1648 93.5271 92.165H105.928C107.746 92.1652 109.219 93.6388 109.219 95.4561V121.316C109.22 123.133 110.692 124.606 112.51 124.606H126.106C127.923 124.607 129.397 126.08 129.397 127.897V139.118C129.397 140.935 130.87 142.408 132.687 142.408H161.709C163.526 142.408 165 140.935 165 139.118V84.7061H144.028C142.211 84.7061 140.737 83.2331 140.737 81.416V44.9209C140.737 43.1036 142.211 41.6309 144.028 41.6309H165V3.29102C165 1.47376 163.526 0.00012137 161.709 0H132.687Z"/>`;
// the butterfly sits in the same square, at the same optical size as the icons
const smallFly = (size) => `<svg width="${size}" height="${size}" viewBox="-46 -58 257 257"><g fill="${INK}">${BUTTERFLY}</g></svg>`;

// postmark: double ring, FERRY POST on the arc, the bow struck in the centre
function postmark(){
  const bow = ICONS[0];
  return `<svg viewBox="-140 -140 280 280" class="use"><defs>${iconMask('pmBow', bow)}
    <filter id="pmInk" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03 0.045" numOctaves="2" seed="21" result="b"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" result="g"/>
      <feComposite in="b" in2="g" operator="arithmetic" k2=".7" k3=".5" k4="-0.2" result="m"/>
      <feColorMatrix in="m" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.4 -0.25" result="a"/>
      <feComposite in="SourceGraphic" in2="a" operator="in"/>
    </filter>
    <path id="pmArc" d="M-90 0 A90 90 0 0 1 90 0"/></defs>
    <g filter="url(#pmInk)" fill="${HARBOUR}" opacity=".9">
      <circle r="118" fill="none" stroke="${HARBOUR}" stroke-width="6"/>
      <circle r="76" fill="none" stroke="${HARBOUR}" stroke-width="3.2"/>
      <text style="font:700 21px 'Ferry Sans';letter-spacing:7px" text-anchor="middle"><textPath href="#pmArc" startOffset="50%">FERRY POST</textPath></text>
      <circle cx="-14" cy="97" r="2.6"/><circle cy="99" r="2.6"/><circle cx="14" cy="97" r="2.6"/>
      <g transform="translate(-59.5 -84) scale(.372)"><rect x="-10" y="-10" width="${BW + 20}" height="${BH + 20}" mask="url(#pmBow)"/></g>
    </g></svg>`;
}
// fare token: one-ink disc, milled rim, FERRY over, ONE CROSSING under, the bow left as paper
function token(){
  const bow = ICONS[0]; let ticks = '';
  for (let a = 0; a < 360; a += 6){ const t = a * Math.PI / 180; ticks += `M${(Math.cos(t) * 113).toFixed(1)} ${(Math.sin(t) * 113).toFixed(1)} L${(Math.cos(t) * 120).toFixed(1)} ${(Math.sin(t) * 120).toFixed(1)}`; }
  return `<svg viewBox="-140 -140 280 280" class="use"><defs>${iconMask('tkBow', bow)}
    <path id="tkTop" d="M-86 0 A86 86 0 0 1 86 0"/><path id="tkBot" d="M-101 0 A101 101 0 0 0 101 0"/></defs>
    <circle r="121" fill="${HARBOUR}"/>
    <g fill="none" stroke="${PAPER}"><path d="${ticks}" stroke-width="2"/><circle r="109" stroke-width="1.6"/><circle r="78" stroke-width="2.4"/></g>
    <g fill="${PAPER}" style="font:700 17px 'Ferry Sans';letter-spacing:6px" text-anchor="middle">
      <text><textPath href="#tkTop" startOffset="50%">FERRY</textPath></text>
      <text><textPath href="#tkBot" startOffset="50%">ONE CROSSING</textPath></text>
      <circle cx="-93" cy="0" r="2.6"/><circle cx="93" cy="0" r="2.6"/>
      <g transform="translate(-57.6 -81.5) scale(.36)"><rect x="-10" y="-10" width="${BW + 20}" height="${BH + 20}" mask="url(#tkBow)"/></g>
    </g></svg>`;
}

document.getElementById('blocks').innerHTML = SHADOW + ICONS.map(stampFrame).join('');
document.getElementById('imps').innerHTML = ICONS.map(impression).join('');
document.getElementById('sizes').innerHTML = ICONS.map((ic, i) => `<div class="cl">${[64, 32, 24, 16].map(s => small(ic, i, s)).join('')}</div>`).join('')
  + `<div class="cl fly">${[64, 32, 24, 16].map(smallFly).join('')}</div>`;
document.getElementById('use').innerHTML = postmark() + token();

// Ferry stamp icons: one library entry in, every output out.
// Load order: ferry-grid.js, ferry-icons.js, library.js. Exposes window.FerryIcons.
// Copied and merged from experiments/ferry/print/icons-v1.js, icons-v2.js, icons-v3.js and stamp.js (geometry and ink unchanged).
// Units: an icon is drawn in "block units", a portrait block 320 x 440 (8 x 11 cells of 40), centre x 160.
(function(){
const HARBOUR = '#2C454B', INK = '#1B262B', PAPER = '#F2EEE6';
const BW = 320, BH = 440, CUT = 7;          // CUT: carved-line width, one width for every icon
const HAND = 1.3, HAND_CUT = 1.0;           // the hand: every coordinate nudged up to this much, so nothing is ruler-straight

function rng(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
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
// the water strip: x 44..276, about 15 thick, a two-swell wobble of +-6
const water = (y) => `M44 ${y} C82 ${y-6} 116 ${y+6} 160 ${y} C204 ${y-6} 238 ${y+6} 276 ${y-1} L274 ${y+14} C238 ${y+20} 202 ${y+8} 160 ${y+15} C118 ${y+22} 84 ${y+9} 46 ${y+16} Z`;

// ---------- stamp geometry (stamp.js, stamp units 1200 x 1500) ----------
const SW = 1200, SH = 1500, PITCH = 75, NW = PITCH / 2, ND = 26;
function notch(cx, cy, ang){
  const w1 = NW, w2 = NW * .66, w3 = NW * .34, d1 = ND * .38, d2 = ND * .72, d3 = ND;
  const p = [[-w1/2,-40],[-w1/2,d1],[-w2/2,d1],[-w2/2,d2],[-w3/2,d2],[-w3/2,d3],[w3/2,d3],[w3/2,d2],[w2/2,d2],[w2/2,d1],[w1/2,d1],[w1/2,-40]];
  const c = Math.cos(ang), s = Math.sin(ang);
  return p.map(([x, y]) => `${(cx + x*c - y*s).toFixed(1)},${(cy + x*s + y*c).toFixed(1)}`).join(' ');
}
function notches(){
  const out = [];
  for (let x = 0; x <= SW + .1; x += PITCH){ out.push(notch(x, 0, 0)); out.push(notch(x, SH, Math.PI)); }
  for (let y = PITCH; y < SH - .1; y += PITCH){ out.push(notch(0, y, -Math.PI/2)); out.push(notch(SW, y, Math.PI/2)); }
  return out.map(p => `<polygon points="${p}" fill="#000"/>`).join('');
}
const M = 84, DX = 10, DY = -6, DES = { x: M + DX, y: M + DY, w: SW - 2*M, h: SH - 2*M };

// ---------- the entry ----------
// { name, seed, shape:[path | ()=>path | ()=>({d, rule})], cuts:[path], water?: y, bite?:[path], anchor:{cx, contact, top, xs, ys} }
function resolve(e){
  if (e._r) return e;
  const shape = e.shape.slice(), post = (e.post || []).slice();
  if (e.water != null) (e.bite ? post : shape).push(water(e.water));   // with a bite, the water prints after it and stays whole
  const nw = e.water != null && !e.bite ? shape.length - 1 : -1;
  e.paths = shape.map((s, k) => { const v = typeof s === 'function' ? s() : s; const o = typeof v === 'string' ? { d: v } : { ...v }; o.d = hand(o.d, HAND, e.seed * 10 + k); o.water = k === nw; return o; });
  e.postD = post.map((d, k) => hand(d, HAND, e.seed * 10 + shape.length + k));
  e.cutsD = e.cuts.map((c, k) => hand(c, HAND_CUT, e.seed * 7 + k));
  e.biteD = e.bite || [];
  e._r = true; return e;
}
function maskBody(ic, cw){
  return ic.paths.map(p => `<path d="${p.d}" fill="#fff"${p.rule ? ` fill-rule="${p.rule}"` : ''}/>`).join('')
    + ic.biteD.map(d => `<path d="${d}" fill="#000"/>`).join('')
    + ic.postD.map(d => `<path d="${d}" fill="#fff"/>`).join('')
    + (cw ? ic.cutsD.map(d => `<path d="${d}" fill="none" stroke="#000" stroke-width="${cw}" stroke-linecap="round"/>`).join('') : '');
}
const iconMask = (id, ic, withCuts = true) => `<mask id="${id}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="${BW + 40}" height="${BH + 40}">${maskBody(resolve(ic), withCuts ? CUT : 0)}</mask>`;
const inkRect = (fill, m) => `<rect x="-10" y="-10" width="${BW + 20}" height="${BH + 20}" fill="${fill}" mask="url(#${m})"/>`;

// ---------- ink: the v2 stamp-pad ink (the postmark routine). ppu = screen px per user unit, so grain is constant on screen ----------
function inkFilter(id, seed, ppu){
  const g = 0.8 * ppu, b = 0.034 * ppu, spread = (0.3 / ppu).toFixed(2);
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
// pressure: the hand presses harder on one side (opacity falls to `low` past 45% of the way along angle `ang`)
function pressure(id, ang, low){
  return `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(${ang} .5 .5)"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="${low}"/></linearGradient>
    <mask id="${id}" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#${id}g)"/></mask>`;
}
const PRESS6 = [200, 160, 230, 140, 210, 180];
const IMP6 = [[-3, 210, .5, .9], [2.5, 170, .62, .82], [-1.5, 250, .45, .88], [3.5, 120, .58, .86], [-4, 200, .52, .92], [1, 300, .6, .84]];
const press = (ic, i) => PRESS6[i] ?? Math.round(120 + rng(ic.seed * 3)() * 180);
const imp = (ic, i) => { if (IMP6[i]) return IMP6[i]; const r = rng(ic.seed * 5); return [+((r() - .5) * 8).toFixed(1), Math.round(120 + r() * 180), +(.45 + r() * .17).toFixed(2), +(.82 + r() * .1).toFixed(2)]; };

// ---------- the stamp: stepped-notch perforation, keyline, FERRY top left, the name along the bottom ----------
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
function stamp(ic, i, width = 352){
  resolve(ic);
  const k = `st${i}`, sc = 2.75, tx = SW / 2 - 160 * sc, ty = 650 - 220 * sc, ppu = width / (SW + 80);
  const inner = `<defs>${iconMask(k + 'm', ic)}${inkFilter(k + 'i', 40 + i * 7, ppu)}${pressure(k + 'p', press(ic, i), .55)}
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
      <feMerge><feMergeNode in="tone"/><feMergeNode in="speck"/></feMerge></filter></defs>
  <g mask="url(#${k}e)">
    <rect width="${SW}" height="${SH}" fill="${PAPER}"/><rect width="${SW}" height="${SH}" filter="url(#${k}paper)"/>
    <rect x="${DES.x - 14}" y="${DES.y - 14}" width="${DES.w + 28}" height="${DES.h + 28}" fill="none" stroke="${INK}" stroke-width="2.6" opacity=".85"/>
    <text x="${DES.x + 34}" y="${DES.y + 62}" fill="${INK}" style="font:700 34px 'Ferry Sans';letter-spacing:7px">FERRY</text>
    <g mask="url(#${k}p)"><g filter="url(#${k}i)"><g transform="translate(${tx} ${ty}) scale(${sc})">${inkRect(HARBOUR, k + 'm')}</g></g></g>
    <text x="${SW / 2}" y="${DES.y + DES.h - 46}" text-anchor="middle" fill="${INK}" style="font:700 38px 'Ferry Sans';letter-spacing:11px">${ic.name}</text>
  </g>`;
  const H = width * (SH + 80) / (SW + 80);
  return `<svg class="stp" width="${width + 12}" height="${(H + 12).toFixed(1)}" viewBox="-6 -6 ${width + 12} ${H + 12}"><g filter="url(#shStamp)"><svg x="0" y="0" width="${width}" height="${H}" viewBox="-40 -40 ${SW + 80} ${SH + 80}">${inner}</svg></g></svg>`;
}
// a hand-stamped impression straight on the page: its own angle and pressure
function impression(ic, i, width = 190){
  resolve(ic);
  const k = `im${i}`, [rot, ang, low, op] = imp(ic, i), ppu = width / (BW + 28), h = width * (BH + 28) / (BW + 28);
  return `<svg class="imp" width="${width}" height="${h.toFixed(1)}" viewBox="-14 -14 ${BW + 28} ${BH + 28}" style="transform:rotate(${rot}deg)"><defs>${iconMask(k + 'm', ic)}${inkFilter(k + 'i', 60 + i * 11, ppu)}${pressure(k + 'p', ang, low)}</defs>
    <g mask="url(#${k}p)" opacity="${op}"><g filter="url(#${k}i)">${inkRect(HARBOUR, k + 'm')}</g></g></svg>`;
}
// clean size row: solid Ink, square crop of the block; carved lines dropped below 32 px (they would close up)
const VB = '2 62 316 316';
function small(ic, i, size){
  const k = `s${i}_${size}`;
  return `<svg width="${size}" height="${size}" viewBox="${VB}"><defs>${iconMask(k, ic, size >= 32)}</defs>${inkRect(INK, k)}</svg>`;
}
const BUTTERFLY = `<path d="M32.3115 0.521362C34.1289 0.521362 35.6025 1.99501 35.6025 3.81238V8.99109C35.6029 10.8082 37.0764 12.2811 38.8936 12.2811H52.4893C54.3066 12.2811 55.7803 13.7548 55.7803 15.5721V32.4159C55.7806 34.233 57.2541 35.7059 59.0713 35.7059H71.4707C73.2881 35.7059 74.7617 37.1796 74.7617 38.9969V89.3964C74.7614 91.2134 73.2878 92.6864 71.4707 92.6864H59.0713C57.2539 92.6864 55.7803 94.16 55.7803 95.9774V121.838C55.7799 123.655 54.3064 125.128 52.4893 125.128H38.8936C37.0762 125.128 35.6025 126.601 35.6025 128.419V139.64C35.6022 141.457 34.1287 142.93 32.3115 142.93H3.29102C1.47387 142.93 0.00035392 141.457 0 139.64V85.2245H20.9717C22.7889 85.2244 24.2615 83.7516 24.2617 81.9344V45.4393C24.2615 43.6222 22.7889 42.1484 20.9717 42.1483H0V3.81238C0 1.99501 1.47365 0.521362 3.29102 0.521362H32.3115Z"/><path d="M132.687 0C130.87 0.000201891 129.397 1.47381 129.397 3.29102V8.46973C129.397 10.2868 127.923 11.7596 126.106 11.7598H112.51C110.692 11.76 109.22 13.2336 109.219 15.0508V31.8945C109.219 33.7116 107.746 35.1844 105.928 35.1846H93.5271C91.7099 35.1848 90.2371 36.6584 90.2371 38.4756V88.875C90.2373 90.6921 91.71 92.1648 93.5271 92.165H105.928C107.746 92.1652 109.219 93.6388 109.219 95.4561V121.316C109.22 123.133 110.692 124.606 112.51 124.606H126.106C127.923 124.607 129.397 126.08 129.397 127.897V139.118C129.397 140.935 130.87 142.408 132.687 142.408H161.709C163.526 142.408 165 140.935 165 139.118V84.7061H144.028C142.211 84.7061 140.737 83.2331 140.737 81.416V44.9209C140.737 43.1036 142.211 41.6309 144.028 41.6309H165V3.29102C165 1.47376 163.526 0.00012137 161.709 0H132.687Z"/>`;
const smallFly = (size) => `<svg width="${size}" height="${size}" viewBox="-46 -58 257 257"><g fill="${INK}">${BUTTERFLY}</g></svg>`;

// ---------- postmark and fare token: the icon struck in the centre, sized by its measured box (the bow's 0.372 = 100 units tall) ----------
function centreOn(ic, target){
  const m = measure(ic), s = target / Math.max(m.w, m.h), cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  return `translate(${(-cx * s).toFixed(2)} ${(-cy * s).toFixed(2)}) scale(${s.toFixed(4)})`;
}
function postmark(ic, i, size = 270){
  const k = `pm${i}`;
  return `<svg class="use" width="${size}" height="${size}" viewBox="-140 -140 280 280"><defs>${iconMask(k + 'm', ic)}
    <filter id="${k}f" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03 0.045" numOctaves="2" seed="${21 + i}" result="b"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" result="g"/>
      <feComposite in="b" in2="g" operator="arithmetic" k2=".7" k3=".5" k4="-0.2" result="m"/>
      <feColorMatrix in="m" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.4 -0.25" result="a"/>
      <feComposite in="SourceGraphic" in2="a" operator="in"/>
    </filter><path id="${k}arc" d="M-90 0 A90 90 0 0 1 90 0"/></defs>
    <g filter="url(#${k}f)" fill="${HARBOUR}" opacity=".9">
      <circle r="118" fill="none" stroke="${HARBOUR}" stroke-width="6"/><circle r="76" fill="none" stroke="${HARBOUR}" stroke-width="3.2"/>
      <text style="font:700 21px 'Ferry Sans';letter-spacing:7px" text-anchor="middle"><textPath href="#${k}arc" startOffset="50%">FERRY POST</textPath></text>
      <circle cx="-14" cy="97" r="2.6"/><circle cy="99" r="2.6"/><circle cx="14" cy="97" r="2.6"/>
      <g transform="${centreOn(ic, 100)}"><rect x="-10" y="-10" width="${BW + 20}" height="${BH + 20}" mask="url(#${k}m)"/></g>
    </g></svg>`;
}
function token(ic, i, size = 270){
  const k = `tk${i}`; let ticks = '';
  for (let a = 0; a < 360; a += 6){ const t = a * Math.PI / 180; ticks += `M${(Math.cos(t) * 113).toFixed(1)} ${(Math.sin(t) * 113).toFixed(1)} L${(Math.cos(t) * 120).toFixed(1)} ${(Math.sin(t) * 120).toFixed(1)}`; }
  return `<svg class="use" width="${size}" height="${size}" viewBox="-140 -140 280 280"><defs>${iconMask(k + 'm', ic)}
    <path id="${k}t" d="M-86 0 A86 86 0 0 1 86 0"/><path id="${k}b" d="M-101 0 A101 101 0 0 0 101 0"/></defs>
    <circle r="121" fill="${HARBOUR}"/>
    <g fill="none" stroke="${PAPER}"><path d="${ticks}" stroke-width="2"/><circle r="109" stroke-width="1.6"/><circle r="78" stroke-width="2.4"/></g>
    <g fill="${PAPER}" style="font:700 17px 'Ferry Sans';letter-spacing:6px" text-anchor="middle">
      <text><textPath href="#${k}t" startOffset="50%">FERRY</textPath></text><text><textPath href="#${k}b" startOffset="50%">ONE CROSSING</textPath></text>
      <circle cx="-93" cy="0" r="2.6"/><circle cx="93" cy="0" r="2.6"/>
      <g transform="${centreOn(ic, 96.5)}"><rect x="-10" y="-10" width="${BW + 20}" height="${BH + 20}" mask="url(#${k}m)"/></g>
    </g></svg>`;
}

// ---------- the Ferry grid (v3): block in mark units, icon re-fitted so its main edges land on grid lines ----------
const G = window.FerryGrid, WL = G.WATERLINE, AX = G.AXIS;
const BX0 = -92, BX1 = 257, BY0 = -268, BY1 = 178.12, BWm = BX1 - BX0, BHm = BY1 - BY0;
const LINES = G.lines(BWm, BHm, { ox: -BX0, oy: -BY0 });
const COLS = LINES.v.map(l => l.m), ROWS = LINES.h.map(l => l.m);
const near = (v, arr) => arr.reduce((b, a) => Math.abs(a - v) < Math.abs(b - v) ? a : b, arr[0]);
// anchor: cx = the icon's own centre line (put on the channel axis), contact = where it meets water or ground (put on the waterline),
// top = its highest point (kept inside the block), xs = half-widths that should land on columns, ys = heights that should land on rows.
// Scale is searched in 0.90..1.12 separately for x and y.
function fit(ic){
  if (ic._fit) return ic._fit;
  const f = ic.anchor; let best = { e: 1e9 }, bestY = { e: 1e9 };
  for (let sx = .9; sx <= 1.12; sx += .001){
    const e = f.xs.reduce((s, w) => s + Math.min(...[AX - w * sx, AX + w * sx].map(x => Math.abs(near(x, COLS) - x))), 0);
    if (e < best.e) best = { e, sx };
  }
  // heights only ever stretch (1.00..1.12): every one of the six fitted at sy 1.001..1.096, never squashed
  for (let sy = 1.0; sy <= 1.12; sy += .001){
    if (WL + (f.top - f.contact) * sy < BY0 + 10) continue;
    const e = f.ys.reduce((s, y) => { const m = WL + (y - f.contact) * sy; return s + Math.abs(near(m, ROWS) - m); }, 0);
    if (e < bestY.e) bestY = { e, sy };
  }
  const sx = best.sx, sy = bestY.sy;
  const snapX = new Set(f.xs.flatMap(w => [near(AX - w * sx, COLS), near(AX + w * sx, COLS)]));
  const snapY = new Set(f.ys.map(y => near(WL + (y - f.contact) * sy, ROWS)));
  return ic._fit = { sx, sy, tx: AX - f.cx * sx, ty: WL - f.contact * sy, snapX, snapY, ex: best.e / f.xs.length, ey: bestY.e / f.ys.length };
}
function gridMask(id, ic, F){
  const cw = (CUT / ((F.sx + F.sy) / 2)).toFixed(2);
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${BX0 - 20}" y="${BY0 - 20}" width="${BWm + 40}" height="${BHm + 40}">
    <g transform="translate(${F.tx.toFixed(2)} ${F.ty.toFixed(2)}) scale(${F.sx.toFixed(3)} ${F.sy.toFixed(3)})">${maskBody(resolve(ic), cw)}</g></mask>`;
}
function lineFilter3(id, seed){
  return `<filter id="${id}" x="-2%" y="-2%" width="104%" height="104%">
    <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="${seed}" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale=".9" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="1" seed="${seed + 1}" result="b"/>
    <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -18 0 0 0 13.6" result="bA"/>
    <feComposite in="d" in2="bA" operator="in"/>
  </filter>`;
}
// display grid, 'simple' level: stroke .5, opacity .32 (solid: .18), waterline .75 at .5 (solid: .28). Quieter than the icon, always.
const simpleGrid = (solid, filter) => G.draw(null, { level: 'simple', opacity: solid ? .18 : .32, datumOpacity: solid ? .28 : .5, width: BWm, height: BHm, ox: -BX0, oy: -BY0, x0: BX0, y0: BY0, strokeWidth: .5, datumWidth: .75, filter, stroke: solid ? INK : HARBOUR });
// the name, small, in the bottom-left cell: left edge on a column line, baseline on a row line
const nameTag = (t, col) => `<rect x="${(-55.7803 + 1).toFixed(2)}" y="${(178.12 - 17).toFixed(2)}" width="${(t.length * 9.4 + 6).toFixed(1)}" height="14" fill="${PAPER}"/><text x="${(-55.7803 + 4).toFixed(2)}" y="${(178.12 - 6).toFixed(2)}" fill="${col}" style="font:700 8.6px 'Ferry Sans';letter-spacing:2.8px">${t}</text>`;
const MARKS = 1.5, MARKT = `translate(${(AX - AX * MARKS).toFixed(2)} ${((BY0 + BY1) / 2 - 71.7 * MARKS).toFixed(2)}) scale(${MARKS})`;

// ink: 'stamp' (v2 stamp-pad ink, Harbour) or 'solid' (flat Ink). Nothing in between.
function block(ic, i, opts = {}){
  const solid = opts.ink === 'solid', width = opts.width || 286, mark = ic === 'MARK';
  const k = `g${i}${solid ? 's' : 'k'}${opts.k || ''}`, col = solid ? INK : HARBOUR;
  const body = mark ? `<g fill="${col}" transform="${MARKT}">${BUTTERFLY}</g>`
    : `<rect x="${BX0 - 10}" y="${BY0 - 10}" width="${BWm + 20}" height="${BHm + 20}" fill="${col}" mask="url(#${k}m)"/>`;
  const F = mark ? null : fit(resolve(ic)), ppu = width / BWm, seedI = mark ? 9 : i;
  const printed = solid ? body : `<g mask="url(#${k}p)"><g filter="url(#${k}i)">${body}</g></g>`;
  return `<svg class="gb" width="${width}" height="${(width * BHm / BWm).toFixed(1)}" viewBox="${BX0} ${BY0} ${BWm} ${BHm}" overflow="hidden">
    <defs>${F ? gridMask(k + 'm', ic, F) : ''}${solid ? '' : inkFilter(k + 'i', 40 + (seedI % 9) * 7, ppu) + pressure(k + 'p', mark ? 190 : press(ic, i), .55) + lineFilter3(k + 'l', 700 + seedI * 7)}</defs>
    ${simpleGrid(solid, solid ? undefined : `url(#${k}l)`)}${printed}${nameTag(mark ? 'MARK' : ic.name, col)}</svg>`;
}
// construction view: flat shape, 'detail' grid over it, the lines the icon snaps to drawn in Ink. For figures only, never display.
function construction(ic, i, width = 430){
  const k = `c${i}`, F = fit(resolve(ic));
  const em = [...F.snapX].map(x => `M${x.toFixed(2)} ${BY0} V${BY1}`).join('') + [...F.snapY].map(y => `M${BX0} ${y.toFixed(2)} H${BX1}`).join('');
  return `<svg class="pb" width="${width}" height="${(width * BHm / BWm).toFixed(1)}" viewBox="${BX0} ${BY0} ${BWm} ${BHm}" overflow="hidden"><defs>${gridMask(k + 'm', ic, F)}</defs>
    <rect x="${BX0 - 10}" y="${BY0 - 10}" width="${BWm + 20}" height="${BHm + 20}" fill="${HARBOUR}" opacity=".82" mask="url(#${k}m)"/>
    ${G.draw(null, { level: 'detail', width: BWm, height: BHm, ox: -BX0, oy: -BY0, x0: BX0, y0: BY0, strokeWidth: .45, datumWidth: 1.3, stroke: HARBOUR, opacity: .75 })}
    <path d="${em}" fill="none" stroke="${INK}" stroke-width="1.1"/>${nameTag(ic.name, HARBOUR)}</svg>`;
}

// ---------- measure: rasterise the entry (2 px per unit) and report the numbers the set is checked against ----------
let probe;
function pathLen(d){
  if (!probe){ const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('style', 'position:absolute;width:0;height:0'); probe = document.createElementNS('http://www.w3.org/2000/svg', 'path'); s.appendChild(probe); document.body.appendChild(s); }
  probe.setAttribute('d', d); return probe.getTotalLength();
}
function measure(ic){
  if (ic._m) return ic._m;
  resolve(ic);
  const S = 2, pad = 20, c = document.createElement('canvas'); c.width = (BW + 2 * pad) * S; c.height = (BH + 2 * pad) * S;
  const x = c.getContext('2d', { willReadFrequently: true });
  const draw = (cuts, withWater) => {
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.setTransform(S, 0, 0, S, pad * S, pad * S);
    x.globalCompositeOperation = 'source-over'; x.fillStyle = '#000';
    ic.paths.forEach(p => { if (withWater || !p.water) x.fill(new Path2D(p.d), p.rule === 'evenodd' ? 'evenodd' : 'nonzero'); });
    x.globalCompositeOperation = 'destination-out'; ic.biteD.forEach(d => x.fill(new Path2D(d)));
    x.globalCompositeOperation = 'source-over'; if (withWater) ic.postD.forEach(d => x.fill(new Path2D(d)));
    if (cuts){ x.globalCompositeOperation = 'destination-out'; x.lineWidth = CUT; x.lineCap = 'round'; ic.cutsD.forEach(d => x.stroke(new Path2D(d))); }
    const a = x.getImageData(0, 0, c.width, c.height).data; let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let j = 0; j < c.height; j++) for (let k = 0; k < c.width; k++) if (a[(j * c.width + k) * 4 + 3] > 127){ n++; if (k < x0) x0 = k; if (k > x1) x1 = k; if (j < y0) y0 = j; if (j > y1) y1 = j; }
    return { n: n / (S * S), x: x0 / S - pad, y: y0 / S - pad, w: (x1 - x0 + 1) / S, h: (y1 - y0 + 1) / S };
  };
  const sil = draw(false, true), ink = draw(true, true), body = draw(false, false), F = fit(ic), a = ic.anchor;
  const r = v => +v.toFixed(3);
  return ic._m = {
    name: ic.name, x: sil.x, y: sil.y, w: sil.w, h: sil.h,
    bodyW: r(body.w / BW), bodyH: r(body.h / BH),            // object without water strip, as a share of the block
    boxW: r(sil.w / BW), boxH: r(sil.h / BH),                // everything printed, as a share of the block
    inkBlock: r(ink.n / (BW * BH)),                          // printed ink over block area
    fillBox: r(sil.n / (sil.w * sil.h)),                     // solidity: silhouette over its own box
    carved: r((sil.n - ink.n) / sil.n),                      // share of the silhouette carved away
    cuts: ic.cutsD.length, cutLen: Math.round(ic.cutsD.reduce((s, d) => s + pathLen(d), 0)),
    cxOff: r(body.x + body.w / 2 - a.cx), axisOff: r(a.cx - 160),
    below: r(sil.y + sil.h - a.contact),                     // how far print runs under the contact line (water strip, piling)
    topGap: r(body.y - a.top),
    sx: r(F.sx), sy: r(F.sy), ex: r(F.ex), ey: r(F.ey),
  };
}

window.FerryIcons = { HARBOUR, INK, PAPER, BW, BH, CUT, HAND, HAND_CUT, SW, SH, PITCH, ND, M, DES, BWm, BHm, WL, AX,
  rng, hand, loop, water, resolve, measure, fit, stamp, impression, small, smallFly, postmark, token, block, construction, SHADOW };
})();

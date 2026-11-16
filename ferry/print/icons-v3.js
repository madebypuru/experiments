// Ferry icons v3: the v1 silhouettes, re-fitted to the Ferry grid and block printed.
// Needs icons-v1.js (shapes, size row, postmark, token) and ferry-grid.js loaded first.
const G = FerryGrid, WL = G.WATERLINE, AX = G.AXIS;
const BX0 = -92, BX1 = 257, BY0 = -268, BY1 = 178.12;          // a block, in mark units: plain rectangle
const BWm = BX1 - BX0, BHm = BY1 - BY0;
const LINES = G.lines(BWm, BHm, { ox: -BX0, oy: -BY0 });       // block lines, in block-local units
const COLS = LINES.v.map(l => l.m), ROWS = LINES.h.map(l => l.m);

// re-fit: each icon is centred on the channel axis, its contact with water or ground sits on the waterline,
// and the scale (sx for widths, sy for heights) is chosen so its main widths and heights land on grid lines.
const SNAP = {
  'BOW':        { cx: 160, contact: 343, top: 112, xs: [106, 87, 34], ys: [236, 178, 148, 326] },
  'LIGHTHOUSE': { cx: 160, contact: 355, top: 72,  xs: [47, 32, 45, 70], ys: [331, 342, 157, 145, 113, 87] },
  'LIFE RING':  { cx: 160, contact: 306, top: 98,  xs: [104, 46], ys: [98, 156, 248, 290] },
  'BOLLARD':    { cx: 160, contact: 346, top: 90,  xs: [68, 46, 82], ys: [90, 134, 147, 318, 331] },
  'GULL':       { cx: 158, contact: 388, top: 110, xs: [40], ys: [300, 132, 267] },
  'WAVE':       { cx: 170, contact: 364, top: 122, xs: [114], ys: [122, 250] },
};
const near = (v, arr) => arr.reduce((b, a) => Math.abs(a - v) < Math.abs(b - v) ? a : b, arr[0]);
function fit(name){
  const f = SNAP[name]; let best = { e: 1e9 };
  for (let sx = .9; sx <= 1.12; sx += .001){
    const e = f.xs.reduce((s, w) => s + Math.min(...[AX - w * sx, AX + w * sx].map(x => Math.abs(near(x, COLS) - x))), 0);
    if (e < best.e) best = { e, sx };
  }
  let bestY = { e: 1e9 };
  for (let sy = .9; sy <= 1.12; sy += .001){
    if (WL + (f.top - f.contact) * sy < BY0 + 10) continue;   // keep the top inside the block
    const e = f.ys.reduce((s, y) => { const m = WL + (y - f.contact) * sy; return s + Math.abs(near(m, ROWS) - m); }, 0);
    if (e < bestY.e) bestY = { e, sy };
  }
  const sx = best.sx, sy = bestY.sy;
  const snapX = new Set(f.xs.flatMap(w => [near(AX - w * sx, COLS), near(AX + w * sx, COLS)]));
  const snapY = new Set(f.ys.map(y => near(WL + (y - f.contact) * sy, ROWS)));
  return { sx, sy, tx: AX - f.cx * sx, ty: WL - f.contact * sy, snapX, snapY, ex: best.e / f.xs.length, ey: bestY.e / f.ys.length };
}

function gridMask(id, ic, F){
  const cw = (CUT / ((F.sx + F.sy) / 2)).toFixed(2);
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${BX0 - 20}" y="${BY0 - 20}" width="${BWm + 40}" height="${BHm + 40}">
    <g transform="translate(${F.tx.toFixed(2)} ${F.ty.toFixed(2)}) scale(${F.sx.toFixed(3)} ${F.sy.toFixed(3)})">
    ${ic.paths.map(p => `<path d="${p.d}" fill="#fff" ${p.rule ? `fill-rule="${p.rule}"` : ''}/>`).join('')}
    ${ic.biteD.map(d => `<path d="${d}" fill="#000"/>`).join('')}
    ${ic.postD.map(d => `<path d="${d}" fill="#fff"/>`).join('')}
    ${ic.cutsD.map(d => `<path d="${d}" fill="none" stroke="#000" stroke-width="${cw}" stroke-linecap="round"/>`).join('')}
    </g></mask>`;
}
// Ferry's pressed block: mostly solid ink, a few worn patches, edges chipped in places
function pressFilter(id, seed){
  return `<filter id="${id}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="${seed}" result="w"/>
    <feDisplacementMap in="SourceGraphic" in2="w" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d1"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="2" seed="${seed + 2}" result="c"/>
    <feDisplacementMap in="d1" in2="c" scale="1.8" xChannelSelector="R" yChannelSelector="B" result="d2"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="${seed + 4}" result="p"/>
    <feColorMatrix in="p" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -34 0 0 0 25.2" result="pA"/>
    <feComposite in="d2" in2="pA" operator="in"/>
  </filter>`;
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
const gridSVG = (filter, sw = .5) => G.draw(null, { level: 'simple', opacity: .32, datumOpacity: .5, width: BWm, height: BHm, ox: -BX0, oy: -BY0, x0: BX0, y0: BY0, strokeWidth: sw, datumWidth: .75, filter, stroke: HARBOUR });
// the name, small, in the bottom-left cell: left edge on a column line, baseline on a row line
const nameTag = (t) => `<rect x="${(-55.7803 + 1).toFixed(2)}" y="${(178.12 - 17).toFixed(2)}" width="${(t.length * 9.4 + 6).toFixed(1)}" height="14" fill="#F2EEE6"/><text x="${(-55.7803 + 4).toFixed(2)}" y="${(178.12 - 6).toFixed(2)}" fill="${HARBOUR}" style="font:700 8.6px 'Ferry Sans';letter-spacing:2.8px">${t}</text>`;

// ---------- ink: 'stamp' (the v2 stamp-pad ink, default) or 'solid' (flat Ink, no texture). ?ink=solid switches every block ----------
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
const INKMODE = new URLSearchParams(location.search).get('ink') === 'solid' ? 'solid' : 'stamp';
const PRESS = [200, 160, 230, 140, 210, 180];   // the v2 stamps' pressure angles
const MARKS = 1.5, MARKT = `translate(${(AX - AX * MARKS).toFixed(2)} ${((BY0 + BY1) / 2 - 71.7 * MARKS).toFixed(2)}) scale(${MARKS})`; // the mark centred, at icon size

function gridBlock(ic, i, opts = {}){
  const ink = opts.ink || INKMODE, solid = ink === 'solid';
  const k = `g${i}${opts.k || ''}${solid ? 's' : ''}`, col = solid ? INK : HARBOUR;
  const body = ic === 'MARK'
    ? `<g fill="${col}" transform="${MARKT}">${BUTTERFLY}</g>`
    : `<rect x="${BX0 - 10}" y="${BY0 - 10}" width="${BWm + 20}" height="${BHm + 20}" fill="${col}" mask="url(#${k}m)"/>`;
  const F = ic === 'MARK' ? null : fit(ic.name);
  const ppu = (opts.cls === 'pb' ? 430 : 286) / BWm;
  const grid = solid
    ? G.draw(null, { level: 'simple', opacity: .18, datumOpacity: .28, width: BWm, height: BHm, ox: -BX0, oy: -BY0, x0: BX0, y0: BY0, strokeWidth: .5, datumWidth: .75, stroke: INK })
    : gridSVG(`url(#${k}l)`);
  const printed = solid ? body : `<g mask="url(#${k}p)"><g filter="url(#${k}i)">${body}</g></g>`;
  return `<svg class="${opts.cls || 'gb'}" viewBox="${BX0} ${BY0} ${BWm} ${BHm}" overflow="hidden">
    <defs>${F ? gridMask(k + 'm', ic, F) : ''}${solid ? '' : inkFilter(k + 'i', 40 + (i % 9) * 7, ppu) + pressure(k + 'p', PRESS[i] ?? 190, .55) + lineFilter3(k + 'l', 700 + i * 7)}</defs>
    ${grid}
    ${printed}
    ${solid ? nameTag(ic === 'MARK' ? 'MARK' : ic.name).replace(`fill="${HARBOUR}"`, `fill="${INK}"`) : nameTag(ic === 'MARK' ? 'MARK' : ic.name)}
  </svg>`;
}
// construction view: the icon as a flat shape, the grid over it, the lines it snaps to emphasised
function construction(ic, i){
  const k = `c${i}`, F = fit(ic.name);
  const em = [...F.snapX].map(x => `M${x.toFixed(2)} ${BY0} V${BY1}`).join('') + [...F.snapY].map(y => `M${BX0} ${y.toFixed(2)} H${BX1}`).join('');
  return `<svg class="pb" viewBox="${BX0} ${BY0} ${BWm} ${BHm}" overflow="hidden"><defs>${gridMask(k + 'm', ic, F)}</defs>
    <rect x="${BX0 - 10}" y="${BY0 - 10}" width="${BWm + 20}" height="${BHm + 20}" fill="${HARBOUR}" opacity=".82" mask="url(#${k}m)"/>
    ${G.draw(null, { level: 'detail', width: BWm, height: BHm, ox: -BX0, oy: -BY0, x0: BX0, y0: BY0, strokeWidth: .45, datumWidth: 1.3, stroke: HARBOUR, opacity: .75 })}
    <path d="${em}" fill="none" stroke="${INK}" stroke-width="1.1"/>
    ${nameTag(ic.name)}
  </svg>`;
}
// the origin: the mark with its construction lines run out across the frame
function hero(){
  const W = 1260, H = 430, s = 2.4, ox = W / 2 - AX * s, oy = H / 2 - 71.7 * s;
  return `<svg class="hero" viewBox="0 0 ${W} ${H}">
    ${G.draw(null, { level: 'detail', width: W, height: H, scale: s, ox, oy, strokeWidth: .8, datumWidth: 1.8, stroke: HARBOUR, opacity: .8 })}
    <g transform="translate(${ox} ${oy}) scale(${s})" fill="${HARBOUR}">${BUTTERFLY}</g>
  </svg>`;
}

document.getElementById('hero').innerHTML = hero();
document.getElementById('blocks').innerHTML = gridBlock('MARK', 9) + ICONS.map((ic, i) => gridBlock(ic, i)).join('');
document.getElementById('blocks2').innerHTML = gridBlock('MARK', 9, { ink: 'solid' }) + ICONS.map((ic, i) => gridBlock(ic, i, { ink: 'solid' })).join('');
document.getElementById('pair').innerHTML = construction(ICONS[1], 1) + gridBlock(ICONS[1], 1, { k: 'x', cls: 'pb' });
window.FIT = Object.fromEntries(ICONS.map(ic => { const F = fit(ic.name); return [ic.name, { sx: +F.sx.toFixed(3), sy: +F.sy.toFixed(3), ex: +F.ex.toFixed(2), ey: +F.ey.toFixed(2) }]; }));
document.body.dataset.fit = JSON.stringify(window.FIT);

requestAnimationFrame(() => { document.body.dataset.h = document.documentElement.scrollHeight; });

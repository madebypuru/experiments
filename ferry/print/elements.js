// Ferry brand elements: a family of small secondary marks, each in one flat brand colour, built from Ferry's own devices
// (the stamp icons, the stepped notch, the perforated stamp, the postmark, the transfer ticket, the mark and the lockup).
// elements.html            the 1080 x 1350 sheet
// elements.html?only=NAME   one element large and centred; add &bg=none for a transparent ground
(async function(){
const C = { ink:'#1B262B', harbour:'#2C454B', glass:'#6B8A94', stone:'#D2A57F', grass:'#7D8F69', signal:'#D2602C', paper:'#F2EEE6', mist:'#C9CDBD' };
const q = new URLSearchParams(location.search), ONLY = q.get('only'), CLEAR = q.get('bg') === 'none';
if (CLEAR) document.documentElement.classList.add('clear');
await Promise.all(['400', '700'].map(w => document.fonts.load(`${w} 40px "Ferry Sans"`)));

// ---------- the mark and the lockup, used exactly as exported (recoloured, never redrawn) ----------
async function asset(url){
  const svg = new DOMParser().parseFromString(await (await fetch(url)).text(), 'image/svg+xml').documentElement;
  const vb = svg.getAttribute('viewBox').trim().split(/[\s,]+/).map(Number);
  const xs = new XMLSerializer();
  return { vb, paths: [...svg.children].map(n => xs.serializeToString(n)).join('').replace(/ fill="[^"]*"/g, '').replace(/ id="[^"]*"/g, '') };
}
const MARK = await asset('../src/butterfly-mark.svg'), LOCK = await asset('../export/ferry-lockup-clean.svg');
const put = (a, cx, cy, w, fill) => { const s = w / a.vb[2], h = a.vb[3] * s;
  return `<g transform="translate(${(cx - w / 2).toFixed(2)} ${(cy - h / 2).toFixed(2)}) scale(${s.toFixed(5)}) translate(${-a.vb[0]} ${-a.vb[1]})" fill="${fill}">${a.paths}</g>`; };

// ---------- type: Ferry Sans only ----------
const cv = document.createElement('canvas').getContext('2d');
const tw = (t, size, w = 700, ls = 0) => { cv.font = `${w} ${size}px "Ferry Sans"`; return cv.measureText(t).width + ls * (t.length - 1); };
const capH = (size, w = 700) => { cv.font = `${w} ${size}px "Ferry Sans"`; return cv.measureText('H').actualBoundingBoxAscent; };
// x is the visual anchor; letter-spacing's trailing space is taken out of middle and end anchors
function T(x, y, t, size, w, ls, fill, anchor = 'start', extra = ''){
  const dx = anchor === 'middle' ? ls / 2 : anchor === 'end' ? ls : 0;
  return `<text x="${(x + dx).toFixed(2)}" y="${y}" fill="${fill}" text-anchor="${anchor}" style="font:${w} ${size}px 'Ferry Sans';letter-spacing:${ls}px"${extra}>${t}</text>`;
}
// text on a circle centred on 0,0. top: reads left to right over the top, glyphs outward. bottom: left to right under, glyphs inward.
function arc(id, t, r, top, size, w, ls, fill){
  const d = top ? `M${-r} 0 A${r} ${r} 0 0 1 ${r} 0` : `M${-r} 0 A${r} ${r} 0 0 0 ${r} 0`;
  return `<path id="${id}" d="${d}" fill="none"/><text fill="${fill}" text-anchor="middle" dx="${ls / 2}" style="font:${w} ${size}px 'Ferry Sans';letter-spacing:${ls}px"><textPath href="#${id}" startOffset="50%">${t}</textPath></text>`;
}

// ---------- the stepped notch: the profile of the mark's inner edge, three steps (stamp.js) ----------
const PROF = [[-.5, 0], [-.5, .38], [-.33, .38], [-.33, .72], [-.17, .72], [-.17, 1], [.17, 1], [.17, .72], [.33, .72], [.33, .38], [.5, .38], [.5, 0]];
// a rectangle with small round corners and stepped notches cut into its edges (positions in x for top/bottom, y for left/right)
function stepRect(W, H, o){
  const r = o.r || 0, nw = o.nw, nd = o.nd, f = v => v.toFixed(2);
  let d = `M${r} 0`;
  const edge = (ts, ox, oy, ux, uy, nx, ny) => ts.sort((a, b) => a - b).forEach(t => PROF.forEach(([a, b]) => { d += ` L${f(ox + ux * (t + a * nw) + nx * b * nd)} ${f(oy + uy * (t + a * nw) + ny * b * nd)}`; }));
  edge([...(o.top || [])], 0, 0, 1, 0, 0, 1);              d += ` L${W - r} 0` + (r ? ` A${r} ${r} 0 0 1 ${W} ${r}` : '');
  edge([...(o.right || [])], W, 0, 0, 1, -1, 0);           d += ` L${W} ${H - r}` + (r ? ` A${r} ${r} 0 0 1 ${W - r} ${H}` : '');
  edge((o.bottom || []).map(x => W - x), W, H, -1, 0, 0, -1); d += ` L${r} ${H}` + (r ? ` A${r} ${r} 0 0 1 0 ${H - r}` : '');
  edge((o.left || []).map(y => H - y), 0, H, 0, -1, 1, 0);  d += ` L0 ${r}` + (r ? ` A${r} ${r} 0 0 1 ${r} 0` : '');
  return d + 'Z';
}
// one perforation notch of the Ferry stamp, opening outward from the edge point cx,cy (stamp.js geometry, scaled)
function perf(cx, cy, ang, nw, nd){
  const c = Math.cos(ang), s = Math.sin(ang);
  const p = PROF.map(([a, b], i) => [a * nw, i === 0 || i === PROF.length - 1 ? -nd * 1.5 : b * nd]);
  return `<polygon points="${p.map(([x, y]) => `${(cx + x * c - y * s).toFixed(2)},${(cy + x * s + y * c).toFixed(2)}`).join(' ')}" fill="#000"/>`;
}

// ---------- inks ----------
// stamp-pad ink (the v2 stamp ink, the client's pick): ink spread a hair into the paper, blotchy pressure x fine grain.
// ppu = screen px per unit, so the grain is the same size on screen at every scale. No pressure gradient on this sheet.
function padInk(id, ppu, seed, w, h){
  const g = .8 * ppu, b = .034 * ppu;
  return `<filter id="${id}" filterUnits="userSpaceOnUse" x="-40" y="-40" width="${w + 80}" height="${h + 80}" color-interpolation-filters="sRGB">
    <feMorphology in="SourceGraphic" operator="dilate" radius="${(.3 / ppu).toFixed(2)}" result="sp"/>
    <feGaussianBlur in="sp" stdDeviation="${(.35 / ppu).toFixed(2)}" result="soft"/>
    <feTurbulence type="fractalNoise" baseFrequency="${(b * 1.1).toFixed(4)} ${(b * 1.5).toFixed(4)}" numOctaves="2" seed="${seed}" result="bl"/>
    <feTurbulence type="fractalNoise" baseFrequency="${g.toFixed(3)}" numOctaves="2" seed="${seed + 4}" result="gr"/>
    <feComposite in="bl" in2="gr" operator="arithmetic" k2=".7" k3=".5" k4="-0.2" result="m"/>
    <feColorMatrix in="m" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.5 0.05" result="a"/>
    <feComposite in="soft" in2="a" operator="in"/></filter>`;
}
// the FERRY POST cancel's broken ink (stamp.js postmark): lines may break, lettering stays whole
function cancelInk(id, ppu, seed, w, h, full){
  return `<filter id="${id}" filterUnits="userSpaceOnUse" x="-200" y="-200" width="${w + 400}" height="${h + 400}">
    <feTurbulence type="fractalNoise" baseFrequency="${(.03 * ppu).toFixed(4)} ${(.045 * ppu).toFixed(4)}" numOctaves="2" seed="${seed}" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="${(.8 * ppu).toFixed(3)}" numOctaves="2" seed="5" result="g"/>
    <feComposite in="b" in2="g" operator="arithmetic" k2=".7" k3=".5" k4="-0.2" result="m"/>
    <feColorMatrix in="m" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${full ? '2.2 -0.05' : '2.4 -0.1'}" result="a"/>
    <feComposite in="SourceGraphic" in2="a" operator="in"/></filter>`;
}
// a solid element: the mask holds the shape (white) and its knock-outs (black); the colour prints through it in stamp-pad ink
const solid = (k, ppu, w, h, col, inner, seed) => `<defs><mask id="${k}m" maskUnits="userSpaceOnUse" x="-40" y="-40" width="${w + 80}" height="${h + 80}">${inner}</mask>${padInk(k + 'i', ppu, seed, w, h)}</defs>
  <g filter="url(#${k}i)"><rect x="-40" y="-40" width="${w + 80}" height="${h + 80}" fill="${col}" mask="url(#${k}m)"/></g>`;

// ---------- stamp icons, from the locked library (never redrawn) ----------
const F = window.FerryIcons, LIB = Object.fromEntries(window.FERRY_LIBRARY.map(ic => [ic.name, ic]));
function iconShapes(name, on, off){
  const ic = F.resolve(LIB[name]);
  return ic.paths.map(p => `<path d="${p.d}" fill="${on}"${p.rule ? ` fill-rule="${p.rule}"` : ''}/>`).join('')
    + ic.biteD.map(d => `<path d="${d}" fill="${off}"/>`).join('') + ic.postD.map(d => `<path d="${d}" fill="${on}"/>`).join('')
    + ic.cutsD.map(d => `<path d="${d}" fill="none" stroke="${off}" stroke-width="${F.CUT}" stroke-linecap="round"/>`).join('');
}
// place an icon so its printed box is centred on cx,cy and `h` tall
function iconAt(name, cx, cy, h, on, off){
  const m = F.measure(LIB[name]), s = h / m.h;
  return `<g transform="translate(${(cx - (m.x + m.w / 2) * s).toFixed(2)} ${(cy - (m.y + m.h / 2) * s).toFixed(2)}) scale(${s.toFixed(4)})">${iconShapes(name, on, off)}</g>`;
}
const iconSize = (name, h) => { const m = F.measure(LIB[name]); return [m.w * h / m.h, h]; };

// ---------- the elements. Each: w, h (sheet px) and body(k, ppu) in 0..w, 0..h ----------
const E = {};

// signal pennant: a burgee on a staff, its fly cut in the stepped notch, the mark knocked out at the hoist. The sheet's one Signal.
E.pennant = { w: 222, h: 214, body(k, ppu){
  const fly = PROF.map(([a, b]) => `${(214 - b * 32).toFixed(1)},${(61 + a * 36).toFixed(1)}`).join(' ');
  return solid(k, ppu, this.w, this.h, C.signal, `
    <rect x="6" y="8" width="7" height="204" rx="2" fill="#fff"/><circle cx="9.5" cy="7" r="6.5" fill="#fff"/>
    <polygon points="12,16 ${fly} 12,106" fill="#fff"/>
    ${put(MARK, 62, 61, 52, '#000')}`, 31);
} };

// stacked line: the brand line set in two weights, both lines cut to one measure, split by the channel
E.stack = { w: 290, h: 0, setup(){
  const W = this.w, l1 = 'SAFE PASSAGE', l2 = 'BETWEEN CHAINS', ls1 = -.6, ls2 = 1.2;
  this.s1 = (W - ls1 * (l1.length - 1)) / tw(l1, 100, 700) * 100;
  this.s2 = (W - ls2 * (l2.length - 1)) / tw(l2, 100, 400) * 100;
  const c1 = capH(this.s1, 700), c2 = capH(this.s2, 400);
  this.y1 = c1; this.rule = c1 + c1 * .36; this.y2 = this.rule + c1 * .36 + c2; this.h = Math.ceil(this.y2 + 1);
  return this;
}, body(k){
  const W = this.w, ch = 16, r = this.rule;
  return `${T(0, this.y1.toFixed(2), 'SAFE PASSAGE', this.s1.toFixed(2), 700, -.6, C.ink)}
    <path d="M0 ${r} H${W / 2 - ch / 2} M${W / 2 + ch / 2} ${r} H${W}" stroke="${C.ink}" stroke-width="2.6"/>
    ${T(0, this.y2.toFixed(2), 'BETWEEN CHAINS', this.s2.toFixed(2), 400, 1.2, C.ink)}`;
} };

// round seal: the line on the ring, upright top and bottom, the mark in the centre. Avatar and sticker.
E.seal = { w: 170, h: 170, body(k, ppu){
  return solid(k, ppu, this.w, this.h, C.harbour, `<g transform="translate(85 85)">
    <circle r="83" fill="#fff"/><circle r="52" fill="none" stroke="#000" stroke-width="2.2"/>
    ${arc(k + 'a', 'SAFE PASSAGE', 62, true, 12, 700, 3, '#000')}${arc(k + 'b', 'BETWEEN CHAINS', 70.8, false, 12, 700, 3, '#000')}
    <circle cx="-66.4" r="2.6" fill="#000"/><circle cx="66.4" r="2.6" fill="#000"/>
    ${put(MARK, 0, 0, 58, '#000')}</g>`, 47);
} };

// passage card: the "official vendor" card idea as a boarding card. Receipt header, event pass.
E.card = { w: 320, h: 190, body(k){
  const c = C.grass, L = 22, R = 298;
  return `<rect x="1.25" y="1.25" width="317.5" height="187.5" rx="6" fill="none" stroke="${c}" stroke-width="2.5"/>
    ${put(LOCK, L + 46, 38, 92, c)}
    ${T(R, 34, 'SAFE PASSAGE', 9, 700, 2.4, c, 'end')}${T(R, 48, 'BETWEEN CHAINS', 9, 400, 2.4, c, 'end')}
    <path d="M${L} 64 H${R}" stroke="${c}" stroke-width="1.2"/>
    ${T(L, 88, 'FROM', 9, 700, 2.2, c)}${T(L, 117, 'SOL', 24, 700, .5, c)}<path d="M${L} 126 H148" stroke="${c}" stroke-width="1.2"/>
    ${T(172, 88, 'TO', 9, 700, 2.2, c)}${T(172, 117, 'ETH', 24, 700, .5, c)}<path d="M172 126 H${R}" stroke="${c}" stroke-width="1.2"/>
    ${T(L, 165, 'PORT 01', 10, 700, 2.4, c)}${T(L + 66, 165, 'TO', 10, 400, 2.4, c)}${T(L + 90, 165, 'PORT 02', 10, 700, 2.4, c)}
    <rect x="234" y="147" width="64" height="25" rx="3" fill="none" stroke="${c}" stroke-width="1.6"/>${T(266, 164.5, 'PAID', 11, 700, 3.4, c, 'middle')}`;
} };

// stamp icons alone, in stamp-pad ink: stickers, empty states, section heads
const iconEl = (name, h, col, seed) => { const [w] = iconSize(name, h);
  return { w: Math.ceil(w), h, body(k, ppu){ return solid(k, ppu, this.w, this.h, col, iconAt(name, this.w / 2, h / 2, h, '#fff', '#000'), seed); } }; };
E.gull = iconEl('GULL', 164, C.stone, 63);
E.bow = iconEl('BOW', 146, C.harbour, 71);

// oval badge: the lockup with the line, for docs headers and laptop stickers
E.oval = { w: 304, h: 144, body(k){
  const c = C.glass;
  return `<ellipse cx="152" cy="72" rx="150.7" ry="70.7" fill="none" stroke="${c}" stroke-width="2.6"/>
    <ellipse cx="152" cy="72" rx="142" ry="62" fill="none" stroke="${c}" stroke-width="1"/>
    ${put(LOCK, 152, 61, 150, c)}${T(152, 105, 'SAFE PASSAGE BETWEEN CHAINS', 9.5, 400, 1.6, c, 'middle')}`;
} };

// perforated stamp: the Ferry stamp's stepped perforation, the lighthouse knocked out of a solid field, a value
E.stamp = { w: 180, h: 225, body(k, ppu){
  const P = 15, nw = P / 2, nd = 5.2; let holes = '';
  for (let x = 0; x <= 180.1; x += P){ holes += perf(x, 0, 0, nw, nd) + perf(x, 225, Math.PI, nw, nd); }
  for (let y = P; y < 225 - .1; y += P){ holes += perf(0, y, -Math.PI / 2, nw, nd) + perf(180, y, Math.PI / 2, nw, nd); }
  return solid(k, ppu, this.w, this.h, C.harbour, `<rect width="180" height="225" fill="#fff"/>${holes}
    <rect x="14" y="14" width="152" height="197" fill="none" stroke="#000" stroke-width="1.3"/>
    ${T(25, 38, 'FERRY', 10, 700, 3.4, '#000')}${T(156, 44, '01', 27, 700, 0, '#000', 'end')}
    ${iconAt('LIGHTHOUSE', 90, 121, 112, '#000', '#fff')}
    ${T(90, 198, 'SAFE PASSAGE', 8.5, 700, 2.6, '#000', 'middle')}`, 23);
} };

// the FERRY POST cancel: date stamp with wave cancel lines. Receipt and email mark for an arrived transfer.
E.postmark = { w: 296, h: 150, body(k, ppu){
  let waves = ''; for (const y of [-27, -9, 9, 27]) waves += `<path d="M80 ${y} q 23 -9 46 0 t 46 0 t 46 0" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round"/>`;
  return `<defs>${cancelInk(k + 'f', ppu, 9, this.w, this.h, false)}${cancelInk(k + 't', ppu, 21, this.w, this.h, true)}</defs>
    <g transform="translate(75 75)" opacity=".9">
      <g filter="url(#${k}f)"><circle r="68" fill="none" stroke="${C.ink}" stroke-width="4"/><circle r="46" fill="none" stroke="${C.ink}" stroke-width="2"/>${waves}</g>
      <g filter="url(#${k}t)">${arc(k + 'a', 'FERRY POST', 53.6, true, 11, 700, 3.4, C.ink)}${arc(k + 'b', 'ARRIVED', 61.6, false, 11, 700, 3.4, C.ink)}
        <circle cx="-57.5" r="2.2" fill="${C.ink}"/><circle cx="57.5" r="2.2" fill="${C.ink}"/>
        ${T(0, -2, '12 NOV', 14, 700, 1, C.ink, 'middle')}${T(0, 17, '2026', 14, 400, 1.5, C.ink, 'middle')}</g>
    </g>`;
} };

// cargo tag: the transfer as luggage in transit, stepped shoulders from the mark. Swag tag, "in transit" mark.
E.tag = { w: 130, h: 312, body(k){
  const c = C.stone, a = 14, t = 48, W = 130, H = 312;
  const d = `M0 ${t + 2 * a} H${a} V${t + a} H${2 * a} V${t} H${W - 2 * a} V${t + a} H${W - a} V${t + 2 * a} H${W} V${H - 6} A6 6 0 0 1 ${W - 6} ${H} H6 A6 6 0 0 1 0 ${H - 6} Z`;
  return `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="miter" transform="translate(0 -1.2)"/>
    <circle cx="65" cy="80" r="8" fill="none" stroke="${c}" stroke-width="2"/><circle cx="65" cy="80" r="14" fill="none" stroke="${c}" stroke-width="1.2"/>
    <path d="M61 73 C44 50 46 18 66 8 C86 -2 100 22 90 40 C84 52 74 62 69 73" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>
    ${T(65, 122, 'FERRY', 12, 700, 4, c, 'middle')}<path d="M16 134 H114" stroke="${c}" stroke-width="1.2"/>
    ${T(65, 157, 'FROM', 9.5, 700, 2.5, c, 'middle')}${T(65, 192, 'SOL', 32, 700, .5, c, 'middle')}
    ${T(65, 216, 'TO', 9.5, 700, 2.5, c, 'middle')}${T(65, 251, 'BASE', 32, 700, .5, c, 'middle')}
    <path d="M16 266 H114" stroke="${c}" stroke-width="1.2"/>${T(65, 290, 'CROSSING', 9.5, 700, 3, c, 'middle')}`;
} };

// chain-code badge: the route as a pill with the channel notched top and bottom; the ferry dot is crossing it
E.chain = { w: 250, h: 64, body(k, ppu){
  let dots = ''; for (let x = 150; x <= 166; x += 5.5) dots += `<circle cx="${x}" cy="32" r="1.3" fill="#000"/>`;
  return solid(k, ppu, this.w, this.h, C.glass, `<path d="${stepRect(250, 64, { r: 6, nw: 22, nd: 11, top: [125], bottom: [125] })}" fill="#fff"/>
    ${T(22, 41, 'SOL', 24, 700, .5, '#000')}${T(228, 41, 'ETH', 24, 700, .5, '#000', 'end')}
    <path d="M84 32 H136" stroke="#000" stroke-width="2.4"/><circle cx="140" cy="32" r="4.6" fill="#000"/>${dots}`, 55);
} };

// ticket stub: ADMIT ONE CROSSING, torn at the stepped notch like the transfer ticket. Event pass, giveaway, X post.
E.ticket = { w: 300, h: 118, body(k){
  const c = C.grass;
  return `<path d="${stepRect(300, 118, { r: 4, nw: 20, nd: 10, top: [222], bottom: [222] })}" fill="none" stroke="${c}" stroke-width="2.4" transform="translate(1.2 1.2) scale(${(297.6 / 300).toFixed(4)} ${(115.6 / 118).toFixed(4)})"/>
    <path d="M222 16 V102" stroke="${c}" stroke-width="1.4" stroke-dasharray="3 4"/>
    ${T(20, 31, 'ADMIT ONE', 10, 700, 3.5, c)}${T(18, 70, 'CROSSING', 32, 700, .3, c)}
    ${T(20, 98, 'SOL', 12, 700, 1, c)}<path d="M54 94 H116" stroke="${c}" stroke-width="1.6"/><circle cx="120" cy="94" r="3.4" fill="${c}"/>
    <path d="M128 94 H170" stroke="${c}" stroke-width="1.6" stroke-dasharray="1.6 3.4"/>${T(204, 98, 'ETH', 12, 700, 1, c, 'end')}
    ${T(0, 0, 'PORT 01', 11, 700, 3.2, c, 'middle', ` transform="translate(265 59) rotate(-90) translate(0 4)"`)}`;
} };
E.stack.setup();

// ---------- layout: four rows, three a row, staggered; centres and turns in sheet px ----------
const SHEET = [
  ['pennant', 222, 208, -6], ['stack', 548, 212, 0], ['seal', 868, 218, 0],
  ['card', 246, 522, -3], ['gull', 570, 516, 0], ['oval', 870, 508, 0],
  ['stamp', 200, 858, 4], ['postmark', 540, 850, -5], ['tag', 892, 862, 7],
  ['chain', 236, 1172, 0], ['bow', 552, 1168, 0], ['ticket', 860, 1172, -4],
];
const host = document.getElementById('sheet');
function draw(name, cx, cy, rot, S){
  const e = E[name], w = e.w * S, h = e.h * S, k = `${name}${Math.round(S * 100)}`;
  host.insertAdjacentHTML('beforeend', `<svg data-el="${name}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="0 0 ${e.w} ${e.h}" style="left:${(cx - w / 2).toFixed(1)}px;top:${(cy - h / 2).toFixed(1)}px;transform:rotate(${rot}deg)">${e.body(k, S)}</svg>`);
}
if (ONLY && E[ONLY]){
  const e = E[ONLY], S = Math.min(820 / e.w, 980 / e.h);
  draw(ONLY, 540, 675, 0, S);
} else if (ONLY){
  host.innerHTML = `<p style="font:400 16px 'Ferry Sans';padding:40px">No element named ${ONLY}. Names: ${Object.keys(E).join(', ')}</p>`;
} else SHEET.forEach(([n, x, y, r]) => draw(n, x, y, r, 1));
// overlap check: element boxes (rotated corners) must keep apart; written to data-gaps for the headless check
const boxes = [...host.querySelectorAll('svg')].map(s => { const b = s.getBoundingClientRect(); return { n: s.dataset.el, b }; });
const gaps = []; for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++){
  const A = boxes[i].b, B = boxes[j].b, gx = Math.max(B.left - A.right, A.left - B.right), gy = Math.max(B.top - A.bottom, A.top - B.bottom);
  gaps.push([boxes[i].n, boxes[j].n, Math.round(Math.max(gx, gy))]); }
document.body.dataset.gaps = JSON.stringify(gaps.filter(g => g[2] < 50));
document.body.dataset.edges = JSON.stringify(boxes.map(o => [o.n, Math.round(o.b.left), Math.round(o.b.top), Math.round(1080 - o.b.right), Math.round(1350 - o.b.bottom)]));
document.title = 'ready';
})();

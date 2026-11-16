// The Ferry grid: construction lines taken from the butterfly mark (src/butterfly-mark.svg), in mark units.
// Verticals: every x where the mark has a vertical edge. Horizontals: every y where it has a horizontal edge,
// plus the waterline (the centre of the noses). The intervals repeat outward with the mark's own period,
// so the grid can cover any frame and keeps the mark's rhythm: unequal columns mirrored about a narrow channel.
// opt.level: 'simple' = an even grid of square cells (opt.cell, default 2.7 x the channel width), split by the narrow channel
//   column at the mark's axis, with the waterline as the one heavier line (opt.datumWidth/datumOpacity); frame edges drawn plainly.
// (older note follows) opt.level: 'detail' (default) = every line, for showing construction. 'simple' = the primary lines only, for display:
//   verticals: outer edge (left = right of the previous repeat), berth-notch inner faces, the two channel (nose) faces;
//   horizontals: top/bottom, nose top, waterline (heavier), nose bottom. Lines closer than 6% of the mark's width are
//   thinned, keeping channel sides and the waterline first. Same call signatures either way.
(function(){
  // left half: outer edge, berth-notch depth, top tread, second tread, nose. Right half as drawn in the path.
  const X = [0, 24.2617, 35.6025, 55.7803, 74.7617, 90.2371, 109.219, 129.397, 140.737];
  const PX = 165;                                   // the mark's width: the horizontal period
  // top, riser, nose top, notch top, notch bottom, nose bottom, riser, (bottom = next top)
  const Y = [0.521362, 12.2811, 35.7059, 42.1483, 85.2245, 92.6864, 125.128];
  const PY = 142.93 - 0.521362;                     // the mark's height: the vertical period
  const WATERLINE = (35.7059 + 92.6864) / 2;        // centre of the noses, 44.9% of the height
  const CHANNEL = [74.7617, 90.2371], AXIS = (CHANNEL[0] + CHANNEL[1]) / 2;
  const C = CHANNEL[1] - CHANNEL[0], CELL = 2.7 * C;   // simple level: one square module, about 2.2 treads (a tread is 1.25c)

  // all lines inside a frame. Output coordinates: out = o + mark * scale.
  // width/height are in output units; ox, oy place the mark's origin.
  function lines(width, height, opt = {}){
    const s = opt.scale ?? 1, ox = opt.ox ?? 0, oy = opt.oy ?? 0;
    const m0x = -ox / s, m1x = (width - ox) / s, m0y = -oy / s, m1y = (height - oy) / s;
    const v = [], h = [], simple = opt.level === 'simple';
    if (simple){
      const cell = opt.cell ?? CELL, hc = C / 2;
      for (let k = 0; AXIS + hc + k * cell <= m1x + cell; k++) for (const sg of [1, -1]){
        const m = AXIS + sg * (hc + k * cell); if (m >= m0x && m <= m1x) v.push({ x: ox + m * s, m, channel: k === 0 });
      }
      v.push({ x: ox + m0x * s, m: m0x, edge: true }, { x: ox + m1x * s, m: m1x, edge: true });
      for (let k = Math.floor((m0y - WATERLINE) / cell); WATERLINE + k * cell <= m1y; k++){
        const m = WATERLINE + k * cell; if (m >= m0y && m <= m1y) h.push({ y: oy + m * s, m, waterline: k === 0, datum: k === 0 });
      }
      h.push({ y: oy + m0y * s, m: m0y, edge: true }, { y: oy + m1y * s, m: m1y, edge: true });
    } else {
    for (let k = Math.floor(m0x / PX) - 1; k <= Math.ceil(m1x / PX) + 1; k++)
      for (const x of X){ const m = x + k * PX; if (m >= m0x && m <= m1x) v.push({ x: ox + m * s, m, channel: k === 0 && (x === CHANNEL[0] || x === CHANNEL[1]) }); }
    for (let k = Math.floor(m0y / PY) - 1; k <= Math.ceil(m1y / PY) + 1; k++){
      for (const y of Y){ const m = y + k * PY; if (m >= m0y && m <= m1y) h.push({ y: oy + m * s, m }); }
      const w = WATERLINE + k * PY; if (w >= m0y && w <= m1y) h.push({ y: oy + w * s, m: w, waterline: true, datum: k === 0 });
    }
    }
    v.sort((a, b) => a.x - b.x); h.sort((a, b) => a.y - b.y);
    return { v, h };
  }
  // SVG markup for the grid; appended to target (an SVG element) when one is given.
  function draw(target, opt = {}){
    const W = opt.width, H = opt.height, L = lines(W, H, opt), x0 = opt.x0 ?? 0, y0 = opt.y0 ?? 0;
    const col = opt.stroke ?? '#2C454B', sw = opt.strokeWidth ?? .8, dw = opt.datumWidth ?? sw * 2.2;
    let d = '', dd = '';
    L.v.forEach(l => d += `M${(x0 + l.x).toFixed(2)} ${y0} V${y0 + H}`);
    L.h.forEach(l => { const seg = `M${x0} ${(y0 + l.y).toFixed(2)} H${x0 + W}`; if (l.datum) dd += seg; else d += seg; });
    const svg = `<g class="ferry-grid" fill="none" stroke="${col}"${opt.filter ? ` filter="${opt.filter}"` : ''}><path d="${d}" stroke-width="${sw}" opacity="${opt.opacity ?? 1}"/><path d="${dd}" stroke-width="${dw}"${opt.datumOpacity ? ` opacity="${opt.datumOpacity}"` : ''}/></g>`;
    if (target && target.insertAdjacentHTML) target.insertAdjacentHTML('beforeend', svg);
    return svg;
  }
  window.FerryGrid = { X, Y, CELL, PX, PY, WATERLINE, CHANNEL, AXIS, lines, draw };
})();

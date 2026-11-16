// Paints the wide lighthouse plates with Paint's real gouache path, once, then relights that one painting into the
// four plates the scene blends, the way Paint's own Time control does (gcNight's tints and moon over unchanged paint),
// so day, golden, dusk and night register stroke for stroke.
//   gcPlan -> board toning (G.under, as gcFrame) -> each spec: gcBuildLayer + gcStroke, plus one "Adding finer detail"
//   layer as gcMore adds it -> gcNight for the moon and stars -> FX per look -> gcCompose -> 2880 x 1800 PNG
// Math.random is seeded before the page loads, so a run is repeatable.
// usage: node paint-wide.mjs <outdir> <seed> <detail> <moonX> <moonY> <moonR>   (moon in fractions of the painting)
import { chromium } from 'playwright'; import fs from 'fs';
const [outdir, seed = '11', detail = '2', mx = '.42', my = '.1', mr = '.0096'] = process.argv.slice(2);
const OW = 2880, OH = 1800;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 2000, height: 1100 }, deviceScaleFactor: 2 });
p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
await p.addInitScript(s => { let a = (s * 7919 + 13) % 2147483647; Math.random = () => (a = (a * 48271) % 2147483647) / 2147483647; }, +seed);
await p.goto(`http://localhost:4340/paint/index.html?img=/ferry/site/lib/lighthouse-wide/source.png&style=gc&detail=${detail}&life=0`);
await p.waitForFunction(() => typeof IM !== 'undefined' && IM && state === 'setup', null, { timeout: 90000 });
const res = await p.evaluate(({ OW, OH, mx, my, mr }) => {
  setFocus(.24, .42);
  gcPlan();
  const dpr = gcCv.width / W, r = G.rect;
  gcx.setTransform(dpr, 0, 0, dpr, 0, 0); gcx.save(); gcx.beginPath(); gcx.rect(r.x, r.y, r.w, r.h); gcx.clip();
  gcx.imageSmoothingEnabled = true; gcx.imageSmoothingQuality = 'high'; gcx.globalAlpha = .9; gcx.drawImage(G.under, r.x, r.y, r.w, r.h); gcx.globalAlpha = 1;
  const last = G.specs[G.specs.length - 1];
  G.specs.push({ k: last.k + 1, r: Math.max(1.2, last.r * .72), t: last.t + last.dur, dur: 3, label: 'Adding finer detail' });
  const log = [];
  for (const spec of G.specs) {
    const L = gcBuildLayer(spec); for (const s of L.strokes) G.lastTip = gcStroke(s);
    L.drawn = L.strokes.length; G.layers.push(L); log.push(`${spec.label}: ${L.strokes.length} r=${spec.r.toFixed(2)}`);
  }
  gcx.restore();
  gcNight(0);
  // the moon at the scene's size and place (Paint sizes it to the long side, which on a wide board is too big);
  // no stars where the ticket and its line sit (upper right) or behind the lantern
  G.moon = { x: +mx, y: +my, r: +mr };
  const stars0 = G.stars.length;
  G.stars = G.stars.filter(([x, y]) => !(x > .55 && y < .4) && Math.hypot(x - .21, (y - .21) * .62) > .07 && Math.hypot(x - +mx, y - +my) > .05);
  const LOOKS = { day: { tint: [1, 1, 1], light: 0, moon: 0 }, golden: { tint: [1, .9, .74], light: 0, moon: 0 }, dusk: { tint: [.78, .72, .86], light: 0, moon: 0 }, night: { tint: [.34, .38, .62], light: 0, moon: 1 } };
  const urls = {};
  for (const [name, fx] of Object.entries(LOOKS)) {
    FX = fx; gcFxDraw();
    const sw = r.w * dpr, sh = r.h * dpr, c = document.createElement('canvas'); c.width = Math.round(sw); c.height = Math.round(sh);
    const g = c.getContext('2d'); gcCompose(g, r.x * dpr, r.y * dpr, sw, sh, c.width, c.height);
    const o = document.createElement('canvas'); o.width = OW; o.height = OH; const q = o.getContext('2d');
    q.imageSmoothingQuality = 'high'; q.drawImage(c, 0, 0, OW, OH); urls[name] = o.toDataURL('image/png');
  }
  return { urls, log, rect: r, dpr, G: [G.w, G.h], stars: G.stars, stars0, moon: G.moon };
}, { OW, OH, mx, my, mr });
fs.mkdirSync(outdir, { recursive: true });
for (const [n, u] of Object.entries(res.urls)) fs.writeFileSync(`${outdir}/${n}.png`, Buffer.from(u.split(',')[1], 'base64'));
fs.writeFileSync(`${outdir}/plates.json`, JSON.stringify({ seed: +seed, detail: +detail, rect: res.rect, dpr: res.dpr, grid: res.G, moon: res.moon, stars: res.stars, layers: res.log }, null, 1));
console.log(JSON.stringify({ rect: res.rect, dpr: res.dpr, G: res.G, stars: res.stars.length, stars0: res.stars0 })); console.log(res.log.join('\n'));
await b.close();

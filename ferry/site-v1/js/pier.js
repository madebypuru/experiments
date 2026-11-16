// Beat 1, "At the pier". The departure dock at dusk fills the screen: Paint's plate, the live rowboats, open water
// painted on past the plate, and the hour's light glazed over all of it (pier-light.js). The transfer ticket rests
// on the quay, drawn by its own engine (print/ticket.js). Scrolling on: the stub tears along its perforation and
// stays on the quay, the ticket is lifted and carried out, the dock slides away below, and the light deepens over
// open water until the page's own sea colour takes over.
import * as THREE from '../lib/three.module.min.js';
import { register } from './shell.js';
import { loadDock } from './dock.js';
import { vertex, fragment } from './pier-light.js';

const PLATE = '../web/footer-lib/dock-plate-edge.png';   // the dock repainted by Paint, its top a real brushed edge
const PW = 1836, PH = 1032;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, k) => a + (b - a) * k;
const img = src => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src; });
const SVGNS = 'http://www.w3.org/2000/svg';

// the brand's ink bleed (src/bleed.html, ink mode), sized from the cap height: u = 1% of it
function bleedFilter(id, u, color, seed) {
  return `<filter id="${id}" x="-12%" y="-25%" width="124%" height="150%" color-interpolation-filters="sRGB">
   <feTurbulence type="fractalNoise" baseFrequency="${(0.05 / u).toFixed(5)}" numOctaves="2" seed="${seed}" result="n"/>
   <feDisplacementMap in="SourceAlpha" in2="n" scale="${1.3 * u}" xChannelSelector="R" yChannelSelector="G" result="d"/>
   <feGaussianBlur in="d" stdDeviation="${1.1 * u}" result="b"/>
   <feComponentTransfer in="b" result="shape"><feFuncA type="linear" slope="6" intercept="-2.6"/></feComponentTransfer>
   <feMorphology in="shape" operator="erode" radius="${0.5 * u}" result="inner"/><feGaussianBlur in="inner" stdDeviation="${0.8 * u}" result="innerS"/>
   <feComposite in="shape" in2="innerS" operator="out" result="rim"/>
   <feTurbulence type="fractalNoise" baseFrequency="${(0.018 / u).toFixed(5)}" numOctaves="3" seed="${seed + 5}" result="g"/>
   <feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.55 1.2" result="gA"/>
   <feTurbulence type="fractalNoise" baseFrequency="${(0.45 / u).toFixed(5)}" numOctaves="1" seed="${seed + 9}" result="f"/>
   <feColorMatrix in="f" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.12 1.04" result="fA"/>
   <feComposite in="gA" in2="fA" operator="arithmetic" k1="1" result="tex"/>
   <feComposite in="shape" in2="tex" operator="arithmetic" k1="1" result="bodyA"/>
   <feFlood flood-color="${color}" flood-opacity=".93"/><feComposite in2="bodyA" operator="in" result="body"/>
   <feFlood flood-color="${color}" flood-opacity=".55"/><feComposite in2="rim" operator="in" result="rimC"/>
   <feGaussianBlur in="d" stdDeviation="${2.6 * u}" result="h"/><feComponentTransfer in="h" result="hA"><feFuncA type="linear" slope=".09"/></feComponentTransfer>
   <feFlood flood-color="${color}"/><feComposite in2="hA" operator="in" result="halo"/>
   <feMerge><feMergeNode in="halo"/><feMergeNode in="body"/><feMergeNode in="rimC"/></feMerge></filter>`;
}

// where the painting sits: the plate spans the width (or two thirds of the height on tall screens), its quay on
// the bottom edge; open water above it. shift slides the whole dock down as the visitor leaves.
// Narrow screens see the left berths, so the two boats that row out pass beside the type, not under it.
function camera(vw, vh, shift) {
  const s = Math.max(vw / PW, vh * 0.66 / PH);
  return { s, ox: vw >= 800 ? (vw - PW * s) / 2 : Math.max(vw - PW * s, -40 * s), oy: vh - PH * s + shift };
}

function layout(vw, vh) {
  const wide = vw >= 800, m = wide ? 80 : 20;
  const F = Math.round(clamp(vw * 0.06, 40, 104));
  const col = (vw - 2 * m - 11 * 20) / 12;               // 12 columns, 20 px gutters
  return { wide, m, F, col, top: wide ? 116 : 100, body: wide ? 18 : 16 };
}

export async function mountPier(mount) {
  mount.innerHTML = `
    <div class="pier-stage">
      <canvas class="pier-gl" aria-hidden="true"></canvas>
      <div class="pier-type">
        <h1 class="pier-head"><span class="sr">Safe passage between chains.</span><svg aria-hidden="true"></svg></h1>
        <p class="pier-sub">Ferry moves money between chains and shows you every crossing.</p>
      </div>
      <div class="pier-ticket" aria-label="Transfer ticket, SOL to ETH, at the pier, departs 12:04" role="img">
        <div class="part body"></div><div class="part stub"></div>
      </div>
    </div>`;
  const stage = mount.querySelector('.pier-stage'), glc = mount.querySelector('.pier-gl');
  const headSvg = mount.querySelector('.pier-head svg'), typeEl = mount.querySelector('.pier-type'), sub = mount.querySelector('.pier-sub');
  const bodyEl = mount.querySelector('.part.body'), stubEl = mount.querySelector('.part.stub'), ticketEl = mount.querySelector('.pier-ticket');

  const [plateImg, dock] = await Promise.all([img(PLATE), loadDock(), document.fonts.ready, window.Ticket.ready]);

  // ---- the ticket: drawn twice by its engine, the same seed, and cut along its own perforation ----
  const T = window.Ticket, TH = 120, TW = T.width(TH), TEAR = T.SIZES[TH].body, STUB = TW - TEAR;
  const opts = { size: TH, state: 'pier', from: 'SOL', to: 'ETH', fromName: 'Solana', toName: 'Ethereum', departs: '12:04', seed: 3, x: 0, y: 0 };
  T.draw(bodyEl, opts); T.draw(stubEl, opts);
  // a torn edge: the perforation's line with fibres either side, the same line for both pieces so they fit
  let sd = 5; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const tearPts = []; for (let y = 2; y <= TH - 2; y += 3) tearPts.push([TEAR + (rnd() - .5) * 1.6, y]);
  const poly = pts => `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',')})`;
  bodyEl.style.clipPath = poly([[-40, -40], [TEAR, -40], ...tearPts, [TEAR, TH + 40], [-40, TH + 40]]);
  stubEl.style.clipPath = poly([[TEAR, -40], [TW + 40, -40], [TW + 40, TH + 40], [TEAR, TH + 40], ...tearPts.slice().reverse()]);

  // ---- the headline, set in Ferry Sans Bold with the bleed, paper on the painting ----
  let headFor = 0;
  function setHead(L) {
    if (headFor === L.F) return; headFor = L.F;
    const cv = document.createElement('canvas').getContext('2d'); cv.font = `700 ${L.F}px "Ferry Sans"`;
    const cap = cv.measureText('H').actualBoundingBoxAscent, u = cap / 100, lead = Math.round(L.F * 1.04 / 10) * 10;
    const w = Math.ceil(L.F * 9.2), h = Math.ceil(cap + lead + L.F * 0.35);
    headSvg.setAttribute('width', w); headSvg.setAttribute('height', h); headSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const ls = (-0.05 * L.F).toFixed(2);
    headSvg.innerHTML = `<defs>${bleedFilter('pierBleed', u, '#F2EEE6', 4)}</defs>
      <g filter="url(#pierBleed)" fill="#F2EEE6" style="font:700 ${L.F}px 'Ferry Sans';letter-spacing:${ls}px">
        <text x="0" y="${cap.toFixed(1)}">Safe <tspan style="font-style:italic">passage</tspan></text>
        <text x="0" y="${(cap + lead).toFixed(1)}">between chains.</text></g>`;
    typeEl.style.left = L.m + 'px'; typeEl.style.top = L.top + 'px';
    sub.style.fontSize = L.body + 'px'; sub.style.lineHeight = (L.body + 10) + 'px';
    // wide: the line sits on columns 10 to 12, clear of the boats' way out,, its first baseline on the headline's first; narrow: under the headline
    const bodyAsc = L.body * 0.93;
    if (L.wide) { sub.style.left = (9 * (L.col + 20)) + 'px'; sub.style.top = (cap - bodyAsc - 4).toFixed(1) + 'px'; sub.style.width = (3 * L.col + 40) + 'px'; }
    else { sub.style.left = '0px'; sub.style.top = (cap + lead + 30) + 'px'; sub.style.width = (vwNow - 2 * L.m) + 'px'; }
  }

  // ---- three.js: one full-screen pass ----
  const renderer = new THREE.WebGLRenderer({ canvas: glc, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  const plateTex = new THREE.Texture(plateImg); plateTex.colorSpace = THREE.NoColorSpace; plateTex.generateMipmaps = false; plateTex.minFilter = THREE.LinearFilter; plateTex.needsUpdate = true;
  const dyn = document.createElement('canvas'), dg = dyn.getContext('2d');
  const dynTex = new THREE.CanvasTexture(dyn); dynTex.colorSpace = THREE.NoColorSpace; dynTex.generateMipmaps = false; dynTex.minFilter = THREE.LinearFilter;
  const U = {
    uPlate: { value: plateTex }, uDyn: { value: dynTex }, uView: { value: new THREE.Vector2() }, uDpr: { value: dpr }, uT: { value: 0 },
    uCam: { value: new THREE.Vector3() }, uPlateSize: { value: new THREE.Vector2(PW, PH) },
    uDusk: { value: 1 }, uNight: { value: 0 }, uMorning: { value: 0 }, uFade: { value: 0 }, uPath: { value: .78 }, uBg: { value: new THREE.Color() },
  };
  const scene = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: U, vertexShader: vertex, fragmentShader: fragment, depthTest: false, depthWrite: false })));

  let vwNow = 0, vhNow = 0, C = camera(innerWidth, innerHeight, 0), now = 0;
  function resize(vw, vh) {
    if (vw === vwNow && vh === vhNow) return; vwNow = vw; vhNow = vh;
    renderer.setSize(vw, vh, false); glc.style.width = vw + 'px'; glc.style.height = vh + 'px';
    dyn.width = Math.round(vw * dpr); dyn.height = Math.round(vh * dpr); dynTex.dispose();
    U.uView.value.set(vw, vh); setHead(layout(vw, vh));
  }

  // ---- the visitor's hand on the water ----
  const toPlate = e => [(e.clientX - C.ox) / C.s, (e.clientY - C.oy) / C.s];
  let lastMove = { t: -9, x: 0, y: 0 };
  glc.addEventListener('pointerdown', e => { const [x, y] = toPlate(e); dock.poke(x, y, now); });
  glc.addEventListener('pointermove', e => {
    const [x, y] = toPlate(e);
    glc.style.cursor = dock.boatAt(x, y, now) ? 'pointer' : 'default';
    if (e.pointerType !== 'mouse') return;
    if (now - lastMove.t > 1.4 && Math.hypot(e.clientX - lastMove.x, e.clientY - lastMove.y) > 120) {
      if (dock.poke(x, y, now, 0.42)) lastMove = { t: now, x: e.clientX, y: e.clientY };
    }
  });

  function placePart(el, cx, cy, rotDeg, k, ax, ay, filter, opacity = 1) {
    el.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px) rotate(${rotDeg.toFixed(3)}deg) scale(${k.toFixed(4)}) translate(${-ax}px,${-ay}px)`;
    el.style.filter = filter; el.style.opacity = opacity;
  }

  let shown = true, lastKey = '';
  register(mount, {
    hide() { if (shown) { stage.style.visibility = 'hidden'; shown = false; } },
    frame(st) {
      if (!shown) { stage.style.visibility = 'visible'; shown = true; }
      const { vw, vh, local: q, tail, clock, t } = st; now = t;
      resize(vw, vh);
      const L = layout(vw, vh);
      // a still page draws only when the scroll or the size changes
      const key = `${vw}|${vh}|${q.toFixed(4)}|${tail.toFixed(4)}|${clock.p.toFixed(4)}`;
      if (st.still && key === lastKey) return; lastKey = key;
      // the exit: the dock slides away below while the visitor is carried out over the water
      const leave = ss(0.1, 0.92, q), shift = vh * 1.3 * leave + vh * 0.45 * ss(0, 1, tail);
      C = camera(vw, vh, shift);

      // the live dock, drawn in screen space for the light pass
      dg.setTransform(1, 0, 0, 1, 0, 0); dg.clearRect(0, 0, dyn.width, dyn.height);
      dg.setTransform(C.s * dpr, 0, 0, C.s * dpr, C.ox * dpr, C.oy * dpr);
      dock.draw(dg, t, st.still, 4000);
      dynTex.needsUpdate = true;

      U.uT.value = st.still ? 4.2 : t; U.uCam.value.set(C.ox, C.oy, C.s);
      U.uDusk.value = clock.dusk; U.uNight.value = clock.night; U.uMorning.value = clock.morning;
      U.uBg.value.setRGB(...clock.bg); U.uFade.value = ss(0, 0.85, tail);
      U.uPath.value = L.wide ? 0.62 : 0.8;
      renderer.render(scene, cam);

      // type: leaves like page content, a little ahead of the dock
      const lift = ss(0.02, 0.22, q);
      typeEl.style.transform = `translateY(${(-vh * 0.1 * ss(0, 0.3, q)).toFixed(1)}px)`;
      typeEl.style.opacity = (1 - lift).toFixed(3);

      // the ticket on the quay, plate coords; on narrow screens it sits in the middle of what is visible
      const visL = -C.ox / C.s, visW = vw / C.s, k0 = C.s * 112 / TH, rot0 = -2.5;
      const tx = visL + visW * (L.wide ? 0.72 : 0.5), ty = PH - 74;
      const cxT = C.ox + tx * C.s, cyT = C.oy + ty * C.s, a0 = rot0 * Math.PI / 180;
      const along = (u) => [cxT + Math.cos(a0) * (u - TW / 2) * k0, cyT + Math.sin(a0) * (u - TW / 2) * k0];
      const tear = ss(0.05, 0.16, q), carry = ss(0.12, 0.55, q), glide = ss(0.5, 1, q);
      const night = clock.night, light = `brightness(${(1 - 0.28 * night - 0.06 * clock.dusk).toFixed(3)})`;
      // the stub stays on the quay and leaves with it
      const [sx, sy] = along(TEAR + STUB / 2);
      placePart(stubEl, sx, sy, rot0, k0, TEAR + STUB / 2, TH / 2, light);
      // the body: torn free, then lifted and carried out to the middle of the view
      const [bx0, by0] = along(TEAR / 2 - 10 * tear);
      const kL = Math.min(vw * (L.wide ? 0.4 : 0.84) / TEAR, vh * 0.2 / TH);
      // past the end it is carried on, up and away across the water, still whole
      const away = ss(0.05, 1, tail);
      const bx = lerp(bx0, vw * 0.5, carry), by = lerp(by0, vh * (0.52 - 0.1 * glide), carry) - (vh * 0.42 + 200) * away;
      const kb = lerp(k0, kL, carry) * (1 - 0.08 * glide) * (1 - 0.3 * away);
      const sh = `drop-shadow(0 ${(2 + 12 * carry).toFixed(1)}px ${(3 + 18 * carry).toFixed(1)}px rgba(11,26,30,${(0.1 + 0.12 * carry).toFixed(3)}))`;
      placePart(bodyEl, bx, by, lerp(rot0 - 1.2 * tear, -0.6, carry), kb, TEAR / 2, TH / 2, `${sh} ${light}`);
      ticketEl.style.visibility = cyT > vh + 200 && carry >= 1 && tail >= 1 ? 'hidden' : 'visible';
    },
  });
}

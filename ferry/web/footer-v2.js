// Ferry footer. The base is the live Ferry dock (footer-lib/dock-live.js, the rowboats study from
// ferry/assets/rowboats/index.html): boats back out of their berths and row away, then come back; tapping the water
// sends a painted wave that rocks them, tapping a boat sends it out. The painting's top edge is in the plate itself: Paint
// painted it and stopped short of the top (footer-lib/dock-plate-edge.png, made by footer-lib/paint-edge.mjs), so nothing is masked here.
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

const band = $('#harbour');

// ---- pause the dock's loop while it is off screen, so the footer costs nothing until it is seen ----
let seen = true, held = null; const raf = window.requestAnimationFrame.bind(window);
window.requestAnimationFrame = cb => { if (seen) return raf(cb); held = cb; return 0; };
new IntersectionObserver(es => { seen = es[0].isIntersecting; if (seen && held){ const h = held; held = null; raf(h); } }).observe(band);
})();

// Ferry stamp 01 and the Ferry Post postmark, shared by stamp-01.html and the postcards.
// stampSVG(id) draws the stamp in stamp units (1200 x 1500); postmark(id) draws a cancel centred on 0,0.
// ---------- stamp geometry (stamp units: 1200 x 1500) ----------
const SW=1200, SH=1500;
const PITCH=75;                 // notch to notch; 16 along the width, 20 along the height, so a notch lands on every corner
const NW=PITCH/2;               // notch opening = half the pitch, so notches and teeth are equal width
const ND=26;                    // notch depth
// a notch is a three-step cut, the profile of one half of the Ferry mark's inner edge:
// wide at the paper edge, narrowing in two steps toward the stamp
function notch(cx,cy,ang){
  const w1=NW, w2=NW*.66, w3=NW*.34, d1=ND*.38, d2=ND*.72, d3=ND;
  const p=[[-w1/2,-40],[ -w1/2,d1],[-w2/2,d1],[-w2/2,d2],[-w3/2,d2],[-w3/2,d3],[w3/2,d3],[w3/2,d2],[w2/2,d2],[w2/2,d1],[w1/2,d1],[w1/2,-40]];
  const c=Math.cos(ang),s=Math.sin(ang);
  return p.map(([x,y])=>`${(cx+x*c-y*s).toFixed(1)},${(cy+x*s+y*c).toFixed(1)}`).join(' ');
}
function notches(){
  const out=[];
  for(let x=0;x<=SW+0.1;x+=PITCH){out.push(notch(x,0,0));out.push(notch(x,SH,Math.PI));}
  for(let y=PITCH;y<SH-0.1;y+=PITCH){out.push(notch(0,y,-Math.PI/2));out.push(notch(SW,y,Math.PI/2));}
  return out.map(p=>`<polygon points="${p}" fill="#000"/>`).join('');
}
// ---------- layout (inside the paper) ----------
const M=84, DX=10, DY=-6;                       // margin, and the perforator's drift: the design sits slightly off centre
const DES={x:M+DX,y:M+DY,w:SW-2*M,h:SH-2*M};    // design area
const IMG={x:DES.x,y:DES.y,w:DES.w,h:1110};     // painting window
const BAND={y:IMG.y+IMG.h,h:DES.h-IMG.h};       // paper band under the painting for the caption

// LIVE: where the live lighthouse canvas (952 x 1428 plates) sits in the window: scaled to the window's width and cropped
// from plate y 250, so the lantern is near the top and the ferry's mooring (plate y 1236) is still inside the window.
const LIVE={s:(IMG.w+4)/952, top:232};
function stampSVG(id, opts={}){
  const k=`${id}`;
  const art=opts.live
    ? `<foreignObject id="${k}fo" x="${IMG.x-2}" y="${IMG.y-LIVE.top*LIVE.s}" width="${IMG.w+4}" height="${1428*LIVE.s}"><canvas xmlns="http://www.w3.org/1999/xhtml" id="${opts.live}" width="952" height="1428" style="width:100%;height:100%;display:block;touch-action:manipulation"></canvas></foreignObject>`
    : `<image href="../assets/refs/lighthouse-gouache-hi.png" x="${IMG.x-2}" y="${IMG.y-96}" width="${IMG.w+4}" height="${(IMG.w+4)*2299/1430}" preserveAspectRatio="none"/>`;
  return `
<defs>
  <mask id="${k}m" maskUnits="userSpaceOnUse" x="-60" y="-60" width="${SW+120}" height="${SH+120}">
    <g filter="url(#${k}rag)"><rect x="0" y="0" width="${SW}" height="${SH}" fill="#fff"/><g>${notches()}</g></g>
  </mask>
  <filter id="${k}rag" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/>
  </filter>
  <filter id="${k}paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="8" result="n"/>
    <feColorMatrix in="n" values="0 0 0 0 .32  0 0 0 0 .28  0 0 0 0 .22  0 0 0 .11 0" result="speck"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4" result="t"/>
    <feColorMatrix in="t" values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .07 0" result="tone"/>
    <feMerge><feMergeNode in="tone"/><feMergeNode in="speck"/></feMerge>
  </filter>
  <filter id="${k}ink" x="-2%" y="-2%" width="104%" height="104%">
    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="11" result="n"/>
    <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.18" result="a"/>
    <feComposite in="SourceGraphic" in2="a" operator="in"/>
  </filter>
  <clipPath id="${k}win"><rect x="${IMG.x}" y="${IMG.y}" width="${IMG.w}" height="${IMG.h}"/></clipPath>
</defs>
<g mask="url(#${k}m)">
  <rect x="0" y="0" width="${SW}" height="${SH}" fill="var(--paper)"/>
  <rect x="0" y="0" width="${SW}" height="${SH}" filter="url(#${k}paper)"/>
  <!-- keyline: the printed frame round the whole design, in the margin -->
  <rect x="${DES.x-14}" y="${DES.y-14}" width="${DES.w+28}" height="${DES.h+28}" fill="none" stroke="var(--ink)" stroke-width="2.2" opacity=".85" filter="url(#${k}ink)"/>
  <!-- the painting, a hair off register from the keyline -->
  <g clip-path="url(#${k}win)">
    ${art}
    <rect x="${IMG.x}" y="${IMG.y}" width="${IMG.w}" height="${IMG.h}" filter="url(#${k}paper)" opacity=".9" pointer-events="none"/>
  </g>
  <!-- value: the crossing time, the big numeral, in ink over the pale sky -->
  <g id="${k}value" fill="var(--ink)" filter="url(#${k}ink)">
    <text x="${IMG.x+52}" y="${IMG.y+170}" style="font:700 168px 'Bodoni Moda';font-variation-settings:'opsz' 96;letter-spacing:-4px">41<tspan style="font:italic 500 92px 'Bodoni Moda';font-variation-settings:'opsz' 96" dx="6">s</tspan></text>
    <!-- issuer -->
    <text x="${IMG.x+58}" y="${IMG.y+224}" style="font:700 34px 'Ferry Sans';letter-spacing:7px">FERRY</text>
  </g>
  <g fill="#FBF8F1" filter="url(#${k}ink)">
    <!-- year, rotated up the right edge of the painting -->
    <text transform="translate(${IMG.x+IMG.w-30} ${IMG.y+IMG.h-34}) rotate(-90)" style="font:400 24px 'Ferry Sans';letter-spacing:5px">2026</text>
  </g>
  <!-- caption band -->
  <g fill="var(--ink)" filter="url(#${k}ink)">
    <text x="${SW/2+DX}" y="${BAND.y+112}" text-anchor="middle" style="font:400 96px 'Monsieur La Doulaise'">the Arrival Light</text>
    <text x="${SW/2+DX}" y="${BAND.y+172}" text-anchor="middle" style="font:700 22px 'Ferry Sans';letter-spacing:5.5px">PORT OF CALL 01  ·  DEPARTS 12:04  ·  ARRIVES 12:04:41</text>
  </g>
  <!-- imprint and colour swatches, in the bottom margin -->
  <g fill="var(--mute)">
    <text x="${DES.x}" y="${SH-36}" style="font:700 15px 'Ferry Sans';letter-spacing:3.5px">FERRY POST  ·  PAINTED IN PAINT  ·  COLLECTION 01</text>
    <circle cx="${DES.x+DES.w-62}" cy="${SH-41}" r="7.5" fill="var(--harbour)"/>
    <circle cx="${DES.x+DES.w-40}" cy="${SH-41}" r="7.5" fill="var(--stone)"/>
    <circle cx="${DES.x+DES.w-18}" cy="${SH-41}" r="7.5" fill="var(--signal)"/>
  </g>
</g>`;
}
// ---------- postmark: double ring date stamp + cancel lines, uneven ink, crossing the edge ----------
function postmark(id, when={}){
  const D=when.date||'11 NOV', Y=when.year||'2026', T=when.time||'12:04:41';
  const R=150, ring=`M -${R-26} 0 a ${R-26} ${R-26} 0 1 1 ${2*(R-26)} 0 a ${R-26} ${R-26} 0 1 1 -${2*(R-26)} 0`;
  let waves='';for(let i=0;i<5;i++){const y=-70+i*35;waves+=`<path d="M ${R+12} ${y} q 46 -16 92 0 t 92 0" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>`;}
  return `<defs>
  <filter id="${id}pm" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves="2" seed="21" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" result="g"/>
    <feComposite in="b" in2="g" operator="arithmetic" k2=".7" k3=".5" k4="-0.2" result="m"/>
    <feColorMatrix in="m" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.6 -0.6" result="a"/>
    <feComposite in="SourceGraphic" in2="a" operator="in"/>
  </filter>
  <!-- the same uneven ink, a little fuller, for the lettering: the strike can break, but no letter disappears -->
  <filter id="${id}pmt" x="-20%" y="-20%" width="140%" height="140%">
    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves="2" seed="21" result="b"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5" result="g"/>
    <feComposite in="b" in2="g" operator="arithmetic" k2=".7" k3=".5" k4="-0.2" result="m"/>
    <feColorMatrix in="m" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.2 -0.12" result="a"/>
    <feComposite in="SourceGraphic" in2="a" operator="in"/>
  </filter>
  <path id="${id}arc" d="${ring}"/></defs>
  <g color="#1B262B" fill="currentColor" opacity=".86">
    <g filter="url(#${id}pm)">
      <circle r="${R}" fill="none" stroke="currentColor" stroke-width="7"/>
      <circle r="${R-48}" fill="none" stroke="currentColor" stroke-width="4"/>
      ${waves}
    </g>
    <g filter="url(#${id}pmt)">
      <text style="font:700 25px 'Ferry Sans';letter-spacing:6px"><textPath href="#${id}arc" startOffset="2%">FERRY POST  ·  ARRIVED  ·  PORT 01  ·</textPath></text>
      <text y="-14" text-anchor="middle" style="font:700 34px 'Ferry Sans';letter-spacing:2px">${D}</text>
      <text y="30" text-anchor="middle" style="font:700 34px 'Ferry Sans';letter-spacing:2px">${Y}</text>
      <text y="66" text-anchor="middle" style="font:700 19px 'Ferry Sans';letter-spacing:3px">${T}</text>
    </g>
  </g>`;
}

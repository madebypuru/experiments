// Ferry transfer ticket. A paper ticket (card stock, cut corners, stepped notches, inked type) carrying
// modern parts (route line, ferry dot, state glyph, tabular figures). Needs stamp.js loaded first for postmark().
// Ticket.ready: a promise for the fonts. Ticket.draw(target, opts) appends one ticket's <svg> to target and returns it.
// Deterministic: the same opts and seed draw the same ticket. Options are listed in ../system/CHIP.md.
const Ticket=(()=>{
const C={card:'#FFFBF0',ink:'#1B262B',harbour:'#2C454B',mute:'#4A5559',signal:'#D2602C',rim:'#FFFDF7',shade:'#0B1A1E'};
// per size: H is the height; inset is H/6 on every side; gaps are multiples of 4
const SIZES={
  40:{W:190,code:14,glyph:12,dot:2.75,gap:8},
  84:{body:218,code:22,label:9,labelBase:33,codeBase:57,word:12,time:12,glyph:12,dot:3.5,gap:8,wake:16,
      steps:[[9,4.5],[4.5,9]]},                                   // the stamp's notch, one step (no feature under 3 px)
  120:{body:374,code:30,label:10,labelBase:37,codeBase:71,nameBase:92,word:14,time:14,glyph:14,dot:4.5,gap:12,wake:24,
      steps:[[13,5.3],[8.6,10.1],[4.4,14]]}                  // the stamp's notch, all three steps
};
const STATES={
  pier:{p:0,word:'At the pier',tl:'DEPARTS',tv:o=>o.departs,glyph:'ring'},
  departed:{p:.15,word:'Departed',tl:'LEFT',tv:o=>o.departs,glyph:'dot'},
  crossing:{p:.6,word:'Crossing',tl:'LEFT',tv:o=>o.departs,glyph:'half',onLine:o=>o.elapsed},
  arrived:{p:1,word:'Arrived',tl:'CROSSED',tv:o=>o.elapsed,glyph:'check'},
  held:{p:.56,word:'Held at port',tl:'SINCE',tv:o=>o.since,glyph:'pause',signal:true}
};
const ready=Promise.all(['normal 400','normal 700'].map(f=>document.fonts.load(`${f} 20px "Ferry Sans"`)));
const cv=document.createElement('canvas').getContext('2d');
const font=(s,w)=>`normal ${w} ${s}px "Ferry Sans"`;
const tw=(t,s,w=700,ls=0)=>{cv.font=font(s,w);return cv.measureText(t).width+ls*t.length;};
const capH=(s,w=700)=>{cv.font=font(s,w);return cv.measureText('H').actualBoundingBoxAscent;};
const xH=(s,w=700)=>{cv.font=font(s,w);return cv.measureText('x').actualBoundingBoxAscent;};
let uid=0;
// the stub is as wide as its widest state needs, the same for every state, rounded up to 4 px
const stubW={};
function width(size){const s=SIZES[size];if(!s.body)return s.W;
  if(!stubW[size]){const ls=s.label*.18;let m=0;
    for(const st of Object.values(STATES)){m=Math.max(m,s.glyph+4+tw(st.word,s.word),s.glyph+4+tw(st.tl,s.label,700,ls)-ls+4+tw('12:04',s.time,400));}
    stubW[size]=Math.ceil((m+size/3)/4)*4;}
  return s.body+stubW[size];}

// ---- print: the brand's ink bleed (src/bleed.html, ink mode), u = 1% of the cap height ----
function bleed(id,u,color,seed){
  return `<filter id="${id}" x="-12%" y="-25%" width="124%" height="150%" color-interpolation-filters="sRGB">
   <feTurbulence type="fractalNoise" baseFrequency="${(0.05/u).toFixed(5)}" numOctaves="2" seed="${seed}" result="n"/>
   <feDisplacementMap in="SourceAlpha" in2="n" scale="${1.3*u}" xChannelSelector="R" yChannelSelector="G" result="d"/>
   <feGaussianBlur in="d" stdDeviation="${1.1*u}" result="b"/>
   <feComponentTransfer in="b" result="shape"><feFuncA type="linear" slope="6" intercept="-2.6"/></feComponentTransfer>
   <feMorphology in="shape" operator="erode" radius="${0.5*u}" result="inner"/><feGaussianBlur in="inner" stdDeviation="${0.8*u}" result="innerS"/>
   <feComposite in="shape" in2="innerS" operator="out" result="rim"/>
   <feTurbulence type="fractalNoise" baseFrequency="${(0.018/u).toFixed(5)}" numOctaves="3" seed="${seed+5}" result="g"/>
   <feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.55 1.2" result="gA"/>
   <feTurbulence type="fractalNoise" baseFrequency="${(0.45/u).toFixed(5)}" numOctaves="1" seed="${seed+9}" result="f"/>
   <feColorMatrix in="f" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.12 1.04" result="fA"/>
   <feComposite in="gA" in2="fA" operator="arithmetic" k1="1" result="tex"/>
   <feComposite in="shape" in2="tex" operator="arithmetic" k1="1" result="bodyA"/>
   <feFlood flood-color="${color}" flood-opacity=".93"/><feComposite in2="bodyA" operator="in" result="body"/>
   <feFlood flood-color="${color}" flood-opacity=".55"/><feComposite in2="rim" operator="in" result="rimC"/>
   <feGaussianBlur in="d" stdDeviation="${2.6*u}" result="h"/><feComponentTransfer in="h" result="hA"><feFuncA type="linear" slope=".09"/></feComponentTransfer>
   <feFlood flood-color="${color}"/><feComposite in2="hA" operator="in" result="halo"/>
   <feMerge><feMergeNode in="halo"/><feMergeNode in="body"/><feMergeNode in="rimC"/></feMerge></filter>`;
}
// ---- paper: the stamp's card stock (speck + tone) with a little fibre; the cut edge; the stamp's shadow ----
function paperDefs(k,s,H,r,seed){
  return `
  <filter id="${k}paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="${seed+8}" result="n"/>
    <feColorMatrix in="n" values="0 0 0 0 .32  0 0 0 0 .28  0 0 0 0 .22  0 0 0 .10 0" result="speck"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="${seed+4}" result="t"/>
    <feColorMatrix in="t" values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 .03 0" result="tone"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.035 0.55" numOctaves="2" seed="${seed+2}" result="f"/>
    <feColorMatrix in="f" values="0 0 0 0 .4  0 0 0 0 .34  0 0 0 0 .26  0 0 0 .09 -.02" result="fibre"/>
    <feMerge><feMergeNode in="tone"/><feMergeNode in="fibre"/><feMergeNode in="speck"/></feMerge>
  </filter>
  <filter id="${k}cut" x="-5%" y="-15%" width="110%" height="130%">
    <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="${seed+1}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale=".4" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${(r*.25).toFixed(2)}"/>
    <feComponentTransfer><feFuncA type="linear" slope="10" intercept="-4.5"/></feComponentTransfer>
  </filter>
  <filter id="${k}sh" x="-10%" y="-20%" width="125%" height="150%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation=".5"/><feOffset dx=".5" dy="1" result="co"/>
    <feComponentTransfer in="co" result="contact"><feFuncA type="linear" slope=".22"/></feComponentTransfer>
    <feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dx="2" dy="3" result="lo"/>
    <feComponentTransfer in="lo" result="lift"><feFuncA type="linear" slope=".12"/></feComponentTransfer>
    <feFlood flood-color="${C.shade}"/><feComposite in2="lift" operator="in" result="liftC"/>
    <feFlood flood-color="${C.shade}"/><feComposite in2="contact" operator="in" result="contactC"/>
    <feOffset in="SourceAlpha" dx="1" dy="1.2" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="rim"/>
    <feGaussianBlur in="rim" stdDeviation=".5" result="rimS"/>
    <feFlood flood-color="${C.rim}" flood-opacity=".7"/><feComposite in2="rimS" operator="in" result="rimC"/>
    <feMerge><feMergeNode in="liftC"/><feMergeNode in="contactC"/><feMergeNode in="SourceGraphic"/><feMergeNode in="rimC"/></feMerge>
  </filter>
  <filter id="${k}uneven" x="-50%" y="-2%" width="200%" height="104%">
    <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="${seed+11}" result="n"/>
    <feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.9 1.25" result="a"/>
    <feComposite in="SourceGraphic" in2="a" operator="in"/>
  </filter>`;
}
// the outline: a plain rectangle with the stamp's stepped notch cut top and bottom at the tear; the cut filter softens every corner alike
function outline(W,H,tear,steps){
  const pts=[];
  const notch=()=>{const p=[];let prev=0;for(const[h,d] of steps){p.push([tear-h,prev],[tear-h,d]);prev=d;}
    for(let i=steps.length-1;i>=0;i--){const[h,d]=steps[i];p.push([tear+h,d],[tear+h,i?steps[i-1][1]:0]);}return p;};
  pts.push([0,0]);if(steps)pts.push(...notch());pts.push([W,0],[W,H]);
  if(steps)pts.push(...notch().reverse().map(([x,y])=>[x,H-y]));pts.push([0,H]);
  return 'M '+pts.map(([x,y])=>`${x} ${y}`).join(' L ')+' Z';
}
// ---- modern parts: crisp, never bled ----
function glyph(kind,g,cx,cy){
  const R=g/2-.75,ring=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
  if(kind==='ring')return ring;
  if(kind==='dot')return ring+`<circle cx="${cx}" cy="${cy}" r="${(R*.4).toFixed(2)}" fill="${C.ink}"/>`;
  if(kind==='half')return ring+`<path d="M ${cx} ${cy-R} A ${R} ${R} 0 0 0 ${cx} ${cy+R} Z" fill="${C.ink}"/>`;
  if(kind==='check'){const k=g/12;return `<circle cx="${cx}" cy="${cy}" r="${g/2}" fill="${C.harbour}"/><path d="M ${cx-2.8*k} ${cy+.1*k} L ${cx-.8*k} ${cy+2.1*k} L ${cx+3*k} ${cy-2.1*k}" fill="none" stroke="${C.card}" stroke-width="${1.6*k}" stroke-linecap="round" stroke-linejoin="round"/>`;}
  if(kind==='pause'){const bw=g*.22,bh=g*.74,sp=g*.2;return [cx-sp/2-bw,cx+sp/2].map(x=>`<rect x="${x}" y="${cy-bh/2}" width="${bw}" height="${bh}" rx="${bw/3}" fill="${C.signal}"/>`).join('');}
}
const txt=(x,y,t,s,o={})=>`<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" fill="${o.fill||C.ink}"${o.f?` filter="url(#${o.f})"`:''} style="font:${o.w||700} ${s}px 'Ferry Sans';letter-spacing:${o.ls||0}px;font-feature-settings:'tnum'">${t}</text>`;
const dotted=(a,b,y,c,op)=>b-a>2?`<line x1="${a}" y1="${y}" x2="${b}" y2="${y}" stroke="${c}" stroke-opacity="${op}" stroke-width="1.75" stroke-linecap="round" stroke-dasharray="0 4"/>`:'';

function draw(target,o){
  const size=o.size||84,s=SIZES[size],H=size,W=width(size),st=STATES[o.state],k='t'+(uid++),seed=o.seed||1;
  const inset=H/6,r=Math.max(2,H/40),tear=s.body||0,big=size>40;
  const fCode=k+'bc',fSmall=k+'bs';
  let defs=paperDefs(k,s,H,r,seed);
  if(big)defs+=bleed(fCode,capH(s.code)/100*1.8,C.ink,seed+20)+bleed(fSmall,capH(s.word)/100*.9,C.ink,seed+30)+bleed(fSmall+'m',capH(s.label)/100*.9,C.mute,seed+40);
  const shape=outline(W,H,tear,s.steps);
  defs+=`<mask id="${k}m" maskUnits="userSpaceOnUse" x="-10" y="-10" width="${W+20}" height="${H+20}"><path d="${shape}" fill="#fff" filter="url(#${k}cut)"/></mask>`;
  let g=`<g filter="url(#${k}sh)"><g mask="url(#${k}m)"><rect x="-2" y="-2" width="${W+4}" height="${H+4}" fill="${C.card}"/><rect x="-2" y="-2" width="${W+4}" height="${H+4}" filter="url(#${k}paper)"/></g></g>`;
  // ---- the route ----
  const end=tear?tear-inset:W-inset-s.glyph-s.gap;
  const fw=tw(o.from,s.code),tow=tw(o.to,s.code),toX=end-tow,codeBase=big?s.codeBase:H/2+capH(s.code)/2;
  const ly=codeBase-capH(s.code)/2,x0=inset+fw+s.gap,x1=toX-s.gap,R=s.dot;
  const onLine=big&&st.onLine?st.onLine(o):null;
  let segEnd=x1,tA=x1,tB=x1,lw=0;
  if(onLine){lw=tw(onLine,s.label+2,400);const tc=(x0+x1)/2;tA=tc-lw/2-s.gap;tB=tc+lw/2+s.gap;segEnd=tA;}
  let xd=x0+R+(segEnd-x0-2*R)*st.p;
  if(st.p>0&&st.p<1)xd=Math.max(xd,x0+(s.wake||12));
  if(onLine)xd=Math.min(xd,tA-R-8);
  const lineC=st.signal?C.signal:C.harbour;
  if(xd-R>x0)g+=`<line x1="${x0}" y1="${ly}" x2="${xd}" y2="${ly}" stroke="${C.harbour}" stroke-width="1.5" stroke-linecap="round"/>`;
  g+=dotted(xd+R+3,segEnd,ly,C.ink,.35);
  if(onLine){g+=dotted(tB,x1,ly,C.ink,.35)+txt(tA+s.gap,ly+capH(s.label+2,400)/2,onLine,s.label+2,{w:400});}
  g+=`<circle cx="${xd}" cy="${ly}" r="${R}" fill="${lineC}"/>`;
  // ---- printed type ----
  g+=txt(inset,codeBase,o.from,s.code,{f:big&&fCode})+txt(toX,codeBase,o.to,s.code,{f:big&&fCode});
  if(!big){g+=glyph(st.glyph,s.glyph,W-inset-s.glyph/2,H/2);return mount(target,o,W,H,defs,g);}
  const ls=s.label*.18;
  g+=txt(inset,s.labelBase,'FROM',s.label,{fill:C.mute,ls,f:fSmall+'m'})+txt(end-tw('TO',s.label,700,ls)+ls,s.labelBase,'TO',s.label,{fill:C.mute,ls,f:fSmall+'m'});
  const nd=s.steps[s.steps.length-1][1];
  g+=`<line x1="${tear}" y1="${nd+4}" x2="${tear}" y2="${H-nd-4}" stroke="${C.ink}" stroke-opacity=".4" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="0 4" filter="url(#${k}uneven)"/>`;
  defs=defs.replace(`id="${k}uneven" x="-50%" y="-2%" width="200%" height="104%"`,`id="${k}uneven" filterUnits="userSpaceOnUse" x="${tear-4}" y="0" width="8" height="${H}"`);
  // stub: glyph left of the word on one line, the time under the word; lines on the body's baselines
  const sx=tear+inset,wordBase=size===120?s.codeBase:s.labelBase,timeBase=size===120?s.nameBase:s.codeBase;
  const gg=4,wx=sx+s.glyph+gg;
  g+=glyph(st.glyph,s.glyph,sx+s.glyph/2,wordBase-xH(s.word)/2);
  g+=txt(wx,wordBase,st.word,s.word,{f:fSmall});
  g+=txt(wx,timeBase,st.tl,s.label,{fill:C.mute,ls,f:fSmall+'m'})+txt(wx+tw(st.tl,s.label,700,ls)+4,timeBase,st.tv(o)||'',s.time,{w:400,f:fSmall});
  if(size===120){
    const dl=tw(o.fromName,12,400);
    g+=txt(inset,s.nameBase,o.fromName,12,{w:400,f:fSmall})+txt(inset+dl+8,s.nameBase,o.departs,12,{w:400,f:fSmall});
    const tn=tw(o.toName,12,400);g+=txt(end-tn,s.nameBase,o.toName,12,{w:400,f:fSmall});
    if(o.arrives)g+=txt(end-tn-8-tw(o.arrives,12,400),s.nameBase,o.arrives,12,{w:400,f:fSmall});
    // the print marks: one ink each, the stamp's uneven inking, normal blending
    if(o.state==='arrived'){
      const pm=postmark(k+'pm',{date:o.date||'12 NOV',year:o.year||'2026',time:o.arrivesExact||o.arrives}).replace('PORT 01',o.port||'PORT 02').replace('color="#1B262B"',`color="${C.harbour}"`).replace('opacity=".86"','opacity=".92"');
      g+=`<g transform="translate(${tear+50} -10) rotate(-12) scale(.44)">${pm}</g>`;
    }
    if(o.state==='held'){
      const pm=postmark(k+'hs');const pd=pm.slice(0,pm.indexOf('</defs>')+7);
      g+=`<g transform="translate(${tear+62} 2) rotate(-12) scale(1.15) translate(-37 -23)">${pd}<g color="${C.signal}" fill="currentColor" opacity=".92">
        <g filter="url(#${k}hspm)"><rect x="-23" y="0" width="120" height="46" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><rect x="-17" y="6" width="108" height="34" rx="2" fill="none" stroke="currentColor" stroke-width="1.3"/></g>
        <g filter="url(#${k}hspmt)"><text text-anchor="middle" x="37" y="22" style="font:700 12.5px 'Ferry Sans';letter-spacing:2.2px">HELD AT PORT</text><text text-anchor="middle" x="37" y="35" style="font:700 9px 'Ferry Sans';letter-spacing:1.6px">${o.date||'12 NOV'} · ${o.since||''}</text></g></g></g>`;
    }
  }
  return mount(target,o,W,H,defs,g);
}
function mount(target,o,W,H,defs,g){
  const sc=o.scale||1;
  target.insertAdjacentHTML('beforeend',`<svg class="ticket" style="position:absolute;left:${o.x||0}px;top:${o.y||0}px;overflow:visible" width="${W*sc}" height="${H*sc}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${g}</svg>`);
  return target.lastElementChild;
}
return {draw,ready,width,SIZES,STATES};
})();

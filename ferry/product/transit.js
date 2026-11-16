// In transit, through to arrived. A scripted timeline stands in for the bridge's events; the status indicator, the log,
// the ticket and the headline all read the same clock. ?t=<seconds> freezes the page at that moment.
// The ticket engine (../print/ticket.js) is used as it is; the crossing dot's progress is set through the exported
// Ticket.STATES before each still is drawn. The harbour icons come from icons/ (copied from the ferry-stamp-icons skill).
(()=>{
const SENT=12*3600+4*60+3, TOTAL=41, POST=42, END=44;   // sent 12:04:03, arrived 12:04:44, postmark at +42 s, still from +44 s
// the indicator: where the transfer is now. `at` = the event's own second (shown as a time); without it the status is under way ("now")
const STATUS=[
  {t:0, icon:'BOW',       text:'You sent 100 SOL', at:0},
  {t:1, icon:'BOLLARD',   text:'Leaving Solana'},
  {t:2, icon:'BOLLARD',   text:'Left Solana', at:2},
  {t:3, icon:'ANCHOR',    text:'Waiting for the route to confirm'},
  {t:16,icon:'ANCHOR',    text:'Confirmed on the route', at:16},
  {t:17,icon:'WAVE',      text:'Crossing to Ethereum'},
  {t:36,icon:'LIGHTHOUSE',text:'Arriving at Ethereum'},
  {t:41,icon:'ARRIVED',   text:'Arrived', at:41},
];
const EVENTS=[                                     // the log: events with their seconds
  {t:0, text:'You sent 100 SOL', icon:'BOW'},
  {t:2, text:'Left Solana', icon:'BOLLARD'},
  {t:16,text:'Confirmed on the route', icon:'ANCHOR'},
  {t:41,text:'Arrived at Ethereum', icon:'LIGHTHOUSE'},
];
const F=FerryIcons, LIB=window.FERRY_LIBRARY, IX=n=>LIB.findIndex(e=>e.name===n), IC=n=>LIB[IX(n)];
const H='#2C454B';
// struck: the hand-stamped impression cropped to the clean square, pressure dropped and struck twice so it holds 5:1 at small sizes
const struck=(n,px)=>F.impression(IC(n),IX(n),px*348/316).replace(/width="[^"]*" height="[^"]*" viewBox="[^"]*"/,`width="${px}" height="${px}" viewBox="2 62 316 316"`)
  .replace(/ mask="url\(#im\d+p\)"/,'').replace(/opacity="[\d.]+"/,'opacity="1"');
const struckTwice=(n,px=28)=>{const s=struck(n,px);return `<span class="st">${s}${s}</span>`;};
let uid=200;
const clean=(n,px)=>F.small(IC(n),uid++,px).replace(/#1B262B/g,H);
// each icon's live form: clean Harbour at 56 px with its own small loop (CSS in transit.html)
function live(n){
  if(n==='BOW')return `<div class="mv bow">${clean(n,56)}</div>`;
  if(n==='BOLLARD')return `<div class="mv"><div class="part post">${clean(n,56)}</div><div class="part rope">${clean(n,56)}</div></div>`;
  if(n==='ANCHOR')return `<div class="mv anchor">${clean(n,56)}</div>`;
  if(n==='WAVE')return `<div class="mv wave">${clean(n,56)}</div>`;
  if(n==='LIGHTHOUSE')return `<div class="mv">${clean(n,56)}<i class="lamp"></i></div>`;
  return `<div class="mv"><span class="st" style="display:grid">${struck('LIGHTHOUSE',56).replace('<svg','<svg style="grid-area:1/1"')}${struck('LIGHTHOUSE',56).replace('<svg','<svg style="grid-area:1/1"')}</span></div>`;   // arrived: struck, still
}

const clock=s=>[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':');
const $=id=>document.getElementById(id);
const slot=$('slot'),list=$('list'),sentence=$('sentence'),h1=document.querySelector('h1'),closeLine=document.querySelector('.close');
const COPY='<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M9.5 2H3a1 1 0 0 0-1 1v6.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

const q=new URLSearchParams(location.search);
const frozen=q.has('t')?Math.max(0,Math.min(END,Math.floor(parseFloat(q.get('t'))||0))):null;
if(q.has('open'))$('det').open=true;
if(q.has('log'))$('log').open=true;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- the indicator ----------
let cur=null;
function setStatus(s,animate){
  if(cur===s)return;cur=s;
  const parts=[[$('indIc'),live(s.icon)],[$('indTx'),s.text],[$('indTm'),s.at!=null?clock(SENT+s.at):'now']];
  for(const[box,html]of parts){
    const old=[...box.children];
    const el=document.createElement('div');el.className='layer'+(box.id==='indTm'&&s.at==null?' live':'');el.innerHTML=html;
    if(animate&&!reduce&&old.length){old.forEach(o=>{o.classList.add('out');setTimeout(()=>o.remove(),400);});el.classList.add('in');}
    else old.forEach(o=>o.remove());
    box.appendChild(el);
  }
}

// ---------- ticket, log, words ----------
let shown=-1,svg=null,logN=-1,posted=false;
function drawTicket(t){
  const W=Ticket.width(120),sc=Math.min(1,slot.clientWidth/W),done=t>=TOTAL;
  slot.style.height=Math.ceil(120*sc/10)*10+'px';
  Ticket.STATES.crossing.p=.1+.9*Math.min(1,t/TOTAL);
  const o={state:done?'arrived':'crossing',size:120,scale:sc,seed:4,from:'SOL',to:'ETH',fromName:'Solana',toName:'Ethereum',
    departs:'12:04',elapsed:(done?TOTAL:t)+'s'};
  if(done)Object.assign(o,{arrives:clock(SENT+TOTAL),arrivesExact:clock(SENT+TOTAL)});
  const next=Ticket.draw(slot,o);
  if(svg)svg.remove();svg=next;
}
function drawLog(t){
  const done=EVENTS.filter(e=>e.t<=t);
  if(done.length===logN)return;logN=done.length;
  list.innerHTML=done.map(e=>`<li><span class="ic" aria-hidden="true">${struckTwice(e.icon)}</span><span class="body"><span>${e.text}</span><span class="t num">${clock(SENT+e.t)}</span></span></li>`).join('');
}
function render(t,animate){
  shown=t;
  drawTicket(t);
  drawLog(t);
  setStatus(STATUS.filter(s=>s.t<=t).pop(),animate);
  if(t>=TOTAL){
    h1.textContent=`Arrived. ${TOTAL} seconds.`;
    sentence.textContent=`100 SOL arrived at Ethereum at ${clock(SENT+TOTAL)}. The crossing took ${TOTAL} seconds.`;
    closeLine.textContent='The crossing is complete. You can close this page.';
  }else{
    const left=Math.max(1,TOTAL-t),secs=left+(left===1?' second':' seconds');
    sentence.textContent=t<2?`You sent 100 SOL at ${clock(SENT)}. It is leaving Solana. About ${secs} to go.`
      :`100 SOL left Solana at ${clock(SENT+2)} and is ${t<36?'crossing to':'arriving at'} Ethereum. About ${secs} to go.`;
  }
  if(t>=POST&&!posted){                            // the postmark lands once on the destination stamp
    // stamp 01's own postmark (print/stamp.js postmark()), placed as on stamp-01.html, with the arrival date and second
    posted=true;const d=new Date(),MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');g.setAttribute('class','pm'+(animate&&!reduce?' strike':''));
    g.innerHTML=`<g transform="translate(1011 203) rotate(-11) scale(1.28)">${postmark('tp',{date:`${d.getDate()} ${MON[d.getMonth()]}`,year:String(d.getFullYear()),time:clock(SENT+TOTAL)})}</g>`;
    $('stamp').querySelector('svg').appendChild(g);
  }
}

// the destination's stamp, stuck on at sending, cancelled by the postmark on arrival
document.body.insertAdjacentHTML('afterbegin',F.SHADOW);
// stamp 01 drawn by its own engine, the way stamp-01.html?sizes embeds it (static painting; the live day-to-night canvas is not used)
$('stamp').innerHTML=`<svg viewBox="-40 -40 ${SW+80} ${SH+80}">${stampSVG('fs')}</svg>`;

document.querySelectorAll('.copy').forEach(b=>{b.innerHTML=COPY;b.onclick=()=>{try{navigator.clipboard.writeText(b.dataset.copy);}catch(e){}};});
$('track').insertAdjacentHTML('beforeend',COPY);
$('track').onclick=()=>{try{navigator.clipboard.writeText(location.origin+location.pathname);}catch(_){}
  $('trackLabel').textContent='Copied';setTimeout(()=>$('trackLabel').textContent='Copy tracking link',2000);};

Ticket.ready.then(()=>{
  addEventListener('resize',()=>drawTicket(shown));
  if(frozen!==null){render(frozen,false);return;}
  const t0=performance.now();
  render(0,false);
  const id=setInterval(()=>{const t=Math.min(END,Math.floor((performance.now()-t0)/1000));
    if(t!==shown)render(t,true);if(t>=END)clearInterval(id);},250);
});
})();

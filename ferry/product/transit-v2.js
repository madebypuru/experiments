// In transit. A scripted timeline stands in for the bridge's events: the updates log and the ticket advance together.
// ?t=<seconds> freezes the page at that moment (for screenshots). The engine (../print/ticket.js) is used as it is;
// the crossing dot's progress is set from outside through the exported Ticket.STATES before each still is drawn.
// The harbour icons come from icons/ (copied from the ferry-stamp-icons skill): each logged event is struck in stamp ink,
// the event under way is the same icon clean, not yet struck.
(()=>{
const SENT=12*3600+4*60+3, TOTAL=41, END=38;       // sent 12:04:03, about 41 s end to end, the page stops at Arriving
// icon per event: BOW the vessel you boarded; BOLLARD the line off the pier; ANCHOR fixed on the route, cannot drift back;
// WAVE open water; LIGHTHOUSE the far coast in sight
const EVENTS=[                                     // t = seconds after sending
  {t:0, text:'You sent 100 SOL', icon:'BOW'},
  {t:2, text:'Left Solana', icon:'BOLLARD'},
  {t:16,text:'Confirmed on the route', icon:'ANCHOR'},
];
const NOW=[                                        // what is happening between events
  {t:0, text:'Leaving Solana', icon:'BOLLARD'},
  {t:2, text:'Waiting for the route to confirm', icon:'ANCHOR'},
  {t:16,text:'Crossing to Ethereum', icon:'WAVE'},
  {t:36,text:'Arriving at Ethereum', icon:'LIGHTHOUSE'},
];
const F=FerryIcons, LIB=window.FERRY_LIBRARY, IX=n=>LIB.findIndex(e=>e.name===n), IC=n=>LIB[IX(n)];
const PX=28;
// struck: the hand-stamped impression, cropped to the clean square so it sits in a 28 px cell (grain sized for that scale)
// The one-sided pressure is dropped at this size (it left the bollard at 2.8:1); the ink grain stays.
const struck=n=>F.impression(IC(n),IX(n),PX*348/316).replace(/width="[^"]*" height="[^"]*" viewBox="[^"]*"/,`width="${PX}" height="${PX}" viewBox="2 62 316 316"`)
  .replace(/ mask="url\(#im\d+p\)"/,'').replace(/opacity="[\d.]+"/,'opacity="1"');
const struckTwice=n=>{const s=struck(n);return `<span class="st">${s}${s}</span>`;};   // struck twice, like a well-inked pad: the grain still shows, the bollard reaches 4:1
// under way: the clean small icon in Harbour
const clean=n=>F.small(IC(n),40+IX(n),PX).replace(/#1B262B/g,'#2C454B');

const clock=s=>[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':');
const $=id=>document.getElementById(id);
const slot=$('slot'),list=$('list'),sentence=$('sentence');
const COPY='<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M9.5 2H3a1 1 0 0 0-1 1v6.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

const q=new URLSearchParams(location.search);
const frozen=q.has('t')?Math.max(0,Math.min(END,Math.floor(+q.get('t')||0))):null;
if(q.has('open'))$('det').open=true;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

let shown=-1,svg=null,logKey='',seen=0;
function progress(t){return .1+.9*Math.min(1,t/TOTAL);}   // share of the line, from the wake to the elapsed time

function drawTicket(t){
  const W=Ticket.width(120),sc=Math.min(1,slot.clientWidth/W);
  slot.style.height=Math.ceil(120*sc/10)*10+'px';
  Ticket.STATES.crossing.p=progress(t);
  const next=Ticket.draw(slot,{state:'crossing',size:120,scale:sc,seed:4,from:'SOL',to:'ETH',fromName:'Solana',toName:'Ethereum',
    departs:'12:04',elapsed:t+'s'});
  if(svg)svg.remove();svg=next;
}
function drawLog(t){
  const done=EVENTS.filter(e=>e.t<=t), now=NOW.filter(n=>n.t<=t).pop(), key=done.length+now.text;
  if(key===logKey)return;                          // rebuild only on an event, so nothing restarts every second
  logKey=key;
  list.innerHTML=done.map((e,i)=>`<li class="${i>=seen&&seen?'new ':''}${i===done.length-1?'ahead':''}"><span class="ic" aria-hidden="true">${struckTwice(e.icon)}</span><span class="body"><span>${e.text}</span><span class="t num">${clock(SENT+e.t)}</span></span></li>`).join('')
    +`<li class="now"><span class="ic" aria-hidden="true">${clean(now.icon)}</span><span class="body"><span>${now.text}</span><span class="t num">now</span></span></li>`;
  seen=done.length;
}
function render(t){
  shown=t;
  drawTicket(t);
  drawLog(t);
  const left=Math.max(1,TOTAL-t),secs=left+(left===1?' second':' seconds');
  sentence.textContent=t<2?`You sent 100 SOL at ${clock(SENT)}. It is leaving Solana. About ${secs} to go.`
    :`100 SOL left Solana at ${clock(SENT+2)} and is ${t<36?'crossing to':'arriving at'} Ethereum. About ${secs} to go.`;
}

// the one object beside the ticket: the destination's stamp, stuck on at sending, cancelled only on arrival
document.body.insertAdjacentHTML('afterbegin',F.SHADOW);
$('stamp').innerHTML=F.stamp(IC('LIGHTHOUSE'),90,62);

document.querySelectorAll('.copy').forEach(b=>{b.innerHTML=COPY;b.onclick=()=>{try{navigator.clipboard.writeText(b.dataset.copy);}catch(e){}};});
$('track').insertAdjacentHTML('beforeend',COPY);
$('track').onclick=()=>{try{navigator.clipboard.writeText(location.origin+location.pathname);}catch(_){}
  $('trackLabel').textContent='Copied';setTimeout(()=>$('trackLabel').textContent='Copy tracking link',2000);};

Ticket.ready.then(()=>{
  addEventListener('resize',()=>drawTicket(shown));
  if(frozen!==null){render(frozen);return;}
  const t0=performance.now();
  render(0);
  const id=setInterval(()=>{const t=Math.min(END,Math.floor((performance.now()-t0)/1000));
    if(t!==shown)render(t);if(t>=END)clearInterval(id);},reduce?1000:250);
});
})();

// In transit. A scripted timeline stands in for the bridge's events: the updates list and the ticket advance together.
// ?t=<seconds> freezes the page at that moment (for screenshots). The engine (../print/ticket.js) is used as it is;
// the crossing dot's progress is set from outside through the exported Ticket.STATES before each still is drawn.
(()=>{
const SENT=12*3600+4*60+3, TOTAL=41, END=38;       // sent 12:04:03, about 41 s end to end, the page stops at Arriving
const EVENTS=[                                     // t = seconds after sending
  {t:0, text:'You sent 100 SOL'},
  {t:2, text:'Left Solana'},
  {t:16,text:'Confirmed on the route'},
];
const NOW=[                                        // what is happening between events
  {t:0, text:'Leaving Solana'},
  {t:2, text:'Waiting for the route to confirm'},
  {t:16,text:'Crossing to Ethereum'},
  {t:36,text:'Arriving at Ethereum'},
];
const clock=s=>[Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':');
const $=id=>document.getElementById(id);
const slot=$('slot'),list=$('list'),sentence=$('sentence');
const TICK='<svg class="mk" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.3 5.6 10.2 11.5 3.8" fill="none" stroke="#2C454B" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DOT='<svg class="mk" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="4" fill="#2C454B"/></svg>';
const COPY='<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M9.5 2H3a1 1 0 0 0-1 1v6.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

const q=new URLSearchParams(location.search);
const frozen=q.has('t')?Math.max(0,Math.min(END,Math.floor(+q.get('t')||0))):null;
if(q.has('open'))$('det').open=true;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

let shown=-1,svg=null,seen=0;
function progress(t){return .1+.9*Math.min(1,t/TOTAL);}   // share of the line, from the wake to the elapsed time

function drawTicket(t){
  const W=Ticket.width(120),sc=Math.min(1,slot.clientWidth/W);
  slot.style.height=Math.ceil(120*sc/10)*10+'px';
  Ticket.STATES.crossing.p=progress(t);
  const next=Ticket.draw(slot,{state:'crossing',size:120,scale:sc,seed:4,from:'SOL',to:'ETH',fromName:'Solana',toName:'Ethereum',
    departs:'12:04',elapsed:t+'s'});
  if(svg)svg.remove();svg=next;
}
function render(t){
  shown=t;
  drawTicket(t);
  const done=EVENTS.filter(e=>e.t<=t), now=NOW.filter(n=>n.t<=t).pop();
  list.innerHTML=done.map((e,i)=>`<li${i>=seen&&seen?' class="new"':''}>${TICK}<span>${e.text}</span><span class="t num">${clock(SENT+e.t)}</span></li>`).join('')
    +`<li class="now">${DOT}<span>${now.text}</span><span class="t num">now</span></li>`;
  seen=done.length;
  const left=Math.max(1,TOTAL-t),secs=left+(left===1?' second':' seconds');
  sentence.textContent=t<2?`You sent 100 SOL at ${clock(SENT)}. It is leaving Solana. About ${secs} to go.`
    :`100 SOL left Solana at ${clock(SENT+2)} and is ${t<36?'crossing to':'arriving at'} Ethereum. About ${secs} to go.`;
}

document.querySelectorAll('.copy').forEach(b=>{b.innerHTML=COPY;b.onclick=()=>{try{navigator.clipboard.writeText(b.dataset.copy);}catch(e){}};});
$('track').onclick=e=>{const b=e.currentTarget;try{navigator.clipboard.writeText(location.origin+location.pathname);}catch(_){}
  b.textContent='Copied';setTimeout(()=>b.textContent='Copy tracking link',2000);};

Ticket.ready.then(()=>{
  if(frozen!==null){render(frozen);return;}
  const t0=performance.now();
  render(0);
  const id=setInterval(()=>{const t=Math.min(END,Math.floor((performance.now()-t0)/1000));
    if(t!==shown)render(t);if(t>=END)clearInterval(id);},reduce?1000:250);
  addEventListener('resize',()=>drawTicket(shown));
});
})();

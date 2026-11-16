// The Ferry dock, live: the rowboats study from ferry/assets/rowboats/index.html (made in the main Ferry session),
// copied here unchanged except for: the canvas id (#dock), the asset folder (BASE), and prefers-reduced-motion freezing
// it like ?t does. Boats take turns backing out of their berths and rowing away, then come back; tap the water for a
// painted wave that rocks the boats; tap a boat to send it out. ?t=<seconds> freezes one moment.
{const BASE='../assets/rowboats/';

// Ferry rowboats study: seven boats painted in gouache by Paint, cut out as sprites over a painted clean
// water plate. Boats take turns backing out of their berths and rowing away, then come back bow first.
// ?t=4.2 freezes one moment (for recording frames).
const Q=new URLSearchParams(location.search), FROZEN=Q.has('t')||matchMedia('(prefers-reduced-motion: reduce)').matches;
const cv=document.getElementById('dock'), g=cv.getContext('2d'), LOOP=20;
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const img=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=src;});
let W,H,plate,BOATS=[],RIP=[];

// who goes when: [boat, leave start, leave end, return start, return end]
const TRIPS=[[2,0.5,5.5,9,14.5],[5,3,8.5,12.5,18],[6,6,11.5,14.2,19.6]];
// the line each boat backs out along until it is clear of its neighbours (unit vectors, screen space)
const BACK={2:[0,-1],5:[-.37,-.93],6:[.12,-.99]};

function shadowOf(spr){const c=document.createElement('canvas');c.width=spr.width+40;c.height=spr.height+40;const o=c.getContext('2d');
  o.filter='blur(7px)';o.drawImage(spr,20,20);o.filter='none';o.globalCompositeOperation='source-in';o.fillStyle='rgb(10,26,32)';o.fillRect(0,0,c.width,c.height);return c;}

function makeRipples(){
  const c=document.createElement('canvas');c.width=W;c.height=H;const o=c.getContext('2d');o.drawImage(plate,0,0);const d=o.getImageData(0,0,W,H).data;
  let s=11;const r=()=>((s=(s*16807)%2147483647)/2147483647);
  for(let tries=0;RIP.length<300&&tries<40000;tries++){const x=Math.floor(r()*W),y=Math.floor(r()*H*.86),k=(y*W+x)*4;if(d[k+2]-d[k]<6)continue;
    RIP.push({x,y,len:10+r()*22,h:1.6+r()*1.6,light:r()<.6,ph:r(),per:LOOP/(4+Math.floor(r()*4)),drift:3+r()*4});}
}
function ripples(t){
  for(const q of RIP){const p=((t/q.per+q.ph)%1),a=Math.sin(p*Math.PI)*.26;if(a<.02)continue;const x=q.x+(p-.5)*q.drift*q.per; // drifts only while it shows
    const c=q.light?'150,190,190':'14,40,48';
    for(let k=0;k<3;k++){const w=q.len*(.45+.25*((k*37+q.x)%5)/5),dx=(k-1)*q.len*.32,dy=((k*13+q.x)%3-1)*q.h*.6;
      g.save();g.translate(x+dx,q.y+dy);g.rotate(((q.x*7+k*11)%9-4)*.012);g.fillStyle=`rgba(${c},${a*(k===1?1:.7)})`;g.fillRect(-w/2,-q.h/2,w,q.h*1.3);g.restore();}}
}

// ---- who is travelling: the looping schedule (autopilot), or trips the viewer started by clicking a boat ----
let O=0, autopilot=true, lastClick=-1e9; const USER={}, WAVES=[], TRAIL=[];
const V=150, WAVE_LIFE=3.2;                               // wave speed (px/s) and how long a ring lasts
Object.assign(BACK,{0:[-.15,-.99],1:[-.12,-.99],3:[.1,-.99],4:[0,-1]});
function tripFor(b,T){
  if(USER[b.i])return {tr:USER[b.i],t:T};
  if(!autopilot&&!FROZEN)return null;
  const tl=(((T-O)%LOOP)+LOOP)%LOOP;for(const tr of TRIPS)if(tr[0]===b.i)return {tr:tr.slice(1),t:tl};
  return null;
}
// where a boat is: out of the berth it backs out along its own line until clear of the row (the hulls touch),
// then follows its heading, drifting and turning a little; coming back it does the same in reverse.
// Waves that reach it make it rock and give a little, then settle.
function pose(b,T){
  let d=0,dir=1,moving=0;const w=Math.PI*2/LOOP,rot0=Math.sin(T*w*2+b.i*1.3)*.006,dy=Math.sin(T*w*3+b.i)*.8;
  const D=b.cy+b.L*1.2, f=tripFor(b,T);
  if(f){const [a0,a1,r0,r1]=f.tr,t=f.t;
    if(t>=a0&&t<a1){const u=(t-a0)/(a1-a0);d=(u*u*(3-2*u)*.7+u*u*.3)*D;moving=1;dir=b.i%2?1:-1;}
    else if(t>=a1&&t<r0){d=D*1.4;}
    else if(t>=r0&&t<r1){const u=(t-r0)/(r1-r0);d=Math.pow(1-u,2.4)*D;moving=1;dir=b.i%2?-1:1;}}
  const clear=b.L*1.05, k=ss(clear*.8,clear*1.6,d), straight=Math.min(d,clear), beyond=Math.max(0,d-clear), bk=BACK[b.i]||[0,-1];
  let x=b.cx+bk[0]*straight-b.ax[0]*beyond+(-b.ax[1])*Math.sin(Math.min(1,beyond/(D-clear))*Math.PI)*44*dir*k;
  let y=b.cy+bk[1]*straight-b.ax[1]*beyond+b.ax[0]*Math.sin(Math.min(1,beyond/(D-clear))*Math.PI)*44*dir*k+dy*(1-k);
  let rot=rot0+Math.sin(Math.min(1,beyond/(D-clear))*Math.PI*.9)*.1*dir*k;
  for(const wv of WAVES){const dist=Math.hypot(x-wv.x,y-wv.y),hit=wv.t0+Math.max(0,dist-b.L*.4)/V,dt=T-hit;if(dt<=0||dt>4.5)continue;
    const amp=Math.exp(-1.3*dt)*Math.sin(dt*6.5)/(1+dist/380), ux=(x-wv.x)/(dist||1), uy=(y-wv.y)/(dist||1);
    rot+=amp*.04; x+=ux*amp*4; y+=uy*amp*4;}
  return {x,y,rot,moving,away:d>b.L*1.3};
}
// rings shed by moving boats: from the schedule when recording, from a live trail when interactive
function rings(T){
  if(FROZEN){for(const b of BOATS)for(const [i,a0,a1,r0,r1] of TRIPS){if(i!==b.i)continue;
    for(const [s0,s1] of [[a0,a1],[r0,r1]])for(let te=s0;te<s1;te+=.42){const age=T-te;if(age<0||age>2.6)continue;
      const p=pose(b,te);if(p.y<-60)continue;ring(p.x,p.y,age);}}return;}
  for(const r of TRAIL){const age=T-r.t;if(age>=0&&age<=2.6)ring(r.x,r.y,age);}
}
function ring(x,y,age){const R=12+age*34,a=.32*(1-age/2.6);g.strokeStyle=`rgba(190,220,224,${a})`;g.lineWidth=2.2-age*.5;g.beginPath();g.ellipse(x,y,R*1.25,R,0,0,Math.PI*2);g.stroke();}

// ---- the viewer's ripples: rings of brush dabs, kept to the water ----
let WATER, waveCv;
function makeWater(){const c=document.createElement('canvas');c.width=W;c.height=H;const o=c.getContext('2d');o.drawImage(plate,0,0);const im=o.getImageData(0,0,W,H),d=im.data;
  for(let i=0;i<d.length;i+=4){const water=d[i+2]-d[i]>=6;d[i]=d[i+1]=d[i+2]=255;d[i+3]=water?255:0;}o.putImageData(im,0,0);
  o.filter='blur(3px)';o.drawImage(c,0,0);WATER=c;waveCv=document.createElement('canvas');waveCv.width=W;waveCv.height=H;
  WATER.data=d;}
const isWater=(x,y)=>{if(!WATER)return false;x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return false;return WATER.data[(y*W+x)*4+3]>0;};
function waves(T){
  const q=waveCv.getContext('2d');q.clearRect(0,0,W,H);let any=false;
  for(let n=WAVES.length-1;n>=0;n--){const wv=WAVES[n],age=T-wv.t0;if(age>WAVE_LIFE+1){WAVES.splice(n,1);continue;}if(age<0)continue;any=true;
    for(let ri=0;ri<2;ri++){const r=V*age-ri*26;if(r<4)continue;const life=1-age/WAVE_LIFE;if(life<=0)continue;
      const N=Math.min(90,Math.max(8,Math.floor(r*.12))),a0=.52*life*life*(1-ri*.35);
      for(let k=0;k<N;k++){const h1=Math.sin(k*12.9898+ri*4.1+wv.seed*7)*43758.5453,j1=h1-Math.floor(h1),h2=Math.sin(k*78.233+ri*2.7+wv.seed*3)*24634.6345,j2=h2-Math.floor(h2);
        if(j2<.22)continue;                                                  // gaps, like a dry brush
        const th=(k+(j1-.5)*.8)/N*Math.PI*2+ri*.21+wv.seed, rr=r+(j2-.5)*16+(j1-.5)*10;
        const x=wv.x+Math.cos(th)*rr,y=wv.y+Math.sin(th)*rr,len=(8+j1*16)*(1+ri*.1),th2=th+Math.PI/2+(j2-.5)*.6,light=j1>.33;
        q.save();q.translate(x,y);q.rotate(th2);q.fillStyle=light?`rgba(206,232,234,${a0*(.45+.55*j2)})`:`rgba(8,30,38,${a0*(.5+.4*j1)})`;
        q.fillRect(-len/2,-(1.7+j2),len,3.4+j2*1.8);q.restore();}}
  }
  if(!any)return;q.globalCompositeOperation='destination-in';q.drawImage(WATER,0,0);q.globalCompositeOperation='source-over';g.drawImage(waveCv,0,0);
}

function draw(T){
  if(FROZEN)T=((T%LOOP)+LOOP)%LOOP;
  g.drawImage(plate,0,0);ripples(T);if(!FROZEN)waves(T);rings(T);
  const poses=BOATS.map(b=>[b,pose(b,T)]).sort((p,q)=>p[1].moving-q[1].moving);
  if(!FROZEN)for(const [b,p] of poses){if(p.moving&&p.y>-60&&(!b.lastEmit||T-b.lastEmit>.42)){TRAIL.push({x:p.x,y:p.y,t:T});b.lastEmit=T;}}
  while(TRAIL.length&&T-TRAIL[0].t>3)TRAIL.shift();
  for(const [b,p] of poses){if(p.y<-b.L)continue;g.save();g.translate(p.x+10,p.y+8);g.rotate(p.rot);g.globalAlpha=.42;g.drawImage(b.shadow,b.x0-b.cx-20,b.y0-b.cy-20);g.restore();}
  for(const [b,p] of poses){if(p.y<-b.L)continue;g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.drawImage(b.spr,b.x0-b.cx,b.y0-b.cy);g.restore();}
  // the schedule picks up again once the viewer has stopped and every boat is home
  if(!FROZEN&&!autopilot&&T-lastClick>12&&!Object.keys(USER).length){autopilot=true;O=T;}
  for(const i of Object.keys(USER))if(T>USER[i][3])delete USER[i];
}

// ---- input ----
function toCanvas(e){const r=cv.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];}
function boatAt(x,y,T){for(const b of BOATS){const p=pose(b,T);if(p.away)continue;const dx=x-p.x,dy=y-p.y,u=dx*b.ax[0]+dy*b.ax[1],v=-dx*b.ax[1]+dy*b.ax[0];
  if(Math.abs(u)<b.L*.5&&Math.abs(v)<b.L*.16)return [b,p];}return null;}
let now=0;
function handOver(T){ // the viewer takes over: trips already under way finish as their own trips
  if(!autopilot)return;const tl=(((T-O)%LOOP)+LOOP)%LOOP;
  for(const [i,a0,a1,r0,r1] of TRIPS)if(tl>=a0&&tl<r1)USER[i]=[a0,a1,r0,r1].map(v=>v-tl+T);
  autopilot=false;
}
cv.addEventListener('pointerdown',e=>{if(!WATER)return;
  const [x,y]=toCanvas(e),T=now,hit=boatAt(x,y,T);
  if(hit){const [b,p]=hit;handOver(T);lastClick=T;WAVES.push({x:p.x,y:p.y,t0:T,seed:Math.random()*6});
    if(!USER[b.i]){const tr=TRIPS.find(r=>r[0]===b.i)||[b.i,0,5.5,9,14.5];USER[b.i]=[T,T+(tr[2]-tr[1]),T+(tr[3]-tr[1]),T+(tr[4]-tr[1])];}
    return;}
  if(!isWater(x,y))return;
  lastClick=Math.max(lastClick,T-6);WAVES.push({x,y,t0:T,seed:Math.random()*6});
});
cv.addEventListener('pointermove',e=>{const [x,y]=toCanvas(e);cv.style.cursor=boatAt(x,y,now)?'pointer':isWater(x,y)?'crosshair':'default';});

(async()=>{
  const meta=await (await fetch(BASE+'sprites.json')).json();W=cv.width=meta.W;H=cv.height=meta.H;plate=await img(BASE+'plate.png');
  for(const b of meta.boats){b.spr=await img(BASE+`boat${b.i}.png`);b.shadow=shadowOf(b.spr);BOATS.push(b);}
  makeRipples();makeWater();
  if(FROZEN){draw(+(Q.get('t')||4));return;}
  const t0=performance.now();(function loop(){now=(performance.now()-t0)/1000;draw(now);requestAnimationFrame(loop);})();
})();

}

// Paint motion base. Loaded before the main script; uses its helpers (clamp, lerp, smooth, rnd, hexRGB) at call time.
// See ../MOTION.md for the contract every base keeps.
// ---------- figures: people and cyclists solved every frame, so feet stay planted ----------
// Figure space (as in line-art-animation's gait.ts): about 95 units tall, feet on y 120, hip over x 40, facing +x.
// A figure's walking phase advances with the distance it has travelled, never with the clock,
// so it can't skate: the planted foot moves back exactly as fast as the body moves forward.
const GAITS={
  walk:{period:1,duty:.62,stride:27,lift:3.4,heelOff:15,kick:0,thigh:23,shin:23,ankleY:118.4,toe:4.2},
  stroll:{period:1.12,duty:.64,stride:21,lift:2.6,heelOff:12,kick:0,thigh:23,shin:23,ankleY:118.4,toe:4.2},
  run:{period:.56,duty:.36,stride:20,lift:10,heelOff:10,kick:3.5,thigh:23,shin:23,ankleY:118.4,toe:4.2},
};
for(const k in GAITS){const o=GAITS[k];o.speed=o.stride/(o.duty*o.period);o.reach=(o.thigh+o.shin)*.983;o.rest=o.ankleY-o.reach;}
const CYCLE_SPEED=175; // figure units per second, about 3 m/s
const minJerk=s=>s*s*s*(10-15*s+6*s*s);
function ik(a,b,l1,l2,bend){const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.min(Math.hypot(dx,dy),l1+l2-.01),th=Math.atan2(dy,dx),
  al=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1)),c1=[a[0]+l1*Math.cos(th-al),a[1]+l1*Math.sin(th-al)],c2=[a[0]+l1*Math.cos(th+al),a[1]+l1*Math.sin(th+al)];
  return (c1[0]-c2[0])*bend>0?c1:c2;}
function gaitFoot(o,u){
  u=((u%1)+1)%1;const S=o.stride;
  if(u<o.duty){ // planted: slides back at the travel speed, heel peels off at the end, pivoting on the toe
    const x=40+S/2-S*u/o.duty,peel=smooth(o.duty-.14,o.duty,u),th=o.heelOff*peel*Math.PI/180,px=x+o.toe,ox=-o.toe,oy=o.ankleY-120;
    return {a:[px+ox*Math.cos(th)-oy*Math.sin(th),120+ox*Math.sin(th)+oy*Math.cos(th)],pitch:o.heelOff*peel,stance:true};}
  const s=(u-o.duty)/(1-o.duty); // swing: minimum-jerk forward, low lift
  return {a:[40-S/2+S*minJerk(s)-o.kick*Math.sin(Math.PI*Math.min(1,s*1.6)),o.ankleY-o.lift*Math.pow(Math.sin(Math.PI*Math.pow(s,o.kick?.7:1)),1.2)],
    pitch:o.heelOff*Math.pow(1-smooth(0,.55,s),1.4),stance:false};
}
function gaitPose(o,phase){
  const f=[gaitFoot(o,phase),gaitFoot(o,phase+.5)];let hip=o.rest;
  const half=((phase%.5)+.5)%.5;
  if(o.kick)hip=half<o.duty?o.rest+1.4*Math.sin(Math.PI*half/o.duty):o.rest-2.6*Math.sin(Math.PI*(half-o.duty)/(.5-o.duty));
  else for(const q of f)if(q.stance){const dx=q.a[0]-40;hip=Math.max(hip,q.a[1]-Math.sqrt(Math.max(1,o.reach*o.reach-dx*dx)));}
  const H=[40,hip];for(const q of f)q.k=ik(H,q.a,o.thigh,o.shin,1);
  return {hip:H,f,front:f[0].a[0]>=f[1].a[0]?0:1,bob:hip-o.rest};
}
// a damped spring; stepped in small slices so a long frame (a hiccup, a hidden tab) can never fling it round
const spring=(k,d)=>({x:0,v:0,step(t,dt){dt=Math.min(dt,.1);const n=Math.ceil(dt/(1/120));for(let i=0;i<n;i++){const h=dt/n;this.v+=(k*(t-this.x)-d*this.v)*h;this.x+=this.v*h;}return this.x;}});

function readFigure(g){
  const A=(k,d)=>g.getAttribute('data-'+k)||d,col=(k,d)=>/^#[0-9a-f]{6}$/i.test(A(k,''))?A(k,''):d;
  const kind=A('figure','walker');
  return {figure:kind==='cyclist'?'cyclist':'walker',gait:GAITS[A('gait',kind==='runner'?'run':'walk')]?A('gait',kind==='runner'?'run':'walk'):'walk',
    height:+A('height',60)||60,top:col('top','#c8463c'),legs:col('legs','#3b3f5c'),skin:col('skin','#e2b48f'),hair:col('hair','#3a2a22'),
    shoes:col('shoes','#2e2a30'),hat:col('hat',null),outfit:A('outfit','trousers'),carry:A('carry','none'),carryColor:col('carry-color','#3d4f7a'),
    bike:col('bike','#2f5f7a'),name:A('figure','walker')};
}

let INKC='rgba(42,36,50,.72)'; // the outline colour; set per frame by the painting's medium (motion/style.js)
function drawWalker(g,sp,st,s){
  const o=GAITS[sp.gait],p=gaitPose(o,st.phase),b=p.bob,lw=w=>Math.max(w,.9/s);
  const path=pts=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);if(pts.length===3)g.quadraticCurveTo(pts[1][0]+.4*(pts[1][0]-(pts[0][0]+pts[2][0])/2),pts[1][1]+.4*(pts[1][1]-(pts[0][1]+pts[2][1])/2),pts[2][0],pts[2][1]);else for(const q of pts.slice(1))g.lineTo(q[0],q[1]);};
  const line=(pts,w,c,edge)=>{if(edge){path(pts);g.lineWidth=lw(w)+lw(1.1);g.strokeStyle=INKC;g.stroke();}path(pts);g.lineWidth=lw(w);g.strokeStyle=c;g.stroke();};
  const fill=(pts,c,outline)=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const q of pts.slice(1))g.lineTo(q[0],q[1]);g.closePath();g.fillStyle=c;g.fill();if(outline){g.lineWidth=lw(.9);g.strokeStyle=INKC;g.stroke();}};
  const shoe=(a,pitch)=>{const r=pitch*Math.PI/180,c=Math.cos(r),n=Math.sin(r),S=(x,y)=>[a[0]+x*c-y*n,a[1]+x*n+y*c];fill([S(-1.8,-1),S(4.8,-.4),S(6.4,1),S(-1.6,1.8)],sp.shoes);};
  g.lineCap='round';g.lineJoin='round';
  // soft cast shadow under the feet
  g.fillStyle='rgba(70,62,100,.2)';g.beginPath();g.ellipse(40,120.5,15,2.4,0,0,Math.PI*2);g.fill();
  // the weather reaches people: in rain most put up an umbrella (decided once each); snow settles on them
  if(WORLD.raining&&sp.carry!=='umbrella'&&sp.rainUp===undefined){sp.rainUp=Math.random()<.7;if(sp.rainUp){sp.carry0=sp.carry;sp.carryColor0=sp.carryColor;sp.carry='umbrella';sp.carryColor=['#2b2a33','#d0453a','#2f5f7a','#e0b33c','#3f7a52'][(Math.random()*5)|0];}}
  const snow=clamp((WORLD.snowCover||0)*1.4,0,1);
  const dress=sp.outfit==='dress',coat=sp.outfit==='coat',legC=dress?sp.skin:sp.legs,legW=dress?3.3:4.8;
  // arms swing opposite the legs, through springs so they lag and settle
  const swing=(p.f[0].a[0]-40)/(o.stride/2),dt=st.dt||1/60,umb=sp.carry==='umbrella';
  const aF=st.arm[0].step(-swing*(o.kick?42:22),dt)*Math.PI/180,aN=st.arm[1].step(swing*(o.kick?42:20),dt)*Math.PI/180;
  const lean=o.kick?6:1.2,sh=[41+lean,42+b],shF=[sh[0]-1.5,sh[1]+2],shN=[sh[0]+1,sh[1]+2.5];
  // the elbow bends more as the arm comes forward (and a lot when running)
  const arm=(S0,a)=>{const e=[S0[0]+15.5*Math.sin(a),S0[1]+15.5*Math.cos(a)],fa=a+(o.kick?1.55:.12+Math.max(0,a)*.9),h=[e[0]+14.5*Math.sin(fa),e[1]+14.5*Math.cos(fa)];return [S0,e,h];};
  const far=arm(shF,aF);line(far,3.7,shade(sp.top,.78),true);g.fillStyle=shade(sp.skin,.85);g.beginPath();g.arc(far[2][0],far[2][1],1.7,0,7);g.fill();
  // legs, back one first; the leading leg goes on top
  const order=[1-p.front,p.front];
  for(const i of order){const q=p.f[i];line([p.hip,q.k,q.a],legW,i===p.front?legC:shade(legC,.82));shoe(q.a,q.pitch);}
  // body: a top, or a coat or dress whose hem opens and closes around the forward knee
  const kF=p.f[p.front].k,aFk=p.f[p.front].a;
  if(dress||coat){const hem=dress?100:94,fx=Math.max(kF[0]+2.6,47);
    fill([[sh[0]-6.5,sh[1]+1],[sh[0]+5.5,sh[1]+1],[fx-.6,70+b],[Math.max(fx,aFk[0]-3)+(dress?3:0),hem],[dress?29:31,hem+1],[33,70+b]],sp.top,true);}
  else{fill([[34,76+b],[46.4,76+b],[46,81+b],[34.4,81+b]],sp.legs);
    g.beginPath();g.moveTo(sh[0]-6,sh[1]+2.4);g.quadraticCurveTo(sh[0]-5.6,sh[1]-1.2,sh[0]-1,sh[1]-1.4);g.quadraticCurveTo(sh[0]+4.8,sh[1]-1.2,sh[0]+5.4,sh[1]+2.6);
    g.quadraticCurveTo(sh[0]+5.6,sh[1]+16,46.4,77+b);g.lineTo(33.8,77+b);g.quadraticCurveTo(sh[0]-7.4,sh[1]+16,sh[0]-6,sh[1]+2.4);g.closePath();
    g.fillStyle=sp.top;g.fill();g.lineWidth=lw(.9);g.strokeStyle=INKC;g.stroke();}
  // shading on the back of the body
  fill([[sh[0]-6,sh[1]+2.4],[sh[0]-3,sh[1]+1],[36,76+b],[34,77+b]],'rgba(40,30,70,.16)');
  // neck, head and hair
  const hc=[sh[0]+2.2,sh[1]-10.6];
  fill([[hc[0]-2.2,hc[1]+3.6],[hc[0]+1.4,hc[1]+3.6],[hc[0]+1.2,sh[1]+.6],[hc[0]-2.4,sh[1]+.6]],shade(sp.skin,.9));g.fillStyle=sp.skin;g.beginPath();g.ellipse(hc[0],hc[1],4.4,5.3,0,0,7);g.fill();g.lineWidth=lw(.8);g.strokeStyle=INKC;g.stroke();
  g.fillStyle=sp.hair;g.beginPath();g.moveTo(hc[0]-4.6,hc[1]+1.5);g.quadraticCurveTo(hc[0]-5.4,hc[1]-6.6,hc[0]+.4,hc[1]-5.8);g.quadraticCurveTo(hc[0]+4.8,hc[1]-5.4,hc[0]+4.4,hc[1]-2);g.quadraticCurveTo(hc[0],hc[1]-3.4,hc[0]-2,hc[1]+.4);g.closePath();g.fill();
  if(sp.hat){g.fillStyle=sp.hat;g.beginPath();g.moveTo(hc[0]-7,hc[1]-3.4);g.lineTo(hc[0]+7,hc[1]-3.4);g.quadraticCurveTo(hc[0]+4.6,hc[1]-4.6,hc[0]+4.2,hc[1]-8);g.quadraticCurveTo(hc[0],hc[1]-11.5,hc[0]-4,hc[1]-8);g.quadraticCurveTo(hc[0]-4.4,hc[1]-4.6,hc[0]-7,hc[1]-3.4);g.fill();}
  // near arm, with whatever is carried
  let hand;
  if(umb){const e=[shN[0]+5,shN[1]+13],h=[shN[0]+9,shN[1]+3];line([shN,e,h],3.7,sp.top,true);hand=h;
    const sway=st.arm[1].x*.04,tip=[h[0]+.5+sway*8,h[1]-40],cx=tip[0],cy=tip[1]+4;
    line([[h[0],h[1]+2],tip],1,INKC);
    g.save();g.translate(cx,cy);g.rotate(sway*.15);g.beginPath();g.moveTo(-22,6);g.quadraticCurveTo(-20,-9,0,-10);g.quadraticCurveTo(20,-9,22,6);
    for(let k=0;k<4;k++){const x0=22-k*11;g.quadraticCurveTo(x0-5.5,2.5,x0-11,6);}g.closePath();g.fillStyle=sp.carryColor;g.fill();g.lineWidth=lw(.9);g.strokeStyle=INKC;g.stroke();
    if(snow>.03){g.globalAlpha*=snow;g.fillStyle='#fbfbf8';g.beginPath();g.moveTo(-19,1);g.quadraticCurveTo(-17,-8.6,0,-9.4);g.quadraticCurveTo(17,-8.6,19,1);g.quadraticCurveTo(9,-4,0,-5);g.quadraticCurveTo(-9,-4,-19,1);g.fill();}
    g.restore();}
  else{const near=arm(shN,aN);line(near,3.7,sp.top,true);hand=near[2];}
  g.fillStyle=sp.skin;g.beginPath();g.arc(hand[0],hand[1],1.8,0,7);g.fill();
  // snow on the head (or hat) and shoulders of anyone without an umbrella over them
  if(snow>.03&&!umb){const a0=g.globalAlpha;g.globalAlpha=a0*snow;g.fillStyle='#fbfbf8';
    const top=sp.hat?hc[1]-10.5:hc[1]-5.6;g.beginPath();g.ellipse(hc[0]-.4,top+.9,sp.hat?4.6:3.8,1.6,0,Math.PI,0);g.fill();
    g.beginPath();g.moveTo(sh[0]-6.2,sh[1]+2.2);g.quadraticCurveTo(sh[0]-5.4,sh[1]-1.9,sh[0]-.6,sh[1]-2);g.quadraticCurveTo(sh[0]+4.6,sh[1]-1.9,sh[0]+5.4,sh[1]+2.2);g.quadraticCurveTo(sh[0],sh[1]-.2,sh[0]-6.2,sh[1]+2.2);g.fill();g.globalAlpha=a0;}
  if(sp.carry==='bag'){const a=st.bag.step(-(st.acc||0)*.02,dt);g.save();g.translate(hand[0],hand[1]+1);g.rotate(a);fill([[-5,1.5],[5,1.5],[5.5,11],[-5.5,11]],sp.carryColor,true);line([[-2.5,1.5],[0,-1],[2.5,1.5]],.8,INKC);g.restore();}
}
function drawCyclist(g,sp,st,s){
  const lw=w=>Math.max(w,.9/s),line=(pts,w,c)=>{g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(const q of pts.slice(1))g.lineTo(q[0],q[1]);g.lineWidth=lw(w);g.strokeStyle=c;g.stroke();};
  g.lineCap='round';g.lineJoin='round';
  const R=16,W1=[18,104],W2=[70,104],C=[42,104],wheel=st.dist/R,crank=wheel/2.4,cr=6.5;
  g.fillStyle='rgba(70,62,100,.2)';g.beginPath();g.ellipse(44,120.5,34,2.6,0,0,7);g.fill();
  const pedal=a=>[C[0]+cr*Math.cos(a),C[1]+cr*Math.sin(a)];
  const P=[pedal(crank),pedal(crank+Math.PI)],H=[37,73+.5*Math.sin(2*crank)],Sh=[55,47+.4*Math.sin(2*crank)];
  const leg=(pd,c)=>{const ank=[pd[0]+.5,pd[1]-1.6],k=ik(H,ank,24,23,1);line([H,k,ank],4.8,c);g.fillStyle=sp.shoes;g.beginPath();g.ellipse(ank[0]+2,ank[1]+.8,3.6,1.6,0,0,7);g.fill();};
  // far leg, behind the frame
  leg(P[1],shade(sp.legs,.8));
  // wheels with turning spokes
  for(const w of [W1,W2]){g.beginPath();g.arc(w[0],w[1],R,0,7);g.lineWidth=lw(1.6);g.strokeStyle='rgba(40,36,48,.9)';g.stroke();
    for(let k=0;k<4;k++){const a=wheel+k*Math.PI/4;line([[w[0]-R*.92*Math.cos(a),w[1]-R*.92*Math.sin(a)],[w[0]+R*.92*Math.cos(a),w[1]+R*.92*Math.sin(a)]],.5,'rgba(40,36,48,.5)');}}
  // frame, saddle, bars
  line([W1,C,[36,76],W1],1.8,sp.bike);line([C,[62,72],[36,76]],1.8,sp.bike);line([[62,72],W2],1.8,sp.bike);
  line([[61,72],[60,64],[66,63]],1.6,'rgba(40,36,48,.9)');line([[32,74.5],[40,74.5]],2.4,'rgba(40,36,48,.9)');
  line([P[0],P[1]],1.2,'rgba(40,36,48,.8)');
  // rider
  // a curved back from the saddle up to the shoulders, a flatter front
  const hc=[Sh[0]+5.4,Sh[1]-9];
  g.fillStyle=shade(sp.skin,.9);g.beginPath();g.moveTo(Sh[0]+1,Sh[1]+1);g.lineTo(hc[0]-2.4,hc[1]+2.6);g.lineTo(hc[0]+1.2,hc[1]+3.6);g.lineTo(Sh[0]+4.6,Sh[1]+2.6);g.closePath();g.fill();
  g.beginPath();g.moveTo(H[0]-5.4,H[1]+2);g.quadraticCurveTo(H[0]-6,H[1]-16,Sh[0]-4,Sh[1]-1.6);g.quadraticCurveTo(Sh[0]+2,Sh[1]-4.6,Sh[0]+5.4,Sh[1]+1.6);
  g.quadraticCurveTo(Sh[0]+1,Sh[1]+14,H[0]+6,H[1]+2.6);g.closePath();g.fillStyle=sp.top;g.fill();g.lineWidth=lw(.9);g.strokeStyle=INKC;g.stroke();
  g.fillStyle=sp.legs;g.beginPath();g.ellipse(H[0],H[1]+1.5,6.4,3.6,-.2,0,7);g.fill();g.fillStyle=sp.skin;g.beginPath();g.ellipse(hc[0],hc[1],4.4,5.3,.2,0,7);g.fill();g.lineWidth=lw(.8);g.strokeStyle=INKC;g.stroke();
  g.fillStyle=sp.hair;g.beginPath();g.ellipse(hc[0]-1.2,hc[1]-2.8,4.4,3.2,.2,0,7);g.fill();
  if(sp.hat){g.fillStyle=sp.hat;g.beginPath();g.ellipse(hc[0]-.5,hc[1]-4,5.6,3,.15,Math.PI,0);g.fill();}
  const hand=[65,63.5],S0=[Sh[0]+1,Sh[1]+2],el=ik(S0,hand,15,15,-1);line([S0,el,hand],3.6+1.1,INKC);line([S0,el,hand],3.6,sp.top);
  g.fillStyle=sp.skin;g.beginPath();g.arc(hand[0],hand[1],1.7,0,7);g.fill();
  // near leg, in front of the frame
  leg(P[0],sp.legs);
}
function shade(hex,k){const c=hexRGB(hex)||[.5,.5,.5];return `rgb(${c.map(v=>Math.round(v*k*255)).join(',')})`;}
// one frame of a figure at scene point (x, y) = its feet; s = screen px per figure unit
function drawFigure(g,sp,q,cx,cy,s,flip,alpha,dt){
  const st=sp.st||(sp.st={phase:Math.random(),dist:0,last:null,arm:[spring(60,9),spring(60,9)],bag:spring(14,1.8)});
  // phase from distance travelled, in figure units
  if(st.last){const raw=Math.hypot(q.x-st.last[0],q.y-st.last[1]),d=raw/sp.figScale;if(raw<sp.height){st.dist+=d;if(sp.figure==='walker'){const o=GAITS[sp.gait];st.phase+=d/(o.speed*o.period);}}}
  st.last=[q.x,q.y];st.dt=dt;
  // drawn in the painting's medium: pen outlines in ink & wash, soft edges in watercolour, opaque with grain in gouache
  const look=mediumLook();INKC=look.outline||'rgba(0,0,0,0)';
  // painted on its own and finished in the medium (motion/style.js): bleed and granulation, or streaks and grain
  const H=125*s;g.save();g.globalAlpha=alpha;
  inMedium(g,{x:cx-H,y:cy-H*1.1,w:H*2,h:H*1.2},c=>{c.save();c.translate(cx,cy);c.scale(flip*s,s);c.translate(-40,-120);
    if(sp.figure==='cyclist')drawCyclist(c,sp,st,s);else drawWalker(c,sp,st,s);c.restore();});
  g.restore();
}


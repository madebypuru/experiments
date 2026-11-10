// Paint motion: the director. For a photo it decides what moves and where, from what was read
// (motion/understand.js): people on the roads, pavements and paths at the right size for where they
// stand, a cyclist on a road, birds in open sky. Clouds and ripples come from their own bases.
// Everything it places is a base (figures, birds); it never animates anything by hand. See ../MOTION.md.
//
// Placement rules (real numbers, then taste):
//  - a person standing k grid rows below the horizon is 1.06·k rows tall (camera at eye height)
//  - only rows where that height is 6%-40% of the picture: no giants in the foreground, no specks
//  - a walk needs a clear stretch of walkable ground at least 3 people long, reaching an edge of the
//    picture so they can come and go (or turning back if it can't)
//  - at most 4 people and 1 cyclist, spread in depth, never two on one row; 2-3 birds in a big sky
//  - all in grid units; drawn through the same bases as scene files
const WALKABLE=['road','path','ground'],PARK=['grass'];
const CLOTHES=['#c8463c','#2f6f9f','#3f7a52','#e0b33c','#6b5a46','#8a4f8a','#d8d2c4','#3b3f5c','#b35a2a','#5a7fa8'];
const LEGS=['#3b3f5c','#2b2a33','#4a6a8a','#5b4a3a','#6d6a66'],SKIN=['#e2b48f','#c99272','#8d5b3e','#f0c8a8','#a8714f'],HAIR=['#3a2a22','#1f1a1a','#6a4a30','#b08850','#8a8580'];

function direct(I){
  const P=I.photo,M=P&&P.masks;if(!M)return [];
  const {gw,gh,n}=I,rnd2=seeded(Math.round(gw*7+gh*13)),pick=a=>a[(rnd2()*a.length)|0],cast=[];
  const at=(m,i)=>m?m[i]:0,ground=i=>Math.max(...WALKABLE.map(r=>at(M[r],i)),.85*at(M.grass,i));
  // things standing in the photo (people, cars, posts) hide the ground behind them; the ground goes on behind,
  // so scanning each column upward, ground stays ground through anything that stands on it
  const stand=i=>Math.max(at(M.figure,i),at(M.vehicle,i),at(M.prop,i)),behind=new Float32Array(n);
  for(let x=0;x<gw;x++){let g=stand((gh-1)*gw+x)>.5?.8:0; // someone cut off by the bottom edge is standing on ground we can't see
    for(let y=gh-1;y>=0;y--){const i=y*gw+x,v=ground(i);if(v>.6)g=v;else if(stand(i)<.5)g=0;behind[i]=g;}}
  const walkAt=i=>behind[i];
  // what stands in the photo, each with the row its feet are on: nearer than a walker whose feet are higher up
  I.standing=components(Uint8Array.from({length:n},(_,i)=>stand(i)>.5?1:0),gw,gh).filter(o=>o.px.length>8);
  // ---- people: scan rows below the horizon for long clear stretches of walkable ground
  const rows=[];
  for(let y=Math.ceil(P.horizon+2);y<gh-1;y++){
    const h=P.personAt(y);if(h<gh*.06||h>gh*.4)continue;
    let x=0;const ok=x=>walkAt(y*gw+x)>.6&&I.Fu[y*gw+x]>.3,gap=Math.max(2,h*.3);
    while(x<gw){
      while(x<gw&&!ok(x))x++;const x0=x;
      // a stretch of walkable ground; small gaps (a bollard, an unlabelled patch) don't break it
      let last=x;while(x<gw&&x-last<=gap){if(ok(x))last=x;x++;}x=last+1;
      const len=x-x0;if(len>=Math.max(h*1.6,gw*.14))rows.push({y,x0,x1:x,h,len,edge:(x0<=1)+(x>=gw-1),road:at(M.road,y*gw+((x0+x)>>1))>.6});
      x++;}
  }
  // prefer stretches that reach an edge and mid-sized people; then spread them in depth
  rows.sort((a,b)=>(b.edge*2+Math.min(1,b.len/gw)-Math.abs(b.h/gh-.16)*4)-(a.edge*2+Math.min(1,a.len/gw)-Math.abs(a.h/gh-.16)*4));
  const used=[];const want=clamp(Math.round(rows.length/12),rows.length?1:0,4);
  for(const r of rows){if(cast.filter(c=>c.figure==='walker').length>=want)break;
    if(used.some(u=>Math.abs(u-r.y)<Math.max(3,r.h*.18)))continue;used.push(r.y);
    const dir=rnd2()<.5?1:-1,off=r.h*1.2,a=r.x0<=1?-off:r.x0+r.h*.3,b=r.x1>=gw-1?gw+off:r.x1-r.h*.3;
    cast.push(actor({figure:'walker',gait:rnd2()<.3?'stroll':'walk',height:r.h,top:pick(CLOTHES),legs:pick(LEGS),skin:pick(SKIN),hair:pick(HAIR),shoes:'#2e2a30',
      outfit:pick(['trousers','trousers','coat','dress']),carry:pick(['none','none','bag','none']),carryColor:pick(['#7a4a2c','#2b2a33','#a8443a']),hat:null,bike:null},
      dir>0?[a,r.y]:[b,r.y],dir>0?[b,r.y]:[a,r.y],r.edge===2?'loop':'pingpong',rnd2()*6));
  }
  // stagger them, so people come and go one after another instead of setting off together
  const walkers=cast.filter(c=>c.figure==='walker');walkers.forEach((w,k)=>{w.delay=k*w.dur*.55+rnd2()*1.5;});
  // a cyclist on a road, if there's a long one
  const rr=rows.filter(r=>r.road&&r.edge===2&&!used.includes(r.y)).sort((a,b)=>b.len-a.len)[0];
  if(rr){const off=rr.h*2,dir=rnd2()<.5?1:-1;
    cast.push(actor({figure:'cyclist',gait:'walk',height:rr.h,top:pick(CLOTHES),legs:pick(LEGS),skin:pick(SKIN),hair:pick(HAIR),shoes:'#2e2a30',outfit:'trousers',carry:'none',hat:null,bike:pick(['#7a3b2e','#2f5f7a','#3b3f5c','#a8443a'])},
      dir>0?[-off,rr.y]:[gw+off,rr.y],dir>0?[gw+off,rr.y]:[-off,rr.y],'loop',4+rnd2()*6));}
  // ---- birds: a few, in the upper part of open sky, crossing in 7-14 s
  if(M.sky){let y0=-1,y1=-1,area=0;for(let y=0;y<gh;y++){let s=0;for(let x=0;x<gw;x++)s+=M.sky[y*gw+x];area+=s;if(s/gw>.3){if(y0<0)y0=y;y1=y;}}
    if(y0>=0&&area/n>.08){const kind=M.water?'gull':pick(['bird','crow','swallow']),nb=area/n>.25?3:2;
      for(let k=0;k<nb;k++){const y=lerp(y0,y0+(y1-y0)*.6,rnd2()),dir=rnd2()<.6?1:-1,span=gh*lerp(.018,.032,rnd2()),off=span*3;
        const b=actor({bird:birdState(birdKind(kind)),span,col:'#2f2c36'},dir>0?[-off,y]:[gw+off,y],dir>0?[gw+off,y+lerp(-.06,.06,rnd2())*gh]:[-off,y+lerp(-.06,.06,rnd2())*gh],'loop',k*rnd2()*5);
        b.dur=(gw+2*off)/(gw/lerp(7,14,rnd2()));cast.push(b);}}}
  return cast;
}
// what hides an actor walking on row y: everything standing in the photo whose feet are lower (nearer)
function occluderFor(I,y){
  const c=document.createElement('canvas');c.width=I.gw;c.height=I.gh;const g=c.getContext('2d'),id=g.createImageData(I.gw,I.gh);let any=0;
  for(const o of I.standing||[])if(o.y1>y+1){any=1;for(const i of o.px)id.data[i*4+3]=255;}
  if(!any)return null;g.putImageData(id,0,0);return c;
}
function actor(o,a,b,repeat,delay){
  const pts=[a,b],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(o.figure)o.occ=occluderFor(IM,a[1]);
  const speed=o.figure==='cyclist'?CYCLE_SPEED*o.height/95:o.figure?GAITS[o.gait].speed*o.height/95:0;
  return {...o,name:o.figure||'bird',pts,len,dur:speed?len/speed:10,delay,repeat,flip:true,scaleEnd:1,fadeEnd:1,st:null,tilt:0};
}
// one frame of the cast, in grid units mapped onto the painting
let castClock=0;const castTmp=document.createElement('canvas');
function castFrame(g,fg,dt){
  const I=IM;if(!I.cast){I.cast=direct(I);castClock=0;} // a new cast starts its own clock, so the staggered starts hold
  if(!I.cast.length)return 0;
  dt=Math.max(0,dt);castClock+=dt;const r=I.rect,sx=r.w/I.gw,sy=r.h/I.gh;let opaque=0;
  for(const a of I.cast){
    const u=(castClock-a.delay)/a.dur;if(u<0)continue;let p;
    if(a.repeat==='pingpong'){const f=u%2;p=f<1?f:2-f;}else p=u%1;
    const back=a.repeat==='pingpong'&&(u%2)>=1,x=lerp(a.pts[0][0],a.pts[1][0],p),y=lerp(a.pts[0][1],a.pts[1][1],p);
    const dx=(a.pts[1][0]-a.pts[0][0])*(back?-1:1),flip=dx<0?-1:1;
    const gx=clamp(Math.round(x),0,I.gw-1),gy=clamp(Math.round(y),0,I.gh-1),inPaint=(x<0||x>I.gw)?0:smooth(.15,.6,I.Fu[gy*I.gw+gx]);
    if(inPaint<=.01){a.st&&(a.st.last=null);continue;}
    const cx=r.x+x*sx,cy=r.y+y*sy,q={x,y,dx,p,u};
    if(a.bird){const w=birdStep(a.bird,dt);drawBird(g,cx,cy,a.span*sx,w,flip,0,a.col,inPaint);continue;}
    a.figScale=a.height/95;
    if(!a.occ){drawFigure(fg,a,q,cx,cy,a.figScale*sx,flip,inPaint,dt);opaque++;continue;}
    // draw it on its own, cut away whatever in the photo stands in front of it, then lay it on
    const H=a.height*sy,dpr=lifeCv.width/W,L=cx-H*1.1,T=cy-H*1.35,bw=H*2.2,bh=H*1.5;
    const tw=Math.ceil(bw*dpr),th=Math.ceil(bh*dpr);if(castTmp.width<tw)castTmp.width=tw;if(castTmp.height<th)castTmp.height=th;
    const t=castTmp.getContext('2d');t.setTransform(1,0,0,1,0,0);t.clearRect(0,0,castTmp.width,castTmp.height);t.setTransform(dpr,0,0,dpr,-L*dpr,-T*dpr);
    drawFigure(t,a,q,cx,cy,a.figScale*sx,flip,inPaint,dt);
    t.globalCompositeOperation='destination-out';t.imageSmoothingEnabled=true;t.drawImage(a.occ,r.x,r.y,r.w,r.h);t.globalCompositeOperation='source-over';
    fg.save();fg.setTransform(1,0,0,1,0,0);fg.drawImage(castTmp,0,0,tw,th,L*dpr,T*dpr,tw,th);fg.restore();opaque++;
  }
  return opaque;
}

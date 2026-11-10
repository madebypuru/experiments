// Paint motion base: weather that touches the picture. Rain stops where it meets something (a roof, the
// road, a tree, the water) and splashes there; drips run off the edges of roofs; snow lands on what faces up
// and builds up there, then melts when it stops. People answer too (see figures.js): umbrellas go up in the
// rain, and snow settles on heads, shoulders and umbrellas. See ../MOTION.md.
//
// Real numbers: raindrops fall at about 9 m/s (so in a painting, the whole height in well under a second);
// a splash crown lasts about 0.15 s; snowflakes fall at about 1 m/s and drift with the wind.

// ---------- where things land ----------
// Every column of the grid gets a list of upward-facing surfaces: places where something solid has open air
// or a different thing above it (a roof's top, the road below a wall, the top of a tree, the water).
const LAND_ROLES={roof:'hard',ground:'hard',road:'hard',path:'hard',grass:'soft',foliage:'soft',flower:'soft',water:'water',vehicle:'hard',prop:'hard',figure:'soft',building:'hard',wall:'hard',mountain:'soft',hill:'soft'};
function weatherSurfaces(I){
  if(I.surfaces)return I.surfaces;
  const {gw,gh}=I,M=masksOf(I)||{},sky=M.sky||parts().sky,roles=Object.keys(M).filter(r=>LAND_ROLES[r]);
  const roleAt=i=>{let best=null,v=.5;for(const r of roles)if(M[r][i]>v){v=M[r][i];best=r;}return best;};
  const cols=[],A=Math.max(3,Math.round(gh*.008)),B=Math.max(4,Math.round(gh*.012)),isSky=i=>sky[i]>.5||(M.cloud&&M.cloud[i]>.5); // a cloud is still sky, not a roof
  // the solid thing (anything not sky) is the subject: rain that lands on it runs down it (see rivulets)
  const subject=new Uint8Array(gw*gh);for(let i=0;i<gw*gh;i++)subject[i]=!isSky(i)&&I.Fu[i]>.25?1:0;
  for(let x=0;x<gw;x++){const list=[];let prev='sky';
    for(let y=A;y<gh-B;y++){const i=y*gw+x;if(I.Fu[i]<.25){prev='out';continue;}
      const r=isSky(i)?'sky':(roleAt(i)||'solid');
      if(r!=='sky'&&r!==prev){
        // a real top: open sky for A rows above and something solid for B rows below (a speck in the sky is not a roof)
        let open=prev==='sky',solid=true;if(open)for(let k=1;k<=A;k++)if(!isSky(i-k*gw)){open=false;break;}
        for(let k=0;k<B;k++)if(isSky(i+k*gw)){solid=false;break;}
        // or a flat thing you can land on below another (the road below a wall, the water below a boat)
        const flat=['ground','road','path','grass','water','roof'].includes(r)&&solid;
        if((open&&solid)||flat)list.push({y,kind:LAND_ROLES[r]||'hard',role:r,ground:['ground','road','path','grass','water'].includes(r)});}
      prev=r;}
    cols.push(list);}
  // eaves: the bottom edge of a roof, where drips gather
  const eaves=[];if(M.roof)for(let y=2;y<gh-2;y++)for(let x=0;x<gw;x+=2){const i=y*gw+x;if(M.roof[i]>.5&&M.roof[i+gw]<.5&&I.Fu[i]>.3)eaves.push([x,y]);}
  return I.surfaces={cols,eaves,subject};
}
// pick where one drop or flake (falling down column x) stops: the first surface often, a lower one sometimes,
// as if it fell in front of the first thing nearer the viewer
function landRow(I,x,firstBias,pass=.3){const S=weatherSurfaces(I),list=S.cols[clamp(Math.round(x),0,I.gw-1)];
  if(!list||!list.length||Math.random()<pass)return null; // falls past, in front of everything
  if(list.length===1||Math.random()<firstBias)return list[0];return list[1+Math.floor(Math.random()*(list.length-1))];}

// ---------- rain ----------
let splashes=[],drips=[],rivulets=[];
// a trickle: from where a drop landed on the subject it runs down over it, cell by cell, keeping to the solid
// shape (sliding sideways round an edge), a wet glint at its head and a fading shine behind
function startRivulet(I,x,y){const r=I.rect,gx=Math.round((x-r.x)/r.w*I.gw),gy=Math.round((y-r.y)/r.h*I.gh)+1;
  // a wet trail darkens a pale surface and glints on a dark one, so take the colour where it starts
  const i=clamp(gy,0,I.gh-1)*I.gw+clamp(gx,0,I.gw-1),c=[I.R[i],I.G[i],I.B[i]],lum=.2126*c[0]+.7152*c[1]+.0722*c[2];
  rivulets.push({gx,gy,pts:[[gx,gy]],age:0,wet:lum>.45?c.map(v=>Math.round(v*.6*255)):null,len:Math.round(I.gh*rnd(.04,.12)),speed:I.gh*rnd(.05,.09),acc:0,done:false,fade:1});}
function stepRivulet(I,v,dt){const S=weatherSurfaces(I),sub=S.subject,{gw,gh}=I;v.age+=dt;
  if(!v.done){v.acc+=v.speed*dt;while(v.acc>=1&&!v.done){v.acc-=1;const x=v.gx,y=v.gy+1;
    if(y>=gh||v.pts.length>=v.len){v.done=true;break;}
    const ok=(xx,yy)=>xx>=0&&xx<gw&&sub[yy*gw+xx];
    if(ok(x,y))v.gy=y;else{const side=Math.random()<.5?-1:1;if(ok(x+side,y)){v.gx+=side;v.gy=y;}else if(ok(x-side,y)){v.gx-=side;v.gy=y;}else{v.done=true;break;}}
    if(Math.random()<.15){const d=Math.random()<.5?-1:1;if(ok(v.gx+d,v.gy))v.gx+=d;} // a little wander
    v.pts.push([v.gx,v.gy]);}}
  else v.fade-=dt*.6;
  return v.fade>0;}
function rainFrame(g,dt){
  const I=IM,r=I.rect,sx=r.w/I.gw,sy=r.h/I.gh,md=medium(),lean=.12+.06*WORLD.wind;
  // rain falls from the clouds: from under each cloud's base, drifting with it; with no cloud in view it falls from above
  const clouds=(I.clouds||[]).filter(c=>c.x+c.w>r.x&&c.x-c.w<r.x+r.w);
  if(rainOn&&drops.length<260)for(let k=0;k<9;k++){let x,y;
    if(clouds.length){const c=clouds[(Math.random()*clouds.length)|0],xs=c.puffs.map(p=>p.dx),base=Math.max(...c.puffs.map(p=>p.dy+p.r*.45));
      x=c.x+lerp(Math.min(...xs)-c.w*.05,Math.max(...xs)+c.w*.05,Math.random());y=c.y+base+rnd(-2,4);}
    else{x=r.x+Math.random()*(r.w+60)-30;y=r.y-10;}
    const gx=(x-r.x)/sx,L=landRow(I,gx,.55);
    drops.push({x,y,v:rnd(480,680),l:rnd(9,17),stop:L?Math.max(y+8,r.y+L.y*sy):r.y+r.h+20,kind:L?L.kind:'hard',ground:L?L.ground:true});}
  // drips gather on the eaves and fall a short way
  const S=weatherSurfaces(I);if(rainOn&&S.eaves.length&&Math.random()<dt*14){const e=S.eaves[(Math.random()*S.eaves.length)|0];drips.push({x:r.x+e[0]*sx,y:r.y+e[1]*sy,v:0,life:rnd(.5,.9),age:0});}
  // the streaks, stopping where they land
  g.strokeStyle=md==='gouache'?'rgba(214,222,236,.55)':md==='ink'?'rgba(70,74,92,.55)':'rgba(96,110,132,.45)';g.lineWidth=md==='gouache'?1.4:1;g.lineCap='round';g.beginPath();
  drops=drops.filter(d=>{d.y+=d.v*dt;d.x-=d.v*dt*lean;
    if(d.y>=d.stop){if(d.stop<r.y+r.h-1){splashes.push({x:d.x,y:d.stop,age:0,kind:d.kind,s:rnd(.7,.9)});if(!d.ground&&rivulets.length<40&&Math.random()<.35)startRivulet(I,d.x,d.stop);}return false;}
    g.moveTo(d.x,d.y);g.lineTo(d.x+d.l*lean,d.y-d.l);return true;});
  g.stroke();
  for(const d of drips){d.age+=dt;d.v+=900*dt;d.y+=d.v*dt;}drips=drips.filter(d=>d.age<d.life);
  g.fillStyle=md==='ink'?'rgba(60,66,86,.7)':'rgba(120,134,156,.75)';for(const d of drips){g.beginPath();g.ellipse(d.x,d.y,1,1.8,0,0,7);g.fill();}
  // splashes: a little crown on hard ground, a spray on leaves, a ring on water
  const ink=md==='ink',gc=md==='gouache';
  // trickles over the subject: a thin wet shine and a bead at the head, in the medium's touch
  rivulets=rivulets.filter(v=>stepRivulet(I,v,dt));
  for(const v of rivulets){if(v.pts.length<2)continue;const a=v.fade;
    g.strokeStyle=v.wet?`rgba(${v.wet.join(',')},${(.55*a).toFixed(3)})`:gc?`rgba(236,240,246,${(.55*a).toFixed(3)})`:ink?`rgba(56,62,82,${(.45*a).toFixed(3)})`:`rgba(240,244,250,${(.5*a).toFixed(3)})`;g.lineWidth=gc?1.6:1.2;g.lineCap='round';g.lineJoin='round';
    if(md==='watercolour')g.filter='blur(.4px)';g.beginPath();v.pts.forEach(([x,y],j)=>{const X=r.x+(x+.5)*sx,Y=r.y+(y+.5)*sy;j?g.lineTo(X,Y):g.moveTo(X,Y);});g.stroke();g.filter='none';
    if(!v.done){const [x,y]=v.pts[v.pts.length-1];g.fillStyle=gc?`rgba(244,246,250,${(.85*a).toFixed(3)})`:`rgba(250,252,255,${(.75*a).toFixed(3)})`;g.beginPath();g.ellipse(r.x+(x+.5)*sx,r.y+(y+.5)*sy,1.1,1.6,0,0,7);g.fill();}}
  splashes=splashes.filter(s=>{s.age+=dt;const life=s.kind==='water'?.55:.18;if(s.age>life)return false;const u=s.age/life,a=(1-u);
    if(s.kind==='water'){g.strokeStyle=gc?`rgba(226,232,240,${(.7*a).toFixed(3)})`:ink?`rgba(60,66,86,${(.6*a).toFixed(3)})`:`rgba(232,238,246,${(.6*a).toFixed(3)})`;g.lineWidth=gc?1.3:.9;
      g.beginPath();g.ellipse(s.x,s.y,Math.max(.1,1+u*6*s.s),Math.max(.1,.4+u*1.8*s.s),0,0,7);g.stroke();return true;}
    const h=(s.kind==='soft'?3:4.5)*s.s*Math.sin(Math.PI*Math.min(1,u*1.2));g.strokeStyle=gc?`rgba(228,234,242,${(.8*a).toFixed(3)})`:ink?`rgba(60,66,86,${(.7*a).toFixed(3)})`:`rgba(220,228,240,${(.75*a).toFixed(3)})`;
    g.lineWidth=gc?1.4:1;g.beginPath();for(const dx of s.kind==='soft'?[-1.6,1.6]:[-2.6,-1,1,2.6]){g.moveTo(s.x,s.y);g.quadraticCurveTo(s.x+dx*.6,s.y-h,s.x+dx*(1+u),s.y-h*.4);}g.stroke();return true;});
}

// ---------- snow ----------
const snowCapCv=document.createElement('canvas');let snowCapFor=null,snowCover=0;
function snowFrame2(g,dt){
  const I=IM,r=I.rect,sx=r.w/I.gw,sy=r.h/I.gh,md=medium();
  if(snowCapFor!==I){snowCapFor=I;snowCapCv.width=I.gw;snowCapCv.height=I.gh;snowCapCv.getContext('2d').clearRect(0,0,I.gw,I.gh);snowCover=0;}
  const cap=snowCapCv.getContext('2d');
  if(snowOn&&flakes.length<170)for(let k=0;k<3;k++){const x=r.x+Math.random()*r.w,L=landRow(I,(x-r.x)/sx,.75,.15);
    flakes.push({x,y:r.y-4,v:rnd(16,34),s:rnd(.8,2.2),ph:Math.random()*6,stop:L?r.y+L.y*sy:r.y+r.h,kind:L?L.kind:'hard'});}
  // settled snow builds up where flakes land (not on water, where they melt), and melts slowly once it stops
  snowCover=clamp(snowCover+(snowOn?dt/14:-dt/20),0,1);WORLD.snowCover=snowCover;
  if(snowCover<=0&&!snowOn&&!flakes.length){cap.clearRect(0,0,I.gw,I.gh);} // fully melted
  g.fillStyle=md==='ink'?'#fbfaf6':'#fff';
  flakes=flakes.filter(f=>{f.y+=f.v*dt;f.ph+=dt;const x=f.x+Math.sin(f.ph)*4+WORLD.wind*6*Math.sin(f.ph*.3);
    if(!snowOn)f.fade=(f.fade??1)-dt*.7;if(f.fade<=0)return false;
    if(f.y>=f.stop){if(f.kind!=='water'){const gx=(x-r.x)/sx,gy=(f.stop-r.y)/sy;cap.fillStyle='rgba(255,255,255,.9)';cap.beginPath();cap.ellipse(gx,gy+.8,2.4+f.s*1.2,1.4,0,0,7);cap.fill();}return false;}
    g.globalAlpha=.85*(f.fade??1);g.beginPath();g.arc(x,f.y,f.s,0,7);g.fill();return true;});
  g.globalAlpha=1;
  // draw what has settled: soft in watercolour, opaque in gouache, crisp in ink
  if(snowCapFor===I){g.save();g.imageSmoothingEnabled=true;
    g.filter=md==='watercolour'?'blur(.8px)':'none';g.globalAlpha=(md==='gouache'?1:.95)*(snowOn?1:clamp(snowCover*3,0,1));g.drawImage(snowCapCv,r.x,r.y,r.w,r.h);g.restore();} // melting: it fades as the cover goes
}
// the weather's whole frame, on the weather layer
function weatherFrame(g,dt){
  if(!IM||!IM.Fu)return;dt=clamp(dt,0,.05); // never backwards: a negative step would give a splash a negative size
  if(rainOn||drops.length||splashes.length||drips.length)rainFrame(g,dt);
  WORLD.raining=rainOn;
  if(snowOn||flakes.length||snowCover>0)snowFrame2(g,dt);
}
// a new playback starts from a dry, clear picture: no settled snow, no trickles left from the last run
function resetWeather(){splashes=[];drips=[];rivulets=[];snowCover=0;WORLD.snowCover=0;WORLD.raining=false;
  if(snowCapFor){snowCapCv.getContext('2d').clearRect(0,0,snowCapCv.width,snowCapCv.height);}
  if(IM&&IM.cast)for(const a of IM.cast){if(a.rainUp){a.carry=a.carry0||'none';a.carryColor=a.carryColor0;}a.rainUp=undefined;}
  if(typeof sprites!=='undefined')for(const a of sprites)if(a.figure){if(a.rainUp){a.carry=a.carry0||'none';a.carryColor=a.carryColor0;}a.rainUp=undefined;}}

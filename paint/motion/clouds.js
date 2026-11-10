// Paint motion base: clouds. A few soft clouds drift across the open sky with the wind, slowly changing shape.
// Watercolour clouds are mostly paper: a light, soft top and a cool grey-violet underside. They are drawn
// in front of the painted sky and masked to the sky, so they never cross a roof or a tree. See ../MOTION.md.
//
// Real numbers: fair-weather cumulus drift at the wind's speed; in a painting a cloud crossing the whole
// sky in 2-4 minutes reads as "moving" without looking sped up. Nearer (lower) clouds look larger and faster.
const cloudCv=document.createElement('canvas');
let skyMaskCv=null;
function cloudSky(){
  const I=IM,M=masksOf(I),m=(M&&M.sky)||parts().sky;
  return m;
}
function makeClouds(){
  const I=IM,m=cloudSky();if(!m)return [];
  // where the open sky is, row by row
  let y0=-1,y1=-1,area=0;
  for(let y=0;y<I.gh;y++){let s=0;for(let x=0;x<I.gw;x++){const v=m[y*I.gw+x]*I.Fu[y*I.gw+x];s+=v;area+=v;}if(s/I.gw>.25){if(y0<0)y0=y;y1=y;}}
  area/=I.n;if(y0<0||area<.06)return [];
  // the sky as a soft mask image the size of the grid, drawn smoothly over the painting
  skyMaskCv=document.createElement('canvas');skyMaskCv.width=I.gw;skyMaskCv.height=I.gh;
  const mg=skyMaskCv.getContext('2d'),id=mg.createImageData(I.gw,I.gh);
  for(let i=0;i<I.n;i++){id.data[i*4+3]=Math.round(255*smooth(.35,.85,m[i])*smooth(.3,.7,I.Fu[i]));}
  mg.putImageData(id,0,0);
  const r=I.rect,top=r.y+y0/I.gh*r.h,bot=r.y+(y0+(y1-y0)*.75)/I.gh*r.h,n=clamp(Math.round(area*7),1,4),out=[];
  for(let k=0;k<n;k++){
    const d=Math.random(),w=r.w*lerp(.14,.26,d),y=lerp(top+r.h*.03,bot,d*.9+Math.random()*.1);
    const puffs=[];const np=5+((Math.random()*4)|0);
    for(let j=0;j<np;j++){const u=j/(np-1)-.5,hump=Math.cos(u*Math.PI);
      puffs.push({dx:u*w*.9+(Math.random()-.5)*w*.08,dy:-hump*w*.16*(.6+Math.random()*.5),r:w*(.13+.1*hump)*(.8+Math.random()*.4),ph:Math.random()*6,f:.04+Math.random()*.05});}
    // gouache: the painting's own mark, short opaque dabs laid in rows across each puff, cool violet-grey
    // underneath, cream in the body, near-white on top; made once (seeded), so only the cloud moves
    // gouache, as a painter shapes a cloud: broad strokes to fill each puff, then curved strokes that follow its
    // rounded top (the light side), and a cool stroke or two along the base; made once (seeded) so only it moves
    const rng=seeded(1000+k*77),strokes=[],arc=(cx,cy,R,a0,a1,n=5)=>Array.from({length:n},(_,q)=>{const t=a0+(a1-a0)*q/(n-1);return [cx+Math.cos(t)*R,cy+Math.sin(t)*R];});
    const cool=[.76,.75,.84],cream=[.95,.93,.89],light=[1,.99,.97];
    for(const p of puffs){
      for(const [yy,col] of [[.38,cool],[.12,cream],[-.14,cream],[-.42,cream]]){const half=Math.sqrt(Math.max(0,1-yy*yy))*p.r*.86,y0=p.dy+yy*p.r+(rng()-.5)*p.r*.08;
        strokes.push({pts:[[p.dx-half,y0],[p.dx,y0+(rng()-.5)*p.r*.1],[p.dx+half,y0]],w:p.r*.46,col:col.map(v=>v*(.97+rng()*.05)),look:strokeLook(rng,4)});}
      // the rounded top: two or three overlapping curved strokes, a little inside the edge
      const a0=Math.PI*(1.08+rng()*.06),a1=Math.PI*(1.92-rng()*.06),segs=2+((rng()*2)|0);
      for(let q=0;q<segs;q++){const t0=a0+(a1-a0)*(q/segs)-.12,t1=a0+(a1-a0)*((q+1)/segs)+.12;
        strokes.push({pts:arc(p.dx,p.dy+p.r*.04,p.r*.6,t0,t1),w:p.r*.44,col:light.map(v=>v*(.98+rng()*.03)),look:strokeLook(rng,4)});}
    }
    // a cool base along the bottom of the whole cloud
    {const xs=puffs.map(p=>p.dx),base=Math.max(...puffs.map(p=>p.dy+p.r*.42)),x0=Math.min(...xs),x1=Math.max(...xs);
      strokes.push({pts:[[x0,base],[(x0+x1)/2,base+w*.012],[x1,base]],w:w*.055,col:cool,look:strokeLook(rng,5)});}
    out.push({x:r.x+r.w*(k+.2+Math.random()*.6)/n,y,w,d,puffs,strokes,seed:k*3.1+1,speed:lerp(.6,1.2,d)});
  }
  return out;
}
function cloudFrame(fg,dt){
  const I=IM,r=I.rect;if(!skyMaskCv)return 0;
  const dpr=lifeCv.width/W;if(cloudCv.width!==lifeCv.width||cloudCv.height!==lifeCv.height){cloudCv.width=lifeCv.width;cloudCv.height=lifeCv.height;}
  const c=cloudCv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  for(const cl of I.clouds){
    cl.x+=WORLD.wind*r.w*.012*cl.speed*dt; // about 1.2% of the painting a second in the usual breeze
    if(cl.x-cl.w>r.x+r.w)cl.x=r.x-cl.w;else if(cl.x+cl.w<r.x)cl.x=r.x+r.w+cl.w;
    const md=medium();
    if(md==='gouache'){for(const st of cl.strokes)brushStroke(c,st.pts.map(([x,y])=>[cl.x+x,cl.y+y]),st.w,st.col,st.look,.97);continue;}
    if(md==='ink'){ // a flat pale wash underneath, then the pen: a scalloped top and a flat-ish base
      c.fillStyle='rgba(196,196,216,.32)';c.beginPath();for(const p of cl.puffs){c.moveTo(cl.x+p.dx+p.r*.9,cl.y+p.dy+p.r*.25);c.ellipse(cl.x+p.dx,cl.y+p.dy+p.r*.25,p.r*.9,p.r*.55,0,0,7);}c.fill();
      c.fillStyle='rgba(252,250,246,.9)';c.beginPath();for(const p of cl.puffs){c.moveTo(cl.x+p.dx+p.r*.95,cl.y+p.dy);c.arc(cl.x+p.dx,cl.y+p.dy,p.r*.95,0,7);}c.fill();
      const lw=Math.max(.9,cl.w*.006);cl.puffs.forEach((p,j)=>{const pts=[];for(let a=0;a<=12;a++){const th=Math.PI*(1.12+.76*a/12);pts.push([cl.x+p.dx+Math.cos(th)*p.r*.95,cl.y+p.dy+Math.sin(th)*p.r*.95]);}penPath(c,pts,lw,cl.seed+j);});
      const xs=cl.puffs.map(p=>p.dx),base=cl.y+Math.max(...cl.puffs.map(p=>p.dy+p.r*.55));penPath(c,[[cl.x+Math.min(...xs),base],[cl.x+(Math.min(...xs)+Math.max(...xs))/2,base+cl.w*.006],[cl.x+Math.max(...xs),base]],lw*.8,cl.seed+9);
      continue;}
    // watercolour: the cool underside first, a little lower, then the light body over it, soft as a wet wash
    for(const pass of [0,1])for(const p of cl.puffs){
      const rr=p.r*(1+.07*Math.sin(WORLD.clock*p.f*6.28+p.ph)),x=cl.x+p.dx,y=cl.y+p.dy+(pass?0:rr*.28);
      const gr=c.createRadialGradient(x,y,0,x,y,rr);
      if(pass){gr.addColorStop(0,'rgba(253,251,247,.82)');gr.addColorStop(.55,'rgba(250,248,244,.55)');gr.addColorStop(1,'rgba(250,248,244,0)');}
      else{gr.addColorStop(0,'rgba(176,176,198,.38)');gr.addColorStop(.6,'rgba(186,186,206,.2)');gr.addColorStop(1,'rgba(190,190,210,0)');}
      c.fillStyle=gr;c.beginPath();c.arc(x,y,rr,0,7);c.fill();}
  }
  // rain clouds: they grey and darken while it rains, and clear again after
  WORLD.rainAmt=clamp((WORLD.rainAmt||0)+(typeof rainOn!=='undefined'&&rainOn?dt/3:-dt/5),0,1);
  if(WORLD.rainAmt>0){c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-atop';c.fillStyle=`rgba(96,100,118,${(.55*WORLD.rainAmt).toFixed(3)})`;c.fillRect(0,0,cloudCv.width,cloudCv.height);c.restore();}
  if(medium()==='gouache')grainOver(c,0,0,cloudCv.width,cloudCv.height);
  // only over open sky
  c.globalCompositeOperation='destination-in';c.imageSmoothingEnabled=true;c.drawImage(skyMaskCv,r.x,r.y,r.w,r.h);c.globalCompositeOperation='source-over';
  fg.save();fg.setTransform(1,0,0,1,0,0);fg.drawImage(cloudCv,0,0);fg.restore();
  return I.clouds.length;
}

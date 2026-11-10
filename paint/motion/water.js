// Paint motion base. Loaded before the main script; uses its helpers (clamp, lerp, smooth, rnd, hexRGB) at call time.
// See ../MOTION.md for the contract every base keeps.
// ---------- ripples: short dashes that drift, swell and fade on the water, smaller and closer together further away ----------
function makeRipples(){
  const I=IM,M=masksOf(I),m=M&&M.water;if(!m)return [];
  const cells=[];let y0=I.gh,y1=0;
  for(let y=0;y<I.gh;y++)for(let x=0;x<I.gw;x++){const i=y*I.gw+x;if(m[i]>.6&&I.Fu[i]>.7){cells.push(i);y0=Math.min(y0,y);y1=Math.max(y1,y);}}
  if(cells.length<20)return [];
  const n=clamp(Math.round(cells.length/I.n*160),8,46),out=[];
  for(let k=0;k<n;k++)out.push({age:rnd(0,5),life:0,cells,y0,y1,light:Math.random()<.32});
  return out;
}
function rippleFrame(g,fg,dt){
  const I=IM,r=I.rect;let lit=0;
  for(const p of I.ripples){
    p.age+=dt;
    if(p.age>=p.life){ // a new ripple somewhere else on the water
      const i=p.cells[(Math.random()*p.cells.length)|0],gx=i%I.gw,gy=(i/I.gw)|0,d=p.y1>p.y0?(gy-p.y0)/(p.y1-p.y0):1; // d: 0 far, 1 near
      p.x=r.x+(gx+Math.random())/I.gw*r.w;p.y=r.y+(gy+Math.random())/I.gh*r.h;p.len=r.w*lerp(.01,.032,d)*rnd(.7,1.3);
      p.vx=r.w*rnd(.003,.008)*lerp(.5,1.2,d);p.life=rnd(2.6,5.2);p.age=0;p.pair=Math.random()<.35;}
    const a=Math.pow(Math.sin(Math.PI*p.age/p.life),1.6),x=p.x+p.vx*p.age,L=p.len*(.8+.2*a);
    const md=medium();
    if(md==='gouache'){ // short opaque strokes of light and dark paint
      if(!p.look)p.look=strokeLook(seeded(Math.round(p.x*7+p.y*13)),3);
      const col=p.light?[.97,.96,.92]:[.36,.44,.58];brushStroke(p.light?fg:g,[[x-L/2,p.y],[x,p.y-L*.05],[x+L/2,p.y]],Math.max(1.4,p.len*.12),col,p.look,a*(p.light?.85:.6));
      if(p.light)lit++;continue;}
    const ctx=p.light?fg:g;ctx.lineCap='round';ctx.filter=md==='watercolour'?'blur(.5px)':'none';ctx.strokeStyle=p.light?`rgba(255,253,246,${(.6*a).toFixed(3)})`:`rgba(28,44,72,${(.42*a).toFixed(3)})`;
    ctx.lineWidth=Math.max(.8,p.len*.07);
    const dash=(cx,cy,len)=>{ctx.beginPath();ctx.moveTo(cx-len/2,cy);ctx.quadraticCurveTo(cx,cy-len*.07,cx+len/2,cy);ctx.stroke();};
    dash(x,p.y,L);if(p.pair)dash(x+L*.35,p.y+L*.16,L*.6);
    ctx.filter='none';if(p.light)lit++;
  }
  return lit;
}

// Paint motion: the painting's medium. Every base draws its marks through these, so a moving thing looks
// made of the same stuff as the painting it moves in: soft transparent washes in watercolour, a pen line over
// a flat pale wash in ink & wash, opaque flat brushstrokes with bristles and grain in gouache. See ../MOTION.md.
//
// Marks that move are redrawn every frame, so nothing here may use Math.random while drawing (it would
// flicker): each element carries its own seeded randomness, made once.
function medium(){return typeof STYLE==='undefined'?'watercolour':STYLE==='gc'?'gouache':STYLE==='iw'?'ink':'watercolour';}
const INK_LINE='rgba(46,38,52,.78)';

// a gouache brushstroke along points (screen px): flat, opaque, tapering at the tail, with bristle streaks.
// `look` is made once per stroke (strokeLook) so the stroke is identical every frame.
function strokeLook(rng,n=6){return {w:.88+rng()*.2,jit:1+(rng()-.5)*.07,capA:.45+rng()*.35,capB:.45+rng()*.35,bristles:Array.from({length:n},(_,b)=>({off:(n>1?b/(n-1)-.5:0)*.8+(rng()-.5)*.12,t0:rng()*.12,t1:.55+rng()*.45,a:.25+rng()*.25,sh:1+(rng()-.5)*.22,w:.3+rng()*.35}))};}
function brushStroke(g,pts,width,col,look,alpha=.94){
  if(pts.length<2)return;const m=pts.length,N=[];
  for(let j=0;j<m;j++){const a=pts[Math.max(0,j-1)],b=pts[Math.min(m-1,j+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;N.push([-dy/l,dx/l]);}
  const W=width*look.w,hw=t=>W/2*(t<.12?lerp(.7,1,t/.12):1-.35*smooth(.55,1,t)),c=col.map(v=>clamp(v*look.jit,0,1));
  const rgb=k=>`rgb(${c.map(v=>Math.round(clamp(v*k,0,1)*255)).join(',')})`;
  // the body, with rounded, slightly squashed ends like a loaded brush (square ends read as bricks)
  const cap=(j,h,sgn,sq)=>{const n=N[j],tx=-n[1]*sgn,ty=n[0]*sgn;for(let a=1;a<6;a++){const th=Math.PI*a/6,c=Math.cos(th),si=Math.sin(th);g.lineTo(pts[j][0]+n[0]*h*c*sgn+tx*h*si*sq,pts[j][1]+n[1]*h*c*sgn+ty*h*si*sq);}};
  g.globalAlpha=alpha;g.fillStyle=rgb(1);g.beginPath();
  for(let j=0;j<m;j++){const t=j/(m-1),h=hw(t);g[j?'lineTo':'moveTo'](pts[j][0]+N[j][0]*h,pts[j][1]+N[j][1]*h);}
  cap(m-1,hw(1),1,look.capA??.6);
  for(let j=m-1;j>=0;j--){const t=j/(m-1),h=hw(t);g.lineTo(pts[j][0]-N[j][0]*h,pts[j][1]-N[j][1]*h);}
  cap(0,hw(0),-1,look.capB??.6);
  g.closePath();g.fill();
  if(W>2.4){g.lineCap='round';
    for(const b of look.bristles){g.globalAlpha=alpha*b.a;g.strokeStyle=rgb(b.sh);g.lineWidth=Math.max(.4,W/look.bristles.length*b.w);g.beginPath();let first=true;
      for(let j=0;j<m;j++){const t=j/(m-1);if(t<b.t0||t>b.t1)continue;const h=hw(t)*2*b.off;g[first?'moveTo':'lineTo'](pts[j][0]+N[j][0]*h,pts[j][1]+N[j][1]*h);first=false;}g.stroke();}}
  g.globalAlpha=1;
}
// an ink line with a slight hand wobble (fixed per line by its seed)
function penPath(g,pts,width,seed=1,col=INK_LINE){
  g.strokeStyle=col;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.beginPath();
  pts.forEach((p,j)=>{const w=Math.sin(j*1.7+seed)*.35+Math.sin(j*.63+seed*2.1)*.25;g[j?'lineTo':'moveTo'](p[0]+w*width*.6,p[1]+w*width*.6);});g.stroke();
}
// paint grain for gouache: a fixed noise tile, laid over opaque marks only
let grainPat=null;
function grainOver(g,x,y,w,h){
  if(!grainPat){const c=document.createElement('canvas');c.width=c.height=96;const cg=c.getContext('2d'),id=cg.createImageData(96,96),rng=seeded(7);
    for(let i=0;i<96*96;i++){id.data[i*4]=40;id.data[i*4+1]=34;id.data[i*4+2]=30;id.data[i*4+3]=Math.round(34*rng()*rng());}cg.putImageData(id,0,0);grainPat=g.createPattern(c,'repeat');}
  // only on paint already there (source-atop), never on the empty canvas around it
  g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-atop';g.fillStyle=grainPat;g.fillRect(x,y,w,h);g.restore();
}
// how a medium treats a layer of opaque moving things (people, cyclists): ink keeps its pen outlines;
// watercolour softens edges and lets the paper show a little; gouache drops outlines and adds grain
function mediumLook(){const m=medium();return m==='ink'?{outline:INK_LINE,blur:0,alpha:1}:m==='gouache'?{outline:null,blur:0,alpha:1,grain:true}:{outline:'rgba(46,38,52,.22)',blur:.45,alpha:.9};}

// ---------- finishing an opaque moving thing in the medium ----------
// The thing is drawn on its own small canvas, then finished: watercolour bleeds a little at the edges, lets the
// painting show through and picks up paper granulation; gouache gets bristle streaks and grain; ink stays crisp.
const medTmp=document.createElement('canvas'),medTmp2=document.createElement('canvas'),medTmp3=document.createElement('canvas');let streakPat=null,granPat=null,blotchPat=null;
function medPatterns(g){
  if(!streakPat){const c=document.createElement('canvas');c.width=c.height=128;const cg=c.getContext('2d'),rng=seeded(21);cg.lineCap='round';
    for(let k=0;k<150;k++){const x=rng()*128,y=rng()*128,l=10+rng()*26,a=(rng()-.5)*.3,light=rng()<.5;cg.strokeStyle=light?`rgba(255,250,240,${.1+rng()*.12})`:`rgba(30,20,15,${.06+rng()*.08})`;
      cg.lineWidth=1+rng()*2.2;cg.beginPath();cg.moveTo(x,y);cg.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);cg.stroke();}
    streakPat=g.createPattern(c,'repeat');}
  if(!granPat){const c=document.createElement('canvas');c.width=c.height=96;const cg=c.getContext('2d'),id=cg.createImageData(96,96),rng=seeded(33);
    for(let i=0;i<96*96;i++){const v=rng();if(v<.035){id.data[i*4]=id.data[i*4+1]=id.data[i*4+2]=255;id.data[i*4+3]=45;}else if(v>.96){id.data[i*4]=40;id.data[i*4+1]=30;id.data[i*4+2]=40;id.data[i*4+3]=40;}}
    cg.putImageData(id,0,0);granPat=g.createPattern(c,'repeat');}
  if(!blotchPat){const c=document.createElement('canvas');c.width=c.height=160;const cg=c.getContext('2d'),rng=seeded(45);
    for(let k=0;k<40;k++){const x=rng()*160,y=rng()*160,r=6+rng()*22,gr=cg.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,`rgba(255,255,255,${.18+rng()*.2})`);gr.addColorStop(1,'rgba(255,255,255,0)');cg.fillStyle=gr;cg.beginPath();cg.arc(x,y,r,0,7);cg.fill();}
    blotchPat=g.createPattern(c,'repeat');}
}
// draw(ctx) paints the thing in g's current coordinates; box is its bounds in those coordinates
function inMedium(g,box,draw){
  const md=medium();if(md==='ink'){draw(g);return;}
  const M=g.getTransform(),L=M.a*box.x+M.e,T=M.d*box.y+M.f,Wd=Math.ceil(M.a*box.w)+2,Hd=Math.ceil(M.d*box.h)+2;
  if(Wd<2||Hd<2||Wd>4000||Hd>4000){draw(g);return;}
  for(const c of [medTmp,medTmp2]){if(c.width<Wd)c.width=Wd;if(c.height<Hd)c.height=Hd;}
  const t=medTmp.getContext('2d');t.setTransform(1,0,0,1,0,0);t.clearRect(0,0,Wd,Hd);t.globalAlpha=1;t.filter='none';
  t.setTransform(M.a,M.b,M.c,M.d,M.e-L,M.f-T);draw(t);t.setTransform(1,0,0,1,0,0);medPatterns(t);
  if(md==='gouache'){t.globalCompositeOperation='source-atop';t.fillStyle=streakPat;t.fillRect(0,0,Wd,Hd);t.globalCompositeOperation='source-over';grainOver(t,0,0,Wd,Hd);}
  else{ // watercolour: a wet halo of the same colours, the body a little transparent, granulation on top
    const u=medTmp2.getContext('2d');u.setTransform(1,0,0,1,0,0);u.clearRect(0,0,Wd,Hd);u.drawImage(medTmp,0,0);
    t.clearRect(0,0,Wd,Hd);const px=Math.max(.6,Wd/120);t.filter=`blur(${px.toFixed(2)}px)`;t.globalAlpha=.55;t.drawImage(medTmp2,0,0);t.filter='none';t.globalAlpha=.82;t.drawImage(medTmp2,0,0);t.globalAlpha=1;
    // pigment pools at the edges as a wash dries: the edge band (shape minus its blur) laid back on darker
    const e=medTmp3;if(e.width<Wd)e.width=Wd;if(e.height<Hd)e.height=Hd;const ec=e.getContext('2d');ec.setTransform(1,0,0,1,0,0);ec.clearRect(0,0,Wd,Hd);
    ec.drawImage(medTmp2,0,0);ec.globalCompositeOperation='destination-out';ec.filter=`blur(${(px*2.2).toFixed(2)}px)`;ec.drawImage(medTmp2,0,0);ec.filter='none';ec.globalCompositeOperation='source-over';
    t.globalCompositeOperation='multiply';t.globalAlpha=.75;t.drawImage(e,0,0);t.globalAlpha=1;
    // uneven pigment inside, then paper granulation
    t.globalCompositeOperation='source-atop';t.fillStyle=blotchPat;t.fillRect(0,0,Wd,Hd);t.fillStyle=granPat;t.fillRect(0,0,Wd,Hd);t.globalCompositeOperation='source-over';}
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(medTmp,0,0,Wd,Hd,L,T,Wd,Hd);g.restore();
}

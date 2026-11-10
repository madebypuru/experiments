// Paint motion base: smoke. A chimney (or fire, or steam) gives off soft puffs that rise, slow, spread
// and fade, leaning downwind more the higher they go. See ../MOTION.md.
//
// A scene says where with a smoke sprite: its path starts at the chimney and points the way the smoke rises;
// the path's length is how high it goes, its duration how long a puff takes to get there, the drawing's width
// the puff's starting size and its colour the smoke's. Several smoke sprites from one chimney become one emitter.
// smoke reads against a pale sky only as a soft blue-grey wash: cap its lightness, keep its hue
function smokeTone(c){const l=.2126*c[0]+.7152*c[1]+.0722*c[2];return l>.6?c.map(v=>v*.6/l):c;}
function makeSmoke(sp,box){
  const P=sp.pts,a=P[0],b=P[P.length-1],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
  const m=sp.markup.match(/fill="(#[0-9a-fA-F]{6})"/);
  return {x0:a[0],y0:a[1],dir:[(b[0]-a[0])/L,(b[1]-a[1])/L],height:L,life:Math.max(3,sp.dur),r0:Math.max(3,Math.max(box.width,box.height)*.7),
    col:smokeTone(hexRGB(m?m[1]:'#8f8a98')||[.56,.54,.6]),grow:Math.max(2.6,sp.scaleEnd||3),puffs:[],next:0,delay:sp.delay||0};
}
function smokeFrame(fg,sp,dt,sx,sy){
  const S=sp.smoke,I=IM,sc=I.scene,r=I.rect;
  if(spriteClock<S.delay)return 0;
  // each puff gets a fixed id, so choices made per puff don't shift as old ones go
  S.next-=dt;if(S.next<=0){S.next=.2+Math.random()*.15;S.puffs.push({age:0,seed:Math.random()*6.28,k:S.count=(S.count||0)+1});}
  const [cr,cg,cb]=S.col.map(v=>Math.round(v*255));let drawn=0;
  for(let i=S.puffs.length-1;i>=0;i--){const p=S.puffs[i];p.age+=dt;const u=p.age/S.life;if(u>=1){S.puffs.splice(i,1);continue;}
    // rises quickly at first, then slows as it cools; drifts downwind more and more; wobbles a little
    const rise=S.height*(1-Math.pow(1-u,1.6)),lean=WORLD.wind*S.height*.45*Math.pow(u,1.4),wob=Math.sin(p.age*1.4+p.seed)*S.r0*.7*u;
    const x=S.x0+S.dir[0]*rise+lean+wob,y=S.y0+S.dir[1]*rise,rad=S.r0*(1+(S.grow-1)*Math.pow(u,.8));
    const gx=Math.round(clamp((x-sc.view.x)/sc.view.w,0,1)*(I.gw-1)),gy=Math.round(clamp((y-sc.view.y)/sc.view.h,0,1)*(I.gh-1)),inPaint=smooth(.15,.6,I.Fu[gy*I.gw+gx]);
    const a=Math.min(1,p.age/.5)*Math.pow(1-u,1.3)*.3*inPaint;if(a<.01)continue;
    const X=r.x+(x-sc.view.x)*sx,Y=r.y+(y-sc.view.y)*sy,R=rad*sx;
    const md=medium();
    if(md==='gouache'){ // flat opaque dabs of grey paint, no airbrushed fade
      if(!p.look)p.look=strokeLook(seeded(Math.round(p.seed*1000)),3);if(p.k%2)continue; // fewer, bolder marks
      const ang=p.seed+u*.8,dx=Math.cos(ang)*R*.55,dy=Math.sin(ang)*R*.25;
      brushStroke(fg,[[X-dx,Y-dy],[X,Y-R*.08],[X+dx,Y+dy]],R*.75,S.col.map(v=>v*(1+.08*Math.sin(p.seed))),p.look,Math.min(.9,a*2.6));drawn++;continue;}
    if(md==='ink'&&(p.k%3===0)){fg.save();fg.globalAlpha=Math.min(1,a*2.2);const pts=[];for(let k=0;k<=8;k++){const th=Math.PI*(1.1+.8*k/8);pts.push([X+Math.cos(th)*R*.75,Y+Math.sin(th)*R*.75]);}penPath(fg,pts,Math.max(.8,R*.05),p.seed);fg.restore();}
    const gr=fg.createRadialGradient(X,Y,0,X,Y,R);gr.addColorStop(0,`rgba(${cr},${cg},${cb},${a.toFixed(3)})`);gr.addColorStop(.6,`rgba(${cr},${cg},${cb},${(a*.5).toFixed(3)})`);gr.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
    fg.fillStyle=gr;fg.beginPath();fg.arc(X,Y,R,0,7);fg.fill();drawn++;}
  return drawn;
}

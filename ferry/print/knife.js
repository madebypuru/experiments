// The palette-knife edge for paintings on paper, shared by print pieces. Same model as paintOn/knifeMask in
// swiss.html (study/SWISS_GRID.md, principle 7): the painting stops at its field line with a knife edge.
//  1. the edge wanders a few px either side of the line (three slow swells and a fine tooth), never far;
//  2. now and then a knife tongue: paint pushed a little past the line, tapering into a dry smear;
//  3. a dry band just inside, where the paint ran thin and paper shows through;
//  4. a faint ridge from the mask's own relief, lit from the top left.
// Keep it quiet: big overshoots read fake. `u` scales every distance (1 = the 1080 px social page).
window.FerryKnife=(()=>{
  function rng(seed){let a=(seed*7919+13)%2147483647;return()=>{a=(a*48271)%2147483647;return a/2147483647;};}
  // r: the field, er: the mask's box (the field plus room for tongues), both in unit space (page px / u)
  function mask(r,er,seed,u=1){const k=2, R=rng(seed), cv=document.createElement('canvas');cv.width=Math.ceil(er.w*k*u);cv.height=Math.ceil(er.h*k*u);
    const g=cv.getContext('2d'), ox=r.x-er.x, oy=r.y-er.y, K=k*u;
    g.scale(K,K);g.fillStyle=g.strokeStyle='#fff';
    const ph=[R()*6.28,R()*6.28,R()*6.28], per=2*(r.w+r.h), n=t=>3.2*Math.sin(t/97+ph[0])+2.2*Math.sin(t/41+ph[1])+1.2*Math.sin(t/17+ph[2])+(R()-.5)*1.6;
    const at=t=>{if(t<r.w)return[[ox+t,oy],[0,-1]];t-=r.w;if(t<r.h)return[[ox+r.w,oy+t],[1,0]];t-=r.h;if(t<r.w)return[[ox+r.w-t,oy+r.h],[0,1]];t-=r.w;return[[ox,oy+r.h-t],[-1,0]];};
    g.beginPath();for(let t=0;t<per;t+=2.5){const [[x,y],[nx,ny]]=at(t),o=n(t)-1.5;t?g.lineTo(x+nx*o,y+ny*o):g.moveTo(x+nx*o,y+ny*o);}g.closePath();g.fill();
    const sides=[[[1,0],[0,-1],[ox,oy],r.w],[[0,1],[1,0],[ox+r.w,oy],r.h],[[-1,0],[0,1],[ox+r.w,oy+r.h],r.w],[[0,-1],[-1,0],[ox,oy+r.h],r.h]];
    for(const [U,V,O,len] of sides){let s=20+R()*120;
      while(s<len-60){const L=Math.min(40+R()*90,len-20-s), P=3+R()*6;
        g.save();g.setTransform(K*U[0],K*U[1],K*V[0],K*V[1],K*O[0],K*O[1]);
        for(let v=-10;v<P;v+=.9){const q=Math.max(0,v/P); if(q>.35&&R()<q*.9)continue;
          const ll=L*(1-q)**1.3*(.55+R()*.45), s0=s+R()*L*.35*q;
          g.globalAlpha=q>.5?.25+R()*.4:.7+R()*.3;g.lineWidth=.8+R()*.9;
          g.beginPath();g.moveTo(s0,v);g.lineTo(s0+ll,v+(R()-.5)*.8);g.stroke();}
        g.restore();s+=L+60+R()*220;}}
    g.globalCompositeOperation='destination-out';
    for(const [U,V,O,len] of sides){g.save();g.setTransform(K*U[0],K*U[1],K*V[0],K*V[1],K*O[0],K*O[1]);
      for(let i=0;i<len/16;i++){const s=R()*len, v=-2-R()*8, L=6+R()*30;g.globalAlpha=.1+R()*.3;g.lineWidth=.8+R()*1.2;
        g.beginPath();g.moveTo(s,v);g.lineTo(s+L,v+(R()-.5));g.stroke();}
      g.restore();}
    return cv.toDataURL();}
  let pid=0;
  // A painting laid into field r (page px), cover-fitted. inner: extra SVG drawn over the painting inside the mask
  // (paper grain, say); filter: an SVG filter id for the image itself. Returns an SVG string.
  function paintOn(href,iw,ih,r,{fx=.5,fy=.5,seed=1,u=1,inner='',filter='',ridge=.6}={}){const id='kn'+(pid++);
    const ex=24*u, er={x:r.x-ex,y:r.y-ex,w:r.w+2*ex,h:r.h+2*ex}, sc=Math.max(er.w/iw,er.h/ih), dw=iw*sc, dh=ih*sc;
    const d=v=>v/u, mk=mask({x:d(r.x),y:d(r.y),w:d(r.w),h:d(r.h)},{x:d(er.x),y:d(er.y),w:d(er.w),h:d(er.h)},seed,u);
    const mi=`href="${mk}" x="${er.x}" y="${er.y}" width="${er.w}" height="${er.h}" preserveAspectRatio="none"`;
    return `<defs><filter id="${id}r" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
       <feGaussianBlur in="SourceAlpha" stdDeviation="${1.2*u}" result="b"/>
       <feDiffuseLighting in="b" surfaceScale="2.5" diffuseConstant="1.1" lighting-color="#fff" result="l"><feDistantLight azimuth="225" elevation="55"/></feDiffuseLighting>
       <feComposite in="l" in2="SourceAlpha" operator="in"/></filter>
     <mask id="${id}" maskUnits="userSpaceOnUse" x="${er.x}" y="${er.y}" width="${er.w}" height="${er.h}"><image ${mi}/></mask></defs>
    <g mask="url(#${id})"><image href="${href}" x="${er.x+(er.w-dw)*fx}" y="${er.y+(er.h-dh)*fy}" width="${dw}" height="${dh}" preserveAspectRatio="none" ${filter?`filter="url(#${filter})"`:''}/>${inner}</g>
    ${ridge?`<image ${mi} filter="url(#${id}r)" style="mix-blend-mode:soft-light" opacity="${ridge}"/>`:''}`;}
  return {mask,paintOn};
})();

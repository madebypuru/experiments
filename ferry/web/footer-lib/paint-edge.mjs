// Drives Paint (paint/index.html, gouache style) on the dock's own source photo, through the engine's real code path:
// gcPlan -> for each layer spec: gcBuildLayer(spec) -> gcStroke(stroke). The only thing added is the painter's choice of
// where to stop: near the top, a stroke is laid with a probability that falls off above a wandering stop line, and the
// finer brushes stop lower than the big ones (blocking-in reaches furthest, detail stays inside). Unpainted = transparent.
// usage: node paint.mjs out.png seed detail
import { chromium } from 'playwright'; import fs from 'fs';
const [out,seed='7',detail='1']=process.argv.slice(2);
const b=await chromium.launch({channel:'chrome'});
const p=await b.newPage({viewport:{width:1400,height:900},deviceScaleFactor:2});
p.on('console',m=>{if(m.type()==='error')console.log('console:',m.text())});
await p.goto(`http://localhost:4340/paint/index.html?img=../assets/rowboats/clean.jpg&style=gc&detail=${detail}`);
await p.waitForFunction(()=>typeof IM!=='undefined'&&IM&&state==='setup',null,{timeout:60000});
const res=await p.evaluate(({seed})=>{
  let a=(+seed*7919+13)%2147483647;const R=()=>(a=(a*48271)%2147483647)/2147483647;
  gcPlan();                                   // gcClear + gcPrepare (designs the photo, plans the layers) + grain
  const PW=1836,PH=1032,dpr=gcCv.width/W,r=G.rect;
  // the stop line, plate px: a smoothed random walk (long lazy runs) plus a little fine wander; mean ~150 from the top
  const n=Math.ceil(PW/4)+2,walk=new Float32Array(n);let v=0,dv=0;
  for(let i=0;i<n;i++){dv=dv*.97+(R()-.5)*1.1;v=v*.995+dv;walk[i]=v;}
  let mx=0;for(const q of walk)mx=Math.max(mx,Math.abs(q));
  const fine=new Float32Array(n);for(let i=0;i<n;i++)fine[i]=(R()-.5);
  for(let it=0;it<3;it++)for(let i=1;i<n-1;i++)fine[i]=(fine[i-1]+fine[i]+fine[i+1])/3;
  const C=x=>{const i=Math.max(0,Math.min(n-1,Math.round(x/4)));return 118+55*walk[i]/(mx||1)+40*fine[i];};
  const OFF={'-1':52,0:36,1:-4,2:34,3:50,4:62,5:72},SPAN=k=>k<=0?90:k===1?170:80;   // the big brushes block in short of the edge; the middle brushes lay it
  const smooth=(e0,e1,x)=>{const t=Math.max(0,Math.min(1,(x-e0)/(e1-e0)));return t*t*(3-2*t);};
  gcx.setTransform(dpr,0,0,dpr,0,0);gcx.save();gcx.beginPath();gcx.rect(r.x,r.y,r.w,r.h);gcx.clip();   // as gcFrame: clean edges at the sides and bottom
  const log=[];
  for(const spec of G.specs){
    const L=gcBuildLayer(spec),k=spec.type?99:spec.k,off=spec.type?95:(OFF[k]??84),sp=spec.type?60:SPAN(k);
    let kept=0;
    for(const s of L.strokes){
      let sx=0,sy=1e9;for(const [x,y] of s.pts){sx+=x;sy=Math.min(sy,y);}sx/=s.pts.length;sy-=s.r*.85;   // judged by the top of the mark it would make
      const xp=sx/G.w*PW,yp=sy/G.h*PH,line=C(xp)+off;
      const pk=smooth(line-sp/2,line+sp/2,yp+(R()-.5)*sp*.5);
      if(yp>28&&R()<pk){   // nothing runs off the top of the plate, so no straight cut there
        G.lastTip=gcStroke(s);kept++;}
    }
    L.drawn=L.strokes.length;G.layers.push(L);log.push(`${spec.label}: ${kept}/${L.strokes.length} r=${spec.r.toFixed(1)}`);
  }
  gcx.restore();
  // out: the painted rect at full resolution with Paint's own grain multiplied into the paint only (gcCompose, minus the paper)
  const o=document.createElement('canvas');o.width=PW;o.height=PH;const g=o.getContext('2d');
  g.drawImage(gcCv,r.x*dpr,r.y*dpr,r.w*dpr,r.h*dpr,0,0,PW,PH);
  g.globalCompositeOperation='multiply';g.drawImage(document.getElementById('gcGrain'),0,0,PW,PH);
  g.globalCompositeOperation='destination-in';g.drawImage(gcCv,r.x*dpr,r.y*dpr,r.w*dpr,r.h*dpr,0,0,PW,PH);
  return {url:o.toDataURL('image/png'),log,rect:r,dpr,G:[G.w,G.h],focus:IM.focus,detail:DETAIL};
},{seed});
fs.writeFileSync(out,Buffer.from(res.url.split(',')[1],'base64'));
console.log(JSON.stringify({rect:res.rect,dpr:res.dpr,G:res.G,focus:res.focus,detail:res.detail}));console.log(res.log.join('\n'));
await b.close();

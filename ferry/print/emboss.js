// Ferry blind emboss / deboss, simulated in the browser. Same model as tools/emboss.py:
// the mark is a height map pressed out of (emboss) or into (deboss) the card, with rounded shoulders
// from the signed distance to its edge; one directional light shades it through the surface normals,
// and cast shadows are found by marching toward the light. Nothing is painted on.
// It returns two layers at 300 dpi to lay over the card: `mul` (shade, mix-blend-mode: multiply)
// and `scr` (light, mix-blend-mode: screen). The card's own paper grain shows through both.
window.FerryEmboss=(()=>{
  // defaults tuned by hand in emboss-tuner.html (Nov 12, 2026)
  const defaults={
    mode:'emboss',  // emboss (raised) or deboss (pressed in)
    mm:9.5,          // printed width of the mark
    rotate:-0.4,     // degrees anticlockwise: a hand-fed press is never quite square
    az:135,        // light direction, degrees: 135 = from the top left
    el:32,          // light height above the paper, degrees: low is raking, high is soft
    depth:.08,      // mm the paper is pushed
    shoulder:.4,    // mm over which the paper rolls from flat to the top of the press
    dome:.37,       // how pillowy the top of an emboss is
    ambient:.36,     // fill light: more = everything flatter
    shadow:.68,       // strength of the shade layer
    highlight:.32,    // strength of the light layer
    hlSoft:6.4,       // blur on the highlights, px at simulation scale
    shadowSoft:.8,   // blur on the shade, px at simulation scale
    floorLift:.048,  // deboss only: the crushed floor reads slightly lighter
    paper:.94,       // card brightness, for the screen layer
  };
  const ss=(e0,e1,x)=>{let t=(x-e0)/(e1-e0);t=t<0?0:t>1?1:t;return t*t*(3-2*t);};
  // exact Euclidean distance transform (Felzenszwalb and Huttenlocher)
  function edt(inside,W,H){
    const INF=1e20,f=new Float64Array(Math.max(W,H)),d=new Float64Array(Math.max(W,H)),v=new Int32Array(Math.max(W,H)),z=new Float64Array(Math.max(W,H)+1);
    const g=new Float64Array(W*H);for(let i=0;i<W*H;i++)g[i]=inside[i]?INF:0;
    const pass=(n,get,set)=>{for(let q=0;q<n;q++)f[q]=get(q);let k=0;v[0]=0;z[0]=-INF;z[1]=INF;
      for(let q=1;q<n;q++){let s;do{const r=v[k];s=((f[q]+q*q)-(f[r]+r*r))/(2*q-2*r);if(s<=z[k])k--;else break;}while(k>=0);k++;v[k]=q;z[k]=s;z[k+1]=INF;}
      k=0;for(let q=0;q<n;q++){while(z[k+1]<q)k++;const r=v[k];d[q]=(q-r)*(q-r)+f[r];}for(let q=0;q<n;q++)set(q,d[q]);};
    for(let x=0;x<W;x++)pass(H,y=>g[y*W+x],(y,val)=>g[y*W+x]=val);
    for(let y=0;y<H;y++)pass(W,x=>g[y*W+x],(x,val)=>g[y*W+x]=val);
    for(let i=0;i<W*H;i++)g[i]=Math.sqrt(g[i]);return g;
  }
  function blur(a,W,H,sig){
    if(sig<.3)return a;const r=Math.ceil(sig*3),k=new Float32Array(2*r+1);let s=0;
    for(let i=-r;i<=r;i++){k[i+r]=Math.exp(-i*i/(2*sig*sig));s+=k[i+r];}for(let i=0;i<k.length;i++)k[i]/=s;
    const t=new Float32Array(W*H),o=new Float32Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=0;for(let i=-r;i<=r;i++){const xx=x+i<0?0:x+i>=W?W-1:x+i;v+=a[y*W+xx]*k[i+r];}t[y*W+x]=v;}
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let v=0;for(let i=-r;i<=r;i++){const yy=y+i<0?0:y+i>=H?H-1:y+i;v+=t[yy*W+x]*k[i+r];}o[y*W+x]=v;}
    return o;
  }
  const masks={};
  function loadMask(url){return masks[url]||(masks[url]=new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;}));}
  // the mask is the mark black on white, 1000 px wide inside a 1240 px frame
  async function render(maskUrl,opts={},simW=620){
    const p={...defaults,...opts},img=await loadMask(maskUrl);
    const sc=simW/img.width,W=simW,H=Math.round(img.height*sc);
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const cx=cv.getContext('2d');
    cx.fillStyle='#fff';cx.fillRect(0,0,W,H);cx.translate(W/2,H/2);cx.rotate(-p.rotate*Math.PI/180);cx.drawImage(img,-W/2,-H/2,W,H);
    const px=cx.getImageData(0,0,W,H).data,inside=new Uint8Array(W*H);for(let i=0;i<W*H;i++)inside[i]=px[i*4]<128?1:0;
    const pxmm=1000*sc/p.mm,w=p.shoulder;
    const din=edt(inside,W,H),dout=edt(inside.map(v=>1-v),W,H);
    let rel=new Float32Array(W*H),tt=new Float32Array(W*H);
    for(let i=0;i<W*H;i++){const sd=(din[i]-dout[i])/pxmm;
      if(p.mode==='emboss'){const t=ss(-.4*w,.7*w,sd);tt[i]=t;rel[i]=p.depth*(t+p.dome*(1-Math.exp(-Math.max(sd,0)/(2.5*w))));}
      else{const t=ss(-.15*w,.55*w,sd);tt[i]=t;rel[i]=-p.depth*t+.05*p.depth*Math.exp(-(((sd+.55*w)/(.45*w))**2));}}
    rel=blur(rel,W,H,.06*pxmm);
    const az=p.az*Math.PI/180,el=p.el*Math.PI/180,L=[Math.cos(az)*Math.cos(el),-Math.sin(az)*Math.cos(el),Math.sin(el)];
    const ul=Math.hypot(L[0],L[1]),ux=L[0]/ul,uy=L[1]/ul,tanE=Math.tan(el);
    const at=(x,y)=>{x=x<0?0:x>W-1?W-1:x;y=y<0?0:y>H-1?H-1:y;const x0=x|0,y0=y|0,x1=Math.min(x0+1,W-1),y1=Math.min(y0+1,H-1),fx=x-x0,fy=y-y0;
      return (rel[y0*W+x0]*(1-fx)+rel[y0*W+x1]*fx)*(1-fy)+(rel[y1*W+x0]*(1-fx)+rel[y1*W+x1]*fx)*fy;};
    let sh=new Float32Array(W*H);const steps=Math.ceil(1.2*w*pxmm)+2;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const h=rel[y*W+x];let s=0;
      for(let k=1;k<steps;k+=2){const v=(at(x+ux*k,y+uy*k)-(h+k/pxmm*tanE))*pxmm*4;if(v>s)s=v;if(s>=1){s=1;break;}}sh[y*W+x]=s;}
    sh=blur(sh,W,H,.05*pxmm);
    const amb=p.ambient,flat=amb+(1-amb)*L[2],b=p.paper;
    let mul=new Float32Array(W*H),scr=new Float32Array(W*H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;
      const gx=(rel[y*W+Math.min(x+1,W-1)]-rel[y*W+Math.max(x-1,0)])/2*pxmm,gy=(rel[Math.min(y+1,H-1)*W+x]-rel[Math.max(y-1,0)*W+x])/2*pxmm;
      const n=1/Math.hypot(gx,gy,1),nd=(-gx*L[0]-gy*L[1]+L[2])*n;
      let R=(amb+(1-amb)*Math.max(nd,0)*(1-.6*sh[i]))/flat;if(p.mode!=='emboss')R*=1+p.floorLift*tt[i];
      const dd=R-1;mul[i]=1+Math.min(dd,0)*p.shadow;scr[i]=Math.max(0,Math.min(1,b*Math.max(dd,0)*p.highlight/(1-b)));}
    mul=blur(mul,W,H,p.shadowSoft);scr=blur(scr,W,H,p.hlSoft);
    // to 300 dpi
    const ow=Math.round(img.width/1000*p.mm*300/25.4),oh=Math.round(img.height/1000*p.mm*300/25.4);
    const toCanvas=(arr,inv)=>{const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),d=g.createImageData(W,H);
      for(let i=0;i<W*H;i++){const v=Math.max(0,Math.min(255,Math.round(arr[i]*255)));d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=v;d.data[i*4+3]=255;}
      g.putImageData(d,0,0);const o=document.createElement('canvas');o.width=ow;o.height=oh;const og=o.getContext('2d');og.imageSmoothingQuality='high';og.drawImage(c,0,0,ow,oh);return o;};
    return {mul:toCanvas(mul),scr:toCanvas(scr),w:ow,h:oh,params:p};
  }
  // settings: built-in defaults, then what the tuner saved on this machine, then the page URL (?emb={...})
  function settings(){let s={};try{s=JSON.parse(localStorage.getItem('ferry.emboss')||'{}');}catch(e){}
    try{const q=new URLSearchParams(location.search).get('emb');if(q)s={...s,...JSON.parse(q)};}catch(e){}return {...defaults,...s};}
  return {defaults,render,settings};
})();

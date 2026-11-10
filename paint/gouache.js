// Gouache: opaque paint laid in brush strokes, big to small.
//
// The method is Hertzmann's "Painterly rendering with curved brush strokes of multiple sizes" (1998):
// each layer uses a smaller brush, and only paints where the canvas still differs from the reference.
// Strokes follow the edges of the picture (the structure tensor's tangent), stop where the colour
// changes (so planes stay flat and edges stay crisp), and are laid dark to light inside a layer, so
// light marks land on top, as they do in gouache.
//
// Before any paint goes down the photo is "designed": flattened into planes (Kuwahara filter), light
// pushed warm and shadow cool, and everything away from the focus quietened. Nothing is generated:
// every mark is a stroke whose colour is read from the photo.
const gcCv=document.getElementById('gc'),gcx=gcCv.getContext('2d');
let G=null; // the gouache plan for the current painting

function gcClear(){gcx.setTransform(1,0,0,1,0,0);gcx.clearRect(0,0,gcCv.width,gcCv.height);if(G){G.layers=[];G.anim=null;}gcFxReset();}

function fromLab(L,a,b){
  const fy=(L+16)/116,fx=fy+a/500,fz=fy-b/200,inv=t=>t>.2069?t*t*t:(t-16/116)/7.787;
  const X=.95047*inv(fx),Y=inv(fy),Z=1.08883*inv(fz);
  const R=3.2406*X-1.5372*Y-.4986*Z,Gc=-.9689*X+1.8758*Y+.0415*Z,B=.0557*X-.204*Y+1.057*Z;
  const g=c=>clamp(c<=.0031308?12.92*c:1.055*Math.pow(Math.max(c,0),1/2.4)-.055,0,1);
  return [g(R),g(Gc),g(B)];
}

// Kuwahara: each pixel takes the mean of whichever of its four neighbouring squares is calmest.
// Flat areas get flatter, edges stay sharp: the look of colour laid in planes.
function kuwahara(R,Gr,B,w,h,r){
  const W1=w+1,n1=W1*(h+1),sR=new Float64Array(n1),sG=new Float64Array(n1),sB=new Float64Array(n1),sL=new Float64Array(n1),sL2=new Float64Array(n1);
  for(let y=0;y<h;y++){let aR=0,aG=0,aB=0,aL=0,aL2=0;
    for(let x=0;x<w;x++){const i=y*w+x,l=.3*R[i]+.59*Gr[i]+.11*B[i];aR+=R[i];aG+=Gr[i];aB+=B[i];aL+=l;aL2+=l*l;
      const j=(y+1)*W1+x+1,u=y*W1+x+1;sR[j]=sR[u]+aR;sG[j]=sG[u]+aG;sB[j]=sB[u]+aB;sL[j]=sL[u]+aL;sL2[j]=sL2[u]+aL2;}}
  const box=(S,x0,y0,x1,y1)=>S[y1*W1+x1]-S[y0*W1+x1]-S[y1*W1+x0]+S[y0*W1+x0];
  const oR=new Float32Array(w*h),oG=new Float32Array(w*h),oB=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){let best=Infinity,bi=0;const q=[[x-r,y-r],[x,y-r],[x-r,y],[x,y]];
    let mR=0,mG=0,mB=0;
    for(const [qx,qy] of q){const x0=clamp(qx,0,w),y0=clamp(qy,0,h),x1=clamp(qx+r+1,0,w),y1=clamp(qy+r+1,0,h),c=(x1-x0)*(y1-y0);if(c<=0)continue;
      const m=box(sL,x0,y0,x1,y1)/c,v=box(sL2,x0,y0,x1,y1)/c-m*m;
      if(v<best){best=v;mR=box(sR,x0,y0,x1,y1)/c;mG=box(sG,x0,y0,x1,y1)/c;mB=box(sB,x0,y0,x1,y1)/c;}}
    const i=y*w+x;oR[i]=mR;oG[i]=mG;oB[i]=mB;}
  return [oR,oG,oB];
}

function gcPrepare(){
  const I=IM,rect=I.rect,long=LV(640,820,1000),ar=rect.w/rect.h;
  const w=Math.round(ar>=1?long:long*ar),h=Math.round(ar>=1?long/ar:long),n=w*h;
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});
  g.imageSmoothingQuality='high';g.drawImage(I.img,0,0,w,h);const px=g.getImageData(0,0,w,h).data;
  let R=new Float32Array(n),Gr=new Float32Array(n),B=new Float32Array(n);
  for(let i=0;i<n;i++){R[i]=px[i*4]/255;Gr[i]=px[i*4+1]/255;B[i]=px[i*4+2]/255;}
  // 1. planes
  const kr=Math.max(2,Math.round(long*LV(.0042,.003,.0024)));
  [R,Gr,B]=kuwahara(R,Gr,B,w,h,kr);[R,Gr,B]=kuwahara(R,Gr,B,w,h,Math.max(2,kr-1));
  // where the eye goes: near the focus, and where the picture is busy
  const fx=I.focus.x,fy=I.focus.y,Lum=new Float32Array(n);
  for(let i=0;i<n;i++)Lum[i]=.3*R[i]+.59*Gr[i]+.11*B[i];
  const Ls=boxBlur(Lum,w,h,1.2),gx=new Float32Array(n),gy=new Float32Array(n),Em=new Float32Array(n);
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;
    gx[i]=(Ls[i-w+1]+2*Ls[i+1]+Ls[i+w+1])-(Ls[i-w-1]+2*Ls[i-1]+Ls[i+w-1]);
    gy[i]=(Ls[i+w-1]+2*Ls[i+w]+Ls[i+w+1])-(Ls[i-w-1]+2*Ls[i-w]+Ls[i-w+1]);Em[i]=Math.hypot(gx[i],gy[i]);}
  const busy=norm(boxBlur(Em,w,h,long*.02)),imp=new Float32Array(n);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,d=((x/w-fx)/.4)**2+((y/h-fy)/.4)**2;
    imp[i]=clamp(Math.exp(-d)*(.6+.8*busy[i])+.12*busy[i],0,1);}
  // 2. light design: light warmer, shadow cooler and a little violet, more colour, calmer away from the focus
  const Lbig=boxBlur(Lum,w,h,long*.012),mid=quantile(Lbig,.5);
  // value massing: inside the light and inside the shadow, values are pulled together, so the picture reads as a few big shapes
  let sl=0,nl=0,ss=0,ns=0;for(let i=0;i<n;i+=3){const v=Lum[i]*100;if(Lbig[i]>mid){sl+=v;nl++;}else{ss+=v;ns++;}}
  const mL=nl?sl/nl:70,mS=ns?ss/ns:35,mass=LV(.3,.22,.15);
  for(let i=0;i<n;i++){let [L,a,b]=toLab(R[i],Gr[i],B[i]);const lit=smooth(mid-.12,mid+.12,Lbig[i]),f=imp[i];
    L=lerp(L,lerp(mS,mL,lit),mass*(1-.5*f));
    L=L*lerp(.92,1.05,lit);L=lerp(L,lerp(50,70,lit),(1-f)*.07);
    const ch=lerp(.95,1.25,f);a*=ch;b*=ch;
    a+=lerp(3,1,lit);b+=lerp(-8,6,lit);
    [R[i],Gr[i],B[i]]=fromLab(clamp(L,0,100),a,b);}
  // maps for the finishing passes, read from the designed picture: thin dark lines, and edges between planes
  {const Ld=new Float32Array(n);for(let i=0;i<n;i++)Ld[i]=.3*R[i]+.59*Gr[i]+.11*B[i];
    const Lm=boxBlur(Ld,w,h,Math.max(1.5,long*.0035)),Lq=boxBlur(Ld,w,h,1),dark=new Float32Array(n),edge=new Float32Array(n),ex=new Float32Array(n),ey=new Float32Array(n);
    for(let i=0;i<n;i++)dark[i]=smooth(.04,.14,Lm[i]-Lq[i]);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;
      ex[i]=(Lq[i-w+1]+2*Lq[i+1]+Lq[i+w+1])-(Lq[i-w-1]+2*Lq[i-1]+Lq[i+w-1]);ey[i]=(Lq[i+w-1]+2*Lq[i+w]+Lq[i+w+1])-(Lq[i-w-1]+2*Lq[i-w]+Lq[i-w+1]);}
    const mag=ex.map((v,i)=>Math.hypot(v,ey[i])),q=quantile(mag,.93)||1;
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,m=mag[i];if(!m)continue;const ox=Math.round(ex[i]/m),oy=Math.round(ey[i]/m);
      if(m>=mag[i+ox+oy*w]&&m>=mag[i-ox-oy*w])edge[i]=smooth(.45,1,m/q);}
    // the direction of each thin dark line: the calm axis of the dark map's own structure tensor
    const dgx=new Float32Array(n),dgy=new Float32Array(n);
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;dgx[i]=dark[i+1]-dark[i-1];dgy[i]=dark[i+w]-dark[i-w];}
    const K11=boxBlur(dgx.map(v=>v*v),w,h,2),K12=boxBlur(dgx.map((v,i)=>v*dgy[i]),w,h,2),K22=boxBlur(dgy.map(v=>v*v),w,h,2),rx=new Float32Array(n),ry=new Float32Array(n);
    for(let i=0;i<n;i++){const th=.5*Math.atan2(2*K12[i],K11[i]-K22[i])+Math.PI/2;rx[i]=Math.cos(th);ry[i]=Math.sin(th);}
    const eb=boxBlur(edge,w,h,Math.max(1.5,long*.004)),eq=quantile(eb,.95)||1;
    var gcDark=dark,gcEdge=edge,gcEx=ex,gcEy=ey,gcLd=Ld,gcRx=rx,gcRy=ry,gcEdB=eb.map(v=>clamp(v/eq,0,1));}
  // 3. stroke direction: along the edges (structure tensor), a painter's diagonal where the paper is calm
  const J11=boxBlur(gx.map(v=>v*v),w,h,long*.01),J12=boxBlur(gx.map((v,i)=>v*gy[i]),w,h,long*.01),J22=boxBlur(gy.map(v=>v*v),w,h,long*.01);
  const tx=new Float32Array(n),ty=new Float32Array(n),sd=I.noise;let jmax=0;for(let i=0;i<n;i++)jmax=Math.max(jmax,J11[i]+J22[i]);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,a=J11[i],b2=J12[i],d=J22[i],tr=a+d,df=Math.sqrt((a-d)**2+4*b2*b2);
    const coh=tr>1e-9?df/tr:0,th=.5*Math.atan2(2*b2,a-d)+Math.PI/2;
    const da=-.22+(vn(x/70,y/70,sd+11)-.5)*.9,dx0=Math.cos(da),dy0=Math.sin(da);
    let ex=Math.cos(th),ey=Math.sin(th);if(ex*dx0+ey*dy0<0){ex=-ex;ey=-ey;}
    const k=smooth(.12,.45,coh)*smooth(.002,.03,tr/(jmax||1));
    const vx=lerp(dx0,ex,k),vy=lerp(dy0,ey,k),l=Math.hypot(vx,vy)||1;tx[i]=vx/l;ty[i]=vy/l;}
  // brushes, big to small, in reference pixels
  const sizes=[.034,.019,.0105,.0058,.0036,.0025,.0018].map(s=>Math.max(1.3,s*long)).slice(0,LV(5,6,7));
  const durs=[2.6,3,3.2,3.2,3,2.6,2.4].slice(0,sizes.length);
  const labels=['Blocking in the big shapes','Building the forms','Shaping the planes','Details where it matters','Crisp edges and small things','Last light touches','The finest touches'];
  const uc=document.createElement('canvas'),uw=Math.max(4,Math.round(w/14)),uh=Math.max(4,Math.round(h/14));uc.width=uw;uc.height=uh;
  {const ug=uc.getContext('2d'),id=ug.createImageData(uw,uh),bR=boxBlur(R,w,h,long*.02),bG=boxBlur(Gr,w,h,long*.02),bB=boxBlur(B,w,h,long*.02);
    for(let y=0;y<uh;y++)for(let x=0;x<uw;x++){const i=Math.min(h-1,Math.round((y+.5)*h/uh))*w+Math.min(w-1,Math.round((x+.5)*w/uw)),o=(y*uw+x)*4;
      id.data[o]=bR[i]*255*.92;id.data[o+1]=bG[i]*255*.92;id.data[o+2]=bB[i]*255*.92;id.data[o+3]=255;}
    ug.putImageData(id,0,0);}
  G={w,h,n,rect,R,Gr,B,imp,tx,ty,sizes,durs,labels,layers:[],t0:1.5,lastTip:null,under:uc,underDone:true,dark:gcDark,edge:gcEdge,ex:gcEx,ey:gcEy,Ld:gcLd,rx:gcRx,ry:gcRy,edB:gcEdB};
  let t=G.t0;G.specs=[{k:-1,r:Math.max(4,long*.06),t:.2,dur:1.2,label:'Toning the board'},...sizes.map((r,k)=>{const s={k,r,t,dur:durs[k],label:labels[k]};t+=durs[k]+.15;return s;})];
  const fr=Math.max(1,long*.0016);
  G.specs.push({k:sizes.length,type:'dark',r:fr,t,dur:2.2,label:'Dark accents'});t+=2.35;
  G.specs.push({k:sizes.length+1,type:'edge',r:fr,t,dur:2.6,label:'Cutting in the edges'});t+=2.75;
  G.end=t+.3;
}

// what is on the canvas now, at reference size (alpha 0 = bare paper)
function gcRead(){
  const {w,h,rect}=G,c=G.rc||(G.rc=Object.assign(document.createElement('canvas'),{width:w,height:h})),g=c.getContext('2d',{willReadFrequently:true});
  g.clearRect(0,0,w,h);const dpr=gcCv.width/W;g.imageSmoothingQuality='high';
  g.drawImage(gcCv,rect.x*dpr,rect.y*dpr,rect.w*dpr,rect.h*dpr,0,0,w,h);return g.getImageData(0,0,w,h).data;
}

function gcBuildLayer(spec){
  if(spec.type)return gcFinishLayer(spec);
  const {w,h,n,imp,tx,ty}=G,r=spec.r,k=spec.k;
  const br=r*.33,ref=[G.R,G.Gr,G.B].map(c=>br>=1?boxBlur(c,w,h,br):c);
  const cur=gcRead(),err=new Float32Array(n);
  for(let i=0;i<n;i++){const a=cur[i*4+3];
    err[i]=k<=0||a<128?400:Math.hypot(cur[i*4]-ref[0][i]*255,cur[i*4+1]-ref[1][i]*255,cur[i*4+2]-ref[2][i]*255);}
  const T0=LV(26,20,15),grid=Math.max(1,Math.round(r*.9)),strokes=[],sd=IM.noise+k*31;
  const at=(x,y)=>{const i=clamp(Math.round(y),0,h-1)*w+clamp(Math.round(x),0,w-1);return i;};
  for(let gy=0;gy<h;gy+=grid)for(let gx=0;gx<w;gx+=grid){
    let sum=0,cnt=0,best=-1,bv=-1;
    for(let y=gy;y<Math.min(h,gy+grid);y++)for(let x=gx;x<Math.min(w,gx+grid);x++){const i=y*w+x;sum+=err[i];cnt++;if(err[i]>bv){bv=err[i];best=i;}}
    const ci=at(gx+grid/2,gy+grid/2),T=T0/Math.pow(Math.max(.02,imp[ci]),Math.max(0,k)*.32)*(k>=2?lerp(1,.4,G.edB[ci]):1);
    if(sum/cnt<T)continue;
    const x0=best%w,y0=(best-x0)/w,col=[ref[0][best],ref[1][best],ref[2][best]];
    // the stroke grows both ways from where it starts, along the edges, until the colour changes
    const maxLen=k<0?10:k<2?14:k<4?9:6,i0=at(x0,y0);
    const trace=sgn=>{const out=[];let x=x0,y=y0,ldx=tx[i0]*sgn,ldy=ty[i0]*sgn;
      for(let s=1;s<=maxLen/2;s++){let dx=tx[at(x,y)],dy=ty[at(x,y)];if(ldx*dx+ldy*dy<0){dx=-dx;dy=-dy;}
        dx=.65*dx+.35*ldx;dy=.65*dy+.35*ldy;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
        const nx=x+dx*r*.8,ny=y+dy*r*.8;if(nx<-r||ny<-r||nx>w+r||ny>h+r)break;
        const i=at(nx,ny),dRef=Math.hypot(ref[0][i]-col[0],ref[1][i]-col[1],ref[2][i]-col[2])*255;
        if(dRef>30||(s>1&&k>0&&dRef>err[i]))break;
        x=nx;y=ny;ldx=dx;ldy=dy;out.push([x,y]);}
      return out;};
    const fwd=trace(1),back=trace(-1);let pts=[...back.reverse(),[x0,y0],...fwd];
    if(pts.length<3){pts=[[x0-tx[i0]*r*.55,y0-ty[i0]*r*.55],[x0,y0],[x0+tx[i0]*r*.55,y0+ty[i0]*r*.55]];}
    const L=.3*col[0]+.59*col[1]+.11*col[2];
    strokes.push({pts,r:k>=2?r*lerp(1,.72,G.edB[i0]):r,col,L,key:L+rnd(-.12,.12)});
  }
  // dark to light, so light marks land on top
  strokes.sort((a,b)=>a.key-b.key);
  return {spec,strokes,drawn:0};
}

// Finishing passes: thin strokes that run along dark lines (beams, frames, outlines) or along the
// edges between planes, where they cut the lighter plane cleanly into the darker one.
function gcFinishLayer(spec){
  const {w,h,imp,tx,ty,R,Gr,B,Ld}=G,r=spec.r,dark=spec.type==='dark',M=dark?G.dark:G.edge,strokes=[];
  const at=(x,y)=>clamp(Math.round(y),0,h-1)*w+clamp(Math.round(x),0,w-1),grid=Math.max(2,Math.round(r*2.4)),need=LV(.42,.34,.27),used=new Uint8Array(w*h);
  for(let gy=0;gy<h;gy+=grid)for(let gx=0;gx<w;gx+=grid){let best=-1,bv=0;
    for(let y=gy;y<Math.min(h,gy+grid);y++)for(let x=gx;x<Math.min(w,gx+grid);x++){const i=y*w+x,v=M[i]*(.35+.65*imp[i]);if(v>bv){bv=v;best=i;}}
    if(best<0||bv<need)continue;
    const x0=best%w,y0=(best-x0)/w;
    // along the line: for an edge, perpendicular to its gradient; for a dark line, the local stroke direction
    let ux,uy;if(dark){ux=G.rx[best];uy=G.ry[best];}else{const gx2=G.ex[best],gy2=G.ey[best],l=Math.hypot(gx2,gy2)||1;ux=-gy2/l;uy=gx2/l;}
    const trace=sgn=>{const out=[];let x=x0,y=y0,dx=ux*sgn,dy=uy*sgn;
      for(let s=0;s<14;s++){let nx=x+dx*r*1.2,ny=y+dy*r*1.2;
        // snap back onto the line: the strongest of a step to either side
        {let bm=-1,bx=nx,by=ny;for(const o of [-1,0,1]){const qx=nx-dy*o,qy=ny+dx*o,m=M[at(qx,qy)];if(m>bm){bm=m;bx=qx;by=qy;}}nx=lerp(nx,bx,.7);ny=lerp(ny,by,.7);}
        const i=at(nx,ny);if(M[i]<.08||nx<0||ny<0||nx>=w||ny>=h)break;
        let vx,vy;if(dark){vx=G.rx[i];vy=G.ry[i];}else{const l=Math.hypot(G.ex[i],G.ey[i])||1;vx=-G.ey[i]/l;vy=G.ex[i]/l;}
        if(vx*dx+vy*dy<0){vx=-vx;vy=-vy;}dx=.6*vx+.4*dx;dy=.6*vy+.4*dy;const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;x=nx;y=ny;out.push([x,y]);}
      return out;};
    let pts=[...trace(-1).reverse(),[x0,y0],...trace(1)];if(pts.length<(dark?3:6))continue;
    if(!dark){ // only steady edges: a wiggly one is texture, not an edge to cut in
      let turn=0;for(let j=1;j<pts.length-1;j++){const a=pts[j-1],b=pts[j],c=pts[j+1];turn+=Math.abs((Math.atan2(c[1]-b[1],c[0]-b[0])-Math.atan2(b[1]-a[1],b[0]-a[0])+Math.PI*3)%(Math.PI*2)-Math.PI);}
      if(turn/(pts.length-2)>.3)continue;}
    if(pts.some(([x,y])=>used[at(x,y)]))if(pts.filter(([x,y])=>used[at(x,y)]).length>pts.length*.5)continue;
    for(const [x,y] of pts)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)used[at(x+dx*r,y+dy*r)]=1;
    let col;
    if(dark){col=[R[best]*.8,Gr[best]*.8,B[best]*.82];}
    else{ // the lighter side's colour, laid just on the edge
      const nx=-uy,ny=ux,a=at(x0+nx*2.2,y0+ny*2.2),b=at(x0-nx*2.2,y0-ny*2.2),lit=Ld[a]>=Ld[b]?a:b,sg=lit===a?1:-1;
      col=[R[lit],Gr[lit],B[lit]];pts=pts.map(([x,y])=>[x+nx*sg*r*.5,y+ny*sg*r*.5]);}
    const L=.3*col[0]+.59*col[1]+.11*col[2];strokes.push({pts,r,col,L,key:L,thin:true});}
  strokes.sort((a,b)=>a.key-b.key);
  return {spec,strokes,drawn:0};
}

function shade(c,f){return `rgb(${Math.round(clamp(c[0]*f,0,1)*255)},${Math.round(clamp(c[1]*f,0,1)*255)},${Math.round(clamp(c[2]*f,0,1)*255)})`;}
function gcStroke(s){
  const {rect,w}=G,k=rect.w/w,ox=rect.x,oy=rect.y;
  let P=s.pts.map(([x,y])=>[ox+x*k,oy+y*k]);
  for(let it=0;it<2&&P.length>2;it++){const o=[P[0]];for(let j=0;j<P.length-1;j++){const a=P[j],b=P[j+1];
    o.push([.75*a[0]+.25*b[0],.75*a[1]+.25*b[1]],[.25*a[0]+.75*b[0],.25*a[1]+.75*b[1]]);}o.push(P[P.length-1]);P=o;}
  const Wd=2*s.r*k*rnd(.85,1.08)*(s.thin?.9:1),m=P.length,N=[];
  for(let j=0;j<m;j++){const a=P[Math.max(0,j-1)],b=P[Math.min(m-1,j+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;N.push([-dy/l,dx/l]);}
  const width=t=>Wd/2*(t<.12?lerp(.7,1,t/.12):1-.35*smooth(.55,1,t));
  const jit=1+rnd(-.035,.035),col=s.col.map(v=>v*jit*(1+rnd(-.02,.02)));
  // the body of the stroke: flat, opaque, a little thin at the tail
  gcx.globalAlpha=.94;gcx.fillStyle=shade(col,1);gcx.beginPath();
  const cap=(j,hw,sgn)=>{const n=N[j],tx=-n[1]*sgn,ty=n[0]*sgn,sq=rnd(.45,.8); // half-ellipse from one side to the other
    for(let a=1;a<6;a++){const th=Math.PI*a/6,c=Math.cos(th),si=Math.sin(th);gcx.lineTo(P[j][0]+n[0]*hw*c*sgn+tx*hw*si*sq,P[j][1]+n[1]*hw*c*sgn+ty*hw*si*sq);}};
  for(let j=0;j<m;j++){const t=j/(m-1||1),hw=width(t);gcx[j?'lineTo':'moveTo'](P[j][0]+N[j][0]*hw,P[j][1]+N[j][1]*hw);}
  cap(m-1,width(1),1);
  for(let j=m-1;j>=0;j--){const t=j/(m-1||1),hw=width(t)*rnd(.92,1);gcx.lineTo(P[j][0]-N[j][0]*hw,P[j][1]-N[j][1]*hw);}
  cap(0,width(0),-1);
  gcx.closePath();gcx.fill();
  if(s.thin||Wd<2.6){gcx.globalAlpha=1;return P[m-1];}
  // bristles: thin streaks a shade lighter or darker, some running out early like a drying brush
  const nb=clamp(Math.round(Wd/2.4),2,8);gcx.lineCap='round';
  for(let b=0;b<nb;b++){const off=(nb>1?b/(nb-1)-.5:0)*.8+rnd(-.06,.06),t0=rnd(0,.12),t1=rnd(.55,1);
    gcx.globalAlpha=rnd(.25,.5);gcx.strokeStyle=shade(col,1+rnd(-.12,.1));gcx.lineWidth=Math.max(.4,Wd/nb*rnd(.3,.65));gcx.beginPath();
    let first=true;for(let j=0;j<m;j++){const t=j/(m-1||1);if(t<t0||t>t1)continue;const hw=width(t)*2*off;
      gcx[first?'moveTo':'lineTo'](P[j][0]+N[j][0]*hw,P[j][1]+N[j][1]*hw);first=false;}
    gcx.stroke();}
  gcx.globalAlpha=1;
  return P[m-1];
}

function gcPlan(){
  gcClear();gcPrepare();INK={start:1e9,dur:0,label:''};paintEnd=G.end;
  const dpr=gcCv.width/W;gcx.setTransform(dpr,0,0,dpr,0,0);gcGrain();
  return [];
}
// drawn each frame while painting: build a layer when its time comes, then lay its strokes over its duration
function gcFrame(){
  if(!G||!gcCv.width)return;const dpr=gcCv.width/W,r=G.rect;gcx.setTransform(dpr,0,0,dpr,0,0);
  // a clean edge, like a painting on a board
  gcx.save();gcx.beginPath();gcx.rect(r.x,r.y,r.w,r.h);gcx.clip();
  if(!G.underDone){const p=clamp((simT-.2)/1.1,0,1); // toning the board, swept in from the top
    if(p>0){gcx.imageSmoothingEnabled=true;gcx.imageSmoothingQuality='high';gcx.clearRect(r.x,r.y,r.w,r.h);gcx.globalAlpha=.9;
      gcx.drawImage(G.under,0,0,G.under.width,G.under.height*p,r.x,r.y,r.w,r.h*p);gcx.globalAlpha=1;if(state==='painting')statusEl.textContent='Toning the board'+(fast?' · fast-forward':'');}
    if(p>=1)G.underDone=true;}
  for(const spec of G.specs){if(simT<spec.t)break;
    let L=G.layers.find(l=>l.spec===spec);
    if(!L){const prev=G.layers[G.layers.length-1];if(prev&&prev.drawn<prev.strokes.length)break;L=gcBuildLayer(spec);G.layers.push(L);}
    const want=Math.ceil(L.strokes.length*clamp((simT-spec.t)/spec.dur,0,1));
    for(;L.drawn<want;L.drawn++)G.lastTip=gcStroke(L.strokes[L.drawn]);
    if(state==='painting'&&(L.drawn<L.strokes.length||simT<spec.t+spec.dur)){statusEl.textContent=spec.label+(fast?' · fast-forward':'');
      if(G.lastTip){brushEl.style.transform=`translate(${G.lastTip[0]}px,${G.lastTip[1]}px)`;brushEl.classList.add('on');brushEl.classList.remove('pen');}}
  }
  gcx.restore();
  gcAnimFrame();
}
// Add detail: one more layer with a smaller brush, near the focus
function gcMore(){
  if(!G)return;if(animRan){gcRestore();animRan=false;}const last=G.specs[G.specs.length-1],t=simT+.3,dur=3;
  G.specs.push({k:last.k+1,r:Math.max(1.2,last.r*.72),t,dur,label:'Adding finer detail'});
  fast=false;passStart=simT;paintEnd=Math.max(paintEnd,t+dur+.4);endT=Math.max(endT,t+dur+.4);setState('painting');
}
// a matte grain over the paint, like gouache on cold-pressed paper
function gcGrain(){
  const el=document.getElementById('gcGrain'),r=G.rect,dpr=Math.min(2,devicePixelRatio||1),w=Math.round(r.w*dpr),h=Math.round(r.h*dpr);
  Object.assign(el.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
  if(el.width===w&&el.height===h)return;el.width=w;el.height=h;
  const g=el.getContext('2d'),id=g.createImageData(w,h),sd=99;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=.5*vn(x/1.6,y/1.6,sd)+.3*vn(x/4,y/4,sd+1)+.2*vn(x/11,y/11,sd+2),i=(y*w+x)*4,c=Math.round(255-26*v);
    id.data[i]=c;id.data[i+1]=c;id.data[i+2]=c-3;id.data[i+3]=255;}
  g.putImageData(id,0,0);
}

// ---------- animating a gouache painting ----------
// Gouache is opaque, so a change of light is a change in the light over the paint: a multiply layer
// for the time of day and the weather, and a glow layer (screen) for lit windows and the moon.
// Seasons are real paint: leaf dabs in autumn colours, snow on the tops, new green in spring.
const fxCv=document.getElementById('gcFx'),fxx=fxCv.getContext('2d'),glCv=document.getElementById('gcGlow'),glx=glCv.getContext('2d');
let FX={tint:[1,1,1],light:0,moon:0},gcSnapCv=null;
function gcFxReset(){FX={tint:[1,1,1],light:0,moon:0};for(const c of [fxx,glx]){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,fxCv.width,fxCv.height);}}
function gcSaveSnap(){if(!gcSnapCv)gcSnapCv=document.createElement('canvas');gcSnapCv.width=gcCv.width;gcSnapCv.height=gcCv.height;
  const g=gcSnapCv.getContext('2d');g.clearRect(0,0,gcSnapCv.width,gcSnapCv.height);g.drawImage(gcCv,0,0);}
function gcRestore(){if(!gcSnapCv)return;gcx.setTransform(1,0,0,1,0,0);gcx.clearRect(0,0,gcCv.width,gcCv.height);gcx.drawImage(gcSnapCv,0,0);gcFxReset();
  snowOn=false;flakes=[];rainOn=false;drops=[];}
// a mask on the analysis grid, as an image the size of the painting
function maskImage(m,col,blur){const I=IM,c=document.createElement('canvas');c.width=I.gw;c.height=I.gh;const g=c.getContext('2d'),id=g.createImageData(I.gw,I.gh);
  const src=blur?boxBlur(m,I.gw,I.gh,blur):m;
  for(let i=0;i<I.n;i++){id.data[i*4]=col[0]*255;id.data[i*4+1]=col[1]*255;id.data[i*4+2]=col[2]*255;id.data[i*4+3]=clamp(src[i]*(blur?1.6:1),0,1)*255;}
  g.putImageData(id,0,0);return c;}
function gcFxDraw(){
  const r=IM.rect,dpr=fxCv.width/W;
  for(const c of [fxx,glx]){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,fxCv.width,fxCv.height);c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';}
  const t=FX.tint;
  if(t.some(v=>v<.999)){fxx.fillStyle=`rgb(${t.map(v=>Math.round(v*255)).join(',')})`;fxx.fillRect(r.x,r.y,r.w,r.h);
    if(FX.light>0&&G.lightsImg){fxx.globalCompositeOperation='destination-out';fxx.globalAlpha=FX.light;fxx.drawImage(G.lightsImg,r.x,r.y,r.w,r.h);fxx.globalAlpha=1;fxx.globalCompositeOperation='source-over';}}
  if(FX.light>0&&G.glowImg){glx.globalAlpha=FX.light;glx.drawImage(G.glowImg,r.x,r.y,r.w,r.h);glx.drawImage(G.lightsImg,r.x,r.y,r.w,r.h);glx.globalAlpha=1;}
  if(FX.moon>0&&G.moon){const m=G.moon,x=r.x+m.x*r.w,y=r.y+m.y*r.h,rad=m.r*r.w;
    fxx.globalCompositeOperation='destination-out';fxx.globalAlpha=FX.moon;fxx.beginPath();fxx.arc(x,y,rad,0,7);fxx.fill();
    for(const st of G.stars){fxx.beginPath();fxx.arc(r.x+st[0]*r.w,r.y+st[1]*r.h,st[2],0,7);fxx.fill();}fxx.globalAlpha=1;fxx.globalCompositeOperation='source-over';
    glx.fillStyle=`rgba(255,248,222,${.85*FX.moon})`;glx.beginPath();glx.arc(x,y,rad,0,7);glx.fill();
    const gr=glx.createRadialGradient(x,y,rad*.8,x,y,rad*4);gr.addColorStop(0,`rgba(120,130,160,${.35*FX.moon})`);gr.addColorStop(1,'rgba(0,0,0,0)');glx.fillStyle=gr;glx.fillRect(x-rad*4,y-rad*4,rad*8,rad*8);}
}
// the finished picture as it looks now (paint, grain, light), for the video and the download
function gcCompose(g,sx,sy,sw,sh,ow,oh){
  g.drawImage(gcCv,sx,sy,sw,sh,0,0,ow,oh);
  const gr=document.getElementById('gcGrain'),r=G?G.rect:IM.rect,dpr=gcCv.width/W,kx=ow/sw,ky=oh/sh;
  g.globalCompositeOperation='multiply';g.drawImage(gr,(r.x*dpr-sx)*kx,(r.y*dpr-sy)*ky,r.w*dpr*kx,r.h*dpr*ky);
  g.drawImage(fxCv,sx,sy,sw,sh,0,0,ow,oh);
  g.globalCompositeOperation='screen';g.drawImage(glCv,sx,sy,sw,sh,0,0,ow,oh);g.globalCompositeOperation='source-over';
}
// dabs of paint over a mask (on the analysis grid), laid in a random order so the change is everywhere at once
function gcDabs(mask,cols,count,size){const I=IM,out=[];if(!G)return out;const kx=G.w/I.gw,ky=G.h/I.gh;
  for(let k=0,tries=0;k<count&&tries<count*30;tries++){const i=Math.floor(Math.random()*I.n);if(mask(i)<rnd(.35,.7))continue;k++;
    const x=(i%I.gw+Math.random())*kx,y=(Math.floor(i/I.gw)+Math.random())*ky,a=rnd(-.9,.4),r=size*rnd(.7,1.25),c=cols[Math.floor(Math.random()*cols.length)];
    out.push({pts:[[x-Math.cos(a)*r*.5,y-Math.sin(a)*r*.5],[x,y],[x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5]],r,col:c.map(v=>clamp(v*rnd(.94,1.06),0,1))});}
  return out;}
function tintTo(t,dur,label,to){let from;return {t,dur,label,start(){from=FX.tint.slice();},run(p){const e=smooth(0,1,p);FX.tint=from.map((v,i)=>lerp(v,to[i],e));}};}
function dabsStep(t,dur,label,list){let k=0;return {t,dur,label,run(p){const want=Math.ceil(list.length*p);for(;k<want;k++)gcStroke(list[k]);}};}
function gcNight(t){
  const I=IM,Pt=parts(),sc=I.scene;
  const lm=sc&&sc.lightGroups&&sc.lightGroups.length?sc.lightGroups.reduce((m,g)=>{for(let i=0;i<I.n;i++)m[i]=Math.max(m[i],g.mask[i]);return m;},new Float32Array(I.n)):Pt.lights;
  G.lightsImg=maskImage(lm,[1,.84,.52],0);G.glowImg=maskImage(lm,[1,.72,.36],Math.max(3,Math.min(I.gw,I.gh)*.015));
  G.moon=null;G.stars=[];
  if(Pt.skyArea>.03){let best=-1,bv=-1;const sb=boxBlur(Pt.sky,I.gw,I.gh,Math.min(I.gw,I.gh)*.06);
    for(let y=Math.floor(I.gh*.08);y<I.gh*.4;y++)for(let x=Math.floor(I.gw*.15);x<I.gw*.85;x++){const i=y*I.gw+x,v=sb[i]*(1-y/I.gh)*(.6+.4*x/I.gw);if(v>bv){bv=v;best=i;}}
    if(best>=0&&bv>.5){G.moon={x:(best%I.gw+.5)/I.gw,y:(Math.floor(best/I.gw)+.5)/I.gh,r:.026};
      for(let k=0,tries=0;k<26&&tries<3000;tries++){const i=Math.floor(Math.random()*I.n);if(Pt.sky[i]<.85||Math.floor(i/I.gw)>I.gh*.55)continue;k++;G.stars.push([(i%I.gw+.5)/I.gw,(Math.floor(i/I.gw)+.5)/I.gh,rnd(.6,1.3)]);}}}
  return [tintTo(t,2.6,'Golden hour',[1,.9,.74]),tintTo(t+3,2.6,'Dusk',[.78,.72,.86]),tintTo(t+6,3,'Night',[.34,.38,.62]),
    {t:t+9.4,dur:1.6,label:'The moon',run(p){FX.moon=smooth(0,1,p);}},
    {t:t+10.6,dur:3,label:'Lights on',run(p){FX.light=smooth(0,1,p);}}];
}
function gcSeasons(t){
  const I=IM,Pt=parts(),leaf=i=>I.leaf[i],sz=Math.max(2.5,G.w*.012),n=Math.round(Pt.leafArea*G.w*G.h/(sz*sz)*.9);
  const tops=i=>Pt.tops[i],ground=i=>Pt.ground[i];
  return [dabsStep(t,2.6,'Autumn',gcDabs(leaf,[[.93,.74,.36],[.92,.56,.28],[.8,.36,.26],[.86,.66,.3]],n,sz)),
    dabsStep(t+2.8,1.2,'Autumn: falling leaves',gcDabs(ground,[[.9,.6,.3],[.84,.46,.26]],Math.round(n*.15),sz*.6)),
    {...tintTo(t+4.6,2,'Winter',[.86,.89,.98]),start(){this.from=FX.tint.slice();snowOn=true;},run(p){FX.tint=this.from.map((v,i)=>lerp(v,[.86,.89,.98][i],smooth(0,1,p)));}},
    dabsStep(t+5,2.4,'Winter: snow settles',[...gcDabs(tops,[[.97,.97,.99],[.93,.94,.98]],Math.round(n*.35),sz*.8),...gcDabs(leaf,[[.95,.95,.98],[.88,.9,.96]],Math.round(n*.45),sz*.8)]),
    {...tintTo(t+8.6,1.6,'Spring',[1,1,1]),start(){this.from=FX.tint.slice();snowOn=false;},run(p){FX.tint=this.from.map((v,i)=>lerp(v,1,smooth(0,1,p)));}},
    dabsStep(t+8.8,2.4,'Spring',gcDabs(leaf,[[.66,.82,.44],[.56,.76,.4],[.97,.78,.83],[.96,.86,.9]],n,sz*.9)),
    dabsStep(t+11.6,2.4,'Summer',gcDabs(leaf,[[.34,.56,.3],[.42,.64,.34],[.28,.46,.3]],n,sz))];
}
function gcRain(t){return [{...tintTo(t,2.6,'Clouds gather',[.74,.77,.84]),start(){this.from=FX.tint.slice();},run(p){FX.tint=this.from.map((v,i)=>lerp(v,[.74,.77,.84][i],smooth(0,1,p)));}},
  {t:t+2.4,dur:3.5,label:'Rain',start(){rainOn=true;},run(){}}];}
function gcPlay(on,name){
  if(!animRan||!gcSnapCv)gcSaveSnap();else gcRestore();animRan=true;startRecording(name);
  let t=simT+1.2;const list=[],add=l=>{list.push(...l);t=Math.max(...l.map(s=>s.t+s.dur))+.8;};
  if(on('seasons')&&parts().leafArea>=.015)add(gcSeasons(t));
  if(on('rain'))add(gcRain(t));
  if(on('night'))add(gcNight(t));
  if(!list.length)list.push({t,dur:12,label:'',run(){}});else list.push({t,dur:2.5,label:'',run(){}});
  G.anim=list;fast=false;const fb=document.getElementById('finish');fb.disabled=false;fb.textContent='Skip to the end';
  passStart=simT;endT=Math.max(endT,t+3.5);setState('painting');
}
function gcAnimFrame(){
  if(!G||!G.anim)return;const r=G.rect,dpr=gcCv.width/W;gcx.setTransform(dpr,0,0,dpr,0,0);gcx.save();gcx.beginPath();gcx.rect(r.x,r.y,r.w,r.h);gcx.clip();
  for(const s of G.anim){if(simT<s.t)continue;const p=clamp((simT-s.t)/s.dur,0,1);
    if(!s.begun){s.begun=true;if(s.start)s.start();if(rec)rec.caption=s.label;if(s.label)G.animLabel=s.label;}
    if(!s.ended){s.run(p);if(p>=1)s.ended=true;}}
  gcx.restore();gcFxDraw();if(state==='painting')statusEl.textContent=(G.animLabel||'')+(fast?' · fast-forward':'');
}

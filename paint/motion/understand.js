// Paint motion: reading a photo. Turns any photo into what the bases need: where things can live (masks
// by role, the same roles a scene file uses) and how big things are (the horizon and a scale for every row).
// See ../MOTION.md, section 6.
//
// Two ways to read it:
//  - models (best): a labelling model (SegFormer, ADE20K: about 150 kinds of thing) and a depth model
//    (Depth Anything), both run in the browser with transformers.js. The photo never leaves the device;
//    only the models are downloaded, once, then cached. On by default; ?nomodels turns them off.
//  - colour (always there): sky, foliage and water guessed from colour, calm and position. Rougher, and it
//    can't find paths or roads, so it only enables the bases that live in sky, trees and water.

// ADE20K labels -> Paint roles. Anything not listed is ignored (a base never lives there).
const ADE_ROLES=[
  [/^sky$/,'sky'],[/tree|plant|palm/,'foliage'],[/grass|field/,'grass'],[/flower/,'flower'],
  [/^road$|runway/,'road'],[/sidewalk|path|dirt track|stairway|step/,'path'],[/earth|sand|land|floor|rock|stone/,'ground'],
  [/water|sea|river|lake|pool|fountain|waterfall/,'water'],
  [/building|house|skyscraper|tower|hovel/,'building'],[/^wall$/,'wall'],[/windowpane|window/,'window'],[/^door/,'door'],
  [/mountain/,'mountain'],[/hill/,'hill'],[/^person/,'figure'],[/car|bus|truck|van|bicycle|minibike/,'vehicle'],[/boat|ship/,'vehicle'],
  [/streetlight|lamp|light/,'lamp'],[/pier|dock|wharf|quay|bridge/,'path'],[/fence|railing|bench|pole|awning|signboard|column/,'prop'],[/cloud/,'cloud'],
];
// a pier, quay or bridge is somewhere to walk, not a thing standing in front (it comes before 'prop')
const ROLE_OF_ADE=label=>{for(const [re,r] of ADE_ROLES)if(re.test(label))return r;return null;};

const Paint=window.Paint||(window.Paint={});
Paint.models=Paint.models??!new URLSearchParams(location.search).has('nomodels'); // on unless ?nomodels; falls back to colour if they can't load
const TF_URL='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1';
let tf=null,segPipe=null,depthPipe=null;

async function understandPhoto(I){
  const out={source:'colour',masks:colourMasks(I),depth:null,labels:null};
  if(Paint.models){
    try{const m=await modelMasks(I);if(m){const colour=out.masks;out.source='models';out.masks=m.masks;out.depth=m.depth;out.labels=m.labels;
      // the labelling model learned from photos and can call a painted or flat sky "wall"; open sky the colour reading
      // finds from the top edge wins, unless the model saw a ceiling (indoors) or a solid thing there
      if(!m.labels.names.some(n=>/ceiling/.test(n))){const S=out.masks.sky||new Float32Array(I.n),solid=['building','foliage','figure','vehicle','mountain','hill'].map(r=>out.masks[r]).filter(Boolean);
        let added=0;for(let i=0;i<I.n;i++){const c=colour.sky[i]*(1-Math.max(0,...solid.map(q=>q[i])));if(c>S[i]){S[i]=c;added++;}}
        if(added)out.masks.sky=S;}
      for(const r of ['water','foliage'])if(!out.masks[r]&&colour[r]&&colour[r].some(v=>v>.5)&&!m.labels.names.some(n=>/ceiling|floor/.test(n)))out.masks[r]=colour[r];}}
    catch(e){console.warn('Paint: models unavailable, reading the photo by colour',e);}
  }
  Object.assign(out,horizonAndScale(I,out));
  return out;
}

// ---------- colour reading: no download, rough ----------
function colourMasks(I){
  const {gw,gh,n}=I,P=parts(),masks={sky:P.sky,foliage:new Float32Array(n),water:new Float32Array(n)};
  for(let i=0;i<n;i++)masks.foliage[i]=smooth(.35,.6,I.leaf[i]);
  // water: below the open sky, bluish or sky-coloured, calm, in a broad horizontal band
  let skyBot=0;for(let y=0;y<gh;y++){let s=0;for(let x=0;x<gw;x++)s+=P.sky[y*gw+x];if(s/gw>.3)skyBot=y;}
  const cand=new Uint8Array(n);
  for(let y=skyBot+2;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x,b=I.B[i],r=I.R[i],g=I.G[i];
    cand[i]=b>r+.04&&b>=g-.03&&I.Ed[i]<.18&&I.leaf[i]<.3&&P.sky[i]<.3?1:0;}
  for(const o of components(cand,gw,gh))if(o.px.length>n*.02&&(o.x1-o.x0)>(o.y1-o.y0)*1.6)for(const i of o.px)masks.water[i]=1;
  masks.water=boxBlur(masks.water,gw,gh,1);
  return masks;
}

// ---------- model reading ----------
async function loadModels(){
  if(!tf){tf=await import(TF_URL);try{tf.env.backends.onnx.logLevel='error';}catch(e){}} // its node-placement warnings are noise
  // the GPU if the browser really has one, else the CPU (WebAssembly); navigator.gpu can exist with no adapter
  const make=async(task,model)=>{if(navigator.gpu){try{return await tf.pipeline(task,model,{device:'webgpu',dtype:'fp32'});}catch(e){}}return tf.pipeline(task,model,{device:'wasm',dtype:'fp32'});};
  if(!segPipe)segPipe=await make('image-segmentation','Xenova/segformer-b0-finetuned-ade-512-512');
  if(!depthPipe)depthPipe=await make('depth-estimation','onnx-community/depth-anything-v2-small');
}
async function modelMasks(I){
  await loadModels();
  const src=document.createElement('canvas'),s=Math.min(1,768/Math.max(I.img.naturalWidth,I.img.naturalHeight));
  src.width=Math.round(I.img.naturalWidth*s);src.height=Math.round(I.img.naturalHeight*s);src.getContext('2d').drawImage(I.img,0,0,src.width,src.height);
  const raw=await tf.RawImage.fromCanvas(src);
  const [segs,dep]=await Promise.all([segPipe(raw),depthPipe(raw)]);
  const {gw,gh,n}=I,masks={},labels=new Int16Array(n).fill(-1),names=[];
  // each label's mask, resampled onto the paint grid
  for(const s of segs){const role=ROLE_OF_ADE(s.label);names.push(s.label);const k=names.length-1;
    const m=s.mask,mw=m.width,mh=m.height,d=m.data;
    const grid=new Float32Array(n);
    for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const v=d[Math.floor(y/gh*mh)*mw+Math.floor(x/gw*mw)]/255;if(v>.5){grid[y*gw+x]=1;labels[y*gw+x]=k;}}
    if(role){const g2=masks[role]||(masks[role]=new Float32Array(n));for(let i=0;i<n;i++)g2[i]=Math.max(g2[i],grid[i]);}}
  // clean up: a role that spreads (water, roads, sky, ground) must be a real-sized region, or it's a stray
  // guess and no base may live there; small things (people, windows, lamps) only need to be more than a speck
  const BIG={sky:.015,water:.015,road:.01,path:.006,ground:.01,grass:.01,foliage:.004,building:.01,wall:.01,mountain:.01,hill:.01};
  for(const r in masks){const min=(BIG[r]??.0004)*n,keep=new Uint8Array(n);
    for(const o of components(Uint8Array.from(masks[r],v=>v>.5?1:0),gw,gh))if(o.px.length>=min)for(const i of o.px)keep[i]=1;
    let any=0;for(let i=0;i<n;i++){if(!keep[i])masks[r][i]=0;else any=1;}
    if(!any)delete masks[r];}
  for(const r in masks)masks[r]=boxBlur(masks[r],gw,gh,1);
  // depth: larger = nearer (relative); resampled onto the grid and normalised 0..1
  const D=dep.depth||dep.predicted_depth,dw=D.width||D.dims[1],dh=D.height||D.dims[0],dd=D.data,depth=new Float32Array(n);
  let lo=Infinity,hi=-Infinity;for(let i=0;i<dd.length;i++){lo=Math.min(lo,dd[i]);hi=Math.max(hi,dd[i]);}
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++)depth[y*gw+x]=(dd[Math.floor(y/gh*dh)*dw+Math.floor(x/gw*dw)]-lo)/((hi-lo)||1);
  return {masks,depth,labels:{map:labels,names}};
}

// ---------- horizon and scale ----------
// With the camera at eye height (about 1.6 m), a point on flat ground k rows below the horizon is k/1.6 rows
// per metre, so a standing person whose feet are on row y is about 1.06*(y - horizon) rows tall. People in the
// photo pin the horizon best (by their heads); then a sea line
// (open water meeting sky); then the ground's depth gradient, if it lands in a believable band; then the open sky.
function horizonAndScale(I,R){
  const {gw,gh}=I,M=R.masks;let horizon=null,how='';
  // with the camera at eye height every standing adult's head is on the horizon, near or far, so the middle
  // of people's head heights is the horizon; feet aren't needed (in a crowd they're hidden or cropped)
  if(M.figure){const ppl=components(Uint8Array.from(M.figure,v=>v>.5?1:0),gw,gh).filter(o=>(o.y1-o.y0)>gh*.025&&o.y0>1);
    const heads=ppl.map(o=>o.y0+(o.y1-o.y0)*.04).sort((a,b)=>a-b);
    if(heads.length){const mid=heads.slice(Math.floor(heads.length*.25),Math.ceil(heads.length*.75)||1);horizon=mid.reduce((a,v)=>a+v,0)/mid.length;how='people';}}
  if(horizon===null&&M.water&&M.sky){const rows=[];
    for(let x=0;x<gw;x+=2)for(let y=3;y<gh;y++){const i=y*gw+x;if(M.water[i]>.6){let s=0;for(let k=1;k<=3;k++)s+=M.sky[i-k*gw]>.5?1:0;if(s>=2)rows.push(y);break;}}
    if(rows.length>gw*.08){rows.sort((a,b)=>a-b);horizon=rows[rows.length>>1];how='sea line';}}
  if(horizon===null&&R.depth){const G=['ground','road','path','grass','water'].map(r=>M[r]).filter(Boolean);
    let sy=0,sd=0,syy=0,syd=0,k=0;
    for(let y=0;y<gh;y++)for(let x=0;x<gw;x+=2){const i=y*gw+x;if(G.some(m=>m[i]>.6)){const d=R.depth[i];sy+=y;sd+=d;syy+=y*y;syd+=y*d;k++;}}
    if(k>gw*2){const a=(k*syd-sy*sd)/(k*syy-sy*sy),b=(sd-a*sy)/k,h=-b/a;if(a>1e-4&&h>gh*.15&&h<gh*.8){horizon=h;how='ground depth';}}}
  if(horizon===null&&M.sky){let bot=-1;for(let y=0;y<gh;y++){let s=0;for(let x=0;x<gw;x++)s+=M.sky[y*gw+x];if(s/gw>.2)bot=y;}if(bot>=0){horizon=bot+gh*.02;how='sky';}}
  if(horizon===null){horizon=gh*.45;how='guess';}
  horizon=clamp(horizon,-gh*.5,gh*.95);
  return {horizon,horizonFrom:how,
    // grid rows per metre at a row (0 at and above the horizon), and a standing person's height there
    perMetre:y=>Math.max(0,y-horizon)/1.6,personAt:y=>Math.max(0,y-horizon)*1.06};
}

// the masks a base should use: a scene file's roles, or what was read from the photo
function masksOf(I){return (I.scene&&I.scene.masks)||(I.photo&&I.photo.masks)||null;}

// a look at what was read: ?see paints each role's mask over the photo in its own colour
const SEE_COLOURS={sky:'#6fa8ff',water:'#2050c0',foliage:'#2e9e44',grass:'#9ccf55',road:'#888888',path:'#d8b26a',ground:'#a07850',
  building:'#d06040',wall:'#c08070',window:'#ffd34d',door:'#7a3b2e',figure:'#ff3da5',vehicle:'#a040ff',lamp:'#fff27a',prop:'#40d0d0',mountain:'#7d7fb0',hill:'#80a070',flower:'#ff80c0',cloud:'#ffffff'};
function seeOverlay(g,I){
  const M=masksOf(I);if(!M)return;const r=I.rect,c=document.createElement('canvas');c.width=I.gw;c.height=I.gh;const cg=c.getContext('2d'),id=cg.createImageData(I.gw,I.gh);
  for(const role in M){const col=hexRGB(SEE_COLOURS[role]||'#ff00ff');if(!col)continue;const m=M[role];
    for(let i=0;i<I.n;i++)if(m[i]>.5){id.data[i*4]=col[0]*255;id.data[i*4+1]=col[1]*255;id.data[i*4+2]=col[2]*255;id.data[i*4+3]=150;}}
  cg.putImageData(id,0,0);g.save();g.imageSmoothingEnabled=false;g.drawImage(c,r.x,r.y,r.w,r.h);
  if(I.photo){const y=r.y+I.photo.horizon/I.gh*r.h;g.strokeStyle='#ff2d2d';g.setLineDash([6,4]);g.lineWidth=1.5;g.beginPath();g.moveTo(r.x,y);g.lineTo(r.x+r.w,y);g.stroke();}
  g.restore();
}

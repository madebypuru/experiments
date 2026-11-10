// Paint motion: depth layers and parallax. The finished painting is cut into up to four layers by depth
// (sky, far, middle, near). Under the pointer (or the phone's tilt) each layer shifts by its own amount,
// near ones most, so the painting gets depth. What a near layer covers is filled in each farther layer from
// its own surroundings, so moving never opens a hole. The same layers are what Download for a website exports.
// See ../MOTION.md.

// ---------- how far each point is (0 far .. 1 near) ----------
const ROLE_DEPTH={sky:0,cloud:.04,sun:0,moon:0,mountain:.15,hill:.25,water:.45,building:.5,wall:.5,roof:.5,window:.5,door:.52,
  trunk:.55,branch:.55,foliage:.55,flower:.7,figure:.72,animal:.72,vehicle:.68,prop:.65,shadow:.6};
function depthField(I){
  const {gw,gh,n}=I,D=new Float32Array(n),M=masksOf(I)||{},sky=M.sky||parts().sky;
  if(I.photo&&I.photo.depth){const d=I.photo.depth;for(let i=0;i<n;i++)D[i]=sky[i]>.5?0:.05+.95*d[i];return D;}
  const ground=['ground','road','path','grass'].filter(r=>M[r]);
  for(let y=0;y<gh;y++)for(let x=0;x<gw;x++){const i=y*gw+x,row=y/gh;
    if(sky[i]>.5){D[i]=0;continue;}
    let v=null,best=.5;for(const r in M){if(ROLE_DEPTH[r]===undefined)continue;if(M[r][i]>best){best=M[r][i];v=ROLE_DEPTH[r];}}
    if(ground.some(r=>M[r][i]>.5))v=.35+.65*row; // the ground comes nearer the lower it is
    D[i]=v===null?.15+.8*row:v*.6+row*.4;}
  return D;
}
// Split into n layers so that every object stays whole. The ground is the stage: it is cut into bands by how
// near it is. Each object (a house, a tree, a person, a boat) goes, in one piece, into the band of the ground it
// stands on, so it moves with that ground; things that don't stand on the ground in view (mountains, hills)
// go by their own distance. The sky, the paper and the soft painted edge stay in the back layer and never move.
const GROUND_ROLES=['ground','road','path','grass','water'];
function depthLabels(I,n){
  const {gw,gh}=I,N=I.n,D=depthField(I),M=masksOf(I)||{},sky=M.sky||parts().sky,L=new Uint8Array(N);
  const isGround=i=>GROUND_ROLES.some(r=>M[r]&&M[r][i]>.5),back=i=>sky[i]>.5||I.Fu[i]<.45;
  // the ground's bands: equal shares of the ground's depth range (or of the rows below the sky, with no ground)
  const gvals=[];for(let i=0;i<N;i++)if(!back(i)&&isGround(i))gvals.push(D[i]);
  const all=[];for(let i=0;i<N;i++)if(!back(i))all.push(D[i]);
  const ref=(gvals.length>N*.02?gvals:all).sort((a,b)=>a-b),cuts=[];
  for(let k=1;k<n-1;k++)cuts.push(ref[Math.floor(ref.length*k/(n-1))]??1);
  const band=d=>{let k=1;for(const c of cuts)if(d>c)k++;return Math.min(n-1,k);};
  for(let i=0;i<N;i++)L[i]=back(i)?0:isGround(i)?band(D[i]):255;
  // objects: connected pieces of everything that isn't sky, paper or ground; each takes one layer, whole
  // pieces per kind of thing (each role in a scene; each labelled segment in a read photo), so touching things
  // (a house against a hill) don't fuse into one; what is left over is split into its own connected pieces
  const groups=[];
  for(const r in M){if(r==='sky'||r==='cloud'||GROUND_ROLES.includes(r))continue;const m=new Uint8Array(N);let any=0;for(let i=0;i<N;i++)if(L[i]===255&&M[r][i]>.5){m[i]=1;any=1;}
    if(any)groups.push({m,far:r==='mountain'||r==='hill'});}
  const rest=new Uint8Array(N);for(let i=0;i<N;i++)if(L[i]===255&&!groups.some(g=>g.m[i]))rest[i]=1;groups.push({m:rest,far:false});
  // every piece, lowest first: a roof is placed after the walls it sits on, leaves after their trunk, a window
  // after its wall, so each takes the layer of whatever it rests on and a house or a tree never splits
  const pieces=[];for(const G of groups)for(const o of components(G.m,gw,gh))pieces.push({o,far:G.far,low:o.y1});
  pieces.sort((a,b)=>b.low-a.low);
  for(const {o,far} of pieces){if(far){for(const i of o.px)L[i]=0;continue;}
    // where it stands: the ground just under its lowest row, if any; else its own (median) distance
    let foot=null;const bottom=new Map();for(const i of o.px){const x=i%gw,y=(i-x)/gw;if(!bottom.has(x)||y>bottom.get(x))bottom.set(x,y);}
    const under=[];for(const [x,y] of bottom)for(let k=1;k<=6&&y+k<gh;k++){const j=(y+k)*gw+x;if(L[j]>0&&L[j]<255){under.push(L[j]);break;}}
    if(under.length>=Math.max(2,bottom.size*.15)){under.sort((a,b)=>a-b);foot=under[under.length>>1];}
    else if(o.px.length<N*.01){ // a small piece inside something (a window in a wall): take what surrounds it
      const around=[];for(const i of o.px){for(const j of [i-1,i+1,i-gw,i+gw])if(j>=0&&j<N&&L[j]>0&&L[j]<255)around.push(L[j]);}
      if(around.length){around.sort((a,b)=>a-b);foot=around[around.length>>1];}}
    let k=foot;if(k===null){const ds=o.px.map(i=>D[i]).sort((a,b)=>a-b);const d=ds[ds.length>>1];k=d<.3?0:band(d);}
    for(const i of o.px)L[i]=k;}
  for(let i=0;i<N;i++)if(L[i]===255)L[i]=0;
  return L;
}
// ---------- the painting as it looks now, as an image ----------
function paintingImage(){
  const r=IM.rect,dpr=cv.width/W,o=document.createElement('canvas');o.width=Math.round(r.w*dpr);o.height=Math.round(r.h*dpr);
  const g=o.getContext('2d'),sx=r.x*dpr,sy=r.y*dpr,sw=r.w*dpr,sh=r.h*dpr;
  show(); // read the WebGL canvas in the same task it was drawn
  g.fillStyle='#fbf8f1';g.fillRect(0,0,o.width,o.height);g.drawImage(cv,sx,sy,sw,sh,0,0,o.width,o.height);
  if(GC())gcCompose(g,sx,sy,sw,sh,o.width,o.height);
  g.globalCompositeOperation='multiply';g.drawImage(inkCv,sx,sy,sw,sh,0,0,o.width,o.height);g.globalCompositeOperation='source-over';
  // snow that has settled on roofs, ground and trees is part of how the painting looks now
  if(typeof snowCover!=='undefined'&&snowCover>0&&snowCapFor===IM){g.save();g.globalAlpha=Math.min(1,snowCover*3);g.filter=medium()==='watercolour'?`blur(${(.8*dpr).toFixed(1)}px)`:'none';g.drawImage(snowCapCv,0,0,o.width,o.height);g.restore();}
  return o;
}
// fill the transparent parts of a layer from its own colours (push-pull: average down, spread back up)
function fillHoles(c){
  const levels=[c];let w=c.width,h=c.height;
  while(w>4&&h>4){w=Math.max(2,w>>1);h=Math.max(2,h>>1);const d=document.createElement('canvas');d.width=w;d.height=h;
    const g=d.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(levels[levels.length-1],0,0,w,h);
    // a few extra passes so partly covered cells become solid enough to spread
    for(let k=0;k<2;k++)g.drawImage(d,0,0);levels.push(d);}
  const out=document.createElement('canvas');out.width=c.width;out.height=c.height;const g=out.getContext('2d');g.imageSmoothingQuality='high';
  for(let k=levels.length-1;k>=0;k--)g.drawImage(levels[k],0,0,c.width,c.height);
  return out;
}
// cut the painting into n layers; layer k holds its own paint, and behind nearer layers a fill from itself
function buildLayers(n){
  const I=IM,img=paintingImage(),W2=img.width,H2=img.height,L=depthLabels(I,n),layers=[];
  for(let k=0;k<n;k++){
    const m=document.createElement('canvas');m.width=I.gw;m.height=I.gh;const mg=m.getContext('2d'),id=mg.createImageData(I.gw,I.gh);
    for(let i=0;i<I.n;i++)id.data[i*4+3]=L[i]===k?255:(L[i]>k?0:0);mg.putImageData(id,0,0);
    const own=document.createElement('canvas');own.width=W2;own.height=H2;const og=own.getContext('2d');
    og.drawImage(img,0,0);og.globalCompositeOperation='destination-in';og.imageSmoothingEnabled=true;og.filter='blur(1px)';og.drawImage(m,0,0,W2,H2);og.filter='none';og.globalCompositeOperation='source-over';
    let out;
    if(k===0){out=fillHoles(own);} // the farthest layer is complete: everything in front of it is filled
    else{ // nearer layers: their own paint, plus a fill reaching a little under the next nearer layers (no gaps when they move)
      const full=fillHoles(own),near=document.createElement('canvas');near.width=I.gw;near.height=I.gh;const ng=near.getContext('2d'),nd=ng.createImageData(I.gw,I.gh);
      for(let i=0;i<I.n;i++)nd.data[i*4+3]=L[i]>=k?255:0;ng.putImageData(nd,0,0);
      out=document.createElement('canvas');out.width=W2;out.height=H2;const g=out.getContext('2d');
      g.drawImage(full,0,0);g.globalCompositeOperation='destination-in';g.filter=`blur(${Math.max(2,W2*.012).toFixed(1)}px)`;g.drawImage(near,0,0,W2,H2);g.drawImage(near,0,0,W2,H2);g.filter='none';
      g.globalCompositeOperation='source-over';g.drawImage(own,0,0);
      if(k<n-1){} }
    layers.push({canvas:out,depth:n===1?0:k/(n-1)});
  }
  return layers;
}

// ---------- parallax ----------
// Each layer has its own distance (how far it moves at the edge of the picture, in % of the width) and speed
// (how quickly it catches up with the pointer). Motion eases out with no overshoot: an exponential follow,
// not a spring, which is what makes it feel calm rather than mechanical.
const depthCv=document.createElement('canvas');depthCv.id='depth';depthCv.setAttribute('aria-hidden','true');
let DEPTH={n:0,layers:null,for:null,look:'',tx:0,ty:0,set:[],focus:-1};
const LAYER_NAMES={2:['Back','Front'],3:['Back','Middle','Front'],4:['Sky & far','Back','Middle','Front']};
function defaultLayerSet(n){return Array.from({length:n},(_,k)=>({move:+(k/(n-1)*1.4).toFixed(2),speed:+(2.2+k*.6).toFixed(1),x:0,y:0}));}
function setDepth(n){DEPTH.n=n;DEPTH.layers=null;DEPTH.set=n>1?defaultLayerSet(n):[];DEPTH.focus=-1;
  if(!n||n<2){depthCv.style.display='none';shiftLife(0,0);}depthControls();}
addEventListener('pointermove',e=>{if(!IM||DEPTH.n<2)return;const r=IM.rect;DEPTH.tx=clamp((e.clientX-(r.x+r.w/2))/(r.w/2),-1,1);DEPTH.ty=clamp((e.clientY-(r.y+r.h/2))/(r.h/2),-1,1);});
document.addEventListener('pointerleave',()=>{DEPTH.tx=DEPTH.ty=0;});
addEventListener('deviceorientation',e=>{if(DEPTH.n<2||e.gamma==null)return;DEPTH.tx=clamp(e.gamma/25,-1,1);DEPTH.ty=clamp((e.beta-40)/25,-1,1);});
function lookKey(){return [LOOK.season,LOOK.time,LOOK.weather,STYLE,IM&&IM.rect.w].join('|');}
function depthFrame(dt){
  const on=DEPTH.n>1&&IM&&state==='done';
  if(!on){if(depthCv.style.display!=='none'){depthCv.style.display='none';shiftLife(0,0);}return;}
  if(!DEPTH.layers||DEPTH.for!==IM||DEPTH.look!==lookKey()){DEPTH.layers=buildLayers(DEPTH.n);DEPTH.for=IM;DEPTH.look=lookKey();}
  const r=IM.rect,dpr=lifeCv.width/W;if(depthCv.width!==lifeCv.width||depthCv.height!==lifeCv.height){depthCv.width=lifeCv.width;depthCv.height=lifeCv.height;}
  depthCv.style.display='block';const g=depthCv.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,depthCv.width,depthCv.height);
  DEPTH.layers.forEach((L,k)=>{const S=DEPTH.set[k]||{move:0,speed:3,x:0,y:0},a=1-Math.exp(-S.speed*dt),m=S.move/100;
    S.x+=(-DEPTH.tx*r.w*m-S.x)*a;S.y+=(-DEPTH.ty*r.h*m*.6-S.y)*a;
    g.globalAlpha=DEPTH.focus<0||DEPTH.focus===k?1:.28; // a layer's row is hovered: show just that layer
    g.drawImage(L.canvas,(r.x+S.x)*dpr,(r.y+S.y)*dpr,r.w*dpr,r.h*dpr);});
  g.globalAlpha=1;
  // moving things travel with the layer in front of the middle
  const mid=DEPTH.set[Math.min(DEPTH.n-1,Math.ceil((DEPTH.n-1)/2))]||{x:0,y:0};shiftLife(mid.x,mid.y);
}
function shiftLife(x,y){const t=x||y?`translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`:'';for(const c of [lifeCv,figCv,snowCv])if(c&&c.style.transform!==t)c.style.transform=t;}
// the controls: a row per layer, with how far it moves and how quickly it follows; hovering a row shows that layer
function depthControls(){
  let box=document.getElementById('depthCtl');
  if(!box){box=document.createElement('div');box.id='depthCtl';const host=document.getElementById('look');if(!host)return;host.after(box);}
  box.innerHTML='';box.hidden=DEPTH.n<2;if(DEPTH.n<2)return;
  const names=LAYER_NAMES[DEPTH.n];
  const head=document.createElement('div');head.className='dhead';head.innerHTML='<span></span><span>Distance</span><span>Speed</span>';box.appendChild(head);
  DEPTH.set.forEach((S,k)=>{const row=document.createElement('div');row.className='drow';
    row.innerHTML=`<span class="lbl">${names[k]}</span><input type="range" min="0" max="5" step=".05" value="${S.move}" aria-label="${names[k]}: how far it moves"><input type="range" min=".5" max="10" step=".1" value="${S.speed}" aria-label="${names[k]}: how quickly it follows">`;
    const [mv,sp]=row.querySelectorAll('input');mv.oninput=()=>{S.move=+mv.value;};sp.oninput=()=>{S.speed=+sp.value;};
    row.onpointerenter=()=>{DEPTH.focus=k;};row.onpointerleave=()=>{DEPTH.focus=-1;};
    // preview the motion while adjusting: sweep the pointer gently while a slider is held
    for(const inp of [mv,sp]){inp.onpointerdown=()=>{DEPTH.sweep=true;};inp.onpointerup=()=>{DEPTH.sweep=false;DEPTH.tx=DEPTH.ty=0;};}
    box.appendChild(row);});
  const note=document.createElement('p');note.className='desc';note.textContent='Distance is how far a layer moves at the edge of the picture; speed is how quickly it catches up. Hover a row to see that layer. Download uses these.';box.appendChild(note);
}
// while a slider is held there is no pointer over the picture, so show the motion with a slow sweep
setInterval(()=>{if(DEPTH.sweep){const t=performance.now()/1000;DEPTH.tx=Math.sin(t*1.3);DEPTH.ty=Math.sin(t*.9)*.4;}},16);

// ---------- download for a website: one self-contained HTML file ----------
// The painting in its look, cut into its depth layers, with a small runtime: parallax on hover and tilt,
// and falling rain or snow if the weather has it. Drop the file in, or paste its <div> and <script> into a page.
function buildExport(){
  if(!IM||state!=='done')return null;
  const n=DEPTH.n>1?DEPTH.n:1,layers=n>1?(DEPTH.layers&&DEPTH.for===IM&&DEPTH.look===lookKey()?DEPTH.layers:buildLayers(n)):[{canvas:paintingImage(),depth:0}];
  const imgs=layers.map((L,k)=>({src:L.canvas.toDataURL('image/webp',.86),depth:L.depth}));
  const cfg={w:layers[0].canvas.width,h:layers[0].canvas.height,weather:LOOK.weather,look:{...LOOK},layers:imgs.map((im,k)=>({move:(DEPTH.set[k]||{move:0}).move,speed:(DEPTH.set[k]||{speed:3}).speed}))};
  const title=(IM.scene&&IM.scene.title)||'A painting';
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title.replace(/</g,'&lt;')}</title><style>html,body{margin:0;background:#fbf8f1}.paint-embed{position:relative;max-width:900px;margin:5vh auto;aspect-ratio:${cfg.w}/${cfg.h};overflow:hidden}
.paint-embed canvas{position:absolute;inset:0;width:100%;height:100%}</style></head><body>
<!-- Made with Paint. Copy this <div> and the <script> below into any page. -->
<div class="paint-embed" data-paint></div>
<script>
(function(){
var CFG=${JSON.stringify(cfg)},SRC=${JSON.stringify(imgs.map(i=>i.src))};
var box=document.querySelector('[data-paint]'),c=document.createElement('canvas');box.appendChild(c);var g=c.getContext('2d');
var im=SRC.map(function(s){var i=new Image();i.src=s;return i;});
var t={x:0,y:0},drops=[],last=performance.now(),pos=CFG.layers.map(function(){return {x:0,y:0};});
function size(){var d=Math.min(2,devicePixelRatio||1),r=box.getBoundingClientRect();c.width=r.width*d;c.height=r.height*d;}
addEventListener('resize',size);size();
box.addEventListener('pointermove',function(e){var r=box.getBoundingClientRect();t.x=((e.clientX-r.left)/r.width-.5)*2;t.y=((e.clientY-r.top)/r.height-.5)*2;});
box.addEventListener('pointerleave',function(){t.x=t.y=0;});
addEventListener('deviceorientation',function(e){if(e.gamma==null)return;t.x=Math.max(-1,Math.min(1,e.gamma/25));t.y=Math.max(-1,Math.min(1,(e.beta-40)/25));});
var still=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(now){var dt=Math.min(.05,(now-last)/1000);last=now;
  var W=c.width,H=c.height;g.clearRect(0,0,W,H);
  im.forEach(function(i,k){if(!i.complete)return;var L=CFG.layers[k],P=pos[k],a=1-Math.exp(-L.speed*dt),m=L.move/100;
    if(!still){P.x+=(-t.x*W*m-P.x)*a;P.y+=(-t.y*H*m*.6-P.y)*a;}
    g.drawImage(i,P.x,P.y,W,H);});
  if(CFG.weather!=='clear'&&!still){var snow=CFG.weather==='snow';
    while(drops.length<(snow?140:220))drops.push({x:Math.random()*W,y:Math.random()*H,v:snow?H*(.07+Math.random()*.08):H*(1+Math.random()*.6),s:Math.random()});
    g.strokeStyle='rgba(120,134,156,.5)';g.fillStyle='rgba(255,255,255,.85)';g.lineWidth=Math.max(1,W/900);g.beginPath();
    drops.forEach(function(q){q.y+=q.v*dt;if(snow){q.x+=Math.sin(now/900+q.s*9)*.3;}if(q.y>H){q.y=-10;q.x=Math.random()*W;}
      if(snow){g.moveTo(q.x+2,q.y);g.arc(q.x,q.y,1+q.s*2*W/900,0,7);}else{g.moveTo(q.x,q.y);g.lineTo(q.x+W*.004,q.y-H*.025);}});
    snow?g.fill():g.stroke();}
  requestAnimationFrame(frame);}
requestAnimationFrame(frame);
})();
<\/script></body></html>`;
  return {html,title};
}
function exportForWeb(){const e=buildExport();if(!e)return;const {html,title}=e;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));
  a.download=(title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'painting')+'.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}

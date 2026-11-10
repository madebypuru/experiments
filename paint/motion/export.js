// Paint: Download for a website. The painting in its look (season, time of day, weather) as one
// self-contained HTML file, with falling rain or snow if the weather has it. See ../MOTION.md.
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
// ---------- download for a website: one self-contained HTML file ----------
// The painting in its look, with a small runtime for falling rain or snow if the weather has it. Drop the file in, or paste its <div> and <script> into a page.
function buildExport(){
  if(!IM||state!=='done')return null;
  const layers=[{canvas:paintingImage()}];
  const imgs=layers.map(L=>({src:L.canvas.toDataURL('image/webp',.9)}));
  const cfg={w:layers[0].canvas.width,h:layers[0].canvas.height,weather:LOOK.weather,look:{season:LOOK.season,time:LOOK.time,weather:LOOK.weather}};
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
var drops=[],last=performance.now();
function size(){var d=Math.min(2,devicePixelRatio||1),r=box.getBoundingClientRect();c.width=r.width*d;c.height=r.height*d;}
addEventListener('resize',size);size();
var still=matchMedia('(prefers-reduced-motion: reduce)').matches;
function frame(now){var dt=Math.min(.05,(now-last)/1000);last=now;
  var W=c.width,H=c.height;g.clearRect(0,0,W,H);
  im.forEach(function(i){if(i.complete)g.drawImage(i,0,0,W,H);});
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

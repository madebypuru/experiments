// Paint motion base. Loaded before the main script; uses its helpers (clamp, lerp, smooth, rnd, hexRGB) at call time.
// See ../MOTION.md for the contract every base keeps.
// ---------- birds: real wingbeats (quick down, slower up), bursts of flapping between glides ----------
// Seen at a distance a bird reads as two bent wings; each wing is an arm (shoulder to wrist)
// and a hand (wrist to tip) that lags the arm, so the tip whips through at the bottom of the stroke.
const BIRD_KINDS={ // beats per second, beats per burst, glide seconds, wings held up in a glide (rad)
  small:{hz:7.5,beats:[3,6],glide:[.35,.8],hold:-.05,hand:-.12}, // swallows, swifts, sparrows: rapid, short dips
  mid:{hz:4.2,beats:[4,7],glide:[.8,1.6],hold:.12,hand:.02},    // crows, pigeons, generic birds
  big:{hz:2.6,beats:[2,4],glide:[1.6,3.2],hold:.3,hand:-.2},  // gulls, herons, terns: long soaring glides
};
const birdKind=name=>/swallow|swift|sparrow|martin|finch|starling/i.test(name)?'small':/gull|heron|tern|albatross|eagle|hawk|kite|stork|crane|pelican|cormorant/i.test(name)?'big':'mid';
function birdState(kind){const k=BIRD_KINDS[kind];return {k,kind,mode:'flap',left:Math.round(rnd(...k.beats)),ph:Math.random(),gt:0,y:0,vy:0};}
// advance a bird's wing clock; returns {e: arm angle, h: hand angle, lift: body rise} (angles: + is up)
function birdStep(b,dt){
  const k=b.k;let e,h,lift;
  if(b.mode==='flap'){b.ph+=dt*k.hz;
    if(b.ph>=1){b.ph-=1;if(--b.left<=0){b.mode='glide';b.gt=rnd(...k.glide);}}
    const down=.42; // the downstroke takes 42% of a beat and is the fast, powerful half
    const arm=p=>p<down?lerp(.85,-.6,smooth(0,1,p/down)):lerp(-.6,.85,smooth(0,1,(p-down)/(1-down)));
    e=arm(b.ph);h=arm((b.ph+.92)%1)*1.15;lift=-Math.sin(Math.PI*2*(b.ph-.1))*.06;}
  else{b.gt-=dt;const s=Math.sin(b.gt*2.2);e=k.hold+s*.03;h=k.hand+s*.04;lift=0; // gulls glide in an M: arms up, wingtips down
    if(b.gt<=0){b.mode='flap';b.left=Math.round(rnd(...k.beats));b.ph=0;}}
  // the body sinks a little in a glide and climbs back with the beats (in wingspans)
  b.vy+=((b.mode==='glide'?.25:-.2)-b.vy)*Math.min(1,dt*1.5);b.y=clamp(b.y+b.vy*dt,-.6,.6);
  return {e,h,lift:lift+b.y*.5};
}
// draw at screen (x, y) with wingspan Wd px, facing dir (±1); tilt (radians) follows the path
function drawBird(g,x,y,Wd,w,dir,tilt,col,alpha){
  const r=Wd/2,arm=r*.46,hand=r*.6;
  // in the painting's medium: a crisp pen stroke in ink, a soft brushed one in watercolour, a heavier opaque one in gouache
  const md=medium(),lwk=md==='gouache'?1.35:md==='watercolour'?1.1:1;
  g.save();g.globalAlpha=alpha*(md==='watercolour'?.82:1);if(md==='watercolour')g.filter='blur(.35px)';g.translate(x,y+w.lift*Wd);g.rotate(tilt);g.scale(dir,1);
  const lw=Math.max(.9,Wd*.05)*lwk;g.strokeStyle=col;g.fillStyle=col;g.lineCap='round';g.lineJoin='round';
  for(const [side,k] of [[-1,.9],[1,1]]){ // far wing a touch shorter: it's foreshortened
    const sh=[side*r*.05,0],wr=[sh[0]+side*arm*k*Math.cos(w.e),-arm*k*Math.sin(w.e)],tp=[wr[0]+side*hand*k*Math.cos(w.h),wr[1]-hand*k*Math.sin(w.h)];
    g.beginPath();g.moveTo(sh[0],sh[1]);g.quadraticCurveTo((sh[0]+wr[0])/2,(sh[1]+wr[1])/2-arm*.18,wr[0],wr[1]);g.lineWidth=lw*1.3;g.stroke();
    g.beginPath();g.moveTo(wr[0],wr[1]);g.quadraticCurveTo((wr[0]+tp[0])/2,(wr[1]+tp[1])/2-hand*.12,tp[0],tp[1]);g.lineWidth=lw*.75;g.stroke();}
  // a small body with a head toward the direction of travel
  g.beginPath();g.ellipse(r*.03,r*.02,Math.max(1.1,r*.14),Math.max(.7,r*.055),0,0,7);g.fill();
  g.beginPath();g.arc(r*.16,-r*.01,Math.max(.6,r*.045),0,7);g.fill();
  g.restore();
}


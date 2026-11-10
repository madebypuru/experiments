// Paint motion base: things that float (boats, ducks, swans). They rock and bob on the swell, more when
// the wind is up, and leave a small V wake when they move. See ../MOTION.md.
//
// Real numbers: a small boat rolls with a period of 3-6 s and a few degrees; it heaves (bobs) more slowly.
// A duck bobs faster and barely rolls. A boat that should stay moored gets a path of zero length.
const FLOATS={
  boat:{roll:.055,rollHz:.22,heave:.025,heaveHz:.16},
  duck:{roll:.03,rollHz:.45,heave:.04,heaveHz:.42},
};
function floatState(name){const k=/duck|swan|goose|coot|gull.*water/i.test(name)?FLOATS.duck:FLOATS.boat;return {k,a:0,v:0,ph:Math.random()*6.28,ph2:Math.random()*6.28,dist:0,last:null};}
function boatFrame(g,sp,q,cx,cy,sx,sy,flip,size,alpha,dt){
  const b=sp.boat,k=b.k,t=WORLD.clock,swell=.6+.5*Math.min(2,Math.abs(WORLD.wind));
  // a boat is wide: fade it by the painted area at both ends of the hull, more strictly than a point
  {const I=IM,sc=I.scene,fu=x=>{const gx=Math.round(clamp((x-sc.view.x)/sc.view.w,0,1)*(I.gw-1)),gy=Math.round(clamp((q.y-sc.view.y)/sc.view.h,0,1)*(I.gh-1));return I.Fu[gy*I.gw+gx];};
    const half=Math.max(Math.abs(sp.ox),Math.abs(sp.ox+sp.bw))*size; // either way it faces
    alpha*=smooth(.45,.85,Math.min(fu(q.x-half),fu(q.x+half)));if(alpha<.01)return;}
  // roll: a damped pendulum pushed by the waves, so it settles and lurches instead of ticking like a metronome
  const push=(Math.sin(t*6.283*k.rollHz+b.ph)+.45*Math.sin(t*6.283*k.rollHz*1.7+b.ph*1.3))*k.roll*swell;
  const w0=6.283*k.rollHz;b.v+=(-w0*w0*b.a-1.2*b.v+w0*w0*push)*dt;b.a+=b.v*dt;
  const heave=Math.sin(t*6.283*k.heaveHz+b.ph2)*k.heave*sp.bh*size;
  // waterline: the origin if the drawing sits on it, else low in the drawing
  const wl=clamp(0,sp.oy+sp.bh*.55,sp.oy+sp.bh*.95);
  // wake: two dashes trailing from the stern, only while moving
  const moving=b.last&&Math.hypot(q.x-b.last[0],q.y-b.last[1])>1e-3;b.last=[q.x,q.y];
  if(moving){const stern=(sp.ox)*size,len=sp.bw*size*.7,spread=sp.bw*size*.11;g.save();g.translate(cx,cy+wl*size*sy);g.scale(flip*sx,sy);
    g.strokeStyle=`rgba(30,46,74,${(.3*alpha).toFixed(3)})`;g.lineWidth=Math.max(.8/sx,sp.bw*size*.012);g.lineCap='round';
    for(const s of [-1,1]){g.beginPath();g.moveTo(stern,0);g.quadraticCurveTo(stern-len*.5,s*spread*.4,stern-len,s*spread);g.stroke();}g.restore();}
  g.save();g.globalAlpha=alpha;g.translate(cx,cy+heave*sy+wl*size*sy);g.rotate(b.a*flip);g.translate(0,-wl*size*sy);g.scale(flip*size,size);
  g.drawImage(sp.img,sp.ox*sx,sp.oy*sy,sp.bw*sx,sp.bh*sy);g.restore();
}

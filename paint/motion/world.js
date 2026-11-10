// Paint motion base: the shared world. Every base reads these instead of keeping its own constants,
// so when the wind gusts the clouds, smoke, ripples and boats all answer it together. See ../MOTION.md.
const WORLD={
  clock:0,
  base:.35,      // the steady breeze; + blows to the right
  wind:.35,      // what everything feels right now: breeze + slow drift + gusts, about -2.4..2.4
  gust:0,
};
function worldStep(dt){
  const W_=WORLD;W_.clock+=dt;const t=W_.clock;
  // a gust every 10 s or so, mostly with the breeze, dying away over a few seconds
  if(Math.random()<dt*.1)W_.gust=(.5+Math.random()*.9)*(Math.random()<.85?Math.sign(W_.base||1):-Math.sign(W_.base||1));
  W_.gust*=Math.exp(-dt*.5);
  const aim=W_.base+.18*Math.sin(t*.21)+.1*Math.sin(t*.67+1.3)+W_.gust;
  W_.wind+=(aim-W_.wind)*Math.min(1,dt*2);
}
// seeded randomness for anything that should look the same every time (placement); motion uses Math.random
function seeded(seed=11){let s=seed;return (a=0,b=1)=>{s=(s*16807)%2147483647;return a+((s-1)/2147483646)*(b-a);};}

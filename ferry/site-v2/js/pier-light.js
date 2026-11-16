// Beat 1's light, one full-screen pass. The Paint plate (water and quay, with Paint's own brushed top edge) and
// the live dock layer (boats, ripples, waves, drawn in screen space) are laid on open water painted here in gouache-like dabs, so the sea
// goes on past the plate when the dock slides away. Then the hour's light is glazed over it: unevenly, drifting,
// with a path of brushed sun on the water at dusk that turns to moonlight at night.
export const vertex = /* glsl */`
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

export const fragment = /* glsl */`
precision highp float;
uniform sampler2D uPlate, uDyn;
uniform vec2 uView;          // css px
uniform float uDpr, uT;
uniform vec3 uCam;           // plate origin on screen (css px) and plate scale
uniform vec2 uPlateSize;
uniform float uDusk, uNight, uMorning, uFade, uPath;
uniform vec3 uBg;

float h12(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n = h12(p); return vec2(n, h12(p+n+17.3)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h12(i), h12(i+vec2(1,0)), f.x), mix(h12(i+vec2(0,1)), h12(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for(int i = 0; i < 3; i++){ s += a*vn(p); p = p*2.03+vec2(1.7,9.2); a *= .5; } return s/.875; }

// the plate's own water, sampled from the Paint plate: deep green, teal grey, a lighter wash
vec3 tone(float r){
  return (r < .3 ? vec3(.286,.333,.302) : r < .55 ? vec3(.215,.262,.252) : r < .78 ? vec3(.30,.345,.318) : vec3(.227,.282,.29))*.76;
}
// one layer of brush dabs: long, nearly level strokes with ragged ends and bristle streaks; the top dab wins
vec4 dabs(vec2 P, vec2 cell, float ang, float fill, float seed, float t){
  float ca = cos(ang), sa = sin(ang);
  vec2 q = mat2(ca, sa, -sa, ca)*P/cell, id = floor(q);
  vec4 o = vec4(0.); float best = -1.;
  for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){
    vec2 c = id+vec2(i,j);
    if(h12(c+seed*3.1) > fill) continue;
    vec2 hh = h22(c+seed);
    vec2 ctr = c+.5+(hh-.5)*vec2(.9,.5)+vec2(sin(t*.05+hh.x*6.28)*.06, 0.);
    vec2 d = q-ctr; float rr = (hh.y-.5)*.22; d = mat2(cos(rr), sin(rr), -sin(rr), cos(rr))*d;
    float e = pow(abs(d.x)/.86, 2.6)+pow(abs(d.y)/.34, 2.);
    e += (vn(P*.045+hh*50.)-.5)*.55+(vn(vec2(d.x*2.5, d.y*26.)+hh*9.)-.5)*.3;
    float a = 1.-smoothstep(.78, 1., e);
    if(a > .01 && hh.x > best){
      best = hh.x;
      float streak = .9+.2*vn(vec2(d.x*1.6, d.y*22.)+hh*7.);
      o = vec4(tone(fract(hh.y*7.13))*streak, a);
    }
  }
  return o;
}
vec3 openWater(vec2 P, float t){
  vec3 c = tone(.6)*(.92+.16*fbm(P*.0012));
  vec4 d;
  d = dabs(P, vec2(560., 150.), .03, .95, 1., t);  c = mix(c, d.rgb, d.a);
  d = dabs(P, vec2(320., 86.), -.05, .55, 7., t);  c = mix(c, d.rgb, d.a*.85);
  d = dabs(P, vec2(170., 42.), .02, .2, 13., t);   c = mix(c, d.rgb*1.05, d.a*.7);
  return c;
}
float luma(vec3 c){ return dot(c, vec3(.3,.59,.11)); }

void main(){
  vec2 S = vec2(gl_FragCoord.x, uDpr*uView.y-gl_FragCoord.y)/uDpr;   // css px, top-left origin
  vec2 P = (S-uCam.xy)/uCam.z;                                          // plate px
  float t = uT;
  vec3 col = openWater(P, t);
  float onPlate = step(0., P.x)*step(P.x, uPlateSize.x)*step(0., P.y)*step(P.y, uPlateSize.y);
  if(onPlate > 0.){
    vec2 uv = vec2(P.x/uPlateSize.x, 1.-P.y/uPlateSize.y);
    vec4 pl = texture2D(uPlate, uv);
    float wm = 1.-smoothstep(.34, .48, luma(pl.rgb));
    // the painted water breathes: a slow, wide warp of its strokes, never of the quay
    vec2 warp = (vec2(fbm(P*.0035+vec2(t*.035, 0.)), fbm(P*.0035+vec2(5.2, 1.3)-vec2(0., t*.03)))-.5)*9.*wm;
    pl = texture2D(uPlate, uv+warp/uPlateSize*vec2(1.,-1.));
    col = mix(col, pl.rgb, smoothstep(.35, .95, pl.a));   // Paint's brushed edge, without the paper caught in its fringe
  }
  float water = 1.-smoothstep(.34, .48, luma(col));
  vec4 dy = texture2D(uDyn, vec2(S.x/uView.x, 1.-S.y/uView.y));
  col = mix(col, dy.rgb, dy.a);
  water *= 1.-smoothstep(.1, .5, dy.a);
  float L = luma(col);
  // the hour's light, glazed unevenly; the glaze itself drifts like a wash still moving on the paper
  float glaze = .7+.6*fbm(P*.0011+vec2(t*.008, -t*.005));
  float side = .7+.45*S.x/uView.x;   // the low sun is off to the right
  vec3 dusk = col*vec3(.8,.78,.9)+vec3(.86,.6,.42)*pow(L, 1.25)*.95*glaze*side+vec3(.03,.03,.07)*(1.-L)*glaze*water;
  vec3 night = col*vec3(.4,.5,.56)+vec3(.42,.54,.58)*pow(L, 2.)*.22*glaze;
  vec3 morn = col*vec3(1.02,1.,.97)+vec3(.79,.8,.74)*pow(L, 1.2)*.08;
  col = dusk*uDusk+night*uNight+morn*uMorning;
  // the low sun's path on the water: short level strokes that move with the sea and come and go
  vec2 g = P/vec2(54., 11.), gid = floor(g), gh = h22(gid);
  vec2 gd = g-gid-.5-(gh-.5)*vec2(.4,.3);
  float pathX = (S.x/uView.x-uPath)/.11;
  float dens = exp(-pathX*pathX)*(.45+.55*(1.-S.y/uView.y));
  float on = step(gh.x, dens*.24);
  float flick = pow(.5+.5*sin(t*.42+gh.y*40.), 3.);
  float ge = pow(abs(gd.x)/(.18+.34*fract(gh.y*13.7)), 2.)+pow(abs(gd.y)/.26, 2.)+(vn(g*3.+gh*20.)-.5)*.5;
  float ga = on*(1.-smoothstep(.55, 1., ge))*flick*water;
  vec3 sun = mix(vec3(.9,.68,.5), vec3(.97,.84,.68), gh.y);
  vec3 moon = vec3(.62,.68,.7);
  col = mix(col, sun, ga*.6*uDusk);
  col = mix(col, moon, ga*.35*uNight);
  col *= .975+.05*h12(floor(gl_FragCoord.xy*.5));
  col = mix(col, uBg, uFade);
  gl_FragColor = vec4(col, 1.);
}`;

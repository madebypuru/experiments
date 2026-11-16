# Physically lit blind emboss / deboss on paper.
#
# The paper is a height map: fibre at three scales, stretched along the grain. The mark is pressed
# into it (deboss) or raised out of it (emboss) with rounded shoulders taken from the signed distance
# to the mark's edge. Pressing crushes the fibre flat (deboss floor) or stretches it a little (emboss top).
# The surface is lit by one directional light: normals from the height gradient, Lambert shading,
# and cast shadows found by marching toward the light. Nothing is painted on: every highlight and
# shadow comes from the geometry.
#
# Usage:
#   python3 emboss.py MASK.png OUT_PREFIX [--mode emboss|deboss --mm 9.5 --az 135 --el 32 --depth .08 ...]
# MASK is black-on-white, the mark filling most of the frame. Outputs, at 300 dpi for the given width:
#   OUT_PREFIX-lit.png      the paper patch fully lit (for studies)
#   OUT_PREFIX-mul.png      relief shading <= 1, to composite with mix-blend-mode: multiply
#   OUT_PREFIX-scr.png      relief shading  > 1, to composite with mix-blend-mode: screen
import argparse, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt, shift as nd_shift

ap=argparse.ArgumentParser()
ap.add_argument('mask'); ap.add_argument('out')
ap.add_argument('--mode',default='emboss'); ap.add_argument('--mm',type=float,default=9.5,help='printed width of the mark in mm')
ap.add_argument('--az',type=float,default=135,help='light azimuth, degrees: 135 = from the top left')
ap.add_argument('--el',type=float,default=32,help='light elevation above the paper, degrees (low = raking)')
ap.add_argument('--depth',type=float,default=.08,help='press depth in mm')
ap.add_argument('--shoulder',type=float,default=.4,help='shoulder width in mm')
ap.add_argument('--fibre',type=float,default=.009,help='fibre roughness in mm')
ap.add_argument('--albedo',default='236,230,218')
ap.add_argument('--seed',type=int,default=7)
ap.add_argument('--rotate',type=float,default=-.4,help='degrees, anticlockwise: a hand-fed press is never quite square. Applied before lighting, so the light stays put')
# defaults tuned by hand in print/emboss-tuner.html (Nov 12, 2026); same values as print/emboss.js
ap.add_argument('--dome',type=float,default=.37,help='how pillowy the top of an emboss is')
ap.add_argument('--ambient',type=float,default=.36,help='fill light: more = flatter')
ap.add_argument('--shadow',type=float,default=.68,help='strength of the shade layer')
ap.add_argument('--highlight',type=float,default=.32,help='strength of the light layer')
ap.add_argument('--hl-soft',type=float,default=6.4,help='blur on the highlights, simulation px at 620 px wide')
ap.add_argument('--shadow-soft',type=float,default=.8,help='blur on the shade, simulation px at 620 px wide')
ap.add_argument('--floor-lift',type=float,default=.048,help='deboss only: the crushed floor reads lighter')
a=ap.parse_args()

mimg=Image.open(a.mask).convert('L')
m0=np.asarray(mimg,dtype=np.float32)<128
ys,xs=np.where(m0); markw=xs.max()-xs.min()                                  # size taken from the square mark
m=np.asarray(mimg.rotate(a.rotate,resample=Image.BICUBIC,fillcolor=255),dtype=np.float32)<128  # True inside the mark
pxmm=markw/a.mm                                                              # simulation pixels per mm
rng=np.random.default_rng(a.seed)
def noise(sig):
    n=gaussian_filter(rng.standard_normal(m.shape).astype(np.float32),sig); return n/n.std()

# paper fibre, in mm: fine tooth, grain-stretched fibres, slow cockle
fib=(.45*noise((.03*pxmm,.03*pxmm))+.4*noise((.05*pxmm,.2*pxmm))+.3*noise((.5*pxmm,.5*pxmm)))*a.fibre

# signed distance to the mark edge in mm (positive inside)
sd=(distance_transform_edt(m)-distance_transform_edt(~m))/pxmm
def smoothstep(e0,e1,x):
    t=np.clip((x-e0)/(e1-e0),0,1); return t*t*(3-2*t)
w=a.shoulder
if a.mode=='emboss':
    t=smoothstep(-.4*w,.7*w,sd)
    relief=a.depth*(t+a.dome*(1-np.exp(-np.clip(sd,0,None)/(2.5*w))))         # pillowy top
    texamp=1-.18*t                                                          # fibre stretched a little on top
else:
    t=smoothstep(-.15*w,.55*w,sd)
    relief=-a.depth*t+.05*a.depth*np.exp(-((sd+.55*w)/(.45*w))**2)          # steeper wall, faint lip outside
    texamp=1-.5*t                                                           # fibre crushed flatter on the floor
relief=gaussian_filter(relief,.06*pxmm)

def lit(H):
    gy,gx=np.gradient(H*pxmm)                                               # slopes (height mm per mm)
    n=np.dstack([-gx,-gy,np.ones_like(H)]); n/=np.linalg.norm(n,axis=2,keepdims=True)
    az,el=np.radians(a.az),np.radians(a.el)
    L=np.array([np.cos(az)*np.cos(el),-np.sin(az)*np.cos(el),np.sin(el)])   # az from +x anticlockwise; image y points down
    diff=np.clip((n*L).sum(2),0,None)
    # cast shadows: march toward the light, compare terrain with the ray
    u=-L[:2]/np.linalg.norm(L[:2]); tanE=np.tan(el); sh=np.zeros_like(H)
    for k in range(1,int(1.2*w*pxmm)+2,2):
        Hk=nd_shift(H,(u[1]*k,u[0]*k),order=1,mode='nearest')
        sh=np.maximum(sh,np.clip((Hk-(H+k/pxmm*tanE))*pxmm*4,0,1))
    sh=gaussian_filter(sh,.05*pxmm)
    amb=a.ambient
    return (amb+(1-amb)*diff*(1-.6*sh))/(amb+(1-amb)*L[2])

H=relief+fib*texamp
S=lit(H); S0=lit(fib)                                                       # with and without the press
# for compositing over a card that has its own grain: the press lit on smooth paper, so the card's grain
# shows through unchanged; the crushed floor of a deboss reads as a slight, even lift (fewer fibre shadows)
R=lit(relief)/lit(np.zeros_like(relief))
if a.mode!="emboss": R*=1+a.floor_lift*t

out=300/25.4*a.mm/markw                                                     # simulation px -> 300 dpi px
size=(max(1,int(m.shape[1]*out)),max(1,int(m.shape[0]*out)))
alb=np.array([int(v) for v in a.albedo.split(',')],dtype=np.float32)/255
litimg=np.clip(alb*S[...,None],0,1)
Image.fromarray((litimg*255).astype(np.uint8)).resize(size,Image.LANCZOS).save(a.out+'-lit.png')
k=m.shape[1]/620                                                            # softness is set at 620 px wide
mul=gaussian_filter(1+np.minimum(R-1,0)*a.shadow,a.shadow_soft*k)
Image.fromarray((np.clip(mul,0,1)*255).astype(np.uint8)).resize(size,Image.LANCZOS).save(a.out+'-mul.png')
b=float(alb.mean()); scr=gaussian_filter(np.clip(b*np.maximum(R-1,0)*a.highlight/(1-b),0,1),a.hl_soft*k)
Image.fromarray((scr*255).astype(np.uint8)).resize(size,Image.LANCZOS).save(a.out+'-scr.png')
print(f'{a.mode}: mark {a.mm} mm, {size[0]}x{size[1]} px at 300 dpi; relief range {R.min():.3f}..{R.max():.3f}')

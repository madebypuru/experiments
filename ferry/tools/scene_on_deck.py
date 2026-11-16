# Writes scenes/x-header-deck.svg: on the ferry's deck nearing the arrival harbour, ink and wash. Paint scene format.
import random, os
random.seed(5)
W,H=1500,500
o=[];e=o.append
e(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" data-paint="1" data-title="Ferry: nearly there" data-focus="560 250" data-style="ink-wash">')
e('''<!-- plan
subject: the arrival harbour ahead, left of centre: a stepped stone pier with a small white lighthouse at its end (x 180 to 620)
view: standing on the ferry's deck, eye level 9 m above the sea, horizon y 205; the deck's rail and a life ring in the near right
scale: harbour about 3 units per metre (lighthouse 12 m = 40); deck near us about 40 units per metre (rail 1.1 m = 44, life ring 0.75 m = 30, people 1.7 m = 68)
light: soft late-morning light from the left, pale shadows to the right
palette: pale sky blue, blue-grey hills, mint sea, ochre stone, white rail and lighthouse, sage deck, one orange life ring
people: two passengers and a dog at the rail, standing still, looking at the harbour
-->''')
e('''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc6e0"/><stop offset="1" stop-color="#e2ecec"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe2dc"/><stop offset="1" stop-color="#9fc9bf"/></linearGradient>
</defs>''')
e(f'<rect x="0" y="0" width="{W}" height="207" fill="url(#sky)" data-role="sky"/>')
# far hills, two ranges
e('<path d="M 0 207 L 0 176 L 60 168 L 110 178 L 170 160 L 240 172 L 320 166 L 420 180 L 520 176 L 600 190 L 700 199 L 760 207 Z" fill="#b8c6d0" data-role="mountain"/>')
e('<path d="M 820 207 L 900 194 L 980 186 L 1050 190 L 1130 176 L 1210 182 L 1300 172 L 1390 180 L 1500 174 L 1500 207 Z" fill="#c2cfd6" data-role="mountain"/>')
e('<path d="M 0 207 L 0 192 L 140 188 L 300 196 L 420 200 L 520 207 Z" fill="#a9b8b6" data-role="hill"/>')
e(f'<rect x="0" y="205" width="{W}" height="{H-205}" fill="url(#sea)" data-role="water"/>')
e('<g data-role="water">')
for i in range(60):
    y=random.uniform(215,495); t=(y-205)/295
    x=random.uniform(0,1500); w=random.uniform(10,40)*(.4+t)
    e(f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{1+t*1.2:.1f}" fill="#7fa9a2" opacity="0.6"/>')
e('</g>')
# breakwater far right with a small beacon
e('<g data-role="wall"><rect x="880" y="226" width="300" height="12" fill="#c7b089"/><rect x="880" y="226" width="300" height="3" fill="#ddc9a2"/></g>')
e('<rect x="905" y="206" width="6" height="20" fill="#e9e6df" data-role="prop"/><rect x="903" y="203" width="10" height="5" fill="#c4553a" data-role="prop"/>')
# the arrival pier: stepped stone wall, three steps down toward the harbour mouth (the mark's step)
e('<g data-role="wall">')
e('<path d="M 120 236 L 470 236 L 470 246 L 540 246 L 540 258 L 610 258 L 610 290 L 120 290 Z" fill="#c9b08a"/>')
e('<path d="M 120 236 L 470 236 L 470 240 L 120 240 Z" fill="#e0ccaa"/><path d="M 470 246 L 540 246 L 540 250 L 470 250 Z" fill="#e0ccaa"/><path d="M 540 258 L 610 258 L 610 262 L 540 262 Z" fill="#e0ccaa"/>')
for x in range(130,610,22):
    e(f'<rect x="{x}" y="{262 if x>540 else (250 if x>470 else 242)}" width="1.5" height="{28 if x>540 else (40 if x>470 else 48)}" fill="#a68d68"/>')
e('</g>')
e('<path d="M 120 290 L 610 290 L 640 302 L 130 302 Z" fill="#8fb6ad" opacity="0.7" data-role="shadow"/>')
# lighthouse at the pier end
e('<g data-role="building"><rect x="570" y="212" width="22" height="46" fill="#f2efe8"/><rect x="583" y="212" width="9" height="46" fill="#dcd8cf"/></g>')
e('<rect x="567" y="208" width="28" height="5" fill="#d9d4c8" data-role="prop"/>')
e('<rect x="574" y="196" width="14" height="12" fill="#f6e7b8" data-role="lamp"/>')
e('<polygon points="571,196 581,186 591,196" fill="#2f3b48" data-role="roof"/>')
e('<rect x="579" y="230" width="4" height="6" fill="#3d5266" data-role="window"/>')
# a few harbour houses behind the pier
for i,(x,w,c,r) in enumerate([(150,40,"#efe7d6","#b85a3c"),(196,30,"#e6dccb","#6c8496"),(232,46,"#f0e9da","#b85a3c"),(286,34,"#e9e0cd","#8a6c56")]):
    h=26+i%2*6
    e(f'<g data-role="building"><rect x="{x}" y="{236-h}" width="{w}" height="{h}" fill="{c}"/></g>')
    e(f'<polygon points="{x-2},{236-h} {x+w/2},{236-h-12} {x+w+2},{236-h}" fill="{r}" data-role="roof"/>')
    e(f'<rect x="{x+w*.3}" y="{236-h+8}" width="6" height="7" fill="#3d5266" data-role="window"/>')
# a moored boat in the harbour
e('<g data-role="vehicle"><path d="M 340 296 L 392 296 L 386 304 L 346 304 Z" fill="#c4553a"/><rect x="356" y="288" width="16" height="8" fill="#f2efe8"/></g>')
# THE DECK (near, bottom right): sage deck, white rail along its edge
e('<path d="M 640 500 L 820 430 L 1500 330 L 1500 500 Z" fill="#a9c39a" data-role="ground"/>')
e('<path d="M 640 500 L 820 430 L 1500 330 L 1500 342 L 830 440 L 662 500 Z" fill="#8fae86" data-role="ground"/>')
e('<g data-role="prop">')
# rail: top bar, mid bar, posts (thin strokes are allowed for rails)
e('<path d="M 650 452 L 830 386 L 1500 288" fill="none" stroke="#f4f2ec" stroke-width="7" stroke-linecap="round"/>')
e('<path d="M 652 474 L 830 410 L 1500 310" fill="none" stroke="#f4f2ec" stroke-width="3"/>')
import math
for i in range(18):
    t=i/17
    if t<0.21: x=650+(830-650)*t/0.21; y0=452+(386-452)*t/0.21; y1=500+(430-500)*t/0.21
    else: u=(t-0.21)/0.79; x=830+(1500-830)*u; y0=386+(288-386)*u; y1=430+(330-430)*u
    e(f'<line x1="{x:.0f}" y1="{y0:.0f}" x2="{x:.0f}" y2="{y1+4:.0f}" stroke="#f4f2ec" stroke-width="3"/>')
e('</g>')
# life ring hanging on the rail, the warm accent
e('<g data-role="prop"><circle cx="905" cy="404" r="21" fill="#e98a2c"/><circle cx="905" cy="404" r="10" fill="#a9c39a"/>')
for a in (45,135,225,315):
    ax=905+15*math.cos(math.radians(a)); ay=404+15*math.sin(math.radians(a))
    e(f'<circle cx="{ax:.1f}" cy="{ay:.1f}" r="5" fill="#f6f1e6"/>')
e('</g>')
# deck lamp post
e('<rect x="1338" y="70" width="5" height="240" fill="#f0eee8" data-role="prop"/><rect x="1328" y="64" width="24" height="9" fill="#e6e2d8" data-role="prop"/><rect x="1332" y="73" width="16" height="7" fill="#f6e7b8" data-role="lamp"/>')
# two passengers and a dog at the rail, standing, looking left
def person(x,base,h,top,legs,hair):
    hd=h/7
    e(f'<g data-role="figure"><rect x="{x-hd*0.7}" y="{base-h*0.47}" width="{hd*0.6}" height="{h*0.47}" fill="{legs}"/><rect x="{x+hd*0.1}" y="{base-h*0.47}" width="{hd*0.6}" height="{h*0.47}" fill="{legs}"/>'
      f'<rect x="{x-hd*0.95}" y="{base-h*0.84}" width="{hd*1.9}" height="{h*0.4}" fill="{top}"/><circle cx="{x}" cy="{base-h*0.92}" r="{hd*0.5}" fill="#e3b99a"/>'
      f'<path d="M {x-hd*0.5} {base-h*0.93} Q {x} {base-h*1.02} {x+hd*0.5} {base-h*0.93} Z" fill="{hair}"/></g>')
person(1180,346,70,"#2f5f86","#3b3f4a","#4a3226")
person(1222,340,66,"#c4553a","#e9e1cf","#2a2320")
e('<g data-role="animal"><rect x="1248" y="322" width="26" height="11" fill="#2b2a2e"/><rect x="1270" y="314" width="9" height="10" fill="#2b2a2e"/><rect x="1250" y="331" width="3" height="10" fill="#2b2a2e"/><rect x="1268" y="331" width="3" height="10" fill="#2b2a2e"/></g>')
e('<path d="M 1160 346 L 1290 342 L 1300 350 L 1170 354 Z" fill="#7f9c78" opacity="0.6" data-role="shadow"/>')
# gulls over the harbour
e('<g data-sprite="gull" data-path="M -60 120 C 300 90, 700 140, 1560 100" data-duration="15" data-delay="0" data-repeat="loop"><path d="M -11 0 Q -5 -5 0 0 Q 5 -5 11 0" fill="none" stroke="#3b3a3f" stroke-width="2"/></g>')
e('<g data-sprite="gull" data-path="M 1560 160 C 1100 130, 600 170, -60 140" data-duration="20" data-delay="7" data-repeat="loop"><path d="M -8 0 Q -4 -4 0 0 Q 4 -4 8 0" fill="none" stroke="#3b3a3f" stroke-width="1.8"/></g>')
e('</svg>')
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','scenes','x-header-deck.svg')
open(p,'w').write('\n'.join(o)); print('wrote',os.path.normpath(p))

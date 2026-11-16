# Writes scenes/x-header.svg: the Ferry X header as a Paint scene (paint-skill format).
# Run: python3 tools/x_header_scene.py
import random, os
random.seed(7)
W,H=1500,500
HZ=300                      # horizon
out=[]
def e(s): out.append(s)

def tree(cx,base,h,wid,greens,n=26):
    # trunk + many leaf clusters, lighter on the lit (left) side and top
    e(f'<path d="M {cx-2.5} {base} L {cx-1.5} {base-h*.45} L {cx+1.5} {base-h*.45} L {cx+2.5} {base} Z" fill="#5a4636" data-role="trunk"/>')
    e('<g data-role="foliage">')
    cy=base-h*.62
    for i in range(n):
        dx=random.gauss(0,wid*.28); dy=random.gauss(0,h*.2)
        r=random.uniform(wid*.12,wid*.22)
        lit=(dx<0)+(dy<0)
        c=greens[min(len(greens)-1,max(0,2-lit+random.choice([0,0,1])))]
        e(f'<ellipse cx="{cx+dx:.1f}" cy="{cy+dy:.1f}" rx="{r:.1f}" ry="{r*.85:.1f}" fill="{c}"/>')
    e('</g>')

def clouds(cx,cy,w,n=11):
    e('<g data-role="cloud">')
    for i in range(n):
        e(f'<ellipse cx="{cx+random.uniform(-w/2,w/2):.0f}" cy="{cy+random.uniform(-9,6):.0f}" rx="{random.uniform(w*.12,w*.22):.0f}" ry="{random.uniform(9,17):.0f}" fill="#fbfaf6"/>')
    e(f'<ellipse cx="{cx}" cy="{cy+12}" rx="{w*.55:.0f}" ry="6" fill="#d9e3ec"/>')
    e('</g>')

def house(x,y,w,h,wall,side,roof,flip=False):
    # front face, a darker side face, overhanging roof, recessed windows, a door
    sw=w*.35
    sx=x-sw if not flip else x+w
    e(f'<g data-role="building"><rect x="{x}" y="{y-h}" width="{w}" height="{h}" fill="{wall}"/>'
      f'<polygon points="{sx},{y-h+4} {sx+sw},{y-h} {sx+sw},{y} {sx},{y-2}" fill="{side}"/></g>' if not flip else
      f'<g data-role="building"><rect x="{x}" y="{y-h}" width="{w}" height="{h}" fill="{wall}"/>'
      f'<polygon points="{x+w},{y-h} {x+w+sw},{y-h+4} {x+w+sw},{y-2} {x+w},{y}" fill="{side}"/></g>')
    rx0=x-4-(sw if not flip else 0); rx1=x+w+4+(sw if flip else 0)
    e(f'<polygon points="{rx0},{y-h+2} {(x+x+w)/2},{y-h-h*.55} {rx1},{y-h+2}" fill="{roof}" data-role="roof"/>')
    # windows: frame then darker glass
    for i,wx in enumerate([x+w*.18,x+w*.62]):
        e(f'<rect x="{wx-1}" y="{y-h*.72-1}" width="{w*.2+2}" height="{h*.26+2}" fill="#f4efe4"/>')
        e(f'<rect x="{wx}" y="{y-h*.72}" width="{w*.2}" height="{h*.26}" fill="#3d5266" data-role="window" data-light="{1 if i==0 else 2}"/>')
    e(f'<rect x="{x+w*.42-1}" y="{y-h*.42-1}" width="{w*.17+2}" height="{h*.42+1}" fill="#f4efe4"/>')
    e(f'<rect x="{x+w*.42}" y="{y-h*.42}" width="{w*.17}" height="{h*.42}" fill="#6a4a3a" data-role="door"/>')

e(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" data-paint="1" data-title="Ferry: safe passage" data-focus="905 380" data-style="watercolour">')
e('''<!-- plan
subject: one small passenger ferry under way, right of centre (x 840 to 970), crossing from the left shore to the right
eye level: 6 m above the water, horizon y 300 (sky is the top 60 percent, kept open in the centre for a headline)
scale: 7 units per metre far side, about 9 near the quays (ferry 18 m long = 140; houses 7 m wide = 56; lamp 4.5 m = 38)
light: late morning sun from the upper left; shadow sides and cast shadows fall right; reflections broken in the water
palette: sky blues, deep water blue and teal, field greens, warm ochre stone, cream walls, one terracotta accent on the ferry and roofs
motion: the ferry under way (sprite for the loop version, drawn still here), two gulls at different heights, water ripples automatic
shores: two stepped quays facing each other across the channel, echoing the two halves of the Ferry mark
-->''')
e('''<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fa9d8"/><stop offset="0.55" stop-color="#a9cde6"/><stop offset="1" stop-color="#e9eee6"/></linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d3dc"/><stop offset="0.25" stop-color="#7fb0c4"/><stop offset="0.7" stop-color="#3f7fa6"/><stop offset="1" stop-color="#2b6189"/></linearGradient>
<linearGradient id="field" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb36a"/><stop offset="1" stop-color="#6c9a52"/></linearGradient>
</defs>''')
e(f'<rect x="0" y="0" width="{W}" height="{HZ+2}" fill="url(#sky)" data-role="sky"/>')
clouds(170,92,250); clouds(1330,70,240); clouds(1190,150,150,7); clouds(330,175,160,7)
# distant hills behind the channel
e(f'<path d="M 0 {HZ} L 0 262 Q 120 248 240 258 Q 360 244 470 270 Q 560 284 640 {HZ} Z" fill="#a9bfc9" data-role="hill"/>')
e(f'<path d="M 860 {HZ} Q 960 280 1060 270 Q 1180 250 1300 258 Q 1400 246 1500 254 L 1500 {HZ} Z" fill="#a9bfc9" data-role="hill"/>')
e(f'<path d="M 600 {HZ} Q 700 291 800 293 Q 860 290 900 {HZ} Z" fill="#c3d2d6" data-role="hill"/>')
# water
e(f'<rect x="0" y="{HZ}" width="{W}" height="{H-HZ}" fill="url(#sea)" data-role="water"/>')
e('<g data-role="water">')
for i in range(70):
    y=random.uniform(HZ+6,H-4); t=(y-HZ)/(H-HZ)
    x=random.uniform(380,1120); w=random.uniform(20,90)*(.5+t)
    e(f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{1+t*1.5:.1f}" fill="{"#e2eef2" if t<.5 else "#9cc3d6"}" opacity="0.7"/>')
for i in range(28):
    y=random.uniform(HZ+40,H-10); x=random.uniform(400,1100); w=random.uniform(40,120)
    e(f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="3" fill="#2e6a92" opacity="0.5"/>')
e('</g>')

# LEFT SHORE (departure): land, trees, terminal, stepped quay, jetty, lamp
e(f'<path d="M 0 {HZ-34} Q 120 {HZ-44} 250 {HZ-30} L 330 {HZ-22} L 330 {HZ+10} L 0 {HZ+10} Z" fill="url(#field)" data-role="grass"/>')
tree(40,HZ-30,70,64,["#2f5a3a","#3f7446","#5c9152","#7fae62"],30)
tree(95,HZ-34,54,48,["#2f5a3a","#3f7446","#5c9152","#7fae62"],22)
tree(300,HZ-22,46,40,["#2f5a3a","#3f7446","#5c9152","#7fae62"],18)
house(150,HZ-22,58,44,"#f2ebdc","#d9cdb6","#c45c3c")
# stepped quay (three steps down toward the channel, like the mark's inner edge)
e('<g data-role="wall">')
e(f'<path d="M 0 {HZ+8} L 330 {HZ+8} L 330 {HZ+30} L 372 {HZ+30} L 372 {HZ+58} L 404 {HZ+58} L 404 {HZ+120} L 0 {HZ+120} Z" fill="#c9b48a"/>')
e(f'<path d="M 330 {HZ+8} L 342 {HZ+8} L 342 {HZ+30} L 330 {HZ+30} Z" fill="#a8946c"/>')
e(f'<path d="M 372 {HZ+30} L 384 {HZ+30} L 384 {HZ+58} L 372 {HZ+58} Z" fill="#a8946c"/>')
e(f'<path d="M 404 {HZ+58} L 416 {HZ+58} L 416 {HZ+120} L 404 {HZ+120} Z" fill="#a8946c"/>')
e(f'<rect x="0" y="{HZ+120}" width="416" height="{H-HZ-120}" fill="#b29d74"/>')
e('</g>')
for x,y in [(70,HZ+8),(220,HZ+8),(350,HZ+30),(390,HZ+58)]:
    e(f'<rect x="{x}" y="{y-9}" width="7" height="9" fill="#4a4a52" data-role="prop"/>')
# pier lamp
e(f'<rect x="318" y="{HZ-30}" width="3" height="38" fill="#3c3f48" data-role="prop"/>')
e(f'<circle cx="319.5" cy="{HZ-32}" r="5" fill="#f3e2b0" data-role="lamp" data-light="1"/>')
e(f'<path d="M 416 {HZ+70} L 470 {HZ+70} L 470 {HZ+130} L 416 {HZ+130} Z" fill="#2c5f84" opacity="0.6" data-role="shadow"/>')

# RIGHT SHORE (arrival), mirrored
e(f'<path d="M 1500 {HZ-38} Q 1380 {HZ-46} 1250 {HZ-30} L 1170 {HZ-22} L 1170 {HZ+10} L 1500 {HZ+10} Z" fill="url(#field)" data-role="grass"/>')
tree(1460,HZ-34,74,66,["#2f5a3a","#3f7446","#5c9152","#7fae62"],30)
tree(1400,HZ-36,52,46,["#2f5a3a","#3f7446","#5c9152","#7fae62"],22)
tree(1205,HZ-24,44,38,["#2f5a3a","#3f7446","#5c9152","#7fae62"],18)
house(1270,HZ-24,62,46,"#f2ebdc","#d9cdb6","#5f7f96",flip=True)
e('<g data-role="wall">')
e(f'<path d="M 1500 {HZ+8} L 1170 {HZ+8} L 1170 {HZ+30} L 1128 {HZ+30} L 1128 {HZ+58} L 1096 {HZ+58} L 1096 {HZ+120} L 1500 {HZ+120} Z" fill="#c9b48a"/>')
e(f'<rect x="1096" y="{HZ+120}" width="404" height="{H-HZ-120}" fill="#b29d74"/>')
e('</g>')
for x,y in [(1420,HZ+8),(1280,HZ+8),(1148,HZ+30),(1104,HZ+58)]:
    e(f'<rect x="{x}" y="{y-9}" width="7" height="9" fill="#4a4a52" data-role="prop"/>')
e(f'<rect x="1180" y="{HZ-30}" width="3" height="38" fill="#3c3f48" data-role="prop"/>')
e(f'<circle cx="1181.5" cy="{HZ-32}" r="5" fill="#f3e2b0" data-role="lamp" data-light="2"/>')

# reflections of the quays, broken
e('<g data-role="water">')
for i in range(14):
    y=HZ+124+i*5; e(f'<rect x="{random.uniform(0,40):.0f}" y="{y}" width="{random.uniform(320,400):.0f}" height="2" fill="#8a7c5e" opacity="0.35"/>')
e('</g>')

# THE FERRY (still, under way to the right), waterline y 392
fx,wl=840,392
e('<g data-role="vehicle">')
e(f'<path d="M {fx} {wl-14} L {fx+140} {wl-14} L {fx+128} {wl} L {fx+10} {wl} Z" fill="#1f4a6b"/>')          # hull
e(f'<rect x="{fx+2}" y="{wl-19}" width="{136}" height="5" fill="#f4efe4"/>')                                   # rail line
e(f'<rect x="{fx+22}" y="{wl-38}" width="92" height="19" fill="#f4efe4"/>')                                    # cabin
e(f'<rect x="{fx+22}" y="{wl-38}" width="92" height="4" fill="#dcd4c2"/>')
for i in range(7):
    e(f'<rect x="{fx+28+i*12}" y="{wl-31}" width="8" height="7" fill="#3d5266" data-role="window" data-light="3"/>')
e(f'<rect x="{fx+70}" y="{wl-52}" width="34" height="14" fill="#f4efe4"/>')                                   # wheelhouse
e(f'<rect x="{fx+74}" y="{wl-49}" width="26" height="5" fill="#3d5266" data-role="window" data-light="3"/>')
e(f'<rect x="{fx+52}" y="{wl-56}" width="11" height="18" fill="#c45c3c"/>')                                   # funnel, the warm accent
e(f'<rect x="{fx+52}" y="{wl-56}" width="11" height="3" fill="#2a2a30"/>')
e('</g>')
# wake (two light lines spreading back toward the departure shore) and reflection
e('<g data-role="water">')
e(f'<path d="M {fx+6} {wl-2} Q {fx-120} {wl+6} {fx-300} {wl+26} L {fx-300} {wl+30} Q {fx-118} {wl+11} {fx+6} {wl+3} Z" fill="#eef5f7" opacity="0.85"/>')
e(f'<path d="M {fx+6} {wl-6} Q {fx-120} {wl-10} {fx-280} {wl-18} L {fx-280} {wl-15} Q {fx-118} {wl-6} {fx+6} {wl-2} Z" fill="#eef5f7" opacity="0.6"/>')
for i in range(6):
    e(f'<rect x="{fx+10+random.uniform(-6,6):.0f}" y="{wl+3+i*5}" width="{random.uniform(80,124):.0f}" height="2.5" fill="#24506f" opacity="0.45"/>')
e(f'<rect x="{fx+56}" y="{wl+4}" width="9" height="10" fill="#b8613f" opacity="0.4"/>')
e('</g>')

# gulls (animated version only)
e('<g data-sprite="gull" data-path="M -60 150 C 400 110, 900 170, 1560 120" data-duration="14" data-delay="0" data-repeat="loop"><path d="M -11 0 Q -5 -5 0 0 Q 5 -5 11 0" fill="none" stroke="#3b3a3f" stroke-width="2"/></g>')
e('<g data-sprite="gull" data-path="M 1560 210 C 1100 180, 600 230, -60 190" data-duration="19" data-delay="6" data-repeat="loop"><path d="M -8 0 Q -4 -4 0 0 Q 4 -4 8 0" fill="none" stroke="#3b3a3f" stroke-width="1.8"/></g>')
e('</svg>')
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','scenes','x-header.svg')
open(p,'w').write('\n'.join(out)); print('wrote',os.path.normpath(p))

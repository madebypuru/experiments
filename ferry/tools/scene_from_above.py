# Writes scenes/x-header-above.svg: two stepped piers seen from above (the mark's two halves),
# rowboats fanned along the departure pier, one ferry crossing with a V wake. Paint scene format.
import random, os, math
random.seed(11)
W,H=1500,500
o=[]
e=o.append
def rot(px,py,cx,cy,a):
    c,s=math.cos(a),math.sin(a); return (cx+(px-cx)*c-(py-cy)*s, cy+(px-cx)*s+(py-cy)*c)
def poly(pts): return ' '.join(f'{x:.1f},{y:.1f}' for x,y in pts)

def rowboat(cx,cy,L,Wd,ang,inside,hull="#eef0ec",oar=None):
    # top-down: pointed bow to the right, square stern, two thwarts, cast shadow down-right
    a=math.radians(ang)
    def P(x,y): return rot(cx+x,cy+y,cx,cy,a)
    shape=[(-L/2,-Wd/2),(L*.18,-Wd/2),(L/2,0),(L*.18,Wd/2),(-L/2,Wd/2)]
    e(f'<polygon points="{poly([ (x+7,y+6) for x,y in [P(*p) for p in shape]])}" fill="#1d3f47" opacity="0.55" data-role="shadow"/>')
    e('<g data-role="vehicle">')
    e(f'<polygon points="{poly([P(*p) for p in shape])}" fill="{hull}"/>')
    inner=[(-L/2+5,-Wd/2+4),(L*.16,-Wd/2+4),(L/2-9,0),(L*.16,Wd/2-4),(-L/2+5,Wd/2-4)]
    e(f'<polygon points="{poly([P(*p) for p in inner])}" fill="{inside}"/>')
    for t in (-.18,.12):
        e(f'<polygon points="{poly([P(L*t,-Wd/2+4),P(L*t+7,-Wd/2+4),P(L*t+7,Wd/2-4),P(L*t,Wd/2-4)])}" fill="{hull}"/>')
    if oar:
        e(f'<polygon points="{poly([P(-L*.38,-2),P(L*.3,-5),P(L*.3,-3),P(-L*.38,0)])}" fill="{oar}"/>')
    e('</g>')

def pier(side):
    # wooden pier from the edge; its channel-facing edge steps like one half of the mark:
    # narrow at top and bottom, reaching furthest into the channel in the middle
    rows=[(0,60,150),(60,170,215),(170,330,265),(330,440,215),(440,500,150)]
    pts=[(0,0)]
    for y0,y1,x in rows: pts+= [(x,y0),(x,y1)]
    pts+=[(0,500)]
    if side=='R': pts=[(W-x,y) for x,y in pts]
    e(f'<polygon points="{poly([(x+10,y+9) for x,y in pts])}" fill="#173a47" opacity="0.5" data-role="shadow"/>')
    e('<g data-role="path">')
    e(f'<polygon points="{poly(pts)}" fill="#bdb6a8"/>')
    for y0,y1,x in rows:
        for k in range(y0,y1,13):
            x0=0 if side=='L' else W-x
            e(f'<rect x="{x0}" y="{k}" width="{x}" height="2" fill="#8f897d"/>')
    e('</g>')
    for y0,y1,x in rows[1:4]:
        for y in (y0+18,y1-18):
            bx=x-12 if side=='L' else W-x+12
            e(f'<circle cx="{bx}" cy="{y}" r="7" fill="#3a3a40" data-role="prop"/>')
    return rows

e(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" data-paint="1" data-title="Ferry: from above" data-focus="905 250" data-style="watercolour">')
e('''<!-- plan
subject: one passenger ferry seen from straight above, right of centre (x 800 to 960), crossing left to right, its V wake opening back toward the departure pier
view: top-down, like a drone over the harbour; no horizon
scale: 7 units per metre (ferry 24 m long = 170, rowboat 4 m = 30 to 34; pier boards 1.2 m)
light: low sun from the upper left; every boat and pier casts a short shadow down and to the right onto the water
palette: deep teal-blue water, weathered grey timber, white hulls with sea-green and wood interiors, cream deck, one terracotta funnel, one orange life ring
motion: the ferry under way and water ripples (loop version); rowboats moored
shores: two wooden piers whose channel edges step in and out like the two halves of the Ferry mark; the channel between is the crossing
-->''')
e('''<defs><linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d6f7e"/><stop offset="0.5" stop-color="#2a6077"/><stop offset="1" stop-color="#224f66"/></linearGradient></defs>''')
e(f'<rect x="0" y="0" width="{W}" height="{H}" fill="url(#sea)" data-role="water"/>')
# seen from above there is no sky: a token sky part (hidden under the pier) tells Paint so, and no clouds are floated over the water
e('<rect x="0" y="0" width="4" height="4" fill="#bdb6a8" data-role="sky"/>')
# light on the water: soft bands and weed patches (like the reference)
e('<g data-role="water">')
for i in range(40):
    x=random.uniform(290,1210); y=random.uniform(10,490); w=random.uniform(40,140)
    e(f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{random.uniform(1.2,2.4):.1f}" fill="#5f9aa6" opacity="0.6"/>')
for i in range(8):
    x=random.choice([random.uniform(300,520),random.uniform(1060,1200)]); y=random.uniform(20,480)
    e(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{random.uniform(12,30):.0f}" ry="{random.uniform(6,13):.0f}" fill="#3f5f4e" opacity="0.45"/>')
e('</g>')
rows=pier('L'); pier('R')
# rowboats fanned along the departure pier, a few at the arrival pier
inside=["#d9d4c4","#8fb9a8","#b48f66","#e2ddd0","#2f3b42","#c9c2b0"]
def edge_at(y):
    for y0,y1,x in rows:
        if y0<=y<y1: return x
    return rows[-1][2]
for i,y in enumerate([28,92,140,205,262,318,382,470]):
    if i==5: continue
    rowboat(edge_at(y)+40+random.uniform(0,6),y,66,22,random.uniform(-10,10),inside[i%6],oar="#b8643c" if i in (0,4) else None)
for i,y in enumerate([110,250,410]):
    rowboat(W-edge_at(y)-40,y,64,22,180+random.uniform(-8,8),inside[(i+2)%6])
# THE FERRY from above, heading right, centre (880, 250)
cx,cy,L,B=905,250,300,70
e(f'<polygon points="{poly([(cx-L/2+10,cy-B/2+9),(cx+L/2-30+10,cy-B/2+9),(cx+L/2+10,cy+9),(cx+L/2-30+10,cy+B/2+9),(cx-L/2+10,cy+B/2+9)])}" fill="#173a47" opacity="0.55" data-role="shadow"/>')
# wake: V of foam lines opening back to the left, plus churned water behind the stern
e('<g data-role="water">')
for s in (-1,1):
    e(f'<path d="M {cx-L/2+4} {cy+s*14} Q {cx-L/2-160} {cy+s*60} {cx-L/2-380} {cy+s*150} L {cx-L/2-384} {cy+s*143} Q {cx-L/2-160} {cy+s*52} {cx-L/2+4} {cy+s*9} Z" fill="#e8f2f2" opacity="0.85"/>')
    e(f'<path d="M {cx-L/2-40} {cy+s*30} Q {cx-L/2-200} {cy+s*80} {cx-L/2-340} {cy+s*150}" fill="none" stroke="#cfe3e6" stroke-width="2" opacity="0.6"/>')
e(f'<polygon points="{cx-L/2},{cy-9} {cx-L/2-150},{cy-4} {cx-L/2-260},{cy} {cx-L/2-150},{cy+4} {cx-L/2},{cy+9}" fill="#9fc7cf" opacity="0.7"/>')
e('</g>')
k=L/170
e('<g data-role="vehicle">')
e(f'<polygon points="{poly([(cx-L/2,cy-B/2),(cx+L/2-30*k,cy-B/2),(cx+L/2,cy),(cx+L/2-30*k,cy+B/2),(cx-L/2,cy+B/2)])}" fill="#1f4a6b"/>')
e(f'<polygon points="{poly([(cx-L/2+5*k,cy-B/2+5*k),(cx+L/2-33*k,cy-B/2+5*k),(cx+L/2-9*k,cy),(cx+L/2-33*k,cy+B/2-5*k),(cx-L/2+5*k,cy+B/2-5*k)])}" fill="#e9e3d4"/>')
e(f'<rect x="{cx-L/2+30*k}" y="{cy-B/2+11*k}" width="{92*k}" height="{B-22*k}" fill="#f6f2e8"/>')
e(f'<rect x="{cx-L/2+30*k}" y="{cy-B/2+11*k}" width="{92*k}" height="{4*k}" fill="#d8d0bd"/>')
for j in range(6):
    e(f'<rect x="{cx-L/2+(36+j*14)*k}" y="{cy-B/2+5.5*k}" width="{8*k}" height="{3*k}" fill="#3d5266" data-role="window"/>')
    e(f'<rect x="{cx-L/2+(36+j*14)*k}" y="{cy+B/2-8.5*k}" width="{8*k}" height="{3*k}" fill="#3d5266" data-role="window"/>')
e(f'<rect x="{cx+L/2-62*k}" y="{cy-10*k}" width="{22*k}" height="{20*k}" fill="#f6f2e8"/>')
e(f'<rect x="{cx+L/2-44*k}" y="{cy-8*k}" width="{4*k}" height="{16*k}" fill="#3d5266" data-role="window"/>')
e(f'<circle cx="{cx-L/2+76*k}" cy="{cy}" r="{8*k}" fill="#c45c3c"/>')
e(f'<circle cx="{cx-L/2+76*k}" cy="{cy}" r="{3.5*k}" fill="#2a2a30"/>')
e(f'<circle cx="{cx-L/2+14*k}" cy="{cy-B/2+9*k}" r="{5*k}" fill="#e98a2c"/>')
e(f'<circle cx="{cx-L/2+14*k}" cy="{cy-B/2+9*k}" r="{2.2*k}" fill="#e9e3d4"/>')
e('</g>')
# a gull far off the canvas: the scene has its own life, so Paint adds no birds of its own over the top-down view
e('<g data-sprite="gull" data-path="M -900 -900 L -800 -900" data-duration="10" data-repeat="loop"><path d="M -8 0 Q -4 -4 0 0 Q 4 -4 8 0" fill="none" stroke="#3b3a3f" stroke-width="1.8"/></g>')
e('</svg>')
p=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','scenes','x-header-above.svg')
open(p,'w').write('\n'.join(o)); print('wrote',os.path.normpath(p))

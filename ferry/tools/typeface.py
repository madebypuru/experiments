"""Build Ferry Sans from TeX Gyre Heros (GUST Font License / LPPL 1.3c).

Two changes from Heros:

1. Proportions tuned to the approved wordmark (first drawn in Helvetica Neue), so the
   typeface and the logo read the same. Per style: a horizontal stretch (stem weight
   and widths), shorter descenders on g j p q y, and longer f and r arms. The factors
   are numbers measured once against Helvetica Neue's metrics (TUNE below); no
   Helvetica outlines are used.
2. The wordmark's detail: every convex corner is replaced by a small round, radius =
   half the butterfly mark's corner radius (0.0189 x ascender height).

Kerning and mark positions are scaled with the stretch.

Usage: python3 tools/typeface.py type/source type/fonts
"""
import math, sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.misc.bezierTools import splitCubicAtT

R_RATIO = 0.0189      # corner radius / ascender height (from the wordmark)
MIN_TURN = math.radians(28)   # smaller direction changes are smooth joins, not corners
MAX_TRIM = 0.42       # never eat more than this share of a neighbouring segment

# Measured 2026-11-11: Helvetica Neue style vs the matching TeX Gyre Heros style, in units of
# the d's height. SX = stem ratio; DESC = descender ratio; F_/R_ = arm reach beyond the stem
# (after SX); XH = x-height ratio (lowercase only, ascenders stay). Arm factors are clamped to 0.9..1.3.
TUNE = {
    'regular':    dict(SX=1.0456, DESC=0.9695, F_LEFT=1.2136, F_RIGHT=1.2683, R_RIGHT=1.0869, XH=1.0074),
    'bold':       dict(SX=1.0356, DESC=0.8438, F_LEFT=1.1027, F_RIGHT=1.2591, R_RIGHT=1.1276, XH=0.9775),
    'italic':     dict(SX=1.0236, DESC=0.9789, F_LEFT=1.0070, F_RIGHT=1.1134, R_RIGHT=1.0587, XH=1.0074),
    'bolditalic': dict(SX=1.0299, DESC=0.8438, F_LEFT=0.9385, F_RIGHT=1.1397, R_RIGHT=1.0785, XH=0.9775),
}
F_LIGATURES = {'f_f', 'f_i', 'f_l', 'f_f_i', 'f_f_l', 'f_k'}
# The y's tail in the bold styles, matched to the approved wordmark (measured in units of
# A/1000 on the two wordmark outlines): the tail stroke is thickened on its left side by up
# to 37 (ramping in over the first 80 below the baseline), and the flag's top edge rises from
# -130 to -82 while its bottom stays put.
Y_TAIL = {'bold': dict(THICK=37, RAMP=80, FLAG_FROM=-130, FLAG_TO=-82),
          'bolditalic': dict(THICK=37, RAMP=80, FLAG_FROM=-130, FLAG_TO=-82)}

STYLES = {
    'regular':    ('Regular',     400, False),
    'bold':       ('Bold',        700, False),
    'italic':     ('Italic',      400, True),
    'bolditalic': ('Bold Italic', 700, True),
}

def sub(a, b): return (a[0]-b[0], a[1]-b[1])
def add(a, b): return (a[0]+b[0], a[1]+b[1])
def mul(a, k): return (a[0]*k, a[1]*k)
def norm(a):
    l = math.hypot(*a); return (a[0]/l, a[1]/l) if l else (0.0, 0.0)
def cross(a, b): return a[0]*b[1]-a[1]*b[0]
def dot(a, b): return a[0]*b[0]+a[1]*b[1]

def cubic_len(p0, p1, p2, p3, n=24):
    L, prev = 0, p0
    for i in range(1, n+1):
        t = i/n; mt = 1-t
        q = (mt**3*p0[0]+3*mt*mt*t*p1[0]+3*mt*t*t*p2[0]+t**3*p3[0],
             mt**3*p0[1]+3*mt*mt*t*p1[1]+3*mt*t*t*p2[1]+t**3*p3[1])
        L += math.dist(prev, q); prev = q
    return L

def contours_of(rec):
    """RecordingPen ops -> list of contours; each contour = list of segments
    ('L', p0, p1) or ('C', p0, c1, c2, p1)."""
    out, cur, start, pt = [], None, None, None
    for op, args in rec.value:
        if op == 'moveTo':
            cur = []; start = pt = args[0]
        elif op == 'lineTo':
            cur.append(('L', pt, args[0])); pt = args[0]
        elif op == 'curveTo':
            c1, c2, p = args; cur.append(('C', pt, c1, c2, p)); pt = p
        elif op == 'qCurveTo':
            raise ValueError('quadratic outlines not expected in CFF')
        elif op in ('closePath', 'endPath'):
            if pt != start: cur.append(('L', pt, start))
            cur = [s for s in cur if not (s[0] == 'L' and s[1] == s[2])]
            if cur: out.append(cur)
            cur = None
    return out

def seg_len(s): return math.dist(s[1], s[2]) if s[0] == 'L' else cubic_len(*s[1:])
def tan_end(s):
    if s[0] == 'L': return norm(sub(s[2], s[1]))
    for q in (s[3], s[2], s[1]):
        d = sub(s[4], q)
        if math.hypot(*d) > 1e-6: return norm(d)
    return (0, 0)
def tan_start(s):
    if s[0] == 'L': return norm(sub(s[2], s[1]))
    for q in (s[2], s[3], s[4]):
        d = sub(q, s[1])
        if math.hypot(*d) > 1e-6: return norm(d)
    return (0, 0)
def seg_end(s): return s[-1]

def trim_end(s, d):
    """Shorten segment s by arc length d at its end."""
    if s[0] == 'L':
        u = tan_end(s); return ('L', s[1], sub(s[2], mul(u, d)))
    L = cubic_len(*s[1:]); t = max(0.0, min(1.0, 1 - d/L))
    for _ in range(4):  # refine t so the cut-off piece has length d
        a, b = splitCubicAtT(*s[1:], t)
        err = cubic_len(*b) - d
        t = max(0.0, min(1.0, t + err/L))
    a, _ = splitCubicAtT(*s[1:], t)
    return ('C',) + tuple(a)
def trim_start(s, d):
    if s[0] == 'L':
        u = tan_start(s); return ('L', add(s[1], mul(u, d)), s[2])
    L = cubic_len(*s[1:]); t = max(0.0, min(1.0, d/L))
    for _ in range(4):
        a, b = splitCubicAtT(*s[1:], t)
        err = cubic_len(*a) - d
        t = max(0.0, min(1.0, t - err/L))
    _, b = splitCubicAtT(*s[1:], t)
    return ('C',) + tuple(b)

def signed_area(contour):
    pts = [s[1] for s in contour]
    return 0.5*sum(cross(pts[i], pts[(i+1) % len(pts)]) for i in range(len(pts)))

def round_contour(contour, r, filled_left):
    n = len(contour); segs = list(contour); lengths = [seg_len(s) for s in segs]
    fillets = {}
    for i in range(n):            # corner between segs[i] and segs[i+1]
        a, b = segs[i], segs[(i+1) % n]
        tin, tout = tan_end(a), tan_start(b)
        turn = math.atan2(cross(tin, tout), dot(tin, tout))
        if abs(turn) < MIN_TURN: continue
        convex = (turn > 0) == filled_left
        if not convex: continue
        t = r*math.tan(abs(turn)/2)
        t = min(t, MAX_TRIM*lengths[i], MAX_TRIM*lengths[(i+1) % n])
        if t < 0.5: continue
        fillets[i] = (t, tin, tout, abs(turn))
    if not fillets: return contour
    # trim
    trimmed = list(segs)
    for i, (t, *_ ) in fillets.items():
        trimmed[i] = trim_end(trimmed[i], t)
        j = (i+1) % n; trimmed[j] = trim_start(trimmed[j], t)
    out = []
    for i in range(n):
        out.append(trimmed[i])
        if i in fillets:
            t, tin, tout, turn = fillets[i]
            p0 = seg_end(trimmed[i]); p3 = trimmed[(i+1) % n][1]
            h = t*(4/3)*math.tan(turn/4)/math.tan(turn/2)
            out.append(('C', p0, add(p0, mul(tin, h)), sub(p3, mul(tout, h)), p3))
    return out

def draw(contours, pen):
    for c in contours:
        pen.moveTo(c[0][1])
        for s in c:
            if s[0] == 'L': pen.lineTo(s[2])
            else: pen.curveTo(s[2], s[3], s[4])
        pen.closePath()

import unicodedata
from fontTools.pens.basePen import BasePen as _BasePen

class _Sampler(_BasePen):
    """Flattens a glyph into polygons (for measuring stems)."""
    def __init__(s, gs): super().__init__(gs); s.rings = []; s.cur = []
    def _moveTo(s, p): s.cur = [p]
    def _lineTo(s, p): s.cur.append(p)
    def _curveToOne(s, a, b, c):
        p0 = s.cur[-1]
        for i in range(1, 9):
            t = i/8; mt = 1-t
            s.cur.append((mt**3*p0[0]+3*mt*mt*t*a[0]+3*mt*t*t*b[0]+t**3*c[0], mt**3*p0[1]+3*mt*mt*t*a[1]+3*mt*t*t*b[1]+t**3*c[1]))
    def _closePath(s):
        if len(s.cur) > 2: s.rings.append(s.cur)
        s.cur = []
    _endPath = _closePath

def first_stem(rec, y):
    """x range of the leftmost ink run crossing height y, from recorded ops."""
    xs = []
    for ring in _rings(rec):
        n = len(ring)
        for i in range(n):
            (x0, y0), (x1, y1) = ring[i], ring[(i+1) % n]
            if (y0 - y)*(y1 - y) < 0:
                xs.append(x0 + (y - y0)*(x1 - x0)/(y1 - y0))
    xs.sort()
    return (xs[0], xs[1]) if len(xs) >= 2 else None

def _rings(rec):
    sp = _Sampler(None)
    rec.replay(sp)
    return sp.rings

def map_points(rec, fn):
    out = RecordingPen()
    for op, args in rec.value:
        getattr(out, op)(*[fn(*p) for p in args])
    return out

def tune_glyph(name, rec, t, xh, base_of, asc, tail=None):
    clamp = lambda k: max(0.9, min(1.3, k))
    rec = map_points(rec, lambda x, y: (x*t['SX'], y))
    base = base_of.get(name)
    if (base and base.islower()) or name in F_LIGATURES:
        k = t['XH']; top = xh*k
        def vy(x, y):
            if 0 <= y <= xh: return (x, y*k)
            if xh < y <= asc: return (x, top + (y-xh)*(asc-top)/(asc-xh))
            return (x, y)
        rec = map_points(rec, vy)
        xh = top
    if base in ('g', 'j', 'p', 'q', 'y'):
        rec = map_points(rec, lambda x, y: (x, y*t['DESC'] if y < 0 else y))
    if base == 'y' and tail:
        u = asc/1000.0
        st = first_stem(rec, -0.06*asc)                # the tail stroke just below the baseline
        rings = _rings(rec); bottom = min(p[1] for r in rings for p in r)
        if st:
            pivot = st[0] + 0.02*asc                   # points left of this are the tail's left edge and the flag
            top_from, top_to = tail['FLAG_FROM']*u, tail['FLAG_TO']*u
            def fn(x, y):
                if y >= 0 or x > pivot: return (x, y)
                dx = tail['THICK']*u*min(1.0, -y/(tail['RAMP']*u))
                if y <= top_from:                    # flag: stretch upward from its bottom
                    y = bottom + (y - bottom)*(top_to - bottom)/(top_from - bottom)
                return (x - dx, y)
            rec = map_points(rec, fn)
    if base == 'f' or name in F_LIGATURES:
        st = first_stem(rec, xh*0.3)
        if st:
            l, r = st; kl = clamp(t['F_LEFT']); kr = clamp(t['F_RIGHT'])
            whole_f = base == 'f'
            def fn(x, y, l=l, r=r):
                if x < l: return (l - (l - x)*kl, y)
                if whole_f and x > r: return (r + (x - r)*kr, y)
                return (x, y)
            rec = map_points(rec, fn)
    elif base == 'r':
        st = first_stem(rec, xh*0.3)
        if st:
            l, r = st; kr = clamp(t['R_RIGHT'])
            rec = map_points(rec, lambda x, y: (r + (x - r)*kr, y) if (x > r and -0.02*xh <= y <= xh*1.1) else (x, y))
    return rec

def scale_gpos_x(obj, sx, seen=None):
    """Scale every horizontal value in GPOS (kerning, placements, anchors) by sx."""
    seen = seen if seen is not None else set()
    if id(obj) in seen: return
    seen.add(id(obj))
    if isinstance(obj, list):
        for o in obj: scale_gpos_x(o, sx, seen)
        return
    if not hasattr(obj, '__dict__'): return
    for k, v in list(vars(obj).items()):
        if k in ('XAdvance', 'XPlacement', 'XCoordinate') and isinstance(v, (int, float)):
            setattr(obj, k, round(v*sx))
        elif isinstance(v, (list, dict)) or hasattr(v, '__dict__'):
            if isinstance(v, dict):
                for vv in v.values(): scale_gpos_x(vv, sx, seen)
            else:
                scale_gpos_x(v, sx, seen)

def build(src, dst, key):
    style, weight, italic = STYLES[key]
    f = TTFont(src); gs = f.getGlyphSet(); cmap = f.getBestCmap()
    b = BoundsPen(gs); gs[cmap[ord('d')]].draw(b); asc = b.bounds[3]
    r = R_RATIO*asc
    cff = f['CFF '].cff; top = cff.topDictIndex[0]; cs = top.CharStrings
    # filled side: decide from 'o' (outer contour is the larger one)
    rec = RecordingPen(); gs[cmap[ord('o')]].draw(rec)
    oc = contours_of(rec); outer = max(oc, key=lambda c: abs(signed_area(c)))
    filled_left = signed_area(outer) > 0
    private = top.Private; changed = 0
    t = TUNE[key]
    bx = BoundsPen(gs); gs[cmap[ord('x')]].draw(bx); xh = bx.bounds[3]
    base_of = {}
    for cp, gname in cmap.items():
        d = unicodedata.normalize('NFD', chr(cp))
        if d and 'a' <= d[0] <= 'z': base_of.setdefault(gname, d[0])
    new_widths = {}
    for name in f.getGlyphOrder():
        rec = RecordingPen(); gs[name].draw(rec)
        new_widths[name] = round(f['hmtx'][name][0]*t['SX'])
        if not rec.value: continue
        rec = tune_glyph(name, rec, t, xh, base_of, asc, Y_TAIL.get(key))
        conts = contours_of(rec)
        new = [round_contour(c, r, filled_left) for c in conts]
        width = new_widths[name]
        pen = T2CharStringPen(width, gs)
        draw(new, pen)
        c = pen.getCharString(private=private, globalSubrs=cff.GlobalSubrs)
        cs[name] = c; changed += 1
    # metrics: widths and left side bearings follow the new outlines; kerning and anchors scale too
    gs2 = f.getGlyphSet()
    for name in f.getGlyphOrder():
        bp = BoundsPen(gs2); gs2[name].draw(bp)
        lsb = round(bp.bounds[0]) if bp.bounds else 0
        f['hmtx'][name] = (new_widths[name], lsb)
    scale_gpos_x(f['GPOS'].table, t['SX'])
    # names: rename per the GUST licence request
    fam = 'Ferry Sans'; full = f'{fam} {style}'.replace(' Regular', '') if style == 'Regular' else f'{fam} {style}'
    ps = f'FerrySans-{style.replace(" ", "")}'
    nm = f['name']
    nm.names = [n for n in nm.names if n.nameID not in (1, 2, 3, 4, 6, 16, 17)]
    rib = style if style in ('Regular', 'Bold', 'Italic', 'Bold Italic') else 'Regular'
    for pid, eid, lid in ((3, 1, 0x409), (1, 0, 0)):
        nm.setName(fam, 1, pid, eid, lid); nm.setName(rib, 2, pid, eid, lid)
        nm.setName(f'1.000;FERRY;{ps}', 3, pid, eid, lid)
        nm.setName(full if style != 'Regular' else f'{fam} Regular', 4, pid, eid, lid)
        nm.setName(ps, 6, pid, eid, lid)
    old_copy = nm.getDebugName(0) or ''
    for pid, eid, lid in ((3, 1, 0x409), (1, 0, 0)):
        nm.setName(old_copy + ' Ferry Sans is a modified version of TeX Gyre Heros by the GUST e-foundry, renamed as its licence requests: every convex corner is softened to match the Ferry wordmark.', 0, pid, eid, lid)
        nm.setName('Distributed under the GUST Font License (LaTeX Project Public License 1.3c or later).', 13, pid, eid, lid)
        nm.setName('https://www.latex-project.org/lppl.txt', 14, pid, eid, lid)
    top.FullName = f'{fam} {style}'; top.FamilyName = fam; top.Weight = 'Bold' if weight == 700 else 'Regular'
    cff.fontNames = [ps]
    f['OS/2'].achVendID = 'FRRY'; f['OS/2'].usWeightClass = weight
    f['post'].underlinePosition = f['post'].underlinePosition  # unchanged
    f.save(dst)
    return changed, r, filled_left

if __name__ == '__main__':
    src_dir, out_dir = sys.argv[1], sys.argv[2]
    os.makedirs(out_dir, exist_ok=True)
    for key, (style, _, _) in STYLES.items():
        ps = f'FerrySans-{style.replace(" ", "")}'
        n, r, fl = build(os.path.join(src_dir, f'texgyreheros-{key}.otf'), os.path.join(out_dir, ps + '.otf'), key)
        w = TTFont(os.path.join(out_dir, ps + '.otf')); w.flavor = 'woff2'; w.save(os.path.join(out_dir, ps + '.woff2'))
        print(f'{ps}: {n} glyphs rounded, r = {r:.1f} units, filled side {"left" if fl else "right"}')

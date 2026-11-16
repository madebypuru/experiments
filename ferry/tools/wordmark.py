# Builds the Ferry wordmark outlines from Ferry Sans (type/fonts) and writes
# src/glyphs.json and src/glyphs.js. The word is shaped with HarfBuzz (the font's
# own kerning) at -5% tracking. Ferry Sans already carries the softened corners,
# so no rounding happens here.
# Needs: pip install fonttools shapely uharfbuzz. Run: python3 tools/wordmark.py
import json, os
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import unary_union
from shapely import affinity

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
FONTS = {
    'bold':   os.path.join(ROOT, 'type/fonts/FerrySans-Bold.otf'),
    'medium': os.path.join(ROOT, 'type/fonts/FerrySans-Regular.otf'),   # lighter weight for the study page
}
PLAIN = {  # the unsoftened base, for the corner comparison
    'bold':   os.path.join(ROOT, 'type/source/texgyreheros-bold.otf'),
    'medium': os.path.join(ROOT, 'type/source/texgyreheros-regular.otf'),
}
TRACK = -0.05   # em, the wordmark's setting

class Flat(BasePen):
    def __init__(s, gs, dx): super().__init__(gs); s.rings = []; s.cur = []; s.dx = dx
    def _p(s, p): s.cur.append((p[0]+s.dx, p[1]))
    def _moveTo(s, p): s.cur = []; s._p(p)
    def _lineTo(s, p): s._p(p)
    def _curveToOne(s, a, b, c):
        x0, y0 = s.cur[-1][0]-s.dx, s.cur[-1][1]
        for i in range(1, 17):
            t = i/16; mt = 1-t
            s._p((mt**3*x0+3*mt*mt*t*a[0]+3*mt*t*t*b[0]+t**3*c[0], mt**3*y0+3*mt*mt*t*a[1]+3*mt*t*t*b[1]+t**3*c[1]))
    def _qCurveToOne(s, a, b):
        x0, y0 = s.cur[-1][0]-s.dx, s.cur[-1][1]
        for i in range(1, 13):
            t = i/12; mt = 1-t
            s._p((mt*mt*x0+2*mt*t*a[0]+t*t*b[0], mt*mt*y0+2*mt*t*a[1]+t*t*b[1]))
    def _closePath(s):
        if len(s.cur) > 2: s.rings.append(s.cur)
        s.cur = []
    _endPath = _closePath

def glyph_shape(rings):
    shp = None
    for r in rings:
        p = Polygon(r).buffer(0)
        shp = p if shp is None else shp.symmetric_difference(p)
    return shp

def shape_run(path, text):
    blob = hb.Blob.from_file_path(path); face = hb.Face(blob); font = hb.Font(face)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, {'kern': True, 'liga': False})
    return [(i.codepoint, p.x_advance, p.x_offset) for i, p in zip(buf.glyph_infos, buf.glyph_positions)]

# Hand spacing for the wordmark: the ink gaps between neighbours (font units) that were
# approved on the Helvetica version on 2026-11-11. The double r almost meets and the
# r touches the y, so the watercolour bleed fuses them.
# Letter centres of the approved wordmark (Helvetica Neue Bold, -5%, its own kerning), in
# units of A (the height of the d). Ferry Sans' letters are placed on the same centres, so
# the word has the same width and rhythm. Measured once on 2026-11-11; no Helvetica outlines are used.
WORDMARK_CENTRES = [0.2332, 0.7982, 1.4391, 1.9139, 2.444]
WORDMARK_GAPS = [35, 33, 6, 1]          # f-e, e-r, r-r, r-y (the result of those centres on the first version)
CLEAN_GAPS    = [35, 33, 32, 32]        # same rhythm, every pair apart, for the clean version

def set_gap(s, prev, target):
    """Slide glyph s horizontally so its ink sits `target` units from prev (bisection:
    the gap only grows as s moves right). Returns (shape, shift)."""
    lo, hi = -400.0, 400.0
    for _ in range(40):
        mid = (lo+hi)/2
        if affinity.translate(s, mid).distance(prev) < target: lo = mid
        else: hi = mid
    return affinity.translate(s, hi), hi

def word(path, text, min_gap=0, gaps=None, centres=None):
    f = TTFont(path); gs = f.getGlyphSet(); order = f.getGlyphOrder(); upm = f['head'].unitsPerEm
    A = asc(path)
    x = 0; shapes = []; measured = []
    for gid, adv, xoff in shape_run(path, text):
        pen = Flat(gs, x+xoff); gs[order[gid]].draw(pen); s = glyph_shape(pen.rings)
        if s is not None and centres:
            want = centres[len(shapes)]*A; have = (s.bounds[0]+s.bounds[2])/2
            s = affinity.translate(s, want-have); x += want-have
        elif s is not None and shapes and gaps:
            s, shift = set_gap(s, shapes[-1], gaps[len(shapes)-1]); x += shift
        elif s is not None and shapes and min_gap:
            d = s.distance(shapes[-1])
            while d < min_gap-0.5:
                step = max(min_gap-d, 2); s = affinity.translate(s, step); x += step; d = s.distance(shapes[-1])
        if s is not None:
            if shapes: measured.append(round(s.distance(shapes[-1])))
            shapes.append(s)
        x += adv + TRACK*upm
    print(os.path.basename(path), repr(text), 'gaps', measured)
    return unary_union(shapes)

def _unused(): pass

def to_d(sh):
    polys = sh.geoms if isinstance(sh, MultiPolygon) else [sh]
    out = []
    for p in polys:
        for ring in [p.exterior, *p.interiors]:
            c = list(ring.coords)
            out.append('M'+'L'.join(f'{x:.1f} {-y:.1f}' for x, y in c[:-1])+'Z')
    return ''.join(out)

def asc(path):
    f = TTFont(path); gs = f.getGlyphSet(); cm = f.getBestCmap()
    b = BoundsPen(gs); gs[cm[ord('d')]].draw(b); return b.bounds[3]

out = {}
for key, path in FONTS.items():
    tight = word(path, 'ferry', centres=WORDMARK_CENTRES)  # the wordmark: same letter positions as approved
    spaced = word(path, 'ferry', gaps=CLEAN_GAPS)    # clean spacing, every pair apart
    plain = word(PLAIN[key], 'ferry', gaps=CLEAN_GAPS)
    chk = word(path, 'devx labs')
    out[key] = dict(A=asc(path), tight=to_d(tight), tightBounds=tight.bounds, d=to_d(spaced), bounds=spaced.bounds,
                    plain=to_d(plain), check=to_d(chk), checkBounds=chk.bounds)
src = os.path.join(ROOT, 'src')
json.dump(out, open(os.path.join(src, 'glyphs.json'), 'w'))
open(os.path.join(src, 'glyphs.js'), 'w').write('const G='+json.dumps(out)+';')
print({k: (round(v['A']), [round(b) for b in v['tightBounds']]) for k, v in out.items()})

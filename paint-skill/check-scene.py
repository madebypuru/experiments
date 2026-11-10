#!/usr/bin/env python3
"""Checks a Paint scene file before you paint it, and measures what can be measured.

    python3 check-scene.py scene.svg [more.svg ...]

Prints problems (the file won't work as meant) and warnings (it will paint, but
something will look wrong), with the numbers behind each one. Exit code 1 if any
file has problems. Standard library only.
"""
import json, math, re, sys
import xml.etree.ElementTree as ET

NS = '{http://www.w3.org/2000/svg}'
ALLOWED = {'svg', 'g', 'path', 'polygon', 'polyline', 'rect', 'circle', 'ellipse', 'line', 'defs',
           'linearGradient', 'radialGradient', 'stop', 'metadata', 'title', 'desc'}
ROLES = {'sky', 'cloud', 'sun', 'moon', 'mountain', 'hill', 'ground', 'grass', 'path', 'road', 'water',
         'building', 'wall', 'roof', 'window', 'lamp', 'door', 'trunk', 'branch', 'foliage', 'flower',
         'figure', 'animal', 'vehicle', 'prop', 'shadow'}
STEP_KEYS = {'preset', 'glaze', 'lift', 'dabs', 'lights', 'snow', 'rain', 'wait'}
PRESET_NEEDS = {'night': [{'sky'}, {'window', 'lamp'}], 'seasons': [{'foliage'}, {'ground', 'grass'}],
                'rain': [{'sky'}, {'ground', 'grass', 'road', 'path'}]}
WALKERS = re.compile(r'person|walker|man|woman|child|kid|girl|boy|dog|people|pedestrian|figure', re.I)
FLYERS = re.compile(r'bird|gull|crow|swallow|pigeon|duck|goose|swan|heron|bat', re.I)


def tag(el):
    return el.tag.replace(NS, '')


# ---------- path geometry: flatten SVG path data to points (arcs as straight lines) ----------
def flatten(d):
    toks = re.findall(r'[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?', d or '')
    pts, i, cmd = [], 0, None
    x = y = sx = sy = 0.0
    lc = None  # last control point, for S and T

    def num():
        nonlocal i
        v = float(toks[i]); i += 1; return v

    def bez(p0, *cs, n=16):
        for k in range(1, n + 1):
            t = k / n
            if len(cs) == 2:  # quadratic
                (x1, y1), (x2, y2) = cs
                u = 1 - t
                pts.append((u*u*p0[0] + 2*u*t*x1 + t*t*x2, u*u*p0[1] + 2*u*t*y1 + t*t*y2))
            else:
                (x1, y1), (x2, y2), (x3, y3) = cs
                u = 1 - t
                pts.append((u**3*p0[0] + 3*u*u*t*x1 + 3*u*t*t*x2 + t**3*x3, u**3*p0[1] + 3*u*u*t*y1 + 3*u*t*t*y2 + t**3*y3))

    while i < len(toks):
        if re.match(r'[A-Za-z]', toks[i]):
            cmd = toks[i]; i += 1
            if cmd in 'Zz':
                x, y = sx, sy; pts.append((x, y)); lc = None; continue
        if cmd is None:
            break
        rel = cmd.islower(); C = cmd.upper(); ox, oy = (x, y) if rel else (0, 0)
        try:
            if C == 'M':
                x, y = ox + num(), oy + num(); sx, sy = x, y; pts.append((x, y)); cmd = 'l' if rel else 'L'; lc = None
            elif C == 'L':
                x, y = ox + num(), oy + num(); pts.append((x, y)); lc = None
            elif C == 'H':
                x = (x if rel else 0) + num(); pts.append((x, y)); lc = None
            elif C == 'V':
                y = (y if rel else 0) + num(); pts.append((x, y)); lc = None
            elif C == 'C':
                c1 = (ox + num(), oy + num()); c2 = (ox + num(), oy + num()); e = (ox + num(), oy + num())
                bez((x, y), c1, c2, e); lc = c2; x, y = e
            elif C == 'S':
                c1 = (2*x - lc[0], 2*y - lc[1]) if lc else (x, y); c2 = (ox + num(), oy + num()); e = (ox + num(), oy + num())
                bez((x, y), c1, c2, e); lc = c2; x, y = e
            elif C == 'Q':
                c1 = (ox + num(), oy + num()); e = (ox + num(), oy + num()); bez((x, y), c1, e); lc = c1; x, y = e
            elif C == 'T':
                c1 = (2*x - lc[0], 2*y - lc[1]) if lc else (x, y); e = (ox + num(), oy + num()); bez((x, y), c1, e); lc = c1; x, y = e
            elif C == 'A':
                for _ in range(5): num()
                x, y = ox + num(), oy + num(); pts.append((x, y)); lc = None
            else:
                i += 1
        except (IndexError, ValueError):
            break
    return pts


def length(pts):
    return sum(math.dist(pts[k], pts[k + 1]) for k in range(len(pts) - 1))


def shape_points(el):
    """Rough outline points of one shape, in its own coordinates."""
    t, a = tag(el), el.attrib
    f = lambda k, d=0: float(a.get(k, d) or d)
    if t == 'path': return flatten(a.get('d'))
    if t in ('polygon', 'polyline'):
        n = [float(v) for v in re.findall(r'-?\d*\.?\d+(?:[eE][-+]?\d+)?', a.get('points', ''))]
        return list(zip(n[0::2], n[1::2]))
    if t == 'rect': return [(f('x'), f('y')), (f('x') + f('width'), f('y') + f('height'))]
    if t == 'circle': return [(f('cx') - f('r'), f('cy') - f('r')), (f('cx') + f('r'), f('cy') + f('r'))]
    if t == 'ellipse': return [(f('cx') - f('rx'), f('cy') - f('ry')), (f('cx') + f('rx'), f('cy') + f('ry'))]
    if t == 'line': return [(f('x1'), f('y1')), (f('x2'), f('y2'))]
    return []


def bbox(group):
    """Approximate box of a sprite group (ignores transforms inside it)."""
    pts = [p for el in group.iter() for p in shape_points(el)]
    if not pts: return None
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


# ---------- the checks ----------
def check(path):
    bad, warn, info = [], [], []
    try:
        text = open(path, encoding='utf-8').read()
    except FileNotFoundError:
        return [f"there's no file at {path}"], [], []
    try:
        root = ET.fromstring(text)
    except Exception as e:
        return [f"can't read it as XML: {e}"], [], []
    if tag(root) != 'svg': return ['the root element is not <svg>'], [], []
    a = root.attrib
    if a.get('data-paint') != '1': bad.append('the root needs data-paint="1"')
    try:
        vx, vy, vw, vh = [float(v) for v in re.split(r'[\s,]+', a.get('viewBox', '').strip())]
    except ValueError:
        bad.append('the root needs a viewBox like "0 0 1200 900"'); vx, vy, vw, vh = 0, 0, 1200, 900
    try:
        fx, fy = [float(v) for v in re.split(r'[\s,]+', a.get('data-focus', '').strip())]
        if not (vx <= fx <= vx + vw and vy <= fy <= vy + vh): bad.append(f'data-focus ({fx:g}, {fy:g}) is outside the canvas')
        elif abs(fx - (vx + vw / 2)) < vw * .06 and abs(fy - (vy + vh / 2)) < vh * .06:
            warn.append('the focus is dead centre: a subject about a third of the way in usually composes better')
    except ValueError:
        bad.append('the root needs data-focus="x y" on the subject')
    if '<!--' not in text[:4000] or 'plan' not in text[:4000].lower():
        warn.append('no plan comment at the top: write scale, horizon, light, palette and motion as numbers before drawing')

    # what's allowed
    for el in root.iter():
        t = tag(el)
        if t not in ALLOWED: bad.append(f'<{t}> is not allowed and will be removed')
        if 'style' in el.attrib: bad.append(f'<{t}> has a style attribute, which is removed: use fill and stroke')
        for k in ('fill', 'stroke'):
            v = (el.attrib.get(k) or '').lower()
            if v in ('#000', '#000000', 'black') and k == 'fill': warn.append('pure black fill: use a deep blue-brown, watercolour has no black'); break

    # roles
    roles, unknown = {}, set()
    for el in root.iter():
        r = el.attrib.get('data-role')
        if r:
            roles[r] = roles.get(r, 0) + 1
            if r not in ROLES: unknown.add(r)
    if unknown: warn.append('unknown roles (ignored by effects): ' + ', '.join(sorted(unknown)))
    if not roles: bad.append('nothing is labelled with data-role')

    def labelled(el, parents):
        return any('data-role' in p.attrib for p in parents + [el])
    shapes, unl = 0, 0
    def walk(el, parents):
        nonlocal shapes, unl
        if 'data-sprite' in el.attrib or tag(el) in ('defs', 'metadata'): return
        if tag(el) in ('path', 'polygon', 'polyline', 'rect', 'circle', 'ellipse', 'line'):
            shapes += 1
            if not labelled(el, parents): unl += 1
        for c in el: walk(c, parents + [el])
    walk(root, [])
    if shapes and unl / shapes > .4: warn.append(f'{unl} of {shapes} shapes have no role ({unl * 100 // shapes}%): label everything a role fits')
    if roles.get('foliage', 0) and shapes:
        fol = sum(1 for el in root.iter() if el.attrib.get('data-role') == 'foliage' for _ in el.iter())
        if fol < 6: warn.append('foliage has fewer than 6 shapes: trees should be many overlapping leaf clusters, not one blob')
    for need in ('window', 'lamp'):
        lights = [el for el in root.iter() if el.attrib.get('data-role') == need]
        nums = {el.attrib.get('data-light') for el in lights if el.attrib.get('data-light')}
        if len(nums) > 8: warn.append(f'{len(nums)} light numbers for {need}s: more than 8 makes the lighting drag; group them')

    # figures: people Paint walks itself
    figures = [el for el in root.iter() if 'data-figure' in el.attrib]
    for fgr in figures:
        fa = fgr.attrib; kind = fa.get('data-figure')
        if kind not in ('walker', 'runner', 'cyclist'): bad.append(f'figure "{kind}" is not walker, runner or cyclist')
        pts = flatten(fa.get('data-path'))
        if len(pts) < 2: bad.append(f'figure "{kind}" has no usable data-path'); continue
        h = float(fa.get('data-height') or 60)
        if 'data-duration' in fa: warn.append(f'figure "{kind}" has data-duration, which is ignored: its gait sets the pace')
        if fa.get('data-gait', 'walk') not in ('walk', 'stroll', 'run'): warn.append(f'figure "{kind}" has an unknown gait "{fa.get("data-gait")}"')
        if fa.get('data-outfit', 'trousers') not in ('trousers', 'coat', 'dress'): warn.append(f'figure "{kind}" has an unknown outfit "{fa.get("data-outfit")}"')
        if len(list(fgr)): warn.append(f'figure "{kind}" has shapes inside it, which are ignored: Paint draws figures itself')
        inside = lambda p: vx + 2 < p[0] < vx + vw - 2 and vy + 2 < p[1] < vy + vh - 2
        if fa.get('data-repeat', 'loop') == 'loop' and (inside(pts[0]) or inside(pts[-1])):
            warn.append(f'figure "{kind}" loops but starts or ends on the canvas: it will pop in and out')
        speed = {'walk': 43.5, 'stroll': 29.3, 'run': 99}.get(fa.get('data-gait', 'run' if kind == 'runner' else 'walk'), 43.5) if kind != 'cyclist' else 175
        se = float(fa.get('data-scale-end') or 1)
        info.append(f'figure {kind}: {h:g} tall, path {length(pts):.0f}, about {length(pts) / (speed * h / 95 * (1 + se) / 2):.0f}s per pass')

    # sprites
    sprites = [el for el in root.iter() if 'data-sprite' in el.attrib]
    if len(sprites) + len(figures) > 12: bad.append(f'{len(sprites) + len(figures)} sprites and figures: only the first 12 are used')
    seen = {}
    for s in sprites:
        sa, name = s.attrib, s.attrib.get('data-sprite')
        pts = flatten(sa.get('data-path'))
        if len(pts) < 2: bad.append(f'sprite "{name}" has no usable data-path'); continue
        L, dur = length(pts), float(sa.get('data-duration') or 10)
        speed = L / max(dur, .01)
        box = bbox(s)
        h = (box[3] - box[1]) if box else 0
        w = (box[2] - box[0]) if box else 0
        if box and (abs((box[1] + box[3]) / 2) > max(h, 4) * 1.2 or abs((box[0] + box[2]) / 2) > max(w, 4) * 1.2):
            warn.append(f'sprite "{name}" is not drawn around (0, 0) (its box centre is {((box[0]+box[2])/2):.0f}, {((box[1]+box[3])/2):.0f}): it will ride off its path')
        rep = sa.get('data-repeat', 'loop')
        inside = lambda p: vx + 2 < p[0] < vx + vw - 2 and vy + 2 < p[1] < vy + vh - 2
        if rep == 'loop' and (inside(pts[0]) or inside(pts[-1])) and not FLYERS.search(name) and 'smoke' not in name.lower():
            if float(sa.get('data-fade-end', 1)) > .2:
                warn.append(f'sprite "{name}" loops but starts or ends on the canvas: it will pop in and out; start and end off-canvas, or fade it')
        key = (round(dur, 1), round(float(sa.get('data-delay') or 0), 1))
        if key in seen: warn.append(f'sprites "{seen[key]}" and "{name}" share duration and delay: they will move in lockstep')
        seen[key] = name
        if re.search(r'person|walker|\bman|woman|child|kid|girl|boy|people|pedestrian|figure|cyclist|bike|rider|couple|farmer|fisher|lady|gentleman|shopper|monk|vendor|hiker|jogger|runner|traveller|traveler|postman|worker', name, re.I):
            bad.append(f'sprite "{name}" is a person drawn as a sprite: it will skate. Use data-figure="walker" (or runner, cyclist) instead')
        elif WALKERS.search(name) and h:
            ratio = speed / h  # heights per second; a person walks about 0.8 of their height per second
            se = float(sa.get('data-scale-end') or 1)
            if ratio > 1.6 * max(1, (1 + se) / 2) or ratio < .35:
                good = L / (0.8 * h * (1 + se) / 2)
                warn.append(f'walker "{name}" moves {ratio:.2f} heights/s (natural is about 0.8): its feet will look like they slide. '
                            f'For this path, data-duration ≈ {good:.0f}')
            bob = float(sa.get('data-bob') or 0)
            if bob and not sa.get('data-step'):
                warn.append(f'walker "{name}" bobs on a timer: add data-step="{0.45 * h:.0f}" (about 0.45 × its height) so it rises once per step')
            if bob > .06 * h: warn.append(f'walker "{name}" bobs {bob:g} on a height of {h:.0f}: keep it to about 2-4% ({max(1, .03 * h):.1f})')
        if FLYERS.search(name) and w and dur < 3:
            warn.append(f'bird "{name}" crosses its path in {dur:g}s: under 4s reads as a dart, not a glide')
        info.append(f'sprite {name}: {h:.0f} tall, path {L:.0f}, {dur:g}s, {speed:.0f} units/s')

    # timeline
    md = [el for el in root.iter() if tag(el) == 'metadata' and el.attrib.get('id') == 'paint-timeline']
    if md:
        try:
            tl = json.loads(md[0].text or '')
            steps = tl['steps']; assert isinstance(steps, list)
        except Exception as e:
            bad.append(f"the timeline isn't valid JSON with a steps list ({e})"); steps = []
        presets, total = [], 0.0
        for k, st in enumerate(steps):
            if not isinstance(st, dict) or not (STEP_KEYS & st.keys()):
                bad.append(f'timeline step {k + 1} has no known type ({", ".join(sorted(STEP_KEYS))})'); continue
            if 'preset' in st:
                p = st['preset']; presets.append(p); total += {'night': 14, 'seasons': 22, 'rain': 12}.get(p, 0)
                if p not in PRESET_NEEDS: bad.append(f'unknown preset "{p}"')
                else:
                    for need in PRESET_NEEDS[p]:
                        if not need & roles.keys(): warn.append(f'preset "{p}" needs a part labelled {" or ".join(sorted(need))}')
            if 'lights' in st and 'night' in presets: warn.append('a lights step after the night preset repeats what the preset already did')
            for key in ('glaze', 'lift', 'dabs'):
                tg = st.get(key)
                if isinstance(tg, str) and tg != 'all' and tg.replace('not:', '') not in roles:
                    bad.append(f'step {k + 1} targets "{tg}", which no part is labelled as')
            if 'glaze' in st:
                s_ = float(st.get('strength', .5))
                if s_ > .85: warn.append(f'step {k + 1} glazes at strength {s_:g}: above 0.85 buries the painting; build darkness in two glazes')
            total += float(st.get('wait') or 0) + float(st.get('duration') or (2 if STEP_KEYS & st.keys() - {'preset', 'wait', 'snow', 'rain'} else 0))
            cap = st.get('caption') or ''
            if len(cap) > 28: warn.append(f'step {k + 1} caption is {len(cap)} characters: keep captions to a few words')
        if total > 45: warn.append(f'the timeline runs about {total:.0f}s: over 45s loses the viewer; 15-30s is the sweet spot')
        info.append(f'timeline: {len(steps)} steps, about {total:.0f}s')
    info.append('roles: ' + ', '.join(f'{r} {n}' for r, n in sorted(roles.items())))
    return bad, warn, info


def main():
    files = sys.argv[1:]
    if not files: print(__doc__); return 2
    failed = False
    for f in files:
        bad, warn, info = check(f)
        print(f'\n{f}')
        for m in bad: print('  PROBLEM  ' + m)
        for m in warn: print('  warning  ' + m)
        for m in info: print('           ' + m)
        if not bad and not warn: print('  ok')
        failed |= bool(bad)
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())

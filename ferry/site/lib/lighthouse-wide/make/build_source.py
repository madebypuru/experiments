#!/usr/bin/env python3
# Wide under-drawing for Paint: the portrait photo at native scale on a 16:10 canvas (left edge kept, so the west pier
# still runs off the edge), the open sea and sky continued to the right from the photo's own pixels.
#   row colour: per-row colour of the lit water/sky in the photo's right band, smoothed down the rows
#   texture: residual (photo minus its row colour) from calm source rectangles, perspective-scaled, laid as large
#            feathered patches at random sources so nothing repeats
#   shadows: the east platform's shadows that touch the photo's right edge carried on along their own slant, fading
# usage: build_source.py <photo> <out.png> [seed]
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, gaussian_filter1d, zoom

src, out = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(int(sys.argv[3]) if len(sys.argv) > 3 else 5)
P = np.asarray(Image.open(src).convert('RGB'), dtype=np.float32) / 255
h, w, _ = P.shape
OW = int(round(h * 1.6))
lum = P @ np.array([.3, .59, .11], dtype=np.float32)

# row colour of lit water / sky, read where nothing stands
TRUST = [(0, 470, 460), (470, 640, 650), (940, h, 684)]  # (y0, y1, x0): rows whose right band is open water or sky
row = np.full((h, 3), np.nan, np.float32)
for y0, y1, x0 in TRUST:
    for y in range(y0, y1):
        band, bl = P[y, x0:w], lum[y, x0:w]
        keep = bl >= np.quantile(bl, .45)
        row[y] = np.median(band[keep], axis=0)
for c in range(3):
    ok = ~np.isnan(row[:, c])
    row[:, c] = np.interp(np.arange(h), np.flatnonzero(ok), row[ok, c])
row = gaussian_filter1d(row, 9, axis=0, mode='nearest')

# shadow strength in the photo near its right edge, relative to the row's lit colour
rowl = row @ np.array([.3, .59, .11], dtype=np.float32)
shade = np.clip((rowl[:, None] - lum) / .16, 0, 1)
shade = gaussian_filter(shade, 1.5)
sh_mask = shade[:, w - 40:w] > .5
shadow_col = np.median(P[:, w - 40:w][sh_mask], axis=0) if sh_mask.any() else row.mean(0) * .7
shadow_ratio = shadow_col / max(1e-3, float(np.median(row[600:950], axis=0).mean()))

res = P - row[:, None, :]
CALM = [(450, 260, 730, 470), (0, 300, 270, 520), (0, 520, 160, 660), (450, 0, 736, 235)]
CALM_SKY = [(450, 0, 736, 235)]

O = np.zeros((h, OW, 3), np.float32)
Wt = np.zeros((h, OW), np.float32)
PWp, PHp = 170, 110
win = np.outer(np.hanning(PHp + 2)[1:-1], np.hanning(PWp + 2)[1:-1]).astype(np.float32) + 1e-4
X0 = w - 70
for gy in range(-PHp // 2, h, PHp // 3):
    for gx in range(X0 - PWp // 2, OW, PWp // 3):
        cy = min(h - 1, max(0, gy + PHp // 2))
        s = 1.0 + max(0, cy - 470) / 520
        pool = CALM_SKY if cy < 250 else CALM[:3]
        x0, y0, x1, y1 = pool[rng.integers(len(pool))]
        sw, shh = int(PWp / s) + 2, int(PHp / s) + 2
        if x1 - x0 <= sw or y1 - y0 <= shh: continue
        sx, sy = rng.integers(x0, x1 - sw), rng.integers(y0, y1 - shh)
        patch = res[sy:sy + shh, sx:sx + sw]
        patch = patch - patch.mean(axis=(0, 1))
        patch = zoom(patch, (PHp / shh, PWp / sw, 1), order=1)[:PHp, :PWp]
        if patch.shape[0] < PHp or patch.shape[1] < PWp: continue
        ty, tx = gy + int(rng.integers(-12, 13)), gx + int(rng.integers(-20, 21))
        a0, b0 = max(0, ty), max(0, tx)
        a1, b1 = min(h, ty + PHp), min(OW, tx + PWp)
        if a1 <= a0 or b1 <= b0: continue
        pw = win[a0 - ty:a1 - ty, b0 - tx:b1 - tx]
        O[a0:a1, b0:b1] += patch[a0 - ty:a1 - ty, b0 - tx:b1 - tx] * pw[..., None]
        Wt[a0:a1, b0:b1] += pw
tex = O / np.maximum(Wt, 1e-3)[..., None]

yy, xx = np.mgrid[0:h, 0:OW].astype(np.float32)
low = gaussian_filter(rng.standard_normal((h // 40 + 2, OW // 40 + 2)).astype(np.float32), 2)
low = zoom(low, (h / low.shape[0], OW / low.shape[1]), order=3)[:h, :OW]
low = low / (np.abs(low).max() + 1e-6)
amp = (1 + .5 * np.clip((yy - 500) / 600, 0, 1))[..., None]
field = row[:, None, :] * (1 + .03 * low[..., None]) + tex * amp

# carry the edge shadows on along their slant (they fall right and a little down), fading out
SLOPE, FADE = .42, 120.0
edge = shade[:, w - 1]
ext = np.zeros((h, OW), np.float32)
d = np.clip(xx - (w - 1), 0, None)
ysrc = np.clip((yy - d * SLOPE).round().astype(int), 0, h - 1)
ext = edge[ysrc] * np.clip(1 - d / FADE, 0, 1) ** 1.5
ext[:, :w] = shade[:, :w]
field = field * (1 - ext[..., None]) + field * shadow_ratio[None, None, :] * ext[..., None]

# the photo, cross-faded into the continuation over its last 40 px
Fw = np.clip((xx - (w - 40)) / 40, 0, 1)[..., None]
Fw[:, w:] = 1
base = np.zeros_like(field); base[:, :w] = P
outI = base * (1 - Fw) + field * Fw
Image.fromarray((np.clip(outI, 0, 1) * 255 + .5).astype(np.uint8)).save(out)
print(out, OW, h, 'shadow_col', shadow_col.round(3), 'ratio', shadow_ratio.round(3))

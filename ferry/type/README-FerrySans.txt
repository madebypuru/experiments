Ferry Sans 1.000
================

The sans typeface for Ferry: body copy, interface, ticket labels and numbers.
It grows the "ferry" wordmark into a full typeface: a Helvetica-style grotesk
with every convex corner softened by the logo's radius (1.89% of the
ascender height, half the butterfly mark's corner radius).

Its proportions are tuned to the wordmark first approved in Helvetica Neue, so
the logo looks the same set in Ferry Sans. Per style, from numbers measured once
against Helvetica Neue's metrics (no Helvetica outlines are used):
- a horizontal stretch of 2.4 to 4.6% (matches stem weight and letter widths)
- descenders of g j p q y shortened (to 0.84 in the bold styles)
- lowercase x-height adjusted (-2.3% bold, +0.7% regular)
- longer f and r arms
- in the bold styles, a fuller y tail with a taller flag (Y_TAIL)
Kerning and mark positions scale with the stretch. The factors are in
tools/typeface.py (TUNE).

Styles: Regular 400, Italic 400, Bold 700, Bold Italic 700. 1,084 drawn glyphs each.

Use
---
- Body and interface: Regular, 14 to 18 px, tracking 0, line height 1.5.
  Emphasis is italic, not bold.
- Labels: Bold caps, 10 to 12 px, +14% to +16% tracking, muted colour.
- Large: Bold at -5% tracking (the wordmark's setting), for numbers and the
  wordmark. Display headlines are set in the brand serif, not this sans.
- The watercolour bleed (src/bleed.html, bleed()) is for display sizes only.

Files
-----
fonts/FerrySans-*.otf     desktop (CFF outlines)
fonts/FerrySans-*.woff2   web
specimen.html             type specimen; open in a browser
source/                   the unmodified TeX Gyre Heros fonts and licence
../tools/typeface.py      rebuilds fonts/ from source/:
                          python3 tools/typeface.py type/source type/fonts

Licence and manifest
--------------------
Ferry Sans is a modified version of TeX Gyre Heros 2.004 by the GUST
e-foundry (B. Jackowski, J. M. Nowacki), distributed under the GUST Font
License, which is the LaTeX Project Public License 1.3c or later
(https://www.latex-project.org/lppl.txt). As that licence requests, the
derived fonts carry new names:

  texgyreheros-regular.otf     -> FerrySans-Regular.otf / .woff2
  texgyreheros-italic.otf      -> FerrySans-Italic.otf / .woff2
  texgyreheros-bold.otf        -> FerrySans-Bold.otf / .woff2
  texgyreheros-bolditalic.otf  -> FerrySans-BoldItalic.otf / .woff2

The changes: proportions tuned as described above, then every convex corner
of every glyph is replaced by a circular fillet of radius 13.8 units (1000
units per em).
The original copyright notice is kept in each font's name table.

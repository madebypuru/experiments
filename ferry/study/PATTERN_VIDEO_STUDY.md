# Pattern video study: /Users/purusharma/Downloads/pattern.mp4

2160x2160 square, 5.22 s, 60 fps (313 frames), no audio checked, no text or instructions visible. Raw contrast is extremely low (background grey 35, lines grey 55-66 out of 255); I studied contrast-stretched copies (bsheet-*, boost-*).

## Unit shapes
There are no tiles or geometric blocks. The only unit is a **vertical full-height line (a bar)**, one distinct shape. Its width varies per line, from a hairline (about 2 px at 2160) to a thick bar about 60% of the line pitch. Edges are not crisp: they wobble and bulge, like a displaced or hand-inked edge (see crop-5.1.png). Corners cannot be judged (lines run edge to edge vertically). Solid fills, no outlines.

## Grid
One dimension only: about 25 to 27 lines across, even pitch, about 80-86 px at 2160 (about 4% of frame width). Gap = pitch minus line width, so gaps are widest on the thin side. No rows. Cells are not square: the unit is a full-height column. The grid is not drawn; it is implied by line positions.

## How it reads as a pattern
Settled state (t about 5.1 s): every line full height, widths fall smoothly and monotonically from thick at the left edge to hairline at the right edge, so it reads as a striped fade, a gradient made of line weight. Start frame (t 0) is the mirror: thick at right, hairline at left, with the top-left already starting to clear. Two settled orientations are seen (thick-right, thick-left) and one empty state (t about 2.0 s, plain ground). Width ramp, not shape, is what makes it one pattern.

## Motion beats (timestamps from 5 fps boosted sheet, accurate to about 0.2 s)
| t (s) | What happens |
|---|---|
| 0.0 | Thick-right ramp, top-left already clearing along a diagonal |
| 0.0-2.0 | Erase: each line retracts downward toward the bottom edge, left lines first; a diagonal front (lower-left to upper-right, slightly curved) sweeps rightward. Lines also thin as they go; thick right-hand lines survive longest |
| about 2.0 | Fully empty ground, about 0.2 s |
| 2.2-3.4 | Draw: lines grow downward from the top edge, left first; diagonal front (top-left to lower-right) sweeps rightward. Left lines come in thick |
| 3.4-5.0 | Front continues to the right; right lines arrive hairline |
| 5.1-5.2 | All lines full height, thick-left ramp. Not yet seen to hold |

Mover is length (top end retracting / growing) plus width; no rotation, slide, flip or colour swap. Order is a left-to-right wave with a per-line delay, not random. Erase wave about 2 s, draw wave about 3 s, so draw looks slower. Easing: front speed looks roughly even with slight acceleration; line width change looks eased. Cannot tell exactly.

## Colour
Two colours. Ground about rgb(28,37,40) (dark teal-black). Line about rgb(46,70,78) (muted teal), estimated from grey values. Thin lines are dimmer through antialiasing, so brightness tracks width. No colour change over time.

## Anything else
No type, logo, image, texture or layout around it; the pattern fills the frame edge to edge.

## Density (figure share, estimated from the line profile)
Thick-side zone about 50-60% figure, hairline zone under 5%; whole frame at thick-left or thick-right settled state about 25-30%. Empty state 0%.

## What cannot be told from frames
- Whether it loops: clip begins mid-erase of a thick-right state and ends at a thick-left state; the cycle might be erase-right, draw-left, then mirror, but only half a cycle is shown.
- Whether the width ramp is fixed or shifts as the wave passes.
- Exact easing, exact line count (25 to 27), exact colours (low contrast, video compression).
- Whether the wobbly edge is animated or static (frames look different per frame, likely compression noise plus a displacement filter).
- Whether the video is a screen recording of a bigger composition.

## Differences from Ferry's current pattern engine (pattern.js v5)
Video does, engine does not:
- A single full-height line as the unit with a continuous width ramp across the frame; the engine uses stacked rounded blocks in three reach levels.
- Vertical grow and retract of each line from the top or bottom edge; the engine moves blocks sideways toward or away from a channel.
- A full-frame empty state and diagonal wipe in both directions, with a single left-to-right sweep; the engine's Arrive holds shores open and never fully empties the field at once (open 1.5 s only per shore, staggered).
- Hairline-to-thick weight gradient as the pattern's main read.
- Pure two-tone teal on dark teal-black.

Engine does, video does not:
- Rounded corners (one radius), stepped shores, mirrored shore pairs, seeded variation, bands at 1x/1.5x/2x, rotate 90, optional route lines, Tide and Swap modes (wipe to inverse colours), reduced-motion and hold states, and a seamless 10 to 12 s loop.
- Watercolour bleed filter on edges (video also has wobbly edges, but of a different, finer character).

# Ferry's primitive, round two: the merge

Nov 12, 2026. The sheet is `primitive-2.html` in this folder. Round one (`PRIMITIVE.md`, `primitive.html`) is left as it was. The client liked its idea and rejected its look. This round keeps the measurements of the mark and the state logic, and replaces the look.

The idea in one line: a crossing is the channel between two shores being bridged. Two soft shapes are joined by a neck with concave fillets, and each merged object is one outline.

## Classic base, modern layer
The gouache paintings are the classic, trusted half. They stay painterly and carry all the colour. The UI on top is the modern half: crisp geometry, plain Ferry Sans, tabular figures, product spacing and small live details (the neck filling, the seconds counting). No grain, bleed, paper texture or print effects on UI surfaces. The bleed stays on display headlines only. Every piece has one layer of each.

## 1. Geometry
Every merged object is a single SVG path (or a clipPath union of two paths when a tab sits above a card). It is built by `merge()` in the sheet's script. Nothing uses a blur or goo filter, so the edges stay crisp at any size.

A merge is a run of segments along one axis, each with a cross extent. Where the extent changes, the outline makes an S of two tangent arcs: a convex arc at the wider segment's corner radius R, then a concave fillet f into the narrower one. When the step is deeper than R + f, a straight wall joins the arcs. When it is shallower, both arcs turn through θ = acos(1 − d / (R + f)), so the S stays smooth with no kink. The mark's own steps follow this rule (one radius, convex and concave).

## 2. Panel merge (hero, phone)
Measured from `src/butterfly-mark.svg` (see `PRIMITIVE.md`, section 1). H is the panel height.

| Measure | Rule | Hero (H = 940) | From the mark |
|---|---|---|---|
| Channel c | 0.106H | 100 | c / H of one half = 15.48 / 142.41 |
| Neck height n | n = c | 100 | the crossing is as tall as it is long |
| Neck position | centre at 0.447H | y = 480 | the mark's waterline (nose centre) |
| Fillet f | c / 2 | 50 | each side of the water ends in a half round |
| Corner R | 0.05H | 48 | generous; 30 on a 600 px panel |
| Stepped corner | tread 1.3c, riser 0.76c, radius R | 130 × 76 | the mark's outer tread and first riser |

- One stepped corner per panel, on the top corner that faces the channel, mirrored on both panels the way the mark's halves face each other. Other corners are plain.
- Tab into card: tab height T, radius 0.3T. The gap between tab and card is g = 0.375T (30 on an 80 px tab). The neck is g wide, with f = g / 2.
- One painting fills the painting panel and runs into the neck, and it stops at the card's edge. The card is the surface `#F9F7F3` (Paper lifted toward white).
- Shadow on the merged object only: 0 30 50 at 12 percent Ink, plus 0 2 4 at 5 percent.

## 3. The transfer chip
`[ from tile ]  neck: status · time  [ to tile ]`

| Measure (H = chip height) | Value |
|---|---|
| Tile radius R | 0.3H |
| Neck height | 0.6H (inset 0.2H top and bottom) |
| Fillet f | 0.2H |
| Type | 0.34H, floor 12 px. Chains Bold, status Italic, time Bold, tabular figures |
| Tile padding | 0.36H |
| Neck padding | 0.42H each end; the neck holds the width of its longest status |
| Sizes | 32, 40, 44 in UI; 96 and up for display |

The transition from tile to neck is d = 0.2H against R + f = 0.5H, so θ = 53°. The waist is a smooth S. It is not a notch.

**The value rule.** Value is where the painting is. The shore that holds the value shows the warm sky passage of `ferry-arrival-gouache`. An empty shore is a plain well: `#E3E5DD` on light surfaces, Paper at 90 percent on a painting. Progress is the painting flowing into the neck from the origin side. Nothing sits under the chip as a bar.

| State | Origin tile | Neck | Destination tile | Time |
|---|---|---|---|---|
| Holding at the pier | painting | well | well | 12:04 |
| Departed | painting | 7 percent painting | well | 12:04 |
| Crossing | painting | painting to progress | well | 23s, counting |
| Arrived | well | full painting | painting | 41s |
| Paused in port | painting | stopped at progress | well | 12:06, with a Signal dot before the word |

Signal `#D2602C` appears only as the Paused dot. The stacked form is the same merge turned a quarter, with tiles of equal width, the neck inset 0.2H on both sides and filling top to bottom. The phone uses "At the pier" as the UI form of "Holding at the pier" (round one's open question 3).

**Motion.** The loop runs 12 s. Holding lasts 1.5 s. Departed eases in over 1.3 s. Crossing lasts 5.8 s with a cubic in-out, and the seconds count to 41. Arrived sweeps the painting into the far tile while the origin empties, over 1.4 s. To settle, the neck and the far tile fade out over 0.6 s, then the origin fills over 0.6 s. Paintings drift by 3.5 percent over 26 s. Under `prefers-reduced-motion` everything holds still, in Crossing.

## 4. On the sheet
- **A. Hero, 16:9.** Painting panel, neck and card are one outline on a blurred passage of the day lighthouse. The Track tab flows into the card.
- **B. Poster, 4:5.** The stacked chip is the headline. Its destination shore is the painting panel itself, with the ferry arriving.
- **C. Chip.** Anatomy at 120 px, five states, sizes 32, 40 and 44, the stacked form and display size, on a light surface and on a painting.
- **D. Phone, 390 px.** The painting merges down into the card through a neck. A live chip runs the loop.
- **E. Construction.** The mark with c, the nose and the waterline, next to the hero outline with its measures.

Every painting has a fallback fill (`#E9A84F` under the warm passages, `#8FB3B8` under the fields), so the sheet holds together if `ferry/assets/` is missing.

## 5. What changed from round one
- The heavy Harbour and near-black fills are gone. Value reads from the painting, not from a dark block.
- The outline "open shore" and the grey channel are gone. Tiles and neck are one shape.
- The H/8 notch with a 2 px radius is gone. Radii are now generous (0.3H on chips, 0.05H on panels). The step survives once per panel, at large scale, where it is legible.
- Image and UI are no longer boxes placed on a painting. They share one outline.
- The cream sheet is gone. The page sits on a veiled, blurred passage of the lighthouse painting.
- The wake bar under the chip is gone. Progress lives in the neck.

## 6. Tried and dropped
- **Noses at the panel join** (the mark's 0.40H nose with the neck inside it). Every edge became curve, and the join read as a jigsaw tab.
- **A fat neck of 0.19H.** Too heavy. It looked like a bridge pier, not water.
- **Desaturating the neck on Paused.** It looked dirty. The Signal dot does the work alone.
- **A crossfade to settle the loop.** For half a second the whole chip went pale gold. It was replaced by two sequenced fades.
- **The golden lighthouse sky as the page ground.** Blurred, it went khaki and aged. It was replaced by the water of the day painting under a 42 percent Paper veil.
- **The ferry's full frame inside small chips.** The boat sat behind the words. Chips now crop to the sky passage only.

## 7. Open questions
1. Is "At the pier" acceptable as the UI form of "Holding at the pier"?
2. Should the card surface `#F9F7F3` be added to the palette, or should UI cards use Paper `#F2EEE6`? The lifted value reads cleaner next to the paintings.
3. Panel radius at 0.05H: should it be capped (for example 48 px) on very large panels?

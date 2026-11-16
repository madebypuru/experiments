# Transfer ticket

A boarding pass shrunk to one line. The ticket is paper: card stock, a cut edge, the stamp's stepped notch, inked type with the brand bleed. The parts printed on it are modern and crisp: the route line, the ferry dot, the state glyph and the tabular figures. Engine: `../print/ticket.js` (load `stamp.js` first). Sheet: `chip.html`.

## Engine

`Ticket.ready` resolves when Ferry Sans has loaded. `Ticket.draw(target, opts)` appends one ticket `<svg>` to `target` and returns it. The same options and seed always draw the same ticket.

| Option | Meaning |
|---|---|
| `from`, `to` | Codes, Ferry Sans Bold caps (SOL, ETH, BASE, ARB) |
| `fromName`, `toName` | Chain names, shown at 120 |
| `state` | `pier`, `departed`, `crossing`, `arrived`, `held` |
| `departs`, `arrives` | Clock times. `arrives` also goes into the postmark |
| `elapsed` | Crossing time: on the line while crossing, in the stub once arrived |
| `since` | When a held ticket stopped |
| `size` | 40, 84 or 120 (the height H) |
| `ground` | `paper` or `painting`. Both use the same shadow |
| `seed` | Paper, edge and ink noise |
| `x`, `y`, `scale` | Position in the target, and display scale (the hero is drawn at 120 and scaled to 620 px, four frame columns) |
| `date`, `year`, `port` | Postmark text. Defaults: 12 NOV, 2026, PORT 02 |

`Ticket.width(size)` returns the ticket's width.

## Measures (H = height)

- Inset: H/6 on every side of the body and the stub. Gaps are multiples of 4.
- Corner radius: max(2, H/40) at every corner, the notch included. The cut is softened by one filter (blur H/40 x 0.25), so every corner, the notch steps included, gets the same small softness.
- Body: 218 px at 84 and 374 px at 120. The stub is as wide as its widest state needs (rounded up to 4), the same for every state.
- 40: 190 wide, codes 14, glyph 12 at the right. No labels, no stub, no bleed.
- 84: codes 22, labels 9 (Bold caps, +18 percent). Labels and status word on baseline 33, codes and time on baseline 57. One-step notch: 18 wide, then 9 wide from 4.5 to 9 deep (tread and riser 4.5).
- 120: codes 30, labels 10. Labels on 37, codes and status word on 71, names and time on 92. The stamp's three-step notch: widths 26 / 17.2 / 8.8, depths 5.3 / 10.1 / 14.
- Route: equal gaps between code, line, time and code (8 at 84, 12 at 120). The dot never comes nearer a code than the line's end does. The Departed wake is at least 16 px at 84 and 24 px at 120.
- Stub: glyph, 4 px gap, then the status word in Bold on one line, with the glyph centred on the x-height. Under the word sits a small caps label (DEPARTS, LEFT, CROSSED, SINCE), then the time in Regular tabular figures.
- Ink: the codes bleed at u = 1.8 percent of cap height, the small type at 0.9 percent. Labels are `#4A5559` (5.7:1 measured on the card).
- Paper: card `#FFFBF0` under a lighter speck, tone and fibre, about 5 levels lighter and warmer than the page. Shadow: contact 0.5 blur, (0.5, 1), alpha 0.22; lift 2 blur, (2, 3), alpha 0.12; a warm white rim inside the top-left edge. Light comes from the top left.

## States

| State | Line | Glyph | Word | Time row |
|---|---|---|---|---|
| At the pier | dot at the FROM end, all dotted | hollow ring | At the pier | DEPARTS 12:04 |
| Departed | wake to 15 percent | ring with dot | Departed | LEFT 12:04 |
| Crossing | wake, dot, elapsed time centred on the line | half-filled ring | Crossing | LEFT 12:04 |
| Arrived | all solid, dot at the TO end | Harbour disc with check | Arrived | CROSSED 41s |
| Held at port | dot stopped in Signal | Signal pause bars | Held at port | SINCE 12:06 |

At 120, Arrived takes the ARRIVED postmark: Harbour, normal blending, at -12 degrees, crossing the tear and running off the top. Held takes a HELD AT PORT rubber stamp in Signal in the same place. A view shows Signal once, so it holds one Held ticket at most.

## Where each part comes from

| Part | From |
|---|---|
| Notch steps, paper speck and tone, uneven ink, shadow and rim | `print/stamp.js` and `print/stamp-01.html` |
| Postmark, and the ink filters of the rubber stamp | `postmark()` in `print/stamp.js` |
| Ink bleed on type | `bleed()` ink mode in `src/bleed.html` |
| FROM / TO, codes, tear, stub | postcard back and the in-transit ticket in `study/PRINT_TO_UI.md` |
| Label setting | ticket print voice in `type/VOICES.md` |

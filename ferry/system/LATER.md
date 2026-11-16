# Later: grid, formats, use cases

Drafted on Nov 11, 2026, then set aside: too much, too early. Each part comes back when a real touchpoint needs it, and gets checked against that touchpoint first.

## Grid and spacing

- **Base unit 8 px**, with 4 px for fine adjustments. Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- **Radii:** 8 for chips and buttons, 16 for small cards, 24 for bento tiles. Paintings that bleed off the edge have none. Stamps use the stepped edge, tickets use punched notches.

### Web

| Width | Columns | Gutter | Margin |
|---|---|---|---|
| 1024 and up | 12 | 24 | 64 (content max 1280) |
| 640 to 1023 | 8 | 24 | 32 |
| under 640 | 4 | 16 | 16 |

### Bento

- Tiles span 3, 4, 6, 8 or 12 columns; row height 320; gutter 16 (tighter than the page gutter, so the bento reads as one object); radius 24; inner padding 32.
- One idea per tile: one painting or one object, one serif line, at most two lines of sans.
- Headlines alternate between the top and the bottom of tiles, as on the board.
- Paintings bleed to the tile edge; text tiles use Paper, Mist or Harbour.

### The mark

- **Clear space:** half the butterfly's width on every side.
- **Minimum size:** butterfly 16 px wide; full lockup 96 px wide. Below 32 px, use the clean SVG without bleed.

### Social and formats

| Format | Size | Grid and safe zone |
|---|---|---|
| X header | 1500 × 500 | Keep content inside the central 1500 × 360 (phones crop top and bottom). Leave x 0 to 320, y 300 to 500 empty for the profile picture. Mark or line sits in the right two thirds. |
| X post | 1600 × 900 | 12 columns, 80 margin, 24 gutter |
| OG image | 1200 × 630 | 64 margin, mark top left, line bottom left |
| Ticket | 2 : 1 | Stub at 72 percent of the width, dashed perforation, a punched notch at each end of the perforation |
| Stamp | 4 : 5 | Stepped perforated edge, painting inset by 6 percent, port name top left, seal top right |
| Postcard | 3 : 2 | Painting front; back split at 50 percent, message left, address lines right, stamp top right |

## Use cases

| Use | Field | Text | Mark | Painting |
|---|---|---|---|---|
| Landing hero | Painting, full bleed | Paper on painting (3:1 at least) | Paper | Full bleed |
| Landing sections | Paper, then Harbour for one contrast band | Ink / Paper | Ink / Paper | In bento tiles |
| Bento feature tile | Paper or Mist | Ink | None | One per tile |
| Transfer status UI | Paper | Ink, state chips | Ink, small | Small painted state scene |
| Ticket and receipt | Stone or Paper | Ink | Ink | None, or a stamp |
| Stamp (ports of call) | Paper frame | Ink | Seal in Ink | Inset painting |
| X header | Painting | Optional Paper line | Paper | Full bleed |
| X post | Paper or Harbour | Ink / Paper | Ink / Paper | One painting or the crossing kit |
| App icon | Harbour | None | Paper | None |
| Incident notice | Paper | Ink, Signal chip | Ink | Rain scene |

## Paintings and the palette

- Paintings keep their own colour. Their source photos are chosen to sit near the palette (muted water, weathered whites, warm stone), with sunsets kept for special moments: launches and arrivals.
- A painting always meets the system through a Paper mat, a full bleed to the frame's edge, or a Harbour field. It never floats on an off-palette colour.
- The logo wash gets repainted in the palette: Mist sky, Sea glass and Harbour water, Sea grass land, a touch of Stone.

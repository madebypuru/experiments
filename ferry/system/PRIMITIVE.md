# Ferry's primitive: the shore, the step and the channel

Nov 12, 2026. The anatomy and applications sheet is `primitive.html` in this folder. It answers gap 1 (no formal primitive) and gap 2 (no product truth in the graphics) in `../study/GAP_ANALYSIS.md`.

The idea in one line: every Ferry container is a shore. Value sits on a shore, and a transfer is a crossing of the channel between two shores. The shape comes from the mark. It does not come from the grid.

## 1. The mark, measured

Measured from the path data in `src/butterfly-mark.svg` (165 × 142.93 drawing units). The script that read the path is `measure.mjs` in the session scratchpad. The mark is not built on a whole-number grid. A fit across all 16 lengths found no unit above 2.2 that holds, so every length is given as a ratio of the channel.

**The unit, c, is the channel: 15.48 units, the gap between the two noses (9.4 percent of the mark's width).**

| Part | Units | In c |
|---|---|---|
| Channel between the noses | 15.48 | 1 |
| Corner radius, on every inner and outer corner | 3.29 | 0.21 |
| Step treads, outer then inner | 20.18, 18.98 | 1.30, 1.23 |
| Nose, the face that meets the channel | 56.98 | 3.68 |
| Step risers above the nose | 11.76, 23.42 | 0.76, 1.51 |
| Step risers below the nose | 32.44, 17.80 | 2.10, 1.15 |
| Berth notch on the outer side, depth by height | 24.26 × 43.08 | 1.57 × 2.78 |
| One half, width by height | 74.76 × 142.41 | 4.83 × 9.20 |
| Whole mark, width | 165.00 | 10.66 |

Observations that shaped the rules:
- **One radius everywhere.** The radius is 3.29 on every corner, convex and concave, which is 2.3 percent of the height. The mark is a softened square, not a rounded one. The only sharp corners are the two at the mouth of the berth notch, where it opens to the outer edge. They read as a cut.
- **The nose sits high.** Its centre is at 44.7 percent of the height. The steps below it are taller than the steps above (50.2 against 35.2, about √2). The mark has a waterline. The berth notch lines up with the nose to within 0.5 units.
- **The upper risers double.** 11.76 then 23.42 (ratio 1.99). The treads are near equal at about 1.25c.
- **The two halves are not quite level.** The right half sits 0.52 units higher than the left. This is probably a drafting slip, and it should be checked with the mark's owner before anyone builds on it.

## 2. Shape rules

1. **The shore.** A Ferry container is a softened rectangle with a single step on the side that faces the crossing. The step's tread is H/8 and its riser is H/6, so the nose that meets the channel is two thirds of the height. The other sides are plain.
2. **One step, never two.** The mark has two steps per side. Containers use one. Two or more steps at small sizes read as a staircase of pixels: game UI, not a ferry service.
3. **The radius.** r = max(2 px, H/40). That is close to the mark's 2.3 percent. The 2 px floor keeps the softness visible at UI sizes, in the same spirit as Ferry Sans's corner fillet. Every corner gets it, inside and outside. Nothing is pill-shaped.
4. **The channel.** The gap between two shores is the channel. Its depth is fixed by the noses (two thirds of the height), and its length is elastic. As a plain divider between two facing containers it is one tread wide (H/8). As the place where a transfer happens, it stretches to hold the status.
5. **Two shores face each other.** When two containers sit side by side, their steps face each other across the channel, like the mark's halves. One painting may run across both shores, so the gap reads as water you cross (`02 Shape`, middle figure).
6. **Painting crops.** A painting may be cropped by a shore. The step goes on the side that faces the subject's direction of travel or the next element. Never put a step on all four sides.
7. **Scale, 24 px to poster.** Every measure is a fraction of H, so the step keeps its proportion at any size. Below 24 px the step is dropped and the shape becomes a plain softened rectangle. At display sizes the shapes and type may be laid down with the watercolour bleed from `src/bleed.html`.
8. **Felt, not shouted.** The step is the only decoration. No outline stacks, no shadows on UI containers, no gradients.

## 3. The transfer chip

### Structure
`[ FROM shore ]▸ channel: amount · status · time ◂[ TO shore ]`

- **From shore** holds the origin chain or place.
- **Channel** holds, in order, the optional amount, the status word and the time. It is the elastic part.
- **To shore** holds the destination.
- **The value rule.** The filled shore is where the value is now. The other shore is open, drawn as an outline. When a transfer arrives, the fill moves to the far shore and the origin opens. State reads from shape before anyone reads a word.
- **The wake** is a bar along the bottom of the channel. Its length is the crossing's progress.

### Two forms
- **Across** is the default, for UI rows, receipts and landscape display.
- **Stacked** is the same shores and the same step turned a quarter, with origin on top, the channel in the middle and destination below. The wake runs down the channel's left edge. The stacked form is used when the across form does not fit (phones, long chain names and amounts) and for portrait display such as the 4:5 poster. The channel's words wrap onto further lines when they need to, and the channel grows taller to hold them.

### Measures (all fractions of chip height H)
| | Value |
|---|---|
| Step tread | H/8 |
| Step riser | H/6 (channel and nose depth 2H/3) |
| Radius | max(2 px, H/40) |
| Type size | 0.36H |
| Shore padding | 0.36H, less half a tread on the nose side |
| Channel padding | 0.25H each end |
| Gap between channel words | 0.2H |
| Open shore outline | max(1 px, H/40), drawn inside the shape |
| Wake | max(2 px, H/16) thick |

### Sizes
- UI: 32, 40 and 44 px tall. At 32 px the type is 11.5 px, which is the floor. Do not go below 32 px for a chip with words.
- Display: 96 px and up. From about 96 px the chip may take the bleed.
- Poster: the stacked form at the T4 headline size (80 px type on the 1080 × 1350 page, across four columns, 620 px).

### Type roles (Ferry Sans only, client ruling of Nov 12)
- Chain names: Ferry Sans Bold.
- Amount: Ferry Sans Regular, with tabular figures in tables.
- Status word: Ferry Sans Italic.
- Time: Ferry Sans Bold.
- At display size the whole chip, shapes and type, is laid down with the watercolour bleed (ink mode, u = 0.72 percent of the type size, with grain lowered to 15 percent on the large surfaces so they do not look dirty).
- No serif and no script anywhere in the chip.

### States
| State | Fill | Wake | Time shown | Copy |
|---|---|---|---|---|
| Holding at the pier | Origin | None | Scheduled departure, 12:04 | Holding at the pier |
| Departed | Origin | Starts, about 7 percent | Departure, 12:04 | Departed |
| Crossing | Origin | Grows with progress | Expected crossing, 41s | Crossing |
| Arrived | Destination | Full | Actual crossing, 41s | Arrived |
| Paused in port | Origin | Stopped, in Signal | Time paused, 12:06 | Paused in port |

"Paused in port" is the incident state: the funds are safe, and the transfer is waiting. It is the only state that uses Signal, and so it is the one Signal in view.

### Colour
| Ground | Filled shore | Open shore | Channel | Wake |
|---|---|---|---|---|
| Light (Paper, UI surfaces) | Harbour, Paper text | `#FBF9F4` fill, Harbour outline, Ink text | Mist, Ink text | Harbour |
| On a painting or a dark field | Paper, Ink text | Harbour fill, Paper outline and text | Mist, Ink text | Harbour |
| Black and white | Ink | White, Ink outline | 12 percent grey | Ink |

Measured on the rendered page: Paper body text on the poster's water passes at 12.3:1, and the poster's channel text at 8.1:1. From the palette values, Ink on Mist is about 10:1 and Paper on Harbour about 9:1.

### Motion
The loop on the sheet runs for 12 seconds. Holding lasts 1.5 s. Departed eases the wake out over 1.3 s. Crossing lasts 5.8 s: the wake eases across the channel with a cubic in-out, and the seconds count up to 41. Arrived lets the fill flow to the far shore over 1.4 s, then everything settles back over 1.2 s. There is no bounce or overshoot. The channel holds the width of its longest status word, so the chip never changes width while it moves. Under `prefers-reduced-motion` the chip is still, in the Crossing state.

## 4. Applications on the sheet
- **(a) Poster, 4:5.** The stacked chip is the headline: "Solana / Arrived 41s / Ethereum". It is laid down in bleed, in Paper over an enlarged passage of the rowboats painting's water, with two lines of fact below and the lockup bottom left. The boats stay below the type, and no box sits on the subject.
- **(b) Product.** A Transfers panel with three rows (Crossing, Arrived, Paused in port) over an enlarged, softened passage of the dusk lighthouse painting. On phones the amount moves under the chip.
- **(c) Receipt.** One chip forms the receipt's route line, between the ticket facts and the totals. The slip lies on the rowboats water with the quiet paper-on-surface shadow.

All three use the paintings as the environment (client ruling, Nov 12). Each painting has a Harbour fallback, so the sheet still holds together if `ferry/assets/` is missing.

## 5. What was explored and rejected
Black and white first, at 36 px and at 120 px. Renders are in the session scratchpad (`explore1.png`, `explore2.png`).

- **A. Facing shores with the status trailing outside.** This is closest to the mark: two tiles with noses across a narrow channel. The status had no home and floated after the chip as a caption. The noses, at that depth, looked like plugs or puzzle tabs.
- **C. A stepped stub ticket.** "Solana to Ethereum" on a filled body, with the status on a stub cut off by a stepped seam. It reads as a ticket, but the seam looks like a USB connector at small sizes, and it puts the route on one shore, which loses the two-shores idea.
- **D. Offset stacked tiles.** The shores sat on two lines, offset, with the status beside them. It was loose and wide, and it had no channel. Its stacking survived, rebuilt as the chip's stacked form.
- **B variants.** Four channel treatments were compared: a tinted field, hairlines top and bottom, a tinted field with a wake, and a shallower step. The hairline channel looked like a form input. The tinted channel with the wake was the calmest, and it is the one carried forward.
- **Deep or protruding noses.** At a tread of 0.2H and above, the step reads as a tab, which is childish. It was reduced to H/8.
- **Two-step containers.** Rejected as pixel art (rule 2).
- **Serif numerals.** Removed after the client ruled that Ferry uses Ferry Sans only.
- **Gradients and grounds on cream.** Rejected by client ruling. The paintings are the environment.

## 6. Open questions
1. **The mark's 0.52-unit offset** between the halves. Is it intended?
2. **The stacked form's step** is the same H/6 inset as the across form. On a 620 px poster chip that is 32 px, which is quiet. A deeper inset (the mark's own nose is 40 percent of its side) would look more like the mark turned on its side. Decide this when the posters are rebuilt.
3. **Status vocabulary.** "Holding at the pier" is long. It forces the stacked form on phones in most rows. It may need a shorter UI form, such as "At the pier", with the full phrase kept for notices.
4. **Bleed on UI-adjacent pieces.** The bleed is used only at display size. Should a receipt (a printed object) carry it on its route line?
5. **Paintings.** The sheet uses studies of other people's photos (`ferry/assets/`). They are placeholders until Ferry has paintings from sources it owns.
6. **Chain names** (Solana, Ethereum, Base, Arbitrum) are placeholders. Real chain logos are deliberately absent: the chip carries words, not third-party marks. Confirm that this holds in the product.

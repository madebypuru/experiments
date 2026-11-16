# Ferry's Swiss grid

The layout system for Ferry's social posts and presentation slides. It's built on Josef Müller-Brockmann's modular grid (Grid Systems in Graphic Design, 1981) and fed by the layouts studied on the "2 hour brand exercise" board (`BOARD_STUDY.md`, `POSTER_GRIDS.md`). Built in `print/swiss.html`.

## The principles taken from the Swiss grid

1. **One unit for everything.** A baseline unit sets the type's leading, the gutters, the margins and the module size, so every measurement is a multiple of it.
2. **Modular fields.** The page is divided into columns and rows of equal fields separated by gutters. Text and images fill whole fields; nothing is placed by eye.
3. **Type on the baseline.** Every line of text sits on the baseline grid, and every leading is a whole number of baselines, so lines in different columns align across the page.
4. **A small, deliberate type scale.** A few sizes with big jumps between them make the hierarchy obvious.
5. **Flush left, ragged right.** No centred or justified text.
6. **Asymmetry and active space.** Empty fields are part of the composition, not leftovers.
7. **Paintings are painted on the page, not cropped by it.** A painting fills its fields and stops there with a knife edge (`paintOn` in `print/swiss.html`): the line wanders a few px either side of the field line, with an occasional short, dry knife smear past it and thin spots just inside. Nothing bleeds off the page. Keep the edge quiet; big overshoots read fake (user call, Nov 12, 2026). The mark-as-window stays crisp, because it's the logo.
8. **Objective, not decorative.** Every element carries information.

## Ferry's numbers

| | 4:5 social | 16:9 presentation |
|---|---|---|
| Page | 1080 × 1350 | 1920 × 1080 |
| Baseline | 10 px | 10 px |
| Module | 140 × 140 (square) | 140 × 140 (square) |
| Gutter | 20 (2 baselines) | 20 |
| Columns × rows | 6 × 7 | 11 × 6 |
| Margins | sides 70, top 110, bottom 140 | sides 90, top 60, bottom 80 |

All three page sizes divide by the 10 px baseline. The bottom margin is always the largest, as in classic Swiss pages. The 9:16 story format is dropped (user call, Nov 12, 2026).

## Type scale

Ferry Sans only. Display sizes (64 and up) are Bold at the wordmark's −5% tracking with the watercolour bleed; smaller sizes are clean.

| Step | Size / leading | Use |
|---|---|---|
| T1 | 260 / 240 | One number as the image (41s) |
| T2 | 150 / 140 | A typographic sequence |
| T3 | 96 / 90 | Headlines |
| T4 | 64 / 60 | Headlines in a field, column heads |
| T5 | 40 / 40 | Secondary heads |
| T6 | 24 / 30 | Body |
| T7 | 15 / 20 | Caps labels, tracked +18% |

The first line of a text block is placed so its cap height meets the top edge of its field, then snapped to the baseline grid.

## The six layouts

Each comes from a pattern on the board and is rebuilt on the grid. `?l=1..6`, `?f=4x5` or `16x9`, `?grid` to see the fields.

| `?l=` | Layout | Board source | Placement (4:5 / 16:9) |
|---|---|---|---|
| 1 | The mark as a window | Empee's letter | Whole mark flush right in the top four rows / columns 6 to 11. Headline in the bottom two rows on column 1, body below, FERRY label. |
| 2 | The big number | Kitsune's 46c, the stamp's value | "41s" at T1 top-left; crossing times as a small table top-right / below it. The arrival painting fills fields and bleeds off the page. "Arrived." anchors the empty fields. |
| 3 | Data columns | Morocco's footer, a timetable | The painting bleeds off three sides above; a rule, then Departs, Crosses, Arrives as three columns with their times. |
| 4 | A typographic sequence | The repeated "Virtual", the board's type-led posters | Departed, Crossing, Crossing, Arrived at T2, rising from pale to full ink. A small painting in the corner fields / a tall one on the right. |
| 5 | A painting with a type field | Flowwow, You-nique | The painting is the ground and its own empty sky is the field: the lighthouse fills the page top-aligned so the whole building stays in view, the headline sits in the sky on columns 1 to 3, the lockup top-right / the lighthouse bleeds from column 6, words on the left. Never lay a box over the subject. |
| 6 | The postmarked card | Fieldman, Lanzarote | Headline on column 1; the painting as a postcard filling the middle fields; an ARRIVED postmark crossing onto the page. |

## Rules

- Every element sits in fields; every baseline on the grid. Turn on `?grid` to check before showing anything.
- One display size per layout plus body and labels: at most three sizes.
- Every layout signs off with the lockup (mark + wordmark, `ferry-lockup-clean.svg`) at 40 px tall, bottom on the last field line, column 1. A caps "FERRY" label is not a sign-off.
- Details only when they tell the viewer something new: the lockup (who), times (the promise), a URL when the post asks for something.
- Paintings fill whole fields and end in the knife edge; never cropped at the page edge, never floating at an arbitrary size.
- The paintings used are studies of other people's work (`ferry/assets/refs/`, git-ignored), so these render locally only until Ferry has its own paintings.

## Superseded

`print/posters.html` (the first three templates, built without a real grid) is replaced by this system.

## Mockups

`print/mockups.html?m=1..6`, rendered at 2x. They read the poster renders from the ignored `ferry/assets/mock/posters/` (render them from `swiss.html` first).
- Screens: 1 is three posts in a feed. 2 is a feed post beside the profile grid. 3 is a slide on a laptop. The phone UI is generic, not a real app's.
- Prints: 4 is three posters taped to a wall, with the bottoms lifting off a little. 5 is loose prints on linen. 6 is one print up close at 4:5, to show the knife edge.
Shadows stay quiet, with the light from the top left.

# From print to UI

Postcard 01's back (`print/postcard-01.html?side=back`) is draft 0 of something bigger: the same anatomy can run the product. This note covers how it maps onto UI and other touchpoints, what a second Pinterest round says about better fronts, and the mark problem. Researched Nov 11, 2026: 22 postcard fronts, 12 ticket and boarding-pass UIs, 12 receipt designs.

## The back, taken apart into UI parts

Every element on the back already has a job in a transfer.

| On the postcard | In the product |
|---|---|
| The divide: human side left, official side right | The layout of every transfer screen: the person's words and the place on one side, the facts on the other |
| Address lines with a TO label | The recipient field: underlined lines, not boxes. The wallet address written on the line |
| Handwritten message | An optional note the sender adds, shown in the sender's own hand (drawn on a phone, or typed and kept plain) |
| The facts table (sent, arrived, from, to, departed, crossing, arrived, fee) | The transfer detail: hairline rows, spaced caps labels, plain values, right aligned |
| The stamp | The transfer's token: value = crossing time, image = the route's port. Fee and time in one object |
| The postmark | The status badge. It lands when the transfer arrives: ring text "FERRY POST · ARRIVED · PORT 02", the date and the exact second |
| Card number (FP-02) | The transfer ID |
| Place name in the script | The destination port's name, the one script moment on the screen |
| Caption paragraph | One plain sentence about where the money went |

## Touchpoints

1. **Send = writing a postcard.** Amount, TO lines, an optional message. The stamp shows the expected crossing time and fee before you send.
2. **In transit = the ticket.** A boarding-pass layout (the strongest UI pattern in the research): FROM and TO as big codes with a route line between, departure time, the crossing ticking, a perforated tear line. The stamp is on, not yet cancelled.
3. **Arrived = the postcard back.** The postmark lands with the arrival second, the table fills, and "Arrived. 41 seconds." sits at the top in the serif. This is the screen people screenshot.
4. **History = a collection.** Each transfer is a stamp in an album or a postcard in a stack; filters by port. Ports become collectable.
5. **Receipt email = the back as an email.** The same anatomy at 600 px wide, one ink.
6. **Share card (X, link preview) = front and back.** The painting of the destination port on the front, the cancelled back beside it.
7. **Notification = the postmark alone.** A small ring with "ARRIVED 12:04:41".
8. **Incident = holding at port.** The stamp uncancelled, a "HELD AT PORT" rubber stamp instead of the postmark, the table showing where the funds are.

## What the UI research shows

- **Boarding passes** (CDG to FLR, SUB to SIN, DXB to SFO): big three-letter codes, a line with a small icon between them, times under each, a dashed tear line with half-circle notches at its ends, a barcode. This is the in-transit screen almost exactly.
- **Stamps inside UI** (a cruise booking app, an Italy travel app): stamp-edged photo tiles and a postmark as a decorative seal, sitting inside a modern clean UI without fighting it. Proof that the print parts survive on screen.
- **Luggage tags** (FRA / FRANCE): huge type with handwriting over it, a strong pattern for the arrived moment.
- **Receipts as UI** (draw entry form, West Tenth, Pubbles): mono-spaced rows, dotted or hairline rules, a big total, and a signature or handwritten note at the end. One app closes its onboarding with a handwritten "Sam & Alec".
- **Folio with handwriting over print** (The Plaza): a pen note written across the printed form. Our message on the back is the same move.

## Why the first fronts don't land, and what works instead

The four fronts were the four textbook formulas with our painting dropped in. None had an idea of its own. The research shows what the strong ones do:

1. **The paint itself is the front.** Thick impasto close-ups where the brushwork fills the card and the subject barely matters. Paint's gouache can do exactly this; our rowboats were too small and too dark to show it.
2. **Type and image overlap.** A big script word written across a small photo (Paloma); a place name in huge condensed caps running along the card edge, cropped by it (the Arizona, Helsinki and Istanbul series); big letters breaking out over the top of an image (Puerto Rico).
3. **The card is an editorial page.** A smaller inset image with a block of text beside it (Casa de Pascal, Lancaster, the Saigon post office). Calm, grown up, closest to the Popcorn and Jupi feel from the first board.
4. **The front is shown over its own painting.** The card back laid over the painting it came from (the impasto series).
5. **One object, held.** A single subject (a tomato, "The Joy of Gathering") photographed in hands.

The best next round: an impasto-close front from a new gouache painting, an editorial front with an inset painting and text, and a type-led front with the place name cropped by the edge.

## The mark

The butterfly is a crisp, digital, pixel-stepped glyph. In print it sits next to gouache paint, a copperplate script, a Didone serif and inked postmarks, so it reads like a sticker from another brand. That's why it doesn't go with anything yet. Options:

1. **Make it physical in print.** Only ever show it the way a printed object carries a mark: blind-embossed into the card, a rubber stamp in one ink with uneven pressure, a wax seal, or engraved in lines like the stamp's one-ink version. Same shape, analog material.
2. **Keep it digital, keep it out of print.** The mark lives in the product, app icon and screens; print pieces carry only the wordmark or no mark at all.
3. **Redraw it.** Keep the two-halves idea but draw it with the same hand as everything else (brush, engraved line or softened steps), so it belongs to the print world.

## The mark in print: decision (Nov 11, 2026)

From the study in `print/mark-study.html`. Kept: the watercolour bleed, the blind emboss and the rubber stamp. Dropped: the wax seal (it looks fake), the engraved line, pen and hatching, softened steps, and keeping the mark out of print.

| Treatment | Job | Where |
|---|---|---|
| Watercolour bleed | The mark when it's printed in colour as a sign of the brand | Postcard fronts, posters, covers: anywhere the mark is seen, not stamped. The same locked bleed as the logo, ink on paper or paper on paint |
| Blind emboss | A quiet maker's mark, no ink | The foot of the postcard divide, envelope flaps, the corner of a card. Never the only place the brand appears on a piece |
| Rubber stamp | The mark as an act: something happened | With the postmark family: ARRIVED, HELD AT PORT, FIRST CROSSING. One ink, uneven pressure, at an angle, with ring text |

Rules:
1. One treatment per piece, at most two (an emboss plus a rubber stamp is fine; bleed plus emboss is not).
2. The crisp digital mark stays in the product and the app icon.
3. Never a wax seal.

## The blind emboss, done physically (Nov 12, 2026)

The first emboss (a pale shape with a pasted highlight and shadow) looked fake. Studying real blind emboss and deboss close-ups (Pinterest: letterpress cotton cards, embossed stationery, envelope flaps) showed what real pressed paper does:

- **Deboss** (pressed in, the common choice on cards): the inner wall facing the light falls into shade, the opposite wall catches a thin bright edge, the floor is smoother because the fibre is crushed, and the paper grain carries on unchanged around it.
- **Emboss** (raised): pillowy, rounded shoulders; the shoulder facing the light glows, the far one falls into soft shade with a faint cast shadow.
- Under soft light both nearly disappear; they read under raking light.
- In use: small (about 15 to 30 mm), on plain uncoated stock, in a corner, on an envelope flap, or alone in the middle of a blank card.

`tools/emboss.py` simulates it: paper fibre as a height map, the mark pressed in or out with shoulders from the signed distance to its edge, fibre crushed on a deboss floor, normals from the height gradient, Lambert shading under one directional light, and cast shadows marched toward the light. For compositing over a card that has its own grain, it writes the press lit on smooth paper as two layers (multiply for the shade, screen for the light), so the card's grain shows through unchanged.

Postcard 01's back renders the emboss live in the browser (`print/emboss.js`, the same model) and lays it in the empty lower corner of the address side. The settings were tuned by hand in `print/emboss-tuner.html` (Nov 12, 2026) after the first pass looked forced, with highlights too bright:

| Setting | Value | Why |
|---|---|---|
| Mode | Raised emboss | The pick over the deboss |
| Size | 9.5 mm | A maker's mark, smaller than the 15 to 30 mm usual on cards |
| Tilt | -0.4 degrees | Just off square, a hand-fed press |
| Light | From the top left (azimuth 135), 32 degrees high | Tuned at the upper right (50), then moved to match the stamp's top-left light so one card has one light |
| Depth / shoulder / pillow | 0.08 mm / 0.4 mm / 0.37 | Shallow and soft |
| Fill light | 0.36 | |
| Shade | 0.68 strength, 0.8 px soft | |
| Highlight | 0.32 strength, 6.4 px soft | The fix for the forced look: a faint, wide glow, not a white edge |

These are the built-in defaults in `emboss.js` and `tools/emboss.py`. The tuner saves overrides per machine (localStorage), and `?emb={...}` overrides per page. The tilt is applied to the mark before lighting, so the light stays where it is.

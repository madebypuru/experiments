# Ferry's three type voices

Each voice has one job, and no voice borrows another's. First set on stamp 01 (`ferry/print/stamp-01.html`): "41s" in the serif, "the Arrival Light" in the script, PORT OF CALL 01 in the sans.

All three are open-licence: Ferry Sans (GUST Font License, built in `type/`), Bodoni Moda and Monsieur La Doulaise (both SIL Open Font License, Google Fonts).

## 1. Bodoni Moda: the stamp's value (stamps only)

**Job:** the big number on a stamp. Nowhere else: on posters, social and the site it doesn't work (user call, Nov 11, 2026). Headlines everywhere are Ferry Sans with the bleed (see 3).

- Numbers: the stamp value (41s). Bold, optical size 96.
- Units (s, %, the currency) follow the number, smaller, in true Bodoni Moda Italic.
- Emphasis inside a headline is Bodoni Moda Italic on the one word, never bold.
- Size: 32 px and up on screen, 14 pt and up in print. Its hairlines disappear smaller.
- Tracking: about −2 percent at large sizes.
- Never: body text, labels, UI, captions, all caps.

## 2. Monsieur La Doulaise: the captain's hand (very limited use)

**Job:** the one place name on a printed object. Nothing else.

- **Where:** only on print pieces: a stamp's port name, a postcard's "from" place, a ticket's destination. Not on the website, in the product, in social headlines or in decks.
- **How often:** one script element per piece, and not on every piece. A set of stamps or postcards can carry it; a set of social posts can't.
- **What:** a place or port name, two to four words, written as a name ("the Arrival Light", "Port of Solana"). Never a sentence, a word of emphasis, a number or a date.
- **Size:** 40 px and up on screen, 18 pt and up in print. The flourished capitals fall apart smaller; at 28 px "Port of Solana" is already hard to read.
- **Space:** leave room above for the swash capitals (about half the font size). Nothing sits in that space.
- **Ground:** ink on plain paper only. Never over a painting, a photo or a colour field.
- **Never** all caps, never letter-spaced, never with a bold or outline.

## 3. Ferry Sans: headlines and the facts

**Job:** everything else, including every headline outside the stamp.

- Headlines: Bold, sentence case, six words or fewer, at the wordmark's setting (−5 percent tracking), laid down with the watercolour bleed from `src/bleed.html` (ink mode, sized from the ascender) so they match the wordmark. Emphasis is Bold Italic on one word ("Safe *passage* between chains."). Used in `print/posters.html`.

- Ticket print: Bold caps, tracked +20 to 25 percent, 10 to 22 px. For FROM, TO, DEPARTS, issuers, imprints, postmark text.
- Body and UI: Regular, sentence case, 14 to 18 px. Emphasis is italic.
- Large numbers in the product UI: Bold at −5 percent tracking (the wordmark's setting). The serif is for print and display moments, not interface.

## 4. A real pen hand: postcards only

**Job:** the personal message on a postcard's back. Nowhere else.

- Real handwriting (written, scanned or drawn), never a handwriting font.
- Short and specific, signed with a first name, like a real card.
- Only on the message side of a postcard back.

## Pairing rules

1. On a stamp, the serif carries the number, the script carries the place, the sans carries the facts. Everywhere else, Ferry Sans carries everything: bleed for headlines, clean for the rest.
2. Three levels at most per piece, one per voice. Fewer is fine; the script is usually absent.
3. Script and serif never sit side by side at similar sizes. One is clearly bigger, or they live in different parts of the piece.
4. No added text around a print piece when it's presented. The piece carries its own words.
5. Colour: ink on paper, paper on paintings. The script only ever in ink, on paper.

# Ferry site: story, base, goal

Step one, for you to accept, change or reject. No layouts.

## 1. Goal

For protocol teams and Web3 founders moving their users' value between chains; secondly, people a bridge has burned. They arrive believing bridges are where money goes missing, expecting another page about speed. The page should make a protocol team request access. It worked if named teams request access and most visitors scroll through the whole crossing.

## 2. The one-sentence story

You hand Ferry a ticket on one shore, watch every second of the crossing, and it is postmarked on the other side with nothing missing.

## 3. Base

**World:** one painted harbour. The top is the departure dock (rowboats), the middle open water under the lighthouse, the foot the far dock where the footer sits. Scrolling down is crossing.

**Object:** the transfer ticket (`system/chip.html`). It already has states (at the pier, departed, crossing, arrived, held at port), it is paper, and it shows live facts to the second. The stamp is the reward at the end, not a traveller; the postcard is too big to carry; the boat and lighthouse are places, and Paint has no hero ferry that can turn and dock yet.

**First met** on the quay in the hero, "At the pier". **Last seen** in the footer, cancelled by the FERRY POST postmark.

## 4. The beats

1. **At the pier.** Learns what Ferry is ("what is this?"). Sees the rowboat dock, "Safe passage between chains.", the ticket on the quay. Water and pointer ripples say the place is alive. Hands over: the stub tears, the dock slides away.
2. **The fare is printed.** Cost and time are fixed before departure ("what will it cost?"). The stamp settles on the ticket carrying fee and expected seconds (placeholders). Hands over: "Departs" is stamped.
3. **The crossing. THE EVENT, pinned.** You can see every step ("where is my money now?"). The lighthouse painting full bleed, the ticket over the water. Scroll drives dusk to night, a pier lamp per confirmation, the dot along the route, the beam finding the ferry, the postmark landing at the exact second. Labelled "sample" unless real. Hands over: night lifts to morning.
4. **Nothing lost.** What went in came out ("did all of it arrive?"). The postcard's facts table: 1,000.00 USDC sent, 1,000.00 arrived (sample); the figures fill and match. Hands over: cloud gathers.
5. **When the weather turns.** Failure is safe ("what if it goes wrong?"). The same ticket "Held at port", this view's one Signal dot, rain over moored boats that stay put. Hands over: rain clears.
6. **The harbour board.** People use it ("is this real?"). Recent crossings as ticket rows, one new row at a time from live data, or labelled sample.
7. **The ask.** "Request access", one field, the only button. The existing footer (`web/footer-v2.html`) closes it: far dock, "All crossings running", the stamp and postmark, your ticket filed.

## 5. What moves

| Piece | Driven by | State |
|---|---|---|
| Dock water, pointer wave | time, pointer | Exists, `ferry/assets/rowboats/`; needs a painted edge, no rectangle |
| Ticket states | scroll, live data | Exists, `chip.html`, `product/transit.html`; needs a scroll controller |
| Stamp settling | scroll | Stamp exists (`print/stamp-web.html`); move to make |
| Dusk to night, lamps, beam | scroll | Exists on a 24 s timer, `ferry/assets/lighthouse/`; rebuild for scroll, the biggest job |
| Postmark landing | scroll | Postmark exists (`print/elements.html`); press to make |
| Matching figures | scroll | To make, small |
| Rain, held state | scroll | To make; Paint has a rain preset, no Ferry rain scene |
| Board rows | live data | To make; needs an indexer or a sample label |
| Footer stamp | none | Exists |

The event is most of the work. Every painting is a placeholder from Pinterest photos.

## 6. Left out, on purpose

From the category: speed headlines, glowing 3D, neon on black, logo walls, volume counters, two buttons. From the earlier outline: the four-number proof strip (no numbers exist), a separate how-it-works panel (the crossing is it), the code block, the routes list, the customer quote (no customer yet). Each can return on its own page once real.

## 7. Open questions

1. Primary visitor: protocol team or burned everyday user? The ask changes with it.
2. Real crossings, or must every figure say "sample" at launch?
3. Day to night as the page's clock, dusk at the dock to morning at the far shore?
4. Paint our own scenes before launch?
5. Is there a testnet, so the ask can be "Send a test crossing"?

## 8. Alternative base

The lighthouse stays fixed and its beam is the recurring object, sweeping each beat to light one fact: the fare, the route, the held boat, the board. The page is watched over rather than travelled, so safety leads harder and the ticket appears only inside the event. Less scroll machinery, but no crossing you take yourself.

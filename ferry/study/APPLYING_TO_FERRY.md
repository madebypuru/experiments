# Applying the board to Ferry

How the patterns in `BOARD_STUDY.md` become Ferry's visual system, using what the Paint engine can actually do. Decisions so far: tech shown through ephemera inside calm bento layouts; real photos only to stage things; a small script voice; Ferry owns tickets and boarding passes, postcards and stamps, and route maps.

## The idea in one line

**Every transfer is a crossing you can see.** A transfer departs one shore, crosses, and arrives at the other. Paint draws the crossing; the ephemera (ticket, route map, postcard) carries the facts.

## What Paint gives us

Each item below is a real feature of the engine or the paint skill, not a plan to build one.

| Paint feature | What it means for Ferry |
|---|---|
| Scene files (SVG with labelled parts) written by any model from `paint-skill/PROMPT.txt` | Any crossing we can describe becomes a painting: a harbour, a river ferry, a pier at dawn, a footbridge over a canal |
| A sprite named `ferry` rocks on the swell and leaves a wake; a moored boat is a path that starts and ends on the same point | Ferries under way and ferries waiting at the pier, with real motion, not slid pictures |
| `water` ripples, gulls that flap and glide, drifting clouds, chimney smoke, all automatic | Calm life in every loop at no extra cost |
| Figures (walkers, cyclists) with solved legs, umbrellas in rain | People crossing bridges and walking piers: the "everyday user" side of the brief |
| Timeline presets: `night`, `rain`, `seasons`; custom `glaze`, `lift`, `lights` in sequence | A state language (see below) and short story loops |
| `lights: sequence` lights windows and lamps in a numbered order | Confirmations arriving one by one: a crossing whose pier lamps light up stop by stop |
| Photo to painting (k-means regions, subject focus, washes) | Real harbours photographed, then painted: the before and after pair (the Lanzarote pattern) |
| Three mediums: watercolour, ink and wash, gouache | Watercolour for scenes; ink and wash for route maps and diagrams; gouache for stamps and tickets that need opaque, flat colour |
| Video export of the timeline as a seamless loop | Hero loops for the site and X |
| Plain shapes are allowed in scenes | The mark itself can be painted by the engine, as a real wash instead of a filter |

## A state language from weather

Paint's weather and light presets can carry meaning, as the brief suggests. Each one keeps the brand calm, even when something is wrong.

| State | Painted as | Line |
|---|---|---|
| Normal, in transit | Clear sky, light wind, a ferry under way | Your transfer has departed. |
| Each step confirmed | Pier lamps lighting in sequence | Crossing. 2 of 3 confirmations. |
| Arrived | Ferry moored, gulls settle, a postmark lands | Arrived. 41 seconds. |
| Delayed | Low cloud gathers, the ferry waits at the pier | Holding at the pier. Next departure 12:10. |
| Incident | Rain preset, lamps on, ferry stays moored | Crossing paused. Your funds are safe in port. |
| After hours, maintenance | Night preset, harbour lit | Harbour closed until 06:00 UTC. |

## Board patterns, Ferry versions

| Board pattern | Board example | Ferry version |
|---|---|---|
| Flat lay of objects | Preserved matchbooks | **The crossing kit:** ticket, route map, postcard, stamp, luggage tag, transfer receipt and a harbour token, laid out on a ground sampled from the water in our paintings. Each object carries one message. |
| Bento, one feature per card | Popcorn, Jupi | Product features as cards, each holding one painted scene or one kit object, with a short serif line on top or bottom. |
| Object in a real scene | Billboard, hands holding stamps | Real photos for staging only: a ticket held on a real ferry deck, a Ferry poster on a terminal noticeboard, a postcard on a desk. |
| Front and back stacked | Lanzarote, Fieldman | Postcard front (painting) over its back ("Arrived. 41 seconds."); ticket over its counterfoil. |
| One object in vast space | Mailbox, You-nique | One small ferry crossing wide painted water, two thirds of the frame sky, the headline set in the sky. |
| Logo as window | Empee | The mark cropped huge. Its two halves are two shores, and the gap between them is the channel: show the painted water and a ferry through that gap. |
| Series on a template | Ancient-capitals stamps, ivivu | **Ports of call:** a stamp per chain, each a painted harbour, one fixed template: port name in script top left, seal top right, block time bottom left, a line bottom right. A ticket per route, same template, only the route changes. |
| UI over heritage material | Chronicle, Calendly chip | Real status UI on paintings: a "Departed 12:04" chip on a ferry under way, a three-step progress strip along a route map. |
| Before and after | Lanzarote, Patternly | A photo of a real harbour beside its Paint version; a transfer shown as "photo of the problem" (a stalled bridge) next to the calm painted crossing. |

## Features as objects

One object, one feature, as on the board. These come from the brief's promise and reasons to believe.

| Feature | Object | Line |
|---|---|---|
| Arrives on time | Timetable board or ticket with departure and arrival times | Arrives in 40 seconds. |
| Visible at every step | Route map with pins: Departed, Crossing, Arrived | You can see every step. |
| Fees up front | Ticket with the fare printed | The fare is on the ticket. |
| Nothing lost on the way | Luggage tag and manifest, amounts matching both ends | 1,000 USDC sent. 1,000 USDC arrived. |
| Any chain to any chain | Stamp sheet of ports of call | Many ports. One ferry. |
| Plain confirmations | Postcard from the other shore | Arrived. Every time. |
| Funds safe during incidents | A ferry moored in the rain, lamps lit | Paused in port. Nothing at sea. |

## Typography, applied

- **Serif, display only:** short headlines of six words or fewer, sentence case, set in the sky or on paper, never in a box. "Safe passage between chains."
- **Sans, to explain:** small, muted, centred under the headline in cards, two to four lines.
- **Script, the captain's hand, in small doses:** port names on stamps and tickets, route stop names on maps, a signature on postcards. Never a sentence longer than four words.
- **Wide-tracked caps, the ticket print:** FROM, TO, DEPARTS, ARRIVES, SEAT, FARE, block numbers and URLs. This is Ferry's functional layer, the way the board uses caps for URLs and labels.
- **Numbers as design:** times, seconds, amounts, block heights set large where they carry the message ("41s", "12:04").
- **Emphasis by switching voice, never bold:** a serif headline turns italic on the one word that matters: "Safe *passage* between chains."
- **Three levels, never more:** headline, explanation, ticket print.
- All copy follows the brief's voice rules: no em dashes, no exclamation marks, no emoji, numbers over adjectives.

## How the brand pattern forms outside the logo

1. **The channel.** The mark is two stepped shores with water between them. Extend that: stepped coastlines and piers in the paintings, stepped crops on images, and a stepped notch as Ferry's version of the stamp perforation, cut into ticket and card edges.
2. **The route line.** A soft painted line from a departure pin to an arrival pin, with stops in between. It appears on maps, in UI progress, in social posts and as a divider.
3. **Ports of call.** The stamp series, one painted harbour per chain. Collectable, endless, and a natural social format.
4. **The ticket print layer.** Wide caps, perforation lines, hole punches, serial numbers, times. Recognisable even with no logo in sight.
5. **Postmarks and seals.** A circular "ARRIVED" postmark with the time and the mark inside; a "DEPARTED" stamp. They sit on postcards, receipts and confirmation screens.
6. **Wake and ripple texture.** The engine's ripple dashes and the ferry's V-shaped wake, lifted out as a line pattern. Like Patternly, a pattern generated from the brand's own imagery: paintings sliced into stepped bands that echo the mark.
7. **Weather as status.** The state language above, so even an error screen looks like Ferry.
8. **The timetable grid.** Departures and arrivals in columns: a layout device for pricing, changelogs and status pages.

## Real-life elements to bring in

Painted inside scenes, or photographed for presentation only.

- **On the water and pier:** ferries, moored boats, bollards and cleats, mooring ropes, life rings, pier lamps, gangways, ticket booths, harbour noticeboards, departure boards, buoys, lighthouses, gulls.
- **Things you carry:** paper tickets and boarding passes, luggage tags, postcards, stamps and postmarks, envelopes, a captain's logbook, tide tables, a compass, binoculars, a folded route map.
- **Presentation staging (real photos):** a hand holding a ticket on deck, a poster on a terminal wall, a postcard on a café table by the water, a stamp sheet on a desk, a phone showing the status screen on a ferry bench.

## Medium roles

| Medium | Used for |
|---|---|
| Watercolour (main) | Scenes, heroes, loops, the wash behind the mark |
| Ink and wash | Route maps, diagrams, how-it-works drawings: line plus one flat wash, as in the Morocco poster |
| Gouache (accent, to test) | Stamps, tickets, the kit objects: opaque flat colour that reads at small sizes |

## First touchpoint: X header and launch post

How the patterns land on the touchpoint already chosen, pending your references:

- **Header (1500 × 500):** one small ferry crossing a wide painted channel between two stepped shores (the mark's geometry as coastline), lots of sky, "Safe passage between chains." in the serif set in the sky. A loopable version for later from the same scene.
- **Launch post (1600 × 900):** the crossing kit as a flat lay (ticket, route map, postcard with "Arrived.", a stamp), or the photo and painting pair. One serif line, the ticket print as the caption layer.

# Motion bases

Everything that moves in Paint is built on a **base**: one solved, tested system per kind of thing (a person walking, a bird flying, water, rain, a cloud). A scene or a photo never animates anything by hand. It only says *which* bases appear, *where* and *with what settings*, and the base does the rest. Every new scene therefore costs almost nothing, and every improvement to a base improves every scene at once.

## Files

Each base is its own file in `motion/`, loaded before the main script: `world.js` (clock, wind, light), `style.js` (the medium's marks), `figures.js`, `birds.js`, `water.js`, `clouds.js`, `smoke.js`, `boats.js`, `weather.js`, plus `understand.js` (reading a photo) and `director.js` (placing bases on a photo). A new base is a new file plus one line where it's drawn.

## 1. The shared world

All bases read the same inputs, so things agree with each other. When the wind blows, clouds drift, smoke leans, rain slants, washing flutters and trees sway the same way, by the same amount.

| Input | What it is | Who sets it |
|---|---|---|
| `clock`, `dt` | Seconds since the animation started; one frame's step. With `?debug`, exact 1/60 s steps. | Paint |
| `wind` | One value, about −2.4 to 2.4: a slow breeze with occasional gusts. | Paint, or a timeline step |
| `light` | The ambient colour: how much the painting has darkened or cooled since it was finished (night, rain). Opaque things are multiplied by it. | Measured from the painting |
| `time`, `season`, `weather` | Time of day, season, rain or snow, from the timeline. | Timeline |
| `scale` | Units per metre, so sizes and speeds are real. | Scene plan, or estimated from a photo |
| `masks` | Where things can live: sky, ground, path, road, water, roof, foliage, window… | Scene roles, or photo segmentation |
| `painted` | The painted area; nothing is drawn outside it. | Paint |
| `depth` (later) | How far away each point is, so things can pass behind other things. | Photo depth model |

## 2. The contract every base keeps

1. **Real numbers.** Defaults come from the real thing (a walk is about 2 steps a second; a gull beats about 2.6 times a second), written next to the code.
2. **Motion from mechanics, never decoration.** Locomotion is tied to the distance travelled (feet can't slide); flapping, rocking and swaying come from a solver, spring or pendulum with a real frequency. A free-running sine wave is never the motion itself.
3. **Reads the world.** Wind, light and scale come from the world, never from constants inside the base.
4. **Knows where it lives.** It declares the masks it needs (a walker needs ground or a path; ripples need water) and how many fit in a given area, so the director can place it.
5. **Made of the painting's medium.** A moving thing must look made of the same stuff as the painting it moves in. Every base draws its marks through `motion/style.js` for the current medium:
   - **Watercolour:** soft, transparent, wet edges.
   - **Ink & wash:** a pen line over a flat pale wash.
   - **Gouache:** short opaque dabs with bristle streaks and paint grain, the same mark the gouache painter uses.
   
   Marks are made once per element, seeded, so they never flicker from frame to frame. Opaque things (people, cyclists) are drawn on their own small canvas and then finished in the medium (`inMedium`):
   - **Watercolour:** a soft bleed, pigment pooled at the edges, a blotchy translucent body and paper granulation.
   - **Gouache:** bristle streaks and grain.
   - **Ink:** left crisp.
6. **The right layer.** Opaque things (people, boats, cyclists) are drawn normally and tinted by `light`. Washes and marks (ripples, shadows) are multiplied into the paint. Weather goes over everything.
7. **Inside the painting.** Fades out with the painted area; never floats on bare paper.
8. **Deterministic.** Seeded randomness; with `?debug` it steps exactly, so frames can be compared.
9. **Tested before it ships:** a frame strip at three times normal size (each pose checked), in a scene at real size, at night, and in all three mediums.

## 3. The bases

| Base | Lives on | Driven by | Settings | Status |
|---|---|---|---|---|
| **Walker** (walk, stroll, run) | ground, path, road | gait solver, distance travelled | height, gait, outfit, colours, carry, hat | Built (`motion/figures.js`) |
| **Cyclist** | road, path | wheel turns with distance; legs reach the pedals | height, colours, bike | Built (`motion/figures.js`) |
| **Hiker** | paths on slopes | walker plus slope lean, backpack, walking pole, shorter steps uphill | as walker | To build (walker variant) |
| **Bird** (small, mid, big) | sky | wingbeat clock: quick down, slow up, bursts and glides | kind, wingspan, colour | Built (`motion/birds.js`) |
| **Water** | water | ripples drift with the wind, swell and fade; smaller further away | — | Built (`motion/water.js`) |
| **Reflections** | water | mirror of figures, boats and lights above the water, broken by ripples | — | To build |
| **Rain** | falls past in front, or lands on the real tops of things | streaks slant with the wind and stop where they land: a small crown on hard tops, a spray on leaves, a ring on water; drips gather on eaves; drops that land on the subject run down it as wet trickles following its shape (darker on pale surfaces, a glint on dark ones); people put up umbrellas | intensity | Built (`motion/weather.js`) |
| **Snow** | lands on the real tops of things | flakes drift and sway with the wind, land, and build a white layer on roofs, ground, trees and the subject's shoulders; it melts slowly when the snow stops; it settles on people's heads, shoulders and umbrellas | intensity | Built (`motion/weather.js`) |
| **Clouds** | sky | drift with the wind, slowly change shape; masked to open sky | count, size | Built (`motion/clouds.js`) |
| **Smoke** | a chimney or fire point | rises, slows, spreads and fades; leans downwind | colour, height | Built (`motion/smoke.js`) |
| **Floating things** (boats, ducks, swans), moored or under way | water | roll on a damped pendulum pushed by the swell, heave, a V wake when moving | kind | Built (`motion/boats.js`) |
| **Foliage** | foliage | sways with the wind, more at the tips | stiffness | To build |
| **Cloth** (flags, washing, awnings) | prop | flutters with the wind | — | To build |
| **Falling things** (leaves, petals) | from foliage to ground | drift and tumble with the wind; season | — | To build |
| **Lights** (windows, lamps) | window, lamp | time of day; in sequence | order, colour | Built (timeline) |
| **Animals walking** (dog, cat) | ground, path | four-legged gait solver | kind, size, colour | To build |
| **Mist** | low sky, water | drifts slowly with the wind | density | To build |

## 4. How a new base is made

1. **Study the real thing.** Find its numbers (speed, frequency, size) and the two or three traits that make it read as itself (planted feet; a fast downstroke; ripples smaller further away).
2. **Write the solver** in its own space (a figure is 95 units tall; a bird's wingspan is 1), with those numbers as defaults.
3. **Draw a frame strip** at three times normal size and check every pose. Fix anything stiff, floating, sliding or mechanical.
4. **Put it in a scene** at real size, with the wind, then at night and in the rain.
5. **Write down its placement rules**: which masks, how many per area, what spacing.
6. **Add it to the scene format, the skill, the checker and the prompt**, with its settings.
7. **Add its failure modes** to the list below.

## 5. What we never do

- Slide a picture along a path and call it walking, flying or sailing.
- Use a timed sine bob for anything that moves itself: steps follow distance, wingbeats follow a real wingbeat.
- Give a moving person or animal a duration: speed comes from size and gait.
- Animate everything at once. Two to four things moving in view, with stillness around them.
- Move things in lockstep (same timing, same phase) or in neat rows.
- Use a constant where the world has a value: wind, light, scale and time come from the world.
- Multiply-blend something opaque (it vanishes in front of dark doors), or draw something opaque without the scene's light (it glows at night).
- Draw anything outside the painted area.
- Let something loop by popping in or out on the canvas.
- Ship a base without its frame strip, real-size, night and three-medium checks.
- Splash where nothing is: rain and snow touch only real tops (open sky above, something solid below); a speck or a cloud in the sky is not a surface.
- Draw a moving thing in a different medium from its painting (a soft airbrushed cloud in a gouache sky, an outlined figure in a watercolour).
- Hand-animate one scene. If a scene needs a motion no base has, build the base.
- Copy a reference's characters, scenes or look. New means new.

## 6. Reading a photo (`motion/understand.js`)

A photo has no labels, so it's read for the same roles a scene file uses, plus a horizon and a scale:

- **Colour reading** (always on, no download): open sky, foliage and calm water from colour, calm and position. Enough for clouds, birds and ripples; it can't find paths, roads or people.
- **Model reading** (on by default; `?nomodels` turns it off): a labelling model (SegFormer on ADE20K, about 150 kinds of thing) and a depth model (Depth Anything v2 small), run in the browser with transformers.js. The photo stays on the device; the models (about 115 MB at full precision, mostly the depth model) download once, the first time a photo is opened, and are then cached. Labels map onto roles (sky, road, path, ground, grass, water, foliage, building, window, door, figure, vehicle, lamp, prop…).
- **Horizon and scale**: with the camera at eye height, a standing person whose feet are k rows below the horizon is about 1.06·k rows tall, and every standing adult's head is on the horizon. So the horizon comes, in order, from the middle of people's head heights (feet are often hidden or cropped in crowds); a sea line (water meeting sky); the ground's depth gradient, if it lands between 15% and 80% down; the bottom of the open sky.
- **Test set**: eight free photos (streets, a canal, harbours, parks; licences in `~/experiments/.photos/free/CREDITS.txt`). Horizons now land at eye level on all four with people (0.43–0.51 of the height) and on the sea and path photos.
- **Cleaning**: roles that spread (sky, water, road, path, ground, grass, building) must form a region of real size (about 1% of the picture) or they're dropped, so a stray "water" guess never gets ripples. Small things (people, windows, lamps) only need to be more than a speck.
- **What the tests showed** (first run, 13 s including the download; then cached):
  - Photos read well. The Potala photo: sky, building, mountain, the monk, the stairway as a path, railings. The café front: wall, door, pavement, road, chairs, plants, and no sky or water, so nothing is added there.
  - Paintings and illustrations read badly: the model learned from photos and called a painted sky "wall" and a meadow a "bed". For those, open sky found by colour from the top edge overrides the model unless it saw a ceiling, and colour-found water and foliage fill in when the model found none outdoors.
  - The eye-height horizon is wrong when people stand above or below the viewer (on a wall, down a slope); a horizon outside the picture is discarded.
- `?see` paints each role in its own colour over the painting, with the horizon as a red dashed line, to check what was read.

Every base asks `masksOf(IM)`, which gives a scene file's roles or the photo's, so the same bases work on both.

## 7. The director (`motion/director.js`)

For a photo it places bases from what was read; it never animates anything by hand.

- **People** walk on roads, pavements, paths, quays and bridges, sideways along one row each. Their height comes from the horizon (1.06 × rows below it), kept to 6–40% of the picture.
- **Ground carries on behind** anything standing on it, so a crowded street still has somewhere to walk.
- **Hiding:** each walker is masked by whatever in the photo stands nearer, meaning anything whose feet are lower in the frame.
- **Staggered:** walkers set off one after another; one cyclist goes on a long road.
- **Gulls** fly over water and other birds elsewhere, crossing the sky in 7–14 s. Clouds and ripples come from their own bases.
- **During playback** it all runs while a transition plays, if Life is on, and in the painting's medium and light.

## 8. The look and export (`motion/export.js`)

- **The look** is the painting's state: season (spring, summer, autumn, winter), time of day (day, golden, dusk, night), weather (clear, rain, snow) and life (on, off). Changing one restores the finished painting and runs only the transition stages that lead to it (picked by their labels), fast-forwarded. Play runs them at their own pace and records them.
- **Download for a website**: one self-contained HTML file with the painting in its look (WebP) and falling rain or snow if the weather has it; reduced motion is respected. Moving life (people, birds, boats) is not in the export yet.
- Depth layers with parallax were tried and removed: cutting a painting into layers broke objects apart and the motion felt mechanical.

## 9. Ideas for the director

Once the bases exist, animating any picture is a placing job, not an animating job. The director reads the masks (from scene roles, or later from photo segmentation) and the scale, then picks bases and counts from their placement rules: birds and clouds in open sky, people on paths and pavements, ripples, reflections and a moored boat on water, sway in trees, lights in windows at night. It also chooses which story fits: day to night for buildings, seasons for trees, rain for streets.

# Paint scene format, version 1

A scene is one SVG file. The Paint tool reads it, paints it with a watercolour simulation, and can then animate it: transitions (day to night, seasons, rain, custom steps) and small moving things (birds, people, boats) that travel along paths.

The SVG is never shown as-is. Paint reads its colours, shapes and **labels** (`data-role`), so labelled parts get the right treatment: windows glow at night, leaves turn in autumn, snow settles on roofs.

## 1. The root element

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"
     data-paint="1"
     data-title="Evening on the harbour"
     data-focus="640 520"
     data-style="ink-wash">
  ...
</svg>
```

| Attribute | Required | Meaning |
|---|---|---|
| `viewBox` | yes | The canvas. Use `0 0 900 1200` (upright) or `0 0 1200 900` (wide). |
| `data-paint="1"` | yes | Marks the file as a Paint scene, format version 1. |
| `data-focus="x y"` | yes | Where the painting centres, in viewBox units. Usually the subject. |
| `data-title` | no | Shown in Paint, and used as the video file name. |
| `data-style` | no | `ink-wash` (pen lines, flat bright washes) or `watercolour` (loose, wet, no pen). Default: the viewer's choice. |

## 2. What you may use

Elements: `g`, `path`, `polygon`, `polyline`, `rect`, `circle`, `ellipse`, `line`, `defs`, `linearGradient`, `radialGradient`, `stop`, `metadata`.

Attributes: geometry (`d`, `points`, `x`, `y`, `width`, `height`, `cx`, `cy`, `r`, `rx`, `ry`, `x1`…`y2`), `fill`, `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin`, `opacity`, `fill-opacity`, `transform`, `id`, gradient attributes, and the `data-*` attributes below.

Not allowed (removed before painting): text, images, filters, masks, clip paths, CSS, `style` attributes, scripts, links to anything outside the file.

## 3. Roles: label the parts

Put `data-role` on a `g` (it applies to everything inside) or on a single shape.

| Role | Use for | What Paint does with it |
|---|---|---|
| `sky` | The sky behind everything | Night: deep blue, moon and stars lifted out of it. Rain: darkened. |
| `cloud` | Clouds | Kept light; drift is not animated (use a sprite for that). |
| `sun`, `moon` | A visible sun or moon | Left as bright paper. |
| `mountain`, `hill` | Distant land | Cooler, paler glazes with distance. |
| `ground`, `grass` | The ground plane | Fallen leaves in autumn; snow in winter; rain darkens it. |
| `path`, `road` | Walkable surfaces | Puddle shine in rain. Sprites with `walk` usually follow these. |
| `water` | Lakes, sea, rivers | Sky colour glazed in at dusk; lights reflect. |
| `building`, `wall` | Building bodies | Warm at golden hour. |
| `roof` | Roofs, awnings, ledges | Snow settles on their top edges. |
| `window` | Window panes (the glass) | Lit at night, warm glow bleeding outward. |
| `lamp` | Street lamps, lanterns (the light part) | Lit at night, with a soft halo. |
| `door` | Doors | Painted as normal; can be lit with `data-light`. |
| `trunk`, `branch` | Tree trunks and branches | Drawn in ink as bare branches in winter. Use strokes or paths. |
| `foliage` | Leaf masses of trees and hedges | Turns ochre, orange and red in autumn, bare in winter, green again in spring. |
| `flower` | Flowers, blossom | Kept bright; blossom in spring. |
| `figure`, `animal`, `vehicle` | People, animals, vehicles that stay still (moored boats too) | Painted with extra detail. |
| `prop` | Lamp posts, benches, tables and chairs, bollards, jetties, fences, signs | Painted as normal; tells Paint it's a solid object, not sky or ground. |
| `shadow` | Cast shadows | Painted as a cool, transparent glaze. |

Unlabelled shapes are still painted; they just don't take part in role effects. Label at least the parts the effects need (sky, ground, roof, window, lamp, trunk, branch, foliage, water); label everything else when a role fits.

**Lights in a sequence.** Give windows and lamps `data-light="1"`, `data-light="2"`… to set the order they light up. Shapes with the same number light together. Windows and lamps without a number light first, all together. Optional `data-light-color="#ffd27a"` changes the glow colour.

## 4. Moving things: sprites

A sprite is a small group drawn **around its own origin (0, 0)**, facing right, that moves along a path: birds, boats, smoke, animals, clouds. (People and cyclists are figures; see 4b.) A sprite with `data-repeat="once"` disappears at the end of its path. Sprites are not part of the still painting: Paint paints each one separately, then moves it over the painting, frame by frame, in the animation and the video.

```xml
<g data-sprite="gull" data-path="M -60 220 C 300 160, 700 260, 1260 200"
   data-duration="12" data-delay="0" data-repeat="loop" data-bob="6">
  <path d="M -14 0 Q -7 -6 0 0 Q 7 -6 14 0" fill="none" stroke="#3b3a3f" stroke-width="2.5"/>
</g>
```

A dog trotting along a lane, 22 units tall, with its feet on y 0 so the path is the ground (one bob per step, a step about half its height):

```xml
<g data-sprite="dog" data-path="M -60 820 L 1260 820"
   data-duration="30" data-delay="3" data-bob="0.8" data-step="11">
  ...drawn from y -22 (ears) to y 0 (paws), x around 0...
</g>
```

| Attribute | Meaning |
|---|---|
| `data-sprite` | A name (bird, person, boat, smoke…). Required. |
| `data-path` | SVG path data in viewBox units: where it travels. Required. Start and end off-canvas for things that cross the scene. |
| `data-duration` | Seconds to travel the whole path. Default 10. |
| `data-delay` | Seconds before it starts. Default 0. Stagger sprites so they don't move in lockstep. |
| `data-repeat` | `loop` (start again at the beginning), `pingpong` (go back and forth) or `once`. Default `loop`. |
| `data-bob` | Up-and-down bob in viewBox units (walking, flapping, bobbing on water). Default 0. Keep it small: about 3% of a walker's height. |
| `data-step` | For sprites that walk (an animal, say; people should be figures): the length of one step in viewBox units (about 0.45 × the animal's height). The bob then rises once per step, tied to the distance travelled, so the walker never bobs faster or slower than it moves. Without it, the bob is a gentle timed sway (right for boats and birds). |
| `data-flip` | `auto` (face the direction of travel, the default) or `none`. |
| `data-scale-end` | Size at the end of the path, relative to the start (default 1). Use it for depth: a person walking away up a street might go from 1 to 0.5; a smoke puff rising from 0.6 to 1.8. |
| `data-fade-end` | Opacity at the end of the path (default 1). Smoke fades to 0 as it rises; a boat sailing into haze might fade to 0.5. |

Size sprites from the scene's scale (a gull about 1 m across, a dog about 0.5 m tall), keep them simple (1 to 15 shapes) and few (no more than 12 sprites and figures in a scene). Draw a sprite at the size it should be at the start of its path, and use `data-scale-end` for depth.

**Birds fly themselves.** A sprite whose name is a bird (`bird`, `gull`, `swallow`, `swift`, `crow`, `heron`…; not ducks or swans, which swim) isn't slid along as a picture: Paint flaps it every frame, with a quick downstroke and slower upstroke, bursts of beats between glides, and a slight rise and dip. The name sets the style: swallows, swifts and sparrows beat fast with short dips; gulls, herons and terns beat slowly and soar in long glides with their wings in an M; anything else flies like a crow. Draw it as a simple V or M at its real wingspan (the drawing's width) in its colour; `data-bob` is ignored.

**Smoke rises on its own.** A sprite named `smoke` or `steam` becomes a chimney: its path starts at the chimney top and points the way the smoke rises (its length is how high it goes, its duration how long a puff takes), its drawing's width sets the puff size and its fill the colour. Paint sends up soft puffs that slow, spread, fade and lean downwind. One smoke sprite per chimney is enough.

**Boats and ducks float.** A sprite named for a boat (`boat`, `ship`, `yacht`, `dinghy`, `ferry`, `canoe`…) or a swimming bird (`duck`, `swan`, `goose`) rocks and bobs on the swell, more when the wind is up, and leaves a small wake when it moves. To keep a boat moored, give it a path that starts and ends at the same point (`M 400 620 L 400 620`). Draw it with its waterline on y 0.

**Clouds drift on their own.** Open sky gets a few soft clouds that drift with the wind; you don't add them.

**Rain and snow touch the scene.** With `rain` or `snow` on, drops and flakes stop on the real tops of things: roofs, the road, the ground, treetops, the water. Rain splashes there, rings the water, drips from the eaves (label roofs `roof`) and runs down the subject in wet trickles; snow builds up on what faces up. People put up umbrellas in the rain, and snow settles on them. Label roofs, ground, roads and water so the weather finds them.

**Water moves on its own.** Anything labelled `water` gets small ripples: short dark dashes and light glints that drift, swell and fade, smaller further away. Nothing to add.

Sprites always pass **in front of** the painting; they can't go behind a building or a tree. Give them paths through open space: along a street, across the sky, over water. For a crowd or a smoke trail, use several sprites with staggered `data-delay`. Use solid fills inside sprites; for softness, use `data-fade-end`.

## 4b. People and cyclists: figures

Only add people when the description asks for them. A scene described without people has none: no figures, and no standing people drawn in.

Don't draw people as sprites: a picture of a person slid along a line looks like a cut-out skating. Use a **figure** instead. Paint draws it fresh every frame from a walking solver: the planted foot stays still on the ground, the heel peels off, the other leg swings through, the hips rise and dip, the arms swing opposite the legs, a coat or dress hem moves with the stride, pedals turn with the wheels. Its speed comes from its size and gait, so it can never slide. A figure is an **empty** `g`:

```xml
<g data-figure="walker" data-path="M -60 966 L 960 966" data-height="60" data-delay="0"
   data-top="#c8463c" data-legs="#3b3f5c" data-hair="#4a3226"/>
<g data-figure="walker" data-path="M 1260 972 L -60 972" data-height="62" data-gait="stroll"
   data-outfit="dress" data-top="#2f6f9f" data-carry="umbrella" data-carry-color="#d0453a"/>
<g data-figure="cyclist" data-path="M -90 962 L 1290 962" data-height="58" data-delay="11"
   data-top="#3f7a52" data-bike="#7a3b2e"/>
```

| Attribute | Meaning |
|---|---|
| `data-figure` | `walker`, `runner` or `cyclist`. Required. |
| `data-path` | The line their **feet** (or wheels) touch, in viewBox units. Required. Start and end off the canvas. |
| `data-height` | Standing height in viewBox units at the start of the path (from your plan's scale: 1.7 m × units per metre; any size, a foreground figure can be large). Default 60. A cyclist is given the height they'd have standing. |
| `data-gait` | Walkers: `walk` (default), `stroll` (slower, shorter steps; older people, couples, kimono or long skirts) or `run`. |
| `data-delay`, `data-repeat`, `data-flip`, `data-scale-end`, `data-fade-end` | As for sprites. Don't set `data-duration`: the gait decides the pace. |
| `data-top`, `data-legs`, `data-skin`, `data-hair`, `data-shoes` | Colours (`#rrggbb`) of the top or coat, trousers, skin, hair and shoes. |
| `data-outfit` | `trousers` (default), `coat` (a long coat over trousers) or `dress`. |
| `data-carry` | `none` (default), `umbrella` or `bag`, with `data-carry-color`. |
| `data-hat` | A hat colour, or leave it out for no hat. |
| `data-bike` | The bicycle frame's colour (cyclists). |

**Pace:** per second, a `walk` covers about 0.46 of the figure's height, a `stroll` 0.31, a `run` 1.04 and a cyclist 1.84 (using `data-height`). So a 60-tall walker crossing a 1320-unit path takes 1320 ÷ (0.46 × 60) ≈ 48 s. Use this to time anything that goes with them, like a dog (give it the same speed) or a moment in the timeline.

Figures face the way they travel, cast a soft shadow, and pass in front of the painting like sprites. They take the scene's light: at night they darken and cool with everything else, but stay clear in front of dark doorways. They count toward the 12 moving things. Animals (a dog, a cat, ducks) are still sprites.

## 5. The timeline: what happens after it's painted

Put JSON in a `metadata` element with `id="paint-timeline"`. Steps play in order; each makes a real change to the painting, and the whole run can be saved as a video.

```xml
<metadata id="paint-timeline">{
  "title": "Evening falls",
  "steps": [
    {"glaze": "sky", "color": "#f2b48a", "strength": 0.6, "duration": 2.5, "caption": "Sunset"},
    {"glaze": "all", "color": "#9a8fc8", "strength": 0.6, "caption": "Dusk"},
    {"lights": "sequence", "caption": "Lights on"},
    {"glaze": "not:window", "color": "#4f5a9a", "strength": 0.55, "caption": "Night"},
    {"wait": 2, "caption": "Night"}
  ]
}</metadata>
```

Step types:

| Step | Fields | What it does |
|---|---|---|
| `{"preset": "night"}` | | Golden hour, dusk, night; windows and lamps lit (in `data-light` order if they're numbered); moon and stars lifted from the sky. Captions itself. |
| `{"preset": "seasons"}` | | Autumn, winter, spring, summer, using `foliage`, `trunk`/`branch`, `roof` and `ground`. Captions itself, one caption per season. |
| `{"preset": "rain"}` | | Sky and land darken, rain falls, roads and ground get a wet sheen. Captions itself. |
| `{"glaze": target, "color", "strength", "duration", "caption"}` | `strength` 0 to 1 | A transparent wash of `color` over `target`. Glazes only darken or tint, like real watercolour. |
| `{"lift": target, "strength", "caption"}` | | Rewets and blots `target`, taking paint off back toward paper. Use it to bring back light. |
| `{"dabs": target, "color", "amount", "size", "caption"}` | `amount` 0 to 1, `size` small, medium or large | Leaf-shaped dabs of `color` over `target`, like a painter stippling foliage. |
| `{"lights": "all" or "sequence", "color", "caption"}` | | Lifts and warms windows and lamps; `sequence` follows their `data-light` numbers. |
| `{"snow": true}`, `{"snow": false}`, `{"rain": true}`, `{"rain": false}` | | Starts or stops falling snow or rain over the painting. |
| `{"wait": seconds, "caption"}` | | Holds, so the viewer can take it in. |

**Presets or custom steps, not both for the same thing.** `night` already includes the glazes and the lights, so don't add a `lights` step after it. To control every stage yourself (your own sunset colours, lights in your own order), use `glaze` and `lights` steps instead of the preset, as in the example above. Presets can follow custom steps and the other way round: for example, your own clouds gathering, then `rain`.

`target` is a role name (`"sky"`, `"foliage"`…), `"all"`, or `"not:sky"` (everything except that role). `duration` is how long the wash takes to lay, in seconds (default 2). `caption` is a short line shown under the video while that step plays.

Sprites move during the whole animation.

## 6. How Paint uses the file

1. Strips anything not allowed, reads the roles, focus, sprites and timeline, and shows a short report.
2. Paints the still scene (sprites and the timeline aside).
3. When the viewer plays the timeline, runs each step on the painting, moves the sprites, and records it.

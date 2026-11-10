---
name: paint-scene
description: Compose a scene as a Paint scene file (an SVG with labelled parts, moving sprites and an animation timeline) that the Paint watercolour tool paints and animates. Use when asked to draw, compose or describe a scene, place, landscape, street or moment for Paint, or to make a painted animation such as day to night, seasons or rain.
---

# Composing scenes for Paint

You write one SVG file. The Paint tool turns it into a watercolour painted by a simulation of water and pigment, then animates it: day to night, seasons, rain, or steps you write, with small things like birds and people moving across it. The file format is in `FORMAT.md`; read it first. This page is about making scenes that paint beautifully.

## How to work

1. **Write the plan first, in numbers,** as an XML comment right after the opening `<svg>` tag. Decide everything a reader would otherwise have to guess:
   ```xml
   <!-- plan
   subject: the corner café, left third; eye level 1.6 m, horizon y 760
   scale: 36 units per metre (person 63 tall, door 76, storey 108)
   light: low sun from the right; shadows fall left, violet
   palette: ochre plaster, terracotta roofs, sage shutters, blue-grey street, warm sky
   motion: two walkers and a cyclist as figures, two birds high up; night preset
   -->
   ```
   Every size later in the file comes from the scale line, and every shadow from the light line. A scene with no fixed scale ends up with doors too small for its people.
2. **Lay out the big shapes,** back to front: sky, distant hills, the ground plane. Get the horizon height and perspective right before any detail.
3. **Build the subject completely before anything around it:** its shapes, light and shadow sides, windows, detail. Then look at it on its own. Is it in proportion to the scale, does it read at a glance, is the light consistent? Fix it now: a weak subject can't be rescued by its surroundings, and every later part is sized against it.
4. **Then the surroundings,** with less detail the further they are from the focus.
5. **Label every part** with `data-role` (see FORMAT.md section 3).
6. **Add life** if the scene has it: people (as figures: walkers, runners, cyclists; Paint animates their legs and pace) **only when the description asks for people** ("a few people crossing", "a cyclist", "a farmer"), and sprites for birds, a boat, an animal, smoke from a chimney. Size them from the scale and time the sprites from the table below.
7. **Write the timeline** if an animation was asked for, or if the scene suggests one (a street at dusk wants lights coming on).
8. **Check it.** Go through "What makes a scene fail" and the checklist at the end, and fix anything that fails. If you can run commands, run `python3 check-scene.py scene.svg`: it measures sprite speeds, steps, timings and labels, and says what to change. Reply with the SVG only.

## Composition

- **One clear subject**, placed off-centre (about a third of the way in), with `data-focus` on it.
- **A believable eye level.** Most scenes read best with the horizon a third of the way up or down, not across the middle.
- **Overlap creates depth:** foreground things in front of the subject, the subject in front of the background. Things further away are smaller, paler and bluer.
- **Leave quiet areas.** Big calm sky or wall areas give the busy parts room. Watercolour looks best with open space.
- **Cover the whole canvas** with sky, wall or ground, with no empty gaps. Paint decides for itself which edges dissolve into bare paper.

## Scale: real sizes

Choose one scale (units per metre) in the plan and draw everything from it. Things further away get smaller by perspective, but nearby things keep these proportions:

| Thing | Real size | At 40 units per metre |
|---|---|---|
| Adult | 1.7 m tall; head 1/7 of that; arm about 0.44 of height | 68 |
| Child | 1.1 to 1.3 m | 48 |
| Door | 2.1 m tall, 0.9 m wide | 84 × 36 |
| Storey of a house | 3 m (a window about 1.2 m tall, its sill 0.9 m up) | 120 |
| Car | 1.5 m tall, 4.3 m long | 60 × 172 |
| Bicycle | 1 m tall, 1.7 m long | 40 × 68 |
| Street lamp | 4 to 5 m | 180 |
| Bench | 0.45 m seat, 1.6 m long | 18 × 64 |
| Tree | 6 to 15 m; trunk 0.3 to 0.6 m across | 240 to 600 |
| Small boat | 4 to 6 m long | 200 |
| Gull, crow | 1 m wingspan; a sparrow 0.25 m | 40 |

## Light and colour

- Pick **one light direction** and keep it consistent: every object gets a lit side and a shadow side (two shapes, the shadow side 15 to 25 percent darker and a little cooler).
- Every object standing on the ground gets a **cast shadow**: a soft, darker, slightly blue or violet shape on the ground, away from the light, labelled `shadow`.
- **Colours:** natural and harmonious, a little brighter than life. Choose a palette of four to six main colours and vary them. Avoid pure black and pure white; the darkest darks are deep blue-brown, and the lightest lights are left for the paper.
- **Skies** are gentle gradients (`linearGradient`), lighter toward the horizon.
- **Highlights** (white walls in sun, foam, snow) can be very light. Paint leaves the lightest areas as bare paper, which is how watercolour shows white.

## Drawing the parts that make or break a scene

- **Buildings:** draw the front face and one side face in perspective (the side darker). Windows are recessed: a frame shape, then a darker glass shape inside (role `window`), a thin bar or two, and a light sill below. Roofs overhang the walls a little and get their own role `roof`. Add gutters, steps, a door with a frame, signs, awnings, planters: small things make a place believable.
- **Trees and hedges:** a trunk (`trunk`) and a few main branches (`branch`) as tapering paths or strokes, then the canopy as **many overlapping leaf clusters** (ellipses about a tenth to a quarter of the canopy's width, so 12 to 40 clusters a tree) in two to four greens: lighter on the lit side and on top, darker underneath and inside (role `foliage`). Never a single smooth blob. Let some sky show between clusters near the edges.
- **Grass and ground:** a base colour with a few soft bands of lighter and darker colour, and small tufts or flowers near the front.
- **Water:** horizontal bands, darker and more saturated near you, with a few light streaks; reflections of the subject as broken horizontal pieces. Label it `water` and Paint adds moving ripples.
- **People only when asked.** Don't add any people, moving or standing, unless the description mentions them (people, a person, a crowd, walkers, a cyclist, a farmer, children…). A street, a harbour or a park on its own gets no one: birds, boats, smoke, clouds and lights carry its life.
- **People:** anyone who moves is a figure (`data-figure`), which Paint walks for you. People who stand still (someone at a café table, a shopkeeper in a doorway) are drawn as shapes with role `figure`: small, simple and in proportion (head about one seventh of their height), a body in a clear colour (red, yellow, blue clothes read beautifully), legs, sometimes a bag, umbrella or hat, and a short cast shadow.
- **Detail density:** the focus gets the most detail (window bars, roof tiles hinted with a few lines, signage shapes, railings); the edges get the least.

## Strokes and edges

Shapes meet edge to edge; don't outline them. Paint draws its own pen lines in the ink-and-wash style. Use strokes only for genuinely thin things: wires, poles, railings, branches, window bars, ropes, birds in flight.

## Animation

- Moving things make a scene alive: two or three birds gliding at different heights and speeds, a person or two walking along the street, a cyclist, smoke drifting up from a chimney. Stagger `data-delay` (and vary `data-duration` for sprites), so nothing moves in lockstep.
- **People are always figures, never sprites.** Give each a `data-height` from the scale, a gait, an outfit and colours, and a path along the ground their feet touch. Vary them: a walker in trousers, a woman in a dress with an umbrella, a man in a coat with a bag, a cyclist. Don't set their duration: the gait sets a natural pace, so they never skate.
- **Speed comes from size, never from taste.** A sprite's speed is its path length divided by `data-duration`; set the duration so the speed matches the thing:

| Sprite | Natural speed | Bob | Notes |
|---|---|---|---|
| People, cyclists | set by Paint: per second, a `walk` covers about 0.46 of the figure's height, a `stroll` 0.31, a `run` 1.04, a cyclist 1.84 (of their standing height) | set by Paint | Use `data-figure`; never give people a duration. |
| Dog, cat | alongside an owner: the owner's speed (a dog beside a 60-tall walker covers 0.46 × 60 ≈ 28 units/s); alone, 1 to 2 of its own heights per second | 4% of height, `data-step` ≈ 0.45 × its height | Draw it with paws on y 0. |
| Car | about 2 of its lengths per second in a town (30 km/h) | 0 | Cars rarely suit a painting; prefer people and bicycles. |
| Boat | 0.1 to 0.5 lengths per second | 1 to 2% of height, no step | Slow: water is calm. |
| Bird | crosses the canvas in 6 to 15 s | none (Paint flaps it) | Name it for the kind (`swallow`, `gull`, `crow`): that sets how it flies. Higher ones slower; never under 4 s. |
| Smoke puff | rises its own height in 1 to 2 s, 6 to 10 s per path | 0 | Grows with `data-scale-end` 1.5 to 2.5, fades with `data-fade-end` 0. Several puffs, staggered. |

  Worked example: a bird should cross a 1200-wide canvas in about 10 s; its path runs from -60 to 1260, so 1320 units, and `data-duration` = 10 × 1320 / 1200 ≈ 11.
- **Animals that walk are drawn with their feet on y 0,** so the path is the ground they walk on, and get `data-step` so the bob rises once per step.
- **Moving into depth?** Use `data-scale-end`: a figure walking away from 60 units tall to 30 might use `data-scale-end="0.5"`. Figures slow down on screen as they shrink, on their own. For sprites, multiply the duration by 2 ÷ (1 + `data-scale-end`) (so ×1.33 for 0.5).
- **Not everything at once.** Two to four things moving in view at any moment. A still scene with one walker and two birds feels alive; ten moving things feels like a screensaver.
- **Loops start and end off the canvas,** so nothing pops in or out. A walker who goes into a doorway uses `data-repeat="once"`. A path that can't leave the canvas (a street receding into depth) ends far away instead: `data-scale-end` around 0.3 and `data-fade-end="0"`, so the figure shrinks and fades into the distance.
- Timelines tell a small story in 15 to 30 seconds. Good shapes: day, golden hour, dusk, lights on, night (`preset: night`); a full year (`preset: seasons`); fine weather, clouds gather, rain (`preset: rain`); or custom glazes, like a sky going rose then violet.
- Glazes only darken, as in real watercolour. To bring light back (a lamp, a moon, a gap in the clouds), `lift` it first.
- Captions are short: "Golden hour", "Lights on", "First snow".

## What makes a scene fail

These are the mistakes that most often spoil a painted scene. Check for each one.

- **No fixed scale:** people as tall as doors, or doors as tall as houses. Size everything from the plan's units per metre.
- **Trees as one smooth blob,** or one flat green. They need many leaf clusters in two to four greens.
- **Outlines around everything.** Shapes meet edge to edge; strokes are only for thin things.
- **Flat lighting:** no shadow sides, no cast shadows, or shadows falling in different directions.
- **Everything at the same level of detail.** Detail belongs at the focus; the edges stay simple.
- **Cut-out people:** a person drawn as a sprite and slid along a path. People are figures.
- **Sliding animals:** too slow or too fast for their size, or bobbing on a timer without `data-step`.
- **Lockstep:** sprites with the same duration and delay, or birds in a neat row.
- **Popping:** looping sprites that start or end on the canvas.
- **Sprites crossing solid things:** a person walking through a wall, a bird flying through a tree. Sprites pass in front of everything, so give them open paths.
- **Too much at once:** more than four things moving in view, or more than eight light numbers so the lights drag on.
- **Timelines that drag:** over 45 seconds, captions longer than a few words, glazes above 0.85 that bury the painting (build darkness in two glazes).
- **Colours that fight:** a sky glazed green by a yellow over blue, pure black darks, or a palette of more than six main colours.
- **Uninvited people:** figures or standing people in a scene whose description didn't mention any.
- **Leftovers:** objects nobody asked for that don't belong to the place. Every object should earn its place in this particular scene.
- **Copies:** famous paintings, known characters, logos or brand names. New scenes are new.

## Checklist before you answer

- [ ] A plan comment at the top gives the subject, eye level, scale, light, palette and motion as numbers.
- [ ] The root has `viewBox`, `data-paint="1"` and `data-focus` on the subject.
- [ ] Everything is sized from the plan's scale: doors, storeys, people and trees agree.
- [ ] The canvas is fully covered, and the horizon and perspective are consistent.
- [ ] One light direction; every standing object has a lit side, a shadow side and a cast shadow.
- [ ] Trees are many leaf clusters in several greens, never one blob; trunks and branches are labelled.
- [ ] Windows are frame plus darker glass (`window`), doors are framed, and roofs are labelled `roof`.
- [ ] The parts effects need are labelled (sky, ground, roof, window, lamp, trunk, branch, foliage, water), and other parts have a role where one fits (`prop` for posts, furniture and jetties).
- [ ] The focus has the most detail; the edges are calmer.
- [ ] Sprites are drawn around (0, 0) (walking animals with paws on y 0), face right, are small, and their paths (and figures' paths) go through open space: they pass in front of everything. They use `data-scale-end` for depth and `data-fade-end` for smoke. Sprites and figures together are no more than 12.
- [ ] There are people only if the description asked for them.
- [ ] Every moving person is a `data-figure` with a height from the scale and a path along the ground; no person is a sprite.
- [ ] Every sprite's duration comes from the speed table; walking animals have `data-step`; no two share a duration and delay; loops start and end off the canvas.
- [ ] The timeline (if any) is valid JSON inside `<metadata id="paint-timeline">`, its targets are roles that exist in the scene, and it doesn't repeat what a preset already does (no `lights` step after `night`).
- [ ] Only allowed elements and attributes: no text, images, filters, CSS or `style` attributes.
- [ ] Nothing in "What makes a scene fail" applies.
- [ ] The reply is the SVG file and nothing else.

# Experiments

Small things made for fun. Live at https://madebypuru.github.io/experiments/

## meadow/

Draw a loop on a watercolour meadow and it becomes a sheep. Tap a sheep to make it bleat.

The paint is simulated on the GPU with WebGL2: a simplified version of Curtis et al., *Computer-Generated Watercolor* (1997). Every cell of paper holds water, pigment floating in that water, and pigment that has settled into the paper. Water flows between wet cells and creeps slowly into dry paper, and the pigment travels with it. A wash's rim dries first, so pigment collects there into a darker edge. Colours that touch while wet bleed into each other. On load the scene paints itself in as a quick time-lapse. Each sheep's body, face and ears are painted by a small run of the same simulation, and a new sheep soaks into the meadow as a wet blot.

To publish it, upload the `meadow/` folder as it is. It's static files only: `index.html`, `favicon.svg`, `og.jpg` and `sounds/`. Two notes:

- `og:image` and `og:url` in `meadow/index.html` point at the GitHub Pages address. Change both if you move it to another domain, because most link previews need an absolute URL.
- It needs WebGL2 with float render targets, which current Chrome, Safari, Firefox and Edge all have. On an older browser it shows a short message instead.

Fonts come from Google Fonts (Fredoka, Shantell Sans).

## paint/

Upload any photo and it gets painted as a watercolour, live, by the same simulation as Meadow. No image is generated: the photo is only read for its colours, regions and edges, and turned into the washes a painter might lay down:

1. Find colour regions (k-means in Lab), highlights to leave as bare paper, and where the detail and colour are.
2. Choose a subject-shaped area to paint. It's fullest around the focus, loosens into a pale halo with dry-brush streaks, and the rest stays paper. Tap the photo before painting to move the focus.
3. Paint it lightest first: a wet underwash in horizontal brush sweeps, then middle-tone and dark glazes, then dark accents near the focus. With **Ink** on, loose pen lines traced from the strongest edges go in last.

It takes about 20 seconds to watch; **Finish now** fast-forwards it. **Download** saves a PNG. Photos never leave the browser.

## paint-skill/

A skill any AI model can follow to write scenes for Paint: SVG drawings with labelled parts, moving sprites and an animation timeline. Copy `paint-skill/PROMPT.txt` into any chatbot, describe a place, and open the SVG it returns in Paint. No API. See `paint-skill/README.md`.

`_drafts/` has earlier versions: the standalone paint test, and the first Canvas 2D attempt. `_source/` has the original sound recordings.

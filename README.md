# Experiments

Small things made for fun. Live at https://madebypuru.github.io/experiments/

## meadow/

Draw a loop on a watercolour meadow and it becomes a sheep. Tap a sheep to make it bleat.

The paint is simulated on the GPU with WebGL2: a simplified version of Curtis et al., *Computer-Generated Watercolor* (1997). Every cell of paper holds water, pigment floating in that water, and pigment that has settled into the paper. Water flows between wet cells and creeps slowly into dry paper, and the pigment travels with it. A wash's rim dries first, so pigment collects there into a darker edge. Colours that touch while wet bleed into each other. On load the scene paints itself in as a quick time-lapse. Each sheep's body, face and ears are painted by a small run of the same simulation, and a new sheep soaks into the meadow as a wet blot.

To publish it, upload the `meadow/` folder as it is. It's static files only: `index.html`, `favicon.svg`, `og.jpg` and `sounds/`. Two notes:

- `og:image` and `og:url` in `meadow/index.html` point at the GitHub Pages address. Change both if you move it to another domain, because most link previews need an absolute URL.
- It needs WebGL2 with float render targets, which current Chrome, Safari, Firefox and Edge all have. On an older browser it shows a short message instead.

Fonts come from Google Fonts (Fredoka, Shantell Sans).

`_drafts/` has earlier versions: the standalone paint test, and the first Canvas 2D attempt. `_source/` has the original sound recordings.

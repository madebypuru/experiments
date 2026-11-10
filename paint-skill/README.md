# Paint scene skill

Teaches any AI model to write scenes for [Paint](../paint/): SVG drawings with labelled parts, moving sprites and an animation timeline. Paint turns them into a watercolour painted by a simulation of water and pigment, plays the timeline over it, and can save the animation as a video. No API is involved: the model writes a file, and Paint reads it.

## Use it with any chatbot

1. Copy everything in `PROMPT.txt` (or press **Copy the scene prompt** in Paint) into ChatGPT, Gemini, Claude, or any other chatbot.
2. Describe a scene: "a small bakery on a rainy corner at dusk, with a cyclist passing".
3. Save its reply as `something.svg`, or copy it, then open or paste it in Paint.
4. Choose a style and detail, press **Start painting**, then **Play scene** to run its timeline, and **Save video**.

## Use it as an Agent Skill

`SKILL.md` follows the Agent Skills format (Claude Code, claude.ai and other tools that read `SKILL.md`). Put this folder where your tool looks for skills, for example `~/.claude/skills/paint-scene/`, and ask for a scene for Paint.

## Files

| File | What it is |
|---|---|
| `SKILL.md` | The craft guide: how to compose, light, colour and label a scene that paints well, plus the checklist. |
| `FORMAT.md` | The file format: roles, sprites, the timeline and its steps. |
| `PROMPT.txt`, `PROMPT.md` | Both of the above in one copy-paste prompt. Regenerate with `python3 build-prompt.py` after editing either. |
| `check-scene.py` | Checks a scene before you paint it: required attributes, labels, timeline targets, and measured things like walker speed against height, step length, lockstep sprites and timeline length. `python3 check-scene.py scene.svg`. |
| `examples/` | Three scenes written by a model that saw only the prompt: a street at dusk, a lake cottage through the seasons, a harbour in the rain. |

## What a scene can do

- **Roles** (`data-role`) tell Paint what each part is: `sky`, `ground`, `water`, `roof`, `window`, `lamp`, `trunk`, `branch`, `foliage`, `prop` and more. Effects then land exactly where they should: windows glow, leaves turn, snow settles on roofs.
- **Figures** (`data-figure`) are people walking, running or cycling. Paint solves their legs every frame, so feet stay planted, arms swing and pedals turn; the scene only gives a path, a height and colours.
- **Sprites** (`data-sprite`) are small painted things that move along a path: birds, boats, animals, smoke. They can bob (once per step for walkers, with `data-step`), and grow, shrink or fade along the way.
- **The timeline** plays steps over the finished painting: presets (`night`, `seasons`, `rain`) or custom ones (`glaze`, `lift`, `dabs`, `lights` in sequence, `snow`, `rain`, `wait`), each with a caption for the video.

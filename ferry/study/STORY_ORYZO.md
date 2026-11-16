# STORY_ORYZO: oryzo.ai as scroll storytelling

Observed at 1440x900. Page height 56,691px, about 63 viewports. Most copy is drawn inside WebGL canvases, so I read it from screenshots at low resolution. Treat the wording as approximate.

## What it is
Oryzo is a fictional "AI cork coaster" site, a self-promotion piece by the studio Lusion ("Designed by Lusion, the award-winning design studio"). It speaks to prospective clients, brands that want a studio able to make a trivial object feel like an event. The closing line says so outright: "We caught your attention with a non-existent product. If we can sell a coaster, imagine what we can do for your brand."

## The story (arc: deadpan claim, escalation, absurd proof, reveal, ask)
1. Hero (1 vp). Tabletop from above: green cutting mat, pencils, a blade. Giant "ORYZO", "Made for mugs. Built for tables.", "the world's most unnecessarily sophisticated cork coaster". Answers "what is this?" Hands over on scroll into a dark void.
2. "Powered by AI" (about 8 vp, pinned). A hand holds the coaster; the AI claim stacks up ("AI fills in the gaps. We said high five, it heard six."). Answers "why should I care?" with a joke. Hands over with the coaster turning edge-on.
3. "Isn't just a coaster" (brief). The disc tilts in empty space beside short copy, a straight-faced product pitch.
4. "So portable, it's wearable" (about 13 vp, pinned). Photo-card carousel: coaster as a jacket badge, a hat, over an eye, on a red set. Answers "where would I use it?" It hands over by the carousel exiting.
5. Features (about 10 vp). Thermal-camera heat view of a mug on the coaster, then a measured-diameter section ("Perfectly round, seriously", "Now 37.9% more circular") with a wireframe ring over the tabletop. Satirical spec proof.
6. Encryption, Grip, Sustainability (about 4 vp each). Back on the green mat for encryption; macro cork texture for "Grip-locked antislip technology"; a giant lit "sustainability" word. One joke claim each.
7. Reviews (about 2.5 vp). Star ratings with real-looking quotes around a slowly rotating coaster.
8. Social content and product (about 8 vp). Coaster in a ring, huge ghost "ORYZO", then a thin vertical line slicing the disc, a pin-sized teardown. "Choose your Oryzo" with three variant buttons (Oryzo, Oryzo Pro, Oryzo Pro Max) and a rotating model.
9. Reveal and ask (about 2 vp). Coffee beans scatter on black. The reveal line and the Lusion contact block close it.

## The base
One world: a physical desk. A real cork disc, photographically rendered in 3D, lit warmly against near-black, sits on an object-photo tabletop (cutting mat, pencils, blade, pegboard). The coaster is the recurring character. It changes by context: hand-held, edge-on, worn, heat-mapped, wireframed, sliced, rotating alone. Each section is one new way of looking at the same disc. The tabletop returns three times (hero, encryption, features) as a visual anchor.

## Moving pieces
- Hero to AI section: scroll-driven camera and object moves in the canvas; the headline types in. Essential, it carries the first claim.
- AI hand and coaster: scrubbed by scroll position inside a long pin (about 8 vp). The coaster hovers while the claims swap. Essential.
- Rainbow screen-edge glow at the AI beat: a colour fringe appears around the frame at some scroll positions. Garnish, an "AI" signal.
- Wearable carousel: a pinned centre card with neighbours sliding sideways, driven by scroll. A "scroll to continue" cue sits at the bottom centre. Essential, it shows use cases.
- Heat view, wireframe ring, slice line: the coaster is re-rendered as thermal, measurement, and cross-section. Essential, each is the proof device for a claim.
- Sustainability word, review stars, bean scatter: letters, rows and particles that animate in. Garnish with some meaning.
- Persistent chrome: a fixed top nav (Intro, Features, Product, Contact), a fixed side tag "ORYZO-1 MODEL", a corner caption "More illustration", and a "scroll to continue" cue. The footer is also fixed (revealed under the last section). Letter-by-letter hover or reveal on footer links, shown by doubled letters in the page text. I did not see the hover.
- Pointer: an AI chat-like prompt field appeared in the hero ("Say something to Oryzo") in one frame. I could not test it.

## Visuals
- Render style: photoreal 3D cork with a soft key light, shallow depth of field, grain on the surface. Mixed with real photos (jacket, face, hat, red set).
- Palette: near-black brown, warm cork orange (about #E8903A), cream type; green mat only as a contrast scene. Rainbow only for the AI beat.
- Type: a geometric sans, uppercase, with huge headlines (single words up to about a third of the screen height) against 14-16px body. Headline to body ratio is roughly 6 to 1 or more. Weights are medium to bold for display, regular for captions. Some lines are lowercase italic-feeling ("it's wearable"). Per section: one headline and 1 to 2 short sentences.
- Density: very sparse. One object, one line of copy. Whitespace is dark negative space.
- Texture: grain and vignette; heavy light falloff to the corners.

## Pacing
Twelve sections in 63 viewports. The long pins are the AI beat (about 8 vp) and the wearable carousel (about 13 vp); those are where it slows and the user does the "work". Features, encryption, grip and sustainability run shorter and quicker. The last third (reviews, social, product, beans) is about 12 vp.

## Copy
Voice is deadpan corporate parody ("the simplest moment feel considered", "unnecessarily sophisticated"). Headlines are 2 to 6 words. Proof is invented: percentages (37.9% more circular), an "AI" asterisk, fake spec labels, fake star reviews, a formula p(n). There are no logos or real quotes. A disclaimer states the whole site is fictional and satirical.

## The ask
One real ask, at the end: hire Lusion (new business and general emails, newsletter, a "Copy URL" share). A product step ("Choose your Oryzo", variants) mimics a store CTA but does not sell. Nav "Contact" is permanent, so the ask is available throughout; the visible push is once.

## Technique facts verified
- 6 canvas elements (WebGL), 2 video elements, 43 inline SVGs, 39 images.
- No gsap, ScrollTrigger, Lenis, three, rive or lottie on window. The site is Astro (one bundled script, `/_astro/hoisted...js`), so the libraries are bundled, not global. Cloudflare analytics beacon present.
- A fixed full-page canvas under the sections; 7 fixed section inner layers and a sticky layer, so every section is a pin over one persistent canvas.
- Native scroll with a smoothed or lagged scroll (wheel ticks moved about 200px at a time later but far more on first scroll).

## What could not be seen or verified
- The motion between sample points. I jumped the scroll position with script, so I saw end states, not transitions, and did not see numbers counting, typing speed or easing.
- Exact copy: screenshots were small and the text is in canvas.
- Hover and cursor effects, the hero prompt field, the video content, audio, and the footer reveal.
- Mobile layout. No second viewport tested.
- One section (reviews and the social-content stretch, about 44,000 to 51,000) was seen in only three frames.
- A shared browser tab was overwritten by another agent early on, so I opened my own tab.

## Principles a different brand could borrow
1. Make one tangible hero object and let every section show it in a new light.
2. Give each section one claim and one visual proof, never more.
3. Put the biggest type against the smallest, with nothing in between.
4. Use long pinned stretches where the visitor's scroll drives a single transformation.
5. Change the way the object is seen (heat, measurement, cross-section) instead of changing the object.
6. Return to a first-scene backdrop several times so the page feels like one place.
7. Hold a single deadpan voice, and let the humour carry the proof.
8. Keep persistent chrome small and fixed so the story does the work.
9. Save the one real ask for the end, and make the reveal change how the whole page reads.
10. Use a restrained palette and spend the one loud colour on a single beat.
11. Give the page a texture (grain, light falloff) so renders feel photographed.
12. Show the craft by making a modest subject feel important.

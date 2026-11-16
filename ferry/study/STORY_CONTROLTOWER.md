# Control Tower (controltower.so) - scroll story study

Method note: Chrome extension was not connected, so I used the built-in Browser pane (1440x900). I jumped scroll positions (window.scrollTo) and screenshotted after 1-2s, so I saw states, not frame-by-frame motion.

## What it is, who it is for
Control Tower is a private-beta operating dashboard for agencies: projects, revenue, profit, team capacity, client sign-offs in one place. The page talks to agency owners and founders drowning in tools and check-ins, and signs off as three named co-founders.

## The story (arc: calm-from-above -> confession -> proof tour -> ask)
1. Hero, 0-4500px (5 viewports, pinned 3D scene). A dusk control tower in mist; headline "Run client work without the chaos. Manage projects, revenue, profit, and your team - all in one place." Answers: what is this? Hands over by the camera pushing in toward the glass cab.
2. The push-in. Mist clears, tower rises and grows, text fades out, camera enters the window, the view blurs to a white blown-out rectangle. This is the page's only "event".
3. Founder note, ~4500-6300 (white page, 4 short paragraphs). Says: agencies hold a hundred threads; more dashboards add noise; client work shifts and stalls because of people; this was built for that. Answers: why should I trust this? Signed by three founders with avatars and handles. Hands over to proof.
4. Walkthrough video (~6300), large framed screen recording of the app with a founder face-cam in the corner, play button.
5. "Know Your Numbers" (~7200): big dashboard (revenue, churn, gross profit, receivables, workload, revenue chart).
6. Two cards, "Team Utilization" and "Revenue Mix" (~8300): profitability and utilization gauges, concentration table.
7. "Introducing Checkpoints" (~9100): task sign-off document with comment thread, internal/client toggle.
8. Two cards, "Your Team" and "Posts" (~10200).
9. Ask (~10860): "Get early access." with one email field, then footer.
Pattern: spectacle first, human voice second, then the product shown one capability per block, each with a title and one line.

## The base
Metaphor: the control tower (air traffic control = calm oversight of chaos). The tower is both logo (small tower glyph top-left, always present) and the hero object. It is introduced large and moody at the top, you travel into it, and then it disappears: below the fold there is no tower, no weather, no airport. The metaphor is spent in one gesture and the rest is plain product UI on a white page. Faint mist-grey/lilac backdrop appears behind the dashboard cards, a quiet echo of the sky.

## Moving pieces
- Load: text and email field sit over the tower; tower lights blink faintly (small red/white lights on the roof). Garnish.
- Hero, scroll-linked and pinned (sticky 900px stage inside a 5400px container, a 3200x2240 canvas, almost certainly WebGL/3D or pre-rendered frames): 0-~1200 mist thins and tower lifts into view, headline stays; ~3000-3700 headline and email fade to nothing and the tower fills frame; ~4100 camera crosses the glass, motion-blurred interior; ~4400 white wash. Essential: it is the entire first impression and the transition from "chaos" to "clarity" (fog to white).
- Founder note, ~4700: paragraphs reveal by scroll with a fade from grey to black, line by line. Essential to pace the reading; the page makes you read slowly after the fast zoom.
- Video block: appears with plain scroll; play on click (not verified). Face-cam makes it personal.
- Dashboard and cards: normal scroll, static in my screenshots. Some contain canvases (7 total on the page; the large ones at 7351, 9267 and smaller pairs at 8447 and 10331), which suggests live-rendered or animated charts/gauges. I could not confirm what animates inside them. Garnish unless proven otherwise.
- Header: fixed, tiny, "Log In" only.
No parallax, no horizontal scroll, no counters seen.

## Visuals
Hero: photographic/3D dusk render, deep navy to violet, soft volumetric cloud, warm pin lights, film grain; rounded-corner frame inset a few px from the window edge. Below: white page, near-black text, product shots as dark-mode UI inside rounded frames on a muted lilac-grey field, so dark app against white page gives contrast. Type: single family (Geist), headline 36px regular on the hero (about 2.5x the 14px body), section titles 24px/16px at weight 500, grey subtitles. Text per section: one title plus one sentence, except the founder note. Density: very low; large margins, images carry the page. Texture: grain only in the hero.

## Pacing
About 9 beats; total 11,259px, roughly 12.5 viewports. The hero alone is 40% of the length (pinned, slow). Founder note is a one-screen pause. Product part is ~6 viewports, steady rhythm: title, shot, title, two-up, title, shot, two-up, ask. No section changes mood after the hero; speed is constant.

## Copy
Hero headline: 3 short sentences, plain, outcome-led, no jargon. Founder note: first person plural, candid ("We tried to fix it with more dashboards... adding noise doesn't create clarity."), four paragraphs of 1-3 sentences. Section lines: 6-12 words, benefit-first ("Revenue, receivables, and team workload - all in one view."). Proof: the product itself (real-looking numbers, tables, a comment thread), a founder video, and named founders; no logos, testimonials or stats about customers.

## The ask
Single action: join the early-access list with an email. It appears twice: inline in the hero (bottom left, over the tower) and as a closing block near the bottom. "Log In" is a quiet third option for existing users. Page states "private beta" both times.

## Technique facts (verified)
Next.js app; framer-motion, recharts, tiptap, supabase bundles loaded; no GSAP/ScrollTrigger/Lenis/three globals on window (may be bundled). 7 canvases, 0 video elements, no iframes, 55 inline SVGs. Hero stage is a sticky 100vh container; a -100vh overlap pulls the founder note up beneath it. Dashboards are real HTML/charts (page text is selectable: numbers, table rows), not screenshots.

## Could not be seen or verified
Smooth in-between frames of the hero (I sampled ~8 positions); whether the hero is real-time 3D or an image sequence; hover/cursor effects; what animates inside the dashboard canvases or on chart load; the video's content and whether it autoplays; mobile layout; load-time intro animation (first screenshot was a dark blank, then the tower appeared). One earlier batch accidentally ran against another open pane tab (oryzo.ai); I only scrolled it, nothing else.

## Principles a different brand could borrow
1. Spend one big spectacle at the top and then stop; let calm do the rest of the work.
2. Make the metaphor an object you travel through, not a decoration you look at.
3. Tie a scene's transition to the promise (murk to clarity) so the motion states the pitch.
4. Pin the stage long enough for the viewer to feel progress before any copy asks for attention.
5. After a loud opening, change surface (dark to light) to signal a change of voice.
6. Put a human, signed, plain-spoken note between the spectacle and the product.
7. Reveal important reading text with scroll so the viewer sets the reading pace.
8. Show the real product with real-looking numbers; one capability per block, one title, one line.
9. Frame dark product screens on a light page for contrast without extra decoration.
10. Keep one type family and few sizes; let imagery and whitespace create hierarchy.
11. Ask in the first view and again at the end; keep the ask to one field.
12. Retire the hero device after it has done its job instead of repeating it in every section.

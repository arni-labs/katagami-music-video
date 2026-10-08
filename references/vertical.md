# Vertical, every look, and the render

Read this for the code film's 9:16 film. Sections 1 to 3 apply to any code film; sections 4 to 6 are the HyperFrames route: testing every look, the optional beat-looks cut, and rendering both films. The cinematic cut has no 9:16 film ([cinematic-cut.md](cinematic-cut.md)).

Output: `compositions/vert/*.html` (or the canvas engine's tall layouts), `renders/wide.mp4` and `renders/vert.mp4`. The encoded copies for each platform are in [release.md](release.md), section 3.

## 1. Compose the vertical for vertical

The vertical is its own film at 1080x1920. Same scenes, lines, jokes, language and art style as the 16:9 file, laid out again.

- Start from the 16:9 scene file and re-lay it out. Keep the scene id and the timing code.
- No letterbox bands, no cropped 16:9 frame, no duplicated lyrics, no style labels floating in empty space.
- Stack rather than shrink: the picture or UI on top, the lyric below; or panels one above another.
- Full-bleed art with type over it works well, laid out again for the tall frame: the subject placed and sized for 9:16, the type set for it. Keep faces in frame.
- Never fill the tall frame by scaling up the 16:9 picture's middle. Reason: on a past film the 16:9 centre column scaled 1.78 times was exactly the "cropped in" look the user sent back.

## 2. The frame map

| Zone | Rule |
| --- | --- |
| Margins | Type and UI stay 64 px from every edge (72 px in the 16:9 film), measured on the rendered pixels |
| Lyrics and key type | Above about y 1640, and above y 1520 where it reaches into x 90 to 360 (the row of friends who liked the post) |
| Right edge | Below y 980, no key type right of about x 880 (the platform's buttons) |
| Bleed | Only art and texture (illustration, screentone, speed lines, backgrounds) may run off an edge |
| Empty space | No empty band taller than about 100 px |

Type sizes at 1080x1920: lyrics at least 80 px (display lines 110 to 170 px), UI text at least 40 px, fine print at least 28 px.

**The platform zones,** measured from a screenshot of an ordinary Instagram Reel on an iPhone (October 2026), in film pixels:

| Zone | Box |
| --- | --- |
| Never shown | 53 px of each side |
| Status bar, then the top icons | y 0 to 125, icons to y 245 |
| Buttons (like, comment, share) | x 910 to 1027, y 980 to 1860 |
| Friends who liked it | x 90 to 360, y 1520 to 1695 |
| Name, AI label and caption | y 1695 to the bottom |

- The platforms' published ad safe zones are much stricter (Meta's starts at y 1248) and were made for ads; an ordinary post's interface is what viewers see. Measure from a screenshot of the real app when you can.
- Check every second of the tall film against these zones with a tool that reads the film's own text boxes (the edge check below for HyperFrames, the recorded text calls for a canvas engine). Reason: on a past film this check found type under the caption in four places of a short cut.
- Measure the margins on the rendered pixels as well ([SKILL.md](../SKILL.md), rule 10).

## 3. Nothing cut at the bottom

Fill the frame by placing things, not by cropping them.

- The last thing at the bottom is a designed ending: a panel's own bottom edge, a complete footer bar, a caption block.
- No partial UI: no "next post" peeking in, no card running past the edge, no border stubs on the edge, no half-visible text.
- If space would be empty, make the complete elements bigger (type, panels, art) or move the lyric band. Do not add a cropped element.
- Mark art and texture containers with `data-bleed` so the check skips them.

Check it with `scripts/edge-check.mjs` from this skill's folder (`$SKILL_DIR`). It needs Playwright.

```sh
node build.mjs --frame vert --mute
node "$SKILL_DIR/scripts/edge-check.mjs" out/vert                # the whole film
node "$SKILL_DIR/scripts/edge-check.mjs" out/vert --at 12.4,31   # given moments
```

- It plays the built film at the build's canvas size (1080x1920 for `out/vert`) and seeks to six moments in every scene.
- It lists every visible element with text, a border, a fill or a shadow that crosses the bottom edge. It also lists those that end inside the margin (64 px by default in a tall frame, 72 px in a wide one).
- It lists fonts too: a family that visible text asks for first but that has no `@font-face`, and any font file that failed to load. Both render in a fallback face.
- It exits 1 when it finds something.
- It skips SVG, so UI you draw in SVG is not checked: look at those frames yourself. `npx hyperframes check` also reports text and panels that leave the canvas.

## 4. Readable in every look

A look changes paper, ink, accents and fonts at once. Text that was fine in one look can vanish in another (black on black, neon on neon, cream on sage).

- Text on paper uses `--k-ink`. Text on a card or panel uses `--k-on-surface`. Text on an `--k-accent` block uses `--k-on-accent`. Text in the accent-2 or accent-3 hue uses `--k-text-2` or `--k-text-3`.
- Never colour text with `--k-paper` or `--k-surface`, and never assume the paper is light. Reason: some languages pair a dark paper with a light surface, so no single text colour works on both.
- Size highlight and marker blocks from their text (padding on the text element), never with fixed widths. Reason: a wider font in another look pushes the glyphs off the block.
- Text over traced art gets a solid block behind it, or a halo in the opposite token. Reason: the art's tones change with every look.
- For text on a token colour whose lightness changes between looks, let CSS pick black or white:
  `color: oklch(from var(--k-accent-2) clamp(0, (0.62 - l) * 1000, 1) 0 0);`

Test every look before you render. The build's `--look <id>` option (see `scenes-and-styles.md`, section 6) writes the look's rule into the `<head>` of the built `index.html`, after `art/art.js`, and re-inks the art:

```html
<style>[data-composition-id],[data-composition-id] *{--k-paper:<hex>!important;--k-ink:<hex>!important;--k-on-surface:<hex>!important;/* all 19 tokens */}</style>
<script>reinkArt(["<hex>", "<hex>", "<hex>"]);</script>
```

```sh
for lk in <restyle look ids from looks.json>; do
  node build.mjs --frame vert --look $lk --only s04,s05 --out out/look-$lk
  npx hyperframes check out/look-$lk
  npx hyperframes snapshot out/look-$lk --at 1.2,3.4,6.1
done
```

- The rule must be in the top document and must target every descendant with `!important`. Reason: the same rule inside a scene's `<style>` is scoped to that scene and silently matches nothing, and a scene's own `#root` rule shadows tokens set only on the host.
- Test with the exact font files the look will use, including any `size-adjust` copies. Reason: an overlap check run with the full-size face measures a different layout.
- `check` must pass its contrast audit in the original look and in every restyle look, and the snapshots must read well at phone size.

## 5. Optional: the beat-looks cut (a sketch)

A third cut where the film switches looks on downbeats, as if someone were tapping through the live page. A mouse pointer clicks in the 16:9 cut and a fingertip taps in the 9:16 cut. Each switch shows a ripple in the new look's colour.

This section is a sketch: the build does not do it for you.

1. Write `beat-looks.json`. Take downbeats from `song/beats.json` and snap them to the 30 fps frame grid:
   ```json
   { "switches": [ { "t": 8.533, "look": 1, "wide": { "x": 0.52, "y": 0.41 }, "vert": { "x": 0.47, "y": 0.33 } } ] }
   ```
   `t` is in song seconds. `look` is an index into the `looks` array of `looks.json` (0 is the original). `x` and `y` are the click point as fractions of the frame, one pair per frame.
2. Pick the switches:
   - Start after the intro (about 8 s in). Reason: the opening establishes the film's own look.
   - Space them and return to the original look before the credits as [code-film.md](code-film.md), section 5 says.
   - Cycle the looks in the page's order. Reason: the cut then previews what a tap on the page does.
3. Pick each click point where the frame is calmest, near the middle and away from lyrics and faces. From a first render, take grey frames around the switch. For each candidate point, sum the absolute differences between neighbouring pixels in a box around it. Lower is calmer. Reason: a click on a face or a lyric hides the thing the viewer is reading.
4. Derive everything from the time. One tween on the root timeline calls `render(T)` on every seek, and `render` works out the look, the ripple and the pointer from `T` alone:

```js
// in the built index.html, after the scenes; switches: [{ t, look, x, y }] for this frame, sorted by t (song seconds)
function installBeatLooks(tl, dur, offset, switches, looks) {
  const sheet = document.head.appendChild(document.createElement('style'));
  let shown = -1;
  const lookAt = T => { let i = -1; while (i + 1 < switches.length && switches[i + 1].t <= T + 0.002) i++; return i < 0 ? 0 : switches[i].look; };
  function render(T) {
    const L = lookAt(T);
    if (L !== shown) {
      const k = looks[L].k;
      sheet.textContent = k ? '[data-composition-id],[data-composition-id] *{' + Object.entries(k).map(([n, v]) => `--k-${n}:${v}!important`).join(';') + '}' : '';
      reinkArt(looks[L].inks);
      shown = L;
    }
    drawClick(T); // the pointer or fingertip and the ripple, also a pure function of T
  }
  const ctl = { v: 0, t(v) { if (!arguments.length) return this.v; this.v = v; render(v + offset); } };
  tl.fromTo(ctl, { t: 0 }, { t: dur, duration: dur, ease: 'none', lazy: false, immediateRender: true }, 0);
}
```

- `switches` is `beat-looks.json` mapped for the frame: `switches.map(s => ({ t: s.t, look: s.look, ...s[frame] }))`. `looks` is the `looks` array of `looks.json`.
- `offset` is the window start in a `--window` build, so looks match across chunk boundaries.
- Wire it into `build.mjs` behind a `--beat-looks` option: inline the function, then build the main timeline as `const tl = gsap.timeline({ paused: true }); installBeatLooks(tl, dur, winStart, switches, looks); window.__timelines["main"] = tl;`.
- `drawClick(T)` finds the last switch `s` at or before `T` and the time since it, `d = T - s.t`. While `d` is under 0.7 s it shows a ripple at `(s.x * W, s.y * H)`. The ripple is a disc and a ring in the new look's accent, scaling up with an ease-out while their opacity falls to 0.
- The pointer (16:9) glides to the next click point and presses on the beat. The fingertip (9:16) comes in from the lower right, presses and lifts away. Hide both when no click is near.
- `drawClick` owns one layer in the main composition, above the scenes, and sets only `transform` and `opacity` there.
- Load every look's fonts before the first frame (`document.fonts.forEach(f => f.load())`). Register them under new family names (for example `'Look Archivo'`) and point the tokens at those. Reason: a new weight of a family the film already uses changes the original look too.

## 6. Render

Render the picture in chunks cut at scene boundaries, join them, and lay the whole song under the result.

1. Choose chunk bounds: split the song into N equal parts and move each bound to the nearest scene start. The build puts every scene start on the 30 fps frame grid, so each chunk is a whole number of frames. Reason: whole-frame chunks never drift against the song.
2. Build and render each chunk without audio:
   ```sh
   mkdir -p renders/chunks
   node build.mjs --frame wide --mute --window 0,31.2 --out out/chunks/wide-0
   npx hyperframes render out/chunks/wide-0 --output renders/chunks/wide-0.mp4 --fps 30 --quality delivery --workers 2
   ```
3. Run a few chunks at once. If a chunk fails, render only that chunk again. Under heavy load raise `--browser-timeout` (seconds) and `--player-ready-timeout` (milliseconds).
4. Join and add the song:
   ```sh
   printf "file 'wide-0.mp4'\nfile 'wide-1.mp4'\n" > renders/chunks/wide.txt    # every chunk, in order
   ffmpeg -v error -y -f concat -safe 0 -i renders/chunks/wide.txt -an -c:v copy renders/wide-picture.mp4
   ffmpeg -v error -y -i renders/wide-picture.mp4 -i song/song.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart renders/wide.mp4
   ```
5. Do the same with `--frame vert` for `renders/vert.mp4`.

Every ffmpeg command that writes a file has `-y`. Reason: without it, a re-run in a non-interactive shell prints "Not overwriting" and exits 0, so the old file silently stays.

Check both: `ffprobe -v error -show_entries format=duration -of csv=p=0 renders/wide.mp4` matches the song length within a frame. Then watch both films through once with sound. If the picture runs past the song (an end roll), mix as [code-film.md](code-film.md), section 7 says. The copies for each platform are made in [release.md](release.md), section 3.

## Rules

- Compose the vertical, never crop the horizontal. Reason: a cropped 16:9 frame loses the lyric or the face.
- Keep type and UI inside the margins and the platform zones, and let only art bleed. Reason: a cut-off card reads as a mistake on a phone, and the user reads type near an edge as "cropped in".
- Check readability in every look with the same injected rule the page uses. Reason: a test that silently matches nothing passes every look.
- Render picture only, then add the song once. Reason: audio cut at chunk boundaries clicks and drifts.
- Derive every beat-look change from time, never from what happened before. Reason: the renderer seeks out of order.

## Done when

- [ ] Every scene has a native `compositions/vert/` file, and nothing in it is letterboxed or cropped from 16:9.
- [ ] `edge-check.mjs out/vert` reports 0 elements and 0 font problems, and the SVG-drawn UI looks right in the snapshots.
- [ ] `check` passes, contrast included, in the original look and every restyle look, in both frames.
- [ ] Both renders match the song length within a frame and play through with sound.
- [ ] Every second of the tall film passed the zone check.

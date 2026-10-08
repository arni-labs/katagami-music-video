# The code film (mode A)

Read this when the user picked the code film, once the plan is approved and before the boards
([planning.md](planning.md)): the board is made of built scenes, so the engine and the reference scene come first. It is
the route overview; the detail lives in the files it links.

Every frame is drawn in code (HTML, CSS, SVG, canvas, WebGL) from the timing data. Image models only make reference
pictures, which become traced or painted plates; no generated pixel is ever on screen. The film is made twice, at 16:9
and as a native 9:16 film. Options: a cut that switches looks on the beat, and a page where viewers restyle the film.

## 1. Pick the engine

Two engines have each made a finished film. Pick one per film.

| | HyperFrames scene files | A canvas engine |
| --- | --- | --- |
| Suits | type- and UI-led films with flat traced vector plates | films with WebGL, painted or procedural plates, pixel art, many design-language switches, or a film that must also run as an app |
| A scene is | an HTML sub-composition with a GSAP timeline | a JavaScript module that draws a frame for a song time |
| Looks | `--k-*` CSS tokens, swapped by one injected rule | a language object (faces, case, tracking, components) plus a GPU re-ink of the plates |
| Render | `npx hyperframes render` in chunks | headless Chromium drawing frames, piped to ffmpeg, in chunks |
| Live page | live HyperFrames windows over the video | the one playing video re-inked with WebGL |
| Read | [scenes-and-styles.md](scenes-and-styles.md), [vertical.md](vertical.md) | [canvas-engine.md](canvas-engine.md), [vertical.md](vertical.md) sections 1 to 3 |

Both share everything else in this file, the 9:16 rules in [vertical.md](vertical.md), the checks in [qa.md](qa.md) and
the page in [live-restyle-page.md](live-restyle-page.md).

HyperFrames set-up, in the project: `npm i -D hyperframes` (it pins one version for every `npx` call) and
`cp "$SKILL_DIR/scripts/build.mjs" .`. This skill owns the workflow; HyperFrames' own skills are for composition
details. You do not need `hyperframes init`, and never run `init --audio`. Reason: it times the song with a phrase
transcriber ([SKILL.md](../SKILL.md), rule 2).

Folders: `scenes.json`, `looks.json`, `refs/` (generated references, never shipped), `art/` (plates), `assets/` (fonts),
the scenes (`compositions/wide/` and `compositions/vert/` for HyperFrames, `scenes/` for a canvas engine), `out/`
(builds), `renders/` (films) and `site/` (the optional page).

## 2. Steps

1. **One reference scene,** end to end, in both shapes, in its look, with its type and motion. Reason: every later scene
   copies its mistakes too.
2. **The scenes,** one owner per section when several agents build ([production.md](production.md)). Each scene passes
   its checks alone before the whole film is reviewed ([qa.md](qa.md)).
3. **Look switches,** if the film has them (section 5).
4. **The 9:16 film,** composed for the tall frame ([vertical.md](vertical.md)).
5. **Render and mix** (section 7), then the review pass on the whole render ([qa.md](qa.md)).
6. **The page,** optional ([live-restyle-page.md](live-restyle-page.md)).
7. **The release** ([release.md](release.md)).

## 3. Pictures

- **Generated images are references only.** Trace them into flat vector plates ([scenes-and-styles.md](scenes-and-styles.md),
  sections 4 and 5) or paint them as fitted brush strokes ([canvas-engine.md](canvas-engine.md), section 5). Reason:
  plates re-ink into any look.
- **Every picture appears through its making:** drawn, painted, assembled or printed on screen, never a hard cut to a
  finished picture. Faces are sharp at rest. Reason: the user asked to see every picture being made.
- **Pixel art is laid out pixel by pixel in code,** in a small palette. Reason: pixel art traced from a generated image
  came out imprecise, cut off heads, and was rejected as "trying to trace an image in a different art style".
- **Calligraphy uses a bristle-brush model on real stroke paths,** with the brush on screen. Reason: a font, and then even
  strokes, were rejected twice as "still the same"; the brush model was approved.
- **No frame inside the frame.** No white card, panel, mat or box holding the picture or the words inside a shot that
  has its own ground, and no full-width band sliced off the frame to hold type. A sign or screen is an object in the
  world, and when it is the subject it fills the shot. Reason: the user: "Don't waste space like that."
- **The picture says what the line says,** colour included. Reason: a line about "warm paper" was shown in cold blue
  hues and sent back.
- **Counts and units go in the mono face.** Reason: "1x" set in a display face that prints capitals read as the Roman
  numeral IX.
- **Improve the opening's craft, not its speed.** Reason: asked for a more hooking intro, the user still preferred the
  existing elegant opening to three fast montages.

## 4. Cuts, hits and held words

- The cuts come from the timing data. The HyperFrames build starts a scene one frame before its first sung word. The
  canvas engine on a past film placed each cut on the last beat in the window from 0.3 s after the previous line's last
  word starts to one frame before the next line's first word (else the last eighth, else that frame), or on a section
  start.
- Move only cuts that break the rule you chose. Reason: a blanket rule change moved 23 cuts and churned every owner.
- Hits (a punch, a flash, a stamp) land on the beat, the eighth or a word's onset ([timing.md](timing.md), section 6).
- Under a held word ([timing.md](timing.md), section 7) the word stays on screen and the picture keeps building until the
  word's true end, across a cut if one falls inside it. Reason: a past film cut away at a downbeat inside a four-second
  hold; the word vanished while it was still sung, and the user called the still picture under the held note
  "dissonance". The fix carried the word across the cut, pushed in and grew it toward the end of the note, and landed it
  on the hit where the note ended.

## 5. Look switches

- **A switch changes the design language:** faces, case, tracking, components and colours, not colours alone. Reason:
  the first switching cut only moved hues, and the user said "It just switches the hues. That's wrong."
- Schedule switches on named musical events ([timing.md](timing.md), section 7), spaced as [timing.md](timing.md),
  section 6 says.
- Use looks the user has liked. Return to the film's own look before the credits. Reason: the credits must read in the
  look they were designed in.
- The HyperFrames sketch of a beat-looks cut is in [vertical.md](vertical.md), section 5; the canvas engine's language
  API is in [canvas-engine.md](canvas-engine.md), section 4.

## 6. Credits

- The end roll and the page name every Katagami entry and katagami.ai ([SKILL.md](../SKILL.md), rule 11).
- A credit chip in the frame is optional. On one film it was the live page's tap target; another film's brief ruled
  out credit chips on the film, and its credits went to the end roll and the page's credits sheet.

## 7. Render and mix

- Render the picture without audio, in chunks cut at scene boundaries, from a frozen copy of the project
  ([production.md](production.md), section 2). Join the chunks and lay the whole song under the result once. Reason:
  audio cut at chunk boundaries clicks and drifts.
- When the picture runs past the song (an end roll), pad the audio with silence (`-af apad`) and cut at the picture's
  length (`-t`). Reason: `-shortest` ends the file with the song and drops the end roll.
- The steps: [vertical.md](vertical.md), section 6 (HyperFrames commands) or [canvas-engine.md](canvas-engine.md),
  section 7.

## Done when

- [ ] Both films pass [qa.md](qa.md), including the review pass on the whole render.
- [ ] Every look on screen is a Katagami entry, credited in the end roll with katagami.ai.
- [ ] Each film's duration matches the song (plus any end roll) within a frame, and plays through with sound.

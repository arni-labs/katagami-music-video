# The canvas engine (code film)

Read this when the code film uses a canvas engine instead of HyperFrames scene files ([code-film.md](code-film.md),
section 1). No engine ships with this skill: write one to this contract. It covers the contract, the rules that keep
frames identical across parallel chunks, looks, plates, the QA instruments and the render.

## 1. The contract

The film is a pure function of song time: `draw(g, T)` paints the frame at `T` (seconds into the song), the same frame
every time, whatever was drawn before.

- **Scenes are modules:** `{ prepare(o), draw(g, s), credit }`. `prepare` loads and builds plates once; `draw` paints
  one frame. One module draws both shapes and reads `s.tall` to lay out the 9:16 frame.
- **The engine lays the scenes out** from `song/timing.json` and `song/beats.json` ([code-film.md](code-film.md),
  section 4), with `start` in `scenes.json` to pin a cut.
- **The state a scene gets:** `t` (seconds into the scene), `d` (its length), `T` (song time), its lines with word times
  in scene time, the beats, a pulse on the beat, a seeded random stream, `W`, `H` and `tall`, the current design
  language, and helpers to mark key elements for the QA checks (section 6).
- **Each scene's random stream is seeded by its place in a fixed list,** and a scene added later goes at the end of the
  list. Reason: then no other scene's random stream moves, and no approved picture changes.
- The same code plays live in a browser and renders to MP4 (section 7).

## 2. Frames identical in any order

Chunks render in parallel and start mid-scene, so a frame must not depend on the frames drawn before it.

- **Clear the frame before every scene draw.** Reason: a shaken or shrunken scene showed the previous frame at its
  edges, and that differed between chunks.
- **No module state that only some frames set.** Set such state at the top of every draw. Reason: a page kit kept its
  inset in a module variable set by the camera; a frame whose branch skipped the camera took the value left by whatever
  frame came before, so a chunk starting mid-scene drew differently from a straight render.
- Seeded random only; no clocks, no timers.
- **Hold the last frame until a scene is prepared.** Reason: after a seek, the engine drew a scene whose plates were
  not ready and showed the debug placeholder.
- Test it: draw one frame fresh, then the same frame after drawing earlier ones, and compare the pixels.

## 3. One broken scene must not stop the film

- Import each scene module on its own, with a catch that draws a placeholder card for that scene only. Reason: one
  builder's syntax error broke every render while the modules were imported together.
- Gate every full render on all modules importing cleanly. Reason: an owner pruned a helper before another owner's
  import changed, and a dozen scenes rendered as placeholder cards in a full render.

## 4. Looks

- **A looks registry:** each design language's tokens, faces and components copied from its `DESIGN.md`, with its
  katagami.ai url. Scenes ask the registry; they never hardcode a colour or a face.
- **A language API:** `word`, `rule`, `label`, `tag`, `mark` and the like, drawn in the current language's faces, case
  and tracking. A switch swaps the whole language ([code-film.md](code-film.md), section 5). Text measured or cached in
  `prepare` is keyed on the language, because widths change with the faces.
- **Plates re-ink on the GPU:** a palette pass maps each plate to the current language's colours, with a print effect
  on the switch.
- An accent next to dark artwork: the re-ink pass pales an accent pixel whose surroundings are mostly dark (the rule
  that keeps a red word on black readable), so an accent shape touching a dark picture got pale bars along its inner
  edge. Leave a paper gap of about 0.9% of the frame's width between an accent and dark art.

## 5. Plates

- **Traced vector plates:** the tracer in [scenes-and-styles.md](scenes-and-styles.md), section 5, works here too.
- **Painted plates:** fit brush strokes to the reference image (about 10 s a plate, 16,000 to 47,000 strokes) and draw
  them on the GPU. Paint at rest; carved facets only while a picture builds, shatters or flips. Reason: facet plates at
  rest were rejected as "crinkly" and "trianglish".
- **Cut-outs on a white ground:** knock the background out by eroding the light mask a few pixels, flooding from the
  frame's edge, then growing the flood back over light pixels only, so a thin dark outline stops it. Reason: a plain
  flood made cel figures see-through where a light shirt touched the white ground.
- **Motion references:** a cheap image-to-video model (about $0.55 for a 5 s 480p clip) gives a move to rotoscope.
  Carve a keyframe, then keep the corners where nothing moves and carve again only where the optical flow moves. Reason:
  a fixed mesh riding the flow tore into shards on fast moves, and re-carving everything boiled. Skip a clip's first
  second if its camera drifts there, and expect refusals for realistic faces.
- **Cache expensive shading per plate,** not per frame. Reason: re-shading one plate cost about 1 s a frame in software
  WebGL.

## 6. QA instruments

- **Record the canvas's text calls** each frame (the text, its size and box). From them flag text under 40 px,
  overlapping text, and text near an edge. Scenes mark their key elements (a card, a face) with a helper so the edge
  check sees non-text too, and mark a deliberate move past the edge (a swoop, a lens crashing in) so the check lists it
  as meant.
- **A shooter,** a small script you write next to the engine, renders stills at given song times, in either shape, with
  the QA overlay on or off. A past film's took `--stills 12.5,13.0 --only s07 --frame tall --qa --app <dir> --out <dir>`. Review stills as contact
  sheets at phone size, and crop at full size before any claim about size or position ([qa.md](qa.md)).
- **Stress the timing before the song exists:** lay the plan out again at a slower and a faster tempo (for example 98
  and 146 BPM against a planned 122) and shoot four stills a scene. Reason: the real take changes every line's length;
  on a past film this tried every scene at 0.7 to 1.7 times its planned length before the take arrived.
- **A new lyric line before its timing exists:** make a copy of the app that is symlinks to everything but the data
  folder, squeeze the new line into the old line's span there, and shoot it with `--app`.
- **Read lines by what they are,** not by fixed word indices: find a word by its text, a shout by its bracket. Reason:
  a re-sung take changed word counts, and scenes that read the line this way survived it.

## 7. Render

- Headless Chromium draws each frame and pipes JPEGs to ffmpeg (x264). For WebGL use the new headless mode (Playwright
  `channel: 'chromium'`), not the default headless shell. Reason: the headless shell composites WebGL in software, with
  a GPU readback every frame; the same page ran at 60 to 120 fps in the new headless mode.
- Cut chunks of about 15 s at scene cuts, one browser each, four or five at a time ([production.md](production.md),
  section 4). Keep a frame under about 150 ms to draw.
- Render from a frozen copy of the app. To change one scene, delete only the chunks it touches and render them again;
  prove the kept chunks with a pixel diff ([production.md](production.md), section 2).
- Join the chunks, then mix ([code-film.md](code-film.md), section 7).
- Stopping ffmpeg with SIGTERM still writes the file's trailer: delete a cancelled output only after the process exits.

## 8. The film as an app

The same engine can play live in a page, with the song's `<audio>` as the clock.

- Serve the song with HTTP Range support, in tests too ([live-restyle-page.md](live-restyle-page.md)).
- Keep player controls off the credits and other tap targets, and let a faded control bar ignore pointer events.
  Reason: the control bar covered the credit that restyles the film, so a tap on the credit seeked instead.
- For a heavy film on phones, the page should play one video and re-ink it, not run the engine
  ([live-restyle-page.md](live-restyle-page.md)).

## Done when

- [ ] One frame drawn fresh equals the same frame drawn after earlier frames, for a sample of scenes.
- [ ] Every module imports cleanly, and the full-render gate passed.
- [ ] The QA overlay lists nothing unexplained in either shape, and the stress test held every scene.
- [ ] Every chunk came from a frozen copy, and the joined film's frame count matches its duration.

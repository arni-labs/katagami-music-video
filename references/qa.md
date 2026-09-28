# QA checklists

Read this at the end of every stage. Each list must pass before the next stage starts. Reason: a problem found one stage later usually costs a re-render.

When feedback is vague ("it looks cut off", "it feels late"), turn it into a measured check first, then fix until the same check passes. Reason: a check lists every case, and the same instrument proves the fix.

Run every command from the video project, where `npm i -D hyperframes` pinned one HyperFrames version. `$SKILL_DIR` is this skill's folder.

| Stage (SKILL.md) | Lists |
| --- | --- |
| 1. The song | Stage 1 |
| 2. Timing | Stage 2 |
| 3. Scenes and looks | Stage 3 |
| 4. Build the scenes | Stage 4: each scene, Stage 4: the whole film |
| 5. Vertical, looks and render | Stage 5: vertical and looks, Stage 5: renders, Before posting |
| 6. The live page | Stage 6 |

## Stage 1: the song

- [ ] `song/song.wav` is the approved take: 48 kHz WAV, full length, no clipping at the start or end.
- [ ] You listened once with `lyrics.json` open, and every caption matches what is sung (repeats, ad-libs, changed words).
- [ ] Every non-English line has `lang` and an `en` translation, and a native speaker or current native sources checked it.
- [ ] `sung` spellings exist where numbers, acronyms or respellings differ from the caption.

## Stage 2: timing

- [ ] `song/timing.json` came from the aligner, with no `"provisional"` key.
- [ ] `song/vocals.wav` has the mix's duration, and `offset.py` prints a 0.0 ms offset.
- [ ] Every line in `song/timing.json` has `t`, `end` and `words`, and no line overlaps the next.
- [ ] Every CHECK row that `align-to-timing.mjs` printed was reviewed, and each fix has a reason in `song/timing-fixes.json`.
- [ ] Five line starts that follow a pause sit on the voice, checked by ear. None starts early.
- [ ] `song/beats.json` exists, and a chorus starts on a downbeat.

## Stage 3: scenes and looks

- [ ] Every lyric line is in exactly one scene, and every scene has a one-sentence idea.
- [ ] The film uses two or three modes, and each scene names its mode.
- [ ] Each scene's Katagami entries are recorded, and the user saw the thumbnails and katagami.ai links.
- [ ] Every mode and every restyle look in `looks.json` lists all 19 tokens, its fonts and an ink ramp. The original look has `"k": null`.

## Stage 4: each scene

`check` runs on a built project, so build the scene alone (an `--only` build) and check that:

```sh
node build.mjs --frame wide --only s07,s08 --out out/check-s07
npx hyperframes check out/check-s07 --snapshots
npx hyperframes snapshot out/check-s07 --at 0.1,1.2,2.8,4.5
node "$SKILL_DIR/scripts/edge-check.mjs" out/check-s07 --margin 0     # the font report; margin 0 skips the tight rule
for lk in <restyle look ids from looks.json>; do                      # every look except original
  node build.mjs --frame wide --only s07 --look $lk --out out/check-s07-$lk && npx hyperframes check out/check-s07-$lk && npx hyperframes snapshot out/check-s07-$lk --at 1.2
done
```

- [ ] `check` reports 0 errors, and its layout and contrast audits really ran (see [Check quirks](#check-quirks)). A lint error switches both off: `check` then prints "0 sample(s)" and "0/0 text checks", which means nothing was measured. Fix lint first.
- [ ] Fonts: the edge check's font report is clean (no family without `@font-face`, no font file that failed to load), and a snapshot shows the display face, not a fallback.
- [ ] The first frame (0.1 s) is already designed, never blank.
- [ ] Each line's words appear on their sung times, and the line is readable within about 0.4 s.
- [ ] Nothing is clipped or overlapping; no text runs outside its box.
- [ ] In every restyle look, the scene passes `check` and one key moment's snapshot shows every text inside its box and the frame. Reason: wider faces push text out, and `check` does not see text inside a layer marked `data-layout-allow-overflow`.
- [ ] Every shot moves; no still hold longer than about 1.2 s.
- [ ] Traced art matches its reference: faces intact, no plate edges showing during pushes and pans.
- [ ] Non-English lines show the native script and the translation together.
- [ ] The Katagami credit (the scene's `.k-credit` element) is on screen and names the right entries.
- [ ] The grep gate prints nothing:

```sh
grep -nE "<img|data:image|url\\(['\"]?[^#'\")]|Math\\.random|Date\\.now|new Date|performance\\.now|setTimeout|setInterval|tl\\.call|repeat: ?-1|@keyframes|visibility: ?visible" compositions/*/s*.html
```

- [ ] Every hex colour outside the `#root` token block is justified (each one will not restyle).

## Stage 4: the whole film

- [ ] A full build plays scene to scene with no scene painting over another. Compare one scene alone with the same moment in the full build: a grey veil or a darker white means a blend-mode or filter layer is leaking.
- [ ] Contact sheet: two frames per scene across the whole film, read at phone size.
- [ ] Captions never lead the voice. Scrub five cuts after pauses with sound.

## Stage 5: vertical and looks

- [ ] Every scene has a native 9:16 file; nothing is letterboxed or cropped from 16:9.
- [ ] Lyrics sit above y 1680, key text stays out of the right 120 px, and no empty band is taller than about 100 px.
- [ ] `node "$SKILL_DIR/scripts/edge-check.mjs" out/vert` reports 0 elements and 0 font problems.
- [ ] SVG-drawn UI near the bottom edge looks complete in the snapshots (the edge check skips SVG).
- [ ] For every restyle look: a `--look` build passes `check` (contrast included) in both frames, and its snapshots show no text lost against its ground.

## Stage 5: renders

- [ ] Every chunk rendered; failed chunks were rendered again, not the whole film.
- [ ] `ffprobe` duration of each film matches the song within one frame.
- [ ] Watched both films end to end with sound: sync holds at the end as well as the start.
- [ ] The encoded copies play on a phone, and the phone copy's size fits where it will be posted.

## Before posting

- [ ] Captions spelled exactly as `text` in `lyrics.json`, including names and native scripts.
- [ ] The Katagami credits and any music credit are correct.
- [ ] You have the rights to the song and to any likeness in it: no real person's face, no real logos.

## Stage 6: the live page (optional)

- [ ] It plays the MP4 with sound by default, on desktop and on a phone.
- [ ] A tap answers within one frame (chip, name, ripple), and a 10-tap burst ends on the last look tapped within about 350 ms.
- [ ] Live windows switch at scene cuts with no flash; back to original shows the MP4.
- [ ] Text is readable in every look, on the page chrome as well as in the film.
- [ ] A slow phone steps down to flat inks, then to the MP4, without breaking playback.
- [ ] `prefers-reduced-motion` turns off the ripple and wipes.

## Check quirks

How `npx hyperframes check` behaves (seen with HyperFrames 0.8.80), and what to do:

- It reads `data-layout-allow-overlap` only from the text element itself, never from a parent group. Put it on each text element that overlaps on purpose.
- Text hidden by an SVG `clip-path` still counts as overlapping. Give it `data-layout-allow-overlap` too.
- The occlusion probes cover a rotated element's bounding box, so a rotated stamp's corners land on the card below it. Give the stamp `data-layout-allow-occlusion`.
- `rotation_pivot_drift` includes the camera's pan: a dial inside a panning layer reports drift. Check the pivot by eye and keep the warning.
- `data-layout-allow-overflow` on a camera layer also hides wrapped or off-frame text inside it. The restyle snapshots are what catch it.
- The contrast audit samples the rendered pixels inside each text box, overlays included: light scanlines over an accent bar can fail a light look. Paint texture overlays in `var(--k-paper)` with `mix-blend-mode: darken`. They dim a dark look and vanish on a light one.

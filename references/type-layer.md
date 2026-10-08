# The type layer (cinematic cut)

Read this when the cinematic cut's picture is edited ([cinematic-cut.md](cinematic-cut.md)). The layer sets every sung
word, a few explaining objects and the end roll over the generated picture, all in code.

## 1. How the layer works

- One function draws it: `drawOverlay(ctx, t, { W, H })` clears the canvas and draws the layer at song time `t`. The
  same `t` always draws the same frame.
- Everything comes from the timing data ([timing.md](timing.md)): sections, voices, words, holds. A window finds its
  line by how the line starts and its cues by the words; nothing is pinned to a second or a line id. Reason: the song
  was re-cut with new lyrics on the day the layer was built, and pinned ids and seconds would all have broken.
- **Measure the picture first,** at 5 fps on a coarse grid (for example 32 by 18 cells): where the faces, hands and
  subjects are, and how light each cell is. Cache the measurement. Reason: under load it took five minutes each time a
  layout rule changed.
- Capture the layer in headless Chromium frame by frame and lay it over the picture by frame index. Reason: ffmpeg's
  overlay filter dropped about ten frames at a shot join.
- Place things in an order-free way: if one object's place depends on another's, compute the other on demand, never
  from a memo filled by whichever frame was drawn first. Reason: capture workers draw interleaved frames, and a
  first-drawn memo made objects flicker between two places.
- Shots change on the picture's frame grid, so a line's place and a label change on the same frame as the picture, never
  a frame late.

## 2. The bar, as it moved on a past film

The user rejected, in order: huge lyrics; many kinds of graphic gag; hooks only; a subtitle strip; and then one
uniform moderate size, which "read as karaoke". What was approved:

- **Type designed for the moment comes first.** Where a line can live in the picture (a library card stamped and
  dated, a label on an object, a page in a window), set it there, in a design language that fits the moment.
- **Stickers are the fallback:** each sung word outside an object is a solid chip in one face, slapped on as it is sung,
  the chip's colour saying who sings (paper, ink, the one accent for the gang's answers). **No border** on a sticker,
  just a short soft shadow.
- **Sung words only.** Faint "words to come" read as clutter.
- **At most one line and one window on screen.** A window that holds the line is the only thing on the frame.
- **One grid, one motion:** every line and window sits in a slot of one grid inside fixed margins, and everything comes
  in and goes out the same way (about 0.2 s, a fade and a small rise).
- **The hook title is the only big type.** A punch word may be 1.3 times the line.
- **A chant is one word at a time in one place** for the whole chant, not a line that piles up.

## 3. Where a line goes

- **A sung line keeps one position from its first letter to its last, across cuts.** Choose the slot against every shot
  the line spans. Reason: a line that jumped at a cut while it was being sung read as broken ([SKILL.md](../SKILL.md),
  rule 5).
- **Never cover a face.** In the slot score a face cell weighs about 100 times a hand or a busy cell. Reason: with equal
  weights the chooser traded a face for two hands.
- **Avoid grounds that are half light, half dark.** Reason: a flat black sphere scored "quiet" and split a line half on
  black, half on white.
- Type over the picture is never smaller than 54 px at 1920 wide. Drop a gag row before covering a face.

## 4. Objects and repeated phrases

- A few explaining objects carry the jokes: application windows in Katagami design languages, labels planted on
  surfaces in the picture. Each keeps its own language inside its frame.
- **A label on a surface** follows it: find it in the shot's still by template matching near its expected place, then
  frame to frame near its last place. Reason: matching over the whole frame confused seven identical cards. Hide the
  label on frames where it is lost.
- **A repeated phrase gets one card design for the whole run,** with clear space between the phrase and its translation
  (about 46 px at 1080 tall). Reason: on a past film a run of translated posts first had a different design language
  each, and the user asked for one consistent card, with space between each phrase and its translation.
- No AI-product glyphs ([planning.md](planning.md), section 5). Reason: a round "send" button on a message window was
  taken out for it.

## 5. The end roll

- On black after the last hit (a few seconds of black added to the picture for it).
- It names the song's makers, the video model, every Katagami entry the film used, and katagami.ai
  ([SKILL.md](../SKILL.md), rule 11).
- Take every count in it from the final data ([release.md](release.md), section 6).

## Done when

- [ ] Every sung word appears on its sung time, and no line moves while it is sung.
- [ ] No frame has more than one line and one window, and no type covers a face.
- [ ] Repeated phrases share one card design with space before the translation.
- [ ] The end roll names katagami.ai and every entry, and its numbers match the final data.
- [ ] The layered film's frame count matches the picture's.

# The cinematic cut (mode B)

Read this when the user picked the cinematic cut, once the plan is approved and before the boards
([planning.md](planning.md)): the board is made of stills, so section 2 applies to it. The lyric layer is in
[type-layer.md](type-layer.md).

The picture is generated video: stills from an image model, animated by a video model, cut to the song's beat grid.
Everything written (lyrics, labels, credits) is drawn in code on a layer above it. The film is 16:9 only.

How it differs from the code film, on purpose:

- **Generated pixels are the picture.** In the code film they are references only. Text is still never the model's:
  ask for blank screens and signs, and draw the words in code.
- **Cuts follow the beat grid and the hits,** not the lyric lines. A median shot lasts two beats. The lyrics live in the
  type layer and run across cuts.
- **One shape.** No 9:16 film and no 9:16 crop. Reason: a crop of the 16:9 cut lost the outline of the film's key
  round object, and the user said to stick to horizontal for generated video. Vertical platforms get a 16:9 short
  ([release.md](release.md), section 1).

## Set up

- An image model and a video model on an API. The film these lessons come from used Grok Imagine (Image 2.0, Video 1.0
  and 1.5) through fal.
- A small runner for every paid call, with a ledger ([production.md](production.md), section 5).
- Python with ffmpeg for the edit, a face detector for the gates (Apple Vision on a Mac), and headless Chromium for
  the type layer.
- Folders: `TREATMENT.md` and `BAR.md`, `shots.json` (the shot table), `stills/`, `takes/`, `ledger.jsonl`, `edit/`
  (the picture), `overlay/` (the type layer) and `renders/`.

## 1. The shot table

Write the treatment's table per shot ([planning.md](planning.md), section 1): id, start, length, section, cast, story
beat, joke, and the empty type field. Take starts and lengths from the beat grid. Keep shot ids fixed when a new take
moves the bars; only their times change.

## 2. Stills

- Shots with the cast are image edits with the approved cast pictures as references; empty shots are text to image.
- **Name an empty type field in every prompt:** "the left third of the frame clean and empty". Reason: on a first cut,
  38 of 80 lines had no room for their words.
- **Review every still at the size viewers see it,** next to the film's best frames ([planning.md](planning.md),
  section 4).
- **Fix a still by editing it,** not by drawing it again. Reason: fresh replacements came out "super busy".
- **A recurring prop gets one reference picture,** ideally a crop of the user's favourite, passed as the second image in
  every call that shows it.
- **Fix a prop's scale by editing a still that already has it right.** Reason: re-prompting kept drawing a huge object
  the size of a ball.
- **Leave sentences about characters out of empty shots.** Reason: a style sentence about "sculpted characters" drew
  people in suits into empty rooms.
- Fill the art style's template as [planning.md](planning.md), section 3 says, without its gallery pictures.
- **Keep one picture language.** Reason: pixel-art inserts broke the cinematic look and were cut.

## 3. Clips

- Image to video at 720p, 2 to 6 s, two or three takes a shot. Close-ups go to the higher model at 1080p. Reason: in an
  A/B the cheaper model moved as well as the higher one, and the higher one held faces better up close.
- Pilot three clips in a new direction before a batch, and run every prompt through a gate before any spend.
- **The prompt order that worked:**
  1. the action already under way at frame 0;
  2. "the main action hits at about X s", then the reaction;
  3. a camera move tied to the hit;
  4. a look lock, then the canon (who is who, what they wear);
  5. the gesture rule, "no one else appears", no text.
  Never "slow", except on the music's stops.
- **Name what you want, never what you fear.** Reason: "no fists" drew fists; 16 retakes written only as positives gave
  14 clean first windows.
- **Some words draw the wrong thing.** Camera words ("drone", "crane", "dolly") drew a quadcopter and a jet; "melts" on
  anything red read as blood; "hands at their chests" drew hands on hearts. Put such words in the prompt gate's fail list.
- **When the canon changes, search every prompt builder** for the old sentence. Reason: an old sentence about hoods put
  black veils on characters who had been changed to bare heads.

## 4. Take gates

Every take passes these before it can reach the edit:

- **Extra people.** The video model adds people mid-clip and turns blank chrome heads into faces. Run a face detector at
  8 fps, count only skin-coloured boxes (the detector also fires on chrome), and cut before the first extra face.
- **Poses.** Arms rise mid-clip even when the still has them down (153 of 595 takes on a past film). A pose detector
  cannot see masked figures, so read six-frame strips of each window at 640 px by eye. Reason: those strips failed 53
  of 128 shots that the automatic gates had passed.
- **Faces must not morph.** Reject a take where a head turns to an egg or a face turns to glassy chrome or a visor.
- **Characters must not drift realistic.** On a push-in the cast went smooth and realistic up close in every take of one
  shot; it was clipped again with a still camera. Faces also drift smooth late in a clip, so use the first 1.2 s or so,
  or the higher model.
- **Check a longer window before you extend a shot.** Reason: a shot extended after its neighbour was dropped ran into
  an expression nobody had reviewed, and the user flagged it. Before the song is re-timed, record each reviewed window
  (the take and its in and out times) and keep it fixed.
- **A retake does not replace a take by itself:** the edit picks by motion score and can pick the old one. Reject old
  takes by name, and make the edit plan refuse them.

## 5. The edit

Python and ffmpeg, from the beat grid ([timing.md](timing.md), section 6):

- Cut on the beat grid and on kicks. Use each clip's strongest 0.5 to 1.5 s, starting no earlier than 0.25 s. Reason:
  the video model's first frames sit still.
- Land an impact two frames after the cut. Punch in 8% and settle over 0.3 s. Speed a weak shot up to 1.35 or 1.7 times.
- Cut a morph from its start to its end on a beat. Reason: the frames in between read as a shapeless lump.
- "On twos" (each frame held for two, 12 to 15 distinct frames a second) suits character shots: dance, action,
  close performances. Keep camera moves and wide shots smooth. Reason: a whip pan on twos read as 12 jump cuts.
- Open on the film's strongest pictures and cut on the hits. End when the meaning ends: black on the last hit.
- Render segments, join them, add the song, and assert the frame count. Lay the type layer on by frame index
  ([type-layer.md](type-layer.md), section 1).
- If the user prefers an earlier cut of a section, re-pin its takes and stills ([planning.md](planning.md), section 6).

## 6. Grade

- **A section's grade stays in the film's palette.** Reason: a plan with its own hue per section gave one section a
  blue-purple sky, another purple and orange, and the intro too much colour; the user asked why it wasn't uniform, and
  each was pulled back into the palette.
- **Cool and clean by default;** warm only where the scene is literally warm. Measure it: on a past film the mean
  CIELAB b* went from +3.6 to 0.0 when the default warmth came out.
- Blend halation in RGB (`format=gbrp`). Reason: on YUV it tinted the frame magenta. A vignette greyed a white world.

## 7. Upscale and lock

- Upscale only the windows the edit uses, each starting on the source's frame grid. Of four upscalers tried, only one
  (Topaz Precision) stayed faithful to the picture.
- Render a final to a draft name, decode-check it, then rename it into place, with a new name for each version. Read
  every pending message before you rename ([production.md](production.md), section 2).

## Numbers from one past film

Prices and limits change; check them before you plan a budget.

- **Video model:** the cheaper model about $0.07 per second at 720p (its maximum); the higher one $0.14 per second at
  720p and $0.25 at 1080p. Clips 1 to 15 s, no audio input, no end frame, no seed; clips come with sound (strip it)
  at 24 fps. Refused calls were not charged.
- **Images:** about $0.06 a text-to-image still; an edit about $0.06 plus $0.01 per reference picture.
- **Time per call (medians):** a 2 s clip 31 to 44 s; an image edit 19 s; text to image 103 s.
- **Throughput:** ten calls in parallel; the account's concurrency limit started at 2 and rose later.
- **The edit:** 222 shots in about 4 minutes of song; median shot 0.94 s (two beats at 128 BPM); every cut within 0.5 ms
  of the grid.

## Done when

- [ ] Every shot's take passed the gates, and its window was reviewed at the length it plays.
- [ ] The edit's frame count matches the song, and cuts sit on the grid.
- [ ] Every section's grade is in the film's palette.
- [ ] The type layer passes [type-layer.md](type-layer.md), and the film passes the review pass in [qa.md](qa.md).

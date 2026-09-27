---
name: katagami-music-video
description: Make a lyric music video for a song, or write the song first. Word-timed lyrics, one code-drawn scene per line in Katagami looks, rendered with HyperFrames at 16:9 and native 9:16, with an optional tap-to-restyle web page. Use when someone asks for a music or lyric video made from scratch. Not for editing filmed footage. Needs the Katagami MCP.
---

# Make a music video with Katagami

This skill turns a song into a lyric music video:

- The lyrics are timed to the word and always on screen, usually inside the picture (a chat bubble, a sign, a terminal line).
- There is one scene per lyric line or phrase. Each scene takes its look from the Katagami library: an art style for the pictures, a design language for type and on-screen UI.
- Every frame is drawn in code (HTML, CSS, SVG, canvas) and rendered with HyperFrames. Generated images are only references, traced into vectors.
- You get two films, composed separately: horizontal 16:9 (1920x1080) and native vertical 9:16 (1080x1920).
- Optional extras: a cut that switches looks on the beat, and a web page where viewers tap to restyle the film live.

It works for any song, subject and language. This file holds the workflow and the decisions. The depth is in `references/`, and the helper scripts are in `scripts/`.

## Install

```sh
git clone https://github.com/arni-labs/katagami-music-video ~/.claude/skills/katagami-music-video
claude mcp add --transport http katagami https://katagami.ai/mcp
```

The Katagami MCP only reads. Connecting asks you to sign in with Google once, which opens the full library. The `whoami` tool says which tier you have (sample or full). The workflow works with either; the full library gives more looks to choose from. Other agents and clients: see https://katagami.ai/connect.

This skill owns the music video workflow. HyperFrames' own skills (`npx hyperframes skills`) are optional. If they are installed, use them for composition details only (GSAP, the composition contract, lint rules), not their music-to-video workflow. Never run `hyperframes init --audio`. Reason: it transcribes the song with Whisper, which rule 2 forbids.

## Set up the project

`$SKILL_DIR` below means this skill's folder. Set it in every new shell, or write the literal path. Every command runs from the video project's root.

```sh
export SKILL_DIR="$HOME/.claude/skills/katagami-music-video"
mkdir -p my-video/song my-video/align && cd my-video && npm init -y
npm i -D hyperframes playwright       # pins HyperFrames: npx hyperframes now runs this version
npx playwright install chromium
python3 -m venv .venv && . .venv/bin/activate && pip install demucs librosa numpy pillow
cp "$SKILL_DIR/scripts/build.mjs" .
```

- Reason for the pin: the render must match the preview you checked, and the edge check loads the same runtime.
- Activate the venv (`. .venv/bin/activate`) in every new shell before a Python step. Reason: many systems refuse `pip install` into the system Python.
- You do not need `hyperframes init`: `build.mjs` writes the HyperFrames projects.

## What you need

| For | Tool |
| --- | --- |
| Scenes, preview, render | HyperFrames (`npx hyperframes`), Node 22 or newer, FFmpeg, Chrome |
| Looks | the Katagami MCP |
| Reference images | any image model that accepts reference images |
| Tracing images to vectors | potrace, Python 3 with Pillow and NumPy |
| Word timing | Demucs (vocal stem) and a forced aligner, for example ElevenLabs Forced Alignment, directly or through fal (needs your own ElevenLabs or fal API key) |
| Beats | librosa for beats and downbeats (`npx hyperframes beats` gives beats only) |
| A new song | a music model such as Suno (only when the user has no song yet) |
| Bottom-edge and font check | Playwright, installed above |

## Before you start

Ask these once, together:

1. Do you have the song (audio and lyrics), or only an idea?
2. What is it about, and who is it for?
3. Which languages are sung?
4. Which outputs: 16:9, 9:16, the beat-looks cut, the live page?
5. Any look in mind (a mood, a Katagami style name), or should you propose one?

## Project layout

```
song/song.wav            the final mix, 48 kHz WAV
song/vocals.wav          the isolated vocal stem
song/lyrics.json         lines: id, text (caption), sung (spelling for the singer and aligner), lang, en, map
song/timing.json         per line: t, end, words [{ w, t, end }] in song seconds
song/timing-fixes.json   hand corrections to the alignment, one reason each
song/beats.json          beats and downbeats
song/labels.txt          line labels for checking by ear in Audacity
song/NOTES.md            the take, the style prompt and the exact lyrics sent
align/                   aligner inputs and results (clips, text, sections.json, *.json)
scenes.json              per scene: id, lines, idea, mode, art style, design language
looks.json               the tokens and inks of every look (the original and each restyle)
refs/                    generated reference images (never shipped)
art/                     traced vector art (art/<name>.js) and the art helper (art/art.js)
assets/fonts.css         @font-face rules; assets/fonts/ holds the .woff2 files
compositions/wide/       sNN.html, 1920x1080 scenes
compositions/vert/       sNN.html, 1080x1920 scenes
build.mjs                writes out/wide/ and out/vert/ (HyperFrames projects)
renders/                 chunks, films and encoded copies
site/                    the optional live page
```

## The workflow

### 1. The song: `references/lyrics.md`

- The user has a song: convert it to 48 kHz WAV and write `song/lyrics.json` from what is actually sung.
- The user has an idea: write the lyrics, get approval, then generate takes with a music model and let the user pick.
- Keep two spellings per line: `text` for the screen and `sung` for the music model and the aligner.

Done when `song/song.wav` and `song/lyrics.json` exist and the user approved the take.

### 2. Timing: `references/timing.md`

- Split out the vocal stem (Demucs).
- Force-align the known lyrics on the stem.
- Turn the result into `song/timing.json` with `node "$SKILL_DIR/scripts/align-to-timing.mjs"`, and review the lines it flags.
- Write `song/beats.json`.

Done when every line has word times, and five line starts after pauses sit on the voice, checked by ear.

### 3. Scenes and looks: `references/scenes-and-styles.md`

1. Split the lyrics into scenes: one line or couplet each, usually 2 to 6 s. Write one sentence per scene: what we see, and the one idea it carries.
2. Pick a small system of modes for the whole film, for example black-and-white manga for most lines and loud colour for three punchlines. Switch treatment every line, but only inside those modes. Reason: a new look every line with no system reads as noise.
3. Find the looks with the Katagami MCP:
   - `compose_kit` for the film's base look (a language, a palette and an art style that belong together).
   - `ask_library` per scene or section, from a one-sentence brief.
   - `search_library` when the user names a style, tag or medium.
   - `get_library_entry` for an art style's prompt template and reference images.
   - `get_design_tokens` for a design language's colours, fonts, radii and shadows.
4. Show the user the plan: one row per scene with the lyric, the idea, and the katagami.ai links. Get approval before you generate images.

Done when `scenes.json` and `looks.json` are written and approved.

### 4. Build the scenes: `references/scenes-and-styles.md`

1. Use the copied `build.mjs`. Its contract (inputs, outputs, flags, scene starts, art and fonts) is in section 6 of the reference.
2. Generate reference images with the art style's own prompt template. Fill its slots, do not paraphrase it, and never let the model draw text.
3. Trace each image into flat vector tone plates (`art/<name>.js`).
4. Write one scene completely and check it: the reference scene. Then write the rest (parallel agents are fine) from one brief file that points at it.
5. Every scene reads its times from the timing data, routes every colour and font through `--k-*` tokens, and is deterministic.

Done when each scene's `--only` build passes `npx hyperframes check` and you have looked at its snapshots.

### 5. Vertical, looks and render: `references/vertical.md`

1. Compose each scene again at 1080x1920. Do not crop or letterbox the 16:9 file.
2. Keep lyrics above y 1680 and every UI element at least 48 px above the bottom edge. Only art may bleed off the frame. Check it with `node "$SKILL_DIR/scripts/edge-check.mjs" out/vert`, which also reports fonts that never loaded.
3. Test every look with a `--look` build: `check` and snapshots. Text must stay readable in all of them.
4. Optional: the beat-looks cut, where the film switches looks on downbeats with a visible click (16:9) or tap (9:16).
5. Render in chunks cut at scene boundaries, join them, and lay the song under the picture. Then encode the copies.

Done when both films pass their lists in `references/qa.md` and you have watched both through once with sound.

### 6. Optional: the live restyle page: `references/live-restyle-page.md`

The page plays the MP4 by default. A tap switches to the next look and lays live HyperFrames windows over the video, redrawn in that look. It coalesces taps: cheap feedback on every tap, and the heavy restyle once, after the burst.

### QA at every stage: `references/qa.md`

One checklist per stage, with the commands. Run it before you move on, not at the end.

## Rules

These come from making a full-length video this way.

1. Align lyrics against the isolated vocal stem, never the mix. Reason: drums and pads smear word onsets.
2. Never time lines with a phrase transcriber. Reason: after a pause it starts the line where the previous word ended, 0.2 to 1.5 s early.
3. Never hardcode a lyric time in a scene. Reason: a re-record or re-align then needs only a rebuild.
4. Never show a word before it is sung. The scene cut itself may come one frame early. Reason: captions that lead the voice look out of sync.
5. Generated images are references only. Trace them, and never ship a raster (`<img>`, `data:image`, `url()` to an image). Reason: vector plates can be re-inked into any look, and a bitmap cannot.
6. Never use text drawn by an image model. Ask for a blank screen or sign and draw the text in code. Reason: model text is garbled and cannot be restyled or translated.
7. Route every colour, font, radius and shadow through `--k-*` tokens. Reason: one token swap restyles the whole film, and a hardcoded value stays behind in the old look.
8. Never tween a colour with GSAP. Switch a class or crossfade two layers. Reason: the tween writes a fixed colour inline, which ignores later token swaps.
9. Put text on paper in `--k-ink`, on panels in `--k-on-surface` and on accents in `--k-on-accent`. Never assume the paper is light. Reason: in another look the paper can be black, and text in the wrong role vanishes.
10. Switch shots with `opacity` or `display`, never `visibility: visible`. Reason: an explicit `visible` overrides the runtime hiding the scene, so that shot paints over every other scene.
11. Keep blend-mode textures inside each scene, never in a separate overlay composition. Reason: a separate host cannot blend with the scenes under it and composites as a grey veil over the whole film.
12. Drive JavaScript side effects from a getter/setter tween, not `tl.call`. Reason: the renderer seeks with events suppressed, so a call can be skipped, while a setter runs on every seek.
13. Make every scene deterministic: a seeded random, no clocks, finite repeats, no CSS animations. Reason: frames render out of order and in parallel chunks.
14. Self-host every font and load every face before the first frame. Reason: a missing face renders in a fallback without any error.
15. Compose the vertical for vertical, and fill the frame by placing things, not by cropping them. Reason: a card running off the bottom edge reads as a mistake on a phone.

## Credit

Made while making Clanker, I'm Fine by arni × Claude Opus 5.5 × Suno.
Watch it and tap to restyle it: https://arnilabs.ai/clanker-im-fine/

---
name: katagami-music-video
description: Make a lyric music video for a song, or write the song first. Word-timed lyrics, one code-drawn scene per line in Katagami looks, rendered with HyperFrames at 16:9 and native 9:16, with an optional tap-to-restyle web page. Use when someone asks for a music or lyric video made from scratch. Not for editing filmed footage. Works best with the Katagami MCP.
---

# Make a music video with Katagami

You make a lyric music video from a song or an idea:

- Lyrics timed to the word and always on screen, usually inside the picture (a chat bubble, a sign, a terminal line).
- One scene per lyric line or phrase, each in a look from the Katagami library: an art style for the pictures, a design language for type and UI.
- Every frame drawn in code (HTML, CSS, SVG, canvas) and rendered with HyperFrames. Generated images are only references, traced into vectors.
- A 16:9 film and a native 9:16 film. Optional: a cut that switches looks on the beat, and a page where viewers tap to restyle the film.

## How to work

- You do the work. The human does as little as possible.
- Infer sensible defaults. Ask only what you cannot infer, usually "What's the song, or the idea?"
- Offer the outputs with a default: "16:9 and 9:16 (recommended). Also a beat-looks cut or a tap-to-restyle page?"
- Explain how things work only when the user asks or needs it. Report results, and show pictures and katagami.ai links.
- Bring the human in only where only a human can act, at the moment it is needed, and say what it is for:
  - the Katagami Google sign-in (it opens the full style library);
  - an API key you cannot find (the aligner, the image model);
  - a music-model account, when there is no song yet (you prepare the prompt and lyrics to paste);
  - approvals: the lyrics, the look, the take.

## Adapt to what the user has

| The user has | You do |
| --- | --- |
| a song file and lyrics | Check the lyrics against the song by ear, then go to timing. |
| a song file, no lyrics | Transcribe it only to draft the lyrics, have the user confirm the words, then time them by forced alignment. |
| lyrics, no song | Write the style prompt, then the user generates takes in a music model and picks one. |
| only an idea | Write the lyrics, get approval, then as above. |

## Set up (you run this)

```sh
export SKILL_DIR="$HOME/.claude/skills/katagami-music-video"   # this skill's folder; set it in every new shell
node -v; ffmpeg -version | head -1; potrace --version | head -1; python3 --version
mkdir -p my-video/song my-video/align && cd my-video && npm init -y
npm i -D hyperframes playwright && npx playwright install chromium   # pins HyperFrames for every npx call
python3 -m venv .venv && . .venv/bin/activate && pip install librosa numpy pillow
cp "$SKILL_DIR/scripts/build.mjs" .
```

- Install anything missing yourself (Node 22 or newer, FFmpeg, potrace) with the system package manager.
- Demucs pulls in PyTorch, so install it in the venv only when you isolate vocals locally; a hosted Demucs works too.
- Activate the venv (`. .venv/bin/activate`) in every new shell before a Python step. Reason: many systems refuse `pip install` into the system Python.
- Keys: look in the environment and in your own tools for an aligner (`ELEVENLABS_API_KEY` or `FAL_KEY`) and an image model before you ask. Never print a key.
- Katagami: if its tools are missing, run `claude mcp add --transport http katagami https://katagami.ai/mcp`. The tools load when the session restarts. Then call `whoami`. On the sample tier, tell the user that a one-time Google sign-in opens the full library (in Claude Code: `/mcp`, then katagami), and carry on meanwhile. With no MCP at all, use the public search, `https://katagami.ai/api/search?q=<phrase>&lane=<language|art-style>`, and each language's `DESIGN.md`.
- This skill owns the workflow. HyperFrames' own skills, if installed, are for composition details only. You do not need `hyperframes init`, and never run `init --audio`. Reason: it times the song with Whisper, which rule 2 forbids.

Project layout (run everything from the project root):

```
song/        song.wav, vocals.wav, lyrics.json, timing.json, timing-fixes.json, beats.json, labels.txt, NOTES.md
align/       aligner inputs and results
scenes.json  per scene: id, lines, idea, mode, art style, design language
looks.json   tokens and inks of every look
refs/        generated reference images (never shipped)
art/         traced vector art and art/art.js
assets/      fonts.css and fonts/
compositions/wide/ and compositions/vert/   one sNN.html per scene
out/         builds; renders/ films; site/ the optional live page
```

## The workflow

1. **The song** ([lyrics.md](references/lyrics.md)). `song/song.wav` and `song/lyrics.json`, with `text` for the screen and `sung` for the singer and the aligner. Done when the user approved the take.
2. **Timing** ([timing.md](references/timing.md)). Split the vocal stem, force-align the lyrics on it, then run `node "$SKILL_DIR/scripts/align-to-timing.mjs"` and review what it flags. Write `song/beats.json`. Done when five line starts after pauses sit on the voice.
3. **Scenes and looks** ([scenes-and-styles.md](references/scenes-and-styles.md)).
   - One line or couplet per scene, with a one-sentence idea.
   - Two or three modes for the whole film. Reason: a new look every line with no system reads as noise.
   - Looks from Katagami: `compose_kit` for the base look, `ask_library` per scene, `search_library` for a named style, `get_library_entry` for an art style's prompt, `get_design_tokens` for a language's tokens.
   - Done when the user approved the plan and its looks.
4. **Build** ([scenes-and-styles.md](references/scenes-and-styles.md)). Reference images from the art style's own template, traced into vector plates. One finished reference scene, then the rest. Done when each scene's `--only` build passes `npx hyperframes check`.
5. **Vertical, looks, render** ([vertical.md](references/vertical.md)). Compose the 9:16 film natively. Run `node "$SKILL_DIR/scripts/edge-check.mjs" out/vert`. Test every look. Render in chunks at scene cuts, then lay the song under the picture. Done when both films pass [qa.md](references/qa.md) and play through with sound.
6. **Optional live page** ([live-restyle-page.md](references/live-restyle-page.md)). The MP4 plays by default. A tap lays live windows over it in the next look. Taps are coalesced.

Run the [qa.md](references/qa.md) list for each stage before the next one.

## Rules

1. Align lyrics against the isolated vocal stem, never the mix. Reason: drums and pads smear word onsets.
2. Never time lines with a phrase transcriber. Reason: after a pause it starts the line where the previous word ended, 0.2 to 1.5 s early.
3. Never hardcode a lyric time in a scene. Reason: a re-record or re-align then needs only a rebuild.
4. Never show a word before it is sung; a scene cut may come one frame early. Reason: captions that lead the voice look out of sync.
5. Generated images are references only: trace them, and never ship a raster. Reason: vector plates can be re-inked into any look.
6. Never use text drawn by an image model; draw text in code. Reason: model text is garbled and cannot be restyled.
7. Route every colour, font, radius and shadow through `--k-*` tokens. Reason: one token swap restyles the whole film.
8. Never tween a colour with GSAP; switch a class or crossfade two layers. Reason: a tweened colour ignores later token swaps.
9. Text on paper uses `--k-ink`, on panels `--k-on-surface`, on accents `--k-on-accent`. Reason: in another look the paper can be black.
10. Switch shots with `opacity` or `display`, never `visibility: visible`. Reason: it overrides the runtime hiding the scene, so the shot paints over every other scene.
11. Keep blend-mode textures inside each scene. Reason: in a separate overlay they composite as a grey veil over the film.
12. Drive JavaScript side effects from a getter/setter tween, not `tl.call`. Reason: the renderer seeks with events suppressed.
13. Keep every scene deterministic: a seeded random, no clocks, finite repeats, no CSS animations. Reason: frames render out of order, in parallel chunks.
14. Self-host every font and load every face before the first frame. Reason: a missing face renders a fallback without an error.
15. Compose the vertical for vertical, and fill it by placing things, not cropping them. Reason: a card cut by the bottom edge reads as a mistake on a phone.

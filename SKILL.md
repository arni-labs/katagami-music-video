---
name: katagami-music-video
description: Make a music video for a song, or write the song first, in one of two modes. The code film draws every frame in code in Katagami looks, at 16:9 and native 9:16, with an optional tap-to-restyle page. The cinematic cut is generated video shots cut on the beat under a code-drawn lyric layer, at 16:9. Both get word-timed lyrics, a cast and looks from Katagami, and a release kit (platform versions, covers, a Katagami recipe draft, post drafts). Use when someone asks for a music or lyric video made from scratch. Not for editing footage someone filmed. Works best with the Katagami MCP.
---

# Make a music video with Katagami

You make a music video from a song or an idea: the lyrics timed to the word, a picture for every line in looks from the
Katagami library, and a release kit. There are two modes.

## Pick the mode

| | A. The code film | B. The cinematic cut |
| --- | --- | --- |
| The picture | every frame drawn in code; generated images are only references, traced or painted into plates | generated video shots (stills animated by a video model); type, labels and credits drawn in code on top |
| Cuts | placed from the lyric timing: a scene per line or couplet | on the beat grid and the drum hits: a median shot is two beats; the lyrics run across cuts |
| Shapes | 16:9 and a native 9:16 film | 16:9 only, never cropped |
| Extras | a beat-looks cut, a page where viewers restyle the film | none |
| Cost | reference images | every second of generated video, with retakes |
| Read | [code-film.md](references/code-film.md) | [cinematic-cut.md](references/cinematic-cut.md), [type-layer.md](references/type-layer.md) |

If the request does not say, offer both with that cost difference. Both modes share the song, the timing, the plan,
the boards, the checks and the release.

## How to work

- You do the work. The human does as little as possible.
- Infer sensible defaults. Ask only what you cannot infer, usually "What's the song, or the idea?"
- Explain how things work only when the user asks or needs it. Report results, and show pictures and katagami.ai links.
- Bring the human in only where only a human can act, at the moment it is needed, and say what it is for:
  - the Katagami Google sign-in (it opens the full style library);
  - an API key you cannot find (the aligner, the image or video model);
  - a music-model account, when there is no song yet (you prepare the prompt and lyrics to paste);
  - approvals: the lyrics, the take, the board, each review round;
  - posting, paying and submitting ([release.md](references/release.md)).

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
npm i -D playwright && npx playwright install chromium
python3 -m venv .venv && . .venv/bin/activate && pip install librosa numpy pillow
```

- Install anything missing yourself (Node 22 or newer, FFmpeg, potrace) with the system package manager. Each mode's
  reference lists its own extra tools.
- Activate the venv (`. .venv/bin/activate`) in every new shell before a Python step. Reason: many systems refuse
  `pip install` into the system Python.
- Keys: look in the environment and in your own tools for an aligner (`ELEVENLABS_API_KEY` or `FAL_KEY`) and the image
  or video model before you ask. Never print a key.
- Katagami: if its tools are missing, run `claude mcp add --transport http katagami https://katagami.ai/mcp`. The tools
  load when the session restarts. Then call `whoami`. On the sample tier, tell the user that a one-time Google sign-in
  opens the full library (in Claude Code: `/mcp`, then katagami), and carry on meanwhile. With no MCP at all, use the
  public search, `https://katagami.ai/api/search?q=<phrase>&lane=<language|art-style>`, and each language's `DESIGN.md`.

Run everything from the project root. `song/` (the take, lyrics, timing, beats, notes) and `align/` (aligner files) are
shared; each mode's reference lists its own folders.

## The workflow

Shared, in both modes:

1. **The song** ([lyrics.md](references/lyrics.md)). `song/song.wav` and `song/lyrics.json`, generated with the music
   model's lyrics box and the scene or shot list from one source file. Done when the user approved the take.
2. **Timing** ([timing.md](references/timing.md)). Force-align the lyrics on the vocal stem, then the beat grid, held
   words and musical switches. Scenes can be built on provisional timing before the song exists. Done when five line
   starts after pauses sit on the voice.
3. **Plan and looks** ([planning.md](references/planning.md)). The treatment, the bar file of the user's own words, the
   cast and the Katagami looks. Done when the user approved the plan and its looks.
4. **Boards** ([planning.md](references/planning.md), section 4). About 20 frames across every section with every note
   applied, made with the chosen mode's first steps (a reference scene, or stills). Done when the user said yes.

Stages 3 and 4 can start once the lyrics are approved, on provisional timing, while the user makes the take. The bulk
build or generation waits for the board (rule 8).

Then the mode:

- **A. The code film** ([code-film.md](references/code-film.md)): a reference scene, the scenes, look switches, the 9:16
  film, the render, an optional page.
- **B. The cinematic cut** ([cinematic-cut.md](references/cinematic-cut.md)): stills, clips, take gates, the edit on
  the beat grid, the grade, then the lyric layer ([type-layer.md](references/type-layer.md)).

Then, shared again:

5. **The review pass** on every full render ([qa.md](references/qa.md)), for a number of rounds fixed in advance.
6. **The release** ([release.md](references/release.md)): versions for each platform, encodes, covers, the Katagami
   recipe draft, post drafts, distribution and the film's page.

Run the [qa.md](references/qa.md) list for each stage before the next one. With several agents, follow
[production.md](references/production.md).

## Rules for both modes

Each mode's own rules are in its references.

1. Align lyrics against the isolated vocal stem, never the mix. Reason: drums and pads smear word onsets.
2. Never time lines with a phrase transcriber. Reason: after a pause it starts the line where the previous word ended,
   0.2 to 1.5 s early.
3. Drive every scene, shot and type cue from the timing data; never hardcode a lyric time. Reason: a re-record, an
   edited take or a re-align then needs only a rebuild.
4. Never show a word before it is sung, and keep a held word on screen until its true end. Reason: captions that lead
   the voice look out of sync, and a word that vanished mid-hold read as "dissonance".
5. Sung type holds still while its words land: no camera move, punch or flash on it, and no jump at a cut. Reason: a
   line that moved read as late while every word was within a frame of its onset.
6. Never use text drawn by an image or video model; draw text in code. Reason: model text is garbled and cannot be
   restyled or translated.
7. A new video gets its own cast and looks. Never reuse characters or art from an earlier video unless the user asks
   for a sequel. Reason: a reused character makes a new video read as a rerun of the last one.
8. Nothing is built or generated in bulk before the user's yes on a board. Reason: a full run started right after a
   look test, and the user asked for boards first, to see every earlier note applied.
9. Change only what the user named in a review. Reason: three rounds of redrawn sections lost to the originals.
10. Keep type 72 px from every edge in 16:9 and 64 px in 9:16, measured on the rendered pixels. Reason: the user reads
    type near an edge as "cropped in", and a text-box check passed a credit inside the margin.
11. Credit katagami.ai and every Katagami entry the film used, in the end roll and the post. Reason: a final went to
    review without katagami.ai, and the user asked for it.
12. Claim exactly what is true about how the film was made, and name versions for viewers, never by a vendor's product
    name ([release.md](references/release.md), section 6).
13. Only the user posts. Agents draft the posts and prepare the media ([release.md](references/release.md), section 6).

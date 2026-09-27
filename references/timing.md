# Timing the lyrics to the word

Read this at stage 2, once `song/song.wav` and `song/lyrics.json` exist, and again after any change to the audio.

Output: `song/vocals.wav`, `song/timing.json`, `song/labels.txt`, `song/beats.json`. Working files go in `align/`.

## Why forced alignment on the vocal stem

A phrase transcriber (Whisper-type speech recognition) starts a line where the previous word ended whenever a pause comes before it. That is 0.2 to 1.5 s early, so captions lead the voice. It also drops repeated words ("fine, fine, fine") and short function words on short clips.

Forced alignment works the other way round: you give it the words, and it finds when each one is sung. It needs the isolated vocal, because drums and pads smear the word onsets. Use a transcriber only to check what was sung (a changed word shows up as a mismatch), never to time lines.

## 1. Isolate the vocal

```sh
mkdir -p song align
. .venv/bin/activate                 # the venv from the setup in SKILL.md (demucs is installed there)
demucs --two-stems vocals -n htdemucs_ft song/song.wav
cp separated/htdemucs_ft/song/vocals.wav song/vocals.wav   # use the path demucs prints
```

Hosted alternative: `fal-ai/demucs` with `{ "audio_url": ..., "model": "htdemucs_ft", "stems": ["vocals"], "output_format": "wav" }`. Its default output is MP3, so ask for WAV.

Check the stem before aligning. It must have the same duration as the mix (compare seconds: Demucs may write another sample rate) and no offset. This check needs NumPy and FFmpeg. Pass a stretch where the voice sings (start and length in seconds):

```python
# offset.py: python3 offset.py [start 30] [length 30]   must print "offset 0.0 ms"
import subprocess, sys, numpy as np
start, length = (float(v) for v in (sys.argv[1:] + ['30', '30'][len(sys.argv[1:]):])[:2])
def pcm(f): return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(length), '-i', f, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout, np.int16).astype(float)
a, b = pcm('song/song.wav'), pcm('song/vocals.wav')
if min(len(a), len(b)) < 16000 * length * 0.9: sys.exit(f'the audio ends before {start + length:.0f} s: pass an earlier start or a shorter length')
n = len(a) + len(b)
x = np.fft.irfft(np.fft.rfft(a, n) * np.conj(np.fft.rfft(b, n)), n)
lag = int(np.argmax(x)); lag = lag - n if lag > n // 2 else lag
print(f'stem is {-lag / 16:.1f} ms late' if lag else 'offset 0.0 ms')
```

## 2. Prepare the text and the audio

The aligner gets one lyric line per text line, in song order: `sung` where present and `text` otherwise, with the parentheses removed and the words kept. Reason: the aligner treats a parenthesised span as one non-speech token. Write the text for the whole song into `align/text-song.txt`:

```sh
node -e 'for (const l of require("./song/lyrics.json")) console.log((l.sung ?? l.text).replace(/[()]/g, " "))' > align/text-song.txt
```

Send 16 kHz mono. Reason: uploads are much faster, and the aligner needs no more.

```sh
ffmpeg -v error -y -i song/vocals.wav -ac 1 -ar 16000 align/vocals-16k.wav
```

A whole song in one request is fine when the vocal is clean and the text matches it. Align per section when long instrumental breaks, ad-libs, or backing vocals missing from the text pull words to the wrong place. A bad stretch then stays inside its section:

1. Cut the stem at clear pauses. Where a cut must fall near singing, extend the clip over the neighbouring line and add that line to the text as a context line (its id starts with `~`). The script aligns it and drops it.
2. Write each section's text from its ids, context lines included:
   ```sh
   node -e 'const L = Object.fromEntries(require("./song/lyrics.json").map(l => [l.id, l])); for (const id of process.argv.slice(1)) { const l = L[id.replace(/^~/, "")]; console.log((l.sung ?? l.text).replace(/[()]/g, " ")); }' '~i2' v1_1 v1_2 '~pc1_1' > align/text-verse1.txt
   ```
3. Either send one request per section, or put the clips back to back with 2 s of silence between them and send one request for all. Reason: one request gives one result file to keep.
   ```sh
   ffmpeg -v error -y -ss 12.0 -to 41.5 -i align/vocals-16k.wav align/sec01.wav    # one clip per section
   ffmpeg -v error -y -f lavfi -i anullsrc=r=16000:cl=mono -t 2 align/gap.wav
   printf "file 'sec01.wav'\nfile 'gap.wav'\nfile 'sec02.wav'\n" > align/list.txt
   ffmpeg -v error -y -f concat -safe 0 -i align/list.txt -c copy align/joined.wav
   cat align/text-verse1.txt align/text-chorus1.txt > align/text-joined.txt
   ```
4. Record each section in `align/sections.json`. `shift` turns aligned seconds into song seconds: the clip's start in the song minus its start in the aligned file (0 for a clip sent alone; take the joined file's starts from the clips' `ffprobe` durations plus the 2 s gaps).

```json
[
  { "file": "align/joined.json", "shift": 12.0, "ids": ["~i2", "v1_1", "v1_2", "~pc1_1"] },
  { "file": "align/joined.json", "shift": 28.4, "ids": ["~v1_12", "c1_1", "c1_2", "c1_3", "c1_4"] }
]
```

Here the first clip starts at 12.0 s in the song and at 0 in `align/joined.wav`, so its shift is 12.0. The second clip starts at 59.9 s in the song and at 31.5 s in the joined file (after the 29.5 s first clip and the 2 s gap), so its shift is 59.9 minus 31.5, which is 28.4. Sections that share one file take its lines in the order listed.

## 3. Align

ElevenLabs Forced Alignment takes the audio file and the text:

```sh
curl -s -X POST https://api.elevenlabs.io/v1/forced-alignment \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -F file=@align/vocals-16k.wav -F "text=<align/text-song.txt" -o align/song.json
```

It returns `{ characters: [{ text, start, end }], words: [{ text, start, end, loss }], loss }`, in seconds from the start of the file. The same model runs on fal as `fal-ai/elevenlabs/forced-alignment` with `{ audio_url, text }` and returns the same shape (save it as `align/<name>.json`; a `{ result }` wrapper is fine). Upload the WAV with the fal client first. Any other aligner works if it returns words with a start and an end for the text you give it.

## 4. Build timing.json

```sh
node "$SKILL_DIR/scripts/align-to-timing.mjs"                                   # whole song: reads align/song.json
node "$SKILL_DIR/scripts/align-to-timing.mjs" --sections align/sections.json --fixes song/timing-fixes.json
```

It reads `song/lyrics.json` and the results, and writes `song/timing.json` and `song/labels.txt`. The song duration comes from `ffprobe` of `song/song.wav`, or from `--duration`.

- **Lines.** It splits each result at its line-break entries. When a result has none, it splits by each line's sung word count and says so.
- **Words.** A caption word takes its time from the sung words it stands for: its start is the first one's start and its end the last one's end. Equal word counts map one to one. When the counts differ, the line's `map` in `lyrics.json` says how many sung words each caption word covers ("5%" covers "five percent": 2).
- **Japanese and Chinese.** A caption without spaces becomes one caption word per character, with punctuation kept on its character. Unless the counts match or a `map` covers them, the characters share the sung time by letter count, and the line is flagged.
- **Overlaps.** A line ends by the time the next one starts: its end, and its words' ends, are clamped to the next line's start.

It prints one row per line: id, start, length, mean and max loss, then any flags:

| Flag | Meaning | What to do |
| --- | --- | --- |
| `loss <words>` | the aligner was unsure (loss 3 or more) | check the word by ear, fix it if it is off |
| `squeezed <words>` | a word shorter than 0.02 s: the aligner could not find it and squeezed it against a neighbour | re-align the line alone or fix the word |
| `mapped by length` | caption and sung words differ and no `map` covered it | add a `map`, or check the reveal by eye |
| `(fixed)` | a fix from the fixes file was applied | nothing |

## 5. Verify

- Read the table. Look hard at every flagged line.
- For a doubtful word: re-align that line alone on a tight clip (1 s either side), compare it with onsets in the stem (spectral flux peaks), or listen.
- Keep corrections in `song/timing-fixes.json`, in song seconds, by sung word index (from 0), with a reason each. The script reads that file on every run when it exists (`--fixes` names another). Reason: a re-run keeps the corrections.
  ```json
  { "v1_4": { "why": "the aligner squeezed 'Christie's' into 'canvas'", "words": { "5": [41.12, 41.48] } } }
  ```
- Expect the aligner to land 0.05 to 0.1 s after consonant onsets. That is fine: scenes cut one frame (1/30 s) before the line.
- Listen: import `song/labels.txt` into Audacity over the vocal stem (File, Import, Labels) and scrub five line starts that follow a pause. Each label must sit on the first sung sound, never before it.

## 6. Beats and downbeats

Cuts and look switches land on beats. Downbeats (the one of each bar) carry the bigger moves. `npx hyperframes beats` writes beats only, with no downbeats, so use librosa:

```python
# beats.py: song/song.wav -> song/beats.json (run it in the venv, which has librosa and numpy)
import json, numpy as np, librosa
y, sr = librosa.load('song/song.wav', sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time')
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=256))
f = librosa.fft_frequencies(sr=sr, n_fft=2048)
t = librosa.frames_to_time(np.arange(S.shape[1]), sr=sr, hop_length=256)
low = S[(f > 30) & (f < 120)].sum(0)  # kick drum band
kick = np.array([low[max(0, i - 2):i + 4].max() for i in np.searchsorted(t, beats)])
phase = max(range(4), key=lambda p: kick[p::4].mean())  # the bar position with the strongest kick
down = beats[phase::4]
json.dump({'beats': [round(float(b), 3) for b in beats], 'downbeats': [round(float(d), 3) for d in down]}, open('song/beats.json', 'w'))
print(f'{len(beats)} beats at {float(np.atleast_1d(tempo)[0]):.1f} BPM, first downbeat {down[0]:.2f} s (phase {phase})')
```

The downbeat phase is a guess. Check that a downbeat lands on the first word of a chorus. Songs with a short bar drift off a fixed four-beat grid, so pick the phase per section there.

Space the moves out. A cut or a short colour flip (a filter on the whole scene for one beat) can land on any beat, at least 0.36 s apart. Reason: faster changes read as flicker. Whole look switches go on downbeats, at least 1.5 s apart. Reason: a viewer needs time to take in a look.

## Rules

- Align against the vocal stem, not the mix. Reason: drums and pads smear the onsets.
- Never trust a transcriber's line starts after a pause. Reason: it starts the line where the previous word ended.
- Never hardcode a lyric time in a scene; read it from the timing data. Reason: a re-record or re-align then needs only a rebuild.
- Never show a word before it is sung. The cut to a new scene may come one frame before the line, no more. Reason: a caption that leads the voice reads as out of sync, even by 0.2 s.
- Make each line readable within about 0.4 s of its start. Reason: most lines last two to three seconds.
- Give every ffmpeg command that writes a file `-y`. Reason: without it, a re-run in a non-interactive shell prints "Not overwriting" and exits 0, so the old file silently stays.
- Re-run the whole timing step after any change to the audio. Reason: timing belongs to one exact take.

## Done when

- [ ] `song/vocals.wav` has the mix's duration and a 0.0 ms offset.
- [ ] Every line in `song/timing.json` has `t`, `end` and `words`. No line overlaps the next.
- [ ] Every flagged line is reviewed, and each fix has a reason in `song/timing-fixes.json`.
- [ ] Five line starts after pauses, checked by ear, sit on the voice and not before it.
- [ ] `song/beats.json` has beats and downbeats, and a chorus starts on a downbeat.

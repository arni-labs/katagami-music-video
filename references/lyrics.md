# Lyrics and the song

Read this at stage 1. It covers both cases: the user has a song, or the user only has an idea.

Output: `song/song.wav` and `song/lyrics.json`.

## If the user has the song

1. Get the final mix at the best quality they have. Convert it once to 48 kHz WAV:
   ```sh
   mkdir -p song
   ffmpeg -v error -y -i input.flac -ar 48000 -c:a pcm_s16le song/song.wav
   ```
   An MP3 source stays an MP3 in quality. Convert it once and keep the original next to it.
2. Get the lyrics, then listen once with the text in front of you. Correct every word to what is actually sung: repeats, ad-libs, a changed word.
3. Write `song/lyrics.json` (format below). One entry per caption line.

## If the user only has an idea: write the lyrics first

Infer the mood, the genre and the audience from the idea. Ask only for what it does not tell you, and what is off-limits if it could matter.

### Craft

- **The hook.** Three to seven words that say the idea. It is the title. Put it on a downbeat and repeat it in every chorus. Test it: could someone reply to a post with just the hook?
- **Structure.** Intro, verse, pre-chorus, chorus, verse, pre-chorus, chorus, bridge, final chorus, outro. Aim for 2.5 to 4 minutes. The bridge turns: a new angle, a quieter voice, or another language. The final chorus can change its last line.
- **Verse density.** One concrete picture or joke per line. Use many different ideas, not one joke stretched over a verse. Prefer nouns you could draw.
- **Every line is a scene.** The video cuts on lines, so write a scene note (the line's `note`) while you write the line: who, what, where. If a line has no picture, rewrite the line.
- **A chorus people can sing.** Short lines of four to eight syllables. Open vowels (ah, oh, ay) on long notes. The same rhythm every time. Few consonant clusters on held notes.
- **Details for rewatching.** Some jokes can live only in the pictures (fine print, labels, a sign in the background). Put them in the scene notes, not in the lyric.
- **Multilingual lines, if wanted.** Show the native script on screen with an English translation under it. Slang must be current usage. Have a native speaker check every language you cannot judge yourself, or research recent native posts (not dictionaries). Drop slang that has aged or that reads as a political reference.

Show the user the full lyrics with section labels and scene notes. Get approval before you generate audio. Audio is the slow and costly step.

## Two spellings per line

The screen and the singer need different spellings.

- `text` is the caption: what a reader expects. "5%", "DJ", "@name", brand names spelled correctly, native script.
- `sung` is what the music model should sing and what the aligner will listen for. Add it only where it differs from `text`.

How to write `sung`:

- Spell out numbers and acronyms: "5%" becomes "five percent", "DJ" becomes "dee-jay", "@name" becomes "at name".
- Mark stress with capitals where the model stresses a word wrongly: "reCORD" for the verb.
- Use kana for a Japanese particle the model reads by its spelling: the topic particle は is sung "wa", so write わ.
- If the model reads a line as a neighbouring language, respell it in a script that forces the right sounds, or in Latin letters.
- Parentheses mean backing vocals or ad-libs in many music models. Use them on purpose. The aligner treats a parenthesised span as one non-speech token, so the timing step strips them.

## lyrics.json

An array of lines in song order:

```json
[
  { "id": "c1_1", "section": "chorus1", "text": "Up at 3 a.m. on 5% battery", "sung": "Up at three A M on five percent battery", "lang": "en", "map": [1, 1, 1, 2, 1, 2, 1], "est": 2.6, "note": "a phone at 5% battery, the only light in a dark room" },
  { "id": "v2_3", "section": "verse2", "text": "今日も元気です", "lang": "ja", "en": "Doing great again today", "est": 2.4 }
]
```

- `id`: section plus index. Scenes and timing refer to it.
- `text`: caption spelling. Scenes show exactly this string.
- `sung`: optional, the spelling sent to the music model and the aligner.
- `lang`: a BCP 47 tag (`en`, `ja`, `zh-Hans`, `ko`, `hi`). Scenes set it on the element so the browser picks the right glyphs.
- `en`: the English translation, for non-English lines.
- `map`: only when `text` and `sung` have different word counts. For each caption word, how many sung words it covers: above, "3" is "three" (1), "a.m." is "A M" (2) and "5%" is "five percent" (2). The timing script uses it to give each caption word its sung time.
- `est`: optional, the line's estimated sung length in seconds. Only the provisional timing uses it ([timing.md](timing.md)).
- `note`: optional, the scene note: who, what, where.

One caption line is one breath or phrase, usually two to four seconds. Split longer lines at the breath.

## One source file

Keep every line once, in one small script or data file in the project, and generate the rest from it:

- `song/lyrics.json`;
- the music model's lyrics box: section tags, voice or language tags, and `sung` spellings;
- `scenes.json`: which lines each scene holds, with its mode and idea;
- a readable lyrics sheet with section labels and scene notes, for the user's approval.

Edit the source, never the outputs. On every run it checks that line ids are unique and that every line sits in exactly one scene. Then run the provisional timing ([timing.md](timing.md)), which also flags a missing `map`. Reason: hand-edited copies drift, and a line changed in one copy and not the others shows the wrong words or times the wrong line.

## Generating the audio

Any music model works if it takes lyrics and a style prompt. Suno is one example. Keep the steps tool-neutral:

1. **Style prompt.** Genre, tempo in BPM, mood, instrumentation, and which voice sings or speaks each section, all chosen for this song. Pairings range widely, for example "breathy spoken verses, stacked-harmony chorus", "one crooner throughout, a choir on the bridge" or "call and response between two singers"; none of them is a default. Do not name a living artist. Reason: services often block artist names, and copying a real singer's voice raises rights problems.
2. **Lyrics box.** Section tags (`[Verse 1]`, `[Pre-Chorus]`, `[Chorus]`, `[Bridge]`) and the `sung` spellings, generated from the source file.
3. **Generate several takes.** Pick for diction (every word clear on a phone speaker), a hook that lands, and a steady tempo.
4. **Fix single lines** with the tool's replace-section or edit feature. Note the time range and the exact new text.
5. **Export lossless WAV** to `song/song.wav` (48 kHz).
6. **Keep a note** (for example `song/NOTES.md`): the take, the style prompt and the exact lyrics text sent. A later fix then starts from the same inputs.
7. **Check the terms.** The service's terms must allow the use you plan (public posting, commercial use).

After any change to the audio, run the timing step again ([timing.md](timing.md)).

## Rules

- Write the text the aligner gets from what is sung, not what was planned. Reason: the aligner fits the words you give it, and a skipped word pulls its neighbours out of place.
- Keep one caption line per breath. Reason: the video cuts per line, and a seven-second line becomes a long static shot.
- Keep line ids stable once the first scene exists. Reason: scenes and timing refer to ids, and renumbering breaks every scene.
- Get the lyrics approved before generating audio. Reason: a lyric change after the take means a new take and a new timing pass.
- Review languages you cannot read with a native speaker or current native sources. Reason: dated or wrong slang is what native viewers notice first.

## Done when

- [ ] `song/song.wav` is the approved take, 48 kHz WAV, full length.
- [ ] `song/lyrics.json` has every sung line in order, with `text`, `sung` where it differs, `lang`, and `en` for non-English lines.
- [ ] You listened once with the text, and every word matches what is sung.
- [ ] The user approved the lyrics and the take.

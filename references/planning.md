# Planning: the treatment, the bar, the cast and looks, the boards

Read this at stage 3, after the lyrics are approved and before anything is drawn or generated. It applies to both modes.

Output: `TREATMENT.md`, `BAR.md`, the cast and look choices (recorded in `scenes.json` for the code film, in the shot
table for the cinematic cut), and a board the user said yes to.

## 1. The treatment

One page, written before any picture:

- **The story in about ten lines.** What happens from the first line to the last, and what the ending means. The story
  must be on screen. Reason: a first cut made of one slow picture per line, with the lyric as a subtitle, was rejected as
  "a slideshow" with no storytelling.
- **One world.** One setting for the whole film; other looks can live inside it (on screens, signs, pages). Reason: on a
  past video the first cut changed setting with every look, and the user asked for "one world"; the second cut put
  everything in one setting.
- **One recurring object that grows.** Something that appears early, small, and comes back bigger each time to land at
  the end. Reason: on a past video one object, a dot in the intro and a looming shape at the end, held a 91-scene film
  together.
- **A picture for every line.** Each line gets a scene or shot that acts it out or explains it; the jokes and puns
  live there, in labels, fine print and objects, not in a caption. Reason: the music videos the user held up as the bar
  give every line its own explaining graphic; our first cut, with subtitles only, fell short of them.
- **The table.** One row per scene (code film) or shot (cinematic cut): id, start, length, section, cast, story beat,
  joke, and where the type goes. Take times from the timing data, never by hand ([timing.md](timing.md)).
- **A budget,** for the cinematic cut: takes per shot and the spend cap ([cinematic-cut.md](cinematic-cut.md)).

## 2. The bar file

`BAR.md` holds the user's own words about what the film must be and must never be, quoted exactly, newest first, with
the date. Paste it into every agent brief and every reviewer prompt. Add to it after every review.

- Quote, never paraphrase. Reason: a published production that ran unattended for a day and more credited its bar of
  the director's own words, pasted into every agent prompt, with keeping the agents on target.
- Keep a never-list in it and check every board and review against it (section 5).

## 3. Cast and looks from Katagami

Katagami holds design languages (tokens, rules, type and UI), palette systems, art styles (prompt recipes for images)
and code art. Calls, in the order you usually need them:

| Call | Use it for |
| --- | --- |
| `compose_kit({ query })` | The film's base look: a language, a palette and an art style judged to belong together, with a `brief_url`. |
| `ask_library({ query, kind })` | A look for one scene or section, from a one-sentence brief ("the chorus: loud, glossy, anime energy"). |
| `ask_library({ query, reading, changes, refine })` | Adjusting an answer ("quieter, black and white"). Pass back the `reading` and `changes` it returned. |
| `search_library({ kind, query, tag, medium })` | A named style, tag or medium ("woodcut", "collage", `medium: "print"`). `describe_library` lists what exists. |
| `get_library_entry({ id_or_slug })` | Everything in one entry. For an art style: `prompt_template`, `slot_recipes`, `negative_prompt`, `reference_image_urls`, do's and don'ts. |
| `get_design_tokens({ id_or_slug, format: "css" })` | A design language's colours, radii, shadows and fonts as CSS variables, plus `fonts_url`. |
| `check_page_against_language({ id_or_slug, page })` | After building a scene's UI: pass the scene HTML with its CSS and fix what breaks the language, worst first. |

- Show the user what you pick: the thumbnail and the katagami.ai `url` of each entry. Record the ids.
- `ask_library` returns `strange` next to `results`: styles unlike the rest of the library that still fit. Read both.
  Reason: for a comic or odd brief the best pick can be in `strange`.
- `compose_kit` scores each kit's `belongs_together` from 0 to 1. When it is low, take every token from the language
  and borrow only the palette's signature colours. Reason: two grounds that disagree break the contrast pairs.
- Use the entry's current id. Reason: a revised language gets a new id, and the old one stops opening for visitors.
- Fill an art style's `prompt_template` word for word: `{subject}`, `{palette}`, `{composition}`. Reason: a rewritten
  prompt loses the style the entry was tested with. The style's gallery pictures (`reference_image_urls`) served as
  references for the code film's traced plates; in the cinematic cut they pulled the image model toward photographs, so
  leave them out there.
- Every look on screen should be a Katagami entry. If the film needs a look Katagami lacks, make it an entry (the
  connector's `create_item`) before you call the film finished. Reason: the release recipe can only list entries
  ([release.md](release.md), section 5).

**The cast.** A new video gets its own cast ([SKILL.md](../SKILL.md), rule 7).

- Make one sheet per character first, with the fixed traits written out (hair colour, clothes, silhouette). Pass it as
  a reference image in every call that shows the character, and name the fixed traits in every prompt. Reason: the
  model keeps a character only when it gets both.
- Name what a crowd wears and what is on their heads in every prompt (section 5 has why).

## 4. Boards before any bulk run

The user's yes on a board comes before any bulk run ([SKILL.md](../SKILL.md), rule 8). A look test picks a direction; the
board shows the story in it with every earlier note applied, and says which note each frame answers.

1. **Look test.** Four subjects in each candidate look, side by side.
2. **The board.** About 20 frames across every section, in the chosen look, with every note so far applied. For the
   code film these are built scenes; for the cinematic cut, generated stills.
3. **The yes.** Wait for it. Then build or generate the rest.

- Pilot three pictures before any batch in a new direction. Reason: a batch of a misunderstood brief costs a round.
- Judge every new picture next to the film's best frames, at the size viewers will see it. Reason: on a past video,
  replacements briefed as "calm and clean" came out flat and storybook next to the film's own frames and were
  rejected, and 16 of 190 stills that passed as thumbnails failed at full size.

## 5. The never-list

Write the user's never-list into `BAR.md` and check every board, still and review sheet against it. The entries that
came up on past videos:

- **Accidental symbols.** Ranks of uniformed figures, short hair, ray skies, two colours and heroic framing together
  read as a propaganda poster. Crowds in white robes came out with pointed hoods in ranks, which read as a hate-group
  uniform in a paused frame, and raised straight arms read as a salute. Name heads, clothes and arm positions in every
  prompt, and look at paused frames for these.
- **AI-product glyphs.** A four-point sparkle star, a circle with a plus, a round "send" button. Reason: they read as
  an AI app's interface. A glint is a round bloom or one streak.
- **Default AI design.** Cream or beige paper with sage, a serif paired with tiny tracked mono labels, hairlines,
  corner brackets, chips, soft shadows, bento grids, glass, purple gradients. Give each screen one material idea instead.

## 6. Review rounds

- Fix the number of review rounds before you start, and count a review that finds nothing as a failed review. Reason:
  in the published unattended production above almost nothing passed; a fixed number of rounds is what ended its loop.
- Change only what the user named ([SKILL.md](../SKILL.md), rule 9). After three rounds of redrawn sections lost to the
  originals, the user's verdict was "we overcorrected".
- If the user prefers an earlier version of something, restore its picks instead of making it again. Reason: about 30
  shots came back in 20 minutes by re-pinning the old takes.
- When feedback is vague ("it looks cut off", "it feels late"), turn it into a measured check first ([qa.md](qa.md)).

## Done when

- [ ] `TREATMENT.md` has the story, the world, the recurring object and the table, with times from the timing data.
- [ ] `BAR.md` quotes the user, with a never-list.
- [ ] Every look and the cast are chosen, with their Katagami ids, and the user saw the thumbnails and links.
- [ ] The user said yes to the board.

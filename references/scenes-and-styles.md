# Scenes, looks and the scene files

Read this at stages 3 and 4: planning scenes, choosing Katagami looks, making reference art, and writing the HyperFrames scene files.

Output: `scenes.json`, `looks.json`, `art/*.js`, `assets/fonts.css`, `compositions/wide/*.html` and your copy of `build.mjs`.

## 1. Plan the scenes

Cut the song into scenes of one lyric line or a couplet, usually 2 to 6 s. The intro and the outro can be one scene each. A scene with no sung lines gives its `start` in seconds, and `art` lists art names a scene builds at runtime (section 6). Generate `scenes.json` from the one source file ([lyrics.md](lyrics.md)), not by hand.

```json
[
  { "id": "s01", "lines": ["i1"], "mode": "manga", "idea": "A phone at 5% battery, the only light in a dark room", "art_style": "<slug>", "language": "<slug>" },
  { "id": "s02", "lines": ["v1_1", "v1_2"], "mode": "manga", "idea": "The same street at dawn, drawn as one manga panel", "art_style": "<slug>", "art": ["s02-blink-1", "s02-blink-2"] },
  { "id": "s09", "lines": [], "start": 61.5, "mode": "manga", "idea": "Instrumental break: rain fills the phone screen", "art_style": "<slug>" }
]
```

- One idea per scene: a joke, an image, a turn. Write it in one sentence before you design anything.
- The lyric is always on screen, and it works best inside the picture: the chat bubble, the sign, the terminal command, the caption box of a manga panel.
- Put small details in the picture that reward a second watch (fine print, labels, a background sign).
- Choose two or three modes for the whole film, for example black-and-white manga for most lines, green terminal for machine lines, loud flat colour for a few punchlines. Every line changes treatment (layout, type, texture, motif), but only inside those modes. Record each mode's look in `looks.json` (section 3).
- Story sections (a chorus, the bridge) can be full-frame illustrated sequences: three to six shots per scene, cut on words and beats, characters acting the line.

## 2. Choose looks with the Katagami MCP

Katagami holds design languages (tokens, rules, type and UI), palette systems and art styles (prompt recipes for images). Calls, in the order you usually need them:

| Call | Use it for |
| --- | --- |
| `compose_kit({ query })` | The film's base look: a language, a palette and an art style judged to belong together, with a `brief_url`. |
| `ask_library({ query, kind })` | A look for one scene or section, from a one-sentence brief ("the chorus: loud, glossy, anime energy"). |
| `ask_library({ query, reading, changes, refine })` | Adjusting an answer ("quieter, black and white"). Pass back the `reading` and `changes` it returned. |
| `search_library({ kind, query, tag, medium })` | A named style, tag or medium ("manga", "risograph", `medium: "print"`). `describe_library` lists what exists. |
| `get_library_entry({ id_or_slug })` | Everything in one entry. For an art style: `prompt_template`, `slot_recipes`, `negative_prompt`, `reference_image_urls`, do's and don'ts. |
| `get_design_tokens({ id_or_slug, format: "css" })` | A design language's colours, radii, shadows and fonts as CSS variables, plus `fonts_url`. |
| `check_page_against_language({ id_or_slug, page })` | After building a scene's UI: pass the scene HTML with its CSS and fix what breaks the language, worst first. |

Show the user what you pick: the thumbnail and the katagami.ai `url` of each entry. Record the slugs in `scenes.json`.

- `ask_library` returns `strange` next to `results`: styles unlike the rest of the library that still fit. Read both. Reason: for a comic or odd brief the best pick can be in `strange`.
- `compose_kit` scores each kit's `belongs_together` from 0 to 1. When it is low (a paper language paired with a dark palette, say), take every token from the language and borrow only the palette's signature colours, as the spare accents. Reason: the token table below assumes one source, and two grounds that disagree break the contrast pairs.

## 3. Tokens: the `--k-*` contract

Every scene declares its look as CSS custom properties on its root, and every rule reads them. This is what lets the film be restyled later, in a beat-looks cut or on the live page.

Nineteen tokens. Take each from the language's `get_design_tokens` output (CSS format); the first name that exists wins. Entries differ: one calls the ground `--color-background`, one names a radius `--radius-base`, another has no `--color-accent-2`, and a dark-ground language can have light cards.

| Film token | Meaning | From `get_design_tokens`, first match wins |
| --- | --- | --- |
| `--k-paper` | the ground | `--color-background`, `--color-bg`, else `#FFFFFF` |
| `--k-surface` | cards and panels | `--color-surface-solid`, `--color-surface`, else `--k-paper` |
| `--k-ink` | text and lines on paper | `--color-text`, `--color-ink`, else black or white, whichever passes on paper |
| `--k-on-surface` | text on a card or panel | `--color-on-surface`, `--color-ink`, `--color-text`, `--color-background`, `--color-bg` |
| `--k-muted` | secondary text on paper | `--color-muted` if it passes on paper, else `--k-ink` |
| `--k-line` | rules and keylines | `--color-border`, else `--k-muted` |
| `--k-accent` | the highlighter (key word, marker) | `--color-accent`, `--color-primary`, else the first colour of the palette `compose_kit` paired with it |
| `--k-accent-2`, `--k-accent-3` | sparing second and third accents: marks, strokes and fills, never text | `--color-accent-2` and `-3` (for accent-2 also `--color-secondary`), else colours from the paired palette, else `--k-accent` |
| `--k-text-2`, `--k-text-3` | text in the accent-2 and accent-3 hues | the accent itself if it passes on paper, else the language's own darker colour of that hue (often `--color-warning` or `--color-error`), else `--k-ink` |
| `--k-on-accent` | text on an accent block | `--color-on-accent`, else `--k-ink` or `--k-paper`, whichever passes on the accent |
| `--k-font-display`, `--k-font-body`, `--k-font-mono` | the three faces | `--font-heading`, `--font-body`, `--font-mono`, each with a generic fallback (`'Barlow Condensed', sans-serif`) |
| `--k-lh-display`, `--k-lh-body` | line-height of display and body text | set per look from its faces, not from `--type-line-height` (that is for reading pages): about 1.0 and 1.12 for condensed faces, about 1.25 for faces with a tall glyph box (many Japanese and Chinese families) |
| `--k-radius` | corners | `--radius-md`, `--radius-base`, else `0px` |
| `--k-shadow` | the one shadow | `--shadow-md`, else `none` |

`--k-accent-2` and `--k-accent-3` are highlighters. Never colour text with them, and never put `--k-ink` text on them. Reason: as text they fail on light paper (an orange on cream is under 2:1), and ink on an accent fill fails in a dark look. Text in their hues uses `--k-text-2` / `--k-text-3`; text on their fills gets its colour picked per look ([vertical.md](vertical.md), section 4).

Every text pair must reach 4.5:1: ink on paper, on-surface on surface, muted on paper, text-2 and text-3 on paper, on-accent on accent. When a candidate fails, take the next one, or black or white, whichever passes. Compute it; do not guess:

```js
const lum = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
contrast('#f8f1e4', '#f5efe2'); // light text on a light card: about 1.0, so on-surface takes --color-ink instead
```

`looks.json` holds each mode's look, the original look and every restyle look:

```json
{ "tokens": ["paper", "surface", "ink", "on-surface", "muted", "line", "accent", "accent-2", "accent-3", "text-2", "text-3", "on-accent", "font-display", "font-body", "font-mono", "lh-display", "lh-body", "radius", "shadow"],
  "modes": {
    "manga": { "language": "<slug>", "art_style": "<slug>", "fonts": "<fonts_url>", "k": { "paper": "#FFFFFF", "ink": "#120E18", "accent": "#FFF26A", "lh-display": "1.08" }, "inks": ["#FFFFFF", "#B9B4C2", "#120E18"] },
    "terminal": { "language": "<slug>", "art_style": "<slug>", "fonts": "<fonts_url>", "k": { "paper": "#0A0A0A", "ink": "#55FF55", "accent": "#55FF55" }, "inks": ["#0A0A0A", "#1F8F52", "#55FF55"] }
  },
  "looks": [
    { "id": "original", "k": null, "inks": null },
    { "id": "riso", "language": "<slug>", "fonts": "<fonts_url>", "k": { "paper": "#F3EAD8", "ink": "#211A2E", "accent": "#FF2E88", "on-accent": "#211A2E" }, "inks": ["#F3EAD8", "#FFC21F", "#FF2E88", "#211A2E"] },
    { "id": "dither", "language": "<slug>", "fonts": "<fonts_url>",
      "k": { "paper": "#0A0A0A", "surface": "#161616", "ink": "#F2F2F2", "on-surface": "#F2F2F2", "muted": "#9AA39A", "line": "#3A3F3A",
             "accent": "#55FF55", "accent-2": "#55FFFF", "accent-3": "#FF55FF", "text-2": "#55FFFF", "text-3": "#FF55FF", "on-accent": "#0A0A0A",
             "font-display": "'Jersey 10', monospace", "font-body": "'VT323', monospace", "font-mono": "'VT323', monospace",
             "lh-display": "1.0", "lh-body": "1.12", "radius": "0px", "shadow": "none" },
      "inks": ["#0A0A0A", "#1F8F52", "#55FF55"] }
  ] }
```

- `modes` has one entry per mode named in `scenes.json`: its language, art style, fonts, all nineteen tokens in `k` (shortened above) and the ink ramp for its art. A scene declares its mode's tokens on its root (section 7). Reason: with several modes there is no single original look, so scene builders need each mode's tokens written down.
- `original` has `"k": null`: each scene keeps its own mode's tokens.
- Every restyle look lists all nineteen tokens (`riso` is shortened above).
- `inks` is the colour ramp the traced art is re-inked with (section 5). Its first colour paints the art's lightest tone and its last colour the darkest. `dither` starts dark, so its art prints inverted, like its type.

### Fonts

Ship every face as a file. A family with no `@font-face` renders in a fallback face, and `lint` does not report it. Fetch the look's `fonts_url` with a browser User-Agent (without one, Google Fonts serves `.ttf` files), keep the `.woff2` files in `assets/fonts/`, and point the rules at them:

```sh
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
fetch_fonts() {  # fetch_fonts <name> <fonts_url> [subsets]: .woff2 files into assets/fonts/, @font-face rules into assets/fonts/<name>.css
  mkdir -p assets/fonts
  css=$(curl -sf -A "$UA" "$2") || { echo "cannot fetch $2"; return 1; }
  if [ -n "$3" ]; then  # keep only the named subsets, for example 'latin|latin-ext|cyrillic'
    css=$(printf '%s\n' "$css" | awk -v keep="^/[*] ($3) [*]/\$" '/^\/\*/ { ok = $0 ~ keep } /^@font-face/ { cur = ok; ok = 0 } cur || ($0 ~ keep) { print } /^}/ { cur = 0 }')
  fi
  printf '%s\n' "$css" | grep -oE 'https://fonts\.gstatic\.com/[^)]+\.woff2' | sort -u | while read -r u; do
    curl -sf "$u" -o "assets/fonts/$(basename "$u")"
  done
  printf '%s\n' "$css" | sed -E 's#url\(https://fonts\.gstatic\.com/[^)]*/([^/)]+\.woff2)\)#url(assets/fonts/\1)#g' > "assets/fonts/$1.css"
}
fetch_fonts film "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700&family=Space+Mono:wght@400;700&display=swap"
fetch_fonts dither "<the dither look's fonts_url>"
fetch_fonts jp "<a Japanese family's fonts_url>" 'latin|latin-ext'       # CJK faces: only the subsets the film shows
cat assets/fonts/*.css > assets/fonts.css
```

- The build inlines `assets/fonts.css` into `index.html`, so the paths start at `assets/fonts/`.
- Japanese, Chinese and Korean families ship hundreds of `unicode-range` files (one such family came to about 1,000 files and 14 MB). Pass the subsets the film's text uses, for example `'latin|latin-ext'`, plus `cyrillic` for Russian lines. Keep the full set only when the film shows text in that script.
- The edge check (`scripts/edge-check.mjs`) also lists families that are used but never declared. See [qa.md](qa.md).
- A look whose faces are wider than your layout gets a copy of the face with `size-adjust` under a new family name. Test the look with that copy.

## 4. Reference images

The art style's `prompt_template` is the recipe. Fill it, do not rewrite it.

- Fill `{subject}` with the shot: who, doing what, where. Fill `{palette}` from the scene's palette. Where there is `{composition}`, use the matching `slot_recipes` entry or your shot framing.
- Where the template ends with "Full frame.", add the framing after it: "Wide establishing shot, 16:9 film frame." or "Tall 9:16 frame, subject in the upper half."
- Use the entry's `negative_prompt` if your image model takes one. Pass `reference_image_urls` (the style's own gallery) if it takes reference images.
- Keep characters identical in every shot: make one character sheet per character first, then pass it as a reference image in every call that shows them. Describe the fixed traits (hair colour, clothes, silhouette) in every prompt.
- Screens, signs and paper in the picture: ask for "a plain blank glowing screen" or "a blank sign". Draw the text in code on top. The model often draws labels, numbers and dial faces anyway, even when the prompt forbids them: blank those regions before tracing (section 5).
- Limited animation (a blink, a turn, a tear): call the image edit endpoint with the generated shot as the first reference. Prompt: "The exact same image, same composition, camera, colours and lighting; only change: ...". Trace each frame. Swap the frames on the timeline at 8 to 12 fps.
- Parallax: generate the character alone "on a flat pure white background, full figure, no shadow on the ground". Cut it out: flood-fill the white from the corners, then make it transparent. Generate the background plate "with no people". Trace the two separately.
- Save everything in `refs/`. Nothing in `refs/` is ever loaded by a scene.

## 5. Trace to vectors

Trace each reference into a few flat tone plates with potrace. Plate k covers every pixel at least as dark as tone k, and the plates are painted light to dark, so there are never gaps between them. The result is one JS file per image that registers `window.ART[name]`.

```python
# trace.py: python3 trace.py refs/shot-01.png shot-01 art [--tones 5] [--smooth 3] [--speckle 24]
import argparse, json, os, re, subprocess, tempfile
import numpy as np
from PIL import Image, ImageFilter

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('name'); ap.add_argument('outdir')
ap.add_argument('--tones', type=int, default=5)      # flat tones (plates)
ap.add_argument('--width', type=int, default=1280)   # trace size; vectors scale to any frame
ap.add_argument('--smooth', type=int, default=3)     # median filter: melts dots and noise (1 keeps small faces)
ap.add_argument('--speckle', type=int, default=24)   # drop blobs smaller than this many pixels
a = ap.parse_args()

im = Image.open(a.src).convert('RGBA')
if im.width > a.width:
    im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
W, H = im.size
seen = np.array(im.getchannel('A')) > 127           # transparent pixels (cutouts) stay out of every plate
rgb = im.convert('RGB')
if a.smooth > 1:
    rgb = rgb.filter(ImageFilter.MedianFilter(a.smooth | 1))
rgb = rgb.filter(ImageFilter.GaussianBlur(0.8))
q = rgb.quantize(colors=a.tones, method=Image.Quantize.FASTOCTREE, kmeans=4)
pal = np.array(q.getpalette()[:3 * a.tones]).reshape(-1, 3)
light_to_dark = np.argsort(-(pal @ [0.2126, 0.7152, 0.0722]))
rank = np.argsort(light_to_dark)                    # palette index -> 0 (lightest) .. tones-1 (darkest)
tone = rank[np.array(q)]
tone[~seen] = -1
tmp, plates = tempfile.mkdtemp(), []
for k, idx in enumerate(light_to_dark):
    mask = tone >= k                                # plate k covers every pixel at least as dark as tone k
    if not mask.any():
        continue
    Image.fromarray(np.where(mask, 0, 255).astype(np.uint8)).convert('1').save(f'{tmp}/p.pbm')
    subprocess.run(['potrace', f'{tmp}/p.pbm', '-s', '-o', f'{tmp}/p.svg', '-t', str(a.speckle), '-a', '1.0', '-O', '0.4', '--flat'], check=True)
    svg = open(f'{tmp}/p.svg').read()
    d = ' '.join(re.findall(r' d="([^"]+)"', svg)).replace('\n', ' ')
    if d.strip():
        tr = re.search(r'<g transform="([^"]+)"', svg).group(1)
        plates.append(f'<g data-plate="{len(plates)}" fill="#%02x%02x%02x"><g transform="{tr}"><path d="{d}"/></g></g>' % tuple(pal[idx]))
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">{"".join(plates)}</svg>'
os.makedirs(a.outdir, exist_ok=True)
js = f'window.ART=window.ART||{{}};window.ART[{json.dumps(a.name)}]={{w:{W},h:{H},svg:{json.dumps(svg)}}};\n'
open(os.path.join(a.outdir, a.name + '.js'), 'w').write(js)
print(a.name, f'{W}x{H}', len(plates), 'plates', round(len(js) / 1024), 'KB')
```

Settings that work:

- Black-and-white manga or flat art: `--tones 5 --smooth 5 --speckle 30`. About 0.1 to 0.4 MB per full frame.
- Colour key art with small faces: `--tones 12 --smooth 1 --speckle 12`. `--smooth 5` melts eyes and mouths. About 0.7 MB.
- Printed screentone (halftone dots): blur the dots away first, or every dot becomes a path and the file reaches 4 MB.
- Keep each file under about 1.4 MB and look at the traced frame next to its reference before you use it.

Plates with text: blank every label, number or dial face the model drew, then trace. The tracer keeps transparent pixels out of every plate, so each blanked region becomes a hole where the scene draws its own label or dial in code. Reason: model text is garbled and cannot be restyled (rule 6).

```python
# blank.py: python3 blank.py refs/plate.png refs/plate-blank.png --box 120,80,420,160 [--circle 900,300,70]   (source pixels)
import argparse
from PIL import Image, ImageDraw
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--box', action='append', default=[]); ap.add_argument('--circle', action='append', default=[])
a = ap.parse_args()
im = Image.open(a.src).convert('RGBA'); alpha = im.getchannel('A'); d = ImageDraw.Draw(alpha)
for b in a.box: d.rectangle(tuple(map(int, b.split(','))), fill=0)            # x0,y0,x1,y1
for c in a.circle: x, y, r = map(float, c.split(',')); d.ellipse((x - r, y - r, x + r, y + r), fill=0)   # cx,cy,r
im.putalpha(alpha); im.save(a.out)
print(a.out, len(a.box) + len(a.circle), 'regions blanked')
```

If you want to fill plates with SVG patterns later (screentone, hatching), bake potrace's `transform` into the path coordinates first, so `userSpaceOnUse` patterns render at their true size.

A small art helper places the art and re-inks it for a look. Load it once in the built `index.html`:

```js
// art/art.js: placeArt(host, name, { fit, inks }) and reinkArt(ramp)
(function () {
  const placed = new Set(); let ramp = null;              // null: each scene's own inks
  function ink(svg) {
    const r = ramp || (svg.dataset.inks ? JSON.parse(svg.dataset.inks) : null), gs = [...svg.querySelectorAll('g[data-plate]')];
    gs.forEach((g, k) => {
      if (!g.dataset.own) g.dataset.own = g.getAttribute('fill');
      g.setAttribute('fill', r ? r[Math.round(k * (r.length - 1) / Math.max(1, gs.length - 1))] : g.dataset.own);
    });
  }
  window.placeArt = function (host, name, opts = {}) {
    const A = window.ART && window.ART[name];
    if (!A) throw new Error('art not loaded: ' + name);
    host.innerHTML = A.svg;
    const svg = host.querySelector('svg');
    svg.setAttribute('preserveAspectRatio', opts.fit || 'xMidYMid slice');
    svg.style.cssText = 'width:100%;height:100%;display:block';
    if (opts.inks) svg.dataset.inks = JSON.stringify(opts.inks);   // a scene's own ramp, light to dark
    placed.add(svg); ink(svg); return svg;
  };
  window.reinkArt = function (r) { ramp = r || null; placed.forEach(svg => (svg.isConnected ? ink(svg) : placed.delete(svg))); };
})();
```

A flat ramp is the baseline. Richer inks (screentone patterns, two plates printed off register, pencil hatching) go in the same `ink` function.

## 6. The build

This section is the build contract; the other files link here. `scripts/build.mjs` in this skill's folder implements it in about 70 lines. Copy it into your video project and extend it there:

```sh
cp "$SKILL_DIR/scripts/build.mjs" .
node build.mjs --frame wide              # out/wide/
node build.mjs --frame vert              # out/vert/
```

**Inputs:** `song/lyrics.json`, `song/timing.json`, `song/song.wav`, `scenes.json`, `compositions/<frame>/sNN.html`, `art/` (with `art/art.js`), `assets/` (with `assets/fonts.css` and `assets/fonts/`), and `looks.json` for `--look`.

**Outputs:** `out/<frame>/` (or `--out`):

- `index.html`: a standalone HyperFrames composition. It holds the song as an `<audio>` clip and one host per scene at the scene's start.
- `timing.js`: `window.FILM = { duration, scenes: { s01: { start, dur, lines: [{ id, text, en, lang, t, end, words: [{ w, t, end }] }] } } }`. Line and word times are relative to the scene start. Scenes read nothing else.
- Real copies of `compositions/<frame>/`, `art/` and `assets/`, plus `assets/song.wav`. Reason: `check` and `snapshot` skip scene files reached through a symlinked folder.

| Flag | What it does |
| --- | --- |
| `--frame wide` or `vert` | 1920x1080 from `compositions/wide/`, or 1080x1920 from `compositions/vert/`. Default `wide`. |
| `--only s04,s05` | Those scenes back to back from 0, without audio. For checking scenes. |
| `--window from,to` | Only the scenes that overlap that stretch of the song, placed relative to `from`. The song is trimmed to match (`data-media-start`) unless `--mute`. For chunked renders and live windows; use scene starts as bounds. |
| `--mute` | No audio. |
| `--look id` | Applies a look from `looks.json`: its tokens on every scene and its ink ramp on the art. For testing looks. |
| `--out dir` | The output folder. Default `out/<frame>`. |

What the build does for you:

- **Scene starts sit on the 30 fps frame grid:** one frame before the frame that holds the first line's `t`. The first scene starts at 0, and a scene ends where the next one starts. Reason: chunk bounds and live windows come from scene starts, so every chunk is a whole number of frames.
- **Scenes with no sung lines** (an intro, an instrumental break, the outro) give `"start"` in seconds in `scenes.json`. The build rounds it to the nearest frame. Any scene may give `"start"` to override the computed one.
- **Art:** it loads `art/<name>.js` for every literal name in a `placeArt(host, 'name', ...)` call in the scene file, plus the names in the scene's optional `"art"` list (names built at runtime, such as animation frames). A missing file stops the build.
- **Fonts:** it inlines `assets/fonts.css` into `index.html`, so the `url()` paths in it start at `assets/fonts/`.
- **No song yet:** without `song/song.wav` it builds without audio and says so. It also says when `song/timing.json` is provisional.
- **Errors:** it stops with a message when a scene names a line that is missing from `song/lyrics.json` or `song/timing.json`, or when scene starts are out of order.

## 7. A scene file

Each scene is a HyperFrames sub-composition. Put `<style>` and `<script>` inside the `<template>`, give the template root the scene id, and register exactly one paused timeline under that id, after it is built.

```html
<template>
  <style>
    #root { --k-paper: #FFFFFF; --k-surface: #FFFFFF; --k-ink: #120E18; --k-on-surface: #120E18; --k-muted: #5B5566; --k-line: #120E18;
      --k-accent: #FFF26A; --k-accent-2: #120E18; --k-accent-3: #120E18; --k-text-2: #120E18; --k-text-3: #120E18; --k-on-accent: #120E18;
      --k-font-display: 'Anton', sans-serif; --k-font-body: 'Inter', sans-serif; --k-font-mono: 'Space Mono', monospace;
      --k-lh-display: 1.08; --k-lh-body: 1.12; --k-radius: 0px; --k-shadow: none;
      position: absolute; inset: 0; overflow: hidden; background: var(--k-paper); color: var(--k-ink); }
    #s07-shot { position: absolute; left: -90px; top: -50px; width: 2100px; height: 1180px; }
    #s07-cap { position: absolute; left: 96px; right: 96px; bottom: 96px; font: 700 76px/var(--k-lh-display) var(--k-font-display); letter-spacing: -0.02em; }
    #s07-cap span { display: inline-block; margin: 0 0.16em 0.16em 0; padding: 0.04em 0.14em; background: var(--k-paper); color: var(--k-ink); }
    #s07-cap .key { background: var(--k-accent); color: var(--k-on-accent); }    /* text over art always sits on a block */
    .k-credit { position: absolute; left: 32px; bottom: 28px; padding: 6px 12px; font: 600 22px/1 var(--k-font-body); background: var(--k-paper); color: var(--k-ink); }
  </style>
  <div id="root" class="scene" data-composition-id="s07" data-width="1920" data-height="1080">
    <div id="s07-shot" data-bleed data-layout-allow-overflow></div>
    <div id="s07-cap"></div>
    <div class="k-credit" data-kind="art style">art style: Keylight, katagami.ai</div>
  </div>
  <script>
    (() => {
      const id = 's07', S = window.FILM.scenes[id];
      const all = document.querySelectorAll('[data-composition-id="s07"]'), last = all[all.length - 1];
      const root = last.classList.contains('scene') ? last : last.querySelector('.scene');   // the template root, not its host
      const tl = gsap.timeline({ paused: true });
      placeArt(root.querySelector('#s07-shot'), 'shot-07a', { inks: ['#FFFFFF', '#B9B4C2', '#120E18'] });
      tl.fromTo('#s07-shot', { scale: 1 }, { scale: 1.06, duration: S.dur, ease: 'none' }, 0);     // every shot moves
      const L = S.lines[0], cap = root.querySelector('#s07-cap');
      cap.lang = L.lang || 'en';
      L.words.forEach((w, i) => {
        const s = document.createElement('span'); s.textContent = w.w;
        if (i === L.words.length - 1) s.className = 'key';                                    // the punchline word
        cap.appendChild(s);
        tl.fromTo(s, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power3.out' }, w.t);          // never before it is sung
      });
      window.__timelines[id] = tl;
    })();
  </script>
</template>
```

- Times come only from `S` (the scene's lines and words). Reason: a re-align or a re-recorded take then needs only a rebuild.
- Prefix every id with the scene id (`#s07-cap`). The one exception is the template root, which is always `id="root"`. Reason: ids must be unique across the assembled film.
- Give the template root a class (`scene`) and find it by that class, as above. Reason: the runtime can leave `data-composition-id` only on the host, and a helper that returns the host puts every class and token lookup outside the scene.
- Declare the scene's current look as token defaults on `#root`, and use only `var(--k-...)` for colours, fonts, radii and shadows, in CSS and in SVG drawn from JavaScript (`fill="var(--k-ink)"` works). Reason: a look then restyles every element.
- Faces change per look. Size every text box for the widest face in any look, anchor stamps and labels by their centre or far end, and take multi-line line-height from `var(--k-lh-display)` / `var(--k-lh-body)`. Reason: a wider face then grows away from edges and lines, and a tall-boxed face does not collide with its own lines.
- Append elements that JavaScript creates to a container in the scene's markup. Reason: an element appended to the host sits outside the scene's token scope and keeps the defaults when the look changes.
- Non-English lines: the native script large, the `en` translation smaller, both on screen together. Set `lang` on the element and keep a Latin family first in the font stack; do not name a system CJK or Devanagari font. Reason: `lang` makes the browser pick the right glyphs, and a named system font differs from machine to machine.
- Credit the look in the frame, small: a `.k-credit` element with `data-kind="art style"` or `data-kind="design language"` and the text "art style: Name, katagami.ai". Reason: viewers see where the look comes from, and the live page swaps the design language credit by its `data-kind`.
- Use a seeded random number generator (mulberry32) instead of `Math.random`. Reason: chunks render in parallel, and every run must draw the same frame.
  `const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };`

HyperFrames' own skills (`npx hyperframes skills`) cover the full composition contract, GSAP use and the lint rules.

## 8. Shots, camera and cuts

- Cut on lyric words and beats: read `S.lines[i].t` and `S.lines[i].words[j].t`.
- Every shot moves: push in (scale 1.0 to 1.08), pan across a wider plate, a small dutch tilt, a whip pan with speed lines, or a smash cut on a hit. No still hold longer than about 1.2 s. Reason: in a music video a still frame reads as a freeze.
- Put art in an oversized shot container (for example 2100x1180 in a 1920x1080 frame) and mark it `data-layout-allow-overflow`. Reason: pushes and pans never show an edge, and `check` knows the overflow is meant.
- Draw effects in SVG or DOM on the timeline: speed lines, 1 to 2 frame impact flashes, sparkle blooms, rain, screen flicker, 2 to 3 frame camera shake. No CSS animations. Reason: CSS animations run on the wall clock, and the renderer seeks.
- The first frame of every scene is already designed, never blank. Reason: a chunk, a thumbnail or a live window can start on it.
- Swap limited-animation frames and shots with `tl.set` on `opacity` or `display`. Reason: `visibility: visible` overrides the runtime hiding the scene.

## 9. Many scenes, many agents

Parallel agents speed up a 40-scene film. Give them:

1. One brief file: the hard rules, the token contract, the scene file shape, the verify commands and a table of scene, mode, language and art style. Say when the timing is provisional.
2. One finished reference scene to copy.
3. Their own scene ids and nothing else to edit.
4. A gate every scene must pass, run by the lead, not only by the agent:

```sh
grep -nE "<img|data:image|url\\(['\"]?[^#'\")]|Math\\.random|Date\\.now|new Date|performance\\.now|setTimeout|setInterval|tl\\.call|repeat: ?-1|@keyframes|visibility: ?visible" compositions/*/s*.html
grep -L 'var(--k-' compositions/*/s*.html        # scenes that never read a token
```

The first command must print nothing. `url(#id)` references to SVG patterns are allowed; any other `url(` loads an image. Then look at every hex colour outside the `#root` token block: each one is a colour that will not restyle. Then build each scene in every restyle look and snapshot one key moment of each ([qa.md](qa.md), stage 4).

## Rules

- Honour the chosen language's tokens and the art style's recipe exactly. Reason: the Katagami credit on screen promises that look.
- Keep a system of two or three modes across the film. Reason: variety inside a system reads as a style, and variety without one reads as noise.
- Never ship the image model's pixels or its text. Reason: every frame stays code, and code can be restyled and translated.
- Check each traced image next to its reference. Reason: smoothing that cleans a background can erase a face.
- Build one reference scene end to end before the others. Reason: every later scene copies its mistakes too.

## Done when

- [ ] `scenes.json` has every line in exactly one scene, each with an idea and its Katagami entries.
- [ ] `looks.json` has every mode, the original look and every restyle look; each mode and restyle look has all nineteen tokens, fonts and inks, and its text pairs reach 4.5:1.
- [ ] Every scene's `--only` build passes `npx hyperframes check` with 0 errors, and its snapshots look designed from the first frame.
- [ ] The grep gate prints nothing, and every hex colour outside the token block is justified.

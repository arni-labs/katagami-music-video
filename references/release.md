# The release kit

Read this when the film is final, in either mode: the versions for each platform, the encodes, the covers, the
Katagami recipe, the post drafts, distribution and the film's page. The agent prepares everything; the user posts,
signs in, pays and submits.

## 1. Versions for each platform

| | Code film (mode A) | Cinematic cut (mode B) |
| --- | --- | --- |
| TikTok | the full 9:16 film | none |
| Instagram Reels | a 9:16 short cut | a 16:9 short cut |
| YouTube Shorts | the same 9:16 short cut | none |
| YouTube | the full 16:9 film as an ordinary video | the full 16:9 film as an ordinary video |
| X | the full 16:9 film on a paid account, else the short cut | the full 16:9 film on a paid account, else the short cut |

- Generated video stays 16:9 everywhere: no 9:16 crop, no Short ([cinematic-cut.md](cinematic-cut.md)).
- One short cut of 2:18 or less fits every platform's limit for a non-paying account (section 9 has the numbers).
- Every 9:16 version passes the zone check in [vertical.md](vertical.md), section 2, short cuts included.

## 2. Short cuts

- Cut at the song's own stops, on the beat grid: for example the opening through the first chorus, then straight to
  the ending.
- Re-encode once; never stream-copy across a join.
- Check the joined file: the exact frame count; the picture best matched at offset 0 against two frames either side;
  the audio's cross-correlation with the song within 2 ms. Make sure the check fails on purpose for a cut one frame
  off (33 ms of lag).
- Fade the audio 10 ms out and 80 ms in at each join. The 80 ms fade in hid a ringing consonant at one join.
- Check the type at each join too. Reason: one short cut kept a sung line on screen for 43 frames after its audio had
  been cut.
- A hook cut of about 50 s can go out as a second post a few days later.

## 3. Encodes

The renders are full-range colour. Convert to standard video colour (BT.709, limited range) for every upload. Reason:
some apps showed full-range files washed out or too dark.

```sh
CONV="scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuv420p"
TAGS="-color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709"
# the upload master: YouTube, X, TikTok
ffmpeg -v error -y -i renders/wide.mp4 -vf "$CONV" -c:v libx264 -preset slow -crf 17 -maxrate 16M -bufsize 32M -profile:v high \
  -r 30 -fps_mode cfr -x264-params keyint=60:min-keyint=30:open-gop=0 $TAGS -c:a aac -b:a 256k -ar 48000 -movflags +faststart renders/wide-master.mp4
# a smaller copy for phones and chat apps: two-pass, about 2.7 Mbps (the cinematic cut uses its 16:9 render here)
ffmpeg -v error -y -i renders/vert.mp4 -vf "$CONV" -c:v libx264 -preset medium -b:v 2700k -pass 1 -an -f mp4 /dev/null
ffmpeg -v error -y -i renders/vert.mp4 -vf "$CONV" -c:v libx264 -preset medium -b:v 2700k -maxrate 5M -bufsize 10M -pass 2 -r 30 \
  $TAGS -c:a aac -b:a 160k -ar 48000 -movflags +faststart renders/vert-phone.mp4
# web copies for the film's page
ffmpeg -v error -y -i renders/wide.mp4 -vf "scale=1280:720,$CONV" -c:v libx264 -crf 25 -maxrate 3M -bufsize 6M $TAGS -c:a aac -b:a 160k -movflags +faststart renders/web-wide.mp4
```

- Check the input first (`ffprobe -show_entries stream=color_range,color_space`). A file already in limited BT.709 needs
  no conversion.
- Upload the master, not the web copy. Reason: the platform re-encodes the upload, so it should start from the best
  copy.
- Check each platform's current upload limits before you post (section 9).

## 4. Covers

- **One design in several shapes:** a 3000 px square for the stores, a 9:16 reel cover, a 1920x1080 poster and
  thumbnail, a 1200x630 link card (also the recipe's cover). Show three small directions before you finish any.
- **Draw covers in code at their final size;** never enlarge a film frame. Reason: an AI upscaler invented brush texture
  in a cover and it was withdrawn. The stores also ask for art that was not upscaled.
- **Check every cover at thumbnail size.** Reason: at 160 px a 9:16 cover's title was 6 px tall and unreadable.
- **Store covers:** 3000x3000 sRGB JPEG with no embedded colour profile; no URL, handle, logo, QR code or price; never
  the same art as another release. Keep a title-only spare in case one is refused.
- **Per platform:** TikTok's cover is a frame of the video, so hold the cover as the film's last second. Instagram takes
  a cover image before you share, and it cannot change later; keep the title inside the middle 1080x1350. A custom
  Shorts thumbnail needs a verified channel and YouTube Studio on a computer.
- Pin covers to frames of a frozen copy of the footage, so a shot re-trimmed later cannot change an approved cover.

## 5. The Katagami recipe

A recipe on katagami.ai shows a finished piece with the ingredients it used and the method, so others can make their
own. The agent prepares it; **publishing it needs a Katagami curator.** The public connector can make ingredients
(`create_item`) but not recipes, so hand the prepared recipe to the user to pass to a curator.

1. **Audit the film.** List every look on screen. Each must be a Katagami entry: design languages, art styles,
   palettes, code art. A look that is not one yet becomes one first, through the connector, with a gallery drawn from
   its own prompt. This reaches the small things too: a type layer's red, a window's radius and shadow come from a
   language's tokens. Reason: the user's rule, after a look was called "not a Katagami art style at all": "everything
   should be made with Katagami ingredients to become a recipe".
2. **Check every ingredient opens signed out:** Published and shown to visitors. Call `get_library_entry` for each id
   without signing in (a JSON-RPC `tools/call` POST to `https://katagami.ai/mcp` with no token and the header
   `Accept: application/json, text/event-stream`). Reason: an ingredient
   off the visitor shelf shows on the recipe page as a bare name, with no link or picture.
3. **Use current ids.** Say on which
   date the film used each language ([planning.md](planning.md), section 3).
4. **Write the recipe:** `recipe.json` (ingredients, the film's public URL) and `RECIPE.md` in seven sections: What it
   is, How the ingredients are used, Method, You can change, Must hold, Make your own, How it was made (numbered
   steps, each a bold title and one sentence; the page builds its step cards from them). Add a 1200x630 cover and a
   preview: about 10 s, 960 px wide, muted, under 1 MB, encoded in two passes (a fixed CRF turned the grain blocky).
5. **The film's URL must be public and load.** A preview link was refused.
6. Before handing it over, check whether it is already live. Reason: once a recipe had been published by another
   session while its checklist was still being prepared.

## 6. Post drafts

- **Only the user posts** ([SKILL.md](../SKILL.md), rule 13). Agents never post, reply, quote, repost or schedule on
  the user's accounts, even when a tool or credential for it is available. The user's words: "only I the human post".
- Use the platforms' own schedulers for timed posts. Reason: a laptop slept through two agent-timed slots.
- Write two options per platform, at most 5 hashtags on Instagram and 2,200 characters.
- Links do not click in TikTok or Instagram captions or Shorts descriptions ("link in bio"); they do in an ordinary
  YouTube description. Give a long YouTube upload chapters and the full lyrics.
- Turn on each platform's AI label: TikTok's AI-generated label, Instagram's "AI info", YouTube's "altered or
  synthetic content". Keep Content ID off.
- Credit what each cut contains: the code film names its Katagami looks; the cinematic cut also names its video model.
  Credit a tool by its own account, and check that the handle is live before posting. Licence-required credits (a
  CC BY-SA stroke set, say) go in the caption too, because the app covers the end credits.
- **Claim exactly what is true.** "Every frame is JavaScript" or "no generated image on screen" for the code film, never
  "no image model" (image models made its references). The cinematic cut is generated video, and says so.
- **Name versions for viewers,** never by a vendor's product name: "the cinematic cut", not the model's name. Credit the
  model separately. Keep vendor names off covers.
- Take every figure (shots, takes, minutes, cost) from the final data. Reason: one film's shot count appeared as four
  different numbers across its notes.

## 7. Distribution

- Use a distributor that accepts AI-assisted music and asks about it (DistroKid did in October 2026; CD Baby and
  TuneCore did not).
- Check the song's rights first: Suno grants commercial rights only for songs made on a paid plan. Ask the user.
- Masters: 44.1 kHz, 16-bit WAV from the best file you have. Convert a lossy file once; do not remaster it. Measure the
  loudness; streaming services normalise to about -14 LUFS, so a master near -16 LUFS needs nothing.
- Store lyrics follow what the take sings, in the store's format; they differ from the screen text on purpose.
- Never list an AI tool or Katagami as an artist. Two takes of one song can be one release with one cover.
- Post the videos first. Distributor review takes several days, then the stores a few more.
- The agent fills the distributor's form; the user signs in, pays, ticks the legal boxes and submits.
- A Spotify Canvas loop: 3 to 8 s, 9:16, one continuous stretch with no singing and no cuts, added after delivery.

## 8. The film's page

- Once a link is public, change it only through a preview path, and ship to the public link once. After each deploy,
  check the public files are byte-identical to what you meant to ship.
- Only one session deploys. Reason: two sessions deployed competing versions of one page on the same day.
- Deploy finished pages only. A stock deploy script can ship every folder that has an `index.html`, so deploy from a
  copy without the unfinished page.
- Use the title card as the page's poster, not a frame at a fixed time. Reason: a frame at 4 s landed on a transition
  after a re-cut.
- A video in a GitHub README plays only as an uploaded attachment (10 MB on the free plan); a `<video>` tag pointing at
  a repo file is stripped.

## 9. Numbers

Check these before use; platforms change them.

- **Length (October 2026):** TikTok up to 60 min; Reels up to 20 min, but over 3:00 is not shown to non-followers;
  Shorts 3:00 or less; X 140 s and 512 MB without a paid plan.
- **Encode:** H.264 High, 30 fps constant, CRF 17 capped at 16 Mbit/s, a keyframe every 2 s; AAC 48 kHz; BT.709
  limited range. X caps at 40 fps and 25 Mbit/s.
- **Covers:** store square 3000x3000; Instagram cover 420x654 shown; Shorts thumbnail 2160x3840; link card 1200x630;
  YouTube thumbnail 1280x720 or larger.
- **Captions:** Instagram at most 5 hashtags and 2,200 characters; TikTok 2,200 characters; YouTube title 100,
  description 5,000.

## Done when

- [ ] Each platform's version exists, re-encoded once in BT.709, and its checks passed (frames, sync, type at joins).
- [ ] Every 9:16 version passed the zone check.
- [ ] Covers read at thumbnail size, in every shape.
- [ ] The recipe draft lists only Katagami entries that open signed out, with current ids, and the user has it for a
      curator.
- [ ] Post drafts are written for the user to post, with true claims, live handles and figures from the final data.

# Live restyle page

Read this for the optional last stage: a web page where viewers tap the film to restyle it live in other Katagami looks. Do it after both films render and pass QA.

## What the page does

- It plays the rendered MP4 by default. The MP4 carries the sound, always.
- A tap on the film (or on a style chip) moves to the next look: original, then each Katagami look in `looks.json`, then back to original.
- In a restyle look the page lays a live HyperFrames window over the video. The window plays the same moment, muted, in the tapped look: every code-drawn element takes the look's design language tokens and the traced art takes its inks.
- Back to original hides the live windows, and the MP4 shows again.

## Files the site needs

```
site/
  index.html                     the page
  film/wide.mp4, film/vert.mp4   the web copies (renders/web-wide.mp4, renders/web-vert.mp4); sound lives here
  film/live.json                 the live windows per frame
  film/live-wide-00.html ...     one small HyperFrames page per window
  film/live-vert-00.html ...
  film/compositions/ art/ assets/ shared by every window
  film/vendor/                   pinned copies of the HyperFrames runtime, the player and GSAP
```

Pick the frame from the screen: a portrait phone gets `film/vert.mp4` and the `vert` windows, everything else gets `film/wide.mp4` and the `wide` windows.

## Build the live windows

1. Cut the film into windows at scene boundaries, each at least about 6 s long. Reason: a short window keeps a phone's memory low, and 6 s or more keeps loads and handovers rare.

```js
const windows = []; let from = 0;
scenes.forEach((s, i) => {
  const end = i < scenes.length - 1 ? scenes[i + 1].start : duration;
  if (end - from >= 6 || i === scenes.length - 1) { windows.push([from, end]); from = end; }
});
```

2. Build each window as its own small HyperFrames page: only the scenes that overlap `[from, to]`, times shifted so the window starts at 0, no audio. The starter `build.mjs` does this: `node build.mjs --frame wide --mute --window 9.09,19.11 --out site/film/live-wide-01`. Each build is a folder (`index.html`, `timing.js`, `compositions/`, `art/`, `assets/`). To share files between windows, save its `index.html` as `film/live-wide-01.html` and its `timing.js` as `film/timing-live-wide-01.js` (update the script tag), and keep one copy of `compositions/`, `art/` and `assets/` in `film/`.
3. Serve every window from one folder, sharing `compositions/`, `art/` and `assets/`. Copy the HyperFrames runtime (`hyperframe.runtime.iife.js` from the `hyperframes` package's `dist/`) and GSAP into `film/vendor/`, and load those. Reason: the page then keeps playing the film you tested.
4. Write the manifest:

```json
{ "frames": { "wide": { "w": 1920, "h": 1080, "windows": [[0, 9.09, "live-wide-00.html"], [9.09, 19.11, "live-wide-01.html"]] },
              "vert": { "w": 1080, "h": 1920, "windows": [[0, 9.09, "live-vert-00.html"]] } } }
```

## Embed a window

The documented route is the `@hyperframes/player` web component. Vendor it at the same version as the runtime:

```sh
npm i -D @hyperframes/player@<the hyperframes version>
mkdir -p site/film/vendor && cp node_modules/@hyperframes/player/dist/hyperframes-player.global.js site/film/vendor/
```

```html
<script src="film/vendor/hyperframes-player.global.js"></script>
<hyperframes-player src="film/live-wide-03.html" muted disable-click-to-play assets-loading-ui="none"></hyperframes-player>
```

- Wait for its `ready` event. Drive it with `play()`, `pause()`, `seek(t)` and `currentTime`.
- `player.iframeElement.contentDocument` is the window's document, for restyling. This works in the default same-origin sandbox, not with `sandbox-origin="opaque"`.
- `disable-click-to-play` leaves taps to your page. `low-power-idle` helps when several players sit paused.
- A plain `<iframe>` whose page loads the runtime also works: poll until `contentWindow.__player` exists and every scene host's timeline is registered in `window.__timelines`.

In each loaded window, add one rule to its `<head>` that takes out the scenes the runtime has hidden. The runtime hides a scene host with an inline style, so an attribute selector finds it:

```css
#root > [data-composition-src][style*="visibility: hidden"],
#root > [data-composition-src][style*="visibility:hidden"] { display: none !important; }
```

Reason: hidden scenes still cost layout and paint on every frame.

## Keep windows in sync

The code in this file is a sketch of the page's logic, not a library. `video` is the page's `<video>` element and `LOOKS` is the `looks` array of `looks.json`. The helpers it calls, one line each:

- `windowAt(t)`: the window from `live.json` whose `[from, to)` holds `t`, with `next` set to the one after it.
- `keepOnly(a, b)`: removes every loaded window except these two.
- `load(w)`: creates a hidden, muted `<hyperframes-player>` for `w`'s file, keeps it as `w.player`, and sets `w.ready` on its `ready` event.
- `quiet()`: true when the last tap was more than about 800 ms ago.
- `showChip(i)`, `showName(look)`: mark chip `i` as pressed, and show the look's name over the film for a moment.
- `ripple(x, y, look)`: a ripple at the tap point in the look's accent colour.
- `loadFonts(look)`: adds the look's `fonts` stylesheet to the page once, and resolves when its faces have loaded.
- `liveWindows()`: the loaded windows that are ready.
- `dressWindow(w, look)`: applies the look to one window (tokens, fonts, inks, credits; see "Restyle a window").
- `dressPage(look)`: sets the look's tokens on the page's own `:root`, for the chrome.
- `setLive(on)`: shows the ready windows over the video, or hides and pauses them and drops them about 4 s later.

```js
function tick() {
  const t = video.currentTime, w = windowAt(t);             // the window whose [from, to) holds t
  keepOnly(w, w.next);                                      // at most two windows alive
  if (w.next && t > w.to - 5 && quiet()) load(w.next);      // load ahead, in a pause between taps
  if (w.ready) {
    const lt = t - w.from, p = w.player;
    if (video.paused) { p.pause(); if (Math.abs(p.currentTime - lt) > 0.05) p.seek(lt); }
    else if (p.paused) { p.seek(lt); p.play(); }
    else if (Math.abs(p.currentTime - lt) > 0.12) { if (++w.drift >= 3) { p.seek(lt); p.play(); w.drift = 0; } }
    else w.drift = 0;
  }
  requestAnimationFrame(tick);
}
```

- A new window loads at the playhead, seeks to `video.currentTime - from` and plays muted over the video.
- Show a window only once it is ready. Until then the MP4 stays visible, so there is never a blank frame.
- Back to original: hide the windows and pause them. Drop them after about 4 s, in case a look comes straight back.

## Restyle a window

1. Tokens: one `<style>` element in the window's `<head>`, rewritten on every look change:
   `[data-composition-id],[data-composition-id] *{--k-paper:#FFFFFF !important;--k-ink:#1E120C !important;/* all 15 tokens */}`
   Target the hosts and all their descendants: a scene's own `#root` rule shadows tokens set only on the host.
2. Fonts: add the look's `fonts` stylesheet once per window, in a quiet moment. A look whose faces are wider than the film's gets `size-adjust` copies under renamed families, so the scenes keep their layout.
3. Art: call the window's art helper, `w.player.iframeElement.contentWindow.reinkArt(look.inks)`. `reinkArt(null)` restores each scene's own inks.
4. Credits: each scene's credit is a `.k-credit` element. Set the text of every `.k-credit[data-kind="design language"]` to `design language: <the look's language name>, katagami.ai`, and hide the `art style` credits while a restyle look is on. Reason: the art is re-inked in the look's colours, so its art style credit no longer describes what is on screen.
5. The page chrome (buttons, chips, the title) takes the same tokens from the page's own `:root`.

## Fast taps

A viewer taps in bursts. The page must answer every tap at once and restyle the film once.

- Every tap does only the cheap work, at once: the chip state, the look's name, a ripple at the tap point.
- The heavy work (tokens, fonts, relayout, re-ink of every window) runs once, after the taps pause. A lone tap applies after about 200 ms (or at once). A burst waits the viewer's own tap gap plus 20 ms, clamped to 170 to 350 ms.
- The burst always ends on the last look tapped. Drop stale work when a newer tap arrived.

```js
let wanted = 0, lastTap = 0, timer = 0;
function onTap(x, y) {
  wanted = (wanted + 1) % LOOKS.length;                     // original, look 1, look 2, ..., original
  showChip(wanted); showName(LOOKS[wanted]); ripple(x, y, LOOKS[wanted]);   // cheap: every tap, now
  const now = performance.now(), gap = now - lastTap, burst = gap < 400;
  lastTap = now;
  clearTimeout(timer);                                      // a newer tap replaces the pending restyle
  timer = setTimeout(() => applyLook(wanted), burst ? Math.min(350, Math.max(170, gap + 20)) : 200);
}
async function applyLook(i) {
  await loadFonts(LOOKS[i]);                                // cached after the first time
  if (i !== wanted) return;                                 // a newer tap arrived while fonts loaded
  for (const w of liveWindows()) dressWindow(w, LOOKS[i]);  // heavy: once per burst
  dressPage(LOOKS[i]);
  setLive(!!LOOKS[i].k);                                    // original shows the MP4 again
}
```

- Pre-warm every look's fonts after the first quiet moment, so the first restyle to a look does not wait.
- Leave very large font sheets (CJK families ship thousands of `unicode-range` faces) until that look is chosen. They slow every restyle once declared.
- Under `prefers-reduced-motion`, skip the ripple and any wipe; the look still switches.

## Guards

- Frame rate: count the live window's animation frames. Under about 14 fps for three 2 s checks in a row, step down to flat inks (patterns and screentone become flat tones). If it is still slow, play the MP4 for the rest of this visit and hide the chips.
- Remember the fallback in `sessionStorage`, not `localStorage`, so a new visit tries again.
- Crash memory: set a `sessionStorage` flag while a look is live and clear it on `pagehide`. iOS reloads a tab it killed for memory, and the flag survives: start that load in MP4-only mode.
- WebKit (Safari and every iPhone browser) repaints blend-mode textures and big vector art on the CPU. Hide texture and grain overlays there. With a plain iframe, size it at its display size and set CSS `zoom` on its document instead of `transform: scale()`, because WebKit paints the iframe at full size before scaling.
- A window whose scripts fail to load (a dropped request, a cold cache after a deploy) never becomes ready. Drop it after 8 s and load it again, at most twice.
- Offer URL switches for support: `?live=0` forces the MP4, `?live=1` clears a remembered fallback.

## Rules

- The MP4 owns the sound; live windows are always muted. Reason: two audio clocks drift, and the video element is the one clock everything follows.
- Cut windows at scene boundaries. Reason: the handover to the next window hides inside a cut.
- Keep at most two windows alive. Reason: each window holds its scenes and vector art, and phones kill tabs that run out of memory.
- Do the heavy restyle once per burst. Reason: a restyle relayouts every scene, and one that lands between taps makes the next tap lag.
- Test every look with the same injected rule the page uses. Reason: a token test placed inside a scene file is scoped to that scene and silently matches nothing.
- Pin the runtime and GSAP versions the windows load. Reason: the page must keep playing the film you checked.

## Done when

- [ ] Taps feel instant: chip, name and ripple answer within one frame.
- [ ] A 10-tap burst ends on the last look tapped within about 350 ms of the last tap.
- [ ] No audio stutter in any look: the MP4 owns the sound.
- [ ] Windows switch at scene cuts without a flash or a blank frame.
- [ ] Back to original shows the MP4, and the windows are dropped a few seconds later.
- [ ] Text is readable in every look (text on panels uses `--k-on-surface`, text on accents `--k-on-accent`, and text over art has a block behind it).
- [ ] It plays smoothly on a mid-range Android phone and in iPhone Safari, or falls back to the MP4 cleanly.
- [ ] Reduced motion is respected.

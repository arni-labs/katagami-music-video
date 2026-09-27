// build.mjs: write a HyperFrames project for one frame of the film. Copy it into your video project and extend it there.
//   node build.mjs [--frame wide|vert] [--only s04,s05] [--window from,to] [--mute] [--look id] [--out dir]
// Reads song/lyrics.json, song/timing.json, scenes.json, compositions/<frame>/sNN.html, art/, assets/ (and looks.json
// for --look). Writes out/<frame>/ (or --out): index.html, timing.js and real copies of compositions/<frame>/, art/, assets/.
// The contract is in references/scenes-and-styles.md, section 6.
import fs from 'node:fs';
const argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const frame = arg('--frame') || 'wide', [W, H] = frame === 'vert' ? [1080, 1920] : [1920, 1080];
const out = arg('--out') || `out/${frame}`, only = arg('--only')?.split(','), win = arg('--window')?.split(',').map(Number);
const read = f => JSON.parse(fs.readFileSync(f, 'utf8')), r3 = x => +x.toFixed(3), r4 = x => +x.toFixed(4);
const fail = m => { console.error('build: ' + m); process.exit(1); };
const lyrics = Object.fromEntries(read('song/lyrics.json').map(l => [l.id, l]));
const timing = read('song/timing.json'), scenes = read('scenes.json'), FPS = 30;

// scene starts sit on the frame grid: one frame before the frame that holds the first sung word (the first scene at 0);
// a scene with no sung lines gives "start" in seconds; a scene ends where the next one starts
scenes.forEach((s, i) => {
  for (const id of s.lines || []) if (!lyrics[id] || !timing.lines[id]) fail(`${s.id}: line ${id} is missing from ${lyrics[id] ? 'song/timing.json' : 'song/lyrics.json'}`);
  if (s.start == null && !s.lines?.length) fail(`${s.id} has no sung lines: give it "start" (seconds) in scenes.json`);
  s.start = i === 0 ? 0 : s.start != null ? r4(Math.round(s.start * FPS) / FPS) : r4(Math.max(0, Math.floor(timing.lines[s.lines[0]].t * FPS) - 1) / FPS);
  if (i && s.start <= scenes[i - 1].start) fail(`${s.id} starts at ${s.start}, not after ${scenes[i - 1].id}`);
});
scenes.forEach((s, i) => { s.dur = r4((scenes[i + 1]?.start ?? timing.duration) - s.start); });
const FILM = { duration: timing.duration, scenes: {} };
for (const s of scenes) FILM.scenes[s.id] = { start: s.start, dur: s.dur, lines: (s.lines || []).map(id => {
  const L = lyrics[id], T = timing.lines[id], rel = x => r3(x - s.start);
  return { id, text: L.text, en: L.en, lang: L.lang || 'en', t: rel(T.t), end: rel(T.end), words: T.words.map(w => ({ w: w.w, t: rel(w.t), end: rel(w.end) })) };
}) };

// the scenes in this build, and where each one starts in it (--only: back to back from 0)
let picked = scenes.filter(s => fs.existsSync(`compositions/${frame}/${s.id}.html`));
if (only) picked = picked.filter(s => only.includes(s.id));
if (win) picked = picked.filter(s => s.start + s.dur > win[0] + 0.01 && s.start < win[1] - 0.01);
if (!picked.length) fail(`no scenes to build (looked in compositions/${frame}/)`);
let cursor = 0;
const placed = picked.map(s => { const at = only ? cursor : win ? s.start - win[0] : s.start; cursor += s.dur; return { ...s, at: r4(at) }; });
const dur = r4(only ? cursor : win ? win[1] - win[0] : timing.duration);

// the art each scene places by a literal name, plus the names in its optional "art" list
const art = new Set(placed.flatMap(s => [...fs.readFileSync(`compositions/${frame}/${s.id}.html`, 'utf8')
  .matchAll(/placeArt\([^,]+,\s*['"]([^'"]+)['"]/g)].map(m => m[1]).concat(s.art || [])));
for (const a of art) if (!fs.existsSync(`art/${a}.js`)) fail(`art/${a}.js is missing (named by a scene)`);

// real copies, not symlinks: check and snapshot skip scene files reached through a symlinked folder
fs.rmSync(out, { recursive: true, force: true });
for (const d of [`compositions/${frame}`, 'art', 'assets']) if (fs.existsSync(d)) fs.cpSync(d, `${out}/${d}`, { recursive: true });
const audio = !argv.includes('--mute') && !only;
if (audio) { fs.mkdirSync(`${out}/assets`, { recursive: true }); fs.copyFileSync('song/song.wav', `${out}/assets/song.wav`); }
fs.writeFileSync(`${out}/timing.js`, `window.FILM = ${JSON.stringify(FILM)};\n`);
const look = arg('--look') && read('looks.json').looks.find(l => l.id === arg('--look'));
if (arg('--look') && !look) fail(`no look ${arg('--look')} in looks.json`);
const lookTags = look?.k ? `<style>[data-composition-id],[data-composition-id] *{${Object.entries(look.k).map(([n, v]) => `--k-${n}:${v}!important`).join(';')}}</style>\n<script>reinkArt(${JSON.stringify(look.inks)});</script>\n` : '';
const fonts = fs.existsSync('assets/fonts.css') ? `<style>\n${fs.readFileSync('assets/fonts.css', 'utf8').trim()}\n</style>\n` : '';

fs.writeFileSync(`${out}/index.html`, `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
${fonts}<script src="timing.js"></script>
<script src="art/art.js"></script>
${[...art].map(a => `<script src="art/${a}.js"></script>\n`).join('')}${lookTags}<style>html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: #000; } #root { position: relative; width: 100%; height: 100%; overflow: hidden; }</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${dur}" data-width="${W}" data-height="${H}">
${audio ? `<audio id="song" class="clip" data-timeline-role="music" data-start="0" data-duration="${dur}"${win ? ` data-media-start="${win[0]}"` : ''} data-track-index="0" src="assets/song.wav"></audio>\n` : ''}${placed.map(s => `<div id="${s.id}" data-composition-id="${s.id}" data-composition-src="compositions/${frame}/${s.id}.html" data-start="${s.at}" data-duration="${s.dur}" data-track-index="1" data-width="${W}" data-height="${H}" style="position:absolute;inset:0"></div>`).join('\n')}
</div>
<script>window.__timelines = window.__timelines || {};
window.__timelines["main"] = gsap.timeline({ paused: true });</script>
</body>
</html>
`);
console.log(`built ${out}: ${placed.length} scenes, ${dur} s, art ${art.size}${audio ? ', with audio' : ''}${look ? ', look ' + look.id : ''}`);

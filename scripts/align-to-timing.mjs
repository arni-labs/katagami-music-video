#!/usr/bin/env node
// Turn forced-alignment results into song/timing.json and song/labels.txt.
//   node "$SKILL_DIR/scripts/align-to-timing.mjs" [--sections align/sections.json] [--fixes file] [--duration seconds]
//   node "$SKILL_DIR/scripts/align-to-timing.mjs" --provisional
// Fixes default to song/timing-fixes.json when that file exists. --provisional needs no song: it lays the lines back to
// back from each line's "est" (estimated seconds), spreads the words evenly and marks the file "provisional": true, so
// scenes can be built before the song exists. The real alignment replaces it.
// Run it from the video project root. It reads song/lyrics.json and the aligner results that sections.json names
// (default: align/song.json holding every line, in order). A result is ElevenLabs-shaped: { words: [{ text, start,
// end, loss }] }, optionally wrapped in { result }. sections.json: [{ "file", "shift", "ids" }]: the lines of that
// aligned text in order ("~id" = a context line, aligned and dropped); song seconds = aligned seconds + shift. Several
// sections may share one joined file; they take its lines in the order listed. Fixes, in song seconds, by sung word:
// { "<id>": { "why": "...", "words": { "<sung word index>": [start, end] } } }. Needs Node 22+, and ffprobe unless
// --duration is given.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2), arg = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
const die = m => { console.error('align-to-timing: ' + m); process.exit(1); };
const read = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { die(`cannot read ${f}: ${e.message}`); } };
const r3 = x => +x.toFixed(3);
const lyrics = read('song/lyrics.json'), byId = Object.fromEntries(lyrics.map(l => [l.id, l]));
const lineOf = id => byId[id.replace(/^~/, '')] || die(`${id} is not in song/lyrics.json`);
const sections = arg('--sections') ? read(arg('--sections')) : [{ file: 'align/song.json', shift: 0, ids: lyrics.map(l => l.id) }];
const fixesFile = arg('--fixes') ?? (fs.existsSync('song/timing-fixes.json') ? 'song/timing-fixes.json' : null);
const fixes = fixesFile ? read(fixesFile) : {};
const provisional = argv.includes('--provisional');
let duration = arg('--duration');
if (duration == null && !provisional) try {
  duration = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', 'song/song.wav']).toString();
} catch { die('no --duration and ffprobe could not read song/song.wav'); }
duration = r3(+duration);

// What the aligner was given: sung spelling, parentheses stripped, split on spaces.
const sungWords = l => (l.sung ?? l.text).replace(/[()]/g, ' ').split(/\s+/).filter(Boolean);
// What the screen shows: words, or one character per word for Japanese and Chinese (punctuation stays attached).
function captionWords(l) {
  if (!/^(ja|zh)/.test(l.lang || '')) return l.text.split(/\s+/).filter(Boolean);
  const out = []; let open = '';
  for (const ch of l.text.replace(/\s+/g, '')) {
    if (/[\p{Ps}\p{Pi}]/u.test(ch)) open += ch;
    else if (/\p{P}/u.test(ch) && out.length) out[out.length - 1] += ch;
    else { out.push(open + ch); open = ''; }
  }
  return out;
}

// --provisional: each line lasts its "est" seconds, 0.25 s apart and 1.5 s more between sections, words spread evenly.
if (provisional) {
  const out = { provisional: true, duration: 0, lines: {} };
  let t = 0.5;
  lyrics.forEach((l, i) => {
    if (!(l.est > 0)) die(`${l.id} has no "est" (its estimated length in seconds)`);
    if (i && l.section !== lyrics[i - 1].section) t += 1.5;
    const caps = captionWords(l), n = sungWords(l).length, m = l.map, step = l.est / caps.length;
    out.lines[l.id] = { t: r3(t), end: r3(t + l.est), words: caps.map((w, k) => ({ w, t: r3(t + k * step), end: r3(t + (k + 1) * step) })) };
    if (m ? m.length !== caps.length || m.reduce((a, b) => a + b, 0) !== n : caps.length !== n)
      console.log(`${l.id.padEnd(8)} CHECK ${m ? '"map" does not fit' : 'no "map"'}: ${caps.length} caption words, ${n} sung words`);
    t += l.est + 0.25;
  });
  out.duration = r3(t + 1.5);
  fs.writeFileSync('song/timing.json', JSON.stringify(out, null, 1) + '\n');
  console.log(`wrote a provisional song/timing.json: ${lyrics.length} lines, ${out.duration} s`);
  process.exit(0);
}

// Each result file, split into lines at its line-break entries (or by sung word counts when it has none).
const files = {};
for (const s of sections) { s.ids.forEach(lineOf); (files[s.file] ??= { ids: [], next: 0 }).ids.push(...s.ids); }
for (const [file, F] of Object.entries(files)) {
  const raw = read(file), words = (raw.result ?? raw).words;
  if (!Array.isArray(words)) die(`${file} has no words array`);
  const groups = [[]];
  for (const w of words) { if (w.text.includes('\n')) groups.push([]); else if (w.text.trim()) groups.at(-1).push(w); }
  while (groups.length > 1 && !groups.at(-1).length) groups.pop();
  if (groups.length === F.ids.length) { F.lines = groups; continue; }
  const flat = groups.flat(), counts = F.ids.map(id => sungWords(lineOf(id)).length), total = counts.reduce((a, b) => a + b, 0);
  if (flat.length !== total) die(`${file}: ${groups.length} lines and ${flat.length} words, but its ids have ${F.ids.length} lines and ${total} sung words`);
  console.warn(`${file}: ${groups.length - 1} line breaks for ${F.ids.length} lines; split by each line's sung word count`);
  let k = 0; F.lines = counts.map(n => flat.slice(k, k += n));
}
const sung = {};
for (const s of sections) for (const id of s.ids) {
  const toks = files[s.file].lines[files[s.file].next++];
  if (id.startsWith('~')) continue;
  if (sung[id]) die(`${id} is in two sections`);
  sung[id] = toks.map(w => ({ text: w.text, start: w.start + s.shift, end: w.end + s.shift, loss: w.loss ?? 0 }));
}
for (const l of lyrics) if (!sung[l.id]?.length) die(`no aligned words for ${l.id}`);
for (const [id, f] of Object.entries(fixes)) {
  if (!sung[id]) die(`fix for unknown line ${id}`);
  for (const [k, [start, end]] of Object.entries(f.words || {})) {
    if (!sung[id][+k]) die(`fix ${id}: no sung word ${k}`);
    Object.assign(sung[id][+k], { start, end, fixed: true });
  }
}

// Caption words take the times of the sung words they stand for.
const at = (toks, x) => { const i = Math.min(toks.length - 1, Math.floor(x)), w = toks[i]; return w.start + Math.min(1, x - i) * (w.end - w.start); };
const letters = w => Math.max(1, (w.match(/[\p{L}\p{N}]/gu) || []).length);
const out = { duration, lines: {} }, rows = [];
for (const l of lyrics) {
  const toks = sung[l.id], caps = captionWords(l), flags = [];
  let words;
  if (caps.length === toks.length || l.map) {
    const counts = caps.length === toks.length ? caps.map(() => 1) : l.map;
    if (counts.length !== caps.length || counts.some(n => !Number.isInteger(n) || n < 1) || counts.reduce((a, b) => a + b, 0) !== toks.length)
      die(`${l.id}: "map" needs ${caps.length} entries of 1 or more that add up to ${toks.length} sung words (${toks.map(t => t.text).join(' ')})`);
    let k = 0;
    words = caps.map((w, i) => { const a = toks[k], b = toks[(k += counts[i]) - 1]; return { w, t: a.start, end: b.end }; });
  } else { // spread by letters across the sung words
    const L = caps.map(letters), sum = L.reduce((a, b) => a + b, 0), N = toks.length;
    let c = 0;
    words = caps.map((w, i) => { const a = c / sum * N; c += L[i]; return { w, t: at(toks, a), end: at(toks, c / sum * N) }; });
    flags.push('mapped by length');
  }
  for (let k = 1; k < words.length; k++) { words[k].t = Math.max(words[k].t, words[k - 1].t); words[k - 1].end = Math.min(words[k - 1].end, words[k].t); }
  out.lines[l.id] = { t: toks[0].start, end: toks.at(-1).end, words };
  const loss = toks.map(t => t.loss), maxLoss = Math.max(...loss);
  if (maxLoss >= 3) flags.push('loss ' + toks.filter(t => t.loss >= 3).map(t => t.text).join(' '));
  if (toks.some(t => t.end - t.start < 0.02)) flags.push('squeezed ' + toks.filter(t => t.end - t.start < 0.02).map(t => t.text).join(' '));
  rows.push([l.id, loss.reduce((a, b) => a + b, 0) / loss.length, maxLoss, flags, toks.some(t => t.fixed)]);
}
// Lines never overlap: a line ends by the time the next one starts.
lyrics.forEach((l, i) => {
  const c = out.lines[l.id], n = lyrics[i + 1] && out.lines[lyrics[i + 1].id];
  if (n && n.t < c.t) die(`${lyrics[i + 1].id} starts before ${l.id}: check both lines and add a fix`);
  if (n && c.end > n.t) { c.end = n.t; for (const w of c.words) { w.t = Math.min(w.t, n.t); w.end = Math.min(w.end, n.t); } }
  Object.assign(c, { t: r3(c.t), end: r3(c.end), words: c.words.map(w => ({ w: w.w, t: r3(w.t), end: r3(w.end) })) });
});
fs.writeFileSync('song/timing.json', JSON.stringify(out, null, 1) + '\n');
fs.writeFileSync('song/labels.txt', lyrics.map(l => `${out.lines[l.id].t}\t${out.lines[l.id].end}\t${l.id}`).join('\n') + '\n');
for (const [id, mean, max, flags, fixed] of rows) {
  const L = out.lines[id];
  console.log(`${id.padEnd(8)} ${L.t.toFixed(2).padStart(7)} ${(L.end - L.t).toFixed(2).padStart(5)}s  loss ${mean.toFixed(2)} max ${max.toFixed(2)}${fixed ? '  (fixed)' : ''}${flags.length ? '  CHECK ' + flags.join('; ') : ''}`);
}
console.log(`wrote song/timing.json and song/labels.txt: ${lyrics.length} lines, ${duration} s`);

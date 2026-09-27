#!/usr/bin/env node
// Bottom-edge and font check for vertical (9:16) HyperFrames builds. Needs Node 22+ and Playwright
// (npm i -D playwright && npx playwright install chromium).
//   node edge-check.mjs <built-project-dir> [--margin 48] [--at 1.5,4,7.2] [--samples 6] [--out report.txt] [--hf-version x.y.z]
// Plays the build (the folder holding index.html) in Chromium at its canvas size and seeks to sample times: --at (film
// seconds), else --samples moments in every scene host (default 5, 30, 50, 70, 85 and 97% of each scene), else 40
// moments across the film. It lists visible UI (text, a visible border, a background fill or a box-shadow) that the
// bottom edge cuts off ("cut") or that ends inside the margin ("tight"); full-width bands may end at the edge. Art and
// texture may bleed: mark their container data-bleed and it is skipped. url() backgrounds count as texture, and SVG is
// not inspected, so look at the frames too. Fonts: a family that visible text asks for first with no @font-face, and a
// font file that fails to load, both render a fallback face and are reported (generic families are fine).
// Exit codes: 0 nothing found, 1 elements or fonts found, 2 error. The project is never written: the HyperFrames
// runtime is injected into the served index.html, and <audio> is left out. The runtime comes from node_modules/hyperframes
// (in the project or a parent), else jsDelivr (cached in the OS temp dir) at --hf-version, the nearest package.json pin,
// or latest.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const dir = path.resolve(args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--'))) || '.');
const MARGIN = +opt('--margin', '48'), SAMPLES = +opt('--samples', '6'), OUT = opt('--out');
const AT = opt('--at') ? opt('--at').split(',').map(Number) : null;
const fail = msg => { console.error('edge-check: ' + msg); process.exit(2); };
const up = function* (p) { for (; ; p = path.dirname(p)) { yield p; if (p === path.dirname(p)) return; } };

function pinnedVersion() { // the nearest package.json that names a hyperframes version
  for (const p of up(dir)) {
    const f = path.join(p, 'package.json');
    if (!fs.existsSync(f)) continue;
    const text = fs.readFileSync(f, 'utf8'), pin = text.match(/hyperframes@(\d+\.\d+\.\d+)/);
    if (pin) return pin[1];
    try { const j = JSON.parse(text), v = (j.devDependencies || {}).hyperframes || (j.dependencies || {}).hyperframes;
      const m = v && v.match(/\d+\.\d+\.\d+/); if (m) return m[0]; } catch {}
  }
  return null;
}
let runtimeFrom = '';
async function runtimeSource() {
  for (const base of [dir, process.cwd()]) for (const p of up(base)) { // a local install first
    const f = path.join(p, 'node_modules/hyperframes/dist/hyperframe.runtime.iife.js');
    if (!fs.existsSync(f)) continue;
    const v = JSON.parse(fs.readFileSync(path.join(p, 'node_modules/hyperframes/package.json'), 'utf8')).version;
    runtimeFrom = `hyperframes ${v} from ${path.relative(process.cwd(), f) || f}`;
    return fs.readFileSync(f, 'utf8');
  }
  const ver = opt('--hf-version') || pinnedVersion() || 'latest';
  runtimeFrom = `hyperframes@${ver} from jsDelivr`;
  const cache = path.join(os.tmpdir(), `hyperframes-runtime-${ver}.js`);
  if (ver !== 'latest' && fs.existsSync(cache)) return fs.readFileSync(cache, 'utf8');
  const url = `https://cdn.jsdelivr.net/npm/hyperframes@${ver}/dist/hyperframe.runtime.iife.js`;
  const res = await fetch(url).catch(e => fail(`cannot download the runtime (${e.message}); npm i -D hyperframes`));
  if (!res.ok) fail(`${url} answered ${res.status}; pass --hf-version or npm i -D hyperframes`);
  const js = await res.text();
  fs.writeFileSync(cache, js);
  return js;
}

async function loadPlaywright() {
  for (const base of [dir, process.cwd()]) try { return createRequire(path.join(base, 'noop.js'))('playwright'); } catch {}
  try { const m = await import('playwright'); return m.chromium ? m : m.default; } catch {}
  fail('Playwright is missing: npm i -D playwright && npx playwright install chromium');
}

const index = path.join(dir, 'index.html');
if (!fs.existsSync(index)) fail(`no index.html in ${dir} (pass a built HyperFrames project)`);
const rootTag = (fs.readFileSync(index, 'utf8').match(/<[^>]*data-composition-id=[^>]*>/) || [''])[0];
const W = +(rootTag.match(/data-width="(\d+)"/) || [])[1], H = +(rootTag.match(/data-height="(\d+)"/) || [])[1];
if (!W || !H) fail('the root composition has no data-width / data-height');

const RUNTIME = await runtimeSource();
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  if (rel === '__hf_runtime.js') { res.writeHead(200, { 'content-type': 'text/javascript' }); return res.end(RUNTIME); }
  const f = path.join(dir, path.normalize(rel));
  if (!f.startsWith(dir + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, buf) => { // readFile follows symlinks, so linked compositions/ and assets/ work
    if (e) { res.writeHead(404); return res.end(); }
    const ext = path.extname(f);
    if (ext === '.html') {
      let html = buf.toString('utf8').replace(/<audio\b[^>]*>[\s\S]*?<\/audio>|<audio\b[^>]*\/>/g, '');
      if (rel === 'index.html' && !/hyperframe[.-]runtime/.test(html)) // unless the build already loads the runtime
        html = html.replace(/<head[^>]*>/, m => m + '\n<script src="/__hf_runtime.js"></script>');
      buf = Buffer.from(html);
    }
    res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));

const { chromium } = await loadPlaywright();
let browser;
try { browser = await chromium.launch(); } catch (e) {
  try { browser = await chromium.launch({ channel: 'chrome' }); } catch { server.close(); fail(e.message.split('\n')[0]); }
}
const found = new Map(), families = new Set();
let seen = 0, times = [], fontLines = []; // seen: UI boxes inspected; zero means the scenes never rendered, which is not a pass
try {
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await page.waitForFunction(() => window.__playerReady || window.__player, null, { timeout: 60000 });
  // every scene host's timeline registered, then fonts loaded
  await page.waitForFunction(() => [...document.querySelectorAll('[data-composition-src]')]
    .every(h => (window.__timelines || {})[h.getAttribute('data-composition-id')]), null, { timeout: 30000 })
    .catch(() => console.warn('edge-check: some scene timelines never registered; checking anyway'));
  await page.evaluate(() => document.fonts.ready.then(() => true));

  const plan = await page.evaluate(() => {
    const root = document.querySelector('[data-composition-id]');
    const hosts = [...root.querySelectorAll(':scope > [data-composition-src]')].map(h => ({
      start: parseFloat(h.getAttribute('data-start')),
      dur: parseFloat(h.getAttribute('data-hf-authored-duration') || h.getAttribute('data-duration')) }))
      .filter(h => isFinite(h.start) && h.dur > 0);
    return { hosts, dur: parseFloat(root.getAttribute('data-duration')) || window.__player.getDuration?.() || 0 };
  });
  const moments = SAMPLES === 6 ? [0.05, 0.3, 0.5, 0.7, 0.85, 0.97]
    : Array.from({ length: SAMPLES }, (_, i) => SAMPLES === 1 ? 0.5 : 0.05 + i * 0.92 / (SAMPLES - 1));
  times = AT || (plan.hosts.length ? plan.hosts.flatMap(h => moments.map(m => h.start + m * h.dur))
    : Array.from({ length: 40 }, (_, i) => (i + 0.5) * plan.dur / 40));

  for (const t of times) {
    await page.evaluate(t => new Promise(r => { window.__player.seek(t); requestAnimationFrame(() => requestAnimationFrame(r)); }), t);
    const hits = await page.evaluate(([W, H, MARGIN]) => {
      const root = document.querySelector('[data-composition-id]'), fr = root.getBoundingClientRect(), out = [], fams = [];
      let seen = 0;
      const hosts = [...root.querySelectorAll(':scope > [data-composition-src]')];
      const clear = c => c === 'transparent' || /rgba\([^)]*,\s*0(\.0+)?\)$/.test(c);
      for (const host of hosts.length ? hosts : [root]) {
        const hs = getComputedStyle(host);
        if (hs.visibility === 'hidden' || hs.display === 'none') continue;
        const id = host.getAttribute('data-composition-id') || host.id;
        const sel = el => { const p = []; for (let e = el; e && e !== host && p.length < 3; e = e.parentElement)
          p.unshift(e.tagName.toLowerCase() + (e.id ? '#' + e.id : e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : '')); return p.join(' > '); };
        for (const el of host.querySelectorAll('*')) {
          if (el.closest('[data-bleed],svg,script,style,defs,template')) continue;
          const c = getComputedStyle(el);
          if (c.visibility === 'hidden') continue;
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          // display, opacity and clipping from the ancestors
          let op = +c.opacity, shown = c.display !== 'none', clipB = Infinity, clipped = false;
          for (let e = el.parentElement; e && shown; e = e.parentElement) {
            const a = getComputedStyle(e);
            if (a.display === 'none') shown = false;
            op *= +a.opacity;
            const ox = a.overflowX !== 'visible', oy = a.overflowY !== 'visible';
            if (ox || oy) {
              const b = e.getBoundingClientRect();
              if ((ox && (b.right <= r.left || b.left >= r.right)) || (oy && (b.bottom <= r.top || b.top >= r.bottom))) clipped = true;
              if (oy) clipB = Math.min(clipB, b.bottom - fr.top);
            }
          }
          if (!shown || clipped || op < 0.05) continue;
          const top = r.top - fr.top, left = r.left - fr.left, right = r.right - fr.left;
          // an ancestor that clips inside the frame ends the element there; one at or past the edge does not
          const bot = clipB < H - 1 ? Math.min(r.bottom - fr.top, clipB) : r.bottom - fr.top;
          if (right < 0 || left > W || top > H - 1 || bot < 0) continue; // wholly outside
          const text = [...el.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim());
          if (text) fams.push(c.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, ''));
          if (r.width >= W * 0.97 && r.height >= H * 0.9) continue; // a full-frame ground
          const border = ['Top', 'Right', 'Bottom', 'Left'].some(s => parseFloat(c['border' + s + 'Width']) > 0 && !clear(c['border' + s + 'Color']));
          const fill = !clear(c.backgroundColor) || (c.backgroundImage !== 'none' && !/url\(/.test(c.backgroundImage)) || c.boxShadow !== 'none';
          if (!text && !border && !fill) continue;
          seen++;
          const cut = bot > H + 1 && top < H - 1;
          const tight = !cut && bot > H - MARGIN && bot <= H + 1 && r.width < W * 0.97;
          if (!cut && !tight) continue;
          out.push({ id, sel: sel(el), problem: cut ? 'cut' : 'tight', kind: text ? 'text' : border ? 'border' : 'fill',
            what: cut ? `cut by the bottom edge (runs to y ${Math.round(bot)})` : `ends at y ${Math.round(bot)}, inside the ${MARGIN} px margin`,
            txt: text ? el.textContent.replace(/\s+/g, ' ').trim().slice(0, 30) : '' });
        }
      }
      return { out, seen, fams };
    }, [W, H, MARGIN]);
    seen += hits.seen;
    hits.fams.forEach(f => families.add(f));
    for (const h of hits.out) { const k = `${h.id}|${h.sel}|${h.problem}`; if (!found.has(k)) found.set(k, { ...h, t }); }
  }
  // fonts: a family asked for first with no @font-face, and any face that failed to load
  fontLines = await page.evaluate(used => {
    const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|emoji|math|fangsong|inherit|initial|-apple-system|BlinkMacSystemFont)$/i;
    const faces = [...document.fonts], name = f => f.family.replace(/^["']|["']$/g, '').toLowerCase();
    const declared = new Set(faces.map(name));
    const missing = used.filter(f => f && !GENERIC.test(f) && !declared.has(f.toLowerCase()))
      .map(f => `font: "${f}" is used by visible text but has no @font-face, so a fallback face renders`);
    const broken = [...new Set(faces.filter(f => f.status === 'error').map(f => `${f.family} ${f.weight} ${f.style}`))]
      .map(f => `font: ${f} failed to load (check its url)`);
    return missing.concat(broken);
  }, [...families]);
} catch (e) {
  await browser.close(); server.close(); fail(e.message.split('\n')[0]);
}
await browser.close(); server.close();
if (!seen) fail('no visible UI at any sample time: did the scenes load? Open the build in a browser to see why.');

const list = [...found.values()].sort((a, b) => a.id.localeCompare(b.id) || a.t - b.t);
const lines = list.map(h => `${h.id} ${h.t.toFixed(2)}s ${h.kind} ${h.sel}${h.txt ? ` "${h.txt}"` : ''}: ${h.what}`).concat(fontLines);
const per = {}; list.forEach(h => { per[h.id] = (per[h.id] || 0) + 1; });
const summary = `bottom edge (${W}x${H}, margin ${MARGIN} px, ${seen} UI box checks at ${times.length} moments): ` +
  `${list.length} element(s) cut or too close` +
  (list.length ? ` in ${Object.keys(per).length} scene(s) ${JSON.stringify(per)}` : '') +
  `; fonts: ${fontLines.length} problem(s); runtime ${runtimeFrom}`;
if (lines.length) console.log(lines.join('\n'));
console.log(summary);
if (OUT) fs.writeFileSync(OUT, lines.concat(summary).join('\n') + '\n');
process.exit(list.length || fontLines.length ? 1 : 0);

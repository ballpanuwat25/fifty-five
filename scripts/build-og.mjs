// Draws the share image, the picture a link to the site shows in LINE, Facebook or X: the hero's first
// view at 1200 by 630, the name set in Zodiak with the carriage in the slot between its words, on the
// page's paper. It is a page of its own, made from the site's fonts and photo, drawn by headless Chrome.
// Writes src/app/opengraph-image.jpg and twitter-image.jpg (Next.js serves them with their alt texts).
//   node scripts/build-og.mjs
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { open } from './frame-clock.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const at = (p) => pathToFileURL(path.join(ROOT, p)).href;
const W = 1200, H = 630;

const html = `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: Zodiak; font-weight: 300; src: url(${at('src/fonts/zodiak-300.woff2')}); }
  @font-face { font-family: Switzer; font-weight: 400; src: url(${at('src/fonts/switzer-400.woff2')}); }
  @font-face { font-family: Switzer; font-weight: 500; src: url(${at('src/fonts/switzer-500.woff2')}); }
  * { margin: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; background: #eee6d6; color: #2a3020; font-family: Switzer; overflow: hidden; position: relative; }
  .top { position: absolute; left: 56px; right: 56px; top: 40px; display: flex; justify-content: space-between; align-items: center; font-size: 19px; }
  .top b { font: 400 26px Zodiak; letter-spacing: -.01em; font-weight: 300; }
  .top span { background: #2a3020; color: #eee6d6; padding: 12px 22px; border-radius: 99px; font-weight: 500; font-size: 17px; }
  .name { position: absolute; left: 48px; bottom: 44px; font: 300 236px/.82 Zodiak; letter-spacing: -.045em; }
  .line { display: flex; align-items: center; }
  .line + .line { margin-top: .12em; gap: 26px; }
  .car { width: 330px; height: .72em; border-radius: 99px; background: url(${at('public/photos/flow-wide.webp')}) 50% 75% / cover; flex: none; }
  .side { position: absolute; right: 56px; bottom: 58px; text-align: right; font-size: 19px; line-height: 1.55; }
  .side p:first-child { font-weight: 500; }
</style>
<div class="top"><b>Fifty-Five</b><span>Book a class</span></div>
<div class="name"><div class="line">Fifty</div><div class="line"><i class="car"></i>Five</div></div>
<div class="side"><p>Reformer Pilates</p><p>Thong Lo 13, Bangkok</p><p>Eight to a room, from 07:00</p></div>`;

const dir = mkdtempSync(path.join(tmpdir(), 'fifty-five-og-'));
const file = path.join(dir, 'og.html');
writeFileSync(file, html);
const page = await open({ width: W, height: H, prefix: 'fifty-five-og-' });
await page.send('Page.navigate', { url: pathToFileURL(file).href });
await page.run(`new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r))).then(() => document.fonts.ready).then(() => 1)`, true);
const shot = await page.send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
// Chrome can still hold its profile for a moment after it is told to quit; a leftover temp folder is harmless
try { page.close(); } catch {}
rmSync(dir, { recursive: true, force: true });

const jpg = Buffer.from(shot.result.data, 'base64');
const alt = 'Fifty-Five, reformer Pilates on Thong Lo 13, Bangkok: the name in a serif, with a photo of the empty studio set like a reformer carriage between its two words.';
for (const name of ['opengraph-image', 'twitter-image']) {
  writeFileSync(path.join(ROOT, 'src/app', `${name}.jpg`), jpg);
  writeFileSync(path.join(ROOT, 'src/app', `${name}.alt.txt`), alt);
}
console.log(`wrote src/app/opengraph-image.jpg and twitter-image.jpg, ${Math.round(jpg.length / 1024)} KB`);

// Records the film stage (/film) to an MP4 at 1920x1080 and 60 fps, for the portfolio video. The page runs
// on the frame clock (frame-clock.mjs), which starts once the opening card is up (data-film="title"); the
// take ends a second after "done". It runs about four times slower than the film itself.
// Run it against a production build with the stage open:
//   npx next build && set FILM_MODE=1 && npx next start -p 3013
//   node scripts/record-film.mjs [http://localhost:3013/film] [scripts/.cache/fifty-five-film.mp4]
import path from 'node:path';
import { open, sleep } from './frame-clock.mjs';

const url = process.argv[2] ?? 'http://localhost:3013/film';
const out = path.resolve(process.argv[3] ?? 'scripts/.cache/fifty-five-film.mp4');
const FPS = 60;

const page = await open({ width: 1920, height: 1080, prefix: 'fifty-five-film-' });
const state = () => page.run(`({ film: document.documentElement.dataset.film, problem: document.querySelector('.film-problem')?.textContent })`);
await page.send('Page.navigate', { url });
for (let i = 0; i < 400 && (await state())?.film !== 'title'; i++) await sleep(25);
await page.run('window.__vt.start()');

const began = Date.now();
let doneAt = -1;
for (;;) {
  await page.step(1000 / FPS);
  await page.shot();
  const k = page.frames;
  if (k % 30 === 0) {
    const s = await state();
    if (s?.film === 'failed') { page.close(); throw new Error(`the take failed: ${s.problem}`); }
    if (s?.film === 'done' && doneAt < 0) doneAt = k;
    if (k % 600 === 0) console.log(`${k / FPS} s of film recorded in ${Math.round((Date.now() - began) / 1000)} s`);
  }
  if (doneAt >= 0 && k >= doneAt + FPS) break;
  if (k > FPS * 240) { page.close(); throw new Error('the take did not finish in four minutes of film'); }
}
page.encode(out, FPS);
console.log(`wrote ${out}: ${page.frames} frames, ${(page.frames / FPS).toFixed(1)} s`);

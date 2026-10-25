// Records the first view as a Fastwork listing shows it: a still, and the clip that plays when the pointer
// rests on it, which starts on that same still. The page opens at 750 by 1000 (drawn 1080 by 1440), the
// loader runs its carriage to 55 and gives way, and from the first frame after it the carriage slides out
// of the name and the letters roll once; then a hand comes in, passes along the name so its letters lift,
// rests on two classes so the carriage shows their rooms, and leaves, while the carriage breathes. The
// page runs on the frame clock (frame-clock.mjs) from the start, so the clip never stutters.
//   node scripts/record-hero.mjs [https://fifty-five.vercel.app/] [scripts/.cache]
// writes fifty-five-still.png and fifty-five-hover.mp4 into the folder.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { open } from './frame-clock.mjs';

const url = process.argv[2] ?? 'https://fifty-five.vercel.app/';
const dir = path.resolve(process.argv[3] ?? 'scripts/.cache');
const FPS = 30;
const SECONDS = 8;

// the hand: in from the lower right, along the first word of the name, down to the classes beside it and
// out again; points in fractions of the name's box, each leg with its time in milliseconds; it sets off
// this long after the first frame, once the opening roll has passed
const SETS_OFF = 3300;
const PATH = [[1.3, 1.25, 0], [0.04, 0.3, 900], [0.5, 0.26, 900], [0.72, 0.4, 500], [0.86, 0.36, 700], [0.86, 0.43, 900], [1.3, 1.25, 900]];

// put into the page once the loader has gone; it moves on the page's own clock, so it is in step with the
// frames. It tells the page where it is as a mouse would, the move and the enter and leave of what it is
// over, so the classes it rests on show their rooms
const HAND = `(() => {
  const r = document.querySelector('.hero-name').getBoundingClientRect();
  const cur = document.createElement('div');
  cur.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M3 2 L3 19.5 L7.6 15.4 L10.6 22.2 L13.6 20.9 L10.7 14.2 L17 14.2 Z" fill="#fff" stroke="#2a3020" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  Object.assign(cur.style, { position: 'fixed', left: '-3px', top: '-2px', zIndex: 999, pointerEvents: 'none', filter: 'drop-shadow(0 2px 3px rgba(42,48,32,.4))', transform: 'translate(-99px, -99px)' });
  document.body.append(cur);
  const pts = ${JSON.stringify(PATH)}.map(([fx, fy, ms]) => [r.left + r.width * fx, r.top + r.height * fy, ms]);
  const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const total = pts.reduce((s, p) => s + p[2], 0);
  const at = (t) => {
    for (let i = 1, s = 0; i < pts.length; s += pts[i][2], i++) {
      if (t <= s + pts[i][2]) { const k = ease((t - s) / pts[i][2]); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; }
    }
    return pts[pts.length - 1];
  };
  const fire = (el, type, x, y, related) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true, pointerType: 'mouse', relatedTarget: related }));
  let under = null;
  const start = performance.now() + ${SETS_OFF};
  const move = () => {
    const t = performance.now() - start;
    if (t >= 0) {
      const [x, y] = at(Math.min(t, total));
      cur.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      const el = document.elementFromPoint(x, y);
      if (el !== under) { if (under) fire(under, 'pointerout', x, y, el); if (el) fire(el, 'pointerover', x, y, under); under = el; }
      if (el) fire(el, 'pointermove', x, y);
    }
    if (t < total) requestAnimationFrame(move);
  };
  requestAnimationFrame(move);
})()`;

const page = await open({ width: 750, height: 1000, dsf: 1.44, prefix: 'fifty-five-hero-' });
await page.send('Page.navigate', { url });
await page.run('window.__vt && window.__vt.start()');
// the loader runs on the clock too: it is stepped through, unrecorded, until it has gone
for (let i = 0; i < 2000 && (await page.run(`document.readyState !== 'complete' || !!document.querySelector('.loader')`)); i++) await page.step(1000 / FPS);
await page.run(HAND);

for (let k = 0; k < FPS * SECONDS; k++) {
  if (k === 0) writeFileSync(path.join(dir, 'fifty-five-still.png'), await page.shot('png'));
  await page.shot();
  await page.step(1000 / FPS);
}
page.encode(path.join(dir, 'fifty-five-hover.mp4'), FPS, 18);
console.log(`wrote ${dir}: fifty-five-still.png and fifty-five-hover.mp4, ${FPS * SECONDS} frames`);

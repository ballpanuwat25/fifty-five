'use client';

import { useEffect, useRef, useState } from 'react';
import { free, hero, photoOf, studio, when } from '@/content/site';
import { whenOpen } from '@/lib/opening';

// The pill in the name is the reformer's carriage. When the page opens it slides out once along its rail,
// slow and controlled, and stops. As you scroll it opens from its place in the name to the whole room.
// Beside it the visitor picks a class; the carriage shows that class and its next time with a bed.
// On a screen with a mouse the carriage can be pulled along its rail like the real one: it gets heavier
// the further it goes, as the springs take the load, and a ring on it fills and says when letting go
// will book. Let go and the springs pull it home, just past its stop and back. Pulled all the way, it
// opens the booking for the class in it. The photo stays where it is while the carriage stretches over
// it, so a pull uncovers more of the room instead of zooming it. As the pointer nears its end it leans
// out toward it a little, as if waiting to be pulled. Passing over the name rolls its letters up one at
// a time, like a spine articulating; when the pointer rests they settle back down. Once, as the page
// opens, a roll passes along the whole name by itself. And all the while the carriage breathes: a slow
// push out and back, in and out, that never quite stops.

const SLIDE_MS = 1700;
// the carriage's return: a real spring, a little under-damped, so it swings just past home and settles
const K = 210, C = 2 * 0.34 * Math.sqrt(K);
// the layout where the carriage is a band across the screen has no rail to pull along
// how high a letter rolls up, as a share of the type size, and how wide the roll is in letters
const LIFT = 0.07, SPREAD = 1.1;
// the breath: one slow cycle in and out, and how far it takes the carriage, as a share of its length;
// how long the opening roll takes to pass along the name; how fast a lift fades once the pointer rests
const BREATH_S = 8, BREATH = 0.035, ROLL_S = 2.6, REST = 0.985;
const UPRIGHT = '(max-width: 760px), (max-width: 1180px) and (orientation: portrait)';

const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const outQuint = (t: number) => 1 - (1 - t) ** 5;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

// a word as a row of letters that can each move, like the bones of a spine
const spine = (word: string) => [...word].map((ch, i) => <span className="v" key={i}>{ch}</span>);

export default function Hero() {
  const stage = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLSpanElement>(null);
  const rail = useRef<HTMLElement>(null);
  const five = useRef<HTMLSpanElement>(null);
  const car = useRef<HTMLAnchorElement>(null);
  const room = useRef<HTMLDivElement>(null);
  const [pick, setPick] = useState(0);
  const [peek, setPeek] = useState<number | null>(null);
  const shown = peek ?? pick;

  useEffect(() => {
    const st = stage.current!, cp = copy.current!, sl = slot.current!, cr = car.current!, fv = five.current!;
    const pin = st.firstElementChild as HTMLElement;
    const img = cr.querySelector('img')!;
    const where = st.querySelector<HTMLElement>('.hero-where')!;
    const rm = room.current!, bar = document.querySelector<HTMLElement>('.bar');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let from: { x: number; y: number; w: number; h: number } | null = null;
    let slid: number | null = null, raf = 0;
    // the pull, in px, and its speed once let go
    let pull = 0, vel = 0, last = 0, max = 1, drag: { x: number } | null = null, moved = false;
    // the pointer, and how fast it moves (px per frame, eased); null when it is not over a mouse screen
    let ptr: { x: number; y: number } | null = null, speed = 0, lean = 0, stir = 0;
    // how much of the breath shows (none while held or scrolled away), and when the opening roll began
    let breath = 0, rolled: number | null = null;
    const letters = [...st.querySelectorAll<HTMLElement>('.v')].map((el) => ({ el, y: 0 }));
    const measure = () => {
      const r = sl.getBoundingClientRect(), s = pin.getBoundingClientRect();
      from = { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    };

    const frame = () => {
      if (!from) measure();
      const f = from!;
      // the pinned screen, not the window: the window counts the scrollbar's gutter too
      const W = pin.clientWidth, H = pin.clientHeight;
      const t = inOut(clamp01(-st.getBoundingClientRect().top / (st.offsetHeight - H) / 0.85));
      const now = performance.now(), dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      if (!drag && (pull || vel)) {
        vel += (-K * pull - C * vel) * dt;
        pull = Math.max(-0.12 * max, pull + vel * dt);
        if (Math.abs(pull) < 0.3 && Math.abs(vel) < 3) pull = vel = 0;
      }
      const ready = !!drag && pull > max * 0.9;
      cr.style.setProperty('--p', String(clamp01(pull / max)));
      cr.classList.toggle('is-ready', ready);
      cr.classList.toggle('is-away', t > 0.02);
      // the lean: within a reach of the carriage's end the pointer draws it out a little
      let leanTo = 0;
      if (ptr && !drag && t < 0.02 && hoverable()) {
        const r = cr.getBoundingClientRect(), d = ptr.x - r.right, reachX = 240;
        const nearY = ptr.y > r.top - r.height * 0.4 && ptr.y < r.bottom + r.height * 0.4;
        if (nearY && d > -r.width && d < reachX) leanTo = f.w * 0.06 * (d < 0 ? 0.7 : 1 - d / reachX);
      }
      lean += (leanTo - lean) * 0.1;
      // the breath starts once the opening roll has passed, from empty, so it begins without a jump
      const rs = rolled === null ? -1 : (now - rolled) / 1000;
      // no breath where the carriage is a band across an upright screen: there it only opens as you scroll
      const free = !reduce && !upright() && !drag && !pull && t < 0.02 && slid === null && rs >= ROLL_S;
      breath += ((free ? 1 : 0) - breath) * 0.05;
      const inhale = rs < ROLL_S ? 0 : (1 - Math.cos(((rs - ROLL_S) / BREATH_S) * Math.PI * 2)) / 2;
      const out = pull + lean + breath * inhale * f.w * BREATH;
      const w = lerp(f.w + out, W, t), h = lerp(f.h, H, t);
      // The box is as long as the carriage can ever get, and only its visible length is clipped: a clip
      // moves by fractions of a pixel without laying the page out again, where a changing width steps a
      // whole pixel at a time and the slow breath judders. The photo fills the box, so a pull uncovers
      // more of it rather than stretching it.
      const box = Math.max(w, f.w * 1.1 + reach(f.w));
      let shownW = w;
      if (slid !== null) {
        const k = clamp01((now - slid) / SLIDE_MS);
        shownW = w * outQuint(k);
        if (k >= 1) slid = null;
      }
      Object.assign(cr.style, {
        left: `${lerp(f.x, 0, t)}px`, top: `${lerp(f.y, 0, t)}px`, width: `${box}px`, height: `${h}px`,
        clipPath: `inset(0 ${box - shownW}px 0 0 round ${Math.min(h / 2, lerp(f.h / 2, 0, t))}px)`,
      });
      cr.style.setProperty('--shown', `${shownW}px`);
      cr.style.setProperty('--open', String(clamp01((t - 0.1) / 0.45)));
      // the word the carriage pushes aside, and the rest stepping back as the room opens
      fv.style.transform = `translateX(${t * W * 0.9 + out}px)`;
      // the roll: each letter near the pointer lifts, more for a quick pass, and eases back down
      speed *= 0.9;
      // a lift fades while the pointer rests, so a letter left under it comes back down
      stir *= REST;
      const size = parseFloat(getComputedStyle(fv).fontSize);
      // the opening roll, passing letter by letter along both words, once
      const roll = rs >= 0 && rs < ROLL_S ? (rs / ROLL_S) * (letters.length + 3) - 1.5 : null;
      for (const [i, l] of letters.entries()) {
        let to = roll === null ? 0 : -size * LIFT * 0.6 * Math.exp(-(((i - roll) / 1.1) ** 2));
        if (ptr && t < 0.02 && hoverable()) {
          const r = l.el.getBoundingClientRect(), cx = r.left + r.width / 2;
          if (ptr.y > r.top - size * 0.25 && ptr.y < r.bottom + size * 0.1) {
            const k = (ptr.x - cx) / (size * 0.45 * SPREAD);
            to = Math.min(to, -size * LIFT * Math.exp(-k * k) * stir * (0.7 + Math.min(1, speed / 25) * 0.8));
          }
        }
        l.y += (to - l.y) * (to < l.y ? 0.16 : 0.07);
        l.el.style.transform = Math.abs(l.y) < 0.05 ? '' : `translateY(${l.y}px)`;
      }
      // the address steps out of the way of the word the pull pushes into it
      where.style.opacity = pull > 0 ? String(1 - pull / (max * 0.7)) : '';
      cp.style.opacity = String(1 - Math.min(1, t * 1.6));
      // once the room fills the screen, the picked class is laid over it, ready to book
      const shown = clamp01((t - 0.72) / 0.22);
      rm.style.opacity = String(shown);
      rm.style.translate = `0 ${(1 - shown) * 24}px`;
      rm.toggleAttribute('inert', shown < 0.5);
      // the bar reads over the photo while the room fills the screen, and on its own paper once past it
      const past = st.getBoundingClientRect().bottom < 72;
      bar?.classList.toggle('on-photo', t > 0.55 && !past);
      bar?.classList.toggle('is-solid', past);
      raf = requestAnimationFrame(frame);
    };

    const onResize = () => { from = null; };
    addEventListener('resize', onResize);

    // how far the carriage can be pulled: none where it is a band across the screen
    const reach = (w: number) => (upright() ? 0 : Math.min(w * 0.6, pin.clientWidth * 0.3));
    const upright = () => matchMedia(UPRIGHT).matches;
    const hoverable = () => matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const moved = ptr ? Math.hypot(e.clientX - ptr.x, e.clientY - ptr.y) : 0;
      speed += (moved - speed) * 0.3;
      if (moved > 0.5) stir = 1;
      ptr = { x: e.clientX, y: e.clientY };
    };
    const offPage = () => { ptr = null; };
    addEventListener('pointermove', onPointer);
    document.documentElement.addEventListener('pointerleave', offPage);
    const canPull = () => matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia(UPRIGHT).matches && st.getBoundingClientRect().top > -4;
    const onDown = (e: PointerEvent) => {
      moved = false;
      if (!canPull() || !from || e.button) return;
      // the springs: the pull eases toward its limit, so each extra pixel takes more effort
      max = reach(from.w);
      drag = { x: e.clientX - Math.max(0, pull) };
      vel = 0;
      // a pointer the browser does not know (the film's drawn cursor) cannot be captured; the pull works without
      try { cr.setPointerCapture(e.pointerId); } catch {}
      st.classList.add('is-pulling');
    };
    const onDrag = (e: PointerEvent) => {
      if (!drag) return;
      const dx = Math.max(0, e.clientX - drag.x);
      if (dx > 4) moved = true;
      pull = max * (1 - Math.exp(-dx / (max * 0.75)));
    };
    const onUp = () => {
      if (!drag) return;
      const full = pull > max * 0.9;
      drag = null;
      st.classList.remove('is-pulling');
      st.classList.add('was-pulled');
      if (full) { moved = false; cr.click(); }
    };
    // a pull is not a click; only a press without one opens the booking
    const onClick = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; } };
    cr.addEventListener('pointerdown', onDown);
    cr.addEventListener('pointermove', onDrag);
    cr.addEventListener('pointerup', onUp);
    cr.addEventListener('pointercancel', onUp);
    cr.addEventListener('click', onClick, true);
    cr.addEventListener('dragstart', (e) => e.preventDefault());

    // the opening waits for the type and the photo, but never longer than four seconds, and for the
    // loading screen to give way, so the carriage leaves its rail there and slides out of the name here
    let alive = true, unwait = () => {};
    Promise.race([
      Promise.all([document.fonts.ready, img.complete ? null : new Promise((r) => img.addEventListener('load', r, { once: true }))]),
      new Promise((r) => setTimeout(r, 4000)),
    ]).then(() => new Promise<void>((r) => { unwait = whenOpen(r); })).then(() => {
      if (!alive) return;
      measure();
      st.classList.add('is-open');
      if (!reduce) {
        const settle = 'cubic-bezier(.22,1,.36,1)';
        rail.current!.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)', offset: 0.6 }, { transform: 'scaleX(1)', opacity: 0 }], { duration: 1300, easing: settle, fill: 'forwards' });
        setTimeout(() => { if (alive) slid = performance.now(); }, 350);
        const fade = (el: Element | null, delay: number, y = '10px') =>
          el?.animate([{ opacity: 0, translate: `0 ${y}` }, { opacity: 1, translate: '0 0' }], { duration: 1200, delay, easing: settle, fill: 'backwards' });
        fade(st.querySelector('.w1'), 200, '0.12em');
        fade(fv, 450, '0.12em');
        fade(st.querySelector('.hero-side'), 900);
        fade(st.querySelector('.hero-where'), 1000);
        // the roll passes once the name has arrived
        setTimeout(() => { if (alive) rolled = performance.now(); }, 1500);
      }
      last = performance.now();
      raf = requestAnimationFrame(frame);
    });

    return () => {
      alive = false;
      unwait();
      cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
      removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', offPage);
      cr.removeEventListener('pointerdown', onDown);
      cr.removeEventListener('pointermove', onDrag);
      cr.removeEventListener('pointerup', onUp);
      cr.removeEventListener('pointercancel', onUp);
      cr.removeEventListener('click', onClick, true);
    };
  }, []);

  return (
    <div className="stage" ref={stage} id="top">
      <div className="stage-pin">
        <div className="hero" ref={copy}>
          <h1 className="hero-name" aria-label={studio.name}>
            <span className="hero-line">
              <span className="w1">{spine(hero.words[0])}</span>
              <span className="hero-side">
                <span className="hero-text">{hero.text}</span>
                <span className="picker" role="group" aria-label="Classes">
                  {hero.classes.map((c, i) => (
                    <button type="button" key={c.name} className={i === pick ? 'is-on' : ''} aria-pressed={i === pick}
                      onClick={() => setPick(i)} onPointerEnter={(e) => e.pointerType === 'mouse' && setPeek(i)} onPointerLeave={() => setPeek(null)}>
                      <b>{c.name}</b><span>{when(c)} · {free(c)}</span>
                    </button>
                  ))}
                </span>
                <span className="pick-info" aria-live="polite">{when(hero.classes[pick])} · {free(hero.classes[pick])}</span>
              </span>
            </span>
            <span className="hero-line">
              <span className="slot" ref={slot}><i className="rail" ref={rail} /><span className="pull" aria-hidden="true">Pull the carriage</span></span>
              <span className="w2" ref={five}>{spine(hero.words[1])}</span>
              <span className="hero-where">{studio.street}<br />{studio.walk}</span>
            </span>
          </h1>
        </div>
        <a className="car" ref={car} href={`#${hero.classes[pick].id}`} aria-label={`${hero.book}: ${hero.classes[pick].name}`} draggable={false}>
          {hero.classes.map((c, i) => (
            // the wide photo fills the capsule on every screen; on an upright one the tall photo takes over as
            // the carriage opens to the whole screen
            <span key={c.name} className={`car-photo${i === shown ? ' is-on' : ''}`}
              style={{ '--band': `${c.bandY}%`, '--zoom': c.zoom ?? 1 } as React.CSSProperties}>
              {/* the photos are already sized and compressed for the site (scripts/export-photos.py) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="wide" src={photoOf(c.photo).wide} alt={i === shown ? `${c.name} at Fifty-Five` : ''} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="tall" src={photoOf(c.photo).tall} alt="" loading="lazy" />
            </span>
          ))}
          <span className="cue" aria-hidden="true">
            <svg viewBox="0 0 100 100"><circle className="cue-track" cx="50" cy="50" r="46" /><circle className="cue-fill" cx="50" cy="50" r="46" pathLength="1" /></svg>
            <span className="cue-arrow">→</span>
            <span className="cue-say"><span>Pull</span><span>Let go to book</span></span>
          </span>
        </a>
        <div className="room" ref={room} inert>
          <p className="room-when">{hero.classes[pick].day} · {hero.classes[pick].time} · {hero.classes[pick].minutes} min</p>
          <h2 className="room-name">{hero.classes[pick].name}</h2>
          <p className="room-who">with {hero.classes[pick].teacher} · {hero.classes[pick].level}</p>
          <div className="room-row">
            <span className="beds" aria-label={free(hero.classes[pick])}>
              {Array.from({ length: hero.classes[pick].places }, (_, i) => <i key={i} className={i < hero.classes[pick].taken ? 'is-taken' : ''} />)}
              <span>{free(hero.classes[pick])}</span>
            </span>
            <a className="room-book" href={`#${hero.classes[pick].id}`}>{hero.classes[pick].taken >= hero.classes[pick].places ? hero.waitlist : hero.bookThis}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

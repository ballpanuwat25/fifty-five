'use client';

import { useEffect, useRef, useState } from 'react';
import { loader } from '@/content/site';
import { markOpen } from '@/lib/opening';
import { smooth } from '@/lib/smooth';

// The loading screen is the carriage drawn along its rail: on the page's paper, one rail and the carriage
// on it, and a count that climbs to 55 as the first view's photo and type arrive. At 55 the carriage is at
// its stop and the screen gives way to the hero, where the same carriage slides out of the name. It is in
// the server's HTML, so it covers the page from the first frame; a fast connection still sees it run for
// a moment, and a slow one reaches 55 the moment everything is in.

const TOP = 55;
const MIN_MS = 1300;     // the shortest run, so it is seen at all
const MAX_MS = 8000;     // after this it opens whatever is still loading
const FADE_MS = 800;

export default function Loader() {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'opening' | 'done'>('loading');
  const box = useRef<HTMLDivElement>(null), count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minMs = reduced ? 300 : MIN_MS;
    smooth()?.stop();

    // what the first view needs: the carriage's photo that shows, and the type
    const shown = [...document.querySelectorAll<HTMLImageElement>('.car .car-photo.is-on img.wide')];
    const waits: Promise<unknown>[] = [
      ...shown.map((img) => (img.complete ? Promise.resolve() : new Promise((done) => { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }))),
      document.fonts.ready,
    ];
    let loaded = 0;
    waits.forEach((w) => w.then(() => { loaded++; }));

    const born = performance.now();
    let run = 0, raf = 0, opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      cancelAnimationFrame(raf);
      if (count.current) count.current.textContent = String(TOP);
      el.style.setProperty('--run', '1');
      setPhase('ready');
      window.setTimeout(() => { setPhase('opening'); smooth()?.start(); markOpen(); }, reduced ? 0 : 420);
    };
    const frame = (now: number) => {
      const t = now - born;
      // never faster than minMs; on a slow connection the real progress holds it back
      const goal = Math.min(loaded / waits.length, t / minMs);
      run += (goal - run) * .12;
      if (goal - run < .002) run = goal;
      if (count.current) count.current.textContent = String(Math.round(TOP * run));
      el.style.setProperty('--run', run.toFixed(4));
      if (run >= 1 || t > MAX_MS) { open(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // animation frames can be paused (a background tab, power saving); this opens it all the same
    const late = window.setTimeout(open, MAX_MS + 500);
    return () => { cancelAnimationFrame(raf); clearTimeout(late); smooth()?.start(); };
  }, []);

  useEffect(() => {
    if (phase !== 'opening') return;
    const id = window.setTimeout(() => setPhase('done'), FADE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === 'done') return null;
  return (
    <div ref={box} className={`loader${phase === 'opening' ? ' is-open' : ''}`} role="status" aria-live="polite">
      <div className="loader-read">
        <span className="loader-rail" aria-hidden="true"><i /></span>
        <p className="loader-count"><span ref={count}>0</span></p>
        <p className="loader-say">{phase === 'loading' ? loader.setting : loader.ready}</p>
      </div>
    </div>
  );
}

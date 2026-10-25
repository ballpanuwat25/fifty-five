'use client';

import { useEffect, useRef, useState } from 'react';
import { hero } from '@/content/site';
import { Lane, sleep } from '@/app/film/lane';
import { story } from '@/app/film/story';

// The film stage: a 1920 by 1080 frame for the portfolio video, a desk on the left and a phone on the
// right, each a live copy of the site in a frame of its own. It fits itself to the window so it can be
// watched on a smaller screen; the recording opens it in a 1920 by 1080 window, where it sits at full size.
//
// The state of the take is on <html data-film>: "setting" until the opening card's type has loaded,
// "title" while that card is up and the frames start loading behind it, "playing" from when it lifts onto
// the site's own loader drawing the carriage along its rail in both frames, "ending" while the closing
// card is up, then "done" or "failed", so whatever records it knows when to start and stop.

type Take = 'setting' | 'title' | 'playing' | 'ending' | 'done' | 'failed';

const W = 1920;
const H = 1080;
// the opening card stays up at least this long, and until both frames have their page
const TITLE_MS = 1300;

// a card over both frames: the name with the carriage between its words, as the hero sets it, and a line
function Card({ on, line, note }: { on: boolean; line: string; note: string }) {
  return (
    <div className="film-card" data-on={on || undefined} aria-hidden={!on}>
      <p className="film-card-name">{hero.words[0]}<i />{hero.words[1]}</p>
      <p className="film-card-line">{line}</p>
      <p className="film-card-note">{note}</p>
    </div>
  );
}

export default function Stage() {
  // the scale that fits the stage to the window, unknown until the page runs in a browser
  const [fit, setFit] = useState<number | null>(null);
  const [typeIn, setTypeIn] = useState(false);
  const [take, setTake] = useState<Take>('setting');
  const [problem, setProblem] = useState('');
  const desk = { frame: useRef<HTMLIFrameElement>(null), hand: useRef<HTMLDivElement>(null), veil: useRef<HTMLDivElement>(null) };
  const phone = { frame: useRef<HTMLIFrameElement>(null), hand: useRef<HTMLDivElement>(null), veil: useRef<HTMLDivElement>(null) };

  useEffect(() => {
    const size = () => setFit(Math.min(innerWidth / W, innerHeight / H));
    size();
    addEventListener('resize', size);
    void document.fonts.ready.then(() => setTypeIn(true));
    return () => removeEventListener('resize', size);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.film = take;
  }, [take]);

  useEffect(() => {
    let stopped = false;
    const parts = (p: typeof desk) => ({ frame: p.frame.current!, hand: p.hand.current!, veil: p.veil.current! });
    (async () => {
      // the card is on screen from the first paint; the take counts from when its serif has loaded
      await document.fonts.ready;
      const titled = performance.now();
      document.documentElement.dataset.scene = 'title';
      setTake('title');
      const deskLane = new Lane('desk', parts(desk));
      const phoneLane = new Lane('phone', parts(phone));
      await Promise.all([deskLane.load('/', 0), phoneLane.load('/', 0)]);
      await Promise.all([deskLane.unveil(0), phoneLane.unveil(0)]);
      await new Promise((r) => setTimeout(r, Math.max(0, TITLE_MS - (performance.now() - titled))));
      if (stopped) return;
      // the card lifts while the site's own loader draws the carriage along its rail in both frames; nothing
      // moves until both have opened
      document.documentElement.dataset.scene = 'loading';
      setTake('playing');
      await Promise.all([deskLane.settle(), phoneLane.settle()]);
      console.info(`[film] frames ready ${Math.round(performance.now() - titled)} ms after the title`);
      await story(deskLane, phoneLane, (scene) => (document.documentElement.dataset.scene = scene));
      if (stopped) return;
      // the closing card comes up over both frames and holds long enough to read
      document.documentElement.dataset.scene = 'end';
      setTake('ending');
      await sleep(5600);
      if (!stopped) setTake('done');
    })().catch((err: Error) => {
      console.error(err);
      setProblem(err.message);
      setTake('failed');
    });
    return () => {
      stopped = true;
    };
    // the refs are stable; the take runs once per load of the stage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // the stage stays unseen until it knows its scale and its type has loaded, so the opening card never
    // shows at full size, or in a stand-in font, and then jumps
    <div className="film-fit">
      <div className="film" style={{ width: W, height: H, zoom: fit ?? 1, visibility: fit !== null && typeIn ? undefined : 'hidden' }}>
        <figure className="film-desk">
          <div className="film-screen">
            {/* the desk is a 1368 by 855 laptop window, drawn at its own size rather than zoomed */}
            <div className="film-inner">
              <iframe ref={desk.frame} title="The site at a desk" tabIndex={-1} />
              <div ref={desk.veil} className="film-veil" />
              <div ref={desk.hand} className="film-cursor" aria-hidden>
                <svg viewBox="0 0 24 24" width="26" height="26">
                  <path d="M3 2 L3 19.5 L7.6 15.4 L10.6 22.2 L13.6 20.9 L10.7 14.2 L17 14.2 Z" />
                </svg>
              </div>
            </div>
          </div>
          <figcaption>At a desk</figcaption>
        </figure>
        <figure className="film-phone">
          <div className="film-screen">
            <div className="film-inner">
              <iframe ref={phone.frame} title="The site on a phone" tabIndex={-1} />
              <div ref={phone.veil} className="film-veil" />
              <div ref={phone.hand} className="film-finger" aria-hidden />
            </div>
          </div>
          <figcaption>On a phone</figcaption>
        </figure>
        <Card on={take === 'setting' || take === 'title'} line="A reformer Pilates studio's site, where the name holds the carriage: pull it, or scroll it open into the room." note="A fictional studio on Thong Lo 13, Bangkok." />
        <Card on={take === 'ending' || take === 'done'} line="The week's classes with the beds left, a booking request the studio gets on LINE, the teachers, the packs and the walk from the BTS." note="A fictional studio, made for a portfolio." />
        {take === 'failed' && <p className="film-problem">The take stopped: {problem}</p>}
      </div>
    </div>
  );
}

// The hands inside each frame of the film stage (src/app/film/Stage.tsx). The stage installs this into a
// frame's window once the frame has loaded and then sends it one command at a time by postMessage; the
// actor does it in the page as a visitor would (pointer events at a point, keys one at a time, an eased
// scroll) and answers with the same id once it is done. None of this is in the site's own code: it only
// exists in a frame that the stage has filled.

export type Command =
  | { cmd: 'rect'; sel: string; reveal?: boolean }
  | { cmd: 'point'; x: number; y: number; buttons?: number }
  | { cmd: 'press'; x: number; y: number }
  | { cmd: 'down'; x: number; y: number }
  | { cmd: 'up'; x: number; y: number }
  | { cmd: 'type'; sel: string; text: string; seed: number }
  | { cmd: 'scroll'; to: number | string; ms: number; offset?: number; center?: boolean }
  | { cmd: 'wait'; sel: string; text?: string; gone?: boolean; ms?: number }
  | { cmd: 'read'; sel: string }
  | { cmd: 'path' }
  | { cmd: 'focus' }
  | { cmd: 'text'; sel: string; text: string };

export type Message = Command & { film: true; id: number };
export type Reply = { film: true; id: number; ok: boolean; value?: unknown };
export type Rect = { x: number; y: number; width: number; height: number };

type Options = { touch: boolean };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// a CSS :hover cannot be set from a script, so the element under the drawn cursor gets this class and a
// copy of the site's hover looks for the controls the tour touches. The film also hides the frame's
// scrollbar and the dev server's badge, neither of which a visitor's screen would show, and the keyboard's
// focus rings: the pointer events here are not the browser's own, so it takes every focus for a keyboard
// one, where a hand with a mouse would only ever see the outline of the field being typed in
const HOVER = 'film-hover';
const HOVER_CSS = `
.picker button.${HOVER} { color: var(--ink); }
.tt-act button.quiet.${HOVER} { background: var(--ink); color: var(--paper); }
.tt-days button.${HOVER} { border-color: var(--ink); }
.team-list li.${HOVER} .team-car img { scale: 1.06; }
.car.${HOVER} .cue { opacity: 1; scale: 1; }
html, body, a, button, label, input, .car { cursor: none !important; }
html { scrollbar-width: none; }
:focus-visible { outline: none !important; }
nextjs-portal { display: none !important; }
`;

export function installActor(win: Window, { touch }: Options) {
  const doc = win.document;
  const style = doc.createElement('style');
  style.textContent = HOVER_CSS;
  doc.head.appendChild(style);

  // The phone's frame runs in a browser with a mouse; from here on the page asks for a touch screen and
  // gets one, so the booking tag offers Send on LINE as on a real phone. A link out to LINE never leaves
  // the frame.
  if (touch) {
    const media = win.matchMedia.bind(win);
    win.matchMedia = (q: string) => (q.includes('pointer: coarse') ? { ...media(q), matches: true, media: q } as MediaQueryList : media(q));
  }
  doc.addEventListener('click', (e) => {
    if ((e.target as Element).closest?.('a[href^="https://line.me"]')) e.preventDefault();
  }, true);

  let under: Element | null = null, held: Element | null = null;
  const fire = (el: Element, type: string, x: number, y: number, extra: PointerEventInit = {}) => {
    const init = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, view: win, ...extra };
    const pointer = type.startsWith('pointer');
    const event = pointer ? new (win as typeof window).PointerEvent(type, { pointerId: 1, isPrimary: true, pointerType: touch ? 'touch' : 'mouse', ...init }) : new (win as typeof window).MouseEvent(type, init);
    el.dispatchEvent(event);
  };
  const hoverTo = (el: Element | null, x: number, y: number) => {
    if (el === under) return;
    if (under) {
      fire(under, 'pointerout', x, y, { relatedTarget: el });
      fire(under, 'mouseout', x, y, { relatedTarget: el });
      for (let e: Element | null = under; e; e = e.parentElement) e.classList.remove(HOVER);
    }
    if (el) {
      fire(el, 'pointerover', x, y, { relatedTarget: under });
      fire(el, 'mouseover', x, y, { relatedTarget: under });
      for (let e: Element | null = el; e; e = e.parentElement) e.classList.add(HOVER);
    }
    under = el;
  };

  const find = (sel: string) => doc.querySelector(sel);
  // a link that wraps onto two lines is aimed at on its first line, not in the gap between them
  const rectOf = (el: Element): Rect => {
    const r = el.getClientRects()[0] ?? el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  };

  const scrollTo = (target: number, ms: number) =>
    new Promise<void>((done) => {
      const from = win.scrollY;
      const max = doc.documentElement.scrollHeight - win.innerHeight;
      const to = Math.max(0, Math.min(max, target));
      const start = performance.now();
      // each step on an animation frame, so the scroll moves once per screen refresh and never judders; a
      // timer stands in if the frames stop coming, as they once did for half a minute in a scaled frame,
      // and the position comes from the clock either way, so the scroll ends on time
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / ms);
        win.scrollTo({ left: 0, top: from + (to - from) * ease(t), behavior: 'instant' });
        if (t >= 1) return done();
        let stepped = false;
        const frame = win.requestAnimationFrame(() => {
          stepped = true;
          step();
        });
        win.setTimeout(() => {
          if (stepped) return;
          win.cancelAnimationFrame(frame);
          step();
        }, 100);
      };
      step();
    });

  // brings an element on screen, a third of the way down, when it is not already comfortably in view; one
  // pinned to the window, like the book's tabs, is always in reach and never scrolled to
  const pinned = (el: Element) => {
    for (let e: Element | null = el; e; e = e.parentElement) if (['sticky', 'fixed'].includes(win.getComputedStyle(e).position)) return true;
    return false;
  };
  const reveal = async (el: Element) => {
    if (pinned(el)) return;
    const r = el.getBoundingClientRect();
    if (r.top >= 60 && r.bottom <= win.innerHeight - 60) return;
    const y = win.scrollY + r.top - win.innerHeight / 3;
    await scrollTo(y, Math.min(1100, 400 + Math.abs(y - win.scrollY) * 0.5));
  };

  // a pseudo-random pace for typing that is the same on every run
  const typer = (seed: number) => () => (seed = (seed * 48271) % 2147483647) / 2147483647;

  const until = (test: () => boolean, ms: number) =>
    new Promise<boolean>((done) => {
      const start = performance.now();
      const look = () => {
        if (test()) return done(true);
        if (performance.now() - start > ms) return done(false);
        win.setTimeout(look, 50);
      };
      look();
    });

  async function run(c: Command): Promise<unknown> {
    switch (c.cmd) {
      case 'rect': {
        const el = find(c.sel);
        if (!el) throw new Error(`nothing matches ${c.sel}`);
        if (c.reveal) await reveal(el);
        return rectOf(el);
      }
      case 'point': {
        // while a button is held, the moves go to what it pressed, as a captured pointer's do
        const el = held ?? doc.elementFromPoint(c.x, c.y);
        if (!held) hoverTo(el, c.x, c.y);
        if (el) {
          fire(el, 'pointermove', c.x, c.y, { buttons: c.buttons ?? 0 });
          fire(el, 'mousemove', c.x, c.y, { buttons: c.buttons ?? 0 });
        }
        return null;
      }
      case 'press': {
        const el = doc.elementFromPoint(c.x, c.y);
        if (!el) throw new Error(`nothing at ${c.x},${c.y}`);
        hoverTo(el, c.x, c.y);
        fire(el, 'pointerdown', c.x, c.y, { buttons: 1 });
        fire(el, 'mousedown', c.x, c.y, { buttons: 1 });
        el.closest<HTMLElement>('input, button, a, [tabindex], label')?.focus({ preventScroll: true });
        await new Promise((r) => setTimeout(r, 90));
        fire(el, 'pointerup', c.x, c.y);
        fire(el, 'mouseup', c.x, c.y);
        fire(el, 'click', c.x, c.y);
        // a finger leaves the glass, so nothing stays hovered after a tap
        if (touch) hoverTo(null, c.x, c.y);
        return null;
      }
      // a button held and let go, apart: the carriage takes the pointer when pressed, so the release goes
      // to what was pressed, wherever the cursor has gone since
      case 'down': {
        const el = doc.elementFromPoint(c.x, c.y);
        if (!el) throw new Error(`nothing at ${c.x},${c.y}`);
        held = el;
        fire(el, 'pointerdown', c.x, c.y, { buttons: 1 });
        return null;
      }
      case 'up': {
        const el = held ?? doc.elementFromPoint(c.x, c.y);
        held = null;
        if (el) fire(el, 'pointerup', c.x, c.y);
        return null;
      }
      case 'type': {
        const el = find(c.sel) as HTMLInputElement | null;
        if (!el) throw new Error(`nothing matches ${c.sel}`);
        el.focus({ preventScroll: true });
        // React keeps its own copy of an input's value, so the value goes in through the browser's setter
        const setValue = Object.getOwnPropertyDescriptor((win as typeof window).HTMLInputElement.prototype, 'value')!.set!;
        const pace = typer(c.seed);
        for (const ch of c.text) {
          el.dispatchEvent(new (win as typeof window).KeyboardEvent('keydown', { key: ch, bubbles: true }));
          setValue.call(el, el.value + ch);
          el.dispatchEvent(new (win as typeof window).InputEvent('input', { data: ch, inputType: 'insertText', bubbles: true }));
          el.dispatchEvent(new (win as typeof window).KeyboardEvent('keyup', { key: ch, bubbles: true }));
          // a hand types in bursts: quicker inside a word, a beat longer after a space or a dot
          await new Promise((r) => setTimeout(r, 60 + pace() * 70 + (' .@'.includes(ch) ? 110 : 0)));
        }
        return null;
      }
      case 'scroll': {
        let y: number;
        if (typeof c.to === 'number') y = c.to;
        else {
          const el = find(c.to);
          if (!el) throw new Error(`nothing matches ${c.to}`);
          const r = el.getBoundingClientRect();
          // centred brings the middle of the element to the middle of the window
          y = win.scrollY + (c.center ? r.top + r.height / 2 - win.innerHeight / 2 : r.top);
        }
        await scrollTo(y + (c.offset ?? 0), c.ms);
        return win.scrollY;
      }
      case 'wait': {
        const seen = await until(() => {
          const el = find(c.sel);
          if (c.gone) return !el;
          return Boolean(el && (!c.text || el.textContent?.includes(c.text)));
        }, c.ms ?? 15000);
        if (!seen) throw new Error(`waited for ${c.gone ? 'the end of ' : ''}${c.sel}${c.text ? ` saying "${c.text}"` : ''}`);
        return null;
      }
      case 'read':
        return find(c.sel)?.textContent ?? null;
      case 'path':
        return win.location.pathname + win.location.search;
      // the window coming back into use, as when the owner turns to it again
      case 'focus':
        win.dispatchEvent(new (win as typeof window).FocusEvent('focus'));
        return null;
      case 'text': {
        const el = find(c.sel);
        if (el) el.textContent = c.text;
        return null;
      }
    }
  }

  win.addEventListener('message', (e: MessageEvent<Message>) => {
    if (e.source !== win.parent || !e.data?.film) return;
    const { id } = e.data;
    run(e.data).then(
      (value) => win.parent.postMessage({ film: true, id, ok: true, value } satisfies Reply, win.location.origin),
      (err: Error) => win.parent.postMessage({ film: true, id, ok: false, value: err.message } satisfies Reply, win.location.origin),
    );
  });
}

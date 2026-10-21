import Lenis, { type VirtualScrollData } from 'lenis';

// One smooth scroll for the whole page (Lenis): the wheel and the links in the bar ease the page along
// instead of stepping it, and because every wheel turn passes through here first, a section can stop or
// steer the page without the browser's own scrolling getting there first. Touch scrolls natively.

let lenis: Lenis | null = null;
let hook: ((data: VirtualScrollData) => boolean) | null = null;

export function mountSmooth() {
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.12,
    // a section may take a wheel turn for itself; it returns false and cancels the event when it does
    virtualScroll: (data) => hook?.(data) ?? true,
  });
  addEventListener('click', onLink);
  return () => { removeEventListener('click', onLink); lenis?.destroy(); lenis = null; };
}

export const smooth = () => lenis;

// Lets one section see each wheel turn before the page scrolls. Returns the way to stop listening.
export function onWheelTurn(fn: (data: VirtualScrollData) => boolean) {
  hook = fn;
  return () => { if (hook === fn) hook = null; };
}

// Where a link in the page lands. A part of a section that is already in view with the section at the
// top of the screen (the packs beside the sessions on a wide screen) lands on the section, so its heading
// shows; anything lower lands just under the bar.
const BAR = 72;
function landing(href: string) {
  if (href === '#' || href === '#top') return 0;
  const el = document.getElementById(decodeURIComponent(href.slice(1)));
  if (!el) return null;
  const top = (n: Element) => scrollY + n.getBoundingClientRect().top;
  const section = el.closest('section');
  if (el.tagName === 'SECTION' || !section) return top(el);
  return el.getBoundingClientRect().bottom - section.getBoundingClientRect().top <= innerHeight ? top(section) : top(el) - BAR;
}

// A link to somewhere far away jumps most of the way at once and eases only the last screen, so it never
// drags the page through what lies between: the studio plan, which plays as it is scrolled, would
// otherwise run its whole morning on the way down.
function onLink(e: MouseEvent) {
  if (!lenis || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element).closest?.('a[href^="#"]');
  const to = a && landing(a.getAttribute('href')!);
  if (to == null) return;
  e.preventDefault();
  const end = Math.max(0, Math.min(to, lenis.limit)), from = lenis.scroll, near = innerHeight * .6;
  if (Math.abs(end - from) > innerHeight * 1.5) lenis.scrollTo(end - Math.sign(end - from) * near, { immediate: true, force: true });
  lenis.scrollTo(end, { duration: .8, force: true, easing: (t) => 1 - (1 - t) ** 3 });
}

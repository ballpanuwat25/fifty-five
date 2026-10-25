// When the page has opened: the loading screen calls markOpen once it has cleared, and anything that
// should wait for the page to be seen (the hero's opening slide) waits with whenOpen.

let open = false;
const waiting = new Set<() => void>();

export function markOpen() {
  open = true;
  waiting.forEach((f) => f());
  waiting.clear();
}

// runs fn once the page is open (at once if it already is); returns the way to stop waiting
export function whenOpen(fn: () => void) {
  if (open) { fn(); return () => {}; }
  waiting.add(fn);
  return () => { waiting.delete(fn); };
}

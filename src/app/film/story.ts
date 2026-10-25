// The film's story: the same visit at a desk and on a phone, side by side. The name rolls under the cursor
// and the desk pulls the carriage until it says to let go, which opens the booking; the phone scrolls the
// carriage open into the room and books from there. Both write a request and the studio's LINE message
// sends, then the teachers, the packs and the walk from BTS Thong Lo end it. One script for both frames,
// so the two stay in step; the waits are on what the page shows, never on how fast the machine is, so
// every take plays the same way.
import { sleep, type Lane } from '@/app/film/lane';
import type { Rect } from '@/app/film/actor';

const both = (...lanes: Promise<unknown>[]) => Promise.all(lanes);

// a request written into the form under a class's row, and sent
async function request(lane: Lane, name: string, contact: string, seed: number) {
  await lane.see('.ask-form input');
  await sleep(900);
  await lane.press('.ask-form label:nth-of-type(1) input');
  await lane.type('.ask-form label:nth-of-type(1) input', name, seed);
  await sleep(400);
  await lane.press('.ask-form label:nth-of-type(2) input');
  await lane.type('.ask-form label:nth-of-type(2) input', contact, seed + 7);
  await sleep(500);
  await lane.press('.ask-first input');
  await sleep(700);
  await lane.press('.ask-form button.go');
  await lane.see('.line.is-sent');
}

// `mark` names the moment the take has reached, for whatever records it to cut or check against
export async function story(desk: Lane, phone: Lane, mark: (scene: string) => void) {
  // 1. The first view: the name rolls once by itself and the carriage starts to breathe. The cursor passes
  // along the name, looks at two classes, then pulls the carriage until it says to let go, and lets go.
  // The phone picks a class and scrolls the carriage open into the room.
  mark('hero');
  await both(
    (async () => {
      await sleep(3200);
      const name = await desk.ask<Rect>({ cmd: 'rect', sel: '.w1' });
      await desk.glide(name.x + name.width * 0.05, name.y + name.height * 0.5, 1100);
      await desk.glide(name.x + name.width * 0.95, name.y + name.height * 0.45, 1700);
      await sleep(600);
      await desk.hover('.picker button:nth-child(3)', 900);
      await sleep(1300);
      await desk.hover('.picker button:nth-child(2)', 500);
      await sleep(1300);
      await desk.press('.picker button:nth-child(1)');
      await sleep(900);
      // far enough along the rail that the springs are nearly at their limit and the ring says to let go
      const slot = await desk.ask<Rect>({ cmd: 'rect', sel: '.slot' });
      await desk.pull('.slot', Math.min(slot.width * 0.6, 1368 * 0.3) * 2.4, 1500, 900);
      await request(desk, 'Nok', '@nok.thonglo', 11);
      await sleep(2600);
    })(),
    (async () => {
      await sleep(3800);
      await phone.press('.picker button:nth-child(2)');
      await sleep(1400);
      // the stage is two and a half screens tall: the carriage opens to the whole room, and the class is
      // laid over it
      const stage = await phone.ask<Rect>({ cmd: 'rect', sel: '.stage' });
      await phone.scroll(stage.height - 844 * 1.05, 5200);
      await sleep(1800);
      await phone.press('.room-book');
      await sleep(1200);
      await request(phone, 'Ploy', '0812345678', 23);
      await sleep(2200);
    })(),
  );

  // 2. The teachers, and the packs on the ink.
  mark('teachers');
  await both(
    (async () => {
      await desk.scroll('#teachers', 2400);
      await sleep(900);
      await desk.hover('.team-list li:nth-child(2) .team-car', 900);
      await sleep(900);
      await desk.hover('.team-list li:nth-child(3) .team-car', 700);
      await sleep(1400);
      await desk.scroll('#packs', 2200);
      await sleep(2600);
    })(),
    (async () => {
      await phone.scroll('#teachers', 2400);
      await sleep(1000);
      await phone.scroll('.team-list li:nth-child(2)', 2600, -90);
      await sleep(1600);
      await phone.scroll('#packs', 2400);
      await sleep(1400);
      await phone.scroll('.packs-list li:nth-child(4)', 1800, -90);
      await sleep(1200);
    })(),
  );

  // 3. The walk from BTS Thong Lo drawing itself up the soi, and the name once more at the foot.
  mark('find');
  await both(
    (async () => {
      await desk.scroll('#find', 2600);
      await sleep(3800);
      await desk.scroll('.foot', 2600);
      await sleep(3000);
    })(),
    (async () => {
      await phone.scroll('#find', 2600);
      await sleep(1400);
      await phone.scroll('.find-small', 2000, 0, true);
      await sleep(3000);
      await phone.scroll('.foot', 2600);
      await sleep(2600);
    })(),
  );
}

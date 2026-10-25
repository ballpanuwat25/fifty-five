// Everything the homepage says, in one place. Sections read from here; nothing is typed twice.
// Fifty-Five is a fictional studio built as a portfolio piece; Thong Lo is real, the studio is not.
// The class photos are generated (Gemini, then upscaled): an empty room, no people; see design/gemini-prompts.md
// and scripts/export-photos.py.

import { thongLoMap } from './thong-lo-map';

export const studio = {
  name: 'Fifty-Five',
  // Thong Lo is Sukhumvit 55; the name says where it is without a soi number shared by a hundred others
  street: 'Thong Lo 13, Sukhumvit 55',
  // measured along the streets from the station by scripts/build-map.mjs
  walk: `${thongLoMap.walk.minutes} min walk from BTS Thong Lo`,
  beds: 8,
} as const;

export const nav = [
  { label: 'Classes', href: '#classes' },
  { label: 'Teachers', href: '#teachers' },
  { label: 'Packs', href: '#packs' },
  { label: 'Find us', href: '#find' },
] as const;

export const photoOf = (slug: string) => ({ wide: `/photos/${slug}-wide.webp`, tall: `/photos/${slug}-tall.webp` });

// ---- the four classes, the teachers who give them, and the week they make

export type Kind = 'flow' | 'foundations' | 'jumpboard' | 'mat';
export const kinds: Record<Kind, {
  name: string; minutes: number; level: string; places: number; about: string; photo: string;
  // where the carriage's band sits on the wide photo (0 top, 100 bottom), and a zoom from its left edge
  // for a photo whose far right should stay out of the full screen
  bandY: number; zoom?: number;
}> = {
  flow: {
    name: 'Reformer Flow', minutes: 50, level: 'Intermediate', places: 8, photo: 'flow', bandY: 75,
    about: 'One exercise runs into the next with no stops between. For people with a few months on the reformer.',
  },
  foundations: {
    name: 'Foundations', minutes: 50, level: 'Beginners', places: 8, photo: 'foundations', bandY: 45,
    about: 'Where everyone starts: the springs, the straps, how to set the carriage for your body. Slow, with time to ask.',
  },
  jumpboard: {
    name: 'Jumpboard', minutes: 45, level: 'Strong', places: 8, photo: 'jumpboard', bandY: 75, zoom: 1.3,
    about: 'A padded board takes the place of the footbar and you jump lying down. Hard on the lungs, easy on the knees.',
  },
  mat: {
    name: 'Mat 45', minutes: 45, level: 'All levels', places: 12, photo: 'mat', bandY: 85,
    about: 'On the floor, no machines, over lunch. Twelve mats, so there is usually room. Back at your desk by one.',
  },
};

export type Teacher = { name: string; kind: Kind; since: string; about: string };
export const teachers: Teacher[] = [
  { name: 'Prae', kind: 'flow', since: 'Teaching since 2016', about: 'Danced with a contemporary company for eight years, then trained in reformer after a hip injury. Counts out loud and rarely lets the carriage rest.' },
  { name: 'Khao', kind: 'foundations', since: 'Teaching since 2019', about: 'A physiotherapist first. Takes the first-timers and anyone coming back from an injury, and asks about your back before you lie down.' },
  { name: 'Oat', kind: 'jumpboard', since: 'Teaching since 2020', about: 'Swam for Thailand as a junior. Teaches the jumpboard classes to music and keeps them to exactly forty-five minutes.' },
  { name: 'Mint', kind: 'mat', since: 'Teaching since 2018', about: 'Teaches the lunchtime mat class to people from the offices on Thong Lo. Brings the small balls and the rings, and remembers names.' },
];
const teacherOf = (k: Kind) => teachers.find((t) => t.kind === k)!.name;

export type Slot = {
  id: string; kind: Kind; time: string; teacher: string;
  places: number; taken: number;
  // how many are already waiting once it is full
  waiting: number;
};
export type Day = { key: string; short: string; long: string; slots: Slot[] };

// The same times every week. A weekday has an early pair before work, a lunchtime mat class and three
// after work; the weekend starts later. Each day is written as the kinds at those times.
const WEEKDAY = ['07:00', '08:15', '12:15', '17:30', '18:30', '19:45'];
const WEEKEND = ['08:30', '09:45', '11:00', '12:15'];
const PLAN: [string, string, Kind[]][] = [
  // the week starts on the demo's today, Thursday, so the classes in the hero are the first ones listed
  ['Thu', 'Thursday', ['flow', 'foundations', 'mat', 'foundations', 'jumpboard', 'flow']],
  ['Fri', 'Friday', ['jumpboard', 'foundations', 'mat', 'flow', 'foundations', 'jumpboard']],
  ['Sat', 'Saturday', ['foundations', 'flow', 'jumpboard', 'mat']],
  ['Sun', 'Sunday', ['flow', 'foundations', 'flow', 'mat']],
  ['Mon', 'Monday', ['foundations', 'flow', 'mat', 'foundations', 'flow', 'jumpboard']],
  ['Tue', 'Tuesday', ['flow', 'jumpboard', 'mat', 'foundations', 'jumpboard', 'flow']],
  ['Wed', 'Wednesday', ['foundations', 'flow', 'mat', 'flow', 'foundations', 'jumpboard']],
];

// a steady made-up week: before and after work fill up, the middle of the day is quiet, and the further
// a day is from today the fewer have booked it yet
function busy(day: number, time: string, places: number) {
  const h = Number(time.slice(0, 2));
  const base = h < 9 ? 6 : h < 15 ? 3 : h < 19 ? 7 : 5;
  const wobble = ((day * 5 + h * 3 + Number(time.slice(3)) / 15) % 4) - 1;
  return Math.max(0, Math.min(places, Math.round(base + wobble - day * 0.5)));
}

export const week: Day[] = PLAN.map(([short, long, plan], d) => {
  const times = plan.length === WEEKDAY.length ? WEEKDAY : WEEKEND;
  return {
    key: short.toLowerCase(), short, long,
    slots: plan.map((kind, i) => {
      const time = times[i], places = kinds[kind].places;
      const taken = busy(d, time, places);
      return { id: `c-${short.toLowerCase()}-${time.replace(':', '')}`, kind, time, teacher: teacherOf(kind), places, taken, waiting: taken >= places ? 2 : 0 };
    }),
  };
});

// today, as the hero shows it: the 07:00 has three beds left, the 08:15 two, Mat 45 nine mats and the
// Jumpboard is full with two waiting
const today = week[0];
const set = (time: string, taken: number, waiting = 0) => Object.assign(today.slots.find((s) => s.time === time)!, { taken, waiting });
set('07:00', 5); set('08:15', 6); set('12:15', 3); set('18:30', 8, 2);

export const slotById = (id: string) => {
  for (const [d, day] of week.entries()) for (const s of day.slots) if (s.id === id) return { d, day, slot: s };
  return null;
};

// ---- the hero

export type HeroClass = {
  id: string; name: string; day: string; time: string; minutes: number; teacher: string; level: string;
  places: number; taken: number; photo: string; bandY: number; zoom?: number;
};
const heroClass = (s: Slot): HeroClass => {
  const k = kinds[s.kind];
  return { id: s.id, name: k.name, day: today.long, time: s.time, minutes: k.minutes, teacher: s.teacher, level: k.level, places: s.places, taken: s.taken, photo: k.photo, bandY: k.bandY, zoom: k.zoom };
};
const firstOf = (k: Kind) => heroClass(today.slots.find((s) => s.kind === k)!);

// a mat class has mats, every other class reformers ("beds")
export const unit = (k: Kind | string, n = 2) => (k === 'mat' || k === 'Mat 45' ? (n === 1 ? 'mat' : 'mats') : n === 1 ? 'bed' : 'beds');
export const when = (c: HeroClass) => `${c.day.slice(0, 3)} ${c.time}`;
export const free = (c: { name: string; places: number; taken: number }) =>
  c.taken >= c.places ? 'Full, waitlist open' : `${c.places - c.taken} ${unit(c.name, c.places - c.taken)} free`;

export const hero = {
  words: ['Fifty', 'Five'],
  text: 'Reformer Pilates for people who work in Thong Lo and live there too. Classes from 07:00, booked online, eight to a room.',
  book: 'Book a class',
  bookThis: 'Book this class',
  waitlist: 'Join the waitlist',
  // the classes the visitor can put in the carriage, each at its first time today
  classes: [firstOf('flow'), firstOf('foundations'), firstOf('jumpboard'), firstOf('mat')],
} as const;

// ---- booking

export const book = {
  heading: 'This week',
  text: 'Eight beds to a class, twelve mats at lunch. Pick a time and leave your name and a phone number or LINE ID. The studio gets your request on LINE and confirms it there, usually within the hour.',
  today: 'Today',
  full: 'Full',
  request: 'Request',
  waitlist: 'Waitlist',
  name: 'Your name',
  contact: 'Phone or LINE ID',
  first: 'My first class here',
  firstNote: 'First class 690 baht, any class',
  send: 'Send request',
  sendWaitlist: 'Join the waitlist',
  notNow: 'Not now',
  demo: 'Demo: nothing is sent. This is the message the studio would get on its LINE.',
  // what the studio's LINE official account receives, drawn beside the form
  lineFrom: 'Fifty-Five bookings',
  lineSays: 'New request',
  lineWaitlist: 'Waitlist request',
  lineConfirm: 'Confirm',
  lineCall: 'Call',
  held: (name: string) => `Sent, ${name}. Your bed is held while the studio confirms on LINE, usually within the hour.`,
  heldWaitlist: (name: string, n: number) => `Sent, ${name}. You are number ${n} on the waitlist; if a bed opens, the studio messages you on LINE and holds it for an hour.`,
  undo: 'Cancel the request',
  again: 'Done',
};

// a phone number as Thai mobiles are written, or a LINE ID; anything else is asked for again
export const contactKind = (s: string): 'phone' | 'line' | null => {
  const t = s.trim();
  if (/^0\d{8,9}$/.test(t.replace(/[\s-]/g, ''))) return 'phone';
  if (/^@?[a-z0-9._-]{3,20}$/i.test(t) && /[a-z]/i.test(t)) return 'line';
  return null;
};

// ---- packs

export type Pack = { name: string; price: number; note?: string; classes?: number };
export const packs = {
  heading: 'Packs',
  text: 'Buy at the desk, by PromptPay, or ask on LINE. A pack is yours alone and starts on your first class.',
  rows: [
    { name: 'First class', price: 690, note: 'Any class, once' },
    { name: 'Single class', price: 1200 },
    { name: '5 classes', price: 5500, classes: 5, note: 'Use within 2 months' },
    { name: '10 classes', price: 10000, classes: 10, note: 'Use within 4 months' },
    { name: '20 classes', price: 18000, classes: 20, note: 'Use within 6 months' },
    { name: 'Thirty days', price: 8900, note: 'One class a day' },
    { name: 'Private', price: 2200, note: 'One to one, 55 min, any teacher' },
  ] satisfies Pack[],
  note: 'Mat 45 is 600 baht on its own, or half a class from a pack. Cancel up to 12 hours before and the class goes back on your pack.',
  perClass: 'a class',
};

// ---- finding the studio

export const findUs = {
  heading: 'Find us',
  lead: 'on foot from BTS Thong Lo, or two minutes on a motorbike taxi from the stand at the mouth of the soi.',
  station: 'BTS Thong Lo',
  stationCode: 'E6',
  steps: [
    { title: 'BTS Thong Lo', text: 'Come down on the Thong Lo side of Sukhumvit Road.' },
    { title: 'Up Thong Lo', text: 'Walk up Sukhumvit 55, past the cafés and the clinic towers.' },
    { title: 'Left into Soi 13', text: 'Second floor, up the stairs beside the olive awning.' },
  ],
  address: ['2nd floor, Soi Thong Lo 13', 'Khlong Tan Nuea, Watthana', 'Bangkok 10110'],
  hours: [{ days: 'Mon to Fri', time: '06:45–21:00' }, { days: 'Sat and Sun', time: '08:00–14:00' }],
  facts: { address: 'Address', open: 'Open', park: 'Parking', line: 'LINE' },
  park: 'Two cars behind the building',
  line: 'Official account (demo)',
  credit: 'Map data © OpenStreetMap contributors',
};

export const foot = {
  top: 'Back to the top',
  note: 'Fifty-Five is a made-up studio, built as a portfolio piece. Thong Lo and its streets are real; the studio, its teachers and its bookings are not. The photographs of the room were generated with AI and contain no real people. Map data © OpenStreetMap contributors. Type: Zodiak and Switzer from the Indian Type Foundry.',
};

// The loading screen: the carriage drawn along its rail as the first view arrives, counting up to 55
export const loader = { setting: 'Setting the springs', ready: 'Ready' };

// The page for an address the site does not have: a bed the room does not have
export const lost = {
  heading: 'There is no bed 404.',
  text: 'The room has eight, and the page you were looking for is not one of them.',
  home: 'Back to the studio',
  book: 'See this week’s classes',
};

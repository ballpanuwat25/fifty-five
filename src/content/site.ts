// Everything the homepage says, in one place. Sections read from here; nothing is typed twice.
// Fifty-Five is a fictional studio built as a portfolio piece; Thong Lo is real, the studio is not.
// The class photos are generated (Gemini, then upscaled): an empty room, no people; see design/gemini-prompts.md
// and scripts/export-photos.py.


export const studio = {
  name: 'Fifty-Five',
  // Thong Lo is Sukhumvit 55; the name says where it is without a soi number shared by a hundred others
  street: 'Sukhumvit 55, Bangkok',
  walk: '6 min from BTS Thong Lo',
  beds: 8,
} as const;

export const nav = [
  { label: 'Classes', href: '#classes' },
  { label: 'Teachers', href: '#teachers' },
  { label: 'Packs', href: '#packs' },
  { label: 'Find us', href: '#find' },
] as const;

export type HeroClass = {
  name: string; day: string; time: string; minutes: number; teacher: string; level: string;
  places: number; taken: number; photo: string;
  // where the carriage's band sits on the wide photo (0 top, 100 bottom), and a zoom from its left edge
  // for a photo whose far right should stay out of the full screen
  bandY: number; zoom?: number;
};

export const photoOf = (slug: string) => ({ wide: `/photos/${slug}-wide.webp`, tall: `/photos/${slug}-tall.webp` });

// a mat class has mats, every other class reformers ("beds")
const unit = (c: HeroClass) => (c.name.startsWith('Mat') ? 'mats' : 'beds');
export const when = (c: HeroClass) => `${c.day.slice(0, 3)} ${c.time}`;
export const free = (c: HeroClass) => (c.taken >= c.places ? 'Full, waitlist open' : `${c.places - c.taken} ${unit(c)} free`);

export const hero = {
  words: ['Fifty', 'Five'],
  text: 'Reformer Pilates for people who work in Thong Lo and live there too. Classes from 07:00, booked online, eight to a room.',
  book: 'Book a class',
  bookThis: 'Book this class',
  waitlist: 'Join the waitlist',
  // the classes the visitor can put in the carriage, each at its next time with room
  classes: [
    { name: 'Reformer Flow', day: 'Thursday', time: '07:00', minutes: 50, teacher: 'Prae', level: 'Intermediate', places: 8, taken: 5, photo: 'flow', bandY: 75 },
    { name: 'Foundations', day: 'Thursday', time: '08:15', minutes: 50, teacher: 'Khao', level: 'Beginners', places: 8, taken: 6, photo: 'foundations', bandY: 45 },
    { name: 'Jumpboard', day: 'Thursday', time: '18:30', minutes: 45, teacher: 'Oat', level: 'Strong', places: 8, taken: 8, photo: 'jumpboard', bandY: 75, zoom: 1.3 },
    { name: 'Mat 45', day: 'Thursday', time: '12:15', minutes: 45, teacher: 'Mint', level: 'All levels', places: 12, taken: 3, photo: 'mat', bandY: 85 },
  ] satisfies HeroClass[],
} as const;

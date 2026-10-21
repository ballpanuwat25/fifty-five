// Everything the homepage says, in one place. Sections read from here; nothing is typed twice.
// Fifty-Five is a fictional studio built as a portfolio piece; Thong Lo is real, the studio is not.
// Photos for now: one Unsplash shoot by Roxana Popovici (@roxanarxx), until a matching set is made.

const unsplash = (id: string, w = 1800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80`;

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
  places: number; taken: number; wide: string; tall: string;
};

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
  // the classes the visitor can put in the carriage, each at its next time with room; wide photos for the
  // pill and wide screens, tall ones for screens held upright
  classes: [
    { name: 'Reformer Flow', day: 'Thursday', time: '07:00', minutes: 50, teacher: 'Prae', level: 'Intermediate', places: 8, taken: 5, wide: unsplash('1747239685045-fcbcf98985db'), tall: unsplash('1747238415033-b74eec07eb59', 1200) },
    { name: 'Foundations', day: 'Thursday', time: '08:15', minutes: 50, teacher: 'Khao', level: 'Beginners', places: 8, taken: 6, wide: unsplash('1747240549807-fc3962949818'), tall: unsplash('1747239202356-764770773c9a', 1200) },
    { name: 'Jumpboard', day: 'Thursday', time: '18:30', minutes: 45, teacher: 'Oat', level: 'Strong', places: 8, taken: 8, wide: unsplash('1747239891485-0f98c4ee9c76'), tall: unsplash('1747238606090-b0fd1d7a6068', 1200) },
    { name: 'Mat 45', day: 'Thursday', time: '12:15', minutes: 45, teacher: 'Mint', level: 'All levels', places: 12, taken: 3, wide: unsplash('1747240031720-dced770be260'), tall: unsplash('1747239069226-55382c570116', 1200) },
  ] satisfies HeroClass[],
} as const;

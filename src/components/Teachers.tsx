import { kinds, teachers, week } from '@/content/site';

// The four teachers, each in a portrait framed as an upright carriage, the page's one shape. The
// portraits are generated, like the room (the footer says so), and none is of a real person. Each ends
// with the teacher's next class, which opens its booking in the week above.

const nextOf = (name: string) => {
  for (const d of week) {
    const s = d.slots.find((x) => x.teacher === name && x.taken < x.places);
    if (s) return { day: d.short, slot: s };
  }
  return null;
};

export default function Teachers() {
  return (
    <section className="team" id="teachers">
      <div className="team-head">
        <h2>Teachers</h2>
        <p>Four teachers, one class each, so you always know who is at the front of the room.</p>
      </div>
      <ul className="team-list">
        {teachers.map((t) => {
          const k = kinds[t.kind], next = nextOf(t.name);
          return (
            <li key={t.name}>
              <span className="team-car">
                {/* the photos are already sized and compressed for the site (scripts/export-photos.py) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/photos/teacher-${t.name.toLowerCase()}.webp`} alt={`${t.name}, who teaches ${k.name}`} width={800} height={993} loading="lazy" />
              </span>
              <h3>{t.name}</h3>
              <p className="team-what">{k.name} · {t.since}</p>
              <p className="team-about">{t.about}</p>
              {next && <a className="team-next" href={`#${next.slot.id}`}>Next: {next.day} {next.slot.time}</a>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

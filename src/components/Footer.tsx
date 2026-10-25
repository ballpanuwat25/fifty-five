import { thongLoMap } from '@/content/thong-lo-map';
import { findUs, foot, hero, studio } from '@/content/site';

// The foot of the page says the name once more the way the hero does, the two words with a carriage
// between them, here at rest; then where, when, and what this site is.

export default function Footer() {
  return (
    <footer className="foot">
      <p className="foot-name" aria-label={studio.name}>
        <span>{hero.words[0]}</span>
        <span className="foot-car" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/flow-wide.webp" alt="" loading="lazy" />
        </span>
        <span>{hero.words[1]}</span>
      </p>

      <div className="foot-cols">
        <p><strong>{studio.name}</strong>{findUs.address.map((a) => <span key={a}>{a}</span>)}</p>
        <p><strong>{findUs.facts.open}</strong>{findUs.hours.map((h) => <span key={h.days}>{h.days} {h.time}</span>)}</p>
        <p><strong>{findUs.station} {findUs.stationCode}</strong><span>{thongLoMap.walk.minutes} minutes on foot</span><a className="foot-top" href="#top">{foot.top}</a></p>
      </div>
      <p className="foot-note">{foot.note}</p>
    </footer>
  );
}

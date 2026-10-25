import { packs } from '@/content/site';

// The price list, on the page's ink: a pack's price, and for the packs of classes what one class comes to
// and a row of small carriages, one for each class in it.

const baht = (n: number) => n.toLocaleString('en-US');

export default function Packs() {
  return (
    <section className="packs" id="packs">
      <div className="packs-head">
        <h2>{packs.heading}</h2>
        <p>{packs.text}</p>
      </div>
      <ul className="packs-list">
        {packs.rows.map((p) => (
          <li key={p.name}>
            <span className="packs-name">{p.name}</span>
            <span className="packs-note">
              {'classes' in p && p.classes ? `${baht(p.price / p.classes)} ${packs.perClass} · ` : ''}{p.note}
            </span>
            {'classes' in p && p.classes
              ? <span className="packs-cars" aria-hidden="true">{Array.from({ length: p.classes }, (_, i) => <i key={i} />)}</span>
              : <span className="packs-cars" aria-hidden="true" />}
            <span className="packs-price">{baht(p.price)}<small> baht</small></span>
          </li>
        ))}
      </ul>
      <p className="packs-note-end">{packs.note}</p>
    </section>
  );
}

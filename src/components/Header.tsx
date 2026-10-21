import { hero, nav, studio } from '@/content/site';

export default function Header() {
  return (
    <header className="bar">
      <a className="bar-name" href="#top">{studio.name}</a>
      <nav>{nav.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}</nav>
      <a className="bar-book" href="#classes">{hero.book}</a>
    </header>
  );
}

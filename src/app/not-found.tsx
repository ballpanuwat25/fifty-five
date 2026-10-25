import type { Metadata } from 'next';
import Link from 'next/link';
import { lost, studio } from '@/content/site';

// Any address the site does not have: a bed the room does not have. The number is set like the name in
// the hero, its 0 a carriage, and under it the room's eight beds, every one of them there.

export const metadata: Metadata = { title: `Not here · ${studio.name}`, robots: { index: false } };

export default function NotFound() {
  return (
    <main className="lost">
      <Link className="bar-name lost-mark" href="/">{studio.name}</Link>
      <div className="lost-in">
        <p className="lost-no" aria-label="404">
          <span aria-hidden="true">4</span>
          <span className="lost-car" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/foundations-wide.webp" alt="" />
          </span>
          <span aria-hidden="true">4</span>
        </p>
        <span className="lost-beds" aria-hidden="true">{Array.from({ length: studio.beds }, (_, i) => <i key={i} />)}</span>
        <h1>{lost.heading}</h1>
        <p className="lost-text">{lost.text}</p>
        <div className="lost-act">
          <Link className="lost-home" href="/">{lost.home}</Link>
          <Link className="lost-book" href="/#classes">{lost.book}</Link>
        </div>
      </div>
    </main>
  );
}

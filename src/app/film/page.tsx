// /film: the stage the portfolio video is recorded from (Stage.tsx). Only there on the dev server or with
// FILM_MODE=1 set by hand for a recording; everywhere else the address does not exist.
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { studio } from '@/content/site';
import Stage from '@/app/film/Stage';
import './film.css';

export const metadata: Metadata = { title: `Film · ${studio.name}`, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function Film() {
  if (process.env.FILM_MODE !== '1' && process.env.NODE_ENV !== 'development') notFound();
  return <Stage />;
}

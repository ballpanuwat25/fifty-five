'use client';

import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { book, contactKind, kinds, slotById, unit, week, type Slot } from '@/content/site';

// The week's classes, a day at a time, and a booking request made under the class's own row. A request
// is a name and a phone number or LINE ID; the studio is told on its LINE official account and confirms
// there. Beside the form the message the studio would get writes itself as the visitor types, and sends
// when they do. Each class shows its beds as a row of small carriages, filled for each one taken; the
// visitor's own fills in the olive of the page. Nothing here leaves the page: it is a demo.
//
// A link anywhere on the page to a class's row (the hero's carriage, a teacher's next class) opens that
// class here, on its day.

type Request = { name: string; contact: string; first: boolean; at: string; place?: number };

const clock = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

export default function Classes() {
  const [day, setDay] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  // requests this visitor has sent in the demo, by class, so its beds fill as they book
  const [mine, setMine] = useState<Record<string, Request>>({});

  useEffect(() => {
    // the row has to be on the page before the smooth scroll looks for it, so the day changes at once
    const onLink = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href^="#c-"]');
      const found = a && slotById(a.getAttribute('href')!.slice(1));
      if (!found) return;
      flushSync(() => { setDay(found.d); setOpen(found.slot.id); });
    };
    document.addEventListener('click', onLink);
    return () => document.removeEventListener('click', onLink);
  }, []);

  const slots = week[day].slots;
  const taken = (s: Slot) => s.taken + (mine[s.id] && mine[s.id].place === undefined ? 1 : 0);

  return (
    <section className="tt" id="classes">
      <div className="tt-head">
        <h2>{book.heading}</h2>
        <p>{book.text}</p>
      </div>

      <div className="tt-days" role="tablist" aria-label="Day">
        {week.map((d, i) => (
          <button key={d.key} type="button" role="tab" aria-selected={i === day} onClick={() => { setDay(i); setOpen(null); }}>
            <span>{d.short}</span>{i === 0 && <small>{book.today}</small>}
          </button>
        ))}
      </div>

      <ul className="tt-list">
        {slots.map((s) => {
          const k = kinds[s.kind], n = taken(s), full = n >= s.places, isOpen = open === s.id, had = mine[s.id];
          return (
            <li key={s.id} id={s.id} data-land="self" className={isOpen ? 'is-open' : undefined}>
              <div className="tt-row">
                <time>{s.time}</time>
                <span className="tt-what">
                  <b>{k.name}</b>
                  <span>with {s.teacher} · {k.minutes} min · {k.level}</span>
                </span>
                <Beds places={s.places} taken={n} mine={!!had && had.place === undefined} />
                <span className="tt-left">
                  {full ? <>{book.full}<small> · {s.waiting + (had?.place ? 1 : 0)} waiting</small></> : `${s.places - n} ${unit(s.kind, s.places - n)} left`}
                </span>
                <span className="tt-act">
                  {had ? <em>{had.place ? `On the waitlist, no. ${had.place}` : 'Requested'}</em>
                    : <button type="button" className={full ? 'quiet' : undefined} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
                        {full ? book.waitlist : book.request}
                      </button>}
                </span>
              </div>
              {isOpen && (
                <Ask
                  slot={s} dayLong={week[day].long} taken={n} sent={mine[s.id]}
                  onSend={(r) => setMine((m) => ({ ...m, [s.id]: r }))}
                  onUndo={() => { setMine((m) => { const c = { ...m }; delete c[s.id]; return c; }); }}
                  onClose={() => setOpen(null)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// a class's beds as small carriages side by side, the way they stand in the room
function Beds({ places, taken, mine }: { places: number; taken: number; mine: boolean }) {
  return (
    <span className={`tt-beds${places > 8 ? ' is-mats' : ''}`} aria-hidden="true">
      {Array.from({ length: places }, (_, i) => (
        <i key={i} className={mine && i === taken - 1 ? 'is-mine' : i < taken ? 'is-taken' : undefined} />
      ))}
    </span>
  );
}

// The request under a class's row: the form, and beside it the studio's LINE, where the message the
// studio will get is written out as the visitor types it
function Ask({ slot, dayLong, taken, sent, onSend, onUndo, onClose }: {
  slot: Slot; dayLong: string; taken: number; sent?: Request;
  onSend: (r: Request) => void; onUndo: () => void; onClose: () => void;
}) {
  const k = kinds[slot.kind];
  const full = (sent && sent.place === undefined ? taken - 1 : taken) >= slot.places;
  const [name, setName] = useState(sent?.name ?? '');
  const [contact, setContact] = useState(sent?.contact ?? '');
  const [first, setFirst] = useState(sent?.first ?? false);
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const first$ = useRef<HTMLInputElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    first$.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close.current(); };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const nameOk = name.trim().length >= 2, kind = contactKind(contact);
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!nameOk || !kind || sending) return;
    setSending(true);
    // the time it takes a message to reach LINE, so the send reads as a send
    setTimeout(() => {
      onSend({ name: name.trim(), contact: contact.trim(), first, at: clock(), place: full ? slot.waiting + 1 : undefined });
      setSending(false);
    }, 650);
  };

  const left = slot.places - taken;
  const shown = { name: name.trim() || '—', contact: contact.trim() || '—' };

  return (
    <div className="tt-ask">
      <div className="tt-ask-in">
        <div className="ask-form">
          <p className="ask-what">
            <b>{k.name}</b>
            <span>{dayLong} · {slot.time} · {k.minutes} min · with {slot.teacher}</span>
          </p>
          <p className="ask-about">{k.about}</p>

          {!sent ? (
            <form onSubmit={send} noValidate>
              <label className={tried && !nameOk ? 'is-wrong' : undefined}>
                <span>{book.name}</span>
                <input ref={first$} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" maxLength={40} />
                {tried && !nameOk && <small>A name the teacher can call you by</small>}
              </label>
              <label className={tried && !kind ? 'is-wrong' : undefined}>
                <span>{book.contact}</span>
                <input value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="tel" inputMode="text" maxLength={24} placeholder="081 234 5678 or @yourline" />
                {tried && !kind && <small>A Thai mobile number, or your LINE ID</small>}
              </label>
              {!full && (
                <label className="ask-first">
                  <input type="checkbox" checked={first} onChange={(e) => setFirst(e.target.checked)} />
                  <span>{book.first}<small>{book.firstNote}</small></span>
                </label>
              )}
              <div className="ask-acts">
                <button type="submit" className="go" disabled={sending}>{sending ? 'Sending…' : full ? book.sendWaitlist : book.send}</button>
                <button type="button" className="quiet" onClick={onClose}>{book.notNow}</button>
              </div>
            </form>
          ) : (
            <div className="ask-done" role="status">
              <p>{sent.place ? book.heldWaitlist(sent.name, sent.place) : book.held(sent.name)}</p>
              <p className="ask-left">
                {sent.place ? `${slot.waiting + 1} waiting for ${slot.time}` : left > 0 ? `${left} ${unit(slot.kind, left)} left at ${slot.time}` : `That was the last ${unit(slot.kind, 1)} at ${slot.time}`}
              </p>
              <div className="ask-acts">
                <button type="button" className="go" onClick={onClose}>{book.again}</button>
                <button type="button" className="quiet" onClick={onUndo}>{book.undo}</button>
              </div>
            </div>
          )}
          <p className="ask-demo">{book.demo}</p>
        </div>

        <figure className={`line${sent ? ' is-sent' : ''}`} aria-label="The message the studio gets on LINE">
          <figcaption className="line-top">
            <span className="line-av" aria-hidden="true">55</span>
            <span><b>{book.lineFrom}</b><small>LINE official account · demo</small></span>
          </figcaption>
          <div className="line-chat">
            <p className="line-day">Today</p>
            <div className="line-card">
              <p className="line-kicker">{full || sent?.place ? book.lineWaitlist : book.lineSays}</p>
              <p className="line-class">{k.name}</p>
              <dl>
                <div><dt>When</dt><dd>{dayLong.slice(0, 3)} {slot.time} · {slot.teacher}</dd></div>
                <div><dt>Name</dt><dd>{shown.name}</dd></div>
                <div><dt>{kind === 'line' ? 'LINE' : 'Phone'}</dt><dd>{shown.contact}</dd></div>
                {first && <div><dt>First class</dt><dd>Yes, 690</dd></div>}
                <div><dt>{full || sent?.place ? 'Waitlist' : 'Beds'}</dt><dd>{full || sent?.place ? `No. ${sent?.place ?? slot.waiting + 1}` : `${sent ? left : left - 1} of ${slot.places} left after this`}</dd></div>
              </dl>
              <div className="line-btns" aria-hidden="true"><span>{book.lineConfirm}</span><span>{book.lineCall}</span></div>
            </div>
            <p className="line-time">{sent ? `${sent.at} · Delivered` : 'Writing…'}</p>
          </div>
        </figure>
      </div>
    </div>
  );
}

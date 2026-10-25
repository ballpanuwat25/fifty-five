'use client';

import { useEffect, useRef } from 'react';
import { thongLoMap } from '@/content/thong-lo-map';
import { findUs, studio } from '@/content/site';

// Where the studio is, as the walk from BTS Thong Lo in three steps beside a map cropped to that walk. The
// streets come from OpenStreetMap; the walk is routed along them by scripts/build-map.mjs, which also
// measures it. The walk draws itself once, from the station up, as the map comes into view, and the
// studio is marked with a carriage, the shape the page is built on.

type Pt = readonly [number, number];
const m = thongLoMap;
const VIEW = '150 70 340 540';
const route = m.walk.route.match(/-?[\d.]+/g)!.map(Number);
const mouth: Pt = [route[0], route[1]];
// rounded, so the server and the browser, whose trigonometry can differ in the last digit, draw the same
const angle = (a: Pt, b: Pt) => Math.round(Math.atan2(b[1] - a[1], b[0] - a[0]) * 1800 / Math.PI) / 10;
const upright = (deg: number) => (deg > 90 || deg < -90 ? deg + 180 : deg);
// the map data holds the BTS as its two tracks, which pull apart at this scale; one is drawn, as one line
const RAIL = 'M' + m.rail.split('M')[1];
const railXY = RAIL.match(/-?[\d.]+/g)!.map(Number);

// The station sits on the line, as a transit map draws it: the point on the track nearest the station
const onLine = (p: Pt): Pt => {
  let best: Pt = p, bestD = Infinity;
  for (let i = 0; i + 3 < railXY.length; i += 2) {
    const [ax, ay, bx, by] = railXY.slice(i, i + 4), dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / (dx * dx + dy * dy || 1)));
    const q: Pt = [ax + dx * t, ay + dy * t], d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bestD) { best = q; bestD = d; }
  }
  return best;
};
const S = onLine(m.station as Pt);
const [T, P] = m.walk.legs.map((l) => l.to as Pt);
// the walk from the platform along Sukhumvit Road to the mouth of the soi, then up it
const WALK = `M${S[0].toFixed(1)} ${S[1].toFixed(1)}L${m.walk.route.slice(1)}`;
const RAIL_DEG = angle([railXY[0], railXY[1]], [railXY[2], railXY[3]]);
// the three numbered steps: the station, the mouth of Thong Lo, the turn into Soi 13
const STEPS: Pt[] = [S, mouth, T];
const STEP_AT: Pt[] = [[4, 22], [18, 10], [18, 6]];

// k is how many screen pixels one map unit draws at, so text and markers keep their size in either size
function Map({ k, className }: { k: number; className: string }) {
  return (
    <svg viewBox={VIEW} className={className} role="img" aria-label={`Map: ${studio.name} on Soi Thong Lo 13, ${m.walk.minutes} minutes on foot from BTS Thong Lo`}>
      <path d={m.roads.lane} className="r-lane" />
      <path d={m.roads.street} className="r-street" />
      <path d={m.roads.major} className="r-major" />
      {/* the BTS runs overhead along Sukhumvit Road, drawn in the Sukhumvit line's own green */}
      <path d={RAIL} className="r-rail" />
      <text className="r-name" fontSize={11 / k} transform={`translate(${S[0] - 76} ${S[1] - 62}) rotate(${upright(RAIL_DEG)})`}>Sukhumvit Road</text>
      <text className="r-name" fontSize={11 / k} textAnchor="middle" transform={`translate(${(mouth[0] + T[0]) / 2 + 22} ${(mouth[1] + T[1]) / 2 + 30}) rotate(${upright(angle(mouth, T))})`}>Thong Lo · Sukhumvit 55</text>

      <path d={WALK} className="r-walk" pathLength={1} />
      <text className="r-leg" fontSize={12 / k} textAnchor="middle"
        transform={`translate(${(mouth[0] + T[0]) / 2 - 12} ${(mouth[1] + T[1]) / 2}) rotate(${upright(angle(mouth, T))}) translate(0 ${-6 / k})`}>{m.walk.legs[0].metres.toLocaleString('en-US')} m</text>
      <text className="r-leg" fontSize={11 / k} textAnchor="middle" x={(T[0] + P[0]) / 2} y={(T[1] + P[1]) / 2 - 12 / k}>Soi 13</text>

      {/* the station as a transit map marks it, with its code on the line */}
      <circle cx={S[0]} cy={S[1]} r={7 / k} className="r-station" />
      <text className="r-place" fontSize={14 / k} x={S[0] + 30 / k} y={S[1] + 48 / k} textAnchor="end">
        {findUs.station}<tspan className="r-code" fontSize={11 / k} dx={6 / k}>{findUs.stationCode}</tspan>
      </text>
      {/* the studio, marked with a carriage */}
      <rect className="r-studio" x={P[0] - 26 / k} y={P[1] - 7 / k} width={30 / k} height={14 / k} rx={7 / k} />
      <text className="r-mark" fontSize={17 / k} x={P[0] - 34 / k} y={P[1] + 6 / k} textAnchor="end">{studio.name}</text>
      {STEPS.map(([x, y], i) => (
        <g key={i} className="r-step" transform={`translate(${x + STEP_AT[i][0] / k} ${y + STEP_AT[i][1] / k})`}>
          <circle r={10 / k} />
          <text fontSize={11 / k} textAnchor="middle" dy={3.8 / k}>{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

export default function FindUs() {
  const map = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = map.current!;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.classList.add('is-walked');
      io.disconnect();
    }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="find" id="find">
      <div className="find-text">
        <h2>{findUs.heading}</h2>
        <p className="find-lead"><b>{m.walk.minutes} minutes</b> {findUs.lead}</p>
        <ol className="find-steps">
          {findUs.steps.map((s, i) => (
            <li key={s.title}>
              <i>{i + 1}</i>
              <span>
                <b>{s.title}</b>
                {s.text}{i > 0 && ` ${m.walk.legs[i - 1].metres.toLocaleString('en-US')} m.`}
              </span>
            </li>
          ))}
        </ol>
        <dl className="find-facts">
          <div><dt>{findUs.facts.address}</dt><dd>{findUs.address.map((l) => <span key={l}>{l}</span>)}</dd></div>
          <div><dt>{findUs.facts.open}</dt><dd>{findUs.hours.map((h) => <span key={h.days}>{h.days} <b>{h.time}</b></span>)}</dd></div>
          <div><dt>{findUs.facts.park}</dt><dd>{findUs.park}</dd></div>
          <div><dt>{findUs.facts.line}</dt><dd>{findUs.line}</dd></div>
        </dl>
      </div>

      <figure className="find-map" ref={map}>
        <Map k={1.5} className="find-wide" />
        <Map k={1.05} className="find-small" />
        <figcaption>{findUs.credit}</figcaption>
      </figure>
    </section>
  );
}

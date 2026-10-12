import { categoryTile } from '@6pm/theme';

import { symbolCodepoints } from '../../ui/icons/symbols.generated';
import type { ZineStat } from '../diary/zine/zine-cover';
import type { ZineTicket } from '../diary/zine/zine-pages';
import type { ZineView } from '../diary/zine/zine-view';

/** Text from the user or the catalogue, made safe to place in the book's HTML. */
export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** The words a month's pages print around its numbers. */
export interface MonthLabels {
  readonly stamp: string;
  readonly places: string;
  readonly every: string;
  readonly signoff: string;
}

/** The kicker row at the top of a page: the diary's number on the left, the year on the right. */
export function pageHead(kicker: string, year: string): string {
  return `<div class="head"><span>${esc(kicker)}</span><span>${esc(year)}</span></div>`;
}

/** The headline and the tilted CLOSED stamp, as the zine opens. */
export function titleBlock(
  title: string,
  headline: string,
  closed: string,
  stamp: string,
  className = '',
): string {
  return `<div class="title-block ${className}">
  <div class="zine-title">${esc(title)}</div>
  <div class="headline-row">
    <div class="headline">${esc(headline)}</div>
    <div class="stamp">${esc(closed)}<br>${esc(stamp)}</div>
  </div>
</div>`;
}

export function statGrid(stats: readonly ZineStat[]): string {
  return `<div class="stats">${stats
    .map(
      (s) => `<div class="stat">
  <div class="stat-key">${esc(s.key)}</div>
  <div class="stat-value">${esc(s.value)}</div>
  <div class="stat-sub">${esc(s.sub)}</div>
</div>`,
    )
    .join('')}</div>`;
}

function places(title: string, rows: ZineView['places']): string {
  if (rows.length === 0) return '';
  return `<div class="places"><div class="label">${esc(title)}</div>${rows
    .map((p) => {
      const tile = categoryTile(p.hue);
      return `<div class="place">
  <div class="tile" style="background:linear-gradient(155deg, ${tile.from} 0%, ${tile.to} 100%);color:${tile.glyph}"><span class="symbol">&#x${symbolCodepoints[p.icon].toString(16)};</span></div>
  <div class="place-body">
    <div class="place-row"><span class="place-name">${esc(p.name)} <span class="place-sub">· ${esc(p.sub)}</span></span><span class="place-amount">${esc(p.amount)}</span></div>
    <div class="bar"><div style="width:${p.pct}%"></div></div>
  </div>
</div>`;
    })
    .join('')}</div>`;
}

function ticket(t: ZineTicket | null, tilt: number): string {
  if (t === null) return '<div></div>';
  return `<div class="ticket" style="transform:rotate(${tilt}deg)">
  <div class="ticket-paper">
    <div class="ticket-label">${esc(t.label)}</div>
    <div class="ticket-date">${esc(t.date)}</div>
    <div class="ticket-amount">${esc(t.amount)}</div>
    ${t.note ? `<div class="ticket-note">${esc(t.note)}</div>` : ''}
  </div>
  <div class="ticket-edge"></div>
</div>`;
}

const TILTS = [-2, 1.5, -1, 2, -1.5, 1];

function everyDay(title: string, zine: ZineView): string {
  return `<div class="every">
  <div class="label row"><span>${esc(title)}</span><span>${esc(zine.closedText)}</span></div>
  <div class="days">${zine.everyDay
    .map(
      (d, i) => `<div class="day" style="transform:rotate(${TILTS[i % 6] ?? 0}deg)">
  <div class="day-dow">${esc(d.dow)}</div>
  <div class="day-no">${esc(d.day)}</div>
  <div class="day-total"><span style="background:${d.dot}"></span>${esc(d.total)}</div>
</div>`,
    )
    .join('')}</div>
</div>`;
}

/** The handwritten note, signed by 6pm and its companion (none in serious mode). */
function note(text: string, signoff: string, companion: string | null): string {
  return `<div class="note">
  <div class="tape"></div>
  <div class="note-text">${esc(text)}</div>
  <div class="note-sign"><span>${esc(signoff)}</span>${
    companion ? `<img src="data:image/png;base64,${companion}" width="40" height="40">` : ''
  }</div>
</div>`;
}

const grain = '<div class="grain"></div>';

/**
 * A month's money diary as two pages of the book, each on the month's cover tint: the opening
 * (title, headline, stamp, stats, where it went), then the days (quietest and biggest, every day
 * closed, 6pm's note).
 */
export function monthPages(input: {
  readonly zine: ZineView;
  readonly kicker: string;
  readonly year: string;
  readonly labels: MonthLabels;
  readonly companion: string | null;
}): string {
  const { zine, kicker, year, labels, companion } = input;
  const head = pageHead(kicker, year);
  const tickets =
    zine.quiet || zine.big
      ? `<div class="tickets">${ticket(zine.quiet, -1.5)}${ticket(zine.big, 1.5)}</div>`
      : '';
  return `<section class="page" style="background:${zine.tint}">${grain}${head}
<div class="zine">
${titleBlock(zine.title, zine.headline, zine.closedText, labels.stamp)}
${statGrid(zine.stats)}
${places(labels.places, zine.places)}
</div></section>
<section class="page" style="background:${zine.tint}">${grain}${head}
<div class="zine">
${tickets}
${everyDay(labels.every, zine)}
${note(zine.note, labels.signoff, companion)}
</div></section>`;
}

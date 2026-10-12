import { paperInk, yearBookInk, zineInk } from '@6pm/theme';

import type { ZineStat } from '../diary/zine/zine-cover';
import {
  esc,
  monthPages,
  pageHead,
  statGrid,
  titleBlock,
  type MonthLabels,
} from './year-book-month';
import type { ZineView } from '../diary/zine/zine-view';

/** A page of the book: one phone screen of the money diary, in points. */
export const PAGE = { width: 402, height: 874 } as const;

/** The prototype's paper tooth: fractal noise (base frequency .85, two octaves) at 30%, multiplied. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const HAND = "'Patrick Hand', cursive";
const BODY = '-apple-system, system-ui, sans-serif';

/** The zine's styles, as the money diary sheet sets them, at print size. */
function css(display: string): string {
  return `
@page{size:${PAGE.width}px ${PAGE.height}px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:${BODY};-webkit-font-smoothing:antialiased}
.page{position:relative;width:${PAGE.width}px;height:${PAGE.height}px;overflow:hidden;color:${zineInk.ink};break-after:page;page-break-after:always}
.page:last-child{break-after:auto;page-break-after:auto}
.grain{position:absolute;inset:0;pointer-events:none;opacity:.3;mix-blend-mode:multiply;background-image:${GRAIN}}
.head{position:relative;display:flex;justify-content:space-between;align-items:center;min-height:40px;padding:22px 20px 4px;font-family:${MONO};font-size:11px;letter-spacing:.16em;opacity:.6}
.zine{position:relative;padding:12px 20px 0;display:flex;flex-direction:column;gap:30px}
.title-block{display:flex;flex-direction:column;gap:14px}
.zine-title{font-family:${display};font-weight:500;font-size:68px;line-height:.9;letter-spacing:-.045em;white-space:nowrap}
.headline-row{display:flex;align-items:flex-end;justify-content:space-between;gap:16px}
.headline{font-family:${display};font-weight:500;font-size:27px;line-height:1.1;letter-spacing:-.015em;text-wrap:pretty;max-width:230px}
.stamp{flex-shrink:0;padding:6px 10px 5px;border:2.5px solid ${zineInk.stamp};color:${zineInk.stamp};border-radius:6px;font-family:${MONO};font-weight:600;font-size:12px;letter-spacing:.14em;line-height:1.2;text-align:center;transform:rotate(8deg);mix-blend-mode:multiply;margin-bottom:6px}
.stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.stat{background:${paperInk.sheet};color:${paperInk.ink};box-shadow:0 8px 18px rgba(40,10,30,.16);border-radius:6px;padding:12px 14px 13px;display:flex;flex-direction:column;gap:4px}
.stat-key{font-family:${MONO};font-size:10px;letter-spacing:.12em;text-transform:uppercase;opacity:.55}
.stat-value{font-family:${display};font-weight:500;font-size:30px;line-height:1;letter-spacing:-.02em}
.stat-sub{font-size:12.5px;opacity:.65}
.label{font-family:${MONO};font-size:11px;letter-spacing:.16em;opacity:.6}
.label.row{display:flex;justify-content:space-between}
.places{display:flex;flex-direction:column;gap:12px}
.place{display:flex;align-items:center;gap:12px}
.tile{width:38px;height:38px;border-radius:13px;flex-shrink:0;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 3px 8px rgba(30,10,40,.14)}
.symbol{font-family:'Material Symbols Rounded';font-weight:normal;line-height:1;font-size:21px;font-variation-settings:'FILL' 1,'wght' 500,'opsz' 21}
.place-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.place-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.place-name{font-size:15px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.place-sub{font-weight:500;opacity:.6}
.place-amount{font-family:${display};font-weight:500;font-size:19px}
.bar{height:4px;border-radius:4px;background:${zineInk.track}}
.bar div{height:100%;border-radius:4px;background:${zineInk.ink}}
.tickets{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.ticket{filter:drop-shadow(0 8px 14px rgba(40,10,30,.18))}
.ticket-paper{background:${paperInk.sheet};color:${paperInk.ink};padding:12px 12px 14px;border-radius:3px 3px 0 0;display:flex;flex-direction:column;gap:5px}
.ticket-label{font-family:${MONO};font-size:9.5px;letter-spacing:.14em;opacity:.55}
.ticket-date{font-family:${MONO};font-size:11px;font-weight:600}
.ticket-amount{font-family:${display};font-weight:500;font-size:26px;line-height:1;padding-top:2px}
.ticket-note{font-family:${HAND};font-size:17px;line-height:1.05;color:${paperInk.hand};padding-top:2px}
.ticket-edge{height:8px;background:radial-gradient(circle at 5px 8px, transparent 4.5px, ${paperInk.sheet} 5px) 0 0 / 10px 8px repeat-x}
.every{display:flex;flex-direction:column;gap:12px}
.days{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px 7px}
.day{background:${paperInk.sheet};color:${paperInk.ink};border-radius:3px;padding:5px 4px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;box-shadow:0 4px 8px rgba(40,10,30,.14);font-family:${MONO}}
.day-dow{font-size:7.5px;letter-spacing:.06em;opacity:.55}
.day-no{font-family:${display};font-weight:500;font-size:18px;line-height:1}
.day-total{display:flex;align-items:center;gap:3px;font-size:8.5px;font-weight:600}
.day-total span{width:4px;height:4px;border-radius:50%}
.note{position:relative;align-self:center;width:290px;transform:rotate(-2deg);background:${zineInk.noteBg};color:${zineInk.noteInk};padding:18px 20px 16px;box-shadow:0 12px 24px rgba(40,10,30,.2);display:flex;flex-direction:column;gap:10px}
.tape{position:absolute;top:-9px;left:50%;width:70px;height:18px;transform:translateX(-50%) rotate(3deg);background:rgba(255,255,255,.45)}
.note-text{font-family:${HAND};font-size:25px;line-height:1.1}
.note-sign{display:flex;align-items:center;justify-content:flex-end;gap:6px;font-family:${HAND};font-size:19px}
.cloth{background:${yearBookInk.cloth};color:${yearBookInk.light}}
.cloth .head{opacity:1;color:${yearBookInk.soft}}
.spine{position:absolute;left:0;top:0;bottom:0;width:22px;background:linear-gradient(90deg, rgba(0,0,0,.4), rgba(255,255,255,.05))}
.cover-in{position:absolute;inset:58px 32px 52px 52px;display:flex;flex-direction:column;justify-content:space-between}
.cover-kicker,.cover-foot{font-family:${MONO};font-size:11px;letter-spacing:.16em;color:${yearBookInk.soft}}
.cover-year{font-family:${display};font-weight:500;font-size:132px;line-height:.9;letter-spacing:-.03em;color:${yearBookInk.gold}}
.cover-title{padding-top:18px;font-size:30px;font-weight:650;letter-spacing:-.01em}
.cover-sub{padding-top:6px;font-size:17px;line-height:1.35;color:${yearBookInk.soft};text-wrap:pretty;max-width:280px}
.cloth .zine-title{color:${yearBookInk.gold}}
.cloth .stamp{border-color:${yearBookInk.gold};color:${yearBookInk.gold};mix-blend-mode:normal}
.cloth .zine{padding-left:32px;gap:24px}
.cloth .head{padding-left:32px}
.contents{display:flex;flex-direction:column;gap:5px}
.contents .label{color:${yearBookInk.soft};opacity:1}
.line{position:relative;display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding-top:5px;line-height:1.2}
.line::before{content:'';position:absolute;left:0;right:0;top:0;height:1px;background:${yearBookInk.soft};opacity:.3}
.line-name{font-size:14px;font-weight:650}
.line-sub{font-weight:500;color:${yearBookInk.soft}}
.line-amount{font-family:${display};font-weight:500;font-size:16px;color:${yearBookInk.gold}}
`;
}

/** Everything the book prints, worded and formatted. */
export interface YearBookDoc {
  readonly language: string;
  /** The CSS font stack for display type: the look's face. */
  readonly display: string;
  /** `@font-face` rules with the fonts embedded. */
  readonly fonts: string;
  /** The companion for 6pm's notes, a base64 PNG; null in serious mode. */
  readonly companion: string | null;
  readonly cover: {
    readonly kicker: string;
    readonly year: string;
    readonly title: string;
    readonly sub: string;
    readonly closed: string;
  };
  readonly summary: {
    readonly kicker: string;
    readonly headline: string;
    readonly closed: string;
    readonly stats: readonly ZineStat[];
    readonly contents: string;
    readonly lines: readonly {
      readonly key: string;
      readonly name: string;
      readonly sub: string;
      readonly amount: string;
    }[];
  };
  readonly months: readonly { readonly kicker: string; readonly zine: ZineView }[];
  readonly labels: MonthLabels;
}

function cover(doc: YearBookDoc): string {
  const c = doc.cover;
  return `<section class="page cloth"><div class="spine"></div><div class="cover-in">
  <div class="cover-kicker">${esc(c.kicker)}</div>
  <div>
    <div class="cover-year">${esc(c.year)}</div>
    <div class="cover-title">${esc(c.title)}</div>
    <div class="cover-sub">${esc(c.sub)}</div>
  </div>
  <div class="cover-foot">${esc(c.closed)}</div>
</div></section>`;
}

function summary(doc: YearBookDoc): string {
  const s = doc.summary;
  const lines = s.lines
    .map(
      (l) =>
        `<div class="line"><span class="line-name">${esc(l.name)} <span class="line-sub">· ${esc(l.sub)}</span></span><span class="line-amount">${esc(l.amount)}</span></div>`,
    )
    .join('');
  return `<section class="page cloth"><div class="spine"></div>${pageHead(s.kicker, '')}
<div class="zine">
${titleBlock(doc.cover.year, s.headline, s.closed, doc.labels.stamp)}
${statGrid(s.stats)}
<div class="contents"><div class="label">${esc(s.contents)}</div>${lines}</div>
</div></section>`;
}

/**
 * The year book as one HTML document for the print renderer: the cloth cover, the year at a glance
 * with its contents, then two pages for every month's money diary.
 */
export function yearBookHtml(doc: YearBookDoc): string {
  const months = doc.months
    .map((m) =>
      monthPages({
        zine: m.zine,
        kicker: m.kicker,
        year: doc.cover.year,
        labels: doc.labels,
        companion: doc.companion,
      }),
    )
    .join('\n');
  return `<!doctype html><html lang="${esc(doc.language)}"><head><meta charset="utf-8">
<meta name="viewport" content="width=${PAGE.width}">
<style>${doc.fonts}\n${css(doc.display)}</style></head>
<body>${cover(doc)}\n${summary(doc)}\n${months}</body></html>`;
}

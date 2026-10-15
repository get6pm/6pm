/**
 * The atmosphere's boxes (`atm.back`, `atm.front`): absolutely placed divs the prototype styles
 * with a background, radius, border, shadows, mask, blur, blend, a transform and a CSS animation,
 * some of them moved by the phone's motion (`--tx`, `--ty`, `--pend`, `--exp`). This reads one into
 * numbers for a screen of a known size; drawing is `box-layer.tsx`.
 */

import {
  parseBlur,
  parseBoxShadows,
  parseColor,
  splitTopLevel,
  type BoxShadow,
  type Rgba,
} from '../../css-values';
import { parseBackground, parseLen, resolveLen, type BgLayer, type Gradient } from './box-css';

/** Corner radii, x then y, clockwise from the top left. */
export type Radii = readonly [
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
  readonly [number, number],
];

/** The CSS animations the boxes use, by their keyframes in the prototype. */
export type BoxAnimation =
  | { readonly kind: 'spin'; readonly periodMs: number; readonly delayMs: number }
  | {
      readonly kind: 'breathe';
      readonly periodMs: number;
      readonly delayMs: number;
      /** `steps(n)`; 0 is eased. */
      readonly steps: number;
    }
  | { readonly kind: 'flick'; readonly periodMs: number }
  | { readonly kind: 'floaty'; readonly periodMs: number; readonly delayMs: number };

/** How the phone's motion moves a box: points per unit of `--tx`/`--ty`, degrees per `--pend`. */
export interface Sense {
  readonly tx: number;
  readonly ty: number;
  readonly pendDeg: number;
}

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly radii: Radii;
  /** Bottom layer first. */
  readonly fills: readonly BgLayer[];
  readonly border: { readonly width: number; readonly color: Rgba } | null;
  /** Topmost first, as CSS lists them. */
  readonly shadows: readonly BoxShadow[];
  readonly mask: Gradient | null;
  readonly opacity: number;
  /** `transform: rotate()` in degrees, about `origin`. */
  readonly rotateDeg: number;
  /** The transform origin, in points from the box's top-left corner. */
  readonly origin: readonly [number, number];
  readonly sense: Sense;
  /** `filter: blur()` as a deviation, in points. */
  readonly blur: number;
  readonly blend: 'srcOver' | 'screen' | 'multiply' | 'overlay';
  readonly animation: BoxAnimation | null;
}

type Raw = Readonly<Record<string, unknown>>;

const str = (raw: Raw, key: string, fallback = 'none'): string => {
  const v = raw[key];
  return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback;
};

const len = (text: string, ref: number): number => {
  const l = parseLen(text);
  return l ? resolveLen(l, ref) : 0;
};

/** `50%`, `3px 3px 0 0`, `46% 46% 40% 40% / 58% 58% 30% 30%` over a w×h box. */
export function parseRadii(css: string, w: number, h: number): Radii {
  const [xs = '0', ys] = css.split('/');
  const expand = (list: string): [string, string, string, string] => {
    const p = list.trim().split(/\s+/);
    const a = p[0] ?? '0';
    const b = p[1] ?? a;
    const c = p[2] ?? a;
    const d = p[3] ?? b;
    return [a, b, c, d];
  };
  const rx = expand(xs).map((v) => len(v, w));
  const ry = expand(ys ?? xs).map((v) => len(v, h));
  // CSS scales every radius down together when two on one side would overlap.
  const f = Math.min(
    1,
    w / ((rx[0] ?? 0) + (rx[1] ?? 0) || 1),
    w / ((rx[3] ?? 0) + (rx[2] ?? 0) || 1),
    h / ((ry[0] ?? 0) + (ry[3] ?? 0) || 1),
    h / ((ry[1] ?? 0) + (ry[2] ?? 0) || 1),
  );
  const corner = (i: number): [number, number] => [(rx[i] ?? 0) * f, (ry[i] ?? 0) * f];
  return [corner(0), corner(1), corner(2), corner(3)];
}

/** `calc(var(--tx, 0) * -7px) calc(var(--ty, 0) * -5px)` → the points per unit of motion. */
function senseOf(translate: string, rotate: string): Sense {
  const coef = (text: string, name: string) => {
    const m = new RegExp(`var\\(--${name},\\s*0\\)\\s*\\*\\s*(-?[\\d.]+)`).exec(text);
    return m?.[1] ? Number(m[1]) : 0;
  };
  const [x = '', y = ''] = splitTopLevel(translate, ' ');
  return { tx: coef(x, 'tx'), ty: coef(y, 'ty'), pendDeg: coef(rotate, 'pend') };
}

const seconds = (s: string | undefined): number => {
  const m = /^(-?[\d.]+)s$/.exec(s ?? '');
  return m?.[1] ? Number(m[1]) * 1000 : 0;
};

/** `breathe 3.2s ease-in-out -1.4s infinite alternate`, `spin 2400s linear infinite`, … */
export function parseAnimation(css: string): BoxAnimation | null {
  const parts = css.trim().split(/\s+/);
  const [name] = parts;
  const times = parts.filter((p) => /^-?[\d.]+s$/.test(p));
  const periodMs = seconds(times[0]);
  const delayMs = seconds(times[1]);
  if (!(periodMs > 0)) return null;
  switch (name ?? '') {
    case 'spin':
      return { kind: 'spin', periodMs, delayMs };
    case 'breathe': {
      const steps = /steps\((\d+)\)/.exec(css)?.[1];
      return { kind: 'breathe', periodMs, delayMs, steps: steps ? Number(steps) : 0 };
    }
    case 'flick':
      return { kind: 'flick', periodMs };
    case 'floaty':
      return { kind: 'floaty', periodMs, delayMs };
    default:
      return null;
  }
}

const BLENDS = ['screen', 'multiply', 'overlay'] as const;

/** `rotate(12deg)` → 12. */
const rotation = (tf: string): number => {
  const m = /rotate\((-?[\d.]+)deg\)/.exec(tf);
  return m?.[1] ? Number(m[1]) : 0;
};

/** One box of `atm.back` / `atm.front` on a screen `width` points wide (its containing block). */
export function parseBox(raw: Raw, width: number, height: number): Box {
  const x = len(str(raw, 'l', '0px'), width);
  const y = len(str(raw, 't', '0px'), height);
  const w = len(str(raw, 'w', '0px'), width);
  const h = len(str(raw, 'h', '0px'), height);
  const bd = /^([\d.]+)px solid (.+)$/.exec(str(raw, 'bd'));
  const borderColor = bd?.[2] ? parseColor(bd[2]) : null;
  const [ox = '50%', oy = '50%'] = str(raw, 'to', '50% 50%').split(/\s+/);
  const blend = str(raw, 'bl', 'normal');
  const op = raw.op;
  const mask = str(raw, 'mk');
  return {
    x,
    y,
    w,
    h,
    radii: parseRadii(str(raw, 'r', '0'), w, h),
    fills: parseBackground(str(raw, 'bg', 'transparent')),
    border: bd?.[1] && borderColor ? { width: Number(bd[1]), color: borderColor } : null,
    shadows: parseBoxShadows(str(raw, 'sh')),
    mask: mask === 'none' ? null : (parseBackground(mask)[0]?.image ?? null),
    opacity: typeof op === 'number' ? op : Number(op ?? 1) || 0,
    rotateDeg: rotation(str(raw, 'tf')),
    origin: [len(ox, w), len(oy, h)],
    sense: senseOf(str(raw, 'tr'), str(raw, 'rot')),
    blur: parseBlur(str(raw, 'fl')),
    blend: (BLENDS as readonly string[]).includes(blend) ? (blend as Box['blend']) : 'srcOver',
    animation: parseAnimation(str(raw, 'an')),
  };
}

/** A list of raw boxes, skipping any that cannot show (no size, nothing to draw, invisible). */
export function parseBoxes(raw: unknown, width: number, height: number): Box[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r: unknown) => parseBox((r ?? {}) as Raw, width, height))
    .filter(
      (b) =>
        b.w > 0 &&
        b.h > 0 &&
        (b.opacity > 0 || b.animation?.kind === 'breathe' || b.animation?.kind === 'flick') &&
        (b.fills.length > 0 || b.border !== null || b.shadows.length > 0),
    );
}

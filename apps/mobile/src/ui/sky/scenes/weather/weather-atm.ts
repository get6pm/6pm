import { parseColor, type Rgba } from '../../css-values';

/** The prototype tints rain by writing a colour into an SVG tile: this reads the tile back. */
export interface RainTile {
  readonly width: number;
  readonly height: number;
  readonly color: Rgba;
  /** Vertical strokes inside the tile: (x, y) to (x, y + length), each its own weight and ink. */
  readonly strokes: readonly RainStroke[];
}

export interface RainStroke {
  readonly x: number;
  readonly y: number;
  readonly length: number;
  readonly width: number;
  readonly opacity: number;
}

const attr = (svg: string, name: string): string | null =>
  new RegExp(`${name}=['"]([^'"]+)['"]`).exec(svg)?.[1] ?? null;

/**
 * Reads `atm.rainTile` into numbers: one path of strokes under the group's width
 * (`<g stroke=… stroke-width=…><path d='M10 4v26M38 52v18…'/>`), or one path per stroke with its
 * own `stroke-width` and `stroke-opacity`. Only the forms the prototype emits (absolute `M` moves
 * and relative `v` lines) are understood; anything else reads as `null` so the layer draws nothing
 * rather than something wrong.
 */
export function parseRainTile(value: unknown): RainTile | null {
  if (typeof value !== 'string') return null;
  let svg: string;
  try {
    svg = decodeURIComponent(value);
  } catch {
    return null;
  }
  const width = Number(attr(svg, 'width'));
  const height = Number(attr(svg, 'height'));
  const groupWidth = Number(attr(svg, 'stroke-width') ?? 1);
  const color = parseColor(attr(svg, 'stroke') ?? '');
  if (!color || !(width > 0) || !(height > 0)) return null;
  const strokes: RainStroke[] = [];
  for (const path of svg.matchAll(/<path ([^>]*)\/>/g)) {
    const tag = path[1] ?? '';
    const d = attr(tag, 'd') ?? '';
    const strokeWidth = Number(attr(tag, 'stroke-width') ?? groupWidth);
    const opacity = Number(attr(tag, 'stroke-opacity') ?? 1);
    for (const m of d.matchAll(/M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*v\s*(-?[\d.]+)/g)) {
      const [, x, y, length] = m;
      strokes.push({
        x: Number(x),
        y: Number(y),
        length: Number(length),
        width: strokeWidth,
        opacity,
      });
    }
  }
  return strokes.length > 0 && strokes.every((s) => s.width > 0)
    ? { width, height, color, strokes }
    : null;
}

/** One raindrop on the glass, in the prototype's own units. */
export interface GlassDrop {
  /** Left edge as a fraction of the screen width. */
  readonly x: number;
  /** Top edge in points. */
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly periodMs: number;
  /** Animation delay (negative: the drop starts part-way down). */
  readonly delayMs: number;
}

const length = (v: unknown, unit: string): number | null => {
  if (typeof v !== 'string' || !v.endsWith(unit)) return null;
  const n = Number(v.slice(0, -unit.length));
  return Number.isFinite(n) ? n : null;
};

/** Reads `atm.drops` (`{ l: '12.3%', t: '123px', w: '8.1px', h: '9.7px', d: '12.3s', delay: '-4.5s' }`). */
export function parseDrops(value: unknown): GlassDrop[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw: unknown) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const x = length(r.l, '%');
    const y = length(r.t, 'px');
    const width = length(r.w, 'px');
    const height = length(r.h, 'px');
    const period = length(r.d, 's');
    const delay = length(r.delay, 's');
    if (x === null || y === null || width === null || height === null) return [];
    if (period === null || period <= 0 || delay === null) return [];
    return [{ x: x / 100, y, width, height, periodMs: period * 1000, delayMs: delay * 1000 }];
  });
}

export const asNumber = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0;

/** `atm.fog` (`rgba(150,180,190,.45)`) as a colour, or `null` if it is not one. */
export function parseFog(value: unknown): Rgba | null {
  return typeof value === 'string' ? parseColor(value) : null;
}

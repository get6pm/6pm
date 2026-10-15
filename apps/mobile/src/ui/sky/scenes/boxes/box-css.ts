/**
 * Reads the CSS backgrounds and masks the atmosphere's boxes carry (`atm.back`, `atm.front`, a
 * look's sun) into gradient descriptions the box layer draws with Skia. Lengths stay as written
 * (px or %) until the box's size is known. Only the forms the looks emit are understood.
 */

import { parseColor, splitTopLevel, type Rgba } from '../../css-values';

/** A CSS length: `12px`, `40%`, or a bare `0`. */
export interface Len {
  readonly v: number;
  readonly unit: 'px' | '%';
}

/** A position along a gradient: a length, or (conic) degrees as `k × --exp + c`. */
export type StopAt =
  | { readonly kind: 'len'; readonly len: Len }
  | { readonly kind: 'deg'; readonly k: number; readonly c: number };

export interface Stop {
  readonly color: Rgba;
  readonly at: StopAt | null;
}

export type Gradient =
  | {
      readonly kind: 'linear';
      readonly angleDeg: number;
      readonly repeating: boolean;
      readonly stops: readonly Stop[];
    }
  | {
      readonly kind: 'radial';
      /** `circle` (farthest corner), `closest-side`, an ellipse of lengths, or the default ellipse. */
      readonly size:
        | { readonly kind: 'circle' }
        | { readonly kind: 'closest-side' }
        | { readonly kind: 'ellipse' }
        | { readonly kind: 'lengths'; readonly rx: Len; readonly ry: Len };
      readonly at: readonly [Len, Len];
      readonly stops: readonly Stop[];
    }
  | {
      readonly kind: 'conic';
      readonly fromDeg: number;
      readonly at: readonly [Len, Len];
      readonly stops: readonly Stop[];
    }
  | { readonly kind: 'color'; readonly color: Rgba }
  | { readonly kind: 'noise'; readonly noise: Noise };

/** An SVG `feTurbulence` texture through an `feColorMatrix` (Monsoon's speck, Bát Tràng's brush). */
export interface Noise {
  readonly tile: readonly [number, number];
  readonly fractal: boolean;
  readonly freq: readonly [number, number];
  readonly octaves: number;
  readonly seed: number;
  /** The colour matrix, 20 numbers, row-major (r, g, b, a rows). */
  readonly matrix: readonly number[];
}

/** One background layer: its image, where it sits and how it repeats. */
export interface BgLayer {
  readonly image: Gradient;
  readonly pos: readonly [Len, Len];
  /** `null` is the box's size. */
  readonly size: readonly [Len, Len] | null;
  readonly repeat: 'repeat' | 'repeat-x' | 'no-repeat';
}

const ZERO: Len = { v: 0, unit: 'px' };
const HALF: Len = { v: 50, unit: '%' };

export function parseLen(token: string): Len | null {
  const t = token.trim();
  if (t === '0') return ZERO;
  const m = /^(-?[\d.]+)(px|%)$/.exec(t);
  return m?.[1] && m[2] ? { v: Number(m[1]), unit: m[2] as Len['unit'] } : null;
}

/** A length against a reference (the box's width for x, height for y). */
export function resolveLen(len: Len, ref: number): number {
  return len.unit === '%' ? (len.v / 100) * ref : len.v;
}

const KEYWORD_AT: Readonly<Record<string, Len>> = {
  left: ZERO,
  top: ZERO,
  center: HALF,
  right: { v: 100, unit: '%' },
  bottom: { v: 100, unit: '%' },
};

function parseAt(text: string | undefined): readonly [Len, Len] {
  if (!text) return [HALF, HALF];
  const [x = 'center', y = 'center'] = text.trim().split(/\s+/);
  return [parseLen(x) ?? KEYWORD_AT[x] ?? HALF, parseLen(y) ?? KEYWORD_AT[y] ?? HALF];
}

/** `calc(var(--exp, 1) * 18.3deg + 0.4deg)` → 18.3 × exp + 0.4; `40deg` → 40. */
function parseDeg(token: string): StopAt | null {
  const plain = /^(-?[\d.]+)deg$/.exec(token);
  if (plain?.[1]) return { kind: 'deg', k: 0, c: Number(plain[1]) };
  const calc = /^calc\(var\(--exp,\s*1\)\s*\*\s*(-?[\d.]+)deg(?:\s*\+\s*(-?[\d.]+)deg)?\)$/.exec(
    token,
  );
  if (calc?.[1]) return { kind: 'deg', k: Number(calc[1]), c: Number(calc[2] ?? 0) };
  return null;
}

function parseStopAt(token: string): StopAt | null {
  const len = parseLen(token);
  return len ? { kind: 'len', len } : parseDeg(token);
}

/** `#fff 0 34%` → two stops; `#fff 40%` → one; `#fff` → one at an implicit place. */
function parseStops(tokens: readonly string[]): Stop[] | null {
  const out: Stop[] = [];
  for (const token of tokens) {
    const [colorText = '', ...rest] = splitTopLevel(token, ' ');
    const color = parseColor(colorText);
    if (!color) return null;
    if (rest.length === 0) out.push({ color, at: null });
    for (const r of rest) {
      const at = parseStopAt(r);
      if (!at) return null;
      out.push({ color, at });
    }
  }
  return out.length >= 2 ? out : null;
}

function parseRadialHead(
  head: string,
): Pick<Extract<Gradient, { kind: 'radial' }>, 'size' | 'at'> | null {
  const [shape = '', position] = head.split(/\s*\bat\b\s*/);
  const at = parseAt(position);
  const s = shape.trim();
  if (s === '' || s === 'ellipse') return { size: { kind: 'ellipse' }, at };
  if (s === 'circle' || s === 'circle farthest-corner') return { size: { kind: 'circle' }, at };
  if (s === 'closest-side') return { size: { kind: 'closest-side' }, at };
  const [rx, ry] = s.split(/\s+/).map(parseLen);
  return rx && ry ? { size: { kind: 'lengths', rx, ry }, at } : null;
}

const attr = (svg: string, name: string): string | null =>
  new RegExp(`${name}=['"]([^'"]+)['"]`).exec(svg)?.[1] ?? null;

function parseNoise(url: string): Noise | null {
  let svg: string;
  try {
    svg = decodeURIComponent(url);
  } catch {
    return null;
  }
  if (!svg.includes('feTurbulence')) return null;
  const freq = (attr(svg, 'baseFrequency') ?? '').split(/\s+/).map(Number);
  const matrix = (attr(svg, 'values') ?? '').split(/\s+/).map(Number);
  const w = Number(attr(svg, 'width'));
  const h = Number(attr(svg, 'height'));
  if (matrix.length !== 20 || !(freq[0] && w && h)) return null;
  return {
    tile: [w, h],
    fractal: attr(svg, 'type') === 'fractalNoise',
    freq: [freq[0], freq[1] ?? freq[0]],
    octaves: Number(attr(svg, 'numOctaves') ?? 1),
    seed: Number(attr(svg, 'seed') ?? 0),
    matrix,
  };
}

/** One CSS image (a gradient, a colour or an SVG noise `url()`), or null when not understood. */
export function parseImage(token: string): Gradient | null {
  const t = token.trim();
  const url = /^url\("data:image\/svg\+xml,(.*)"\)$/s.exec(t);
  if (url?.[1]) {
    const noise = parseNoise(url[1]);
    return noise ? { kind: 'noise', noise } : null;
  }
  const fn = /^(repeating-)?(linear|radial|conic)-gradient\((.*)\)$/s.exec(t);
  if (!fn) {
    const color = parseColor(t);
    return color ? { kind: 'color', color } : null;
  }
  const repeating = fn[1] !== undefined;
  const args = splitTopLevel(fn[3] ?? '');
  const [head = '', ...rest] = args;
  const headIsStop = parseStops([head, head]) !== null;
  if (fn[2] === 'linear') {
    const angle = /^(-?[\d.]+)deg$/.exec(head);
    const stops = parseStops(angle ? rest : args);
    return stops
      ? { kind: 'linear', angleDeg: angle ? Number(angle[1]) : 180, repeating, stops }
      : null;
  }
  if (repeating) return null;
  if (fn[2] === 'radial') {
    const geometry = headIsStop
      ? { size: { kind: 'ellipse' as const }, at: parseAt(undefined) }
      : parseRadialHead(head);
    const stops = parseStops(headIsStop ? args : rest);
    return geometry && stops ? { kind: 'radial', ...geometry, stops } : null;
  }
  const conic = /^from\s+(-?[\d.]+)deg(?:\s+at\s+(.*))?$/.exec(head);
  const stops = parseStops(conic ? rest : args);
  return stops
    ? { kind: 'conic', fromDeg: conic ? Number(conic[1]) : 0, at: parseAt(conic?.[2]), stops }
    : null;
}

/**
 * A CSS `background` list, bottom layer first (CSS lists the top one first). Each layer is an
 * image with an optional `<x> <y> [/ <w> <h>]` and repeat; `none` is empty.
 */
export function parseBackground(css: string): BgLayer[] {
  const text = css.trim();
  if (text === '' || text === 'none' || text === 'transparent') return [];
  return splitTopLevel(text)
    .flatMap((layer): BgLayer[] => {
      const parts = splitTopLevel(layer, ' ');
      const image = parts[0] ? parseImage(parts[0]) : null;
      if (!image) return [];
      const rest = parts.slice(1);
      const repeat =
        rest.find((p): p is 'repeat-x' | 'no-repeat' => p === 'repeat-x' || p === 'no-repeat') ??
        'repeat';
      const lengths = rest.filter((p) => p !== repeat && p !== '/');
      const slash = rest.indexOf('/');
      const pos: [Len, Len] = [
        parseLen(lengths[0] ?? '0') ?? ZERO,
        parseLen(lengths[1] ?? '0') ?? ZERO,
      ];
      const size =
        slash >= 0
          ? ([
              parseLen(rest[slash + 1] ?? '') ?? HALF,
              parseLen(rest[slash + 2] ?? '') ?? HALF,
            ] as const)
          : null;
      return [{ image, pos, size, repeat }];
    })
    .reverse();
}

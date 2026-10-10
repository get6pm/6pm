/**
 * Reads the CSS values the look engine produces (colours, gradients, box shadows) into numbers the
 * sky draws with, so every colour on the sky is the one the prototype computes, never a copy.
 * Only the forms the looks actually emit are understood; anything else reads as `null`/empty.
 */

/** Straight (unpremultiplied) RGBA, each channel 0–1. */
export type Rgba = readonly [number, number, number, number];

export const CLEAR: Rgba = [0, 0, 0, 0];

export function parseColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return CLEAR;
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (!/^[0-9a-f]+$/.test(hex)) return null;
    const full = hex.length === 3 || hex.length === 4 ? [...hex].map((c) => c + c).join('') : hex;
    if (full.length !== 6 && full.length !== 8) return null;
    const n = (i: number) => parseInt(full.slice(i, i + 2), 16) / 255;
    return [n(0), n(2), n(4), full.length === 8 ? n(6) : 1];
  }
  const fn = /^rgba?\(([^)]*)\)$/.exec(s);
  if (!fn?.[1]) return null;
  const parts = fn[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  const [r, g, b, a = 1] = parts;
  if (r === undefined || g === undefined || b === undefined) return null;
  if (parts.some((v) => Number.isNaN(v))) return null;
  return [r / 255, g / 255, b / 255, a];
}

/** Splits on `sep` outside parentheses: `a(b, c), d` → [`a(b, c)`, `d`]. */
export function splitTopLevel(input: string, sep = ','): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === sep && depth === 0) {
      out.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(input.slice(start).trim());
  return out.filter((part) => part.length > 0);
}

export interface ColorStop {
  readonly color: Rgba;
  /** Position along the gradient as a fraction, or null when the stop leaves it implicit. */
  readonly at: number | null;
}

export interface LinearGradientValue {
  readonly kind: 'linear';
  readonly angleDeg: number;
  readonly stops: readonly ColorStop[];
}

export interface RadialGradientValue {
  readonly kind: 'radial';
  /** `farthest-corner` circle, or an ellipse with radii as fractions of the box (`60% 38%`). */
  readonly size: 'circle' | { readonly rx: number; readonly ry: number };
  /** Centre as fractions of the box. */
  readonly at: readonly [number, number];
  readonly stops: readonly ColorStop[];
}

export type GradientValue = LinearGradientValue | RadialGradientValue;

const percent = (token: string): number | null =>
  /^-?[\d.]+%$/.test(token) ? Number(token.slice(0, -1)) / 100 : null;

function parseStop(token: string): ColorStop | null {
  const parts = splitTopLevel(token, ' ');
  const color = parts[0] ? parseColor(parts[0]) : null;
  if (!color) return null;
  if (parts.length === 1) return { color, at: null };
  const at = parts[1] ? percent(parts[1]) : null;
  return at === null ? null : { color, at };
}

function parseStops(tokens: readonly string[]): ColorStop[] | null {
  const stops = tokens.map(parseStop);
  return stops.every((s): s is ColorStop => s !== null) && stops.length >= 2 ? stops : null;
}

function parseRadialHead(head: string): Omit<RadialGradientValue, 'kind' | 'stops'> | null {
  const [shape = '', position] = head.split(/\s+at\s+/);
  let at: readonly [number, number] = [0.5, 0.5];
  if (position !== undefined) {
    const [x, y] = position.trim().split(/\s+/).map(percent);
    if (x == null || y == null) return null;
    at = [x, y];
  }
  if (shape.trim() === 'circle') return { size: 'circle', at };
  const [rx, ry] = shape.trim().split(/\s+/).map(percent);
  return rx == null || ry == null ? null : { size: { rx, ry }, at };
}

function parseGradient(token: string): GradientValue | null {
  const fn = /^(linear|radial)-gradient\((.*)\)$/s.exec(token.trim());
  if (!fn?.[1] || fn[2] === undefined) return null;
  const [head = '', ...rest] = splitTopLevel(fn[2]);
  if (fn[1] === 'linear') {
    const angle = /^(-?[\d.]+)deg$/.exec(head);
    const stops = parseStops(angle ? rest : [head, ...rest]);
    return stops ? { kind: 'linear', angleDeg: angle ? Number(angle[1]) : 180, stops } : null;
  }
  const startsWithColor = parseStop(head) !== null;
  const geometry = startsWithColor ? { size: 'circle' as const, at: [0.5, 0.5] as const } : null;
  const parsedHead = geometry ?? parseRadialHead(head);
  const stops = parseStops(startsWithColor ? [head, ...rest] : rest);
  return parsedHead && stops ? { kind: 'radial', ...parsedHead, stops } : null;
}

/** A CSS `background` made of gradients, in paint order (bottom first). `none` is empty. */
export function parseGradients(input: string): GradientValue[] {
  if (input.trim() === 'none') return [];
  const layers = splitTopLevel(input).map(parseGradient);
  // CSS lists the top layer first; drawing wants the bottom first.
  return layers.filter((g): g is GradientValue => g !== null).reverse();
}

export interface ResolvedStops {
  readonly colors: readonly Rgba[];
  readonly positions: readonly number[];
}

/**
 * Fills in implicit positions as CSS does and makes the stops interpolate the way CSS does: CSS
 * blends in premultiplied space, so a fully transparent stop takes the colour of its neighbours
 * (one stop per side when they differ) instead of fading through black.
 */
export function resolveStops(stops: readonly ColorStop[]): ResolvedStops {
  const at = stops.map((s) => s.at);
  if (at[0] === null) at[0] = 0;
  if (at[at.length - 1] === null) at[at.length - 1] = 1;
  for (let i = 1; i < at.length; i++) {
    if (at[i] !== null) continue;
    let j = i;
    while (at[j] === null) j++;
    const from = at[i - 1] ?? 0;
    const to = at[j] ?? 1;
    for (let k = i; k < j; k++) at[k] = from + ((to - from) * (k - i + 1)) / (j - i + 1);
  }
  let floor = 0;
  const positions = at.map((p) => (floor = Math.max(floor, p ?? 0)));
  const colors: Rgba[] = [];
  const out: number[] = [];
  stops.forEach((stop, i) => {
    const pos = positions[i] ?? 0;
    if (stop.color[3] > 0) {
      colors.push(stop.color);
      out.push(pos);
      return;
    }
    const prev = stops
      .slice(0, i)
      .reverse()
      .find((s) => s.color[3] > 0)?.color;
    const next = stops.slice(i + 1).find((s) => s.color[3] > 0)?.color;
    const left = prev ?? next ?? CLEAR;
    const right = next ?? prev ?? CLEAR;
    colors.push([left[0], left[1], left[2], 0]);
    out.push(pos);
    if (left.some((v, k) => k < 3 && v !== right[k])) {
      colors.push([right[0], right[1], right[2], 0]);
      out.push(pos);
    }
  });
  return { colors, positions: out };
}

export interface BoxShadow {
  readonly x: number;
  readonly y: number;
  readonly blur: number;
  readonly spread: number;
  readonly color: Rgba;
  readonly inset: boolean;
}

/** A CSS `box-shadow` list, first (topmost) shadow first. `none` is empty. */
export function parseBoxShadows(input: string): BoxShadow[] {
  if (input.trim() === 'none') return [];
  return splitTopLevel(input).flatMap((token) => {
    const parts = splitTopLevel(token, ' ');
    const inset = parts.includes('inset');
    const lengths = parts.filter((p) => /^-?[\d.]+(px)?$/.test(p)).map((p) => parseFloat(p));
    const color = parts.map(parseColor).find((c) => c !== null);
    const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
    return color ? [{ x, y, blur, spread, color, inset }] : [];
  });
}

/** `blur(40px)` → 40; anything else → 0. */
export function parseBlur(input: string): number {
  const m = /blur\(([\d.]+)px\)/.exec(input);
  return m?.[1] ? Number(m[1]) : 0;
}

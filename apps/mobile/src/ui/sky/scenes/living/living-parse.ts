import { CLEAR, parseColor, splitTopLevel, type Rgba } from '../../css-values';

/** The prototype's `atm()` object for one hour, as `SceneProps` carries it. */
export type Atm = Readonly<Record<string, unknown>>;
export type Row = Readonly<Record<string, unknown>>;

/** Whether the atmosphere switches a layer on. */
export function flag(atm: Atm, key: string): boolean {
  return atm[key] === true;
}

/** A finite number from the atmosphere, 0 when absent. */
export function numberOf(atm: Atm | Row, key: string): number {
  const v = atm[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/** A string from the atmosphere, empty when absent. */
export function textOf(atm: Atm | Row, key: string): string {
  const v = atm[key];
  return typeof v === 'string' ? v : '';
}

/** The rows of a list the atmosphere carries (cars, hills, bulbs…), empty when absent. */
export function rowsOf(atm: Atm | Row, key: string): readonly Row[] {
  const v = atm[key];
  return Array.isArray(v) ? (v as Row[]) : [];
}

function asText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

/**
 * A CSS length as points: `12px` → 12, `40%` → 40% of `basis`, a bare number → itself. The
 * prototype writes positions as either, depending on the layer.
 */
export function lengthOf(value: unknown, basis: number): number {
  const s = asText(value).trim();
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return s.endsWith('%') ? (n / 100) * basis : n;
}

/** A CSS time (`3.4s`, `-1.2s`, `300ms`) in milliseconds. */
export function millisOf(value: unknown): number {
  const s = asText(value).trim();
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return s.endsWith('ms') ? n : n * 1000;
}

/** A CSS colour as four numbers, transparent when it does not parse. */
export function rgbaOf(css: string): readonly number[] {
  return [...(parseColor(css) ?? CLEAR)];
}

/** Every `#hex` colour in a CSS value, in order. */
export function hexColorsIn(css: string): Rgba[] {
  return (css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).flatMap((hex) => {
    const c = parseColor(hex);
    return c ? [c] : [];
  });
}

/** The numbers of a CSS colour list as one flat array, for a tween. */
export function flat(colors: readonly (readonly number[])[]): number[] {
  return colors.flatMap((c) => [...c]);
}

/** A colour stop that may name one or two positions (`c 29% 30.5%`), as fractions. */
export interface RawStop {
  readonly color: Rgba;
  readonly at: readonly number[];
}

/**
 * The colour stops of a CSS gradient, keeping CSS's two-position form (`transparent 0 29%`), which
 * the shared gradient parser does not read. Anything that is not a colour stop (angle, shape,
 * position) is skipped. Positions are fractions of the gradient line.
 */
export function rawStops(gradient: string): RawStop[] {
  const inner = /^[\w-]*gradient\((.*)\)$/s.exec(gradient.trim())?.[1];
  if (inner === undefined) return [];
  return splitTopLevel(inner).flatMap((token) => {
    const [head = '', ...rest] = splitTopLevel(token, ' ');
    const color = parseColor(head);
    if (!color) return [];
    const at = rest.map((p) => (p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p)));
    return [{ color, at }];
  });
}

/** The pieces a look card's signature is drawn from; `./look-signature` ports the prototype's `sig()`. */
import { mixHex, type Palette } from '@6pm/theme';

/** Slanted hairlines the card draws over its sky (CSS repeating gradients have no native twin). */
export interface Hatch {
  /** The CSS gradient angle: the lines run perpendicular to it. */
  readonly angle: number;
  readonly every: number;
  readonly color: string;
}

/** Concentric rings around a point, as a repeating radial gradient draws them. */
export interface Rings {
  /** The centre, in percent of the card. */
  readonly x: number;
  readonly y: number;
  readonly every: number;
  readonly color: string;
}

/** A conic gradient (CSS `conic-gradient`), drawn with a sweep. */
export interface Conic {
  /** CSS angle the sweep starts from, in degrees clockwise from the top. */
  readonly from: number;
  /** The centre in percent of the box. */
  readonly x: number;
  readonly y: number;
  readonly colors: readonly string[];
  /** Each colour's place round the circle (0–1); evenly spaced when unset. */
  readonly positions?: readonly number[];
}

/** The sun of a look card: a gradient or colour, an optional sweep under it, and its glow. */
export interface SigSun {
  readonly image: string | null;
  /** `backgroundSize` and `backgroundPosition` for a tiled image (Sơn Mài's gold-leaf seams). */
  readonly size?: string;
  readonly position?: string;
  readonly color: string | null;
  readonly conic: Conic | null;
  /** A CSS box-shadow. */
  readonly glow: string;
}

/** What a look card draws over its sky to say which look it is: the prototype's `sig()`. */
export interface LookSignature {
  /** Gradients React Native draws, as one `backgroundImage`; empty for none. */
  readonly image: string;
  /** The matching `backgroundSize`, one entry per layer. */
  readonly size: string;
  readonly hatch: Hatch | null;
  readonly rings: Rings | null;
  readonly conic: Conic | null;
  readonly sun: SigSun;
}

/** CSS `color from to` as two stops: React Native's gradients take one position per stop. */
export const band = (color: string, from: string, to: string) => `${color} ${from}, ${color} ${to}`;

export type Variant = Readonly<Record<string, unknown>>;

export const text = (v: Variant, key: string, fallback: string): string => {
  const value = v[key];
  return typeof value === 'string' ? value : fallback;
};

export const texts = (v: Variant, key: string): readonly string[] => {
  const value = v[key];
  return Array.isArray(value) ? value.filter((c): c is string => typeof c === 'string') : [];
};

/** The paper hills' colours at an hour (`paperCols`): dusk warms them, night sinks them. */
export function paperColours(v: Variant, st: Palette['st'], hour: number): string[] {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const night = clamp((hour - 18.85) / 0.35);
  const dusk = clamp((hour - 16) / 2.2) * (1 - night);
  return texts(v, 'L').map((c, i) =>
    mixHex(mixHex(c, st[2], 0.1 + dusk * 0.3 * (1 - i / 5)), '#141a38', night * (0.7 - i * 0.07)),
  );
}

/** Sơn Mài's gold leaf (`leaf()`): a metal disc under faint seams, one square of leaf each. */
export function leafSun(metal: string, seam: number, glow: string): SigSun {
  const d = mixHex(metal, '#3a2408', 0.5);
  const tile = `${seam}px ${seam}px`;
  return plain({
    image: [
      `linear-gradient(90deg, ${band(`${d}1c`, '0px', '1px')}, ${band('transparent', '1px', '100%')})`,
      `linear-gradient(0deg, ${band(`${d}17`, '0px', '1px')}, ${band('transparent', '1px', '100%')})`,
      `radial-gradient(circle at 34% 30%, #fff4d2 0%, ${metal} 38%, ${mixHex(metal, '#2a1806', 0.45)} 100%)`,
    ].join(', '),
    size: `${tile}, ${tile}, auto`,
    position: '0px 0px, 3px 5px, 0px 0px',
    glow,
  });
}

export function plain(sun: Partial<SigSun> & Pick<SigSun, 'glow'>): SigSun {
  return { image: null, color: null, conic: null, ...sun };
}

export const NONE: Omit<LookSignature, 'sun'> = {
  image: '',
  size: 'auto',
  hatch: null,
  rings: null,
  conic: null,
};

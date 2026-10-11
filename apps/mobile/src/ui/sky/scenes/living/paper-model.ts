import { parseColor, type Rgba } from '../../css-values';
import { boxPath, parseBorderRadius } from './box-path';
import {
  flat,
  hexColorsIn,
  lengthOf,
  millisOf,
  rgbaOf,
  rowsOf,
  textOf,
  type Atm,
  type Row,
} from './living-parse';

/** How a hill's face is painted. */
export type PaperFace =
  | { readonly kind: 'plain' }
  /** Concentric ellipses about the bottom centre: `first` pt of colour, then the dark rim. */
  | { readonly kind: 'terrace'; readonly first: number; readonly period: number }
  /** Horizontal lines: `first` pt of colour, then the light line, repeating every `period`. */
  | { readonly kind: 'stripes'; readonly first: number; readonly period: number };

export interface PaperItem {
  readonly l: number;
  readonly t: number;
  readonly w: number;
  readonly h: number;
  /** The item's rounded box, as an SVG path. */
  readonly path: string;
  readonly face: PaperFace;
}

/** One cut-paper layer: its pieces (hills or towers, then the ground) and how it parallaxes. */
export interface PaperLayer {
  readonly items: readonly PaperItem[];
  /** Scroll factor: the layer moves `factor × scrollY`. */
  readonly factor: number;
  /** The drop shadow cast upward onto the layer behind: offset and blur radius in points. */
  readonly shadow: { readonly dy: number; readonly sigma: number };
}

export interface PaperCloud {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly periodMs: number;
}

export interface PaperGeometry {
  readonly layers: readonly PaperLayer[];
  readonly clouds: readonly PaperCloud[];
}

export const LAYER_COUNT = 5;
/** Hour-driven values per layer: colour, second colour, shadow colour (RGBA each). */
const PER_LAYER = 12;

function faceOf(bg: string): PaperFace {
  const terrace =
    /^repeating-radial-gradient\(ellipse at 50% 100%, #\w+ 0 ([\d.]+)px, #\w+ [\d.]+px ([\d.]+)px\)$/.exec(
      bg,
    );
  if (terrace?.[1] && terrace[2]) {
    return { kind: 'terrace', first: Number(terrace[1]), period: Number(terrace[2]) };
  }
  const stripes =
    /^repeating-linear-gradient\(180deg, #\w+ 0 ([\d.]+)px, #\w+ [\d.]+px ([\d.]+)px\)$/.exec(bg);
  if (stripes?.[1] && stripes[2]) {
    return { kind: 'stripes', first: Number(stripes[1]), period: Number(stripes[2]) };
  }
  return { kind: 'plain' };
}

function itemOf(row: Row, width: number): PaperItem {
  const w = lengthOf(row.w, width);
  const h = lengthOf(row.h, 0);
  const l = lengthOf(row.l, width);
  const t = lengthOf(row.t, 0);
  return {
    l,
    t,
    w,
    h,
    path: boxPath(l, t, w, h, parseBorderRadius(textOf(row, 'r') || '0', w, h)),
    face: faceOf(textOf(row, 'bg')),
  };
}

/**
 * `drop-shadow(0 -4px 7px rgba(…))` as an offset, a Gaussian σ and a colour. Unlike `box-shadow`, a
 * filter's `drop-shadow` takes its blur value as the standard deviation itself (compared against
 * Chromium: half would be visibly too tight).
 */
export function parseDropShadow(css: string) {
  const m =
    /drop-shadow\(\s*(-?[\d.]+)(?:px)?\s+(-?[\d.]+)(?:px)?\s+([\d.]+)(?:px)?\s+(.+)\)$/.exec(
      css.trim(),
    );
  if (!m?.[2] || !m[3] || !m[4]) return null;
  const color = parseColor(m[4]);
  return color ? { dy: Number(m[2]), sigma: Number(m[3]), color } : null;
}

/**
 * The static shape of Paper Diorama for a sky `width` wide: five layers of hills, towers or
 * terraces with their ground, and the paper clouds. Nothing here changes with the hour.
 */
export function paperGeometry(atm: Atm, width: number): PaperGeometry | null {
  const hills = rowsOf(atm, 'hills');
  if (hills.length !== LAYER_COUNT) return null;
  const layers = hills.map((hill): PaperLayer => {
    const shadow = parseDropShadow(textOf(hill, 'sh'));
    return {
      items: rowsOf(hill, 'items').map((row) => itemOf(row, width)),
      factor: parseFloat(textOf(hill, 'f')) || 0,
      shadow: { dy: shadow?.dy ?? 0, sigma: shadow?.sigma ?? 0 },
    };
  });
  const clouds = rowsOf(atm, 'clouds').map((c): PaperCloud => ({
    x: lengthOf(c.l, width),
    y: lengthOf(c.t, 0),
    w: lengthOf(c.w, 0),
    h: lengthOf(c.h, 0),
    periodMs: millisOf(c.d),
  }));
  return { layers, clouds };
}

/** A key that changes only when the geometry would: layer pieces and clouds, not colours. */
export function geometryKey(atm: Atm, width: number): string {
  const faces = rowsOf(atm, 'hills').map((h) =>
    rowsOf(h, 'items').map((r) => [r.l, r.t, r.w, r.h, r.r, faceOf(textOf(r, 'bg'))]),
  );
  return JSON.stringify([
    width,
    faces,
    rowsOf(atm, 'clouds'),
    rowsOf(atm, 'hills').map((h) => h.f),
  ]);
}

/** Offsets into `paperColors`. */
export const PAPER_COLOR = { layer: 0, cloud: LAYER_COUNT * PER_LAYER } as const;
export const layerColor = (layer: number) => PAPER_COLOR.layer + layer * PER_LAYER;

/**
 * The hour's colours, flat: per layer its paper, its second tone (dark rim or light line; the
 * paper again when it has none) and its shadow; then the cloud paper.
 */
export function paperColors(atm: Atm): number[] | null {
  const hills = rowsOf(atm, 'hills');
  if (hills.length !== LAYER_COUNT) return null;
  const out: Rgba[] = [];
  for (const hill of hills) {
    const tones = rowsOf(hill, 'items').map((r) => hexColorsIn(textOf(r, 'bg')));
    const paper = tones[0]?.[0] ?? ([0, 0, 0, 1] as Rgba);
    const second = tones.find((t) => t.length > 1)?.[1] ?? paper;
    out.push(paper, second, parseDropShadow(textOf(hill, 'sh'))?.color ?? ([0, 0, 0, 0] as Rgba));
  }
  out.push(rgbaOf(textOf(atm, 'cloud')) as unknown as Rgba);
  return flat(out);
}

export const PAPER_COLORS_LENGTH = (LAYER_COUNT * 3 + 1) * 4;

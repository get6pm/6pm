import type { RainStroke, RainTile } from './weather-atm';

/** The prototype tilts both rain layers by 14° about the screen's centre. */
export const RAIN_TILT_DEG = 14;
/** …and oversizes them (left/right −30%, top/bottom −20%) so the tilt never shows an edge. */
export const RAIN_OVERHANG = { x: 0.3, y: 0.2 } as const;

export interface RainLayerSpec {
  /** `background-size`: the tile's size on screen, in points. */
  readonly tile: readonly [number, number];
  readonly periodMs: number;
  readonly opacity: number;
  /** CSS `filter: blur()`, in points. */
  readonly blur: number;
}

/** The two rain layers: a fast sharp one and a slower, larger, softer one over it. */
export const RAIN_LAYERS: readonly RainLayerSpec[] = [
  { tile: [90, 140], periodMs: 500, opacity: 1, blur: 0 },
  { tile: [150, 230], periodMs: 800, opacity: 0.55, blur: 0.8 },
];

/** `84px 140px` → [84, 140]. */
function sizeOf(css: unknown): [number, number] | null {
  const m = typeof css === 'string' ? /^([\d.]+)px ([\d.]+)px$/.exec(css.trim()) : null;
  return m?.[1] && m[2] ? [Number(m[1]), Number(m[2])] : null;
}

/** The two layers at the sizes the look gives its tile (`rainSize`, `rainSize2`). */
export function rainLayersFor(atm: Readonly<Record<string, unknown>>): RainLayerSpec[] {
  const [sharp, soft] = RAIN_LAYERS as [RainLayerSpec, RainLayerSpec];
  return [
    { ...sharp, tile: sizeOf(atm.rainSize) ?? sharp.tile },
    { ...soft, tile: sizeOf(atm.rainSize2) ?? soft.tile },
  ];
}

/** The tile's strokes grouped by weight and ink, so each group is one path. */
export function strokeGroups(
  tile: RainTile,
): { width: number; opacity: number; strokes: RainStroke[] }[] {
  const groups = new Map<string, { width: number; opacity: number; strokes: RainStroke[] }>();
  for (const s of tile.strokes) {
    const key = `${s.width}|${s.opacity}`;
    const group = groups.get(key) ?? { width: s.width, opacity: s.opacity, strokes: [] };
    group.strokes.push(s);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** The cells (column and row ranges, inclusive) a tilted `width` × `height` screen can show. */
export function rainCells(spec: RainLayerSpec, width: number, height: number) {
  const [tw, th] = spec.tile;
  const a = (RAIN_TILT_DEG * Math.PI) / 180;
  // The screen, tilted back into the layer's own frame, measured from the layer's top-left corner.
  const halfW = (width * Math.cos(a) + height * Math.sin(a)) / 2;
  const halfH = (height * Math.cos(a) + width * Math.sin(a)) / 2;
  const cx = width * (0.5 + RAIN_OVERHANG.x);
  const cy = height * (0.5 + RAIN_OVERHANG.y);
  return {
    c0: Math.floor((cx - halfW) / tw),
    c1: Math.floor((cx + halfW) / tw),
    // One extra row above covers the downward slide of up to one tile.
    r0: Math.floor((cy - halfH) / th) - 1,
    r1: Math.floor((cy + halfH) / th),
  };
}

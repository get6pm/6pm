import type { RainTile } from './weather-atm';

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

/** The visible tile cells (in tile units) as one SVG path of strokes. */
export function rainPath(
  tile: RainTile,
  spec: RainLayerSpec,
  width: number,
  height: number,
): string {
  const { c0, c1, r0, r1 } = rainCells(spec, width, height);
  const parts: string[] = [];
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      for (const s of tile.strokes) {
        parts.push(`M${c * tile.width + s.x} ${r * tile.height + s.y}v${s.length}`);
      }
    }
  }
  return parts.join('');
}

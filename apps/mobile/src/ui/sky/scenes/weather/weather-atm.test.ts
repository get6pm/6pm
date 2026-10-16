import { describe, expect, it } from '@jest/globals';
import { atmosphereFor, paletteFor, type LookConfig } from '@6pm/theme';

import { parseDrops, parseFog, parseRainTile } from './weather-atm';
import {
  RAIN_LAYERS,
  RAIN_OVERHANG,
  RAIN_TILT_DEG,
  rainCells,
  rainLayersFor,
} from './rain-geometry';

const tileUrl = (stroke: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='140'><g stroke='${stroke}' stroke-width='1.1' stroke-linecap='round'><path d='M10 4v26M38 52v18M62 92v30'/></g></svg>`,
  )}")`;

describe('parseRainTile', () => {
  it('reads the size, stroke and vertical strokes the prototype writes', () => {
    const tile = parseRainTile(tileUrl('rgba(255,255,255,.75)'));
    expect(tile).toMatchObject({ width: 90, height: 140 });
    expect(tile?.color).toEqual([1, 1, 1, 0.75]);
    expect(tile?.strokes).toEqual([
      { x: 10, y: 4, length: 26, width: 1.1, opacity: 1 },
      { x: 38, y: 52, length: 18, width: 1.1, opacity: 1 },
      { x: 62, y: 92, length: 30, width: 1.1, opacity: 1 },
    ]);
  });

  it('reads Monsoon’s tile: each stroke its own weight and ink', () => {
    const input = { look: 'monsoon' as const, hour: 16.6, serious: false, config: { rain: true } };
    const atm = atmosphereFor(input, paletteFor(input), 0);
    const tile = parseRainTile(atm.rainTile);
    expect(tile).toMatchObject({ width: 120, height: 200 });
    expect(tile?.strokes).toHaveLength(16);
    expect(new Set(tile?.strokes.map((s) => s.opacity)).size).toBeGreaterThan(1);
    expect(rainLayersFor(atm).map((l) => l.tile)).toEqual([
      [84, 140],
      [138, 230],
    ]);
  });

  it('reads nothing from anything else', () => {
    expect(parseRainTile(undefined)).toBeNull();
    expect(parseRainTile('none')).toBeNull();
    expect(parseRainTile('%E0%A4%A')).toBeNull();
    expect(parseRainTile(tileUrl('not-a-colour'))).toBeNull();
  });
});

describe('parseDrops', () => {
  it('reads the prototype units and drops malformed entries', () => {
    const drops = parseDrops([
      { l: '12.5%', t: '300px', w: '8px', h: '9.6px', d: '10.5s', delay: '-4.5s' },
      { l: '1%', t: '3px', w: '8px', h: '9px', d: '0s', delay: '0s' },
      { l: 'x' },
      null,
    ]);
    expect(drops).toEqual([
      { x: 0.125, y: 300, width: 8, height: 9.6, periodMs: 10_500, delayMs: -4_500 },
    ]);
    expect(parseDrops('nope')).toEqual([]);
  });
});

describe('parseFog', () => {
  it('reads the fog colour', () => {
    expect(parseFog('rgba(244,248,248,.85)')?.[3]).toBeCloseTo(0.85);
    expect(parseFog(3)).toBeNull();
  });
});

describe('rainCells', () => {
  it('cover every point of the tilted screen at every slide offset', () => {
    const angle = (RAIN_TILT_DEG * Math.PI) / 180;
    const [w, h] = [402, 874];
    for (const spec of RAIN_LAYERS) {
      const [tw, th] = spec.tile;
      const { c0, c1, r0, r1 } = rainCells(spec, w, h);
      for (const [sx, sy] of [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
        [w / 2, h / 2],
      ] as const) {
        // Screen point -> layer point: undo the tilt about the centre, measure from the corner.
        const dx = sx - w / 2;
        const dy = sy - h / 2;
        const x = dx * Math.cos(angle) + dy * Math.sin(angle) + w * (0.5 + RAIN_OVERHANG.x);
        const y = -dx * Math.sin(angle) + dy * Math.cos(angle) + h * (0.5 + RAIN_OVERHANG.y);
        for (const slide of [0, th / 2, th - 0.01]) {
          const col = Math.floor(x / tw);
          const row = Math.floor((y - slide) / th);
          expect(col).toBeGreaterThanOrEqual(c0);
          expect(col).toBeLessThanOrEqual(c1);
          expect(row).toBeGreaterThanOrEqual(r0);
          expect(row).toBeLessThanOrEqual(r1);
        }
      }
    }
  });
});

describe('the look engine feeds the layers', () => {
  const at = (look: 'neon' | 'monsoon', hour: number, config: Partial<LookConfig>) => {
    const input = { look, hour, serious: false, config };
    return atmosphereFor(input, paletteFor(input), 0);
  };

  it('Neon Alley has no weather', () => {
    const atm = at('neon', 21.5, { k: 70 });
    expect(atm.rainOn).toBe(false);
    expect(atm.fogOn).toBe(false);
    expect(atm.dropsOn).toBe(false);
    expect(atm.flashOn).toBe(false);
  });

  it('Monsoon has fog, rain, 8 drops at the window’s edges, and thunder from seven', () => {
    const night = at('monsoon', 21.5, { rain: true, thunder: true, k: 70 });
    const day = at('monsoon', 14, { rain: true, thunder: true, k: 70 });
    expect(night.fogOn).toBe(true);
    expect(parseDrops(night.drops)).toHaveLength(8);
    expect(night.flashOn).toBe(true);
    expect(day.flashOn).toBe(false);
    expect(parseFog(day.fog)).not.toBeNull();
  });
});

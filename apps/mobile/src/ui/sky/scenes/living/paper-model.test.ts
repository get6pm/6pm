import { describe, expect, it } from '@jest/globals';

import {
  geometryKey,
  paperColors,
  paperGeometry,
  parseDropShadow,
  LAYER_COUNT,
} from './paper-model';
import { atmFor } from './test-atm';

const WIDTH = 402;

describe('paperGeometry', () => {
  it('builds five layers with the ground last, for every variant', () => {
    for (const v of [0, 1, 2]) {
      const geometry = paperGeometry(atmFor('paper', 18.12, { v }), WIDTH);
      expect(geometry?.layers).toHaveLength(LAYER_COUNT);
      for (const layer of geometry?.layers ?? []) {
        const ground = layer.items.at(-1);
        expect(ground?.w).toBe(WIDTH);
        expect(ground?.h).toBe(1400);
      }
    }
  });

  it('paints terraces as rings, karst ground as lines, and plain hills flat', () => {
    const terrace = paperGeometry(atmFor('paper', 18.12, { v: 0 }), WIDTH);
    expect(terrace?.layers[0]?.items[0]?.face).toEqual({ kind: 'terrace', first: 9, period: 10.5 });
    expect(terrace?.layers[0]?.items.at(-1)?.face.kind).toBe('plain');
    const karst = paperGeometry(atmFor('paper', 18.12, { v: 1 }), WIDTH);
    expect(karst?.layers[4]?.items.at(-1)?.face).toEqual({ kind: 'stripes', first: 7, period: 8 });
    const hills = paperGeometry(atmFor('paper', 18.12, { v: 2 }), WIDTH);
    expect(hills?.layers.every((l) => l.items.every((i) => i.face.kind === 'plain'))).toBe(true);
  });

  it('moves each layer at its own depth, or not at all with parallax off', () => {
    const on = paperGeometry(atmFor('paper', 18.12), WIDTH);
    expect(on?.layers.map((l) => l.factor)).toEqual([-0.04, -0.11, -0.18, -0.25, -0.32]);
    const off = paperGeometry(atmFor('paper', 18.12, { par: false }), WIDTH);
    expect(off?.layers.every((l) => l.factor === 0)).toBe(true);
  });

  it('draws two clouds, none when drifting clouds are off', () => {
    expect(paperGeometry(atmFor('paper', 18.12), WIDTH)?.clouds).toHaveLength(2);
    expect(paperGeometry(atmFor('paper', 18.12, { clouds: false }), WIDTH)?.clouds).toHaveLength(0);
  });

  it('casts each layer’s shadow with the filter’s blur as its σ', () => {
    const layer = paperGeometry(atmFor('paper', 18.12), WIDTH)?.layers[0];
    expect(layer?.shadow).toEqual({ dy: -4, sigma: 7 });
  });

  it('keeps its key across hours and changes it with the variant', () => {
    expect(geometryKey(atmFor('paper', 9), WIDTH)).toBe(geometryKey(atmFor('paper', 20), WIDTH));
    expect(geometryKey(atmFor('paper', 9), WIDTH)).not.toBe(
      geometryKey(atmFor('paper', 9, { v: 1 }), WIDTH),
    );
  });

  it('is nothing for another look', () => {
    expect(paperGeometry(atmFor('golden', 12), WIDTH)).toBeNull();
  });
});

describe('paperColors', () => {
  it('has one fixed length and darkens the paper after dusk', () => {
    const day = paperColors(atmFor('paper', 12));
    const night = paperColors(atmFor('paper', 21));
    expect(day).toHaveLength(64);
    expect(night).toHaveLength(64);
    // First layer's red channel: the night tint pulls the paper down.
    expect(night?.[0] ?? 1).toBeLessThan(day?.[0] ?? 0);
    // The shadow strengthens at night: layer 0's shadow alpha.
    expect(night?.[11] ?? 0).toBeGreaterThan(day?.[11] ?? 1);
  });
});

describe('parseDropShadow', () => {
  it('reads the offset, takes the blur as the σ, and keeps the colour', () => {
    expect(parseDropShadow('drop-shadow(0 -4px 7px rgba(30,20,10,0.35))')).toEqual({
      dy: -4,
      sigma: 7,
      color: [30 / 255, 20 / 255, 10 / 255, 0.35],
    });
    expect(parseDropShadow('none')).toBeNull();
  });
});

import { describe, expect, it } from '@jest/globals';

import { linearGradientLine, radialGradientShape } from './css-geometry';
import { parseBlur, parseBoxShadows, parseColor, parseGradients, resolveStops } from './css-values';

describe('parseColor', () => {
  it('reads hex with and without alpha, rgba() and transparent', () => {
    expect(parseColor('#ff8000')).toEqual([1, 128 / 255, 0, 1]);
    expect(parseColor('#ff800080')?.[3]).toBeCloseTo(128 / 255);
    expect(parseColor('#fff')).toEqual([1, 1, 1, 1]);
    expect(parseColor('rgba(6,3,14,0.39)')).toEqual([6 / 255, 3 / 255, 14 / 255, 0.39]);
    expect(parseColor('transparent')).toEqual([0, 0, 0, 0]);
    expect(parseColor('conic-gradient(red, blue)')).toBeNull();
  });
});

describe('parseGradients', () => {
  it('reads the sky gradient', () => {
    const [sky] = parseGradients('linear-gradient(180deg, #1c275a 0%, #bc376c 52%, #ff7237 100%)');
    expect(sky).toMatchObject({ kind: 'linear', angleDeg: 180 });
    expect(sky?.stops.map((s) => s.at)).toEqual([0, 0.52, 1]);
  });

  it('lists layered backgrounds bottom first', () => {
    const layers = parseGradients(
      'radial-gradient(60% 38% at 0% 16%, #ffc63daa 0%, #ffc63d00 70%), linear-gradient(100deg, #ff418050 0%, #ff418000 24%)',
    );
    expect(layers.map((g) => g.kind)).toEqual(['linear', 'radial']);
    expect(layers[1]).toMatchObject({ size: { rx: 0.6, ry: 0.38 }, at: [0, 0.16] });
  });

  it('reads circles with and without a centre', () => {
    expect(parseGradients('radial-gradient(circle, #fff 0%, #fff0 70%)')[0]).toMatchObject({
      size: 'circle',
      at: [0.5, 0.5],
    });
    expect(
      parseGradients(
        'radial-gradient(circle at 50% 38%, #fff4dc 0%, #ffc46b 48%, #ffc63d 100%)',
      )[0],
    ).toMatchObject({ size: 'circle', at: [0.5, 0.38] });
    expect(parseGradients('none')).toEqual([]);
  });
});

describe('resolveStops', () => {
  it('spreads implicit positions as CSS does', () => {
    const [g] = parseGradients('radial-gradient(circle, #fffdf4, #fff3c8 70%)');
    expect(resolveStops(g?.stops ?? []).positions).toEqual([0, 0.7]);
    const [h] = parseGradients('linear-gradient(90deg, #000, #111, #222)');
    expect(resolveStops(h?.stops ?? []).positions).toEqual([0, 0.5, 1]);
  });

  it('fades transparent stops in the neighbouring colour, not through black', () => {
    const [v] = parseGradients(
      'radial-gradient(130% 95% at 50% 38%, transparent 48%, rgba(6,3,14,0.39) 100%)',
    );
    const { colors, positions } = resolveStops(v?.stops ?? []);
    expect(positions).toEqual([0.48, 1]);
    expect(colors[0]).toEqual([6 / 255, 3 / 255, 14 / 255, 0]);
  });

  it('splits a transparent stop between two different colours', () => {
    const [g] = parseGradients('linear-gradient(90deg, #ff0000 0%, transparent 50%, #0000ff 100%)');
    const { colors, positions } = resolveStops(g?.stops ?? []);
    expect(positions).toEqual([0, 0.5, 0.5, 1]);
    expect(colors[1]).toEqual([1, 0, 0, 0]);
    expect(colors[2]).toEqual([0, 0, 1, 0]);
  });
});

describe('parseBoxShadows', () => {
  it('reads spread rings, blurred halos and insets', () => {
    const shadows = parseBoxShadows('0 0 0 12px #ffc63d2e, 0 0 150px 70px #ff418055');
    expect(shadows).toHaveLength(2);
    expect(shadows[0]).toMatchObject({ blur: 0, spread: 12, inset: false });
    expect(shadows[1]).toMatchObject({ blur: 150, spread: 70 });
    expect(parseBoxShadows('inset -7px -3px 0 rgba(30,26,60,.35)')[0]).toMatchObject({
      x: -7,
      y: -3,
      inset: true,
    });
  });

  it('reads blur filters', () => {
    expect(parseBlur('blur(46px)')).toBe(46);
    expect(parseBlur('none')).toBe(0);
  });
});

describe('gradient geometry', () => {
  it('runs a 180° gradient from top to bottom and 90° across', () => {
    const down = linearGradientLine(180, 402, 874);
    expect(down.start.x).toBeCloseTo(201);
    expect(down.start.y).toBeCloseTo(0);
    expect(down.end.x).toBeCloseTo(201);
    expect(down.end.y).toBeCloseTo(874);
    const across = linearGradientLine(90, 402, 874);
    expect(across.start.x).toBeCloseTo(0);
    expect(across.end.x).toBeCloseTo(402);
  });

  it('sizes ellipses from the box and circles to the farthest corner', () => {
    const [v] = parseGradients('radial-gradient(130% 95% at 50% 38%, transparent 48%, #000 100%)');
    const [c] = parseGradients('radial-gradient(circle at 50% 38%, #fff 0%, #000 100%)');
    if (v?.kind !== 'radial' || c?.kind !== 'radial') throw new Error('expected radial gradients');
    const ellipse = radialGradientShape(v, 402, 874);
    expect(ellipse.c).toEqual({ x: 201, y: 874 * 0.38 });
    expect(ellipse.rx).toBeCloseTo(522.6);
    expect(ellipse.ry).toBeCloseTo(830.3);
    expect(radialGradientShape(c, 100, 100).rx).toBeCloseTo(Math.hypot(50, 62));
  });
});

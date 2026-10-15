import { describe, expect, it } from '@jest/globals';

import { atmosphereFor, LOOK_IDS, lookById, paletteFor, type LookId } from '@6pm/theme';

import { lookSun } from '../../sun-geometry';
import { parseBackground, parseImage } from './box-css';
import { gradientGeometry, resolveStops } from './box-gradients';
import { parseAnimation, parseBox, parseRadii } from './box-model';
import { drawsOwnSun, sunBoxes } from './box-sun';

const W = 402;
const H = 874;
const HOURS = [8.5, 13, 16.6, 18.12, 19.5, 21.5];

/** Every box a look's atmosphere draws, at every variant and hour of the Lookbook. */
function everyBox(): { look: LookId; raw: Record<string, unknown> }[] {
  const out: { look: LookId; raw: Record<string, unknown> }[] = [];
  for (const look of LOOK_IDS) {
    for (const [v] of lookById(look).variants.entries()) {
      for (const hour of HOURS) {
        for (const closed of [false, true]) {
          const input = { look, hour, serious: false, config: { v }, closed };
          const palette = paletteFor(input);
          const atm = atmosphereFor(input, palette, 1);
          const raws = [atm.back, atm.front].flatMap((list) =>
            Array.isArray(list) ? (list as Record<string, unknown>[]) : [],
          );
          if (drawsOwnSun(look)) raws.push(...sunBoxes(lookSun(input, palette, true), W));
          raws.push({ bg: atm.moonBg, sh: atm.moonSh, w: '26px', h: '26px', r: '50%' });
          for (const raw of raws) out.push({ look, raw });
        }
      }
    }
  }
  return out;
}

describe('the atmosphere’s boxes', () => {
  const boxes = everyBox();

  it('reads every background, mask, border and animation the looks write', () => {
    const unread: string[] = [];
    for (const { look, raw } of boxes) {
      const bg = typeof raw.bg === 'string' ? raw.bg : 'transparent';
      const box = parseBox(raw, W, H);
      if (bg !== 'transparent' && bg !== 'none' && box.fills.length === 0)
        unread.push(`${look} bg ${bg}`);
      const layers = bg === 'transparent' || bg === 'none' ? 0 : bg.split(/,(?![^(]*\))/).length;
      if (box.fills.length > 0 && box.fills.length < layers && !bg.includes('url(')) {
        // Each top-level layer must survive (commas inside functions do not split).
        const top = parseBackground(bg).length;
        if (top === 0) unread.push(`${look} bg layers ${bg}`);
      }
      if (typeof raw.mk === 'string' && raw.mk !== 'none' && !box.mask)
        unread.push(`${look} mask ${raw.mk}`);
      if (typeof raw.bd === 'string' && raw.bd !== 'none' && !box.border)
        unread.push(`${look} border ${raw.bd}`);
      if (typeof raw.an === 'string' && raw.an !== 'none' && !box.animation)
        unread.push(`${look} anim ${raw.an}`);
    }
    expect([...new Set(unread)]).toEqual([]);
  });

  it('gives every gradient a drawable shape', () => {
    for (const { raw } of boxes) {
      const box = parseBox(raw, W, H);
      for (const layer of box.fills) {
        if (layer.image.kind === 'color' || layer.image.kind === 'noise') continue;
        expect(gradientGeometry(layer.image, box.w || 1, box.h || 1)).not.toBeNull();
      }
    }
  });
});

describe('box CSS', () => {
  it('reads Bát Tràng’s brushed band: a tiled ring row under a noise mask', () => {
    const [layer] = parseBackground(
      'radial-gradient(circle at 50% 100%, #1d3f9a 0 1.7px, #1d3f9a00 2.1px 5.6px, #1d3f9a 5.9px 7.1px, #1d3f9a00 7.5px) 4px 0 / 17px 12px repeat-x',
    );
    expect(layer?.repeat).toBe('repeat-x');
    expect(layer?.size).toEqual([
      { v: 17, unit: 'px' },
      { v: 12, unit: 'px' },
    ]);
    expect(layer?.pos[0]).toEqual({ v: 4, unit: 'px' });
    expect(layer?.image.kind === 'radial' && layer.image.stops).toHaveLength(7);
  });

  it('reads a star trail’s conic mask that grows with the exposure', () => {
    const mask = parseImage(
      'conic-gradient(from 31.5deg, transparent 0deg, #000 calc(var(--exp, 1) * 21.3deg), transparent calc(var(--exp, 1) * 21.3deg + 0.4deg))',
    );
    expect(mask?.kind).toBe('conic');
    if (mask?.kind !== 'conic') return;
    expect(resolveStops(mask.stops, 1, 1).positions[1]).toBeCloseTo(21.3 / 360);
    expect(resolveStops(mask.stops, 1, 0.5).positions[2]).toBeCloseTo((21.3 * 0.5 + 0.4) / 360);
  });

  it('places px stops along the gradient and spreads implicit ones', () => {
    const g = parseImage('linear-gradient(180deg, #000 0 10px, #fff 10px, #f00)');
    if (g?.kind !== 'linear') throw new Error('linear');
    expect(resolveStops(g.stops, 100).positions).toEqual([0, 0.1, 0.1, 1]);
  });

  it('reads elliptical corners and scales overlapping ones down', () => {
    const [rx, ry] = parseRadii('46% 46% 40% 40% / 58% 58% 30% 30%', 100, 200)[0];
    expect(rx).toBeCloseTo(46);
    expect(ry).toBeCloseTo(116);
    expect(parseRadii('99px', 40, 10)[0]).toEqual([5, 5]);
  });

  it('reads the looks’ animations', () => {
    expect(parseAnimation('spin 2400s linear infinite')).toEqual({
      kind: 'spin',
      periodMs: 2_400_000,
      delayMs: 0,
    });
    expect(parseAnimation('breathe 1.4s steps(2) infinite alternate')).toMatchObject({
      kind: 'breathe',
      steps: 2,
    });
    expect(parseAnimation('floaty 7.2s ease-in-out -3s infinite')).toEqual({
      kind: 'floaty',
      periodMs: 7200,
      delayMs: -3000,
    });
  });
});

import { describe, expect, it } from '@jest/globals';

import { paletteFor } from '@6pm/theme';

import { baseSun, moonOpacity } from './sun-geometry';

const golden = (hour: number) => paletteFor({ look: 'golden', hour, serious: false });
const sunAt = (hour: number, visible = true, serious = false) =>
  baseSun(hour, golden(hour), visible, serious);

describe('baseSun', () => {
  it('rises at 06:00 on the left edge of its arc, low on the horizon', () => {
    const sun = sunAt(6);
    expect(sun.x).toBeCloseTo(0.1);
    expect(sun.y).toBeCloseTo(400);
    expect(sun.size).toBe(60);
    expect(sun.opacity).toBe(1);
  });

  it('peaks at 12:15 in the middle, 270 pt higher', () => {
    const sun = sunAt(12.25);
    expect(sun.x).toBeCloseTo(0.5);
    expect(sun.y).toBeCloseTo(130);
  });

  it('sits where the designed Friday shows it at 18:07', () => {
    const sun = sunAt(18.12);
    expect(sun.x * 100).toBeCloseTo(87.568, 3);
    expect(sun.y).toBeCloseTo(374.253, 3);
    expect(sun.size).toBeCloseTo(97.44, 2);
  });

  it('swells from 15:00 by 12 pt an hour', () => {
    expect(sunAt(15).size).toBe(60);
    expect(sunAt(17).size).toBe(84);
  });

  it('sets from 18:30 and is gone by 19:06', () => {
    expect(sunAt(18.5).opacity).toBe(1);
    expect(sunAt(18.8).opacity).toBeCloseTo(0.5);
    expect(sunAt(19.1).opacity).toBe(0);
    expect(sunAt(21.5).opacity).toBe(0);
  });

  it('turns from noon white to a warm sunset disc after 16:30', () => {
    expect(sunAt(14).color).toBe('radial-gradient(circle at 50% 40%, #fffdf4, #fff3c8 70%)');
    const evening = sunAt(18.12);
    expect(evening.color).toContain(golden(18.12).b1);
    expect(evening.glow).toContain(`${golden(18.12).b2}55`);
  });

  it('only shows on the Today tab and never in serious mode', () => {
    expect(sunAt(12, false).opacity).toBe(0);
    expect(sunAt(12, true, true).opacity).toBe(0);
  });
});

describe('moonOpacity', () => {
  it('fades in from 19:00 to 20:00', () => {
    expect(moonOpacity({ look: 'golden', hour: 18.9, serious: false })).toBe(0);
    expect(moonOpacity({ look: 'golden', hour: 19.5, serious: false })).toBeCloseTo(0.5);
    expect(moonOpacity({ look: 'golden', hour: 21.5, serious: false })).toBe(1);
  });

  it('stays down in serious mode and in Basic unless Sun & moon is on', () => {
    expect(moonOpacity({ look: 'golden', hour: 21.5, serious: true })).toBe(0);
    expect(moonOpacity({ look: 'basic', hour: 21.5, serious: false })).toBe(0);
    expect(moonOpacity({ look: 'basic', config: { sun: true }, hour: 21.5, serious: false })).toBe(
      1,
    );
  });
});

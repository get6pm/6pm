import { describe, expect, it } from '@jest/globals';

import { atmosphereFor, paletteFor, type FrameInput } from '@6pm/theme';

import { expandStopPairs, parseFill } from './surface-css';

const at = (look: FrameInput['look'], hour: number): FrameInput => ({
  look,
  hour,
  serious: false,
});

describe('expandStopPairs', () => {
  it('splits a two-position stop into two stops of the same colour', () => {
    expect(expandStopPairs('linear-gradient(180deg, #ff0000 0 34%, #00ff00 34% 62%)')).toBe(
      'linear-gradient(180deg, #ff0000 0%, #ff0000 34%, #00ff00 34%, #00ff00 62%)',
    );
  });

  it('leaves single-position stops and ellipse heads alone', () => {
    const css = 'radial-gradient(120% 70% at 50% 100%, #123456 0%, #12345600 70%)';
    expect(expandStopPairs(css)).toBe(css);
  });
});

describe('parseFill', () => {
  it('reads Sơn Mài’s sheen: gold edges round a white core', () => {
    const input = at('lacquer', 14);
    const atm = atmosphereFor(input, paletteFor(input), 1);
    const fill = parseFill(String(atm.sheen));
    expect(fill.shapes[0]?.kind).toBe('linear');
    expect(fill.shapes[0]?.positions).toEqual([0.4, 0.47, 0.5, 0.53, 0.6]);
  });
});

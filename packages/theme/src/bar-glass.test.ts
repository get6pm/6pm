import { describe, expect, it } from 'vitest';

import { barGlass } from './bar-glass';

const st = ['#101020', '#202040', '#000000', '#000000', '#000000'] as const;

describe('the tab bar’s fill without a blur', () => {
  it('lays a thin glass over the sheet, nearly opaque', () => {
    expect(barGlass({ glass: 'rgba(255,255,255,.1)', sheetSolid: '#000000', st })).toBe(
      'rgba(26,26,26,0.97)',
    );
  });

  it('falls back to the bottom of the sky when the sheet is see-through', () => {
    expect(barGlass({ glass: 'rgba(255,255,255,.1)', sheetSolid: 'rgba(0,0,0,.5)', st })).toBe(
      'rgba(26,26,26,0.97)',
    );
  });

  it('leaves a solid glass alone', () => {
    expect(barGlass({ glass: '#fffdf9', sheetSolid: '#000000', st })).toBe('#fffdf9');
  });

  it('reads a hex glass with its own alpha', () => {
    expect(barGlass({ glass: '#ffffff80', sheetSolid: '#000000', st })).toBe(
      'rgba(128,128,128,0.97)',
    );
  });

  it('leaves a colour it cannot read alone', () => {
    expect(barGlass({ glass: 'transparent', sheetSolid: '#000000', st })).toBe('transparent');
  });
});

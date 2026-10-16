import { describe, expect, it } from 'vitest';

import type { DailyNumber } from './daily-number';
import { spendPreview } from './spend-preview';

const friday: DailyNumber = {
  startFree: 11_440_000,
  line: 612_000,
  spent: 200_000,
  free: 11_240_000,
  safe: 412_000,
  tomorrow: 520_000,
  replan: false,
  overspent: false,
};

describe('spendPreview', () => {
  it('reads the design: 300k of lẩu on top of 200k spent leaves 112k of 612k', () => {
    const preview = spendPreview(friday, 300_000);
    if (!preview) throw new Error('fits today');
    expect(preview.left).toBe(112_000);
    expect(preview.spentShare).toBeCloseTo(200 / 612);
    expect(preview.addShare).toBeCloseTo(300 / 612);
  });

  it('shows nothing for a spend bigger than what is still safe today', () => {
    expect(spendPreview(friday, 412_001)).toBeNull();
    expect(spendPreview(friday, 2_000_000)).toBeNull();
  });

  it('fits exactly what is left', () => {
    expect(spendPreview(friday, 412_000)?.left).toBe(0);
  });

  it('shows nothing once the cycle has no line', () => {
    expect(spendPreview({ ...friday, line: 0, safe: 0, overspent: true }, 0)).toBeNull();
  });
});

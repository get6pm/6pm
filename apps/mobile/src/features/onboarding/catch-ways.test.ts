import { describe, expect, it } from '@jest/globals';

import { currencyOf, VND } from '@6pm/domain';

import { catchWaysFor, readyWays } from './catch-ways';

describe('the ways onboarding shows', () => {
  it('offers receipt email in server mode', () => {
    expect(catchWaysFor(VND)).toEqual(['scan', 'share', 'wallet', 'email', 'add', 'lock']);
    expect(catchWaysFor(VND, 'server')).toContain('email');
  });

  it('leaves receipt email out in on-device mode, where it does not exist', () => {
    const ways = catchWaysFor(VND, 'device');
    expect(ways).toEqual(['scan', 'share', 'wallet', 'add', 'lock']);
    expect(readyWays(ways)).toBe(4);
    expect(catchWaysFor(currencyOf('USD'), 'device')).toEqual(['share', 'wallet', 'add', 'lock']);
  });
});

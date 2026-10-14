import { describe, expect, it } from '@jest/globals';

import {
  DEFAULT_COMPANION_SETTINGS,
  chooseCompanion,
  type CompanionSettings,
} from '../../data/companion-settings';
import { appIconCompanion, canUseCompanion, resolveCompanion } from './entitlement';
import { FREE_CUSTOMER, NO_MAX, type CustomerState } from './purchases-port';

const member: CustomerState = {
  max: { ...NO_MAX, active: true, plan: 'yearly', willRenew: true },
  ownedLooks: [],
};
const trial: CustomerState = {
  ...FREE_CUSTOMER,
  max: { ...NO_MAX, active: true, plan: 'monthly', inTrial: true, trialEndsAt: 1 },
};
const lapsed: CustomerState = { ...member, max: { ...member.max, active: false } };
const neonOwner: CustomerState = { ...FREE_CUSTOMER, ownedLooks: ['neon'] };

const picked = (...forms: Parameters<typeof chooseCompanion>[1][]): CompanionSettings =>
  forms.reduce(chooseCompanion, DEFAULT_COMPANION_SETTINGS);

describe('which companions can be worn', () => {
  it('gives everyone the free four and the sun', () => {
    for (const form of ['sun', 'nhang', 'banhbao', 'giot'] as const) {
      expect(canUseCompanion(form, FREE_CUSTOMER)).toBe(true);
    }
  });

  it('keeps the Max form and the crane for Max, a trial included, not for bought looks', () => {
    expect(canUseCompanion('hac', FREE_CUSTOMER)).toBe(false);
    expect(canUseCompanion('max', neonOwner)).toBe(false);
    expect(canUseCompanion('hac', member)).toBe(true);
    expect(canUseCompanion('max', trial)).toBe(true);
  });
});

describe('resolveCompanion', () => {
  it('wears the sun, or the Max form for members, until one is picked', () => {
    expect(resolveCompanion(DEFAULT_COMPANION_SETTINGS, FREE_CUSTOMER)).toBe('sun');
    expect(resolveCompanion(DEFAULT_COMPANION_SETTINGS, member)).toBe('max');
    expect(resolveCompanion(DEFAULT_COMPANION_SETTINGS, lapsed)).toBe('sun');
  });

  it('wears a pick over the automatic form, members included', () => {
    expect(resolveCompanion(picked('giot'), FREE_CUSTOMER)).toBe('giot');
    expect(resolveCompanion(picked('sun'), member)).toBe('sun');
    expect(resolveCompanion(picked('hac'), member)).toBe('hac');
  });

  it('falls back to the last free pick when Max ends', () => {
    expect(resolveCompanion(picked('banhbao', 'hac'), lapsed)).toBe('banhbao');
    expect(resolveCompanion(picked('nhang', 'giot', 'max'), lapsed)).toBe('giot');
    expect(resolveCompanion(picked('hac'), lapsed)).toBe('sun');
    // Back on Max, the pick returns.
    expect(resolveCompanion(picked('banhbao', 'hac'), member)).toBe('hac');
  });

  it('never wears a Max-only pick without Max', () => {
    expect(resolveCompanion(picked('max'), FREE_CUSTOMER)).toBe('sun');
    expect(resolveCompanion({ chosen: 'hac', lastFree: 'giot', icon: false }, neonOwner)).toBe(
      'giot',
    );
  });
});

describe('appIconCompanion', () => {
  it('keeps the app’s own icon until the icon is set to follow', () => {
    expect(appIconCompanion(picked('giot'), FREE_CUSTOMER)).toBeNull();
  });

  it('follows the companion worn, with the sun as the app’s own icon', () => {
    const follow = (s: CompanionSettings) => ({ ...s, icon: true });
    expect(appIconCompanion(follow(picked('giot')), FREE_CUSTOMER)).toBe('giot');
    expect(appIconCompanion(follow(picked('hac')), member)).toBe('hac');
    expect(appIconCompanion(follow(DEFAULT_COMPANION_SETTINGS), member)).toBe('max');
    expect(appIconCompanion(follow(picked('sun')), member)).toBeNull();
  });

  it('goes back to the app’s own icon when Max ends under a Max-only pick', () => {
    const settings = { ...picked('banhbao', 'hac'), icon: true };
    expect(appIconCompanion(settings, lapsed)).toBeNull();
    expect(appIconCompanion({ ...DEFAULT_COMPANION_SETTINGS, icon: true }, lapsed)).toBeNull();
  });
});

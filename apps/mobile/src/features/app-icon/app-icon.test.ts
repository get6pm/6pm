import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { applyAppIcon, appIconName } from './app-icon';

const mockNative = {
  supported: true,
  showing: null as string | null,
  set: jest.fn((name: string | null) => {
    mockNative.showing = name;
    return Promise.resolve();
  }),
};

jest.mock('../../../modules/app-icon', () => ({
  appIcon: {
    supportsAlternateIcons: () => Promise.resolve(mockNative.supported),
    alternateIconName: () => Promise.resolve(mockNative.showing),
    setAlternateIconName: (name: string | null) => mockNative.set(name),
  },
}));

beforeEach(() => {
  mockNative.supported = true;
  mockNative.showing = null;
  mockNative.set.mockClear();
});

describe('appIconName', () => {
  it('names each companion’s icon, and the sun is the app’s own', () => {
    expect(appIconName('giot')).toBe('CompanionGiot');
    expect(appIconName('hac')).toBe('CompanionHac');
    expect(appIconName('sun')).toBeNull();
    expect(appIconName(null)).toBeNull();
  });
});

describe('applyAppIcon', () => {
  it('switches to the companion’s icon, then leaves it alone once it shows', async () => {
    expect(await applyAppIcon('nhang')).toBe(true);
    expect(mockNative.set).toHaveBeenCalledWith('CompanionNhang');
    expect(await applyAppIcon('nhang')).toBe(false);
    expect(mockNative.set).toHaveBeenCalledTimes(1);
  });

  it('goes back to the app’s own icon', async () => {
    mockNative.showing = 'CompanionMax';
    expect(await applyAppIcon(null)).toBe(true);
    expect(mockNative.set).toHaveBeenCalledWith(null);
  });

  it('does nothing where icons cannot change', async () => {
    mockNative.supported = false;
    expect(await applyAppIcon('banhbao')).toBe(false);
    expect(mockNative.set).not.toHaveBeenCalled();
  });
});

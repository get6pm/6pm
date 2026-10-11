import { describe, expect, it } from '@jest/globals';

import { ICON_PACKS, isPackLocked } from './icon-packs';

describe('which icon packs are locked', () => {
  it('keeps the Max packs locked until Max is on, and never locks the free pack', () => {
    const locked = (hasMax: boolean) =>
      ICON_PACKS.filter((pack) => isPackLocked(pack, hasMax)).length;
    expect(locked(false)).toBe(ICON_PACKS.filter((pack) => !pack.free).length);
    expect(locked(true)).toBe(0);
    expect(isPackLocked({ free: true }, false)).toBe(false);
  });
});

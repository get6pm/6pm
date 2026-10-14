import { describe, expect, it } from '@jest/globals';

import { LOOK_IDS, lookById } from '@6pm/theme';

import { canUseLook, lookAccess, resolveLook, usableLooks } from './entitlement';
import { PAID_LOOKS, SCENE_LOOKS, isPaidLook, lookProductId } from './products';
import { FREE_CUSTOMER, NO_MAX, type CustomerState } from './purchases-port';

const maxCustomer: CustomerState = {
  max: { ...NO_MAX, active: true, plan: 'yearly', willRenew: true },
  ownedLooks: [],
};
const neonOwner: CustomerState = { ...FREE_CUSTOMER, ownedLooks: ['neon'] };

describe('the sold looks match the catalogue', () => {
  it('sells exactly the looks with a price, and the scenes are the premium tier', () => {
    expect([...PAID_LOOKS].sort()).toEqual(LOOK_IDS.filter((id) => lookById(id).price > 0).sort());
    expect([...SCENE_LOOKS].sort()).toEqual(
      LOOK_IDS.filter((id) => lookById(id).tier === 'premium').sort(),
    );
    expect(lookById('neon').price).toBe(49_000);
    expect(lookById('expo').price).toBe(99_000);
  });

  it('names each look’s product after it', () => {
    expect(lookProductId('lantern')).toBe('ai.sixpm.app.look.lantern');
    expect(isPaidLook('golden')).toBe(false);
    expect(isPaidLook('arcade')).toBe(true);
  });
});

describe('which looks can be worn', () => {
  it('gives a free customer Basic and Golden Hour only', () => {
    expect([...usableLooks(FREE_CUSTOMER)].sort()).toEqual(['basic', 'golden']);
    expect(canUseLook('neon', FREE_CUSTOMER)).toBe(false);
    expect(lookAccess('neon', FREE_CUSTOMER)).toBe('locked');
    expect(lookAccess('basic', FREE_CUSTOMER)).toBe('free');
  });

  it('adds only the looks that were bought', () => {
    expect(usableLooks(neonOwner)).toEqual(new Set(['basic', 'golden', 'neon']));
    expect(lookAccess('neon', neonOwner)).toBe('owned');
    expect(canUseLook('riso', neonOwner)).toBe(false);
  });

  it('gives Max every look, including ones added later to the catalogue', () => {
    expect(usableLooks(maxCustomer).size).toBe(LOOK_IDS.length);
    expect(lookAccess('lantern', maxCustomer)).toBe('max');
  });

  it('keeps a bought look owned while Max is on', () => {
    const both: CustomerState = { ...maxCustomer, ownedLooks: ['neon'] };
    expect(lookAccess('neon', both)).toBe('owned');
    expect(lookAccess('riso', both)).toBe('max');
  });
});

describe('resolveLook', () => {
  it('keeps the chosen look while it is usable', () => {
    expect(resolveLook('neon', neonOwner)).toBe('neon');
    expect(resolveLook('expo', maxCustomer)).toBe('expo');
  });

  it('falls back to Golden Hour when Max ends or a purchase is refunded', () => {
    expect(resolveLook('expo', FREE_CUSTOMER)).toBe('golden');
    expect(resolveLook('neon', { ...FREE_CUSTOMER, ownedLooks: ['riso'] })).toBe('golden');
  });

  it('never takes a free look away', () => {
    expect(resolveLook('basic', FREE_CUSTOMER)).toBe('basic');
  });
});

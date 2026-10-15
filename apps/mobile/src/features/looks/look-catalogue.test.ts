import { describe, expect, it } from '@jest/globals';

import { cardBadge, isScene, neighbour, positionOf, shopSub, SHOP_ORDER } from './look-catalogue';
import { FREE_CUSTOMER, NO_MAX, type CustomerState } from '../purchases/purchases-port';

const max: CustomerState = { max: { ...NO_MAX, active: true, plan: 'yearly' }, ownedLooks: [] };

describe('the shop’s order', () => {
  it('lists the classic looks first and the three living scenes last', () => {
    expect(SHOP_ORDER).toEqual([
      'basic',
      'golden',
      'lacquer',
      'glaze',
      'riso',
      'monsoon',
      'cafe',
      'neon',
      'expo',
      'paper',
      'lantern',
    ]);
    expect(SHOP_ORDER.filter(isScene)).toEqual(['expo', 'paper', 'lantern']);
  });

  it('steps round the catalogue in both directions', () => {
    expect(neighbour('basic', -1)).toBe('lantern');
    expect(neighbour('lantern', 1)).toBe('basic');
    expect(neighbour('golden', 1)).toBe('lacquer');
    expect(positionOf('expo')).toEqual({ index: 9, total: 11 });
  });
});

describe('card badges', () => {
  const owner: CustomerState = { ...FREE_CUSTOMER, ownedLooks: ['neon'] };
  it('says In use for the worn look, whatever else is true of it', () => {
    expect(cardBadge('golden', 'golden', FREE_CUSTOMER)).toBe('inUse');
    expect(cardBadge('neon', 'neon', owner)).toBe('inUse');
  });
  it('says Free, Owned, or leaves the price for a look that is not yet the customer’s', () => {
    expect(cardBadge('basic', 'golden', FREE_CUSTOMER)).toBe('free');
    expect(cardBadge('neon', 'golden', owner)).toBe('owned');
    expect(cardBadge('riso', 'golden', owner)).toBe('price');
  });
  it('says Max for looks that only Max unlocks, and Owned for ones bought as well', () => {
    expect(cardBadge('riso', 'golden', max)).toBe('max');
    expect(cardBadge('neon', 'golden', { ...max, ownedLooks: ['neon'] })).toBe('owned');
  });
});

describe('the Settings line under the Look card', () => {
  it('counts what is still in the shop', () => {
    expect(shopSub(FREE_CUSTOMER)).toEqual({ kind: 'more', count: 9 });
    expect(shopSub({ ...FREE_CUSTOMER, ownedLooks: ['neon', 'riso'] })).toEqual({
      kind: 'more',
      count: 7,
    });
  });
  it('says so when everything is owned, or Max is on', () => {
    expect(
      shopSub({
        ...FREE_CUSTOMER,
        ownedLooks: [
          'lacquer',
          'glaze',
          'riso',
          'monsoon',
          'cafe',
          'neon',
          'expo',
          'paper',
          'lantern',
        ],
      }),
    ).toEqual({ kind: 'all' });
    expect(shopSub(max)).toEqual({ kind: 'max' });
  });
});

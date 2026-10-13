import { describe, expect, it } from '@jest/globals';

import { MAX_TILES, parseMaxFrom, tileOrder, tileRows, welcomeAction } from './max-context';

describe('where Max was offered from', () => {
  it('reads the route parameter, and opens on the looks for anything else', () => {
    expect(parseMaxFrom('ask')).toBe('ask');
    expect(parseMaxFrom(['pots', 'ask'])).toBe('pots');
    expect(parseMaxFrom('nonsense')).toBe('looks');
    expect(parseMaxFrom(undefined)).toBe('looks');
  });
});

describe('the feature tiles', () => {
  it('puts the reason Max was opened for first and keeps the rest in order', () => {
    expect(tileOrder('looks')).toEqual(MAX_TILES);
    expect(tileOrder('travel').slice(0, 3)).toEqual(['travel', 'looks', 'ask']);
    expect(tileOrder('travel')).toHaveLength(MAX_TILES.length);
  });

  it('lays the looks across a whole row', () => {
    expect(tileRows(tileOrder('looks')).slice(0, 3)).toEqual([
      ['looks'],
      ['ask', 'pots'],
      ['shared', 'travel'],
    ]);
  });

  it('fills the gap beside a first small tile with the next one, the looks below', () => {
    expect(tileRows(tileOrder('ask')).slice(0, 3)).toEqual([
      ['ask', 'pots'],
      ['looks'],
      ['shared', 'travel'],
    ]);
  });

  it('places every tile once', () => {
    for (const from of MAX_TILES) {
      expect(tileRows(tileOrder(from)).flat().sort()).toEqual([...MAX_TILES].sort());
    }
  });
});

describe('the welcome button', () => {
  it('goes back to the day after a look was tried on', () => {
    expect(welcomeAction('looks', true)).toEqual({ label: 'look', href: null });
  });
  it('opens a screen that exists', () => {
    expect(welcomeAction('pots', false)).toEqual({ label: 'pots', href: '/new-pot' });
    expect(welcomeAction('icons', false).href).toBe('/categories');
    expect(welcomeAction('backup', false).href).toBe('/backup');
    expect(welcomeAction('shared', false)).toEqual({ label: 'shared', href: '/together' });
  });
  it('has nothing to open for a screen that is not built', () => {
    expect(welcomeAction('ask', false)).toEqual({ label: 'ask', href: '/ask' });
    expect(welcomeAction('widgets', false).href).toBeNull();
  });
});

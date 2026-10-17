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

  it('lays the tiles two to a row in order, the reason first', () => {
    expect(tileRows(tileOrder('looks')).slice(0, 2)).toEqual([
      ['looks', 'ask'],
      ['pots', 'travel'],
    ]);
    expect(tileRows(tileOrder('backup'))[0]).toEqual(['backup', 'looks']);
    expect(tileRows(tileOrder('looks')).at(-1)).toEqual(['buddy']);
  });

  it('shows only the tiles a phone has, the reason first when it is one of them', () => {
    const noWidgets = MAX_TILES.filter((tile) => tile !== 'widgets');
    expect(tileOrder('backup', noWidgets)).toEqual([
      'backup',
      ...noWidgets.slice(0, 5),
      'icons',
      'buddy',
    ]);
    expect(tileOrder('widgets', noWidgets)).toEqual(noWidgets);
    expect(tileRows(tileOrder('looks', noWidgets)).at(-1)).toEqual(['icons', 'buddy']);
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
  });
  it('has nothing to open for a screen that is not built', () => {
    expect(welcomeAction('ask', false)).toEqual({ label: 'ask', href: '/ask' });
    expect(welcomeAction('widgets', false).href).toBeNull();
  });
});

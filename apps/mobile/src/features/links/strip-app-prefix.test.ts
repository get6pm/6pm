import { describe, expect, it } from '@jest/globals';

import { stripAppPrefix } from './strip-app-prefix';

describe('universal links under /app', () => {
  it('drops the prefix from a full link and from a bare path', () => {
    expect(stripAppPrefix('https://6pm.oddeggs.studio/app/close')).toBe('/close');
    expect(stripAppPrefix('/app/spend/abc?x=1')).toBe('/spend/abc?x=1');
  });

  it('turns the bare prefix into the home route', () => {
    expect(stripAppPrefix('https://6pm.oddeggs.studio/app')).toBe('/');
    expect(stripAppPrefix('/app/')).toBe('/');
    expect(stripAppPrefix('/app?tab=plan')).toBe('/?tab=plan');
  });

  it('leaves other links and look-alike paths alone', () => {
    expect(stripAppPrefix('/close')).toBe('/close');
    expect(stripAppPrefix('/apple')).toBe('/apple');
    expect(stripAppPrefix('https://6pm.oddeggs.studio/privacy')).toBe(
      'https://6pm.oddeggs.studio/privacy',
    );
  });
});

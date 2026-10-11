import { describe, expect, it } from '@jest/globals';

import { BANKS } from '@6pm/domain';

import appConfig from '../../../app.config';

describe('bank hand-off schemes', () => {
  it('lets iOS check for every bank app the catalogue can open', () => {
    const plist = appConfig({ config: {} } as Parameters<typeof appConfig>[0]).ios?.infoPlist;
    const catalogue = BANKS.flatMap((b) => (b.ios ? [b.ios.scheme.replace('://', '')] : []));
    expect([...(plist?.['LSApplicationQueriesSchemes'] as string[])].sort()).toEqual(
      [...catalogue].sort(),
    );
  });
});

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { randomUuid } from './uuid';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('randomUuid', () => {
  it('is a lower-case UUID v4 for any draw', () => {
    fc.assert(
      fc.property(
        fc.array(fc.double({ min: 0, max: 0.9999, noNaN: true }), { minLength: 40, maxLength: 40 }),
        (draws) => {
          let i = 0;
          expect(randomUuid(() => draws[i++ % draws.length] ?? 0)).toMatch(UUID_V4);
        },
      ),
    );
    expect(randomUuid()).not.toBe(randomUuid());
  });
});

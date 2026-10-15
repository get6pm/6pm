import { describe, expect, it } from '@jest/globals';

import { FACT_KINDS, type Fact } from '@6pm/domain';
import { t, type Language } from '@6pm/i18n';

/** The catalogue looked up by keys built at run time. */
const lookUp = t as unknown as (
  language: Language,
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

import { catalogueKey, catalogueLine, slotValues, type SlotWords } from './fact-words';

const words = (language: Language): SlotWords => ({
  language,
  say: (key, params) => lookUp(language, key, params),
  categoryName: (id) => ({ drinks: 'Cà phê' })[id] ?? id,
  dayMonth: (date) => `${String(date.getDate())}/${String(date.getMonth() + 1)}`,
});

const repeat: Fact = {
  kind: 'repeatMerchant',
  key: 'repeatMerchant:highlands:4',
  tone: 'neutral',
  salience: 0.6,
  repeatAfterDays: 3,
  slots: {
    merchant: { type: 'merchant', value: 'Highlands' },
    visits: { type: 'count', value: 4 },
    amount: { type: 'money', value: 236_000 },
  },
};

const billDue = (days: number): Fact => ({
  kind: 'billDue',
  key: `billDue:net:${String(days)}`,
  tone: 'neutral',
  salience: 0.6,
  repeatAfterDays: 1,
  slots: {
    bill: { type: 'bill', id: 'net', name: 'Internet' },
    amount: { type: 'money', value: 250_000 },
    days: { type: 'count', value: days },
  },
});

describe('slotValues', () => {
  it('formats each slot in the user’s language', () => {
    expect(slotValues(repeat, words('en'))).toEqual({
      merchant: 'Highlands',
      visits: '4',
      amount: '236k',
    });
  });
});

describe('catalogueLine', () => {
  it('fills a voice’s variant, and the plain line in serious mode', () => {
    expect(catalogueLine(repeat, 'cheeky', 0, words('en'))).toBe(
      'Highlands again? That’s 4 since Monday.',
    );
    expect(catalogueLine(repeat, 'plain', 7, words('vi'))).toBe('Highlands: 4 lần tuần này, 236k.');
  });

  it('uses the plural on the fact’s count, and its own line for a bill due today', () => {
    expect(catalogueLine(billDue(1), 'plain', 0, words('en'))).toBe(
      'Internet (250k) is due tomorrow.',
    );
    expect(catalogueLine(billDue(3), 'plain', 0, words('en'))).toBe(
      'Internet (250k) is due in 3 days.',
    );
    expect(catalogueKey(billDue(0), 'soft', 1)).toBe('insight.billDueToday.soft.2');
  });

  it('has a line for every kind of fact in every voice and variant, in both languages', () => {
    const kinds = FACT_KINDS.flatMap((kind) =>
      kind === 'categoryPace'
        ? ['categoryPaceUp', 'categoryPaceDown']
        : kind === 'billDue'
          ? ['billDue', 'billDueToday']
          : [kind],
    );
    // A missing key has no entry to read, so looking it up throws.
    const line = (language: Language, key: string) => lookUp(language, key, { count: 2 });
    for (const language of ['en', 'vi'] as const) {
      for (const kind of kinds) {
        expect(line(language, `insight.${kind}.plain`)).not.toBe('');
        for (const voice of ['soft', 'cheeky', 'roast']) {
          for (const variant of [1, 2]) {
            expect(line(language, `insight.${kind}.${voice}.${String(variant)}`)).not.toBe('');
          }
        }
      }
    }
  });
});

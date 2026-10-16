import { describe, expect, it } from '@jest/globals';

import {
  answerAsk,
  currencyOf,
  moneyFormat,
  moneyLocale,
  readIntent,
  vndLocale,
} from '@6pm/domain';
import { t, type Language } from '@6pm/i18n';

import { askSuggestions } from './ask-suggestions';

const suggestionsIn = (language: Language, pot: string | null) =>
  askSuggestions(
    (key, ...params) => t(language, key, ...params),
    pot,
    moneyFormat(vndLocale(language)),
  );

describe('the suggested questions', () => {
  it('offers the pot question only when there is a pot', () => {
    expect(suggestionsIn('en', null)).toHaveLength(4);
    expect(suggestionsIn('en', 'Tết & lì xì')).toContain('When is Tết & lì xì covered?');
    expect(suggestionsIn('vi', 'Tết')).toContain('Khi nào đủ tiền Tết?');
  });

  it.each<Language>(['en', 'vi'])(
    'reads every one in %s the way it was meant, offline',
    (language) => {
      const [afford, weekend, spend, pot, save] = suggestionsIn(language, 'Tết');
      expect(readIntent(afford ?? '', ['Tết'])).toEqual({ kind: 'afford', amount: 2_000_000 });
      expect(readIntent(weekend ?? '', ['Tết'])).toEqual({ kind: 'weekend' });
      expect(readIntent(spend ?? '', ['Tết'])).toEqual({ kind: 'afford', amount: 450_000 });
      expect(readIntent(save ?? '', ['Tết'])).toEqual({ kind: 'saveMore', amount: 500_000 });
      expect(readIntent(pot ?? '', ['Tết'])).toEqual({ kind: 'potFull', pot: 'Tết' });
    },
  );

  it('prices the examples in the home currency, and reads them back in it', () => {
    const USD = currencyOf('USD');
    const [afford, , spend] = askSuggestions(
      (key, ...params) => t('en', key, ...params),
      null,
      moneyFormat(moneyLocale(USD, 'en')),
    );
    expect(afford).toBe('Can I afford a $80 dinner Saturday?');
    expect(spend).toBe('What if I buy a $15 jacket?');
    expect(readIntent(afford ?? '', [], USD)).toEqual({ kind: 'afford', amount: 8000 });
    expect(readIntent(spend ?? '', [], USD)).toEqual({ kind: 'afford', amount: 1500 });
  });

  it('has an answer for each, whatever the plan', () => {
    for (const question of suggestionsIn('en', null)) {
      expect(
        answerAsk(readIntent(question), {
          today: '2026-10-09',
          day: {
            startFree: 0,
            line: 0,
            spent: 0,
            free: 0,
            safe: 0,
            tomorrow: 0,
            replan: false,
            overspent: false,
          },
          daysLeft: 22,
          payday: '2026-10-31',
          futureYou: 0,
          share: 1,
          pots: [],
        }).kind,
      ).not.toBe('help');
    }
  });
});

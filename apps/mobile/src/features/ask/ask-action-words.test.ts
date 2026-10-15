import { describe, expect, it } from '@jest/globals';

import { moneyFormat, vndLocale } from '@6pm/domain';
import { t, type Language } from '@6pm/i18n';

import { describeAction } from './ask-action-words';
import type { LedgerWordsEnv } from './ask-ledger-words';

const lookUp = t as unknown as (
  language: Language,
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

function env(language: Language): LedgerWordsEnv {
  const say = (key: string, params?: Readonly<Record<string, string | number>>) =>
    lookUp(language, key, params);
  const categoryName = (id: string) => ({ food: 'Ăn uống' })[id] ?? id;
  const money = moneyFormat(vndLocale(language));
  return {
    t: say,
    language,
    money,
    monthLong: (m) => m,
    dayLongMonth: (d) => d,
    weekday: (d) => d,
    categoryName,
    voice: 'cheeky',
    slotWords: { language, money, say, categoryName, dayMonth: (d) => String(d.getDate()) },
  };
}

describe('describeAction', () => {
  it('asks before adding a spend, and says where it goes', () => {
    const { card, pending } = describeAction(
      { kind: 'confirmSpend', amount: 50_000, name: 'Phở', category: null },
      env('vi'),
      { categoryId: 'food', potLocked: false },
    );
    expect(card.text).toContain('Phở');
    expect(card.text).toContain('Ăn uống');
    expect(card.actions?.map((a) => a.id)).toEqual(['go', 'cancel']);
    expect(pending).toEqual({ kind: 'addSpend', amount: 50_000, name: 'Phở', categoryId: 'food' });
  });

  it('opens New pot filled in, or Max when Free’s pot is in use', () => {
    const pot = {
      kind: 'confirmPot',
      name: 'Du lịch',
      goal: 10_000_000,
      neededBy: '2027-03',
    } as const;
    expect(describeAction(pot, env('en'), { categoryId: '', potLocked: false }).pending).toEqual({
      kind: 'open',
      pathname: '/new-pot',
      params: { name: 'Du lịch', goal: '10000000', by: '2027-03' },
    });
    expect(describeAction(pot, env('en'), { categoryId: '', potLocked: true }).pending).toEqual({
      kind: 'open',
      pathname: '/max',
      params: { from: 'pots' },
    });
  });

  it('points a how-to at its guide, and explains budgets without a button', () => {
    const email = describeAction({ kind: 'howTo', topic: 'email' }, env('en'), {
      categoryId: '',
      potLocked: false,
    });
    expect(email.pending).toEqual({
      kind: 'open',
      pathname: '/capture-guide',
      params: { source: 'email' },
    });
    const budget = describeAction({ kind: 'howTo', topic: 'budget' }, env('vi'), {
      categoryId: '',
      potLocked: false,
    });
    expect(budget.pending).toBeNull();
    expect(budget.card.text).toContain('Con số mỗi ngày chính là ngân sách');
  });
});

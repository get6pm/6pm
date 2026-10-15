import { describe, expect, it } from 'vitest';

import { day, spend } from '../insights/insight-fixture';
import type { AskContext } from './ask-engine';
import type { AskLedger } from './ask-ledger';
import { answerChat } from './chat';

const ctx: AskContext = {
  today: '2026-10-09',
  day: day({ spent: 104_000, safe: 247_000, free: 7_969_000, tomorrow: 362_000 }),
  daysLeft: 22,
  payday: '2026-10-31',
  futureYou: 2_000_000,
  share: 1,
  pots: [],
};

function ledgerOf(spends: AskLedger['spends']): AskLedger {
  return {
    cycleStart: '2026-09-30',
    previousCycleStart: '2026-08-31',
    since: '2026-08-31',
    categories: [],
    notDaily: new Set(['home']),
    closed: [],
    bills: [],
    pots: [],
    spends,
  };
}

const coffee = ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'].map((d) =>
  spend(d, 'Highlands', 59_000, 'drinks'),
);
const pharmacy = ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'].map((d) =>
  spend(d, 'Pharmacity', 120_000, 'health'),
);

describe('answerChat', () => {
  it('builds a roast on a real spend', () => {
    const answer = answerChat('roast', ctx, ledgerOf(coffee));
    expect(answer.topic).toBe('roast');
    expect(answer.fact?.kind).toBe('repeatMerchant');
  });

  it('never roasts health, the home, family or gifts', () => {
    const answer = answerChat('roast', ctx, ledgerOf(pharmacy));
    expect(answer.fact === null || answer.fact.kind !== 'repeatMerchant').toBe(true);
    expect(JSON.stringify(answer.fact)).not.toContain('Pharmacity');
  });

  it('comforts with something going right, never a spend', () => {
    const answer = answerChat('venting', ctx, ledgerOf(coffee));
    expect(answer.fact?.kind).not.toBe('repeatMerchant');
    expect(answer.fact?.kind).not.toBe('biggestSpend');
  });

  it('gives distress, investing and unsafe questions no fact at all', () => {
    for (const topic of ['distress', 'investing', 'unsafe'] as const) {
      expect(answerChat(topic, ctx, ledgerOf(coffee))).toEqual({ kind: 'chat', topic, fact: null });
    }
  });
});

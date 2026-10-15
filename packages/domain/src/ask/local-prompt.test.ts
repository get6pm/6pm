import { describe, expect, it } from 'vitest';

import { explanationFits, localLine, safeLocalQuery } from './local-prompt';

describe('safeLocalQuery', () => {
  it('takes the amount from the phone, not the model', () => {
    // A model read "Log 120k" as 1,2tr.
    expect(
      safeLocalQuery(
        'Log 120k for lunch',
        '{"query":{"kind":"logSpend","amount":1200000,"name":"Lunch"}}',
      ),
    ).toEqual({ kind: 'logSpend', amount: 120_000, name: 'Lunch' });
  });

  it('drops a reading whose amount the question never said', () => {
    // A model made up 200tr for a weekend trip.
    expect(
      safeLocalQuery(
        'mình có đủ tiền đi đà lạt cuối tuần ko',
        '{"query":{"kind":"afford","amount":200000000}}',
      ),
    ).toEqual({ kind: 'unknown' });
  });

  it('never lets the model decide distress or venting', () => {
    expect(
      safeLocalQuery('stress vì tiền quá', '{"query":{"kind":"chat","topic":"distress"}}'),
    ).toEqual({ kind: 'unknown' });
  });

  it('keeps a reading without amounts, and drops one outside the query shape', () => {
    expect(
      safeLocalQuery(
        'tiền tháng này đi đâu',
        '{"query":{"kind":"breakdown","range":{"preset":"thisMonth"}}}',
      ),
    ).toEqual({ kind: 'breakdown', range: { preset: 'thisMonth' } });
    expect(safeLocalQuery('hôm nay', '{"query":{"kind":"logSpend","span":"today"}}')).toEqual({
      kind: 'unknown',
    });
  });
});

describe('localLine', () => {
  it('puts values written out back as placeholders, from JSON or a bare line', () => {
    expect(
      localLine('{"text":"Highlands 4 times since Monday, 220k in all.","mood":"nod"}', {
        merchant: 'Highlands',
        visits: '4',
        amount: '220k',
      }),
    ).toEqual({ text: '{merchant} {visits} times since Monday, {amount} in all.', mood: 'nod' });
    expect(localLine('Điện EVN 380k đến hạn nha.', { bill: 'Điện EVN', amount: '380k' })).toEqual({
      text: '{bill} {amount} đến hạn nha.',
      mood: 'calm',
    });
  });
});

describe('explanationFits', () => {
  it('wants the language asked in', () => {
    expect(explanationFits('Lãi kép là khi tiền lãi cũng sinh lãi.', 'vi')).toBe(true);
    expect(explanationFits('Quy tắc 50/30/20 giúp bạn chia thu nhập.', 'en')).toBe(false);
    expect(explanationFits('ok', 'en')).toBe(false);
  });
});

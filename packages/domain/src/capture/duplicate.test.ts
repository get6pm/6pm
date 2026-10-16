import { describe, expect, it } from 'vitest';

import {
  DUPLICATE_WINDOW_MS,
  findDuplicate,
  mergedStatus,
  QR_RECEIPT_WINDOW_MS,
  type SightedSpend,
} from './duplicate';

const base: SightedSpend = {
  id: 'a',
  amount: 45_000,
  source: 'qr',
  status: 'pending',
  at: '2026-10-11T05:10:00.000Z',
};
const at = (ms: number) => new Date(Date.parse(base.at) + ms).toISOString();

describe('findDuplicate', () => {
  it('finds the same amount from another source within three minutes', () => {
    const hit = findDuplicate({ amount: 45_000, source: 'email', at: at(2 * 60_000) }, [base]);
    expect(hit?.id).toBe('a');
  });

  it('includes exactly three minutes, in either direction', () => {
    const kept = { ...base, status: 'kept' as const };
    expect(
      findDuplicate({ amount: 45_000, source: 'email', at: at(DUPLICATE_WINDOW_MS) }, [kept]),
    ).not.toBeNull();
    expect(
      findDuplicate({ amount: 45_000, source: 'email', at: at(-DUPLICATE_WINDOW_MS) }, [kept]),
    ).not.toBeNull();
    expect(
      findDuplicate({ amount: 45_000, source: 'email', at: at(DUPLICATE_WINDOW_MS + 1) }, [kept]),
    ).toBeNull();
  });

  it('matches a waiting scan with its bank receipt up to twenty minutes after the tap', () => {
    for (const source of ['email', 'shared', 'applePay'] as const) {
      expect(
        findDuplicate({ amount: 45_000, source, at: at(QR_RECEIPT_WINDOW_MS) }, [base])?.id,
      ).toBe('a');
      expect(
        findDuplicate({ amount: 45_000, source, at: at(QR_RECEIPT_WINDOW_MS + 1) }, [base]),
      ).toBeNull();
    }
  });

  it('looks only forward from the tap for a waiting scan', () => {
    expect(
      findDuplicate({ amount: 45_000, source: 'email', at: at(-DUPLICATE_WINDOW_MS) }, [base]),
    ).not.toBeNull();
    expect(
      findDuplicate({ amount: 45_000, source: 'email', at: at(-DUPLICATE_WINDOW_MS - 1) }, [base]),
    ).toBeNull();
  });

  it('keeps three minutes for a scan that is no longer waiting', () => {
    for (const status of ['kept', 'caught'] as const) {
      expect(
        findDuplicate({ amount: 45_000, source: 'email', at: at(10 * 60_000) }, [
          { ...base, status },
        ]),
      ).toBeNull();
    }
  });

  it('matches a waiting scan arriving after a receipt it may have paid', () => {
    const receipt = { ...base, source: 'email' as const, status: 'caught' as const };
    const scan = { amount: 45_000, source: 'qr' as const, status: 'pending' as const };
    expect(findDuplicate({ ...scan, at: at(-10 * 60_000) }, [receipt])?.id).toBe('a');
    expect(findDuplicate({ ...scan, at: at(10 * 60_000) }, [receipt])).toBeNull();
    expect(
      findDuplicate({ ...scan, status: 'caught', at: at(-10 * 60_000) }, [receipt]),
    ).toBeNull();
  });

  it('needs the same amount and a different source', () => {
    expect(findDuplicate({ amount: 46_000, source: 'email', at: at(0) }, [base])).toBeNull();
    expect(findDuplicate({ amount: 45_000, source: 'qr', at: at(0) }, [base])).toBeNull();
  });

  it('ignores skipped and deleted spends', () => {
    for (const status of ['skipped', 'deleted'] as const) {
      expect(
        findDuplicate({ amount: 45_000, source: 'email', at: at(0) }, [{ ...base, status }]),
      ).toBeNull();
    }
  });

  it('never merges something the user typed with a capture, or with another typed spend', () => {
    const typed = { ...base, source: 'manual' as const, status: 'kept' as const };
    expect(findDuplicate({ amount: 45_000, source: 'voice', at: at(0) }, [typed])).toBeNull();
    expect(findDuplicate({ amount: 45_000, source: 'applePay', at: at(0) }, [typed])).toBeNull();
    expect(findDuplicate({ amount: 45_000, source: 'manual', at: at(0) }, [base])).toBeNull();
    expect(findDuplicate({ amount: 45_000, source: 'voice', at: at(0) }, [base])).toBeNull();
  });

  it('merges any two different capture sources', () => {
    const sources = ['qr', 'shared', 'email', 'applePay'] as const;
    for (const first of sources) {
      for (const second of sources) {
        const hit = findDuplicate({ amount: 45_000, source: second, at: at(0) }, [
          { ...base, source: first },
        ]);
        expect(hit !== null).toBe(first !== second);
      }
    }
  });

  it('merges the bank’s email with the shop’s email for one payment, never two from one sender', () => {
    const alert = {
      ...base,
      source: 'email' as const,
      status: 'caught' as const,
      detail: 'info@info.vietcombank.com.vn',
    };
    const fromShop = { amount: 45_000, source: 'email' as const, at: at(4_000) };
    expect(findDuplicate({ ...fromShop, detail: 'info@mail.shopee.vn' }, [alert])?.id).toBe('a');
    expect(findDuplicate({ ...fromShop, detail: 'INFO@info.vietcombank.com.vn' }, [alert])).toBe(
      null,
    );
    expect(findDuplicate({ ...fromShop, detail: null }, [alert])).toBeNull();
  });

  it('never merges cash, which no other source can have seen', () => {
    expect(findDuplicate({ amount: 45_000, source: 'cash', at: at(0) }, [base])).toBeNull();
    const cash = { ...base, source: 'cash' as const, status: 'kept' as const };
    expect(findDuplicate({ amount: 45_000, source: 'qr', at: at(0) }, [cash])).toBeNull();
    expect(findDuplicate({ amount: 45_000, source: 'email', at: at(0) }, [cash])).toBeNull();
  });

  it('picks the nearest in time', () => {
    const near = { ...base, id: 'near', at: at(60_000) };
    const far = { ...base, id: 'far', at: at(-150_000) };
    expect(findDuplicate({ amount: 45_000, source: 'email', at: at(0) }, [far, near])?.id).toBe(
      'near',
    );
  });

  it('refuses a zero amount or an unreadable time', () => {
    expect(
      findDuplicate({ amount: 0, source: 'email', at: at(0) }, [{ ...base, amount: 0 }]),
    ).toBeNull();
    expect(findDuplicate({ amount: 45_000, source: 'email', at: 'nope' }, [base])).toBeNull();
  });
});

describe('mergedStatus', () => {
  it('is confirmed once either side was', () => {
    expect(mergedStatus('pending', 'kept')).toBe('kept');
    expect(mergedStatus('kept', 'caught')).toBe('kept');
  });
  it('otherwise stays as the first sighting was', () => {
    expect(mergedStatus('pending', 'caught')).toBe('pending');
  });
});

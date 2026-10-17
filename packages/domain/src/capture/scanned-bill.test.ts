import { describe, expect, it } from 'vitest';

import { payCycleOn } from '../plan/pay-cycle';
import type { PayableBill } from './bill-payment';
import { billScanned, billTopicOf, billTopicOfName } from './scanned-bill';

// 25 Sep → 25 Oct: every bill below falls due in October.
const cycle = payCycleOn('2026-10-10', { kind: 'sameDay', day: 25 });

const bill = (over: Partial<PayableBill> & Pick<PayableBill, 'id'>): PayableBill => ({
  name: over.id,
  amount: 500_000,
  dueDay: 10,
  paidCycle: null,
  ...over,
});

const power = bill({ id: 'power', name: 'Điện nước', amount: 800_000 });
const phone = bill({ id: 'phone', name: 'Điện thoại & mạng', amount: 300_000, dueDay: 15 });
const rent = bill({ id: 'rent', name: 'Tiền nhà', amount: 6_000_000, dueDay: 1 });
const spotify = bill({ id: 'spotify', name: 'Spotify', amount: 59_000, dueDay: 12 });
const bills = [power, phone, rent, spotify];

describe('the kind of bill a receipt reads as', () => {
  it('knows the power, phone and rent bills Vietnam prints', () => {
    expect(billTopicOf('TỔNG CÔNG TY ĐIỆN LỰC TP.HCM\nHOÁ ĐƠN TIỀN ĐIỆN')).toBe('power');
    expect(billTopicOf('Công ty Cấp nước Gia Định — Tiền nước tháng 9')).toBe('power');
    expect(billTopicOf('FPT Telecom · Cước Internet tháng 10')).toBe('phone');
    expect(billTopicOf('Thuê bao trả sau 0912…')).toBe('phone');
    expect(billTopicOf('Tiền phòng tháng 10')).toBe('rent');
  });

  it('reads a restaurant bill as no bill', () => {
    expect(billTopicOf('PHIẾU TẠM TÍNH\nMực nướng sa tế\nRau luộc kho quẹt')).toBeNull();
    expect(billTopicOf('Car rental Hertz')).toBeNull();
  });

  it('reads a plan bill’s name, a phone before power', () => {
    expect(billTopicOfName('Điện thoại & mạng')).toBe('phone');
    expect(billTopicOfName('Điện nước')).toBe('power');
    expect(billTopicOfName('Rent')).toBe('rent');
    expect(billTopicOfName('Netflix')).toBeNull();
  });
});

describe('the plan bill a scanned receipt pays', () => {
  const scan = (text: string, amount: number | null, day = '2026-10-08') => ({ text, amount, day });

  it('is the same kind of bill, whatever this month’s amount', () => {
    expect(billScanned(scan('EVN HCMC Tiền điện', 912_345), bills, cycle)?.id).toBe('power');
    expect(billScanned(scan('VNPT cước Internet', 280_000), bills, cycle)?.id).toBe('phone');
  });

  it('is a bill the receipt names', () => {
    expect(billScanned(scan('Spotify Premium', 59_000, '2026-09-30'), bills, cycle)?.id).toBe(
      'spotify',
    );
  });

  it('is a bill of the exact amount only near its due day', () => {
    expect(billScanned(scan('Cửa hàng ABC', 59_000, '2026-10-11'), bills, cycle)?.id).toBe(
      'spotify',
    );
    expect(billScanned(scan('Cửa hàng ABC', 59_000, '2026-10-24'), bills, cycle)).toBeNull();
  });

  it('is never a bill already paid this cycle, nor a restaurant bill', () => {
    const paid = [{ ...power, paidCycle: cycle.start }];
    expect(billScanned(scan('Tiền điện', 900_000), paid, cycle)).toBeNull();
    expect(billScanned(scan('PHIẾU TẠM TÍNH', 2_941_000), bills, cycle)).toBeNull();
  });
});

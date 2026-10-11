import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  likelyCategoriesAt,
  parseVietQR,
  type BankInfo,
  type VietQR,
  type VietQRFailure,
} from '@6pm/domain';

import { useMoney, useMoneyActions, useMoneyStore } from '../../data/money-provider';
import { readWallets } from '../../data/onboarding';
import { haptics } from '../../ui/haptics';
import { useClock } from '../../ui/theme/clock';
import { handOff, type HandoffResult } from './bank-handoff';
import { payeeName, payOptions } from './pay-options';

/** A payment on its way out: saved as pending the moment the bank app is asked to open. */
export interface Payment {
  readonly qr: VietQR;
  readonly payee: string;
  readonly categoryId: string;
  readonly amount: number;
  readonly bank: BankInfo | null;
  readonly spendId: string;
}

export type ScanPhase =
  | { readonly kind: 'camera' }
  | { readonly kind: 'unreadable' }
  | { readonly kind: 'foreign'; readonly failure: VietQRFailure }
  | {
      readonly kind: 'preview';
      readonly qr: VietQR;
      readonly payee: string;
      readonly categoryId: string;
    }
  | { readonly kind: 'handoff'; readonly payment: Payment; readonly result: HandoffResult | null }
  | { readonly kind: 'return'; readonly payment: Payment };

/**
 * Scan to pay, from camera to "Did it go through?". The spend is written as pending before the
 * bank app opens, so a payment survives 6pm being closed while the user is in their bank; the
 * answer on return keeps it, leaves it pending, or deletes it.
 */
export function useScan() {
  const store = useMoneyStore();
  const snap = useMoney();
  const actions = useMoneyActions();
  const { hour } = useClock();
  const [phase, setPhase] = useState<ScanPhase>({ kind: 'camera' });
  const [walletIds, setWalletIds] = useState<readonly string[]>([]);
  // The camera reports the same code many times a second; only the first read counts.
  const reading = useRef(false);

  useEffect(() => {
    readWallets(store)
      .then(setWalletIds)
      .catch(() => undefined);
  }, [store]);

  // Back from the bank app: ask whether it went through.
  useEffect(() => {
    if (phase.kind !== 'handoff') return;
    let left = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') left = true;
      if (state === 'active' && left) setPhase({ kind: 'return', payment: phase.payment });
    });
    return () => sub.remove();
  }, [phase]);

  /** The category a payee files under: what the user taught 6pm, else what is likely now. */
  const categoryFor = async (payee: string) => {
    const rule = await store.tables.rules.get(payee.trim().toLowerCase());
    if (rule && snap.categories.some((c) => c.id === rule.categoryId)) return rule.categoryId;
    const likely = likelyCategoriesAt(hour).map((name) => name.toLowerCase());
    const match = snap.categories.find((c) => likely.includes(c.id));
    return match?.id ?? snap.categories[0]?.id ?? '';
  };

  return {
    phase,
    /** How the scanned code can be paid, from the user's banks as soon as they have loaded. */
    options: phase.kind === 'preview' ? payOptions(phase.qr, walletIds) : null,
    read: (data: string) => {
      if (reading.current) return;
      reading.current = true;
      const result = parseVietQR(data);
      if (result.ok) {
        haptics.tap();
        const payee = payeeName(result);
        void categoryFor(payee).then((categoryId) =>
          setPhase({
            kind: 'preview',
            qr: result,
            payee,
            categoryId,
          }),
        );
      } else {
        haptics.tick();
        setPhase(
          result.reason === 'foreign'
            ? { kind: 'foreign', failure: result }
            : { kind: 'unreadable' },
        );
      }
    },
    retry: () => {
      reading.current = false;
      setPhase({ kind: 'camera' });
    },
    pay: async (
      { qr, payee, categoryId }: Pick<Payment, 'qr' | 'payee' | 'categoryId'>,
      amount: number,
      bank: BankInfo | null,
    ) => {
      const row = await actions.addSpend({
        amount,
        categoryId,
        merchant: payee,
        source: 'qr',
        status: 'pending',
        wallet: bank?.shortName ?? null,
        note: qr.note,
        detail: `${qr.bank?.shortName ?? qr.bin} · ${qr.accountMasked}`,
      });
      const payment: Payment = { qr, payee, categoryId, amount, bank, spendId: row.id };
      setPhase({ kind: 'handoff', payment, result: null });
      const result = await handOff(bank, amount).catch((): HandoffResult => 'manual');
      setPhase((p) => (p.kind === 'handoff' ? { ...p, result } : p));
    },
    /** For when the bank app never took over: the user says they are back. */
    back: () =>
      setPhase((p) => (p.kind === 'handoff' ? { kind: 'return', payment: p.payment } : p)),
    answer: async (payment: Payment, answer: 'paid' | 'later' | 'cancelled') => {
      if (answer === 'paid') await actions.update(payment.spendId, { status: 'kept' });
      if (answer === 'cancelled') await actions.update(payment.spendId, { status: 'deleted' });
    },
  };
}

import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  likelyCategoriesAt,
  parseVietQR,
  type BankInfo,
  type FxRate,
  type VietQR,
  type VietQRFailure,
} from '@6pm/domain';

import type { Capture } from '../../data/money-actions';
import { useMoney, useMoneyActions, useMoneyStore } from '../../data/money-provider';
import { readWallets } from '../../data/onboarding';
import { useHomeCurrency } from '../../money/use-money-format';
import { haptics } from '../../ui/haptics';
import { useClock } from '../../ui/theme/clock';
import { useTravel } from '../travel/travel-provider';
import { handOff, type Handoff } from './bank-handoff';
import { payeeName, payOptions, titleCase } from './pay-options';
import { dongInHome, pricedInHome } from './priced-spend';

/** A payment on its way out: saved as pending the moment the bank app is asked to open. */
export interface Payment {
  readonly qr: VietQR;
  readonly payee: string;
  readonly categoryId: string;
  /** In đồng, as the QR asks and the bank pays it. */
  readonly amount: number;
  readonly bank: BankInfo | null;
  readonly spendId: string;
  /** What saving the pending spend did, so a cancelled payment takes back only that. */
  readonly capture: Capture;
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
  | { readonly kind: 'handoff'; readonly payment: Payment; readonly handoff: Handoff | null }
  | { readonly kind: 'return'; readonly payment: Payment };

/**
 * Scan to pay, from camera to "Did it go through?". The spend is written as pending before the
 * bank app opens, so a payment survives 6pm being closed while the user is in their bank; the
 * answer on return keeps it, leaves it pending, or takes back what the scan saved: the row it
 * made is deleted, and a payment it only joined (the same one seen another way) stays.
 */
export function useScan() {
  const store = useMoneyStore();
  const snap = useMoney();
  const actions = useMoneyActions();
  const { hour } = useClock();
  const home = useHomeCurrency();
  const { dongQuote: quote } = useTravel();
  const [phase, setPhase] = useState<ScanPhase>({ kind: 'camera' });
  const [walletIds, setWalletIds] = useState<readonly string[]>([]);
  // The camera reports the same code many times a second; only the first read counts.
  const reading = useRef(false);
  // Set while an Open tap is saving the pending spend, so a second tap cannot add another.
  const paying = useRef(false);
  // Whether 6pm went to the background during this hand-off; read when it comes back.
  const left = useRef(false);

  useEffect(() => {
    readWallets(store)
      .then(setWalletIds)
      .catch(() => undefined);
  }, [store]);

  // Back from the bank app: ask whether it went through. One listener per hand-off, and the
  // "left" flag lives in a ref so a re-render in between cannot lose it.
  useEffect(() => {
    if (phase.kind !== 'handoff') return;
    left.current = false;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') left.current = true;
      if (state !== 'active' || !left.current) return;
      left.current = false;
      setPhase((p) => (p.kind === 'handoff' ? { kind: 'return', payment: p.payment } : p));
    });
    return () => sub.remove();
  }, [phase.kind]);

  /** The category a payee files under: what the user taught 6pm, else what is likely now. */
  const categoryFor = async (payee: string) => {
    // A rule that cannot be read must not strand the scan: fall through to the likely category.
    const learned = await actions.ruleCategory(payee).catch(() => null);
    if (learned !== null) return learned;
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
    /**
     * Saves the spend as pending, then opens the bank with the đồng the QR asks for. The spend is
     * kept in the home currency, with the đồng paid beside it when home is not đồng. Rejects when
     * the spend could not be saved.
     */
    pay: async (
      { qr, payee, categoryId }: Pick<Payment, 'qr' | 'payee' | 'categoryId'>,
      amount: number,
      bank: BankInfo | null,
    ) => {
      if (paying.current) return;
      paying.current = true;
      try {
        const capture = await actions.captureSpend({
          ...dongInHome(amount, home, quote),
          categoryId,
          merchant: payee,
          source: 'qr',
          status: 'pending',
          wallet: bank?.shortName ?? null,
          note: qr.note,
          detail: `${qr.bank?.shortName ?? qr.bin} · ${qr.accountMasked}`,
        });
        const payment: Payment = {
          qr,
          payee,
          categoryId,
          amount,
          bank,
          spendId: capture.row.id,
          capture,
        };
        setPhase({ kind: 'handoff', payment, handoff: null });
        const handoff = await handOff(bank, qr, amount).catch((): Handoff => ({
          result: 'manual',
          qrSaved: false,
        }));
        setPhase((p) => (p.kind === 'handoff' ? { ...p, handoff } : p));
      } finally {
        paying.current = false;
      }
    },
    /**
     * Abroad, a foreign QR paid in the bank app: kept at once in the home currency, with the QR's
     * amount in its own currency and the rate beside it (waiting for a rate when home has none
     * yet). Rejects when the QR has no amount or it cannot be saved.
     */
    keepForeign: async (failure: VietQRFailure, rate: FxRate, fallbackPayee: string) => {
      // `rate` is the alert's đồng quote for the QR's currency.
      const local = (code: string) => quote(code) ?? (code === rate.currency ? rate.rate : null);
      const priced =
        failure.amount === undefined
          ? null
          : pricedInHome(rate.currency, failure.amount, home, local);
      if (priced === null) {
        throw new Error('The QR has no amount that can be priced');
      }
      const named = failure.merchantName?.trim();
      const payee = named ? titleCase(named) : fallbackPayee;
      await actions.addSpend({
        ...priced,
        categoryId: await categoryFor(payee),
        merchant: payee,
        source: 'qr',
        status: 'kept',
        wallet: null,
      });
    },
    /** For when the bank app never took over: the user says they are back. */
    back: () =>
      setPhase((p) => (p.kind === 'handoff' ? { kind: 'return', payment: p.payment } : p)),
    answer: async (payment: Payment, answer: 'paid' | 'later' | 'cancelled') => {
      if (answer === 'paid') await actions.update(payment.spendId, { status: 'kept' });
      if (answer === 'cancelled') await actions.withdrawCapture(payment.capture);
    },
  };
}

import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  billScanned,
  billTopicOf,
  parts as dateParts,
  lookedReceiptCard,
  receiptReadResponseSchema,
  scannedReceiptCard,
  scannedReceiptItem,
  type ScannedCard,
  type ScannedEdits,
  type SurfaceContext,
} from '@6pm/domain';

import type { ScannedReceipt } from '../../../modules/scan-camera';
import { useBillPayments } from '../../data/bill-payments';
import { saveInboxSpend } from '../../data/inbox-import';
import { useMoneyActions, useMoneyStore } from '../../data/money-provider';
import { usePlanActions } from '../../data/plan-actions';
import { useI18n } from '../../i18n/i18n';
import { phoneNumberStyle } from '../../money/device-money';
import { useHomeCurrency } from '../../money/use-money-format';
import { useApi } from '../api/native-api';
import { createEnrichShared } from '../capture/enrich-shared';
import { BILL_CARDS } from '../onboarding/bill-deck';
import { requireServerAi } from '../privacy/ai-mode';
import { contextStrings, hostOf, surfaceContext } from '../surfaces/surface-context';
import { useTravel } from '../travel/travel-provider';

/** The server's closer look gets as long as Share to 6pm gives it. */
const LOOK_TIMEOUT_MS = 20_000;

const host = hostOf(Constants.expoConfig?.extra?.['apiBase']) ?? '';

/** A bill as its chip shows it. */
export interface BillFace {
  readonly name: string;
  readonly icon: string;
  readonly hue: number;
}

/** The plan bill a receipt pays, or the bill it reads as when the plan has none of its kind. */
export interface ReceiptBill {
  readonly pays: (BillFace & { readonly id: string }) | null;
  readonly add: BillFace | null;
}

/** What Save does about bills: mark the matched bill paid, add the bill it reads as, or neither. */
export type BillChoice = 'pays' | 'add' | null;

export type ReceiptPhase =
  | { readonly kind: 'idle' }
  /** The photo is taken and being cut out and read on this iPhone. */
  | { readonly kind: 'reading' }
  | {
      readonly kind: 'card';
      readonly receipt: ScannedReceipt;
      readonly card: ScannedCard;
      readonly bill: ReceiptBill;
      readonly context: SurfaceContext;
      /** The server is taking a closer look at the photo. */
      readonly looking: boolean;
    }
  /** The photo could not be taken or read at all. */
  | { readonly kind: 'failed' };

export type SaveOutcome = 'saved' | 'already' | 'empty';

/**
 * A receipt from Scan, read as Share to 6pm reads one: Vision's lines on this iPhone make the
 * card; when it is unsure of the total or the currency, the photo goes once for a closer look
 * (never in on-device mode); Save writes the same inbox item and saves it as the inbox does, with
 * the duplicate merge.
 */
export function useReceiptScan() {
  const store = useMoneyStore();
  const actions = useMoneyActions();
  const plan = usePlanActions();
  const billPayments = useBillPayments();
  const api = useApi();
  const db = useSQLiteContext();
  const { t, language } = useI18n();
  const home = useHomeCurrency();
  const { trip, rates } = useTravel();
  const tripCurrency = trip?.currency.code ?? null;
  const [phase, setPhase] = useState<ReceiptPhase>({ kind: 'idle' });
  // The receipt on the card now: a closer look that comes back after a retake is dropped.
  const current = useRef<ScannedReceipt | null>(null);

  const enrich = useMemo(
    () =>
      createEnrichShared({
        request: (request) => api.request(request),
        settings: db,
        ruleCategory: (merchant) => actions.ruleCategory(merchant),
        categories: () => store.getSnapshot().categories,
      }),
    [api, db, actions, store],
  );

  const contextNow = useCallback(
    async (): Promise<SurfaceContext> =>
      surfaceContext({
        money: store.getSnapshot(),
        rules: await store.tables.rules.all(),
        language,
        host,
        strings: contextStrings(t),
        tripCurrency,
        rates: rates?.rates.rates ?? [],
        currency: home.code,
        numberStyle: phoneNumberStyle(),
      }),
    [store, language, t, tripCurrency, rates, home.code],
  );

  /** A paper bill: the plan bill it pays, else the kind of bill it is. */
  const billOf = useCallback(
    (receipt: ScannedReceipt, card: ScannedCard): ReceiptBill => {
      const { bills, cycle, today } = store.getSnapshot();
      const text = [card.payee, ...receipt.lines.map((line) => line.text)].join('\n');
      const pays = billScanned({ amount: card.amount, text, day: today }, bills, cycle);
      if (pays)
        return {
          pays: { id: pays.id, name: pays.name, icon: pays.icon, hue: pays.hue },
          add: null,
        };
      const topic = billTopicOf(text);
      const deck = BILL_CARDS.find((c) => c.kind === 'ask' && c.key === topic);
      const add =
        topic !== null && deck
          ? { name: t(`onboarding.bills.${topic}.name`), icon: deck.icon, hue: deck.hue }
          : null;
      return { pays: null, add };
    },
    [store, t],
  );

  const lookCloser = useCallback(
    async (receipt: ScannedReceipt, photo: string, context: SurfaceContext) => {
      const settle = (card: ScannedCard | null) =>
        setPhase((p) =>
          p.kind === 'card' && p.receipt === receipt
            ? card
              ? { ...p, card, bill: billOf(receipt, card), looking: false }
              : { ...p, looking: false }
            : p,
        );
      try {
        const answer = await api.request({
          method: 'POST',
          path: '/v1/receipts/read',
          body: {
            image: photo,
            language,
            currencyHint: tripCurrency,
            ...(home.code === 'VND' ? {} : { homeCurrency: home.code }),
          },
          schema: receiptReadResponseSchema,
          timeoutMs: LOOK_TIMEOUT_MS,
        });
        settle(lookedReceiptCard(receipt.lines, answer, context, new Date()));
      } catch {
        // Offline, slow or refused: the phone's own reading stays.
        settle(null);
      }
    },
    [api, language, tripCurrency, home.code, billOf],
  );

  /** Makes the card for a receipt read on this iPhone, and asks for a closer look if unsure. */
  const show = useCallback(
    async (receipt: ScannedReceipt) => {
      current.current = receipt;
      const context = await contextNow();
      const card = scannedReceiptCard(receipt.lines, context, new Date());
      let allowed = receipt.photo !== null;
      try {
        requireServerAi(db, 'receipt-read');
      } catch {
        allowed = false;
      }
      const looking = card.needsCheck && allowed;
      setPhase({ kind: 'card', receipt, card, bill: billOf(receipt, card), context, looking });
      if (looking && receipt.photo !== null) void lookCloser(receipt, receipt.photo, context);
    },
    [contextNow, db, lookCloser, billOf],
  );

  /** Takes the photo with `capture` and reads it. */
  const take = useCallback(
    async (capture: () => Promise<ScannedReceipt>) => {
      setPhase({ kind: 'reading' });
      try {
        await show(await capture());
      } catch {
        setPhase({ kind: 'failed' });
      }
    },
    [show],
  );

  const retake = useCallback(() => {
    current.current = null;
    setPhase({ kind: 'idle' });
  }, []);

  /**
   * Saves the card with the user's edits; says when there was nothing to save or it was there.
   * A paper bill then pays its plan bill, or is added to the plan as this cycle's, paid.
   */
  const save = useCallback(
    async (edits: ScannedEdits, bill: BillChoice): Promise<SaveOutcome> => {
      if (phase.kind !== 'card') return 'empty';
      const item = scannedReceiptItem(phase.card, edits, randomUUID(), phase.context);
      if (item === null) return 'empty';
      const spendId = await saveInboxSpend({ store, actions, enrich, home: home.code }, item);
      if (spendId === null) return 'already';
      const { pays, add } = phase.bill;
      if (bill === 'pays' && pays !== null) await billPayments.setPaysBill(spendId, pays.id);
      if (bill === 'add' && add !== null && item.amount !== null) {
        const billId = await plan.addBill({
          ...add,
          amount: item.amount,
          dueDay: dateParts(store.getSnapshot().today).day,
        });
        await billPayments.setPaysBill(spendId, billId);
      }
      return 'saved';
    },
    [phase, store, actions, enrich, home.code, billPayments, plan],
  );

  return { phase, take, show, retake, save };
}

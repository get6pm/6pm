import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  lookedReceiptCard,
  receiptReadResponseSchema,
  scannedReceiptCard,
  scannedReceiptItem,
  type ScannedCard,
  type ScannedEdits,
  type SurfaceContext,
} from '@6pm/domain';

import type { ScannedReceipt } from '../../../modules/scan-camera';
import { saveInboxSpend } from '../../data/inbox-import';
import { useMoneyActions, useMoneyStore } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { phoneNumberStyle } from '../../money/device-money';
import { useHomeCurrency } from '../../money/use-money-format';
import { useApi } from '../api/native-api';
import { createEnrichShared } from '../capture/enrich-shared';
import { requireServerAi } from '../privacy/ai-mode';
import { contextStrings, hostOf, surfaceContext } from '../surfaces/surface-context';
import { useTravel } from '../travel/travel-provider';

/** The server's closer look gets as long as Share to 6pm gives it. */
const LOOK_TIMEOUT_MS = 20_000;

const host = hostOf(Constants.expoConfig?.extra?.['apiBase']) ?? '';

export type ReceiptPhase =
  | { readonly kind: 'idle' }
  /** The photo is taken and being cut out and read on this iPhone. */
  | { readonly kind: 'reading' }
  | {
      readonly kind: 'card';
      readonly receipt: ScannedReceipt;
      readonly card: ScannedCard;
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

  const lookCloser = useCallback(
    async (receipt: ScannedReceipt, photo: string, context: SurfaceContext) => {
      const settle = (card: ScannedCard | null) =>
        setPhase((p) =>
          p.kind === 'card' && p.receipt === receipt
            ? { ...p, card: card ?? p.card, looking: false }
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
    [api, language, tripCurrency, home.code],
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
      setPhase({ kind: 'card', receipt, card, context, looking });
      if (looking && receipt.photo !== null) void lookCloser(receipt, receipt.photo, context);
    },
    [contextNow, db, lookCloser],
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

  /** Saves the card with the user's edits; says when there was nothing to save or it was there. */
  const save = useCallback(
    async (edits: ScannedEdits): Promise<SaveOutcome> => {
      if (phase.kind !== 'card') return 'empty';
      const item = scannedReceiptItem(phase.card, edits, randomUUID(), phase.context);
      if (item === null) return 'empty';
      const saved = await saveInboxSpend({ store, actions, enrich, home: home.code }, item);
      return saved ? 'saved' : 'already';
    },
    [phase, store, actions, enrich, home.code],
  );

  return { phase, take, show, retake, save };
}

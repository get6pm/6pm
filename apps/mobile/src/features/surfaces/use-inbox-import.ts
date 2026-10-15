import * as Sentry from '@sentry/react-native';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { fxRatesResponseSchema } from '@6pm/domain';

import { surfaces } from '../../../modules/surfaces';
import { priceWaitingForeign } from '../../data/foreign-pricing';
import { importInbox } from '../../data/inbox-import';
import { useMoneyActions, useMoneyStore } from '../../data/money-provider';
import { useApi } from '../api/native-api';
import { createEnrichShared } from '../capture/enrich-shared';
import { FX_CACHE_KEY, parseFxCache, rateFor } from '../travel/trip';

/**
 * Brings in what the share extension, the shortcuts and the Live Activity left in the App Group:
 * once the money store has loaded, and every time the app comes back to the foreground. Then
 * prices any captured foreign amount still waiting for a rate, at the rate of the day it was
 * paid. One run at a time; a return to the foreground during one waits for it.
 */
export function useInboxImport() {
  const store = useMoneyStore();
  const actions = useMoneyActions();
  const api = useApi();
  const running = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    const native = surfaces;
    if (!native) return;
    const enrich = createEnrichShared({
      request: (request) => api.request(request),
      ruleCategory: (merchant) => actions.ruleCategory(merchant),
      categories: () => store.getSnapshot().categories,
    });
    const price = async () => {
      const [kept] = await store.db.getAllAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        [FX_CACHE_KEY],
      );
      const cache = parseFxCache(kept?.value);
      return priceWaitingForeign({
        store,
        actions,
        lastRate: (currency) => rateFor(cache, currency)?.rate ?? null,
        ratesOn: async (day) =>
          (await api.request({ path: `/v1/fx?on=${day}`, schema: fxRatesResponseSchema })).rates,
      });
    };
    const run = () => {
      running.current = running.current
        .then(() =>
          importInbox({
            store,
            actions,
            inbox: native,
            enrich,
            report: (message) => Sentry.captureMessage(message),
          }),
        )
        .catch((error: unknown) => Sentry.captureException(error))
        .then(price)
        .catch((error: unknown) => Sentry.captureException(error));
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [store, actions, api]);
}

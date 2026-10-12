import * as Sentry from '@sentry/react-native';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import {
  ackEmailCapturesResponseSchema,
  EMAIL_CAPTURES_PAGE,
  emailCapturesResponseSchema,
} from '@6pm/domain';

import { importEmailCaptures, type EmailCaptureSource } from '../../data/email-import';
import { useMoneyActions, useMoneyStore } from '../../data/money-provider';
import { ApiRequestError } from '../api/api-error';
import { useApi } from '../api/native-api';
import { storedHandle } from './receipt-address';

/** Pages fetched in one go; anything beyond waits for the next return to the app. */
const MAX_PAGES = 4;

/**
 * Brings in the receipts that arrived by email: once the money store has loaded, and every time
 * the app comes back to the foreground, but only on a phone that has an address. Offline nothing
 * happens and nothing is reported. One import runs at a time.
 */
export function useEmailImport() {
  const store = useMoneyStore();
  const actions = useMoneyActions();
  const api = useApi();
  const running = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    const source: EmailCaptureSource = {
      fetch: async () =>
        (await api.request({ path: '/v1/email/captures', schema: emailCapturesResponseSchema }))
          .captures,
      ack: async (ids) => {
        await api.request({
          method: 'POST',
          path: '/v1/email/captures/ack',
          body: { ids: [...ids] },
          schema: ackEmailCapturesResponseSchema,
        });
      },
    };
    const importAll = async () => {
      if ((await storedHandle(store.db)) === null) return;
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const { acknowledged } = await importEmailCaptures({ store, actions, source });
        if (acknowledged < EMAIL_CAPTURES_PAGE) return;
      }
    };
    const run = () => {
      running.current = running.current.then(importAll).catch((error: unknown) => {
        if (error instanceof ApiRequestError && error.retryable) return;
        Sentry.captureException(error);
      });
    };
    run();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [store, actions, api]);
}

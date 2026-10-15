import { useEffect, useSyncExternalStore } from 'react';

import {
  emailHandleResponseSchema,
  emailHandlePattern,
  hostOfApiBase,
  receiptEmailAddress,
} from '@6pm/domain';

import { useMoneyStore } from '../../data/money-provider';
import type { SqlDatabase } from '../../data/table';
import type { ApiClient } from '../api/api-client';
import { apiBase, useApi } from '../api/native-api';
import { useAiMode } from '../privacy/use-ai-mode';

/**
 * This phone's receipt email handle, kept in the settings table once the server has given it, so
 * the address shows offline and the import knows there is something to fetch. It is not in the
 * backup: a restored phone is a new device and gets its own address.
 */
export const RECEIPT_EMAIL_HANDLE_KEY = 'receiptEmail.handle';

let current: string | null = null;
let asking: Promise<string | null> | null = null;
const listeners = new Set<() => void>();

function publish(handle: string) {
  if (handle === current) return;
  current = handle;
  for (const listener of listeners) listener();
}

/** The handle this phone keeps, or null before it has asked for one. */
export async function storedHandle(db: SqlDatabase): Promise<string | null> {
  const rows = await db.getAllAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    RECEIPT_EMAIL_HANDLE_KEY,
  ]);
  const value = rows[0]?.value;
  return value !== undefined && emailHandlePattern.test(value) ? value : null;
}

/**
 * The handle, asking the server the first time. Offline it resolves to null and the next call
 * asks again; concurrent callers share one request.
 */
export function ensureHandle(db: SqlDatabase, api: ApiClient): Promise<string | null> {
  asking ??= (async () => {
    const kept = await storedHandle(db);
    if (kept !== null) {
      publish(kept);
      return kept;
    }
    const { handle } = await api.request({
      path: '/v1/email/handle',
      schema: emailHandleResponseSchema,
    });
    await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      RECEIPT_EMAIL_HANDLE_KEY,
      handle,
    ]);
    publish(handle);
    return handle;
  })()
    .catch(() => null)
    .finally(() => {
      asking = null;
    });
  return asking;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => current;

/**
 * This phone's forwarding address (`<handle>@<host>`, the host of this build's API), or null
 * until the server has given a handle. Showing it is what asks for one: a phone that never opens
 * Settings never registers an address. In on-device mode there is no address and nothing is asked.
 */
export function useReceiptAddress(): string | null {
  const store = useMoneyStore();
  const api = useApi();
  const mode = useAiMode();
  const handle = useSyncExternalStore(subscribe, snapshot);
  useEffect(() => {
    if (mode === 'server') void ensureHandle(store.db, api);
  }, [store, api, mode]);
  const base = apiBase();
  const host = base === null ? null : hostOfApiBase(base);
  if (mode === 'device') return null;
  return handle !== null && host !== null ? receiptEmailAddress(handle, host) : null;
}

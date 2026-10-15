import { useCallback, useSyncExternalStore } from 'react';

import {
  dismissForwardingCheckResponseSchema,
  forwardingCheckResponseSchema,
  type ForwardingCheck,
} from '@6pm/domain';

import type { ApiClient } from '../api/api-client';
import { useApi } from '../api/native-api';

/**
 * The forwarding check waiting on the server: a mail service (Gmail) asked to forward to this
 * phone's address and sent it a code and a confirm link. Held in memory only; the server keeps it
 * until it is dismissed or a week has passed, so it is fetched again on every return to the app.
 */
let current: ForwardingCheck | null = null;
/** Dismissed here, so a fetch that raced the dismissal never brings it back. */
const dismissed = new Set<string>();
const listeners = new Set<() => void>();

function publish(check: ForwardingCheck | null) {
  const next = check !== null && dismissed.has(check.id) ? null : check;
  if (next?.id === current?.id && next?.code === current?.code) return;
  current = next;
  for (const listener of listeners) listener();
}

/** Fetches the waiting check. Rejects when the server cannot be reached; what was shown stays. */
export async function refreshForwardingCheck(api: ApiClient): Promise<ForwardingCheck | null> {
  const { check } = await api.request({
    path: '/v1/email/forwarding-check',
    schema: forwardingCheckResponseSchema,
  });
  publish(check);
  return current;
}

/** Hides the check now and tells the server; offline, it is asked again on the next dismissal. */
export function dismissForwardingCheck(api: ApiClient, id: string): Promise<void> {
  dismissed.add(id);
  if (current?.id === id) publish(null);
  return api
    .request({
      method: 'POST',
      path: '/v1/email/forwarding-check/dismiss',
      body: { id },
      schema: dismissForwardingCheckResponseSchema,
    })
    .then(() => undefined)
    .catch(() => undefined);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => current;

export interface ForwardingCheckState {
  /** The waiting check, or null when there is none. */
  readonly check: ForwardingCheck | null;
  /** The person is done with it: it disappears here and is deleted on the server. */
  readonly dismiss: () => void;
}

/**
 * The forwarding check waiting for this phone. It is fetched with the email import (on launch and
 * on every return to the foreground), so this only reads what was fetched.
 */
export function useForwardingCheck(): ForwardingCheckState {
  const api = useApi();
  const check = useSyncExternalStore(subscribe, snapshot);
  const dismiss = useCallback(() => {
    if (check !== null) void dismissForwardingCheck(api, check.id);
  }, [api, check]);
  return { check, dismiss };
}

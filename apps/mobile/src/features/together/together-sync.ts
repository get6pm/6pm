import type { TogetherState } from '@6pm/domain';

import type { TogetherApi } from './together-api';
import {
  endedByPartner,
  ownContributions,
  SIGNED_OUT,
  viewOf,
  type TogetherOp,
} from './together-state';

export type OwnContribution = ReturnType<typeof ownContributions>[number];

/** The phone's own record of what its person put in: it outlives the shared copy. */
export interface TogetherHistory {
  /** Writes the contributions not yet kept; one already kept is left as it is. */
  keep(entries: readonly OwnContribution[]): Promise<void>;
  /** Forgets one the person took back. */
  forget(id: string): Promise<void>;
}

export interface TogetherSyncDeps {
  readonly api: TogetherApi;
  /** Keeps the last answer for the next launch and for offline use. */
  readonly persist: (state: TogetherState) => Promise<void>;
  readonly history: TogetherHistory;
  /** The partner ended Budget together since the last answer. */
  readonly onEnded: () => void;
  /** Something kept on the phone could not be written; never stops the sync. */
  readonly onLocalError: (error: unknown) => void;
}

export interface TogetherSnapshot {
  /** The shared copy with writes in flight laid over it. */
  readonly state: TogetherState;
  /** An answer, or a kept one, has been read: before that the card cannot say anything yet. */
  readonly known: boolean;
  /** The last fetch got no answer: what shows is the last known state. */
  readonly offline: boolean;
  readonly refreshing: boolean;
}

export type RunResult = { readonly ok: true } | { readonly ok: false; readonly error: unknown };

export interface TogetherSync {
  readonly subscribe: (listener: () => void) => () => void;
  readonly getSnapshot: () => TogetherSnapshot;
  /** Asks the server again; concurrent calls share one request. */
  readonly refresh: () => Promise<void>;
  /** Shows a write at once, sends it, and takes it back if the server did not take it. */
  readonly run: (op: TogetherOp) => Promise<RunResult>;
  /** Takes an answer the server gave elsewhere (sign-in, an accepted invite). */
  readonly adopt: (next: TogetherState) => void;
}

/**
 * Keeps the shared copy in step with the server. Nothing is queued: a write that does not get
 * through is taken back off the screen and reported, so the person always sees what is really
 * shared. Offline, the last known copy stays on show.
 */
export function createTogetherSync(
  deps: TogetherSyncDeps,
  initial: TogetherState | null,
): TogetherSync {
  const listeners = new Set<() => void>();
  let base: TogetherState = initial ?? SIGNED_OUT;
  let known = initial !== null;
  let offline = false;
  let pending: { readonly seq: number; readonly op: TogetherOp }[] = [];
  let seq = 0;
  let fetching: Promise<void> | null = null;
  /** Counts answers to writes: a fetch sent before one of them answered is older than it. */
  let written = 0;
  let snapshot = make();

  function make(): TogetherSnapshot {
    return {
      state: viewOf(
        base,
        pending.map((p) => p.op),
      ),
      known,
      offline,
      refreshing: fetching !== null,
    };
  }

  function publish() {
    snapshot = make();
    for (const listener of listeners) listener();
  }

  function adopt(next: TogetherState) {
    const before = base;
    base = next;
    known = true;
    offline = false;
    if (endedByPartner(before, next)) deps.onEnded();
    deps.persist(next).catch(deps.onLocalError);
    deps.history.keep(ownContributions(next)).catch(deps.onLocalError);
    publish();
  }

  function refresh(): Promise<void> {
    const since = written;
    fetching ??= deps.api.fetchState().then(
      (next) => {
        fetching = null;
        if (written === since) adopt(next);
        else publish();
      },
      () => {
        fetching = null;
        offline = true;
        publish();
      },
    );
    publish();
    return fetching;
  }

  async function run(op: TogetherOp): Promise<RunResult> {
    const entry = { seq: ++seq, op };
    pending = [...pending, entry];
    publish();
    try {
      const next = await deps.api.send(op);
      pending = pending.filter((p) => p.seq !== entry.seq);
      written += 1;
      adopt(next);
      if (op.kind === 'removeContribution') {
        await deps.history.forget(op.id).catch(deps.onLocalError);
      }
      return { ok: true };
    } catch (error) {
      pending = pending.filter((p) => p.seq !== entry.seq);
      publish();
      // The server may know something this phone does not (a pot the partner deleted).
      void refresh();
      return { ok: false, error };
    }
  }

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    refresh,
    run,
    adopt: (next) => {
      written += 1;
      adopt(next);
    },
  };
}

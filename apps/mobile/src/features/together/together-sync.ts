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
  /**
   * Brings the record in line with the server's copy: the person's contributions not yet kept are
   * written, and a kept one in a pot that still exists but that the server no longer lists (taken
   * back here with a lost answer, or on another device) is dropped. Pots that are gone, and
   * everything after leaving (`livePotIds` empty), keep their history.
   */
  readonly reconcile: (
    entries: readonly OwnContribution[],
    livePotIds: readonly string[],
  ) => Promise<void>;
}

export interface TogetherSyncDeps {
  readonly api: TogetherApi;
  /** Keeps the last answer for the next launch and for offline use. */
  readonly persist: (state: TogetherState) => Promise<void>;
  readonly history: TogetherHistory;
  /** A fetch found the partner ended Budget together since the last answer. */
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

interface Entry {
  readonly seq: number;
  readonly op: TogetherOp;
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
  let pending: Entry[] = [];
  /**
   * Writes the server took while another was still in flight. Answers to overlapping writes can
   * arrive in any order, so one may lack a write the server took just before it: these stay laid
   * over the copy until a fetch made after all of them have answered is adopted.
   */
  let settled: Entry[] = [];
  let seq = 0;
  /** The newest write whose answer is the copy: an answer to an earlier one is never adopted. */
  let answered = 0;
  let fetching: Promise<void> | null = null;
  /** Counts answers to writes: a fetch sent before one of them answered is older than it. */
  let written = 0;
  let snapshot = make();

  function make(): TogetherSnapshot {
    return {
      state: viewOf(
        base,
        [...settled, ...pending].sort((a, b) => a.seq - b.seq).map((p) => p.op),
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

  function adopt(next: TogetherState, fetched = false) {
    const before = base;
    base = next;
    known = true;
    offline = false;
    if (fetched) settled = [];
    // Only a fetch can bring news from the other side; this phone's own leave is not news.
    if (fetched && endedByPartner(before, next)) deps.onEnded();
    // What the server has taken, including writes whose answers came back out of order.
    const confirmed = viewOf(
      next,
      settled.map((p) => p.op),
    );
    deps.persist(confirmed).catch(deps.onLocalError);
    deps.history
      .reconcile(ownContributions(confirmed), confirmed.pair?.pots.map((p) => p.id) ?? [])
      .catch(deps.onLocalError);
    publish();
  }

  function refresh(): Promise<void> {
    const since = written;
    fetching ??= deps.api.fetchState().then(
      (next) => {
        fetching = null;
        if (written === since) adopt(next, true);
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
    const entry: Entry = { seq: ++seq, op };
    pending = [...pending, entry];
    publish();
    let next: TogetherState;
    try {
      next = await deps.api.send(op);
    } catch (error) {
      pending = pending.filter((p) => p.seq !== entry.seq);
      publish();
      // The server may know something this phone does not (a pot the partner deleted).
      void refresh();
      return { ok: false, error };
    }
    pending = pending.filter((p) => p.seq !== entry.seq);
    written += 1;
    if (pending.length === 0 && settled.length === 0 && entry.seq > answered) {
      answered = entry.seq;
      adopt(next);
      return { ok: true };
    }
    settled = [...settled, entry];
    if (entry.seq > answered) {
      answered = entry.seq;
      adopt(next);
    } else {
      publish();
    }
    // The writes overlapped: once all have answered, one fetch says what the server ended with.
    if (pending.length === 0) void refresh();
    return { ok: true };
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

import { describe, expect, it, jest } from '@jest/globals';

import type { TogetherState } from '@6pm/domain';

import type { TogetherApi } from './together-api';
import { applyOp, type TogetherOp } from './together-state';
import { createTogetherSync, type OwnContribution } from './together-sync';

const AN = { id: 'an', name: 'An' };
const BINH = { id: 'binh', name: 'Bình' };
const POT = '11111111-1111-4111-8111-111111111111';

const START: TogetherState = {
  me: AN,
  pair: {
    id: 'pair',
    members: [AN, BINH],
    pots: [
      {
        id: POT,
        name: 'Đà Lạt',
        icon: 'flight',
        hue: 85,
        goal: 3_000_000,
        neededBy: '2026-12',
        currency: 'VND',
        createdBy: 'an',
        createdAt: '2026-10-13T00:00:00.000Z',
        contributions: [],
      },
    ],
  },
};

const add = (id: string, amount: number): TogetherOp => ({
  kind: 'addContribution',
  id,
  potId: POT,
  amount,
  addedAt: '2026-10-13T02:00:00.000Z',
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * A server that takes writes in the order the test says and answers each with the copy as it
 * stood right after taking it, sent whenever the test chooses.
 */
function setup() {
  let current = START;
  const answers = new Map<string, (state: TogetherState) => void>();
  const taken = new Map<string, TogetherState>();
  const fetchState = jest.fn(() => Promise.resolve(current));
  const api = {
    fetchState,
    send: (op: TogetherOp) => new Promise<TogetherState>((resolve) => answers.set(op.id, resolve)),
  } as unknown as TogetherApi;
  const kept = new Map<string, OwnContribution>();
  const sync = createTogetherSync(
    {
      api,
      persist: () => Promise.resolve(),
      // The same rule as the phone's table: add what is missing, drop what a live pot lost.
      history: {
        reconcile: (entries, livePotIds) => {
          for (const e of entries) if (!kept.has(e.id)) kept.set(e.id, e);
          const own = new Set(entries.map((e) => e.id));
          for (const [id, e] of kept) {
            if (livePotIds.includes(e.potId) && !own.has(id)) kept.delete(id);
          }
          return Promise.resolve();
        },
      },
      onEnded: () => undefined,
      onLocalError: () => undefined,
    },
    START,
  );
  return {
    sync,
    fetchState,
    keptIds: () => [...kept.keys()].sort(),
    shown: () => sync.getSnapshot().state.pair?.pots[0]?.contributions.map((c) => c.id),
    /** The server takes the write now; its answer is sent later. */
    take: (op: TogetherOp) => {
      current = applyOp(current, op);
      taken.set(op.id, current);
    },
    answer: (id: string) => answers.get(id)?.(taken.get(id) ?? START),
  };
}

describe('overlapping writes', () => {
  it('never let an older answer arriving last undo a newer contribution', async () => {
    const t = setup();
    const first = t.sync.run(add('c1', 100_000));
    const second = t.sync.run(add('c2', 50_000));
    t.take(add('c1', 100_000));
    t.take(add('c2', 50_000));
    t.answer('c2');
    await second;
    t.answer('c1');
    await first;
    expect(t.shown()).toEqual(['c1', 'c2']);
    expect(t.keptIds()).toEqual(['c1', 'c2']);

    await flush();
    expect(t.fetchState).toHaveBeenCalledTimes(1);
    expect(t.shown()).toEqual(['c1', 'c2']);
    expect(t.keptIds()).toEqual(['c1', 'c2']);
  });

  it('keep a contribution the newest answer lacks, then settle on one fetch', async () => {
    const t = setup();
    const first = t.sync.run(add('c1', 100_000));
    const second = t.sync.run(add('c2', 50_000));
    // The server takes the second write first, so the answer to it lacks the first.
    t.take(add('c2', 50_000));
    t.take(add('c1', 100_000));
    t.answer('c1');
    await first;
    t.answer('c2');
    await second;
    expect(t.shown()).toEqual(['c2', 'c1']);
    expect(t.keptIds()).toEqual(['c1', 'c2']);

    await flush();
    expect(t.fetchState).toHaveBeenCalledTimes(1);
    expect(t.shown()).toEqual(['c2', 'c1']);
    expect(t.keptIds()).toEqual(['c1', 'c2']);
  });

  it('ask nothing more after a write that did not overlap', async () => {
    const t = setup();
    const only = t.sync.run(add('c1', 100_000));
    t.take(add('c1', 100_000));
    t.answer('c1');
    await only;
    await flush();
    expect(t.shown()).toEqual(['c1']);
    expect(t.fetchState).not.toHaveBeenCalled();
  });
});

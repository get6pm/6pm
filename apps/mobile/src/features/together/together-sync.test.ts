import { describe, expect, it, jest } from '@jest/globals';

import type { SharedPotFields, TogetherState } from '@6pm/domain';

import { ApiRequestError } from '../api/api-error';
import { stripAppPrefix } from '../links/strip-app-prefix';
import type { TogetherApi } from './together-api';
import {
  applyOp,
  endedByPartner,
  inviteUrl,
  ownContributions,
  parseTogetherCache,
  type TogetherOp,
} from './together-state';
import { createTogetherSync, type OwnContribution } from './together-sync';

const AN = { id: 'an', name: 'An' };
const BINH = { id: 'binh', name: 'Bình' };
const POT = '11111111-1111-4111-8111-111111111111';
const fields: SharedPotFields = {
  name: 'Đà Lạt',
  icon: 'flight',
  hue: 85,
  goal: 3_000_000,
  neededBy: '2026-12',
};

const paired = (contributions: { id: string; memberId: string; amount: number }[] = []) =>
  ({
    me: AN,
    pair: {
      id: 'pair',
      members: [AN, BINH],
      pots: [
        {
          ...fields,
          id: POT,
          createdBy: 'an',
          createdAt: '2026-10-13T00:00:00.000Z',
          contributions: contributions.map((c) => ({ ...c, addedAt: '2026-10-13T01:00:00.000Z' })),
        },
      ],
    },
  }) satisfies TogetherState;

const add = (id: string, amount: number): TogetherOp => ({
  kind: 'addContribution',
  id,
  potId: POT,
  amount,
  addedAt: '2026-10-13T02:00:00.000Z',
});

/** A server stand-in whose answers the test releases one at a time. */
function server(initial: TogetherState) {
  let current = initial;
  const waiting: { op: TogetherOp; settle: (fail?: Error) => void }[] = [];
  const api: TogetherApi = {
    fetchState: jest.fn(() => Promise.resolve(current)),
    send: (op) =>
      new Promise<TogetherState>((resolve, reject) => {
        waiting.push({
          op,
          settle: (fail) => {
            if (fail !== undefined) return reject(fail);
            current = applyOp(current, op);
            resolve(current);
          },
        });
      }),
    createNonce: () => Promise.reject(new Error('unused')),
    signIn: () => Promise.reject(new Error('unused')),
    createInvite: () => Promise.reject(new Error('unused')),
    acceptInvite: () => Promise.reject(new Error('unused')),
    leave: () => Promise.resolve(),
    deleteAccount: () => Promise.resolve(),
  };
  return {
    api,
    waiting,
    set: (next: TogetherState) => (current = next),
  };
}

function setup(initial: TogetherState | null, remote: TogetherState = initial ?? paired()) {
  const s = server(remote);
  const kept = new Map<string, OwnContribution>();
  const persisted: TogetherState[] = [];
  const onEnded = jest.fn();
  const sync = createTogetherSync(
    {
      api: s.api,
      persist: (state) => {
        persisted.push(state);
        return Promise.resolve();
      },
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
      onEnded,
      onLocalError: () => undefined,
    },
    initial,
  );
  return { sync, s, kept, persisted, onEnded };
}

const potOf = (state: TogetherState) => state.pair?.pots[0];
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('writes', () => {
  it('show at once and stay once the server takes them, kept in the history', async () => {
    const { sync, s, kept } = setup(paired());
    const done = sync.run(add('c1', 100_000));
    expect(potOf(sync.getSnapshot().state)?.contributions.map((c) => c.amount)).toEqual([100_000]);
    s.waiting[0]?.settle();
    expect(await done).toEqual({ ok: true });
    expect(potOf(sync.getSnapshot().state)?.contributions).toHaveLength(1);
    expect([...kept.keys()]).toEqual(['c1']);
  });

  it('are taken back off the screen when the server does not take them', async () => {
    const { sync, s, kept } = setup(paired());
    const done = sync.run(add('c1', 100_000));
    s.waiting[0]?.settle(new ApiRequestError('network', 'offline', true));
    const result = await done;
    expect(result.ok).toBe(false);
    expect(potOf(sync.getSnapshot().state)?.contributions).toEqual([]);
    expect(kept.size).toBe(0);
  });

  it('roll back one failure without touching another write in flight', async () => {
    const { sync, s } = setup(paired());
    const first = sync.run(add('c1', 100_000));
    const second = sync.run(add('c2', 50_000));
    s.waiting[1]?.settle(new ApiRequestError('timeout', 'slow', true));
    await second;
    expect(potOf(sync.getSnapshot().state)?.contributions.map((c) => c.id)).toEqual(['c1']);
    s.waiting[0]?.settle();
    await first;
    expect(potOf(sync.getSnapshot().state)?.contributions.map((c) => c.id)).toEqual(['c1']);
  });

  it('forget a contribution taken back, but keep money in a pot the partner deleted', async () => {
    const { sync, s, kept } = setup(paired([{ id: 'c1', memberId: 'an', amount: 200_000 }]));
    await sync.refresh();
    expect(kept.has('c1')).toBe(true);
    const remove = sync.run({ kind: 'removeContribution', id: 'c1' });
    s.waiting[0]?.settle();
    await remove;
    expect(kept.has('c1')).toBe(false);

    const again = sync.run(add('c2', 100_000));
    s.waiting[1]?.settle();
    await again;
    s.set({ me: AN, pair: { id: 'pair', members: [AN, BINH], pots: [] } });
    await sync.refresh();
    expect(sync.getSnapshot().state.pair?.pots).toEqual([]);
    expect(kept.has('c2')).toBe(true);
  });

  it('never let an older fetch undo a newer write', async () => {
    const { sync, s } = setup(paired());
    let release: (state: TogetherState) => void = () => undefined;
    s.api.fetchState = () => new Promise((resolve) => (release = resolve));
    const fetch = sync.refresh();
    const write = sync.run(add('c1', 100_000));
    s.waiting[0]?.settle();
    await write;
    release(paired());
    await fetch;
    expect(potOf(sync.getSnapshot().state)?.contributions).toHaveLength(1);
  });
});

describe('reading', () => {
  it('shows the kept copy offline and says so', async () => {
    const { sync, s } = setup(paired([{ id: 'c1', memberId: 'binh', amount: 300_000 }]));
    s.api.fetchState = () => Promise.reject(new ApiRequestError('network', 'offline', true));
    await sync.refresh();
    const snap = sync.getSnapshot();
    expect(snap.offline).toBe(true);
    expect(snap.known).toBe(true);
    expect(potOf(snap.state)?.contributions).toHaveLength(1);
  });

  it('knows nothing before the first answer when nothing was kept', async () => {
    const { sync, persisted } = setup(null, paired());
    expect(sync.getSnapshot().known).toBe(false);
    await sync.refresh();
    expect(sync.getSnapshot().known).toBe(true);
    expect(persisted).toHaveLength(1);
  });

  it('notices when the partner ended it, and not when nobody was there', async () => {
    const { sync, s, onEnded } = setup(paired());
    s.set({ me: AN, pair: null });
    await sync.refresh();
    expect(onEnded).toHaveBeenCalledTimes(1);
    await sync.refresh();
    await flush();
    expect(onEnded).toHaveBeenCalledTimes(1);
    expect(endedByPartner({ me: AN, pair: null }, { me: AN, pair: null })).toBe(false);
  });

  it('says nothing about the partner when this phone itself left', () => {
    const { sync, onEnded } = setup(paired());
    // What the provider does after its own leave answers.
    sync.adopt({ me: AN, pair: null });
    expect(onEnded).not.toHaveBeenCalled();
  });
});

describe('the history this phone keeps', () => {
  it('drops a contribution taken back elsewhere, or whose answer was lost', async () => {
    const { sync, s, kept } = setup(paired([{ id: 'c1', memberId: 'an', amount: 200_000 }]));
    await sync.refresh();
    expect(kept.has('c1')).toBe(true);
    // The DELETE went through but its answer never came; the next fetch no longer lists it.
    s.set(paired());
    await sync.refresh();
    expect(kept.has('c1')).toBe(false);
  });

  it('keeps everything after leaving', async () => {
    const { sync, s, kept } = setup(paired([{ id: 'c1', memberId: 'an', amount: 200_000 }]));
    await sync.refresh();
    s.set({ me: AN, pair: null });
    await sync.refresh();
    expect(kept.has('c1')).toBe(true);
  });
});

describe('the shared copy', () => {
  it('lays a new pot over a phone that has no pair yet', () => {
    const next = applyOp({ me: AN, pair: null }, { kind: 'createPot', id: POT, fields });
    expect(next.pair?.members).toEqual([AN]);
    expect(next.pair?.pots[0]?.name).toBe('Đà Lạt');
    // Applying it again (the server's answer already has it) adds nothing.
    expect(applyOp(next, { kind: 'createPot', id: POT, fields }).pair?.pots).toHaveLength(1);
  });

  it('never lets one partner take back the other’s money', () => {
    const state = paired([{ id: 'c1', memberId: 'binh', amount: 300_000 }]);
    expect(
      potOf(applyOp(state, { kind: 'removeContribution', id: 'c1' }))?.contributions,
    ).toHaveLength(1);
  });

  it('lists only the person’s own contributions, with the pot they went into', () => {
    const state = paired([
      { id: 'c1', memberId: 'an', amount: 100_000 },
      { id: 'c2', memberId: 'binh', amount: 200_000 },
    ]);
    expect(ownContributions(state)).toEqual([
      { id: 'c1', potId: POT, potName: 'Đà Lạt', amount: 100_000, at: '2026-10-13T01:00:00.000Z' },
    ]);
  });

  it('makes the invite a link into the app on the build’s own host', () => {
    expect(inviteUrl('https://6pm-dev.oddeggs.studio/api', 'abc')).toBe(
      'https://6pm-dev.oddeggs.studio/app/together/abc',
    );
    expect(stripAppPrefix(new URL(inviteUrl('https://6pm.oddeggs.studio/api', 'x')).pathname)).toBe(
      '/together/x',
    );
  });

  it('reads back a kept copy, and nothing from a damaged one', () => {
    expect(parseTogetherCache(JSON.stringify(paired()))).toEqual(paired());
    expect(parseTogetherCache('{nope')).toBeNull();
    expect(parseTogetherCache(JSON.stringify({ me: 'x' }))).toBeNull();
    expect(parseTogetherCache(null)).toBeNull();
  });
});

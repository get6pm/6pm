import {
  togetherStateSchema,
  type SharedPot,
  type SharedPotFields,
  type TogetherMember,
  type TogetherState,
} from '@6pm/domain';

/**
 * Budget together on the phone: the shared copy as the server last answered it, with the writes
 * still on their way laid over it so they show at once. Pure, so the sync can be tested apart.
 */

export type TogetherOp =
  | { readonly kind: 'createPot'; readonly id: string; readonly fields: SharedPotFields }
  | { readonly kind: 'editPot'; readonly id: string; readonly fields: SharedPotFields }
  | { readonly kind: 'deletePot'; readonly id: string }
  | {
      readonly kind: 'addContribution';
      readonly id: string;
      readonly potId: string;
      readonly amount: number;
      readonly addedAt: string;
    }
  | { readonly kind: 'removeContribution'; readonly id: string };

/** A pair made on the phone before the server has answered with its own. */
const LOCAL_PAIR = 'local';

function withPots(state: TogetherState, pots: (pots: readonly SharedPot[]) => SharedPot[]) {
  const { me, pair } = state;
  if (me === null) return state;
  const base = pair ?? { id: LOCAL_PAIR, members: [me], pots: [] };
  return { me, pair: { ...base, pots: pots(base.pots) } };
}

/** The state with one write applied, as the server will apply it. Applying it twice is harmless. */
export function applyOp(state: TogetherState, op: TogetherOp): TogetherState {
  const me = state.me;
  if (me === null) return state;
  switch (op.kind) {
    case 'createPot':
      return withPots(state, (pots) =>
        pots.some((p) => p.id === op.id)
          ? [...pots]
          : [
              ...pots,
              {
                ...op.fields,
                id: op.id,
                createdBy: me.id,
                createdAt: new Date(0).toISOString(),
                contributions: [],
              },
            ],
      );
    case 'editPot':
      return withPots(state, (pots) =>
        pots.map((p) => (p.id === op.id ? { ...p, ...op.fields } : p)),
      );
    case 'deletePot':
      return withPots(state, (pots) => pots.filter((p) => p.id !== op.id));
    case 'addContribution':
      return withPots(state, (pots) =>
        pots.map((p) =>
          p.id !== op.potId || p.contributions.some((c) => c.id === op.id)
            ? p
            : {
                ...p,
                contributions: [
                  ...p.contributions,
                  { id: op.id, memberId: me.id, amount: op.amount, addedAt: op.addedAt },
                ],
              },
        ),
      );
    case 'removeContribution':
      return withPots(state, (pots) =>
        pots.map((p) => ({
          ...p,
          contributions: p.contributions.filter((c) => !(c.id === op.id && c.memberId === me.id)),
        })),
      );
  }
}

/** What the screens show: the server's copy with every write still in flight on top. */
export function viewOf(base: TogetherState, pending: readonly TogetherOp[]): TogetherState {
  return pending.reduce(applyOp, base);
}

export const SIGNED_OUT: TogetherState = { me: null, pair: null };

/** The partner, when there is one. */
export function partnerOf(state: TogetherState): TogetherMember | null {
  const { me, pair } = state;
  if (me === null || pair === null) return null;
  return pair.members.find((m) => m.id !== me.id) ?? null;
}

/**
 * Whether Budget together ended from the other side between two answers: there was a partner,
 * and now this person is in no pair at all.
 */
export function endedByPartner(before: TogetherState, after: TogetherState): boolean {
  return partnerOf(before) !== null && after.me !== null && after.pair === null;
}

/** The person's own contributions, with the name of the pot each went into. */
export function ownContributions(state: TogetherState) {
  const { me, pair } = state;
  if (me === null || pair === null) return [];
  return pair.pots.flatMap((pot) =>
    pot.contributions
      .filter((c) => c.memberId === me.id)
      .map((c) => ({
        id: c.id,
        potId: pot.id,
        potName: pot.name,
        amount: c.amount,
        at: c.addedAt,
      })),
  );
}

/**
 * The invite as a universal link on the build's own host (`https://<host>/app/together/<code>`),
 * which opens the join sheet in the app. The API lives at `https://<host>/api`.
 */
export function inviteUrl(apiBase: string, code: string): string {
  return `${apiBase.replace(/\/api\/?$/, '')}/app/together/${code}`;
}

/** The first letter of a name, for the round avatar; "?" when there is none. */
export function initialOf(name: string | null | undefined): string {
  const first = name?.trim().charAt(0) ?? '';
  return first === '' ? '?' : first.toLocaleUpperCase();
}

export const TOGETHER_CACHE_KEY = 'together.state';

/** The kept copy, or null when there is none or it no longer reads. */
export function parseTogetherCache(text: string | undefined | null): TogetherState | null {
  if (text === undefined || text === null) return null;
  try {
    const parsed = togetherStateSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

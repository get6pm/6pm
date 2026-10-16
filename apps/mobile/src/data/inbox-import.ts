import {
  inboxItemSchema,
  inboxItemToNewSpend,
  isRepeatTap,
  isSameReceipt,
  likelyCategoriesAt,
  type InboxPaid,
  type InboxSpend,
  type SpendSource,
} from '@6pm/domain';

import type { moneyActions } from './money-actions';
import type { MoneyStore } from './money-store';

/** The App Group inbox as the surfaces module exposes it. */
export interface InboxSource {
  readInbox(): Promise<readonly { readonly id: string; readonly json: string }[]>;
  removeInbox(ids: readonly string[]): Promise<void>;
}

export interface InboxImportDeps {
  readonly store: MoneyStore;
  readonly actions: ReturnType<typeof moneyActions>;
  readonly inbox: InboxSource;
  /** Adds what can be learned about a shared receipt before it is saved (the payee's name). */
  readonly enrich: (item: InboxSpend) => Promise<InboxSpend>;
  /** Told when a file is dropped; never given the file's content. */
  readonly report: (message: string) => void;
  /**
   * The home currency the app counts in now (ISO 4217); đồng when not given. An item counted in
   * another is kept as a foreign amount, priced when its rate arrives.
   */
  readonly home?: string;
}

/** What one import did, for the caller to refresh what the extensions show. */
export interface InboxImportResult {
  readonly saved: number;
  readonly removed: number;
}

/**
 * Saves what the share extension, the shortcuts and the Live Activity left in the inbox, oldest
 * first, through the same capture as every other source (rules, duplicate merge, the money day
 * of when it happened). A file is removed only after what it said is committed, and importing
 * the same file twice changes nothing: its id is the spend's, or its sighting is already there.
 */
export async function importInbox(deps: InboxImportDeps): Promise<InboxImportResult> {
  const { inbox, report } = deps;
  let saved = 0;
  let removed = 0;
  const remove = async (id: string) => {
    await inbox.removeInbox([id]);
    removed += 1;
  };
  for (const file of await inbox.readInbox()) {
    const parsed = inboxItemSchema.safeParse(parseJson(file.json));
    if (!parsed.success) {
      report('inbox: dropped a file that is not a known inbox item');
      await remove(file.id);
      continue;
    }
    const item = parsed.data;
    if (item.kind === 'paid') {
      if (await markPaid(deps, item)) saved += 1;
    } else if (await saveInboxSpend(deps, item)) {
      saved += 1;
    }
    await remove(file.id);
  }
  return { saved, removed };
}

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

/**
 * Whether a capture was saved before: its id is a spend's, or it was merged into a payment seen
 * another way and its sighting carries its id. A sighting written before sightings kept their
 * capture is known by its source and time.
 */
export async function alreadyImported(
  store: MoneyStore,
  item: { readonly id: string; readonly source: SpendSource; readonly at: string },
): Promise<boolean> {
  if (await store.tables.spends.get(item.id)) return true;
  const seen = await store.db.getAllAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM spend_sightings
      WHERE capture_id = ? OR (capture_id IS NULL AND source = ? AND seen_at = ?)`,
    [item.id, item.source, new Date(item.at).toISOString()],
  );
  return (seen[0]?.n ?? 0) > 0;
}

/**
 * Saves one spend as the inbox does: never twice (a repeat tap or the same receipt again is
 * skipped, and false returned), named first when it is a receipt, then filed and captured with the
 * duplicate merge. Scan saves the receipts it reads through here too.
 */
export async function saveInboxSpend(
  deps: Pick<InboxImportDeps, 'store' | 'actions' | 'enrich' | 'home'>,
  incoming: InboxSpend,
): Promise<boolean> {
  const { store, actions } = deps;
  if (await alreadyImported(store, incoming)) return false;
  const snap = store.getSnapshot();
  const recent = [...snap.cycleSpends, ...snap.waitingBefore].filter((s) => s.status !== 'deleted');
  if (recent.some((s) => isRepeatTap(incoming, s) || isSameReceipt(incoming, s))) return false;

  const item = incoming.source === 'shared' ? await deps.enrich(incoming) : incoming;
  const categoryIds = new Set(snap.categories.map((c) => c.id));
  const likely = likelyCategoriesAt(new Date(item.at).getHours()).map((n) => n.toLowerCase());
  const draft = inboxItemToNewSpend(item, {
    ruleCategoryId: await actions.ruleCategory(item.merchant).catch(() => null),
    fallbackCategoryId:
      snap.categories.find((c) => likely.includes(c.id))?.id ?? snap.categories[0]?.id ?? 'food',
    categoryIds,
    ...(deps.home ? { home: deps.home } : {}),
  });
  await actions.captureSpend(draft);
  return true;
}

/** A waiting payment the Live Activity says went through; anything already answered stays. */
async function markPaid(deps: InboxImportDeps, item: InboxPaid): Promise<boolean> {
  const row = await deps.store.tables.spends.get(item.spendId);
  if (row?.status !== 'pending') return false;
  await deps.actions.update(row.id, { status: 'kept' });
  return true;
}

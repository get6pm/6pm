import { capturedInHome, categoryHintOf, likelyCategoriesAt, type EmailCapture } from '@6pm/domain';

import { homeCurrencyOf } from '../money/use-money-format';

import { alreadyImported } from './inbox-import';
import type { moneyActions } from './money-actions';
import type { MoneyStore } from './money-store';

/** The receipts the server holds for this phone. */
export interface EmailCaptureSource {
  /** What is waiting, oldest first. Rejects when the server cannot be reached. */
  fetch(): Promise<readonly EmailCapture[]>;
  /** Tells the server these are saved, so it deletes them. */
  ack(ids: readonly string[]): Promise<void>;
}

export interface EmailImportDeps {
  readonly store: MoneyStore;
  readonly actions: ReturnType<typeof moneyActions>;
  readonly source: EmailCaptureSource;
}

export interface EmailImportResult {
  readonly saved: number;
  readonly acknowledged: number;
}

/** The category a receipt is filed under: the merchant's rule, its name's hint, then the hour's. */
async function categoryFor(deps: EmailImportDeps, capture: EmailCapture): Promise<string> {
  const { store, actions } = deps;
  const categories = store.getSnapshot().categories;
  const exists = (id: string | null | undefined) =>
    id ? categories.find((c) => c.id === id)?.id : undefined;
  const ruled = await actions.ruleCategory(capture.merchant).catch(() => null);
  const likely = likelyCategoriesAt(new Date(capture.at).getHours()).map((n) => n.toLowerCase());
  return (
    exists(ruled) ??
    exists(categoryHintOf(capture.merchant)) ??
    categories.find((c) => likely.includes(c.id))?.id ??
    categories[0]?.id ??
    'food'
  );
}

/**
 * Saves the receipts that arrived by email through the same capture as every other source
 * (rules, the duplicate merge with a scan or a shared receipt, the money day of when it was
 * paid), each waiting for the close. Its detail is the address it came from. The server is told
 * only after every one of them is committed, and a receipt fetched twice is saved once: its id
 * is the spend's, or its sighting is already there.
 */
export async function importEmailCaptures(deps: EmailImportDeps): Promise<EmailImportResult> {
  const { store, actions, source } = deps;
  const captures = await source.fetch();
  let saved = 0;
  const done: string[] = [];
  for (const capture of captures) {
    if (!(await alreadyImported(store, { id: capture.id, source: 'email', at: capture.at }))) {
      // Emailed receipts are Vietnamese, in đồng: on another home they wait to be priced.
      const home = homeCurrencyOf(store.getSnapshot().plan).code;
      const priced = capturedInHome(capture.amount, 'VND', home);
      await actions.captureSpend({
        id: capture.id,
        amount: priced.amount,
        foreignAmount: priced.foreignAmount,
        categoryId: await categoryFor(deps, capture),
        merchant: capture.merchant.trim(),
        source: 'email',
        status: 'caught',
        detail: capture.from,
        memo: capture.memo ?? null,
        at: new Date(capture.at),
      });
      saved += 1;
    }
    done.push(capture.id);
  }
  if (done.length > 0) await source.ack(done);
  return { saved, acknowledged: done.length };
}

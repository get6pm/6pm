import { useCallback, useRef, useState } from 'react';

import { spendsCsv, type SpendsCsvLabels } from '@6pm/domain';

import { useMoneyStore } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useToast } from '../../ui/toast/toast-host';
import { useClock } from '../../ui/theme/clock';
import { exportFileName } from './export-file';
import { shareCsv } from './share-csv';

type T = ReturnType<typeof useI18n>['t'];

/** The file's words in the app's language. Statuses and sources read as the spend's details do. */
function labelsOf(t: T): SpendsCsvLabels {
  return {
    headers: {
      date: t('export.csv.date'),
      time: t('export.csv.time'),
      merchant: t('export.csv.merchant'),
      category: t('export.csv.category'),
      amount: t('export.csv.amount'),
      status: t('export.csv.status'),
      source: t('export.csv.source'),
      wallet: t('export.csv.wallet'),
      note: t('export.csv.note'),
      detail: t('export.csv.detail'),
      forWork: t('export.csv.forWork'),
      foreignAmount: t('export.csv.foreignAmount'),
      currency: t('export.csv.currency'),
    },
    status: {
      kept: t('details.status.kept'),
      caught: t('details.status.caught'),
      pending: t('details.status.pending'),
      skipped: t('details.status.skipped'),
    },
    source: {
      manual: t('source.manual'),
      voice: t('source.voice'),
      shared: t('source.shared'),
      qr: t('source.qr'),
      email: t('source.email'),
      applePay: t('source.applePay'),
      cash: t('source.cash'),
    },
    yes: t('export.csv.yes'),
    no: t('export.csv.no'),
  };
}

/**
 * Exports every spend the phone holds (every pay cycle, not only this one) as a CSV and opens
 * the share sheet with it. One export at a time; `busy` is true while the file is made and shared.
 */
export function useExportSpends() {
  const store = useMoneyStore();
  const { t } = useI18n();
  const { today } = useClock();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      // After any write still in flight, so the file has the spend just added.
      const [spends, categories] = await store.exclusive(() =>
        Promise.all([
          store.tables.spends.select("WHERE status != 'deleted' ORDER BY day, at", []),
          store.tables.categories.all(),
        ]),
      );
      if (spends.length === 0) {
        toast(t('export.empty'));
        return;
      }
      await shareCsv(exportFileName(today), spendsCsv(spends, categories, labelsOf(t)));
    } catch (error: unknown) {
      console.error('Exporting the spends failed', error);
      toast(t('export.failed'));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [store, t, today, toast]);

  return { run, busy };
}

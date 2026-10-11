import { useEffect, useMemo, useState } from 'react';

import type { LocalDate } from '@6pm/domain';

import { notDailyOf } from '../../data/diary-queries';
import { useMoney, useMoneyActions } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { CloseReceipt } from './close-receipt';
import { receiptSpends } from './receipt-lines';

/**
 * The printed day: its kept lines, the total, tomorrow's number and its receipt number, counted
 * across every day ever closed, not just this pay cycle.
 */
export function CloseReceiptStep({
  day,
  closedAt,
  spent,
  tomorrow,
  onNext,
}: {
  readonly day: LocalDate;
  readonly closedAt: string;
  readonly spent: number;
  readonly tomorrow: number;
  readonly onNext: () => void;
}) {
  const { t, language } = useI18n();
  const snap = useMoney();
  const actions = useMoneyActions();
  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  // Until the count comes back, the days in view give the number (right unless history is older).
  const [before, setBefore] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    actions
      .closedBefore(day)
      .then((n) => live && setBefore(n))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [actions, day]);
  const no = String((before ?? snap.closedDays.filter((d) => d.day < day).length) + 1).padStart(
    4,
    '0',
  );
  const { lines, claimBack } = useMemo(
    () => receiptSpends(snap.cycleSpends, day, notDailyOf(snap)),
    [snap, day],
  );
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const date = new Date(`${day}T12:00:00`);

  return (
    <CloseReceipt
      no={no}
      dateLine={`${new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).toUpperCase()} ${day.split('-').reverse().join('.')} · ${closedAt}`}
      rows={lines.map((s) => ({
        time: time.format(new Date(s.at)),
        name: s.merchant.toUpperCase(),
        amount: s.amount,
      }))}
      claimBack={
        claimBack ? { name: claimBack.merchant.toUpperCase(), amount: claimBack.amount } : null
      }
      total={spent}
      tomorrow={tomorrow}
      note={spent === 0 ? t('close.receipt.noteQuiet') : t('close.receipt.note')}
      closedAt={closedAt}
      labels={{
        daily: t('close.receipt.daily', { no }),
        empty: t('close.receipt.empty'),
        total: t('close.receipt.total'),
        tomorrow: t('close.receipt.tomorrow'),
        thanks: t('close.receipt.thanks'),
        closed: t('close.receipt.closed'),
        share: t('close.receipt.share'),
        next: t('close.receipt.next'),
        claimBack: t('close.receipt.claimBack', {
          name: claimBack?.merchant.toUpperCase() ?? '',
        }),
      }}
      onShare={() => undefined}
      onNext={onNext}
    />
  );
}

import { useMemo } from 'react';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useSpendLabels } from '../today/use-spend-rows';
import { GUIDES, type GuideContent } from './guide-content';
import { onCount, sourceStatuses, type CaptureSource, type SourceStatus } from './source-status';

export interface CaptureSourceView extends SourceStatus {
  readonly guide: GuideContent;
  readonly name: string;
  /** Settings' second line: the last catch, or how to turn it on. */
  readonly sub: string;
  /** The guide's status chip. */
  readonly status: string;
}

/** Every way spending gets caught, with the words Settings and the guide show for it. */
export function useCaptureSources(): {
  readonly sources: readonly CaptureSourceView[];
  readonly summary: string;
  readonly walletOn: boolean;
} {
  const { cycleSpends, waitingBefore } = useMoney();
  const { t } = useI18n();
  const labels = useSpendLabels();
  return useMemo(() => {
    const statuses = sourceStatuses([...cycleSpends, ...waitingBefore]);
    const sources = statuses.map((status): CaptureSourceView => {
      const guide = GUIDES[status.source];
      const last = status.last
        ? t('capture.last', { name: status.last.merchant, time: labels.time(status.last.at) })
        : null;
      const onOff = t(status.on ? 'capture.status.on' : 'capture.status.off');
      return {
        ...status,
        guide,
        name: t(guide.name),
        sub: subOf(status.source, status.on, last, t(guide.sub), t),
        status: statusOf(status.source, status.on, last, onOff, t),
      };
    });
    const summary = t('capture.settings.summary', {
      on: onCount(statuses),
      total: statuses.length,
    });
    const walletOn = statuses.some((s) => s.source === 'wallet' && s.on);
    return { sources, summary, walletOn };
  }, [cycleSpends, waitingBefore, t, labels]);
}

type T = ReturnType<typeof useI18n>['t'];

function subOf(
  source: CaptureSource,
  on: boolean,
  last: string | null,
  fallback: string,
  t: T,
): string {
  if (source === 'wallet') return t(on ? 'capture.wallet.subOn' : 'capture.wallet.subOff');
  return last ?? fallback;
}

function statusOf(
  source: CaptureSource,
  on: boolean,
  last: string | null,
  onOff: string,
  t: T,
): string {
  if (source === 'wallet') return on ? t('capture.wallet.statusOn') : onOff;
  return last ?? onOff;
}

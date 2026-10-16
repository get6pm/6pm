import { useMemo } from 'react';

import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useHomeCurrency } from '../../money/use-money-format';
import { useAiMode } from '../privacy/use-ai-mode';
import { useReceiptAddress } from '../receipt-email/receipt-address';
import { nativeReach } from '../surfaces/native-reach';
import { useSpendLabels } from '../today/use-spend-rows';
import { GUIDES, type GuideContent } from './guide-content';
import { onCount, sourceStatuses, type CaptureSource, type SourceStatus } from './source-status';

/** The native piece each way needs; a phone without it does not list that way. */
const NEEDS: Readonly<Partial<Record<CaptureSource, boolean>>> = {
  share: nativeReach.share,
  scan: nativeReach.scan,
  wallet: nativeReach.wallet,
  widgets: nativeReach.widgets,
};

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
  /** Whether the Wallet automation is on, or not offered on this phone: no banner asks for it. */
  readonly walletOn: boolean;
  /** This phone's receipt email address, once the server has given one. */
  readonly emailAddress: string | null;
  /** Receipt email exists only in server mode: in on-device mode it is shown as off. */
  readonly emailAvailable: boolean;
} {
  const { cycleSpends, waitingBefore } = useMoney();
  const emailAddress = useReceiptAddress();
  const emailAvailable = useAiMode() === 'server';
  const { t } = useI18n();
  const labels = useSpendLabels();
  const home = useHomeCurrency();
  return useMemo(() => {
    const statuses = sourceStatuses([...cycleSpends, ...waitingBefore], home.code).filter(
      (status) => NEEDS[status.source] !== false,
    );
    const sources = statuses.map((status): CaptureSourceView => {
      const guide = GUIDES[status.source];
      const last = status.last
        ? t('capture.last', { name: status.last.merchant, time: labels.time(status.last.at) })
        : null;
      const onOff = t(status.on ? 'capture.status.on' : 'capture.status.off');
      if (status.source === 'email' && !emailAvailable) {
        const off = t('receiptEmail.deviceMode');
        return { ...status, on: false, guide, name: t(guide.name), sub: off, status: off };
      }
      return {
        ...status,
        guide,
        name: t(guide.name),
        sub: subOf(status.source, status.on, last, t(guide.sub), emailAddress, t),
        status: statusOf(status.source, status.on, last, onOff, t),
      };
    });
    const summary = t('capture.settings.summary', {
      on: onCount(statuses),
      total: statuses.length,
    });
    const walletOn = !nativeReach.wallet || statuses.some((s) => s.source === 'wallet' && s.on);
    return { sources, summary, walletOn, emailAddress, emailAvailable };
  }, [cycleSpends, waitingBefore, t, labels, emailAddress, emailAvailable, home]);
}

type T = ReturnType<typeof useI18n>['t'];

function subOf(
  source: CaptureSource,
  on: boolean,
  last: string | null,
  fallback: string,
  emailAddress: string | null,
  t: T,
): string {
  if (source === 'wallet') return t(on ? 'capture.wallet.subOn' : 'capture.wallet.subOff');
  // Receipt email shows the address to forward to until a receipt has come through it.
  if (source === 'email') return last ?? emailAddress ?? t('receiptEmail.offline');
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

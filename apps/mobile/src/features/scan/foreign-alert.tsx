import { useEffect } from 'react';

import { currencyOfForeignQr, formatForeign, isRate, type FxRate } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useHomeCurrency } from '../../money/use-money-format';
import { rateFor } from '../travel/trip';
import { useTravel } from '../travel/travel-provider';
import { foreignAmountLabel } from './pay-options';
import { ScanAlert } from './scan-card';
import type { ScanPhase } from './use-scan';

/**
 * A QR from another country's scheme: named, not payable from 6pm, and loggable by hand. With
 * Travel mode on and a rate for its currency, it is paid in the bank app (Vietnamese banks take
 * the region's QRs) and kept here in that currency with home underneath.
 */
export function ForeignAlert({
  phase,
  onLog,
  onRetry,
  onKeep,
}: {
  readonly phase: Extract<ScanPhase, { kind: 'foreign' }>;
  readonly onLog: () => void;
  readonly onRetry: () => void;
  /** Keeps the QR's amount, priced at `rate`; `payee` names it when the QR has no name. */
  readonly onKeep: (rate: FxRate, payee: string) => void;
}) {
  const { t } = useI18n();
  const home = useHomeCurrency();
  const { on, locked, rates, refreshRates } = useTravel();
  const { failure } = phase;
  const scheme = t(`scan.scheme.${failure.scheme ?? 'other'}`);
  const currency = currencyOfForeignQr(failure);
  const travelling = on && !locked;
  const rate = travelling && currency !== null ? rateFor(rates, currency.code) : null;
  useEffect(() => {
    if (travelling) refreshRates();
  }, [travelling, refreshRates]);

  if (currency !== null && rate !== null) {
    const minor =
      failure.amount !== undefined && isRate(failure.amount)
        ? Math.round(Number(failure.amount) * 10 ** currency.decimals)
        : null;
    return (
      <ScanAlert
        icon="public"
        title={t('scan.abroad.title', { scheme })}
        body={t('travel.scan.body', { symbol: currency.symbol })}
        secondary={{ label: t('scan.tryAgain'), onPress: onRetry }}
        primary={
          minor === null
            ? { label: t('travel.scan.logIn', { symbol: currency.symbol }), onPress: onLog }
            : {
                label: t('travel.scan.keep', { amount: formatForeign(minor, currency) }),
                onPress: () => onKeep(rate, scheme),
              }
        }
      />
    );
  }
  const amount = foreignAmountLabel(failure);
  return (
    <ScanAlert
      icon="public"
      title={t('scan.abroad.title', { scheme })}
      body={t('scan.abroad.body', { symbol: home.symbol })}
      secondary={{ label: t('scan.tryAgain'), onPress: onRetry }}
      primary={{
        label: amount ? t('scan.abroad.log', { amount }) : t('scan.abroad.logPlain'),
        onPress: onLog,
      }}
    />
  );
}

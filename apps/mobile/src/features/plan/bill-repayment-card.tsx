import { Text, View } from 'react-native';

import type { BillKind } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { Switch } from '../../ui/primitives/switch';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { MAX_MONTHS_LEFT } from '../onboarding/bill-deck';
import { potRow, StepperRow } from './pot-rows';
import { PotSettingsCard } from './pot-sheet-rows';

/**
 * Under a bill's amount: whether it pays off a card (whose payment never moves free money), and
 * how many months are left before it stops by itself (0 for no end).
 */
export function BillRepaymentCard({
  kind,
  monthsLeft,
  onKind,
  onMonthsLeft,
}: {
  readonly kind: BillKind;
  readonly monthsLeft: number;
  readonly onKind: (kind: BillKind) => void;
  readonly onMonthsLeft: (months: number) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <PotSettingsCard>
      <View style={[potRow, { paddingVertical: 8 }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...body(16), color: palette.ink }}>{t('plan.bill.card')}</Text>
          <Text style={{ ...body(12.5), lineHeight: 16.9, color: palette.inkSoft }}>
            {t('plan.bill.cardSub')}
          </Text>
        </View>
        <Switch
          value={kind === 'card'}
          onChange={(on) => onKind(on ? 'card' : 'other')}
          accessibilityLabel={t('plan.bill.card')}
        />
      </View>
      <StepperRow
        label={t('plan.bill.monthsLeft')}
        value={monthsLeft > 0 ? String(monthsLeft) : t('plan.bill.noEnd')}
        lessLabel={t('plan.pot.less')}
        moreLabel={t('plan.pot.more')}
        dimLess={monthsLeft <= 0}
        dimMore={monthsLeft >= MAX_MONTHS_LEFT}
        width={104}
        onStep={(by) => onMonthsLeft(Math.min(MAX_MONTHS_LEFT, Math.max(0, monthsLeft + by)))}
      />
    </PotSettingsCard>
  );
}

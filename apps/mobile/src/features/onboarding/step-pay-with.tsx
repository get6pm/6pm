import { View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { BankPicker } from '../banks/bank-picker';
import type { PickerInks } from '../banks/bank-picker-parts';
import type { OnboardingPalette } from './onboarding-palette';
import { StepHeading } from './step-parts';

/** The picker in onboarding's inks for the step. */
function onboardingInks(pal: OnboardingPalette): PickerInks {
  return {
    ink: pal.ink,
    inkSoft: pal.inkSoft,
    cell: pal.cell,
    cardShadow: pal.cardShadow,
    chipBg: pal.chipBg,
    hair: pal.track,
    accent: pal.accent,
    accentClear: pal.accentClear,
    onAccent: pal.onAccent,
  };
}

/** What do you pay with: search, suggestions and every bank and wallet, pick as many as apply. */
export function StepPayWith({
  pal,
  wallets,
  onToggle,
}: {
  readonly pal: OnboardingPalette;
  readonly wallets: readonly string[];
  readonly onToggle: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, minHeight: 0, gap: 14 }}>
      <StepHeading
        title={t('onboarding.wallets.title')}
        sub={t('onboarding.wallets.sub')}
        pal={pal}
      />
      <BankPicker inks={onboardingInks(pal)} chosen={wallets} onToggle={onToggle} scroll />
    </View>
  );
}

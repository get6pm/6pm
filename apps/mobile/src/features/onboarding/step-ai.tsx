import { ScrollView, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import type { AiInks } from '../privacy/ai-choice';
import { AiModeChooser } from '../privacy/ai-mode-chooser';
import type { OnboardingPalette } from './onboarding-palette';
import { StepHeading } from './step-parts';

/** The choice's inks in the step's sky. */
function aiInks(pal: OnboardingPalette): AiInks {
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
    okInk: pal.okInk,
  };
}

/**
 * Where should 6pm think: on our server with Claude, or only on this iPhone with a model of its
 * own. Asked before the ways of catching spending, which follow the choice (receipt emails need
 * the server). A model's download carries on while the rest of onboarding goes on.
 */
export function StepAi({ pal }: { readonly pal: OnboardingPalette }) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, minHeight: 0, gap: 14 }}>
      <StepHeading title={t('privacy.ai.title')} sub={t('privacy.ai.sub')} pal={pal} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <AiModeChooser inks={aiInks(pal)} />
      </ScrollView>
    </View>
  );
}

import { useMemo } from 'react';
import { Text } from 'react-native';

import { oklchSrgbHex, planInk } from '@6pm/theme';

import { AiLeaves } from '../features/privacy/ai-leaves';
import type { AiInks } from '../features/privacy/ai-choice';
import { AiModeChooser } from '../features/privacy/ai-mode-chooser';
import { useAiMode } from '../features/privacy/use-ai-mode';
import { useI18n } from '../i18n/i18n';
import { SheetScreen } from '../ui/navigation/sheet-screen';
import { useTheme } from '../ui/theme/theme';
import { body } from '../ui/type/fonts';

/**
 * Settings → AI: where 6pm's AI runs, the local models and their downloads, and what leaves the
 * phone in the chosen mode. Each choice is saved at once.
 */
export default function Ai() {
  const { palette } = useTheme();
  const { t } = useI18n();
  const mode = useAiMode();
  const inks = useMemo(
    (): AiInks => ({
      ink: palette.ink,
      inkSoft: palette.inkSoft,
      cell: palette.cell,
      cardShadow: palette.cardShadow,
      chipBg: palette.chipBg,
      hair: palette.hair,
      accent: palette.accent,
      accentClear: `${palette.accent}00`,
      onAccent: planInk.onAccent,
      // The green onboarding marks what works already with.
      okInk: palette.dark ? oklchSrgbHex(0.86, 0.1, 150) : oklchSrgbHex(0.42, 0.1, 150),
    }),
    [palette],
  );
  return (
    <SheetScreen title={t('settings.ai')} gap={18}>
      <Text style={{ ...body(15), lineHeight: 21, color: palette.inkSoft, paddingHorizontal: 6 }}>
        {t('privacy.ai.sub')}
      </Text>
      <AiModeChooser inks={inks} canDelete />
      <AiLeaves mode={mode} inks={inks} />
    </SheetScreen>
  );
}

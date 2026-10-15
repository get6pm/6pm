import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { useCompanionForm } from '../../ui/companion/companion-form';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';

/**
 * Settings' card for the companion worn, beside the Look card: it stands there live, with
 * "COMPANION", its name and its personality. Opens the picker.
 */
export function SettingsCompanionRow({ onPress }: { readonly onPress: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const form = useCompanionForm();
  const name = t(`companions.name.${form}`);
  return (
    <PressScale
      inScroll
      accessibilityRole="button"
      accessibilityLabel={`${t('companions.title')}: ${name}`}
      scaleTo={0.98}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingLeft: 12,
        paddingRight: 14,
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <Companion size={60} mood="calm" />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text
          style={{ ...body(12, 600, 0.05), textTransform: 'uppercase', color: palette.inkSoft }}
        >
          {t('companions.title')}
        </Text>
        <Text style={{ ...leading(display(21, 500), 24), color: palette.ink }}>{name}</Text>
        <Text numberOfLines={1} style={{ ...body(13), color: palette.inkSoft }}>
          {t(`companions.line.${form}`)}
        </Text>
      </View>
      <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.35 }} />
    </PressScale>
  );
}

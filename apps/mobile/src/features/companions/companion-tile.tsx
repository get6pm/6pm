import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import type { CompanionForm } from '../../ui/companion/companion-mood';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';

/** The live preview's size, and the height of the window it stands in. */
const PREVIEW = 112;
const WINDOW = 128;

/**
 * One companion in the picker: a live preview (happy for a moment after it is picked, playing its
 * arrival), the "With you" or MAX badge, its name with a short gloss, and its personality.
 */
export function CompanionTile({
  form,
  worn,
  locked,
  celebrating,
  cue,
  onPress,
}: {
  readonly form: CompanionForm;
  readonly worn: boolean;
  readonly locked: boolean;
  readonly celebrating: boolean;
  readonly cue: number;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const name = t(`companions.name.${form}`);
  return (
    <PressScale
      inScroll
      accessibilityRole="button"
      accessibilityState={{ selected: worn }}
      accessibilityLabel={locked ? t('companions.locked', { name }) : name}
      accessibilityHint={t(`companions.line.${form}`)}
      scaleTo={0.97}
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <View style={{ height: WINDOW, alignItems: 'center', justifyContent: 'center' }}>
        <Companion size={PREVIEW} mood={celebrating ? 'happy' : 'calm'} form={form} cue={cue} />
        {worn ? (
          <View
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
              height: 22,
              paddingHorizontal: 9,
              borderRadius: 99,
              backgroundColor: palette.btnBg,
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(11, 700), color: palette.btnFg }}>
              {t('companions.wearing')}
            </Text>
          </View>
        ) : null}
        {locked ? (
          <View
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
              height: 20,
              paddingLeft: 5,
              paddingRight: 7,
              borderRadius: 6,
              backgroundColor: palette.btnBg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Symbol name="lock" size={12} fill={1} color={palette.btnFg} />
            <Text style={{ ...body(10, 800, 0.1), color: palette.btnFg }}>
              {t('companions.max')}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ paddingTop: 4, paddingHorizontal: 12, paddingBottom: 13, gap: 3 }}>
        <Text
          numberOfLines={1}
          style={{ ...display(18, 500), lineHeight: 20.7, color: palette.ink }}
        >
          {name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ ...body(11, 600, 0.05), textTransform: 'uppercase', color: palette.inkSoft }}
        >
          {t(`companions.gloss.${form}`)}
        </Text>
        <Text numberOfLines={2} style={{ ...body(12), lineHeight: 16.2, color: palette.inkSoft }}>
          {t(`companions.line.${form}`)}
        </Text>
      </View>
    </PressScale>
  );
}

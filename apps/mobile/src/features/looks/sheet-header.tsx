import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/**
 * The prototype's sheet header with a back button: grabber, then "‹ Back" on the left, the title
 * in the middle and Done on the right (`App:864-871`). The sheet frame makes it draggable.
 */
export function BackSheetHeader({
  title,
  backLabel,
  onBack,
  onDone,
}: {
  readonly title: string;
  readonly backLabel: string;
  readonly onBack: () => void;
  readonly onDone: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ paddingTop: 8, paddingHorizontal: 14, paddingBottom: 6, gap: 6 }}>
      <View
        style={{
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 9,
          backgroundColor: palette.inkSoft,
          opacity: 0.35,
        }}
      />
      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <PressScale
            accessibilityRole="button"
            onPress={onBack}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
          >
            <Symbol name="chevron_left" size={26} color={palette.ink} style={{ marginLeft: -4 }} />
            <Text style={{ ...body(17, 500), color: palette.ink }}>{backLabel}</Text>
          </PressScale>
        </View>
        <Text accessibilityRole="header" style={{ ...body(17, 650), color: palette.ink }}>
          {title}
        </Text>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <PressScale
            accessibilityRole="button"
            onPress={onDone}
            hitSlop={8}
            style={{ paddingVertical: 8, paddingHorizontal: 4 }}
          >
            <Text style={{ ...body(17, 650), color: palette.ink }}>{t('common.done')}</Text>
          </PressScale>
        </View>
      </View>
    </View>
  );
}

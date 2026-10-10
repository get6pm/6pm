import { Text, View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

const PREVIEWS = ['diary.ask.dinner', 'diary.ask.weekend', 'diary.ask.tet'] as const;

/** The way into Ask 6pm: the thinking companion and three questions to start from. */
export function AskEntry({ onAsk }: { readonly onAsk: (question?: string) => void }) {
  const { palette, serious } = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        padding: 16,
        gap: 14,
      }}
    >
      <PressScale
        accessibilityRole="button"
        onPress={() => onAsk()}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        {!serious ? <Companion size={52} mood="think" /> : null}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...body(17, 700), color: palette.ink }}>{t('diary.ask.title')}</Text>
          <Text style={{ ...body(13), color: palette.inkSoft }}>{t('diary.ask.sub')}</Text>
        </View>
        <Symbol name="chevron_right" size={22} color={palette.ink} style={{ opacity: 0.45 }} />
      </PressScale>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {PREVIEWS.map((key) => (
          <PressScale
            key={key}
            accessibilityRole="button"
            onPress={() => onAsk(t(key))}
            style={{
              height: 34,
              paddingHorizontal: 13,
              borderRadius: 99,
              backgroundColor: palette.chipBg,
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(13, 600), color: palette.ink }}>{t(key)}</Text>
          </PressScale>
        ))}
      </View>
    </View>
  );
}

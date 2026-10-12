import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { captureColours } from './capture-colours';
import type { CaptureSource } from './source-status';
import { useCaptureSources, type CaptureSourceView } from './use-capture-sources';

/**
 * Settings' "How spending gets caught": the Apple Pay banner while the Wallet automation is off,
 * then one row per way, each opening its guide.
 */
export function CaptureSettingsSection({
  onOpen,
}: {
  readonly onOpen: (source: CaptureSource) => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const { sources, summary, walletOn } = useCaptureSources();
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingHorizontal: 6,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ ...body(13, 600, 0.04), textTransform: 'uppercase', color: palette.inkSoft }}
        >
          {t('capture.settings.title')}
        </Text>
        <Text style={{ ...body(13), color: palette.inkSoft }}>{summary}</Text>
      </View>
      {walletOn ? null : <WalletBanner onSetUp={() => onOpen('wallet')} />}
      <View
        style={{
          borderRadius: 26,
          backgroundColor: palette.cell,
          boxShadow: palette.cardShadow,
          overflow: 'hidden',
        }}
      >
        {sources.map((source, n) => (
          <SourceRow
            key={source.source}
            source={source}
            first={n === 0}
            onPress={() => onOpen(source.source)}
          />
        ))}
      </View>
    </View>
  );
}

function WalletBanner({ onSetUp }: { readonly onSetUp: () => void }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const colours = captureColours(palette);
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(150)}
      style={{
        borderRadius: 22,
        paddingVertical: 14,
        paddingLeft: 16,
        paddingRight: 14,
        backgroundColor: colours.fixBg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: palette.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name="contactless" size={21} color={colours.onAccent} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ ...body(15, 650), color: palette.ink }}>{t('capture.fix.title')}</Text>
        <Text style={{ ...body(13), lineHeight: 17.5, color: palette.inkSoft }}>
          {t('capture.fix.body')}
        </Text>
      </View>
      <PressScale
        accessibilityRole="button"
        onPress={onSetUp}
        style={{
          height: 36,
          paddingHorizontal: 14,
          borderRadius: 99,
          backgroundColor: palette.btnBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ ...body(13, 650), color: palette.btnFg }}>{t('capture.fix.action')}</Text>
      </PressScale>
    </Animated.View>
  );
}

function SourceRow({
  source,
  first,
  onPress,
}: {
  readonly source: CaptureSourceView;
  readonly first: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const colours = captureColours(palette);
  return (
    <PressScale
      scaleTo={1}
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: palette.chipBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name={source.guide.icon} size={19} color={palette.ink} />
      </View>
      <View
        style={{
          flex: 1,
          minWidth: 0,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 11,
          borderTopWidth: 0.5,
          borderTopColor: first ? 'transparent' : palette.hair,
        }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text style={{ ...body(16), color: palette.ink }}>{source.name}</Text>
          <Text numberOfLines={1} style={{ ...body(12.5), color: palette.inkSoft }}>
            {source.sub}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={{ ...body(13, 650), color: source.on ? colours.ok : colours.warn }}>
            {t(source.on ? 'capture.status.on' : 'capture.status.off')}
          </Text>
          <Symbol name="chevron_right" size={18} color={palette.inkSoft} style={{ opacity: 0.6 }} />
        </View>
      </View>
    </PressScale>
  );
}

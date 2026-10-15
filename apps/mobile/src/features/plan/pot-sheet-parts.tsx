import { useEffect } from 'react';
import { Text, TextInput, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { formatShort, type Vnd } from '@6pm/domain';
import { categoryTile } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { easeOut } from '../../ui/motion/curves';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, families } from '../../ui/type/fonts';
import { swatch } from './plan-colours';
import type { PotFields } from './pot-sheet';
import { potReflow } from './pot-rows';

// A text field takes no font axes: the display face at its weight, size and tracking.
const NAME_SIZE = 30;
const BAR_W = 168;

/** The big tile (tap to pick an icon and colour), the name, and for a saved pot what it holds. */
export function PotHero({
  fields,
  placeholder,
  picking,
  saved,
  onTogglePick,
  onName,
  onFocusName,
}: {
  readonly fields: PotFields;
  readonly placeholder: string;
  readonly picking: boolean;
  readonly saved: Vnd | undefined;
  readonly onTogglePick: () => void;
  readonly onName: (name: string) => void;
  readonly onFocusName: () => void;
}) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const reduceMotion = useReducedMotion();
  const tile = categoryTile(fields.hue);
  const progress = saved === undefined || fields.goal <= 0 ? 0 : Math.min(1, saved / fields.goal);
  const fill = useSharedValue(progress);
  useEffect(() => {
    fill.value = withTiming(progress, { duration: reduceMotion ? 0 : 420, easing: easeOut });
  }, [progress, fill, reduceMotion]);
  const bar = useAnimatedStyle(() => ({ width: Math.max(4, fill.value * BAR_W) }));

  return (
    <View style={{ alignItems: 'center', gap: 12 }}>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={t('plan.pot.pickIcon')}
        accessibilityState={{ expanded: picking }}
        onPress={() => {
          haptics.tick();
          onTogglePick();
        }}
        style={{
          width: 76,
          height: 76,
          borderRadius: 26,
          experimental_backgroundImage: `linear-gradient(155deg, ${tile.from} 0%, ${tile.to} 100%)`,
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,.55), inset 0 -2px 0 rgba(60,20,40,.08), 0 8px 20px rgba(30,10,40,.22)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name={fields.icon} size={40} fill={1} weight={500} color={tile.glyph} />
        <View
          style={{
            position: 'absolute',
            right: -5,
            bottom: -5,
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: palette.btnBg,
            boxShadow: `0 0 0 3px ${palette.sheetSolid}`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name={picking ? 'check' : 'edit'} size={15} color={palette.btnFg} />
        </View>
      </PressScale>
      <TextInput
        value={fields.name}
        onChangeText={onName}
        onFocus={onFocusName}
        placeholder={placeholder}
        placeholderTextColor={palette.inkSoft}
        returnKeyType="done"
        style={{
          alignSelf: 'stretch',
          textAlign: 'center',
          padding: 0,
          fontFamily: families.display,
          fontSize: NAME_SIZE,
          fontWeight: '500',
          letterSpacing: -0.015 * NAME_SIZE,
          color: palette.ink,
        }}
      />
      {saved === undefined ? null : (
        <View style={{ alignItems: 'center', gap: 7, marginTop: -2 }}>
          <Text style={{ ...body(13.5, 600), color: palette.inkSoft }}>
            {t('plan.pot.saved', { amount: formatShort(saved, language) })}{' '}
            {t('plan.occasions.of', { amount: formatShort(fields.goal, language) })}
          </Text>
          <View
            style={{
              width: BAR_W,
              height: 6,
              borderRadius: 3,
              backgroundColor: palette.chipBg,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={[{ height: 6, borderRadius: 3, backgroundColor: swatch(fields.hue) }, bar]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

export interface PotSummaryContent {
  readonly title: string;
  readonly sub: string;
  /** The set-aside is more than the month has free: why, and the soonest month that fits. */
  readonly warn?: { readonly text: string; readonly action?: PotSummaryAction } | undefined;
}

interface PotSummaryAction {
  readonly label: string;
  readonly onPress: () => void;
}

/** What the pot will set aside and what that does to a day; a warning when it is too much. */
export function PotSummary({ content }: { readonly content: PotSummaryContent }) {
  const { palette } = useTheme();
  const { warn } = content;
  return (
    <Animated.View
      layout={potReflow}
      style={{ alignItems: 'center', gap: 3, paddingHorizontal: 10 }}
    >
      <Text style={{ ...body(15.5, 650), color: palette.ink, textAlign: 'center' }}>
        {content.title}
      </Text>
      <Text style={{ ...body(13), lineHeight: 18.2, color: palette.inkSoft, textAlign: 'center' }}>
        {content.sub}
      </Text>
      {warn ? (
        <Animated.View
          entering={FadeIn.duration(220)}
          exiting={FadeOut.duration(140)}
          style={{ alignItems: 'center', gap: 10, marginTop: 10 }}
        >
          <Text
            style={{ ...body(13, 600), lineHeight: 18.2, color: palette.ink, textAlign: 'center' }}
          >
            {warn.text}
          </Text>
          {warn.action ? (
            <PressScale
              accessibilityRole="button"
              onPress={() => {
                haptics.tick();
                warn.action?.onPress();
              }}
              style={{
                height: 32,
                paddingHorizontal: 14,
                borderRadius: 99,
                backgroundColor: palette.chipBg,
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(13, 650), color: palette.ink }}>{warn.action.label}</Text>
            </PressScale>
          ) : null}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

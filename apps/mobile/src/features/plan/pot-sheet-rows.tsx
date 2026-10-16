import { useEffect, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { categoryTile } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { easeOut } from '../../ui/motion/curves';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';
import { potReflow, potRow } from './pot-rows';
import type { PotFields } from './pot-sheet';

/**
 * The header while an editor is open: the tile shrinks to a row beside the name and what the pot
 * holds, so the keypad fits without scrolling. A tap on it closes the editor.
 */
export function PotHeroRow({
  fields,
  savedLine,
  onPress,
}: {
  readonly fields: PotFields;
  /** "450tr saved" */
  readonly savedLine: string | undefined;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  const tile = categoryTile(fields.hue);
  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
      <PressScale
        scaleTo={0.98}
        accessibilityRole="button"
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            experimental_backgroundImage: `linear-gradient(155deg, ${tile.from} 0%, ${tile.to} 100%)`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name={fields.icon} size={24} fill={1} weight={500} color={tile.glyph} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text numberOfLines={1} style={{ ...display(20, 500), color: palette.ink }}>
            {fields.name}
          </Text>
          {savedLine ? (
            <Text style={{ ...body(12.5), color: palette.inkSoft }}>{savedLine}</Text>
          ) : null}
        </View>
      </PressScale>
    </Animated.View>
  );
}

/**
 * A row that opens an editor under it. Closed: the label, the value (and a line under it while
 * nothing is open) and a chevron. Open: the label and the chevron turned up, the editor showing
 * the value itself.
 */
export function EditorRow({
  label,
  value,
  sub,
  open,
  onPress,
  hint,
  first,
}: {
  readonly label: string;
  readonly value: string;
  readonly sub?: string | undefined;
  readonly open: boolean;
  readonly onPress: () => void;
  /** What a tap does, for VoiceOver. */
  readonly hint: string;
  readonly first?: boolean;
}) {
  const { palette } = useTheme();
  const reduceMotion = useReducedMotion();
  const angle = useSharedValue(open ? 180 : 0);
  useEffect(() => {
    angle.value = withTiming(open ? 180 : 0, { duration: reduceMotion ? 0 : 240, easing: easeOut });
  }, [open, angle, reduceMotion]);
  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  return (
    <Animated.View layout={potReflow}>
      <PressScale
        highlight
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: sub ? `${value}, ${sub}` : value }}
        accessibilityHint={hint}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          haptics.tick();
          onPress();
        }}
        style={[
          potRow,
          { minHeight: open ? 52 : 58 },
          first ? null : { borderTopWidth: 0.5, borderColor: palette.hair },
        ]}
      >
        <Text style={{ ...body(16), flex: 1, color: palette.ink }}>{label}</Text>
        {open ? null : (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(100)}
            style={{ alignItems: 'flex-end', paddingVertical: 10, flexShrink: 1 }}
          >
            <Text numberOfLines={1} style={{ ...body(17, 650), ...tabular, color: palette.ink }}>
              {value}
            </Text>
            {sub ? (
              <Text numberOfLines={1} style={{ ...body(12.5), color: palette.inkSoft }}>
                {sub}
              </Text>
            ) : null}
          </Animated.View>
        )}
        <Animated.View style={turn}>
          <Symbol name="expand_more" size={22} color={palette.inkSoft} />
        </Animated.View>
      </PressScale>
    </Animated.View>
  );
}

/** A card of its own under the pot's card: pause (and a goal's share of Future you). */
export function PotSettingsCard({ children }: { readonly children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <Animated.View
      layout={potReflow}
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(140)}
      style={{
        borderRadius: 22,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        overflow: 'hidden',
      }}
    >
      {children}
    </Animated.View>
  );
}

/** The pause row: what pausing does, and the switch. */
export function PauseRow({
  label,
  first,
  control,
}: {
  readonly label: string;
  readonly first?: boolean;
  readonly control: ReactNode;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={[
        potRow,
        { paddingVertical: 8 },
        first ? null : { borderTopWidth: 0.5, borderColor: palette.hair },
      ]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...body(16), color: palette.ink }}>{label}</Text>
        <Text style={{ ...body(12.5), lineHeight: 16.9, color: palette.inkSoft }}>
          {t('plan.pot.pauseSub')}
        </Text>
      </View>
      {control}
    </View>
  );
}

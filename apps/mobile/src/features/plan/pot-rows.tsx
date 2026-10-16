import { useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { Symbol } from '../../ui/icons/symbol';
import { easeOut } from '../../ui/motion/curves';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, tabular } from '../../ui/type/fonts';
import { RoundButton } from './new-pot-picker';

/** A row of a settings card: a label, then controls. */
export const potRow = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingHorizontal: 16,
  minHeight: 58,
} as const;

/** How the sheet reflows as a row opens or closes: the card grows and what is below slides. */
export const potReflow = LinearTransition.springify().damping(24).stiffness(260);

/** The card the rows sit on. */
export function PotCard({ children }: { readonly children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <Animated.View
      layout={potReflow}
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

/**
 * A row that opens an editor under it: the label, then the value (and a line under it) and a
 * chevron that turns as it opens.
 */
export function DisclosureRow({
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
      style={[potRow, first ? null : { borderTopWidth: 0.5, borderColor: palette.hair }]}
    >
      <Text style={{ ...body(16), flex: 1, color: palette.ink }}>{label}</Text>
      <View style={{ alignItems: 'flex-end', paddingVertical: 10, flexShrink: 1 }}>
        <Text numberOfLines={1} style={{ ...body(17, 650), ...tabular, color: palette.ink }}>
          {value}
        </Text>
        {sub ? (
          <Text numberOfLines={1} style={{ ...body(12.5), color: palette.inkSoft }}>
            {sub}
          </Text>
        ) : null}
      </View>
      <Animated.View style={turn}>
        <Symbol name="expand_more" size={22} color={palette.inkSoft} />
      </Animated.View>
    </PressScale>
  );
}

/** A "label  −  value  +" row. */
export function StepperRow({
  label,
  value,
  lessLabel,
  moreLabel,
  dimLess,
  dimMore,
  onStep,
  width,
  first,
}: {
  readonly label: string;
  readonly value: string;
  readonly lessLabel: string;
  readonly moreLabel: string;
  readonly dimLess?: boolean;
  readonly dimMore?: boolean;
  readonly onStep: (by: 1 | -1) => void;
  readonly width: number;
  readonly first?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View style={[potRow, first ? null : { borderTopWidth: 0.5, borderColor: palette.hair }]}>
      <Text style={{ ...body(16), flex: 1, color: palette.ink }}>{label}</Text>
      <RoundButton
        icon="remove"
        filled
        dim={dimLess ?? false}
        label={lessLabel}
        onPress={() => {
          haptics.tick();
          onStep(-1);
        }}
      />
      <Text
        style={{
          ...display(22, 500),
          ...tabular,
          minWidth: width,
          textAlign: 'center',
          color: palette.ink,
        }}
      >
        {value}
      </Text>
      <RoundButton
        icon="add"
        filled
        dim={dimMore ?? false}
        label={moreLabel}
        onPress={() => {
          haptics.tick();
          onStep(1);
        }}
      />
    </View>
  );
}

/** The top of an edit sheet: the grabber, Cancel and the title. */
export function SheetHeader({ title }: { readonly title: string }) {
  const router = useRouter();
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ paddingTop: 8, paddingHorizontal: 18, gap: 6 }}>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PressScale onPress={() => router.back()} style={{ width: 70, paddingVertical: 6 }}>
          <Text style={{ ...body(16), color: palette.inkSoft }}>{t('quick.cancel')}</Text>
        </PressScale>
        <Text style={{ ...body(17, 650), color: palette.ink }}>{title}</Text>
        <View style={{ width: 70 }} />
      </View>
    </View>
  );
}

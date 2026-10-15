import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import type { StringKey } from '@6pm/i18n';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import { CATCH_WAYS, needsSetup, WAY_ICON, type CatchWay } from './catch-ways';
import type { OnboardingPalette } from './onboarding-palette';

const PAD = 4;

const TAB = {
  scan: 'onboarding.catch.scan.tab',
  share: 'onboarding.catch.share.tab',
  wallet: 'onboarding.catch.wallet.tab',
  email: 'onboarding.catch.email.tab',
  add: 'onboarding.catch.add.tab',
  lock: 'onboarding.catch.lock.tab',
} as const satisfies Readonly<Record<CatchWay, StringKey>>;

/** How close the cards' scroll is to this way's card: 1 on it, 0 a card or more away. */
function useNear(x: SharedValue<number>, page: number, index: number) {
  return useAnimatedStyle(() => {
    const near = Math.max(0, 1 - Math.abs(x.value / page - index));
    return { opacity: 0.55 + 0.45 * near };
  });
}

function RailItem({
  way,
  index,
  selected,
  x,
  page,
  pal,
  onPick,
}: {
  readonly way: CatchWay;
  readonly index: number;
  readonly selected: boolean;
  readonly x: SharedValue<number>;
  readonly page: number;
  readonly pal: OnboardingPalette;
  readonly onPick: (index: number) => void;
}) {
  const { t } = useI18n();
  const near = useNear(x, page, index);
  const label = t(TAB[way]);
  return (
    <PressScale
      scaleTo={0.92}
      onPress={() => onPick(index)}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[{ height: 50, alignItems: 'center', justifyContent: 'center', gap: 3 }, near]}
      >
        <View>
          <Symbol name={WAY_ICON[way]} size={20} color={pal.ink} />
          {/* Green works already; the warm accent takes a minute to set up. */}
          <View
            style={{
              position: 'absolute',
              top: -1,
              right: -6,
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: needsSetup(way) ? pal.accent : pal.green,
            }}
          />
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={{ ...body(11, 650), color: pal.ink, paddingHorizontal: 2 }}
        >
          {label}
        </Text>
      </Animated.View>
    </PressScale>
  );
}

/**
 * Every way at a glance, above the cards: a tab per way with a dot for ready or set-up, and a
 * lit pill that slides under the finger as the cards scroll. A tab brings its card in.
 */
export function CatchRail({
  pal,
  x,
  page,
  selected,
  onPick,
}: {
  readonly pal: OnboardingPalette;
  /** The cards' scroll offset. */
  readonly x: SharedValue<number>;
  /** One card and its gap. */
  readonly page: number;
  readonly selected: number;
  readonly onPick: (index: number) => void;
}) {
  const inner = useSharedValue(0);
  const count = CATCH_WAYS.length;
  const pill = useAnimatedStyle(() => {
    const column = inner.value / count;
    const at = Math.max(0, Math.min(count - 1, x.value / page));
    return {
      width: column,
      opacity: inner.value > 0 ? 1 : 0,
      transform: [{ translateX: at * column }],
    };
  });
  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => inner.set(e.nativeEvent.layout.width - 2 * PAD)}
      style={{
        flexDirection: 'row',
        padding: PAD,
        borderRadius: 20,
        backgroundColor: pal.chipBg,
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: PAD,
            bottom: PAD,
            left: PAD,
            borderRadius: 16,
            backgroundColor: pal.segOn,
            boxShadow: pal.segShadow,
          },
          pill,
        ]}
      />
      {CATCH_WAYS.map((way, i) => (
        <RailItem
          key={way}
          way={way}
          index={i}
          selected={i === selected}
          x={x}
          page={page}
          pal={pal}
          onPick={onPick}
        />
      ))}
    </View>
  );
}

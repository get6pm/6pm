import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';

import { findBank } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import { popEntering } from './onboarding-motion';
import type { OnboardingPalette } from './onboarding-palette';
import { Grid3, StepHeading } from './step-parts';

/** The wallet code for money that never touches a bank. */
export const CASH = 'CASH';
/** Cash's monogram tile, as the prototype tints it. */
const CASH_TINT = '#b8895a';

/** The banks and wallets offered, with the prototype's short monograms. */
const OFFERED = [
  ['MB', 'MB'],
  ['VCB', 'VCB'],
  ['TCB', 'TCB'],
  ['VPB', 'VP'],
  ['ACB', 'ACB'],
  ['BIDV', 'BIDV'],
  ['MOMO', 'Mo'],
  ['ZALOPAY', 'Zalo'],
  [CASH, '₫'],
] as const;

interface Tile {
  readonly id: string;
  readonly label: string;
  readonly mono: string;
  readonly tint: string;
}

function BankTile({
  tile,
  on,
  pal,
  onPress,
}: {
  readonly tile: Tile;
  readonly on: boolean;
  readonly pal: OnboardingPalette;
  readonly onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const border = useAnimatedStyle(() => ({
    borderColor: withTiming(on ? pal.accent : pal.accentClear, { duration: 200 }),
  }));
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={tile.label}
    >
      <Animated.View
        style={[
          {
            height: 92,
            borderRadius: 22,
            borderWidth: 2,
            backgroundColor: pal.cell,
            boxShadow: pal.cardShadow,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          },
          border,
        ]}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            backgroundColor: tile.tint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(12, 800, -0.02), color: pal.white }}>{tile.mono}</Text>
        </View>
        <Text numberOfLines={1} style={{ ...body(13, 650), color: pal.ink }}>
          {tile.label}
        </Text>
      </Animated.View>
      {on ? (
        <Animated.View
          entering={popEntering(350, 0, reduceMotion)}
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: pal.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="check" size={15} color={pal.onAccent} />
        </Animated.View>
      ) : null}
    </PressScale>
  );
}

/** What do you pay with: bank and wallet tiles, pick as many as apply. */
export function StepPayWith({
  pal,
  wallets,
  onToggle,
}: {
  readonly pal: OnboardingPalette;
  readonly wallets: readonly string[];
  readonly onToggle: (id: string) => void;
}) {
  const { t } = useI18n();
  const tiles: Tile[] = OFFERED.map(([id, mono]) => {
    if (id === CASH) return { id, mono, label: t('onboarding.wallets.cash'), tint: CASH_TINT };
    const bank = findBank(id);
    return { id, mono, label: bank?.shortName ?? id, tint: bank?.color ?? CASH_TINT };
  });
  return (
    <View style={{ gap: 14 }}>
      <StepHeading
        title={t('onboarding.wallets.title')}
        sub={t('onboarding.wallets.sub')}
        pal={pal}
      />
      <View style={{ paddingTop: 4 }}>
        <Grid3
          items={tiles}
          gap={8}
          render={(tile) => (
            <BankTile
              tile={tile}
              on={wallets.includes(tile.id)}
              pal={pal}
              onPress={() => onToggle(tile.id)}
            />
          )}
        />
      </View>
    </View>
  );
}

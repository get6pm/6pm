import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition, ReduceMotion } from 'react-native-reanimated';

import {
  homeKeypad,
  keypadHomeMinor,
  likelyCategoriesAt,
  lineUsed,
  pressKey,
  type DailyNumber,
} from '@6pm/domain';

import { useMoney, useMoneyActions } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { haptics } from '../../ui/haptics';
import { useFoldForm } from '../../ui/layout/fold';
import type { Half } from '../../ui/layout/fold-form';
import { useDesignInsets } from '../../ui/layout/design-insets';
import { FitWidth } from '../../ui/layout/fit-width';
import { GlassButton } from '../../ui/primitives/glass-button';
import { PressScale } from '../../ui/primitives/press-scale';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, tabular } from '../../ui/type/fonts';
import { useRunAction } from '../companion/use-run-action';
import { typedText } from '../quick-add/typed-amount';
import { MarketKeys } from './market-keys';
import { CASH_WALLET } from '../quick-add/wallet-options';

const chipIn = FadeInDown.duration(300).reduceMotion(ReduceMotion.System);
const settle = LinearTransition.duration(250).reduceMotion(ReduceMotion.System);

/**
 * The iPhone Duo standing on a counter, half open with the fold across: what is left for today in
 * numbers readable from a step away on the top half, and on the flat half a keypad and the hour's
 * likely categories. Each Add is saved as a cash spend at once and the number goes down.
 */
export function MarketMode({
  day,
  top,
  bottom,
  onLeave,
}: {
  readonly day: DailyNumber;
  readonly top: Half;
  readonly bottom: Half;
  readonly onLeave: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const { hour } = useClock();
  const { insets } = useDesignInsets();
  const snap = useMoney();
  const actions = useMoneyActions();
  const run = useRunAction();
  const [keys, setKeys] = useState(() => homeKeypad(money.currency));
  const [added, setAdded] = useState<readonly { id: string; name: string; amount: number }[]>([]);
  // The hour's likely categories, settled as the counter opens so they never shift under a finger.
  const [chips] = useState(() => {
    const likely = likelyCategoriesAt(hour).map((name) => name.toLowerCase());
    return [...snap.categories]
      .sort((a, b) => (likely.indexOf(a.id) + 1 || 9) - (likely.indexOf(b.id) + 1 || 9))
      .slice(0, 4);
  });
  const [picked, setPicked] = useState(chips[0]?.id ?? '');
  const category = snap.categories.find((c) => c.id === picked);
  const amount = keypadHomeMinor(keys);
  const left = Math.max(0, day.safe);

  const add = () => {
    if (amount <= 0 || !category) return;
    const typed = { id: `${Date.now()}`, name: category.name, amount };
    setKeys(homeKeypad(money.currency));
    void run(() =>
      actions.addSpend({
        amount,
        categoryId: category.id,
        merchant: category.name,
        source: 'manual',
        status: 'kept',
        wallet: CASH_WALLET,
      }),
    ).then((saved) => {
      if (!saved) return;
      haptics.success();
      setAdded((list) => [typed, ...list].slice(0, 4));
    });
  };

  return (
    <View style={{ position: 'absolute', inset: 0, experimental_backgroundImage: palette.skyDeep }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: top.y,
          height: top.height,
          // Clear of the camera and the status bar at the top of the upright screen.
          paddingTop: Math.max(18, insets.top),
          paddingHorizontal: 24,
          paddingBottom: 30,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <GlassButton icon="close" label={t('duo.market.leave')} onPress={onLeave} />
          <Text style={{ flex: 1, textAlign: 'center', ...body(16, 650), color: palette.ink }}>
            {t('duo.market.title')}
          </Text>
          <PressScale
            accessibilityRole="button"
            onPress={onLeave}
            style={{
              height: 44,
              paddingHorizontal: 16,
              borderRadius: 99,
              backgroundColor: palette.btnBg,
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(15, 650), color: palette.btnFg }}>{t('common.done')}</Text>
          </PressScale>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Text style={{ ...body(18, 500), color: palette.inkSoft }}>{t('duo.market.left')}</Text>
          <FitWidth height={156} align="center">
            <Text
              style={{
                ...leading(display(170, 400, -0.04), 153, true),
                ...tabular,
                color: palette.ink,
              }}
            >
              {money.short(left)}
            </Text>
          </FitWidth>
          <View
            style={{
              width: 340,
              maxWidth: '100%',
              height: 8,
              borderRadius: 8,
              backgroundColor: palette.hair,
              overflow: 'hidden',
              marginTop: 12,
            }}
          >
            <View
              style={{
                height: 8,
                borderRadius: 8,
                width: `${(1 - lineUsed(day)) * 100}%`,
                backgroundColor: palette.accent,
              }}
            />
          </View>
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            minHeight: 34,
            flexWrap: 'wrap',
          }}
        >
          {added.map((a) => (
            <Animated.View
              key={a.id}
              entering={chipIn}
              layout={settle}
              style={{
                height: 34,
                paddingHorizontal: 13,
                borderRadius: 99,
                backgroundColor: palette.glass,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ ...body(14, 600), color: palette.ink }}>{a.name}</Text>
              <Text style={{ ...body(14, 600), ...tabular, color: palette.inkSoft }}>
                −{money.short(a.amount)}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: bottom.y,
          height: bottom.height,
          backgroundColor: palette.sheetSolid,
          paddingTop: 34,
          paddingHorizontal: 28,
          paddingBottom: 26,
          gap: 16,
        }}
      >
        <MarketKeys
          typed={typedText(keys.digits, money)}
          ready={amount > 0}
          onAdd={add}
          chips={chips}
          picked={picked}
          onPick={setPicked}
          onKey={(key) => setKeys((k) => pressKey(k, key))}
        />
      </View>
    </View>
  );
}

/**
 * Market mode while the iPhone Duo stands half open with the fold across. Left with Done or the
 * close button, it stays away until the phone is held another way and stood up again.
 */
export function StandCounter({ day }: { readonly day: DailyNumber }) {
  const form = useFoldForm();
  const standing = form.kind === 'stand';
  const [left, setLeft] = useState(false);
  const [wasStanding, setWasStanding] = useState(standing);
  if (standing !== wasStanding) {
    setWasStanding(standing);
    if (!standing) setLeft(false);
  }
  if (form.kind !== 'stand' || left) return null;
  return <MarketMode day={day} top={form.top} bottom={form.bottom} onLeave={() => setLeft(true)} />;
}

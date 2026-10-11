import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { formatVnd } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { Companion } from '../../ui/companion/companion';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { Sky } from '../../ui/sky/sky';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, display } from '../../ui/type/fonts';
import type { HandoffResult } from './bank-handoff';
import { sheetUp } from './scan-card';
import { scanColours as c } from './scan-colours';
import type { Payment } from './use-scan';

function Spinner() {
  const { palette } = useTheme();
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(turn);
  }, [turn]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 360}deg` }] }));
  return (
    <Animated.View
      style={[
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 2.5,
          borderColor: c.spinnerTrack,
          borderTopColor: palette.accent,
        },
        style,
      ]}
    />
  );
}

/**
 * While the bank app takes over: "Opening MB Bank…" over the dimmed camera. When 6pm has no link
 * to the bank, or it is not installed, the line says so and an "I'm back" button waits instead.
 */
export function ScanHandoff({
  payment,
  result,
  onBack,
}: {
  readonly payment: Payment;
  readonly result: HandoffResult | null;
  readonly onBack: () => void;
}) {
  const { t } = useI18n();
  const wallet = payment.bank?.shortName;
  const line =
    wallet === undefined
      ? t('scan.handoff.bankApp')
      : result === 'manual'
        ? t('scan.handoff.manual', { wallet })
        : result === 'store'
          ? t('scan.handoff.store', { wallet })
          : t('scan.handoff.opening', { wallet });
  const waiting = result === 'manual' || result === 'store';
  return (
    <Animated.View entering={FadeIn.duration(300)} style={StyleSheet.absoluteFill}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <View
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: c.handoffVeil,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          paddingHorizontal: 24,
        }}
      >
        {waiting ? null : <Spinner />}
        <Text
          accessibilityRole="header"
          style={{ ...display(30, 500), color: c.text, textAlign: 'center' }}
        >
          {line}
        </Text>
        <Text style={{ ...body(14), color: c.sub, textAlign: 'center' }}>
          {t('scan.handoff.copied')}
        </Text>
        {waiting ? (
          <PressScale
            accessibilityRole="button"
            onPress={onBack}
            style={{
              marginTop: 8,
              height: 44,
              paddingHorizontal: 20,
              borderRadius: 99,
              backgroundColor: c.typeButton,
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(15, 600), color: c.onGlass }}>{t('scan.handoff.back')}</Text>
          </PressScale>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Back from the bank: "Did it go through?" on the day's sky, with Paid, Not yet and Cancelled. */
export function ScanReturn({
  payment,
  onAnswer,
}: {
  readonly payment: Payment;
  readonly onAnswer: (answer: 'paid' | 'later' | 'cancelled') => void;
}) {
  const { t } = useI18n();
  const { palette, look, serious } = useTheme();
  const { hour } = useClock();
  const amount = formatVnd(payment.amount);
  const wallet = payment.bank?.shortName;
  const chip = {
    flex: 1,
    height: 50,
    borderRadius: 99,
    backgroundColor: palette.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  } as const;
  return (
    <Animated.View entering={FadeIn.duration(350)} style={StyleSheet.absoluteFill}>
      <Sky look={look} hour={hour} serious={serious} showSun={false} />
      <View style={{ flex: 1, justifyContent: 'flex-end', padding: 8 }}>
        <Animated.View
          entering={sheetUp}
          style={{
            gap: 14,
            paddingTop: 26,
            paddingHorizontal: 20,
            paddingBottom: 20,
            borderRadius: 44,
            backgroundColor: palette.sheetSolid,
            borderWidth: 0.5,
            borderColor: palette.glassBorder,
          }}
        >
          <Companion size={56} mood={serious ? 'plain' : 'calm'} serious={serious} />
          <Text style={{ ...display(38, 500, -0.01), lineHeight: 40, color: palette.ink }}>
            {t('scan.return.title')}
          </Text>
          <Text style={{ ...body(15), color: palette.inkSoft }}>
            {wallet
              ? t('scan.return.to', { amount, payee: payment.payee, wallet })
              : t('scan.return.toPlain', { amount, payee: payment.payee })}
          </Text>
          <PressScale
            accessibilityRole="button"
            onPress={() => {
              haptics.success();
              onAnswer('paid');
            }}
            style={{
              height: 56,
              borderRadius: 99,
              backgroundColor: palette.btnBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(17, 650), color: palette.btnFg }}>{t('scan.return.paid')}</Text>
          </PressScale>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PressScale accessibilityRole="button" onPress={() => onAnswer('later')} style={chip}>
              <Text style={{ ...body(15, 600), color: palette.ink }}>{t('scan.return.later')}</Text>
            </PressScale>
            <PressScale
              accessibilityRole="button"
              onPress={() => onAnswer('cancelled')}
              style={chip}
            >
              <Text style={{ ...body(15, 600), color: palette.ink }}>
                {t('scan.return.cancelled')}
              </Text>
            </PressScale>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

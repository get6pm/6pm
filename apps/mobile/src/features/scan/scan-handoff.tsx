import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
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
import { BankLogo } from '../../ui/bank-logo/bank-logo';
import { Companion } from '../../ui/companion/companion';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { Sky } from '../../ui/sky/sky';
import { useClock } from '../../ui/theme/clock';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import type { Handoff } from './bank-handoff';
import { sheetUp } from './scan-card';
import { scanColours as c } from './scan-colours';
import type { Payment } from './use-scan';

function Spinner({ size = 40 }: { readonly size?: number }) {
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
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2.5,
          borderColor: c.spinnerTrack,
          borderTopColor: palette.accent,
        },
        style,
      ]}
    />
  );
}

/** The bank's logo, ringed by the spinner while its app is opening. */
function BankBadge({ id, spinning }: { readonly id: string; readonly spinning: boolean }) {
  return (
    <View style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
      {spinning ? (
        <View style={StyleSheet.absoluteFill}>
          <Spinner size={72} />
        </View>
      ) : null}
      <BankLogo id={id} size={52} radius={16} neutral={c.glass} neutralInk={c.text} />
    </View>
  );
}

/** After this long without the bank app taking over, "I'm back" is offered anyway. */
const BACK_AFTER_MS = 4000;

/**
 * While the bank app takes over: "Opening MB Bank…" over the dimmed camera. When 6pm has no link
 * to the bank, or it is not installed, the line says so and an "I'm back" button waits instead.
 * Below, what travels with the payment: the QR saved to Photos, or the copied amount.
 */
export function ScanHandoff({
  payment,
  handoff,
  onBack,
}: {
  readonly payment: Payment;
  readonly handoff: Handoff | null;
  readonly onBack: () => void;
}) {
  const { t } = useI18n();
  const result = handoff?.result ?? null;
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
  // The bank app may open and never hand control back: the way out always appears.
  const [late, setLate] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLate(true), BACK_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);
  const canGoBack = waiting || late;
  const shown = useSharedValue(0);
  useEffect(() => {
    shown.value = withTiming(canGoBack ? 1 : 0, { duration: 250, easing: Easing.out(Easing.quad) });
  }, [canGoBack, shown]);
  const backSlot = useAnimatedStyle(() => ({ opacity: shown.value }));
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
        {payment.bank ? (
          <BankBadge id={payment.bank.id} spinning={!waiting} />
        ) : waiting ? null : (
          <Spinner />
        )}
        <Text
          accessibilityRole="header"
          style={{ ...display(30, 500), color: c.text, textAlign: 'center' }}
        >
          {line}
        </Text>
        <Text style={{ ...body(14), color: c.sub, textAlign: 'center' }}>
          {t(handoff?.qrSaved ? 'scan.handoff.savedQr' : 'scan.handoff.copied')}
        </Text>
        {/* The slot is always there, so the text above never shifts when the button appears. */}
        <Animated.View
          pointerEvents={canGoBack ? 'auto' : 'none'}
          accessibilityElementsHidden={!canGoBack}
          importantForAccessibility={canGoBack ? 'auto' : 'no-hide-descendants'}
          style={[{ marginTop: 8, height: 44 }, backSlot]}
        >
          <PressScale
            accessibilityRole="button"
            onPress={onBack}
            style={{
              height: 44,
              paddingHorizontal: 20,
              borderRadius: 99,
              backgroundColor: c.typeButton,
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(15, 600), color: c.onGlass }}>{t('scan.handoff.back')}</Text>
          </PressScale>
        </Animated.View>
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
          {!serious ? <Companion size={56} mood="calm" /> : null}
          <Text style={{ ...leading(display(38, 500, -0.01), 40), color: palette.ink }}>
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

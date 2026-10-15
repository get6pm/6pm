import { Canvas, Circle, Path } from '@shopify/react-native-skia';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { body, display, mono } from '../../ui/type/fonts';
import { box, ring, SAMPLE, TapRing, useSampleMoney } from './catch-demo-kit';
import { useLoop } from './onboarding-motion';
import { DEMO, type OnboardingPalette } from './onboarding-palette';

/** `slideMail`: a receipt email sits, then slides right and fades as if forwarded, every 3 s. */
function MailRow({
  delay,
  dot,
  from,
  line,
}: {
  readonly delay: number;
  readonly dot: string;
  readonly from: string;
  readonly line: string;
}) {
  const phase = useLoop(3000, delay, 0);
  const style = useAnimatedStyle(() => {
    const p = phase.value;
    const k = p <= 0.2 ? 0 : p >= 0.55 ? 1 : (p - 0.2) / 0.35;
    return { opacity: 1 - k, transform: [{ translateX: 70 * k }] };
  });
  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderRadius: 12,
          backgroundColor: DEMO.receipt,
        },
        style,
      ]}
    >
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: dot }} />
      <View style={{ flex: 1 }}>
        <Text style={{ ...body(12, 650), color: DEMO.paperInk }}>{from}</Text>
        <Text style={{ ...body(12), opacity: 0.6, color: DEMO.paperInk }}>{line}</Text>
      </View>
    </Animated.View>
  );
}

export function EmailDemo() {
  const { t } = useI18n();
  const sample = useSampleMoney();
  return (
    <View style={[box, { backgroundColor: DEMO.mailBg, padding: 14, gap: 8 }]}>
      <MailRow
        delay={0}
        dot={DEMO.mailGrab}
        from="Grab"
        line={t('onboarding.catch.email.receipt', { amount: sample.full(SAMPLE.grab) })}
      />
      <MailRow
        delay={1500}
        dot={DEMO.mailShopee}
        from="Shopee"
        line={t('onboarding.catch.email.order', { amount: sample.full(SAMPLE.shopee) })}
      />
      <View style={{ flex: 1 }} />
      <View
        style={{
          alignSelf: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 30,
          paddingHorizontal: 12,
          borderRadius: 99,
          backgroundColor: DEMO.addressBg,
        }}
      >
        <Symbol name="forward_to_inbox" size={15} color={DEMO.addressInk} />
        <Text style={{ ...mono(11.5, 400), color: DEMO.addressInk }}>
          {t('onboarding.catch.email.address')}
        </Text>
      </View>
    </View>
  );
}

export function LockDemo({
  pal,
  date,
  time,
  safe,
}: {
  readonly pal: OnboardingPalette;
  readonly date: string;
  readonly time: string;
  readonly safe: string;
}) {
  const { t } = useI18n();
  const ink = DEMO.lockInk;
  const round = {
    position: 'absolute',
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  } as const;
  return (
    <View
      style={[
        box,
        { experimental_backgroundImage: DEMO.lockBg, alignItems: 'center', paddingTop: 14, gap: 2 },
      ]}
    >
      <Text style={{ ...body(11, 600), opacity: 0.85, color: ink }}>{date}</Text>
      <Text style={{ ...display(50, 500, -0.03), lineHeight: 50, color: ink }}>{time}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TapRing size={44} radius={22}>
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Canvas style={StyleSheet.absoluteFill}>
              <Circle cx={22} cy={22} r={22} color={DEMO.lockRingTrack} />
              <Path path={ring()} color={ink} />
            </Canvas>
            <View
              style={{
                width: 37,
                height: 37,
                borderRadius: 18.5,
                backgroundColor: DEMO.lockRingCore,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(11, 700), color: ink }}>{safe}</Text>
            </View>
          </View>
        </TapRing>
        <View
          style={{
            width: 96,
            height: 44,
            borderRadius: 13,
            backgroundColor: DEMO.lockWidget,
            paddingVertical: 6,
            paddingHorizontal: 9,
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(9, 600), opacity: 0.75, color: ink }}>
            {t('onboarding.catch.lock.safe')}
          </Text>
          <Text style={{ ...display(17, 500), lineHeight: 17, color: ink }}>{safe}</Text>
        </View>
      </View>
      <View style={[round, { left: 18, backgroundColor: DEMO.lockButton }]}>
        <Symbol name="flashlight_on" size={16} color={ink} />
      </View>
      <View style={[round, { right: 18, backgroundColor: pal.accent }]}>
        <Symbol name="qr_code_scanner" size={16} color={pal.onAccent} />
      </View>
    </View>
  );
}

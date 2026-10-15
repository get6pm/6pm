import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { formatVnd } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { AppIconImage } from '../../ui/app-icon-image';
import { Symbol } from '../../ui/icons/symbol';
import { body, display, mono } from '../../ui/type/fonts';
import { box, SAMPLE, step, TapRing } from './catch-demo-kit';
import { useLoop } from './onboarding-motion';
import { DEMO, tileOf, type OnboardingPalette } from './onboarding-palette';

/** The drinks tile, for the spoken coffee. */
const DRINKS = tileOf(25);

/**
 * An Apple Pay tap: the card dips to the reader, then 6pm's banner drops in with the shop and
 * the amount, holds, and slides away, every 3.6 s. Held on the banner under Reduce Motion.
 */
export function WalletDemo() {
  const { t } = useI18n();
  const phase = useLoop(3600, 0, 0.6);
  const card = useAnimatedStyle(() => {
    const p = phase.value;
    const dip = step(p, 0.08, 0.2) * (1 - step(p, 0.2, 0.34));
    return { transform: [{ translateY: 7 * dip }, { scale: 1 - 0.04 * dip }] };
  });
  const banner = useAnimatedStyle(() => {
    const p = phase.value;
    const k = step(p, 0.3, 0.42) * (1 - step(p, 0.84, 0.96));
    return { opacity: k, transform: [{ translateY: -56 * (1 - k) }] };
  });
  const ink = DEMO.walletCardInk;
  return (
    <View
      style={[
        box,
        { backgroundColor: DEMO.walletBg, alignItems: 'center', justifyContent: 'flex-end' },
      ]}
    >
      <Animated.View
        style={[
          {
            width: 156,
            height: 98,
            marginBottom: 18,
            borderRadius: 12,
            experimental_backgroundImage: DEMO.walletCard,
            boxShadow: DEMO.walletCardShadow,
            padding: 11,
            justifyContent: 'space-between',
          },
          card,
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Symbol name="contactless" size={20} color={ink} />
        </View>
        <Text style={{ ...mono(11, 400, 0.12), color: ink, opacity: 0.85 }}>•••• 4821</Text>
      </Animated.View>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            height: 48,
            borderRadius: 15,
            backgroundColor: DEMO.bannerBg,
            boxShadow: DEMO.bannerShadow,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            gap: 9,
          },
          banner,
        ]}
      >
        <AppIconImage size={28} radius={7} />
        <View style={{ flex: 1 }}>
          <Text style={{ ...body(11.5, 700), color: DEMO.paperInk }}>6pm</Text>
          <Text numberOfLines={1} style={{ ...body(11.5), color: DEMO.paperInk, opacity: 0.75 }}>
            {t('onboarding.catch.wallet.logged', {
              merchant: SAMPLE.tapMerchant,
              amount: formatVnd(SAMPLE.tap),
            })}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * Saying a spend: the words come up in a bubble, the spend they make pops in under them, and
 * both clear for the next go, every 3.4 s. Held with both showing under Reduce Motion.
 */
export function VoiceDemo({ pal }: { readonly pal: OnboardingPalette }) {
  const { t } = useI18n();
  const phase = useLoop(3400, 0, 0.6);
  const said = useAnimatedStyle(() => {
    const p = phase.value;
    const k = step(p, 0.06, 0.2) * (1 - step(p, 0.86, 0.96));
    return { opacity: k, transform: [{ translateY: 8 * (1 - k) }] };
  });
  const spend = useAnimatedStyle(() => {
    const p = phase.value;
    const k = step(p, 0.4, 0.52);
    const out = 1 - step(p, 0.86, 0.96);
    return { opacity: k * out, transform: [{ scale: 0.9 + 0.1 * k }] };
  });
  return (
    <View
      style={[
        box,
        {
          backgroundColor: DEMO.voiceBg,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          paddingHorizontal: 18,
        },
      ]}
    >
      <Animated.View
        style={[
          {
            borderRadius: 14,
            backgroundColor: DEMO.voiceBubble,
            paddingVertical: 7,
            paddingHorizontal: 12,
          },
          said,
        ]}
      >
        <Text style={{ ...body(14, 600), color: DEMO.paperInk }}>
          {t('onboarding.catch.add.said')}
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          {
            alignSelf: 'stretch',
            height: 46,
            borderRadius: 14,
            backgroundColor: DEMO.receipt,
            boxShadow: DEMO.receiptShadow,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 8,
            gap: 9,
          },
          spend,
        ]}
      >
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            experimental_backgroundImage: DRINKS.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="local_cafe" size={17} color={DRINKS.glyph} />
        </View>
        <Text style={{ ...body(13.5, 650), color: DEMO.paperInk, flex: 1 }}>
          {t('onboarding.catch.add.item')}
        </Text>
        <Text style={{ ...display(16, 600), color: DEMO.paperInk }}>{formatVnd(SAMPLE.said)}</Text>
      </Animated.View>
      <TapRing size={46} radius={23}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: pal.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="mic" size={22} color={pal.onAccent} />
        </View>
      </TapRing>
    </View>
  );
}

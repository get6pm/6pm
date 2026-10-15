import { Canvas, Group, Path, Rect, rect, rrect } from '@shopify/react-native-skia';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { formatVnd } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { body, display, mono } from '../../ui/type/fonts';
import { AppIconImage } from '../../ui/app-icon-image';
import { box, checker, H, inOut, SAMPLE, stripes, TapRing, W } from './catch-demo-kit';
import { useLoop } from './onboarding-motion';
import { DEMO, type OnboardingPalette } from './onboarding-palette';

function ScanLine({ phase }: { readonly phase: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const p = phase.value;
    const k = p < 0.5 ? inOut(p / 0.5) : 1 - inOut((p - 0.5) / 0.5);
    return { top: H * (0.14 + 0.66 * k) };
  });
  return <Animated.View style={[styles.scanLine, style]} />;
}

export function ScanDemo({ pal }: { readonly pal: OnboardingPalette }) {
  const phase = useLoop(2400, 0, 0.5);
  return (
    <View
      style={[
        box,
        { backgroundColor: DEMO.scanBg, alignItems: 'center', justifyContent: 'center' },
      ]}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={W} height={H} color={DEMO.scanStripes[0]} />
        <Path path={stripes()} color={DEMO.scanStripes[1]} />
        <Group clip={rrect(rect((W - 108) / 2, (H - 108) / 2, 108, 108), 10, 10)} opacity={0.85}>
          <Rect x={(W - 108) / 2} y={(H - 108) / 2} width={108} height={108} color={DEMO.scanBg} />
          <Group transform={[{ translateX: (W - 108) / 2 }, { translateY: (H - 108) / 2 }]}>
            <Path path={checker()} color={DEMO.scanPaper} />
          </Group>
        </Group>
      </Canvas>
      <View
        style={{
          position: 'absolute',
          width: 136,
          height: 136,
          borderRadius: 24,
          borderWidth: 2,
          borderColor: pal.accent,
        }}
      />
      <ScanLine phase={phase} />
      <View style={styles.scanLabel}>
        <Symbol name="qr_code_2" size={16} color={DEMO.scanLabelInk} />
        <Text numberOfLines={1} style={{ ...body(12, 650), color: DEMO.scanLabelInk }}>
          {`VietQR · ${SAMPLE.qrMerchant} · ${formatVnd(SAMPLE.qr)}`}
        </Text>
      </View>
    </View>
  );
}

export function ShareDemo() {
  const { t } = useI18n();
  const blank = { width: 36, height: 36, borderRadius: 10, backgroundColor: DEMO.rule };
  return (
    <View
      style={[
        box,
        {
          backgroundColor: DEMO.shareBg,
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingTop: 14,
          paddingHorizontal: 12,
          paddingBottom: 10,
          gap: 10,
        },
      ]}
    >
      <View style={{ width: 150, flex: 1 }}>
        {/* Two more receipts fanned behind: several can be shared at once. */}
        <View
          style={[styles.backPaper, { transform: [{ translateX: -18 }, { rotate: '-7deg' }] }]}
        />
        <View style={[styles.backPaper, { transform: [{ translateX: 18 }, { rotate: '6deg' }] }]} />
        <View
          style={{
            flex: 1,
            borderRadius: 12,
            backgroundColor: DEMO.receipt,
            boxShadow: DEMO.receiptShadow,
            paddingVertical: 10,
            paddingHorizontal: 12,
            gap: 6,
          }}
        >
          <Text style={{ ...mono(9, 400, 0.1), opacity: 0.5, color: DEMO.paperInk }}>
            {t('onboarding.catch.share.receipt')}
          </Text>
          <Text style={{ ...display(20, 600), lineHeight: 20, color: DEMO.paperInk }}>
            {formatVnd(SAMPLE.transfer)}
          </Text>
          <View style={{ height: 5, width: '80%', borderRadius: 3, backgroundColor: DEMO.rule }} />
          <View style={{ height: 5, width: '55%', borderRadius: 3, backgroundColor: DEMO.rule }} />
        </View>
      </View>
      <View
        style={{
          alignSelf: 'stretch',
          borderRadius: 16,
          backgroundColor: DEMO.shareSheet,
          padding: 8,
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}
      >
        <View style={blank} />
        <TapRing size={36} radius={10}>
          <AppIconImage size={36} radius={10} />
        </TapRing>
        <View style={blank} />
        <View style={blank} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backPaper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 6,
    bottom: 0,
    borderRadius: 12,
    backgroundColor: DEMO.receipt,
    boxShadow: DEMO.receiptShadow,
    opacity: 0.8,
  },
  scanLine: {
    position: 'absolute',
    left: W / 2 - 66,
    width: 132,
    height: 2,
    backgroundColor: DEMO.scanLine,
    boxShadow: DEMO.scanGlow,
  },
  scanLabel: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    height: 30,
    borderRadius: 99,
    backgroundColor: DEMO.scanLabelBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});

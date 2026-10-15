import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { curves, durations } from '@6pm/theme';

import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { HomeWidget, WIDGET_SIZE, type WidgetSize } from './home-widgets';
import type { WidgetPreview } from './preview-data';
import { AppGhost, Stage } from './stage';

const SIZES: readonly WidgetSize[] = ['small', 'medium', 'large'];
const LABEL = {
  small: 'widgetsGuide.home.small',
  medium: 'widgetsGuide.home.medium',
  large: 'widgetsGuide.home.large',
} as const;
const WHAT = {
  small: 'widgetsGuide.home.smallWhat',
  medium: 'widgetsGuide.home.mediumWhat',
  large: 'widgetsGuide.home.largeWhat',
} as const;
/** The Home Screen drawn tall enough for the large widget; the others share it with apps. */
const HEIGHT = 418;
const PAD = 24;
const SIDE = (402 - WIDGET_SIZE.medium.width) / 2;

/** A widget lands as one does on the Home Screen: up from a little smaller, on the house curve. */
const landing = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.88 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.bezier(...curves.house) },
}).duration(durations.sheet);
const leaving = FadeOut.duration(140);

/** The Home Screen, with the size picked above it in place among the apps. */
export function HomeStage({
  preview,
  width,
}: {
  readonly preview: WidgetPreview;
  readonly width: number;
}) {
  const { t } = useI18n();
  const { palette } = useTheme();
  const [size, setSize] = useState<WidgetSize>('medium');
  const still = useSharedValue(0.5);
  return (
    <View style={{ gap: 12 }}>
      <SizePicker size={size} onSize={setSize} />
      <Stage t={still} width={width} height={HEIGHT}>
        <Animated.View
          key={size}
          entering={landing}
          exiting={leaving}
          style={{ position: 'absolute', inset: 0, paddingTop: PAD, paddingHorizontal: SIDE }}
        >
          <Layout size={size} preview={preview} />
        </Animated.View>
      </Stage>
      <Animated.Text
        key={`what-${size}`}
        entering={landing}
        style={{ ...body(14, 500), color: palette.inkSoft, textAlign: 'center' }}
      >
        {t(WHAT[size])}
      </Animated.Text>
    </View>
  );
}

function GhostRow() {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {[0, 1, 2, 3].map((k) => (
        <AppGhost key={k} />
      ))}
    </View>
  );
}

/** Where the widget sits among the apps: as iOS lays out each size on the grid. */
function Layout({ size, preview }: { readonly size: WidgetSize; readonly preview: WidgetPreview }) {
  if (size === 'large') return <HomeWidget size="large" preview={preview} />;
  return (
    <View style={{ gap: 28 }}>
      {size === 'small' ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <HomeWidget size="small" preview={preview} />
          <View style={{ width: 170, height: 170, justifyContent: 'space-between' }}>
            {[0, 1].map((r) => (
              <View key={r} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppGhost />
                <AppGhost />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <HomeWidget size="medium" preview={preview} />
      )}
      <GhostRow />
      <GhostRow />
    </View>
  );
}

/** Small · Medium · Large, with a thumb that slides to the one picked. */
function SizePicker({
  size,
  onSize,
}: {
  readonly size: WidgetSize;
  readonly onSize: (size: WidgetSize) => void;
}) {
  const { t } = useI18n();
  const { palette } = useTheme();
  const [segment, setSegment] = useState(0);
  const at = useSharedValue(SIZES.indexOf(size));
  const thumb = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: at.get() * segment }],
  }));
  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setSegment((e.nativeEvent.layout.width - 6) / SIZES.length)}
      style={{
        flexDirection: 'row',
        padding: 3,
        borderRadius: 99,
        backgroundColor: palette.chipBg,
        alignSelf: 'stretch',
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 3,
            bottom: 3,
            left: 3,
            borderRadius: 99,
            backgroundColor: palette.btnBg,
          },
          thumb,
        ]}
      />
      {SIZES.map((s, k) => (
        <PressScale
          key={s}
          accessibilityRole="tab"
          accessibilityState={{ selected: s === size }}
          scaleTo={0.96}
          onPress={() => {
            if (s === size) return;
            haptics.tick();
            at.set(
              withTiming(k, { duration: durations.snap, easing: Easing.bezier(...curves.house) }),
            );
            onSize(s);
          }}
          style={{ flex: 1, height: 34, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ ...body(14, 650), color: s === size ? palette.btnFg : palette.ink }}>
            {t(LABEL[s])}
          </Text>
        </PressScale>
      ))}
    </View>
  );
}

import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { Reveal, Touch } from '../capture-guide/walkthrough/moving-parts';
import { stage, type TouchStop } from '../capture-guide/walkthrough/timeline';
import { Stage, stageInk, useLoop } from './stage';

const HEIGHT = 300;
const LOOP = 4600;
/** Reduce Motion holds the island open on Scan QR. */
const STILL = 0.6;
/** The phone's left edge, and the Action button on it. */
const EDGE = 26;
const BUTTON = { top: 92, height: 34 } as const;
const SCREEN_LEFT = EDGE + 10;
const ISLAND = { closedWidth: 124, openWidth: 228, closedHeight: 37, openHeight: 74 } as const;

/** The finger comes in from the left and holds the Action button. */
const PRESS: readonly TouchStop[] = [
  { at: 0.14, x: -30, y: 150 },
  { at: 0.28, x: EDGE - 18, y: BUTTON.top + BUTTON.height / 2, tap: true },
];

/** How held the Action button is: pressed at 0.28, let go once the island has answered. */
function held(t: number): number {
  'worklet';
  return stage(t, 0.26, 0.3) * (1 - stage(t, 0.52, 0.56));
}

/**
 * The top-left of an iPhone with the Action button set to 6pm's Scan QR: held, the Dynamic
 * Island opens on the control's glyph and name, and Scan's viewfinder comes up.
 */
export function ActionStage({ width }: { readonly width: number }) {
  const { t } = useI18n();
  const { palette } = useTheme();
  const clock = useLoop(LOOP, STILL);
  const centre = SCREEN_LEFT + (402 - SCREEN_LEFT) / 2;
  return (
    <Stage
      t={clock}
      width={width}
      height={HEIGHT}
      background={`linear-gradient(${palette.chipBg}, ${palette.chipBg})`}
    >
      {/* The frame: titanium edge with its buttons, then the screen inside it. */}
      <View
        style={{
          position: 'absolute',
          left: EDGE,
          top: 18,
          width: 440,
          height: 420,
          borderRadius: 64,
          borderWidth: 10,
          borderColor: stageInk.frame,
          backgroundColor: stageInk.black,
          overflow: 'hidden',
        }}
      >
        <View
          style={{ flex: 1, borderRadius: 54, experimental_backgroundImage: stageInk.wallpaper }}
        />
      </View>
      <SideButton t={clock} />
      {[150, 206].map((top) => (
        <View
          key={top}
          style={{
            position: 'absolute',
            left: EDGE - 4,
            top,
            width: 5,
            height: 46,
            borderRadius: 2,
            backgroundColor: stageInk.frameLight,
          }}
        />
      ))}
      <Island t={clock} centre={centre} label={t('surfaces.scanQr')} />
      <Reveal
        t={clock}
        from={0.5}
        to={0.66}
        fromScale={0.8}
        style={{
          position: 'absolute',
          left: centre - 70,
          top: 140,
          width: 140,
          height: 140,
        }}
      >
        <Viewfinder />
      </Reveal>
      <Touch t={clock} stops={PRESS} />
    </Stage>
  );
}

/** The Action button: a short nub on the edge that sinks in while held. */
function SideButton({ t }: { readonly t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: 3 * held(t.get()) }] }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: EDGE - 5,
          top: BUTTON.top,
          width: 6,
          height: BUTTON.height,
          borderRadius: 2,
          backgroundColor: stageInk.frameLight,
        },
        style,
      ]}
    />
  );
}

/** The Dynamic Island, opening on the control it ran. */
function Island({
  t,
  centre,
  label,
}: {
  readonly t: SharedValue<number>;
  readonly centre: number;
  readonly label: string;
}) {
  const shape = useAnimatedStyle(() => {
    const open = stage(t.get(), 0.3, 0.44) * (1 - stage(t.get(), 0.7, 0.8));
    const w = ISLAND.closedWidth + (ISLAND.openWidth - ISLAND.closedWidth) * open;
    const h = ISLAND.closedHeight + (ISLAND.openHeight - ISLAND.closedHeight) * open;
    return { width: w, height: h, left: centre - w / 2, borderRadius: h / 2 };
  });
  const inside = useAnimatedStyle(() => ({
    opacity: stage(t.get(), 0.36, 0.46) * (1 - stage(t.get(), 0.66, 0.72)),
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 40,
          backgroundColor: stageInk.black,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        shape,
      ]}
    >
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, inside]}>
        <Symbol name="qr_code_scanner" size={30} color={stageInk.white} />
        <Text numberOfLines={1} style={{ ...body(17, 650), color: stageInk.white }}>
          {label}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

/** Scan's four corner marks. */
function Viewfinder() {
  const arm = 34;
  const corners = [
    { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 22 },
    { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 22 },
    { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 22 },
    { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5, borderBottomRightRadius: 22 },
  ] as const;
  return (
    <View style={{ flex: 1 }}>
      {corners.map((c, k) => (
        <View
          key={k}
          style={{
            position: 'absolute',
            width: arm,
            height: arm,
            borderColor: stageInk.white,
            ...c,
          }}
        />
      ))}
    </View>
  );
}

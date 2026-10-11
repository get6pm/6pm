import { Canvas, Group } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { configFor, type LookConfig, type LookId } from '@6pm/theme';

import { SkyBlooms } from './sky-blooms';
import { SkyBokeh } from './sky-bokeh';
import { SkyFlare } from './sky-flare';
import { skyFrame, type SkyLayout } from './sky-frame';
import { SkyGradient } from './sky-gradient';
import { SkyGrain } from './sky-grain';
import { SkyHalftone } from './sky-halftone';
import type { SkyLayerProps } from './sky-layer-props';
import { SkyLeak } from './sky-leak';
import { SkyMoon } from './sky-moon';
import { useSkyClock } from './sky-motion';
import { SLOT } from './sky-slots';
import { SkySun, SUN_PARALLAX } from './sky-sun';
import { SkyVignette } from './sky-vignette';
import { LivingBackdrop } from './scenes/living/living-backdrop';
import { LivingMiddle } from './scenes/living/living-middle';
import { LivingSun } from './scenes/living/living-sun';
import type { SceneProps } from './scenes/scene-props';
import {
  SurfaceBlooms,
  SurfaceMiddle,
  SurfaceSky,
  SurfaceSun,
  SurfaceTop,
  surfaceOwnsBlooms,
  surfaceOwnsSky,
  surfaceOwnsSun,
} from './scenes/surface';
import { WeatherMiddle, WeatherTop } from './scenes/weather/weather-scene';

/** The prototype eases every hour-driven change over 1 s with CSS `ease`. */
const TRANSITION = { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };
const BOKEH_PARALLAX = 0.2;

export interface SkyProps {
  readonly look: LookId;
  readonly config?: Partial<LookConfig>;
  /** Decimal hour (18:07 → 18.1166). */
  readonly hour: number;
  readonly serious: boolean;
  /** The Today list's scroll offset: the sun, flare, halftone and bokeh rise with it. */
  readonly scrollY?: SharedValue<number>;
  /** The sun belongs to the Today tab only. */
  readonly showSun?: boolean;
}

/**
 * Keeps a layer mounted while it shows and for one transition after it stops showing, so it can
 * fade out instead of vanishing; skipping hidden layers keeps every frame cheap.
 */
function useShown(visible: boolean): boolean {
  const [lingering, setLingering] = useState(visible);
  useEffect(() => {
    if (visible) {
      setLingering(true);
      return;
    }
    const timer = setTimeout(() => setLingering(false), TRANSITION.duration + 100);
    return () => clearTimeout(timer);
  }, [visible]);
  return visible || lingering;
}

function useParallax(scrollY: SharedValue<number>, rate: number) {
  return useDerivedValue(() => [{ translateY: -rate * scrollY.value }]);
}

/**
 * The time-of-day sky behind the Today screen, with the look's atmosphere: blooms, sun and flare,
 * moon, bokeh, halftone, light leak, vignette and film grain, drawn in one Skia canvas. Every
 * colour and strength comes from the look engine for the hour; a new hour tweens over 1 s on the
 * UI thread, and drifts, twinkles and grain run on the UI thread too (held still under Reduce
 * Motion).
 */
export function Sky({ look, config, hour, serious, scrollY, showSun = true }: SkyProps) {
  const { width, height } = useWindowDimensions();
  const target = useMemo(
    () => skyFrame({ look, hour, serious, showSun, ...(config ? { config } : {}) }),
    [look, config, hour, serious, showSun],
  );
  // The layout only changes with the look; keep it stable so layers don't rebuild every minute.
  const layoutKey = JSON.stringify(target.layout);
  const layout = useMemo(() => JSON.parse(layoutKey) as SkyLayout, [layoutKey]);

  const reduceMotion = useReducedMotion();
  const frame = useSharedValue(target.values);
  useEffect(() => {
    frame.value = reduceMotion ? target.values : withTiming(target.values, TRANSITION);
  }, [frame, target, reduceMotion]);

  const time = useSkyClock();
  const still = useSharedValue(0);
  const scroll = scrollY ?? still;
  const sunLift = useParallax(scroll, SUN_PARALLAX);
  const bokehLift = useParallax(scroll, BOKEH_PARALLAX);

  const v = target.values;
  const at = (slot: number) => (v[slot] ?? 0) > 0;
  const shown = {
    blooms: useShown(at(SLOT.bloomOp)),
    sun: useShown(at(SLOT.sunOp)),
    flare: useShown(at(SLOT.streakOp) || at(SLOT.streakSoft)),
    moon: useShown(at(SLOT.moonOp)),
    bokeh: useShown(at(SLOT.bokehOp) && layout.bokeh.length > 0),
    dots: useShown(at(SLOT.dotOp)),
    leak: useShown(at(SLOT.leakOp)),
    vignette: useShown(at(SLOT.vignette + 3)),
    grain: useShown(at(SLOT.grainOp)),
  };
  const props: SkyLayerProps = { frame, layout, width, height, time, scrollY: scroll };
  const lookConfig = useMemo(() => configFor(look, config), [look, config]);
  const scene: SceneProps = {
    look,
    config: lookConfig,
    hour,
    serious,
    atm: target.atm,
    palette: target.palette,
    width,
    height,
    time,
    scrollY: scroll,
  };
  // Looks that draw their own sun in place of the shared one.
  const sharedSun = !surfaceOwnsSun(look) && look !== 'paper';

  return (
    <Canvas style={[StyleSheet.absoluteFill, styles.passThrough]}>
      {surfaceOwnsSky(look) ? (
        <SurfaceSky {...scene} />
      ) : (
        <SkyGradient frame={frame} width={width} height={height} />
      )}
      <LivingBackdrop {...scene} />
      {surfaceOwnsBlooms(look) ? (
        <SurfaceBlooms {...scene} />
      ) : (
        shown.blooms && <SkyBlooms {...props} />
      )}
      <Group transform={sunLift}>
        {shown.sun && sharedSun && <SkySun frame={frame} width={width} />}
        {shown.flare && <SkyFlare frame={frame} layout={layout} width={width} />}
        <LivingSun {...scene} showSun={showSun} />
      </Group>
      <SurfaceSun {...scene} showSun={showSun} />
      {shown.moon && <SkyMoon frame={frame} width={width} />}
      {shown.bokeh && (
        <Group transform={bokehLift}>
          <SkyBokeh frame={frame} layout={layout} time={time} width={width} />
        </Group>
      )}
      {shown.dots && (
        <Group transform={sunLift}>
          <SkyHalftone frame={frame} layout={layout} width={width} />
        </Group>
      )}
      {shown.leak && <SkyLeak {...props} />}
      <WeatherMiddle {...scene} />
      <SurfaceMiddle {...scene} />
      <LivingMiddle {...scene} />
      {shown.vignette && (
        <SkyVignette frame={frame} layout={layout} width={width} height={height} />
      )}
      {shown.grain && <SkyGrain {...props} />}
      <WeatherTop {...scene} />
      <SurfaceTop {...scene} />
    </Canvas>
  );
}

const styles = StyleSheet.create({ passThrough: { pointerEvents: 'none' } });

import { useEffect } from 'react';
import { Text, View } from 'react-native';
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../../../ui/theme/theme';
import { body } from '../../../ui/type/fonts';
import type { FrameSize, WalkthroughStep } from './walkthrough';

/** One page of a walkthrough: the drawn screen, playing while it is the one on show, over its words. */
export function Page({
  step,
  size,
  active,
  still,
  number,
  captionHeight,
  onCaption,
}: {
  readonly step: WalkthroughStep;
  readonly size: FrameSize;
  readonly active: boolean;
  readonly still: boolean;
  readonly number: number;
  readonly captionHeight: number;
  readonly onCaption: (height: number) => void;
}) {
  const { palette } = useTheme();
  const t = useSharedValue(still ? step.still : 0);
  useEffect(() => {
    cancelAnimation(t);
    if (still) {
      t.set(step.still);
      return;
    }
    // Off screen a page waits at its start, so it begins from there as it comes into view.
    t.set(0);
    if (active) {
      t.set(
        withRepeat(
          withTiming(1, {
            duration: step.loop,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          }),
          -1,
          false,
        ),
      );
    }
    return () => cancelAnimation(t);
  }, [active, still, step.loop, step.still, t]);

  return (
    <View style={{ width: size.width, paddingHorizontal: 14, gap: 10 }}>
      <View style={{ minHeight: captionHeight }}>
        <View
          accessible
          onLayout={(e) => onCaption(e.nativeEvent.layout.height)}
          style={{ gap: 5, paddingHorizontal: 6 }}
        >
          <Text style={{ ...body(17, 650), lineHeight: 22, color: palette.ink }}>
            {`${number}. ${step.title}`}
          </Text>
          <Text style={{ ...body(15), lineHeight: 20.5, color: palette.inkSoft }}>
            {step.detail}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>{step.frame(t, size)}</View>
    </View>
  );
}

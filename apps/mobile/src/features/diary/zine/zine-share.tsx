import type { ComponentRef, Ref } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Symbol } from '../../../ui/icons/symbol';
import { PressScale } from '../../../ui/primitives/press-scale';
import { body, display, leading, mono } from '../../../ui/type/fonts';
import { zineInk } from '../diary-colours';

const knobEase = Easing.bezier(0.3, 1.4, 0.5, 1);
const SWITCH_MS = 250;
const MISSED_DOT = 'rgba(251,244,236,.18)';

/** How the share card sits on the page; the shared image lays the card down the same way. */
export const zineCardTilt = {
  rotate: -2,
  shadow: { y: 24, blur: 44, color: 'rgba(40,10,30,.35)' },
} as const;
const { shadow } = zineCardTilt;

/** The design's switch: a white knob that springs across a green track. */
function AmountsSwitch({ on, onToggle }: { readonly on: boolean; readonly onToggle: () => void }) {
  const track = useAnimatedStyle(() => ({
    backgroundColor: withTiming(on ? zineInk.switchOn : zineInk.switchOff, {
      duration: SWITCH_MS,
    }),
  }));
  const knob = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(on ? 20 : 0, { duration: SWITCH_MS, easing: knobEase }) }],
  }));
  return (
    <PressScale accessibilityRole="switch" accessibilityState={{ checked: on }} onPress={onToggle}>
      <Animated.View style={[{ width: 51, height: 31, borderRadius: 99, padding: 2 }, track]}>
        <Animated.View
          style={[
            {
              width: 27,
              height: 27,
              borderRadius: 13.5,
              backgroundColor: zineInk.knob,
              boxShadow: '0 2px 6px rgba(0,0,0,.22)',
            },
            knob,
          ]}
        />
      </Animated.View>
    </PressScale>
  );
}

/**
 * The month as a card to share: closed days as dots in the cover colour, and one line that shows
 * amounts only when the user turns them on.
 */
export function ZineShare(props: {
  readonly title: string;
  readonly brand: string;
  readonly month: string;
  readonly tint: string;
  readonly closed: string;
  readonly daysLabel: string;
  readonly dots: readonly boolean[];
  readonly stat: string;
  readonly footer: string;
  readonly showLabel: string;
  readonly showSub: string;
  readonly showAmounts: boolean;
  readonly onToggle: () => void;
  /** The card alone, untilted, for drawing it as an image. */
  readonly cardRef: Ref<ComponentRef<typeof View>>;
  readonly saveLabel: string;
  readonly shareLabel: string;
  readonly onSave: () => void;
  readonly onShare: () => void;
}) {
  return (
    <View style={{ gap: 16, paddingTop: 6 }}>
      <Text style={{ ...mono(11, 400, 0.16), color: zineInk.ink, opacity: 0.6 }}>
        {props.title}
      </Text>
      <View
        style={{
          alignSelf: 'center',
          width: 200,
          height: 356,
          borderRadius: 22,
          transform: [{ rotate: `${zineCardTilt.rotate}deg` }],
          boxShadow: `0 ${shadow.y}px ${shadow.blur}px ${shadow.color}`,
        }}
      >
        <View
          ref={props.cardRef}
          collapsable={false}
          style={{
            flex: 1,
            borderRadius: 22,
            backgroundColor: zineInk.ink,
            paddingTop: 18,
            paddingHorizontal: 16,
            paddingBottom: 16,
            gap: 8,
          }}
        >
          <Text style={{ ...mono(9, 400, 0.16), color: zineInk.light, opacity: 0.6 }}>
            {props.brand}
          </Text>
          <Text style={{ ...leading(display(52, 500, -0.04), 47.8), color: props.tint }}>
            {props.month}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ ...leading(display(54, 500, -0.03), 54), color: zineInk.light }}>
            {props.closed}
          </Text>
          <Text style={{ ...body(12.5), marginTop: -2, color: zineInk.light, opacity: 0.7 }}>
            {props.daysLabel}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              width: 10 * 7 + 9 * 4,
              gap: 4,
              paddingTop: 6,
              paddingBottom: 4,
            }}
          >
            {props.dots.map((closed, i) => (
              <View
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 3.5,
                  backgroundColor: closed ? props.tint : MISSED_DOT,
                }}
              />
            ))}
          </View>
          <Text style={{ ...body(13.5, 650), lineHeight: 17.5, color: zineInk.light }}>
            {props.stat}
          </Text>
          <Text
            style={{ ...mono(8.5, 400, 0.16), paddingTop: 4, color: zineInk.light, opacity: 0.45 }}
          >
            {props.footer}
          </Text>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 12,
          paddingLeft: 16,
          paddingRight: 14,
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,.4)',
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...body(15, 650), color: zineInk.ink }}>{props.showLabel}</Text>
          <Text style={{ ...body(12.5), color: zineInk.ink, opacity: 0.65 }}>{props.showSub}</Text>
        </View>
        <AmountsSwitch on={props.showAmounts} onToggle={props.onToggle} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <PressScale
          accessibilityRole="button"
          onPress={props.onSave}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 99,
            borderWidth: 1.5,
            // The ink at 25%, as the design's rgba(42,20,36,.25).
            borderColor: `${zineInk.ink}40`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ ...body(16, 650), color: zineInk.ink }}>{props.saveLabel}</Text>
        </PressScale>
        <PressScale
          accessibilityRole="button"
          onPress={props.onShare}
          style={{
            flex: 1.4,
            height: 52,
            borderRadius: 99,
            backgroundColor: zineInk.ink,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Symbol name="ios_share" size={20} color={zineInk.light} />
          <Text style={{ ...body(16, 650), color: zineInk.light }}>{props.shareLabel}</Text>
        </PressScale>
      </View>
    </View>
  );
}

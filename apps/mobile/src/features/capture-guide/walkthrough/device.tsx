import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { body } from '../../../ui/type/fonts';
import { gmailInk, iosInk } from './frame-ink';
import { screenOpacity } from './timeline';

/** The drawn iPhone's screen, in iOS points (an iPhone 17 Pro). */
export const PHONE = { width: 402, height: 874 } as const;
/** The drawn browser window's page, in CSS pixels: a narrow desktop window. */
export const BROWSER = { width: 600, height: 480 } as const;
const BEZEL = 7;
const BAR = 30;

/** Fades the drawn screen out and in again as its loop restarts. */
function useScreenFade(t: SharedValue<number>) {
  return useAnimatedStyle(() => ({ opacity: screenOpacity(t.get()) }));
}

/** A screen drawn at its real size and shrunk to fit, so every measure stays the real one. */
function Scaled({
  width,
  height,
  scale,
  children,
}: {
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly children: ReactNode;
}) {
  return (
    <View style={{ width: width * scale, height: height * scale, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width,
          height,
          transformOrigin: 'top left',
          transform: [{ scale }],
        }}
      >
        {children}
      </View>
    </View>
  );
}

/** An iPhone: bezel, Dynamic Island, status bar and home indicator around a drawn screen. */
export function Phone({
  t,
  scale,
  background = iosInk.bg,
  dark = false,
  children,
}: {
  readonly t: SharedValue<number>;
  /** Drawn points per iOS point. */
  readonly scale: number;
  readonly background?: string;
  /** White status bar marks, over a dark screen. */
  readonly dark?: boolean;
  readonly children: ReactNode;
}) {
  const fade = useScreenFade(t);
  const radius = 62 * scale;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        padding: BEZEL,
        borderRadius: radius + BEZEL,
        backgroundColor: iosInk.bezel,
        borderWidth: 1,
        borderColor: iosInk.bezelEdge,
        alignSelf: 'center',
      }}
    >
      <View style={{ borderRadius: radius, overflow: 'hidden', backgroundColor: iosInk.bg }}>
        <Scaled width={PHONE.width} height={PHONE.height} scale={scale}>
          <Animated.View style={[{ flex: 1, backgroundColor: background }, fade]}>
            {children}
          </Animated.View>
          <StatusBar ink={dark ? iosInk.bg : iosInk.label} />
          <View
            style={{
              position: 'absolute',
              bottom: 8,
              alignSelf: 'center',
              width: 140,
              height: 5,
              borderRadius: 3,
              backgroundColor: iosInk.label,
            }}
          />
        </Scaled>
      </View>
    </View>
  );
}

/** 9:41, the island, and the signal, Wi-Fi and battery marks. */
function StatusBar({ ink }: { readonly ink: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 62,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 44,
        paddingTop: 6,
      }}
    >
      <Text style={{ ...body(17, 600), color: ink, width: 60 }}>9:41</Text>
      <View
        style={{
          position: 'absolute',
          top: 11,
          left: (PHONE.width - 124) / 2,
          width: 124,
          height: 37,
          borderRadius: 19,
          backgroundColor: iosInk.label,
        }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
          {[5, 7.5, 10, 12].map((h) => (
            <View
              key={h}
              style={{ width: 3.2, height: h, borderRadius: 1, backgroundColor: ink }}
            />
          ))}
        </View>
        <View
          style={{
            width: 25,
            height: 12,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: ink,
            opacity: 0.6,
            padding: 1.5,
          }}
        >
          <View style={{ flex: 1, borderRadius: 2, backgroundColor: ink }} />
        </View>
      </View>
    </View>
  );
}

/** A desktop browser window: tab strip, address bar and the page, for steps done on a computer. */
export function Browser({
  t,
  scale,
  url,
  children,
}: {
  readonly t: SharedValue<number>;
  readonly scale: number;
  readonly url: string;
  readonly children: ReactNode;
}) {
  const fade = useScreenFade(t);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        alignSelf: 'center',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: gmailInk.line,
        backgroundColor: gmailInk.chrome,
        boxShadow: iosInk.shadow,
      }}
    >
      <View
        style={{
          height: BAR,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 11,
        }}
      >
        {[gmailInk.red, gmailInk.yellow, gmailInk.green].map((c) => (
          <View key={c} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c }} />
        ))}
        <View
          style={{
            flex: 1,
            height: 19,
            marginLeft: 8,
            borderRadius: 10,
            backgroundColor: gmailInk.surface,
            justifyContent: 'center',
            paddingHorizontal: 10,
          }}
        >
          <Text numberOfLines={1} style={{ ...body(10.5), color: gmailInk.secondary }}>
            {url}
          </Text>
        </View>
      </View>
      <Scaled width={BROWSER.width} height={BROWSER.height} scale={scale}>
        <Animated.View style={[{ flex: 1, backgroundColor: gmailInk.bg }, fade]}>
          {children}
        </Animated.View>
      </Scaled>
    </View>
  );
}

/** The browser window's height on screen at `scale`, chrome included. */
export function browserHeight(scale: number): number {
  return BAR + BROWSER.height * scale + 2;
}

/** The phone's height on screen at `scale`, bezel included. */
export function phoneHeight(scale: number): number {
  return PHONE.height * scale + BEZEL * 2 + 2;
}

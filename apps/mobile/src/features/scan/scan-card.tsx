import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  withTiming,
  type EntryAnimationsValues,
  type LayoutAnimation,
} from 'react-native-reanimated';

import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { body } from '../../ui/type/fonts';
import { scanColours as c } from './scan-colours';

const rise = Easing.bezier(0.2, 0.9, 0.2, 1);

/** The prototype's `sheetUp .45s`: the card rises from its own height below the screen. */
export function sheetUp(values: EntryAnimationsValues): LayoutAnimation {
  'worklet';
  return {
    initialValues: { transform: [{ translateY: values.targetHeight + 8 }] },
    animations: { transform: [{ translateY: withTiming(0, { duration: 450, easing: rise }) }] },
  };
}

/** The frosted paper card Scan raises over the camera: 8 pt from the edges, 44 pt corners. */
export function ScanCard({
  children,
  onLayout,
}: {
  readonly children: ReactNode;
  readonly onLayout?: (event: LayoutChangeEvent) => void;
}) {
  return (
    <Animated.View
      entering={sheetUp}
      {...(onLayout ? { onLayout } : {})}
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 8,
        borderRadius: 44,
        overflow: 'hidden',
      }}
    >
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      <View
        style={{
          backgroundColor: c.card,
          paddingTop: 22,
          paddingHorizontal: 20,
          paddingBottom: 20,
          gap: 18,
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

/** A pill button on the paper card: solid ink for the way forward, outlined for the way around. */
export function CardButton({
  label,
  onPress,
  solid = false,
  flex,
  height = 54,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly solid?: boolean;
  readonly flex?: number;
  readonly height?: number;
}) {
  return (
    <PressScale
      accessibilityRole="button"
      onPress={onPress}
      style={{
        ...(flex === undefined ? {} : { flex }),
        height,
        borderRadius: 99,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        backgroundColor: solid ? c.button : 'transparent',
        borderWidth: solid ? 0 : 1.5,
        borderColor: c.cardOutline,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          ...body(height > 54 ? 17 : 16, solid ? 650 : 600),
          color: solid ? c.buttonText : c.cardInk,
        }}
      >
        {label}
      </Text>
    </PressScale>
  );
}

/**
 * A scan that cannot go on: an unreadable code, the camera turned off, a QR from abroad. The tile,
 * a title and why, then the way around (outlined) and the way forward (solid).
 */
export function ScanAlert({
  icon,
  title,
  body: text,
  primary,
  secondary,
}: {
  readonly icon: SymbolName;
  readonly title: string;
  readonly body: string;
  readonly primary: { readonly label: string; readonly onPress: () => void };
  readonly secondary?: { readonly label: string; readonly onPress: () => void };
}) {
  return (
    <ScanCard>
      <View
        accessibilityRole="alert"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: c.alertTile,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name={icon} size={27} color={c.alertGlyph} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ ...body(18, 650, -0.02), color: c.cardInk }}>{title}</Text>
          <Text style={{ ...body(14), lineHeight: 19.6, color: c.cardBody }}>{text}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {secondary ? <CardButton flex={1} {...secondary} /> : null}
        <CardButton flex={1.4} solid {...primary} />
      </View>
    </ScanCard>
  );
}

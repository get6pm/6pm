import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { display } from '../type/fonts';
import { shadowRoom, textShadows } from '../type/text-shadow';

/** The sign's place and type in the prototype: 20 pt in, 110 pt down, 42 pt, tracked .03 em. */
const SIGN = { left: 20, top: 110, size: 42, tracking: 0.03 } as const;

/**
 * Neon Alley's shop sign (`atm.signText`: mở cửa while the day is open, đóng cửa once it is closed),
 * in the look's display face with its neon glow, each glow layer drawn as its own copy of the words
 * under the lit tube. Nothing for any other look.
 */
export function SkySign({
  atm,
  dispFont,
}: {
  readonly atm: Readonly<Record<string, unknown>>;
  readonly dispFont: string;
}) {
  const on = atm.signOn === true && typeof atm.signText === 'string';
  const glow = typeof atm.signSh === 'string' ? atm.signSh : 'none';
  const layers = useMemo(() => textShadows(glow), [glow]);
  if (!on) return null;
  const style = {
    ...display(SIGN.size, 400, SIGN.tracking, dispFont),
    lineHeight: SIGN.size,
    color: typeof atm.signC === 'string' ? atm.signC : 'transparent',
  };
  const words = String(atm.signText);
  // Every copy, the lit words included, sits in the same padded box: iOS lays a padded line out a
  // little lower than a bare one, and copies that differ show their letters' feet under the sign.
  const room = layers.reduce((most, shadow) => Math.max(most, shadowRoom(shadow)), 0);
  const box = { position: 'absolute', left: -room, top: -room, padding: room } as const;
  return (
    <View style={styles.sign}>
      {layers.map((shadow, i) => (
        <Text key={i} style={[style, shadow, box]} numberOfLines={1}>
          {words}
        </Text>
      ))}
      <Text style={[style, box]} numberOfLines={1}>
        {words}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sign: { position: 'absolute', left: SIGN.left, top: SIGN.top, pointerEvents: 'none' },
});

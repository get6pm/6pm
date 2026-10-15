import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Symbol } from '../../../ui/icons/symbol';
import type { SymbolName } from '../../../ui/icons/symbols.generated';
import { body } from '../../../ui/type/fonts';
import { iosInk } from './frame-ink';

/** The pieces of iOS the drawn screens are built from, at iOS's own sizes in points. */

/** A large navigation title, with an optional button row above it. */
export function LargeTitle({
  title,
  right,
  left,
}: {
  readonly title: string;
  readonly right?: ReactNode;
  readonly left?: ReactNode;
}) {
  return (
    <View style={{ paddingTop: 62, paddingHorizontal: 20 }}>
      <View
        style={{
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>{left}</View>
        <View>{right}</View>
      </View>
      <Text style={{ ...body(34, 700), color: iosInk.label, letterSpacing: 0.4 }}>{title}</Text>
    </View>
  );
}

/** A round glass button in the top bar (iOS 26): a glyph, or words like Next. */
export function GlassButton({
  glyph,
  text,
  tint = false,
}: {
  readonly glyph?: SymbolName;
  readonly text?: string;
  /** The prominent kind: filled blue with white text (Next, Done). */
  readonly tint?: boolean;
}) {
  return (
    <View
      style={{
        minWidth: 44,
        height: 44,
        paddingHorizontal: text ? 16 : 0,
        borderRadius: 22,
        backgroundColor: tint ? iosInk.blue : iosInk.bg,
        boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glyph ? <Symbol name={glyph} size={26} color={tint ? iosInk.bg : iosInk.label} /> : null}
      {text ? (
        <Text style={{ ...body(17, 600), color: tint ? iosInk.bg : iosInk.label }}>{text}</Text>
      ) : null}
    </View>
  );
}

/** A square app-icon-like tile with a glyph, as Shortcuts lists triggers and actions. */
export function GlyphTile({
  glyph,
  color,
  size = 30,
}: {
  readonly glyph: SymbolName;
  readonly color: string;
  readonly size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={glyph} size={size * 0.66} color={iosInk.bg} fill={1} />
    </View>
  );
}

/** A magnifier, drawn: a ring and a handle. */
export function Magnifier({ color = iosInk.secondary }: { readonly color?: string }) {
  return (
    <View style={{ width: 18, height: 18 }}>
      <View
        style={{
          width: 13,
          height: 13,
          borderRadius: 7,
          borderWidth: 2.2,
          borderColor: color,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 11,
          top: 11.5,
          width: 7,
          height: 2.4,
          borderRadius: 1.2,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
        }}
      />
    </View>
  );
}

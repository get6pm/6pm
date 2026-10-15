import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { AppIconImage } from '../../../ui/app-icon-image';
import { Symbol } from '../../../ui/icons/symbol';
import type { SymbolName } from '../../../ui/icons/symbols.generated';
import { body } from '../../../ui/type/fonts';
import { iosInk } from './frame-ink';
import { GlassButton } from './ios-parts';

/** The Shortcuts editor as iOS 27 draws it, in points, from the screens it really shows. */

/** The 6pm app icon, as Shortcuts and the share sheet list it. */
export function SixPmIcon({ size = 30 }: { readonly size?: number }) {
  return <AppIconImage size={size} radius={size * 0.225} />;
}

/** The editor's top bar: back, the shortcut's icon and name, and the describe button. */
export function EditorBar({
  name,
  icon = true,
}: {
  readonly name: string;
  readonly icon?: boolean;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top: 62,
        left: 16,
        right: 16,
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <GlassButton glyph="chevron_left" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        {icon ? <SixPmIcon size={24} /> : null}
        <Text style={{ ...body(17, 600), color: iosInk.label }}>{name}</Text>
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: iosInk.fill,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="expand_more" size={14} color={iosInk.secondary} />
        </View>
      </View>
      <GlassButton glyph="auto_awesome" />
    </View>
  );
}

/** A white editor card with rounded corners, as each action sits in the editor. */
export function EditorCard({
  top,
  children,
}: {
  readonly top: number;
  readonly children: ReactNode;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        top,
        left: 16,
        right: 16,
        borderRadius: 26,
        backgroundColor: iosInk.bg,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

/** A small glyph tile in front of an action's name. */
export function ActionGlyph({ glyph }: { readonly glyph: SymbolName }) {
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 7,
        backgroundColor: iosInk.blue,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={glyph} size={18} color={iosInk.bg} fill={1} />
    </View>
  );
}

/** The card's ⓧ at its top right. */
export function RemoveMark() {
  return (
    <View
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: iosInk.fill,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name="close" size={15} color={iosInk.secondary} weight={600} />
    </View>
  );
}

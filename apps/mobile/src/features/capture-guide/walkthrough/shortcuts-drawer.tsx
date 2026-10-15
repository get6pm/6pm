import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useI18n } from '../../../i18n/i18n';
import { Symbol } from '../../../ui/icons/symbol';
import type { SymbolName } from '../../../ui/icons/symbols.generated';
import { body } from '../../../ui/type/fonts';
import { iosInk } from './frame-ink';
import { Magnifier } from './ios-parts';

/** The editor's drawer: docked at the bottom, or open with its chips and items. */

/** The editor's bottom bar when no action is being added: Search, and the undo/info/play row. */
export function DockedDrawer() {
  const { t } = useI18n();
  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 18,
        borderRadius: 34,
        backgroundColor: 'rgba(255,255,255,0.9)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
        padding: 12,
        paddingTop: 18,
        gap: 12,
      }}
    >
      <View
        style={{
          height: 44,
          borderRadius: 22,
          backgroundColor: iosInk.fill,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 14,
        }}
      >
        <Magnifier color={iosInk.label} />
        <Text style={{ ...body(17), color: iosInk.secondary }}>{t('capture.walk.ios.search')}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 4 }}>
        <Symbol name="undo" size={26} color={iosInk.label} />
        <Symbol
          name="undo"
          size={26}
          color={iosInk.tertiary}
          style={{ transform: [{ scaleX: -1 }] }}
        />
        {(['info', 'ios_share', 'play_circle'] as const).map((glyph) => (
          <Symbol key={glyph} name={glyph} size={26} color={iosInk.label} />
        ))}
      </View>
    </View>
  );
}

/** A trigger or action in the drawer's list: glyph, name and an example line. */
export function DrawerItem({
  glyph,
  color,
  name,
  example,
  icon,
}: {
  readonly glyph?: SymbolName;
  readonly color?: string;
  readonly name: string;
  readonly example?: string;
  readonly icon?: ReactNode;
}) {
  return (
    <View
      style={{
        height: example ? 66 : 52,
        marginHorizontal: 12,
        borderRadius: 22,
        backgroundColor: iosInk.bg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 14,
      }}
    >
      {icon ??
        (glyph ? <Symbol name={glyph} size={24} color={color ?? iosInk.blue} fill={1} /> : null)}
      <View style={{ flex: 1, gap: 1 }}>
        <Text numberOfLines={1} style={{ ...body(17, 600), color: iosInk.label }}>
          {name}
        </Text>
        {example ? (
          <Text numberOfLines={1} style={{ ...body(13), color: iosInk.secondary }}>
            {example}
          </Text>
        ) : null}
      </View>
      <Symbol name="info" size={22} color={iosInk.label} />
    </View>
  );
}

/** A category chip at the top of the drawer. */
export function DrawerChip({
  glyph,
  label,
  children,
}: {
  readonly glyph: SymbolName;
  readonly label: string;
  readonly children?: ReactNode;
}) {
  return (
    <View
      style={{
        height: 42,
        paddingHorizontal: 14,
        borderRadius: 21,
        backgroundColor: iosInk.bg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
      }}
    >
      {children}
      <Symbol name={glyph} size={18} color={iosInk.blue} />
      <Text style={{ ...body(16, 500), color: iosInk.blue }}>{label}</Text>
    </View>
  );
}

/** Where a half-height sheet in the editor starts, such as the shortcut picker. */
export const SHEET_TOP = 415;

/** A plain keyboard: three rows of blank keys and the space bar, as the drawn screens need one. */
export function Keyboard() {
  const row = (n: number, inset: number) => (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: inset }}>
      {Array.from({ length: n }, (_, k) => (
        <View
          key={k}
          style={{ flex: 1, height: 44, borderRadius: 8, backgroundColor: iosInk.bg }}
        />
      ))}
    </View>
  );
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 300,
        backgroundColor: '#D5D7DD',
        paddingTop: 10,
        gap: 11,
        paddingHorizontal: 4,
      }}
    >
      {row(10, 0)}
      {row(9, 18)}
      {row(7, 50)}
      <View
        style={{ marginHorizontal: 100, height: 44, borderRadius: 8, backgroundColor: iosInk.bg }}
      />
    </View>
  );
}

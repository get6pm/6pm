import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/** "YOUR DAY", with an optional note on the right, over a group of rows. */
export function SettingsSection({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note?: string;
  readonly children: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingHorizontal: 6,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ ...body(13, 600, 0.04), textTransform: 'uppercase', color: palette.inkSoft }}
        >
          {title}
        </Text>
        {note ? <Text style={{ ...body(13), color: palette.inkSoft }}>{note}</Text> : null}
      </View>
      <View
        style={{
          borderRadius: 26,
          backgroundColor: palette.cell,
          boxShadow: palette.cardShadow,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * One settings row: a 32 pt chip tile with its glyph, the label, and on the right either the
 * current value with a chevron (tappable) or a trailing control such as a switch.
 */
export function SettingRow({
  icon,
  label,
  sub,
  value,
  first = false,
  onPress,
  trailing,
}: {
  readonly icon: string;
  readonly label: string;
  readonly sub?: string;
  readonly value?: string;
  readonly first?: boolean;
  readonly onPress?: () => void;
  readonly trailing?: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      highlight
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: palette.chipBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isSymbolName(icon) ? <Symbol name={icon} size={19} color={palette.ink} /> : null}
      </View>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: sub ? 10 : 8,
          paddingVertical: sub ? 11 : 13,
          borderTopWidth: 0.5,
          borderTopColor: first ? 'transparent' : palette.hair,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...body(16), color: palette.ink }}>{label}</Text>
          {sub ? (
            <Text numberOfLines={1} style={{ ...body(12.5), color: palette.inkSoft }}>
              {sub}
            </Text>
          ) : null}
        </View>
        {value ? <Text style={{ ...body(15), color: palette.inkSoft }}>{value}</Text> : null}
        {onPress ? (
          <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.35 }} />
        ) : null}
        {trailing}
      </View>
    </PressScale>
  );
}

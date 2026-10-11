import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { oklchSrgbHex } from '@6pm/theme';

import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

const CLOUD_BLUE = oklchSrgbHex(0.7, 0.12, 230);
const DANGER_RED = oklchSrgbHex(0.66, 0.19, 25);

/** The state of backup in one card: a glyph tile, a line, and what it means (the capture guide's edge card). */
export function BackupCard({
  icon,
  title,
  sub,
}: {
  readonly icon: SymbolName;
  readonly title: string;
  readonly sub: string;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          backgroundColor: palette.chipBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Symbol name={icon} size={24} fill={1} color={CLOUD_BLUE} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text accessibilityRole="header" style={{ ...body(16, 650), color: palette.ink }}>
          {title}
        </Text>
        <Text style={{ ...body(13.5), lineHeight: 19, color: palette.inkSoft }}>{sub}</Text>
      </View>
    </View>
  );
}

/** A full-width button in the Settings style; `primary` is the one that does the thing. */
export function BackupButton({
  label,
  onPress,
  primary = false,
  danger = false,
  disabled = false,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly primary?: boolean;
  readonly danger?: boolean;
  readonly disabled?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        height: 50,
        borderRadius: 18,
        backgroundColor: primary ? palette.ink : palette.cell,
        boxShadow: primary ? 'none' : palette.cardShadow,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Text
        style={{
          ...body(16, 600),
          color: primary ? palette.sheetSolid : danger ? DANGER_RED : palette.ink,
        }}
      >
        {label}
      </Text>
    </PressScale>
  );
}

/** A quiet line under the buttons. `error` tints it the warning red. */
export function BackupNote({
  children,
  error = false,
}: {
  readonly children: ReactNode;
  readonly error?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Text
      accessibilityLiveRegion={error ? 'polite' : 'none'}
      style={{
        ...body(13.5),
        lineHeight: 19,
        paddingHorizontal: 8,
        color: error ? DANGER_RED : palette.inkSoft,
      }}
    >
      {children}
    </Text>
  );
}

import type { ReactNode } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';

import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { PressScale } from '../../ui/primitives/press-scale';

/** The cell card every Plan section sits on: 26 pt corners, the frame's cell colour and shadow. */
export function PlanCard({
  padding,
  gap,
  children,
}: {
  readonly padding: { top: number; side: number; bottom: number };
  readonly gap: number;
  readonly children: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        paddingTop: padding.top,
        paddingHorizontal: padding.side,
        paddingBottom: padding.bottom,
        gap,
      }}
    >
      {children}
    </View>
  );
}

/** "Bills · 2 of 4 paid": the title over a section card and its note on the right. */
export function SectionHeader({
  title,
  note,
  onLayout,
}: {
  readonly title: string;
  readonly note: string;
  readonly onLayout?: (e: LayoutChangeEvent) => void;
}) {
  const { palette } = useTheme();
  return (
    <View
      onLayout={onLayout}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingHorizontal: 6,
      }}
    >
      <Text accessibilityRole="header" style={{ ...body(20, 700, -0.02), color: palette.ink }}>
        {title}
      </Text>
      <Text style={{ ...body(14, 500), color: palette.inkSoft }}>{note}</Text>
    </View>
  );
}

/** A small rounded status pill ("On track for Mar", "450k a month", "Ready"). */
export function Pill({
  label,
  bg,
  fg,
  padX,
}: {
  readonly label: string;
  readonly bg: string;
  readonly fg: string;
  readonly padX: number;
}) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        height: 22,
        paddingHorizontal: padX,
        borderRadius: 99,
        backgroundColor: bg,
        justifyContent: 'center',
      }}
    >
      <Text style={{ ...body(11.5, 700), color: fg }}>{label}</Text>
    </View>
  );
}

/** A chip-coloured pill button: "+100k" on goals. */
export function ChipButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  readonly label: string;
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: 13,
        borderRadius: 99,
        backgroundColor: palette.chipBg,
        justifyContent: 'center',
      }}
    >
      <Text style={{ ...body(13, 650), color: palette.ink }}>{label}</Text>
    </PressScale>
  );
}

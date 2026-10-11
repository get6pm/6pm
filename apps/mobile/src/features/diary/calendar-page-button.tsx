import { Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';

/** A round arrow that pages the calendar to the month before or after; dim when there is none. */
export function PageButton({
  direction,
  enabled,
  label,
  onPress,
}: {
  readonly direction: 'previous' | 'next';
  readonly enabled: boolean;
  readonly label: string;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      hitSlop={6}
      onPress={onPress}
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: palette.chipBg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: enabled ? 1 : 0.3,
      }}
    >
      <Symbol
        name={direction === 'previous' ? 'chevron_left' : 'chevron_right'}
        size={20}
        color={palette.ink}
      />
    </PressScale>
  );
}

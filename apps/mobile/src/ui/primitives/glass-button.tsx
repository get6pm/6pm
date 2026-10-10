import { useTheme } from '../theme/theme';
import { Symbol } from '../icons/symbol';
import type { SymbolName } from '../icons/symbols.generated';
import { PressScale } from './press-scale';

/** The round glass buttons in the Today header (Settings, Quick add): 44 pt, frosted, soft shadow. */
export function GlassButton({
  icon,
  iconSize = 22,
  label,
  onPress,
}: {
  readonly icon: SymbolName;
  readonly iconSize?: number;
  readonly label: string;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: palette.glass,
        boxShadow: palette.glassShadow,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Symbol name={icon} size={iconSize} color={palette.ink} />
    </PressScale>
  );
}

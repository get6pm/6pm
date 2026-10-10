import { View } from 'react-native';

/**
 * A dashed hairline. iOS draws a dashed border only when all four sides are dashed, so this clips
 * a dashed box to its top edge.
 */
export function DashedRule({
  color,
  width = 1,
  style,
}: {
  readonly color: string;
  readonly width?: number;
  readonly style?: object;
}) {
  return (
    <View style={[{ height: width, overflow: 'hidden' }, style]}>
      <View
        style={{
          height: width * 2 + 1,
          borderWidth: width,
          borderStyle: 'dashed',
          borderColor: color,
        }}
      />
    </View>
  );
}

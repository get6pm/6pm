import { Text, View } from 'react-native';

import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/** Where a spend came from, one dotted line per sighting. */
export function SourceTrail({
  title,
  lines,
}: {
  readonly title: string;
  readonly lines: readonly string[];
}) {
  const { palette } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <Text
        style={{
          ...body(13, 600, 0.04),
          textTransform: 'uppercase',
          color: palette.inkSoft,
          paddingHorizontal: 6,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          borderRadius: 26,
          backgroundColor: palette.cell,
          boxShadow: palette.cardShadow,
          paddingVertical: 14,
          paddingHorizontal: 16,
          gap: 10,
        }}
      >
        {lines.map((line) => (
          <View key={line} style={{ flexDirection: 'row', gap: 12 }}>
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                marginTop: 6,
                backgroundColor: palette.accent,
              }}
            />
            <Text style={{ ...body(14), lineHeight: 19.6, color: palette.ink, flex: 1 }}>
              {line}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

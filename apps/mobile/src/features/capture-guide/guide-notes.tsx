import { Text, View } from 'react-native';

import type { StringKey } from '@6pm/i18n';

import { useI18n } from '../../i18n/i18n';
import { Symbol } from '../../ui/icons/symbol';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { captureColours } from './capture-colours';

type NoteKey = Exclude<Extract<StringKey, `capture.walk.${string}`>, 'capture.walk.stepOf'>;

/** "Common mistakes": what went wrong for people before, each with what to do instead. */
export function MistakesCard({ items }: { readonly items: readonly NoteKey[] }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const colours = captureColours(palette);
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        paddingVertical: 4,
        paddingHorizontal: 16,
      }}
    >
      {items.map((item, k) => (
        <View
          key={item}
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingVertical: 13,
            borderTopWidth: 0.5,
            borderTopColor: k === 0 ? 'transparent' : palette.hair,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: colours.warnBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Symbol name="close" size={17} color={colours.warn} weight={600} />
          </View>
          <Text
            style={{ flex: 1, ...body(15), lineHeight: 20.5, color: palette.ink, paddingTop: 2 }}
          >
            {t(item)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Another mail service's steps, short: its name, then numbered lines. */
export function OtherMailCard({
  name,
  steps,
}: {
  readonly name: NoteKey;
  readonly steps: readonly NoteKey[];
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        paddingTop: 14,
        paddingBottom: 8,
        paddingHorizontal: 16,
        gap: 4,
      }}
    >
      <Text accessibilityRole="header" style={{ ...body(16, 650), color: palette.ink }}>
        {t(name)}
      </Text>
      {steps.map((step, k) => (
        <View key={step} style={{ flexDirection: 'row', gap: 10, paddingVertical: 6 }}>
          <Text style={{ ...body(15, 650), color: palette.accent, width: 16 }}>{k + 1}</Text>
          <Text style={{ flex: 1, ...body(15), lineHeight: 20.5, color: palette.ink }}>
            {t(step)}
          </Text>
        </View>
      ))}
    </View>
  );
}

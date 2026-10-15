import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { curves } from '@6pm/theme';

import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

/** The prototype's `screenIn` (up 12 pt from 98.5 %, 0.35 s on the entrance curve), one card after another. */
function cardIn(index: number) {
  return new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 12 }, { scale: 0.985 }] },
    100: {
      opacity: 1,
      transform: [{ translateY: 0 }, { scale: 1 }],
      easing: Easing.bezier(...curves.enter),
    },
  })
    .duration(350)
    .delay(60 * index);
}

/**
 * One place 6pm lives outside the app: its name (and what it needs), what it does in a line, the
 * drawn miniature, then how to add it in three steps and a note beside them.
 */
export function SurfaceCard({
  index,
  icon,
  title,
  needs,
  what,
  stepsTitle,
  steps,
  note,
  children,
}: {
  readonly index: number;
  readonly icon: SymbolName;
  readonly title: string;
  readonly needs?: string;
  readonly what: string;
  readonly stepsTitle: string;
  readonly steps: readonly [string, string, string];
  readonly note?: { readonly icon: SymbolName; readonly text: string };
  /** The drawn miniature. */
  readonly children: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Animated.View
      entering={cardIn(index)}
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        padding: 16,
        gap: 14,
      }}
    >
      <View style={{ gap: 6, paddingHorizontal: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Symbol name={icon} size={22} color={palette.ink} />
          <Text
            accessibilityRole="header"
            style={{ ...body(19, 700), color: palette.ink, flex: 1 }}
          >
            {title}
          </Text>
          {needs ? (
            <View
              style={{
                height: 24,
                paddingHorizontal: 9,
                borderRadius: 99,
                backgroundColor: palette.chipBg,
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(11.5, 650), color: palette.inkSoft }}>{needs}</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ ...body(15.5), lineHeight: 21, color: palette.inkSoft }}>{what}</Text>
      </View>

      {children}

      <View style={{ gap: 2 }}>
        <Text
          style={{
            ...body(12.5, 650, 0.04),
            textTransform: 'uppercase',
            color: palette.inkSoft,
            paddingHorizontal: 2,
            paddingBottom: 4,
          }}
        >
          {stepsTitle}
        </Text>
        {steps.map((step, k) => (
          <View
            key={k}
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingVertical: 9,
              borderTopWidth: k === 0 ? 0 : 0.5,
              borderTopColor: palette.hair,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: palette.btnBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(12.5, 700), color: palette.btnFg }}>{k + 1}</Text>
            </View>
            <Text
              style={{
                ...body(15),
                lineHeight: 20.5,
                color: palette.ink,
                flex: 1,
                paddingTop: 1.5,
              }}
            >
              {step}
            </Text>
          </View>
        ))}
      </View>

      {note ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            padding: 12,
            borderRadius: 16,
            backgroundColor: palette.chipBg,
          }}
        >
          <Symbol name={note.icon} size={20} color={palette.inkSoft} />
          <Text style={{ ...body(14), lineHeight: 19.5, color: palette.inkSoft, flex: 1 }}>
            {note.text}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

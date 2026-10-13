import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import type { CategoryRow } from '@6pm/domain';

import { CategoryTile } from '../../ui/category-tile';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';
import { planColours } from '../plan/plan-colours';

export const rowLayout = LinearTransition.springify().damping(22).stiffness(240);

/** One category: its tile, name and this month's tally, "Not daily" when it stays out of the day. */
export function CategoryListRow({
  category,
  sub,
  notDailyLabel,
  first,
  onPress,
}: {
  readonly category: CategoryRow;
  readonly sub: string;
  readonly notDailyLabel: string;
  readonly first: boolean;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(180)}
      layout={rowLayout}
    >
      <PressScale
        highlight
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${category.name}, ${sub}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingLeft: 16,
          paddingRight: 14,
        }}
      >
        <CategoryTile
          icon={isSymbolName(category.icon) ? category.icon : 'payments'}
          hue={category.hue}
        />
        <View
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 12,
            borderTopWidth: 0.5,
            borderTopColor: first ? 'transparent' : palette.hair,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text numberOfLines={1} style={{ ...body(16, 550), color: palette.ink }}>
              {category.name}
            </Text>
            <Text numberOfLines={1} style={{ ...body(13), color: palette.inkSoft }}>
              {sub}
            </Text>
          </View>
          {category.countsDaily ? null : (
            <View
              style={{
                height: 22,
                paddingHorizontal: 8,
                borderRadius: 99,
                backgroundColor: palette.chipBg,
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(11, 700), color: palette.inkSoft }}>{notDailyLabel}</Text>
            </View>
          )}
          <Symbol name="chevron_right" size={20} color={palette.ink} style={{ opacity: 0.35 }} />
        </View>
      </PressScale>
    </Animated.View>
  );
}

/** The last row of the list: a dashed tile with a plus, "New category". */
export function NewCategoryRow({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Animated.View layout={rowLayout}>
      <PressScale
        onPress={onPress}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingLeft: 16,
          paddingRight: 14,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 13,
            borderWidth: 1.5,
            borderStyle: 'dashed',
            borderColor: planColours(palette).dashLine,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Symbol name="add" size={21} color={palette.ink} />
        </View>
        <View
          style={{
            flex: 1,
            paddingVertical: 19,
            borderTopWidth: 0.5,
            borderTopColor: palette.hair,
          }}
        >
          <Text style={{ ...body(16, 600), color: palette.ink }}>{label}</Text>
        </View>
      </PressScale>
    </Animated.View>
  );
}

/**
 * "YOUR CATEGORIES" with a count on the right, over a rounded card whose height follows its rows
 * as they come and go.
 */
export function ListSection({
  title,
  note,
  footer,
  children,
}: {
  readonly title: string;
  readonly note: string;
  /** A line under the card. */
  readonly footer?: string;
  readonly children: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <Animated.View layout={rowLayout} style={{ gap: 8 }}>
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
        <Text style={{ ...body(13), color: palette.inkSoft }}>{note}</Text>
      </View>
      <Animated.View
        layout={rowLayout}
        style={{
          borderRadius: 26,
          backgroundColor: palette.cell,
          boxShadow: palette.cardShadow,
          overflow: 'hidden',
        }}
      >
        {children}
      </Animated.View>
      {footer ? (
        <Text
          style={{
            ...body(13),
            lineHeight: 13 * 1.4,
            color: palette.inkSoft,
            paddingHorizontal: 6,
          }}
        >
          {footer}
        </Text>
      ) : null}
    </Animated.View>
  );
}

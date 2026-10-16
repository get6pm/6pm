import type { ComponentProps, ReactNode } from 'react';
import { Text, View } from 'react-native';

import type { I18n } from '../../i18n/i18n';
import { BalancedText } from '../../ui/type/balanced-text';
import { body, display, leading } from '../../ui/type/fonts';
import type { OnboardingPalette } from './onboarding-palette';

/** A step's title and its line under it, clear of the companion on the right. */
export function StepHeading({
  title,
  sub,
  pal,
}: {
  readonly title: string;
  readonly sub: string;
  readonly pal: OnboardingPalette;
}) {
  return (
    <View style={{ paddingTop: 20, paddingRight: 76, gap: 10 }}>
      <BalancedText
        accessibilityRole="header"
        style={{ ...leading(display(36, 600, -0.03), 36), maxWidth: 220, color: pal.ink }}
      >
        {title}
      </BalancedText>
      <Text style={{ ...body(15), lineHeight: 21.75, color: pal.inkSoft }}>{sub}</Text>
    </View>
  );
}

/** The rounded white (or dusk) card every control sits on. */
export function Card({
  pal,
  radius = 26,
  style,
  children,
}: {
  readonly pal: OnboardingPalette;
  readonly radius?: number;
  readonly style?: ComponentProps<typeof View>['style'];
  readonly children: ReactNode;
}) {
  return (
    <View
      style={[
        { borderRadius: radius, backgroundColor: pal.cell, boxShadow: pal.cardShadow },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** The soft band behind a wheel's chosen row. */
export function WheelBand({
  height,
  radius,
  color,
  inset = 0,
}: {
  readonly height: number;
  readonly radius: number;
  readonly color: string;
  readonly inset?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: inset,
        right: inset,
        top: '50%',
        height,
        marginTop: -height / 2,
        borderRadius: radius,
        backgroundColor: color,
      }}
    />
  );
}

/**
 * Lays `items` out in rows of equal columns: three, like the prototype's grids, unless told
 * otherwise (two, for labels too long to share a row three ways).
 */
export function Grid<T>({
  items,
  gap,
  columns = 3,
  render,
}: {
  readonly items: readonly T[];
  readonly gap: number;
  readonly columns?: 2 | 3;
  readonly render: (item: T) => ReactNode;
}) {
  const rows: T[][] = [];
  items.forEach((item, i) => {
    if (i % columns === 0) rows.push([]);
    rows[rows.length - 1]?.push(item);
  });
  return (
    <View style={{ gap }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap }}>
          {Array.from({ length: columns }, (_, c) => (
            <View key={c} style={{ flex: 1, minWidth: 0 }}>
              {row[c] !== undefined ? render(row[c]) : null}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** "25th" in English, "25" in Vietnamese (the sentence around it says "ngày"). */
export function ordinalDay({ t, language }: I18n, n: number): string {
  const tens = n % 100;
  if (language !== 'en' || (tens >= 11 && tens <= 13)) return t('onboarding.day.other', { n });
  switch (n % 10) {
    case 1:
      return t('onboarding.day.one', { n });
    case 2:
      return t('onboarding.day.two', { n });
    case 3:
      return t('onboarding.day.few', { n });
    default:
      return t('onboarding.day.other', { n });
  }
}

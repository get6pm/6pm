import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { designAmount } from '@6pm/domain';

import { DEFAULT_CATEGORIES } from '../../data/onboarding';
import { useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { CategoryTile } from '../../ui/category-tile';
import { isSymbolName, Symbol } from '../../ui/icons/symbol';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, tabular } from '../../ui/type/fonts';
import { merchantIcon } from '../today/merchant-icon';
import { captureColours } from './capture-colours';
import type { GuideContent } from './guide-content';

/** "HOW IT WORKS" with a note on the right, over a card. */
export function GuideSection({
  title,
  note,
  children,
}: {
  readonly title: string;
  readonly note?: string;
  readonly children: ReactNode;
}) {
  const { palette } = useTheme();
  return (
    <View style={{ gap: 8 }}>
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
        {note ? <Text style={{ ...body(13), color: palette.inkSoft }}>{note}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** A chip that shows something of the user's own (their address) and does something when tapped. */
export interface LiveChip {
  readonly text: string;
  readonly label: string;
  readonly onPress: () => void;
}

/** The three numbered steps, each with the chip it points at; the first chip may be live. */
export function GuideSteps({
  guide,
  firstChip = null,
}: {
  readonly guide: GuideContent;
  readonly firstChip?: LiveChip | null;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        paddingVertical: 6,
        paddingHorizontal: 16,
      }}
    >
      {guide.steps.map((step, k) => (
        <View
          key={step.text}
          style={{
            flexDirection: 'row',
            gap: 14,
            paddingVertical: 14,
            borderTopWidth: 0.5,
            borderTopColor: k === 0 ? 'transparent' : palette.hair,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: palette.btnBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...body(13.5, 700), color: palette.btnFg }}>{k + 1}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 9, paddingTop: 4 }}>
            <Text style={{ ...body(15.5), lineHeight: 20.9, color: palette.ink }}>
              {t(step.text)}
            </Text>
            <PressScale
              disabled={k !== 0 || firstChip === null}
              accessibilityRole={k === 0 && firstChip ? 'button' : 'text'}
              {...(k === 0 && firstChip
                ? { accessibilityLabel: firstChip.label, onPress: firstChip.onPress }
                : {})}
              style={{
                alignSelf: 'flex-start',
                maxWidth: '100%',
                height: 32,
                paddingLeft: 9,
                paddingRight: 12,
                borderRadius: 10,
                backgroundColor: palette.chipBg,
                borderWidth: 0.5,
                borderColor: palette.hair,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 7,
              }}
            >
              <Symbol name={step.icon} size={18} color={palette.accent} />
              <Text
                numberOfLines={1}
                style={{ ...body(13, 600), color: palette.ink, flexShrink: 1 }}
              >
                {k === 0 && firstChip
                  ? firstChip.text
                  : typeof step.chip === 'string'
                    ? t(step.chip)
                    : step.chip.names.join(' · ')}
              </Text>
            </PressScale>
          </View>
        </View>
      ))}
    </View>
  );
}

/** The example of what this way leaves in the Inbox, waiting for a yes at the close. */
export function GuideSample({ guide }: { readonly guide: GuideContent }) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const { categories } = useMoney();
  const colours = captureColours(palette);
  const { sample } = guide;
  const name = typeof sample.name === 'string' ? t(sample.name) : sample.name.merchant;
  const mine = categories.find((c) => c.id === sample.categoryId);
  const starter = DEFAULT_CATEGORIES.find(([id]) => id === sample.categoryId);
  const hue = mine?.hue ?? starter?.[2] ?? guide.hue;
  const categoryIcon = mine && isSymbolName(mine.icon) ? mine.icon : (starter?.[1] ?? 'payments');
  const meta = [
    sample.time,
    t(`source.${sample.source}`),
    sample.pending ? t('today.row.pending') : null,
  ]
    .filter((part) => part !== null)
    .join(' · ');
  return (
    <View
      style={{
        borderRadius: 26,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        paddingVertical: 12,
        paddingLeft: 16,
        paddingRight: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <CategoryTile icon={merchantIcon(name, categoryIcon)} hue={hue} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text numberOfLines={1} style={{ ...body(16, 550), color: palette.ink }}>
          {name}
        </Text>
        <Text numberOfLines={1} style={{ ...body(13), color: palette.inkSoft }}>
          {meta}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 3 }}>
        <Text style={{ ...body(16, 600), ...tabular, color: palette.ink }}>
          {money.full(designAmount(sample.amount, money.currency))}
        </Text>
        <Text
          style={{ ...body(11, 600, 0.04), textTransform: 'uppercase', color: colours.warnText }}
        >
          {t('today.row.toReview')}
        </Text>
      </View>
    </View>
  );
}

/** The lightbulb tip. */
export function GuideTip({ text }: { readonly text: string }) {
  const { palette } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: palette.chipBg,
      }}
    >
      <Symbol name="lightbulb" size={21} color={palette.accent} />
      <Text style={{ flex: 1, ...body(14), lineHeight: 19.6, color: palette.ink }}>{text}</Text>
    </View>
  );
}

import { memo } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, ReduceMotion } from 'react-native-reanimated';

import { spendPreview, type DailyNumber } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { useTheme } from '../../ui/theme/theme';
import { body } from '../../ui/type/fonts';

const cardIn = FadeInDown.duration(300).reduceMotion(ReduceMotion.System);
const cardOut = FadeOut.duration(150).reduceMotion(ReduceMotion.System);

/**
 * On the left page while Ask is open on the right: what the spend just asked about would do to
 * today, when it fits in what is still safe. Today's meter with the spend striped on after what
 * is already spent, and what would be left.
 */
export const AskPreview = memo(function AskPreview({
  day,
  amount,
}: {
  readonly day: DailyNumber;
  readonly amount: number;
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const preview = spendPreview(day, amount);
  const stripe = `repeating-linear-gradient(135deg, ${palette.accent} 0px, ${palette.accent} 6px, ${palette.accentGlow} 6px, ${palette.accentGlow} 12px)`;

  // A spend bigger than today's safe amount is answered for the days after: nothing to show here.
  if (preview === null) return null;

  return (
    <Animated.View
      entering={cardIn}
      exiting={cardOut}
      style={{
        borderRadius: 24,
        backgroundColor: palette.cell,
        boxShadow: palette.cardShadow,
        padding: 16,
        gap: 10,
      }}
    >
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}
      >
        <Text style={{ ...body(15, 700), color: palette.ink, flexShrink: 1 }}>
          {t('duo.ask.title', { amount: money.short(amount) })}
        </Text>
        <Text style={{ ...body(12.5), color: palette.inkSoft }}>{t('duo.ask.from')}</Text>
      </View>
      <View
        style={{ height: 10, borderRadius: 10, backgroundColor: palette.hair, overflow: 'hidden' }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${preview.spentShare * 100}%`,
            backgroundColor: palette.ink,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: `${preview.spentShare * 100}%`,
            top: 0,
            bottom: 0,
            width: `${preview.addShare * 100}%`,
            experimental_backgroundImage: stripe,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ ...body(13, 600), color: palette.inkSoft, flexShrink: 1 }}>
          {t('duo.ask.spent', { spent: money.short(day.spent), amount: money.short(amount) })}
        </Text>
        <Text style={{ ...body(13, 600), color: palette.ink }}>
          {t('duo.ask.left', { left: money.short(preview.left) })}
        </Text>
      </View>
    </Animated.View>
  );
});

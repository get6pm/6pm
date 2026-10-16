import { memo } from 'react';
import { Text, View } from 'react-native';

import type { DailyNumber } from '@6pm/domain';

import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { Symbol } from '../../ui/icons/symbol';
import type { SymbolName } from '../../ui/icons/symbols.generated';
import { PressScale } from '../../ui/primitives/press-scale';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading, mono, tabular } from '../../ui/type/fonts';

export type CardPress = 'kept' | 'edit' | 'notMine';

/**
 * The right page of the Close with the iPhone Duo opened: what has been kept so far and what is
 * still yours today, the card's three choices made big (on the cards step), and how to finish:
 * fold the phone shut.
 */
export const CloseLedger = memo(function CloseLedger({
  kept,
  day,
  onPress,
  labels,
}: {
  readonly kept: number;
  readonly day: DailyNumber;
  /** The top card's choices; null once every card is decided. */
  readonly onPress: ((choice: CardPress) => void) | null;
  readonly labels: { readonly edit: string; readonly notMine: string; readonly keep: string };
}) {
  const { palette } = useTheme();
  const { t } = useI18n();
  const money = useMoneyFormat();

  const choice = (icon: SymbolName, label: string, press: CardPress, primary: boolean) => (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      scaleTo={0.96}
      onPress={() => onPress?.(press)}
      style={{
        flex: primary ? undefined : 1,
        height: primary ? 58 : 50,
        borderRadius: 99,
        backgroundColor: primary ? palette.accent : palette.glass,
        borderWidth: 0.5,
        borderColor: primary ? 'rgba(255,255,255,.45)' : palette.glassBorder,
        boxShadow: primary ? `0 10px 26px ${palette.accentGlow}` : 'none',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Symbol
        name={icon}
        size={primary ? 22 : 18}
        color={primary ? palette.accentFg : palette.ink}
      />
      <Text
        style={{ ...body(primary ? 17 : 15, 650), color: primary ? palette.accentFg : palette.ink }}
      >
        {label}
      </Text>
    </PressScale>
  );

  return (
    <View style={{ flex: 1, gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text
          style={{ ...mono(11, 400, 0.14), textTransform: 'uppercase', color: palette.inkSoft }}
        >
          {t('duo.close.kept')}
        </Text>
        <Text
          style={{ ...leading(display(64, 500, -0.03), 64, true), ...tabular, color: palette.ink }}
        >
          {money.short(kept)}
        </Text>
        <Text style={{ ...body(14), color: palette.inkSoft }}>
          {t('duo.close.ofLine', {
            line: money.short(day.line),
            left: money.short(Math.max(0, day.safe)),
          })}
        </Text>
      </View>
      <View style={{ flex: 1 }} />
      {onPress ? (
        <View style={{ gap: 10 }}>
          {choice('check', labels.keep, 'kept', true)}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {choice('edit', labels.edit, 'edit', false)}
            {choice('south', labels.notMine, 'notMine', false)}
          </View>
        </View>
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingTop: 16,
          borderTopWidth: 0.5,
          borderTopColor: palette.hair,
        }}
      >
        <Symbol name="menu_book" size={20} color={palette.inkSoft} />
        <Text style={{ ...body(13.5), color: palette.inkSoft, flex: 1 }}>
          {t(onPress ? 'duo.close.foldLater' : 'duo.close.foldNow')}
        </Text>
      </View>
    </View>
  );
});

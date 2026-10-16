import { memo, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  calendarCells,
  cyclePace,
  monthOf,
  startOfWeek,
  type DailyNumber,
  type LocalDate,
} from '@6pm/domain';

import { readFirstDay } from '../../data/diary-queries';
import { useMoney, useMoneyStore } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { useTheme } from '../../ui/theme/theme';
import { body, display, leading } from '../../ui/type/fonts';
import { useDiaryDates } from '../diary/diary-dates';
import { planColours } from '../plan/plan-colours';
import { riverOf } from '../plan/plan-view';
import { useCycleTopUps } from '../plan/use-cycle-top-ups';
import { MonthDays } from './month-days';

/**
 * The right page of the iPhone Duo opened beside Today: the month at a glance. How far the money
 * has gone against the days, what the bills, Future you and the free money hold, and every day's
 * number. Its figures are the Plan's own.
 */
export const MonthPane = memo(function MonthPane({ day }: { readonly day: DailyNumber }) {
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const money = useMoneyFormat();
  const dates = useDiaryDates();
  const snap = useMoney();
  const store = useMoneyStore();
  const topUps = useCycleTopUps(snap);
  const colours = planColours(palette);
  const [since, setSince] = useState<LocalDate | null>(null);

  useEffect(() => {
    let live = true;
    void readFirstDay(store).then((first) => {
      if (live) setSince(first);
    });
    return () => {
      live = false;
    };
  }, [store]);

  const river = riverOf(snap, day, topUps);
  const pace = cyclePace({
    spent: river.spent,
    free: river.free,
    cycle: snap.cycle,
    today: snap.today,
  });
  const month = monthOf(snap.today);
  const monthName = dates.month(month);
  const cells = calendarCells({ month, today: snap.today, closed: snap.closedDays, since });
  const percent = (share: number) => Math.round(share * 100);
  const envelopes = [
    { key: 'bills', label: t('plan.river.bills'), colour: colours.river.bills, value: river.bills },
    {
      key: 'futureYou',
      label: t('plan.river.futureYou'),
      colour: colours.river.futureYou,
      value: river.futureYou,
    },
    { key: 'free', label: t('plan.river.free'), colour: colours.river.free, value: river.free },
  ] as const;

  return (
    <View
      style={{
        flex: 1,
        borderRadius: 32,
        backgroundColor: palette.sheetSolid,
        boxShadow: '0 20px 50px rgba(20,8,30,.25)',
        overflow: 'hidden',
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 22,
          paddingHorizontal: 20,
          paddingBottom: 24,
          gap: 18,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ ...display(28, 600, -0.02), color: palette.ink }}>{monthName}</Text>
          <Text style={{ ...body(13.5, 500), color: palette.inkSoft }}>
            {t('plan.daysToPayday', { count: snap.cycle.daysLeft })}
          </Text>
        </View>

        <View
          style={{
            borderRadius: 22,
            backgroundColor: palette.cell,
            boxShadow: palette.cardShadow,
            padding: 16,
            gap: 14,
          }}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ ...leading(display(21, 500), 23.1), color: palette.ink }}>
              {t(pace.pace === 'steady' ? 'duo.month.steady' : 'duo.month.fast')}
            </Text>
            <Text style={{ ...body(13), lineHeight: 18.2, color: palette.inkSoft }}>
              {t('duo.month.paceLine', {
                used: percent(pace.used),
                gone: percent(pace.gone),
                month: language === 'vi' ? monthName.toLocaleLowerCase('vi') : monthName,
              })}
            </Text>
          </View>
          <View style={{ height: 9, borderRadius: 9, backgroundColor: palette.hair }}>
            <View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${percent(pace.used)}%`,
                borderRadius: 9,
                backgroundColor: palette.accent,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: `${percent(pace.gone)}%`,
                top: -5,
                bottom: -5,
                width: 2,
                borderRadius: 2,
                backgroundColor: palette.ink,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingTop: 12,
              borderTopWidth: 0.5,
              borderTopColor: palette.hair,
            }}
          >
            {envelopes.map((e) => (
              <View key={e.key} style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{ width: 8, height: 8, borderRadius: 3, backgroundColor: e.colour }}
                  />
                  <Text numberOfLines={1} style={{ ...body(12, 600), color: palette.inkSoft }}>
                    {e.label}
                  </Text>
                </View>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ ...leading(display(22, 500), 22, true), color: palette.ink }}
                >
                  {money.short(Math.max(0, e.value))}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ ...body(16, 700), color: palette.ink, paddingHorizontal: 4 }}>
            {t('duo.month.daily')}
          </Text>
          <MonthDays
            cells={cells}
            letters={dates.letters(startOfWeek(snap.today))}
            today={snap.today}
            payday={snap.cycle.payday}
            safe={day.safe}
            tomorrow={day.tomorrow}
          />
        </View>
      </ScrollView>
    </View>
  );
});

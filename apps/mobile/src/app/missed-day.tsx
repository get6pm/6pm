import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { monthOf, needsReview, sumCounted } from '@6pm/domain';

import {
  notDailyOf,
  readClosedBetween,
  readDayNumber,
  readSpendsBetween,
  toDiarySpend,
  useStoreQuery,
} from '../data/diary-queries';
import { useMoney, useMoneyActions, useMoneyStore } from '../data/money-provider';
import type { MoneyStore } from '../data/money-store';
import { CardSheet } from '../features/diary/card-sheet';
import { useDiaryDates } from '../features/diary/diary-dates';
import { toRowViews } from '../features/today/today-view';
import { useSpendLabels } from '../features/today/use-spend-rows';
import { useI18n } from '../i18n/i18n';
import { useMoneyFormat } from '../money/use-money-format';
import { CategoryTile } from '../ui/category-tile';
import { Companion } from '../ui/companion/companion';
import { useCompanionToast } from '../features/companion/use-companion-toast';
import { useRunAction } from '../features/companion/use-run-action';
import { haptics } from '../ui/haptics';
import { PressScale } from '../ui/primitives/press-scale';
import { useTheme } from '../ui/theme/theme';
import { body, display, mono, tabular } from '../ui/type/fonts';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A missed day, caught up: what 6pm caught that day, and one button that confirms it all and files
 * the day late. Its spends already counted toward the month; closing only makes it official.
 */
export default function MissedDay() {
  const params = useLocalSearchParams<{ day?: string }>();
  const day = params.day && DAY.test(params.day) ? params.day : null;
  const { palette, serious } = useTheme();
  const { t } = useI18n();
  const money = useMoneyFormat();
  const dates = useDiaryDates();
  const say = useCompanionToast();
  const run = useRunAction();
  const labels = useSpendLabels();
  const { height } = useWindowDimensions();
  const snap = useMoney();
  const store = useMoneyStore();
  const actions = useMoneyActions();
  const [busy, setBusy] = useState(false);

  const read = useCallback(
    async (s: MoneyStore) =>
      day
        ? {
            spends: await readSpendsBetween(s, day, day),
            closed: (await readClosedBetween(s, day, day)).length > 0,
          }
        : null,
    [day],
  );
  const data = useStoreQuery(read);
  const spends = (data?.spends ?? []).filter((s) => s.status !== 'skipped');
  const waiting = spends.filter(needsReview);
  const spent = sumCounted(spends.map(toDiarySpend), notDailyOf(snap));
  const rows = toRowViews(spends, snap.categories, labels, false);
  const filed = data?.closed === true || day === null || day >= snap.today;

  const fileDay = async (dismiss: () => void) => {
    if (!day || busy) return;
    setBusy(true);
    haptics.tap();
    try {
      const saved = await run(async () => {
        await Promise.all(waiting.map((s) => actions.setStatus(s.id, 'kept')));
        const number = await readDayNumber(store, store.getSnapshot(), day);
        await actions.closeDay({
          day,
          closedAt: new Date().toISOString(),
          late: true,
          spent: number?.spent ?? spent,
          line: number?.line ?? 0,
          tomorrow: number?.tomorrow ?? 0,
          note: null,
        });
        // The day may sit before this pay cycle: re-read so the snapshot holds only this cycle again.
        await actions.reload();
      });
      if (!saved) return;
      haptics.success();
      dismiss();
      say('lateClose', { day: dates.weekday(day) });
    } finally {
      // A failed filing leaves the button usable again; a good one is dismissing anyway.
      setBusy(false);
    }
  };

  const weekday = day ? dates.weekday(day) : '';
  const body15 = { ...body(15), lineHeight: 21.75, color: palette.inkSoft };
  const copy = { day: weekday, month: day ? dates.month(monthOf(day)) : '' };

  return (
    <CardSheet>
      {(dismiss) => (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {!serious ? <Companion size={64} mood="nod" /> : null}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ ...mono(11, 400, 0.14), color: palette.inkSoft }}>
                {day ? t('diary.missed.kicker', { date: dates.stamp(day) }) : ''}
              </Text>
              <Text style={{ ...display(27, 500, -0.01), lineHeight: 29.2, color: palette.ink }}>
                {t('diary.missed.title')}
              </Text>
            </View>
          </View>
          <Text style={body15}>
            {filed
              ? t('diary.missed.filed', { day: weekday })
              : waiting.length > 0
                ? t('diary.missed.body', { count: waiting.length, ...copy })
                : spends.length > 0
                  ? t('diary.missed.bodyKept', copy)
                  : t('diary.missed.bodyEmpty', { day: weekday })}
          </Text>
          {rows.length > 0 ? (
            <View
              style={{
                borderRadius: 22,
                backgroundColor: palette.cell,
                boxShadow: palette.cardShadow,
                overflow: 'hidden',
                maxHeight: height * 0.4,
              }}
            >
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                {rows.map((row) => (
                  <View
                    key={row.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12,
                      paddingVertical: 11,
                      paddingHorizontal: 14,
                      borderTopWidth: row.first ? 0 : 0.5,
                      borderTopColor: palette.hair,
                    }}
                  >
                    <CategoryTile icon={row.icon} hue={row.hue} size={34} radius={11} glyph={19} />
                    <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                      <Text numberOfLines={1} style={{ ...body(15, 600), color: palette.ink }}>
                        {row.name}
                      </Text>
                      <Text style={{ ...body(12.5), color: palette.inkSoft }}>{row.meta}</Text>
                    </View>
                    <Text style={{ ...body(15, 600), ...tabular, color: palette.ink }}>
                      {row.amount}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
          <View style={{ gap: 8 }}>
            {!filed ? (
              <PressScale
                scaleTo={0.95}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                onPress={() => void fileDay(dismiss)}
                style={{
                  height: 56,
                  borderRadius: 99,
                  backgroundColor: palette.btnBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: data === null ? 0 : 1,
                }}
              >
                <Text style={{ ...body(17, 650), color: palette.btnFg }}>
                  {t('diary.missed.close', { day: weekday, amount: money.short(spent) })}
                </Text>
              </PressScale>
            ) : null}
            <PressScale
              accessibilityRole="button"
              onPress={dismiss}
              style={{
                height: 48,
                borderRadius: 99,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(15, 600), color: palette.inkSoft }}>
                {filed ? t('common.done') : t('diary.missed.notNow')}
              </Text>
            </PressScale>
          </View>
        </>
      )}
    </CardSheet>
  );
}

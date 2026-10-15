import { Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import type { SpendRow } from '@6pm/domain';

import { useMoney, useMoneyActions } from '../data/money-provider';
import { waitingOf } from '../data/money-store';
import { useRunAction } from '../features/companion/use-run-action';
import { InboxRow } from '../features/inbox/inbox-row';
import { toRowViews } from '../features/today/today-view';
import { useSpendLabels } from '../features/today/use-spend-rows';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { SheetScreen } from '../ui/navigation/sheet-screen';
import { PressScale } from '../ui/primitives/press-scale';
import { useClock } from '../ui/theme/clock';
import { useTheme } from '../ui/theme/theme';
import { body, display } from '../ui/type/fonts';
import { Companion } from '../ui/companion/companion';

/** The card closing up as a row leaves it. */
const reflow = LinearTransition.springify().damping(22).stiffness(240);

export default function Inbox() {
  const { palette, serious } = useTheme();
  const { t, weekday } = useI18n();
  const { dayDate } = useClock();
  const snap = useMoney();
  const actions = useMoneyActions();
  const run = useRunAction();
  const labels = useSpendLabels();
  // Oldest first: the order they were caught in. Every waiting item shows, whatever day or pay cycle it is from.
  const waiting = waitingOf(snap).reverse();
  const missing = new Set(waiting.filter((s) => s.amount <= 0).map((s) => s.id));
  const closedDays = new Set(snap.closedDays.map((d) => d.day));
  const rowsOf = (spends: readonly SpendRow[]) =>
    toRowViews(spends, snap.categories, labels, false);
  const todays = rowsOf(waiting.filter((s) => s.day === snap.today));
  // One section per earlier day, the most recent first.
  const earlierDays = [...new Set(waiting.filter((s) => s.day < snap.today).map((s) => s.day))]
    .sort()
    .reverse();
  const keep = (id: string) => {
    haptics.tap();
    void run(() => actions.setStatus(id, 'kept'));
  };
  const keepAll = () => {
    haptics.success();
    void run(async () => {
      for (const s of waiting) await actions.setStatus(s.id, 'kept');
    });
  };
  const section = (key: string, label: string, rows: typeof todays) =>
    rows.length === 0 ? null : (
      <View key={key} style={{ gap: 8 }}>
        <Text
          style={{
            ...body(13, 600, 0.04),
            textTransform: 'uppercase',
            color: palette.inkSoft,
            paddingHorizontal: 6,
          }}
        >
          {label}
        </Text>
        <Animated.View
          layout={reflow}
          style={{
            borderRadius: 26,
            backgroundColor: palette.cell,
            boxShadow: palette.cardShadow,
            overflow: 'hidden',
          }}
        >
          {rows.map((row) => (
            <InboxRow
              key={row.id}
              row={row}
              keepLabel={t('inbox.keep')}
              amountMissing={row.foreign === null && missing.has(row.id)}
              onKeep={keep}
            />
          ))}
        </Animated.View>
      </View>
    );

  return (
    <SheetScreen title={t('inbox.title')}>
      {waiting.length === 0 ? (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 20 }}>
          {serious ? null : <Companion size={76} mood="happy" />}
          <Text style={{ ...display(34), color: palette.ink }}>{t('inbox.empty.title')}</Text>
          <Text style={{ ...body(15), color: palette.inkSoft, textAlign: 'center' }}>
            {t('inbox.empty.sub')}
          </Text>
        </View>
      ) : (
        <>
          {section('today', t('inbox.today', { weekday: weekday(dayDate) }), todays)}
          {earlierDays.map((earlierDay) => {
            const name = weekday(new Date(`${earlierDay}T12:00:00`));
            return section(
              earlierDay,
              closedDays.has(earlierDay)
                ? t('inbox.afterClose', { weekday: name })
                : t('inbox.earlier', { weekday: name }),
              rowsOf(waiting.filter((s) => s.day === earlierDay)),
            );
          })}
          <View style={{ gap: 12, alignItems: 'center' }}>
            <PressScale
              scaleTo={0.97}
              accessibilityRole="button"
              onPress={keepAll}
              style={{
                alignSelf: 'stretch',
                height: 52,
                borderRadius: 99,
                backgroundColor: palette.btnBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...body(17, 650), color: palette.btnFg }}>
                {t('inbox.confirmAll', { count: waiting.length })}
              </Text>
            </PressScale>
            <Text style={{ ...body(13), color: palette.inkSoft }}>{t('inbox.orAtSix')}</Text>
          </View>
        </>
      )}
    </SheetScreen>
  );
}

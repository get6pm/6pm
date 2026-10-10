import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { addDays, clockOf, formatShort, stepPosition, tally } from '@6pm/domain';

import { useDay, useMoney, useMoneyActions } from '../data/money-provider';
import { CloseCards } from '../features/close/close-cards';
import { CloseEdit } from '../features/close/close-edit';
import { CloseReceipt } from '../features/close/close-receipt';
import { CloseReveal } from '../features/close/close-reveal';
import {
  CashStep,
  SortedStep,
  WorkQuestionStep,
  type CashChip,
} from '../features/close/close-steps';
import { monthDots } from '../features/close/month-dots';
import { useClose } from '../features/close/use-close';
import { useI18n } from '../i18n/i18n';
import { haptics } from '../ui/haptics';
import { useDesignInsets } from '../ui/layout/design-insets';
import { GlassButton } from '../ui/primitives/glass-button';
import { useClock } from '../ui/theme/clock';
import { useTheme } from '../ui/theme/theme';
import { mono } from '../ui/type/fonts';

const STEP_KEYS = [
  'close.step.cards',
  'close.step.cash',
  'close.step.check',
  'close.step.receipt',
  'close.step.tomorrow',
] as const;

function Dot({ index, current }: { readonly index: number; readonly current: number }) {
  const { palette } = useTheme();
  const style = useAnimatedStyle(() => ({
    opacity: withTiming(index <= current ? 1 : 0.22, { duration: 400 }),
    backgroundColor: withTiming(index === current ? palette.accent : palette.ink, {
      duration: 400,
    }),
  }));
  return <Animated.View style={[{ flex: 1, height: 3, borderRadius: 3 }, style]} />;
}

/** The 6pm Close: about a minute from caught to tomorrow's number. */
export default function Close() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const { now } = useClock();
  const { top, bottom } = useDesignInsets();
  const snap = useMoney();
  const day = useDay();
  const actions = useMoneyActions();
  const close = useClose();
  const { state, dispatch } = close;
  const [editing, setEditing] = useState<string | null>(null);
  const [cash, setCash] = useState<CashChip[]>([]);
  const [closedAt] = useState(() => clockOf(now.getHours() + now.getMinutes() / 60));
  if (!day || !snap.plan) return null;

  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  // Companion keys are composed from the event and persona; every one takes the same placeholders.
  const lineFor = t as unknown as (key: string, params: Record<string, string | number>) => string;
  const shortDate = (d: Date) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
      .format(d)
      .toUpperCase();
  const position = stepPosition(state.step);
  const counts = tally(state);
  const editingSpend = editing ? close.queue.find((s) => s.id === editing) : undefined;
  const chips: CashChip[] = [
    { key: 'transport', name: t('close.cash.parking'), amount: 5_000 },
    { key: 'drinks', name: t('close.cash.sugarcane'), amount: 10_000 },
    { key: 'food', name: t('close.cash.xoi'), amount: 20_000 },
    { key: 'groceries', name: t('close.cash.market'), amount: 50_000 },
  ];
  const categoryFor = (key: string) =>
    snap.categories.find((c) => c.id === key)?.id ?? snap.categories[0]?.id ?? key;
  const todays = snap.cycleSpends.filter((s) => s.day === snap.today);
  const kept = todays.filter((s) => s.status === 'kept').sort((a, b) => (a.at < b.at ? -1 : 1));
  const work = kept.find((s) => s.forWork);
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const persona = snap.plan.persona;
  const revealEvent = day.spent === 0 ? 'zero' : day.replan ? 'replan' : 'reveal';
  const tomorrowDate = new Date(`${addDays(snap.today, 1)}T12:00:00`);
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(now);
  const monthDays = monthDots(now, snap.today, snap.closedDays);
  const closedThisMonth = monthDays.filter((d) => d !== 'open').length;

  const finish = async () => {
    await actions.closeDay({
      day: snap.today,
      closedAt: new Date().toISOString(),
      late: false,
      spent: day.spent,
      line: day.line,
      tomorrow: day.tomorrow,
      note: null,
    });
    haptics.success();
    router.back();
  };

  return (
    <View
      style={{
        flex: 1,
        experimental_backgroundImage: palette.skyDeep,
        paddingTop: top(60),
        paddingHorizontal: 20,
        paddingBottom: bottom(30),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 44 }}>
        <GlassButton
          icon="close"
          label={t('common.done')}
          onPress={() => (state.step === 'reveal' ? void finish() : router.back())}
        />
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {STEP_KEYS.map((key, i) => (
            <Dot key={key} index={i} current={position.index - 1} />
          ))}
        </View>
        <Text
          style={{
            ...mono(11, 400, 0.14),
            color: palette.inkSoft,
            minWidth: 64,
            textAlign: 'right',
          }}
        >
          {t(STEP_KEYS[position.index - 1] ?? 'close.step.cards')} · {position.index}/{position.of}
        </Text>
      </View>

      {state.step === 'cards' ? (
        <CloseCards
          cards={close.cards}
          kicker={
            counts.kept + counts.edited > 0
              ? t('close.kicker', {
                  date: shortDate(now),
                  n: close.queue.length - close.cards.length + 1,
                  total: close.queue.length,
                  kept: formatShort(close.keptBefore).toUpperCase(),
                })
              : t('close.kickerStart', { date: shortDate(now), n: 1, total: close.queue.length })
          }
          title={t('close.title', { count: close.queue.length })}
          hint={t('close.hint')}
          undoText={close.undoText}
          undoLabel={t('close.undo')}
          buttons={{
            edit: t('close.btn.edit'),
            notMine: t('close.btn.notMine'),
            keep: t('close.btn.keep'),
          }}
          onDecide={close.decide}
          onEdit={setEditing}
          onUndo={close.undo}
        />
      ) : null}
      {state.step === 'sorted' ? (
        <SortedStep
          title={t('close.sorted.title', { count: close.queue.length })}
          sub={t('close.sorted.sub', counts)}
          undoLabel={t('close.undoLast')}
          canUndo={state.undoable !== null}
          onUndo={close.undo}
        />
      ) : null}
      {state.step === 'cash' ? (
        <CashStep
          title={state.sweep ? t('close.cash.sweep') : t('close.cash.title')}
          sub={t('close.cash.sub')}
          chips={chips}
          added={cash}
          totalLabel={t('close.cash.total')}
          doneLabel={t('close.cash.done')}
          noneLabel={t('close.cash.none')}
          onAdd={(chip) => {
            haptics.tap();
            setCash((c) => [...c, chip]);
            void actions.addSpend({
              amount: chip.amount,
              categoryId: categoryFor(chip.key),
              merchant: chip.name,
              source: 'cash',
              status: 'kept',
            });
          }}
          onDone={() => dispatch({ type: 'cashDone' })}
        />
      ) : null}
      {state.step === 'question' && close.askWorkId ? (
        <WorkQuestionStep
          line={
            snap.plan.serious
              ? null
              : t(`companion.question.${persona}` as 'companion.question.cheeky')
          }
          receiptLine={(() => {
            const s = close.queue.find((q) => q.id === close.askWorkId);
            return {
              time: s ? time.format(new Date(s.at)) : '',
              name: s?.merchant ?? '',
              amount: s?.amount ?? 0,
            };
          })()}
          title={t('close.work.title')}
          sub={t('close.work.sub')}
          yes={t('close.work.yes')}
          no={t('close.work.no')}
          onAnswer={(forWork) => {
            haptics.tap();
            if (forWork && close.askWorkId) void actions.markForWork(close.askWorkId, true);
            dispatch({ type: 'answerWork' });
          }}
        />
      ) : null}
      {state.step === 'receipt' ? (
        <CloseReceipt
          no={String(snap.closedDays.length + 1).padStart(4, '0')}
          dateLine={`${new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(now).toUpperCase()} ${snap.today.split('-').reverse().join('.')} · ${closedAt}`}
          rows={kept
            .filter((s) => !s.forWork)
            .map((s) => ({
              time: time.format(new Date(s.at)),
              name: s.merchant.toUpperCase(),
              amount: s.amount,
            }))}
          claimBack={work ? { name: work.merchant.toUpperCase(), amount: work.amount } : null}
          total={day.spent}
          tomorrow={day.tomorrow}
          note={day.spent === 0 ? t('close.receipt.noteQuiet') : t('close.receipt.note')}
          closedAt={closedAt}
          labels={{
            daily: t('close.receipt.daily', {
              no: String(snap.closedDays.length + 1).padStart(4, '0'),
            }),
            empty: t('close.receipt.empty'),
            total: t('close.receipt.total'),
            tomorrow: t('close.receipt.tomorrow'),
            thanks: t('close.receipt.thanks'),
            closed: t('close.receipt.closed'),
            share: t('close.receipt.share'),
            next: t('close.receipt.next'),
            claimBack: t('close.receipt.claimBack', { name: work?.merchant.toUpperCase() ?? '' }),
          }}
          onShare={() => undefined}
          onNext={() => dispatch({ type: 'receiptDone' })}
        />
      ) : null}
      {state.step === 'reveal' ? (
        <CloseReveal
          kicker={t('close.reveal.kicker', { date: shortDate(tomorrowDate) })}
          from={Math.max(0, day.safe)}
          to={day.tomorrow}
          line={
            snap.plan.serious
              ? null
              : lineFor(`companion.${revealEvent}.${persona}`, {
                  t: formatShort(day.tomorrow),
                  b: formatShort(day.line),
                  day: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(now),
                })
          }
          mood={revealEvent === 'replan' ? 'nod' : 'happy'}
          sub={t('close.reveal.free', { free: formatShort(day.free), days: snap.cycle.daysLeft })}
          month={monthName.toUpperCase()}
          monthDays={monthDays}
          streak={t('close.reveal.streak', {
            closed: closedThisMonth,
            days: Number(snap.today.slice(8, 10)),
            month: monthName,
          })}
          nudge={t('close.reveal.nudge', { time: snap.plan.closeAt })}
          doneLabel={t('close.reveal.done')}
          onDone={() => void finish()}
        />
      ) : null}

      {editingSpend ? (
        <CloseEdit
          name={editingSpend.merchant}
          amount={editingSpend.amount}
          categoryId={editingSpend.categoryId}
          categories={snap.categories}
          saveLabel={t('close.edit.save')}
          onCancel={() => setEditing(null)}
          onSave={(amount, categoryId) => {
            void actions.update(editingSpend.id, { amount, categoryId });
            close.decide(editingSpend.id, 'edited');
            setEditing(null);
          }}
        />
      ) : null}
    </View>
  );
}

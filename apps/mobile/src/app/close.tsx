import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { clockOf, stepPosition, tally } from '@6pm/domain';

import { readDayNumber } from '../data/diary-queries';
import { useMoney, useMoneyActions, useMoneyStore } from '../data/money-provider';
import { CashCustom } from '../features/close/cash-custom';
import { BillQuestionStep } from '../features/close/close-bill-question';
import { CloseCards } from '../features/close/close-cards';
import { CloseEdit } from '../features/close/close-edit';
import { CloseReceiptStep } from '../features/close/close-receipt-step';
import { CloseRevealStep } from '../features/close/close-reveal-step';
import { CashStep, SortedStep } from '../features/close/close-steps';
import { WorkQuestionStep } from '../features/close/close-work-question';
import { CloseTopBar } from '../features/close/close-top-bar';
import { useClose } from '../features/close/use-close';
import { useCloseCash } from '../features/close/use-close-cash';
import { useClosingNumber } from '../features/close/use-closing-number';
import { useRuleOffer } from '../features/close/use-rule-offer';
import { useCompanionToast } from '../features/companion/use-companion-toast';
import { RulePrompt } from '../features/details/rule-prompt';
import { useI18n } from '../i18n/i18n';
import { useMoneyFormat } from '../money/use-money-format';
import { haptics } from '../ui/haptics';
import { useDesignInsets } from '../ui/layout/design-insets';
import { useClock } from '../ui/theme/clock';
import { useTheme } from '../ui/theme/theme';

/** The design phone's width less its 20 pt sides. */
const COLUMN = 362;

const STEP_KEYS = [
  'close.step.cards',
  'close.step.cash',
  'close.step.check',
  'close.step.receipt',
  'close.step.tomorrow',
] as const;

/** The 6pm Close: about a minute from caught to tomorrow's number. */
export default function Close() {
  const router = useRouter();
  const { palette } = useTheme();
  const { t, language } = useI18n();
  const money = useMoneyFormat();
  const { now } = useClock();
  const { top, bottom, rail } = useDesignInsets();
  const snap = useMoney();
  const store = useMoneyStore();
  const actions = useMoneyActions();
  const say = useCompanionToast();
  const close = useClose();
  // The number of the day being closed, even when the money day turns over mid-close.
  const day = useClosingNumber(close.day);
  const { state, dispatch, run } = close;
  const [editing, setEditing] = useState<string | null>(null);
  const [typingCash, setTypingCash] = useState(false);
  const rules = useRuleOffer(actions, state.step);
  const { chips, categoryFor, addCash } = useCloseCash(close);
  const [closedAt] = useState(() => clockOf(now.getHours() + now.getMinutes() / 60));
  const finishing = useRef(false);

  if (!day || !snap.plan) return null;

  const locale = language === 'vi' ? 'vi-VN' : 'en-GB';
  const closingDate = new Date(`${close.day}T12:00:00`);

  const shortDate = (d: Date) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' })
      .format(d)
      .toUpperCase();
  const position = stepPosition(state.step);
  const counts = tally(state);
  const editingSpend = editing ? close.queue.find((s) => s.id === editing) : undefined;
  const rule = rules.offer
    ? snap.categories.find((c) => c.id === rules.offer?.categoryId)
    : undefined;

  const finish = async () => {
    if (finishing.current) return;
    finishing.current = true;
    const saved = await run(async () => {
      // Worked out for the closed day itself, with the cash just added, so a close that crossed
      // 04:00 still files that day's receipt.
      const number = (await readDayNumber(store, store.getSnapshot(), close.day)) ?? day;
      await actions.closeDay({
        day: close.day,
        closedAt: new Date().toISOString(),
        late: false,
        spent: number.spent,
        line: number.line,
        tomorrow: number.tomorrow,
        note: null,
      });
    });
    if (!saved) {
      finishing.current = false;
      return;
    }
    close.settle();
    haptics.success();
    router.back();
  };

  const edit = (amount: number, categoryId: string) => {
    if (!editingSpend) return;
    close.decide(editingSpend.id, 'edited', { amount, categoryId });
    setEditing(null);
    rules.changed(editingSpend.merchant, editingSpend.categoryId, categoryId);
  };

  return (
    <View
      style={{
        flex: 1,
        experimental_backgroundImage: palette.skyDeep,
        paddingTop: top(60),
        paddingLeft: 20,
        paddingRight: 20 + rail,
        paddingBottom: bottom(30),
      }}
    >
      {/* A phone's column, centred where the screen is wider (the iPhone Duo opened). */}
      <View style={{ flex: 1, width: '100%', maxWidth: COLUMN, alignSelf: 'center' }}>
        <CloseTopBar
          keys={STEP_KEYS}
          index={position.index}
          of={position.of}
          label={t(STEP_KEYS[position.index - 1] ?? 'close.step.cards')}
          closeLabel={t('common.done')}
          onClose={() => (state.step === 'reveal' ? void finish() : router.back())}
        />

        {state.step === 'cards' ? (
          <CloseCards
            cards={close.cards}
            kicker={
              counts.kept + counts.edited > 0
                ? t('close.kicker', {
                    date: shortDate(closingDate),
                    n: close.queue.length - close.cards.length + 1,
                    total: close.queue.length,
                    kept: money.short(close.keptBefore).toUpperCase(),
                  })
                : t('close.kickerStart', {
                    date: shortDate(closingDate),
                    n: 1,
                    total: close.queue.length,
                  })
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
            added={close.cash}
            totalLabel={t('close.cash.total')}
            doneLabel={t('close.cash.done')}
            noneLabel={t('close.cash.none')}
            otherLabel={t('close.cash.other')}
            onAdd={(chip) => addCash(chip.name, chip.amount, categoryFor(chip.key), chip.key)}
            onSaid={(said) =>
              addCash(said.name, said.amount, categoryFor(said.key), said.key, 'voice')
            }
            onOther={() => setTypingCash(true)}
            onDone={() => dispatch({ type: 'cashDone' })}
          />
        ) : null}
        {state.step === 'bill' ? (
          <BillQuestionStep state={state} queue={close.queue} dispatch={dispatch} run={run} />
        ) : null}
        {state.step === 'question' && close.askWorkId ? (
          <WorkQuestionStep
            line={
              snap.plan.serious
                ? null
                : t(`companion.question.${snap.plan.persona}` as 'companion.question.cheeky')
            }
            receiptLine={(() => {
              const s = close.queue.find((q) => q.id === close.askWorkId);
              return {
                time: s
                  ? new Intl.DateTimeFormat(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    }).format(new Date(s.at))
                  : '',
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
              const id = close.askWorkId;
              if (forWork && id) void run(() => actions.markForWork(id, true));
              dispatch({ type: 'answerWork' });
            }}
          />
        ) : null}
        {state.step === 'receipt' ? (
          <CloseReceiptStep
            day={close.day}
            closedAt={closedAt}
            spent={day.spent}
            tomorrow={day.tomorrow}
            onNext={() => dispatch({ type: 'receiptDone' })}
          />
        ) : null}
        {state.step === 'reveal' ? (
          <CloseRevealStep day={close.day} number={day} onDone={() => void finish()} />
        ) : null}
      </View>

      {rules.offer && rule ? (
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: bottom(24), zIndex: 15 }}>
          <RulePrompt
            text={t('rule.ask', { merchant: rules.offer.merchant, category: rule.name })}
            once={t('rule.once')}
            always={t('rule.always')}
            onOnce={rules.dismiss}
            onAlways={() => {
              const offer = rules.offer;
              if (!offer) return;
              rules.dismiss();
              void run(() => actions.rememberMerchant(offer.merchant, offer.categoryId)).then(
                (saved) => {
                  if (saved) say('ruleSaved');
                },
              );
            }}
          />
        </View>
      ) : null}

      {editingSpend ? (
        <CloseEdit
          name={editingSpend.merchant}
          amount={editingSpend.amount}
          categoryId={editingSpend.categoryId}
          categories={snap.categories}
          saveLabel={t('close.edit.save')}
          onCancel={() => setEditing(null)}
          onSave={edit}
        />
      ) : null}
      {typingCash ? (
        <CashCustom
          title={t('close.cash.otherTitle')}
          addLabel={t('close.cash.add')}
          categories={snap.categories}
          initialCategoryId={categoryFor('food')}
          onCancel={() => setTypingCash(false)}
          onAdd={(amount, categoryId) => {
            setTypingCash(false);
            const name = snap.categories.find((c) => c.id === categoryId)?.name ?? t('source.cash');
            addCash(name, amount, categoryId, 'custom');
          }}
        />
      ) : null}
    </View>
  );
}

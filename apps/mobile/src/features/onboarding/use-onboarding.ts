import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { DEFAULT_CLOSE_AT, type Payday } from '@6pm/domain';

import { useMoneyStore } from '../../data/money-provider';
import { completeOnboarding } from '../../data/onboarding';
import { useI18n } from '../../i18n/i18n';
import { haptics } from '../../ui/haptics';
import { useClock } from '../../ui/theme/clock';
import { billName } from './bill-copy';
import { billTotal, chosenBills, dealDeck, NO_BILL_ANSWERS, type BillAnswers } from './bill-deck';
import { DECK_START, type DeckNav } from './bill-deck-view';
import { askForReminders, scheduleCloseReminder } from './close-reminder';
import { firstDay, futureYouOf } from './onboarding-maths';
import { STEP_COUNT } from './onboarding-palette';

/** The design's starting answers: a wheel has to rest somewhere. Bills always start at zero. */
const START = { income: 15_500_000, payday: 25, percent: 12 } as const;
/** "Open 6pm" holds the closing sky this long before Home takes over. */
const LEAVE_MS = 1100;
export const LAST_STEP = STEP_COUNT - 1;
export const BILLS_STEP = 2;
export const CLOSE_STEP = 6;

/** Onboarding's answers and moves, and what follows from them. */
export function useOnboarding(startStep = 0) {
  const router = useRouter();
  const store = useMoneyStore();
  const i18n = useI18n();
  const { today } = useClock();

  const [step, setStep] = useState(startStep);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [income, setIncome] = useState<number>(START.income);
  const [sameDay, setSameDay] = useState<number>(START.payday);
  const [payday, setPaydayState] = useState<Payday>({ kind: 'sameDay', day: START.payday });
  const [percent, setPercent] = useState<number>(START.percent);
  const [answers, setAnswers] = useState<BillAnswers>(NO_BILL_ANSWERS);
  const [nav, setNav] = useState<DeckNav>(DECK_START);
  const [wallets, setWallets] = useState<readonly string[]>([]);
  const [closeAt, setCloseAt] = useState(DEFAULT_CLOSE_AT);
  const [reminders, setReminders] = useState<boolean | null>(null);
  const [leaving, setLeaving] = useState(false);
  const busy = useRef(false);

  const deck = dealDeck(answers);
  const bills = chosenBills(deck, answers);
  const billSum = billTotal(bills);
  const futureYou = futureYouOf(income, percent);
  const first = firstDay({ income, payday, bills: billSum, futureYou }, today);
  const dailyHint = firstDay({ income, payday, bills: 0, futureYou: 0 }, today).line;

  const finish = async () => {
    if (busy.current) return;
    busy.current = true;
    setLeaving(true);
    haptics.tap();
    const shown = new Promise((resolve) => setTimeout(resolve, LEAVE_MS));
    try {
      await completeOnboarding(
        store,
        {
          income,
          payday,
          futureYou,
          bills: bills.map((b) => ({
            name: billName(i18n, b.card, b.option),
            icon: b.icon,
            hue: b.hue,
            amount: b.amount,
            dueDay: b.dueDay,
          })),
          wallets,
          closeAt,
        },
        { today, language: i18n.language },
      );
    } catch {
      // Nothing was committed: the overlay lifts and "Open 6pm" can be tried again.
      busy.current = false;
      setLeaving(false);
      return;
    }
    // The month is set up either way; a reminder iOS refuses to schedule must not undo that.
    if (reminders) await scheduleCloseReminder(i18n.language, closeAt).catch(() => undefined);
    await shown;
    router.replace('/');
  };

  const go = (target: number) => {
    if (target > LAST_STEP) {
      void finish();
      return;
    }
    const next = Math.max(0, target);
    haptics.tap();
    setDirection(next >= step ? 1 : -1);
    // Coming back to the deck shows its top card without replaying the last fling.
    if (next === BILLS_STEP) setNav((n) => ({ ...n, from: null }));
    setStep(next);
  };

  const next = async () => {
    if (step === CLOSE_STEP && reminders === null) {
      haptics.tap();
      const granted = await askForReminders().catch(() => false);
      setReminders(granted);
      go(step + 1);
      return;
    }
    go(step + 1);
  };

  return {
    step,
    direction,
    leaving,
    today,
    income,
    payday,
    sameDay,
    percent,
    answers,
    nav,
    deck,
    bills,
    billSum,
    futureYou,
    first,
    dailyHint,
    wallets,
    closeAt,
    reminders,
    go,
    next: () => void next(),
    back: () => go(step - 1),
    skip: () => go(step + 1),
    setIncome,
    setPayday: (next: Payday) => {
      if (next.kind === 'sameDay') setSameDay(next.day);
      if (next.kind !== payday.kind) haptics.tap();
      setPaydayState(next);
    },
    setPercent,
    setAnswers,
    billGo: (index: number, dir: 1 | -1) => {
      haptics.tap();
      setNav((n) => ({ index, from: n.index, direction: dir, moves: n.moves + 1 }));
    },
    toggleWallet: (id: string) => {
      haptics.tap();
      setWallets((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
    },
    setCloseAt,
  };
}

export type Onboarding = ReturnType<typeof useOnboarding>;

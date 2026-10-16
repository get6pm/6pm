/**
 * The 6pm Close as a state machine, independent of any screen:
 *
 *   cards → sorted → cash (or sweep when nothing was caught) → bill? → question? → receipt → reveal
 *
 * - `cards`: each waiting spend is kept, edited (then kept) or marked not mine; the last swipe can
 *   be undone.
 * - `sorted`: a beat that tallies the swipes, then moves on by itself.
 * - `cash`: anything paid in cash today; `sweep` is the same step when nothing was caught.
 * - `bill`: one question per kept spend that looks like a bill's payment ("Is this your {bill}?")
 *   or a repayment with no bill ("Paying off a card or loan?"), in the queue's order.
 * - `question`: asked only when a kept spend is flagged as maybe-for-work and not yet answered.
 * - `receipt` and `reveal`: the printed day and tomorrow's number.
 *
 * Leaving at any step pauses the close; resuming returns to that step (`sorted` resumes at cash).
 */

export type CloseStep =
  'cards' | 'sorted' | 'cash' | 'bill' | 'question' | 'receipt' | 'reveal' | 'done';

export type CardVerdict = 'kept' | 'edited' | 'notMine';

export interface CloseCard {
  readonly id: string;
  /** The spend might be for work: the close asks once. */
  readonly askWork?: boolean;
  /**
   * The spend may have paid a bill: the bill's id, or `REPAYMENT` for a card or loan with no bill.
   * The close asks once.
   */
  readonly askBill?: string;
}

export interface CloseState {
  readonly step: CloseStep;
  /** The queue as it was when the close opened; its order never changes during the close. */
  readonly cards: readonly CloseCard[];
  readonly verdicts: Readonly<Record<string, CardVerdict>>;
  /** The last decided card, while its undo is still offered. */
  readonly undoable: string | null;
  /** Nothing was caught today: the cash step is a quick sweep. */
  readonly sweep: boolean;
  readonly workAnswered: boolean;
  /** Bill questions answered, by card id: true when the spend paid it. */
  readonly billAnswers: Readonly<Record<string, boolean>>;
  readonly paused: boolean;
}

export type CloseEvent =
  | { readonly type: 'decide'; readonly id: string; readonly verdict: CardVerdict }
  | { readonly type: 'undo' }
  | { readonly type: 'undoExpired' }
  | { readonly type: 'sortedShown' }
  | { readonly type: 'cashDone' }
  | { readonly type: 'answerBill'; readonly id: string; readonly paid: boolean }
  | { readonly type: 'answerWork' }
  | { readonly type: 'receiptDone' }
  | { readonly type: 'finish' }
  | { readonly type: 'pause' }
  | { readonly type: 'resume' };

export function startClose(cards: readonly CloseCard[]): CloseState {
  return {
    step: cards.length > 0 ? 'cards' : 'cash',
    cards,
    verdicts: {},
    undoable: null,
    sweep: cards.length === 0,
    workAnswered: false,
    billAnswers: {},
    paused: false,
  };
}

/** The cards still to decide, in order. */
export function remainingCards(state: CloseState): readonly CloseCard[] {
  return state.cards.filter((card) => state.verdicts[card.id] === undefined);
}

export interface CloseTally {
  readonly kept: number;
  readonly edited: number;
  readonly notMine: number;
}

export function tally(state: CloseState): CloseTally {
  const verdicts = Object.values(state.verdicts);
  return {
    kept: verdicts.filter((v) => v === 'kept').length,
    edited: verdicts.filter((v) => v === 'edited').length,
    notMine: verdicts.filter((v) => v === 'notMine').length,
  };
}

/** The next card the close asks "Is this your bill?" about, or null when none is left. */
export function billQuestion(state: CloseState): CloseCard | null {
  return (
    state.cards.find(
      (card) =>
        card.askBill !== undefined &&
        state.verdicts[card.id] !== 'notMine' &&
        state.billAnswers[card.id] === undefined,
    ) ?? null
  );
}

/** A spend that paid a bill is not spending, so it is never asked about as work. */
function needsWorkQuestion(state: CloseState): boolean {
  if (state.workAnswered) return false;
  return state.cards.some(
    (card) =>
      card.askWork === true &&
      state.verdicts[card.id] !== 'notMine' &&
      state.billAnswers[card.id] !== true,
  );
}

/** Where the close goes after the cash step and each bill answer. */
function afterCash(state: CloseState): CloseState {
  const step = billQuestion(state) ? 'bill' : needsWorkQuestion(state) ? 'question' : 'receipt';
  return { ...state, step };
}

export function closeReducer(state: CloseState, event: CloseEvent): CloseState {
  switch (event.type) {
    case 'decide': {
      // A paused close takes no swipes until it is resumed.
      if (state.paused || state.step !== 'cards' || state.verdicts[event.id] !== undefined) {
        return state;
      }
      if (!state.cards.some((card) => card.id === event.id)) return state;
      const verdicts = { ...state.verdicts, [event.id]: event.verdict };
      const next = { ...state, verdicts, undoable: event.id };
      return remainingCards(next).length === 0 ? { ...next, step: 'sorted' } : next;
    }
    case 'undo': {
      if (state.undoable === null) return state;
      if (state.step !== 'cards' && state.step !== 'sorted') return state;
      const { [state.undoable]: _undone, ...verdicts } = state.verdicts;
      return { ...state, verdicts, undoable: null, step: 'cards' };
    }
    case 'undoExpired':
      return { ...state, undoable: null };
    case 'sortedShown':
      return state.step === 'sorted' ? { ...state, step: 'cash', undoable: null } : state;
    case 'cashDone':
      return state.step === 'cash' ? afterCash(state) : state;
    case 'answerBill': {
      if (state.step !== 'bill' || billQuestion(state)?.id !== event.id) return state;
      return afterCash({ ...state, billAnswers: { ...state.billAnswers, [event.id]: event.paid } });
    }
    case 'answerWork':
      return state.step === 'question' ? { ...state, workAnswered: true, step: 'receipt' } : state;
    case 'receiptDone':
      return state.step === 'receipt' ? { ...state, step: 'reveal' } : state;
    case 'finish':
      return state.step === 'reveal' ? { ...state, step: 'done', paused: false } : state;
    case 'pause':
      // Leaving the reveal finishes the day; leaving mid-sort comes back at the cash step.
      if (state.step === 'reveal') return { ...state, step: 'done' };
      if (state.step === 'done') return state;
      return {
        ...state,
        paused: true,
        undoable: null,
        step: state.step === 'sorted' ? 'cash' : state.step,
      };
    case 'resume':
      return { ...state, paused: false };
  }
}

/** "CAUGHT · 1/5" … "TOMORROW · 5/5": the step label and its position in the five-step bar. */
export function stepPosition(step: CloseStep): { index: number; of: 5 } {
  const index =
    step === 'cards' || step === 'sorted'
      ? 1
      : step === 'cash'
        ? 2
        : step === 'bill' || step === 'question'
          ? 3
          : step === 'receipt'
            ? 4
            : 5;
  return { index, of: 5 };
}

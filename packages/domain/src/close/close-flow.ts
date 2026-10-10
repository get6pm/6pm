/**
 * The 6pm Close as a state machine, independent of any screen:
 *
 *   cards → sorted → cash (or sweep when nothing was caught) → question? → receipt → reveal
 *
 * - `cards`: each waiting spend is kept, edited (then kept) or marked not mine; the last swipe can
 *   be undone.
 * - `sorted`: a beat that tallies the swipes, then moves on by itself.
 * - `cash`: anything paid in cash today; `sweep` is the same step when nothing was caught.
 * - `question`: asked only when a kept spend is flagged as maybe-for-work and not yet answered.
 * - `receipt` and `reveal`: the printed day and tomorrow's number.
 *
 * Leaving at any step pauses the close; resuming returns to that step (`sorted` resumes at cash).
 */

export type CloseStep = 'cards' | 'sorted' | 'cash' | 'question' | 'receipt' | 'reveal' | 'done';

export type CardVerdict = 'kept' | 'edited' | 'notMine';

export interface CloseCard {
  readonly id: string;
  /** The spend might be for work: the close asks once. */
  readonly askWork?: boolean;
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
  readonly paused: boolean;
}

export type CloseEvent =
  | { readonly type: 'decide'; readonly id: string; readonly verdict: CardVerdict }
  | { readonly type: 'undo' }
  | { readonly type: 'undoExpired' }
  | { readonly type: 'sortedShown' }
  | { readonly type: 'cashDone' }
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

function needsWorkQuestion(state: CloseState): boolean {
  if (state.workAnswered) return false;
  return state.cards.some((card) => card.askWork === true && state.verdicts[card.id] !== 'notMine');
}

export function closeReducer(state: CloseState, event: CloseEvent): CloseState {
  switch (event.type) {
    case 'decide': {
      if (state.step !== 'cards' || state.verdicts[event.id] !== undefined) return state;
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
      if (state.step !== 'cash') return state;
      return { ...state, step: needsWorkQuestion(state) ? 'question' : 'receipt' };
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
        : step === 'question'
          ? 3
          : step === 'receipt'
            ? 4
            : 5;
  return { index, of: 5 };
}

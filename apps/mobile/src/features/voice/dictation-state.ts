import { parseSpokenSpend, type SpokenSpend } from '@6pm/domain';

/**
 * Where saying a spend is: waiting, hearing it, waiting for the last words after the finger lifts,
 * or done with what was heard. `denied` and `unavailable` stay until the screen opens again.
 */
export type DictationPhase =
  'idle' | 'listening' | 'finishing' | 'parsed' | 'nothing' | 'noAmount' | 'denied' | 'unavailable';

export interface DictationState {
  readonly phase: DictationPhase;
  /** Words the recogniser has settled on. */
  readonly settled: string;
  /** Words still being guessed after the settled ones. */
  readonly guess: string;
  /** What was read from the words once they stopped; null until then. */
  readonly spend: SpokenSpend | null;
}

export type DictationEvent =
  | { readonly type: 'start' }
  | { readonly type: 'heard'; readonly text: string; readonly final: boolean }
  | { readonly type: 'release' }
  | { readonly type: 'end' }
  | { readonly type: 'failed'; readonly error: string }
  | { readonly type: 'denied' }
  | { readonly type: 'unavailable' }
  | { readonly type: 'reset' };

export const initialDictation: DictationState = {
  phase: 'idle',
  settled: '',
  guess: '',
  spend: null,
};

/** Errors that mean this iPhone cannot understand the language without a server. */
const UNAVAILABLE = new Set(['language-not-supported', 'service-not-allowed']);

/**
 * Adds a result to the words so far. Some iOS versions restart the text after each pause, others
 * repeat everything said: a result that already starts with the settled words replaces them.
 */
export function mergeHeard(settled: string, text: string): string {
  const said = text.trim();
  const before = settled.trim();
  if (before === '') return said;
  if (said === '') return before;
  return said.toLowerCase().startsWith(before.toLowerCase()) ? said : `${before} ${said}`;
}

/** Everything heard so far, settled words and the guess after them. */
export function heardText(state: DictationState): string {
  return state.guess === '' ? state.settled : mergeHeard(state.settled, state.guess);
}

const hearing = (phase: DictationPhase) => phase === 'listening' || phase === 'finishing';

/** Once the words stop: what they were, or why there is nothing to keep. */
function settle(state: DictationState): DictationState {
  const text = heardText(state).trim();
  if (text === '') return { ...state, phase: 'nothing', settled: '', guess: '', spend: null };
  const spend = parseSpokenSpend(text);
  return {
    phase: spend.amount === null ? 'noAmount' : 'parsed',
    settled: text,
    guess: '',
    spend,
  };
}

export function dictationReducer(state: DictationState, event: DictationEvent): DictationState {
  switch (event.type) {
    case 'start':
      if (state.phase === 'unavailable' || hearing(state.phase)) return state;
      return { ...initialDictation, phase: 'listening' };
    case 'heard':
      if (!hearing(state.phase)) return state;
      return event.final
        ? { ...state, settled: mergeHeard(state.settled, event.text), guess: '' }
        : { ...state, guess: event.text.trim() };
    case 'release':
      return state.phase === 'listening' ? { ...state, phase: 'finishing' } : state;
    case 'end':
      return hearing(state.phase) ? settle(state) : state;
    case 'failed':
      if (event.error === 'not-allowed') return { ...initialDictation, phase: 'denied' };
      if (UNAVAILABLE.has(event.error)) return { ...initialDictation, phase: 'unavailable' };
      if (!hearing(state.phase)) return state;
      // Stopped from the app (the screen closed, the mode changed): nothing to read.
      if (event.error === 'aborted') return initialDictation;
      return settle(state);
    case 'denied':
      return state.phase === 'unavailable' ? state : { ...initialDictation, phase: 'denied' };
    case 'unavailable':
      return { ...initialDictation, phase: 'unavailable' };
    case 'reset':
      return state.phase === 'unavailable' ? state : initialDictation;
  }
}

/** The phases where what was heard has been read and the screen can use it. */
export function isRead(phase: DictationPhase): boolean {
  return phase === 'parsed' || phase === 'noAmount';
}

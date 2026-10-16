import type { DictationPhase } from './dictation-state';

/**
 * What quick add's voice panel shows over the keypad. `waiting` is the moment between the tap and
 * the first sound (the microphone is being asked for); `reading` waits for the last words after
 * the user stops; `heard` is a spend read with its amount.
 */
export type VoiceStage =
  | 'closed'
  | 'waiting'
  | 'listening'
  | 'reading'
  | 'heard'
  | 'noAmount'
  | 'nothing'
  | 'denied'
  | 'unavailable';

/** The panel's stage for whether it is open and where the dictation is. */
export function voiceStage(open: boolean, phase: DictationPhase): VoiceStage {
  if (!open) return 'closed';
  if (phase === 'idle') return 'waiting';
  if (phase === 'finishing') return 'reading';
  if (phase === 'parsed') return 'heard';
  return phase;
}

/** How long a spend read with its amount stays on the panel before the keypad comes back. */
export const HEARD_HOLD_MS = 1500;

/** What a tap on the microphone does in each stage. */
export function micAction(stage: VoiceStage): 'start' | 'stop' | 'none' {
  if (stage === 'closed' || stage === 'noAmount' || stage === 'nothing') return 'start';
  if (stage === 'waiting' || stage === 'listening') return 'stop';
  return 'none';
}

/** What the wide button beside the microphone does: keep the spend, finish talking, or cancel. */
export function mainAction(stage: VoiceStage): 'keep' | 'stop' | 'cancel' {
  if (stage === 'closed') return 'keep';
  if (stage === 'waiting' || stage === 'listening') return 'stop';
  return 'cancel';
}

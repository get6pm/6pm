import { useEffect, useState } from 'react';

import {
  editKeypadOf,
  ruleCategoryFor,
  ruleIndex,
  type KeypadState,
  type MerchantRuleRow,
} from '@6pm/domain';
import type { Language } from '@6pm/i18n';

import { useMoneyFormat } from '../../money/use-money-format';
import type { DictationState } from './dictation-state';
import { useDictation, type Dictation } from './use-dictation';
import { HEARD_HOLD_MS, mainAction, micAction, voiceStage, type VoiceStage } from './voice-stage';
import {
  contextualStrings,
  spendIn,
  spokenCategory,
  spokenChips,
  type VoiceChip,
} from './voice-support';

interface Category {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

export interface VoiceEntry {
  readonly dictation: Dictation;
  readonly stage: VoiceStage;
  readonly chips: readonly VoiceChip[];
  /** The words that last filled the ticket, until the keypad changes it. */
  readonly heard: string | null;
  /** Whether what is on the ticket was said at some point. */
  readonly said: boolean;
  /** The microphone was tapped. */
  readonly tapMic: () => void;
  /** The main button was tapped while the panel is open. */
  readonly tapMain: () => void;
  /** The keypad changed the amount: the ticket no longer shows only what was heard. */
  readonly forgetHeard: () => void;
}

/**
 * Quick add's voice: tapped, the microphone listens over the keypad; what was said fills the
 * same ticket the keypad does (amount, what it was, its category), so the keypad can still
 * correct it once it comes back.
 */
export function useVoiceEntry({
  language,
  categories,
  rules,
  setKeys,
  setNote,
  setPicked,
}: {
  readonly language: Language;
  readonly categories: readonly Category[];
  readonly rules: readonly MerchantRuleRow[];
  readonly setKeys: (keys: KeypadState) => void;
  readonly setNote: (note: string) => void;
  readonly setPicked: (categoryId: string | null) => void;
}): VoiceEntry {
  const [chips, setChips] = useState<readonly VoiceChip[]>([]);
  const [open, setOpen] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const [said, setSaid] = useState(false);
  const money = useMoneyFormat();
  const home = money.currency;

  const onRead = (state: DictationState) => {
    if (!state.spend) return;
    const spend = spendIn(state.spend, state.settled, home);
    const ids = new Set(categories.map((c) => c.id));
    const learned = spend.name ? ruleCategoryFor(ruleIndex(rules), spend.name, ids) : null;
    const categoryId = spokenCategory(spend, learned, ids);
    const category = categories.find((c) => c.id === (learned ?? categoryId)) ?? null;
    setChips(spokenChips(spend, category, money));
    // Without an amount the ticket keeps what the keypad had; the panel says what is missing.
    if (spend.amount === null) return;
    setHeard(state.settled);
    setSaid(true);
    // The amount said, on the keypad in the home currency, as if typed.
    setKeys(editKeypadOf({ amount: spend.amount, foreignAmount: null }, home));
    setNote(spend.name);
    // A learned merchant is picked by the ticket itself from the name.
    setPicked(learned ? null : categoryId);
  };

  const dictation = useDictation({
    language,
    contextualStrings: contextualStrings(categories.map((c) => c.name)),
    hold: false,
    onRead,
  });
  const stage = voiceStage(open, dictation.state.phase);

  // A spend heard with its amount shows its chips for a moment, then the keypad comes back.
  useEffect(() => {
    if (stage !== 'heard') return;
    const timer = setTimeout(() => setOpen(false), HEARD_HOLD_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const close = () => {
    dictation.cancel();
    setOpen(false);
  };
  const finish = () => {
    // Stopped before the microphone opened: there is nothing to wait for.
    if (dictation.listening) dictation.stop();
    else close();
  };

  return {
    dictation,
    stage,
    chips,
    heard: stage === 'closed' ? heard : null,
    said,
    tapMic: () => {
      const action = micAction(stage);
      if (action === 'start') {
        setOpen(true);
        void dictation.start().then((began) => began || setOpen(false));
      } else if (action === 'stop') finish();
    },
    tapMain: () => {
      const action = mainAction(stage);
      if (action === 'stop') finish();
      else if (action === 'cancel') close();
    },
    forgetHeard: () => setHeard(null),
  };
}

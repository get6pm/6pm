import { useState } from 'react';

import {
  emptyKeypad,
  ruleCategoryFor,
  ruleIndex,
  type KeypadState,
  type MerchantRuleRow,
} from '@6pm/domain';
import type { Language } from '@6pm/i18n';

import type { DictationState } from './dictation-state';
import { useDictation, type Dictation } from './use-dictation';
import { contextualStrings, spokenCategory, spokenChips } from './voice-support';

interface Category {
  readonly id: string;
  readonly name: string;
}

/**
 * Quick add's voice: what was said fills the same ticket the keypad does (amount, what it was,
 * its category), so switching back to the keypad can still correct it.
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
}): { readonly dictation: Dictation; readonly chips: readonly string[] } {
  const [chips, setChips] = useState<readonly string[]>([]);

  const onRead = (state: DictationState) => {
    const spend = state.spend;
    if (!spend) return;
    const ids = new Set(categories.map((c) => c.id));
    const learned = spend.name ? ruleCategoryFor(ruleIndex(rules), spend.name, ids) : null;
    const categoryId = spokenCategory(spend, learned, ids);
    setKeys(
      spend.amount === null ? emptyKeypad : { digits: String(spend.amount), currency: 'VND' },
    );
    setNote(spend.name);
    // A learned merchant is picked by the ticket itself from the name.
    setPicked(learned ? null : categoryId);
    setChips(spokenChips(spend, categories.find((c) => c.id === categoryId)?.name ?? null));
  };

  const dictation = useDictation({
    language,
    contextualStrings: contextualStrings(categories.map((c) => c.name)),
    hold: true,
    onRead,
  });
  const reading = dictation.listening || !['parsed', 'noAmount'].includes(dictation.state.phase);
  return { dictation, chips: reading ? [] : chips };
}

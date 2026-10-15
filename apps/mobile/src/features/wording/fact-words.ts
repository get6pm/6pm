import { formatShort, type Fact, type FactKind, type FactSlot, slotsOf } from '@6pm/domain';
import type { Language } from '@6pm/i18n';

/** The companion's voice: a personality, or plain in serious mode. */
export type Voice = 'soft' | 'cheeky' | 'roast' | 'plain';

export interface SlotWords {
  readonly language: Language;
  /** Looks up a catalogue key with runtime params. */
  readonly say: (key: string, params?: Readonly<Record<string, string | number>>) => string;
  readonly categoryName: (id: string) => string;
  /** "9 October", "9 tháng 10". */
  readonly dayMonth: (date: Date) => string;
}

function slotText(slot: FactSlot, words: SlotWords): string {
  switch (slot.type) {
    case 'money':
      return formatShort(slot.value, words.language);
    case 'count':
      return String(slot.value);
    case 'date': {
      const [y, m, d] = slot.value.split('-').map(Number);
      return words.dayMonth(new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1));
    }
    case 'merchant':
      return slot.value;
    case 'category':
      return words.categoryName(slot.id);
    case 'pot':
    case 'bill':
      return slot.name;
    case 'compare':
      return words.say(`insight.compare.${slot.value}`);
  }
}

/** Each slot of a fact as the words a line shows, in the user's language. */
export function slotValues(fact: Fact, words: SlotWords): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, slot] of Object.entries(slotsOf(fact))) {
    if (slot !== undefined) values[name] = slotText(slot, words);
  }
  return values;
}

/** The slot a line's plural follows, for kinds whose number can be one. */
const PLURAL_SLOT: Partial<Record<FactKind, string>> = {
  waitingTonight: 'count',
  paydaySoon: 'days',
  billDue: 'days',
  weekSpare: 'days',
  workToClaim: 'count',
};

/** The catalogue's name for a fact: some kinds have separate lines by direction or by day. */
function catalogueKind(fact: Fact): string {
  if (fact.kind === 'billDue' && fact.slots.days.type === 'count' && fact.slots.days.value === 0) {
    return 'billDueToday';
  }
  if (fact.kind === 'categoryPace') {
    const word = fact.slots.compare.type === 'compare' ? fact.slots.compare.value : 'more';
    return word === 'more' || word === 'muchMore' ? 'categoryPaceUp' : 'categoryPaceDown';
  }
  return fact.kind;
}

/** How many variants each voice has in the catalogue (plain has one). */
export const CATALOGUE_VARIANTS = 2;

export function catalogueKey(fact: Fact, voice: Voice, variant: number): string {
  const kind = catalogueKind(fact);
  return voice === 'plain'
    ? `insight.${kind}.plain`
    : `insight.${kind}.${voice}.${String((variant % CATALOGUE_VARIANTS) + 1)}`;
}

/** The fact's line from the catalogue, filled: the floor every phone can say, offline. */
export function catalogueLine(
  fact: Fact,
  voice: Voice,
  variant: number,
  words: SlotWords,
  values: Readonly<Record<string, string>> = slotValues(fact, words),
): string {
  const pluralSlot = PLURAL_SLOT[fact.kind];
  const counted = pluralSlot === undefined ? undefined : slotsOf(fact)[pluralSlot];
  const count = counted?.type === 'count' ? { count: counted.value } : {};
  return words.say(catalogueKey(fact, voice, variant), { ...values, ...count });
}

import type { SymbolName } from '../../ui/icons/symbols.generated';

/**
 * The fixed-bills deck: one yes/no card per common bill, two pick-several cards, and an amount
 * card for every yes and every pick. Amounts start at zero: nobody is judged against a range.
 */
export type AskKey = 'rent' | 'power' | 'phone';
export type MultiKey = 'subs' | 'other';

export interface BillOption {
  readonly id: string;
  readonly icon: SymbolName;
  /** Brand names are shown as they are in every language; the rest come from the catalogue. */
  readonly brand?: string;
}

export type BillCard =
  | { readonly kind: 'ask'; readonly key: AskKey; readonly icon: SymbolName; readonly hue: number }
  | {
      readonly kind: 'multi';
      readonly key: MultiKey;
      readonly icon: SymbolName;
      readonly hue: number;
      readonly options: readonly BillOption[];
    };

export const BILL_CARDS: readonly BillCard[] = [
  { kind: 'ask', key: 'rent', icon: 'home', hue: 30 },
  { kind: 'ask', key: 'power', icon: 'bolt', hue: 80 },
  { kind: 'ask', key: 'phone', icon: 'wifi', hue: 250 },
  {
    kind: 'multi',
    key: 'subs',
    icon: 'subscriptions',
    hue: 330,
    options: [
      { id: 'spotify', icon: 'music_note', brand: 'Spotify' },
      { id: 'youtube', icon: 'smart_display', brand: 'YouTube' },
      { id: 'netflix', icon: 'movie', brand: 'Netflix' },
      { id: 'icloud', icon: 'cloud', brand: 'iCloud+' },
      { id: 'chatgpt', icon: 'auto_awesome', brand: 'ChatGPT' },
      { id: 'appleOne', icon: 'apps', brand: 'Apple One' },
    ],
  },
  {
    kind: 'multi',
    key: 'other',
    icon: 'event_repeat',
    hue: 150,
    options: [
      { id: 'gym', icon: 'fitness_center' },
      { id: 'insurance', icon: 'health_and_safety' },
      { id: 'instalment', icon: 'credit_card' },
      { id: 'family', icon: 'family_restroom' },
      { id: 'tuition', icon: 'school' },
      { id: 'parking', icon: 'local_parking' },
    ],
  },
];

export interface MultiAnswer {
  readonly picked: readonly string[];
  readonly done: boolean;
}

export interface BillAnswers {
  readonly asks: Readonly<Partial<Record<AskKey, boolean>>>;
  readonly multis: Readonly<Partial<Record<MultiKey, MultiAnswer>>>;
  /** Monthly amount per bill key ('rent', 'subs:spotify'); a key is present once it was answered. */
  readonly amounts: Readonly<Record<string, number>>;
}

export const NO_BILL_ANSWERS: BillAnswers = { asks: {}, multis: {}, amounts: {} };

/** A card in the order the deck deals it. */
export type DeckItem =
  | { readonly type: 'ask'; readonly card: BillCard & { kind: 'ask' }; readonly cardIndex: number }
  | {
      readonly type: 'multi';
      readonly card: BillCard & { kind: 'multi' };
      readonly cardIndex: number;
    }
  | {
      readonly type: 'amount';
      readonly card: BillCard;
      readonly cardIndex: number;
      readonly key: string;
      readonly icon: SymbolName;
      /** The option picked on a multi card; absent for a yes/no bill. */
      readonly option?: BillOption;
    };

export function dealDeck(answers: BillAnswers): DeckItem[] {
  const out: DeckItem[] = [];
  BILL_CARDS.forEach((card, cardIndex) => {
    if (card.kind === 'ask') {
      out.push({ type: 'ask', card, cardIndex });
      if (answers.asks[card.key] === true) {
        out.push({ type: 'amount', card, cardIndex, key: card.key, icon: card.icon });
      }
      return;
    }
    out.push({ type: 'multi', card, cardIndex });
    const answer = answers.multis[card.key];
    if (!answer?.done) return;
    for (const option of card.options) {
      if (!answer.picked.includes(option.id)) continue;
      const key = `${card.key}:${option.id}`;
      out.push({ type: 'amount', card, cardIndex, key, icon: option.icon, option });
    }
  });
  return out;
}

export interface ChosenBill {
  readonly key: string;
  readonly card: BillCard;
  readonly option?: BillOption;
  readonly icon: SymbolName;
  readonly hue: number;
  readonly amount: number;
  /** Where its amount card sits in the deck, to revisit it from the tray. */
  readonly deckIndex: number;
}

/** The bills answered so far: every amount card the user saved or put off. */
export function chosenBills(deck: readonly DeckItem[], answers: BillAnswers): ChosenBill[] {
  const out: ChosenBill[] = [];
  deck.forEach((item, deckIndex) => {
    if (item.type !== 'amount' || !(item.key in answers.amounts)) return;
    out.push({
      key: item.key,
      card: item.card,
      ...(item.option ? { option: item.option } : {}),
      icon: item.icon,
      hue: item.card.hue,
      amount: answers.amounts[item.key] ?? 0,
      deckIndex,
    });
  });
  return out;
}

export function billTotal(bills: readonly ChosenBill[]): number {
  return bills.reduce((sum, b) => sum + b.amount, 0);
}

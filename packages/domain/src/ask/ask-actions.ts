import type { Vnd } from '../money/format';

/** What a how-to question is about: one way of catching spending, or how 6pm itself works. */
export const HOW_TO_TOPICS = [
  'ways',
  'share',
  'email',
  'scan',
  'wallet',
  'widgets',
  'quickAdd',
  'dailyNumber',
  'negative',
  'pot',
  'close',
  'budget',
] as const;
export type HowToTopic = (typeof HOW_TO_TOPICS)[number];

/**
 * Answers that ask before doing anything: a spend or a pot is only saved once the user taps to
 * confirm it on the phone. Nothing here writes; the phone does, after the tap.
 */
export type ActionAnswer =
  /** "vừa ăn phở 50k": the spend to add, in the user's words; the phone picks the category. */
  | {
      readonly kind: 'confirmSpend';
      readonly amount: Vnd;
      readonly name: string;
      /** A category the question named, as written; null leaves the phone's own pick. */
      readonly category: string | null;
    }
  /** "tạo hũ du lịch 10tr": the pot to make. */
  | {
      readonly kind: 'confirmPot';
      readonly name: string;
      readonly goal: Vnd;
      /** 'YYYY-MM' it should be full by, or null. */
      readonly neededBy: string | null;
    }
  /** A pot named without a goal: the answer asks for one, and the next amount is it. */
  | { readonly kind: 'potGoal'; readonly name: string }
  | { readonly kind: 'howTo'; readonly topic: HowToTopic };

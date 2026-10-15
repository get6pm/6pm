import { z } from 'zod';

import type { AskQueryAnswer } from '../ask/answer-query';
import { FACT_KINDS } from '../insights/fact';

/** Where a worded line is shown; each has its own length limit (`LINE_MAX_LENGTH`). */
export const wordSurfaces = ['bubble', 'toast', 'note', 'notification', 'answer'] as const;

/** The companion's voices; `plain` is serious mode's: no jokes, no emoji. */
export const wordPersonas = ['soft', 'cheeky', 'roast', 'plain'] as const;
export type WordPersona = (typeof wordPersonas)[number];

/** How the companion looks while the line shows. */
export const wordMoods = ['calm', 'happy', 'wave', 'nod', 'think', 'sleepy', 'plain'] as const;

/** Every answer Ask can give: worded from its numbers like a fact. */
const ANSWER_KINDS_SET = {
  fitsToday: true,
  notThisMonth: true,
  tight: true,
  fits: true,
  weekend: true,
  saveMore: true,
  potFull: true,
  noPots: true,
  noSuchPot: true,
  today: true,
  help: true,
  spent: true,
  breakdown: true,
  compared: true,
  listed: true,
  bills: true,
  howAmIDoing: true,
  noSuchCategory: true,
  noRange: true,
  chat: true,
  goalPace: true,
  goalNoPace: true,
  goalAmount: true,
} as const satisfies Record<AskQueryAnswer['kind'], true>;
export const ANSWER_KINDS = Object.keys(ANSWER_KINDS_SET) as AskQueryAnswer['kind'][];

/** What a line may be about: a fact about the user's days, or an Ask answer. */
export const WORD_KINDS = [...new Set<string>([...FACT_KINDS, ...ANSWER_KINDS])] as [
  string,
  ...string[],
];

/**
 * One value a line may show, already formatted on the phone ("1,2tr", "Highlands", "much more").
 * Its name is the placeholder the line writes; the phone fills it back in.
 */
export const wordSlotSchema = z.object({
  name: z.string().regex(/^[A-Za-z]{1,24}$/),
  value: z.string().trim().min(1).max(40),
});

export const wordFactSchema = z.object({
  kind: z.enum(WORD_KINDS),
  slots: z.array(wordSlotSchema).max(8),
});
export type WordFact = z.infer<typeof wordFactSchema>;

/**
 * `POST /v1/word`: one to three facts the phone computed, to be worded in the companion's voice.
 * Values are the phone's own; the line comes back with placeholders, never a number.
 */
export const wordRequestSchema = z
  .object({
    surface: z.enum(wordSurfaces),
    language: z.enum(['en', 'vi']),
    persona: z.enum(wordPersonas),
    companion: z
      .object({
        name: z.string().trim().min(1).max(30),
        personality: z.string().trim().min(1).max(160),
      })
      .optional(),
    facts: z.array(wordFactSchema).min(1).max(3),
    /** For an Ask answer: the question it answers. */
    question: z.string().trim().min(1).max(300).optional(),
  })
  .refine(
    (r) => {
      const names = r.facts.flatMap((f) => f.slots.map((s) => s.name));
      return new Set(names).size === names.length;
    },
    { message: 'slot names must be unique across facts' },
  );
export type WordRequest = z.infer<typeof wordRequestSchema>;

export const wordResponseSchema = z.object({
  /** The line, with `{name}` placeholders for the slot values. */
  text: z.string().trim().min(1).max(400),
  mood: z.enum(wordMoods),
});
export type WordResponse = z.infer<typeof wordResponseSchema>;

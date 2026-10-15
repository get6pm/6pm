import { z } from 'zod';

import { remember, type Fact, type LocalDate, type Moment, type SaidFact } from '@6pm/domain';

import type { ModelLine } from './word-chain';

/**
 * What the companion remembers between launches, in one settings row: the facts it has said (so
 * it does not repeat itself), the fact each moment is on today (so a line does not change under
 * the user), and lines a model already worded (so a screen shows them at once).
 */
export interface CompanionVoice {
  readonly memory: readonly SaidFact[];
  readonly picks: Readonly<
    Partial<Record<Moment, { readonly on: LocalDate; readonly key: string }>>
  >;
  readonly lines: Readonly<Record<string, ModelLine & { readonly on: LocalDate }>>;
}

export const EMPTY_VOICE: CompanionVoice = { memory: [], picks: {}, lines: {} };

/** Worded lines kept, newest first; older ones are worded again when needed. */
const LINE_LIMIT = 60;

const voiceSchema = z.object({
  memory: z.array(
    z.object({
      key: z.string(),
      tone: z.enum(['good', 'neutral', 'watch']),
      on: z.string(),
      until: z.string(),
    }),
  ),
  picks: z.record(z.string(), z.object({ on: z.string(), key: z.string() })),
  lines: z.record(z.string(), z.object({ text: z.string(), mood: z.string(), on: z.string() })),
});

/** The voice as stored, or empty when there is none or it does not read. */
export function parseVoice(json: string | null | undefined): CompanionVoice {
  if (json === null || json === undefined) return EMPTY_VOICE;
  try {
    const parsed = voiceSchema.safeParse(JSON.parse(json));
    return parsed.success ? (parsed.data as CompanionVoice) : EMPTY_VOICE;
  } catch {
    return EMPTY_VOICE;
  }
}

/** Where a worded line is kept: the fact, the voice, the language and where it shows. */
export function lineKey(fact: Fact, voice: string, language: string, surface: string): string {
  return `${fact.key}|${voice}|${language}|${surface}`;
}

/** The voice after a moment settled on a fact today: remembered, and pinned for the day. */
export function withPick(
  voice: CompanionVoice,
  moment: Moment,
  fact: Fact,
  today: LocalDate,
): CompanionVoice {
  const pinned = voice.picks[moment];
  if (pinned?.on === today && pinned.key === fact.key) return voice;
  return {
    ...voice,
    memory: remember(voice.memory, fact, today),
    picks: { ...voice.picks, [moment]: { on: today, key: fact.key } },
  };
}

/** The voice with a model's line kept for next time. */
export function withLine(
  voice: CompanionVoice,
  key: string,
  line: ModelLine,
  today: LocalDate,
): CompanionVoice {
  const entries = Object.entries({ ...voice.lines, [key]: { ...line, on: today } })
    .sort(([, a], [, b]) => b.on.localeCompare(a.on))
    .slice(0, LINE_LIMIT);
  return { ...voice, lines: Object.fromEntries(entries) };
}

/** Today's fact for a moment: the one pinned earlier today if it is still true, else a new pick. */
export function factFor(
  voice: CompanionVoice,
  moment: Moment,
  today: LocalDate,
  facts: readonly Fact[],
  pick: () => Fact | null,
): Fact | null {
  const pinned = voice.picks[moment];
  if (pinned?.on === today) {
    const still = facts.find((f) => f.key === pinned.key);
    if (still !== undefined) return still;
  }
  return pick();
}

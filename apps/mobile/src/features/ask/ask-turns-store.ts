import { askQuerySchema, type AskQuery } from '@6pm/domain';
import { z } from 'zod';

import type { SqlDatabase } from '../../data/table';
import type { AskCard } from './ask-words';

/** How many turns are kept, and how many are shown again when Ask opens. */
const KEEP = 100;
const SHOWN = 40;

/** A turn as it was: a question, or an answer card and the reading behind it. */
export type SavedTurn =
  | { readonly key: string; readonly kind: 'me'; readonly text: string }
  | {
      readonly key: string;
      readonly kind: 'answer';
      readonly card: AskCard;
      readonly query: AskQuery | null;
    };

const cardSchema = z.object({
  text: z.string(),
  mood: z.string(),
  bars: z
    .object({ nowValue: z.string(), afterValue: z.string(), afterPercent: z.number() })
    .nullable(),
  rows: z.array(z.object({ key: z.string(), value: z.string() })),
  note: z.string().nullable(),
});

const bodySchema = z.union([
  z.object({ text: z.string() }),
  z.object({ card: cardSchema, query: askQuerySchema.nullable() }),
]);

let counter = 0;

/** A key that sorts after every earlier one on this phone. */
export function turnKey(now: Date = new Date()): string {
  counter = (counter + 1) % 1000;
  return `${now.getTime().toString().padStart(14, '0')}-${counter.toString().padStart(3, '0')}`;
}

/** The latest turns, oldest first. A card's buttons are not kept: its moment has passed. */
export async function readTurns(db: SqlDatabase): Promise<SavedTurn[]> {
  const rows = await db.getAllAsync<{ id: string; kind: string; body: string }>(
    'SELECT id, kind, body FROM ask_turns ORDER BY id DESC LIMIT ?',
    [SHOWN],
  );
  const turns: SavedTurn[] = [];
  for (const row of rows.reverse()) {
    const parsed = bodySchema.safeParse(JSON.parse(row.body));
    if (!parsed.success) continue;
    const body = parsed.data;
    if (row.kind === 'me' && 'text' in body)
      turns.push({ key: row.id, kind: 'me', text: body.text });
    if (row.kind === 'answer' && 'card' in body) {
      turns.push({
        key: row.id,
        kind: 'answer',
        card: { ...body.card, mood: body.card.mood as AskCard['mood'], actions: [] },
        query: body.query,
      });
    }
  }
  return turns;
}

/** Saves a turn, or a turn's new card once its buttons are answered, and drops the oldest. */
export async function writeTurn(db: SqlDatabase, turn: SavedTurn, at: Date = new Date()) {
  const body =
    turn.kind === 'me'
      ? { text: turn.text }
      : {
          card: { ...turn.card, actions: undefined },
          query: turn.query,
        };
  await db.runAsync('INSERT OR REPLACE INTO ask_turns (id, at, kind, body) VALUES (?, ?, ?, ?)', [
    turn.key,
    at.toISOString(),
    turn.kind,
    JSON.stringify(body),
  ]);
  await db.runAsync(
    'DELETE FROM ask_turns WHERE id NOT IN (SELECT id FROM ask_turns ORDER BY id DESC LIMIT ?)',
    [KEEP],
  );
}

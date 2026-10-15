import { describe, expect, it } from '@jest/globals';

import type { SqlDatabase } from '../../data/table';
import { sql as createAskTurns } from '../../db/migrations/0005-create-ask-turns';
import { readTurns, turnKey, writeTurn } from './ask-turns-store';

// A real SQLite database in memory, from Node's own module (see migrate.test.ts).
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

function openDb(): SqlDatabase {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(createAskTurns);
  return {
    getAllAsync: <T>(source: string, params: unknown[]) =>
      Promise.resolve(sqlite.prepare(source).all(...(params as never[])) as T[]),
    runAsync: (source, params) =>
      Promise.resolve(sqlite.prepare(source).run(...(params as never[]))),
    withTransactionAsync: (task) => task(),
  };
}

const card = {
  text: 'Add Phở, 50.000đ, to Ăn uống?',
  mood: 'think' as const,
  bars: null,
  rows: [],
  note: null,
};

describe('the saved conversation', () => {
  it('comes back in order, with each answer’s reading and without its buttons', async () => {
    const db = openDb();
    await writeTurn(db, { key: turnKey(), kind: 'me', text: 'vừa ăn phở 50k' });
    await writeTurn(db, {
      key: turnKey(),
      kind: 'answer',
      card: { ...card, actions: [{ id: 'go', label: 'Add', primary: true }] },
      query: { kind: 'logSpend', amount: 50_000, name: 'Phở' },
    });
    const turns = await readTurns(db);
    expect(turns.map((t) => t.kind)).toEqual(['me', 'answer']);
    const answer = turns[1];
    expect(answer?.kind === 'answer' && answer.card.actions).toEqual([]);
    expect(answer?.kind === 'answer' && answer.query).toEqual({
      kind: 'logSpend',
      amount: 50_000,
      name: 'Phở',
    });
  });

  it('replaces a card once its buttons are answered, and keeps only the latest hundred', async () => {
    const db = openDb();
    const key = turnKey();
    await writeTurn(db, { key, kind: 'answer', card, query: null });
    await writeTurn(db, { key, kind: 'answer', card: { ...card, text: 'Added.' }, query: null });
    expect((await readTurns(db)).map((t) => (t.kind === 'answer' ? t.card.text : ''))).toEqual([
      'Added.',
    ]);
    for (let i = 0; i < 120; i += 1)
      await writeTurn(db, { key: turnKey(), kind: 'me', text: `q${String(i)}` });
    const rows = await db.getAllAsync<{ n: number }>('SELECT COUNT(*) AS n FROM ask_turns', []);
    expect(rows[0]?.n).toBe(100);
  });
});

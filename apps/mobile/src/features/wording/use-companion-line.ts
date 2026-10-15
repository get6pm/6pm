import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  collectFacts,
  fillLine,
  lineVoice,
  pickFact,
  type Fact,
  type LineSurface,
  type Moment,
  type SpendRow,
  type WordRequest,
} from '@6pm/domain';

import { useDay, useMoney } from '../../data/money-provider';
import { useI18n } from '../../i18n/i18n';
import { useMoneyFormat } from '../../money/use-money-format';
import { useCompanionForm } from '../../ui/companion/companion-form';
import type { CompanionMood } from '../../ui/companion/companion-mood';
import { useTheme } from '../../ui/theme/theme';
import { useApi } from '../api/native-api';
import { factFor, lineKey, withLine, withPick } from './companion-voice';
import { catalogueLine, slotValues, type SlotWords, type Voice } from './fact-words';
import { insightInputOf, previousCycleStartOf, readEarlierSpends } from './insight-input';
import { readModelChoice } from './model-choice';
import { readVoice, writeVoice } from './voice-store';
import { wordWithModel } from './word-chain';

export interface CompanionLine {
  readonly text: string;
  /** The mood a model chose for the line; null for a catalogue line. */
  readonly mood: CompanionMood | null;
}

/** A stable small number from a string, so a day's catalogue variant does not flicker. */
function variantOf(text: string): number {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) | 0;
  return Math.abs(hash);
}

/**
 * The companion's line about the user's own day at a moment: a fact chosen for it (see
 * `pickFact`), worded by a model when one answers within `waitMs`, else from the catalogue.
 * `undefined` while the words are on their way (the caller holds the bubble back, so it never
 * changes once shown); `null` when there is nothing worth saying, so the caller keeps its line.
 * A line a model words too late is kept and shown the next time the same fact comes up.
 */
export function useCompanionLine(
  moment: Moment,
  surface: LineSurface,
  options: {
    readonly waitMs?: number;
    readonly focusMerchant?: string;
    /** False keeps the hook quiet (serious mode, or a moment with its own line): null. */
    readonly enabled?: boolean;
  } = {},
): CompanionLine | null | undefined {
  const { waitMs = 1_500, focusMerchant, enabled = true } = options;
  const db = useSQLiteContext();
  const api = useApi();
  const snap = useMoney();
  const day = useDay();
  const { language, t, dayMonth } = useI18n();
  const money = useMoneyFormat();
  const { serious } = useTheme();
  const form = useCompanionForm();
  const chosenVoice: Voice = serious ? 'plain' : (snap.plan?.persona ?? 'cheeky');

  // The previous cycle's spends, which patterns compare against; read once per cycle.
  const historyStart = previousCycleStartOf(snap);
  const [earlier, setEarlier] = useState<{ key: string; rows: SpendRow[] } | null>(null);
  const earlierKey = `${historyStart ?? ''}|${snap.cycle.start}`;
  useEffect(() => {
    if (historyStart === null) {
      setEarlier({ key: earlierKey, rows: [] });
      return;
    }
    let live = true;
    readEarlierSpends(db, historyStart, snap.cycle.start)
      .then((rows) => live && setEarlier({ key: earlierKey, rows }))
      .catch(() => live && setEarlier({ key: earlierKey, rows: [] }));
    return () => {
      live = false;
    };
  }, [db, earlierKey, historyStart, snap.cycle.start]);

  const ready = earlier?.key === earlierKey && day !== null;
  const picked = useMemo(() => {
    if (!enabled || !ready || day === null) return null;
    const input = insightInputOf(snap, day, earlier.rows);
    const facts = collectFacts(input);
    const voice = readVoice(db);
    const fact = factFor(voice, moment, snap.today, facts, () =>
      pickFact({
        moment,
        facts,
        memory: voice.memory,
        today: snap.today,
        underToday: day.safe >= 0,
        ...(focusMerchant === undefined ? {} : { focusMerchant }),
      }),
    );
    // A roast or a tease turns soft on a hard day, and about what is never teased.
    return fact === null ? null : { fact, voice: lineVoice(chosenVoice, fact, day, input.spends) };
  }, [enabled, ready, day, snap, earlier, db, moment, focusMerchant, chosenVoice]);
  const fact: Fact | null = picked?.fact ?? null;
  const voiceName: Voice = picked?.voice ?? chosenVoice;

  const say = t as SlotWords['say'];
  const words: SlotWords = useMemo(
    () => ({
      language,
      money,
      say,
      dayMonth,
      categoryName: (id) => snap.categories.find((c) => c.id === id)?.name ?? '',
    }),
    [language, money, say, dayMonth, snap.categories],
  );
  const values = useMemo(() => (fact === null ? {} : slotValues(fact, words)), [fact, words]);
  const key = fact === null ? null : lineKey(fact, voiceName, language, surface);

  // Everything the effect below reads, current at each render; it re-runs only per fact.
  const latest = useRef({ fact, values, voiceName, language, surface, form, say, waitMs, moment });
  latest.current = { fact, values, voiceName, language, surface, form, say, waitMs, moment };

  // A model's line for this fact: kept already, arriving, or given up on after `waitMs`.
  const [arrived, setArrived] = useState<{ key: string; line: CompanionLine | null } | null>(null);
  // The line first shown for a fact stays: a late model line is kept for next time instead.
  const shown = useRef<{ key: string; line: CompanionLine } | null>(null);
  const today = snap.today;
  useEffect(() => {
    const now = latest.current;
    if (now.fact === null || key === null) return;
    const voice = readVoice(db);
    writeVoice(db, withPick(voice, now.moment, now.fact, today));
    if (voice.lines[key] !== undefined) return;
    let live = true;
    const request: WordRequest = {
      surface: now.surface,
      language: now.language,
      persona: now.voiceName,
      companion: {
        name: now.say(`companions.name.${now.form}`),
        personality: now.say(`companions.line.${now.form}`),
      },
      facts: [
        {
          kind: now.fact.kind,
          slots: Object.entries(now.values).map(([name, value]) => ({
            name,
            value: value.slice(0, 40),
          })),
        },
      ],
    };
    const giveUp = setTimeout(() => {
      if (live) setArrived({ key, line: null });
    }, now.waitMs);
    wordWithModel(request, { request: (r) => api.request(r), choice: readModelChoice(db) })
      .then((line) => {
        if (line === null) return;
        writeVoice(db, withLine(readVoice(db), key, line, today));
        if (live) {
          setArrived({
            key,
            line: { text: fillLine(line.text, now.values), mood: line.mood },
          });
        }
      })
      .catch(() => undefined)
      .finally(() => clearTimeout(giveUp));
    return () => {
      live = false;
      clearTimeout(giveUp);
    };
  }, [key, db, api, today]);

  if (!enabled) return null;
  if (!ready) return undefined;
  if (fact === null || key === null) return null;
  if (shown.current?.key === key) return shown.current.line;
  const kept = readVoice(db).lines[key];
  let line: CompanionLine | undefined;
  if (kept !== undefined) {
    line = { text: fillLine(kept.text, values), mood: kept.mood };
  } else if (arrived?.key === key) {
    line = arrived.line ?? {
      text: catalogueLine(fact, voiceName, variantOf(fact.key + snap.today), words, values),
      mood: null,
    };
  }
  if (line !== undefined) shown.current = { key, line };
  return line;
}

import {
  EXPLAIN_SYSTEM,
  LINE_MAX_LENGTH,
  LOCAL_READ_TAIL,
  LOCAL_WORD_TAIL,
  explanationFits,
  localLine,
  readQuestionPrompt,
  readQuestionSystemFor,
  safeLocalQuery,
  wordPrompt,
  wordSystem,
  type AskQuery,
  type AskRequest,
  type Currency,
  type WordRequest,
} from '@6pm/domain';

import { readLocalModel, type AiModeSettings, type LocalModelId } from '../privacy/ai-mode';
import type { LineTier } from '../wording/word-chain';
import { localGenerate } from './local-generate';
import { modelReady } from './model-store';

/** A line or a reading waits this long; a first load counts against it too. */
const LOCAL_TIMEOUT_MS = 12_000;

/** The model chosen for on-device mode, once its file is on the phone; null otherwise. */
export async function readyLocalModel(settings: AiModeSettings): Promise<LocalModelId | null> {
  const id = readLocalModel(settings);
  if (id === null) return null;
  return (await modelReady(id).catch(() => false)) ? id : null;
}

/**
 * Lines worded by the downloaded model, in the server's shape: values it wrote out go back to
 * their placeholders, and the wording chain checks the line like any other.
 */
export function localLineTier(settings: AiModeSettings): LineTier {
  return async (request: WordRequest) => {
    const id = await readyLocalModel(settings);
    if (id === null) throw new Error('No local model is ready');
    const reply = await localGenerate(id, {
      system: wordSystem + LOCAL_WORD_TAIL,
      prompt: wordPrompt(request, LINE_MAX_LENGTH[request.surface]),
      maxTokens: 120,
      timeoutMs: LOCAL_TIMEOUT_MS,
    });
    const values = Object.fromEntries(
      request.facts.flatMap((fact) => fact.slots.map((slot) => [slot.name, slot.value] as const)),
    );
    const line = localLine(reply, values);
    if (line === null) throw new Error('The local model gave no line');
    return line;
  };
}

/**
 * A question the rules could not read, read by the downloaded model and made safe: amounts from
 * the phone, never distress or venting. Unknown when no model is ready or it cannot say.
 */
export async function localReading(
  settings: AiModeSettings,
  request: AskRequest,
  currency: Currency,
): Promise<AskQuery> {
  const id = await readyLocalModel(settings);
  if (id === null) return { kind: 'unknown' };
  try {
    const reply = await localGenerate(id, {
      system: readQuestionSystemFor(currency) + LOCAL_READ_TAIL,
      prompt: readQuestionPrompt(request),
      maxTokens: 160,
      timeoutMs: LOCAL_TIMEOUT_MS,
    });
    return safeLocalQuery(request.question, reply, currency);
  } catch {
    return { kind: 'unknown' };
  }
}

/**
 * A money question nothing on the phone can look up ("lãi kép là gì"), answered by the downloaded
 * model in a few sentences. Null when no model is ready or its answer is not in the language asked.
 */
export async function localExplanation(
  settings: AiModeSettings,
  question: string,
  language: 'en' | 'vi',
): Promise<string | null> {
  const id = await readyLocalModel(settings);
  if (id === null) return null;
  try {
    const reply = await localGenerate(id, {
      system: EXPLAIN_SYSTEM,
      prompt: question,
      maxTokens: 220,
      timeoutMs: 20_000,
    });
    return explanationFits(reply, language) ? reply.trim() : null;
  } catch {
    return null;
  }
}

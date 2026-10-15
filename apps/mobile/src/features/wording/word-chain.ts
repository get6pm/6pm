import {
  fillLine,
  LINE_MAX_LENGTH,
  validateLine,
  wordPrompt,
  wordResponseSchema,
  wordSystem,
  type WordRequest,
  type WordResponse,
} from '@6pm/domain';

import { companionModel } from '../../../modules/companion-model';
import type { ApiClient } from '../api/api-client';
import { localLineTier } from '../local-model/local-tiers';
import { readAiMode, requireServerAi, type AiModeSettings } from '../privacy/ai-mode';
import type { ModelChoice } from './model-choice';

/** Lines are worded ahead or while bars already show; past this the catalogue answers. */
export const WORD_TIMEOUT_MS = 7_000;

/** A line a model wrote, still with its placeholders, as checked. */
export type ModelLine = WordResponse;

/** A tier that words a line on this iPhone, in the shape the server answers in. */
export type LineTier = (request: WordRequest) => Promise<ModelLine>;

export interface WordChainDeps {
  readonly request: ApiClient['request'];
  /** In server mode, which model words first (the dev Tools switch). */
  readonly choice: ModelChoice;
  /** Where 6pm's AI runs: in on-device mode the server is never asked. */
  readonly settings: AiModeSettings;
  /**
   * The local model the person downloaded for on-device mode; the chosen one by default. Without
   * one ready, on-device mode says the catalogue's line.
   */
  readonly local?: LineTier;
}

function deadline<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('The model was too slow')), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error('The model failed'));
      },
    );
  });
}

function fromServer(deps: WordChainDeps, request: WordRequest): Promise<ModelLine> {
  requireServerAi(deps.settings, 'word');
  return deps.request({
    method: 'POST',
    path: '/v1/word',
    body: request,
    schema: wordResponseSchema,
    timeoutMs: WORD_TIMEOUT_MS,
  });
}

async function fromDevice(request: WordRequest): Promise<ModelLine> {
  if (companionModel === null || companionModel.availability(request.language) !== 'available') {
    throw new Error('The on-device model is not available');
  }
  const json = await deadline(
    companionModel.word(wordSystem, wordPrompt(request, LINE_MAX_LENGTH[request.surface])),
    WORD_TIMEOUT_MS,
  );
  return wordResponseSchema.parse(JSON.parse(json));
}

/**
 * The tiers asked in turn. In on-device mode only the local model, when one is loaded: nothing
 * leaves the phone. In server mode Apple's model words a line only when it is chosen, and the
 * server answers after it. Apple's model never stands in for the server: its lines are too often
 * fragments or untrue ("already overdue" for a bill due tomorrow), so offline the catalogue
 * answers.
 */
function tiersOf(request: WordRequest, deps: WordChainDeps): readonly (() => Promise<ModelLine>)[] {
  if (readAiMode(deps.settings) === 'device') {
    const local = deps.local ?? localLineTier(deps.settings);
    return [() => local(request)];
  }
  return deps.choice === 'device'
    ? [() => fromDevice(request), () => fromServer(deps, request)]
    : [() => fromServer(deps, request)];
}

/**
 * A model's line for the facts in `request`, checked like the server checks it (no digit, only
 * its placeholders, every fact, a whole sentence, the right language, no put-downs). Null when no
 * model gives a line that passes: the caller says the catalogue line.
 */
export async function wordWithModel(
  request: WordRequest,
  deps: WordChainDeps,
): Promise<ModelLine | null> {
  const facts = request.facts.map((f) => f.slots.map((s) => s.name));
  for (const tier of tiersOf(request, deps)) {
    try {
      const line = await tier();
      const check = validateLine(line.text, {
        facts,
        language: request.language,
        surface: request.surface,
      });
      if (check.ok) return line;
    } catch {
      // The next tier answers; a line that never comes leaves the catalogue's.
    }
  }
  return null;
}

/** A model's line with its placeholders filled. */
export function filledLine(line: ModelLine, values: Readonly<Record<string, string>>): string {
  return fillLine(line.text, values);
}

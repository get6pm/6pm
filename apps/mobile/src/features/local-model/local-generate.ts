import { localModelNative, type LocalModelNative } from '../../../modules/local-model';
import type { LocalModelId } from '../privacy/ai-mode';
import { backendFor, MODEL_FILES } from './model-files';
import { nativeSpec } from './model-store';

/** Why the local model gave no answer; the caller answers from the rules or the catalogue. */
export type LocalModelFailure = 'unavailable' | 'notDownloaded' | 'load' | 'timeout' | 'generate';

export class LocalModelError extends Error {
  constructor(readonly reason: LocalModelFailure) {
    super(`The local model gave no answer: ${reason}`);
    this.name = 'LocalModelError';
  }
}

export interface LocalGenerateOptions {
  readonly system: string;
  readonly prompt: string;
  /** Default 256. */
  readonly maxTokens?: number;
  /** Default 0: greedy, the same question always reads the same way. */
  readonly temperature?: number;
  /** The whole wait, a first load included. Default 20 s. */
  readonly timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_TOKENS = 256;

const CODES: Readonly<Record<string, LocalModelFailure>> = {
  ERR_LOCAL_MODEL_UNAVAILABLE: 'unavailable',
  ERR_LOCAL_MODEL_NOT_DOWNLOADED: 'notDownloaded',
  ERR_LOCAL_MODEL_LOAD: 'load',
  ERR_LOCAL_MODEL_TIMEOUT: 'timeout',
};

function asFailure(error: unknown): LocalModelError {
  if (error instanceof LocalModelError) return error;
  const code = (error as { code?: unknown } | null)?.code;
  return new LocalModelError((typeof code === 'string' && CODES[code]) || 'generate');
}

/** Writing with the downloaded model, over the native module or a fake. */
export function createLocalModel(native: LocalModelNative | null) {
  /** The load in flight, so two questions at once load the model once. */
  let loading: { id: LocalModelId; done: Promise<void> } | null = null;

  /** Loads the model if it is not already; a first load compiles GPU programs and takes a while. */
  function prewarm(id: LocalModelId): Promise<void> {
    if (native === null) return Promise.reject(new LocalModelError('unavailable'));
    if (native.isLoaded(id)) return Promise.resolve();
    if (loading?.id === id) return loading.done;
    const file = MODEL_FILES[id];
    const done = native
      .load({
        file: nativeSpec(id),
        backend: backendFor(id, native.memoryGb()),
        contextTokens: file.contextTokens,
        freshPerAnswer: file.freshPerAnswer,
      })
      .catch((error: unknown) => {
        throw asFailure(error);
      })
      .finally(() => {
        if (loading?.done === done) loading = null;
      });
    loading = { id, done };
    return done;
  }

  /**
   * The model's answer, or a `LocalModelError`. The time limit covers the whole wait: a load
   * that runs past it keeps going, so the next question finds the model ready.
   */
  async function localGenerate(id: LocalModelId, options: LocalGenerateOptions): Promise<string> {
    if (native === null) throw new LocalModelError('unavailable');
    const model = native;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const deadline = Date.now() + timeoutMs;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new LocalModelError('timeout')), timeoutMs);
    });
    const answer = (async () => {
      await prewarm(id);
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new LocalModelError('timeout');
      return model.generate({
        system: options.system,
        prompt: options.prompt,
        maxTokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: options.temperature ?? 0,
        // The native side cancels the answer itself; this side's timer is the backstop.
        timeoutMs: remaining,
      });
    })();
    try {
      return await Promise.race([answer, late]);
    } catch (error) {
      throw asFailure(error);
    } finally {
      clearTimeout(timer);
      answer.catch(() => undefined);
    }
  }

  async function unload(): Promise<void> {
    await native?.unload();
  }

  /** Called when iOS took the model back under memory pressure; the next answer reloads it. */
  function onUnloaded(listener: (id: LocalModelId) => void): () => void {
    const subscription = native?.addListener('onUnloaded', ({ id }) => {
      if (id in MODEL_FILES) listener(id as LocalModelId);
    });
    return () => subscription?.remove();
  }

  return { prewarm, localGenerate, unload, onUnloaded };
}

export const { prewarm, localGenerate, unload, onUnloaded } = createLocalModel(localModelNative);

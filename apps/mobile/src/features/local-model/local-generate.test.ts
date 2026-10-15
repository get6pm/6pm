import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type {
  LocalModelNative,
  NativeGenerateOptions,
  NativeLoadOptions,
} from '../../../modules/local-model';
import { createLocalModel, LocalModelError } from './local-generate';
import { MODEL_FILES } from './model-files';
import { createModelStore } from './model-store';

interface Fake {
  native: LocalModelNative;
  loads: NativeLoadOptions[];
  asks: NativeGenerateOptions[];
  startDownload: jest.Mock;
  finishLoad: () => void;
  failLoad: (code: string) => void;
}

/** A native module that loads when told to and answers with the prompt turned upper case. */
function fakeNative(memoryGb = 8, freeBytes = 10e9): Fake {
  const loads: NativeLoadOptions[] = [];
  const asks: NativeGenerateOptions[] = [];
  let loaded: string | null = null;
  let settle: { resolve: () => void; reject: (e: unknown) => void } | null = null;
  const startDownload = jest.fn(() => Promise.resolve());
  const native = {
    memoryGb: () => memoryGb,
    availability: () => 'available',
    freeBytes: () => freeBytes,
    isLoaded: (id: string) => loaded === id,
    load: (options: NativeLoadOptions) => {
      loads.push(options);
      return new Promise<void>((resolve, reject) => {
        settle = {
          resolve: () => {
            loaded = options.file.id;
            resolve();
          },
          reject,
        };
      });
    },
    generate: (options: NativeGenerateOptions) => {
      asks.push(options);
      return Promise.resolve(options.prompt.toUpperCase());
    },
    unload: () => Promise.resolve(),
    downloadState: () => Promise.resolve({ id: 'x', state: 'ready' }),
    startDownload,
    cancelDownload: () => Promise.resolve(),
    deleteModel: () => Promise.resolve(),
    addListener: () => ({ remove: () => undefined }),
  } as unknown as LocalModelNative;
  return {
    native,
    loads,
    asks,
    startDownload,
    finishLoad: () => settle?.resolve(),
    failLoad: (code) => settle?.reject(Object.assign(new Error(code), { code })),
  };
}

const ask = { system: 'Be brief.', prompt: 'hi' };

describe('writing with the local model', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: 0 });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads the model on first use, once, then answers greedily', async () => {
    const fake = fakeNative(8);
    const model = createLocalModel(fake.native);
    const first = model.localGenerate('qwen-3.5-4b', ask);
    const second = model.localGenerate('qwen-3.5-4b', ask);
    fake.finishLoad();
    await expect(first).resolves.toBe('HI');
    await expect(second).resolves.toBe('HI');
    expect(fake.loads).toHaveLength(1);
    expect(fake.loads[0]).toMatchObject({
      backend: 'cpu',
      freshPerAnswer: true,
      file: { id: 'qwen-3.5-4b', sha256: MODEL_FILES['qwen-3.5-4b'].sha256 },
    });
    expect(fake.asks[0]).toMatchObject({ temperature: 0, maxTokens: 256 });
  });

  it('gives the native side what is left of the time limit', async () => {
    const fake = fakeNative();
    const model = createLocalModel(fake.native);
    const answer = model.localGenerate('gemma-4-e2b', { ...ask, timeoutMs: 10_000 });
    jest.setSystemTime(4_000);
    fake.finishLoad();
    await expect(answer).resolves.toBe('HI');
    expect(fake.asks[0]?.timeoutMs).toBe(6_000);
  });

  it('times out when the load outlasts the limit, and keeps loading for next time', async () => {
    const fake = fakeNative();
    const model = createLocalModel(fake.native);
    const answer = model.localGenerate('gemma-4-e2b', { ...ask, timeoutMs: 1_000 });
    jest.advanceTimersByTime(1_000);
    await expect(answer).rejects.toEqual(new LocalModelError('timeout'));
    fake.finishLoad();
    await expect(model.localGenerate('gemma-4-e2b', ask)).resolves.toBe('HI');
    expect(fake.loads).toHaveLength(1);
  });

  it('names a model that is not on the phone', async () => {
    const fake = fakeNative();
    const model = createLocalModel(fake.native);
    const answer = model.localGenerate('gemma-4-e4b', ask);
    fake.failLoad('ERR_LOCAL_MODEL_NOT_DOWNLOADED');
    await expect(answer).rejects.toMatchObject({ reason: 'notDownloaded' });
  });

  it('says unavailable where the runtime is not built in', async () => {
    await expect(createLocalModel(null).localGenerate('gemma-4-e2b', ask)).rejects.toMatchObject({
      reason: 'unavailable',
    });
  });
});

describe('the model store', () => {
  it('will not start a download without room for it', async () => {
    const fake = fakeNative(8, 1e9);
    const store = createModelStore(fake.native);
    await expect(store.startDownload('gemma-4-e2b')).resolves.toBe('space');
    expect(fake.startDownload).not.toHaveBeenCalled();
  });

  it('starts on Wi-Fi only unless told otherwise, with the pinned file', async () => {
    const fake = fakeNative();
    const store = createModelStore(fake.native);
    await expect(store.startDownload('gemma-4-e2b')).resolves.toBeNull();
    const file = MODEL_FILES['gemma-4-e2b'];
    expect(fake.startDownload).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: file.fileName, bytes: file.bytes, sha256: file.sha256 }),
      false,
      expect.any(Number),
    );
    await expect(store.modelReady('gemma-4-e2b')).resolves.toBe(true);
  });

  it('reports unavailable without the native module', async () => {
    const store = createModelStore(null);
    await expect(store.startDownload('gemma-4-e2b')).resolves.toBe('unavailable');
    await expect(store.modelReady('gemma-4-e2b')).resolves.toBe(false);
  });
});

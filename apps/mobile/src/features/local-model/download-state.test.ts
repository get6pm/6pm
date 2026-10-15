import { describe, expect, it } from '@jest/globals';

import { LOCAL_MODELS } from '../privacy/ai-mode';
import {
  checkStart,
  failureFromError,
  IDLE,
  nextDownloadState,
  type DownloadState,
} from './download-state';
import { backendFor, MODEL_FILES, modelUrl, spaceNeeded } from './model-files';

const GB = 1_000_000_000;

describe('a model download', () => {
  it('moves from idle through progress and the check to ready', () => {
    let state: DownloadState = IDLE;
    state = nextDownloadState(state, { id: 'm', state: 'downloading', received: 0, total: 4 }, 4);
    expect(state).toEqual({ kind: 'downloading', progress: 0, received: 0 });
    state = nextDownloadState(state, { id: 'm', state: 'downloading', received: 1, total: 4 }, 4);
    expect(state).toEqual({ kind: 'downloading', progress: 0.25, received: 1 });
    state = nextDownloadState(state, { id: 'm', state: 'verifying' }, 4);
    expect(state).toEqual({ kind: 'verifying' });
    state = nextDownloadState(state, { id: 'm', state: 'ready' }, 4);
    expect(state).toEqual({ kind: 'ready' });
  });

  it('reads progress against the pinned size when the server gives none', () => {
    const state = nextDownloadState(
      IDLE,
      { id: 'm', state: 'downloading', received: 50, total: null },
      200,
    );
    expect(state).toEqual({ kind: 'downloading', progress: 0.25, received: 50 });
  });

  it('never runs progress backwards, and never past the end', () => {
    const half: DownloadState = { kind: 'downloading', progress: 0.5, received: 2 };
    expect(
      nextDownloadState(half, { id: 'm', state: 'downloading', received: 1, total: 4 }, 4),
    ).toBe(half);
    expect(
      nextDownloadState(half, { id: 'm', state: 'downloading', received: 9, total: 4 }, 4),
    ).toEqual({ kind: 'downloading', progress: 1, received: 9 });
  });

  it('starts again from nothing when a download restarts at zero', () => {
    const half: DownloadState = { kind: 'downloading', progress: 0.5, received: 2 };
    expect(
      nextDownloadState(half, { id: 'm', state: 'downloading', received: 0, total: 4 }, 4),
    ).toEqual({ kind: 'downloading', progress: 0, received: 0 });
  });

  it('ignores a late progress event once the check has started or finished', () => {
    const late = { id: 'm', state: 'downloading', received: 3, total: 4 } as const;
    expect(nextDownloadState({ kind: 'verifying' }, late, 4)).toEqual({ kind: 'verifying' });
    expect(nextDownloadState({ kind: 'ready' }, late, 4)).toEqual({ kind: 'ready' });
  });

  it('names why it failed, and calls an unknown reason the network', () => {
    const checksum = nextDownloadState(IDLE, { id: 'm', state: 'failed', reason: 'checksum' }, 4);
    expect(checksum).toEqual({ kind: 'failed', reason: 'checksum' });
    const odd = nextDownloadState(IDLE, { id: 'm', state: 'failed', reason: 'gremlins' }, 4);
    expect(odd).toEqual({ kind: 'failed', reason: 'network' });
  });

  it('goes back to idle when the file is deleted', () => {
    expect(nextDownloadState({ kind: 'ready' }, { id: 'm', state: 'idle' }, 4)).toBe(IDLE);
  });
});

describe('starting a download', () => {
  it('needs the file and a margin free', () => {
    const file = MODEL_FILES['gemma-4-e2b'];
    expect(checkStart(spaceNeeded(file), spaceNeeded(file))).toBeNull();
    expect(checkStart(file.bytes, spaceNeeded(file))).toBe('space');
  });

  it('reads the reason from a native error code', () => {
    expect(failureFromError({ code: 'ERR_LOCAL_MODEL_SPACE' })).toBe('space');
    expect(failureFromError({ code: 'ERR_SOMETHING_ELSE' })).toBe('network');
    expect(failureFromError(new Error('plain'))).toBe('network');
  });
});

describe('the pinned model files', () => {
  it('match the catalogue, one file per model, at a commit with its SHA-256', () => {
    for (const model of LOCAL_MODELS) {
      const file = MODEL_FILES[model.id];
      expect(file.id).toBe(model.id);
      expect(file.bytes).toBe(model.bytes);
      expect(file.revision).toMatch(/^[0-9a-f]{40}$/);
      expect(file.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(file.fileName.endsWith('.litertlm')).toBe(true);
      expect(modelUrl(file)).toBe(
        `https://huggingface.co/${file.repo}/resolve/${file.revision}/${file.fileName}`,
      );
    }
  });

  it('puts Qwen3.5 on the GPU only where the phone has 12 GB', () => {
    expect(backendFor('qwen-3.5-4b', 8)).toBe('cpu');
    expect(backendFor('qwen-3.5-4b', 12)).toBe('gpu');
    expect(backendFor('gemma-4-e2b', 6)).toBe('gpu');
    expect(spaceNeeded(MODEL_FILES['gemma-4-e4b'])).toBeGreaterThan(3.6 * GB);
  });
});

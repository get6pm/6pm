import type { NativeDownloadEvent } from '../../../modules/local-model';

/** Why a download stopped. `unavailable`: this build or device has no local model runtime. */
export type DownloadFailure =
  'space' | 'network' | 'http' | 'checksum' | 'cancelled' | 'storage' | 'unavailable';

export type DownloadState =
  | { readonly kind: 'idle' }
  /** `progress` runs 0 to 1. */
  | { readonly kind: 'downloading'; readonly progress: number; readonly received: number }
  | { readonly kind: 'verifying' }
  | { readonly kind: 'ready' }
  | { readonly kind: 'failed'; readonly reason: DownloadFailure };

export const IDLE: DownloadState = { kind: 'idle' };

const FAILURES: readonly DownloadFailure[] = [
  'space',
  'network',
  'http',
  'checksum',
  'cancelled',
  'storage',
  'unavailable',
];

function failure(reason: string | undefined): DownloadFailure {
  return FAILURES.find((f) => f === reason) ?? 'network';
}

/**
 * The state after one native event. `bytes` is the pinned size, used when the server does not
 * say how big the file is. Progress never runs backwards within one download, and a late
 * progress event cannot undo a check that has started or finished.
 */
export function nextDownloadState(
  state: DownloadState,
  event: NativeDownloadEvent,
  bytes: number,
): DownloadState {
  switch (event.state) {
    case 'idle':
      return IDLE;
    case 'verifying':
      return { kind: 'verifying' };
    case 'ready':
      return { kind: 'ready' };
    case 'failed':
      return { kind: 'failed', reason: failure(event.reason) };
    case 'downloading': {
      if (state.kind === 'verifying' || state.kind === 'ready') return state;
      const total = event.total != null && event.total > 0 ? event.total : bytes;
      const received = Math.max(0, event.received ?? 0);
      const progress = Math.min(1, total > 0 ? received / total : 0);
      if (state.kind === 'downloading' && progress < state.progress && received > 0) return state;
      return { kind: 'downloading', progress, received };
    }
  }
}

/** Whether a download can start with this much free space; `space` names what stops it. */
export function checkStart(freeBytes: number, needed: number): DownloadFailure | null {
  return freeBytes >= needed ? null : 'space';
}

/** The failure a native error stands for, from its `ERR_LOCAL_MODEL_<REASON>` code. */
export function failureFromError(error: unknown): DownloadFailure {
  const code = (error as { code?: unknown } | null)?.code;
  if (typeof code !== 'string' || !code.startsWith('ERR_LOCAL_MODEL_')) return 'network';
  return failure(code.slice('ERR_LOCAL_MODEL_'.length).toLowerCase());
}

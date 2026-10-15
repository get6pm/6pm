import {
  localModelNative,
  type LocalModelNative,
  type NativeFileSpec,
} from '../../../modules/local-model';
import type { LocalModelId } from '../privacy/ai-mode';
import {
  checkStart,
  failureFromError,
  IDLE,
  nextDownloadState,
  type DownloadFailure,
  type DownloadState,
} from './download-state';
import { MODEL_FILES, modelUrl, spaceNeeded } from './model-files';

/** The pinned file as the native side takes it. */
export function nativeSpec(id: LocalModelId): NativeFileSpec {
  const file = MODEL_FILES[id];
  return {
    id,
    url: modelUrl(file),
    fileName: file.fileName,
    bytes: file.bytes,
    sha256: file.sha256,
  };
}

/** Downloads on the phone: start, stop, ask, delete. Built over the native module or a fake. */
export function createModelStore(native: LocalModelNative | null) {
  /** The download as it stands, from the files on disk and the sessions iOS keeps. */
  async function currentState(id: LocalModelId): Promise<DownloadState> {
    if (native === null) return { kind: 'failed', reason: 'unavailable' };
    const event = await native.downloadState(nativeSpec(id));
    return nextDownloadState(IDLE, event, MODEL_FILES[id].bytes);
  }

  /**
   * Starts or resumes a download. Wi-Fi only unless `allowCellular`: on cellular it waits for
   * Wi-Fi. Returns what stopped it from starting, or null once it is under way.
   */
  async function startDownload(
    id: LocalModelId,
    allowCellular = false,
  ): Promise<DownloadFailure | null> {
    if (native === null || native.availability() === 'unavailable') return 'unavailable';
    const needed = spaceNeeded(MODEL_FILES[id]);
    const blocked = checkStart(native.freeBytes(), needed);
    if (blocked !== null) return blocked;
    try {
      await native.startDownload(nativeSpec(id), allowCellular, needed);
      return null;
    } catch (error) {
      return failureFromError(error);
    }
  }

  async function cancelDownload(id: LocalModelId): Promise<void> {
    await native?.cancelDownload(id);
  }

  /** Removes the file, any partial download and the loaded engine; it can be fetched again. */
  async function deleteModel(id: LocalModelId): Promise<void> {
    await native?.deleteModel(id);
  }

  /** The file is on the phone and passed its checksum. */
  async function modelReady(id: LocalModelId): Promise<boolean> {
    return (await currentState(id)).kind === 'ready';
  }

  return { currentState, startDownload, cancelDownload, deleteModel, modelReady };
}

export const { currentState, startDownload, cancelDownload, deleteModel, modelReady } =
  createModelStore(localModelNative);

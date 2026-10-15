import { useCallback, useEffect, useState } from 'react';

import { localModelNative } from '../../../modules/local-model';
import type { LocalModelId } from '../privacy/ai-mode';
import { IDLE, nextDownloadState, type DownloadState } from './download-state';
import { MODEL_FILES } from './model-files';
import { cancelDownload, currentState, deleteModel, startDownload } from './model-store';

export interface ModelDownload {
  readonly state: DownloadState;
  /** Starts or resumes; Wi-Fi only unless `allowCellular`. */
  readonly start: (allowCellular?: boolean) => Promise<void>;
  /** Stops and keeps what came, so `start` resumes. */
  readonly cancel: () => Promise<void>;
  readonly remove: () => Promise<void>;
}

/**
 * One model's download, live: idle, downloading with progress, verifying, ready or failed with a
 * reason. It picks up a download iOS kept going while the app was closed.
 */
export function useModelDownload(id: LocalModelId): ModelDownload {
  const [state, setState] = useState<DownloadState>(IDLE);
  const bytes = MODEL_FILES[id].bytes;

  useEffect(() => {
    let live = true;
    const subscription = localModelNative?.addListener('onDownload', (event) => {
      if (event.id === id) setState((previous) => nextDownloadState(previous, event, bytes));
    });
    void currentState(id).then((initial) => {
      if (live) setState(initial);
    });
    return () => {
      live = false;
      subscription?.remove();
    };
  }, [id, bytes]);

  const start = useCallback(
    async (allowCellular = false) => {
      setState({ kind: 'downloading', progress: 0, received: 0 });
      const blocked = await startDownload(id, allowCellular);
      if (blocked !== null) setState({ kind: 'failed', reason: blocked });
    },
    [id],
  );
  const cancel = useCallback(() => cancelDownload(id), [id]);
  const remove = useCallback(async () => {
    await deleteModel(id);
    setState(IDLE);
  }, [id]);

  return { state, start, cancel, remove };
}

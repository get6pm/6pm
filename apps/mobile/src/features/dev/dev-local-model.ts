import { useState } from 'react';

import { localModelNative } from '../../../modules/local-model';
import type { DownloadState } from '../local-model/download-state';
import { localGenerate } from '../local-model/local-generate';
import { useModelDownload } from '../local-model/use-model-download';
import { LOCAL_MODELS, modelsFor, type LocalModelId } from '../privacy/ai-mode';

const TEST_SYSTEM = 'You are a budgeting helper. Answer in one short sentence.';
const TEST_PROMPT = 'Hôm nay tôi tiêu 120k cho ăn trưa. Nói ngắn gọn: vậy có nhiều không?';

function describe(state: DownloadState): string {
  switch (state.kind) {
    case 'downloading':
      return `downloading ${(state.progress * 100).toFixed(1)}% (tap to stop)`;
    case 'failed':
      return `failed: ${state.reason} (tap to retry)`;
    case 'ready':
      return 'ready (tap to ask a test question)';
    case 'verifying':
      return 'checking the file';
    case 'idle':
      return 'not downloaded (tap to download, any network)';
  }
}

/** Developer rows for the downloaded local model: pick one, fetch it, ask it one thing, delete it. */
export function useDevLocalModelRows(): [string, () => void][] {
  const memoryGb = localModelNative?.memoryGb() ?? 0;
  const fits = modelsFor(memoryGb);
  const [id, setId] = useState<LocalModelId>(fits[0]?.id ?? 'gemma-4-e2b');
  const [answer, setAnswer] = useState('');
  const download = useModelDownload(id);
  const name = LOCAL_MODELS.find((m) => m.id === id)?.name ?? id;

  const act = () => {
    const { kind } = download.state;
    if (kind === 'downloading') return void download.cancel();
    if (kind === 'idle' || kind === 'failed') return void download.start(true);
    if (kind !== 'ready') return;
    const started = Date.now();
    setAnswer('thinking…');
    localGenerate(id, { system: TEST_SYSTEM, prompt: TEST_PROMPT, timeoutMs: 120_000 }).then(
      (text) => setAnswer(`${((Date.now() - started) / 1000).toFixed(1)} s: ${text.trim()}`),
      (error: unknown) => setAnswer(`no answer: ${String(error)}`),
    );
  };

  return [
    [
      `Local model: ${name} (${memoryGb} GB phone, ${localModelNative?.availability() ?? 'not built in'}). Tap to switch`,
      () => {
        const next =
          LOCAL_MODELS[(LOCAL_MODELS.findIndex((m) => m.id === id) + 1) % LOCAL_MODELS.length];
        if (next !== undefined) setId(next.id);
        setAnswer('');
      },
    ],
    [`${name}: ${describe(download.state)}${answer ? `\n${answer}` : ''}`, act],
    [`Delete ${name} from this iPhone`, () => void download.remove()],
  ];
}

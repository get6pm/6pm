import type { LocalModelId } from '../privacy/ai-mode';

/** One model file at a pinned Hugging Face revision, checked against its pinned SHA-256. */
export interface ModelFile {
  readonly id: LocalModelId;
  readonly repo: string;
  /** A commit, never a branch: the file under it cannot change. */
  readonly revision: string;
  readonly fileName: string;
  readonly bytes: number;
  readonly sha256: string;
  /** How much the model may hold in its context: the system prompt, the question and the answer. */
  readonly contextTokens: number;
  /**
   * The model keeps a running state the runtime does not reset between conversations (Qwen3.5's
   * linear attention), so each answer needs a fresh engine.
   */
  readonly freshPerAnswer: boolean;
}

/**
 * Google's LiteRT-LM builds (`litert-community` on Hugging Face), one runtime for all three.
 * The Gemma files are the plain builds Google measured on the iPhone 17 Pro; Qwen3.5 4B is the
 * mixed int4 build measured on the same phone (GPU about 5.7 GB, CPU about 1.7 GB).
 */
export const MODEL_FILES: Readonly<Record<LocalModelId, ModelFile>> = {
  'gemma-4-e2b': {
    id: 'gemma-4-e2b',
    repo: 'litert-community/gemma-4-E2B-it-litert-lm',
    revision: 'b3ca0d2f076785a8f4b2219ddbd2bdb99954eae1',
    fileName: 'gemma-4-E2B-it.litertlm',
    bytes: 2_588_147_712,
    sha256: '181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c',
    contextTokens: 4096,
    freshPerAnswer: false,
  },
  'gemma-4-e4b': {
    id: 'gemma-4-e4b',
    repo: 'litert-community/gemma-4-E4B-it-litert-lm',
    revision: '2eee7ac325f20eb8c9ac1d0e972f7c84663062da',
    fileName: 'gemma-4-E4B-it.litertlm',
    bytes: 3_659_530_240,
    sha256: '0b2a8980ce155fd97673d8e820b4d29d9c7d99b8fa6806f425d969b145bd52e0',
    contextTokens: 4096,
    freshPerAnswer: false,
  },
  'qwen-3.5-4b': {
    id: 'qwen-3.5-4b',
    repo: 'litert-community/Qwen3.5-4B',
    revision: '2345e16c6e6e5a2db95d5bcfa3b4fc4dc2fc0394',
    fileName: 'Qwen3.5-4B_mixed_int4.litertlm',
    bytes: 2_754_365_536,
    sha256: '50cbb13f782f4609ff11874ff15e79de5c1ee2e8856a21db72e7ef86f4acef35',
    contextTokens: 4096,
    freshPerAnswer: true,
  },
};

/** Where the file is fetched from: the revision's own path, so a later push never changes it. */
export function modelUrl(file: ModelFile): string {
  return `https://huggingface.co/${file.repo}/resolve/${file.revision}/${file.fileName}`;
}

/**
 * Room to leave beyond the file: the runtime writes its compiled GPU programs (and on the CPU a
 * weight cache near the model's size) beside it, and the phone needs space to keep working.
 */
export const FREE_SPACE_MARGIN = 1_500_000_000;

/** The free space a download needs before it starts. */
export function spaceNeeded(file: ModelFile): number {
  return file.bytes + FREE_SPACE_MARGIN;
}

/**
 * The GPU where the phone has the memory for it, else the CPU. Qwen3.5 4B peaks near 5.7 GB on
 * Metal, more than an 8 GB iPhone lets one app hold; on the CPU it stays under 2 GB.
 */
export function backendFor(id: LocalModelId, memoryGb: number): 'gpu' | 'cpu' {
  if (id === 'qwen-3.5-4b') return memoryGb >= 12 ? 'gpu' : 'cpu';
  return 'gpu';
}

import { requireOptionalNativeModule } from 'expo';

/** A pinned model file, as `features/local-model/model-files.ts` describes it. */
export interface NativeFileSpec {
  readonly id: string;
  readonly url: string;
  readonly fileName: string;
  readonly bytes: number;
  readonly sha256: string;
}

/** What the native side says about one model's download. */
export interface NativeDownloadEvent {
  readonly id: string;
  readonly state: 'idle' | 'downloading' | 'verifying' | 'ready' | 'failed';
  readonly received?: number;
  /** Null when the server did not say how big the file is. */
  readonly total?: number | null;
  /** `space`, `network`, `http`, `checksum`, `cancelled` or `storage`. */
  readonly reason?: string;
}

export interface NativeLoadOptions {
  readonly file: NativeFileSpec;
  readonly backend: 'gpu' | 'cpu';
  readonly contextTokens: number;
  readonly freshPerAnswer: boolean;
}

export interface NativeGenerateOptions {
  readonly system: string;
  readonly prompt: string;
  readonly maxTokens: number;
  readonly temperature: number;
  readonly timeoutMs: number;
}

interface Subscription {
  remove(): void;
}

export interface LocalModelNative {
  /** Physical memory in whole GB, as phones are sold. */
  memoryGb(): number;
  /** `unavailable` where the runtime cannot run on this device. */
  availability(): 'available' | 'unavailable';
  freeBytes(): number;
  isLoaded(id: string): boolean;
  load(options: NativeLoadOptions): Promise<void>;
  /** The answer's text. Codes on failure: ERR_LOCAL_MODEL_TIMEOUT, _GENERATE, _LOAD. */
  generate(options: NativeGenerateOptions): Promise<string>;
  unload(): Promise<void>;
  downloadState(file: NativeFileSpec): Promise<NativeDownloadEvent>;
  /** Codes on failure: ERR_LOCAL_MODEL_SPACE. */
  startDownload(
    file: NativeFileSpec,
    allowCellular: boolean,
    minimumFreeBytes: number,
  ): Promise<void>;
  cancelDownload(id: string): Promise<void>;
  deleteModel(id: string): Promise<void>;
  addListener(event: 'onDownload', listener: (event: NativeDownloadEvent) => void): Subscription;
  addListener(
    event: 'onUnloaded',
    listener: (event: { id: string; reason: 'memory' }) => void,
  ): Subscription;
}

/**
 * The downloaded local model (`modules/local-model/ios`, Google's LiteRT-LM), or null where it is
 * not built in: tests, and platforms without it.
 */
export const localModelNative = requireOptionalNativeModule<LocalModelNative>('LocalModel');

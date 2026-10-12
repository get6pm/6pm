import { requireOptionalNativeModule } from 'expo';

/** One file an extension left in the App Group inbox. */
export interface InboxFile {
  readonly id: string;
  readonly json: string;
}

export type ActivityKind = 'pendingPay' | 'travel';

export interface RunningActivity {
  readonly id: string;
  readonly kind: ActivityKind;
  readonly key: string;
  readonly stateJson: string;
}

interface SurfacesNative {
  writeSurface(name: 'snapshot' | 'context', json: string): Promise<void>;
  writeSurfaceImage(name: string, pngBase64: string): Promise<void>;
  readInbox(): Promise<InboxFile[]>;
  removeInbox(ids: readonly string[]): Promise<void>;
  activitiesEnabled(): boolean;
  listActivities(): Promise<RunningActivity[]>;
  startActivity(kind: ActivityKind, key: string, stateJson: string): Promise<string | null>;
  updateActivity(id: string, stateJson: string): Promise<void>;
  endActivity(id: string, finalStateJson: string | null): Promise<void>;
}

/**
 * The App Group bridge (`modules/surfaces/ios`), or null where it is not built in: tests, and
 * a platform without the extensions.
 */
export const surfaces = requireOptionalNativeModule<SurfacesNative>('Surfaces');

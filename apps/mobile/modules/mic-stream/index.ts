import { requireOptionalNativeModule, type EventSubscription } from 'expo';

/**
 * Why the microphone stopped by itself: the system took it away (a call, Siri, another app's
 * audio or recording, a headset change on iOS).
 */
export type MicStopReason = 'interrupted';

interface MicStreamNative {
  /** Starts the microphone; rejects when it cannot. Permission is asked for elsewhere. */
  start(): Promise<void>;
  /** Stops it; what is left arrives as one last `onAudio`. */
  stop(): Promise<void>;
  addListener(event: 'onAudio', listener: (event: { chunk: string }) => void): EventSubscription;
  addListener(
    event: 'onStop',
    listener: (event: { reason: MicStopReason }) => void,
  ): EventSubscription;
}

/**
 * The microphone as 16 kHz mono 16-bit PCM, base64 chunks of about 100 ms
 * (`modules/mic-stream/ios`, `modules/mic-stream/android`), or null where it is not built in:
 * tests, and web.
 */
export const micStream = requireOptionalNativeModule<MicStreamNative>('MicStream');

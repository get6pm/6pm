import { requireOptionalNativeModule } from 'expo';

/** Why the on-device model cannot answer, or `available`. */
export type CompanionModelAvailability =
  | 'available'
  | 'unsupportedOS'
  | 'deviceNotEligible'
  | 'appleIntelligenceNotEnabled'
  | 'modelNotReady'
  | 'unsupportedLanguage';

interface CompanionModelNative {
  availability(language: 'en' | 'vi'): CompanionModelAvailability;
  prewarm(): void;
  /** JSON `{ text, mood }`. */
  word(instructions: string, prompt: string): Promise<string>;
  /** JSON of the flat query (see `ReadQuery` in the Swift module). */
  readQuestion(instructions: string, prompt: string): Promise<string>;
}

/**
 * Apple's on-device model (`modules/companion-model/ios`), or null where it is not built in:
 * tests, and platforms without it. Below iOS 26 it is built in and says `unsupportedOS`.
 */
export const companionModel = requireOptionalNativeModule<CompanionModelNative>('CompanionModel');

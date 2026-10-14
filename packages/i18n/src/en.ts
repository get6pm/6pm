import { enCaptureWalk } from './en-capture-walk';
import { enNative } from './en-native';
import { enSharing } from './en-sharing';
import { enShareExt } from './en-share-ext';
import { enIntents } from './en-intents';
import { enVoice } from './en-voice';
import { enSurfaces } from './en-surfaces';
import { enTogether } from './en-together';
import { enReceiptEmail } from './en-receipt-email';
import { enBackup } from './en-backup';
import { enExport } from './en-export';
import { enAsk } from './en-ask';
import { enScan } from './en-scan';
import { enLooks } from './en-looks';
import { enOnboarding } from './en-onboarding';
import { enDiary } from './en-diary';
import { enYearBook } from './en-year-book';
import { enPlan } from './en-plan';
import { enClose } from './en-close';
import { enCompanion } from './en-companion';
import { enToday } from './en-today';
import { enCategories } from './en-categories';
import { enTravel } from './en-travel';
import { enCompanions } from './en-companions';

/** The source catalogue: every key the app uses, in English. */
export const en = {
  ...enOnboarding,
  ...enDiary,
  ...enYearBook,
  ...enPlan,
  ...enClose,
  ...enToday,
  ...enCategories,
  ...enScan,
  ...enLooks,
  ...enCompanion,
  ...enBackup,
  ...enExport,
  ...enAsk,
  ...enNative,
  ...enSharing,
  ...enShareExt,
  ...enIntents,
  ...enCaptureWalk,
  ...enVoice,
  ...enSurfaces,
  ...enTogether,
  ...enReceiptEmail,
  ...enTravel,
  ...enCompanions,
} as const;

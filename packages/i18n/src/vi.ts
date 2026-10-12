import { viNative } from './vi-native';
import { viSharing } from './vi-sharing';
import { viShareExt } from './vi-share-ext';
import { viIntents } from './vi-intents';
import { viVoice } from './vi-voice';
import { viSurfaces } from './vi-surfaces';
import { viTogether } from './vi-together';
import { viReceiptEmail } from './vi-receipt-email';
import { viBackup } from './vi-backup';
import { viExport } from './vi-export';
import { viAsk } from './vi-ask';
import { viScan } from './vi-scan';
import { viLooks } from './vi-looks';
import { viOnboarding } from './vi-onboarding';
import { viDiary } from './vi-diary';
import { viPlan } from './vi-plan';
import { viClose } from './vi-close';
import type { Catalogue } from './catalogue-types';
import { viCompanion } from './vi-companion';
import { viToday } from './vi-today';
import { viCategories } from './vi-categories';
import { viTravel } from './vi-travel';

export const vi: Catalogue = {
  ...viOnboarding,
  ...viDiary,
  ...viPlan,
  ...viClose,
  ...viToday,
  ...viCategories,
  ...viScan,
  ...viLooks,
  ...viCompanion,
  ...viBackup,
  ...viExport,
  ...viAsk,
  ...viNative,
  ...viSharing,
  ...viShareExt,
  ...viIntents,
  ...viVoice,
  ...viSurfaces,
  ...viTogether,
  ...viReceiptEmail,
  ...viTravel,
};

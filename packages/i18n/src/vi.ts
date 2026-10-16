import { viCaptureWalk } from './vi-capture-walk';
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
import { viAskActions } from './vi-ask-actions';
import { viPrivacyAi } from './vi-privacy-ai';
import { viAskChat } from './vi-ask-chat';
import { viAskLedger } from './vi-ask-ledger';
import { viScan } from './vi-scan';
import { viBanks } from './vi-banks';
import { viLooks } from './vi-looks';
import { viOnboarding } from './vi-onboarding';
import { viDiary } from './vi-diary';
import { viYearBook } from './vi-year-book';
import { viPlan } from './vi-plan';
import { viClose } from './vi-close';
import type { Catalogue } from './catalogue-types';
import { viCompanion } from './vi-companion';
import { viInsights } from './vi-insights';
import { viInsightsHabits } from './vi-insights-habits';
import { viToday } from './vi-today';
import { viCategories } from './vi-categories';
import { viTravel } from './vi-travel';
import { viCompanions } from './vi-companions';
import { viWidgetsGuide } from './vi-widgets-guide';
import { viDuo } from './vi-duo';

export const vi: Catalogue = {
  ...viOnboarding,
  ...viDiary,
  ...viYearBook,
  ...viPlan,
  ...viClose,
  ...viToday,
  ...viCategories,
  ...viScan,
  ...viBanks,
  ...viLooks,
  ...viCompanion,
  ...viInsights,
  ...viInsightsHabits,
  ...viBackup,
  ...viExport,
  ...viAsk,
  ...viAskLedger,
  ...viAskChat,
  ...viAskActions,
  ...viPrivacyAi,
  ...viNative,
  ...viSharing,
  ...viShareExt,
  ...viIntents,
  ...viCaptureWalk,
  ...viVoice,
  ...viSurfaces,
  ...viTogether,
  ...viReceiptEmail,
  ...viTravel,
  ...viCompanions,
  ...viWidgetsGuide,
  ...viDuo,
};

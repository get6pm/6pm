import { enScan } from './en-scan';
import { enLooks } from './en-looks';
import { enOnboarding } from './en-onboarding';
import { enDiary } from './en-diary';
import { enPlan } from './en-plan';
import { enClose } from './en-close';
import { enCompanion } from './en-companion';
import { enToday } from './en-today';
import { enCategories } from './en-categories';

/** The source catalogue: every key the app uses, in English. */
export const en = {
  ...enOnboarding,
  ...enDiary,
  ...enPlan,
  ...enClose,
  ...enToday,
  ...enCategories,
  ...enScan,
  ...enLooks,
  ...enCompanion,
} as const;

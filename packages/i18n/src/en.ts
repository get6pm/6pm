import { enDiary } from './en-diary';
import { enPlan } from './en-plan';
import { enClose } from './en-close';
import { enCompanion } from './en-companion';
import { enToday } from './en-today';

/** The source catalogue: every key the app uses, in English. */
export const en = {
  ...enDiary,
  ...enPlan,
  ...enClose,
  ...enToday,
  ...enCompanion,
} as const;

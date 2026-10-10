import { viOnboarding } from './vi-onboarding';
import { viDiary } from './vi-diary';
import { viPlan } from './vi-plan';
import { viClose } from './vi-close';
import type { Catalogue } from './catalogue-types';
import { viCompanion } from './vi-companion';
import { viToday } from './vi-today';
import { viCategories } from './vi-categories';

export const vi: Catalogue = {
  ...viOnboarding,
  ...viDiary,
  ...viPlan,
  ...viClose,
  ...viToday,
  ...viCategories,
  ...viCompanion,
};

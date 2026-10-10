import { viDiary } from './vi-diary';
import { viPlan } from './vi-plan';
import { viClose } from './vi-close';
import type { Catalogue } from './catalogue-types';
import { viCompanion } from './vi-companion';
import { viToday } from './vi-today';

export const vi: Catalogue = {
  ...viDiary,
  ...viPlan,
  ...viClose,
  ...viToday,
  ...viCompanion,
};

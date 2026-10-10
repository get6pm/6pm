import { viClose } from './vi-close';
import type { Catalogue } from './catalogue-types';
import { viCompanion } from './vi-companion';
import { viToday } from './vi-today';

export const vi: Catalogue = {
  ...viClose,
  ...viToday,
  ...viCompanion,
};

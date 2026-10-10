import { enClose } from './en-close';
import { enCompanion } from './en-companion';
import { enToday } from './en-today';

/** The source catalogue: every key the app uses, in English. */
export const en = {
  ...enClose,
  ...enToday,
  ...enCompanion,
} as const;

import { LOOKUP_CASES } from './ask-eval-lookups';
import type { EvalCase } from './ask-eval-score';
import { TALK_CASES } from './ask-eval-talk';

/** Every case in the evaluation set. */
export const EVAL_CASES: readonly EvalCase[] = [...LOOKUP_CASES, ...TALK_CASES];

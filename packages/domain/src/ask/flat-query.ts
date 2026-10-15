import { askQuerySchema, askRangePresets, type AskQuery, type AskRangePreset } from './ask-query';

/**
 * A question as the phone's own model reads it: every field present, with `none`, an empty string
 * or 0 for "not said" (the on-device model fills a fixed shape best).
 */
export interface FlatQuery {
  readonly kind: string;
  readonly range: string;
  readonly against: string;
  readonly category: string;
  readonly merchant: string;
  readonly pot: string;
  readonly amount: number;
}

const isPreset = (value: string): value is AskRangePreset =>
  (askRangePresets as readonly string[]).includes(value);

/** What the on-device model is told on top of the shared reading rules. */
export const flatQueryNote =
  'Fill every field: range and against are "none" when not said, category, merchant and pot are empty, amount is 0.';

/**
 * The query a flat reading stands for, checked like any other, or null when it is not one (an
 * amount question with no amount, a kind it does not know). Unsaid spans take the same defaults
 * the rules use.
 */
export function queryOfFlat(flat: FlatQuery): AskQuery | null {
  const range = isPreset(flat.range) ? flat.range : null;
  const against = isPreset(flat.against) ? flat.against : null;
  const text = (value: string) => {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  };
  const category = text(flat.category);
  const merchant = text(flat.merchant);
  const filters = {
    ...(category === undefined ? {} : { category }),
    ...(merchant === undefined ? {} : { merchant }),
  };
  const amount = Math.round(flat.amount);

  const candidate: unknown = (() => {
    switch (flat.kind) {
      case 'afford':
      case 'saveMore':
        return {
          kind: flat.kind,
          amount: flat.kind === 'saveMore' && amount <= 0 ? 500_000 : amount,
        };
      case 'potFull': {
        const pot = text(flat.pot);
        return pot === undefined ? { kind: 'potFull' } : { kind: 'potFull', pot };
      }
      case 'spend':
        return { kind: 'spend', range: { preset: range ?? 'thisCycle' }, ...filters };
      case 'breakdown':
        return { kind: 'breakdown', range: { preset: range ?? 'thisCycle' } };
      case 'compare':
        return {
          kind: 'compare',
          range: { preset: range ?? 'thisCycle' },
          ...(against === null ? {} : { against: { preset: against } }),
          ...filters,
        };
      case 'list':
        return { kind: 'list', range: { preset: range ?? 'thisWeek' }, ...filters };
      default:
        return { kind: flat.kind };
    }
  })();
  const parsed = askQuerySchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

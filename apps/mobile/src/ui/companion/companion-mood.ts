export const companionMoods = ['calm', 'happy', 'wave', 'nod', 'think', 'sleepy', 'plain'] as const;
export type CompanionMood = (typeof companionMoods)[number];

/**
 * Who the companion is: the setting sun (everyone's to start), its Max form, and four more to
 * choose from. The Max form and the paper crane come with Max.
 */
export const COMPANION_FORMS = ['sun', 'max', 'nhang', 'banhbao', 'giot', 'hac'] as const;
export type CompanionForm = (typeof COMPANION_FORMS)[number];

/** The forms only a Max member can wear. */
export const MAX_FORMS: readonly CompanionForm[] = ['max', 'hac'];

/** Whether a form comes with Max rather than with the app. */
export function isMaxForm(form: CompanionForm): boolean {
  return MAX_FORMS.includes(form);
}

export interface CompanionMoodInput {
  /** Decimal hour on the phone's clock (18:07 → 18.1166). */
  readonly hour: number;
  readonly serious: boolean;
  /** Today's safe-to-spend in đồng; below zero the companion nods along. */
  readonly safe: number;
  /** A toast line is on screen. */
  readonly toast: boolean;
  /** The day is closed: an overspend no longer needs the nod. */
  readonly closed?: boolean;
}

/**
 * The home companion's mood, in the prototype's order of precedence: serious mode is plain, a toast
 * is happy, an open overspent day nods, late evening is sleepy, morning waves, otherwise calm.
 */
export function companionMood({
  hour,
  serious,
  safe,
  toast,
  closed = false,
}: CompanionMoodInput): CompanionMood {
  if (serious) return 'plain';
  if (toast) return 'happy';
  if (!closed && safe < 0) return 'nod';
  if (hour >= 21.5) return 'sleepy';
  if (hour < 9) return 'wave';
  return 'calm';
}

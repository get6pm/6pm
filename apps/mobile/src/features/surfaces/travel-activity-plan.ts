import type { RunningActivity } from '../../../modules/surfaces';
import type { ActivityPlan } from './live-activity-plan';

export interface TravelPlanInput {
  /** What iOS has running now (`listActivities`). Waiting payments are left alone. */
  readonly running: readonly RunningActivity[];
  /** The trip to show: its key and content state, or null at home or before it has a rate. */
  readonly trip: { readonly key: string; readonly stateJson: string } | null;
  /** iOS only starts an activity for an app in the foreground. */
  readonly foreground: boolean;
  /** Live Activities are allowed for 6pm in Settings. */
  readonly enabled: boolean;
}

/**
 * One trip activity at most, while a trip is under way. It is updated when its words or numbers
 * change (a spend, the language, a new rate), ended when the trip ends (home again, the switch
 * off, Max gone) and replaced when the phone is in a new country.
 */
export function travelActivityPlan(input: TravelPlanInput): ActivityPlan {
  const { trip } = input;
  const update: { id: string; stateJson: string }[] = [];
  const end: { id: string; finalStateJson: null }[] = [];
  let kept = false;
  for (const activity of input.running) {
    if (activity.kind !== 'travel') continue;
    if (trip !== null && !kept && activity.key === trip.key) {
      kept = true;
      if (activity.stateJson !== trip.stateJson) {
        update.push({ id: activity.id, stateJson: trip.stateJson });
      }
    } else {
      end.push({ id: activity.id, finalStateJson: null });
    }
  }
  const start =
    trip !== null && !kept && input.foreground && input.enabled
      ? { kind: 'travel' as const, key: trip.key, stateJson: trip.stateJson }
      : null;
  return { start, update, end };
}

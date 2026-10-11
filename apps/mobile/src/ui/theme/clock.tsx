import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { hourOf, moneyDayOf, moneyHourOf, type LocalDate } from '@6pm/domain';

export interface Clock {
  readonly now: Date;
  /** The money day: the phone's day, except before 04:00, when it is still yesterday. */
  readonly today: LocalDate;
  /** Noon on the money day, for printing its weekday and date. */
  readonly dayDate: Date;
  /** Decimal hour on the phone's clock: the sky and the companion follow it. */
  readonly hour: number;
  /** The hour on the money day's clock (01:30 is 25.5), for how late tonight's close is. */
  readonly closeHour: number;
}

function read(now: Date): Clock {
  const today = moneyDayOf(now);
  return {
    now,
    today,
    dayDate: new Date(`${today}T12:00:00`),
    hour: hourOf(now),
    closeHour: moneyHourOf(now),
  };
}

const ClockContext = createContext<Clock>(read(new Date()));

/**
 * Developer builds can pin the clock (e.g. to 18:07, the time every design render shows) so a
 * screen can be compared with its render. Null follows the real time.
 */
let pinned: Date | null = null;
const pinListeners = new Set<() => void>();
export function pinClock(at: Date | null): void {
  pinned = at;
  for (const listener of pinListeners) listener();
}

/**
 * The phone's clock, ticking on each minute boundary and refreshed when the app comes back, so the
 * sky, the daily number and the close follow the real time of day.
 */
export function ClockProvider({ children }: { readonly children: ReactNode }) {
  const [clock, setClock] = useState(() => read(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = pinned ?? new Date();
      setClock(read(now));
      timer = setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
    };
    tick();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        clearTimeout(timer);
        tick();
      }
    });
    const onPin = () => {
      clearTimeout(timer);
      tick();
    };
    pinListeners.add(onPin);
    return () => {
      clearTimeout(timer);
      subscription.remove();
      pinListeners.delete(onPin);
    };
  }, []);

  return <ClockContext value={clock}>{children}</ClockContext>;
}

export function useClock(): Clock {
  return use(ClockContext);
}

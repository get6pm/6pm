/** The launch: Friday 6 November 2026, 18:00 in Vietnam. */
export const launchIso = '2026-11-06T18:00:00+07:00';
export const launchAt = Date.parse(launchIso);

const vietnam = { timeZone: 'Asia/Ho_Chi_Minh' } as const;

/** "Fri 6 Nov, 18:00": the launch as the page prints it. Built ahead of time, never in the browser. */
export function launchLabel(at: number = launchAt): string {
  const day = new Date(at);
  const date = day.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...vietnam,
  });
  const time = day.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...vietnam,
  });
  return `${date}, ${time}`;
}

/** Whole days, hours, minutes and seconds until the launch, none below zero. */
export function untilLaunch(now: number, at: number = launchAt): readonly number[] {
  const left = Math.max(0, at - now);
  return [
    Math.floor(left / 864e5),
    Math.floor(left / 36e5) % 24,
    Math.floor(left / 6e4) % 60,
    Math.floor(left / 1e3) % 60,
  ];
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/**
 * When a receipt says the payment happened, as the phone's local time: "16:40 Thứ Sáu 09/10/2026",
 * "09/10/2026 16:40:12", "2026-10-09 16:40", "9 Oct 2026, 4:40 PM", "Sep 01, 2024 3:37PM", and a
 * till's "16.04.2019 18.54". A date with no time is taken at noon, so it stays on its money day
 * (which starts at 04:00).
 */
export function readReceiptTime(text: string): string | null {
  const t = text.toLowerCase();
  let day: number | undefined, month: number | undefined, year: number | undefined;
  const dmy = /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/.exec(t);
  const ymd = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t);
  const named = /(\d{1,2})\s+([a-z]{3})[a-z]*\.?,?\s+(\d{4})/.exec(t);
  const us = /\b([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/.exec(t);
  if (ymd) [year, month, day] = [Number(ymd[1]), Number(ymd[2]), Number(ymd[3])];
  else if (dmy) [day, month, year] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])];
  else if (named && MONTHS.includes(named[2] ?? '')) {
    [day, month, year] = [Number(named[1]), MONTHS.indexOf(named[2] ?? '') + 1, Number(named[3])];
  } else if (us && MONTHS.includes(us[1] ?? '')) {
    [day, month, year] = [Number(us[2]), MONTHS.indexOf(us[1] ?? '') + 1, Number(us[3])];
  }
  if (day === undefined || month === undefined || year === undefined) return null;
  // Shop tills print "16.04.2019 18.54": a dotted clock counts only right after the date.
  const date = ymd ?? dmy;
  const after = date ? t.slice(date.index + date[0].length) : '';
  const dotted = date ? /^\s+(\d{1,2})\.(\d{2})(?![\d.])/.exec(after) : null;
  const clock = /(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(am|pm|sa|ch))?/.exec(t) ?? dotted;
  let hour = clock ? Number(clock[1]) : 12;
  const minute = clock ? Number(clock[2]) : 0;
  const second = clock?.[3] ? Number(clock[3]) : 0;
  const half = clock?.[4];
  if ((half === 'pm' || half === 'ch') && hour < 12) hour += 12;
  if ((half === 'am' || half === 'sa') && hour === 12) hour = 0;
  if (hour > 23 || minute > 59 || second > 59) return null;
  const at = new Date(year, month - 1, day, hour, minute, second);
  if (at.getFullYear() !== year || at.getMonth() !== month - 1 || at.getDate() !== day) return null;
  return at.toISOString();
}

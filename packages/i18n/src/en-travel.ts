/** Travel mode: the Settings switch, the Home pill, the Live Activity, entry and Scan abroad. */
export const enTravel = {
  'travel.settings.label': 'Travel mode',
  'travel.settings.sub': 'Turns on by itself abroad',
  'travel.settings.locationOff': 'Allow location so it can tell you’re abroad',
  'travel.settings.stale': 'Rates from {date}',
  'travel.settings.noRates': 'Waiting for today’s rates',
  'travel.pill': '{place} · {symbol} with {home} underneath',
  'travel.activity.place': '{place} · today',
  'travel.activity.left': '{amount} left',
  'travel.activity.over': '{amount} over',
  'travel.activity.of': 'of {line} · ≈ {vnd}',
  'travel.activity.leftOf': 'left of {line} · ≈ {home}',
  'travel.activity.overOf': 'over {line} · ≈ {home}',
  'travel.activity.leftHome': 'left · ≈ {home}',
  'travel.activity.overHome': 'over · ≈ {home}',
  'travel.activity.log': 'Log {symbol}',
  'travel.quick.underneath': '≈ {amount}',
  'travel.quick.underneathStale': '≈ {amount} · rate from {date}',
  'travel.quick.currency': 'Switch currency',
  // A đồng home: Vietnamese banks pay the region's QRs. Any other home pays the local way.
  'travel.scan.body':
    'Pay it in your bank app: most Vietnamese banks take it. 6pm keeps it in {symbol} with ₫ underneath.',
  'travel.scan.bodyAway':
    'Pay it the way you pay there. 6pm keeps it in {symbol} with {home} underneath.',
  'travel.scan.keep': 'Paid · keep {amount}',
  'travel.scan.logIn': 'Log it in {symbol}',
} as const;

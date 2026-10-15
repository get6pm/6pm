import type { Currency } from '@6pm/domain';

import type { SymbolName } from '../../ui/icons/symbols.generated';
import type { AiMode } from '../privacy/ai-mode';

/** The ways onboarding shows spending being caught, in the order of its cards. */
export const CATCH_WAYS = ['scan', 'share', 'wallet', 'email', 'add', 'lock'] as const;
export type CatchWay = (typeof CATCH_WAYS)[number];

/** The ways set up once outside 6pm: the Wallet automation in Shortcuts, and mail forwarding. */
export type SetupWay = Extract<CatchWay, 'wallet' | 'email'>;

export function needsSetup(way: CatchWay): way is SetupWay {
  return way === 'wallet' || way === 'email';
}

/** The ways that have a drawn walkthrough to open: the two set-ups, and sharing a receipt. */
export type WalkedWay = SetupWay | 'share';

export function walkedWay(way: CatchWay): WalkedWay | null {
  return way === 'wallet' || way === 'email' || way === 'share' ? way : null;
}

/**
 * The ways shown for a home currency and an AI mode. Scan to pay reads VietQR, which only
 * Vietnamese banks print, so it is left out when home is not đồng. Receipt email exists only in
 * server mode, so it is left out in on-device mode.
 */
export function catchWaysFor(home: Currency, mode: AiMode = 'server'): readonly CatchWay[] {
  return CATCH_WAYS.filter(
    (way) => !(way === 'scan' && home.code !== 'VND') && !(way === 'email' && mode === 'device'),
  );
}

/** How many work the moment onboarding ends, with nothing to set up. */
export function readyWays(ways: readonly CatchWay[]): number {
  return ways.filter((way) => !needsSetup(way)).length;
}

export const WAY_ICON: Readonly<Record<CatchWay, SymbolName>> = {
  scan: 'qr_code_scanner',
  share: 'ios_share',
  wallet: 'contactless',
  email: 'alternate_email',
  add: 'mic',
  lock: 'widgets',
};

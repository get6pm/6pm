import { findBank } from '@6pm/domain';

import type { SymbolName } from '../../ui/icons/symbols.generated';

/** What a spend's wallet is stored as when it was paid in cash, in every language. */
export const CASH_WALLET = 'Cash';
/** Onboarding's code for cash among the wallets it saves. */
const CASH_CODE = 'CASH';
/** The banks offered when onboarding saved none. */
const FALLBACK_CODES = ['MB', 'MOMO'] as const;

export interface WalletOption {
  /** What is stored on the spend. */
  readonly value: string;
  /** What the picker shows, in the current language. */
  readonly label: string;
  readonly icon: SymbolName;
  /** The bank's code, to draw its logo; absent for cash and a wallet 6pm does not know. */
  readonly bankId?: string;
}

/**
 * The wallets a spend can be paid with: cash first, then the banks and wallets chosen in
 * onboarding. A spend already paid with something else keeps it as a choice, so editing never
 * silently drops it.
 */
export function walletOptions(
  chosen: readonly string[],
  cashLabel: string,
  current?: string | null,
): WalletOption[] {
  const codes = chosen.filter((id) => id.toUpperCase() !== CASH_CODE);
  const banks = (codes.length > 0 ? codes : FALLBACK_CODES).flatMap((id) => findBank(id) ?? []);
  const options: WalletOption[] = [
    { value: CASH_WALLET, label: cashLabel, icon: 'payments' },
    ...banks.map((bank): WalletOption => ({
      value: bank.shortName,
      label: bank.shortName,
      icon: bank.kind === 'wallet' ? 'account_balance_wallet' : 'account_balance',
      bankId: bank.id,
    })),
  ];
  if (current && !options.some((o) => o.value === current)) {
    options.push({ value: current, label: current, icon: 'account_balance' });
  }
  return options;
}

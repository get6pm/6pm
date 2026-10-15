import { findBank } from '@6pm/domain';

import { bankNameOf } from '../banks/named-bank';
import type { SymbolName } from '../../ui/icons/symbols.generated';

/** What a spend's wallet is stored as when it was paid in cash, in every language. */
export const CASH_WALLET = 'Cash';
/** Onboarding's code for cash among the wallets it saves. */
const CASH_CODE = 'CASH';

export interface WalletOption {
  /** What is stored on the spend. */
  readonly value: string;
  /** What the picker shows, in the current language. */
  readonly label: string;
  readonly icon: SymbolName;
  /** The bank's saved code, to draw its logo or its typed name's letters; absent for cash. */
  readonly bankId?: string;
}

/**
 * The wallets a spend can be paid with: cash first, then the banks and wallets chosen in
 * onboarding or Settings, typed names included; only cash when none were. A spend already paid with something else keeps it as a choice, so editing never
 * silently drops it.
 */
export function walletOptions(
  chosen: readonly string[],
  cashLabel: string,
  current?: string | null,
): WalletOption[] {
  const codes = chosen.filter((id) => id.toUpperCase() !== CASH_CODE);
  const options: WalletOption[] = [{ value: CASH_WALLET, label: cashLabel, icon: 'payments' }];
  for (const id of codes) {
    const typed = bankNameOf(id);
    const bank = typed === null ? findBank(id) : null;
    const option: WalletOption | null =
      typed !== null
        ? { value: typed, label: typed, icon: 'account_balance', bankId: id }
        : bank
          ? {
              value: bank.shortName,
              label: bank.shortName,
              icon: bank.kind === 'wallet' ? 'account_balance_wallet' : 'account_balance',
              bankId: bank.id,
            }
          : null;
    if (option && !options.some((o) => o.value === option.value)) options.push(option);
  }
  if (current && !options.some((o) => o.value === current)) {
    options.push({ value: current, label: current, icon: 'account_balance' });
  }
  return options;
}

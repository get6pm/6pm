/** What the Inbox reads from a waiting spend to tell whether it needs a person's eye. */
export interface LookInput {
  readonly amount: number;
  readonly foreignAmount: { currency: string; amount: number; rate: number } | null;
  /** The currency was inferred, not printed on the receipt. */
  readonly currencyGuessed?: boolean;
}

/**
 * A waiting spend needs a look when confirming it as it is would be wrong: it has no amount, it
 * was spent in another currency with no rate to price it yet, or its currency was a guess.
 */
export function needsALook({ amount, foreignAmount, currencyGuessed }: LookInput): boolean {
  return (
    amount <= 0 || (foreignAmount !== null && !(foreignAmount.rate > 0)) || currencyGuessed === true
  );
}

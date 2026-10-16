import { customerSchema, FREE_CUSTOMER, NO_MAX, type CustomerState } from './purchases-port';

/** The settings key under which the last known customer is kept. */
export const CUSTOMER_KEY = 'purchases';

/**
 * Reads the last known customer from its stored text. Anything unreadable is the free customer:
 * the store answers within moments of launch and corrects it. A Max that was not renewing and
 * whose end the store gave has passed is no longer Max, so a phone kept offline does not hold it
 * past its end; the looks bought one by one stay.
 */
export function parseCustomer(raw: string | null | undefined, now = Date.now()): CustomerState {
  if (raw === null || raw === undefined) return FREE_CUSTOMER;
  let parsed: CustomerState;
  try {
    const checked = customerSchema.safeParse(JSON.parse(raw));
    if (!checked.success) return FREE_CUSTOMER;
    parsed = checked.data;
  } catch {
    return FREE_CUSTOMER;
  }
  const { max } = parsed;
  return max.active && max.endsAt !== null && max.endsAt <= now
    ? { ...parsed, max: NO_MAX }
    : parsed;
}

export function serializeCustomer(customer: CustomerState): string {
  return JSON.stringify(customerSchema.parse(customer));
}

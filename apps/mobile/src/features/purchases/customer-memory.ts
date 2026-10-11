import { customerSchema, FREE_CUSTOMER, type CustomerState } from './purchases-port';

/** The settings key under which the last known customer is kept. */
export const CUSTOMER_KEY = 'purchases';

/**
 * Reads the last known customer from its stored text. Anything unreadable is the free customer:
 * the store answers within moments of launch and corrects it.
 */
export function parseCustomer(raw: string | null | undefined): CustomerState {
  if (raw === null || raw === undefined) return FREE_CUSTOMER;
  try {
    const parsed = customerSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : FREE_CUSTOMER;
  } catch {
    return FREE_CUSTOMER;
  }
}

export function serializeCustomer(customer: CustomerState): string {
  return JSON.stringify(customerSchema.parse(customer));
}

import type { WaitlistRequest } from '@6pm/domain';

export type JoinOutcome =
  | { readonly kind: 'listed'; readonly ticket: number }
  /** The list turned the email down. */
  | { readonly kind: 'invalid' }
  /** Too many tries from this address for now. */
  | { readonly kind: 'busy' }
  /** Offline, timed out, or the list is down: worth trying again. */
  | { readonly kind: 'unreachable' };

const timeoutMs = 10_000;

/** Puts an email on the launch list, on this site's own `/api`. Never throws. */
export async function joinWaitlist(body: WaitlistRequest): Promise<JoinOutcome> {
  let response: Response;
  try {
    response = await fetch('/api/v1/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { kind: 'unreachable' };
  }
  if (response.status === 400) return { kind: 'invalid' };
  if (response.status === 429) return { kind: 'busy' };
  if (!response.ok) return { kind: 'unreachable' };
  try {
    const data: unknown = await response.json();
    const ticket = (data as { ticket?: unknown } | null)?.ticket;
    if (typeof ticket === 'number' && Number.isInteger(ticket) && ticket > 0) {
      return { kind: 'listed', ticket };
    }
  } catch {
    // Not the list's answer; treat it as unreachable.
  }
  return { kind: 'unreachable' };
}

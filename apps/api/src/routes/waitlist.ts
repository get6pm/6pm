import { waitlistRequestSchema, type WaitlistResponse } from '@6pm/domain';

import { ApiError } from '../errors';
import { readBody, type RouteDefinition, type RouteContext } from '../route';

type TicketRow = { ticket: number };

function ticketOf(c: RouteContext, email: string): Promise<TicketRow | null> {
  return c.env.DB.prepare('SELECT ticket FROM waitlist WHERE email = ?')
    .bind(email)
    .first<TicketRow>();
}

/**
 * Puts an email on the launch list and answers with its place in line. Sending an email that is
 * already on the list changes nothing and answers with the ticket it already has, so a retry or a
 * second visit is safe. The answer never says anything about other signups.
 */
export const waitlistRoute: RouteDefinition = {
  method: 'POST',
  path: '/v1/waitlist',
  access: 'public',
  handle: async (c) => {
    const { email, language, leak } = await readBody(c, waitlistRequestSchema);
    // Looked up first: an insert that meets the unique email still uses up a ticket number, and
    // tickets are meant to run without gaps. Two first signups racing settle on the stored row.
    const row =
      (await ticketOf(c, email)) ??
      (await c.env.DB.prepare(
        `INSERT INTO waitlist (email, language, leak, created_at) VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT (email) DO NOTHING
         RETURNING ticket`,
      )
        .bind(email, language, leak ?? null, new Date().toISOString())
        .first<TicketRow>()) ??
      (await ticketOf(c, email));
    if (row === null) throw new ApiError('internal', 'The list did not answer');
    const body: WaitlistResponse = { ticket: row.ticket };
    return c.json(body);
  },
};

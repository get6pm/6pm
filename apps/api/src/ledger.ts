import { ApiError } from './errors';

export type AiUsage = {
  /** The AI route's id, such as `ask.read`. */
  readonly route: string;
  /** The model that actually answered. */
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  /** The device's token hash, or null for a call no device made. */
  readonly deviceHash: string | null;
};

/** Adds one model call to the cost ledger. Token counts only: no request or response text. */
export async function recordAiUsage(db: D1Database, usage: AiUsage): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ai_usage (route, model, input_tokens, output_tokens, device_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      usage.route,
      usage.model,
      usage.inputTokens,
      usage.outputTokens,
      usage.deviceHash,
      new Date().toISOString(),
    )
    .run();
}

/** Model calls a device made on a route (or every route under `route.`) since UTC midnight. */
export async function aiCallsToday(
  db: D1Database,
  deviceHash: string,
  route: string,
): Promise<number> {
  const midnight = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS calls FROM ai_usage
       WHERE device_hash = ? AND created_at >= ? AND (route = ? OR route LIKE ? || '.%')`,
    )
    .bind(deviceHash, midnight, route, route)
    .first<{ calls: number }>();
  return row?.calls ?? 0;
}

/** Turns a device away once it has used a route's daily allowance of model calls. */
export async function requireAiBudget(
  db: D1Database,
  deviceHash: string,
  route: string,
  perDay: number,
): Promise<void> {
  if ((await aiCallsToday(db, deviceHash, route)) >= perDay) {
    throw new ApiError('rate_limited', 'Too many requests today. Try again tomorrow.');
  }
}

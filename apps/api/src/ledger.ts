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

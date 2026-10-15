/** Where the SDK sends a Messages API call (with `?beta=true` for beta calls). */
export const anthropicMessagesUrl = 'https://api.anthropic.com/v1/messages';

/** A recorded Messages API answer whose structured output is `output`. */
export function anthropicAnswer(
  output: unknown,
  {
    stopReason = 'end_turn',
    model = 'claude-haiku-5-5',
    inputTokens = 210,
    outputTokens = 14,
  }: { stopReason?: string; model?: string; inputTokens?: number; outputTokens?: number } = {},
): Response {
  return Response.json({
    id: 'msg_test',
    type: 'message',
    role: 'assistant',
    model,
    content: stopReason === 'refusal' ? [] : [{ type: 'text', text: JSON.stringify(output) }],
    stop_reason: stopReason,
    stop_sequence: null,
    usage: { input_tokens: inputTokens, output_tokens: outputTokens },
  });
}

/** The JSON body of a recorded request. */
export function sentBody(init: RequestInit | undefined): unknown {
  return JSON.parse(typeof init?.body === 'string' ? init.body : 'null');
}

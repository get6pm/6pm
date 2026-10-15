/**
 * What a question with nothing to look up is about. `distress`, `investing` and `unsafe` are
 * answered the same way in every personality: the companion's voice never jokes about them.
 */
export const CHAT_TOPICS = [
  'greeting',
  'thanks',
  'identity',
  'privacy',
  'venting',
  'distress',
  'roast',
  'hype',
  'offTopic',
  'investing',
  'unsafe',
] as const;
export type ChatTopic = (typeof CHAT_TOPICS)[number];

/** Topics answered in one serious voice, whatever personality the companion has. */
export const SERIOUS_TOPICS: ReadonlySet<ChatTopic> = new Set(['distress', 'investing', 'unsafe']);

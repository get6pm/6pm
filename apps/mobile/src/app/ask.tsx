import { useLocalSearchParams } from 'expo-router';

import { AskScreen } from '../features/ask/ask-screen';

/** Ask 6pm. `q` is a question to send as soon as the screen is open. */
export default function Ask() {
  const { q } = useLocalSearchParams<{ q?: string | string[] }>();
  const raw = Array.isArray(q) ? q[0] : q;
  const question = raw !== undefined && raw.trim() !== '' ? raw : null;
  return <AskScreen question={question} />;
}

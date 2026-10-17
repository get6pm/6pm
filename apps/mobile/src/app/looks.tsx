import { useLocalSearchParams } from 'expo-router';

import { isLookId } from '@6pm/theme';

import { LooksFlow } from '../features/looks/looks-flow';

/** The Looks sheet; `look` opens it on that look's try-on. */
export default function Looks() {
  const { look } = useLocalSearchParams<{ look?: string }>();
  return <LooksFlow initial={isLookId(look) ? look : null} />;
}

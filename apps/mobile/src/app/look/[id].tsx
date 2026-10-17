import { Redirect, useLocalSearchParams } from 'expo-router';

import { isLookId } from '@6pm/theme';

/** A look's try-on lives in the Looks sheet: this address opens the sheet on it. */
export default function LookRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={isLookId(id) ? { pathname: '/looks', params: { look: id } } : '/looks'} />;
}

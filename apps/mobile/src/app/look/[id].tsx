import { Redirect, useLocalSearchParams } from 'expo-router';

import { isLookId } from '@6pm/theme';

import { LookDetail } from '../../features/looks/look-detail';

/** A look's try-on sheet. An id that is not a look goes back to the shop. */
export default function LookRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!isLookId(id)) return <Redirect href="/looks" />;
  return <LookDetail look={id} />;
}

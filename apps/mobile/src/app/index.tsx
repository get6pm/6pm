import { Redirect, useLocalSearchParams } from 'expo-router';

import { useDay } from '../data/money-provider';
import { HomeShell } from '../features/home/home-shell';
import { isHomeTab } from '../features/home/home-tabs';

export default function Home() {
  const day = useDay();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  // A phone with no month set up (first launch, or after Delete all data) starts at onboarding.
  if (day === null) return <Redirect href="/onboarding" />;
  return <HomeShell day={day} initialTab={isHomeTab(tab) ? tab : 'today'} />;
}

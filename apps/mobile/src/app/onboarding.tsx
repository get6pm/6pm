import { useLocalSearchParams } from 'expo-router';

import { OnboardingFlow } from '../features/onboarding/onboarding-flow';

/** First launch: sets up the month, then hands over to Home. */
export default function Onboarding() {
  // Development builds can open a step directly (`/onboarding?step=5`) for headless screenshots.
  const { step } = useLocalSearchParams<{ step?: string }>();
  return <OnboardingFlow startStep={__DEV__ && step ? Number(step) : 0} />;
}

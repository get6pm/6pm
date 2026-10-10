import { OnboardingFlow } from '../features/onboarding/onboarding-flow';

/** First launch: sets up the month, then hands over to Home. */
export default function Onboarding() {
  return <OnboardingFlow />;
}

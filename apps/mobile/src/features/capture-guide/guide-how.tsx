import { View } from 'react-native';

import { useI18n } from '../../i18n/i18n';
import type { GuideContent } from './guide-content';
import { MistakesCard, OtherMailCard } from './guide-notes';
import { GuideSection, GuideSteps, type LiveChip } from './guide-sections';
import { isWalked, useWalkthroughSteps, type WalkedSource } from './guide-walkthroughs';
import type { CaptureSource } from './source-status';
import { Walkthrough } from './walkthrough/walkthrough';

/**
 * "How it works": the drawn step-by-step walkthrough for the ways set up in another app, the
 * three short steps for the rest, then whatever that way needs said beside it.
 */
export function HowItWorks({
  source,
  guide,
  addressChip,
  emailAddress,
}: {
  readonly source: CaptureSource;
  readonly guide: GuideContent;
  readonly addressChip: LiveChip | null;
  readonly emailAddress: string | null;
}) {
  const { t } = useI18n();
  if (!isWalked(source)) {
    return (
      <GuideSection title={t('capture.guide.howItWorks')} note={t(guide.time)}>
        <GuideSteps guide={guide} firstChip={addressChip} />
      </GuideSection>
    );
  }
  return <Walked source={source} guide={guide} emailAddress={emailAddress} />;
}

function Walked({
  source,
  guide,
  emailAddress,
}: {
  readonly source: WalkedSource;
  readonly guide: GuideContent;
  readonly emailAddress: string | null;
}) {
  const { t } = useI18n();
  const steps = useWalkthroughSteps(source, emailAddress);
  return (
    <>
      <GuideSection title={t('capture.guide.howItWorks')} note={t(guide.time)}>
        <Walkthrough steps={steps} />
      </GuideSection>

      {source === 'wallet' ? (
        <>
          <GuideSection title={t('capture.walk.mistakes')}>
            <MistakesCard
              items={[
                'capture.walk.wallet.mistake1',
                'capture.walk.wallet.mistake2',
                'capture.walk.wallet.mistake3',
              ]}
            />
          </GuideSection>
          <OtherMailCard
            name="capture.walk.wallet.olderTitle"
            steps={[
              'capture.walk.wallet.older1',
              'capture.walk.wallet.older2',
              'capture.walk.wallet.older3',
              'capture.walk.wallet.older4',
            ]}
          />
        </>
      ) : null}

      {source === 'email' ? (
        <>
          {/*
            The forwarding check goes here: <ForwardingCheckCard /> from the receipt-email feature,
            showing the confirmation code Gmail sent to 6pm (the walkthrough's fourth step).
          */}
          <GuideSection title={t('capture.walk.email.otherTitle')}>
            <View style={{ gap: 12 }}>
              <OtherMailCard
                name="capture.walk.email.outlook"
                steps={[
                  'capture.walk.email.outlook1',
                  'capture.walk.email.outlook2',
                  'capture.walk.email.outlook3',
                ]}
              />
              <OtherMailCard
                name="capture.walk.email.icloud"
                steps={[
                  'capture.walk.email.icloud1',
                  'capture.walk.email.icloud2',
                  'capture.walk.email.icloud3',
                ]}
              />
            </View>
          </GuideSection>
        </>
      ) : null}
    </>
  );
}

import type { StringKey } from '@6pm/i18n';

import { useI18n } from '../../i18n/i18n';
import type { CaptureSource } from './source-status';
import {
  GmailAddAddressFrame,
  GmailForwardingTabFrame,
  GmailSettingsFrame,
} from './walkthrough/gmail-frames-forward';
import { GmailVerifyFrame } from './walkthrough/gmail-frames-verify';
import { GmailFilterFrame, GmailForwardItFrame } from './walkthrough/gmail-frames-filter';
import { ReceiptShareFrame, ShareCardFrame, ShareSheetFrame } from './walkthrough/share-frames';
import { RunShortcutFrame } from './walkthrough/wallet-frames-action';
import { AddShortcutFrame } from './walkthrough/wallet-frames-add';
import { FinishFrame, TestFrame } from './walkthrough/wallet-frames-end';
import { AutomationFrame, WalletTriggerFrame } from './walkthrough/wallet-frames-start';
import type { WalkthroughStep } from './walkthrough/walkthrough';

type WalkKey = Exclude<Extract<StringKey, `capture.walk.${string}`>, 'capture.walk.stepOf'>;

interface StepPlan {
  readonly title: WalkKey;
  readonly detail: WalkKey;
  /** The drawn screen's loop, in milliseconds. */
  readonly loop: number;
  /** The moment held with Reduce Motion: just before the step's tap. */
  readonly still: number;
  readonly frame: WalkthroughStep['frame'];
}

/** The ways that are set up step by step, each with its pictured screens. */
export type WalkedSource = Extract<CaptureSource, 'wallet' | 'email' | 'share'>;

export function isWalked(source: CaptureSource): source is WalkedSource {
  return source === 'wallet' || source === 'email' || source === 'share';
}

/**
 * The Wallet automation as iOS 27 builds it, around the published 6pm shortcut: add that shortcut,
 * then a shortcut with the Wallet trigger at its top that runs it.
 */
const WALLET: readonly StepPlan[] = [
  {
    title: 'capture.walk.wallet.s1Title',
    detail: 'capture.walk.wallet.s1Body',
    loop: 4200,
    still: 0.44,
    frame: (t, s) => <AddShortcutFrame t={t} scale={s.phoneScale} />,
  },
  {
    title: 'capture.walk.wallet.s2Title',
    detail: 'capture.walk.wallet.s2Body',
    loop: 6000,
    still: 0.475,
    frame: (t, s) => <AutomationFrame t={t} scale={s.phoneScale} />,
  },
  {
    title: 'capture.walk.wallet.s3Title',
    detail: 'capture.walk.wallet.s3Body',
    loop: 5600,
    still: 0.525,
    frame: (t, s) => <WalletTriggerFrame t={t} scale={s.phoneScale} />,
  },
  {
    title: 'capture.walk.wallet.s4Title',
    detail: 'capture.walk.wallet.s4Body',
    loop: 7600,
    still: 0.695,
    frame: (t, s) => <RunShortcutFrame t={t} scale={s.phoneScale} />,
  },
  {
    title: 'capture.walk.wallet.s5Title',
    detail: 'capture.walk.wallet.s5Body',
    loop: 5000,
    still: 0.465,
    frame: (t, s) => <FinishFrame t={t} scale={s.phoneScale} />,
  },
  {
    title: 'capture.walk.wallet.s6Title',
    detail: 'capture.walk.wallet.s6Body',
    loop: 5200,
    still: 0.4,
    frame: (t, s) => <TestFrame t={t} scale={s.phoneScale} />,
  },
];

const SHARE: readonly StepPlan[] = [
  {
    title: 'capture.walk.share.s1Title',
    detail: 'capture.walk.share.s1Body',
    loop: 3600,
    still: 0.465,
    frame: (t, s) => <ReceiptShareFrame t={t} scale={s.phoneScale} />,
  },
  {
    title: 'capture.walk.share.s2Title',
    detail: 'capture.walk.share.s2Body',
    loop: 4000,
    still: 0.465,
    frame: (t, s) => <ShareSheetFrame t={t} scale={s.phoneScale} />,
  },
  {
    title: 'capture.walk.share.s3Title',
    detail: 'capture.walk.share.s3Body',
    loop: 4400,
    still: 0.515,
    frame: (t, s) => <ShareCardFrame t={t} scale={s.phoneScale} />,
  },
];

function emailPlan(address: string): readonly StepPlan[] {
  return [
    {
      title: 'capture.walk.email.s1Title',
      detail: 'capture.walk.email.s1Body',
      loop: 4400,
      still: 0.585,
      frame: (t, s) => <GmailSettingsFrame t={t} scale={s.browserScale} address={address} />,
    },
    {
      title: 'capture.walk.email.s2Title',
      detail: 'capture.walk.email.s2Body',
      loop: 4400,
      still: 0.585,
      frame: (t, s) => <GmailForwardingTabFrame t={t} scale={s.browserScale} address={address} />,
    },
    {
      title: 'capture.walk.email.s3Title',
      detail: 'capture.walk.email.s3Body',
      loop: 5600,
      still: 0.385,
      frame: (t, s) => <GmailAddAddressFrame t={t} scale={s.browserScale} address={address} />,
    },
    {
      title: 'capture.walk.email.s4Title',
      detail: 'capture.walk.email.s4Body',
      loop: 5000,
      still: 0.525,
      frame: (t, s) => <GmailVerifyFrame t={t} scale={s.browserScale} address={address} />,
    },
    {
      title: 'capture.walk.email.s5Title',
      detail: 'capture.walk.email.s5Body',
      loop: 5600,
      still: 0.645,
      frame: (t, s) => <GmailFilterFrame t={t} scale={s.browserScale} address={address} />,
    },
    {
      title: 'capture.walk.email.s6Title',
      detail: 'capture.walk.email.s6Body',
      loop: 5200,
      still: 0.625,
      frame: (t, s) => <GmailForwardItFrame t={t} scale={s.browserScale} address={address} />,
    },
  ];
}

/** A way's steps in the app's language; the email frames show the user's own address. */
export function useWalkthroughSteps(
  source: WalkedSource,
  emailAddress: string | null,
): readonly WalkthroughStep[] {
  const { t } = useI18n();
  const plan =
    source === 'wallet'
      ? WALLET
      : source === 'share'
        ? SHARE
        : emailPlan(emailAddress ?? t('capture.email.step1Chip'));
  return plan.map((step, k) => ({
    id: `${source}-${k}`,
    title: t(step.title),
    detail: t(step.detail),
    loop: step.loop,
    still: step.still,
    frame: step.frame,
  }));
}

import type { SpendSource } from '@6pm/domain';
import type { StringKey } from '@6pm/i18n';

import type { SymbolName } from '../../ui/icons/symbols.generated';
import type { CaptureSource } from './source-status';

/** The guide's own words: none of them takes a parameter. */
export type GuideKey = Exclude<
  Extract<StringKey, `capture.${string}`>,
  'capture.last' | 'capture.settings.summary' | 'capture.walk.stepOf'
>;

export interface GuideStep {
  readonly text: GuideKey;
  readonly icon: SymbolName;
  /** The chip's words, or the names it shows as they are (banks are not translated). */
  readonly chip: GuideKey | { readonly names: readonly string[] };
}

/** The example spend under "What lands in your Inbox". */
export interface GuideSample {
  /** A merchant's own name, or words to translate ("Grab ride home"). */
  readonly name: GuideKey | { readonly merchant: string };
  /** A starter category: its tint and glyph come from the user's category of that id. */
  readonly categoryId: string;
  readonly amount: number;
  readonly time: string;
  readonly source: SpendSource;
  readonly pending?: boolean;
}

export interface GuideContent {
  readonly icon: SymbolName;
  readonly hue: number;
  readonly name: GuideKey;
  readonly sub: GuideKey;
  readonly headline: GuideKey;
  readonly time: GuideKey;
  readonly steps: readonly [GuideStep, GuideStep, GuideStep];
  readonly tip: GuideKey;
  readonly sample: GuideSample;
}

/** Each way's guide, as the prototype's capture guides set them out. */
export const GUIDES: Readonly<Record<CaptureSource, GuideContent>> = {
  share: {
    icon: 'ios_share',
    hue: 25,
    name: 'capture.share.name',
    sub: 'capture.share.sub',
    headline: 'capture.share.headline',
    time: 'capture.share.time',
    steps: [
      {
        text: 'capture.share.step1',
        icon: 'account_balance',
        chip: { names: ['MB Bank', 'Vietcombank', 'MoMo'] },
      },
      { text: 'capture.share.step2', icon: 'ios_share', chip: 'capture.share.step2Chip' },
      { text: 'capture.share.step3', icon: 'inbox', chip: 'capture.share.step3Chip' },
    ],
    tip: 'capture.share.tip',
    sample: {
      name: { merchant: 'Circle K' },
      categoryId: 'shopping',
      amount: 120000,
      time: '16:40',
      source: 'shared',
    },
  },
  email: {
    icon: 'alternate_email',
    hue: 250,
    name: 'capture.email.name',
    sub: 'capture.email.sub',
    headline: 'capture.email.headline',
    time: 'capture.email.time',
    steps: [
      { text: 'capture.email.step1', icon: 'content_copy', chip: 'capture.email.step1Chip' },
      { text: 'capture.email.step2', icon: 'forward_to_inbox', chip: 'capture.email.step2Chip' },
      { text: 'capture.email.step3', icon: 'filter_alt', chip: 'capture.email.step3Chip' },
    ],
    tip: 'capture.email.tip',
    sample: {
      name: 'capture.email.sample',
      categoryId: 'transport',
      amount: 38000,
      time: '13:30',
      source: 'email',
    },
  },
  scan: {
    icon: 'qr_code_scanner',
    hue: 60,
    name: 'capture.scan.name',
    sub: 'capture.scan.sub',
    headline: 'capture.scan.headline',
    time: 'capture.scan.time',
    steps: [
      { text: 'capture.scan.step1', icon: 'qr_code_scanner', chip: 'capture.scan.step1Chip' },
      { text: 'capture.scan.step2', icon: 'open_in_new', chip: 'capture.scan.step2Chip' },
      { text: 'capture.scan.step3', icon: 'check_circle', chip: 'capture.scan.step3Chip' },
    ],
    tip: 'capture.scan.tip',
    sample: {
      name: { merchant: 'Phở Hòa' },
      categoryId: 'food',
      amount: 45000,
      time: '12:10',
      source: 'qr',
      pending: true,
    },
  },
  wallet: {
    icon: 'contactless',
    hue: 300,
    name: 'capture.wallet.name',
    sub: 'capture.wallet.subOff',
    headline: 'capture.wallet.headline',
    time: 'capture.wallet.time',
    steps: [
      { text: 'capture.wallet.step1', icon: 'bolt', chip: 'capture.wallet.step1Chip' },
      { text: 'capture.wallet.step2', icon: 'credit_card', chip: 'capture.wallet.step2Chip' },
      { text: 'capture.wallet.step3', icon: 'play_circle', chip: 'capture.wallet.step3Chip' },
    ],
    tip: 'capture.wallet.tip',
    sample: {
      name: { merchant: 'Highlands Coffee' },
      categoryId: 'drinks',
      amount: 59000,
      time: '21:40',
      source: 'applePay',
    },
  },
  widgets: {
    icon: 'widgets',
    hue: 200,
    name: 'capture.widgets.name',
    sub: 'capture.widgets.sub',
    headline: 'capture.widgets.headline',
    time: 'capture.widgets.time',
    steps: [
      { text: 'capture.widgets.step1', icon: 'lock', chip: 'capture.widgets.step1Chip' },
      { text: 'capture.widgets.step2', icon: 'add_box', chip: 'capture.widgets.step2Chip' },
      {
        text: 'capture.widgets.step3',
        icon: 'radio_button_checked',
        chip: 'capture.widgets.step3Chip',
      },
    ],
    tip: 'capture.widgets.tip',
    sample: {
      name: { merchant: 'Trà sữa' },
      categoryId: 'drinks',
      amount: 45000,
      time: '15:05',
      source: 'voice',
    },
  },
};

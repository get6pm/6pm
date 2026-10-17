import type { ActionAnswer, HowToTopic } from '@6pm/domain';

import type { NativeReach } from '../surfaces/native-reach';
import type { AskCard } from './ask-words';
import type { LedgerWordsEnv } from './ask-ledger-words';

/** What a tap on an answer's first button does. Nothing is written before that tap. */
export type PendingAction =
  | {
      readonly kind: 'addSpend';
      readonly amount: number;
      readonly name: string;
      readonly categoryId: string;
    }
  | {
      readonly kind: 'open';
      readonly pathname: '/new-pot' | '/max' | '/capture-guide' | '/quick-add';
      readonly params?: Readonly<Record<string, string>>;
    };

export interface ActionCard {
  readonly card: AskCard;
  readonly pending: PendingAction | null;
}

/** Decided on the phone before the card is worded: where a spend goes, whether a pot fits Free. */
export interface ActionPicks {
  readonly categoryId: string;
  readonly potLocked: boolean;
  /** The native pieces the capture guides need; every one of them when left out. */
  readonly reach?: GuideReach;
}

/** The capture ways that need a native piece, and whether this phone has it. */
export type GuideReach = Pick<NativeReach, 'share' | 'scan' | 'wallet' | 'widgets'>;

const FULL_REACH: GuideReach = { share: true, scan: true, wallet: true, widgets: true };

/**
 * The guide a phone without a way's native piece is shown instead: a receipt picture is chosen in
 * Scan, and a card's receipts come by email. Widgets have no stand-in; Quick add is offered.
 */
const STAND_IN: Readonly<Partial<Record<keyof GuideReach, string>>> = {
  share: 'scan',
  wallet: 'email',
};

function needsReach(guide: string): guide is keyof GuideReach {
  return guide in FULL_REACH;
}

/** The guide to open on this phone, or null when it has neither the way nor a stand-in. */
function guideOn(guide: string, reach: GuideReach): string | null {
  if (!needsReach(guide) || reach[guide]) return guide;
  const standIn = STAND_IN[guide];
  if (standIn === undefined) return null;
  return !needsReach(standIn) || reach[standIn] ? standIn : null;
}

type Say = (key: string, params?: Readonly<Record<string, string | number>>) => string;

/** How-tos that a guide shows step by step. */
const GUIDED: Partial<Record<HowToTopic, string>> = {
  share: 'share',
  email: 'email',
  scan: 'scan',
  wallet: 'wallet',
  widgets: 'widgets',
  ways: 'share',
};

function card(text: string, mood: AskCard['mood'], buttons: AskCard['actions'] = []): AskCard {
  return { text, mood, bars: null, rows: [], note: null, actions: buttons };
}

/**
 * An answer that offers to do something: add a spend, set up a pot, open a guide. The first
 * button does it, the second leaves things as they are.
 */
export function describeAction(
  answer: ActionAnswer,
  env: LedgerWordsEnv,
  picks: ActionPicks,
): ActionCard {
  const say = env.t as unknown as Say;
  const short = (amount: number) => env.money.short(amount);
  const yesNo = (yes: string) => [
    { id: 'go' as const, label: say(yes), primary: true },
    { id: 'cancel' as const, label: say('ask.action.notNow'), primary: false },
  ];
  switch (answer.kind) {
    case 'confirmSpend': {
      const text = say('ask.action.confirmSpend', {
        name: answer.name,
        amount: env.money.full(answer.amount),
        category: env.categoryName(picks.categoryId),
      });
      return {
        card: card(text, 'think', yesNo('ask.action.add')),
        pending: {
          kind: 'addSpend',
          amount: answer.amount,
          name: answer.name,
          categoryId: picks.categoryId,
        },
      };
    }
    case 'confirmPot': {
      if (picks.potLocked) {
        return {
          card: card(say('ask.action.potLocked'), 'think', yesNo('ask.action.seeMax')),
          pending: { kind: 'open', pathname: '/max', params: { from: 'pots' } },
        };
      }
      const values = { name: answer.name, goal: short(answer.goal) };
      const text =
        answer.neededBy === null
          ? say('ask.action.confirmPot', values)
          : say('ask.action.confirmPotBy', { ...values, month: env.monthLong(answer.neededBy) });
      const params: Record<string, string> = { name: answer.name, goal: String(answer.goal) };
      if (answer.neededBy !== null) params['by'] = answer.neededBy;
      return {
        card: card(text, 'happy', yesNo('ask.action.setUp')),
        pending: { kind: 'open', pathname: '/new-pot', params },
      };
    }
    case 'potGoal':
      return {
        card: card(say('ask.action.potGoal', { name: answer.name }), 'think'),
        pending: null,
      };
    case 'howTo': {
      const { topic } = answer;
      const guide = GUIDED[topic];
      if (guide !== undefined) {
        const text = topic === 'ways' ? say('ask.howTo.ways') : say(`capture.${topic}.headline`);
        const shown = guideOn(guide, picks.reach ?? FULL_REACH);
        if (shown === null) {
          return {
            card: card(text, 'think', [
              { id: 'go', label: say('ask.action.openQuickAdd'), primary: true },
            ]),
            pending: { kind: 'open', pathname: '/quick-add' },
          };
        }
        return {
          card: card(text, 'think', [{ id: 'go', label: say('ask.action.showMe'), primary: true }]),
          pending: { kind: 'open', pathname: '/capture-guide', params: { source: shown } },
        };
      }
      if (topic === 'quickAdd') {
        return {
          card: card(say('ask.howTo.quickAdd'), 'think', [
            { id: 'go', label: say('ask.action.openQuickAdd'), primary: true },
          ]),
          pending: { kind: 'open', pathname: '/quick-add' },
        };
      }
      return { card: card(say(`ask.howTo.${topic}`), 'think'), pending: null };
    }
  }
}

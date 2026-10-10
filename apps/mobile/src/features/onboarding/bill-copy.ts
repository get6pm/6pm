import type { I18n } from '../../i18n/i18n';
import type { AskKey, BillCard, BillOption, MultiKey } from './bill-deck';

const ASK_COPY = {
  rent: {
    name: 'onboarding.bills.rent.name',
    q: 'onboarding.bills.rent.q',
    sub: 'onboarding.bills.rent.sub',
  },
  power: {
    name: 'onboarding.bills.power.name',
    q: 'onboarding.bills.power.q',
    sub: 'onboarding.bills.power.sub',
  },
  phone: {
    name: 'onboarding.bills.phone.name',
    q: 'onboarding.bills.phone.q',
    sub: 'onboarding.bills.phone.sub',
  },
} as const satisfies Record<AskKey, unknown>;

const MULTI_COPY = {
  subs: { q: 'onboarding.bills.subs.q', sub: 'onboarding.bills.subs.sub' },
  other: { q: 'onboarding.bills.other.q', sub: 'onboarding.bills.other.sub' },
} as const satisfies Record<MultiKey, unknown>;

const OPTION_COPY = {
  gym: 'onboarding.bills.gym',
  insurance: 'onboarding.bills.insurance',
  instalment: 'onboarding.bills.instalment',
  family: 'onboarding.bills.family',
  tuition: 'onboarding.bills.tuition',
  parking: 'onboarding.bills.parking',
} as const;

function isOptionWithCopy(id: string): id is keyof typeof OPTION_COPY {
  return id in OPTION_COPY;
}

/** A picked option's name: the brand as it is, or the user's word for it. */
export function optionLabel({ t }: I18n, option: BillOption): string {
  if (option.brand) return option.brand;
  return isOptionWithCopy(option.id) ? t(OPTION_COPY[option.id]) : option.id;
}

/** The question and its line on a card. */
export function cardCopy({ t }: I18n, card: BillCard): { q: string; sub: string } {
  const copy = card.kind === 'ask' ? ASK_COPY[card.key] : MULTI_COPY[card.key];
  return { q: t(copy.q), sub: t(copy.sub) };
}

/** What a bill is called: "Rent", "Spotify", "Gym". */
export function billName(i18n: I18n, card: BillCard, option?: BillOption): string {
  if (option) return optionLabel(i18n, option);
  return card.kind === 'ask' ? i18n.t(ASK_COPY[card.key].name) : '';
}

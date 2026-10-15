import { siteCopyEn } from './copy-en';
import { siteCopyVi } from './copy-vi';

export type SiteLang = 'en' | 'vi';

/** One spend as the phone and the day's timeline show it: name, where it came from, amount. */
export type SpendLine = readonly [name: string, source: string, amount: string];

/** Everything the home page says in one language. Amounts are written out, in that market's money. */
export interface SiteCopy {
  readonly meta: { readonly title: string; readonly description: string };
  readonly nav: {
    readonly ritual: string;
    readonly capture: string;
    readonly privacy: string;
    readonly pricing: string;
    readonly wait: string;
    readonly store: string;
    readonly langLabel: string;
  };
  readonly hero: {
    readonly kickWait: string;
    readonly kickStore: string;
    readonly a: string;
    readonly b: string;
    readonly sub: string;
  };
  readonly cta: {
    readonly wait: string;
    readonly store: string;
    readonly emailPh: string;
    readonly emailLabel: string;
    readonly note: string;
  };
  readonly phone: {
    readonly date: string;
    readonly safe: string;
    readonly num: string;
    readonly inbox: string;
    readonly swipe: string;
    readonly items: readonly [SpendLine, SpendLine, SpendLine];
    /** The third spend's icon: a taxi where the ride is a car, a motorbike where it is a bike. */
    readonly rideIcon: string;
  };
  readonly ritual: {
    readonly kicker: string;
    readonly title: string;
    readonly tomorrow: string;
    readonly num: string;
    readonly dayAmounts: readonly string[];
    readonly caps: readonly (readonly [time: string, text: string])[];
  };
  readonly capture: {
    readonly kicker: string;
    readonly title: string;
    readonly sub: string;
    readonly labels: readonly string[];
    readonly icons: readonly string[];
    /** Shown only where the bank strip runs; empty hides it. */
    readonly bankStrip: string;
  };
  readonly number: {
    readonly kicker: string;
    readonly title: string;
    readonly barIn: string;
    readonly bars: readonly [string, string, string, string];
    readonly today: string;
  };
  readonly beliefs: { readonly kicker: string; readonly phrases: readonly string[] };
  readonly ai: {
    readonly kicker: string;
    readonly title: string;
    readonly sub: string;
    readonly askLabel: string;
    readonly q: string;
    readonly a: string;
    readonly old: string;
    readonly new: string;
    readonly perDay: string;
    readonly scanLabel: string;
    readonly receipt: readonly [string, string, string];
    readonly receiptTotal: string;
    readonly shop: string;
    readonly category: string;
    readonly scanNote: string;
  };
  readonly privacy: {
    readonly kicker: string;
    readonly title: string;
    readonly chips: readonly [string, string, string, string];
    readonly link: string;
    /** The privacy policy's section on what leaves the phone. */
    readonly linkHref: string;
  };
  readonly openSource: { readonly kicker: string; readonly title: string; readonly sub: string };
  readonly together: {
    readonly kicker: string;
    readonly title: string;
    readonly sub: string;
    readonly you: string;
    readonly youInitial: string;
    readonly partner: string;
    readonly partnerInitial: string;
    readonly jar: string;
  };
  readonly pricing: {
    readonly title: string;
    readonly monthly: string;
    readonly yearly: string;
    readonly freeName: string;
    readonly zero: string;
    readonly freeFor: string;
    readonly free: readonly string[];
    readonly trial: string;
    readonly priceMonth: string;
    readonly priceYear: string;
    readonly perMonth: string;
    readonly perYear: string;
    readonly max: readonly string[];
  };
  readonly faq: {
    readonly title: string;
    readonly items: readonly (readonly [question: string, answer: string])[];
  };
  readonly final: { readonly a: string; readonly b: string; readonly storeKicker: string };
  readonly foot: {
    readonly tag: string;
    readonly openSource: string;
    readonly madeBy: string;
    readonly privacy: string;
    readonly terms: string;
  };
}

export const siteCopy: Readonly<Record<SiteLang, SiteCopy>> = { en: siteCopyEn, vi: siteCopyVi };

/** The home page in each language, as site paths. */
export const homePath: Readonly<Record<SiteLang, string>> = { en: '/', vi: '/vi' };

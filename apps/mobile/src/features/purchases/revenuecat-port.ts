import { Platform } from 'react-native';
import Purchases, {
  PRODUCT_CATEGORY,
  type CustomerInfo,
  type PurchasesStoreProduct,
} from 'react-native-purchases';

import {
  LOOK_PRODUCT_IDS,
  MAX_PLANS,
  MAX_PRODUCTS,
  daysOfPeriod,
  lookOfProduct,
  maxPlanOfProduct,
  type MaxPlan,
  type PaidLookId,
} from './products';
import {
  unavailablePurchases,
  type LookOffer,
  type MaxOffer,
  type Offerings,
  type PurchaseOutcome,
  type PurchasesPort,
} from './purchases-port';
import { customerFromStore } from './revenuecat-customer';

// RevenueCat behind the port. Unit tests cover the mapping in revenuecat-customer.ts; this file
// runs only in a native build with products in the store.

const DAYS_IN: Readonly<Record<string, number>> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/**
 * The free trial the store lists on a product, in days; null when it has none. Google Play lists
 * it as the default offer's free phase; the App Store as an intro price of nothing.
 */
function trialDaysOf(product: PurchasesStoreProduct): number | null {
  const free = product.defaultOption?.freePhase;
  if (free) {
    const days = daysOfPeriod(free.billingPeriod.iso8601);
    return days === null ? null : days * Math.max(1, free.billingCycleCount ?? 1);
  }
  const intro = product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const perUnit = DAYS_IN[intro.periodUnit];
  return perUnit === undefined ? null : perUnit * intro.periodNumberOfUnits * intro.cycles;
}

/**
 * Which of the products this person can still take the free trial on. A product carries its
 * trial whoever asks, so the App Store is asked about the person; anything but a clear yes is a
 * no. Google Play only offers a trial to someone who can take it, so there a listed trial is open.
 */
async function trialsOpenFor(
  products: readonly PurchasesStoreProduct[],
): Promise<ReadonlySet<string>> {
  if (Platform.OS === 'android') {
    return new Set(products.filter((p) => p.defaultOption?.freePhase).map((p) => p.identifier));
  }
  const productIds = products.map((p) => p.identifier);
  try {
    const answers = await Purchases.checkTrialOrIntroductoryPriceEligibility(productIds);
    return new Set(
      productIds.filter(
        (id) =>
          answers[id]?.status ===
          Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE,
      ),
    );
  } catch {
    return new Set();
  }
}

function cancelledByUser(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'userCancelled' in error
    ? error.userCancelled === true
    : false;
}

let configured = false;

/**
 * The store on a real phone. With no public SDK key the SDK is never configured and the port
 * reports that purchases are unavailable.
 */
export function revenueCatPurchases(apiKey: string | undefined): PurchasesPort {
  if (!apiKey) return unavailablePurchases;
  if (!configured) {
    try {
      Purchases.configure({ apiKey });
      configured = true;
    } catch {
      return unavailablePurchases;
    }
  }
  const products = new Map<string, PurchasesStoreProduct>();

  const load = async (ids: readonly string[], category: PRODUCT_CATEGORY) => {
    const found = await Purchases.getProducts([...ids], category);
    for (const product of found) products.set(product.identifier, product);
    return found;
  };

  return {
    available: true,
    offerings: async (): Promise<Offerings> => {
      const subscriptions = MAX_PLANS.map((plan) => MAX_PRODUCTS[plan]);
      const [plans, singles] = await Promise.all([
        load(subscriptions, PRODUCT_CATEGORY.SUBSCRIPTION),
        load(LOOK_PRODUCT_IDS, PRODUCT_CATEGORY.NON_SUBSCRIPTION),
      ]);
      const open = await trialsOpenFor(plans);
      const looks: Partial<Record<PaidLookId, LookOffer>> = {};
      for (const product of singles) {
        const look = lookOfProduct(product.identifier);
        if (look) looks[look] = { productId: product.identifier, priceText: product.priceString };
      }
      const max: Partial<Record<MaxPlan, MaxOffer>> = {};
      for (const product of plans) {
        const plan = maxPlanOfProduct(product.identifier);
        if (!plan) continue;
        max[plan] = {
          plan,
          productId: product.identifier,
          priceText: product.priceString,
          price: product.price,
          perMonthText: product.pricePerMonthString,
          perMonth: product.pricePerMonth,
          trialDays: open.has(product.identifier) ? trialDaysOf(product) : null,
        };
      }
      if (Object.keys(looks).length === 0 && Object.keys(max).length === 0) {
        throw new Error('The store listed none of the 6pm products');
      }
      return { looks, max };
    },
    purchase: async (productId): Promise<PurchaseOutcome> => {
      try {
        const product =
          products.get(productId) ??
          (
            await load(
              [productId],
              maxPlanOfProduct(productId) !== null
                ? PRODUCT_CATEGORY.SUBSCRIPTION
                : PRODUCT_CATEGORY.NON_SUBSCRIPTION,
            )
          )[0];
        if (!product) return { kind: 'failed' };
        const { customerInfo } = await Purchases.purchaseStoreProduct(product);
        return { kind: 'purchased', customer: customerFromStore(customerInfo) };
      } catch (error) {
        return cancelledByUser(error) ? { kind: 'cancelled' } : { kind: 'failed' };
      }
    },
    restore: async () => customerFromStore(await Purchases.restorePurchases()),
    customer: async () => customerFromStore(await Purchases.getCustomerInfo()),
    manageSubscriptions: () => Purchases.showManageSubscriptions(),
    onCustomerChange: (listener) => {
      const heard = (info: CustomerInfo) => listener(customerFromStore(info));
      Purchases.addCustomerInfoUpdateListener(heard);
      return () => void Purchases.removeCustomerInfoUpdateListener(heard);
    },
  };
}

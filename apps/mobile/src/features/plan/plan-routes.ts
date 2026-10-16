import type { Href } from 'expo-router';

/** The Plan tab's sheets. Cast because the generated route types only list a route once built. */
export const planRoutes = {
  month: '/month' as Href,
  sincePayday: '/since-payday' as Href,
  newGoal: '/new-pot?kind=goal' as Href,
  newBill: '/bill/new' as Href,
  bill: (id: string) => `/bill/${id}` as Href,
  pot: (id: string) => `/pot/${id}` as Href,
};

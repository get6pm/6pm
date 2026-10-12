import { createContext, use, type ReactNode } from 'react';

import type { CompanionForm } from './companion-mood';

const CompanionFormContext = createContext<CompanionForm>('base');

/** The form every companion below draws in unless it is told one: Max for members. */
export function CompanionFormProvider({
  form,
  children,
}: {
  readonly form: CompanionForm;
  readonly children: ReactNode;
}) {
  return <CompanionFormContext value={form}>{children}</CompanionFormContext>;
}

export function useCompanionForm(): CompanionForm {
  return use(CompanionFormContext);
}

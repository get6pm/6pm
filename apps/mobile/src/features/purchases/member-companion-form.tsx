import type { ReactNode } from 'react';

import { CompanionFormProvider } from '../../ui/companion/companion-form';
import type { CompanionForm } from '../../ui/companion/companion-mood';
import { usePinnedCompanionForm } from '../dev/dev-companion-form';
import { companionForm } from './entitlement';
import { useEntitlement } from './purchases-provider';

/** The form the companion takes for this customer: Max while Max is on. */
export function useMemberCompanionForm(): CompanionForm {
  const { customer } = useEntitlement();
  const pinned = usePinnedCompanionForm();
  return (__DEV__ ? pinned : null) ?? companionForm(customer);
}

/** Every companion drawn below wears the member's form. */
export function MemberCompanionForm({ children }: { readonly children: ReactNode }) {
  return <CompanionFormProvider form={useMemberCompanionForm()}>{children}</CompanionFormProvider>;
}

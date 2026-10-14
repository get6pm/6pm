import type { ReactNode } from 'react';

import { CompanionFormProvider } from '../../ui/companion/companion-form';
import type { CompanionForm } from '../../ui/companion/companion-mood';
import {
  CompanionSettingsProvider,
  useCompanionSettings,
} from '../companion/companion-settings-provider';
import { usePinnedCompanionForm } from '../dev/dev-companion-form';
import { resolveCompanion } from './entitlement';
import { FREE_CUSTOMER } from './purchases-port';
import { useEntitlement } from './purchases-provider';

/** The companion this customer wears: their pick while it is theirs, else the automatic one. */
export function useMemberCompanionForm(): CompanionForm {
  const { customer } = useEntitlement();
  const settings = useCompanionSettings();
  const pinned = usePinnedCompanionForm();
  return (__DEV__ ? pinned : null) ?? resolveCompanion(settings, customer);
}

/** The companion this customer wore without Max: where the welcome's companion turns from. */
export function useCompanionBeforeMax(): CompanionForm {
  return resolveCompanion(useCompanionSettings(), FREE_CUSTOMER);
}

function WornForm({ children }: { readonly children: ReactNode }) {
  return <CompanionFormProvider form={useMemberCompanionForm()}>{children}</CompanionFormProvider>;
}

/** Every companion drawn below wears the customer's companion. */
export function MemberCompanionForm({ children }: { readonly children: ReactNode }) {
  return (
    <CompanionSettingsProvider>
      <WornForm>{children}</WornForm>
    </CompanionSettingsProvider>
  );
}

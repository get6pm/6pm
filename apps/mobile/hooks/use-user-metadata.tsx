import { useUser } from '@clerk/clerk-expo'

export function useUserMetadata() {
  const { user } = useUser()

  async function setOnboardedAt(onboardedAt: string | undefined) {
    return user?.update({
      unsafeMetadata: {
        ...(user?.unsafeMetadata ?? {}),
        onboardedAt,
      },
    })
  }

  async function setDefaultBudgetId(defaultBudgetId: string | undefined) {
    return user?.update({
      unsafeMetadata: {
        ...(user?.unsafeMetadata ?? {}),
        defaultBudgetId,
      },
    })
  }

  return {
    onboardedAt: user?.unsafeMetadata?.onboardedAt,
    defaultBudgetId: user?.unsafeMetadata?.defaultBudgetId,
    setOnboardedAt,
    setDefaultBudgetId,
  }
}

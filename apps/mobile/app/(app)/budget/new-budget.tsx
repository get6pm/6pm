import { BudgetForm } from '@/components/budget/budget-form'
import { useUserMetadata } from '@/hooks/use-user-metadata'
import { useCreateBudget } from '@/stores/budget/hooks'
import type { BudgetFormValues } from '@6pm/validation'
import { createId } from '@paralleldrive/cuid2'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import { useRouter } from 'expo-router'
import { View } from 'react-native'

export default function CreateBudgetScreen() {
  const budgetId = createId()
  const router = useRouter()
  const { mutateAsync } = useCreateBudget()
  const { sideOffset, ...rootProps } = useModalPortalRoot()
  const { setDefaultBudgetId } = useUserMetadata()

  const handleCreate = async ({ isDefault, ...data }: BudgetFormValues) => {
    if (isDefault) {
      await setDefaultBudgetId(budgetId)
    }

    mutateAsync({
      data: {
        ...data,
        period: {
          ...data.period,
          id: createId(),
        },
      },
      id: budgetId,
    }).catch(() => {
      // ignore
    })
    router.back()
  }

  return (
    <View className="bg-card" {...rootProps}>
      <BudgetForm onSubmit={handleCreate} sideOffset={sideOffset} />
      <PortalHost name="budget-form" />
    </View>
  )
}

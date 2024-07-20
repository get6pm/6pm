import { BudgetForm } from '@/components/budget/budget-form'
import { useCreateBudget } from '@/stores/budget/hooks'
import type { BudgetFormValues } from '@6pm/validation'
import { createId } from '@paralleldrive/cuid2'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import { useRouter } from 'expo-router'
import { View } from 'react-native'

export default function CreateBudgetScreen() {
  const router = useRouter()
  const { mutateAsync } = useCreateBudget()
  const { sideOffset, ...rootProps } = useModalPortalRoot()

  const handleCreate = async (data: BudgetFormValues) => {
    mutateAsync({
      data: {
        ...data,
        period: {
          ...data.period,
          id: createId(),
        },
      },
      id: createId(),
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

import { BudgetForm } from '@/components/budget/budget-form'
import { Button } from '@/components/ui/button'
import { useUserMetadata } from '@/hooks/use-user-metadata'
import {
  useBudget,
  useDeleteBudget,
  useUpdateBudget,
} from '@/stores/budget/hooks'
import { type BudgetFormValues, BudgetPeriodTypeSchema } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PortalHost, useModalPortalRoot } from '@rn-primitives/portal'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { first, orderBy } from 'lodash-es'
import { Trash2Icon } from 'lucide-react-native'
import { useEffect } from 'react'
import { Alert, View } from 'react-native'

export default function EditBudgetScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { i18n } = useLingui()
  const { budgetId } = useLocalSearchParams<{ budgetId: string }>()
  const { budget } = useBudget(budgetId!)
  const { mutateAsync } = useUpdateBudget()
  const { mutateAsync: mutateDelete } = useDeleteBudget()
  const { setDefaultBudgetId, defaultBudgetId } = useUserMetadata()
  const { sideOffset, ...rootProps } = useModalPortalRoot()

  useEffect(() => {
    navigation.setOptions({
      title: budget?.name,
      headerRight: () => (
        <Button
          size="icon"
          variant="ghost"
          onPress={() =>
            Alert.alert(
              t(
                i18n,
              )`Are you sure you want to delete this budget? This action cannot be undone.`,
              '',
              [
                {
                  text: t(i18n)`Cancel`,
                  style: 'cancel',
                },
                {
                  text: t(i18n)`Delete`,
                  style: 'destructive',
                  onPress: () => {
                    mutateDelete(budget?.id as string)
                    router.replace('/budgets')
                  },
                },
              ],
            )
          }
        >
          <Trash2Icon className="size-6 text-primary" />
        </Button>
      ),
    })
  }, [navigation, budget, mutateDelete, router, i18n])

  const latestPeriodConfig = first(
    orderBy(budget?.periodConfigs, 'startDate', 'desc'),
  )

  const handleUpdate = async ({ isDefault, ...data }: BudgetFormValues) => {
    if (isDefault) {
      await setDefaultBudgetId(budget?.id)
    }
    mutateAsync({
      data: data,
      id: budget?.id!,
    }).catch(() => {
      // ignore
    })
    router.back()
  }

  return (
    <View className="bg-card" {...rootProps}>
      <BudgetForm
        onSubmit={handleUpdate}
        sideOffset={sideOffset}
        defaultValues={{
          name: budget?.name,
          description: budget?.description ?? '',
          preferredCurrency: budget?.preferredCurrency,
          type: budget?.type,
          id: budget?.id,
          period: {
            id: latestPeriodConfig?.id,
            type:
              latestPeriodConfig?.type || BudgetPeriodTypeSchema.Enum.MONTHLY,
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            amount: latestPeriodConfig?.amount as any,
            startDate: latestPeriodConfig?.startDate ?? undefined,
            endDate: latestPeriodConfig?.endDate ?? undefined,
          },
          isDefault: defaultBudgetId === budget?.id,
        }}
      />
      <PortalHost name="budget-form" />
    </View>
  )
}

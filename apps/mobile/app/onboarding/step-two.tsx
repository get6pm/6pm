import { SubmitButton } from '@/components/form-fields/submit-button'
import { NumericPad } from '@/components/numeric-pad'
import { TransactionAmount } from '@/components/transaction/transaction-form'
import { Text } from '@/components/ui/text'
import { useCreateBudget } from '@/stores/budget/hooks'
import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { BudgetPeriodTypeSchema, BudgetTypeSchema } from '@6pm/validation'
import { useUser } from '@clerk/clerk-expo'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { createId } from '@paralleldrive/cuid2'
import * as Haptics from 'expo-haptics'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import {
  Controller,
  FormProvider,
  type UseFormReturn,
  useForm,
  useWatch,
} from 'react-hook-form'
import { ScrollView, View } from 'react-native'
import { z } from 'zod'

const zOnboardBudgetForm = z.object({
  amount: z.number(),
  currency: z.string(),
})

type OnboardBudgetFormValues = z.infer<typeof zOnboardBudgetForm>

export function FormSubmitButton({
  form,
  onSubmit,
}: {
  form: UseFormReturn<OnboardBudgetFormValues>
  onSubmit: (data: OnboardBudgetFormValues) => void
}) {
  const { i18n } = useLingui()
  const amount = useWatch({ name: 'amount' })

  return (
    <SubmitButton
      onPress={form.handleSubmit(onSubmit)}
      onPressIn={Haptics.selectionAsync}
      disabled={form.formState.isLoading || !amount}
      className="m-2 self-end"
    >
      <Text>{t(i18n)`Set Budget`}</Text>
    </SubmitButton>
  )
}

const budgetId = createId()
const periodId = createId()

export default function StepTwoScreen() {
  const { i18n } = useLingui()
  const defaultCurrency = useDefaultCurrency()
  const { mutateAsync } = useCreateBudget()
  const { user } = useUser()
  const router = useRouter()

  const form = useForm<OnboardBudgetFormValues>({
    resolver: zodResolver(zOnboardBudgetForm),
    defaultValues: {
      amount: 0,
      currency: defaultCurrency,
    },
  })

  async function handleSubmit(data: OnboardBudgetFormValues) {
    await mutateAsync({
      data: {
        name: t(i18n)`Monthly budget`,
        description: '',
        preferredCurrency: data.currency,
        type: BudgetTypeSchema.Enum.SPENDING,
        period: {
          id: periodId,
          amount: data.amount,
          type: BudgetPeriodTypeSchema.Enum.MONTHLY,
        },
      },
      id: budgetId,
    }).catch(() => {
      // ignore
    })

    await user?.update({
      unsafeMetadata: {
        onboardedAt: new Date().toISOString(),
      },
    })

    const { status: existingStatus } = await Notifications.getPermissionsAsync()

    if (existingStatus === 'granted') {
      router.replace('/')
    } else {
      router.push('/onboarding/step-three')
    }
  }

  return (
    <FormProvider {...form}>
      <ScrollView
        className="bg-card"
        contentContainerClassName="gap-4 pt-4 flex-1 bg-muted justify-between"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4 px-8">
          <Text className="font-sans font-semibold text-3xl text-primary">
            {t(i18n)`Set your monthly spending goal`}
          </Text>
          <Text className="font-sans text-muted-foreground">
            {t(
              i18n,
            )`If you're not sure, start with how much you usually spend per month.`}
          </Text>
        </View>
        <View className="h-24 w-full items-center justify-end gap-2">
          <TransactionAmount />
          <Text className="font-sans text-muted-foreground">
            {t(i18n)`* you can always change this later.`}
          </Text>
        </View>
        <View>
          <FormSubmitButton form={form} onSubmit={handleSubmit} />
          <Controller
            name="amount"
            control={form.control}
            render={({ field: { onChange, value } }) => (
              <NumericPad value={value} onValueChange={onChange} />
            )}
          />
        </View>
      </ScrollView>
    </FormProvider>
  )
}

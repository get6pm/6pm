import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import {
  type BudgetFormValues,
  BudgetPeriodTypeSchema,
  BudgetTypeSchema,
  zBudgetFormValues,
} from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Haptics from 'expo-haptics'
import { useRef } from 'react'
import {
  Controller,
  FormProvider,
  type UseFormReturn,
  useForm,
  useWatch,
} from 'react-hook-form'
import { ScrollView } from 'react-native'
import type { TextInput } from 'react-native'
import { BooleanField } from '../form-fields/boolean-field'
import { CurrencyField } from '../form-fields/currency-field'
import { InputField } from '../form-fields/input-field'
import { SubmitButton } from '../form-fields/submit-button'
import { Text } from '../ui/text'
import { PeriodRangeField } from './period-range-field'

type BudgetFormProps = {
  onSubmit: (data: BudgetFormValues) => void
  defaultValues?: Partial<BudgetFormValues>
  sideOffset?: number
}

function BudgetSubmitButton({
  form,
  onSubmit,
}: {
  form: UseFormReturn<BudgetFormValues>
  onSubmit: (data: BudgetFormValues) => void
}) {
  const { i18n } = useLingui()
  const amount = useWatch({ name: 'period.amount' })

  return (
    <SubmitButton
      onPress={form.handleSubmit(onSubmit)}
      onPressIn={Haptics.selectionAsync}
      disabled={form.formState.isLoading || !amount}
    >
      <Text>{t(i18n)`Save`}</Text>
    </SubmitButton>
  )
}

export const BudgetForm = ({
  onSubmit,
  defaultValues,
  // sideOffset,
}: BudgetFormProps) => {
  const { i18n } = useLingui()
  const nameInputRef = useRef<TextInput>(null)
  const amountInputRef = useRef<TextInput>(null)
  const defaultCurrency = useDefaultCurrency()

  const budgetForm = useForm<BudgetFormValues>({
    resolver: zodResolver(zBudgetFormValues),
    defaultValues: {
      name: '',
      description: '',
      preferredCurrency: defaultCurrency,
      type: BudgetTypeSchema.Enum.SPENDING,
      ...defaultValues,
      period: {
        type: BudgetPeriodTypeSchema.Enum.MONTHLY,
        ...defaultValues?.period,
      },
    },
  })

  return (
    <FormProvider {...budgetForm}>
      <ScrollView
        contentContainerClassName="flex flex-1 gap-4 py-3 px-6"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* <Controller
          name="type"
          control={budgetForm.control}
          disabled
          render={({ field: { onChange, value, disabled } }) => (
            <View className="gap-1">
              <Label nativeID={`label-type`}>{t(i18n)`Type`}</Label>
              <SelectBudgetTypeField
                value={value}
                sideOffset={sideOffset}
                onSelect={(type) => {
                  onChange(type)
                  nameInputRef.current?.focus()
                }}
                disabled={disabled}
              />
            </View>
          )}
        /> */}
        <InputField
          ref={nameInputRef}
          name="name"
          label={t(i18n)`Name`}
          placeholder={t(i18n)`Family budget`}
          disabled={budgetForm.formState.isLoading}
          onSubmitEditing={() => amountInputRef.current?.focus()}
          autoFocus
        />
        <InputField
          ref={amountInputRef}
          name="period.amount"
          label={t(i18n)`Target`}
          placeholder={t(i18n)`0.00`}
          className="!pl-[62px]"
          keyboardType="numeric"
          leftSection={
            <Controller
              name="preferredCurrency"
              control={budgetForm.control}
              render={({ field: { onChange, value } }) => (
                <CurrencyField
                  value={value}
                  onChange={(selected) => {
                    onChange(selected)
                    amountInputRef.current?.focus()
                  }}
                />
              )}
            />
          }
        />
        {/* <Controller
          name="period.type"
          control={budgetForm.control}
          disabled
          render={({ field: { onChange, value, disabled } }) => (
            <View className="gap-1">
              <Label nativeID={`label-period-type`}>{t(i18n)`Period`}</Label>
              <SelectPeriodTypeField
                value={value}
                sideOffset={sideOffset}
                onSelect={(type) => {
                  onChange(type)
                }}
                disabled={disabled}
              />
            </View>
          )}
        /> */}

        <PeriodRangeField />

        <BooleanField name="isDefault" label={t(i18n)`Set as default`} />

        <BudgetSubmitButton form={budgetForm} onSubmit={onSubmit} />
      </ScrollView>
    </FormProvider>
  )
}

import type { TransactionFormValues } from '@6pm/validation'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Haptics from 'expo-haptics'
import { ScanTextIcon, Trash2Icon, XIcon } from 'lucide-react-native'
import {
  Controller,
  FormProvider,
  type UseFormReturn,
  useWatch,
} from 'react-hook-form'
import { ScrollView, View } from 'react-native'
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { DatePicker } from '../common/date-picker'
import { InputField } from '../form-fields/input-field'
import { SubmitButton } from '../form-fields/submit-button'
import { NumericPad } from '../numeric-pad'
import { TextTicker } from '../text-ticker'
import { Button } from '../ui/button'
import { Text } from '../ui/text'
import { SelectAccountField } from './select-account-field'
import { SelectBudgetField } from './select-budget-field'
import { SelectCategoryField } from './select-category-field'

type TransactionFormProps = {
  onSubmit: (data: TransactionFormValues) => void
  onCancel?: () => void
  onDelete?: () => void
  onOpenScanner?: () => void
  form: UseFormReturn<TransactionFormValues>
  sideOffset?: number
}

function TransactionAmount() {
  const [amount, currency] = useWatch({ name: ['amount', 'currency'] })
  return (
    <TextTicker
      value={amount}
      className="font-semibold text-6xl text-foreground leading-tight text-center"
      suffix={currency}
      suffixClassName="font-semibold ml-2 text-muted-foreground overflow-visible"
    />
  )
}

function FormSubmitButton({
  form,
  onSubmit,
}: {
  form: UseFormReturn<TransactionFormValues>
  onSubmit: (data: TransactionFormValues) => void
}) {
  const { i18n } = useLingui()
  const amount = useWatch({ name: 'amount' })

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

export const TransactionForm = ({
  form,
  onSubmit,
  onCancel,
  onDelete,
  onOpenScanner,
  sideOffset,
}: TransactionFormProps) => {
  const { i18n } = useLingui()

  const keyboard = useAnimatedKeyboard()
  const translateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: keyboard.height.value }],
    }
  })

  return (
    <FormProvider {...form}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerClassName="flex-1 justify-between bg-muted"
      >
        <View className="flex-row justify-between items-center p-4 pb-0">
          <Button size="icon" variant="secondary" onPress={onCancel}>
            <XIcon className="size-6 text-primary" />
          </Button>
          <Controller
            name="date"
            control={form.control}
            render={({ field: { onChange, value } }) => (
              <DatePicker
                value={value}
                onChange={onChange}
                minimumDate={new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)}
                maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
              />
            )}
          />
          <View className="flex-row items-center gap-4">
            {onDelete ? (
              <Button size="icon" variant="secondary" onPress={onDelete}>
                <Trash2Icon className="size-6 text-primary" />
              </Button>
            ) : (
              <Button size="icon" variant="ghost" onPress={onOpenScanner}>
                <ScanTextIcon className="size-6 text-primary" />
              </Button>
            )}
          </View>
        </View>
        <View className="flex-1 items-center justify-center pb-12">
          <View className="w-full h-24 justify-end mb-2">
            <TransactionAmount />
          </View>
          <Controller
            name="budgetId"
            control={form.control}
            render={({ field: { onChange, value } }) => (
              <SelectBudgetField
                sideOffset={sideOffset}
                value={value}
                onSelect={(type) => {
                  onChange(type)
                }}
              />
            )}
          />
          <InputField
            name="note"
            placeholder={t(i18n)`transaction note`}
            autoCapitalize="none"
            className="truncate line-clamp-1 bg-transparent h-8 border-0"
            placeholderClassName="!text-muted"
            wrapperClassName="absolute left-4 right-4 bottom-4"
            numberOfLines={1}
            multiline={false}
          />
        </View>
        <Animated.View style={translateStyle}>
          <View className="flex-row items-center justify-between bg-card border-t border-border p-2">
            <View className="flex-row items-center gap-2">
              <SelectAccountField
                onSelect={(walletAccount) => {
                  form.setValue('currency', walletAccount.preferredCurrency)
                }}
              />
              <SelectCategoryField />
            </View>
            <FormSubmitButton form={form} onSubmit={onSubmit} />
          </View>
          <Controller
            name="amount"
            control={form.control}
            render={({ field: { onChange, value } }) => (
              <NumericPad value={value} onValueChange={onChange} />
            )}
          />
        </Animated.View>
      </ScrollView>
    </FormProvider>
  )
}

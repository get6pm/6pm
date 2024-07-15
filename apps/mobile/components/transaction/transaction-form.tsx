import {
  type TransactionFormValues,
  zTransactionFormValues,
} from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { LandPlot, Trash2Icon, XIcon } from 'lucide-react-native'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { ScrollView, View } from 'react-native'
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { InputField } from '../form-fields/input-field'
import { SubmitButton } from '../form-fields/submit-button'
import { NumericPad } from '../numeric-pad'
import { TextTicker } from '../text-ticker'
import { Button } from '../ui/button'
import { Text } from '../ui/text'
import { SelectAccountField } from './select-account-field'
import { SelectCategoryField } from './select-category-field'
import { SelectDateField } from './select-date-field'

type TransactionFormProps = {
  onSubmit: (data: TransactionFormValues) => void
  defaultValues?: Partial<TransactionFormValues>
  onCancel?: () => void
  onDelete?: () => void
}

export const TransactionForm = ({
  onSubmit,
  defaultValues,
  onCancel,
  onDelete,
}: TransactionFormProps) => {
  const { i18n } = useLingui()

  const keyboard = useAnimatedKeyboard()
  const translateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: keyboard.height.value }],
    }
  })

  const transactionForm = useForm<TransactionFormValues>({
    resolver: zodResolver(zTransactionFormValues),
    defaultValues: {
      date: new Date(),
      amount: 0,
      currency: 'USD',
      note: '',
      ...defaultValues,
    },
  })

  const amount = transactionForm.watch('amount')
  const currency = transactionForm.watch('currency')

  return (
    <FormProvider {...transactionForm}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerClassName="flex-1 justify-between bg-muted"
      >
        <View className="flex-row justify-between items-center p-6 pb-0">
          <SelectDateField />
          <View className="flex-row items-center gap-4">
            {onDelete && (
              <Button size="icon" variant="secondary" onPress={onDelete}>
                <Trash2Icon className="size-6 text-primary" />
              </Button>
            )}
            <Button size="icon" variant="secondary" onPress={onCancel}>
              <XIcon className="size-6 text-primary" />
            </Button>
          </View>
        </View>
        <View className="flex-1 items-center justify-center pb-12">
          <View className="w-full h-24 justify-end mb-4">
            <TextTicker
              value={amount}
              className="font-semibold text-6xl text-foreground leading-tight text-center"
              suffix={currency}
              suffixClassName="font-semibold ml-2 text-muted-foreground overflow-visible"
            />
          </View>
          <Button variant="outline" size="sm" className="rounded-full">
            <LandPlot className="w-5 h-5 text-primary" />
            <Text className="text-muted-foreground">
              {t(i18n)`No budget selected`}
            </Text>
          </Button>
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
                  transactionForm.setValue(
                    'currency',
                    walletAccount.preferredCurrency,
                  )
                }}
              />
              <SelectCategoryField />
            </View>
            <SubmitButton
              onPress={transactionForm.handleSubmit(onSubmit)}
              disabled={transactionForm.formState.isLoading || !amount}
            >
              <Text>{t(i18n)`Save`}</Text>
            </SubmitButton>
          </View>
          <Controller
            name="amount"
            control={transactionForm.control}
            render={({ field: { onChange, value } }) => (
              <NumericPad value={value} onValueChange={onChange} />
            )}
          />
        </Animated.View>
      </ScrollView>
    </FormProvider>
  )
}

import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import { type AccountFormValues, zAccountFormValues } from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRef } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { View } from 'react-native'
import type { TextInput } from 'react-native'
import { CurrencyField } from '../form-fields/currency-field'
import { InputField } from '../form-fields/input-field'
import { SubmitButton } from '../form-fields/submit-button'
import { Text } from '../ui/text'
import { SelectAccountIconField } from './select-account-icon-field'

type AccountFormProps = {
  onSubmit: (data: AccountFormValues) => void
  defaultValues?: AccountFormValues
}

export const AccountForm = ({ onSubmit, defaultValues }: AccountFormProps) => {
  const { i18n } = useLingui()
  const nameInputRef = useRef<TextInput>(null)
  const balanceInputRef = useRef<TextInput>(null)
  const defaultCurrency = useDefaultCurrency()

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(zAccountFormValues),
    defaultValues: {
      name: '',
      preferredCurrency: defaultCurrency,
      icon: 'CreditCard',
      ...defaultValues,
    },
  })

  return (
    <FormProvider {...accountForm}>
      <View className="flex flex-1 gap-4">
        <InputField
          ref={nameInputRef}
          name="name"
          label={t(i18n)`Name`}
          placeholder={t(i18n)`Wallet account name`}
          autoFocus={!defaultValues}
          className="!pl-[62px]"
          leftSection={
            <SelectAccountIconField
              onSelect={() => nameInputRef.current?.focus()}
            />
          }
          onSubmitEditing={() => {
            balanceInputRef.current?.focus()
          }}
        />
        <InputField
          ref={balanceInputRef}
          name="balance"
          label={t(i18n)`Balance`}
          placeholder={t(i18n)`0.00`}
          className="!pl-[62px]"
          keyboardType="number-pad"
          leftSection={
            <Controller
              name="preferredCurrency"
              control={accountForm.control}
              render={({ field: { onChange, value } }) => (
                <CurrencyField
                  value={value}
                  onChange={(selected) => {
                    onChange(selected)
                    balanceInputRef.current?.focus()
                  }}
                />
              )}
            />
          }
        />
        <SubmitButton
          onPress={accountForm.handleSubmit(onSubmit)}
          disabled={accountForm.formState.isLoading}
          className="mt-4"
        >
          <Text>{t(i18n)`Save`}</Text>
        </SubmitButton>
      </View>
    </FormProvider>
  )
}

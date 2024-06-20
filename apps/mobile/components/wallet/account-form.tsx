import { type AccountFormValues, zAccountFormValues } from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { View } from 'react-native'
import type { TextInput } from 'react-native'
import { InputField } from '../form-fields/input-field'
import { SubmitButton } from '../form-fields/submit-button'
import { Text } from '../ui/text'
import { SelectAccountIconField } from './select-account-icon-field'
import { SelectCurrencyField } from './select-currency-field'

type AccountFormProps = {
  onSubmit: (data: AccountFormValues) => void
}

export const AccountForm = ({ onSubmit }: AccountFormProps) => {
  const { i18n } = useLingui()
  const nameInputRef = useRef<TextInput>(null)
  const balanceInputRef = useRef<TextInput>(null)

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(zAccountFormValues),
    defaultValues: {
      name: '',
      preferredCurrency: 'USD', // TODO: get from user settings
      icon: 'CreditCard',
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
          autoCapitalize="none"
          autoFocus
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
            <SelectCurrencyField
              onSelect={() => balanceInputRef.current?.focus()}
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

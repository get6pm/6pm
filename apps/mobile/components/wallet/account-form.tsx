import { useDefaultCurrency } from '@/stores/user-settings/hooks'
import {
  WalletBalanceState,
  type WalletFormValues,
  zWalletFormValues,
} from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native'
import { useRef, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { View } from 'react-native'
import type { TextInput } from 'react-native'
import { CurrencyField } from '../form-fields/currency-field'
import { InputField } from '../form-fields/input-field'
import { SubmitButton } from '../form-fields/submit-button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible'
import { Label } from '../ui/label'
import { Text } from '../ui/text'
import { SelectAccountIconField } from './select-account-icon-field'
import { SelectBalanceStateField } from './select-balance-state-field'

type AccountFormProps = {
  onSubmit: (data: WalletFormValues) => void
  defaultValues?: WalletFormValues
  sideOffset?: number
}

export const AccountForm = ({
  onSubmit,
  defaultValues,
  sideOffset,
}: AccountFormProps) => {
  const { i18n } = useLingui()
  const nameInputRef = useRef<TextInput>(null)
  const balanceInputRef = useRef<TextInput>(null)
  const defaultCurrency = useDefaultCurrency()
  const [isExpanded, setIsExpanded] = useState(
    (defaultValues?.balance || 0) < 0,
  )

  const accountForm = useForm<WalletFormValues>({
    resolver: zodResolver(zWalletFormValues),
    defaultValues: {
      name: '',
      preferredCurrency: defaultCurrency,
      icon: 'CreditCard',
      balanceState:
        Number.isNaN(defaultValues?.balance) ||
        (defaultValues?.balance || 0) >= 0
          ? WalletBalanceState.Positive
          : WalletBalanceState.Negative,
      ...defaultValues,
      balance: Math.abs(defaultValues?.balance || 0),
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
          keyboardType="numeric"
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
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger>
            <View className="mx-auto mt-2 mb-4 flex-row items-center gap-2">
              <Text className="font-medium">{t(i18n)`Advanced`}</Text>
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-foreground" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-foreground" />
              )}
            </View>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Controller
              name="balanceState"
              control={accountForm.control}
              render={({ field: { onChange, value, disabled } }) => (
                <View>
                  <Label nativeID={`label-state`}>{t(
                    i18n,
                  )`Current state`}</Label>
                  <Label
                    className="!text-xs mb-1.5 font-regular text-muted-foreground"
                    nativeID={`label-state`}
                  >{t(
                    i18n,
                  )`Negative if your content balance is under zero`}</Label>
                  <SelectBalanceStateField
                    value={value || WalletBalanceState.Positive}
                    sideOffset={sideOffset}
                    onSelect={(selected) => {
                      onChange(selected)
                    }}
                    disabled={disabled}
                  />
                </View>
              )}
            />
          </CollapsibleContent>
        </Collapsible>
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

import { type CategoryFormValues, zCategoryFormValues } from '@6pm/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { useRef } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { View } from 'react-native'
import type { TextInput } from 'react-native'
import { InputField } from '../form-fields/input-field'
import { SubmitButton } from '../form-fields/submit-button'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Text } from '../ui/text'
import { SelectCategoryIconField } from './select-category-icon-field'

type CategoryFormProps = {
  onSubmit: (data: CategoryFormValues) => void
  defaultValues?: CategoryFormValues
}

export const CategoryForm = ({
  onSubmit,
  defaultValues,
}: CategoryFormProps) => {
  const { i18n } = useLingui()
  const nameInputRef = useRef<TextInput>(null)

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(zCategoryFormValues),
    defaultValues: {
      name: '',
      type: 'EXPENSE',
      icon: 'CreditCard',
      ...defaultValues,
    },
  })

  return (
    <FormProvider {...categoryForm}>
      <View className="flex flex-1 gap-4">
        <InputField
          ref={nameInputRef}
          name="name"
          label={t(i18n)`Name`}
          placeholder={t(i18n)`Category name`}
          autoCapitalize="none"
          autoFocus={!defaultValues}
          className="!pl-[62px]"
          leftSection={
            <SelectCategoryIconField
              onSelect={() => nameInputRef.current?.focus()}
            />
          }
        />

        <Text className="font-medium">{t(i18n)`Type`}</Text>
        <Controller
          control={categoryForm.control}
          name="type"
          render={({ field }) => (
            <Tabs
              value={field.value}
              className="-mt-3"
              onValueChange={field.onChange}
            >
              <TabsList>
                <TabsTrigger value="EXPENSE">
                  <Text>{t(i18n)`Expense`}</Text>
                </TabsTrigger>
                <TabsTrigger value="INCOME">
                  <Text>{t(i18n)`Income`}</Text>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        />

        <SubmitButton
          onPress={categoryForm.handleSubmit(onSubmit)}
          disabled={categoryForm.formState.isLoading}
          className="mt-4"
        >
          <Text>{t(i18n)`Save`}</Text>
        </SubmitButton>
      </View>
    </FormProvider>
  )
}

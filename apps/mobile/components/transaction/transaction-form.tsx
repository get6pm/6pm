import { useUserEntitlements } from '@/hooks/use-purchases'
import { sleep } from '@/lib/utils'
import type { BlobObject, TransactionFormValues } from '@6pm/validation'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Haptics from 'expo-haptics'
import { Link, useRouter } from 'expo-router'
import { Trash2Icon } from 'lucide-react-native'
import { useRef } from 'react'
import {
  Controller,
  FormProvider,
  type UseFormReturn,
  useController,
  useWatch,
} from 'react-hook-form'
import { ScrollView, View } from 'react-native'
import { Image } from 'react-native'
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { BottomSheet } from '../common/bottom-sheet'
import { CurrencySheetList } from '../common/currency-sheet'
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
  blobAttachments?: BlobObject[] | null
}

export function TransactionAmount() {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [amount] = useWatch({ name: ['amount'] })
  const {
    field: { onChange, value: currency },
  } = useController({ name: 'currency' })
  const { isPro } = useUserEntitlements()
  const router = useRouter()

  return (
    <>
      <TextTicker
        value={amount}
        className="text-center text-6xl text-foreground leading-tight"
        suffix={currency}
        suffixClassName="ml-2 text-muted-foreground overflow-visible"
        onPressSuffix={() => {
          Haptics.selectionAsync()
          if (isPro) {
            sheetRef.current?.present()
          } else {
            router.push('/paywall')
          }
        }}
      />
      <BottomSheet ref={sheetRef} index={0} enableDynamicSizing>
        <CurrencySheetList
          value={currency}
          onSelect={async (selected) => {
            sheetRef.current?.close()
            await sleep(500)
            onChange?.(selected.code)
          }}
        />
      </BottomSheet>
    </>
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
      className="flex-shrink-0"
    >
      <Text>{t(i18n)`Save`}</Text>
    </SubmitButton>
  )
}

export const TransactionForm = ({
  form,
  onSubmit,
  // onCancel,
  onDelete,
  // onOpenScanner,
  sideOffset,
  blobAttachments,
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
        bounces={false}
      >
        <View className="flex-row items-center justify-between p-4 pb-0">
          {/* <Button size="icon" variant="secondary" onPress={onCancel}>
            <XIcon className="size-6 text-primary" />
          </Button> */}
          <View className="flex-row items-center gap-2">
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
            {!!blobAttachments?.length && (
              <Link
                href={{
                  pathname: '/blob-viewer',
                  params: {
                    blobObjectUrl: blobAttachments[0].url,
                  },
                }}
                className="mt-1.5"
              >
                <Image
                  source={{ uri: blobAttachments[0].url }}
                  className="h-12 w-12 overflow-hidden rounded-md border-4 border-secondary bg-muted"
                  resizeMode="contain"
                />
              </Link>
            )}
          </View>
          <View className="flex-row items-center gap-4">
            {onDelete ? (
              <Button size="icon" variant="secondary" onPress={onDelete}>
                <Trash2Icon className="size-5 text-secondary-foreground" />
              </Button>
            ) : null}
          </View>
        </View>
        <View className="flex-1 items-center justify-center pb-12">
          <View className="mb-2 h-24 w-full justify-end">
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
            className="line-clamp-1 h-8 truncate border-0 bg-transparent"
            placeholderClassName="!text-muted"
            wrapperClassName="absolute left-4 right-4 bottom-4"
            numberOfLines={1}
            multiline={false}
          />
        </View>
        <Animated.View style={translateStyle}>
          <View className="flex-row items-center justify-between gap-3 border-border border-t bg-background p-2">
            <View className="flex-1 flex-shrink flex-row items-center gap-2">
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

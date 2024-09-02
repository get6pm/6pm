import { sleep } from '@/lib/utils'
import { useWallets } from '@/queries/wallet'
import type { WalletAccountWithBalance } from '@6pm/validation'
import {
  BottomSheetFlatList,
  type BottomSheetModal,
} from '@gorhom/bottom-sheet'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Haptics from 'expo-haptics'
import { useRef } from 'react'
import { useController } from 'react-hook-form'
import { Keyboard, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheet } from '../common/bottom-sheet'
import GenericIcon from '../common/generic-icon'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

export function SelectAccountField({
  onSelect,
}: {
  onSelect?: (walletAccount: WalletAccountWithBalance) => void
}) {
  const { bottom } = useSafeAreaInsets()
  const { data: walletAccounts, isLoading } = useWallets()

  const sheetRef = useRef<BottomSheetModal>(null)
  const { i18n } = useLingui()
  const {
    field: { onChange, onBlur, value },
  } = useController({ name: 'walletAccountId' })

  const selectedWalletAccount = walletAccounts?.find(
    (walletAccount) => walletAccount.id === value,
  )

  return (
    <>
      <Button
        variant="secondary"
        className="!px-3 max-w-[140px] border border-border"
        disabled={isLoading}
        onPress={() => {
          Haptics.selectionAsync()
          Keyboard.dismiss()
          sheetRef.current?.present()
        }}
      >
        {!!selectedWalletAccount && (
          <GenericIcon
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            name={selectedWalletAccount.icon as any}
            className="h-5 w-5 text-primary"
          />
        )}
        <Text className="line-clamp-1 shrink">
          {selectedWalletAccount?.name || t(i18n)`Select account`}
        </Text>
      </Button>
      <BottomSheet ref={sheetRef} index={0} enableDynamicSizing>
        <BottomSheetFlatList
          data={walletAccounts}
          numColumns={4}
          keyExtractor={(i) => i.id}
          columnWrapperClassName="flex-wrap"
          contentContainerClassName="px-2"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <Text className="py-2 text-center font-medium text-base">
              {t(i18n)`Wallet Accounts`}
            </Text>
          }
          contentContainerStyle={{ paddingBottom: bottom + 16 }}
          renderItem={({ item }) => (
            <View className="w-[25%] p-1.5">
              <Button
                size="icon"
                className="flex h-20 w-full flex-1 flex-grow flex-col gap-2 px-2"
                variant={value === item ? 'secondary' : 'ghost'}
                onPress={async () => {
                  Haptics.selectionAsync()
                  sheetRef.current?.close()
                  await sleep(500)
                  onChange(item.id)
                  onBlur()
                  onSelect?.(item)
                }}
              >
                <GenericIcon
                  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                  name={item.icon as any}
                  className="size-8 text-foreground"
                />
                <Text className="!text-sm line-clamp-1 text-center text-muted-foreground">
                  {item.name}
                </Text>
              </Button>
            </View>
          )}
        />
      </BottomSheet>
    </>
  )
}

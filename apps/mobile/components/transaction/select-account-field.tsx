import { sleep } from '@/lib/utils'
import { useWalletList } from '@/stores/wallet/hooks'
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
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Text } from '../ui/text'

export function SelectAccountField({
  onSelect,
}: {
  onSelect?: (walletAccount: WalletAccountWithBalance) => void
}) {
  const { bottom } = useSafeAreaInsets()
  const { wallets, walletsDict, isLoading } = useWalletList()

  const sheetRef = useRef<BottomSheetModal>(null)
  const { i18n } = useLingui()
  const {
    field: { onChange, onBlur, value },
  } = useController({ name: 'walletAccountId' })

  const selectedWalletAccount = walletsDict[value]

  return (
    <>
      <Button
        variant="secondary"
        className="!px-3"
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
            className="size-5 text-secondary-foreground"
          />
        )}
        <Text className="line-clamp-1 shrink">
          {selectedWalletAccount?.name || t(i18n)`Select account`}
        </Text>
      </Button>
      <BottomSheet ref={sheetRef} index={0} enableDynamicSizing>
        <BottomSheetFlatList
          data={wallets}
          numColumns={4}
          keyExtractor={(i) => i.id}
          columnWrapperClassName="flex-wrap"
          contentContainerClassName="px-2"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <Badge className="mx-auto my-2 px-8" variant="secondary">
              <Text className="text-base uppercase">{t(
                i18n,
              )`Wallet Accounts`}</Text>
            </Badge>
          }
          contentContainerStyle={{ paddingBottom: bottom + 16 }}
          renderItem={({ item }) => (
            <View className="w-[33%] p-1.5">
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
                <Text className="!text-sm line-clamp-1 text-center font-regular text-muted-foreground">
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

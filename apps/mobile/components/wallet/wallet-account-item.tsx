import type { WalletAccountWithBalance } from '@6pm/validation'
import { Link } from 'expo-router'
import { ChevronRightIcon } from 'lucide-react-native'
import type { FC } from 'react'
import { View } from 'react-native'
import GenericIcon from '../common/generic-icon'
import { MenuItem } from '../common/menu-item'
import { Text } from '../ui/text'

type WalletAccountItemProps = {
  data: WalletAccountWithBalance
}

export const WalletAccountItem: FC<WalletAccountItemProps> = ({ data }) => {
  return (
    <Link
      asChild
      push
      href={{
        pathname: '/wallet/[walletId]',
        params: { walletId: data.id },
      }}
    >
      <MenuItem
        label={data.name}
        icon={() => (
          <GenericIcon
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            name={data.icon as any}
            className="size-6 text-foreground"
          />
        )}
        rightSection={
          <View className="flex-row items-center gap-4">
            <Text className="text-muted-foreground">
              {Number(data.balance ?? '0')?.toLocaleString?.()}{' '}
              {data.preferredCurrency}
            </Text>
            <ChevronRightIcon className="w-5 h-5 text-primary" />
          </View>
        }
      />
    </Link>
  )
}

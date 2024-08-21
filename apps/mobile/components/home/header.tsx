import { useUser } from '@clerk/clerk-expo'
import { Text, View } from 'react-native'
import { UserAvatar } from '../common/user-avatar'
import { type HomeFilter, SelectFilter } from './select-filter'
import { SelectWalletAccount } from './select-wallet-account'

type HomeHeaderProps = {
  walletAccountId?: string
  onWalletAccountChange?: (walletAccountId?: string) => void
  filter?: HomeFilter
  onFilterChange?: (filter: HomeFilter) => void
}

export function HomeHeader({
  walletAccountId,
  onWalletAccountChange,
  filter,
  onFilterChange,
}: HomeHeaderProps) {
  const { user } = useUser()

  return (
    <View className="flex flex-row items-center justify-between gap-4 bg-card px-6 pb-3">
      <View className="flex flex-1 flex-row items-center gap-3">
        <UserAvatar user={user!} />
        <View className="flex-1">
          <Text className="line-clamp-1 font-medium font-sans text-muted-foreground text-sm">
            {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
          </Text>
          <SelectWalletAccount
            value={walletAccountId}
            onSelect={onWalletAccountChange}
          />
        </View>
      </View>
      <SelectFilter value={filter} onSelect={onFilterChange} />
    </View>
  )
}

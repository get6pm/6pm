import { useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import { TouchableOpacity, View } from 'react-native'
import { UserAvatar } from '../common/user-avatar'
import { Text } from '../ui/text'
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
  const router = useRouter()

  return (
    <View className="flex flex-row items-center justify-between gap-4 bg-background px-6 pb-3">
      <View className="flex flex-1 flex-row items-center gap-3">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/(app)/profile')}
        >
          <UserAvatar user={user!} />
        </TouchableOpacity>
        <View className="flex-1 gap-1">
          <Text className="line-clamp-1 font-semiBold text-muted-foreground text-sm">
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

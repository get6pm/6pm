import { useUser } from '@clerk/clerk-expo'
import { Bell } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { UserAvatar } from '../common/user-avatar'
import { Button } from '../ui/button'
import { SelectWalletAccount } from './select-wallet-account'

type HomeHeaderProps = {
  walletAccountId?: string
  onWalletAccountChange?: (walletAccountId?: string) => void
}

export function HomeHeader({
  walletAccountId,
  onWalletAccountChange,
}: HomeHeaderProps) {
  const { user } = useUser()

  return (
    <View className="flex bg-card px-6 pb-3 flex-row items-center justify-between">
      <View className="flex flex-row items-center gap-3">
        <UserAvatar user={user!} />
        <View>
          <Text className="font-medium text-muted-foreground text-sm font-sans">
            {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
          </Text>
          <SelectWalletAccount
            value={walletAccountId}
            onSelect={onWalletAccountChange}
          />
        </View>
      </View>
      <Button variant="secondary" size="icon">
        <Bell className="w-5 h-5 text-primary" />
      </Button>
    </View>
  )
}

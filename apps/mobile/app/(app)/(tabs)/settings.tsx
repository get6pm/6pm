import { Avatar, AvatarFallback, AvatarImage } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { LogOutIcon, PencilIcon } from 'lucide-react-native'
import { ScrollView, Text, View } from 'react-native'

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const { user } = useUser()

  return (
    <ScrollView contentContainerClassName="py-4" className="bg-card">
      <View className="bg-muted rounded-lg mx-6 px-4 py-3 justify-end h-40">
        <View className="flex flex-row items-center gap-2 justify-between">
          <View className="flex flex-row items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage
                source={{
                  uri: user?.imageUrl,
                }}
              />
              <AvatarFallback>QK</AvatarFallback>
            </Avatar>
            <View>
              <Badge
                variant="secondary"
                label="Free"
                className="self-start rounded-md mb-1"
              />
              <Text className="font-medium">
                {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </View>
          <IconButton icon={PencilIcon} size="sm" variant="ghost" />
        </View>
      </View>
      <Text className='font-sans mx-6 text-muted-foreground mt-6'>
        Others
      </Text>
      <Button
        label="Sign out"
        variant="ghost"
        onPress={() => signOut()}
        labelClasses="text-red-500 font-regular"
        leftIcon={LogOutIcon}
        className="justify-start gap-6 px-6"
      />
    </ScrollView>
  )
}

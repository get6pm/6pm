import { MenuItem } from '@/components/common/menu-item'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { useLocale } from '@/locales/provider'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import { ChevronRightIcon, EarthIcon, LogOutIcon, PencilIcon, SwatchBookIcon } from 'lucide-react-native'
import { Alert, ScrollView, View } from 'react-native'

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const { user } = useUser()
  const { i18n } = useLingui()
  const { language } = useLocale()

  return (
    <ScrollView contentContainerClassName="py-4 gap-4" className="bg-card">
      <View className="bg-muted rounded-lg mx-6 px-4 py-3 justify-end h-40">
        <View className="flex flex-row items-center gap-2 justify-between">
          <View className="flex flex-row items-center gap-3">
            <Avatar alt='avatar' className="w-12 h-12">
              <AvatarImage
                source={{
                  uri: user?.imageUrl,
                }}
              />
              <AvatarFallback>QK</AvatarFallback>
            </Avatar>
            <View>
              <Badge
                variant="outline"
                className="self-start rounded-md mb-1"
              >
                <Text className="text-xs font-medium">Free</Text>
              </Badge>
              <Text className="font-medium text-primary">
                {user?.fullName ?? user?.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </View>
          <Button size="icon" variant="ghost">
            <PencilIcon className="w-5 h-5 text-primary" />
          </Button>
        </View>
      </View>
      <View className="gap-2 mt-4">
        <Text className="font-sans mx-6 text-muted-foreground">
          {t(i18n)`App settings`}
        </Text>
        <Link href="/appearance" asChild>
          <MenuItem
            label={t(i18n)`Appearance`}
            icon={SwatchBookIcon}
            rightSection={<ChevronRightIcon className='w-6 h-6 text-primary' />}
          />
        </Link>
        <Link href="/language" asChild>
          <MenuItem
            label={t(i18n)`Language`}
            icon={EarthIcon}
            rightSection={
              <View className="flex flex-row items-center gap-2">
                <Text className='text-muted-foreground font-sans'>
                  {t(i18n)`${language}`}
                </Text>
                <ChevronRightIcon className='w-6 h-6 text-primary' />
              </View>
            }
          />
        </Link>
      </View>
      <View className="gap-2 mt-4">
        <Text className="font-sans mx-6 text-muted-foreground">
          {t(i18n)`Others`}
        </Text>
        <Button
          variant="ghost"
          onPress={() => Alert.alert(t(i18n)`Are you sure you want to sign out?`, '', [
            {
              text: t(i18n)`Cancel`,
              style: 'cancel',
            },
            {
              text: t(i18n)`Sign out`,
              style: 'destructive',
              onPress: () => signOut(),
            },
          ])}
          className="justify-start gap-6 px-6"
        >
          <LogOutIcon className="w-5 h-5 text-red-500" />
          <Text className="text-red-500 font-regular group-active:text-red-500">
            {t(i18n)`Sign out`}
          </Text>
        </Button>
      </View>
    </ScrollView>
  )
}

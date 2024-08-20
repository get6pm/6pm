import * as Application from 'expo-application'
import Constants from 'expo-constants'

import { Logo } from '@/components/common/logo'
import { MenuItem } from '@/components/common/menu-item'
import { toast } from '@/components/common/toast'
import { ProfileCard } from '@/components/setting/profile-card'
import { SelectDefaultCurrency } from '@/components/setting/select-default-currency'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import { useScheduleNotification } from '@/hooks/use-schedule-notification'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useLocale } from '@/locales/provider'
import { useUserSettingsStore } from '@/stores/user-settings/store'
import { useAuth } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { LinearGradient } from 'expo-linear-gradient'
import * as Notifications from 'expo-notifications'
import { Link } from 'expo-router'
import {
  BellIcon,
  ChevronRightIcon,
  EarthIcon,
  GithubIcon,
  InboxIcon,
  LockKeyholeIcon,
  LogOutIcon,
  MessageSquareQuoteIcon,
  ScanFaceIcon,
  ShapesIcon,
  Share2Icon,
  StarIcon,
  SwatchBookIcon,
  WalletCardsIcon,
} from 'lucide-react-native'
import { Alert, Linking, ScrollView, View } from 'react-native'

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const { i18n } = useLingui()
  const { language } = useLocale()
  const { colorScheme } = useColorScheme()
  const { cancelAllScheduledNotifications } = useScheduleNotification()
  const { setEnabledPushNotifications, enabledPushNotifications } =
    useUserSettingsStore()

  return (
    <View className="bg-card">
      <ScrollView
        contentContainerClassName="py-4 pb-14 gap-4"
        className="bg-card"
      >
        <ProfileCard />
        <Button className="!px-4 !h-14 mx-6 justify-between">
          <View>
            <Text className="!text-base font-semibold">
              {t(i18n)`Get 6pm Pro`}
            </Text>
            <Text className="!text-xs font-medium opacity-65">
              {t(i18n)`Unlocks full AI power and more!`}
            </Text>
          </View>
          <LockKeyholeIcon className="h-6 w-6 text-muted-foreground" />
        </Button>
        <View className="mt-4 gap-2">
          <Text className="mx-6 font-sans text-muted-foreground">
            {t(i18n)`General`}
          </Text>
          <View>
            <Link href="/wallet/accounts" asChild>
              <MenuItem
                label={t(i18n)`Wallet accounts`}
                icon={WalletCardsIcon}
                rightSection={
                  <ChevronRightIcon className="h-5 w-5 text-primary" />
                }
              />
            </Link>
            <Link href="/category" asChild>
              <MenuItem
                label={t(i18n)`Categories`}
                icon={ShapesIcon}
                rightSection={
                  <ChevronRightIcon className="h-5 w-5 text-primary" />
                }
              />
            </Link>
            <Link href="/magic-inbox" asChild disabled>
              <MenuItem
                label={t(i18n)`Magic inbox`}
                icon={InboxIcon}
                rightSection={
                  <ChevronRightIcon className="h-5 w-5 text-primary" />
                }
              />
            </Link>
          </View>
        </View>
        <View className="gap-2">
          <Text className="mx-6 font-sans text-muted-foreground">
            {t(i18n)`App settings`}
          </Text>
          <View>
            <Link href="/appearance" asChild>
              <MenuItem
                label={t(i18n)`Appearance`}
                icon={SwatchBookIcon}
                rightSection={
                  <ChevronRightIcon className="h-5 w-5 text-primary" />
                }
              />
            </Link>
            <Link href="/language" asChild>
              <MenuItem
                label={t(i18n)`Language`}
                icon={EarthIcon}
                rightSection={
                  <View className="flex flex-row items-center gap-2">
                    <Text className="font-sans text-muted-foreground uppercase">
                      {t(i18n)`${language}`}
                    </Text>
                    <ChevronRightIcon className="h-5 w-5 text-primary" />
                  </View>
                }
              />
            </Link>
            <SelectDefaultCurrency />
            <MenuItem
              label={t(i18n)`Login using FaceID`}
              icon={ScanFaceIcon}
              rightSection={
                <Switch checked={false} onCheckedChange={console.log} />
              }
            />
            <MenuItem
              label={t(i18n)`Push notifications`}
              icon={BellIcon}
              rightSection={
                <Switch
                  checked={enabledPushNotifications}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      const { status: existingStatus } =
                        await Notifications.getPermissionsAsync()
                      let finalStatus = existingStatus
                      if (existingStatus !== 'granted') {
                        const { status } =
                          await Notifications.requestPermissionsAsync()
                        finalStatus = status
                      }
                      if (finalStatus !== 'granted') {
                        toast.error(t(i18n)`Push notifications are not enabled`)
                        setEnabledPushNotifications(false)
                        return
                      }
                      toast.success(t(i18n)`Push notifications are enabled`)
                    } else {
                      toast.success(t(i18n)`Push notifications are disabled`)
                    }
                    setEnabledPushNotifications(checked)
                  }}
                />
              }
            />
          </View>
        </View>
        <View className="gap-2">
          <Text className="mx-6 font-sans text-muted-foreground">
            {t(i18n)`Others`}
          </Text>
          <View>
            <Link href="/feedback" asChild disabled>
              <MenuItem
                label={t(i18n)`Send feedback`}
                icon={MessageSquareQuoteIcon}
                rightSection={
                  <ChevronRightIcon className="h-5 w-5 text-primary" />
                }
              />
            </Link>
            <MenuItem
              label={t(i18n)`Rate 6pm on App Store`}
              icon={StarIcon}
              rightSection={
                <ChevronRightIcon className="h-5 w-5 text-primary" />
              }
              disabled
            />
            <MenuItem
              label={t(i18n)`Share with friends`}
              icon={Share2Icon}
              rightSection={
                <ChevronRightIcon className="h-5 w-5 text-primary" />
              }
              disabled
            />
            <MenuItem
              label={t(i18n)`Proudly open source`}
              icon={GithubIcon}
              rightSection={
                <ChevronRightIcon className="h-5 w-5 text-primary" />
              }
              onPress={() => Linking.openURL('https://github.com/sixpm-ai/6pm')}
            />
            <Button
              variant="ghost"
              onPress={() =>
                Alert.alert(t(i18n)`Are you sure you want to sign out?`, '', [
                  {
                    text: t(i18n)`Cancel`,
                    style: 'cancel',
                  },
                  {
                    text: t(i18n)`Sign out`,
                    style: 'destructive',
                    onPress: async () => {
                      await signOut()
                      await cancelAllScheduledNotifications()
                    },
                  },
                ])
              }
              className="!px-6 justify-start gap-6"
            >
              <LogOutIcon className="h-5 w-5 text-red-500" />
              <Text className="font-normal text-red-500 group-active:text-red-500">
                {t(i18n)`Sign out`}
              </Text>
            </Button>
          </View>
        </View>
        <View className="items-center gap-3">
          <Logo className="mx-auto h-16 w-16" />
          <Text className="font-mono text-muted-foreground text-sm">
            {t(i18n)`ver.`}
            {Application.nativeApplicationVersion}{' '}
            {Constants.expoConfig?.ios?.buildNumber
              ? `(${Constants.expoConfig.ios.buildNumber})`
              : ''}
          </Text>
          <View className="flex-row gap-6">
            <Link href="/terms-of-service">
              <Text className="text-muted-foreground text-sm">
                {t(i18n)`Terms of use`}
              </Text>
            </Link>
            <Link href="/privacy-policy">
              <Text className="text-muted-foreground text-sm">
                {t(i18n)`Privacy policy`}
              </Text>
            </Link>
          </View>
        </View>
      </ScrollView>
      <LinearGradient
        colors={[
          colorScheme === 'dark' ? 'transparent' : '#ffffff00',
          theme[colorScheme ?? 'light'].background,
        ]}
        className="absolute right-0 bottom-0 left-0 h-20"
        pointerEvents="none"
      />
    </View>
  )
}

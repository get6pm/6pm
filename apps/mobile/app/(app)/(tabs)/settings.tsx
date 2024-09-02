import * as Application from 'expo-application'
import * as Haptics from 'expo-haptics'
import * as Updates from 'expo-updates'

import { Logo } from '@/components/common/logo'
import { MenuItem } from '@/components/common/menu-item'
import { toast } from '@/components/common/toast'
import { ProfileCard } from '@/components/setting/profile-card'
import { SelectDefaultCurrency } from '@/components/setting/select-default-currency'
import { SetLocalAuth } from '@/components/setting/set-local-auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import { useScheduleNotification } from '@/hooks/use-schedule-notification'
import { useSeed } from '@/hooks/use-seed'
import { useColorScheme } from '@/hooks/useColorScheme'
import { theme } from '@/lib/theme'
import { useLocale } from '@/locales/provider'
import { useTransactionStore } from '@/stores/transaction/store'
import { useUserSettingsStore } from '@/stores/user-settings/store'
import { useAuth } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import * as Clipboard from 'expo-clipboard'
import { LinearGradient } from 'expo-linear-gradient'
import * as Notifications from 'expo-notifications'
import { Link } from 'expo-router'
import {
  BeanIcon,
  BellIcon,
  ChevronRightIcon,
  EarthIcon,
  GithubIcon,
  InboxIcon,
  LockKeyholeIcon,
  LogOutIcon,
  MessageSquareQuoteIcon,
  ScrollTextIcon,
  ShapesIcon,
  Share2Icon,
  SparklesIcon,
  StarIcon,
  SwatchBookIcon,
  WalletCardsIcon,
} from 'lucide-react-native'
import {
  Alert,
  Linking,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native'

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const { i18n } = useLingui()
  const { language } = useLocale()
  const { colorScheme } = useColorScheme()
  const { cancelAllScheduledNotifications } = useScheduleNotification()
  const { setEnabledPushNotifications, enabledPushNotifications } =
    useUserSettingsStore()
  const { startSeed } = useSeed()
  const { draftTransactions } = useTransactionStore()

  async function handleCopyVersion() {
    const fullVersion = `${Application.nativeApplicationVersion} - ${Updates.updateId ?? 'Embedded'}`
    await Clipboard.setStringAsync(fullVersion)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    toast.success(t(i18n)`Copied version to clipboard`)
  }

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
            <Link href="/review-transactions" asChild>
              <MenuItem
                label={t(i18n)`Review transactions`}
                icon={SparklesIcon}
                rightSection={
                  <Badge
                    variant={draftTransactions.length ? 'default' : 'outline'}
                  >
                    <Text className="text-xs">{draftTransactions.length}</Text>
                  </Badge>
                }
              />
            </Link>
            <MenuItem
              label={t(i18n)`Magic inbox`}
              icon={InboxIcon}
              rightSection={
                <Badge variant="outline">
                  <Text className="text-xs">{t(i18n)`Coming soon`}</Text>
                </Badge>
              }
              disabled
            />
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
            <SetLocalAuth />
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
            {__DEV__ && (
              <MenuItem
                label={t(i18n)`Seed transactions`}
                icon={BeanIcon}
                rightSection={
                  <ChevronRightIcon className="h-5 w-5 text-primary" />
                }
                onPress={startSeed}
              />
            )}
            <Link href="/privacy-policy" asChild>
              <MenuItem
                label={t(i18n)`Privacy policy`}
                icon={ScrollTextIcon}
                rightSection={
                  <ChevronRightIcon className="h-5 w-5 text-primary" />
                }
              />
            </Link>
            <MenuItem
              label={t(i18n)`Send feedback`}
              icon={MessageSquareQuoteIcon}
              rightSection={
                <ChevronRightIcon className="h-5 w-5 text-primary" />
              }
              disabled
            />
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
        <TouchableOpacity
          activeOpacity={0.8}
          className="items-center gap-3"
          onPressIn={Haptics.selectionAsync}
          onLongPress={handleCopyVersion}
        >
          <Logo className="mx-auto h-16 w-16" />
          <Text className="font-mono text-muted-foreground text-sm">
            {t(i18n)`ver.`}
            {Application.nativeApplicationVersion}
          </Text>
        </TouchableOpacity>
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

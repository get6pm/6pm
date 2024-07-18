import * as Application from 'expo-application'

import { Logo } from '@/components/common/logo'
import { MenuItem } from '@/components/common/menu-item'
import { UserAvatar } from '@/components/common/user-avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import { useLocale } from '@/locales/provider'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Link } from 'expo-router'
import {
  BellIcon,
  ChevronRightIcon,
  CurrencyIcon,
  EarthIcon,
  GithubIcon,
  InboxIcon,
  LockKeyholeIcon,
  LogOutIcon,
  MessageSquareQuoteIcon,
  PencilIcon,
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
  const { user } = useUser()
  const { i18n } = useLingui()
  const { language } = useLocale()

  return (
    <ScrollView contentContainerClassName="py-4 gap-4" className="bg-card">
      <View className="bg-muted rounded-lg overflow-hidden mx-6 justify-end h-44">
        <View className="flex flex-1" />
        <View className="flex flex-row px-4 py-3 items-center gap-2 justify-between">
          <View className="flex flex-row items-center gap-3">
            <UserAvatar user={user!} fallbackClassName="bg-card" />
            <View>
              <Badge variant="outline" className="self-start rounded-md mb-1">
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
      <Button className="mx-6 !px-4 !h-14 justify-between">
        <View>
          <Text className="font-semibold !text-base">
            {t(i18n)`Get 6pm Pro`}
          </Text>
          <Text className="font-medium opacity-65 !text-xs">
            {t(i18n)`Unlocks full AI power and more!`}
          </Text>
        </View>
        <LockKeyholeIcon className="w-6 h-6 text-muted-foreground" />
      </Button>
      <View className="gap-2 mt-4">
        <Text className="font-sans mx-6 text-muted-foreground">
          {t(i18n)`General`}
        </Text>
        <View>
          <Link href="/wallet/accounts" asChild>
            <MenuItem
              label={t(i18n)`Wallet accounts`}
              icon={WalletCardsIcon}
              rightSection={
                <ChevronRightIcon className="w-5 h-5 text-primary" />
              }
            />
          </Link>
          <Link href="/category" asChild>
            <MenuItem
              label={t(i18n)`Categories`}
              icon={ShapesIcon}
              rightSection={
                <ChevronRightIcon className="w-5 h-5 text-primary" />
              }
            />
          </Link>
          <Link href="/magic-inbox" asChild disabled>
            <MenuItem
              label={t(i18n)`Magic inbox`}
              icon={InboxIcon}
              rightSection={
                <ChevronRightIcon className="w-5 h-5 text-primary" />
              }
            />
          </Link>
        </View>
      </View>
      <View className="gap-2">
        <Text className="font-sans mx-6 text-muted-foreground">
          {t(i18n)`App settings`}
        </Text>
        <View>
          <Link href="/appearance" asChild>
            <MenuItem
              label={t(i18n)`Appearance`}
              icon={SwatchBookIcon}
              rightSection={
                <ChevronRightIcon className="w-5 h-5 text-primary" />
              }
            />
          </Link>
          <Link href="/language" asChild>
            <MenuItem
              label={t(i18n)`Language`}
              icon={EarthIcon}
              rightSection={
                <View className="flex flex-row items-center gap-2">
                  <Text className="text-muted-foreground font-sans">
                    {t(i18n)`${language}`}
                  </Text>
                  <ChevronRightIcon className="w-5 h-5 text-primary" />
                </View>
              }
            />
          </Link>
          <Link href="/currency" asChild disabled>
            <MenuItem
              label={t(i18n)`Default currency`}
              icon={CurrencyIcon}
              rightSection={
                <View className="flex flex-row items-center gap-2">
                  <Text className="text-muted-foreground font-sans">
                    {/*  */}
                  </Text>
                  <ChevronRightIcon className="w-5 h-5 text-primary" />
                </View>
              }
            />
          </Link>
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
              <Switch checked={false} onCheckedChange={console.log} />
            }
          />
        </View>
      </View>
      <View className="gap-2">
        <Text className="font-sans mx-6 text-muted-foreground">
          {t(i18n)`Others`}
        </Text>
        <View>
          <Link href="/feedback" asChild disabled>
            <MenuItem
              label={t(i18n)`Send feedback`}
              icon={MessageSquareQuoteIcon}
              rightSection={
                <ChevronRightIcon className="w-5 h-5 text-primary" />
              }
            />
          </Link>
          <MenuItem
            label={t(i18n)`Rate 6pm on App Store`}
            icon={StarIcon}
            rightSection={<ChevronRightIcon className="w-5 h-5 text-primary" />}
            disabled
          />
          <MenuItem
            label={t(i18n)`Share with friends`}
            icon={Share2Icon}
            rightSection={<ChevronRightIcon className="w-5 h-5 text-primary" />}
            disabled
          />
          <MenuItem
            label={t(i18n)`Proudly open source`}
            icon={GithubIcon}
            rightSection={<ChevronRightIcon className="w-5 h-5 text-primary" />}
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
                  onPress: () => signOut(),
                },
              ])
            }
            className="justify-start gap-6 !px-6"
          >
            <LogOutIcon className="w-5 h-5 text-red-500" />
            <Text className="text-red-500 font-regular group-active:text-red-500">
              {t(i18n)`Sign out`}
            </Text>
          </Button>
        </View>
      </View>
      <View className="items-center gap-3">
        <Logo className="w-16 h-16 mx-auto" />
        <Text className="font-medium text-muted-foreground text-sm">
          {t(i18n)`ver.`}
          {Application.nativeApplicationVersion}
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
  )
}

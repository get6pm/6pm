import { toast } from '@/components/common/toast'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'
import { useUserEntitlements } from '@/hooks/use-purchases'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { getAppIcon, setAppIcon } from 'expo-dynamic-app-icon'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { CheckIcon, LockKeyholeIcon } from 'lucide-react-native'
import { useState } from 'react'
import { FlatList, Image, Pressable, View } from 'react-native'

const APP_ICONS = [
  {
    name: 'dark',
    source: require('../../assets/images/app-icons/dark.png'),
    pro: false,
  },
  {
    name: 'light',
    source: require('../../assets/images/app-icons/light.png'),
    pro: true,
  },
  {
    name: 'digital',
    source: require('../../assets/images/app-icons/digital.png'),
    pro: true,
  },
  {
    name: 'original',
    source: require('../../assets/images/app-icons/original.png'),
    pro: false,
  },
]

type AppIcon = (typeof APP_ICONS)[number]

export default function AppearanceScreen() {
  const [selected, setSelected] = useState<string>(getAppIcon() ?? 'dark')
  const { i18n } = useLingui()
  const { isPro } = useUserEntitlements()
  const router = useRouter()

  function renderDynamicIcon({ item }: { item: AppIcon }) {
    return (
      <Pressable
        onPress={() => {
          if (item.pro && !isPro) {
            router.push('/paywall')
            return
          }

          Haptics.selectionAsync()
          setAppIcon(item.name)
          setSelected(item.name)
          toast.success(t(i18n)`App icon updated!`)
        }}
        className="flex-1 flex-row items-center justify-center gap-4 bg-card px-6 py-2 active:bg-muted/50"
      >
        <View className="flex-1 flex-row items-center gap-4">
          <Image
            source={item.source}
            className="h-16 w-16 rounded-xl border border-border"
          />
          <Text className="text-center text-foreground capitalize">
            {item.name}
          </Text>
        </View>
        {selected === item.name ? (
          <CheckIcon className="size-6 text-amount-positive" />
        ) : item.pro && !isPro ? (
          <Badge variant="secondary" className="py-1.5">
            <LockKeyholeIcon className="size-4 text-primary" />
          </Badge>
        ) : null}
      </Pressable>
    )
  }

  return (
    <FlatList<AppIcon>
      data={APP_ICONS}
      keyExtractor={(i) => i.name}
      ListHeaderComponent={
        <View className="px-6">
          <Text className="mb-4 text-muted-foreground text-sm">
            {t(i18n)`Choose your preferred app icon`}
          </Text>
        </View>
      }
      className="bg-card"
      renderItem={renderDynamicIcon}
      contentContainerClassName="py-4"
    />
  )
}
